Here's a complete single-file HTML document that turns a 60×42 particle cloth into an interactive canvas you can drag, tear, and blow around.
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
<title>Silk — tearable cloth</title>
<style>
  *{box-sizing:border-box;}
  html,body{height:100%;margin:0;overflow:hidden;}
  body{
    background:
      radial-gradient(ellipse 72% 58% at 50% 44%, rgba(152, 30, 78, .30), rgba(0,0,0,0) 72%),
      radial-gradient(ellipse 110% 70% at 50% 118%, rgba(78, 26, 100, .34), rgba(0,0,0,0) 66%),
      linear-gradient(180deg,#0a0610 0%,#120a19 46%,#050308 100%);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    color:#f6e7ee;
  }
  canvas#cloth{
    position:fixed; inset:0; display:block;
    width:100%; height:100%;
    touch-action:none;
    cursor:crosshair;
  }

  #hud{
    position:fixed; top:16px; right:16px; width:252px;
    padding:16px 18px 14px;
    border-radius:16px;
    background: linear-gradient(160deg, rgba(38,20,36,.76), rgba(13,8,18,.84));
    border:1px solid rgba(255,196,216,.14);
    box-shadow: 0 22px 60px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.07);
    backdrop-filter: blur(16px) saturate(150%);
    -webkit-backdrop-filter: blur(16px) saturate(150%);
    font-size:12px; line-height:1.4;
    user-select:none; -webkit-user-select:none;
    z-index:10;
  }
  #hud .brand{
    font-family: Georgia, "Times New Roman", serif;
    font-size:19px; letter-spacing:.34em; text-transform:uppercase;
    color:#ffe6ee;
    text-shadow: 0 0 22px rgba(255,110,150,.45);
    margin-bottom:1px;
  }
  #hud .sub{
    font-size:9.5px; letter-spacing:.26em; text-transform:uppercase;
    color:#a9829a; margin-bottom:14px;
  }
  .ctrl{
    display:flex; align-items:center; gap:10px;
    padding:5px 0;
  }
  .ctrl label{
    flex:1 1 auto;
    color:#dcc3cf; font-size:11.5px; letter-spacing:.06em;
    cursor:pointer;
  }
  .ctrl .num{
    width:34px; text-align:right; font-variant-numeric: tabular-nums;
    color:#ffb9cf; font-size:11px;
  }
  input[type=range]{
    -webkit-appearance:none; appearance:none;
    width:104px; height:16px; background:transparent; outline:none; cursor:pointer;
    flex:0 0 auto;
  }
  input[type=range]::-webkit-slider-runnable-track{
    height:3px; border-radius:2px;
    background:linear-gradient(90deg, rgba(255,120,160,.75), rgba(255,255,255,.12));
  }
  input[type=range]::-webkit-slider-thumb{
    -webkit-appearance:none; appearance:none;
    width:12px; height:12px; margin-top:-4.5px; border-radius:50%;
    background:#ffe3ec;
    box-shadow: 0 0 10px rgba(255,110,160,.85), 0 1px 2px rgba(0,0,0,.6);
    transition: transform .12s ease;
  }
  input[type=range]:active::-webkit-slider-thumb{ transform: scale(1.18); }

  #wind{
    -webkit-appearance:none; appearance:none;
    width:36px; height:19px; border-radius:10px;
    background:rgba(255,255,255,.10);
    border:1px solid rgba(255,255,255,.13);
    position:relative; cursor:pointer; outline:none; margin:0;
    transition: background .2s ease, border-color .2s ease;
    flex:0 0 auto;
  }
  #wind::after{
    content:""; position:absolute; top:2px; left:2px;
    width:13px; height:13px; border-radius:50%;
    background:#e0c3ce;
    transition: transform .18s cubic-bezier(.4,1.4,.6,1), background .18s;
  }
  #wind:checked{
    background:linear-gradient(90deg,#a81f47,#e35a78);
    border-color:rgba(255,180,205,.55);
  }
  #wind:checked::after{ transform:translateX(16px); background:#fff; }

  #reset{
    display:block; width:100%; margin-top:12px;
    padding:8px 10px;
    border-radius:9px;
    border:1px solid rgba(255,170,200,.28);
    background:linear-gradient(180deg, rgba(180,40,80,.42), rgba(110,20,52,.42));
    color:#ffe6ee; font-size:11.5px; letter-spacing:.13em; text-transform:uppercase;
    font-family:inherit; cursor:pointer;
    transition: background .16s ease, transform .1s ease, box-shadow .16s;
  }
  #reset:hover{
    background:linear-gradient(180deg, rgba(215,52,98,.6), rgba(140,26,66,.6));
    box-shadow:0 0 20px rgba(255,80,130,.3);
  }
  #reset:active{ transform:translateY(1px); }

  .stats{
    margin-top:13px; padding-top:11px;
    border-top:1px solid rgba(255,196,216,.11);
    display:grid; grid-template-columns:1fr auto; gap:3px 10px;
    font-size:11px; color:#a98ea0; letter-spacing:.04em;
  }
  .stats b{
    color:#ffd2e0; font-weight:500; font-variant-numeric: tabular-nums;
    text-align:right;
  }

  #hint{
    position:fixed; left:50%; bottom:16px; transform:translateX(-50%);
    font-size:11px; letter-spacing:.16em; text-transform:uppercase;
    color:rgba(220,180,200,.42);
    white-space:nowrap; pointer-events:none; user-select:none;
    z-index:10;
  }
</style>
</head>
<body>
<canvas id="cloth"></canvas>

<div id="hud">
  <div class="brand">Silk</div>
  <div class="sub">tearable cloth</div>

  <div class="ctrl">
    <label for="wind">Wind</label>
    <input id="wind" type="checkbox" />
  </div>
  <div class="ctrl">
    <label for="gravity">Gravity</label>
    <input id="gravity" type="range" min="0" max="2400" step="20" value="900" />
    <span class="num" id="gravityVal">900</span>
  </div>
  <div class="ctrl">
    <label for="iters">Solver</label>
    <input id="iters" type="range" min="1" max="12" step="1" value="4" />
    <span class="num" id="itersVal">4</span>
  </div>

  <button id="reset" type="button">Reset cloth</button>

  <div class="stats">
    <span>FPS</span><b id="sFps">–</b>
    <span>Particles</span><b id="sParts">–</b>
    <span>Links</span><b id="sLinks">–</b>
    <span>Pinned</span><b id="sPins">–</b>
  </div>
</div>

<div id="hint">drag to pull · right-drag to cut · space to pause</div>

<script>
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  DOM                                                                */
  /* ------------------------------------------------------------------ */
  var canvas      = document.getElementById('cloth');
  var ctx         = canvas.getContext('2d');
  var elFps       = document.getElementById('sFps');
  var elParts     = document.getElementById('sParts');
  var elLinks     = document.getElementById('sLinks');
  var elPins      = document.getElementById('sPins');
  var elWind      = document.getElementById('wind');
  var elGravity   = document.getElementById('gravity');
  var elGravVal   = document.getElementById('gravityVal');
  var elIters     = document.getElementById('iters');
  var elItersVal  = document.getElementById('itersVal');
  var elReset     = document.getElementById('reset');

  /* ------------------------------------------------------------------ */
  /*  Constants                                                          */
  /* ------------------------------------------------------------------ */
  var COLS = 60, ROWS = 42, NP = COLS * ROWS;
  var FOCAL = 1800;
  var DT = 1 / 60;
  var MAXZ = 420;
  var STIFF = [1.0, 0.55, 0.18];
  var TEAR  = [2.4, 2.0, 3.0];
  var NB = 64;

  /* ------------------------------------------------------------------ */
  /*  Particle state                                                     */
  /* ------------------------------------------------------------------ */
  var X  = new Float32Array(NP), Y  = new Float32Array(NP), Z  = new Float32Array(NP);
  var PX = new Float32Array(NP), PY = new Float32Array(NP), PZ = new Float32Array(NP);
  var PIN = new Uint8Array(NP);
  var FRZ = new Uint8Array(NP);
  var SX  = new Float32Array(NP), SY = new Float32Array(NP);

  /* ------------------------------------------------------------------ */
  /*  Constraint topology (built once)                                   */
  /* ------------------------------------------------------------------ */
  var tA = [], tB = [], tT = [];
  var hIdx = new Int32Array(ROWS * (COLS - 1)).fill(-1);
  var vIdx = new Int32Array((ROWS - 1) * COLS).fill(-1);

  (function buildTopology() {
    function id(i, j) { return j * COLS + i; }
    for (var j = 0; j < ROWS; j++) {
      for (var i = 0; i < COLS; i++) {
        if (i < COLS - 1) {
          hIdx[j * (COLS - 1) + i] = tA.length;
          tA.push(id(i, j)); tB.push(id(i + 1, j)); tT.push(0);
        }
        if (j < ROWS - 1) {
          vIdx[j * COLS + i] = tA.length;
          tA.push(id(i, j)); tB.push(id(i, j + 1)); tT.push(0);
        }
        if (i < COLS - 1 && j < ROWS - 1) {
          tA.push(id(i, j));     tB.push(id(i + 1, j + 1)); tT.push(1);
          tA.push(id(i + 1, j)); tB.push(id(i, j + 1));     tT.push(1);
        }
        if (i < COLS - 2) { tA.push(id(i, j)); tB.push(id(i + 2, j)); tT.push(2); }
        if (j < ROWS - 2) { tA.push(id(i, j)); tB.push(id(i, j + 2)); tT.push(2); }
      }
    }
  })();

  var NC = tA.length;
  var CA    = Int32Array.from(tA);
  var CB    = Int32Array.from(tB);
  var CT    = Uint8Array.from(tT);
  var CREST = new Float32Array(NC);
  var CLIM  = new Float32Array(NC);
  var ALIVE = new Uint8Array(NC);
  var aliveCount = 0;

  /* ------------------------------------------------------------------ */
  /*  Sim / UI state                                                     */
  /* ------------------------------------------------------------------ */
  var vw = 1, vh = 1, dpr = 1;
  var spacing = 10, originX = 0, originY = 0, clothW = 0, clothH = 0;
  var gravity = 900;
  var iterations = 4;
  var windOn = false;
  var paused = false;
  var simTime = 0;
  var acc = 0;
  var lastTime = 0;
  var fpsAvg = 60;
  var lastHud = 0;
  var pinCount = 0;
  var needsRender = true;

  var grabIdx = -1, grabTX = 0, grabTY = 0, grabOffX = 0, grabOffY = 0;
  var dragMode = 0; // 0 none, 1 grab, 2 cut
  var lastCX = 0, lastCY = 0;

  /* ------------------------------------------------------------------ */
  /*  Colour ramp                                                        */
  /* ------------------------------------------------------------------ */
  var RAMP = (function () {
    var stops = [
      [0.00,  14,   3,  10],
      [0.20,  62,   8,  26],
      [0.42, 138,  22,  52],
      [0.62, 196,  58,  84],
      [0.80, 235, 122, 138],
      [0.92, 252, 190, 198],
      [1.00, 255, 244, 246]
    ];
    var out = [];
    for (var b = 0; b < NB; b++) {
      var t = b / (NB - 1);
      var i = 0;
      while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
      var s0 = stops[i], s1 = stops[i + 1];
      var f = (t - s0[0]) / (s1[0] - s0[0]);
      if (f < 0) f = 0; else if (f > 1) f = 1;
      var r = Math.round(s0[1] + (s1[1] - s0[1]) * f);
      var g = Math.round(s0[2] + (s1[2] - s0[2]) * f);
      var bl = Math.round(s0[3] + (s1[3] - s0[3]) * f);
      out.push('rgb(' + r + ',' + g + ',' + bl + ')');
    }
    return out;
  })();

  var buckets = [];
  for (var bi = 0; bi < NB; bi++) buckets.push([]);

  /* ------------------------------------------------------------------ */
  /*  Canvas / layout                                                    */
  /* ------------------------------------------------------------------ */
  function resizeCanvas() {
    vw = Math.max(1, window.innerWidth);
    vh = Math.max(1, window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function project() {
    var cx = vw * 0.5, cy = vh * 0.5;
    for (var k = 0; k < NP; k++) {
      var p = FOCAL / (FOCAL - Z[k]);
      SX[k] = cx + (X[k] - cx) * p;
      SY[k] = cy + (Y[k] - cy) * p;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Build / reset the cloth                                            */
  /* ------------------------------------------------------------------ */
  function buildCloth() {
    var sp = Math.min((vw * 0.52) / (COLS - 1), (vh * 0.62) / (ROWS - 1));
    sp = Math.max(3.5, sp);
    spacing = sp;

    var comp = 0.965;
    clothW = sp * (COLS - 1) * comp;
    clothH = sp * (ROWS - 1);
    var ox = (vw - clothW) * 0.5;
    var oy = (vh - clothH) * 0.5;
    originX = ox; originY = oy;

    for (var j = 0; j < ROWS; j++) {
      for (var i = 0; i < COLS; i++) {
        var k = j * COLS + i;
        var x = ox + i * sp * comp;
        var y = oy + j * sp;
        var fade = j < 5 ? j / 5 : 1;
        var z = Math.sin(i * 0.75) * sp * 0.45 * fade;
        X[k] = x; Y[k] = y; Z[k] = z;
        PX[k] = x; PY[k] = y; PZ[k] = z;
        PIN[k] = (j === 0) ? 1 : 0;
        FRZ[k] = PIN[k];
      }
    }

    for (var c = 0; c < NC; c++) {
      ALIVE[c] = 1;
      var m = CT[c] === 0 ? 1 : (CT[c] === 1 ? Math.SQRT2 : 2);
      var r = sp * m;
      CREST[c] = r;
      var lim = r * TEAR[CT[c]];
      CLIM[c] = lim * lim;
    }
    aliveCount = NC;

    pinCount = 0;
    for (var q = 0; q < NP; q++) if (PIN[q]) pinCount++;

    simTime = 0;
    acc = 0;
    grabIdx = -1;
    dragMode = 0;
    project();
    needsRender = true;
  }

  /* ------------------------------------------------------------------ */
  /*  Simulation step                                                    */
  /* ------------------------------------------------------------------ */
  function step(dt) {
    simTime += dt;
    var dt2 = dt * dt;
    var damp = 0.982;
    var g = gravity;

    /* integrate */
    for (var k = 0; k < NP; k++) {
      if (FRZ[k]) continue;
      var vx = (X[k] - PX[k]) * damp;
      var vy = (Y[k] - PY[k]) * damp;
      var vz = (Z[k] - PZ[k]) * damp;
      var ax = 0, ay = g, az = 0;

      if (windOn) {
        var wx = X[k], wy = Y[k], t = simTime;
        var n1 = Math.sin(wx * 0.017 + t * 1.9) * Math.cos(wy * 0.013 - t * 1.1);
        var n2 = Math.sin((wx * 0.6 + wy) * 0.011 + t * 2.4);
        var gust = 0.62 + 0.38 * Math.sin(t * 0.8 + wx * 0.004);
        var w = (n1 * 0.75 + n2 * 0.55) * gust;
        az += w * 760;
        ax += w * 150;
      }

      PX[k] = X[k]; PY[k] = Y[k]; PZ[k] = Z[k];
      X[k] += vx + ax * dt2;
      Y[k] += vy + ay * dt2;
      Z[k] += vz + az * dt2;

      if (Z[k] > MAXZ) Z[k] = MAXZ;
      else if (Z[k] < -MAXZ) Z[k] = -MAXZ;
    }

    /* grabbed particle follows the cursor */
    if (grabIdx >= 0) {
      var gi = grabIdx;
      X[gi] = grabTX; Y[gi] = grabTY;
      PX[gi] = X[gi]; PY[gi] = Y[gi]; PZ[gi] = Z[gi];
    }

    /* constraint solving */
    for (var it = 0; it < iterations; it++) {
      for (var c = 0; c < NC; c++) {
        if (!ALIVE[c]) continue;
        var a = CA[c], b = CB[c];
        var wa = FRZ[a] ? 0 : 1;
        var wb = FRZ[b] ? 0 : 1;
        var ws = wa + wb;
        if (ws === 0) continue;

        var dx = X[b] - X[a], dy = Y[b] - Y[a], dz = Z[b] - Z[a];
        var d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < 1e-8) continue;
        var d = Math.sqrt(d2);
        var diff = ((d - CREST[c]) / d) * STIFF[CT[c]] / ws;

        if (wa) { X[a] += dx * diff; Y[a] += dy * diff; Z[a] += dz * diff; }
        if (wb) { X[b] -= dx * diff; Y[b] -= dy * diff; Z[b] -= dz * diff; }
      }
    }

    /* tearing */
    for (var c2 = 0; c2 < NC; c2++) {
      if (!ALIVE[c2]) continue;
      var a2 = CA[c2], b2 = CB[c2];
      var ex = X[b2] - X[a2], ey = Y[b2] - Y[a2], ez = Z[b2] - Z[a2];
      if (ex * ex + ey * ey + ez * ez > CLIM[c2]) {
        ALIVE[c2] = 0;
        aliveCount--;
      }
    }

    /* floor collision + static friction */
    var floorY = vh - 6;
    for (var k2 = 0; k2 < NP; k2++) {
      if (FRZ[k2]) continue;
      if (Y[k2] > floorY) {
        Y[k2] = floorY;
        PY[k2] = floorY;
        PX[k2] = X[k2] - (X[k2] - PX[k2]) * 0.4;
        PZ[k2] = Z[k2] - (Z[k2] - PZ[k2]) * 0.4;
      }
      var ux = X[k2] - PX[k2], uy = Y[k2] - PY[k2], uz = Z[k2] - PZ[k2];
      if (ux * ux + uy * uy + uz * uz < 0.0016) {
        PX[k2] = X[k2]; PY[k2] = Y[k2]; PZ[k2] = Z[k2];
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Rendering                                                          */
  /* ------------------------------------------------------------------ */
  var LX = -0.36, LY = -0.50, LZ = 0.79;
  var HX = 0, HY = 0, HZ = 1;

  (function initHalf() {
    var hx = LX, hy = LY, hz = LZ + 1;
    var l = 1 / Math.sqrt(hx * hx + hy * hy + hz * hz);
    HX = hx * l; HY = hy * l; HZ = hz * l;
  })();

  function emitTri(i0, i1, i2, weave) {
    var ax = X[i0], ay = Y[i0], az = Z[i0];
    var ux = X[i1] - ax, uy = Y[i1] - ay, uz = Z[i1] - az;
    var vx = X[i2] - ax, vy = Y[i2] - ay, vz = Z[i2] - az;

    var nx = uy * vz - uz * vy;
    var ny = uz * vx - ux * vz;
    var nz = ux * vy - uy * vx;

    var nl2 = nx * nx + ny * ny + nz * nz;
    if (nl2 < 1e-12) return;
    var inv = 1 / Math.sqrt(nl2);
    nx *= inv; ny *= inv; nz *= inv;

    var ndl = Math.abs(nx * LX + ny * LY + nz * LZ);
    var ndh = Math.abs(nx * HX + ny * HY + nz * HZ);

    var s = ndh * ndh; s *= s; s *= s; s *= s; s *= s; /* ^32 */

    var rim = 1 - Math.abs(nz);
    var lum = 0.115 + 0.70 * ndl + 0.80 * s + 0.34 * rim * rim + weave;
    if (lum < 0) lum = 0; else if (lum > 1) lum = 1;

    var idx = (lum * (NB - 1)) | 0;

    var x0 = SX[i0], y0 = SY[i0];
    var x1 = SX[i1], y1 = SY[i1];
    var x2 = SX[i2], y2 = SY[i2];

    var mx = (x0 + x1 + x2) * (1 / 3);
    var my = (y0 + y1 + y2) * (1 / 3);
    var k = 1.045;

    buckets[idx].push(
      mx + (x0 - mx) * k, my + (y0 - my) * k,
      mx + (x1 - mx) * k, my + (y1 - my) * k,
      mx + (x2 - mx) * k, my + (y2 - my) * k
    );
  }

  function render() {
    ctx.clearRect(0, 0, vw, vh);
    project();

    for (var b = 0; b < NB; b++) buckets[b].length = 0;

    for (var j = 0; j < ROWS - 1; j++) {
      var r0 = j * COLS, r1 = (j + 1) * COLS;
      var hv = j * (COLS - 1);
      var vv0 = j * COLS, vv1 = (j + 1) * COLS;
      for (var i = 0; i < COLS - 1; i++) {
        var a = r0 + i, bb = a + 1, c = r1 + i, d = c + 1;

        var et = ALIVE[hIdx[hv + i]];
        var el = ALIVE[vIdx[vv0 + i]];
        var er = ALIVE[vIdx[vv0 + i + 1]];
        var eb = ALIVE[vIdx[vv1 + i]];

        var tri1 = et && er && eb;
        var tri2 = el && eb && et;
        if (!tri1 && !tri2) continue;

        var w = ((i + j) & 1) ? 0.011 : -0.011;
        if (tri1) emitTri(a, bb, d, w);
        if (tri2) emitTri(a, d, c, w);
      }
    }

    for (var q = 0; q < NB; q++) {
      var arr = buckets[q];
      var len = arr.length;
      if (!len) continue;
      ctx.beginPath();
      for (var p = 0; p < len; p += 6) {
        ctx.moveTo(arr[p], arr[p + 1]);
        ctx.lineTo(arr[p + 2], arr[p + 3]);
        ctx.lineTo(arr[p + 4], arr[p + 5]);
        ctx.closePath();
      }
      ctx.fillStyle = RAMP[q];
      ctx.fill();
    }

    if (grabIdx >= 0) {
      ctx.beginPath();
      ctx.arc(SX[grabIdx], SY[grabIdx], 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,225,238,0.85)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(SX[grabIdx], SY[grabIdx], 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,240,246,0.95)';
      ctx.fill();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Cutting                                                            */
  /* ------------------------------------------------------------------ */
  function segIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    var d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
    if (d === 0) return false;
    var t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
    if (t < 0 || t > 1) return false;
    var u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
    return (u >= 0 && u <= 1);
  }

  function cutSegment(x1, y1, x2, y2) {
    var minx = Math.min(x1, x2) - 2, maxx = Math.max(x1, x2) + 2;
    var miny = Math.min(y1, y2) - 2, maxy = Math.max(y1, y2) + 2;

    for (var c = 0; c < NC; c++) {
      if (!ALIVE[c]) continue;
      var a = CA[c], b = CB[c];
      var ax = SX[a], ay = SY[a], bx = SX[b], by = SY[b];
      if ((ax < minx && bx < minx) || (ax > maxx && bx > maxx) ||
          (ay < miny && by < miny) || (ay > maxy && by > maxy)) continue;
      if (segIntersect(x1, y1, x2, y2, ax, ay, bx, by)) {
        ALIVE[c] = 0;
        aliveCount--;
      }
    }
    needsRender = true;
  }

  /* ------------------------------------------------------------------ */
  /*  Pointer handling                                                   */
  /* ------------------------------------------------------------------ */
  function updateGrabTarget(mx, my) {
    if (grabIdx < 0) return;
    var k = grabIdx;
    var p = FOCAL / (FOCAL - Z[k]);
    var cx = vw * 0.5, cy = vh * 0.5;
    var tx = mx + grabOffX, ty = my + grabOffY;
    grabTX = cx + (tx - cx) / p;
    grabTY = cy + (ty - cy) / p;
  }

  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button === 2 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      dragMode = 2;
      lastCX = e.clientX;
      lastCY = e.clientY;
      needsRender = true;
      return;
    }
    if (e.button !== 0) return;

    var mx = e.clientX, my = e.clientY;
    var best = -1, bestD = 1600; /* 40^2 */
    for (var k = 0; k < NP; k++) {
      var dx = SX[k] - mx, dy = SY[k] - my;
      var d2 = dx * dx + dy * dy;
      if (d2 < bestD) { bestD = d2; best = k; }
    }
    if (best >= 0) {
      grabIdx = best;
      grabOffX = SX[best] - mx;
      grabOffY = SY[best] - my;
      FRZ[best] = 1;
      updateGrabTarget(mx, my);
      dragMode = 1;
      e.preventDefault();
    }
  });

  window.addEventListener('pointermove', function (e) {
    if (dragMode === 2) {
      var x = e.clientX, y = e.clientY;
      if (x !== lastCX || y !== lastCY) {
        cutSegment(lastCX, lastCY, x, y);
        lastCX = x;
        lastCY = y;
      }
    } else if (dragMode === 1 && grabIdx >= 0) {
      updateGrabTarget(e.clientX, e.clientY);
    }
  });

  function endDrag() {
    if (grabIdx >= 0) {
      FRZ[grabIdx] = PIN[grabIdx];
      PX[grabIdx] = X[grabIdx];
      PY[grabIdx] = Y[grabIdx];
      PZ[grabIdx] = Z[grabIdx];
      grabIdx = -1;
    }
    dragMode = 0;
  }

  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  window.addEventListener('blur', endDrag);

  /* ------------------------------------------------------------------ */
  /*  Keyboard                                                           */
  /* ------------------------------------------------------------------ */
  function isTextField() {
    var ae = document.activeElement;
    if (!ae) return false;
    if (ae.isContentEditable) return true;
    if (ae.tagName === 'TEXTAREA') return true;
    if (ae.tagName === 'INPUT') {
      var t = (ae.type || '').toLowerCase();
      return t === 'text' || t === 'search' || t === 'email' || t === 'url' ||
             t === 'tel' || t === 'password' || t === 'number';
    }
    return false;
  }

  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
      if (isTextField()) return;
      e.preventDefault();
      paused = !paused;
      if (!paused) {
        lastTime = performance.now();
        acc = 0;
      }
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      if (isTextField()) return;
      e.preventDefault();
      buildCloth();
    }
  });

  /* ------------------------------------------------------------------ */
  /*  UI wiring                                                          */
  /* ------------------------------------------------------------------ */
  elWind.addEventListener('change', function () { windOn = elWind.checked; });

  elGravity.addEventListener('input', function () {
    gravity = parseFloat(elGravity.value) || 0;
    elGravVal.textContent = String(gravity);
  });

  elIters.addEventListener('input', function () {
    iterations = Math.max(1, Math.min(12, parseInt(elIters.value, 10) || 1));
    elItersVal.textContent = String(iterations);
  });

  elReset.addEventListener('click', function () { buildCloth(); });

  function onResize() {
    resizeCanvas();
    buildCloth();
  }
  window.addEventListener('resize', onResize);

  /* ------------------------------------------------------------------ */
  /*  HUD                                                                */
  /* ------------------------------------------------------------------ */
  function hudTick(now) {
    if (now - lastHud < 160) return;
    lastHud = now;
    elFps.textContent = String(Math.round(fpsAvg));
    elParts.textContent = String(NP);
    elLinks.textContent = String(aliveCount);
    elPins.textContent = String(pinCount);
  }

  /* ------------------------------------------------------------------ */
  /*  Main loop                                                          */
  /* ------------------------------------------------------------------ */
  function frame(now) {
    requestAnimationFrame(frame);

    var raw = now - lastTime;
    lastTime = now;
    if (!(raw > 0)) raw = 16.7;
    if (raw > 200) raw = 16.7; /* tab switch / long stall */
    fpsAvg = fpsAvg * 0.92 + (1000 / Math.max(1, raw)) * 0.08;

    if (paused) {
      if (needsRender) {
        needsRender = false;
        render();
      }
    } else {
      acc += Math.min(raw / 1000, 0.05);
      var steps = 0;
      while (acc >= DT && steps < 4) {
        step(DT);
        acc -= DT;
        steps++;
      }
      if (steps === 4) acc = 0;
      render();
    }

    hudTick(now);
  }

  /* ------------------------------------------------------------------ */
  /*  Grader API                                                         */
  /* ------------------------------------------------------------------ */
  window.__arena = {
    stats: function () {
      var sx = 0, sy = 0;
      var cx = vw * 0.5, cy = vh * 0.5;
      for (var k = 0; k < NP; k++) {
        var p = FOCAL / (FOCAL - Z[k]);
        sx += cx + (X[k] - cx) * p;
        sy += cy + (Y[k] - cy) * p;
      }
      return {
        particles: NP,
        constraints: aliveCount,
        pinned: pinCount,
        centroid: { x: sx / NP, y: sy / NP }
      };
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Boot                                                               */
  /* ------------------------------------------------------------------ */
  resizeCanvas();
  buildCloth();
  elGravVal.textContent = String(gravity);
  elItersVal.textContent = String(iterations);
  lastTime = performance.now();
  requestAnimationFrame(frame);

})();
</script>
</body>
</html>
```
### Simulation, Interaction & Visual Rendering

The cloth is simulated with Verlet integration on 2,520 particles, using structural, shear, and bending constraints for realistic fabric behaviour. Every constraint can tear when stretched beyond its limit, and you can also slice through them with the right mouse button.

**Interaction details**
- **Left-drag** grabs the nearest particle within 40 pixels and pulls the cloth with it.
- **Right-drag** or **Shift+left-drag** cuts any constraint the cursor path crosses.
- **Space** toggles pause; the simulation freezes completely, including tearing and dragging.
- **Wind** adds gusty turbulence across the cloth; **gravity** and **solver iterations** sliders let you adjust the physics live.

**Rendering & feedback**
- The remaining constraints drive a shaded triangle mesh with a 64-step colour ramp, approximating silk through directional lighting, specular highlights, and rim shading.
- Damaged cells are automatically skipped so torn edges stay visibly clean and never bridge a cut.
- The HUD shows live FPS, particle count, intact constraint count, and pinned particles, with a reset button to rebuild the cloth in its initial state.
---

**Optimization Tip:** If you'd like to adjust cloth resolution or solver behaviour, the key parameters are `COLS`, `ROWS`, `STIFF`, `TEAR`, and `iterations` near the top of the script. Lowering `COLS` and `ROWS` reduces CPU cost, while raising `iterations` improves constraint stiffness.