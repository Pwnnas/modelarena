```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Gridcalc</title>
<style>
*{box-sizing:border-box}
:root{
  --accent:#1a73e8;
  --accent-soft:#e8f0fe;
  --accent-hl:#d3e3fd;
  --grid:#e2e3e6;
  --hdr:#f8f9fa;
  --hdr-line:#dadce0;
  --hdr-text:#5f6368;
  --text:#202124;
  --err:#b3261e;
  --err-bg:#fdf0ee;
  --font:"Segoe UI",system-ui,-apple-system,Roboto,"Helvetica Neue",Arial,sans-serif;
}
html,body{height:100%;margin:0}
body{
  font-family:var(--font);font-size:13px;color:var(--text);background:#fff;
  display:flex;flex-direction:column;overflow:hidden;
}
header.top{
  height:46px;display:flex;align-items:center;gap:10px;padding:0 14px;
  border-bottom:1px solid var(--grid);background:#fff;flex:none;
}
.logo{
  width:26px;height:26px;border-radius:6px;
  background:linear-gradient(135deg,#34a853,#137333);
  display:grid;place-items:center;color:#fff;font-weight:700;font-size:14px;
  box-shadow:0 1px 2px rgba(0,0,0,.2);
}
.title{font-size:15px;font-weight:600;letter-spacing:.1px}
.hint{margin-left:auto;color:var(--hdr-text);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hint kbd{
  font-family:var(--font);font-size:11px;background:var(--hdr);border:1px solid var(--hdr-line);
  border-bottom-width:2px;border-radius:4px;padding:0 4px;color:var(--text);
}
.fxbar{
  height:38px;display:flex;align-items:center;border-bottom:1px solid var(--grid);
  background:#fff;flex:none;
}
#name-box{
  width:90px;height:100%;display:flex;align-items:center;justify-content:center;
  border-right:1px solid var(--grid);font-weight:600;color:var(--hdr-text);
  font-variant-numeric:tabular-nums;flex:none;
}
.fx-label{
  width:44px;text-align:center;font-style:italic;color:var(--hdr-text);
  font-family:Georgia,"Times New Roman",serif;font-size:15px;flex:none;
}
#formula-bar{
  flex:1;height:28px;border:1px solid var(--hdr-line);border-radius:4px;padding:0 9px;
  font:inherit;font-size:13px;outline:none;margin-right:10px;background:#fff;min-width:0;
  transition:box-shadow .12s,border-color .12s;
}
#formula-bar:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}

#grid-wrap{
  flex:1;overflow:auto;position:relative;background:#fff;min-height:0;
  scroll-padding:24px 0 0 48px;
}
#grid{
  border-collapse:separate;border-spacing:0;table-layout:fixed;width:2648px;
  font-variant-numeric:tabular-nums;
}
#grid th{
  position:sticky;top:0;z-index:2;height:24px;background:var(--hdr);color:var(--hdr-text);
  font-weight:500;font-size:12px;text-align:center;padding:0;
  border-right:1px solid var(--hdr-line);border-bottom:1px solid var(--hdr-line);
  user-select:none;cursor:pointer;transition:background .08s;
}
#grid th.rowh{position:sticky;left:0;top:auto;z-index:1;border-right:1px solid var(--hdr-line)}
#grid thead th.corner{left:0;z-index:3;cursor:default}
#grid th.hl{background:var(--accent-hl);color:#0b57d0;font-weight:600}
#grid td{
  height:24px;padding:0 6px;border-right:1px solid var(--grid);border-bottom:1px solid var(--grid);
  position:relative;white-space:nowrap;cursor:cell;background:#fff;vertical-align:middle;
  font-size:13px;
}
#grid td .v{
  display:block;overflow:hidden;text-overflow:ellipsis;line-height:23px;
}
#grid td.num .v{text-align:right}
#grid td.bool .v{text-align:center}
#grid td.txt .v{text-align:left}
#grid td.err{color:var(--err);background:var(--err-bg)}
#grid td.err .v{font-weight:600}
#grid td.sel{box-shadow:inset 0 0 0 2px var(--accent);z-index:1}
#grid td.editing{box-shadow:inset 0 0 0 1px var(--accent);z-index:4}
#grid td.editing .v{visibility:hidden}
#grid td input.ed{
  position:absolute;left:0;top:0;width:100%;height:100%;margin:0;
  border:2px solid var(--accent);border-radius:0;padding:0 5px;font:inherit;font-size:13px;
  outline:none;background:#fff;z-index:5;box-shadow:0 3px 10px rgba(0,0,0,.18);color:var(--text);
  min-width:0;
}
/* reference highlight colours while editing a formula */
#grid td.rk0{--c:#1a73e8;background:rgba(26,115,232,.09)}
#grid td.rk1{--c:#d93025;background:rgba(217,48,37,.08)}
#grid td.rk2{--c:#188038;background:rgba(24,128,56,.09)}
#grid td.rk3{--c:#9334e6;background:rgba(147,52,230,.08)}
#grid td.rk4{--c:#e37400;background:rgba(227,116,0,.09)}
#grid td.rk5{--c:#00897b;background:rgba(0,137,123,.09)}
#grid td[class*="rk"]{outline:2px solid var(--c);outline-offset:-2px}
#grid td[class*="rk"].sel{box-shadow:inset 0 0 0 2px var(--accent)}

.status{
  height:30px;flex:none;display:flex;align-items:center;justify-content:space-between;
  padding:0 12px;border-top:1px solid var(--grid);background:var(--hdr);
  color:var(--hdr-text);font-size:12px;
}
.sheet-tab{
  display:flex;align-items:center;gap:6px;background:#fff;border:1px solid var(--hdr-line);
  border-bottom:none;border-radius:6px 6px 0 0;padding:3px 12px;color:var(--text);font-weight:500;
  height:24px;margin-top:6px;
}
.status-right{display:flex;gap:14px;align-items:center}
</style>
</head>
<body>
<header class="top">
  <div class="logo">G</div>
  <div class="title">Gridcalc</div>
  <div class="hint">
    Type to edit &middot; <kbd>F2</kbd> edit &middot; <kbd>Enter</kbd> commit &middot; <kbd>Tab</kbd> next &middot; <kbd>Ctrl</kbd>+<kbd>C</kbd>/<kbd>V</kbd> copy &amp; paste
  </div>
</header>
<div class="fxbar">
  <div id="name-box">A1</div>
  <div class="fx-label">fx</div>
  <input id="formula-bar" type="text" spellcheck="false" autocomplete="off" aria-label="Formula bar">
</div>
<div id="grid-wrap">
  <table id="grid"></table>
</div>
<footer class="status">
  <div class="sheet-tab">Sheet1</div>
  <div class="status-right">
    <span id="status-msg">Ready</span>
    <span id="status-info"></span>
  </div>
</footer>

<script>
(() => {
'use strict';

/* ===================== constants & helpers ===================== */
const COLS = 26, ROWS = 100, N = COLS * ROWS, KEY = 'gridcalc.v1';
const ERR_TEXT = {
  '#DIV/0!': 'Division by zero',
  '#VALUE!': 'Wrong type of value (text used in arithmetic)',
  '#REF!': 'Reference outside A1:Z100',
  '#ERROR!': 'Formula cannot be parsed or uses an unknown function',
  '#CYCLE!': 'Circular reference'
};
const FUNCS = Object.assign(Object.create(null), {
  SUM: [1, 255], AVERAGE: [1, 255], MIN: [1, 255], MAX: [1, 255], COUNT: [1, 255],
  IF: [2, 3], ABS: [1, 1], ROUND: [1, 2]
});

class XE { constructor(code) { this.code = code; } }

const colLetter = c => String.fromCharCode(65 + c);
const addr = i => colLetter(i % COLS) + (Math.floor(i / COLS) + 1);
function colIdx(L) {
  let n = 0;
  for (const ch of L.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}
function parseAddr(s) {
  const m = /^([A-Za-z]{1,3})(\d+)$/.exec(s);
  if (!m) return -1;
  const c = colIdx(m[1]), r = parseInt(m[2], 10) - 1;
  return (c >= 0 && c < COLS && r >= 0 && r < ROWS) ? r * COLS + c : -1;
}
function fmtNum(n) {
  if (n === 0) return '0';
  const r = Number(n.toPrecision(10));
  if (!isFinite(r)) return '#NUM!';
  return String(r);
}
function display(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return fmtNum(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (v instanceof XE) return v.code;
  return String(v);
}
const NUM_RE = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
function parseLiteral(s) {
  const t = s.trim();
  if (NUM_RE.test(t)) return Number(t);
  if (/^(TRUE|FALSE)$/i.test(t)) return t.toUpperCase() === 'TRUE';
  return s;
}

/* ===================== tokenizer / parser ===================== */
const REF_RE = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)$/;

function tokenize(s) {
  const out = [];
  let i = 0;
  const n = s.length;
  while (i < n) {
    const ch = s[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') { i++; continue; }
    if (ch === '"') {
      let j = i + 1, str = '';
      for (;;) {
        if (j >= n) throw new SyntaxError('unterminated string');
        if (s[j] === '"') {
          if (s[j + 1] === '"') { str += '"'; j += 2; continue; }
          break;
        }
        str += s[j]; j++;
      }
      out.push({ t: 'str', v: str });
      i = j + 1;
      continue;
    }
    const rest = s.slice(i);
    let m;
    if ((m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(rest))) {
      out.push({ t: 'num', v: parseFloat(m[0]) });
      i += m[0].length;
      continue;
    }
    if ((m = /^(\$?[A-Za-z]{1,3}\$?\d+(?![A-Za-z0-9_.(])|[A-Za-z_][A-Za-z0-9_.]*)/.exec(rest))) {
      const w = m[0];
      i += w.length;
      if (s[i] === '(') { out.push({ t: 'func', v: w.toUpperCase() }); continue; }
      if (/^(TRUE|FALSE)$/i.test(w)) { out.push({ t: 'bool', v: w.toUpperCase() === 'TRUE' }); continue; }
      const rm = REF_RE.exec(w);
      if (rm) {
        const c = colIdx(rm[2]), r = parseInt(rm[4], 10) - 1;
        out.push({ t: 'ref', c, r, ok: c >= 0 && c < COLS && r >= 0 && r < ROWS });
        continue;
      }
      throw new SyntaxError('unknown name ' + w);
    }
    const two = s.substr(i, 2);
    if (two === '<>' || two === '<=' || two === '>=') { out.push({ t: 'op', v: two }); i += 2; continue; }
    if ('+-*/^&=<>(),:'.indexOf(ch) >= 0) { out.push({ t: 'op', v: ch }); i++; continue; }
    throw new SyntaxError('bad char ' + ch);
  }
  return out;
}

function parseFormula(text) {
  const toks = tokenize(text.slice(1));
  let p = 0;
  const refs = new Set();
  const isOp = v => toks[p] && toks[p].t === 'op' && toks[p].v === v;
  const expectOp = v => { if (!isOp(v)) throw new SyntaxError('expected ' + v); p++; };
  const CMP = ['=', '<>', '<', '>', '<=', '>='];

  function cellNode(t) {
    if (!t.ok) return { t: 'ref', bad: true };
    const idx = t.r * COLS + t.c;
    refs.add(idx);
    return { t: 'ref', idx };
  }
  function makeRange(a, b) {
    if (!a.ok || !b.ok) return { t: 'range', bad: true, cells: [] };
    const r1 = Math.min(a.r, b.r), r2 = Math.max(a.r, b.r);
    const c1 = Math.min(a.c, b.c), c2 = Math.max(a.c, b.c);
    const cells = [];
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
      const idx = r * COLS + c; cells.push(idx); refs.add(idx);
    }
    return { t: 'range', bad: false, cells };
  }
  function parseExpr() { return parseCmp(); }
  function parseCmp() {
    let l = parseConcat();
    while (toks[p] && toks[p].t === 'op' && CMP.indexOf(toks[p].v) >= 0) {
      const op = toks[p++].v;
      l = { t: 'bin', op, a: l, b: parseConcat() };
    }
    return l;
  }
  function parseConcat() {
    let l = parseAdd();
    while (isOp('&')) { p++; l = { t: 'bin', op: '&', a: l, b: parseAdd() }; }
    return l;
  }
  function parseAdd() {
    let l = parseMul();
    while (isOp('+') || isOp('-')) { const op = toks[p++].v; l = { t: 'bin', op, a: l, b: parseMul() }; }
    return l;
  }
  function parseMul() {
    let l = parseUnary();
    while (isOp('*') || isOp('/')) { const op = toks[p++].v; l = { t: 'bin', op, a: l, b: parseUnary() }; }
    return l;
  }
  function parseUnary() {
    if (isOp('-') || isOp('+')) { const op = toks[p++].v; return { t: 'un', op, a: parseUnary() }; }
    return parsePow();
  }
  function parsePow() {
    const b = parsePrimary();
    if (isOp('^')) { p++; return { t: 'bin', op: '^', a: b, b: parseUnary() }; }
    return b;
  }
  function parsePrimary() {
    const t = toks[p];
    if (!t) throw new SyntaxError('unexpected end');
    if (t.t === 'num' || t.t === 'str' || t.t === 'bool') { p++; return { t: 'lit', v: t.v }; }
    if (t.t === 'ref') {
      p++;
      if (isOp(':')) {
        const t2 = toks[p + 1];
        if (t2 && t2.t === 'ref') { p += 2; return makeRange(t, t2); }
        throw new SyntaxError('bad range');
      }
      return cellNode(t);
    }
    if (t.t === 'func') {
      p++;
      if (!FUNCS[t.v]) throw new SyntaxError('unknown function ' + t.v);
      expectOp('(');
      const args = [];
      if (!isOp(')')) {
        args.push(parseExpr());
        while (isOp(',')) { p++; args.push(parseExpr()); }
      }
      expectOp(')');
      const [mn, mx] = FUNCS[t.v];
      if (args.length < mn || args.length > mx) throw new SyntaxError('arity');
      return { t: 'call', name: t.v, args };
    }
    if (isOp('(')) { p++; const e = parseExpr(); expectOp(')'); return e; }
    throw new SyntaxError('unexpected token');
  }

  const ast = parseExpr();
  if (p !== toks.length) throw new SyntaxError('trailing tokens');
  return { ast, refs };
}

/* ===================== evaluation ===================== */
function num(v) {
  if (v instanceof XE) return v;
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return new XE('#VALUE!');
}
function txt(v) {
  if (v instanceof XE) return v;
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return fmtNum(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  return v;
}
function compare(op, a, b) {
  if (a instanceof XE) return a;
  if (b instanceof XE) return b;
  if (a === null || a === undefined) a = typeof b === 'string' ? '' : (typeof b === 'boolean' ? false : 0);
  if (b === null || b === undefined) b = typeof a === 'string' ? '' : (typeof a === 'boolean' ? false : 0);
  const rank = v => typeof v === 'boolean' ? 2 : typeof v === 'string' ? 1 : 0;
  const ra = rank(a), rb = rank(b);
  let c;
  if (ra !== rb) c = ra - rb;
  else if (ra === 1) {
    const x = a.toLowerCase(), y = b.toLowerCase();
    c = x < y ? -1 : x > y ? 1 : 0;
  } else {
    c = a === b ? 0 : (a < b ? -1 : 1);
  }
  switch (op) {
    case '=': return c === 0;
    case '<>': return c !== 0;
    case '<': return c < 0;
    case '>': return c > 0;
    case '<=': return c <= 0;
    case '>=': return c >= 0;
  }
  return new XE('#ERROR!');
}

let val = new Array(N).fill(null);

function evalBin(n) {
  const op = n.op;
  const a = evalNode(n.a), b = evalNode(n.b);
  if (op === '&') {
    const x = txt(a); if (x instanceof XE) return x;
    const y = txt(b); if (y instanceof XE) return y;
    return x + y;
  }
  if (op === '=' || op === '<>' || op === '<' || op === '>' || op === '<=' || op === '>=') {
    return compare(op, a, b);
  }
  const x = num(a); if (x instanceof XE) return x;
  const y = num(b); if (y instanceof XE) return y;
  switch (op) {
    case '+': return x + y;
    case '-': return x - y;
    case '*': return x * y;
    case '/': if (y === 0) return new XE('#DIV/0!'); return x / y;
    case '^': {
      if (x === 0 && y < 0) return new XE('#DIV/0!');
      const r = Math.pow(x, y);
      if (!isFinite(r)) return new XE('#VALUE!');
      return r;
    }
  }
  return new XE('#ERROR!');
}

// collects numeric values from args; returns XE on error or array of numbers
function collect(args, countMode) {
  const nums = [];
  for (const a of args) {
    if (a.t === 'range') {
      if (a.bad) return new XE('#REF!');
      for (const idx of a.cells) {
        const v = val[idx];
        if (v instanceof XE) { if (countMode) continue; return v; }
        if (typeof v === 'number') nums.push(v);
      }
    } else {
      const v = evalNode(a);
      if (v instanceof XE) { if (countMode) continue; return v; }
      if (typeof v === 'number') nums.push(v);
      else if (typeof v === 'boolean') nums.push(v ? 1 : 0);
      else if (typeof v === 'string') { if (!countMode) return new XE('#VALUE!'); }
    }
  }
  return nums;
}

function evalCall(n) {
  const A = n.args;
  switch (n.name) {
    case 'SUM': case 'AVERAGE': case 'MIN': case 'MAX': case 'COUNT': {
      const r = collect(A, n.name === 'COUNT');
      if (r instanceof XE) return r;
      if (n.name === 'COUNT') return r.length;
      if (n.name === 'SUM') { let s = 0; for (const x of r) s += x; return s; }
      if (n.name === 'AVERAGE') {
        if (r.length === 0) return new XE('#DIV/0!');
        let s = 0; for (const x of r) s += x; return s / r.length;
      }
      if (r.length === 0) return 0;
      let m = r[0];
      if (n.name === 'MIN') { for (const x of r) if (x < m) m = x; }
      else { for (const x of r) if (x > m) m = x; }
      return m;
    }
    case 'IF': {
      const c = evalNode(A[0]);
      if (c instanceof XE) return c;
      let t;
      if (c === null || c === undefined) t = false;
      else if (typeof c === 'boolean') t = c;
      else if (typeof c === 'number') t = c !== 0;
      else return new XE('#VALUE!');
      if (t) return evalNode(A[1]);
      return A.length > 2 ? evalNode(A[2]) : false;
    }
    case 'ABS': {
      const x = num(evalNode(A[0]));
      if (x instanceof XE) return x;
      return Math.abs(x);
    }
    case 'ROUND': {
      const x = num(evalNode(A[0]));
      if (x instanceof XE) return x;
      const d = A.length > 1 ? num(evalNode(A[1])) : 0;
      if (d instanceof XE) return d;
      const p = Math.pow(10, Math.trunc(d));
      const y = parseFloat((Math.abs(x) * p).toPrecision(15));
      const sign = x < 0 ? -1 : 1;
      return sign * Math.round(y) / p;
    }
  }
  return new XE('#ERROR!');
}

function evalNode(n) {
  switch (n.t) {
    case 'lit': return n.v;
    case 'ref':
      if (n.bad) return new XE('#REF!');
      return val[n.idx];
    case 'range':
      return n.bad ? new XE('#REF!') : new XE('#VALUE!');
    case 'un': {
      const x = num(evalNode(n.a));
      if (x instanceof XE) return x;
      return n.op === '-' ? -x : x;
    }
    case 'bin': return evalBin(n);
    case 'call': return evalCall(n);
  }
  return new XE('#ERROR!');
}

/* ===================== sheet model ===================== */
const raw = new Array(N).fill('');
const ast = new Array(N).fill(null);
const perr = new Uint8Array(N);
const prec = Array.from({ length: N }, () => new Set());
const dep = Array.from({ length: N }, () => new Set());

let tds = [], colHeaders = [], rowHeaders = [];
let cur = 0;
let ed = null;          // active cell editor {i, input}
let clip = null;        // internal clipboard {raw, i}

const grid = document.getElementById('grid');
const wrap = document.getElementById('grid-wrap');
const fb = document.getElementById('formula-bar');
const nameBox = document.getElementById('name-box');
const statusMsg = document.getElementById('status-msg');
const statusInfo = document.getElementById('status-info');

function evalCell(i) {
  const s = raw[i];
  if (s === '') return null;
  if (s[0] !== '=') return parseLiteral(s);
  if (perr[i] || !ast[i]) return new XE('#ERROR!');
  const r = evalNode(ast[i]);
  return (r === undefined) ? null : r;
}

function renderCell(i) {
  const td = tds[i], v = val[i];
  const span = td.firstChild;
  const text = display(v);
  if (span.textContent !== text) span.textContent = text;
  td.classList.toggle('err', v instanceof XE);
  td.classList.toggle('num', typeof v === 'number');
  td.classList.toggle('bool', typeof v === 'boolean');
  td.classList.toggle('txt', typeof v === 'string');
  if (v instanceof XE) td.title = v.code + ': ' + (ERR_TEXT[v.code] || '');
  else td.removeAttribute('title');
}

function recalc(starts) {
  const aff = new Set();
  const q = [];
  for (const s of starts) if (!aff.has(s)) { aff.add(s); q.push(s); }
  for (let k = 0; k < q.length; k++) {
    for (const v of dep[q[k]]) if (!aff.has(v)) { aff.add(v); q.push(v); }
  }
  const indeg = new Map();
  for (const u of aff) indeg.set(u, 0);
  for (const u of aff) for (const v of dep[u]) if (aff.has(v)) indeg.set(v, indeg.get(v) + 1);
  const ready = [];
  for (const u of aff) if (indeg.get(u) === 0) ready.push(u);
  const order = [];
  for (let k = 0; k < ready.length; k++) {
    const u = ready[k];
    order.push(u);
    for (const v of dep[u]) {
      if (aff.has(v)) {
        const d = indeg.get(v) - 1;
        indeg.set(v, d);
        if (d === 0) ready.push(v);
      }
    }
  }
  if (order.length < aff.size) {
    // every node left over is part of a cycle or depends on one
    const done = new Set(order);
    for (const u of aff) if (!done.has(u)) val[u] = new XE('#CYCLE!');
  }
  for (const u of order) val[u] = evalCell(u);
  for (const u of aff) renderCell(u);
}

function parseInto(i) {
  for (const p of prec[i]) dep[p].delete(i);
  prec[i] = new Set();
  ast[i] = null;
  perr[i] = 0;
  const s = raw[i];
  if (s[0] === '=') {
    try {
      const pr = parseFormula(s);
      ast[i] = pr.ast;
      for (const r of pr.refs) { prec[i].add(r); dep[r].add(i); }
    } catch (e) {
      perr[i] = 1;
    }
  }
}

function setRaw(i, text) {
  raw[i] = text;
  parseInto(i);
  recalc([i]);
  save();
}

/* ===================== persistence ===================== */
function save() {
  const o = {};
  let count = 0;
  for (let i = 0; i < N; i++) if (raw[i] !== '') { o[addr(i)] = raw[i]; count++; }
  try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* storage unavailable */ }
  statusInfo.textContent = count + ' filled cell' + (count === 1 ? '' : 's');
}
function load() {
  let o = {};
  try { o = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { o = {}; }
  for (const k in o) {
    const i = parseAddr(k);
    if (i >= 0 && typeof o[k] === 'string') raw[i] = o[k];
  }
}

/* ===================== DOM construction ===================== */
function buildGrid() {
  let h = '<colgroup><col style="width:48px">';
  for (let c = 0; c < COLS; c++) h += '<col style="width:100px">';
  h += '</colgroup><thead><tr><th class="corner"></th>';
  for (let c = 0; c < COLS; c++) h += '<th class="colh" data-c="' + c + '">' + colLetter(c) + '</th>';
  h += '</tr></thead><tbody>';
  for (let r = 0; r < ROWS; r++) {
    h += '<tr><th class="rowh" data-r="' + r + '">' + (r + 1) + '</th>';
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      h += '<td data-cell="' + addr(i) + '" data-i="' + i + '"><span class="v"></span></td>';
    }
    h += '</tr>';
  }
  h += '</tbody>';
  grid.innerHTML = h;
  tds = Array.from(grid.querySelectorAll('td[data-cell]'));
  colHeaders = Array.from(grid.querySelectorAll('th.colh'));
  rowHeaders = Array.from(grid.querySelectorAll('th.rowh'));
}

/* ===================== selection ===================== */
function setSel(i) {
  const oldR = Math.floor(cur / COLS), oldC = cur % COLS;
  const o = tds[cur];
  o.classList.remove('sel');
  o.removeAttribute('aria-selected');
  rowHeaders[oldR].classList.remove('hl');
  colHeaders[oldC].classList.remove('hl');

  cur = i;
  const r = Math.floor(i / COLS), c = i % COLS;
  const td = tds[i];
  td.classList.add('sel');
  td.setAttribute('aria-selected', 'true');
  rowHeaders[r].classList.add('hl');
  colHeaders[c].classList.add('hl');
  nameBox.textContent = addr(i);
  if (document.activeElement !== fb) fb.value = raw[i];
  ensureVisible(td);
}

function ensureVisible(td) {
  const HDR_H = 24, HDR_W = 48;
  const gr = grid.getBoundingClientRect();
  const tr = td.getBoundingClientRect();
  const t = tr.top - gr.top, b = t + tr.height;
  const l = tr.left - gr.left, rr = l + tr.width;
  if (t - HDR_H < wrap.scrollTop) wrap.scrollTop = Math.max(0, t - HDR_H);
  else if (b > wrap.scrollTop + wrap.clientHeight) wrap.scrollTop = b - wrap.clientHeight;
  if (l - HDR_W < wrap.scrollLeft) wrap.scrollLeft = Math.max(0, l - HDR_W);
  else if (rr > wrap.scrollLeft + wrap.clientWidth) wrap.scrollLeft = rr - wrap.clientWidth;
}

function move(dr, dc) {
  const r = Math.min(ROWS - 1, Math.max(0, Math.floor(cur / COLS) + dr));
  const c = Math.min(COLS - 1, Math.max(0, (cur % COLS) + dc));
  setSel(r * COLS + c);
}

/* ===================== reference highlighting ===================== */
let hlTds = [];
function clearRefHl() {
  for (const td of hlTds) {
    for (let k = 0; k < 6; k++) td.classList.remove('rk' + k);
  }
  hlTds = [];
}
function highlightRefs(text) {
  clearRefHl();
  if (!text || text[0] !== '=') return;
  let toks;
  try { toks = tokenize(text.slice(1)); } catch (e) { return; }
  let k = 0;
  for (let p = 0; p < toks.length; p++) {
    const t = toks[p];
    if (t.t !== 'ref') continue;
    let c1 = t.c, r1 = t.r, c2 = t.c, r2 = t.r, ok = t.ok;
    const nx = toks[p + 1], nx2 = toks[p + 2];
    if (nx && nx.t === 'op' && nx.v === ':' && nx2 && nx2.t === 'ref') {
      c2 = nx2.c; r2 = nx2.r; ok = ok && nx2.ok; p += 2;
    }
    if (ok) {
      const ra = Math.min(r1, r2), rb = Math.max(r1, r2), ca = Math.min(c1, c2), cb = Math.max(c1, c2);
      for (let r = ra; r <= rb; r++) for (let c = ca; c <= cb; c++) {
        const td = tds[r * COLS + c];
        td.classList.add('rk' + (k % 6));
        hlTds.push(td);
      }
    }
    k++;
  }
}

/* ===================== cell editing ===================== */
function startEdit(i, initial) {
  if (ed) return;
  if (i !== cur) setSel(i);
  const td = tds[i];
  const input = document.createElement('input');
  input.className = 'ed';
  input.type = 'text';
  input.spellcheck = false;
  input.autocomplete = 'off';
  input.value = initial;
  td.classList.add('editing');
  td.appendChild(input);
  ed = { i, input };
  input.addEventListener('input', () => {
    fb.value = input.value;
    highlightRefs(input.value);
  });
  input.addEventListener('keydown', onEdKey);
  input.focus({ preventScroll: true });
  input.setSelectionRange(input.value.length, input.value.length);
  fb.value = input.value;
  highlightRefs(input.value);
  setStatus('Editing ' + addr(i));
}

function onEdKey(e) {
  if (!ed) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    commitEdit();
    move(e.shiftKey ? -1 : 1, 0);
  } else if (e.key === 'Tab') {
    e.preventDefault();
    commitEdit();
    move(0, e.shiftKey ? -1 : 1);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    cancelEdit();
  }
}

function commitEdit() {
  if (!ed) return;
  const i = ed.i, input = ed.input;
  const text = input.value;
  ed = null;
  input.remove();
  tds[i].classList.remove('editing');
  clearRefHl();
  if (text !== raw[i]) setRaw(i, text);
  if (i === cur && document.activeElement !== fb) fb.value = raw[i];
  setStatus('Ready');
}

function cancelEdit() {
  if (!ed) return;
  const i = ed.i, input = ed.input;
  ed = null;
  input.remove();
  tds[i].classList.remove('editing');
  clearRefHl();
  if (i === cur && document.activeElement !== fb) fb.value = raw[i];
  setStatus('Ready');
}

function setStatus(msg) { statusMsg.textContent = msg; }

/* ===================== copy & paste ===================== */
function shiftFormula(f, dr, dc) {
  const parts = f.split(/("(?:[^"]|"")*")/);
  for (let k = 0; k < parts.length; k += 2) {
    parts[k] = parts[k].replace(
      /(^|[^A-Za-z0-9_.$"])(\$?)([A-Za-z]{1,3})(\$?)(\d+)(?![A-Za-z0-9_.(])/g,
      (m, pre, da, col, db, row) => {
        let c = colIdx(col), r = parseInt(row, 10) - 1;
        if (!da) c += dc;
        if (!db) r += dr;
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return pre + 'A0';
        return pre + (da ? '$' : '') + colLetter(c) + (db ? '$' : '') + (r + 1);
      });
  }
  return parts.join('');
}

function copyCell() {
  clip = { raw: raw[cur], i: cur };
  setStatus('Copied ' + addr(cur));
}
function pasteCell() {
  if (!clip) { setStatus('Clipboard is empty'); return; }
  const dr = Math.floor(cur / COLS) - Math.floor(clip.i / COLS);
  const dc = (cur % COLS) - (clip.i % COLS);
  const text = clip.raw[0] === '=' ? shiftFormula(clip.raw, dr, dc) : clip.raw;
  setRaw(cur, text);
  fb.value = raw[cur];
  setStatus('Pasted into ' + addr(cur));
}

/* ===================== events ===================== */
function bindEvents() {
  grid.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    const t = e.target;
    if (ed && t === ed.input) return;
    if (document.activeElement === fb) fb.blur();
    if (ed) commitEdit();
    const td = t.closest ? t.closest('td[data-cell]') : null;
    if (td) { setSel(+td.dataset.i); return; }
    const th = t.closest ? t.closest('th') : null;
    if (th) {
      if (th.classList.contains('colh')) setSel(+th.dataset.c);
      else if (th.classList.contains('rowh')) setSel(+th.dataset.r * COLS);
    }
  });

  grid.addEventListener('dblclick', e => {
    if (ed) return;
    const td = e.target.closest ? e.target.closest('td[data-cell]') : null;
    if (!td) return;
    const i = +td.dataset.i;
    setSel(i);
    startEdit(i, raw[i]);
  });

  document.addEventListener('keydown', e => {
    if (ed) return;
    const tg = e.target;
    if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA')) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod) {
      const k = e.key.toLowerCase();
      if (k === 'c') { e.preventDefault(); copyCell(); }
      else if (k === 'v') { e.preventDefault(); pasteCell(); }
      return;
    }
    if (e.altKey) return;
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); move(-1, 0); return;
      case 'ArrowDown': e.preventDefault(); move(1, 0); return;
      case 'ArrowLeft': e.preventDefault(); move(0, -1); return;
      case 'ArrowRight': e.preventDefault(); move(0, 1); return;
      case 'Enter': e.preventDefault(); move(e.shiftKey ? -1 : 1, 0); return;
      case 'Tab': e.preventDefault(); move(0, e.shiftKey ? -1 : 1); return;
      case 'F2': e.preventDefault(); startEdit(cur, raw[cur]); return;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        if (raw[cur] !== '') setRaw(cur, '');
        fb.value = '';
        return;
    }
    if (e.key.length === 1) {
      e.preventDefault();
      startEdit(cur, e.key);
    }
  });

  fb.addEventListener('focus', () => { if (ed) commitEdit(); });
  fb.addEventListener('input', () => highlightRefs(fb.value));
  fb.addEventListener('blur', () => clearRefHl());
  fb.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const i = cur;
      const text = fb.value;
      fb.blur();
      if (text !== raw[i]) setRaw(i, text);
      fb.value = raw[i];
      move(1, 0);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      fb.value = raw[cur];
      fb.blur();
    }
  });
}

/* ===================== init ===================== */
function init() {
  buildGrid();
  load();
  for (let i = 0; i < N; i++) parseInto(i);
  const all = new Array(N);
  for (let i = 0; i < N; i++) all[i] = i;
  recalc(all);
  bindEvents();
  setSel(0);
  save();
  setStatus('Ready');
}

init();
})();
</script>
</body>
</html>
```