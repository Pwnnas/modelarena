Let me break down this task:

1. Build a 16-step drum machine with 8 tracks
2. All sounds synthesized with Web Audio API
3. Sample-accurate timing with lookahead scheduler
4. Hardware-like UI
5. Follow the grader contract exactly

Let me plan the architecture:

**Tracks (top to bottom):**
0. Kick
1. Snare
2. Closed Hat
3. Open Hat
4. Clap
5. Low Tom
6. High Tom
7. Cowbell

**Grader Contract:**
- 128 step toggle buttons with `data-track="0".."7"` and `data-step="0".."15"`, `aria-pressed`
- `#play` button
- `#tempo` input (range or number)
- `#swing` input (range or number, 0-100)
- Mute toggles: `button[data-mute="0".."7"]` with `aria-pressed`
- Volume sliders: `input[data-volume="0".."7"]`
- `#sequencer` element with `data-playhead` attribute
- Timing verification: `start(when)` calls must be exact note times
- One AudioContext, created/resumed on first user interaction

**Sound Synthesis:**
- Kick: Sine oscillator with pitch envelope (150Hz → 40Hz), gain envelope
- Snare: Noise burst + tone (oscillator), bandpass filter
- Closed Hat: High-pass filtered noise, short decay
- Open Hat: High-pass filtered noise, longer decay
- Clap: Noise with bandpass, multiple bursts
- Low Tom: Sine oscillator ~80Hz, medium decay
- High Tom: Sine oscillator ~150Hz, medium decay
- Cowbell: Two square/sawtooth oscillators at specific frequencies, bandpass

**Scheduler:**
- Lookahead scheduler: use setInterval (every ~25ms) to check if we need to schedule notes
- Schedule notes ~100ms ahead
- Use AudioContext.currentTime for all timing
- Track the next note time and step index

**Swing:**
- For odd steps (1, 3, 5, ...), delay by (swing/100) × (1/3) × (16th note duration)

**Playhead:**
- The playhead should highlight the step currently being heard
- Since we schedule ahead, we need to update the playhead based on when the note was actually scheduled to play
- Use a separate mechanism (like checking currentTime against scheduled note times) to update the playhead

Wait, the grader says `data-playhead` is the step "currently being heard". Since we schedule ahead, I need to track which note is currently playing. I'll keep an array of scheduled notes with their times, and on each animation frame (or interval), check which note's time is closest to currentTime.

Actually, let me think about this more carefully. The scheduler schedules notes ahead of time. The playhead should show which step is currently being heard. So I need to:
1. Keep track of all scheduled notes (step index, scheduled time)
2. On each frame, find the most recent note whose time <= currentTime
3. Update the playhead to that step

Let me think about the timing more carefully:

- 16th note duration = 60 / BPM / 4 seconds
- For step i:
  - base_time = startTime + i * stepDuration
  - if i is odd: base_time += (swing/100) * (1/3) * stepDuration

The scheduler:
- Keep `nextStepTime` and `nextStepIndex`
- On each tick (setInterval ~25ms):
  - While `nextStepTime < ctx.currentTime + lookahead`:
    - Schedule note for `nextStepIndex` at `nextStepTime`
    - Advance to next step
    - If nextStepIndex >= 16, wrap to 0 and add barDuration

When tempo changes during playback, I need to recalculate. The key insight is that `nextStepTime` is always in absolute AudioContext time, so when tempo changes, the next step's time is already set, but subsequent steps will use the new tempo.

Actually, let me reconsider. The standard approach:
- `nextNoteTime` = the time the next note should play
- `currentStep` = which step we're about to schedule
- On each scheduler tick:
  - While `nextNoteTime < ctx.currentTime + lookahead`:
    - If not muted and step is active, trigger the sound at `nextNoteTime`
    - Record the scheduled time for playhead
    - Calculate the time for the next step:
      - `stepDuration = 60 / bpm / 4`
      - `swingDelay = (swing/100) * (1/3) * stepDuration` (for odd steps)
      - `nextNoteTime += stepDuration + swingDelay` (if current step is odd)
      - `nextNoteTime += stepDuration` (if current step is even)
    - `currentStep = (currentStep + 1) % 16`

Wait, the swing delay applies to the odd step itself, not between steps. Let me re-read:

"every odd-numbered step (steps 1, 3, 5, … counting from 0) is delayed by (s/100) × ⅓ × (duration of one 16th note)"

So step 1 plays at: base_time + delay
Step 2 plays at: step 1's time + stepDuration (the next step starts after the previous one's duration)

Actually no, I think the swing means:
- Step 0: t = 0
- Step 1: t = stepDuration + swingDelay (delayed)
- Step 2: t = 2 * stepDuration (back on the grid)
- Step 3: t = 3 * stepDuration + swingDelay
- etc.

So the absolute time of step i is:
- If i is even: i * stepDuration
- If i is odd: i * stepDuration + swingDelay

Where swingDelay = (swing/100) * (1/3) * stepDuration

This makes more sense for swing. The odd steps are pushed later, creating the "swing" feel.

Let me recalculate the scheduler:
- `nextNoteTime` for step i:
  - If i is even: `baseTime + i * stepDuration`
  - If i is odd: `baseTime + i * stepDuration + swingDelay`

But this is tricky for a running scheduler because we need to calculate the absolute time. Let me use a different approach:

Track `nextNoteTime` as an absolute time. When advancing from step i to step i+1:
- The time difference between step i and step i+1 depends on whether i is even or odd
- If i is even (0, 2, 4...): next step is odd, so it's delayed
  - Time from step i to step i+1 = stepDuration + swingDelay - 0 = stepDuration + swingDelay
  Wait, that's not right either.

Let me think of it differently. The absolute time of step i:
- t(i) = i * stepDuration + (i % 2 === 1 ? swingDelay : 0)

So the time difference between step i and step i+1:
- If i is even: t(i+1) - t(i) = (i+1)*stepDuration + swingDelay - i*stepDuration = stepDuration + swingDelay
- If i is odd: t(i+1) - t(i) = (i+1)*stepDuration - (i*stepDuration + swingDelay) = stepDuration - swingDelay

This makes sense! The even-to-odd gap is longer (step + delay), and the odd-to-even gap is shorter (step - delay). This creates the swing feel.

So in the scheduler:
```
if (currentStep % 2 === 0) {
  nextNoteTime += stepDuration + swingDelay;
} else {
  nextNoteTime += stepDuration - swingDelay;
}
```

Wait, but when we cross a bar boundary, we need to handle that. The total bar duration is:
- 8 even steps * stepDuration + 8 odd steps * (stepDuration + swingDelay) - 8 * swingDelay
- = 16 * stepDuration + 8 * swingDelay - 8 * swingDelay
- = 16 * stepDuration

So the bar duration is just 16 * stepDuration regardless of swing. Good.

Now for the playhead: I'll keep an array of {step, time} for scheduled notes. On each animation frame, I find the last note where time <= ctx.currentTime and update the playhead.

Let me now think about the UI design:

I want it to look like a hardware drum machine. Dark theme, with:
- A main grid of 8×16 step buttons
- Track labels on the left
- Mute buttons and volume sliders per track
- Transport controls (play, clear, tempo, swing)
- A visualizer at the top or bottom
- Nice glowing effects

Color scheme: Dark background (#1a1a2e or similar), with accent colors for each track.

Let me design the layout:
- Top: Title + visualizer
- Middle: Step grid with track labels
- Left of grid: Track name + mute + volume
- Bottom: Transport controls (play, clear, tempo slider, swing slider)

For the step buttons, I'll use a grid layout. Each group of 4 steps will have a slight gap between them.

Let me code this up now.

For the sounds:

**Kick:**
- Oscillator: sine, frequency 150→40 Hz over ~100ms
- Gain: 1→0 over ~300ms (exponential)
- Maybe add a click: short noise burst at the start

**Snare:**
- Noise: white noise, bandpass at ~1000Hz, gain envelope 0.5→0 over ~200ms
- Tone: sine at 200Hz, gain 0.3→0 over ~100ms

**Closed Hat:**
- Noise: white noise, highpass at 7000Hz, gain 1→0 over ~50ms

**Open Hat:**
- Noise: white noise, highpass at 7000Hz, gain 1→0 over ~300ms

**Clap:**
- Noise: white noise, bandpass at ~1000Hz
- Multiple gain peaks (3-4 bursts) over ~200ms
- Or: noise with a specific envelope shape

**Low Tom:**
- Oscillator: sine, 80Hz, gain 1→0 over ~300ms

**High Tom:**
- Oscillator: sine, 150Hz, gain 1→0 over ~200ms

**Cowbell:**
- Two oscillators: square at 540Hz and 800Hz (or similar)
- Bandpass filter
- Gain: 1→0 over ~300ms

Let me refine these to sound better.

For the noise buffer, I'll create a 1-second buffer of white noise and reuse it.

Now let me write the full code:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pulse — Drum Machine</title>
<style>
/* CSS here */
</style>
</head>
<body>
<!-- HTML here -->
<script>
// JS here
</script>
</body>
</html>
```

Let me write out the full implementation now. I need to be careful about:
1. The grader contract (exact IDs, data attributes, aria-pressed)
2. No continuously running sources (no loop buffers, no sustained oscillators)
3. Only start() sources for active, non-muted steps
4. Sample-accurate timing
5. One AudioContext, created/resumed on first interaction

For the playhead, I need to be careful. The `data-playhead` should be the step "currently being heard". Since we schedule ahead, I'll use a requestAnimationFrame loop to check the current time against scheduled note times.

Actually, re-reading the requirements: "A playhead highlights the step currently being heard, in sync with the audio." And the grader checks `data-playhead` on `#sequencer`.

I'll maintain a queue of {step, time} and on each frame, find the most recent one where time <= currentTime.

Let me also think about the "no continuously running sources" rule. This means:
- No oscillator that runs indefinitely
- No looping AudioBufferSourceNode
- All sources must have a finite duration (start and stop, or just start with a finite buffer)

For my synthesis, I'll use:
- Oscillators: start(when), stop(when + duration)
- AudioBufferSourceNode: start(when) (the buffer has a finite length, so it stops naturally)

This should be fine. The analyser node is not a source, so that's OK.

Let me also make sure I don't start any source for inactive or muted steps. The scheduler should check:
- Is the step active (toggled on)?
- Is the track not muted?
Only then create and start the audio nodes.

Now let me write the complete code. This is going to be long but I'll make it comprehensive.

For the visualizer, I'll use a canvas with an AnalyserNode. I'll draw a frequency spectrum or waveform.

Let me also add a demo beat on first load (if localStorage is empty).

Demo beat (a basic house/techno pattern):
- Kick: 0, 4, 8, 12
- Snare: 4, 12
- Closed Hat: 0, 2, 4, 6, 8, 10, 12, 14
- Open Hat: 2, 6, 10, 14
- Clap: 4, 12
- Low Tom: 0
- High Tom: 14
- Cowbell: 7, 15

Actually let me make it a bit more interesting:
- Kick: 0, 4, 8, 12
- Snare: 4, 12
- Closed Hat: 0, 2, 4, 6, 8, 10, 12, 14
- Open Hat: 2, 10
- Clap: 4, 12
- Low Tom: 14
- High Tom: 7
- Cowbell: 7, 15

Let me finalize and write the code.

One more consideration: the `#sequencer` element. I'll make the entire step grid container have `id="sequencer"`.

Let me also think about the visual design more carefully:

- Background: dark gradient (#0a0a1a to #1a1a2e)
- Step buttons: rounded rectangles, dark when inactive, glowing when active
- Each track has a unique accent color
- Track 0 (Kick): red/coral
- Track 1 (Snare): orange
- Track 2 (Closed Hat): yellow
- Track 3 (Open Hat): lime
- Track 4 (Clap): green
- Track 5 (Low Tom): cyan
- Track 6 (High Tom): blue
- Track 7 (Cowbell): purple

- Playhead: a glowing column that moves across the steps
- Active steps: filled with the track's color, with a glow
- Inactive steps: dark with a subtle border
- Muted track: dimmed

Let me write this out now. I'll aim for a polished, hardware-like feel.

For the micro-animations:
- When a step triggers during playback, it should pulse/flash
- The playhead column should glow
- Buttons should have hover effects
- Play button should have a distinct look when playing

Let me code this up properly now.

One important detail: the `start(when)` calls. The grader records every `start(when)` call. I need to make sure:
1. I only call `start(when)` with the exact intended note time
2. I never call `start()` without a time argument (or with `ctx.currentTime` as a "now" for non-note purposes)
3. No continuously running sources

For my synthesis, every voice will be:
- Create oscillator/buffer source
- Set up the envelope
- Call `source.start(when)` where `when` is the exact note time
- Call `source.stop(when + duration)` for oscillators

This should be clean.

Let me also handle the case where the AudioContext is suspended. I'll create it lazily on first interaction (play button click, or any user gesture).

Actually, re-reading: "Use one AudioContext, created or resumed on the first user interaction." So I should create it on the first click/keypress, or resume it if it's suspended.

Let me structure the code:

```javascript
let ctx = null;
let noiseBuffer = null;

function ensureContext() {
  if (!ctx) {
    ctx = new AudioContext();
    // Create noise buffer
    const len = ctx.sampleRate * 1;
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}
```

Now for the scheduler:

```javascript
let isPlaying = false;
let currentStep = 0;
let nextNoteTime = 0;
let scheduledNotes = []; // {step, time}
let schedulerTimer = null;

const LOOKAHEAD = 0.1; // 100ms
const SCHEDULER_INTERVAL = 25; // ms

function schedulerTick() {
  while (nextNoteTime < ctx.currentTime + LOOKAHEAD) {
    scheduleNote(currentStep, nextNoteTime);
    scheduledNotes.push({step: currentStep, time: nextNoteTime});
    
    // Calculate next note time
    const stepDuration = 60 / tempo / 4;
    const swingDelay = (swing / 100) * (1/3) * stepDuration;
    
    if (currentStep % 2 === 0) {
      nextNoteTime += stepDuration + swingDelay;
    } else {
      nextNoteTime += stepDuration - swingDelay;
    }
    
    currentStep = (currentStep + 1) % 16;
  }
}
```

Wait, I need to be more careful with the swing calculation. Let me re-derive:

The absolute time of step i in a bar starting at `barStartTime`:
- t(i) = barStartTime + i * stepDuration + (i % 2 === 1 ? swingDelay : 0)

So the time difference from step i to step i+1:
- If i is even: t(i+1) - t(i) = (i+1)*stepDuration + swingDelay - i*stepDuration = stepDuration + swingDelay
- If i is odd: t(i+1) - t(i) = (i+1)*stepDuration - (i*stepDuration + swingDelay) = stepDuration - swingDelay

This is correct. But I need to handle the bar wrap-around. When going from step 15 to step 0 of the next bar:
- t(15) = barStart + 15*stepDuration + swingDelay (15 is odd)
- t(0) of next bar = barStart + 16*stepDuration
- Difference = 16*stepDuration - 15*stepDuration - swingDelay = stepDuration - swingDelay

So the same formula works! If step 15 is odd, the gap to step 0 of next bar is stepDuration - swingDelay. 

But wait, I need to track the bar start time, or I can just use the incremental approach. Let me use the incremental approach:

When advancing from step i to step i+1 (or to step 0 of next bar):
- If i is even: nextNoteTime += stepDuration + swingDelay
- If i is odd: nextNoteTime += stepDuration - swingDelay

This works for all cases including the bar wrap, because:
- Step 15 (odd) → Step 0 (next bar): gap = stepDuration - swingDelay ✓
- Step 14 (even) → Step 15 (odd): gap = stepDuration + swingDelay ✓

The total bar duration = 8*(stepDuration + swingDelay) + 8*(stepDuration - swingDelay) = 16*stepDuration ✓

Now, when tempo or swing changes during playback, the current `nextNoteTime` is already set. The next step's time will be calculated using the new tempo/swing. This means there might be a slight jump, but it's the standard approach and should be acceptable.

Actually, to be more precise: when tempo changes, the `stepDuration` changes. The next note time is already fixed (it was calculated with the old tempo). So the gap between the last scheduled note and the next one will be different. This is fine - it's the expected behavior for a live tempo change.

Let me now write the complete implementation. I'll be thorough.

For the visualizer, I'll use a canvas and draw a frequency spectrum. I'll connect the master output to an AnalyserNode.

Signal chain:
- Each voice → track gain → master gain → analyser → destination

Wait, I need to be careful. The analyser should be after the master gain so it shows the full mix. But I also need per-track gain for the volume sliders.

Signal chain:
- Voice nodes → track gain node (per track) → master gain → analyser → destination

The track gain node is created once per track and persists. The voice nodes are created and destroyed per note.

Actually, for the "muted track must not trigger any voice (don't create/start nodes for it)" requirement, I just need to check the mute state before creating any nodes. The track gain can be set to 0 for muted tracks, but the requirement says don't create nodes at all. So I'll just skip the entire voice creation for muted tracks.

Let me finalize the design and write the code.

Here's my plan for the HTML structure:

```html
<div id="app">
  <header>
    <h1>PULSE</h1>
    <canvas id="visualizer"></canvas>
  </header>
  <div id="main">
    <div id="sequencer" data-playhead="-1">
      <!-- Track rows -->
      <!-- Each row: track label, mute button, volume slider, 16 step buttons -->
    </div>
  </div>
  <div id="transport">
    <button id="play">▶</button>
    <button id="clear">Clear</button>
    <div>
      <label>Tempo</label>
      <input id="tempo" type="range" min="40" max="240" value="120">
      <span id="tempo-val">120</span>
    </div>
    <div>
      <label>Swing</label>
      <input id="swing" type="range" min="0" max="100" value="0">
      <span id="swing-val">0</span>
    </div>
  </div>
</div>
```

Actually, let me reconsider the layout. For a hardware feel, I want:
- The step grid to be the centerpiece
- Track labels on the left
- Transport at the bottom or top
- Visualizer at the top

Let me make the step grid the main focus, with each row being:
[Track Name] [Mute] [Volume] [Step 0] [Step 1] [Step 2] [Step 3] | [Step 4] [Step 5] [Step 6] [Step 7] | [Step 8] [Step 9] [Step 10] [Step 11] | [Step 12] [Step 13] [Step 14] [Step 15]

The | represents the visual gap between beat groups.

Let me write the full code now. I'll make it comprehensive and polished.

For the CSS, I'll use:
- CSS Grid for the step grid
- Flexbox for the overall layout
- CSS custom properties for track colors
- Transitions and animations for micro-interactions
- Box shadows for the glow effects

Let me write it all out now. This will be a long file but I'll make it complete and correct.

One more thing: the playhead. I need to update `data-playhead` on `#sequencer`. I'll use requestAnimationFrame to check the current time against scheduled notes and update the attribute. I'll also highlight the corresponding step visually.

For the visual highlighting of the playhead, I'll add a class to the step buttons in the current column.

Let me also think about the "step currently being heard" vs "step currently being scheduled". Since we schedule ~100ms ahead, the playhead should show the step that was most recently scheduled to play (i.e., the one whose time is closest to but <= currentTime).

I'll maintain a queue of scheduled notes and pop them as their time passes.

Let me code this up now.

Actually, I realize I should also handle the case where the user changes tempo/swing while playing. The scheduler uses the current tempo/swing values to calculate the next note time, so changes take effect immediately for future notes. The already-scheduled notes keep their original times. This is the correct behavior.

One edge case: if the user changes tempo from 240 to 40, the next note might be very far away. The scheduler will just wait until the time comes. No issue.

Another edge case: if the user changes tempo from 40 to 240, the notes will be more frequent. The scheduler will catch up by scheduling multiple notes in one tick if needed (the while loop handles this).

OK let me write the final code now.

For the demo pattern, I'll use:
- Kick (0): steps 0, 4, 8, 12
- Snare (1): steps 4, 12
- Closed Hat (2): steps 0, 2, 4, 6, 8, 10, 12, 14
- Open Hat (3): steps 2, 10
- Clap (4): steps 4, 12
- Low Tom (5): step 14
- High Tom (6): step 7
- Cowbell (7): steps 7, 15

This gives a nice basic groove.

Let me finalize the code now. I'll write it all in one go.

For the sound synthesis, let me be more specific:

**Kick:**
```
osc = ctx.createOscillator()
osc.type = 'sine'
osc.frequency.setValueAtTime(150, when)
osc.frequency.exponentialRampToValueAtTime(40, when + 0.1)

gain = ctx.createGain()
gain.gain.setValueAtTime(1, when)
gain.gain.exponentialRampToValueAtTime(0.001, when + 0.3)

osc.connect(gain).connect(trackGain)
osc.start(when)
osc.stop(when + 0.3)
```

**Snare:**
```
// Noise component
noise = ctx.createBufferSource()
noise.buffer = noiseBuffer
noise.start(when)
noise.stop(when + 0.2)

noiseFilter = ctx.createBiquadFilter()
noiseFilter.type = 'bandpass'
noiseFilter.frequency.value = 1000
noiseFilter.Q.value = 1

noiseGain = ctx.createGain()
noiseGain.gain.setValueAtTime(0.8, when)
noiseGain.gain.exponentialRampToValueAtTime(0.001, when + 0.2)

noise.connect(noiseFilter).connect(noiseGain).connect(trackGain)

// Tone component
osc = ctx.createOscillator()
osc.type = 'sine'
osc.frequency.value = 200

oscGain = ctx.createGain()
oscGain.gain.setValueAtTime(0.5, when)
oscGain.gain.exponentialRampToValueAtTime(0.001, when + 0.1)

osc.connect(oscGain).connect(trackGain)
osc.start(when)
osc.stop(when + 0.1)
```

**Closed Hat:**
```
noise = ctx.createBufferSource()
noise.buffer = noiseBuffer
noise.start(when)
noise.stop(when + 0.05)

filter = ctx.createBiquadFilter()
filter.type = 'highpass'
filter.frequency.value = 7000

gain = ctx.createGain()
gain.gain.setValueAtTime(0.5, when)
gain.gain.exponentialRampToValueAtTime(0.001, when + 0.05)

noise.connect(filter).connect(gain).connect(trackGain)
```

**Open Hat:**
```
noise = ctx.createBufferSource()
noise.buffer = noiseBuffer
noise.start(when)
noise.stop(when + 0.3)

filter = ctx.createBiquadFilter()
filter.type = 'highpass'
filter.frequency.value = 7000

gain = ctx.createGain()
gain.gain.setValueAtTime(0.5, when)
gain.gain.exponentialRampToValueAtTime(0.001, when + 0.3)

noise.connect(filter).connect(gain).connect(trackGain)
```

**Clap:**
```
noise = ctx.createBufferSource()
noise.buffer = noiseBuffer
noise.start(when)
noise.stop(when + 0.2)

filter = ctx.createBiquadFilter()
filter.type = 'bandpass'
filter.frequency.value = 1000
filter.Q.value = 2

gain = ctx.createGain()
// Multiple peaks for the clap effect
gain.gain.setValueAtTime(1, when)
gain.gain.setValueAtTime(0.8, when + 0.02)
gain.gain.setValueAtTime(0.6, when + 0.04)
gain.gain.exponentialRampToValueAtTime(0.001, when + 0.2)

noise.connect(filter).connect(gain).connect(trackGain)
```

**Low Tom:**
```
osc = ctx.createOscillator()
osc.type = 'sine'
osc.frequency.value = 80

gain = ctx.createGain()
gain.gain.setValueAtTime(0.8, when)
gain.gain.exponentialRampToValueAtTime(0.001, when + 0.3)

osc.connect(gain).connect(trackGain)
osc.start(when)
osc.stop(when + 0.3)
```

**High Tom:**
```
osc = ctx.createOscillator()
osc.type = 'sine'
osc.frequency.value = 150

gain = ctx.createGain()
gain.gain.setValueAtTime(0.8, when)
gain.gain.exponentialRampToValueAtTime(0.001, when + 0.2)

osc.connect(gain).connect(trackGain)
osc.start(when)
osc.stop(when + 0.2)
```

**Cowbell:**
```
// Two oscillators for the metallic sound
osc1 = ctx.createOscillator()
osc1.type = 'square'
osc1.frequency.value = 540

osc2 = ctx.createOscillator()
osc2.type = 'square'
osc2.frequency.value = 800

filter = ctx.createBiquadFilter()
filter.type = 'bandpass'
filter.frequency.value = 800
filter.Q.value = 2

gain = ctx.createGain()
gain.gain.setValueAtTime(0.3, when)
gain.gain.exponentialRampToValueAtTime(0.001, when + 0.3)

osc1.connect(filter)
osc2.connect(filter)
filter.connect(gain).connect(trackGain)

osc1.start(when)
osc1.stop(when + 0.3)
osc2.start(when)
osc2.stop(when + 0.3)
```

These should sound decent. Let me refine them a bit more for quality.

Actually, for the kick, I should add a slight click at the start for punch. And for the snare, I should make the noise brighter. Let me adjust.

For the kick, I'll add a short noise burst:
```
// Click
noise = ctx.createBufferSource()
noise.buffer = noiseBuffer
noise.start(when)
noise.stop(when + 0.01)

clickFilter = ctx.createBiquadFilter()
clickFilter.type = 'highpass'
clickFilter.frequency.value = 3000

clickGain = ctx.createGain()
clickGain.gain.setValueAtTime(0.3, when)
clickGain.gain.exponentialRampToValueAtTime(0.001, when + 0.01)

noise.connect(clickFilter).connect(clickGain).connect(trackGain)
```

OK I think I have enough detail. Let me write the full file now.

One more consideration: the `exponentialRampToValueAtTime` can't ramp to 0, so I'll use 0.001 as the target.

Also, I need to make sure I'm not creating any source that runs indefinitely. All my sources have explicit `stop()` calls, so they're all finite. Good.

Let me also add a master compressor for a more polished sound:
```
compressor = ctx.createDynamicsCompressor()
compressor.threshold.value = -12
compressor.knee.value = 12
compressor.ratio.value = 4
compressor.attack.value = 0.003
compressor.release.value = 0.25
```

This will help the mix sound more cohesive.

Signal chain:
- Voice → track gain → master gain → compressor → analyser → destination

Let me write the final code now. I'll be thorough and make sure everything works.

Actually, I realize I should double-check: the grader says "Never start() anything that isn't a note: no continuously running/looping sources, and no source starts for inactive or muted steps."

This means:
1. No `source.start()` without a time parameter (that would start "now" which might be interpreted as a non-note)
   - Actually, I think the concern is about sources that run continuously (like a loop buffer for the visualizer or a sustained oscillator for a drone)
2. No `source.start()` for steps that are inactive or muted
3. All `start(when)` calls must correspond to actual notes being triggered

My implementation only creates and starts sources when a step is active and the track is not muted, and always uses `start(when)` with the exact note time. This should be fine.

The analyser node is not a source, so it doesn't count. The compressor is not a source either.

Let me write the code now. Final version.

I need to be careful about one thing: when I create the AudioContext, I should do it on the first user interaction. I'll add event listeners for click and keydown that call `ensureContext()`.

Actually, the play button click will be the first interaction. But the user might click a step toggle first. So I'll add the `ensureContext()` call to:
- Play button click
- Step toggle click
- Tempo/swing input change
- Any click on the page (as a fallback)

Or more simply: I'll add a one-time listener for the first click/keydown that creates the context.

Let me use a simpler approach: create the context lazily when the play button is first clicked, or when a step is triggered. Actually, the simplest is to create it on the first interaction of any kind.

```javascript
function ensureContext() {
  if (!ctx) {
    ctx = new AudioContext();
    // ... setup
  }
  if (ctx.state === 'suspended') ctx.resume();
}

document.addEventListener('click', ensureContext, { once: false });
document.addEventListener('keydown', ensureContext, { once: false });
```

Wait, but if I add a persistent listener, it will fire on every click. That's fine - `ensureContext` is idempotent.

Actually, let me just call `ensureContext()` at the start of the play handler and the step toggle handler. That's sufficient.

OK, let me write the final code now. I'll make it comprehensive.

Let me also think about the localStorage persistence:
- Save: pattern (8×16 boolean array), tempo, swing, mutes (8 booleans), volumes (8 numbers)
- Load: on page load, check localStorage for saved state
- If no saved state, use the demo pattern

```javascript
function saveState() {
  const state = {
    pattern: pattern,
    tempo: tempo,
    swing: swing,
    mutes: mutes,
    volumes: volumes
  };
  localStorage.setItem('pulse-state', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('pulse-state');
  if (saved) {
    const state = JSON.parse(saved);
    // Apply state
  } else {
    // Apply demo pattern
  }
}
```

I'll save on every change (step toggle, mute toggle, volume change, tempo change, swing change, clear).

Let me now write the complete file. I'll aim for a polished, hardware-like design.

Here's my final layout plan:
- Top bar: "PULSE" title on the left, visualizer canvas on the right
- Main area: 8 rows, each with [track name | mute | volume | 16 steps]
- Bottom bar: Play | Clear | Tempo slider | Swing slider

The step grid will use CSS Grid with 16 columns (plus the label/mute/volume area on the left).

Actually, for the step grid, I'll use a table-like layout:
- Left column: track info (name, mute, volume)
- Right area: 16 step buttons, grouped into 4s with gaps

Let me use flexbox for each row and a grid for the steps.

OK, I'm going to write the code now. Let me be efficient and thorough.

For the visualizer, I'll draw a frequency spectrum on a canvas. I'll use `analyser.getByteFrequencyData()` and draw bars.

Let me finalize and write the complete HTML file.
