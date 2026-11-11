# Task: Silk — an interactive, tearable cloth simulation

Build real-time cloth simulation you can grab, pull, cut and blow around, rendered as beautiful shaded fabric.

Requirements: one file index.html with all inline. No external resources. No CDNs. Target latest desktop Chrome 1280x800. No errors console. No alert etc.

Simulation: rectangular cloth at least 50x35 particles, pinned along top edge. Verlet integration with distance constraints: structural + shear and/or bending, several solver iterations per step, gravity, damping. Fixed timestep with accumulator, clamp long frames.

Stable: no jitter, no explosions. With wind off and no interaction, cloth must come to complete rest within 3 seconds of loading (and after any interaction ends).

Interaction: left-drag grabs nearest particle within 40px and pulls. Right-drag cuts every constraint cursor path crosses. Right-click must not open context menu. Constraints also tear when stretched far beyond rest length. Wind toggle: gusty turbulent wind varies across cloth and over time. Off initially. Space toggles pause (unless focus is in text input). While paused nothing moves. Controls panel: wind toggle, gravity slider, solver-iterations slider, reset button, live stats (FPS, particles, constraints).

Rendering: shaded fabric surface, not wireframe: filled triangles with lighting/shading, correctly torn edges (no triangles bridging a cut). Full-window canvas, crisp on HiDPI, handles resize without distorting.

Grader contract:

1. canvas covering full viewport
2. window.__arena.stats() returns {particles, constraints, pinned, centroid: {x,y}} current number particles, intact constraints, pinned particles, average position of all particles in viewport CSS-pixel coordinates.
3. Controls: #wind (checkbox or button toggles wind), #reset (button rebuilds cloth), #gravity (input type range)
4. Space toggles pause; while paused canvas identical frame to frame (DOM text such as FPS readout may still update)
5. Pointer behavior exactly as described: left-drag grabs nearest particle within 40px, right-drag cuts, context menu suppressed.
6. Initially cloth visible, horizontally centered, at rest within 3 s, and entirely inside viewport; wind off.

Need to implement.

Challenges: No external resources. Must be inline.

We need Verlet integration.

Particles: x,y, oldx, oldy, pinned bool.

Constraints: i,j, restDist, broken bool.

We need at least 50x35 = 1750 particles. Constraints: structural horizontal/vertical, shear diagonal, maybe bending every 2 steps. Let's compute. 50*35=1750. Horizontal edges: 49*35=1715. Vertical: 50*34=1700. Shear: (49*34)*2? Actually diagonal both directions ~ 2*49*34=3332. That's ~ 6750 constraints. Times solver iterations maybe 5-10. 6750*10 = 67k per frame, fine. Plus bending maybe increase.

We need tearing when stretched far beyond rest length. E.g., if current distance > rest * tearThreshold (e.g., 1.8). Then break constraint.

Cutting: right-drag path crosses constraints. Need to detect constraints intersect line segment from previous mouse pos to current. For each constraint, check if line segment (p1-p2) intersects mouse segment. That's O(constraints) per move, could be heavy. But okay? 6750 constraints, drag at 60fps, maybe okay. Could optimize with spatial grid. Simpler: for each constraint, check distance from constraint line to point? Actually path crossing: we can for each constraint check if distance from its midpoint to line segment < threshold, or if segment intersects. Simpler approximation: if distance from either particle to cursor < 20px, break? But spec says crosses path. Could do for each constraint, check if the segment intersects the mouse segment using orientation test. That's fine for occasional drag.

Alternative: on mouse move while cutting, we test proximity of particles to cursor path: if cursor within radius of particle, break constraints attached. Simpler and acceptable? Might be okay. But spec says cuts every constraint cursor path crosses. Could approximate by breaking constraints whose particles are within say 15px of cursor point. That may be acceptable.

Better implement segment intersection for accuracy.

We also need grab: left-drag grabs nearest particle within 40px. While dragging, we set particle position to mouse position? For Verlet, we can pin it temporarily to cursor. Simpler: set particle.x = mouseX, particle.y = mouseY each frame while dragging, and also set old position to same to avoid velocity? Or we can apply force. Common approach: set particle position directly and mark as pinned temporarily. When release, unpin.

We need to handle right-drag (and Shift+left-drag). For trackpads, shift+left drag should act as cut.

Wind: gusty turbulent wind varies across cloth and over time. Off initially. Need wind toggle checkbox #wind. Wind force applied to particles (maybe each particle gets force based on noise). Use simple pseudo noise: sin(time * freq + x * scale) etc. Apply to velocity.

Gravity slider #gravity input range. Solver iterations slider.

Reset button #reset.

Live stats: FPS, particles, constraints.

Controls panel: must have #wind, #gravity, #reset. Also need solver iterations slider, maybe id #iterations? Not required by contract but required by requirements. Might need id. Could be #iterations.

Stats: window.__arena.stats() must return particles, constraints, pinned, centroid.

Centroid in viewport CSS-pixel coordinates. Our simulation uses canvas pixel coordinates. Need to map. We'll keep simulation in CSS pixels (canvas logical size). With HiDPI, canvas width = clientWidth * dpr, but drawing context scales. We'll use logical coordinates for simulation based on CSS pixels. So centroid should be average of particle positions in CSS pixels.

We need canvas covering full viewport. Use <canvas id="canvas"> style width:100vw height:100vh.

Handle resize: recalc canvas size, keep cloth? Probably keep cloth in same world coordinates, but need to keep it centered? If window resizes, particles remain. Could recenter? Simpler: on resize, just adjust canvas size, simulation continues. Cloth may go out of view. Acceptable? Requirement: handles resize without distorting. Might be okay.

Initial state: cloth visible, horizontally centered, at rest within 3s, entirely inside viewport. So need to create cloth with top pinned at some y near top, width appropriate.

Let's pick cloth width ~ 800px, height ~ 600px? 50 columns, 35 rows. Particle spacing ~ 16px? 49*16=784. Good. Height 34*16=544. Center horizontally.

Pin top row particles. Maybe pin all top row? Could pin some. Requirement: pinned along top edge (all or some). Let's pin all.

Verlet integration: for each particle not pinned (and not grabbed), newPos = pos + (pos - oldPos) * damping + acceleration * dt^2.

Acceleration: gravity + wind.

Wind: force vector (wx, wy). Apply as acceleration.

Damping: maybe 0.99? To come to rest within 3 seconds.

Solver iterations: for each iteration, for each constraint not broken, compute current distance, difference, correction = (dist - rest)/dist * stiffness. Stiffness maybe 0.5? Actually for position-based, correction = 0.5 * difference. We can use 1.0.

We need stable: with damping and several iterations.

Tearing: if dist > rest * tearThreshold (e.g., 1.5-2.0), break constraint.

Also constraints broken by cutting.

Rendering: shaded fabric surface, not wireframe. Filled triangles with lighting/shading. Could render with canvas 2D. Need to draw triangles for each quad split into two triangles. Compute normal for shading? Approximate.

Simplest: draw each quad as two triangles with fill style based on lighting. Could compute normal from triangle vertices (z=0). Actually cloth is 2D, but we can fake lighting based on particle positions relative to light source, using shading from stretch? Maybe compute approximate normal via neighboring points.

Alternative: use canvas 2D with gradient and simple shading based on angle to light. Could compute normal in 3D by assuming cloth has z displacement? Could just use simple shading based on vertex positions: compute face normal in 2D? Hmm.

Better: render with canvas 2D using fillStyle with color varying per triangle based on its area change (stretch) or orientation. Could compute approximate normal using 3D: assume particles have z = 0 initially, but movement in 2D only, so normal is constant. So shading static.

Alternative: use simple lighting based on particle velocity or curvature. Could compute normal from neighboring particles using cross product in 3D with z=0 -> degenerate.

Maybe we can fake fabric shading with a checker pattern and a gradient overlay based on particle positions. Could be acceptable for human judging.

Better approach: Use WebGL? Could be heavy. Canvas 2D is simpler.

We can draw triangles with fillStyle rgba with brightness based on dot product with light direction using estimated normal from triangle's 2D orientation: compute angle of triangle relative to vertical, shade.

Simpler: use a woven pattern: draw a grid of lines with varying opacity. But requirement says filled triangles with lighting/shading (e.g. by stretch, by approximate normals, a woven/checker pattern, two-sided coloring). So checker pattern is acceptable.

We can draw each quad as two triangles with fill color based on stretch factor (distance between particles). That gives visual feedback.

Torn edges: no triangles bridging a cut. If constraint is broken, we should not draw triangles that use that constraint? Actually triangles are formed by particles. If a constraint is broken, the cloth is still connected via other constraints, but triangle may still be drawn across broken edge? The edge of triangle is a constraint (structural). If constraint is broken, we should not draw triangle that includes that edge? Wait triangle edges are constraints: each triangle has three edges, each edge corresponds to a constraint (either structural or shear). If any edge is broken, triangle should not be drawn. That ensures no bridging.

Thus rendering loop: for each quad (i,j), if both triangles' edges are intact, draw them. Need mapping from constraint to index for quick check. Could for each triangle, check if all three constraints are intact. We can just check distance between particles? Might be expensive. Could precompute for each triangle the three constraint indices. Simpler: when drawing triangle, check if the three particle pairs are connected by an intact constraint. For structural constraints, we have adjacency. For diagonal shear constraints, we have adjacency. So we can check if constraint exists and not broken. Might need a lookup table.

Alternative: we can just draw triangles regardless, but skip if any of its edges is broken. To find if edge is broken, we can check if constraint between those two particles is broken. We can store constraints in a map keyed by particle indices (min,max). Use Map.

Simplify: during constraint creation, assign each constraint an id and store in array. Also store for each particle its neighbor constraints? Might be messy.

Alternative approach: just draw triangles using particle positions, and rely on constraints for physics, but rendering ignoring broken constraints may still show visual artifact where triangle spans across tear. Might be okay? Requirement says correctly torn edges (no triangles bridging a cut). So need to skip.

We can for each quad, have two triangles: (i,j), (i+1,j), (i+1,j+1) and (i,j), (i+1,j+1), (i,j+1). For each triangle, check three edges: (i,j)-(i+1,j), (i+1,j)-(i+1,j+1), (i,j)-(i+1,j+1) etc. We can check if constraint exists and not broken via a lookup dictionary.

Implement constraints as objects with i,j,rest, broken. Also store in a Set for quick lookup: key = `${min},${max}` -> constraint index or boolean broken.

Then drawing triangle: if lookup for each edge returns intact, draw.

Performance: 50*35=1750 particles, quads=49*34=1666, triangles=3332. Lookup per edge 3*3332=~10k per frame, fine.

Shading: compute color based on stretch. For each triangle, compute area current vs rest area. Or compute average stretch of edges. Compute brightness = 0.7 + 0.3 * (1 - stretch factor). Or use normal approximation: compute normal vector in 3D by assuming small z offset based on particle positions? Could use simple shading based on triangle orientation: compute vector along one edge, etc. Might be okay.

Better: compute approximate normal using particle positions in 2D, treat as 3D with z=0, normal is zero. So use stretch.

We can compute for each triangle, average stretch = average of edge lengths / rest lengths. Then brightness = clamp(1 - (stretch-1)*k). So stretched areas appear lighter/darker.

Also add checker pattern: alternate color per quad.

For beautiful fabric, we can use gradient background.

Controls panel: create div overlay top left with controls. Include checkbox #wind, range #gravity, range #iterations, button #reset, stats display.

Space toggles pause.

Pointer behavior: left mouse button drag. Need to track mouse down, up, move.

Right-drag cuts: on contextmenu prevent default. Also on mouse down with button 2 (right) or button 0 with shift key.

Implementation details:

HTML structure:
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Silk</title><style>...</style></head>
<body>
<canvas id="canvas"></canvas>
<div id="ui">...</div>
<script>...</script>
</body>
</html>

CSS: canvas full screen, ui position absolute top left, background semi-transparent.

JavaScript:

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

Handle HiDPI: function resize() { const dpr = window.devicePixelRatio ||1; const w = window.innerWidth; const h= window.innerHeight; canvas.width = w*dpr; canvas.height= h*dpr; canvas.style.width = w+'px'; canvas.style.height = h+'px'; ctx.setTransform(dpr,0,0,dpr,0,0); }

Simulation parameters:
cols = 50, rows = 35, spacing = 16.

Create cloth:
particles = [] for r in 0..rows-1 for c in 0..cols-1:
 x = centerX + (c - cols/2)*spacing
 y = topY + r*spacing
 particle = {x,y,ox:x,oy:y,pinned: r===0}
 particles push.

Constraints: array.

For each particle (r,c):
 if c<cols-1: create horizontal constraint between (r,c) and (r,c+1)
 if r<rows-1: vertical constraint between (r,c) and (r+1,c)
 shear: diagonal down-right between (r,c) and (r+1,c+1)
 diagonal down-left between (r,c+1) and (r+1,c)

Bending constraints maybe skip for performance.

Store constraints with i index = r*cols + c.

Also map edge key to constraint index for lookup.

Tear threshold: e.g., 1.8

Solver iterations: default 5, adjustable via slider.

Gravity: default 0.5? Units: pixels per frame^2? With Verlet dt fixed. Let's use fixed timestep dt=1/60 sec. Acceleration in pixels/sec^2. With dt=1/60, displacement = a * dt^2. So gravity ~ 1000 px/s2 gives ~0.278 px per step. Might be okay.

We need damping.

Implement simulation step:

function simulate(dt):
 if paused return
 apply forces: for each particle not pinned and not grabbed:
   vx = x - ox
   vy = y - oy
   ox = x; oy = y? Actually Verlet: newX = x + (x - oldX)*damping + ax*dt*dt
   So keep old.

Let's store px,py,ox,oy.

For each particle:
 if pinned or grabbed: skip integration? Actually grabbed particle position set to mouse.

Integration:
 const vx = (p.x - p.ox) * damping
 const vy = (p.y - p.oy) * damping
 p.ox = p.x
 p.oy = p.y
 p.x += vx + ax*dt*dt
 p.y += vy + ay*dt*dt

Acceleration: gravity downwards: ay = gravityValue (pixels/s2). Wind: add wind vector.

Wind: if windEnabled:
   windX = sin(time*0.001 + p.x*0.01) * gust...
Simpler: compute wind vector per particle: base wind = sin(time*0.5 + p.x*0.001) * 30 etc.

We can generate turbulent wind using multiple sines.

Let's define windStrength = 50. windX = sin(time*0.7 + p.x*0.005) * windStrength * gustFactor. windY = cos(time*0.5 + p.y*0.005) * windStrength *0.3.

Gust factor varies over time: gust = 0.5 + 0.5*sin(time*0.2).

Apply wind acceleration.

Constraints solver:
 for iter in 0..iterations-1:
   for each constraint not broken:
     p1 = particles[i]
     p2 = particles[j]
     dx = p2.x - p1.x
     dy = p2.y - p1.y
     dist = sqrt(dx*dx + dy*dy) || 0.0001
     diff = (dist - rest)/dist
     correction = diff * 0.5 (or stiffness)
     if not p1.pinned and not p1.grabbed? Actually grabbed particle should be treated as pinned for constraint? Might be okay.
     offsetX = dx * diff * 0.5
     offsetY = dy * diff * 0.5
     if not p1.pinned and !p1.grabbed: p1.x += offsetX; p1.y += offsetY
     if not p2.pinned and !p2.grabbed: p2.x -= offsetX; p2.y -= offsetY

After correction, check tear: if dist > rest * tearThreshold => constraint.broken = true

Also after solving, maybe break.

Need to ensure stability.

Fixed timestep with accumulator:
 lastTime = performance.now()
 accumulator =0
 fixedDt = 1/60
 maxSubsteps = 5

In animation loop:
 now = performance.now()
 frameTime = (now - lastTime)/1000
 lastTime = now
 frameTime = min(frameTime, 0.25) // clamp
 accumulator += frameTime
 while accumulator >= fixedDt:
   simulate(fixedDt)
   accumulator -= fixedDt

Then render.

Rendering:
 clear canvas with background gradient.

Draw cloth:
 ctx.save()
 for each quad:
   p00 = particles[r*cols + c]
   p10 = particles[r*cols + c+1]
   p01 = particles[(r+1)*cols + c]
   p11 = particles[(r+1)*cols + c+1]
   // triangle 1: p00,p10,p11
   // triangle 2: p00,p11,p01
   if edges intact:
     draw triangle.

Compute color: base color e.g., #e8c4a0 (silk). Shade based on lighting. We can compute normal approx using 3D? Could approximate normal from triangle's 2D area? Might just compute brightness based on stretch.

Let's compute for each triangle:
 edges lengths: compute current lengths, compare to rest. stretch = average(current/rest). brightness = 1 - (stretch-1)*0.5. Clamp 0.5-1.5.

Fill color with HSL.

Also checker pattern: alternate quad color.

We can draw with ctx.fillStyle = `rgb(${r},${g},${b})`.

For better look, add subtle texture using canvas pattern? Could generate offscreen canvas with noise.

Simplify: draw triangles with fillStyle based on brightness.

Also draw edges? No wireframe.

Torn edges: we already skip triangles with broken edge.

Potential issue: particles pinned at top. Need to ensure they stay.

Grabbing:
 On mousedown left button:
   find nearest particle within 40px.
   if found, set grabbedParticle = particle, particle.grabbed = true, store offset? Could just set particle position to mouse each frame.
   While dragging, update particle.x = mouseX, particle.y = mouseY. Also update old position to same to avoid velocity buildup? Set particle.ox = particle.x; particle.oy = particle.y after setting.

On mouseup, release.

Right-drag cutting:
 On mousedown right button (button 2) or left with shift:
   cutting = true
   lastCutX = mouseX, lastCutY = mouseY
 On mousemove while cutting:
   current mouse pos
   for each constraint not broken:
     check if segment intersects. Could approximate by checking distance from constraint midpoint to line segment < threshold.
     Simpler: for each constraint, if distance from particle1 to line segment < 15 or particle2 <15, break. Might be sufficient.

Better implement segment intersection test quickly.

Segment intersection for two segments p1-p2 and q1-q2.

We can precompute for each constraint its endpoints. For each mousemove, we iterate over constraints (maybe 7k) and test intersection with mouse segment. That's okay if cutting only occasional.

Optimization: only test constraints near mouse. Could use bounding box.

Simplify: on mousemove while cutting, find particles within 30px of cursor, break all constraints attached to those particles. That's simpler and effective.

Let's do: for each particle, if distance to cursor < 25, break constraints connected to it. This simulates cut path.

Also need to prevent context menu: canvas.addEventListener('contextmenu', e=>e.preventDefault())

Space toggles pause: window.addEventListener('keydown', e=> if e.code==='Space' && !e.target.matches('input,textarea,select') then toggle pause)

Controls panel:
 #wind checkbox
 #gravity range min 0 max 2000 step 10 value 800
 #iterations range min 1 max 20 step1 value 5
 #reset button

Stats: FPS, particles, constraints. Display in UI.

window.__arena.stats() returns object. Need to compute intact constraints count: constraints.filter(c=>!c.broken).length. Pinned count: particles.filter(p=>p.pinned).length. Centroid: average x,y of all particles.

Also need to ensure canvas covers full viewport. Use CSS.

HiDPI: need to scale drawing context.

When resizing, we need to keep simulation coordinates consistent. If we resize canvas, CSS size changes, but simulation coordinates remain in CSS pixels. That's fine.

Potential issues: simulation speed depends on dt. With accumulator, fixed timestep.

Damping to reach rest within 3 seconds. Need to tune damping. Verlet damping factor ~0.99 per step. With dt 1/60, decay per second ~0.99^60 ≈0.55. So after 3 seconds ~0.17 of initial velocity. Might be okay. Could increase damping to 0.98.

Also need gravity slider to affect simulation. Initially gravity maybe 500 px/s2.

Wind off initially.

Initial cloth at rest within 3s: need to start with particles at rest positions, no initial velocity. Since Verlet integration uses old position = position, velocity zero. So cloth starts at rest but gravity will cause it to fall. Wait requirement: with wind off and no interaction, cloth must come to complete rest within 3 seconds of loading. That implies initially cloth is hanging at rest under gravity, not falling from initial position. So we need initial positions to be equilibrium under gravity? Or we can start with cloth at rest position, pinned top, with particles initially at rest positions where they are already under gravity? If we start with particles at those positions and zero velocity, gravity will pull them down. So they will move.

Alternative: we can start simulation with cloth already at equilibrium: we can run solver for a few iterations at start to relax cloth under gravity to rest. That would cause initial movement to settle. Requirement says cloth must come to complete rest within 3 seconds of loading. So it can start moving but settle within 3s. That's acceptable? It says initially cloth is visible, horizontally centered, at rest within 3 s. Could mean after 3 seconds it is at rest. So starting from initial position, it should settle within 3s. That's okay.

But if we start with particles at rest positions with zero velocity, gravity will cause them to fall, they will settle. Might take longer than 3s? Could be okay with proper parameters.

Alternative: pre-simulate for a few steps before rendering to relax. Could run solver for maybe 100 iterations with gravity to find equilibrium, then start simulation with zero velocity. That would make it start at rest. Simpler: initialize particles with positions such that they are already hanging straight down: x positions constant per column, y increasing. That's equilibrium under gravity ignoring constraints? Actually with constraints, the cloth will hang straight down. Starting at that position with zero velocity should be at rest (except small oscillations due to numerical error). However constraints may cause slight stretch.

Let's initialize particles in a grid where columns are vertical lines: x = centerX + c*spacing, y = topY + r*spacing. That's a rectangular grid. Under gravity, the cloth will sag. So not at rest.

Maybe we can start with cloth already relaxed. Could run a relaxation phase at load: for e.g., 200 solver iterations with gravity, no integration? Could just run simulation for a few seconds with damping high to settle, then reset velocities.

Simpler: set initial positions to a sagging shape: maybe we can simulate quickly offline: for each row, y offset = r*spacing + sag? Hmm.

Alternative interpretation: "come to a complete rest within 3 seconds of loading" means the initial jitter from loading should settle. If we start with zero velocity, the cloth will start falling and settle in maybe 1-2 seconds. Could be okay.

Let's test mental: gravity 800 px/s2, dt 1/60 => velocity increment per step ~13.3 px/s? Actually acceleration * dt = 13.3 px/s. Velocity accumulates. Might take a while.

Maybe we should set gravity slider default to moderate, and damping high.

We can also pre-relax cloth by running solver iterations with particles pinned at top, and allowing particles to fall under gravity for a few steps before first render, with old positions set to current positions after relaxation, so velocity zero.

Implementation: after creating particles and constraints, run a relaxation loop: for i in 0..200: apply gravity to particles (simulate one step with no velocity?) Simpler: just run simulate step with dt fixed, but with high damping? Might be okay.

Alternative: we can initialize particles with y positions already offset downward to approximate equilibrium: each row y = topY + r*spacing * sag factor? Hard.

Maybe easier: at load, run a short simulation loop synchronously for ~1 second (60 steps) before starting animation loop, with wind off, no interaction, then set old positions equal to new positions to zero velocity. That would place cloth in equilibrium.

Let's do that: after creating cloth, for step=0..120 (2 seconds) do:
   apply gravity and constraints solver iterations (maybe more iterations for faster convergence).
   Actually we need integration: we can just apply Verlet step with dt.

Simpler: run the same simulate function 180 times before starting animation. That will settle cloth.

Also need to ensure cloth initially entirely inside viewport. With width ~784, height ~544, centered. TopY maybe 100px from top. So bottom ~644. Viewport 800 height, okay.

Now rendering shading.

Implementation details for drawing triangles:

We need to draw with canvas 2D. For each quad, check edges:

edge indices:
e1: (r,c)-(r,c+1) horizontal top
e2: (r+1,c)-(r+1,c+1) horizontal bottom
e3: (r,c)-(r+1,c) vertical left
e4: (r,c+1)-(r+1,c+1) vertical right
e5: (r,c)-(r+1,c+1) diag down-right
e6: (r+1,c)-(r,c+1) diag down-left

For triangle p00,p10,p11, edges are e1? Actually p00-p10 is top horizontal, p10-p11 is right vertical, p00-p11 is diag. So need those three constraints intact.

Similarly second triangle p00,p11,p01 edges: p00-p11 diag, p11-p01 bottom horizontal, p00-p01 left vertical.

We need quick lookup. Let's create Map edgeKey -> constraint object.

When creating constraints, we store in array and also add to map with key `${min},${max}`.

Then for each triangle, we can check if map has key and constraint not broken.

Implementation steps.

Also need to handle tearing when stretched: in solver loop, after correction, compute dist, if dist > rest * tearThreshold, break constraint.

TearThreshold maybe 1.5-2.0. Let's pick 1.8.

Now cutting: while cutting, we need to break constraints intersecting mouse path. Approach: for each constraint, check distance from line segment to mouse point? Simpler: if distance from either endpoint to cursor < 20px, break. That's easy.

But spec says cuts every constraint cursor path crosses. Could be approximated.

Let's implement segment intersection test:

Given p1,p2 constraint, and mouse segment q1,q2.

Compute orientation.

Function segmentsIntersect(a,b,c,d):
  o1 = orient(a,b,c)
  o2 = orient(a,b,d)
  o3 = orient(c,d,a)
  o4 = orient(c,d,b)
  if o1*o2 <0 and o3*o4 <0 return true
  ... collinear cases.

We can implement quickly.

During mousemove while cutting, we have lastMousePos and currentMousePos. For each constraint not broken, test intersection. If intersect, break.

That's O(N) per mousemove. If mousemove fires ~60 times per second, 7k *60 = 420k checks per second, okay in JS maybe borderline but acceptable.

We can also limit to constraints within bounding box of mouse segment expanded by some margin.

Simplify: first filter constraints where bounding box overlaps mouse segment bounding box. Compute min/max x/y.

Probably okay.

Implementation details for interaction:

State variables:
grabbedParticle = null
grabOffsetX, grabOffsetY? Not needed if we set particle position directly.

On mousedown:
 if e.button ===0 (left):
   if e.shiftKey => treat as cut? Spec says right-drag (and Shift+left-drag) cuts. So if e.shiftKey, start cutting.
   else find nearest particle within 40px.
   if found: grabbedParticle = particle; particle.grabbed = true; particle.wasPinned? Actually grab overrides.
 else if e.button ===2 (right):
   start cutting.

On mousemove:
 if grabbedParticle:
   grabbedParticle.x = mouseX
   grabbedParticle.y = mouseY
   // keep old positions updated to avoid velocity?
   grabbedParticle.ox = grabbedParticle.x
   grabbedParticle.oy = grabbedParticle.y
 else if cutting:
   // process cut between lastMouse and currentMouse
   performCut(lastMouse, currentMouse)
   lastMouse = currentMouse

On mouseup:
 if grabbedParticle: grabbedParticle.grabbed = false; grabbedParticle = null
 if cutting: cutting = false

Also need to handle pointer capture? Could just use mouse events on canvas.

Prevent context menu.

Space pause: toggle paused boolean.

Gravity slider: value from input range. Map to pixels/s2.

Solver iterations slider: value.

Wind toggle: checkbox.

Reset button: rebuild cloth.

Stats: FPS compute via time delta.

window.__arena.stats() returns object. We'll assign window.__arena = { stats: () => {...}}.

Need to ensure stats returns centroid in viewport CSS-pixel coordinates. That's just average of particle x,y.

Now polish: background gradient, UI styling.

Edge cases: particles pinned should not move. During constraint solving, we skip moving pinned particles.

Grabbed particles: treat as pinned for constraint solving? If we set particle position directly each frame, constraints will try to pull it. That's okay.

Damping: we need to apply damping to velocity: vx *= damping. In Verlet, we already multiply (x - oldX) * damping. Good.

Implementation details:

class Particle:
  x,y,ox,oy,pinned,grabbed

Constraints:
  i,j,rest,broken

Map edgeKey -> constraint index.

Simulation step:

function step(dt):
  if paused return
  // apply forces
  for p of particles:
    if p.pinned or p.grabbed continue
    // velocity
    vx = p.x - p.ox
    vy = p.y - p.oy
    vx *= damping
    vy *= damping
    p.ox = p.x
    p.oy = p.y
    // acceleration
    ax = 0
    ay = gravity
    if windEnabled:
      // wind force
      // compute wind based on time and position
      // wind is acceleration? We'll treat as acceleration.
      // Use noise
      let wx = Math.sin(time*0.001 + p.x*0.005) * windStrength * gust
      let wy = Math.cos(time*0.0007 + p.y*0.005) * windStrength * 0.3 * gust
      ax += wx
      ay += wy
    p.x += vx + ax*dt*dt
    p.y += vy + ay*dt*dt

  // constraints solver
  for iter...
    for c of constraints:
      if c.broken continue
      p1 = particles[c.i]
      p2 = particles[c.j]
      dx = p2.x - p1.x
      dy = p2.y - p1.y
      dist = Math.hypot(dx,dy)
      if dist < 0.0001 continue
      diff = (dist - c.rest)/dist
      // correction
      offsetX = dx * diff * 0.5
      offsetY = dy * diff * 0.5
      if !p1.pinned && !p1.grabbed:
        p1.x += offsetX
        p1.y += offsetY
      if !p2.pinned && !p2.grabbed:
        p2.x -= offsetX
        p2.y -= offsetY
      // tear check
      if dist > c.rest * tearThreshold:
        c.broken = true

Potential issue: when constraint broken, we still have particles moving, triangles will disappear.

Now rendering:

ctx.clearRect(0,0,canvas.width,canvas.height) but with dpr scaling.

We set ctx.setTransform(dpr,0,0,dpr,0,0) each resize.

Better to clear with canvas width/height.

Draw background: gradient from dark to light.

Then draw cloth.

For each quad:
  p00,p10,p01,p11
  // check edges
  // we can precompute constraint lookups for speed.

Let's create helper function edgeIntact(i,j):
  key = i<j? `${i},${j}` : `${j},${i}`
  c = edgeMap.get(key)
  return c && !c.broken

Then for triangle 1:
 if edgeIntact(idx00,idx10) && edgeIntact(idx10,idx11) && edgeIntact(idx00,idx11):
   draw triangle

Similarly triangle 2.

Drawing triangle:
 ctx.beginPath()
 ctx.moveTo(p00.x, p00.y)
 ctx.lineTo(p10.x, p10.y)
 ctx.lineTo(p11.x, p11.y)
 ctx.closePath()
 ctx.fillStyle = color
 ctx.fill()

We need color. Compute stretch factor:
 avgStretch = (len1/rest1 + len2/rest2 + len3/rest3)/3
 brightness = clamp(1 - (avgStretch-1)*2, 0.4,1)
 base hue maybe 30-40 for silk.

We can compute hue = 35, saturation 70, lightness = 60*brightness.

Use hsl.

Also add checker pattern: if (r+c)%2===0, slightly different.

For torn edges, we skip drawing triangle, so edge appears missing.

Performance: drawing 3332 triangles per frame with canvas 2D is okay.

Now UI:

<div id="ui">
  <label><input type="checkbox" id="wind"> Wind</label>
  <label>Gravity <input type="range" id="gravity" min="0" max="2000" value="800"></label>
  <label>Iterations <input type="range" id="iterations" min="1" max="20" value="5"></label>
  <button id="reset">Reset</button>
  <div id="stats">FPS: --</div>
</div>

Style with CSS.

Now implement.

Potential issues:

- When grabbing particle, we set particle.ox = particle.x each frame, so velocity zero. Good.

- When particle is pinned, we should not update ox/oy? Could keep.

- Need to handle window resize: cloth should stay centered? If window resizes, topY and centerX remain same? Cloth coordinates are absolute. If window grows, cloth stays at same position, may be off-center. Could recenter on resize? Might be okay. Requirement says handles resize without distorting. Could recenter cloth on resize? If we keep particles at same coordinates, they remain in same place, which is fine. But initial centering might be off after resize. Might be acceptable.

Better to on resize, keep cloth in place, but maybe recenter? Let's keep as is.

- Ensure initial cloth is entirely inside viewport. Choose topY = 80, centerX = window.innerWidth/2.

- When resetting, rebuild cloth with same parameters.

- Need to ensure stats particles count constant (unless tear doesn't remove particles). Constraints count decreases when broken. Pinned count constant.

- window.__arena.stats() must return centroid. Compute average.

Implementation steps in code.

Edge cases:

- Right click context menu suppressed.

- Shift+left drag cuts.

- Space toggles pause unless focus in text input. So check document.activeElement tagName.

- While paused, nothing moves. Rendering still happens? Canvas identical frame to frame. Our animation loop still renders same positions. That's fine. Stats FPS may still update, DOM text may update. Requirement says canvas identical frame to frame (DOM text such as FPS readout may still update). So fine.

- No console errors.

Potential performance issues: edgeMap lookup for each triangle each frame (10k lookups). Acceptable.

Alternative: precompute for each triangle the three constraint indices to avoid map lookup. Could compute on creation.

Let's precompute triangles data structure: array of triangles each with i1,i2,i3, rest lengths? Could compute on fly.

Simplify: during rendering, for each quad we compute indices and check edgeIntact via map.

Now implement code.

Need to ensure no external resources. Use inline CSS.

Let's craft final HTML.

Implementation details code:

(() => {
  const canvas = ...
  ...
})();

Potential pitfalls:

- DevicePixelRatio scaling: When we set canvas.width = w*dpr, canvas.height = h*dpr, and ctx.setTransform(dpr,0,0,dpr,0,0). Then drawing coordinates are in CSS pixels. Good.

- Resize: need to update canvas size and also maybe recenter cloth? If we don't recenter, cloth may be off. Could on resize keep cloth centered by adjusting particle positions? Might cause jump. Better to keep cloth in world coordinates independent of viewport. Initial centering based on initial window size. If window resizes, cloth stays at old center, may be off-center. Might be acceptable? Requirement says handles resize without distorting. Not necessarily recenter.

Maybe we can make simulation coordinates relative to canvas center? Could keep cloth centered by translating rendering? Simpler: on resize, we could keep particles positions relative to canvas size? Hmm.

Better approach: keep cloth positions in CSS pixels, and on resize, we don't move particles. Cloth remains where it was. That's fine.

Initial centering: centerX = window.innerWidth/2, topY = 80.

Now implement wind: gusty turbulent. Use time.

Let windStrength = 80 (pixels/s2?). Actually wind as acceleration. Could be small.

Let's define windEnabled boolean.

In step, compute gust = 0.5 + 0.5*Math.sin(time*0.0003). Actually time in ms.

Compute windX = Math.sin(time*0.001 + p.x*0.003)*windStrength * gust
windY = Math.cos(time*0.0008 + p.y*0.003)*windStrength*0.2 * gust

Add to ay? Might be too strong.

Alternative treat wind as force added to velocity directly? Might be okay.

Let's tune parameters via experimentation mental.

Better to use smaller values: windStrength = 30.

Gravity slider range 0-2000, default 800. dt^2 = (1/60)^2 ≈0.000277. So gravity acceleration 800 => displacement per step due to gravity = 800 *0.000277 ≈0.222 px. That's small. Might need larger. Actually Verlet integration: position += velocity + a*dt^2. Velocity builds up over time. So okay.

If gravity 800, after 1 sec velocity ~800 px/s. So cloth falls.

Okay.

Damping: 0.99.

Solver iterations: default 5.

Tear threshold: 1.7

Now implement cutting intersection:

function segmentsIntersect(p1,p2,q1,q2):
  function orient(a,b,c){ return (b.x - a.x)*(c.y - a.y) - (b.y - a.y)*(c.x - a.x) }
  o1 = orient(p1,p2,q1)
  o2 = orient(p1,p2,q2)
  o3 = orient(q1,q2,p1)
  o4 = orient(q1,q2,p2)
  if o1*o2 <0 && o3*o4 <0 return true
  // collinear cases
  // For simplicity ignore collinear
  return false

During cut, we have lastMouse and currentMouse. For each constraint not broken:
  p1 = particles[c.i]
  p2 = particles[c.j]
  if segmentsIntersect(p1,p2,lastMouse,currentMouse) => break

That's fine.

Alternative: also break constraints where distance from constraint line to mouse point < threshold. Could combine.

Now implement mouse handling.

We need to track mouse position in CSS pixels. Use e.clientX, e.clientY.

Canvas covers full viewport, so clientX works.

On mousedown:
  const rect = canvas.getBoundingClientRect()
  mouseX = e.clientX
  mouseY = e.clientY
  if e.button ===0:
    if e.shiftKey:
      startCut()
    else:
      find nearest particle within 40px
  else if e.button ===2:
    startCut()

On mousemove:
  update mouseX/Y
  if grabbedParticle: set position
  if cutting: perform cut from lastMouse to currentMouse

On mouseup:
  release

Also need to handle pointer leave.

Now implement reset:

function buildCloth():
  particles = []
  constraints = []
  edgeMap = new Map()
  // create particles
  for r...
    for c...
      x = centerX + (c - cols/2)*spacing
      y = topY + r*spacing
      particles.push({x,y,ox:x,oy:y,pinned: r===0, grabbed:false})
  // constraints
  for each...
    create constraint
    edgeMap.set(key, constraint)

Also need to reset wind, etc? Reset button rebuilds cloth in initial state. Should keep current UI settings? Probably rebuild particles to initial positions, reset broken flags.

Set particles positions to initial, ox= x, oy=y, pinned etc. Clear broken flags.

Also need to reset grabbedParticle.

Now stats update each frame: FPS compute.

Implement FPS: lastTime, frames.

window.__arena.stats() implementation.

Potential issue: window.__arena must be defined before grader runs. Define early.

Now ensure no errors: use const, let.

Potential issue: when grabbing particle, we need to ensure constraints solver doesn't immediately pull it back. Since we set particle position each frame, solver will try to correct neighbors, okay.

When grabbing, we should also temporarily unpin? Particle is not pinned, fine.

Now implement code.

Edge cases: particles array index calculation: idx = r*cols + c.

Now rendering shading: compute color per triangle.

Let's compute average stretch:

function triangleStretch(pA,pB,pC, iA,iB,iC):
  // find constraints for edges? Could compute lengths directly.
  lenAB = hypot(pB.x-pA.x, pB.y-pA.y)
  restAB = spacing? Not exactly for diagonals. Need rest length per edge. We could precompute rest lengths for each triangle edges from constraints. Simpler: compute stretch using particle distances vs expected rest distances based on spacing: for structural edges rest = spacing, for diagonal rest = spacing*sqrt2. Could compute rest on fly based on indices difference.

Simpler: compute stretch as average of edge lengths / spacingApprox? Might be inaccurate.

Alternative: just compute brightness based on triangle area change relative to rest area. Rest area for quad is spacing*spacing/2. Current area = |(pB-pA) x (pC-pA)|/2. Ratio = current/rest. Could compute.

Let's compute for each triangle: compute area via cross product. Rest area can be precomputed per triangle (constant). Then brightness = clamp(1 / ratio? hmm). Stretch increases area. Might be okay.

Simplify: brightness = 0.7 + 0.3 * Math.sin(time + ...). Not good.

Let's do stretch based on average edge length ratio to rest length. We need rest length per edge. We can compute rest length from constraint if exists. Since we have edgeMap, we can lookup constraint for each edge, get its rest length. That's extra lookup.

Simpler: approximate rest length as spacing for orthogonal, spacing*sqrt2 for diagonal. Compute based on index differences.

For edge between (r,c) and (r2,c2):
  dr = abs(r2 - r)
  dc = abs(c2 - c)
  if dr===1 && dc===0 => rest = spacing
  if dr===0 && dc===1 => rest = spacing
  if dr===1 && dc===1 => rest = spacing*Math.SQRT2
  else rest = ... maybe bending.

So we can compute rest on fly.

Compute len = hypot(dx,dy)
stretch = len / rest
average stretch.

Brightness = 1 - (stretch -1)*0.5
Clamp 0.4-1.2

Then set fillStyle = `hsl(35, 80%, ${50*brightness}%)`

Add checker: if (r+c)%2===0, hue 35 else 30.

Now draw.

Also draw background: ctx.fillStyle = '#111' etc.

Now implement.

Potential performance: iterating over all quads each frame with many lookups okay.

Now ensure canvas covers full viewport: CSS: canvas { position:fixed; top:0; left:0; width:100%; height:100%; display:block; }

UI overlay: position:fixed; top:10px; left:10px; background:rgba(0,0,0,0.6); color:white; padding:10px; border-radius:8px; font-family:sans-serif; font-size:13px; z-index:10

Inputs style.

Now implement code.

Potential bugs:

- When we set ctx.setTransform(dpr,0,0,dpr,0,0) each resize, we also need to clear transform before resize? setTransform resets.

- When resizing, canvas width/height change, context is reset? No.

- Mouse coordinates: after scaling, clientX is CSS pixels, matches drawing coordinates.

- Grabbed particle: we set particle.x = mouseX, particle.y = mouseY. But particle.ox remains old. Next frame, velocity = (x - ox)*damping. Since we set ox = x after moving? We set particle.ox = particle.x after setting position, so velocity zero. Good.

Implementation of step: for each particle not pinned/grabbed, we compute vx = p.x - p.ox, etc. We need to update p.ox before updating p.x? Standard Verlet: newPos = pos + (pos - oldPos) + a*dt^2. So we need oldPos from previous step. We stored ox,oy as old. So algorithm:
  vx = p.x - p.ox
  vy = p.y - p.oy
  vx *= damping
  vy *= damping
  p.ox = p.x
  p.oy = p.y
  p.x += vx + ax*dt*dt
  p.y += vy + ay*dt*dt

Yes.

Now constraints solver: need to use positions after integration. That's fine.

Potential instability: correction factor 0.5 may be too small. Could use 1.0 for stiffer. Use 0.5 for stability.

Now tearing threshold: if dist > rest * 1.8, break.

Now cutting: break constraints.

Now pause: if paused, skip simulation step but still render.

Now space toggle: keydown event.

Now ensure right-click context menu suppressed: canvas.addEventListener('contextmenu', e => e.preventDefault())

Now implement window.__arena.

window.__arena = {
  stats: () => {
    let sumX=0,sumY=0
    for(p of particles) {sumX+=p.x; sumY+=p.y}
    return {
      particles: particles.length,
      constraints: constraints.filter(c=>!c.broken).length,
      pinned: particles.filter(p=>p.pinned).length,
      centroid:{x: sumX/particles.length, y: sumY/particles.length}
    }
  }
}

Need particles and constraints accessible in closure. Could make them global variables.

Now final step: produce HTML file.

Potential issues: using `performance.now()` for time. For wind, use time.

Now code structure.

Let's write final code.

Potential improvements: Use requestAnimationFrame.

Implement animation loop:

let last = performance.now()
let accumulator =0
function loop(now){
  const frameTime = Math.min(0.25, (now - last)/1000)
  last = now
  accumulator += frameTime
  while(accumulator >= fixedDt){
    step(fixedDt)
    accumulator -= fixedDt
  }
  render()
  requestAnimationFrame(loop)
}

Now stats FPS: compute fps = 1/frameTime average.

Simpler: keep lastFrameTime.

Now implement UI event listeners.

Document.getElementById('wind').addEventListener('change', e => windEnabled = e.target.checked)

Gravity slider: input event -> gravity = parseFloat(e.target.value)

Iterations slider -> solverIterations = parseInt(e.target.value)

Reset button -> buildCloth()

Now initial build: call buildCloth()

Now pre-relax: maybe run 120 steps of simulation before first render to settle.

We can call for(let i=0;i<120;i++) step(fixedDt) after buildCloth.

But step uses paused flag. Ensure paused false.

Now ensure cloth initially at rest within 3 seconds. With pre-relax, it will be at rest.

Potential issue: pre-relax with gravity will cause cloth to sag to equilibrium, then old positions set to current? After each step, old positions updated. After 120 steps, velocity may still be non-zero. Could run extra steps with damping high to settle.

Alternative: after pre-relax, set for each particle p.ox = p.x, p.oy = p.y to zero velocity.

Let's do that after pre-relax.

Now implement.

Edge cases for grabbing nearest particle within 40px: compute distance squared.

Now cutting: when cutting, we need lastMouse position. On mousedown start cut, set lastMouse = current mouse.

On mousemove while cutting, perform cut between lastMouse and currentMouse, then update lastMouse.

Implementation of cut function:

function cutSegment(a,b){
  for(const c of constraints){
    if(c.broken) continue
    const p1 = particles[c.i]
    const p2 = particles[c.j]
    if(segmentsIntersect(p1,p2,a,b)){
      c.broken = true
    }
  }
}

SegmentsIntersect implementation.

Let's implement orient with cross product.

function orient(a,b,c){ return (b.x - a.x)*(c.y - a.y) - (b.y - a.y)*(c.x - a.x) }

function onSegment(a,b,c){ // b between a,c
  return Math.min(a.x,c.x)<=b.x && b.x<=Math.max(a.x,c.x) && Math.min(a.y,c.y)<=b.y && b.y<=Math.max(a.y,c.y)
}

function segmentsIntersect(p1,p2,q1,q2){
  const o1 = orient(p1,p2,q1)
  const o2 = orient(p1,p2,q2)
  const o3 = orient(q1,q2,p1)
  const o4 = orient(q1,q2,p2)
  if (o1===0 && onSegment(p1,q1,p2)) return true
  if (o2===0 && onSegment(p1,q2,p2)) return true
  if (o3===0 && onSegment(q1,p1,q2)) return true
  if (o4===0 && onSegment(q1,p2,q2)) return true
  return (o1>0) !== (o2>0) && (o3>0) !== (o4>0)
}

Now implement.

Potential bug: cutting will also break constraints that are far but intersect due to long mouse segment. Might be okay.

Now rendering torn edges: we skip triangles with broken edge.

But what about constraints that are broken but triangle still drawn using other edges? That's correct.

Now final polish: background gradient.

Add CSS for UI.

Now ensure no console errors: need to declare variables properly.

Potential error: edgeMap.get returns undefined. In edgeIntact check, we need to handle.

Implement edgeIntact(i,j):
  const key = i<j? `${i},${j}` : `${j},${i}`
  const c = edgeMap.get(key)
  return c && !c.broken

Now rendering loop: for r from 0 to rows-2, c from 0 to cols-2.

Indices:
i00 = r*cols + c
i10 = r*cols + c+1
i01 = (r+1)*cols + c
i11 = (r+1)*cols + c+1

Check triangle1 edges:
e1 = edgeIntact(i00,i10)
e2 = edgeIntact(i10,i11)
e3 = edgeIntact(i00,i11)
if e1 && e2 && e3 -> draw triangle

Triangle2 edges:
e4 = edgeIntact(i00,i11)
e5 = edgeIntact(i11,i01)
e6 = edgeIntact(i00,i01)
if e4 && e5 && e6 -> draw

Compute color.

Compute stretch for triangle: compute average edge stretch.

For each edge, compute rest length based on dr,dc.

We can compute rest length for each edge quickly.

Function restLength(i,j):
  const r1 = Math.floor(i/cols), c1 = i%cols
  const r2 = Math.floor(j/cols), c2 = j%cols
  const dr = Math.abs(r2 - r1)
  const dc = Math.abs(c2 - c1)
  if dr===1 && dc===0 return spacing
  if dr===0 && dc===1 return spacing
  if dr===1 && dc===1 return spacing*Math.SQRT2
  return Math.hypot(...)? Might be bending.

Assume only those.

Now compute len = hypot(dx,dy)
stretch = len/rest

Average.

Brightness.

Now draw.

Potential performance: computing rest length many times. Acceptable.

Now implement.

Potential issue: when we reset cloth, we need to rebuild edgeMap.

Now implement full code.

Let's produce final HTML.

We'll need to ensure script runs after DOM loaded. Place script at end of body.

Now final output.

Test mental:

- Canvas covers full viewport.
- UI elements have ids #wind, #gravity, #reset. Need #reset button. Good.
- #wind is checkbox. Good.
- #gravity is range. Good.
- Solver iterations slider id? Not required by grader but requirement says controls panel includes solver-iterations slider. Might need id? Not specified. Could be #iterations. Might be okay.

- Space toggles pause.

- Right-drag cuts.

- Left-drag grabs.

- Wind toggle off initially.

- Initial cloth visible, centered.

Potential issues:

- When grabbing particle, we set particle.grabbed = true. During constraint solver, we skip moving pinned/grabbed particles. That means grabbed particle stays at mouse, neighbors move towards it.

- When releasing, particle.grabbed false.

- Need to ensure particle.ox updated when grabbed to avoid sudden velocity jump on release. We set ox = x each frame while grabbed. Good.

- When cutting, we need to ensure mouse events work with right button. e.button ===2.

- Shift+left drag: on mousedown, if e.shiftKey true, start cutting.

- Prevent context menu.

- Ensure no errors.

Potential bug: edgeMap is Map, but constraints array also contains broken flag. When we break constraint via cutting, we set c.broken = true. EdgeMap still points to same object, good.

Now implement stats update: in render, update stats div text.

Now final code.

Edge cases: window.__arena.stats() returns centroid in viewport CSS-pixel coordinates. Our particles coordinates are CSS pixels. Good.

Now produce final answer with HTML code block.

Make sure to include <!DOCTYPE html>.

No external resources.

Let's craft final output.