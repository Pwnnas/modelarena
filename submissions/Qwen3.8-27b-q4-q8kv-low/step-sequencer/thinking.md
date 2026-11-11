Let me break down what's needed:

1. A single `index.html` file with a 16-step drum machine
2. 8 tracks: Kick, Snare, Closed Hat, Open Hat, Clap, Low Tom, High Tom, Cowbell
3. All sounds synthesized with Web Audio API
4. Sample-accurate timing with lookahead scheduler
5. UI that feels like real hardware
6. Specific grader contract elements with exact IDs and data attributes

Let me plan the architecture:

**HTML Structure:**
- `#sequencer` element with `data-playhead` attribute
- 128 step toggle buttons with `data-track` and `data-step`
- `#play` button
- `#tempo` input (range)
- `#swing` input (range)
- 8 mute buttons with `data-mute`
- 8 volume inputs with `data-volume`
- Visualizer canvas

**Audio Synthesis:**
- Kick: Sine wave with pitch envelope (150Hz → 40Hz), short gain envelope
- Snare: Noise burst + sine wave around 200Hz, bandpass filtered
- Closed Hat: High-pass filtered noise, very short
- Open Hat: High-pass filtered noise, longer decay
- Clap: Multiple short noise bursts with slight delays
- Low Tom: Sine wave around 100Hz with pitch drop
- High Tom: Sine wave around 200Hz with pitch drop
- Cowbell: Two square wave oscillators at specific frequencies (540Hz + 800Hz), bandpass filtered

**Scheduler:**
- Lookahead scheduler using setInterval (25ms)
- Schedule notes 100ms ahead
- Use AudioContext.currentTime for sample-accurate timing
- Track current step, next note time

**Swing:**
- Odd steps (1, 3, 5, ...) delayed by (swing/100) × (1/3) × stepDuration
- stepDuration = 60 / BPM / 4 (for 16th notes)

**Playhead:**
- Update `data-playhead` on `#sequencer` when a note is actually heard
- Need to use a callback or track scheduled times and update UI when currentTime passes them

**localStorage:**
- Save pattern, tempo, swing, mutes, volumes
- Restore on load

**Visual Design:**
- Dark theme, hardware-like
- Glowing active steps
- Tactile button styles
- Playhead animation
- Spectrum visualizer

Let me think about the playhead synchronization. The scheduler schedules notes ahead of time, but the playhead should highlight the step currently being "heard". I'll use a combination of:
1. When scheduling a note, I know its exact time
2. I'll use a requestAnimationFrame loop to check which scheduled note's time has passed and update the playhead

Actually, a cleaner approach: I'll keep an array of scheduled note times, and in a rAF loop, I check the current AudioContext time against these to determine which step is currently playing.

Let me think about the visualizer. I'll use an AnalyserNode connected to the master output, and draw a frequency spectrum on a canvas.

For the demo beat on first load, I'll set a nice groove pattern.

Let me code this up:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pulse — Drum Machine</title>
<style>
/* styles */
</style>
</head>
<body>
<!-- structure -->
<script>
// all JS
</script>
</body>
</html>
```

Let me think carefully about the timing. The grader records `start(when)` calls. So:
- Each voice must call `source.start(when)` where `when` is the exact AudioContext time
- No looping sources
- No starts for inactive or muted steps

For the kick, I'll use an oscillator with a frequency envelope and a gain envelope, both started at the note time.

Let me think about the swing calculation more carefully:
- At swing s, odd steps (1, 3, 5, ...) are delayed by (s/100) × (1/3) × stepDuration
- stepDuration = (60 / BPM) / 4
- So the delay = (s/100) * (1/3) * (60/BPM/4)

For the scheduler:
- `nextNoteTime` starts at `audioCtx.currentTime` when play begins
- `currentStep` starts at 0
- Each scheduling loop:
  - While `nextNoteTime < audioCtx.currentTime + lookahead`:
    - If step is active and not muted, schedule the voice at `nextNoteTime`
    - Calculate swing delay for this step
    - `nextNoteTime += stepDuration` (the base duration, not including swing)
    - Actually wait - swing delays the odd steps but doesn't extend the bar. Let me re-read.

"At swing s, every odd-numbered step (steps 1, 3, 5, … counting from 0) is delayed by (s/100) × ⅓ × (duration of one 16th note)"

So the step timing is:
- Step 0: time = 0
- Step 1: time = stepDuration + swingDelay
- Step 2: time = 2 * stepDuration
- Step 3: time = 3 * stepDuration + swingDelay
- etc.

Wait, that's not quite right either. If we just delay odd steps, they might overlap with the next even step. Let me think about this differently.

Actually, in a typical swing implementation, the 16th notes are grouped in pairs (like 8th note pairs). The first of each pair is on time, the second is delayed. But here it says "every odd-numbered step" which means steps 1, 3, 5, 7, 9, 11, 13, 15.

So the timing would be:
- Step 0: t = 0
- Step 1: t = stepDuration + (s/100) * (1/3) * stepDuration
- Step 2: t = 2 * stepDuration
- Step 3: t = 3 * stepDuration + (s/100) * (1/3) * stepDuration
- ...

This means the odd steps are shifted later but the overall bar length stays the same (16 * stepDuration). The even steps provide the grid, and odd steps are just shifted within their "slot".

Actually, I think the simplest interpretation is:
- Base time for step n = n * stepDuration
- If n is odd, add swingDelay = (s/100) * (1/3) * stepDuration
- So actual time for step n = n * stepDuration + (n % 2 === 1 ? swingDelay : 0)

This keeps the bar length at 16 * stepDuration and just shifts odd steps slightly later. This is the standard "microswing" approach.

Let me implement this. The scheduler needs to:
1. Know the current step
2. Calculate the actual time for that step (including swing)
3. Schedule the voice at that time
4. Advance to the next step
5. Calculate the time for the next step

Actually, I need to be more careful. The "next note time" approach assumes uniform spacing. With swing, the spacing between consecutive steps is not uniform. So I should track the absolute time for each step.

Let me use this approach:
- `barStartTime` = the time when step 0 of the current bar starts
- For step n in the bar: `noteTime = barStartTime + n * stepDuration + (n % 2 === 1 ? swingDelay : 0)`
- When we finish step 15, `barStartTime += 16 * stepDuration`

This is cleaner. Let me implement it.

Actually, even simpler: I'll just track `currentStep` and `nextNoteTime`. When advancing:
- If currentStep is odd (we just played an odd step), next base time = (currentStep + 1) * stepDuration from bar start
- If currentStep is even, next base time = (currentStep + 1) * stepDuration from bar start, plus swing if next is odd

Hmm, let me just track the absolute time properly:

```
function getStepTime(step, barStart) {
  let t = barStart + step * stepDuration;
  if (step % 2 === 1) {
    t += (swing / 100) * (1/3) * stepDuration;
  }
  return t;
}
```

And in the scheduler:
```
while (getStepTime(currentStep, barStart) < audioCtx.currentTime + lookahead) {
  scheduleStep(currentStep, getStepTime(currentStep, barStart));
  currentStep++;
  if (currentStep >= 16) {
    currentStep = 0;
    barStart += 16 * stepDuration;
  }
}
```

This should work correctly even when tempo/swing changes mid-playback, because we recalculate based on the current barStart and current step.

Wait, but if tempo changes mid-bar, the stepDuration changes. That means the remaining steps in the current bar would be at the new tempo. That's fine - it's the expected behavior.

Actually, there's a subtlety. If we change tempo mid-bar, the barStart was set with the old tempo. The steps remaining in the bar should use the new stepDuration. But barStart + step * newStepDuration might not align with where we are in real time.

I think the cleanest approach is:
- Track `nextNoteTime` as the absolute time of the next note to be scheduled
- When scheduling, compute the time for the current step
- When advancing, compute the time for the next step

Let me use a different approach:
- `nextTime` = the time the next step should start
- To advance from step n to step n+1:
  - base increment = stepDuration
  - if step n+1 is odd, add swingDelay
  - if step n was odd, the swingDelay was already added to it, so the increment from n to n+1 is just stepDuration (since n+1 is even)
  
Hmm, this is getting complicated. Let me think differently.

The time of step n within a bar (relative to bar start):
- t(n) = n * stepDuration + (n odd ? swingDelay : 0)

So the time difference between consecutive steps:
- t(n+1) - t(n) when n is even: (n+1)*sd + swingDelay - n*sd = sd + swingDelay
- t(n+1) - t(n) when n is odd: (n+1)*sd - (n*sd + swingDelay) = sd - swingDelay

So:
- After an even step, the gap to the next step is stepDuration + swingDelay
- After an odd step, the gap to the next step is stepDuration - swingDelay

This is the classic swing pattern! The even-odd pair is "pushed" together at the start and the odd-even pair has a longer gap.

So my scheduler can be:
```
nextTime = barStart;
for each step:
  if step is odd:
    nextTime = previousStepTime + stepDuration + swingDelay  // gap from even to odd
  else if step > 0:
    nextTime = previousStepTime + stepDuration - swingDelay  // gap from odd to even
```

Actually wait, let me re-derive:
- t(0) = 0
- t(1) = sd + swingDelay
- t(2) = 2*sd
- t(3) = 3*sd + swingDelay
- t(4) = 4*sd

Gaps:
- t(1)-t(0) = sd + swingDelay
- t(2)-t(1) = 2sd - sd - swingDelay = sd - swingDelay
- t(3)-t(2) = 3sd + swingDelay - 2sd = sd + swingDelay
- t(4)-t(3) = 4sd - 3sd - swingDelay = sd - swingDelay

Yes! So the pattern is:
- Gap after even step (going to odd): sd + swingDelay
- Gap after odd step (going to even): sd - swingDelay

This is clean. Let me use this in the scheduler.

Now for the playhead: I need to update the UI when a note is actually heard. Since I'm scheduling ahead, I need a way to know when the audio is actually playing. I'll use a requestAnimationFrame loop that checks `audioCtx.currentTime` against the scheduled times.

I'll keep an array of `{time, step}` for scheduled notes, and in the rAF loop, I find the most recent one whose time <= currentTime.

Let me now write the full implementation.

For the visual design, I'm going for a dark, premium hardware look:
- Dark background with subtle gradient
- Metallic/dark panel for the sequencer
- Glowing LED-style step buttons (amber/warm glow when active)
- Distinct colors for different step groups (groups of 4)
- Tactile press animations
- Clean typography (system fonts)
- Smooth transitions

Let me write the complete file now.

For the cowbell, I'll use two square oscillators at ~540Hz and ~800Hz with a bandpass filter, which is the classic cowbell sound.

For the clap, I'll use multiple noise bursts with very short gaps (like 1-2ms apart) to create that characteristic "crack" sound, plus a longer tail.

Let me also think about the AnalyserNode. I'll connect: masterGain -> analyser -> destination. The analyser will feed the visualizer.

One important note: the grader says "Use one AudioContext, created or resumed on the first user interaction." So I should create the AudioContext lazily on first interaction (click, keydown, etc.) or resume it if it's suspended.

Let me also make sure I handle the case where the AudioContext is in "suspended" state. I'll create it on first user interaction and resume it.

Actually, re-reading: "created or resumed on the first user interaction" - this means I should either create it on first interaction, or create it early and resume on first interaction. I'll create it on first interaction to be safe.

Wait, but I need the AudioContext for the visualizer too. If I create it lazily, the visualizer won't work until first interaction. That's probably fine - the grader will interact with the page.

Actually, let me create the AudioContext immediately but in a suspended state, and resume it on first user interaction. This way the visualizer canvas can be set up, and everything is ready.

Hmm, but the grader says "created or resumed on the first user interaction". Let me just create it on first interaction to be safe. The visualizer will just show a flat line until then.

Actually, I'll create it immediately (it will be suspended) and resume on first interaction. This is the most common pattern and satisfies "created or resumed on the first user interaction" (it's resumed on first interaction).

Let me now write the complete code. This is going to be long but I need to get all the details right.

Let me think about the demo beat. A classic house/techno pattern:
- Kick: 0, 4, 8, 12 (four on the floor)
- Snare: 4, 12
- Closed Hat: 0, 2, 4, 6, 8, 10, 12, 14 (8ths) or 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15 (16ths)
- Open Hat: 2, 6, 10, 14 (offbeats)
- Clap: 4, 12
- Low Tom: maybe some fills
- High Tom: maybe some fills
- Cowbell: maybe some accents

Let me go with a classic house beat:
- Kick: 0, 4, 8, 12
- Snare: 4, 12
- Closed Hat: 0, 2, 4, 6, 8, 10, 12, 14
- Open Hat: 2, 6, 10, 14
- Clap: 4, 12
- Low Tom: 14
- High Tom: 7
- Cowbell: 0, 8

Actually let me make it more interesting:
- Kick: 0, 4, 8, 12
- Snare: 4, 12
- Closed Hat: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 (all 16ths for energy)
- Open Hat: 2, 6, 10, 14
- Clap: 4, 12
- Low Tom: 14, 15
- High Tom: 7
- Cowbell: 0, 6

Hmm, let me go with something that grooves well:
- Kick: 0, 4, 8, 12
- Snare: 4, 12
- Closed Hat: 0, 2, 4, 6, 8, 10, 12, 14
- Open Hat: 2, 6, 10, 14
- Clap: 4, 12
- Low Tom: 15
- High Tom: 7, 15
- Cowbell: 0

Let me finalize the design and write the code.

For the visualizer, I'll draw a frequency spectrum with a nice gradient.

Let me also add some nice touches:
- Step buttons glow when triggered during playback
- The playhead step has a distinct highlight
- Smooth CSS transitions
- A subtle scanline or texture effect for the hardware feel

OK let me write this all out now. I'll be thorough.

One more consideration: the grader says "Never start() anything that isn't a note: no continuously running/looping sources, and no source starts for inactive or muted steps."

So I must NOT have any looping oscillators or noise sources running in the background. Every source must be started and stopped for a specific note. The AnalyserNode is not a source, so that's fine.

Also: "Each triggered step starts its voice's source node(s) with when = the exact intended note time on the AudioContext clock."

So for each note, I need to call `source.start(when)` with the exact time. I should NOT use `start()` without arguments (which starts immediately).

Let me make sure all my synthesis code uses `start(when)` with the explicit time parameter.

For the noise buffer, I'll create it once and reuse it. The AudioBufferSourceNode will be created fresh for each note and started with the exact time.

Let me write the code now.
