```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vectorly</title>
<style>
:root{
  --bg:#eef0f4;--panel:#ffffff;--line:#e1e5ec;--text:#1d2230;--muted:#6b7385;
  --accent:#4f6bf6;--accent-dark:#3d59e6;--accent-soft:#e6ebff;--hover:#f1f3f7;--press:#e4e8f0;
}
*{box-sizing:border-box}
html,body{margin:0;height:100%;overflow:hidden}
body{font:13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--text);background:var(--bg);user-select:none;-webkit-user-select:none}
#app{display:grid;height:100vh;grid-template-areas:"top top top" "rail stage panel" "status status status";grid-template-rows:48px minmax(0,1fr) 26px;grid-template-columns:60px minmax(0,1fr) 256px}
header.top{grid-area:top;display:flex;align-items:center;gap:6px;padding:0 10px;background:var(--panel);border-bottom:1px solid var(--line);min-width:0}
.brand{display:flex;align-items:center;gap:8px;font-weight:650;letter-spacing:.2px;padding-right:10px;margin-right:4px;white-space:nowrap}
.logo{width:20px;height:20px;border-radius:6px;background:linear-gradient(135deg,#4f6bf6,#b16bff)}
.grp{display:flex;align-items:center;gap:2px;padding:0 8px;border-left:1px solid var(--line);height:28px}
.grp:first-of-type{border-left:0}
.spacer{flex:1}
.btn{width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:7px;background:transparent;color:#424a5c;cursor:pointer;padding:0;font:inherit;font-size:16px;flex:none}
.btn:hover{background:var(--hover);color:var(--text)}
.btn:active{background:var(--press)}
.btn:disabled{opacity:.35;cursor:default;background:transparent;color:#424a5c}
.btn.active{background:var(--accent-soft);color:var(--accent)}
.btn svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.btn.primary{width:auto;padding:0 14px;background:var(--accent);color:#fff;font-weight:600;margin-left:6px}
.btn.primary:hover{background:var(--accent-dark);color:#fff}
.btn.primary:active{background:#334fd6}
.zoomlabel{min-width:60px;height:28px;border:0;background:transparent;border-radius:6px;cursor:pointer;font:inherit;color:var(--text);font-variant-numeric:tabular-nums;padding:0 6px}
.zoomlabel:hover{background:var(--hover)}
nav.rail{grid-area:rail;background:var(--panel);border-right:1px solid var(--line);display:flex;flex-direction:column;align-items:center;gap:6px;padding-top:10px}
nav.rail .btn{width:42px;height:42px;border-radius:10px}
nav.rail .btn svg{width:21px;height:21px}
nav.rail .sep{width:28px;height:1px;background:var(--line);margin:4px 0}
main#canvas-wrap{grid-area:stage;position:relative;overflow:hidden;background:#f5f6f9;min-width:0;min-height:0}
#stage{position:absolute;left:0;top:0;width:100%;height:100%;display:block;touch-action:none;cursor:default}
#overlay *{pointer-events:none}
#overlay [data-handle]{pointer-events:all}
aside.panel{grid-area:panel;background:var(--panel);border-left:1px solid var(--line);padding:14px;overflow:auto}
.sec{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);font-weight:650;margin:18px 0 8px}
.sec:first-of-type{margin-top:0}
.note{color:var(--muted);font-size:12px;margin:0 0 6px;min-height:16px}
fieldset{border:0;margin:0;padding:0;min-width:0}
fieldset:disabled{opacity:.55}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.kv{display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--muted)}
input[type=number]{width:100%;height:30px;border:1px solid var(--line);border-radius:7px;padding:0 8px;font:inherit;background:#fff;color:var(--text);font-variant-numeric:tabular-nums;min-width:0}
input[type=number]:disabled{background:#f6f7f9;color:#9aa1ad}
input:focus-visible{outline:2px solid var(--accent-soft);outline-offset:0;border-color:var(--accent)}
input[type=color]{width:38px;height:30px;padding:2px;border:1px solid var(--line);border-radius:7px;background:#fff;cursor:pointer}
.row{display:flex;align-items:center;gap:8px;min-height:36px}
.row>span{flex:1;color:var(--text)}
.chip{height:30px;padding:0 10px;border:1px solid var(--line);border-radius:7px;background:#fff;cursor:pointer;font:inherit;color:var(--text)}
.chip:hover{background:var(--hover)}
.chip[aria-pressed=true]{background:var(--accent-soft);border-color:#c7d2ff;color:var(--accent)}
.row.stroke-w input{width:84px}
footer.status{grid-area:status;background:var(--panel);border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 12px;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden}
#hint{overflow:hidden;text-overflow:ellipsis}
</style>
</head>
<body>
<div id="app">
  <header class="top">
    <div class="brand"><span class="logo"></span>Vectorly</div>
    <div class="grp">
      <button class="btn" id="undo" title="Undo (Ctrl/Cmd+Z)" aria-label="Undo"><svg viewBox="0 0 20 20"><path d="M7.5 6.5 4 10l3.5 3.5"/><path d="M4 10h8.5a3.5 3.5 0 0 1 0 7H10"/></svg></button>
      <button class="btn" id="redo" title="Redo (Ctrl/Cmd+Shift+Z)" aria-label="Redo"><svg viewBox="0 0 20 20"><path d="M12.5 6.5 16 10l-3.5 3.5"/><path d="M16 10h-8.5a3.5 3.5 0 0 0 0 7H10"/></svg></button>
    </div>
    <div class="grp">
      <button class="btn" id="dup" title="Duplicate (Ctrl/Cmd+D)" aria-label="Duplicate"><svg viewBox="0 0 20 20"><rect x="7" y="7" width="9.5" height="9.5" rx="1.5"/><path d="M4 12.5V4.5a1 1 0 0 1 1-1h8"/></svg></button>
      <button class="btn" id="del" title="Delete (Del)" aria-label="Delete"><svg viewBox="0 0 20 20"><path d="M4 6h12M8 6V4h4v2M6 6l.8 10h6.4L14 6"/></svg></button>
      <button class="btn" id="front" title="Bring forward (])" aria-label="Bring forward"><svg viewBox="0 0 20 20"><path d="M10 16V4M5.5 8.5 10 4l4.5 4.5"/></svg></button>
      <button class="btn" id="back" title="Send backward ([)" aria-label="Send backward"><svg viewBox="0 0 20 20"><path d="M10 4v12M5.5 11.5 10 16l4.5-4.5"/></svg></button>
    </div>
    <div class="spacer"></div>
    <div class="grp">
      <button class="btn" id="zoom-out" title="Zoom out (Ctrl/Cmd+-)" aria-label="Zoom out">-</button>
      <button class="zoomlabel" id="zoom-label" title="Reset zoom to 100%">100%</button>
      <button class="btn" id="zoom-in" title="Zoom in (Ctrl/Cmd++)" aria-label="Zoom in">+</button>
    </div>
    <button class="btn primary" id="export-svg" title="Download drawing.svg">Export SVG</button>
  </header>

  <nav class="rail" aria-label="Tools">
    <button class="btn" data-tool="select" title="Select (V)" aria-label="Select"><svg viewBox="0 0 20 20"><path d="M5 3.5v12.2l3.2-3 2.3 5 2-1-2.3-4.9h4.4z"/></svg></button>
    <button class="btn" data-tool="rect" title="Rectangle (R)" aria-label="Rectangle"><svg viewBox="0 0 20 20"><rect x="3.5" y="4.5" width="13" height="11" rx="1.5"/></svg></button>
    <button class="btn" data-tool="ellipse" title="Ellipse (E)" aria-label="Ellipse"><svg viewBox="0 0 20 20"><ellipse cx="10" cy="10" rx="7" ry="5.5"/></svg></button>
    <button class="btn" data-tool="line" title="Line (L)" aria-label="Line"><svg viewBox="0 0 20 20"><path d="M4 16 16 4"/><circle cx="4" cy="16" r="1.2"/><circle cx="16" cy="4" r="1.2"/></svg></button>
  </nav>

  <main id="canvas-wrap">
    <svg id="stage" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
          <path d="M20 0H0V20" fill="none" stroke="#d6dbe3" stroke-width="1"/>
        </pattern>
      </defs>
      <rect id="bg" x="0" y="0" width="100%" height="100%" fill="url(#grid-pattern)"/>
      <g id="world"><g id="shapes"></g></g>
      <g id="overlay"></g>
    </svg>
  </main>

  <aside class="panel">
    <div class="sec">Selection</div>
    <p class="note" id="panel-note">Select a shape to edit it.</p>
    <fieldset id="pos-fields" disabled>
      <div class="sec">Position &amp; size</div>
      <div class="grid2">
        <label class="kv">X<input type="number" id="prop-x" step="1"></label>
        <label class="kv">Y<input type="number" id="prop-y" step="1"></label>
        <label class="kv">Width<input type="number" id="prop-w" step="1" min="0"></label>
        <label class="kv">Height<input type="number" id="prop-h" step="1" min="0"></label>
      </div>
    </fieldset>
    <div class="sec">Appearance</div>
    <div class="row"><span>Fill</span><input type="color" id="fill-color" value="#5b8def" aria-label="Fill color"><button class="chip" id="fill-none" aria-pressed="false">None</button></div>
    <div class="row"><span>Stroke</span><input type="color" id="stroke-color" value="#1d1d1f" aria-label="Stroke color"></div>
    <div class="row stroke-w"><span>Stroke width</span><input type="number" id="stroke-width" min="0" max="200" step="0.5" value="2" aria-label="Stroke width"></div>
    <div class="sec">Document</div>
    <p class="note">Autosaved in this browser. Export writes a standalone SVG.</p>
  </aside>

  <footer class="status">
    <span id="status-info"></span>
    <span id="hint"></span>
  </footer>
</div>

<script>
(() => {
'use strict';

const NS = 'http://www.w3.org/2000/svg';
const KEY = 'vectorly.document.v1';
const MAX_HISTORY = 200;
const ACC = '#4f6bf6';
const CURS = {nw:'nwse-resize',se:'nwse-resize',ne:'nesw-resize',sw:'nesw-resize',n:'ns-resize',s:'ns-resize',e:'ew-resize',w:'ew-resize'};
const HANDLES = [['nw',0,0],['n',1,0],['ne',2,0],['e',2,1],['se',2,2],['s',1,2],['sw',0,2],['w',0,1]];
const TOOL_KEYS = {v:'select', r:'rect', e:'ellipse', l:'line'};

const $ = id => document.getElementById(id);
const svg = $('stage');
const shapesG = $('shapes');
const overlay = $('overlay');
const gridPat = $('grid-pattern');
const els = new Map();

let shapes = [];
let selection = new Set();
let tool = 'select';
let view = {zoom: 1, px: 100, py: 80};
let style = {fill: '#5b8def', fillNone: false, stroke: '#1d1d1f', sw: 2};
let undoStack = [];
let redoStack = [];
let drag = null;
let spaceDown = false;
let rafPending = false;
let styleBefore = null;
let styleTimer = 0;
let saveTimer = 0;

/* ---------- helpers ---------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
const newId = () => 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const sel = () => shapes.filter(s => selection.has(s.id));
const isTyping = t => !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);

function bbox(s) {
  if (s.type === 'line') return {x: Math.min(s.x1, s.x2), y: Math.min(s.y1, s.y2), w: Math.abs(s.x2 - s.x1), h: Math.abs(s.y2 - s.y1)};
  return {x: s.x, y: s.y, w: s.w, h: s.h};
}
function unionBox(list) {
  if (!list.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const b of list) { x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); }
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
}
function intersects(b, r) {
  return b.x <= r.x + r.w && b.x + b.w >= r.x && b.y <= r.y + r.h && b.y + b.h >= r.y;
}
function translate(o, dx, dy) {
  if (o.type === 'line') return {...o, x1: o.x1 + dx, y1: o.y1 + dy, x2: o.x2 + dx, y2: o.y2 + dy};
  return {...o, x: o.x + dx, y: o.y + dy};
}
function withBBox(o, nb) {
  if (o.type === 'line') {
    const ob = bbox(o);
    const mx = x => ob.w ? nb.x + (x - ob.x) * (nb.w / ob.w) : nb.x;
    const my = y => ob.h ? nb.y + (y - ob.y) * (nb.h / ob.h) : nb.y;
    return {...o, x1: mx(o.x1), y1: my(o.y1), x2: mx(o.x2), y2: my(o.y2)};
  }
  return {...o, x: nb.x, y: nb.y, w: nb.w, h: nb.h};
}
function geomFor(type, a, b, shift) {
  let dx = b.x - a.x, dy = b.y - a.y;
  if (type === 'line') {
    if (shift) {
      const len = Math.hypot(dx, dy);
      const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
      dx = Math.cos(ang) * len; dy = Math.sin(ang) * len;
    }
    return {type: 'line', x1: a.x, y1: a.y, x2: a.x + dx, y2: a.y + dy};
  }
  if (shift) {
    const s = Math.max(Math.abs(dx), Math.abs(dy));
    dx = dx < 0 ? -s : s; dy = dy < 0 ? -s : s;
  }
  return {type