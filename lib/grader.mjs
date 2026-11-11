import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { SUBMISSIONS_DIR } from './paths.mjs';
import { HEALTH_CHECKS, submissionInfo, resultDir, readResult } from './catalog.mjs';
import { createHarness, scoreParts } from './harness.mjs';
import { staticServer, listen } from './static.mjs';

const PROBE = fs.readFileSync(new URL('./probe.js', import.meta.url), 'utf8');
const GRADER_VERSION = 1;

// Errors produced by the grader's own network blocking are reported by the
// self-contained check, so they shouldn't also count as console errors.
const NOISE = [/net::ERR_FAILED/, /net::ERR_BLOCKED/, /favicon\.ico/];

export async function launchBrowser({ headed = false } = {}) {
  const args = [
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
  ];
  try {
    return await chromium.launch({ channel: 'chrome', headless: !headed, args });
  } catch (e) {
    try {
      return await chromium.launch({ headless: !headed, args });
    } catch {
      throw new Error(
        `Could not launch Chrome (${e.message.split('\n')[0]}).\n` +
          'Install Google Chrome, or run: npx playwright install chromium',
      );
    }
  }
}

export function isStale(model, task) {
  const sub = submissionInfo(model, task.id);
  if (!sub) return false;
  const prev = readResult(model, task.id);
  return !prev || prev.submission?.hash !== sub.hash || prev.taskHash !== task.hash || prev.graderVersion !== GRADER_VERSION;
}

// Fresh context per check: isolated localStorage, clean instrumentation, and
// one broken check can't poison the next.
async function openPage(browser, origin, url, task, log, extra = {}) {
  const { viewport, ...rest } = extra;
  const context = await browser.newContext({
    viewport: viewport ?? task.meta.viewport,
    deviceScaleFactor: 1,
    colorScheme: 'light',
    acceptDownloads: true,
    permissions: ['clipboard-read', 'clipboard-write'],
    ...rest,
  });
  await context.addInitScript({ content: PROBE });
  await context.route('**/*', (route) => {
    const u = route.request().url();
    if (u.startsWith(origin)) return route.continue();
    log.external.add(u.slice(0, 160));
    return route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  page.setDefaultTimeout(4000);
  page.on('pageerror', (e) => log.pageErrors.add(String(e?.message ?? e).split('\n')[0].slice(0, 300)));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (!NOISE.some((re) => re.test(text))) log.consoleErrors.add(text.slice(0, 300));
  });
  page.on('dialog', (d) => {
    log.dialogs++;
    d.dismiss().catch(() => {});
  });
  return { context, page };
}

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function runCheck(browser, origin, url, task, check, log, outDir) {
  const started = Date.now();
  const { context, page } = await openPage(browser, origin, url, task, log, check.context);
  const t = createHarness({ page, context, url, task });
  let error = null;
  let score = 0;
  try {
    const t0 = Date.now();
    await t.load();
    log.loads.push(Date.now() - t0);
    const errorsBefore = log.pageErrors.size;
    const ret = await withTimeout(Promise.resolve(check.run(t)), check.timeout ?? 30000, `check "${check.id}"`);
    if (t.parts.length) score = scoreParts(t.parts);
    else if (typeof ret === 'number') score = Math.max(0, Math.min(1, ret));
    else if (ret && typeof ret === 'object') {
      score = ret.score ?? (ret.ok ? 1 : 0);
      if (ret.note) t.note(ret.note);
    } else score = ret === false ? 0 : 1;
    if (log.pageErrors.size > errorsBefore) t.note(`page threw: ${[...log.pageErrors].at(-1)}`);
  } catch (e) {
    error = String(e?.message ?? e).split('\n')[0].slice(0, 300);
    if (/goto|net::|Timeout .* exceeded.*navigat/i.test(error)) log.loadFailures++;
    score = t.parts.length ? scoreParts(t.parts) * 0.5 : 0;
  }
  let shot = null;
  if (score < 0.999) {
    try {
      fs.mkdirSync(path.join(outDir, 'checks'), { recursive: true });
      shot = `checks/${check.id}.png`;
      await page.screenshot({ path: path.join(outDir, shot), timeout: 5000 });
    } catch {
      shot = null;
    }
  }
  await context.close().catch(() => {});
  return {
    id: check.id,
    title: check.title,
    category: check.category,
    points: check.points,
    score: Math.round(score * 1000) / 1000,
    earned: Math.round(check.points * score * 100) / 100,
    parts: t.parts,
    notes: t.notes,
    error,
    shot,
    ms: Date.now() - started,
  };
}

// A blank page trivially has a clean console, so health points are gated on
// the submission actually working: full credit from 25% of core points up,
// scaled linearly below that.
function healthResults(log, checkCount, coreFraction) {
  const gate = Math.min(1, coreFraction / 0.25);
  const distinctErrors = log.pageErrors.size + log.consoleErrors.size;
  const loaded = checkCount - log.loadFailures;
  const medianLoad = [...log.loads].sort((a, b) => a - b)[Math.floor(log.loads.length / 2)] ?? null;
  const scores = {
    loads: log.loadFailures ? 0 : log.pageErrors.size ? 0.5 : 1,
    'console-clean': distinctErrors === 0 ? 1 : distinctErrors <= 2 ? 0.5 : 0,
    'self-contained': log.external.size === 0 ? 1 : 0,
  };
  const gateNote = gate < 1 ? [`scaled ×${gate.toFixed(2)}: only ${Math.round(coreFraction * 100)}% of core points earned`] : [];
  const notes = {
    loads: [`${loaded}/${checkCount} page loads succeeded`, medianLoad != null && `median load ${medianLoad} ms`, ...[...log.pageErrors].slice(0, 3).map((e) => `uncaught: ${e}`)].filter(Boolean),
    'console-clean': [...log.pageErrors, ...log.consoleErrors].slice(0, 5),
    'self-contained': [...log.external].slice(0, 5).map((u) => `blocked request: ${u}`),
  };
  return HEALTH_CHECKS.map((c) => ({
    ...c,
    score: scores[c.id] * gate,
    earned: Math.round(c.points * scores[c.id] * gate * 100) / 100,
    parts: [],
    notes: [...gateNote, ...notes[c.id]],
    error: null,
    shot: null,
    ms: 0,
  }));
}

async function recordShowcase(browser, origin, url, task, outDir) {
  const videoDir = path.join(outDir, '.video');
  fs.rmSync(videoDir, { recursive: true, force: true });
  const log = { pageErrors: new Set(), consoleErrors: new Set(), external: new Set(), dialogs: 0, loads: [], loadFailures: 0 };
  let opened;
  try {
    opened = await openPage(browser, origin, url, task, log, { recordVideo: { dir: videoDir, size: task.meta.viewport } });
  } catch (e) {
    // Video needs Playwright's ffmpeg (npx playwright install ffmpeg); screenshots don't.
    console.warn(`  (no video: ${String(e.message).split('\n')[0]})`);
    opened = await openPage(browser, origin, url, task, log);
  }
  const { context, page } = opened;
  const t = createHarness({ page, context, url, task });
  const shots = [];
  fs.mkdirSync(path.join(outDir, 'shots'), { recursive: true });
  t.shot = async (name) => {
    const rel = `shots/${String(shots.length + 1).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: path.join(outDir, rel) });
    shots.push(rel);
  };
  let error = null;
  try {
    await t.load();
    if (task.showcase) await withTimeout(Promise.resolve(task.showcase(t)), 60000, 'showcase');
    else {
      await t.sleep(2500);
      await t.shot('view');
    }
  } catch (e) {
    error = String(e?.message ?? e).split('\n')[0];
    if (!shots.length) await t.shot('view').catch(() => {});
  }
  const video = page.video();
  await context.close().catch(() => {});
  let videoRel = null;
  try {
    if (!video) throw new Error('no video');
    const src = await video.path();
    videoRel = 'showcase.webm';
    fs.renameSync(src, path.join(outDir, videoRel));
  } catch (e) {
    // A missing or mismatched ffmpeg can leave no file behind without throwing earlier.
    if (video) console.warn(`  (no video: ${String(e.message).split('\n')[0]})`);
    videoRel = null;
  }
  fs.rmSync(videoDir, { recursive: true, force: true });
  return { shots, video: videoRel, error };
}

export async function gradeSubmission({ browser, origin, model, task, onCheck = () => {} }) {
  const sub = submissionInfo(model, task.id);
  if (!sub) throw new Error(`No submission for ${model}/${task.id}`);
  const outDir = resultDir(model, task.id);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const url = `${origin}/${encodeURIComponent(model)}/${task.id}/index.html`;
  const log = { pageErrors: new Set(), consoleErrors: new Set(), external: new Set(), dialogs: 0, loads: [], loadFailures: 0 };
  const started = Date.now();
  const checks = [];
  for (const check of task.checks) {
    const r = await runCheck(browser, origin, url, task, check, log, outDir);
    checks.push(r);
    onCheck(r);
  }
  const coreFraction = checks.reduce((s, c) => s + c.earned, 0) / checks.reduce((s, c) => s + c.points, 0);
  for (const r of healthResults(log, task.checks.length, coreFraction)) {
    checks.push(r);
    onCheck(r);
  }
  const media = await recordShowcase(browser, origin, url, task, outDir);
  const earned = checks.reduce((s, c) => s + c.earned, 0);
  const possible = checks.reduce((s, c) => s + c.points, 0);
  const result = {
    model,
    task: task.id,
    graderVersion: GRADER_VERSION,
    taskHash: task.hash,
    submission: { bytes: sub.bytes, hash: sub.hash },
    gradedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    browser: browser.version(),
    score: Math.round((earned / possible) * 1000) / 10,
    earned: Math.round(earned * 100) / 100,
    possible,
    checks,
    dialogs: log.dialogs,
    media,
  };
  fs.writeFileSync(path.join(outDir, 'result.json'), JSON.stringify(result, null, 2));
  return result;
}

export async function startSubmissionServer(port = 0) {
  const server = staticServer(SUBMISSIONS_DIR);
  const p = await listen(server, port);
  return { server, origin: `http://127.0.0.1:${p}` };
}
