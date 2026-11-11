```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Vectorly</title>
<style>
*{box-sizing:border-box}
html,body{height:100%;margin:0;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#fff}
#app{display:flex;flex-direction:column;height:100vh}
#toolbar{display:flex;align-items:center;gap:6px;padding:8px 10px;background:#f6f6f7;border-bottom:1px solid #e5e5e5}
#toolbar button{border:1px solid #ccc;background:#fff;border-radius:6px;padding:6px 10px;cursor:pointer;font-weight:600}
#toolbar button.active{background:#0a84ff;color:#fff;border-color:#0a84ff}
#zoom-indicator{margin-left:auto;margin-right:12px;font-variant-numeric:tabular-nums}
#workspace{flex:1;display:flex;min-height:0}
#stage{flex:1;background:
  linear-gradient(0deg,#eee 1px,transparent 1px),
  linear-gradient(90deg,#eee 1px,transparent 1px);
  background-size:24px 24px;background-color:#fafafa;touch-action:none}
#props{width:240px;border-left:1px solid #e5e5e5;padding:12px;background:#fff;overflow:auto}
#props h3{margin:12px 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#666}
#props label{display:block;font-size:12px;margin:8px 0}
#props input{width:100%;margin-top:2px}
</style>
</head>
<body>
<div id="app">
  <header id="toolbar">
    <button data-tool="select" class="active" title="Select (V)">V</button>
    <button data-tool="rect" title="Rectangle (R)">R</button>
    <button data-tool="ellipse" title="Ellipse (E)">E</button>
    <button data-tool="line" title="Line (L)">L</button>
    <div id="zoom-indicator">100%</div>
    <button id="export-svg">Export SVG</button>
  </header>
  <div id="workspace">
    <svg id="stage">
      <g id="shapes-layer"></g>
      <g id="selection-layer"></g>
      <g id="handles-layer"></g>
      <g id="preview-layer"></g>
      <g id="marquee-layer"></g>
    </svg>
    <aside id="props">
      <label>Fill <input type="color" id="fill-color"></label>
      <label>Stroke <input type="color" id="stroke-color"></label>
      <label>Stroke width <input type="number" id="stroke-width" min="0" step="1"></label>
      <h3>Transform</h3>
      <label>X <input type="number" id="prop-x"></label>
      <label>Y <input type="number" id="prop-y"></label>
      <label>W <input type="number" id="prop-w"></label>
      <label>H <input type="number" id="prop-h"></label>
    </aside>
  </div>
</div>
<script>
(() => {
 const NS='http://www.w3.org/2000/svg';
 const stage=document.getElementById('stage');
 const shapesLayer=document.getElementById('shapes-layer');
 const selectionLayer=document.getElementById('selection-layer');
 const handlesLayer=document.getElementById('handles-layer');
 const previewLayer=document.getElementById('preview-layer');
 const marqueeLayer=document.getElementById('marquee-layer');

 let shapes=[]; let currentStyle={fill:'#ff3b30',stroke:'#000000',strokeWidth:2};
 let selectedIds=new Set(); let tool='select'; let zoom=1; let vx=0,vy=0; let idCounter=1;
 let history=[]; let historyIndex=-1; let pointerState=null; let spacePressed=false;

 const genId=()=> 's'+(idCounter++);
 const clientToWorld=e=>{const p=stage.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const ctm=stage.getScreenCTM();if(!ctm)return{x:0,y:0};return p.matrixTransform(ctm.inverse());};
 const updateViewBox=()=>stage.setAttribute('viewBox',`${vx} ${vy} ${stage.clientWidth/zoom} ${stage.clientHeight/zoom}`);
 const updateZoomIndicator=()=>document.getElementById('zoom-indicator').textContent=Math.round(zoom*100)+'%';
 const saveSnapshot=()=>({shapes:JSON.parse(JSON.stringify(shapes)),style:{...currentStyle},selectedIds:[...selectedIds]});
 const restoreSnapshot=s=>{shapes=JSON.parse(JSON.stringify(s.shapes));currentStyle={...s.style};selectedIds=new Set(s.selectedIds);render();updateProps();};
 const commitState=()=>{const snap=saveSnapshot();history=history.slice(0,historyIndex+1);history.push(snap);historyIndex=history.length-1;if(history.length>200){history.shift();historyIndex--;}localStorage.setItem('vectorly',JSON.stringify({shapes,style:currentStyle,selectedIds:[...selectedIds]}));};
 const initHistory=()=>{history=[saveSnapshot()];historyIndex=0;};

 function render(){
   shapesLayer.innerHTML='';
   shapes.forEach(s=>{
     let el;
     if(s.type==='rect'){el=document.createElementNS(NS,'rect');el.setAttribute('x',s.x);el.setAttribute('y',s.y);el.setAttribute('width',s.width);el.setAttribute('height',s.height);}
     else if(s.type==='ellipse'){el=document.createElementNS(NS,'ellipse');el.setAttribute('cx',s.cx);el.setAttribute('cy',s.cy);el.setAttribute('rx',s.rx);el.setAttribute('ry',s.ry);}
     else{el=document.createElementNS(NS,'line');el.setAttribute('x1',s.x1);el.setAttribute('y1',s.y1);el.setAttribute('x2',s.x2);el.setAttribute('y2',s.y2);}
     el.setAttribute('data-shape',s.type);el.setAttribute('data-id',s.id);el.setAttribute('fill',s.fill);el.setAttribute('stroke',s.stroke);el.setAttribute('stroke-width',s.strokeWidth);el.setAttribute('stroke-linecap','round');
     if(selectedIds.has(s.id))el.setAttribute('data-selected','true');else el.removeAttribute('data-selected');
     shapesLayer.appendChild(el);
   });
   selectionLayer.innerHTML='';
   selectedIds.forEach(id=>{
     const s=shapes.find(sh=>sh.id===id);if(!s)return;
     let x,y,w,h;
     if(s.type==='rect'){x=s.x;y=s.y;w=s.width;h=s.height;}
     else if(s.type==='ellipse'){x=s.cx-s.rx;y=s.cy-s.ry;w=s.rx*2;h=s.ry*2;}
     else{const minX=Math.min(s.x1,s.x2),minY=Math.min(s.y1,s.y2),maxX=Math.max(s.x1,s.x2),maxY=Math.max(s.y1,s.y2);x=minX;y=minY;w=maxX-minX;h=maxY-minY;}
     const r=document.createElementNS(NS,'rect');r.setAttribute('x',x);r.setAttribute('y',y);r.setAttribute('width',w);r.setAttribute('height',h);r.setAttribute('fill','none');r.setAttribute('stroke','#0a84ff');r.setAttribute('stroke-width',1/zoom);r.setAttribute('stroke-dasharray',`${4/zoom} ${4/zoom}`);selectionLayer.appendChild(r);
   });
   handlesLayer.innerHTML='';
   if(selectedIds.size===1){
     const id=[...selectedIds][0];const s=shapes.find(sh=>sh.id===id);
     if(s&&(s.type==='rect'||s.type==='ellipse')){
       let x,y,w,h;if(s.type==='rect'){x=s.x;y=s.y;w=s.width;h=s.height;}else{x=s.cx-s.rx;y=s.cy-s.ry;w=s.rx*2;h=s.ry*2;}
       const pts=[{code:'nw',cx:x,cy:y},{code:'n',cx:x+w/2,cy:y},{code:'ne',cx:x+w,cy:y},{code:'e',cx:x+w,cy:y+h/2},{code:'se',cx:x+w,cy:y+h},{code:'s',cx:x+w/2,cy:y+h},{code:'sw',cx:x,cy:y+h},{code:'w',cx:x,cy:y+h/2}];
       pts.forEach(p=>{const c=document.createElementNS(NS,'circle');c.setAttribute('cx',p.cx);c.setAttribute('cy',p.cy);c.setAttribute('r',5/zoom);c.setAttribute('fill','#fff');c.setAttribute('stroke','#0a84ff');c.setAttribute('stroke-width',1/zoom);c.setAttribute('data-handle',p.code);handlesLayer.appendChild(c);});
     }
   }
 }
 function updateProps(){
   const fillI=document.getElementById('fill-color'),strokeI=document.getElementById('stroke-color'),swI=document.getElementById('stroke-width');
   const px=document.getElementById('prop-x'),py=document.getElementById('prop-y'),pw=document.getElementById('prop-w'),ph=document.getElementById('prop-h');
   if(selectedIds.size===0){fillI.value=currentStyle.fill;strokeI.value=currentStyle.stroke;swI.value=currentStyle.strokeWidth;px.value=py.value=pw.value=ph.value='';[px,py,pw,ph].forEach(i=>i.disabled=true);return;}
   const s=shapes.find(sh=>sh.id===[...selectedIds][0]);if(!s)return;
   fillI.value=s.fill;strokeI.value=s.stroke;swI.value=s.strokeWidth;
   if(s.type==='rect'){px.value=s.x;py.value=s.y;pw.value=s.width;ph.value=s.height;}
   else if(s.type==='ellipse'){px.value=s.cx-s.rx;py.value=s.cy-s.ry;pw.value=s.rx*2;ph.value=s.ry*2;}
   else{px.value=py.value=pw.value=ph.value='';}
   const single=selectedIds.size===1&&(s.type==='rect'||s.type==='ellipse');
   [px,py,pw,ph].forEach(i=>i.disabled=!single);
 }
 const hitTest=(s,pt)=>{const tol=6/zoom;if(s.type==='rect')return pt.x>=s.x&&pt.x<=s.x+s.width&&pt.y>=s.y&&pt.y<=s.y+s.height;if(s.type==='ellipse'){const dx=pt.x-s.cx,dy=pt.y-s.cy;return (dx*dx)/(s.rx*s.rx)+(dy*dy)/(s.ry*s.ry)<=1;}if(s.type==='line'){const x1=s.x1,y1=s.y1,x2=s.x2,y2=s.y2;const len2=(x2-x1)**2+(y2-y1)**2;if(len2===0)return Math.hypot(pt.x-x1,pt.y-y1)<=tol;let t=((pt.x-x1)*(x2-x1)+(pt.y-y1)*(y2-y1))/len2;t=Math.max(0,Math.min(1,t));const px=x1+t*(x2-x1),py=y1+t*(y2-y1);return Math.hypot(pt.x-px,pt.y-py)<=tol;}return false;};
 const findShapeAt=pt=>{for(let i=shapes.length-1;i>=0;i--)if(hitTest(shapes[i],pt))return shapes[i];return null;};
 const findHandle=(s,pt)=>{let x,y,w,h;if(s.type==='rect'){x=s.x;y=s.y;w=s.width;h=s.height;}else if(s.type==='ellipse'){x=s.cx-s.rx;y=s.cy-s.ry;w=s.rx*2;h=s.ry*2;}else return null;const tol=6/zoom;const pts=[{code:'nw',cx:x,cy:y},{code:'n',cx:x+w/2,cy:y},{code:'ne',cx:x+w,cy:y},{code:'e',cx:x+w,cy:y+h/2},{code:'se',cx:x+w,cy:y+h},{code:'s',cx:x+w/2,cy:y+h},{code:'sw',cx:x,cy:y+h},{code:'w',cx:x,cy:y+h/2}];for(const p of pts)if(Math.hypot(pt.x-p.cx,pt.y-p.cy)<=tol)return p.code;return null;};

 document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
 function setTool(t){tool=t;document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===t));}
 document.getElementById('fill-color').addEventListener('input',e=>{const v=e.target.value;currentStyle.fill=v;selectedIds.forEach(id=>{const s=shapes.find(sh=>sh.id===id);if(s)s.fill=v;});render();commitState();});
 document.getElementById('stroke-color').addEventListener('input',e=>{const v=e.target.value;currentStyle.stroke=v;selectedIds.forEach(id=>{const s=shapes.find(sh=>sh.id===id);if(s)s.stroke=v;});render();commitState();});
 document.getElementById('stroke-width').addEventListener('input',e=>{const v=parseFloat(e.target.value)||0;currentStyle.strokeWidth=v;selectedIds.forEach(id=>{const s=shapes.find(sh=>sh.id===id);if(s)s.strokeWidth=v;});render();commitState();});
 ['prop-x','prop-y','prop-w','prop-h'].forEach(id=>document.getElementById(id).addEventListener('change',e=>{if(selectedIds.size!==1)return;const v=parseFloat(e.target.value);if(isNaN(v))return;const s=shapes.find(sh=>sh.id===[...selectedIds][0]);if(!s)return;if(id==='prop-x'){if(s.type==='rect')s.x=v;else if(s.type==='ellipse')s.cx=v+s.rx;}else if(id==='prop-y'){if(s.type==='rect')s.y=v;else if(s.type==='ellipse')s.cy=v+s.ry;}else if(id==='prop-w'){if(s.type==='rect')s.width=v;else if(s.type==='ellipse')s.rx=v/2;}else if(id==='prop-h'){if(s.type==='rect')s.height=v;else if(s.type==='ellipse')s.ry=v/2;}render();updateProps();commitState();}));

 stage.addEventListener('pointerdown',e=>{
   if(e.button===2)return;
   const pt=clientToWorld(e);
   if(e.button===1||spacePressed){pointerState={mode:'pan',startPt:pt,startVX:vx,startVY:vy};stage.setPointerCapture(e.pointerId);return;}
   if(tool!=='select'){pointerState={mode:'draw',startPt:pt,tool,shift:e.shiftKey};stage.setPointerCapture(e.pointerId);previewLayer.innerHTML='';const el=document.createElementNS(NS,tool==='line'?'line':tool==='ellipse'?'ellipse':'rect');el.setAttribute('fill',currentStyle.fill);el.setAttribute('stroke',currentStyle.stroke);el.setAttribute('stroke-width',currentStyle.strokeWidth);el.setAttribute('fill-opacity','0.4');previewLayer.appendChild(el);pointerState.previewEl=el;return;}
   const handleCode=selectedIds.size===1?findHandle(shapes.find(s=>s.id===[...selectedIds][0]),pt):null;
   if(handleCode){pointerState={mode:'resize',shapeId:[...selectedIds][0],handleCode,startPt:pt,startShape:JSON.parse(JSON.stringify(shapes.find(s=>s.id===[...selectedIds][0]))) };stage.setPointerCapture(e.pointerId);return;}
   const shape=findShapeAt(pt);
   if(shape){if(e.shiftKey){selectedIds.has(shape.id)?selectedIds.delete(shape.id):selectedIds.add(shape.id);}else{selectedIds.clear();selectedIds.add(shape.id);}render();updateProps();pointerState={mode:'move',startPt:pt,initialPositions:{}};selectedIds.forEach(id=>{pointerState.initialPositions[id]=JSON.parse(JSON.stringify(shapes.find(sh=>sh.id===id)));});stage.setPointerCapture(e.pointerId);}
   else{selectedIds.clear();render();updateProps();pointerState={mode:'marquee',startPt:pt};marqueeLayer.innerHTML='';const r=document.createElementNS(NS,'rect');r.setAttribute('fill','none');r.setAttribute('stroke','#0a84ff');r.setAttribute('stroke-width',1/zoom);r.setAttribute('stroke-dasharray','4 4');marqueeLayer.appendChild(r);pointerState.marqueeEl=r;stage.setPointerCapture(e.pointerId);}
 });

 window.addEventListener('pointermove',e=>{
   if(!pointerState)return;const pt=clientToWorld(e);
   if(pointerState.mode==='pan'){const dx=pt.x-pointerState.startPt.x,dy=pt.y-pointerState.startPt.y;vx=pointerState.startVX-dx;vy=pointerState.startVY-dy;updateViewBox();return;}
   if(pointerState.mode==='draw'){const s=pointerState.startPt,dx=pt.x-s.x,dy=pt.y-s.y,el=pointerState.previewEl;if(pointerState.tool==='rect'){let x=Math.min(s.x,pt.x),y=Math.min(s.y,pt.y),w=Math.abs(dx),h=Math.abs(dy);if(pointerState.shift){const a=Math.max(w,h);w=a;h=a;}el.setAttribute('x',x);el.setAttribute('y',y);el.setAttribute('width',w);el.setAttribute('height',h);}else if(pointerState.tool==='ellipse'){const cx=s.x+dx/2,cy=s.y+dy/2;let rx=Math.abs(dx)/2,ry=Math.abs(dy)/2;if(pointerState.shift){const a=Math.max(rx,ry);rx=a;ry=a;}el.setAttribute('cx',cx);el.setAttribute('cy',cy);el.setAttribute('rx',rx);el.setAttribute('ry',ry);}else{let x2=pt.x,y2=pt.y;if(pointerState.shift){const ang=Math.atan2(dy,dx),a=Math.round(ang/(Math.PI/4))*(Math.PI/4),d=Math.hypot(dx,dy);x2=s.x+Math.cos(a)*d;y2=s.y+Math.sin(a)*d;}el.setAttribute('x1',s.x);el.setAttribute('y1',s.y);el.setAttribute('x2',x2);el.setAttribute('y2',y2);}return;}
   if(pointerState.mode==='move'){const dx=pt.x-pointerState.startPt.x,dy=pt.y-pointerState.startPt.y;selectedIds.forEach(id=>{const s=shapes.find(sh=>sh.id===id),init=pointerState.initialPositions[id];if(!s||!init)return;if(s.type==='rect'){s.x=init.x+dx;s.y=init.y+dy;}else if(s.type==='ellipse'){s.cx=init.cx+dx;s.cy=init.cy+dy;}else{s.x1=init.x1+dx;s.y1=init.y1+dy;s.x2=init.x2+dx;s.y2=init.y2+dy;}});render();return;}
   if(pointerState.mode==='resize'){const s=shapes.find(sh=>sh.id===pointerState.shapeId),init=pointerState.startShape;if(!s||!init)return;if(s.type==='rect'){const left0=init.x,top0=init.y,right0=init.x+init.width,bottom0=init.y+init.height;let left=left0,top=top0,right=right0,bottom=bottom0;const h=pointerState.handleCode;if(h==='nw'){left=pt.x;top=pt.y;}else if(h==='n'){top=pt.y;}else if(h==='ne'){right=pt.x;top=pt.y;}else if(h==='e'){right=pt.x;}else if(h==='se'){right=pt.x;bottom=pt.y;}else if(h==='s'){bottom=pt.y;}else if(h==='sw'){left=pt.x;bottom=pt.y;}else if(h==='w'){left=pt.x;}let nl=Math.min(left,right),nt=Math.min(top,bottom),nw=Math.abs(right-left),nh=Math.abs(bottom-top);if(e.shiftKey&&['nw','ne','se','sw'].includes(h)){const aspect=init.width/init.height;const anchorX=(h==='nw'||h==='sw')?right0:left0;const anchorY=(h==='nw'||h==='ne')?bottom0:top0;const signX=Math.sign(pt.x-anchorX)||1,signY=Math.sign(pt.y-anchorY)||1;const newW=Math.abs(pt.x-anchorX);const newH=newW/aspect;const newX=anchorX+signX*newW;const newY=anchorY+signY*newH;nl=Math.min(newX,anchorX);nt=Math.min(newY,anchorY);nw=Math.abs(newX-anchorX);nh=Math.abs(newY-anchorY);}s.x=nl;s.y=nt;s.width=nw;s.height=nh;}else if(s.type==='ellipse'){const left0=init.cx-init.rx,top0=init.cy-init.ry,right0=init.cx+init.rx,bottom0=init.cy+init.ry;let left=left0,top=top0,right=right0,bottom=bottom0;const h=pointerState.handleCode;if(h==='nw'){left=pt.x;top=pt.y;}else if(h==='n'){top=pt.y;}else if(h==='ne'){right=pt.x;top=pt.y;}else if(h==='e'){right=pt.x;}else if(h==='se'){right=pt.x;bottom=pt.y;}else if(h==='s'){bottom=pt.y;}else if(h==='sw'){left=pt.x;bottom=pt.y;}else if(h==='w'){left=pt.x;}let nl=Math.min(left,right),nt=Math.min(top,bottom),nw=Math.abs(right-left),nh=Math.abs(bottom-top);if(e.shiftKey&&['nw','ne','se','sw'].includes(h)){const aspect=init.rx/init.ry;const anchorX=(h==='nw'||h==='sw')?right0:left0;const anchorY=(h==='nw'||h==='ne')?bottom0:top0;const signX=Math.sign(pt.x-anchorX)||1,signY=Math.sign(pt.y-anchorY)||1;const newW=Math.abs(pt.x-anchorX);const newH=newW/aspect;const newX=anchorX+signX*newW;const newY=anchorY+signY*newH;nl=Math.min(newX,anchorX);nt=Math.min(newY,anchorY);nw=Math.abs(newX-anchorX);nh=Math.abs(newY-anchorY);}s.cx=nl+nw/2;s.cy=nt+nh/2;s.rx=nw/2;s.ry=nh/2;}render();return;}
   if(pointerState.mode==='marquee'){const s=pointerState.startPt,x=Math.min(s.x,pt.x),y=Math.min(s.y,pt.y),w=Math.abs(pt.x-s.x),h=Math.abs(pt.y-s.y);const r=pointerState.marqueeEl;r.setAttribute('x',x);r.setAttribute('y',y);r.setAttribute('width',w);r.setAttribute('height',h);return;}
 });

 window.addEventListener('pointerup',e=>{
   if(!pointerState)return;const mode=pointerState.mode;
   if(mode==='draw'){const s=pointerState.startPt,pt=clientToWorld(e),dx=pt.x-s.x,dy=pt.y-s.y;if(Math.hypot(dx,dy)<3){previewLayer.innerHTML='';}else{let shape;const id=genId();if(pointerState.tool==='rect'){const x=Math.min(s.x,pt.x),y=Math.min(s.y,pt.y);let w=Math.abs(dx),h=Math.abs(dy);if(pointerState.shift){const a=Math.max(w,h);w=a;h=a;}shape={id,type:'rect',x,y,width:w,height:h,fill:currentStyle.fill,stroke:currentStyle.stroke,strokeWidth:currentStyle.strokeWidth};}else if(pointerState.tool==='ellipse'){const cx=s.x+dx/2,cy=s.y+dy/2;let rx=Math.abs(dx)/2,ry=Math.abs(dy)/2;if(pointerState.shift){const a=Math.max(rx,ry);rx=a;ry=a;}shape={id,type:'ellipse',cx,cy,rx,ry,fill:currentStyle.fill,stroke:currentStyle.stroke,strokeWidth:currentStyle.strokeWidth};}else{let x2=pt.x,y2=pt.y;if(pointerState.shift){const ang=Math.atan2(dy,dx),a=Math.round(ang/(Math.PI/4))*(Math.PI/4),d=Math.hypot(dx,dy);x2=s.x+Math.cos(a)*d;y2=s.y+Math.sin(a)*d;}shape={id,type:'line',x1:s.x,y1:s.y,x2,y2,fill:currentStyle.fill,stroke:currentStyle.stroke,strokeWidth:currentStyle.strokeWidth};}shapes.push(shape);selectedIds.clear();selectedIds.add(id);setTool('select');render();updateProps();commitState();}previewLayer.innerHTML='';}
   else if(mode==='move'||mode==='resize'){render();updateProps();commitState();}
   else if(mode==='marquee'){const s=pointerState.startPt,pt=clientToWorld(e),x=Math.min(s.x,pt.x),y=Math.min(s.y,pt.y),w=Math.abs(pt.x-s.x),h=Math.abs(pt.y-s.y);const sel=[];shapes.forEach(s=>{let sx,sy,sw,sh;if(s.type==='rect'){sx=s.x;sy=s.y;sw=s.width;sh=s.height;}else if(s.type==='ellipse'){sx=s.cx-s.rx;sy=s.cy-s.ry;sw=s.rx*2;sh=s.ry*2;}else{const minX=Math.min(s.x1,s.x2),minY=Math.min(s.y1,s.y2),maxX=Math.max(s.x1,s.x2),maxY=Math.max(s.y1,s.y2);sx=minX;sy=minY;sw=maxX-minX;sh=maxY-minY;}if(!(sx+sw<x||sx>x+w||sy+sh<y||sy>y+h))sel.push(s.id);});selectedIds=new Set(sel);render();updateProps();commitState();marqueeLayer.innerHTML='';}
   pointerState=null;
 });

 stage.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();const f=e.deltaY<0?1.1:0.9;const old=zoom;zoom=Math.max(0.1,Math.min(8,zoom*f));const pt=clientToWorld(e);const oldVW=stage.clientWidth/old,newVW=stage.clientWidth/zoom;vx=pt.x-(pt.x-vx)*(newVW/oldVW);vy=pt.y-(pt.y-vy)*(newVW/oldVW);updateViewBox();updateZoomIndicator();render();}});

 window.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;if(e.code==='Space'){spacePressed=true;e.preventDefault();return;}if(['v','r','e','l'].includes(e.key.toLowerCase())){const m={v:'select',r:'rect',e:'ellipse',l:'line'};setTool(m[e.key.toLowerCase()]);return;}if(e.key==='Delete'||e.key==='Backspace'){if(selectedIds.size>0){shapes=shapes.filter(s=>!selectedIds.has(s.id));selectedIds.clear();render();updateProps();commitState();}e.preventDefault();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='a'){selectedIds=new Set(shapes.map(s=>s.id));render();updateProps();e.preventDefault();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){const newIds=[];const copies=[];selectedIds.forEach(id=>{const s=shapes.find(sh=>sh.id===id);if(!s)return;const c=JSON.parse(JSON.stringify(s));c.id=genId();if(c.type==='rect'){c.x+=10;c.y+=10;}else if(c.type==='ellipse'){c.cx+=10;c.cy+=10;}else{c.x1+=10;c.y1+=10;c.x2+=10;c.y2+=10;}copies.push(c);newIds.push(c.id);});shapes.push(...copies);selectedIds=new Set(newIds);render();updateProps();commitState();e.preventDefault();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){if(e.shiftKey){if(historyIndex<history.length-1){historyIndex++;restoreSnapshot(history[historyIndex]);}}else{if(historyIndex>0){historyIndex--;restoreSnapshot(history[historyIndex]);}}e.preventDefault();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){if(historyIndex<history.length-1){historyIndex++;restoreSnapshot(history[historyIndex]);}e.preventDefault();}if(e.key===']'){const ids=[...selectedIds];ids.sort((a,b)=>shapes.findIndex(s=>s.id===a)-shapes.findIndex(s=>s.id===b));for(let i=ids.length-1;i>=0;i--){const idx=shapes.findIndex(s=>s.id===ids[i]);if(idx>=0&&idx<shapes.length-1)[shapes[idx],shapes[idx+1]]=[shapes[idx+1],shapes[idx]];}render();commitState();e.preventDefault();}if(e.key==='['){const ids=[...selectedIds];ids.sort((a,b)=>shapes.findIndex(s=>s.id===a)-shapes.findIndex(s=>s.id===b));for(let i=0;i<ids.length;i++){const idx=shapes.findIndex(s=>s.id===ids[i]);if(idx>0)[shapes[idx],shapes[idx-1]]=[shapes[idx-1],shapes[idx]];}render();commitState();e.preventDefault();}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){const step=e.shiftKey?10:1;let dx=0,dy=0;if(e.key==='ArrowLeft')dx=-step;if(e.key==='ArrowRight')dx=step;if(e.key==='ArrowUp')dy=-step;if(e.key==='ArrowDown')dy=step;selectedIds.forEach(id=>{const s=shapes.find(sh=>sh.id===id);if(!s)return;if(s.type==='rect'){s.x+=dx;s.y+=dy;}else if(s.type==='ellipse'){s.cx+=dx;s.cy+=dy;}else{s.x1+=dx;s.y1+=dy;s.x2+=dx;s.y2+=dy;}});render();commitState();e.preventDefault();}});
 window.addEventListener('keyup',e=>{if(e.code==='Space')spacePressed=false;});

 document.getElementById('export-svg').addEventListener('click',()=>{let out=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">`;shapes.forEach(s=>{if(s.type==='rect')out+=`<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}"/>`;else if(s.type==='ellipse')out+=`<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}"/>`;else out+=`<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" stroke-linecap="round"/>`;});out+=`</svg>`;const blob=new Blob([out],{type:'image/svg+xml'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='drawing.svg';a.click();URL.revokeObjectURL(url);});

 function init(){const saved=localStorage.getItem('vectorly');if(saved){try{const d=JSON.parse(saved);shapes=d.shapes||[];currentStyle=d.style||currentStyle;selectedIds=new Set(d.selectedIds||[]);idCounter=shapes.reduce((m,s)=>Math.max(m,parseInt(s.id.slice(1)||0)),0)+1;}catch{}}updateViewBox();render();updateProps();updateZoomIndicator();initHistory();setTool('select');}
 init();
 window.addEventListener('resize',()=>{updateViewBox();render();});
})();
</script>
</body>
</html>
```