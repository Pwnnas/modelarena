import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { DASHBOARD_DIR, RESULTS_DIR, SUBMISSIONS_DIR } from './paths.mjs';
import { loadTasks, listModels, readAllResults, submissionInfo, HEALTH_CHECKS } from './catalog.mjs';
import { readVotes, writeVotes, leaderboard, WEIGHTS, MIN_VOTES_FOR_PREFERENCE } from './scoring.mjs';
import { serveFile, listen } from './static.mjs';

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 1e5) reject(new Error('body too large'));
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch (e) {
        reject(e);
      }
    });
  });
}

// Every submission gets its own origin, http://<label>.localhost:<port>/ (Chrome
// resolves *.localhost to loopback). Two pages shown side by side then can't
// clobber each other's localStorage, and none of them can reach the dashboard
// origin or its vote API.
const originLabel = (model, task) => 's' + crypto.createHash('sha1').update(`${model}/${task}`).digest('hex').slice(0, 12);

export async function serve({ port = 4173 } = {}) {
  const tasks = await loadTasks();
  const subPort = port + 1;
  const sub = http.createServer((req, res) => {
    const host = String(req.headers.host ?? '').split(':')[0].toLowerCase();
    const label = host.endsWith('.localhost') ? host.slice(0, -'.localhost'.length) : '';
    for (const m of listModels())
      for (const t of tasks)
        if (originLabel(m, t.id) === label && serveFile(path.join(SUBMISSIONS_DIR, m, t.id), req.url, req, res)) return;
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  });
  await listen(sub, subPort);
  const submissionUrl = (m, t) => `http://${originLabel(m, t)}.localhost:${subPort}/index.html`;

  const state = () => {
    const models = listModels();
    const results = readAllResults(models, tasks);
    const votes = readVotes();
    const available = Object.fromEntries(models.map((m) => [m, tasks.filter((t) => submissionInfo(m, t.id)).map((t) => t.id)]));
    return {
      urls: Object.fromEntries(models.map((m) => [m, Object.fromEntries(available[m].map((t) => [t, submissionUrl(m, t)]))])),
      weights: WEIGHTS,
      minVotes: MIN_VOTES_FOR_PREFERENCE,
      tasks: tasks.map((t) => ({
        id: t.id,
        ...t.meta,
        possible: t.possible,
        prompt: t.prompt,
        checks: [...t.checks, ...HEALTH_CHECKS].map(({ id, title, points, category }) => ({ id, title, points, category })),
      })),
      models,
      available,
      results,
      votes,
      board: leaderboard({ tasks, models, results, votes }),
    };
  };

  // Submissions on their *.localhost origins could still send a no-cors
  // text/plain POST here. Requiring JSON forces a CORS preflight (which this
  // server never answers), and the Origin check rejects anything else.
  const sameOrigin = (req) =>
    String(req.headers['content-type'] ?? '').startsWith('application/json') &&
    (!req.headers.origin || req.headers.origin === `http://${req.headers.host}`);

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    try {
      if (url.pathname.startsWith('/api/') && req.method === 'POST' && !sameOrigin(req)) return json(res, 403, { error: 'cross-origin request' });
      if (url.pathname === '/api/state' && req.method === 'GET') return json(res, 200, state());
      if (url.pathname === '/api/vote' && req.method === 'POST') {
        const v = await readBody(req);
        const models = listModels();
        if (!tasks.some((t) => t.id === v.task) || !models.includes(v.a) || !models.includes(v.b) || v.a === v.b || !['a', 'b', 'tie', 'bad'].includes(v.winner)) {
          return json(res, 400, { error: 'invalid vote' });
        }
        const votes = readVotes();
        votes.push({ task: v.task, a: v.a, b: v.b, winner: v.winner, at: new Date().toISOString() });
        writeVotes(votes);
        return json(res, 200, state());
      }
      if (url.pathname === '/api/vote/undo' && req.method === 'POST') {
        const votes = readVotes();
        votes.pop();
        writeVotes(votes);
        return json(res, 200, state());
      }
      if (url.pathname.startsWith('/results/')) {
        if (serveFile(RESULTS_DIR, url.pathname.slice('/results'.length), req, res)) return;
      } else if (serveFile(DASHBOARD_DIR, url.pathname === '/' ? '/index.html' : url.pathname, req, res)) return;
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
    } catch (e) {
      json(res, 500, { error: String(e.message ?? e) });
    }
  });
  const p = await listen(server, port);
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  return { url: `http://localhost:${p}` };
}
