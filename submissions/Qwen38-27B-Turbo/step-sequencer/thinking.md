The user wants a complete drum machine with 8 tracks, 16 steps, all synthesized with Web Audio API. Let me plan this out carefully.

Key requirements:
1. Single index.html file
2. 8 tracks: Kick, Snare, Closed Hat, Open Hat, Clap, Low Tom, High Tom, Cowbell
3. 16 steps per track
4. Sample-accurate timing with lookahead scheduler
5. Transport controls (play/stop, space bar)
6. Tempo 40-240 BPM, Swing 0-100
7. Per-track mute and volume
8. Real-time visualizer
9. localStorage persistence
10. Hardware-like UI with good aesthetics
11. Grader contract compliance (specific data attributes)

Let me think about the audio synthesis:

**Kick:** Low sine wave with pitch drop + transient click
- Oscillator (sine) at ~150Hz, pitch drops to ~40Hz over 100ms
- Gain envelope: sharp attack, decay
- Add a transient with a shorter oscillator or filtered noise

**Snare:** Noise burst + tonal component
- Filtered noise (bandpass ~3kHz) for the "snap"
- Low oscillator (~180Hz sine) for the body
- Both with short envelopes

**Closed Hi-Hat:** Short filtered noise burst
- Highpass filtered noise (~8kHz)
- Very short envelope (50-80ms)

**Open Hi-Hat:** Longer filtered noise
- Highpass filtered noise (~7kHz)
- Longer envelope (200-400ms)

**Clap:** Multiple noise bursts
- Bandpass filtered noise (~2kHz)
- Multiple short envelope peaks for the "clap" texture

**Low Tom:** Low oscillator with pitch drop
- Sine oscillator at ~80Hz dropping to ~60Hz
- Medium-length envelope

**High Tom:** Higher oscillator with pitch drop
- Sine oscillator at ~150Hz dropping to ~120Hz
- Medium-length envelope

**Cowbell:** Two detuned oscillators
- Two square/sawtooth oscillators at ~580Hz and ~820Hz (or similar)
- Bandpass filter
- Medium envelope

For the lookahead scheduler, I'll use the standard approach:
- A timer (setTimeout) runs every 25ms
- It schedules notes that are within the next 100ms
- Actual note times are calculated from the AudioContext clock

Let me build this step by step.

The UI should look like hardware - dark background, tactile buttons, glowing steps, etc. I'll use a dark theme with accent colors.

For the visualizer, I'll use an AnalyserNode and draw a waveform or spectrum on a canvas.

localStorage persistence: save the entire pattern state, tempo, swing, mutes, and volumes.

Let me start coding.
