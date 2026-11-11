

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{overflow:hidden;background:#000}
#c{display:block;width:100vw;height:100vh}
#ui{position:fixed;top:10px;left:10px;color:#fff;font-family:monospace;font-size:13px;z-index:10;user-select:none}
#ui>div{margin-bottom:6px;background:rgba(0,0,0,.6);padding:8px 12px;border-radius:6px;display:flex;align-items:center;gap:8px}
#fps{position:fixed;top:10px;right:10px;color:#0f0;font-family:monospace;font-size:13px;background:rgba(0,0,0,.6);padding:8px 12px;border-radius:6px}
#ap{position:fixed;bottom:10px;left:10px;color:#fff;font-family:monospace;font-size:13px;background:rgba(0,0,0,.6);padding:8px 12px;border-radius:6px}
input[type=range]{width:180px;accent-color:#4a9}
input[type=number]{width:80px;background:#222;color:#fff;border:1px solid #444;border-radius:3px;padding:2px 6px}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="ui">
<div><label>Time</label><input type="range" id="time" min="0" max="24" step="0.01" value="12"></div>
<div><label>Seed</label><input type="number" id="seed" value="42"></div>
</div>
<div id="fps">-- FPS</div>
<div id="ap">Autopilot: ON</div>
<script>
(function(){
"use strict";

// === CONFIGURATION ===
const CHUNK_SIZE = 256;
const LOD_LEVELS = [
    {res:64, minD:0, maxD:300},
    {res:32, minD:300, maxD:800},
    {res:16, minD:800, maxD:1500},
    {res:8, minD:1500, maxD:2500}
];
const MAX_CHUNKS = 250;
const FOG_DENSITY = 0.0004;

// === STATE ===
let seed = 42;
let timeOfDay = 12;
let frozen = false;
let autopilot = true;
let waterTime = 0;
let cam = {x:0, y:100, z:0, yaw:0, pitch:-0.15};
let camVel = {x:0, y:0, z:0};
let keys = {};
let mouseDown = false;
let lastMX = 0, lastMY = 0;
let lastTime = 0;
let fpsCount = 0, fpsTime = 0, fpsDisplay = 0;
let lastTriCount = 0;
let lastChunkCount = 0;

// === NOISE ===
function hash2d(ix, iz, s) {
    let n = Math.imul(ix, 15731) + Math.imul(iz, 7817) + Math.imul(s, 104729);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n = n ^ (n >>> 16);
    return (n & 0x7fffffff) / 0x7fffffff * 2 - 1;
}

function smooth(t) { return t * t * (3 - 2 * t); }

function vnoise(x, y, s) {
    const ix = Math.floor(x), iz = Math.floor(y);
    const fx = x - ix, fz = y - iz;
    const sx = smooth(fx), sz = smooth(fz);
    const n00 = hash2d(ix, iz, s);
    const n10 = hash2d(ix+1, iz, s);
    const n01 = hash2d(ix, iz+1, s);
    const n11 = hash2d(ix+1, iz+1, s);
    return (n00*(1-sx)+n10*sx)*(1-sz)+(n01*(1-sx)+n11*sx)*sz;
}

function fbm(x, y, s, oct) {
    let v=0, a=1, f=1, m=0;
    for(let i=0;i<oct;i++){v+=vnoise(x*f,y*f,s+i*1000)*a;m+=a;a*=0.5;f*=2.0;}
    return v/m;
}

function ridged(x, y, s, oct) {
    let v=0, a=1, f=1, m=0;
    for(let i=0;i<oct;i++){v+=(1-Math.abs(vnoise(x*f,y*f,s+i*1000)))*a;m+=a;a*=0.5;f*=2.0;}
    return v/m;
}

// === TERRAIN HEIGHT ===
function getTerrainHeight(x, z) {
    const s = seed;
    const wx = fbm(x*0.001+5.2, z*0.001+1.3, s, 3)*2.5;
    const wz = fbm(x*0.001+1.7, z*0.001+9.2, s+500, 3)*2.5;
    const px = x*0.0012+wx, pz = z*0.0012+wz;
    const base = fbm(px, pz, s+1000, 5);
    const m = ridged(px*0.7, pz*0.7, s+3000, 4);
    const mask = Math.max(0, base*1.2+0.2);
    let h = base*100 + m*m*280*mask;
    if(h < 0) h = h*0.4 - 15;
    if(h > 400) h = 400;
    if(h < -50) h = -50;
    return h;
}

// === CHUNK MANAGEMENT ===
const chunkCache = new Map();

function chunkKey(cx, cz, lod) { return cx+','+cz+','+lod; }

function generateChunk(cx, cz, lod) {
    const res = LOD_LEVELS[lod].res;
    const step = CHUNK_SIZE / res;
    const ox = cx * CHUNK_SIZE;
    const oz = cz * CHUNK_SIZE;
    const n = res + 1;
    const positions = new Float32Array(n*n*3);
    const normals = new Float32Array(n*n*3);
    const heights = new Float32Array(n*n);

    for(let j=0;j<n;j++){
        for(let i=0;i<n;i++){
            const x = ox + i*step;
            const z = oz + j*step;
            const h = getTerrainHeight(x, z);
            const idx = j*n+i;
            positions[idx*3]=x; positions[idx*3+1]=h; positions[idx*3+2]=z;
            heights[idx]=h;
        }
    }

    for(let j=0;j<n;j++){
        for(let i=0;i<n;i++){
            const idx = j*n+i;
            const j0 = Math.max(0,j-1), j1 = Math.min(n-1,j+1);
            const i0 = Math.max(0,i-1), i1 = Math.min(n-1,i+1);
            const dx = (i1===i0) ? 0 : (heights[j*n+i1]-heights[j*n+i0])/(step*(i1-i0));
            const dz = (j1===j0) ? 0 : (heights[j1*n+i]-heights[j0*n+i])/(step*(j1-j0));
            let nx = -dx, ny = 1, nz = -dz;
            const len = Math.sqrt(nx*nx+ny*ny+nz*nz);
            normals[idx*3]=nx/len; normals[idx*3+1]=ny/len; normals[idx*3+2]=nz/len;
        }
    }

    const indices = new Uint16Array(res*res*6);
    let ii = 0;
    for(let j=0;j<res;j++){
        for(let i=0;i<res;i++){
            const a=j*n+i, b=a+1, c=a+n, d=c+1;
            indices[ii++]=a; indices[ii++]=b; indices[ii++]=c;
            indices[ii++]=b; indices[ii++]=d; indices[ii++]=c;
        }
    }

    return {positions, normals, indices, res, triCount: res*res*2};
}

function createChunkGL(data) {
    const obj = {gl: {}};
    obj.gl.vboPos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.gl.vboPos);
    gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.STATIC_DRAW);
    obj.gl.vboNrm = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.gl.vboNrm);
    gl.bufferData(gl.ARRAY_BUFFER, data.normals, gl.STATIC_DRAW);
    obj.gl.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.gl.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, gl.STATIC_DRAW);
    obj.triCount = data.triCount;
    return obj;
}

function deleteChunkGL(obj) {
    if(obj.gl.vboPos) gl.deleteBuffer(obj.gl.vboPos);
    if(obj.gl.vboNrm) gl.deleteBuffer(obj.gl.vboNrm);
    if(obj.gl.ibo) gl.deleteBuffer(obj.gl.ibo);
}

let chunksToGenerate = [];

function updateChunks() {
    const cx0 = Math.floor(cam.x / CHUNK_SIZE);
    const cz0 = Math.floor(cam.z / CHUNK_SIZE);
    const needed = [];

    for(let lod=0; lod<LOD_LEVELS.length; lod++){
        const maxD = LOD_LEVELS[lod].maxD;
        const range = Math.ceil(maxD / CHUNK_SIZE) + 1;
        for(let dz=-range; dz<=range; dz++){
            for(let dx=-range; dx<=range; dx++){
                const cx = cx0+dx, cz = cz0+dz;
                const cxc = cx*CHUNK_SIZE + CHUNK_SIZE/2;
                const czc = cz*CHUNK_SIZE + CHUNK_SIZE/2;
                const dist = Math.sqrt((cxc-cam.x)**2 + (czc-cam.z)**2);
                if(dist >= LOD_LEVELS[lod].minD && dist <= LOD_LEVELS[lod].maxD){
                    needed.push({cx, cz, lod, dist});
                }
            }
        }
    }

    needed.sort((a,b)=>a.dist-b.dist);
    const toKeep = new Set(needed.slice(0, MAX_CHUNKS).map(c=>chunkKey(c.cx,c.cz,c.lod)));

    for(let i=0; i<Math.min(needed.length, MAX_CHUNKS); i++){
        const c = needed[i];
        const key = chunkKey(c.cx, c.cz, c.lod);
        if(!chunkCache.has(key)){
            chunksToGenerate.push(c);
        }
    }

    for(const key of chunkCache.keys()){
        if(!toKeep.has(key)){
            deleteChunkGL(chunkCache.get(key));
            chunkCache.delete(key);
        }
    }

    // Generate up to 3 chunks per frame
    let generated = 0;
    while(chunksToGenerate.length > 0 && generated < 3){
        const c = chunksToGenerate.shift();
        const key = chunkKey(c.cx, c.cz, c.lod);
        if(!chunkCache.has(key)){
            const data = generateChunk(c.cx, c.cz, c.lod);
            chunkCache.set(key, createChunkGL(data));
            generated++;
        }
    }
}

// === WEBGL SETUP ===
const canvas = document.getElementById('c');
const gl = canvas.getContext('webgl', {antialias: true});
if(!gl) document.body.innerHTML = 'WebGL not supported';

function resize(){
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 1280 * dpr;
    canvas.height = 800 * dpr;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

function compileShader(type, src){
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
        console.error(gl.getShaderInfoLog(s));
    }
    return s;
}

function createProgram(vs, fs){
    const p = gl.createProgram();
    gl.attachShader(p, compileShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compileShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if(!gl.getProgramParameter(p, gl.LINK_STATUS)){
        console.error(gl.getProgramInfoLog(p));
    }
    return p;
}

// Terrain shader
const terrainVS = `
attribute vec3 aPos;
attribute vec3 aNormal;
attribute float aHeight;
uniform mat4 uMVP;
uniform vec3 uCamPos;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vHeight;
varying float vFog;
void main(){
    vWorldPos = aPos;
    vNormal = aNormal;
    vHeight = aHeight;
    float d = length(aPos - uCamPos);
    vFog = 1.0 - exp(-${FOG_DENSITY} * d * d);
    gl_Position = uMVP * vec4(aPos, 1.0);
}`;

const terrainFS = `
precision mediump float;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vHeight;
varying float vFog;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform vec3 uAmbient;
uniform vec3 uFogColor;
void main(){
    float slope = 1.0 - vNormal.y;
    vec3 color;
    if(vHeight < 0.5){
        color = vec3(0.76, 0.72, 0.5);
    } else if(vHeight < 3.0){
        color = vec3(0.76, 0.72, 0.5);
        float t = smoothstep(0.5, 3.0, vHeight);
        color = mix(color, vec3(0.22, 0.55, 0.18), t);
    } else if(vHeight > 280.0){
        color = vec3(0.95, 0.96, 0.98);
    } else if(vHeight > 180.0){
        float t = (vHeight - 180.0) / 100.0;
        color = mix(vec3(0.45, 0.42, 0.38), vec3(0.95, 0.96, 0.98), t);
    } else {
        color = vec3(0.22, 0.55, 0.18);
    }
    if(slope > 0.3 && vHeight > 2.0 && vHeight < 280.0){
        float rf = smoothstep(0.3, 0.55, slope);
        color = mix(color, vec3(0.5, 0.46, 0.42), rf);
    }
    float diff = max(dot(vNormal, uSunDir), 0.0);
    vec3 light = uAmbient + uSunColor * diff * uSunIntensity;
    vec3 fc = color * light;
    fc = mix(fc, uFogColor, vFog);
    gl_FragColor = vec4(fc, 1.0);
}`;

const terrainProg = createProgram(terrainVS, terrainFS);
const tLoc = {
    aPos: gl.getAttribLocation(terrainProg, 'aPos'),
    aNormal: gl.getAttribLocation(terrainProg, 'aNormal'),
    aHeight: gl.getAttribLocation(terrainProg, 'aHeight'),
    uMVP: gl.getUniformLocation(terrainProg, 'uMVP'),
    uCamPos: gl.getUniformLocation(terrainProg, 'uCamPos'),
    uSunDir: gl.getUniformLocation(terrainProg, 'uSunDir'),
    uSunColor: gl.getUniformLocation(terrainProg, 'uSunColor'),
    uSunIntensity: gl.getUniformLocation(terrainProg, 'uSunIntensity'),
    uAmbient: gl.getUniformLocation(terrainProg, 'uAmbient'),
    uFogColor: gl.getUniformLocation(terrainProg, 'uFogColor')
};

// Water shader
const waterVS = `
attribute vec3 aPos;
uniform mat4 uMVP;
uniform float uTime;
uniform vec3 uCamPos;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vFog;
void main(){
    vec3 p = aPos;
    float t = uTime;
    p.y += sin(p.x*0.05+t)*0.3 + sin(p.z*0.08+t*1.3)*0.2 + sin((p.x+p.z)*0.03+t*0.7)*0.4;
    float dx = cos(p.x*0.05+t)*0.015 + cos((p.x+p.z)*0.03+t*0.7)*0.012;
    float dz = cos(p.z*0.08+t*1.3)*0.016 + cos((p.x+p.z)*0.03+t*0.7)*0.012;
    vNormal = normalize(vec3(-dx, 1.0, -dz));
    vWorldPos = p;
    float d = length(p - uCamPos);
    vFog = 1.0 - exp(-${FOG_DENSITY} * d * d);
    gl_Position = uMVP * vec4(p, 1.0);
}`;

const waterFS = `
precision mediump float;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vFog;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform vec3 uSkyColor;
uniform vec3 uFogColor;
uniform vec3 uCamPos;
void main(){
    vec3 vd = normalize(uCamPos - vWorldPos);
    float fres = pow(1.0 - max(dot(vd, vNormal), 0.0), 5.0);
    vec3 wc = vec3(0.02, 0.12, 0.28);
    vec3 c = mix(wc, uSkyColor, fres * 0.7);
    vec3 rf = reflect(-uSunDir, vNormal);
    float spec = pow(max(dot(vd, rf), 0.0), 64.0);
    c += uSunColor * spec * uSunIntensity * 0.6;
    c = mix(c, uFogColor, vFog);
    gl_FragColor = vec4(c, 0.85);
}`;

const waterProg = createProgram(waterVS, waterFS);
const wLoc = {
    aPos: gl.getAttribLocation(waterProg, 'aPos'),
    uMVP: gl.getUniformLocation(waterProg, 'uMVP'),
    uTime: gl.getUniformLocation(waterProg, 'uTime'),
    uCamPos: gl.getUniformLocation(waterProg, 'uCamPos'),
    uSunDir: gl.getUniformLocation(waterProg, 'uSunDir'),
    uSunColor: gl.getUniformLocation(waterProg, 'uSunColor'),
    uSunIntensity: gl.getUniformLocation(waterProg, 'uSunIntensity'),
    uSkyColor: gl.getUniformLocation(waterProg, 'uSkyColor'),
    uFogColor: gl.getUniformLocation(waterProg, 'uFogColor')
};

// Sky shader
const skyVS = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){
    vUv = aPos;
    gl_Position = vec4(aPos, 0.9999, 1.0);
}`;

const skyFS = `
precision mediump float;
varying vec2 vUv;
uniform mat4 uInvVP;
uniform vec3 uSunDir;
uniform float uSunIntensity;
uniform vec3 uSkyTop;
uniform vec3 uSkyBot;
uniform float uNight;
void main(){
    vec4 r = uInvVP * vec4(vUv, 0.9999, 1.0);
    vec3 dir = normalize(r.xyz / r.w);
    float t = max(dir.y, 0.0);
    t = pow(t, 0.45);
    vec3 sky = mix(uSkyBot, uSkyTop, t);
    float sd = max(dot(dir, uSunDir), 0.0);
    sky += vec3(1.0, 0.95, 0.6) * pow(sd, 512.0) * 8.0;
    sky += vec3(1.0, 0.6, 0.2) * pow(sd, 32.0) * 0.4 * uSunIntensity;
    sky += vec3(1.0, 0.8, 0.4) * pow(sd, 8.0) * 0.15 * uSunIntensity;
    if(uNight > 0.1){
        vec3 sp = dir * 150.0;
        vec3 g = floor(sp);
        float h = fract(sin(dot(g, vec3(12.9898,78.233,45.164)))*43758.5453);
        if(h > 0.985){
            float star = (h - 0.985) / 0.015 * uNight;
            sky += vec3(star * 0.8, star * 0.85, star);
        }
        vec3 md = normalize(vec3(-uSunDir.x, abs(uSunDir.y)*0.5+0.3, -uSunDir.z));
        float mdot = max(dot(dir, md), 0.0);
        sky += vec3(0.8, 0.85, 0.9) * pow(mdot, 256.0) * 3.0 * uNight;
    }
    gl_FragColor = vec4(sky, 1.0);
}`;

const skyProg = createProgram(skyVS, skyFS);
const sLoc = {
    aPos: gl.getAttribLocation(skyProg, 'aPos'),
    uInvVP: gl.getUniformLocation(skyProg, 'uInvVP'),
    uSunDir: gl.getUniformLocation(skyProg, 'uSunDir'),
    uSunIntensity: gl.getUniformLocation(skyProg, 'uSunIntensity'),
    uSkyTop: gl.getUniformLocation(skyProg, 'uSkyTop'),
    uSkyBot: gl.getUniformLocation(skyProg, 'uSkyBot'),
    uNight: gl.getUniformLocation(skyProg, 'uNight')
};

// Sky quad buffer
const skyBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

// Water buffer
const waterSize = 4000;
const waterRes = 128;
const waterVerts = new Float32Array((waterRes+1)*(waterRes+1)*3);
let wi = 0;
for(let j=0;j<=waterRes;j++){
    for(let i=0;i<=waterRes;i++){
        waterVerts[wi++] = -waterSize/2 + i*(waterSize/waterRes);
        waterVerts[wi++] = 0;
        waterVerts[wi++] = -waterSize/2 + j*(waterSize/waterRes);
    }
}
const waterIndices = new Uint16Array(waterRes*waterRes*6);
wi = 0;
for(let j=0;j<waterRes;j++){
    for(let i=0;i<waterRes;i++){
        const a=j*(waterRes+1)+i, b=a+1, c=a+(waterRes+1), d=c+1;
        waterIndices[wi++]=a; waterIndices[wi++]=b; waterIndices[wi++]=c;
        waterIndices[wi++]=b; waterIndices[wi++]=d; waterIndices[wi++]=c;
    }
}
const waterVBO = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, waterVBO);
gl.bufferData(gl.ARRAY_BUFFER, waterVerts, gl.DYNAMIC_DRAW);
const waterIBO = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, waterIBO);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, waterIndices, gl.STATIC_DRAW);

// === MATRIX MATH ===
function mat4Perspective(fov, aspect, near, far){
    const f = 1/Math.tan(fov/2);
    return new Float32Array([
        f/aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far+near)/(near-far), -1,
        0, 0, 2*far*near/(near-far), 0
    ]);
}

function mat4LookAt(eye, target, up){
    let fx=target[0]-eye[0], fy=target[1]-eye[1], fz=target[2]-eye[2];
    let fl=Math.sqrt(fx*fx+fy*fy+fz*fz);
    fx/=fl; fy/=fl; fz/=fl;
    let sx=up[1]*fz-up[2]*fy, sy=up[2]*fx-up[0]*fz, sz=up[0]*fy-up[1]*fx;
    let sl=Math.sqrt(sx*sx+sy*sy+sz*sz);
    if(sl < 0.001){sx=1;sy=0;sz=0;}else{sx/=sl;sy/=sl;sz/=sl;}
    let ux=sy*fz-sz*fy, uy=sz*fx-sx*fz, uz=sx*fy-sy*fx;
    return new Float32Array([
        sx, ux, -fx, 0,
        sy, uy, -fy, 0,
        sz, uz, -fz, 0,
        -(sx*eye[0]+sy*eye[1]+sz*eye[2]),
        -(ux*eye[0]+uy*eye[1]+uz*eye[2]),
        fx*eye[0]+fy*eye[1]+fz*eye[2],
        1
    ]);
}

function mat4Mul(a, b){
    const r = new Float32Array(16);
    for(let c=0;c<4;c++){
        for(let rr=0;rr<4;rr++){
            let s=0;
            for(let k=0;k<4;k++){
                s += a[k*4+rr]*b[c*4+k];
            }
            r[c*4+rr]=s;
        }
    }
    return r;
}

function mat4Inverse(m){
    const inv = new Float32Array(16);
    inv[0] = m[5]*m[10]*m[15]-m[5]*m[11]*m[14]-m[9]*m[6]*m[15]+m[9]*m[7]*m[14]+m[13]*m[6]*m[11]-m[13]*m[7]*m[10];
    inv[4] = -m[4]*m[10]*m[15]+m[4]*m[11]*m[14]+m[8]*m[6]*m[15]-m[8]*m[7]*m[14]-m[12]*m[6]*m[11]+m[12]*m[7]*m[10];
    inv[8] = m[4]*m[9]*m[15]-m[4]*m[11]*m[13]-m[8]*m[5]*m[15]+m[8]*m[7]*m[13]+m[12]*m[5]*m[11]-m[12]*m[7]*m[9];
    inv[12] = -m[4]*m[9]*m[14]+m[4]*m[10]*m[13]+m[8]*m[5]*m[14]-m[8]*m[6]*m[13]-m[12]*m[5]*m[10]+m[12]*m[6]*m[9];
    inv[1] = -m[1]*m[10]*m[15]+m[1]*m[11]*m[14]+m[9]*m[2]*m[15]-m[9]*m[3]*m[14]-m[13]*m[2]*m[11]+m[13]*m[3]*m[10];
    inv[5] = m[0]*m[10]*m[15]-m[0]*m[11]*m[14]-m[8]*m[2]*m[15]+m[8]*m[3]*m[14]+m[12]*m[2]*m[11]-m[12]*m[3]*m[10];
    inv[9] = -m[0]*m[9]*m[15]+m[0]*m[11]*m[13]+m[8]*m[1]*m[15]-m[8]*m[3]*m[13]-m[12]*m[1]*m[11]+m[12]*m[3]*m[9];
    inv[13] = m[0]*m[9]*m[14]-m[0]*m[10]*m[13]-m[8]*m[1]*m[14]+m[8]*m[2]*m[13]+m[12]*m[1]*m[10]-m[12]*m[2]*m[9];
    inv[2] = m[1]*m[6]*m[15]-m[1]*m[7]*m[14]-m[5]*m[2]*m[15]+m[5]*m[3]*m[14]+m[13]*m[2]*m[7]-m[13]*m[3]*m[6];
    inv[6] = -m[0]*m[6]*m[15]+m[0]*m[7]*m[14]+m[4]*m[2]*m[15]-m[4]*m[3]*m[14]-m[12]*m[2]*m[7]+m[12]*m[3]*m[6];
    inv[10] = m[0]*m[5]*m[15]-m[0]*m[7]*m[13]-m[4]*m[1]*m[15]+m[4]*m[3]*m[13]+m[12]*m[1]*m[7]-m[12]*m[3]*m[5];
    inv[14] = -m[0]*m[5]*m[14]+m[0]*m[6]*m[13]+m[4]*m[1]*m[14]-m[4]*m[2]*m[13]-m[12]*m[1]*m[6]+m[12]*m[2]*m[5];
    inv[3] = -m[1]*m[6]*m[11]+m[1]*m[7]*m[10]+m[5]*m[2]*m[11]-m[5]*m[3]*m[10]-m[9]*m[2]*m[7]+m[9]*m[3]*m[6];
    inv[7] = m[0]*m[6]*m[11]-m[0]*m[7]*m[10]-m[4]*m[2]*m[11]+m[4]*m[3]*m[10]+m[8]*m[2]*m[7]-m[8]*m[3]*m[6];
    inv[11] = -m[0]*m[5]*m[11]+m[0]*m[7]*m[9]+m[4]*m[1]*m[11]-m[4]*m[3]*m[9]-m[8]*m[1]*m[7]+m[8]*m[3]*m[5];
    inv[15] = m[0]*m[5]*m[10]-m[0]*m[6]*m[9]-m[4]*m[1]*m[10]+m[4]*m[2]*m[9]+m[8]*m[1]*m[6]-m[8]*m[2]*m[5];
    const det = m[0]*inv[0]+m[1]*inv[4]+m[2]*inv[8]+m[3]*inv[12];
    if(Math.abs(det) < 1e-10) return inv;
    const id = 1/det;
    for(let i=0;i<16;i++) inv[i]*=id;
    return inv;
}

// === CAMERA ===
function getCamDir(){
    return [
        Math.sin(cam.yaw)*Math.cos(cam.pitch),
        Math.sin(cam.pitch),
        -Math.cos(cam.yaw)*Math.cos(cam.pitch)
    ];
}

function clampCamera(){
    const th = getTerrainHeight(cam.x, cam.z);
    const minY = Math.max(th + 3, 2);
    if(cam.y < minY) cam.y = minY;
}

function updateCamera(dt){
    if(autopilot && !frozen){
        const speed = 40;
        const dir = getCamDir();
        cam.x += dir[0]*speed*dt;
        cam.z += dir[2]*speed*dt;
        // Follow terrain
        const th = getTerrainHeight(cam.x, cam.z);
        const targetY = Math.max(th + 50, 30);
        cam.y += (targetY - cam.y) * 2.0 * dt;
        // Slowly adjust pitch to look slightly forward-down
        const targetPitch = -0.1;
        cam.pitch += (targetPitch - cam.pitch) * 1.0 * dt;
        // Slowly rotate
        cam.yaw += 0.02 * dt;
    } else if(!frozen || true) {
        // Manual input (works even when frozen)
        const speed = 50;
        const dir = getCamDir();
        const right = [Math.cos(cam.yaw), 0, Math.sin(cam.yaw)];
        let ax=0, ay=0, az=0;
        if(keys['KeyW']||keys['ArrowUp']){ax+=dir[0];ay+=dir[1];az+=dir[2];}
        if(keys['KeyS']||keys['ArrowDown']){ax-=dir[0];ay-=dir[1];az-=dir[2];}
        if(keys['KeyA']||keys['ArrowLeft']){ax-=right[0];az-=right[2];}
        if(keys['KeyD']||keys['ArrowRight']){ax+=right[0];az+=right[2];}
        if(keys['KeyQ']||keys['ShiftLeft']||keys['ShiftRight']){ay-=1;}
        if(keys['KeyE']||keys['Space']){ay+=1;}
        const len = Math.sqrt(ax*ax+ay*ay+az*az);
        if(len>0){ax/=len;ay/=len;az/=len;}
        const accel = 5;
        camVel.x += (ax*speed - camVel.x)*accel*dt;
        camVel.y += (ay*speed - camVel.y)*accel*dt;
        camVel.z += (az*speed - camVel.z)*accel*dt;
        cam.x += camVel.x*dt;
        cam.y += camVel.y*dt;
        cam.z += camVel.z*dt;
    }
    clampCamera();
}

// === DAY/NIGHT ===
function getDayNight(){
    const angle = (timeOfDay/24)*Math.PI*2 - Math.PI/2;
    const sunElev = Math.sin(angle);
    const sunAz = Math.cos(angle);
    const sunDir = [sunAz*0.7, sunElev, -sunAz*0.7];
    const sl = Math.sqrt(sunDir[0]**2+sunDir[1]**2+sunDir[2]**2);
    sunDir[0]/=sl; sunDir[1]/=sl; sunDir[2]/=sl;

    const dayF = Math.max(0, Math.min(1, (sunElev+0.1)/0.3));
    const nightF = 1-dayF;
    const sunsetF = Math.max(0, 1-Math.abs(sunElev)*3);

    // Sun color
    let sunR = 1.0, sunG = 0.95, sunB = 0.8;
    if(sunsetF > 0.5){
        const t = (sunsetF-0.5)*2;
        sunR = 1.0; sunG = 1.0-t*0.5; sunB = 1.0-t*0.7;
    }
    const sunIntensity = dayF * 1.2;

    // Ambient
    const ambR = 0.1+dayF*0.25, ambG = 0.1+dayF*0.25, ambB = 0.15+dayF*0.2;

    // Sky colors
    const skyTopR = 0.05+dayF*0.2, skyTopG = 0.05+dayF*0.35, skyTopB = 0.15+dayF*0.75;
    let skyBotR = 0.05+dayF*0.7, skyBotG = 0.05+dayF*0.75, skyBotB = 0.1+dayF*0.9;
    if(sunsetF > 0.3 && sunElev > -0.1){
        const t = sunsetF;
        skyBotR = skyBotR*(1-t)+1.0*t;
        skyBotG = skyBotG*(1-t)+0.5*t;
        skyBotB = skyBotB*(1-t)+0.2*t;
    }

    const fogR = skyBotR, fogG = skyBotG, fogB = skyBotB;

    return {
        sunDir, sunIntensity,
        sunColor: [sunR, sunG, sunB],
        ambient: [ambR, ambG, ambB],
        skyTop: [skyTopR, skyTopG, skyTopB],
        skyBot: [skyBotR, skyBotG, skyBotB],
        fogColor: [fogR, fogG, fogB],
        nightF
    };
}

// === RENDER ===
function render(){
    const dn = getDayNight();
    const aspect = canvas.width / canvas.height;
    const proj = mat4Perspective(1.2, aspect, 0.1, 3000);
    const dir = getCamDir();
    const eye = [cam.x, cam.y, cam.z];
    const target = [cam.x+dir[0], cam.y+dir[1], cam.z+dir[2]];
    const up = [0, 1, 0];
    const view = mat4LookAt(eye, target, up);
    const vp = mat4Mul(proj, view);
    const invVP = mat4Inverse(vp);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Draw sky
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.useProgram(skyProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf);
    gl.enableVertexAttribArray(sLoc.aPos);
    gl.vertexAttribPointer(sLoc.aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(sLoc.uInvVP, false, invVP);
    gl.uniform3fv(sLoc.uSunDir, dn.sunDir);
    gl.uniform1f(sLoc.uSunIntensity, dn.sunIntensity);
    gl.uniform3fv(sLoc.uSkyTop, dn.skyTop);
    gl.uniform3fv(sLoc.uSkyBot, dn.skyBot);
    gl.uniform1f(sLoc.uNight, dn.nightF);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);

    // Draw terrain
    gl.useProgram(terrainProg);
    gl.uniformMatrix4fv(tLoc.uMVP, false, vp);
    gl.uniform3fv(tLoc.uCamPos, eye);
    gl.uniform3fv(tLoc.uSunDir, dn.sunDir);
    gl.uniform3fv(tLoc.uSunColor, dn.sunColor);
    gl.uniform1f(tLoc.uSunIntensity, dn.sunIntensity);
    gl.uniform3fv(tLoc.uAmbient, dn.ambient);
    gl.uniform3fv(tLoc.uFogColor, dn.fogColor);

    let triCount = 0;
    let chunkCount = 0;

    for(const [key, obj] of chunkCache){
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.gl.vboPos);
        gl.enableVertexAttribArray(tLoc.aPos);
        gl.vertexAttribPointer(tLoc.aPos, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.gl.vboNrm);
        gl.enableVertexAttribArray(tLoc.aNormal);
        gl.vertexAttribPointer(tLoc.aNormal, 3, gl.FLOAT, false, 0, 0);
        // Height: use the same buffer, offset by 2 floats (y component)
        // Actually we stored height in positions y, so we need a separate attribute
        // Let me use the position buffer's y component via a trick
        // Better: we'll just use a separate buffer for heights
        // For now, let's skip the height attribute and use position y in the shader
        // Actually, let me fix this - I'll pass height as the y component of position
        // No wait, I need a separate attribute. Let me create a height buffer.
        
        // Actually, I realize I should store height separately. Let me use a workaround:
        // The height is the y component of the position, so I can compute it in the vertex shader
        // Let me modify the shader to use position.y as height
        // For now, I'll just use a separate buffer
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.gl.ibo);
        gl.drawElements(gl.TRIANGLES, obj.triCount, gl.UNSIGNED_SHORT, 0);
        triCount += obj.triCount;
        chunkCount++;
    }

    lastTriCount = triCount;
    lastChunkCount = chunkCount;

    // Draw water
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.useProgram(waterProg);
    gl.uniformMatrix4fv(wLoc.uMVP, false, vp);
    gl.uniform1f(wLoc.uTime, waterTime);
    gl.uniform3fv(wLoc.uCamPos, eye);
    gl.uniform3fv(wLoc.uSunDir, dn.sunDir);
    gl.uniform3fv(wLoc.uSunColor, dn.sunColor);
    gl.uniform1f(wLoc.uSunIntensity, dn.sunIntensity);
    gl.uniform3fv(wLoc.uSkyColor, dn.skyBot);
    gl.uniform3fv(wLoc.uFogColor, dn.fogColor);
    gl.bindBuffer(gl.ARRAY_BUFFER, waterVBO);
    // Update water position to center on camera
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, waterVerts);
    gl.enableVertexAttribArray(wLoc.aPos);
    gl.vertexAttribPointer(wLoc.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, waterIBO);
    gl.drawElements(gl.TRIANGLES, waterRes*waterRes*2, gl.UNSIGNED_SHORT, 0);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
}

// Update water vertices to center on camera
function updateWaterVerts(){
    let wi = 0;
    const ox = Math.floor(cam.x/10)*10 - waterSize/2;
    const oz = Math.floor(cam.z/10)*10 - waterSize/2;
    for(let j=0;j<=waterRes;j++){
        for(let i=0;i<=waterRes;i++){
            waterVerts[wi++] = ox + i*(waterSize/waterRes);
            waterVerts[wi++] = 0;
            waterVerts[wi++] = oz + j*(waterSize/waterRes);
        }
    }
}

// === MAIN LOOP ===
function frame(t){
    requestAnimationFrame(frame);
    const dt = Math.min((t - lastTime)/1000, 0.05);
    lastTime = t;

    // FPS
    fpsCount++;
    fpsTime += dt;
    if(fpsTime >= 0.5){
        fpsDisplay = Math.round(fpsCount/fpsTime);
        document.getElementById('fps').textContent = fpsDisplay + ' FPS';
        fpsCount = 0; fpsTime = 0;
    }

    // Update time
    if(!frozen){
        timeOfDay += dt * (24/120); // Full day in 120 seconds
        if(timeOfDay > 24) timeOfDay -= 24;
        document.getElementById('time').value = timeOfDay;
    }

    // Update water time
    if(!frozen){
        waterTime += dt;
    }

    // Update camera
    updateCamera(dt);

    // Update chunks
    updateChunks();

    // Update water vertices
    updateWaterVerts();

    // Render
    render();
}

// === INPUT ===
document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if(e.code === 'KeyF'){
        autopilot = !autopilot;
        document.getElementById('ap').textContent = 'Autopilot: ' + (autopilot ? 'ON' : 'OFF');
    }
    e.preventDefault();
});
document.addEventListener('keyup', e => {
    keys[e.code] = false;
});
document.addEventListener('mousedown', e => {
    mouseDown = true;
    lastMX = e.clientX;
    lastMY = e.clientY;
});
document.addEventListener('mouseup', () => { mouseDown = false; });
document.addEventListener('mousemove', e => {
    if(mouseDown){
        const dx = e.clientX - lastMX;
        const dy = e.clientY - lastMY;
        cam.yaw -= dx * 0.003;
        cam.pitch += dy * 0.003;
        cam.pitch = Math.max(-1.5, Math.min(1.5, cam.pitch));
        lastMX = e.clientX;
        lastMY = e.clientY;
    }
});

// UI events
document.getElementById('time').addEventListener('input', e => {
    timeOfDay = parseFloat(e.target.value);
});
document.getElementById('seed').addEventListener('change', e => {
    const v = parseInt(e.target.value);
    if(!isNaN(v)) setSeed(v);
});

// === GRADER API ===
function setSeed(n){
    seed = n;
    document.getElementById('seed').value = n;
    // Clear all chunks
    for(const [key, obj] of chunkCache){
        deleteChunkGL(obj);
    }
    chunkCache.clear();
    chunksToGenerate = [];
}

function setTime(h){
    timeOfDay = Math.max(0, Math.min(24, h));
    document.getElementById('time').value = timeOfDay;
}

function setCamera(c){
    cam.x = c.x;
    cam.y = c.y;
    cam.z = c.z;
    cam.yaw = c.yaw;
    cam.pitch = c.pitch;
    camVel.x = 0; camVel.y = 0; camVel.z = 0;
    clampCamera();
}

function getCamera(){
    return {x: cam.x, y: cam.y, z: cam.z, yaw: cam.yaw, pitch: cam.pitch};
}

window.__arena = {
    freeze(on){ frozen = !!on; },
    setSeed(n){ setSeed(n); },
    setTime(h){ setTime(h); },
    setCamera(c){ setCamera(c); },
    getCamera(){ return getCamera(); },
    terrainHeight(x, z){ return getTerrainHeight(x, z); },
    stats(){ return {chunks: lastChunkCount, triangles: lastTriCount}; }
};

// === INITIALIZE ===
// Generate initial chunks synchronously for first frame
for(let i=0; i<50; i++){
    updateChunks();
}

requestAnimationFrame(frame);
})();
</script>
</body>
</html>
```

Wait, I realize I have an issue with the terrain shader - I declared `aHeight` as an attribute but I'm not actually providing a separate height buffer. Let me fix this by computing height from the position's y component in the shader, or by creating a proper height buffer. Let me rewrite the code with this fix and a few other improvements.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{overflow:hidden;background:#000}
#c{display:block;width:100vw;height:100vh}
#ui{position:fixed;top:10px;left:10px;color:#fff;font-family:monospace;font-size:13px;z-index:10;user-select:none}
#ui>div{margin-bottom:6px;background:rgba(0,0,0,.6);padding:8px 12px;border-radius:6px;display:flex;align-items:center;gap:8px}
#fps{position:fixed;top:10px;right:10px;color:#0f0;font-family:monospace;font-size:13px;background:rgba(0,0,0,.6);padding:8px 12px;border-radius:6px}
#ap{position:fixed;bottom:10px;left:10px;color:#fff;font-family:monospace;font-size:13px;background:rgba(0,0,0,.6);padding:8px 12px;border-radius:6px}
input[type=range]{width:180px;accent-color:#4a9}
input[type=number]{width:80px;background:#222;color:#fff;border:1px solid #444;border-radius:3px;padding:2px 6px}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="ui">
<div><label>Time</label><input type="range" id="time" min="0" max="24" step="0.01" value="12"></div>
<div><label>Seed</label><input type="number" id="seed" value="42"></div>
</div>
<div id="fps">-- FPS</div>
<div id="ap">Autopilot: ON</div>
<script>
(function(){
"use strict";

const CHUNK_SIZE=256;
const LOD_LEVELS=[{res:64,minD:0,maxD:300},{res:32,minD:300,maxD:800},{res:16,minD:800,maxD:1500},{res:8,minD:1500,maxD:2500}];
const MAX_CHUNKS=250;
const FOG_D=0.0004;

let seed=42,timeOfDay=12,frozen=false,autopilot=true,waterTime=0;
let cam={x:0,y:100,z:0,yaw:0,pitch:-0.15};
let camVel={x:0,y:0,z:0};
let keys={},mouseDown=false,lastMX=0,lastMY=0;
let lastTime=0,fpsCount=0,fpsTime=0,fpsDisplay=0;
let lastTriCount=0,lastChunkCount=0;

// Noise
function hash2d(ix,iz,s){
    let n=Math.imul(ix,15731)+Math.imul(iz,7817)+Math.imul(s,104729);
    n=Math.imul(n^(n>>>13),1274126177);
    n=n^(n>>>16);
    return(n&0x7fffffff)/0x7fffffff*2-1;
}
function sm(t){return t*t*(3-2*t)}
function vn(x,y,s){
    const ix=Math.floor(x),iz=Math.floor(y);
    const fx=x-ix,fz=y-iz;
    const sx=sm(fx),sz=sm(fz);
    const a=hash2d(ix,iz,s),b=hash2d(ix+1,iz,s);
    const c=hash2d(ix,iz+1,s),d=hash2d(ix+1,iz+1,s);
    return(a*(1-sx)+b*sx)*(1-sz)+(c*(1-sx)+d*sx)*sz;
}
function fbm(x,y,s,o){
    let v=0,a=1,f=1,m=0;
    for(let i=0;i<o;i++){v+=vn(x*f,y*f,s+i*1000)*a;m+=a;a*=.5;f*=2}
    return v/m;
}
function rged(x,y,s,o){
    let v=0,a=1,f=1,m=0;
    for(let i=0;i<o;i++){v+=(1-Math.abs(vn(x*f,y*f,s+i*1000)))*a;m+=a;a*=.5;f*=2}
    return v/m;
}

function getTerrainHeight(x,z){
    const s=seed;
    const wx=fbm(x*.001+5.2,z*.001+1.3,s,3)*2.5;
    const wz=fbm(x*.001+1.7,z*.001+9.2,s+500,3)*2.5;
    const px=x*.0012+wx,pz=z*.0012+wz;
    const base=fbm(px,pz,s+1000,5);
    const m=rged(px*.7,pz*.7,s+3000,4);
    const mask=Math.max(0,base*1.2+.2);
    let h=base*100+m*m*280*mask;
    if(h<0)h=h*.4-15;
    return Math.max(-50,Math.min(400,h));
}

// Chunks
const chunkCache=new Map();
function cKey(cx,cz,l){return cx+','+cz+','+l}

function genChunk(cx,cz,lod){
    const res=LOD_LEVELS[lod].res;
    const step=CHUNK_SIZE/res;
    const ox=cx*CHUNK_SIZE,oz=cz*CHUNK_SIZE;
    const n=res+1;
    const pos=new Float32Array(n*n*3);
    const nrm=new Float32Array(n*n*3);
    const hts=new Float32Array(n*n);
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){
        const x=ox+i*step,z=oz+j*step;
        const h=getTerrainHeight(x,z);
        const idx=j*n+i;
        pos[idx*3]=x;pos[idx*3+1]=h;pos[idx*3+2]=z;
        hts[idx]=h;
    }
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){
        const idx=j*n+i;
        const j0=Math.max(0,j-1),j1=Math.min(n-1,j+1);
        const i0=Math.max(0,i-1),i1=Math.min(n-1,i+1);
        const dx=(i1===i0)?0:(hts[j*n+i1]-hts[j*n+i0])/(step*(i1-i0));
        const dz=(j1===j0)?0:(hts[j1*n+i]-hts[j0*n+i])/(step*(j1-j0));
        let nx=-dx,ny=1,nz=-dz;
        const len=Math.sqrt(nx*nx+ny*ny+nz*nz);
        nrm[idx*3]=nx/len;nrm[idx*3+1]=ny/len;nrm[idx*3+2]=nz/len;
    }
    const idx=new Uint16Array(res*res*6);
    let ii=0;
    for(let j=0;j<res;j++)for(let i=0;i<res;i++){
        const a=j*n+i,b=a+1,c=a+n,d=c+1;
        idx[ii++]=a;idx[ii++]=b;idx[ii++]=c;
        idx[ii++]=b;idx[ii++]=d;idx[ii++]=c;
    }
    return{pos,nrm,idx,res,tri:res*res*2};
}

const gl=canvas.getContext('webgl',{antialias:true});
if(!gl)document.body.innerHTML='WebGL not supported';

function resize(){
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=1280*dpr;canvas.height=800*dpr;
    gl.viewport(0,0,canvas.width,canvas.height);
}
window.addEventListener('resize',resize);
resize();

function cs(type,src){
    const s=gl.createShader(type);
    gl.shaderSource(s,src);gl.compileShader(s);
    return s;
}
function cp(vs,fs){
    const p=gl.createProgram();
    gl.attachShader(p,cs(gl.VERTEX_SHADER,vs));
    gl.attachShader(p,cs(gl.FRAGMENT_SHADER,fs));
    gl.linkProgram(p);
    return p;
}

// Terrain
const tVS=`
attribute vec3 aPos;
attribute vec3 aNormal;
uniform mat4 uMVP;
uniform vec3 uCamPos;
varying vec3 vWP;
varying vec3 vN;
varying float vH;
varying float vFog;
void main(){
    vWP=aPos;vN=aNormal;vH=aPos.y;
    float d=length(aPos-uCamPos);
    vFog=1.0-exp(-${FOG_D.toFixed(6)}*d*d);
    gl_Position=uMVP*vec4(aPos,1.0);
}`;
const tFS=`
precision mediump float;
varying vec3 vWP;varying vec3 vN;varying float vH;varying float vFog;
uniform vec3 uSunDir;uniform vec3 uSunCol;uniform float uSunInt;
uniform vec3 uAmb;uniform vec3 uFogC;
void main(){
    float slope=1.0-vN.y;
    vec3 col;
    if(vH<0.5){col=vec3(0.76,0.72,0.5);}
    else if(vH<3.0){float t=smoothstep(0.5,3.0,vH);col=mix(vec3(0.76,0.72,0.5),vec3(0.22,0.55,0.18),t);}
    else if(vH>280.0){col=vec3(0.95,0.96,0.98);}
    else if(vH>180.0){float t=(vH-180.0)/100.0;col=mix(vec3(0.45,0.42,0.38),vec3(0.95,0.96,0.98),t);}
    else{col=vec3(0.22,0.55,0.18);}
    if(slope>0.3&&vH>2.0&&vH<280.0){float rf=smoothstep(0.3,0.55,slope);col=mix(col,vec3(0.5,0.46,0.42),rf);}
    float diff=max(dot(vN,uSunDir),0.0);
    vec3 light=uAmb+uSunCol*diff*uSunInt;
    vec3 fc=col*light;
    fc=mix(fc,uFogC,vFog);
    gl_FragColor=vec4(fc,1.0);
}`;
const tProg=cp(tVS,tFS);
const tL={
    aPos:gl.getAttribLocation(tProg,'aPos'),
    aNormal:gl.getAttribLocation(tProg,'aNormal'),
    uMVP:gl.getUniformLocation(tProg,'uMVP'),
    uCamPos:gl.getUniformLocation(tProg,'uCamPos'),
    uSunDir:gl.getUniformLocation(tProg,'uSunDir'),
    uSunCol:gl.getUniformLocation(tProg,'uSunCol'),
    uSunInt:gl.getUniformLocation(tProg,'uSunInt'),
    uAmb:gl.getUniformLocation(tProg,'uAmb'),
    uFogC:gl.getUniformLocation(tProg,'uFogC')
};

// Water
const wVS=`
attribute vec3 aPos;
uniform mat4 uMVP;
uniform float uTime;
uniform vec3 uCamPos;
varying vec3 vWP;varying vec3 vN;varying float vFog;
void main(){
    vec3 p=aPos;
    float t=uTime;
    p.y+=sin(p.x*0.05+t)*0.3+sin(p.z*0.08+t*1.3)*0.2+sin((p.x+p.z)*0.03+t*0.7)*0.4;
    float dx=cos(p.x*0.05+t)*0.015+cos((p.x+p.z)*0.03+t*0.7)*0.012;
    float dz=cos(p.z*0.08+t*1.3)*0.016+cos((p.x+p.z)*0.03+t*0.7)*0.012;
    vN=normalize(vec3(-dx,1.0,-dz));
    vWP=p;
    float d=length(p-uCamPos);
    vFog=1.0-exp(-${FOG_D.toFixed(6)}*d*d);
    gl_Position=uMVP*vec4(p,1.0);
}`;
const wFS=`
precision mediump float;
varying vec3 vWP;varying vec3 vN;varying float vFog;
uniform vec3 uSunDir;uniform vec3 uSunCol;uniform float uSunInt;
uniform vec3 uSkyC;uniform vec3 uFogC;uniform vec3 uCamPos;
void main(){
    vec3 vd=normalize(uCamPos-vWP);
    float fr=pow(1.0-max(dot(vd,vN),0.0),5.0);
    vec3 wc=vec3(0.02,0.12,0.28);
    vec3 c=mix(wc,uSkyC,fr*0.7);
    vec3 rf=reflect(-uSunDir,vN);
    float sp=pow(max(dot(vd,rf),0.0),64.0);
    c+=uSunCol*sp*uSunInt*0.6;
    c=mix(c,uFogC,vFog);
    gl_FragColor=vec4(c,0.85);
}`;
const wProg=cp(wVS,wFS);
const wL={
    aPos:gl.getAttribLocation(wProg,'aPos'),
    uMVP:gl.getUniformLocation(wProg,'uMVP'),
    uTime:gl.getUniformLocation(wProg,'uTime'),
    uCamPos:gl.getUniformLocation(wProg,'uCamPos'),
    uSunDir:gl.getUniformLocation(wProg,'uSunDir'),
    uSunCol:gl.getUniformLocation(wProg,'uSunCol'),
    uSunInt:gl.getUniformLocation(wProg,'uSunInt'),
    uSkyC:gl.getUniformLocation(wProg,'uSkyC'),
    uFogC:gl.getUniformLocation(wProg,'uFogC')
};

// Sky
const sVS=`
attribute vec2 aPos;
varying vec2 vUv;
void main(){vUv=aPos;gl_Position=vec4(aPos,0.9999,1.0);}`;
const sFS=`
precision mediump float;
varying vec2 vUv;
uniform mat4 uInvVP;
uniform vec3 uSunDir;uniform float uSunInt;
uniform vec3 uSkyTop;uniform vec3 uSkyBot;
uniform float uNight;
void main(){
    vec4 r=uInvVP*vec4(vUv,0.9999,1.0);
    vec3 dir=normalize(r.xyz/r.w);
    float t=pow(max(dir.y,0.0),0.45);
    vec3 sky=mix(uSkyBot,uSkyTop,t);
    float sd=max(dot(dir,uSunDir),0.0);
    sky+=vec3(1.0,0.95,0.6)*pow(sd,512.0)*8.0;
    sky+=vec3(1.0,0.6,0.2)*pow(sd,32.0)*0.4*uSunInt;
    sky+=vec3(1.0,0.8,0.4)*pow(sd,8.0)*0.15*uSunInt;
    if(uNight>0.1){
        vec3 sp=dir*150.0;
        vec3 g=floor(sp);
        float h=fract(sin(dot(g,vec3(12.9898,78.233,45.164)))*43758.5453);
        if(h>0.985){
            float star=(h-0.985)/0.015*uNight;
            sky+=vec3(star*0.8,star*0.85,star);
        }
        vec3 md=normalize(vec3(-uSunDir.x,abs(uSunDir.y)*0.5+0.3,-uSunDir.z));
        float mdot=max(dot(dir,md),0.0);
        sky+=vec3(0.8,0.85,0.9)*pow(mdot,256.0)*3.0*uNight;
    }
    gl_FragColor=vec4(sky,1.0);
}`;
const sProg=cp(sVS,sFS);
const sL={
    aPos:gl.getAttribLocation(sProg,'aPos'),
    uInvVP:gl.getUniformLocation(sProg,'uInvVP'),
    uSunDir:gl.getUniformLocation(sProg,'uSunDir'),
    uSunInt:gl.getUniformLocation(sProg,'uSunInt'),
    uSkyTop:gl.getUniformLocation(sProg,'uSkyTop'),
    uSkyBot:gl.getUniformLocation(sProg,'uSkyBot'),
    uNight:gl.getUniformLocation(sProg,'uNight')
};

// Buffers
const skyBuf=gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,skyBuf);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);

const wSize=4000,wRes=128;
const wVerts=new Float32Array((wRes+1)*(wRes+1)*3);
const wIdx=new Uint16Array(wRes*wRes*6);
let wi=0;
for(let j=0;j<wRes;j++)for(let i=0;i<wRes;i++){
    const a=j*(wRes+1)+i,b=a+1,c=a+(wRes+1),d=c+1;
    wIdx[wi++]=a;wIdx[wi++]=b;wIdx[wi++]=c;
    wIdx[wi++]=b;wIdx[wi++]=d;wIdx[wi++]=c;
}
const wVBO=gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,wVBO);
gl.bufferData(gl.ARRAY_BUFFER,wVerts,gl.DYNAMIC_DRAW);
const wIBO=gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,wIBO);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,wIdx,gl.STATIC_DRAW);

// Chunk GL objects
function makeChunkGL(data){
    const o={gl:{}};
    o.gl.vbo=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,o.gl.vbo);
    gl.bufferData(gl.ARRAY_BUFFER,data.pos,gl.STATIC_DRAW);
    o.gl.nbo=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,o.gl.nbo);
    gl.bufferData(gl.ARRAY_BUFFER,data.nrm,gl.STATIC_DRAW);
    o.gl.ibo=gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,o.gl.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,data.idx,gl.STATIC_DRAW);
    o.tri=data.tri;
    return o;
}
function delChunkGL(o){
    if(o.gl.vbo)gl.deleteBuffer(o.gl.vbo);
    if(o.gl.nbo)gl.deleteBuffer(o.gl.nbo);
    if(o.gl.ibo)gl.deleteBuffer(o.gl.ibo);
}

let pendingChunks=[];

function updateChunks(){
    const cx0=Math.floor(cam.x/CHUNK_SIZE);
    const cz0=Math.floor(cam.z/CHUNK_SIZE);
    const needed=[];
    for(let lod=0;lod<LOD_LEVELS.length;lod++){
        const maxD=LOD_LEVELS[lod].maxD;
        const range=Math.ceil(maxD/CHUNK_SIZE)+1;
        for(let dz=-range;dz<=range;dz++){
            for(let dx=-range;dx<=range;dx++){
                const cx=cx0+dx,cz=cz0+dz;
                const cxc=cx*CHUNK_SIZE+CHUNK_SIZE/2;
                const czc=cz*CHUNK_SIZE+CHUNK_SIZE/2;
                const dist=Math.sqrt((cxc-cam.x)**2+(czc-cam.z)**2);
                if(dist>=LOD_LEVELS[lod].minD&&dist<=maxD){
                    needed.push({cx,cz,lod,dist});
                }
            }
        }
    }
    needed.sort((a,b)=>a.dist-b.dist);
    const toKeep=new Set(needed.slice(0,MAX_CHUNKS).map(c=>cKey(c.cx,c.cz,c.lod)));
    for(let i=0;i<Math.min(needed.length,MAX_CHUNKS);i++){
        const c=needed[i];
        const key=cKey(c.cx,c.cz,c.lod);
        if(!chunkCache.has(key))pendingChunks.push(c);
    }
    for(const key of chunkCache.keys()){
        if(!toKeep.has(key)){delChunkGL(chunkCache.get(key));chunkCache.delete(key);}
    }
    let gen=0;
    while(pendingChunks.length>0&&gen<3){
        const c=pendingChunks.shift();
        const key=cKey(c.cx,c.cz,c.lod);
        if(!chunkCache.has(key)){
            chunkCache.set(key,makeChunkGL(genChunk(c.cx,c.cz,c.lod)));
            gen++;
        }
    }
}

// Matrix
function mPersp(fov,asp,n,f){
    const t=1/Math.tan(fov/2);
    return new Float32Array([t/asp,0,0,0,0,t,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0]);
}
function mLook(e,t,u){
    let fx=t[0]-e[0],fy=t[1]-e[1],fz=t[2]-e[2];
    let fl=Math.sqrt(fx*fx+fy*fy+fz*fz);fx/=fl;fy/=fl;fz/=fl;
    let sx=u[1]*fz-u[2]*fy,sy=u[2]*fx-u[0]*fz,sz=u[0]*fy-u[1]*fx;
    let sl=Math.sqrt(sx*sx+sy*sy+sz*sz);
    if(sl<.001){sx=1;sy=0;sz=0}else{sx/=sl;sy/=sl;sz/=sl}
    let ux=sy*fz-sz*fy,uy=sz*fx-sx*fz,uz=sx*fy-sy*fx;
    return new Float32Array([sx,ux,-fx,0,sy,uy,-fy,0,sz,uz,-fz,0,-(sx*e[0]+sy*e[1]+sz*e[2]),-(ux*e[0]+uy*e[1]+uz*e[2]),fx*e[0]+fy*e[1]+fz*e[2],1]);
}
function mMul(a,b){
    const r=new Float32Array(16);
    for(let c=0;c<4;c++)for(let rr=0;rr<4;rr++){
        let s=0;for(let k=0;k<4;k++)s+=a[k*4+rr]*b[c*4+k];
        r[c*4+rr]=s;
    }
    return r;
}
function mInv(m){
    const i=new Float32Array(16);
    i[0]=m[5]*m[10]*m[15]-m[5]*m[11]*m[14]-m[9]*m[6]*m[15]+m[9]*m[7]*m[14]+m[13]*m[6]*m[11]-m[13]*m[7]*m[10];
    i[1]=-m[1]*m[10]*m[15]+m[1]*m[11]*m[14]+m[9]*m[2]*m[15]-m[9]*m[3]*m[14]-m[13]*m[2]*m[11]+m[13]*m[3]*m[10];
    i[2]=m[1]*m[6]*m[15]-m[1]*m[7]*m[14]-m[5]*m[2]*m[15]+m[5]*m[3]*m[14]+m[13]*m[2]*m[7]-m[13]*m[3]*m[6];
    i[3]=-m[1]*m[6]*m[11]+m[1]*m[7]*m[10]+m[5]*m[2]*m[11]-m[5]*m[3]*m[10]-m[9]*m[2]*m[7]+m[9]*m[3]*m[6];
    i[4]=-m[4]*m[10]*m[15]+m[4]*m[11]*m[14]+m[8]*m[6]*m[15]-m[8]*m[7]*m[14]-m[12]*m[6]*m[11]+m[12]*m[7]*m[10];
    i[5]=m[0]*m[10]*m[15]-m[0]*m[11]*m[14]-m[8]*m[2]*m[15]+m[8]*m[3]*m[14]+m[12]*m[2]*m[11]-m[12]*m[3]*m[10];
    i[6]=-m[0]*m[6]*m[15]+m[0]*m[7]*m[14]+m[4]*m[2]*m[15]-m[4]*m[3]*m[14]-m[12]*m[2]*m[7]+m[12]*m[3]*m[6];
    i[7]=m[0]*m[6]*m[11]-m[0]*m[7]*m[10]-m[4]*m[2]*m[11]+m[4]*m[3]*m[10]+m[8]*m[2]*m[7]-m[8]*m[3]*m[6];
    i[8]=m[4]*m[9]*m[15]-m[4]*m[11]*m[13]-m[8]*m[5]*m[15]+m[8]*m[7]*m[13]+m[12]*m[5]*m[11]-m[12]*m[7]*m[9];
    i[9]=-m[0]*m[9]*m[15]+m[0]*m[11]*m[13]+m[8]*m[1]*m[15]-m[8]*m[3]*m[13]-m[12]*m[1]*m[11]+m[12]*m[3]*m[9];
    i[10]=m[0]*m[5]*m[15]-m[0]*m[7]*m[13]-m[4]*m[1]*m[15]+m[4]*m[3]*m[13]+m[12]*m[1]*m[7]-m[12]*m[3]*m[5];
    i[11]=-m[0]*m[5]*m[11]+m[0]*m[7]*m[9]+m[4]*m[1]*m[11]-m[4]*m[3]*m[9]-m[8]*m[1]*m[7]+m[8]*m[3]*m[5];
    i[12]=-m[4]*m[9]*m[14]+m[4]*m[10]*m[13]+m[8]*m[5]*m[14]-m[8]*m[6]*m[13]-m[12]*m[5]*m[10]+m[12]*m[6]*m[9];
    i[13]=m[0]*m[9]*m[14]-m[0]*m[10]*m[13]-m[8]*m[1]*m[14]+m[8]*m[2]*m[13]+m[12]*m[1]*m[10]-m[12]*m[2]*m[9];
    i[14]=-m[0]*m[5]*m[14]+m[0]*m[6]*m[13]+m[4]*m[1]*m[14]-m[4]*m[2]*m[13]-m[12]*m[1]*m[6]+m[12]*m[2]*m[5];
    i[15]=m[0]*m[5]*m[10]-m[0]*m[6]*m[9]-m[4]*m[1]*m[10]+m[4]*m[2]*m[9]+m[8]*m[1]*m[6]-m[8]*m[2]*m[5];
    const det=m[0]*i[0]+m[1]*i[4]+m[2]*i[8]+m[3]*i[12];
    if(Math.abs(det)<1e-10)return i;
    const id=1/det;
    for(let j=0;j<16;j++)i[j]*=id;
    return i;
}

// Camera
function camDir(){
    return[Math.sin(cam.yaw)*Math.cos(cam.pitch),Math.sin(cam.pitch),-Math.cos(cam.yaw)*Math.cos(cam.pitch)];
}
function clampCam(){
    const th=getTerrainHeight(cam.x,cam.z);
    const minY=Math.max(th+3,2);
    if(cam.y<minY)cam.y=minY;
}
function updateCam(dt){
    if(autopilot&&!frozen){
        const sp=40;
        const d=camDir();
        cam.x+=d[0]*sp*dt;
        cam.z+=d[2]*sp*dt;
        const th=getTerrainHeight(cam.x,cam.z);
        const ty=Math.max(th+50,30);
        cam.y+=(ty-cam.y)*2.0*dt;
        cam.pitch+=(-0.1-cam.pitch)*1.0*dt;
        cam.yaw+=0.02*dt;
    }
    const sp=50;
    const d=camDir();
    const rt=[Math.cos(cam.yaw),0,Math.sin(cam.yaw)];
    let ax=0,ay=0,az=0;
    if(keys['KeyW']){ax+=d[0];ay+=d[1];az+=d[2]}
    if(keys['KeyS']){ax-=d[0];ay-=d[1];az-=d[2]}
    if(keys['KeyA']){ax-=rt[0];az-=rt[2]}
    if(keys['KeyD']){ax+=rt[0];az+=rt[2]}
    if(keys['KeyQ']||keys['ShiftLeft']){ay-=1}
    if(keys['KeyE']||keys['Space']){ay+=1}
    const len=Math.sqrt(ax*ax+ay*ay+az*az);
    if(len>0){ax/=len;ay/=len;az/=len}
    const ac=5;
    camVel.x+=(ax*sp-camVel.x)*ac*dt;
    camVel.y+=(ay*sp-camVel.y)*ac*dt;
    camVel.z+=(az*sp-camVel.z)*ac*dt;
    cam.x+=camVel.x*dt;
    cam.y+=camVel.y*dt;
    cam.z+=camVel.z*dt;
    clampCam();
}

// Day/night
function getDN(){
    const ang=(timeOfDay/24)*Math.PI*2-Math.PI/2;
    const se=Math.sin(ang),sa=Math.cos(ang);
    const sd=[sa*.7,se,-sa*.7];
    const sl=Math.sqrt(sd[0]**2+sd[1]**2+sd[2]**2);
    sd[0]/=sl;sd[1]/=sl;sd[2]/=sl;
    const dayF=Math.max(0,Math.min(1,(se+.1)/.3));
    const nightF=1-dayF;
    const ssF=Math.max(0,1-Math.abs(se)*3);
    let sr=1,sg=.95,sb=.8;
    if(ssF>.5&&se>-0.1){const t=ssF;sg=1-t*.4;sb=1-t*.6}
    const si=dayF*1.2;
    const ar=.1+dayF*.25,ag=.1+dayF*.25,ab=.15+dayF*.2;
    const str=.05+dayF*.2,stg=.05+dayF*.35,stb=.15+dayF*.75;
    let sbr=.05+dayF*.7,sbg=.05+dayF*.75,sbb=.1+dayF*.9;
    if(ssF>.3&&se>-0.1){const t=ssF;sbr=sbr*(1-t)+1*t;sbg=sbg*(1-t)+.5*t;sbb=sbb*(1-t)+.2*t}
    return{sunDir:sd,sunInt:si,sunCol:[sr,sg,sb],amb:[ar,ag,ab],skyTop:[str,stg,stb],skyBot:[sbr,sbg,sbb],fogC:[sbr,sbg,sbb],nightF};
}

// Water verts update
function updWater(){
    let wi=0;
    const ox=Math.floor(cam.x/10)*10-wSize/2;
    const oz=Math.floor(cam.z/10)*10-wSize/2;
    for(let j=0;j<=wRes;j++)for(let i=0;i<=wRes;i++){
        wVerts[wi++]=ox+i*(wSize/wRes);
        wVerts[wi++]=0;
        wVerts[wi++]=oz+j*(wSize/wRes);
    }
}

// Render
function render(){
    const dn=getDN();
    const asp=canvas.width/canvas.height;
    const proj=mPersp(1.2,asp,.1,3000);
    const d=camDir();
    const eye=[cam.x,cam.y,cam.z];
    const tgt=[cam.x+d[0],cam.y+d[1],cam.z+d[2]];
    const view=mLook(eye,tgt,[0,1,0]);
    const vp=mMul(proj,view);
    const invVP=mInv(vp);

    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Sky
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.useProgram(sProg);
    gl.bindBuffer(gl.ARRAY_BUFFER,skyBuf);
    gl.enableVertexAttribArray(sL.aPos);
    gl.vertexAttribPointer(sL.aPos,2,gl.FLOAT,false,0,0);
    gl.uniformMatrix4fv(sL.uInvVP,false,invVP);
    gl.uniform3fv(sL.uSunDir,dn.sunDir);
    gl.uniform1f(sL.uSunInt,dn.sunInt);
    gl.uniform3fv(sL.uSkyTop,dn.skyTop);
    gl.uniform3fv(sL.uSkyBot,dn.skyBot);
    gl.uniform1f(sL.uNight,dn.nightF);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);

    // Terrain
    gl.useProgram(tProg);
    gl.uniformMatrix4fv(tL.uMVP,false,vp);
    gl.uniform3fv(tL.uCamPos,eye);
    gl.uniform3fv(tL.uSunDir,dn.sunDir);
    gl.uniform3fv(tL.uSunCol,dn.sunCol);
    gl.uniform1f(tL.uSunInt,dn.sunInt);
    gl.uniform3fv(tL.uAmb,dn.amb);
    gl.uniform3fv(tL.uFogC,dn.fogC);

    let tc=0,cc=0;
    for(const[key,obj]of chunkCache){
        gl.bindBuffer(gl.ARRAY_BUFFER,obj.gl.vbo);
        gl.enableVertexAttribArray(tL.aPos);
        gl.vertexAttribPointer(tL.aPos,3,gl.FLOAT,false,0,0);
        gl.bindBuffer(gl.ARRAY_BUFFER,obj.gl.nbo);
        gl.enableVertexAttribArray(tL.aNormal);
        gl.vertexAttribPointer(tL.aNormal,3,gl.FLOAT,false,0,0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,obj.gl.ibo);
        gl.drawElements(gl.TRIANGLES,obj.tri,gl.UNSIGNED_SHORT,0);
        tc+=obj.tri;cc++;
    }
    lastTriCount=tc;lastChunkCount=cc;

    // Water
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.useProgram(wProg);
    gl.uniformMatrix4fv(wL.uMVP,false,vp);
    gl.uniform1f(wL.uTime,waterTime);
    gl.uniform3fv(wL.uCamPos,eye);
    gl.uniform3fv(wL.uSunDir,dn.sunDir);
    gl.uniform3fv(wL.uSunCol,dn.sunCol);
    gl.uniform1f(wL.uSunInt,dn.sunInt);
    gl.uniform3fv(wL.uSkyC,dn.skyBot);
    gl.uniform3fv(wL.uFogC,dn.fogC);
    gl.bindBuffer(gl.ARRAY_BUFFER,wVBO);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,wVerts);
    gl.enableVertexAttribArray(wL.aPos);
    gl.vertexAttribPointer(wL.aPos,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,wIBO);
    gl.drawElements(gl.TRIANGLES,wRes*wRes*2,gl.UNSIGNED_SHORT,0);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
}

// Main loop
function frame(t){
    requestAnimationFrame(frame);
    const dt=Math.min((t-lastTime)/1000,.05);
    lastTime=t;
    fpsCount++;fpsTime+=dt;
    if(fpsTime>=.5){fpsDisplay=Math.round(fpsCount/fpsTime);document.getElementById('fps').textContent=fpsDisplay+' FPS';fpsCount=0;fpsTime=0}
    if(!frozen){timeOfDay+=dt*(24/120);if(timeOfDay>24)timeOfDay-=24;document.getElementById('time').value=timeOfDay}
    if(!frozen)waterTime+=dt;
    updateCam(dt);
    updateChunks();
    updWater();
    render();
}

// Input
document.addEventListener('keydown',e=>{
    keys[e.code]=true;
    if(e.code==='KeyF'){autopilot=!autopilot;document.getElementById('ap').textContent='Autopilot: '+(autopilot?'ON':'OFF')}
    if(e.code==='Space')e.preventDefault();
});
document.addEventListener('keyup',e=>{keys[e.code]=false});
document.addEventListener('mousedown',e=>{mouseDown=true;lastMX=e.clientX;lastMY=e.clientY});
document.addEventListener('mouseup',()=>{mouseDown=false});
document.addEventListener('mousemove',e=>{
    if(mouseDown){
        cam.yaw-=(e.clientX-lastMX)*.003;
        cam.pitch+=(e.clientY-lastMY)*.003;
        cam.pitch=Math.max(-1.5,Math.min(1.5,cam.pitch));
        lastMX=e.clientX;lastMY=e.clientY;
    }
});
document.getElementById('time').addEventListener('input',e=>{timeOfDay=parseFloat(e.target.value)});
document.getElementById('seed').addEventListener('change',e=>{const v=parseInt(e.target.value);if(!isNaN(v))setSeedFn(v)});

// Grader API
function setSeedFn(n){
    seed=n;
    document.getElementById('seed').value=n;
    for(const[key,obj]of chunkCache)delChunkGL(obj);
    chunkCache.clear();
    pendingChunks=[];
}
function setTimeFn(h){timeOfDay=Math.max(0,Math.min(24,h));document.getElementById('time').value=timeOfDay}
function setCamFn(c){
    cam.x=c.x;cam.y=c.y;cam.z=c.z;cam.yaw=c.yaw;cam.pitch=c.pitch;
    camVel.x=0;camVel.y=0;camVel.z=0;
    clampCam();
}
function getCamFn(){return{x:cam.x,y:cam.y,z:cam.z,yaw:cam.yaw,pitch:cam.pitch}}

window.__arena={
    freeze(on){frozen=!!on},
    setSeed(n){setSeedFn(n)},
    setTime(h){setTimeFn(h)},
    setCamera(c){setCamFn(c)},
    getCamera(){return getCamFn()},
    terrainHeight(x,z){return getTerrainHeight(x,z)},
    stats(){return{chunks:lastChunkCount,triangles:lastTriCount}}
};

// Initial chunks
for(let i=0;i<80;i++)updateChunks();
requestAnimationFrame(frame);
})();
</script>
</body>
</html>
```