# Task: Pulse — a synthesized drum machine & step sequencer

Build a playable 16-step drum machine whose sounds are all synthesized live with the Web Audio
API, with sample-accurate timing and a UI that feels like real hardware.

## Ground rules

- Deliver **one file: `index.html`** with all HTML, CSS and JavaScript inline.
- **No external resources of any kind**: no CDNs, libraries, frameworks, web fonts, remote
  images or audio files. Every sound must be synthesized in code. Network access is blocked
  during grading.
- Target: latest desktop Google Chrome at a 1280×800 viewport; adapt to window resizing.
- No errors in the console. Never use `alert`, `confirm` or `prompt`.
- The page starts with an empty `localStorage` (fresh browser profile).
- You are scored two ways:
  1. **Automated grader**: a headless browser drives your page through the *Grader contract*
     below, using real mouse and keyboard input, and measures correctness, robustness and
     performance. Follow the contract exactly (ids, attributes and names are case-sensitive).
  2. **Blind human judging**: your page is shown side by side with other submissions; people
     use (and listen to) both and pick the better one on sound, visual design, interaction
     quality and overall feel.

## Requirements

### Instrument
- 8 tracks × 16 steps (one bar of 16th notes). Tracks, top to bottom: **Kick, Snare, Closed
  Hat, Open Hat, Clap, Low Tom, High Tom, Cowbell**.
- All voices synthesized with Web Audio (oscillators, noise buffers, filters, gain envelopes,
  distortion, whatever you like). Make them sound good and punchy, not like bare beeps.
- Each step is a toggle; active steps are lit. Groups of 4 steps (beats) are visually
  separated.

### Transport & timing
- Play/Stop button, and the **Space** bar toggles playback (unless focus is in a text input).
  Play always starts from step 0.
- Tempo 40–240 BPM (default 120). Swing 0–100 (default 0): at swing *s*, every odd-numbered
  step (steps 1, 3, 5, … counting from 0) is delayed by (*s*/100) × ⅓ × (duration of one 16th
  note). At 0 the timing is straight.
- Timing must be **sample-accurate**: use a lookahead scheduler that schedules every note on
  the AudioContext clock ahead of time. `setTimeout`/`setInterval`/`requestAnimationFrame`
  may drive the scheduler loop but must never determine the actual note start times.
- Tempo and swing changes take effect while playing, without stopping, gaps or drift.
- A playhead highlights the step currently being **heard**, in sync with the audio.

### Mixer & extras
- Per-track **mute** toggle and **volume** slider. A muted track must not trigger any voice
  (don't create/start nodes for it).
- A real-time visualizer (spectrum or waveform) driven by an `AnalyserNode`.
- A Clear button. Optional: a few preset patterns, randomize, per-step accents.
- The whole state (pattern, tempo, swing, mutes, volumes) persists in `localStorage` and is
  restored on reload.

### Polish (judged by humans)
- Looks and feels like a beautiful piece of hardware or a premium music app: tactile
  buttons, glowing steps, satisfying micro-animations when steps trigger, a clear playhead.
- Sounds: each instrument recognizable and pleasant; the kit should groove.
- Optionally ship a nice demo beat on first load (the grader can deal with that).

## Grader contract

1. 128 step toggles: `<button>` elements with `data-track="0".."7"` (top to bottom, in the
   track order above) and `data-step="0".."15"`, with `aria-pressed="true"` when active and
   `"false"` when inactive. Clicking toggles.
2. `#play`: a button that toggles play/stop. Space toggles too (document-level handler).
3. `#tempo`: an `<input>` (range or number) holding the BPM; `input`/`change` events apply it.
4. `#swing`: an `<input>` (range or number), 0–100; `input`/`change` events apply it.
5. Mute toggles: `<button data-mute="0".."7">` with `aria-pressed="true"` when muted.
   Volume sliders: `<input data-volume="0".."7">`.
6. An element `#sequencer` whose `data-playhead` attribute is the step (0–15) currently being
   heard while playing, and `-1` when stopped.
7. Timing is verified by recording every `start(when)` call on audio source nodes
   (OscillatorNode, AudioBufferSourceNode, ConstantSourceNode) of your AudioContext. Rules:
   - Each triggered step starts its voice's source node(s) with `when` = the exact intended
     note time on the AudioContext clock.
   - Never `start()` anything that isn't a note: no continuously running/looping sources,
     and no source starts for inactive or muted steps.
   - Use one `AudioContext`, created or resumed on the first user interaction.
