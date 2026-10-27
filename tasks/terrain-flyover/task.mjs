export const meta = {
  title: 'Horizon',
  subtitle: 'Infinite terrain in raw WebGL',
  order: 5,
  skills: ['WebGL & shaders', 'procedural generation', 'streaming LOD'],
  summary:
    'A seeded, endless heightfield streamed in chunks with water, fog, sky, a day/night cycle and an autopilot camera, all in hand-written WebGL.',
  judging: [
    'How beautiful is it: lighting, colors, fog, water, sky and sunsets?',
    'Is the flight smooth, with no popping, seams or visible world edges?',
    'Does manual flying feel good? Is the overlay UI elegant and out of the way?',
  ],
};

const API = ['freeze', 'setSeed', 'setTime', 'setCamera', 'getCamera', 'terrainHeight', 'stats'];
const cam = (t) => t.eval(() => window.__arena.getCamera());
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

// A frozen, fully specified frame: the only deterministic way to compare
// renders across seeds and times of day.
async function frame(t, { seed = 1337, time = 12, x = 0, z = 0, yaw = 0, pitch = -0.12, alt = 60 } = {}) {
  await t.eval(({ seed, time, x, z, yaw, pitch, alt }) => {
    const a = window.__arena;
    a.freeze(true);
    a.setSeed(seed);
    a.setTime(time);
    const h = Math.max(a.terrainHeight(x, z), 0);
    a.setCamera({ x, y: h + alt, z, yaw, pitch });
  }, { seed, time, x, z, yaw, pitch, alt });
  await t.sleep(150);
  return t.stableShot({ timeout: 6000 });
}

async function findLand(t, x0, z0, seed = 1337) {
  return t.eval(({ x0, z0, seed }) => {
    const a = window.__arena;
    a.setSeed(seed);
    for (let r = 0; r < 4000; r += 150)
      for (let k = 0; k < 8; k++) {
        const x = x0 + r * Math.cos(k), z = z0 + r * Math.sin(k);
        if (a.terrainHeight(x, z) > 25) return { x, z, h: a.terrainHeight(x, z) };
      }
    return { x: x0, z: z0, h: a.terrainHeight(x0, z0) };
  }, { x0, z0, seed });
}

const lum = (t, img, region) => t.image.stats(img, region).lum;
const canvasInfo = (t) =>
  t.eval(() => {
    const c = [...document.querySelectorAll('canvas')].sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
    return c && { rect: c.getBoundingClientRect().toJSON(), width: c.width, height: c.height, cw: c.clientWidth, ch: c.clientHeight };
  });

export const checks = [
  {
    id: 'webgl',
    title: 'Raw WebGL canvas and the __arena API',
    points: 5,
    async run(t) {
      await t.part('uses a WebGL context', async () => {
        const p = await t.probe();
        const types = p.canvases.map((c) => c.type);
        return t.ok(types.some((x) => /webgl/i.test(x)), `contexts: ${types.join(', ') || 'none'}`);
      }, 2);
      await t.part('canvas covers the viewport', async () => {
        const c = await canvasInfo(t);
        return t.ok(c && c.rect.width * c.rect.height >= 0.95 * 1280 * 800, c ? `${Math.round(c.rect.width)}×${Math.round(c.rect.height)}` : 'no canvas');
      });
      await t.part('__arena API complete', async () => {
        const have = await t.eval((API) => API.filter((k) => typeof window.__arena?.[k] === 'function'), API);
        return { score: have.length / API.length, note: `missing: ${API.filter((k) => !have.includes(k)).join(', ') || 'none'}` };
      });
      await t.part('#time range and #seed number inputs', () => t.eval(() => !!document.querySelector('input#time[type=range]') && !!document.querySelector('input#seed[type=number]')));
    },
  },
  {
    id: 'renders',
    title: 'Renders a landscape',
    points: 6,
    async run(t) {
      await t.sleep(2000);
      const img = await t.screenshot();
      await t.part('scene is not blank', () => {
        const s = t.image.stats(img);
        return t.ok(s.lumStd > 12, `luminance std ${s.lumStd.toFixed(1)}`);
      }, 2);
      await t.part('sky and ground differ', () => {
        const top = t.image.stats(img, { x: 0, y: 0, width: 1280, height: 200 }).mean;
        const bot = t.image.stats(img, { x: 0, y: 600, width: 1280, height: 200 }).mean;
        const d = Math.max(...top.map((v, i) => Math.abs(v - bot[i])));
        return t.ok(d > 15, `top ${top.map(Math.round)} vs bottom ${bot.map(Math.round)}`);
      });
      await t.part('stats() reports chunks and triangles', async () => {
        const s = await t.eval(() => window.__arena.stats());
        return t.ok(s?.chunks > 0 && s?.triangles > 1000, JSON.stringify(s));
      });
    },
  },
  {
    id: 'animates',
    title: 'Autopilot flies on load',
    points: 4,
    async run(t) {
      await t.sleep(1000);
      const c0 = await cam(t);
      const a = await t.screenshot();
      await t.sleep(700);
      const b = await t.screenshot();
      const c1 = await cam(t);
      await t.part('image changes over time', () => t.ok(t.image.diff(a, b) > 0.01, `${(t.image.diff(a, b) * 100).toFixed(2)}% changed`));
      await t.part('camera moves on autopilot', () => t.ok(dist(c0, c1) > 1, `moved ${dist(c0, c1).toFixed(2)} m in 0.7 s`));
    },
  },
  {
    id: 'freeze',
    title: 'freeze() stops all motion',
    points: 6,
    async run(t) {
      const a = await frame(t);
      const c0 = await cam(t);
      await t.sleep(800);
      const b = await t.screenshot();
      const c1 = await cam(t);
      await t.part('frozen image is static', () => t.ok(t.image.diff(a, b) < 0.003, `${(t.image.diff(a, b) * 100).toFixed(2)}% changed in 0.8 s`), 2);
      await t.part('frozen camera holds still', () => t.ok(dist(c0, c1) < 0.01, `moved ${dist(c0, c1).toFixed(3)} m`));
    },
  },
  {
    id: 'determinism',
    title: 'Seeded, deterministic world',
    points: 8,
    async run(t) {
      const A = await frame(t, { seed: 1337 });
      const B = await frame(t, { seed: 4242 });
      const C = await frame(t, { seed: 1337 });
      await t.part('different seeds give different worlds', () => t.ok(t.image.diff(A, B) > 0.05, `${(t.image.diff(A, B) * 100).toFixed(1)}% differ`));
      await t.part('same seed reproduces the image', () => t.ok(t.image.diff(A, C) < 0.01, `${(t.image.diff(A, C) * 100).toFixed(2)}% differ`), 2);
      await t.part('#seed reflects setSeed', async () => t.ok(Number(await t.page.inputValue('#seed')) === 1337, `#seed = ${await t.page.inputValue('#seed')}`));
      await t.part('terrainHeight is seed-dependent and reproducible', async () => {
        const h = await t.eval(() => {
          const a = window.__arena;
          a.setSeed(1337); const h1 = a.terrainHeight(120, -340);
          a.setSeed(4242); const h2 = a.terrainHeight(120, -340);
          a.setSeed(1337); const h3 = a.terrainHeight(120, -340);
          return [h1, h2, h3];
        });
        return t.ok(Number.isFinite(h[0]) && h[0] === h[2] && h[0] !== h[1], `heights ${h.map((v) => v?.toFixed?.(2)).join(' / ')}`);
      });
      await t.setInput('#seed', '777');
      await t.sleep(200);
      const D = await t.stableShot({ timeout: 6000 });
      await t.part('#seed change event regenerates', () => t.ok(t.image.diff(C, D) > 0.05, `${(t.image.diff(C, D) * 100).toFixed(1)}% differ`));
    },
  },
  {
    id: 'day-night',
    title: 'Day / night lighting',
    points: 8,
    async run(t) {
      const noon = await frame(t, { time: 12 });
      const night = await frame(t, { time: 0 });
      const ln = lum(t, noon), lm = lum(t, night);
      await t.part('night is much darker than noon', () => ({
        score: lm < 0.5 * ln ? 1 : lm < 0.75 * ln ? 0.5 : 0,
        note: `mean luminance noon ${ln.toFixed(0)}, midnight ${lm.toFixed(0)}`,
      }), 3);
      await t.part('#time reflects setTime', async () => t.ok(Math.abs(Number(await t.page.inputValue('#time')) - 0) < 0.25, `#time = ${await t.page.inputValue('#time')}`));
      await frame(t, { time: 12 });
      await t.setInput('#time', '0');
      await t.sleep(200);
      const slider = await t.stableShot({ timeout: 6000 });
      await t.part('the #time slider drives the lighting', () => t.ok(lum(t, slider) < 0.75 * ln, `luminance after slider → 0: ${lum(t, slider).toFixed(0)}`));
    },
  },
  {
    id: 'sunset',
    title: 'Warm sunrise / sunset sky',
    points: 4,
    timeout: 60000,
    async run(t) {
      const sky = { x: 0, y: 0, width: 1280, height: 280 };
      const warmth = (img) => {
        const [r, , b] = t.image.stats(img, sky).mean;
        return r / (b + 1);
      };
      const noon = warmth(await frame(t, { time: 12, pitch: 0.1 }));
      let best = 0, at = '';
      for (const time of [6.5, 18]) {
        for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
          const w = warmth(await frame(t, { time, yaw, pitch: 0.1 }));
          if (w > best) { best = w; at = `${time} h, yaw ${yaw.toFixed(2)}`; }
        }
      }
      return {
        score: best >= noon * 1.3 && best > 0.9 ? 1 : best >= noon * 1.12 ? 0.5 : 0,
        note: `sky red/blue ratio: noon ${noon.toFixed(2)}, warmest ${best.toFixed(2)} at ${at}`,
      };
    },
  },
  {
    id: 'infinite',
    title: 'Infinite streamed terrain',
    points: 6,
    async run(t) {
      const origin = await frame(t);
      const land = await findLand(t, 50000, -50000);
      const far = await frame(t, { x: land.x, z: land.z, pitch: -0.25 });
      const lower = { x: 0, y: 400, width: 1280, height: 400 };
      await t.part('terrain renders 70 km from the origin', () => {
        const s = t.image.stats(far, lower);
        return t.ok(Number.isFinite(land.h) && s.lumStd > 6, `ground height ${land.h?.toFixed?.(1)}, lower-half luminance std ${s.lumStd.toFixed(1)}`);
      }, 2);
      await t.part('the far world is different terrain', () => t.ok(t.image.diff(origin, far) > 0.05, `${(t.image.diff(origin, far) * 100).toFixed(1)}% differ from origin view`));
      await t.part('chunks loaded around the new position', async () => {
        const s = await t.eval(() => window.__arena.stats());
        return t.ok(s?.chunks > 0 && s?.triangles > 1000, JSON.stringify(s));
      });
    },
  },
  {
    id: 'controls',
    title: 'Keyboard and mouse flight',
    points: 6,
    async run(t) {
      await t.sleep(800);
      await t.page.keyboard.press('f');
      await t.sleep(300);
      const c0 = await cam(t);
      await t.sleep(500);
      const c1 = await cam(t);
      await t.part('F turns autopilot off (camera holds)', () => t.ok(dist(c0, c1) < 0.5, `drifted ${dist(c0, c1).toFixed(2)} m`));
      await t.eval((c) => window.__arena.setCamera({ ...c, yaw: 0, pitch: 0 }), c1);
      await t.sleep(100);
      const c2 = await cam(t);
      await t.page.keyboard.down('w');
      await t.sleep(800);
      await t.page.keyboard.up('w');
      await t.sleep(150);
      const c3 = await cam(t);
      await t.part('W flies forward (toward −z at yaw 0)', () => {
        const fwd = c2.z - c3.z;
        return t.ok(fwd > 2 && Math.abs(c3.x - c2.x) < 0.5 * fwd, `Δz ${(c3.z - c2.z).toFixed(2)}, Δx ${(c3.x - c2.x).toFixed(2)}`);
      }, 2);
      await t.page.keyboard.down('d');
      await t.sleep(600);
      await t.page.keyboard.up('d');
      await t.sleep(150);
      const c4 = await cam(t);
      await t.part('D strafes right (+x)', () => ({ score: c4.x - c3.x > 1 ? 1 : Math.abs(c4.x - c3.x) > 1 ? 0.5 : 0, note: `Δx ${(c4.x - c3.x).toFixed(2)}` }));
      await t.drag({ x: 640, y: 400 }, { x: 840, y: 400 }, { steps: 20 });
      await t.sleep(200);
      const c5 = await cam(t);
      await t.part('mouse drag looks around', () => t.ok(Math.abs(c5.yaw - c4.yaw) > 0.05, `yaw ${c4.yaw.toFixed(3)} → ${c5.yaw.toFixed(3)}`));
      await t.page.keyboard.press('f');
      await t.sleep(900);
      const c6 = await cam(t);
      await t.part('F turns autopilot back on', () => t.ok(dist(c5, c6) > 1, `moved ${dist(c5, c6).toFixed(2)} m`));
    },
  },
  {
    id: 'no-clip',
    title: 'Camera never clips into the ground',
    points: 4,
    async run(t) {
      await t.sleep(500);
      const samplesOk = [];
      for (let i = 0; i < 20; i++) {
        samplesOk.push(await t.eval(() => {
          const c = window.__arena.getCamera();
          return c.y > window.__arena.terrainHeight(c.x, c.z) && c.y > 0;
        }));
        await t.sleep(150);
      }
      await t.part('autopilot stays above terrain and water', () => {
        const ok = samplesOk.filter(Boolean).length / samplesOk.length;
        return { score: ok === 1 ? 1 : ok * 0.5, note: `${Math.round(ok * 100)}% of samples above ground` };
      }, 2);
      const land = await findLand(t, 300, -900);
      await t.part('setCamera below ground is pushed up', async () => {
        const c = await t.eval(({ x, z }) => {
          const a = window.__arena;
          a.freeze(true);
          const h = a.terrainHeight(x, z);
          a.setCamera({ x, y: h - 40, z, yaw: 0, pitch: 0 });
          return { y: a.getCamera().y, h };
        }, land);
        return t.ok(c.y >= c.h, `requested ${(c.h - 40).toFixed(1)}, got ${c.y.toFixed(1)} over ground ${c.h.toFixed(1)}`);
      });
    },
  },
  {
    id: 'performance',
    title: 'Frame rate while flying',
    points: 8,
    async run(t) {
      // A blank page renders at 60 fps; only a real WebGL scene can earn this.
      const types = (await t.probe()).canvases.map((c) => c.type);
      if (!types.some((x) => /webgl/i.test(x))) return { score: 0, note: 'no WebGL context' };
      await t.sleep(1500);
      const f = await t.fps(3000);
      await t.part('frame rate', () => ({
        score: f.fps >= 55 ? 1 : f.fps >= 45 ? 0.75 : f.fps >= 30 ? 0.45 : f.fps >= 20 ? 0.25 : 0.1,
        note: `${f.fps.toFixed(1)} fps`,
      }), 3);
      await t.part('frame pacing (p95)', () => ({ score: f.p95 <= 20 ? 1 : f.p95 <= 34 ? 0.5 : 0, note: `p95 ${f.p95.toFixed(1)} ms, worst ${f.max.toFixed(1)} ms` }));
    },
  },
  {
    id: 'resize',
    title: 'Handles window resize',
    points: 4,
    async run(t) {
      await t.sleep(500);
      await t.page.setViewportSize({ width: 960, height: 600 });
      await t.sleep(800);
      const c = await canvasInfo(t);
      await t.part('canvas fills the resized window', () => t.ok(c && c.rect.width >= 950 && c.rect.height >= 590, c ? `${Math.round(c.rect.width)}×${Math.round(c.rect.height)}` : 'no canvas'));
      await t.part('drawing buffer follows the size', () => t.ok(c && Math.abs(c.width / c.cw - c.height / c.ch) < 0.03 && c.width >= c.cw * 0.5, c ? `buffer ${c.width}×${c.height} for ${c.cw}×${c.ch}` : 'no canvas'));
    },
  },
];

export async function showcase(t) {
  await t.sleep(3000);
  await t.shot('flight');
  await t.eval(() => window.__arena.setTime(17.6));
  await t.sleep(3000);
  await t.shot('sunset');
  await t.eval(() => window.__arena.setTime(23.5));
  await t.sleep(2500);
  await t.shot('night');
  await t.eval(() => window.__arena.setTime(9));
  await t.sleep(2500);
}
