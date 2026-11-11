Here is a complete, self-contained HTML document that renders an infinite procedural terrain flyover using raw WebGL, with a day/night cycle, water, and sky simulation.
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Horizon</title>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; height: 100%; width: 100%;
    overflow: hidden; background: #05070c;
  }
  #c { display: block; width: 100%; height: 100%; }

  #vignette {
    position: fixed; inset: 0; pointer-events: none; z-index: 5;
    background: radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.42) 100%);
  }

  #ui {
    position: fixed; left: 20px; top: 18px; z-index: 10;
    width: 252px; padding: 14px 16px 12px;
    border-radius: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
    font-size: 10.5px; letter-spacing: 0.14em;
    color: rgba(232,242,255,0.86);
    background: rgba(9,15,25,0.30);
    border: 1px solid rgba(180,210,255,0.15);
    backdrop-filter: blur(9px) saturate(130%);
    -webkit-backdrop-filter: blur(9px) saturate(130%);
    user-select: none;
    -webkit-user-select: none;
  }
  #ui .brand {
    font-size: 13px; letter-spacing: 0.42em; font-weight: 600;
    color: #ffffff; margin-bottom: 13px; opacity: 0.94;
  }
  #ui .row { display: flex; align-items: center; gap: 9px; margin-bottom: 9px; }
  #ui .row:last-child { margin-bottom: 0; }
  #ui label { width: 32px; opacity: 0.55; }
  #ui .val { margin-left: auto; opacity: 0.72; font-variant-numeric: tabular-nums; }

  input[type=range] {
    -webkit-appearance: none; appearance: none;
    flex: 1 1 auto; height: 2px; margin: 0;
    background: rgba(255,255,255,0.24);
    border-radius: 2px; outline: none; cursor: pointer;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 11px; height: 11px; border-radius: 50%;
    background: #eef5ff; border: none;
    box-shadow: 0 0 9px rgba(150,195,255,0.85);
    cursor: pointer;
  }
  input[type=number] {
    width: 74px; padding: 3px 6px;
    font: inherit; letter-spacing: 0.08em;
    color: #eaf2ff;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.16);
    border-radius: 4px; outline: none;
  }
  input[type=number]:focus { border-color: rgba(150,200,255,0.55); }

  #autoOut { color: rgba(232,242,255,0.5); transition: color 0.25s; }
  #autoOut.on { color: #7dfab0; text-shadow: 0 0 8px rgba(90,255,160,0.5); }

  #hint {
    position: fixed; left: 22px; bottom: 16px; z-index: 10;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 10px; letter-spacing: 0.18em;
    color: rgba(220,235,255,0.34);
    user-select: none; pointer-events: none;
  }
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="vignette"></div>

<div id="ui">
  <div class="brand">HORIZON</div>
  <div class="row">
    <label for="time">TIME</label>
    <input id="time" type="range" min="0" max="24" step="0.01" value="8.5">
    <span class="val" id="timeOut">08:30</span>
  </div>
  <div class="row">
    <label for="seed">SEED</label>
    <input id="seed" type="number" step="1" value="1337">
    <span class="val" id="autoOut">AUTO</span>
  </div>
  <div class="row">
    <span class="val" id="fpsOut" style="margin-left:0">-- FPS</span>
    <span class="val" id="chunkOut">-- CHUNKS</span>
  </div>
</div>
<div id="hint">WASD FLY &nbsp;·&nbsp; Q/E ALT &nbsp;·&nbsp; DRAG LOOK &nbsp;·&nbsp; F AUTOPILOT</div>

<script>
(function () {
'use strict';

/* =========================================================================
   Canvas / context
   ========================================================================= */
var canvas = document.getElementById('c');
var gl = canvas.getContext('webgl', {
  antialias: true, alpha: false, depth: true, stencil: false,
  premultipliedAlpha: false, powerPreference: 'high-performance'
}) || canvas.getContext('experimental-webgl');

if (!gl) {
  document.body.innerHTML = '<div style="color:#fff;font:14px monospace;padding:40px">WebGL is not available.</div>';
  return;
}

/* =========================================================================
   Small math helpers
   ========================================================================= */
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function smoothstep(a, b, x) {
  var t = (x - a) / (b - a);
  t = t < 0 ? 0 : (t > 1 ? 1 : t);
  return t * t * (3 - 2 * t);
}

function mat4Perspective(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy * 0.5);
  out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
  out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
  out[8] = 0; out[9] = 0; out[10] = (far + near) / (near - far); out[11] = -1;
  out[12] = 0; out[13] = 0; out[14] = (2 * far * near) / (near - far); out[15] = 0;
  return out;
}

function mat4LookAt(out, ex, ey, ez, cx, cy, cz, ux, uy, uz) {
  var zx = ex - cx, zy = ey - cy, zz = ez - cz;
  var l = Math.sqrt(zx * zx + zy * zy + zz * zz);
  if (l < 1e-8) { zx = 0; zy = 0; zz = 1; l = 1; }
  zx /= l; zy /= l; zz /= l;

  var xx = uy * zz - uz * zy;
  var xy = uz * zx - ux * zz;
  var xz = ux * zy - uy * zx;
  l = Math.sqrt(xx * xx + xy * xy + xz * xz);
  if (l < 1e-8) { xx = 1; xy = 0; xz = 0; l = 1; }
  xx /= l; xy /= l; xz /= l;

  var yx = zy * xz - zz * xy;
  var yy = zz * xx - zx * xz;
  var yz = zx * xy - zy * xx;

  out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
  out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
  out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
  out[12] = -(xx * ex + xy * ey + xz * ez);
  out[13] = -(yx * ex + yy * ey + yz * ez);
  out[14] = -(zx * ex + zy * ey + zz * ez);
  out[15] = 1;
  return out;
}

function mat4Mul(out, a, b) {
  for (var c = 0; c < 4; c++) {
    var b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
    out[c * 4 + 0] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
    out[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
    out[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
    out[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
  }
  return out;
}

/* =========================================================================
   Deterministic noise / world generation
   ========================================================================= */
function mulberry32(a) {
  a = a | 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

var perm = new Uint8Array(512);

function seedPerm(seed) {
  var rnd = mulberry32(seed | 0);
  var p = new Uint8Array(256);
  var i, j, t;
  for (i = 0; i < 256; i++) p[i] = i;
  for (i = 255; i > 0; i--) {
    j = (rnd() * (i + 1)) | 0;
    t = p[i]; p[i] = p[j]; p[j] = t;
  }
  for (i = 0; i < 512; i++) perm[i] = p[i & 255];
}

function noise2(x, y) {
  var ix = Math.floor(x), iy = Math.floor(y);
  var fx = x - ix, fy = y - iy;
  var ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  var uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  var X = ix & 255, Y = iy & 255;
  var a = perm[perm[X] + Y];
  var b = perm[perm[X + 1] + Y];
  var c = perm[perm[X] + Y + 1];
  var d = perm[perm[X + 1] + Y + 1];
  var ab = a + (b - a) * ux;
  var cd = c + (d - c) * ux;
  return ((ab + (cd - ab) * uy) * (1.0 / 255.0)) * 2.0 - 1.0;
}

function fbm(x, y, oct) {
  var a = 1.0, f = 1.0, s = 0.0, n = 0.0;
  for (var i = 0; i < oct; i++) {
    s += a * noise2(x * f + i * 37.7, y * f + i * 19.3);
    n += a; a *= 0.5; f *= 2.0;
  }
  return s / n;
}

function terrainHeight(x, z) {
  // domain warp
  var wx = x + 130.0 * noise2(x * 0.0011 + 41.3, z * 0.0011 - 17.7);
  var wz = z + 130.0 * noise2(x * 0.0011 - 23.9, z * 0.0011 + 61.1);

  // continental masses
  var cont = fbm(wx * 0.00062, wz * 0.00062, 4);

  // mountain mask
  var mm = fbm(wx * 0.0019 + 13.0, wz * 0.0019 - 5.0, 2);
  var mask = smoothstep(-0.05, 0.42, cont + 0.32 * mm);

  // ridged multifractal
  var rid = 0.0, amp = 1.0, freq = 0.0016, norm = 0.0, i;
  for (i = 0; i < 4; i++) {
    var v = 1.0 - Math.abs(noise2(wx * freq + i * 31.7, wz * freq + i * 11.3));
    rid += amp * v * v;
    norm += amp;
    amp *= 0.5;
    freq *= 2.15;
  }
  rid /= norm;

  var h = cont * 165.0 + 12.0 + mask * rid * 320.0;
  h += fbm(x * 0.0055, z * 0.0055, 2) * 7.0;

  if (h < 0.0) h = -58.0 * (1.0 - Math.exp(h / 58.0));
  return h;
}

/* =========================================================================
   Shaders
   ========================================================================= */
var SKY_VS = [
  'attribute vec2 aPos;',
  'uniform vec3 uFwd, uRight, uUp;',
  'uniform float uTanHalf, uAspect;',
  'varying vec3 vDir;',
  'void main() {',
  '  vDir = uFwd + uRight * (aPos.x * uTanHalf * uAspect) + uUp * (aPos.y * uTanHalf);',
  '  gl_Position = vec4(aPos, 1.0, 1.0);',
  '}'
].join('\n');

var SKY_FS = [
  'precision highp float;',
  'varying vec3 vDir;',
  'uniform vec3 uZenith, uHorizon, uGround, uSunDir, uSunColor;',
  'uniform float uNight, uGlow;',
  'float hash13(vec3 p) {',
  '  p = fract(p * 0.1031);',
  '  p += dot(p, p.yzx + 33.33);',
  '  return fract((p.x + p.y) * p.z);',
  '}',
  'void main() {',
  '  vec3 d = normalize(vDir);',
  '  float y = d.y;',
  '  float t = pow(clamp(y, 0.0, 1.0), 0.42);',
  '  vec3 col = mix(uHorizon, uZenith, t);',
  '  col = mix(col, uGround, smoothstep(0.0, -0.13, y));',
  '',
  '  float sd = max(dot(d, uSunDir), 0.0);',
  '  col += uSunColor * pow(sd, 8.0) * 0.10 * uGlow;',
  '  col += uSunColor * pow(sd, 90.0) * 0.35 * uGlow;',
  '  col += uSunColor * smoothstep(0.9998, 0.99995, sd) * 5.0;',
  '',
  '  float md = max(dot(d, -uSunDir), 0.0);',
  '  col += vec3(0.80, 0.86, 1.0) * smoothstep(0.9994, 0.99982, md) * 1.6 * uNight;',
  '',
  '  if (uNight > 0.02) {',
  '    vec3 sp = d * 260.0;',
  '    vec3 cell = floor(sp);',
  '    float r = hash13(cell);',
  '    if (r > 0.994) {',
  '      vec3 f = fract(sp) - 0.5;',
  '      float s = smoothstep(0.46, 0.0, length(f));',
  '      col += vec3(0.80, 0.86, 1.0) * s * uNight * 1.35 * smoothstep(-0.08, 0.16, y);',
  '    }',
  '  }',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

var TERRAIN_VS = [
  'attribute vec3 aPos;',
  'attribute vec3 aNrm;',
  'uniform mat4 uVP;',
  'varying vec3 vPos;',
  'varying vec3 vNrm;',
  'void main() {',
  '  vPos = aPos;',
  '  vNrm = aNrm;',
  '  gl_Position = uVP * vec4(aPos, 1.0);',
  '}'
].join('\n');

var TERRAIN_FS = [
  'precision highp float;',
  'varying vec3 vPos;',
  'varying vec3 vNrm;',
  'uniform vec3 uCam, uSunDir, uSunCol, uMoonDir, uMoonCol, uAmbCol, uFogCol;',
  'uniform float uFogD;',
  'float hash21(vec2 p) {',
  '  p = fract(p * vec2(123.34, 456.21));',
  '  p += dot(p, p + 45.32);',
  '  return fract(p.x * p.y);',
  '}',
  'void main() {',
  '  vec3 n = normalize(vNrm);',
  '  float h = vPos.y;',
  '  float slope = 1.0 - clamp(n.y, 0.0, 1.0);',
  '',
  '  float v1 = hash21(floor(vPos.xz * 0.11));',
  '  float v2 = hash21(floor(vPos.xz * 0.017) + 3.7);',
  '',
  '  vec3 sand  = vec3(0.78, 0.72, 0.55);',
  '  vec3 dry   = vec3(0.47, 0.48, 0.27);',
  '  vec3 grass = vec3(0.16, 0.32, 0.14);',
  '  vec3 rock  = vec3(0.37, 0.35, 0.32);',
  '  vec3 rock2 = vec3(0.24, 0.23, 0.22);',
  '  vec3 snow  = vec3(0.93, 0.95, 1.00);',
  '',
  '  vec3 alb = mix(grass, dry, v2 * 0.85);',
  '  alb = mix(alb, dry, smoothstep(0.55, 1.0, v1) * 0.5);',
  '  alb = mix(sand, alb, smoothstep(1.0, 8.0, h + (v1 - 0.5) * 3.0));',
  '  alb = mix(alb, mix(rock, rock2, v1), smoothstep(0.15, 0.44, slope + (v1 - 0.5) * 0.10));',
  '  float snowLine = 150.0 + v2 * 60.0;',
  '  alb = mix(alb, snow, smoothstep(snowLine, snowLine + 60.0, h) * (1.0 - smoothstep(0.55, 0.85, slope)));',
  '  alb = mix(alb, vec3(0.31, 0.29, 0.25), smoothstep(-1.0, -16.0, h));',
  '',
  '  float ndl = max(dot(n, uSunDir), 0.0);',
  '  float ndm = max(dot(n, uMoonDir), 0.0);',
  '  float sky = 0.55 + 0.45 * n.y;',
  '  vec3 lit = alb * (uSunCol * ndl + uMoonCol * ndm + uAmbCol * sky);',
  '',
  '  float dist = length(vPos - uCam);',
  '  float f = 1.0 - exp(-dist * dist * uFogD * uFogD);',
  '  f = max(f, smoothstep(1440.0, 1850.0, dist));',
  '  vec3 col = mix(lit, uFogCol, clamp(f, 0.0, 1.0));',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

var WATER_VS = [
  'attribute vec2 aPos;',
  'uniform mat4 uVP;',
  'uniform vec3 uCenter;',
  'uniform float uSize;',
  'varying vec3 vPos;',
  'void main() {',
  '  vec3 p = vec3(uCenter.x + aPos.x * uSize, 0.0, uCenter.z + aPos.y * uSize);',
  '  vPos = p;',
  '  gl_Position = uVP * vec4(p, 1.0);',
  '}'
].join('\n');

var WATER_FS = [
  'precision highp float;',
  'varying vec3 vPos;',
  'uniform vec3 uCam, uSunDir, uSunCol, uZenith, uHorizon, uFogCol, uAmbCol;',
  'uniform float uFogD, uTime;',
  '',
  'void addWave(inout vec2 g, vec2 p, vec2 dir, float f, float a, float t, float sp) {',
  '  dir = normalize(dir);',
  '  float ph = dot(p, dir) * f + t * sp;',
  '  g += dir * (f * a * cos(ph));',
  '}',
  '',
  'void main() {',
  '  vec2 p = vPos.xz;',
  '  vec2 g = vec2(0.0);',
  '  float t = uTime;',
  '  addWave(g, p, vec2( 1.0,  0.35), 0.075, 0.75, t, 0.90);',
  '  addWave(g, p, vec2(-0.60, 1.00), 0.115, 0.42, t, 1.35);',
  '  addWave(g, p, vec2( 0.30, -0.90), 0.210, 0.20, t, 1.95);',
  '  addWave(g, p, vec2( 1.00,  1.00), 0.360, 0.10, t, 2.70);',
  '  addWave(g, p, vec2(-1.00,  0.20), 0.620, 0.048, t, 3.60);',
  '  addWave(g, p, vec2( 0.25,  1.00), 1.050, 0.022, t, 4.70);',
  '',
  '  vec3 n = normalize(vec3(-g.x, 1.0, -g.y));',
  '  vec3 V = normalize(uCam - vPos);',
  '  float fres = pow(1.0 - max(dot(V, n), 0.0), 4.0);',
  '  fres = 0.03 + 0.97 * fres;',
  '',
  '  vec3 R = reflect(-V, n);',
  '  vec3 skyR = mix(uHorizon, uZenith, pow(clamp(R.y, 0.0, 1.0), 0.5));',
  '  skyR += uSunCol * pow(max(dot(R, uSunDir), 0.0), 30.0) * 0.35;',
  '',
  '  vec3 deep    = vec3(0.010, 0.042, 0.072);',
  '  vec3 shallow = vec3(0.048, 0.170, 0.190);',
  '  vec3 base = mix(deep, shallow, 0.28);',
  '  base *= (uAmbCol * 2.1 + uSunCol * 0.30 * max(uSunDir.y, 0.0));',
  '',
  '  vec3 col = mix(base, skyR, fres);',
  '  float spec = pow(max(dot(R, uSunDir), 0.0), 340.0);',
  '  col += uSunCol * spec * 5.0;',
  '',
  '  float dist = length(vPos - uCam);',
  '  float f = 1.0 - exp(-dist * dist * uFogD * uFogD);',
  '  f = max(f, smoothstep(1440.0, 1850.0, dist));',
  '  col = mix(col, uFogCol, clamp(f, 0.0, 1.0));',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

/* =========================================================================
   GL program helpers
   ========================================================================= */
function compileShader(type, src) {
  var s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('shader compile: ' + gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

function makeProgram(vsSrc, fsSrc) {
  var vs = compileShader(gl.VERTEX_SHADER, vsSrc);
  var fs = compileShader(gl.FRAGMENT_SHADER, fsSrc);
  var p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('program link: ' + gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

function getLocs(p, names) {
  var o = {};
  for (var i = 0; i < names.length; i++) o[names[i]] = gl.getUniformLocation(p, names[i]);
  return o;
}

var skyProg = makeProgram(SKY_VS, SKY_FS);
var skyLoc = getLocs(skyProg, ['uFwd', 'uRight', 'uUp', 'uTanHalf', 'uAspect',
  'uZenith', 'uHorizon', 'uGround', 'uSunDir', 'uSunColor', 'uNight', 'uGlow']);
var skyAPos = gl.getAttribLocation(skyProg, 'aPos');

var terProg = makeProgram(TERRAIN_VS, TERRAIN_FS);
var terLoc = getLocs(terProg, ['uVP', 'uCam', 'uSunDir', 'uSunCol', 'uMoonDir',
  'uMoonCol', 'uAmbCol', 'uFogCol', 'uFogD']);
var terAPos = gl.getAttribLocation(terProg, 'aPos');
var terANrm = gl.getAttribLocation(terProg, 'aNrm');

var watProg = makeProgram(WATER_VS, WATER_FS);
var watLoc = getLocs(watProg, ['uVP', 'uCenter', 'uSize', 'uCam', 'uSunDir', 'uSunCol',
  'uZenith', 'uHorizon', 'uFogCol', 'uAmbCol', 'uFogD', 'uTime']);
var watAPos = gl.getAttribLocation(watProg, 'aPos');

/* ---- static geometry ---- */
var quadBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

var waterBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, waterBuf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1, -1, 1, -1, 1, 1,
  -1, -1, 1, 1, -1, 1
]), gl.STATIC_DRAW);

/* =========================================================================
   Chunk system
   ========================================================================= */
var CHUNK = 256;
var VIEW_RADIUS = 1900;
var LODS = [
  { seg: 64, dist: 400 },
  { seg: 32, dist: 850 },
  { seg: 16, dist: 1400 },
  { seg: 8, dist: 1900 }
];

function buildIndices(seg) {
  var W = seg + 1;
  var core = W * W;
  var arr = [];
  var i, j;
  for (j = 0; j < seg; j++) {
    for (i = 0; i < seg; i++) {
      var a = j * W + i, b = a + 1, c = a + W, d = c + 1;
      arr.push(a, c, b, b, c, d);
    }
  }
  // skirt strips
  for (i = 0; i < seg; i++) {
    var c0 = i, c1 = i + 1;
    var s0 = core + i, s1 = core + i + 1;
    arr.push(c0, c1, s1, c0, s1, s0);
  }
  var off1 = core + W;
  for (i = 0; i < seg; i++) {
    var e0 = seg * W + i, e1 = e0 + 1;
    var t0 = off1 + i, t1 = off1 + i + 1;
    arr.push(e0, e1, t1, e0, t1, t0);
  }
  var off2 = core + 2 * W;
  for (j = 0; j < seg; j++) {
    var f0 = j * W, f1 = f0 + W;
    var u0 = off2 + j, u1 = off2 + j + 1;
    arr.push(f0, f1, u1, f0, u1, u0);
  }
  var off3 = core + 3 * W;
  for (j = 0; j < seg; j++) {
    var g0 = j * W + seg, g1 = g0 + W;
    var v0 = off3 + j, v1 = off3 + j + 1;
    arr.push(g0, g1, v1, g0, v1, v0);
  }
  return new Uint16Array(arr);
}

var lodIndex = [];
(function () {
  for (var i = 0; i < LODS.length; i++) {
    var idx = buildIndices(LODS[i].seg);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    lodIndex.push({ buf: buf, count: idx.length, tris: idx.length / 3 });
  }
})();

var chunks = new Map();
var statTris = 0;

var SKIRT_DEPTH = 22.0;

function buildChunkGeometry(cx, cz, lod) {
  var seg = LODS[lod].seg;
  var W = seg + 1;
  var S = seg + 3;
  var ox = cx * CHUNK, oz = cz * CHUNK;
  var step = CHUNK / seg;
  var H = new Float32Array(S * S);
  var i, j, wz, row;
  for (j = 0; j < S; j++) {
    wz = oz + (j - 1) * step;
    row = j * S;
    for (i = 0; i < S; i++) {
      H[row + i] = terrainHeight(ox + (i - 1) * step, wz);
    }
  }

  var vertCount = W * W + 4 * W;
  var data = new Float32Array(vertCount * 6);
  var p = 0;

  for (j = 0; j < W; j++) {
    for (i = 0; i < W; i++) {
      var k = (j + 1) * S + (i + 1);
      var h = H[k];
      var nx = H[k - 1] - H[k + 1];
      var ny = 2 * step;
      var nz = H[k - S] - H[k + S];
      var inv = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
      data[p++] = ox + i * step;
      data[p++] = h;
      data[p++] = oz + j * step;
      data[p++] = nx * inv; data[p++] = ny * inv; data[p++] = nz * inv;
    }
  }

  function skirt(i, j) {
    var k = (j + 1) * S + (i + 1);
    var h = H[k] - SKIRT_DEPTH;
    var nx = H[k - 1] - H[k + 1];
    var ny = 2 * step;
    var nz = H[k - S] - H[k + S];
    var inv = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
    data[p++] = ox + i * step;
    data[p++] = h;
    data[p++] = oz + j * step;
    data[p++] = nx * inv; data[p++] = ny * inv; data[p++] = nz * inv;
  }

  for (i = 0; i < W; i++) skirt(i, 0);
  for (i = 0; i < W; i++) skirt(i, seg);
  for (j = 0; j < W; j++) skirt(0, j);
  for (j = 0; j < W; j++) skirt(seg, j);

  return data;
}

function createChunk(cx, cz, lod) {
  var data = buildChunkGeometry(cx, cz, lod);
  var vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  var ch = { cx: cx, cz: cz, lod: lod, vbo: vbo, used: true };
  chunks.set(cx + ',' + cz, ch);
  return ch;
}

function destroyChunk(ch) {
  gl.deleteBuffer(ch.vbo);
}

function rebuildChunk(ch, lod) {
  var data = buildChunkGeometry(ch.cx, ch.cz, lod);
  gl.bindBuffer(gl.ARRAY_BUFFER, ch.vbo);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  ch.lod = lod;
}

function updateChunks(budgetMs) {
  var t0 = performance.now();
  var camCX = Math.floor(cam.x / CHUNK);
  var camCZ = Math.floor(cam.z / CHUNK);
  var R = Math.ceil(VIEW_RADIUS / CHUNK) + 1;
  var queue = [];
  var dx, dz, cx, cz, key, ch, i;

  var iter = chunks.values();
  var e = iter.next();
  while (!e.done) { e.value.used = false; e = iter.next(); }

  for (dz = -R; dz <= R; dz++) {
    for (dx = -R; dx <= R; dx++) {
      cx = camCX + dx;
      cz = camCZ + dz;
      var x0 = cx * CHUNK, z0 = cz * CHUNK;
      var nx = cam.x < x0 ? x0 : (cam.x > x0 + CHUNK ? x0 + CHUNK : cam.x);
      var nz = cam.z < z0 ? z0 : (cam.z > z0 + CHUNK ? z0 + CHUNK : cam.z);
      var ddx = nx - cam.x, ddz = nz - cam.z;
      var d = Math.sqrt(ddx * ddx + ddz * ddz);
      if (d > VIEW_RADIUS) continue;

      var lod = LODS.length - 1;
      for (i = 0; i < LODS.length; i++) {
        if (d < LODS[i].dist) { lod = i; break; }
      }

      key = cx + ',' + cz;
      ch = chunks.get(key);
      if (ch) {
        ch.used = true;
        if (ch.lod !== lod) {
          var doChange;
          if (lod > ch.lod) doChange = d > LODS[ch.lod].dist * 1.15;
          else doChange = d < LODS[lod].dist * 0.9;
          if (doChange) rebuildChunk(ch, lod);
        }
      } else {
        queue.push({ cx: cx, cz: cz, lod: lod, d: d });
      }
    }
  }

  // remove unneeded
  var kill = [];
  chunks.forEach(function (c, k) { if (!c.used) kill.push(k); });
  for (i = 0; i < kill.length; i++) {
    var c2 = chunks.get(kill[i]);
    destroyChunk(c2);
    chunks.delete(kill[i]);
  }

  if (queue.length === 0) return;
  queue.sort(function (a, b) { return a.d - b.d; });

  for (i = 0; i < queue.length; i++) {
    var q = queue[i];
    createChunk(q.cx, q.cz, q.lod);
    if (performance.now() - t0 > budgetMs) break;
  }
}

/* =========================================================================
   Camera / input
   ========================================================================= */
var cam = { x: 0, y: 120, z: 0, yaw: 0.7, pitch: -0.06 };
var vel = { x: 0, y: 0, z: 0 };
var autopilot = true;
var frozen = false;
var simTime = 0;
var autoTime = 0;
var timeOfDay = 8.5;

var keys = Object.create(null);

function cameraClamp() {
  var g = terrainHeight(cam.x, cam.z);
  var minY = Math.max(g + 6.0, 2.0);
  if (cam.y < minY) {
    cam.y = minY;
    if (vel.y < 0) vel.y = 0;
  }
  cam.pitch = clamp(cam.pitch, -1.45, 1.45);
}

function updateAutopilot(dt) {
  autoTime += dt;
  var turn = Math.sin(autoTime * 0.09) * 0.055 + Math.sin(autoTime * 0.031 + 1.7) * 0.045;
  cam.yaw += turn * dt * 3.2;

  var fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw);
  var spd = 46.0;
  cam.x += fx * spd * dt;
  cam.z += fz * spd * dt;

  var hHere = terrainHeight(cam.x, cam.z);
  var hAhead = terrainHeight(cam.x + fx * 150.0, cam.z + fz * 150.0);
  var target = Math.max(hHere, hAhead, 0.0) + 78.0;
  cam.y += (target - cam.y) * Math.min(1, dt * 2.6);

  var desiredPitch = -0.10 + clamp((hAhead - hHere) * 0.0016, -0.10, 0.10);
  cam.pitch += (desiredPitch - cam.pitch) * Math.min(1, dt * 2.0);
}

function updateManual(dt) {
  var fIn = (keys['w'] ? 1 : 0) - (keys['s'] ? 1 : 0);
  var sIn = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0);
  var uIn = (keys['e'] ? 1 : 0) - (keys['q'] ? 1 : 0)
          + (keys[' '] ? 1 : 0) - (keys['shift'] ? 1 : 0);

  var cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  var fwdX = -Math.sin(cam.yaw) * cp, fwdY = sp, fwdZ = -Math.cos(cam.yaw) * cp;
  var rgtX = Math.cos(cam.yaw), rgtZ = -Math.sin(cam.yaw);

  var tx = fIn * fwdX + sIn * rgtX;
  var ty = fIn * fwdY + uIn;
  var tz = fIn * fwdZ + sIn * rgtZ;

  var len = Math.sqrt(tx * tx + ty * ty + tz * tz);
  var speed = 62.0;
  if (len > 1e-5) { tx = tx / len * speed; ty = ty / len * speed; tz = tz / len * speed; }
  else { tx = 0; ty = 0; tz = 0; }

  var k = 1 - Math.exp(-dt * 7.0);
  vel.x += (tx - vel.x) * k;
  vel.y += (ty - vel.y) * k;
  vel.z += (tz - vel.z) * k;

  cam.x += vel.x * dt;
  cam.y += vel.y * dt;
  cam.z += vel.z * dt;
}

/* keyboard */
window.addEventListener('keydown', function (ev) {
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
  var k = (ev.key || '').toLowerCase();
  if (k === 'f') {
    autopilot = !autopilot;
    updateAutoUI();
  }
  keys[k] = true;
  if (k === ' ' || k === 'shift' || k === 'arrowup' || k === 'arrowdown' ||
      k === 'arrowleft' || k === 'arrowright') {
    ev.preventDefault();
  }
}, false);

window.addEventListener('keyup', function (ev) {
  var k = (ev.key || '').toLowerCase();
  keys[k] = false;
}, false);

window.addEventListener('blur', function () {
  for (var k in keys) keys[k] = false;
}, false);

/* mouse look */
var dragging = false, lastMX = 0, lastMY = 0;

window.addEventListener('mousedown', function (ev) {
  var t = ev.target;
  if (t && t.closest && t.closest('#ui')) return;
  dragging = true;
  lastMX = ev.clientX;
  lastMY = ev.clientY;
  if (ev.preventDefault) ev.preventDefault();
}, false);

window.addEventListener('mousemove', function (ev) {
  if (!dragging) return;
  var dx = ev.clientX - lastMX;
  var dy = ev.clientY - lastMY;
  lastMX = ev.clientX;
  lastMY = ev.clientY;
  cam.yaw -= dx * 0.0042;
  cam.pitch -= dy * 0.0042;
  cam.pitch = clamp(cam.pitch, -1.45, 1.45);
}, false);

window.addEventListener('mouseup', function () { dragging = false; }, false);
window.addEventListener('mouseleave', function () { dragging = false; }, false);

/* =========================================================================
   Atmosphere / lighting parameters
   ========================================================================= */
var PAL_NIGHT = {
  zen: [0.008, 0.014, 0.038], hor: [0.035, 0.055, 0.100],
  sun: [0.55, 0.62, 0.85], amb: [0.075, 0.095, 0.150], glow: 0.30
};
var PAL_DUSK = {
  zen: [0.085, 0.125, 0.330], hor: [0.950, 0.420, 0.160],
  sun: [1.00, 0.52, 0.22], amb: [0.20, 0.185, 0.255], glow: 2.30
};
var PAL_DAY = {
  zen: [0.155, 0.395, 0.790], hor: [0.660, 0.800, 0.940],
  sun: [1.00, 0.97, 0.90], amb: [0.30, 0.42, 0.62], glow: 0.90
};

function mix3(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t,
          a[2] + (b[2] - a[2]) * t];
}

var atm = {
  sunDir: [0, 1, 0], moonDir: [0, -1, 0],
  zenith: [0, 0, 0], horizon: [0, 0, 0], ground: [0, 0, 0],
  sunColor: [0, 0, 0], ambColor: [0, 0, 0], moonColor: [0, 0, 0],
  fogColor: [0, 0, 0], night: 0, glow: 1
};

function updateAtmosphere() {
  var ang = (timeOfDay - 6.0) / 24.0 * Math.PI * 2.0;
  var sc = Math.cos(ang), sy = Math.sin(ang);
  var sx = sc * 0.95, sz = sc * 0.30;
  var sl = Math.sqrt(sx * sx + sy * sy + sz * sz);
  var sun = [sx / sl, sy / sl, sz / sl];

  var elev = sun[1];

  var t1 = smoothstep(-0.30, 0.03, elev);
  var t2 = smoothstep(0.03, 0.30, elev);

  var a = {
    zen: mix3(PAL_NIGHT.zen, PAL_DUSK.zen, t1),
    hor: mix3(PAL_NIGHT.hor, PAL_DUSK.hor, t1),
    sun: mix3(PAL_NIGHT.sun, PAL_DUSK.sun, t1),
    amb: mix3(PAL_NIGHT.amb, PAL_DUSK.amb, t1),
    glow: PAL_NIGHT.glow + (PAL_DUSK.glow - PAL_NIGHT.glow) * t1
  };
  var zen = mix3(a.zen, PAL_DAY.zen, t2);
  var hor = mix3(a.hor, PAL_DAY.hor, t2);
  var sc2 = mix3(a.sun, PAL_DAY.sun, t2);
  var amb = mix3(a.amb, PAL_DAY.amb, t2);
  var glow = a.glow + (PAL_DAY.glow - a.glow) * t2;

  var dayI = smoothstep(-0.04, 0.22, elev);
  var sunColor = [sc2[0] * dayI * 1.15, sc2[1] * dayI * 1.15, sc2[2] * dayI * 1.15];

  var night = 1.0 - smoothstep(-0.20, 0.03, elev);
  var moonColor = [0.30 * night, 0.38 * night, 0.62 * night];

  atm.sunDir = sun;
  atm.moonDir = [-sun[0], -sun[1], -sun[2]];
  atm.zenith = zen;
  atm.horizon = hor;
  atm.ground = mix3(hor, [0.02, 0.025, 0.03], 0.55);
  atm.sunColor = sunColor;
  atm.ambColor = amb;
  atm.moonColor = moonColor;
  atm.fogColor = hor;
  atm.night = night;
  atm.glow = glow;
}

/* =========================================================================
   Rendering
   ========================================================================= */
var proj = new Float32Array(16);
var view = new Float32Array(16);
var vp = new Float32Array(16);
var FOV = 60.0 * Math.PI / 180.0;
var FOG_D = 0.00105;

function resize() {
  var dpr = Math.min(window.devicePixelRatio || 1, 1.6);
  var cw = canvas.clientWidth || window.innerWidth || 1;
  var ch = canvas.clientHeight || window.innerHeight || 1;
  var w = Math.max(1, Math.floor(cw * dpr));
  var h = Math.max(1, Math.floor(ch * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
}

function drawSky(cp, sp) {
  var fx = -Math.sin(cam.yaw) * cp;
  var fy = sp;
  var fz = -Math.cos(cam.yaw) * cp;
  var rx = Math.cos(cam.yaw);
  var rz = -Math.sin(cam.yaw);
  var ux = 0 * fz - rz * fy;
  var uy = rz * fx - rx * fz;
  var uz = rx * fy - 0 * fx;

  gl.useProgram(skyProg);
  gl.disable(gl.DEPTH_TEST);
  gl.depthMask(false);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.enableVertexAttribArray(skyAPos);
  gl.vertexAttribPointer(skyAPos, 2, gl.FLOAT, false, 0, 0);

  gl.uniform3f(skyLoc.uFwd, fx, fy, fz);
  gl.uniform3f(skyLoc.uRight, rx, 0, rz);
  gl.uniform3f(skyLoc.uUp, ux, uy, uz);
  gl.uniform1f(skyLoc.uTanHalf, Math.tan(FOV * 0.5));
  gl.uniform1f(skyLoc.uAspect, canvas.width / Math.max(1, canvas.height));
  gl.uniform3fv(skyLoc.uZenith, atm.zenith);
  gl.uniform3fv(skyLoc.uHorizon, atm.horizon);
  gl.uniform3fv(skyLoc.uGround, atm.ground);
  gl.uniform3fv(skyLoc.uSunDir, atm.sunDir);
  gl.uniform3fv(skyLoc.uSunColor, atm.sunColor);
  gl.uniform1f(skyLoc.uNight, atm.night);
  gl.uniform1f(skyLoc.uGlow, atm.glow);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
  statTris += 1;

  gl.depthMask(true);
  gl.enable(gl.DEPTH_TEST);
}

function drawTerrain() {
  gl.useProgram(terProg);
  gl.uniformMatrix4fv(terLoc.uVP, false, vp);
  gl.uniform3f(terLoc.uCam, cam.x, cam.y, cam.z);
  gl.uniform3fv(terLoc.uSunDir, atm.sunDir);
  gl.uniform3fv(terLoc.uSunCol, atm.sunColor);
  gl.uniform3fv(terLoc.uMoonDir, atm.moonDir);
  gl.uniform3fv(terLoc.uMoonCol, atm.moonColor);
  gl.uniform3fv(terLoc.uAmbCol, atm.ambColor);
  gl.uniform3fv(terLoc.uFogCol, atm.fogColor);
  gl.uniform1f(terLoc.uFogD, FOG_D);

  gl.enableVertexAttribArray(terAPos);
  gl.enableVertexAttribArray(terANrm);

  chunks.forEach(function (ch) {
    gl.bindBuffer(gl.ARRAY_BUFFER, ch.vbo);
    gl.vertexAttribPointer(terAPos, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(terANrm, 3, gl.FLOAT, false, 24, 12);
    var li = lodIndex[ch.lod];
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, li.buf);
    gl.drawElements(gl.TRIANGLES, li.count, gl.UNSIGNED_SHORT, 0);
    statTris += li.tris;
  });

  gl.disableVertexAttribArray(terANrm);
}

function drawWater() {
  gl.useProgram(watProg);
  gl.uniformMatrix4fv(watLoc.uVP, false, vp);
  gl.uniform3f(watLoc.uCenter, cam.x, 0, cam.z);
  gl.uniform1f(watLoc.uSize, 3000.0);
  gl.uniform3f(watLoc.uCam, cam.x, cam.y, cam.z);
  gl.uniform3fv(watLoc.uSunDir, atm.sunDir);
  gl.uniform3fv(watLoc.uSunCol, atm.sunColor);
  gl.uniform3fv(watLoc.uZenith, atm.zenith);
  gl.uniform3fv(watLoc.uHorizon, atm.horizon);
  gl.uniform3fv(watLoc.uFogCol, atm.fogColor);
  gl.uniform3fv(watLoc.uAmbCol, atm.ambColor);
  gl.uniform1f(watLoc.uFogD, FOG_D);
  gl.uniform1f(watLoc.uTime, simTime);

  gl.bindBuffer(gl.ARRAY_BUFFER, waterBuf);
  gl.enableVertexAttribArray(watAPos);
  gl.vertexAttribPointer(watAPos, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  statTris += 2;
}

function render() {
  resize();
  var aspect = canvas.width / Math.max(1, canvas.height);
  mat4Perspective(proj, FOV, aspect, 1.0, 6000.0);

  var cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  var fx = -Math.sin(cam.yaw) * cp;
  var fy = sp;
  var fz = -Math.cos(cam.yaw) * cp;
  var rx = Math.cos(cam.yaw);
  var rz = -Math.sin(cam.yaw);
  var ux = 0 * fz - rz * fy;
  var uy = rz * fx - rx * fz;
  var uz = rx * fy - 0 * fx;

  mat4LookAt(view, cam.x, cam.y, cam.z,
             cam.x + fx, cam.y + fy, cam.z + fz,
             ux, uy, uz);
  mat4Mul(vp, proj, view);

  gl.clearColor(atm.fogColor[0], atm.fogColor[1], atm.fogColor[2], 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  statTris = 0;

  drawSky(cp, sp);
  drawTerrain();
  drawWater();
}

/* =========================================================================
   Main loop
   ========================================================================= */
var lastNow = 0;
var fpsAcc = 0, fpsFrames = 0, fpsValue = 0;

var timeEl = document.getElementById('time');
var timeOut = document.getElementById('timeOut');
var seedEl = document.getElementById('seed');
var autoOut = document.getElementById('autoOut');
var fpsOut = document.getElementById('fpsOut');
var chunkOut = document.getElementById('chunkOut');

function updateAutoUI() {
  if (autopilot) {
    autoOut.textContent = 'AUTO';
    autoOut.classList.add('on');
  } else {
    autoOut.textContent = 'MANUAL';
    autoOut.classList.remove('on');
  }
}

function fmtTime(h) {
  var hh = Math.floor(h) % 24;
  var mm = Math.floor((h - Math.floor(h)) * 60);
  var s = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
  return s;
}

var lastShownTime = -1;

function frame(now) {
  requestAnimationFrame(frame);

  if (!lastNow) lastNow = now;
  var dt = (now - lastNow) / 1000;
  lastNow = now;
  if (dt > 0.1) dt = 0.1;
  if (dt < 0) dt = 0;

  if (!frozen) {
    simTime += dt;
    timeOfDay += dt * 0.2;
    if (timeOfDay >= 24) timeOfDay -= 24;
  }

  if (autopilot && !frozen) updateAutopilot(dt);
  updateManual(dt);
  cameraClamp();

  updateAtmosphere();

  updateChunks(frozen ? 12 : 6);

  render();

  /* UI */
  fpsAcc += dt; fpsFrames++;
  if (fpsAcc > 0.4) {
    fpsValue = fpsFrames / fpsAcc;
    fpsAcc = 0; fpsFrames = 0;
    fpsOut.textContent = fpsValue.toFixed(0) + ' FPS';
    chunkOut.textContent = chunks.size + ' CHUNKS';
  }

  if (Math.abs(timeOfDay - lastShownTime) > 0.004) {
    lastShownTime = timeOfDay;
    timeEl.value = timeOfDay.toFixed(2);
    timeOut.textContent = fmtTime(timeOfDay);
  }
}

/* =========================================================================
   World / seed management
   ========================================================================= */
var currentSeed = 1337;

function clearChunks() {
  chunks.forEach(function (ch) { destroyChunk(ch); });
  chunks.clear();
}

function setWorldSeed(s) {
  currentSeed = s | 0;
  seedPerm(currentSeed);
  clearChunks();
  seedEl.value = String(currentSeed);
  updateChunks(Infinity);
}

function findStart() {
  var bestX = 0, bestZ = 0, bestScore = -1e9;
  var i, k;
  for (i = 0; i < 110; i++) {
    var a = i * 2.399963;
    var r = 320 + i * 95;
    var x = Math.cos(a) * r;
    var z = Math.sin(a) * r;
    var h = terrainHeight(x, z);
    if (h < 8 || h > 260) continue;
    var m = 0;
    for (k = 0; k < 8; k++) {
      var ang = k * 0.785;
      var hv = terrainHeight(x + Math.cos(ang) * 720, z + Math.sin(ang) * 720);
      if (hv > m) m = hv;
    }
    var score = m - Math.abs(h - 55) * 0.6;
    if (score > bestScore) { bestScore = score; bestX = x; bestZ = z; }
  }
  return { x: bestX, z: bestZ };
}

/* =========================================================================
   Public API
   ========================================================================= */
window.__arena = {
  freeze: function (on) {
    frozen = !!on;
  },
  setSeed: function (n) {
    n = Math.floor(Number(n));
    if (!isFinite(n)) n = 0;
    setWorldSeed(n);
    cameraClamp();
  },
  setTime: function (h) {
    h = Number(h);
    if (!isFinite(h)) h = 12;
    while (h < 0) h += 24;
    while (h >= 24) h -= 24;
    timeOfDay = h;
    lastShownTime = -1;
    timeEl.value = h.toFixed(2);
    timeOut.textContent = fmtTime(h);
    updateAtmosphere();
  },
  setCamera: function (c) {
    if (!c) return;
    if (typeof c.x === 'number' && isFinite(c.x)) cam.x = c.x;
    if (typeof c.y === 'number' && isFinite(c.y)) cam.y = c.y;
    if (typeof c.z === 'number' && isFinite(c.z)) cam.z = c.z;
    if (typeof c.yaw === 'number' && isFinite(c.yaw)) cam.yaw = c.yaw;
    if (typeof c.pitch === 'number' && isFinite(c.pitch)) cam.pitch = clamp(c.pitch, -1.45, 1.45);
    vel.x = 0; vel.y = 0; vel.z = 0;
    cameraClamp();
    updateChunks(Infinity);
  },
  getCamera: function () {
    return { x: cam.x, y: cam.y, z: cam.z, yaw: cam.yaw, pitch: cam.pitch };
  },
  terrainHeight: function (x, z) {
    return terrainHeight(x, z);
  },
  stats: function () {
    return { chunks: chunks.size, triangles: statTris };
  }
};

/* =========================================================================
   UI wiring
   ========================================================================= */
timeEl.addEventListener('input', function () {
  var v = Number(timeEl.value);
  if (!isFinite(v)) v = 12;
  while (v < 0) v += 24;
  while (v >= 24) v -= 24;
  timeOfDay = v;
  lastShownTime = -1;
  timeOut.textContent = fmtTime(v);
  updateAtmosphere();
}, false);

seedEl.addEventListener('change', function () {
  var n = Math.floor(Number(seedEl.value));
  if (!isFinite(n)) n = 0;
  setWorldSeed(n);
  cameraClamp();
}, false);

window.addEventListener('resize', function () { resize(); }, false);

/* =========================================================================
   Boot
   ========================================================================= */
seedPerm(currentSeed);
seedEl.value = String(currentSeed);
timeEl.value = timeOfDay.toFixed(2);
timeOut.textContent = fmtTime(timeOfDay);
updateAutoUI();

var start = findStart();
cam.x = start.x;
cam.z = start.z;
cam.y = Math.max(terrainHeight(cam.x, cam.z), 0) + 85;
cam.yaw = 0.7;
cam.pitch = -0.08;

updateAtmosphere();
updateChunks(Infinity);
cameraClamp();

gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
gl.disable(gl.CULL_FACE);
gl.disable(gl.BLEND);

requestAnimationFrame(frame);

})();
</script>
</body>
</html>
```
### Procedural Flyover Mechanics & Experience

A quick look at the controls, world streaming, and visual systems that make this flyover feel alive.

- **Endless terrain streaming:** The world is split into 256 m chunks that load and unload around the camera. Each chunk receives one of four LOD meshes based on distance, and skirt geometry hides seams between detail levels.
- **Flight model:** Autopilot flies forward and follows terrain contours using a smoothed height target. Press **F** to toggle between autopilot and manual control; manual mode supports **W/A/S/D** movement, **Q/E** for altitude, and mouse-drag look. The camera is clamped above both terrain and sea level.
- **Environmental transitions:** The day/night cycle advances automatically (full day in about two minutes) and drives sun position, sky gradients, fog color, and ambient lighting. A **time slider** provides manual control, while **seed input** regenerates the entire heightfield deterministically.
- **Visual atmosphere:** The shader system blends height and slope-based terrain coloring, animated water with Fresnel sky reflection, procedural stars and a moon at night, and a vignette overlay for a cinematic feel.
---

**Optimization Tip:** You can adjust the `terrainHeight` function in the script to customize terrain roughness, or change `dt * 0.2` inside `frame` to speed up or slow down the day/night cycle.