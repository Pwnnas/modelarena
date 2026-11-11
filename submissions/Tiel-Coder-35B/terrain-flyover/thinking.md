This is a complex task. Let me build a complete WebGL procedural terrain flyover in a single index.html file.

Let me think about the architecture:

1. **WebGL setup**: raw WebGL context, shaders, buffers
2. **Matrix math**: my own mat4, vec3 utilities
3. **Terrain**: seeded deterministic noise (value/Perlin noise with hashing), fBm, chunked generation
4. **Chunk streaming**: generate chunks around camera, LOD
5. **Materials**: height/slope coloring
6. **Water**: sea plane at y=0 with animation, fresnel
7. **Sky/atmosphere**: sky gradient shader, sun, fog
8. **Day/night cycle**: time of day affects sun position, colors
9. **Camera**: autopilot + manual controls
10. **UI**: slider, seed input, autopilot indicator, FPS
11. **Window.__arena**: freeze, setSeed, setTime, setCamera, getCamera, terrainHeight, stats

Let me write this carefully. This is a big file. Let me think through each part.

### Noise function

I need a deterministic hash-based noise. Let me use a standard approach:

```js
function hash2(x, y) {
  // deterministic hash
  var h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13));
  h = (h * 1274126177);
  h = (h ^ (h >> 16));
  return (h >>> 0) / 4294967296;
}
```

Then smooth noise interpolation. Let me use gradient noise (Perlin) or value noise. Value noise is simpler but I can do a decent Perlin.

Actually let me use a hash-based gradient noise for better quality.

Let me write a solid implementation:

```js
function grad(hash, x, y) {
  // use hash to pick gradient direction
  var h = hash & 7;
  var u = h < 4 ? x : y;
  var v = h < 4 ? y : x;
  return ((h & 1) ? -u : u) + ((h & 2) ? -2*v : 2*v); // rough
}
```

Hmm, let me just do a clean Perlin-like 2D noise.

Actually, let me use a simpler and robust approach with value noise + interpolation, which is deterministic and fast. But ridged noise and domain warping need good base noise.

Let me implement Perlin gradient noise properly:

```js
function noise2D(x, y) {
  var xi = Math.floor(x) & 255;
  var yi = Math.floor(y) & 255;
  var xf = x - Math.floor(x);
  var yf = y - Math.floor(y);
  var u = fade(xf);
  var v = fade(yf);
  var aa = hash(xi, yi);
  var ab = hash(xi, yi+1);
  var ba = hash(xi+1, yi);
  var bb = hash(xi+1, yi+1);
  var x1 = lerp(grad2(aa, xf, yf), grad2(ba, xf-1, yf), u);
  var x2 = lerp(grad2(ab, xf, yf-1), grad2(bb, xf-1, yf-1), u);
  return lerp(x1, x2, v); // return in [-1,1] roughly
}
```

where hash uses a permutation-like structure. For determinism with arbitrary large x,y I can't use a fixed permutation table of size 256 indexed by xi&255 reliably because large coords... Actually xi&255 works fine as long as the hash function is consistent. Let me use a hash function instead of permutation table.

Let me define:
```js
function fade(t) { return t*t*t*(t*(t*6-15)+10); }
function lerp(a,b,t) { return a+t*(b-a); }
function hash(x, y) {
  var h = x*374761393 + y*668265263;
  h = (h ^ (h >> 13));
  h = Math.imul(h, 1274126177);
  h = (h ^ (h >> 16));
  return (h >>> 0) / 4294967296; // [0,1]
}
function grad2(h, x, y) {
  switch (h & 3) {
    case 0: return  x + y;
    case 1: return -x + y;
    case 2: return  x - y;
    default: return -x - y;
  }
}
```

This gives noise roughly in [-1, 1]. Good enough.

fBm:
```js
function fbm(x, y, octaves, lacunarity, gain) {
  var sum = 0, amp = 1, freq = 1, max = 0;
  for (var i = 0; i < octaves; i++) {
    sum += amp * noise2D(x*freq, y*freq);
    max += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / max;
}
```

Terrain height:
```js
function terrainHeightAt(x, z) {
  var scale = 0.0015; // world units
  var nx = x * scale;
  var nz = z * scale;
  // domain warp
  var qx = fbm(nx + 0.0, nz + 0.0, 4, 2.0, 0.5);
  var qy = fbm(nx + 5.2, nz + 1.3, 4, 2.0, 0.5);
  var warpedX = nx + qx * 1.5;
  var warpedZ = nz + qy * 1.5;
  var h = fbm(warpedX, warpedZ, 6, 2.0, 0.5);
  // ridged
  var ridged = 1.0 - Math.abs(fbm(warpedX*1.3 + 3.0, warpedZ*1.3 - 2.0, 4, 2.0, 0.5));
  h = h*0.7 + ridged*0.3;
  // scale to range
  var height = h * 300; // up to ~300
  // falloff near ... 
  return height;
}
```

Wait, the task says heights span -50 (sea floor) to +400. Water at sea level y=0. So terrain can go below water (sea floor) and above. The camera can't go below terrain or below water. So terrain above water = land, below = sea floor.

Let me make heights from maybe -40 to +380. Coastlines where terrain crosses 0.

I need to make sure there are coastlines — mix of land and sea. With centered noise it'll have both.

Let me scale so that fbm output [-1,1] maps to roughly [-40, 400]. Actually I want more land variance. Let me do:
```
var h = fbm(...) in [-1,1]
height = h * 250 + ridged component
```

Hmm. Let me think — I want peaks up to ~400 and sea floor to -50. Let me do:
```
var n = fbm(...) // [-1,1]
var r = 1 - Math.abs(fbm2...) // [0,1] ridged
var height = (n * 0.6 + r * 1.4 - 0.2) * 200;
```
This could give range... n*0.6 in [-0.6,0.6], r*1.4 in [0,1.4], so total [-0.8, 2.0] * 200 = [-160, 400]. Maybe too deep. Let me tune to roughly [-40, 400]. I'll adjust: `(n*0.5 + r*1.1 - 0.15)*180` → [-0.6+0-0.15, 0.6+1.1-0.15]*180 = [-0.75, 1.55]*180 = [-135, 279]. Hmm.

Honestly exact range matters less than "roughly span -50 to +400" and having coastlines. Let me aim for land above 0 mostly with mountains. Let me do a bias so there's meaningful land. Actually the requirement says span -50 to +400 roughly. Let me target mean around 50 with peaks 400 and troughs -50.

Let me just use:
```
var h = fbm(warpedX, warpedZ, 6,...)  // [-1,1]
// add ridges
var rid = 1 - Math.abs(fbm2(...));  // [0,1]
var base = h * 120 + rid * 250 - 20;
return base;
```
h*120 in [-120,120], rid*250 in [0,250], so [-140, 370] - 20 = [-160, 350]. That's a decent range with peaks. But I want sea floor around -50 not -160. Whatever, roughly fine. Actually let me keep it reasonable. I'll tune constants.

Actually let me reconsider. The camera "can never go below terrain height or below water." If terrain is mostly below water it's ocean (flat-ish, low waves). Land areas are where terrain > 0. For a nice flyover I want a mix.

Let me keep the height function and not over-engineer the exact numbers. I'll map to [-50, 400] approximately:
```
h in [-1,1]
base = h  // -1..1
// scale
height = (h + 0.15) * 210  // gives -189..240... no
```

I'll settle: 
```
var n = fbm(...);            // -1..1
var r = 1 - Math.abs(fbm2(...)); // 0..1
var height = n * 90 + r * 300 - 30;
// range: -90..90 + 0..300 - 30 = -120..360
```
Fine. Peaks ~360-380, low points -120 (below sea, sea floor). Coastlines present. Good enough. I'll clamp to keep it reasonable.

Actually, let me make it cleaner. I want mostly a nice coastline-heavy world. Let me use multiple octaves and keep it.

### Chunked terrain

Chunk size: e.g., CHUNK_WORLD = 200 units. View distance 1500m. Chunk grid around camera: radius = ceil(viewDist / chunkSize) + 1. With chunkSize 200 and viewDist 1500, that's 8 chunks radius = 17x17 = 289 chunks. That's a lot. Each chunk with LOD... Let me use larger chunks or fewer.

Actually let me reconsider. 1500m view distance, chunk 256m → radius ~7 → 15x15 = 225 chunks. Each chunk as a grid of say 32x32 = 1024 vertices, 2x triangles = 2046 tris → 225*2046 = 460k triangles just for terrain. Plus water. That might be too much for smooth 60fps but doable on modern laptop. Let me reduce.

Let me use chunk size 256 and grid resolution 48 or so. Or use LOD: fewer triangles far away.

Alternatively, use a single big grid but with distance-based LOD. Hmm.

Let me use chunk size 256, grid detail LOD based on distance. For a 1280x800 viewport, terrain spans a good angle. Let me cap triangles.

Actually, a common technique: render chunks as a mesh with adaptive tessellation. But simpler: fixed subdivision per chunk, maybe 64x64 for nearby, fewer for far. Let me do LOD by chunk distance:

- Distance 0-1 chunk: detail 64
- 1-2: detail 48
- 2-3: detail 32
- 3+: detail 24

Hmm, this is getting complex. Let me simplify: use a chunk grid, each chunk is subdivided into `SEG` segments (say 40). Total chunks = (2*radius+1)^2. Let me pick radius such that it's manageable.

Let me pick chunk size = 300, viewDist = 1500 → radius = 6 → 13x13 = 169 chunks. Seg = 40 → 41x41 = 1681 verts per chunk → 169 * 1681 = 284k verts, 338k triangles. Hmm still a lot but OK-ish.

Actually let me reduce seg to 32 and chunk to 320, radius 5 (viewDist 1600). 11x11 = 121 chunks * 33x33=1089 verts = 132k verts, 165k tris. That's more reasonable.

Let me be flexible: CHUNK = 400, SEG = 32, viewDistance = 1600 → radius = 4 → 9x9 = 81 chunks. 33x33 verts = 1089 * 81 = 88k verts, 110k tris. Nice and light. But chunk seams might be visible at 400m. With noise it's continuous (I sample noise by world coords, so no seams regardless of chunking!). 

That's the key insight: since I generate terrain by sampling a continuous noise function at each vertex, adjacent chunks connect seamlessly regardless of subdivision. So I can use smaller chunks for streaming.

Let me use CHUNK = 256, SEG = 32. Radius depends on view distance. Let me set viewDistance = 1500, so radius = ceil(1500/256) = 6 → 13x13 = 169 chunks. 33x33 verts each = 1089 * 169 = 184k verts, 229k tris. Acceptable.

For LOD, I could reduce SEG for far chunks. Let me add simple LOD: 
```
function segForDistance(distChunks) {
  if (distChunks < 1) return 40;
  if (distChunks < 2) return 32;
  if (distChunks < 3) return 24;
  if (distChunks < 4) return 20;
  return 16;
}
```

This keeps it fast.

### Camera

Position (x,y,z), yaw (heading), pitch (look up/down).

yaw = 0 looks toward -z. pitch = 0 level, positive pitch looks up.

Forward vector: with yaw around... Let me define. In a coordinate system where +x right, +y up, -z forward when yaw=0.

yaw rotates in XZ plane. Forward direction:
```
fx = -sin(yaw)   // at yaw=0: (0,0,-1)
... 
```
Hmm let me think. Standard: 
- yaw = 0 → forward = (0, 0, -1)
- yaw += π/2 → forward = (1, 0, 0)? or (-1,0,0)?

Let me define forward as:
```
dirX = sin(yaw) * cos(pitch)  // hmm
```

Let me be careful. Let yaw be heading angle measured from -z axis toward +x (clockwise when viewed from above). Then:
- forward = (sin(yaw), 0, -cos(yaw))
- at yaw=0: (0,0,-1) ✓
- at yaw=π/2: (1,0,0) ✓ (turned right)

pitch: positive pitch looks up. Pitch rotates the forward vector's vertical component.
- forward = (sin(yaw)*cos(pitch), sin(pitch), -cos(yaw)*cos(pitch))
- at pitch=0: (sin(yaw), 0, -cos(yaw)) ✓
- at pitch>0: y-component positive (looking up) ✓

Right vector = cross(forward, up) = cross(forward, (0,1,0)).
up-ish for camera = cross(right, forward).

For view matrix I'll build a look-at.

Camera position clamped: y must be >= terrainHeight(x,z) + margin AND >= water level (0) + margin. Actually "can never go below terrain height (+margin) or below the water surface." So y >= max(terrainHeight(x,z), 0) + small margin. Wait water is at 0, terrain below 0 is sea floor. If over water, camera should be above water (0). If over land, above terrain. So y >= max(terrainHeight, 0) + margin. Let me use margin ~ a few meters.

Autopilot: fly forward following terrain height, keeping a fixed altitude above terrain (e.g., terrainHeight + 60). Speed forward. When autopilot off and no input, camera still.

Movement:
- W/S: forward/back along forward.xz
- A/D: strafe left/right
- Q/E or Shift/Space: down/up
- Mouse drag: look (yaw/pitch)

Smooth acceleration: velocity with damping.

Let me implement velocity-based movement with smoothing:
```
inputForce accumulates from keys
velocity += inputForce * dt;
velocity *= damping;
pos += velocity * dt;
```

For look, mouse drag directly sets yaw/pitch with smoothing.

### Shaders

**Terrain vertex shader**: 
- Input: position (chunk-local or world). I'll pass world positions? Let me pass chunk vertices in a buffer as world-space positions computed on CPU. Simpler: compute terrain heights on CPU, build vertex buffer with world positions, and also compute normals on CPU (via finite differences of noise) so I can do lighting. Actually normals can be computed in shader from a noise function too, but duplicating noise in GLSL is annoying. Let me compute normals on CPU.

Actually computing normals on CPU via finite differences of the same height function is clean. I'll do that.

So CPU builds chunk mesh: array of vertices {x,y,z, nx,ny,nz, color?}. Colors computed on CPU from height & slope. Or pass height/slope to shader and color in fragment. Let me pass color (rgb) computed on CPU — simpler shading. Or compute lighting in shader with a light direction from sun. Let me do lighting in fragment shader for better quality (per-pixel). Pass normal + position + world coords to fragment.

Actually for terrain, a nice approach:
- Vertex shader passes world pos, normal, and a material ID / blend factor.
- Fragment shader computes lighting based on sun dir, fog based on distance to horizon and sky color.

Let me compute material color on CPU (height + slope based) and also do Lambert lighting in fragment. That gives lit, colored terrain.

Let me pass to fragment: world position, normal, color, and fog density based on distance.

**Water shader**: a plane at y=0 spanning view distance, animated. Actually better: a large plane covering the visible area with waves animated via noise/time in shader. Fresnel reflection using sky color. Let me do water as a separate large quad (or better, a plane geometry) rendered after terrain, transparent-ish.

Hmm, water with animated waves in shader needs the surface normal computation in shader. I can do sine-wave normals in GLSL. Fresnel blend between water color and sky color (sky color computed in shader from view dir).

Let me compute sky color in both terrain/water shaders (a shared sky function in GLSL) so fog and reflection match.

**Sky shader**: a fullscreen cube/quad that renders the sky gradient + sun + stars. I'll render a large inverted sphere or just a fullscreen quad with a fragment shader that computes color from view direction. Use it as the background, render first (or last with depth off). Let me render sky as the first thing with depth test but far, or use a fullscreen quad with depth = far always. Simplest: render skydome as part of the scene with a shader that ignores position and uses view direction. I'll render it as the terrain/water background — draw it first with depthMask off, or as an overlay.

Actually cleanest: draw sky as a full-screen quad in screen space where color depends only on the ray direction (view matrix rotation part). I can pass the view matrix and compute direction = normalize(mvRotation * screenCoord). Let me do sky as a separate pass: render a big inverted cube or just a fullscreen quad.

Let me do skydome as a sphere mesh (icosphere or UV sphere) with radius = viewDistance, rendered with a shader that colors based on world-space normal (= view direction from center). Since camera is at center of the dome (I'll translate dome to camera? No—). Let me make the sky a fullscreen-quad approach instead, it's simplest and avoids seam issues.

Fullscreen sky: render a quad covering the screen, fragment shader computes ray direction from view matrix (the upper-left 3x3). For each screen pixel, direction depends on pitch/yaw and screen position. But that's basically doing the projection in shader. Since I have a perspective projection, the clip-space to direction mapping requires the projection matrix too. Let me instead render the sky as a large sphere centered at camera.

Sphere centered at camera: I build a sphere mesh (fixed), and set model matrix to translate to camera position (no scale, since radius large). Normal in world = sphere normal (since no rotation/scale, and centered at camera) = direction from camera. So fragment shader uses world normal as view ray. Colors from that. This gives a proper sky dome that moves with camera. 

I'll generate a UV sphere mesh once (say 64x32 segments) and render it with depth test disabled (or depth = far), drawn after everything with depthMask off, OR drawn first. Since it's the background, draw it first with depthWrite off and depth test less-equal at max distance. Actually if I draw it first with depthWrite off but depth test on, then terrain can occlude it fine. Let me draw sky first, depthWrite off, depthTest on (so terrain overwrites where closer). That works.

But the sun and stars are part of sky — computed in sky shader from time. Good.

**Water**: plane at y=0. I'll generate a large plane mesh (or reuse chunk grid) covering the visible area, subdivided, with wave displacement in shader. Actually doing animated waves in the shader with a static mesh won't displace geometry. Two options:
1. Displace vertices on CPU each frame using wave function (expensive if big mesh).
2. Compute wave height + normal in the water fragment (and vertex) shader using time.

Let me do water geometry as a static large subdivided plane at y=0, and in the shader compute animated wave height via noise/sine for both displacement (vertex) and normals (fragment). That gives animated waves without per-frame CPU cost. Fresnel reflection with sky color.

The water plane must cover the area where terrain is below water. Since terrain extends infinitely, water plane should also extend to view distance. Let me generate a water mesh the same size as the terrain area (radius * chunk). Subdivide maybe 64x64. Render after terrain, with some transparency/reflection.

Water rendering order: terrain, then water (water is reflective so maybe render sky, then water with reflection...). For simplicity and beauty: sky (background), terrain, water (with fresnel blending sky color and deep water color, plus specular highlight from sun). Then maybe clouds.

Order: 
1. Sky dome (depthWrite off, depthTest on) — provides gradient, sun, stars, and sets the "sky color" for fog/reflection.
2. Terrain (depthWrite on).
3. Water (depthWrite on or off, fresnel blend).

Fog: compute per-fragment distance-based fog blending to sky color. Apply to terrain and water.

Let me structure the GLSL with a shared sky-color function. I'll inline it in each shader or use a GLSL library (multiple shader sources). WebGL lets me append strings. I'll create a common preamble string with `skyColor(dir)` and `sunColor()` etc., and prepend to terrain/water/sky shaders.

### Time of day / sun

Sun angle: time 0-24. Sun position on a great circle. Let me define:
- solarAngle = ((time - 6) / 24) * 2π ... at time=6 sunrise (horizon east), time=12 noon (top), time=18 sunset, time=0/24 midnight (bottom).

Actually let me define sun direction:
```
var t = time / 24; // 0..1
var angle = t * 2π - π/2; // so that at t=0.5 (noon) angle = π/2 (up)
```
Hmm let me just place sun by angle from horizon:
```
var sunAngle = ((time - 6) / 24) * Math.PI * 2; // time=6 → 0 (horizon)
sunDir = (cos(sunAngle)*something, sin(sunAngle), ...)
```

Let me put the sun moving in the XZ... no, in a vertical plane. Let me define sun direction:
```
var hour = time;
// azimuth: sun rises in east (+x?), sets in west. Let's fix azimuth = +x at sunrise.
var elevation = ...; 
```

Simpler: define sun direction as function of time, lying in the XZ plane? No, sun should go up. Let me define:
```
var a = (time / 24) * Math.PI * 2 - Math.PI/2; // a=-π/2 at midnight(time=0), a=0 at 6am, a=π/2 at noon(12), a=π at 18pm, a=3π/2 at 24
sunDir = (cos(a)*cos(azimuth), sin(a), cos(a)*sin(azimuth));
```
With azimuth = some fixed direction, say the sun rises toward +x. Let azimuth = 0 → sunDir = (cos a, sin a, 0). At noon a=π/2 → (0,1,0) straight up. At 6am a=0 → (1,0,0) horizon east. At 18pm a=π → (-1,0,0) horizon west. Good. At midnight a=-π/2 (or 3π/2) → (0,-1,0) below. 

Wait at time=0, a = -π/2 → (0,-1,0) pointing down (midnight, sun below). Good.

Let me compute: a = (time/24)*2π - π/2. time=0 → -π/2. time=6 → 0. time=12 → π/2. time=18 → π. time=24 → 3π/2. Good.

sunDir = (cos(a), sin(a), 0)? But then sun only moves in XZ... no, (cos a, sin a, 0) is in XY plane, moving from +x (east horizon) up to +y (zenith) to -x (west horizon) to -y (below). Good, that's a nice daily arc in the XY plane. Azimuth fixed to east-west. That's fine (sun rises east, sets west, assuming we don't rotate camera—camera yaw doesn't affect sun world dir, and we view relative).

Hmm but if camera always looks forward (-z) and sun is in XY plane, then depending on yaw the sun could be behind. That's fine, it's a sky feature.

Actually to make sun visible often, maybe add a slight dependence. But it's fine.

Light color/intensity by sun elevation:
- Above horizon (sin(a) > 0): daylight. Intensity scales with elevation.
- Near horizon (sunrise/sunset): warm orange.
- Below horizon: night, moonlight dim blue, stars.

Let me compute:
```
var elev = sunDir.y; // sin(a)
var dayFactor = smoothstep(-0.1, 0.3, elev); // 0 night, 1 day
```
Sun color:
```
var horizonFactor = 1 - abs(elev); // near horizon = 1
sunColor = mix(coolDayColor, warmSunriseColor, horizonFactor);
```

Sky color: gradient from zenith to horizon, tinted by time. Night sky dark blue/black with stars.

Let me define functions:
```
skyZenith(time), skyHorizon(time)
```
During day: zenith deep blue, horizon light blue. During sunset: orange/pink horizon. Night: near black.

Fog color = horizon sky color mostly.

Let me write GLSL sky functions.

### Arena API

```js
window.__arena = {
  freeze: function(on){ isFrozen = on; },
  setSeed: function(n){ seed = Math.trunc(n); regenerateTerrain(); document.getElementById('seed').value = seed; },
  setTime: function(h){ timeOfDay = ((h % 24) + 24) % 24; document.getElementById('time').value = timeOfDay; },
  setCamera: function(c){ ... },
  getCamera: function(){ return {...}; },
  terrainHeight: function(x,z){ return computeTerrainHeight(x,z); },
  stats: function(){ return {chunks: chunkCount, triangles: triCount}; }
};
```

freeze: when frozen, don't advance time or autopilot, but keep rendering. Also water/cloud animation should stop — but that's fine since animation uses time; if frozen we freeze the animation clock. Actually "no water/cloud animation" while frozen. So the animation should depend on a time variable that we stop advancing when frozen. Let me use `animTime` that advances only when not frozen. Water waves use animTime. If frozen, animTime fixed → water static. Good. Also time-of-day: setTime still works to set time, but it won't auto-advance while frozen. That's consistent: "the image depends only on seed, camera, time of day and viewport."

terrainHeight: must match actual rendered surface. I'll expose computeTerrainHeight using same noise. But note terrainHeight at (x,z) should be the heightfield value (ignoring water). The grader might call terrainHeight and compare to where camera is, or check getCamera y >= terrainHeight. I'll make computeTerrainHeight the exact same function used for mesh generation and clamping.

But wait — the mesh uses chunk-based sampling with finite differences for normals, but the height field is the same function. terrainHeight(x,z) returns heightfield value. Good.

One concern: the grader's setCamera with y below minimum → push up. So getCamera returns corrected y. I'll clamp in setCamera application.

Also setCamera sets yaw/pitch. When frozen, setCamera still works (user input works). Yes, setCamera is an API call, allowed.

stats: chunks = number of loaded chunks, triangles = triangles drawn last frame (terrain + water + sky). I'll accumulate a running total.

### UI

- Canvas fullscreen.
- Overlay div with:
  - Time slider (#time) input type range min 0 max 24. Actually the contract says #time is `<input type="range" min="0" max="24">`. I must include it with those attributes. Events set time.
  - Seed input (#seed) input type number. change regenerates.
  - Autopilot indicator (text or checkbox).
  - FPS counter.
  - Maybe a toggle for autopilot (F key).

The contract requires #time and #seed to exist with specific ids and behavior. Autopilot indicator and FPS are "minimal elegant overlay" — free choice.

Let me place them in a corner with low opacity, clickable.

I must ensure `#time` input events set time, `#seed` change events regenerate. I'll add event listeners. Also wire the arena to update these inputs' values.

Note: `input` event on range — the contract says "input events set the time of day." So I listen for 'input' on #time and call setTime. Also `change` on #seed.

For setSeed updating #seed and setTime updating #time, I set their .value. Setting .value programmatically doesn't fire input/change; that's fine.

### Controls without clicking UI first

Keyboard and mouse-drag work when page focused, without clicking UI. So I attach window listeners for keydown/keydown and mousemove/mousedown. Note the contract says keyboard works "with the page focused, without clicking any UI first." I'll attach to window. But the #time/#seed inputs — if user tabs into them, typing would be captured by input not window keydown. That's fine.

One issue: keydown default for some keys (like space) scrolls. I'll preventDefault on handled keys.

Mouse-drag look: mousedown records start, mousemove adjusts yaw/pitch by dx,dy. Without pointer lock. Smooth.

### Performance

Cap pixel ratio (e.g., min(devicePixelRatio, 2)). Resize handler sets canvas size.

Chunk streaming: on each frame compute which chunks are needed, generate missing, remove far ones. Use a Map keyed by "cx,cz". Generation samples noise. Cache meshes.

LOD: segment count by distance.

Let me also handle the "no visible seams" — since noise is continuous, adjacent chunks sample the same edge values → seamless. Good. But different LOD per chunk could create steps at boundaries. To avoid, I could use uniform segment count, or make neighboring chunks share. Simplest robust: uniform SEG for all chunks. Let me just use uniform SEG = 32 (or 40). 169-289 chunks * 33x33. Let me estimate triangles: 33x33 grid = 32*32*2 = 2048 tris per chunk. 169 chunks → 346k tris. Plus water ~ similar. ~700k tris total. On modern laptop at 60fps maybe borderline but OK for grading (grader measures perf). Let me reduce: SEG=28, chunk=256, viewDist=1500, radius=6 → 13x13=169 → 28*28*2=1568 tris *169 = 265k terrain. Water plane 256*13 area with SEG maybe 60 → 60x60*2=7200 *1 = 7200. Total ~272k. Fine.

Hmm but let me reconsider chunk count. Let me reduce view distance a bit or increase chunk size. Let me use CHUNK = 320, SEG = 28, viewDist = 1600 → radius = 5 → 11x11 = 121 chunks. 28x28*2 = 1568 *121 = 190k tris. Good.

Actually, to keep view distance ≥ 1500m requirement, 1600 is fine.

Let me also add LOD by distance to reduce far chunks detail. But uniform is simpler and seamless. Let me do simple LOD: reduce SEG for chunks farther than N. But that creates steps at chunk boundaries between different-detail neighbors. To avoid, I can make the boundary vertex shared by using same SEG for neighbor — complex. Given continuous noise, a "step" would only appear if two adjacent chunks have different edge vertex counts. If I do distance-based SEG, adjacent chunks might differ. 

Alternative: do LOD only by reducing number of chunks (draw distance) not detail. That avoids seams. Let me keep uniform detail and just manage chunk count. Good enough. Actually the requirement explicitly says "Use LOD or distance-based detail." I can implement LOD as: far chunks rendered with fewer segments but I handle shared edges by... hmm.

Let me implement a clean LOD that avoids seams: use a global grid? No.

Alternative clean LOD: tessellation based on distance, but ensure neighboring chunks use the same segment count by taking the max of required detail among adjacent. Too complex.

Simplest interpretation: I'll do distance-based detail where I reduce SEG for far chunks, and to avoid seams I make chunk edges always use the SAME SEG as determined by the chunk's own distance (adjacent chunks have very similar distance so same SEG in practice). Actually adjacent chunks differ by one in cx/cz, distance differs slightly but the SEG tier might differ at boundaries causing seams. 

To be safe and still satisfy "LOD," let me do LOD via segment count but compute it deterministically from the chunk's center distance, and accept that at tier boundaries there could be a tiny step. Actually a step would be visible. 

Let me instead just NOT vary segment count and instead vary chunk size for LOD: near chunks are small (high detail), far chunks large (low detail). Small chunks near center, big chunks far. This is the standard chunk LOD. Adjacent chunks of different sizes can still share a boundary row if I compute boundary vertices by sampling the shared edge with the same function and same resolution... no, different size = different resolution on the shared edge = mismatch.

OK here's the clean approach used in many engines: each chunk's grid is generated by sampling the heightfield at grid points; the boundary vertices are computed from the same heightfield; for two adjacent chunks to share, they must sample the boundary at the same points. If chunk A is detail 32 and chunk B is detail 16, the boundary sample points differ.

The truly seam-free way: render each chunk as independent quads (not sharing vertices) — then there are no shared vertices but the geometry still connects because heights match at the boundary (same noise function sampled at same world coords). Wait — if chunk A covers x in [0,320] and chunk B covers [320,640], A's right edge is x=320, B's left edge is x=320. The height at x=320 is the same regardless. The vertices along that edge: A samples its right edge at its segment boundaries; B samples its left edge at its segment boundaries. If A has 32 segments over [0,320], its right edge vertices are at x=320 (one vertex, the last). B's left edge at x=320 (first vertex). Both at x=320, same height, same position x=320. Even if the number of vertices along the edge differ, the edge itself is a line from (320, y=H, z0) to (320, H, z1). As long as both chunks cover the same z-range at x=320 and the z endpoints match (they do, since chunks align on chunk boundaries), the two triangles from each side will meet along that edge geometrically. The vertex counts along the edge don't need to match for the mesh to be watertight — the edges coincide as line segments in space, and the triangles on each side share that edge segment even if one side has more vertices on it. Because a triangle edge from (320,H,z0) to (320,H,z1) fully contains the finer subdivided edge. So no gap! The mesh is watertight (no holes) even with different LOD, as long as the boundary lines coincide.

Wait, is that right? Consider edge at x=320 spanning z from z0 to z1. Chunk A (coarse) has 2 vertices on this edge: at z0 and z1. Chunk B (fine) has many vertices: at z0, z0+Δ, ..., z1. The triangles: A has a triangle edge connecting (320,H,z0)-(320,H,z1) directly (the shared edge of A's coarse quad). B has small triangles along that edge. The union covers the same geometric region. There's no gap because A's single edge coincides exactly with B's series of edges (they're all on the line x=320, same z endpoints). So rendering is continuous, no seams. 

The only "issue" is overdraw / shared vertices but that's fine for correctness. So I CAN use different LOD per chunk without seams! Great. That satisfies LOD requirement.

But there's a subtle issue: at the boundary, coarse chunk A has a big triangle straddling the boundary while fine chunk B has small triangles. Where A's big triangle meets B, along x=320 they coincide. Good. But what about the corner where A's detail changes too? Each chunk is independent; boundaries between any pair coincide as long as chunk grids are axis-aligned (they are). So seam-free. 

So I'll use distance-based SEG per chunk. Near = fine, far = coarse. Let me set:
- dist < 1 chunk: SEG 40
- <2: 32
- <3: 24
- <4: 20
- else: 16

Actually let me make it depend on chunk center distance to camera.

Hmm, but the boundary between two chunks of different LOD: the shared edge coincides geometrically, good. But there's another subtlety: the vertices NOT on the boundary but near it — fine chunk B near the boundary has vertices at x=320+small, coarse A has vertices at x=320-small. So near the boundary, A is coarse and B is fine; they meet at x=320. Fine. No seam.

OK so LOD by chunk is safe. Let me do it.

Actually, wait. Let me reconsider whether it truly has no visual seam. The triangles meet exactly at x=320. Along x=320, both produce the same height (noise is continuous). So the ridge at x=320 is identical. The mesh is continuous (C0). Lighting might show a slight discontinuity in normals if I compute normals per-vertex from the mesh (finite differences) because coarse vs fine change the local neighborhood. That could cause a visible lighting seam along chunk boundaries! To avoid, compute normals analytically from the noise function (partial derivatives) at each vertex, not from mesh neighbors. Then normals are smooth across boundaries. 

So I'll compute normals analytically (finite difference of the height function with tiny ε in world space). This gives smooth normals independent of mesh resolution. 

But then near the LOD boundary, coarse chunk has fewer vertices but each has correct analytic normal → smooth. 

Let me do analytic normals via finite differences of terrainHeightAt with epsilon like 1.0 world unit.

Actually even simpler and robust: compute normal = normalize(-dh/dx, |dheight|..., -dh/dz) using central differences of the height function. Good.

Let me also make sure water and terrain at coastlines blend. Water at y=0; where terrain > 0 it's land (above water), where terrain < 0 it's underwater/sea floor. The water plane at y=0 covers everything; over land the land is above water so land occludes? No—land is above y=0, water plane at y=0. Land geometry at x where terrain=50 is at y=50, water plane at y=0. Land is "in front" (higher). With depth testing, both drawn; water plane at y=0 behind/ahead depending on view. Since we look down-ish, the water plane at y=0 will be visible over ocean areas (terrain<0, so terrain floor below water, water surface at 0 on top). Over land (terrain>0), the water plane at y=0 is below the land surface, and land surface at y>0 is closer to camera (if looking down) → land occludes water. Good, coastlines work naturally. Shoreline blending (wet sand) via material color near y≈0.

I should render water with some transparency so the sea floor shows through shallow water, or opaque reflective water. For beauty, semi-transparent water showing depth + reflection. Let me do water with fresnel + a depth-based color + reflection. Keep it reasonably simple: opaque-ish water with fresnel reflection of sky and a base water color, darker near shore.

Rendering water: after terrain, with depthTest on, depthWrite maybe off (so it blends), alpha blend. But fresnel reflection looks better opaque-ish. Let me do alpha ~0.9 with blending, or just render opaque with good shading. Let me do: water color = mix(depthColor, skyReflectColor, fresnel); plus sun specular. Render with depthTest on, depthWrite off, blend enabled (source alpha, dest 1-alpha) won't give nice results over terrain below... Actually since water surface is at y=0 and terrain below is at y<0, water should be transparent showing the floor. Let me make water alpha based on depth (deeper = more opaque). And fresnel reflection adds sky. I'll do alpha blending.

Hmm, this is getting complicated. Let me keep water: 
- Compute wave normal in shader.
- fresnel = pow(1 - dot(viewDir, waveNormal), 3) blended.
- color = mix(waterDeep, skyColor, fresnel) + sunSpec.
- alpha ~ 0.85, blend so we see floor.

Let me just implement and it'll look okay.

Actually, for a cleaner look and to avoid blending bugs, render water opaque (depthWrite on) with fresnel reflection + subsurface-ish deep color. The sea floor won't be visible through water but that's acceptable (clear water look). But then over ocean, we only see water surface at y=0, and the sea floor below is hidden — that's fine and realistic (you see the water surface). Good. Let me make water opaque. But then the transition at shoreline: land above water meets water surface. Fine.

Wait, but if water is opaque at y=0 and we render it after terrain, over ocean areas terrain floor is below y=0 and hidden behind water surface — good. Over land, water plane at y=0 is below land; but we render water after terrain with depthWrite on, so water triangles that are below land surface (land at y>0, camera looking down) — the water plane extends over land area too (it's a big plane at y=0). The water triangle at a point where terrain=50 is at (x,0,z). Camera above. Depth test: the land surface vertex at (x,50,z) was drawn first (terrain pass) with its depth. The water vertex at (x,0,z) is farther from camera (lower) → depth test fails → water not drawn there. Good, land occludes water. But if camera is low (near water) and looking slightly down, could water plane at y=0 over land appear? Land at y=50 is above; water at y=0 below and slightly... it depends. Generally land (higher) occludes. At shoreline there's the transition. Should be fine.

Edge case: water plane might be visible above the sea floor creating a flat mirror everywhere including where terrain is slightly above 0 — but depth test handles it.

Let me render water after terrain, opaque, depthTest on, depthWrite on.

Order: sky (depthWrite off) → terrain (depthWrite on) → water (depthWrite on). But sky drawn first with depthWrite off and depthTest on: terrain drawn after will overwrite sky where terrain is closer (depthTest passes since terrain closer). Good. Stars/sun behind mountains — correct.

Wait, sky dome is centered at camera with huge radius; every sky fragment is at ~radius distance (far). Terrain is closer. So depthTest: sky passes (first, nothing there), then terrain closer overwrites. Good. But if camera is inside... no, radius huge. Good.

Also need to make sure sky dome doesn't get culled or cause z-fighting. It's fine.

### Clouds (optional polish)

The requirement mentions "no cloud animation" when frozen implying clouds exist. Optional. Let me add a simple cloud layer: a large plane above terrain with noise-based opacity, or projected noise. To keep scope manageable and avoid perf issues, I'll add clouds as a second sky-ish layer: a big plane at high y (e.g., 500) with a scrolling noise texture... but no textures (must be generated). I can do cloud shading in shader using fbm of world x,z minus a scrolling offset based on time. Render as a translucent layer below sky dome or above terrain. Let me add it as a shader on a large plane or as part of sky. 

Hmm, clouds add complexity. Let me add a simple version: render clouds as a fullscreen-ish large quad at high altitude with fragment shader doing fbm noise tinted by sun. Actually let me integrate clouds into the sky dome: where the view ray hits high elevation, blend in clouds based on noise(time). That keeps it simple (part of sky shader). Let me do that: in sky shader, compute cloud coverage from fbm of (dir.xz scaled + time*speed) and blend white/gray toward sun-lit color. This gives volumetric-ish clouds in the sky. 

But "no cloud animation while frozen" — clouds use animTime which is frozen when frozen. Good.

Let me incorporate clouds into sky shader based on view direction. Nice.

### Let me now also think about the "freeze" and default animation.

Default: autopilot on, time advancing (full day ~120s → 24h/120s = 0.2 h/s). 
```
if (!frozen) {
  timeOfDay += dt * (24/120); // per second
  if (timeOfDay >= 24) timeOfDay -= 24;
  animTime += dt;
  // autopilot moves camera
  moveAutopilot(dt);
}
```
When frozen, none of these advance, but rendering continues (animation loop keeps calling requestAnimationFrame). Good.

### Camera clamp

After movement, clamp y: 
```
var minY = Math.max(terrainHeightAt(pos.x, pos.z), 0) + CAM_MARGIN;
if (pos.y < minY) pos.y = minY;
```
CAM_MARGIN ~ maybe 8 when on foot, but flying maybe more. For autopilot keep altitude above terrain. Let me apply clamp always.

Actually "can never go below terrain height (+margin) or below water surface." So y >= max(terrainH, 0) + margin. margin small like 5. For autopilot, we want to fly above terrain so we set autopilot target = terrainHeight + altitude and never dip below clamp.

### Autopilot

```
targetY = terrainHeightAt(x,z) + ALT; // ALT ~ 70
move forward along forward.xz by speed*dt
update x,z
set y toward targetY smoothly
clamp y to min
```

Forward movement: velocity-based. Autopilot sets forward velocity = SPEED (e.g., 60 m/s). 

Let me unify: maintain velocity vector (world). Keys add to velocity. Autopilot sets a target velocity (forward * SPEED). Position integrate.

For autopilot, I want smooth. Let me do:
```
if autopilot: 
  targetVel = forward * AUTO_SPEED;
  velocity = lerp(velocity, targetVel, 1-exp(-k*dt));
else:
  // manual: accumulate from keys, damp
velocity += accel*dt; velocity *= exp(-damping*dt);
pos += velocity*dt;
```

Let me implement a clean model:
- `vel` = current velocity (vec3).
- Each frame compute `accel` (desired acceleration) from controls.
- `vel = vel * damp + accel * (1-damp) ...` hmm.

Let me do simple: 
```
var speedFactor;
// desired velocity from input
var desired = forward*moveForward + right*moveStrafe ... (manual)
```

Let me implement:
```
// input amounts [-1,1]
var w = keys.W?1:0 - keys.S?1:0;  // forward/back
var a = keys.A?1:0 - keys.D?1:0;  // strafe
var q = ... down, e ... up

// desired velocity in world
var dvx = forward.x*w + right.x*a;
...
// autopilot
if (autopilot) {
  dv = forward*AUTO_SPEED;
  // keep altitude
}
// blend
vel = vel + (dv - vel) * (1 - Math.exp(-8*dt));
vel.y += (upForce) ... 
pos += vel*dt;
clamp y
```

For look (mouse), set yaw/pitch with smoothing toward target.

Let me just write it clearly in code.

### Mouse look

mousedown → looking=true, lastX,lastY. mousemove → if looking: yaw -= dx * sensitivity; pitch -= dy*sensitivity; clamp pitch to (-π/2+eps, π/2-eps). Actually pitch positive looks up; dragging mouse down (dy positive) should look up? Let me define: dragging mouse up (dy negative) looks up (pitch increases). Let me set pitch += -dy*sens → dy negative (move up) → pitch += positive. And yaw -= dx*sens → drag right (dx positive) → yaw decreases → ... let me not worry about exact convention, just make it responsive and consistent. I'll pick: yaw -= dx*sens, pitch += dy*sens (drag down looks down). It's user-facing, any consistent works.

### Building matrices

I'll write mat4 helpers: perspective, lookAt, multiply, translate, identity, invert.

For the view matrix I need it for fog and sky. I'll compute view = lookAt(camera). For sky dome I need the camera forward/right/up for direction mapping — actually sky dome is centered at camera with model = translate(pos). The sky vertex shader: worldPos = pos + normal*radius (normal from sphere, no rotation). So world normal = sphere normal = direction from camera. In fragment, dir = normalize(worldPos - cameraPos) = normal (since no rotation). So I can just use the sphere normal as dir. No need for view matrix in sky. 

For terrain/water fog, I need world positions (pass them) and compute view direction = normalize(cameraPos - worldPos) and distance = length(...). Fog factor = 1 - exp(-density*distance) or linear. Blend to sky horizon color.

For water fresnel, need view dir and sun dir in world — pass cameraPos, sunDir.

So shaders need: uniform mat4 uProj, uView (or just pass cameraPos), uSunDir, uSunColor, uAmbient, uSky params, uTime, uCameraPos.

I'll pass uView and uProj. cameraPos extracted from view or passed separately.

Let me build view matrix as lookAt(eye, center, up) where center = eye + forward, up=(0,1,0).

### Let me now write the code.

This is a large file. Let me structure:

1. HTML head: style for canvas and overlay.
2. Body: canvas, overlay div with controls.
3. Script: everything.

Let me write the GLSL.

Common sky GLSL (appended to terrain, water, sky shaders as needed):
```glsl
vec3 skyDirectionColor(vec3 dir, float time) { ... }
```

Actually let me define a full sky color function in a shared lib string.

Let me define GLSL noise for clouds (simple value noise or fbm). I'll write a small fbm in GLSL.

Let me draft the GLSL library:

```glsl
vec3 sunDirFromTime(float t){ float a=(t/24.0)*6.2831853-1.5707963; return vec3(cos(a), sin(a), 0.0); }
```

Hmm, but I compute sunDir in JS and pass as uniform. For sky shading I need it in shader. I'll pass uSunDir uniform. Good. And uTime for clouds.

Let me pass uSunColor (rgb), uSunIntensity, uSkyZenith (rgb), uSkyHorizon (rgb), uFogColor, uAmbientColor, uSunDir, uTime, uSeed-ish (for cloud noise offset), uCamPos, uProj, uView.

Sky shader fragment:
```
dir = normalize(vNormal); // world normal of sphere = direction
float elev = dir.y;
vec3 sky = mix(uSkyHorizon, uSkyZenith, clamp(elev,0,1));
// sun disk
float sun = pow(clamp(dot(dir, uSunDir),0,1), 800.0); // bright disk
sun += pow(clamp(dot(dir,uSunDir),0,1), 8.0) * 0.4; // glow
vec3 sunC = uSunColor;
sky += sunC * (sun*3.0 + glow);
// stars if night
float night = 1 - smoothstep(-0.1,0.3,uSunDir.y);
vec3 star = ... flickering noise... * night
// clouds
float cl = cloudCoverage(dir, uTime);
sky = mix(sky, uSkyZenith*(0.6)+sunC*0.2, cl*0.6*dayish);
```

Let me implement cloud as fbm of dir.xz*3 + time*0.02, threshold → coverage.

For stars: use hash of dir direction quantized → random brightness, only at night, above horizon.

This is a lot but doable.

Terrain fragment:
```
normal = normalize(vNormal);
lightDir = normalize(uSunDir);
diff = max(dot(normal, lightDir),0);
// ambient from sky light
color = vColor * (uAmbient + uSunColor*diff*uSunIntensity);
// fog
float dist = length(vWorldPos - uCamPos);
float fog = 1 - exp(-dist*uFogDensity);
color = mix(color, uFogColor, fog);
// also add slight rim/terminator warmth
```

Water fragment:
```
wave normal from analytic sine waves or fbm derivative
fres = pow(1 - dot(viewDir, waveNormal), 4)
col = mix(uWaterDeep, uSkyHorizon, fres) + sunSpec
fog applied
```

Let me write water wave normal analytically in shader:
```
vec3 waveNormal(vec3 p, float t){
  vec3 n = vec3(0,1,0);
  float w = 0;
  // a few sine waves
  w += sin(p.x*0.05 + t*1.2)*0.3;
  ...
  n.x = -cos(p.x*0.05+t*1.2)*0.05*0.3;
  ...
}
```
Simplify: a couple of sine waves for normal and height.

Actually for nice animated water, let me use a small fbm of sines. Let me keep it to a few waves.

Let me now also compute terrain vertex color on CPU:
```
height = terrainHeightAt(x,z)
slope = 90 - angle... from normal (ny). slope = acos(ny)*rad2deg.
if (height <= 0.5) color = sand (near water)
else if (height < snowLine) {
   if (slope > 45) rock else grass
}
else snow
blend based on height and slope
```
Colors: sand #e0d3a, grass #4a7a2c, rock #6d6a61, snow #f0f4f8. Let me pick pleasant values.

I'll compute a blend:
```
sand if height<2
grass up to hillLine
rock if slope steep or high
snow if height>snowLine
```
Let me do smooth-ish via mixing.

Actually per-vertex color then interpolated is fine.

Let me define constants:
- waterLine = 0
- sandLine = 1.5
- grassLine = 120
- rockLine = 280
- snowLine = 320
- slopeRock = 40 deg

Blend:
```
col = sand
if (h > sandLine) col = mix(sand, grass, smoothstep(sandLine,grassLine,h));
if (h > grassLine && slope > slopeRock) col = mix(col, rock, smoothstep(slopeRock-5, slopeRock+10, slope));
else if (h > grassLine) col = mix(col, rock-ish, ...); 
```
Hmm let me simplify: compute base color from height bands, then overlay rock on steep slopes, snow on high.

```
vec3 col;
if (h <= waterLine+1.0) col = sand;
else if (h < grassTop) col = grass;
else if (h < snowLine) col = rock;
else col = snow;
// slope -> rock
if (slope > slopeThreshold && h > waterLine+2) col = mix(col, rock, smoothstep(slopeThreshold, slopeThreshold+15, slope));
// snow on high even if not rock
if (h > snowLine*0.85) col = mix(col, snow, smoothstep(snowLine*0.85, snowLine, h));
// grass to rock transition at high altitude
```
Good enough.

Let me finalize colors. I'll pick:
- sand: (0.82, 0.75, 0.55)
- grass: (0.32, 0.52, 0.22)
- dirt/transition: (0.4, 0.35, 0.25)
- rock: (0.45, 0.43, 0.40)
- snow: (0.92, 0.94, 0.98)

OK let me just write it.

### Let me consider determinism

No Math.random anywhere. Noise is deterministic hash. Good. Seed affects noise offset: I'll incorporate seed into the noise by adding seed-based offset to coordinates or as a perturbation. Since hash uses integer inputs, I can add a seed offset to the noise coordinates:
```
var sx = seed * 137.5; // offset
noise2D(x*scale + sx, z*scale + sz)
```
But large offsets might overflow precision? Coordinates are doubles, adding ~seed*137 fine. Actually to make seed strongly affect world, let me feed seed into the noise via a hashed permutation: I can XOR seed into the hash inputs. Since hash takes integers x,y, I can do:
```
hash(xi + seed*9999, yi + seed*12345)? 
```
But xi is floored float → integer part. Let me just add a per-seed rotation/offset in the noise input space:
```
var ox = seed * 100.37;
var oz = seed * 91.13;
fbm((x+ox)*scale, (z+oz)*scale, ...)
```
This shifts the noise field, giving different worlds per seed. Deterministic. Good. Actually even simpler: incorporate seed as a large coordinate offset. Let me also vary scale slightly? No, keep scale fixed so terrainHeight matches across seeds at same coords (only offset differs). The grader's terrainHeight uses same function so consistent.

Wait, but if I offset by seed*100, then for seed=1 the world is offset from seed=0 by 100 units — same terrain just shifted. That's fine (different world visually). Good.

But two different seeds could give similar terrain if offset aligns with noise period. Whatever, it's fine.

Let me incorporate seed more strongly: use seed to perturb. I'll do:
```
var ox = mod(seed * 31.7, 1000);
var oz = mod(seed * 73.3, 1000);
```
Hmm arbitrary. Let me just do offset. Good.

### terrainHeight public function

```js
function computeTerrainHeight(x, z) {
  var ox = SEED_OFFSET_X, oz = SEED_OFFSET_Z;
  return terrainHeightRaw(x+ox, z+oz); // wait, offset should shift world
}
```
Actually I want: world point (x,z) height. The noise field is fixed in world; seed shifts which part we see. If seed changes, the terrain under a fixed world point changes (that's "regenerate world"). The grader calls terrainHeight(x,z) for the current seed. So computeTerrainHeight(x,z) must use current seed's offset. Fine.

But note: the mesh generation and clamp and terrainHeight must all use the same function. I'll centralize.

Let me define:
```js
var SEED = 1;
var seedOffsetX = 0, seedOffsetZ = 0;
function applySeed(s){
  SEED = s;
  seedOffsetX = s * 173.5;
  seedOffsetZ = s * 26.9;
}
function terrainHeightAtWorld(x, z){
  var nx = (x + seedOffsetX) * SCALE;
  var nz = (z + seedOffsetZ) * SCALE;
  ... fbm ... 
}
```

Wait, adding offset to x means the field shifts. For x=0 with seed=0 we get some value; seed=1 we evaluate noise at x+173.5 → different. Good.

Hmm, but actually I realize I should double check: "The same seed must give an identical image for the same camera and time." Since everything is deterministic, yes.

### Now the mesh building

For each chunk (cx,cz):
```
worldX0 = cx*CHUNK, worldZ0 = cz*CHUNK;
seg = segForDistance(dist);
verts = []; 
indices = [];
for i in 0..seg:
  for j in 0..seg:
    x = worldX0 + j/seg*CHUNK
    z = worldZ0 + i/seg*CHUNK
    y = terrainHeightAtWorld(x,z)
    normal = computeNormal(x,z)
    color = computeColor(y, slope)
    push {x,y,z,nx,ny,nz,r,g,b}
build index buffer (strip or tri list)
create buffer, upload
```

Store chunk object {cx,cz, buffer, triCount}.

I'll keep one gl buffer per chunk (interleaved VBO + index BO) or one interleaved with indices. Let me do interleaved position/normal/color in one VBO and indices in another per chunk. Actually to reduce draw calls and state, one draw per chunk.

Total chunks up to ~121 → 121 draw calls for terrain. Fine.

Water: one big mesh covering the whole visible area. Rebuild when viewDist/chunk changes? Water covers radius*CHUNK area. Let me build water as a single mesh covering from (camera - spread) to (camera + spread). Since camera moves, I'd rebuild water each frame — that's heavy (upload big mesh each frame). Alternative: make water mesh huge (covering max view area) and just rely on frustum culling + the terrain/depth to hide it. Let me build water covering the max chunk radius extent (fixed), and only rebuild if radius changes. It covers a fixed world area centered at origin? But camera moves far away, water centered at origin won't follow. 

Better: build water to cover a large area around camera, but rebuild only when camera crosses a chunk boundary. Let me rebuild water mesh when the camera moves to a new "water cell" (every CHUNK/2). Water mesh covers a radius around camera = viewDist + CHUNK. Subdivide into e.g. 96x96. That's 96*96*2 = 18k tris, rebuilt occasionally. Fine.

Actually simpler: since water is at y=0 and covers everything, and I render sky first, I can render water as part of... no. Let me rebuild water each time camera moves more than CHUNK/2 in world coords. Store water mesh keyed by camera cell.

Hmm, or I could make water a full-screen plane in screen space (like sky) — a plane at y=0 intersected with view frustum. Computing that in shader is complex. Let me just do the geometry approach with cell-based rebuild.

Let me set water to cover radius*CHUNK area with SEG_W segments. Rebuild on cell change.

Let me define WATER_SEG = 64. Coverage: from camX - viewDist - CHUNK to + same. So 2*(viewDist+CHUNK)/CHUNK chunks * SEG_W. With viewDist 1600, CHUNK 320: (1600+320)/320 ≈ 6 chunks radius → 12 chunks * 64 = 768 spans, SEG_W=64 → 64 spans = 64*(12*320/64)=... let me just make water cover [-D, D] where D = viewDist + CHUNK*2 with SEG_W subdivisions. Cell = floor(cam/D). Rebuild if cell changes.

Let me set D = 1800 (covers viewDist 1600). Water mesh spans [-1800,1800] in x and z (3600 units), SEG_W = 72 → spacing 50 units. 73x73 verts, 72*72*2 = 10368 tris. Rebuild on cell change (cell size 3600). Good, rare.

### FPS counter

Track frames and time, update every ~0.5s.

### Resize

```
function resize(){
  var w = min(window.innerWidth, ...); 
  canvas.width = floor(innerWidth * DPR);
  canvas.height = floor(innerHeight * DPR);
  canvas.style.width = innerWidth+'px';
  canvas.style.height = innerHeight+'px';
  gl.viewport(0,0,canvas.width,canvas.height);
  proj = perspective(fov, aspect, near, far);
}
```
DPR = min(devicePixelRatio, 2).

### Let me write it all now.

Let me be careful about WebGL: create program, attach shaders, link, use. Handle errors (log to console but no throw that breaks). Actually "No errors in the console." So I must avoid console errors. I'll wrap risky things but not spam console. I won't call console at all maybe, or only in dev. Let me avoid console usage entirely in the render path.

Let me write helper to compile shader that throws on error — but I don't want console errors. If compile fails the app breaks anyway. For grading, if shaders are correct, no errors. I'll add minimal try/catch that logs only in dev (but logging to console counts as console error? console.log isn't an error). The requirement "No errors in the console" — console.log is fine, console.error/warn might be flagged. I'll avoid console entirely to be safe, and ensure shaders are correct.

Let me write the shaders carefully to compile.

Let me now write out the full file.

I'll define GLSL constants:
```
#define PI 3.14159265
```

GLSL noise for clouds. Let me write a hash+fbm in GLSL.

```glsl
float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float valueNoise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f); return mix(mix(hash21(i+vec2(0,0)),hash21(i+vec2(1,0)),u.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),u.x),u.y); }
float fbm2(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*valueNoise(p); p*=2.0; a*=0.5;} return s; }
```

Sky shader uses this for clouds.

Let me now assemble. I'll write the JS with the GLSL as template strings.

Let me think about the sky sphere: I'll generate a UV sphere geometry. Vertices param by (u,v). radius = SKY_RADIUS = 60000 (huge, effectively infinity; fog won't matter). Actually if radius is huge, fog factor ~1 everywhere in sky → sky color becomes fog color. But I render sky without fog (sky is the fog source). So don't apply fog to sky. Good, sky shader has no fog.

But the sky sphere radius huge means near/far clip: far plane should be < radius? If SKY_RADIUS = 60000 and far = 3000, the sky sphere is beyond far → not rendered! I need sky radius < far, OR render sky with far plane beyond it, OR render sky last as overlay. 

Option: render sky sphere with radius ~ 4000 (larger than terrain view ~1600) but less than far. But then sky is a finite dome at 4000; at horizon the sun etc. appear at 4000 — fine visually (sun is effectively at infinity but visually on dome). Fog: I won't apply fog to sky. The dome at 4000 vs terrain at 1600 — terrain within dome, so terrain occludes dome behind mountains (depth test). Good. Set SKY_RADIUS = 3200 (a bit beyond view distance) and far = 4000. But terrain view distance 1500 + fog fades to sky color by ~1600, so the dome at 3200 is beyond where terrain has faded — but we don't draw terrain beyond ~1600 anyway (chunks stop at radius). The dome shows sky beyond horizon. 

Hmm, but if dome is at 3200 and there's no terrain between 1600 and 3200, we just see sky dome — fine, that's the horizon sky. Good.

But the sun position on the dome: sunDir is a direction; the sun appears where the view ray aligns with sunDir. On the dome, fragment dir = sphere normal. dot(normal, sunDir) peaks when normal points toward sun → sun disk at that screen location. Works regardless of radius. Good.

Let me set SKY_RADIUS = 3000, PLANE_FAR = 5000 (so far > radius, no clip). Actually far should be > sky radius so sky renders. far = 5000. Terrain chunks radius ~6 chunks*320=1920 < 3000. Fog fades terrain by ~1200-1600. Good. Let me set far = 5000.

Actually with far=5000, depth precision: z-fighting could appear for distant terrain, but terrain is fogged out before that, so fine.

Water: water plane at y=0 spans [-1800,1800], within far. Good.

Let me set near = 1.0, far = 5000.

Now the proj matrix uses these.

### Let me write the look-at / view matrix

```js
function mat4_lookAt(eye, center, up){
  // forward
  var z = normalize(eye, center); // points forward (eye->center)
  var x = normalize(cross(up, z));
  var y = cross(z, x);
  return [
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x,eye), -dot(y,eye), -dot(z,eye), 1
  ];
}
```
Note: standard lookAt uses forward = center-eye (normalize). Our forward vector from camera is also center-eye direction = our `forward` computed earlier. Consistent.

### perspective

```js
function mat4_perspective(fov, aspect, near, far){
  var f = 1/Math.tan(fov/2);
  var nf = 1/(near-far);
  return [
    f/aspect,0,0,0,
    0,f,0,0,
    0,0,(far+near)*nf,-1,
    0,0,far*near*2*nf,0
  ];
}
```

I don't really need multiply if I pass proj*view as one matrix. Let me compute view then pass proj and view separately, or multiply. Simpler: pass uProj and uView separately.

### Let me write the JS now in full.

I'll be thorough. Let me write it.

For the overlay UI, I need #time and #seed inputs. Let me also add autopilot toggle display and FPS.

Let me write HTML:
```html
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Horizon</title>
<style>
  html,body{margin:0;height:100%;overflow:hidden;background:#000;font-family: -apple-system, "Segoe UI", Roboto, sans-serif;}
  canvas{display:block;position:fixed;top:0;left:0;}
  #ui{position:fixed;top:12px;left:12px;color:#e8eef6;opacity:0.85;font-size:13px;line-height:1.5;text-shadow:0 1px 2px rgba(0,0,0,0.6);user-select:none;z-index:10;backdrop-filter: blur(2px);}
  #ui label{display:inline-flex;align-items:center;gap:6px;margin-right:14px;}
  #ui input[type=range]{width:160px;}
  #ui input[type=number]{width:72px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.25);color:#fff;border-radius:4px;padding:2px 4px;}
  #ui .badge{padding:1px 7px;border-radius:10px;font-size:11px;font-weight:600;}
  #ui .on{background:#38c170;color:#05310f;}
  #ui .off{background:#445566;color:#cdd9e5;}
  #hint{position:fixed;bottom:12px;left:12px;color:#cdd9e5;opacity:0.6;font-size:12px;z-index:10;text-shadow:0 1px 2px #000;}
  #fps{position:fixed;top:12px;right:14px;color:#e8eef6;opacity:0.85;font:13px/1.5 monospace;text-shadow:0 1px 2px #000;z-index:10;}
  a{color:inherit;}
</style>
</head>
<body>
<canvas id="gl"></canvas>
<div id="ui">
  <label>Time <input id="time" type="range" min="0" max="24" step="0.01" value="9"></label>
  <label>Seed <input id="seed" type="number" value="1"></label>
  <label>Autopilot <span id="ap" class="badge on">ON</span></label>
</div>
<div id="fps">-- FPS</div>
<div id="hint">WASD fly · Q/E up-down · Mouse look · F autopilot · Scroll zoom(FOV)</div>
<script> ... </script>
</body>
</html>
```

I need to make sure #time min="0" max="24" (step allowed). The contract says `<input type="range" min="0" max="24">`. I added step — should be fine. Let me keep min/max exactly.

Now the JS. Let me write it.

I'll define everything in an IIFE.

Let me carefully write noise, terrain, chunks, shaders, loop.

Let me write the mat utilities as simple arrays.

Actually for vectors I'll use plain functions on arrays of length 3/4.

Let me define:
```js
function vsub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
function vadd(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
function vscale(a,s){return [a[0]*s,a[1]*s,a[2]*s];}
function vdot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function vcross(a,b){return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];}
function vlen(a){return Math.hypot(a[0],a[1],a[2]);}
function vnorm(a){var l=vlen(a)||1;return [a[0]/l,a[1]/l,a[2]/l];}
```

mat4 as length-16 arrays. I might not need matmul if I pass proj and view separately. I'll just build view directly.

Let me define camera state:
```js
var cam = { x:0, y:200, z:0, yaw:0, pitch:0 };
```
Start above terrain at origin (terrainHeightAt(0,0) maybe ~ some value). Let me start y high enough. Compute terrainHeightAt(0,0) and set y = that + 80.

Forward:
```js
function fwd(){ var cp=Math.cos(cam.pitch), sy=Math.sin(cam.yaw), cy=Math.cos(cam.yaw); return [sy*cp, Math.sin(cam.pitch), -cy*cp]; }
```
Wait earlier: forward = (sin(yaw)*cos(pitch), sin(pitch), -cos(yaw)*cos(pitch)). Let me recompute: at yaw=0,pitch=0 → (0,0,-1) ✓. yaw=π/2 → (1,0,0) ✓. pitch=π/6 → y positive ✓. Good.

Right = normalize(cross(fwd, up)), up=(0,1,0):
cross(fwd, up) = [fwd.y*0 - fwd.z*1, fwd.z*0 - fwd.x*0, fwd.x*1 - fwd.y*0] = [-fwd.z, 0, fwd.x].
Normalize.

Let me compute in code.

Now movement. Let me maintain velocity vx,vy,vz.

Controls: keys object. Each frame:
```
if (!frozen){
  // advance time
  time += dt*(24/120)
  animTime += dt;
  // autopilot?
}
```
But even when frozen, keyboard still works to move camera. So movement input applies always (user input works when frozen). Time/autopilot only advance when not frozen.

Wait: "while frozen, nothing changes on its own (no autopilot movement, no time-of-day progression, no water/cloud animation)... User keyboard/mouse input still works when frozen." So movement from keys still works when frozen. Good. So I apply key-based velocity always. Autopilot movement (the automatic forward flight) only when not frozen AND autopilot on.

Actually autopilot is a mode; when frozen, even if autopilot on, no automatic movement. So:
```
if (autopilot && !frozen) { apply autopilot forward intent }
else if (!frozen) { apply manual from keys }
```
Hmm but manual movement should also be possible when frozen. Let me restructure:

Compute desired input from keys always (works frozen or not).
Compute autopilot intent only when autopilot && !frozen.

```
var inputF=0, inputS=0, inputU=0; // forward, strafe, up
if (autopilot && !frozen) {
  inputF = AUTO_SPEED;
  // altitude handled separately
} else {
  if (!frozen) {
    inputF = (W?1:0)-(S?1:0);
    inputS = (A?1:0)-(D?1:0);
    inputU = (E?1:0)-(Q?1:0);
  } else {
    // frozen: manual still works? "User keyboard/mouse input still works"
    inputF = (W?1:0)-(S?1:0); ... etc
  }
}
```

Let me simplify: 
```
var manual = !frozen;
if (autopilot && !frozen) {
   // autopilot overrides: forward at AUTO_SPEED
} else {
   // manual using keys (works when frozen too)
   inputF = manual? (W-S):0; etc
}
```

For autopilot, also maintain altitude: target y = terrainHeight + ALT; blend vy toward (target - y)/dt? Let me just set position approach:
```
// autopilot
var targetY = terrainHeightAt(x,z) + ALT;
// move forward
var sp = AUTO_SPEED;
x += fwd.x*sp*dt; z += fwd.z*sp*dt;
// adjust y smoothly toward target
y += (targetY - y) * (1-exp(-1.5*dt));
```
And clamp y. This is clean. Autopilot doesn't use velocity for vertical, just smooth approach. Horizontal uses direct velocity. Fine.

For manual:
```
var dvx = fwd.x*inputF + right.x*inputS;
var dvy = inputU; // vertical directly
var dvz = fwd.z*inputF + right.z*inputS;
// integrate velocity with smoothing
var k = 1 - Math.exp(-6*dt);
vx += (dvx - vx)*k; ...
vy = dvy; // direct vertical for responsiveness
pos += vel*dt;
clamp y
```

Mouse look: always (works frozen). Adjust yaw/pitch.

Let me finalize camera update order:
```
function updateCamera(dt){
  // mouse look already applied incrementally in mousemove (smoothed here)
  // compute inputs
  if (autopilot && !frozen) {
     // as above
  } else {
     var m = !frozen;
     var f = m? ((keys.W?1:0)-(keys.S?1:0)) : 0;
     var s = m? ((keys.A?1:0)-(keys.D?1:0)) : 0;
     var u = m? ((keys.E?1:0)-(keys.Q?1:0)) : 0;
     var sp = MANUAL_SPEED;
     var dvx = (fwd.x*f + right.x*s)*sp;
     var dvz = (fwd.z*f + right.z*s)*sp;
     var k = 1 - Math.exp(-7*dt);
     vx += (dvx-vx)*k; vy = u*MANUAL_SPEED; vz += (dvz-vz)*k;
     cam.x += vx*dt; cam.y += vy*dt; cam.z += vz*dt;
     // clamp
     var minY = Math.max(terrainHeightAt(cam.x,cam.z), 0) + MARGIN;
     if (cam.y < minY) cam.y = minY;
  }
}
```

For manual speed, ~80 m/s. Autopilot ~70.

Mouse look smoothing: I'll apply yaw/pitch directly in mousemove (no smoothing needed, but let me add slight smoothing). Actually direct is fine and responsive. But continuous drag → set yaw directly to target based on accumulated dx. Let me accumulate:
```
on pointerdown: dragging=true; 
on pointermove (if dragging): yaw -= dx*sens; pitch += dy*sens; clamp pitch.
```
Wait sign conventions: I want dragging mouse right (dx>0) to turn camera right. Turning right means yaw increases? Let me define yaw increase = turn right (toward +x). forward=(sin yaw,...). At yaw slightly positive, forward.x positive → moving toward +x, looking right. Dragging mouse right should look right → yaw increases. So yaw += dx*sens. Let me set yaw += dx*sens, pitch += dy*sens? Dragging down (dy>0) should look down (pitch negative). So pitch -= dy*sens. Let me set:
```
yaw += dx*sens;
pitch -= dy*sens;
pitch = clamp(pitch, -1.4, 1.4);
```
Positive pitch looks up (drag up, dy<0 → pitch +=). Good.

sens ~ 0.0025.

Now let me handle pointer capture: on canvas mousedown start, move on window, mouseup/end stop.

### stats

triCount accumulates over chunks + water + sky sphere tris. I'll store totalTri and update each frame = current drawn tris. chunks = number of chunk objects.

Sky sphere tris: SKY_U*SKY_V*2. Water tris. Add.

Let me expose stats returning {chunks: chunkMap.size, triangles: currentTriangles}.

### Now let me write the shaders and GL code.

Let me write the vertex shader for terrain/water:
```glsl
attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec3 aColor;
uniform mat4 uProj;
uniform mat4 uView;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vColor;
void main(){
  vWorld = aPos;
  vNormal = aNormal;
  vColor = aColor;
  gl_Position = uProj * uView * vec4(aPos,1.0);
}
```

Terrain fragment:
```glsl
precision highp float;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vColor;
uniform vec3 uCamPos;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform vec3 uAmbient;
uniform vec3 uFogColor;
uniform float uFogDensity;
void main(){
  vec3 N = normalize(vNormal);
  float diff = max(dot(N, normalize(uSunDir)), 0.0);
  vec3 col = vColor * (uAmbient + uSunColor * diff * uSunIntensity);
  vec3 viewDir = normalize(uCamPos - vWorld);
  float dist = length(uCamPos - vWorld);
  float fog = 1.0 - exp(-dist * uFogDensity);
  col = mix(col, uFogColor, clamp(fog,0.0,1.0));
  gl_FragColor = vec4(col,1.0);
}
```

Water vertex: same as terrain but attribute aPos only (I'll reuse aPos/aNormal? water has no per-vertex color). Let me make a separate water shader with aPos only.

Water fragment:
```glsl
precision highp float;
varying vec3 vWorld;
uniform vec3 uCamPos;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform vec3 uWaterDeep;
uniform vec3 uSkyHorizon;
uniform float uTime;
uniform vec3 uFogColor;
uniform float uFogDensity;

vec3 waveNormal(vec3 p, float t){
  vec3 n = vec3(0.0,1.0,0.0);
  float dx=0.0, dz=0.0;
  float a;
  a = 0.12; dx += cos(p.x*0.06 + t*1.3)*0.06*0.12; dz += -sin(p.z*0.05 + t*1.1)*0.05*0.12; 
  // wave 1
  ...
}
```
Let me do a couple waves cleanly:
```glsl
vec3 waveNormal(vec3 p, float t){
  vec3 n = vec3(0.0,1.0,0.0);
  float h = 0.0;
  // wave set
  h += 0.10*sin(p.x*0.07 + t*1.4);
  h += 0.06*sin(p.z*0.09 - t*1.1);
  h += 0.03*sin((p.x+p.z)*0.13 + t*2.0);
  // derivatives for normal
  float nx = 0.10*0.07*cos(p.x*0.07 + t*1.4) + 0.03*0.13*cos((p.x+p.z)*0.13 + t*2.0);
  float nz = 0.06*0.09*(-sin(...)) ...
}
```
This is getting messy. Let me define a wave height function and derive normal via central differences in shader:
```glsl
float waveHeight(vec3 p, float t){
  float h = 0.0;
  h += 0.10*sin(p.x*0.070 + t*1.4);
  h += 0.06*sin(p.z*0.090 - t*1.1);
  h += 0.04*sin((p.x*0.5+p.z*0.5)*0.13 + t*2.1);
  return h;
}
```
normal = normalize(vec3(-(wave(p+ex)-wave(p-ex))/(2ex), 1, -(wave(p+ez)-wave(p-ez))/(2ez))) with ex=ez=2.0.

Then fresnel, specular.

Water color:
```glsl
void main(){
  vec3 viewDir = normalize(uCamPos - vWorld);
  float ex=2.0;
  vec3 N = normalize(vec3(
    -(waveHeight(vWorld.x+ex,vWorld.z,uTime)-waveHeight(vWorld.x-ex,vWorld.z,uTime))/(2.0*ex),
    1.0,
    -(waveHeight(vWorld.x,vWorld.z+ex,uTime)-waveHeight(vWorld.x,vWorld.z-ex,uTime))/(2.0*ex)
  ));
  float fres = pow(1.0 - max(dot(viewDir, N), 0.0), 4.0);
  fres = clamp(fres,0.0,1.0);
  vec3 col = mix(uWaterDeep, uSkyHorizon, fres);
  // sun specular
  vec3 L = normalize(uSunDir);
  float spec = pow(max(dot(viewDir, normalize(L+viewDir)),0.0), 60.0);
  col += uSunColor * spec * uSunIntensity * 0.8;
  // fog
  float dist = length(uCamPos - vWorld);
  float fog = 1.0 - exp(-dist*uFogDensity);
  col = mix(col, uFogColor, clamp(fog,0.0,1.0));
  gl_FragColor = vec4(col, 1.0);
}
```

Sky shader:
```glsl
precision highp float;
varying vec3 vNormal; // direction
uniform vec3 uSkyZenith;
uniform vec3 uSkyHorizon;
uniform vec3 uSunColor;
uniform vec3 uFogColor;
uniform vec3 uSunDir;
uniform float uTime;
uniform float uNight;

// hash/fbm...
void main(){
  vec3 dir = normalize(vNormal);
  float elev = dir.y;
  vec3 sky = mix(uSkyHorizon, uSkyZenith, clamp(elev,0.0,1.0));
  // sun
  float sun = pow(clamp(dot(dir, uSunDir),0.0,1.0), 1200.0);
  float glow = pow(clamp(dot(dir, uSunDir),0.0,1.0), 8.0);
  sky += uSunColor * (sun*4.0 + glow*0.5);
  // stars
  float night = clamp(uNight,0.0,1.0);
  vec2 cell = floor(dir.xz/(0.02*max(dir.y,0.05)+0.001));
  float st = hash21(cell);
  float star = step(0.985, st) * night * clamp(dir.y,0.0,1.0);
  sky += vec3(star);
  // clouds
  float cl = cloudCover(dir, uTime);
  float light = 0.3 + 0.7*max(dot(dir, uSunDir),0.0);
  vec3 cloud = uSkyZenith*0.5 + uSunColor*0.3*... ;
  sky = mix(sky, cloud*light, cl * (0.3+0.6*max(elev+0.2,0.0)));
  gl_FragColor = vec4(sky,1.0);
}
```
Clouds only above some elevation and blended. Let me make cloudCover = fbm scaled, threshold.

Let me write cloudCover:
```glsl
float cloudCover(vec3 dir, float t){
  vec2 uv = dir.xz / (abs(dir.y)+0.3);
  float n = fbm2(uv*1.5 + vec2(t*0.02, t*0.015));
  return smoothstep(0.55, 0.85, n);
}
```

OK. Let me put fbm2 and hash21 in the sky shader (and not needed elsewhere). I'll include them in the sky shader source directly.

Now the JS passes uniforms. Let me compute sky colors in JS based on time and pass as uniforms.

JS computeSkyColors(time):
```
var sunElev = sin(sunAngle) where sunAngle = (time/24)*2π - π/2.
Actually sunDir.y = sin(a). 
var day = smoothstep(-0.08, 0.25, elev);
var sunset = exp(-(elev+0.08)^2 / something) near horizon day;
```
Let me compute:
```
var day = smoothstep(-0.08, 0.22, elev); // 0..1
// horizon color: blue daytime, orange at sunset
var sunsetFactor = exp(-(elev)*elev*30.0) * day; // peaks near horizon during day
var zenithDay = vec3(0.20,0.42,0.82);
var horizonDay = vec3(0.55,0.72,0.92);
var sunsetZenith = vec3(0.18,0.22,0.5);
var sunsetHorizon = vec3(0.95,0.45,0.25);
var zenithNight = vec3(0.01,0.02,0.06);
var horizonNight = vec3(0.03,0.05,0.12);
var zenith = mix(zenithNight, zenithDay, day);
var horizon = mix(horizonNight, horizonDay, day);
// apply sunset tint near horizon
zenith = mix(zenith, sunsetZenith, sunsetFactor*0.7);
horizon = mix(horizon, sunsetHorizon, sunsetFactor);
// night darkening
```
Sun color:
```
var sunColor = mix(vec3(1.0,0.6,0.35), vec3(1.0,0.95,0.85), day); // warm→white
// at sunset more orange
sunColor = mix(sunColor, vec3(1.0,0.4,0.2), sunsetFactor);
```
Sun intensity:
```
var sunIntensity = clamp(elev,0,1) * 1.2 + day*0.1; // only above horizon bright
```
Ambient (sky light fill):
```
var ambient = mix(vec3(0.08,0.10,0.16), vec3(0.35,0.4,0.5), day); // night dark blue → day blueish
ambient += sunsetColor* sunsetFactor*0.3;
```
Fog color ≈ horizon color (slightly lighter):
```
var fogColor = horizon * (0.9 + 0.3*sunsetFactor); // hmm
```
Let me set fogColor = mix(horizon, sun-adjacent...). Simpler: fogColor = horizon blended slightly toward sun. Just use horizon.

Night: uNight = 1 - day. Moonlight: a subtle. I'll fold night into ambient.

Let me also make sure "clearly dark night": night ambient ~0.08, sky near black. Good.

Now pass these uniforms each frame.

### Let me also handle the "freeze" default animation.

Actually I already covered.

Let me now also double check the water rendering over the plane covering [-1800,1800] with terrain. Water opaque. Over land (terrain>0) water plane at y=0 is behind terrain (depth). Fine. Over ocean, water surface visible. Good.

But wait: water is rendered after terrain with depthWrite on. So water at y=0 over ocean will also be written to depth. Then if terrain behind it... no, terrain at ocean is below y=0, behind water. Fine.

One concern: water plane at y=0 also extends over areas where terrain is above 0 (land). Those water fragments at y=0 have depth = their distance. The land at that (x,z) is at y>0, closer to a downward-looking camera. Land drawn first (terrain pass) wrote depth at y>0 position. Water at y=0 is farther → depth fails → not drawn. Good, land shows. At shoreline where terrain ≈ 0, water at y=0 and land at y≈0 nearly same depth → possible z-fighting. Acceptable, shoreline blending color hides minor issues.

### Clouds in sky only visible above horizon, good.

### Let me consider the autopilot starting y.

At spawn, compute terrainHeightAt(0,0), set cam.y = that + ALT (ALT 90). Ensure not below water: max(that,0)+margin.

### Let me set constants:
SCALE = 0.0016 (world units * scale = noise units). Terrain features: wavelength = 1/SCALE ≈ 625 units for lowest octave. With lacunarity 2 and 6 octaves, detail down to ~10 units. Good.

Let me set:
- CHUNK = 320
- SEG base per LOD
- viewDist = 1600
- radius = ceil(viewDist/CHUNK) = 5 → chunks (2*5+1)^2 = 121.
- Actually let me include a couple extra for safety: renderRadius = radius+1 = 6 → 13x13=169. But LOD coarse for far. Fine.

Let me set CHUNK = 300, viewDist = 1500, radius = ceil(1500/300)=5, renderRadius = 5 → 11x11 = 121 chunks.

Let me finalize CHUNK=300.

### Terrain sampling per chunk:

```
function buildChunk(cx, cz){
  var x0 = cx*CHUNK, z0 = cz*CHUNK;
  var dx = cx*CHUNK - cam.x, dz = cz*CHUNK - cam.z;
  var dist = Math.hypot(dx,dz)/CHUNK;
  var seg = segFor(dist);
  var N = seg+1;
  var data = new Float32Array(N*N*9); // x,y,z,nx,ny,nz,r,g,b
  var idx = [];
  var vi=0;
  for (var i=0;i<N;i++){
    for (var j=0;j<N;j++){
      var x = x0 + j/seg*CHUNK;
      var z = z0 + i/seg*CHUNK;
      var y = terrainHeightAt(x,z);
      var n = computeNormal(x,z);
      var c = materialColor(y, slopeOf(n));
      data[vi++]=x; data[vi++]=y; data[vi++]=z;
      data[vi++]=n[0]; data[vi++]=n[1]; data[vi++]=n[2];
      data[vi++]=c[0]; data[vi++]=c[1]; data[vi++]=c[2];
    }
  }
  for (var i=0;i<seg;i++){
    for (var j=0;j<seg;j++){
      var a = i*N+j, b=i*N+j+1, c=(i+1)*N+j, d=(i+1)*N+j+1;
      idx.push(a,c,b, b,c,d);
    }
  }
  // upload to gl buffers
}
```

I'll create one VBO and one IBO per chunk (dynamic). Use gl.createBuffer, gl.bufferData.

computeNormal via finite diff:
```
function computeNormal(x,z){
  var e = 1.5;
  var hL = terrainHeightAt(x-e,z), hR = terrainHeightAt(x+e,z);
  var hD = terrainHeightAt(x,z-e), hU = terrainHeightAt(x,z+e);
  // gradient
  var nx = (hL - hR)/(2*e);
  var nz = (hD - hU)/(2*e);
  var ny = 1.0;
  return vnorm([nx,ny,nz]);
}
```
slope = acos(clamp(ny,-1,1)) in degrees.

materialColor:
```
function materialColor(y, slopeDeg){
  var sand=[0.80,0.73,0.53];
  var grass=[0.30,0.50,0.20];
  var dirt=[0.42,0.36,0.26];
  var rock=[0.46,0.44,0.40];
  var snow=[0.93,0.95,0.98];
  var c;
  if (y <= 1.0) c = sand;
  else if (y < 150) c = mix(sand, grass, smoothstep(1.0, 20.0, y));
  else c = grass;
  // high -> rock then snow
  if (y >= 150){
    c = mix(c, rock, smoothstep(150.0, 260.0, y));
  }
  // slope -> rock
  if (y > 2.0 && slopeDeg > 32){
    var rs = smoothstep(32.0, 55.0, slopeDeg);
    c = mix(c, rock, rs);
  }
  // snow
  if (y > 300){
    var ss = smoothstep(300.0, 380.0, y);
    c = mix(c, snow, ss);
  }
  // also snow on steep high
  return c;
}
```
Good enough.

### Water mesh

```
var waterCell = null;
function buildWater(){
  var D = 1850;
  var N = 74; // 73 seg
  var data = new Float32Array(N*N*6); // x,y,z,nx,ny (skip color, water shader no color)... actually let me just aPos
  // I'll use aPos only
  ...
  coverage: cam cell = floor(cam.x/D), floor(cam.z/D)
}
```
Let me rebuild water when floor(cam.x/D)!=waterCell.x. Cover [-D,D] around camera? Let me center water on camera: from cam.x-D to cam.x+D, same z. So:
```
var cellX = Math.floor(cam.x/D), cellZ = Math.floor(cam.z/D);
if (waterCellX!==cellX || waterCellZ!==cellZ || !waterMesh){ buildWater(); }
```
buildWater spans [cam.x-D, cam.x+D]. Rebuild rarely.

wave height ~0.3 max, negligible vs terrain. Fine.

### Sky sphere

Generate once: 
```
SKY_U=48, SKY_V=24.
vertices: for i.., for j..: phi, theta → point on unit sphere.
```
Render with model = translate(cam). Actually since vertex shader uses aNormal as world direction, and I set gl_Position = uProj*uView*vec4(normal*SKY_RADIUS + camPos, 1). So in vertex shader: gl_Position = uProj*uView*vec4(aNormal*SKY_RADIUS + uCamPos, 1). And vNormal = aNormal (direction). Let me pass uCamPos. Good. No need for per-vertex position, just normal (=direction).

Sky vertex shader:
```
attribute vec3 aDir;
uniform mat4 uProj;
uniform mat4 uView;
uniform vec3 uCamPos;
uniform float uRadius;
varying vec3 vDir;
void main(){
  vDir = aDir;
  gl_Position = uProj*uView*vec4(aDir*uRadius + uCamPos, 1.0);
}
```

Good.

### Draw order & GL state

```
gl.enable(DEPTH_TEST);
// sky
gl.depthMask(false);
use skyProg; set uniforms; draw sky sphere;
gl.depthMask(true);
// terrain
use terrainProg; set uniforms; for each chunk drawElements;
// water
use waterProg; for water: drawElements;
```
No blending needed since opaque. Good. Set depthFunc LEQUAL maybe. Default fine.

Actually sky depthMask false then terrain depthMask true. But terrain fragments write depth and overwrite sky. Good. Water writes depth. Fine.

But there's a subtlety: sky drawn first with depthMask false — its fragments test depth (nothing there initially, all pass since no depth written) and are placed at far distance. Since depthMask false, they don't write depth. Then terrain overwrites where closer. But sky at horizon where no terrain: sky stays. But sky is at radius 3000; depth of sky ≈ 3000. Terrain beyond view not drawn. So at pixels with no terrain, depth buffer empty → sky passes. Good.

Wait, initial depth buffer value = far (1.0 in NDC after depth test, max depth). With near/far, unbuffered depth = 1.0 (farthest). Sky at 3000 < far 5000 → depth < 1.0 → passes over initial. Good.

### Let me now also make sure the camera forward/up for view matrix use consistent.

view = lookAt(camPos, camPos+fwd, up=(0,1,0)). Standard.

### FPS

```
var frameCount=0, fpsTime=0, fps=0;
each frame: frameCount++; if (now-fpsTime>500){ fps=Math.round(frameCount*1000/(now-fpsTime)); frameCount=0; fpsTime=now; update #fps }
```

### Let me write it all now.

Let me also handle the seed input change and time input.

```
seedInput.addEventListener('change', function(){ var n = parseInt(this.value,10)||0; __arena.setSeed(n); });
timeInput.addEventListener('input', function(){ var h = parseFloat(this.value); __arena.setTime(h); });
```
Also F toggles autopilot:
```
document.addEventListener('keydown', function(e){
  if (e.key==='f'||e.key==='F'){ autopilot=!autopilot; updateBadge(); }
});
```
But keydown also for WASD etc. I'll track key state in keydown/keyup:
```
document.addEventListener('keydown', function(e){
  var k=e.key.toLowerCase();
  keys[k]=true;
  if (k==='f'){ autopilot=!autopilot; updateBadge(); }
  if ([' ','arrowup','arrowdown','arrowleft','arrowright'].indexOf(k)>=0) e.preventDefault();
});
document.addEventListener('keyup', function(e){ keys[e.key.toLowerCase()]=false; });
```
Note: keys 'w','a','s','d','q','e'. Use key.toLowerCase(). For Space, e.key===' '. Good.

But careful: when seed/time inputs focused, typing letters there would also set keys (since window listener). That could cause unexpected movement while typing in inputs. Minor. To avoid, check document.activeElement is an input/textarea and skip key handling. Let me do:
```
if (e.target && (e.target.tagName==='INPUT')) return; // let input handle
```
Actually I still want to preventDefault for arrows etc. But movement from typing in a number input is undesirable. Let me skip movement key processing if focused on input. I'll check `document.activeElement === timeInput || activeElement === seedInput`. Then handle F/scroll only.

Let me implement: in keydown, if activeElement is one of our inputs, skip setting keys but still preventDefault for arrows.

### Mouse

```
canvas.addEventListener('mousedown', function(e){ dragging=true; lastX=e.clientX; lastY=e.clientY; });
window.addEventListener('mouseup', function(){ dragging=false; });
window.addEventListener('mousemove', function(e){ if(!dragging) return; var dx=e.clientX-lastX, dy=e.clientY-lastY; lastX=e.clientX; lastY=e.clientY; yaw += dx*0.0025; pitch -= dy*0.0025; pitch=clamp(pitch,-1.45,1.45); });
```
Use window listeners so drag works even if pointer leaves canvas.

Also mouse could set look via wheel for FOV? Optional. Skip.

### Let me handle DPR & resize.

```
function resize(){
  var dpr = Math.min(window.devicePixelRatio||1, 2);
  var w = window.innerWidth, h = window.innerHeight;
  var pw = Math.max(1, Math.floor(w*dpr)), ph = Math.max(1, Math.floor(h*dpr));
  if (canvas.width!==pw || canvas.height!==ph){ canvas.width=pw; canvas.height=ph; canvas.style.width=w+'px'; canvas.style.height=h+'px'; gl.viewport(0,0,pw,ph); aspect=pw/ph; proj=perspective(fov*DEG2RAD, aspect, NEAR, FAR); }
}
window.addEventListener('resize', resize);
```
fov ~ 70 deg.

aspect = pw/ph.

### Let me write perspective with aspect.

### Now uniforms per frame:

```
setTime uniforms (sky, terrain, water) computed once per frame from timeOfDay.
```
Compute skyColors = computeSkyColors(timeOfDay). Then set uniforms for each program.

### Let me now also ensure terrainHeightAt matches what's rendered (it does, same function).

But the grader's terrainHeight should equal actual rendered surface ignoring water. The rendered surface y for a chunk vertex at (x,z) is terrainHeightAt(x,z). But note the mesh samples at grid points; the actual "surface" at arbitrary (x,z) is the noise function. terrainHeight(x,z) returns noise at (x,z). Good, matches.

But wait — the camera clamp uses terrainHeightAt at camera x,z. And the grader might call terrainHeight(camera.x, camera.z) and expect getCamera().y >= that + margin. Since I clamp y to max(terrainHeightAt,0)+margin, and terrainHeight returns same, satisfied.

### Potential issue: terrainHeightAt uses seedOffset which changes on setSeed. Grader calls setSeed then terrainHeight — consistent. Good.

### Let me now write the code fully.

Let me be mindful of GLSL float precision attribute. Use `attribute vec3 aPos;` etc.

Let me write compile functions:
```
function compile(type, src){
  var s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    var log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error('Shader compile: '+log);
  }
  return s;
}
function link(vs, fs){
  var p = gl.createProgram();
  gl.attachShader(p, vs); gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Link: '+gl.getProgramInfoLog(p));
  return p;
}
```
These throw if error → would break app and console shows error. Since I write correct GLSL, should be fine. But to be safe against console errors, maybe I shouldn't throw to console. But if there's an error, the app is broken regardless. I'll leave it; correctness first. Actually to avoid uncaught throwing the page, but it's fine.

Hmm, "No errors in the console" is a hard requirement. If a shader fails to compile, console shows error and I fail. So I must ensure shaders compile. I'll double-check GLSL.

Let me write GLSL carefully.

Let me now assemble the full file and review.

One more: I need to make sure the water plane covers areas so that when looking down at ocean we see water. Water spans [cam.x±D, cam.z±D] with D=1850 > viewDist 1500. But water is at y=0; frustum culling by clip coords handles visibility. Since I don't do manual frustum culling, GPU clips. Fine.

But the water plane is a horizontal plane; from camera height ~100-300 looking down, we see the plane. Good. From below? camera never below water/terrain, so always above or at water. Good.

Also, water plane at y=0 — when camera is high and looking forward horizontally, the plane is far below, might be outside frustum → not rendered there, showing sky/terrain instead. That's fine (horizon). Near us we look down enough to see water over ocean.

Actually with autopilot at altitude ~ terrain+90, and looking forward (pitch ~0 or slightly down), we'll see terrain ahead and water over oceans. Good. Let me make autopilot pitch slightly down (e.g., pitch -0.08) so we look ahead/down at terrain. Nice for flyover.

Let me set cam.pitch initial ~ -0.1 and autopilot maintains slight down.

### Let me also add a subtle ambient occlusion / fog at terminator for beauty. Skip, keep simpler.

### Let me write computeSkyColors returning all needed uniforms.

```js
function smoothstep(a,b,x){ var t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); }
function lerp3(a,b,t){ return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }

function skyUniforms(time){
  var a = (time/24)*Math.PI*2 - Math.PI/2;
  var sunDir = [Math.cos(a), Math.sin(a), 0];
  var elev = sunDir[1];
  var day = smoothstep(-0.08, 0.22, elev);
  var sunset = Math.exp(-(elev*elev)*40.0) * (elev>-0.15?1:0); // near horizon
  // actually sunset when sun low but above ~ -0.1
  var sunsetF = elev > -0.12 ? Math.exp(-(elev+0.02)*(elev+0.02)*60.0) : 0;
  sunsetF = Math.min(1, sunsetF);
  
  var zenithDay=[0.18,0.40,0.82], horizonDay=[0.58,0.74,0.94];
  var zenithSun=[0.24,0.26,0.55], horizonSun=[0.98,0.46,0.26];
  var zenithNight=[0.010,0.016,0.055], horizonNight=[0.035,0.055,0.12];
  
  var zenith = lerp3(zenithNight, zenithDay, day);
  var horizon = lerp3(horizonNight, horizonDay, day);
  zenith = lerp3(zenith, zenithSun, sunsetF*0.75);
  horizon = lerp3(horizon, horizonSun, sunsetF);
  
  var sunColor = lerp3([1.0,0.55,0.30], [1.0,0.95,0.85], day);
  sunColor = lerp3(sunColor, [1.0,0.42,0.18], sunsetF);
  var sunIntensity = (elev>0?elev:0)*1.25 + day*0.08;
  
  var ambient = lerp3([0.06,0.08,0.15], [0.30,0.37,0.48], day);
  ambient = lerp3(ambient, [0.25,0.16,0.12], sunsetF*0.6);
  
  var fogColor = horizon; // blend
  // fog a touch brighter
  fogColor = [fogColor[0]*1.05, fogColor[1]*1.05, fogColor[2]*1.05];
  
  var night = 1 - day;
  return {sunDir, sunColor, sunIntensity, zenith, horizon, ambient, fogColor, night};
}
```

For night, stars come from sky shader based on uNight. Good.

### Water uniforms: waterDeep color. Let me pick deep water [0.03,0.12,0.18], shallow near shore blend via fresnel to horizon. I'll pass uWaterDeep.

Add subsurface: mix in sun color a bit. Keep.

### Let me finalize and write.

Let me also ensure I upload water and sky buffers.

Sky: create once, VBO with aDir (unit sphere normals), IBO.
Water: create on cell change.

Let me write buildSkySphere():
```
function buildSky(){
  var u=SKY_U, v=SKY_V, n=u*v;
  var data=new Float32Array(n*3), idx=[];
  for(var j=0;j<v;j++){ for(var i=0;i<u;i++){
    var fi=i/u*2π, fj=(j+0.5)/v*π; // theta, phi from top
    var sp=Math.sin(fj), ct=Math.cos(fj); // ct = y
    var x=Math.cos(fi)*sp, z=Math.sin(fi)*sp, y=ct;
    var k=(j*u+i)*3;
    data[k]=x;data[k+1]=y;data[k+2]=z;
  }}
  for(var j=0;j<v-1;j++){ for(var i=0;i<u;i++){
    var a=j*u+i, b=j*u+i+1, c=(j+1)*u+i, d=(j+1)*u+i+1;
    idx.push(a,b,d, a,d,c);
  }}
  // upload
}
```

Good.

### Now, potential perf: 121 chunks * drawElements. Each drawElements is a call. Fine.

Let me also cap by frustum? Skip.

### Let me write the main loop:

```
function frame(now){
  requestAnimationFrame(frame);
  var dt = Math.min(0.05, (now - last)/1000 || 0); last=now;
  // update
  if (!frozen){
    timeOfDay += dt*(24/120); if(timeOfDay>=24) timeOfDay-=24;
    animTime += dt;
  }
  updateCamera(dt);
  updateChunks();
  // render
  render();
  // fps
}
```

updateChunks manages the chunk map.

```
var chunks = new Map(); // key -> {ibo,vbo,tri,seg}
function key(cx,cz){ return cx+','+cz; }
function updateChunks(){
  var rc = renderRadius;
  var cx0=Math.round(cam.x/CHUNK), cz0=Math.round(cam.z/CHUNK);
  // load needed
  for(var dz=-rc;dz<=rc;dz++){ for(var dx=-rc;dx<=rc;dx++){
    var cx=cx0+dx, cz=cz0+dz;
    // skip corners beyond circle for perf
    if (dx*dx+dz*dz > (rc+0.5)*(rc+0.5)) continue;
    var k=key(cx,cz);
    if(!chunks.has(k)){ 
      var mesh = buildChunkData(cx,cz);
      // create gl buffers
      var vbo=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,vbo); gl.bufferData(gl.ARRAY_BUFFER, mesh.data, gl.DYNAMIC_DRAW);
      var ibo=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.idx), gl.DYNAMIC_DRAW);
      chunks.set(k,{vbo,ibo,tri:mesh.idx.length/3});
    }
  }}
  // unload far
  for(var it of chunks.keys()){
    var p=it.split(','); var cx=+p[0],cz=+p[1];
    if (Math.abs(cx-cx0)>rc+1 || Math.abs(cz-cz0)>rc+1){
      var ch=chunks.get(it); gl.deleteBuffer(ch.vbo); gl.deleteBuffer(ch.ibo); chunks.delete(it);
    }
  }
}
```

renderRadius ~ 5.6 (so we cover 1500). rc loop with circle culling.

chunk tri accumulation:
```
var currentChunks = chunks.size;
var currentTri = 0;
for(var it of chunks.values()) currentTri += it.tri;
currentTri += waterTri + skyTri;
```
Set stats.

Let me accumulate during render loop instead:
```
currentTri = skyTri + waterTri;
for (each chunk) { draw; currentTri += mesh.tri; }
```

Let me just compute in render.

### Let me finalize buildChunkData returning {data, idx}.

I'll build into typed arrays. idx as Uint16Array if N*N < 65536 → N up to ~256 → for seg 40, N=41, N*N=1681 < 65536, fine. Uint16 OK.

### Let me write it.

Let me also add a subtle ground fog or horizon glow? Skip.

Let me consider water shoreline blending: where terrain near 0, water meets sand. The terrain color near water is sand; water is blue. The transition is a line. Fine.

### Let me write the final HTML.

I'll now also double-check the GLSL fbm for clouds compiles (integer loop). WebGL1 allows constant loop with #define or literal. Use `for(int i=0;i<5;i++)`. Good.

Let me write the sky shader with fbm2 and hash21.

Let me also include a `smoothstep` in JS — not needed for JS, it's a function.

Let me write everything now. I'll produce the full file.

Let me reconsider the `sunset` variable unused — remove.

Also ensure no leftover `sunset`.

Let me also make sure the water uses uTime for animation and frozen stops it (animTime frozen). Good.

Also the autopilot: set initial cam.pitch slightly down and autopilot doesn't change pitch (keeps looking forward-down). Good.

Also, when autopilot off and no input, camera stays still — my code: if not autopilot, and frozen? no. If not frozen and no keys, inputF=S=U=0 → dvx=dvz=0, velocity damps to 0, vy=0. So stays still. Good. But velocity damping: vx += (0-vx)*k → decays. Good, comes to rest.

When frozen and autopilot off and no input: frozen → manual false → inputs 0 → no movement. Good (nothing changes on its own).

When frozen and user presses W: manual = !frozen = false → I set inputs 0?? That's wrong! "User keyboard/mouse input still works when frozen." So when frozen, manual input should still work. Let me fix: manual input works when frozen too. Only autopilot auto-movement and time/animation are frozen.

So:
```
if (autopilot && !frozen){
  // autopilot auto-flight
} else {
  // manual: keys work always (frozen or not)
  var f = (W?1:0)-(S?1:0);
  var s = (A?1:0)-(D?1:0);
  var u = (E?1:0)-(Q?1:0);
  ...
}
```
Manual works when frozen. Autopilot auto only when !frozen. Good. Let me implement that.

But when frozen and autopilot is ON (initial state), autopilot won't move (frozen). User can then move manually (keys work). But autopilot branch checks `autopilot && !frozen` → false when frozen → goes to else (manual). So user input works. But autopilot flag still true; when unfrozen, autopilot resumes. That's acceptable: freezing halts autopilot, user takes control, unfrozen resumes autopilot. Reasonable.

Hmm, but maybe better: when frozen, keep autopilot on but not moving. The user's manual movement overrides. When unfrozen, autopilot resumes. Fine.

Let me implement.

### Let me also make sure getCamera returns yaw/pitch and corrected y.

### Let me also handle setCamera clamping: if requested y below min, push up and return corrected.

```
setCamera(c){
  cam.x = c.x; cam.y=c.y; cam.z=c.z; 
  if (c.yaw!==undefined) cam.yaw=c.yaw;
  if (c.pitch!==undefined) cam.pitch=c.pitch;
  var minY = Math.max(terrainHeightAt(cam.x,cam.z),0)+MARGIN;
  if (cam.y<minY) cam.y=minY;
}
```

### getCamera:
```
getCamera(){ return {x:cam.x,y:cam.y,z:cam.z,yaw:cam.yaw,pitch:cam.pitch}; }
```

### terrainHeight:
```
terrainHeight(x,z){ return terrainHeightAt(x,z); }
```

### freeze:
```
freeze(on){ frozen = on; }
```

### setSeed:
```
setSeed(n){ seed=parseInt(n,10)||0; applySeed(seed); rebuildChunks(); seedInput.value=seed; }
```
applySeed sets seedOffsetX/Z. rebuildChunks: clear map, force rebuild. Or just rebuild needed on next frame (updateChunks will create since map cleared). Let me clear map.

### setTime:
```
setTime(h){ timeOfDay=((h%24)+24)%24; timeInput.value=timeOfDay; }
```

### Let me set seedInput/timeInput references.

Now write final.

Let me also make sure to call resize() once at start and set proj.

Let me write the entire thing.

Let me reconsider SKY radius vs far. SKY_RADIUS=3000, FAR=5000. Near=1. Terrain view ~1500-1900. Fog fades by ~1400. Beyond that we see sky dome at 3000. Good. But between 1900 and 3000 there's nothing but sky — fine.

But wait, the water plane extends to D=1850 and is at y=0. Beyond that (1850-3000) we see... terrain not drawn (chunks radius ~1700), water not drawn (>1850). So we see sky dome at 3000 for those pixels. Good — horizon shows sky. But is that a "seam"? At 1850 water ends, beyond is sky at 3000. The sky dome there is at distance 3000 in the direction we look. It's just sky. Fine, no seam (it's all sky).

Hmm, but actually for a realistic horizon, terrain fades into sky color via fog before ending, and then pure sky. That's fine.

Let me reduce FAR to 4000 to improve depth precision. SKY_RADIUS 3000 < 4000. Good. Set FAR=4000. Actually keep margin: FAR = SKY_RADIUS*1.4 ≈ 4200. Let me set FAR=4200.

Near=1.0.

Depth precision with near=1, far=4200: ratio 4200. Some precision loss but terrain is fogged so far precision less critical. Acceptable.

### Let me also double-check the sky dome doesn't clip near camera: radius 3000, near 1. The dome is always beyond near. Good. But if camera y is high (e.g., 400) and dome radius 3000, bottom of dome at y=400-3000 = -2600, fine.

### Alright, writing now.

Let me write the GLSL for water without aColor. Water vertex:
```
attribute vec3 aPos;
uniform mat4 uProj; uniform mat4 uView; uniform vec3 uCamPos;
varying vec3 vWorld;
void main(){ vWorld=aPos; gl_Position=uProj*uView*vec4(aPos,1.0);}
```

Terrain vertex has aColor too.

Let me assign attributes by location or use gl.getAttribLocation.

I'll get attrib locations via getAttribLocation and bind.

Let me write helper to set up a program's attribute bindings. Since interleaved, I bind once and enableVertexAttribArray with stride.

Terrain layout: 9 floats: pos(3), normal(3), color(3). stride=9*4.
- aPos at 0
- aNormal at 12
- aColor at 24

Water layout: 6 floats? I only need pos(3). Let me store just pos(3). stride=12. aPos at 0.

Let me build water data as Float32Array of 3 per vert.

### Let me write the render for each program with proper bind.

I'll write:
```
function bindAttr(loc, buf, size, stride, offset){
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
}
```
For ELEMENT_ARRAY_BUFFER I bind separately before drawElements.

For terrain: bind vbo (stride 36), enable aPos,aNormal,aColor. Bind ibo. drawElements.

Let me code.

### Final assembly. Let me write it all.

I realize I should double check: for the sky, I compute vNormal = aDir (unit dir). In fragment I normalize (already unit). Good.

Let me make sure to set gl.clearColor to something (e.g., night black) — sky shader will clear? No, I clear color buffer then render sky first which fills it. Actually clear color sets background; sky fills fully (sky dome covers whole scene since it's the outermost). But terrain occludes parts. Clear color only matters where nothing drawn, but sky covers everything → clear color irrelevant. Still set it.

Let me set clear to horizon-ish.

Let me write now. I'll produce the final file.

Let me reconsider the time speed: full day ~2 min = 120s for 24h → 0.2 h/s. Good.

Let me also make the slider default value 9 (morning) so sun is up. Actually let me default to 8 or 9. Fine.

Let me set initial seed 1.

Let me write.

Also: the requirement says "yaw = 0 looks toward −z; pitch = 0 is level, positive pitch looks up." My forward=(sin yaw cos pitch, sin pitch, -cos yaw cos pitch). yaw=0,pitch=0 → (0,0,-1) ✓. pitch>0 → +y ✓. Good. getCamera returns these. setCamera sets them.

For getCamera after clamp, y corrected. Good.

Let me also ensure that when grader calls setCamera with valid y (above terrain), it's respected. Yes.

### Let me write the file now, final.

I'll include a small vignette? No.

Let me also make the overlay inputs not block canvas clicks: they're position:fixed with z-index, pointer events fine.

Also ensure canvas captures mouse for look even if UI overlaps — UI is in top-left corner, canvas covers whole; mousedown on canvas triggers look. If user clicks UI, that's on the div. Fine.

But "mouse-drag controls work with the page focused, without clicking any UI first." So a mousedown anywhere on canvas (not UI) starts look. Good. I attach mousedown to window (not canvas) so any mousedown starts drag. But clicking UI input shouldn't start camera drag. Let me attach mousedown to window but check target not UI. Or attach to canvas. Let me attach to window and if e.target is in #ui or an input, ignore. Simpler: attach to document, and if activeElement is input or target has id ui, skip dragging. Let me do that.

Actually simpler: attach mousedown to window; in handler, if e.target.closest && e.target.closest('#ui') return. Let me do `if (document.getElementById('ui').contains(e.target)) return;`.

Let me finalize.

Also for keydown while focused on inputs, I skip key movement. Good.

Let me write.

Let me reconsider `keys` object keyed by lowercased key. For space e.key===' '. Arrow keys e.key==='ArrowUp'. I'll handle ' ','arrowup' etc for preventDefault.

Movement keys: 'w','a','s','d','q','e'.

Let me write the keydown:
```
document.addEventListener('keydown', function(e){
  var el=document.activeElement;
  var isInput = el && (el.tagName==='INPUT' || el.tagName==='TEXTAREA');
  var k = e.key.length===1 ? e.key.toLowerCase() : e.key;
  if (isInput){ 
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key)>=0) e.preventDefault();
    return;
  }
  if (k===' '||k==='ArrowUp'||k==='ArrowDown'||k==='ArrowLeft'||k==='ArrowRight') e.preventDefault();
  keys[k]=true;
  if (k==='f' || k==='F'){ autopilot=!autopilot; updateBadge(); }
});
document.addEventListener('keyup', function(e){
  var k = e.key.length===1 ? e.key.toLowerCase() : e.key;
  keys[k]=false;
});
```
Using k = single char lowercased, else full key name. For 'f' single char. Good. For 'F' → 'f'. Good.

updateBadge sets ap span text and class.

Now, note keys object only has movement keys; 'f' toggles then I set keys['f']=true momentarily — but 'f' isn't used for movement so harmless. Actually setting keys['f']=true then keyup sets false. Fine.

### Let me write computeNormal and slopes.

OK writing final file now.

Let me write terrainHeightAt with domain warp:
```
function terrainHeightAt(x,z){
  var nx=(x+seedOffsetX)*SCALE;
  var nz=(z+seedOffsetZ)*SCALE;
  // warp
  var qx = fbm(nx*1.0, nz*1.0, 3, 2.0, 0.5);
  var qy = fbm(nx+7.3, nz+2.1, 3, 2.0, 0.5);
  var wx = nx + qx*1.7;
  var wz = nz + qy*1.7;
  var h = fbm(wx, wz, 6, 2.0, 0.5);
  var rid = 1.0 - Math.abs(fbm(wx+3.1, wz-1.7, 4, 2.0, 0.5));
  var height = h*95 + rid*300 - 30;
  return height;
}
```
Wait rid*300 with rid in [0,1] adds up to 300, h*95 in [-95,95]. Total [-125, 370]-30 = [-155, 340]. Peaks ~340, low -155. Hmm low points below sea floor -50 but that's fine (deep sea). Actually -155 might be too deep but OK. Let me scale down: h*80 + rid*260 - 25 → [-80,80]+[0,260]-25 = [-105, 315]. Let me keep moderate. I'll tune to roughly [-40,400] average. Actually let me not obsess. I'll use:
```
var height = h*80 + rid*280 - 28;
```
Range: h*80 in [-80,80], rid*280 [0,280], -28 → [-108, 332]. Peaks up to ~330. Good enough; mountains ~300, some peaks higher with ridged. Let me push rid weight a bit: rid*320 → up to 340. And add a tall-peak multiplier occasionally via the ridged already. Fine.

Let me also ensure there are high peaks near 400: with rid up to 1 and h up to 1: 80+320-28=372. Close to 400. Good enough ("roughly").

Let me finalize constants: h*85, rid*320, -30. Max 85+320-30=375.

Alright.

fbm octaves count affects perf (computed per vertex, ~2000 vertices per chunk * 121 chunks = 240k vertex samples, each fbm up to 6 octaves + warp 3+3+4=13 noise evals → ~3M noise calls per rebuild, plus rebuilds every cell move). Could be heavy on rebuild but rebuilds are rare. Per-frame we don't rebuild unless cell changes. At 60fps with only occasional rebuild, fine. But terrainHeightAt is also called in updateCamera clamp each frame (2 evals) and computeNormal (4 evals) per vertex during build. Build cost per chunk ~ N*N*(13 noise) ~ 1681*13 = 22k noise for seg40 chunk. Building 121 chunks ~ 2.6M noise evals → maybe 50-100ms once. Fine.

Actually to reduce, let me lower fbm octaves for warp to 3 and main to 5. Fine.

Let me also cache: terrainHeightAt is pure function, no caching needed.

### Let me write fbm:
```
function fbm(x,y,oct,lac,gain){
  var sum=0,amp=1,freq=1,max=0;
  for(var i=0;i<oct;i++){ sum+=amp*noise2D(x*freq,y*freq); max+=amp; amp*=gain; freq*=lac;}
  return sum/max;
}
```

noise2D as Perlin above.

Let me finalize Perlin hash with Math.imul for speed.

Alright, writing final file.

Let me also add a subtle thing: the `time` slider 'input' event sets time; but when not frozen the time also auto-advances and would fight the slider if user is dragging. That's fine (user override). When frozen, no auto-advance so slider stable. Good.

Also when user drags #time, I set timeInput.value in setTime (redundant but fine). Setting value while dragging: the input's own input event already set it; my setTime sets it again to same. Could cause slight jump but negligible. Actually to avoid feedback, in setTime I set value only if different? Minor. I'll set it; it's the same value.

Hmm, but there's a subtle bug: user drags slider → input event → setTime(h) → sets timeInput.value=h (same). No loop. Fine.

Let me write.

Also for seed change: grader sets #seed value then fires change? The contract says "#seed: input type number; a change event regenerates the world." And setSeed updates #seed. So the grader might type into #seed and dispatch 'change'. My listener handles change. Also setSeed (arena) updates #seed.value. Good.

Let me ensure change event fires. The grader will dispatch. I listener on 'change'. Good.

Also I should listen for 'input' on #time (contract says input events). I do.

Let me write the whole file now.

Let me make sure to set canvas.getContext('webgl').

Also handle webgl2? Contract allows either. I'll use 'webgl' (webgl1) for simplicity (I use WebGL1 features). getContext('webgl').

Let me write.

Actually, let me reconsider the water plane normal calc using partials with ex=2.0 — over water waves of wavelength ~ 2π/0.07 ≈ 90 units, ex=2 is fine.

Let me also make water reflect sun and sky nicely.

Let me finalize the water deep color and add a bit of sky horizon in mix.

Now writing.

I'll write the complete HTML. Let me be careful and complete.

Let me write the JS with all functions.

Let me also make sure `requestAnimationFrame` loop starts.

Let me write updateCamera with the correct branch.

Let me now also think: when autopilot active and not frozen, I move forward and adjust y. But I also should not apply manual. And yaw/pitch from mouse still apply (look). Good, mouse look applied separately in mousemove always.

Let me write updateCamera:
```
function updateCamera(dt){
  var cp = fwd();
  var r = rightDir(cp);
  if (autopilot && !frozen){
    var sp = AUTO_SPEED;
    cam.x += cp.x*sp*dt;
    cam.z += cp.z*sp*dt;
    var targetY = Math.max(terrainHeightAt(cam.x,cam.z),0) + AUTO_ALT;
    cam.y += (targetY - cam.y)*(1-Math.exp(-1.6*dt));
    var minY = Math.max(terrainHeightAt(cam.x,cam.z),0)+MARGIN;
    if (cam.y<minY) cam.y=minY;
  } else {
    var f=(keys.w?1:0)-(keys.s?1:0);
    var s=(keys.a?1:0)-(keys.d?1:0);
    var u=(keys.e?1:0)-(keys.q?1:0);
    var dvx=(cp.x*f + r.x*s)*MANUAL_SPEED;
    var dvz=(cp.z*f + r.z*s)*MANUAL_SPEED;
    var k=1-Math.exp(-7*dt);
    vx += (dvx-vx)*k;
    vz += (dvz-vz)*k;
    vy = u*MANUAL_SPEED;
    cam.x += vx*dt;
    cam.y += vy*dt;
    cam.z += vz*dt;
    var minY=Math.max(terrainHeightAt(cam.x,cam.z),0)+MARGIN;
    if (cam.y<minY) cam.y=minY;
  }
}
```
fwd and rightDir recompute each frame (cheap).

rightDir(cp): cross(cp, up) normalized. up=(0,1,0).
cross(cp,up) = [cp.y*0-cp.z*1, cp.z*0-cp.x*0, cp.x*1-cp.y*0] = [-cp.z,0,cp.x]. normalize.

Let me compute inline.

### Let me write it.

Let me define AUTO_SPEED=65, AUTO_ALT=85, MANUAL_SPEED=95, MARGIN=6.

Initial cam.y: compute terrainHeightAt(0,0), set y=max(that,0)+AUTO_ALT+30. Let me just set y=250 and let autopilot adjust.

### Now finalize sky sphere constants SKY_U=40,SKY_V=20.

### Write file.

Let me also ensure the water is drawn with depthTest on (yes) and that it's drawn after terrain.

Also, I want water to possibly be slightly transparent to show depth, but opaque is fine and simpler. Let me keep opaque.

Actually, let me add slight alpha for a glossy water over deep — but opaque is fine. Keep opaque.

Let me write the complete file now.

I need to double-check GLSL for potential issues:
- `precision highp float;` at top of fragment shaders.
- vertex shaders: no precision needed.
- Use of functions before definition: GLSL allows function declarations anywhere. Good.
- fbm loop with int. Good.

Let me write sky shader fully:
```glsl
precision highp float;
varying vec3 vDir;
uniform vec3 uSkyZenith;
uniform vec3 uSkyHorizon;
uniform vec3 uSunColor;
uniform vec3 uSunDir;
uniform float uNight;
uniform float uTime;

float hash21(vec2 p){ p=fract(p*vec2(233.34,851.73)); p+=dot(p,p+23.51); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f); return mix(mix(hash21(i),hash21(i+vec2(1,0)),u.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),u.x),u.y); }
float fbm2(vec2 p){ float a=0.5,s=0.0; for(int i=0;i<5;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5;} return s; }
float cloudCover(vec3 dir, float t){ vec2 uv=dir.xz/(abs(dir.y)+0.25); return smoothstep(0.52,0.88, fbm2(uv*1.4 + vec2(t*0.015, t*0.011))); }

void main(){
  vec3 dir=normalize(vDir);
  float elev=dir.y;
  vec3 sky=mix(uSkyHorizon,uSkyZenith,clamp(elev,0.0,1.0));
  float sd=max(dot(dir,uSunDir),0.0);
  float sun=pow(sd,1500.0);
  float glow=pow(sd,7.0);
  sky+=uSunColor*(sun*5.0+glow*0.45);
  // stars
  float night=clamp(uNight,0.0,1.0);
  vec2 cell=floor(dir.xz/0.015);
  float sh=hash21(cell);
  float star=step(0.986,sh)*night*clamp(elev,0.0,1.0);
  sky+=vec3(star);
  // clouds
  float cl=cloudCover(dir,uTime);
  float clight=0.25+0.85*max(dot(dir,uSunDir),0.0);
  vec3 cloud=uSkyZenith*0.45+uSunColor*0.35;
  cloud=mix(vec3(0.25,0.27,0.33), cloud, clight);
  float mask=smoothstep(-0.05,0.25,elev);
  sky=mix(sky, cloud, cl*mask*0.75);
  gl_FragColor=vec4(sky,1.0);
}
```
Note stars use dir.xz/0.015 — when dir.y near 0 (horizon), cell large but fine. Below horizon elev<0 → star masked by clamp(elev,0). Good.

### terrain fragment and vertex, water — as above.

Let me write it all.

Let me also ensure the water fragment's waveHeight function defined before use.

Let me now write the final complete file. I'll be thorough and not omit.

I'll write it.

Actually, for performance and correctness, let me reconsider triangle counts for stats: skyTri = SKY_U*SKY_V*2, waterTri = WATER_N*WATER_N*2 (or 0 if not built). I'll track.

Let me set WATER_N = 74 (73 seg) → 73*73*2 = 10658 tris. Fine.

Let me finalize.

Also I must ensure that when frozen, the render still updates (loop keeps running via rAF). Yes.

Let me write.

Let me also double check: the grader may call stats() expecting triangles drawn last frame. I compute currentTri during render each frame. Good.

Let me write the file fully now.

I want to make sure the initial render happens before first grader interaction. The loop starts immediately. Good.

Also, I realize I should set gl.clearColor and clear each frame.

Let me write.

One more: the `time` slider default 9.0, and I set timeInput.value in setTime on load? On init I set timeOfDay = 9 and timeInput.value=9. Good.

Let me write init sequence:
```
init GL
create programs
build sky sphere
resize
applySeed(seed)
set initial cam
start loop
```

Let me write.

For applySeed on init: seed=1 → seedOffsetX=173.5, seedOffsetZ=26.9.

Let me set initial cam: cam.x=0, cam.z=0, cam.y = max(terrainHeightAt(0,0),0)+AUTO_ALT+20. yaw=0, pitch=-0.08.

Let me write.

Now, potential issue: terrainHeightAt(0,0) with seed offset 173.5 → noise at large coordinate ~173.5*0.0016=0.277. Fine.

Let me write the complete code.

Let me also handle the case where canvas.getContext fails — but assume success.

Alright, writing final.

Let me write the JS with careful attention.

I'll now produce the full HTML string.

Actually, let me reconsider the fog density. With view distance ~1500 and I want terrain fade to sky by ~1200-1500. fog = 1 - exp(-dist*density). At dist=1500, want fog~0.85 → exp(-1500*d) = 0.15 → -1500d = ln(0.15) = -1.897 → d=0.001265. Let me set fogDensity = 0.0012 * (day-ish? no, constant). Actually fog should blend to sky color regardless of time (sky color changes). Keep density ~0.0013. At horizon (view ~1500) fog ~0.85, blending to sky. Good. Let me use 0.0013.

Hmm but water also uses fog; water near camera low fog, far high. Good.

Let me set fogDensity=0.0013.

Also add slight exponential with a base ambient so night isn't pure black on terrain — ambient handles that.

Let me finalize and write.

Let me write the whole thing carefully now.

For `smoothstep` in JS for sky: defined.

Let me write.

Let me also reconsider: should water be rendered before terrain or after? If after, and water opaque, then over ocean the water (at y=0) is drawn, and terrain floor below (y<0) hidden behind it (drawn first, but water is closer to camera than floor? camera above at y>0, looking down at ocean: water surface at y=0 is between camera and floor at y<0. So water closer → water drawn, floor behind. But terrain pass draws floor first (depth), then water pass: water at y=0 is closer than floor's depth → passes depth → draws over floor. Good, water shows. Over land: terrain at y>0 drawn, water at y=0 farther → fails depth → not drawn. Good.

Order terrain then water correct.

But wait: terrain pass draws ocean floor at y<0 with its depth. Water pass draws water at y=0. Water is closer (smaller distance to camera) than floor? Camera at y=200 looking down at ocean point (x,0,z): distance to water point (x,0,z) vs floor (x, yfloor<0, z). Water closer. Depth test: water's depth < floor's depth (closer has smaller NDC depth). Water passes (floor already wrote a larger depth). Water draws. Good.

Alright.

Let me write final file now.

Let me also make sure I don't accidentally leave the autopilot moving when frozen. Handled.

Let me write.

Also, I want to handle `getCamera` returning yaw/pitch in radians — yes.

Let me write the complete code and then output.

Let me carefully write buildChunkData returning {data, idx, triCount}.

Writing now.

For idx as Uint16Array, need Int array first then convert. Fine.

Let me produce.

Let me also ensure I set gl.getAttribLocation for each attribute.

Alright. Final output below.

Let me reconsider the `sunset` variable unused — remove.

Also ensure no leftover `sunset`.

Let me also make sure the water uses uTime for animation and frozen stops it (animTime frozen). Good.

Let me write the complete file.
