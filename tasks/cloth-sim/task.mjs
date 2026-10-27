export const meta = {
  title: 'Silk',
  subtitle: 'Tearable cloth simulation',
  order: 4,
  skills: ['physics integration', 'constraint solving', 'canvas rendering'],
  summary:
    'A Verlet cloth of 50×35+ particles you can grab, cut and blow around, with a fixed-timestep solver, shaded fabric rendering and HiDPI support.',
  judging: [
    'Does it look like fabric? Lighting, shading, color, torn edges.',
    'Does it feel physical when you grab, pull and cut it? Is it stable?',
    'Is the wind convincing? Is the control panel elegant?',
  ],
};

const stats = (t) => t.eval(() => window.__arena?.stats?.());

async function samples(t, n = 10, gap = 100) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const s = await stats(t);
    out.push(s?.centroid ?? { x: NaN, y: NaN });
    if (i < n - 1) await t.sleep(gap);
  }
  return out;
}

function spread(pts) {
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
}

const finite = (p) => Number.isFinite(p?.x) && Number.isFinite(p?.y);
const fmtP = (p) => (p ? `(${p.x?.toFixed?.(1)}, ${p.y?.toFixed?.(1)})` : 'none');

// Mouse paths are walked with small pauses so the simulation sees a hand-speed
// drag rather than a teleport.
async function walk(t, from, to, { steps = 30, pause = 12, button = 'left' } = {}) {
  await t.page.mouse.move(from.x, from.y);
  await t.page.mouse.down({ button });
  for (let i = 1; i <= steps; i++) {
    await t.page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps);
    await t.sleep(pause);
  }
  return () => t.page.mouse.up({ button });
}

async function cut(t, y) {
  const vw = t.page.viewportSize().width;
  const s = await stats(t);
  const cx = s.centroid.x;
  const release = await walk(t, { x: Math.max(4, cx - 450), y }, { x: Math.min(vw - 4, cx + 450), y }, { steps: 45, pause: 10, button: 'right' });
  await release();
}

const mainCanvas = (t) =>
  t.eval(() => {
    let best = null;
    for (const c of document.querySelectorAll('canvas')) {
      const r = c.getBoundingClientRect();
      if (!best || r.width * r.height > best.area) best = { area: r.width * r.height, rect: r.toJSON(), width: c.width, height: c.height, cw: c.clientWidth, ch: c.clientHeight };
    }
    return best;
  });

async function toggleWind(t) {
  await t.page.click('#wind');
  await t.blur();
}

export const checks = [
  {
    id: 'structure',
    title: 'Canvas, stats API and controls',
    points: 5,
    async run(t) {
      const vp = t.page.viewportSize();
      await t.part('canvas covers the viewport', async () => {
        const c = await mainCanvas(t);
        const cover = c ? c.area / (vp.width * vp.height) : 0;
        return t.ok(cover >= 0.95, c ? `canvas ${Math.round(c.rect.width)}×${Math.round(c.rect.height)}` : 'no canvas');
      });
      const s = await stats(t);
      await t.part('__arena.stats() has the contract shape', () =>
        t.ok(s && ['particles', 'constraints', 'pinned'].every((k) => typeof s[k] === 'number') && finite(s.centroid), JSON.stringify(s)?.slice(0, 160)),
      );
      await t.part('at least 50×35 particles', () => ({
        score: s?.particles >= 1750 ? 1 : s?.particles >= 800 ? 0.5 : 0,
        note: `${s?.particles} particles, ${s?.constraints} constraints`,
      }));
      await t.part('#wind, #reset, #gravity exist', () => t.eval(() => ['#wind', '#reset', 'input#gravity'].every((q) => document.querySelector(q))));
    },
  },
  {
    id: 'stability',
    title: 'Settles to a stable rest',
    points: 8,
    async run(t) {
      await t.sleep(3000);
      // A blank page is perfectly "at rest"; only a real cloth can earn this.
      if (!finite((await stats(t))?.centroid)) return { score: 0, note: 'no cloth reported by __arena.stats()' };
      const pts = await samples(t);
      const vp = t.page.viewportSize();
      await t.part('centroid finite and inside the viewport', () => t.ok(pts.every(finite) && pts.every((p) => p.x > 0 && p.x < vp.width && p.y > 0 && p.y < vp.height), `last ${fmtP(pts.at(-1))}`));
      await t.part('at rest within 3 s (stats)', () => {
        const d = spread(pts);
        return { score: d < 2 ? 1 : d < 6 ? 0.5 : 0, note: `centroid moved ${d.toFixed(2)} px over 1 s` };
      }, 2);
      const a = await t.screenshot();
      await t.sleep(300);
      const b = await t.screenshot();
      await t.part('at rest within 3 s (pixels)', () => {
        const d = t.image.diff(a, b);
        return t.ok(d < 0.003, `${(d * 100).toFixed(2)}% of pixels changed in 300 ms`);
      });
      const s = await stats(t);
      await t.part('top edge pinned', () => t.ok(s?.pinned >= 2, `${s?.pinned} pinned`));
      await t.part('horizontally centered', () => t.ok(Math.abs(s.centroid.x - vp.width / 2) < 120, `centroid x ${s.centroid.x.toFixed(0)}`));
    },
  },
  {
    id: 'grab',
    title: 'Left-drag grabs and pulls the cloth',
    points: 10,
    async run(t) {
      await t.sleep(3000);
      const c0 = (await stats(t)).centroid;
      const release = await walk(t, c0, { x: c0.x + 220, y: c0.y + 40 });
      await t.sleep(600);
      const c1 = (await stats(t)).centroid;
      await release();
      await t.part('dragging pulls the cloth toward the cursor', () => {
        const dx = c1.x - c0.x;
        return { score: dx >= 12 ? 1 : dx >= 5 ? 0.5 : 0, note: `centroid moved ${dx.toFixed(1)} px right while dragging 220 px` };
      }, 2);
      await t.sleep(3500);
      const pts = await samples(t, 6, 100);
      await t.part('released cloth swings back and settles', () => {
        const back = Math.abs(pts.at(-1).x - c0.x);
        const d = spread(pts);
        return t.ok(back < 15 && d < 3, `${back.toFixed(1)} px from start, moving ${d.toFixed(1)} px`);
      });
    },
  },
  {
    id: 'cut',
    title: 'Right-drag cuts the cloth',
    points: 10,
    async run(t) {
      await t.sleep(3000);
      await t.eval(() => {
        window.__ctxmenu = [];
        window.addEventListener('contextmenu', (e) => window.__ctxmenu.push(e.defaultPrevented));
      });
      const s0 = await stats(t);
      await cut(t, s0.centroid.y);
      await t.sleep(200);
      const s1 = await stats(t);
      await t.part('constraints are removed along the cut', () => {
        const d = s0.constraints - s1.constraints;
        return { score: d >= 30 ? 1 : d >= 5 ? 0.5 : 0, note: `${s0.constraints} → ${s1.constraints} constraints` };
      }, 2);
      await t.sleep(2000);
      const s2 = await stats(t);
      await t.part('the cut-off part falls away', () => {
        const dy = s2.centroid.y - s0.centroid.y;
        return { score: dy >= 40 ? 1 : dy >= 15 ? 0.5 : 0, note: `centroid dropped ${dy.toFixed(1)} px` };
      }, 2);
      await t.part('context menu suppressed', async () => {
        const v = await t.eval(() => window.__ctxmenu);
        return t.ok(v.length > 0 && v.every(Boolean), v.length ? `defaultPrevented: ${v.join(',')}` : 'no contextmenu event observed');
      });
    },
  },
  {
    id: 'wind',
    title: 'Wind moves the cloth; it settles afterwards',
    points: 6,
    async run(t) {
      await t.sleep(2500);
      await toggleWind(t);
      await t.sleep(500);
      const a = await t.screenshot();
      const pts = await samples(t, 10, 200);
      const b = await t.screenshot();
      await t.part('wind animates the cloth', () => {
        const d = spread(pts);
        const px = t.image.diff(a, b);
        return t.ok(d > 4 || px > 0.01, `centroid range ${d.toFixed(1)} px, ${(px * 100).toFixed(1)}% pixels changed`);
      }, 2);
      await toggleWind(t);
      await t.sleep(4000);
      const rest = await samples(t, 6, 100);
      await t.part('settles after the wind stops', () => t.ok(spread(rest) < 3, `still moving ${spread(rest).toFixed(1)} px`));
    },
  },
  {
    id: 'pause',
    title: 'Space pauses and resumes',
    points: 5,
    async run(t) {
      await t.sleep(1500);
      await toggleWind(t);
      await t.sleep(800);
      await t.page.keyboard.press('Space');
      await t.sleep(150);
      const a = await t.screenshot();
      const sa = await stats(t);
      await t.sleep(400);
      const b = await t.screenshot();
      const sb = await stats(t);
      await t.part('paused canvas is frozen', () => {
        const d = t.image.diff(a, b);
        return t.ok(d < 0.003, `${(d * 100).toFixed(2)}% pixels changed while paused`);
      }, 2);
      await t.part('paused simulation state is frozen', () => t.ok(Math.abs(sa.centroid.x - sb.centroid.x) < 0.01 && Math.abs(sa.centroid.y - sb.centroid.y) < 0.01, `${fmtP(sa.centroid)} → ${fmtP(sb.centroid)}`));
      await t.page.keyboard.press('Space');
      await t.sleep(400);
      const c = await t.screenshot();
      await t.part('Space resumes', () => t.ok(t.image.diff(b, c) > 0.003, 'nothing moved after resuming (wind is on)'));
    },
  },
  {
    id: 'reset',
    title: 'Reset rebuilds the cloth',
    points: 4,
    async run(t) {
      await t.sleep(2500);
      const s0 = await stats(t);
      await cut(t, s0.centroid.y);
      await t.sleep(300);
      await t.page.click('#reset');
      await t.blur();
      await t.sleep(300);
      const s1 = await stats(t);
      await t.part('constraints restored', () => t.ok(s1.constraints === s0.constraints && s1.particles === s0.particles, `${s0.constraints} → ${s1.constraints} constraints`));
      await t.sleep(3000);
      const s2 = await stats(t);
      await t.part('hangs like the original again', () => t.ok(Math.abs(s2.centroid.x - s0.centroid.x) < 10 && Math.abs(s2.centroid.y - s0.centroid.y) < 10, `${fmtP(s0.centroid)} vs ${fmtP(s2.centroid)}`));
    },
  },
  {
    id: 'performance',
    title: 'Frame rate under wind',
    points: 8,
    async run(t) {
      await t.sleep(1000);
      await toggleWind(t);
      await t.sleep(500);
      const f = await t.fps(2500);
      await t.part('frame rate', () => ({
        score: f.fps >= 55 ? 1 : f.fps >= 45 ? 0.7 : f.fps >= 30 ? 0.4 : 0.1,
        note: `${f.fps.toFixed(1)} fps`,
      }), 3);
      await t.part('frame pacing (p95)', () => ({ score: f.p95 <= 20 ? 1 : f.p95 <= 34 ? 0.5 : 0, note: `p95 ${f.p95.toFixed(1)} ms, worst ${f.max.toFixed(1)} ms` }));
    },
  },
  {
    id: 'hidpi',
    title: 'Crisp on HiDPI (devicePixelRatio 2)',
    points: 4,
    context: { deviceScaleFactor: 2 },
    async run(t) {
      const c = await mainCanvas(t);
      await t.part('backing store scaled by devicePixelRatio', () => t.ok(c && c.width >= c.cw * 1.9, c ? `canvas.width ${c.width} for ${c.cw} CSS px` : 'no canvas'), 2);
      await t.sleep(2500);
      const s = await stats(t);
      await t.part('centroid stays in CSS pixels', () => t.ok(s && Math.abs(s.centroid.x - 640) < 150 && s.centroid.y < 800, `centroid ${fmtP(s?.centroid)}`));
    },
  },
  {
    id: 'resize',
    title: 'Handles window resize',
    points: 4,
    async run(t) {
      await t.sleep(1000);
      await t.page.setViewportSize({ width: 960, height: 640 });
      await t.sleep(800);
      const c = await mainCanvas(t);
      await t.part('canvas fills the resized window', () => t.ok(c && c.area >= 0.95 * 960 * 640, c ? `${Math.round(c.rect.width)}×${Math.round(c.rect.height)}` : 'no canvas'));
      await t.part('drawing buffer matches the new size', () => t.ok(c && Math.abs(c.width - c.cw) / c.cw < 0.03, c ? `canvas.width ${c.width}, client ${c.cw}` : 'no canvas'));
      await t.sleep(3000);
      const s = await stats(t);
      await t.part('cloth still visible', () => t.ok(s && s.centroid.x > 0 && s.centroid.x < 960 && s.centroid.y > 0 && s.centroid.y < 640, `centroid ${fmtP(s?.centroid)}`));
    },
  },
  {
    id: 'surface',
    title: 'Rendered as a filled surface',
    points: 4,
    async run(t) {
      await t.sleep(3000);
      const s = await stats(t);
      const img = await t.screenshot();
      const vp = t.page.viewportSize();
      const bottom = [];
      for (let x = 20; x < vp.width - 20; x += 40) bottom.push(t.image.pixel(img, x, vp.height - 12));
      const med = [0, 1, 2].map((ch) => bottom.map((p) => p[ch]).sort((a, b) => a - b)[Math.floor(bottom.length / 2)]);
      const cover = t.image.coverage(img, { x: s.centroid.x - 80, y: s.centroid.y - 60, width: 160, height: 120 }, med, { tolerance: 18 });
      return { score: cover >= 0.85 ? 1 : cover >= 0.6 ? 0.5 : 0, note: `${Math.round(cover * 100)}% of the cloth's center differs from the background` };
    },
  },
];

export async function showcase(t) {
  await t.sleep(2500);
  await t.shot('rest');
  const c = (await stats(t))?.centroid ?? { x: 640, y: 400 };
  const release = await walk(t, c, { x: c.x + 160, y: c.y - 40 }, { steps: 40, pause: 16 });
  for (let a = 0; a < Math.PI * 2; a += 0.15) {
    await t.page.mouse.move(c.x + 160 * Math.cos(a), c.y - 40 + 80 * Math.sin(a));
    await t.sleep(25);
  }
  await t.shot('grabbed');
  await release();
  await t.sleep(1500);
  await toggleWind(t);
  await t.sleep(2500);
  await t.shot('wind');
  await cut(t, c.y + 40);
  await t.sleep(1800);
  await t.shot('cut');
}
