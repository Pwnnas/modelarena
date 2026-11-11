```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Gridcalc</title>
<style>
  html, body, #app { height: 100%; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #0f172a; background: #ffffff; }
  #app { display: flex; flex-direction: column; height: 100%; }

  #formula-bar-wrap { display: flex; align-items: center; gap: 10px; height: 36px; padding: 0 12px; border-bottom: 1px solid #e2e8f0; background: #ffffff; flex: none; }
  #cell-address { min-width: 46px; font-size: 12px; font-weight: 700; color: #64748b; text-align: right; }
  #formula-bar { flex: 1; height: 28px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0 10px; font-size: 13px; outline: none; background: #ffffff; color: #0f172a; }
  #formula-bar:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }

  #grid-scroll { flex: 1; overflow: auto; position: relative; background: #ffffff; }
  #grid-content { position: relative; width: 2390px; height: 2830px; }

  #col-headers { position: sticky; top: 0; z-index: 30; height: 30px; display: flex; width: 2390px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  .corner { position: sticky; top: 0; left: 0; z-index: 40; width: 50px; height: 30px; background: #f8fafc; border-right: 1px solid #e2e8f0; flex: none; }
  .col-h { width: 90px; height: 30px; flex: none; display: flex; align-items: center; padding: 0 8px; font-size: 11px; font-weight: 600; color: #64748b; background: #f8fafc; border-right: 1px solid #e2e8f0; user-select: none; }
  .col-h.sel { background: #dbeafe; color: #1d4ed8; }

  #row-headers { position: sticky; left: 0; z-index: 20; width: 50px; display: flex; flex-direction: column; background: #ffffff; border-right: 1px solid #e2e8f0; }
  .row-h { height: 28px; width: 50px; display: flex; align-items: center; padding: 0 8px; font-size: 11px; font-weight: 600; color: #64748b; background: #ffffff; border-bottom: 1px solid #e6eaf0; user-select: none; }
  .row-h.sel { background: #dbeafe; color: #1d4ed8; }

  .cell { position: absolute; width: 90px; height: 28px; padding: 4px 7px; box-sizing: border-box; border-right: 1px solid #e6eaf0; border-bottom: 1px solid #e6eaf0; font-size: 13px; line-height: 18px; white-space: nowrap; overflow: hidden; text-align: left; background: #ffffff; color: #0f172a; }
  .cell.num { text-align: right; }
  .cell.err { color: #dc2626; background: #fef8f8; }
  .cell.sel { background: #cfe0ff; box-shadow: inset 0 0 0 2px #2563eb; }
  .cell.ref { background: #fef3c7; box-shadow: inset 0 0 0 2px #f59e0b; }

  #cells-layer { position: absolute; top: 30px; left: 50px; }

  #status-bar { flex: none; height: 26px; border-top: 1px solid #e2e8f0; background: #f8fafc; display: flex; align-items: center; gap: 16px; padding: 0 12px; font-size: 12px; color: #64748b; }
  #status-bar b { color: #0f172a; }

  #cell-editor { position: absolute; z-index: 100; background: #ffffff; border: 1px solid #2563eb; outline: none; font-size: 13px; height: 28px; display: flex; align-items: center; padding: 0 6px; box-sizing: border-box; box-shadow: 0 6px 18px rgba(15, 23, 42, 0.2); border-radius: 2px; }
</style>
</head>
<body>
<div id="app">
  <div id="formula-bar-wrap">
    <span id="cell-address">A1</span>
    <input id="formula-bar" type="text" spellcheck="false" autocomplete="off" />
  </div>
  <div id="grid-scroll">
    <div id="grid-content">
      <div id="col-headers" class="sticky-top">
        <div class="corner"></div>
        <div class="col-h" data-col="A">A</div>
        <div class="col-h" data-col="B">B</div>
        <div class="col-h" data-col="C">C</div>
        <div class="col-h" data-col="D">D</div>
        <div class="col-h" data-col="E">E</div>
        <div class="col-h" data-col="F">F</div>
        <div class="col-h" data-col="G">G</div>
        <div class="col-h" data-col="H">H</div>
        <div class="col-h" data-col="I">I</div>
        <div class="col-h" data-col="J">J</div>
        <div class="col-h" data-col="K">K</div>
        <div class="col-h" data-col="L">L</div>
        <div class="col-h" data-col="M">M</div>
        <div class="col-h" data-col="N">N</div>
        <div class="col-h" data-col="O">O</div>
        <div class="col-h" data-col="P">P</div>
        <div class="col-h" data-col="Q">Q</div>
        <div class="col-h" data-col="R">R</div>
        <div class="col-h" data-col="S">S</div>
        <div class="col-h" data-col="T">T</div>
        <div class="col-h" data-col="U">U</div>
        <div class="col-h" data-col="V">V</div>
        <div class="col-h" data-col="W">W</div>
        <div class="col-h" data-col="X">X</div>
        <div class="col-h" data-col="Y">Y</div>
        <div class="col-h" data-col="Z">Z</div>
      </div>
      <div id="row-headers" class="sticky-left"></div>
      <div id="cells-layer"></div>
    </div>
  </div>
  <div id="status-bar"><span>SUM: <b id="status-sum">0</b></span><span>COUNT: <b id="status-count">0</b></span></div>
</div>
<input id="cell-editor" type="text" spellcheck="false" autocomplete="off" />

<script>
(function () {
  "use strict";

  var COLS = 26, ROWS = 100, COL_W = 90, ROW_H = 28, HDR_H = 30, ROW_HDR_W = 50;
  var STORAGE_KEY = "gridcalc.cells.v1";

  var cells = new Map();
  var values = new Map();
  var computed = new Set();
  var stack = [];
  var deps = new Map();
  var revDeps = new Map();
  var astCache = new Map();

  var editing = { active: false, addr: null, text: "", prevRaw: "", mode: "" };
  var sel = { row: 0, col: 0 };
  var clipboard = null;
  var dirtyList = [];

  var cellEls = new Map();
  var refHighlight = new Set();

  // ---------- address helpers ----------
  function colName(c) { return String.fromCharCode(65 + c); }
  function addrOf(r, c) { return colName(c) + (r + 1); }
  function colIdx(name) { var n = 0; for (var i = 0; i < name.length; i++) { n = n * 26 + (name.charCodeAt(i) - 64); } return n - 1; }
  function rowIdx(addr) { var m = /(\d+)$/.exec(addr); return parseInt(m[1], 10) - 1; }
  function colIdxOf(addr) { var m = /^([A-Za-z]+)/.exec(addr); return colIdx(m[1]); }

  function isAddrInGrid(col, row) { return col >= 0 && col < 26 && row >= 0 && row < 100; }

  // ---------- number formatting ----------
  function formatNumber(v) {
    if (typeof v !== "number" || isNaN(v) || !isFinite(v)) return String(v);
    if (Number.isInteger(v) && Math.abs(v) < 1e21) return String(v);
    var r = Number(v.toPrecision(10));
    return String(r);
  }
  function toDisplayString(v) {
    if (v instanceof Error) return v.message;
    if (typeof v === "number") return formatNumber(v);
    if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
    return v === null || v === undefined ? "" : String(v);
  }
  function toNum(v) {
    if (v instanceof Error) return v;
    if (typeof v === "number") return v;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (typeof v === "string") { if (v === "") return 0; return new Error("#VALUE!"); }
    return new Error("#VALUE!");
  }
  function truthy(v) {
    if (v instanceof Error) return v;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") return v !== "";
    return false;
  }

  // ---------- tokenizer ----------
  function tokenize(src) {
    var toks = [];
    var i = 0;
    var n = src.length;
    while (i < n) {
      var ch = src[i];
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") { i++; continue; }
      if ((ch >= "0" && ch <= "9") || ch === ".") {
        var j = i;
        if (src[j] === ".") { j++; while (j < n && src[j] >= "0" && src[j] <= "9") j++; }
        else { while (j < n && src[j] >= "0" && src[j] <= "9") j++; if (src[j] === ".") { j++; while (j < n && src[j] >= "0" && src[j] <= "9") j++; } }
        if (src[j] === "e" || src[j] === "E") { j++; if (src[j] === "+" || src[j] === "-") j++; while (j < n && src[j] >= "0" && src[j] <= "9") j++; }
        toks.push({ t: "num", v: src.slice(i, j) });
        i = j;
        continue;
      }
      if (ch === '"') {
        var j2 = i + 1;
        while (j2 < n && src[j2] !== '"') j2++;
        toks.push({ t: "str", v: src.slice(i + 1, j2) });
        i = j2 + 1;
        continue;
      }
      if ((ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z") || ch === "_") {
        var j3 = i;
        while (j3 < n && ((src[j3] >= "A" && src[j3] <= "Z") || (src[j3] >= "a" && src[j3] <= "z") || (src[j3] >= "0" && src[j3] <= "9") || src[j3] === "_")) j3++;
        var w = src.slice(i, j3);
        var m = /^(\$?)([A-Za-z]{1,2})(\$?)(\d+)$/.exec(w);
        if (m) {
          var col = colIdx(m[2]);
          var row = parseInt(m[4], 10) - 1;
          var cellTok = { t: "cell", col: col, row: row, absC: m[1] === "$", absR: m[3] === "$" };
          toks.push(cellTok);
          i = j3;
          if (src[i] === ":" && src[i + 1] && ((src[i + 1] >= "A" && src[i + 1] <= "Z") || (src[i + 1] >= "a" && src[i + 1] <= "z"))) {
            var j4 = i + 1;
            while (j4 < n && ((src[j4] >= "A" && src[j4] <= "Z") || (src[j4] >= "a" && src[j4] <= "z") || (src[j4] >= "0" && src[j4] <= "9"))) j4++;
            var w2 = src.slice(i + 1, j4);
            var m2 = /^(\$?)([A-Za-z]{1,2})(\$?)(\d+)$/.exec(w2);
            if (m2) {
              var cell2 = { t: "cell", col: colIdx(m2[2]), row: parseInt(m2[4], 10) - 1, absC: m2[1] === "$", absR: m2[3] === "$" };
              toks.push({ t: "range", c1: cellTok.col, r1: cellTok.row, c2: cell2.col, r2: cell2.row, absC1: cellTok.absC, absR1: cellTok.absR, absC2: cell2.absC, absR2: cell2.absR });
              i = j4;
              continue;
            }
          }
          continue;
        }
        var up = w.toUpperCase();
        if (up === "TRUE") { toks.push({ t: "bool", v: true }); i = j3; continue; }
        if (up === "FALSE") { toks.push({ t: "bool", v: false }); i = j3; continue; }
        toks.push({ t: "ident", v: up });
        i = j3;
        continue;
      }
      var two = src.slice(i, i + 2);
      if (two === "<>" || two === "<=" || two === ">=") { toks.push({ t: "op", v: two }); i += 2; continue; }
      if ("+-*/^&=<>(),:".indexOf(ch) !== -1) { toks.push({ t: "op", v: ch }); i++; continue; }
      i++;
    }
    return toks;
  }

  // ---------- parser ----------
  function parse(toks) {
    var pos = 0;
    function peek() { return toks[pos]; }
    function next() { return toks[pos++]; }
    function parseExpr() { return parseCmp(); }
    function parseCmp() {
      var l = parseConcat();
      var t = peek();
      if (t && t.t === "op" && (t.v === "=" || t.v === "<>" || t.v === "<" || t.v === ">" || t.v === "<=" || t.v === ">=")) {
        var op = next().v;
        var r = parseConcat();
        return { k: "bin", op: op, l: l, r: r };
      }
      return l;
    }
    function parseConcat() {
      var l = parseAdd();
      while (peek() && peek().t === "op" && peek().v === "&") { next(); var r = parseAdd(); l = { k: "bin", op: "&", l: l, r: r }; }
      return l;
    }
    function parseAdd() {
      var l = parseMul();
      while (peek() && peek().t === "op" && (peek().v === "+" || peek().v === "-")) { var op = next().v; var r = parseMul(); l = { k: "bin", op: op, l: l, r: r }; }
      return l;
    }
    function parseMul() {
      var l = parseUnary();
      while (peek() && peek().t === "op" && (peek().v === "*" || peek().v === "/")) { var op = next().v; var r = parseUnary(); l = { k: "bin", op: op, l: l, r: r }; }
      return l;
    }
    function parseUnary() {
      var t = peek();
      if (t && t.t === "op" && (t.v === "-" || t.v === "+")) { next(); var e = parseUnary(); return { k: "un", op: t.v, e: e }; }
      return parsePower();
    }
    function parsePower() {
      var l = parseAtom();
      var t = peek();
      if (t && t.t === "op" && t.v === "^") { next(); var r = parseUnary(); return { k: "bin", op: "^", l: l, r: r }; }
      return l;
    }
    function parseAtom() {
      var t = next();
      if (!t) throw new Error("parse");
      if (t.t === "num") return { k: "num", v: t.v };
      if (t.t === "str") return { k: "str", v: t.v };
      if (t.t === "bool") return { k: "bool", v: t.v };
      if (t.t === "cell") return { k: "ref", col: t.col, row: t.row, absC: t.absC, absR: t.absR };
      if (t.t === "range") return { k: "range", c1: t.c1, r1: t.r1, c2: t.c2, r2: t.r2, absC1: t.absC1, absR1: t.absR1, absC2: t.absC2, absR2: t.absR2 };
      if (t.t === "ident") {
        var name = t.v;
        if (peek() && peek().t === "op" && peek().v === "(") {
          next();
          var args = [];
          if (peek() && peek().t === "op" && peek().v === ")") { next(); return { k: "call", name: name, args: args }; }
          while (true) {
            var nt = peek();
            var nt2 = toks[pos + 1];
            if (nt && nt.t === "cell" && nt2 && nt2.t === "op" && nt2.v === ":" && toks[pos + 2] && toks[pos + 2].t === "cell") {
              next(); next(); next();
              var last = toks[pos - 1];
              args.push({ k: "range", c1: nt.col, r1: nt.row, c2: last.col, r2: last.row, absC1: nt.absC, absR1: nt.absR, absC2: last.absC, absR2: last.absR });
              if (peek() && peek().t === "op" && peek().v === ",") { next(); continue; }
              break;
            }
            args.push(parseExpr());
            if (peek() && peek().t === "op" && peek().v === ",") { next(); if (peek() && peek().t === "op" && peek().v === ")") { next(); break; } continue; }
            break;
          }
          var close = next();
          if (!close || close.t !== "op" || close.v !== ")") throw new Error("parse");
          return { k: "call", name: name, args: args };
        }
        if (name === "TRUE") return { k: "bool", v: true };
        if (name === "FALSE") return { k: "bool", v: false };
        throw new Error("parse");
      }
      if (t.t === "op" && t.v === "(") { next(); var e = parseExpr(); var c = next(); if (!c || c.t !== "op" || c.v !== ")") throw new Error("parse"); return e; }
      throw new Error("parse");
    }
    var e = parseExpr();
    if (pos !== toks.length) throw new Error("parse");
    return e;
  }

  function getAst(src) {
    var key = src;
    if (astCache.has(key)) return astCache.get(key);
    var ast = null;
    try {
      var toks = tokenize(src);
      if (toks.length > 0) ast = parse(toks);
    } catch (err) { ast = null; }
    astCache.set(key, ast);
    return ast;
  }

  // ---------- evaluation ----------
  function evalRef(n, cur) {
    var col = n.absC ? n.col : cur.col + n.col;
    var row = n.absR ? n.row : cur.row + n.row;
    if (!isAddrInGrid(col, row)) return new Error("#REF!");
    var addr = addrOf(row, col);
    return compute(addr);
  }
  function evalRangeNode(n, cur) {
    var c1 = n.absC1 ? n.c1 : cur.col + n.c1;
    var r1 = n.absR1 ? n.r1 : cur.row + n.r1;
    var c2 = n.absC2 ? n.c2 : cur.col + n.c2;
    var r2 = n.absR2 ? n.r2 : cur.row + n.r2;
    var cA = Math.min(c1, c2), cB = Math.max(c1, c2);
    var rA = Math.min(r1, r2), rB = Math.max(r1, r2);
    if (!isAddrInGrid(cA, rA) || !isAddrInGrid(cB, rB)) return new Error("#REF!");
    return { __range: true, c1: cA, r1: rA, c2: cB, r2: rB };
  }
  function rangeCells(n, cur) {
    var c1 = n.absC1 ? n.c1 : cur.col + n.c1;
    var r1 = n.absR1 ? n.r1 : cur.row + n.r1;
    var c2 = n.absC2 ? n.c2 : cur.col + n.c2;
    var r2 = n.absR2 ? n.r2 : cur.row + n.r2;
    var cA = Math.min(c1, c2), cB = Math.max(c1, c2);
    var rA = Math.min(r1, r2), rB = Math.max(r1, r2);
    if (!isAddrInGrid(cA, rA) || !isAddrInGrid(cB, rB)) return null;
    var out = [];
    for (var r = rA; r <= rB; r++) {
      for (var c = cA; c <= cB; c++) out.push(addrOf(r, c));
    }
    return out;
  }
  function evalNode(n, cur) {
    if (n.k === "num") return parseFloat(n.v);
    if (n.k === "str") return n.v;
    if (n.k === "bool") return n.v;
    if (n.k === "ref") return evalRef(n, cur);
    if (n.k === "range") return evalRangeNode(n, cur);
    if (n.k === "un") {
      var v = evalNode(n.e, cur);
      if (v instanceof Error) return v;
      var num = toNum(v);
      if (num instanceof Error) return num;
      return n.op === "-" ? -num : num;
    }
    if (n.k === "bin") {
      var op = n.op;
      if (op === "&") {
        var l = evalNode(n.l, cur);
        if (l instanceof Error) return l;
        var r = evalNode(n.r, cur);
        if (r instanceof Error) return r;
        var lt = toDisplayString(l);
        var rt = toDisplayString(r);
        return lt + rt;
      }
      var lv = evalNode(n.l, cur);
      if (lv instanceof Error) return lv;
      var rv = evalNode(n.r, cur);
      if (rv instanceof Error) return rv;
      if (op === "+" || op === "-" || op === "*" || op === "/" || op === "^") {
        var a = toNum(lv);
        if (a instanceof Error) return a;
        var b = toNum(rv);
        if (b instanceof Error) return b;
        if (op === "+") return a + b;
        if (op === "-") return a - b;
        if (op === "*") { var pr = a * b; return isFinite(pr) ? pr : new Error("#DIV/0!"); }
        if (op === "/") { if (b === 0) return new Error("#DIV/0!"); var qr = a / b; return isFinite(qr) ? qr : new Error("#DIV/0!"); }
        if (op === "^") { if (a === 0 && b < 0) return new Error("#DIV/0!"); var pw = Math.pow(a, b); return isFinite(pw) ? pw : new Error("#DIV/0!"); }
      }
      // comparisons
      var res;
      var c = compareVals(lv, rv);
      if (op === "=") res = c === 0;
      else if (op === "<>") res = c !== 0;
      else if (op === "<") res = c < 0;
      else if (op === ">") res = c > 0;
      else if (op === "<=") res = c <= 0;
      else if (op === ">=") res = c >= 0;
      return res;
    }
    if (n.k === "call") return evalCall(n.name, n.args, cur);
    return new Error("#ERROR!");
  }
  function compareVals(a, b) {
    if (typeof a === "number" && typeof b === "number") { return a < b ? -1 : (a > b ? 1 : 0); }
    var sa = toDisplayString(a);
    var sb = toDisplayString(b);
    if (sa < sb) return -1;
    if (sa > sb) return 1;
    return 0;
  }
  function evalCall(name, args, cur) {
    var up = (name || "").toUpperCase();
    if (up === "SUM") {
      var total = 0;
      for (var i = 0; i < args.length; i++) {
        var a = args[i];
        if (a.k === "range") {
          var cellsList = rangeCells(a, cur);
          if (cellsList === null) return new Error("#REF!");
          for (var j = 0; j < cellsList.length; j++) {
            var v = compute(cellsList[j]);
            if (v instanceof Error) return v;
            if (typeof v === "number") total += v;
          }
        } else {
          var av = evalNode(a, cur);
          if (av instanceof Error) return av;
          var an = toNum(av);
          if (an instanceof Error) return an;
          total += an;
        }
      }
      return total;
    }
    if (up === "AVERAGE") {
      var nums = [];
      for (var i = 0; i < args.length; i++) {
        var a2 = args[i];
        if (a2.k === "range") {
          var cl2 = rangeCells(a2, cur);
          if (cl2 === null) return new Error("#REF!");
          for (var j = 0; j < cl2.length; j++) {
            var v2 = compute(cl2[j]);
            if (v2 instanceof Error) return v2;
            if (typeof v2 === "number") nums.push(v2);
          }
        } else {
          var av2 = evalNode(a2, cur);
          if (av2 instanceof Error) return av2;
          var an2 = toNum(av2);
          if (an2 instanceof Error) return an2;
          nums.push(an2);
        }
      }
      if (nums.length === 0) return new Error("#DIV/0!");
      var s = 0; for (var k = 0; k < nums.length; k++) s += nums[k];
      return s / nums.length;
    }
    if (up === "MIN") {
      var mins = [];
      for (var i = 0; i < args.length; i++) {
        var a3 = args[i];
        if (a3.k === "range") {
          var cl3 = rangeCells(a3, cur);
          if (cl3 === null) return new Error("#REF!");
          for (var j = 0; j < cl3.length; j++) { var v3 = compute(cl3[j]); if (v3 instanceof Error) return v3; if (typeof v3 === "number") mins.push(v3); }
        } else { var av3 = evalNode(a3, cur); if (av3 instanceof Error) return av3; var an3 = toNum(av3); if (an3 instanceof Error) return an3; mins.push(an3); }
      }
      if (mins.length === 0) return 0;
      var mn = mins[0]; for (var q = 1; q < mins.length; q++) { if (mins[q] < mn) mn = mins[q]; }
      return mn;
    }
    if (up === "MAX") {
      var maxs = [];
      for (var i = 0; i < args.length; i++) {
        var a4 = args[i];
        if (a4.k === "range") {
          var cl4 = rangeCells(a4, cur);
          if (cl4 === null) return new Error("#REF!");
          for (var j = 0; j < cl4.length; j++) { var v4 = compute(cl4[j]); if (v4 instanceof Error) return v4; if (typeof v4 === "number") maxs.push(v4); }
        } else { var av4 = evalNode(a4, cur); if (av4 instanceof Error) return av4; var an4 = toNum(av4); if (an4 instanceof Error) return an4; maxs.push(an4); }
      }
      if (maxs.length === 0) return 0;
      var mx = maxs[0]; for (var q = 1; q < maxs.length; q++) { if (maxs[q] > mx) mx = maxs[q]; }
      return mx;
    }
    if (up === "COUNT") {
      var cnt = 0;
      for (var i = 0; i < args.length; i++) {
        var a5 = args[i];
        if (a5.k === "range") {
          var cl5 = rangeCells(a5, cur);
          if (cl5 === null) return new Error("#REF!");
          for (var j = 0; j < cl5.length; j++) { var v5 = compute(cl5[j]); if (v5 instanceof Error) return v5; if (typeof v5 === "number") cnt++; }
        } else { var av5 = evalNode(a5, cur); if (av5 instanceof Error) return av5; if (typeof av5 === "number") cnt++; }
      }
      return cnt;
    }
    if (up === "IF") {
      if (args.length < 1) return new Error("#ERROR!");
      var cond = evalNode(args[0], cur);
      if (cond instanceof Error) return cond;
      var take = truthy(cond);
      var branch = take ? (args[1] || { k: "num", v: "0" }) : (args[2] || { k: "num", v: "0" });
      return evalNode(branch, cur);
    }
    if (up === "ABS") {
      if (args.length < 1) return new Error("#ERROR!");
      var x = evalNode(args[0], cur);
      if (x instanceof Error) return x;
      var xn = toNum(x);
      if (xn instanceof Error) return xn;
      return Math.abs(xn);
    }
    if (up === "ROUND") {
      if (args.length < 1) return new Error("#ERROR!");
      var x2 = evalNode(args[0], cur);
      if (x2 instanceof Error) return x2;
      var xn2 = toNum(x2);
      if (xn2 instanceof Error) return xn2;
      var digits = 0;
      if (args.length > 1) { var d = evalNode(args[1], cur); if (d instanceof Error) return d; var dn = toNum(d); if (dn instanceof Error) return dn; digits = dn; }
      var p = Math.pow(10, digits);
      var r = Math.round(Math.abs(xn2) * p) / p;
      if (xn2 < 0) r = -r;
      return r;
    }
    return new Error("#ERROR!");
  }

  function evalRaw(raw, cur) {
    var r = raw || "";
    if (r.charAt(0) === "=") {
      var ast = getAst(r.slice(1));
      if (!ast) return new Error("#ERROR!");
      return evalNode(ast, cur);
    }
    var t = r.trim();
    if (t === "") return "";
    if (t === "TRUE") return true;
    if (t === "FALSE") return false;
    if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(t)) return parseFloat(t);
    return t;
  }

  function compute(addr) {
    if (computed.has(addr)) return values.get(addr);
    if (stack.indexOf(addr) !== -1) return new Error("#CYCLE!");
    stack.push(addr);
    var cur = { col: colIdxOf(addr), row: rowIdx(addr) };
    var raw = cells.get(addr) || "";
    var v = evalRaw(raw, cur);
    stack.pop();
    computed.add(addr);
    values.set(addr, v);
    return v;
  }

  function getDisplay(addr) {
    var v = compute(addr);
    if (v instanceof Error) return v.message;
    return toDisplayString(v);
  }

  // ---------- deps ----------
  function collectDeps(n, cur, out) {
    if (n.k === "ref") {
      var col = n.absC ? n.col : cur.col + n.col;
      var row = n.absR ? n.row : cur.row + n.row;
      if (isAddrInGrid(col, row)) out.add(addrOf(row, col));
    } else if (n.k === "range") {
      var c1 = n.absC1 ? n.c1 : cur.col + n.c1;
      var r1 = n.absR1 ? n.r1 : cur.row + n.r1;
      var c2 = n.absC2 ? n.c2 : cur.col + n.c2;
      var r2 = n.absR2 ? n.r2 : cur.row + n.r2;
      var cA = Math.min(c1, c2), cB = Math.max(c1, c2);
      var rA = Math.min(r1, r2), rB = Math.max(r1, r2);
      if (isAddrInGrid(cA, rA) && isAddrInGrid(cB, rB)) {
        for (var r = rA; r <= rB; r++) for (var c = cA; c <= cB; c++) out.add(addrOf(r, c));
      }
    } else if (n.k === "un") { collectDeps(n.e, cur, out); }
    else if (n.k === "bin") { collectDeps(n.l, cur, out); collectDeps(n.r, cur, out); }
    else if (n.k === "call") { for (var i = 0; i < n.args.length; i++) collectDeps(n.args[i], cur, out); }
  }

  function setCell(addr, raw) {
    cells.set(addr, raw);
    saveLocal();
    var old = deps.get(addr);
    if (old) { for (var i = 0; i < old.size; i++) { var d = old[i]; var s = revDeps.get(d); if (s) { s.delete(addr); if (s.size === 0) revDeps.delete(d); } } }
    var ast = (raw && raw.charAt(0) === "=") ? getAst(raw.slice(1)) : null;
    var newDeps = new Set();
    if (ast) { var curN = { col: colIdxOf(addr), row: rowIdx(addr) }; collectDeps(ast, curN, newDeps); }
    deps.set(addr, newDeps);
    for (var q = 0; q < newDeps.size; q++) { var nd = newDeps[q]; if (!revDeps.has(nd)) revDeps.set(nd, new Set()); revDeps.get(nd).add(addr); }
    var dirtySet = new Set([addr]);
    var queue = [addr];
    while (queue.length) {
      var curAddr = queue.shift();
      var ds = revDeps.get(curAddr);
      if (!ds) continue;
      var it = ds.values();
      var tmp;
      while (!(tmp = it.next()).done) { var d = tmp.value; if (!dirtySet.has(d)) { dirtySet.add(d); queue.push(d); } }
    }
    dirtyList = Array.from(dirtySet);
    for (var i2 = 0; i2 < dirtyList.length; i2++) { compute(dirtyList[i2]); renderCell(dirtyList[i2]); }
  }

  function clearCell(addr) { setCell(addr, ""); }

  // ---------- formatting / display ----------
  function fmtNum(v) { return formatNumber(v); }

  // ---------- rendering ----------
  function buildGrid() {
    var layer = document.getElementById("cells-layer");
    layer.innerHTML = "";
    for (var r = 0; r < 100; r++) {
      for (var c = 0; c < 26; c++) {
        var d = document.createElement("div");
        d.className = "cell";
        d.setAttribute("data-cell", colName(c) + (r + 1));
        d.setAttribute("aria-selected", "false");
        d.style.top = (HDR_H + r * ROW_H) + "px";
        d.style.left = (ROW_HDR_W + c * COL_W) + "px";
        layer.appendChild(d);
        cellEls.set(colName(c) + (r + 1), d);
      }
    }
    var rowHeaders = document.getElementById("row-headers");
    rowHeaders.innerHTML = "";
    for (var r2 = 0; r2 < 100; r2++) {
      var rd = document.createElement("div");
      rd.className = "row-h";
      rd.setAttribute("data-row", String(r2 + 1));
      rd.textContent = String(r2 + 1);
      rowHeaders.appendChild(rd);
    }
  }
  function renderCell(addr) {
    var el = cellEls.get(addr);
    if (!el) return;
    var disp = getDisplay(addr);
    el.textContent = disp;
    el.classList.remove("num", "text", "err", "bool");
    if (disp === "" ) { /* empty */ }
    else if (disp === "#DIV/0!" || disp === "#VALUE!" || disp === "#REF!" || disp === "#ERROR!" || disp === "#CYCLE!") { el.classList.add("err"); }
    else {
      var v = values.get(addr);
      if (typeof v === "number") el.classList.add("num");
      else if (typeof v === "boolean") el.classList.add("bool");
      else el.classList.add("text");
    }
    if (el.classList.contains("ref")) el.classList.add("ref");
  }
  function renderAll() { for (var key of cellEls.keys()) renderCell(key); }

  // ---------- selection ----------
  function getAddr(r, c) { return addrOf(r, c); }
  function setSelectedAddr(addr) {
    var r = rowIdx(addr);
    var c = colIdxOf(addr);
    sel.row = r; sel.col = c;
  }
  function selectAddr(addr) {
    setSelectedAddr(addr);
    var el = cellEls.get(addr);
    if (el) {
      for (var key of cellEls.keys()) {
        var e2 = cellEls.get(key);
        if (e2) e2.setAttribute("aria-selected", "false");
      }
      el.setAttribute("aria-selected", "true");
      el.classList.add("sel");
      clearRefHighlight();
    }
    updateHeaderSel();
    syncFormulaBar();
    updateStatus();
  }
  function clearCellSelClass() { for (var key of cellEls.keys()) { var e2 = cellEls.get(key); if (e2) e2.classList.remove("sel"); } }
  function updateHeaderSel() {
    var rowHdrs = document.querySelectorAll("#row-headers .row-h");
    for (var i = 0; i < rowHdrs.length; i++) { rowHdrs[i].classList.toggle("sel", i === sel.row); }
    var colHds = document.querySelectorAll("#col-headers .col-h");
    for (var j = 0; j < colHds.length; j++) { colHds[j].classList.toggle("sel", j === sel.col); }
  }

  // ---------- formula bar ----------
  var formulaBar = document.getElementById("formula-bar");
  var cellAddress = document.getElementById("cell-address");
  function syncFormulaBar() {
    var addr = addrOf(sel.row, sel.col);
    if (cellAddress) cellAddress.textContent = addr;
    if (formulaBar) formulaBar.value = cells.get(addr) || "";
  }
  function commitFromFormulaBar() {
    var addr = addrOf(sel.row, sel.col);
    setCell(addr, formulaBar ? formulaBar.value : "");
    editing.active = false;
    var ed = document.getElementById("cell-editor");
    if (ed) { ed.value = ""; ed.style.display = "none"; }
    syncFormulaBar();
    updateStatus();
  }

  // ---------- status bar ----------
  var statusSumEl = document.getElementById("status-sum");
  var statusCountEl = document.getElementById("status-count");
  function updateStatus() {
    var addr = addrOf(sel.row, sel.col);
    var v = compute(addr);
    var sum = 0, cnt = 0;
    if (!(v instanceof Error)) {
      if (typeof v === "number") { sum = v; cnt = 1; }
      else if (typeof v === "boolean") { cnt = 0; sum = 0; }
    }
    if (statusSumEl) statusSumEl.textContent = fmtNum(sum);
    if (statusCountEl) statusCountEl.textContent = String(cnt);
  }

  // ---------- editing ----------
  var overlay = document.getElementById("cell-editor");
  function ensureOverlay() {
    if (!overlay) return;
    overlay.style.display = "flex";
  }
  function hideOverlay() {
    if (overlay) { overlay.style.display = "none"; overlay.value = ""; }
  }
  function startEditingWithText(text) {
    editing.active = true;
    editing.addr = addrOf(sel.row, sel.col);
    editing.prevRaw = cells.get(editing.addr) || "";
    editing.text = text;
    editing.mode = "edit";
    ensureOverlay();
    overlay.value = text;
    overlay.setSelectionRange(text.length, text.length);
    overlay.style.display = "flex";
    overlay.style.top = (HDR_H + sel.row * ROW_H) + "px";
    overlay.style.left = (ROW_HDR_W + sel.col * COL_W) + "px";
    overlay.style.display = "flex";
    overlay.focus();
    if (formulaBar) formulaBar.value = text;
    clearRefHighlight();
    highlightRefs(text);
  }
  function startEditing() { startEditingWithText(cells.get(addrOf(sel.row, sel.col)) || ""); }
  function startEditReplace(ch) {
    var addr = addrOf(sel.row, sel.col);
    editing.active = true;
    editing.addr = addr;
    editing.prevRaw = cells.get(addr) || "";
    editing.text = ch;
    editing.mode = "replace";
    ensureOverlay();
    overlay.value = ch;
    overlay.setSelectionRange(1, 1);
    overlay.style.display = "flex";
    overlay.style.top = (HDR_H + sel.row * ROW_H) + "px";
    overlay.style.left = (ROW_HDR_W + sel.col * COL_W) + "px";
    overlay.focus();
    if (formulaBar) formulaBar.value = ch;
    highlightRefs(ch);
  }
  function cancelEditing() {
    editing.active = false;
    editing.addr = null;
    editing.text = "";
    editing.mode = "";
    hideOverlay();
    clearRefHighlight();
    syncFormulaBar();
  }
  function endEditing() {
    if (!editing.active) return;
    var addr = editing.addr;
    var text = editing.text;
    editing.active = false;
    editing.addr = null;
    editing.text = "";
    editing.mode = "";
    hideOverlay();
    clearRefHighlight();
    setCell(addr, text);
    syncFormulaBar();
    updateStatus();
  }
  function commitEditing() {
    var addr = editing.addr;
    var text = editing.text;
    var move = null;
    var key = arguments.length > 0 ? arguments[0] : null;
    if (key) {
      if (key === "enter") move = "down";
      else if (key === "tab") move = "right";
      else if (key === "shiftenter") move = "up";
      else if (key === "shifttab") move = "left";
    }
    editing.active = false;
    editing.addr = null;
    editing.text = "";
    editing.mode = "";
    hideOverlay();
    clearRefHighlight();
    setCell(addr, text);
    syncFormulaBar();
    updateStatus();
    if (move) moveSelectionBy(move);
  }
  function moveSelectionBy(dir) {
    var dr = 0, dc = 0;
    if (dir === "up") dr = -1;
    else if (dir === "down") dr = 1;
    else if (dir === "left") dc = -1;
    else if (dir === "right") dc = 1;
    var nr = sel.row + dr, nc = sel.col + dc;
    if (nr < 0) nr = 0; if (nr > 99) nr = 99;
    if (nc < 0) nc = 0; if (nc > 25) nc = 25;
    sel.row = nr; sel.col = nc;
    selectAddr(addrOf(nr, nc));
  }
  function moveSelection() { /* default none */ }

  // ---------- refs highlight ----------
  function clearRefHighlight() { refHighlight.clear(); var keys = Array.from(refHighlight.keys()); }
  function highlightRefs(text) {
    refHighlight.clear();
    for (var key of cellEls.keys()) cellEls.get(key).classList.remove("ref");
    if (editing.active && text && text.charAt(0) === "=") {
      var ast = getAst(text.slice(1));
      if (ast) {
        var found = new Set();
        (function walk(n, cur) {
          if (n.k === "ref") { var col = n.absC ? n.col : cur.col + n.col; var row = n.absR ? n.row : cur.row + n.row; if (isAddrInGrid(col, row)) found.add(addrOf(row, col)); }
          else if (n.k === "range") { var c1 = n.absC1 ? n.c1 : cur.col + n.c1; var r1 = n.absR1 ? n.r1 : cur.row + n.r1; var c2 = n.absC2 ? n.c2 : cur.col + n.c2; var r2 = n.absR2 ? n.r2 : cur.row + n.r2; var cA = Math.min(c1, c2), cB = Math.max(c1, c2); var rA = Math.min(r1, r2), rB = Math.max(r1, r2); if (isAddrInGrid(cA, rA) && isAddrInGrid(cB, rB)) { for (var r = rA; r <= rB; r++) for (var c = cA; c <= cB; c++) found.add(addrOf(r, c)); } }
          else if (n.k === "un") walk(n.e, cur);
          else if (n.k === "bin") { walk(n.l, cur); walk(n.r, cur); }
          else if (n.k === "call") { for (var i = 0; i < n.args.length; i++) walk(n.args[i], cur); }
        })(ast, { col: sel.col, row: sel.row });
        found.forEach(function (a) { refHighlight.add(a); var e = cellEls.get(a); if (e) e.classList.add("ref"); });
      }
    }
  }

  // ---------- clipboard ----------
  function doCopy() {
    var addr = addrOf(sel.row, sel.col);
    var raw = cells.get(addr) || "";
    clipboard = { raw: raw, addr: addr };
  }
  function doPaste() {
    if (!clipboard) return;
    var dest = addrOf(sel.row, sel.col);
    var src = clipboard.addr;
    var raw = clipboard.raw;
    var newRaw = raw;
    if (raw.charAt(0) === "=") {
      newRaw = shiftFormula(raw, src, dest);
    }
    setCell(dest, newRaw);
  }
  function shiftFormula(f, src, dest) {
    var sr = rowIdx(src), sc = colIdxOf(src);
    var dr = rowIdx(dest) - sr, dc = colIdxOf(dest) - sc;
    var toks = tokenize(f.slice(1));
    var out = [];
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (t.t === "cell") {
        var nc = t.absC ? t.col : t.col + dc;
        var nr = t.absR ? t.row : t.row + dr;
        out.push({ t: "cell", col: nc, row: nr, absC: t.absC, absR: t.absR });
      } else if (t.t === "range") {
        var nc1 = t.absC1 ? t.c1 : t.c1 + dc;
        var nr1 = t.absR1 ? t.r1 : t.r1 + dr;
        var nc2 = t.absC2 ? t.c2 : t.c2 + dc;
        var nr2 = t.absR2 ? t.r2 : t.r2 + dr;
        out.push({ t: "range", c1: nc1, r1: nr1, c2: nc2, r2: nr2, absC1: t.absC1, absR1: t.absR1, absC2: t.absC2, absR2: t.absR2 });
      } else out.push(t);
    var parts = [];
    for (var j = 0; j < out.length; j++) {
      var t2 = out[j];
      if (t2.t === "num") parts.push(t2.v);
      else if (t2.t === "str") parts.push('"' + t2.v + '"');
      else if (t2.t === "bool") parts.push(t2.v ? "TRUE" : "FALSE");
      else if (t2.t === "cell") { var cs = (t2.absC ? "$" : "") + colName(t2.col) + (t2.absR ? "$" : "") + (t2.row + 1); parts.push(cs); }
      else if (t2.t === "range") { var cs1 = (t2.absC1 ? "$" : "") + colName(t2.c1) + (t2.absR1 ? "$" : "") + (t2.r1 + 1); var cs2 = (t2.absC2 ? "$" : "") + colName(t2.c2) + (t2.absR2 ? "$" : "") + (t2.r2 + 1); parts.push(cs1 + ":" + cs2); }
      else if (t2.t === "ident") parts.push(t2.v);
      else if (t2.t === "op") parts.push(t2.v);
    }
    var shifted = "=" + parts.join("");
    return shifted;
  }

  // ---------- events ----------
  function onGridMouseDown(e) {
    var target = e.target;
    var el = target.closest ? target.closest("[data-cell]") : null;
    if (el) {
      var addr = el.getAttribute("data-cell");
      if (editing.active) commitEditing();
      selectAddr(addr);
      el.focus();
    } else {
      var rh = target.closest ? target.closest("[data-row]") : null;
      var ch = target.closest ? target.closest("[data-col]") : null;
      if (ch) { sel.col = parseInt(ch.getAttribute("data-col").charCodeAt(0) - 64, 10) - 1; selectAddr(addrOf(sel.row, sel.col)); }
      else if (rh) { sel.row = parseInt(rh.getAttribute("data-row"), 10) - 1; selectAddr(addrOf(sel.row, sel.col)); }
    }
  }
  function onFormulaBarMouseDown(e) { /* keep focus */ }
  function onOverlayKeyDown(e) {
    var key = e.key;
    if (e.ctrlKey || e.metaKey) { if (key.toLowerCase() === "c") { e.preventDefault(); doCopy(); } else if (key.toLowerCase() === "v") { e.preventDefault(); doPaste(); } return; }
    if (key === "Enter") { e.preventDefault(); commitEditing("enter"); }
    else if (key === "Tab") { e.preventDefault(); commitEditing("tab"); moveSelectionBy("right"); }
    else if (key === "Shift+Tab") { e.preventDefault(); commitEditing("shifttab"); moveSelectionBy("left"); }
    else if (key === "Escape") { e.preventDefault(); cancelEditing(); }
  }

  // ---------- init ----------
  function init() {
    buildGrid();
    var scroll = document.getElementById("grid-scroll");
    var formulaBarEl = document.getElementById("formula-bar");
    var overlayEl = document.getElementById("cell-editor");

    scroll.addEventListener("mousedown", function (e) {
      var t = e.target;
      var el = t && t.closest ? t.closest("[data-cell]") : null;
      if (el) {
        var addr = el.getAttribute("data-cell");
        if (editing.active) commitEditing();
        selectAddr(addr);
        try { el.focus(); } catch (err) {}
        return;
      }
    });
    document.addEventListener("keydown", function (e) {
      var key = e.key;
      var ae = document.activeElement;
      var inFb = ae && ae.id === "formula-bar";
      var inEd = ae && ae.id === "cell-editor";
      if (e.ctrlKey || e.metaKey) {
        var kl = key.toLowerCase();
        if (kl === "c") { e.preventDefault(); doCopy(); }
        else if (kl === "v") { e.preventDefault(); doPaste(); }
        return;
      }
      if (editing.active) {
        if (inEd || inFb) {
          if (key === "Enter") { e.preventDefault(); commitEditing("enter"); }
          else if (key === "Tab") { e.preventDefault(); commitEditing("tab"); moveSelectionBy("right"); }
          else if (key === "Shift+Tab") { e.preventDefault(); commitEditing("shifttab"); moveSelectionBy("left"); }
          else if (key === "Escape") { e.preventDefault(); cancelEditing(); }
          return;
        }
        if (key === "Enter") { e.preventDefault(); commitEditing("enter"); }
        else if (key === "Tab") { e.preventDefault(); commitEditing("tab"); moveSelectionBy("right"); }
        else if (key === "Shift+Tab") { e.preventDefault(); commitEditing("shifttab"); moveSelectionBy("left"); }
        else if (key === "Escape") { e.preventDefault(); cancelEditing(); }
        else if (key.length === 1) { /* ignore */ }
        return;
      }
      if (inFb) {
        if (key === "Enter") { e.preventDefault(); commitFromFormulaBar(); }
        else if (key === "Escape") { e.preventDefault(); syncFormulaBar(); }
        return;
      }
      if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        startEditReplace(key);
        return;
      }
      if (key === "F2") { e.preventDefault(); startEditing(); return; }
      if (key === "Enter") { e.preventDefault(); startEditing(); return; }
      if (key === "Tab") { e.preventDefault(); startEditing(); return; }
      if (key === "Backspace" || key === "Delete") { e.preventDefault(); clearCell(addrOf(sel.row, sel.col)); return; }
      if (key === "ArrowUp") { e.preventDefault(); moveSelectionBy("up"); return; }
      if (key === "ArrowDown") { e.preventDefault(); moveSelectionBy("down"); return; }
      if (key === "ArrowLeft") { e.preventDefault(); moveSelectionBy("left"); return; }
      if (key === "ArrowRight") { e.preventDefault(); moveSelectionBy("right"); return; }
    });
    if (overlay) {
      overlay.addEventListener("input", function () { editing.text = overlay.value; if (formulaBar) formulaBar.value = overlay.value; highlightRefs(overlay.value); });
      overlay.addEventListener("keydown", function (e) { var key = e.key; if (e.ctrlKey || e.metaKey) { var kl = key.toLowerCase(); if (kl === "c") { e.preventDefault(); doCopy(); } else if (kl === "v") { e.preventDefault(); doPaste(); } return; } if (key === "Enter") { e.preventDefault(); commitEditing("enter"); } else if (key === "Tab") { e.preventDefault(); commitEditing("tab"); moveSelectionBy("right"); } else if (key === "Shift+Tab") { e.preventDefault(); commitEditing("shifttab"); moveSelectionBy("left"); } else if (key === "Escape") { e.preventDefault(); cancelEditing(); } });
      overlay.addEventListener("blur", function () { if (editing.active) { commitEditing(); } });
    }
    if (formulaBar) {
      formulaBar.addEventListener("keydown", function (e) { var key = e.key; if (key === "Enter") { e.preventDefault(); commitFromFormulaBar(); } else if (key === "Escape") { e.preventDefault(); syncFormulaBar(); } });
    }
    var gridScroll = document.getElementById("grid-scroll");
    gridScroll.addEventListener("mousedown", function (e) {
      var t = e.target;
      var el = t && t.closest ? t.closest("[data-cell]") : null;
      if (el) {
        var addr = el.getAttribute("data-cell");
        if (editing.active) commitEditing();
        selectAddr(addr);
        try { el.focus(); } catch (err) {}
      }
    });
    var gridContent = document.getElementById("grid-content");
    gridContent.addEventListener("mousedown", function (e) { /* bubble to scroll */ });
    // commit when clicking outside cells
    document.addEventListener("mousedown", function (e) {
      var t = e.target;
      if (t && t.closest) {
        var el = t.closest("[data-cell]");
        var rh = t.closest("[data-row]");
        var ch = t.closest("[data-col]");
        var fb = t.closest("#formula-bar");
        var overlayEl2 = t.closest("#cell-editor");
        if (overlayEl2) return;
        if (fb) { if (editing.active) commitEditing(); return; }
        if (rh || ch) { return; }
        if (el) return;
        // clicked empty grid area -> commit editing
        if (editing.active) commitEditing();
      }
    });
  }

  function saveLocal() {
    try {
      var obj = {};
      cells.forEach(function (v, k) { obj[k] = v; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (err) {}
  }
  function loadLocal() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var obj = JSON.parse(raw);
      if (obj && typeof obj === "object") {
        cells.clear();
        values.clear();
        computed.clear();
        stack = [];
        for (var k in obj) { if (obj.hasOwnProperty(k)) cells.set(k, obj[k]); }
      }
    } catch (err) {}
  }

  function scrollCellIntoView(addr) {
    var el = cellEls.get(addr);
    if (el) { try { el.scrollIntoView({ block: "center", inline: "center" }); } catch (err) {} }
  }

  init();
  loadLocal();
  // initial render
  for (var key2 of cellEls.keys()) renderCell(key2);
  selectAddr("A1");
  syncFormulaBar();
  updateStatus();
})();
</script>
</body>
</html>
```