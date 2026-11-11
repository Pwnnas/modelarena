Let me break down this task:

1. Build a 16-step drum machine with Web Audio API synthesis
2. 8 tracks: Kick, Snare, Closed Hat, Open Hat, Clap, Low Tom, High Tom, Cowbell
3. 16 steps per track, groups of 4 visually separated
4. Lookahead scheduler for sample-accurate timing
5. Tempo 40-240 BPM, Swing 0-100
6. Play/Stop, Space bar toggle
7. Mixer with mute and volume per track
8. Real-time visualizer
9. localStorage persistence
10. Grader contract with specific IDs and data attributes

Let me think through the architecture:

**Audio Synthesis:**
- Kick: Sine wave with pitch envelope (150Hz -> 40Hz), gain envelope (quick decay)
- Snare: Noise burst + tone (180Hz triangle), bandpass filter
- Closed Hat: High-pass filtered noise, very short decay
- Open Hat: High-pass filtered noise, longer decay
- Clap: Noise burst with multiple quick re-triggers, bandpass
- Low Tom: Sine wave ~80Hz, medium decay
- High Tom: Sine wave ~150Hz, medium decay
- Cowbell: Two square waves at specific frequencies (540Hz, 800Hz), bandpass, short decay

**Scheduler:**
- Lookahead scheduler running at ~25ms intervals
- Schedule notes 100ms ahead
- Track current step and next note time
- Use AudioContext.currentTime for all timing

**Swing:**
- At swing s, odd steps (1, 3, 5, ...) delayed by (s/100) × (1/3) × (16th note duration)

**UI:**
- Hardware-like design with dark theme, glowing steps
- Step grid with groups of 4
- Transport controls
- Mixer section
- Visualizer canvas

**Grader Contract:**
- 128 buttons with data-track, data-step, aria-pressed
- #play button
- #tempo input
- #swing input
- data-mute buttons
- data-volume inputs
- #sequencer with data-playhead
- AudioContext created/resumed on first user interaction
- No looping sources
- No source starts for inactive/muted steps

Let me think about the playhead. The grader checks `data-playhead` on `#sequencer`. This should be the step currently being heard. Since we use a lookahead scheduler, the "currently being heard" step is the one that was most recently scheduled. I need to update this in sync with the audio.

Actually, the playhead should reflect what's being heard NOW. So I need to track when each note was scheduled and update the playhead at the right time. I can use a combination of the scheduler and a rAF loop for the visual update.

Wait, but the grader says "the step currently being heard while playing". So I need to figure out which step's audio is currently playing. Since we schedule ahead, I need to know which scheduled note's time has passed.

I'll maintain a queue of scheduled notes with their times, and use rAF to check which one is current based on AudioContext.currentTime.

Let me think about the localStorage persistence:
- Save: pattern (8x16 boolean array), tempo, swing, mutes (8 booleans), volumes (8 numbers)
- Load on startup

Let me now code this up:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pulse — Drum Machine</title>
<style>
/* ... styles ... */
</style>
</head>
<body>
<!-- ... HTML ... -->
<script>
// ... JavaScript ...
</script>
</body>
</html>
```

Let me think about the visual design. I want it to look like a premium hardware drum machine. Dark background, with metallic accents, glowing step buttons, and a clear layout.

Layout:
- Top: Title + Transport (Play, Tempo, Swing, Clear)
- Middle: Step grid (8 rows × 16 columns, grouped in 4s)
- Bottom: Mixer (per-track mute + volume) + Visualizer

Let me code this properly now.

For the scheduler, I'll use the standard Chris Wilson lookahead pattern:
- `scheduleAheadTime = 0.1` (100ms)
- `schedulerInterval = 25` (ms)
- `nextNoteTime` tracks when the next note should play
- `currentStep` tracks which step we're on

For each step:
- Calculate the time
- Apply swing if odd step
- If the step has active tracks (and not muted), schedule the audio
- Add to a queue for playhead tracking

For the playhead, I'll use rAF to check AudioContext.currentTime against the scheduled note times and update `data-playhead` accordingly.

Let me think about the swing calculation:
- 16th note duration = 60 / BPM / 4
- Swing delay = (swing/100) * (1/3) * 16th note duration
- Applied to odd steps (1, 3, 5, 7, 9, 11, 13, 15)

So step 0 plays at time T, step 1 plays at T + 16th + swing_delay, step 2 plays at T + 2*16th, step 3 plays at T + 2*16th + swing_delay, etc.

Wait, let me reconsider. The standard approach:
- Step 0: time = 0
- Step 1: time = 16th + swing
- Step 2: time = 2 * 16th
- Step 3: time = 2 * 16th + swing
- Step 4: time = 3 * 16th
- ...

So the pattern is: even steps are on time, odd steps are delayed by the swing amount.

Actually, re-reading the spec: "every odd-numbered step (steps 1, 3, 5, … counting from 0) is delayed by (s/100) × ⅓ × (duration of one 16th note)"

So the delay is added to the natural position. Step 1's natural position is 1 * 16th, and it gets delayed to 1 * 16th + swing_delay.

Let me think about the scheduler more carefully:

```javascript
function scheduler() {
    while (nextNoteTime < ctx.currentTime + scheduleAheadTime) {
        scheduleStep(currentStep, nextNoteTime);
        advanceNextNoteTime();
    }
}

function advanceNextNoteTime() {
    const secondsPerStep = 60 / bpm / 4;
    const swingDelay = (swing / 100) * (1/3) * secondsPerStep;
    
    if (currentStep % 2 === 1) {
        // We just scheduled an odd step, next step is even
        // The odd step was at its position + swing, but the next even step
        // should be at its natural position
        // Actually, I need to think about this differently
    }
}
```

Hmm, let me reconsider. The way swing works in drum machines:

The 16th note grid has positions: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15

Each at time: step_index * secondsPer16th

With swing, odd steps are delayed:
- Step 0: 0
- Step 1: 1 * spb + delay
- Step 2: 2 * spb
- Step 3: 3 * spb + delay
- etc.

So the actual time for step n is:
- If n is even: n * spb
- If n is odd: n * spb + delay

Where delay = (swing/100) * (1/3) * spb

This means the gap between step 0 and step 1 is spb + delay, and the gap between step 1 and step 2 is spb - delay.

For the scheduler, I need to compute the exact time for each step:

```javascript
function getTimeForStep(step, startTime) {
    const spb = 60 / bpm / 4;
    const delay = (swing / 100) * (1/3) * spb;
    return startTime + step * spb + (step % 2 === 1 ? delay : 0);
}
```

But wait, I'm scheduling step by step in a loop. So I need to track `nextNoteTime` and compute it properly.

Actually, the cleanest approach: maintain a `currentStep` counter and compute the absolute time for each step based on a reference time.

Let me use a different approach:
- `barStartTime`: the time when the current bar started (step 0)
- For each step, compute: `barStartTime + step * spb + (step % 2 ? delay : 0)`
- When step wraps to 0, update `barStartTime`

Actually, even simpler: just maintain `nextNoteTime` and compute the next step's time:

```javascript
function nextStepTime() {
    const spb = 60 / bpm / 4;
    const delay = (swing / 100) * (1/3) * spb;
    if (currentStep % 2 === 1) {
        // Next step is even, goes back by the delay
        return nextNoteTime + spb - delay;
    } else {
        // Next step is odd, goes forward by the delay
        return nextNoteTime + spb + delay;
    }
}
```

Wait, that's not quite right either. Let me think again.

If step n is at time T(n):
- T(n) = n * spb + (n % 2 ? delay : 0)  (relative to bar start)

So T(n+1) - T(n):
- If n is even: T(n+1) - T(n) = (n+1)*spb + delay - n*spb = spb + delay
- If n is odd: T(n+1) - T(n) = (n+1)*spb - (n*spb + delay) = spb - delay

So:
- After scheduling an even step, the next (odd) step is at +spb + delay
- After scheduling an odd step, the next (even) step is at +spb - delay

This is correct. Let me use this approach.

Now for the audio synthesis. Let me design each sound:

**Kick:**
- Sine oscillator, frequency starts at ~150Hz, drops to ~40Hz over ~50ms
- Gain: starts at 1, exponential decay to 0.001 over ~300ms
- Maybe add a click (short noise burst) at the start

**Snare:**
- Noise: white noise through bandpass at ~1800Hz, decay ~150ms
- Tone: triangle wave at ~180Hz, decay ~100ms
- Combined

**Closed Hat:**
- Noise through highpass at ~7000Hz, very short decay ~50ms

**Open Hat:**
- Noise through highpass at ~7000Hz, longer decay ~200ms

**Clap:**
- Noise through bandpass at ~1200Hz
- Multiple short bursts (3-4) with tiny delays to create the "clap" effect
- Decay ~100ms

**Low Tom:**
- Sine at ~80Hz, slight pitch drop, decay ~200ms

**High Tom:**
- Sine at ~150Hz, slight pitch drop, decay ~200ms

**Cowbell:**
- Two square/sawtooth oscillators at 540Hz and 800Hz
- Bandpass filter
- Short decay ~100ms

For the noise buffer, I'll create it once and reuse it.

Let me also think about the grader's timing check. It records every `start(when)` call. So I need to make sure:
1. Every `start(when)` call has the correct `when` value
2. No extra source starts for inactive/muted steps
3. No continuously running sources

This means I should NOT use a continuous oscillator for anything. Each sound should be a short-lived source that starts and stops.

For the noise buffer, I create it once (using `createBuffer`), and each time I need noise, I create a new `AudioBufferSourceNode`, set the buffer, and call `start(when)`.

Let me now write the complete code:

```javascript
// Audio context
let ctx = null;
let masterGain;
let analyser;
let noiseBuffer;

function initAudio() {
    if (ctx) return;
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.8;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);
    
    // Create noise buffer
    const bufferSize = ctx.sampleRate * 2;
    noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
}
```

Wait, the grader says "No source starts for inactive or muted steps." So I need to check both that the step is active AND the track is not muted before creating any nodes.

Also: "Never start() anything that isn't a note: no continuously running/looping sources"

So I can't have a looping noise buffer or a continuously running oscillator. Everything must be finite.

Let me also think about the visualizer. I'll use a canvas with an AnalyserNode, drawing the frequency spectrum or waveform. I'll use rAF for this - it's fine for visualization purposes.

Now let me think about the overall structure of the HTML:

```
<div id="app">
  <header>
    <h1>PULSE</h1>
    <div class="transport">
      <button id="play">▶</button>
      <label>Tempo <input type="range" id="tempo" min="40" max="240" value="120"> <span id="tempo-val">120</span></label>
      <label>Swing <input type="range" id="swing" min="0" max="100" value="0"> <span id="swing-val">0</span></label>
      <button id="clear">Clear</button>
    </div>
  </header>
  
  <div id="sequencer" data-playhead="-1">
    <!-- 8 rows, each with track name + 16 step buttons -->
    <div class="track-row">
      <div class="track-label">Kick</div>
      <div class="steps">
        <button data-track="0" data-step="0" aria-pressed="false"></button>
        ...
      </div>
    </div>
    ...
  </div>
  
  <div id="mixer">
    <!-- Per track: mute button + volume slider -->
  </div>
  
  <div id="visualizer">
    <canvas id="viz-canvas"></canvas>
  </div>
</div>
```

Let me now write the complete file. I'll aim for a polished, hardware-like look.

For the CSS, I'm thinking:
- Dark background (#1a1a2e or similar)
- Metallic/brushed panel look
- Step buttons: rounded squares, dark when off, glowing when on
- Different colors per track
- Smooth transitions
- Playhead: bright highlight

Let me assign colors to tracks:
- Kick: red/orange
- Snare: yellow
- Closed Hat: green
- Open Hat: cyan
- Clap: pink/magenta
- Low Tom: blue
- High Tom: purple
- Cowbell: gold

Actually, let me use a more cohesive color palette. Maybe a warm-to-cool gradient across tracks.

Let me finalize the design and write it all out.

One important thing: the grader checks that `#sequencer` has `data-playhead` that is the step currently being heard. I need to update this in sync with the audio. Since I'm using a lookahead scheduler, I'll keep a queue of {step, time} pairs and use rAF to check which one is current.

Actually, let me think about this more carefully. The scheduler schedules notes ahead of time. So at any given moment, I might have scheduled steps 3, 4, 5 but we're currently at step 3. The playhead should show 3.

I'll maintain an array of {step, time} for scheduled but not yet played notes. In the rAF loop, I'll check `ctx.currentTime` and find the most recent note whose time has passed. That's the current playhead step.

When a note's time + one step duration has passed, I can remove it from the queue (or just keep it and use the last one whose time <= currentTime).

Let me code this up properly now.

Actually, I realize I should be more careful. The playhead should show the step that is "currently being heard." Since sounds have some duration, a step is "being heard" from when it starts until the next step starts. So the playhead is the last scheduled step whose start time is <= currentTime.

Let me implement this:

```javascript
let scheduledNotes = []; // [{step, time}]

function updatePlayhead() {
    if (!playing) {
        sequencerEl.dataset.playhead = '-1';
        return;
    }
    const now = ctx.currentTime;
    let currentStep = -1;
    for (const note of scheduledNotes) {
        if (note.time <= now) {
            currentStep = note.step;
        } else {
            break;
        }
    }
    sequencerEl.dataset.playhead = String(currentStep);
    requestAnimationFrame(updatePlayhead);
}
```

Wait, I need to clean up old entries from scheduledNotes to prevent the array from growing indefinitely. I'll remove entries where time < currentTime - 1 (one second ago).

Let me now write the complete file. This is going to be long but I need to get it all right.

Let me think about the step button styling. I want:
- Groups of 4 separated by a gap
- Active steps glow with the track color
- Playhead has a special indicator
- Hover effects
- Press animation

For the grid, I'll use CSS Grid or flexbox. Let me use a table-like layout with flexbox.

Each row: [track label] [4 steps] [gap] [4 steps] [gap] [4 steps] [gap] [4 steps]

Let me use a grid with 16 columns for the steps, and add extra margin/gap between groups of 4.

Actually, I'll use flexbox with a specific structure. Each row has 16 step buttons, with extra margin after every 4th button (except the last group).

Let me finalize and write the code now. I'll make it comprehensive.

For the demo beat on first load, I'll set up a basic pattern:
- Kick: steps 0, 4, 8, 12
- Snare: steps 4, 12
- Closed Hat: steps 0, 2, 4, 6, 8, 10, 12, 14
- Open Hat: steps 2, 6, 10, 14

Actually, a more interesting beat:
- Kick: 0, 6, 8, 12 (or 0, 8, 10)
- Snare: 4, 12
- Closed Hat: 0, 2, 4, 6, 8, 10, 12, 14
- Low Tom: 14

Let me go with a classic rock beat:
- Kick: 0, 8
- Snare: 4, 12
- Closed Hat: 0, 2, 4, 6, 8, 10, 12, 14

That's a basic beat. Let me make it a bit more interesting:
- Kick: 0, 6, 8, 11
- Snare: 4, 12
- Closed Hat: 0, 2, 4, 6, 8, 10, 12, 14
- Open Hat: 14
- Low Tom: 15

Actually, let me keep it simple and recognizable. A basic four-on-the-floor house beat:
- Kick: 0, 4, 8, 12
- Clap: 4, 12
- Closed Hat: 2, 6, 10, 14
- Open Hat: 2, 10

That's a good demo. Let me go with that.

Now let me write the full code. I'll be thorough.

One more thing about the grader: "Use one AudioContext, created or resumed on the first user interaction."

So I should create the AudioContext lazily on first interaction (click, keydown, etc.). Or create it and resume it. Let me create it on first interaction to be safe.

Actually, I'll create it on the first click/keypress. If it's suspended, resume it.

Let me also handle the case where the user clicks play first - that should trigger audio initialization.

Let me also think about the volume sliders. They should be per-track, with `data-volume="0".."7"`. I'll use range inputs from 0 to 100 (or 0 to 1).

For the mute buttons: `data-mute="0".."7"` with `aria-pressed`.

OK let me write this now. I'll be very careful with the grader contract.

Let me also add presets and randomize as bonus features.

Here's my plan for the code structure:

1. HTML: Layout with all required elements
2. CSS: Hardware-like styling
3. JS:
   a. State management (pattern, tempo, swing, mutes, volumes)
   b. Audio engine (synthesis, scheduler)
   c. UI (event handlers, visual updates)
   d. Persistence (localStorage)
   e. Visualizer
   f. Presets, randomize

Let me write it all out now.

For the synthesis, let me be more specific:

**Kick:**
```javascript
function playKick(time) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.05);
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(time);
    osc.stop(time + 0.3);
    
    // Click
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 2000;
    noiseGain.gain.setValueAtTime(0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start(time);
    noise.stop(time + 0.02);
}
```

**Snare:**
```javascript
function playSnare(time) {
    // Noise component
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start(time);
    noise.stop(time + 0.15);
    
    // Tone component
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    osc.start(time);
    osc.stop(time + 0.1);
}
```

**Closed Hat:**
```javascript
function playClosedHat(time) {
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(time);
    noise.stop(time + 0.05);
}
```

**Open Hat:**
```javascript
function playOpenHat(time) {
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(time);
    noise.stop(time + 0.25);
}
```

**Clap:**
```javascript
function playClap(time) {
    // Multiple bursts
    for (let i = 0; i < 3; i++) {
        const t = time + i * 0.01;
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 1.5;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + (i === 2 ? 0.15 : 0.02));
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        noise.start(t);
        noise.stop(t + (i === 2 ? 0.15 : 0.02));
    }
}
```

Wait, the grader says "Each triggered step starts its voice's source node(s) with when = the exact intended note time." So for the clap, the burst at `time + 0.01` would have a different `when` than the intended note time. That might be a problem.

Let me re-read: "Each triggered step starts its voice's source node(s) with when = the exact intended note time on the AudioContext clock."

So ALL source nodes for a step must start at the same time. For the clap, I should start all three noise sources at the same time but use different buffer offsets or different decay times to create the "clap" effect.

Actually, I can use `start(when, offset)` to start at different offsets in the buffer. But the `when` parameter must be the note time.

Alternatively, I can create a single noise burst with a more complex envelope that simulates the clap. Or I can use a single buffer source with a shaped envelope.

Let me simplify: for the clap, use a single noise source with a bandpass filter and a gain envelope that has a quick attack, small dip, and then a longer decay. This simulates the "thwup-thwup-thwup" of a clap.

```javascript
function playClap(time) {
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 2;
    const gain = ctx.createGain();
    // Multi-peak envelope
    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.1, time + 0.01);
    gain.gain.linearRampToValueAtTime(0.5, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.05, time + 0.03);
    gain.gain.linearRampToValueAtTime(0.4, time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(time);
    noise.stop(time + 0.15);
}
```

This way, all source nodes start at `time`. Good.

Similarly for the kick, the noise click should start at `time`, not at a different time.

Let me revise all the synth functions to ensure all `start(when)` calls use the exact note time.

For the cowbell:
```javascript
function playCowbell(time) {
    const osc1 = ctx.createOscillator();
    osc1.type = 'square';
    osc1.frequency.value = 540;
    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = 800;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 1;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc1.start(time);
    osc1.stop(time + 0.15);
    osc2.start(time);
    osc2.stop(time + 0.15);
}
```

Good, both oscillators start at `time`.

Now let me think about the track volumes. Each track should have its own gain node:

```javascript
const trackGains = [];
for (let i = 0; i < 8; i++) {
    const g = ctx.createGain();
    g.gain.value = 0.8; // default volume
    g.connect(masterGain);
    trackGains.push(g);
}
```

Then each synth function takes a track index and connects to `trackGains[trackIndex]` instead of `masterGain`.

Wait, but the grader says "A muted track must not trigger any voice (don't create/start nodes for it)." So I should check mute status before creating any nodes at all.

OK, let me structure the synth functions to take a destination (the track's gain node) and check mute before calling them.

Let me now write the complete code. I'll be very thorough.

Actually, one more consideration: the grader records `start(when)` calls on "audio source nodes (OscillatorNode, AudioBufferSourceNode, ConstantSourceNode) of your AudioContext." So it's specifically tracking these three types of nodes. I need to make sure:
1. Every `start(when)` on these node types has the correct `when` value
2. No `start()` calls for inactive or muted steps
3. No continuously running sources (no `loop = true` or infinite sources)

My approach is correct - I create new source nodes for each note trigger, start them at the scheduled time, and stop them after their duration.

Let me now write the complete file.

For the visual design, I'm going for a dark, premium hardware look:
- Background: dark gradient
- Panel: slightly lighter with subtle border
- Steps: rounded rectangles with inner shadow when off, glowing when on
- Track colors: distinct hues
- Transport: large play button with icon
- Sliders: custom styled
- Visualizer: frequency bars on a dark canvas

Let me code it all up now. This will be a long file.

Let me also think about the "groups of 4" visual separation. I'll add extra margin after every 4th step (steps 3, 7, 11) to create visual groups.

For the playhead animation, I'll add a CSS class to the current step that gives it a bright glow/border.

Let me finalize the code now.

One more thing: the grader mentions "input/change events apply it" for tempo and swing. So I need to listen for both `input` and `change` events on these inputs.

Also, for the step buttons, "Clicking toggles." So I need click handlers that toggle the pattern and update aria-pressed.

Let me also make sure the Space key handler doesn't interfere with text inputs. The spec says "unless focus is in a text input." I'll check `document.activeElement.tagName` and `document.activeElement.type`.

OK, I think I have a complete plan. Let me write the code.

Let me think about the color scheme more carefully:

Track colors (I'll use HSL for consistency):
- Kick (0): hsl(0, 80%, 55%) - red
- Snare (1): hsl(30, 80%, 55%) - orange
- Closed Hat (2): hsl(50, 80%, 55%) - yellow
- Open Hat (3): hsl(140, 70%, 45%) - green
- Clap (4): hsl(280, 70%, 60%) - purple
- Low Tom (5): hsl(200, 80%, 55%) - blue
- High Tom (6): hsl(240, 70%, 60%) - indigo
- Cowbell (7): hsl(45, 90%, 55%) - gold

Actually, let me use a more cohesive palette. Let me go with:
- Kick: #ff4444 (red)
- Snare: #ff8844 (orange)
- Closed Hat: #ffcc44 (yellow)
- Open Hat: #44cc88 (green)
- Clap: #cc44cc (magenta)
- Low Tom: #4488ff (blue)
- High Tom: #8844ff (purple)
- Cowbell: #ffcc00 (gold)

These are vivid and distinct.

For the background, I'll use a dark blue-gray: #0d1117 or #1a1a2e.

Let me write the CSS for a premium look:
- Subtle gradients
- Box shadows for depth
- Smooth transitions
- Custom scrollbar (if needed)
- Font: system font stack (no external fonts allowed)

OK, I'm going to write the complete file now. Let me be methodical.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pulse — Drum Machine</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
    --bg: #0d1117;
    --panel: #161b22;
    --panel-border: #21262d;
    --text: #c9d1d9;
    --text-dim: #8b949e;
    --accent: #58a6ff;
    --track-0: #ff4444;
    --track-1: #ff8844;
    --track-2: #ffcc44;
    --track-3: #44cc88;
    --track-4: #cc44cc;
    --track-5: #4488ff;
    --track-6: #8844ff;
    --track-7: #ffcc00;
}

body {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
}

#app {
    width: 100%;
    max-width: 1000px;
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}

/* ... more styles ... */
</style>
</head>
<body>
<div id="app">
    <!-- Header / Transport -->
    <!-- Sequencer Grid -->
    <!-- Mixer -->
    <!-- Visualizer -->
</div>
<script>
// ... all JavaScript ...
</script>
</body>
</html>
```

Let me now write the complete thing. I'll focus on getting every detail right.

For the step buttons, I need to be careful about the layout. 8 tracks × 16 steps = 128 buttons. Each button needs `data-track`, `data-step`, and `aria-pressed`.

Let me generate the HTML for the grid in JavaScript to keep it DRY.

Actually, let me generate it in the HTML directly for clarity and to ensure the grader can find the elements immediately. No wait, generating in JS is fine as long as the elements exist when the grader checks them. Since the script runs at the end of body, the elements will be in the DOM before any grader interaction.

Let me generate the grid in JS.

Now, for the localStorage persistence:
- Key: 'pulse-drum-machine'
- Value: JSON with {pattern: [[bool x16] x 8], tempo, swing, mutes: [bool x 8], volumes: [number x 8]}
- Save on any change
- Load on startup

If no saved data, use the demo pattern.

Let me write the complete code now. I'll aim for ~500-700 lines total.

Let me think about one more thing: the visualizer. I'll draw frequency bars on a canvas. The analyser provides frequency data. I'll draw 32-64 bars.

For the rAF loop that drives the visualizer and playhead:
```javascript
function drawFrame() {
    if (ctx && analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        // Draw bars
        drawSpectrum(data);
    }
    updatePlayhead();
    requestAnimationFrame(drawFrame);
}
```

This runs continuously. That's fine - it's for visualization, not for scheduling.

Let me now write the final code. I'll be very careful with every detail.

Actually, I want to double-check the swing calculation. The spec says:
"at swing s, every odd-numbered step (steps 1, 3, 5, … counting from 0) is delayed by (s/100) × ⅓ × (duration of one 16th note)"

So:
- 16th note duration = 60 / BPM / 4
- delay = (s/100) * (1/3) * (60/BPM/4) = (s/100) * (1/(3*4)) * (60/BPM) = (s/100) * 20/BPM

At 100% swing and 120 BPM:
- 16th note = 60/120/4 = 0.125s
- delay = 1.0 * (1/3) * 0.125 = 0.04167s

So step 1 is at 0.125 + 0.04167 = 0.1667s, and step 2 is at 0.25s.
The gap from step 1 to step 2 is 0.25 - 0.1667 = 0.0833s.
The gap from step 0 to step 1 is 0.1667s.

This creates the characteristic "swing" feel where the off-beats are late.

In my scheduler:
- After scheduling step n, the next step's time is:
  - If n is even: nextNoteTime + spb + delay (next is odd, delayed)
  - If n is odd: nextNoteTime + spb - delay (next is even, not delayed, so it's "earlier" relative to the odd step)

Wait, let me re-derive:
- T(0) = 0
- T(1) = spb + delay
- T(2) = 2*spb
- T(3) = 3*spb + delay
- T(4) = 4*spb

T(1) - T(0) = spb + delay
T(2) - T(1) = 2*spb - (spb + delay) = spb - delay
T(3) - T(2) = 3*spb + delay - 2*spb = spb + delay
T(4) - T(3) = 4*spb - (3*spb + delay) = spb - delay

So:
- Even → Odd: +spb + delay
- Odd → Even: +spb - delay

This is what I had before. Good.

Let me now write the complete code.

I realize I should also handle the case where tempo changes while playing. The scheduler computes `spb` from the current BPM value each time it advances, so tempo changes will naturally take effect on the next scheduled note. This is correct.

Similarly, swing changes take effect on the next note.

One potential issue: if the user changes tempo dramatically (e.g., from 40 to 240), the scheduled notes might have large gaps or overlaps. But since we only schedule 100ms ahead, this should be manageable.

Let me also add a "preset" dropdown or buttons for a few patterns. I'll add 3 presets: "House", "Rock", "Breakbeat".

And a "Randomize" button.

OK, let me write the final code now. I'll be comprehensive.

Let me also think about the playhead visual. I want:
- The step button for the current playhead position has a special glow/border
- Maybe a vertical line or highlight that sweeps across

I'll add a CSS class `playhead` to the step button at the current position.

For the micro-animations when steps trigger:
- When a step is "hit" during playback, the button should briefly flash or pulse
- I can do this by adding a class and removing it after a short timeout

Actually, since the playhead already indicates the current step, I can use the playhead class to also trigger the animation. The step buttons at the playhead position get a bright glow.

Let me also add a subtle CSS animation for the playhead:
```css
.step.playhead {
    box-shadow: 0 0 12px 2px var(--track-color);
    transform: scale(1.1);
}
```

OK, I think I have everything planned. Let me write the code.

Final structure:

```
HTML:
- #app
  - header
    - h1 "PULSE"
    - .transport
      - #play (button)
      - .control (tempo)
      - .control (swing)
      - #clear (button)
      - .presets
  - #sequencer (data-playhead="-1")
    - .track-row × 8
      - .track-label
      - .steps (16 buttons)
  - #mixer
    - .mixer-row × 8
      - button[data-mute]
      - input[data-volume]
  - #visualizer
    - canvas

JS:
- State: pattern[8][16], tempo, swing, mutes[8], volumes[8]
- Audio: ctx, masterGain, analyser, trackGains[8], noiseBuffer
- Scheduler: currentStep, nextNoteTime, isPlaying, schedulerTimer
- Synth functions: playKick, playSnare, playClosedHat, playOpenHat, playClap, playLowTom, playHighTom, playCowbell
- UI: initUI, updateStep, updatePlayhead, drawVisualizer
- Persistence: save, load
- Events: step click, play, tempo, swing, mute, volume, clear, space, presets, randomize
```

Let me write it all now.

One more consideration: the `#sequencer` element should be the container for the grid. The `data-playhead` attribute goes on it.

Let me also make sure the step buttons are `<button>` elements as required by the grader.

Here's my final code:

I need to be careful about a few things:
1. The noise buffer should be created after the AudioContext is created
2. All synth functions should only be called when the step is active AND the track is not muted
3. The scheduler should be a `setInterval` at ~25ms
4. The visualizer rAF loop should be separate from the scheduler

Let me also handle the edge case where the user clicks play without any steps active - it should still work (just no sound), and the playhead should still advance.

Actually wait, re-reading the grader: "no source starts for inactive or muted steps." So if a step is inactive, we don't create any source nodes. If a track is muted, we don't create any source nodes for that track. But the playhead still advances regardless.

OK, I think I'm ready to write the final code. Let me do it.

Let me also think about the `stop(time)` calls. The grader only records `start(when)` calls, so `stop` calls don't matter for grading. But I should still call `stop` to free resources.

One more thing: I should make sure that when I create oscillators and noise sources, I set `osc.onended` to disconnect the nodes, to prevent memory leaks. Or I can just let them garbage collect after they stop.

Actually, for a drum machine that runs for a while, I should be careful about memory. Let me add `onended` handlers to disconnect nodes.

But actually, in modern browsers, disconnected nodes that are no longer referenced will be garbage collected. Since I create new nodes for each note and don't keep references to them, they should be cleaned up. The `onended` handler is a good practice though.

Let me add it for cleanliness:
```javascript
osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
};
```

OK, now let me write the complete code. I'll aim for a polished, production-quality result.

Let me think about the layout more carefully. At 1280×800 viewport:
- The app should fit within the viewport
- 8 rows of steps
- Each row: track label (~80px) + 16 steps
- Each step: about 40px wide with gaps
- 16 steps × 40px + gaps = ~700px
- Total width: 80 + 700 + padding = ~850px
- This fits in 1000px max-width

For the step size, let me calculate:
- Available width for steps: ~900px (1000px - 80px label - 40px padding)
- 16 steps + 3 group gaps (extra) = 16 + 3 = 19 units
- Each step: ~45px, group gap: ~12px
- 16*45 + 3*12 = 720 + 36 = 756px
- Plus 15 regular gaps of 4px = 60px
- Total: 816px
- Plus label: 80px
- Plus padding: 48px
- Total: 944px ✓

This should work. Let me use CSS grid for the step layout.

Actually, let me use a simpler approach: flexbox with specific widths.

Each step button: 42px × 42px (or responsive)
Gap between steps: 4px
Extra gap after every 4th group: 12px

I'll use `margin-left` on steps that are at position 4, 8, 12 to create the group separation.

Let me finalize and write the code now. I'll use a clean, organized structure.

Here's my approach for the step grid:
- Use CSS Grid: `grid-template-columns: 80px repeat(16, 1fr)`
- Each row is a track
- Add extra gap between groups using column gap or margin

Actually, CSS Grid with `column-gap` doesn't support variable gaps easily. Let me use a different approach.

I'll create 4 groups of 4 steps each, with a gap between groups. Each group is a flex container.

```html
<div class="steps">
    <div class="step-group">
        <button data-track="0" data-step="0"></button>
        <button data-track="0" data-step="1"></button>
        <button data-track="0" data-step="2"></button>
        <button data-track="0" data-step="3"></button>
    </div>
    <div class="step-group">
        <button data-track="0" data-step="4"></button>
        ...
    </div>
    ...
</div>
```

This way, each group is a flex container with small gaps, and the groups have larger gaps between them.

OK let me just write the code now. I've been planning long enough.

Let me write a clean, complete implementation:

```javascript
// State
const TRACKS = ['Kick', 'Snare', 'Closed Hat', 'Open Hat', 'Clap', 'Low Tom', 'High Tom', 'Cowbell'];
const TRACK_COLORS = ['#ff4455', '#ff8844', '#ffcc44', '#44cc88', '#cc44cc', '#4488ff', '#8855ff', '#ffcc00'];

let pattern = Array.from({length: 8}, () => Array(16).fill(false));
let tempo = 120;
let swing = 0;
let mutes = Array(8).fill(false);
let volumes = Array(8).fill(0.8);

// Audio
let ctx = null;
let masterGain, analyser, noiseBuffer;
let trackGains = [];

// Scheduler
let isPlaying = false;
let currentStep = 0;
let nextNoteTime = 0;
let schedulerTimer = null;
const SCHEDULE_AHEAD = 0.1;
const SCHEDULER_INTERVAL = 25;
let scheduledNotes = []; // {step, time}
```

OK let me just write the whole thing in one go now. I'll be thorough and careful.

Let me also add some nice touches:
- The play button changes icon (▶ / ■)
- Tempo and swing values are displayed next to the sliders
- Track labels have colored dots
- The visualizer shows a nice spectrum
- Smooth CSS transitions on all interactive elements
- A subtle background gradient or texture

For the background, I'll use a radial gradient or a subtle pattern.

Let me write it now. Final code:

I realize I should also handle the case where the browser's AudioContext is in a suspended state. When the user clicks play for the first time, I need to create and resume the AudioContext.

```javascript
function ensureAudio() {
    if (!ctx) {
        ctx = new AudioContext();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.8;
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        masterGain.connect(analyser);
        analyser.connect(ctx.destination);
        
        // Create noise buffer
        const len = ctx.sampleRate * 2;
        noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        
        // Create track gains
        for (let i = 0; i < 8; i++) {
            const g = ctx.createGain();
            g.gain.value = volumes[i];
            g.connect(masterGain);
            trackGains.push(g);
        }
    }
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
}
```

This is called before any audio operation.

Now, for the scheduler:
```javascript
function scheduler() {
    while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
        scheduleStep(currentStep, nextNoteTime);
        scheduledNotes.push({step: currentStep, time: nextNoteTime});
        
        // Clean up old notes
        while (scheduledNotes.length > 0 && scheduledNotes[0].time < ctx.currentTime - 0.5) {
            scheduledNotes.shift();
        }
        
        advanceStep();
    }
}

function advanceStep() {
    const spb = 60 / tempo / 4;
    const delay = (swing / 100) * (1/3) * spb;
    
    if (currentStep % 2 === 0) {
        nextNoteTime += spb + delay;
    } else {
        nextNoteTime += spb - delay;
    }
    
    currentStep = (currentStep + 1) % 16;
    
    // Reset time when wrapping to step 0
    if (currentStep === 0) {
        // This is a new bar, nextNoteTime is already correct
    }
}
```

Wait, there's an issue with my approach. When I wrap from step 15 to step 0, the time calculation should be consistent. Let me think...

T(0) = barStart + 0
T(1) = barStart + spb + delay
T(2) = barStart + 2*spb
T(3) = barStart + 3*spb + delay
...
T(14) = barStart + 14*spb
T(15) = barStart + 15*spb + delay

Next bar:
T(16) = barStart + 16*spb = barStart + 4*spb (new bar)

So T(16) - T(15) = 16*spb - (15*spb + delay) = spb - delay

This is consistent with "odd → even: +spb - delay" (step 15 is odd, step 16=0 is even).

So my advanceStep function is correct. The time naturally wraps around.

But wait, there's a subtle issue. When I compute `nextNoteTime` incrementally, floating point errors might accumulate over many bars. To avoid this, I could compute the absolute time for each step from a reference:

```javascript
let barStartTime = 0; // time when the current bar's step 0 plays

function advanceStep() {
    currentStep = (currentStep + 1) % 16;
    if (currentStep === 0) {
        barStartTime += 16 * (60 / tempo / 4);
    }
    nextNoteTime = barStartTime + currentStep * (60 / tempo / 4) + 
                   (currentStep % 2 === 1 ? (swing / 100) * (1/3) * (60 / tempo / 4) : 0);
}
```

But this has a problem: if tempo changes mid-bar, the times for subsequent steps in the same bar would be wrong because they'd be computed with the new tempo but relative to the old bar start.

Hmm, actually for a drum machine, tempo changes taking effect mid-bar is fine - the remaining steps just use the new tempo. The absolute time approach would actually work if I compute the time for the current step based on the previous step's time:

```javascript
function advanceStep() {
    const spb = 60 / tempo / 4;
    const delay = (swing / 100) * (1/3) * spb;
    
    if (currentStep % 2 === 0) {
        nextNoteTime += spb + delay;
    } else {
        nextNoteTime += spb - delay;
    }
    
    currentStep = (currentStep + 1) % 16;
}
```

This incremental approach is simpler and handles tempo/swing changes naturally. The floating point error is negligible for practical purposes (after thousands of steps, the error would be in the microsecond range).

Let me go with the incremental approach.

OK, I'm going to write the final code now. No more planning.

Let me also think about one edge case: when the user changes tempo while playing, the `spb` changes, so the next note is at a different interval. This is correct behavior.

Another edge case: when swing changes from 0 to 100 while playing, the next note's timing shifts. This is also correct.

One more thing: the playhead. When I update `data-playhead`, I should do it in the rAF loop based on `ctx.currentTime`. The playhead should show the step that was most recently started (whose start time is <= currentTime).

```javascript
function updatePlayhead() {
    if (!isPlaying || !ctx) {
        sequencerEl.dataset.playhead = '-1';
        return;
    }
    const now = ctx.currentTime;
    let current = -1;
    for (const note of scheduledNotes) {
        if (note.time <= now) {
            current = note.step;
        } else {
            break;
        }
    }
    sequencerEl.dataset.playhead = String(current);
}
```

This should work. The `scheduledNotes` array contains all scheduled notes, and I find the last one whose time has passed.

I also need to visually highlight the step buttons at the playhead position. I'll do this in the rAF loop:
- Remove the `playhead` class from all step buttons
- Add it to the step buttons at the current playhead position (all 8 tracks)

Actually, for performance, I should only update when the playhead changes. Let me track the previous playhead value.

OK, writing the code now. For real this time.

Let me think about the visualizer one more time. I'll draw a frequency spectrum with colored bars. The bars will be colored based on their frequency (low = warm, high = cool) or based on the track colors.

I'll use a simple approach: 64 bars, colored with a gradient from the track colors.

```javascript
function drawVisualizer() {
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    
    const canvas = document.getElementById('viz-canvas');
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, canvas.width, canvas.height);
    
    const barCount = 64;
    const barWidth = canvas.width / barCount;
    
    for (let i = 0; i < barCount; i++) {
        const value = data[i * 2] / 255; // Sample every other bin
        const barHeight = value * canvas.height;
        
        // Color based on position
        const hue = 200 - (i / barCount) * 160; // Blue to orange
        c.fillStyle = `hsl(${hue}, 80%, ${40 + value * 30}%)`;
        c.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
    }
}
```

This should look nice.

OK, NOW I'm writing the final code. Let me be very careful and thorough.

Let me reconsider the layout. I want:
1. Header with title and transport controls
2. Step grid
3. Mixer (below the grid, aligned with track labels)
4. Visualizer

For the mixer, I'll put it to the left of each track row, or below the grid. Let me put it below the grid as a separate section.

Actually, for a hardware feel, let me put the mixer to the right of the grid. Each track row has: [label] [steps] [mute] [volume slider].

This is more like a real drum machine where the mixer is integrated.

Let me do:
```
[Kick    ] [● ● ● ●] [● ● ● ●] [● ● ● ●] [● ● ● ●] [M] [=====|   ]
[Snare   ] [● ● ● ●] [● ● ● ●] [● ● ● ●] [● ● ● ●] [M] [=====|   ]
...
```

This is clean and functional.

For the mixer section, I'll add a small mute button and a volume slider to the right of each row.

Let me adjust the layout:
- Track label: 80px
- Steps: 16 × 40px + gaps ≈ 700px
- Mute: 30px
- Volume: 80px
- Total: ~900px

This fits in 1000px.

OK, final code coming up. I'll write it all in one go.

Let me also add keyboard shortcut hints in the UI (e.g., "Space" for play).

And I'll add a few preset buttons: "House", "Rock", "Funky", "Random".

Here's my final plan for the HTML structure:

```html
<div id="app">
  <div class="header">
    <h1>PULSE</h1>
    <div class="transport">
      <button id="play">▶</button>
      <div class="control">
        <label>TEMPO</label>
        <input type="range" id="tempo" min="40" max="240" value="120">
        <span class="value" id="tempo-val">120</span>
      </div>
      <div class="control">
        <label>SWING</label>
        <input type="range" id="swing" min="0" max="100" value="0">
        <span class="value" id="swing-val">0</span>
      </div>
      <button id="clear">CLR</button>
    </div>
    <div class="presets">
      <button data-preset="house">House</button>
      <button data-preset="rock">Rock</button>
      <button data-preset="funky">Funky</button>
      <button data-preset="random">Random</button>
    </div>
  </div>
  
  <div id="sequencer" data-playhead="-1">
    <!-- Generated by JS -->
  </div>
  
  <div id="visualizer">
    <canvas id="viz-canvas"></canvas>
  </div>
</div>
```

OK, I'm writing the final code now. Here goes:

Actually, I want to reconsider the step button size. At 1280px viewport with 1000px max-width app:
- Padding: 24px × 2 = 48px
- Available: 952px
- Track label: 90px
- Mute: 32px
- Volume: 80px
- Gaps: ~20px
- Available for steps: 952 - 90 - 32 - 80 - 20 = 730px
- 16 steps + 3 group gaps
- If group gap = 12px, regular gap = 3px
- 16 × step + 15 × 3 + 3 × 12 = 730
- 16 × step + 45 + 36 = 730
- 16 × step = 649
- step ≈ 40px

So 40px step buttons. That works.

Let me use CSS custom properties for the step size and make it responsive.

Actually, let me just use flexible sizing. Each step button will be a flexible width that fills the available space.

I'll use CSS Grid for the entire sequencer:
```css
#sequencer {
    display: grid;
    grid-template-columns: 90px repeat(16, 1fr) 32px 80px;
    gap: 3px;
    /* Extra gap between groups handled by column gap or margin */
}
```

Hmm, but I need extra gap between groups of 4. CSS Grid doesn't natively support variable column gaps. I can work around this by using `column-gap` and adding extra margin to specific columns.

Or I can use a different approach: wrap each group of 4 in a container.

Let me use this structure:
```html
<div class="track-row">
    <div class="track-label">Kick</div>
    <div class="step-group">
        <button data-track="0" data-step="0"></button>
        <button data-track="0" data-step="1"></button>
        <button data-track="0" data-step="2"></button>
        <button data-track="0" data-step="3"></button>
    </div>
    <div class="step-group">
        <button data-track="0" data-step="4"></button>
        ...
    </div>
    <div class="step-group">
        <button data-track="0" data-step="8"></button>
        ...
    </div>
    <div class="step-group">
        <button data-track="0" data-step="12"></button>
        ...
    </div>
    <button data-mute="0" aria-pressed="false">M</button>
    <input type="range" data-volume="0" min="0" max="100" value="80">
</div>
```

With CSS:
```css
.track-row {
    display: flex;
    align-items: center;
    gap: 4px;
}

.step-group {
    display: flex;
    gap: 3px;
}

.track-row + .track-row {
    margin-top: 4px;
}
```

This is clean and works well. Let me go with this.

Now let me write the complete code. I'll generate the track rows in JavaScript.

Final code:

Let me be very precise about the grader contract:

1. ✅ 128 `<button>` elements with `data-track="0".."7"` and `data-step="0".."15"` and `aria-pressed`
2. ✅ `#play` button, Space bar toggles
3. ✅ `#tempo` input, `input`/`change` events
4. ✅ `#swing` input, 0-100, `input`/`change` events
5. ✅ `data-mute="0".."7"` buttons with `aria-pressed`, `data-volume="0".."7"` inputs
6. ✅ `#sequencer` with `data-playhead`
7. ✅ Timing: `start(when)` with correct time, no extra sources, one AudioContext

Let me make sure I handle the Space key correctly:
```javascript
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePlay();
    }
});
```

Wait, I should also check for `e.target.type` in case it's an input of a specific type. The spec says "unless focus is in a text input." So I should check if the target is an input with type text, or a textarea. But actually, range inputs are also inputs, and I don't want Space to trigger play when a range input is focused (because Space might be used to interact with it, though range inputs don't use Space by default).

Let me be safe and check:
```javascript
if (e.code === 'Space') {
    const tag = e.target.tagName;
    const type = e.target.type;
    if (tag === 'INPUT' && (type === 'text' || type === 'number' || type === 'search' || type === 'url' || type === 'email' || type === 'password' || tag === 'TEXTAREA')) {
        return; // Don't intercept
    }
    e.preventDefault();
    togglePlay();
}
```

Actually, the spec says "unless focus is in a text input." I'll interpret this as: if the focused element is a text-like input (text, number, search, url, email, password) or a textarea, don't intercept. Range inputs should still trigger play with Space.

Hmm, but if a range input is focused and I press Space, the browser might not do anything with it (range inputs don't use Space). So it's safe to intercept Space for range inputs.

Let me simplify:
```javascript
if (e.code === 'Space') {
    const el = e.target;
    if (el.tagName === 'INPUT' && ['text', 'number', 'search', 'url', 'email', 'password'].includes(el.type)) return;
    if (el.tagName === 'TEXTAREA') return;
    e.preventDefault();
    togglePlay();
}
```

This should work.

OK, I'm writing the final code now. For real. Let me just type it all out.

Let me also think about the "accents" feature mentioned as optional. I'll skip it to keep things focused.

For the presets, I'll define a few patterns:

```javascript
const PRESETS = {
    house: {
        pattern: [
            [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], // Kick: four on the floor
            [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0], // Snare
            [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], // Closed Hat: 8ths
            [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0], // Open Hat
            [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], // Clap: on 2 and 4
            [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1], // Low Tom
            [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], // High Tom
            [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], // Cowbell
        ]
    },
    rock: {
        pattern: [
            [1,0,0,0, 0,0,0,1, 1,0,0,0, 0,0,1,0], // Kick
            [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], // Snare
            [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], // Closed Hat
            [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1], // Open Hat
            [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], // Clap
            [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0], // Low Tom
            [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], // High Tom
            [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], // Cowbell
        ]
    },
    funky: {
        pattern: [
            [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0], // Kick
            [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0], // Snare
            [1,0,1,1, 0,1,0,1, 1,0,1,1, 0,1,0,1], // Closed Hat
            [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1], // Open Hat
            [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0], // Clap
            [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1], // Low Tom
            [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0], // High Tom
            [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0], // Cowbell
        ]
    }
};
```

OK, now I'm truly writing the final code. Let me structure it well.

One more thought on the visual design: I want the step buttons to have a subtle 3D effect. When off, they look like recessed buttons. When on, they light up with the track color and have a glow. The playhead step has an extra bright border or ring.

CSS for step buttons:
```css
.step-btn {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 6px;
    background: #1c2333;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
    cursor: pointer;
    transition: all 0.1s ease;
}

.step-btn:hover {
    background: #252d3f;
}

.step-btn[aria-pressed="true"] {
    background: var(--tc);
    box-shadow: 0 0 10px var(--tc), 0 0 20px color-mix(in srgb, var(--tc) 50%, transparent);
    transform: translateY(-1px);
}

.step-btn.playhead {
    box-shadow: 0 0 15px var(--tc), 0 0 30px var(--tc), inset 0 0 5px rgba(255,255,255,0.3);
    transform: scale(1.05);
}
```

I'll set `--tc` (track color) as a CSS custom property on each row.

This should look great. Let me finalize and write the code.

I just realized I should also handle the case where the user resizes the window. The visualizer canvas should resize with the window. I'll add a resize handler.

```javascript
function resizeCanvas() {
    const canvas = document.getElementById('viz-canvas');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}
window.addEventListener('resize', resizeCanvas);
```

OK, here's the complete code. I'll write it all out now.

Let me also make sure the `#play` button has clear visual feedback:
- When stopped: shows ▶ (play icon)
- When playing: shows ■ (stop icon) and has a different color

I'll use Unicode characters: ▶ (U+25B6) and ■ (U+25A0).

Or I can use CSS to draw the icons. Let me use Unicode for simplicity.

Actually, let me use text: "PLAY" / "STOP". Or icons. Let me use both: an icon and text.

For the play button, I'll make it larger and more prominent:
```html
<button id="play" class="play-btn">▶</button>
```

When playing, it becomes:
```html
<button id="play" class="play-btn playing">■</button>
```

OK, writing the final code now. I'll be thorough and make sure everything works.

Let me also add a BPM display that updates when the tempo slider changes.

And a swing display.

Here's my final, complete code:

I need to be careful with the `input` events on range inputs. In some browsers, `input` fires continuously while dragging, and `change` fires when the user releases. I should handle both.

For the tempo and swing:
```javascript
tempoInput.addEventListener('input', () => {
    tempo = parseInt(tempoInput.value);
    tempoVal.textContent = tempo;
    save();
});
tempoInput.addEventListener('change', () => {
    tempo = parseInt(tempoInput.value);
    tempoVal.textContent = tempo;
    save();
});
```

Same for swing.

OK, I'm going to write the complete code now. Let me be very careful and make sure every requirement is met.

Let me also think about the localStorage format:
```json
{
    "pattern": [[0,0,1,0,...], ...],
    "tempo": 120,
    "swing": 0,
    "mutes": [0,0,0,0,0,0,0,0],
    "volumes": [80,80,80,80,80,80,80,80]
}
```

I'll use 0/1 for booleans to keep the JSON compact.

On load:
```javascript
function load() {
    try {
        const data = JSON.parse(localStorage.getItem('pulse-dm'));
        if (data) {
            pattern = data.pattern.map(row => row.map(v => v === 1));
            tempo = data.tempo || 120;
            swing = data.swing || 0;
            mutes = data.mutes.map(v => v === 1);
            volumes = data.volumes || Array(8).fill(80);
            return true;
        }
    } catch(e) {}
    return false;
}
```

If no saved data, use the demo pattern.

OK, FINAL CODE. Writing now.

Let me also add a nice touch: when you hover over a track label, it highlights all steps in that row. And when you click a track label, it toggles all steps in that row. (Optional, but nice.)

Actually, let me skip that to keep things focused. The grader cares about specific elements.

Let me also make sure the step buttons are keyboard accessible. They're `<button>` elements, so they should be focusable and activatable with Enter/Space by default. But Space is also the play toggle... I need to be careful.

When a step button is focused and the user presses Space, the button's default behavior (toggle) should take precedence over the play toggle. Let me handle this:

```javascript
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        const el = e.target;
        if (el.tagName === 'BUTTON') {
            // Let the button handle it (default behavior)
            return;
        }
        if (el.tagName === 'INPUT' && ['text','number','search','url','email','password'].includes(el.type)) return;
        if (el.tagName === 'TEXTAREA') return;
        e.preventDefault();
        togglePlay();
    }
});
```

Wait, but the grader expects Space to toggle play. If the step button is focused and Space is pressed, the button toggles (default behavior) and the play doesn't toggle. That's correct behavior - the focused element takes priority.

But the grader might press Space when no specific element is focused (or when body is focused). In that case, the document-level handler catches it and toggles play.

Actually, if a button is focused and Space is pressed, the browser fires a `click` event on the button. My step button click handler toggles the step. The Space keydown handler should NOT also toggle play in this case.

My handler above handles this correctly: if the target is a BUTTON, we return early and let the default behavior (click) happen.

But wait, the mute buttons are also BUTTONs. If a mute button is focused and Space is pressed, it should toggle the mute, not play. My handler handles this correctly.

And the play button itself is a BUTTON. If it's focused and Space is pressed, it should toggle play (default button click behavior). My handler returns early for BUTTON targets, so the default click behavior fires, which calls `togglePlay()`. This is correct.

Great, my handler is correct.

One more thing: the grader might click the play button with a mouse, or press Space when nothing is focused. Both should work. My handler covers both cases.

OK, I'm writing the final code now. No more planning. Here goes:

Wait, one more thing. I need to make sure the `#sequencer` element wraps the grid. The grader checks `data-playhead` on `#sequencer`. So the grid rows should be children of `#sequencer`.

```html
<div id="sequencer" data-playhead="-1">
    <div class="track-row" style="--tc: #ff4455">
        <div class="track-label"><span class="dot"></span>Kick</div>
        <div class="step-group">
            <button data-track="0" data-step="0" aria-pressed="false"></button>
            ...
        </div>
        ...
        <button data-mute="0" aria-pressed="false" class="mute-btn">M</button>
        <input type="range" data-volume="0" min="0" max="100" value="80" class="vol-slider">
    </div>
    ...
</div>
```

This puts the mixer inline with each track row. The `#sequencer` element contains everything.

OK, NOW I'm writing the code. Final answer coming up.

Let me structure the JavaScript:

1. Constants and state
2. Audio initialization
3. Synthesis functions
4. Scheduler
5. UI initialization (generate grid)
6. Event handlers
7. Persistence
8. Visualizer
9. Presets
10. Init

Let me write it all out now.

For the synthesis, I want to make sure the sounds are good. Let me refine each one:

**Kick:**
- Sine wave, 150Hz → 40Hz over 50ms
- Gain: 1.0 → 0.001 over 300ms (exponential)
- Click: short noise burst, lowpass at 3000Hz, 20ms
- Overall: punchy, warm

**Snare:**
- Noise: bandpass at 1800Hz, Q=0.7, decay 150ms
- Tone: triangle 200Hz → 150Hz over 80ms, decay 100ms
- Overall: crisp, snappy

**Closed Hat:**
- Noise: highpass at 8000Hz, decay 40ms
- Gain: 0.5
- Overall: tight, bright

**Open Hat:**
- Noise: highpass at 7000Hz, decay 250ms
- Gain: 0.5
- Overall: open, bright, sustained

**Clap:**
- Noise: bandpass at 1000Hz, Q=1.5
- Multi-peak envelope: quick peaks at 0ms, 10ms, 20ms, then decay over 150ms
- Gain: 0.6
- Overall: realistic clap

**Low Tom:**
- Sine 80Hz → 60Hz over 100ms
- Gain: 0.8 → 0.001 over 250ms
- Overall: deep, resonant

**High Tom:**
- Sine 160Hz → 120Hz over 80ms
- Gain: 0.8 → 0.001 over 200ms
- Overall: mid, punchy

**Cowbell:**
- Two square waves: 540Hz and 800Hz
- Bandpass at 800Hz, Q=2
- Gain: 0.3 → 0.001 over 120ms
- Overall: metallic, distinctive

These should sound good. Let me write the code.

Actually, for the clap, I want to make sure all `start(when)` calls use the same `when` value. Since I'm using a single noise source with a shaped envelope, this is automatically satisfied.

Let me also add a slight distortion to the kick for more punch:
- After the gain, add a WaveShaperNode with a soft clipping curve
- This adds harmonics and makes the kick sound more aggressive

```javascript
function createDistortionCurve(amount) {
    const k = amount;
    const n = 44100;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const x = (i / n) * 2 - 1;
        curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
    return curve;
}
```

Hmm, this adds complexity. Let me skip the distortion for now and keep the synthesis clean. The sounds should be good enough with just oscillators and filters.

OK, FINAL CODE. Writing now. I promise.

Let me estimate the file size. With all the HTML, CSS, and JS, it'll be around 800-1000 lines. That's fine for a single file.

Here we go:
