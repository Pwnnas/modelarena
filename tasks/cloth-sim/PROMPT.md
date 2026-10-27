# Task: Silk — an interactive, tearable cloth simulation

Build a real-time cloth simulation you can grab, pull, cut and blow around, rendered as a
beautiful shaded fabric.

## Ground rules

- Deliver **one file: `index.html`** with all HTML, CSS and JavaScript inline.
- **No external resources of any kind**: no CDNs, libraries, frameworks, web fonts or remote
  images. Everything must be written by you or generated in code. Network access is blocked
  during grading.
- Target: latest desktop Google Chrome at a 1280×800 viewport; adapt to window resizing.
- No errors in the console. Never use `alert`, `confirm` or `prompt`.
- The page starts with an empty `localStorage` (fresh browser profile).
- You are scored two ways:
  1. **Automated grader**: a headless browser drives your page through the *Grader contract*
     below, using real mouse and keyboard input, and measures correctness, robustness and
     performance. Follow the contract exactly (ids, attributes and names are case-sensitive).
  2. **Blind human judging**: your page is shown side by side with other submissions; people
     use both and pick the better one on visual design, physical believability, interaction
     quality and overall feel.

## Requirements

### Simulation
- A rectangular cloth of at least **50 × 35 particles** (more is better if it stays at
  60 FPS), pinned along its top edge (all or some of the top-row particles), hanging in the
  middle of the window.
- Verlet integration (or position-based dynamics) with distance constraints: structural plus
  shear and/or bending constraints, several solver iterations per step, gravity, damping.
- Fixed simulation timestep with an accumulator, so the simulation runs at the same speed
  regardless of the display's refresh rate; clamp long frames so tab switches can't explode it.
- Stable: no jitter, no explosions. With wind off and no interaction, the cloth must come to
  a **complete rest within 3 seconds** of loading (and after any interaction ends).

### Interaction
- **Left-drag** grabs the nearest particle within 40 px of the cursor and pulls the cloth
  with it; releasing lets go.
- **Right-drag** (and Shift+left-drag, for trackpads) **cuts** every constraint the cursor
  path crosses. Right-click must not open the browser context menu.
- Constraints also **tear** when stretched far beyond their rest length (e.g. by yanking).
- **Wind** toggle: gusty, turbulent wind that varies across the cloth and over time. Off
  initially.
- **Space** toggles pause (unless focus is in a text input). While paused nothing moves.
- Controls panel: wind toggle, gravity slider, solver-iterations slider, reset button, and
  live stats (FPS, particles, constraints).

### Rendering
- A shaded fabric surface, not a wireframe: filled triangles with lighting/shading (e.g. by
  stretch, by approximate normals, a woven/checker pattern, two-sided coloring), with
  correctly torn edges (no triangles bridging a cut).
- Full-window canvas, crisp on HiDPI screens (respect `devicePixelRatio`), handles resize
  without distorting.

### Polish (judged by humans)
- Does it look like fabric, and feel physical? Beautiful lighting/colors, smooth motion,
  satisfying tearing, an elegant control panel and a nice background.

## Grader contract

1. A `<canvas>` covering the full viewport, drawn with 2D or WebGL.
2. `window.__arena.stats()` returns
   `{ particles: number, constraints: number, pinned: number, centroid: { x: number, y: number } }`:
   the current number of particles, **intact** constraints, pinned particles, and the average
   position of all particles in **viewport CSS-pixel coordinates** (the same space as
   `MouseEvent.clientX/clientY`).
3. Controls: `#wind` (checkbox or button that toggles wind), `#reset` (button that rebuilds the
   cloth in its initial state), `#gravity` (`<input type="range">`).
4. Space toggles pause; while paused the canvas is identical frame to frame (DOM text such as
   an FPS readout may still update).
5. Pointer behavior exactly as described: left-drag grabs (nearest particle within 40 px),
   right-drag cuts, the context menu is suppressed.
6. Initially the cloth is visible, horizontally centered, at rest within 3 s, and entirely
   inside the viewport; wind is off.
