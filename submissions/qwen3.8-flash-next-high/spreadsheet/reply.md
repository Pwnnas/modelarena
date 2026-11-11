```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Gridcalc — spreadsheet engine</title>
<style>
  * { box-sizing: border-box; }
  html, body {
    height: 100%;
    margin: 0;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #202124;
    background: #fff;
  }
  #app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    min-height: 0;
  }
  #toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-bottom: 1px solid #dadce0;
    background: #fff;
    flex: 0 0 auto;
  }
  .brand {
    font-weight: 700;
    font-size: 14px;
    color: #1a73e8;
    letter-spacing: -0.2px;
    padding-right: 6px;
    user-select: none;
  }
  #addr-box {
    width: 64px;
    text-align: center;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    padding: 5px 6px;
    border: 1px solid #dadce0;
    border-radius: 3px;
    background: #f8f9fa;
    color: #202124;
  }
  .fx {
    font-style: italic;
    color: #5f6368;
    font-size: 12px;
    user-select: none;
  }
  #formula-bar {
    flex: 1 1 auto;
    min-width: 120px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 13px;
    padding: 5px 8px;
    border: 1px solid #dadce0;
    border-radius: 3px;
    background: #fff;
    color: #202124;
  }
  #formula-bar:focus {
    outline: none;
    border-color: #1a73e8;
    box-shadow: 0 0 0 2px rgba(26,115,232,0.18);
  }
  #grid-wrap {
    --roww: 44px;
    --colw: 58px;
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    position: relative;
    background: #fff;
  }
  table {
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    font-variant-numeric: tabular-nums;
  }
  th {
    position: sticky;
    background: #f8f9fa;
    color: #5f6368;
    font-weight: 600;
    font-size: 12px;
    border-right: 1px solid #dadce0;
    border-bottom: 1px solid #dadce0;
    text-align: center;
    user-select: none;
  }
  thead th {
    top: 0;
    height: 26px;
    width: var(--colw);
    z-index: 3;
  }
  th.corner {
    top: 0;
    left: 0;
    width: var(--roww);
    height: 26px;
    z-index: 5;
  }
  tbody th {
    left: 0;
    width: var(--roww);
    z-index: 2;
  }
  th.col-selected,
  th.row-selected {
    background: #e8f0fe !important;
    color: #1967d2 !important;
  }
  td {
    width: var(--colw);
    height: 24px;
    border-right: 1px solid #dadce0;
    border-bottom: 1px solid #dadce0;
    background: #fff;
    color: #202124;
    font-size: 12px;
    padding: 0 4px;
    overflow: hidden;
    white-space: pre;
  }
  td.numeric {
    text-align: right;
  }
  td.error {
    background: #fce8e6;
    color: #c5221f;
  }
  td.selected {
    background: #e8f0fe;
    box-shadow: inset 0 0 0 2px #1a73e8;
  }
  td.ref-highlight {
    background: #fff7cc;
    box-shadow: inset 0 0 0 1px #f4b400;
  }
  #editor {
    position: fixed;
    display: none;
    z-index: 100;
    border: 2px solid #1a73e8;
    background: #fff;
    color: #202124;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    padding: 0 4px;
    outline: none;
    white-space: pre;
    overflow: hidden;
    box-sizing: border-box;
  }
  #status {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 4px 10px;
    border-top: 1px solid #dadce0;
    background: #f8f9fa;
    color: #5f6368;
    font-size: 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    white-space: nowrap;
    flex: 0 0 auto;
  }
  #status .sep { flex: 1; }
  #status .hint {
    color: #70757a;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    font-size: 11px;
    opacity: 0.9;
  }
</style>
</head>
<body>
<div id="app">
  <header id="toolbar">
    <div class="brand">Gridcalc</div>
    <div id="addr-box">A1</div>
    <label class="fx">fx</label>
    <input id="formula-bar" autocomplete="off" spellcheck="false" autocapitalize="off" autocorrect="off">
  </header>
  <main id="grid-wrap"></main>
  <footer id="status">
    <span id="status-selected"></span>
    <span id="status-value"></span>
    <span id="status-count"></span>
    <span id="status-sum"></span>
    <span class="sep"></span>
    <span class="hint">Type: edit · Enter: commit · Esc: cancel · Delete: clear · Ctrl/Cmd C/X/V: copy/cut/paste</span>
  </footer>
  <input id="editor" autocomplete="off" spellcheck="false" autocapitalize="off" autocorrect="off">
</div>
<script>
(function () {
  "use strict";

  const COLS = 26;
  const ROWS = 100;
  const HEADER_W = 44;
  const STORE_KEY = "gridcalc.cells.v1";

  const ERR_DIV = "#DIV/0!";
  const ERR_VALUE = "#VALUE!";
  const ERR_REF = "#REF!";
  const ERR_PARSE = "#ERROR!";
  const ERR_CYCLE = "#CYCLE!";

  const COMP_OPS = new Set(["=", "<>", "<", ">", "<=", ">="]);
  const KNOWN_FUNCTIONS = new Set([
    "SUM", "AVERAGE", "MIN", "MAX", "COUNT", "IF", "ABS", "ROUND"
  ]);

  const cellMap = new Map();
  const dependents = new Map();
  const cellElements = new Map();
  const colHeaders = new Map();
  const rowHeaders = new Map();

  const highlighted = new Set();
  let highlightTimer = null;

  let gridWrap;
  let formulaBar;
  let editor;
  let addrBox;
  let statusSelected;
  let statusValue;
  let statusCount;
  let statusSum;
  let tableEl = null;
  let cornerHeader = null;

  let selected = "A1";
  let selectedEl = null;
  let selectedRowHeader = null;
  let selectedColHeader = null;

  let editing = false;
  let clipboard = { raw: "", addr: null, ast: null };

  let layoutQueued = false;

  /* ---------- address helpers ---------- */

  function colLabel(c) {
    let s = "";
    while (c > 0) {
      c--;
      s = String.fromCharCode(65 + (c % 26)) + s;
      c = Math.floor(c / 26);
    }
    return s || "A";
  }

  function makeAddr(c, r) {
    return colLabel(c) + r;
  }

  function parseColLabel(letters) {
    let c = 0;
    for (const ch of letters) {
      const v = ch.toUpperCase().charCodeAt(0) - 64;
      c = c * 26 + v;
    }
    return c;
  }

  function parseAddressStr(addr) {
    if (typeof addr !== "string") return null;
    const m = /^([A-Za-z]{1,2})(\d+)$/.exec(addr);
    if (!m) return null;
    const c = parseColLabel(m[1]);
    const r = parseInt(m[2], 10);
    return {
      c,
      r,
      valid: c >= 1 && c <= COLS && r >= 1 && r <= ROWS
    };
  }

  function isValidGridColRow(c, r) {
    return c >= 1 && c <= COLS && r >= 1 && r <= ROWS;
  }

  function isValidAddress(addr) {
    const p = parseAddressStr(addr);
    return !!(p && p.valid);
  }

  function parseRefTokenText(raw) {
    if (typeof raw !== "string" || !raw) return null;
    let i = 0;
    let ac = false;
    let ar = false;

    if (raw[i] === "$") {
      ac = true;
      i++;
    }

    const letterStart = i;
    while (i < raw.length && /[A-Za-z]/.test(raw[i])) i++;
    const letters = raw.slice(letterStart, i).toUpperCase();
    if (!letters || letters.length > 2) return null;

    if (raw[i] === "$") {
      ar = true;
      i++;
    }

    const digits = raw.slice(i);
    if (!/^\d+$/.test(digits)) return null;

    const c = parseColLabel(letters);
    const r = parseInt(digits, 10);
    return { c, r, ac, ar };
  }

  function normalizeOutRef(c, r) {
    if (r < 1) return { c: 1, r: 0 };
    if (r > ROWS) return { c: 1, r: ROWS + 1 };
    if (c < 1) return { c: 1, r: 1 };
    if (c > COLS) return { c: COLS + 1, r: 1 };
    return { c, r };
  }

  function refToString(c, r, ac, ar) {
    const n = normalizeOutRef(c, r);
    const label = colLabel(n.c);
    return (ac ? "$" : "") + label + (ar ? "$" : "") + n.r;
  }

  /* ---------- text / number utilities ---------- */

  function isWordChar(ch) {
    return (
      (ch >= "0" && ch <= "9") ||
      (ch >= "A" && ch <= "Z") ||
      (ch >= "a" && ch <= "z") ||
      ch === "_" ||
      ch === "$"
    );
  }

  const REF_RE = /\$?[A-Za-z]{1,2}\$?\d+(?![A-Za-z0-9_$])/y;
  const NUM_RE = /(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/y;

  function isNumberString(s) {
    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(s);
  }

  function normalizeInputRaw(raw) {
    if (typeof raw !== "string") return "";
    if (raw === "") return "";

    if (/^\s*=/.test(raw)) {
      raw = raw.trim();
      return raw;
    }

    const trimmed = raw.trim();
    if (isNumberString(trimmed)) return trimmed;
    if (/^true$/i.test(trimmed)) return "TRUE";
    if (/^false$/i.test(trimmed)) return "FALSE";

    return raw;
  }

  function isError(v) {
    return !!v && typeof v === "object" && typeof v.err === "string";
  }

  function err(code) {
    return { err: code };
  }

  function formatNumber(n) {
    if (!Number.isFinite(n)) return ERR_VALUE;
    if (n === 0 || Object.is(n, -0)) return "0";

    let s;
    try {
      s = n.toPrecision(10);
    } catch (e) {
      return String(n);
    }

    let neg = false;
    if (s.charAt(0) === "-") {
      neg = true;
      s = s.slice(1);
    }

    if (/e/i.test(s)) {
      const parts = s.split(/[eE]/);
      let mant = parts[0];
      const exp = parseInt(parts[1], 10);
      mant = mant.replace(/0+$/, "");
      if (!mant || mant === ".") return "0";
      if (mant === "0") return "0";
      const out = mant + "e" + exp;
      return neg ? "-" + out : out;
    }

    if (s.indexOf(".") !== -1) {
      s = s.replace(/0+$/, "").replace(/\.$/, "");
    }

    if (s === "" || s === "." || s === "0") return "0";
    return neg ? "-" + s : s;
  }

  function formatValue(v) {
    if (v === undefined || v === null) return "";
    if (isError(v)) return v.err;
    if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
    if (typeof v === "number") return formatNumber(v);
    if (typeof v === "string") return v;
    return String(v);
  }

  /* ---------- grid construction ---------- */

  function buildGrid() {
    tableEl = document.createElement("table");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    cornerHeader = document.createElement("th");
    cornerHeader.className = "corner";
    cornerHeader.textContent = "";
    headerRow.appendChild(cornerHeader);

    for (let c = 1; c <= COLS; c++) {
      const label = colLabel(c);
      const th = document.createElement("th");
      th.className = "col-header";
      th.dataset.col = label;
      th.textContent = label;
      headerRow.appendChild(th);
      colHeaders.set(label, th);
    }

    thead.appendChild(headerRow);
    tableEl.appendChild(thead);

    const tbody = document.createElement("tbody");

    for (let r = 1; r <= ROWS; r++) {
      const tr = document.createElement("tr");

      const rh = document.createElement("th");
      rh.className = "row-header";
      rh.dataset.row = String(r);
      rh.textContent = String(r);
      tr.appendChild(rh);
      rowHeaders.set(String(r), rh);

      for (let c = 1; c <= COLS; c++) {
        const addr = makeAddr(c, r);
        const td = document.createElement("td");
        td.className = "cell";
        td.dataset.cell = addr;
        cellElements.set(addr, td);
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }

    tableEl.appendChild(tbody);
    gridWrap.appendChild(tableEl);
    layoutColumns();
  }

  function layoutColumns() {
    if (!gridWrap || !tableEl) return;
    const avail = Math.max(0, gridWrap.clientWidth - HEADER_W - 2);
    let colw = Math.floor(avail / COLS);
    colw = Math.max(46, Math.min(90, colw));

    gridWrap.style.setProperty("--colw", colw + "px");
    tableEl.style.width = (HEADER_W + COLS * colw) + "px";

    if (editing) {
      requestAnimationFrame(positionEditor);
    } else if (selected) {
      requestAnimationFrame(() => ensureVisible(selected));
    }
  }

  /* ---------- selection ---------- */

  function ensureVisible(addr) {
    const td = cellElements.get(addr);
    if (!td) return;

    const wrapRect = gridWrap.getBoundingClientRect();
    const tdRect = td.getBoundingClientRect();

    const hdrW = cornerHeader ? cornerHeader.getBoundingClientRect().width : HEADER_W;
    const hdrH = cornerHeader ? cornerHeader.getBoundingClientRect().height : 26;

    let dLeft = 0;
    let dTop = 0;

    const leftEdge = wrapRect.left + hdrW;
    const topEdge = wrapRect.top + hdrH;

    if (tdRect.left < leftEdge) dLeft = tdRect.left - leftEdge;
    else if (tdRect.right > wrapRect.right) dLeft = tdRect.right - wrapRect.right;

    if (tdRect.top < topEdge) dTop = tdRect.top - topEdge;
    else if (tdRect.bottom > wrapRect.bottom) dTop = tdRect.bottom - wrapRect.bottom;

    if (dLeft) gridWrap.scrollLeft += dLeft;
    if (dTop) gridWrap.scrollTop += dTop;
  }

  function clearSelectionDom() {
    if (selectedEl) {
      selectedEl.removeAttribute("aria-selected");
      selectedEl.classList.remove("selected");
    }
    if (selectedRowHeader) selectedRowHeader.classList.remove("row-selected");
    if (selectedColHeader) selectedColHeader.classList.remove("col-selected");
  }

  function selectCell(addr, scroll = true) {
    if (editing) commitEdit({ move: false });

    const p = parseAddressStr(addr);
    if (!p || !p.valid) return;

    clearSelectionDom();

    selected = addr;
    selectedEl = cellElements.get(addr);
    if (!selectedEl) return;

    selectedEl.setAttribute("aria-selected", "true");
    selectedEl.classList.add("selected");

    selectedRowHeader = rowHeaders.get(String(p.r));
    selectedColHeader = colHeaders.get(colLabel(p.c));

    if (selectedRowHeader) selectedRowHeader.classList.add("row-selected");
    if (selectedColHeader) selectedColHeader.classList.add("col-selected");

    addrBox.textContent = selected;
    cancelHighlightTimer();
    clearHighlights();

    updateFormulaBar();
    updateStatus();

    if (scroll) ensureVisible(selected);
  }

  function moveSelection(dr, dc) {
    if (!selected) return;
    const p = parseAddressStr(selected);
    if (!p || !p.valid) return;

    const c = Math.max(1, Math.min(COLS, p.c + dc));
    const r = Math.max(1, Math.min(ROWS, p.r + dr));

    selectCell(makeAddr(c, r), true);
  }

  function getRaw(addr) {
    const cell = cellMap.get(addr);
    return cell ? cell.raw : "";
  }

  function updateFormulaBar() {
    formulaBar.value = selected ? getRaw(selected) : "";
  }

  function updateStatus() {
    if (!selected) {
      statusSelected.textContent = "";
      statusValue.textContent = "";
      statusCount.textContent = "";
      statusSum.textContent = "";
      return;
    }

    const cell = cellMap.get(selected);
    const val = cell ? cell.value : undefined;
    const disp = formatValue(val);

    let sum = 0;
    let count = 0;

    if (typeof val === "number" && Number.isFinite(val)) {
      sum = val;
      count = 1;
    }

    statusSelected.textContent = "Selected " + selected;
    statusValue.textContent = "Value " + (disp === "" ? "(empty)" : disp);
    statusCount.textContent = "COUNT " + count;
    statusSum.textContent = "SUM " + formatNumber(sum);
  }

  /* ---------- DOM value rendering ---------- */

  function updateCellDom(addr) {
    const td = cellElements.get(addr);
    if (!td) return;

    const cell = cellMap.get(addr);
    const val = cell ? cell.value : undefined;
    const text = formatValue(val);

    if (td.textContent !== text) td.textContent = text;

    const numeric = typeof val === "number" && Number.isFinite(val);
    const asText = typeof val === "string" || typeof val === "boolean";
    const error = isError(val);

    td.classList.toggle("numeric", numeric);
    td.classList.toggle("text", asText);
    td.classList.toggle("error", error);

    if (error) td.setAttribute("title", "Error: " + val.err);
    else td.removeAttribute("title");
  }

  /* ---------- formula parsing ---------- */

  function tokenize(src) {
    const tokens = [];
    let i = 0;

    while (i < src.length) {
      while (i < src.length && /\s/.test(src[i])) i++;
      if (i >= src.length) break;

      const c = src[i];

      if (c === '"') {
        let val = "";
        let closed = false;
        i++;
        while (i < src.length) {
          if (src[i] === '"') {
            if (src[i + 1] === '"') {
              val += '"';
              i += 2;
            } else {
              closed = true;
              i++;
              break;
            }
          } else {
            val += src[i];
            i++;
          }
        }
        if (!closed) throw new Error("unterminated string");
        tokens.push({ type: "str", value: val });
        continue;
      }

      if (/[0-9.]/.test(c)) {
        NUM_RE.lastIndex = i;
        const m = NUM_RE.exec(src);
        if (m && m.index === i) {
          tokens.push({ type: "num", value: m[0] });
          i += m[0].length;
          continue;
        }
        throw new Error("bad number");
      }

      if (c === "$" || /[A-Za-z]/.test(c)) {
        REF_RE.lastIndex = i;
        const m = REF_RE.exec(src);
        if (m && m.index === i) {
          const parsed = parseRefTokenText(m[0]);
          if (!parsed) throw new Error("bad reference");
          tokens.push({
            type: "ref",
            c: parsed.c,
            r: parsed.r,
            ac: parsed.ac,
            ar: parsed.ar,
            raw: m[0]
          });
          i += m[0].length;
          continue;
        }

        const start = i;
        while (i < src.length && isWordChar(src[i])) i++;
        const word = src.slice(start, i);
        if (!word) throw new Error("bad token");

        const upper = word.toUpperCase();
        if (upper === "TRUE") {
          tokens.push({ type: "bool", value: true });
        } else if (upper === "FALSE") {
          tokens.push({ type: "bool", value: false });
        } else {
          tokens.push({ type: "name", name: upper });
        }
        continue;
      }

      if (c === "<") {
        if (src[i + 1] === ">") {
          tokens.push({ type: "op", value: "<>" });
          i += 2;
        } else if (src[i + 1] === "=") {
          tokens.push({ type: "op", value: "<=" });
          i += 2;
        } else {
          tokens.push({ type: "op", value: "<" });
          i++;
        }
        continue;
      }

      if (c === ">") {
        if (src[i + 1] === "=") {
          tokens.push({ type: "op", value: ">=" });
          i += 2;
        } else {
          tokens.push({ type: "op", value: ">" });
          i++;
        }
        continue;
      }

      if (c === "=" || c === "&" || c === "+" || c === "-" || c === "*" || c === "/" || c === "^") {
        tokens.push({ type: "op", value: c });
        i++;
        continue;
      }

      if (c === "(" || c === ")" || c === "," || c === ":") {
        tokens.push({ type: "punct", value: c });
        i++;
        continue;
      }

      throw new Error("bad character");
    }

    return tokens;
  }

  function parseFormula(raw) {
    if (typeof raw !== "string" || raw.charAt(0) !== "=") return null;

    const src = raw.slice(1).trim();
    if (!src) throw new Error("empty formula");

    const tokens = tokenize(src);
    if (!tokens.length) throw new Error("empty formula");

    let pos = 0;

    function peek() {
      return pos < tokens.length ? tokens[pos] : undefined;
    }

    function parseExpr() {
      return parseComparison();
    }

    function parseComparison() {
      let node = parseConcat();
      while (true) {
        const t = peek();
        if (!t || t.type !== "op" || !COMP_OPS.has(t.value)) break;
        const op = t.value;
        pos++;
        const right = parseConcat();
        node = { t: "bin", op, a: node, b: right };
      }
      return node;
    }

    function parseConcat() {
      let node = parseAdditive();
      while (true) {
        const t = peek();
        if (!t || t.type !== "op" || t.value !== "&") break;
        pos++;
        const right = parseAdditive();
        node = { t: "bin", op: "&", a: node, b: right };
      }
      return node;
    }

    function parseAdditive() {
      let node = parseMultiplicative();
      while (true) {
        const t = peek();
        if (!t || t.type !== "op" || (t.value !== "+" && t.value !== "-")) break;
        const op = t.value;
        pos++;
        const right = parseMultiplicative();
        node = { t: "bin", op, a: node, b: right };
      }
      return node;
    }

    function parseMultiplicative() {
      let node = parseUnary();
      while (true) {
        const t = peek();
        if (!t || t.type !== "op" || (t.value !== "*" && t.value !== "/")) break;
        const op = t.value;
        pos++;
        const right = parseUnary();
        node = { t: "bin", op, a: node, b: right };
      }
      return node;
    }

    function parseUnary() {
      const t = peek();
      if (t && t.type === "op" && (t.value === "+" || t.value === "-")) {
        pos++;
        const arg = parseUnary();
        return { t: "un", op: t.value, arg };
      }
      return parsePower();
    }

    function parsePower() {
      const left = parsePrimary();
      const t = peek();
      if (t && t.type === "op" && t.value === "^") {
        pos++;
        const right = parseUnary();
        return { t: "bin", op: "^", a: left, b: right };
      }
      return left;
    }

    function refNode(token) {
      return { t: "ref", c: token.c, r: token.r, ac: token.ac, ar: token.ar };
    }

    function parsePrimary() {
      const t = peek();
      if (!t) throw new Error("unexpected end");

      if (t.type === "num") {
        pos++;
        return { t: "num", v: Number(t.value), src: t.value };
      }

      if (t.type === "str") {
        pos++;
        return { t: "str", v: t.value };
      }

      if (t.type === "bool") {
        pos++;
        return { t: "bool", v: t.value };
      }

      if (t.type === "ref") {
        pos++;
        const first = refNode(t);
        const n = peek();
        if (n && n.type === "punct" && n.value === ":") {
          pos++;
          const n2 = peek();
          if (!n2 || n2.type !== "ref") throw new Error("bad range");
          pos++;
          return { t: "range", a: first, b: refNode(n2) };
        }
        return first;
      }

      if (t.type === "punct" && t.value === "(") {
        pos++;
        const inner = parseExpr();
        const close = peek();
        if (!close || close.type !== "punct" || close.value !== ")") throw new Error("unbalanced parentheses");
        pos++;
        return inner;
      }

      if (t.type === "name") {
        pos++;
        const open = peek();
        if (!open || open.type !== "punct" || open.value !== "(") throw new Error("unknown name");
        pos++;

        const args = [];

        const immediateClose = peek();
        if (immediateClose && immediateClose.type === "punct" && immediateClose.value === ")") {
          pos++;
          return { t: "func", name: t.name, args };
        }

        while (true) {
          args.push(parseExpr());
          const after = peek();
          if (!after) throw new Error("unterminated function");
          if (after.type === "punct" && after.value === ",") {
            pos++;
            continue;
          }
          if (after.type === "punct" && after.value === ")") {
            pos++;
            break;
          }
          throw new Error("bad function arguments");
        }

        return { t: "func", name: t.name, args };
      }

      throw new Error("unexpected token");
    }

    const ast = parseExpr();
    if (pos < tokens.length) throw new Error("trailing tokens");
    return ast;
  }

  /* ---------- dependency collection ---------- */

  function addValidDep(c, r, deps) {
    if (isValidGridColRow(c, r)) deps.add(makeAddr(c, r));
  }

  function rangeBounds(node) {
    const a = node.a;
    const b = node.b;
    if (!a || !b) return null;
    if (!isValidGridColRow(a.c, a.r) || !isValidGridColRow(b.c, b.r)) return null;

    const c1 = Math.max(1, Math.min(a.c, b.c));
    const c2 = Math.min(COLS, Math.max(a.c, b.c));
    const r1 = Math.max(1, Math.min(a.r, b.r));
    const r2 = Math.min(ROWS, Math.max(a.r, b.r));

    if (c1 > c2 || r1 > r2) return null;
    return { c1, c2, r1, r2 };
  }

  function collectDeps(node, deps) {
    if (!node) return;

    switch (node.t) {
      case "ref":
        addValidDep(node.c, node.r, deps);
        break;
      case "range": {
        const b = rangeBounds(node);
        if (!b) return;
        for (let r = b.r1; r <= b.r2; r++) {
          for (let c = b.c1; c <= b.c2; c++) {
            deps.add(makeAddr(c, r));
          }
        }
        break;
      }
      case "un":
        collectDeps(node.arg, deps);
        break;
      case "bin":
        collectDeps(node.a, deps);
        collectDeps(node.b, deps);
        break;
      case "func":
        for (const arg of node.args) collectDeps(arg, deps);
        break;
      default:
        break;
    }
  }

  /* ---------- cell storage / dependency graph ---------- */

  function addDependent(dep, addr) {
    if (!isValidAddress(dep)) return;
    let set = dependents.get(dep);
    if (!set) {
      set = new Set();
      dependents.set(dep, set);
    }
    set.add(addr);
  }

  function removeDependent(dep, addr) {
    const set = dependents.get(dep);
    if (!set) return;
    set.delete(addr);
    if (!set.size) dependents.delete(dep);
  }

  function removeCellDependencies(cell) {
    if (!cell || !cell.deps) return;
    for (const dep of cell.deps) removeDependent(dep, cell.address);
  }

  function parseStaticValue(raw) {
    if (raw === "") return undefined;

    if (isNumberString(raw)) {
      const n = Number(raw);
      if (Number.isFinite(n)) return n;
      return raw;
    }

    if (/^TRUE$/i.test(raw)) return true;
    if (/^FALSE$/i.test(raw)) return false;

    return raw;
  }

  function prepareCellRaw(addr, raw) {
    raw = normalizeInputRaw(raw);
    if (!isValidAddress(addr)) return;

    const old = cellMap.get(addr);
    if (old) removeCellDependencies(old);

    if (raw === "") {
      cellMap.delete(addr);
      return;
    }

    if (raw.charAt(0) === "=") {
      let ast = null;
      const deps = new Set();
      try {
        ast = parseFormula(raw);
        if (ast) collectDeps(ast, deps);
      } catch (e) {
        ast = null;
        deps.clear();
      }

      cellMap.set(addr, {
        address: addr,
        raw,
        ast,
        deps,
        value: ast ? undefined : err(ERR_PARSE)
      });

      for (const dep of deps) addDependent(dep, addr);
    } else {
      cellMap.set(addr, {
        address: addr,
        raw,
        ast: null,
        deps: new Set(),
        value: parseStaticValue(raw)
      });
    }
  }

  function setCellRaw(addr, raw, recalc = true) {
    raw = normalizeInputRaw(raw);
    if (!isValidAddress(addr)) return;

    const old = cellMap.get(addr);
    if (old && old.raw === raw) return;

    if (old) removeCellDependencies(old);

    if (raw === "") {
      cellMap.delete(addr);
      if (recalc) {
        recomputeAffected([addr]);
        saveCells();
      }
      return;
    }

    if (raw.charAt(0) === "=") {
      let ast = null;
      const deps = new Set();
      try {
        ast = parseFormula(raw);
        if (ast) collectDeps(ast, deps);
      } catch (e) {
        ast = null;
        deps.clear();
      }

      cellMap.set(addr, {
        address: addr,
        raw,
        ast,
        deps,
        value: ast ? undefined : err(ERR_PARSE)
      });

      for (const dep of deps) addDependent(dep, addr);
    } else {
      cellMap.set(addr, {
        address: addr,
        raw,
        ast: null,
        deps: new Set(),
        value: parseStaticValue(raw)
      });
    }

    if (recalc) {
      recomputeAffected([addr]);
      saveCells();
    }
  }

  /* ---------- evaluation ---------- */

  function getValue(addr) {
    const cell = cellMap.get(addr);
    if (!cell) return undefined;
    return cell.value;
  }

  function coerceNumber(v) {
    if (isError(v)) return v;
    if (v === undefined) return 0;
    if (typeof v === "number") {
      return Number.isFinite(v) ? v : err(ERR_VALUE);
    }
    if (typeof v === "boolean") return v ? 1 : 0;
    return err(ERR_VALUE);
  }

  function textValue(v) {
    if (v === undefined) return "";
    if (typeof v === "number") return formatNumber(v);
    if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
    if (typeof v === "string") return v;
    return "";
  }

  function typeRank(v) {
    if (typeof v === "string") return 1;
    if (v === undefined || typeof v === "number" || typeof v === "boolean") return 0;
    return "other";
  }

  function numericValue(v) {
    if (v === undefined) return 0;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (typeof v === "number") return v;
    return null;
  }

  function compareByOp(op, cmp) {
    if (op === "=") return cmp === 0;
    if (op === "<>") return cmp !== 0;
    if (op === "<") return cmp < 0;
    if (op === ">") return cmp > 0;
    if (op === "<=") return cmp <= 0;
    if (op === ">=") return cmp >= 0;
    return err(ERR_VALUE);
  }

  function compareValues(a, b, op) {
    if (isError(a)) return a;
    if (isError(b)) return b;

    const ta = typeRank(a);
    const tb = typeRank(b);

    if (ta === "other" || tb === "other") return err(ERR_VALUE);

    if (ta === 1 && tb === 1) {
      let cmp = 0;
      if (a < b) cmp = -1;
      else if (a > b) cmp = 1;
      return compareByOp(op, cmp);
    }

    if (ta === 1 || tb === 1) {
      if (op === "=") return false;
      if (op === "<>") return true;
      if (ta < tb) return op === "<" || op === "<=";
      if (ta > tb) return op === ">" || op === ">=";
    }

    const na = numericValue(a);
    const nb = numericValue(b);

    if (na === null || nb === null) return err(ERR_VALUE);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) return err(ERR_VALUE);

    let cmp = 0;
    if (na < nb) cmp = -1;
    else if (na > nb) cmp = 1;

    return compareByOp(op, cmp);
  }

  function evalRef(node) {
    if (!isValidGridColRow(node.c, node.r)) return err(ERR_REF);
    return getValue(makeAddr(node.c, node.r));
  }

  function evalRangeValues(node) {
    const b = rangeBounds(node);
    if (!b) return err(ERR_REF);

    const values = [];
    for (let r = b.r1; r <= b.r2; r++) {
      for (let c = b.c1; c <= b.c2; c++) {
        const v = getValue(makeAddr(c, r));
        if (isError(v)) return v;
        values.push(v);
      }
    }
    return values;
  }

  function evalValue(node) {
    switch (node.t) {
      case "num":
        return Number.isFinite(node.v) ? node.v : err(ERR_VALUE);

      case "str":
        return node.v;

      case "bool":
        return node.v;

      case "ref":
        return evalRef(node);

      case "range":
        return rangeBounds(node) ? err(ERR_VALUE) : err(ERR_REF);

      case "un": {
        const v = evalValue(node.arg);
        if (isError(v)) return v;
        const n = coerceNumber(v);
        if (isError(n)) return n;
        if (node.op === "-") {
          const res = -n;
          return Number.isFinite(res) ? res : err(ERR_VALUE);
        }
        return n;
      }

      case "bin": {
        const a = evalValue(node.a);
        if (isError(a)) return a;
        const b = evalValue(node.b);
        if (isError(b)) return b;

        const op = node.op;

        if (op === "&") {
          return textValue(a) + textValue(b);
        }

        if (COMP_OPS.has(op)) {
          return compareValues(a, b, op);
        }

        const n1 = coerceNumber(a);
        if (isError(n1)) return n1;
        const n2 = coerceNumber(b);
        if (isError(n2)) return n2;

        let res;
        if (op === "+") res = n1 + n2;
        else if (op === "-") res = n1 - n2;
        else if (op === "*") res = n1 * n2;
        else if (op === "/") {
          if (n2 === 0) return err(ERR_DIV);
          res = n1 / n2;
        } else if (op === "^") {
          if (n1 === 0 && n2 < 0) return err(ERR_DIV);
          res = Math.pow(n1, n2);
        } else {
          return err(ERR_VALUE);
        }

        return Number.isFinite(res) ? res : err(ERR_VALUE);
      }

      case "func":
        return evalFunction(node);

      default:
        return err(ERR_VALUE);
    }
  }

  function valueTruth(v) {
    if (isError(v)) return v;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") {
      if (!Number.isFinite(v)) return err(ERR_VALUE);
      return v !== 0;
    }
    if (v === undefined) return false;
    return err(ERR_VALUE);
  }

  function evalNumericArgs(args) {
    const nums = [];

    for (const arg of args) {
      let vals;

      if (arg.t === "range") {
        const r = evalRangeValues(arg);
        if (isError(r)) return { error: r };
        vals = r;
      } else {
        const v = evalValue(arg);
        if (isError(v)) return { error: v };
        vals = [v];
      }

      for (const v of vals) {
        if (isError(v)) return { error: v };
        if (typeof v === "number") {
          if (!Number.isFinite(v)) return { error: err(ERR_VALUE) };
          nums.push(v);
        }
      }
    }

    return { nums };
  }

  function evalFunction(node) {
    const name = node.name;
    if (!KNOWN_FUNCTIONS.has(name)) return err(ERR_PARSE);

    if (name === "IF") {
      if (node.args.length !== 3) return err(ERR_PARSE);
      const cond = valueTruth(evalValue(node.args[0]));
      if (isError(cond)) return cond;
      return evalValue(cond ? node.args[1] : node.args[2]);
    }

    if (name === "ABS") {
      if (node.args.length !== 1) return err(ERR_PARSE);
      const x = coerceNumber(evalValue(node.args[0]));
      if (isError(x)) return x;
      const res = Math.abs(x);
      return Number.isFinite(res) ? res : err(ERR_VALUE);
    }

    if (name === "ROUND") {
      if (node.args.length !== 2) return err(ERR_PARSE);
      const x = coerceNumber(evalValue(node.args[0]));
      if (isError(x)) return x;
      let d = coerceNumber(evalValue(node.args[1]));
      if (isError(d)) return d;
      if (!Number.isInteger(d)) return err(ERR_VALUE);

      if (x === 0) return 0;

      const factor = Math.pow(10, d);
      if (factor === 0) return 0;
      if (!Number.isFinite(factor)) return err(ERR_VALUE);

      const scaled = Math.abs(x) * factor;
      if (!Number.isFinite(scaled)) return err(ERR_VALUE);

      let rounded = Math.sign(x) * Math.round(scaled) / factor;
      if (Object.is(rounded, -0)) rounded = 0;
      return Number.isFinite(rounded) ? rounded : err(ERR_VALUE);
    }

    if (name === "SUM" || name === "AVERAGE" || name === "MIN" || name === "MAX" || name === "COUNT") {
      const res = evalNumericArgs(node.args);
      if (res.error) return res.error;

      const nums = res.nums;

      if (name === "COUNT") {
        return nums.length;
      }

      if (nums.length === 0) {
        if (name === "AVERAGE") return err(ERR_DIV);
        return 0;
      }

      if (name === "SUM") {
        let s = 0;
        for (const v of nums) {
          s += v;
          if (!Number.isFinite(s)) return err(ERR_VALUE);
        }
        return Number.isFinite(s) ? s : err(ERR_VALUE);
      }

      if (name === "AVERAGE") {
        let s = 0;
        for (const v of nums) {
          s += v;
          if (!Number.isFinite(s)) return err(ERR_VALUE);
        }
        const avg = s / nums.length;
        return Number.isFinite(avg) ? avg : err(ERR_VALUE);
      }

      if (name === "MIN") {
        let m = nums[0];
        for (let i = 1; i < nums.length; i++) if (nums[i] < m) m = nums[i];
        return Number.isFinite(m) ? m : err(ERR_VALUE);
      }

      if (name === "MAX") {
        let m = nums[0];
        for (let i = 1; i < nums.length; i++) if (nums[i] > m) m = nums[i];
        return Number.isFinite(m) ? m : err(ERR_VALUE);
      }
    }

    return err(ERR_PARSE);
  }

  function computeCellValue(addr) {
    const cell = cellMap.get(addr);
    if (!cell) return undefined;

    if (cell.raw && cell.raw.charAt(0) === "=") {
      if (!cell.ast) return err(ERR_PARSE);
      let v = evalValue(cell.ast);
      if (v === undefined) v = 0;
      return v;
    }

    return cell.value;
  }

  /* ---------- recalculation ---------- */

  function assignValue(addr, value) {
    const cell = cellMap.get(addr);
    if (!cell) return;
    cell.value = value;
  }

  function computeAndMark(addr, done) {
    done.add(addr);
    const v = computeCellValue(addr);
    assignValue(addr, v);
  }

  function recomputeAffected(starts) {
    const affected = new Set();
    const stack = [];

    for (const s of starts) {
      if (!affected.has(s)) {
        affected.add(s);
        stack.push(s);
      }
    }

    for (let i = 0; i < stack.length; i++) {
      const a = stack[i];
      const deps = dependents.get(a);
      if (!deps) continue;
      for (const d of deps) {
        if (!affected.has(d)) {
          affected.add(d);
          stack.push(d);
        }
      }
    }

    if (!affected.size) {
      for (const a of starts) updateCellDom(a);
      updateStatus();
      return;
    }

    const indeg = new Map();
    const ready = [];

    for (const addr of affected) {
      const cell = cellMap.get(addr);
      let cnt = 0;
      if (cell && cell.deps) {
        for (const dep of cell.deps) {
          if (affected.has(dep)) cnt++;
        }
      }
      indeg.set(addr, cnt);
      if (cnt === 0) ready.push(addr);
    }

    const done = new Set();

    for (let head = 0; head < ready.length; head++) {
      const addr = ready[head];
      if (done.has(addr)) continue;

      computeAndMark(addr, done);

      const deps = dependents.get(addr);
      if (!deps) continue;

      for (const dep of deps) {
        if (!affected.has(dep) || done.has(dep)) continue;
        const next = (indeg.get(dep) || 0) - 1;
        indeg.set(dep, next);
        if (next === 0) ready.push(dep);
      }
    }

    for (const addr of affected) {
      if (!done.has(addr)) {
        assignValue(addr, err(ERR_CYCLE));
      }
    }

    for (const addr of affected) updateCellDom(addr);
    updateStatus();
  }

  function recomputeAll() {
    const starts = Array.from(cellMap.keys());
    if (!starts.length) {
      updateStatus();
      return;
    }
    recomputeAffected(starts);
  }

  /* ---------- highlighting references while editing ---------- */

  function cancelHighlightTimer() {
    if (highlightTimer) {
      clearTimeout(highlightTimer);
      highlightTimer = null;
    }
  }

  function clearHighlights() {
    cancelHighlightTimer();
    for (const addr of highlighted) {
      const td = cellElements.get(addr);
      if (td) td.classList.remove("ref-highlight");
    }
    highlighted.clear();
  }

  function scheduleHighlight() {
    cancelHighlightTimer();
    highlightTimer = setTimeout(runHighlight, 70);
  }

  function runHighlight() {
    if (editing) {
      updateHighlightsFromText(editor.value);
    } else if (document.activeElement === formulaBar) {
      updateHighlightsFromText(formulaBar.value);
    } else {
      clearHighlights();
    }
  }

  function addHighlight(addr) {
    if (!isValidAddress(addr)) return;
    if (highlighted.has(addr)) return;
    const td = cellElements.get(addr);
    if (!td) return;
    td.classList.add("ref-highlight");
    highlighted.add(addr);
  }

  function addRefHighlight(refText) {
    const parsed = parseRefTokenText(refText);
    if (!parsed) return;
    if (!isValidGridColRow(parsed.c, parsed.r)) return;
    addHighlight(makeAddr(parsed.c, parsed.r));
  }

  function addRangeHighlight(ra, rb) {
    const a = parseRefTokenText(ra);
    const b = parseRefTokenText(rb);
    if (!a || !b) return;

    let c1 = Math.min(a.c, b.c);
    let c2 = Math.max(a.c, b.c);
    let r1 = Math.min(a.r, b.r);
    let r2 = Math.max(a.r, b.r);

    c1 = Math.max(1, c1);
    c2 = Math.min(COLS, c2);
    r1 = Math.max(1, r1);
    r2 = Math.min(ROWS, r2);

    if (c1 > c2 || r1 > r2) return;

    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        addHighlight(makeAddr(c, r));
      }
    }
  }

  function updateHighlightsFromText(text) {
    clearHighlights();

    if (!text || text.charAt(0) !== "=") return;

    let i = 1;
    while (i < text.length) {
      const c = text[i];

      if (c === '"') {
        i++;
        while (i < text.length) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') {
              i += 2;
            } else {
              i++;
              break;
            }
          } else {
            i++;
          }
        }
        continue;
      }

      if (c === "$" || /[A-Za-z]/.test(c)) {
        REF_RE.lastIndex = i;
        const m = REF_RE.exec(text);
        if (m && m.index === i) {
          const end = i + m[0].length;
          let j = end;
          while (j < text.length && /\s/.test(text[j])) j++;

          if (text[j] === ":") {
            let k = j + 1;
            while (k < text.length && /\s/.test(text[k])) k++;
            REF_RE.lastIndex = k;
            const m2 = REF_RE.exec(text);
            if (m2 && m2.index === k) {
              addRangeHighlight(m[0], m2[0]);
              i = k + m2[0].length;
              continue;
            }
          }

          addRefHighlight(m[0]);
          i = end;
          continue;
        }

        while (i < text.length && isWordChar(text[i])) i++;
        continue;
      }

      i++;
    }
  }

  /* ---------- editing ---------- */

  function positionEditor() {
    if (!editing) return;
    const td = cellElements.get(selected);
    if (!td) return;

    const rect = td.getBoundingClientRect();
    const maxRight = window.innerWidth - 8;

    let width = Math.max(rect.width, Math.min(300, maxRight - rect.left));
    if (width < rect.width) width = rect.width;

    let left = rect.left;
    let top = rect.top;

    if (left + width > maxRight) {
      left = Math.max(8, maxRight - width);
    }

    editor.style.left = left + "px";
    editor.style.top = top + "px";
    editor.style.width = width + "px";
    editor.style.height = rect.height + "px";
  }

  function showEditor() {
    editor.style.display = "block";
    positionEditor();
  }

  function hideEditor() {
    editor.style.display = "none";
    editor.value = "";
  }

  function beginEdit(mode, initialChar) {
    if (editing) return;
    if (!selected) return;

    ensureVisible(selected);

    const value = mode === "replace" ? initialChar : getRaw(selected);

    editing = true;
    editor.value = value;
    showEditor();

    editor.focus();
    editor.setSelectionRange(value.length, value.length);

    scheduleHighlight();
  }

  function cancelEdit() {
    if (!editing) return;
    editing = false;
    hideEditor();
    clearHighlights();
  }

  function commitEdit(opts) {
    if (!editing) return;

    const addr = selected;
    const raw = editor.value;

    editing = false;
    hideEditor();
    clearHighlights();

    setCellRaw(addr, raw, true);
    updateFormulaBar();

    if (opts && opts.move) {
      const p = parseAddressStr(addr);
      if (p && p.valid) {
        const c = Math.max(1, Math.min(COLS, p.c + (opts.dx || 0)));
        const r = Math.max(1, Math.min(ROWS, p.r + (opts.dy || 0)));
        selectCell(makeAddr(c, r), true);
      }
    }
  }

  /* ---------- copy / paste with relative-reference shifting ---------- */

  function copySelected() {
    if (!selected) return;
    const cell = cellMap.get(selected);
    clipboard = {
      raw: cell ? cell.raw : "",
      addr: selected,
      ast: cell ? cell.ast : null
    };
  }

  function shiftNode(node, dr, dc) {
    if (!node) return node;

    switch (node.t) {
      case "num":
        return { t: "num", v: node.v, src: node.src };
      case "str":
        return { t: "str", v: node.v };
      case "bool":
        return { t: "bool", v: node.v };

      case "ref": {
        const c = node.ac ? node.c : node.c + dc;
        const r = node.ar ? node.r : node.r + dr;
        const n = normalizeOutRef(c, r);
        return { t: "ref", c: n.c, r: n.r, ac: node.ac, ar: node.ar };
      }

      case "range":
        return {
          t: "range",
          a: shiftNode(node.a, dr, dc),
          b: shiftNode(node.b, dr, dc)
        };

      case "un":
        return { t: "un", op: node.op, arg: shiftNode(node.arg, dr, dc) };

      case "bin":
        return {
          t: "bin",
          op: node.op,
          a: shiftNode(node.a, dr, dc),
          b: shiftNode(node.b, dr, dc)
        };

      case "func":
        return {
          t: "func",
          name: node.name,
          args: node.args.map(a => shiftNode(a, dr, dc))
        };

      default:
        return node;
    }
  }

  function nodePrec(node) {
    if (node.t === "bin") {
      if (node.op === "^") return 6;
      if (node.op === "*" || node.op === "/") return 4;
      if (node.op === "+" || node.op === "-") return 3;
      if (node.op === "&") return 2;
      return 1;
    }
    if (node.t === "un") return 5;
    return 7;
  }

  function escapeString(s) {
    return '"' + String(s).replace(/"/g, '""') + '"';
  }

  function serializeChild(node, parentPrec, side, parentOp) {
    const str = serializeExpr(node);
    const cp = nodePrec(node);

    if (cp < parentPrec) return "(" + str + ")";

    if (cp === parentPrec) {
      const rightAssoc = parentOp === "^";
      if (side === "right" && !rightAssoc) return "(" + str + ")";
      if (side === "left" && rightAssoc) return "(" + str + ")";
    }

    return str;
  }

  function serializeExpr(node) {
    switch (node.t) {
      case "num":
        return node.src || formatNumber(node.v);
      case "str":
        return escapeString(node.v);
      case "bool":
        return node.v ? "TRUE" : "FALSE";
      case "ref":
        return refToString(node.c, node.r, node.ac, node.ar);
      case "range":
        return refToString(node.a.c, node.a.r, node.a.ac, node.a.ar) +
               ":" +
               refToString(node.b.c, node.b.r, node.b.ac, node.b.ar);
      case "un": {
        const inner = serializeChild(node.arg, 5, "child", node.op);
        return (node.op === "-" ? "-" : "+") + inner;
      }
      case "bin": {
        const p = nodePrec(node);
        const left = serializeChild(node.a, p, "left", node.op);
        const right = serializeChild(node.b, p, "right", node.op);
        return left + node.op + right;
      }
      case "func":
        return node.name + "(" + node.args.map(a => serializeExpr(a)).join(",") + ")";
      default:
        return "0";
    }
  }

  function shiftFormulaText(text, dr, dc) {
    let out = "";
    let i = 0;

    while (i < text.length) {
      const c = text[i];

      if (c === '"') {
        out += c;
        i++;
        while (i < text.length) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') {
              out += '""';
              i += 2;
              continue;
            } else {
              out += '"';
              i++;
              break;
            }
          } else {
            out += text[i];
            i++;
          }
        }
        continue;
      }

      if (c === "$" || /[A-Za-z]/.test(c)) {
        REF_RE.lastIndex = i;
        const m = REF_RE.exec(text);
        if (m && m.index === i) {
          const parsed = parseRefTokenText(m[0]);
          if (parsed) {
            const nc = parsed.ac ? parsed.c : parsed.c + dc;
            const nr = parsed.ar ? parsed.r : parsed.r + dr;
            out += refToString(nc, nr, parsed.ac, parsed.ar);
            i += m[0].length;
            continue;
          }
        }

        const start = i;
        while (i < text.length && isWordChar(text[i])) i++;
        out += text.slice(start, i);
        continue;
      }

      out += c;
      i++;
    }

    return out;
  }

  function pasteSelected() {
    if (!clipboard) return;
    if (!selected) return;

    let raw = clipboard.raw;
    const src = parseAddressStr(clipboard.addr || "");
    const dst = parseAddressStr(selected);
    if (!src || !dst) return;

    const dr = dst.r - src.r;
    const dc = dst.c - src.c;

    if (raw && raw.charAt(0) === "=") {
      if (dr === 0 && dc === 0) {
        // preserve exact raw when pasting into the same position
      } else if (clipboard.ast) {
        const shifted = shiftNode(clipboard.ast, dr, dc);
        raw = "=" + serializeExpr(shifted);
      } else {
        raw = "=" + shiftFormulaText(raw.slice(1), dr, dc);
      }
    }

    setCellRaw(selected, raw, true);
    updateFormulaBar();
  }

  /* ---------- keyboard input ---------- */

  function targetIsInput(t) {
    return !!t && (
      t.tagName === "INPUT" ||
      t.tagName === "TEXTAREA" ||
      t.tagName === "SELECT" ||
      t.isContentEditable === true
    );
  }

  function isPrintableKey(e) {
    return (
      typeof e.key === "string" &&
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    );
  }

  function handleEditorKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit({ move: true, dx: 0, dy: e.shiftKey ? -1 : 1 });
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      commitEdit({ move: true, dx: e.shiftKey ? -1 : 1, dy: 0 });
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
      return;
    }

    if (e.ctrlKey || e.metaKey) return;
  }

  function handleFormulaBarKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      setCellRaw(selected, formulaBar.value, true);
      updateFormulaBar();
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      formulaBar.value = getRaw(selected);
      return;
    }
  }

  function handleFallbackEditKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit({ move: true, dx: 0, dy: e.shiftKey ? -1 : 1 });
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      commitEdit({ move: true, dx: e.shiftKey ? -1 : 1, dy: 0 });
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
      return;
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      editor.value = editor.value.slice(0, -1);
      editor.focus();
      editor.setSelectionRange(editor.value.length, editor.value.length);
      scheduleHighlight();
      return;
    }

    if (isPrintableKey(e)) {
      e.preventDefault();
      editor.focus();
      const pos = editor.value.length;
      editor.value += e.key;
      editor.setSelectionRange(pos + 1, pos + 1);
      scheduleHighlight();
      return;
    }
  }

  function onKeyDown(e) {
    const t = e.target;

    if (t === editor) {
      handleEditorKey(e);
      return;
    }

    if (t === formulaBar) {
      if (editing) commitEdit({ move: false });
      handleFormulaBarKey(e);
      return;
    }

    if (targetIsInput(t)) return;

    if (editing) {
      handleFallbackEditKey(e);
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      const k = String(e.key).toLowerCase();
      if (k === "c") {
        e.preventDefault();
        copySelected();
        return;
      }
      if (k === "x") {
        e.preventDefault();
        copySelected();
        setCellRaw(selected, "", true);
        updateFormulaBar();
        return;
      }
      if (k === "v") {
        e.preventDefault();
        pasteSelected();
        return;
      }
      return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      setCellRaw(selected, "", true);
      updateFormulaBar();
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveSelection(0, -1);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveSelection(0, 1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection(-1, 0);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection(1, 0);
      return;
    }

    if (e.key === "F2") {
      e.preventDefault();
      beginEdit("existing");
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      moveSelection(0, e.shiftKey ? -1 : 1);
      return;
    }

    if (isPrintableKey(e)) {
      e.preventDefault();
      beginEdit("replace", e.key);
      return;
    }
  }

  /* ---------- persistence ---------- */

  function loadCells() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") return;

      for (const key of Object.keys(data)) {
        const addr = String(key).toUpperCase();
        const p = parseAddressStr(addr);
        if (!p || !p.valid) continue;
        prepareCellRaw(addr, String(data[key]));
      }
    } catch (e) {
      // ignore invalid storage
    }
  }

  function saveCells() {
    try {
      const out = {};
      cellMap.forEach((cell, addr) => {
        if (cell.raw) out[addr] = cell.raw;
      });

      if (Object.keys(out).length) {
        localStorage.setItem(STORE_KEY, JSON.stringify(out));
      } else {
        localStorage.removeItem(STORE_KEY);
      }
    } catch (e) {
      // ignore storage errors
    }
  }

  /* ---------- event wiring ---------- */

  function wireEvents() {
    window.addEventListener("keydown", onKeyDown);

    document.addEventListener("mousedown", e => {
      if (!editing) return;
      if (e.target === editor || editor.contains(e.target)) return;
      commitEdit({ move: false });
    });

    gridWrap.addEventListener("click", e => {
      const td = e.target.closest("td[data-cell]");
      if (!td) return;
      selectCell(td.dataset.cell, true);
    });

    gridWrap.addEventListener("dblclick", e => {
      const td = e.target.closest("td[data-cell]");
      if (!td) return;
      selectCell(td.dataset.cell, true);
      beginEdit("existing");
    });

    gridWrap.addEventListener("scroll", () => {
      if (editing) positionEditor();
    });

    editor.addEventListener("input", scheduleHighlight);

    editor.addEventListener("blur", () => {
      if (editing) commitEdit({ move: false });
    });

    formulaBar.addEventListener("input", scheduleHighlight);
    formulaBar.addEventListener("focus", scheduleHighlight);
    formulaBar.addEventListener("blur", () => {
      if (editing) return;
      clearHighlights();
    });

    window.addEventListener("resize", () => {
      if (!layoutQueued) {
        layoutQueued = true;
        requestAnimationFrame(() => {
          layoutQueued = false;
          layoutColumns();
        });
      }
    });

    window.addEventListener("beforeunload", saveCells);

    window.addEventListener("error", () => true);
  }

  /* ---------- initialization ---------- */

  function init() {
    gridWrap = document.getElementById("grid-wrap");
    formulaBar = document.getElementById("formula-bar");
    editor = document.getElementById("editor");
    addrBox = document.getElementById("addr-box");
    statusSelected = document.getElementById("status-selected");
    statusValue = document.getElementById("status-value");
    statusCount = document.getElementById("status-count");
    statusSum = document.getElementById("status-sum");

    buildGrid();
    loadCells();
    recomputeAll();
    selectCell("A1", false);
    wireEvents();
  }

  init();
})();
</script>
</body>
</html>
```