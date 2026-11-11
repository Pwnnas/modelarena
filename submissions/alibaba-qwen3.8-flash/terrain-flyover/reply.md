```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Horizon — WebGL Terrain Flyover</title>
<style>
  html, body {
    margin: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000;
    color: #e9f1fb;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  canvas#gl {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    display: block;
    cursor: grab;
  }
  canvas#gl.dragging {
    cursor: grabbing;
  }
  #hud {
    position: fixed;
    left: 14px;
    bottom: 14px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 10px 12px;
    border-radius: 12px;
    background: rgba(8, 12, 18, 0.52);
    border: 1px solid rgba(150, 190, 220, 0.20);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
    font-size: 12px;
    user-select: none;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .row label {
    opacity: 0.72;
    min-width: 38px;
  }
  input[type="range"] {
    width: 180px;
    accent-color: #7fb6e7;
  }
  input[type="number"] {
    width: 96px;
    color: inherit;
    background: rgba(0, 0, 0, 0.38);
    border: 1px solid rgba(150, 190, 220, 0.24);
    border-radius: 6px;
    padding: 3px 5px;
    font: inherit;
  }
  .pill {
    padding: 2px 9px;
    border-radius: 999px;
    font-variant-numeric: tabular-nums;
    border: 1px solid rgba(255,255,255,.18);
    background: rgba(255,255,255,.08);
  }
  .pill.auto {
    color: #b7ffd2;
    background: rgba(90,220,140,.16);
    border-color: rgba(120,255,170,.35);
  }
  .pill.manual {
    color: #ffd39b;
    background: rgba(255,180,90,.14);
    border-color: rgba(255,190,120,.34);
  }
  #fps {
    margin-left: auto;
    opacity: .72;
    font-variant-numeric: tabular-nums;
  }
  #hint {
    position: fixed;
    right: 14px;
    bottom: 14px;
    z-index: 10;
    text-align: right;
    opacity: 0.46;
    font-size: 11px;
    line-height: 1.35;
    user-select: none;
  }
  #err {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: none;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 30px;
    font-size: 14px;
    background: rgba(0,0,0,.75);
    color: #ffb4b4;
  }
</style>
</head>
<body>
<canvas id="gl"></canvas>

<div id="hud">
  <div class="row">
    <label for="time">Time</label>
    <input id="time" type="range" min="0" max="24" step="0.01" value="9.5">
    <span id="timeLabel">09:30</span>
  </div>
  <div class="row">
    <label for="seed">Seed</label>
    <input id="seed" type="number" value="42">
  </div>
  <div class="row">
    <span id="autopilot" class="pill auto">AUTO</span>
    <span id="fps">— FPS</span>
  </div>
</div>

<div id="hint">
  Drag mouse to look<br>
  W/A/S/D move · Q/E down/up · F autopilot
</div>

<div id="err"></div>

<script>
(function () {
  "use strict";

  /* =========================================================
     DOM
     ========================================================= */
  const canvas = document.getElementById("gl");
  const errEl = document.getElementById("err");
  const timeInput = document.getElementById("time");
  const seedInput = document.getElementById("seed");
  const autopilotEl = document.getElementById("autopilot");
  const fpsEl = document.getElementById("fps");
  const timeLabelEl = document.getElementById("timeLabel");

  function showError(text) {
    errEl.style.display = "flex";
    errEl.textContent = text;
  }

  /* =========================================================
     General helpers
     ========================================================= */
  function clamp(v, a, b) {
    return v < a ? a : (v > b ? b : v);
  }

  function sstep(e0, e1, x) {
    let t = (x - e0) / (e1 - e0);
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function mix(a, b, t) {
    return a + (b - a) * t;
  }

  /* =========================================================
     Deterministic seeded procedural noise (JS side)
     Must match GLSL as closely as practical.
     ========================================================= */
  let seedU = 42 >>> 0;
  const HASH_INV = 1 / 16777216; // 24-bit hash output, exactly representable

  function mixH(x) {
    x >>>= 0;
    x ^= x >>> 16;
    x = Math.imul(x, 0x7feb352d) >>> 0;
    x ^= x >>> 15;
    x = Math.imul(x, 0x84230979) >>> 0;
    x ^= x >>> 16;
    return x >>> 0;
  }

  function hash2i(xi, yi) {
    let h = (Math.imul(xi >>> 0, 374761393) >>> 0)
          ^ (Math.imul(yi >>> 0, 668265263) >>> 0)
          ^ (Math.imul(seedU, 362437811) >>> 0);
    return mixH(h) >>> 0;
  }

  function hash3i(xi, yi, zi) {
    let h = (Math.imul(xi >>> 0, 374761393) >>> 0)
          ^ (Math.imul(yi >>> 0, 668265263) >>> 0)
          ^ (Math.imul(zi >>> 0, 1274126177) >>> 0)
          ^ (Math.imul(seedU, 362437811) >>> 0);
    return mixH(h) >>> 0;
  }

  function noise(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);

    const a = (hash2i(ix, iy) >>> 8) * HASH_INV;
    const b = (hash2i(ix + 1, iy) >>> 8) * HASH_INV;
    const c = (hash2i(ix, iy + 1) >>> 8) * HASH_INV;
    const d = (hash2i(ix + 1, iy + 1) >>> 8) * HASH_INV;

    return mix(mix(a, b, ux), mix(c, d, ux), uy);
  }

  function fbm2(x, y) {
    let v = 0;
    let a = 0.5;
    for (let i = 0; i < 2; i++) {
      v += a * noise(x, y);
      x *= 2;
      y *= 2;
      a *= 0.5;
    }
    return v / 0.75;
  }

  function ridged4(x, y) {
    let v = 0;
    let a = 0.5;
    for (let i = 0; i < 4; i++) {
      const n = noise(x, y);
      const r = 1 - Math.abs(n * 2 - 1);
      v += a * r;
      x *= 2;
      y *= 2;
      a *= 0.5;
    }
    return v / 0.9375;
  }

  // Same structure as GLSL heightInfo().
  function terrainHeight(x, z) {
    const bx = x * 0.0008;
    const bz = z * 0.0008;

    const cont = fbm2(bx + 11.3, bz + 27.1);
    const land = sstep(0.32, 0.68, cont);

    const w1 = noise(bx * 0.7 + 5.2, bz * 0.7 + 1.7) - 0.5;
    const w2 = noise(bx * 0.7 - 3.4, bz * 0.7 + 8.1) - 0.5;

    const px = x * 0.001 + w1 * 0.35;
    const pz = z * 0.001 + w2 * 0.35;

    const hills = fbm2(px * 1.7 + 30.0, pz * 1.7 - 20.0);
    const m = ridged4(px * 3.2 - 15.0, pz * 3.2 + 40.0);

    const sea = -55 + 40 * cont;
    const mStrength = Math.max(m - 0.2, 0) * sstep(0.35, 0.85, land);
    const landH = 8 + 70 * (hills - 0.3) + 340 * mStrength;

    return mix(sea, landH, land);
  }

  /* =========================================================
     State
     ========================================================= */
  const state = {
    seed: 42,
    time: 9.5,
    animTime: 0,
    frozen: false,
    autopilot: true,

    cam: { x: 0, y: 90, z: 0, yaw: 0, pitch: -0.08 },
    vel: { x: 0, y: 0, z: 0 },

    sunDir: [0, 1, 0],
    moonDir: [0, -1, 0],
    sunColor: [1, 1, 1],
    moonColor: [0, 0, 0],
    ambient: [0.2, 0.2, 0.2],

    chunks: 0,
    triangles: 0,

    fov: 62 * Math.PI / 180,
    near: 0.5,
    far: 2600,
    tile: 256,
    radius: 6,
    currentN: 48,
    qualityIndex: 0,
    viewDistance: (6 + 1) * 256,
    aspect: 1,
    tanY: 1,
    tanX: 1
  };

  const keys = Object.create(null);
  const QUALITIES = [
    { n: 48, r: 6 },
    { n: 32, r: 6 },
    { n: 24, r: 6 }
  ];

  /* =========================================================
     Lighting / time-of-day
     ========================================================= */
  function updateLighting() {
    const angle = (state.time - 6) * (Math.PI / 12);
    let sx = Math.cos(angle);
    let sy = Math.sin(angle);
    let sz = 0.24;
    const l = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1;
    sx /= l; sy /= l; sz /= l;

    state.sunDir = [sx, sy, sz];
    state.moonDir = [-sx, -sy, -sz];

    const elev = sy;
    const day = clamp((elev + 0.05) / 0.25, 0, 1);
    const warm = clamp((0.38 - elev) / 0.38, 0, 1);
    const sunI = elev > 0 ? clamp((elev + 0.14) * 1.25, 0, 1) : 0;

    state.sunColor = [
      (1.0 - 0.12 * warm) * sunI,
      (0.93 - 0.45 * warm) * sunI,
      (0.84 - 0.52 * warm) * sunI
    ];

    const ambDay = [0.28, 0.33, 0.42];
    const ambNight = [0.035, 0.048, 0.072];
    state.ambient = [
      mix(ambNight[0], ambDay[0], day),
      mix(ambNight[1], ambDay[1], day),
      mix(ambNight[2], ambDay[2], day)
    ];

    const moonI = clamp(-elev, 0, 1) * 0.27;
    state.moonColor = [
      0.22 * moonI,
      0.28 * moonI,
      0.44 * moonI
    ];
  }

  /* =========================================================
     Camera
     ========================================================= */
  function clampCameraY() {
    const h = terrainHeight(state.cam.x, state.cam.z);
    const minY = Math.max(h + 3.0, 0.5);
    if (state.cam.y < minY) {
      state.cam.y = minY;
      if (state.vel.y < 0) state.vel.y = 0;
    }
  }

  function normalizePitch() {
    state.cam.pitch = clamp(state.cam.pitch, -1.45, 1.45);
    state.cam.yaw = state.cam.yaw % (Math.PI * 2);
    if (state.cam.yaw > Math.PI) state.cam.yaw -= Math.PI * 2;
    if (state.cam.yaw < -Math.PI) state.cam.yaw += Math.PI * 2;
  }

  function cameraBasis() {
    normalizePitch();
    const cp = Math.cos(state.cam.pitch);
    const sp = Math.sin(state.cam.pitch);
    const cy = Math.cos(state.cam.yaw);
    const sy = Math.sin(state.cam.yaw);

    let fx = sy * cp;
    let fy = sp;
    let fz = -cy * cp;

    // right = normalize(cross(forward, worldUp)) = (-fz, 0, fx)
    let rx = -fz;
    let ry = 0;
    let rz = fx;
    const rl = Math.sqrt(rx * rx + rz * rz) || 1;
    rx /= rl;
    rz /= rl;

    // up = cross(right, forward)
    let ux = ry * fz - rz * fy;
    let uy = rz * fx - rx * fz;
    let uz = rx * fy - ry * fx;
    const ul = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1;
    ux /= ul;
    uy /= ul;
    uz /= ul;

    return {
      f: [fx, fy, fz],
      r: [rx, ry, rz],
      u: [ux, uy, uz]
    };
  }

  function fillView(out, cam, b) {
    const f = b.f, r = b.r, u = b.u;
    out[0] = r[0]; out[1] = u[0]; out[2] = -f[0]; out[3] = 0;
    out[4] = r[1]; out[5] = u[1]; out[6] = -f[1]; out[7] = 0;
    out[8] = r[2]; out[9] = u[2]; out[10] = -f[2]; out[11] = 0;
    out[12] = -(r[0] * cam.x + r[1] * cam.y + r[2] * cam.z);
    out[13] = -(u[0] * cam.x + u[1] * cam.y + u[2] * cam.z);
    out[14] = (f[0] * cam.x + f[1] * cam.y + f[2] * cam.z);
    out[15] = 1;
  }

  function fillProjection(out) {
    const aspect = state.aspect;
    const near = state.near;
    const far = state.far;
    const f = 1 / Math.tan(state.fov * 0.5);
    const nf = 1 / (near - far);

    for (let i = 0; i < 16; i++) out[i] = 0;
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[14] = 2 * far * near * nf;
  }

  /* =========================================================
     UI / input
     ========================================================= */
  function setAutopilotUI() {
    autopilotEl.textContent = state.autopilot ? "AUTO" : "MANUAL";
    autopilotEl.className = "pill " + (state.autopilot ? "auto" : "manual");
  }

  function formatTimeLabel() {
    const t = state.time;
    const hh = Math.floor(t);
    const mm = Math.floor((t - hh) * 60);
    timeLabelEl.textContent =
      String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
  }

  function syncTimeUI() {
    if (document.activeElement !== timeInput) {
      timeInput.value = state.time.toFixed(3);
    }
    formatTimeLabel();
  }

  function setSeed(n) {
    const parsed = parseInt(String(n), 10);
    state.seed = Number.isFinite(parsed) ? parsed : 0;
    seedU = state.seed >>> 0;
    if (seedInput.value !== String(state.seed)) {
      seedInput.value = String(state.seed);
    }
    clampCameraY();
  }

  function setTime(h) {
    let v = Number(h);
    if (!Number.isFinite(v)) v = 0;
    v = v % 24;
    if (v < 0) v += 24;
    state.time = v;
    updateLighting();
    syncTimeUI();
  }

  timeInput.addEventListener("input", () => {
    setTime(parseFloat(timeInput.value));
  });
  timeInput.addEventListener("change", () => {
    setTime(parseFloat(timeInput.value));
  });

  seedInput.addEventListener("change", () => {
    setSeed(seedInput.value);
  });

  window.addEventListener("keydown", (e) => {
    const target = e.target;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
      return;
    }

    if (e.code === "KeyF") {
      if (!e.repeat) {
        state.autopilot = !state.autopilot;
        setAutopilotUI();
      }
      e.preventDefault();
      return;
    }

    const isGameKey =
      e.code === "KeyW" || e.code === "KeyA" || e.code === "KeyS" || e.code === "KeyD" ||
      e.code === "KeyQ" || e.code === "KeyE" || e.code === "Space" ||
      e.code === "ShiftLeft" || e.code === "ShiftRight";

    if (isGameKey) {
      keys[e.code] = true;
      if (e.code === "Space") e.preventDefault();
    }
  }, { passive: false });

  window.addEventListener("keyup", (e) => {
    const target = e.target;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
      return;
    }
    keys[e.code] = false;
  });

  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener("mousedown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.classList.add("dragging");
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    state.cam.yaw += dx * 0.0034;
    state.cam.pitch -= dy * 0.0032;
    normalizePitch();
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
    canvas.classList.remove("dragging");
  });

  window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
    dragging = false;
    canvas.classList.remove("dragging");
  });

  /* =========================================================
     Arena API
     ========================================================= */
  function getCamera() {
    return {
      x: state.cam.x,
      y: state.cam.y,
      z: state.cam.z,
      yaw: state.cam.yaw,
      pitch: state.cam.pitch
    };
  }

  function setCamera(o) {
    if (!o || typeof o !== "object") return getCamera();
    state.cam.x = Number(o.x) || 0;
    state.cam.z = Number(o.z) || 0;
    state.cam.y = Number(o.y) || 0;
    if (Number.isFinite(o.yaw)) state.cam.yaw = Number(o.yaw);
    if (Number.isFinite(o.pitch)) state.cam.pitch = Number(o.pitch);
    normalizePitch();
    clampCameraY();
    state.vel.x = state.vel.y = state.vel.z = 0;
    return getCamera();
  }

  window.__arena = {
    freeze(on) {
      state.frozen = !!on;
    },
    setSeed(n) {
      setSeed(n);
    },
    setTime(hours) {
      setTime(hours);
    },
    setCamera(o) {
      return setCamera(o);
    },
    getCamera() {
      return getCamera();
    },
    terrainHeight(x, z) {
      const h = terrainHeight(Number(x) || 0, Number(z) || 0);
      return Number.isFinite(h) ? h : 0;
    },
    stats() {
      return {
        chunks: state.chunks | 0,
        triangles: state.triangles | 0
      };
    }
  };

  /* =========================================================
     Simulation update
     ========================================================= */
  function updateCamera(dt) {
    if (!state.frozen) {
      state.time += dt * 0.2; // 24 h in about 120 s
      if (state.time >= 24) state.time -= 24;
      state.animTime += dt;
      updateLighting();
      syncTimeUI();
    }

    normalizePitch();

    const c = state.cam;
    const v = state.vel;
    const b = cameraBasis();

    const target = { x: 0, y: 0, z: 0 };

    if (state.autopilot) {
      const speed = 46;
      let hx = Math.sin(c.yaw);
      let hz = -Math.cos(c.yaw);
      const hl = Math.sqrt(hx * hx + hz * hz) || 1;
      hx /= hl;
      hz /= hl;

      target.x = hx * speed;
      target.z = hz * speed;

      const clear = 14;
      const waterMin = 8;
      const h0 = terrainHeight(c.x, c.z) + clear;
      const h1 = terrainHeight(c.x + hx * 110, c.z + hz * 110) + clear + 4;
      const h2 = terrainHeight(c.x + hx * 320, c.z + hz * 320) + clear + 9;
      const h3 = terrainHeight(c.x + hx * 700, c.z + hz * 700) + clear + 16;
      const targetY = Math.max(h0, h1, h2, h3, waterMin);

      const dy = targetY - c.y;
      const maxV = 55 * dt;
      c.y += clamp(dy, -maxV, maxV);
    } else {
      const speed = 78;
      const upSpeed = 52;

      if (keys.KeyW) {
        target.x += b.f[0] * speed;
        target.y += b.f[1] * speed;
        target.z += b.f[2] * speed;
      }
      if (keys.KeyS) {
        target.x -= b.f[0] * speed;
        target.y -= b.f[1] * speed;
        target.z -= b.f[2] * speed;
      }
      if (keys.KeyD) {
        target.x += b.r[0] * speed;
        target.z += b.r[2] * speed;
      }
      if (keys.KeyA) {
        target.x -= b.r[0] * speed;
        target.z -= b.r[2] * speed;
      }
      if (keys.KeyE || keys.Space) {
        target.y += upSpeed;
      }
      if (keys.KeyQ || keys.ShiftLeft || keys.ShiftRight) {
        target.y -= upSpeed;
      }
    }

    const acc = 1 - Math.exp(-10 * dt);
    v.x += (target.x - v.x) * acc;
    v.y += (target.y - v.y) * acc;
    v.z += (target.z - v.z) * acc;

    if (!state.autopilot) {
      c.x += v.x * dt;
      c.y += v.y * dt;
      c.z += v.z * dt;
    } else {
      // Horizontal autopilot uses smoothed velocity; vertical handled above.
      v.y = 0;
      c.x += v.x * dt;
      c.z += v.z * dt;
    }

    clampCameraY();
  }

  /* =========================================================
     WebGL setup
     ========================================================= */
  let gl = null;
  let ready = false;

  try {
    gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      depth: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false
    });
  } catch (e) {
    gl = null;
  }

  if (!gl) {
    showError("WebGL2 is required for Horizon in this environment.");
    ready = false;
  } else {
    ready = initGL();
  }

  /* =========================================================
     GLSL common code
     ========================================================= */
  const COMMON = `#version 300 es
precision highp float;
precision highp int;

uniform uint uSeed;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uMoonDir;
uniform vec3 uMoonColor;
uniform vec3 uAmbient;
uniform float uTimeAnim;

uint mixH(uint x) {
  x ^= x >> 16u;
  x *= 0x7feb352du;
  x ^= x >> 15u;
  x *= 0x84230979u;
  x ^= x >> 16u;
  return x;
}

uint hash2i(int xi, int yi) {
  uint h = uint(xi) * 374761393u;
  h ^= uint(yi) * 668265263u;
  h ^= uSeed * 362437811u;
  return mixH(h);
}

uint hash3i(int xi, int yi, int zi) {
  uint h = uint(xi) * 374761393u;
  h ^= uint(yi) * 668265263u;
  h ^= uint(zi) * 1274126177u;
  h ^= uSeed * 362437811u;
  return mixH(h);
}

float hash2Int(int xi, int yi) {
  return float(hash2i(xi, yi) >> 8u) * (1.0 / 16777216.0);
}

float hash3Int(int xi, int yi, int zi) {
  return float(hash3i(xi, yi, zi) >> 8u) * (1.0 / 16777216.0);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * (3.0 - 2.0 * f);
  int xi = int(i.x);
  int yi = int(i.y);

  float a = hash2Int(xi, yi);
  float b = hash2Int(xi + 1, yi);
  float c = hash2Int(xi, yi + 1);
  float d = hash2Int(xi + 1, yi + 1);

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm2(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 2; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v / 0.75;
}

float ridged4(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    float n = noise(p);
    float r = 1.0 - abs(n * 2.0 - 1.0);
    v += a * r;
    p *= 2.0;
    a *= 0.5;
  }
  return v / 0.9375;
}

void heightInfo(vec2 world, out float h, out float biome, out float mountain) {
  vec2 base = world * 0.0008;
  float cont = fbm2(base + vec2(11.3, 27.1));
  float land = smoothstep(0.32, 0.68, cont);

  float w1 = noise(base * 0.7 + vec2(5.2, 1.7)) - 0.5;
  float w2 = noise(base * 0.7 + vec2(-3.4, 8.1)) - 0.5;
  vec2 wp = world * 0.001 + vec2(w1, w2) * 0.35;

  float hills = fbm2(wp * 1.7 + vec2(30.0, -20.0));
  float m = ridged4(wp * 3.2 + vec2(-15.0, 40.0));

  biome = hills;
  mountain = m;

  float sea = -55.0 + 40.0 * cont;
  float mStrength = max(m - 0.2, 0.0) * smoothstep(0.35, 0.85, land);
  float landH = 8.0 + 70.0 * (hills - 0.3) + 340.0 * mStrength;

  h = mix(sea, landH, land);
}

float heightSimple(vec2 world) {
  float cont = noise(world * 0.0007 + vec2(3.7, 11.2));
  float hills = noise(world * 0.002 + vec2(-8.5, 2.1));
  float land = smoothstep(0.35, 0.65, cont);
  float sea = -45.0 + 30.0 * cont;
  float landH = 5.0 + 45.0 * hills;
  return mix(sea, landH, land);
}

vec3 skyFogColor(vec3 dir) {
  dir = normalize(dir);
  float y = max(dir.y, 0.0);
  float grad = pow(y, 0.65);

  float daylight = smoothstep(-0.08, 0.28, uSunDir.y);
  float twilight = exp(-abs(uSunDir.y) * 9.0);

  vec3 topDay = vec3(0.20, 0.45, 0.88);
  vec3 horDay = vec3(0.76, 0.88, 0.99);
  vec3 topNight = vec3(0.018, 0.030, 0.060);
  vec3 horNight = vec3(0.038, 0.068, 0.135);
  vec3 topTw = vec3(0.28, 0.20, 0.36);
  vec3 horTw = vec3(0.97, 0.42, 0.15);

  vec3 top = mix(topNight, topDay, daylight);
  top = mix(top, topTw, twilight);

  vec3 hor = mix(horNight, horDay, daylight);
  hor = mix(hor, horTw, twilight);

  vec3 col = mix(hor, top, grad);

  float sd = dot(dir, uSunDir);
  if (uSunDir.y > -0.22) {
    float s = max(sd, 0.0);
    float glow = pow(s, 5.0) * (0.24 + 0.60 * twilight) + pow(s, 48.0) * 0.85;
    vec3 sunTint = mix(vec3(1.0, 0.45, 0.18), vec3(1.0, 0.96, 0.86), daylight);
    col += sunTint * glow * (0.55 + 0.85 * daylight + 0.70 * twilight);
  }

  return col;
}

vec3 skyColor(vec3 dir) {
  vec3 col = skyFogColor(dir);

  float daylight = smoothstep(-0.08, 0.28, uSunDir.y);

  if (uSunDir.y > -0.12) {
    float sd = dot(dir, uSunDir);
    float disk = smoothstep(0.99925, 0.99962, sd);
    vec3 sunTint = mix(vec3(1.0, 0.48, 0.20), vec3(1.0, 0.97, 0.87), daylight);
    col += sunTint * disk * 3.0;
  }

  float nightFactor = 1.0 - smoothstep(-0.16, 0.05, uSunDir.y);
  if (nightFactor > 0.01) {
    vec3 moonDir = -uSunDir;
    float md = dot(dir, moonDir);
    float disk = smoothstep(0.99905, 0.99940, md);
    float glow = pow(max(md, 0.0), 14.0) * 0.13;
    col += vec3(0.78, 0.83, 0.98) * (disk * 1.6 + glow) * nightFactor;

    if (dir.y > 0.02) {
      vec3 sp = floor(dir * 320.0);
      float r = hash3Int(int(sp.x), int(sp.y), int(sp.z));
      float star = smoothstep(0.9978, 1.0, r) * nightFactor;
      float twinkle = 0.8 + 0.2 * sin(uTimeAnim * 1.8 + r * 64.0);
      col += vec3(1.0, 0.96, 0.88) * star * twinkle * 2.1;
    }
  }

  return col;
}

vec2 waterWaves(vec2 p, float t) {
  float a = p.x * 0.075 + t * 0.82;
  float b = p.y * 0.066 - t * 0.64;
  float c = (p.x + p.y) * 0.048 + t * 1.0;
  float d = (p.x * 0.061 - p.y * 0.043) - t * 0.88;

  float dx = cos(a) * 0.075 + cos(c) * 0.048 + cos(d) * 0.061;
  float dz = cos(b) * 0.066 + cos(c) * 0.048 - cos(d) * 0.043;

  return vec2(dx, dz);
}
`;

  const TERRAIN_VERT = COMMON + `
in vec2 aUV;
in vec2 aOrigin;
uniform float uTileSize;
uniform mat4 uProj;
uniform mat4 uView;

out vec3 vWorld;
out vec3 vNormal;
out float vBiome;

void main() {
  vec2 xz = aOrigin + aUV * uTileSize;

  float h, biome, mountain;
  heightInfo(xz, h, biome, mountain);

  vWorld = vec3(xz.x, h, xz.y);
  vBiome = biome;

  float e = 16.0;
  float hs0 = heightSimple(xz);
  float hsx = heightSimple(xz + vec2(e, 0.0));
  float hsz = heightSimple(xz + vec2(0.0, e));

  vec3 n = vec3(hs0 - hsx, e, hs0 - hsz);
  float nl = length(n);
  vNormal = nl > 1e-5 ? n / nl : vec3(0.0, 1.0, 0.0);

  gl_Position = uProj * uView * vec4(vWorld, 1.0);
}
`;

  const TERRAIN_FRAG = COMMON + `
in vec3 vWorld;
in vec3 vNormal;
in float vBiome;

uniform vec3 uCameraPos;
uniform float uFogStart;
uniform float uFogEnd;

out vec4 fragColor;

void main() {
  vec3 microN = cross(dFdx(vWorld), dFdy(vWorld));
  float ml = length(microN);
  if (ml > 1e-6) {
    microN /= ml;
    if (microN.y < 0.0) microN = -microN;
  } else {
    microN = vNormal;
  }

  vec3 n = normalize(mix(vNormal, microN, 0.35));
  if (n.y < 0.0) n = -n;

  float h = vWorld.y;
  float dist = length(vWorld - uCameraPos);
  dist = max(dist, 0.001);
  vec3 viewDir = normalize(vWorld - uCameraPos);

  float slope = clamp(1.0 - n.y, 0.0, 1.0);

  vec3 sand = mix(vec3(0.72, 0.65, 0.46), vec3(0.86, 0.78, 0.55), vBiome);
  vec3 grass = mix(vec3(0.17, 0.29, 0.12), vec3(0.34, 0.44, 0.17), vBiome);
  vec3 rock = mix(vec3(0.28, 0.27, 0.25), vec3(0.47, 0.44, 0.39), vBiome);
  vec3 snow = vec3(0.93, 0.96, 1.0);

  vec3 col;
  if (h < -0.6) {
    float under = smoothstep(-55.0, -6.0, h);
    col = mix(vec3(0.020, 0.045, 0.060), vec3(0.46, 0.41, 0.26), under);
  } else {
    float beach = 1.0 - smoothstep(0.0, 13.0, h);
    float rockMask = smoothstep(0.21, 0.50, slope);
    float snowMask = smoothstep(258.0, 332.0, h) * (1.0 - smoothstep(0.22, 0.52, slope));
    float grassMask = 1.0 - max(rockMask, beach);

    col = grass;
    col = mix(col, rock, rockMask);
    col = mix(col, sand, beach * (1.0 - rockMask));
    col = mix(col, snow, snowMask);
    col *= 0.93 + 0.14 * grassMask;
  }

  float ndl = max(dot(n, uSunDir), 0.0);
  float moonNdl = max(dot(n, uMoonDir), 0.0);
  vec3 sky = skyFogColor(viewDir);

  vec3 ambient = uAmbient + sky * 0.18;
  vec3 light = uSunColor * (ndl * 0.92 + 0.08) + uMoonColor * moonNdl + ambient;

  col *= light;

  float fog = smoothstep(uFogStart, uFogEnd, dist);
  col = mix(col, sky, fog);

  fragColor = vec4(col, 1.0);
}
`;

  const FS_VERT = `#version 300 es
precision highp float;
in vec2 aPos;
out vec2 vNdc;
void main() {
  vNdc = aPos.xy;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

  const SKY_FRAG = COMMON + `
in vec2 vNdc;
uniform vec3 uForward;
uniform vec3 uRight;
uniform vec3 uUp;
uniform float uTanX;
uniform float uTanY;

out vec4 fragColor;

void main() {
  vec3 dir = normalize(uForward + uRight * (vNdc.x * uTanX) + uUp * (vNdc.y * uTanY));
  fragColor = vec4(skyColor(dir), 1.0);
}
`;

  const WATER_FRAG = COMMON + `
in vec2 vNdc;

uniform vec3 uCamPos;
uniform vec3 uForward;
uniform vec3 uRight;
uniform vec3 uUp;
uniform float uTanX;
uniform float uTanY;
uniform float uNear;
uniform float uFar;
uniform float uViewDistance;
uniform float uFogStart;
uniform float uFogEnd;

out vec4 fragColor;

void main() {
  vec3 dir = normalize(uForward + uRight * (vNdc.x * uTanX) + uUp * (vNdc.y * uTanY));

  if (uCamPos.y <= 0.01 || dir.y >= -0.00045) {
    discard;
  }

  float tW = -uCamPos.y / dir.y;
  if (tW < uNear * 0.22 || tW > uViewDistance * 1.30) {
    discard;
  }

  vec2 xz = uCamPos.xz + dir.xz * tW;
  float wh = heightSimple(xz);
  float depth = max(0.0, -wh);

  vec2 grad = waterWaves(xz, uTimeAnim);
  vec3 wn = normalize(vec3(-grad.x * 0.13, 1.0, -grad.y * 0.13));

  vec3 viewDir = dir;
  float fres = pow(1.0 - max(dot(-viewDir, wn), 0.0), 5.0);
  vec3 reflDir = reflect(viewDir, wn);

  vec3 reflSky = skyColor(reflDir);
  vec3 fogSky = skyFogColor(viewDir);

  vec3 deep = vec3(0.013, 0.068, 0.150);
  vec3 shallow = vec3(0.15, 0.37, 0.40);
  vec3 waterCol = mix(shallow, deep, smoothstep(0.0, 45.0, depth));

  float depthAlpha = 1.0 - exp(-depth * 0.11);
  float alpha = clamp(depthAlpha + fres * 0.18 * (1.0 - depthAlpha) + 0.025, 0.0, 0.985);

  waterCol = mix(waterCol, reflSky, 0.24 + 0.68 * fres);

  float sunSpec = pow(max(dot(reflDir, uSunDir), 0.0), 220.0) * max(uSunDir.y, 0.0);
  waterCol += uSunColor * sunSpec * 3.2;

  float fog = smoothstep(uFogStart, uFogEnd, tW);
  waterCol = mix(waterCol, fogSky, fog);

  float depthOut = (uFar * (tW - uNear)) / (tW * (uFar - uNear));
  gl_FragDepth = clamp(depthOut, 0.0, 1.0);

  fragColor = vec4(waterCol, alpha);
}
`;

  /* =========================================================
     GL helpers and resources
     ========================================================= */
  const viewMat = new Float32Array(16);
  const projMat = new Float32Array(16);

  let terrainProgram = null;
  let skyProgram = null;
  let waterProgram = null;

  let terrainU = null;
  let skyU = null;
  let waterU = null;

  let instanceBuffer = null;
  let instanceData = new Float32Array((2 * 6 + 1) * (2 * 6 + 1) * 2);
  let instanceCount = 0;

  let fsBuffer = null;
  const geos = {};

  function compileShader(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh) || "Shader compile failed";
      gl.deleteShader(sh);
      throw new Error(log);
    }
    return sh;
  }

  function linkProgram(vsSrc, fsSrc) {
    const vs = compileShader(gl.VERTEX_SHADER, vsSrc);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSrc);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog) || "Program link failed";
      throw new Error(log);
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return prog;
  }

  function getUniforms(prog, names) {
    const u = {};
    const parts = names.split(" ");
    for (let i = 0; i < parts.length; i++) {
      u[parts[i]] = gl.getUniformLocation(prog, parts[i]);
    }
    return u;
  }

  function u1(loc, v) {
    if (loc !== null) gl.uniform1f(loc, v);
  }
  function u2(loc, x, y) {
    if (loc !== null) gl.uniform2f(loc, x, y);
  }
  function u3f(loc, x, y, z) {
    if (loc !== null) gl.uniform3f(loc, x, y, z);
  }
  function u3v(loc, v) {
    if (loc !== null) gl.uniform3f(loc, v[0], v[1], v[2]);
  }
  function uMat(loc, m) {
    if (loc !== null) gl.uniformMatrix4fv(loc, false, m);
  }
  function uUint(loc, v) {
    if (loc !== null) gl.uniform1ui(loc, v >>> 0);
  }

  function setCommon(u) {
    uUint(u.uSeed, seedU);
    u3v(u.uSunDir, state.sunDir);
    u3v(u.uSunColor, state.sunColor);
    u3v(u.uMoonDir, state.moonDir);
    u3v(u.uMoonColor, state.moonColor);
    u3v(u.uAmbient, state.ambient);
    u1(u.uTimeAnim, state.animTime);
  }

  function createFullscreenBuffer() {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         3, -1,
        -1,  3
      ]),
      gl.STATIC_DRAW
    );
    return buf;
  }

  function createGeo(n) {
    const vertCount = (n + 1) * (n + 1);
    const uv = new Float32Array(vertCount * 2);
    let p = 0;
    for (let j = 0; j <= n; j++) {
      for (let i = 0; i <= n; i++) {
        uv[p++] = i / n;
        uv[p++] = j / n;
      }
    }

    const idx = new Uint16Array(n * n * 6);
    let q = 0;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const a = j * (n + 1) + i;
        const b = a + 1;
        const c = a + (n + 1);
        const d = c + 1;
        idx[q++] = a;
        idx[q++] = b;
        idx[q++] = d;
        idx[q++] = a;
        idx[q++] = d;
        idx[q++] = c;
      }
    }

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);

    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    const locUV = gl.getAttribLocation(terrainProgram, "aUV");
    gl.enableVertexAttribArray(locUV);
    gl.vertexAttribPointer(locUV, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    const locOrigin = gl.getAttribLocation(terrainProgram, "aOrigin");
    gl.enableVertexAttribArray(locOrigin);
    gl.vertexAttribPointer(locOrigin, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(locOrigin, 1);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);

    gl.bindVertexArray(null);

    return {
      n: n,
      vao: vao,
      indexCount: idx.length,
      vertexCount: vertCount
    };
  }

  function getGeo(n) {
    if (!geos[n]) geos[n] = createGeo(n);
    return geos[n];
  }

  function updateInstances() {
    const tile = state.tile;
    const r = state.radius;
    const ci = Math.round(state.cam.x / tile);
    const cj = Math.round(state.cam.z / tile);

    let p = 0;
    for (let iz = -r; iz <= r; iz++) {
      for (let ix = -r; ix <= r; ix++) {
        instanceData[p++] = (ci + ix) * tile;
        instanceData[p++] = (cj + iz) * tile;
      }
    }

    instanceCount = (2 * r + 1) * (2 * r + 1);
    state.chunks = instanceCount;
    state.triangles = instanceCount * state.currentN * state.currentN * 2;

    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    gl.bufferSubData(0, instanceData.subarray(0, instanceCount * 2));

    state.viewDistance = (r + 1) * tile;
  }

  function applyQuality() {
    const q = QUALITIES[state.qualityIndex];
    state.currentN = q.n;
    state.radius = q.r;
    updateInstances();
    getGeo(state.currentN);
  }

  function initGL() {
    try {
      terrainProgram = linkProgram(TERRAIN_VERT, TERRAIN_FRAG);
      skyProgram = linkProgram(FS_VERT, SKY_FRAG);
      waterProgram = linkProgram(FS_VERT, WATER_FRAG);

      terrainU = getUniforms(
        terrainProgram,
        "uSeed uSunDir uSunColor uMoonDir uMoonColor uAmbient uTimeAnim " +
        "uProj uView uTileSize uCameraPos uFogStart uFogEnd"
      );
      skyU = getUniforms(
        skyProgram,
        "uSeed uSunDir uSunColor uMoonDir uMoonColor uAmbient uTimeAnim " +
        "uForward uRight uUp uTanX uTanY"
      );
      waterU = getUniforms(
        waterProgram,
        "uSeed uSunDir uSunColor uMoonDir uMoonColor uAmbient uTimeAnim " +
        "uCamPos uForward uRight uUp uTanX uTanY uNear uFar uViewDistance uFogStart uFogEnd"
      );

      instanceBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, instanceData, gl.DYNAMIC_DRAW);

      fsBuffer = createFullscreenBuffer();

      resize();
      setSeed(state.seed);
      updateLighting();
      applyQuality();

      gl.clearColor(0, 0, 0, 1);
      gl.disable(gl.CULL_FACE);

      return true;
    } catch (e) {
      showError("WebGL initialization failed: " + (e && e.message ? e.message : String(e)));
      return false;
    }
  }

  /* =========================================================
     Resize / render loop
     ========================================================= */
  function resize() {
    const maxDPR = 1.0; // cap for performance
    const dpr = Math.min(window.devicePixelRatio || 1, maxDPR);
    const w = Math.max(1, Math.floor(window.innerWidth * dpr));
    const h = Math.max(1, Math.floor(window.innerHeight * dpr));

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      if (gl) gl.viewport(0, 0, w, h);
    }

    state.aspect = canvas.width / canvas.height;
    state.tanY = Math.tan(state.fov * 0.5);
    state.tanX = state.tanY * state.aspect;
    fillProjection(projMat);
  }

  window.addEventListener("resize", resize);

  let lastFrame = performance.now();
  let fpsFrames = 0;
  let fpsLast = performance.now();
  let qualityCooldown = 0;

  function render() {
    if (!gl || !ready) return;

    updateInstances();

    const b = cameraBasis();
    fillView(viewMat, state.cam, b);

    const fogStart = state.viewDistance * 0.42;
    const fogEnd = state.viewDistance * 0.92;

    // Clear.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Sky: background, no depth.
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.disable(gl.BLEND);

    gl.useProgram(skyProgram);
    setCommon(skyU);
    u3f(skyU.uForward, b.f[0], b.f[1], b.f[2]);
    u3f(skyU.uRight, b.r[0], b.r[1], b.r[2]);
    u3f(skyU.uUp, b.u[0], b.u[1], b.u[2]);
    u1(skyU.uTanX, state.tanX);
    u1(skyU.uTanY, state.tanY);

    gl.bindBuffer(gl.ARRAY_BUFFER, fsBuffer);
    const skyPosLoc = gl.getAttribLocation(skyProgram, "aPos");
    gl.enableVertexAttribArray(skyPosLoc);
    gl.vertexAttribPointer(skyPosLoc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Terrain: opaque.
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.BLEND);

    gl.useProgram(terrainProgram);
    setCommon(terrainU);
    uMat(terrainU.uProj, projMat);
    uMat(terrainU.uView, viewMat);
    u1(terrainU.uTileSize, state.tile);
    u3f(terrainU.uCameraPos, state.cam.x, state.cam.y, state.cam.z);
    u1(terrainU.uFogStart, fogStart);
    u1(terrainU.uFogEnd, fogEnd);

    const geo = getGeo(state.currentN);
    gl.bindVertexArray(geo.vao);
    gl.drawElementsInstanced(
      gl.TRIANGLES,
      geo.indexCount,
      gl.UNSIGNED_SHORT,
      0,
      instanceCount
    );
    gl.bindVertexArray(null);

    // Water: transparent fullscreen ray/plane pass, writes color, tests against terrain depth.
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(waterProgram);
    setCommon(waterU);
    u3f(waterU.uCamPos, state.cam.x, state.cam.y, state.cam.z);
    u3f(waterU.uForward, b.f[0], b.f[1], b.f[2]);
    u3f(waterU.uRight, b.r[0], b.r[1], b.r[2]);
    u3f(waterU.uUp, b.u[0], b.u[1], b.u[2]);
    u1(waterU.uTanX, state.tanX);
    u1(waterU.uTanY, state.tanY);
    u1(waterU.uNear, state.near);
    u1(waterU.uFar, state.far);
    u1(waterU.uViewDistance, state.viewDistance);
    u1(waterU.uFogStart, fogStart);
    u1(waterU.uFogEnd, fogEnd);

    gl.bindBuffer(gl.ARRAY_BUFFER, fsBuffer);
    const waterPosLoc = gl.getAttribLocation(waterProgram, "aPos");
    gl.enableVertexAttribArray(waterPosLoc);
    gl.vertexAttribPointer(waterPosLoc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  function loop(now) {
    requestAnimationFrame(loop);

    let dt = (now - lastFrame) / 1000;
    lastFrame = now;
    if (!Number.isFinite(dt) || dt < 0) dt = 0;
    dt = Math.min(dt, 0.1);

    updateCamera(dt);

    if (ready) {
      render();
    }

    fpsFrames++;
    if (now - fpsLast >= 500) {
      const fps = fpsFrames * 1000 / (now - fpsLast);
      fpsEl.textContent = Math.max(0, Math.round(fps)) + " FPS";
      fpsFrames = 0;
      fpsLast = now;

      if (ready && now > qualityCooldown) {
        if (fps < 36 && state.qualityIndex < QUALITIES.length - 1) {
          state.qualityIndex++;
          applyQuality();
          qualityCooldown = now + 1200;
        }
      }
    }
  }

  /* =========================================================
     Start
     ========================================================= */
  updateLighting();
  setSeed(42);
  setTime(9.5);
  formatTimeLabel();
  setAutopilotUI();

  const initialH = terrainHeight(state.cam.x, state.cam.z);
  state.cam.y = Math.max(initialH + 55, 70);

  requestAnimationFrame(loop);
})();
</script>
</body>
</html>
```