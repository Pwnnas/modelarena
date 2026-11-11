```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Keystone — Parametric 2D CAD Sketcher</title>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #0f1115;
    color: #e5e7eb;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    -webkit-user-select: none;
    user-select: none;
  }

  #cad-canvas {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    cursor: crosshair;
    background: #0f1115;
  }

  .panel {
    position: fixed;
    top: 14px;
    left: 14px;
    width: 268px;
    max-height: calc(100vh - 28px);
    overflow: auto;
    padding: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    background: rgba(17, 20, 24, 0.88);
    box-shadow: 0 18px 48px rgba(0,0,0,0.45);
    backdrop-filter: blur(10px);
    pointer-events: auto;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.02em;
    margin-bottom: 8px;
    color: #f8fafc;
  }

  .brand .logo {
    width: 14px;
    height: 14px;
    border: 2px solid #3b82f6;
    border-radius: 3px;
    transform: rotate(45deg);
  }

  .group-title {
    margin: 14px 0 6px;
    font-size: 10px;
    letter-spacing: 0.11em;
    text-transform: uppercase;
    color: #8ba3b8;
  }

  .btn-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .btn-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
  }

  button {
    appearance: none;
    border: 1px solid #2c343e;
    background: #171d24;
    color: #dbe1e8;
    border-radius: 8px;
    padding: 7px 8px;
    font: inherit;
    cursor: pointer;
    transition: border-color .12s ease, background .12s ease, transform .08s ease;
  }

  button:hover {
    background: #202731;
    border-color: #425164;
  }

  button:active { transform: translateY(1px); }

  button[aria-pressed="true"] {
    background: #1e3a8a;
    border-color: #3b82f6;
    color: #ffffff;
    box-shadow: inset 0 0 0 1px rgba(59,130,246,.25);
  }

  #dimension-input {
    width: 100%;
    padding: 7px 8px;
    border: 1px solid #2c343e;
    border-radius: 8px;
    background: #11171f;
    color: #e5e7eb;
    font: inherit;
  }

  #status {
    margin-top: 12px;
    padding: 8px 9px;
    border-radius: 9px;
    background: rgba(0,0,0,.28);
    display: grid;
    grid-template-columns: 12px 1fr auto;
    gap: 8px;
    align-items: center;
    border-left: 3px solid #3b82f6;
  }

  #status[data-state="under"] { border-left-color: #3b82f6; }
  #status[data-state="fully"]  { border-left-color: #22c55e; }
  #status[data-state="over"]   { border-left-color: #ef4444; }

  #status .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #3b82f6;
  }
  #status[data-state="fully"] .dot { background: #22c55e; }
  #status[data-state="over"] .dot { background: #ef4444; }

  #status .meta { font-size: 12px; color: #cbd5e1; }
  #status .err { font-size: 11px; color: #8ba3b8; }

  .hint {
    margin-top: 10px;
    color: #8ba3b8;
    font-size: 11px;
    line-height: 1.35;
    min-height: 28px;
  }

  .dim-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 6px;
    align-items: center;
  }
</style>
</head>
<body>
<canvas id="cad-canvas"></canvas>

<div class="panel">
  <div class="brand"><span class="logo"></span> Keystone</div>

  <div class="group-title">Draw & Move</div>
  <div class="btn-grid">
    <button data-tool="select" aria-pressed="true">Select</button>
    <button data-tool="point" aria-pressed="false">Point</button>
    <button data-tool="line" aria-pressed="false">Line</button>
    <button data-tool="circle" aria-pressed="false">Circle</button>
  </div>

  <div class="group-title">Constraints</div>
  <div class="btn-grid">
    <button data-constraint="coincident">Coincident</button>
    <button data-constraint="horizontal">Horizontal</button>
    <button data-constraint="vertical">Vertical</button>
    <button data-constraint="parallel">Parallel</button>
    <button data-constraint="perpendicular">Perpend.</button>
    <button data-constraint="equal">Equal</button>
    <button data-constraint="fix">Fix</button>
    <button data-constraint="distance">Distance</button>
    <button data-constraint="radius">Radius</button>
    <button data-constraint="angle">Angle</button>
    <button data-constraint="point-on-object">Point On</button>
  </div>

  <div class="group-title">Dimension</div>
  <div class="dim-row">
    <input id="dimension-input" type="number" value="100" step="1" spellcheck="false">
  </div>

  <div class="group-title">Actions</div>
  <div class="btn-row">
    <button id="undo">Undo</button>
    <button id="redo">Redo</button>
    <button id="clear">Clear</button>
  </div>

  <div id="status" data-dof="0" data-state="under">
    <span class="dot"></span>
    <span class="meta">DOF 0 · under</span>
    <span class="err">0</span>
  </div>

  <div id="hint" class="hint">Shift+click multi-select. Space+drag or middle-drag pans. Wheel zooms.</div>
</div>

<script>
(function () {
  'use strict';

  const RAD2DEG = 180 / Math.PI;
  const DEG2RAD = Math.PI / 180;
  const SOLVER_TOL = 1e-3;
  const OVER_TOL = 1e-2;
  const STORAGE_KEY = 'keystone-sketch-v1';
  const DEFAULT_HINT = 'Shift+click multi-select. Space+drag or middle-drag pans. Wheel zooms.';

  const canvas = document.getElementById('cad-canvas');
  const ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('status');
  const dimInput = document.getElementById('dimension-input');
  const hintEl = document.getElementById('hint');
  const toolButtons = Array.from(document.querySelectorAll('[data-tool]'));
  const constraintButtons = Array.from(document.querySelectorAll('[data-constraint]'));
  const undoBtn = document.getElementById('undo');
  const redoBtn = document.getElementById('redo');
  const clearBtn = document.getElementById('clear');

  const state = {
    points: new Map(),
    lines: new Map(),
    circles: new Map(),
    constraints: new Map()
  };

  const view = {
    originX: window.innerWidth / 2,
    originY: window.innerHeight / 2,
    scale: 1
  };

  const solver = {
    dof: 0,
    status: 'under',
    maxError: 0
  };

  const SELECTION_COLOR = '#fbbf24';
  const UNDER_COLOR = '#3b82f6';
  const FULLY_COLOR = '#22c55e';
  const OVER_COLOR = '#ef4444';

  let tool = 'select';
  let nextId = 1;
  let selection = [];
  let selectionSet = new Set();

  const undoStack = [];
  const redoStack = [];

  let pending = null;
  let snapId = null;
  let hoverId = null;
  let drag = null;
  let pan = null;
  let spaceDown = false;
  let lastMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let badgeRects = [];
  let dirty = true;

  let lastW = window.innerWidth;
  let lastH = window.innerHeight;
  let dpr = window.devicePixelRatio || 1;

  function requestRender() { dirty = true; }

  function resizeCanvas() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    requestRender();
  }

  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    view.originX += (w - lastW) / 2;
    view.originY += (h - lastH) / 2;
    lastW = w;
    lastH = h;
    resizeCanvas();
  });

  resizeCanvas();

  function worldToScreen(x, y) {
    return { x: view.originX + x * view.scale, y: view.originY + y * view.scale };
  }

  function screenToWorld(cx, cy) {
    return { x: (cx - view.originX) / view.scale, y: (cy - view.originY) / view.scale };
  }

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function niceStep(x) {
    if (!isFinite(x) || x <= 0) return 1;
    const e = Math.floor(Math.log10(x));
    const p = Math.pow(10, e);
    const f = x / p;
    let n;
    if (f < 1.5) n = 1;
    else if (f < 3.5) n = 2;
    else if (f < 7.5) n = 5;
    else n = 10;
    return n * p;
  }

  function statusColor() {
    if (solver.status === 'fully') return FULLY_COLOR;
    if (solver.status === 'over') return OVER_COLOR;
    return UNDER_COLOR;
  }

  function setHint(text) {
    if (hintEl) hintEl.textContent = text || DEFAULT_HINT;
  }

  function entityExists(id) {
    return state.points.has(id) || state.lines.has(id) || state.circles.has(id) || state.constraints.has(id);
  }

  function setSelection(ids) {
    const arr = Array.isArray(ids) ? ids : [];
    selection = arr.filter(id => entityExists(id));
    selectionSet = new Set(selection);
    syncInputWithSelection();
  }

  function addSelection(id) {
    if (!entityExists(id) || selectionSet.has(id)) return;
    selection.push(id);
    selectionSet.add(id);
    syncInputWithSelection();
  }

  function removeSelection(id) {
    if (!selectionSet.has(id)) return;
    selection = selection.filter(x => x !== id);
    selectionSet.delete(id);
    syncInputWithSelection();
  }

  function toggleSelection(id) {
    if (selectionSet.has(id)) removeSelection(id);
    else addSelection(id);
  }

  function selectedEntities() {
    const pts = [];
    const lines = [];
    const circles = [];
    for (const id of selection) {
      if (state.points.has(id)) pts.push(id);
      else if (state.lines.has(id)) lines.push(id);
      else if (state.circles.has(id)) circles.push(id);
    }
    return { pts, lines, circles };
  }

  function isDimensional(c) {
    return c.type === 'distance' || c.type === 'radius' || c.type === 'angle';
  }

  function syncInputWithSelection() {
    let val = null;

    for (const id of selection) {
      const c = state.constraints.get(id);
      if (c && isDimensional(c)) {
        val = sanitizeConstraintValue(c.type, c.value);
        break;
      }
    }

    if (val === null) {
      for (const id of selection) {
        if (!entityExists(id)) continue;
        for (const c of state.constraints.values()) {
          if (isDimensional(c) && c.entities.includes(id)) {
            val = sanitizeConstraintValue(c.type, c.value);
            break;
          }
        }
        if (val !== null) break;
      }
    }

    if (val !== null && isFinite(val)) {
      const s = String(val);
      if (dimInput.value !== s) dimInput.value = s;
    }
  }

  function sanitizeConstraintValue(type, value) {
    let v = Number(value);
    if (!isFinite(v)) v = 0;
    if (type === 'angle') return clamp(v, 0, 180);
    if (type === 'distance' || type === 'radius') return Math.abs(v);
    return v;
  }

  function validPointId(id) {
    return state.points.has(id);
  }

  function validLineId(id) {
    const l = state.lines.get(id);
    return !!l && state.points.has(l.p1) && state.points.has(l.p2);
  }

  function validCircleId(id) {
    const c = state.circles.get(id);
    return !!c && state.points.has(c.center) && isFinite(c.r);
  }

  function constraintEntitiesValid(type, entities) {
    const validLines = [];
    const validCircles = [];
    const validPoints = [];

    for (const id of entities) {
      if (validPointId(id) && !validPoints.includes(id)) validPoints.push(id);
      else if (validLineId(id) && !validLines.includes(id)) validLines.push(id);
      else if (validCircleId(id) && !validCircles.includes(id)) validCircles.push(id);
    }

    switch (type) {
      case 'coincident': return validPoints.length >= 2;
      case 'fix': return entities.length >= 1 && validPointId(entities[0]);
      case 'horizontal':
      case 'vertical':
      case 'distance':
        return validLines.length >= 1 || validPoints.length >= 2;
      case 'parallel':
      case 'perpendicular':
      case 'angle':
        return validLines.length >= 2;
      case 'equal':
        return validLines.length >= 2 || validCircles.length >= 2;
      case 'radius':
        return validCircles.length >= 1;
      case 'point-on-object':
        return validPoints.length >= 1 && (validLines.length >= 1 || validCircles.length >= 1);
      default:
        return false;
    }
  }

  function normalizeConstraints() {
    let changed = false;

    for (const c of Array.from(state.constraints.values())) {
      if (!constraintEntitiesValid(c.type, c.entities)) {
        state.constraints.delete(c.id);
        changed = true;
        continue;
      }

      if (c.type === 'fix') {
        const p = state.points.get(c.entities[0]);
        if (p && (!isFinite(c.fx) || !isFinite(c.fy))) {
          c.fx = p.x;
          c.fy = p.y;
          changed = true;
        }
      }

      if (isDimensional(c)) {
        const v = sanitizeConstraintValue(c.type, c.value);
        if (c.value !== v) {
          c.value = v;
          changed = true;
        }
      }
    }

    if (changed) saveSketch();
  }

  function recomputeFixedFlags() {
    for (const p of state.points.values()) p.fixed = false;
    for (const c of state.constraints.values()) {
      if (c.type === 'fix') {
        const p = state.points.get(c.entities[0]);
        if (p) p.fixed = true;
      }
    }
  }

  function constraintEqCount(c) {
    if (c.type === 'coincident' || c.type === 'fix') return 2;
    return 1;
  }

  function computeDOF() {
    let dof = state.points.size * 2 + state.circles.size;
    for (const c of state.constraints.values()) dof -= constraintEqCount(c);
    return dof;
  }

  function buildVars(dragId) {
    const vars = [];
    const idxP = new Map();
    const idxC = new Map();
    let maxMag = 1;

    for (const p of state.points.values()) {
      if (p.fixed || p.id === dragId) continue;
      maxMag = Math.max(maxMag, Math.abs(p.x), Math.abs(p.y));
      const ix = vars.length;
      vars.push({ kind: 'point', p, coord: 'x' });
      vars.push({ kind: 'point', p, coord: 'y' });
      idxP.set(p.id, { x: ix, y: ix + 1 });
    }

    for (const c of state.circles.values()) {
      maxMag = Math.max(maxMag, Math.abs(c.r));
      const ix = vars.length;
      vars.push({ kind: 'circle', c });
      idxC.set(c.id, ix);
    }

    return { vars, idxP, idxC, maxMag };
  }

  function getVarVal(v) {
    if (v.kind === 'point') return v.coord === 'x' ? v.p.x : v.p.y;
    return v.c.r;
  }

  function setVarVal(v, val) {
    if (v.kind === 'point') {
      if (v.coord === 'x') v.p.x = val;
      else v.p.y = val;
    } else {
      v.c.r = val;
    }
  }

  function endpointPair(c) {
    for (const id of c.entities) {
      const l = state.lines.get(id);
      if (l) {
        const a = state.points.get(l.p1);
        const b = state.points.get(l.p2);
        if (a && b) return [a, b];
      }
    }

    const pts = [];
    for (const id of c.entities) {
      const p = state.points.get(id);
      if (p) pts.push(p);
    }
    if (pts.length >= 2) return [pts[0], pts[1]];
    return null;
  }

  const ANGULAR_WEIGHT = 0.2;
  const UNIT_WEIGHT = 1;
  const FIX_WEIGHT = 10;

  function evaluateConstraints(varMaps, n, includeJac) {
    const f = [];
    const display = [];
    const weights = [];
    const Js = [];

    const addRow = (fr, w, row) => {
      if (!isFinite(fr)) fr = 0;
      if (includeJac) {
        if (!row) row = new Float64Array(n);
        for (let i = 0; i < n; i++) if (!isFinite(row[i])) row[i] = 0;
        Js.push(row);
      } else {
        Js.push(null);
      }
      f.push(fr);
      display.push(Math.abs(fr));
      weights.push(w);
    };

    const getRow = () => includeJac ? new Float64Array(n) : null;

    const gradPoint = (row, id, x, y) => {
      if (!row) return;
      const idx = varMaps.idxP.get(id);
      if (!idx) return;
      if (x) row[idx.x] += x;
      if (y) row[idx.y] += y;
    };

    const gradCircle = (row, id, r) => {
      if (!row) return;
      const idx = varMaps.idxC.get(id);
      if (idx !== undefined && r) row[idx] += r;
    };

    const addAngular = (A, B, C, D, kind, targetDeg) => {
      const row = getRow();
      const ux = B.x - A.x, uy = B.y - A.y;
      const vx = D.x - C.x, vy = D.y - C.y;
      const a2 = ux * ux + uy * uy;
      const b2 = vx * vx + vy * vy;

      if (a2 < 1e-9 || b2 < 1e-9) {
        addRow(0, ANGULAR_WEIGHT, row);
        return;
      }

      const dot = ux * vx + uy * vy;
      const cross = ux * vy - uy * vx;
      const q = Math.abs(cross);
      const theta = Math.atan2(q, dot);

      let residualRad = 0;
      let signTheta = 1;

      if (kind === 'parallel') {
        if (dot >= 0) {
          residualRad = theta;
          signTheta = 1;
        } else {
          residualRad = Math.PI - theta;
          signTheta = -1;
        }
      } else if (kind === 'perpendicular') {
        residualRad = theta - Math.PI / 2;
      } else {
        residualRad = theta - targetDeg * DEG2RAD;
      }

      const fr = residualRad * RAD2DEG;

      if (row) {
        const D2 = a2 * b2;
        if (D2 > 1e-12) {
          const s = cross >= 0 ? 1 : -1;
          const factor = RAD2DEG * signTheta;

          const gUx = ((dot * s * vy - q * vx) / D2) * factor;
          const gUy = ((dot * s * (-vx) - q * vy) / D2) * factor;
          const gVx = ((dot * s * (-uy) - q * ux) / D2) * factor;
          const gVy = ((dot * s * ux - q * uy) / D2) * factor;

          gradPoint(row, A.id, -gUx, -gUy);
          gradPoint(row, B.id, gUx, gUy);
          gradPoint(row, C.id, -gVx, -gVy);
          gradPoint(row, D.id, gVx, gVy);
        }
      }

      addRow(fr, ANGULAR_WEIGHT, row);
    };

    for (const con of state.constraints.values()) {
      if (!constraintEntitiesValid(con.type, con.entities)) continue;

      if (con.type === 'coincident') {
        const p1 = state.points.get(con.entities[0]);
        const p2 = state.points.get(con.entities[1]);
        if (!p1 || !p2 || p1.id === p2.id) continue;

        let row = getRow();
        addRow(p1.x - p2.x, UNIT_WEIGHT, row);
        if (row) {
          gradPoint(row, p1.id, 1, 0);
          gradPoint(row, p2.id, -1, 0);
        }

        row = getRow();
        addRow(p1.y - p2.y, UNIT_WEIGHT, row);
        if (row) {
          gradPoint(row, p1.id, 0, 1);
          gradPoint(row, p2.id, 0, -1);
        }
        continue;
      }

      if (con.type === 'horizontal' || con.type === 'vertical' || con.type === 'distance') {
        const pair = endpointPair(con);
        if (!pair) continue;
        const [p1, p2] = pair;
        const row = getRow();

        if (con.type === 'horizontal') {
          addRow(p1.y - p2.y, UNIT_WEIGHT, row);
          if (row) {
            gradPoint(row, p1.id, 0, 1);
            gradPoint(row, p2.id, 0, -1);
          }
        } else if (con.type === 'vertical') {
          addRow(p1.x - p2.x, UNIT_WEIGHT, row);
          if (row) {
            gradPoint(row, p1.id, 1, 0);
            gradPoint(row, p2.id, -1, 0);
          }
        } else {
          const target = sanitizeConstraintValue('distance', con.value);
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const d = Math.hypot(dx, dy);
          addRow(d - target, UNIT_WEIGHT, row);
          if (row) {
            if (d > 1e-9) {
              const gx = dx / d;
              const gy = dy / d;
              gradPoint(row, p1.id, gx, gy);
              gradPoint(row, p2.id, -gx, -gy);
            } else if (target > 1e-9) {
              gradPoint(row, p1.id, 1, 0);
              gradPoint(row, p2.id, -1, 0);
            }
          }
        }
        continue;
      }

      if (con.type === 'fix') {
        const p = state.points.get(con.entities[0]);
        if (!p) continue;
        const fx = isFinite(con.fx) ? con.fx : p.x;
        const fy = isFinite(con.fy) ? con.fy : p.y;

        let row = getRow();
        addRow(p.x - fx, FIX_WEIGHT, row);
        if (row) gradPoint(row, p.id, 1, 0);

        row = getRow();
        addRow(p.y - fy, FIX_WEIGHT, row);
        if (row) gradPoint(row, p.id, 0, 1);
        continue;
      }

      if (con.type === 'radius') {
        const c = state.circles.get(con.entities[0]);
        if (!c) continue;
        const target = sanitizeConstraintValue('radius', con.value);
        const row = getRow();
        addRow(c.r - target, UNIT_WEIGHT, row);
        if (row) gradCircle(row, c.id, 1);
        continue;
      }

      if (con.type === 'equal') {
        const lineIds = Array.from(new Set(con.entities.filter(validLineId)));
        const circleIds = Array.from(new Set(con.entities.filter(validCircleId)));

        if (lineIds.length >= 2) {
          const l1 = state.lines.get(lineIds[0]);
          const l2 = state.lines.get(lineIds[1]);
          if (!l1 || !l2) continue;
          const A = state.points.get(l1.p1), B = state.points.get(l1.p2);
          const C = state.points.get(l2.p1), D = state.points.get(l2.p2);
          if (!A || !B || !C || !D) continue;

          const ux = B.x - A.x, uy = B.y - A.y;
          const vx = D.x - C.x, vy = D.y - C.y;
          const len1 = Math.hypot(ux, uy);
          const len2 = Math.hypot(vx, vy);
          const fr = len1 - len2;
          const row = getRow();
          addRow(fr, UNIT_WEIGHT, row);

          if (row) {
            if (len1 > 1e-9) {
              gradPoint(row, A.id, -ux / len1, -uy / len1);
              gradPoint(row, B.id, ux / len1, uy / len1);
            } else if (Math.abs(fr) > 1e-9) {
              gradPoint(row, A.id, -1, 0);
              gradPoint(row, B.id, 1, 0);
            }

            if (len2 > 1e-9) {
              gradPoint(row, C.id, vx / len2, vy / len2);
              gradPoint(row, D.id, -vx / len2, -vy / len2);
            } else if (Math.abs(fr) > 1e-9) {
              gradPoint(row, C.id, 1, 0);
              gradPoint(row, D.id, -1, 0);
            }
          }
          continue;
        }

        if (circleIds.length >= 2) {
          const c1 = state.circles.get(circleIds[0]);
          const c2 = state.circles.get(circleIds[1]);
          if (!c1 || !c2) continue;
          const row = getRow();
          addRow(c1.r - c2.r, UNIT_WEIGHT, row);
          if (row) {
            gradCircle(row, c1.id, 1);
            gradCircle(row, c2.id, -1);
          }
          continue;
        }

        continue;
      }

      if (con.type === 'parallel' || con.type === 'perpendicular' || con.type === 'angle') {
        const lineIds = Array.from(new Set(con.entities.filter(validLineId)));
        if (lineIds.length < 2) continue;

        const l1 = state.lines.get(lineIds[0]);
        const l2 = state.lines.get(lineIds[1]);
        if (!l1 || !l2) continue;
        const A = state.points.get(l1.p1), B = state.points.get(l1.p2);
        const C = state.points.get(l2.p1), D = state.points.get(l2.p2);
        if (!A || !B || !C || !D) continue;

        const targetDeg = sanitizeConstraintValue('angle', con.value);
        if (con.type === 'parallel') addAngular(A, B, C, D, 'parallel', 0);
        else if (con.type === 'perpendicular') addAngular(A, B, C, D, 'perpendicular', 90);
        else addAngular(A, B, C, D, 'angle', targetDeg);
        continue;
      }

      if (con.type === 'point-on-object') {
        let pointId = null;
        let lineId = null;
        let circleId = null;

        for (const id of con.entities) {
          if (state.points.has(id) && !pointId) pointId = id;
          else if (validLineId(id) && !lineId) lineId = id;
          else if (validCircleId(id) && !circleId) circleId = id;
        }

        if (!pointId) continue;

        if (pointId && lineId) {
          const P = state.points.get(pointId);
          const L = state.lines.get(lineId);
          if (!P || !L) continue;
          const A = state.points.get(L.p1), B = state.points.get(L.p2);
          if (!A || !B) continue;

          const ux = B.x - A.x, uy = B.y - A.y;
          const wx = P.x - A.x, wy = P.y - A.y;
          const b = Math.hypot(ux, uy);
          const row = getRow();

          if (b < 1e-9) {
            addRow(0, UNIT_WEIGHT, row);
            continue;
          }

          const invB = 1 / b;
          const invB3 = 1 / (b * b * b);
          const cr = ux * wy - uy * wx;
          addRow(cr * invB, UNIT_WEIGHT, row);

          if (row) {
            gradPoint(row, P.id, -uy * invB, ux * invB);

            gradPoint(row, A.id,
              (uy - wy) * invB + cr * ux * invB3,
              (wx - ux) * invB + cr * uy * invB3);

            gradPoint(row, B.id,
              wy * invB - cr * ux * invB3,
              -wx * invB - cr * uy * invB3);
          }
          continue;
        }

        if (pointId && circleId) {
          const P = state.points.get(pointId);
          const C = state.circles.get(circleId);
          if (!P || !C) continue;
          const Cp = state.points.get(C.center);
          if (!Cp) continue;

          const dx = P.x - Cp.x;
          const dy = P.y - Cp.y;
          const d = Math.hypot(dx, dy);
          const row = getRow();
          addRow(d - C.r, UNIT_WEIGHT, row);

          if (row) {
            if (d > 1e-9) {
              const gx = dx / d;
              const gy = dy / d;
              gradPoint(row, P.id, gx, gy);
              gradPoint(row, Cp.id, -gx, -gy);
            } else if (Math.abs(C.r) > 1e-9) {
              gradPoint(row, P.id, 1, 0);
              gradPoint(row, Cp.id, -1, 0);
            }
            gradCircle(row, C.id, -1);
          }
          continue;
        }
      }
    }

    return { f, display, weights, Js };
  }

  function computeMaxError() {
    const info = buildVars(null);
    const rows = evaluateConstraints({ idxP: info.idxP, idxC: info.idxC }, info.vars.length, false);
    let m = 0;
    for (const d of rows.display) if (isFinite(d) && d > m) m = d;
    return m;
  }

  function updateStatusUI() {
    statusEl.dataset.dof = String(solver.dof);
    statusEl.dataset.state = solver.status;
    const label = solver.status === 'fully' ? 'fully constrained' : solver.status === 'over' ? 'over-constrained' : 'under-constrained';
    const err = solver.maxError <= 1e-9 ? '0' : solver.maxError.toExponential(2);
    statusEl.innerHTML = '<span class="dot"></span><span class="meta">DOF ' + solver.dof + ' · ' + label + '</span><span class="err">err ' + err + '</span>';
  }

  function refreshStatus() {
    normalizeConstraints();
    recomputeFixedFlags();
    solver.maxError = computeMaxError();
    solver.dof = computeDOF();

    const entityCount = state.points.size + state.lines.size + state.circles.size;
    let status;

    if (solver.dof < 0 || solver.maxError > OVER_TOL || (entityCount > 0 && solver.dof === 0 && solver.maxError > SOLVER_TOL)) {
      status = 'over';
    } else if (entityCount > 0 && solver.dof === 0 && solver.maxError <= SOLVER_TOL) {
      status = 'fully';
    } else {
      status = 'under';
    }

    solver.status = status;
    updateStatusUI();
    requestRender();
  }

  function solveLinear(A, b) {
    const n = A.length;
    if (n === 0) return [];

    for (let k = 0; k < n; k++) {
      let pivot = k;
      let max = Math.abs(A[k][k]);
      for (let i = k + 1; i < n; i++) {
        const v = Math.abs(A[i][k]);
        if (v > max) {
          max = v;
          pivot = i;
        }
      }

      if (max < 1e-14) return null;

      if (pivot !== k) {
        const tmpA = A[k];
        A[k] = A[pivot];
        A[pivot] = tmpA;
        const tmpB = b[k];
        b[k] = b[pivot];
        b[pivot] = tmpB;
      }

      const inv = 1 / A[k][k];
      for (let j = k; j < n; j++) A[k][j] *= inv;
      b[k] *= inv;

      for (let i = 0; i < n; i++) {
        if (i === k) continue;
        const factor = A[i][k];
        if (factor === 0) continue;
        for (let j = k; j < n; j++) A[i][j] -= factor * A[k][j];
        b[i] -= factor * b[k];
      }
    }

    return b;
  }

  function solveNow(dragId = null) {
    normalizeConstraints();
    recomputeFixedFlags();

    if (state.constraints.size === 0) {
      solver.maxError = 0;
      refreshStatus();
      return { converged: true, maxError: 0 };
    }

    const info = buildVars(dragId);
    const n = info.vars.length;
    const varMaps = { idxP: info.idxP, idxC: info.idxC };

    let lambda = 1e-1;
    let lastDisplay = Infinity;

    for (let iter = 0; iter < 90; iter++) {
      const rows = evaluateConstraints(varMaps, n, true);

      let maxDisplay = 0;
      for (const d of rows.display) if (isFinite(d) && d > maxDisplay) maxDisplay = d;
      lastDisplay = maxDisplay;

      if (maxDisplay <= SOLVER_TOL) break;
      if (n === 0) break;

      const A = [];
      const b = new Float64Array(n);
      for (let i = 0; i < n; i++) A[i] = new Float64Array(n);

      for (let r = 0; r < rows.f.length; r++) {
        const row = rows.Js[r];
        const w = rows.weights[r];
        if (!row || w === 0) continue;

        const fw = rows.f[r] * w;
        const Jw = new Float64Array(n);
        let any = false;

        for (let j = 0; j < n; j++) {
          const val = row[j] * w;
          if (!isFinite(val)) {
            row[j] = 0;
            continue;
          }
          Jw[j] = val;
          if (val !== 0) any = true;
        }

        if (!any && Math.abs(fw) < 1e-18) continue;

        for (let j = 0; j < n; j++) {
          const jw = Jw[j];
          if (jw === 0) continue;
          b[j] -= jw * fw;
          for (let k = 0; k < n; k++) {
            const kw = Jw[k];
            if (kw !== 0) A[j][k] += jw * kw;
          }
        }
      }

      let bad = false;
      for (let i = 0; i < n && !bad; i++) {
        for (let j = 0; j < n; j++) {
          if (!isFinite(A[i][j]) || !isFinite(b[i])) {
            bad = true;
            break;
          }
        }
      }
      if (bad) {
        lambda *= 5;
        continue;
      }

      for (let i = 0; i < n; i++) A[i][i] += lambda;

      const dx = solveLinear(A, Array.from(b));
      if (!dx) {
        lambda *= 5;
        continue;
      }

      let norm = 0;
      let stepBad = false;
      for (let i = 0; i < n; i++) {
        if (!isFinite(dx[i])) { stepBad = true; break; }
        norm += dx[i] * dx[i];
      }
      if (stepBad) {
        lambda *= 5;
        continue;
      }
      norm = Math.sqrt(norm);

      const maxStep = Math.max(1000, info.maxMag * 100);
      if (norm > maxStep) {
        const s = maxStep / norm;
        for (let i = 0; i < n; i++) dx[i] *= s;
      }

      const oldVals = new Array(n);
      for (let i = 0; i < n; i++) oldVals[i] = getVarVal(info.vars[i]);

      for (let i = 0; i < n; i++) {
        const v = getVarVal(info.vars[i]) + dx[i];
        if (!isFinite(v)) { stepBad = true; break; }
        setVarVal(info.vars[i], v);
      }

      if (stepBad) {
        for (let i = 0; i < n; i++) setVarVal(info.vars[i], oldVals[i]);
        lambda *= 5;
        continue;
      }

      const rows2 = evaluateConstraints(varMaps, n, false);
      let newMax = 0;
      for (const d of rows2.display) if (isFinite(d) && d > newMax) newMax = d;

      if (!isFinite(newMax)) {
        for (let i = 0; i < n; i++) setVarVal(info.vars[i], oldVals[i]);
        lambda *= 5;
        continue;
      }

      if (newMax < lastDisplay) {
        lastDisplay = newMax;
        lambda = Math.max(lambda * 0.3, 1e-8);
        if (newMax <= SOLVER_TOL) break;
      } else {
        for (let i = 0; i < n; i++) setVarVal(info.vars[i], oldVals[i]);
        lambda *= 5;
      }

      if (lambda > 1e12) break;
    }

    refreshStatus();
    return { converged: solver.maxError <= SOLVER_TOL, maxError: solver.maxError };
  }

  function newId(prefix) {
    while (true) {
      const id = prefix + nextId;
      nextId++;
      if (!state.points.has(id) && !state.lines.has(id) && !state.circles.has(id) && !state.constraints.has(id)) {
        return id;
      }
    }
  }

  function addPoint(x, y) {
    const id = newId('p');
    state.points.set(id, { id, x, y, fixed: false });
    return id;
  }

  function addLine(p1, p2) {
    if (!state.points.has(p1) || !state.points.has(p2) || p1 === p2) return null;
    const id = newId('l');
    state.lines.set(id, { id, p1, p2 });
    return id;
  }

  function addCircle(center, r) {
    if (!state.points.has(center) || !isFinite(r) || r <= 1e-9) return null;
    const id = newId('c');
    state.circles.set(id, { id, center, r });
    return id;
  }

  function addConstraint(type, entities, value) {
    if (!constraintEntitiesValid(type, entities)) return false;

    const sorted = Array.from(new Set(entities)).sort();
    if (sorted.length < 1) return false;

    let existing = null;
    for (const c of state.constraints.values()) {
      if (c.type !== type) continue;
      const cs = Array.from(new Set(c.entities)).sort();
      if (cs.length === sorted.length && cs.every((x, i) => x === sorted[i])) {
        existing = c;
        break;
      }
    }

    if (existing) {
      if (isDimensional(existing)) {
        const v = sanitizeConstraintValue(existing.type, value);
        if (existing.value !== v) {
          existing.value = v;
          return true;
        }
      }
      return false;
    }

    const id = newId('k');
    const c = { id, type, entities: entities.slice() };

    if (isDimensional(c)) {
      c.value = sanitizeConstraintValue(c.type, value);
    }

    if (c.type === 'fix') {
      const p = state.points.get(c.entities[0]);
      if (p) {
        c.fx = p.x;
        c.fy = p.y;
      }
    }

    state.constraints.set(id, c);
    return true;
  }

  function dimensionValue() {
    let v = Number(dimInput.value);
    if (!isFinite(v)) v = 0;
    return v;
  }

  function applyConstraint(type) {
    const sel = selectedEntities();
    let changed = false;

    const add = (entities, value) => {
      if (addConstraint(type, entities, value)) changed = true;
    };

    switch (type) {
      case 'coincident':
        if (sel.pts.length >= 2) add([sel.pts[0], sel.pts[1]]);
        break;
      case 'horizontal':
        if (sel.lines.length >= 1) add([sel.lines[0]]);
        else if (sel.pts.length >= 2) add([sel.pts[0], sel.pts[1]]);
        break;
      case 'vertical':
        if (sel.lines.length >= 1) add([sel.lines[0]]);
        else if (sel.pts.length >= 2) add([sel.pts[0], sel.pts[1]]);
        break;
      case 'parallel':
        if (sel.lines.length >= 2) add([sel.lines[0], sel.lines[1]]);
        break;
      case 'perpendicular':
        if (sel.lines.length >= 2) add([sel.lines[0], sel.lines[1]]);
        break;
      case 'equal':
        if (sel.lines.length >= 2) add([sel.lines[0], sel.lines[1]]);
        else if (sel.circles.length >= 2) add([sel.circles[0], sel.circles[1]]);
        break;
      case 'fix':
        for (const id of sel.pts) add([id]);
        break;
      case 'distance': {
        const val = dimensionValue();
        if (sel.lines.length >= 1) add([sel.lines[0]], val);
        else if (sel.pts.length >= 2) add([sel.pts[0], sel.pts[1]], val);
        break;
      }
      case 'radius': {
        const val = dimensionValue();
        if (sel.circles.length >= 1) add([sel.circles[0]], val);
        break;
      }
      case 'angle': {
        const val = dimensionValue();
        if (sel.lines.length >= 2) add([sel.lines[0], sel.lines[1]], val);
        break;
      }
      case 'point-on-object':
        if (sel.pts.length >= 1) {
          if (sel.lines.length >= 1) add([sel.pts[0], sel.lines[0]]);
          else if (sel.circles.length >= 1) add([sel.pts[0], sel.circles[0]]);
        }
        break;
    }

    if (changed) {
      normalizeConstraints();
      recomputeFixedFlags();
      solveNow();
      commitHistory();
      setHint(DEFAULT_HINT);
    } else {
      setHint('Cannot apply ' + type + ': invalid selection.');
    }

    requestRender();
  }

  function updateDimensionFromInput(commit) {
    let raw = Number(dimInput.value);
    if (!isFinite(raw)) return;

    let changed = false;

    for (const id of selection) {
      const c = state.constraints.get(id);
      if (c && isDimensional(c)) {
        const v = sanitizeConstraintValue(c.type, raw);
        if (c.value !== v) {
          c.value = v;
          changed = true;
        }
      }
    }

    if (!changed) {
      for (const c of state.constraints.values()) {
        if (!isDimensional(c)) continue;
        if (c.entities.some(id => selectionSet.has(id))) {
          const v = sanitizeConstraintValue(c.type, raw);
          if (c.value !== v) {
            c.value = v;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      normalizeConstraints();
      solveNow();
      if (commit) commitHistory();
    }

    requestRender();
  }

  function serializeState() {
    const obj = {
      nextId,
      points: Array.from(state.points.values()).map(p => ({ id: p.id, x: p.x, y: p.y, fixed: !!p.fixed })),
      lines: Array.from(state.lines.values()).map(l => ({ id: l.id, p1: l.p1, p2: l.p2 })),
      circles: Array.from(state.circles.values()).map(c => ({ id: c.id, center: c.center, r: c.r })),
      constraints: Array.from(state.constraints.values()).map(c => ({
        id: c.id,
        type: c.type,
        entities: c.entities.slice(),
        value: c.value,
        fx: c.fx,
        fy: c.fy
      }))
    };
    return JSON.stringify(obj);
  }

  function saveSketch() {
    try {
      localStorage.setItem(STORAGE_KEY, serializeState());
    } catch (e) {
      /* storage unavailable or quota exceeded */
    }
  }

  function commitHistory() {
    const s = serializeState();
    if (undoStack.length && undoStack[undoStack.length - 1] === s) {
      saveSketch();
      return;
    }
    undoStack.push(s);
    if (undoStack.length > 140) undoStack.shift();
    redoStack.length = 0;
    saveSketch();
  }

  function maxIdCounter(obj) {
    let max = 0;
    for (const key of ['points', 'lines', 'circles', 'constraints']) {
      const arr = obj[key] || [];
      for (const item of arr) {
        if (typeof item.id === 'string') {
          const n = parseInt(item.id.slice(1), 10);
          if (isFinite(n) && n > max) max = n;
        }
      }
    }
    return max;
  }

  function restoreSerialized(serialized) {
    let obj = null;
    try { obj = JSON.parse(serialized); } catch (e) { obj = null; }

    state.points.clear();
    state.lines.clear();
    state.circles.clear();
    state.constraints.clear();
    selection = [];
    selectionSet = new Set();
    pending = null;
    snapId = null;
    hoverId = null;
    drag = null;
    pan = null;

    if (!obj) {
      nextId = 1;
      normalizeConstraints();
      recomputeFixedFlags();
      refreshStatus();
      return;
    }

    for (const p of obj.points || []) {
      if (!p || typeof p.id !== 'string') continue;
      state.points.set(p.id, { id: p.id, x: Number(p.x) || 0, y: Number(p.y) || 0, fixed: false });
    }

    for (const l of obj.lines || []) {
      if (!l || typeof l.id !== 'string') continue;
      state.lines.set(l.id, { id: l.id, p1: l.p1, p2: l.p2 });
    }

    for (const c of obj.circles || []) {
      if (!c || typeof c.id !== 'string') continue;
      state.circles.set(c.id, { id: c.id, center: c.center, r: Number(c.r) || 0 });
    }

    for (const c of obj.constraints || []) {
      if (!c || typeof c.id !== 'string') continue;
      state.constraints.set(c.id, {
        id: c.id,
        type: c.type,
        entities: Array.isArray(c.entities) ? c.entities.slice() : [],
        value: c.value,
        fx: c.fx,
        fy: c.fy
      });
    }

    nextId = maxIdCounter(obj) + 1;
    normalizeConstraints();
    recomputeFixedFlags();
    refreshStatus();
  }

  function undo() {
    if (undoStack.length <= 1) return;
    const current = undoStack.pop();
    redoStack.push(current);
    restoreSerialized(undoStack[undoStack.length - 1]);
    saveSketch();
  }

  function redo() {
    if (redoStack.length === 0) return;
    const s = redoStack.pop();
    undoStack.push(s);
    restoreSerialized(s);
    saveSketch();
  }

  function resetView() {
    view.scale = 1;
    view.originX = window.innerWidth / 2;
    view.originY = window.innerHeight / 2;
  }

  function clearSketch() {
    state.points.clear();
    state.lines.clear();
    state.circles.clear();
    state.constraints.clear();
    selection = [];
    selectionSet = new Set();
    pending = null;
    snapId = null;
    hoverId = null;
    drag = null;
    pan = null;
    nextId = 1;
    resetView();
    refreshStatus();
    commitHistory();
    requestRender();
  }

  function cancelPending() {
    if (pending && pending.created) {
      const p = state.points.get(pending.id);
      if (p) state.points.delete(p.id);
    }
    pending = null;
    snapId = null;
    requestRender();
  }

  function findSnapPoint(sx, sy, excludeId) {
    let bestId = null;
    let bestD = 144;
    for (const p of state.points.values()) {
      if (excludeId && p.id === excludeId) continue;
      const s = worldToScreen(p.x, p.y);
      const dx = s.x - sx;
      const dy = s.y - sy;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        bestId = p.id;
      }
    }
    return bestId;
  }

  function handleLineDown(e) {
    const w = screenToWorld(e.clientX, e.clientY);

    if (!pending) {
      const snap = findSnapPoint(e.clientX, e.clientY, null);
      if (snap) {
        pending = { type: 'line', id: snap, created: false };
      } else {
        const id = addPoint(w.x, w.y);
        pending = { type: 'line', id, created: true };
      }
      requestRender();
      return;
    }

    const exclude = pending.created ? pending.id : null;
    const snap = findSnapPoint(e.clientX, e.clientY, exclude);
    let endId;

    if (snap) {
      endId = snap;
    } else {
      endId = addPoint(w.x, w.y);
    }

    if (endId !== pending.id) {
      addLine(pending.id, endId);
      commitHistory();
      solveNow();
    } else {
      cancelPending();
    }

    pending = null;
    snapId = null;
    requestRender();
  }

  function handleCircleDown(e) {
    const w = screenToWorld(e.clientX, e.clientY);

    if (!pending) {
      const snap = findSnapPoint(e.clientX, e.clientY, null);
      if (snap) {
        pending = { type: 'circle', id: snap, created: false };
      } else {
        const id = addPoint(w.x, w.y);
        pending = { type: 'circle', id, created: true };
      }
      requestRender();
      return;
    }

    const snap = findSnapPoint(e.clientX, e.clientY, pending.id);
    const center = state.points.get(pending.id);
    if (!center) {
      pending = null;
      return;
    }

    let target;
    if (snap && state.points.has(snap)) target = state.points.get(snap);
    else target = w;

    const r = Math.hypot(target.x - center.x, target.y - center.y);
    if (r > 1e-6) {
      addCircle(pending.id, r);
      commitHistory();
      solveNow();
    }

    pending = null;
    snapId = null;
    requestRender();
  }

  function deleteSelection() {
    if (!selection.length) return;

    const pts = new Set();
    const lines = new Set();
    const circles = new Set();
    const cons = new Set();

    for (const id of selection) {
      if (state.points.has(id)) pts.add(id);
      else if (state.lines.has(id)) lines.add(id);
      else if (state.circles.has(id)) circles.add(id);
      else if (state.constraints.has(id)) cons.add(id);
    }

    for (const id of Array.from(pts)) {
      for (const l of state.lines.values()) {
        if (l.p1 === id || l.p2 === id) lines.add(l.id);
      }
      for (const c of state.circles.values()) {
        if (c.center === id) circles.add(c.id);
      }
    }

    for (const c of state.constraints.values()) {
      if (cons.has(c.id)) continue;
      if (c.entities.some(id => pts.has(id) || lines.has(id) || circles.has(id))) cons.add(c.id);
    }

    for (const cid of Array.from(circles)) {
      const c = state.circles.get(cid);
      if (!c) continue;
      const center = c.center;
      if (pts.has(center)) continue;

      if (selectionSet.has(center)) {
        pts.add(center);
        continue;
      }

      let used = false;
      for (const l of state.lines.values()) {
        if (!lines.has(l.id) && (l.p1 === center || l.p2 === center)) {
          used = true;
          break;
        }
      }

      if (!used) {
        for (const c2 of state.constraints.values()) {
          if (cons.has(c2.id)) continue;
          if (c2.entities.includes(center)) {
            used = true;
            break;
          }
        }
      }

      if (!used) pts.add(center);
    }

    for (const id of cons) state.constraints.delete(id);
    for (const id of lines) state.lines.delete(id);
    for (const id of circles) state.circles.delete(id);
    for (const id of pts) state.points.delete(id);

    selection = [];
    selectionSet = new Set();
    syncInputWithSelection();
    normalizeConstraints();
    recomputeFixedFlags();
    solveNow();
    commitHistory();
    requestRender();
  }

  function distPointSeg(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 < 1e-12) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = clamp(t, 0, 1);
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function hitTestPoint(wx, wy) {
    const tol = 8 / view.scale;
    const tol2 = tol * tol;
    for (const p of state.points.values()) {
      const dx = p.x - wx;
      const dy = p.y - wy;
      if (dx * dx + dy * dy <= tol2) return p.id;
    }
    return null;
  }

  function hitTestLine(wx, wy) {
    const tol = 7 / view.scale;
    for (const l of state.lines.values()) {
      const a = state.points.get(l.p1);
      const b = state.points.get(l.p2);
      if (!a || !b) continue;
      if (distPointSeg(wx, wy, a.x, a.y, b.x, b.y) <= tol) return l.id;
    }
    return null;
  }

  function hitTestCircle(wx, wy) {
    const tol = 7 / view.scale;
    for (const c of state.circles.values()) {
      const p = state.points.get(c.center);
      if (!p) continue;
      const d = Math.hypot(wx - p.x, wy - p.y);
      if (c.r > tol && Math.abs(d - c.r) <= tol) return c.id;
    }
    return null;
  }

  function hitBadge(cx, cy) {
    for (let i = badgeRects.length - 1; i >= 0; i--) {
      const b = badgeRects[i];
      if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) return b.id;
    }
    return null;
  }

  function hitTestEntity(cx, cy) {
    const w = screenToWorld(cx, cy);

    const pid = hitTestPoint(w.x, w.y);
    if (pid) return { kind: 'point', id: pid };

    const lid = hitTestLine(w.x, w.y);
    if (lid) return { kind: 'line', id: lid };

    const cid = hitTestCircle(w.x, w.y);
    if (cid) return { kind: 'circle', id: cid };

    const badge = hitBadge(cx, cy);
    if (badge) return { kind: 'constraint', id: badge };

    return null;
  }

  function lineIntersection(A, B, C, D) {
    const dx1 = B.x - A.x;
    const dy1 = B.y - A.y;
    const dx2 = D.x - C.x;
    const dy2 = D.y - C.y;
    const denom = dx1 * dy2 - dy1 * dx2;
    if (Math.abs(denom) < 1e-9) return null;
    const t = ((C.x - A.x) * dy2 - (C.y - A.y) * dx2) / denom;
    return { x: A.x + t * dx1, y: A.y + t * dy1 };
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawBadge(sx, sy, text, constraintId, selected) {
    ctx.font = '600 11px ui-sans-serif, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const tw = ctx.measureText(text).width;
    const pad = 7;
    const w = tw + pad * 2;
    const h = 18;
    const x = sx - w / 2;
    const y = sy - h / 2;

    ctx.fillStyle = 'rgba(15,18,22,0.86)';
    ctx.strokeStyle = selected ? SELECTION_COLOR : 'rgba(148,163,184,0.62)';
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = selected ? SELECTION_COLOR : '#e5e7eb';
    ctx.fillText(text, sx, sy + 0.5);

    if (constraintId) badgeRects.push({ x, y, w, h, id: constraintId });
  }

  function drawShapeBadge(sx, sy, w, h, constraintId, selected) {
    ctx.strokeStyle = selected ? SELECTION_COLOR : 'rgba(148,163,184,0.75)';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(sx - w / 2, sy - h / 2, w, h);
    if (constraintId) badgeRects.push({ x: sx - w / 2 - 3, y: sy - h / 2 - 3, w: w + 6, h: h + 6, id: constraintId });
  }

  function drawCoincidentShape(p, constraintId, selected) {
    const s = worldToScreen(p.x, p.y);
    ctx.strokeStyle = selected ? SELECTION_COLOR : 'rgba(148,163,184,0.8)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
    ctx.stroke();
    badgeRects.push({ x: s.x - 9, y: s.y - 9, w: 18, h: 18, id: constraintId });
  }

  function drawFixShape(p, constraintId, selected) {
    const s = worldToScreen(p.x, p.y);
    drawShapeBadge(s.x, s.y, 9, 9, constraintId, selected);
  }

  function formatNum(v) {
    if (!isFinite(v)) return '0';
    const a = Math.abs(v);
    if (a < 1e-5) return '0';
    if (a < 1) return String(Number(v.toFixed(4))).replace(/\.?0+$/, '');
    if (a < 100) return String(Number(v.toFixed(3))).replace(/\.?0+$/, '');
    if (a < 10000) return String(Number(v.toFixed(1))).replace(/\.?0+$/, '');
    return String(Math.round(v));
  }

  function normalForPair(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) return { x: 0, y: -1 };
    return { x: dy / len, y: -dx / len };
  }

  function drawConstraintBadge(con, selected) {
    const lineIds = Array.from(new Set(con.entities.filter(validLineId)));
    const circleIds = Array.from(new Set(con.entities.filter(validCircleId)));

    if (con.type === 'coincident') {
      const p = state.points.get(con.entities[0]);
      if (p) drawCoincidentShape(p, con.id, selected);
      return;
    }

    if (con.type === 'fix') {
      const p = state.points.get(con.entities[0]);
      if (p) drawFixShape(p, con.id, selected);
      return;
    }

    if (con.type === 'horizontal' || con.type === 'vertical') {
      const pair = endpointPair(con);
      if (!pair) return;
      const [a, b] = pair;
      const m = worldToScreen((a.x + b.x) / 2, (a.y + b.y) / 2);
      const n = normalForPair(a, b);
      drawBadge(m.x + n.x * 16, m.y + n.y * 16, con.type === 'horizontal' ? 'H' : 'V', con.id, selected);
      return;
    }

    if (con.type === 'distance') {
      const pair = endpointPair(con);
      if (!pair) return;
      const [a, b] = pair;
      const s1 = worldToScreen(a.x, a.y);
      const s2 = worldToScreen(b.x, b.y);
      const n = normalForPair(a, b);
      const off = 22;
      const o1 = { x: s1.x + n.x * off, y: s1.y + n.y * off };
      const o2 = { x: s2.x + n.x * off, y: s2.y + n.y * off };
      const mid = { x: (o1.x + o2.x) / 2, y: (o1.y + o2.y) / 2 };

      ctx.strokeStyle = selected ? SELECTION_COLOR : 'rgba(148,163,184,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(o1.x, o1.y);
      ctx.lineTo(o2.x, o2.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(o1.x, o1.y);
      ctx.moveTo(s2.x, s2.y);
      ctx.lineTo(o2.x, o2.y);
      ctx.stroke();

      drawBadge(mid.x, mid.y, formatNum(sanitizeConstraintValue('distance', con.value)), con.id, selected);
      return;
    }

    if (con.type === 'radius') {
      const c = state.circles.get(con.entities[0]);
      if (!c) return;
      const cp = state.points.get(c.center);
      if (!cp) return;
      const s = worldToScreen(cp.x, cp.y);
      const ang = -Math.PI / 4;
      const per = worldToScreen(cp.x + c.r * Math.cos(ang), cp.y + c.r * Math.sin(ang));
      ctx.strokeStyle = selected ? SELECTION_COLOR : 'rgba(148,163,184,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(per.x, per.y);
      ctx.stroke();
      drawBadge(per.x + Math.cos(ang) * 18, per.y + Math.sin(ang) * 18, formatNum(sanitizeConstraintValue('radius', con.value)), con.id, selected);
      return;
    }

    if (con.type === 'parallel') {
      for (const id of lineIds) {
        const l = state.lines.get(id);
        if (!l) continue;
        const a = state.points.get(l.p1), b = state.points.get(l.p2);
        if (!a || !b) continue;
        const m = worldToScreen((a.x + b.x) / 2, (a.y + b.y) / 2);
        const n = normalForPair(a, b);
        drawBadge(m.x + n.x * 14, m.y + n.y * 14, '||', con.id, selected);
      }
      return;
    }

    if (con.type === 'perpendicular') {
      if (lineIds.length >= 2) {
        const l1 = state.lines.get(lineIds[0]);
        const l2 = state.lines.get(lineIds[1]);
        if (l1 && l2) {
          const A = state.points.get(l1.p1), B = state.points.get(l1.p2);
          const C = state.points.get(l2.p1), D = state.points.get(l2.p2);
          if (A && B && C && D) {
            const inter = lineIntersection(A, B, C, D);
            if (inter) {
              const s = worldToScreen(inter.x, inter.y);
              drawBadge(s.x + 18, s.y - 18, '⊥', con.id, selected);
            } else {
              const a = state.points.get(l1.p1), b = state.points.get(l1.p2);
              if (a && b) {
                const m = worldToScreen((a.x + b.x) / 2, (a.y + b.y) / 2);
                const n = normalForPair(a, b);
                drawBadge(m.x + n.x * 16, m.y + n.y * 16, '⊥', con.id, selected);
              }
            }
          }
        }
      }
      return;
    }

    if (con.type === 'angle') {
      if (lineIds.length < 2) return;
      const l1 = state.lines.get(lineIds[0]);
      const l2 = state.lines.get(lineIds[1]);
      if (!l1 || !l2) return;
      const A = state.points.get(l1.p1), B = state.points.get(l1.p2);
      const C = state.points.get(l2.p1), D = state.points.get(l2.p2);
      if (!A || !B || !C || !D) return;

      const target = sanitizeConstraintValue('angle', con.value);
      const inter = lineIntersection(A, B, C, D);

      if (inter) {
        const s = worldToScreen(inter.x, inter.y);
        const a1 = Math.atan2(B.y - A.y, B.x - A.x);
        const a2 = Math.atan2(D.y - C.y, D.x - C.x);

        if (target > 1 && target < 179) {
          let start = a1, end = a2, ccw = false;
          let delta = end - start;
          if (delta < 0) delta += Math.PI * 2;
          if (delta > Math.PI) ccw = true;

          ctx.strokeStyle = selected ? SELECTION_COLOR : 'rgba(148,163,184,0.7)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 22, start, end, ccw);
          ctx.stroke();

          let mid;
          if (!ccw) mid = (start + end) / 2;
          else mid = start - (Math.PI * 2 - delta) / 2;

          const r = 22 + 18;
          drawBadge(s.x + Math.cos(mid) * r, s.y + Math.sin(mid) * r, formatNum(target) + '°', con.id, selected);
        } else {
          drawBadge(s.x + 22, s.y - 22, formatNum(target) + '°', con.id, selected);
        }
      } else {
        const a = state.points.get(l1.p1), b = state.points.get(l1.p2);
        if (a && b) {
          const m = worldToScreen((a.x + b.x) / 2, (a.y + b.y) / 2);
          const n = normalForPair(a, b);
          drawBadge(m.x + n.x * 18, m.y + n.y * 18, formatNum(target) + '°', con.id, selected);
        }
      }
      return;
    }

    if (con.type === 'equal') {
      if (lineIds.length >= 2) {
        for (const id of lineIds) {
          const l = state.lines.get(id);
          if (!l) continue;
          const a = state.points.get(l.p1), b = state.points.get(l.p2);
          if (!a || !b) continue;
          const m = worldToScreen((a.x + b.x) / 2, (a.y + b.y) / 2);
          const n = normalForPair(a, b);
          drawBadge(m.x + n.x * 14, m.y + n.y * 14, '=', con.id, selected);
        }
      } else if (circleIds.length >= 2) {
        for (const id of circleIds) {
          const c = state.circles.get(id);
          if (!c) continue;
          const p = state.points.get(c.center);
          if (!p) continue;
          const s = worldToScreen(p.x, p.y);
          drawBadge(s.x, s.y - 14, '=', con.id, selected);
        }
      }
      return;
    }

    if (con.type === 'point-on-object') {
      let pointId = null;
      let lineId = null;
      let circleId = null;

      for (const id of con.entities) {
        if (state.points.has(id) && !pointId) pointId = id;
        else if (validLineId(id) && !lineId) lineId = id;
        else if (validCircleId(id) && !circleId) circleId = id;
      }

      if (!pointId) return;

      if (pointId && lineId) {
        const P = state.points.get(pointId);
        const L = state.lines.get(lineId);
        if (!P || !L) return;
        const A = state.points.get(L.p1), B = state.points.get(L.p2);
        if (!A || !B) return;

        const ux = B.x - A.x, uy = B.y - A.y;
        const len2 = ux * ux + uy * uy;
        if (len2 < 1e-9) return;
        const t = ((P.x - A.x) * ux + (P.y - A.y) * uy) / len2;
        const proj = { x: A.x + t * ux, y: A.y + t * uy };
        const s = worldToScreen(proj.x, proj.y);
        drawBadge(s.x, s.y - 15, 'ON', con.id, selected);
      } else if (pointId && circleId) {
        const P = state.points.get(pointId);
        if (!P) return;
        const s = worldToScreen(P.x, P.y);
        drawBadge(s.x, s.y - 15, 'ON', con.id, selected);
      }
    }
  }

  function drawGrid(W, H) {
    const target = 10;
    const minor = niceStep(target / view.scale);
    const major = minor * 10;

    const left = (0 - view.originX) / view.scale;
    const right = (W - view.originX) / view.scale;
    const top = (0 - view.originY) / view.scale;
    const bottom = (H - view.originY) / view.scale;

    const startMinor = Math.floor(left / minor) - 1;
    const endMinor = Math.ceil(right / minor) + 1;

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.055)';
    for (let i = startMinor; i <= endMinor; i++) {
      const wx = i * minor;
      const sx = view.originX + wx * view.scale;
      ctx.beginPath();
      ctx.moveTo(sx + 0.5, 0);
      ctx.lineTo(sx + 0.5, H);
      ctx.stroke();
    }

    const startMinorY = Math.floor(top / minor) - 1;
    const endMinorY = Math.ceil(bottom / minor) + 1;
    for (let i = startMinorY; i <= endMinorY; i++) {
      const wy = i * minor;
      const sy = view.originY + wy * view.scale;
      ctx.beginPath();
      ctx.moveTo(0, sy + 0.5);
      ctx.lineTo(W, sy + 0.5);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.11)';
    const startMajor = Math.floor(left / major) - 1;
    const endMajor = Math.ceil(right / major) + 1;
    for (let i = startMajor; i <= endMajor; i++) {
      const wx = i * major;
      const sx = view.originX + wx * view.scale;
      ctx.beginPath();
      ctx.moveTo(sx + 0.5, 0);
      ctx.lineTo(sx + 0.5, H);
      ctx.stroke();
    }

    const startMajorY = Math.floor(top / major) - 1;
    const endMajorY = Math.ceil(bottom / major) + 1;
    for (let i = startMajorY; i <= endMajorY; i++) {
      const wy = i * major;
      const sy = view.originY + wy * view.scale;
      ctx.beginPath();
      ctx.moveTo(0, sy + 0.5);
      ctx.lineTo(W, sy + 0.5);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.4;
    const axisY = view.originY + 0.5;
    const axisX = view.originX + 0.5;

    ctx.beginPath();
    ctx.moveTo(0, axisY);
    ctx.lineTo(W, axisY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(axisX, 0);
    ctx.lineTo(axisX, H);
    ctx.stroke();
  }

  function drawLine(l, selected, hovered) {
    const a = state.points.get(l.p1);
    const b = state.points.get(l.p2);
    if (!a || !b) return;
    const s1 = worldToScreen(a.x, a.y);
    const s2 = worldToScreen(b.x, b.y);

    if (selected || hovered) {
      ctx.strokeStyle = selected ? 'rgba(251,191,36,0.30)' : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.stroke();
    }

    ctx.strokeStyle = selected ? SELECTION_COLOR : statusColor();
    ctx.lineWidth = selected ? 2.6 : 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.stroke();
  }

  function drawCircle(c, selected, hovered) {
    const p = state.points.get(c.center);
    if (!p) return;
    const s = worldToScreen(p.x, p.y);
    const r = c.r * view.scale;

    if (selected || hovered) {
      ctx.strokeStyle = selected ? 'rgba(251,191,36,0.30)' : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = selected ? SELECTION_COLOR : statusColor();
    ctx.lineWidth = selected ? 2.4 : 1.8;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawPoint(p, selected, hovered) {
    const s = worldToScreen(p.x, p.y);
    ctx.fillStyle = selected ? SELECTION_COLOR : statusColor();
    ctx.beginPath();
    ctx.arc(s.x, s.y, 4.2, 0, Math.PI * 2);
    ctx.fill();

    if (p.fixed) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1.3;
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(15,17,21,0.95)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (selected) {
      ctx.strokeStyle = SELECTION_COLOR;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
      ctx.stroke();
    } else if (hovered) {
      ctx.strokeStyle = 'rgba(255,255,255,0.72)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawSnapIndicator() {
    if (!snapId) return;
    const p = state.points.get(snapId);
    if (!p) return;
    const s = worldToScreen(p.x, p.y);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s.x, s.y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(34,197,94,0.25)';
    ctx.stroke();
  }

  function drawPendingPreview() {
    if (!pending) return;
    const center = state.points.get(pending.id);
    if (!center) return;

    let target;
    if (snapId && state.points.has(snapId)) target = state.points.get(snapId);
    else target = screenToWorld(lastMouse.x, lastMouse.y);

    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = 'rgba(203,213,225,0.55)';
    ctx.lineWidth = 1.4;

    if (pending.type === 'line') {
      const a = worldToScreen(center.x, center.y);
      const b = worldToScreen(target.x, target.y);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    } else {
      const r = Math.hypot(target.x - center.x, target.y - center.y) * view.scale;
      if (r > 0.5) {
        const s = worldToScreen(center.x, center.y);
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function render() {
    const W = window.innerWidth;
    const H = window.innerHeight;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(0, 0, W, H);

    drawGrid(W, H);

    badgeRects = [];

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const l of state.lines.values()) drawLine(l, selectionSet.has(l.id), hoverId === l.id);
    for (const c of state.circles.values()) drawCircle(c, selectionSet.has(c.id), hoverId === c.id);
    for (const p of state.points.values()) drawPoint(p, selectionSet.has(p.id), hoverId === p.id);

    drawPendingPreview();
    drawSnapIndicator();

    for (const c of state.constraints.values()) {
      drawConstraintBadge(c, selectionSet.has(c.id));
    }
  }

  function animationLoop() {
    if (dirty) {
      render();
      dirty = false;
    }
    requestAnimationFrame(animationLoop);
  }

  function onMouseDown(e) {
    if (e.button === 1 || (e.button === 0 && spaceDown)) {
      pan = { x: e.clientX, y: e.clientY, originX: view.originX, originY: view.originY };
      e.preventDefault();
      return;
    }

    if (e.button !== 0) return;

    const hit = hitTestEntity(e.clientX, e.clientY);

    if (tool === 'select') {
      if (!hit) {
        if (!e.shiftKey) {
          setSelection([]);
        }
        requestRender();
        return;
      }

      const wasSelected = selectionSet.has(hit.id);

      if (e.shiftKey) {
        if (wasSelected) {
          removeSelection(hit.id);
          drag = null;
        } else {
          addSelection(hit.id);
          if (hit.kind === 'point') {
            const p = state.points.get(hit.id);
            if (p && !p.fixed) drag = { id: hit.id };
          }
        }
      } else {
        setSelection([hit.id]);
        if (hit.kind === 'point') {
          const p = state.points.get(hit.id);
          if (p && !p.fixed) drag = { id: hit.id };
        }
      }

      syncInputWithSelection();
      requestRender();
      return;
    }

    if (tool === 'point') {
      const w = screenToWorld(e.clientX, e.clientY);
      addPoint(w.x, w.y);
      commitHistory();
      solveNow();
      requestRender();
      return;
    }

    if (tool === 'line') {
      handleLineDown(e);
      return;
    }

    if (tool === 'circle') {
      handleCircleDown(e);
      return;
    }
  }

  function onMouseMove(e) {
    lastMouse = { x: e.clientX, y: e.clientY };

    if (pan) {
      view.originX = pan.originX + (e.clientX - pan.x);
      view.originY = pan.originY + (e.clientY - pan.y);
      requestRender();
      return;
    }

    if (drag) {
      const p = state.points.get(drag.id);
      if (p) {
        const w = screenToWorld(e.clientX, e.clientY);
        p.x = w.x;
        p.y = w.y;
        solveNow(drag.id);
        requestRender();
      }
      return;
    }

    hoverId = null;
    snapId = null;

    if (tool === 'select') {
      const hit = hitTestEntity(e.clientX, e.clientY);
      if (hit) hoverId = hit.id;
    } else if (tool === 'line' || tool === 'circle') {
      if (pending) {
        const exclude = pending.type === 'circle' ? pending.id : (pending.created ? pending.id : null);
        snapId = findSnapPoint(e.clientX, e.clientY, exclude);
      } else {
        snapId = findSnapPoint(e.clientX, e.clientY, null);
      }
    }

    requestRender();
  }

  function onMouseUp(e) {
    if (pan) pan = null;

    if (drag) {
      const moved = true;
      drag = null;
      if (moved) {
        solveNow();
        commitHistory();
      }
      requestRender();
    }
  }

  function onWheel(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const nextScale = clamp(view.scale * factor, 1e-4, 100000);
    if (!isFinite(nextScale) || nextScale === view.scale) return;

    const w = screenToWorld(e.clientX, e.clientY);
    view.scale = nextScale;
    view.originX = e.clientX - w.x * view.scale;
    view.originY = e.clientY - w.y * view.scale;
    requestRender();
  }

  function onDoubleClick(e) {
    const hit = hitTestEntity(e.clientX, e.clientY);
    if (!hit) return;

    let constraint = null;
    if (hit.kind === 'constraint') {
      constraint = state.constraints.get(hit.id);
    } else {
      for (const c of state.constraints.values()) {
        if (isDimensional(c) && c.entities.includes(hit.id)) {
          constraint = c;
          break;
        }
      }
    }

    if (constraint && isDimensional(constraint)) {
      setSelection([constraint.id]);
      dimInput.value = String(sanitizeConstraintValue(constraint.type, constraint.value));
      syncInputWithSelection();
    } else {
      setSelection([hit.id]);
    }

    requestRender();
  }

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function setTool(t) {
    tool = t;
    cancelPending();
    for (const btn of toolButtons) {
      const active = btn.dataset.tool === t;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    requestRender();
  }

  toolButtons.forEach(btn => btn.addEventListener('click', () => setTool(btn.dataset.tool)));
  constraintButtons.forEach(btn => btn.addEventListener('click', () => applyConstraint(btn.dataset.constraint)));
  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);
  clearBtn.addEventListener('click', clearSketch);

  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('dblclick', onDoubleClick);

  dimInput.addEventListener('input', () => updateDimensionFromInput(true));
  dimInput.addEventListener('change', () => updateDimensionFromInput(true));

  window.addEventListener('keydown', e => {
    if (isTypingTarget(e.target)) return;

    if (e.ctrlKey || e.metaKey) {
      const k = e.key.toLowerCase();
      if (k === 'z') {
        if (e.shiftKey) redo();
        else undo();
        e.preventDefault();
        return;
      }
      if (k === 'y') {
        redo();
        e.preventDefault();
        return;
      }
    }

    if (e.key === 'Escape') {
      if (pending) cancelPending();
      else {
        setSelection([]);
        requestRender();
      }
      return;
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && selection.length) {
      deleteSelection();
      return;
    }

    if (e.code === 'Space' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      spaceDown = true;
    }
  });

  window.addEventListener('keyup', e => {
    if (e.code === 'Space') spaceDown = false;
  });

  function loadInitial() {
    let loaded = false;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        restoreSerialized(saved);
        loaded = true;
      }
    } catch (e) {
      loaded = false;
    }

    if (!loaded) {
      state.points.clear();
      state.lines.clear();
      state.circles.clear();
      state.constraints.clear();
      nextId = 1;
      selection = [];
      selectionSet = new Set();
      pending = null;
      snapId = null;
      drag = null;
      pan = null;
      nextId = 1;
      resetView();
      refreshStatus();
    }

    undoStack.length = 0;
    redoStack.length = 0;
    commitHistory();
    syncInputWithSelection();
    requestRender();
  }

  window.__arena = {
    getState() {
      normalizeConstraints();
      recomputeFixedFlags();
      solver.maxError = computeMaxError();
      solver.dof = computeDOF();

      const entityCount = state.points.size + state.lines.size + state.circles.size;
      let status;
      if (solver.dof < 0 || solver.maxError > OVER_TOL || (entityCount > 0 && solver.dof === 0 && solver.maxError > SOLVER_TOL)) {
        status = 'over';
      } else if (entityCount > 0 && solver.dof === 0 && solver.maxError <= SOLVER_TOL) {
        status = 'fully';
      } else {
        status = 'under';
      }
      solver.status = status;
      updateStatusUI();

      return {
        points: Array.from(state.points.values()).map(p => ({
          id: p.id,
          x: p.x,
          y: p.y,
          fixed: !!p.fixed
        })),
        lines: Array.from(state.lines.values()).map(l => ({ id: l.id, p1: l.p1, p2: l.p2 })),
        circles: Array.from(state.circles.values()).map(c => ({ id: c.id, center: c.center, r: c.r })),
        constraints: Array.from(state.constraints.values()).map(c => {
          const out = { id: c.id, type: c.type, entities: c.entities.slice() };
          if (isDimensional(c)) out.value = sanitizeConstraintValue(c.type, c.value);
          return out;
        }),
        dof: solver.dof,
        status: solver.status,
        maxError: solver.maxError
      };
    },

    screenToWorld(clientX, clientY) {
      return screenToWorld(clientX, clientY);
    },

    worldToScreen(x, y) {
      return worldToScreen(x, y);
    },

    select(ids) {
      setSelection(ids);
      requestRender();
      return selection.slice();
    },

    solve() {
      return solveNow();
    }
  };

  loadInitial();
  setTool('select');
  setHint(DEFAULT_HINT);
  animationLoop();
})();
</script>
</body>
</html>
```