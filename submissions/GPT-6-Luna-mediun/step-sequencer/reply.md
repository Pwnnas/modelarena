```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#101315">
  <title>Pulse — Drum Machine</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #101315;
      --panel: #191e20;
      --panel-hi: #202729;
      --line: #30393b;
      --muted: #829092;
      --text: #edf1e9;
      --lime: #d4f36a;
      --lime-dim: #748d38;
      --cyan: #71ddd0;
      --amber: #f0ad69;
      --shadow: 0 18px 42px rgba(0, 0, 0, .28);
    }

    * { box-sizing: border-box; }

    body {
      min-width: 320px;
      min-height: 100vh;
      margin: 0;
      padding: 25px 30px 22px;
      color: var(--text);
      background:
        radial-gradient(ellipse at 12% 0%, rgba(105, 139, 96, .11), transparent 37%),
        radial-gradient(ellipse at 94% 43%, rgba(58, 119, 113, .09), transparent 31%),
        var(--bg);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: .01em;
    }

    button, input { font: inherit; }
    button { color: inherit; }

    .app {
      width: min(1220px, 100%);
      margin: 0 auto;
    }

    .topbar {
      min-height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 13px;
    }

    .brand-mark {
      width: 37px;
      height: 37px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(212, 243, 106, .46);
      border-radius: 11px;
      color: var(--lime);
      background: linear-gradient(145deg, rgba(212, 243, 106, .15), rgba(212, 243, 106, .035));
      box-shadow: inset 0 1px rgba(255,255,255,.08), 0 0 22px rgba(212, 243, 106, .08);
    }

    .brand-mark svg { width: 21px; height: 21px; }

    .brand-name {
      font-size: 19px;
      line-height: 1;
      font-weight: 760;
      letter-spacing: .16em;
    }

    .brand-sub {
      margin-top: 5px;
      color: var(--muted);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: .2em;
      text-transform: uppercase;
    }

    .top-status {
      display: flex;
      align-items: center;
      gap: 9px;
      color: #aab5b3;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .16em;
      text-transform: uppercase;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #52605d;
      box-shadow: 0 0 0 4px rgba(130,144,146,.08);
    }

    .status-dot.live {
      background: var(--lime);
      box-shadow: 0 0 10px rgba(212,243,106,.75), 0 0 0 4px rgba(212,243,106,.09);
    }

    .transport {
      display: grid;
      grid-template-columns: 1.05fr 1fr 1fr 1.12fr auto;
      align-items: center;
      gap: 22px;
      min-height: 91px;
      padding: 15px 20px;
      border: 1px solid #2b3436;
      border-radius: 15px;
      background: linear-gradient(135deg, rgba(34,41,42,.98), rgba(23,28,30,.98));
      box-shadow: var(--shadow), inset 0 1px rgba(255,255,255,.035);
    }

    .transport-play {
      display: flex;
      align-items: center;
      gap: 13px;
    }

    .play-button {
      width: 54px;
      height: 54px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(212,243,106,.62);
      border-radius: 13px;
      background: linear-gradient(145deg, #dafa7c, #abc94e);
      color: #192014;
      box-shadow: 0 5px 0 #6d8133, 0 8px 19px rgba(173,211,71,.16), inset 0 1px rgba(255,255,255,.48);
      cursor: pointer;
      transition: transform .12s ease, filter .15s ease, box-shadow .15s ease;
    }

    .play-button:hover { filter: brightness(1.08); }
    .play-button:active { transform: translateY(3px); box-shadow: 0 2px 0 #6d8133, 0 4px 12px rgba(173,211,71,.16); }
    .play-button svg { width: 21px; height: 21px; }
    .play-button.is-playing { background: linear-gradient(145deg, #f1b775, #d88d52); border-color: #f2c08e; box-shadow: 0 5px 0 #8e5b38, 0 8px 19px rgba(240,173,105,.18); }

    .play-copy strong {
      display: block;
      font-size: 12px;
      letter-spacing: .15em;
      text-transform: uppercase;
    }

    .play-copy span {
      display: block;
      margin-top: 5px;
      color: var(--muted);
      font-size: 10px;
    }

    .control {
      min-width: 0;
      padding-left: 18px;
      border-left: 1px solid #313a3c;
    }

    .control-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 9px;
    }

    .control-label {
      color: #a9b5b2;
      font-size: 9px;
      font-weight: 760;
      letter-spacing: .16em;
      text-transform: uppercase;
    }

    .control-value {
      min-width: 43px;
      color: var(--text);
      font-size: 14px;
      font-weight: 730;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .control-value small {
      color: #879391;
      font-size: 9px;
      font-weight: 650;
    }

    input[type="range"] {
      width: 100%;
      height: 16px;
      margin: 0;
      appearance: none;
      background: transparent;
      cursor: pointer;
      accent-color: var(--lime);
    }

    input[type="range"]::-webkit-slider-runnable-track {
      height: 4px;
      border-radius: 9px;
      background: linear-gradient(90deg, #718342, #3c4842);
      box-shadow: inset 0 1px 2px rgba(0,0,0,.5);
    }

    input[type="range"]::-webkit-slider-thumb {
      width: 13px;
      height: 13px;
      margin-top: -4.5px;
      appearance: none;
      border: 2px solid #eff8c9;
      border-radius: 50%;
      background: var(--lime);
      box-shadow: 0 0 8px rgba(212,243,106,.38);
    }

    input[type="range"]::-moz-range-track {
      height: 4px;
      border-radius: 9px;
      background: linear-gradient(90deg, #718342, #3c4842);
    }

    input[type="range"]::-moz-range-thumb {
      width: 10px;
      height: 10px;
      border: 2px solid #eff8c9;
      border-radius: 50%;
      background: var(--lime);
      box-shadow: 0 0 8px rgba(212,243,106,.38);
    }

    .swing-control input[type="range"]::-webkit-slider-runnable-track {
      background: linear-gradient(90deg, #427c77, #394847);
    }

    .swing-control input[type="range"]::-webkit-slider-thumb {
      border-color: #c6f5ee;
      background: var(--cyan);
      box-shadow: 0 0 8px rgba(113,221,208,.36);
    }

    .swing-control input[type="range"]::-moz-range-thumb {
      border-color: #c6f5ee;
      background: var(--cyan);
      box-shadow: 0 0 8px rgba(113,221,208,.36);
    }

    .meter {
      width: 100%;
      height: 34px;
      overflow: hidden;
      border: 1px solid #303a3b;
      border-radius: 7px;
      background: #121718;
      box-shadow: inset 0 2px 6px rgba(0,0,0,.42);
    }

    #visualizer {
      display: block;
      width: 100%;
      height: 100%;
    }

    .action-row {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .utility-button {
      min-height: 33px;
      padding: 0 11px;
      border: 1px solid #394345;
      border-radius: 8px;
      color: #bdc7c2;
      background: linear-gradient(180deg, #293133, #202729);
      box-shadow: 0 2px 0 #111617, inset 0 1px rgba(255,255,255,.04);
      font-size: 9px;
      font-weight: 750;
      letter-spacing: .11em;
      text-transform: uppercase;
      cursor: pointer;
      transition: border-color .15s, color .15s, transform .12s;
    }

    .utility-button:hover { color: var(--lime); border-color: #65774b; }
    .utility-button:active { transform: translateY(1px); }

    .sequencer-panel {
      margin-top: 13px;
      padding: 13px 15px 15px;
      border: 1px solid #2b3436;
      border-radius: 15px;
      background: linear-gradient(135deg, rgba(29,35,37,.98), rgba(23,28,30,.98));
      box-shadow: var(--shadow), inset 0 1px rgba(255,255,255,.03);
    }

    .section-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 27px;
      margin: 0 2px 8px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 9px;
      font-size: 11px;
      font-weight: 760;
      letter-spacing: .15em;
      text-transform: uppercase;
    }

    .section-title::before {
      content: "";
      width: 5px;
      height: 15px;
      border-radius: 5px;
      background: var(--lime);
      box-shadow: 0 0 9px rgba(212,243,106,.38);
    }

    .section-hint {
      color: #72807e;
      font-size: 9px;
      letter-spacing: .07em;
    }

    .seq-header,
    .track-row {
      display: grid;
      grid-template-columns: 148px repeat(16, minmax(0, 1fr)) 48px 106px;
      align-items: center;
      column-gap: 5px;
    }

    .seq-header {
      min-height: 25px;
      padding: 0 7px 5px;
    }

    .head-label {
      color: #697674;
      font-size: 8px;
      font-weight: 750;
      letter-spacing: .16em;
      text-transform: uppercase;
    }

    .head-label.center { text-align: center; }

    .step-number {
      color: #6f7c79;
      font-size: 9px;
      font-weight: 700;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }

    .step-number.beat-start { color: #a6b09f; }

    .track-row {
      position: relative;
      min-height: 40px;
      padding: 3px 7px;
      border-top: 1px solid rgba(255,255,255,.025);
      border-radius: 7px;
      transition: background .12s ease;
    }

    .track-row:nth-child(even) { background: rgba(255,255,255,.012); }
    .track-row.is-current { background: rgba(212,243,106,.055); }
    .track-row.is-current .track-name { color: #f1f5df; }

    .track-identity {
      display: flex;
      align-items: center;
      min-width: 0;
      gap: 9px;
      padding-right: 5px;
    }

    .track-indicator {
      width: 7px;
      height: 7px;
      flex: 0 0 auto;
      border-radius: 50%;
      background: var(--track-color, var(--lime));
      opacity: .55;
      box-shadow: 0 0 8px color-mix(in srgb, var(--track-color, var(--lime)) 45%, transparent);
    }

    .track-row.is-current .track-indicator { opacity: 1; box-shadow: 0 0 11px var(--track-color, var(--lime)); }

    .track-name {
      overflow: hidden;
      color: #c9d1ca;
      font-size: 10px;
      font-weight: 720;
      letter-spacing: .055em;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: color .12s;
    }

    .track-kind {
      display: block;
      margin-top: 3px;
      color: #6e7b78;
      font-size: 7px;
      font-weight: 650;
      letter-spacing: .13em;
      text-transform: uppercase;
    }

    .step {
      position: relative;
      width: 100%;
      height: 27px;
      padding: 0;
      border: 1px solid #364143;
      border-radius: 5px;
      background: linear-gradient(180deg, #242b2d, #1c2224);
      box-shadow: inset 0 1px rgba(255,255,255,.035), 0 2px 0 rgba(0,0,0,.24);
      cursor: pointer;
      transition: background .12s, border-color .12s, box-shadow .12s, transform .12s;
      -webkit-tap-highlight-color: transparent;
    }

    .step:hover { border-color: #687660; background: #303936; }
    .step:active { transform: translateY(1px); }

    .step.beat-start { margin-left: 4px; }
    .seq-header .step-number.beat-start { margin-left: 4px; }

    .step.active {
      border-color: var(--track-color, var(--lime));
      background: linear-gradient(180deg, color-mix(in srgb, var(--track-color, var(--lime)) 90%, white), var(--track-color, var(--lime)));
      box-shadow: 0 0 10px color-mix(in srgb, var(--track-color, var(--lime)) 22%, transparent),
        inset 0 1px rgba(255,255,255,.55), 0 2px 0 color-mix(in srgb, var(--track-color, var(--lime)) 47%, #152015);
    }

    .step.active::after {
      content: "";
      position: absolute;
      inset: 4px 5px auto;
      height: 2px;
      border-radius: 3px;
      background: rgba(255,255,255,.34);
    }

    .step.playing {
      outline: 2px solid rgba(255,255,255,.82);
      outline-offset: 1px;
      z-index: 1;
      box-shadow: 0 0 15px color-mix(in srgb, var(--track-color, var(--lime)) 70%, transparent);
      animation: step-hit .16s ease-out;
    }

    @keyframes step-hit {
      from { transform: scale(.92); }
      to { transform: scale(1); }
    }

    .mute-button {
      width: 38px;
      height: 27px;
      justify-self: center;
      border: 1px solid #374143;
      border-radius: 5px;
      color: #71807d;
      background: #202729;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: .08em;
      cursor: pointer;
      transition: .15s;
    }

    .mute-button:hover { border-color: #8d765e; color: #e6c08f; }
    .mute-button[aria-pressed="true"] {
      border-color: #bd7f4f;
      color: #24190f;
      background: linear-gradient(180deg, #f0b477, #ce8750);
      box-shadow: 0 0 10px rgba(240,173,105,.12), inset 0 1px rgba(255,255,255,.4);
    }

    .volume-wrap {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .volume-wrap input { min-width: 0; }
    .volume-value {
      width: 26px;
      color: #7f8d89;
      font-size: 8px;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .bottom-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 43px;
      padding: 8px 4px 0;
      color: #6e7b79;
      font-size: 9px;
      letter-spacing: .07em;
    }

    .presets {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .preset-label {
      margin-right: 4px;
      color: #87938f;
      font-size: 8px;
      font-weight: 750;
      letter-spacing: .14em;
      text-transform: uppercase;
    }

    .preset-button {
      padding: 6px 9px;
      border: 1px solid #30393a;
      border-radius: 6px;
      color: #96a39e;
      background: rgba(31,37,38,.8);
      font-size: 8px;
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
      cursor: pointer;
    }

    .preset-button:hover { color: var(--cyan); border-color: #47716c; }
    .keyboard-hint kbd {
      padding: 3px 6px;
      border: 1px solid #3c4647;
      border-radius: 4px;
      color: #a3b0aa;
      background: #202729;
      font: inherit;
    }

    button:focus-visible, input:focus-visible {
      outline: 2px solid var(--cyan);
      outline-offset: 3px;
    }

    @media (max-width: 960px) {
      body { padding: 18px 16px; }
      .transport { grid-template-columns: 1.1fr 1fr 1fr; gap: 15px; }
      .transport .meter-block, .transport .action-row { display: none; }
      .seq-header, .track-row {
        grid-template-columns: 120px repeat(16, minmax(0, 1fr)) 42px 86px;
        column-gap: 3px;
      }
      .sequencer-panel { overflow-x: auto; }
      .seq-header, .track-row { min-width: 820px; }
    }

    @media (max-width: 600px) {
      body { padding: 13px 10px; }
      .top-status { font-size: 8px; }
      .transport { grid-template-columns: 1fr 1fr; padding: 13px; gap: 13px; }
      .transport-play { grid-column: 1 / -1; }
      .transport .control { padding-left: 10px; }
      .transport .control:nth-of-type(2) { border-left: 0; padding-left: 0; }
      .sequencer-panel { padding: 11px 8px; }
      .section-hint { display: none; }
      .bottom-bar { align-items: flex-start; gap: 10px; flex-direction: column; }
      .presets { flex-wrap: wrap; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M3 13h3l2.1-7 3.8 13 2.2-8 1.4 2H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <div class="brand-name">PULSE</div>
          <div class="brand-sub">Analog rhythm lab</div>
        </div>
      </div>
      <div class="top-status"><span class="status-dot" id="statusDot"></span><span id="statusText">Ready to play</span></div>
    </header>

    <section class="transport" aria-label="Transport and global controls">
      <div class="transport-play">
        <button id="play" class="play-button" type="button" aria-label="Play" aria-pressed="false">
          <svg id="playIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor"/></svg>
        </button>
        <div class="play-copy">
          <strong id="playLabel">Start sequence</strong>
          <span>Space bar to toggle</span>
        </div>
      </div>

      <div class="control tempo-control">
        <div class="control-head">
          <label class="control-label" for="tempo">Tempo</label>
          <div class="control-value"><span id="tempoReadout">120</span> <small>BPM</small></div>
        </div>
        <input id="tempo" type="range" min="40" max="240" step="1" value="120" aria-label="Tempo in beats per minute">
      </div>

      <div class="control swing-control">
        <div class="control-head">
          <label class="control-label" for="swing">Swing</label>
          <div class="control-value"><span id="swingReadout">0</span><small>%</small></div>
        </div>
        <input id="swing" type="range" min="0" max="100" step="1" value="0" aria-label="Swing percentage">
      </div>

      <div class="control meter-block">
        <div class="control-head">
          <span class="control-label">Output signal</span>
          <span class="control-value"><small>LIVE</small></span>
        </div>
        <div class="meter"><canvas id="visualizer" aria-label="Live audio visualizer"></canvas></div>
      </div>

      <div class="action-row">
        <button class="utility-button" id="clear" type="button">Clear</button>
      </div>
    </section>

    <section class="sequencer-panel" aria-label="16-step drum sequencer">
      <div class="section-heading">
        <div class="section-title">Step sequencer</div>
        <div class="section-hint">16 steps <span aria-hidden="true">·</span> 4 beats <span aria-hidden="true">·</span> click pads to program</div>
      </div>
      <div id="sequencer" data-playhead="-1">
        <div class="seq-header" id="seqHeader">
          <div class="head-label">Instrument</div>
          <div class="step-number">1</div><div class="step-number">2</div><div class="step-number">3</div><div class="step-number beat-start">4</div>
          <div class="step-number">5</div><div class="step-number">6</div><div class="step-number">7</div><div class="step-number beat-start">8</div>
          <div class="step-number">9</div><div class="step-number">10</div><div class="step-number">11</div><div class="step-number beat-start">12</div>
          <div class="step-number">13</div><div class="step-number">14</div><div class="step-number">15</div><div class="step-number beat-start">16</div>
          <div class="head-label center">Mute</div>
          <div class="head-label">Level</div>
        </div>
        <div id="tracks"></div>
      </div>
    </section>

    <footer class="bottom-bar">
      <div class="presets">
        <span class="preset-label">Quick patterns</span>
        <button class="preset-button" type="button" data-preset="pocket">Pocket</button>
        <button class="preset-button" type="button" data-preset="four">Four on floor</button>
        <button class="preset-button" type="button" data-preset="broken">Broken beat</button>
        <button class="preset-button" type="button" data-preset="random">Randomize</button>
      </div>
      <div class="keyboard-hint"><kbd>Space</kbd> play / stop <span aria-hidden="true">·</span> Your session saves automatically</div>
    </footer>
  </main>

  <script>
    (() => {
      "use strict";

      const TRACKS = [
        { name: "Kick", kind: "Deep punch", color: "#d4f36a" },
        { name: "Snare", kind: "Tight snap", color: "#f0ad69" },
        { name: "Closed Hat", kind: "Short metal", color: "#71ddd0" },
        { name: "Open Hat", kind: "Airy wash", color: "#75b8e8" },
        { name: "Clap", kind: "Wide handclap", color: "#e29bd0" },
        { name: "Low Tom", kind: "Round tom", color: "#e48968" },
        { name: "High Tom", kind: "Bright tom", color: "#c7a5ef" },
        { name: "Cowbell", kind: "Dual tone", color: "#eccd76" }
      ];
      const STORAGE_KEY = "pulse-drum-machine-v1";
      const pattern = Array.from({ length: 8 }, () => Array(16).fill(false));
      const muted = Array(8).fill(false);
      const volumes = Array(8).fill(0.82);

      let tempo = 120;
      let swing = 0;
      let audioContext = null;
      let analyser = null;
      let masterGain = null;
      let trackGains = [];
      let noiseBuffer = null;
      let isPlaying = false;
      let schedulerTimer = null;
      let nextStep = 0;
      let nextStepTime = 0;
      let stepEvents = [];
      let activeSources = new Set();
      let lastPaintedStep = -1;
      let audioInitPromise = null;

      const sequencer = document.getElementById("sequencer");
      const tracksElement = document.getElementById("tracks");
      const playButton = document.getElementById("play");
      const playIcon = document.getElementById("playIcon");
      const playLabel = document.getElementById("playLabel");
      const tempoInput = document.getElementById("tempo");
      const swingInput = document.getElementById("swing");
      const statusDot = document.getElementById("statusDot");
      const statusText = document.getElementById("statusText");
      const canvas = document.getElementById("visualizer");
      const canvasContext = canvas.getContext("2d");

      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

      function saveState() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            pattern, tempo, swing, muted, volumes
          }));
        } catch (_) {}
      }

      function loadState() {
        try {
          const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
          if (!stored || typeof stored !== "object") return;
          if (Array.isArray(stored.pattern)) {
            for (let t = 0; t < 8; t++) {
              if (Array.isArray(stored.pattern[t])) {
                for (let s = 0; s < 16; s++) pattern[t][s] = stored.pattern[t][s] === true;
              }
            }
          }
          if (Number.isFinite(Number(stored.tempo))) tempo = clamp(Number(stored.tempo), 40, 240);
          if (Number.isFinite(Number(stored.swing))) swing = clamp(Number(stored.swing), 0, 100);
          if (Array.isArray(stored.muted)) {
            for (let t = 0; t < 8; t++) muted[t] = stored.muted[t] === true;
          }
          if (Array.isArray(stored.volumes)) {
            for (let t = 0; t < 8; t++) {
              const value = Number(stored.volumes[t]);
              if (Number.isFinite(value)) volumes[t] = clamp(value, 0, 1);
            }
          }
        } catch (_) {}
      }

      function buildTracks() {
        TRACKS.forEach((track, trackIndex) => {
          const row = document.createElement("div");
          row.className = "track-row";
          row.dataset.trackRow = String(trackIndex);
          row.style.setProperty("--track-color", track.color);

          const identity = document.createElement("div");
          identity.className = "track-identity";
          identity.innerHTML = '<span class="track-indicator" aria-hidden="true"></span><span class="track-name"></span>';
          identity.querySelector(".track-name").innerHTML =
            `${track.name}<span class="track-kind">${track.kind}</span>`;
          row.appendChild(identity);

          for (let step = 0; step < 16; step++) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "step" + (step % 4 === 3 ? " beat-start" : "");
            button.dataset.track = String(trackIndex);
            button.dataset.step = String(step);
            button.setAttribute("aria-pressed", "false");
            button.setAttribute("aria-label", `${track.name}, step ${step + 1}`);
            button.title = `${track.name} · step ${step + 1}`;
            button.addEventListener("click", () => {
              const t = Number(button.dataset.track);
              const s = Number(button.dataset.step);
              pattern[t][s] = !pattern[t][s];
              updateStepButton(button, t, s);
              saveState();
            });
            row.appendChild(button);
          }

          const muteButton = document.createElement("button");
          muteButton.type = "button";
          muteButton.className = "mute-button";
          muteButton.dataset.mute = String(trackIndex);
          muteButton.textContent = "M";
          muteButton.setAttribute("aria-label", `Mute ${track.name}`);
          muteButton.setAttribute("aria-pressed", "false");
          muteButton.addEventListener("click", () => {
            const t = Number(muteButton.dataset.mute);
            muted[t] = !muted[t];
            updateMuteButton(muteButton, t);
            if (audioContext && trackGains[t]) {
              const now = audioContext.currentTime;
              trackGains[t].gain.cancelScheduledValues(now);
              trackGains[t].gain.setTargetAtTime(muted[t] ? 0 : volumes[t], now, 0.008);
            }
            saveState();
          });
          row.appendChild(muteButton);

          const volumeWrap = document.createElement("div");
          volumeWrap.className = "volume-wrap";
          const volume = document.createElement("input");
          volume.type = "range";
          volume.min = "0";
          volume.max = "1";
          volume.step = "0.01";
          volume.value = String(volumes[trackIndex]);
          volume.dataset.volume = String(trackIndex);
          volume.setAttribute("aria-label", `${track.name} volume`);
          const volumeValue = document.createElement("span");
          volumeValue.className = "volume-value";
          volumeValue.textContent = `${Math.round(volumes[trackIndex] * 100)}%`;
          volume.addEventListener("input", () => {
            const t = Number(volume.dataset.volume);
            volumes[t] = clamp(Number(volume.value), 0, 1);
            volumeValue.textContent = `${Math.round(volumes[t] * 100)}%`;
            if (audioContext && trackGains[t] && !muted[t]) {
              const now = audioContext.currentTime;
              trackGains[t].gain.setTargetAtTime(volumes[t], now, 0.012);
            }
            saveState();
          });
          volumeWrap.append(volume, volumeValue);
          row.appendChild(volumeWrap);
          tracksElement.appendChild(row);
        });
        refreshPatternUI();
      }

      function updateStepButton(button, trackIndex, step) {
        const active = pattern[trackIndex][step];
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      }

      function updateMuteButton(button, trackIndex) {
        const isMuted = muted[trackIndex];
        button.setAttribute("aria-pressed", isMuted ? "true" : "false");
        button.textContent = isMuted ? "MUTED" : "M";
      }

      function refreshPatternUI() {
        document.querySelectorAll("button[data-track][data-step]").forEach(button => {
          updateStepButton(button, Number(button.dataset.track), Number(button.dataset.step));
        });
        document.querySelectorAll("button[data-mute]").forEach(button => {
          updateMuteButton(button, Number(button.dataset.mute));
        });
        document.querySelectorAll("input[data-volume]").forEach(input => {
          const t = Number(input.dataset.volume);
          input.value = String(volumes[t]);
          const value = input.parentElement.querySelector(".volume-value");
          if (value) value.textContent = `${Math.round(volumes[t] * 100)}%`;
        });
      }

      function setTempo(value) {
        tempo = clamp(Math.round(Number(value) || 120), 40, 240);
        tempoInput.value = String(tempo);
        document.getElementById("tempoReadout").textContent = String(tempo);
        saveState();
      }

      function setSwing(value) {
        swing = clamp(Math.round(Number(value) || 0), 0, 100);
        swingInput.value = String(swing);
        document.getElementById("swingReadout").textContent = String(swing);
        saveState();
      }

      function makeNoiseBuffer(context) {
        const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 1.2), context.sampleRate);
        const data = buffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < data.length; i++) {
          const white = Math.random() * 2 - 1;
          last = last * 0.18 + white * 0.82;
          data[i] = white * 0.72 + last * 0.28;
        }
        return buffer;
      }

      function initializeAudio() {
        if (audioContext) {
          if (audioContext.state === "suspended") return audioContext.resume();
          return Promise.resolve();
        }
        if (audioInitPromise) return audioInitPromise;
        audioInitPromise = (async () => {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (!AudioContextClass) return;
          audioContext = new AudioContextClass();
          masterGain = audioContext.createGain();
          masterGain.gain.value = 0.82;
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.78;
          masterGain.connect(analyser);
          analyser.connect(audioContext.destination);
          noiseBuffer = makeNoiseBuffer(audioContext);
          trackGains = TRACKS.map((_, index) => {
            const gain = audioContext.createGain();
            gain.gain.value = muted[index] ? 0 : volumes[index];
            gain.connect(masterGain);
            return gain;
          });
          if (audioContext.state === "suspended") await audioContext.resume();
        })().catch(() => {});
        return audioInitPromise;
      }

      function registerSource(source) {
        activeSources.add(source);
        source.onended = () => activeSources.delete(source);
        return source;
      }

      function connectVoice(node, trackIndex) {
        node.connect(trackGains[trackIndex]);
      }

      function triggerNoise(trackIndex, when, config) {
        const source = registerSource(audioContext.createBufferSource());
        source.buffer = noiseBuffer;
        const filter = audioContext.createBiquadFilter();
        filter.type = config.filterType || "highpass";
        filter.frequency.setValueAtTime(config.frequency, when);
        if (config.q) filter.Q.setValueAtTime(config.q, when);
        const envelope = audioContext.createGain();
        envelope.gain.setValueAtTime(0.0001, when);
        config.envelope(envelope.gain, when);
        source.connect(filter);
        filter.connect(envelope);
        connectVoice(envelope, trackIndex);
        source.start(when);
        source.stop(when + config.duration);
        return { source, envelope };
      }

      function triggerVoice(trackIndex, when) {
        if (!audioContext || muted[trackIndex]) return;
        const t = audioContext;
        if (trackIndex === 0) {
          const osc = registerSource(t.createOscillator());
          const gain = t.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(155, when);
          osc.frequency.exponentialRampToValueAtTime(43, when + 0.14);
          gain.gain.setValueAtTime(0.0001, when);
          gain.gain.exponentialRampToValueAtTime(0.95, when + 0.004);
          gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.34);
          osc.connect(gain);
          connectVoice(gain, trackIndex);
          osc.start(when);
          osc.stop(when + 0.36);
        } else if (trackIndex === 1) {
          triggerNoise(trackIndex, when, {
            frequency: 1250, q: 0.7, duration: 0.23,
            envelope(g, at) {
              g.exponentialRampToValueAtTime(0.72, at + 0.003);
              g.exponentialRampToValueAtTime(0.0001, at + 0.19);
            }
          });
          const osc = registerSource(t.createOscillator());
          const gain = t.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(185, when);
          osc.frequency.exponentialRampToValueAtTime(120, when + 0.075);
          gain.gain.setValueAtTime(0.0001, when);
          gain.gain.exponentialRampToValueAtTime(0.27, when + 0.003);
          gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
          osc.connect(gain);
          connectVoice(gain, trackIndex);
          osc.start(when);
          osc.stop(when + 0.14);
        } else if (trackIndex === 2) {
          triggerNoise(trackIndex, when, {
            frequency: 7400, q: 0.65, duration: 0.075,
            envelope(g, at) {
              g.exponentialRampToValueAtTime(0.38, at + 0.002);
              g.exponentialRampToValueAtTime(0.0001, at + 0.052);
            }
          });
        } else if (trackIndex === 3) {
          triggerNoise(trackIndex, when, {
            frequency: 6100, q: 0.5, duration: 0.62,
            envelope(g, at) {
              g.exponentialRampToValueAtTime(0.36, at + 0.003);
              g.setTargetAtTime(0.0001, at + 0.08, 0.14);
            }
          });
        } else if (trackIndex === 4) {
          const clap = triggerNoise(trackIndex, when, {
            frequency: 1850, q: 0.8, duration: 0.32,
            envelope(g, at) {
              g.setValueAtTime(0.0001, at);
              [0.002, 0.026, 0.051].forEach((offset, i) => {
                g.setValueAtTime(0.0001, at + offset);
                g.linearRampToValueAtTime(0.57 - i * 0.08, at + offset + 0.004);
                g.exponentialRampToValueAtTime(0.0001, at + offset + 0.022);
              });
              g.setValueAtTime(0.0001, at + 0.074);
              g.linearRampToValueAtTime(0.32, at + 0.08);
              g.exponentialRampToValueAtTime(0.0001, at + 0.28);
            }
          });
          const filter = t.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(3800, when);
          clap.envelope.disconnect();
          clap.envelope.connect(filter);
          connectVoice(filter, trackIndex);
        } else if (trackIndex === 5 || trackIndex === 6) {
          const osc = registerSource(t.createOscillator());
          const body = t.createOscillator();
          const gain = t.createGain();
          const high = trackIndex === 6;
          osc.type = "sine";
          osc.frequency.setValueAtTime(high ? 235 : 142, when);
          osc.frequency.exponentialRampToValueAtTime(high ? 125 : 73, when + 0.18);
          body.type = "triangle";
          body.frequency.setValueAtTime(high ? 470 : 284, when);
          gain.gain.setValueAtTime(0.0001, when);
          gain.gain.exponentialRampToValueAtTime(high ? 0.48 : 0.58, when + 0.004);
          gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.28);
          osc.connect(gain);
          body.connect(gain);
          connectVoice(gain, trackIndex);
          osc.start(when);
          body.start(when);
          osc.stop(when + 0.3);
          body.stop(when + 0.3);
        } else if (trackIndex === 7) {
          const osc1 = registerSource(t.createOscillator());
          const osc2 = registerSource(t.createOscillator());
          const filter = t.createBiquadFilter();
          const gain = t.createGain();
          osc1.type = "square";
          osc2.type = "square";
          osc1.frequency.setValueAtTime(562, when);
          osc2.frequency.setValueAtTime(845, when);
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(1900, when);
          filter.Q.setValueAtTime(3.2, when);
          gain.gain.setValueAtTime(0.0001, when);
          gain.gain.exponentialRampToValueAtTime(0.25, when + 0.003);
          gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          connectVoice(gain, trackIndex);
          osc1.start(when);
          osc2.start(when);
          osc1.stop(when + 0.24);
          osc2.stop(when + 0.24);
        }
      }

      function sixteenthDuration() {
        return 60 / tempo / 4;
      }

      function scheduleStep(step, time) {
        stepEvents.push({ step, time });
        for (let track = 0; track < 8; track++) {
          if (pattern[track][step] && !muted[track]) triggerVoice(track, time);
        }
      }

      function scheduler() {
        if (!isPlaying || !audioContext) return;
        const now = audioContext.currentTime;
        const horizon = now + 0.13;
        let guard = 0;
        while (nextStepTime < horizon && guard < 64) {
          if (nextStepTime < now - 0.08) nextStepTime = now + 0.008;
          const currentStep = nextStep;
          const intendedTime = nextStepTime;
          scheduleStep(currentStep, intendedTime);
          nextStep = (nextStep + 1) % 16;

          const duration = sixteenthDuration();
          const swingOffset = (swing / 100) * (duration / 3);
          const intervalToNext = nextStep % 2 === 1
            ? duration + swingOffset
            : duration - swingOffset;
          nextStepTime += intervalToNext;
          guard++;
        }
        if (stepEvents.length > 100) {
          const cutoff = now - 1;
          stepEvents = stepEvents.filter(event => event.time > cutoff);
        }
      }

      async function startPlayback() {
        await initializeAudio();
        if (!audioContext || isPlaying) return;
        if (audioContext.state === "suspended") await audioContext.resume();
        isPlaying = true;
        nextStep = 0;
        nextStepTime = audioContext.currentTime + 0.045;
        stepEvents = [];
        statusDot.classList.add("live");
        statusText.textContent = "Sequence running";
        playButton.classList.add("is-playing");
        playButton.setAttribute("aria-pressed", "true");
        playButton.setAttribute("aria-label", "Stop");
        playLabel.textContent = "Stop sequence";
        playIcon.innerHTML = '<path d="M7 6.5h4v11H7zM13 6.5h4v11h-4z" fill="currentColor"/>';
        sequencer.dataset.playhead = "-1";
        scheduler();
        schedulerTimer = window.setInterval(scheduler, 20);
      }

      function stopPlayback() {
        isPlaying = false;
        if (schedulerTimer !== null) {
          window.clearInterval(schedulerTimer);
          schedulerTimer = null;
        }
        if (audioContext) {
          const now = audioContext.currentTime;
          for (const source of activeSources) {
            try { source.stop(now); } catch (_) {}
          }
        }
        activeSources.clear();
        stepEvents = [];
        sequencer.dataset.playhead = "-1";
        setPlayhead(-1);
        statusDot.classList.remove("live");
        statusText.textContent = "Ready to play";
        playButton.classList.remove("is-playing");
        playButton.setAttribute("aria-pressed", "false");
        playButton.setAttribute("aria-label", "Play");
        playLabel.textContent = "Start sequence";
        playIcon.innerHTML = '<path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor"/>';
      }

      function togglePlayback() {
        if (isPlaying) stopPlayback();
        else void startPlayback();
      }

      function setPlayhead(step) {
        if (step === lastPaintedStep) return;
        lastPaintedStep = step;
        document.querySelectorAll(".track-row").forEach((row, index) => {
          row.classList.toggle("is-current", step >= 0 && index === step);
          row.querySelectorAll(".step").forEach(button => {
            const current = Number(button.dataset.step) === step;
            button.classList.toggle("playing", current && step >= 0);
          });
        });
      }

      function drawVisualizer() {
        const rect = canvas.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const width = Math.round(rect.width * dpr);
          const height = Math.round(rect.height * dpr);
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }
          canvasContext.clearRect(0, 0, width, height);
          canvasContext.fillStyle = "#121718";
          canvasContext.fillRect(0, 0, width, height);
          const data = new Uint8Array(analyser ? analyser.frequencyBinCount : 64);
          if (analyser) analyser.getByteFrequencyData(data);
          const count = Math.min(42, data.length);
          const gap = 2 * dpr;
          const barWidth = Math.max(1, (width - (count - 1) * gap) / count);
          for (let i = 0; i < count; i++) {
            const value = data[i] / 255;
            const barHeight = Math.max(2 * dpr, value * (height - 6 * dpr));
            const x = i * (barWidth + gap);
            const y = height - barHeight;
            const gradient = canvasContext.createLinearGradient(0, y, 0, height);
            gradient.addColorStop(0, "#d4f36a");
            gradient.addColorStop(1, "#4d8f7c");
            canvasContext.fillStyle = gradient;
            canvasContext.fillRect(x, y, barWidth, barHeight);
          }
          canvasContext.strokeStyle = "rgba(255,255,255,.05)";
          canvasContext.lineWidth = 1;
          canvasContext.beginPath();
          canvasContext.moveTo(0, height - 1);
          canvasContext.lineTo(width, height - 1);
          canvasContext.stroke();
        }
        requestAnimationFrame(drawVisualizer);
      }

      function updatePlayheadFromAudio() {
        if (isPlaying && audioContext) {
          const now = audioContext.currentTime;
          let heard = -1;
          for (let i = 0; i < stepEvents.length; i++) {
            if (stepEvents[i].time <= now) heard = stepEvents[i].step;
            else break;
          }
          sequencer.dataset.playhead = String(heard);
          setPlayhead(heard);
        }
        requestAnimationFrame(updatePlayheadFromAudio);
      }

      function loadPreset(name) {
        for (let t = 0; t < 8; t++) pattern[t].fill(false);
        const put = (track, steps) => steps.forEach(step => { pattern[track][step % 16] = true; });
        if (name === "pocket") {
          put(0, [0, 7, 10]);
          put(1, [4, 12]);
          put(2, [2, 6, 10, 14]);
          put(3, [14]);
          put(4, [12]);
          put(5, [11]);
          put(6, [15]);
        } else if (name === "four") {
          put(0, [0, 4, 8, 12]);
          put(1, [4, 12]);
          put(2, [2, 6, 10, 14]);
          put(3, [6, 14]);
          put(4, [12]);
        } else if (name === "broken") {
          put(0, [0, 5, 9, 11]);
          put(1, [4, 11]);
          put(2, [0, 3, 6, 8, 10, 14]);
          put(3, [7, 15]);
          put(4, [3, 11]);
          put(5, [14]);
          put(6, [6]);
          put(7, [2, 10]);
        } else if (name === "random") {
          const chances = [0.22, 0.13, 0.44, 0.12, 0.08, 0.09, 0.07, 0.12];
          for (let t = 0; t < 8; t++) {
            for (let s = 0; s < 16; s++) {
              if (Math.random() < chances[t]) pattern[t][s] = true;
            }
          }
          pattern[0][0] = true;
          pattern[1][4] = true;
          pattern[1][12] = true;
        }
        refreshPatternUI();
        saveState();
      }

      loadState();
      tempoInput.value = String(tempo);
      swingInput.value = String(swing);
      document.getElementById("tempoReadout").textContent = String(tempo);
      document.getElementById("swingReadout").textContent = String(swing);
      buildTracks();

      tempoInput.addEventListener("input", () => setTempo(tempoInput.value));
      tempoInput.addEventListener("change", () => setTempo(tempoInput.value));
      swingInput.addEventListener("input", () => setSwing(swingInput.value));
      swingInput.addEventListener("change", () => setSwing(swingInput.value));
      playButton.addEventListener("click", togglePlayback);

      document.getElementById("clear").addEventListener("click", () => {
        pattern.forEach(row => row.fill(false));
        refreshPatternUI();
        saveState();
      });

      document.querySelectorAll("[data-preset]").forEach(button => {
        button.addEventListener("click", () => loadPreset(button.dataset.preset));
      });

      document.addEventListener("pointerdown", () => { void initializeAudio(); }, { passive: true });

      document.addEventListener("keydown", event => {
        if (event.code !== "Space" || event.repeat) return;
        const target = event.target;
        const textInput = target instanceof HTMLInputElement &&
          (target.type === "text" || target.type === "search" || target.type === "email" ||
           target.type === "password" || target.type === "number");
        if (textInput || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
        event.preventDefault();
        togglePlayback();
      });

      requestAnimationFrame(drawVisualizer);
      requestAnimationFrame(updatePlayheadFromAudio);
    })();
  </script>
</body>
</html>
```