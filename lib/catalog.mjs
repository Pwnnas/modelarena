// Discovers tasks (tasks/<id>/{task.mjs,PROMPT.md}), submissions
// (submissions/<model>/<task>/index.html) and stored results.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { TASKS_DIR, SUBMISSIONS_DIR, RESULTS_DIR, MODEL_NAME_RE } from './paths.mjs';

export const HEALTH_CHECKS = [
  { id: 'loads', title: 'Loads without uncaught exceptions', points: 3, category: 'health' },
  { id: 'console-clean', title: 'No console errors', points: 3, category: 'health' },
  { id: 'self-contained', title: 'No external network requests', points: 3, category: 'health' },
];

const sha1 = (buf) => crypto.createHash('sha1').update(buf).digest('hex');

const dirs = (p) =>
  fs.existsSync(p)
    ? fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_')).map((d) => d.name).sort()
    : [];

export async function loadTasks() {
  const tasks = [];
  for (const id of dirs(TASKS_DIR)) {
    const dir = path.join(TASKS_DIR, id);
    const modPath = path.join(dir, 'task.mjs');
    const promptPath = path.join(dir, 'PROMPT.md');
    if (!fs.existsSync(modPath) || !fs.existsSync(promptPath)) continue;
    const source = fs.readFileSync(modPath);
    const prompt = fs.readFileSync(promptPath, 'utf8');
    // The hash in the URL busts Node's module cache when a task file changes.
    const mod = await import(`${pathToFileURL(modPath).href}?v=${sha1(source).slice(0, 8)}`);
    const checks = mod.checks.map((c) => ({ category: 'core', ...c }));
    tasks.push({
      id,
      dir,
      meta: { viewport: { width: 1280, height: 800 }, ...mod.meta, id },
      checks,
      showcase: mod.showcase,
      prompt,
      hash: sha1(Buffer.concat([source, Buffer.from(prompt)])).slice(0, 12),
      possible: [...checks, ...HEALTH_CHECKS].reduce((s, c) => s + c.points, 0),
    });
  }
  const order = (t) => t.meta.order ?? 99;
  return tasks.sort((a, b) => order(a) - order(b) || a.id.localeCompare(b.id));
}

export function listModels() {
  return dirs(SUBMISSIONS_DIR).filter((m) => MODEL_NAME_RE.test(m));
}

export function submissionFile(model, taskId) {
  return path.join(SUBMISSIONS_DIR, model, taskId, 'index.html');
}

export function submissionInfo(model, taskId) {
  const file = submissionFile(model, taskId);
  if (!fs.existsSync(file)) return null;
  const buf = fs.readFileSync(file);
  return { file, bytes: buf.length, hash: sha1(buf).slice(0, 12) };
}

// Written by `arena.mjs run` next to the submission (or by hand for chat
// models): how long generation took and how many tokens it used.
export function runFile(model, taskId) {
  return path.join(SUBMISSIONS_DIR, model, taskId, 'run.json');
}

export function readRun(model, taskId) {
  try {
    return JSON.parse(fs.readFileSync(runFile(model, taskId), 'utf8'));
  } catch {
    return null;
  }
}

export function readAllRuns(models, tasks) {
  const out = {};
  for (const m of models) {
    out[m] = {};
    for (const t of tasks) {
      const r = readRun(m, t.id);
      if (r) out[m][t.id] = r;
    }
  }
  return out;
}

// Per-model totals over the tasks that have run data. Speed is total tokens
// over total generation time, so long tasks weigh more than short ones.
export function runTotals(runs) {
  const list = Object.values(runs ?? {});
  if (!list.length) return null;
  const sum = (k) => list.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const timed = list.filter((r) => r.genTokensPerSec > 0 && r.completionTokens > 0);
  const genSeconds = timed.reduce((s, r) => s + r.completionTokens / r.genTokensPerSec, 0);
  const genTokens = timed.reduce((s, r) => s + r.completionTokens, 0);
  return {
    tasks: list.length,
    wallMs: sum('wallMs'),
    completionTokens: sum('completionTokens'),
    reasoningTokens: sum('reasoningTokens'),
    genTokensPerSec: genSeconds ? Math.round((genTokens / genSeconds) * 10) / 10 : null,
    estimated: list.some((r) => r.tokensEstimated),
    truncated: list.filter((r) => r.finishReason === 'length').length,
  };
}

export function resultDir(model, taskId) {
  return path.join(RESULTS_DIR, model, taskId);
}

export function readResult(model, taskId) {
  const file = path.join(resultDir(model, taskId), 'result.json');
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

export function readAllResults(models, tasks) {
  const out = {};
  for (const m of models) {
    out[m] = {};
    for (const t of tasks) {
      const r = readResult(m, t.id);
      if (r) out[m][t.id] = r;
    }
  }
  return out;
}
