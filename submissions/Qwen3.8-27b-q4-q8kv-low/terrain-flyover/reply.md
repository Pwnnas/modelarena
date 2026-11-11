```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Horizon</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{overflow:hidden;background:#000;font-family:'Courier New',monospace}
canvas{display:block;width:100vw;height:100vh}
#ui{position:fixed;bottom:16px;left:16px;background:rgba(0,0,0,0.55);padding:10px 14px;border-radius:6px;color:#bbb;font-size:12px;z-index:10;backdrop-filter:blur(4px)}
#ui label{display:block;margin:5px 0}
#ui input[type="range"]{width:130px;vertical-align:middle}
#ui input[type="number"]{width:64px;background:#1a1a1a;color:#ccc;border:1px solid #444;padding:2px 4px;border-radius:3px;font-size:12px}
#hud{position:fixed;top:12px;right:12px;color:rgba(255,255,255,0.65);font-size:11px;text-align:right;z-index:10;pointer-events:none;line-height:1.6}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="ui">
<label>Time <input type="range" id="time" min="0" max="24" step="0.01" value="12"> <span id="timeVal">12.0h</span></label>
<label>Seed <input type="number" id="seed" value="42"></label>
</div>
<div id="hud"><div id="fps">-- FPS</div><div id="auto">AUTOPILOT ON</div></div>
<script>
(function(){
'use strict';
const CHUNK_SIZE=256,NEAR_SEG=48,FAR_SEG=16,NEAR_DIST=512,FAR_DIST=1536;
const FOG_DENSITY=0.0012,DAY_SEC=120,WATER_SIZE=2200,WATER_SEG=72;
const CAM_MARGIN=4,PI=Math.PI;

let seed=42,timeOfDay=12,frozen=false,waterTime=0,autopilot=true;
let camX=0,camY=60,camZ=0,camYaw=0,camPitch=-0.12;
let velX=0,velY=0,velZ=0,autoY=60;
let lastFrame=performance.now(),fpsFrames=0,fpsAccum=0,fpsVal=60;
let chunkCount=0,triCount=0;

const canvas=document.getElementById('c');
const fpsEl=document.getElementById('fps');
const autoEl=document.getElementById('auto');
const timeInput=document.getElementById('time');
const seedInput=document.getElementById('seed');
const timeValEl=document.getElementById('timeVal');

const gl=canvas.getContext('webgl',{antialias:true,alpha:false});
if(!gl){document.body.innerHTML='<p style="color:#fff;padding:20px">WebGL not supported</p>';return;}

function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(window.innerWidth*dpr);
  canvas.height=Math.round(window.innerHeight*dpr);
  gl.viewport(0,0,canvas.width,canvas.height);
}
window.addEventListener('resize',resize);
resize();

// === NOISE ===
function hash2D(ix,iz,s){
  let n=ix*127.1+iz*311.7+s*74.7;
  let v=Math.sin(n)*43758.5453;
  return v-Math.floor(v);
}
function noise2D(x,y,s){
  let ix=Math.floor(x),iy=Math.floor(y);
  let fx=x-ix,fy=y-iy;
  let ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);
  let a=hash2D(ix,iy,s),b=hash2D(ix+1,iy,s);
  let c=hash2D(ix,iy+1,s),d=hash2D(ix+1,iy+1,s);
  return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy;
}
function fbm(x,y,oct,s){
  let v=0,amp=0.5,freq=1;
  for(let i=0;i<oct;i++){v+=amp*noise2D(x*freq,y*freq,s+i*100);amp*=0.5;freq*=2.1;}
  return v;
}
function ridged(x,y,oct,s){
  let v=0,amp=0.5,freq=1;
  for(let i=0;i<oct;i++){let n=noise2D(x*freq,y*freq,s+i*200);v+=amp*(1-Math.abs(2*n-1));amp*=0.5;freq*=2.1;}
  return v;
}
function terrainH(x,z){
  let s=seed;
  let wx=x+(fbm(x*0.001,z*0.001,2,s+500)-0.5)*140;
  let wz=z+(fbm(x*0.001+97,z*0.001+97,2,s+600)-0.5)*140;
  let cont=fbm(wx*0.0006,wz*0.0006,4,s);
  let mtn=ridged(wx*0.0014,wz*0.0014,4,s+1000);
  let det=fbm(wx*0.007,wz*0.007,3,s+2000);
  return(cont-0.42)*350+mtn*mtn*220+(det-0.5)*14;
}
function terrainN(x,z){
  let e=1.2;
  let nx=terrainH(x-e,z)-terrainH(x+e,z);
  let nz=terrainH(x,z-e)-terrainH(x,z+e);
  let ny=2*e;
  let l=Math.sqrt(nx*nx+ny*ny+nz*nz);
  return[nx/l,ny/l,nz/l];
}

// === MATH ===
function persp(fov,asp,n,f){
  let t=1/Math.tan(fov/2),nf=1/(n-f);
  return new Float32Array([t/asp,0,0,0, 0,t,0,0, 0,0,(f+n)*nf,-1, 0,0,2*f*n*nf,0]);
}
function lookAt(eye,target,up){
  let zx=eye[0]-target[0],zy=eye[1]-target[1],zz=eye[2]-target[2];
  let zl=Math.sqrt(zx*zx+zy*zy+zz*zz);zx/=zl;zy/=zl;zz/=zl;
  let xx=up[1]*zz-up[2]*zy,xy=up[2]*zx-up[0]*zz,xz=up[0]*zy-up[1]*zx;
  let xl=Math.sqrt(xx*xx+xy*xy+xz*xz);xx/=xl;xy/=xl;xz/=xl;
  let yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
  return new Float32Array([
    xx,yx,-zx,0, xy,yy,-zy,0, xz,yz,-zz,0,
    -(xx*eye[0]+xy*eye[1]+xz*eye[2]),
    -(yx*eye[0]+yy*eye[1]+yz*eye[2]),
    (zx*eye[0]+zy*eye[1]+zz*eye[2]),1
  ]);
}

// === SHADERS ===
function mkShader(t,s){
  let sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);
  if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){console.error(gl.getShaderInfoLog(sh));gl.deleteShader(sh);return null;}
  return sh;
}
function mkProg(vs,fs){
  let v=mkShader(gl.VERTEX_SHADER,vs),f=mkShader(gl.FRAGMENT_SHADER,fs);
  if(!v||!f)return null;
  let p=gl.createProgram();gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){console.error(gl.getProgramInfoLog(p));return null;}
  return p;
}

const terrainVS=`
attribute vec3 aPos;
attribute vec3 aNrm;
attribute float aH;
uniform mat4 uProj;
uniform mat4 uView;
varying vec3 vNrm;
varying float vH;
varying float vDist;
varying vec3 vWP;
void main(){
  vec4 vp=uView*vec4(aPos,1.0);
  gl_Position=uProj*vp;
  vNrm=aNrm;vH=aH;vWP=aPos;
  vDist=length(vp.xyz);
}`;

const terrainFS=`
precision mediump float;
varying vec3 vNrm;
varying float vH;
varying float vDist;
varying vec3 vWP;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform vec3 uAmbient;
uniform vec3 uFogCol;
uniform float uFogDen;
void main(){
  vec3 n=normalize(vNrm);
  float slope=1.0-n.y;
  vec3 sand=vec3(0.78,0.72,0.52);
  vec3 grass=vec3(0.22,0.42,0.16);
  vec3 grass2=vec3(0.14,0.30,0.10);
  vec3 rock=vec3(0.48,0.44,0.40);
  vec3 snow=vec3(0.92,0.93,0.96);
  vec3 deep=vec3(0.45,0.42,0.35);
  vec3 col;
  if(vH<0.0){
    float t=clamp(vH/-40.0,0.0,1.0);
    col=mix(sand,deep,t);
  }else{
    float beach=smoothstep(0.0,4.0,vH);
    col=mix(sand,grass,beach);
    float g2=smoothstep(30.0,120.0,vH);
    col=mix(col,grass2,g2);
    float rf=smoothstep(0.35,0.55,slope);
    col=mix(col,rock,rf);
    float sf=smoothstep(220.0,320.0,vH)*(1.0-rf);
    col=mix(col,snow,sf);
    float vrf=smoothstep(0.5,0.8,slope)*smoothstep(300.0,150.0,vH);
    col=mix(col,rock*0.8,vrf*0.5);
  }
  // variation
  float v1=sin(vWP.x*0.02+vWP.z*0.015)*0.03;
  float v2=sin(vWP.x*0.005-vWP.z*0.008)*0.04;
  col*=1.0+v1+v2;
  float ndl=max(dot(n,uSunDir),0.0);
  vec3 lit=col*(uAmbient+uSunCol*ndl);
  float fog=1.0-exp(-uFogDen*vDist);
  lit=mix(lit,uFogCol,fog);
  gl_FragColor=vec4(lit,1.0);
}`;

const waterVS=`
attribute vec3 aPos;
uniform mat4 uProj;
uniform mat4 uView;
uniform float uTime;
uniform vec3 uOff;
varying vec3 vWP;
varying vec3 vNrm;
varying float vDist;
void main(){
  vec3 wp=aPos+vec3(uOff.x,0.0,uOff.z);
  float w=0.0;
  w+=sin(wp.x*0.03+uTime*1.1)*0.35;
  w+=sin(wp.z*0.04+uTime*0.9)*0.25;
  w+=sin((wp.x+wp.z)*0.02+uTime*1.4)*0.2;
  w+=sin(wp.x*0.06+uTime*2.1)*0.1;
  w+=sin(wp.z*0.07+uTime*1.7)*0.06;
  wp.y+=w;
  float dx=cos(wp.x*0.03+uTime*1.1)*0.35*0.03+cos((wp.x+wp.z)*0.02+uTime*1.4)*0.2*0.02+cos(wp.x*0.06+uTime*2.1)*0.1*0.06;
  float dz=cos(wp.z*0.04+uTime*0.9)*0.25*0.04+cos((wp.x+wp.z)*0.02+uTime*1.4)*0.2*0.02+cos(wp.z*0.07+uTime*1.7)*0.06*0.07;
  vNrm=normalize(vec3(-dx,1.0,-dz));
  vec4 vp=uView*vec4(wp,1.0);
  gl_Position=uProj*vp;
  vWP=wp;
  vDist=length(vp.xyz);
}`;

const waterFS=`
precision mediump float;
varying vec3 vWP;
varying vec3 vNrm;
varying float vDist;
uniform vec3 uCamPos;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform vec3 uSkyCol;
uniform vec3 uFogCol;
uniform float uFogDen;
uniform float uDayFac;
void main(){
  vec3 vDir=normalize(uCamPos-vWP);
  vec3 n=normalize(vNrm);
  float fres=pow(1.0-max(dot(vDir,n),0.0),3.0);
  fres=mix(0.08,1.0,fres);
  vec3 deep=vec3(0.02,0.08,0.15);
  vec3 shallow=vec3(0.05,0.25,0.35);
  vec3 base=mix(deep,shallow,0.3);
  vec3 refl=uSkyCol;
  vec3 h=normalize(vDir+uSunDir);
  float spec=pow(max(dot(n,h),0.0),180.0);
  vec3 col=mix(base,refl,fres)+uSunCol*spec*0.6;
  col=mix(col,uFogCol,1.0-exp(-uFogDen*vDist));
  float alpha=mix(0.72,0.92,fres);
  gl_FragColor=vec4(col,alpha);
}`;

const skyVS=`
attribute vec2 aPos;
varying vec2 vUV;
void main(){
  vUV=aPos;
  gl_Position=vec4(aPos,0.9999,1.0);
}`;

const skyFS=`
precision mediump float;
varying vec2 vUV;
uniform vec3 uCamFwd;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform float uTanHalf;
uniform float uAspect;
uniform vec3 uSunDir;
uniform float uDayFac;
uniform float uSunsetFac;
void main(){
  vec3 dir=normalize(uCamFwd+vUV.x*uAspect*uTanHalf*uCamRight+vUV.y*uTanHalf*uCamUp);
  float up=max(dir.y,0.0);
  vec3 dayTop=vec3(0.20,0.45,0.85);
  vec3 dayBot=vec3(0.55,0.75,0.95);
  vec3 setTop=vec3(0.25,0.15,0.35);
  vec3 setBot=vec3(1.0,0.45,0.15);
  vec3 nTop=vec3(0.008,0.008,0.025);
  vec3 nBot=vec3(0.02,0.02,0.05);
  vec3 top=mix(nTop,dayTop,uDayFac);
  vec3 bot=mix(nBot,dayBot,uDayFac);
  top=mix(top,setTop,uSunsetFac*0.6);
  bot=mix(bot,setBot,uSunsetFac);
  vec3 col=mix(bot,top,pow(up,0.6));
  float sd=dot(dir,uSunDir);
  float sunAngle=acos(clamp(sd,-1.0,1.0));
  float disk=smoothstep(0.025,0.02,sunAngle);
  col+=vec3(1.0,0.95,0.8)*disk*2.5*uDayFac;
  float glow=exp(-sunAngle*4.0)*0.4;
  col+=vec3(1.0,0.6,0.2)*glow*uDayFac;
  float mglow=exp(-sunAngle*8.0)*0.15;
  col+=vec3(0.8,0.7,0.4)*mglow*uDayFac;
  float nf=1.0-uDayFac;
  if(nf>0.1&&dir.y>0.0){
    vec3 p=floor(dir*300.0);
    float h1=fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);
    if(h1>0.997){
      float bright=(h1-0.997)/0.003*nf;
      col+=vec3(bright)*0.7;
    }
  }
  gl_FragColor=vec4(col,1.0);
}`;

const tProg=mkProg(terrainVS,terrainFS);
const wProg=mkProg(waterVS,waterFS);
const sProg=mkProg(skyVS,skyFS);

// Uniform locations
const tU={};
['uProj','uView','uSunDir','uSunCol','uAmbient','uFogCol','uFogDen'].forEach(n=>tU[n]=gl.getUniformLocation(tProg,n));
const tA={pos:gl.getAttribLocation(tProg,'aPos'),nrm:gl.getAttribLocation(tProg,'aNrm'),h:gl.getAttribLocation(tProg,'aH')};

const wU={};
['uProj','uView','uTime','uOff','uCamPos','uSunDir','uSunCol','uSkyCol','uFogCol','uFogDen','uDayFac'].forEach(n=>wU[n]=gl.getUniformLocation(wProg,n));
const wA={pos:gl.getAttribLocation(wProg,'aPos')};

const sU={};
['uCamFwd','uCamRight','uCamUp','uTanHalf','uAspect','uSunDir','uDayFac','uSunsetFac'].forEach(n=>sU[n]=gl.getUniformLocation(sProg,n));
const sA={pos:gl.getAttribLocation(sProg,'aPos')};

// === SKY QUAD ===
const skyBuf=gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,skyBuf);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,1,1,-1,1]),gl.STATIC_DRAW);
const skyIdx=gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,skyIdx);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array([0,1,2,0,2,3]),gl.STATIC_DRAW);

// === WATER MESH ===
const wN=WATER_SEG+1;
const wVerts=new Float32Array(wN*wN*3);
for(let i=0;i<wN;i++){
  for(let j=0;j<wN;j++){
    let idx=(i*wN+j)*3;
    wVerts[idx]=(j/WATER_SEG-0.5)*WATER_SIZE;
    wVerts[idx+1]=0;
    wVerts[idx+2]=(i/WATER_SEG-0.5)*WATER_SIZE;
  }
}
const wIdx=new Uint32Array(WATER_SEG*WATER_SEG*6);
{
  let k=0;
  for(let i=0;i<WATER_SEG;i++){
    for(let j=0;j<WATER_SEG;j++){
      let a=i*wN+j,b=a+1,c=a+wN,d=c+1;
      wIdx[k++]=a;wIdx[k++]=c;wIdx[k++]=b;
      wIdx[k++]=b;wIdx[k++]=c;wIdx[k++]=d;
    }
  }
}
const wVBO=gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,wVBO);
gl.bufferData(gl.ARRAY_BUFFER,wVerts,gl.STATIC_DRAW);
const wIBO=gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,wIBO);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,wIdx,gl.STATIC_DRAW);
const wTriCount=WATER_SEG*WATER_SEG*2;

// === CHUNK MANAGEMENT ===
const chunks=new Map();
const chunkQueue=[];
const MAX_CHUNKS_PER_FRAME=4;

function chunkKey(cx,cz){return cx+'_'+cz;}

function genChunk(cx,cz,segs){
  const size=CHUNK_SIZE;
  const n=segs+1;
  const verts=new Float32Array(n*n*8);
  for(let i=0;i<n;i++){
    for(let j=0;j<n;j++){
      let wx=cx*size+j/segs*size;
      let wz=cz*size+i/segs*size;
      let h=terrainH(wx,wz);
      let nm=terrainN(wx,wz);
      let slope=1-nm[1];
      let vi=(i*n+j)*8;
      verts[vi]=wx;verts[vi+1]=h;verts[vi+2]=wz;
      verts[vi+3]=nm[0];verts[vi+4]=nm[1];verts[vi+5]=nm[2];
      verts[vi+6]=h;verts[vi+7]=slope;
    }
  }
  const idx=new Uint32Array(segs*segs*6);
  let k=0;
  for(let i=0;i<segs;i++){
    for(let j=0;j<segs;j++){
      let a=i*n+j,b=a+1,c=a+n,d=c+1;
      idx[k++]=a;idx[k++]=c;idx[k++]=b;
      idx[k++]=b;idx[k++]=c;idx[k++]=d;
    }
  }
  const vbo=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
  gl.bufferData(gl.ARRAY_BUFFER,verts,gl.STATIC_DRAW);
  const ibo=gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,idx,gl.STATIC_DRAW);
  return{vbo,ibo,vertCount:n*n,idxCount:segs*segs*6,segs};
}

function deleteChunk(ch){
  gl.deleteBuffer(ch.vbo);
  gl.deleteBuffer(ch.ibo);
}

function updateChunks(){
  let ccx=Math.floor(camX/CHUNK_SIZE);
  let ccz=Math.floor(camZ/CHUNK_SIZE);
  let range=Math.ceil((FAR_DIST+CHUNK_SIZE)/CHUNK_SIZE);
  let needed=new Set();
  for(let dx=-range;dx<=range;dx++){
    for(let dz=-range;dz<=range;dz++){
      let cx=ccx+dx,cz=ccz+dz;
      let cxx=cx*CHUNK_SIZE+CHUNK_SIZE/2;
      let czz=cz*CHUNK_SIZE+CHUNK_SIZE/2;
      let dist=Math.sqrt((cxx-camX)*(cxx-camX)+(czz-camZ)*(czz-camZ));
      if(dist>FAR_DIST+CHUNK_SIZE)continue;
      let lod=dist<NEAR_DIST?0:1;
      let key=chunkKey(cx,cz);
      needed.add(key);
      let existing=chunks.get(key);
      let neededSegs=lod===0?NEAR_SEG:FAR_SEG;
      if(!existing){
        chunkQueue.push({cx,cz,lod,key});
      }else if(existing.segs!==neededSegs){
        deleteChunk(existing);
        chunks.delete(key);
        chunkQueue.push({cx,cz,lod,key});
      }
    }
  }
  // Remove far chunks
  for(let[k,v]of chunks){
    if(!needed.has(k)){deleteChunk(v);chunks.delete(k);}
  }
  // Generate queued chunks (limit per frame)
  let gen=0;
  while(chunkQueue.length>0&&gen<MAX_CHUNKS_PER_FRAME){
    let item=chunkQueue.shift();
    if(chunks.has(item.key))continue;
    let segs=item.lod===0?NEAR_SEG:FAR_SEG;
    let ch=genChunk(item.cx,item.cz,segs);
    chunks.set(item.key,ch);
    gen++;
  }
}

function regenAll(){
  for(let[k,v]of chunks){deleteChunk(v);}
  chunks.clear();
  chunkQueue.length=0;
  // Generate nearest chunks synchronously
  let ccx=Math.floor(camX/CHUNK_SIZE);
  let ccz=Math.floor(camZ/CHUNK_SIZE);
  for(let dx=-1;dx<=1;dx++){
    for(let dz=-1;dz<=1;dz++){
      let cx=ccx+dx,cz=ccz+dz;
      let key=chunkKey(cx,cz);
      let ch=genChunk(cx,cz,NEAR_SEG);
      chunks.set(key,ch);
    }
  }
}

// === LIGHT COMPUTATION ===
function computeLight(){
  let t=timeOfDay;
  let dayAngle=(t-6)/12*PI;
  let sunElev=Math.sin(dayAngle)*(PI/3.2);
  let sunAzim=dayAngle;
  let sx=Math.cos(sunAzim)*Math.cos(sunElev);
  let sy=Math.sin(sunElev);
  let sz=-Math.sin(sunAzim)*Math.cos(sunElev);
  let sunDir=[sx,sy,sz];
  let rawElev=sy;
  let dayFac=smoothstep(-0.05,0.15,rawElev);
  let sunsetFac=(1-smoothstep(0,0.25,Math.abs(rawElev)))*smoothstep(-0.3,0,rawElev+0.3);
  sunsetFac=Math.max(0,1-smathAbs(rawElev)/0.25)*smoothstep(-0.2,0.0,rawElev)*smoothstep(0.0,0.2,rawElev+0.2);
  // Simpler sunset factor
  let sf=1-Math.min(1,Math.abs(rawElev)/0.2);
  sf*=smoothstep(-0.15,0.0,rawElev)*smoothstep(0.0,0.15,rawElev);
  sf=Math.max(0,Math.min(1,1-Math.abs(rawElev)/0.2))*smoothstep(-0.1,0.0,rawElev)*smoothstep(0.0,0.1,rawElev+0.1);
  // Even simpler: peak at |rawElev| near 0 during day transition
  let sf2=Math.max(0,1-Math.abs(rawElev)/0.25);
  sf2*=smoothstep(-0.3,0.0,rawElev)*smoothstep(0.3,0.0,-rawElev+0.3);
  // Let me just use: sunset factor = how close to horizon (0 at noon, 1 at sunset/sunrise)
  let sunF=1-smoothstep(0,0.3,rawElev);
  sunF*=smoothstep(-0.1,0.1,rawElev);
  // Sun color and intensity
  let sunInt=Math.max(0,rawElev)*2.0;
  let sunCol=[
    lerp(1.0,1.0,sunInt)*sunInt,
    lerp(0.3,0.92,sunInt)*sunInt,
    lerp(0.1,0.78,sunInt)*sunInt
  ];
  if(sunInt<0.3){sunCol=[sunCol[0]*0.3,sunCol[1]*0.3,sunCol[2]*0.3];}
  // Ambient
  let amb=[
    lerp(0.01,0.25,dayFac),
    lerp(0.01,0.32,dayFac),
    lerp(0.03,0.45,dayFac)
  ];
  // Moon at night
  if(dayFac<0.5){
    let mf=(1-dayFac)*0.12;
    amb[0]+=0.2*mf;amb[1]+=0.25*mf;amb[2]+=0.35*mf;
  }
  // Fog color (horizon)
  let fogCol=[
    lerp(0.01,0.55,dayFac),
    lerp(0.01,0.68,dayFac),
    lerp(0.04,0.85,dayFac)
  ];
  fogCol[0]=lerp(fogCol[0],1.0,sf2*0.5);
  fogCol[1]=lerp(fogCol[1],0.4,sf2*0.5);
  fogCol[2]=lerp(fogCol[2],0.15,sf2*0.4);
  // Sky color for water reflection
  let skyCol=[
    lerp(0.02,0.45,dayFac),
    lerp(0.02,0.6,dayFac),
    lerp(0.05,0.85,dayFac)
  ];
  skyCol[0]=lerp(skyCol[0],0.9,sf2*0.4);
  skyCol[1]=lerp(skyCol[1],0.35,sf2*0.4);
  skyCol[2]=lerp(skyCol[2],0.1,sf2*0.3);
  return{sunDir,sunCol,amb,fogCol,skyCol,dayFac,sunF};
}
function lerp(a,b,t){return a+(b-a)*Math.max(0,Math.min(1,t));}
function smoothstep(a,b,x){let t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}
function smathAbs(x){return Math.abs(x);}

// === INPUT ===
let keys={};
document.addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(e.code==='KeyF'){
    autopilot=!autopilot;
    autoEl.textContent=autopilot?'AUTOPILOT ON':'MANUAL';
    autoEl.style.color=autopilot?'rgba(0,255,100,0.7)':'rgba(255,200,0,0.7)';
  }
  if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','Space','ShiftLeft','ShiftRight'].includes(e.code))e.preventDefault();
});
document.addEventListener('keyup',e=>{keys[e.code]=false;});

let dragging=false,pmx=0,pmy=0;
canvas.addEventListener('mousedown',e=>{dragging=true;pmx=e.clientX;pmy=e.clientY;});
window.addEventListener('mouseup',()=>{dragging=false;});
window.addEventListener('mousemove',e=>{
  if(!dragging)return;
  let dx=e.clientX-pmx,dy=e.clientY-pmy;
  pmx=e.clientX;pmy=e.clientY;
  camYaw-=dx*0.003;
  camPitch+=dy*0.003;
  camPitch=Math.max(-1.5,Math.min(1.5,camPitch));
});

timeInput.addEventListener('input',()=>{
  timeOfDay=parseFloat(timeInput.value);
  timeValEl.textContent=timeOfDay.toFixed(1)+'h';
});
seedInput.addEventListener('change',()=>{
  let v=parseInt(seedInput.value);
  if(!isNaN(v)){seed=v;regenAll();}
});

// === UPDATE ===
function update(dt){
  if(!frozen){
    timeOfDay+=(dt/DAY_SEC)*24;
    if(timeOfDay>=24)timeOfDay-=24;
    if(timeOfDay<0)timeOfDay+=24;
    timeInput.value=timeOfDay.toFixed(2);
    timeValEl.textContent=timeOfDay.toFixed(1)+'h';
    waterTime+=dt;
  }

  if(autopilot&&!frozen){
    let speed=45;
    let dx=Math.sin(camYaw)*speed*dt;
    let dz=-Math.cos(camYaw)*speed*dt;
    camX+=dx;camZ+=dz;
    let gy=Math.max(terrainH(camX,camZ),0)+22;
    autoY+=(gy-autoY)*Math.min(1,dt*2.5);
    camY=autoY;
  }else if(!autopilot){
    let acc=80;
    let damp=4;
    let fx=Math.sin(camYaw)*Math.cos(camPitch);
    let fy=Math.sin(camPitch);
    let fz=-Math.cos(camYaw)*Math.cos(camPitch);
    let rx=Math.cos(camYaw);
    let rz=Math.sin(camYaw);
    if(keys['KeyW']){velX+=fx*acc*dt;velY+=fy*acc*dt;velZ+=fz*acc*dt;}
    if(keys['KeyS']){velX-=fx*acc*dt;velY-=fy*acc*dt;velZ-=fz*acc*dt;}
    if(keys['KeyA']){velX-=rx*acc*dt;velZ-=rz*acc*dt;}
    if(keys['KeyD']){velX+=rx*acc*dt;velZ+=rz*acc*dt;}
    if(keys['KeyQ']||keys['Space']){velY-=acc*dt;}
    if(keys['KeyE']||keys['ShiftLeft']||keys['ShiftRight']){velY+=acc*dt;}
    let df=Math.exp(-damp*dt);
    velX*=df;velY*=df;velZ*=df;
    camX+=velX*dt;camY+=velY*dt;camZ+=velZ*dt;
    if(!frozen)waterTime+=0; // water still animates in manual mode
  }

  // Clamp camera above terrain and water
  let minY=Math.max(terrainH(camX,camZ),0)+CAM_MARGIN;
  if(camY<minY){camY=minY;velY=Math.max(0,velY);}

  updateChunks();
}

// === RENDER ===
function render(){
  let asp=canvas.width/canvas.height;
  let fov=PI/3;
  let proj=persp(fov,asp,0.5,5000);

  let fx=Math.sin(camYaw)*Math.cos(camPitch);
  let fy=Math.sin(camPitch);
  let fz=-Math.cos(camYaw)*Math.cos(camPitch);
  let eye=[camX,camY,camZ];
  let target=[camX+fx,camY+fy,camZ+fz];
  let view=lookAt(eye,target,[0,1,0]);

  let light=computeLight();

  gl.clearColor(0,0,0,1);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

  // Sky
  gl.disable(gl.DEPTH_TEST);
  gl.depthMask(false);
  gl.useProgram(sProg);
  let rx=Math.cos(camYaw),rz=Math.sin(camYaw);
  let ux=-(fx*fz*(1-0)-0); // cross(right, fwd)
  // Compute up properly
  let cx_=rz*fy-0*fz; // right x up_hint cross fwd... let me just compute directly
  // right = (cos(yaw), 0, sin(yaw))
  // fwd = (sin(yaw)*cos(pitch), sin(pitch), -cos(yaw)*cos(pitch))
  // up = cross(right, fwd) = (0*fz - 0*fy, 0*fx - rx*fz, rx*fy - 0*fx)
  // = (0, -rx*fz... wait let me redo
  // right=(rx,0,rz), fwd=(fx,fy,fz)
  // up = cross(right,fwd) = (0*fz-rz*fy, rz*fx-rx*fz, rx*fy-0*fx)
  let upx=0*fz-rz*fy,upy=rz*fx-rx*fz,upz=rx*fy-0*fx;
  let ul=Math.sqrt(upx*upx+upy*upy+upz*upz);
  upx/=ul;upy/=ul;upz/=ul;

  gl.uniform3f(sU.uCamFwd,fx,fy,fz);
  gl.uniform3f(sU.uCamRight,rx,0,rz);
  gl.uniform3f(sU.uCamUp,upx,upy,upz);
  gl.uniform1f(sU.uTanHalf,Math.tan(fov/2));
  gl.uniform1f(sU.uAspect,asp);
  gl.uniform3fv(sU.uSunDir,light.sunDir);
  gl.uniform1f(sU.uDayFac,light.dayFac);
  gl.uniform1f(sU.uSunsetFac,light.sunF);
  gl.bindBuffer(gl.ARRAY_BUFFER,skyBuf);
  gl.enableVertexAttribArray(sA.pos);
  gl.vertexAttribPointer(sA.pos,2,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,skyIdx);
  gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_SHORT,0);
  gl.depthMask(true);
  gl.enable(gl.DEPTH_TEST);

  // Terrain
  gl.useProgram(tProg);
  gl.uniformMatrix4fv(tU.uProj,false,proj);
  gl.uniformMatrix4fv(tU.uView,false,view);
  gl.uniform3fv(tU.uSunDir,light.sunDir);
  gl.uniform3fv(tU.uSunCol,light.sunCol);
  gl.uniform3fv(tU.uAmbient,light.amb);
  gl.uniform3fv(tU.uFogCol,light.fogCol);
  gl.uniform1f(tU.uFogDen,FOG_DENSITY);

  chunkCount=0;triCount=0;
  for(let[k,ch]of chunks){
    gl.bindBuffer(gl.ARRAY_BUFFER,ch.vbo);
    gl.enableVertexAttribArray(tA.pos);
    gl.vertexAttribPointer(tA.pos,3,gl.FLOAT,false,32,0);
    gl.enableVertexAttribArray(tA.nrm);
    gl.vertexAttribPointer(tA.nrm,3,gl.FLOAT,false,32,12);
    gl.enableVertexAttribArray(tA.h);
    gl.vertexAttribPointer(tA.h,1,gl.FLOAT,false,32,24);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ch.ibo);
    gl.drawElements(gl.TRIANGLES,ch.idxCount,gl.UNSIGNED_INT,0);
    chunkCount++;triCount+=ch.idxCount/3;
  }
  gl.disableVertexAttribArray(tA.nrm);
  gl.disableVertexAttribArray(tA.h);

  // Water
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);
  gl.useProgram(wProg);
  gl.uniformMatrix4fv(wU.uProj,false,proj);
  gl.uniformMatrix4fv(wU.uView,false,view);
  gl.uniform1f(wU.uTime,frozen?0:waterTime);
  gl.uniform3f(wU.uOff,camX,0,camZ);
  gl.uniform3f(wU.uCamPos,camX,camY,camZ);
  gl.uniform3fv(wU.uSunDir,light.sunDir);
  gl.uniform3fv(wU.uSunCol,light.sunCol);
  gl.uniform3fv(wU.uSkyCol,light.skyCol);
  gl.uniform3fv(wU.uFogCol,light.fogCol);
  gl.uniform1f(wU.uFogDen,FOG_DENSITY);
  gl.uniform1f(wU.uDayFac,light.dayFac);
  gl.bindBuffer(gl.ARRAY_BUFFER,wVBO);
  gl.enableVertexAttribArray(wA.pos);
  gl.vertexAttribPointer(wA.pos,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,wIBO);
  gl.drawElements(gl.TRIANGLES,WATER_SEG*WATER_SEG*6,gl.UNSIGNED_INT,0);
  triCount+=wTriCount;

  gl.disable(gl.BLEND);
  gl.depthMask(true);
  gl.disableVertexAttribArray(wA.pos);
}

// === MAIN LOOP ===
function loop(){
  let now=performance.now();
  let dt=(now-lastFrame)/1000;
  if(dt>0.1)dt=0.016;
  lastFrame=now;

  fpsFrames++;fpsAccum+=dt;
  if(fpsAccum>=0.5){
    fpsVal=Math.round(fpsFrames/fpsAccum);
    fpsFrames=0;fpsAccum=0;
    fpsEl.textContent=fpsVal+' FPS';
  }

  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// === GRADER API ===
window.__arena={
  freeze(on){
    frozen=!!on;
  },
  setSeed(n){
    seed=Math.round(n);
    seedInput.value=seed;
    regenAll();
  },
  setTime(hours){
    timeOfDay=hours%24;if(timeOfDay<0)timeOfDay+=24;
    timeInput.value=timeOfDay;
    timeValEl.textContent=timeOfDay.toFixed(1)+'h';
  },
  setCamera(c){
    camX=c.x;camY=c.y;camZ=c.z;
    camYaw=c.yaw;camPitch=c.pitch;
    velX=0;velY=0;velZ=0;
    let minY=Math.max(terrainH(camX,camZ),0)+CAM_MARGIN;
    if(camY<minY)camY=minY;
    autoY=camY;
  },
  getCamera(){
    let minY=Math.max(terrainH(camX,camZ),0)+CAM_MARGIN;
    if(camY<minY)camY=minY;
    return{x:camX,y:camY,z:camZ,yaw:camYaw,pitch:camPitch};
  },
  terrainHeight(x,z){
    return terrainH(x,z);
  },
  stats(){
    return{chunks:chunkCount,triangles:triCount};
  }
};

})();
</script>
</body>
</html>
```