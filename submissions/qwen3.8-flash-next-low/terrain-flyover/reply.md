```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Horizon</title>
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    color: #e8ecf2;
  }
  #canvas {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    outline: none;
    touch-action: none;
  }
  #ui {
    position: fixed;
    left: 12px;
    bottom: 12px;
    z-index: 20;
    padding: 10px 12px;
    border-radius: 12px;
    background: rgba(6, 10, 16, 0.44);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 8px 26px rgba(0, 0, 0, 0.28);
    backdrop-filter: blur(8px);
    font-size: 12px;
    line-height: 1.45;
    max-width: 270px;
    user-select: none;
  }
  #ui .row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 5px 0;
  }
  #ui label {
    min-width: 40px;
    opacity: 0.88;
  }
  #ui input {
    font: inherit;
  }
  #time {
    width: 150px;
    accent-color: #8fd3ff;
  }
  #seed {
    width: 88px;
    padding: 3px 5px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.06);
    color: #fff;
  }
  #status {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 8px;
    opacity: 0.86;
    font-variant-numeric: tabular-nums;
  }
  #help {
    margin-top: 8px;
    font-size: 11px;
    opacity: 0.72;
  }
</style>
</head>
<body>
<canvas id="canvas"></canvas>
<div id="ui">
  <div class="row"><label for="time">time</label><input id="time" type="range" min="0" max="24" step="0.01" value="10"></div>
  <div class="row"><label for="seed">seed</label><input id="seed" type="number" step="1" value="1337"></div>
  <div id="status"><span id="autopilot">AUTO: on</span><span id="fps">fps: --</span></div>
  <div id="help">W/A/S/D fly · Q/E up/down · mouse drag · F autopilot</div>
</div>

<script>
(function () {
  "use strict";

  const canvas = document.getElementById("canvas");
  const ui = document.getElementById("ui");
  const timeInput = document.getElementById("time");
  const seedInput = document.getElementById("seed");
  const autoLabel = document.getElementById("autopilot");
  const fpsLabel = document.getElementById("fps");

  let gl = null;
  try {
    gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      depth: true,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance"
    });
  } catch (e) {
    gl = null;
  }

  if (!gl) {
    window.__arena = {
      freeze: function () {},
      setSeed: function () {},
      setTime: function () {},
      setCamera: function () {},
      getCamera: function () { return { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 }; },
      terrainHeight: function () { return 0; },
      stats: function () { return { chunks: 0, triangles: 0 }; }
    };
    return;
  }

  // ------------------------------------------------------------------
  // Constants and camera
  // ------------------------------------------------------------------
  const PI = Math.PI;
  const TWO_PI = Math.PI * 2;

  const VIEW_DISTANCE = 1500;
  const COVER_RADIUS = 1600;
  const TERRAIN_STEP = 16;
  const PATCH_SIZE = 2048;
  const GRID = PATCH_SIZE / TERRAIN_STEP + 1;           // 129
  const GRID_EXT = GRID + 2;
  const TERRAIN_INDEX_COUNT = (GRID - 1) * (GRID - 1) * 6;

  const WATER_STEP = 128;
  const WATER_GRID = PATCH_SIZE / WATER_STEP + 1;       // 17
  const WATER_INDEX_COUNT = (WATER_GRID - 1) * (WATER_GRID - 1) * 6;

  const FOV = 60.0 * PI / 180.0;
  const NEAR = 1.0;
  const FAR = 3000.0;

  const CAM_MARGIN = 2.0;
  const AUTO_SPEED = 30.0;
  const MANUAL_SPEED = 62.0;
  const DAY_SECONDS = 120.0;
  const WAVE_CYCLES_PER_DAY = 80;
  const WAVE_FACTOR = TWO_PI * WAVE_CYCLES_PER_DAY / 24.0;

  let seed = (1337 >>> 0);
  let time = 10.0;
  let frozen = false;
  let autopilot = true;
  let lastFrameChunks = 0;
  let lastFrameTriangles = 0;

  const camera = { x: 0, y: 50, z: 0, yaw: 0.0, pitch: -0.12 };
  const velocity = [0, 0, 0];
  const keys = new Set();

  let dragging = false;
  let dragX = 0;
  let dragY = 0;

  // ------------------------------------------------------------------
  // Small math helpers
  // ------------------------------------------------------------------
  function clamp(v, a, b) {
    return v < a ? a : (v > b ? b : v);
  }

  function dot3(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function cross3(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  function norm3(v) {
    const l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (l > 1e-7) {
      v[0] /= l;
      v[1] /= l;
      v[2] /= l;
    } else {
      v[0] = 0;
      v[1] = 1;
      v[2] = 0;
    }
    return v;
  }

  function limitVec(v, maxLen) {
    const l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (l > maxLen && l > 1e-8) {
      const k = maxLen / l;
      v[0] *= k;
      v[1] *= k;
      v[2] *= k;
    }
  }

  function smooth01(x) {
    x = clamp(x, 0, 1);
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
  }

  function sstep(x, e0, e1) {
    if (e1 === e0) return x >= e0 ? 1 : 0;
    return smooth01((x - e0) / (e1 - e0));
  }

  function mix3(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  function clampColor(c, maxV) {
    return [clamp(c[0], 0, maxV), clamp(c[1], 0, maxV), clamp(c[2], 0, maxV)];
  }

  function getBasis(yaw, pitch) {
    pitch = clamp(pitch, -1.35, 1.35);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const forward = [-Math.sin(yaw) * cp, sp, -Math.cos(yaw) * cp];
    norm3(forward);
    let right = cross3(forward, [0, 1, 0]);
    if (Math.sqrt(right[0]*right[0]+right[1]*right[1]+right[2]*right[2]) < 1e-5) {
      right = cross3([1, 0, 0], forward);
    }
    norm3(right);
    const up = cross3(right, forward);
    norm3(up);
    return { f: forward, r: right, u: up };
  }

  function perspective(fovy, aspect, near, far) {
    const f = 1.0 / Math.tan(fovy * 0.5);
    const nf = near - far;
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) / nf, -1,
      0, 0, (2.0 * far * near) / nf, 0
    ]);
  }

  function viewMatrix(b, pos) {
    const f = b.f, r = b.r, u = b.u;
    return new Float32Array([
      r[0], u[0], -f[0], 0,
      r[1], u[1], -f[1], 0,
      r[2], u[2], -f[2], 0,
      -dot3(r, [pos.x, pos.y, pos.z]),
      -dot3(u, [pos.x, pos.y, pos.z]),
      dot3(f, [pos.x, pos.y, pos.z]),
      1
    ]);
  }

  function mat4mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        o[c * 4 + r] =
          a[0 * 4 + r] * b[c * 4 + 0] +
          a[1 * 4 + r] * b[c * 4 + 1] +
          a[2 * 4 + r] * b[c * 4 + 2] +
          a[3 * 4 + r] * b[c * 4 + 3];
      }
    }
    return o;
  }

  // ------------------------------------------------------------------
  // Deterministic procedural height function
  // ------------------------------------------------------------------
  function hash2(ix, iy) {
    let h = (seed ^ Math.imul(ix >>> 0, 0x27d4eb2d) ^ Math.imul(iy >>> 0, 0x165667b1)) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x27d4eb2d) >>> 0;
    return (h & 0x7fffffff) / 2147483647.0;
  }

  function valueNoise(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const u = smooth01(fx);
    const v = smooth01(fy);

    const a = hash2(ix, iy);
    const b = hash2(ix + 1, iy);
    const c = hash2(ix, iy + 1);
    const d = hash2(ix + 1, iy + 1);

    const ab = a + (b - a) * u;
    const cd = c + (d - c) * u;
    return ab + (cd - ab) * v;
  }

  function fbm(x, y, octaves) {
    let amp = 0.5;
    let freq = 1.0;
    let sum = 0.0;
    let norm = 0.0;
    for (let i = 0; i < octaves; i++) {
      sum += valueNoise(x * freq, y * freq) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2.03;
    }
    return sum / norm;
  }

  function ridgedFbm(x, y, octaves) {
    let amp = 0.5;
    let freq = 1.0;
    let sum = 0.0;
    let norm = 0.0;
    for (let i = 0; i < octaves; i++) {
      const n = valueNoise(x * freq, y * freq) * 2.0 - 1.0;
      let r = 1.0 - Math.abs(n);
      r *= r;
      sum += r * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2.07;
    }
    return sum / norm;
  }

  function terrainHeight(x, z) {
    if (!isFinite(x) || !isFinite(z)) return 0;

    const wx = (valueNoise(x * 0.00015, z * 0.00015) - 0.5) * 430.0;
    const wz = (valueNoise(x * 0.00015 + 91.37, z * 0.00015 - 137.71) - 0.5) * 430.0;
    const xw = x + wx;
    const zw = z + wz;

    const continent = fbm(xw * 0.00011, zw * 0.00011, 3);
    const land = sstep(continent, 0.41, 0.59);

    const sea = -50.0 + fbm(xw * 0.00077, zw * 0.00077, 2) * 7.0;

    const hills = fbm(xw * 0.00042, zw * 0.00042, 3);
    const ridge = ridgedFbm(xw * 0.00115, zw * 0.00115, 3);
    const mountainMask = sstep(fbm(xw * 0.00019, zw * 0.00019, 2), 0.43, 0.72);

    const baseLand = -12.0 + hills * 115.0;
    const mountains = ridge * 395.0 * mountainMask;
    let h = sea * (1.0 - land) + land * (baseLand * (1.0 - mountainMask * 0.35) + mountains);

    if (h < -50.0) h = -50.0;
    if (h > 400.0) h = 400.0;
    return h;
  }

  function clampCameraYOnly() {
    const minH = Math.max(terrainHeight(camera.x, camera.z) + CAM_MARGIN, CAM_MARGIN);
    if (camera.y < minH) camera.y = minH;
    if (camera.y > 800.0) camera.y = 800.0;
  }

  function clampCameraAfterMove() {
    const minH = Math.max(terrainHeight(camera.x, camera.z) + CAM_MARGIN, CAM_MARGIN);
    if (camera.y < minH) {
      camera.y = minH;
      if (velocity[1] < 0) velocity[1] = 0;
    }
  }

  function chooseStart() {
    let bestScore = Infinity;
    let bestX = 0, bestZ = 0, bestH = 0;

    for (let dx = -240; dx <= 240; dx += 40) {
      for (let dz = -240; dz <= 240; dz += 40) {
        const h = terrainHeight(dx, dz);
        if (!isFinite(h)) continue;
        if (h > 8 && h < 110) {
          const dist = Math.sqrt(dx * dx + dz * dz);
          const score = Math.abs(h - 45.0) + dist * 0.004;
          if (score < bestScore) {
            bestScore = score;
            bestX = dx;
            bestZ = dz;
            bestH = h;
          }
        }
      }
    }

    if (bestScore < Infinity) {
      camera.x = bestX;
      camera.z = bestZ;
      camera.y = Math.max(bestH + 34.0, 24.0);
    } else {
      const h = terrainHeight(0, 0);
      camera.x = 0;
      camera.z = 0;
      camera.y = Math.max(h + 34.0, 24.0);
    }
  }

  // ------------------------------------------------------------------
  // Day / night model
  // ------------------------------------------------------------------
  const DAY_HORIZON = [0.70, 0.81, 0.95];
  const DAY_ZENITH = [0.08, 0.26, 0.61];
  const NIGHT_HORIZON = [0.012, 0.022, 0.046];
  const NIGHT_ZENITH = [0.003, 0.005, 0.013];
  const SUNSET_HORIZON = [1.00, 0.41, 0.13];
  const SUNSET_ZENITH = [0.27, 0.13, 0.30];

  function computeLighting() {
    const angle = ((time - 6.0) / 24.0) * TWO_PI;
    const elev = Math.sin(angle);
    const sunDir = [Math.cos(angle), elev, 0.0];
    norm3(sunDir);

    const moonDir = [-sunDir[0], -sunDir[1], -sunDir[2]];
    norm3(moonDir);

    const day = sstep(elev, -0.18, 0.23);
    const sunset = clamp(Math.exp(-Math.abs(elev) * 4.2) * day, 0, 1);
    const night = 1.0 - day;

    const warm = [1.0, 0.54, 0.17];
    const white = [1.0, 0.94, 0.87];
    const moon = [0.30, 0.42, 0.72];

    const sunColor = clampColor(mix3(white, warm, sunset), 1.25);
    const moonColor = clampColor(moon, 1.2);

    let ambient = mix3([0.015, 0.025, 0.055], [0.10, 0.15, 0.26], day);
    ambient[0] += sunset * 0.045;
    ambient[1] += sunset * 0.027;
    ambient[2] += sunset * 0.014;
    ambient = clampColor(ambient, 0.34);

    const nightLight = [moon[0] * 0.17, moon[1] * 0.22, moon[2] * 0.30];
    const dayScale = 0.18 + day * 1.05 + sunset * 0.45;
    const dayLight = [sunColor[0] * dayScale, sunColor[1] * dayScale, sunColor[2] * dayScale];
    const lightColor = clampColor(mix3(nightLight, dayLight, day), 1.45);

    return {
      sunDir,
      moonDir,
      sunColor,
      moonColor,
      lightColor,
      ambient,
      day,
      night,
      sunset
    };
  }

  // ------------------------------------------------------------------
  // GLSL
  // ------------------------------------------------------------------
  const SHARED_SKY_BASE = `
vec3 skyBase(vec3 dir) {
  dir = normalize(dir);
  float grad = smoothstep(-0.03, 0.65, dir.y);

  vec3 horizon = mix(uNightHorizon, uDayHorizon, uDay);
  horizon = mix(horizon, uSunsetHorizon, uSunset);

  vec3 zenith = mix(uNightZenith, uDayZenith, uDay);
  zenith = mix(zenith, uSunsetZenith, uSunset * 0.45);

  return mix(horizon, zenith, grad);
}
`;

  const SKY_VS = `#version 300 es
precision highp float;
in vec2 aQuad;
out vec3 vDir;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uForward;
uniform float uTanHalfFov;
uniform float uAspect;

void main() {
  gl_Position = vec4(aQuad, 0.0, 1.0);
  vec3 local = vec3(aQuad.x * uTanHalfFov * uAspect, aQuad.y * uTanHalfFov, 1.0);
  vDir = normalize(uRight * local.x + uUp * local.y + uForward * local.z);
}
`;

  const SKY_FS = `#version 300 es
precision highp float;
in vec3 vDir;
out vec4 fragColor;

uniform vec3 uSunDir;
uniform vec3 uMoonDir;
uniform vec3 uSunColor;
uniform vec3 uMoonColor;
uniform float uDay;
uniform float uNight;
uniform float uSunset;

uniform vec3 uDayHorizon;
uniform vec3 uDayZenith;
uniform vec3 uNightHorizon;
uniform vec3 uNightZenith;
uniform vec3 uSunsetHorizon;
uniform vec3 uSunsetZenith;

${SHARED_SKY_BASE}

float hash3(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1137, 0.2071));
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

void main() {
  vec3 dir = normalize(vDir);
  vec3 col = skyBase(dir);

  float night = clamp(uNight, 0.0, 1.0);

  float sd = dot(dir, uSunDir);
  float sunVis = uDay * clamp(uSunDir.y * 4.0 + 0.55, 0.0, 1.0);
  float sunDisk = smoothstep(0.999955, 0.999998, sd);
  float sunGlow = pow(max(sd, 0.0), 90.0);
  col += uSunColor * (sunDisk * 1.35 + sunGlow * 0.18) * sunVis;

  float md = dot(dir, uMoonDir);
  float moonVis = night * clamp(uMoonDir.y * 4.0 + 0.35, 0.0, 1.0);
  float moonDisk = smoothstep(0.999965, 0.999999, md);
  float moonGlow = pow(max(md, 0.0), 45.0);
  col += uMoonColor * (moonDisk * 0.85 + moonGlow * 0.035) * moonVis;

  if (night > 0.04 && dir.y > -0.03) {
    vec3 q = floor(dir * 760.0);
    float h = hash3(q);
    float star = step(0.99984, h) * smoothstep(-0.06, 0.38, dir.y);
    col += vec3(0.72, 0.80, 1.0) * star * night * 1.25;
  }

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

  const TERRAIN_VS = `#version 300 es
precision highp float;
in vec3 aPos;
in vec3 aNormal;
out vec3 vWorldPos;
out vec3 vNormal;
uniform mat4 uViewProj;

void main() {
  vWorldPos = aPos;
  vNormal = aNormal;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}
`;

  const TERRAIN_FS = `#version 300 es
precision highp float;
in vec3 vWorldPos;
in vec3 vNormal;
out vec4 fragColor;

uniform vec3 uCameraPos;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform vec3 uAmbient;

uniform vec3 uDayHorizon;
uniform vec3 uDayZenith;
uniform vec3 uNightHorizon;
uniform vec3 uNightZenith;
uniform vec3 uSunsetHorizon;
uniform vec3 uSunsetZenith;
uniform float uDay;
uniform float uSunset;

${SHARED_SKY_BASE}

void main() {
  if (vWorldPos.y < -0.1) discard;

  vec3 D = vWorldPos - uCameraPos;
  float dist = length(D);
  if (dist > 2048.0) discard;
  D /= dist;

  float edgeFade = 1.0 - smoothstep(1850.0, 2048.0, dist);
  if (edgeFade < 0.004) discard;

  vec3 N = normalize(vNormal);
  vec3 V = -D;

  float h = vWorldPos.y;
  float flat = clamp(N.y, 0.0, 1.0);

  vec3 sand = vec3(0.63, 0.54, 0.31);
  vec3 grass = vec3(0.16, 0.29, 0.11);
  vec3 grassDark = vec3(0.08, 0.16, 0.06);
  vec3 rock = vec3(0.24, 0.22, 0.21);
  vec3 rockDark = vec3(0.13, 0.12, 0.12);
  vec3 snow = vec3(0.93, 0.96, 1.00);
  vec3 shoreWater = vec3(0.07, 0.21, 0.27);

  vec3 albedo = mix(sand, grass, smoothstep(0.5, 3.0, h));
  albedo = mix(albedo, grassDark, smoothstep(125.0, 300.0, h));

  float steep = 1.0 - smoothstep(0.55, 0.85, flat);
  float heightRock = 0.35 + 0.65 * smoothstep(0.0, 85.0, h);
  albedo = mix(albedo, rock, steep * heightRock * 0.82);
  albedo = mix(albedo, rockDark, steep * heightRock * 0.30 * smoothstep(150.0, 310.0, h));

  float snowMix = smoothstep(205.0, 345.0, h) * smoothstep(0.62, 0.88, flat);
  albedo = mix(albedo, snow, snowMix);

  float shore = 1.0 - smoothstep(-0.2, 2.6, h);
  albedo = mix(albedo, shoreWater, shore * 0.55);

  float ndl = max(dot(N, uLightDir), 0.0);
  vec3 lit = albedo * (uAmbient + uLightColor * ndl);

  vec3 H = normalize(V + uLightDir);
  float ndh = max(dot(N, H), 0.0);
  float spec = pow(ndh, 34.0) * 0.045 * length(uLightColor);
  lit += uLightColor * spec;

  float fog = 1.0 - exp(-dist * 0.00035);
  vec3 col = lit;

  float mixAmt = max(fog, 1.0 - edgeFade);
  if (mixAmt > 0.01) {
    vec3 sky = skyBase(D);
    col = mix(col, sky, clamp(mixAmt, 0.0, 1.0));
  }

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

  const WATER_VS = `#version 300 es
precision highp float;
in vec2 aWaterPos;
out vec3 vWorldPos;
uniform mat4 uViewProj;
uniform vec3 uWaterOffset;

void main() {
  vWorldPos = vec3(aWaterPos + uWaterOffset.xy, 0.0);
  gl_Position = uViewProj * vec4(vWorldPos, 1.0);
}
`;

  const WATER_FS = `#version 300 es
precision highp float;
in vec3 vWorldPos;
out vec4 fragColor;

uniform vec3 uCameraPos;
uniform float uWavePhase;

uniform vec3 uSunDir;
uniform vec3 uMoonDir;
uniform vec3 uSunColor;
uniform vec3 uMoonColor;
uniform vec3 uAmbient;

uniform float uDay;
uniform float uNight;
uniform float uSunset;

uniform vec3 uDayHorizon;
uniform vec3 uDayZenith;
uniform vec3 uNightHorizon;
uniform vec3 uNightZenith;
uniform vec3 uSunsetHorizon;
uniform vec3 uSunsetZenith;

${SHARED_SKY_BASE}

void main() {
  vec3 P = vWorldPos;
  vec3 D = P - uCameraPos;
  float dist = length(D);
  if (dist > 2048.0) discard;
  D /= dist;

  float edgeFade = 1.0 - smoothstep(1850.0, 2048.0, dist);
  if (edgeFade < 0.004) discard;

  vec2 p = P.xz;
  float ph = uWavePhase;

  float a1 = p.x * 0.034 + p.z * 0.021 + ph * 1.00;
  float a2 = p.x * -0.021 + p.z * 0.039 + ph * 1.37;
  float a3 = p.x * 0.058 - p.z * 0.047 + ph * 2.11;

  float s1 = sin(a1);
  float s2 = sin(a2);
  float s3 = sin(a3);
  float c1 = cos(a1);
  float c2 = cos(a2);
  float c3 = cos(a3);

  float waveH = 0.45 * s1 + 0.24 * s2 + 0.12 * s3;

  float dx = 0.45 * 0.034 * c1 + 0.24 * -0.021 * c2 + 0.12 * 0.058 * c3;
  float dz = 0.45 * 0.021 * c1 + 0.24 * 0.039 * c2 + 0.12 * -0.047 * c3;

  vec3 N = normalize(vec3(-dx, 1.0, -dz));
  vec3 V = -D;

  float ndv = max(dot(N, V), 0.0);
  float fres = pow(1.0 - ndv, 5.0);
  fres = clamp(fres * 1.25, 0.0, 1.0);

  vec3 R = reflect(D, N);
  vec3 refl = skyBase(R);

  float night = clamp(uNight, 0.0, 1.0);
  vec3 body = vec3(0.010, 0.045, 0.105) * (0.18 + 3.4 * uAmbient);
  body += vec3(0.002, 0.004, 0.012) * night;

  vec3 col = mix(body, refl, fres);

  float specSun = pow(max(dot(R, uSunDir), 0.0), 90.0);
  col += uSunColor * specSun * (0.75 * uDay + 0.12 * uSunset);

  float specMoon = pow(max(dot(R, uMoonDir), 0.0), 70.0);
  col += uMoonColor * specMoon * 0.35 * night;

  float fog = 1.0 - exp(-dist * 0.00035);
  float mixAmt = max(fog, 1.0 - edgeFade);
  if (mixAmt > 0.01) {
    vec3 sky = skyBase(D);
    col = mix(col, sky, clamp(mixAmt, 0.0, 1.0));
  }

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

  // ------------------------------------------------------------------
  // WebGL program / buffer helpers
  // ------------------------------------------------------------------
  function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  function makeProgram(vsSrc, fsSrc) {
    const vs = compileShader(gl.VERTEX_SHADER, vsSrc);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSrc);
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    return p;
  }

  function getUniforms(p, names) {
    const out = {};
    for (const n of names) out[n] = gl.getUniformLocation(p, n);
    return out;
  }

  const terrainProgram = makeProgram(TERRAIN_VS, TERRAIN_FS);
  const waterProgram = makeProgram(WATER_VS, WATER_FS);
  const skyProgram = makeProgram(SKY_VS, SKY_FS);

  if (!terrainProgram || !waterProgram || !skyProgram) {
    window.__arena = {
      freeze: function () {},
      setSeed: function () {},
      setTime: function () {},
      setCamera: function () {},
      getCamera: function () { return { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 }; },
      terrainHeight: terrainHeight,
      stats: function () { return { chunks: 0, triangles: 0 }; }
    };
    return;
  }

  const terrainAttribs = {
    pos: gl.getAttribLocation(terrainProgram, "aPos"),
    normal: gl.getAttribLocation(terrainProgram, "aNormal")
  };
  const terrainUniforms = getUniforms(terrainProgram, [
    "uViewProj", "uCameraPos", "uLightDir", "uLightColor", "uAmbient",
    "uDayHorizon", "uDayZenith", "uNightHorizon", "uNightZenith",
    "uSunsetHorizon", "uSunsetZenith", "uDay", "uSunset"
  ]);

  const waterAttribs = {
    pos: gl.getAttribLocation(waterProgram, "aWaterPos")
  };
  const waterUniforms = getUniforms(waterProgram, [
    "uViewProj", "uCameraPos", "uWaterOffset", "uWavePhase",
    "uSunDir", "uMoonDir", "uSunColor", "uMoonColor", "uAmbient",
    "uDay", "uNight", "uSunset",
    "uDayHorizon", "uDayZenith", "uNightHorizon", "uNightZenith",
    "uSunsetHorizon", "uSunsetZenith"
  ]);

  const skyAttribs = {
    quad: gl.getAttribLocation(skyProgram, "aQuad")
  };
  const skyUniforms = getUniforms(skyProgram, [
    "uRight", "uUp", "uForward", "uTanHalfFov", "uAspect",
    "uSunDir", "uMoonDir", "uSunColor", "uMoonColor",
    "uDay", "uNight", "uSunset",
    "uDayHorizon", "uDayZenith", "uNightHorizon", "uNightZenith",
    "uSunsetHorizon", "uSunsetZenith"
  ]);

  function makeIndices(grid) {
    const cells = grid - 1;
    const count = cells * cells * 6;
    const arr = new Uint16Array(count);
    let p = 0;
    for (let z = 0; z < cells; z++) {
      for (let x = 0; x < cells; x++) {
        const i = z * grid + x;
        arr[p++] = i;
        arr[p++] = i + grid;
        arr[p++] = i + grid + 1;
        arr[p++] = i;
        arr[p++] = i + grid + 1;
        arr[p++] = i + 1;
      }
    }
    return arr;
  }

  const terrainIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrainIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, makeIndices(GRID), gl.STATIC_DRAW);

  const waterIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, waterIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, makeIndices(WATER_GRID), gl.STATIC_DRAW);

  const waterVertexBuffer = gl.createBuffer();
  {
    const data = new Float32Array(WATER_GRID * WATER_GRID * 2);
    let p = 0;
    for (let z = 0; z < WATER_GRID; z++) {
      for (let x = 0; x < WATER_GRID; x++) {
        data[p++] = x * WATER_STEP;
        data[p++] = z * WATER_STEP;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, waterVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  }

  const skyVertexBuffer = gl.createBuffer();
  {
    const data = new Float32Array([
      -1, -1,  -1, 1,   1, -1,
      -1, 1,   1, 1,    1, -1
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, skyVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  }

  // ------------------------------------------------------------------
  // Chunk cache and patch generation
  // ------------------------------------------------------------------
  const chunkCache = new Map();
  let activeList = [];

  function deleteChunks() {
    for (const entry of chunkCache.values()) {
      if (entry.buffer) gl.deleteBuffer(entry.buffer);
    }
    chunkCache.clear();
    activeList = [];
    lastFrameChunks = 0;
    lastFrameTriangles = 0;
  }

  function createChunk(ix, iy) {
    const ox = ix * PATCH_SIZE;
    const oz = iy * PATCH_SIZE;

    const hExt = new Float32Array(GRID_EXT * GRID_EXT);
    for (let z = 0; z < GRID_EXT; z++) {
      const zw = oz + (z - 1) * TERRAIN_STEP;
      const base = z * GRID_EXT;
      for (let x = 0; x < GRID_EXT; x++) {
        const xw = ox + (x - 1) * TERRAIN_STEP;
        hExt[base + x] = terrainHeight(xw, zw);
      }
    }

    const vertexCount = GRID * GRID;
    const data = new Float32Array(vertexCount * 6);
    const inv2Step = 1.0 / (2.0 * TERRAIN_STEP);

    for (let j = 0; j < GRID; j++) {
      const z = oz + j * TERRAIN_STEP;
      for (let i = 0; i < GRID; i++) {
        const x = ox + i * TERRAIN_STEP;
        const ext = (j + 1) * GRID_EXT + (i + 1);
        const h = hExt[ext];

        const hx = (hExt[ext + 1] - hExt[ext - 1]) * inv2Step;
        const hz = (hExt[ext + GRID_EXT] - hExt[ext - GRID_EXT]) * inv2Step;

        let nx = -hx;
        let ny = 1.0;
        let nz = -hz;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (len > 1e-7) {
          nx /= len;
          ny /= len;
          nz /= len;
        } else {
          nx = 0;
          ny = 1;
          nz = 0;
        }

        const o = (j * GRID + i) * 6;
        data[o] = x;
        data[o + 1] = h;
        data[o + 2] = z;
        data[o + 3] = nx;
        data[o + 4] = ny;
        data[o + 5] = nz;
      }
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    return { buffer, ix, iy };
  }

  function ensureActiveChunks() {
    const ixMin = Math.floor((camera.x - COVER_RADIUS) / PATCH_SIZE);
    const ixMax = Math.floor((camera.x + COVER_RADIUS) / PATCH_SIZE);
    const izMin = Math.floor((camera.z - COVER_RADIUS) / PATCH_SIZE);
    const izMax = Math.floor((camera.z + COVER_RADIUS) / PATCH_SIZE);

    const wanted = new Set();
    const nextActive = [];

    for (let ix = ixMin; ix <= ixMax; ix++) {
      for (let iz = izMin; iz <= izMax; iz++) {
        const key = ix + "," + iz;
        let chunk = chunkCache.get(key);
        if (!chunk) {
          chunk = createChunk(ix, iz);
          chunkCache.set(key, chunk);
        }
        wanted.add(key);
        nextActive.push(chunk);
      }
    }

    for (const key of Array.from(chunkCache.keys())) {
      if (!wanted.has(key)) {
        const old = chunkCache.get(key);
        if (old && old.buffer) gl.deleteBuffer(old.buffer);
        chunkCache.delete(key);
      }
    }

    activeList = nextActive;
    lastFrameChunks = activeList.length;
  }

  // ------------------------------------------------------------------
  // Rendering
  // ------------------------------------------------------------------
  function setU3f(u, name, v) {
    if (u[name] !== null) gl.uniform3f(u[name], v[0], v[1], v[2]);
  }

  function setU1f(u, name, v) {
    if (u[name] !== null) gl.uniform1f(u[name], v);
  }

  function setMat4(u, name, m) {
    if (u[name] !== null) gl.uniformMatrix4fv(u[name], false, m);
  }

  let viewportWidth = 1;
  let viewportHeight = 1;
  let aspect = 1.0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    viewportWidth = w;
    viewportHeight = h;
    aspect = w / h;
  }

  function drawSky(lighting, basis) {
    gl.useProgram(skyProgram);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);

    gl.bindBuffer(gl.ARRAY_BUFFER, skyVertexBuffer);
    if (skyAttribs.quad >= 0) {
      gl.enableVertexAttribArray(skyAttribs.quad);
      gl.vertexAttribPointer(skyAttribs.quad, 2, gl.FLOAT, false, 8, 0);
    }

    setMat4(skyUniforms, "uViewProj", new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]));
    setU3f(skyUniforms, "uRight", basis.r);
    setU3f(skyUniforms, "uUp", basis.u);
    setU3f(skyUniforms, "uForward", basis.f);
    setU1f(skyUniforms, "uTanHalfFov", Math.tan(FOV * 0.5));
    setU1f(skyUniforms, "uAspect", aspect);

    setU3f(skyUniforms, "uSunDir", lighting.sunDir);
    setU3f(skyUniforms, "uMoonDir", lighting.moonDir);
    setU3f(skyUniforms, "uSunColor", lighting.sunColor);
    setU3f(skyUniforms, "uMoonColor", lighting.moonColor);
    setU1f(skyUniforms, "uDay", lighting.day);
    setU1f(skyUniforms, "uNight", lighting.night);
    setU1f(skyUniforms, "uSunset", lighting.sunset);

    setU3f(skyUniforms, "uDayHorizon", DAY_HORIZON);
    setU3f(skyUniforms, "uDayZenith", DAY_ZENITH);
    setU3f(skyUniforms, "uNightHorizon", NIGHT_HORIZON);
    setU3f(skyUniforms, "uNightZenith", NIGHT_ZENITH);
    setU3f(skyUniforms, "uSunsetHorizon", SUNSET_HORIZON);
    setU3f(skyUniforms, "uSunsetZenith", SUNSET_ZENITH);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (skyAttribs.quad >= 0) gl.disableVertexAttribArray(skyAttribs.quad);
  }

  function drawTerrain(vp, lighting) {
    gl.useProgram(terrainProgram);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.LESS);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrainIndexBuffer);

    setMat4(terrainUniforms, "uViewProj", vp);
    setU3f(terrainUniforms, "uCameraPos", [camera.x, camera.y, camera.z]);
    setU3f(terrainUniforms, "uLightDir", lighting.lightColor ? norm3(lighting.sunDir) : norm3(lighting.sunDir));
    setU3f(terrainUniforms, "uLightDir", lighting.sunDir);
    setU3f(terrainUniforms, "uLightColor", lighting.lightColor);
    setU3f(terrainUniforms, "uAmbient", lighting.ambient);

    setU3f(terrainUniforms, "uDayHorizon", DAY_HORIZON);
    setU3f(terrainUniforms, "uDayZenith", DAY_ZENITH);
    setU3f(terrainUniforms, "uNightHorizon", NIGHT_HORIZON);
    setU3f(terrainUniforms, "uNightZenith", NIGHT_ZENITH);
    setU3f(terrainUniforms, "uSunsetHorizon", SUNSET_HORIZON);
    setU3f(terrainUniforms, "uSunsetZenith", SUNSET_ZENITH);
    setU1f(terrainUniforms, "uDay", lighting.day);
    setU1f(terrainUniforms, "uSunset", lighting.sunset);

    let drawnTriangles = 0;

    for (const chunk of activeList) {
      gl.bindBuffer(gl.ARRAY_BUFFER, chunk.buffer);

      if (terrainAttribs.pos >= 0) {
        gl.enableVertexAttribArray(terrainAttribs.pos);
        gl.vertexAttribPointer(terrainAttribs.pos, 3, gl.FLOAT, false, 24, 0);
      }
      if (terrainAttribs.normal >= 0) {
        gl.enableVertexAttribArray(terrainAttribs.normal);
        gl.vertexAttribPointer(terrainAttribs.normal, 3, gl.FLOAT, false, 24, 12);
      }

      gl.drawElements(gl.TRIANGLES, TERRAIN_INDEX_COUNT, gl.UNSIGNED_SHORT, 0);
      drawnTriangles += TERRAIN_INDEX_COUNT;
    }

    if (terrainAttribs.normal >= 0) gl.disableVertexAttribArray(terrainAttribs.normal);
    if (terrainAttribs.pos >= 0) gl.disableVertexAttribArray(terrainAttribs.pos);

    return drawnTriangles;
  }

  function drawWater(vp, lighting) {
    gl.useProgram(waterProgram);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.LEQUAL);

    gl.bindBuffer(gl.ARRAY_BUFFER, waterVertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, waterIndexBuffer);

    if (waterAttribs.pos >= 0) {
      gl.enableVertexAttribArray(waterAttribs.pos);
      gl.vertexAttribPointer(waterAttribs.pos, 2, gl.FLOAT, false, 8, 0);
    }

    setMat4(waterUniforms, "uViewProj", vp);
    setU3f(waterUniforms, "uCameraPos", [camera.x, camera.y, camera.z]);
    setU1f(waterUniforms, "uWavePhase", time * WAVE_FACTOR);

    setU3f(waterUniforms, "uSunDir", lighting.sunDir);
    setU3f(waterUniforms, "uMoonDir", lighting.moonDir);
    setU3f(waterUniforms, "uSunColor", lighting.sunColor);
    setU3f(waterUniforms, "uMoonColor", lighting.moonColor);
    setU3f(waterUniforms, "uAmbient", lighting.ambient);
    setU1f(waterUniforms, "uDay", lighting.day);
    setU1f(waterUniforms, "uNight", lighting.night);
    setU1f(waterUniforms, "uSunset", lighting.sunset);

    setU3f(waterUniforms, "uDayHorizon", DAY_HORIZON);
    setU3f(waterUniforms, "uDayZenith", DAY_ZENITH);
    setU3f(waterUniforms, "uNightHorizon", NIGHT_HORIZON);
    setU3f(waterUniforms, "uNightZenith", NIGHT_ZENITH);
    setU3f(waterUniforms, "uSunsetHorizon", SUNSET_HORIZON);
    setU3f(waterUniforms, "uSunsetZenith", SUNSET_ZENITH);

    let drawnTriangles = 0;

    for (const chunk of activeList) {
      setU3f(waterUniforms, "uWaterOffset", [chunk.ix * PATCH_SIZE, 0.0, chunk.iy * PATCH_SIZE]);
      gl.drawElements(gl.TRIANGLES, WATER_INDEX_COUNT, gl.UNSIGNED_SHORT, 0);
      drawnTriangles += WATER_INDEX_COUNT;
    }

    if (waterAttribs.pos >= 0) gl.disableVertexAttribArray(waterAttribs.pos);

    return drawnTriangles;
  }

  function renderScene() {
    gl.viewport(0, 0, viewportWidth, viewportHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const basis = getBasis(camera.yaw, camera.pitch);
    const proj = perspective(FOV, aspect, NEAR, FAR);
    const view = viewMatrix(basis, camera);
    const vp = mat4mul(proj, view);
    const lighting = computeLighting();

    drawSky(lighting, basis);
    const tris1 = drawTerrain(vp, lighting);
    const tris2 = drawWater(vp, lighting);

    lastFrameTriangles = tris1 + tris2 + 2;
  }

  // ------------------------------------------------------------------
  // Camera movement / input
  // ------------------------------------------------------------------
  function autopilotMove(dt) {
    const basis = getBasis(camera.yaw, camera.pitch);
    let hx = basis.f[0];
    let hz = basis.f[2];
    const hl = Math.sqrt(hx * hx + hz * hz);
    if (hl > 1e-5) {
      hx /= hl;
      hz /= hl;
    } else {
      hx = 0;
      hz = -1;
    }

    camera.x += hx * AUTO_SPEED * dt;
    camera.z += hz * AUTO_SPEED * dt;

    const h0 = terrainHeight(camera.x, camera.z);
    const h1 = terrainHeight(camera.x + hx * 65.0, camera.z + hz * 65.0);
    const h2 = terrainHeight(camera.x + hx * 190.0, camera.z + hz * 190.0);

    let desired = Math.max(h0 + 26.0, h1 + 18.0, h2 + 28.0, 12.0);
    desired = Math.min(desired, 500.0);

    camera.y += (desired - camera.y) * Math.min(1.0, dt * 1.1);
  }

  function manualMove(dt) {
    const basis = getBasis(camera.yaw, camera.pitch);
    const target = [0, 0, 0];

    if (keys.has("KeyW") || keys.has("ArrowUp")) {
      target[0] += basis.f[0] * MANUAL_SPEED;
      target[1] += basis.f[1] * MANUAL_SPEED;
      target[2] += basis.f[2] * MANUAL_SPEED;
    }
    if (keys.has("KeyS") || keys.has("ArrowDown")) {
      target[0] -= basis.f[0] * MANUAL_SPEED;
      target[1] -= basis.f[1] * MANUAL_SPEED;
      target[2] -= basis.f[2] * MANUAL_SPEED;
    }
    if (keys.has("KeyD") || keys.has("ArrowRight")) {
      target[0] += basis.r[0] * MANUAL_SPEED;
      target[1] += basis.r[1] * MANUAL_SPEED;
      target[2] += basis.r[2] * MANUAL_SPEED;
    }
    if (keys.has("KeyA") || keys.has("ArrowLeft")) {
      target[0] -= basis.r[0] * MANUAL_SPEED;
      target[1] -= basis.r[1] * MANUAL_SPEED;
      target[2] -= basis.r[2] * MANUAL_SPEED;
    }
    if (keys.has("KeyE") || keys.has("Space")) {
      target[1] += MANUAL_SPEED;
    }
    if (keys.has("KeyQ") || keys.has("ShiftLeft") || keys.has("ShiftRight")) {
      target[1] -= MANUAL_SPEED;
    }

    limitVec(target, MANUAL_SPEED);
    const rate = Math.min(1.0, dt * 4.0);
    velocity[0] += (target[0] - velocity[0]) * rate;
    velocity[1] += (target[1] - velocity[1]) * rate;
    velocity[2] += (target[2] - velocity[2]) * rate;

    camera.x += velocity[0] * dt;
    camera.y += velocity[1] * dt;
    camera.z += velocity[2] * dt;
  }

  function hasMovementInput() {
    return keys.has("KeyW") || keys.has("KeyA") || keys.has("KeyS") || keys.has("KeyD") ||
           keys.has("KeyQ") || keys.has("KeyE") ||
           keys.has("Space") || keys.has("ShiftLeft") || keys.has("ShiftRight") ||
           keys.has("ArrowUp") || keys.has("ArrowDown") || keys.has("ArrowLeft") || keys.has("ArrowRight");
  }

  window.addEventListener("keydown", function (e) {
    const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "";
    if (tag === "input") {
      if (e.key === "F" || e.key === "f") {
        autopilot = !autopilot;
      }
      return;
    }

    const code = e.code || "";
    const key = e.key || "";

    if (key === "F" || key === "f") {
      if (!e.repeat) autopilot = !autopilot;
      e.preventDefault();
      return;
    }

    const movementKeys = [
      "KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE",
      "Space", "ShiftLeft", "ShiftRight",
      "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"
    ];

    if (movementKeys.indexOf(code) >= 0) {
      keys.add(code);
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", function (e) {
    const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "";
    if (tag === "input") return;

    const code = e.code || "";
    keys.delete(code);
  });

  window.addEventListener("mousedown", function (e) {
    if (e.target && e.target.closest && e.target.closest("#ui")) return;
    dragging = true;
    dragX = e.clientX;
    dragY = e.clientY;
  });

  window.addEventListener("mousemove", function (e) {
    if (!dragging) return;
    const dx = e.clientX - dragX;
    const dy = e.clientY - dragY;
    dragX = e.clientX;
    dragY = e.clientY;

    camera.yaw -= dx * 0.0027;
    camera.pitch -= dy * 0.0027;
    camera.pitch = clamp(camera.pitch, -1.35, 1.35);
  });

  window.addEventListener("mouseup", function () {
    dragging = false;
  });

  timeInput.addEventListener("input", function () {
    const v = parseFloat(timeInput.value);
    if (isFinite(v)) {
      time = clamp(v, 0, 24);
    }
  });

  seedInput.addEventListener("input", function () {
    setSeed(parseInt(seedInput.value, 10));
  });

  seedInput.addEventListener("change", function () {
    setSeed(parseInt(seedInput.value, 10));
  });

  window.addEventListener("resize", resize);

  // ------------------------------------------------------------------
  // Public arena API
  // ------------------------------------------------------------------
  function setSeed(n) {
    let v = parseInt(n, 10);
    if (!isFinite(v)) v = 0;
    seed = (v | 0) >>> 0;
    deleteChunks();
    seedInput.value = String(seed);
    clampCameraYOnly();
  }

  function setTime(hours) {
    let v = parseFloat(hours);
    if (!isFinite(v)) v = 0;
    time = clamp(v, 0, 24);
    timeInput.value = time.toFixed(2);
  }

  function clampRequestedCamera(c) {
    const x = Number(c && c.x);
    const y = Number(c && c.y);
    const z = Number(c && c.z);
    const yaw = Number(c && c.yaw);
    const pitch = Number(c && c.pitch);

    camera.x = isFinite(x) ? x : camera.x;
    camera.z = isFinite(z) ? z : camera.z;
    camera.yaw = isFinite(yaw) ? yaw : camera.yaw;
    camera.pitch = isFinite(pitch) ? clamp(pitch, -1.35, 1.35) : camera.pitch;

    const minY = Math.max(terrainHeight(camera.x, camera.z) + CAM_MARGIN, CAM_MARGIN);
    camera.y = isFinite(y) ? Math.max(y, minY) : Math.max(camera.y, minY);

    if (camera.y > 800.0) camera.y = 800.0;
    velocity[0] = 0;
    velocity[1] = 0;
    velocity[2] = 0;
  }

  window.__arena = {
    freeze: function (on) {
      frozen = !!on;
    },
    setSeed: function (n) {
      setSeed(n);
    },
    setTime: function (hours) {
      setTime(hours);
    },
    setCamera: function (c) {
      clampRequestedCamera(c);
    },
    getCamera: function () {
      clampCameraYOnly();
      return { x: camera.x, y: camera.y, z: camera.z, yaw: camera.yaw, pitch: camera.pitch };
    },
    terrainHeight: function (x, z) {
      return terrainHeight(x, z);
    },
    stats: function () {
      return { chunks: lastFrameChunks, triangles: lastFrameTriangles };
    }
  };

  // ------------------------------------------------------------------
  // Main loop
  // ------------------------------------------------------------------
  resize();
  chooseStart();
  clampCameraYOnly();

  let lastT = performance.now();
  let frames = 0;
  let fpsAccum = 0;
  let fpsTimer = 0;

  function frame(now) {
    const dt = Math.max(0.0, Math.min(0.1, (now - lastT) * 0.001));
    lastT = now;

    if (!frozen) {
      time += dt * (24.0 / DAY_SECONDS);
      if (time >= 24.0) time -= 24.0;
      if (time < 0.0) time += 24.0;
    }

    const manualInput = hasMovementInput();
    if (!frozen && autopilot && !manualInput) {
      autopilotMove(dt);
    }
    if (manualInput) {
      manualMove(dt);
    }

    clampCameraAfterMove();
    ensureActiveChunks();
    renderScene();

    frames++;
    fpsAccum += dt;
    fpsTimer += dt;
    if (fpsTimer >= 0.25) {
      const fps = frames / Math.max(0.001, fpsAccum);
      fpsLabel.textContent = "fps: " + Math.round(fps);
      frames = 0;
      fpsAccum = 0;
      fpsTimer = 0;
    }

    timeInput.value = time.toFixed(2);
    autoLabel.textContent = "AUTO: " + (autopilot ? "on" : "off");

    requestAnimationFrame(frame);
  }

  // Ensure initial state is prepared even before the first animation frame.
  ensureActiveChunks();
  renderScene();
  requestAnimationFrame(frame);
})();
</script>
</body>
</html>
```