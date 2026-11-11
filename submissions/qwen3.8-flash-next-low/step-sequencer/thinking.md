Let me build a complete drum machine in a single HTML file. I need to carefully implement:

1. 8 drum tracks with synthesized sounds (Kick, Snare, Closed Hat, Open Hat, Clap, Low Tom, High Tom, Cowbell)
2. 16-step sequencer per track (128 total step buttons)
3. Transport controls (play/stop, tempo, swing)
4. Mixer (mute, volume per track)
5. Visualizer (AnalyserNode-driven)
6. localStorage persistence
7. Sample-accurate timing with lookahead scheduler
8. Playhead display via data-playhead attribute
9. Proper grader contract compliance

Let me think about the timing model:
- 16 steps at 16th note divisions
- Tempo BPM, so step duration = 60/BPM/4 seconds (one 16th note)
- Swing: odd steps (1,3,5,...) delayed by (s/100) × (1/3) × stepDuration
- Lookahead scheduler: use setTimeout to periodically schedule notes ahead on the AudioContext clock
- Playhead updates via requestAnimationFrame, comparing current time to scheduled note times

For the scheduler:
- I'll use a lookahead of ~0.1s and an interval of ~25ms
- Keep track of current step and next note time
- Schedule each note with its exact `when` time on AudioContext clock
- Apply swing to odd steps

For synthesized sounds:
- Kick: sine wave with pitch envelope (150Hz→40Hz) + click transient
- Snare: noise burst + bandpass filter + sine wave at 180Hz
- Closed Hat: white noise through highpass filter, short decay
- Open Hat: white noise through highpass filter, longer decay
- Clap: multiple noise bursts with bandpass filter
- Low Tom: sine wave with pitch envelope (80Hz→40Hz)
- High Tom: sine wave with pitch envelope (120Hz→60Hz)
- Cowbell: two square waves through bandpass filters

For the visual design, I'll aim for a dark, hardware-like aesthetic with glowing steps.

Let me think about the grader contract more carefully:
- data-track="0".."7" on buttons
- data-step="0".."15" on buttons
- aria-pressed="true"/"false"
- #play button
- #tempo input (range or number)
- #swing input (range or number)
- data-mute="0".."7" buttons with aria-pressed
- data-volume="0".."7" inputs
- #sequencer with data-playhead attribute
- AudioContext created/resumed on first user interaction

For the "no source starts for inactive or muted steps" rule - I should only create/start nodes when a step is active AND the track is not muted.

For timing verification - the grader records every start(when) call. Each triggered step must start its voice with the exact intended note time.

Let me think about the AudioContext creation. The contract says "Use one AudioContext, created or resumed on the first user interaction." So I should create it on the first click/keypress.

Actually, I'll create the AudioContext on first user interaction (click on play button, step toggle, etc.) and resume it.

Let me structure the code:

1. Audio engine with synthesized voices
2. Scheduler with lookahead
3. UI with all controls
4. State management with localStorage
5. Visualizer

For the visualizer, I'll use an AnalyserNode connected to the master output and draw on a canvas.

Let me write the complete file now.

Key timing considerations:
- stepDuration = 60 / tempo / 4 (seconds per 16th note)
- swingDelay(step) = (step % 2 === 1) ? (swing/100) * (1/3) * stepDuration : 0
- Scheduled time for step i = startTime + i * stepDuration + swingDelay(i)

Wait, I need to re-read the swing spec: "at swing s, every odd-numbered step (steps 1, 3, 5, … counting from 0) is delayed by (s/100) × ⅓ × (duration of one 16th note)"

So the delay is (s/100) × (1/3) × stepDuration. This shifts odd steps later, creating a swung feel.

For the lookahead scheduler:
- Keep `nextStepIndex` and `nextStepTime` (AudioContext time)
- Every 25ms, schedule all notes that fall within the lookahead window
- After scheduling a step, advance to the next one

For tempo/swing changes during playback:
- On tempo change, I need to recalculate stepDuration. The simplest approach: when tempo changes, I reset the timing for the *current* cycle. Actually, a better approach: when I schedule the next step, I use the current tempo. So I just use the current tempo/swing values when computing each next step's time.

Let me think about this more carefully. If I'm at step 3 and tempo changes, the next step's time should reflect the new tempo. So:
- nextStepTime = lastScheduledStepTime + newStepDuration + swingDelayForNextStep

Actually, let me use absolute timing relative to when playback started:
- Each step's absolute time = startTime + stepIndex * stepDuration + swingOffset
- But if tempo changes, stepDuration changes...

Better approach: maintain the "next note to schedule" as an index and a time. When scheduling step i, compute its time based on the accumulated time. Actually the simplest robust approach:

- Track `currentStep` (next step to schedule) and `nextTime` (when to schedule it)
- When scheduling a step, compute swing offset for that step using current swing value
- After scheduling, compute nextTime += stepDuration (using current tempo)
- This way tempo changes take effect at the next scheduled step without drift

This means tempo changes don't cause discontinuities - the next step just has a different spacing. That's fine.

Let me code this up now. I'll aim for a polished dark UI with a green/cyan accent.

For the visualizer, I'll draw a frequency spectrum on a small canvas.

Let me also add a demo pattern on first load - a classic boom-bap style beat:
- Kick: steps 0, 8 (and maybe 10)
- Snare: steps 4, 12
- Closed Hat: every even step or every step
- Open Hat: step 14

Let me write this out completely now.
