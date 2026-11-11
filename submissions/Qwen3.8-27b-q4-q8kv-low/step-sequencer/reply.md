```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pulse — Drum Machine</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0a0a0f;
  --panel: #14141e;
  --panel-border: #2a2a3a;
  --step-off: #1a1a28;
  --step-off-border: #2a2a3a;
  --step-on: #ff6b35;
  --step-on-glow: rgba(255, 107, 53, 0.5);
  --playhead: #00e5ff;
  --playhead-glow: rgba(0, 229, 255, 0.4);
  --text: #e0e0e8;
  --text-dim: #6a6a7a;
  --accent: #ff6b35;
  --accent2: #00e5ff;
  --knob-bg: #1e1e2e;
  --slider-track: #2a2a3a;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  overflow-x: hidden;
}

h1 {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app {
  width: 100%;
  max-width: 1100px;
  background: var(--panel);
  border: 1px solid var(--panel-border);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
}

.transport {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

#play {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid var(--panel-border);
  background: var(--knob-bg);
  color: var(--text);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

#play:hover { border-color: var(--accent); transform: scale(1.05); }
#play:active { transform: scale(0.95); }
#play.playing {
  border-color: var(--accent);
  background: var(--accent);
  color: #000;
  box-shadow: 0 0 20px var(--step-on-glow), 0 4px 12px rgba(0,0,0,0.3);
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--panel-border);
  background: var(--knob-bg);
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn:hover { border-color: var(--accent); background: #252538; }
.btn:active { transform: scale(0.96); }

.slider-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-group label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-dim);
  min-width: 48px;
}

.slider-group .val {
  font-size: 0.8rem;
  font-weight: 700;
  min-width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100px;
  height: 4px;
  background: var(--slider-track);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--text);
  border: 2px solid var(--panel-border);
  cursor: pointer;
  transition: border-color 0.15s;
}

input[type="range"]::-webkit-slider-thumb:hover {
  border-color: var(--accent);
}

#tempo { width: 120px; }
#swing { width: 100px; }

.sequencer-area {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  align-items: start;
}

.track-labels {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.track-label {
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.track-label.muted { color: #444; text-decoration: line-through; }

.steps-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-row {
  display: grid;
  grid-template-columns: repeat(16, 1fr);
  gap: 4px;
}

.step-row .group-sep {
  /* visual separator between groups of 4 */
}

.step-btn {
  width: 100%;
  height: 36px;
  border-radius: 6px;
  border: 1px solid var(--step-off-border);
  background: var(--step-off);
  cursor: pointer;
  transition: all 0.1s ease;
  position: relative;
  overflow: hidden;
}

.step-btn:hover {
  border-color: #4a4a5a;
  background: #22223a;
}

.step-btn:active {
  transform: scale(0.92);
}

.step-btn[aria-pressed="true"] {
  background: var(--step-on);
  border-color: var(--step-on);
  box-shadow: 0 0 12px var(--step-on-glow), inset 0 1px 0 rgba(255,255,255,0.2);
}

.step-btn[aria-pressed="true"]:active {
  box-shadow: 0 0 24px var(--step-on-glow);
}

.step-btn.playhead {
  border-color: var(--playhead) !important;
  box-shadow: 0 0 16px var(--playhead-glow), inset 0 0 8px var(--playhead-glow) !important;
}

.step-btn.group-gap {
  margin-right: 8px;
}

/* Group separators - add extra margin after steps 3, 7, 11 */
.step-row .step-btn[data-step="3"],
.step-row .step-btn[data-step="7"],
.step-row .step-btn[data-step="11"] {
  margin-right: 8px;
}

.mixer-row {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  height: 28px;
  align-items: center;
}

.mute-btn {
  width: 28px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid var(--panel-border);
  background: var(--knob-bg);
  color: var(--text-dim);
  font-size: 0.6rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.mute-btn:hover { border-color: var(--accent); }
.mute-btn[aria-pressed="true"] {
  background: #ff3333;
  border-color: #ff3333;
  color: #fff;
  box-shadow: 0 0 8px rgba(255,51,51,0.4);
}

.vol-slider {
  width: 60px;
  height: 3px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--slider-track);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.vol-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--text);
  border: 1px solid var(--panel-border);
  cursor: pointer;
}

.visualizer-section {
  margin-top: 20px;
  padding: 12px;
  background: #0e0e16;
  border-radius: 10px;
  border: 1px solid var(--panel-border);
}

#visualizer {
  width: 100%;
  height: 60px;
  display: block;
  border-radius: 6px;
}

.presets {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

@media (max-width: 900px) {
  .sequencer-area {
    grid-template-columns: 80px 1fr;
  }
  .track-label { font-size: 0.6rem; padding: 0 6px; }
  .step-btn { height: 30px; }
}
</style>
</head>
<body>
<h1>Pulse</h1>
<div class="app">
  <div class="transport">
    <button id="play" title="Play/Stop (Space)">&#9654;</button>
    <div class="slider-group">
      <label>Tempo</label>
      <input type="range" id="tempo" min="40" max="240" value="120" step="1">
      <span class="val" id="tempo-val">120</span>
    </div>
    <div class="slider-group">
      <label>Swing</label>
      <input type="range" id="swing" min="0" max="100" value="0" step="1">
      <span class="val" id="swing-val">0</span>
    </div>
    <button class="btn" id="clear">Clear</button>
    <button class="btn" id="randomize">Random</button>
    <div class="presets">
      <button class="btn" data-preset="house">House</button>
      <button class="btn" data-preset="break">Break</button>
      <button class="btn" data-preset="techno">Techno</button>
    </div>
  </div>

  <div class="sequencer-area">
    <div class="track-labels" id="track-labels"></div>
    <div class="steps-grid" id="sequencer" data-playhead="-1"></div>
  </div>

  <div class="visualizer-section">
    <canvas id="visualizer"></canvas>
  </div>
</div>

<script>
(function() {
  'use strict';

  const TRACKS = ['Kick', 'Snare', 'Closed Hat', 'Open Hat', 'Clap', 'Low Tom', 'High Tom', 'Cowbell'];
  const NUM_TRACKS = 8;
  const NUM_STEPS = 16;
  const STORAGE_KEY = 'pulse-drum-machine-v1';

  // State
  let pattern = Array.from({length: NUM_TRACKS}, () => Array(NUM_STEPS).fill(false));
  let tempo = 120;
  let swing = 0;
  let mutes = Array(NUM_TRACKS).fill(false);
  let volumes = Array(NUM_TRACKS).fill(0.8);

  // Audio
  let audioCtx = null;
  let masterGain = null;
  let analyser = null;
  let noiseBuffer = null;
  let trackGains = [];

  // Scheduler
  let isPlaying = false;
  let currentStep = 0;
  let barStartTime = 0;
  let schedulerTimer = null;
  const LOOKAHEAD = 0.1; // 100ms
  const SCHEDULER_INTERVAL = 25; // ms

  // Playhead tracking
  let scheduledNotes = []; // {time, step}

  // DOM
  const sequencerEl = document.getElementById('sequencer');
  const playBtn = document.getElementById('play');
  const tempoInput = document.getElementById('tempo');
  const swingInput = document.getElementById('swing');
  const tempoVal = document.getElementById('tempo-val');
  const swingVal = document.getElementById('swing-val');
  const clearBtn = document.getElementById('clear');
  const randomizeBtn = document.getElementById('randomize');
  const trackLabelsEl = document.getElementById('track-labels');
  const visCanvas = document.getElementById('visualizer');
  const visCtx = visCanvas.getContext('2d');

  // Build UI
  function buildUI() {
    // Track labels
    TRACKS.forEach((name, i) => {
      const label = document.createElement('div');
      label.className = 'track-label';
      label.textContent = name;
      label.dataset.track = i;
      trackLabelsEl.appendChild(label);
    });

    // Steps
    for (let t = 0; t < NUM_TRACKS; t++) {
      const row = document.createElement('div');
      row.className = 'step-row';
      for (let s = 0; s < NUM_STEPS; s++) {
        const btn = document.createElement('button');
        btn.className = 'step-btn';
        btn.dataset.track = t;
        btn.dataset.step = s;
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', () => toggleStep(t, s));
        row.appendChild(btn);
      }
      sequencerEl.appendChild(row);

      // Mixer row
      const mixer = document.createElement('div');
      mixer.className = 'mixer-row';
      const muteBtn = document.createElement('button');
      muteBtn.className = 'mute-btn';
      muteBtn.dataset.mute = t;
      muteBtn.setAttribute('aria-pressed', 'false');
      muteBtn.textContent = 'M';
      muteBtn.addEventListener('click', () => toggleMute(t));
      mixer.appendChild(muteBtn);

      const volSlider = document.createElement('input');
      volSlider.type = 'range';
      volSlider.className = 'vol-slider';
      volSlider.dataset.volume = t;
      volSlider.min = '0';
      volSlider.max = '100';
      volSlider.value = Math.round(volumes[t] * 100);
      volSlider.addEventListener('input', () => {
        volumes[t] = parseInt(volSlider.value) / 100;
        if (trackGains[t]) trackGains[t].gain.value = volumes[t];
        saveState();
      });
      mixer.appendChild(volSlider);
      sequencerEl.appendChild(mixer);
    }
  }

  function toggleStep(t, s) {
    pattern[t][s] = !pattern[t][s];
    updateStepUI(t, s);
    saveState();
  }

  function updateStepUI(t, s) {
    const btn = sequencerEl.querySelector(`[data-track="${t}"][data-step="${s}"]`);
    if (btn) btn.setAttribute('aria-pressed', pattern[t][s] ? 'true' : 'false');
  }

  function toggleMute(t) {
    mutes[t] = !mutes[t];
    const btn = sequencerEl.querySelector(`[data-mute="${t}"]`);
    if (btn) btn.setAttribute('aria-pressed', mutes[t] ? 'true' : 'false');
    const label = trackLabelsEl.children[t];
    if (label) label.classList.toggle('muted', mutes[t]);
    saveState();
  }

  // Audio Context initialization
  function initAudio() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return;
    }
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.85;
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    masterGain.connect(analyser);
    analyser.connect(audioCtx.destination);

    // Track gains
    for (let i = 0; i < NUM_TRACKS; i++) {
      const g = audioCtx.createGain();
      g.gain.value = volumes[i];
      g.connect(masterGain);
      trackGains.push(g);
    }

    // Noise buffer
    const bufferSize = audioCtx.sampleRate * 2;
    noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  // Synthesis functions
  function playKick(when, dest) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, when);
    osc.frequency.exponentialRampToValueAtTime(40, when + 0.12);
    gain.gain.setValueAtTime(1.0, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.4);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(when);
    osc.stop(when + 0.4);

    // Click transient
    const click = audioCtx.createOscillator();
    const clickGain = audioCtx.createGain();
    click.type = 'sine';
    click.frequency.setValueAtTime(600, when);
    click.frequency.exponentialRampToValueAtTime(100, when + 0.02);
    clickGain.gain.setValueAtTime(0.5, when);
    clickGain.gain.exponentialRampToValueAtTime(0.001, when + 0.02);
    click.connect(clickGain);
    clickGain.connect(dest);
    click.start(when);
    click.stop(when + 0.02);
  }

  function playSnare(when, dest) {
    // Noise component
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1500, when);
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.7, when);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, when + 0.15);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(dest);
    noise.start(when);
    noise.stop(when + 0.15);

    // Tonal component
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, when);
    osc.frequency.exponentialRampToValueAtTime(150, when + 0.08);
    oscGain.gain.setValueAtTime(0.6, when);
    oscGain.gain.exponentialRampToValueAtTime(0.001, when + 0.08);
    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(when);
    osc.stop(when + 0.08);
  }

  function playClosedHat(when, dest) {
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, when);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.4, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.05);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(when);
    noise.stop(when + 0.05);
  }

  function playOpenHat(when, dest) {
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6000, when);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.35, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.3);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(when);
    noise.stop(when + 0.3);
  }

  function playClap(when, dest) {
    // Multiple short bursts
    for (let i = 0; i < 3; i++) {
      const noise = audioCtx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1500 + i * 300, when);
      filter.Q.setValueAtTime(2, when);
      const gain = audioCtx.createGain();
      const t = when + i * 0.005;
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      noise.start(t);
      noise.stop(t + 0.02);
    }
    // Tail
    const tail = audioCtx.createBufferSource();
    tail.buffer = noiseBuffer;
    const tailFilter = audioCtx.createBiquadFilter();
    tailFilter.type = 'bandpass';
    tailFilter.frequency.setValueAtTime(1200, when);
    tailFilter.Q.setValueAtTime(1.5, when);
    const tailGain = audioCtx.createGain();
    tailGain.gain.setValueAtTime(0.3, when + 0.015);
    tailGain.gain.exponentialRampToValueAtTime(0.001, when + 0.15);
    tail.connect(tailFilter);
    tailFilter.connect(tailGain);
    tailGain.connect(dest);
    tail.start(when + 0.015);
    tail.stop(when + 0.15);
  }

  function playLowTom(when, dest) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, when);
    osc.frequency.exponentialRampToValueAtTime(60, when + 0.2);
    gain.gain.setValueAtTime(0.8, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.3);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(when);
    osc.stop(when + 0.3);
  }

  function playHighTom(when, dest) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, when);
    osc.frequency.exponentialRampToValueAtTime(100, when + 0.15);
    gain.gain.setValueAtTime(0.7, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.2);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(when);
    osc.stop(when + 0.2);
  }

  function playCowbell(when, dest) {
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(540, when);
    osc2.frequency.setValueAtTime(810, when);
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, when);
    filter.Q.setValueAtTime(3, when);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.4, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.25);
    const mix = audioCtx.createGain();
    mix.gain.value = 0.5;
    osc1.connect(mix);
    osc2.connect(mix);
    mix.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc1.start(when);
    osc1.stop(when + 0.25);
    osc2.start(when);
    osc2.stop(when + 0.25);
  }

  const playFunctions = [playKick, playSnare, playClosedHat, playOpenHat, playClap, playLowTom, playHighTom, playCowbell];

  function getStepDuration() {
    return (60 / tempo) / 4;
  }

  function getSwingDelay() {
    return (swing / 100) * (1 / 3) * getStepDuration();
  }

  function getStepTime(step) {
    const sd = getStepDuration();
    const swingD = getSwingDelay();
    let t = barStartTime + step * sd;
    if (step % 2 === 1) {
      t += swingD;
    }
    return t;
  }

  function scheduleStep(step, when) {
    for (let t = 0; t < NUM_TRACKS; t++) {
      if (pattern[t][step] && !mutes[t]) {
        playFunctions[t](when, trackGains[t]);
      }
    }
    scheduledNotes.push({ time: when, step: step });
  }

  function scheduler() {
    while (getStepTime(currentStep) < audioCtx.currentTime + LOOKAHEAD) {
      const when = getStepTime(currentStep);
      if (when >= audioCtx.currentTime - 0.001) {
        scheduleStep(currentStep, when);
      }
      currentStep++;
      if (currentStep >= NUM_STEPS) {
        currentStep = 0;
        barStartTime += NUM_STEPS * getStepDuration();
      }
    }
  }

  function startPlayback() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    isPlaying = true;
    currentStep = 0;
    barStartTime = audioCtx.currentTime + 0.05;
    scheduledNotes = [];
    playBtn.classList.add('playing');
    playBtn.innerHTML = '&#9632;';

    schedulerTimer = setInterval(scheduler, SCHEDULER_INTERVAL);
    scheduler();
    updatePlayhead();
  }

  function stopPlayback() {
    isPlaying = false;
    if (schedulerTimer) {
      clearInterval(schedulerTimer);
      schedulerTimer = null;
    }
    playBtn.classList.remove('playing');
    playBtn.innerHTML = '&#9654;';
    sequencerEl.dataset.playhead = '-1';
    clearPlayheadVisual();
  }

  function togglePlayback() {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }

  // Playhead visual update
  let currentPlayheadStep = -1;

  function updatePlayhead() {
    if (!isPlaying || !audioCtx) {
      if (currentPlayheadStep !== -1) {
        sequencerEl.dataset.playhead = '-1';
        clearPlayheadVisual();
        currentPlayheadStep = -1;
      }
      return;
    }

    const now = audioCtx.currentTime;
    let playheadStep = -1;

    for (let i = scheduledNotes.length - 1; i >= 0; i--) {
      if (scheduledNotes[i].time <= now) {
        playheadStep = scheduledNotes[i].step;
        break;
      }
    }

    // Clean up old notes
    while (scheduledNotes.length > 0 && scheduledNotes[0].time < now - 1) {
      scheduledNotes.shift();
    }

    if (playheadStep !== currentPlayheadStep) {
      currentPlayheadStep = playheadStep;
      sequencerEl.dataset.playhead = playheadStep;
      updatePlayheadVisual();
    }
  }

  function updatePlayheadVisual() {
    clearPlayheadVisual();
    if (currentPlayheadStep < 0) return;
    for (let t = 0; t < NUM_TRACKS; t++) {
      const btn = sequencerEl.querySelector(`[data-track="${t}"][data-step="${currentPlayheadStep}"]`);
      if (btn) btn.classList.add('playhead');
    }
  }

  function clearPlayheadVisual() {
    sequencerEl.querySelectorAll('.playhead').forEach(el => el.classList.remove('playhead'));
  }

  // Visualizer
  function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);

    const w = visCanvas.width = visCanvas.offsetWidth;
    const h = visCanvas.height = visCanvas.offsetHeight;

    visCtx.clearRect(0, 0, w, h);

    if (!analyser) {
      // Draw idle line
      visCtx.strokeStyle = '#2a2a3a';
      visCtx.lineWidth = 1;
      visCtx.beginPath();
      visCtx.moveTo(0, h / 2);
      visCtx.lineTo(w, h / 2);
      visCtx.stroke();
      return;
    }

    const bufLen = analyser.frequencyBinCount;
    const data = new Uint8Array(bufLen);
    analyser.getByteFrequencyData(data);

    const barWidth = w / bufLen;
    const gradient = visCtx.createLinearGradient(0, h, 0, 0);
    gradient.addColorStop(0, '#ff6b35');
    gradient.addColorStop(0.5, '#00e5ff');
    gradient.addColorStop(1, '#a855f7');

    for (let i = 0; i < bufLen; i++) {
      const val = data[i] / 255;
      const barH = val * h;
      visCtx.fillStyle = gradient;
      visCtx.fillRect(i * barWidth, h - barH, barWidth - 1, barH);
    }
  }

  // Persistence
  function saveState() {
    try {
      const state = { pattern, tempo, swing, mutes, volumes };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const state = JSON.parse(raw);
      if (state.pattern && state.pattern.length === NUM_TRACKS) pattern = state.pattern;
      if (typeof state.tempo === 'number') tempo = state.tempo;
      if (typeof state.swing === 'number') swing = state.swing;
      if (Array.isArray(state.mutes) && state.mutes.length === NUM_TRACKS) mutes = state.mutes;
      if (Array.isArray(state.volumes) && state.volumes.length === NUM_TRACKS) volumes = state.volumes;
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadDemoPattern() {
    pattern = [
      [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], // Kick
      [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], // Snare
      [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1], // Closed Hat
      [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0], // Open Hat
      [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], // Clap
      [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1], // Low Tom
      [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0], // High Tom
      [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], // Cowbell
    ];
  }

  function applyStateToUI() {
    tempoInput.value = tempo;
    tempoVal.textContent = tempo;
    swingInput.value = swing;
    swingVal.textContent = swing;

    for (let t = 0; t < NUM_TRACKS; t++) {
      for (let s = 0; s < NUM_STEPS; s++) {
        updateStepUI(t, s);
      }
      const muteBtn = sequencerEl.querySelector(`[data-mute="${t}"]`);
      if (muteBtn) muteBtn.setAttribute('aria-pressed', mutes[t] ? 'true' : 'false');
      const volSlider = sequencerEl.querySelector(`[data-volume="${t}"]`);
      if (volSlider) volSlider.value = Math.round(volumes[t] * 100);
      const label = trackLabelsEl.children[t];
      if (label) label.classList.toggle('muted', mutes[t]);
    }
  }

  // Presets
  const presets = {
    house: [
      [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
      [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
      [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
      [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0],
      [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,1,0,0],
      [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    ],
    break: [
      [1,0,0,0, 0,0,0,0, 1,0,0,1, 0,0,0,0],
      [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
      [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
      [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,1],
      [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,1,0],
      [0,0,1,0, 0,0,0,0, 0,1,0,0, 0,0,0,1],
      [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
    ],
    techno: [
      [1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1],
      [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
      [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
      [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      [0,0,0,0, 0,0,0,0, 0,0,0,1, 0,0,0,0],
      [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
      [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0],
    ]
  };

  // Event handlers
  playBtn.addEventListener('click', togglePlayback);

  tempoInput.addEventListener('input', () => {
    tempo = parseInt(tempoInput.value);
    tempoVal.textContent = tempo;
    saveState();
  });

  swingInput.addEventListener('input', () => {
    swing = parseInt(swingInput.value);
    swingVal.textContent = swing;
    saveState();
  });

  clearBtn.addEventListener('click', () => {
    for (let t = 0; t < NUM_TRACKS; t++) {
      for (let s = 0; s < NUM_STEPS; s++) {
        pattern[t][s] = false;
        updateStepUI(t, s);
      }
    }
    saveState();
  });

  randomizeBtn.addEventListener('click', () => {
    for (let t = 0; t < NUM_TRACKS; t++) {
      for (let s = 0; s < NUM_STEPS; s++) {
        const prob = t === 0 ? 0.3 : t === 1 ? 0.2 : t === 2 ? 0.4 : t === 3 ? 0.15 : 0.1;
        pattern[t][s] = Math.random() < prob;
        updateStepUI(t, s);
      }
    }
    saveState();
  });

  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.preset;
      if (presets[name]) {
        pattern = presets[name].map(row => [...row]);
        for (let t = 0; t < NUM_TRACKS; t++) {
          for (let s = 0; s < NUM_STEPS; s++) {
            updateStepUI(t, s);
          }
        }
        saveState();
      }
    });
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      const tag = document.activeElement ? document.activeElement.tagName : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      togglePlayback();
    }
  });

  // Init
  buildUI();
  const hasState = loadState();
  if (!hasState) {
    loadDemoPattern();
  }
  applyStateToUI();

  // Initialize audio on first interaction
  function onFirstInteraction() {
    initAudio();
    if (trackGains.length) {
      for (let i = 0; i < NUM_TRACKS; i++) {
        trackGains[i].gain.value = volumes[i];
      }
    }
    document.removeEventListener('click', onFirstInteraction);
    document.removeEventListener('keydown', onFirstInteraction);
  }
  document.addEventListener('click', onFirstInteraction, { once: true });
  document.addEventListener('keydown', onFirstInteraction, { once: true });

  // Start visualizer
  drawVisualizer();

  // Playhead rAF loop
  function playheadLoop() {
    requestAnimationFrame(playheadLoop);
    updatePlayhead();
  }
  playheadLoop();

})();
</script>
</body>
</html>
```