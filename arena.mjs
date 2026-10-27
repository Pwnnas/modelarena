#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { parseArgs } from 'node:util';
import { SUBMISSIONS_DIR, MODEL_NAME_RE } from './lib/paths.mjs';
import { loadTasks, listModels, readAllResults, submissionFile } from './lib/catalog.mjs';
import { launchBrowser, startSubmissionServer, gradeSubmission, isStale } from './lib/grader.mjs';
import { leaderboard, readVotes } from './lib/scoring.mjs';
import { serve } from './lib/server.mjs';

const HELP = `Model Arena: visual tasks, automated grading and blind pairwise judging.

Usage: node arena.mjs <command> [options]

  tasks                      List tasks and their point totals
  prompt <task>              Print a task prompt (pipe to pbcopy to paste it into a chat)
  new <model> [--out DIR]    Create a workspace with one folder + PROMPT.md per task
                             (default DIR: submissions/<model>)
  import <model> <DIR>       Copy DIR/<task>/index.html into submissions/<model>/
  grade [--model M] [--task T] [--force] [--headed]
                             Grade new or changed submissions, then print the standings
  board                      Print the standings
  serve [--port 4173] [--no-open]
                             Dashboard: standings, results, videos and blind judging
`;

const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
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
    fs.mkdirSync(path.join(dir, t.id), { recursive: true });
    fs.writeFileSync(path.join(dir, t.id, 'PROMPT.md'), t.prompt);
  }
  console.log(`Created ${tasks.length} task folders in ${dir}`);
  console.log(dim(`Give the model one PROMPT.md at a time; it must write index.html next to it.`));
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
  const short = tasks.map((t) => t.id.slice(0, 8));
  console.log();
  console.log(dim(`${'#'.padStart(2)}  ${'model'.padEnd(26)} ${'arena'.padStart(6)} ${'auto'.padStart(6)} ${'elo'.padStart(6)}  ${short.map((s) => s.padStart(8)).join(' ')}`));
  for (const r of rows) {
    const cells = tasks.map((t) => {
      const s = r.scores[t.id];
      return color(s)((s == null ? '—' : s.toFixed(0)).padStart(8));
    });
    const elo = r.record.games ? String(r.elo) : '—';
    console.log(`${String(r.rank).padStart(2)}  ${r.model.padEnd(26)} ${bold(r.arena.toFixed(1).padStart(6))} ${r.auto.toFixed(1).padStart(6)} ${elo.padStart(6)}  ${cells.join(' ')}`);
  }
  console.log();
}

async function cmdGrade(opts) {
  const tasks = (await loadTasks()).filter((t) => !opts.task || t.id === opts.task);
  if (opts.task && !tasks.length) fail(`Unknown task "${opts.task}"`);
  const models = listModels().filter((m) => !opts.model || m === opts.model);
  if (opts.model && !models.length) fail(`No submissions folder for "${opts.model}"`);
  const jobs = [];
  for (const m of models) for (const t of tasks) if (fs.existsSync(submissionFile(m, t.id)) && (opts.force || isStale(m, t))) jobs.push([m, t]);
  if (!jobs.length) {
    console.log(dim('Nothing new to grade (use --force to re-grade).'));
    return printBoard(await loadTasks(), listModels());
  }
  const { server, origin } = await startSubmissionServer();
  const browser = await launchBrowser({ headed: opts.headed });
  const cleanup = async () => {
    await browser.close().catch(() => {});
    server.close();
  };
  process.once('SIGINT', async () => {
    await cleanup();
    process.exit(130);
  });
  try {
    for (const [model, task] of jobs) {
      console.log(`\n${bold(model)} / ${bold(task.id)}`);
      const r = await gradeSubmission({
        browser,
        origin,
        model,
        task,
        onCheck: (c) => {
          const mark = c.score >= 0.999 ? '\x1b[32m✓\x1b[0m' : c.score > 0 ? '\x1b[33m◐\x1b[0m' : '\x1b[31m✗\x1b[0m';
          const why = c.error ?? c.parts.filter((p) => p.score < 1).map((p) => `${p.label}${p.note ? `: ${p.note}` : ''}`)[0] ?? c.notes[0] ?? '';
          console.log(`  ${mark} ${c.title.padEnd(52)} ${`${c.earned}/${c.points}`.padStart(7)}  ${dim(why.slice(0, 90))}`);
        },
      });
      console.log(`  ${bold(`${r.score} / 100`)}  ${dim(`(${(r.durationMs / 1000).toFixed(0)} s)`)}`);
    }
  } finally {
    await cleanup();
  }
  printBoard(await loadTasks(), listModels());
}

async function cmdServe(opts) {
  const { url } = await serve({ port: Number(opts.port ?? 4173) });
  console.log(`Arena dashboard: ${bold(url)}`);
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
    headed: { type: 'boolean' },
    'no-open': { type: 'boolean' },
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
else if (cmd === 'grade') await cmdGrade(values);
else if (cmd === 'board') printBoard(await loadTasks(), listModels());
else if (cmd === 'serve') await cmdServe(values);
else fail(`Unknown command "${cmd}"\n\n${HELP}`);
