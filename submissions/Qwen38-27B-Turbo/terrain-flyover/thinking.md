This is a substantial WebGL task. Let me break down what I need to build:

1. **Raw WebGL terrain renderer** - no libraries, own shaders, buffers, matrix math
2. **Infinite procedural terrain** - chunked, seeded fractal noise, LOD
3. **Water, sky, fog** - animated waves, day/night cycle
4. **Camera controls** - autopilot, manual flight, terrain following
5. **Grader API** - window.__arena with specific methods
6. **UI** - slider for time, seed input, FPS counter, autopilot indicator

Let me plan the architecture:

**Math utilities** (no gl-matrix):
- mat4: perspective, lookAt, multiply, translate, rotate, inverse
- vec3: normalize, cross, add, scale, etc.

**Noise function** (deterministic):
- Simplex or Perlin noise based on seed
- fBm (fractional Brownian motion) for terrain
- Domain warping for more natural look

**Terrain system**:
- Heightfield grid (e.g., 64x64 vertices per chunk)
- Chunk size: 100m
- Generate chunks around camera, discard distant ones
- Compute normals from heightfield
- Material colors based on height and slope

**Water**:
- Flat plane at y=0
- Animated vertex displacement (sine waves)
- Fresnel-like effect in fragment shader

**Sky**:
- Fullscreen quad or skybox
- Gradient based on sun position
- Sun disc
- Stars at night

**Day/night cycle**:
- Time 0-24 hours
- Sun position: y = sin(hour * π/12), z = cos(hour * π/12)
- Light color: warm at sunrise/sunset, white at noon, dark blue at night

**Camera**:
- Position, yaw, pitch
- Autopilot: move forward, follow terrain height
- Manual: WASDQE + mouse drag

**Grader API**:
- window.__arena object with freeze, setSeed, setTime, setCamera, getCamera, terrainHeight, stats

Let me start coding. This will be a large file.

For the noise function, I'll implement a deterministic hash-based approach. The seed affects the permutation table used in the noise.

For LOD, I'll use a simpler approach: generate chunks at full resolution but reduce vertex density for distant chunks. Actually, for simplicity and to avoid seams, I'll use a fixed resolution and rely on distance fog to hide the far chunks. The chunks closest to the camera will be high res, and I can regenerate them as the camera moves.

Actually, for a simpler approach that still looks good: generate terrain chunks at a fixed resolution (e.g., 64x64) with chunk size 100m. As the camera moves, discard chunks beyond a certain distance and generate new ones. This creates a streaming effect.

For the matrix math, I need:
- mat4 perspective projection
- mat4 view matrix (from camera position, yaw, pitch)
- mat4 model matrix (identity for terrain)
- mat4 multiplication

Let me implement this step by step.

```hemlock
// Not Hemlock, this is HTML/JS. Let me write the actual code.
```

Let me write the full implementation. I'll be careful about:
- Deterministic noise (seed-based permutation table)
- Proper matrix math
- Efficient chunk management
- Clean shader code
- All the grader API methods

For the noise, I'll use a value noise approach with smooth interpolation, which is simpler to implement than simplex. The seed generates a permutation table.

Actually, for better terrain quality, let me use a proper Perlin-style noise with gradient vectors. But that's more complex. Let me use value noise with quintic interpolation for smoothness.

The fBm will sum multiple octaves of the noise with decreasing frequency and amplitude.

For domain warping, I'll use the output of one noise function to displace the input coordinates of another, creating more organic patterns.

Let me start writing the code. This will be quite long but I'll make it clean and well-structured.

Key shader features:
- Vertex shader: position + normal + texture coordinates (derived from world position)
- Fragment shader: lighting (Lambert + specular), material colors, fog
- Water shader: wave animation, fresnel reflection
- Sky shader: gradient + sun

For the day/night cycle, I'll compute:
- Sun direction: based on time (0-24)
- At noon (12), sun is at zenith (y=1)
- At 6 and 18, sun is at horizon (y=0)
- At midnight (0), sun is at nadir (y=-1)

Light color:
- Day: white (1, 1, 0.9)
- Sunrise/sunset: orange (1, 0.5, 0.2)
- Night: blue (0.2, 0.3, 0.5)

Sky color:
- Day: blue (0.3, 0.5, 0.8)
- Sunset: orange/red gradient
- Night: dark blue/black

Let me write this out. I'll aim for a complete, working implementation.
