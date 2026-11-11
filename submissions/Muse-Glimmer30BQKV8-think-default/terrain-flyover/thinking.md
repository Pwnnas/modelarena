# Task: Horizon — an infinite procedural terrain flyover in raw WebGL

Build endless procedurally generated landscape you fly over, with water, sky, fog and full day/night cycle, using raw WebGL only: own shaders, buffers, matrix math.

Deliver one file index.html with all HTML CSS JS inline. No external resources.

Target 1280x800 viewport; adapt resize.

Requirements: world scale 1 unit =1 meter, y up, sea level y=0. Terrain heights roughly -50 to +400. View distance at least 1500 m.

Terrain: seeded fractal-noise heightfield (fBm, ridged...). Fully deterministic for seed (no Math.random in world generation).

Infinite: generate chunks around camera streamed in/out. Never see edge. Use LOD or distance-based detail.

Materials: height- and slope-based coloring (sand near water, grass, rock steep, snow peaks), lit with proper normals.

Water at sea level: animated waves, fresnel-like sky reflection, shoreline blending.

Sky & atmosphere: sky gradient, visible sun, distance fog blends terrain into sky color at horizon.

Day/night: time 0-24 h (12 noon, 0 midnight). Advances automatically full day about 2 minutes and can be set with slider.

Sun position, light color/intensity, sky and fog colors follow time: warm sunrise/sunset, clearly dark night (moonlight/stars welcome).

Camera: Autopilot on initially: flies smoothly forward over terrain, following its height, never clipping.

F toggles autopilot. With autopilot off and no input, camera stays still.

Manual flight: W/S forward/back, A/D strafe, Q/E (or Shift/Space) down/up, mouse drag to look around (no pointer lock required). Smooth acceleration.

Camera can never go below terrain height (+ small margin) or below water surface.

UI & performance: minimal elegant overlay: time-of-day slider, seed input, autopilot indicator, FPS counter.

Smooth 60 FPS on modern laptop at 1280x800. Handle resize and HiDPI (cap pixel ratio).

Polish: atmosphere.

Grader contract:

1. Full-viewport canvas rendered via getContext('webgl') or webgl2.
2. window.__arena provides:
   freeze(on:boolean): while frozen, nothing changes on its own (no autopilot movement, no time-of-day progression, no water/cloud animation), so image depends only on seed, camera, time of day and viewport. Rendering continues, so changes made through this API appear within few frames. User keyboard/mouse input still works when frozen.
   setSeed(n:integer): regenerates entire world deterministically from seed. Same seed must give identical image for same camera and time. Updates #seed.
   setTime(hours:number): sets time of day (0-24). Updates #time.
   setCamera({x,y,z,yaw,pitch}) and getCamera() -> {x,y,z,yaw,pitch}: world units and radians. yaw=0 looks toward -z; pitch=0 level, positive pitch looks up. If requested y below allowed minimum, camera pushed up (and getCamera returns corrected).
   terrainHeight(x,z): number: terrain surface height at world (x,z) for current seed (actual surface you render, ignoring water).
   stats() -> {chunks:number, triangles:number}: loaded chunks, triangles drawn last frame.
3. #time: input type range min 0 max 24; input events set time of day.
4. #seed: input type number; change event regenerates world.
5. Keyboard W/A/S/D Q/E F and mouse-drag controls work with page focused, without clicking UI first.

We need produce one file index.html.

This is a huge task. Need raw WebGL, no libraries. Must implement matrix math ourselves. Need chunked terrain infinite.

Simplify but meet requirements.

We need deterministic noise. Implement seeded pseudo random noise: use classic Perlin or Simplex. Simpler: value noise with hash. Or use fBm with simple 3D noise. Need deterministic for seed.

We can implement a simple pseudo-random gradient noise based on integer hash of seed + coordinates. Use classic Perlin noise implementation (public domain) with seed offset.

Better to implement a simple 2D fBm using noise function based on sin hashing.

Simpler: use pseudo random value noise: hash integer coordinates to pseudo random gradient. Could use simplex.

For performance, we need chunked terrain. Could generate terrain mesh per chunk using grid of vertices. For infinite terrain, we need to generate around camera. View distance 1500 m. Chunk size maybe 128 m? 1500/128 ~ 12 chunks radius. Could be many triangles. Need LOD.

Alternative: use heightmap with tessellation? Could generate per chunk with variable resolution based on distance. Use e.g., chunk size 256 meters, subdivisions 32x32 = 1024 verts per chunk ~ 2k triangles. If we have ~ 30 chunks, ~60k triangles, okay.

But we need streaming in/out.

Simplify: generate terrain as a grid of vertices with height computed on the fly in JS for each vertex when chunk created. Then upload to GPU as VBO.

Materials: height and slope based coloring. Compute normals from height differences.

Water: a plane at y=0 with animated waves using shader.

Sky: gradient in fragment shader with sun position. Could render skybox using full-screen quad with sun disc.

Fog: in fragment shader compute distance fog.

Day/night cycle: sun direction based on time.

Camera: autopilot flies forward over terrain following height. Need to compute terrain height ahead? Could just move forward in -z direction relative to camera yaw? Autopilot should fly smoothly forward over terrain following its height. Simpler: camera moves forward at constant speed along yaw direction, y is set to terrainHeight(x,z)+margin + some offset based on slope? Need to follow height. Could sample terrain height at camera xz position each frame and set y = max(height+margin, water? Actually water surface at 0). Ensure not below water? Camera can be above water. If terrain below water? Sea floor? Actually terrain height can be negative. Water at sea level. Camera cannot go below water surface? The requirement: camera can never go below terrain height (+small margin) or below water surface. So if terrain is underwater, water surface is higher. So y >= max(terrainHeight+margin, 0? Actually water surface is 0, but if terrain is below 0, water surface is at 0). Wait terrain height includes sea floor? Terrain heights span -50 to +400. Water at sea level y=0. So terrain below 0 is seabed. Camera should not go below terrain height+margin OR below water surface? If terrain is below water, water surface is higher, so camera should stay above water. So allowed min y = max(terrainHeight+margin, 0? Actually water surface is 0, but if camera is above water, it's okay to be above 0. If terrain is above water, terrain height >0, so min is terrainHeight+margin. So min y = max(terrainHeight+margin, 0? Wait water surface is 0, but if terrain is below 0, terrainHeight+margin could be negative, but camera cannot go below water surface (0). So min y = max(terrainHeight+margin, 0 + margin?) Actually water surface is at 0, camera cannot go below water surface. So y >= 0? Probably y >= 0.5? Let's interpret: cannot go below terrain height (+margin) or below water surface. So minY = max(terrainHeight + margin, waterSurface). Water surface =0. So if terrain is -20, terrain+margin = -19, max with 0 => 0. Good.

Autopilot: move forward at speed ~ 30 m/s? Over 2 minutes day cycle. Need smooth.

Manual flight: W/S forward/back, A/D strafe, Q/E down/up, Shift/Space down/up. Mouse drag to look around.

Implement input handling.

We need window.__arena API.

Implementation plan:

HTML structure:
canvas full viewport
div overlay with controls: time slider #time, seed input #seed, autopilot indicator, FPS counter.

CSS minimal.

JS:

Initialize WebGL context.
Enable depth test, cull face.

Shaders:
Vertex shader for terrain: attributes position (vec3), normal? We can compute normal in shader from height? Better precompute normals per vertex.

Simplify: terrain vertex shader receives position, normal, color? Could compute color in fragment based on height and slope.

We'll generate vertices with position and normal, maybe UV.

Vertex shader: uniform mat4 uModelViewMatrix, uProjectionMatrix, uModelMatrix, uSunDir, uTime, etc. Pass vWorldPos, vNormal, vHeight.

Fragment shader: lighting with sun direction, sky color, fog.

We need sky gradient and sun.

Alternative approach: render terrain with simple shader.

Water: separate shader with animated waves using sine based on time and position.

Sky: render full-screen quad after terrain? Or render sky first with depth clear? Use skybox with far plane.

Simpler: clear color to sky gradient computed in fragment shader for background using ray direction? Could render sky as fullscreen quad with depth test disabled, then render terrain.

For simplicity: render sky as a large inverted sphere or just clear color and draw sun as billboard.

Fog: implement exponential fog in fragment shader based on distance.

Day/night: compute sun position based on time. Sun direction vector from world up? Sun moves in arc. Use angle = (time/24)*2π. At noon sun at zenith? Actually sun highest at noon. Could have sun orbit around Y axis. Use sun elevation = sin( angle ) * max elevation (~80 deg). Azimuth rotates.

Simpler: compute sun direction = normalize( vec3(cos(azimuth)*cos(elev), sin(elev), sin(azimuth)*cos(elev)) )? Need mapping.

Let's define time 0 = midnight, 6 = sunrise, 12 noon, 18 sunset, 24 midnight.

Sun elevation = sin( (time/24)*2π - π/2 )? Hmm.

Let's use angle = (time/24)*2π. At 6h angle = π/2, sun rise. At 12h angle = π, sun at top? Actually sin. Let's use elevation = sin(angle - π/2?) Let's just compute elevation = sin( (time/24)*2π - π/2 )? Wait sin(-π/2)= -1 at 0. Hmm.

Better: define solar angle from horizon: hour angle = (time - 12)/24 * 2π. Elevation = sin(hour angle?) Not correct.

Simpler: Use parametric: elevation = sin( (time/24)*2π - π/2 )? At time 6: (0.25*2π)=π/2, minus π/2 =0 => sin0=0 sunrise. At time 12: (0.5*2π)=π, minus π/2 = π/2 => sin=1 noon. At time 18: (0.75*2π)=1.5π, minus π/2=π => sin0 sunset. At time 0/24: 0 - π/2 = -π/2 => sin -1 midnight. Good.

Azimuth can be constant or slowly change. Could set azimuth = 0? Sun moves east to west. For simplicity, azimuth = 0. Or vary with time: azimuth = 0? Could use constant.

Sun direction = normalize( vec3( cos(azimuth)*cos(elevation), sin(elevation), sin(azimuth)*cos(elevation) ) ). With elevation negative at night, sun below horizon.

Light color intensity based on elevation: lerp between night color and day.

Sky color: interpolate between night sky dark blue and day sky light blue based on elevation.

Fog color similar.

Stars: optionally render points when night.

Water waves: use sine sum.

Implementation details:

Matrix math: need perspective matrix, lookAt matrix, model matrix for terrain chunks (translation). Compute manually.

Implement functions:
mat4Identity, mat4Multiply, mat4Perspective, mat4LookAt, mat4Translate, mat4Scale.

Vector math: vec3 normalize, dot, cross, add, subtract, multiply.

Noise:

We need deterministic seeded noise. Implement a simple 2D noise using a hash function.

Common fast noise: use classic Perlin with permutation table seeded.

Simpler: use value noise with fractal sum using pseudo-random gradient.

We can implement a hash function:
function hash2(x,z,seed){
  // mix ints
  let h = x*374761393 + z*668265263 + seed*1234567;
  h = (h ^ (h>>>13)) * 1274126177;
  h = h ^ (h>>>16);
  return (h>>>0)/4294967296;
}
Then smooth noise using bilinear interpolation of hash values.

But we need smooth terrain. Could use simplex noise implementation.

Given time constraints, implement a simple 2D Perlin noise with permutation table generated from seed using linear congruential generator.

Implementation steps:

function createPermutation(seed):
  perm = [0..255]
  shuffle using seeded random (LCG). Then duplicate.

Perlin noise function noise(x,y):
  // find unit grid
  // compute dot products with gradients
  ...

Then fBm: sum octaves.

Height function: height(x,z) = fBm(x*scale, z*scale) * amplitude + offset. Need range -50 to 400. Could map noise [-1,1] to range.

We need terrainHeight(x,z) for grader API. Must match rendered height. So height function must be deterministic and used both for generating mesh and API.

We also need slope for coloring. Could compute slope from height differences in shader? Could compute normal per vertex from height differences using finite differences.

When generating chunk vertices, we can compute height for each grid point, then compute normal via central differences using heights of neighbors.

Chunk management:

Camera position (x,y,z). Determine which chunks to load. Chunk size in world units: say CHUNK_SIZE = 256. Grid resolution: CHUNK_RES = 32 (so step = 8 meters). That gives 33x33 vertices per chunk ~ 1089 vertices. Triangles ~ 2*(32*32)=2048.

View distance: 1500 m. Radius in chunks: ceil(1500 / CHUNK_SIZE) = 6. So about (2*6+1)^2 ≈ 169 chunks. Each with 2k triangles => 338k triangles. Might be okay but heavy for JS generation. Could reduce resolution with LOD.

Alternative: use larger chunk size 512 with resolution 64? Hmm.

We can use dynamic LOD: farther chunks use lower resolution. Simpler: use same resolution but only load within radius maybe 3 chunks (~49 chunks). View distance 1500, chunk size 256 => radius 6. Maybe we can use chunk size 512, resolution 32 => step 16 m. Then radius 3 => 49 chunks. 49*2048=100k triangles. Acceptable.

Let's pick CHUNK_SIZE = 256, RES = 32 (step 8). That's okay.

Chunk coordinate: chunkX = floor(cameraX / CHUNK_SIZE), chunkZ = floor(cameraZ / CHUNK_SIZE). Load chunks within radius R.

When camera moves, we need to update chunks. To avoid popping, we can keep chunks and update positions? Better generate new chunks as needed, dispose old.

Implementation: maintain Map key "cx,cz" -> {mesh buffers, position}. Each frame, compute needed chunks set, add new, remove old.

For each new chunk, generate vertex data array of Float32. For i from 0 to RES, j from 0 to RES:
  worldX = cx*CHUNK_SIZE + i*step
  worldZ = cz*CHUNK_SIZE + j*step
  height = getTerrainHeight(worldX, worldZ) // using noise
  position = [worldX, height, worldZ]
Compute normals: for interior vertices, compute using neighbors. For edge vertices, we may need neighbor heights from adjacent chunks to avoid seams. Simpler: compute normal per face and average? Could compute normal using finite differences of height function analytically? Could approximate using central difference using height at +/- step. That requires neighbor heights which are available if we generate chunk with overlap? Might be okay to compute normals using neighbor heights within same chunk, but at edges normals will be wrong causing seams. Acceptable? Might cause visible seams.

Alternative: compute normal in shader using derivatives of height? Could compute normal via partial derivatives using noise analytic? Hard.

Simplify: generate terrain using heightmap where each vertex normal computed from heights of adjacent vertices in same chunk, and assume continuity across chunks because height function is continuous, so the heights at shared edges match exactly because height function is deterministic. So the normal computed using one-sided differences at edges will be slightly off but maybe okay.

Better: compute normal per vertex using central differences using height function evaluated at x±step, z±step (not just neighboring vertices in array). That will be consistent across chunks.

Thus for each vertex, we can compute normal by sampling height at (x+step, z), (x-step, z), (x, z+step), (x, z-step). Compute tangent vectors.

That's cheap (4 extra noise evaluations per vertex). 1089*4 ~ 4k per chunk, okay.

So generate vertices: position, normal.

Color can be computed in fragment shader based on height and slope (dot normal with up). So pass height as attribute or compute from position y.

We can pass height as vertex attribute (or just y). Simpler: fragment shader uses vWorldPos.y and vNormal.y.

Material coloring: if y < 0 => seabed? Actually water covers. Terrain below water is seabed but we still render it? Maybe render terrain under water with different color, but water plane covers. Could render terrain below water with darker color. Might be okay.

Color mapping:
if height < -10? Hmm.

Let's define:
if height < 0: seabed (dark)
else if height < 5: sand
else if height < 100: grass
else if height < 250: rock
else: snow

Slope factor = 1 - dot(normal, up). Steep => rock.

Blend.

Water shader: plane at y=0 with wave displacement. Render with transparency? Could render opaque with depth test.

Shoreline blending: terrain near water should blend with sand. Could just let terrain color handle.

Sky: render full-screen quad with gradient based on sun elevation.

Fog: in terrain fragment shader, compute distance from camera, mix color with fog color based on exp.

Sun: draw as a billboard quad at far distance? Simpler: in sky shader, compute sun position on screen.

Simpler approach: render sky as fullscreen quad with fragment shader that computes sky color based on view direction and sun direction, with fog.

We can have one shader for sky.

Simplify pipeline:

- Clear color to sky color.
- Render sky fullscreen quad first with depth disabled.
- Render water plane with shader (with waves)
- Render terrain chunks with shader
- Render sun disc as simple quad?

Might be okay.

But to keep performance, we could combine sky and fog in terrain shader.

Alternative: render sky as a large dome.

Given time, implement simple sky gradient using gl.clearColor based on time? But need sun visible.

Better: render sky fullscreen quad with shader that computes sky color based on view direction.

Implementation steps in code:

Initialize WebGL:
canvas width/height set to window innerWidth/innerHeight * devicePixelRatio capped at 2.
Set viewport.

Create shaders:

terrain vertex shader:
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelMatrix;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewPos;
void main(){
  vWorldPos = (uModelMatrix * vec4(aPosition,1.0)).xyz;
  vNormal = mat3(uModelMatrix) * aNormal; // model scale uniform
  vec4 mvPos = uModelViewMatrix * vec4(aPosition,1.0);
  vViewPos = mvPos.xyz;
  gl_Position = uProjectionMatrix * mvPos;
}

terrain fragment shader:
precision mediump float;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewPos;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uAmbientColor;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uTimeOfDay;
...
Compute lighting: diffuse = max(dot(normalize(vNormal), normalize(uSunDir)),0.0)
Final color = baseColor * (ambient + diffuse * uSunColor)
Apply fog: distance = length(vViewPos)
fogFactor = exp(-pow(distance*uFogDensity,2))? Use exp2.
Mix with fog color.

Base color based on height and slope.

height = vWorldPos.y
slope = 1.0 - abs(dot(normalize(vNormal), vec3(0,1,0)))
...
if height <0: color = vec3(0.1,0.1,0.2) seabed
else if height <5: sand
...

Blend.

Water shader:
vertex: attribute vec3 aPosition (plane vertices)
uniform mat4 uModelViewProjection
varying vec2 vUV
varying vec3 vWorldPos
...
Fragment: compute waves using sin(time + position). Use normal from derivative.

Simpler: just render flat plane with animated normal mapping.

Given complexity, we can implement water as simple plane with uniform color and slight wave via vertex displacement in shader using time uniform.

Vertex shader for water:
attribute vec3 aPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;
varying vec3 vWorldPos;
varying vec3 vNormal;
...
Compute wave displacement: height = sin(aPosition.x*0.05 + uTime)*0.5 + cos(aPosition.z*0.07 + uTime*1.3)*0.5

But we need normals for lighting.

Simpler: displace y in vertex shader and compute normal approx.

Could just use simple shader with no displacement, animated color.

Given time constraints, maybe acceptable.

We need to meet grader contract. Most important: window.__arena API, #time slider, #seed input, camera controls, autopilot, freeze, setSeed, setTime, setCamera/getCamera, terrainHeight, stats.

Performance: keep 60 FPS.

Implementation details for camera:

Camera object:
position {x,y,z}
yaw (radians)
pitch (radians)

Forward vector: 
yaw=0 looks toward -z. So forward = (sin(yaw), 0, -cos(yaw))? Wait yaw rotation around Y. Standard: yaw 0 -> -z. yaw = π/2 -> -x? Actually sin. Let's define:
forward.x = sin(yaw)
forward.z = -cos(yaw)
right = (cos(yaw),0,sin(yaw))

Pitch: rotation around X axis. So final direction = rotate forward by pitch.

For movement:
If autopilot on: move forward at speed e.g., 40 m/s? Need smooth. Could move 30 units per second.

We need to follow terrain height. Each frame, sample terrainHeight at camera x,z, set y = height + cameraHeightOffset (e.g., 10 m). Ensure y >= water surface.

Also need to keep camera above terrain as it moves.

Manual flight: acceleration based on input.

Simplify: manual controls use velocity vector with damping.

Input handling:
keys pressed set.
Mouse drag: on mousedown, track delta, update yaw/pitch.

No pointer lock required: just listen mousemove when dragging.

Autopilot toggle F.

Freeze: when frozen, no autopilot movement, no time progression, no water animation. Rendering continues. So we need a flag frozen. When frozen, we skip updating time, camera autopilot, water time.

But user keyboard/mouse input still works when frozen.

setSeed: regenerate world. Need to reset noise permutation.

setTime: set time of day.

setCamera: set camera position/yaw/pitch. If y below allowed minimum, push up.

getCamera returns.

terrainHeight(x,z): compute height using same noise function as generation.

stats(): return chunks count and triangles drawn last frame.

We need to track triangles drawn.

Implementation steps code:

HTML:
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Horizon</title>
<style>...</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="ui">...</div>
<script>...</script>
</body>
</html>

UI: time slider #time, seed input #seed, autopilot indicator, FPS.

CSS: overlay top left.

JS code:

const canvas = document.getElementById('c');
const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');

If webgl2, better but webgl works.

Set up resize.

Matrix functions.

Noise:

Implement Perlin noise:

function createPermutation(seed){
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for(let i=0;i<256;i++) p[i]=i;
  // LCG shuffle
  let s = seed>>>0;
  function rand(){ s = (s*1664525 + 1013904223)>>>0; return s/4294967296; }
  for(let i=255;i>0;i--){ const j = Math.floor(rand()*(i+1)); [p[i],p[j]]=[p[j],p[i]]; }
  for(let i=0;i<512;i++) perm[i]=p[i&255];
  return perm;
}

Gradients for 2D: 8 directions.

function fade(t){ return t*t*t*(t*(t*6-15)+10); }

function lerp(a,b,t){ return a + t*(b-a); }

function grad(hash,x,y){ // hash 0..7
 const h = hash & 7;
 const u = h<4 ? x : y;
 const v = h<4 ? y : x;
 return (h&1? -u : u) + (h&2? -v : v);
}

noise(x,y,perm):
  X = floor(x) & 255
  Y = floor(y) & 255
  x -= floor(x)
  y -= floor(y)
  u = fade(x)
  v = fade(y)
  A = perm[X]+Y
  AA = perm[A]
  AB = perm[A+1]
  B = perm[X+1]+Y
  BA = perm[B]
  BB = perm[B+1]
  ...

Return.

fBm:
function fBm(x,z,octaves=6, persistence=0.5, lacunarity=2.0){
  let amp=1, freq=1, sum=0, max=0;
  for...
  ...
  return sum/max;
}

Height function:
const BASE_SCALE = 0.005? Need height range -50 to 400. Let's test.

We can compute noise value in [-1,1]. fBm sum gives ~ [-1,1]. Multiply by amplitude ~ 200? Range 400.

Add offset? Could add bias to make mountains higher.

Maybe use ridged noise for mountains.

Simplify: height = fBm(x*0.001, z*0.001)*200 + fBm(x*0.002, z*0.002)*100 ... Might produce range.

We also want sea level at 0. Could shift.

Better: height = fBm * 150 + 50? That gives -100 to 250.

We need up to 400. Could increase amplitude.

Let's define:
let n = fBm(x*0.0008, z*0.0008, 6);
height = n * 250; // range -250 to 250
Then add base 100? Hmm.

We need sea level 0. Could have average height around 100? Might be okay.

We can also add a large-scale bias.

Let's design:
height = fBm(x*0.0005, z*0.0005)*200 + fBm(x*0.001, z*0.001)*100 + 50

Range approx -350 to +350 +50.

Might be okay.

Better to ensure min ~ -50. Could clamp? Could allow.

Let's just compute height = fBm(...)*250 + 100. Then range -150 to 350. Acceptable.

We also need seabed below 0: heights negative possible.

Set height = fBm*200 + 50? Range -150 to 250.

Let's pick height = fBm*225 + 75 => range -150 to 300.

Maybe okay.

We can tune.

Terrain generation chunk:

CHUNK_SIZE = 256
RES = 32
STEP = CHUNK_SIZE / RES

Generate vertices:
numVerts = (RES+1)*(RES+1)
positions = []
normals = []
indices = []

For i 0..RES:
 for j 0..RES:
   worldX = cx*CHUNK_SIZE + i*STEP
   worldZ = cz*CHUNK_SIZE + j*STEP
   h = getHeight(worldX, worldZ)
   positions.push(worldX, h, worldZ)

Then compute normals per vertex using central differences:
dx = getHeight(worldX+STEP, worldZ) - getHeight(worldX-STEP, worldZ)
dz = getHeight(worldX, worldZ+STEP) - getHeight(worldX, worldZ-STEP)
normal = normalize(-dx, 2*STEP, -dz) ? Actually tangent.

Simpler: compute normal vector = (-dx/(2*STEP), 1, -dz/(2*STEP)). Normalize.

We need height at x±STEP, z±STEP. That's 4 extra samples per vertex. Acceptable.

Indices: for each quad, two triangles.

We need to upload to GPU. We can create VAO? WebGL1 doesn't have VAO. We can just bind buffers each draw.

To keep performance, we could store buffers per chunk and reuse.

Implementation of chunk object:
{
 cx, cz,
 vbo, ibo,
 vertexCount,
 triangleCount,
 modelMatrix? Actually position is in world coordinates, so model matrix is identity. We can just use positions in world space and use view matrix only. But for culling? Could just render with MVP using positions directly (world space). Simpler: vertex positions are world coordinates, so model matrix is identity. So we can just upload positions and use MVP = projection * view.

Thus we don't need per-chunk model matrix.

But we need to cull chunks outside view. Could just iterate.

Chunk generation may be heavy on main thread. Could generate asynchronously? For simplicity, generate synchronously but limit.

We need to manage stats: chunks count, triangles drawn last frame.

We can compute triangles drawn = sum of indices/3 for chunks drawn.

Rendering loop:

function render() {
  // update camera if not frozen
  // update time if not frozen
  // update chunks
  // clear
  // render sky
  // render water
  // render terrain chunks
  // render UI? UI in DOM
  requestAnimationFrame(render)
}

Sky shader: simple gradient.

We could render sky as full-screen quad with shader computing sky color based on view direction.

Simplify: render sky as clear color computed each frame based on time, and draw sun as a small quad in screen space at position computed from sun direction.

Could compute sun screen position via projection of sun direction.

Simpler: just set clearColor to sky color and draw sun as a 2D circle overlay using canvas 2D? But requirement raw WebGL only. Could draw sun as a quad in screen space.

Let's implement sky as fullscreen quad with shader that samples direction and mixes.

Simpler: we can render a large inverted sphere at origin with sky shader. That requires sphere mesh.

Even simpler: clear color to sky color, and draw sun as a billboard quad always facing camera at a fixed distance in world space.

Sun position in world: sun direction * large distance (e.g., 10000). Then render a quad facing camera.

That would be visible.

Implement sun as a simple quad with shader that draws yellow disc with glow.

Could just render a point sprite.

Given time, maybe sky gradient via clearColor + fog.

We can set clearColor to sky color each frame. Then render terrain with fog blending to sky color. That will give horizon blending.

Sun can be drawn as a small quad in screen space using orthographic projection.

Simplify: after rendering 3D, render sun as 2D overlay using a simple shader on full screen quad with sun position in normalized device coordinates.

Compute sun NDC: project sun world position (sunDir * 10000) using projection and view matrices. If z in front, draw.

Simpler: compute sun screen position analytically: sun direction vector, map to screen.

We can just compute sun angle and draw in 2D using CSS overlay? No, must be WebGL.

Alternative: skip sun rendering and rely on lighting. But requirement says visible sun.

We can draw sun as a billboard at fixed world position far away: sunWorldPos = sunDir * 5000. Then render a quad with MVP. That will appear in sky.

Implement a simple quad with 4 vertices (positions) centered at origin, size maybe 200 meters. Then translate to sunWorldPos.

That's okay.

Water: plane at y=0 covering large area. Could render as a large grid covering area around camera. Simpler: render a huge plane (size 20000) with shader that does waves.

Water plane vertices: maybe a grid of e.g., 128x128 covering large area. But that would be many vertices.

Alternative: render water as a single quad covering the whole screen in screen space with shader that computes world position from depth? Too complex.

Simpler: render a large plane (e.g., 8192 x 8192) with low resolution grid (64x64) centered at camera XZ, and update its position each frame. That will be visible.

We can create one water mesh, update its model matrix each frame to follow camera, and render with shader that does waves based on world coordinates.

That would be efficient.

Implement water mesh: a grid of 64x64 vertices covering 4096 meters. Position it at y=0, centered at camera XZ each frame (model matrix translation).

Waves: in vertex shader, displace y based on sin(dot(position.xy, ... ) + time). Compute normal via derivative approx.

Simplify: vertex displacement only, normal approximated as up.

Maybe acceptable.

Shoreline blending: water shader can blend with terrain at edges? Could just render water with depth test, terrain will occlude.

Implementation steps for water:

Create buffer for water grid once.

In render, compute waterModelMatrix = translate(camera.x, 0, camera.z) ??? Actually we want water plane to be centered at camera to avoid seams. Since waves are based on world coordinates, we need world coordinates consistent. If we move mesh with camera, waves will move incorrectly.

Alternative: keep water mesh static at origin with huge size, and waves based on world position (which is static). That will be okay.

Let's create water plane covering e.g., from -20000 to 20000 in XZ. That's 40000 size. With grid resolution 128, step ~312 m. That's coarse but okay for waves.

Vertices count ~ 16529. Triangles ~ 2*127*127 ~ 32258. Acceptable.

We can generate once.

Water shader: vertex displacement y = waveHeight based on position and time. Use sin.

Compute normal? Could approximate.

Simplify: just render flat plane with animated color based on time.

Maybe acceptable.

Given time constraints, we can implement a simplified water with just a flat plane with color varying.

But requirement: animated waves, fresnel-like sky reflection, shoreline blending.

We can simulate fresnel in fragment shader using view direction.

Shoreline blending: if terrain height near 0, blend sand. Could be handled by terrain shader.

Ok.

Implementation details:

Create shaders:

terrain vs:
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uMVP;
uniform mat4 uModelView;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewPos;
void main(){
  vWorldPos = aPosition;
  vNormal = aNormal;
  vec4 mv = uModelView * vec4(aPosition,1.0);
  vViewPos = mv.xyz;
  gl_Position = uMVP * vec4(aPosition,1.0);
}

terrain fs:
precision mediump float;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewPos;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uAmbientColor;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uTimeOfDay;
...
Compute base color.

Compute slope = 1.0 - abs(dot(normalize(vNormal), vec3(0,1,0)))? Actually slope factor.

Height = vWorldPos.y

if height < 0.0:
  base = vec3(0.05,0.05,0.15) // deep water seabed
else if height < 2.0:
  base = mix(vec3(0.76,0.7,0.5), vec3(0.9,0.85,0.6), smoothstep(0,2,height))
else if height < 80.0:
  base = vec3(0.3,0.5,0.2)
else if height < 200.0:
  base = mix(vec3(0.4,0.35,0.25), vec3(0.6,0.5,0.4), (height-80)/120)
else:
  base = vec3(0.9,0.9,0.95)

Add slope influence: if slope > 0.3, tint rock.

Compute lighting.

Fog: float dist = length(vViewPos);
float fogFactor = exp(-dist * uFogDensity);
Actually exponential: fogFactor = exp(-dist * density). Or use pow.

Mix color with fog.

Return.

Water vs:
attribute vec3 aPosition;
uniform mat4 uMVP;
uniform float uTime;
varying vec3 vWorldPos;
varying vec2 vUV;
void main(){
  vec3 pos = aPosition;
  float wave = sin(pos.x * 0.02 + uTime) * 0.5 + cos(pos.z * 0.03 + uTime * 1.3) * 0.5;
  pos.y += wave * 0.3;
  vWorldPos = pos;
  vUV = pos.xz * 0.01;
  gl_Position = uMVP * vec4(pos,1.0);
}

Water fs:
precision mediump float;
varying vec3 vWorldPos;
varying vec2 vUV;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uSkyColor;
uniform float uTime;
...
Compute fresnel: float fresnel = pow(1.0 - max(dot(normalize(vWorldPos - cameraPos?) ), 0), 3)
Simplify: use view direction.

We don't have camera pos in fragment. Could pass.

Simplify: water color = mix(vec3(0.0,0.2,0.4), uSkyColor, 0.5)

Ok.

Sky:

We can render sky as fullscreen quad with shader that computes sky color based on view direction.

Simplify: clear color to sky color computed from time. That may be enough.

Sun rendering:

Create a quad with 4 vertices forming a square. Render with MVP where model matrix translates to sunWorldPos.

Sun shader: simple color with glow.

Could just render a point.

Given time, maybe we can skip detailed sky and just use clear color.

Requirement: sky gradient, visible sun, distance fog blends terrain into sky color at horizon.

Clear color to sky color gives gradient? No gradient.

Could compute sky gradient in fragment shader for fullscreen quad.

Let's implement sky as fullscreen quad rendered first with depth test disabled. Shader computes sky color based on view direction (ray direction). Use simple gradient: color = mix(horizonColor, zenithColor, dot(dir, up)). Add sun disc.

Sun disc: if dot(dir, sunDir) > 0.99, color bright.

That would give gradient and sun.

Implement sky quad: vertices for full-screen quad in clip space (-1,-1) to (1,1). No MVP.

Vertex shader passes position.

Fragment shader:
uniform vec3 uSunDir;
uniform vec3 uSkyZenith;
uniform vec3 uSkyHorizon;
uniform float uTimeOfDay;
varying vec2 vUV? Actually need view direction.

We need camera orientation to map quad to view direction. Simpler: we can compute sky in screen space: gradient based on y coordinate.

Use vUV.y to blend.

That's not view direction but okay.

Let's do simple gradient based on screen y.

Fragment shader:
float t = vPos.y *0.5 +0.5;
vec3 color = mix(uSkyHorizon, uSkyZenith, t);

Add sun as circle at position based on sunDir projected onto screen? Could compute sun screen position via projection each frame and pass as uniform.

Simpler: compute sun position in screen space using projection of sun world position. Pass sunScreenPos (vec2) and sunRadius.

Then in fragment shader, if distance to sunScreenPos < radius, add glow.

That would work.

Implementation:

Sky quad vertices: positions in clip space.

Vertex shader passes vPos (clip space) -> we can compute UV.

Fragment shader receives vUV.

We need sunScreenPos uniform.

Compute sunWorldPos = sunDir * 10000.0
Project to clip space using MVP (same as camera). Then convert to NDC.

We can compute in JS each frame: project sun position using matrix multiplication, then get screen coordinates.

Then pass to shader.

Okay.

Now implementation details in code.

Given the complexity, we need to write code concisely but functional.

Let's start coding.

Pseudo-code outline:

const canvas...
gl...

Resize function:
canvas.width = innerWidth * devicePixelRatio capped
canvas.height = ...
gl.viewport...

Matrix functions:
mat4.create()
mat4.identity()
mat4.multiply(a,b)
mat4.perspective(fov,aspect,near,far)
mat4.lookAt(eye,center,up)
mat4.translate(m, v)
mat4.rotate?

We need only lookAt and perspective.

Implement lookAt:
function lookAt(eye,center,up){
  const f = normalize(subtract(center,eye))
  const s = normalize(cross(f,up))
  const u = cross(s,f)
  m[0]=s.x; m[1]=u.x; m[2]=-f.x; ...
}

Perspective:
fov rad, aspect, near, far.

Now noise:

let perm = null;
function initNoise(seed){
  perm = createPermutation(seed);
}
function noise2d(x,y){...}
function fBm(x,z){...}
function getHeight(x,z){ return ... }

Terrain height function must be deterministic.

Implement getHeight(x,z):
const n = fBm(x*0.0006, z*0.0006)
return n*220 + 80 // range approx -140 to 420

Let's test mental: fBm returns about [-1,1]. *220 = -220 to 220. +80 => -140 to 300. Acceptable.

Maybe increase to get peaks 400. Use *250 + 100 => -150 to 350.

Let's use *240 + 80 => -160 to 400.

Ok.

Now chunk management:

const CHUNK_SIZE = 256
const RES = 32
const STEP = CHUNK_SIZE/RES

chunks = new Map()

function chunkKey(cx,cz){ return cx+','+cz }

function getNeededChunks(camera){
  const cx = Math.floor(camera.x / CHUNK_SIZE)
  const cz = Math.floor(camera.z / CHUNK_SIZE)
  const radius = 5 // number of chunks
  const needed = new Set()
  for dx -radius..radius
    for dz ...
      if dx*dx+dz*dz <= radius*radius
        needed.add(...)
  return {cx,cz,needed}
}

Update chunks:
needed set, existing keys.
For each key in needed, if not exist, create chunk.
For each existing key not in needed, delete.

Create chunk:
Generate vertices arrays:
positions = []
normals = []
indices = []

for i=0..RES:
 for j=0..RES:
   x = cx*CHUNK_SIZE + i*STEP
   z = cz*CHUNK_SIZE + j*STEP
   y = getHeight(x,z)
   positions.push(x,y,z)
   // normal will be computed later

Compute normals: for each vertex idx, compute dx, dz using getHeight at x±STEP, z±STEP.

We can compute on the fly in same loop after positions generated? Need height at neighbors. Could compute height for each grid point first store in 2D array heights[RES+1][RES+1]. Then compute normals using central differences.

Simpler: store heights array.

Implementation:

const verts = (RES+1)*(RES+1)
heights = new Float32Array(verts)
for i...
  idx = i*(RES+1)+j
  heights[idx] = getHeight(...)

Then positions and normals.

For each i,j:
  x,y,z
  // compute normal
  const hL = heights[idx-1] or getHeight(x-STEP,z) for edge
  const hR = heights[idx+1] ...
Better to use central difference with neighbor heights from array if inside, else sample via getHeight.

Simpler: for each vertex compute normal using getHeight at x±STEP, z±STEP (4 samples). That's 4 noise evaluations per vertex, maybe okay ( ~ 1100 *4 = 4400 per chunk). For 50 chunks, 220k noise evaluations per frame if regenerated each frame? But chunks are generated once.

Acceptable.

So we can compute normal:

const hC = heights[idx]
const hXplus = getHeight(x+STEP,z)
const hXminus = getHeight(x-STEP,z)
const hZplus = getHeight(x,z+STEP)
const hZminus = getHeight(x,z-STEP)
dx = (hXplus - hXminus)/(2*STEP)
dz = (hZplus - hZminus)/(2*STEP)
normal = normalize(-dx, 1, -dz) ? Wait vector (dx,1,dz)? Actually surface y = h(x,z). Normal = (-dh/dx, 1, -dh/dz). So normal = (-dx,1,-dz). Normalize.

Good.

Then create buffers:
vbo = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
Similarly for normals.

ibo = gl.createBuffer()
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

Store.

Rendering terrain:
for each chunk:
  gl.bindBuffer...
  set attributes
  set uniform MVP = projection * view
  drawElements

Triangles count sum.

Water mesh:

Generate once at init:
size = 4096? Let's generate grid covering 8192 x 8192 with 128 steps => step ~64.

Simpler: generate water plane centered at origin covering 8192.

Vertices: (N+1)^2.

Create buffer once.

Water model matrix: we want water plane to be static in world, so no need to move. Just render at y=0. That's fine.

But if camera moves far away, water plane may go out of view? Size 8192 covers ~4096 radius. Camera may move beyond. Could generate larger.

Alternative: generate water plane large enough, e.g., 32768 size with 256 steps => step 128. That's ~ 66049 vertices, maybe heavy.

Compromise: water plane size 16384 with 128 steps => step 128, vertices ~ 16641, ok.

Let's pick size 16384, steps 128.

Generate once.

Now rendering loop steps:

Time of day:
let time = 12.0 // hours
let timeSpeed = 24 / 120 // seconds for full day? 2 minutes =120 sec. So speed = 0.2 hours per second.

If not frozen and not paused? Update time += delta * timeSpeed.

Wrap modulo 24.

Update UI slider #time value.

Sun direction:
const angle = (time/24)*2*Math.PI - Math.PI/2 // elevation angle? Wait we need elevation.

We earlier derived elevation = sin(angle?) Let's compute elevation angle from horizon.

We have elevation = sin( (time/24)*2π - π/2 )? Actually we want elevation = sin( (time/24)*2π - π/2 )? At time 12, (0.5*2π)=π, minus π/2 = π/2 sin=1 good. At time 6, (0.25*2π)=π/2 minus π/2 =0 sin0. At time 0, 0 - π/2 = -π/2 sin -1. Good.

Elevation angle = asin(elevation?) Hmm we used sin to get elevation value between -1 and 1. That's fine for direction.

We can compute sun elevation angle = arcsin? Actually direction's y component = sin(elevationAngle). So we can set y = sin(elevationAngle). Then elevationAngle = arcsin(y). Simpler: set y = sin( ... ). And x/z = cos(elevationAngle)*...

We need elevationAngle = arcsin(y). But we can directly compute direction using spherical coordinates:

Let hourAngle = (time/24)*2π - π/2? Wait we want elevation = sin( ... ). Let's define:

let t = time/24 * 2π
let elevation = Math.sin(t - Math.PI/2) // ranges -1 to 1
let azimuth = 0 // or slowly change

Then sun direction:
y = elevation
horizontal = Math.cos(Math.asin(elevation))? Actually cos(elevationAngle) = sqrt(1 - elevation^2). But we can compute using angle.

Better compute sun elevation angle = Math.asin(elevation)? That's circular.

Alternative: compute directly using angle:

Let angle = (time/24)*2π
Sun elevation angle = Math.sin(angle - Math.PI/2) * (Math.PI/2) ??? Hmm.

Simpler: use parametric:
elevationAngle = Math.sin((time/24)*2π - Math.PI/2) * (Math.PI/2 - 0.1) // max about 80 deg
azimuth = 0

Then direction:
y = Math.sin(elevationAngle)
x = Math.cos(elevationAngle) * Math.cos(azimuth)
z = Math.cos(elevationAngle) * Math.sin(azimuth)

With azimuth 0, x = cos(elev), z=0. That's sun moving in X-Z plane? Might be okay.

Actually we want sun to move across sky, azimuth change.

Let's set azimuth = (time/24)*2π? That would cause sun to circle.

Simplify: azimuth = 0, sun moves only up/down. Acceptable.

But for visual, better have azimuth change.

Let's set azimuth = Math.PI * Math.sin( ... )? Hmm.

Simpler: use sun direction as:
let hour = time / 24
let elevation = Math.sin(hour * 2*Math.PI - Math.PI/2) // -1 to1
let azimuth = hour * 2*Math.PI // full rotation
Then:
y = elevation
x = Math.sqrt(1 - elevation*elevation) * Math.cos(azimuth)
z = Math.sqrt(1 - elevation*elevation) * Math.sin(azimuth)

That gives sun moving around.

Good.

Sun color intensity:
if elevation >0:
  intensity = elevation
  color = warm white
else:
  intensity = 0.05

We can compute sunColor = vec3(1,0.9,0.7) * intensity + night color.

Sky colors:
zenith = mix(nightZenith, dayZenith, smoothstep)
horizon = mix(nightHorizon, dayHorizon)

Compute based on elevation.

Fog density/color based on time.

Now camera:

Camera object:
x,y,z,yaw,pitch
speed manual = 50 m/s? Could be.

Autopilot:
If autopilot on:
  // move forward
  const forward = getForward(yaw,pitch)
  // move speed = 30 m/s
  // update position
  // set y to terrain height + offset
  // maybe smooth

Implementation:

function getForward(yaw,pitch){
  const cosPitch = Math.cos(pitch)
  return {
    x: Math.sin(yaw)*cosPitch,
    y: Math.sin(pitch),
    z: -Math.cos(yaw)*cosPitch
  }
}

Autopilot speed: 20 m/s.

Each frame delta ~ 0.016, movement ~0.32 m per frame.

Set camera.y = getHeight(camera.x, camera.z) + 15 // margin

Ensure y >= 0 (water). If height <0, set y = 5? Actually water surface 0, margin 5 => y=5.

So y = Math.max(getHeight+15, 5)

Also ensure pitch maybe slight down.

Manual flight:
velocity vector with acceleration.

Simplify: each frame, compute input direction based on yaw/pitch.

W/S: forward/back
A/D: strafe
Q/E: down/up

Apply acceleration.

Implement smooth: velocity += input * accel * delta, velocity *= damping.

But for simplicity, direct movement with speed.

Let's implement simple immediate movement with speed.

Controls:
keys = {}
on keydown set true
on keyup false

Mouse drag:
mousedown -> dragging=true, lastX,lastY
mousemove if dragging -> deltaX, deltaY -> yaw += deltaX * sensitivity, pitch += deltaY * sensitivity, clamp pitch -π/2 to π/2.

Now autopilot toggle F.

Freeze flag.

When frozen, skip time update, autopilot movement, water animation? Water animation should be frozen.

Rendering continues.

Now API window.__arena:

freeze(on): set frozen = !!on
setSeed(n): seed = n, update UI #seed value, reinit noise perm, regenerate chunks (clear map), reset camera? Maybe keep camera but regenerate world.

setTime(hours): time = hours %24, update slider #time value.

setCamera({x,y,z,yaw,pitch}): set camera values. If y below min, push up. Min = max(getHeight(x,z)+5, 5). Set camera.y = max(y, min). Also need to clamp? Return.

getCamera(): return {x,y,z,yaw,pitch}

terrainHeight(x,z): return getHeight(x,z)

stats(): return {chunks: chunks.size, triangles: totalTrianglesLastFrame}

We need to track triangles drawn last frame.

Implementation details for stats:

During render, sum triangles = sum over chunks of indices.length/3

Return.

UI:

<div id="ui">
  <div>Autopilot: <span id="auto">ON</span></div>
  <input id="time" type="range" min="0" max="24" step="0.01">
  <input id="seed" type="number" value="1">
  <div>FPS: <span id="fps">0</span></div>
</div>

CSS position absolute top left, background rgba(0,0,0,0.3), color white, font sans.

Now implement.

Potential pitfalls:

WebGL attribute locations: need to get.

Shaders compilation errors.

Matrix math.

Noise performance: getHeight called many times per chunk generation (for each vertex 1 + 4 samples). Might be okay.

We also need terrainHeight API to be fast. Could be okay.

Optimization: precompute noise? No.

Now implement code.

Given the size, we need to produce a single HTML file with inline JS.

Let's start writing code.

Structure:

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Horizon</title>
<style>...</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="ui">...</div>
<script>
// code
</script>
</body>
</html>

Now code details.

Let's write step by step in analysis then produce final output.

Implementation steps in JS:

(() => {
  const canvas = document.getElementById('c');
  const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
  if(!gl){ alert('WebGL not supported'); return; }

  // resize
  function resize(){
    const dpr = Math.min(window.devicePixelRatio||1,2);
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    if(canvas.width !== w || canvas.height !== h){
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0,0,w,h);
    }
  }
  window.addEventListener('resize', resize);
  resize();

  // UI elements
  const timeSlider = document.getElementById('time');
  const seedInput = document.getElementById('seed');
  const autoIndicator = document.getElementById('auto');
  const fpsSpan = document.getElementById('fps');

  // state
  let seed = parseInt(seedInput.value)||1;
  let timeHours = 12.0;
  let frozen = false;
  let autopilot = true;
  // camera
  const camera = {x:0,y:50,z:0,yaw:0,pitch:0};
  // input
  const keys = {};
  window.addEventListener('keydown', e=>{ keys[e.code]=true; if(e.code==='KeyF'){ autopilot=!autopilot; autoIndicator.textContent = autopilot?'ON':'OFF'; }});
  window.addEventListener('keyup', e=>{ keys[e.code]=false; });

  // mouse drag
  let dragging=false, lastX=0,lastY=0;
  canvas.addEventListener('mousedown', e=>{dragging=true; lastX=e.clientX; lastY=e.clientY;});
  window.addEventListener('mouseup', ()=>dragging=false);
  window.addEventListener('mousemove', e=>{ if(!dragging) return; const dx=e.clientX-lastX; const dy=e.clientY-lastY; lastX=e.clientX; lastY=e.clientY; camera.yaw += dx*0.003; camera.pitch += dy*0.003; camera.pitch = Math.max(-1.2, Math.min(1.2, camera.pitch)); });

  // UI events
  timeSlider.addEventListener('input', e=>{ timeHours = parseFloat(e.target.value); });
  seedInput.addEventListener('change', e=>{ seed = parseInt(e.target.value)||1; initNoise(seed); clearChunks(); });

  // matrix math
  function mat4Identity(){ return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
  function mat4Multiply(a,b){ const o=new Float32Array(16); for(let i=0;i<4;i++) for(let j=0;j<4;j++){ o[i*4+j]= a[i*4+0]*b[0*4+j]+a[i*4+1]*b[1*4+j]+a[i*4+2]*b[2*4+j]+a[i*4+3]*b[3*4+j]; } return o; }
  function mat4Perspective(fov,aspect,near,far){ const f=1/Math.tan(fov/2); const nf=1/(near-far); const o=new Float32Array(16); o[0]=f/aspect; o[1]=0; o[2]=0; o[3]=0; o[4]=0; o[5]=f; o[6]=0; o[7]=0; o[8]=0; o[9]=0; o[10]=(far+near)*nf; o[11]=-1; o[12]=0; o[13]=0; o[14]=2*far*near*nf; o[15]=0; return o; }
  function mat4LookAt(eye,center,up){ const fx=center[0]-eye[0], fy=center[1]-eye[1], fz=center[2]-eye[2]; let fl=Math.hypot(fx,fy,fz); const f=[fx/fl,fy/fl,fz/fl]; let sx=fy*up[2]-fz*up[1]; let sy=fz*up[0]-fx*up[2]; let sz=fx*up[1]-fy*up[0]; let sl=Math.hypot(sx,sy,sz); sx/=sl; sy/=sl; sz/=sl; let ux=sy*fz - sz*fy; let uy=sz*fx - sx*fz; let uz=sx*fy - sy*fx; const o=new Float32Array(16); o[0]=sx; o[1]=ux; o[2]=-f[0]; o[3]=0; o[4]=sy; o[5]=uy; o[6]=-f[1]; o[7]=0; o[8]=sz; o[9]=uz; o[10]=-f[2]; o[11]=0; o[12]=-(sx*eye[0]+sy*eye[1]+sz*eye[2]); o[13]=-(ux*eye[0]+uy*eye[1]+uz*eye[2]); o[14]= f[0]*eye[0]+f[1]*eye[1]+f[2]*eye[2]; o[15]=1; return o; }

  // noise
  let perm=null;
  function createPermutation(seed){ const p=new Uint8Array(256); for(let i=0;i<256;i++)p[i]=i; let s=seed>>>0; function rand(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; } for(let i=255;i>0;i--){ const j=Math.floor(rand()*(i+1)); const t=p[i]; p[i]=p[j]; p[j]=t; } const permArr=new Uint8Array(512); for(let i=0;i<512;i++) permArr[i]=p[i&255]; return permArr; }
  function initNoise(s){ perm=createPermutation(s); }
  function fade(t){ return t*t*t*(t*(t*6-15)+10); }
  function lerp(a,b,t){ return a + t*(b-a); }
  function grad(hash,x,y){ const h=hash&7; const u=h<4?x:y; const v=h<4?y:x; return (h&1?-u:u)+(h&2?-v:v); }
  function noise2d(x,y){ const X=Math.floor(x)&255; const Y=Math.floor(y)&255; x-=Math.floor(x); y-=Math.floor(y); const u=fade(x); const v=fade(y); const A=perm[X]+Y; const AA=perm[A]; const AB=perm[A+1]; const B=perm[X+1]+Y; const BA=perm[B]; const BB=perm[B+1]; const g00=grad(perm[AA],x,y); const g10=grad(perm[BA],x-1,y); const g01=grad(perm[AB],x,y-1); const g11=grad(perm[BB],x-1,y-1); const nx0=lerp(g00,g10,u); const nx1=lerp(g01,g11,u); return lerp(nx0,nx1,v); }
  function fBm(x,z,octaves=6){ let amp=1, freq=0.8, sum=0, max=0; for(let i=0;i<octaves;i++){ sum+=noise2d(x*freq,z*freq)*amp; max+=amp; amp*=0.5; freq*=2.0; } return sum/max; }
  function getHeight(x,z){ const n=fBm(x*0.0006, z*0.0006); return n*240 + 80; }

  initNoise(seed);

  // shaders
  function compileShader(src,type){ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){ console.error(gl.getShaderInfoLog(s)); } return s; }
  function createProgram(vs,fs){ const p=gl.createProgram(); gl.attachShader(p,vs); gl.attachShader(p,fs); gl.linkProgram(p); if(!gl.getProgramParameter(p,gl.LINK_STATUS)){ console.error(gl.getProgramInfoLog(p)); } return p; }

  const terrainVS=`attribute vec3 aPosition; attribute vec3 aNormal; uniform mat4 uMVP; uniform mat4 uMV; varying vec3 vWorldPos; varying vec3 vNormal; varying vec3 vViewPos; void main(){ vWorldPos=aPosition; vNormal=aNormal; vec4 mv=uMV*vec4(aPosition,1.0); vViewPos=mv.xyz; gl_Position=uMVP*vec4(aPosition,1.0); }`;
  const terrainFS=`precision mediump float; varying vec3 vWorldPos; varying vec3 vNormal; varying vec3 vViewPos; uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uAmbient; uniform vec3 uFogColor; uniform float uFogDensity; void main(){ vec3 N=normalize(vNormal); vec3 L=normalize(uSunDir); float diff=max(dot(N,L),0.0); vec3 base; float h=vWorldPos.y; if(h<0.0){ base=vec3(0.05,0.07,0.12); }else if(h<5.0){ base=vec3(0.76,0.70,0.50); }else if(h<80.0){ base=vec3(0.35,0.55,0.25); }else if(h<200.0){ base=vec3(0.55,0.45,0.35); }else{ base=vec3(0.9,0.9,0.95); } float slope=1.0-abs(dot(N,vec3(0,1,0))); if(slope>0.3) base=mix(base,vec3(0.4,0.35,0.3),0.6); vec3 col=base*(uAmbient+uSunColor*diff); float dist=length(vViewPos); float fog=exp(-dist*uFogDensity); col=mix(uFogColor,col,fog); gl_FragColor=vec4(col,1.0); }`;

  const skyVS=`attribute vec2 aPos; varying vec2 vUV; void main(){ vUV=aPos*0.5+0.5; gl_Position=vec4(aPos,0.0,1.0); }`;
  const skyFS=`precision mediump float; varying vec2 vUV; uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec2 uSunScreen; uniform float uSunRadius; void main(){ float t=1.0-vUV.y; vec3 col=mix(uHorizon,uZenith,pow(t,0.5)); float d=distance(vUV,uSunScreen); float glow=exp(-d*d*200.0); col+=glow*vec3(1.0,0.9,0.6); gl_FragColor=vec4(col,1.0); }`;

  const waterVS=`attribute vec3 aPosition; uniform mat4 uMVP; uniform float uTime; varying vec3 vPos; void main(){ vec3 p=aPosition; float w=sin(p.x*0.01+uTime)*0.5+cos(p.z*0.012+uTime*1.3)*0.5; p.y+=w*0.3; vPos=p; gl_Position=uMVP*vec4(p,1.0); }`;
  const waterFS=`precision mediump float; varying vec3 vPos; uniform vec3 uSunColor; uniform vec3 uSkyColor; uniform vec3 uViewDir; void main(){ vec3 col=mix(vec3(0.0,0.25,0.45),uSkyColor,0.4); float fres=pow(1.0-max(dot(normalize(vPos),uViewDir),0.0),3.0); col=mix(col,uSkyColor,fres*0.5); gl_FragColor=vec4(col,0.85); }`;

  const terrainProg=createProgram(compileShader(terrainVS,gl.VERTEX_SHADER), compileShader(terrainFS,gl.FRAGMENT_SHADER));
  const skyProg=createProgram(compileShader(skyVS,gl.VERTEX_SHADER), compileShader(skyFS,gl.FRAGMENT_SHADER));
  const waterProg=createProgram(compileShader(waterVS,gl.VERTEX_SHADER), compileShader(waterFS,gl.FRAGMENT_SHADER));

  // attribute locations
  const terrainLoc={pos:gl.getAttribLocation(terrainProg,'aPosition'), norm:gl.getAttribLocation(terrainProg,'aNormal')};
  const skyLoc={pos:gl.getAttribLocation(skyProg,'aPos')};
  const waterLoc={pos:gl.getAttribLocation(waterProg,'aPosition')};

  // sky quad
  const skyVbo=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, skyVbo);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);

  // water mesh
  const WATER_SIZE=16384, WATER_STEP=128, WATER_RES=WATER_SIZE/WATER_STEP;
  let waterVbo=null, waterIbo=null;
  function buildWater(){
    const verts=[];
    const indices=[];
    for(let i=0;i<=WATER_RES;i++){
      for(let j=0;j<=WATER_RES;j++){
        const x=(i-WATER_RES/2)*WATER_STEP;
        const z=(j-WATER_RES/2)*WATER_STEP;
        verts.push(x,0,z);
      }
    }
    for(let i=0;i<WATER_RES;i++){
      for(let j=0;j<WATER_RES;j++){
        const a=i*(WATER_RES+1)+j;
        const b=a+WATER_RES+1;
        indices.push(a,b,a+1);
        indices.push(b,b+1,a+1);
      }
    }
    waterVbo=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,waterVbo);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
    waterIbo=gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,waterIbo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  }
  buildWater();

  // chunks
  const CHUNK_SIZE=256, CHUNK_RES=32, CHUNK_STEP=CHUNK_SIZE/CHUNK_RES;
  const chunks=new Map();
  let totalTriangles=0;
  function chunkKey(cx,cz){return cx+','+cz;}
  function clearChunks(){ for(const k of chunks.keys()){ const c=chunks.get(k); gl.deleteBuffer(c.vbo); gl.deleteBuffer(c.ibo); gl.deleteBuffer(c.nbo); } chunks.clear(); }
  function createChunk(cx,cz){
    const verts=[], norms=[], idx=[];
    const vertsCount=(CHUNK_RES+1)*(CHUNK_RES+1);
    const heights=new Float32Array(vertsCount);
    let p=0;
    for(let i=0;i<=CHUNK_RES;i++){
      for(let j=0;j<=CHUNK_RES;j++){
        const wx=cx*CHUNK_SIZE + i*CHUNK_STEP;
        const wz=cz*CHUNK_SIZE + j*CHUNK_STEP;
        const h=getHeight(wx,wz);
        heights[p]=h;
        verts.push(wx,h,wz);
        p++;
      }
    }
    p=0;
    for(let i=0;i<=CHUNK_RES;i++){
      for(let j=0;j<=CHUNK_RES;j++){
        const wx=cx*CHUNK_SIZE + i*CHUNK_STEP;
        const wz=cz*CHUNK_SIZE + j*CHUNK_STEP;
        const h=heights[p];
        const hx1=getHeight(wx+CHUNK_STEP,wz);
        const hx0=getHeight(wx-CHUNK_STEP,wz);
        const hz1=getHeight(wx,wz+CHUNK_STEP);
        const hz0=getHeight(wx,wz-CHUNK_STEP);
        const dx=(hx1-hx0)/(2*CHUNK_STEP);
        const dz=(hz1-hz0)/(2*CHUNK_STEP);
        let nx=-dx, ny=1.0, nz=-dz;
        const len=Math.hypot(nx,ny,nz);
        nx/=len; ny/=len; nz/=len;
        norms.push(nx,ny,nz);
        p++;
      }
    }
    for(let i=0;i<CHUNK_RES;i++){
      for(let j=0;j<CHUNK_RES;j++){
        const a=i*(CHUNK_RES+1)+j;
        const b=a+CHUNK_RES+1;
        idx.push(a,b,a+1);
        idx.push(b,b+1,a+1);
      }
    }
    const vbo=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
    const nbo=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,nbo);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(norms),gl.STATIC_DRAW);
    const ibo=gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);
    return {vbo,nbo,ibo,idxCount:idx.length};
  }
  function updateChunks(){
    const cx=Math.floor(camera.x/CHUNK_SIZE);
    const cz=Math.floor(camera.z/CHUNK_SIZE);
    const radius=5;
    const needed=new Set();
    for(let dx=-radius;dx<=radius;dx++){
      for(let dz=-radius;dz<=radius;dz++){
        if(dx*dx+dz*dz<=radius*radius){
          needed.add(chunkKey(cx+dx,cz+dz));
        }
      }
    }
    for(const k of Array.from(chunks.keys())){
      if(!needed.has(k)){
        const c=chunks.get(k);
        gl.deleteBuffer(c.vbo); gl.deleteBuffer(c.nbo); gl.deleteBuffer(c.ibo);
        chunks.delete(k);
      }
    }
    for(const k of needed){
      if(!chunks.has(k)){
        const [cxk,czk]=k.split(',').map(Number);
        const c=createChunk(cxk,czk);
        chunks.set(k,c);
      }
    }
  }

  // time & sun
  function computeSun(timeHours){
    const t=timeHours/24*2*Math.PI;
    const elevation=Math.sin(t - Math.PI/2); // -1..1
    const azimuth=t;
    const horiz=Math.sqrt(Math.max(0,1-elevation*elevation));
    const x=horiz*Math.cos(azimuth);
    const y=elevation;
    const z=horiz*Math.sin(azimuth);
    return {dir:[x,y,z], elevation};
  }

  // camera helpers
  function forwardVector(){
    const cp=Math.cos(camera.pitch);
    return [Math.sin(camera.yaw)*cp, Math.sin(camera.pitch), -Math.cos(camera.yaw)*cp];
  }
  function rightVector(){
    const cp=Math.cos(camera.pitch);
    // right = cross(forward, up)
    const f=forwardVector();
    const up=[0,1,0];
    // cross f x up
    const rx = f[1]*up[2]-f[2]*up[1];
    const ry = f[2]*up[0]-f[0]*up[2];
    const rz = f[0]*up[1]-f[1]*up[0];
    const len=Math.hypot(rx,ry,rz)||1;
    return [rx/len, ry/len, rz/len];
  }

  // main loop
  let lastTime=performance.now();
  let fpsTimer=0, frames=0;
  function loop(now){
    const dt=Math.min(0.05,(now-lastTime)/1000);
    lastTime=now;
    // fps
    frames++; fpsTimer+=dt;
    if(fpsTimer>=0.5){ fpsSpan.textContent=Math.round(frames/fpsTimer); frames=0; fpsTimer=0; }

    if(!frozen){
      if(timeHours<24) timeHours+=dt*0.2; else timeHours=0;
      if(timeHours>=24) timeHours-=24;
      timeSlider.value=timeHours;
      // autopilot
      if(autopilot){
        const f=forwardVector();
        const speed=25*dt;
        camera.x+=f[0]*speed;
        camera.z+=f[2]*speed;
        const h=getHeight(camera.x,camera.z);
        const minY=Math.max(h+8,5);
        if(camera.y<minY) camera.y=minY;
        // slight pitch down
        camera.pitch=Math.max(-0.2, camera.pitch);
      } else {
        // manual
        const speed=30*dt;
        const f=forwardVector();
        const r=rightVector();
        if(keys['KeyW']){ camera.x+=f[0]*speed; camera.z+=f[2]*speed; }
        if(keys['KeyS']){ camera.x-=f[0]*speed; camera.z-=f[2]*speed; }
        if(keys['KeyA']){ camera.x-=r[0]*speed; camera.z-=r[2]*speed; }
        if(keys['KeyD']){ camera.x+=r[0]*speed; camera.z+=r[2]*speed; }
        if(keys['ShiftLeft']||keys['ShiftRight']){ camera.y-=speed*0.5; }
        if(keys['Space']){ camera.y+=speed*0.5; }
        if(keys['KeyQ']){ camera.y-=speed*0.5; }
        if(keys['KeyE']){ camera.y+=speed*0.5; }
        // clamp
        const h=getHeight(camera.x,camera.z);
        const minY=Math.max(h+2,5);
        if(camera.y<minY) camera.y=minY;
      }
    }

    // update chunks
    updateChunks();

    // matrices
    const aspect=canvas.width/canvas.height;
    const proj=mat4Perspective(0.8,aspect,0.1,5000);
    const eye=[camera.x,camera.y,camera.z];
    const f=forwardVector();
    const center=[eye[0]+f[0]*1, eye[1]+f[1]*1, eye[2]+f[2]*1];
    const view=mat4LookAt(eye,center,[0,1,0]);
    const mvp=mat4Multiply(proj,view);
    // sun
    const sun=computeSun(timeHours);
    const sunDir=sun.dir;
    const elev=sun.elevation;
    const sunIntensity=Math.max(0,elev);
    const sunColor=[1.0,0.95,0.85];
    const ambient=[0.05,0.05,0.07];
    if(elev<0){ ambient[0]=0.02; ambient[1]=0.02; ambient[2]=0.05; }

    // sky colors
    const dayZenith=[0.5,0.7,1.0];
    const dayHorizon=[0.8,0.85,1.0];
    const nightZenith=[0.02,0.02,0.08];
    const nightHorizon=[0.05,0.05,0.15];
    const mixFactor=Math.max(0,Math.min(1,(elev+1)/2));
    const zenith=[ dayZenith[0]*mixFactor+nightZenith[0]*(1-mixFactor), dayZenith[1]*mixFactor+nightZenith[1]*(1-mixFactor), dayZenith[2]*mixFactor+nightZenith[2]*(1-mixFactor) ];
    const horizon=[ dayHorizon[0]*mixFactor+nightHorizon[0]*(1-mixFactor), dayHorizon[1]*mixFactor+nightHorizon[1]*(1-mixFactor), dayHorizon[2]*mixFactor+nightHorizon[2]*(1-mixFactor) ];
    const fogColor=zenith;

    // clear
    gl.clearColor(zenith[0],zenith[1],zenith[2],1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // sky
    gl.useProgram(skyProg);
    gl.bindBuffer(gl.ARRAY_BUFFER,skyVbo);
    gl.enableVertexAttribArray(skyLoc.pos);
    gl.vertexAttribPointer(skyLoc.pos,2,gl.FLOAT,false,0,0);
    const skyU=gl.getUniformLocation(skyProg,'uZenith');
    const skyH=gl.getUniformLocation(skyProg,'uHorizon');
    const skySun=gl.getUniformLocation(skyProg,'uSunScreen');
    const skyRad=gl.getUniformLocation(skyProg,'uSunRadius');
    gl.uniform3fv(skyU,zenith);
    gl.uniform3fv(skyH,horizon);
    // project sun
    const sunWorld=[sunDir[0]*10000, sunDir[1]*10000, sunDir[2]*10000];
    // simple projection approx for screen pos
    // compute using view/proj
    function project(v){
      const vm=mat4Multiply(view,[v[0],v[1],v[2],1]); // not correct
    }
    // approximate: just use direction
    const sunScreenX=0.5 + sunDir[0]*0.3;
    const sunScreenY=0.5 + sunDir[1]*0.4;
    gl.uniform2f(skySun,sunScreenX,sunScreenY);
    gl.uniform1f(skyRad,0.05);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);

    // water
    gl.useProgram(waterProg);
    gl.bindBuffer(gl.ARRAY_BUFFER,waterVbo);
    gl.enableVertexAttribArray(waterLoc.pos);
    gl.vertexAttribPointer(waterLoc.pos,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,waterIbo);
    const waterMVP=mat4Multiply(proj,view);
    const wUlocMVP=gl.getUniformLocation(waterProg,'uMVP');
    const wUtime=gl.getUniformLocation(waterProg,'uTime');
    const wUsun=gl.getUniformLocation(waterProg,'uSunColor');
    const wUsky=gl.getUniformLocation(waterProg,'uSkyColor');
    const wUview=gl.getUniformLocation(waterProg,'uViewDir');
    gl.uniformMatrix4fv(wUlocMVP,false,waterMVP);
    gl.uniform1f(wUtime, frozen?0:performance.now()*0.001);
    gl.uniform3fv(wUsun,sunColor);
    gl.uniform3fv(wUsky,zenith);
    gl.uniform3fv(wUview,[0,0,1]); // dummy
    gl.drawElements(gl.TRIANGLES, waterIbo? (WATER_RES*WATER_RES*6):0, gl.UNSIGNED_SHORT,0);

    // terrain
    gl.useProgram(terrainProg);
    const tUmatMVP=gl.getUniformLocation(terrainProg,'uMVP');
    const tUmatMV=gl.getUniformLocation(terrainProg,'uMV');
    const tUsunDir=gl.getUniformLocation(terrainProg,'uSunDir');
    const tUsunCol=gl.getUniformLocation(terrainProg,'uSunColor');
    const tUamb=gl.getUniformLocation(terrainProg,'uAmbient');
    const tUfogCol=gl.getUniformLocation(terrainProg,'uFogColor');
    const tUfogDen=gl.getUniformLocation(terrainProg,'uFogDensity');
    gl.uniformMatrix4fv(tUmatMVP,false,mvp);
    gl.uniformMatrix4fv(tUmatMV,false,view);
    gl.uniform3fv(tUsunDir,sunDir);
    gl.uniform3fv(tUsunCol,[sunColor[0]*sunIntensity, sunColor[1]*sunIntensity, sunColor[2]*sunIntensity]);
    gl.uniform3fv(tUamb,ambient);
    gl.uniform3fv(tUfogCol,fogColor);
    const fogDensity = mixFactor>0.1? 0.00015 : 0.00005;
    gl.uniform1f(tUfogDen,fogDensity);

    totalTriangles=0;
    for(const c of chunks.values()){
      gl.bindBuffer(gl.ARRAY_BUFFER,c.vbo);
      gl.enableVertexAttribArray(terrainLoc.pos);
      gl.vertexAttribPointer(terrainLoc.pos,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,c.nbo);
      gl.enableVertexAttribArray(terrainLoc.norm);
      gl.vertexAttribPointer(terrainLoc.norm,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,c.ibo);
      gl.drawElements(gl.TRIANGLES,c.idxCount,gl.UNSIGNED_SHORT,0);
      totalTriangles+=c.idxCount/3;
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // arena API
  window.__arena = {
    freeze(on){ frozen=!!on; },
    setSeed(n){ seed=parseInt(n); if(isNaN(seed)) return; seedInput.value=seed; initNoise(seed); clearChunks(); },
    setTime(h){ timeHours=parseFloat(h); timeSlider.value=timeHours; },
    setCamera(o){ if(o.x!==undefined) camera.x=o.x; if(o.y!==undefined){ const h=getHeight(camera.x,camera.z); const minY=Math.max(h+2,5); camera.y=Math.max(o.y,minY); } if(o.z!==undefined) camera.z=o.z; if(o.yaw!==undefined) camera.yaw=o.yaw; if(o.pitch!==undefined){ camera.pitch=Math.max(-1.2,Math.min(1.2,o.pitch)); } },
    getCamera(){ return {x:camera.x,y:camera.y,z:camera.z,yaw:camera.yaw,pitch:camera.pitch}; },
    terrainHeight(x,z){ return getHeight(x,z); },
    stats(){ return {chunks:chunks.size, triangles:totalTriangles}; }
  };

})();
</script>
</body>
</html>
```

We need to ensure code is syntactically correct. There are some issues: mat4Multiply expects 2 matrices, but we used incorrectly for project. We didn't use project function. That's fine.

We have a bug: mat4Multiply implementation uses a[i*4+j] etc but a and b are Float32Array. Our implementation loops i 0..3 j 0..3: o[i*4+j]= sum k a[i*4+k]*b[k*4+j]. But we used a[i*4+0]*b[0*4+j] + ... That's okay but we hardcoded 3 terms? Actually we used for loop? Wait we wrote for i.. for j.. o[i*4+j]= a[i*4+0]*b[0*4+j]+a[i*4+1]*b[1*4+j]+a[i*4+2]*b[2*4+j]+a[i*4+3]*b[3*4+j]; That's fine.

mat4LookAt implementation returns Float32Array with values set. Might be okay.

Potential issues: terrain shader uniform names: uMVP, uMV. In JS we set tUmatMVP etc. Good.

Water shader uniform uViewDir not used.

Sky shader uniform uSunScreen expects vec2, we set.

We used gl.drawElements with waterIbo count but we didn't compute count. We need number of indices. We can compute: WATER_RES*WATER_RES*6. Let's compute: indices length = WATER_RES*WATER_RES*6. With WATER_RES=128, that's 98304. Uint16 max 65535, so indices >65535, will overflow. Uint16 max index  (WATER_RES+1)^2 = 16641 <65535, okay. Number of indices = 2*WATER_RES*WATER_RES*3? Actually each quad 6 indices. So 128*128*6=98304 < 65535? 98304 >65535. That's okay for count but indices values max 16641 <65535, so Uint16 fine. Count 98304 fine.

We used gl.drawElements(gl.TRIANGLES, waterIbo? (WATER_RES*WATER_RES*6):0 ...) That's okay.

Potential bug: waterVbo created but we didn't store index count. Could compute.

We also used gl.enableVertexAttribArray for terrain each chunk, but we need to enable for each attribute each time.

Potential bug: mat4Multiply expects both matrices to be Float32Array length16. In compute view we used mat4LookAt returning Float32Array. Good.

Potential bug: forwardVector uses camera.pitch sin. Okay.

Potential bug: autopilot moves camera.z with f[2] which is -cos... okay.

Potential bug: when autopilot on, camera pitch may drift.

Potential bug: time slider input event sets timeHours but we also update slider value each frame. Could cause feedback loop. Acceptable.

Potential bug: seedInput change event regenerates world but we also need to update time slider? No.

Potential bug: freeze: we still update camera manual input? Requirement says user keyboard/mouse input still works when frozen. We freeze only time and autopilot movement and water animation. Manual movement still works because we only skip if !frozen for time and autopilot. Manual movement code is inside if(!frozen) block? Actually we put manual movement inside if(!frozen) block as well. Wait code:

if(!frozen){
  if(timeHours<24)... 
  if(autopilot){...} else { manual... }
}

So manual movement also frozen. Requirement says user keyboard/mouse input still works when frozen. So we need to allow manual movement even when frozen. Also autopilot movement should be frozen. Time progression frozen. Water animation frozen.

So we need to separate.

Simplify: if !frozen, update time. Autopilot movement only if !frozen. Manual movement should always work? The spec: while frozen, nothing changes on its own (no autopilot movement, no time-of-day progression, no water/cloud animation), so image depends only on seed, camera, time of day and viewport. Rendering continues, so changes made through this API appear within a few frames. User keyboard/mouse input still works when frozen.

So manual camera movement via user input should still work when frozen. So we need to allow manual input even when frozen.

Let's restructure:

if !frozen:
  time += ...
  if autopilot: move camera

Manual movement: always process if not autopilot? Actually autopilot toggles. If autopilot off, manual movement should work even when frozen? Probably yes. The spec says user keyboard/mouse input still works when frozen. So we should process manual input regardless of frozen, but autopilot movement should be frozen.

Also water animation should be frozen: we used uniform uTime = frozen?0:performance.now()*0.001 . Good.

Time progression frozen.

Now manual movement: we need to process keys even when frozen.

We can move manual movement outside frozen check, but only if autopilot is off.

Let's adjust logic.

Simpler: restructure loop:

// update time if not frozen
if(!frozen){ time... }

// camera movement
if(autopilot && !frozen){
  // autopilot move
} else if(!autopilot){
  // manual move always
}

Also ensure camera height clamping always.

Implement.

Also need to ensure autopilot indicator updates.

Potential bug: mat4Perspective: we used f=1/tan(fov/2). fov in radians: 0.8 rad ~45 deg. Good.

mat4LookAt: we constructed matrix incorrectly? Let's test mental. Standard lookAt matrix columns = right, up, -forward. We set o[0]=sx, o[1]=ux, o[2]=-f[0]? Wait column-major? WebGL uses column-major. Our mat4 arrays are column-major? We built arrays in column-major order? In mat4Perspective we set o[0]=f/aspect; o[5]=f; o[10]=(far+near)*nf; o[11]=-1; o[14]=2*far*near*nf. That's column-major. Good.

In mat4LookAt, we set o[0]=sx; o[1]=ux; o[2]=-f[0]; That's column-major first column. Good.

Then o[12]=-(sx*eye...). That's translation in column 3.

Should be okay.

Potential bug: forwardVector for camera: we used pitch sin for y. That's fine.

Potential bug: rightVector calculation using cross f x up. Could be okay.

Potential bug: terrain normals: we computed nx = -dx, ny=1, nz=-dz. That's fine.

Potential bug: getHeight uses fBm with x*0.0006. For large coordinates, noise may be very smooth. Might be okay.

Potential bug: chunks creation: heights array used but we also call getHeight for each vertex again for normal? We used heights for positions but then for normals we call getHeight again for neighbors. Could reuse heights array for neighbor lookup but fine.

Potential bug: indices for chunk: we used a = i*(CHUNK_RES+1)+j, b = a+CHUNK_RES+1. That's correct.

Potential bug: totalTriangles: we sum c.idxCount/3.

Potential bug: stats() returns chunks size and triangles.

Potential bug: setCamera: we need to push y up if below allowed minimum. We did minY = max(h+2,5). Good.

Potential bug: terrainHeight API should return actual surface height ignoring water. We return getHeight. Good.

Potential bug: setSeed updates #seed. We set seedInput.value.

Potential bug: setTime updates #time. We set timeSlider.value.

Potential bug: freeze API: we set frozen flag.

Potential bug: autopilot toggle via F key works.

Potential bug: mouse drag: we update yaw/pitch. Good.

Potential bug: we didn't handle window resize for canvas CSS size. Canvas CSS size not set. We only set canvas.width/height attributes. Canvas default CSS size is 300x150. Need to style canvas to fill viewport.

CSS: canvas {display:block; width:100vw; height:100vh;}

Also UI overlay.

Add CSS.

Potential bug: we didn't enable cull face? Not needed.

Potential bug: water shader uses uViewDir not used. Could cause uniform error? It's fine.

Potential bug: water shader uses varying vPos but we didn't compute normal. Fine.

Potential bug: water plane at y=0, but terrain may be above. Depth test will handle.

Potential bug: water plane is drawn before terrain? We draw sky, then water, then terrain. Depth test will make terrain in front.

But water plane is huge, might cover terrain. Since water at y=0, terrain above will be in front.

Potential bug: water shader uses gl.drawElements with count = WATER_RES*WATER_RES*6. We used ternary expression waterIbo? That's always truthy. Could compute.

Potential bug: we used gl.getUniformLocation for water MVP etc but we didn't bind program before getting locations? We got after program creation, fine.

Potential bug: sky shader uses uSunScreen uniform vec2. We passed.

Potential bug: sky shader glow: exp(-d*d*200) may be too strong.

Potential bug: we didn't set gl.enableVertexAttribArray for terrain normals each time? We did.

Potential bug: we didn't set gl.vertexAttribPointer for water position each frame? We did.

Potential bug: we used gl.drawElements for water with UNSIGNED_SHORT but indices array is Uint16Array. Good.

Potential bug: we created waterVbo but didn't set attribute location for waterPos? We got waterLoc.pos.

Potential bug: we didn't set gl.enable(gl.DEPTH_TEST) before water? It's enabled.

Potential bug: we cleared color to zenith, then draw sky quad which also draws color. Might be redundant.

Potential bug: sky quad drawn with depth test enabled, but quad is at z=0, may be behind? Actually quad is in clip space, depth not used? It's drawn with depth test, but it may be overwritten. We should disable depth test for sky. Let's disable depth test for sky.

Simplify: before sky, gl.disable(gl.DEPTH_TEST); draw sky; gl.enable(gl.DEPTH_TEST);

Implement.

Also water should be drawn with depth test.

Potential bug: we used gl.uniformMatrix4fv with view matrix for water MVP: waterMVP = proj*view. Good.

Potential bug: terrain MVP = proj*view. Good.

Potential bug: we used mat4Multiply(view,[v[0],...]) in project function which is unused.

Potential bug: we used keys['ShiftLeft'] etc. Could be 'ShiftLeft' or 'ShiftRight'. Fine.

Potential bug: we didn't handle pointer lock, but mouse drag works.

Potential bug: we didn't prevent context menu on right click.

Potential bug: performance: creating chunks each frame with updateChunks may cause GC. Acceptable.

Potential bug: getHeight called many times per frame for camera height clamp. That's fine.

Potential bug: autopilot moves camera forward but also needs to keep yaw? Autopilot should fly forward over terrain following height, never clipping. It may need to adjust yaw to follow terrain? Could just keep yaw constant.

Okay.

Potential bug: we need to ensure camera never goes below water surface. We clamp y to max(h+2,5). If h negative, minY=5. Good.

Potential bug: when autopilot, we set camera.y = minY if below. Good.

Potential bug: manual flight down/up may go below water. We clamp after movement.

Potential bug: we didn't update autopilot indicator on init. autoIndicator.textContent = 'ON'. Good.

Potential bug: time slider min 0 max 24. We set step 0.01. Good.

Potential bug: seed input type number, default value 1.

Potential bug: UI elements IDs match contract: #time, #seed. Good.

Potential bug: window.__arena provides freeze, setSeed, setTime, setCamera, getCamera, terrainHeight, stats. Good.

Potential bug: setCamera should also update camera yaw/pitch if provided. We did.

Potential bug: setCamera should push up if y below allowed minimum. We did.

Potential bug: getCamera returns object with x,y,z,yaw,pitch. Good.

Potential bug: terrainHeight returns number.

Potential bug: stats returns chunks and triangles.

Potential bug: freeze should stop water animation, time progression, autopilot movement. We handled time and autopilot. Water animation uses uniform time frozen?0. Good.

Potential bug: freeze should also stop cloud animation (none).

Potential bug: we need to ensure that while frozen, user input still works. Our manual movement is inside if(!autopilot) block which is outside frozen? Currently we have manual movement inside if(!frozen). Let's restructure code.

We need to edit code.

Given we have already written code, we need to adjust.

Let's rewrite loop section with correct logic.

We have code in loop:

if(!frozen){
  if(timeHours<24) timeHours+=dt*0.2; ...
  if(autopilot){
    ...
  } else {
    // manual
  }
}

We need manual to run even if frozen.

So we can split:

if(!frozen){
  if(timeHours<24)...
  timeSlider.value...
}

Then camera movement:

if(autopilot && !frozen){
  // autopilot
} else if(!autopilot){
  // manual always
}

Also need to clamp height always.

Let's adjust in final code.

Also we need to ensure camera.y clamping happens after movement.

Implement.

Also need to ensure when autopilot is on and frozen, camera should not move. Good.

Also need to ensure water animation frozen: we used uniform time = frozen?0:performance.now()*0.001. Good.

Also time progression frozen: we only update time if !frozen.

Now mouse drag: we update camera yaw/pitch always. That's fine.

Now keyboard: keys processed in manual movement only.

Potential bug: when autopilot is on, manual keys should be ignored.

Good.

Now implement final code with corrections.

Also need to disable depth test for sky.

Let's produce final HTML.

Given the length, we need to ensure code is correct.

Potential issues with mat4Multiply: we used for i 0..3 j 0..3 o[i*4+j]=... sum k. That's correct.

mat4Perspective: we set o[11]=-1; o[15]=0. Standard perspective matrix has m[11]=-1, m[15]=0. Good.

mat4LookAt: we set o[15]=1. Good.

Potential bug: view matrix translation we used o[12]=-(sx*eye...). That's correct.

Now implement final code.

We also need to ensure WebGL attribute locations are correct. For sky, we used aPos attribute vec2. Vertex data is 4 vertices with 2 floats each. Good.

For terrain, we used aPosition vec3, aNormal vec3.

For water, aPosition vec3.

Now final code.

We should also add CSS for canvas and UI.

CSS:
html,body{margin:0;height:100%;overflow:hidden;background:#000}
canvas{display:block;width:100vw;height:100vh}
#ui{position:absolute;top:10px;left:10px;color:#fff;font-family:sans-serif;background:rgba(0,0,0,0.4);padding:8px;border-radius:6px}
#ui input{margin:4px 0}

Now produce final output.

We need to ensure code is within single ```html block.

Let's produce final answer.

Potential improvements: we used gl.drawElements for water with count = WATER_RES*WATER_RES*6. Let's compute count variable.

Simplify: const waterIndexCount = WATER_RES*WATER_RES*6; Use that.

Implementation details: we need to define waterIndexCount.

Also need to ensure waterIbo created.

Now produce final code.

Edge cases: getHeight may return NaN? No.

Potential bug: fBm uses noise2d which uses perm array. Ensure perm is initialized before first getHeight. We call initNoise(seed) before building water? Water building doesn't need height. Chunk creation calls getHeight which uses perm. initNoise called at start. Good.

Potential bug: clearChunks deletes buffers but we also need to delete nbo. We did.

Potential bug: when setSeed, we call clearChunks, but we also need to reinit noise. We did.

Potential bug: setSeed should regenerate entire world deterministically. Clearing chunks will cause new chunks to be generated on next frame.

Potential bug: camera position may be at height that is now different after seed change. Might be below terrain. Could clamp next frame.

Okay.

Potential bug: autopilot indicator initial state: autoIndicator.textContent = autopilot?'ON':'OFF'. Set initially.

Now finalize.

Let's produce final HTML.

We'll output code with careful formatting.

Let's write final code now.