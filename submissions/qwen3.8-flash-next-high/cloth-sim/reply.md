```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Silk — interactive cloth simulation</title>
<style>
  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background:
      radial-gradient(1200px 900px at 50% 35%, #16213a 0%, #0a101d 45%, #04060a 100%);
    color: #e8f2ff;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  canvas#c {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    background: transparent;
    touch-action: none;
  }

  #panel {
    position: fixed;
    left: 16px;
    top: 16px;
    width: 278px;
    padding: 14px 15px 13px;
    z-index: 10;
    border-radius: 16px;
    background: rgba(8, 12, 20, 0.62);
    border: 1px solid rgba(110, 170, 255, 0.14);
    box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    user-select: none;
  }

  #panel h1 {
    margin: 0 0 10px;
    font-size: 14px;
    font-weight: 650;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #c8dcff;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 10px 0;
    min-height: 26px;
  }

  .rowLabel {
    font-size: 12px;
    color: #b9cbdf;
  }

  .spacer {
    flex: 1;
  }

  .value {
    font-variant-numeric: tabular-nums;
    font-size: 11px;
    color: #86b4ff;
    min-width: 28px;
    text-align: right;
  }

  label {
    display: block;
    margin-bottom: 4px;
    font-size: 11px;
    color: #8fa4b8;
    letter-spacing: 0.04em;
  }

  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 20px;
    margin: 0;
    background: transparent;
    cursor: pointer;
  }

  input[type="range"]::-webkit-slider-runnable-track {
    height: 5px;
    border-radius: 3px;
    background: linear-gradient(90deg, #24344a, #2f62a0);
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 15px;
    height: 15px;
    margin-top: -5px;
    border-radius: 50%;
    background: #e9f3ff;
    border: 1px solid rgba(255, 255, 255, 0.35);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
  }

  input[type="range"]::-moz-range-track {
    height: 5px;
    border-radius: 3px;
    background: linear-gradient(90deg, #24344a, #2f62a0);
  }

  input[type="range"]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #e9f3ff;
    border: 1px solid rgba(255, 255, 255, 0.35);
  }

  #wind {
    -webkit-appearance: none;
    appearance: none;
    width: 44px;
    height: 23px;
    margin: 0;
    border-radius: 12px;
    background: rgba(35, 52, 70, 0.9);
    border: 1px solid rgba(140, 190, 255, 0.25);
    position: relative;
    cursor: pointer;
    transition: background 140ms ease;
  }

  #wind::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #a7b7c6;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
    transition: left 140ms ease, background 140ms ease;
  }

  #wind:checked {
    background: #2b713c;
    border-color: #55d07f;
  }

  #wind:checked::after {
    left: 24px;
    background: #eafff0;
  }

  #reset {
    width: 100%;
    margin-top: 8px;
    padding: 8px 10px;
    border: 1px solid rgba(130, 180, 255, 0.22);
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(43, 66, 102, 0.78), rgba(20, 33, 51, 0.75));
    color: #d8eaff;
    font: inherit;
    font-size: 12px;
    font-weight: 650;
    letter-spacing: 0.04em;
    cursor: pointer;
  }

  #reset:active {
    transform: translateY(1px);
  }

  #stats {
    margin-top: 10px;
    font-size: 11px;
    color: #89b9ff;
    font-variant-numeric: tabular-nums;
    line-height: 1.45;
  }

  #help {
    margin-top: 7px;
    font-size: 10px;
    line-height: 1.45;
    color: #6d7d8f;
  }

  .pauseIndicator {
    color: #ffd57a !important;
  }
</style>
</head>
<body>
<canvas id="c"></canvas>

<div id="panel">
  <h1>Silk</h1>

  <div class="row">
    <label>
      <input type="checkbox" id="wind">
    </label>
    <span class="rowLabel">Wind</span>
  </div>

  <div>
    <label for="gravity">Gravity</label>
    <div class="row" style="margin:0;">
      <input type="range" id="gravity" min="0" max="1800" step="10" value="450">
      <span class="value" id="gravityValue">450</span>
    </div>
  </div>

  <div>
    <label for="iterations">Solver iterations</label>
    <div class="row" style="margin:0;">
      <input type="range" id="iterations" min="2" max="12" step="1" value="5">
      <span class="value" id="iterationsValue">5</span>
    </div>
  </div>

  <button id="reset" type="button">Reset cloth</button>

  <div id="stats">Initializing…</div>
  <div id="help">
    Left-drag pulls · Right-drag or Shift+left-drag cuts · Space pauses
  </div>
</div>

<script>
(() => {
  'use strict';

  const canvas = document.getElementById('c');
  const statsEl = document.getElementById('stats');
  const windInput = document.getElementById('wind');
  const gravityInput = document.getElementById('gravity');
  const iterationsInput = document.getElementById('iterations');
  const gravityValue = document.getElementById('gravityValue');
  const iterationsValue = document.getElementById('iterationsValue');
  const resetButton = document.getElementById('reset');

  // Simulation constants.
  const SIM_DT = 1 / 60;
  const MAX_STEPS = 5;

  const MIN_COLS = 50;
  const MIN_ROWS = 35;
  const MAX_COLS = 72;
  const MAX_ROWS = 52;
  const TARGET_SPACING = 17;
  const MAX_PARTICLES = 2800;

  const TEAR_RATIO = 2.25;
  const STRUCT_STRETCH = 0.32;
  const SHEAR_STRETCH = 0.12;
  const STRUCT_COMP = 0.045;
  const COMP_THRESHOLD = 0.90;

  const WIND_STRENGTH = 220;
  const WIND_GRID_COLS = 8;
  const WIND_GRID_ROWS = 6;

  const DRAG_MAX_STEP = 18;
  const CUT_RADIUS = 6;
  const MAX_VEL = 32;

  const DAMP_NORMAL = 0.986;
  const DAMP_WIND = 0.994;
  const DAMP_IDLE = 0.975;
  const IDLE_TIME_BEFORE_EXTRA_DAMP = 1.0;

  // State.
  let width = 0;
  let height = 0;
  let dpr = 1;

  let mode = 'none';
  let gl = null;
  let ctx2 = null;

  let program = null;
  let aPos = -1, aNormal = -1, aUV = -1, uResolution = -1;
  let posBuffer = null, normalBuffer = null, uvBuffer = null, indexBuffer = null;
  let uvDirty = false;

  let cols = 0;
  let rows = 0;
  let count = 0;

  let px = null, py = null, ox = null, oy = null;
  let pinned = null, origPinned = null;
  let fixedX = null, fixedY = null;

  let ca = null, cb = null, crest = null, cType = null, cIntact = null;
  let edgeH = null, edgeV = null, edgeD = null;

  let constraintCount = 0;
  let intactCount = 0;
  let pinnedCount = 0;

  let posBuf = null, normalBuf = null, indexBuf = null;
  let indexCount = 0;

  let uv = null;
  let zBase = null;
  let z = null;
  let windZ = null;

  const windFieldX = new Float32Array(WIND_GRID_COLS * WIND_GRID_ROWS);
  const windFieldY = new Float32Array(WIND_GRID_COLS * WIND_GRID_ROWS);

  let paused = false;
  let windEnabled = false;
  let gravity = Number(gravityInput.value) || 450;
  let solverIterations = Number(iterationsInput.value) || 5;

  let simTime = 0;
  let idleTimer = 0;
  let needsRender = true;

  let dragIndex = -1;
  let dragTargetX = 0;
  let dragTargetY = 0;
  let cutting = false;
  let cutPrevX = 0;
  let cutPrevY = 0;

  let lastFrame = 0;
  let accumulator = 0;

  let frameCount = 0;
  let lastStatsTime = 0;
  let fps = 0;

  // Shader sources.
  const vertexSource = `
    attribute vec2 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aUV;
    uniform vec2 uResolution;

    varying vec3 vNormal;
    varying vec2 vUV;

    void main() {
      vec2 p = aPosition / uResolution;
      vec2 clip = vec2(p.x * 2.0 - 1.0, -p.y * 2.0 + 1.0);
      gl_Position = vec4(clip, 0.0, 1.0);
      vNormal = aNormal;
      vUV = aUV;
    }
  `;

  const fragmentSource = `
    precision mediump float;

    varying vec3 vNormal;
    varying vec2 vUV;

    void main() {
      vec3 N = normalize(vNormal);
      float back = 0.0;

      if (N.z < -0.02) {
        N = -N;
        back = 1.0;
      }

      vec3 L = normalize(vec3(0.38, -0.58, 0.72));
      vec3 V = vec3(0.0, 0.0, 1.0);

      float nd = max(dot(N, L), 0.0);
      vec3 H = normalize(L + V);
      float spec = pow(max(dot(N, H), 0.0), 48.0);
      float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);

      float u = vUV.x;
      float w = vUV.y;

      vec3 base = mix(
        vec3(0.17, 0.27, 0.45),
        vec3(0.48, 0.13, 0.28),
        smoothstep(0.0, 1.0, w * 0.65 + u * 0.35)
      );

      float stripe = 0.5 + 0.5 * sin(u * 47.0 + w * 11.0);
      float weave  = 0.5 + 0.5 * sin(u * 18.0 - w * 31.0);
      float micro  = 0.5 + 0.5 * sin(u * 91.0 + w * 63.0) * sin(u * 41.0 - w * 77.0);

      base *= 0.84 + 0.09 * stripe + 0.05 * weave + 0.02 * micro;

      float shade = 0.32 + 0.68 * nd + 0.28 * spec + 0.10 * rim;

      if (back > 0.5) {
        shade *= 0.45;
        base = mix(base, vec3(0.06, 0.08, 0.12), 0.7);
      }

      vec3 color = base * shade;
      color += vec3(0.35, 0.42, 0.52) * spec * 0.35;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function clampX(x) {
    return Math.max(1, Math.min(width - 2, x));
  }

  function clampY(y) {
    return Math.max(1, Math.min(height - 2, y));
  }

  function updateCanvasSize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    const cw = Math.max(1, Math.floor(width * dpr));
    const ch = Math.max(1, Math.floor(height * dpr));

    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }

    if (mode === 'webgl' && gl) {
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }

  function compileShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createRenderer() {
    const opts = {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      depth: false
    };

    gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);

    if (!gl) {
      mode = '2d';
      ctx2 = canvas.getContext('2d', { alpha: true });
      return;
    }

    const vs = compileShader(vertexSource, gl.VERTEX_SHADER);
    const fs = compileShader(fragmentSource, gl.FRAGMENT_SHADER);

    if (!vs || !fs) {
      gl = null;
      mode = '2d';
      ctx2 = canvas.getContext('2d', { alpha: true });
      return;
    }

    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      program = null;
      gl = null;
      mode = '2d';
      ctx2 = canvas.getContext('2d', { alpha: true });
      return;
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    aPos = gl.getAttribLocation(program, 'aPosition');
    aNormal = gl.getAttribLocation(program, 'aNormal');
    aUV = gl.getAttribLocation(program, 'aUV');
    uResolution = gl.getUniformLocation(program, 'uResolution');

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    posBuffer = gl.createBuffer();
    normalBuffer = gl.createBuffer();
    uvBuffer = gl.createBuffer();
    indexBuffer = gl.createBuffer();

    mode = 'webgl';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function wrinkle(u, v) {
    return (
      0.42 * Math.sin(u * 5.1 + v * 2.3) +
      0.31 * Math.sin(u * 2.8 - v * 4.1) +
      0.17 * Math.sin((u + v) * 8.7) +
      0.10 * Math.sin((u - v) * 13.3)
    );
  }

  function addConstraint(a, b, rest, type) {
    ca[constraintCount] = a;
    cb[constraintCount] = b;
    crest[constraintCount] = rest;
    cType[constraintCount] = type;
    cIntact[constraintCount] = 1;
    return constraintCount++;
  }

  function buildCloth() {
    const targetWidth = Math.min(width - 50, width * 0.86);
    const targetHeight = Math.min(height - 50, height * 0.62);

    let c = Math.max(MIN_COLS, Math.min(MAX_COLS, Math.floor(targetWidth / TARGET_SPACING) + 1));
    let r = Math.max(MIN_ROWS, Math.min(MAX_ROWS, Math.floor(targetHeight / TARGET_SPACING) + 1));

    if (c * r > MAX_PARTICLES) {
      const scale = Math.sqrt(MAX_PARTICLES / (c * r));
      c = Math.max(MIN_COLS, Math.floor(c * scale));
      r = Math.max(MIN_ROWS, Math.floor(r * scale));
    }

    cols = c;
    rows = r;
    count = cols * rows;

    const qRows = rows - 1;
    const qCols = cols - 1;

    let spacing = Math.min(targetWidth / (cols - 1), targetHeight / (rows - 1));
    spacing = Math.min(spacing, (width - 20) / (cols - 1), (height - 20) / (rows - 1));
    spacing = Math.max(1.0, spacing);

    const clothW = (cols - 1) * spacing;
    const clothH = (rows - 1) * spacing;

    let startX = (width - clothW) * 0.5;
    let startY = height * 0.10;

    if (startX < 10) startX = 10;
    if (startY + clothH > height - 10) startY = height - clothH - 10;
    if (startY < 10) startY = 10;

    px = new Float32Array(count);
    py = new Float32Array(count);
    ox = new Float32Array(count);
    oy = new Float32Array(count);
    pinned = new Uint8Array(count);
    origPinned = new Uint8Array(count);
    fixedX = new Float32Array(count);
    fixedY = new Float32Array(count);

    uv = new Float32Array(count * 2);
    zBase = new Float32Array(count);
    z = new Float32Array(count);
    windZ = new Float32Array(count);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col;
        const x = startX + col * spacing;
        const y = startY + row * spacing;

        px[i] = x;
        py[i] = y;
        ox[i] = x;
        oy[i] = y;

        const u = col / (cols - 1);
        const v = row / (rows - 1);
        uv[i * 2] = u;
        uv[i * 2 + 1] = v;

        const amp = spacing * 0.85 * (0.30 + 0.70 * v);
        zBase[i] = amp * wrinkle(u, v);
        z[i] = zBase[i];
        windZ[i] = 0;

        if (row === 0) {
          pinned[i] = 1;
          origPinned[i] = 1;
          fixedX[i] = x;
          fixedY[i] = y;
        }
      }
    }

    pinnedCount = cols;

    const maxStructH = rows * (cols - 1);
    const maxStructV = (rows - 1) * cols;
    const maxDiag = (rows - 1) * (cols - 1);
    const maxConstraints = maxStructH + maxStructV + maxDiag;

    ca = new Int32Array(maxConstraints);
    cb = new Int32Array(maxConstraints);
    crest = new Float32Array(maxConstraints);
    cType = new Uint8Array(maxConstraints);
    cIntact = new Uint8Array(maxConstraints);

    edgeH = new Int32Array(rows * qCols).fill(-1);
    edgeV = new Int32Array(qRows * cols).fill(-1);
    edgeD = new Int32Array(qRows * qCols).fill(-1);

    constraintCount = 0;
    intactCount = 0;

    // Structural horizontal edges.
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < qCols; col++) {
        const a = row * cols + col;
        const b = a + 1;
        const idx = addConstraint(a, b, spacing, 0);
        edgeH[row * qCols + col] = idx;
        intactCount++;
      }
    }

    // Structural vertical edges.
    for (let row = 0; row < qRows; row++) {
      for (let col = 0; col < cols; col++) {
        const a = row * cols + col;
        const b = a + cols;
        const idx = addConstraint(a, b, spacing, 1);
        edgeV[row * cols + col] = idx;
        intactCount++;
      }
    }

    // Alternating shear diagonals, used by the render triangulation.
    const diagRest = Math.sqrt(spacing * spacing * 2);
    for (let row = 0; row < qRows; row++) {
      for (let col = 0; col < qCols; col++) {
        const quad = row * qCols + col;
        let a, b;

        if (((row + col) & 1) === 0) {
          a = row * cols + col;
          b = (row + 1) * cols + col + 1;
        } else {
          a = row * cols + col + 1;
          b = (row + 1) * cols + col;
        }

        const idx = addConstraint(a, b, diagRest, 2);
        edgeD[quad] = idx;
        intactCount++;
      }
    }

    posBuf = new Float32Array(count * 2);
    normalBuf = new Float32Array(count * 3);

    const maxIndexCount = Math.max(0, qRows * qCols * 6);
    indexBuf = new Uint16Array(maxIndexCount);

    indexCount = 0;

    simTime = 0;
    accumulator = 0;
    idleTimer = 0;

    dragIndex = -1;
    cutting = false;

    if (mode === 'webgl') {
      uvDirty = true;
    }

    needsRender = true;
  }

  function cutConstraint(ci) {
    if (ci >= 0 && ci < constraintCount && cIntact[ci]) {
      cIntact[ci] = 0;
      intactCount--;
    }
  }

  function orient(ax, ay, bx, by, cx, cy) {
    return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  }

  function onSegment(ax, ay, bx, by, cx, cy) {
    const eps = 1e-9;
    return (
      cx >= Math.min(ax, bx) - eps &&
      cx <= Math.max(ax, bx) + eps &&
      cy >= Math.min(ay, by) - eps &&
      cy <= Math.max(ay, by) + eps
    );
  }

  function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    const eps = 1e-9;
    const o1 = orient(ax, ay, bx, by, cx, cy);
    const o2 = orient(ax, ay, bx, by, dx, dy);
    const o3 = orient(cx, cy, dx, dy, ax, ay);
    const o4 = orient(cx, cy, dx, dy, bx, by);

    if (
      ((o1 > eps && o2 < -eps) || (o1 < -eps && o2 > eps)) &&
      ((o3 > eps && o4 < -eps) || (o3 < -eps && o4 > eps))
    ) {
      return true;
    }

    if (Math.abs(o1) <= eps && onSegment(ax, ay, bx, by, cx, cy)) return true;
    if (Math.abs(o2) <= eps && onSegment(ax, ay, bx, by, dx, dy)) return true;
    if (Math.abs(o3) <= eps && onSegment(cx, cy, dx, dy, ax, ay)) return true;
    if (Math.abs(o4) <= eps && onSegment(cx, cy, dx, dy, bx, by)) return true;

    return false;
  }

  function pointSegmentDist2(pxVal, pyVal, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;

    if (len2 < 1e-9) {
      const ex = pxVal - ax;
      const ey = pyVal - ay;
      return ex * ex + ey * ey;
    }

    let t = ((pxVal - ax) * dx + (pyVal - ay) * dy) / len2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;

    const cx = ax + t * dx;
    const cy = ay + t * dy;
    const ex = pxVal - cx;
    const ey = pyVal - cy;
    return ex * ex + ey * ey;
  }

  function cutSegment(x1, y1, x2, y2) {
    const minX = Math.min(x1, x2) - CUT_RADIUS;
    const maxX = Math.max(x1, x2) + CUT_RADIUS;
    const minY = Math.min(y1, y2) - CUT_RADIUS;
    const maxY = Math.max(y1, y2) + CUT_RADIUS;
    const r2 = CUT_RADIUS * CUT_RADIUS;

    for (let ci = 0; ci < constraintCount; ci++) {
      if (!cIntact[ci]) continue;

      const a = ca[ci];
      const b = cb[ci];
      const x3 = px[a];
      const y3 = py[a];
      const x4 = px[b];
      const y4 = py[b];

      if (
        Math.max(x3, x4) < minX ||
        Math.min(x3, x4) > maxX ||
        Math.max(y3, y4) < minY ||
        Math.min(y3, y4) > maxY
      ) {
        continue;
      }

      let cutIt = false;

      if (segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4)) {
        cutIt = true;
      } else {
        if (pointSegmentDist2(x1, y1, x3, y3, x4, y4) <= r2) cutIt = true;
        else if (pointSegmentDist2(x2, y2, x3, y3, x4, y4) <= r2) cutIt = true;
        else if (pointSegmentDist2(x3, y3, x1, y1, x2, y2) <= r2) cutIt = true;
        else if (pointSegmentDist2(x4, y4, x1, y1, x2, y2) <= r2) cutIt = true;
      }

      if (cutIt) cutConstraint(ci);
    }
  }

  function nearestParticle(x, y) {
    let best = -1;
    let bestD = 40 * 40;

    for (let i = 0; i < count; i++) {
      const dx = px[i] - x;
      const dy = py[i] - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD) {
        bestD = d2;
        best = i;
      }
    }

    return best;
  }

  function startDrag(x, y) {
    if (paused) return;

    const i = nearestParticle(x, y);
    if (i < 0) return;

    dragIndex = i;
    dragTargetX = clampX(x);
    dragTargetY = clampY(y);
    pinned[i] = 1;
    idleTimer = 0;
  }

  function endDrag() {
    if (dragIndex < 0) return;

    const i = dragIndex;
    if (origPinned[i]) {
      px[i] = fixedX[i];
      py[i] = fixedY[i];
      ox[i] = fixedX[i];
      oy[i] = fixedY[i];
      pinned[i] = 1;
    } else {
      pinned[i] = 0;
    }

    dragIndex = -1;
  }

  function startCut(x, y) {
    if (paused) return;
    if (dragIndex >= 0) endDrag();

    cutting = true;
    cutPrevX = clampX(x);
    cutPrevY = clampY(y);
    idleTimer = 0;
  }

  function endInteraction() {
    endDrag();
    cutting = false;
  }

  function updateWindField(t) {
    const W = WIND_GRID_COLS;
    const H = WIND_GRID_ROWS;

    for (let gy = 0; gy < H; gy++) {
      const v = gy / (H - 1);
      const rowBase = gy * W;

      for (let gx = 0; gx < W; gx++) {
        const u = gx / (W - 1);
        const idx = rowBase + gx;

        let gust = 0.55 + 0.25 * Math.sin(t * 0.31 + u * 2.0 + v * 1.7);
        gust += 0.20 * Math.sin(t * 0.17 - u * 1.1 + v * 2.9);
        if (gust < 0.05) gust = 0.05;
        if (gust > 1.0) gust = 1.0;

        let wx = 0.55 * Math.sin(t * 0.73 + v * 5.7 + u * 1.2);
        wx += 0.35 * Math.sin(t * 1.27 + (u - v) * 3.3 + u * 2.0);

        let wy = 0.25 * Math.sin(t * 0.49 + u * 4.8 - v * 1.3);
        wy += 0.20 * Math.sin(t * 1.63 + v * 6.1 + u * 0.7);

        windFieldX[idx] = WIND_STRENGTH * gust * wx;
        windFieldY[idx] = WIND_STRENGTH * gust * wy;
      }
    }
  }

  function simulateStep(dt) {
    simTime += dt;

    if (windEnabled) {
      updateWindField(simTime);
      idleTimer = 0;
    } else {
      if (dragIndex < 0 && !cutting) idleTimer += dt;
      else idleTimer = 0;
    }

    const dt2 = dt * dt;
    let damp;
    if (windEnabled) damp = DAMP_WIND;
    else damp = (idleTimer > IDLE_TIME_BEFORE_EXTRA_DAMP) ? DAMP_IDLE : DAMP_NORMAL;

    // Move dragged particle first, then treat it as a fixed hand during solving.
    if (dragIndex >= 0) {
      const i = dragIndex;
      const tx = clampX(dragTargetX);
      const ty = clampY(dragTargetY);

      let dx = tx - px[i];
      let dy = ty - py[i];
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d > DRAG_MAX_STEP) {
        const s = DRAG_MAX_STEP / d;
        dx *= s;
        dy *= s;
      }

      px[i] += dx;
      py[i] += dy;
      ox[i] = px[i];
      oy[i] = py[i];
      pinned[i] = 1;
      windZ[i] = 0;
    }

    const invW = width > 0 ? 1 / width : 0;
    const invH = height > 0 ? 1 / height : 0;

    for (let i = 0; i < count; i++) {
      if (pinned[i]) {
        windZ[i] = 0;
        continue;
      }

      let vx = (px[i] - ox[i]) * damp;
      let vy = (py[i] - oy[i]) * damp;

      const vMag2 = vx * vx + vy * vy;
      if (vMag2 > MAX_VEL * MAX_VEL) {
        const s = MAX_VEL / Math.sqrt(vMag2);
        vx *= s;
        vy *= s;
      }

      ox[i] = px[i];
      oy[i] = py[i];

      let ax = 0;
      let ay = gravity;

      if (windEnabled) {
        let u = px[i] * invW;
        let v = py[i] * invH;
        if (u < 0) u = 0; else if (u > 1) u = 1;
        if (v < 0) v = 0; else if (v > 1) v = 1;

        const fx = u * (WIND_GRID_COLS - 1);
        const fy = v * (WIND_GRID_ROWS - 1);

        let ix0 = Math.floor(fx);
        let iy0 = Math.floor(fy);
        let ix1 = ix0 + 1;
        let iy1 = iy0 + 1;

        if (ix0 < 0) ix0 = 0; else if (ix0 > WIND_GRID_COLS - 1) ix0 = WIND_GRID_COLS - 1;
        if (iy0 < 0) iy0 = 0; else if (iy0 > WIND_GRID_ROWS - 1) iy0 = WIND_GRID_ROWS - 1;
        if (ix1 < 0) ix1 = 0; else if (ix1 > WIND_GRID_COLS - 1) ix1 = WIND_GRID_COLS - 1;
        if (iy1 < 0) iy1 = 0; else if (iy1 > WIND_GRID_ROWS - 1) iy1 = WIND_GRID_ROWS - 1;

        const tx = fx - ix0;
        const ty = fy - iy0;
        if (tx < 0) tx = 0; else if (tx > 1) tx = 1;
        if (ty < 0) ty = 0; else if (ty > 1) ty = 1;

        const i00 = iy0 * WIND_GRID_COLS + ix0;
        const i10 = iy0 * WIND_GRID_COLS + ix1;
        const i01 = iy1 * WIND_GRID_COLS + ix0;
        const i11 = iy1 * WIND_GRID_COLS + ix1;

        const wx00 = windFieldX[i00] * (1 - tx) + windFieldX[i10] * tx;
        const wx01 = windFieldX[i01] * (1 - tx) + windFieldX[i11] * tx;
        const wx = wx00 * (1 - ty) + wx01 * ty;

        const wy00 = windFieldY[i00] * (1 - tx) + windFieldY[i10] * tx;
        const wy01 = windFieldY[i01] * (1 - tx) + windFieldY[i11] * tx;
        const wy = wy00 * (1 - ty) + wy01 * ty;

        ax += wx;
        ay += wy;

        let nz = (wx + wy) / WIND_STRENGTH;
        if (nz < -1) nz = -1; else if (nz > 1) nz = 1;
        windZ[i] = 0.22 * nz;
      } else {
        windZ[i] = 0;
      }

      px[i] += vx + ax * dt2;
      py[i] += vy + ay * dt2;
    }

    const iterations = Math.max(1, Math.min(12, Math.round(solverIterations) || 5));

    for (let it = 0; it < iterations; it++) {
      for (let ci = 0; ci < constraintCount; ci++) {
        if (!cIntact[ci]) continue;

        const a = ca[ci];
        const b = cb[ci];
        const rest = crest[ci];
        const type = cType[ci];

        const dx = px[b] - px[a];
        const dy = py[b] - py[a];
        const dist2 = dx * dx + dy * dy;

        if (dist2 < 1e-12) {
          continue;
        }

        const dist = Math.sqrt(dist2);

        if (dist > rest * TEAR_RATIO) {
          cutConstraint(ci);
          continue;
        }

        const pa = pinned[a];
        const pb = pinned[b];

        if (pa && pb) {
          continue;
        }

        if (dist > rest) {
          const stiffness = (type === 2) ? SHEAR_STRETCH : STRUCT_STRETCH;
          const k = (dist - rest) / dist * stiffness;

          if (pa) {
            px[b] -= dx * k;
            py[b] -= dy * k;
          } else if (pb) {
            px[a] += dx * k;
            py[a] += dy * k;
          } else {
            const hx = dx * 0.5 * k;
            const hy = dy * 0.5 * k;
            px[a] += hx;
            py[a] += hy;
            px[b] -= hx;
            py[b] -= hy;
          }
        } else if (type !== 2 && dist < rest * COMP_THRESHOLD) {
          const k = (rest - dist) / dist * STRUCT_COMP;

          if (pa) {
            px[b] += dx * k;
            py[b] += dy * k;
          } else if (pb) {
            px[a] -= dx * k;
            py[a] -= dy * k;
          } else {
            const hx = dx * 0.5 * k;
            const hy = dy * 0.5 * k;
            px[a] -= hx;
            py[a] -= hy;
            px[b] += hx;
            py[b] += hy;
          }
        }
      }
    }

    // Keep everything inside the viewport.
    const minX = 1;
    const maxX = width - 2;
    const minY = 1;
    const maxY = height - 2;

    for (let i = 0; i < count; i++) {
      if (pinned[i]) continue;

      if (px[i] < minX) {
        px[i] = minX;
        ox[i] = minX;
      } else if (px[i] > maxX) {
        px[i] = maxX;
        ox[i] = maxX;
      }

      if (py[i] < minY) {
        py[i] = minY;
        oy[i] = minY;
      } else if (py[i] > maxY) {
        py[i] = maxY;
        oy[i] = maxY;
      }
    }
  }

  function addTriangle(a, b, c, withNormals) {
    indexBuf[indexCount++] = a;
    indexBuf[indexCount++] = b;
    indexBuf[indexCount++] = c;

    if (!withNormals) return;

    const ax = posBuf[a * 2];
    const ay = posBuf[a * 2 + 1];
    const az = z[a];

    const bx = posBuf[b * 2];
    const by = posBuf[b * 2 + 1];
    const bz = z[b];

    const cx = posBuf[c * 2];
    const cy = posBuf[c * 2 + 1];
    const cz = z[c];

    const ux = bx - ax;
    const uy = by - ay;
    const uz = bz - az;

    const vx = cx - ax;
    const vy = cy - ay;
    const vz = cz - az;

    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;

    const bi = a * 3;
    normalBuf[bi] += nx;
    normalBuf[bi + 1] += ny;
    normalBuf[bi + 2] += nz;

    const bj = b * 3;
    normalBuf[bj] += nx;
    normalBuf[bj + 1] += ny;
    normalBuf[bj + 2] += nz;

    const ck = c * 3;
    normalBuf[ck] += nx;
    normalBuf[ck + 1] += ny;
    normalBuf[ck + 2] += nz;
  }

  function normalizeNormals() {
    for (let i = 0; i < count; i++) {
      const j = i * 3;
      let nx = normalBuf[j];
      let ny = normalBuf[j + 1];
      let nz = normalBuf[j + 2];

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

      if (!(len > 1e-8)) {
        nx = 0;
        ny = 0;
        nz = 1;
      } else {
        nx /= len;
        ny /= len;
        nz /= len;
      }

      normalBuf[j] = nx;
      normalBuf[j + 1] = ny;
      normalBuf[j + 2] = nz;
    }
  }

  function prepareRender() {
    if (count === 0) {
      indexCount = 0;
      return;
    }

    for (let i = 0; i < count; i++) {
      posBuf[i * 2] = px[i];
      posBuf[i * 2 + 1] = py[i];

      z[i] = zBase[i];
      if (windEnabled) z[i] += windZ[i];
    }

    const genNormals = (mode === 'webgl');
    if (genNormals) {
      normalBuf.fill(0);
    }

    indexCount = 0;

    const qRows = rows - 1;
    const qCols = cols - 1;

    for (let r = 0; r < qRows; r++) {
      const row0 = r * cols;
      const row1 = row0 + cols;
      const edgeHRow = r * qCols;
      const edgeHNext = (r + 1) * qCols;
      const edgeVRow = r * cols;

      for (let c = 0; c < qCols; c++) {
        const a = row0 + c;
        const b = a + 1;
        const nodeC = row1 + c;
        const d = row1 + c + 1;

        const ehTop = edgeH[edgeHRow + c];
        const ehBottom = edgeH[edgeHNext + c];
        const evLeft = edgeV[edgeVRow + c];
        const evRight = edgeV[edgeVRow + c + 1];
        const diag = edgeD[r * qCols + c];

        if (((r + c) & 1) === 0) {
          // Split top-left -> bottom-right.
          if (cIntact[ehTop] && cIntact[evRight] && cIntact[diag]) {
            addTriangle(a, b, d, genNormals);
          }
          if (cIntact[diag] && cIntact[ehBottom] && cIntact[evLeft]) {
            addTriangle(a, d, nodeC, genNormals);
          }
        } else {
          // Split top-right -> bottom-left.
          if (cIntact[ehTop] && cIntact[diag] && cIntact[evLeft]) {
            addTriangle(a, b, nodeC, genNormals);
          }
          if (cIntact[evRight] && cIntact[ehBottom] && cIntact[diag]) {
            addTriangle(b, d, nodeC, genNormals);
          }
        }
      }
    }

    if (genNormals) normalizeNormals();
  }

  function drawWebGL() {
    if (!gl || !program) return;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (indexCount <= 0) return;

    gl.useProgram(program);

    if (uResolution !== null && uResolution >= 0) {
      gl.uniform2f(uResolution, width, height);
    }

    if (aPos >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, posBuf, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    }

    if (aNormal >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, normalBuf, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aNormal);
      gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    }

    if (aUV >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
      if (uvDirty) {
        gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
        uvDirty = false;
      }
      gl.enableVertexAttribArray(aUV);
      gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBuf, gl.DYNAMIC_DRAW);

    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
  }

  function draw2D() {
    if (!ctx2) return;

    ctx2.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    ctx2.clearRect(0, 0, width, height);

    if (indexCount <= 0) return;

    const Lx = 0.38;
    const Ly = -0.58;
    const Lz = 0.72;

    // Normalized H = normalize(L + V), V = (0,0,1)
    const Hx = 0.204;
    const Hy = -0.312;
    const Hz = 0.924;

    for (let t = 0; t < indexCount; t += 3) {
      const a = indexBuf[t];
      const b = indexBuf[t + 1];
      const c = indexBuf[t + 2];

      const ax = posBuf[a * 2];
      const ay = posBuf[a * 2 + 1];
      const az = z[a];

      const bx = posBuf[b * 2];
      const by = posBuf[b * 2 + 1];
      const bz = z[b];

      const cx = posBuf[c * 2];
      const cy = posBuf[c * 2 + 1];
      const cz = z[c];

      const ux = bx - ax;
      const uy = by - ay;
      const uz = bz - az;

      const vx = cx - ax;
      const vy = cy - ay;
      const vz = cz - az;

      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz = ux * vy - uy * vx;

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      let back = 0;
      if (!(len > 1e-8)) {
        nx = 0;
        ny = 0;
        nz = 1;
      } else {
        nx /= len;
        ny /= len;
        nz /= len;
        if (nz < -0.02) {
          nx = -nx;
          ny = -ny;
          nz = -nz;
          back = 1;
        }
      }

      const u = (uv[a * 2] + uv[b * 2] + uv[c * 2]) / 3;
      const w = (uv[a * 2 + 1] + uv[b * 2 + 1] + uv[c * 2 + 1]) / 3;

      let rr = 0.17 + (0.48 - 0.17) * w;
      let gg = 0.27 + (0.13 - 0.27) * w;
      let bb = 0.45 + (0.28 - 0.45) * w;

      const stripe = 0.5 + 0.5 * Math.sin(u * 47.0 + w * 11.0);
      rr *= 0.85 + 0.09 * stripe;
      gg *= 0.85 + 0.09 * stripe;
      bb *= 0.85 + 0.09 * stripe;

      let nd = nx * Lx + ny * Ly + nz * Lz;
      if (nd < 0) nd = 0;

      let hd = nx * Hx + ny * Hy + nz * Hz;
      if (hd < 0) hd = 0;
      const spec = Math.pow(hd, 40.0);

      let shade = 0.34 + 0.64 * nd + 0.26 * spec;
      if (back) shade *= 0.48;

      rr *= shade;
      gg *= shade;
      bb *= shade;

      rr += 0.12 * spec;
      gg += 0.15 * spec;
      bb += 0.18 * spec;

      if (rr < 0) rr = 0; else if (rr > 1) rr = 1;
      if (gg < 0) gg = 0; else if (gg > 1) gg = 1;
      if (bb < 0) bb = 0; else if (bb > 1) bb = 1;

      ctx2.beginPath();
      ctx2.moveTo(ax, ay);
      ctx2.lineTo(bx, by);
      ctx2.lineTo(cx, cy);
      ctx2.closePath();
      ctx2.fillStyle = 'rgb(' +
        ((rr * 255) | 0) + ',' +
        ((gg * 255) | 0) + ',' +
        ((bb * 255) | 0) +
        ')';
      ctx2.fill();
    }
  }

  function drawRender() {
    if (mode === 'webgl') {
      drawWebGL();
    } else if (mode === '2d') {
      draw2D();
    }
  }

  function updateStatsText() {
    const pauseText = paused ? ' <span class="pauseIndicator">PAUSED</span>' : '';
    statsEl.innerHTML =
      'FPS ' + Math.round(fps) +
      ' · Particles ' + count +
      ' · Constraints ' + intactCount +
      ' · Pinned ' + pinnedCount +
      pauseText;
  }

  function stats() {
    let cx = 0;
    let cy = 0;

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        cx += px[i];
        cy += py[i];
      }
      cx /= count;
      cy /= count;
    }

    return {
      particles: count,
      constraints: intactCount,
      pinned: pinnedCount,
      centroid: { x: cx, y: cy }
    };
  }

  window.__arena = { stats };

  // Events.
  document.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('mousedown', e => {
    if (paused) return;
    e.preventDefault();

    if (e.button === 2 || (e.button === 0 && e.shiftKey)) {
      startCut(e.clientX, e.clientY);
    } else if (e.button === 0) {
      if (cutting) cutting = false;
      startDrag(e.clientX, e.clientY);
    }
  });

  window.addEventListener('mousemove', e => {
    if (paused) return;

    if (dragIndex >= 0) {
      dragTargetX = e.clientX;
      dragTargetY = e.clientY;
    } else if (cutting) {
      const x = clampX(e.clientX);
      const y = clampY(e.clientY);
      cutSegment(cutPrevX, cutPrevY, x, y);
      cutPrevX = x;
      cutPrevY = y;
    }
  });

  window.addEventListener('mouseup', () => {
    endInteraction();
  });

  window.addEventListener('keydown', e => {
    if (e.code !== 'Space' || e.repeat) return;

    const el = document.activeElement;
    const textFocused = el &&
      ((el.tagName === 'INPUT' && el.type === 'text') || el.isContentEditable);

    if (textFocused) return;

    e.preventDefault();
    paused = !paused;
    needsRender = true;

    if (!paused) {
      accumulator = 0;
      lastFrame = performance.now();
    }
  });

  windInput.addEventListener('change', () => {
    windEnabled = windInput.checked;
    idleTimer = 0;
  });

  gravityInput.addEventListener('input', () => {
    gravity = Number(gravityInput.value) || 0;
    gravityValue.textContent = String(gravity);
    idleTimer = 0;
  });

  iterationsInput.addEventListener('input', () => {
    solverIterations = Number(iterationsInput.value) || 5;
    iterationsValue.textContent = String(solverIterations);
    idleTimer = 0;
  });

  resetButton.addEventListener('click', () => {
    paused = false;
    buildCloth();
  });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      updateCanvasSize();
      buildCloth();
      needsRender = true;
    }, 120);
  });

  function loop(now) {
    requestAnimationFrame(loop);

    let frameDt = (now - lastFrame) / 1000;
    if (frameDt < 0) frameDt = 0;
    if (frameDt > 0.25) frameDt = 0.1;
    lastFrame = now;

    frameCount++;
    if (now - lastStatsTime > 250) {
      const elapsed = (now - lastStatsTime) / 1000;
      if (elapsed > 0) fps = frameCount / elapsed;
      frameCount = 0;
      lastStatsTime = now;
      updateStatsText();
    }

    if (!paused) {
      accumulator += frameDt;

      let steps = 0;
      while (accumulator >= SIM_DT) {
        simulateStep(SIM_DT);
        accumulator -= SIM_DT;
        steps++;

        if (steps >= MAX_STEPS) {
          accumulator = 0;
          break;
        }
      }

      needsRender = true;
    }

    if (needsRender) {
      prepareRender();
      drawRender();
      needsRender = false;
    }
  }

  // Initialize.
  gravityValue.textContent = String(Math.round(gravity));
  iterationsValue.textContent = String(Math.round(solverIterations));

  updateCanvasSize();
  createRenderer();
  buildCloth();

  lastFrame = performance.now();
  lastStatsTime = lastFrame;
  requestAnimationFrame(loop);
})();
</script>
</body>
</html>
```