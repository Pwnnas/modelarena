import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webm': 'video/webm',
  '.md': 'text/plain; charset=utf-8', // shown in the browser rather than downloaded
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
};

// Serve files under `root`, refusing anything that resolves outside it.
// Supports Range requests so <video> can seek through showcase recordings.
export function serveFile(root, urlPath, req, res) {
  let rel;
  try {
    rel = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    res.writeHead(400).end();
    return true;
  }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(root, '.' + rel);
  if (file !== root && !file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return true;
  }
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    return false;
  }
  if (stat.isDirectory()) return serveFile(root, rel.replace(/\/?$/, '/'), req, res);
  const type = TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  const headers = { 'Content-Type': type, 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { ...headers, 'Content-Length': stat.size });
    if (req.method === 'HEAD') res.end();
    else fs.createReadStream(file).pipe(res);
  }
  return true;
}

export function staticServer(root) {
  return http.createServer((req, res) => {
    if (req.url === '/favicon.ico') return res.writeHead(204).end();
    if (!serveFile(root, req.url, req, res)) res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  });
}

export function listen(server, port = 0, host = '127.0.0.1') {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve(server.address().port));
  });
}
