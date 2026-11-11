```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Flux — Digital Logic Laboratory</title>
<style>
:root {
  --bg: #0b0d11;
  --panel: #151922;
  --panel2: #1b2130;
  --panel3: #11151d;
  --edge: #2b3443;
  --edge2: #344054;
  --text: #dbe2ec;
  --muted: #8b96a7;
  --sel: #ffd166;
  --accent: #6ea8fe;
  --sig0: #3da9fc;
  --sig1: #2ee66b;
  --sigX: #ffab4c;
  --sigZ: #b585ff;
  --sigB: #97a7bd;
  --err: #ffb4ab;
  --errbg: #3b2026;
}

* { box-sizing: border-box; }

html, body {
  height: 100%;
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font: 13px/1.35 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}

#app {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

#topbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid var(--edge);
  background: #10141b;
}

.brand {
  display: flex;
  gap: 10px;
  align-items: baseline;
  min-width: 170px;
}

.brand b {
  font-size: 18px;
  letter-spacing: 0.13em;
  color: #fff;
}

.brand span {
  font-size: 11px;
  color: var(--muted);
}

.group {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.group label {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  color: var(--muted);
  font-size: 12px;
}

button {
  background: #222a38;
  border: 1px solid var(--edge);
  color: var(--text);
  border-radius: 6px;
  padding: 6px 8px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  min-height: 28px;
}

button:hover { background: #283344; border-color: var(--edge2); }
button:active { transform: translateY(1px); }
button:disabled { opacity: 0.45; cursor: not-allowed; }

button[data-add] {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  text-align: center;
}

#run[aria-pressed="true"] {
  background: var(--sel);
  border-color: #fff1b8;
  color: #11151d;
  font-weight: 700;
}

input[type="number"],
input[type="text"],
textarea {
  background: #11151d;
  border: 1px solid var(--edge);
  color: var(--text);
  border-radius: 5px;
  padding: 5px 6px;
  font: inherit;
  font-size: 12px;
  min-width: 0;
}

input[type="number"] { width: 72px; }
#step-count { width: 74px; }

.tickbox {
  margin-left: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--muted);
}

#tick {
  color: var(--text);
  font-weight: 700;
}

#main {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) 330px;
  gap: 8px;
  padding: 8px;
}

#palette,
#side {
  overflow: auto;
  min-width: 0;
  min-height: 0;
}

aside {
  background: var(--panel);
  border: 1px solid var(--edge);
  border-radius: 8px;
  padding: 8px;
}

h2 {
  margin: 0 0 8px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.legend {
  margin-top: 10px;
  display: grid;
  gap: 4px;
  color: var(--muted);
  font-size: 11px;
}

.legend b {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.legend .l0 { color: var(--sig0); }
.legend .l1 { color: var(--sig1); }
.legend .lx { color: var(--sigX); }
.legend .lz { color: var(--sigZ); }
.legend .lb { color: var(--sigB); }

#stage {
  position: relative;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--edge);
  border-radius: 8px;
  background: #0d1016;
  overflow: hidden;
}

#workspace {
  display: block;
  width: 100%;
  height: 100%;
}

.panel {
  background: var(--panel2);
  border: 1px solid var(--edge);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
}

#status {
  padding: 7px 8px;
  border: 1px solid var(--edge);
  border-radius: 6px;
  background: #202632;
  color: #cbd5e1;
  font-size: 12px;
  margin-bottom: 8px;
  min-height: 30px;
  overflow-wrap: anywhere;
}

#status.error {
  background: var(--errbg);
  border-color: #5a2b31;
  color: var(--err);
}

.insp-line {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

#node-type { color: var(--accent); font-weight: 700; }
#node-id { color: var(--muted); max-width: 140px; overflow: hidden; text-overflow: ellipsis; }

.field {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 6px 0;
}

.field label {
  min-width: 54px;
  color: var(--muted);
  font-size: 12px;
}

#node-value { flex: 1; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
#node-period { width: 74px; }

#memory-inspector {
  width: 100%;
  max-height: 150px;
  overflow: auto;
  margin-top: 4px;
}

.memory-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
}

.mem-row {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #222b3a;
  padding: 2px 0;
}

.addr { color: var(--muted); }

.mem-state {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: var(--muted);
}

#json {
  width: 100%;
  height: 122px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  resize: vertical;
}

.row {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

#truth-scroll {
  max-height: 240px;
  overflow: auto;
  border: 1px solid var(--edge);
  border-radius: 5px;
  background: #10141b;
}

#truth-table {
  border-collapse: collapse;
  width: max-content;
  min-width: 100%;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
}

#truth-table th,
#truth-table td {
  padding: 3px 6px;
  border-bottom: 1px solid #222b3a;
  text-align: center;
}

#truth-table th {
  position: sticky;
  top: 0;
  background: #202632;
  color: var(--muted);
}

#truth-table td { color: var(--text); }

/* SVG appearance */
svg text {
  pointer-events: none;
  user-select: none;
}

.grid { stroke: #1d2431; }

.node-body {
  fill: var(--panel2);
  stroke: #334155;
  stroke-width: 1.5;
  pointer-events: all;
}

g[aria-selected="true"] .node-body {
  stroke: var(--sel);
  stroke-width: 2;
  filter: drop-shadow(0 0 5px rgba(255, 209, 102, 0.38));
}

.node-type {
  fill: #cbd5e1;
  font: 11px ui-monospace, SFMono-Regular, Menlo, monospace;
  text-anchor: middle;
}

.node-id {
  fill: #64748b;
  font: 9px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.node-value {
  font: 13px ui-monospace, SFMono-Regular, Menlo, monospace;
  text-anchor: middle;
}

.val-0 { fill: var(--sig0); }
.val-1 { fill: var(--sig1); }
.val-X { fill: var(--sigX); }
.val-Z { fill: var(--sigZ); }
.val-B { fill: var(--sigB); }

.port {
  stroke: #64748b;
  stroke-width: 2;
  fill: #222b3a;
  pointer-events: all;
}

.port-output {
  fill: var(--sig0);
  stroke: #7dd3fc;
}

.port-label {
  fill: #7d8898;
  font: 9px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.wire {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

.wire.sig-0 { stroke: var(--sig0); }
.wire.sig-1 { stroke: var(--sig1); }
.wire.sig-X { stroke: var(--sigX); }
.wire.sig-Z { stroke: var(--sigZ); }
.wire.sig-B { stroke: var(--sigB); }

.arrow-0 { fill: var(--sig0); }
.arrow-1 { fill: var(--sig1); }
.arrow-X { fill: var(--sigX); }
.arrow-Z { fill: var(--sigZ); }
.arrow-B { fill: var(--sigB); }

.wire-preview {
  fill: none;
  stroke: var(--sel);
  stroke-width: 2;
  stroke-dasharray: 5 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}
</style>
</head>
<body>
<div id="app">
  <header id="topbar">
    <div class="brand"><b>FLUX</b><span>digital logic lab</span></div>

    <div class="group">
      <label>Step <input id="step-count" type="number" min="1" max="4096" value="1"></label>
      <button id="step" type="button">Step</button>
      <button id="run" type="button" aria-pressed="false">Run</button>
      <button id="reset-state" type="button">Reset State</button>
    </div>

    <div class="group">
      <button id="undo" type="button">Undo</button>
      <button id="redo" type="button">Redo</button>
      <button id="new" type="button">New Circuit</button>
      <button id="demo" type="button">Demo</button>
    </div>

    <div class="group">
      <button id="zoom-out" type="button">Zoom −</button>
      <button id="fit" type="button">Fit</button>
      <button id="zoom-in" type="button">Zoom +</button>
    </div>

    <div class="tickbox">Tick <span id="tick">0</span></div>
  </header>

  <div id="main">
    <aside id="palette">
      <h2>Palette</h2>
      <div class="palette-grid">
        <button type="button" data-add="INPUT">INPUT</button>
        <button type="button" data-add="CLOCK">CLOCK</button>
        <button type="button" data-add="NOT">NOT</button>
        <button type="button" data-add="AND">AND</button>
        <button type="button" data-add="OR">OR</button>
        <button type="button" data-add="XOR">XOR</button>
        <button type="button" data-add="MUX">MUX</button>
        <button type="button" data-add="TRI">TRI</button>
        <button type="button" data-add="ADD">ADD</button>
        <button type="button" data-add="DFF">DFF</button>
        <button type="button" data-add="RAM">RAM</button>
        <button type="button" data-add="PROBE">PROBE</button>
      </div>
      <div class="legend">
        <div><b class="l0">0</b> low</div>
        <div><b class="l1">1</b> high</div>
        <div><b class="lx">X</b> unknown/conflict</div>
        <div><b class="lz">Z</b> high impedance</div>
        <div><b class="lb">Bus</b> mixed binary word</div>
      </div>
    </aside>

    <section id="stage">
      <svg id="workspace" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="#1d2431" stroke-width="1"></path>
          </pattern>

          <marker id="arrow-0" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path class="arrow-0" d="M0,0 L10,5 L0,10 Z"></path>
          </marker>
          <marker id="arrow-1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path class="arrow-1" d="M0,0 L10,5 L0,10 Z"></path>
          </marker>
          <marker id="arrow-X" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path class="arrow-X" d="M0,0 L10,5 L0,10 Z"></path>
          </marker>
          <marker id="arrow-Z" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path class="arrow-Z" d="M0,0 L10,5 L0,10 Z"></path>
          </marker>
          <marker id="arrow-B" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path class="arrow-B" d="M0,0 L10,5 L0,10 Z"></path>
          </marker>
        </defs>

        <g id="scene" transform="translate(80 80) scale(1)">
          <rect class="grid" x="-50000" y="-50000" width="100000" height="100000" fill="url(#grid)" pointer-events="none"></rect>
          <g id="wire-layer"></g>
          <g id="preview-layer"></g>
          <g id="node-layer"></g>
        </g>
      </svg>
    </section>

    <aside id="side">
      <div id="status" data-error="" role="status">Ready</div>

      <div class="panel">
        <h2>Inspector</h2>
        <div id="inspector-empty">No component selected.</div>
        <div id="inspector-body">
          <div class="insp-line">
            <span id="node-type">—</span>
            <span id="node-id"></span>
          </div>

          <div class="field">
            <label for="node-width">Width</label>
            <input id="node-width" type="number" min="1" max="8" step="1">
          </div>

          <div class="field" id="field-value">
            <label for="node-value">Value</label>
            <input id="node-value" type="text" spellcheck="false">
          </div>

          <div class="field" id="field-period">
            <label for="node-period">Period</label>
            <input id="node-period" type="number" min="1" max="32" step="1">
          </div>

          <div class="field">
            <label>Memory</label>
            <div id="memory-inspector"></div>
          </div>
        </div>
      </div>

      <div class="panel">
        <h2>JSON</h2>
        <textarea id="json" spellcheck="false" placeholder="Export or paste JSON"></textarea>
        <div class="row">
          <button id="import" type="button">Import</button>
          <button id="export" type="button">Export</button>
        </div>
      </div>

      <div class="panel">
        <h2>Truth table</h2>
        <button id="truth" type="button">Generate</button>
        <div id="truth-scroll">
          <table id="truth-table"><tbody></tbody></table>
        </div>
      </div>
    </aside>
  </div>
</div>

<script>
(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const ID_RE = /^[A-Za-z0-9_-]+$/;
  const VALUE_RE = /^[01XZ]+$/;
  const MAX_HISTORY = 60;
  const NODE_W = 112;
  const PORT_SPACING = 22;

  const TYPE_SET = new Set([
    "INPUT", "CLOCK", "NOT", "AND", "OR", "XOR", "MUX", "TRI",
    "ADD", "DFF", "RAM", "PROBE"
  ]);

  const PORT_DEFS = {
    INPUT: [],
    CLOCK: [],
    NOT: [{ name: "in", kind: "width" }],
    AND: [{ name: "a", kind: "width" }, { name: "b", kind: "width" }],
    OR: [{ name: "a", kind: "width" }, { name: "b", kind: "width" }],
    XOR: [{ name: "a", kind: "width" }, { name: "b", kind: "width" }],
    MUX: [
      { name: "a", kind: "width" },
      { name: "b", kind: "width" },
      { name: "s", kind: 1 }
    ],
    TRI: [
      { name: "in", kind: "width" },
      { name: "en", kind: 1 }
    ],
    ADD: [{ name: "a", kind: "width" }, { name: "b", kind: "width" }],
    DFF: [
      { name: "d", kind: "width" },
      { name: "clk", kind: 1 },
      { name: "rst", kind: 1 }
    ],
    RAM: [
      { name: "addr", kind: 4 },
      { name: "din", kind: "width" },
      { name: "we", kind: 1 },
      { name: "clk", kind: 1 }
    ],
    PROBE: [{ name: "in", kind: "width" }]
  };

  const WORDS = { zero: [], one: [], x: [], z: [] };
  for (let i = 0; i <= 8; i++) {
    WORDS.zero[i] = "0".repeat(i);
    WORDS.one[i] = "1".repeat(i);
    WORDS.x[i] = "X".repeat(i);
    WORDS.z[i] = "Z".repeat(i);
  }

  const dom = {
    workspace: document.getElementById("workspace"),
    scene: document.getElementById("scene"),
    wireLayer: document.getElementById("wire-layer"),
    previewLayer: document.getElementById("preview-layer"),
    nodeLayer: document.getElementById("node-layer"),
    tick: document.getElementById("tick"),
    status: document.getElementById("status"),
    json: document.getElementById("json"),
    truthTable: document.getElementById("truth-table"),
    stepCount: document.getElementById("step-count"),
    run: document.getElementById("run"),
    stepBtn: document.getElementById("step"),
    resetBtn: document.getElementById("reset-state"),
    newBtn: document.getElementById("new"),
    demoBtn: document.getElementById("demo"),
    undoBtn: document.getElementById("undo"),
    redoBtn: document.getElementById("redo"),
    zoomIn: document.getElementById("zoom-in"),
    zoomOut: document.getElementById("zoom-out"),
    fit: document.getElementById("fit"),
    importBtn: document.getElementById("import"),
    exportBtn: document.getElementById("export"),
    truthBtn: document.getElementById("truth"),
    inspectorEmpty: document.getElementById("inspector-empty"),
    inspectorBody: document.getElementById("inspector-body"),
    nodeId: document.getElementById("node-id"),
    nodeType: document.getElementById("node-type"),
    nodeWidth: document.getElementById("node-width"),
    nodeValue: document.getElementById("node-value"),
    nodePeriod: document.getElementById("node-period"),
    fieldValue: document.getElementById("field-value"),
    fieldPeriod: document.getElementById("field-period"),
    memoryInspector: document.getElementById("memory-inspector")
  };

  let nodes = new Map();
  let wires = new Map();
  let usedIds = new Set();
  let incidentWires = new Map();
  let wireEndpointKeys = new Set();

  let nodeElements = new Map();
  let wireElements = new Map();

  let sim = null;
  let selectedId = null;
  let view = { x: 80, y: 80, scale: 1 };

  let history = [];
  let historyIndex = 0;

  let running = false;
  let runTimer = null;
  let truthGenerating = false;

  let saveTimer = null;
  let dirty = false;

  let placeIndex = 0;
  let nodeCounter = 1;
  let wireCounter = 1;

  let drag = null;

  const layoutCache = new Map();

  function clampScale(s) {
    return Math.max(0.25, Math.min(4, s));
  }

  function setStatus(message, errorKind = "", isError = false) {
    dom.status.textContent = message;
    dom.status.dataset.error = errorKind || "";
    dom.status.classList.toggle("error", Boolean(errorKind) || isError);
  }

  function portWidthOf(node, port) {
    if (port === "out") {
      return node.type === "CLOCK" ? 1 : node.width;
    }
    const def = (PORT_DEFS[node.type] || []).find(p => p.name === port);
    if (!def) return 0;
    if (def.kind === 1) return 1;
    if (def.kind === 4) return 4;
    return node.width;
  }

  function portRadius(w) {
    return w === 1 ? 4 : 6;
  }

  function getLayout(type) {
    if (layoutCache.has(type)) return layoutCache.get(type);
    const defs = PORT_DEFS[type] || [];
    const n = defs.length;
    const h = 54 + PORT_SPACING * n;
    const out = { x: NODE_W, y: h / 2 };
    const inputs = [];

    if (n > 0) {
      const startY = h / 2 - (n - 1) * PORT_SPACING / 2;
      for (let i = 0; i < n; i++) {
        inputs.push({ name: defs[i].name, x: 0, y: startY + i * PORT_SPACING });
      }
    }

    const layout = { h, out, inputs };
    layoutCache.set(type, layout);
    return layout;
  }

  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const k of Object.keys(attrs)) el.setAttribute(k, attrs[k]);
    return el;
  }

  function classifyWord(s) {
    if (!s) return "Z";
    let all0 = true, all1 = true, allZ = true;
    for (const c of s) {
      if (c === "0") { all1 = false; allZ = false; }
      else if (c === "1") { all0 = false; allZ = false; }
      else if (c === "X") return "X";
      else if (c === "Z") { all0 = false; all1 = false; }
      else return "X";
    }
    if (allZ) return "Z";
    if (all0) return "0";
    if (all1) return "1";
    return "B";
  }

  function normalizeZToX(s) {
    return String(s).replace(/Z/g, "X");
  }

  function isBinaryString(s) {
    if (!s) return false;
    for (let i = 0; i < s.length; i++) {
      if (s[i] !== "0" && s[i] !== "1") return false;
    }
    return true;
  }

  function isDefEdge(old, next) {
    return old === "0" && next === "1";
  }

  function isPossibleEdge(old, next) {
    return !isDefEdge(old, next) && old !== "1" && next !== "0";
  }

  function mergeBits(oldWord, din) {
    const n = Math.max(oldWord.length, din.length);
    let out = "";
    for (let i = 0; i < n; i++) {
      const a = oldWord[i] || "X";
      const b = din[i] || "X";
      out += (a === b) ? a : "X";
    }
    return out;
  }

  function combineNOT(a) {
    let out = "";
    for (let i = 0; i < a.length; i++) {
      const c = a[i];
      if (c === "0") out += "1";
      else if (c === "1") out += "0";
      else out += "X";
    }
    return out;
  }

  function combineAND(a, b) {
    const n = Math.max(a.length, b.length);
    let out = "";
    for (let i = 0; i < n; i++) {
      let ca = a[i] || "X";
      let cb = b[i] || "X";
      if (ca === "Z") ca = "X";
      if (cb === "Z") cb = "X";
      if (ca === "0" || cb === "0") out += "0";
      else if (ca === "1" && cb === "1") out += "1";
      else out += "X";
    }
    return out;
  }

  function combineOR(a, b) {
    const n = Math.max(a.length, b.length);
    let out = "";
    for (let i = 0; i < n; i++) {
      let ca = a[i] || "X";
      let cb = b[i] || "X";
      if (ca === "Z") ca = "X";
      if (cb === "Z") cb = "X";
      if (ca === "1" || cb === "1") out += "1";
      else if (ca === "0" && cb === "0") out += "0";
      else out += "X";
    }
    return out;
  }

  function combineXOR(a, b) {
    const n = Math.max(a.length, b.length);
    let out = "";
    for (let i = 0; i < n; i++) {
      let ca = a[i] || "X";
      let cb = b[i] || "X";
      if (ca === "Z") ca = "X";
      if (cb === "Z") cb = "X";
      if (ca === "X" || cb === "X") out += "X";
      else out += (ca === cb) ? "0" : "1";
    }
    return out;
  }

  function combineADD(a, b, w) {
    if (!isBinaryString(a) || !isBinaryString(b)) return WORDS.x[w];
    const va = parseInt(a, 2);
    const vb = parseInt(b, 2);
    const sum = (va + vb) % (1 << w);
    return sum.toString(2).padStart(w, "0");
  }

  function combineMUX(a, b, s) {
    if (s === "0") return a;
    if (s === "1") return b;

    let out = "";
    for (let i = 0; i < a.length; i++) {
      const ca = a[i] || "X";
      const cb = b[i] || "X";
      out += (ca === cb) ? ca : "X";
    }
    return out;
  }

  function combineTRI(input, en) {
    const w = input.length;
    if (en === "0") return WORDS.z[w];
    if (en === "1") return input;

    let out = "";
    for (let i = 0; i < w; i++) {
      const c = input[i] || "Z";
      out += (c === "Z") ? "Z" : "X";
    }
    return out;
  }

  function evalCombinational(node, snap, sim) {
    switch (node.type) {
      case "INPUT":
        return sim.getInput(node);
      case "NOT":
        return combineNOT(sim.resolvePort(node, "in", snap));
      case "AND":
        return combineAND(sim.resolvePort(node, "a", snap), sim.resolvePort(node, "b", snap));
      case "OR":
        return combineOR(sim.resolvePort(node, "a", snap), sim.resolvePort(node, "b", snap));
      case "XOR":
        return combineXOR(sim.resolvePort(node, "a", snap), sim.resolvePort(node, "b", snap));
      case "ADD":
        return combineADD(sim.resolvePort(node, "a", snap), sim.resolvePort(node, "b", snap), node.width);
      case "MUX":
        return combineMUX(
          sim.resolvePort(node, "a", snap),
          sim.resolvePort(node, "b", snap),
          sim.resolvePort(node, "s", snap)
        );
      case "TRI":
        return combineTRI(sim.resolvePort(node, "in", snap), sim.resolvePort(node, "en", snap));
      default:
        return WORDS.x[node.width];
    }
  }

  class Simulator {
    constructor(nodeMap, wireMap) {
      this.nodeList = Array.from(nodeMap.values());
      this.drivers = new Map();

      for (const w of wireMap.values()) {
        const key = w.to.node + "|" + w.to.port;
        let arr = this.drivers.get(key);
        if (!arr) {
          arr = [];
          this.drivers.set(key, arr);
        }
        arr.push(w.from.node);
      }

      this.overrides = null;
      this.tick = 0;
      this.outputs = {};
      this.probes = {};
      this.memory = {};
      this.clocks = {};
    }

    getInput(node) {
      if (this.overrides && this.overrides.has(node.id)) return this.overrides.get(node.id);
      return node.value;
    }

    reset(overrides) {
      this.overrides = overrides || null;
      this.tick = 0;
      this.outputs = {};
      this.probes = {};
      this.memory = {};
      this.clocks = {};

      for (const node of this.nodeList) {
        const id = node.id;

        if (node.type === "INPUT") {
          this.outputs[id] = this.getInput(node);
        } else if (node.type === "CLOCK") {
          this.outputs[id] = "0";
        } else if (node.type === "DFF") {
          this.outputs[id] = WORDS.zero[node.width];
          this.clocks[id] = "0";
        } else if (node.type === "RAM") {
          const zero = WORDS.zero[node.width];
          this.outputs[id] = zero;
          this.memory[id] = new Array(16).fill(zero);
          this.clocks[id] = "0";
        } else if (node.type !== "PROBE") {
          this.outputs[id] = WORDS.x[node.width];
        }
      }

      this.resolveProbes();
    }

    resolvePort(node, port, snap) {
      const key = node.id + "|" + port;
      const arr = this.drivers.get(key);
      const w = portWidthOf(node, port);

      if (!arr || arr.length === 0) return WORDS.z[w];
      if (arr.length === 1) return snap[arr[0]] || WORDS.x[w];

      let out = "";
      for (let i = 0; i < w; i++) {
        let has0 = false, has1 = false, hasX = false, hasZ = false;

        for (const src of arr) {
          const s = snap[src];
          const c = s ? s.charAt(i) : "X";

          if (c === "0") has0 = true;
          else if (c === "1") has1 = true;
          else if (c === "X") hasX = true;
          else if (c === "Z") hasZ = true;
          else hasX = true;
        }

        if (hasX || (has0 && has1)) out += "X";
        else if (has0) out += "0";
        else if (has1) out += "1";
        else out += "Z";
      }
      return out;
    }

    resolveProbes() {
      this.probes = {};
      for (const node of this.nodeList) {
        if (node.type === "PROBE") {
          this.probes[node.id] = this.resolvePort(node, "in", this.outputs);
        }
      }
    }

    tickOnce() {
      const snap = this.outputs;
      const next = {};
      const newTick = this.tick + 1;

      for (const node of this.nodeList) {
        const id = node.id;
        const w = node.width;

        if (node.type === "PROBE") continue;

        if (node.type === "INPUT") {
          next[id] = this.getInput(node);
          continue;
        }

        if (node.type === "CLOCK") {
          const level = Math.floor(newTick / node.period) % 2;
          next[id] = level === 0 ? "0" : "1";
          continue;
        }

        if (node.type === "NOT") {
          next[id] = combineNOT(this.resolvePort(node, "in", snap));
          continue;
        }

        if (node.type === "AND") {
          next[id] = combineAND(this.resolvePort(node, "a", snap), this.resolvePort(node, "b", snap));
          continue;
        }

        if (node.type === "OR") {
          next[id] = combineOR(this.resolvePort(node, "a", snap), this.resolvePort(node, "b", snap));
          continue;
        }

        if (node.type === "XOR") {
          next[id] = combineXOR(this.resolvePort(node, "a", snap), this.resolvePort(node, "b", snap));
          continue;
        }

        if (node.type === "ADD") {
          const a = this.resolvePort(node, "a", snap);
          const b = this.resolvePort(node, "b", snap);
          next[id] = combineADD(a, b, w);
          continue;
        }

        if (node.type === "MUX") {
          const a = this.resolvePort(node, "a", snap);
          const b = this.resolvePort(node, "b", snap);
          const s = this.resolvePort(node, "s", snap);
          next[id] = combineMUX(a, b, s);
          continue;
        }

        if (node.type === "TRI") {
          const input = this.resolvePort(node, "in", snap);
          const en = this.resolvePort(node, "en", snap);
          next[id] = combineTRI(input, en);
          continue;
        }

        if (node.type === "DFF") {
          const d = this.resolvePort(node, "d", snap);
          const rst = this.resolvePort(node, "rst", snap);
          const clkRaw = this.resolvePort(node, "clk", snap);
          const clk = clkRaw === "Z" ? "X" : clkRaw;
          const oldClk = this.clocks[id] || "0";

          let out;
          if (rst === "1") {
            out = WORDS.zero[w];
          } else if (rst === "X" || rst === "Z") {
            out = WORDS.x[w];
          } else {
            if (isDefEdge(oldClk, clk)) out = normalizeZToX(d);
            else if (isPossibleEdge(oldClk, clk)) out = WORDS.x[w];
            else out = snap[id] || WORDS.zero[w];
          }

          next[id] = out;
          this.clocks[id] = clk;
          continue;
        }

        if (node.type === "RAM") {
          const addr = this.resolvePort(node, "addr", snap);
          const din = this.resolvePort(node, "din", snap);
          const we = this.resolvePort(node, "we", snap);
          const clkRaw = this.resolvePort(node, "clk", snap);
          const clk = clkRaw === "Z" ? "X" : clkRaw;
          const oldClk = this.clocks[id] || "0";
          const oldMem = this.memory[id] || new Array(16).fill(WORDS.zero[w]);

          const edgeDef = isDefEdge(oldClk, clk);
          const edgePoss = !edgeDef && isPossibleEdge(oldClk, clk);
          const edgeAny = edgeDef || edgePoss;

          let out;
          if (edgeDef) {
            out = isBinaryString(addr) ? (oldMem[parseInt(addr, 2)] || WORDS.x[w]) : WORDS.x[w];
          } else if (edgePoss) {
            out = WORDS.x[w];
          } else {
            out = snap[id] || WORDS.zero[w];
          }

          let mem = oldMem;
          const normDin = normalizeZToX(din);

          if (edgeAny && we !== "0") {
            const binary = isBinaryString(addr);

            if (edgeDef && binary && we === "1") {
              mem = oldMem.slice();
              mem[parseInt(addr, 2)] = normDin;
            } else {
              mem = oldMem.slice();
              if (binary) {
                const idx = parseInt(addr, 2);
                mem[idx] = mergeBits(mem[idx], normDin);
              } else {
                for (let a = 0; a < 16; a++) {
                  mem[a] = mergeBits(mem[a], normDin);
                }
              }
            }
          }

          next[id] = out;
          this.clocks[id] = clk;
          this.memory[id] = mem;
        }
      }

      this.outputs = next;
      this.tick = newTick;
      this.resolveProbes();
    }
  }

  function serialize() {
    return JSON.stringify({
      version: 1,
      nodes: Array.from(nodes.values(), n => {
        const o = { id: n.id, type: n.type, x: n.x, y: n.y, width: n.width };
        if (n.type === "INPUT") o.value = n.value;
        if (n.type === "CLOCK") o.period = n.period;
        return o;
      }),
      wires: Array.from(wires.values(), w => ({
        id: w.id,
        from: { node: w.from.node, port: w.from.port },
        to: { node: w.to.node, port: w.to.port }
      }))
    });
  }

  function validateDocumentText(text) {
    try {
      return validateDocumentObject(JSON.parse(text));
    } catch (e) {
      return { error: "Invalid JSON" };
    }
  }

  function validateDocumentObject(doc) {
    if (!doc || typeof doc !== "object") return { error: "Document must be an object" };
    if (doc.version !== 1) return { error: "version must be 1" };
    if (!Array.isArray(doc.nodes)) return { error: "nodes must be an array" };
    if (!Array.isArray(doc.wires)) return { error: "wires must be an array" };

    const nodeArr = [];
    const wireArr = [];
    const nodeIds = new Set();
    const wireIds = new Set();
    const wireKeys = new Set();
    const nodeMap = new Map();

    for (const n of doc.nodes) {
      if (!n || typeof n !== "object") return { error: "Each node must be an object" };
      if (typeof n.id !== "string" || !ID_RE.test(n.id)) return { error: "Invalid node id: " + JSON.stringify(n.id) };
      if (nodeIds.has(n.id)) return { error: "Duplicate node id: " + n.id };
      if (!TYPE_SET.has(n.type)) return { error: "Invalid node type: " + n.type };
      if (typeof n.x !== "number" || !Number.isFinite(n.x)) return { error: "Node x must be finite: " + n.id };
      if (typeof n.y !== "number" || !Number.isFinite(n.y)) return { error: "Node y must be finite: " + n.id };
      if (!Number.isInteger(n.width) || n.width < 1 || n.width > 8) return { error: "Node width must be 1..8: " + n.id };

      const node = { id: n.id, type: n.type, x: n.x, y: n.y, width: n.width };

      if (n.type === "INPUT") {
        if (typeof n.value !== "string") return { error: "INPUT requires string value: " + n.id };
        if (n.value.length !== n.width) return { error: "INPUT value length must match width: " + n.id };
        if (!VALUE_RE.test(n.value)) return { error: "INPUT value may only contain 0,1,X,Z: " + n.id };
        node.value = n.value;
      }

      if (n.type === "CLOCK") {
        if (n.width !== 1) return { error: "CLOCK width must be 1: " + n.id };
        if (!Number.isInteger(n.period) || n.period < 1 || n.period > 32) return { error: "CLOCK period must be 1..32: " + n.id };
        node.period = n.period;
      }

      nodeIds.add(node.id);
      nodeMap.set(node.id, node);
      nodeArr.push(node);
    }

    for (const w of doc.wires) {
      if (!w || typeof w !== "object") return { error: "Each wire must be an object" };
      if (typeof w.id !== "string" || !ID_RE.test(w.id)) return { error: "Invalid wire id: " + JSON.stringify(w.id) };
      if (wireIds.has(w.id)) return { error: "Duplicate wire id: " + w.id };
      if (!w.from || typeof w.from !== "object") return { error: "Invalid wire source" };
      if (!w.to || typeof w.to !== "object") return { error: "Invalid wire destination" };
      if (typeof w.from.node !== "string" || !ID_RE.test(w.from.node)) return { error: "Invalid wire source node" };
      if (typeof w.to.node !== "string" || !ID_RE.test(w.to.node)) return { error: "Invalid wire destination node" };
      if (typeof w.from.port !== "string" || !ID_RE.test(w.from.port)) return { error: "Invalid wire source port" };
      if (typeof w.to.port !== "string" || !ID_RE.test(w.to.port)) return { error: "Invalid wire destination port" };

      const src = nodeMap.get(w.from.node);
      const dst = nodeMap.get(w.to.node);
      if (!src) return { error: "Wire references missing source node: " + w.from.node };
      if (!dst) return { error: "Wire references missing destination node: " + w.to.node };

      if (src.type === "PROBE" || w.from.port !== "out") return { error: "Wire source must be an output port: " + w.id };

      const dstDef = (PORT_DEFS[dst.type] || []).find(p => p.name === w.to.port);
      if (!dstDef) return { error: "Invalid wire destination port: " + w.to.port + " on " + dst.type };

      const sw = portWidthOf(src, w.from.port);
      const tw = portWidthOf(dst, w.to.port);
      if (sw !== tw) return { error: "Port widths do not match on wire: " + w.id };

      const key = w.from.node + "|" + w.from.port + "|" + w.to.node + "|" + w.to.port;
      if (wireKeys.has(key)) return { error: "Duplicate wire connection: " + key };
      wireKeys.add(key);

      wireIds.add(w.id);
      wireArr.push({
        id: w.id,
        from: { node: w.from.node, port: w.from.port },
        to: { node: w.to.node, port: w.to.port }
      });
    }

    return { error: null, nodes: nodeArr, wires: wireArr };
  }

  function rebuildUsed() {
    usedIds.clear();
    for (const id of nodes.keys()) usedIds.add(id);
    for (const id of wires.keys()) usedIds.add(id);
  }

  function rebuildDerived() {
    incidentWires = new Map();
    wireEndpointKeys = new Set();

    for (const w of wires.values()) {
      wireEndpointKeys.add(w.from.node + "|" + w.from.port + "|" + w.to.node + "|" + w.to.port);

      if (!incidentWires.has(w.from.node)) incidentWires.set(w.from.node, new Set());
      if (!incidentWires.has(w.to.node)) incidentWires.set(w.to.node, new Set());
      incidentWires.get(w.from.node).add(w.id);
      incidentWires.get(w.to.node).add(w.id);
    }
  }

  function historyPush(snapshot) {
    if (history.length === 0) {
      history.push(snapshot);
      historyIndex = 0;
      return;
    }

    history = history.slice(0, historyIndex + 1);
    history.push(snapshot);

    if (history.length > MAX_HISTORY) {
      const excess = history.length - MAX_HISTORY;
      history.splice(0, excess);
      historyIndex -= excess;
    }

    historyIndex = history.length - 1;
  }

  function schedulePersist() {
    dirty = true;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(persistNow, 300);
  }

  function persistNow() {
    if (!dirty) return;
    dirty = false;
    saveTimer = null;

    try {
      localStorage.setItem("flux.doc", serialize());
      localStorage.setItem("flux.view", JSON.stringify(view));
    } catch (e) {
      // Storage may be unavailable or full; the application remains usable.
    }
  }

  function updateSceneTransform() {
    dom.scene.setAttribute("transform", `translate(${view.x} ${view.y}) scale(${view.scale})`);
  }

  function applyView() {
    updateSceneTransform();
    schedulePersist();
  }

  function setSelection(id) {
    if (id && !nodes.has(id)) id = null;
    if (selectedId === id) return;

    if (selectedId && nodeElements.has(selectedId)) {
      nodeElements.get(selectedId).g.setAttribute("aria-selected", "false");
    }

    selectedId = id || null;

    if (selectedId && nodeElements.has(selectedId)) {
      nodeElements.get(selectedId).g.setAttribute("aria-selected", "true");
    }

    showInspector();
  }

  function showInspector() {
    const node = selectedId ? nodes.get(selectedId) : null;

    if (!node) {
      dom.inspectorEmpty.style.display = "block";
      dom.inspectorBody.style.display = "none";
      dom.nodeWidth.disabled = true;
      dom.nodeWidth.value = "";
      dom.nodeValue.value = "";
      dom.nodePeriod.value = "";
      dom.fieldValue.style.display = "none";
      dom.fieldPeriod.style.display = "none";
      dom.memoryInspector.innerHTML = "";
      return;
    }

    dom.inspectorEmpty.style.display = "none";
    dom.inspectorBody.style.display = "block";

    dom.nodeType.textContent = node.type;
    dom.nodeId.textContent = node.id;

    dom.nodeWidth.disabled = node.type === "CLOCK";
    dom.nodeWidth.value = String(node.width);

    if (node.type === "INPUT") {
      dom.fieldValue.style.display = "flex";
      dom.nodeValue.maxLength = node.width;
      dom.nodeValue.value = node.value;
    } else {
      dom.fieldValue.style.display = "none";
      dom.nodeValue.value = "";
    }

    if (node.type === "CLOCK") {
      dom.fieldPeriod.style.display = "flex";
      dom.nodePeriod.value = String(node.period);
    } else {
      dom.fieldPeriod.style.display = "none";
      dom.nodePeriod.value = "";
    }

    updateInspectorMemory();
  }

  function updateInspectorMemory() {
    const node = selectedId ? nodes.get(selectedId) : null;
    if (!node) {
      dom.memoryInspector.innerHTML = "";
      return;
    }

    if (node.type === "RAM") {
      const fallback = new Array(16).fill(WORDS.x[node.width]);
      const mem = (sim && sim.memory[node.id]) || fallback;
      let html = '<div class="memory-grid">';
      for (let a = 0; a < 16; a++) {
        html += `<div class="mem-row"><span class="addr">${a.toString(2).padStart(4, "0")}</span><span>${mem[a] || ""}</span></div>`;
      }
      html += "</div>";
      dom.memoryInspector.innerHTML = html;
      return;
    }

    if (node.type === "DFF") {
      dom.memoryInspector.innerHTML = `<div class="mem-state">Prev clock: ${sim && sim.clocks[node.id] || "0"}</div>`;
      return;
    }

    if (node.type === "CLOCK") {
      dom.memoryInspector.innerHTML = `<div class="mem-state">Period: ${node.period}</div>`;
      return;
    }

    dom.memoryInspector.innerHTML = "";
  }

  function wirePathD(w) {
    const from = nodes.get(w.from.node);
    const to = nodes.get(w.to.node);
    if (!from || !to) return "";

    const fromLayout = getLayout(from.type);
    const toLayout = getLayout(to.type);

    const sx = from.x + fromLayout.out.x;
    const sy = from.y + fromLayout.out.y;

    const inp = toLayout.inputs.find(p => p.name === w.to.port);
    if (!inp) return "";

    const tx = to.x + inp.x;
    const ty = to.y + inp.y;

    return pathFromTo(sx, sy, tx, ty);
  }

  function pathFromTo(sx, sy, tx, ty) {
    const gap = 24;
    const dx = tx - sx;

    if (dx >= gap) {
      const mid = sx + Math.max(gap, dx / 2);
      return `M ${sx} ${sy} L ${mid} ${sy} L ${mid} ${ty} L ${tx} ${ty}`;
    }

    const outX = sx + gap;
    const inX = tx - gap;
    const bendY = ty >= sy ? sy + gap : sy - gap;

    return `M ${sx} ${sy} L ${outX} ${sy} L ${outX} ${bendY} L ${inX} ${bendY} L ${inX} ${ty} L ${tx} ${ty}`;
  }

  function portWorld(id, port) {
    const node = nodes.get(id);
    if (!node) return { x: 0, y: 0 };
    const layout = getLayout(node.type);

    if (port === "out") {
      return { x: node.x + layout.out.x, y: node.y + layout.out.y };
    }

    const inp = layout.inputs.find(p => p.name === port);
    if (!inp) return { x: node.x, y: node.y };
    return { x: node.x + inp.x, y: node.y + inp.y };
  }

  function createNodeElement(node) {
    const layout = getLayout(node.type);
    const h = layout.h;

    const g = svgEl("g", {
      "data-node": node.id,
      "aria-selected": "false",
      class: "node"
    });
    g.setAttribute("transform", `translate(${node.x} ${node.y})`);

    g.appendChild(svgEl("rect", {
      "data-title": "",
      class: "node-body",
      x: 0,
      y: 0,
      width: NODE_W,
      height: h,
      rx: 7,
      ry: 7
    }));

    const idText = svgEl("text", { class: "node-id", x: 6, y: 11 });
    idText.textContent = node.id;
    g.appendChild(idText);

    const typeText = svgEl("text", { class: "node-type", x: NODE_W / 2, y: 14 });
    typeText.textContent = node.type;
    g.appendChild(typeText);

    const valueText = svgEl("text", {
      "data-value": node.id,
      class: "node-value",
      x: NODE_W / 2,
      y: h - 8
    });
    valueText.textContent = "";
    g.appendChild(valueText);

    for (const inp of layout.inputs) {
      const def = (PORT_DEFS[node.type] || []).find(p => p.name === inp.name);
      const pw = portWidthOf(node, inp.name);
      const r = portRadius(pw);

      g.appendChild(svgEl("circle", {
        "data-port": inp.name,
        class: "port",
        cx: inp.x,
        cy: inp.y,
        r
      }));

      const label = svgEl("text", { class: "port-label", x: inp.x + 10, y: inp.y + 3 });
      label.textContent = inp.name;
      g.appendChild(label);
    }

    if (node.type !== "PROBE") {
      const outW = portWidthOf(node, "out");
      const r = portRadius(outW);

      g.appendChild(svgEl("circle", {
        "data-port": "out",
        class: "port port-output",
        cx: layout.out.x,
        cy: layout.out.y,
        r
      }));

      const label = svgEl("text", {
        class: "port-label",
        x: NODE_W - 10,
        y: layout.out.y + 3,
        "text-anchor": "end"
      });
      label.textContent = "out";
      g.appendChild(label);
    }

    return { g, value: valueText };
  }

  function createWireElement(w) {
    const path = svgEl("path", {
      "data-wire": w.id,
      class: "wire sig-B",
      d: wirePathD(w),
      "marker-end": "url(#arrow-B)"
    });

    const src = nodes.get(w.from.node);
    const pw = src ? portWidthOf(src, w.from.port) : 1;
    path.setAttribute("stroke-width", String(Math.max(1.6, Math.min(5, 1 + pw * 0.7))));

    return path;
  }

  function renderAll() {
    dom.wireLayer.textContent = "";
    dom.nodeLayer.textContent = "";
    wireElements = new Map();
    nodeElements = new Map();

    for (const w of wires.values()) {
      const el = createWireElement(w);
      wireElements.set(w.id, el);
      dom.wireLayer.appendChild(el);
    }

    for (const n of nodes.values()) {
      const el = createNodeElement(n);
      nodeElements.set(n.id, el);
      dom.nodeLayer.appendChild(el.g);
    }

    for (const [id, el] of nodeElements) {
      el.g.setAttribute("aria-selected", id === selectedId ? "true" : "false");
    }

    updateSceneTransform();
    refreshDisplay();
  }

  function updateNodeTransform(node) {
    const el = nodeElements.get(node.id);
    if (el) el.g.setAttribute("transform", `translate(${node.x} ${node.y})`);
  }

  function updateIncidentWires(id) {
    const set = incidentWires.get(id);
    if (!set) return;

    for (const wid of set) {
      const w = wires.get(wid);
      const path = wireElements.get(wid);
      if (w && path) path.setAttribute("d", wirePathD(w));
    }
  }

  function refreshDisplay() {
    if (!sim) return;

    dom.tick.textContent = String(sim.tick);

    for (const node of nodes.values()) {
      const el = nodeElements.get(node.id);
      if (!el) continue;

      const text = node.type === "PROBE"
        ? (sim.probes[node.id] || WORDS.z[node.width])
        : (sim.outputs[node.id] || WORDS.x[node.width]);

      el.value.textContent = text;
      el.value.setAttribute("class", "node-value val-" + classifyWord(text));
    }

    for (const w of wires.values()) {
      const path = wireElements.get(w.id);
      if (!path) continue;

      const val = sim.outputs[w.from.node] || WORDS.x[(nodes.get(w.from.node) || { width: 1 }).width];
      const cls = classifyWord(val);
      path.setAttribute("class", "wire sig-" + cls);
      path.setAttribute("marker-end", `url(#arrow-${cls})`);
    }

    updateInspectorMemory();
  }

  function afterDocumentChange(message, pushHistory = true, resetSelection = false) {
    if (resetSelection) selectedId = null;

    if (pushHistory) historyPush(serialize());

    rebuildUsed();
    rebuildDerived();

    pause();

    sim = new Simulator(nodes, wires);
    sim.reset();

    renderAll();
    refreshDisplay();
    showInspector();

    schedulePersist();
    setStatus(message, "", false);
  }

  function newCircuit() {
    nodes = new Map();
    wires = new Map();
    selectedId = null;
    placeIndex = 0;
    afterDocumentChange("New circuit", true, true);
  }

  function importDocument() {
    const valid = validateDocumentText(dom.json.value);
    if (valid.error) {
      setStatus("Import failed: " + valid.error, "import", true);
      return;
    }

    nodes = new Map(valid.nodes.map(n => [n.id, n]));
    wires = new Map(valid.wires.map(w => [w.id, w]));
    selectedId = null;
    placeIndex = 0;
    afterDocumentChange("Imported", true, true);
  }

  function exportDocument() {
    dom.json.value = serialize();
    setStatus("Exported", "", false);
  }

  function loadHistorySnapshot(snapshot) {
    const valid = validateDocumentText(snapshot);
    if (valid.error) {
      nodes = new Map();
      wires = new Map();
    } else {
      nodes = new Map(valid.nodes.map(n => [n.id, n]));
      wires = new Map(valid.wires.map(w => [w.id, w]));
    }

    selectedId = null;
    placeIndex = 0;
    afterDocumentChange("History restored", false, true);
  }

  function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;
    loadHistorySnapshot(history[historyIndex]);
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex++;
    loadHistorySnapshot(history[historyIndex]);
  }

  const NODE_ID_PREFIX = {
    INPUT: "I",
    CLOCK: "C",
    NOT: "N",
    AND: "A",
    OR: "O",
    XOR: "X",
    MUX: "M",
    TRI: "T",
    ADD: "S",
    DFF: "D",
    RAM: "R",
    PROBE: "P"
  };

  function generateNodeId(type) {
    const prefix = NODE_ID_PREFIX[type] || "N";
    let candidate;
    do {
      candidate = prefix + nodeCounter++;
    } while (usedIds.has(candidate));
    return candidate;
  }

  function generateWireId() {
    let candidate;
    do {
      candidate = "W" + wireCounter++;
    } while (usedIds.has(candidate));
    return candidate;
  }

  function addComponent(type) {
    if (!TYPE_SET.has(type)) return;

    const rect = dom.workspace.getBoundingClientRect();
    const cx = (rect.width / 2 - view.x) / view.scale;
    const cy = (rect.height / 2 - view.y) / view.scale;

    const x = cx + ((placeIndex % 4) * 40 - 80);
    const y = cy + (Math.floor(placeIndex / 4) * 40 - 40);
    placeIndex++;

    const id = generateNodeId(type);
    const node = { id, type, x, y, width: 1 };
    if (type === "INPUT") node.value = "0";
    if (type === "CLOCK") node.period = 2;

    nodes.set(id, node);
    usedIds.add(id);
    selectedId = id;

    afterDocumentChange("Added " + type, true, false);
  }

  function deleteSelected() {
    if (!selectedId) return;
    if (!nodes.has(selectedId)) {
      selectedId = null;
      showInspector();
      return;
    }

    const id = selectedId;
    nodes.delete(id);

    for (const w of Array.from(wires.values())) {
      if (w.from.node === id || w.to.node === id) wires.delete(w.id);
    }

    selectedId = null;
    afterDocumentChange("Deleted component", true, false);
  }

  function preserveBits(old, newWidth) {
    if (newWidth <= 0) return "";
    const s = old || "";

    if (newWidth <= s.length) return s.slice(s.length - newWidth);
    return "0".repeat(newWidth - s.length) + s;
  }

  function commitWidth() {
    const node = selectedId ? nodes.get(selectedId) : null;
    if (!node) return;

    const raw = dom.nodeWidth.value.trim();
    const val = Number(raw);

    if (raw === "" || !Number.isInteger(val) || val < 1 || val > 8) {
      setStatus("Invalid width: integer 1..8", "", true);
      return;
    }

    if (node.type === "CLOCK" && val !== 1) {
      setStatus("CLOCK width must be 1", "", true);
      return;
    }

    if (val === node.width) return;

    node.width = val;

    if (node.type === "INPUT") {
      node.value = preserveBits(node.value, val);
    }

    for (const w of Array.from(wires.values())) {
      if (w.from.node === node.id || w.to.node === node.id) {
        const src = nodes.get(w.from.node);
        const dst = nodes.get(w.to.node);
        if (!src || !dst) continue;

        const sw = portWidthOf(src, w.from.port);
        const tw = portWidthOf(dst, w.to.port);
        if (sw !== tw) wires.delete(w.id);
      }
    }

    afterDocumentChange("Width changed", true, false);
  }

  function commitValue() {
    const node = selectedId ? nodes.get(selectedId) : null;
    if (!node || node.type !== "INPUT") return;

    const raw = dom.nodeValue.value.trim();

    if (!VALUE_RE.test(raw) || raw.length !== node.width) {
      setStatus(`INPUT value must be ${node.width} characters from 0,1,X,Z`, "", true);
      return;
    }

    if (raw === node.value) return;

    node.value = raw;
    afterDocumentChange("Input value changed", true, false);
  }

  function commitPeriod() {
    const node = selectedId ? nodes.get(selectedId) : null;
    if (!node || node.type !== "CLOCK") return;

    const raw = dom.nodePeriod.value.trim();
    const val = Number(raw);

    if (raw === "" || !Number.isInteger(val) || val < 1 || val > 32) {
      setStatus("Invalid CLOCK period: integer 1..32", "", true);
      return;
    }

    if (val === node.period) return;

    node.period = val;
    afterDocumentChange("Clock period changed", true, false);
  }

  function bindCommit(input, fn) {
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.dataset.enterCommit = "1";
        fn();
      }
    });

    input.addEventListener("change", () => {
      if (input.dataset.enterCommit === "1") {
        delete input.dataset.enterCommit;
        return;
      }
      fn();
    });

    input.addEventListener("focus", () => {
      delete input.dataset.enterCommit;
    });
  }

  function startRun() {
    if (running || !sim) return;
    running = true;
    dom.run.setAttribute("aria-pressed", "true");
    dom.run.textContent = "Pause";

    runTimer = setInterval(() => {
      if (!running || !sim) return;
      sim.tickOnce();
      refreshDisplay();
    }, 100);
  }

  function pause() {
    if (!running) {
      dom.run.setAttribute("aria-pressed", "false");
      dom.run.textContent = "Run";
      return;
    }

    running = false;
    if (runTimer) {
      clearInterval(runTimer);
      runTimer = null;
    }
    dom.run.setAttribute("aria-pressed", "false");
    dom.run.textContent = "Run";
  }

  function toggleRun() {
    if (running) pause();
    else startRun();
  }

  function stepTicks() {
    let n = Number(dom.stepCount.value);
    if (!Number.isInteger(n) || n < 1) n = 1;
    if (n > 4096) n = 4096;
    dom.stepCount.value = String(n);

    if (running) pause();

    if (sim) {
      for (let i = 0; i < n; i++) sim.tickOnce();
      refreshDisplay();
    }

    setStatus("Stepped " + n, "", false);
  }

  function resetState() {
    pause();
    if (sim) {
      sim.reset();
      refreshDisplay();
    }
    setStatus("State reset", "", false);
  }

  function zoomBy(factor) {
    const rect = dom.workspace.getBoundingClientRect();
    const px = rect.width / 2;
    const py = rect.height / 2;

    const newScale = clampScale(view.scale * factor);
    if (newScale === view.scale) return;

    const wx = (px - view.x) / view.scale;
    const wy = (py - view.y) / view.scale;

    view.scale = newScale;
    view.x = px - wx * newScale;
    view.y = py - wy * newScale;
    applyView();
  }

  function fitView() {
    const rect = dom.workspace.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    if (nodes.size === 0) {
      view.x = Math.max(24, w / 2 - 80);
      view.y = Math.max(24, h / 2 - 40);
      view.scale = 1;
      applyView();
      setStatus("Fit view", "", false);
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const n of nodes.values()) {
      const layout = getLayout(n.type);
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + NODE_W);
      maxY = Math.max(maxY, n.y + layout.h);
    }

    const pad = 50;
    const bw = Math.max(1, maxX - minX);
    const bh = Math.max(1, maxY - minY);

    let scale = Math.min(4, (w - 2 * pad) / bw, (h - 2 * pad) / bh);
    scale = clampScale(scale);

    view.scale = scale;
    view.x = (w - bw * scale) / 2 - minX * scale;
    view.y = (h - bh * scale) / 2 - minY * scale;

    applyView();
    setStatus("Fit view", "", false);
  }

  function localFromEvent(e) {
    const rect = dom.workspace.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function worldFromLocal(x, y) {
    return { x: (x - view.x) / view.scale, y: (y - view.y) / view.scale };
  }

  function nearestPort(clientX, clientY, wx, wy) {
    const hit = document.elementFromPoint(clientX, clientY);
    if (hit && typeof hit.closest === "function") {
      const portEl = hit.closest("[data-port]");
      if (portEl) {
        const nodeEl = portEl.closest("[data-node]");
        if (nodeEl) return { id: nodeEl.dataset.node, port: portEl.dataset.port };
      }
    }

    const threshold = 14 / view.scale;
    const threshold2 = threshold * threshold;
    let best = null;
    let bestD = Infinity;

    for (const node of nodes.values()) {
      const layout = getLayout(node.type);
      const ports = [{ port: "out", x: layout.out.x, y: layout.out.y }].concat(
        layout.inputs.map(inp => ({ port: inp.name, x: inp.x, y: inp.y }))
      );

      for (const p of ports) {
        const px = node.x + p.x;
        const py = node.y + p.y;
        const dx = px - wx;
        const dy = py - wy;
        const d = dx * dx + dy * dy;

        if (d <= threshold2 && d < bestD) {
          bestD = d;
          best = { id: node.id, port: p.port };
        }
      }
    }

    return best;
  }

  function createWire(fromId, fromPort, toId, toPort) {
    const fromOut = fromPort === "out";
    const toOut = toPort === "out";

    let src, dst;

    if (fromOut && !toOut) {
      src = { node: fromId, port: fromPort };
      dst = { node: toId, port: toPort };
    } else if (!fromOut && toOut) {
      src = { node: toId, port: toPort };
      dst = { node: fromId, port: fromPort };
    } else {
      return false;
    }

    const srcNode = nodes.get(src.node);
    const dstNode = nodes.get(dst.node);
    if (!srcNode || !dstNode) return false;

    if (srcNode.type === "PROBE" || src.port !== "out") return false;

    const dstDef = (PORT_DEFS[dstNode.type] || []).find(p => p.name === dst.port);
    if (!dstDef) return false;

    const sw = portWidthOf(srcNode, src.port);
    const tw = portWidthOf(dstNode, dst.port);
    if (sw !== tw) return false;

    const key = src.node + "|" + src.port + "|" + dst.node + "|" + dst.port;
    if (wireEndpointKeys.has(key)) return false;

    const id = generateWireId();
    wires.set(id, {
      id,
      from: { node: src.node, port: src.port },
      to: { node: dst.node, port: dst.port }
    });

    return true;
  }

  function startPan(e, local) {
    e.preventDefault();
    drag = {
      mode: "pan",
      startView: { x: view.x, y: view.y, scale: view.scale },
      startLocal: local
    };
  }

  function startNodeDrag(nodeEl, e, local) {
    e.preventDefault();
    const id = nodeEl.dataset.node;
    const node = nodes.get(id);
    if (!node) return;

    setSelection(id);

    const start = worldFromLocal(local.x, local.y);
    drag = {
      mode: "node",
      id,
      x0: node.x,
      y0: node.y,
      startWorld: start,
      moved: false
    };

    const el = nodeElements.get(id);
    if (el) dom.nodeLayer.appendChild(el.g);
  }

  function startWireDrag(portEl, e, local) {
    e.preventDefault();
    const nodeEl = portEl.closest("[data-node]");
    if (!nodeEl) return;

    const id = nodeEl.dataset.node;
    const port = portEl.dataset.port;
    const start = portWorld(id, port);

    const preview = svgEl("path", {
      class: "wire-preview",
      d: pathFromTo(start.x, start.y, start.x, start.y)
    });
    dom.previewLayer.appendChild(preview);

    drag = {
      mode: "wire",
      fromId: id,
      fromPort: port,
      startWorld: start,
      preview
    };
  }

  function onPointerMove(e) {
    if (!drag) return;

    const local = localFromEvent(e);

    if (drag.mode === "pan") {
      view.x = drag.startView.x + (local.x - drag.startLocal.x);
      view.y = drag.startView.y + (local.y - drag.startLocal.y);
      updateSceneTransform();
      schedulePersist();
      return;
    }

    if (drag.mode === "node") {
      const node = nodes.get(drag.id);
      if (!node) return;

      const world = worldFromLocal(local.x, local.y);
      const nx = drag.x0 + (world.x - drag.startWorld.x);
      const ny = drag.y0 + (world.y - drag.startWorld.y);

      if (Math.abs(nx - drag.x0) > 0.01 || Math.abs(ny - drag.y0) > 0.01) drag.moved = true;

      node.x = nx;
      node.y = ny;
      updateNodeTransform(node);
      updateIncidentWires(drag.id);
      return;
    }

    if (drag.mode === "wire") {
      const world = worldFromLocal(local.x, local.y);
      if (drag.preview) {
        drag.preview.setAttribute("d", pathFromTo(drag.startWorld.x, drag.startWorld.y, world.x, world.y));
      }
    }
  }

  function onPointerUp(e) {
    if (!drag) return;

    const local = localFromEvent(e);

    if (drag.mode === "pan") {
      drag = null;
      applyView();
      return;
    }

    if (drag.mode === "node") {
      const moved = drag.moved;
      drag = null;

      if (moved) afterDocumentChange("Moved component", true, false);
      return;
    }

    if (drag.mode === "wire") {
      const fromId = drag.fromId;
      const fromPort = drag.fromPort;

      if (drag.preview) drag.preview.remove();
      drag = null;

      const world = worldFromLocal(local.x, local.y);
      const target = nearestPort(e.clientX, e.clientY, world.x, world.y);

      if (!target) {
        setStatus("Drop a wire on a port", "", true);
        return;
      }

      const ok = createWire(fromId, fromPort, target.id, target.port);
      if (!ok) {
        setStatus("Wire rejected: incompatible ports or duplicate", "", true);
        return;
      }

      afterDocumentChange("Wire added", true, false);
    }
  }

  function isTextEditing() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
  }

  function topoOrder(nodeMap, wireMap) {
    const adj = new Map();
    const indeg = new Map();

    for (const id of nodeMap.keys()) {
      adj.set(id, []);
      indeg.set(id, 0);
    }

    for (const w of wireMap.values()) {
      const arr = adj.get(w.from.node);
      if (arr) arr.push(w.to.node);
      indeg.set(w.to.node, (indeg.get(w.to.node) || 0) + 1);
    }

    const indeg2 = new Map(indeg);
    const queue = [];

    for (const [id, deg] of indeg2) {
      if (deg === 0) queue.push(id);
    }

    const depth = new Map();
    for (const id of nodeMap.keys()) depth.set(id, 0);

    const order = [];

    for (let qi = 0; qi < queue.length; qi++) {
      const u = queue[qi];
      order.push(u);

      for (const v of (adj.get(u) || [])) {
        const cand = depth.get(u) + 1;
        if (cand > depth.get(v)) depth.set(v, cand);

        indeg2.set(v, (indeg2.get(v) || 0) - 1);
        if (indeg2.get(v) === 0) queue.push(v);
      }
    }

    if (order.length !== nodeMap.size) return { ok: false, order: [], maxDepth: 0 };

    let maxDepth = 0;
    for (const d of depth.values()) maxDepth = Math.max(maxDepth, d);

    return { ok: true, order, maxDepth };
  }

  function renderTruthTable(inputs, probes, rows) {
    let html = "<thead><tr><th>Assignment</th>";

    for (const inp of inputs) html += `<th>${inp.id}</th>`;
    for (const probe of probes) html += `<th>${probe.id}</th>`;

    html += "</tr></thead><tbody>";

    for (const row of rows) {
      html += `<tr data-assignment="${row.bits}"><td>${row.bits}</td>`;

      for (const w of row.inputWords) html += `<td>${w}</td>`;

      for (const probe of probes) {
        const val = row.probes[probe.id] || "";
        html += `<td data-probe="${probe.id}">${val}</td>`;
      }

      html += "</tr>";
    }

    html += "</tbody>";
    dom.truthTable.innerHTML = html;
  }

  async function generateTruthTable() {
    if (truthGenerating) return;

    truthGenerating = true;

    try {
      const truthNodes = new Map();
      const truthWires = new Map();

      for (const n of nodes.values()) truthNodes.set(n.id, { ...n });
      for (const w of wires.values()) {
        truthWires.set(w.id, {
          id: w.id,
          from: { node: w.from.node, port: w.from.port },
          to: { node: w.to.node, port: w.to.port }
        });
      }

      const inputNodes = Array.from(truthNodes.values())
        .filter(n => n.type === "INPUT")
        .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

      const probeNodes = Array.from(truthNodes.values())
        .filter(n => n.type === "PROBE")
        .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

      if (inputNodes.length === 0) throw new Error("At least one INPUT is required");
      if (probeNodes.length === 0) throw new Error("At least one PROBE is required");

      let totalBits = 0;
      for (const n of inputNodes) totalBits += n.width;

      if (totalBits > 8) throw new Error("At most 8 total INPUT bits are supported");
      if (probeNodes.length > 16) throw new Error("At most 16 PROBE nodes are supported");

      for (const n of truthNodes.values()) {
        if (n.type === "CLOCK" || n.type === "DFF" || n.type === "RAM") {
          throw new Error("CLOCK, DFF, and RAM are not supported in truth tables");
        }
      }

      const topo = topoOrder(truthNodes, truthWires);
      if (!topo.ok) throw new Error("Circuit contains directed cycles");

      setStatus("Generating truth table…", "", false);

      const sim = new Simulator(truthNodes, truthWires);
      const rows = [];
      const totalRows = 1 << totalBits;

      for (let mask = 0; mask < totalRows; mask++) {
        const bits = mask.toString(2).padStart(totalBits, "0");
        const overrides = new Map();
        const inputWords = [];

        let pos = 0;
        for (const inp of inputNodes) {
          const word = bits.slice(pos, pos + inp.width);
          pos += inp.width;
          overrides.set(inp.id, word);
          inputWords.push(word);
        }

        if (topo.maxDepth <= 63) {
          sim.reset(overrides);

          const snap = {};

          for (const id of topo.order) {
            const node = truthNodes.get(id);
            if (node.type === "PROBE") continue;

            if (node.type === "INPUT") snap[id] = overrides.get(id);
            else snap[id] = evalCombinational(node, snap, sim);
          }

          sim.outputs = snap;
          sim.probes = {};

          for (const probe of probeNodes) {
            sim.probes[probe.id] = sim.resolvePort(probe, "in", snap);
          }
        } else {
          sim.reset(overrides);
          for (let t = 0; t < 64; t++) sim.tickOnce();
        }

        rows.push({
          bits,
          inputWords,
          probes: Object.assign({}, sim.probes)
        });

        if ((mask & 31) === 31) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      renderTruthTable(inputNodes, probeNodes, rows);
      setStatus("Truth table generated", "", false);
    } catch (err) {
      dom.truthTable.innerHTML = "<tbody></tbody>";
      setStatus("Truth table unsupported: " + (err && err.message ? err.message : String(err)), "truth-unsupported", true);
    } finally {
      truthGenerating = false;
    }
  }

  function loadSaved() {
    let validDoc = null;

    try {
      const raw = localStorage.getItem("flux.doc");
      if (raw) {
        const v = validateDocumentText(raw);
        if (!v.error) validDoc = v;
      }
    } catch (e) {
      validDoc = null;
    }

    if (!validDoc) validDoc = { nodes: [], wires: [] };

    nodes = new Map(validDoc.nodes.map(n => [n.id, n]));
    wires = new Map(validDoc.wires.map(w => [w.id, w]));

    try {
      const raw = localStorage.getItem("flux.view");
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && Number.isFinite(obj.x) && Number.isFinite(obj.y) && Number.isFinite(obj.scale)) {
          view = { x: obj.x, y: obj.y, scale: clampScale(obj.scale) };
        }
      }
    } catch (e) {
      // Keep default viewport.
    }

    selectedId = null;
    placeIndex = 0;

    rebuildUsed();
    rebuildDerived();

    pause();

    sim = new Simulator(nodes, wires);
    sim.reset();

    renderAll();
    refreshDisplay();
    showInspector();

    history = [serialize()];
    historyIndex = 0;

    dirty = false;
    setStatus("Ready", "", false);
  }

  function loadDemo() {
    const demoNodes = [
      { id: "IN1", type: "INPUT", x: 80, y: 70, width: 1, value: "1" },
      { id: "RST0", type: "INPUT", x: 80, y: 160, width: 1, value: "0" },
      { id: "CLK1", type: "CLOCK", x: 240, y: 70, width: 1, period: 2 },
      { id: "Q1", type: "DFF", x: 420, y: 70, width: 1 },
      { id: "P1", type: "PROBE", x: 620, y: 70, width: 1 }
    ];

    const demoWires = [
      { id: "W1", from: { node: "CLK1", port: "out" }, to: { node: "Q1", port: "clk" } },
      { id: "W2", from: { node: "IN1", port: "out" }, to: { node: "Q1", port: "d" } },
      { id: "W3", from: { node: "RST0", port: "out" }, to: { node: "Q1", port: "rst" } },
      { id: "W4", from: { node: "Q1", port: "out" }, to: { node: "P1", port: "in" } }
    ];

    nodes = new Map(demoNodes.map(n => [n.id, n]));
    wires = new Map(demoWires.map(w => [w.id, w]));
    selectedId = null;
    placeIndex = 0;
    afterDocumentChange("Demo loaded", true, true);
  }

  // Event wiring.
  document.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => addComponent(btn.dataset.add));
  });

  dom.newBtn.addEventListener("click", newCircuit);
  dom.demoBtn.addEventListener("click", loadDemo);
  dom.undoBtn.addEventListener("click", undo);
  dom.redoBtn.addEventListener("click", redo);
  dom.stepBtn.addEventListener("click", stepTicks);
  dom.runBtn.addEventListener("click", toggleRun);
  dom.resetBtn.addEventListener("click", resetState);
  dom.zoomInBtn.addEventListener("click", () => zoomBy(1.25));
  dom.zoomOutBtn.addEventListener("click", () => zoomBy(1 / 1.25));
  dom.fit.addEventListener("click", fitView);
  dom.importBtn.addEventListener("click", importDocument);
  dom.exportBtn.addEventListener("click", exportDocument);
  dom.truthBtn.addEventListener("click", generateTruthTable);

  bindCommit(dom.nodeWidth, commitWidth);
  bindCommit(dom.nodeValue, commitValue);
  bindCommit(dom.nodePeriod, commitPeriod);

  dom.workspace.addEventListener("pointerdown", e => {
    if (drag || e.button !== 0) return;

    const target = e.target;
    const local = localFromEvent(e);

    const port = target && typeof target.closest === "function" ? target.closest("[data-port]") : null;
    if (port) {
      startWireDrag(port, e, local);
      return;
    }

    const nodeEl = target && typeof target.closest === "function" ? target.closest("[data-node]") : null;

    if (nodeEl) {
      if (e.altKey) startPan(e, local);
      else startNodeDrag(nodeEl, e, local);
      return;
    }

    if (e.altKey) {
      startPan(e, local);
    } else {
      setSelection(null);
    }
  });

  dom.workspace.addEventListener("contextmenu", e => e.preventDefault());

  dom.workspace.addEventListener("wheel", e => {
    e.preventDefault();

    const local = localFromEvent(e);
    const factor = Math.exp(-e.deltaY * 0.0015);
    const newScale = clampScale(view.scale * factor);

    if (newScale === view.scale) return;

    const wx = (local.x - view.x) / view.scale;
    const wy = (local.y - view.y) / view.scale;

    view.scale = newScale;
    view.x = local.x - wx * newScale;
    view.y = local.y - wy * newScale;
    applyView();
  }, { passive: false });

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  window.addEventListener("keydown", e => {
    if (drag) return;

    const editing = isTextEditing();

    if (e.key === "Escape") {
      if (!editing) setSelection(null);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && !editing) {
      const k = e.key.toLowerCase();
      if (k === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
    }

    if ((e.key === " " || e.key === "Spacebar") && !editing) {
      if (e.repeat) return;
      e.preventDefault();
      toggleRun();
      return;
    }

    if ((e.key === "Delete" || e.key === "Backspace") && !editing) {
      if (selectedId && nodes.has(selectedId)) {
        e.preventDefault();
        deleteSelected();
      }
    }
  });

  window.addEventListener("beforeunload", () => persistNow());

  window.__arena = {
    snapshot() {
      const circuit = {
        version: 1,
        nodes: Array.from(nodes.values(), n => {
          const o = { id: n.id, type: n.type, x: n.x, y: n.y, width: n.width };
          if (n.type === "INPUT") o.value = n.value;
          if (n.type === "CLOCK") o.period = n.period;
          return o;
        }),
        wires: Array.from(wires.values(), w => ({
          id: w.id,
          from: { node: w.from.node, port: w.from.port },
          to: { node: w.to.node, port: w.to.port }
        }))
      };

      const outputs = {};
      const probes = {};
      const memory = {};
      const clocks = {};

      if (sim) {
        for (const n of nodes.values()) {
          if (n.type === "PROBE") {
            probes[n.id] = sim.probes[n.id] || WORDS.z[n.width];
          } else {
            outputs[n.id] = { out: sim.outputs[n.id] || WORDS.x[n.width] };
          }

          if (n.type === "RAM") {
            memory[n.id] = Array.from((sim.memory[n.id] || new Array(16).fill(WORDS.x[n.width])));
          }

          if (n.type === "DFF" || n.type === "RAM") {
            clocks[n.id] = sim.clocks[n.id] || "0";
          }
        }
      }

      return {
        circuit,
        tick: sim ? sim.tick : 0,
        outputs,
        probes,
        memory,
        clocks,
        selection: selectedId || null,
        view: { x: view.x, y: view.y, scale: view.scale },
        running
      };
    }
  };

  loadSaved();
})();
</script>
</body>
</html>
```