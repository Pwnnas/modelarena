// Web-triggered runs: lets the dashboard start `arena.mjs run` against a
// provider. If a .env holds OPENROUTER_API_KEY, OpenRouter models are offered;
// otherwise (or additionally) any OpenAI-compatible server can be targeted by
// base URL. Runs are spawned as child processes so all the CLI's retry, resume,
// extraction and grading logic is reused unchanged.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT, MODEL_NAME_RE } from './paths.mjs';
import { listApiModels, THINKING_LEVELS } from './runner.mjs';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

// Minimal .env reader (KEY=VALUE, optional quotes / `export`). No dependency.
export function loadEnv() {
  const env = {};
  try {
    for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
      const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      env[m[1]] = v;
    }
  } catch { /* no .env */ }
  return env;
}
const ENV = loadEnv();
const envKey = (k) => ENV[k] || process.env[k] || '';
export const openrouterKey = () => envKey('OPENROUTER_API_KEY');
export const hasOpenrouter = () => !!openrouterKey();
const customBase = () => envKey('ARENA_BASE_URL') || 'http://localhost:8080/v1';
const customKey = () => envKey('ARENA_API_KEY');

export function providers() {
  const list = [];
  if (hasOpenrouter()) list.push({ id: 'openrouter', label: 'OpenRouter (key from .env)', baseUrl: OPENROUTER_BASE });
  list.push({ id: 'custom', label: 'Local / custom server', baseUrl: customBase() });
  return list;
}

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').replace(/\r/g, '');

async function fetchJson(url, headers, timeoutMs = 15000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: ctl.signal });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 160)}`);
    return JSON.parse(text);
  } finally {
    clearTimeout(t);
  }
}

// Model catalogue for a provider. OpenRouter uses the .env key; a custom server
// is queried at its /models endpoint. The key is optional for a custom server:
// an explicit key wins, else .env ARENA_API_KEY, else no auth at all.
export async function listModels(provider, baseUrl, apiKey) {
  if (provider === 'openrouter') {
    if (!hasOpenrouter()) throw new Error('No OPENROUTER_API_KEY found in .env');
    const j = await fetchJson(`${OPENROUTER_BASE}/models`, { Authorization: `Bearer ${openrouterKey()}` });
    return (j.data ?? [])
      .map((m) => ({ id: m.id, name: m.name && m.name !== m.id ? `${m.id} — ${m.name}` : m.id }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }
  const url = (baseUrl || customBase()).trim();
  if (!/^https?:\/\//i.test(url)) throw new Error('Base URL must start with http:// or https://');
  const ids = await listApiModels(url, apiKey || customKey() || undefined);
  return ids.map((id) => ({ id, name: id }));
}

// ── Run lifecycle ──────────────────────────────────────────────────────────
const runs = new Map(); // model -> record
const MAX_CONCURRENT = 4;
const MAX_LINES = 300;

export function startRun(opts) {
  const { model, provider, baseUrl, apiModel, apiKey, thinking, task, maxTokens } = opts;
  if (!model || !MODEL_NAME_RE.test(model)) throw new Error('Model name must be folder-safe (letters, digits, . _ -)');
  const existing = runs.get(model);
  if (existing && existing.status === 'running') throw new Error(`${model} is already running`);
  const running = [...runs.values()].filter((r) => r.status === 'running').length;
  if (running >= MAX_CONCURRENT) throw new Error(`Already ${running} runs in progress (max ${MAX_CONCURRENT})`);
  if (!apiModel) throw new Error('Pick a model');
  if (thinking != null && thinking !== '' && !THINKING_LEVELS.includes(thinking)) throw new Error('Invalid thinking level');

  let base, key;
  if (provider === 'openrouter') {
    if (!hasOpenrouter()) throw new Error('No OPENROUTER_API_KEY found in .env');
    base = OPENROUTER_BASE; key = openrouterKey();
  } else {
    base = (baseUrl || customBase()).trim();
    if (!/^https?:\/\//i.test(base)) throw new Error('Base URL must start with http:// or https://');
    // Key is optional for a local server: empty means "try without auth".
    key = apiKey || customKey();
  }

  const args = [path.join(ROOT, 'arena.mjs'), 'run', model, '--base-url', base, '--api-model', apiModel, '--force', '--grade'];
  if (thinking) args.push('--thinking', thinking);
  if (task) args.push('--task', task);
  if (maxTokens) args.push('--max-tokens', String(maxTokens));

  const proc = spawn(process.execPath, args, {
    cwd: ROOT,
    env: { ...process.env, ARENA_BASE_URL: base, ARENA_API_KEY: key },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const rec = {
    model, proc, status: 'running', exitCode: null, lines: [],
    startedAt: Date.now(), endedAt: null,
    opts: { provider, apiModel, thinking: thinking || null, task: task || null, baseUrl: base },
  };
  runs.set(model, rec);
  const push = (chunk) => {
    for (const l of stripAnsi(chunk.toString()).split('\n')) {
      if (!l.trim()) continue;
      rec.lines.push(l);
      if (rec.lines.length > MAX_LINES) rec.lines.shift();
    }
  };
  proc.stdout.on('data', push);
  proc.stderr.on('data', push);
  proc.on('exit', (code) => { rec.exitCode = code; rec.status = code === 0 ? 'done' : 'error'; rec.endedAt = Date.now(); });
  proc.on('error', (e) => { rec.status = 'error'; rec.endedAt = Date.now(); rec.lines.push(String(e.message ?? e)); });
  return { model, status: rec.status };
}

export function stopRun(model) {
  const rec = runs.get(model);
  if (!rec || rec.status !== 'running') return false;
  rec.status = 'stopped';
  rec.endedAt = Date.now();
  rec.proc?.kill('SIGINT');
  return true;
}

const summary = (r) => ({
  model: r.model, status: r.status, exitCode: r.exitCode,
  startedAt: r.startedAt, endedAt: r.endedAt, opts: r.opts,
  lines: r.lines.slice(-60),
});
export function runStatus(model) { const r = runs.get(model); return r ? summary(r) : null; }
export function allRuns() { return [...runs.values()].sort((a, b) => b.startedAt - a.startedAt).map(summary); }