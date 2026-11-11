#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { parseArgs } from 'node:util';
import { SUBMISSIONS_DIR, MODEL_NAME_RE, SUITE } from './lib/paths.mjs';
import { loadTasks, listModels, readAllResults, readAllRuns, runTotals, submissionFile, runFile, resultDir, workspaceFiles } from './lib/catalog.mjs';
import { launchBrowser, startSubmissionServer, gradeSubmission, isStale } from './lib/grader.mjs';
import { leaderboard, readVotes } from './lib/scoring.mjs';
import { serve } from './lib/server.mjs';
import { runPrompt, extractHtml, listApiModels, isRetryable, THINKING_LEVELS } from './lib/runner.mjs';

const HELP = `Model Arena: visual tasks, automated grading and blind pairwise judging.

Usage: node arena.mjs <command> [options]

  tasks                      List tasks and their point totals
  prompt <task>              Print a task prompt (pipe to pbcopy to paste it into a chat)
  new <model> [--out DIR]    Create a workspace with one folder + PROMPT.md per task,
                             including any workspace data files for tool-use tasks
                             (default DIR: submissions/<model>)
  import <model> <DIR>       Copy DIR/<task>/index.html into submissions/<model>/
  run <model> [--base-url URL] [--api-model ID] [--task T] [--resume | --force] [--grade]
              [--thinking off|low|medium|high] [--retries N]
              [--temperature N] [--top-p N] [--seed N] [--max-tokens N] [--extra JSON]
                             Send each prompt to an OpenAI-compatible server (llama-server,
                             Ollama, LM Studio, vLLM), save the page and record time and tokens
                             (default URL: $ARENA_BASE_URL or http://localhost:8080/v1;
                             API key from $ARENA_API_KEY if the server needs one)
  grade [--model M] [--task T] [--force] [--headed] [--concurrency N]
                             Grade new or changed submissions, then print the standings.
                             --concurrency N (or -c N) runs N grading jobs in parallel
                             (default 1); useful when your machine/provider can handle it.
  board                      Print the standings
  serve [--port 4173] [--no-open]
                             Dashboard: standings, results, videos and blind judging

  --v2                       Any command on the second suite, kept apart under v2/
                             (its own tasks, submissions, results and votes; serve
                             defaults to port 4174 so both dashboards can run at once)
`;

const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const num = (n) => Math.round(n).toLocaleString('en-US');
const kTok = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : String(Math.round(n)));
function dur(ms) {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${(ms / 1000).toFixed(1)} s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(s / 3600)}h ${String(Math.floor(s / 60) % 60).padStart(2, '0')}m`;
}
const color = (score) => (score == null ? dim : score >= 80 ? (s) => `\x1b[32m${s}\x1b[0m` : score >= 50 ? (s) => `\x1b[33m${s}\x1b[0m` : (s) => `\x1b[31m${s}\x1b[0m`);

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

async function cmdTasks() {
  const tasks = await loadTasks();
  for (const t of tasks) {
    console.log(`${bold(t.id.padEnd(18))} ${t.meta.title} (${t.meta.subtitle})  ${dim(`${t.checks.length} checks, ${t.possible} pts`)}`);
    console.log(`  ${dim(t.meta.summary)}`);
  }
}

async function cmdPrompt(id) {
  const task = (await loadTasks()).find((t) => t.id === id);
  if (!task) fail(`Unknown task "${id}". Run: node arena.mjs tasks`);
  process.stdout.write(task.prompt);
}

function checkModelName(model) {
  if (!model || !MODEL_NAME_RE.test(model)) fail(`Model name must match ${MODEL_NAME_RE} (e.g. qwen3-32b-q4)`);
}

async function cmdNew(model, out) {
  checkModelName(model);
  const tasks = await loadTasks();
  const dir = path.resolve(out ?? path.join(SUBMISSIONS_DIR, model));
  for (const t of tasks) {
    const taskDir = path.join(dir, t.id);
    fs.mkdirSync(taskDir, { recursive: true });
    fs.writeFileSync(path.join(taskDir, 'PROMPT.md'), t.prompt);
    // Tool-use tasks ship data files the agent must read, decode or verify.
    for (const f of workspaceFiles(t.dir)) {
      const dest = path.join(taskDir, f.rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(f.abs, dest);
    }
  }
  console.log(`Created ${tasks.length} task folders in ${dir}`);
  console.log(dim(`Give the model one PROMPT.md at a time; it must write index.html next to it.`));
  console.log(dim(`Tasks with a workspace folder include data files the model should read with its tools.`));
  if (out) console.log(dim(`When done: node arena.mjs import ${model} ${dir}`));
}

async function cmdImport(model, from) {
  checkModelName(model);
  if (!from) fail('Usage: node arena.mjs import <model> <DIR>');
  const tasks = await loadTasks();
  let n = 0;
  for (const t of tasks) {
    const src = path.resolve(from, t.id, 'index.html');
    if (!fs.existsSync(src)) continue;
    const dest = submissionFile(model, t.id);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    n++;
  }
  console.log(`Imported ${n} submission(s) for ${model}`);
}

function printBoard(tasks, models) {
  const results = readAllResults(models, tasks);
  const rows = leaderboard({ tasks, models, results, votes: readVotes() });
  if (!rows.length) return console.log('No submissions yet. Put files at submissions/<model>/<task>/index.html');
  const runs = readAllRuns(models, tasks);
  const totals = Object.fromEntries(models.map((m) => [m, runTotals(runs[m])]));
  const anyRuns = models.some((m) => totals[m]);
  const runHead = anyRuns ? `  ${'time'.padStart(8)} ${'tokens'.padStart(7)} ${'tok/s'.padStart(6)}` : '';
  const short = tasks.map((t) => t.id.slice(0, 8));
  const v2 = (n) => (n == null ? '—' : n.toFixed(1));
  console.log();
  console.log(dim(`${'#'.padStart(2)}  ${'model'.padEnd(26)} ${'arena'.padStart(6)} ${'auto'.padStart(6)} ${'arena2'.padStart(6)} ${'auto2'.padStart(6)} ${'elo'.padStart(6)}  ${short.map((s) => s.padStart(8)).join(' ')}${runHead}`));
  for (const r of rows) {
    const cells = tasks.map((t) => {
      const s = r.scores[t.id];
      return color(s)((s == null ? '—' : s.toFixed(0)).padStart(8));
    });
    const elo = r.record.games ? String(r.elo) : '—';
    const tot = totals[r.model];
    const runCells = !anyRuns ? '' : tot
      ? `  ${dur(tot.wallMs).padStart(8)} ${`${tot.estimated ? '~' : ''}${kTok(tot.completionTokens)}`.padStart(7)} ${(tot.genTokensPerSec?.toFixed(1) ?? '—').padStart(6)}`
      : dim(`  ${'—'.padStart(8)} ${'—'.padStart(7)} ${'—'.padStart(6)}`);
    console.log(`${String(r.rank).padStart(2)}  ${r.model.padEnd(26)} ${bold(r.arena.toFixed(1).padStart(6))} ${r.auto.toFixed(1).padStart(6)} ${v2(r.arena2).padStart(6)} ${v2(r.auto2).padStart(6)} ${elo.padStart(6)}  ${cells.join(' ')}${runCells}`);
  }
  if (tasks.some((t) => t.meta.suite === 'v2')) {
    console.log(dim('  arena/auto = original suite · arena2/auto2 = incl. v2 tasks (— until every v2 task is graded)'));
  }
  if (anyRuns) console.log(dim('\ntime and tokens: totals over the tasks run with `arena.mjs run` (~ = estimated from the stream)'));
  console.log();
}

async function cmdRun(model, opts) {
  checkModelName(model);
  const thinking = opts.thinking;
  if (thinking != null && !THINKING_LEVELS.includes(thinking)) fail(`--thinking must be one of ${THINKING_LEVELS.join(', ')}`);
  const retries = Number(opts.retries ?? 5);
  if (!Number.isInteger(retries) || retries < 0) fail('--retries must be a whole number');
  const tasks = (await loadTasks()).filter((t) => !opts.task || t.id === opts.task);
  if (opts.task && !tasks.length) fail(`Unknown task "${opts.task}"`);
  const baseUrl = opts['base-url'] ?? process.env.ARENA_BASE_URL ?? 'http://localhost:8080/v1';
  const apiKey = opts['api-key'] ?? process.env.ARENA_API_KEY;
  let apiModel = opts['api-model'];
  if (!apiModel) {
    let ids;
    try {
      ids = await listApiModels(baseUrl, apiKey);
    } catch (e) {
      fail(`Could not reach ${baseUrl}: ${e.message}\nStart your server or pass --base-url (e.g. http://homeserver:11434/v1 for Ollama).`);
    }
    if (ids.length !== 1) fail(`${baseUrl} serves ${ids.length} models; pick one with --api-model:\n  ${ids.join('\n  ')}`);
    apiModel = ids[0];
  }
  const params = {};
  for (const [flag, key] of [['temperature', 'temperature'], ['top-p', 'top_p'], ['seed', 'seed'], ['max-tokens', 'max_tokens']]) {
    if (opts[flag] == null) continue;
    const n = Number(opts[flag]);
    if (!Number.isFinite(n)) fail(`--${flag} must be a number`);
    params[key] = n;
  }
  let extra = {};
  if (opts.extra) {
    try {
      extra = JSON.parse(opts.extra);
    } catch (e) {
      fail(`--extra must be JSON: ${e.message}`);
    }
  }
  if (opts.force && opts.resume) fail('Pick one: --resume continues a run, --force starts it over');
  const done = tasks.filter((t) => fs.existsSync(submissionFile(model, t.id)));
  // Never guess between continuing and redoing: either can be what you meant,
  // and redoing throws away hours of generation.
  if (done.length && !opts.force && !opts.resume)
    fail(
      `${model} already has ${done.length} of ${tasks.length} task(s): ${done.map((t) => t.id).join(', ')}\n` +
        `  --resume  continue with the rest\n  --force   run every task again, replacing those pages`
    );
  const todo = opts.force ? tasks : tasks.filter((t) => !done.includes(t));
  if (!todo.length) return console.log(dim('Every task already has a submission (use --force to run them again).'));
  // Pages are only written once complete, so a run stopped part-way picks up
  // at the task it was on.
  if (opts.resume && done.length) console.log(dim(`Resuming: ${done.length} of ${tasks.length} task(s) already done, starting at ${todo[0].id}`));
  console.log(`Running ${todo.length} task(s) for ${bold(model)} on ${apiModel} at ${baseUrl}${thinking ? `, thinking ${thinking}` : ''}`);

  const tty = process.stderr.isTTY;
  for (const task of todo) {
    console.log(`\n${bold(model)} / ${bold(task.id)}`);
    let lastLog = 0;
    const onProgress = ({ phase, chunks, chars, elapsedMs, firstAt }) => {
      // llama-server sends a token per chunk; cloud providers often batch
      // several, so fall back to ~3.8 characters per token when that's higher.
      const tokens = Math.max(chunks, Math.round(chars / 3.8));
      const rate = elapsedMs > firstAt + 500 ? tokens / ((elapsedMs - firstAt) / 1000) : 0;
      const line = `  ${phase}… ~${num(tokens)} tokens · ${rate ? rate.toFixed(1) : '…'} tok/s · ${dur(elapsedMs)}`;
      if (tty) process.stderr.write(`\r\x1b[2K${dim(line)}`);
      else if (elapsedMs - lastLog > 30000) {
        lastLog = elapsedMs;
        console.log(dim(line));
      }
    };
    const dir = path.dirname(submissionFile(model, task.id));
    let out;
    for (let attempt = 0; ; attempt++) {
      try {
        out = await runPrompt({ baseUrl, apiKey, apiModel, prompt: task.prompt, params, thinking, extra, onProgress });
        break;
      } catch (e) {
        if (tty) process.stderr.write('\r\x1b[2K');
        if (attempt < retries && isRetryable(e)) {
          const wait = Math.min(10 * 2 ** attempt, 120);
          console.log(`  \x1b[33m↻\x1b[0m ${e.message.slice(0, 160)} ${dim(`(try ${attempt + 2} of ${retries + 1} in ${wait} s)`)}`);
          await new Promise((r) => setTimeout(r, wait * 1000));
          continue;
        }
        console.log(`  \x1b[31m✗\x1b[0m ${e.message}`);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'error.txt'), `${new Date().toISOString()} after ${attempt + 1} attempt(s)\n${e.stack ?? e.message}\n`);
        break;
      }
    }
    if (!out) continue;
    if (tty) process.stderr.write('\r\x1b[2K');
    fs.mkdirSync(dir, { recursive: true });
    fs.rmSync(path.join(dir, 'error.txt'), { force: true });
    fs.writeFileSync(path.join(dir, 'reply.md'), out.reply);
    // Drop an earlier run's thinking when this one had none (e.g. --thinking off).
    if (out.reasoning) fs.writeFileSync(path.join(dir, 'thinking.md'), out.reasoning);
    else fs.rmSync(path.join(dir, 'thinking.md'), { force: true });
    const { html, how } = extractHtml(out.reply);
    const m = { ...out.metrics, extracted: how, htmlBytes: html ? Buffer.byteLength(html) : 0 };
    fs.writeFileSync(runFile(model, task.id), JSON.stringify(m, null, 2));
    if (html) fs.writeFileSync(submissionFile(model, task.id), html);
    else {
      // A reply without a page is a failed attempt: drop any earlier page and its grade.
      fs.rmSync(submissionFile(model, task.id), { force: true });
      fs.rmSync(resultDir(model, task.id), { recursive: true, force: true });
    }

    const think = m.reasoningTokens ? ` (${num(m.reasoningTokens)} thinking)` : '';
    const speed = m.genTokensPerSec ? ` · ${m.genTokensPerSec} tok/s` : '';
    const mark = !html ? '\x1b[31m✗\x1b[0m' : m.finishReason === 'length' ? '\x1b[33m◐\x1b[0m' : '\x1b[32m✓\x1b[0m';
    console.log(`  ${mark} ${m.tokensEstimated ? '~' : ''}${num(m.completionTokens)} tokens${think} in ${dur(m.wallMs)}${speed} · first token ${dur(m.ttftMs)}${m.provider ? ` · via ${m.provider}` : ''}`);
    if (m.finishReason === 'length') console.log(`    \x1b[33mcut off at the token limit\x1b[0m: raise --max-tokens or the server's context size (e.g. llama-server -c)`);
    if (thinking === 'off' && m.reasoningTokens) console.log(`    \x1b[33mthe server ignored --thinking off\x1b[0m: it still used ${num(m.reasoningTokens)} thinking tokens`);
    if (m.reasoningHidden) console.log(dim(`    the provider counted ${num(m.reasoningTokens)} thinking tokens but didn't send the text; speed is timed from the request`));
    if (!html) console.log(`    no HTML found in the reply; see ${path.relative(process.cwd(), path.join(dir, 'reply.md'))}`);
    else console.log(dim(`    ${(m.htmlBytes / 1024).toFixed(0)} KB index.html (${how})`));
    // Grade each page as soon as it exists, so a stopped run keeps its scores.
    if (opts.grade && html) await cmdGrade({ model, task: task.id, board: false });
  }
  // Also catches pages a stopped run generated but never graded.
  if (opts.grade) await cmdGrade({ model, quiet: true });
  else console.log(dim(`\nNext: npm run grade -- --model ${model}`));
}

async function cmdGrade(opts) {
  const tasks = (await loadTasks()).filter((t) => !opts.task || t.id === opts.task);
  if (opts.task && !tasks.length) fail(`Unknown task "${opts.task}"`);
  const models = listModels().filter((m) => !opts.model || m === opts.model);
  if (opts.model && !models.length) fail(`No submissions folder for "${opts.model}"`);
  const jobs = [];
  for (const m of models) for (const t of tasks) if (fs.existsSync(submissionFile(m, t.id)) && (opts.force || isStale(m, t))) jobs.push([m, t]);
  const board = opts.board === false ? () => {} : async () => printBoard(await loadTasks(), listModels());
  if (!jobs.length) {
    if (!opts.quiet) console.log(dim('Nothing new to grade (use --force to re-grade).'));
    return board();
  }
  const { server, origin } = await startSubmissionServer();
  const browser = await launchBrowser({ headed: opts.headed });
  const cleanup = async () => {
    await browser.close().catch(() => {});
    server.close();
  };
  const onInterrupt = async () => {
    await cleanup();
    process.exit(130);
  };
  // `run --grade` calls this once per task; remove the handler each time so
  // they don't pile up.
  process.once('SIGINT', onInterrupt);
  // Run up to `concurrency` grading jobs at once. Each job drives its own browser
  // contexts and writes its own results dir, so they don't interfere. Frame-rate
  // checks in the core tasks are load-sensitive, hence the warning.
  const concurrency = Math.max(1, Math.floor(Number(opts.concurrency ?? 1)) || 1);
  if (concurrency > 1) {
    console.log(dim(`Grading ${jobs.length} job(s), ${concurrency} at a time. Frame-rate checks can drift under parallel load — use --concurrency 1 for timing-sensitive comparisons.`));
  }
  const runJob = async (model, task) => {
    const tag = `${model}/${task.id}`;
    const prefix = concurrency > 1 ? dim(`[${tag}] `) : '';
    if (concurrency === 1) console.log(`\n${bold(model)} / ${bold(task.id)}`);
    else console.log(`${prefix}${bold('grading…')}`);
    const r = await gradeSubmission({
      browser,
      origin,
      model,
      task,
      onCheck: (c) => {
        const mark = c.score >= 0.999 ? '\x1b[32m✓\x1b[0m' : c.score > 0 ? '\x1b[33m◐\x1b[0m' : '\x1b[31m✗\x1b[0m';
        const why = c.error ?? c.parts.filter((p) => p.score < 1).map((p) => `${p.label}${p.note ? `: ${p.note}` : ''}`)[0] ?? c.notes[0] ?? '';
        console.log(`${prefix}  ${mark} ${c.title.padEnd(52)} ${`${c.earned}/${c.points}`.padStart(7)}  ${dim(why.slice(0, 90))}`);
      },
    });
    console.log(`${prefix}  ${bold(`${r.score} / 100`)}  ${dim(`(${(r.durationMs / 1000).toFixed(0)} s)`)}`);
  };
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const [model, task] = jobs[next++];
      await runJob(model, task);
    }
  };
  try {
    await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
  } finally {
    process.off('SIGINT', onInterrupt);
    await cleanup();
  }
  await board();
}

async function cmdServe(opts) {
  const { url } = await serve({ port: Number(opts.port ?? (SUITE === 'v2' ? 4174 : 4173)) });
  console.log(`Arena dashboard${SUITE === 'v2' ? ' (v2)' : ''}: ${bold(url)}`);
  console.log(dim('Ctrl+C to stop'));
  if (!opts['no-open']) {
    const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
    execFile(opener, [url], () => {});
  }
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    model: { type: 'string' },
    task: { type: 'string' },
    out: { type: 'string' },
    port: { type: 'string' },
    force: { type: 'boolean' },
    resume: { type: 'boolean' },
    headed: { type: 'boolean' },
    concurrency: { type: 'string', short: 'c' },
    'no-open': { type: 'boolean' },
    v2: { type: 'boolean' }, // read in lib/paths.mjs
    grade: { type: 'boolean' },
    'base-url': { type: 'string' },
    'api-model': { type: 'string' },
    'api-key': { type: 'string' },
    temperature: { type: 'string' },
    'top-p': { type: 'string' },
    seed: { type: 'string' },
    'max-tokens': { type: 'string' },
    thinking: { type: 'string' },
    retries: { type: 'string' },
    extra: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
});

const [cmd, a1, a2] = positionals;
if (values.help || !cmd) {
  console.log(HELP);
} else if (cmd === 'tasks') await cmdTasks();
else if (cmd === 'prompt') await cmdPrompt(a1);
else if (cmd === 'new') await cmdNew(a1, values.out);
else if (cmd === 'import') await cmdImport(a1, a2);
else if (cmd === 'run') await cmdRun(a1, values);
else if (cmd === 'grade') await cmdGrade(values);
else if (cmd === 'board') printBoard(await loadTasks(), listModels());
else if (cmd === 'serve') await cmdServe(values);
else fail(`Unknown command "${cmd}"\n\n${HELP}`);
