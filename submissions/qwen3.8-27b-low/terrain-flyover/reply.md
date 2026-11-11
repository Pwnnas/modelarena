

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Horizon</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{overflow:hidden;background:#000}
canvas{display:block;width:100vw;height:100vh}
#ui{position:fixed;bottom:16px;left:16px;color:rgba(255,255,255,0.85);font:12px/1.6 monospace;z-index:10;user-select:none}
#ui label{display:block;margin:3px 0}
#ui input[type=range]{width:180px;vertical-align:middle;accent-color:#6af}
#ui input[type=number]{width:72px;background:rgba(0,0,0,0.5);color:#fff;border:1px solid rgba(255,255,255,0.3);padding:2px 4px;font:12px monospace}
#fps{position:fixed;top:10px;left:10px;color:rgba(255,255,255,0.7);font:11px monospace;z-index:10;pointer-events:none}
#ap{position:fixed;top:10px;right:10px;color:rgba(100,255,100,0.8);font:11px monospace;z-index:10;pointer-events:none}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="fps">60 FPS</div>
<div id="ap">AUTOPILOT</div>
<div id="ui">
<label>Time <input type="range" id="time" min="0" max="24" step="0.05" value="10"></label>
<label>Seed <input type="number" id="seed" value="42"></label>
</div>
<script>
"use strict";
// ============ STATE ============
let seed = 42, timeOfDay = 10, frozen = false, autopilot = true;
let camX = 0, camY = 100, camZ = 0, camYaw = 0, camPitch = -0.15;
let camVX = 0, camVY = 0, camVZ = 0;
let animTime = 0, lastT = 0, fpsCnt = 0, fpsTimer = 0, fpsDisplay = 60;
let keys = {};
let mouseDown = false, mouseLX = 0, mouseLY = 0;
let triCount = 0, chunkCount = 0;

// ============ NOISE ============
function ihash(x, y, s) {
    x |= 0; y |= 0; s |= 0;
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 144665) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
}
function vnoise(x, y, s) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const sx = fx*fx*fx*(fx*(fx*6-15)+10);
    const sy = fy*fy*fy*(fy*(fy*6-15)+10);
    const a = ihash(ix, iy, s), b = ihash(ix+1, iy, s);
    const c = ihash(ix, iy+1, s), d = ihash(ix+1, iy+1, s);
    return a + (b-a)*sx + (c-a)*sy + (a-b-c+d)*sx*sy;
}
function fbm(x, y, s, oct, lac, gain) {
    let v = 0, a = 1, f = 1, m = 0;
    for (let i = 0; i < oct; i++) {
        v += a * vnoise(x*f, y*f, s + i*7919);
        m += a; a *= gain; f *= lac;
    }
    return v / m;
}
function ridged(x, y, s, oct, lac, gain) {
    let v = 0, a = 1, f = 1, m = 0;
    for (let i = 0; i < oct; i++) {
        let n = 1 - Math.abs(2*vnoise(x*f, y*f, s+i*104729)-1);
        v += a * n*n; m += a; a *= gain; f *= lac;
    }
    return v / m;
}
function terrainHeight(x, z) {
    const s = seed;
    const wf = 0.0008, ws = 120;
    const ox = (fbm(x*wf+5.2, z*wf+1.3, s+900, 3, 2, 0.5) - 0.5) * ws;
    const oz = (fbm(x*wf+9.7, z*wf+3.1, s+950, 3, 2, 0.5) - 0.5) * ws;
    const px = x + ox, pz = z + oz;
    const base = fbm(px*0.00035, pz*0.00035, s, 5, 2, 0.5);
    const detail = fbm(px*0.0025, pz*0.0025, s+300, 5, 2.1, 0.48);
    const mountain = ridged(px*0.0012, pz*0.0012, s+600, 5, 2.3, 0.48);
    let h = base*0.38 + detail*0.18 + mountain*0.44;
    const sl = 0.34;
    if (h < sl) {
        const t = h / sl;
        return -50 * (1 - t*t);
    }
    const t = (h - sl) / (1 - sl);
    return Math.pow(Math.max(0, t), 0.62) * 400;
}
function terrainNormal(x, z) {
    const e = 1.0;
    const hl = terrainHeight(x-e, z), hr = terrainHeight(x+e, z);
    const hd = terrainHeight(x, z-e), hu = terrainHeight(x, z+e);
    let nx = hl-hr, ny = 2*e, nz = hd-hu;
    const len = Math.sqrt(nx*nx+ny*ny+nz*nz);
    return [nx/len, ny/len, nz/len];
}
function terrainColor(x, y, z, ny) {
    const slope = 1 - ny;
    let r, g, b;
    if (y < 0.3) {
        const t = Math.max(0, (y+50)/50);
        r = 0.35+t*0.2; g = 0.3+t*0.18; b = 0.18+t*0.1;
    } else if (y < 2.5) {
        r = 0.72; g = 0.68; b = 0.48;
    } else if (y < 10) {
        const t = (y-2.5)/7.5;
        r = 0.72-t*0.45; g = 0.68-t*0.25; b = 0.48-t*0.3;
    } else if (y < 100) {
        const t = (y-10)/90;
        r = 0.22+t*0.1; g = 0.48-t*0.12; b = 0.12+t*0.08;
    } else if (y < 200) {
        const t = (y-100)/100;
        r = 0.38+t*0.08; g = 0.32+t*0.06; b = 0.26+t*0.08;
    } else if (y < 280) {
        const t = (y-200)/80;
        r = 0.42+t*0.42; g = 0.36+t*0.5; b = 0.32+t*0.54;
    } else {
        r = 0.88; g = 0.9; b = 0.94;
    }
    if (slope > 0.35 && y > 4) {
        const rb = Math.min(1, (slope-0.35)/0.25);
        r = r*(1-rb)+0.42*rb; g = g*(1-rb)+0.38*rb; b = b*(1-rb)+0.33*rb;
    }
    if (y > 180 && slope > 0.25) {
        const sb = Math.min(1,(slope-0.25)/0.2)*Math.min(1,(y-180)/60);
        r = r*(1-sb)+0.88*sb; g = g*(1-sb)+0.9*sb; b = b*(1-sb)+0.94*sb;
    }
    return [r, g, b];
}

// ============ MATRIX MATH ============
function m4persp(fov, asp, n, f) {
    const t = 1/Math.tan(fov/2), nf = 1/(n-f);
    return new Float32Array([t/asp,0,0,0, 0,t,0,0, 0,0,(f+n)*nf,-1, 0,0,2*f*n*nf,0]);
}
function m4view(px,py,pz,yaw,pitch) {
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    const fx=-sy*cp,fy=sp,fz=-cy*cp;
    const rx=cy,ry=0,rz=-sy;
    const ux=sy*sp,uy=cp,uz=cy*sp;
    const bx=-fx,by=-fy,bz=-fz;
    return new Float32Array([
        rx,ry,rz,0, ux,uy,uz,0, bx,by,bz,0,
        -(rx*px+ry*py+rz*pz), -(ux*px+uy*py+uz*pz), -(bx*px+by*py+bz*pz), 1
    ]);
}
function m4mul(a, b) {
    const o = new Float32Array(16);
    for (let c=0;c<4;c++) for (let r=0;r<4;r++) {
        o[c*4+r] = a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
    }
    return o;
}

// ============ WEBGL SETUP ============
const canvas = document.getElementById('c');
const gl = canvas.getContext('webgl2', {antialias:true, alpha:false});
if (!gl) throw new Error('No WebGL2');

function compileShader(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(sh));
        throw new Error('Shader compile error');
    }
    return sh;
}
function createProgram(vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, compileShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compileShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(p));
        throw new Error('Link error');
    }
    return p;
}

// Terrain shader
const terrainVS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNorm;
layout(location=2) in vec3 aCol;
uniform mat4 uMVP;
out vec3 vNorm; out vec3 vCol; out vec3 vWorld;
void main(){
    vNorm=aNorm; vCol=aCol; vWorld=aPos;
    gl_Position=uMVP*vec4(aPos,1.0);
}`;
const terrainFS = `#version 300 es
precision highp float;
in vec3 vNorm; in vec3 vCol; in vec3 vWorld;
uniform vec3 uSunDir; uniform vec3 uSunColor; uniform float uSunInt;
uniform vec3 uAmbCol; uniform vec3 uFogCol; uniform float uFogD;
uniform vec3 uCamPos;
out vec4 fragColor;
void main(){
    vec3 N=normalize(vNorm), L=normalize(uSunDir), V=normalize(uCamPos-vWorld);
    float NdL=max(dot(N,L),0.0);
    vec3 diff=uSunColor*NdL*uSunInt;
    float hemi=0.5+0.5*N.y;
    vec3 amb=uAmbCol*hemi;
    vec3 H=normalize(L+V);
    float spec=pow(max(dot(N,H),0.0),40.0)*0.15*uSunInt;
    vec3 col=vCol*(amb+diff)+uSunColor*spec;
    float d=length(uCamPos-vWorld);
    float fog=1.0-exp(-uFogD*uFogD*d*d);
    col=mix(col,uFogCol,clamp(fog,0.0,1.0));
    fragColor=vec4(col,1.0);
}`;

// Water shader
const waterVS = `#version 300 es
layout(location=0) in vec3 aPos;
uniform mat4 uMVP; uniform vec3 uOff;
out vec3 vWorld;
void main(){
    vec3 wp=aPos+uOff;
    vWorld=wp;
    gl_Position=uMVP*vec4(wp,1.0);
}`;
const waterFS = `#version 300 es
precision highp float;
in vec3 vWorld;
uniform vec3 uSunDir; uniform vec3 uSunColor; uniform float uSunInt;
uniform vec3 uFogCol; uniform float uFogD; uniform vec3 uCamPos;
uniform float uTime; uniform vec3 uSkyHor; uniform vec3 uSkyTop;
out vec4 fragColor;
void main(){
    vec2 p=vWorld.xz; float t=uTime;
    float e=0.5;
    float w1=0.12,w2=0.08,w3=0.06;
    float f1x=0.08,f1z=0.06,f2x=0.05,f2z=0.11,f3x=0.13,f3z=0.09;
    float s1=1.8,s2=1.4,s3=2.2;
    float h0=sin(p.x*f1x+t*s1)*w1+cos(p.y*f1z+t*s1*0.7)*w1*0.5+sin((p.x+p.y)*f2x+t*s2)*w2+cos(p.x*f3x-t*s3)*w3*0.5;
    float h1=sin((p.x+e)*f1x+t*s1)*w1+cos(p.y*f1z+t*s1*0.7)*w1*0.5+sin((p.x+e+p.y)*f2x+t*s2)*w2+cos((p.x+e)*f3x-t*s3)*w3*0.5;
    float h2=sin(p.x*f1x+t*s1)*w1+cos((p.y+e)*f1z+t*s1*0.7)*w1*0.5+sin((p.x+p.y+e)*f2x+t*s2)*w2+cos(p.x*f3x-t*s3)*w3*0.5;
    vec3 N=normalize(vec3(h0-h1,2.0*e,h0-h2));
    vec3 V=normalize(uCamPos-vWorld);
    float ct=max(dot(N,V),0.0);
    float F=0.02+0.98*pow(1.0-ct,5.0);
    vec3 deep=vec3(0.01,0.06,0.12);
    vec3 R=reflect(-V,N);
    float rf=max(R.y,0.0);
    vec3 refl=mix(uSkyHor,uSkyTop,pow(rf,0.5));
    vec3 col=mix(deep,refl,F*0.85);
    vec3 sr=reflect(-normalize(uSunDir),N);
    float ss=pow(max(dot(sr,V),0.0),128.0)*uSunInt*2.0;
    col+=uSunColor*ss;
    float d=length(uCamPos-vWorld);
    float fog=1.0-exp(-uFogD*uFogD*d*d);
    col=mix(col,uFogCol,clamp(fog,0.0,1.0));
    fragColor=vec4(col,0.78);
}`;

// Sky shader
const skyVS = `#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main(){ vUv=aPos; gl_Position=vec4(aPos,0.99999,1.0); }`;
const skyFS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform vec3 uSunDir; uniform float uSunInt; uniform float uNight;
uniform vec3 uSkyTop; uniform vec3 uSkyHor;
uniform vec3 uCamR; uniform vec3 uCamU; uniform vec3 uCamF;
uniform float uFovT; uniform float uAsp;
out vec4 fragColor;
void main(){
    vec3 dir=normalize(uCamF+vUv.x*uFovT*uAsp*uCamR+vUv.y*uFovT*uCamU);
    float h=dir.y;
    vec3 sky=mix(uSkyHor,uSkyTop,smoothstep(-0.02,0.45,h));
    if(h<0.0) sky*=0.85;
    float sd=dot(dir,uSunDir);
    vec3 sc=vec3(1.0,0.85,0.6)*max(uSunInt,0.0);
    sky+=sc*smoothstep(0.9996,0.9999,sd)*4.0;
    sky+=sc*pow(max(sd,0.0),64.0)*0.4;
    sky+=sc*pow(max(sd,0.0),8.0)*0.08;
    if(uNight>0.1&&h>0.0){
        vec3 cell=floor(dir*200.0);
        float sv=fract(sin(dot(cell,vec3(12.9898,78.233,45.164)))*43758.5453);
        float sb=step(0.996,sv);
        float twinkle=0.7+0.3*fract(sv*7919.0);
        sky+=vec3(sb*twinkle)*uNight*0.6*smoothstep(0.0,0.1,h);
    }
    // Moon
    vec3 moonDir=normalize(vec3(-uSunDir.x,abs(uSunDir.y)+0.1,-uSunDir.z));
    float md=dot(dir,moonDir);
    if(uNight>0.3){
        sky+=vec3(0.8,0.85,0.9)*smoothstep(0.9996,0.9998,md)*1.5*uNight;
        sky+=vec3(0.3,0.35,0.4)*pow(max(md,0.0),32.0)*0.15*uNight;
    }
    fragColor=vec4(sky,1.0);
}`;

const terrainProg = createProgram(terrainVS, terrainFS);
const waterProg = createProgram(waterVS, waterFS);
const skyProg = createProgram(skyVS, skyFS);

// Get uniform locations
const tU = {};
['uMVP','uSunDir','uSunColor','uSunInt','uAmbCol','uFogCol','uFogD','uCamPos'].forEach(n => tU[n]=gl.getUniformLocation(terrainProg,n));
const wU = {};
['uMVP','uOff','uSunDir','uSunColor','uSunInt','uFogCol','uFogD','uCamPos','uTime','uSkyHor','uSkyTop'].forEach(n => wU[n]=gl.getUniformLocation(waterProg,n));
const sU = {};
['uSunDir','uSunInt','uNight','uSkyTop','uSkyHor','uCamR','uCamU','uCamF','uFovT','uAsp'].forEach(n => sU[n]=gl.getUniformLocation(skyProg,n));

// ============ CHUNKS ============
const TILE0 = 128, SEGS0 = 32, VP0 = SEGS0+1;
const TILE1 = 256, SEGS1 = 32, VP1 = SEGS1+1;
const LOD0_DIST = 550, LOD1_DIST = 2000;
const MAX_CHUNKS = 250;

const chunkPool = [];
const chunkMap = new Map();
for (let i = 0; i < MAX_CHUNKS; i++) {
    chunkPool.push({vbo: gl.createBuffer(), ibo: gl.createBuffer(), count: 0, key: null});
}

function genChunkGeo(ox, oz, tile, segs) {
    const vp = segs+1;
    const nVerts = vp*vp;
    const verts = new Float32Array(nVerts*9);
    let vi = 0;
    for (let j = 0; j < vp; j++) {
        for (let i = 0; i < vp; i++) {
            const wx = ox + (i/segs)*tile;
            const wz = oz + (j/segs)*tile;
            const h = terrainHeight(wx, wz);
            const n = terrainNormal(wx, wz);
            const c = terrainColor(wx, h, wz, n[1]);
            verts[vi++]=wx; verts[vi++]=h; verts[vi++]=wz;
            verts[vi++]=n[0]; verts[vi++]=n[1]; verts[vi++]=n[2];
            verts[vi++]=c[0]; verts[vi++]=c[1]; verts[vi++]=c[2];
        }
    }
    const idx = new Uint32Array(segs*segs*6);
    let ii = 0;
    for (let j = 0; j < segs; j++) {
        for (let i = 0; i < segs; i++) {
            const a = j*vp+i, b=a+1, c=a+vp, d=c+1;
            idx[ii++]=a; idx[ii++]=c; idx[ii++]=b;
            idx[ii++]=b; idx[ii++]=c; idx[ii++]=d;
        }
    }
    return {verts, idx};
}

function assignChunk(key, ox, oz, tile, segs) {
    if (chunkMap.has(key)) return;
    let slot = -1;
    for (let i = 0; i < MAX_CHUNKS; i++) {
        if (chunkPool[i].key === null) { slot = i; break; }
    }
    if (slot < 0) {
        slot = 0;
        if (chunkPool[0].key) chunkMap.delete(chunkPool[0].key);
    }
    const geo = genChunkGeo(ox, oz, tile, segs);
    gl.bindBuffer(gl.ARRAY_BUFFER, chunkPool[slot].vbo);
    gl.bufferData(gl.ARRAY_BUFFER, geo.verts, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, chunkPool[slot].ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.idx, gl.STATIC_DRAW);
    chunkPool[slot].key = key;
    chunkPool[slot].count = geo.idx.length;
    chunkMap.set(key, slot);
}

function updateChunks() {
    const cx = Math.round(camX / TILE0), cz = Math.round(camZ / TILE0);
    const range0 = Math.ceil(LOD0_DIST / TILE0) + 1;
    const needed = new Set();
    for (let dx = -range0; dx <= range0; dx++) {
        for (let dz = -range0; dz <= range0; dz++) {
            const tx = cx + dx, tz = cz + dz;
            const tcx = tx*TILE0 + TILE0/2, tcz = tz*TILE0 + TILE0/2;
            const d = Math.sqrt((tcx-camX)**2 + (tcz-camZ)**2);
            if (d < LOD0_DIST) {
                const key = '0_'+tx+'_'+tz;
                needed.add(key);
                assignChunk(key, tx*TILE0, tz*TILE0, TILE0, SEGS0);
            }
        }
    }
    const cx1 = Math.round(camX / TILE1), cz1 = Math.round(camZ / TILE1);
    const range1 = Math.ceil(LOD1_DIST / TILE1) + 1;
    for (let dx = -range1; dx <= range1; dx++) {
        for (let dz = -range1; dz <= range1; dz++) {
            const tx = cx1 + dx, tz = cz1 + dz;
            const ox = tx*TILE1, oz = tz*TILE1;
            const clx = Math.max(ox, Math.min(camX, ox+TILE1));
            const clz = Math.max(oz, Math.min(camZ, oz+TILE1));
            const cd = Math.sqrt((clx-camX)**2+(clz-camZ)**2);
            if (cd < LOD0_DIST) continue;
            const fax = (ox+TILE1/2 - camX)**2 + (oz+TILE1/2 - camZ)**2;
            if (Math.sqrt(fax) > LOD1_DIST + 200) continue;
            const key = '1_'+tx+'_'+tz;
            needed.add(key);
            assignChunk(key, ox, oz, TILE1, SEGS1);
        }
    }
    for (const [k, s] of chunkMap) {
        if (!needed.has(k)) {
            chunkPool[s].key = null;
            chunkMap.delete(k);
        }
    }
    chunkCount = chunkMap.size;
}

// ============ WATER MESH ============
const WATER_SIZE = 4000, WATER_SEGS = 48, WATER_VP = WATER_SEGS+1;
const waterVerts = new Float32Array(WATER_VP*WATER_VP*3);
{
    let vi=0;
    for (let j=0;j<WATER_VP;j++) for(let i=0;i<WATER_VP;i++){
        waterVerts[vi++]=(i/WATER_SEGS-0.5)*WATER_SIZE;
        waterVerts[vi++]=0;
        waterVerts[vi++]=(j/WATER_SEGS-0.5)*WATER_SIZE;
    }
}
const waterIdx = new Uint32Array(WATER_SEGS*WATER_SEGS*6);
{
    let ii=0;
    for(let j=0;j<WATER_SEGS;j++) for(let i=0;i<WATER_SEGS;i++){
        const a=j*WATER_VP+i,b=a+1,c=a+WATER_VP,d=c+1;
        waterIdx[ii++]=a;waterIdx[ii++]=c;waterIdx[ii++]=b;
        waterIdx[ii++]=b;waterIdx[ii++]=c;waterIdx[ii++]=d;
    }
}
const waterVBO = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, waterVBO);
gl.bufferData(gl.ARRAY_BUFFER, waterVerts, gl.STATIC_DRAW);
const waterIBO = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, waterIBO);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, waterIdx, gl.STATIC_DRAW);

// ============ SKY MESH ============
const skyVBO = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, skyVBO);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
const skyIBO = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skyIBO);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2, 2,1,3]), gl.STATIC_DRAW);

// ============ DAY/NIGHT ============
function getDayParams(t) {
    const sunAngle = (t - 6) / 12 * Math.PI;
    const maxEl = 1.1;
    const el = Math.sin(sunAngle) * maxEl;
    const az = sunAngle;
    const sunDir = [
        Math.cos(el)*Math.sin(az),
        Math.sin(el),
        -Math.cos(el)*Math.cos(az)
    ];
    const sunEl = Math.asin(Math.max(-1, Math.min(1, sunDir[1])));
    const dayF = Math.max(0, Math.min(1, (sunEl + 0.1) / 0.4));
    const nightF = 1 - dayF;
    const sunsetF = Math.max(0, 1 - Math.abs(sunEl)/0.25) * (1-dayF);
    
    const sunInt = Math.max(0, Math.sin(sunEl)) * 1.2;
    const sunColor = [
        1.0,
        0.95 - sunsetF*0.35,
        0.8 - sunsetF*0.5
    ];
    
    const skyTopDay = [0.25, 0.5, 0.9];
    const skyTopNight = [0.01, 0.01, 0.04];
    const skyHorDay = [0.6, 0.78, 0.95];
    const skyHorNight = [0.02, 0.02, 0.06];
    const skyHorSunset = [0.85, 0.35, 0.08];
    
    const lerp3 = (a,b,t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
    let skyTop = lerp3(skyTopNight, skyTopDay, dayF);
    let skyHor = lerp3(skyHorNight, skyHorDay, dayF);
    skyHor = lerp3(skyHor, skyHorSunset, sunsetF*0.85);
    
    const ambCol = lerp3([0.04,0.04,0.08], [0.25,0.28,0.32], dayF);
    const fogCol = lerp3(skyHor, [0.1,0.1,0.15], 0.2);
    
    return { sunDir, sunInt, sunColor, skyTop, skyHor, ambCol, fogCol, nightF, sunsetF };
}

// ============ CAMERA ============
const CAM_MARGIN = 3;
function clampCamera() {
    const th = terrainHeight(camX, camZ);
    const minY = Math.max(th + CAM_MARGIN, CAM_MARGIN);
    if (camY < minY) camY = minY;
}

function updateCamera(dt) {
    if (autopilot) {
        const speed = 80;
        const fx = -Math.sin(camYaw)*Math.cos(camPitch);
        const fz = -Math.cos(camYaw)*Math.cos(camPitch);
        camX += fx*speed*dt;
        camZ += fz*speed*dt;
        const th = terrainHeight(camX, camZ);
        const targetY = th + 40;
        camY += (targetY - camY) * Math.min(1, dt*1.5);
        camPitch += (-0.12 - camPitch) * Math.min(1, dt*0.8);
        camYaw += Math.sin(animTime*0.08)*0.15*dt;
        clampCamera();
    } else {
        const acc = 150, damp = 5;
        const fx = -Math.sin(camYaw)*Math.cos(camPitch);
        const fy = Math.sin(camPitch);
        const fz = -Math.cos(camYaw)*Math.cos(camPitch);
        const rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
        let ax=0, ay=0, az=0;
        if (keys['KeyW']) { ax+=fx; ay+=fy; az+=fz; }
        if (keys['KeyS']) { ax-=fx; ay-=fy; az-=fz; }
        if (keys['KeyA']) { ax-=rx; az-=rz; }
        if (keys['KeyD']) { ax+=rx; az+=rz; }
        if (keys['KeyQ'] || keys['ShiftLeft']) { ay-=1; }
        if (keys['KeyE'] || keys['Space']) { ay+=1; }
        const len = Math.sqrt(ax*ax+ay*ay+az*az);
        if (len > 0) { ax/=len; ay/=len; az/=len; }
        camVX += ax*acc*dt; camVY += ay*acc*dt; camVZ += az*acc*dt;
        camVX -= camVX*damp*dt; camVY -= camVY*damp*dt; camVZ -= camVZ*damp*dt;
        camX += camVX*dt; camY += camVY*dt; camZ += camVZ*dt;
        clampCamera();
    }
}

// ============ RESIZE ============
function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
    }
}

// ============ RENDER ============
const FOV = 1.2;
function render() {
    resize();
    const aspect = canvas.width / canvas.height;
    const proj = m4persp(FOV, aspect, 0.5, 5000);
    const view = m4view(camX, camY, camZ, camYaw, camPitch);
    const mvp = m4mul(proj, view);
    
    const dp = getDayParams(timeOfDay);
    
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Sky
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.useProgram(skyProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, skyVBO);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skyIBO);
    gl.uniform3fv(sU.uSunDir, dp.sunDir);
    gl.uniform1f(sU.uSunInt, dp.sunInt);
    gl.uniform1f(sU.uNight, dp.nightF);
    gl.uniform3fv(sU.uSkyTop, dp.skyTop);
    gl.uniform3fv(sU.uSkyHor, dp.skyHor);
    const cy=Math.cos(camYaw),sy=Math.sin(camYaw),cp=Math.cos(camPitch),sp=Math.sin(camPitch);
    gl.uniform3f(sU.uCamR, cy, 0, -sy);
    gl.uniform3f(sU.uCamU, sy*sp, cp, cy*sp);
    gl.uniform3f(sU.uCamF, -sy*cp, sp, -cy*cp);
    gl.uniform1f(sU.uFovT, Math.tan(FOV/2));
    gl.uniform1f(sU.uAsp, aspect);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
    // Terrain
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.useProgram(terrainProg);
    gl.uniformMatrix4fv(tU.uMVP, false, mvp);
    gl.uniform3fv(tU.uSunDir, dp.sunDir);
    gl.uniform3fv(tU.uSunColor, dp.sunColor);
    gl.uniform1f(tU.uSunInt, dp.sunInt);
    gl.uniform3fv(tU.uAmbCol, dp.ambCol);
    gl.uniform3fv(tU.uFogCol, dp.fogCol);
    gl.uniform1f(tU.uFogD, 0.0006);
    gl.uniform3f(tU.uCamPos, camX, camY, camZ);
    
    let triTotal = 0;
    for (let i = 0; i < MAX_CHUNKS; i++) {
        const ch = chunkPool[i];
        if (ch.key === null) continue;
        gl.bindBuffer(gl.ARRAY_BUFFER, ch.vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ch.ibo);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 36, 12);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 36, 24);
        gl.drawElements(gl.TRIANGLES, ch.count, gl.UNSIGNED_INT, 0);
        triTotal += ch.count / 3;
    }
    
    // Water
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.useProgram(waterProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, waterVBO);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, waterIBO);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    gl.uniformMatrix4fv(wU.uMVP, false, mvp);
    gl.uniform3f(wU.uOff, camX, 0, camZ);
    gl.uniform3fv(wU.uSunDir, dp.sunDir);
    gl.uniform3fv(wU.uSunColor, dp.sunColor);
    gl.uniform1f(wU.uSunInt, dp.sunInt);
    gl.uniform3fv(wU.uFogCol, dp.fogCol);
    gl.uniform1f(wU.uFogD, 0.0006);
    gl.uniform3f(wU.uCamPos, camX, camY, camZ);
    gl.uniform1f(wU.uTime, frozen ? 0 : animTime);
    gl.uniform3fv(wU.uSkyHor, dp.skyHor);
    gl.uniform3fv(wU.uSkyTop, dp.skyTop);
    gl.drawElements(gl.TRIANGLES, waterIdx.length, gl.UNSIGNED_INT, 0);
    triTotal += waterIdx.length / 3;
    
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    
    triCount = triTotal;
}

// ============ MAIN LOOP ============
function loop(t) {
    requestAnimationFrame(loop);
    const dt = Math.min((t - lastT) / 1000, 0.05);
    lastT = t;
    
    fpsCnt++;
    fpsTimer += dt;
    if (fpsTimer >= 0.5) {
        fpsDisplay = Math.round(fpsCnt / fpsTimer);
        document.getElementById('fps').textContent = fpsDisplay + ' FPS';
        fpsCnt = 0; fpsTimer = 0;
    }
    
    if (!frozen) {
        animTime += dt;
        timeOfDay = (timeOfDay + dt * 24 / 120) % 24;
        document.getElementById('time').value = timeOfDay;
    }
    
    updateCamera(frozen && !autopilot ? 0 : dt);
    if (frozen && autopilot) { /* no movement */ }
    
    updateChunks();
    render();
}

// ============ INPUT ============
document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyF') {
        autopilot = !autopilot;
        document.getElementById('ap').textContent = autopilot ? 'AUTOPILOT' : 'MANUAL';
        document.getElementById('ap').style.color = autopilot ? 'rgba(100,255,100,0.8)' : 'rgba(255,100,100,0.8)';
    }
    if (['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','Space'].includes(e.code)) e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

canvas.addEventListener('mousedown', e => {
    mouseDown = true; mouseLX = e.clientX; mouseLY = e.clientY;
});
document.addEventListener('mousemove', e => {
    if (!mouseDown) return;
    const dx = e.clientX - mouseLX, dy = e.clientY - mouseLY;
    mouseLX = e.clientX; mouseLY = e.clientY;
    camYaw -= dx * 0.003;
    camPitch += dy * 0.003;
    camPitch = Math.max(-1.4, Math.min(1.4, camPitch));
});
document.addEventListener('mouseup', () => { mouseDown = false; });

// UI
document.getElementById('time').addEventListener('input', e => {
    timeOfDay = parseFloat(e.target.value);
});
document.getElementById('seed').addEventListener('change', e => {
    const v = parseInt(e.target.value) || 0;
    setSeed(v);
});

function setSeed(n) {
    seed = n | 0;
    document.getElementById('seed').value = seed;
    chunkMap.forEach((s, k) => { chunkPool[s].key = null; });
    chunkMap.clear();
}

// ============ GRADER API ============
window.__arena = {
    freeze(on) { frozen = !!on; },
    setSeed(n) { setSeed(n | 0); },
    setTime(h) {
        timeOfDay = ((h % 24) + 24) % 24;
        document.getElementById('time').value = timeOfDay;
    },
    setCamera({x, y, z, yaw, pitch}) {
        camX = x; camZ = z; camYaw = yaw; camPitch = pitch;
        const th = terrainHeight(x, z);
        camY = Math.max(y, th + CAM_MARGIN, CAM_MARGIN);
        camVX = 0; camVY = 0; camVZ = 0;
    },
    getCamera() {
        return { x: camX, y: camY, z: camZ, yaw: camYaw, pitch: camPitch };
    },
    terrainHeight(x, z) { return terrainHeight(x, z); },
    stats() { return { chunks: chunkCount, triangles: triCount }; }
};

// ============ INIT ============
resize();
window.addEventListener('resize', resize);
lastT = performance.now();
requestAnimationFrame(loop);
</script>
</body>
</html>
```