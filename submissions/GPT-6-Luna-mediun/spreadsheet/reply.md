```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gridcalc — Spreadsheet</title>
<style>
  :root {
    color-scheme: light;
    --ink: #202b3b;
    --muted: #718096;
    --line: #e3e8ef;
    --line-strong: #cbd5e1;
    --blue: #3978e8;
    --blue-soft: #edf4ff;
    --green: #148765;
    --header: #f6f8fb;
    --surface: #ffffff;
  }
  * { box-sizing: border-box; }
  html, body { width: 100%; height: 100%; margin: 0; }
  body {
    overflow: hidden;
    color: var(--ink);
    background: #f1f4f8;
    font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 13px;
    -webkit-font-smoothing: antialiased;
  }
  .app {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 720px;
    padding: 15px 18px 12px;
    gap: 10px;
  }
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 38px;
    flex: 0 0 38px;
  }
  .brand-wrap { display: flex; align-items: center; gap: 11px; }
  .brand-mark {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: white;
    background: linear-gradient(145deg, #39a688, #137a65);
    box-shadow: 0 3px 8px #167e6740;
  }
  .brand-mark svg { width: 21px; height: 21px; }
  .brand-name { font-size: 15px; font-weight: 700; letter-spacing: -.35px; }
  .doc-name { margin-left: 7px; color: #738096; font-size: 12px; }
  .top-actions { display: flex; align-items: center; gap: 10px; }
  .saved-label {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 11px;
    border: 1px solid #e3e8ee;
    border-radius: 7px;
    color: #667488;
    background: #fff;
    font-size: 11px;
  }
  .saved-dot { width: 6px; height: 6px; border-radius: 50%; background: #32a981; }
  .avatar {
    display: grid;
    place-items: center;
    width: 31px;
    height: 31px;
    border-radius: 50%;
    color: #51617a;
    background: #e3eaf3;
    font-size: 11px;
    font-weight: 700;
  }
  .workspace {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    border: 1px solid #dfe5ec;
    border-radius: 10px;
    background: var(--surface);
    box-shadow: 0 7px 24px #26394d0a, 0 1px 3px #26394d08;
  }
  .sheet-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 0 0 48px;
    padding: 0 16px;
    border-bottom: 1px solid #edf0f4;
  }
  .sheet-title-wrap { display: flex; align-items: center; gap: 10px; }
  .sheet-icon {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 7px;
    color: #168765;
    background: #eaf6f1;
  }
  .sheet-icon svg { width: 16px; height: 16px; }
  .sheet-title { font-weight: 650; font-size: 13px; }
  .sheet-subtitle { margin-top: 2px; color: #8a96a7; font-size: 10px; }
  .heading-right { display: flex; align-items: center; gap: 8px; }
  .tool-button {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: 29px;
    padding: 0 10px;
    border: 1px solid #e2e7ed;
    border-radius: 6px;
    color: #5c697d;
    background: white;
    font: inherit;
    font-size: 11px;
  }
  .tool-button svg { width: 13px; height: 13px; }
  .formula-panel {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 0 0 45px;
    padding: 0 13px;
    border-bottom: 1px solid #e8edf2;
    background: #fff;
  }
  .name-box {
    display: grid;
    place-items: center;
    width: 68px;
    height: 28px;
    flex: 0 0 68px;
    border: 1px solid #dfe5ec;
    border-radius: 5px;
    color: #344155;
    background: #fbfcfe;
    font-size: 11px;
    font-weight: 650;
  }
  .formula-fx {
    color: #8995a6;
    font-family: Georgia, serif;
    font-size: 16px;
    font-style: italic;
    font-weight: 700;
  }
  #formula-bar {
    width: 100%;
    height: 29px;
    padding: 0 9px;
    outline: none;
    border: 1px solid transparent;
    border-radius: 5px;
    color: #314052;
    background: transparent;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    font-size: 12px;
  }
  #formula-bar:focus {
    border-color: #dce6f4;
    background: #fbfdff;
  }
  .grid-area {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    background: white;
    scrollbar-color: #c4ccd6 #f5f7fa;
    scrollbar-width: thin;
  }
  .grid {
    display: grid;
    width: max-content;
    grid-template-columns: 48px repeat(26, 104px);
    grid-auto-rows: 27px;
    user-select: none;
  }
  .grid-cell, .col-header, .row-header, .corner {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 0;
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  .corner, .col-header, .row-header {
    justify-content: center;
    color: #738096;
    background: var(--header);
    font-size: 10px;
    font-weight: 600;
  }
  .corner {
    position: sticky;
    z-index: 5;
    top: 0;
    left: 0;
    width: 48px;
    background: #f0f3f7;
  }
  .col-header {
    position: sticky;
    z-index: 3;
    top: 0;
    width: 104px;
  }
  .row-header {
    position: sticky;
    z-index: 2;
    left: 0;
    width: 48px;
    font-weight: 500;
    background: #f8f9fb;
  }
  .grid-cell {
    justify-content: flex-start;
    padding: 0 7px;
    overflow: hidden;
    color: #273548;
    background: #fff;
    white-space: pre;
    font-size: 12px;
    line-height: 26px;
    cursor: cell;
  }
  .grid-cell.numeric { justify-content: flex-end; }
  .grid-cell.boolean { justify-content: center; }
  .grid-cell.error {
    color: #c14343;
    background: #fffafa;
    font-weight: 600;
  }
  .grid-cell.selected {
    z-index: 1;
    outline: 2px solid var(--blue);
    outline-offset: -2px;
    background: #fbfdff;
  }
  .grid-cell.editing { color: transparent; }
  .grid-cell.reference-one { box-shadow: inset 0 0 0 2px #e66c55; }
  .grid-cell.reference-two { box-shadow: inset 0 0 0 2px #8d6bd8; }
  .grid-cell.reference-three { box-shadow: inset 0 0 0 2px #d59a35; }
  .grid-cell.reference-four { box-shadow: inset 0 0 0 2px #389c83; }
  .col-header.active, .row-header.active { color: #2465cb; background: #eaf2ff; }
  .corner.active { color: #2465cb; background: #e4eeff; }
  .cell-editor {
    position: absolute;
    z-index: 4;
    inset: 0;
    width: 100%;
    height: 100%;
    padding: 0 6px;
    outline: 2px solid var(--blue);
    outline-offset: -2px;
    border: 0;
    border-radius: 0;
    color: #273548;
    background: #fff;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    font-size: 12px;
    line-height: 26px;
    user-select: text;
  }
  .statusbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 27px;
    flex: 0 0 27px;
    padding: 0 3px;
    color: #7c8999;
    font-size: 10px;
  }
  .status-left, .status-right { display: flex; align-items: center; gap: 14px; }
  .status-item { display: flex; align-items: center; gap: 5px; }
  .status-icon { color: #42967d; font-size: 12px; }
  .zoom { display: flex; align-items: center; gap: 8px; }
  .zoom-track { width: 65px; height: 3px; border-radius: 4px; background: #dce2ea; }
  .zoom-track::after { display: block; width: 37px; height: 3px; border-radius: 4px; background: #8d9aab; content: ""; }
  @media (max-width: 850px) {
    .app { padding: 10px; gap: 7px; }
    .doc-name, .saved-label, .heading-right .tool-button span { display: none; }
    .grid { grid-template-columns: 42px repeat(26, 92px); }
    .col-header { width: 92px; }
    .row-header, .corner { width: 42px; }
  }
</style>
</head>
<body>
<div class="app">
  <header class="topbar">
    <div class="brand-wrap">
      <div class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="2.5" stroke="currentColor" stroke-width="1.7"/>
          <path d="M4.5 9h15M4.5 14h15M9 4.5v15M14.5 4.5v15" stroke="currentColor" stroke-width="1.35"/>
          <path d="m10.2 11.2 1.5 1.5 2.7-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="brand-name">gridcalc</div>
      <div class="doc-name">Workspace / Untitled spreadsheet</div>
    </div>
    <div class="top-actions">
      <div class="saved-label"><span class="saved-dot"></span><span>All changes saved</span></div>
      <div class="avatar" aria-label="User">GC</div>
    </div>
  </header>

  <main class="workspace">
    <div class="sheet-heading">
      <div class="sheet-title-wrap">
        <div class="sheet-icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <rect x="3" y="2.5" width="14" height="15" rx="2" stroke="currentColor" stroke-width="1.4"/>
            <path d="M3.5 7h13M3.5 11.5h13M8 3v14M12.5 3v14" stroke="currentColor" stroke-width="1"/>
          </svg>
        </div>
        <div>
          <div class="sheet-title">Untitled spreadsheet</div>
          <div class="sheet-subtitle">A clean slate for your next big idea</div>
        </div>
      </div>
      <div class="heading-right">
        <button class="tool-button" type="button" title="Keyboard shortcuts">
          <svg viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="10" rx="2" stroke="currentColor"/><path d="M4 6h.01M6.5 6h.01M9 6h.01M11.5 6h.01M4 9h.01M6.5 9h.01M9 9h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <span>Shortcuts</span>
        </button>
      </div>
    </div>
    <div class="formula-panel">
      <div class="name-box" id="name-box">A1</div>
      <div class="formula-fx">ƒx</div>
      <input id="formula-bar" type="text" autocomplete="off" spellcheck="false" aria-label="Formula bar">
    </div>
    <div class="grid-area" id="grid-area">
      <div class="grid" id="grid" role="grid" aria-label="Spreadsheet grid"></div>
    </div>
  </main>

  <footer class="statusbar">
    <div class="status-left">
      <div class="status-item"><span class="status-icon">▦</span><span>Sheet1</span></div>
      <span id="status-message">Ready</span>
    </div>
    <div class="status-right">
      <span id="status-cell-count">2,600 cells</span>
      <div class="zoom"><span>−</span><div class="zoom-track"></div><span>+</span><span>100%</span></div>
    </div>
  </footer>
</div>

<script>
(() => {
  "use strict";

  const ROWS = 100;
  const COLS = 26;
  const STORAGE_KEY = "gridcalc-spreadsheet-v1";
  const grid = document.getElementById("grid");
  const formulaBar = document.getElementById("formula-bar");
  const nameBox = document.getElementById("name-box");
  const gridArea = document.getElementById("grid-area");
  const cells = new Map();
  const cellElements = new Map();
  const columnHeaders = new Map();
  const rowHeaders = new Map();
  const columnNames = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i));
  let selected = "A1";
  let editing = null;
  let clipboard = null;
  let referenceTimer = null;

  const error = code => ({ type: "error", value: code });
  const isError = value => value && value.type === "error";
  const emptyValue = () => ({ type: "empty", value: "" });
  const numberValue = n => Number.isFinite(n) ? ({ type: "number", value: n }) : error("#VALUE!");

  function colToNumber(letters) {
    let result = 0;
    for (const ch of letters.toUpperCase()) result = result * 26 + ch.charCodeAt(0) - 64;
    return result;
  }
  function numberToCol(n) {
    if (n < 1) return "";
    let result = "";
    while (n > 0) {
      const rem = (n - 1) % 26;
      result = String.fromCharCode(65 + rem) + result;
      n = Math.floor((n - 1) / 26);
    }
    return result;
  }
  function addressToParts(address) {
    const m = /^([A-Z]+)(\d+)$/.exec(address);
    if (!m) return null;
    return { col: colToNumber(m[1]), row: Number(m[2]) };
  }
  function partsToAddress(col, row) { return numberToCol(col) + row; }
  function validAddress(address) {
    const p = addressToParts(address);
    return !!p && p.col >= 1 && p.col <= COLS && p.row >= 1 && p.row <= ROWS;
  }
  function isNumericRaw(raw) {
    return /^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?$/.test(raw.trim());
  }
  function formatNumber(number) {
    if (!Number.isFinite(number)) return "#VALUE!";
    if (Object.is(number, -0)) number = 0;
    if (number === 0) return "0";
    return String(Number(number.toPrecision(10)));
  }
  function valueDisplay(value) {
    if (!value || value.type === "empty") return "";
    if (value.type === "error") return value.value;
    if (value.type === "number") return formatNumber(value.value);
    if (value.type === "boolean") return value.value ? "TRUE" : "FALSE";
    return String(value.value);
  }
  function makeCell(address) {
    return {
      address,
      raw: "",
      ast: null,
      parseError: false,
      deps: new Set(),
      dependents: new Set(),
      value: emptyValue(),
      state: 0
    };
  }

  // Formula tokenizer and recursive-descent parser.
  function tokenize(source) {
    const tokens = [];
    let i = 0;
    while (i < source.length) {
      const ch = source[i];
      if (/\s/.test(ch)) { i++; continue; }
      const start = i;

      if (ch === '"') {
        i++;
        let value = "";
        let closed = false;
        while (i < source.length) {
          if (source[i] === '"') {
            if (source[i + 1] === '"') { value += '"'; i += 2; }
            else { i++; closed = true; break; }
          } else value += source[i++];
        }
        if (!closed) throw new Error("unterminated string");
        tokens.push({ type: "string", value, start, end: i });
        continue;
      }

      const numberMatch = /^(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?/.exec(source.slice(i));
      if (numberMatch) {
        i += numberMatch[0].length;
        tokens.push({ type: "number", value: Number(numberMatch[0]), start, end: i });
        continue;
      }

      const refMatch = /^(\$?)([A-Za-z]+)(\$?)(\d+)/.exec(source.slice(i));
      if (refMatch) {
        i += refMatch[0].length;
        const col = colToNumber(refMatch[2]);
        const row = Number(refMatch[4]);
        tokens.push({
          type: "ref",
          value: { col, row, absCol: !!refMatch[1], absRow: !!refMatch[3] },
          start, end: i
        });
        continue;
      }

      const ident = /^[A-Za-z_][A-Za-z0-9_]*/.exec(source.slice(i));
      if (ident) {
        i += ident[0].length;
        tokens.push({ type: "ident", value: ident[0], start, end: i });
        continue;
      }

      const two = source.slice(i, i + 2);
      if (["<=", ">=", "<>"].includes(two)) {
        tokens.push({ type: "op", value: two, start, end: i + 2 });
        i += 2;
        continue;
      }
      if ("+-*/^&=<>():, ".includes(ch) && ch !== " ") {
        tokens.push({ type: "op", value: ch, start, end: i + 1 });
        i++;
        continue;
      }
      throw new Error("unexpected character");
    }
    tokens.push({ type: "eof", value: "", start: source.length, end: source.length });
    return tokens;
  }

  function parseFormula(source) {
    const tokens = tokenize(source);
    let pos = 0;
    const peek = () => tokens[pos];
    const take = () => tokens[pos++];
    const accept = value => {
      if (peek().value === value) { pos++; return true; }
      return false;
    };
    const expect = value => {
      if (!accept(value)) throw new Error("expected " + value);
    };

    function parseComparison() {
      let node = parseConcat();
      while (["=", "<>", "<", ">", "<=", ">="].includes(peek().value)) {
        const op = take().value;
        node = { kind: "binary", op, left: node, right: parseConcat() };
      }
      return node;
    }
    function parseConcat() {
      let node = parseAdd();
      while (accept("&")) node = { kind: "binary", op: "&", left: node, right: parseAdd() };
      return node;
    }
    function parseAdd() {
      let node = parseMultiply();
      while (peek().value === "+" || peek().value === "-") {
        const op = take().value;
        node = { kind: "binary", op, left: node, right: parseMultiply() };
      }
      return node;
    }
    function parseMultiply() {
      let node = parseUnary();
      while (peek().value === "*" || peek().value === "/") {
        const op = take().value;
        node = { kind: "binary", op, left: node, right: parseUnary() };
      }
      return node;
    }
    function parseUnary() {
      if (peek().value === "+" || peek().value === "-") {
        const op = take().value;
        return { kind: "unary", op, child: parseUnary() };
      }
      return parsePower();
    }
    function parsePower() {
      let node = parsePrimary();
      if (accept("^")) node = { kind: "binary", op: "^", left: node, right: parseUnary() };
      return node;
    }
    function parsePrimary() {
      const token = take();
      if (token.type === "number") return { kind: "literal", value: { type: "number", value: token.value } };
      if (token.type === "string") return { kind: "literal", value: { type: "text", value: token.value } };
      if (token.type === "ref") {
        let start = token.value;
        if (accept(":")) {
          const second = take();
          if (second.type !== "ref") throw new Error("range requires reference");
          return { kind: "range", first: start, second: second.value };
        }
        return { kind: "ref", ref: start };
      }
      if (token.type === "ident") {
        const upper = token.value.toUpperCase();
        if (upper === "TRUE" || upper === "FALSE") {
          return { kind: "literal", value: { type: "boolean", value: upper === "TRUE" } };
        }
        if (!accept("(")) throw new Error("unknown name");
        const args = [];
        if (!accept(")")) {
          do { args.push(parseComparison()); } while (accept(","));
          expect(")");
        }
        return { kind: "call", name: upper, args };
      }
      if (token.value === "(") {
        const node = parseComparison();
        expect(")");
        return node;
      }
      throw new Error("expected expression");
    }

    const ast = parseComparison();
    if (peek().type !== "eof") throw new Error("unexpected token");
    return ast;
  }

  function refAddress(ref) {
    if (!ref || ref.col < 1 || ref.col > COLS || ref.row < 1 || ref.row > ROWS) return null;
    return partsToAddress(ref.col, ref.row);
  }
  function collectDependencies(ast, output) {
    if (!ast) return;
    if (ast.kind === "ref") {
      const address = refAddress(ast.ref);
      if (address) output.add(address);
      return;
    }
    if (ast.kind === "range") {
      const a = refAddress(ast.first), b = refAddress(ast.second);
      if (!a || !b) return;
      const c1 = Math.min(ast.first.col, ast.second.col), c2 = Math.max(ast.first.col, ast.second.col);
      const r1 = Math.min(ast.first.row, ast.second.row), r2 = Math.max(ast.first.row, ast.second.row);
      for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) output.add(partsToAddress(c, r));
      return;
    }
    if (ast.kind === "binary") {
      collectDependencies(ast.left, output);
      collectDependencies(ast.right, output);
    } else if (ast.kind === "unary") collectDependencies(ast.child, output);
    else if (ast.kind === "call") ast.args.forEach(arg => collectDependencies(arg, output));
  }

  function setRaw(address, raw, recalculate = true) {
    const cell = cells.get(address);
    if (!cell) return;
    raw = String(raw);
    for (const dep of cell.deps) cells.get(dep)?.dependents.delete(address);
    cell.deps.clear();
    cell.raw = raw;
    cell.ast = null;
    cell.parseError = false;

    if (raw.startsWith("=")) {
      try {
        cell.ast = parseFormula(raw.slice(1));
        collectDependencies(cell.ast, cell.deps);
      } catch (_) {
        cell.parseError = true;
      }
    }
    for (const dep of cell.deps) cells.get(dep)?.dependents.add(address);

    if (recalculate) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...cells.values()].filter(c => c.raw !== "").map(c => [c.address, c.raw]))); }
      catch (_) { /* storage can be unavailable; the sheet remains usable */ }
      recalculateFrom(address);
    }
  }

  function arithmeticNumber(value) {
    if (isError(value)) return value;
    if (!value || value.type === "empty") return { type: "number", value: 0 };
    if (value.type === "number") return value;
    if (value.type === "boolean") return { type: "number", value: value.value ? 1 : 0 };
    return error("#VALUE!");
  }
  function truthValue(value) {
    if (isError(value)) return value;
    if (!value || value.type === "empty") return { type: "boolean", value: false };
    if (value.type === "boolean") return value;
    if (value.type === "number") return { type: "boolean", value: value.value !== 0 };
    return error("#VALUE!");
  }
  function compareValues(a, b) {
    if (isError(a)) return a;
    if (isError(b)) return b;
    if (a.type === "number" && b.type === "number") return a.value < b.value ? -1 : a.value > b.value ? 1 : 0;
    if (a.type === "boolean" && b.type === "boolean") return Number(a.value) - Number(b.value);
    const av = valueDisplay(a), bv = valueDisplay(b);
    return av < bv ? -1 : av > bv ? 1 : 0;
  }

  function evaluateAst(ast, owner, affected, stack) {
    if (!ast) return error("#ERROR!");
    if (ast.kind === "literal") return ast.value;
    if (ast.kind === "ref") {
      const address = refAddress(ast.ref);
      if (!address) return error("#REF!");
      const target = cells.get(address);
      if (affected.has(address)) evaluateCell(address, affected, stack);
      return target.value;
    }
    if (ast.kind === "range") {
      if (!refAddress(ast.first) || !refAddress(ast.second)) return error("#REF!");
      const c1 = Math.min(ast.first.col, ast.second.col), c2 = Math.max(ast.first.col, ast.second.col);
      const r1 = Math.min(ast.first.row, ast.second.row), r2 = Math.max(ast.first.row, ast.second.row);
      const values = [];
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          const target = cells.get(partsToAddress(c, r));
          if (affected.has(target.address)) evaluateCell(target.address, affected, stack);
          values.push(target.value);
        }
      }
      return { type: "range", values };
    }
    if (ast.kind === "unary") {
      const val = arithmeticNumber(evaluateAst(ast.child, owner, affected, stack));
      if (isError(val)) return val;
      return numberValue(ast.op === "-" ? -val.value : val.value);
    }
    if (ast.kind === "binary") {
      const left = evaluateAst(ast.left, owner, affected, stack);
      if (isError(left)) return left;
      const right = evaluateAst(ast.right, owner, affected, stack);
      if (isError(right)) return right;
      if (ast.op === "&") {
        const textOf = v => v.type === "empty" ? "" : valueDisplay(v);
        return { type: "text", value: textOf(left) + textOf(right) };
      }
      if (["=", "<>", "<", ">", "<=", ">="].includes(ast.op)) {
        const cmp = compareValues(left, right);
        if (isError(cmp)) return cmp;
        const yes = ast.op === "=" ? cmp === 0 :
          ast.op === "<>" ? cmp !== 0 :
          ast.op === "<" ? cmp < 0 :
          ast.op === ">" ? cmp > 0 :
          ast.op === "<=" ? cmp <= 0 : cmp >= 0;
        return { type: "boolean", value: yes };
      }
      const a = arithmeticNumber(left), b = arithmeticNumber(right);
      if (isError(a)) return a;
      if (isError(b)) return b;
      if (ast.op === "/" && b.value === 0) return error("#DIV/0!");
      let result;
      switch (ast.op) {
        case "+": result = a.value + b.value; break;
        case "-": result = a.value - b.value; break;
        case "*": result = a.value * b.value; break;
        case "/": result = a.value / b.value; break;
        case "^": result = Math.pow(a.value, b.value); break;
        default: return error("#ERROR!");
      }
      return numberValue(result);
    }
    if (ast.kind === "call") {
      if (ast.name === "IF") {
        if (ast.args.length !== 3) return error("#ERROR!");
        const cond = truthValue(evaluateAst(ast.args[0], owner, affected, stack));
        if (isError(cond)) return cond;
        return evaluateAst(ast.args[cond.value ? 1 : 2], owner, affected, stack);
      }
      const validFunctions = ["SUM", "AVERAGE", "MIN", "MAX", "COUNT", "ABS", "ROUND"];
      if (!validFunctions.includes(ast.name)) return error("#ERROR!");
      const args = [];
      for (const arg of ast.args) {
        const val = evaluateAst(arg, owner, affected, stack);
        if (isError(val)) return val;
        if (val && val.type === "range") args.push(...val.values);
        else args.push(val);
      }
      if (ast.name === "ABS" || ast.name === "ROUND") {
        if (args.length !== (ast.name === "ABS" ? 1 : 2)) return error("#ERROR!");
        const x = arithmeticNumber(args[0]);
        if (isError(x)) return x;
        if (ast.name === "ABS") return numberValue(Math.abs(x.value));
        const digits = arithmeticNumber(args[1]);
        if (isError(digits)) return digits;
        const power = Math.pow(10, Math.trunc(digits.value));
        return numberValue(Math.round((x.value + Math.sign(x.value) * Number.EPSILON) * power) / power);
      }

      const numbers = [];
      for (const val of args) {
        if (isError(val)) return val;
        if (val && val.type === "number") numbers.push(val.value);
        else if (val && val.type === "boolean" && ast.name !== "COUNT") numbers.push(val.value ? 1 : 0);
        else if (val && val.type === "range") {
          // Ranges are normally flattened above; retained for defensive completeness.
          for (const item of val.values) {
            if (isError(item)) return item;
            if (item.type === "number") numbers.push(item.value);
          }
        }
      }
      if (ast.name === "COUNT") return numberValue(numbers.length);
      if (ast.name === "SUM") return numberValue(numbers.reduce((a, b) => a + b, 0));
      if (!numbers.length) return numberValue(0);
      if (ast.name === "AVERAGE") return numberValue(numbers.reduce((a, b) => a + b, 0) / numbers.length);
      if (ast.name === "MIN") return numberValue(Math.min(...numbers));
      if (ast.name === "MAX") return numberValue(Math.max(...numbers));
      return error("#ERROR!");
    }
    return error("#ERROR!");
  }

  function evaluateCell(address, affected, stack) {
    const cell = cells.get(address);
    if (!cell || cell.state === 2) return cell && cell.value;
    if (cell.state === 1) {
      const start = stack.lastIndexOf(address);
      for (let i = Math.max(0, start); i < stack.length; i++) {
        const member = cells.get(stack[i]);
        member.value = error("#CYCLE!");
        member.state = 2;
      }
      return error("#CYCLE!");
    }
    cell.state = 1;
    stack.push(address);
    let value;
    if (!cell.raw) value = emptyValue();
    else if (cell.raw.startsWith("=")) value = cell.parseError ? error("#ERROR!") : evaluateAst(cell.ast, address, affected, stack);
    else if (isNumericRaw(cell.raw)) value = { type: "number", value: Number(cell.raw.trim()) };
    else value = { type: "text", value: cell.raw };
    stack.pop();
    if (cell.state !== 2) {
      cell.value = value;
      cell.state = 2;
    }
    return cell.value;
  }

  function recalculateFrom(address) {
    const affected = new Set([address]);
    const queue = [address];
    for (let i = 0; i < queue.length; i++) {
      const cell = cells.get(queue[i]);
      for (const dependent of cell.dependents) {
        if (!affected.has(dependent)) { affected.add(dependent); queue.push(dependent); }
      }
    }
    for (const addr of affected) cells.get(addr).state = 0;
    const stack = [];
    for (const addr of affected) evaluateCell(addr, affected, stack);
    for (const addr of affected) renderCell(addr);
    if (editing) refreshReferenceHighlights(editing.input.value);
  }

  function renderCell(address) {
    const cell = cells.get(address);
    const el = cellElements.get(address);
    if (!cell || !el) return;
    const value = cell.value;
    el.textContent = valueDisplay(value);
    el.classList.toggle("numeric", value.type === "number");
    el.classList.toggle("boolean", value.type === "boolean");
    el.classList.toggle("error", value.type === "error");
    el.title = value.type === "error" ? `Formula error: ${value.value}` : "";
  }

  function updateSelection(oldAddress, newAddress, scroll = true) {
    if (oldAddress && cellElements.has(oldAddress)) {
      cellElements.get(oldAddress).classList.remove("selected");
      cellElements.get(oldAddress).setAttribute("aria-selected", "false");
      const old = addressToParts(oldAddress);
      columnHeaders.get(old.col)?.classList.remove("active");
      rowHeaders.get(old.row)?.classList.remove("active");
    }
    selected = newAddress;
    const p = addressToParts(selected);
    const el = cellElements.get(selected);
    if (el) {
      el.classList.add("selected");
      el.setAttribute("aria-selected", "true");
    }
    columnHeaders.get(p.col)?.classList.add("active");
    rowHeaders.get(p.row)?.classList.add("active");
    nameBox.textContent = selected;
    if (!editing) formulaBar.value = cells.get(selected).raw;
    if (scroll && el) el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function clearReferenceHighlights() {
    for (const el of cellElements.values()) {
      el.classList.remove("reference-one", "reference-two", "reference-three", "reference-four");
    }
  }
  function refreshReferenceHighlights(text) {
    clearReferenceHighlights();
    if (!text || !text.startsWith("=")) return;
    const colors = ["reference-one", "reference-two", "reference-three", "reference-four"];
    const re = /(\$?[A-Za-z]+\$?\d+)(?:\s*:\s*(\$?[A-Za-z]+\$?\d+))?/g;
    let match, colorIndex = 0;
    while ((match = re.exec(text))) {
      const parseRef = s => {
        const m = /^\$?([A-Za-z]+)\$?(\d+)$/.exec(s);
        return m ? { col: colToNumber(m[1]), row: Number(m[2]) } : null;
      };
      const a = parseRef(match[1]), b = match[2] ? parseRef(match[2]) : a;
      if (!a || !b) continue;
      const c1 = Math.min(a.col, b.col), c2 = Math.max(a.col, b.col);
      const r1 = Math.min(a.row, b.row), r2 = Math.max(a.row, b.row);
      const css = colors[colorIndex++ % colors.length];
      for (let r = r1; r <= r2 && r <= ROWS; r++) {
        for (let c = c1; c <= c2 && c <= COLS; c++) {
          if (c >= 1 && r >= 1) cellElements.get(partsToAddress(c, r))?.classList.add(css);
        }
      }
    }
  }

  function finishEdit(commit, moveRow = 0, moveCol = 0) {
    if (!editing) return;
    const edit = editing;
    const raw = commit ? edit.input.value : edit.original;
    editing = null;
    clearTimeout(referenceTimer);
    edit.cell.classList.remove("editing");
    edit.input.remove();
    setRaw(edit.address, raw);
    formulaBar.value = cells.get(edit.address).raw;
    if (moveRow || moveCol) {
      const p = addressToParts(edit.address);
      const col = Math.max(1, Math.min(COLS, p.col + moveCol));
      const row = Math.max(1, Math.min(ROWS, p.row + moveRow));
      updateSelection(edit.address, partsToAddress(col, row));
    }
    refreshReferenceHighlights("");
  }

  function beginEdit(initialText, replace = false) {
    if (editing) return;
    const address = selected;
    const cell = cellElements.get(address);
    const original = cells.get(address).raw;
    const input = document.createElement("input");
    input.className = "cell-editor";
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.value = replace ? initialText : original;
    input.setAttribute("aria-label", `Edit ${address}`);
    editing = { address, cell, input, original };
    cell.classList.add("editing");
    cell.appendChild(input);
    formulaBar.value = input.value;
    input.addEventListener("input", () => {
      formulaBar.value = input.value;
      refreshReferenceHighlights(input.value);
    });
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        finishEdit(true, event.shiftKey ? -1 : 1, 0);
      } else if (event.key === "Tab") {
        event.preventDefault();
        finishEdit(true, 0, event.shiftKey ? -1 : 1);
      } else if (event.key === "Escape") {
        event.preventDefault();
        finishEdit(false);
      }
    });
    input.focus();
    if (replace) input.setSelectionRange(input.value.length, input.value.length);
    else input.setSelectionRange(input.value.length, input.value.length);
    refreshReferenceHighlights(input.value);
  }

  function moveSelection(rowDelta, colDelta) {
    const p = addressToParts(selected);
    const row = Math.max(1, Math.min(ROWS, p.row + rowDelta));
    const col = Math.max(1, Math.min(COLS, p.col + colDelta));
    updateSelection(selected, partsToAddress(col, row));
  }

  function shiftFormula(raw, rowDelta, colDelta) {
    if (!raw.startsWith("=")) return raw;
    const tokens = tokenize(raw.slice(1)).filter(t => t.type === "ref");
    if (!tokens.length) return raw;
    let result = raw;
    const replacements = tokens.map(t => {
      const ref = t.value;
      const col = ref.absCol ? ref.col : ref.col + colDelta;
      const row = ref.absRow ? ref.row : ref.row + rowDelta;
      return {
        start: t.start + 1,
        end: t.end + 1,
        text: (ref.absCol ? "$" : "") + numberToCol(col) +
          (ref.absRow ? "$" : "") + row
      };
    });
    for (let i = replacements.length - 1; i >= 0; i--) {
      const item = replacements[i];
      result = result.slice(0, item.start) + item.text + result.slice(item.end);
    }
    return result;
  }

  function buildGrid() {
    const corner = document.createElement("div");
    corner.className = "corner";
    corner.setAttribute("aria-hidden", "true");
    corner.textContent = "▦";
    grid.appendChild(corner);

    for (let c = 1; c <= COLS; c++) {
      const header = document.createElement("div");
      header.className = "col-header";
      header.textContent = columnNames[c - 1];
      header.dataset.column = String(c);
      columnHeaders.set(c, header);
      grid.appendChild(header);
    }

    for (let r = 1; r <= ROWS; r++) {
      const rowHeader = document.createElement("div");
      rowHeader.className = "row-header";
      rowHeader.textContent = String(r);
      rowHeader.dataset.row = String(r);
      rowHeaders.set(r, rowHeader);
      grid.appendChild(rowHeader);
      for (let c = 1; c <= COLS; c++) {
        const address = partsToAddress(c, r);
        const cell = makeCell(address);
        const el = document.createElement("div");
        el.className = "grid-cell";
        el.dataset.cell = address;
        el.setAttribute("role", "gridcell");
        el.setAttribute("aria-selected", "false");
        el.setAttribute("aria-label", address);
        el.textContent = "";
        cells.set(address, cell);
        cellElements.set(address, el);
        grid.appendChild(el);
      }
    }

    grid.addEventListener("click", event => {
      const el = event.target.closest("[data-cell]");
      if (!el) return;
      if (editing && editing.address !== el.dataset.cell) finishEdit(true);
      updateSelection(selected, el.dataset.cell, false);
    });
    grid.addEventListener("dblclick", event => {
      const el = event.target.closest("[data-cell]");
      if (!el) return;
      if (editing) return;
      updateSelection(selected, el.dataset.cell, false);
      beginEdit();
    });
  }

  buildGrid();

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved)) {
      for (const item of saved) {
        if (Array.isArray(item) && typeof item[0] === "string" && validAddress(item[0]) && typeof item[1] === "string") {
          setRaw(item[0], item[1], false);
        }
      }
    }
  } catch (_) { /* Start with a blank sheet if stored data is invalid. */ }

  // Restore dependencies once all stored formulas have been parsed.
  for (const cell of cells.values()) {
    for (const dep of cell.deps) cells.get(dep)?.dependents.add(cell.address);
  }
  const allAddresses = new Set(cells.keys());
  for (const cell of cells.values()) cell.state = 0;
  const loadStack = [];
  for (const cell of cells.values()) evaluateCell(cell.address, allAddresses, loadStack);
  for (const cell of cells.values()) renderCell(cell.address);
  updateSelection(null, selected, false);

  formulaBar.addEventListener("input", () => {
    if (editing) {
      editing.input.value = formulaBar.value;
      refreshReferenceHighlights(formulaBar.value);
    }
  });
  formulaBar.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (editing) {
        editing.input.value = formulaBar.value;
        finishEdit(true);
      } else {
        setRaw(selected, formulaBar.value);
        formulaBar.value = cells.get(selected).raw;
      }
      formulaBar.blur();
      cellElements.get(selected)?.focus?.();
    } else if (event.key === "Escape") {
      if (editing) finishEdit(false);
      else formulaBar.value = cells.get(selected).raw;
      formulaBar.blur();
    }
  });

  document.addEventListener("keydown", event => {
    const target = event.target;
    const inFormula = target === formulaBar;
    const inEditor = editing && target === editing.input;
    const modifier = event.ctrlKey || event.metaKey;

    if (modifier && event.key.toLowerCase() === "c") {
      if (!inFormula && !inEditor) {
        event.preventDefault();
        clipboard = { address: selected, raw: cells.get(selected).raw };
      }
      return;
    }
    if (modifier && event.key.toLowerCase() === "v") {
      if (!inFormula && !inEditor && clipboard) {
        event.preventDefault();
        const from = addressToParts(clipboard.address), to = addressToParts(selected);
        const raw = shiftFormula(clipboard.raw, to.row - from.row, to.col - from.col);
        if (editing) finishEdit(false);
        setRaw(selected, raw);
        formulaBar.value = raw;
      }
      return;
    }

    if (inFormula || inEditor) return;
    if (editing) return;

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "ArrowUp") moveSelection(-1, 0);
      if (event.key === "ArrowDown") moveSelection(1, 0);
      if (event.key === "ArrowLeft") moveSelection(0, -1);
      if (event.key === "ArrowRight") moveSelection(0, 1);
      return;
    }
    if (event.key === "F2") {
      event.preventDefault();
      beginEdit();
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      setRaw(selected, "");
      formulaBar.value = "";
      return;
    }
    if (event.key.length === 1 && !modifier && !event.altKey) {
      event.preventDefault();
      beginEdit(event.key, true);
    }
  });

  // Keep the selection visible after viewport or window changes.
  window.addEventListener("resize", () => {
    cellElements.get(selected)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
})();
</script>
</body>
</html>
```