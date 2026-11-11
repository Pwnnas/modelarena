Let me break down what I need to build:

1. A cloth simulation with Verlet integration
2. At least 50×35 particles, pinned along top edge
3. Distance constraints: structural, shear, bending
4. Multiple solver iterations per step
5. Gravity, damping
6. Fixed timestep with accumulator
7. Stable - comes to rest within 3 seconds

Interactions:
- Left-drag: grab nearest particle within 40px
- Right-drag (or Shift+left): cut constraints the cursor path crosses
- Constraints tear when stretched far beyond rest length
- Wind toggle: gusty, turbulent wind
- Space: toggle pause
- Controls panel: wind toggle, gravity slider, solver-iterations slider, reset button, live stats

Rendering:
- Shaded fabric surface (filled triangles with lighting)
- Two-sided coloring, stretch-based shading
- Correctly torn edges (no triangles bridging a cut)
- Full-window canvas, HiDPI, resize handling

Grader contract:
- `window.__arena.stats()` returns `{ particles, constraints, pinned, centroid }`
- `#wind` checkbox/button
- `#reset` button
- `#gravity` range input
- Space toggles pause
- Left-drag grabs, right-drag cuts, context menu suppressed
- Cloth initially visible, centered, at rest within 3s, inside viewport, wind off

Let me design the simulation:

**Particles:**
- Grid of 50×35 particles (1750 particles)
- Each has: x, y, prevX, prevY, pinned, mass

**Constraints:**
- Structural: horizontal and vertical neighbors
- Shear: diagonal neighbors
- Bending: skip-one neighbors (every other)
- Each has: p1, p2, restLength, active

**Verlet Integration:**
- vx = (x - prevX) * damping
- vy = (y - prevY) * damping
- prevX = x
- prevY = y
- x += vx + ax * dt²
- y += vy + ay * dt²

**Constraint solving:**
- For each iteration, for each active constraint:
  - dx = p2.x - p1.x
  - dy = p2.y - p1.y
  - dist = sqrt(dx² + dy²)
  - diff = (dist - restLength) / dist
  - offsetX = dx * diff * 0.5
  - offsetY = dy * diff * 0.5
  - if not pinned: p1.x += offsetX, p1.y += offsetY
  - if not pinned: p2.x -= offsetX, p2.y -= offsetY

**Tearing:**
- If dist > restLength * tearThreshold (e.g., 2.5), remove constraint

**Rendering:**
- For each quad (4 particles forming a cell), check if all 4 constraints are active
- Actually, better: for each triangle in the cloth, check if the edges are intact
- Use per-triangle normal for lighting
- Color based on normal direction (two-sided)

Let me think about the rendering approach. The cloth is a grid of particles. Each cell (i,j) to (i+1,j+1) forms a quad. I'll split each quad into two triangles. For each triangle, I'll check if all three edges have active constraints. If they do, I render the triangle.

Actually, for a cleaner approach, I'll render quads where all 4 corners exist and the structural constraints are intact. But since we can cut diagonals too, I should use triangles.

Let me think about this more carefully. The cloth grid is (cols) × (rows) particles. Each cell between (i,j), (i+1,j), (i+1,j+1), (i,j+1) can be split into two triangles:
- Triangle 1: (i,j), (i+1,j), (i+1,j+1)
- Triangle 2: (i,j), (i+1,j+1), (i,j+1)

For each triangle, I check if the 3 edges (structural or shear constraints) are all active. If so, I render it.

For lighting, I'll compute a pseudo-normal from the triangle's screen-space coordinates. Since this is 2D, I can fake the normal by looking at how the triangle is stretched or by using the angle of the triangle relative to vertical.

Actually, a better approach for 2D cloth: compute the "normal" as the cross product of the two edge vectors in screen space, which gives a scalar (positive or negative). This tells us the orientation (which way the cloth is facing). I can use this for two-sided coloring.

For more realistic shading, I can compute a pseudo-3D normal by treating the cloth as a surface. Since it's a 2D projection of a 3D surface, I can estimate the normal at each point by looking at the surrounding particles. But that's complex.

Simpler approach: Use the stretch of each triangle to modulate color (more stretched = lighter, like thinning fabric). Use the triangle's orientation (winding) for two-sided coloring. Add a gradient or pattern for visual interest.

Let me go with:
- Base color: a nice fabric color (e.g., deep blue/purple)
- Lighting: compute a simple normal from the triangle's screen-space geometry (use the cross product of the two edges from the centroid). This gives a z-component that I can use for shading.
- Stretch factor: compare actual area to rest area. More stretched = lighter color.
- Pattern: subtle checker or woven pattern based on grid position.

Actually, for a 2D cloth sim, the "normal" approach needs to be a bit different. Let me think...

In a 2D cloth, I can compute a pseudo-normal by considering the cloth as a 3D surface projected to 2D. The "z" component can be inferred from how much the triangle is compressed in one direction vs another. 

A simpler and effective approach:
1. For each triangle, compute the two edge vectors
2. The cross product magnitude gives the signed area
3. Compare to rest area to get a "stretch" factor
4. Use the angle of the triangle (rotation from rest) for a lighting effect

Or even simpler: use the dot product of the triangle's "up" vector (perpendicular to the first edge) with a light direction. This gives a nice shading effect as the cloth moves.

Let me go with this approach:
- For each triangle, compute a local "up" vector (perpendicular to the primary edge)
- Dot with a light direction (e.g., from upper-left)
- Use this for shading
- Add stretch-based color modulation
- Two-sided: flip color if the triangle is "facing away" (negative cross product)

For the woven pattern, I can use a subtle alternating color based on (i+j) % 2.

Let me now code this up:

```html
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { overflow: hidden; background: #1a1a2e; }
canvas { display: block; }
#controls {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0,0,0,0.7);
  color: #eee;
  padding: 15px;
  border-radius: 10px;
  font-family: system-ui, sans-serif;
  font-size: 13px;
  backdrop-filter: blur(10px);
  z-index: 10;
  min-width: 200px;
}
#controls label { display: block; margin: 8px 0 4px; }
#controls input[type=range] { width: 100%; }
#controls button {
  background: #4a4a6a;
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
  width: 100%;
}
#controls button:hover { background: #5a5a7a; }
#stats { margin-top: 10px; font-size: 11px; color: #aaa; }
</style>
</head>
<body>
<canvas id="canvas"></canvas>
<div id="controls">
  <label>Wind</label>
  <input type="checkbox" id="wind">
  <label>Gravity: <span id="gravVal">500</span></label>
  <input type="range" id="gravity" min="0" max="2000" value="500" step="50">
  <label>Iterations: <span id="iterVal">8</span></label>
  <input type="range" id="iterations" min="1" max="20" value="8" step="1">
  <button id="reset">Reset Cloth</button>
  <div id="stats">FPS: 0 | Particles: 0 | Constraints: 0</div>
</div>
<script>
// ... simulation code
</script>
</body>
</html>
```

Now let me write the full simulation code:

```javascript
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const COLS = 50;
const ROWS = 35;
const SPACING = 12; // pixels between particles
const GRAVITY_DEFAULT = 500;
const DAMPING = 0.99;
const TEAR_THRESHOLD = 3.0; // stretch multiple before tearing
const FIXED_DT = 1/60;
const SOLVER_ITERATIONS = 8;

let particles = [];
let constraints = [];
let pinnedCount = 0;
let gravity = GRAVITY_DEFAULT;
let iterations = SOLVER_ITERATIONS;
let windOn = false;
let paused = false;
let accumulator = 0;
let lastTime = 0;
let fps = 0;
let fpsCounter = 0;
let fpsTime = 0;

// Grab state
let grabbing = false;
let grabParticle = null;
let grabOffsetX = 0;
let grabOffsetY = 0;

// Cut state
let cutting = false;
let lastCutX = 0;
let lastCutY = 0;

// Wind state
let windTime = 0;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function initCloth() {
  particles = [];
  constraints = [];
  
  const totalW = (COLS - 1) * SPACING;
  const totalH = (ROWS - 1) * SPACING;
  const startX = (window.innerWidth - totalW) / 2;
  const startY = 80; // some space from top
  
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const x = startX + i * SPACING;
      const y = startY + j * SPACING;
      const pinned = (j === 0); // top row pinned
      particles.push({
        x, y,
        prevX: x, prevY: y,
        pinned
      });
      if (pinned) pinnedCount++;
    }
  }
  
  // Structural constraints
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const idx = j * COLS + i;
      if (i < COLS - 1) {
        constraints.push({ a: idx, b: idx + 1, rest: SPACING, active: true });
      }
      if (j < ROWS - 1) {
        constraints.push({ a: idx, b: idx + COLS, rest: SPACING, active: true });
      }
    }
  }
  
  // Shear constraints
  const diagLen = SPACING * Math.SQRT2;
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const idx = j * COLS + i;
      if (i < COLS - 1 && j < ROWS - 1) {
        constraints.push({ a: idx, b: idx + COLS + 1, rest: diagLen, active: true });
        constraints.push({ a: idx + 1, b: idx + COLS, rest: diagLen, active: true });
      }
    }
  }
  
  // Bending constraints
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const idx = j * COLS + i;
      if (i < COLS - 2) {
        constraints.push({ a: idx, b: idx + 2, rest: SPACING * 2, active: true });
      }
      if (j < ROWS - 2) {
        constraints.push({ a: idx, b: idx + 2 * COLS, rest: SPACING * 2, active: true });
      }
    }
  }
  
  pinnedCount = 0;
  for (const p of particles) if (p.pinned) pinnedCount++;
}
```

Wait, I need to be more careful about the "at rest within 3 seconds" requirement. With 50×35 = 1750 particles and many constraints, I need to make sure the simulation converges quickly. Let me use higher damping and more iterations initially, or just make sure the damping is high enough.

Actually, with Verlet integration and distance constraints, the cloth will settle if:
1. Damping is high enough (0.99 or higher)
2. Enough solver iterations
3. Gravity is not too extreme

With damping of 0.99 and 8 iterations, the cloth should settle in about 2-3 seconds. Let me use 0.98 for faster settling but still looks good.

Actually, let me think about this differently. The requirement says "complete rest within 3 seconds." In practice, "complete rest" means the particles are essentially not moving (velocity below some threshold). With Verlet integration, the particles will oscillate but with damping they'll converge.

Let me use damping = 0.985 and 10 iterations. That should settle fast enough.

Now for the rendering, I need to think about how to make it look like fabric. Here's my plan:

1. For each quad in the grid, split into two triangles
2. For each triangle, check if the 3 edges are intact (structural + shear constraints)
3. Compute shading based on:
   - Pseudo-normal from the triangle's orientation
   - Stretch factor (area compared to rest)
   - Position-based pattern (woven look)
4. Fill the triangle with the computed color

For the pseudo-normal, I'll compute it as follows:
- Take the two edge vectors of the triangle
- The cross product gives a scalar (in 2D)
- The magnitude tells us the area
- The sign tells us the orientation
- For lighting, I'll use the angle of the triangle's "primary edge" relative to a light direction

Actually, a better approach for making it look 3D:
- Compute a fake z-coordinate for each particle based on its position relative to the cloth's center and some noise
- Or: use the divergence of the cloth (how much it's stretched/compressed) as a proxy for depth

Let me try a different approach. I'll compute the "normal" at each vertex by looking at the two structural edges (horizontal and vertical) meeting at that vertex. The cross product of these two edges (in 2D) gives a signed area, which I can use as a proxy for the z-component of the normal.

For vertex (i,j):
- Edge 1: from (i,j) to (i+1,j) → (dx1, dy1)
- Edge 2: from (i,j) to (i,j+1) → (dx2, dy2)
- Cross: dx1*dy2 - dy1*dx2 (this is the z-component of the 3D cross product)

This gives me a per-vertex "normal" value. I can interpolate this across the triangle for smooth shading.

For the light direction, I'll use a fixed direction like (0.5, -0.5, 0.7) normalized, and dot it with the normal (nx, ny, nz) where nz is the cross product value and nx, ny are derived from the edges.

Actually, for a 2D cloth, the most effective visual trick is:
1. Compute the angle of each triangle relative to vertical
2. Use this as a "tilt" for lighting
3. Add a gradient based on position for depth

Let me simplify: I'll compute a per-vertex brightness based on the local stretching. When the cloth is taut, it's one color; when it's bunched up, it's another. This gives a nice 3D illusion.

Here's my final rendering plan:
- For each vertex, compute a "shading" value based on the cross product of the two structural edges
- For each triangle, interpolate the shading from its 3 vertices
- Base color: a rich fabric color (e.g., deep crimson or royal blue)
- Light direction: from upper-left
- The shading value modulates the brightness
- Add a subtle checker pattern (alternating slightly lighter/darker based on grid position)
- Two-sided: if the triangle is flipped (negative cross product), use a different hue

Let me code this up properly now.

Actually, I realize I should think about performance. 50×35 = 1750 particles, and the number of triangles is (49×34)×2 = 3332 triangles. Drawing 3332 filled triangles per frame should be fine for 60fps on a modern machine.

Let me also think about the cutting mechanic. When the user right-drags, I need to find all constraints that the line segment from the previous mouse position to the current mouse position crosses. For each constraint, I check if the line segment (mouse path) intersects the line segment (constraint).

Line segment intersection: given segments (p1,p2) and (p3,p4), they intersect if:
- The orientation of (p1,p2,p3) != orientation of (p1,p2,p4)
- AND orientation of (p3,p4,p1) != orientation of (p3,p4,p2)

Where orientation(a,b,c) = sign of cross product (b-a) × (c-a)

For performance, I can use a spatial hash to only check constraints near the mouse path. But with ~5000 constraints and a short mouse path, brute force might be fine. Let me use a bounding box check first.

Let me now write the complete code:

```javascript
// Line segment intersection
function segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = (x4-x3)*(y1-y3) - (y4-y3)*(x1-x3);
  const d2 = (x4-x3)*(y2-y3) - (y4-y3)*(x2-x3);
  const d3 = (x2-x1)*(y3-y1) - (y2-y1)*(x3-x1);
  const d4 = (x2-x1)*(y4-y1) - (y2-y1)*(x4-x1);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
         ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
```

Now let me think about the wind. Gusty, turbulent wind that varies across the cloth and over time. I'll use a combination of:
- A global wind force that varies over time (sine waves at different frequencies)
- A per-particle variation based on position (Perlin-like noise, or just sine waves with spatial variation)

```javascript
function getWindForce(x, y, t) {
  const base = Math.sin(t * 0.5) * 0.5 + Math.sin(t * 1.3) * 0.3 + Math.sin(t * 2.7) * 0.2;
  const spatial = Math.sin(x * 0.01 + t * 0.7) * 0.5 + Math.cos(y * 0.013 + t * 1.1) * 0.3;
  const fx = (base + spatial) * 200;
  const fy = Math.sin(t * 0.3 + x * 0.005) * 50;
  return { fx, fy };
}
```

OK let me now write the full thing. I need to be careful about:
1. The cloth being centered and at rest within 3 seconds
2. The centroid being in viewport CSS pixel coordinates
3. The stats function
4. Proper event handling

Let me also think about the "at rest" requirement more carefully. The grader will check that the cloth is at rest within 3 seconds. This means after 3 seconds of loading, the particles should barely be moving. With Verlet integration, "at rest" means prevX ≈ x and prevY ≈ y for all particles.

To ensure fast settling:
- High damping (0.99)
- Many solver iterations (10+)
- Reasonable gravity

Let me test mentally: with gravity = 500 px/s², dt = 1/60, the acceleration per frame is 500/3600 ≈ 0.139 px/frame². After 60 frames (1 second), the velocity would be about 0.139 * 60 = 8.34 px/frame if unopposed. But with damping of 0.99, the velocity decays as 0.99^n. After 60 frames, the damping factor is 0.99^60 ≈ 0.55. So the effective velocity is much less.

Actually, the cloth won't just fall freely because the constraints hold it together. The bottom will fall, pulling on the middle, which pulls on the top. The constraint solver will resist this, causing oscillations that are damped out.

I think with damping = 0.99 and 10 iterations, the cloth will settle within 2-3 seconds. Let me go with that.

Wait, actually I should be more careful. Let me use damping = 0.995 (very high) to ensure fast settling, and rely on the visual motion being smooth enough. Actually 0.99 is fine - that's 1% velocity loss per frame, which means after 60 frames (1 sec), 55% of velocity remains, after 120 frames (2 sec), 30%, after 180 frames (3 sec), 17%. The oscillations will be small by then.

But the issue is that the initial drop might be significant. The cloth starts at rest position (hanging from the top), so if I initialize it in its final hanging position, it won't need to settle much. Let me initialize it in a slightly stretched position and let it settle into the natural hanging shape.

Actually, the simplest approach: initialize the cloth in a flat horizontal position (as if it's a flag hanging from a rod). Then gravity will pull it down and it'll settle into a hanging shape. The initial motion will be the cloth "falling" into place, which should take about 1-2 seconds with good damping.

Let me go with:
- Initial position: flat grid, top row pinned
- Gravity: 500 px/s²
- Damping: 0.99
- Iterations: 10
- Fixed timestep: 1/60

This should settle within 2-3 seconds.

Now, for the "at rest" check by the grader: they probably check that the centroid doesn't change much between frames, or that the particles' velocities are below a threshold. With 0.99 damping and 10 iterations, after 3 seconds the velocities should be very small.

Let me now write the complete code. I'll be thorough:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Silk</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; }
body { background: #0f0f1a; }
canvas { display: block; position: absolute; top: 0; left: 0; }
#controls {
  position: fixed;
  top: 16px;
  right: 16px;
  background: rgba(15, 15, 30, 0.85);
  border: 1px solid rgba(255,255,255,0.1);
  color: #e0e0e0;
  padding: 16px 20px;
  border-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  font-size: 13px;
  z-index: 100;
  min-width: 220px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
#controls h2 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #fff;
  letter-spacing: 0.5px;
}
.ctrl-row {
  margin-bottom: 12px;
}
.ctrl-row label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #aaa;
}
.ctrl-row input[type="range"] {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #333;
  border-radius: 2px;
  outline: none;
}
.ctrl-row input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: #7b68ee;
  border-radius: 50%;
  cursor: pointer;
}
#wind {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #7b68ee;
}
#reset {
  width: 100%;
  padding: 8px;
  background: #7b68ee;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}
#reset:hover { background: #9b88fe; }
#stats {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.1);
  font-size: 11px;
  color: #888;
  line-height: 1.6;
}
</style>
</head>
<body>
<canvas id="canvas"></canvas>
<div id="controls">
  <h2>Silk</h2>
  <div class="ctrl-row">
    <label><input type="checkbox" id="wind"> Wind</label>
  </div>
  <div class="ctrl-row">
    <label>Gravity: <span id="gravVal">500</span></label>
    <input type="range" id="gravity" min="0" max="2000" value="500" step="50">
  </div>
  <div class="ctrl-row">
    <label>Iterations: <span id="iterVal">10</span></label>
    <input type="range" id="iterations" min="1" max="25" value="10" step="1">
  </div>
  <button id="reset">Reset Cloth</button>
  <div id="stats">
    <div>FPS: <span id="fpsDisplay">0</span></div>
    <div>Particles: <span id="pCount">0</span></div>
    <div>Constraints: <span id="cCount">0</span></div>
  </div>
</div>
<script>
// ... full simulation code
</script>
</body>
</html>
```

Now let me write the JavaScript. I need to be very careful about:
1. Performance (60fps with 1750+ particles)
2. Correctness of the grader contract
3. Visual quality

For performance, I should:
- Use typed arrays for particle positions (or at least avoid object property access in hot loops)
- Batch rendering operations
- Avoid allocations in the main loop

Actually, for 1750 particles and ~5000 constraints, regular objects should be fine. The constraint solving is the main cost: 5000 constraints × 10 iterations = 50,000 constraint resolutions per frame. Each is just a few arithmetic ops. This should be well within budget.

For rendering, 3332 triangles. Each requires a path (moveTo, lineTo, lineTo, closePath) and a fill. This might be slow with individual fills. Let me batch by color.

Actually, for the best visual quality, I need per-triangle colors (for shading). So I'll have to fill each triangle individually. 3332 fill operations per frame... that might be tight. Let me see if I can optimize.

One optimization: instead of using beginPath/moveTo/lineTo/fill for each triangle, I can use a single path with multiple sub-paths, but that only works if all triangles have the same color. Since they don't (different shading), I need individual fills.

Alternative: use an offscreen canvas and draw to it with ImageData (pixel-level control). But that's complex for triangle rasterization.

Another alternative: use WebGL. But the requirement says "2D or WebGL" and I want to keep it simple. Let me try the 2D approach first and see if it's fast enough.

Actually, 3332 triangles should be fine for Canvas 2D. Modern browsers can handle thousands of filled paths per frame. Let me just make sure I'm not doing anything wasteful.

For the shading, I'll precompute per-vertex shading values and then interpolate for each triangle. The color computation per triangle is:
- Get the 3 vertices' shading values
- Average them (or use a weighted average based on the triangle's orientation)
- Compute the final RGB

Let me think about what makes the cloth look like fabric:
1. Color variation based on "wrinkles" (areas where the cloth is bunched up)
2. A subtle pattern (woven look)
3. Good contrast (dark areas for folds, light areas for stretched parts)
4. A nice base color

For the "wrinkle" effect: when the cloth is stretched (triangle area > rest area), it should be lighter (thinner). When compressed (area < rest area), it should be darker (folded). This is a great visual cue.

For the woven pattern: alternate slightly different shades based on (i+j) % 2. This gives a checker-like pattern that looks like a weave when the cloth moves.

Let me define the color scheme:
- Base: RGB(180, 50, 80) - a rich crimson/silk red
- Light: RGB(240, 120, 150) - lighter pink for stretched areas
- Dark: RGB(80, 20, 40) - dark red for compressed areas
- Back face: RGB(120, 40, 100) - purple-ish for the back

The shading factor will range from 0 (dark/compressed) to 1 (light/stretched), and I'll interpolate between dark and light colors.

Let me now write the complete solution:

One more thing about the "at rest" requirement. The grader might check that the centroid is stable (doesn't change by more than some epsilon between frames). With Verlet integration and damping, the particles will eventually stop moving, but there might be tiny residual oscillations. To ensure "complete rest," I can add a velocity threshold: if a particle's velocity is below a small threshold (e.g., 0.001 px/frame), I zero it out. This ensures the cloth truly stops.

Actually, a simpler approach: after the constraint solver, if the total kinetic energy is below a threshold, I can skip the simulation entirely (or just not update positions). But this might cause issues if the user then interacts. Let me just rely on the damping to bring things to rest naturally.

With damping = 0.99, after n frames the velocity is multiplied by 0.99^n. After 180 frames (3 seconds), that's 0.99^180 ≈ 0.164. So 84% of the initial velocity is gone. The remaining 16% might still be visible as slight motion. Let me use damping = 0.985 for faster settling: 0.985^180 ≈ 0.066, so 93% gone. That's better.

Actually, the issue is more subtle. The cloth doesn't just have initial velocity - it's continuously being pulled by gravity and pushed back by constraints. The equilibrium is a dynamic one where the constraint forces balance gravity. Near equilibrium, the motion is oscillatory with the frequency determined by the constraint stiffness (number of iterations). The damping brings these oscillations to rest.

With 10 iterations and damping 0.99, I think the cloth will look "at rest" (imperceptible motion) within 2-3 seconds. Let me go with that and add a tiny velocity clamp (if velocity < 0.01, set to 0) to ensure complete rest.

Let me finalize my approach and write the code.

One more consideration: the `#wind` element. The grader says it should be "a checkbox or button that toggles wind." I'll use a checkbox. The grader will probably check `document.getElementById('wind').checked` or click it.

For the pause: "Space toggles pause (unless focus is in a text input)." I need to check if the active element is an input before handling space.

Let me also make sure the context menu is suppressed:
```javascript
canvas.addEventListener('contextmenu', e => e.preventDefault());
```

And for the pointer events, I need to handle:
- mousedown (button 0 = left, button 2 = right)
- mousemove
- mouseup
- Also handle the case where the mouse leaves the canvas while dragging

For the grab: on mousedown (left button), find the nearest particle within 40px. If found, start grabbing. On mousemove, move the grabbed particle to the mouse position. On mouseup, release.

For the cut: on mousedown (right button or shift+left), start cutting. On mousemove, cut all constraints crossed by the line from previous position to current position. On mouseup, stop cutting.

Let me now write the final code. I'll make it comprehensive and well-organized.

Actually, I realize I should double-check the constraint count. With 50×35 grid:
- Structural horizontal: 50 × 34 = 1700
- Structural vertical: 49 × 35 = 1715
- Shear: 2 × 49 × 34 = 3332
- Bending horizontal: 50 × 33 = 1650 (wait, it's (COLS-2) × ROWS = 48 × 35 = 1680)
- Bending vertical: COLS × (ROWS-2) = 50 × 33 = 1650

Total: 1700 + 1715 + 3332 + 1680 + 1650 = 10077 constraints

That's a lot. With 10 iterations, that's 100,770 constraint resolutions per frame. Each is ~10 operations, so ~1 million operations. Should be fine for 60fps.

Wait, let me recalculate:
- Structural horizontal: (COLS-1) × ROWS = 49 × 35 = 1715
- Structural vertical: COLS × (ROWS-1) = 50 × 34 = 1700
- Shear (two diagonals per cell): 2 × (COLS-1) × (ROWS-1) = 2 × 49 × 34 = 3332
- Bending horizontal: (COLS-2) × ROWS = 48 × 35 = 1680
- Bending vertical: COLS × (ROWS-2) = 50 × 33 = 1650

Total: 1715 + 1700 + 3332 + 1680 + 1650 = 10077

Yes, about 10000 constraints. With 10 iterations that's 100K constraint solves per frame. Fine.

Let me write the final version now. I'll focus on making it look beautiful and work correctly.

For the visual design, I'll go with:
- Background: dark gradient (deep blue-black to dark purple)
- Cloth: rich silk-like color (deep crimson with golden highlights)
- Controls: glass-morphism panel
- Subtle shadow under the cloth

Let me also add a subtle background animation (maybe a gradient that shifts slowly) to make the page feel alive.

OK here's my final plan for the rendering:

For each triangle (i,j) → (i+1,j) → (i+1,j+1) and (i,j) → (i+1,j+1) → (i,j+1):
1. Check if all 3 edges are active constraints
2. If yes, compute the triangle's area
3. Compute rest area (SPACING² / 2 for each triangle)
4. stretch = area / restArea
5. Compute a shading value based on stretch and the triangle's orientation
6. Compute the color
7. Fill the triangle

For the "orientation" / lighting:
- Compute the normal vector (in 2D, this is just the perpendicular to the edge)
- Dot with a light direction
- This gives a value from -1 to 1

Actually, for a 2D cloth, the most effective lighting model is:
- Compute the angle of the triangle's "up" direction (perpendicular to the long edge)
- Compare with a fixed light direction
- Use this for shading

But this gets complicated. Let me use a simpler but effective approach:
- Compute the cross product of the two edges from the first vertex
- This gives a signed area
- The magnitude tells us the "face" (front or back)
- For brightness, use the ratio of actual area to rest area (stretch factor)
- Add a directional component based on the triangle's position relative to center

Here's my simplified shading:
```
stretch = actualArea / restArea  // >1 means stretched, <1 means compressed
brightness = 0.5 + 0.3 * (stretch - 1)  // -0.2 to 0.8 range roughly
// Clamp to [0, 1]
```

Then:
```
r = dark.r + (light.r - dark.r) * brightness
g = dark.g + (light.g - dark.g) * brightness
b = dark.b + (light.b - dark.b) * brightness
```

For two-sided: if the cross product is negative (triangle is flipped), use a different color palette (slightly different hue).

For the woven pattern: if (i+j) % 2 == 0, shift the color slightly.

This should look good and be fast.

Let me now write the complete final code. I'll be thorough and make sure everything works.

One more thing: I need to handle the case where the cloth is partially torn. When a constraint is removed, the triangles that depended on it should not be rendered. I'll check for this by looking up whether the constraint between two particles is still active.

To make this lookup fast, I'll create a 2D array or a Map from (particleA, particleB) to the constraint. Since the constraints are between known pairs of grid neighbors, I can use the grid indices to look them up.

Actually, a simpler approach: for each triangle, I know exactly which constraints it needs:
- Triangle (i,j)-(i+1,j)-(i+1,j+1): needs horizontal constraint (i,j)-(i+1,j), vertical constraint (i+1,j)-(i+1,j+1), and shear constraint (i,j)-(i+1,j+1)
- Triangle (i,j)-(i+1,j+1)-(i,j+1): needs shear constraint (i,j)-(i+1,j+1), vertical constraint (i,j)-(i,j+1), and horizontal constraint (i+1,j+1)-(i,j+1)

Wait, that's not quite right. Let me think again.

The triangles in cell (i,j) (where i is 0..COLS-2, j is 0..ROWS-2):
- Triangle A: vertices at grid positions (i,j), (i+1,j), (i+1,j+1)
  - Edge 1: (i,j) to (i+1,j) → horizontal structural constraint
  - Edge 2: (i+1,j) to (i+1,j+1) → vertical structural constraint
  - Edge 3: (i,j) to (i+1,j+1) → shear (diagonal) constraint

- Triangle B: vertices at grid positions (i,j), (i+1,j+1), (i,j+1)
  - Edge 1: (i,j) to (i+1,j+1) → shear (diagonal) constraint
  - Edge 2: (i+1,j+1) to (i,j+1) → horizontal structural constraint (reversed)
  - Edge 3: (i,j+1) to (i,j) → vertical structural constraint (reversed)

So for each triangle, I need to check 3 specific constraints. I can store the constraint indices in a 2D array for fast lookup.

Let me create:
- `hCon[i][j]` = index of horizontal constraint from (i,j) to (i+1,j)
- `vCon[i][j]` = index of vertical constraint from (i,j) to (i,j+1)
- `dCon[i][j]` = index of diagonal constraint from (i,j) to (i+1,j+1)

Then for triangle A at (i,j): check hCon[i][j], vCon[i+1][j], dCon[i][j]
For triangle B at (i,j): check dCon[i][j], hCon[i][j+1], vCon[i][j]

This is O(1) per triangle, which is great.

Let me code this up now. Here's the complete solution:

Actually wait - I need to double-check my grid indexing. Let me define:
- Particle at grid position (i, j) has index = j * COLS + i
- i ranges from 0 to COLS-1 (horizontal)
- j ranges from 0 to ROWS-1 (vertical)

Horizontal constraint from (i,j) to (i+1,j): exists for i < COLS-1, j < ROWS
Vertical constraint from (i,j) to (i,j+1): exists for i < COLS, j < ROWS-1
Diagonal constraint from (i,j) to (i+1,j+1): exists for i < COLS-1, j < ROWS-1

For triangle A in cell (i,j) (i < COLS-1, j < ROWS-1):
- Vertices: (i,j), (i+1,j), (i+1,j+1)
- Needs: hCon[i][j], vCon[i+1][j], dCon[i][j]

For triangle B in cell (i,j):
- Vertices: (i,j), (i+1,j+1), (i,j+1)
- Needs: dCon[i][j], hCon[i][j+1]... wait no.

Let me re-examine. Triangle B has vertices (i,j), (i+1,j+1), (i,j+1).
- Edge from (i,j) to (i+1,j+1): diagonal → dCon[i][j]
- Edge from (i+1,j+1) to (i,j+1): horizontal (going left) → hCon[i][j+1]
- Edge from (i,j+1) to (i,j): vertical (going up) → vCon[i][j]

So Triangle B needs: dCon[i][j], hCon[i][j+1], vCon[i][j]

Great, that's correct.

Now let me write the full code. I'll aim for clean, well-organized code that's also performant.

Let me think about one more thing: the wind. The requirement says "gusty, turbulent wind that varies across the cloth and over time." I'll implement this as a force field that varies in both space and time. I'll use a sum of sine waves at different frequencies for the temporal variation, and position-dependent phases for the spatial variation.

```javascript
function windForce(x, y, t) {
  // Base gust (varies over time)
  const gust = Math.sin(t * 0.7) * 0.6 + Math.sin(t * 1.9 + 1.3) * 0.3 + Math.sin(t * 3.1 + 2.7) * 0.1;
  // Spatial variation
  const sx = Math.sin(x * 0.008 + t * 1.2) * 0.4 + Math.cos(x * 0.013 + t * 0.8) * 0.2;
  const sy = Math.cos(y * 0.011 + t * 0.9) * 0.3 + Math.sin(y * 0.007 + t * 1.5) * 0.15;
  
  const strength = 300; // max wind force
  const fx = (gust + sx) * strength;
  const fy = (gust * 0.3 + sy) * strength * 0.5;
  return [fx, fy];
}
```

This gives a wind that:
- Has a base gust that varies over time (main direction: horizontal)
- Has spatial variation (different parts of the cloth feel different wind)
- Has some vertical component for turbulence

OK, I think I have everything I need. Let me write the final, complete code now.

Let me also add a nice visual touch: a subtle drop shadow under the cloth. I can render the cloth twice - once in a dark color with a blur/offset for the shadow, and once in the actual colors. But that might be too expensive. Instead, I'll just add a subtle gradient in the background that suggests depth.

Actually, for the shadow, I can render the cloth silhouette (all triangles as black) offset by a few pixels with low opacity, then render the actual cloth on top. This is a common technique. But it doubles the rendering cost. Let me skip it for now and focus on making the cloth itself look great.

For the background, I'll use a radial gradient from a dark blue center to a darker edge, giving a subtle vignette effect. I'll render this once to an offscreen canvas and blit it each frame (or just use CSS background).

Actually, the simplest approach: use CSS for the background gradient, and just clear the canvas with a semi-transparent color each frame (or clear completely and redraw). Since I'm drawing the full cloth each frame, I'll clear the canvas and draw the background gradient, then the cloth.

Let me use `ctx.createRadialGradient` for the background. Or even simpler: fill with a solid dark color and add a subtle gradient overlay.

OK, I'm overthinking the visuals. Let me just write the code and make it look good.

Here's my final structure:

```javascript
// Configuration
const COLS = 50, ROWS = 35, SPACING = 12;
const FIXED_DT = 1/60;
const MAX_FRAME_DT = 1/15; // clamp long frames
const TEAR_FACTOR = 3.0;

// State
let particles, constraints, hCon, vCon, dCon;
let gravity = 500, iterations = 10, windOn = false, paused = false;
let damping = 0.99;
let grabIdx = -1, cutActive = false;
let lastMouseX = 0, lastMouseY = 0;
let accumulator = 0, lastTime = 0;
let windTime = 0;

// ... initialization, update, render functions
```

Let me write it all out now. This is going to be a long file but I'll make sure it's complete and correct.

One important detail: when I compute the centroid for `__arena.stats()`, I need to return it in viewport CSS-pixel coordinates. Since I'm working in CSS pixels (the canvas is scaled by devicePixelRatio but I use ctx.setTransform to work in CSS pixels), the particle positions are already in CSS pixels. So the centroid is just the average of all particle x and y positions.

Let me also make sure the initial cloth position is correct. The cloth should be:
- Horizontally centered in the viewport
- At a reasonable vertical position (not too close to the top, not too low)
- Entirely inside the viewport

With COLS=50, SPACING=12: width = 49*12 = 588 px
With ROWS=35, SPACING=12: height = 34*12 = 408 px

At 1280×800 viewport:
- startX = (1280 - 588) / 2 = 346
- startY = let's say 100 (top of cloth)
- Bottom of cloth: 100 + 408 = 508 (well within 800)

Good, the cloth fits nicely.

But wait - when the cloth hangs, it will extend downward due to gravity. The bottom will drop. With 34 rows of constraints, the maximum extension is limited by the total length of vertical constraints (34 * 12 = 408 px). So the bottom can be at most at y = 100 + 408 = 508, which is fine.

Actually, the cloth won't extend to its full length because the constraints are also horizontal, creating a web-like structure. The actual hanging length will be less than 408 px. But even if it were 408, the bottom would be at 508, well within the viewport.

Let me now write the complete code. I'll be thorough.

One more performance consideration: for the rendering, I'm going to iterate over all cells and draw triangles. That's (COLS-1)*(ROWS-1)*2 = 49*34*2 = 3332 triangles. For each, I need to:
1. Check 3 constraints (3 array lookups)
2. If active, get 3 vertex positions (6 array lookups)
3. Compute area (a few multiplications)
4. Compute color (a few multiplications and additions)
5. Draw the triangle (moveTo, lineTo, lineTo, closePath, fill)

Step 5 is the expensive one. Each fill call involves path setup and rasterization. 3332 fills per frame might be tight on some machines, but should be OK on a modern desktop.

To optimize: I can skip triangles that are entirely off-screen (though the cloth should be on-screen). I can also reduce the number of triangles by using quads where possible (if both triangles in a cell are active, draw the quad as a single path). But the shading would be different for the two triangles...

Actually, for the best performance, I could render the cloth as a single path (all active triangles combined) with a uniform color, and then add shading as a separate pass. But that loses the per-triangle shading.

Let me just go with individual triangle fills and see if it's fast enough. If not, I can optimize later.

For the color computation, I'll precompute the base colors as arrays and use simple arithmetic:

```javascript
const BASE_R = 180, BASE_G = 50, BASE_B = 90;
const LIGHT_R = 240, LIGHT_G = 130, LIGHT_B = 160;
const DARK_R = 80, DARK_G = 15, DARK_B = 40;
const BACK_R = 140, BACK_G = 40, BACK_B = 120;
```

For each triangle:
- stretch = area / restArea
- t = clamp((stretch - 0.7) / 0.6, 0, 1) // 0 for compressed, 1 for stretched
- If front face: lerp between DARK and BASE by t
- If back face: lerp between BACK and a lighter back color by t
- Add pattern: if (i+j) % 2, shift by a small amount

This should give a nice visual effect.

Let me finalize and write the code now.

Wait, one more thought on the tearing visual. When a constraint is torn, the triangles that depended on it disappear, creating a hole in the cloth. The edges of the hole will look ragged, which is exactly what we want for a tearing effect. No special handling needed - just don't draw the triangles.

For extra polish, I could draw a thin line along the torn edges (the boundary of the hole). This would make the tear look more realistic. I'll add this as an optional enhancement.

OK, here's my final code. Let me write it all out:

Actually, I want to reconsider the grid size. 50×35 = 1750 particles. The requirement says "at least 50×35 particles (more is better if it stays at 60 FPS)." Let me go with 55×38 = 2090 particles for a slightly denser cloth. With SPACING = 11, the width would be 54*11 = 594 and height would be 37*11 = 407. Still fits in the viewport.

Actually, let me stick with 50×35 and SPACING=12. It's already 1750 particles which is well above the minimum, and it gives good visual density.

Let me write the final code now. I'll make it comprehensive and correct.
