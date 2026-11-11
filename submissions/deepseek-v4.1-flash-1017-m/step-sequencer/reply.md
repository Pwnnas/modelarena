Here is the complete HTML document for Pulse, a synthesized 8-track drum machine with a 16-step sequencer, built as a single self-contained file with inline CSS and JavaScript.
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PULSE — Synthesized Drum Machine</title>
<style>
  :root{
    --accent:#4ee1c1;
    --line:#20242c;
    --panel-a:#14171d;
    --panel-b:#0c0e12;
  }
  *{ box-sizing:border-box; }
  html,body{ height:100%; margin:0; }
  body{
    background:
      radial-gradient(1100px 520px at 50% -10%, #1e242e 0%, rgba(10,12,15,0) 62%),
      radial-gradient(900px 520px at 50% 114%, #161c24 0%, rgba(10,12,15,0) 60%),
      #07090b;
    color:#e8ecf3;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing:antialiased;
    overflow:hidden;
    user-select:none;
  }

  .app{
    height:100vh;
    max-width:1520px;
    margin:0 auto;
    padding:14px 20px 16px;
    display:flex;
    flex-direction:column;
    gap:12px;
  }

  /* ---------------- top bar ---------------- */
  .topbar{
    display:grid;
    grid-template-columns:auto 1fr auto;
    align-items:center;
    gap:20px;
    flex:0 0 auto;
  }
  .brand{ display:flex; flex-direction:column; gap:2px; }
  .logo{
    font-size:22px;
    font-weight:800;
    letter-spacing:.34em;
    background:linear-gradient(180deg,#ffffff,#8ea0b8);
    -webkit-background-clip:text;
    background-clip:text;
    color:transparent;
    line-height:1;
  }
  .tagline{
    font-size:9px;
    letter-spacing:.28em;
    color:#68717f;
    font-weight:600;
  }

  .panel{
    background:linear-gradient(180deg,var(--panel-a),var(--panel-b));
    border:1px solid var(--line);
    border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.045) inset, 0 14px 34px rgba(0,0,0,.55);
  }

  .transport{
    display:flex;
    align-items:center;
    gap:20px;
    padding:8px 18px 8px 10px;
    justify-self:center;
  }

  .play{
    width:52px;height:52px;
    border-radius:14px;
    border:1px solid #2c3340;
    background:linear-gradient(180deg,#1f2530,#111519);
    color:#5ce9c6;
    display:grid;place-items:center;
    cursor:pointer;padding:0;
    transition:transform .1s ease, box-shadow .18s ease, background .18s ease, color .18s ease, border-color .18s ease;
    box-shadow:0 1px 0 rgba(255,255,255,.06) inset, 0 4px 10px rgba(0,0,0,.5);
  }
  .play svg{ width:22px;height:22px; fill:currentColor; display:block; }
  .play:hover{ border-color:#3d4756; color:#87f6d9; }
  .play:active{ transform:translateY(1px) scale(.985); }
  .play .ic-stop{ display:none; }
  .play.active .ic-play{ display:none; }
  .play.active .ic-stop{ display:block; }
  .play.active{
    color:#04241d;
    background:linear-gradient(180deg,#66f2d0,#2ed3ab);
    border-color:#9dfbe2;
    box-shadow:0 0 0 1px rgba(78,225,193,.45), 0 0 26px rgba(46,211,171,.5), 0 1px 0 rgba(255,255,255,.5) inset;
  }

  .ctrl{ display:flex; flex-direction:column; gap:6px; }
  .ctrl > label{
    font-size:9px; letter-spacing:.2em; font-weight:700; color:#79828f;
  }
  .ctrl-row{ display:flex; align-items:center; gap:10px; }
  .ctrl output{
    font-size:13px; font-weight:700; min-width:38px; text-align:right;
    font-variant-numeric:tabular-nums; color:#cfe6e0;
  }
  #tempo{ width:150px; }
  #swing{ width:120px; }

  .actions{ display:flex; gap:8px; }
  .ghost{
    font-family:inherit;
    font-size:10px; font-weight:700; letter-spacing:.16em;
    color:#9aa4b2;
    background:linear-gradient(180deg,#1a1e26,#101419);
    border:1px solid #262b34;
    border-radius:10px;
    padding:10px 13px;
    cursor:pointer;
    transition:all .15s ease;
    box-shadow:0 1px 0 rgba(255,255,255,.05) inset, 0 3px 8px rgba(0,0,0,.4);
  }
  .ghost:hover{ color:#e6f6f2; border-color:#39414d; }
  .ghost:active{ transform:translateY(1px) scale(.985); }

  /* ---------------- sliders ---------------- */
  input[type=range]{
    -webkit-appearance:none; appearance:none;
    height:20px; background:transparent; cursor:pointer; margin:0;
  }
  input[type=range]::-webkit-slider-runnable-track{
    height:6px; border-radius:3px;
    background:linear-gradient(90deg,
      var(--c,var(--accent)) 0%,
      var(--c,var(--accent)) var(--p,50%),
      #23272f var(--p,50%),
      #23272f 100%);
    box-shadow:inset 0 1px 2px rgba(0,0,0,.85);
  }
  input[type=range]::-webkit-slider-thumb{
    -webkit-appearance:none; appearance:none;
    width:15px; height:15px; border-radius:50%;
    margin-top:-4.5px;
    background:linear-gradient(180deg,#f2f6fb,#9aa4b2);
    box-shadow:0 1px 3px rgba(0,0,0,.75), 0 0 0 1px rgba(0,0,0,.5);
    transition:transform .12s ease;
  }
  input[type=range]:hover::-webkit-slider-thumb{ transform:scale(1.13); }
  input[type=range]:active::-webkit-slider-thumb{ transform:scale(1.22); }
  input[type=range]:focus-visible{ outline:none; }
  input[type=range]:focus-visible::-webkit-slider-thumb{
    box-shadow:0 0 0 2px rgba(78,225,193,.8), 0 1px 3px rgba(0,0,0,.75);
  }

  /* ---------------- sequencer ---------------- */
  #sequencer{
    flex:1 1 auto;
    min-height:0;
    display:flex;
    flex-direction:column;
    gap:6px;
    padding:12px 16px;
    background:linear-gradient(180deg,#101318,#0a0c10);
    border:1px solid var(--line);
    border-radius:18px;
    box-shadow:0 1px 0 rgba(255,255,255,.04) inset, 0 24px 60px rgba(0,0,0,.6);
    overflow:auto;
  }

  .track-row{
    flex:1 1 0;
    min-height:40px;
    display:grid;
    grid-template-columns:236px 1fr;
    gap:16px;
    align-items:center;
    padding:2px 6px;
    border-radius:10px;
    transition:opacity .18s ease;
  }
  .track-row.muted{ opacity:.38; }

  .track-info{ display:flex; align-items:center; gap:9px; min-width:0; }
  .mute{
    flex:0 0 auto;
    width:24px; height:24px;
    border-radius:7px;
    border:1px solid #2a303a;
    background:linear-gradient(180deg,#1c2129,#12161b);
    color:#6f7a88;
    font-size:10px; font-weight:800;
    font-family:inherit;
    cursor:pointer;
    padding:0;
    display:grid; place-items:center;
    transition:all .14s ease;
    box-shadow:0 1px 0 rgba(255,255,255,.05) inset;
  }
  .mute:hover{ color:#c9d2dd; border-color:#3a424e; }
  .mute.on{
    color:#1a0d0d;
    background:linear-gradient(180deg,#ff8a80,#e2483c);
    border-color:#ff9d92;
    box-shadow:0 0 12px rgba(226,72,60,.55), 0 1px 0 rgba(255,255,255,.4) inset;
  }
  .track-name{
    width:76px;
    flex:0 0 auto;
    font-size:11px;
    font-weight:700;
    letter-spacing:.07em;
    text-transform:uppercase;
    color:#aab3c1;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .vol{
    flex:1 1 auto;
    min-width:50px;
    max-width:120px;
  }

  .steps{
    display:flex;
    gap:14px;
    height:100%;
    max-height:58px;
    min-height:30px;
    align-items:stretch;
  }
  .beat{
    flex:1 1 0;
    min-width:0;
    display:flex;
    gap:5px;
  }

  .step{
    flex:1 1 0;
    min-width:0;
    padding:0;
    border-radius:8px;
    border:1px solid #262b34;
    background-image:linear-gradient(180deg,#1d222a,#13171c);
    box-shadow:0 1px 0 rgba(255,255,255,.05) inset, 0 2px 5px rgba(0,0,0,.5);
    cursor:pointer;
    position:relative;
    transition:background .12s ease, box-shadow .15s ease, border-color .12s ease;
    will-change:transform;
  }
  .step:hover{ border-color:#3b434f; }
  .step:active{ transform:translateY(1px) scale(.97); }
  .step:focus-visible{ outline:1px solid rgba(78,225,193,.7); outline-offset:1px; }

  .step[aria-pressed="true"]{
    background-color:var(--c,#4ee1c1);
    background-image:linear-gradient(180deg, rgba(255,255,255,.34), rgba(255,255,255,0) 52%, rgba(0,0,0,.24));
    border-color:rgba(255,255,255,.28);
    box-shadow:
      0 0 14px -2px var(--c,#4ee1c1),
      0 1px 0 rgba(255,255,255,.45) inset,
      0 2px 6px rgba(0,0,0,.45);
  }
  .step.now{ border-color:rgba(255,255,255,.42); }
  .step.now:not([aria-pressed="true"]){
    background-image:linear-gradient(180deg,#262d38,#1a1f27);
    box-shadow:0 1px 0 rgba(255,255,255,.08) inset, 0 2px 5px rgba(0,0,0,.5);
  }

  /* ---------------- visualizer ---------------- */
  .viz-wrap{
    flex:0 0 auto;
    height:104px;
    padding:0;
    overflow:hidden;
    position:relative;
  }
  .viz-wrap::after{
    content:"";
    position:absolute; inset:0;
    border-radius:14px;
    pointer-events:none;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.05);
  }
  #viz{ display:block; width:100%; height:100%; }

  @media (max-width:1100px){
    .track-row{ grid-template-columns:190px 1fr; }
    .track-name{ width:62px; font-size:10px; }
    #tempo{ width:110px; }
    #swing{ width:90px; }
  }
  @media (max-height:700px){
    .viz-wrap{ height:76px; }
    .topbar{ gap:12px; }
  }
</style>
</head>
<body>
<div class="app">
  <header class="topbar">
    <div class="brand">
      <div class="logo">PULSE</div>
      <div class="tagline">SYNTH DRUM MACHINE</div>
    </div>

    <div class="transport panel">
      <button id="play" class="play" aria-pressed="false" aria-label="Play">
        <svg class="ic ic-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2 19 12 8 18.8z"/></svg>
        <svg class="ic ic-stop" viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2.2"/></svg>
      </button>
      <div class="ctrl">
        <label for="tempo">TEMPO</label>
        <div class="ctrl-row">
          <input id="tempo" type="range" min="40" max="240" step="1" value="120" aria-label="Tempo in BPM">
          <output id="tempoVal">120</output>
        </div>
      </div>
      <div class="ctrl">
        <label for="swing">SWING</label>
        <div class="ctrl-row">
          <input id="swing" type="range" min="0" max="100" step="1" value="0" aria-label="Swing amount">
          <output id="swingVal">0</output>
        </div>
      </div>
    </div>

    <div class="actions">
      <button id="preset" class="ghost" type="button">PRESET</button>
      <button id="randomize" class="ghost" type="button">RANDOM</button>
      <button id="clear" class="ghost" type="button">CLEAR</button>
    </div>
  </header>

  <main id="sequencer" data-playhead="-1" aria-label="Step sequencer"></main>

  <footer class="viz-wrap panel">
    <canvas id="viz"></canvas>
  </footer>
</div>

<script>
(function () {
  'use strict';

  /* =========================================================
     Constants & state
     ========================================================= */
  var N_TRACKS = 8;
  var N_STEPS = 16;
  var LS_KEY = 'pulse.drum.v1';

  var TRACKS = [
    { name: 'Kick',       color: '#ff5f6d' },
    { name: 'Snare',      color: '#ff9f45' },
    { name: 'Closed Hat', color: '#ffd93d' },
    { name: 'Open Hat',   color: '#b6e64a' },
    { name: 'Clap',       color: '#3ddc97' },
    { name: 'Low Tom',    color: '#38bdf8' },
    { name: 'High Tom',   color: '#8b8cf7' },
    { name: 'Cowbell',    color: '#f472b6' }
  ];

  var PRESET_HOUSE = [
    [0, 4, 8, 12],
    [4, 12],
    [0, 2, 4, 6, 8, 10, 12, 14],
    [7, 15],
    [4, 12],
    [11],
    [13],
    []
  ];
  var PRESET_BOOMBAP = [
    [0, 3, 6, 10],
    [4, 12],
    [0, 2, 4, 6, 8, 10, 12, 14],
    [],
    [4, 12],
    [14],
    [11],
    [7]
  ];
  var PRESET_BREAKS = [
    [0, 6, 10, 14],
    [4, 12],
    [0, 2, 3, 4, 6, 8, 10, 11, 12, 14],
    [7],
    [4, 12],
    [15],
    [13],
    [3, 11]
  ];
  var PRESETS = [PRESET_HOUSE, PRESET_BOOMBAP, PRESET_BREAKS];

  function patternFromList(list) {
    var out = [];
    for (var t = 0; t < N_TRACKS; t++) {
      var row = new Array(N_STEPS).fill(false);
      var src = list[t] || [];
      for (var i = 0; i < src.length; i++) {
        var s = src[i];
        if (s >= 0 && s < N_STEPS) row[s] = true;
      }
      out.push(row);
    }
    return out;
  }

  function defaultState() {
    return {
      pattern: patternFromList(PRESETS[0]),
      tempo: 120,
      swing: 0,
      mutes: new Array(N_TRACKS).fill(false),
      volumes: [85, 80, 72, 68, 66, 78, 74, 70]
    };
  }

  function loadState() {
    var st = defaultState();
    var raw = null;
    try { raw = localStorage.getItem(LS_KEY); } catch (e) { raw = null; }
    if (!raw) return st;
    try {
      var s = JSON.parse(raw);
      if (!s || typeof s !== 'object') return st;
      if (Array.isArray(s.pattern) && s.pattern.length === N_TRACKS &&
          s.pattern.every(function (r) { return Array.isArray(r) && r.length === N_STEPS; })) {
        st.pattern = s.pattern.map(function (r) {
          return r.map(function (v) { return !!v; });
        });
      }
      if (typeof s.tempo === 'number' && isFinite(s.tempo)) {
        st.tempo = Math.min(240, Math.max(40, Math.round(s.tempo)));
      }
      if (typeof s.swing === 'number' && isFinite(s.swing)) {
        st.swing = Math.min(100, Math.max(0, Math.round(s.swing)));
      }
      if (Array.isArray(s.mutes) && s.mutes.length === N_TRACKS) {
        st.mutes = s.mutes.map(function (v) { return !!v; });
      }
      if (Array.isArray(s.volumes) && s.volumes.length === N_TRACKS) {
        st.volumes = s.volumes.map(function (v) {
          var n = Number(v);
          return isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 80;
        });
      }
    } catch (e) { /* ignore corrupt state */ }
    return st;
  }

  var state = loadState();

  /* =========================================================
     DOM references
     ========================================================= */
  var seqEl = document.getElementById('sequencer');
  var playBtn = document.getElementById('play');
  var tempoEl = document.getElementById('tempo');
  var tempoOut = document.getElementById('tempoVal');
  var swingEl = document.getElementById('swing');
  var swingOut = document.getElementById('swingVal');
  var presetBtn = document.getElementById('preset');
  var randomBtn = document.getElementById('randomize');
  var clearBtn = document.getElementById('clear');

  /* =========================================================
     Build the sequencer grid
     ========================================================= */
  (function buildGrid() {
    var html = '';
    for (var t = 0; t < N_TRACKS; t++) {
      var tr = TRACKS[t];
      html += '<div class="track-row" style="--c:' + tr.color + '">';
      html += '<div class="track-info">';
      html += '<button class="mute" type="button" data-mute="' + t + '" aria-pressed="false" title="Mute ' +
              tr.name + '" aria-label="Mute ' + tr.name + '">M</button>';
      html += '<span class="track-name">' + tr.name + '</span>';
      html += '<input class="vol" type="range" min="0" max="100" step="1" data-volume="' + t +
              '" value="80" aria-label="' + tr.name + ' volume">';
      html += '</div><div class="steps">';
      for (var b = 0; b < 4; b++) {
        html += '<div class="beat">';
        for (var k = 0; k < 4; k++) {
          var s = b * 4 + k;
          html += '<button class="step" type="button" data-track="' + t + '" data-step="' + s +
                  '" aria-pressed="false" aria-label="' + tr.name + ' step ' + (s + 1) + '"></button>';
        }
        html += '</div>';
      }
      html += '</div></div>';
    }
    seqEl.innerHTML = html;
  })();

  var allSteps = Array.prototype.slice.call(seqEl.querySelectorAll('.step'));
  var muteBtns = Array.prototype.slice.call(seqEl.querySelectorAll('[data-mute]'));
  var volInputs = Array.prototype.slice.call(seqEl.querySelectorAll('[data-volume]'));

  /* =========================================================
     Slider fill helper
     ========================================================= */
  function updateFill(el) {
    var min = parseFloat(el.min) || 0;
    var max = parseFloat(el.max) || 100;
    var val = parseFloat(el.value);
    if (!isFinite(val)) val = min;
    var pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
    el.style.setProperty('--p', pct.toFixed(2) + '%');
  }

  /* =========================================================
     Persistence
     ========================================================= */
  function saveState() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        pattern: state.pattern,
        tempo: state.tempo,
        swing: state.swing,
        mutes: state.mutes,
        volumes: state.volumes
      }));
    } catch (e) { /* storage may be unavailable */ }
  }

  /* =========================================================
     Audio engine
     ========================================================= */
  var ctx = null;
  var master = null;
  var analyser = null;
  var noiseBuf = null;
  var trackGain = [];

  function volGain(v) {
    var x = Math.max(0, Math.min(1, v / 100));
    return x * x * 1.15;
  }

  function createNoiseBuffer() {
    var len = Math.floor(ctx.sampleRate * 2);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function initAudio() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC({ latencyHint: 'interactive' });
    } catch (e) {
      try { ctx = new AC(); } catch (e2) { ctx = null; return; }
    }

    master = ctx.createGain();
    master.gain.value = 0.82;

    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 22;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.16;

    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.72;

    master.connect(comp);
    comp.connect(analyser);
    analyser.connect(ctx.destination);

    for (var i = 0; i < N_TRACKS; i++) {
      var g = ctx.createGain();
      g.gain.value = volGain(state.volumes[i]);
      g.connect(master);
      trackGain.push(g);
    }

    noiseBuf = createNoiseBuffer();
  }

  function ensureAudio() {
    if (!ctx) initAudio();
    if (ctx && ctx.state === 'suspended') {
      try { ctx.resume(); } catch (e) { /* ignore */ }
    }
  }

  /* ---------------- individual voices ---------------- */

  function vKick(t, out) {
    var o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(54, t + 0.055);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.30);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1.0, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.38, t + 0.10);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.44);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + 0.46);

    var n = ctx.createBufferSource();
    n.buffer = noiseBuf;
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 1400;
    var ng = ctx.createGain();
    ng.gain.setValueAtTime(0.34, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.021);
    n.connect(hp); hp.connect(ng); ng.connect(out);
    n.start(t); n.stop(t + 0.03);
  }

  function vSnare(t, out) {
    var n = ctx.createBufferSource();
    n.buffer = noiseBuf;
    n.playbackRate.value = 1 + (Math.random() - 0.5) * 0.12;
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 1050;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2300; bp.Q.value = 0.65;
    var ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.85, t + 0.004);
    ng.gain.exponentialRampToValueAtTime(0.26, t + 0.09);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
    n.connect(hp); hp.connect(bp); bp.connect(ng); ng.connect(out);
    n.start(t); n.stop(t + 0.21);

    var o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(196, t);
    o.frequency.exponentialRampToValueAtTime(152, t + 0.085);
    var og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.55, t + 0.004);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(og); og.connect(out);
    o.start(t); o.stop(t + 0.14);
  }

  function vHat(t, out, dur, peak, hpFreq) {
    var n = ctx.createBufferSource();
    n.buffer = noiseBuf;
    n.playbackRate.value = 1 + (Math.random() - 0.5) * 0.18;
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = hpFreq;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 10200; bp.Q.value = 0.9;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(hp); hp.connect(bp); bp.connect(g); g.connect(out);
    n.start(t); n.stop(t + dur + 0.03);
  }

  function vClap(t, out) {
    var n = ctx.createBufferSource();
    n.buffer = noiseBuf;
    n.playbackRate.value = 1 + (Math.random() - 0.5) * 0.1;
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 720;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 1.15;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.90, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.010);
    g.gain.setValueAtTime(0.78, t + 0.013);
    g.gain.exponentialRampToValueAtTime(0.10, t + 0.021);
    g.gain.setValueAtTime(0.72, t + 0.024);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.032);
    g.gain.setValueAtTime(0.60, t + 0.036);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    n.connect(hp); hp.connect(bp); bp.connect(g); g.connect(out);
    n.start(t); n.stop(t + 0.27);
  }

  function vTom(t, out, f0, f1, dur, peak) {
    var o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.72);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + dur + 0.03);

    var n = ctx.createBufferSource();
    n.buffer = noiseBuf;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = Math.min(9000, f0 * 4.5); bp.Q.value = 1.0;
    var ng = ctx.createGain();
    ng.gain.setValueAtTime(0.22, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.032);
    n.connect(bp); bp.connect(ng); ng.connect(out);
    n.start(t); n.stop(t + 0.045);
  }

  function vCowbell(t, out) {
    var o1 = ctx.createOscillator();
    o1.type = 'square'; o1.frequency.value = 540;
    var o2 = ctx.createOscillator();
    o2.type = 'square'; o2.frequency.value = 800;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 1.4;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.55, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.055);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    o1.connect(bp); o2.connect(bp); bp.connect(g); g.connect(out);
    o1.start(t); o2.start(t);
    o1.stop(t + 0.45); o2.stop(t + 0.45);
  }

  function triggerVoice(i, t) {
    var out = trackGain[i];
    if (!out) return;
    switch (i) {
      case 0: vKick(t, out); break;
      case 1: vSnare(t, out); break;
      case 2: vHat(t, out, 0.055, 0.55, 7200); break;
      case 3: vHat(t, out, 0.40, 0.45, 6000); break;
      case 4: vClap(t, out); break;
      case 5: vTom(t, out, 150, 62, 0.36, 0.90); break;
      case 6: vTom(t, out, 290, 128, 0.26, 0.80); break;
      case 7: vCowbell(t, out); break;
      default: break;
    }
  }

  function setTrackVolume(i, v) {
    if (ctx && trackGain[i]) {
      try {
        trackGain[i].gain.setTargetAtTime(volGain(v), ctx.currentTime, 0.015);
      } catch (e) {
        trackGain[i].gain.value = volGain(v);
      }
    }
  }

  /* =========================================================
     Scheduler (lookahead, sample accurate)
     ========================================================= */
  var playing = false;
  var timerId = null;
  var nextStepTime = 0;
  var stepCursor = 0;
  var scheduleQueue = [];
  var LOOKAHEAD_S = 0.13;
  var TIMER_MS = 25;

  function triggerStep(step, when) {
    for (var i = 0; i < N_TRACKS; i++) {
      if (state.pattern[i][step] && !state.mutes[i]) {
        triggerVoice(i, when);
      }
    }
  }

  function scheduleNext() {
    var sixteenth = 60 / state.tempo / 4;
    var swingAmt = (state.swing / 100) * (1 / 3) * sixteenth;
    var when = nextStepTime + ((stepCursor & 1) ? swingAmt : 0);
    triggerStep(stepCursor, when);
    scheduleQueue.push({ step: stepCursor, time: when });
    nextStepTime += sixteenth;
    stepCursor = (stepCursor + 1) & 15;
  }

  function scheduler() {
    if (!playing || !ctx) return;
    var now = ctx.currentTime;
    if (nextStepTime < now - 0.25) nextStepTime = now + 0.02;
    var horizon = now + LOOKAHEAD_S;
    var guard = 0;
    while (nextStepTime < horizon && guard++ < 128) {
      scheduleNext();
    }
  }

  function startPlayback() {
    ensureAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    playing = true;
    stepCursor = 0;
    scheduleQueue.length = 0;
    nextStepTime = ctx.currentTime + 0.08;
    if (timerId) clearInterval(timerId);
    timerId = setInterval(scheduler, TIMER_MS);
    scheduler();
    playBtn.classList.add('active');
    playBtn.setAttribute('aria-pressed', 'true');
    playBtn.setAttribute('aria-label', 'Stop');
  }

  function stopPlayback() {
    playing = false;
    if (timerId) { clearInterval(timerId); timerId = null; }
    scheduleQueue.length = 0;
    setPlayhead(-1);
    playBtn.classList.remove('active');
    playBtn.setAttribute('aria-pressed', 'false');
    playBtn.setAttribute('aria-label', 'Play');
  }

  function togglePlay() {
    if (playing) stopPlayback(); else startPlayback();
  }

  /* =========================================================
     Visual playhead
     ========================================================= */
  var curPlayhead = -1;
  var nowNodes = [];

  function setPlayhead(step) {
    if (curPlayhead === step) return;
    curPlayhead = step;
    seqEl.setAttribute('data-playhead', String(step));
    for (var i = 0; i < nowNodes.length; i++) nowNodes[i].classList.remove('now');
    nowNodes.length = 0;
    if (step >= 0) {
      var nodes = seqEl.querySelectorAll('.step[data-step="' + step + '"]');
      for (var j = 0; j < nodes.length; j++) {
        nodes[j].classList.add('now');
        nowNodes.push(nodes[j]);
      }
    }
  }

  function flashStep(step) {
    var nodes = seqEl.querySelectorAll('.step[data-step="' + step + '"][aria-pressed="true"]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.animate) {
        try {
          el.animate([
            { transform: 'scale(1)', filter: 'brightness(1)' },
            { transform: 'scale(1.12)', filter: 'brightness(1.8)', offset: 0.12 },
            { transform: 'scale(1)', filter: 'brightness(1)' }
          ], { duration: 240, easing: 'cubic-bezier(.2,.8,.3,1)' });
        } catch (e) { /* ignore */ }
      }
    }
  }

  /* =========================================================
     Visualizer
     ========================================================= */
  var vizCanvas = document.getElementById('viz');
  var vctx = vizCanvas.getContext('2d');
  var VW = 0, VH = 0, DPR = 1;
  var freqData = null;
  var vizPhase = 0;

  function resizeViz() {
    var rect = vizCanvas.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(rect.width * DPR));
    var h = Math.max(1, Math.round(rect.height * DPR));
    if (w === VW && h === VH) return;
    VW = w; VH = h;
    vizCanvas.width = w;
    vizCanvas.height = h;
  }

  function drawViz() {
    if (!vctx || VW === 0 || VH === 0) return;
    vctx.clearRect(0, 0, VW, VH);

    if (analyser && !freqData) {
      freqData = new Uint8Array(analyser.frequencyBinCount);
    }
    if (analyser && freqData) {
      analyser.getByteFrequencyData(freqData);
    }

    var nBars = 64;
    var res = VW / nBars;
    var gap = Math.max(1, res * 0.22);
    var bw = Math.max(1, res - gap);

    var grad = vctx.createLinearGradient(0, VH, 0, 0);
    grad.addColorStop(0, 'rgba(46,230,176,0.95)');
    grad.addColorStop(0.45, 'rgba(78,168,255,0.95)');
    grad.addColorStop(1, 'rgba(200,107,255,0.90)');
    vctx.fillStyle = grad;

    for (var i = 0; i < nBars; i++) {
      var v = 0;
      if (freqData) {
        var t = i / nBars;
        var idx = Math.floor(Math.pow(t, 1.6) * (freqData.length * 0.55));
        for (var k = 0; k < 4; k++) {
          var j = idx + k;
          if (j < freqData.length && freqData[j] > v) v = freqData[j];
        }
        v = v / 255;
      } else {
        v = 0.02 + 0.015 * (0.5 + 0.5 * Math.sin(vizPhase * 0.03 + i * 0.35));
      }

      var h = Math.max(2 * DPR, Math.pow(v, 1.25) * VH * 0.94);
      var x = i * res + gap / 2;
      var y = VH - h;
      var r = Math.min(bw / 2, 4 * DPR);
      vctx.beginPath();
      if (vctx.roundRect) vctx.roundRect(x, y, bw, h, r);
      else vctx.rect(x, y, bw, h);
      vctx.fill();
    }
    vizPhase++;
  }

  /* =========================================================
     Main animation loop
     ========================================================= */
  function tick() {
    requestAnimationFrame(tick);

    if (playing && ctx && scheduleQueue.length) {
      var now = ctx.currentTime;
      var latest = -1;
      while (scheduleQueue.length && scheduleQueue[0].time <= now) {
        latest = scheduleQueue.shift().step;
      }
      if (latest >= 0) {
        setPlayhead(latest);
        flashStep(latest);
      }
    } else if (!playing && curPlayhead !== -1) {
      setPlayhead(-1);
    }

    drawViz();
  }

  /* =========================================================
     UI wiring
     ========================================================= */
  function toggleStep(t, s) {
    if (t < 0 || t >= N_TRACKS || s < 0 || s >= N_STEPS) return;
    state.pattern[t][s] = !state.pattern[t][s];
    var btn = seqEl.querySelector('.step[data-track="' + t + '"][data-step="' + s + '"]');
    if (btn) btn.setAttribute('aria-pressed', String(state.pattern[t][s]));
    saveState();
  }

  function toggleMute(i) {
    if (i < 0 || i >= N_TRACKS) return;
    state.mutes[i] = !state.mutes[i];
    var btn = seqEl.querySelector('[data-mute="' + i + '"]');
    if (btn) {
      btn.setAttribute('aria-pressed', String(state.mutes[i]));
      btn.classList.toggle('on', state.mutes[i]);
      var row = btn.closest('.track-row');
      if (row) row.classList.toggle('muted', state.mutes[i]);
    }
    saveState();
  }

  function syncPatternUI() {
    for (var i = 0; i < allSteps.length; i++) {
      var b = allSteps[i];
      var t = parseInt(b.getAttribute('data-track'), 10);
      var s = parseInt(b.getAttribute('data-step'), 10);
      b.setAttribute('aria-pressed', String(!!state.pattern[t][s]));
    }
  }

  function syncFullUI() {
    syncPatternUI();

    for (var i = 0; i < muteBtns.length; i++) {
      var idx = parseInt(muteBtns[i].getAttribute('data-mute'), 10);
      muteBtns[i].setAttribute('aria-pressed', String(state.mutes[idx]));
      muteBtns[i].classList.toggle('on', state.mutes[idx]);
      var row = muteBtns[i].closest('.track-row');
      if (row) row.classList.toggle('muted', state.mutes[idx]);
    }

    for (var j = 0; j < volInputs.length; j++) {
      var k = parseInt(volInputs[j].getAttribute('data-volume'), 10);
      volInputs[j].value = String(state.volumes[k]);
      updateFill(volInputs[j]);
    }

    tempoEl.value = String(state.tempo);
    tempoOut.textContent = String(state.tempo);
    updateFill(tempoEl);

    swingEl.value = String(state.swing);
    swingOut.textContent = String(state.swing);
    updateFill(swingEl);
  }

  /* ---- step + mute + volume delegation ---- */
  seqEl.addEventListener('click', function (e) {
    var target = e.target;
    if (!target || !target.closest) return;

    var stepBtn = target.closest('.step');
    if (stepBtn && seqEl.contains(stepBtn)) {
      toggleStep(parseInt(stepBtn.getAttribute('data-track'), 10),
                 parseInt(stepBtn.getAttribute('data-step'), 10));
      return;
    }

    var muteBtn = target.closest('[data-mute]');
    if (muteBtn && seqEl.contains(muteBtn)) {
      toggleMute(parseInt(muteBtn.getAttribute('data-mute'), 10));
    }
  });

  seqEl.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.matches) return;
    if (el.matches('[data-volume]')) {
      var i = parseInt(el.getAttribute('data-volume'), 10);
      var v = Math.max(0, Math.min(100, parseInt(el.value, 10) || 0));
      state.volumes[i] = v;
      updateFill(el);
      setTrackVolume(i, v);
      saveState();
    }
  });

  /* ---- transport ---- */
  playBtn.addEventListener('click', function () {
    togglePlay();
  });

  /* ---- tempo ---- */
  tempoEl.addEventListener('input', function () {
    var v = parseFloat(tempoEl.value);
    if (!isFinite(v)) v = 120;
    v = Math.min(240, Math.max(40, Math.round(v)));
    state.tempo = v;
    tempoOut.textContent = String(v);
    updateFill(tempoEl);
    saveState();
  });
  tempoEl.addEventListener('change', function () {
    tempoEl.dispatchEvent(new Event('input'));
  });

  /* ---- swing ---- */
  swingEl.addEventListener('input', function () {
    var v = parseFloat(swingEl.value);
    if (!isFinite(v)) v = 0;
    v = Math.min(100, Math.max(0, Math.round(v)));
    state.swing = v;
    swingOut.textContent = String(v);
    updateFill(swingEl);
    saveState();
  });
  swingEl.addEventListener('change', function () {
    swingEl.dispatchEvent(new Event('input'));
  });

  /* ---- presets / random / clear ---- */
  var presetIndex = 0;
  presetBtn.addEventListener('click', function () {
    presetIndex = (presetIndex + 1) % PRESETS.length;
    state.pattern = patternFromList(PRESETS[presetIndex]);
    syncPatternUI();
    saveState();
  });

  randomBtn.addEventListener('click', function () {
    var density = [0.30, 0.20, 0.52, 0.12, 0.18, 0.12, 0.12, 0.10];
    for (var t = 0; t < N_TRACKS; t++) {
      for (var s = 0; s < N_STEPS; s++) {
        state.pattern[t][s] = Math.random() < density[t];
      }
    }
    /* keep a musical backbone */
    state.pattern[0][0] = true;
    state.pattern[0][8] = true;
    state.pattern[1][4] = true;
    state.pattern[1][12] = true;
    if (!state.pattern[0][4] && !state.pattern[0][12]) state.pattern[0][12] = true;
    syncPatternUI();
    saveState();
  });

  clearBtn.addEventListener('click', function () {
    for (var t = 0; t < N_TRACKS; t++) {
      for (var s = 0; s < N_STEPS; s++) state.pattern[t][s] = false;
    }
    syncPatternUI();
    saveState();
  });

  /* ---- global keyboard / gesture handlers ---- */
  function isTextInput(el) {
    if (!el) return false;
    var tag = (el.tagName || '').toUpperCase();
    if (tag === 'TEXTAREA') return true;
    if (tag === 'INPUT') {
      var type = (el.type || 'text').toLowerCase();
      return type === 'text' || type === 'search' || type === 'email' ||
             type === 'url' || type === 'tel' || type === 'password' ||
             type === 'number' || type === 'date';
    }
    return !!el.isContentEditable;
  }

  document.addEventListener('pointerdown', ensureAudio, true);
  document.addEventListener('mousedown', ensureAudio, true);
  document.addEventListener('touchstart', ensureAudio, true);
  document.addEventListener('keydown', ensureAudio, true);

  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
      if (isTextInput(e.target)) return;
      e.preventDefault();
      if (e.repeat) return;
      togglePlay();
    }
  }, false);

  /* =========================================================
     Boot
     ========================================================= */
  syncFullUI();
  resizeViz();

  if (window.ResizeObserver) {
    try { new ResizeObserver(resizeViz).observe(vizCanvas); } catch (e) { /* ignore */ }
  }
  window.addEventListener('resize', resizeViz);

  requestAnimationFrame(tick);
})();
</script>
</body>
</html>
```
### How the Sequencer Works

Let's walk through the key pieces so you can start jamming right away.

- **Step grid & track controls** – Each of the 8 instrument rows has 16 toggle buttons, grouped visually into beats of four. The small "M" button mutes a track, and the volume slider sets its level; muted tracks skip voice creation entirely.
- **Transport & timing** – Press the play button or hit Space to start/stop. Playback always begins at step 0. The scheduler runs ahead of the audio clock, so tempo (40–240 BPM) and swing (0–100%) changes apply mid-loop without gaps or drift.
- **Playhead & feedback** – While the pattern is running, the current step is highlighted on the grid and the `data-playhead` attribute updates, keeping visual feedback in sync with what you hear.
- **Sound design** – Every drum voice is synthesized from oscillators, noise buffers, filters, and gain envelopes. The kick, snare, hats, clap, toms, and cowbell each have distinct character, mixed through a compressor and an analyser for the live spectrum display.
- **Pattern tools & persistence** – The PRESET, RANDOM, and CLEAR buttons help you build ideas quickly. Your full state (pattern, tempo, swing, mutes, volumes) saves to localStorage automatically and restores on reload.

The top section also includes a real-time visualizer that reacts to the audio output, making the whole instrument feel more alive.
---

**Optimization Tip:** To change the default demo beat, edit the `PRESET_HOUSE` array (step numbers for each track) or adjust the `volumes` array in `defaultState()`. The `LOOKAHEAD_S` and `TIMER_MS` constants control scheduling precision if you need to tune timing behavior.