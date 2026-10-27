# Task: Horizon — an infinite procedural terrain flyover in raw WebGL

Build an endless procedurally generated landscape you fly over, with water, sky, fog and a
full day/night cycle, using **raw WebGL** only: your own shaders, buffers and matrix math.

## Ground rules

- Deliver **one file: `index.html`** with all HTML, CSS and JavaScript inline.
- **No external resources of any kind**: no CDNs, libraries (no three.js, no gl-matrix),
  frameworks, web fonts or remote images/textures. Everything must be written by you or
  generated in code. Network access is blocked during grading.
- Target: latest desktop Google Chrome at a 1280×800 viewport; adapt to window resizing.
- No errors in the console. Never use `alert`, `confirm` or `prompt`.
- The page starts with an empty `localStorage` (fresh browser profile).
- You are scored two ways:
  1. **Automated grader**: a headless browser drives your page through the *Grader contract*
     below, using real mouse and keyboard input, and measures correctness, robustness and
     performance. Follow the contract exactly (ids, attributes and names are case-sensitive).
  2. **Blind human judging**: your page is shown side by side with other submissions; people
     use both and pick the better one on visual beauty, atmosphere, smoothness and overall feel.

## Requirements

### World
- Scale: 1 world unit ≈ 1 meter, y is up, sea level is **y = 0**. Terrain heights should
  roughly span −50 (sea floor) to +400 (peaks). View distance at least 1,500 m.
- Terrain: a seeded fractal-noise heightfield (fBm, ridged noise, domain warping… your call)
  with mountains, valleys, plains and coastlines. Generation must be **fully deterministic
  for a given seed** (no `Math.random` in world generation).
- **Infinite**: terrain is generated in chunks around the camera and streamed in/out as it
  moves. You must never see the edge of the world. Use LOD or distance-based detail to keep
  it fast.
- Materials: height- and slope-based coloring (sand near the water, grass, rock on steep
  slopes, snow on peaks), lit with proper normals.
- Water at sea level: animated waves, fresnel-like sky reflection, shoreline blending.
- Sky & atmosphere: sky gradient, a visible sun, distance fog that blends terrain into the
  sky color at the horizon.

### Day / night
- Time of day 0–24 h (12 = noon, sun highest; 0 = midnight). It advances automatically (a
  full day in about 2 minutes) and can be set with a slider.
- Sun position, light color and intensity, sky and fog colors all follow the time of day:
  warm sunrise/sunset, a clearly **dark** night (moonlight/stars welcome).

### Camera
- **Autopilot** (on initially): flies smoothly forward over the terrain, following its
  height, never clipping into the ground.
- **F** toggles autopilot. With autopilot off and no input, the camera stays still.
- Manual flight: W/S forward/back, A/D strafe, Q/E (or Shift/Space) down/up, mouse drag to
  look around (no pointer lock required). Smooth acceleration.
- The camera can never go below terrain height (+ a small margin) or below the water surface.

### UI & performance
- Minimal, elegant overlay: time-of-day slider, seed input, autopilot indicator, FPS counter.
- Smooth 60 FPS on a modern laptop at 1280×800. Handle resize and HiDPI (you may cap the
  pixel ratio for performance).

### Polish (judged by humans)
- Atmosphere is everything: beautiful lighting, color grading, fog, water, sky and sunsets;
  smooth camera motion; no popping or visible seams between chunks.

## Grader contract

1. A full-viewport `<canvas>` rendered via `getContext('webgl')` or `getContext('webgl2')`.
2. `window.__arena` provides:
   - `freeze(on: boolean)`: while frozen, nothing changes on its own (no autopilot movement,
     no time-of-day progression, no water/cloud animation), so the image depends only on
     seed, camera, time of day and viewport. Rendering continues, so changes made through
     this API appear within a few frames. User keyboard/mouse input still works when frozen.
   - `setSeed(n: integer)`: regenerates the entire world deterministically from the seed.
     The same seed must give an identical image for the same camera and time. Updates `#seed`.
   - `setTime(hours: number)`: sets the time of day (0–24). Updates `#time`.
   - `setCamera({ x, y, z, yaw, pitch })` and `getCamera()` → `{ x, y, z, yaw, pitch }`:
     world units and radians. `yaw = 0` looks toward **−z**; `pitch = 0` is level, positive
     pitch looks up. If the requested `y` is below the allowed minimum, the camera is pushed
     up (and `getCamera()` returns the corrected value).
   - `terrainHeight(x, z): number`: the terrain surface height at world (x, z) for the
     current seed (the actual surface you render, ignoring water).
   - `stats()` → `{ chunks: number, triangles: number }`: loaded chunks, triangles drawn last
     frame.
3. `#time`: `<input type="range" min="0" max="24">`; `input` events set the time of day.
4. `#seed`: `<input type="number">`; a `change` event regenerates the world.
5. Keyboard (W/A/S/D, Q/E, F) and mouse-drag controls work with the page focused, without
   clicking any UI first.
