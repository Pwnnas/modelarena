Let me break down this task:

1. Raw WebGL (no libraries) - I need to write my own matrix math, shaders, buffer management
2. Infinite procedural terrain with fBm noise
3. Water, sky, fog, day/night cycle
4. Camera with autopilot and manual flight
5. UI: time slider, seed input, autopilot indicator, FPS counter
6. Grader contract with `window.__arena` API

Let me plan the architecture:

**Matrix Math**: I'll write minimal mat4 functions (perspective, lookAt, multiply, etc.)

**Noise**: I'll implement a hash-based 2D noise with fBm. Needs to be deterministic for a given seed.

**Terrain Generation**:
- Chunk-based system (e.g., 128x128 vertices per chunk)
- LOD: multiple chunk sizes (256x256, 128x128, 64x64)
- Generate heightmap using fBm
- Compute normals analytically or from finite differences
- Color based on height and slope

**Water**:
- Plane at y=0 with animated waves
- Fresnel-based sky reflection
- Alpha blending at shoreline

**Sky**:
- Fullscreen quad or background render
- Gradient based on sun position
- Sun disk
- Stars at night

**Day/Night Cycle**:
- Time 0-24, advances ~1 day per 2 minutes
- Sun position from time
- Light color/intensity changes
- Sky/fog colors follow

**Camera**:
- Autopilot: flies forward, follows terrain
- Manual: WASD + mouse drag
- Never below terrain + margin

**Chunk Management**:
- Around camera, generate nearby chunks, discard far ones
- Priority-based loading

Let me think about the WebGL setup:
- I'll use WebGL 1 for broader compatibility, though WebGL2 would be fine too
- Actually let me use WebGL2 since the target is latest Chrome

**Shaders**:
- Terrain vertex shader: takes position, height, computes color based on height/slope, applies fog
- Terrain fragment shader: applies lighting, fog
- Water vertex/fragment: animated waves, fresnel
- Sky: fullscreen quad with gradient

Let me think about chunk LOD:
- Close: 64x64 chunks with 63x63 quads each (high detail)
- Medium: 128x128 chunks
- Far: 256x256 chunks

Actually, let me simplify. I'll use:
- Near chunks: 128m x 128m, 32x32 grid (4m resolution) - within ~400m
- Mid chunks: 256m x 256m, 32x32 grid (8m resolution) - 400m to ~800m
- Far chunks: 512m x 512m, 32x32 grid (16m resolution) - 800m to ~1500m

Wait, for seam-free rendering I need to be careful. Let me use a simpler approach:
- All chunks are the same size (e.g., 256m x 256m)
- Different LOD levels have different vertex densities
- Adjacent LOD chunks share edge vertices to prevent cracks

Actually, the simplest approach for no cracks: use the same grid resolution for all chunks at the same LOD level, and ensure that adjacent chunks at the same LOD share vertices. For LOD transitions, I'll use a screen-space error or distance-based approach where the LOD ring boundary is fixed (not moving with camera) to prevent popping.

Let me use a tile-based approach:
- Base tile size: 128m
- LOD 0: 128x128 vertices per tile (1m resolution) - too many vertices
- Let me think differently.

Actually, for performance at 1280x800, let me use:
- Tile size: 256m
- LOD 0 (near): 33x33 vertices (8m resolution) - covers 0-512m radius
- LOD 1 (mid): 17x17 vertices (16m resolution) - covers 512-1024m radius  
- LOD 2 (far): 9x9 vertices (32m resolution) - covers 1024-1536m radius

Hmm, 33x33 = 1089 vertices per chunk, that's fine. With 32x32 = 1024 quads = 2048 triangles per chunk.

For a 512m radius at LOD 0: (512/256)^2 * 4 = 4 chunks * 4 = 16 chunks * 2048 = 32768 triangles
For 1024m at LOD 1: (1024/256)^2 - (512/256)^2 = 16 - 4 = 12 chunks * 512 = 6144 triangles
For 1536m at LOD 2: (1536/256)^2 - (1024/256)^2 = 36 - 16 = 20 chunks * 128 = 2560 triangles

Total: ~41k triangles. That's very manageable.

But 8m resolution might be too coarse for nice terrain. Let me adjust:
- Tile size: 128m
- LOD 0: 33x33 vertices (4m resolution) - 0-384m
- LOD 1: 17x17 vertices (8m resolution) - 384-768m
- LOD 2: 9x9 vertices (16m resolution) - 768-1152m
- LOD 3: 5x5 vertices (32m resolution) - 1152-1536m

Actually, let me reconsider. For a beautiful flyover, I want good detail near the camera. Let me use:

- Tile size: 128m
- LOD 0: 65x65 vertices (2m resolution) - 0-256m → (256/128)^2 * 4 = 16 chunks * 64*64*2 = 131072 triangles. That's a lot but manageable.
- LOD 1: 33x33 vertices (4m resolution) - 256-512m → (512/128)^2 - (256/128)^2 = 16 - 4 = 12 * 32*32*2 = 24576
- LOD 2: 17x17 vertices (8m resolution) - 512-1024m → (1024/128)^2 - (512/128)^2 = 64 - 16 = 48 * 16*16*2 = 24576
- LOD 3: 9x9 vertices (16m resolution) - 1024-1536m → (1536/128)^2 - (1024/128)^2 = 144 - 64 = 80 * 8*8*2 = 10240

Total: ~190k triangles. That's getting heavy but should be fine for modern GPUs.

Actually wait, I'm overthinking this. Let me use a simpler approach that's more standard:

I'll use a fixed chunk size (e.g., 128m x 128m) with a fixed vertex count (e.g., 32x32 segments = 33x33 vertices). The LOD is achieved by using different chunk sizes:
- Small chunks (128m, 32 segments) near camera
- Medium chunks (256m, 32 segments) at medium distance  
- Large chunks (512m, 32 segments) far away

This way, the vertex density smoothly decreases with distance.

For seam prevention between different LOD levels, I need to ensure that vertices at the boundary match. The simplest way is to snap the LOD boundaries to chunk grid positions and use a "skirt" or simply accept small cracks (which are usually invisible at distance).

Actually, the cleanest approach for no visible seams:
- Use a single grid resolution (e.g., 2m) for everything
- But that would be too many vertices at far distances

Let me just go with the multi-LOD approach and accept that there might be tiny cracks at LOD boundaries. At the distances involved, they'll be invisible.

Let me reconsider the architecture:

```
Chunk system:
- 3 LOD levels
- LOD 0: chunk size 128m, 32x32 quads (33x33 verts) → 2m resolution
  - Render within 512m of camera
- LOD 1: chunk size 256m, 32x32 quads (33x33 verts) → 8m resolution
  - Render from 512m to 1024m
- LOD 2: chunk size 512m, 32x32 quads (33x33 verts) → 16m resolution
  - Render from 1024m to 2048m
```

Wait, this doesn't work well because the chunks at different LOD levels don't align. Let me use a proper tiled LOD system.

Actually, the simplest approach that works well:
- Use a quadtree-like structure where each level doubles the tile size
- Level 0: 128m tiles, 32x32 quads
- Level 1: 256m tiles, 32x32 quads (covers 2x2 level-0 tiles)
- Level 2: 512m tiles, 32x32 quads (covers 2x2 level-1 tiles)

For the camera at position (cx, cz):
- Determine which LOD level each tile belongs to based on distance
- The transition between LOD levels should be at fixed world-space boundaries to prevent popping

Let me simplify even further. I'll use a screen-space error approach:
- For each potential tile, compute its screen-space size
- If it's above a threshold, subdivide
- This naturally gives you LOD

But implementing a dynamic mesh for this in raw WebGL is complex. Let me just go with distance-based LOD with fixed ring boundaries:

Camera at (cx, cz):
- Ring 0: tiles within 400m → LOD 0 (128m tiles, 32 segments)
- Ring 1: tiles 400-800m → LOD 1 (256m tiles, 32 segments)  
- Ring 2: tiles 800-1600m → LOD 2 (512m tiles, 32 segments)

The key insight: for LOD 1, I need to determine which 256m tile a position belongs to. A 256m tile at level 1 covers the same area as 4 level-0 tiles. So I snap to the 256m grid.

For no visible seams between LOD rings, I can use a "morphing" approach or just accept small cracks. At the distances we're talking about (400m+), a 2m crack would be sub-pixel.

Actually, you know what, let me just use a single LOD level for simplicity and performance. If I use 128m tiles with 32x32 quads (2m resolution), and render out to 1500m:
- Number of tiles: roughly (3000/128)^2 ≈ 550 tiles in a square, but circular so maybe ~400
- 400 * 2048 = 819,200 triangles

That's too many. Let me use larger tiles for the far distance.

OK here's my final plan:

I'll use a two-level LOD:
- Near: 128m tiles, 32x32 quads (2m res), within 600m
- Far: 512m tiles, 32x32 quads (16m res), 600m to 2000m

Near tiles: (1200/128)^2 ≈ 88 tiles (circular, so maybe ~60) → 60 * 2048 = 122,880 tris
Far tiles: (4000/512)^2 - (1200/512)^2 ≈ 61 - 5 = 56, but circular so maybe ~40 → 40 * 2048 = 81,920 tris

Total: ~200k triangles. That's fine for a modern GPU.

Actually, I realize I'm overcomplicating this. Let me just use a simpler approach:

**Single LOD with variable resolution based on distance from camera:**

I'll generate a fixed grid of chunks around the camera. Each chunk is 256m x 256m. I'll use 32x32 quads per chunk (8m resolution). I'll render chunks within a 2000m radius.

Number of chunks: (4000/256)^2 ≈ 244, circular so maybe ~180
180 * 2048 = 368,640 triangles

That's a bit much. Let me use 16x16 quads (16m resolution):
180 * 512 = 92,160 triangles

That's reasonable but 16m resolution is quite coarse.

OK let me just go with a proper multi-LOD system. Here's my final design:

```
LOD 0: tile=128m, segments=32 (4m res) → within 512m
LOD 1: tile=256m, segments=32 (8m res) → 512m to 1024m  
LOD 2: tile=512m, segments=32 (16m res) → 1024m to 2048m
```

For LOD 0: tiles within 512m → (1024/128)^2 ≈ 64, circular ~50 → 50 * 2048 = 102,400
For LOD 1: tiles from 512 to 1024 → (2048/256)^2 - (1024/256)^2 = 64 - 16 = 48, circular ~36 → 36 * 2048 = 73,728
For LOD 2: tiles from 1024 to 2048 → (4096/512)^2 - (2048/512)^2 = 64 - 16 = 48, circular ~36 → 36 * 2048 = 73,728

Total: ~250k triangles. Fine for modern GPU.

Now, for the noise function, I need:
1. A hash function that takes (x, z, seed) and returns a pseudo-random value in [0,1]
2. Value noise (bilinear interpolation of hash values at integer grid points)
3. fBm (sum of octaves of value noise)
4. Ridged noise for mountain ridges
5. Domain warping for more interesting terrain

Let me write the hash:
```javascript
function hash(x, y, seed) {
    // Integer hash
    let h = seed + x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    h = h ^ (h >> 16);
    return (h >>> 0) / 4294967296; // normalize to [0,1]
}
```

Value noise:
```javascript
function valueNoise(x, y, seed) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    
    // Smoothstep
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    
    const n00 = hash(ix, iy, seed);
    const n10 = hash(ix+1, iy, seed);
    const n01 = hash(ix, iy+1, seed);
    const n11 = hash(ix+1, iy+1, seed);
    
    const nx0 = n00 + (n10 - n00) * sx;
    const nx1 = n01 + (n11 - n01) * sx;
    
    return nx0 + (nx1 - nx0) * sy;
}
```

fBm:
```javascript
function fbm(x, y, seed, octaves, lacunarity, gain) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;
    
    for (let i = 0; i < octaves; i++) {
        value += amplitude * valueNoise(x * frequency, y * frequency, seed + i * 1000);
        maxAmplitude += amplitude;
        amplitude *= gain;
        frequency *= lacunarity;
    }
    
    return value / maxAmplitude; // normalize to [0,1]
}
```

For the terrain height:
```javascript
function terrainHeight(x, z) {
    const seed = currentSeed;
    // Domain warping
    const warpScale = 0.002;
    const warpStrength = 50;
    const wx = fbm(x * warpScale + 100, z * warpScale + 100, seed + 500, 3, 2.0, 0.5) * warpStrength;
    const wz = fbm(x * warpScale + 200, z * warpScale + 200, seed + 600, 3, 2.0, 0.5) * warpStrength;
    
    const px = x + wx;
    const pz = z + wz;
    
    // Base terrain
    const baseScale = 0.001;
    let h = fbm(px * baseScale, pz * baseScale, seed, 6, 2.0, 0.5);
    
    // Continental shape (large scale)
    const continental = fbm(px * 0.0002, pz * 0.0002, seed + 100, 3, 2.0, 0.5);
    
    // Mountain ridges
    const ridgeScale = 0.003;
    let ridge = 1.0 - Math.abs(2.0 * fbm(px * ridgeScale, pz * ridgeScale, seed + 200, 4, 2.5, 0.5) - 1.0);
    ridge = ridge * ridge;
    
    // Combine
    h = h * 0.5 + continental * 0.3 + ridge * 0.2;
    
    // Map to height range
    // Want: -50 to +400
    // h is roughly [0, 1] after normalization
    // Let's shape it
    const height = (h - 0.3) * 500; // -150 to +350 roughly
    
    return height;
}
```

Hmm, I need to be more careful about the height distribution. Let me think about this differently.

I want:
- Sea level at y=0
- About 30-40% of the area should be underwater (sea floor down to -50)
- Plains from 0 to ~50
- Hills from 50 to ~150
- Mountains from 150 to ~400

So the height distribution should be:
- Below 0: maybe 30% of area
- 0 to 50: maybe 25%
- 50 to 150: maybe 20%
- 150 to 400: maybe 20%
- Above 400: maybe 5%

I'll use a shaping function to achieve this. Let me use a power curve:

```javascript
function computeHeight(x, z, seed) {
    // ... noise computation gives h in [0, 1] ...
    
    // Shape the height
    // h < 0.35 → underwater (map to -50 to 0)
    // h >= 0.35 → land (map to 0 to 400)
    
    if (h < 0.35) {
        // Underwater
        const t = h / 0.35; // 0 to 1
        return -50 * (1 - t) * (1 - t); // -50 to 0, quadratic
    } else {
        const t = (h - 0.35) / 0.65; // 0 to 1
        // Use power curve for more dramatic mountains
        return Math.pow(t, 0.6) * 400;
    }
}
```

Actually, let me just use a smooth shaping. I'll compute a raw noise value and map it:

```javascript
function computeHeight(x, z) {
    const s = currentSeed;
    
    // Domain warping
    const warpAmp = 80;
    const warpFreq = 0.0015;
    const wx = (fbm(x * warpFreq + 31.7, z * warpFreq + 47.3, s + 900, 4, 2.0, 0.5) - 0.5) * warpAmp;
    const wz = (fbm(x * warpFreq + 113.9, z * warpFreq + 271.1, s + 950, 4, 2.0, 0.5) - 0.5) * warpAmp;
    
    const px = x + wx;
    const pz = z + wz;
    
    // Base elevation (large scale, determines where continents are)
    const base = fbm(px * 0.0008, pz * 0.0008, s, 4, 2.0, 0.5);
    
    // Detail
    const detail = fbm(px * 0.004, pz * 0.004, s + 300, 5, 2.2, 0.5);
    
    // Ridged mountains
    let ridge = 1.0;
    for (let i = 0; i < 4; i++) {
        const f = Math.pow(2, i);
        const a = Math.pow(0.5, i);
        ridge *= 1.0 - Math.abs(2.0 * fbm(px * 0.002 * f + i*17, pz * 0.002 * f + i*31, s + 500 + i*100, 2, 2.0, 0.5) - 1.0);
    }
    ridge = ridge * ridge; // sharpen ridges
    
    // Combine
    let h = base * 0.4 + detail * 0.25 + ridge * 0.35;
    
    // h is roughly in [0, 1]
    // Map to world height
    // Threshold at h = 0.32 for sea level
    const seaLevel = 0.32;
    if (h < seaLevel) {
        // Ocean floor
        const t = h / seaLevel; // 0 to 1
        return -50 + 50 * t * t; // -50 to 0
    } else {
        const t = (h - seaLevel) / (1.0 - seaLevel); // 0 to 1
        return Math.pow(t, 0.7) * 400;
    }
}
```

This should give a nice distribution. Let me refine later.

Now for the rendering pipeline:

1. **Sky**: Render a fullscreen quad with a sky shader (gradient + sun + stars)
2. **Terrain**: Render all visible chunks
3. **Water**: Render a large plane at y=0 with animated waves

For the sky, I'll render it as a fullscreen quad with depth test disabled (or depth always pass). The sky shader will compute the direction for each fragment based on the inverse view-projection matrix.

For the terrain, I'll use a single draw call per chunk (or I could batch all chunks into a single VBO for performance, but that's more complex).

Actually, for best performance, I should batch all terrain into as few draw calls as possible. Let me use a single large VBO that I update each frame (or a few VBOs for different LOD levels).

Hmm, but with up to 200+ chunks, that's a lot of data to upload each frame. Let me think...

Each chunk has 33*33 = 1089 vertices, each with position (3 floats) + normal (3 floats) + color (3 floats) = 9 floats = 36 bytes.
1089 * 36 = 39,204 bytes per chunk.

With ~200 chunks, that's ~7.8 MB. Uploading that each frame is too much.

Better approach: pre-allocate a large VBO and only update the chunks that are new or changed. Or use multiple smaller VBOs, one per chunk, and just draw the ones that are visible.

Actually, the simplest approach that works well: allocate a VBO per chunk. When a chunk is generated, compute its geometry once and upload it. When it's no longer needed, free the VBO. Then each frame, just draw all visible chunks.

But with 200 chunks, that's 200 draw calls. That should be fine for WebGL.

Wait, actually I can do better. I'll use a ring buffer of VBOs. When I need a new chunk, I take the next VBO from the ring, upload the data, and draw it. When a chunk is no longer needed, its VBO goes back to the pool.

Let me simplify: I'll use an array of {vbo, index, count, active} objects. Each frame:
1. Determine which chunks are needed
2. For new chunks, generate geometry and upload to a VBO
3. Draw all active chunks
4. For chunks no longer needed, deactivate them

For the terrain vertex format, I'll use:
- position: vec3 (x, y, z)
- color: vec3 (r, g, b) - precomputed on CPU based on height and slope
- Actually, I'll compute normals on CPU too and pass them as a separate attribute

Wait, for lighting I need normals. Let me compute them on CPU from the heightfield (finite differences) and store them with the vertex data.

Vertex format: position (3f) + normal (3f) + color (3f) = 9 floats = 36 bytes

For indices: 32*32*6 = 6144 indices per chunk (Uint32 or Uint16, 33*33 = 1089 < 65536 so Uint16 works)

Let me now think about the water. I'll render a large quad at y=0 that follows the camera. The water shader will:
- Animate waves using sin functions
- Compute a normal from the wave derivative
- Use Fresnel to blend between deep water color and sky reflection
- Alpha blend at the shoreline (where terrain is below water)

For the water to look right, I need to render it after the terrain with blending enabled.

Now let me think about the day/night cycle:

Time of day t (0-24):
- Sun elevation: peaks at noon (t=12), lowest at midnight (t=0/24)
- Sun azimuth: rotates through the day

Sun direction:
```javascript
function getSunDirection(t) {
    // t is in hours [0, 24]
    // Sun angle: 0 at midnight, PI at noon
    const angle = (t - 6) / 12 * Math.PI; // -PI/2 at midnight, 0 at sunrise, PI/2 at noon... 
    // Actually let me think more carefully
    // At t=6 (sunrise), sun is at horizon (elevation = 0)
    // At t=12 (noon), sun is at max elevation
    // At t=18 (sunset), sun is at horizon
    // At t=0/24 (midnight), sun is at minimum elevation (below horizon)
    
    const sunAngle = (t / 24) * 2 * Math.PI - Math.PI/2; // -PI/2 at t=0, 0 at t=6, PI/2 at t=12
    // Hmm, let me use a simpler model
    
    // Elevation: sin curve peaking at noon
    const elevation = Math.sin((t - 6) / 12 * Math.PI); // 0 at 6, 1 at 12, 0 at 18, -1 at 0
    // Azimuth: rotates
    const azimuth = (t / 24) * 2 * Math.PI;
    
    const sunDist = Math.sqrt(1 - elevation * elevation);
    return {
        x: Math.cos(azimuth) * sunDist,
        y: elevation,
        z: Math.sin(azimuth) * sunDist
    };
}
```

Wait, that's not quite right. Let me use a simpler model:
- The sun moves in a circle above the horizon
- At t=6, sun rises from the east (azimuth = 0)
- At t=12, sun is at the south (azimuth = PI/2) at maximum elevation
- At t=18, sun sets in the west (azimuth = PI)

```javascript
function getSunDirection(t) {
    // t in [0, 24]
    // Sun path: rises at t=6, peaks at t=12, sets at t=18
    const dayAngle = (t - 6) / 12 * Math.PI; // 0 at sunrise, PI/2 at noon, PI at sunset
    
    const maxElevation = Math.PI / 3; // 60 degrees max elevation
    const elevation = Math.sin(dayAngle) * maxElevation;
    const azimuth = dayAngle; // 0 to PI during day
    
    // Convert to direction vector
    const dir = new Array(3);
    dir[0] = Math.cos(elevation) * Math.sin(azimuth); // east
    dir[1] = Math.sin(elevation); // up
    dir[2] = -Math.cos(elevation) * Math.cos(azimuth); // south (towards -z at noon)
    
    return dir;
}
```

Hmm, I'm overcomplicating this. Let me just use:
- Sun rotates around the Y axis (azimuth) and tilts up/down (elevation)
- At t=6: elevation = 0, azimuth = 0 (east)
- At t=12: elevation = max, azimuth = PI/2 (south)  
- At t=18: elevation = 0, azimuth = PI (west)
- At t=0: elevation = -max, azimuth = 3PI/2 (north, below horizon)

```javascript
function getSunDir(t) {
    const angle = (t - 6) / 12 * Math.PI; // 0 at t=6, PI/2 at t=12, PI at t=18
    const maxEl = 1.0; // max elevation in radians (about 57 degrees)
    const el = Math.sin(angle) * maxEl;
    const az = angle;
    
    return [
        Math.cos(el) * Math.sin(az),
        Math.sin(el),
        -Math.cos(el) * Math.cos(az)
    ];
}
```

For the sky color, I'll interpolate between:
- Day: blue sky
- Sunset: orange/pink
- Night: dark blue/black with stars

The key parameters that change with time:
- Sun direction
- Sun intensity (0 at night, 1 at noon)
- Sun color (white at noon, orange at sunrise/sunset)
- Sky top color
- Sky bottom (horizon) color
- Fog color (matches horizon)
- Ambient light intensity

Let me now write the actual code. This is going to be long but I'll be systematic.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Horizon</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { overflow: hidden; background: #000; }
canvas { display: block; width: 100vw; height: 100vh; }
#ui { position: fixed; bottom: 20px; left: 20px; color: #fff; font-family: monospace; font-size: 13px; z-index: 10; }
#ui label { display: block; margin: 4px 0; }
#ui input[type=range] { width: 200px; }
#ui input[type=number] { width: 80px; background: rgba(0,0,0,0.5); color: #fff; border: 1px solid #555; padding: 2px 5px; }
#fps { position: fixed; top: 10px; left: 10px; color: #fff; font-family: monospace; font-size: 12px; z-index: 10; }
#autopilot { position: fixed; top: 10px; right: 10px; color: #0f0; font-family: monospace; font-size: 12px; z-index: 10; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="fps">FPS: 60</div>
<div id="autopilot">AUTOPILOT</div>
<div id="ui">
    <label>Time: <input type="range" id="time" min="0" max="24" step="0.1" value="10"></label>
    <label>Seed: <input type="number" id="seed" value="42"></label>
</div>
<script>
// ... all the code ...
</script>
</body>
</html>
```

Now let me write the full JavaScript. I'll organize it into sections:

1. Matrix math utilities
2. Noise functions
3. Terrain generation
4. WebGL setup (shaders, buffers)
5. Chunk management
6. Camera
7. Rendering
8. UI and controls
9. Main loop
10. Grader API

Let me write this out fully:

```javascript
// ===== MATRIX MATH =====
function mat4Perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
    ]);
}

function mat4LookAt(eye, center, up) {
    // ... standard lookAt
}

function mat4Multiply(a, b) {
    // ... standard multiply
}
```

Actually, let me write a proper view matrix from position + yaw + pitch instead of lookAt:

```javascript
function mat4View(pos, yaw, pitch) {
    // Camera looks in direction determined by yaw and pitch
    // yaw = 0 looks towards -z
    // pitch = 0 is level, positive looks up
    
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    
    // Forward direction
    const fx = -sy * cp;
    const fy = sp;
    const fz = -cy * cp;
    
    // Right direction
    const rx = cy, ry = 0, rz = -sy;
    
    // Up direction
    const ux = sy * sp, uy = cp, uz = -cy * sp;
    
    // View matrix (camera to world)
    return new Float32Array([
        rx, ux, -fx, 0,
        ry, uy, -fy, 0,
        rz, uz, -fz, 0,
        -(rx*pos[0]+ry*pos[1]+rz*pos[2]),
        -(ux*pos[0]+uy*pos[1]+uz*pos[2]),
        (fx*pos[0]+fy*pos[1]+fz*pos[2]),
        1
    ]);
}
```

Wait, I need to be careful with the view matrix convention. In WebGL, the view matrix transforms from world space to camera space. The camera space has:
- -z is forward (looking direction)
- x is right
- y is up

So the view matrix is the inverse of the camera's world transformation.

Camera's world transform:
- Position: pos
- Rotation: yaw around Y, then pitch around X (local)

The camera's forward vector in world space:
- After yaw: (sin(yaw), 0, cos(yaw))... wait, let me think.

If yaw = 0 looks towards -z:
- Forward = (-sin(yaw), 0, -cos(yaw))
- Right = (cos(yaw), 0, -sin(yaw))
- Up (before pitch) = (0, 1, 0)

After pitch (positive = look up):
- Forward = (-sin(yaw)*cos(pitch), sin(pitch), -cos(yaw)*cos(pitch))
- Right stays the same
- Up = (sin(yaw)*sin(pitch), cos(pitch), cos(yaw)*sin(pitch))

The view matrix is the transpose of the rotation part, negated, plus the negated dot product of axes with position:

```javascript
function mat4View(pos, yaw, pitch) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    
    // Camera axes in world space
    const fx = -sy * cp, fy = sp, fz = -cy * cp; // forward
    const rx = cy, ry = 0, rz = -sy; // right
    const ux = sy * sp, uy = cp, uz = cy * sp; // up
    
    // View matrix (world to camera)
    // First 3 rows are the camera axes (transpose of rotation)
    // Last column is -R * T
    return new Float32Array([
        rx, ry, rz, 0,
        ux, uy, uz, 0,
        -fx, -fy, -fz, 0,
        -(rx*pos[0] + ry*pos[1] + rz*pos[2]),
        -(ux*pos[0] + uy*pos[1] + uz*pos[2]),
        fx*pos[0] + fy*pos[1] + fz*pos[2],
        1
    ]);
}
```

Wait, I need to double-check. The view matrix V = R^T * T where R is the camera's rotation and T is the translation.

If the camera's world matrix is:
```
[ R | T ]
[ 0 | 1 ]
```

Then the view matrix is:
```
[ R^T    | -R^T * T ]
[ 0      |    1      ]
```

The camera's rotation matrix R has columns = camera axes in world space:
- Column 0: right = (rx, ry, rz)
- Column 1: up = (ux, uy, uz)  
- Column 2: -forward = (-fx, -fy, -fz) [because in camera space, -z is forward]

Wait no. Let me be more careful.

In camera space:
- x-axis points right
- y-axis points up
- z-axis points backwards (towards the viewer)

So the camera's world matrix transforms camera space to world space:
- Camera x-axis (1,0,0) maps to world right vector
- Camera y-axis (0,1,0) maps to world up vector
- Camera z-axis (0,0,1) maps to world -forward vector

So R (the rotation part) has:
- Column 0: right in world = (rx, ry, rz)
- Column 1: up in world = (ux, uy, uz)
- Column 2: -forward in world = (-fx, -fy, -fz)

The view matrix is:
```
[ rx  ux  -fx  0 ]       [ -rx*px -ry*py -rz*pz ]
[ ry  uy  -fy  0 ]  ×    [ -ux*px -uy*py -uz*pz ]
[ rz  uz  -fz  0 ]       [ fx*px + fy*py + fz*pz ]
[ 0   0    0    1 ]       [        1              ]
```

In column-major (WebGL) format:
```
[ rx, ry, rz, 0,   ux, uy, uz, 0,   -fx, -fy, -fz, 0,   tx, ty, tz, 1 ]
```

Where tx = -(rx*px + ry*py + rz*pz), ty = -(ux*px + uy*py + uz*pz), tz = fx*px + fy*py + fz*pz

Wait, let me recompute. The translation part of the view matrix is -R^T * T where T is the camera position.

R^T * T = (R^T) * (px, py, pz)^T

R has columns: right, up, -forward
So R = [right | up | -forward] (as columns)

R^T has rows: right, up, -forward
So R^T * T = (right·T, up·T, -forward·T)

Thus -R^T * T = (-right·T, -up·T, forward·T)

So:
- tx = -(rx*px + ry*py + rz*pz)
- ty = -(ux*px + uy*py + uz*pz)
- tz = fx*px + fy*py + fz*pz

And the view matrix in column-major:
```
[ rx, ry, rz, 0,  ux, uy, uz, 0,  -fx, -fy, -fz, 0,  tx, ty, tz, 1 ]
```

Let me verify: if the camera is at origin looking at -z with no rotation:
- right = (1, 0, 0)
- up = (0, 1, 0)
- forward = (0, 0, -1)
- -forward = (0, 0, 1)

View matrix:
```
[ 1, 0, 0, 0,  0, 1, 0, 0,  0, 0, -1, 0,  0, 0, 0, 1 ]
```

This maps a point (x, y, z) to (x, y, -z). A point at (0, 0, -10) (in front of camera) maps to (0, 0, 10). In camera space, z=10 is behind the camera... that's wrong!

Wait, I think I have the convention wrong. In OpenGL/WebGL, the camera looks along -z in camera space. So a point in front of the camera should have negative z in camera space.

Let me reconsider. The view matrix should transform world points to camera space where:
- The camera is at origin
- The camera looks along -z
- x is right, y is up

So a point directly in front of the camera (at world position camera_pos + forward * d) should map to (0, 0, -d) in camera space.

With forward = (0, 0, -1) and camera at origin:
Point (0, 0, -10) should map to (0, 0, -10).

With my view matrix:
```
[ 1, 0, 0, 0,  0, 1, 0, 0,  0, 0, -1, 0,  0, 0, 0, 1 ]
```
(0, 0, -10) → (0, 0, 10). That's wrong!

So I need the view matrix to be:
```
[ 1, 0, 0, 0,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1 ]
```

Which means the rotation part should be the identity when looking along -z. Let me reconsider.

The camera's local axes in world space:
- Right: (1, 0, 0)
- Up: (0, 1, 0)
- Back (opposite of forward): (0, 0, 1) [since forward is (0,0,-1)]

The view matrix transforms world to camera:
- world_point → dot(right, p), dot(up, p), dot(back, p)

So the view matrix rotation is:
```
[ right.x   right.y   right.z   0 ]
[ up.x      up.y      up.z      0 ]
[ back.x    back.y    back.z    0 ]
[ 0         0         0         1 ]
```

Where back = -forward.

In our case:
- right = (1, 0, 0)
- up = (0, 1, 0)
- back = (0, 0, 1)

View matrix:
```
[ 1, 0, 0, 0,  0, 1, 0, 0,  0, 0, 1, 0,  tx, ty, tz, 1 ]
```

And the translation:
- tx = -dot(right, pos)
- ty = -dot(up, pos)
- tz = -dot(back, pos) = dot(forward, pos)

Wait: tz = -dot(back, pos) = -dot(-forward, pos) = dot(forward, pos)

With pos = (0,0,0): tz = 0. Good.
With pos = (0,0,5): tz = dot((0,0,-1), (0,0,5)) = -5.

A point at world (0,0,0) with camera at (0,0,5):
- In camera space: (0, 0, -5) → the point is in front of the camera (negative z). Correct!

OK so the view matrix in column-major for WebGL is:

```javascript
function mat4View(pos, yaw, pitch) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    
    // Forward direction (camera looks this way)
    const fx = -sy * cp, fy = sp, fz = -cy * cp;
    // Right
    const rx = cy, ry = 0, rz = -sy;
    // Up
    const ux = sy * sp, uy = cp, uz = cy * sp;
    // Back = -forward
    const bx = -fx, by = -fy, bz = -fz;
    
    // View matrix (column-major)
    return new Float32Array([
        rx, ry, rz, 0,
        ux, uy, uz, 0,
        bx, by, bz, 0,
        -(rx*pos[0] + ry*pos[1] + rz*pos[2]),
        -(ux*pos[0] + uy*pos[1] + uz*pos[2]),
        -(bx*pos[0] + by*pos[1] + bz*pos[2]),
        1
    ]);
}
```

Let me verify: yaw=0, pitch=0, pos=(0,0,0):
- f = (0, 0, -1)
- r = (1, 0, 0)
- u = (0, 1, 0)
- b = (0, 0, 1)

View matrix:
```
[1, 0, 0, 0,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1]
```

Point (0, 0, -10) → (0, 0, -10). In camera space, z = -10 means it's in front. ✓

Now let me write the perspective matrix:

```javascript
function mat4Perspective(fovY, aspect, near, far) {
    const f = 1.0 / Math.tan(fovY / 2);
    const nf = 1.0 / (near - far);
    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
    ]);
}
```

And matrix multiply:
```javascript
function mat4Mul(a, b) {
    const out = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            out[i*4+j] = a[j]*b[i*4] + a[4+j]*b[i*4+1] + a[8+j]*b[i*4+2] + a[12+j]*b[i*4+3];
        }
    }
    return out;
}
```

Now for the noise. I need to be very careful that the hash function works correctly with integer inputs and is deterministic.

```javascript
function hash2(x, y, seed) {
    // Convert to unsigned 32-bit
    x = x | 0;
    y = y | 0;
    let h = (x * 374761393 + y * 668265263 + seed * 144665) | 0;
    h = ((h ^ (h >>> 13)) * 1274126177) | 0;
    h = (h ^ (h >>> 16)) | 0;
    return (h >>> 0) / 4294967296;
}
```

Wait, I need to be careful with JavaScript integer arithmetic. JavaScript uses 32-bit integers for bitwise operations but 64-bit floats for arithmetic. Let me use a proper integer hash:

```javascript
function hash2(x, y, seed) {
    // Ensure integer inputs
    x = Math.floor(x);
    y = Math.floor(y);
    
    // Simple but effective hash
    let n = x * 374761393 + y * 668265263 + seed * 1442695041;
    n = (n ^ (n >> 13)) * 1274126177;
    n = n ^ (n >> 16);
    n = n >>> 0; // ensure unsigned
    return n / 4294967296;
}
```

Actually, JavaScript's `*` operator on large numbers loses precision. Let me use a different approach:

```javascript
function hash2(x, y, seed) {
    x = Math.floor(x);
    y = Math.floor(y);
    
    let n = x * 15731 + y * 789221 + seed * 1376312589;
    n = (n << 13) ^ n;
    n = (n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff;
    return n / 2147483648.0;
}
```

Hmm, this might have issues with overflow. Let me use a simpler approach with Math.imul for 32-bit multiplication:

```javascript
function hash2(x, y, seed) {
    x = Math.floor(x) | 0;
    y = Math.floor(y) | 0;
    const s = seed | 0;
    
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 144665) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
}
```

`Math.imul` gives us proper 32-bit integer multiplication. This should work.

Now let me write the full terrain height function:

```javascript
function noise2(x, y, seed) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    
    // Quintic smoothstep for C2 continuity
    const sx = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
    const sy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
    
    const a = hash2(ix, iy, seed);
    const b = hash2(ix + 1, iy, seed);
    const c = hash2(ix, iy + 1, seed);
    const d = hash2(ix + 1, iy + 1, seed);
    
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbm(x, y, seed, octaves, lacunarity, gain) {
    let val = 0, amp = 1, freq = 1, maxAmp = 0;
    for (let i = 0; i < octaves; i++) {
        val += amp * noise2(x * freq, y * freq, seed + i * 7919);
        maxAmp += amp;
        amp *= gain;
        freq *= lacunarity;
    }
    return val / maxAmp;
}

function ridged(x, y, seed, octaves, lacunarity, gain) {
    let val = 0, amp = 1, freq = 1, maxAmp = 0;
    for (let i = 0; i < octaves; i++) {
        let n = 1.0 - Math.abs(2.0 * noise2(x * freq, y * freq, seed + i * 104729) - 1.0);
        n = n * n;
        val += amp * n;
        maxAmp += amp;
        amp *= gain;
        freq *= lacunarity;
    }
    return val / maxAmp;
}

function getTerrainHeight(x, z) {
    const s = currentSeed;
    
    // Domain warping
    const wf = 0.001;
    const ws = 100;
    const ox = (fbm(x * wf + 5.2, z * wf + 1.3, s + 900, 3, 2.0, 0.5) - 0.5) * ws;
    const oz = (fbm(x * wf + 9.7, z * wf + 3.1, s + 950, 3, 2.0, 0.5) - 0.5) * ws;
    
    const px = x + ox;
    const pz = z + oz;
    
    // Continental base (very large scale)
    const base = fbm(px * 0.0004, pz * 0.0004, s, 4, 2.0, 0.5);
    
    // Medium detail
    const detail = fbm(px * 0.003, pz * 0.003, s + 300, 5, 2.0, 0.5);
    
    // Ridged mountains
    const mountain = ridged(px * 0.0015, pz * 0.0015, s + 600, 5, 2.2, 0.5);
    
    // Combine
    let h = base * 0.35 + detail * 0.2 + mountain * 0.45;
    
    // h is roughly in [0, 1] (could be slightly outside)
    // Map to world height
    const seaThreshold = 0.35;
    if (h < seaThreshold) {
        const t = h / seaThreshold;
        return -50 * (1 - t * t);
    } else {
        const t = (h - seaThreshold) / (1.0 - seaThreshold);
        return Math.pow(t, 0.65) * 400;
    }
}
```

Now for the chunk geometry. Each chunk needs:
- Vertex positions (x, y, z)
- Vertex normals (computed from height derivatives)
- Vertex colors (based on height and slope)
- Index buffer

For normals, I'll use finite differences:
```javascript
function computeNormal(x, z) {
    const eps = 0.5;
    const hL = getTerrainHeight(x - eps, z);
    const hR = getTerrainHeight(x + eps, z);
    const hD = getTerrainHeight(x, z - eps);
    const hU = getTerrainHeight(x, z + eps);
    
    const nx = hL - hR;
    const ny = 2 * eps;
    const nz = hD - hU;
    
    const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
    return [nx/len, ny/len, nz/len];
}
```

For vertex colors based on height and slope:
```javascript
function computeColor(x, y, z, nx, ny, nz) {
    const slope = 1.0 - ny; // 0 = flat, 1 = vertical
    
    // Base colors
    let r, g, b;
    
    if (y < 0.5) {
        // Underwater - sandy/muddy
        const t = Math.max(0, y / 0.5);
        r = 0.4 + t * 0.1;
        g = 0.35 + t * 0.1;
        b = 0.2 + t * 0.05;
    } else if (y < 3) {
        // Sand/beach
        r = 0.76; g = 0.7; b = 0.5;
    } else if (y < 80) {
        // Grass
        const t = (y - 3) / 77;
        r = 0.2 + t * 0.1;
        g = 0.45 - t * 0.1;
        b = 0.1 + t * 0.05;
    } else if (y < 180) {
        // Rock
        r = 0.45; g = 0.4; b = 0.35;
    } else if (y < 250) {
        // Rocky/snow transition
        const t = (y - 180) / 70;
        r = 0.45 + t * 0.45;
        g = 0.4 + t * 0.5;
        b = 0.35 + t * 0.55;
    } else {
        // Snow
        r = 0.9; g = 0.92; b = 0.95;
    }
    
    // Apply slope: steep slopes are rocky regardless of height
    if (slope > 0.4 && y > 5) {
        const rockBlend = Math.min(1, (slope - 0.4) / 0.3);
        r = r * (1 - rockBlend) + 0.45 * rockBlend;
        g = g * (1 - rockBlend) + 0.4 * rockBlend;
        b = b * (1 - rockBlend) + 0.35 * rockBlend;
    }
    
    // Snow on steep slopes at high altitude
    if (y > 200 && slope > 0.3) {
        const snowBlend = Math.min(1, (slope - 0.3) / 0.2) * Math.min(1, (y - 200) / 50);
        r = r * (1 - snowBlend) + 0.9 * snowBlend;
        g = g * (1 - snowBlend) + 0.92 * snowBlend;
        b = b * (1 - snowBlend) + 0.95 * snowBlend;
    }
    
    return [r, g, b];
}
```

Now for the WebGL setup. I'll write shaders:

**Terrain vertex shader:**
```glsl
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aColor;

uniform mat4 uProj;
uniform mat4 uView;

varying vec3 vNormal;
varying vec3 vColor;
varying vec3 vWorldPos;

void main() {
    vNormal = aNormal;
    vColor = aColor;
    vWorldPos = aPosition;
    gl_Position = uProj * uView * vec4(aPosition, 1.0);
}
```

**Terrain fragment shader:**
```glsl
precision mediump float;

varying vec3 vNormal;
varying vec3 vColor;
varying vec3 vWorldPos;

uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uCamPos;
uniform float uAmbient;

void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uSunDir);
    vec3 V = normalize(uCamPos - vWorldPos);
    
    float NdotL = max(dot(N, L), 0.0);
    float diff = NdotL * uSunIntensity;
    
    // Simple hemisphere ambient
    float hemi = 0.5 + 0.5 * N.y;
    vec3 ambient = uAmbient * hemi;
    
    // Specular (Blinn-Phong)
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 32.0) * 0.3 * uSunIntensity;
    
    vec3 color = vColor * (ambient + uSunColor * diff) + uSunColor * spec;
    
    // Fog
    float dist = length(uCamPos - vWorldPos);
    float fog = 1.0 - exp(-dist * dist * uFogDensity);
    color = mix(color, uFogColor, fog);
    
    gl_FragColor = vec4(color, 1.0);
}
```

**Sky vertex shader** (fullscreen quad):
```glsl
attribute vec2 aPos;
varying vec2 vPos;
void main() {
    vPos = aPos;
    gl_Position = vec4(aPos, 0.9999, 1.0);
}
```

**Sky fragment shader:**
```glsl
precision mediump float;
varying vec2 vPos;

uniform vec3 uSunDir;
uniform float uSunIntensity;
uniform float uTime; // for stars animation if needed
uniform vec3 uSkyTop;
uniform vec3 uSkyBottom;
uniform float uNightFactor;

void main() {
    // Convert screen position to direction
    // vPos is in [-1, 1]
    vec3 dir = normalize(vec3(vPos, 1.5)); // approximate
    
    // Actually, I need to pass the inverse view-rotation to get proper directions
    // Let me use a different approach: pass the camera's up, right, forward
    
    float h = dir.y; // -1 to 1
    
    // Sky gradient
    vec3 sky = mix(uSkyBottom, uSkyTop, smoothstep(-0.1, 0.5, h));
    
    // Sun
    float sunDot = max(dot(dir, uSunDir), 0.0);
    vec3 sunColor = vec3(1.0, 0.9, 0.7) * uSunIntensity;
    sky += sunColor * pow(sunDot, 100.0) * 2.0; // sun disk
    sky += sunColor * pow(sunDot, 8.0) * 0.3; // sun glow
    
    // Stars at night
    if (uNightFactor > 0.5) {
        // Simple star pattern
        float stars = step(0.998, fract(sin(dot(floor(dir * 500.0), vec2(12.9898, 78.233))) * 43758.5453));
        sky += vec3(stars) * uNightFactor * 0.5;
    }
    
    gl_FragColor = vec4(sky, 1.0);
}
```

Hmm, for the sky I need to compute the ray direction from the camera through each pixel. The proper way is to pass the inverse view-rotation matrix and reconstruct the ray direction.

Let me use a different approach for the sky. I'll pass the camera's right, up, and forward vectors as uniforms, and compute the direction in the fragment shader:

```glsl
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform vec3 uCamForward;
uniform float uFovTan; // tan(fov/2) * aspect correction

void main() {
    vec3 dir = uCamForward + vPos.x * uFovTan * uCamRight + vPos.y * uFovTan * uCamUp;
    dir = normalize(dir);
    // ...
}
```

Actually, the simplest approach: pass the inverse of the view-projection matrix, and for each fragment, unproject the NDC position to get the world direction.

Or even simpler: pass the camera rotation (as a 3x3 matrix or as right/up/forward vectors) and compute:
```
dir = normalize(forward + x * tan(fov/2) * aspect * right + y * tan(fov/2) * up)
```

where x, y are the NDC coordinates.

Let me go with passing the camera's basis vectors.

Now for the water:

**Water vertex shader:**
```glsl
attribute vec3 aPosition;
uniform mat4 uProj;
uniform mat4 uView;
uniform float uTime;

varying vec3 vWorldPos;

void main() {
    vec3 p = aPosition;
    // Animated waves
    p.y += sin(p.x * 0.1 + uTime * 2.0) * 0.1 + cos(p.z * 0.1 + uTime * 1.5) * 0.1;
    vWorldPos = p;
    gl_Position = uProj * uView * vec4(p, 1.0);
}
```

**Water fragment shader:**
```glsl
precision mediump float;
varying vec3 vWorldPos;

uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uCamPos;
uniform vec3 uSkyColor; // average sky color for reflection
uniform float uTime;

void main() {
    // Compute normal from wave derivatives
    float e = 0.5;
    float h0 = sin(vWorldPos.x * 0.1 + uTime * 2.0) * 0.1 + cos(vWorldPos.z * 0.1 + uTime * 1.5) * 0.1;
    // ... compute partial derivatives ...
    
    vec3 N = normalize(vec3(-dhdx, 1.0, -dhdz));
    vec3 V = normalize(uCamPos - vWorldPos);
    
    // Fresnel
    float F = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
    
    // Deep water color
    vec3 deepColor = vec3(0.0, 0.1, 0.2);
    
    // Reflection (approximate sky color)
    vec3 reflectColor = uSkyColor;
    
    vec3 color = mix(deepColor, reflectColor, F);
    
    // Sun specular
    vec3 R = reflect(-uSunDir, N);
    float spec = pow(max(dot(R, V), 0.0), 64.0) * uSunIntensity;
    color += uSunColor * spec;
    
    // Fog
    float dist = length(uCamPos - vWorldPos);
    float fog = 1.0 - exp(-dist * dist * uFogDensity);
    color = mix(color, uFogColor, fog);
    
    // Alpha for shoreline blending
    float alpha = 0.8;
    
    gl_FragColor = vec4(color, alpha);
}
```

Now let me think about the chunk management system. I'll use a simple approach:

```javascript
const CHUNK_SIZE = 128; // meters
const SEGMENTS = 32; // quads per side
const VERTS_PER_SIDE = SEGMENTS + 1; // 33
const VERTS_PER_CHUNK = VERTS_PER_SIDE * VERTS_PER_SIDE; // 1089
const INDICES_PER_CHUNK = SEGMENTS * SEGMENTS * 6; // 6144

// LOD levels
const LODS = [
    { tileSize: 128, segments: 32, maxDist: 512 },
    { tileSize: 256, segments: 32, maxDist: 1024 },
    { tileSize: 512, segments: 32, maxDist: 2048 }
];
```

Wait, I realize the multi-LOD approach with different tile sizes is complex to implement correctly (ensuring no gaps, handling the transitions). Let me simplify:

**Single tile size, multiple resolution levels:**

I'll use a fixed tile size of 128m. The LOD is determined by distance:
- Within 400m: 32x32 segments (4m resolution)
- 400m to 800m: 16x16 segments (8m resolution)
- 800m to 1600m: 8x8 segments (16m resolution)
- 1600m to 2000m: 4x4 segments (32m resolution)

For each tile, I determine its LOD based on the distance from the camera to the tile center. The tile boundaries for LOD transitions are fixed (they depend on the tile's world position, not the camera), so there's no popping.

Wait, that's the issue. If LOD is determined by distance from camera to tile center, then as the camera moves, tiles will change LOD and pop. To avoid this, I need the LOD boundaries to be at fixed world-space positions.

The standard solution: use a "screen space error" approach where the LOD level is determined by the tile's projected size on screen. But that also changes with camera position.

The simplest solution that avoids popping: use concentric rings of fixed radius around the camera. But this also causes popping at the ring boundaries.

Actually, the real solution is to use a quadtree where the subdivision level is determined by the tile's world-space position (not distance from camera). For example:
- Tiles at positions where (tileX % 2 == 0 && tileZ % 2 == 0) use high resolution
- Tiles at other positions use lower resolution

No wait, that's not right either.

The standard approach in terrain engines:
1. Use a quadtree where the root covers a large area
2. Subdivide based on distance from camera
3. Use "fixed" transition distances that don't depend on camera position

The simplest approach that works in practice:
- Use a single resolution for all tiles (no LOD)
- But use a reasonable resolution (e.g., 8m) and render out to 2000m
- This gives: (4000/128)^2 ≈ 977 tiles... way too many

OK let me just go with a practical approach:
- Use 256m tiles with 32x32 segments (8m resolution)
- Render tiles within 1500m of camera
- That's about (3000/256)^2 ≈ 137 tiles, circular so ~100
- 100 * 2048 = 204,800 triangles

That's reasonable. 8m resolution is OK for a flyover at altitude.

But for close-up detail, 8m is too coarse. Let me use:
- 128m tiles with 32x32 segments (4m resolution) within 600m
- 512m tiles with 32x32 segments (16m resolution) beyond 600m

For the near tiles: (1200/128)^2 ≈ 88, circular ~60 → 60 * 2048 = 122,880
For the far tiles: I need to fill the area from 600m to 2000m with 512m tiles. The 512m tiles need to align with the 128m tile grid (512 = 4*128, so they do). I just need to make sure I don't double-render tiles that are already covered by near tiles.

A 512m tile at position (tx, tz) covers the area from (tx*512, tz*512) to ((tx+1)*512, (tz+1)*512). A 128m tile at position (sx, sz) covers (sx*128, sz*128) to ((sx+1)*128, (sz+1)*128). The 512m tile at (tx, tz) covers the same area as 4x4 = 16 near tiles.

So for the far LOD, I should only render 512m tiles that are NOT within the near radius. I can check: if the closest point of the 512m tile to the camera is > 600m, render it.

This is getting complex. Let me just go with a single LOD for simplicity:
- 256m tiles, 32x32 segments (8m resolution)
- Render within 1500m
- ~100 tiles, ~200k triangles

If 8m resolution looks too coarse, I can increase to 48x48 segments (5.3m) or use 128m tiles with 32 segments (4m) and accept more triangles.

Actually, you know what, let me just do it properly with a simple 2-LOD system:

```
LOD 0: 128m tiles, 32 segments (4m res) → tiles whose center is within 500m
LOD 1: 256m tiles, 32 segments (8m res) → fills the rest out to 2000m
```

For LOD 1, I use 256m tiles. A 256m tile at grid position (tx, tz) has its origin at (tx*256, tz*256). This aligns with the 128m grid since 256 = 2*128.

The key: for LOD 1, I only render tiles that are NOT covered by LOD 0 tiles. A LOD 1 tile at (tx, tz) is "covered" by LOD 0 if any of its 4 constituent 128m-tile areas has a 128m tile within 500m of the camera.

Simpler check: a LOD 1 tile should be rendered if its closest point to the camera is > 500m.

Let me just code this up. Here's my plan:

```javascript
function getVisibleChunks(camX, camZ) {
    const chunks = [];
    
    // LOD 0: 128m tiles within 500m
    const lod0Range = Math.ceil(500 / 128) + 1; // ~5
    for (let dx = -lod0Range; dx <= lod0Range; dx++) {
        for (let dz = -lod0Range; dz <= lod0Range; dz++) {
            const tx = Math.round(camX / 128) + dx;
            const tz = Math.round(camZ / 128) + dz;
            const cx = tx * 128 + 64;
            const cz = tz * 128 + 64;
            const dist = Math.sqrt((cx - camX)^2 + (cz - camZ)^2);
            if (dist < 500) {
                chunks.push({ type: 0, tx, tz, x: tx * 128, z: tz * 128, size: 128, segs: 32 });
            }
        }
    }
    
    // LOD 1: 256m tiles, closest point > 500m, within 2000m
    const lod1Range = Math.ceil(2000 / 256) + 1; // ~9
    for (let dx = -lod1Range; dx <= lod1Range; dx++) {
        for (let dz = -lod1Range; dz <= lod1Range; dz++) {
            const tx = Math.round(camX / 256) + dx;
            const tz = Math.round(camZ / 256) + dz;
            const tileX = tx * 256;
            const tileZ = tz * 256;
            
            // Closest point of tile to camera
            const closestX = Math.max(tileX, Math.min(camX, tileX + 256));
            const closestZ = Math.max(tileZ, Math.min(camZ, tileZ + 256));
            const closestDist = Math.sqrt((closestX - camX)^2 + (closestZ - camZ)^2);
            
            // Farthest point
            const farX = (tileX > camX) ? tileX : tileX + 256;
            const farZ = (tileZ > camZ) ? tileZ : tileZ + 256;
            const farDist = Math.sqrt((farX - camX)^2 + (farZ - camZ)^2);
            
            if (closestDist > 500 && farDist < 2000) {
                chunks.push({ type: 1, tx, tz, x: tileX, z: tileZ, size: 256, segs: 32 });
            }
        }
    }
    
    return chunks;
}
```

This should work. The transition between LOD 0 and LOD 1 is at 500m, which is far enough that the resolution difference (4m vs 8m) won't be noticeable.

Now, for the chunk data, I'll cache generated chunks in a Map keyed by "type_tx_tz". When a chunk is no longer needed, I'll remove it from the cache (or keep it for a while to avoid regenerating when the camera moves back).

Let me now write the complete code. I'll aim for a clean, well-organized implementation.

One more thing: the water. I'll render a large quad (e.g., 4000x4000m) centered on the camera at y=0. It should have some vertex density for wave animation. Let me use a 64x64 grid.

Actually, for the water I'll use a simpler approach: a single large quad with the wave animation done in the fragment shader (using screen-space derivatives or just position-based). This avoids the need for a dense mesh.

Wait, for proper normals I need the wave function to be differentiable. I can compute the normal analytically in the fragment shader:

```glsl
float waveHeight(vec2 p, float t) {
    return sin(p.x * 0.1 + t * 2.0) * 0.15 
         + cos(p.y * 0.13 + t * 1.7) * 0.1
         + sin((p.x + p.y) * 0.07 + t * 1.3) * 0.08;
}

vec3 waveNormal(vec2 p, float t) {
    float e = 0.1;
    float hL = waveHeight(p - vec2(e, 0), t);
    float hR = waveHeight(p + vec2(e, 0), t);
    float hD = waveHeight(p - vec2(0, e), t);
    float hU = waveHeight(p + vec2(0, e), t);
    return normalize(vec3(hL - hR, 2.0 * e, hD - hU));
}
```

OK, I think I have enough of a plan. Let me write the full implementation now.

Let me also think about the freeze functionality. When frozen:
- No autopilot movement
- No time progression
- No water animation
- But user input still works
- Rendering continues

So I need a `frozen` flag that:
- Stops the time from advancing
- Stops the autopilot
- Stops the water animation time from advancing
- But still processes user input and renders

For the `setCamera` function, I need to handle the "push up" logic:
- Compute terrain height at (x, z)
- If y < terrainHeight + margin, push y up
- Also ensure y > 0 (water surface) + margin

Let me now write the complete code. This will be long but I'll make it work.

Actually, let me reconsider the terrain rendering approach. Instead of separate VBOs per chunk, I'll use a single large VBO and index buffer that I update each frame. This is simpler and avoids the overhead of many small buffer allocations.

Wait, uploading 200k vertices (each 36 bytes) = 7.2MB per frame is too much for a single VBO update.

Better approach: use a pool of VBOs. Each VBO holds one chunk's worth of data. I keep a pool of, say, 200 VBOs. Each frame:
1. Determine which chunks are visible
2. For each visible chunk, check if I already have a VBO for it
3. If not, allocate a VBO from the pool and upload the data
4. Draw all visible chunks
5. For chunks no longer visible, return their VBOs to the pool

This way, I only upload data when a new chunk appears. As the camera moves, only a few new chunks appear per frame (those entering the view), so the upload is minimal.

Let me implement this with a simple Map:
```javascript
const chunkVBOs = new Map(); // key: "type_tx_tz" → { vbo, ibo, count }
```

When a chunk is no longer needed (beyond a certain distance), I delete it from the map and the VBO/IBO get garbage collected.

Actually, for performance, I should pre-allocate the VBOs and reuse them. Let me use a simpler approach:

- Pre-allocate N VBOs (e.g., 150)
- Each frame, determine which chunks are needed
- Assign chunks to VBOs (chunks that were already assigned keep their VBO)
- Upload data only for newly assigned chunks
- Draw all assigned chunks

This is essentially a spatial hash with LRU eviction. Let me implement it:

```javascript
const MAX_CHUNKS = 200;
const chunkPool = []; // array of { vbo, ibo, count, key }
for (let i = 0; i < MAX_CHUNKS; i++) {
    chunkPool.push({ vbo: gl.createBuffer(), ibo: gl.createBuffer(), count: 0, key: null });
}

const chunkMap = new Map(); // key → pool index

function assignChunk(key, data) {
    if (chunkMap.has(key)) {
        return; // already assigned
    }
    
    // Find a free slot or evict the least recently used
    let slot;
    for (let i = 0; i < MAX_CHUNKS; i++) {
        if (chunkPool[i].key === null) {
            slot = i;
            break;
        }
    }
    
    if (slot === undefined) {
        // Evict a random one (or the one farthest from camera)
        // For simplicity, just pick the first one
        slot = 0;
        chunkMap.delete(chunkPool[0].key);
    }
    
    // Upload data
    gl.bindBuffer(gl.ARRAY_BUFFER, chunkPool[slot].vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, chunkPool[slot].ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, gl.STATIC_DRAW);
    
    chunkPool[slot].key = key;
    chunkPool[slot].count = data.indices.length;
    chunkMap.set(key, slot);
}
```

This should work well. Let me now write the full implementation.

One more consideration: the `terrainHeight(x, z)` API needs to return the exact height that the rendered terrain uses. Since I'm computing heights with the same function used to generate the mesh, this should be consistent. The only issue is that the mesh vertices are at discrete positions, so the actual rendered surface at an arbitrary (x, z) might be slightly different from the analytical height (due to interpolation between vertices). But for the API, I'll just return the analytical height, which is what the vertices are computed from.

Let me now write the complete file. I'll be thorough and make sure everything works together.

Here's my final structure:

```
1. HTML + CSS
2. JavaScript:
   a. Constants and state
   b. Matrix math
   c. Noise functions
   d. Terrain height function
   e. Color function
   f. Normal computation
   g. Chunk geometry generation
   h. WebGL setup (shaders, buffers, programs)
   i. Chunk management
   j. Water rendering
   k. Sky rendering
   l. Camera system
   m. Day/night cycle
   n. Input handling
   o. Main render loop
   p. UI updates
   q. Grader API (window.__arena)
   r. Initialization
```

Let me write it all out now. I'll be careful about:
- No console errors
- Proper WebGL state management
- Correct matrix math
- Smooth performance
- Beautiful visuals

Let me start coding:

For the sky, I'll render a fullscreen quad. The trick is computing the ray direction in the fragment shader. I'll pass the camera's right, up, and forward vectors, plus the FOV tangent and aspect ratio.

Actually, the cleanest way: pass the inverse view-rotation (3x3) and compute the direction as:
```
dir = invViewRot * vec3(ndc.x * tan(fov/2) * aspect, ndc.y * tan(fov/2), -1)
```

Where ndc is the clip-space position (x, y, 1 for the near plane... actually for a direction, I should use the far plane or just the normalized direction).

Let me just pass the camera basis vectors (right, up, forward) and compute:
```
dir = normalize(forward + ndc.x * tan(fov/2) * aspect * right + ndc.y * tan(fov/2) * up)
```

This gives the world-space direction of the ray through each pixel.

For the stars, I'll use a hash function on the direction to create a pseudo-random star pattern.

Let me also add some atmospheric scattering approximation:
- At the horizon, the sky is lighter (more scattering)
- At the zenith, it's deeper blue
- At sunset, the horizon turns orange/red

I'll compute the sky color based on:
1. The angle between the ray and the sun
2. The elevation of the ray
3. The time of day (sun elevation)

This is getting complex. Let me simplify:
- Compute a "sun elevation factor" (0 at night, 1 at noon)
- Sky top color: interpolate between night (dark blue) and day (bright blue)
- Sky horizon color: interpolate between night (dark) and day (light blue) and sunset (orange)
- The horizon color changes based on sun elevation:
  - Sun below horizon: dark
  - Sun at horizon: orange/pink
  - Sun high: light blue/white

Let me define the color palette:
```javascript
function getSkyColors(sunElev) {
    // sunElev: -1 (night) to 1 (noon)
    const dayFactor = smoothstep(-0.1, 0.3, sunElev); // 0 at night, 1 during day
    const sunsetFactor = Math.max(0, 1 - Math.abs(sunElev) / 0.3) * (1 - dayFactor); // peak at horizon
    
    // Top of sky
    const topDay = [0.3, 0.55, 0.95];
    const topNight = [0.02, 0.02, 0.05];
    const top = lerp3(topNight, topDay, dayFactor);
    
    // Horizon
    const horizonDay = [0.65, 0.8, 0.95];
    const horizonNight = [0.03, 0.03, 0.08];
    const horizonSunset = [0.9, 0.4, 0.1];
    
    let horizon = lerp3(horizonNight, horizonDay, dayFactor);
    horizon = lerp3(horizon, horizonSunset, sunsetFactor * 0.8);
    
    return { top, horizon };
}
```

For the fog color, I'll use the horizon color (this makes the terrain blend into the sky at the horizon).

OK, I think I have enough planning. Let me write the full code now.

One thing I want to be careful about: the `setSeed` function needs to regenerate ALL visible chunks. When the seed changes, all cached chunk data is invalid, so I need to clear the chunk cache and regenerate.

Also, `freeze(on)` should:
- When on: stop time advancement, stop autopilot, stop water animation
- When off: resume everything
- User input still works when frozen

Let me also think about the water rendering. The water should:
1. Be rendered after terrain (with blending)
2. Cover a large area around the camera
3. Have animated waves
4. Have fresnel reflection
5. Blend at shorelines (where terrain is near water level)

For shoreline blending, I can use the terrain height at the water surface position. If the terrain is just below water level, the water should be more transparent. I can do this by passing the terrain height as a uniform... but that's per-pixel. 

Alternative: in the water fragment shader, I can use a height-based alpha. Since the water is at y=0, and I know the camera position, I can compute the terrain height at the fragment's world position... but I don't have access to the terrain height function in the shader.

Simpler approach: just use a fixed alpha for the water (e.g., 0.7) and let the depth test handle the rest. The terrain below water will be visible through the semi-transparent water, giving a natural shoreline effect.

Actually, even simpler: render the water with alpha blending. Where the terrain is above water, the water is occluded (depth test). Where the terrain is below water, the water is semi-transparent and you can see the terrain (sandy bottom) through it. This gives a natural shoreline effect without any special handling.

Let me finalize my approach and write the code. I'll aim for clean, working code that looks good.

Here's my final plan for the rendering order:
1. Clear depth buffer
2. Render sky (fullscreen quad, no depth test, or depth = 1)
3. Render terrain (depth test on, depth write on)
4. Render water (depth test on, depth write off, blend on)

For the sky, I'll use `gl.depthFunc(gl.ALWAYS)` and `gl.depthMask(false)` so it doesn't affect the depth buffer.

Let me write the code now. I'll be thorough.

Actually wait - one more thing. The `stats()` function needs to return `{ chunks: number, triangles: number }`. I'll track:
- `chunks`: number of active chunks
- `triangles`: sum of triangles drawn in the last frame (terrain + water)

Let me also make sure the FPS counter works. I'll use a simple moving average.

OK, writing the code now. Let me be very careful with the WebGL calls to avoid errors.

For the water mesh, I'll create a 64x64 grid quad that follows the camera. Size: 4000m x 4000m centered on camera.

Actually, I'll make the water quad follow the camera's XZ position so it's always centered. The Y is always 0 (sea level).

For the water vertex data, I'll use a static index buffer and a dynamic vertex buffer (since the position follows the camera). Actually, I can just use a uniform offset in the vertex shader:

```glsl
attribute vec3 aPosition; // local position, centered at origin
uniform vec3 uOffset; // camera XZ, 0 for Y
...
vec3 worldPos = aPosition + uOffset;
```

This way I only need to update the uniform, not the buffer.

The water quad: 64x64 grid, 4000m x 4000m, centered at origin. Each vertex has (x, 0, z) in local space.

Let me write the complete code now. I'll structure it carefully.

One more thought on the noise: I need to make sure the `terrainHeight` function is fast enough to be called for each vertex during chunk generation. With 6 octaves of fBm + 5 octaves of ridged + domain warping (3 octaves × 2), that's a lot of noise evaluations per vertex.

For a 33x33 vertex chunk, that's 1089 height evaluations. Each height evaluation involves:
- 2 domain warp noise calls (3 octaves each) = 6 noise calls
- 1 base fBm (4 octaves) = 4 noise calls
- 1 detail fBm (5 octaves) = 5 noise calls
- 1 ridged (5 octaves) = 5 noise calls
Total: ~20 noise calls per vertex
Total for chunk: 1089 * 20 = 21,780 noise calls

Each noise call involves 4 hash lookups + interpolation. With 60 new chunks per second (during fast movement), that's 1.3M noise calls per second. Should be fine for JavaScript.

For the `terrainHeight` API call (which might be called frequently by the grader), I should make sure it's fast. The same ~20 noise calls should be fine.

Let me also think about the normal computation. For each vertex, I need 4 additional height evaluations (for finite differences). That's 4x the cost. For 1089 vertices, that's 1089 * 4 * 20 = 87,120 noise calls per chunk. Still manageable.

Actually, I can optimize by computing the normal analytically from the noise function's gradient. But that's complex. Let me just use finite differences with a small epsilon (1m).

Alright, I'm going to write the full code now. Let me be systematic.

```javascript
// State
let currentSeed = 42;
let timeOfDay = 10; // hours
let frozen = false;
let autopilot = true;
let camPos = [0, 100, 0];
let camYaw = 0;
let camPitch = -0.2;
let animTime = 0; // for water animation
let lastFrameTime = 0;
let fps = 60;
let fpsSmooth = 60;

// Camera velocity for smooth movement
let camVel = [0, 0, 0];
```

Let me write it all out in one go now. I'll make it comprehensive.

Actually, I realize I should double-check my view matrix. Let me trace through an example:

Camera at (0, 10, 0), yaw = 0 (looking at -z), pitch = 0 (level).

Forward = (-sin(0)*cos(0), sin(0), -cos(0)*cos(0)) = (0, 0, -1)
Right = (cos(0), 0, -sin(0)) = (1, 0, 0)
Up = (sin(0)*sin(0), cos(0), cos(0)*sin(0)) = (0, 1, 0)
Back = (0, 0, 1)

View matrix:
```
[1, 0, 0, 0,   0, 1, 0, 0,   0, 0, 1, 0,   0, -10, 0, 1]
```

A point at (0, 10, -10) (10m in front of camera, same height):
- After view: (0, 10, 10) - wait, that puts it behind the camera!

Let me check: (0, 10, -10) with the view matrix:
- x' = 1*0 + 0*10 + 0*(-10) + 0 = 0
- y' = 0*0 + 1*10 + 0*(-10) + (-10) = 0
- z' = 0*0 + 0*10 + 1*(-10) + 0 = -10

So in camera space: (0, 0, -10). Negative z means in front of camera. ✓

Another point: (0, 10, 10) (10m behind camera):
- x' = 0
- y' = 0
- z' = 10

Positive z means behind camera. ✓

Great, the view matrix is correct.

Now let me think about the perspective matrix. Standard OpenGL perspective:

```
[ f/aspect  0       0                    0        ]
[ 0         f       0                    0        ]
[ 0         0      (far+near)/(near-far) -1        ]
[ 0         0      2*far*near/(near-far)  0        ]
```

In column-major (WebGL):
```
[f/aspect, 0, 0, 0,  0, f, 0, 0,  0, 0, (far+near)/(near-far), -1,  0, 0, 2*far*near/(near-far), 0]
```

This maps a point at (0, 0, -d) (in front of camera) to:
- x' = 0
- y' = 0
- z' = d * (far+near)/(near-far) - 1 * d = d * ((far+near) - (near-far)) / (near-far) = d * 2*far / (near-far)

Wait let me redo:
- w' = -z * 1 + 0 = -(-d) = d... wait no.

The 4th column of the perspective matrix is [0, 0, -1, 0]. So:
- x' = f/aspect * x
- y' = f * y
- z' = (far+near)/(near-far) * z - w = (far+near)/(near-far) * z - 1 * z = z * ((far+near) - (near-far)) / (near-far) = z * 2*far / (near-far)

Wait, I'm confusing myself. Let me use the standard form:

```
P = [
  f/aspect  0    0                        0
  0         f    0                        0
  0         0   -(far+near)/(far-near)  -2*far*near/(far-near)
  0         0   -1                       0
]
```

In column-major: [f/aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, -(far+near)/(far-near), -1, 0, 0, -2*far*near/(far-near), 0]

For a point (0, 0, -d) in camera space:
- x' = 0
- y' = 0
- z' = -(far+near)/(far-near) * (-d) + (-2*far*near)/(far-near) * 1 = d*(far+near)/(far-near) - 2*far*near/(far-near) = (d*(far+near) - 2*far*near) / (far-near)
- w' = -(-d) = d

After perspective divide: z/w = (d*(far+near) - 2*far*near) / (d*(far-near))

For d = near: z/w = (near*(far+near) - 2*far*near) / (near*(far-near)) = (far+near - 2*far) / (far-near) = (near-far) / (far-near) = -1 ✓
For d = far: z/w = (far*(far+near) - 2*far*near) / (far*(far-near)) = (far+near - 2*near) / (far-near) = (far-near) / (far-near) = 1 ✓

So the perspective matrix is:
```javascript
function mat4Perspective(fovY, aspect, near, far) {
    const f = 1.0 / Math.tan(fovY / 2);
    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, -(far + near) / (far - near), -1,
        0, 0, -2 * far * near / (far - near), 0
    ]);
}
```

Let me verify with a point (0, 0, -d):
- Column 3 (w): 0*x + 0*y + (-1)*z + 0*1 = -z = d ✓
- Column 2 (z): 0*x + 0*y + (-(far+near)/(far-near))*z + (-2*far*near/(far-near))*1
  = (far+near)/(far-near) * d - 2*far*near/(far-near)
  = (d*(far+near) - 2*far*near) / (far-near)

After divide by w=d: (far+near - 2*far*near/d) / (far-near)

For d=near: (far+near-2*far)/(far-near) = (near-far)/(far-near) = -1 ✓
For d=far: (far+near-2*near)/(far-near) = (far-near)/(far-near) = 1 ✓



Now let me write the full code. I'll be very careful and thorough.

For the matrix multiply, I need to be careful about column-major order:

```javascript
function mat4Mul(a, b) {
    const out = new Float32Array(16);
    for (let col = 0; col < 4; col++) {
        for (let row = 0; row < 4; row++) {
            out[col * 4 + row] =
                a[0 * 4 + row] * b[col * 4 + 0] +
                a[1 * 4 + row] * b[col * 4 + 1] +
                a[2 * 4 + row] * b[col * 4 + 2] +
                a[3 * 4 + row] * b[col * 4 + 3];
        }
    }
    return out;
}
```

Here `a` and `b` are in column-major format. `out = a * b` means: the j-th column of out is a times the j-th column of b.

The model-view-projection matrix is: P * V * M (applied to a vertex as P * V * M * v).

Since I'm not using a model matrix (vertices are in world space), it's just P * V.

```javascript
const mvp = mat4Mul(projMat, viewMat);
```

Let me now write the complete implementation. I'll make it as clean and correct as possible.

For the terrain vertex shader, I'll pass the MVP matrix directly (or separate P and V if I need world-space position in the fragment shader for fog).

Actually, I need world-space position in the fragment shader for:
1. Fog (distance from camera)
2. Sun direction (world space)

So I'll pass the view matrix and position separately, and compute world position in the vertex shader.

Let me finalize the shader code:

Terrain vertex shader:
```glsl
attribute vec3 aPos;
attribute vec3 aNorm;
attribute vec3 aCol;

uniform mat4 uMVP;
uniform mat4 uView;

varying vec3 vNorm;
varying vec3 vCol;
varying vec3 vWorld;

void main() {
    vNorm = aNorm;
    vCol = aCol;
    vWorld = aPos;
    gl_Position = uMVP * vec4(aPos, 1.0);
}
```

Wait, I don't need uView in the vertex shader if I'm just passing world position as a varying. I only need uMVP for the clip position.

Terrain fragment shader:
```glsl
precision highp float;

varying vec3 vNorm;
varying vec3 vCol;
varying vec3 vWorld;

uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform vec3 uAmbientColor;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uCamPos;

void main() {
    vec3 N = normalize(vNorm);
    vec3 L = normalize(uSunDir);
    vec3 V = normalize(uCamPos - vWorld);
    
    float NdotL = max(dot(N, L), 0.0);
    
    // Diffuse
    vec3 diff = uSunColor * NdotL * uSunIntensity;
    
    // Ambient (hemisphere)
    float hemi = 0.5 + 0.5 * N.y;
    vec3 amb = uAmbientColor * hemi;
    
    // Specular
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 32.0) * 0.2 * uSunIntensity;
    
    vec3 color = vCol * (amb + diff) + uSunColor * spec;
    
    // Fog
    float dist = length(uCamPos - vWorld);
    float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
    color = mix(color, uFogColor, clamp(fogFactor, 0.0, 1.0));
    
    gl_FragColor = vec4(color, 1.0);
}
```

Water vertex shader:
```glsl
attribute vec3 aPos;
uniform mat4 uMVP;
uniform vec3 uOffset;

varying vec3 vWorld;

void main() {
    vec3 worldPos = aPos + uOffset;
    vWorld = worldPos;
    gl_Position = uMVP * vec4(worldPos, 1.0);
}
```

Water fragment shader:
```glsl
precision highp float;
varying vec3 vWorld;

uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uCamPos;
uniform float uTime;
uniform vec3 uSkyHorizon;
uniform vec3 uSkyTop;

void main() {
    // Wave height function
    vec2 p = vWorld.xz;
    float t = uTime;
    
    // Compute normal analytically
    float e = 0.5;
    
    float h00 = sin(p.x*0.08+t*1.8)*0.12 + cos(p.y*0.11+t*1.4)*0.08 + sin((p.x+p.y)*0.05+t*1.1)*0.1;
    float h10 = sin((p.x+e)*0.08+t*1.8)*0.12 + cos(p.y*0.11+t*1.4)*0.08 + sin((p.x+e+p.y)*0.05+t*1.1)*0.1;
    float h01 = sin(p.x*0.08+t*1.8)*0.12 + cos((p.y+e)*0.11+t*1.4)*0.08 + sin((p.x+p.y+e)*0.05+t*1.1)*0.1;
    
    float dhdx = (h10 - h00) / e;
    float dhdz = (h01 - h00) / e;
    
    vec3 N = normalize(vec3(-dhdx, 1.0, -dhdz));
    vec3 V = normalize(uCamPos - vWorld);
    
    // Fresnel
    float cosTheta = max(dot(N, V), 0.0);
    float F = 0.02 + 0.98 * pow(1.0 - cosTheta, 5.0);
    
    // Water color
    vec3 deepColor = vec3(0.02, 0.08, 0.15);
    vec3 shallowColor = vec3(0.1, 0.3, 0.4);
    float depth = max(0.0, 1.0 - vWorld.y); // not really using this since water is at y=0
    vec3 waterBase = mix(shallowColor, deepColor, 0.5);
    
    // Reflection (approximate)
    vec3 R = reflect(-V, N);
    float skyFactor = max(R.y, 0.0);
    vec3 reflectColor = mix(uSkyHorizon, uSkyTop, skyFactor);
    
    vec3 color = mix(waterBase, reflectColor, F * 0.8);
    
    // Sun specular
    vec3 sunRef = reflect(-uSunDir, N);
    float sunSpec = pow(max(dot(sunRef, V), 0.0), 128.0) * uSunIntensity * 2.0;
    color += uSunColor * sunSpec;
    
    // Fog
    float dist = length(uCamPos - vWorld);
    float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
    color = mix(color, uFogColor, clamp(fogFactor, 0.0, 1.0));
    
    gl_FragColor = vec4(color, 0.75);
}
```

Sky fragment shader:
```glsl
precision highp float;
varying vec2 vUv; // -1 to 1

uniform vec3 uSunDir;
uniform float uSunIntensity;
uniform vec3 uSkyTop;
uniform vec3 uSkyHorizon;
uniform float uNightFactor;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform vec3 uCamFwd;
uniform float uFovTan;
uniform float uAspect;

void main() {
    vec3 dir = normalize(uCamFwd + vUv.x * uFovTan * uAspect * uCamRight + vUv.y * uFovTan * uCamUp);
    
    // Sky gradient
    float h = dir.y;
    vec3 sky = mix(uSkyHorizon, uSkyTop, smoothstep(-0.05, 0.4, h));
    
    // Below horizon (ground reflection) - just use horizon color
    if (h < -0.05) {
        sky = uSkyHorizon * 0.8;
    }
    
    // Sun
    float sunDot = dot(dir, uSunDir);
    vec3 sunColor = vec3(1.0, 0.85, 0.6) * uSunIntensity;
    sky += sunColor * smoothstep(0.9995, 0.9998, sunDot) * 3.0; // sun disk
    sky += sunColor * pow(max(sunDot, 0.0), 64.0) * 0.3; // sun glow
    sky += sunColor * pow(max(sunDot, 0.0), 8.0) * 0.1; // wide glow
    
    // Stars
    if (uNightFactor > 0.1 && h > 0.0) {
        vec3 sd = floor(dir * 300.0);
        float star = fract(sin(dot(sd, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
        float starBright = step(0.997, star) * (1.0 - smoothstep(0.0, 0.3, h));
        sky += vec3(starBright) * uNightFactor * 0.8;
    }
    
    gl_FragColor = vec4(sky, 1.0);
}
```

Hmm, the star generation with `floor(dir * 300.0)` might not look great because the direction changes with camera rotation. Let me use a different approach: hash the direction to get a stable star pattern.

Actually, the issue is that `dir` is a continuous vector, and `floor(dir * 300.0)` creates a grid that rotates with the camera. Stars should be fixed in the sky (not rotating with the camera). But since I'm computing the direction in world space, the stars ARE fixed in world space - they just appear at different screen positions as the camera rotates. That's correct! The issue is just the visual quality of the hash.

Let me use a better hash:
```glsl
float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
```

Actually, for stars I'll use a simpler approach: divide the sky into cells and hash each cell:
```glsl
vec3 sd = dir * 100.0;
vec3 cell = floor(sd);
float star = fract(sin(dot(cell, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
```

This should give a stable star pattern. The density is controlled by the threshold on `star`.

OK, I think I've planned enough. Let me write the complete code now. I'll make it work correctly and look good.

Let me also think about potential issues:
1. **Z-fighting**: The water and terrain might z-fight at the shoreline. I'll handle this by rendering water with a slight offset (y = 0.01) and using polygon offset or just accepting it.
2. **Chunk popping**: When new chunks appear, they might pop in. I'll mitigate this by generating chunks slightly beyond the view distance.
3. **Seams between chunks**: Adjacent chunks share edge vertices, so there shouldn't be gaps. I need to make sure the vertex positions match exactly at chunk boundaries.

For point 3: if chunk A covers x=[0, 128] and chunk B covers x=[128, 256], the edge vertex of A at x=128 and the edge vertex of B at x=128 must have the same y (height). Since I compute height from world coordinates, they will match exactly. ✓

For the water, I'll render it as a single large quad (not per-chunk) that follows the camera. This avoids seams.

Let me now write the final code. I'll aim for ~800-1000 lines of well-organized JavaScript.

One more thing: for the `setCamera` API, I need to handle the case where the requested y is below the minimum. The minimum is:
- max(terrainHeight(x, z) + 2, 2)  // 2m above terrain or 2m above water, whichever is higher

Let me code this up.

Also for `getCamera()`, I return the actual camera position (which may have been pushed up).

Let me write the final implementation now:
