import fs from 'node:fs';

export const meta = {
  title: 'Vectorly',
  subtitle: 'Vector drawing editor',
  order: 2,
  skills: ['direct manipulation', 'coordinate math', 'undo history'],
  summary:
    'An SVG design tool: draw rectangles, ellipses and lines, select, marquee, move, resize with handles, style, undo/redo, zoom around the cursor, export and autosave.',
  judging: [
    'Does it look like a real design tool: toolbar, icons, selection chrome, panels?',
    'Does direct manipulation feel precise and smooth (drawing, dragging, resizing, zooming)?',
    'Nice touches: snapping guides, cursors, live previews, sensible defaults.',
  ],
};

// Coordinates are relative to the stage center, so floating toolbars along the
// stage edges never get in the way.
async function area(t) {
  const b = await t.box('#stage');
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  return { b, at: (dx, dy) => ({ x: cx + dx, y: cy + dy }) };
}

const shapes = (t) =>
  t.eval(() =>
    [...document.querySelectorAll('#stage [data-shape]')].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        id: el.getAttribute('data-id'),
        type: el.getAttribute('data-shape'),
        x: r.x, y: r.y, w: r.width, h: r.height,
        selected: el.getAttribute('data-selected') === 'true',
      };
    }),
  );

const fmt = (s) => (s ? `${s.type} at (${Math.round(s.x)}, ${Math.round(s.y)}) ${Math.round(s.w)}×${Math.round(s.h)}` : 'no shape');
const near = (a, b, tol = 5) => Math.abs(a - b) <= tol;

function expectBox(s, x, y, w, h, tol = 5) {
  if (!s) return { ok: false, note: 'shape not found' };
  const ok = near(s.x, x, tol) && near(s.y, y, tol) && near(s.w, w, tol) && near(s.h, h, tol);
  return { ok, note: ok ? '' : `expected (${Math.round(x)}, ${Math.round(y)}) ${Math.round(w)}×${Math.round(h)}, got ${fmt(s)}` };
}

async function draw(t, tool, a, b, opts) {
  await t.page.click(`[data-tool="${tool}"]`);
  await t.drag(a, b, opts);
  await t.sleep(120);
  const all = await shapes(t);
  return all.at(-1);
}

const byId = async (t, id) => (await shapes(t)).find((s) => s.id === id);
const center = (s) => ({ x: s.x + s.w / 2, y: s.y + s.h / 2 });

async function clickAt(t, p, shift = false) {
  if (shift) await t.page.keyboard.down('Shift');
  await t.page.mouse.click(p.x, p.y);
  if (shift) await t.page.keyboard.up('Shift');
  await t.sleep(80);
}

async function handleCenter(t, name) {
  const b = await t.box(`[data-handle="${name}"]`);
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

async function redo(t) {
  await t.page.keyboard.press('ControlOrMeta+Shift+KeyZ');
  await t.sleep(120);
}

const fill = (t, id) => t.eval((id) => getComputedStyle(document.querySelector(`[data-id="${id}"]`)).fill, id);

export const checks = [
  {
    id: 'structure',
    title: 'Stage, tools and controls',
    points: 4,
    async run(t) {
      await t.part('svg#stage at least 600×400', async () => {
        const r = await t.eval(() => {
          const s = document.querySelector('svg#stage');
          return s && s.getBoundingClientRect().toJSON();
        });
        return t.ok(r && r.width >= 600 && r.height >= 400, r ? `${Math.round(r.width)}×${Math.round(r.height)}` : 'missing');
      });
      await t.part('four tool buttons', () =>
        t.eval(() => ['select', 'rect', 'ellipse', 'line'].every((n) => document.querySelector(`[data-tool="${n}"]`))),
      );
      await t.part('style inputs', () => t.eval(() => !!document.querySelector('input#fill-color[type=color]') && !!document.querySelector('input#stroke-color[type=color]') && !!document.querySelector('input#stroke-width')));
      await t.part('export button', () => t.exists('#export-svg'));
      await t.part('stage center is hit-testable', async () => {
        const { at } = await area(t);
        const p = at(0, 0);
        return t.eval(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('#stage'), p);
      });
    },
  },
  {
    id: 'draw-rect',
    title: 'Drawing a rectangle',
    points: 8,
    async run(t) {
      const { at } = await area(t);
      const a = at(-150, -100);
      const s = await draw(t, 'rect', a, at(50, 20));
      const all = await shapes(t);
      await t.part('creates exactly one rect', () => t.ok(all.length === 1 && s.type === 'rect', `${all.length} shapes: ${all.map(fmt).join('; ')}`));
      await t.part('geometry matches the drag', () => expectBox(s, a.x, a.y, 200, 120), 2);
      await t.part('new shape is selected', () => t.ok(s?.selected, 'data-selected not "true"'));
      await t.drag(at(110, 60), at(190, 120));
      await t.sleep(100);
      await t.part('tool switches back to Select', async () => {
        const n = (await shapes(t)).length;
        return t.ok(n === 1, `a second drag created a shape (${n} shapes)`);
      });
    },
  },
  {
    id: 'draw-reverse',
    title: 'Drawing in reverse direction',
    points: 3,
    async run(t) {
      const { at } = await area(t);
      const s = await draw(t, 'rect', at(60, 80), at(-100, -40));
      return expectBox(s, at(-100, -40).x, at(-100, -40).y, 160, 120);
    },
  },
  {
    id: 'ellipse-line',
    title: 'Ellipses, lines and tiny drags',
    points: 6,
    async run(t) {
      const { at } = await area(t);
      const e = await draw(t, 'ellipse', at(-200, -120), at(-40, -20));
      await t.part('ellipse', () => (e?.type === 'ellipse' ? expectBox(e, at(-200, -120).x, at(-200, -120).y, 160, 100) : t.ok(false, fmt(e))), 2);
      const l = await draw(t, 'line', at(0, 0), at(150, 90));
      await t.part('line', () => (l?.type === 'line' ? expectBox(l, at(0, 0).x, at(0, 0).y, 150, 90) : t.ok(false, fmt(l))), 2);
      const n = (await shapes(t)).length;
      await draw(t, 'rect', at(100, -100), at(102, -99));
      await t.part('a 2 px drag creates nothing', async () => t.ok((await shapes(t)).length === n, 'shape created'));
    },
  },
  {
    id: 'shift-constrain',
    title: 'Shift constrains squares and 45° lines',
    points: 4,
    async run(t) {
      const { at } = await area(t);
      const s = await draw(t, 'rect', at(-200, -120), at(-40, -30), { hold: ['Shift'] });
      await t.part('Shift makes a square', () => t.ok(s && near(s.w, s.h, 4), fmt(s)), 2);
      await t.part('side = larger of |dx|, |dy| (160)', () => t.ok(s && near(s.w, 160, 6), fmt(s)));
      const l = await draw(t, 'line', at(0, 50), at(150, 70), { hold: ['Shift'] });
      await t.part('Shift snaps a line to horizontal', () => t.ok(l && l.h <= 3 && l.w > 140, fmt(l)));
    },
  },
  {
    id: 'select',
    title: 'Click, Shift+click and deselect',
    points: 5,
    async run(t) {
      const { at } = await area(t);
      const r1 = await draw(t, 'rect', at(-200, -120), at(-80, -40));
      const r2 = await draw(t, 'rect', at(40, 20), at(160, 100));
      await clickAt(t, at(230, -150));
      await t.part('clicking empty stage clears selection', async () => t.ok((await shapes(t)).every((s) => !s.selected), 'still selected'));
      await clickAt(t, center(r1));
      await t.part('click selects one shape', async () => {
        const s = await shapes(t);
        return t.ok(s.find((x) => x.id === r1.id)?.selected && !s.find((x) => x.id === r2.id)?.selected, s.map((x) => `${x.id}:${x.selected}`).join(' '));
      });
      await clickAt(t, center(r2), true);
      await t.part('Shift+click adds to selection', async () => t.ok((await shapes(t)).every((s) => s.selected), 'not both selected'));
      await clickAt(t, center(r1), true);
      await t.part('Shift+click toggles off', async () => {
        const s = await shapes(t);
        return t.ok(!s.find((x) => x.id === r1.id)?.selected && s.find((x) => x.id === r2.id)?.selected, s.map((x) => `${x.id}:${x.selected}`).join(' '));
      });
    },
  },
  {
    id: 'move',
    title: 'Moving and nudging',
    points: 8,
    async run(t) {
      const { at } = await area(t);
      const s0 = await draw(t, 'rect', at(-120, -80), at(40, 40));
      const c = center(s0);
      await t.drag(c, { x: c.x + 90, y: c.y + 60 });
      await t.sleep(100);
      const s1 = await byId(t, s0.id);
      await t.part('drag moves the shape by the mouse delta', () => expectBox(s1, s0.x + 90, s0.y + 60, s0.w, s0.h, 4), 3);
      await t.page.keyboard.press('ArrowRight');
      await t.page.keyboard.press('Shift+ArrowDown');
      await t.sleep(100);
      const s2 = await byId(t, s0.id);
      await t.part('arrow keys nudge 1 px, Shift+arrow 10 px', () => expectBox(s2, s1.x + 1, s1.y + 10, s1.w, s1.h, 0.6));
    },
  },
  {
    id: 'resize',
    title: 'Resize handles',
    points: 8,
    async run(t) {
      const { at } = await area(t);
      const s0 = await draw(t, 'rect', at(-120, -80), at(40, 40));
      await t.part('handles centered on the corners', async () => {
        const se = await handleCenter(t, 'se');
        const nw = await handleCenter(t, 'nw');
        const n = await handleCenter(t, 'n');
        const ok = near(se.x, s0.x + s0.w, 8) && near(se.y, s0.y + s0.h, 8) && near(nw.x, s0.x, 8) && near(nw.y, s0.y, 8) && near(n.x, s0.x + s0.w / 2, 8) && near(n.y, s0.y, 8);
        return t.ok(ok, `se at (${Math.round(se.x)}, ${Math.round(se.y)}), shape ${fmt(s0)}`);
      });
      let p = await handleCenter(t, 'se');
      await t.drag(p, { x: p.x + 60, y: p.y + 40 });
      await t.sleep(100);
      const s1 = await byId(t, s0.id);
      await t.part('se handle resizes, nw corner stays fixed', () => expectBox(s1, s0.x, s0.y, s0.w + 60, s0.h + 40, 4), 2);
      p = await handleCenter(t, 'nw');
      await t.drag(p, { x: p.x - 30, y: p.y - 20 });
      await t.sleep(100);
      const s2 = await byId(t, s0.id);
      await t.part('nw handle resizes, se corner stays fixed', () => expectBox(s2, s1.x - 30, s1.y - 20, s1.w + 30, s1.h + 20, 4), 2);
      p = await handleCenter(t, 'e');
      await t.drag(p, { x: p.x + 20, y: p.y + 15 });
      await t.sleep(100);
      const s3 = await byId(t, s0.id);
      await t.part('edge handle changes one dimension only', () => expectBox(s3, s2.x, s2.y, s2.w + 20, s2.h, 4));
    },
  },
  {
    id: 'delete',
    title: 'Delete and Backspace',
    points: 3,
    async run(t) {
      const { at } = await area(t);
      await draw(t, 'rect', at(-100, -60), at(0, 20));
      await t.page.keyboard.press('Delete');
      await t.sleep(100);
      await t.part('Delete removes the selection', async () => t.ok((await shapes(t)).length === 0, 'shape still there'));
      await draw(t, 'ellipse', at(-100, -60), at(0, 20));
      await t.page.keyboard.press('Backspace');
      await t.sleep(100);
      await t.part('Backspace removes the selection', async () => t.ok((await shapes(t)).length === 0, 'shape still there'));
    },
  },
  {
    id: 'undo-redo',
    title: 'Undo / redo history',
    points: 10,
    async run(t) {
      const { at } = await area(t);
      const s0 = await draw(t, 'rect', at(-120, -80), at(40, 40));
      const c = center(s0);
      await t.drag(c, { x: c.x + 80, y: c.y + 50 });
      await t.sleep(100);
      await t.shortcut('z');
      await t.sleep(120);
      await t.part('undo a move', async () => expectBox((await shapes(t))[0], s0.x, s0.y, s0.w, s0.h, 3));
      await t.shortcut('z');
      await t.sleep(120);
      await t.part('undo a create', async () => t.ok((await shapes(t)).length === 0, `${(await shapes(t)).length} shapes left`));
      await redo(t);
      let usedY = false;
      if ((await shapes(t)).length === 0) {
        await t.shortcut('y');
        await t.sleep(120);
        usedY = true;
      }
      await t.part('redo a create', async () => {
        const r = expectBox((await shapes(t))[0], s0.x, s0.y, s0.w, s0.h, 3);
        if (usedY) r.note = `${r.note} (Shift+Z did nothing; Ctrl/Cmd+Y worked: ${r.ok})`.trim();
        return r;
      });
      if (usedY) await t.shortcut('y');
      else await redo(t);
      await t.sleep(120);
      await t.part('redo a move', async () => expectBox((await shapes(t))[0], s0.x + 80, s0.y + 50, s0.w, s0.h, 3));
      const cur = (await shapes(t))[0];
      if (cur) await clickAt(t, center(cur));
      const before = cur ? await fill(t, cur.id) : null;
      await t.setInput('#fill-color', '#00ff00');
      await t.sleep(100);
      await t.part('undo a style change', async () => {
        if (!cur) return t.ok(false, 'no shape');
        await t.shortcut('z');
        await t.sleep(120);
        if ((await fill(t, cur.id)) === before) return true;
        await t.shortcut('z');
        await t.sleep(120);
        const f = await fill(t, cur.id);
        return { score: f === before ? 0.5 : 0, note: f === before ? 'needed two undos for one color change' : `fill is ${f}, expected ${before}` };
      });
    },
  },
  {
    id: 'marquee',
    title: 'Marquee selection and multi-move',
    points: 6,
    async run(t) {
      const { at } = await area(t);
      const r1 = await draw(t, 'rect', at(-220, -60), at(-140, 20));
      const r2 = await draw(t, 'rect', at(-100, -60), at(-20, 20));
      const r3 = await draw(t, 'rect', at(60, -60), at(140, 20));
      await clickAt(t, at(0, 140));
      const sel = async () => Object.fromEntries((await shapes(t)).map((s) => [s.id, s.selected]));
      await t.drag(at(-240, -100), at(-40, 60));
      await t.sleep(100);
      await t.part('marquee selects enclosed shapes', async () => {
        const s = await sel();
        return t.ok(s[r1.id] && s[r2.id] && !s[r3.id], JSON.stringify(s));
      }, 2);
      const a = await byId(t, r1.id);
      const b = await byId(t, r2.id);
      await t.drag(center(a), { x: center(a).x, y: center(a).y + 70 });
      await t.sleep(100);
      await t.part('dragging moves the whole selection', async () => {
        const [a2, b2, c2] = [await byId(t, r1.id), await byId(t, r2.id), await byId(t, r3.id)];
        const ok = near(a2.y, a.y + 70, 4) && near(b2.y, b.y + 70, 4) && near(c2.y, r3.y, 2);
        return t.ok(ok, `${fmt(a2)}; ${fmt(b2)}; ${fmt(c2)}`);
      }, 2);
      await clickAt(t, at(0, 160));
      await t.drag(at(170, 50), at(120, 0));
      await t.sleep(100);
      await t.part('marquee selects partially overlapped shapes', async () => {
        const s = await sel();
        return t.ok(s[r3.id] && !s[r1.id] && !s[r2.id], JSON.stringify(s));
      });
      await t.shortcut('a');
      await t.sleep(100);
      await t.part('Ctrl/Cmd+A selects all', async () => t.ok(Object.values(await sel()).every(Boolean), JSON.stringify(await sel())));
    },
  },
  {
    id: 'styles',
    title: 'Fill, stroke and stroke width',
    points: 6,
    async run(t) {
      const { at } = await area(t);
      const s = await draw(t, 'rect', at(-120, -80), at(40, 40));
      const style = (id) => t.eval((id) => {
        const cs = getComputedStyle(document.querySelector(`[data-id="${id}"]`));
        return { fill: cs.fill, stroke: cs.stroke, width: cs.strokeWidth };
      }, id);
      await t.setInput('#fill-color', '#e63946');
      await t.setInput('#stroke-width', '6');
      await t.setInput('#stroke-color', '#1d3557');
      await t.sleep(150);
      const st = await style(s.id);
      await t.part('fill applies to selection', () => t.ok(st.fill === 'rgb(230, 57, 70)', `fill: ${st.fill}`));
      await t.part('stroke width applies', () => t.ok(st.width === '6px', `stroke-width: ${st.width}`));
      await t.part('stroke color applies', () => t.ok(st.stroke === 'rgb(29, 53, 87)', `stroke: ${st.stroke}`));
      const s2 = await draw(t, 'ellipse', at(80, -80), at(200, 20));
      await t.part('new shapes use the current style', async () => {
        const st2 = await style(s2.id);
        return t.ok(st2.fill === 'rgb(230, 57, 70)', `new shape fill: ${st2.fill}`);
      });
    },
  },
  {
    id: 'zoom',
    title: 'Zoom around the cursor',
    points: 5,
    async run(t) {
      const { at } = await area(t);
      const s0 = await draw(t, 'rect', at(-60, -40), at(60, 40));
      const c = at(0, 0);
      await t.page.mouse.move(c.x, c.y);
      await t.page.keyboard.down('Control');
      for (let i = 0; i < 3; i++) {
        await t.page.mouse.wheel(0, -100);
        await t.sleep(60);
      }
      await t.page.keyboard.up('Control');
      await t.sleep(300);
      const s1 = await byId(t, s0.id);
      await t.part('Ctrl+wheel zooms in', () => t.ok(s1 && s1.w >= s0.w * 1.15, `width ${Math.round(s0.w)} → ${Math.round(s1?.w)}`), 2);
      await t.part('zoom is anchored at the cursor', () => {
        const m = s1 && center(s1);
        return t.ok(m && near(m.x, c.x, 12) && near(m.y, c.y, 12), m ? `shape center moved to (${Math.round(m.x)}, ${Math.round(m.y)}), cursor at (${Math.round(c.x)}, ${Math.round(c.y)})` : 'no shape');
      });
      const a = at(-250, -170);
      const s2 = await draw(t, 'rect', a, at(-150, -100));
      await t.part('drawing while zoomed maps screen to canvas correctly', () => expectBox(s2, a.x, a.y, 100, 70), 2);
    },
  },
  {
    id: 'export',
    title: 'SVG export',
    points: 6,
    async run(t) {
      const { at } = await area(t);
      await draw(t, 'rect', at(-160, -80), at(-40, 20));
      await draw(t, 'ellipse', at(20, -80), at(140, 20));
      const [download] = await Promise.all([t.page.waitForEvent('download', { timeout: 5000 }), t.page.click('#export-svg')]);
      await t.part('downloads drawing.svg', () => t.ok(download.suggestedFilename() === 'drawing.svg', `filename: ${download.suggestedFilename()}`));
      const text = fs.readFileSync(await download.path(), 'utf8');
      const info = await t.eval((text) => {
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        const root = doc.documentElement;
        return {
          error: !!doc.querySelector('parsererror'),
          root: root.localName,
          ns: root.namespaceURI,
          drawables: doc.querySelectorAll('rect,ellipse,circle,line,path,polygon,polyline').length,
          handles: doc.querySelectorAll('[data-handle]').length,
        };
      }, text);
      await t.part('valid standalone SVG with xmlns', () => t.ok(!info.error && info.root === 'svg' && info.ns === 'http://www.w3.org/2000/svg', JSON.stringify(info)));
      await t.part('contains exactly the 2 shapes', () => ({
        score: info.drawables === 2 ? 1 : info.drawables > 2 ? 0.4 : 0,
        note: `${info.drawables} drawable elements`,
      }), 2);
      await t.part('no handles or editor UI', () => t.ok(info.handles === 0, `${info.handles} handles exported`));
    },
  },
  {
    id: 'persistence',
    title: 'Autosave and restore',
    points: 5,
    async run(t) {
      const { at } = await area(t);
      await draw(t, 'rect', at(-160, -80), at(-40, 20));
      await draw(t, 'ellipse', at(20, -80), at(140, 20));
      const before = (await shapes(t)).sort((a, b) => a.x - b.x);
      await t.sleep(700);
      await t.reload();
      const after = (await shapes(t)).sort((a, b) => a.x - b.x);
      await t.part('shapes restored', () => t.ok(after.length === 2, `${after.length} shapes after reload`));
      await t.part('geometry restored', () => {
        const ok = after.length === 2 && before.every((s, i) => after[i].type === s.type && near(after[i].x, s.x, 2) && near(after[i].y, s.y, 2) && near(after[i].w, s.w, 2));
        return t.ok(ok, after.map(fmt).join('; '));
      });
    },
  },
  {
    id: 'duplicate-order',
    title: 'Duplicate and z-order',
    points: 4,
    async run(t) {
      const { at } = await area(t);
      const s0 = await draw(t, 'rect', at(-120, -80), at(0, 0));
      await t.shortcut('d');
      await t.sleep(120);
      const all = await shapes(t);
      await t.part('Ctrl/Cmd+D duplicates with a 10 px offset', () => {
        const d = all.find((s) => s.id !== s0.id);
        return t.ok(all.length === 2 && d && near(d.x, s0.x + 10, 2) && near(d.y, s0.y + 10, 2) && d.selected, all.map(fmt).join('; '));
      });
      const top = await draw(t, 'ellipse', at(-60, -40), at(60, 60));
      const order = () => t.eval(() => [...document.querySelectorAll('#stage [data-shape]')].map((e) => e.getAttribute('data-id')));
      const o0 = await order();
      await t.page.keyboard.press('BracketLeft');
      await t.sleep(120);
      const o1 = await order();
      await t.part('[ sends backward one step', () => t.ok(o0.indexOf(top.id) === 2 && o1.indexOf(top.id) === 1, `order ${o0.join(',')} → ${o1.join(',')}`));
      await t.page.keyboard.press('BracketRight');
      await t.sleep(120);
      const o2 = await order();
      await t.part('] brings forward one step', () => t.ok(o2.indexOf(top.id) === 2, `order → ${o2.join(',')}`));
    },
  },
];

export async function showcase(t) {
  const { at } = await area(t);
  const slow = { steps: 30 };
  await t.setInput('#fill-color', '#4f7cff');
  await draw(t, 'rect', at(-260, -150), at(-60, -10), slow);
  await t.setInput('#fill-color', '#ffb020');
  await draw(t, 'ellipse', at(-20, -160), at(180, 20), slow);
  await t.setInput('#fill-color', '#2bb673');
  await draw(t, 'rect', at(-200, 40), at(-60, 160), { ...slow, hold: ['Shift'] });
  await draw(t, 'line', at(40, 60), at(240, 150), slow);
  await t.shot('drawing');
  const shapesNow = await shapes(t);
  if (shapesNow[1]) {
    await clickAt(t, center(shapesNow[1]));
    await t.sleep(300);
    await t.shot('selected');
    try {
      const p = await handleCenter(t, 'se');
      await t.drag(p, { x: p.x + 60, y: p.y + 40 }, slow);
    } catch {}
  }
  await t.drag(at(-300, -190), at(300, 190), slow);
  await t.sleep(400);
  await t.shot('marquee');
}
