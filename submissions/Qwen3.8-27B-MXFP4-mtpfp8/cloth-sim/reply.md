

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Silk — Cloth Simulation</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{overflow:hidden;background:#0d0d1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif}
canvas{display:block;cursor:crosshair}
#panel{position:fixed;top:12px;right:12px;background:rgba(12,12,28,0.88);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 22px;color:#d8d0c8;font-size:13px;min-width:230px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);user-select:none;z-index:10}
#panel h2{font-size:16px;font-weight:600;margin-bottom:14px;color:#f0e8e0;letter-spacing:1px;text-transform:uppercase}
.row{display:flex;align-items:center;justify-content:space-between;margin:10px 0 4px}
.row span{font-size:12px;color:#a09890}
.row .val{color:#c8c0b8;font-variant-numeric:tabular-nums}
input[type=range]{width:100%;height:4px;-webkit-appearance:none;appearance:none;background:rgba(255,255,255,0.12);border-radius:2px;outline:none;margin:6px 0 2px}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;background:#c8b8a8;border-radius:50%;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.4)}
input[type=checkbox]{width:16px;height:16px;accent-color:#c8b8a8;cursor:pointer}
#reset{margin-top:14px;width:100%;padding:9px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#d8d0c8;font-size:13px;cursor:pointer;transition:background .2s,transform .1s}
#reset:hover{background:rgba(255,255,255,0.14)}
#reset:active{transform:scale(0.98)}
#stats{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);font-size:11px;color:#706860;line-height:1.7}
#stats span{color:#a09890;font-variant-numeric:tabular-nums}
#hint{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.22);font-size:11px;font-family:inherit;pointer-events:none;letter-spacing:0.3px;white-space:nowrap}
</style>
</head>
<body>
<canvas id="canvas"></canvas>
<div id="panel">
  <h2>Silk</h2>
  <div class="row"><span>Wind</span><input type="checkbox" id="wind"></div>
  <div class="row"><span>Gravity</span><span class="val" id="gravVal">9.8</span></div>
  <input type="range" id="gravity" min="0" max="30" step="0.1" value="9.8">
  <div class="row"><span>Solver Iterations</span><span class="val" id="iterVal">5</span></div>
  <input type="range" id="iterations" min="1" max="12" step="1" value="5">
  <button id="reset">Reset Cloth</button>
  <div id="stats">
    <div>FPS: <span id="fps">--</span></div>
    <div>Particles: <span id="pCount">0</span></div>
    <div>Constraints: <span id="cCount">0</span></div>
  </div>
</div>
<div id="hint">Left-drag grab &nbsp;·&nbsp; Right-drag cut &nbsp;·&nbsp; Space pause</div>
<script>
(function(){
'use strict';
const canvas=document.getElementById('canvas');
const ctx=canvas.getContext('2d');

const COLS=50,ROWS=35,SPACING=12;
const DT=1/60,DAMPING=0.97,TEAR_TH=2.2,GRAB_R=40;
const NUM_SHADES=48;

let particles=[],constraints=[],restCrosses=[];
let hEdge=[],vEdge=[];
let pinnedCount=0;
let gravityVal=9.8,solverIters=5;
let windOn=false,paused=false;
let grabbedIdx=-1;
let mouseX=0,mouseY=0,prevMX=0,prevMY=0;
let isGrabbing=false,isCutting=false;
let simTime=0,accumulator=0,lastTime=0;
let fpsCount=0,fpsLast=0,curFps=60;

function resize(){
  const dpr=window.devicePixelRatio||1;
  canvas.width=window.innerWidth*dpr;
  canvas.height=window.innerHeight*dpr;
  canvas.style.width=window.innerWidth+'px';
  canvas.style.height=window.innerHeight+'px';
}
window.addEventListener('resize',resize);
resize();

function idx(i,j){return j*COLS+i}

function initCloth(){
  particles=[];constraints=[];restCrosses=[];
  hEdge=[];vEdge=[];
  pinnedCount=0;
  const cw=(COLS-1)*SPACING,ch=(ROWS-1)*SPACING;
  const sx=(window.innerWidth-cw)/2,sy=60;
  for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++){
    const x=sx+i*SPACING,y=sy+j*SPACING;
    particles.push({x,y,px:x,py:y,ix:x,iy:y,pinned:j===0});
    if(j===0)pinnedCount++;
  }
  function addC(a,b){
    const pa=particles[a],pb=particles[b];
    const dx=pb.x-pa.x,dy=pb.y-pa.y;
    constraints.push({a,b,rest:Math.sqrt(dx*dx+dy*dy),broken:false});
  }
  for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++){
    if(i<COLS-1)addC(idx(i,j),idx(i+1,j));
    if(j<ROWS-1)addC(idx(i,j),idx(i,j+1));
  }
  for(let j=0;j<ROWS-1;j++)for(let i=0;i<COLS-1;i++){
    addC(idx(i,j),idx(i+1,j+1));
    addC(idx(i+1,j),idx(i,j+1));
  }
  for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++){
    if(i<COLS-2)addC(idx(i,j),idx(i+2,j));
    if(j<ROWS-2)addC(idx(i,j),idx(i,j+2));
  }
  for(let j=0;j<ROWS;j++){hEdge[j]=new Array(COLS-1).fill(true);vEdge[j]=new Array(COLS).fill(true)}
  for(let j=0;j<ROWS-1;j++)for(let i=0;i<COLS-1;i++){
    const p00=particles[idx(i,j)],p10=particles[idx(i+1,j)],p01=particles[idx(i,j+1)],p11=particles[idx(i+1,j+1)];
    restCrosses.push(
      (p10.x-p00.x)*(p01.y-p00.y)-(p10.y-p00.y)*(p01.x-p00.x),
      (p11.x-p10.x)*(p01.y-p10.y)-(p11.y-p10.y)*(p01.x-p10.x)
    );
  }
}

function isFixed(i){return particles[i].pinned||i===grabbedIdx}

function breakCon(i){
  if(constraints[i].broken)return;
  constraints[i].broken=true;
  const c=constraints[i];
  const ia=c.a%COLS,ja=Math.floor(c.a/COLS);
  const ib=c.b%COLS,jb=Math.floor(c.b/COLS);
  if(ja===jb&&ib===ia+1)hEdge[ja][ia]=false;
  else if(ib===ia&&jb===ja+1)vEdge[ja][ia]=false;
}

function stepPhysics(){
  simTime+=DT;
  const g=gravityVal*100;
  for(let i=0;i<particles.length;i++){
    const p=particles[i];
    if(p.pinned)continue;
    let fx=0,fy=g;
    if(windOn){
      const t=simTime;
      const gust=0.5+0.5*Math.sin(t*0.3)*Math.sin(t*0.7+1.3);
      fx+=(Math.sin(p.x*0.01+t*1.5)*Math.cos(p.y*0.008+t*0.8)+0.5*Math.sin(p.x*0.023-t*2.1)*Math.sin(p.y*0.017+t*1.3)+0.3*Math.cos(p.x*0.041+t*3.7)*Math.cos(p.y*0.031-t*0.9))*gust*80;
      fy+=(0.3*Math.sin(p.x*0.012+t*1.8)*Math.cos(p.y*0.009+t*1.1)+0.2*Math.cos(p.x*0.03-t*2.5)*Math.sin(p.y*0.022+t*0.7))*gust*40;
    }
    const vx=(p.x-p.px)*DAMPING,vy=(p.y-p.py)*DAMPING;
    p.px=p.x;p.py=p.y;
    p.x+=vx+fx*DT*DT;
    p.y+=vy+fy*DT*DT;
  }
  for(let iter=0;iter<solverIters;iter++){
    for(let i=0;i<constraints.length;i++){
      const c=constraints[i];
      if(c.broken)continue;
      const pa=particles[c.a],pb=particles[c.b];
      const dx=pb.x-pa.x,dy=pb.y-pa.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<1e-6)continue;
      const diff=(dist-c.rest)/dist*0.5;
      const ox=dx*diff,oy=dy*diff;
      const aF=isFixed(c.a),bF=isFixed(c.b);
      if(!aF&&!bF){pa.x+=ox;pa.y+=oy;pb.x-=ox;pb.y-=oy}
      else if(!aF){pa.x+=ox*2;pa.y+=oy*2}
      else if(!bF){pb.x-=ox*2;pb.y-=oy*2}
    }
    for(let i=0;i<particles.length;i++){
      if(particles[i].pinned){particles[i].x=particles[i].ix;particles[i].y=particles[i].iy}
    }
    if(grabbedIdx>=0){particles[grabbedIdx].x=mouseX;particles[grabbedIdx].y=mouseY}
  }
  for(let i=0;i<constraints.length;i++){
    const c=constraints[i];
    if(c.broken)continue;
    const pa=particles[c.a],pb=particles[c.b];
    const dx=pb.x-pa.x,dy=pb.y-pa.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(dist>c.rest*TEAR_TH)breakCon(i);
  }
}

function segInt(ax,ay,bx,by,cx,cy,dx,dy){
  const d1=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);
  const d2=(bx-ax)*(dy-ay)-(by-ay)*(dx-ax);
  const d3=(dx-cx)*(ay-cy)-(dy-cy)*(ax-cx);
  const d4=(dx-cx)*(by-cy)-(dy-cy)*(bx-cx);
  return((d1>0&&d2<0)||(d1<0&&d2>0))&&((d3>0&&d4<0)||(d3<0&&d4>0));
}

function doCut(){
  for(let i=0;i<constraints.length;i++){
    if(constraints[i].broken)continue;
    const c=constraints[i],pa=particles[c.a],pb=particles[c.b];
    if(segInt(prevMX,prevMY,mouseX,mouseY,pa.x,pa.y,pb.x,pb.y))breakCon(i);
  }
}

function render(){
  const w=window.innerWidth,h=window.innerHeight;
  const dpr=window.devicePixelRatio||1;
  ctx.save();
  ctx.setTransform(dpr,0,0,dpr,0,0);

  const bg=ctx.createRadialGradient(w*0.5,h*0.35,0,w*0.5,h*0.5,Math.max(w,h)*0.85);
  bg.addColorStop(0,'#1c1c32');bg.addColorStop(1,'#080812');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);

  const buckets=[];
  for(let s=0;s<NUM_SHADES;s++)buckets[s]=[];

  const cw=(COLS-1)*SPACING,ch=(ROWS-1)*SPACING;
  const cx0=window.innerWidth/2,cy0=60+ch/2;

  for(let j=0;j<ROWS-1;j++){
    for(let i=0;i<COLS-1;i++){
      if(!hEdge[j][i]||!hEdge[j+1][i]||!vEdge[j][i]||!vEdge[j][i+1])continue;
      const p00=particles[idx(i,j)],p10=particles[idx(i+1,j)],p01=particles[idx(i,j+1)],p11=particles[(j+1)*COLS+i+1];

      const rc1=restCrosses[j*(COLS-1)+i*2];
      const rc2=restCrosses[j*(COLS-1)+i*2+1];

      const c1=(p10.x-p00.x)*(p01.y-p00.y)-(p10.y-p00.y)*(p01.x-p00.x);
      const c2=(p11.x-p10.x)*(p01.y-p10.y)-(p11.y-p10.y)*(p01.x-p10.x);

      const r1=rc1!==0?c1/rc1:1;
      const r2=rc2!==0?c2/rc2:1;

      const tc1x=(p00.x+p10.x+p01.x)/3,tc1y=(p00.y+p10.y+p01.y)/3;
      const tc2x=(p10.x+p11.x+p01.x)/3,tc2y=(p10.y+p11.y+p01.y)/3;

      function shade(cx,cy,ratio,back){
        const nx=(cx-cx0)/(cw*0.6),ny=(cy-cy0)/(ch*0.6);
        const light=0.55+0.25*(-nx*0.5-ny*0.5+0.25);
        const af=Math.min(1,Math.max(0.25,ratio));
        const spec=Math.pow(Math.max(0,1-Math.abs(1-ratio)),4)*0.35;
        let b=(0.35+0.55*af)*light+spec;
        if(back)b*=0.6;
        b+=((i+j)%2===0?-0.02:0.02);
        b=Math.max(0.08,Math.min(1.15,b));
        return Math.min(NUM_SHADES-1,Math.floor(b*NUM_SHADES));
      }

      const s1=shade(tc1x,tc1y,r1,c1<0);
      const s2=shade(tc2x,tc2y,r2,c2<0);
      buckets[s1].push(p00.x,p00.y,p10.x,p10.y,p01.x,p01.y);
      buckets[s2].push(p10.x,p10.y,p11.x,p11.y,p01.x,p01.y);
    }
  }

  for(let s=0;s<NUM_SHADES;s++){
    const b=buckets[s];
    if(b.length===0)continue;
    const t=(s+0.5)/NUM_SHADES;
    const r=Math.round(55+200*t);
    const g=Math.round(50+185*t);
    const bl=Math.round(42+168*t);
    ctx.fillStyle='rgb('+r+','+g+','+bl+')';
    ctx.beginPath();
    for(let k=0;k<b.length;k+=6){
      ctx.moveTo(b[k],b[k+1]);
      ctx.lineTo(b[k+2],b[k+3]);
      ctx.lineTo(b[k+4],b[k+5]);
      ctx.closePath();
    }
    ctx.fill();
  }

  ctx.restore();
}

function getCentroid(){
  let sx=0,sy=0;
  for(let i=0;i<particles.length;i++){sx+=particles[i].x;sy+=particles[i].y}
  return{x:sx/particles.length,y:sy/particles.length};
}

window.__arena={
  stats:function(){
    let ic=0;
    for(let i=0;i<constraints.length;i++)if(!constraints[i].broken)ic++;
    return{particles:particles.length,constraints:ic,pinned:pinnedCount,centroid:getCentroid()};
  }
};

document.getElementById('wind').addEventListener('change',function(){windOn=this.checked});
document.getElementById('gravity').addEventListener('input',function(){
  gravityVal=parseFloat(this.value);
  document.getElementById('gravVal').textContent=gravityVal.toFixed(1);
});
document.getElementById('iterations').addEventListener('input',function(){
  solverIters=parseInt(this.value);
  document.getElementById('iterVal').textContent=solverIters;
});
document.getElementById('reset').addEventListener('click',function(){
  initCloth();
  grabbedIdx=-1;isGrabbing=false;isCutting=false;
  simTime=0;accumulator=0;
});

window.addEventListener('keydown',function(e){
  if(e.code==='Space'&&e.target.tagName!=='INPUT'&&e.target.tagName!=='TEXTAREA'){
    e.preventDefault();paused=!paused;
  }
});

canvas.addEventListener('mousedown',function(e){
  e.preventDefault();
  mouseX=e.clientX;mouseY=e.clientY;prevMX=mouseX;prevMY=mouseY;
  if(e.button===0&&!e.shiftKey){
    let bi=-1,bd=GRAB_R;
    for(let i=0;i<particles.length;i++){
      const dx=particles[i].x-e.clientX,dy=particles[i].y-e.clientY;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<bd){bd=d;bi=i}
    }
    if(bi>=0){isGrabbing=true;grabbedIdx=bi}
  }
  if(e.button===2||(e.button===0&&e.shiftKey)){isCutting=true}
});

window.addEventListener('mousemove',function(e){
  mouseX=e.clientX;mouseY=e.clientY;
  if(isCutting){doCut();prevMX=mouseX;prevMY=mouseY}
});

window.addEventListener('mouseup',function(e){
  if(e.button===0){isGrabbing=false;grabbedIdx=-1}
  if(e.button===2||(e.button===0&&e.shiftKey)){isCutting=false}
});

canvas.addEventListener('contextmenu',function(e){e.preventDefault()});

initCloth();
lastTime=performance.now();
fpsLast=lastTime;

function loop(now){
  requestAnimationFrame(loop);
  let ft=(now-lastTime)/1000;
  lastTime=now;
  if(ft>0.1)ft=0.1;

  fpsCount++;
  if(now-fpsLast>=500){
    curFps=Math.round(fpsCount*1000/(now-fpsLast));
    fpsCount=0;fpsLast=now;
    document.getElementById('fps').textContent=curFps;
    let ic=0;for(let i=0;i<constraints.length;i++)if(!constraints[i].broken)ic++;
    document.getElementById('pCount').textContent=particles.length;
    document.getElementById('cCount').textContent=ic;
  }

  if(!paused){
    accumulator+=ft;
    let steps=0;
    while(accumulator>=DT&&steps<4){
      stepPhysics();
      accumulator-=DT;
      steps++;
    }
    if(accumulator>DT*4)accumulator=DT*4;
  }

  render();
}
requestAnimationFrame(loop);
})();
</script>
</body>
</html>
```