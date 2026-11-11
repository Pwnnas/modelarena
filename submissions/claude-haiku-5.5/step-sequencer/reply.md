```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pulse — Synthesized Drum Machine</title>
<style>
*{box-sizing:border-box}
html,body{margin:0;height:100%;overflow:hidden;user-select:none;-webkit-user-select:none}
body{
  display:flex;align-items:center;justify-content:center;
  background:radial-gradient(1300px 900px at 50% -15%,#2b3039 0%,#101216 55%,#070809 100%);
  color:#d7dce6;font-family:system-ui,"Segoe UI",Helvetica,Arial,sans-serif;
}
:focus-visible{outline:2px solid rgba(255,255,255,.55);outline-offset:2px}

.unit{
  position:relative;
  width:min(1240px,calc(100vw - 24px));
  height:min(780px,calc(100vh - 16px));
  display:flex;flex-direction:column;gap:12px;
  padding:18px 22px 12px;
  border-radius:18px;
  background:
    repeating-linear-gradient(90deg,rgba(255,255,255,.012) 0 1px,transparent 1px 3px),
    linear-gradient(180deg,#2a2e36 0%,#1c1e24 100%);
  border:1px solid #07080a;
  box-shadow:0 34px 90px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,255,255,.08),inset 0 -3px 0 rgba(0,0,0,.45);
}
.unit::before,.unit::after{
  content:"";position:absolute;top:10px;width:9px;height:9px;border-radius:50%;
  background:radial-gradient(circle at 35% 35%,#8a909c,#2a2d34 70%);
  box-shadow:inset 0 0 2px #000,0 1px 0 rgba(255,255,255,.08);
}
.unit::before{left:9px}
.unit::after{right:9px}

/* ---------- header ---------- */
.top{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:50px}
.brand h1{
  margin:0;font-size:26px;font-weight:900;letter-spacing:.38em;line-height:1;
  background:linear-gradient(180deg,#ffffff 0%,#8f98aa 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 2px 0 #050608);
}
.brand small{display:block;margin-top:5px;font-size:9px;letter-spacing:.28em;color:#6f7786}
.transport{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center}

.btn{
  height:36px;padding:0 13px;border-radius:8px;cursor:pointer;
  border:1px solid #060708;
  background:linear-gradient(180deg,#434953 0%,#2a2e36 60%,#22252c 100%);
  color:#c9d0de;font:700 11px system-ui,sans-serif;letter-spacing:.14em;
  display:inline-flex;align-items:center;gap:9px;
  box-shadow:0 3px 0 #050607,0 7px 14px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.14);
  transition:filter .1s,transform .05s,box-shadow .05s;
}
.btn:hover{filter:brightness(1.12)}
.btn:active{transform:translateY(2px);box-shadow:0 1px 0 #050607,inset 0 2px 6px rgba(0,0,0,.55)}
.btn.play{min-width:118px;justify-content:center;color:#eef2fa}
.btn.play[aria-pressed="true"]{
  background:linear-gradient(180deg,#2f5a40,#1a3626);
  box-shadow:0 3px 0 #050607,0 0 18px rgba(92,255,138,.25),inset 0 1px 0 rgba(255,255,255,.12);
}
.led{width:9px;height:9px;border-radius:50%;background:#3a1f1f;box-shadow:inset 0 1px 2px rgba(0,0,0,.6)}
.btn.play[aria-pressed="true"] .led{background:#65ff98;box-shadow:0 0 10px #65ff98,0 0 2px #fff}
.btn.preset[aria-pressed="true"]{color:#ffd27a;text-shadow:0 0 8px rgba(255,190,80,.6)}

/* ---------- controls ---------- */
.controls{
  display:flex;align-items:center;gap:26px;padding:8px 14px;border-radius:10px;
  background:#15171c;box-shadow:inset 0 2px 7px rgba(0,0,0,.65),0 1px 0 rgba(255,255,255,.05);
}
.slider{display:flex;align-items:center;gap:12px;font-size:10px;letter-spacing:.24em;color:#8b93a5;font-weight:700}
.slider input[type=range]{width:260px;accent-color:#ff8a4c;cursor:pointer}
.slider output{
  min-width:62px;text-align:center;padding:4px 8px;border-radius:5px;
  background:#07100b;border:1px solid #000;
  font:700 15px ui-monospace,Menlo,Consolas,monospace;color:#7dff9e;
  text-shadow:0 0 8px rgba(61,255,122,.7);
  box-shadow:inset 0 2px 5px rgba(0,0,0,.8);
}
.controls .spacer{flex:1}
.hint{font-size:10px;letter-spacing:.2em;color:#666e7e}

/* ---------- scope ---------- */
#scope{
  display:block;width:100%;height:84px;border-radius:10px;background:#050607;
  box-shadow:inset 0 2px 9px rgba(0,0,0,.9),0 1px 0 rgba(255,255,255,.05);
}

/* ---------- sequencer ---------- */
#sequencer{
  flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-evenly;
  padding:8px 12px;border-radius:12px;background:#14161b;
  box-shadow:inset 0 2px 9px rgba(0,0,0,.7),0 1px 0 rgba(255,255,255,.04);
}
.row{
  display:grid;grid-template-columns:148px 40px 112px repeat(16,minmax(0,1fr));
  gap:6px;align-items:center;transition:opacity .2s;
}
.row.ruler{height:14px}
.row.ruler span{font:700 9px ui-monospace,Menlo,Consolas,monospace;color:#525a6b;text-align:center;letter-spacing:.08em}
.row.muted .tname{opacity:.4}
.row.muted .step{filter:saturate(.25) brightness(.8)}
.tname{
  display:flex;align-items:center;gap:9px;font-size:11px;font-weight:800;
  letter-spacing:.14em;text-transform:uppercase;color:#b3bbcb;white-space:nowrap;overflow:hidden;
}
.tled{
  flex:0 0 auto;width:8px;height:8px;border-radius:50%;background:var(--c);
  box-shadow:0 0 6px var(--c),inset 0 0 2px rgba(0,0,0,.4);
}
.mute{
  height:28px;width:40px;padding:0;border-radius:6px;cursor:pointer;
  border:1px solid #050607;font:800 11px system-ui,sans-serif;color:#7d8597;
  background:linear-gradient(180deg,#3a3f49,#23262d);
  box-shadow:0 2px 0 #050607,inset 0 1px 0 rgba(255,255,255,.1);
  position:relative;
}
.mute:active{transform:translateY(1px)}
.mute[aria-pressed="true"]{
  color:#ffb0a0;
  background:linear-gradient(180deg,#5a2722,#3a1714);
  box-shadow:0 2px 0 #050607,0 0 10px rgba(255,80,60,.35),inset 0 1px 0 rgba(255,255,255,.08);
}
input[type=range][data-volume]{width:100%;accent-color:var(--c);cursor:pointer;margin:0;height:18px}

.step{
  position:relative;height:40px;padding:0;cursor:pointer;border-radius:7px;
  border:1px solid #040405;
  background:linear-gradient(180deg,#1b1d23 0%,#111318 100%);
  box-shadow:inset 0 3px 6px rgba(0,0,0,.75),inset 0 -1px 0 rgba(255,255,255,.04),0 1px 0 rgba(255,255,255,.04);
  transition:background .09s,box-shadow .09s,filter .09s;
}
.step:hover{border-color:#2c3038}
.step.g{margin-left:12px}
.step[aria-pressed="true"]{
  background:linear-gradient(180deg,rgba(255,255,255,.42) 0%,rgba(255,255,255,0) 55%),var(--c);
  border-color:rgba(255,255,255,.25);
  box-shadow:0 0 14px var(--c),0 0 3px var(--c),inset 0 -3px 6px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.5);
}
.step::after{ /* small dot on each beat start to show grouping */
  content:"";position:absolute;left:50%;bottom:4px;width:3px;height:3px;margin-left:-1.5px;border-radius:50%;
  background:rgba(255,255,255,.08);
}
.step.g::after{background:rgba(255,255,255,.18)}
.step.ph::before{
  content:"";position:absolute;inset:-5px -3px;border-radius:10px;pointer-events:none;
  border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.06);
  box-shadow:0 0 12px rgba(255,255,255,.12);
}
.step.hit{animation:hit .24s cubic-bezier(.2,.8,.3,1)}
.step.hit[aria-pressed="true"]{animation:hitOn .26s cubic-bezier(.2,.8,.3,1)}
@keyframes hit{0%{transform:scale(1)}30%{transform:scale(.94)}100%{transform:scale(1)}}
@keyframes hitOn{0%{transform:scale(1.13);filter:brightness(1.9)}100%{transform:scale(1);filter:brightness(1)}}

.foot{display:flex;justify-content:space-between;font-size:9.5px;letter-spacing:.22em;color:#5f6778;padding:0 6px}

@media (max-width:1100px){
  .slider input[type=range]{width:160px}
  .row{grid-template-columns:110px 34px 84px repeat(16,minmax(0,1fr))}
  .tname{font-size:9.5px;letter-spacing:.08em}
}
</style>
</head>
<body>
<div class="unit" id="unit">
  <header class="top">
    <div class="brand">
      <h1>PULSE</h1>
      <small>SYNTHESIZED DRUM MACHINE · 8 VOICES · 16 STEPS</small>
    </div>
    <div class="transport">
      <button id="play" class="btn play" aria-pressed="false" aria-label="Play or stop"><span class="led" id="runLed"></span><span id="playLabel">PLAY</span></button>
      <button id="clear" class="btn" type="button">CLEAR</button>
      <button id="random" class="btn" type="button">RANDOM</button>
      <button class="btn preset" type="button" data-preset="Basic" aria-pressed="false">BASIC</button>
      <button class="btn preset" type="button" data-preset="Boom Bap" aria-pressed="false">BOOM BAP</button>
      <button class="btn preset" type="button" data-preset="Four on the Floor" aria-pressed="false">4 ON FLOOR</button>
    </div>
  </header>

  <section class="controls">
    <label class="slider">TEMPO
      <input id="tempo" type="range" min="40" max="240" step="1" value="120">
      <output id="bpmOut">120</output>
    </label>
    <label class="slider">SWING
      <input id="swing" type="range" min="0" max="100" step="1" value="0">
      <output id="swingOut">0</output>
    </label>
    <div class="spacer"></div>
    <span class="hint">CLICK STEPS TO PROGRAM</span>
  </section>

  <canvas id="scope" aria-label="Output visualizer"></canvas>

  <section id="sequencer" data-playhead="-1" aria-label="Step sequencer"></section>

  <footer class="foot"><span>SPACE — PLAY / STOP</span><span>GROUPS OF FOUR · SWING DELAYS ODD STEPS</span><span>PULSE MK1</span></footer>
</div>

<script>
(() => {
'use strict';

/* ================= constants & state ================= */
const KEY = 'pulse-drum-v1';
const NT = 8, NS = 16;
const TRACKS = [
  {name:'Kick',c:'#ff5a3c'},{name:'Snare',c:'#ffb13b'},{name:'Closed Hat',c:'#ffe45c'},
  {name:'Open Hat',c:'#b7f25a'},{name:'Clap',c:'#3ef0c4'},{name:'Low Tom',c:'#3fb6ff'},
  {name:'High Tom',c:'#8f7bff'},{name:'Cowbell',c:'#ff58b5'}
];
const PRESETS = {
  'Basic':            [[0,3,8,11],[4,12],[0,2,4,6,8,10,12,14],[14],[],[15],[],[6,10]],
  'Boom Bap':         [[0,7,10],[4,12],[2,6,10,14],[7],[],[14],[],[]],
  'Four on the Floor':[[0,4,8,12],[],[2,6,10,14],[6,14],[4,12],[],[],[3,11]]
};
const clamp = (v,a,b) => Math.min(b, Math.max(a, v));
function patFrom(idx){
  return Array.from({length:NT},(_,k)=>Array.from({length:NS},(_,s)=>idx[k].includes(s)));
}
let st = {
  bpm: 120,
  swing: 0,
  pat: patFrom(PRESETS['Basic']),
  mute: Array(NT).fill(false),
  vol: Array(NT).fill(0.8)
};

function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return;
    const o = JSON.parse(raw);
    if(o && typeof o.bpm === 'number') st.bpm = clamp(Math.round(o.bpm),40,240);
    if(o && typeof o.swing === 'number') st.swing = clamp(Math.round(o.swing),0,100);
    if(o && Array.isArray(o.pat) && o.pat.length === NT){
      st.pat = o.pat.map(row => Array.from({length:NS},(_,s)=>!!(Array.isArray(row) && row[s])));
    }
    if(o && Array.isArray(o.mute)) st.mute = Array.from({length:NT},(_,k)=>!!o.mute[k]);
    if(o && Array.isArray(o.vol)) st.vol = Array.from({length:NT},(_,k)=>
      typeof o.vol[k]==='number' ? clamp(o.vol[k],0,1) : 0.8);
  }catch(e){ /* corrupt storage: fall back to defaults */ }
}
function save(){
  try{ localStorage.setItem(KEY, JSON.stringify(st)); }catch(e){}
}

/* ================= audio engine ================= */
let ctx = null, master = null, comp = null, analyser = null, noiseBuf = null;
const live = new Set();

function initAudio(){
  if(!ctx){
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC({latencyHint:'interactive'});
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -8; comp.knee.value = 6; comp.ratio.value = 3;
    comp.attack.value = 0.002; comp.release.value = 0.15;
    master = ctx.createGain(); master.gain.value = 0.85;
    analyser = ctx.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.55;
    master.connect(comp); comp.connect(analyser); analyser.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
  }
  if(ctx.state === 'suspended') ctx.resume().catch(()=>{});
}

// register a source: start on the audio clock, stop at end
function reg(src, t, dur, offset){
  if(offset) src.start(t, offset); else src.start(t);
  src.stop(t + dur);
  live.add(src);
  src.onended = () => live.delete(src);
}
function ramp(g, t, peak, dec){
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
}
function tone(type, f0, f1, t, dec, peak){
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dec * 0.6);
  ramp(g, t, peak, dec);
  o.connect(g); g.connect(master);
  reg(o, t, dec + 0.03);
}
function noise(t, dur, type, f, q, peak, dec){
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const flt = ctx.createBiquadFilter(); flt.type = type; flt.frequency.value = f; flt.Q.value = q;
  const g = ctx.createGain(); ramp(g, t, peak, dec);
  s.connect(flt); flt.connect(g); g.connect(master);
  reg(s, t, dur, Math.random() * 0.8);
}
const HAT_PARTIALS = [3010, 4120, 5243, 6418, 7236, 8512];
function metal(t, v, dec){
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 4200; hp.Q.value = 0.6;
  const g = ctx.createGain(); ramp(g, t, v * 0.085, dec);
  hp.connect(g); g.connect(master);
  for(const f of HAT_PARTIALS){
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f;
    o.connect(hp);
    reg(o, t, dec + 0.03);
  }
  noise(t, dec + 0.03, 'highpass', 8000, 0.5, v * 0.22, dec * 0.9);
}

// Voice functions: index matches TRACKS
const VOICES = [
  // 0 KICK: sine pitch-drop body + beater click
  (t, v) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(165, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.13);
    ramp(g, t, v, 0.5);
    o.connect(g); g.connect(master);
    reg(o, t, 0.52);
    const c = ctx.createOscillator(), cg = ctx.createGain();
    c.type = 'triangle';
    c.frequency.setValueAtTime(1200, t);
    c.frequency.exponentialRampToValueAtTime(200, t + 0.02);
    ramp(cg, t, v * 0.35, 0.025);
    c.connect(cg); cg.connect(master);
    reg(c, t, 0.03);
  },
  // 1 SNARE: triangle body + bandpassed noise snap
  (t, v) => {
    tone('triangle', 190, 150, t, 0.1, v * 0.55);
    noise(t, 0.22, 'bandpass', 2200, 0.8, v * 0.9, 0.18);
    noise(t, 0.06, 'highpass', 6000, 0.5, v * 0.18, 0.03);
  },
  // 2 CLOSED HAT
  (t, v) => { metal(t, v, 0.05); },
  // 3 OPEN HAT
  (t, v) => { metal(t, v, 0.34); },
  // 4 CLAP: three micro-bursts then a tail
  (t, v) => {
    for(const off of [0, 0.011, 0.023]) noise(t + off, 0.035, 'bandpass', 1400, 0.9, v * 0.9, 0.02);
    noise(t + 0.034, 0.32, 'bandpass', 1300, 0.7, v * 0.6, 0.23);
  },
  // 5 LOW TOM
  (t, v) => { tone('sine', 140, 65, t, 0.45, v * 0.9); },
  // 6 HIGH TOM
  (t, v) => { tone('sine', 230, 120, t, 0.3, v * 0.85); },
  // 7 COWBELL: two square tones through a bandpass
  (t, v) => {
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.9;
    const g = ctx.createGain(); ramp(g, t, v * 0.35, 0.3);
    bp.connect(g); g.connect(master);
    for(const f of [562, 845]){
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f;
      o.connect(bp);
      reg(o, t, 0.32);
    }
  }
];

/* ================= scheduler ================= */
const LOOK = 0.2;      // seconds of audio scheduled ahead
const TICK = 25;       // ms between scheduler wakeups (never determines note times)
let playing = false, curStep = 0, nextTime = 0, timerId = 0;
const visQ = [];       // {t, s} visual events on the audio clock

function stepDur(){ return 60 / st.bpm / 4; }

function schedule(){
  if(!playing || !ctx) return;
  const horizon = ctx.currentTime + LOOK;
  while(nextTime < horizon){
    const s = curStep;
    const swingOffset = (s & 1) ? (st.swing / 100) * (1/3) * stepDur() : 0;
    const t = nextTime + swingOffset;
    for(let k = 0; k < NT; k++){
      if(st.pat[k][s] && !st.mute[k]){
        VOICES[k](t, Math.max(0.0001, st.vol[k]));
      }
    }
    visQ.push({t, s});
    nextTime += stepDur();
    curStep = (curStep + 1) % NS;
  }
  if(visQ.length > 256) visQ.splice(0, 128);
}

function start(){
  initAudio();
  if(playing) return;
  playing = true;
  curStep = 0;
  nextTime = ctx.currentTime + 0.08;
  visQ.length = 0;
  schedule();
  timerId = setInterval(schedule, TICK);
  updateTransport();
}
function stop(){
  playing = false;
  clearInterval(timerId); timerId = 0;
  visQ.length = 0;
  [...live].forEach(src => { try{ src.stop(); }catch(e){} });
  live.clear();
  setPh(-1);
  updateTransport();
}
function togglePlay(){ if(playing) stop(); else start(); }

/* ================= UI construction ================= */
const seq = document.getElementById('sequencer');
const cells = [];        // cells[k][s]
const muteBtns = [];
const volEls = [];
const rows = [];

// ruler
{
  const r = document.createElement('div');
  r.className = 'row ruler';
  r.innerHTML = '<span></span><span></span><span></span>';
  for(let s=0;s<NS;s++){
    const sp = document.createElement('span');
    sp.textContent = String(s+1);
    if(s%4===0 && s>0) sp.classList.add('g');
    if(s%4===0 && s>0) sp.style.marginLeft = '12px';
    r.appendChild(sp);
  }
  seq.appendChild(r);
}

TRACKS.forEach((tr, k) => {
  const row = document.createElement('div');
  row.className = 'row';
  row.style.setProperty('--c', tr.c);
  row.dataset.row = String(k);

  const name = document.createElement('div');
  name.className = 'tname';
  name.innerHTML = '<i class="tled"></i><span></span>';
  name.querySelector('span').textContent = tr.name;
  row.appendChild(name);

  const mb = document.createElement('button');
  mb.type = 'button';
  mb.className = 'mute';
  mb.dataset.mute = String(k);
  mb.setAttribute('aria-pressed','false');
  mb.setAttribute('aria-label', 'Mute ' + tr.name);
  mb.textContent = 'M';
  row.appendChild(mb);
  muteBtns[k] = mb;

  const vol = document.createElement('input');
  vol.type = 'range'; vol.min = '0'; vol.max = '1'; vol.step = '0.01';
  vol.dataset.volume = String(k);
  vol.setAttribute('aria-label', 'Volume ' + tr.name);
  vol.value = String(st.vol[k]);
  row.appendChild(vol);
  volEls[k] = vol;

  cells[k] = [];
  for(let s=0;s<NS;s++){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'step' + (s%4===0 && s>0 ? ' g' : '');
    b.dataset.track = String(k);
    b.dataset.step = String(s);
    b.setAttribute('aria-pressed','false');
    b.setAttribute('aria-label', `${tr.name} step ${s+1}`);
    row.appendChild(b);
    cells[k][s] = b;
  }
  seq.appendChild(row);
  rows[k] = row;
});

const playBtn = document.getElementById('play');
const playLabel = document.getElementById('playLabel');
const tempoEl = document.getElementById('tempo');
const swingEl = document.getElementById('swing');
const bpmOut = document.getElementById('bpmOut');
const swingOut = document.getElementById('swingOut');

function paintStep(k, s){
  cells[k][s].setAttribute('aria-pressed', st.pat[k][s] ? 'true' : 'false');
}
function paintMute(k){
  muteBtns[k].setAttribute('aria-pressed', st.mute[k] ? 'true' : 'false');
  rows[k].classList.toggle('muted', st.mute[k]);
}
function paintAll(){
  for(let k=0;k<NT;k++){
    paintMute(k);
    volEls[k].value = String(st.vol[k]);
    for(let s=0;s<NS;s++) paintStep(k,s);
  }
  tempoEl.value = String(st.bpm);
  swingEl.value = String(st.swing);
  bpmOut.textContent = String(st.bpm);
  swingOut.textContent = String(st.swing);
}
function updateTransport(){
  playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
  playLabel.textContent = playing ? 'STOP' : 'PLAY';
}

let phCol = -1;
function setPh(s){
  if(s === phCol) return;
  if(phCol >= 0) for(let k=0;k<NT;k++) cells[k][phCol].classList.remove('ph');
  phCol = s;
  if(s >= 0) for(let k=0;k<NT;k++) cells[k][s].classList.add('ph');
  seq.dataset.playhead = String(s);
}
function flashStep(s){
  for(let k=0;k<NT;k++){
    if(st.pat[k][s] && !st.mute[k]){
      const c = cells[k][s];
      c.classList.remove('hit');
      void c.offsetWidth;
      c.classList.add('hit');
    }
  }
}

/* ================= interaction ================= */
seq.addEventListener('click', e => {
  const b = e.target.closest('button');
  if(!b || !seq.contains(b)) return;
  if(b.dataset.track !== undefined){
    const k = +b.dataset.track, s = +b.dataset.step;
    st.pat[k][s] = !st.pat[k][s];
    paintStep(k,s);
    save();
  } else if(b.dataset.mute !== undefined){
    const k = +b.dataset.mute;
    st.mute[k] = !st.mute[k];
    paintMute(k);
    save();
  }
});
seq.addEventListener('input', e => {
  const el = e.target;
  if(el.dataset && el.dataset.volume !== undefined){
    const k = +el.dataset.volume;
    st.vol[k] = clamp(+el.value, 0, 1);
    save();
  }
});

tempoEl.addEventListener('input', () => {
  st.bpm = clamp(Math.round(+tempoEl.value), 40, 240);
  bpmOut.textContent = String(st.bpm);
  save();
});
tempoEl.addEventListener('change', () => {
  st.bpm = clamp(Math.round(+tempoEl.value), 40, 240);
  bpmOut.textContent = String(st.bpm);
  save();
});
swingEl.addEventListener('input', () => {
  st.swing = clamp(Math.round(+swingEl.value), 0, 100);
  swingOut.textContent = String(st.swing);
  save();
});
swingEl.addEventListener('change', () => {
  st.swing = clamp(Math.round(+swingEl.value), 0, 100);
  swingOut.textContent = String(st.swing);
  save();
});

playBtn.addEventListener('click', togglePlay);

document.getElementById('clear').addEventListener('click', () => {
  for(let k=0;k<NT;k++) for(let s=0;s<NS;s++) st.pat[k][s] = false;
  paintAll(); save();
});

document.getElementById('random').addEventListener('click', () => {
  const probs = [0.5, 0.22, 0.5, 0.12, 0.18, 0.08, 0.08, 0.14];
  st.pat = probs.map((p,k) => Array.from({length:NS}, (_,s) => {
    const bias = (s % 4 === 0) ? 1.35 : (s % 2 === 0 ? 1 : 0.5);
    return Math.random() < Math.min(0.9, p * bias);
  }));
  st.pat[0][0] = true;
  paintAll(); save();
});

document.querySelectorAll('[data-preset]').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.preset;
    st.pat = patFrom(PRESETS[name]);
    paintAll(); save();
  });
});

// first user gesture creates / resumes the single AudioContext
document.addEventListener('pointerdown', () => initAudio(), {capture:true});
document.addEventListener('keydown', () => initAudio(), {capture:true});

function isTextEntry(el){
  if(!el) return false;
  if(el.isContentEditable) return true;
  if(el.tagName === 'TEXTAREA') return true;
  return el.tagName === 'INPUT' && /^(text|number|search|email|url|tel|password)$/.test(el.type);
}
document.addEventListener('keydown', e => {
  if(e.code === 'Space' || e.key === ' '){
    if(isTextEntry(e.target)) return;
    e.preventDefault();          // stop focused buttons from also firing click
    if(!e.repeat) togglePlay();
  }
});
document.addEventListener('keyup', e => {
  if((e.code === 'Space' || e.key === ' ') && !isTextEntry(e.target)) e.preventDefault();
});

/* ================= visualizer & animation loop ================= */
const cv = document.getElementById('scope');
const cx = cv.getContext('2d');
const tbuf = new Uint8Array(2048);
function resizeCanvas(){
  const dpr = window.devicePixelRatio || 1;
  const r = cv.getBoundingClientRect();
  cv.width = Math.max(1, Math.round(r.width * dpr));
  cv.height = Math.max(1, Math.round(r.height * dpr));
}
function drawScope(){
  const W = cv.width, H = cv.height;
  if(W < 2 || H < 2) return;
  const dpr = window.devicePixelRatio || 1;
  cx.clearRect(0,0,W,H);
  cx.fillStyle = '#050607';
  cx.fillRect(0,0,W,H);
  // graticule
  cx.strokeStyle = 'rgba(120,255,180,0.06)';
  cx.lineWidth = 1;
  cx.beginPath();
  for(let i=1;i<8;i++){ const x = Math.round(W*i/8)+0.5; cx.moveTo(x,0); cx.lineTo(x,H); }
  for(let i=1;i<4;i++){ const y = Math.round(H*i/4)+0.5; cx.moveTo(0,y); cx.lineTo(W,y); }
  cx.stroke();

  if(analyser){
    analyser.getByteTimeDomainData(tbuf);
  } else {
    tbuf.fill(128);
  }
  const grad = cx.createLinearGradient(0,0,W,0);
  grad.addColorStop(0,'#ff5a3c');
  grad.addColorStop(0.5,'#ffe45c');
  grad.addColorStop(1,'#3ef0c4');
  cx.strokeStyle = grad;
  cx.lineWidth = 2 * dpr;
  cx.shadowBlur = 10 * dpr;
  cx.shadowColor = 'rgba(255,200,120,0.7)';
  cx.beginPath();
  const n = tbuf.length;
  for(let i=0;i<n;i++){
    const x = i / (n-1) * W;
    const v = (tbuf[i] - 128) / 128;
    const y = H * 0.5 + v * H * 0.44;
    if(i === 0) cx.moveTo(x,y); else cx.lineTo(x,y);
  }
  cx.stroke();
  cx.shadowBlur = 0;
}

function frame(){
  requestAnimationFrame(frame);
  if(ctx && visQ.length){
    const now = ctx.currentTime;
    let last = null;
    while(visQ.length && visQ[0].t <= now) last = visQ.shift();
    if(last){
      setPh(last.s);
      flashStep(last.s);
    }
  }
  if(!playing && phCol !== -1) setPh(-1);
  drawScope();
}

/* ================= boot ================= */
load();
paintAll();
updateTransport();
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
setPh(-1);
requestAnimationFrame(frame);
})();
</script>
</body>
</html>
```