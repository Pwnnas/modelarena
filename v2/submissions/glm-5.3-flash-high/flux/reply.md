```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1280">
<title>Flux — Digital Logic Laboratory</title>
<style>
:root{
  --bg:#0c1017; --panel:#131a24; --panel2:#0f141d; --line:#232c3d;
  --txt:#d7e0ee; --mut:#7b8899; --acc:#4cc9f0; --acc2:#f0b429;
  --c0:#4da3ff; --c1:#ffb454; --cX:#ff5d5d; --cZ:#66738a; --cM:#b48cf2;
  --ok:#5dd39e; --mono:ui-monospace,"SF Mono","Cascadia Code",Menlo,Consolas,monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{
  background:var(--bg);color:var(--txt);
  font:13px/1.45 -apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  display:grid;grid-template-rows:46px 1fr 26px;grid-template-columns:190px 1fr 302px;
  height:100vh;overflow:hidden;user-select:none;-webkit-user-select:none;
}
button{
  background:#1a2332;border:1px solid var(--line);color:var(--txt);border-radius:6px;
  height:28px;padding:0 11px;font:inherit;font-size:12px;cursor:pointer;white-space:nowrap;
}
button:hover{border-color:#3d4f74;background:#212c40}
button:active{transform:translateY(1px)}
button:disabled{opacity:.35;cursor:default;transform:none}
button:focus-visible{outline:1px solid var(--acc)}
input,textarea{
  background:#0a0e15;border:1px solid var(--line);color:var(--txt);border-radius:5px;
  font:12px var(--mono);user-select:text;-webkit-user-select:text;
}
input:focus,textarea:focus{outline:none;border-color:var(--acc)}

/* ---------- top bar ---------- */
#topbar{grid-column:1/4;display:flex;align-items:center;gap:8px;padding:0 12px;background:var(--panel);border-bottom:1px solid var(--line)}
.brand{font-weight:800;letter-spacing:.28em;color:var(--acc);font-size:14px;margin-right:8px;display:flex;align-items:center;gap:7px}
.brand svg{display:block}
.tb-group{display:flex;gap:5px;align-items:center}
.tb-sep{width:1px;height:22px;background:var(--line);margin:0 5px}
.tickbox{font-family:var(--mono);background:#0a0e15;border:1px solid var(--line);border-radius:6px;padding:4px 10px;display:flex;gap:8px;align-items:baseline}
.tickbox .lbl{color:var(--mut);font-size:10px;letter-spacing:.12em;text-transform:uppercase}
#tick{color:var(--acc2);font-weight:700;min-width:4ch;text-align:right;font-size:13px}
#step-count{width:64px;height:28px;padding:0 6px;text-align:center}
#zoompct{font-family:var(--mono);font-size:10.5px;color:var(--mut);min-width:38px;text-align:center}
#run[aria-pressed="true"]{background:#123047;border-color:var(--acc);color:var(--acc)}
.spacer{flex:1}

/* ---------- palette ---------- */
#palette{grid-row:2;grid-column:1;background:var(--panel2);border-right:1px solid var(--line);padding:10px;display:flex;flex-direction:column;gap:4px;min-height:0;overflow:auto}
.ph{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--mut);margin:3px 0 5px;font-weight:700}
.pgrid{display:grid;grid-template-columns:1fr 1fr;gap:5px}
[data-add]{height:30px;padding:0 4px;font-size:11px;font-family:var(--mono);display:flex;align-items:center;justify-content:center;gap:4px}
[data-add] b{color:var(--acc);font-weight:700}
#legend{display:flex;gap:9px;margin:8px 0 2px;flex-wrap:wrap}
#legend span{display:flex;align-items:center;gap:4px;font-family:var(--mono);font-size:10.5px;color:var(--mut)}
#legend i{width:9px;height:9px;border-radius:50%;display:inline-block}
#json{flex:1;min-height:110px;resize:none;padding:7px;font-size:10.5px;line-height:1.5;color:#a9c1dd;white-space:pre;overflow:auto}

/* ---------- workspace ---------- */
#ws-wrap{grid-row:2;grid-column:2;position:relative;min-width:0;min-height:0;background:#0a0e14}
#workspace{display:block;width:100%;height:100%;touch-action:none;cursor:default}
.node{cursor:grab}
.node:active{cursor:grabbing}
.body{fill:#1a2233;stroke:#33405e;stroke-width:1.2}
.node:hover .body{stroke:#4d5f86}
.node[aria-selected="true"] .body{stroke:var(--acc);stroke-width:1.8;filter:drop-shadow(0 0 6px rgba(76,201,240,.4))}
.headline{stroke:#26314a;stroke-width:1}
.ttl{fill:#cfe3ff;font-size:10px;font-weight:700;letter-spacing:.09em}
.wb{fill:var(--mut);font-size:9px;font-family:var(--mono)}
.node text{pointer-events:none}
.val{font-size:12.5px;font-family:var(--mono);font-weight:600}
.v0{fill:var(--c0)}.v1{fill:var(--c1)}.vX{fill:var(--cX)}.vZ{fill:var(--cZ)}.vM{fill:var(--cM)}
.port{cursor:crosshair}
.phit{fill:transparent;pointer-events:all}
.pdot{fill:#111726;stroke:#64769b;stroke-width:1.5}
.port.out .pdot{fill:var(--acc);stroke:#9ce4ff}
.port:hover .pdot{stroke:#fff}
.port.pok .pdot{stroke:var(--ok);stroke-width:2.4}
.port.pbad .pdot{opacity:.3}
.port.phov-ok .pdot{stroke:var(--ok);stroke-width:3;fill:var(--ok)}
.port.phov-bad .pdot{stroke:var(--cX);stroke-width:3}
.plbl{fill:#64769b;font-size:8.5px;font-family:var(--mono)}
.wire{fill:none;stroke-width:2;stroke-linecap:round}
.w0{stroke:var(--c0)}.w1{stroke:var(--c1)}.wX{stroke:var(--cX)}.wM{stroke:var(--cM)}
.wZ{stroke:var(--cZ);stroke-dasharray:5 4}
.tw{stroke:var(--acc2);stroke-dasharray:7 5;stroke-width:2;fill:none}

/* ---------- side panel ---------- */
#side{grid-row:2;grid-column:3;border-left:1px solid var(--line);background:var(--panel2);display:flex;flex-direction:column;min-height:0}
#inspector{padding:10px 12px 12px;border-bottom:1px solid var(--line)}
.row{display:flex;align-items:center;gap:8px;margin:6px 0}
.row .k{width:50px;color:var(--mut);font-size:10px;text-transform:uppercase;letter-spacing:.08em;flex:none}
.row input{flex:1;min-width:0;height:26px;padding:0 8px}
.kv{font-family:var(--mono);font-size:12px;color:var(--acc)}
#insp-empty{color:var(--mut);font-size:12px;padding:4px 0 2px}
#mem-view{display:none;margin-top:8px;border-top:1px dashed var(--line);padding-top:7px}
#mem-view .mh{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut);margin-bottom:5px}
#mem-view .mgrid{display:grid;grid-template-columns:1fr 1fr;gap:2px 10px;font-family:var(--mono);font-size:10.5px}
#mem-view .mgrid span:first-child{color:#55607a}
#mem-view .mgrid span:last-child{color:var(--c1)}
#truth-panel{flex:1;display:flex;flex-direction:column;min-height:0}
#truth-scroll{overflow:auto;flex:1;padding:0 10px 10px}
#truth-table{border-collapse:collapse;font-family:var(--mono);font-size:10.5px;min-width:100%}
#truth-table th{position:sticky;top:0;background:var(--panel);color:var(--mut);font-weight:600;padding:5px 8px;text-align:center;border-bottom:1px solid var(--line);white-space:nowrap;z-index:1}
#truth-table td{padding:2.5px 8px;text-align:center;border-bottom:1px solid #1a2231;color:var(--txt);white-space:nowrap}
#truth-table td. bits{color:var(--c0)}
#truth-table tr:hover td{background:#151d2b}
#truth-table td.bits{color:#9fb6d4}
#truth-empty{color:var(--mut);font-size:11.5px;padding:6px 0}

/* ---------- footer ---------- */
footer{grid-column:1/4;display:flex;align-items:center;gap:12px;background:var(--panel);border-top:1px solid var(--line);padding:0 12px;min-width:0}
#status{color:var(--mut);font-size:12px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;min-width:0}
#status[data-error="import"],#status[data-error="truth-unsupported"]{color:var(--cX);font-weight:600}
#hint{margin-left:auto;color:#525d75;font-size:10.5px;white-space:nowrap;flex:none}
</style>
</head>
<body>

<header id="topbar">
  <div class="brand">
    <svg width="15" height="15" viewBox="0 0 16 16"><path d="M9 1 3 9h4l-1 6 7-9H8l1-5z" fill="#4cc9f0"/></svg>
    FLUX
  </div>
  <div class="tb-group">
    <button id="new" title="Start a new empty circuit">New</button>
    <button id="undo" title="Undo (Ctrl+Z)">Undo</button>
    <button id="redo" title="Redo (Ctrl+Shift+Z)">Redo</button>
  </div>
  <div class="tb-sep"></div>
  <div class="tb-group">
    <button id="step" title="Advance the simulation">Step</button>
    <input id="step-count" type="number" min="1" max="4096" value="1" aria-label="Ticks per step">
    <button id="run" aria-pressed="false" title="Run / Pause (Space)">Run</button>
    <button id="reset-state" title="Reset simulation state">Reset State</button>
  </div>
  <div class="tb-sep"></div>
  <div class="tickbox"><span class="lbl">tick</span><span id="tick">0</span></div>
  <div class="tb-sep"></div>
  <div class="tb-group">
    <button id="zoom-out" title="Zoom out">−</button>
    <span id="zoompct">100%</span>
    <button id="zoom-in" title="Zoom in">+</button>
    <button id="fit" title="Fit circuit in view">Fit</button>
  </div>
  <div class="tb-sep"></div>
  <div class="tb-group">
    <button id="import" title="Import JSON from the textarea">Import</button>
    <button id="export" title="Export JSON to the textarea">Export</button>
    <button id="truth" title="Generate truth table">Truth</button>
    <button id="demo" title="Load the demo circuit">Demo</button>
  </div>
</header>

<aside id="palette">
  <div class="ph">Components</div>
  <div class="pgrid" id="pgrid"></div>
  <div class="ph" style="margin-top:10px">Signals</div>
  <div id="legend">
    <span><i style="background:var(--c0)"></i>0</span>
    <span><i style="background:var(--c1)"></i>1</span>
    <span><i style="background:var(--cX)"></i>X</span>
    <span><i style="background:var(--cZ)"></i>Z</span>
  </div>
  <div class="ph" style="margin-top:10px">Document JSON</div>
  <textarea id="json" spellcheck="false" placeholder="Import / Export — the circuit document appears here on Export; paste JSON here and press Import."></textarea>
</aside>

<main id="ws-wrap">
  <svg id="workspace" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">
        <circle cx="1.2" cy="1.2" r="1.1" fill="#182031"/>
      </pattern>
    </defs>
    <g id="scene"></g>
  </svg>
</main>

<aside id="side">
  <section id="inspector">
    <div class="ph">Inspector</div>
    <div id="insp-empty">Nothing selected. Click a component to inspect it.</div>
    <div id="insp-body" hidden>
      <div class="row"><span class="k">ID</span><span id="insp-id" class="kv"></span></div>
      <div class="row"><span class="k">Type</span><span id="insp-type" class="kv"></span></div>
      <label class="row"><span class="k">Width</span><input id="node-width" type="number" min="1" max="8" step="1"></label>
      <label class="row" id="row-value"><span class="k">Value</span><input id="node-value" type="text" spellcheck="false" maxlength="8"></label>
      <label class="row" id="row-period"><span class="k">Period</span><input id="node-period" type="number" min="1" max="32" step="1"></label>
      <div id="mem-view"><div class="mh">Memory · 16 words</div><div class="mgrid" id="mem-grid"></div></div>
    </div>
  </section>
  <section id="truth-panel">
    <div class="ph" style="padding:10px 12px 4px">Truth Table</div>
    <div id="truth-scroll"><div id="truth-empty">Press <b>Truth</b> to enumerate an acyclic combinational circuit (≤ 8 input bits, ≤ 16 probes).</div><table id="truth-table"></table></div>
  </section>
</aside>

<footer>
  <div id="status" data-error=""></div>
  <div id="hint">drag body to move · drag ports to wire · Alt+drag pan · wheel zoom · Del delete · Esc deselect · Space run</div>
</footer>

<script>
'use strict';
/* ============================== constants ============================== */
const $=id=>document.getElementById(id);
const SVGNS='http://www.w3.org/2000/svg';
const TYPES=['INPUT','CLOCK','NOT','AND','OR','XOR','MUX','TRI','ADD','DFF','RAM','PROBE'];
const IN_PORTS={INPUT:[],CLOCK:[],NOT:['in'],AND:['a','b'],OR:['a','b'],XOR:['a','b'],
  MUX:['a','b','s'],TRI:['in','en'],ADD:['a','b'],DFF:['d','clk','rst'],
  RAM:['addr','din','we','clk'],PROBE:['in']};
const ONE_BIT=new Set(['s','en','we','clk','rst']);
const ID_PREFIX={INPUT:'in',CLOCK:'clk',NOT:'nt',AND:'and',OR:'or',XOR:'xor',MUX:'mux',TRI:'tri',ADD:'add',DFF:'dff',RAM:'ram',PROBE:'prb'};
const ID_RE=/^[A-Za-z0-9_-]+$/;
const VAL_RE=/^[01XZ]+$/;

function portW(type,port,w){
  if(port==='out')return w;
  if(ONE_BIT.has(port))return 1;
  if(port==='addr')return 4;
  return w;
}
function geom(n){
  const ins=IN_PORTS[n.type];
  const W=n.type==='RAM'?112:(n.type==='PROBE'?84:96);
  const H=ins.length?Math.max(54,36+(ins.length-1)*20+16):50;
  return{W,H};
}
const inPortY=i=>38+i*20;

/* ============================== state ============================== */
let doc={version:1,nodes:[],wires:[]};
let view={x:80,y:70,scale:1};
let net=null;                 // compiled netlist
let sim=null;                 // {tick, out[], mem Map, prevClk Map}
let nodeById=new Map();
let usedIds=new Set();
let selected=null;
let running=false;
let undoStack=[],redoStack=[];
let truthToken=0;

let nodeEls=new Map(),valueEls=new Map(),portEls=new Map();
let wireEls=[],wireSrc=[],lastWireCls=[];
const lastVal=new Map();

const svg=$('workspace'),scene=$('scene');
let dragLayer=null;

/* ============================== utilities ============================== */
function svgEl(tag,attrs){
  const e=document.createElementNS(SVGNS,tag);
  if(attrs)for(const k in attrs)e.setAttribute(k,attrs[k]);
  return e;
}
const serialize=()=>JSON.stringify(doc);
const normBit=c=>c==='Z'?'X':c;
function mapBits(w,f){let r='';for(let i=0;i<w.length;i++)r+=f(w[i]);return r;}
function binVal(w){
  for(let i=0;i<w.length;i++){const c=w[i];if(c!=='0'&&c!=='1')return -1;}
  return parseInt(w,2);
}
function mergeWords(a,b){let r='';for(let i=0;i<a.length;i++)r+=(a[i]===b[i]?a[i]:'X');return r;}
function sigCls(w){
  let x=false,z=false,lo=false,hi=false;
  for(let i=0;i<w.length;i++){const c=w[i];
    if(c==='X')x=true;else if(c==='Z')z=true;else if(c==='0')lo=true;else hi=true;}
  if(x)return'X';
  if(lo&&hi)return'M';
  if(z&&(lo||hi))return'M';
  return lo?'0':hi?'1':'Z';
}
function resolveMulti(words,w){
  if(words.length===0)return'Z'.repeat(w);
  if(words.length===1)return words[0];
  let r='';
  for(let b=0;b<w;b++){
    let x=false,lo=false,hi=false,nz=0;
    for(let j=0;j<words.length;j++){const c=words[j][b];
      if(c==='Z')continue; nz++;
      if(c==='X')x=true;else if(c==='0')lo=true;else hi=true;}
    if(nz===0)r+='Z';
    else if(x||(lo&&hi))r+='X';
    else r+=lo?'0':'1';
  }
  return r;
}

/* ============================== netlist compile ============================== */
function compile(d){
  const idx=new Map();
  d.nodes.forEach((n,i)=>idx.set(n.id,i));
  const drv=d.nodes.map(()=>({}));
  const incident=new Map();
  d.wires.forEach((w,j)=>{
    const si=idx.get(w.from.node),ti=idx.get(w.to.node);
    (drv[ti][w.to.port]||(drv[ti][w.to.port]=[])).push(si);
    let a=incident.get(w.from.node);if(!a){a=[];incident.set(w.from.node,a);}a.push(j);
    a=incident.get(w.to.node);if(!a){a=[];incident.set(w.to.node,a);}a.push(j);
  });
  const inputIdx=[],probeIdx=[];
  d.nodes.forEach((n,i)=>{if(n.type==='INPUT')inputIdx.push(i);if(n.type==='PROBE')probeIdx.push(i);});
  return{nodes:d.nodes,idx,N:d.nodes.length,widths:d.nodes.map(n=>n.width),drv,incident,inputIdx,probeIdx};
}
function resolvePort(st,i,port,pwv){
  const ds=net.drv[i][port];
  if(!ds||ds.length===0)return'Z'.repeat(pwv);
  if(ds.length===1)return st.out[ds[0]];
  const words=[];
  for(let k=0;k<ds.length;k++)words.push(st.out[ds[k]]);
  return resolveMulti(words,pwv);
}

/* ============================== simulation ============================== */
function initState(){
  const st={tick:0,out:new Array(net.N),mem:new Map(),prevClk:new Map()};
  for(let i=0;i<net.N;i++){
    const n=net.nodes[i],w=net.widths[i];
    switch(n.type){
      case'INPUT':st.out[i]=n.value;break;
      case'CLOCK':st.out[i]='0';break;
      case'DFF':st.out[i]='0'.repeat(w);st.prevClk.set(n.id,'0');break;
      case'RAM':st.out[i]='0'.repeat(w);st.prevClk.set(n.id,'0');
        st.mem.set(n.id,new Array(16).fill('0'.repeat(w)));break;
      case'PROBE':break;
      default:st.out[i]='X'.repeat(w);
    }
  }
  for(const i of net.probeIdx)st.out[i]=resolvePort(st,i,'in',net.widths[i]);
  return st;
}

function tickState(st){
  const no=new Array(net.N);
  for(let i=0;i<net.N;i++){
    const n=net.nodes[i],t=n.type,w=net.widths[i];
    if(t==='INPUT'){no[i]=st.out[i];continue;}
    if(t==='CLOCK'){no[i]=(Math.floor((st.tick+1)/n.period)%2)===0?'0':'1';continue;}
    if(t==='PROBE')continue;
    if(t==='NOT'){
      const a=resolvePort(st,i,'in',w);
      no[i]=mapBits(a,c=>c==='0'?'1':c==='1'?'0':'X');continue;
    }
    if(t==='AND'||t==='OR'||t==='XOR'){
      const a=resolvePort(st,i,'a',w),b=resolvePort(st,i,'b',w);
      let r='';
      for(let k=0;k<w;k++){
        const x=normBit(a[k]),y=normBit(b[k]);
        if(t==='AND')r+=(x==='0'||y==='0')?'0':(x==='1'&&y==='1')?'1':'X';
        else if(t==='OR')r+=(x==='1'||y==='1')?'1':(x==='0'&&y==='0')?'0':'X';
        else r+=((x==='0'||x==='1')&&(y==='0'||y==='1'))?((x!==y)?'1':'0'):'X';
      }
      no[i]=r;continue;
    }
    if(t==='ADD'){
      const a=resolvePort(st,i,'a',w),b=resolvePort(st,i,'b',w);
      const av=binVal(a),bv=binVal(b);
      no[i]=(av<0||bv<0)?'X'.repeat(w):((av+bv)%Math.pow(2,w)).toString(2).padStart(w,'0');
      continue;
    }
    if(t==='MUX'){
      const a=resolvePort(st,i,'a',w),b=resolvePort(st,i,'b',w),s=resolvePort(st,i,'s',1);
      if(s==='0')no[i]=a;
      else if(s==='1')no[i]=b;
      else{let r='';for(let k=0;k<w;k++)r+=a[k]===b[k]?a[k]:'X';no[i]=r;}
      continue;
    }
    if(t==='TRI'){
      const a=resolvePort(st,i,'in',w),en=resolvePort(st,i,'en',1);
      if(en==='0')no[i]='Z'.repeat(w);
      else if(en==='1')no[i]=a;
      else{let r='';for(let k=0;k<w;k++)r+=a[k]==='Z'?'Z':'X';no[i]=r;}
      continue;
    }
    if(t==='DFF'){
      const d=resolvePort(st,i,'d',w);
      const clk=normBit(resolvePort(st,i,'clk',1));
      const rst=normBit(resolvePort(st,i,'rst',1));
      const old=st.prevClk.get(n.id)||'0';
      const edge=(old==='0'&&clk==='1')?2:(old!=='1'&&clk!=='0')?1:0;
      let o;
      if(rst==='1')o='0'.repeat(w);
      else if(rst!=='0')o='X'.repeat(w);
      else if(edge===2)o=mapBits(d,c=>c==='Z'?'X':c);
      else if(edge===1)o='X'.repeat(w);
      else o=st.out[i];
      no[i]=o;st.prevClk.set(n.id,clk);continue;
    }
    if(t==='RAM'){
      const addr=resolvePort(st,i,'addr',4);
      const din=resolvePort(st,i,'din',w);
      const we=normBit(resolvePort(st,i,'we',1));
      const clk=normBit(resolvePort(st,i,'clk',1));
      const old=st.prevClk.get(n.id)||'0';
      const edge=(old==='0'&&clk==='1')?2:(old!=='1'&&clk!=='0')?1:0;
      const memv=st.mem.get(n.id);
      let o;
      if(edge===2){const av=binVal(addr);o=av<0?'X'.repeat(w):memv[av];}
      else if(edge===1)o='X'.repeat(w);
      else o=st.out[i];
      if(edge>0&&we!=='0'){
        const dn=mapBits(din,c=>c==='Z'?'X':c);
        const av=binVal(addr);
        if(av>=0){
          if(edge===2&&we==='1')memv[av]=dn;
          else memv[av]=mergeWords(memv[av],dn);
        }else{
          for(let k=0;k<16;k++)memv[k]=mergeWords(memv[k],dn);
        }
      }
      no[i]=o;st.prevClk.set(n.id,clk);continue;
    }
  }
  st.out=no; // commit; probes resolve from the freshly committed outputs
  for(const i of net.probeIdx)no[i]=resolvePort(st,i,'in',net.widths[i]);
  st.tick++;
}

/* ============================== validation ============================== */
function validateDoc(o){
  if(!o||typeof o!=='object'||Array.isArray(o))return'document must be a JSON object';
  if(o.version!==1)return'unsupported version (expected 1)';
  if(!Array.isArray(o.nodes))return'"nodes" must be an array';
  if(!Array.isArray(o.wires))return'"wires" must be an array';
  const ids=new Set();
  for(const n of o.nodes){
    if(!n||typeof n!=='object')return'invalid node entry';
    if(typeof n.id!=='string'||!ID_RE.test(n.id))return'bad node id '+JSON.stringify(n.id);
    if(ids.has(n.id))return'duplicate node id "'+n.id+'"';
    if(!TYPES.includes(n.type))return'unknown node type "'+n.type+'"';
    if(typeof n.x!=='number'||!isFinite(n.x)||typeof n.y!=='number'||!isFinite(n.y))
      return'node "'+n.id+'" needs finite x and y';
    if(!Number.isInteger(n.width)||n.width<1||n.width>8)
      return'node "'+n.id+'" width must be an integer from 1 through 8';
    if(n.type==='INPUT'){
      if(typeof n.value!=='string'||n.value.length!==n.width||!VAL_RE.test(n.value))
        return'INPUT "'+n.id+'" needs a value of exactly '+n.width+' characters from 0,1,X,Z';
    }
    if(n.type==='CLOCK'){
      if(n.width!==1)return'CLOCK "'+n.id+'" must have width 1';
      if(!Number.isInteger(n.period)||n.period<1||n.period>32)
        return'CLOCK "'+n.id+'" needs an integer period from 1 through 32';
    }
    ids.add(n.id);
  }
  const byId=new Map(o.nodes.map(n=>[n.id,n]));
  const seen=new Set();
  for(const w of o.wires){
    if(!w||typeof w!=='object')return'invalid wire entry';
    if(typeof w.id!=='string'||!ID_RE.test(w.id))return'bad wire id '+JSON.stringify(w.id);
    if(seen.has(w.id))return'duplicate wire id "'+w.id+'"';
    seen.add(w.id);
    if(!w.from||!w.to||typeof w.from!=='object'||typeof w.to!=='object')
      return'wire "'+w.id+'" needs from/to endpoints';
    const fn=byId.get(w.from.node),tn=byId.get(w.to.node);
    if(!fn)return'wire "'+w.id+'" references unknown node '+JSON.stringify(w.from.node);
    if(!tn)return'wire "'+w.id+'" references unknown node '+JSON.stringify(w.to.node);
    if(fn.type==='PROBE'||w.from.port!=='out')
      return'wire "'+w.id+'": source port must be "out" on a non-PROBE node';
    if(!IN_PORTS[tn.type].includes(w.to.port))
      return'wire "'+w.id+'": node "'+tn.id+'" has no input port "'+w.to.port+'"';
    if(portW(fn.type,'out',fn.width)!==portW(tn.type,w.to.port,tn.width))
      return'wire "'+w.id+'": port widths do not match ('+fn.width+' → '+tn.width+')';
    const key=w.from.node+'|out>'+w.to.node+'|'+w.to.port;
    if(seen.has('dup:'+key))return'duplicate connection on wire "'+w.id+'"';
    seen.add('dup:'+key);
  }
  return null;
}
function normalizeDoc(o){
  const nodes=o.nodes.map(n=>{
    const r={id:n.id,type:n.type,x:n.x,y:n.y,width:n.width};
    if(n.type==='INPUT')r.value=n.value;
    if(n.type==='CLOCK')r.period=n.period;
    return r;
  });
  const wires=o.wires.map(w=>({id:w.id,from:{node:w.from.node,port:w.from.port},to:{node:w.to.node,port:w.to.port}}));
  return{version:1,nodes,wires};
}
function hasCycle(d){
  const adj=new Map();
  for(const w of d.wires){
    let a=adj.get(w.from.node);if(!a){a=[];adj.set(w.from.node,a);}
    a.push(w.to.node);
  }
  const color=new Map();
  for(const n of d.nodes){
    if(color.get(n.id))continue;
    const stack=[[n.id,0]];color.set(n.id,1);
    while(stack.length){
      const top=stack[stack.length-1];
      const ns=adj.get(top[0])||[];
      if(top[1]<ns.length){
        const v=ns[top[1]];top[1]++;
        const c=color.get(v)||0;
        if(c===1)return true;
        if(c===0){color.set(v,1);stack.push([v,0]);}
      }else{color.set(top[0],2);stack.pop();}
    }
  }
  return false;
}

/* ============================== history & edits ============================== */
function pushHistory(pre){
  undoStack.push(pre);
  if(undoStack.length>300)undoStack.shift();
  redoStack.length=0;
  updateHistoryButtons();
}
function updateHistoryButtons(){
  $('undo').disabled=undoStack.length===0;
  $('redo').disabled=redoStack.length===0;
}
function finishEdit(pre){
  if(pre!==null&&pre!==undefined)pushHistory(pre);
  afterDocChange();
}
function undo(){
  if(!undoStack.length)return;
  redoStack.push(serialize());
  if(redoStack.length>300)redoStack.shift();
  doc=JSON.parse(undoStack.pop());
  selected=null;
  afterDocChange();
  setStatus('Undo.','');
}
function redo(){
  if(!redoStack.length)return;
  undoStack.push(serialize());
  doc=JSON.parse(redoStack.pop());
  selected=null;
  afterDocChange();
  setStatus('Redo.','');
}
function afterDocChange(){
  nodeById=new Map(doc.nodes.map(n=>[n.id,n]));
  usedIds=new Set();
  doc.nodes.forEach(n=>usedIds.add(n.id));
  doc.wires.forEach(w=>usedIds.add(w.id));
  net=compile(doc);
  truthToken++;
  renderScene();
  resetSim();
  renderInspector();
  scheduleSave();
  updateHistoryButtons();
}
function freshId(p){
  let i=1;
  while(usedIds.has(p+i))i++;
  const id=p+i;usedIds.add(id);
  return id;
}

/* ============================== simulation control ============================== */
function resetSim(){
  sim=initState(net);
  setRunning(false);
  updateTickUI(true);
}
function updateTickUI(force){
  $('tick').textContent=String(sim.tick);
  refreshValues(force);
  refreshWires(force);
  updateMemView();
}
function refreshValues(force){
  for(let i=0;i<net.N;i++){
    const el=valueEls.get(net.nodes[i].id);
    if(!el)continue;
    const v=sim.out[i];
    if(force||lastVal.get(net.nodes[i].id)!==v){
      el.textContent=v;
      el.setAttribute('class','val v'+sigCls(v));
      lastVal.set(net.nodes[i].id,v);
    }
  }
}
function refreshWires(force){
  for(let j=0;j<wireEls.length;j++){
    const c=sigCls(sim.out[wireSrc[j]]);
    if(force||lastWireCls[j]!==c){
      wireEls[j].setAttribute('class','wire w'+c);
      lastWireCls[j]=c;
    }
  }
}
let rafId=0,lastTs=0,acc=0;
function setRunning(v){
  running=v;
  $('run').setAttribute('aria-pressed',v?'true':'false');
  $('run').textContent=v?'Pause':'Run';
  if(v){lastTs=0;acc=0;cancelAnimationFrame(rafId);rafId=requestAnimationFrame(loop);}
  else cancelAnimationFrame(rafId);
}
function loop(ts){
  if(!running)return;
  if(!lastTs)lastTs=ts;
  let dt=ts-lastTs;lastTs=ts;
  if(dt>250)dt=250;
  acc+=dt;
  let did=0;
  while(acc>=100&&did<120){tickState(sim);acc-=100;did++;}
  if(acc>200)acc=200;
  if(did)updateTickUI(false);
  rafId=requestAnimationFrame(loop);
}
function toggleRun(){setRunning(!running);}

/* ============================== rendering ============================== */
function applyView(){
  scene.setAttribute('transform','translate('+view.x+' '+view.y+') scale('+view.scale+')');
  $('zoompct').textContent=Math.round(view.scale*100)+'%';
}
function toWorld(px,py){return{x:(px-view.x)/view.scale,y:(py-view.y)/view.scale};}

function wireD(w){
  const a=nodeById.get(w.from.node),b=nodeById.get(w.to.node);
  if(!a||!b)return'';
  const ga=geom(a);
  const bi=IN_PORTS[b.type].indexOf(w.to.port);
  const x1=a.x+ga.W,y1=a.y+ga.H/2;
  const x2=b.x,y2=b.y+inPortY(bi<0?0:bi);
  const dx=Math.max(24,Math.min(130,Math.abs(x2-x1)*0.5));
  return'M '+x1+' '+y1+' C '+(x1+dx)+' '+y1+', '+(x2-dx)+' '+y2+', '+x2+' '+y2;
}
function portPos(id,port){
  const n=nodeById.get(id);const g=geom(n);
  if(port==='out')return{x:n.x+g.W,y:n.y+g.H/2};
  const i=IN_PORTS[n.type].indexOf(port);
  return{x:n.x,y:n.y+inPortY(i<0?0:i)};
}

function renderScene(){
  scene.replaceChildren();
  valueEls=new Map();nodeEls=new Map();portEls=new Map();
  wireEls=[];wireSrc=[];lastWireCls=[];
  lastVal.clear();
  scene.appendChild(svgEl('rect',{x:-9000,y:-9000,width:18000,height:18000,fill:'url(#grid)'}));
  const gw=svgEl('g'),gn=svgEl('g');
  doc.wires.forEach((w,j)=>{
    const p=svgEl('path',{d:wireD(w),'data-wire':w.id,'class':'wire'});
    p.setAttribute('vector-effect','non-scaling-stroke');
    wireEls.push(p);
    const si=net.idx.get(w.from.node);
    wireSrc.push(si===undefined?-1:si);
    lastWireCls.push(null);
    gw.appendChild(p);
  });
  doc.nodes.forEach(n=>gn.appendChild(buildNode(n)));
  dragLayer=svgEl('g');
  scene.append(gw,dragLayer);
}
function buildNode(n){
  const g=svgEl('g',{'class':'node','data-node':n.id,'aria-selected':'false',
    transform:'translate('+n.x+','+n.y+')'});
  const W=geom(n).W,H=geom(n).H;
  g.appendChild(svgEl('rect',{'class':'body','data-title':'',x:0,y:0,width:W,height:H,rx:9}));
  g.appendChild(svgEl('line',{'class':'headline',x1:0,y1:20,x2:W,y2:20}));
  const tt=svgEl('text',{'class':'ttl',x:9,y:14});tt.textContent=n.type;g.appendChild(tt);
  const wb=svgEl('text',{'class':'wb',x:W-8,y:14,'text-anchor':'end'});
  wb.textContent=(n.type==='RAM'?'16w×':'×')+n.width;g.appendChild(wb);
  const vt=svgEl('text',{'class':'val',x:W/2,y:20+(H-20)/2+4,'text-anchor':'middle','data-value':n.id});
  vt.textContent='…';g.appendChild(vt);
  valueEls.set(n.id,vt);

  const pmap=new Map();portEls.set(n.id,pmap);
  IN_PORTS[n.type].forEach((p,i)=>{
    const y=inPortY(i);
    const pg=svgEl('g',{'class':'port in','data-port':p,transform:'translate(0,'+y+')'});
    pg.appendChild(svgEl('circle',{'class':'phit',r:9}));
    pg.appendChild(svgEl('circle',{'class':'pdot',r:4}));
    const lb=svgEl('text',{'class':'plbl',x:8,y:y+3});lb.textContent=p;
    g.appendChild(pg);g.appendChild(lb);
    pmap.set(p,pg);
  });
  if(n.type!=='PROBE'){
    const pg=svgEl('g',{'class':'port out','data-port':'out',transform:'translate('+W+','+H/2+')'});
    pg.appendChild(svgEl('circle',{'class':'phit',r:9}));
    pg.appendChild(svgEl('circle',{'class':'pdot',r:4.2}));
    g.appendChild(pg);
    pmap.set('out',pg);
  }
  nodeEls.set(n.id,g);
  return g;
}
function updateIncidentWires(id){
  const arr=net.incident.get(id);
  if(arr)for(const j of arr)wireEls[j].setAttribute('d',wireD(doc.wires[j]));
}

/* ============================== selection & inspector ============================== */
function select(id){
  if(selected&&nodeEls.get(selected))nodeEls.get(selected).setAttribute('aria-selected','false');
  selected=id||null;
  if(selected&&nodeEls.get(selected))nodeEls.get(selected).setAttribute('aria-selected','true');
  renderInspector();
}
function renderInspector(){
  const n=selected?nodeById.get(selected):null;
  $('insp-empty').hidden=!!n;
  $('insp-body').hidden=!n;
  if(!n)return;
  $('insp-id').textContent=n.id;
  $('insp-type').textContent=n.type;
  $('node-width').value=n.width;
  $('node-width').disabled=false;
  const isVal=n.type==='INPUT',isClk=n.type==='CLOCK';
  $('row-value').hidden=!isVal;
  $('row-period').hidden=!isClk;
  if(isVal)$('node-value').value=n.value;
  if(isClk)$('node-period').value=n.period;
  updateMemView();
}
function updateMemView(){
  const mv=$('mem-view'),grid=$('mem-grid');
  const n=selected?nodeById.get(selected):null;
  if(!n||n.type!=='RAM'){mv.style.display='none';return;}
  mv.style.display='block';
  const m=sim.mem.get(n.id);
  let html='';
  for(let i=0;i<16;i++)
    html+='<span>'+i.toString(2).padStart(4,'0')+'</span><span>'+m[i]+'</span>';
  grid.innerHTML=html;
}
function commitWidth(){
  const n=selected?nodeById.get(selected):null;
  if(!n)return;
  const v=parseInt($('node-width').value,10);
  if(!Number.isInteger(v)||v<1||v>8){setStatus('Width must be an integer from 1 through 8.','');return;}
  if(v===n.width){renderInspector();return;}
  const pre=serialize();
  n.width=v;
  if(n.type==='INPUT'){
    const old=n.value;
    n.value=v<=old.length?old.slice(old.length-v):'0'.repeat(v-old.length)+old;
  }
  doc.wires=doc.wires.filter(w=>{
    const ends=[[w.from,w.to],[w.to,w.from]];
    for(const[e,other]of ends){
      if(e.node!==n.id)continue;
      const on=nodeById.get(other.node);
      if(portW(n.type,e.port,n.width)!==portW(on.type,other.port,on.width))return false;
    }
    return true;
  });
  finishEdit(pre);
  setStatus('Width of "'+n.id+'" set to '+v+(nodeById?'':'')+'.','' );
}
function commitValue(){
  const n=selected?nodeById.get(selected):null;
  if(!n||n.type!=='INPUT')return;
  let v=$('node-value').value.trim().toUpperCase();
  if(!VAL_RE.test(v)||v.length!==n.width){
    setStatus('Value must be exactly '+n.width+' characters of 0,1,X,Z.','');return;
  }
  if(v===n.value)return;
  const pre=serialize();
  n.value=v;
  finishEdit(pre);
  setStatus('Value of "'+n.id+'" set to '+v+'.','');
}
function commitPeriod(){
  const n=selected?nodeById.get(selected):null;
  if(!n||n.type!=='CLOCK')return;
  const v=parseInt($('node-period').value,10);
  if(!Number.isInteger(v)||v<1||v>32){setStatus('Period must be an integer from 1 through 32.','');return;}
  if(v===n.period){renderInspector();return;}
  const pre=serialize();
  n.period=v;
  finishEdit(pre);
  setStatus('Period of "'+n.id+'" set to '+v+'.','');
}

/* ============================== status ============================== */
function setStatus(msg,err){
  const s=$('status');
  s.textContent=msg;
  s.dataset.error=err||'';
}

/* ============================== pointer interaction ============================== */
let drag=null,hoverPort=null,tempWire=null;
function clearHover(){
  if(hoverPort){hoverPort.el.classList.remove('phov-ok','phov-bad');hoverPort=null;}
}
function clearPortHints(){
  portEls.forEach(m=>m.forEach(g=>g.classList.remove('pok','pbad')));
}
function dropCheck(from,tportEl){
  const tng=tportEl.closest('[data-node]');
  if(!tng)return{ok:false,reason:'Drop on a port.'};
  const tn=nodeById.get(tng.getAttribute('data-node'));
  const tport=tportEl.getAttribute('data-port');
  let f=from,t={node:tn.id,port:tport};
  if(f.port!=='out'&&t.port==='out'){const tmp=f;f=t;t=tmp;}
  if(f.port!=='out'||t.port==='out')return{ok:false,reason:'Connect an output port to an input port.'};
  if(f.node===t.node&&f.port===t.port)return{ok:false,reason:'Connect an output port to an input port.'};
  const fn=nodeById.get(f.node);
  const wf=portW(fn.type,f.port,fn.width),wt=portW(tn.type,t.port,tn.width);
  if(wf!==wt)return{ok:false,reason:'Width mismatch: '+wf+' → '+wt+'.'};
  const dup=doc.wires.some(w=>w.from.node===f.node&&w.from.port===f.port&&
    w.to.node===t.node&&w.to.port===t.port);
  if(dup)return{ok:false,reason:'Duplicate connection — ignored.'};
  return{ok:true,f,t};
}
function tempPathD(sx,sy,tx,ty,srcIsOut){
  const dx=42;
  return srcIsOut
    ?'M '+sx+' '+sy+' C '+(sx+dx)+' '+sy+', '+(tx-dx)+' '+ty+', '+tx+' '+ty
    :'M '+sx+' '+sy+' C '+(sx-dx)+' '+sy+', '+(tx+dx)+' '+ty+', '+tx+' '+ty;
}
function svgPoint(e){
  const r=svg.getBoundingClientRect();
  return{px:e.clientX-r.left,py:e.clientY-r.top};
}

svg.addEventListener('pointerdown',e=>{
  if(e.button!==0&&e.button!==1)return;
  const{px,py}=svgPoint(e);
  const t=e.target;
  const pg=t.closest?t.closest('[data-port]'):null;
  const ng=t.closest?t.closest('[data-node]'):null;
  if(e.button===1||e.altKey&&!pg&&!ng){
    drag={kind:'pan',sx:px,sy:py,vx:view.x,vy:view.y,moved:false};
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();return;
  }
  if(e.button!==0)return;
  if(pg&&ng){
    const n=nodeById.get(ng.getAttribute('data-node'));
    const port=pg.getAttribute('data-port');
    select(n.id);
    const p=portPos(n.id,port);
    drag={kind:'wire',from:{node:n.id,port},srcIsOut:port==='out'};
    tempWire=svgEl('path',{'class':'tw'});
    tempWire.setAttribute('d',tempPathD(p.x,p.y,p.x,p.y,drag.srcIsOut));
    dragLayer.appendChild(tempWire);
    // pre-highlight compatible targets
    const srcW=portW(n.type,port,n.width);
    portEls.forEach((m,nid)=>{
      if(nid===n.id&&port==='out'){}
      m.forEach((gel,pr)=>{
        const on=nodeById.get(nid);
        let ok=false;
        if(port==='out'&&pr!=='out')ok=portW(on.type,pr,on.width)===srcW;
        else if(port!=='out'&&pr==='out')ok=on.width===srcW;
        gel.classList.add(ok?'pok':'pbad');
      });
    });
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();return;
  }
  if(ng&&t.closest('[data-title]')){
    const id=ng.getAttribute('data-node');
    select(id);
    const n=nodeById.get(id);
    const wpt=toWorld(px,py);
    drag={kind:'move',id,ox:wpt.x-n.x,oy:wpt.y-n.y,sx:px,sy:py,moved:false,pre:serialize()};
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();return;
  }
  // empty workspace: pan (plain or alt), click deselects
  drag={kind:'pan',sx:px,sy:py,vx:view.x,vy:view.y,moved:false,maybeClick:true};
  svg.setPointerCapture(e.pointerId);
  e.preventDefault();
});
svg.addEventListener('pointermove',e=>{
  if(!drag)return;
  const{px,py}=svgPoint(e);
  if(drag.kind==='pan'){
    if(Math.abs(px-drag.sx)>2||Math.abs(py-drag.sy)>2)drag.moved=true;
    view.x=drag.vx+(px-drag.sx);
    view.y=drag.vy+(py-drag.sy);
    applyView();
  }else if(drag.kind==='move'){
    if(Math.abs(px-drag.sx)>2||Math.abs(py-drag.sy)>2)drag.moved=true;
    const n=nodeById.get(drag.id);
    const wpt=toWorld(px,py);
    n.x=wpt.x-drag.ox;n.y=wpt.y-drag.oy;
    nodeEls.get(n.id).setAttribute('transform','translate('+n.x+','+n.y+')');
    updateIncidentWires(n.id);
  }else if(drag.kind==='wire'){
    const wpt=toWorld(px,py);
    const p=portPos(drag.from.node,drag.from.port);
    tempWire.setAttribute('d',tempPathD(p.x,p.y,wpt.x,wpt.y,drag.srcIsOut));
    const el=document.elementFromPoint(e.clientX,e.clientY);
    const tp=el&&el.closest?el.closest('[data-port]'):null;
    clearHover();
    if(tp){
      const chk=dropCheck(drag.from,tp);
      if(chk.ok){tp.classList.add('phov-ok');hoverPort={el:tp};}
      else if(tp!==document.querySelector('[data-port]')){tp.classList.add('phov-bad');hoverPort={el:tp};}
    }
  }
});
function endDrag(e){
  if(!drag)return;
  const d=drag;drag=null;
  if(d.kind==='pan'){
    clearHover();
    if(!d.moved&&d.maybeClick)select(null);
  }else if(d.kind==='move'){
    if(d.moved)finishEdit(d.pre);
  }else if(d.kind==='wire'){
    clearHover();clearPortHints();
    if(tempWire){tempWire.remove();tempWire=null;}
    const el=document.elementFromPoint(e.clientX,e.clientY);
    const tp=el&&el.closest?el.closest('[data-port]'):null;
    if(tp){
      const chk=dropCheck(d.from,tp);
      if(chk.ok){
        const pre=serialize();
        doc.wires.push({id:freshId('w'),
          from:{node:chk.f.node,port:chk.f.port},to:{node:chk.t.node,port:chk.t.port}});
        finishEdit(pre);
        setStatus('Connected '+chk.f.node+'.'+chk.f.port+' → '+chk.t.node+'.'+chk.t.port+'.','');
      }else setStatus(chk.reason,'');
    }
  }
}
svg.addEventListener('pointerup',endDrag);
svg.addEventListener('pointercancel',endDrag);

svg.addEventListener('dblclick',e=>{
  const ng=e.target.closest?e.target.closest('[data-node]'):null;
  if(!ng)return;
  const n=nodeById.get(ng.getAttribute('data-node'));
  if(!n||n.type!=='INPUT')return;
  const pre=serialize();
  n.value=mapBits(n.value,c=>c==='0'?'1':c==='1'?'0':c);
  finishEdit(pre);
  setStatus('Toggled "'+n.id+'" → '+n.value+'.','');
});

/* ============================== viewport ============================== */
function zoomAt(f,cx,cy){
  const ns=Math.min(4,Math.max(0.25,view.scale*f));
  if(ns===view.scale)return;
  view.x=cx-(cx-view.x)*(ns/view.scale);
  view.y=cy-(cy-view.y)*(ns/view.scale);
  view.scale=ns;
  applyView();scheduleSave();
}
svg.addEventListener('wheel',e=>{
  e.preventDefault();
  const{px,py}=svgPoint(e);
  zoomAt(Math.pow(1.0018,-e.deltaY),px,py);
},{passive:false});
function fitView(){
  if(!doc.nodes.length){
    view={x:svg.clientWidth/2,y:svg.clientHeight/2,scale:1};
    applyView();scheduleSave();return;
  }
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const n of doc.nodes){
    const g=geom(n);
    if(n.x<minX)minX=n.x;if(n.y<minY)minY=n.y;
    if(n.x+g.W>maxX)maxX=n.x+g.W;if(n.y+g.H>maxY)maxY=n.y+g.H;
  }
  const m=50,bw=maxX-minX+m*2,bh=maxY-minY+m*2;
  let s=Math.min(svg.clientWidth/bw,svg.clientHeight/bh,2);
  s=Math.min(4,Math.max(0.25,s));
  view.scale=s;
  view.x=(svg.clientWidth-(maxX-minX)*s)/2-minX*s;
  view.y=(svg.clientHeight-(maxY-minY)*s)/2-minY*s;
  applyView();scheduleSave();
}

/* ============================== persistence ============================== */
const LSKEY='flux-workbench-v1';
let saveTimer=0;
function scheduleSave(){
  clearTimeout(saveTimer);
  saveTimer=setTimeout(saveNow,300);
}
function saveNow(){
  try{localStorage.setItem(LSKEY,JSON.stringify({doc:doc,view:view}));}catch(err){}
}
function loadSaved(){
  try{
    const raw=localStorage.getItem(LSKEY);
    if(!raw)return false;
    const o=JSON.parse(raw);
    if(!o||typeof o!=='object')return false;
    const err=validateDoc(o.doc);
    if(err)return false;
    doc=normalizeDoc(o.doc);
    if(o.view&&typeof o.view==='object'&&isFinite(o.view.x)&&isFinite(o.view.y)&&isFinite(o.view.scale))
      view={x:o.view.x,y:o.view.y,scale:Math.min(4,Math.max(0.25,o.view.scale))};
    return true;
  }catch(err){return false;}
}

/* ============================== editing operations ============================== */
function addNode(type){
  const pre=serialize();
  const c=toWorld(svg.clientWidth/2,svg.clientHeight/2);
  const off=(doc.nodes.length%6)*16;
  const n={id:freshId(ID_PREFIX[type]),type:type,
    x:Math.round(c.x-48+off),y:Math.round(c.y-25+off),width:1};
  if(type==='INPUT')n.value='0';
  if(type==='CLOCK')n.period=2;
  doc.nodes.push(n);
  finishEdit(pre);
  select(n.id);
  setStatus('Added '+type+' "'+n.id+'".','');
}
function deleteSelected(){
  const n=selected?nodeById.get(selected):null;
  if(!n)return;
  const pre=serialize();
  doc.nodes=doc.nodes.filter(x=>x!==n);
  doc.wires=doc.wires.filter(w=>w.from.node!==n.id&&w.to.node!==n.id);
  selected=null;
  finishEdit(pre);
  setStatus('Deleted "'+n.id+'" and its wires.','');
}
function doImport(){
  const raw=$('json').value;
  let o;
  try{o=JSON.parse(raw);}
  catch(err){setStatus('Import failed: invalid JSON — '+err.message+'.','import');return;}
  const err=validateDoc(o);
  if(err){setStatus('Import failed: '+err,'import');return;}
  const pre=serialize();
  doc=normalizeDoc(o);
  selected=null;
  finishEdit(pre);
  setStatus('Imported '+doc.nodes.length+' nodes, '+doc.wires.length+' wires.','');
}
function doExport(){
  $('json').value=JSON.stringify(doc,null,2);
  setStatus('Exported document to JSON.','');
}
function doNew(){
  const pre=serialize();
  doc={version:1,nodes:[],wires:[]};
  selected=null;
  finishEdit(pre);
  setStatus('New empty circuit.','');
}
function demoDoc(){
  const N=(id,type,x,y,width,ex)=>Object.assign({id:id,type:type,x:x,y:y,width:width},ex||{});
  const nodes=[
    N('a','INPUT',60,90,4,{value:'0011'}),
    N('b','INPUT',60,190,4,{value:'1010'}),
    N('x','XOR',240,80,4),
    N('c','AND',240,190,4),
    N('sum','PROBE',430,80,4),
    N('carry','PROBE',430,190,4),
    N('d1','INPUT',60,320,1,{value:'1'}),
    N('clk','CLOCK',60,398,1,{period:2}),
    N('rst','INPUT',60,476,1,{value:'0'}),
    N('ff','DFF',300,340,1),
    N('q','PROBE',470,340,1),
    N('nt','NOT',240,470,1),
    N('nx','PROBE',430,470,1)
  ];
  const W=(id,fn,tn,tp)=>({id:id,from:{node:fn,port:'out'},to:{node:tn,port:tp}});
  const wires=[
    W('w1','a','x','a'),W('w2','b','x','b'),
    W('w3','a','c','a'),W('w4','b','c','b'),
    W('w5','x','sum','in'),W('w6','c','carry','in'),
    W('w7','d1','ff','d'),W('w8','clk','ff','clk'),W('w9','rst','ff','rst'),
    W('w10','ff','q','in'),
    W('w11','clk','nt','in'),W('w12','nt','nx','in')
  ];
  return{version:1,nodes:nodes,wires:wires};
}
function doDemo(){
  const pre=serialize();
  doc=demoDoc();
  selected=null;
  finishEdit(pre);
  fitView();
  setStatus('Demo circuit loaded — press Run or Step.','');
}

/* ============================== truth table ============================== */
function truthUnsupported(msg){
  setStatus('Truth table: '+msg,'truth-unsupported');
}
function generateTruth(){
  const inputs=doc.nodes.filter(n=>n.type==='INPUT').sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  const probes=doc.nodes.filter(n=>n.type==='PROBE').sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  if(!inputs.length||!probes.length)return truthUnsupported('needs at least one INPUT and one PROBE.');
  for(const n of doc.nodes)
    if(n.type==='CLOCK'||n.type==='DFF'||n.type==='RAM')
      return truthUnsupported('circuit contains '+n.type+' "'+n.id+'" (sequential elements are not supported).');
  const bits=inputs.reduce((s,n)=>s+n.width,0);
  if(bits>8)return truthUnsupported('too many input bits ('+bits+'; maximum 8).');
  if(probes.length>16)return truthUnsupported('too many probes ('+probes.length+'; maximum 16).');
  if(hasCycle(doc))return truthUnsupported('circuit contains a directed cycle.');
  const rows=1<<bits;
  const token=++truthToken;
  const table=$('truth-table');
  let html='<thead><tr><th>'+inputs.map(i=>i.id).join(', ')+'</th>';
  for(const p of probes)html+='<th>'+p.id+'</th>';
  html+='</tr></thead><tbody>';
  table.innerHTML=html+'</tbody>';
  const tbody=table.tBodies[0];
  setStatus('Generating truth table ('+rows+' rows × 64 ticks)…','');
  let r=0;
  const idxOf=net.idx;
  const inpIdx=inputs.map(n=>idxOf.get(n.id));
  const prbIdx=probes.map(n=>idxOf.get(n.id));
  function chunk(){
    if(token!==truthToken)return;
    const end=Math.min(r+12,rows);
    for(;r<end;r++){
      const bin=r.toString(2).padStart(bits,'0');
      const st=initState();
      let p=0;
      for(let k=0;k<inpIdx.length;k++){
        st.out[inpIdx[k]]=bin.slice(p,p+inputs[k].width);p+=inputs[k].width;
      }
      for(let t=0;t<64;t++)tickState(st);
      let row='<tr data-assignment="'+bin+'"><td class="bits">'+bin+'</td>';
      for(const pi of prbIdx)row+='<td data-probe="'+net.nodes[pi].id+'">'+st.out[pi]+'</td>';
      tbody.insertAdjacentHTML('beforeend',row+'</tr>');
    }
    if(r<rows)setTimeout(chunk,0);
    else setStatus('Truth table generated: '+rows+' rows.','');
  }
  if(rows<=12)chunk();else setTimeout(chunk,0);
}

/* ============================== keyboard ============================== */
document.addEventListener('keydown',e=>{
  const ae=document.activeElement;
  const typing=ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'||ae.tagName==='SELECT'||ae.isContentEditable);
  if(e.key==='Escape'){select(null);if(typing)ae.blur();return;}
  if(typing)return;
  if((e.ctrlKey||e.metaKey)&&!e.altKey&&(e.key==='z'||e.key==='Z'||e.key==='y'||e.key==='Y')){
    e.preventDefault();
    if(e.key==='y'||e.key==='Y'||e.shiftKey)redo();else undo();
    return;
  }
  if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteSelected();return;}
  if(e.key===' '){e.preventDefault();toggleRun();return;}
});

/* ============================== wiring up UI ============================== */
TYPES.forEach(t=>{
  const b=document.createElement('button');
  b.dataset.add=t;
  b.innerHTML='<b>+</b>'+t;
  b.title='Add a '+t+' component';
  b.addEventListener('click',()=>addNode(t));
  $('pgrid').appendChild(b);
});
$('new').addEventListener('click',doNew);
$('undo').addEventListener('click',undo);
$('redo').addEventListener('click',redo);
$('step').addEventListener('click',()=>{
  if(running)setRunning(false);
  let k=parseInt($('step-count').value,10);
  if(!Number.isInteger(k))k=1;
  k=Math.max(1,Math.min(4096,k));
  for(let i=0;i<k;i++)tickState(sim);
  updateTickUI(true);
  setStatus('Advanced '+k+' tick'+(k>1?'s':'')+' to tick '+sim.tick+'.','');
});
$('run').addEventListener('click',toggleRun);
$('reset-state').addEventListener('click',()=>{
  resetSim();
  setStatus('Simulation state reset to tick 0.','');
});
$('zoom-in').addEventListener('click',()=>{
  zoomAt(1.25,svg.clientWidth/2,svg.clientHeight/2);
});
$('zoom-out').addEventListener('click',()=>{
  zoomAt(1/1.25,svg.clientWidth/2,svg.clientHeight/2);
});
$('fit').addEventListener('click',fitView);
$('import').addEventListener('click',doImport);
$('export').addEventListener('click',doExport);
$('truth').addEventListener('click',generateTruth);
$('demo').addEventListener('click',doDemo);

const wIn=$('node-width'),vIn=$('node-value'),pIn=$('node-period');
wIn.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commitWidth();}});
wIn.addEventListener('change',commitWidth);
vIn.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commitValue();}});
vIn.addEventListener('change',commitValue);
pIn.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commitPeriod();}});
pIn.addEventListener('change',commitPeriod);

/* ============================== resize ============================== */
function onResize(){
  svg.setAttribute('width',Math.max(1,$('ws-wrap').clientWidth));
  svg.setAttribute('height',Math.max(1,$('ws-wrap').clientHeight));
}
new ResizeObserver(onResize).observe($('ws-wrap'));

/* ============================== inspection API ============================== */
window.__arena={
  snapshot:function(){
    const outputs={},probes={},memory={},clocks={};
    for(let i=0;i<net.N;i++){
      const n=net.nodes[i];
      if(n.type==='PROBE'){probes[n.id]=sim.out[i];continue;}
      outputs[n.id]={out:sim.out[i]};
      if(n.type==='RAM'){
        memory[n.id]=sim.mem.get(n.id).slice();
        clocks[n.id]=sim.prevClk.get(n.id);
      }else if(n.type==='DFF'){
        clocks[n.id]=sim.prevClk.get(n.id);
      }
    }
    return{
      circuit:JSON.parse(JSON.stringify(doc)),
      tick:sim.tick,
      outputs:outputs,
      probes:probes,
      memory:memory,
      clocks:clocks,
      selection:selected||null,
      view:{x:view.x,y:view.y,scale:view.scale},
      running:running
    };
  }
};

/* ============================== boot ============================== */
onResize();
if(!loadSaved())doc={version:1,nodes:[],wires:[]};
afterDocChange();
applyView();
setStatus('Ready — add components from the palette, or press Demo for a guided tour.','');
</script>
</body>
</html>
```