```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Silk — Tearable Cloth</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #e6e0d5; }
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  #cloth { position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: block; touch-action: none; }
  #ui {
    position: fixed; top: 12px; left: 12px; width: 230px; padding: 12px 14px;
    background: rgba(28, 30, 40, 0.85); color: #f2f0ea; border-radius: 14px;
    font-size: 12px; user-select: none; z-index: 10; backdrop-filter: blur(8px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.25);
  }
  #ui h3 { margin: 0 0 10px 0; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; }
  .row { display: flex; align-items: center; gap: 8px; margin: 7px 0; }
  .row label { flex: 0 0 auto; width: 62px; }
  input[type="range"] { flex: 1; height: 4px; }
  #wind { width: 16px; height: 16px; accent-color: #7f9cc4; }
  #reset {
    margin-top: 10px; width: 100%; padding: 7px 0; border: none; border-radius: 9px;
    background: #7f9cc4; color: #fff; font-weight: 600; font-size: 12px; cursor: pointer;
  }
  #reset:hover { background: #6d8db4; }
  #stats { margin-top: 9px; font-size: 11px; color: #cfc9bd; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; line-height: 1.5; }
</style>
</head>
<body>
<canvas id="cloth"></canvas>
<div id="ui">
  <h3>S I L K</h3>
  <div class="row"><input type="checkbox" id="wind"><label for="wind">Wind</label></div>
  <div class="row"><input type="range" id="gravity" min="0" max="400" step="2" value="150"><label for="gravity">Gravity</label></div>
  <div class="row"><input type="range" id="solverIterations" min="1" max="8" step="1" value="3"><label for="solverIterations">Solver</label></div>
  <button id="reset">Reset cloth</button>
  <div id="stats">FPS --.-- | Particles 0 | Constraints 0 | Pinned 0</div>
</div>
<script>
'use strict';
(function () {
  var canvas = document.getElementById('cloth');
  var ctx = canvas.getContext('2d');
  var windEl = document.getElementById('wind');
  var resetEl = document.getElementById('reset');
  var gravityEl = document.getElementById('gravity');
  var solverEl = document.getElementById('solverIterations');
  var statsEl = document.getElementById('stats');

  var W = window.innerWidth;
  var H = window.innerHeight;
  var DPR = 1;
  var originX = 0;

  var SPACING = 12;
  var COLS = 52;
  var ROWS = 36;
  var PINNED_Y = 150;
  var TEAR_FACTOR = 1.6;
  var CUT_RADIUS = 10;
  var GRAVITY = 150;
  var SIM_SOLVER_ITER = 3;
  var WIND_ON = false;
  var PAUSED = false;
  var DAMP = 0.92;

  var particles = [];
  var constraints = [];
  var conMap = new Map();
  var grabbed = null;
  var cutMode = false;
  var simTime = 0;

  function idx(i, j) { return j * COLS + i; }
  function makeKey(a, b) { return a < b ? a + '-' + b : b + '-' + a; }
  function addConstraint(a, b, rest, stiffness) {
    var c = { a: a, b: b, rest: rest, stiffness: stiffness, torn: false };
    constraints.push(c);
    conMap.set(makeKey(a, b), c);
  }

  function buildConstraints() {
    constraints = [];
    conMap.clear();
    for (var j = 0; j < ROWS - 1; j++) {
      for (var i = 0; i < COLS - 1; i++) {
        addConstraint(idx(i, j), idx(i + 1, j), SPACING, 0.85);
      }
    }
    for (var j = 0; j < ROWS - 1; j++) {
      for (var i = 0; i < COLS; i++) {
        addConstraint(idx(i, j), idx(i, j + 1), SPACING, 0.85);
      }
    }
  }

  function buildParticles() {
    particles = [];
    for (var j = 0; j < ROWS; j++) {
      for (var i = 0; i < COLS; i++) {
        var x = originX + i * SPACING;
        var y = PINNED_Y + j * SPACING;
        var pinned = (j === 0);
        particles.push({
          x: x, y: y, px: x, py: y,
          velX: 0, velY: 0,
          invMass: pinned ? 0 : 1,
          pinned: pinned,
          ix: i, iy: j
        });
      }
    }
  }

  function resetCloth() {
    originX = W / 2 - ((COLS - 1) * SPACING) / 2;
    buildParticles();
    buildConstraints();
    grabbed = null;
    cutMode = false;
  }

  function getWind(x, y, t) {
    if (!WIND_ON) return { x: 0, y: 0 };
    var speed = 34 * (1 + 0.6 * Math.sin(t * 0.31) + 0.4 * Math.sin(t * 0.77 + 2.1));
    var ang = 0.5;
    var wx = Math.cos(ang) * speed;
    var wy = Math.sin(ang) * speed;
    var tx = (Math.sin(x * 0.012 + t * 0.9) * Math.cos(y * 0.013 - t * 0.6) + Math.sin(x * 0.008 - t * 1.1 + y * 0.006)) * 16;
    var ty = (Math.cos(x * 0.011 - t * 0.8) * Math.sin(y * 0.01 + t * 1.4) + Math.cos(x * 0.009 + t * 0.5)) * 16;
    return { x: wx + tx, y: wy + ty };
  }

  function step(dt) {
    simTime += dt;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (p.pinned) continue;
      if (p === grabbed) continue;
      var w = WIND_ON ? getWind(p.x, p.y, simTime) : { x: 0, y: 0 };
      p.velX = p.velX * DAMP + (w.x * dt);
      p.velY = p.velY * DAMP + ((GRAVITY + w.y) * dt);
      p.x += p.velX * dt;
      p.y += p.velY * dt;
    }
    for (var it = 0; it < SIM_SOLVER_ITER; it++) {
      for (var ci = 0; ci < constraints.length; ci++) {
        var c = constraints[ci];
        if (c.torn) continue;
        var a = particles[c.a];
        var b = particles[c.b];
        var invSum = a.invMass + b.invMass;
        if (invSum <= 0) continue;
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1e-6) continue;
        var e = dist - c.rest;
        var k = e * c.stiffness;
        var dirx = dx / dist;
        var diry = dy / dist;
        var moveA = k * a.invMass / invSum;
        var moveB = k * b.invMass / invSum;
        if (moveA !== 0) { a.x -= dirx * moveA; a.y -= diry * moveA; }
        if (moveB !== 0) { b.x -= dirx * moveB; b.y -= diry * moveB; }
        if (dist > c.rest * TEAR_FACTOR) c.torn = true;
      }
    }
  }

  function setGrab(x, y) {
    if (!grabbed) return;
    grabbed.x = x;
    grabbed.y = y;
    grabbed.px = x;
    grabbed.py = y;
    grabbed.velX = 0;
    grabbed.velY = 0;
    grabbed.invMass = 0;
  }

  function tryCut(x, y) {
    for (var i = 0; i < constraints.length; i++) {
      var c = constraints[i];
      if (c.torn) continue;
      var a = particles[c.a];
      var b = particles[c.b];
      var dx = b.x - a.x;
      var dy = b.y - a.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1e-6) continue;
      var t = ((x - a.x) * dx + (y - a.y) * dy) / (dist * dist);
      if (t < 0) t = 0;
      if (t > 1) t = 1;
      var cx = a.x + t * dx;
      var cy = a.y + t * dy;
      var ddx = x - cx;
      var ddy = y - cy;
      if (Math.sqrt(ddx * ddx + ddy * ddy) < CUT_RADIUS) {
        c.torn = true;
      }
    }
  }

  function buildTris() {
    var tris = [];
    for (var j = 0; j < ROWS - 1; j++) {
      for (var i = 0; i < COLS - 1; i++) {
        var tl = idx(i, j);
        var tr = idx(i + 1, j);
        var bl = idx(i, j + 1);
        var br = idx(i + 1, j + 1);
        var topC = conMap.get(makeKey(tl, tr));
        var bottomC = conMap.get(makeKey(bl, br));
        var leftC = conMap.get(makeKey(tl, bl));
        var rightC = conMap.get(makeKey(tr, br));
        var topIntact = topC && !topC.torn;
        var bottomIntact = bottomC && !bottomC.torn;
        var leftIntact = leftC && !leftC.torn;
        var rightIntact = rightC && !rightC.torn;
        if (topIntact && rightIntact) {
          tris.push([tl, tr, br]);
        }
        if (leftIntact && bottomIntact) {
          tris.push([tl, br, bl]);
        }
      }
    }
    return tris;
  }

  function stretchOf(t) {
    var idxs = [t[0], t[1], t[2]];
    var maxS = 0;
    for (var k = 0; k < 3; k++) {
      var a = particles[idxs[k]];
      var b = particles[idxs[(k + 1) % 3]];
      var dij = Math.abs(a.ix - b.ix) + Math.abs(a.iy - b.iy);
      var rest = (dij === 1) ? SPACING : SPACING * Math.sqrt(2);
      var len = Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
      var s = len / rest - 1;
      if (s < 0) s = -s;
      if (s > maxS) maxS = s;
    }
    return maxS;
  }

  function render() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ede8df');
    g.addColorStop(1, '#d8d1c4');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    var tris = buildTris();
    for (var i = 0; i < tris.length; i++) {
      var t = tris[i];
      var p0 = particles[t[0]];
      var p1 = particles[t[1]];
      var p2 = particles[t[2]];
      var s = stretchOf(t);
      var shade = 1 - 0.5 * Math.min(s, 0.9);
      if (shade > 1) shade = 1;
      if (shade < 0.45) shade = 0.45;
      var cx = (p0.x + p1.x + p2.x) / 3;
      var cy = (p0.y + p1.y + p2.y) / 3;
      var gi = Math.floor(cx / SPACING);
      var gj = Math.floor(cy / SPACING);
      if (((gi + gj) % 2) === 1) shade = shade * 0.95;
      else shade = shade * 1.04;
      var r = Math.round(86 * shade);
      var gg = Math.round(124 * shade);
      var b = Math.round(172 * shade);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.closePath();
      ctx.fillStyle = 'rgb(' + r + ',' + gg + ',' + b + ')';
      ctx.fill();
    }
  }

  function computeStats() {
    var sx = 0, sy = 0;
    for (var i = 0; i < particles.length; i++) { sx += particles[i].x; sy += particles[i].y; }
    var n = particles.length;
    var centroid = { x: n ? sx / n : 0, y: n ? sy / n : 0 };
    var intact = 0;
    for (var i = 0; i < constraints.length; i++) { if (!constraints[i].torn) intact++; }
    var pinnedCount = 0;
    for (var i = 0; i < particles.length; i++) { if (particles[i].pinned) pinnedCount++; }
    return { particles: n, constraints: intact, pinned: pinnedCount, centroid: centroid };
  }

  window.__arena = {
    stats: function () { return computeStats(); },
    reset: function () { resetCloth(); }
  };

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = Math.round(W) + 'px';
    canvas.style.height = Math.round(H) + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var newOriginX = W / 2 - ((COLS - 1) * SPACING) / 2;
    var dx = newOriginX - originX;
    originX = newOriginX;
    if (dx !== 0) {
      for (var i = 0; i < particles.length; i++) {
        particles[i].x += dx;
        particles[i].px += dx;
      }
    }
  }

  function getPos(e) {
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onDown(e) {
    if (e.button === 2 || (e.button === 0 && e.shiftKey)) { cutMode = true; return; }
    if (e.button === 0) {
      var p = getPos(e);
      var best = null;
      var bestD = 1600;
      for (var i = 0; i < particles.length; i++) {
        var q = particles[i];
        var d = (q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y);
        if (d < bestD) { bestD = d; best = q; }
      }
      if (best) { grabbed = best; setGrab(p.x, p.y); }
    }
  }

  function onMove(e) {
    var p = getPos(e);
    var isCut = cutMode || (e.shiftKey && (e.buttons & 1));
    if (isCut) { tryCut(p.x, p.y); return; }
    if ((e.buttons & 1) && !e.shiftKey && grabbed) { setGrab(p.x, p.y); }
  }

  function onUp() {
    grabbed = null;
    cutMode = false;
  }

  canvas.addEventListener('pointerdown', function (e) { onDown(e); });
  canvas.addEventListener('pointermove', function (e) { onMove(e); });
  canvas.addEventListener('pointerup', function (e) { onUp(); });
  canvas.addEventListener('pointercancel', function (e) { onUp(); });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'Spacebar') {
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.isContentEditable) return;
      e.preventDefault();
      PAUSED = !PAUSED;
    }
  });

  windEl.addEventListener('change', function (e) { WIND_ON = e.target.checked; });
  resetEl.addEventListener('click', function () { resetCloth(); });
  gravityEl.addEventListener('input', function (e) { GRAVITY = parseFloat(e.target.value) || 150; });
  gravityEl.addEventListener('change', function (e) { GRAVITY = parseFloat(e.target.value) || 150; });
  solverEl.addEventListener('input', function (e) { SIM_SOLVER_ITER = parseInt(e.target.value, 10) || 3; });

  var lastTime = performance.now();
  var acc = 0;
  var frames = 0;
  var fps = 0;
  var fpsTime = performance.now();

  function frame(now) {
    var frameTime = now - lastTime;
    lastTime = now;
    if (!PAUSED) {
      acc += frameTime;
      var STEP = 1000 / 60;
      var steps = 0;
      while (acc >= STEP) {
        step(STEP);
        acc -= STEP;
        steps++;
        if (steps > 6) { acc = 0; break; }
      }
      if (acc > 250) acc = 0;
    }
    render();
    frames++;
    if (now - fpsTime >= 1000) {
      fps = frames * 1000 / (now - fpsTime);
      frames = 0;
      fpsTime = now;
    }
    var st = computeStats();
    statsEl.textContent = 'FPS ' + fps.toFixed(0) + ' | Particles ' + st.particles + ' | Constraints ' + st.constraints + ' | Pinned ' + st.pinned;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  resetCloth();
  resize();
  window.addEventListener('resize', resize);
})();
</script>
</body>
</html>
```