```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Horizon</title>
<style>
  html,body{margin:0;height:100%;overflow:hidden;background:#000;font-family:"Segoe UI",Helvetica,Arial,sans-serif;color:#eef3f8;user-select:none}
  #c{position:fixed;inset:0;width:100vw;height:100vh;display:block}
  #ui{position:fixed;top:14px;left:14px;padding:12px 14px;background:rgba(8,14,22,0.42);backdrop-filter:blur(6px);border-radius:10px;font-size:13px;min-width:250px;box-shadow:0 4px 18px rgba(0,0,0,0.25)}
  #ui .title{font-weight:700;letter-spacing:.28em;font-size:14px;margin-bottom:8px;opacity:.9}
  #ui .row{display:flex;align-items:center;gap:8px;margin:6px 0}
  #ui label{opacity:.8;min-width:44px}
  #time{flex:1;accent-color:#ffb36b}
  #timeLbl{width:46px;text-align:right;font-variant-numeric:tabular-nums}
  #seed{width:110px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);color:#fff;border-radius:6px;padding:3px 6px;font-size:13px}
  #ap{margin-top:6px;font-size:11px;letter-spacing:.16em;opacity:.85}
  #ap.on{color:#9be58a}
  #ap.off{color:#ffb0a0}
  #fps{position:absolute;right:-70px;top:0;font-size:11px;opacity:.7;font-variant-numeric:tabular-nums}
  #hint{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);font-size:12px;opacity:.6;background:rgba(0,0,0,0.25);padding:6px 12px;border-radius:8px;white-space:nowrap}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="ui">
  <div class="title">HORIZON</div>
  <div class="row"><label for="time">Time</label><input id="time" type="range" min="0" max="24" step="0.01" value="10"><span id="timeLbl">10:00</span></div>
  <div class="row"><label for="seed">Seed</label><input id="seed" type="number" value="1337"></div>
  <div class="row" style="justify-content:space-between"><span id="ap" class="on">AUTOPILOT ON</span><span id="fps">-- fps</span></div>
</div>
<div id="hint">W A S D move &nbsp;·&nbsp; Q/E or Shift/Space down/up &nbsp;·&nbsp; drag to look &nbsp;·&nbsp; F autopilot</div>

<script>
'use strict';

// ---------------- small math helpers ----------------
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const smoothstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const lerpV=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const normV=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];};

const MAT={
  perspective(fovy,aspect,near,far){
    const f=1/Math.tan(fovy/2),nf=1/(near-far);
    return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0]);
  },
  lookAt(e,c,u){
    let zx=e[0]-c[0],zy=e[1]-c[1],zz=e[2]-c[2];
    let l=Math.hypot(zx,zy,zz); zx/=l;zy/=l;zz/=l;
    let xx=u[1]*zz-u[2]*zy, xy=u[2]*zx-u[0]*zz, xz=u[0]*zy-u[1]*zx;
    l=Math.hypot(xx,xy,xz); xx/=l;xy/=l;xz/=l;
    const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
    return new Float32Array([
      xx,yx,zx,0,
      xy,yy,zy,0,
      xz,yz,zz,0,
      -(xx*e[0]+xy*e[1]+xz*e[2]), -(yx*e[0]+yy*e[1]+yz*e[2]), -(zx*e[0]+zy*e[1]+zz*e[2]), 1
    ]);
  },
  mul(a,b){
    const o=new Float32Array(16);
    for(let c=0;c<4;c++)for(let r=0;r<4;r++){
      let s=0; for(let k=0;k<4;k++) s+=a[k*4+r]*b[c*4+k];
      o[c*4+r]=s;
    }
    return o;
  }
};

// ---------------- deterministic noise ----------------
let PERM=0;
function mixSeed(s){
  let h=(s|0)^0x9e3779b9;
  h=Math.imul(h^(h>>>16),0x45d9f3b);
  h=Math.imul(h^(h>>>16),0x45d9f3b);
  return (h^(h>>>16))|0;
}
function hash2(x,y){
  let h=Math.imul(x,0x27d4eb2d)^Math.imul(y+PERM,0x165667b1)^PERM;
  h=Math.imul(h^(h>>>15),0x85ebca6b);
  h=Math.imul(h^(h>>>13),0xc2b2ae35);
  h^=h>>>16;
  return (h>>>0)*(1/4294967296);
}
function gdot(ix,iy,dx,dy){
  const a=hash2(ix,iy)*6.283185307;
  return Math.cos(a)*dx+Math.sin(a)*dy;
}
function gnoise(x,y){
  const xi=Math.floor(x),yi=Math.floor(y);
  const xf=x-xi,yf=y-yi;
  const u=xf*xf*xf*(xf*(xf*6-15)+10);
  const v=yf*yf*yf*(yf*(yf*6-15)+10);
  const n00=gdot(xi,yi,xf,yf), n10=gdot(xi+1,yi,xf-1,yf);
  const n01=gdot(xi,yi+1,xf,yf-1), n11=gdot(xi+1,yi+1,xf-1,yf-1);
  return n00+u*(n10-n00)+v*(n01-n00)+u*v*(n00-n10-n01+n11);
}
function fbm(x,y,o){
  let s=0,a=0.5,f=1;
  for(let i=0;i<o;i++){
    s+=a*gnoise(x*f+i*17.1,y*f-i*9.3);
    f*=2.02; a*=0.5;
  }
  return s;
}
function ridged(x,y,o){
  let s=0,a=0.5,f=1,w=1;
  for(let i=0;i<o;i++){
    let n=gnoise(x*f+i*5.3,y*f-i*3.1);
    n=1-Math.abs(n)*1.6;
    n=n*n*w;
    w=clamp(n*2,0,1);
    s+=n*a; a*=0.5; f*=2.03;
  }
  return s;
}
// Terrain height: domain-warped continents + ridged mountains + hills
function terrainH(x,z){
  const wx=fbm(x*0.0006,z*0.0006+4.0,3), wz=fbm(x*0.0006+9.0,z*0.0006,3);
  const qx=x+260*wx, qz=z+260*wz;
  const c=fbm(qx*0.0007,qz*0.0007,5);
  const base=c*280;
  const mm=smoothstep(-0.05,0.25,fbm(qx*0.0012+11,qz*0.0012,3));
  const r=ridged(qx*0.0042,qz*0.0042,5);
  let h=base+mm*r*r*300+fbm(qx*0.015,qz*0.015,3)*12;
  if(h<0) h*=0.4;
  return h;
}

// ---------------- GL setup ----------------
const canvas=document.getElementById('c');
const gl=canvas.getContext('webgl',{antialias:true,alpha:false});
if(!gl){ document.body.textContent='WebGL is not available in this browser.'; }

function compile(type,src){
  const s=gl.createShader(type);
  gl.shaderSource(s,src); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
  return s;
}
function program(vs,fs){
  const p=gl.createProgram();
  gl.attachShader(p,compile(gl.VERTEX_SHADER,vs));
  gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fs));
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(p));
  return p;
}

const TVS=`
attribute vec3 aPos; attribute vec3 aN;
uniform mat4 uVP;
varying vec3 vW; varying vec3 vN;
void main(){ vW=aPos; vN=aN; gl_Position=uVP*vec4(aPos,1.0); }`;

const TFS=`
precision highp float;
varying vec3 vW; varying vec3 vN;
uniform vec3 uEye; uniform vec3 uLD; uniform vec3 uLC; uniform vec3 uAmb; uniform vec3 uGA; uniform vec3 uFog;
float h21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float vn(vec2 p){
  vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1.0,0.0)),u.x), mix(h21(i+vec2(0.0,1.0)),h21(i+vec2(1.0,1.0)),u.x), u.y);
}
void main(){
  vec3 n=normalize(vN);
  float y=vW.y;
  float det=vn(vW.xz*0.04)*0.65+vn(vW.xz*0.35)*0.35;
  vec3 grass=mix(vec3(0.18,0.32,0.10),vec3(0.36,0.42,0.16),det);
  vec3 rock=mix(vec3(0.34,0.31,0.29),vec3(0.52,0.48,0.44),det);
  vec3 sand=vec3(0.80,0.72,0.54)*(0.92+0.08*det);
  vec3 snow=vec3(0.94,0.96,1.0);
  float slope=1.0-n.y;
  vec3 col=grass;
  float rw=max(smoothstep(0.30,0.55,slope), smoothstep(150.0,230.0,y+(det-0.5)*60.0)*0.7);
  col=mix(col,rock,clamp(rw,0.0,1.0));
  float sw=smoothstep(235.0,275.0,y+(det-0.5)*50.0)*smoothstep(0.6,0.85,n.y);
  col=mix(col,snow,sw);
  float sandW=1.0-smoothstep(1.5,4.5,y+(det-0.5)*2.5);
  col=mix(col,sand,sandW);
  float ndl=max(dot(n,uLD),0.0);
  vec3 amb=mix(uGA,uAmb,0.5+0.5*n.y);
  vec3 lit=col*(amb+uLC*ndl);
  if(y<0.0){
    float dep=-y;
    vec3 wc=vec3(0.02,0.14,0.18)*(uAmb*2.0+uLC*0.4);
    lit=mix(lit*vec3(0.7,0.95,1.0), wc, 1.0-exp(-dep*0.09));
  }
  float d=length(vW-uEye);
  float f=1.0-exp(-pow(d*0.00055,2.0));
  f=max(f,smoothstep(2600.0,3000.0,d));
  gl_FragColor=vec4(mix(lit,uFog,clamp(f,0.0,1.0)),1.0);
}`;

const SVS=`
attribute vec2 aP; varying vec2 vUv;
void main(){ vUv=aP; gl_Position=vec4(aP,0.999,1.0); }`;

const SFS=`
precision highp float;
varying vec2 vUv;
uniform vec3 uF; uniform vec3 uR; uniform vec3 uU; uniform float uTy; uniform float uAsp;
uniform vec3 uSun; uniform vec3 uMoon; uniform vec3 uSC; uniform vec3 uHor; uniform vec3 uZen;
uniform float uNight; uniform float uT;
float h21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float h31(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
float vn(vec2 p){
  vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1.0,0.0)),u.x), mix(h21(i+vec2(0.0,1.0)),h21(i+vec2(1.0,1.0)),u.x), u.y);
}
float fbm(vec2 p){ return 0.5*vn(p)+0.25*vn(p*2.03)+0.125*vn(p*4.07)+0.0625*vn(p*8.1); }
void main(){
  vec3 d=normalize(uF+vUv.x*uAsp*uTy*uR+vUv.y*uTy*uU);
  float h=d.y;
  vec3 col = h>0.0 ? mix(uHor,uZen,pow(h,0.5)) : uHor*mix(1.0,0.3,min(-h*6.0,1.0));
  float sd=dot(d,uSun);
  col+=uSC*(pow(max(sd,0.0),6.0)*0.25+pow(max(sd,0.0),80.0)*0.5);
  vec3 disk=vec3(1.0,0.96,0.86)*1.5;
  col=mix(col,disk,smoothstep(0.9994,0.9997,sd)*smoothstep(-0.03,0.0,uSun.y));
  float md=dot(d,uMoon);
  col+=vec3(0.7,0.78,1.0)*pow(max(md,0.0),300.0)*0.25*uNight*smoothstep(0.0,0.05,uMoon.y);
  col=mix(col,vec3(0.9,0.94,1.0)*1.3,smoothstep(0.9993,0.9996,md)*uNight*smoothstep(0.0,0.02,uMoon.y));
  if(h>0.0 && uNight>0.0){
    vec3 g=floor(d*260.0);
    float r=h31(g);
    float s=step(0.9955,r)*(0.4+0.6*r);
    vec3 fr=fract(d*260.0)-0.5;
    float dotm=smoothstep(0.35,0.0,length(fr));
    float tw=0.75+0.25*sin(uT*2.0+r*60.0);
    col+=vec3(0.8,0.88,1.0)*s*dotm*tw*uNight*smoothstep(0.02,0.25,h);
  }
  if(h>0.0){
    vec2 p=d.xz/(h+0.25)*1.1+vec2(uT*0.012,uT*0.004);
    float c=fbm(p);
    float cov=smoothstep(0.5,0.75,c)*smoothstep(0.0,0.25,h);
    vec3 cl=mix(uHor,uSC+uHor*0.5,0.5);
    col=mix(col,cl,cov*0.85);
  }
  gl_FragColor=vec4(col,1.0);
}`;

const WVS=`
attribute vec2 aP; uniform mat4 uVP; uniform vec3 uC; uniform float uR; varying vec3 vW;
void main(){
  vW=vec3(uC.x+aP.x*uR,0.0,uC.z+aP.y*uR);
  gl_Position=uVP*vec4(vW,1.0);
}`;

const WFS=`
precision highp float;
varying vec3 vW;
uniform vec3 uEye; uniform vec3 uLD; uniform vec3 uLC; uniform vec3 uAmb; uniform vec3 uFog;
uniform vec3 uHor; uniform vec3 uZen; uniform float uT;
void main(){
  vec2 p=vW.xz; float t=uT;
  vec2 g=vec2(0.0);
  vec2 d1=vec2(0.8,0.6), d2=vec2(-0.3,0.95), d3=vec2(0.95,-0.25), d4=vec2(-0.6,-0.8);
  g+=d1*1.0*0.09*cos(dot(d1,p)*0.09+t*0.9);
  g+=d2*0.6*0.14*cos(dot(d2,p)*0.14+t*1.1);
  g+=d3*0.45*0.23*cos(dot(d3,p)*0.23+t*1.4);
  g+=d4*0.3*0.45*cos(dot(d4,p)*0.45+t*1.8);
  g+=d1*0.08*1.3*cos(dot(d1,p)*1.3+t*2.5);
  g+=d2*0.05*2.1*cos(dot(d2,p)*2.1+t*3.1);
  vec3 n=normalize(vec3(-g.x,1.0,-g.y));
  vec3 v=normalize(uEye-vW);
  float ndv=max(dot(n,v),0.0);
  float F=0.02+0.98*pow(1.0-ndv,5.0);
  vec3 r=reflect(-v,n);
  vec3 sky=mix(uHor,uZen,pow(max(r.y,0.0),0.5));
  float sd=max(dot(r,uLD),0.0);
  sky+=uLC*(pow(sd,400.0)*8.0+pow(sd,16.0)*0.12);
  vec3 deep=vec3(0.01,0.06,0.09)*(uAmb*2.0+uLC*0.3)+vec3(0.0,0.01,0.015);
  vec3 col=mix(deep,sky,clamp(F*1.3+0.1,0.0,0.95));
  float alpha=clamp(0.6+F,0.0,0.97);
  float d=length(vW-uEye);
  float f=1.0-exp(-pow(d*0.00055,2.0));
  f=max(f,smoothstep(2600.0,3000.0,d));
  col=mix(col,uFog,f);
  alpha=mix(alpha,1.0,f);
  gl_FragColor=vec4(col,alpha);
}`;

const terrainProg=program(TVS,TFS);
const skyProg=program(SVS,SFS);
const waterProg=program(WVS,WFS);

const TU={};
['uVP','uEye','uLD','uLC','uAmb','uGA','uFog'].forEach(n=>TU[n]=gl.getUniformLocation(terrainProg,n));
const SU={};
['uF','uR','uU','uTy','uAsp','uSun','uMoon','uSC','uHor','uZen','uNight','uT'].forEach(n=>SU[n]=gl.getUniformLocation(skyProg,n));
const WU={};
['uVP','uC','uR','uEye','uLD','uLC','uAmb','uFog','uHor','uZen','uT'].forEach(n=>WU[n]=gl.getUniformLocation(waterProg,n));

const T_aPos=gl.getAttribLocation(terrainProg,'aPos');
const T_aN=gl.getAttribLocation(terrainProg,'aN');
const S_aP=gl.getAttribLocation(skyProg,'aP');
const W_aP=gl.getAttribLocation(waterProg,'aP');

// fullscreen triangle for sky
const skyVB=gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,skyVB);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
// water quad
const waterVB=gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,waterVB);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);

// ---------------- terrain chunks (clipmap-style LOD) ----------------
const N=16, W=N+1, K=6, LEVELS=5;
const chunks=new Map();
let lastTris=0;

function buildChunk(L,ix,iz){
  const S=32<<L, cell=S/N, x0=ix*S, z0=iz*S;
  const H=new Float32Array(W*W);
  for(let j=0;j<W;j++)for(let i=0;i<W;i++) H[j*W+i]=terrainH(x0+i*cell,z0+j*cell);
  const hAt=(i,j)=>H[j*W+i];
  const nv=W*W+4*N;
  const V=new Float32Array(nv*6);
  for(let j=0;j<W;j++)for(let i=0;i<W;i++){
    const k=j*W+i;
    const i0=Math.max(i-1,0),i1=Math.min(i+1,N),j0=Math.max(j-1,0),j1=Math.min(j+1,N);
    const dx=(hAt(i1,j)-hAt(i0,j))/((i1-i0)*cell);
    const dz=(hAt(i,j1)-hAt(i,j0))/((j1-j0)*cell);
    const n=normV([-dx,1,-dz]);
    const o=k*6;
    V[o]=x0+i*cell; V[o+1]=H[k]; V[o+2]=z0+j*cell;
    V[o+3]=n[0]; V[o+4]=n[1]; V[o+5]=n[2];
  }
  // perimeter loop (4N points)
  const P=[];
  for(let i=0;i<N;i++) P.push(i);
  for(let j=0;j<N;j++) P.push(j*W+N);
  for(let i=N;i>0;i--) P.push(N*W+i);
  for(let j=N;j>0;j--) P.push(j*W);
  const M4=P.length;
  const depth=cell*4+4;
  const skirtBase=W*W;
  for(let k=0;k<M4;k++){
    const src=P[k]*6, dst=(skirtBase+k)*6;
    for(let c=0;c<6;c++) V[dst+c]=V[src+c];
    V[dst+1]-=depth;
  }
  const I=new Uint16Array(N*N*6+M4*6);
  let p=0;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const v00=j*W+i, v10=v00+1, v01=v00+W, v11=v01+1;
    I[p++]=v00; I[p++]=v01; I[p++]=v10;
    I[p++]=v10; I[p++]=v01; I[p++]=v11;
  }
  for(let k=0;k<M4;k++){
    const a=P[k], b=P[(k+1)%M4], sa=skirtBase+k, sb=skirtBase+((k+1)%M4);
    I[p++]=a; I[p++]=b; I[p++]=sb;
    I[p++]=a; I[p++]=sb; I[p++]=sa;
  }
  const vb=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,vb);
  gl.bufferData(gl.ARRAY_BUFFER,V,gl.STATIC_DRAW);
  const ib=gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,I,gl.STATIC_DRAW);
  return {vb,ib,n:I.length};
}

let drawKeys=[];
function updateChunks(camX,camZ,budgetMs){
  const list=[];
  const cov=[];
  for(let L=0;L<LEVELS;L++){
    const C=32<<L;
    const bx=2*Math.floor(camX/(2*C)), bz=2*Math.floor(camZ/(2*C));
    cov[L]={x0:(bx-K)*C,x1:(bx+K)*C,z0:(bz-K)*C,z1:(bz+K)*C};
    for(let a=-K;a<K;a++)for(let b=-K;b<K;b++){
      const ix=bx+a, iz=bz+b;
      if(L>0){
        const c=cov[L-1];
        const cx=(ix+0.5)*C, cz=(iz+0.5)*C;
        if(cx>c.x0&&cx<c.x1&&cz>c.z0&&cz<c.z1) continue;
      }
      list.push([L,ix,iz]);
    }
  }
  const need=new Set();
  const keys=[];
  const t0=performance.now();
  for(const [L,ix,iz] of list){
    const key=L+':'+ix+':'+iz;
    need.add(key); keys.push(key);
    if(!chunks.has(key)){
      if(budgetMs===Infinity || performance.now()-t0<budgetMs){
        chunks.set(key,buildChunk(L,ix,iz));
      }
    }
  }
  for(const [key,c] of chunks){
    if(!need.has(key)){
      gl.deleteBuffer(c.vb); gl.deleteBuffer(c.ib);
      chunks.delete(key);
    }
  }
  drawKeys=keys;
}

function clearChunks(){
  for(const c of chunks.values()){ gl.deleteBuffer(c.vb); gl.deleteBuffer(c.ib); }
  chunks.clear();
}

// ---------------- environment (time of day) ----------------
function env(t){
  const a=(t-6)/24*Math.PI*2;
  const sun=normV([Math.cos(a)*0.8, Math.sin(a), Math.cos(a)*0.4]);
  const moon=[-sun[0],-sun[1],-sun[2]];
  const sy=sun[1];
  const dayF=smoothstep(-0.12,0.22,sy);
  const night=1-dayF;
  const warm=Math.exp(-(sy*sy)/0.06);
  const hiF=smoothstep(0.0,0.5,sy);
  const glow=[1.0,0.42,0.18];
  const zen=lerpV([0.005,0.01,0.03],[0.18,0.42,0.88],dayF);
  let hor=lerpV([0.03,0.04,0.08],[0.6,0.76,0.9],dayF);
  hor=hor.map((v,i)=>v+glow[i]*warm*0.5);
  const sunLow=[1.0,0.5,0.25], sunHigh=[1.0,0.96,0.88];
  const sunC=lerpV(sunLow,sunHigh,hiF).map(v=>v*1.2);
  const moonC=[0.2,0.27,0.45].map(v=>v*0.5);
  const light=lerpV(moonC,sunC,dayF);
  const amb=lerpV([0.035,0.045,0.08],[0.36,0.44,0.56],dayF).map((v,i)=>v+glow[i]*warm*0.04);
  const gam=lerpV([0.01,0.012,0.02],[0.14,0.12,0.10],dayF);
  const ld=normV([
    moon[0]+(sun[0]-moon[0])*dayF,
    moon[1]+(sun[1]-moon[1])*dayF,
    moon[2]+(sun[2]-moon[2])*dayF]);
  return {sun,moon,ld,light,amb,gam,zen,hor,night,sunC};
}

// ---------------- camera & state ----------------
let frozen=false;
let simT=0;           // simulated time (does not advance when frozen)
let time=10;          // hours
let autoOn=true;
let seed=1337;
const cam={x:0,y:80,z:0,yaw:0,pitch:-0.1};
let vel=[0,0,0];
const keys={};
let aspect=1;

function minY(x,z){ return Math.max(terrainH(x,z)+3,2.5); }
function clampCam(){
  cam.y=Math.max(cam.y,minY(cam.x,cam.z));
  cam.pitch=clamp(cam.pitch,-1.4,1.4);
}

function autopilot(dt){
  cam.yaw+=(0.07*Math.sin(simT*0.11)+0.03*Math.sin(simT*0.31+1.3))*dt;
  const sp=45;
  cam.x+=Math.sin(cam.yaw)*sp*dt;
  cam.z-=Math.cos(cam.yaw)*sp*dt;
  let tgt=-1e9;
  for(const d of [0,60,140,240,380]){
    const px=cam.x+Math.sin(cam.yaw)*d, pz=cam.z-Math.cos(cam.yaw)*d;
    tgt=Math.max(tgt,terrainH(px,pz));
  }
  tgt=Math.max(tgt+40,minY(cam.x,cam.z));
  const k=tgt>cam.y ? 1-Math.exp(-dt*3) : 1-Math.exp(-dt*0.9);
  cam.y+=(tgt-cam.y)*k;
  const tp=-0.1+0.05*Math.sin(simT*0.25);
  cam.pitch+=(tp-cam.pitch)*(1-Math.exp(-dt*2));
}

function manual(dt){
  const cy=Math.cos(cam.yaw), sy=Math.sin(cam.yaw);
  const cp=Math.cos(cam.pitch), sp=Math.sin(cam.pitch);
  const f=[sy*cp,sp,-cy*cp], r=[cy,0,sy];
  let fw=0,rt=0,up=0;
  if(keys.KeyW) fw+=1;
  if(keys.KeyS) fw-=1;
  if(keys.KeyD) rt+=1;
  if(keys.KeyA) rt-=1;
  if(keys.KeyE||keys.Space) up+=1;
  if(keys.KeyQ||keys.ShiftLeft||keys.ShiftRight) up-=1;
  const any=(fw||rt||up)!==0;
  if(!any && frozen){ vel=[0,0,0]; return; }
  let w=[fw*f[0]+rt*r[0], fw*f[1]+up, fw*f[2]+rt*r[2]];
  const l=Math.hypot(w[0],w[1],w[2]);
  if(l>1){ w=[w[0]/l,w[1]/l,w[2]/l]; }
  const target=[w[0]*90,w[1]*90,w[2]*90];
  const k=1-Math.exp(-dt*(any?6:4));
  for(let i=0;i<3;i++) vel[i]+=(target[i]-vel[i])*k;
  cam.x+=vel[0]*dt; cam.y+=vel[1]*dt; cam.z+=vel[2]*dt;
}

// ---------------- seed ----------------
function applySeed(s){
  seed=(s|0);
  PERM=mixSeed(seed);
  clearChunks();
  seedEl.value=String(seed);
  updateChunks(cam.x,cam.z,Infinity);
}

// ---------------- rendering ----------------
let proj=null, view=null;
function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,1.5);
  const w=Math.max(1,Math.floor(innerWidth*dpr)), h=Math.max(1,Math.floor(innerHeight*dpr));
  if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; }
  gl.viewport(0,0,w,h);
  aspect=w/h;
}

function render(E){
  resize();
  const fovY=60*Math.PI/180;
  const tanY=Math.tan(fovY/2);
  proj=MAT.perspective(fovY,aspect,1.0,8000.0);
  const cy=Math.cos(cam.yaw), sy=Math.sin(cam.yaw);
  const cp=Math.cos(cam.pitch), sp=Math.sin(cam.pitch);
  const F=[sy*cp,sp,-cy*cp];
  const R=[cy,0,sy];
  const U=[-sy*sp, sy*F[0]-cy*F[2], cy*sp]; // right x forward
  const eye=[cam.x,cam.y,cam.z];
  const center=[cam.x+F[0],cam.y+F[1],cam.z+F[2]];
  view=MAT.lookAt(eye,center,[0,1,0]);
  const vp=MAT.mul(proj,view);

  gl.clearColor(E.hor[0],E.hor[1],E.hor[2],1);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

  // sky
  gl.disable(gl.DEPTH_TEST);
  gl.useProgram(skyProg);
  gl.bindBuffer(gl.ARRAY_BUFFER,skyVB);
  gl.enableVertexAttribArray(S_aP);
  gl.vertexAttribPointer(S_aP,2,gl.FLOAT,false,0,0);
  gl.uniform3fv(SU.uF,F); gl.uniform3fv(SU.uR,R); gl.uniform3fv(SU.uU,U);
  gl.uniform1f(SU.uTy,tanY); gl.uniform1f(SU.uAsp,aspect);
  gl.uniform3fv(SU.uSun,E.sun); gl.uniform3fv(SU.uMoon,E.moon);
  gl.uniform3fv(SU.uSC,E.light); gl.uniform3fv(SU.uHor,E.hor); gl.uniform3fv(SU.uZen,E.zen);
  gl.uniform1f(SU.uNight,E.night); gl.uniform1f(SU.uT,simT);
  gl.drawArrays(gl.TRIANGLES,0,3);
  gl.disableVertexAttribArray(S_aP);

  // terrain
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.useProgram(terrainProg);
  gl.uniformMatrix4fv(TU.uVP,false,vp);
  gl.uniform3fv(TU.uEye,eye);
  gl.uniform3fv(TU.uLD,E.ld);
  gl.uniform3fv(TU.uLC,E.light);
  gl.uniform3fv(TU.uAmb,E.amb);
  gl.uniform3fv(TU.uGA,E.gam);
  gl.uniform3fv(TU.uFog,E.hor);
  gl.enableVertexAttribArray(T_aPos);
  gl.enableVertexAttribArray(T_aN);
  let tris=0;
  for(const key of drawKeys){
    const c=chunks.get(key);
    if(!c) continue;
    gl.bindBuffer(gl.ARRAY_BUFFER,c.vb);
    gl.vertexAttribPointer(T_aPos,3,gl.FLOAT,false,24,0);
    gl.vertexAttribPointer(T_aN,3,gl.FLOAT,false,24,12);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,c.ib);
    gl.drawElements(gl.TRIANGLES,c.n,gl.UNSIGNED_SHORT,0);
    tris+=c.n/3;
  }
  gl.disableVertexAttribArray(T_aPos);
  gl.disableVertexAttribArray(T_aN);

  // water
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);
  gl.useProgram(waterProg);
  gl.bindBuffer(gl.ARRAY_BUFFER,waterVB);
  gl.enableVertexAttribArray(W_aP);
  gl.vertexAttribPointer(W_aP,2,gl.FLOAT,false,0,0);
  gl.uniformMatrix4fv(WU.uVP,false,vp);
  gl.uniform3fv(WU.uC,[cam.x,0,cam.z]);
  gl.uniform1f(WU.uR,12000);
  gl.uniform3fv(WU.uEye,eye);
  gl.uniform3fv(WU.uLD,E.ld);
  gl.uniform3fv(WU.uLC,E.light);
  gl.uniform3fv(WU.uAmb,E.amb);
  gl.uniform3fv(WU.uFog,E.hor);
  gl.uniform3fv(WU.uHor,E.hor);
  gl.uniform3fv(WU.uZen,E.zen);
  gl.uniform1f(WU.uT,simT);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  gl.disableVertexAttribArray(W_aP);
  gl.depthMask(true);
  gl.disable(gl.BLEND);
  tris+=2;
  lastTris=Math.round(tris);
}

// ---------------- UI ----------------
const timeEl=document.getElementById('time');
const timeLbl=document.getElementById('timeLbl');
const seedEl=document.getElementById('seed');
const apEl=document.getElementById('ap');
const fpsEl=document.getElementById('fps');

function updateAP(){
  apEl.textContent=autoOn?'AUTOPILOT ON':'AUTOPILOT OFF';
  apEl.className=autoOn?'on':'off';
}
function showTime(){
  const h=Math.floor(time), m=Math.floor((time-h)*60);
  timeLbl.textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
  timeEl.value=String(time);
}

timeEl.addEventListener('input',()=>{ time=parseFloat(timeEl.value)||0; showTime(); });
seedEl.addEventListener('change',()=>{ applySeed(parseInt(seedEl.value,10)||0); });

function isNumberInput(e){ return e.target && e.target.tagName==='INPUT' && e.target.type==='number'; }
window.addEventListener('keydown',e=>{
  if(isNumberInput(e)) return;
  if(e.code==='Space'||e.code.startsWith('Arrow')) e.preventDefault();
  keys[e.code]=true;
  if(e.code==='KeyF' && !e.repeat){ autoOn=!autoOn; updateAP(); }
});
window.addEventListener('keyup',e=>{ keys[e.code]=false; });
window.addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; });

// mouse drag look
let dragging=false, lastX=0, lastY=0;
window.addEventListener('pointerdown',e=>{
  if(e.target.closest && e.target.closest('#ui')) return;
  dragging=true; lastX=e.clientX; lastY=e.clientY;
});
window.addEventListener('pointermove',e=>{
  if(!dragging) return;
  const dx=e.clientX-lastX, dy=e.clientY-lastY;
  lastX=e.clientX; lastY=e.clientY;
  cam.yaw+=dx*0.004;
  cam.pitch=clamp(cam.pitch-dy*0.004,-1.4,1.4);
});
window.addEventListener('pointerup',()=>{ dragging=false; });
window.addEventListener('pointercancel',()=>{ dragging=false; });
window.addEventListener('resize',resize);

// ---------------- public contract ----------------
window.__arena={
  freeze(on){ frozen=!!on; if(frozen) vel=[0,0,0]; },
  setSeed(n){ applySeed(parseInt(n,10)||0); },
  setTime(h){ time=((+h)%24+24)%24; showTime(); },
  setCamera(c){
    if(!c) return;
    if(c.x!==undefined) cam.x=+c.x;
    if(c.z!==undefined) cam.z=+c.z;
    if(c.yaw!==undefined) cam.yaw=+c.yaw;
    if(c.pitch!==undefined) cam.pitch=+c.pitch;
    if(c.y!==undefined) cam.y=+c.y;
    vel=[0,0,0];
    clampCam();
    updateChunks(cam.x,cam.z,Infinity);
  },
  getCamera(){ return {x:cam.x,y:cam.y,z:cam.z,yaw:cam.yaw,pitch:cam.pitch}; },
  terrainHeight(x,z){ return terrainH(+x,+z); },
  stats(){ return {chunks:chunks.size,triangles:lastTris}; }
};

// ---------------- main loop ----------------
let last=performance.now();
let fpsFrames=0, fpsT=last;
function frame(now){
  const dt=Math.min(0.05,Math.max(0,(now-last)/1000));
  last=now;
  if(!frozen){
    simT+=dt;
    time=(time+dt*0.2)%24;   // full day ≈ 120 s
    if(autoOn) autopilot(dt);
  }
  manual(dt);
  clampCam();
  updateChunks(cam.x,cam.z,6);
  showTime();
  const E=env(time);
  render(E);

  fpsFrames++;
  if(now-fpsT>500){
    fpsEl.textContent=Math.round(fpsFrames*1000/(now-fpsT))+' fps';
    fpsFrames=0; fpsT=now;
  }
  requestAnimationFrame(frame);
}

// init
updateAP();
PERM=mixSeed(seed);
seedEl.value=String(seed);
cam.y=minY(cam.x,cam.z)+30;
updateChunks(cam.x,cam.z,Infinity);
showTime();
resize();
requestAnimationFrame(t=>{ last=t; requestAnimationFrame(frame); });
</script>
</body>
</html>
```