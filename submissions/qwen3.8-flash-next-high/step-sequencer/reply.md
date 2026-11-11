```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pulse — Synthesized Drum Machine</title>
  <style>
    :root {
      --bg: #07080c;
      --panel: #101319;
      --panel-2: #0c0f14;
      --line: #242b35;
      --line-2: #303945;
      --text: #eef3f8;
      --dim: #96a1ad;
      --accent: #7cf0ff;
      --radius: 14px;
      --shadow: 0 18px 45px rgba(0, 0, 0, 0.38);
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      height: 100%;
    }

    body {
      margin: 0;
      background:
        radial-gradient(circle at 20% -5%, rgba(40, 120, 190, 0.16), transparent 38%),
        radial-gradient(circle at 90% 10%, rgba(180, 70, 170, 0.12), transparent 36%),
        var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      overscroll-behavior: none;
    }

    .app {
      max-width: 1240px;
      min-height: 100vh;
      margin: 0 auto;
      padding: 14px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .panel {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.012)), var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 12px;
    }

    .transport-panel {
      display: grid;
      grid-template-columns: minmax(220px, 1fr) auto;
      gap: 14px;
      align-items: center;
    }

    .brand {
      display: flex;
      align-items: baseline;
      gap: 12px;
      flex-wrap: wrap;
      min-width: 0;
    }

    .brand-title {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 0.14em;
      color: #fff;
    }

    .brand-sub {
      font-size: 11px;
      color: var(--dim);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .transport-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .btn {
      appearance: none;
      border: 1px solid var(--line-2);
      border-radius: 10px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.015)), #151921;
      color: var(--text);
      padding: 10px 14px;
      font: inherit;
      font-size: 13px;
      font-weight: 750;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      transition: transform 0.08s ease, border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      user-select: none;
    }

    .btn:hover {
      border-color: #475363;
    }

    .btn:active {
      transform: translateY(1px) scale(0.99);
    }

    .btn:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    .btn.ghost {
      color: var(--dim);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.01)), #101319;
    }

    .play-btn {
      min-width: 116px;
      border-color: #2d3a47;
    }

    .play-btn.playing {
      color: #071016;
      background: linear-gradient(180deg, #9ffaff, #27b8dd);
      border-color: #49d9f5;
      box-shadow: 0 0 18px rgba(52, 203, 255, 0.42);
    }

    .controls {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: repeat(2, minmax(240px, 1fr));
      gap: 14px;
    }

    .field {
      border: 1px solid var(--line);
      border-radius: 10px;
      background: var(--panel-2);
      padding: 10px;
    }

    .field-head {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
      font-size: 11px;
      color: var(--dim);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .readout {
      color: var(--text);
      font-variant-numeric: tabular-nums;
      font-weight: 850;
      font-size: 13px;
    }

    .field-hint {
      margin-top: 6px;
      font-size: 10px;
      color: #586371;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    input[type="range"] {
      width: 100%;
      height: 24px;
      margin: 0;
      accent-color: var(--accent);
      background: transparent;
    }

    .sequencer-panel {
      overflow: hidden;
    }

    .sequencer-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      padding: 2px 8px 8px;
      color: var(--dim);
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .sequencer-head strong {
      color: #d7e1ec;
      font-weight: 800;
    }

    .track {
      --accent-rgb: 124, 240, 255;
      display: grid;
      grid-template-columns: 112px 1fr 92px;
      gap: 10px;
      align-items: center;
      border: 1px solid #1c222b;
      border-radius: 12px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.018), rgba(255, 255, 255, 0.006)), #0b0e13;
      padding: 6px 8px;
      margin-bottom: 7px;
      transition: opacity 0.18s ease, filter 0.18s ease;
    }

    .track:last-child {
      margin-bottom: 0;
    }

    .track.is-muted {
      opacity: 0.42;
      filter: saturate(0.65);
    }

    .track[data-track="0"] { --accent-rgb: 255, 92, 96; }
    .track[data-track="1"] { --accent-rgb: 255, 173, 74; }
    .track[data-track="2"] { --accent-rgb: 112, 238, 130; }
    .track[data-track="3"] { --accent-rgb: 104, 195, 255; }
    .track[data-track="4"] { --accent-rgb: 245, 231, 94; }
    .track[data-track="5"] { --accent-rgb: 163, 127, 255; }
    .track[data-track="6"] { --accent-rgb: 255, 120, 218; }
    .track[data-track="7"] { --accent-rgb: 213, 245, 110; }

    .track-meta {
      display: flex;
      align-items: center;
      gap: 7px;
      min-width: 0;
    }

    .track-name {
      font-size: 12px;
      font-weight: 850;
      letter-spacing: 0.11em;
      text-transform: uppercase;
      color: rgb(var(--accent-rgb));
      opacity: 0.92;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1 1 auto;
    }

    .mute-btn {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      border: 1px solid #2a313b;
      background: #151820;
      color: #94a1af;
      font-size: 11px;
      font-weight: 900;
      cursor: pointer;
      transition: transform 0.08s ease, background 0.14s ease, border-color 0.14s ease, color 0.14s ease;
    }

    .mute-btn:hover {
      border-color: #495565;
    }

    .mute-btn:active {
      transform: scale(0.95);
    }

    .mute-btn[aria-pressed="true"] {
      color: #fff;
      background: #5e111d;
      border-color: #ff6b72;
      box-shadow: 0 0 10px rgba(255, 90, 98, 0.28);
    }

    .track-meta input[type="range"] {
      width: 72px;
      height: 30px;
      accent-color: rgb(var(--accent-rgb));
    }

    .steps {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      min-width: 0;
    }

    .group {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      padding: 3px;
      border-radius: 10px;
      border: 1px solid #1a2029;
      background: #080b10;
      transition: border-color 0.12s ease, background 0.12s ease, box-shadow 0.12s ease;
    }

    .group.is-current {
      border-color: rgba(255, 255, 255, 0.16);
      background: rgba(255, 255, 255, 0.055);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    }

    .step {
      appearance: none;
      border: 1px solid #232a34;
      border-radius: 8px;
      min-height: 32px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.01)),
        #12161d;
      color: #687280;
      font: inherit;
      font-size: 11px;
      cursor: pointer;
      transition:
        transform 0.08s ease,
        border-color 0.14s ease,
        background 0.14s ease,
        box-shadow 0.14s ease,
        color 0.14s ease,
        filter 0.14s ease;
    }

    .step:hover {
      transform: translateY(-1px);
      border-color: #3b4655;
      color: #99a8b8;
    }

    .step:active {
      transform: scale(0.95);
    }

    .step:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 1px;
    }

    .step[aria-pressed="true"] {
      color: #fff;
      border-color: rgba(var(--accent-rgb), 0.82);
      background:
        linear-gradient(180deg, rgba(var(--accent-rgb), 0.26), rgba(var(--accent-rgb), 0.10)),
        #12161d;
      box-shadow:
        0 0 12px rgba(var(--accent-rgb), 0.42),
        inset 0 0 8px rgba(var(--accent-rgb), 0.28);
    }

    .step.is-current {
      z-index: 3;
      outline: 2px solid rgba(255, 255, 255, 0.72);
      outline-offset: -2px;
      border-color: rgba(255, 255, 255, 0.65);
    }

    .step.hit {
      animation: hitFlash 0.22s ease-out;
    }

    @keyframes hitFlash {
      0% {
        filter: brightness(2.25) saturate(1.15);
        box-shadow:
          0 0 26px rgba(var(--accent-rgb), 0.92),
          inset 0 0 16px rgba(255, 255, 255, 0.28);
      }
      100% {
        filter: none;
      }
    }

    .visualizer-panel {
      padding: 8px;
    }

    #scope {
      display: block;
      width: 100%;
      height: 132px;
      border-radius: 10px;
      background: #05070a;
      border: 1px solid #171d25;
    }

    .status-bar {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 7px;
      color: #657180;
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .status-bar .good {
      color: #9ff7c4;
    }

    .status-bar .warn {
      color: #ffd08d;
    }

    @media (max-width: 980px) {
      .transport-panel {
        grid-template-columns: 1fr;
      }

      .track {
        grid-template-columns: 96px 1fr 74px;
      }

      .track-meta input[type="range"] {
        width: 56px;
      }
    }

    @media (max-width: 720px) {
      .controls {
        grid-template-columns: 1fr;
      }

      .track {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .steps {
        grid-template-columns: repeat(2, 1fr);
      }

      .group {
        grid-template-columns: repeat(4, 1fr);
      }

      #scope {
        height: 112px;
      }
    }
  </style>
</head>
<body>
  <main class="app">
    <header class="panel transport-panel">
      <div class="brand">
        <div>
          <div class="brand-title">PULSE</div>
          <div class="brand-sub">Synth Drum Machine · Sample-Accurate Sequencer</div>
        </div>
      </div>

      <div class="transport-actions" aria-label="Transport">
        <button id="play" class="btn play-btn" type="button" aria-pressed="false">Play</button>
        <button id="clear" class="btn ghost" type="button">Clear</button>
        <button id="demo" class="btn ghost" type="button">Demo</button>
        <button id="random" class="btn ghost" type="button">Random</button>
      </div>

      <div class="controls">
        <div class="field">
          <div class="field-head">
            <span>Tempo</span>
            <span id="tempo-readout" class="readout">120</span>
          </div>
          <input id="tempo" type="range" min="40" max="240" step="1" value="120" aria-label="Tempo BPM">
          <div class="field-hint">40–240 BPM</div>
        </div>

        <div class="field">
          <div class="field-head">
            <span>Swing</span>
            <span id="swing-readout" class="readout">0%</span>
          </div>
          <input id="swing" type="range" min="0" max="100" step="1" value="0" aria-label="Swing percentage">
          <div class="field-hint">0–100</div>
        </div>
      </div>
    </header>

    <section id="sequencer" class="panel sequencer-panel" data-playhead="-1" aria-label="16 step drum sequencer">
      <div class="sequencer-head">
        <span><strong>16 steps</strong> · 8 voices</span>
        <span>Space toggles playback</span>
      </div>
    </section>

    <section class="panel visualizer-panel" aria-label="Audio visualizer">
      <canvas id="scope" width="1200" height="132"></canvas>
      <div class="status-bar">
        <span>Web Audio · live synthesis</span>
        <span id="audio-status">Audio standby</span>
      </div>
    </section>
  </main>

  <script>
    (() => {
      'use strict';

      const TRACKS = [
        'Kick',
        'Snare',
        'Closed Hat',
        'Open Hat',
        'Clap',
        'Low Tom',
        'High Tom',
        'Cowbell'
      ];
      const STEPS = 16;
      const STORAGE_KEY = 'pulse.drum.machine.v1';

      const $ = (id) => document.getElementById(id);

      const seq = $('sequencer');
      const playBtn = $('play');
      const clearBtn = $('clear');
      const demoBtn = $('demo');
      const randomBtn = $('random');
      const tempoInput = $('tempo');
      const swingInput = $('swing');
      const tempoReadout = $('tempo-readout');
      const swingReadout = $('swing-readout');
      const audioStatus = $('audio-status');
      const canvas = $('scope');
      const vizCtx = canvas && canvas.getContext ? canvas.getContext('2d') : null;

      let state = loadState();

      const stepButtons = [];
      const groupElements = [];
      const trackElements = [];

      const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
      const clamp01 = (v) => clamp(v, 0, 1);
      const clampInt = (v, min, max) => {
        const n = Math.round(Number(v));
        if (!Number.isFinite(n)) return min;
        return clamp(n, min, max);
      };
      const toBool = (v) => v === true || v === 'true' || v === 1 || v === '1';

      function makeEmptyPattern() {
        return Array.from({ length: 8 }, () => new Array(STEPS).fill(false));
      }

      function makeDemoPattern() {
        const p = makeEmptyPattern();
        [0, 8].forEach((s) => { p[0][s] = true; });
        [4, 12].forEach((s) => { p[1][s] = true; });
        [2, 6, 10, 14].forEach((s) => { p[2][s] = true; });
        return p;
      }

      function makeRandomPattern() {
        const p = makeEmptyPattern();
        const maybe = (probability) => Math.random() < probability;

        for (let s = 0; s < STEPS; s++) {
          if (s === 0) {
            p[0][s] = true;
          } else if (s % 4 === 0) {
            p[0][s] = maybe(0.48);
          } else if (s % 2 === 0) {
            p[0][s] = maybe(0.20);
          } else {
            p[0][s] = maybe(0.05);
          }
        }

        for (let s = 0; s < STEPS; s++) {
          if (s === 4 || s === 12) {
            p[1][s] = maybe(0.78);
          } else if (s % 4 === 0) {
            p[1][s] = maybe(0.05);
          } else {
            p[1][s] = maybe(0.02);
          }
        }

        for (let s = 0; s < STEPS; s++) {
          if (s % 2 === 1) p[2][s] = maybe(0.60);
          else p[2][s] = maybe(0.10);
        }

        for (let s = 0; s < STEPS; s++) {
          if (s % 2 === 1) p[3][s] = maybe(0.11);
        }

        for (let s = 0; s < STEPS; s++) {
          if (s === 4 || s === 12) p[4][s] = maybe(0.28);
          else p[4][s] = maybe(0.02);
        }

        for (let s = 0; s < STEPS; s++) {
          if (s % 4 === 3) {
            p[5][s] = maybe(0.16);
            p[6][s] = maybe(0.11);
          } else {
            p[5][s] = maybe(0.04);
            p[6][s] = maybe(0.03);
          }
        }

        for (let s = 0; s < STEPS; s++) {
          if (s % 4 === 2) p[7][s] = maybe(0.10);
          else p[7][s] = maybe(0.015);
        }

        return p;
      }

      function normalizePattern(input) {
        const p = makeEmptyPattern();
        if (!Array.isArray(input)) return p;

        for (let t = 0; t < 8; t++) {
          if (!Array.isArray(input[t])) continue;
          for (let s = 0; s < STEPS; s++) {
            p[t][s] = toBool(input[t][s]);
          }
        }

        return p;
      }

      function normalizeVolume(v) {
        const val = Number(v);
        if (!Number.isFinite(val)) return 1;
        if (val > 1 && val <= 100) return clamp01(val / 100);
        return clamp01(val);
      }

      function parseVolume(value) {
        const val = Number(value);
        if (!Number.isFinite(val)) return 1;
        if (val > 1 && val <= 100) return clamp01(val / 100);
        return clamp01(val);
      }

      function loadState() {
        let raw = null;
        try {
          raw = localStorage.getItem(STORAGE_KEY);
        } catch (_) {}

        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const volumes = [];
            for (let i = 0; i < 8; i++) {
              volumes[i] = normalizeVolume(parsed && parsed.volumes ? parsed.volumes[i] : 1);
            }
            return {
              pattern: normalizePattern(parsed.pattern),
              tempo: clampInt(parsed.tempo, 40, 240),
              swing: clampInt(parsed.swing, 0, 100),
              mutes: Array.from({ length: 8 }, (_, i) => toBool(parsed.mutes && parsed.mutes[i])),
              volumes
            };
          } catch (_) {}
        }

        return {
          pattern: makeDemoPattern(),
          tempo: 120,
          swing: 0,
          mutes: Array.from({ length: 8 }, () => false),
          volumes: Array.from({ length: 8 }, () => 1)
        };
      }

      function saveState() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (_) {}
      }

      function buildSequencer() {
        if (!seq) return;

        for (let track = 0; track < 8; track++) {
          stepButtons[track] = [];
          groupElements[track] = [];

          const trackEl = document.createElement('div');
          trackEl.className = 'track';
          trackEl.dataset.track = String(track);
          trackElements[track] = trackEl;

          const meta = document.createElement('div');
          meta.className = 'track-meta';

          const name = document.createElement('div');
          name.className = 'track-name';
          name.textContent = TRACKS[track];
          meta.appendChild(name);

          const muteBtn = document.createElement('button');
          muteBtn.type = 'button';
          muteBtn.className = 'mute-btn';
          muteBtn.dataset.mute = String(track);
          muteBtn.setAttribute('aria-pressed', String(state.mutes[track]));
          muteBtn.title = 'Mute ' + TRACKS[track];
          muteBtn.textContent = 'M';
          meta.appendChild(muteBtn);

          const volume = document.createElement('input');
          volume.type = 'range';
          volume.dataset.volume = String(track);
          volume.min = '0';
          volume.max = '100';
          volume.step = '0.01';
          volume.value = String(Math.round(state.volumes[track] * 100));
          volume.title = 'Volume ' + TRACKS[track];
          meta.appendChild(volume);

          const steps = document.createElement('div');
          steps.className = 'steps';

          for (let g = 0; g < 4; g++) {
            const group = document.createElement('div');
            group.className = 'group';
            group.dataset.group = String(g);
            groupElements[track][g] = group;

            for (let i = 0; i < 4; i++) {
              const step = g * 4 + i;
              const btn = document.createElement('button');
              btn.type = 'button';
              btn.className = 'step';
              btn.dataset.track = String(track);
              btn.dataset.step = String(step);
              btn.setAttribute('aria-pressed', String(state.pattern[track][step]));
              btn.setAttribute('aria-label', TRACKS[track] + ' step ' + (step + 1));
              btn.textContent = '';
              group.appendChild(btn);
              stepButtons[track][step] = btn;
            }

            steps.appendChild(group);
          }

          trackEl.appendChild(meta);
          trackEl.appendChild(steps);
          seq.appendChild(trackEl);
        }
      }

      function applyTrackVisual(track) {
        const trackEl = trackElements[track];
        if (!trackEl) return;

        trackEl.classList.toggle('is-muted', state.mutes[track]);

        const muteBtn = trackEl.querySelector('button[data-mute="' + track + '"]');
        if (muteBtn) muteBtn.setAttribute('aria-pressed', String(state.mutes[track]));

        const volume = trackEl.querySelector('input[data-volume="' + track + '"]');
        if (volume) volume.value = String(Math.round(state.volumes[track] * 100));

        for (let step = 0; step < STEPS; step++) {
          const btn = stepButtons[track] && stepButtons[track][step];
          if (btn) btn.setAttribute('aria-pressed', String(state.pattern[track][step]));
        }
      }

      function updateTransportUI() {
        if (!playBtn) return;
        playBtn.textContent = playing ? 'Stop' : 'Play';
        playBtn.classList.toggle('playing', playing);
        playBtn.setAttribute('aria-pressed', String(playing));
      }

      function updateReadouts() {
        if (tempoReadout) tempoReadout.textContent = String(state.tempo);
        if (swingReadout) swingReadout.textContent = String(state.swing) + '%';
        if (audioStatus) {
          audioStatus.textContent = audioReady ? 'Audio live' : 'Audio standby';
          audioStatus.className = audioReady ? 'good' : 'warn';
        }
      }

      function setPattern(pattern) {
        state.pattern = normalizePattern(pattern);
        for (let t = 0; t < 8; t++) {
          for (let s = 0; s < STEPS; s++) {
            const btn = stepButtons[t] && stepButtons[t][s];
            if (btn) btn.setAttribute('aria-pressed', String(state.pattern[t][s]));
          }
        }
        saveState();
      }

      function toggleStep(track, step) {
        if (!Number.isFinite(track) || !Number.isFinite(step)) return;
        if (track < 0 || track >= 8 || step < 0 || step >= STEPS) return;

        const active = !state.pattern[track][step];
        state.pattern[track][step] = active;

        const btn = stepButtons[track] && stepButtons[track][step];
        if (btn) btn.setAttribute('aria-pressed', String(active));

        saveState();
      }

      function toggleMute(track) {
        if (!Number.isFinite(track) || track < 0 || track >= 8) return;
        state.mutes[track] = !state.mutes[track];
        applyTrackVisual(track);
        applyTrackAudioGain(track);
        saveState();
      }

      function handleVolumeInput(input) {
        const track = Number(input && input.dataset && input.dataset.volume);
        if (!Number.isFinite(track) || track < 0 || track >= 8) return;

        state.volumes[track] = parseVolume(input.value);
        input.value = String(Math.round(state.volumes[track] * 100));
        applyTrackAudioGain(track);
        saveState();
      }

      function setTempo(value) {
        state.tempo = clampInt(value, 40, 240);
        if (tempoInput) tempoInput.value = String(state.tempo);
        updateReadouts();
        saveState();
      }

      function setSwing(value) {
        state.swing = clampInt(value, 0, 100);
        if (swingInput) swingInput.value = String(state.swing);
        updateReadouts();
        saveState();
      }

      /* Audio engine */
      let audioCtx = null;
      let audioReady = false;
      let masterGain = null;
      let limiter = null;
      let analyser = null;
      const trackGains = [];
      let noiseBuffer = null;
      let cowbellWave = null;

      function ensureAudio() {
        if (audioReady && audioCtx) {
          if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
          }
          return audioCtx;
        }

        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;

        try {
          const ac = new Ctor();

          const master = ac.createGain();
          master.gain.value = 0.78;

          const comp = ac.createDynamicsCompressor();
          comp.threshold.value = -10;
          comp.knee.value = 12;
          comp.ratio.value = 8;
          comp.attack.value = 0.003;
          comp.release.value = 0.14;

          const analyzer = ac.createAnalyser();
          analyzer.fftSize = 2048;
          analyzer.smoothingTimeConstant = 0.74;

          master.connect(comp);
          comp.connect(analyzer);
          analyzer.connect(ac.destination);

          const gains = [];
          for (let i = 0; i < 8; i++) {
            const gain = ac.createGain();
            gain.gain.value = state.mutes[i] ? 0 : clamp01(state.volumes[i]);
            gain.connect(master);
            gains[i] = gain;
          }

          audioCtx = ac;
          masterGain = master;
          limiter = comp;
          analyser = analyzer;
          for (let i = 0; i < 8; i++) trackGains[i] = gains[i];

          noiseBuffer = createNoiseBuffer(ac, 2.0);
          cowbellWave = createCowbellWave(ac);

          audioReady = true;
          updateReadouts();

          if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
          }

          return audioCtx;
        } catch (_) {
          return null;
        }
      }

      function applyTrackAudioGain(track) {
        const gain = trackGains[track];
        if (!gain) return;
        const value = state.mutes[track] || state.volumes[track] <= 0.0001 ? 0 : clamp01(state.volumes[track]);
        try {
          gain.gain.value = value;
        } catch (_) {}
      }

      function createNoiseBuffer(ac, seconds) {
        const rate = ac.sampleRate;
        const length = Math.max(1, Math.floor(rate * seconds));
        const buffer = ac.createBuffer(1, length, rate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.5;
        }

        return buffer;
      }

      function createCowbellWave(ac) {
        try {
          const n = 8;
          const real = new Float32Array(n);
          const imag = new Float32Array(n);

          // The oscillator frequency will be 270 Hz.
          // Harmonics k=2,3,4 produce approximately 540 / 810 / 1080 Hz.
          real[2] = 0.30;
          real[3] = 0.22;
          real[4] = 0.09;

          imag[2] = 0.05;
          imag[3] = 0.05;
          imag[4] = 0.02;

          return ac.createPeriodicWave(real, imag, { disableNormalization: true });
        } catch (_) {
          return null;
        }
      }

      function attachCleanup(source, nodes) {
        let done = false;
        const cleanup = () => {
          if (done) return;
          done = true;
          for (const node of nodes) {
            try {
              node.disconnect();
            } catch (_) {}
          }
        };
        try {
          source.onended = cleanup;
        } catch (_) {}
        return cleanup;
      }

      function startNoise(source, time, tail) {
        if (!noiseBuffer) return;
        const maxOffset = Math.max(0, noiseBuffer.duration - tail - 0.02);
        const offset = Math.random() * maxOffset;
        source.start(time, offset, tail);
      }

      function playKick(time, velocity) {
        const ac = audioCtx;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const nodes = [osc, gain];

        osc.type = 'sine';

        osc.frequency.setValueAtTime(175, time);
        osc.frequency.exponentialRampToValueAtTime(50, time + 0.07);
        osc.frequency.exponentialRampToValueAtTime(32, time + 0.18);

        const peak = 0.92 * velocity;
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(peak, time + 0.003);
        gain.gain.exponentialRampToValueAtTime(peak * 0.35, time + 0.085);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.46);
        gain.gain.linearRampToValueAtTime(0, time + 0.49);

        osc.connect(gain);
        gain.connect(trackGains[0]);

        attachCleanup(osc, nodes);
        osc.start(time);
        osc.stop(time + 0.55);
      }

      function playSnare(time, velocity) {
        const ac = audioCtx;
        const tail = 0.36;

        const source = ac.createBufferSource();
        source.buffer = noiseBuffer;

        const hp = ac.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(1000, time);
        hp.Q.setValueAtTime(0.7, time);

        const bp = ac.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1800, time);
        bp.frequency.linearRampToValueAtTime(1350, time + 0.25);
        bp.Q.setValueAtTime(0.68, time);

        const gain = ac.createGain();
        const peak = 0.82 * velocity;

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(peak, time + 0.001);
        gain.gain.exponentialRampToValueAtTime(peak * 0.45, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(peak * 0.18, time + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.29);
        gain.gain.linearRampToValueAtTime(0, time + 0.33);

        source.connect(hp);
        hp.connect(bp);
        bp.connect(gain);
        gain.connect(trackGains[1]);

        attachCleanup(source, [source, hp, bp, gain]);
        startNoise(source, time, tail);
      }

      function playClosedHat(time, velocity) {
        const ac = audioCtx;
        const tail = 0.07;

        const source = ac.createBufferSource();
        source.buffer = noiseBuffer;

        const bp = ac.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(11000, time);
        bp.Q.setValueAtTime(0.8, time);

        const gain = ac.createGain();
        const peak = 0.58 * velocity;

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(peak, time + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);
        gain.gain.linearRampToValueAtTime(0, time + 0.045);

        source.connect(bp);
        bp.connect(gain);
        gain.connect(trackGains[2]);

        attachCleanup(source, [source, bp, gain]);
        startNoise(source, time, tail);
      }

      function playOpenHat(time, velocity) {
        const ac = audioCtx;
        const tail = 0.7;

        const source = ac.createBufferSource();
        source.buffer = noiseBuffer;

        const bp = ac.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(9000, time);
        bp.Q.setValueAtTime(1.2, time);

        const gain = ac.createGain();
        const peak = 0.46 * velocity;

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(peak, time + 0.003);
        gain.gain.exponentialRampToValueAtTime(peak * 0.35, time + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.52);
        gain.gain.linearRampToValueAtTime(0, time + 0.56);

        source.connect(bp);
        bp.connect(gain);
        gain.connect(trackGains[3]);

        attachCleanup(source, [source, bp, gain]);
        startNoise(source, time, tail);
      }

      function playClap(time, velocity) {
        const ac = audioCtx;
        const tail = 0.48;

        const source = ac.createBufferSource();
        source.buffer = noiseBuffer;

        const bp = ac.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1250, time);
        bp.frequency.linearRampToValueAtTime(900, time + 0.3);
        bp.Q.setValueAtTime(0.72, time);

        const gain = ac.createGain();
        const peak = 0.72 * velocity;

        const bursts = [
          [0.000, 0.34],
          [0.018, 0.62],
          [0.036, 0.88],
          [0.055, 1.0]
        ];

        gain.gain.setValueAtTime(0.0001, time);
        for (const burst of bursts) {
          gain.gain.setValueAtTime(peak * burst[1], time + burst[0]);
        }
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.38);
        gain.gain.linearRampToValueAtTime(0, time + 0.42);

        source.connect(bp);
        bp.connect(gain);
        gain.connect(trackGains[4]);

        attachCleanup(source, [source, bp, gain]);
        startNoise(source, time, tail);
      }

      function playLowTom(time, velocity) {
        const ac = audioCtx;
        const osc = ac.createOscillator();
        const lp = ac.createBiquadFilter();
        const gain = ac.createGain();
        const nodes = [osc, lp, gain];

        osc.type = 'triangle';

        osc.frequency.setValueAtTime(185, time);
        osc.frequency.exponentialRampToValueAtTime(72, time + 0.19);

        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(1300, time);
        lp.frequency.linearRampToValueAtTime(380, time + 0.22);
        lp.Q.setValueAtTime(0.7, time);

        const peak = 0.78 * velocity;
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(peak, time + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.43);
        gain.gain.linearRampToValueAtTime(0, time + 0.46);

        osc.connect(lp);
        lp.connect(gain);
        gain.connect(trackGains[5]);

        attachCleanup(osc, nodes);
        osc.start(time);
        osc.stop(time + 0.52);
      }

      function playHighTom(time, velocity) {
        const ac = audioCtx;
        const osc = ac.createOscillator();
        const lp = ac.createBiquadFilter();
        const gain = ac.createGain();
        const nodes = [osc, lp, gain];

        osc.type = 'triangle';

        osc.frequency.setValueAtTime(335, time);
        osc.frequency.exponentialRampToValueAtTime(145, time + 0.15);

        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(2400, time);
        lp.frequency.linearRampToValueAtTime(750, time + 0.17);
        lp.Q.setValueAtTime(0.7, time);

        const peak = 0.68 * velocity;
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(peak, time + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.30);
        gain.gain.linearRampToValueAtTime(0, time + 0.33);

        osc.connect(lp);
        lp.connect(gain);
        gain.connect(trackGains[6]);

        attachCleanup(osc, nodes);
        osc.start(time);
        osc.stop(time + 0.38);
      }

      function playCowbell(time, velocity) {
        const ac = audioCtx;
        const osc = ac.createOscillator();
        const hp = ac.createBiquadFilter();
        const lp = ac.createBiquadFilter();
        const gain = ac.createGain();
        const nodes = [osc, hp, lp, gain];

        if (cowbellWave) {
          osc.setPeriodicWave(cowbellWave);
        } else {
          osc.type = 'square';
        }

        osc.frequency.setValueAtTime(270, time);

        hp.type = 'highpass';
        hp.frequency.setValueAtTime(420, time);
        hp.Q.setValueAtTime(0.7, time);

        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(4200, time);
        lp.Q.setValueAtTime(0.7, time);

        const peak = 0.34 * velocity;
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(peak, time + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
        gain.gain.linearRampToValueAtTime(0, time + 0.26);

        osc.connect(hp);
        hp.connect(lp);
        lp.connect(gain);
        gain.connect(trackGains[7]);

        attachCleanup(osc, nodes);
        osc.start(time);
        osc.stop(time + 0.32);
      }

      function triggerVoice(track, time, velocity) {
        if (!audioReady || !audioCtx) return;
        if (state.mutes[track] || state.volumes[track] <= 0.0001) return;

        try {
          switch (track) {
            case 0: playKick(time, velocity); break;
            case 1: playSnare(time, velocity); break;
            case 2: playClosedHat(time, velocity); break;
            case 3: playOpenHat(time, velocity); break;
            case 4: playClap(time, velocity); break;
            case 5: playLowTom(time, velocity); break;
            case 6: playHighTom(time, velocity); break;
            case 7: playCowbell(time, velocity); break;
            default: break;
          }
        } catch (_) {
          // Ignore synthesis edge cases; never expose errors to console.
        }
      }

      /* Scheduler */
      let playing = false;
      let schedulerTimer = null;
      let nextStepIndex = 0;
      let nextNominalTime = null;
      let visualGeneration = 0;
      let currentPlayhead = -1;

      const LOOKAHEAD = 0.10;
      const START_DELAY = 0.12;
      const SCHED_INTERVAL = 20;

      function startPlayback() {
        if (playing) return;

        const ac = ensureAudio();
        if (!ac) return;

        if (ac.state === 'suspended') {
          ac.resume().catch(() => {});
        }

        playing = true;
        nextStepIndex = 0;
        nextNominalTime = null;
        visualGeneration++;
        updateTransportUI();
        scheduleLoop();
      }

      function stopPlayback() {
        if (!playing) return;

        playing = false;
        nextNominalTime = null;
        visualGeneration++;

        if (schedulerTimer !== null) {
          clearTimeout(schedulerTimer);
          schedulerTimer = null;
        }

        setPlayhead(-1);
        updateTransportUI();
      }

      function togglePlay() {
        if (playing) stopPlayback();
        else startPlayback();
      }

      function scheduleLoop() {
        if (!playing) return;
        schedule();
        schedulerTimer = setTimeout(scheduleLoop, SCHED_INTERVAL);
      }

      function schedule() {
        if (!playing) return;
        if (!audioCtx || audioCtx.state !== 'running') return;

        const ac = audioCtx;
        const now = ac.currentTime;

        if (nextNominalTime === null) {
          nextNominalTime = now + START_DELAY;
        }

        let stepDur = 60 / Math.max(40, Math.min(240, state.tempo)) / 4;
        if (!Number.isFinite(stepDur) || stepDur <= 0) stepDur = 0.1;

        // If the browser timer is starved, catch up to the current grid instead of bursting old notes.
        if (nextNominalTime < now - 0.25) {
          const skipped = Math.max(0, Math.ceil((now - 0.25 - nextNominalTime) / stepDur));
          nextStepIndex += skipped;
          nextNominalTime += skipped * stepDur;
        }

        while (nextNominalTime < now + LOOKAHEAD) {
          const step = ((nextStepIndex % STEPS) + STEPS) % STEPS;
          const swingDelay = (step % 2 === 1)
            ? (state.swing / 100) * (stepDur / 3)
            : 0;

          const intendedTime = nextNominalTime + swingDelay;

          if (intendedTime >= now - 0.02) {
            const noteTime = Math.max(intendedTime, now + 0.001);
            scheduleNote(step, noteTime);
            scheduleVisualPlayhead(step, noteTime);
          }

          nextStepIndex++;
          nextNominalTime += stepDur;
        }
      }

      function scheduleNote(step, time) {
        for (let track = 0; track < 8; track++) {
          if (!state.pattern[track][step] || state.mutes[track] || state.volumes[track] <= 0.0001) {
            continue;
          }
          triggerVoice(track, time, 1);
        }
      }

      function scheduleVisualPlayhead(step, time) {
        if (!audioCtx) return;
        const delay = Math.max(0, (time - audioCtx.currentTime) * 1000);
        const generation = visualGeneration;

        setTimeout(() => {
          if (playing && generation === visualGeneration) {
            setPlayhead(step);
          }
        }, delay);
      }

      function setPlayhead(step) {
        if (step === currentPlayhead) return;

        const oldStep = currentPlayhead;
        currentPlayhead = step;

        if (seq) seq.dataset.playhead = String(step);

        if (oldStep >= 0) {
          const oldGroup = Math.floor(oldStep / 4);
          for (let track = 0; track < 8; track++) {
            const group = groupElements[track] && groupElements[track][oldGroup];
            if (group) group.classList.remove('is-current');

            const btn = stepButtons[track] && stepButtons[track][oldStep];
            if (btn) btn.classList.remove('is-current');
          }
        }

        if (step >= 0) {
          const newGroup = Math.floor(step / 4);
          for (let track = 0; track < 8; track++) {
            const group = groupElements[track] && groupElements[track][newGroup];
            if (group) group.classList.add('is-current');

            const btn = stepButtons[track] && stepButtons[track][step];
            if (!btn) continue;

            btn.classList.add('is-current');

            if (state.pattern[track][step] && !state.mutes[track] && state.volumes[track] > 0.0001) {
              btn.classList.add('hit');
              setTimeout(() => {
                btn.classList.remove('hit');
              }, 240);
            }
          }
        }
      }

      /* Visualizer */
      let visualizerData = null;

      function resizeCanvas() {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = Math.max(1, Math.floor(rect.width * dpr));
        const h = Math.max(1, Math.floor(rect.height * dpr));

        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
      }

      function drawVisualizer() {
        requestAnimationFrame(drawVisualizer);

        if (!canvas || !vizCtx) return;

        const w = canvas.width;
        const h = canvas.height;

        vizCtx.clearRect(0, 0, w, h);
        vizCtx.fillStyle = '#05070a';
        vizCtx.fillRect(0, 0, w, h);

        vizCtx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        vizCtx.fillRect(0, h - 1, w, 1);

        if (!analyser) {
          vizCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          vizCtx.lineWidth = Math.max(1, Math.floor(h / 80));
          vizCtx.beginPath();
          vizCtx.moveTo(0, h * 0.5);
          vizCtx.lineTo(w, h * 0.5);
          vizCtx.stroke();
          return;
        }

        const binCount = analyser.frequencyBinCount;
        if (!visualizerData || visualizerData.length !== binCount) {
          visualizerData = new Uint8Array(binCount);
        }

        analyser.getByteFrequencyData(visualizerData);

        const bars = 76;
        const barW = w / bars;
        const nyquist = audioCtx && audioCtx.sampleRate ? audioCtx.sampleRate / 2 : 20000;
        const binWidth = nyquist / binCount;
        const minHz = 20;

        for (let b = 0; b < bars; b++) {
          const t = (b + 0.5) / bars;
          const freq = minHz * Math.pow(Math.max(1, nyquist / minHz), t);
          const idx = Math.min(binCount - 1, Math.max(0, Math.floor(freq / Math.max(1, binWidth))));
          const raw = visualizerData[idx] / 255;
          const level = Math.pow(raw, 0.78);
          const barH = Math.max(2, level * (h - 4));
          const x = b * barW;
          const hue = 190 + b * 1.7;

          const grd = vizCtx.createLinearGradient(0, h - barH, 0, h);
          grd.addColorStop(0, 'hsla(' + (hue + 40) + ', 90%, 62%, 0.10)');
          grd.addColorStop(1, 'hsla(' + hue + ', 92%, 65%, 0.92)');

          vizCtx.fillStyle = grd;
          vizCtx.fillRect(x + 1, h - barH, Math.max(1, barW - 2), barH);
        }
      }

      /* Initial wiring */
      buildSequencer();
      for (let t = 0; t < 8; t++) applyTrackVisual(t);
      updateReadouts();
      resizeCanvas();
      requestAnimationFrame(drawVisualizer);

      if (seq) {
        seq.addEventListener('click', (event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;

          const muteButton = target.closest('button[data-mute]');
          if (muteButton) {
            toggleMute(Number(muteButton.dataset.mute));
            return;
          }

          const stepButton = target.closest('button[data-step]');
          if (stepButton) {
            const track = Number(stepButton.dataset.track);
            const step = Number(stepButton.dataset.step);
            toggleStep(track, step);
            return;
          }
        });

        seq.addEventListener('input', (event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          const volumeInput = target.closest('input[data-volume]');
          if (volumeInput) handleVolumeInput(volumeInput);
        });

        seq.addEventListener('change', (event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          const volumeInput = target.closest('input[data-volume]');
          if (volumeInput) handleVolumeInput(volumeInput);
        });
      }

      if (playBtn) {
        playBtn.addEventListener('click', () => {
          ensureAudio();
          togglePlay();
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          setPattern(makeEmptyPattern());
        });
      }

      if (demoBtn) {
        demoBtn.addEventListener('click', () => {
          setPattern(makeDemoPattern());
        });
      }

      if (randomBtn) {
        randomBtn.addEventListener('click', () => {
          setPattern(makeRandomPattern());
        });
      }

      if (tempoInput) {
        tempoInput.addEventListener('input', () => setTempo(tempoInput.value));
        tempoInput.addEventListener('change', () => setTempo(tempoInput.value));
      }

      if (swingInput) {
        swingInput.addEventListener('input', () => setSwing(swingInput.value));
        swingInput.addEventListener('change', () => setSwing(swingInput.value));
      }

      document.addEventListener('keydown', (event) => {
        if (event.code !== 'Space' && event.key !== ' ') return;
        if (event.repeat) return;

        const target = event.target;

        if (target === playBtn) {
          return;
        }

        const tagName = target && target.tagName ? String(target.tagName).toLowerCase() : '';
        if (tagName === 'input') {
          const inputType = target.getAttribute && target.getAttribute('type') ? String(target.getAttribute('type')).toLowerCase() : '';
          if (inputType !== 'range' && inputType !== 'number') return;
        }

        if (tagName === 'textarea' || (target && target.isContentEditable)) return;

        event.preventDefault();
        ensureAudio();
        togglePlay();
      }, false);

      // Create/resume the audio graph on first user interaction, if not already active.
      window.addEventListener('pointerdown', () => {
        ensureAudio();
      }, { once: true, passive: true });

      window.addEventListener('keydown', () => {
        ensureAudio();
      }, { once: true, passive: true });

      window.addEventListener('resize', resizeCanvas);
      window.addEventListener('beforeunload', saveState);
    })();
  </script>
</body>
</html>
```