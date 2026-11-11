# Task: Pulse — a synthesized drum machine & step sequencer

Build playable 16-step drum machine...

Deliver one file: index.html with all HTML, CSS and JS inline.

No external resources.

Requirements: 8 tracks × 16 steps. Tracks order: Kick, Snare, Closed Hat, Open Hat, Clap, Low Tom, High Tom, Cowbell.

All voices synthesized with Web Audio.

Step toggle button with data-track 0-7, data-step 0-15, aria-pressed.

Play button #play. Space toggles.

Tempo input #tempo range 40-240 default 120.

Swing input #swing 0-100 default 0.

Mute toggles button data-mute="0".."7" aria-pressed true when muted.

Volume sliders input data-volume="0".."7".

Element #sequencer with data-playhead attribute step 0-15 or -1 when stopped.

Timing sample-accurate using lookahead scheduler. Use AudioContext clock.

Tempo and swing changes while playing no gaps.

Playhead highlights step currently being heard.

Visualizer real-time spectrum/waveform driven by AnalyserNode.

Clear button.

State persists in localStorage.

Polish.

Grader contract: 128 step toggles buttons with data-track and data-step, aria-pressed.

#play button toggles play/stop.

#tempo input.

#swing input.

Mute toggles.

Volume sliders.

#sequencer data-playhead.

Timing verified by recording every start(when) call on audio source nodes (OscillatorNode, AudioBufferSourceNode, ConstantSourceNode). Each triggered step starts its voice's source node(s) with when = exact intended note time. Never start() anything that isn't a note: no continuously running/looping sources, and no source starts for inactive or muted steps. Use one AudioContext, created or resumed on first user interaction.

We must implement scheduler.

Implementation plan:

Single HTML file.

Structure:

<div id="app">
<header> Pulse ...</header>
<main>
 <section id="sequencer" data-playhead="-1">
  <div class="tracks">...</div>
  <div class="steps grid">...</div>
 </section>
 <aside id="controls">
  <button id="play">...</button>
  <input id="tempo" type="range" min="40" max="240" value="120">
  <input id="swing" type="range" min="0" max="100" value="0">
  ...
 </aside>
 <canvas id="viz"></canvas>
</main>

We need 8 tracks each with name, mute button, volume slider, and 16 step buttons.

Step buttons: 128 buttons.

We need visual separation groups of 4 steps.

Playhead highlight: maybe CSS using data-playhead attribute on #sequencer, and step buttons have data-step. Use CSS selector #sequencer[data-playhead="3"] .step[data-step="3"] { ... }

Mute button aria-pressed true when muted.

Volume slider data-volume.

Persistence: localStorage key 'pulse_state'.

Synthesizer:

We need 8 voices synthesized.

Kick: sine oscillator with exponential frequency decay from ~150Hz to ~40Hz, fast decay envelope on gain, maybe slight distortion. Use oscillator + gain.

Snare: noise burst + high frequency oscillator for snap. Use buffer of white noise with bandpass filter, envelope.

Closed Hat: noise burst with highpass filter, short decay.

Open Hat: noise longer decay, highpass.

Clap: multiple noise bursts delayed ~ few ms, or multiple oscillators.

Low Tom: sine/triangle with pitch decay.

High Tom: higher pitch.

Cowbell: combination of sine oscillators with inharmonic partials, metallic.

We need to ensure each note start creates source nodes and starts at exact when.

No continuous sources. So each trigger creates new oscillator nodes, connects to master gain, then stops.

We must avoid starting source nodes for muted tracks or inactive steps.

Scheduler:

We need lookahead scheduler: schedule notes ~ 100ms ahead.

We have step sequencer 16 steps per bar. At tempo BPM, 16th note duration = 60 / BPM / 4 seconds.

Swing: every odd-numbered step (1,3,5...) delayed by (s/100)*1/3 * duration.

But note: steps are 0-15. Odd steps delayed. The delay applies to the step's timing relative to straight grid.

Implementation: compute step time offset.

We need sample-accurate: compute absolute time for each step.

Scheduler algorithm:

audioContext = new AudioContext()
isPlaying = false
currentStep = 0
nextStepTime = 0
lastScheduledStep = -1

When play starts: currentStep = 0, nextStepTime = audioContext.currentTime + 0.05 (small lookahead). Or start immediately at currentTime.

We need play always starts from step 0.

Scheduler loop: use setInterval ~ 25ms to check if nextStepTime < audioContext.currentTime + lookahead, schedule.

Better: use setInterval 25ms or requestAnimationFrame.

We schedule steps ahead. Each step we compute time for each step index.

We need to handle tempo changes while playing: we need to recompute durations on the fly.

Simpler: scheduler schedules next step based on current tempo at time of scheduling. If tempo changes, subsequent steps will use new tempo.

But we need to maintain continuity: when tempo changes, we should not jump. Using step-based scheduling with variable interval may cause drift if we just schedule next step based on previous scheduled time + duration computed at schedule time. That's fine, because duration changes will affect future steps only.

Swing also changes.

We need to compute step interval: baseDuration = 60 / bpm / 4.

For step i, if i is odd, offset = swingFraction * (1/3) * baseDuration. Actually swing delay for odd steps. The even steps remain at grid. So the time between step 0 and step 1 is baseDuration - delay? Wait typical swing: delay odd steps. So step 0 at t0, step 1 at t0 + baseDuration + delay? Hmm.

Let's think: duration of one 16th note = baseDuration. At swing s, every odd-numbered step is delayed by (s/100) * 1/3 * duration. So step 1 time = step0 time + baseDuration + delay? Or step 1 time = step0 time + baseDuration + delay? Actually delay is extra. Usually swing pushes odd beats later, so interval from even to next odd is baseDuration + delay, and from odd to next even is baseDuration - delay. That keeps average.

Alternative interpretation: each odd step's absolute time is increased by delay relative to straight grid. That would cause varying intervals. Let's adopt simple: straight grid times: t_n = n * baseDuration. With swing, t_n = n*baseDuration + (n%2===1 ? delay * floor(n/2) ? Hmm.

Better: delay accumulates? If each odd step is delayed relative to straight grid by delay, then intervals alternate.

Compute t_n = n * baseDuration + (n odd ? delay * (n+1)/2? Wait.)

Let's derive: For n even, t_n = n * baseDuration.
For n odd, t_n = n * baseDuration + delay * (n+1)/2? No.

Standard swing for 16th: offset odd steps by swing amount. If you just add delay to each odd step, the interval between step 0 and 1 is baseDuration + delay, between 1 and 2 is baseDuration - delay.

So t_n = n*baseDuration + floor(n/2)*delay ? Let's test: n=0 ->0. n=1 -> base + floor(0.5)*delay = base. No delay. Hmm.

Alternative formula: t_n = n*baseDuration + (n%2===1 ? delay : 0) * (n//2 + 1?) Let's test small.

We want t0=0
t1 = base + delay
t2 = 2*base
t3 = 3*base + delay
So pattern: even n: t_n = n*base
odd n: t_n = n*base + delay

That yields interval 0->1 = base+delay, 1->2 = base - delay, 2->3 = base+delay, etc. That's correct.

So t_n = n*base + (n%2===1 ? delay : 0)

But delay should be (s/100)*(1/3)*base.

So compute for each step index.

When scheduling, we need absolute time for each step in the loop.

We have a bar length = 16 * baseDuration. But due to swing, last step time is not exactly 16*base? Let's compute t15 = 15*base + delay (since odd). t0 next bar = 16*base. So interval from 15 to 16 = base - delay. That's fine.

Scheduler: we maintain currentStep index and nextStepTime. We need to compute next step time based on current step and tempo/swing at scheduling time.

Simpler approach: schedule steps one by one using nextStepTime calculation:

When we schedule step i at time t_i, compute time for next step i+1:

base = 60 / bpm /4
delay = swingFraction * base /3
if (i+1) %2 ===1 -> nextTime = currentTime + base + delay? Wait currentTime is t_i.

We know t_i formula: t_i = i*base + (i%2===1? delay:0) + barOffset? Hmm base changes over time.

Better to compute incrementally:

From step i to i+1:
if i is even: step i at t, step i+1 = t + base + delay
if i is odd: step i+1 = t + base - delay (since t_i includes delay)

Let's verify: i=0 even: t1 = t0 + base + delay correct.
i=1 odd: t2 = t1 + base - delay = base+delay + base - delay =2base correct.
i=2 even: t3 = t2 + base + delay =2base + base + delay =3base+delay correct.

So algorithm:

nextStepTime = currentStepTime + base + (currentStep %2 ===0 ? delay : -delay)

But if we change tempo/swing while playing, the next interval will use new values, causing slight jump? Actually it's okay because we schedule based on current values. Might cause tempo change to take effect immediately for next step.

Alternative: compute nextStepTime based on absolute step number using formula with current tempo/swing. That would cause discontinuity if tempo changes mid-bar because the time of a future step computed now vs later differs. But we schedule just a few steps ahead, so acceptable.

Implementation details:

Scheduler loop:

function scheduler() {
 while (nextStepTime < audioContext.currentTime + scheduleAheadTime) {
   scheduleStep(currentStep);
   // advance currentStep and nextStepTime
   currentStep = (currentStep +1) %16;
   // compute interval to next step
   base = 60 / currentBPM /4;
   delay = (swing/100) * base /3;
   // we already at currentStep? Wait we just scheduled step at nextStepTime. Now compute next.
   // Actually we need to compute interval from this step to next.
   // We have just scheduled step at nextStepTime for currentStep (before increment?). Let's restructure.
 }
}

Better to keep variables:

nextStepIndex
nextStepTime

Initialize on play start:
nextStepIndex =0
nextStepTime = audioContext.currentTime + 0.05

Then in scheduler loop:
while nextStepTime < audioContext.currentTime + scheduleAhead:
   scheduleStep(nextStepIndex, nextStepTime)
   // advance
   nextStepIndex = (nextStepIndex+1)%16
   // compute interval
   base = ...
   delay = ...
   // interval from current step to next:
   // if nextStepIndex is even? Wait we need interval from current step (just scheduled) to next.
   // current step index = previous nextStepIndex.
   // Let's keep prevIndex.
Simpler: keep currentStep and nextStepTime.

Pseudo:
currentStep =0
nextStepTime = now + lookahead

while nextStepTime < now + lookahead:
  scheduleStep(currentStep, nextStepTime)
  // compute time for next step
  base...
  delay...
  if currentStep %2 ===0:
    interval = base + delay
  else:
    interval = base - delay
  nextStepTime += interval
  currentStep = (currentStep+1)%16
  // if looped to 0, maybe we need to keep bar count? Not needed.

Also need playhead update: we need to update #sequencer data-playhead attribute to step currently being heard. The step currently being heard is the step whose time is <= currentAudioTime < nextStepTime. We can update in scheduler or via requestAnimationFrame.

Simpler: on each scheduler iteration, we can update playhead to currentStep when we schedule? Actually playhead should move at audio time. Using scheduler loop with setInterval 25ms, we can compute which step is active based on audioContext.currentTime.

Compute step index for current time:

We need to find the step whose time interval contains currentTime.

Since swing makes irregular intervals, we could find by iterating from last scheduled step backwards? Easier: maintain last scheduled step time and index, and in animation frame compute current step based on current time and last known step.

Alternative: just update playhead in scheduler when we schedule next step: set data-playhead to currentStep? That would be step that just started. But playhead should reflect step being heard now, which lags behind scheduled.

Simpler: use requestAnimationFrame to compute current step based on audioContext.currentTime and the nextStepTime / currentStep variables.

We can keep a variable lastScheduledStep and its time. Then in RAF, compute how many steps have passed since last scheduled step using currentTime and intervals? That gets complex with tempo changes.

Alternative: just update playhead whenever we schedule a step: set data-playhead to step just scheduled, but only if audioContext.currentTime >= scheduled time - small epsilon? Might be okay.

Better: In scheduler loop, when we schedule step at time t, we can also schedule a UI update at that time? No.

Simplify: Use requestAnimationFrame to set playhead based on the latest scheduled step whose time <= audioContext.currentTime. We can maintain an array of scheduled steps (step index, time) for upcoming steps (like next 4). Then find latest with time <= currentTime.

Since we schedule ahead only a few steps, we can store scheduledSteps queue.

Implementation:

scheduledSteps = [] // array of {step, time}

In scheduler:
while nextStepTime < now + lookahead:
  scheduledSteps.push({step: currentStep, time: nextStepTime})
  // advance
  ...

In RAF:
currentAudioTime = audioContext.currentTime
Find last scheduled step where time <= currentAudioTime. Set data-playhead to its step, else -1.

If playing stopped, set -1.

That works.

Now audio synthesis functions:

We need 8 instruments.

We'll create master gain node connected to analyser and destination.

AnalyserNode for visualizer.

For each trigger, create nodes.

Kick:
osc = new OscillatorNode(audioContext, {type:'sine', frequency:150})
gain = new GainNode(audioContext, {gain:1})
osc.connect(gain)
gain.connect(masterGain)

Schedule frequency exponential ramp: osc.frequency.setValueAtTime(150, when); osc.frequency.exponentialRampToValueAtTime(40, when+0.15)
Gain envelope: gain.gain.setValueAtTime(1, when); gain.gain.exponentialRampToValueAtTime(0.001, when+0.25)

Also maybe add slight distortion? Okay.

Snare:
Use noise buffer. Create white noise buffer once per trigger? Could create buffer on the fly.

Simpler: create AudioBuffer with white noise length 0.2s, then play via AudioBufferSourceNode with gain envelope.

But AudioBufferSourceNode start when is absolute.

We can generate noise buffer each time or reuse.

We'll create function createNoiseBuffer(duration). Could generate once per type with length 0.3s.

But we need different decay.

Alternative: use OscillatorNode for snare tone + noise.

Simplest: create BufferSource with white noise.

Implementation:

function createWhiteNoiseBuffer(lengthSec) {
  const sampleRate = audioContext.sampleRate
  const length = sampleRate * lengthSec
  const buffer = audioContext.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)
  for i... data[i]= Math.random()*2-1
  return buffer
}

But creating buffer each trigger may be heavy. Could pre-create buffers for each instrument.

We have 8 instruments, each may need noise.

Let's pre-create noise buffers: snareNoise, hatNoise, clapNoise.

Kick: oscillator.

Snare: noise buffer + oscillator for tone.

Closed Hat: noise buffer with highpass filter.

Open Hat: noise buffer with highpass filter longer.

Clap: three noise bursts with delays.

Low Tom: oscillator with frequency decay.

High Tom: oscillator.

Cowbell: multiple oscillators with inharmonic frequencies, short decay.

Implementation details for each trigger function:

function playKick(when, volume) {
  const osc = audioContext.createOscillator()
  const gain = audioContext.createGain()
  osc.type='sine'
  osc.frequency.setValueAtTime(150, when)
  osc.frequency.exponentialRampToValueAtTime(40, when+0.15)
  gain.gain.setValueAtTime(0, when)
  gain.gain.setValueAtTime(volume*1, when)
  gain.gain.exponentialRampToValueAtTime(0.001, when+0.25)
  osc.connect(gain)
  gain.connect(masterGain)
  osc.start(when)
  osc.stop(when+0.3)
}

Similarly snare:

function playSnare(when, volume) {
  // noise
  const noiseSource = audioContext.createBufferSource()
  noiseSource.buffer = snareNoiseBuffer
  const noiseFilter = audioContext.createBiquadFilter()
  noiseFilter.type='bandpass'
  noiseFilter.frequency.value=2000
  noiseFilter.Q.value=1
  const noiseGain = audioContext.createGain()
  noiseGain.gain.setValueAtTime(0, when)
  noiseGain.gain.setValueAtTime(volume*0.9, when)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, when+0.12)
  noiseSource.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(masterGain)
  noiseSource.start(when)
  // tone
  const osc = audioContext.createOscillator()
  const oscGain = audioContext.createGain()
  osc.frequency.setValueAtTime(180, when)
  oscGain.gain.setValueAtTime(0, when)
  oscGain.gain.setValueAtTime(volume*0.3, when)
  oscGain.gain.exponentialRampToValueAtTime(0.001, when+0.1)
  osc.connect(oscGain)
  oscGain.connect(masterGain)
  osc.start(when)
  osc.stop(when+0.15)
}

Closed Hat:

function playClosedHat(when, volume) {
  const source = audioContext.createBufferSource()
  source.buffer = hatNoiseBuffer
  const filter = audioContext.createBiquadFilter()
  filter.type='highpass'
  filter.frequency.value=8000
  const gain = audioContext.createGain()
  gain.gain.setValueAtTime(0, when)
  gain.gain.setValueAtTime(volume*0.7, when)
  gain.gain.exponentialRampToValueAtTime(0.001, when+0.05)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(masterGain)
  source.start(when)
}

Open Hat: similar but longer decay 0.3s, filter freq 6000.

Clap: three bursts.

function playClap(when, volume) {
  for i 0..2:
    t = when + i*0.02
    const source = ...
    gain envelope quick
}

Low Tom:
osc frequency start 120 -> decay to 60 over 0.3s
gain envelope.

High Tom: start 250 -> 120

Cowbell:
multiple oscillators at frequencies like  1300, 1800, 2500 etc with short decay.

Simplify: use oscillator with square wave and filter.

We'll implement.

Volume per track: input data-volume 0..1. Use slider 0-100.

Mute: if muted, skip trigger.

Step active: pattern matrix 8x16 boolean.

UI:

Build HTML dynamically? Could hardcode.

Better to generate via JS for brevity.

But need buttons with data-track and data-step.

We can generate HTML with loops in JS creating elements, but grader expects buttons exist at load? Could generate on load.

Simplify: static HTML with 8 rows each with 16 buttons. That's 128 buttons, manual is tedious but possible with template.

We can generate via JS at DOMContentLoaded. That should be fine as long as elements exist before grader interacts. Grader will drive page after load.

We'll generate.

CSS: make grid.

Play button #play.

Tempo input #tempo type range.

Swing input #swing.

Mute buttons: button data-mute="0"..7.

Volume sliders: input type range data-volume="0"..7.

#sequencer element.

Visualizer canvas #viz.

State persistence:

state = {
 pattern: Array(8).fill().map(()=>Array(16).fill(false)),
 tempo:120,
 swing:0,
 mutes:Array(8).fill(false),
 volumes:Array(8).fill(0.8)
}

Load from localStorage if exists.

Save on changes: debounce.

Clear button: clear pattern.

Optional presets.

Implementation steps in code:

HTML skeleton:

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Pulse Drum Machine</title>
<style>...</style>
</head>
<body>
<div id="app">...</div>
<script>...</script>
</body>
</html>

CSS: dark theme, hardware look.

JavaScript:

(() => {
  const tracks = ['Kick','Snare','Closed Hat','Open Hat','Clap','Low Tom','High Tom','Cowbell'];
  ...
})();

Implementation details:

Create AudioContext lazily on first user interaction (click play or step toggle). Use resume.

We need to record start(when) calls? Grader will intercept start calls. We must ensure we never start source nodes for muted/inactive steps. Also never start continuously running sources.

Our synthesis functions create nodes per trigger and start at when.

Make sure we don't create nodes for muted tracks.

Scheduler:

let audioCtx = null;
let masterGain = null;
let analyser = null;
let isPlaying = false;
let currentBPM = 120;
let currentSwing = 0;
let scheduleAheadTime = 0.1; // seconds
let nextStepTime = 0;
let currentStepIndex = 0;
let scheduledSteps = [];
let timerId = null;
let rafId = null;

pattern matrix.

function initAudio() {
 if (!audioCtx) {
   audioCtx = new (window.AudioContext||window.webkitAudioContext)()
   masterGain = audioCtx.createGain()
   masterGain.gain.value = 0.7
   analyser = audioCtx.createAnalyser()
   analyser.fftSize = 2048
   masterGain.connect(analyser)
   analyser.connect(audioCtx.destination)
   // precreate noise buffers
   createNoiseBuffers()
 }
}

Scheduler loop:

function schedulerLoop() {
 if (!isPlaying) return;
 const now = audioCtx.currentTime;
 while (nextStepTime < now + scheduleAheadTime) {
   scheduleStep(currentStepIndex, nextStepTime);
   // advance
   const base = 60 / currentBPM / 4;
   const delay = (currentSwing/100) * base / 3;
   let interval;
   if (currentStepIndex %2 ===0) {
     interval = base + delay;
   } else {
     interval = base - delay;
   }
   nextStepTime += interval;
   currentStepIndex = (currentStepIndex + 1) % 16;
   // if looped, continue
 }
 timerId = setTimeout(schedulerLoop, 25);
}

On play start:
initAudio()
audioCtx.resume()
isPlaying=true
currentStepIndex=0
nextStepTime = audioCtx.currentTime + 0.05
scheduledSteps = []
schedulerLoop()
updatePlayheadRAF()

On stop:
isPlaying=false
clearTimeout(timerId)
clear scheduledSteps
set data-playhead="-1"

scheduleStep(stepIdx, time):
for track 0..7:
 if pattern[track][stepIdx] and !mutes[track]:
   volume = volumes[track]
   playSound(track, time, volume)

PlaySound dispatch.

Playhead RAF:
function updatePlayhead() {
 if (!isPlaying) {
   sequencerEl.setAttribute('data-playhead','-1');
   return;
 }
 const now = audioCtx.currentTime;
 let lastStep = -1;
 let lastTime = -1;
 for (const s of scheduledSteps) {
   if (s.time <= now) {
     lastStep = s.step;
     lastTime = s.time;
   } else break;
 }
 // also check if we passed scheduled steps but not yet scheduled next? We'll rely.
 sequencerEl.setAttribute('data-playhead', lastStep);
 rafId = requestAnimationFrame(updatePlayhead);
}

When stopping, cancel raf.

Tempo and swing inputs: on input event, update currentBPM/currentSwing, save state.

Mute buttons: toggle aria-pressed, update mutes array, save.

Volume sliders: update volumes.

Step toggles: button click toggles aria-pressed, pattern matrix, save.

Clear button: clear pattern.

Visualizer:

canvas width/height.

function drawViz() {
 if (!isPlaying && !audioCtx) return;
 const bufferLength = analyser.frequencyBinCount;
 const dataArray = new Uint8Array(bufferLength);
 analyser.getByteFrequencyData(dataArray);
 // draw bars
 ctx.clearRect...
 ...
 requestAnimationFrame(drawViz)
}

Start draw on init.

Persistence:

saveState() -> localStorage.setItem('pulse_state', JSON.stringify(state))

Load on start.

Initial demo beat: if no state, load a simple pattern.

Maybe create a basic beat.

Implementation details for UI generation:

<div id="sequencer" data-playhead="-1">
 <div class="track-labels">...</div>
 <div class="grid">...</div>
</div>

Generate rows.

For each track i:
 <div class="track-row">
   <div class="track-info">
     <span class="track-name">Kick</span>
     <button data-mute="i" aria-pressed="false">Mute</button>
     <input type="range" min="0" max="100" value="80" data-volume="i">
   </div>
   <div class="steps">
     buttons
   </div>
 </div>

Step buttons: <button class="step" data-track="i" data-step="j" aria-pressed="false"></button>

Play button #play.

Tempo input #tempo type range min 40 max240 value120.

Swing input #swing type range min0 max100 value0.

Clear button #clear.

Visualizer canvas.

CSS: make dark, grid.

Playhead highlight via CSS: #sequencer[data-playhead="3"] .step[data-step="3"] { background... }

Also active step lit: .step[aria-pressed="true"] { background... }

Groups of 4 separated: use nth-child.

Implement micro-animations: when step triggers, add class 'trigger' briefly.

We can add class via JS when scheduling step, add class to button for 100ms.

Implementation: in scheduleStep, after scheduling, we can add class 'trigger' to button element, then remove after timeout.

But we need to ensure we don't cause layout thrash.

Okay.

Edge cases:

AudioContext creation: must be created or resumed on first user interaction. We'll create on first click of play or step toggle.

Space bar toggles playback unless focus in text input. So listen keydown event: if e.code==='Space' and document.activeElement tagName !== 'INPUT' and tagName !== 'TEXTAREA' then toggle play.

No external resources.

No console errors.

Ensure start() called with when parameter.

Never start source for inactive/muted steps.

Check for muted track: skip.

Check for pattern inactive: skip.

Make sure we don't create nodes for muted.

Potential issue: AudioBufferSourceNode start() must be called once. We create per trigger.

Make sure we stop oscillators after short time to free resources.

Cowbell synthesis: maybe create 3 oscillators with frequencies 1300, 1800, 2600, each with gain envelope.

Implementation details for each instrument:

Let's design functions:

playKick(when, vol)
playSnare(when, vol)
playClosedHat(when, vol)
playOpenHat(when, vol)
playClap(when, vol)
playLowTom(when, vol)
playHighTom(when, vol)
playCowbell(when, vol)

Noise buffers:

Create once:

function makeNoiseBuffer(duration) {
  const sampleRate = audioCtx.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i=0;i<length;i++) data[i]= Math.random()*2-1;
  return buffer;
}

snareNoise = makeNoiseBuffer(0.2)
hatNoise = makeNoiseBuffer(0.1)
clapNoise = makeNoiseBuffer(0.05)

Now synthesis:

playSnare:
noise source with buffer snareNoise, filter bandpass 2000, gain envelope 0.12
oscillator 180 Hz sine for body, gain envelope 0.1

playClosedHat:
source hatNoise, highpass 8000, gain envelope 0.04

playOpenHat:
source hatNoise, highpass 6000, gain envelope 0.25

playClap:
for k=0..2:
 t = when + k*0.015
 source clapNoise, highpass 4000?, gain envelope 0.03

playLowTom:
osc type sine, freq 120 -> 60 over 0.25s, gain envelope 0.3

playHighTom:
osc freq 250 -> 120 over 0.2s

playCowbell:
create 3 oscillators with frequencies  1300, 1700, 2200, each with gain envelope 0.15, maybe slight detune.

Add slight distortion? Could use WaveShaper.

Simplify.

Master gain: maybe 0.8.

Visualizer: draw bars.

State persistence: save on every change (debounce 200ms).

Clear button: clear pattern, set all false, update UI.

Presets optional.

Implementation of UI generation:

document.addEventListener('DOMContentLoaded', () => {
  buildUI();
  loadState();
  // bind events
})

Build UI:

const sequencerEl = document.getElementById('sequencer');

For each track i:
 create row div
 create track info div with name, mute button, volume slider
 create steps container div
 for j 0..15 create button

Append.

Event listeners:

step buttons: click -> toggle aria-pressed, pattern matrix update, save.

mute buttons: click -> toggle aria-pressed, mutes update.

volume sliders: input -> update volumes, save.

play button: click -> toggle.

tempo input: input -> update currentBPM, save.

swing input: input -> update currentSwing, save.

Space handler.

Now ensure data-playhead attribute updates.

Potential issues:

Scheduler loop using setTimeout: need to ensure nextStepTime advances correctly when tempo changes mid-bar. Our loop recomputes base/delay each iteration using current values. That's okay.

But we need to ensure that when we advance currentStepIndex, we compute interval based on currentStepIndex (the step just scheduled). That's correct.

Edge: when currentStepIndex wraps from 15 to 0, interval calculation for step 15 (odd) -> interval = base - delay, so nextStepTime = time of step15 + base - delay = time of step16 (which is start of next bar). Good.

Playhead: we set data-playhead to last scheduled step with time <= now. That will be step being heard. Good.

When stopped, set to -1.

Potential drift: scheduledSteps array grows indefinitely. We should prune old entries.

In updatePlayhead, we can find last step. Could prune scheduledSteps where time < now - 1 sec.

Implementation details for playhead RAF: we need to start when playing starts, stop when stopped.

Now ensure no console errors: avoid undefined variables.

Make sure AudioContext is resumed after user gesture: audioCtx.resume().

First user interaction: click play button -> initAudio.

Also step toggle may need audio context for later. Could init on first interaction.

Now ensure we never start source for muted track: we check before calling playSound.

Also never start for inactive step: we check pattern.

Make sure we don't create nodes if volume is zero? Could skip to avoid unnecessary nodes. But okay.

Now ensure we have one AudioContext: we create once.

Now ensure start(when) calls are correct: oscillator.start(when), bufferSource.start(when).

For buffer source, we need to set loop false.

Now implement visualizer draw loop: use analyser.getByteFrequencyData.

Draw bars: for i 0..N, height = data[i]...

Now CSS polish.

We need to ensure IDs match contract:

#play
#tempo
#swing
#sequencer

Mute buttons data-mute="0"..7
Volume sliders data-volume="0"..7
Step buttons data-track and data-step, aria-pressed.

Also #sequencer data-playhead attribute.

Play button toggles play/stop.

Space toggles.

Make sure play button has id="play". Good.

Tempo input id="tempo". Swing input id="swing".

Now ensure no external resources.

All inline.

Potential grader checks: recording every start(when) call on audio source nodes (OscillatorNode, AudioBufferSourceNode, ConstantSourceNode). Rules: each triggered step starts its voice's source node(s) with when = exact intended note time. Never start() anything that isn't a note: no continuously running/looping sources, and no source starts for inactive or muted steps. Use one AudioContext, created or resumed on first user interaction.

We must ensure we don't start oscillator for continuous drone. We only start per trigger.

Potential pitfall: ConstantSourceNode? We don't use.

We use gain nodes etc.

Make sure we don't start oscillator at time 0 then schedule? No.

Potential pitfall: creating oscillator with start(when) where when is in future, okay.

Potential pitfall: oscillator.start() without when defaults to now, but we pass when.

BufferSource.start(when).

Make sure we don't call start() on gain nodes.

Now ensure we don't accidentally start source nodes for muted tracks: we skip.

Now ensure we don't schedule steps when stopped.

Now ensure play always starts from step 0. On play start, we set currentStepIndex=0, nextStepTime = audioCtx.currentTime + 0.05.

Now ensure tempo and swing changes take effect while playing without stopping, gaps or drift. Our scheduler recomputes base/delay each loop, so okay.

Now ensure playhead highlights step currently being heard, in sync with audio. Using RAF and scheduled steps times should be okay.

Potential issue: scheduledSteps times are computed using base/delay at scheduling time, so they reflect tempo at that moment. When tempo changes, future steps will be scheduled with new tempo. That's fine.

Now implement save/load.

State object:

{
 pattern: [...],
 tempo: ...,
 swing: ...,
 mutes: [...],
 volumes: [...]
}

Load: if localStorage.getItem('pulse_state') exists, parse, else use defaults.

On first load with empty localStorage, we may want demo beat. Could create a simple pattern if no state. Grader says page starts with empty localStorage (fresh browser profile). So we cannot rely on localStorage existing. We can provide demo beat on first load. That's optional. Might be okay to start empty.

But human judging may prefer demo beat. We can create a default pattern if no state, and still persist. That's okay.

Maybe create a simple 4/4 kick on beats 0,4,8,12 etc.

Let's create demo pattern if state not loaded: pattern for kick steps 0,4,8,12, snare 4,12, closed hat 0-15 every step? That's typical.

But grader may test pattern persistence. If we create demo pattern on first load, that's fine. Grader will interact with step toggles etc. Might be okay.

Better to start with empty pattern but provide a "demo" button? Could just start empty.

Human judging wants nice demo beat on first load. Let's create a default pattern if localStorage empty, and then save it. That way first load has beat.

Implementation: loadState() checks localStorage, if null, initialize state with default values and a demo pattern, then save.

Now ensure UI reflects state after load.

Implementation details for UI building:

We need to generate step buttons and set aria-pressed based on pattern.

Also mute buttons aria-pressed based on mutes.

Volume sliders value based on volumes *100.

Tempo and swing inputs value.

Now events:

step button click: toggle pattern[track][step]; set aria-pressed; save.

mute button click: toggle mutes[track]; set aria-pressed; save.

volume input input: volumes[track] = value/100; save.

tempo input input: currentBPM = parseInt(value); state.tempo = ...; save.

swing input input: currentSwing = parseInt(value); save.

Play button click: togglePlay()

function togglePlay() {
 if (!isPlaying) startPlay() else stopPlay()
}

startPlay():
 initAudio()
 audioCtx.resume()
 isPlaying=true
 currentStepIndex=0
 nextStepTime = audioCtx.currentTime + 0.05
 scheduledSteps = []
 playButton text? maybe "Stop"
 updatePlayhead RAF start
 schedulerLoop()

stopPlay():
 isPlaying=false
 clearTimeout(timerId)
 cancelAnimationFrame(rafId)
 playButton text "Play"
 sequencerEl.setAttribute('data-playhead','-1')

Space handler:
document.addEventListener('keydown', e => {
 if (e.code==='Space' && e.target.tagName!=='INPUT' && e.target.tagName!=='TEXTAREA' && e.target.tagName!=='BUTTON'?? Actually button focus may prevent? Space toggles playback unless focus is in text input. So allow button focus? Typically space on button triggers click. Might be okay. We'll check if activeElement is INPUT or TEXTAREA. If so, ignore.
 e.preventDefault()
 togglePlay()
})

Now visualizer draw:

let vizCtx = canvas.getContext('2d')
function drawViz() {
 if (!analyser) { requestAnimationFrame(drawViz); return; }
 const width = canvas.width = canvas.clientWidth * devicePixelRatio
 const height = canvas.height = canvas.clientHeight * devicePixelRatio
 vizCtx.clearRect(0,0,width,height)
 const data = new Uint8Array(analyser.frequencyBinCount)
 analyser.getByteFrequencyData(data)
 const barWidth = width / data.length * 2.5
 let x=0
 for (let i=0;i<data.length;i++) {
   const v = data[i]/255
   const h = v * height
   vizCtx.fillStyle = `hsl(${200+v*60},80%,60%)`
   vizCtx.fillRect(x, height - h, barWidth, h)
   x += barWidth +1
 }
 requestAnimationFrame(drawViz)
}

Start draw after audio init.

Now polish CSS:

Use dark background #0a0a0f, accent #00ffaa etc.

Steps grid: display grid grid-template-columns repeat(16,1fr)

Track rows.

Playhead: #sequencer[data-playhead="n"] .step[data-step="n"] { box-shadow... }

Active step: .step[aria-pressed="true"] { background:#00ffaa }

Trigger animation: .step.trigger { animation... }

When schedule step, we can add class 'trigger' to button element via JS. Find button by querySelector `[data-track="${t}"][data-step="${s}"]`. Add class, setTimeout remove after 120ms.

Now ensure no errors.

Potential issues:

- AudioBufferSourceNode.start(when) expects when >=0. Good.

- Oscillator exponentialRampToValueAtTime requires start value >0. Frequency start 150 >0 fine. Gain exponential ramp to 0.001 fine.

- For gain setValueAtTime to 0 then setValueAtTime to volume at same when? Might cause click. Use linear ramp? Might be okay.

Better to set gain.setValueAtTime(0.001, when) then linearRampToValueAtTime(volume, when+0.001). Simpler.

We'll use setValueAtTime(volume, when) then exponentialRampToValueAtTime.

But exponential ramp from 0 is invalid. So start with small value.

We'll set gain.gain.setValueAtTime(0.001, when); gain.gain.linearRampToValueAtTime(volume, when+0.01); then exponential decay.

Simplify: use linear ramp for attack.

Let's implement generic envelopes.

Kick: gain.setValueAtTime(0.001, when); gain.gain.linearRampToValueAtTime(volume, when+0.01); gain.gain.exponentialRampToValueAtTime(0.001, when+0.25)

Ok.

For snare noise gain: setValueAtTime(0.001, when); linearRampToValueAtTime(volume*0.9, when+0.001); exponentialRampToValueAtTime...

Okay.

Now ensure we don't create nodes for muted tracks.

Now ensure we don't create nodes for steps where pattern false.

Now ensure we use one AudioContext.

Potential grader check: recording every start(when) call on audio source nodes. They might check that start times are correct relative to scheduler. Should be fine.

Potential edge: When we schedule steps, we compute nextStepTime incrementally. If tempo changes between scheduler iterations, the interval for the next step will be based on new tempo, but the time of the current step was already scheduled. That's fine.

Potential drift: If we schedule step at time t, then compute interval for next step using current tempo, we set nextStepTime = t + interval. That's correct.

Now ensure scheduleAheadTime not too large.

Now implement code.

Potential pitfalls:

- Using setTimeout for scheduler may cause slight jitter but okay.

- Need to ensure audioCtx.currentTime is monotonic.

- When stopping, we should not leave scheduled steps.

- When starting, we need to clear scheduledSteps.

- Playhead RAF: we need to cancel on stop.

- Visualizer: we should start drawing after audio init.

- localStorage: may be disabled? Should be fine.

- Ensure we don't use external fonts.

Implementation steps in code:

We'll write HTML with minimal structure, CSS in <style>, JS in <script>.

Let's craft final output.

Complexities:

Generating UI dynamically: need to ensure elements have correct IDs.

Let's write HTML skeleton:

<body>
<div class="app">
<header>...</header>
<div class="main">
<div id="sequencer" data-playhead="-1"></div>
<div id="controls">
<button id="play">Play</button>
<label>Tempo <input id="tempo" type="range" min="40" max="240" value="120"></label>
<label>Swing <input id="swing" type="range" min="0" max="100" value="0"></label>
<button id="clear">Clear</button>
</div>
<canvas id="viz"></canvas>
</div>
</div>
</body>

Then JS builds sequencer inner HTML.

Simplify: build sequencer content by creating DOM nodes.

We'll create container for each track.

Let's implement JS:

const sequencerEl = document.getElementById('sequencer');
const tracks = [...];

tracks.forEach((name,i) => {
  const row = document.createElement('div');
  row.className='track-row';
  const info = document.createElement('div');
  info.className='track-info';
  info.innerHTML = `<span class="track-name">${name}</span><button data-mute="${i}" aria-pressed="false">Mute</button><input type="range" min="0" max="100" value="80" data-volume="${i}">`;
  const stepsWrap = document.createElement('div');
  stepsWrap.className='steps';
  for(let s=0;s<16;s++){
    const btn = document.createElement('button');
    btn.className='step';
    btn.dataset.track=i;
    btn.dataset.step=s;
    btn.setAttribute('aria-pressed','false');
    stepsWrap.appendChild(btn);
  }
  row.appendChild(info);
  row.appendChild(stepsWrap);
  sequencerEl.appendChild(row);
});

Now event delegation:

sequencerEl.addEventListener('click', e=>{
  const stepBtn = e.target.closest('.step');
  if(stepBtn){ toggleStep(stepBtn); }
  const muteBtn = e.target.closest('[data-mute]');
  if(muteBtn){ toggleMute(muteBtn); }
});

Volume inputs: event delegation for input event.

document.addEventListener('input', e=>{
  const vol = e.target.closest('[data-volume]');
  if(vol){ updateVolume(vol); }
  if(e.target.id==='tempo'){ updateTempo(e.target.value); }
  if(e.target.id==='swing'){ updateSwing(e.target.value); }
})

Play button click.

Clear button click.

Now implement functions.

State initialization:

let state = {
  pattern: Array.from({length:8},()=>Array(16).fill(false)),
  tempo:120,
  swing:0,
  mutes:Array(8).fill(false),
  volumes:Array(8).fill(0.8)
};

Load from localStorage.

If loaded, override.

If not loaded, create demo pattern.

Demo pattern: kick on 0,4,8,12; snare on 4,12; closed hat on every step? Let's do 0,2,4,6... maybe 0-15 step.

Better simple groove:

Kick: steps 0,4,8,12
Snare: 4,12
Closed Hat: 0,2,4,6,8,10,12,14
Open Hat: 15? Hmm.

Let's create basic.

Implement demo pattern generation:

state.pattern[0][0]=true; state.pattern[0][4]=true; state.pattern[0][8]=true; state.pattern[0][12]=true;
state.pattern[1][4]=true; state.pattern[1][12]=true;
for(let i=0;i<16;i+=2) state.pattern[2][i]=true;

Save.

Now UI update after load:

function applyStateToUI() {
  // steps
  document.querySelectorAll('.step').forEach(btn=>{
    const t=+btn.dataset.track, s=+btn.dataset.step;
    const active = state.pattern[t][s];
    btn.setAttribute('aria-pressed', active?'true':'false');
  });
  // mutes
  document.querySelectorAll('[data-mute]').forEach(btn=>{
    const i=+btn.dataset.mute;
    btn.setAttribute('aria-pressed', state.mutes[i]?'true':'false');
  });
  // volumes
  document.querySelectorAll('[data-volume]').forEach(inp=>{
    const i=+inp.dataset.volume;
    inp.value = Math.round(state.volumes[i]*100);
  });
  document.getElementById('tempo').value = state.tempo;
  document.getElementById('swing').value = state.swing;
  currentBPM = state.tempo;
  currentSwing = state.swing;
}

Save state function.

Now audio functions.

Let's implement makeNoiseBuffer:

function makeNoiseBuffer(duration){
  const sampleRate = audioCtx.sampleRate;
  const len = sampleRate*duration;
  const buffer = audioCtx.createBuffer(1,len,sampleRate);
  const data = buffer.getChannelData(0);
  for(let i=0;i<len;i++) data[i]=Math.random()*2-1;
  return buffer;
}

Create buffers after audioCtx init.

let noiseBuffers = {};

function initNoiseBuffers(){
  noiseBuffers.snare = makeNoiseBuffer(0.2);
  noiseBuffers.hat = makeNoiseBuffer(0.15);
  noiseBuffers.clap = makeNoiseBuffer(0.05);
}

Now play functions:

function playKick(when, vol){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type='sine';
  osc.frequency.setValueAtTime(150, when);
  osc.frequency.exponentialRampToValueAtTime(40, when+0.15);
  gain.gain.setValueAtTime(0.001, when);
  gain.gain.linearRampToValueAtTime(vol, when+0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, when+0.25);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(when);
  osc.stop(when+0.3);
}

function playSnare(when, vol){
  // noise
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuffers.snare;
  const filter = audioCtx.createBiquadFilter();
  filter.type='bandpass';
  filter.frequency.value=2000;
  filter.Q.value=1.5;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.001, when);
  gain.gain.linearRampToValueAtTime(vol*0.9, when+0.001);
  gain.gain.exponentialRampToValueAtTime(0.001, when+0.12);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  src.start(when);
  // tone
  const osc = audioCtx.createOscillator();
  const g2 = audioCtx.createGain();
  osc.frequency.setValueAtTime(180, when);
  g2.gain.setValueAtTime(0.001, when);
  g2.gain.linearRampToValueAtTime(vol*0.3, when+0.001);
  g2.gain.exponentialRampToValueAtTime(0.001, when+0.1);
  osc.connect(g2);
  g2.connect(masterGain);
  osc.start(when);
  osc.stop(when+0.15);
}

function playClosedHat(when, vol){
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuffers.hat;
  const filter = audioCtx.createBiquadFilter();
  filter.type='highpass';
  filter.frequency.value=9000;
  filter.Q.value=0.7;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.001, when);
  gain.gain.linearRampToValueAtTime(vol*0.7, when+0.001);
  gain.gain.exponentialRampToValueAtTime(0.001, when+0.05);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  src.start(when);
}

function playOpenHat(when, vol){
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuffers.hat;
  const filter = audioCtx.createBiquadFilter();
  filter.type='highpass';
  filter.frequency.value=6000;
  filter.Q.value=0.7;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.001, when);
  gain.gain.linearRampToValueAtTime(vol*0.6, when+0.001);
  gain.gain.exponentialRampToValueAtTime(0.001, when+0.25);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  src.start(when);
}

function playClap(when, vol){
  for(let i=0;i<3;i++){
    const t = when + i*0.015;
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuffers.clap;
    const filter = audioCtx.createBiquadFilter();
    filter.type='bandpass';
    filter.frequency.value=3000;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(vol*0.6/(i+1), t+0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.08);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    src.start(t);
  }
}

function playLowTom(when, vol){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type='sine';
  osc.frequency.setValueAtTime(120, when);
  osc.frequency.exponentialRampToValueAtTime(60, when+0.25);
  gain.gain.setValueAtTime(0.001, when);
  gain.gain.linearRampToValueAtTime(vol, when+0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, when+0.35);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(when);
  osc.stop(when+0.4);
}

function playHighTom(when, vol){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type='sine';
  osc.frequency.setValueAtTime(250, when);
  osc.frequency.exponentialRampToValueAtTime(120, when+0.2);
  gain.gain.setValueAtTime(0.001, when);
  gain.gain.linearRampToValueAtTime(vol, when+0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, when+0.3);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(when);
  osc.stop(when+0.35);
}

function playCowbell(when, vol){
  const freqs = [1300, 1700, 2300];
  freqs.forEach((f,i)=>{
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type='square';
    osc.frequency.setValueAtTime(f, when);
    gain.gain.setValueAtTime(0.001, when);
    gain.gain.linearRampToValueAtTime(vol*0.4/(i+1), when+0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, when+0.15);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(when);
    osc.stop(when+0.2);
  });
}

Now scheduleStep:

function scheduleStep(stepIdx, time){
  for(let t=0; t<8; t++){
    if(state.pattern[t][stepIdx] && !state.mutes[t]){
      const vol = state.volumes[t];
      triggerSound(t, time, vol);
      // visual trigger
      const btn = document.querySelector(`.step[data-track="${t}"][data-step="${stepIdx}"]`);
      if(btn){
        btn.classList.add('trigger');
        setTimeout(()=>btn.classList.remove('trigger'), 120);
      }
    }
  }
  // push to scheduledSteps
  scheduledSteps.push({step:stepIdx, time});
}

triggerSound:

function triggerSound(track, when, vol){
  switch(track){
    case 0: playKick(when, vol); break;
    case 1: playSnare(when, vol); break;
    case 2: playClosedHat(when, vol); break;
    case 3: playOpenHat(when, vol); break;
    case 4: playClap(when, vol); break;
    case 5: playLowTom(when, vol); break;
    case 6: playHighTom(when, vol); break;
    case 7: playCowbell(when, vol); break;
  }
}

Now schedulerLoop implementation details.

We need to ensure nextStepTime and currentStepIndex are correctly initialized.

startPlay:
initAudio()
audioCtx.resume()
isPlaying=true
currentStepIndex=0
nextStepTime = audioCtx.currentTime + 0.05
scheduledSteps = []
playButton.textContent='Stop'
schedulerLoop()
startPlayheadRAF()
startViz()

stopPlay:
isPlaying=false
clearTimeout(timerId)
cancelAnimationFrame(rafId)
cancelAnimationFrame(vizRaf)
playButton.textContent='Play'
sequencerEl.setAttribute('data-playhead','-1')

schedulerLoop:
function schedulerLoop(){
 if(!isPlaying) return;
 const now = audioCtx.currentTime;
 while(nextStepTime < now + scheduleAheadTime){
   scheduleStep(currentStepIndex, nextStepTime);
   // advance
   const base = 60 / currentBPM / 4;
   const delay = (currentSwing/100) * base / 3;
   let interval;
   if(currentStepIndex %2 ===0){
     interval = base + delay;
   } else {
     interval = base - delay;
   }
   nextStepTime += interval;
   currentStepIndex = (currentStepIndex + 1) % 16;
 }
 timerId = setTimeout(schedulerLoop, 25);
}

Playhead RAF:

let rafId;
function playheadLoop(){
 if(!isPlaying){
   sequencerEl.setAttribute('data-playhead','-1');
   return;
 }
 const now = audioCtx.currentTime;
 // find last scheduled step <= now
 let lastStep = -1;
 for(let i=scheduledSteps.length-1;i>=0;i--){
   if(scheduledSteps[i].time <= now){
     lastStep = scheduledSteps[i].step;
     break;
   }
 }
 sequencerEl.setAttribute('data-playhead', lastStep);
 // prune old
 while(scheduledSteps.length && scheduledSteps[0].time < now - 1){
   scheduledSteps.shift();
 }
 rafId = requestAnimationFrame(playheadLoop);
}

Viz loop:

let vizRaf;
function vizLoop(){
 if(!analyser){ vizRaf = requestAnimationFrame(vizLoop); return; }
 const width = canvas.width = canvas.clientWidth * devicePixelRatio;
 const height = canvas.height = canvas.clientHeight * devicePixelRatio;
 ctx.clearRect(0,0,width,height);
 const data = new Uint8Array(analyser.frequencyBinCount);
 analyser.getByteFrequencyData(data);
 const barWidth = width / data.length * 1.5;
 let x=0;
 for(let i=0;i<data.length;i++){
   const v = data[i]/255;
   const h = v * height;
   ctx.fillStyle = `hsl(${180 + v*60},80%,60%)`;
   ctx.fillRect(x, height - h, barWidth, h);
   x += barWidth +1;
 }
 vizRaf = requestAnimationFrame(vizLoop);
}

Now initAudio:

function initAudio(){
 if(audioCtx) return;
 audioCtx = new (window.AudioContext||window.webkitAudioContext)();
 masterGain = audioCtx.createGain();
 masterGain.gain.value = 0.7;
 analyser = audioCtx.createAnalyser();
 analyser.fftSize = 2048;
 masterGain.connect(analyser);
 analyser.connect(audioCtx.destination);
 initNoiseBuffers();
}

Now event handlers.

toggleStep:

function toggleStep(btn){
 const t = +btn.dataset.track;
 const s = +btn.dataset.step;
 const newVal = btn.getAttribute('aria-pressed')==='false';
 btn.setAttribute('aria-pressed', newVal?'true':'false');
 state.pattern[t][s] = newVal;
 saveState();
}

toggleMute:

function toggleMute(btn){
 const i = +btn.dataset.mute;
 const newVal = btn.getAttribute('aria-pressed')==='false';
 btn.setAttribute('aria-pressed', newVal?'true':'false');
 state.mutes[i] = newVal;
 saveState();
}

updateVolume:

function updateVolume(inp){
 const i = +inp.dataset.volume;
 const v = inp.value/100;
 state.volumes[i] = v;
 saveState();
}

updateTempo:

function updateTempo(val){
 const bpm = parseInt(val);
 state.tempo = bpm;
 currentBPM = bpm;
 saveState();
}

updateSwing:

function updateSwing(val){
 const s = parseInt(val);
 state.swing = s;
 currentSwing = s;
 saveState();
}

Clear button:

document.getElementById('clear').addEventListener('click', ()=>{
 for(let t=0;t<8;t++){
   for(let s=0;s<16;s++){
     state.pattern[t][s]=false;
   }
 }
 applyStateToUI();
 saveState();
});

Save state:

function saveState(){
 localStorage.setItem('pulse_state', JSON.stringify(state));
}

Load state:

function loadState(){
 const raw = localStorage.getItem('pulse_state');
 if(raw){
   try{
     const parsed = JSON.parse(raw);
     state = {...state, ...parsed};
     // ensure arrays lengths
   }catch(e){}
 }else{
   // demo pattern
   state.pattern[0][0]=true; state.pattern[0][4]=true; state.pattern[0][8]=true; state.pattern[0][12]=true;
   state.pattern[1][4]=true; state.pattern[1][12]=true;
   for(let i=0;i<16;i+=2) state.pattern[2][i]=true;
   state.volumes = [0.9,0.8,0.7,0.6,0.7,0.7,0.7,0.6];
   saveState();
 }
 currentBPM = state.tempo;
 currentSwing = state.swing;
 applyStateToUI();
}

Now ensure play button toggles.

document.getElementById('play').addEventListener('click', togglePlay);

Space handler:

document.addEventListener('keydown', e=>{
 if(e.code==='Space'){
   const active = document.activeElement;
   if(active && (active.tagName==='INPUT' || active.tagName==='TEXTAREA' || active.tagName==='BUTTON')){
     // If button, space will trigger click anyway. Might still toggle. Let's allow? Requirement: unless focus is in text input. So allow button focus.
     if(active.tagName==='INPUT' || active.tagName==='TEXTAREA'){
       return;
     }
   }
   e.preventDefault();
   togglePlay();
 }
});

Now ensure no errors.

Potential issues:

- When we querySelector for btn to add trigger class, if button not found, okay.

- scheduledSteps push in scheduleStep after scheduling? We push before advance. Good.

- Playhead loop uses scheduledSteps. But scheduledSteps includes steps that have been scheduled but not yet played. The last step with time <= now is correct.

- When we start playing, nextStepTime = now +0.05, currentStepIndex=0. Scheduler loop will schedule step 0 at time now+0.05. Good.

- When we stop, we should clear scheduledSteps to avoid memory.

Potential issue: audioCtx.resume() returns promise. We can ignore.

Now CSS.

We need to make step buttons visually separated groups of 4.

Use CSS:

.step { ... }

.step:nth-child(4n+1) { margin-left: 4px; } etc.

Better: use grid with column gap, and add border-left for every 4th.

Let's craft CSS:

body { margin:0; background:#0b0e13; color:#e8eef5; font-family:system-ui, sans-serif; }
.app { max-width:1200px; margin:auto; padding:20px; }
header { text-align:center; margin-bottom:20px; }
#sequencer { display:flex; flex-direction:column; gap:4px; }
.track-row { display:flex; align-items:center; gap:8px; }
.track-info { width:140px; display:flex; flex-direction:column; gap:4px; }
.track-name { font-weight:600; }
.track-info button { background:#1e2633; border:1px solid #2a3444; color:#e8eef5; padding:4px 8px; border-radius:4px; cursor:pointer; }
.track-info button[aria-pressed="true"] { background:#ff4d6d; }
.track-info input { width:100%; }
.steps { display:grid; grid-template-columns:repeat(16,1fr); gap:4px; flex:1; }
.step { height:36px; background:#121821; border:1px solid #243043; border-radius:4px; cursor:pointer; transition:background .08s, box-shadow .08s; }
.step[aria-pressed="true"] { background:#00e5a0; border-color:#00e5a0; }
#sequencer[data-playhead="0"] .step[data-step="0"],
#sequencer[data-playhead="1"] .step[data-step="1"],
... we can use CSS attribute selector with variable? Can't generate 16 rules manually? We can use CSS: #sequencer[data-playhead] .step[data-step] where attribute equals? We need dynamic. Could use CSS: #sequencer[data-playhead] .step { } but need match.

We can use CSS attribute selector: #sequencer[data-playhead="3"] .step[data-step="3"] { ... }

We can generate with CSS for all 0-15 using a loop? Can't in static CSS without predefining. Could use CSS custom property trick? Simpler: use JS to add class 'playhead' to current step button.

Alternative: Use CSS with attribute selector using [data-step] = value? Could use CSS :where? No.

Simpler: in playheadLoop, we can add/remove a class 'playhead' on buttons. But requirement says element #sequencer has data-playhead attribute. It doesn't require CSS to use it, just attribute exists. So we can just set attribute, and CSS can be done via JS adding class. But human judging wants visual playhead. So we need visual.

We can use CSS with attribute selector using [data-playhead] and then use :nth-child? Can't match numeric.

Alternative: use CSS with :has? Not.

Simplest: In playheadLoop, we can add class 'playhead' to the step button currently active, removing from previous. That still respects data-playhead attribute.

We'll do both: keep data-playhead attribute, and also add class via JS for visual.

Implement in playheadLoop: we could find button and add class.

Simpler: use CSS with JavaScript-generated rules? Could generate CSS dynamically for 16 values.

Easier: just add class 'is-playhead' to buttons via JS.

But contract only requires data-playhead attribute. Visual can be done via JS class.

We'll implement in playheadLoop: remove previous playhead class from all steps, add to current step.

But we need to know which track? Playhead highlights step column, not specific track. So all rows step at same index highlighted.

So we can add class to all buttons with data-step == lastStep.

Implementation:

function updatePlayheadVisual(stepIdx){
 document.querySelectorAll('.step').forEach(btn=>{
   btn.classList.toggle('is-playhead', +btn.dataset.step===stepIdx);
 });
}

Call in playheadLoop.

That's fine.

Now step trigger animation: .step.trigger { box-shadow:0 0 12px #fff; transform:scale(0.95); }

Now controls styling.

Canvas viz: height 120px, background #000.

Now ensure no console errors: check variable names.

Potential errors:

- audioCtx undefined when schedulerLoop runs before initAudio? We init before start.

- noiseBuffers may be undefined if initAudio not called. But initAudio creates them.

- When we call triggerSound, play functions assume audioCtx exists.

- When we schedule step, we querySelector for btn, which may be null if not built yet. Should be fine.

- saveState uses state object that may be replaced on load. Ensure saveState references current state.

- loadState merges parsed into state. Better to assign state = parsed.

Simplify: loadState sets state = parsed.

Let's implement properly.

Implementation details final.

Edge Cases:

- When tempo changes, currentBPM updates. Scheduler uses currentBPM.

- When swing changes, currentSwing updates.

- When mute toggled while playing, future steps will respect.

- Volume slider changes affect next triggers.

- Step toggles affect future.

Now ensure we never start source for inactive steps: scheduleStep checks pattern and mute.

Now ensure we never start source for muted track: check.

Now ensure we never start source for inactive step: check.

Now ensure we don't start continuously running sources: all sources started with start(when) and stopped.

Now ensure one AudioContext: we create once.

Now ensure we resume on first user interaction: initAudio called on play start, which is user interaction.

Potential issue: step toggle click may happen before audio init, but that's okay.

Now final code.

Let's produce final HTML file.

We must output in single ```html code block.

Let's craft final output.

Potential improvements: add Clear button id.

Add Clear button in controls.

Now final code.

We'll write script at end.

Let's assemble.

Potential bug: In schedulerLoop, we compute interval based on currentStepIndex before increment. That's correct.

But we also need to ensure nextStepTime for first step is correct relative to currentTime. We set nextStepTime = audioCtx.currentTime +0.05. Then schedule step 0 at that time. Then interval computed for step0 (even) -> base+delay. NextStepTime = time0 + interval. Good.

Now when we advance currentStepIndex to 1, next iteration schedule step1.

Now playhead: scheduledSteps includes step0 time. When now passes time0, playhead shows step0.

Now ensure scheduledSteps is pruned to avoid memory leak.

Now ensure viz canvas size: set width/height attributes.

Implementation details for canvas: canvas id="viz". In JS, const canvas = document.getElementById('viz'); const ctx = canvas.getContext('2d');

In vizLoop, set canvas.width = canvas.clientWidth * devicePixelRatio etc.

Now final output.

Let's produce final answer.