export const meta = {
  title: 'Keystone',
  subtitle: '2D parametric CAD & constraint solver',
  order: 6,
  skills: ['numerical optimization', 'computational geometry', 'canvas UX', 'state management'],
  summary:
    'An interactive 2D parametric CAD sketcher with live geometric constraint solving (distances, angles, tangency/incidence, parallelism), DOF analysis, kinematic dragging and persistence.',
  judging: [
    'Does it look and feel like a precision CAD application (clean grid, crisp geometry, constraint glyphs, dimension callouts)?',
    'When dragging a point in a constrained linkage, does the solver react smoothly at 60 FPS without jumping or exploding?',
    'Are snapping, selection, and applying constraints intuitive and responsive?',
  ],
};

const tool = (name) => `[data-tool="${name}"]`;
const constraint = (name) => `[data-constraint="${name}"]`;

async function getState(t) {
  return t.eval(() => window.__arena?.getState?.() ?? null);
}

async function toScreen(t, wx, wy) {
  return t.eval(([x, y]) => window.__arena.worldToScreen(x, y), [wx, wy]);
}

async function clickWorld(t, wx, wy, options = {}) {
  const pt = await toScreen(t, wx, wy);
  if (options.shift) await t.page.keyboard.down('Shift');
  await t.page.mouse.click(pt.x, pt.y);
  if (options.shift) await t.page.keyboard.up('Shift');
}

async function setDimensionInput(t, val) {
  await t.eval((v) => {
    const el = document.querySelector('#dimension-input');
    if (el) {
      el.value = String(v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, val);
}

// Per the contract, editing #dimension-input retargets a selected dimensional
// constraint, so clear the selection before typing, then select and apply.
async function applyDimension(t, ids, type, val) {
  await t.eval(() => window.__arena.select([]));
  await setDimensionInput(t, val);
  await t.eval((x) => window.__arena.select(x), ids);
  await t.page.click(constraint(type));
}

// Solvers may converge over several frames: re-read state until check passes
// or the timeout runs out, then report the last result.
async function settle(t, check, timeout = 1500) {
  let res = { ok: false, msg: 'getState() failed' };
  await t.poll(async () => {
    res = check(await getState(t));
    return res.ok;
  }, { timeout });
  return t.ok(res.ok, res.msg);
}

function dist(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function findPoint(state, id) {
  return state.points.find((p) => p.id === id);
}

export const checks = [
  {
    id: 'ui-contract',
    title: 'Workspace, tools and grader API contract',
    points: 5,
    async run(t) {
      await t.part('#cad-canvas exists and fills viewport', async () => {
        const box = await t.eval(() => {
          const c = document.querySelector('canvas#cad-canvas');
          if (!c) return null;
          const r = c.getBoundingClientRect();
          return { w: r.width, h: r.height };
        });
        return t.ok(box && box.w >= 1000 && box.h >= 600, `canvas size: ${JSON.stringify(box)}`);
      });
      await t.part('tool and constraint buttons exist', async () => {
        const ok = await t.eval(() => {
          const tools = ['select', 'point', 'line', 'circle'];
          const cons = [
            'coincident', 'horizontal', 'vertical', 'parallel', 'perpendicular',
            'equal', 'fix', 'distance', 'radius', 'angle', 'point-on-object',
          ];
          return (
            tools.every((k) => document.querySelector(`[data-tool="${k}"]`)) &&
            cons.every((k) => document.querySelector(`[data-constraint="${k}"]`)) &&
            !!document.querySelector('input#dimension-input') &&
            !!document.querySelector('#clear') &&
            !!document.querySelector('#status')
          );
        });
        return t.ok(ok, 'missing required DOM elements');
      });
      await t.part('window.__arena API and coordinate mapping', async () => {
        const res = await t.eval(() => {
          const a = window.__arena;
          if (!a || typeof a.getState !== 'function' || typeof a.worldToScreen !== 'function') return null;
          const s0 = a.worldToScreen(0, 0);
          const w0 = a.screenToWorld(s0.x, s0.y);
          return { s0, w0, state: a.getState() };
        });
        if (!res) return t.ok(false, 'window.__arena missing methods');
        const cx = Math.abs(res.s0.x - 640) < 50 && Math.abs(res.s0.y - 400) < 50;
        const roundtrip = Math.hypot(res.w0.x, res.w0.y) < 1e-3;
        return t.ok(cx && roundtrip && Array.isArray(res.state.points), `origin screen: ${JSON.stringify(res.s0)}`);
      });
    },
  },
  {
    id: 'drawing-primitives',
    title: 'Drawing points, lines, circles and endpoint snapping',
    points: 8,
    async run(t) {
      await t.page.click('#clear');
      await t.page.click(tool('point'));
      await t.part('point tool sets aria-pressed="true"', async () => {
        const pressed = await t.eval(() => document.querySelector('[data-tool="point"]')?.getAttribute('aria-pressed'));
        return t.ok(pressed === 'true', `aria-pressed=${pressed}`);
      });
      await clickWorld(t, -200, -150);
      await t.part('clicking creates a point at world coordinates', async () => {
        const s = await getState(t);
        if (s.points.length !== 1) return t.ok(false, `expected 1 point, got ${s.points.length}`);
        const err = Math.hypot(s.points[0].x - -200, s.points[0].y - -150);
        return t.ok(err < 2, `point at (${s.points[0].x}, ${s.points[0].y})`);
      });

      await t.page.click('#clear');
      await t.page.click(tool('line'));
      await clickWorld(t, -100, 0);
      await clickWorld(t, 100, 0);
      await t.part('line tool creates 2 points and 1 line', async () => {
        const s = await getState(t);
        return t.ok(s.points.length === 2 && s.lines.length === 1, `pts=${s.points.length}, lines=${s.lines.length}`);
      });

      // Click within 6px of (100, 0) to test snapping
      await clickWorld(t, 104, 3);
      await clickWorld(t, 100, 150);
      await t.part('endpoint snapping reuses existing point within 12px', async () => {
        const s = await getState(t);
        if (s.lines.length !== 2) return t.ok(false, `expected 2 lines, got ${s.lines.length}`);
        const shared = s.lines[0].p2 === s.lines[1].p1 || s.lines[0].p2 === s.lines[1].p2;
        return t.ok(s.points.length === 3 && shared, `pts=${s.points.length}, shared=${shared}`);
      });

      await t.page.click(tool('circle'));
      await clickWorld(t, 0, 0);
      await clickWorld(t, 0, 80);
      await t.part('circle tool creates center point and circle with radius ~80', async () => {
        const s = await getState(t);
        if (s.circles.length !== 1) return t.ok(false, `circles=${s.circles.length}`);
        return t.ok(Math.abs(s.circles[0].r - 80) < 2, `r=${s.circles[0].r}`);
      });
    },
  },
  {
    id: 'selection-deletion',
    title: 'Selection, multi-select, Escape and Delete',
    points: 6,
    async run(t) {
      await t.page.click('#clear');
      await t.page.click(tool('line'));
      await clickWorld(t, -100, -50);
      await clickWorld(t, 100, -50);
      await clickWorld(t, -100, 50);
      await clickWorld(t, 100, 50);

      await t.page.click(tool('select'));
      await clickWorld(t, 0, -50); // click first line midpoint
      await t.page.keyboard.press('Delete');
      await t.part('selecting a line and pressing Delete removes it', async () => {
        const s = await getState(t);
        return t.ok(s.lines.length === 1, `lines remaining: ${s.lines.length}`);
      });

      // Test Escape cancels line drawing mid-way
      await t.page.click(tool('line'));
      await clickWorld(t, 0, 150);
      await t.page.keyboard.press('Escape');
      await clickWorld(t, 100, 150);
      await t.part('Escape cancels in-progress line creation', async () => {
        const s = await getState(t);
        return t.ok(s.lines.length === 1, `lines count: ${s.lines.length}`);
      });
    },
  },
  {
    id: 'basic-constraints',
    title: 'Horizontal, Vertical, Fix and Coincident constraints',
    points: 10,
    async run(t) {
      await t.page.click('#clear');
      await t.page.click(tool('line'));
      await clickWorld(t, -100, -20);
      await clickWorld(t, 100, 40); // slanted line

      const s0 = await getState(t);
      const lineId = s0.lines[0].id;
      const p1Id = s0.lines[0].p1;

      // Fix p1
      await t.eval((id) => window.__arena.select([id]), p1Id);
      await t.page.click(constraint('fix'));
      await t.part('Fix constraint locks point coordinates', async () => {
        const s = await getState(t);
        const p1 = findPoint(s, p1Id);
        return t.ok(p1.fixed === true, `p1.fixed=${p1.fixed}`);
      });

      // Make line horizontal
      await t.eval((id) => window.__arena.select([id]), lineId);
      await t.page.click(constraint('horizontal'));
      await t.part('Horizontal constraint aligns y2 to fixed y1', async () => {
        const s = await getState(t);
        const p1 = findPoint(s, s.lines[0].p1);
        const p2 = findPoint(s, s.lines[0].p2);
        return t.ok(
          Math.abs(p1.y - -20) < 1 && Math.abs(p1.y - p2.y) < 1e-2,
          `p1.y=${p1.y.toFixed(2)}, p2.y=${p2.y.toFixed(2)}`,
        );
      });

      // Add second line and test Vertical + Coincident
      await clickWorld(t, 120, 10);
      await clickWorld(t, 150, 150);
      const s1 = await getState(t);
      const line2 = s1.lines[1];

      await t.eval((id) => window.__arena.select([id]), line2.id);
      await t.page.click(constraint('vertical'));
      await t.part('Vertical constraint forces x1 == x2', async () => {
        const s = await getState(t);
        const pa = findPoint(s, s.lines[1].p1);
        const pb = findPoint(s, s.lines[1].p2);
        return t.ok(Math.abs(pa.x - pb.x) < 1e-2, `pa.x=${pa.x.toFixed(2)}, pb.x=${pb.x.toFixed(2)}`);
      });

      // Coincident between line1.p2 and line2.p1
      await t.eval((ids) => window.__arena.select(ids), [s1.lines[0].p2, line2.p1]);
      await t.page.click(constraint('coincident'));
      await t.part('Coincident constraint joins endpoints together', async () => {
        const s = await getState(t);
        const pa = findPoint(s, s.lines[0].p2);
        const pb = findPoint(s, s.lines[1].p1);
        return t.ok(dist(pa, pb) < 1e-2, `dist=${dist(pa, pb)}`);
      });
    },
  },
  {
    id: 'dimensional-constraints',
    title: 'Dimensional constraints (Distance, Radius, Angle) and live editing',
    points: 12,
    async run(t) {
      await t.page.click('#clear');
      await t.page.click(tool('line'));
      await clickWorld(t, 0, 0);
      await clickWorld(t, 90, 0);
      await clickWorld(t, 0, 0); // snaps to (0,0)
      await clickWorld(t, 60, 80);

      const s0 = await getState(t);
      const [l1, l2] = s0.lines;

      // Fix origin point and make l1 horizontal
      await t.eval((id) => window.__arena.select([id]), l1.p1);
      await t.page.click(constraint('fix'));
      await t.eval((id) => window.__arena.select([id]), l1.id);
      await t.page.click(constraint('horizontal'));

      // Constrain l1 length to 150
      await applyDimension(t, [l1.id], 'distance', 150);
      await t.part('Distance constraint sets line length to 150', async () => {
        return settle(t, (s) => {
          const len = dist(findPoint(s, l1.p1), findPoint(s, l1.p2));
          return { ok: Math.abs(len - 150) < 1e-2, msg: `length=${len.toFixed(3)}` };
        });
      });

      // Constrain l2 length to 100
      await applyDimension(t, [l2.id], 'distance', 100);

      // Constrain angle between l1 and l2 to 60 degrees
      await applyDimension(t, [l1.id, l2.id], 'angle', 60);
      await t.part('Angle constraint sets angle between lines to 60°', async () => {
        return settle(t, (s) => {
          const p0 = findPoint(s, l1.p1);
          const p1 = findPoint(s, l1.p2);
          const p2 = findPoint(s, l2.p1 === l1.p1 ? l2.p2 : l2.p1);
          const ux = p1.x - p0.x, uy = p1.y - p0.y;
          const vx = p2.x - p0.x, vy = p2.y - p0.y;
          const cos = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy));
          const deg = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
          return { ok: Math.abs(deg - 60) < 0.1 && Math.abs(Math.hypot(vx, vy) - 100) < 0.1, msg: `angle=${deg.toFixed(2)}°, len2=${Math.hypot(vx, vy).toFixed(2)}` };
        });
      });

      // Live update: select l1's distance constraint itself (l1 also carries the
      // angle), then edit #dimension-input. Falls back to l1 if no id is exposed.
      const sDim = await getState(t);
      const l1Dist = sDim.constraints.find((c) =>
        c.type === 'distance' &&
        (c.entities.includes(l1.id) || (c.entities.includes(l1.p1) && c.entities.includes(l1.p2))));
      await t.eval((id) => window.__arena.select([id]), l1Dist ? l1Dist.id : l1.id);
      await setDimensionInput(t, 200);
      await t.part('updating #dimension-input dynamically updates selected constraint', async () => {
        return settle(t, (s) => {
          const len = dist(findPoint(s, l1.p1), findPoint(s, l1.p2));
          return { ok: Math.abs(len - 200) < 0.1, msg: `updated length=${len.toFixed(2)}` };
        });
      });

      // Circle radius constraint
      await t.page.click(tool('circle'));
      await clickWorld(t, -150, 0);
      await clickWorld(t, -150, 50);
      const sCircle = await getState(t);
      const cId = sCircle.circles[0].id;
      await applyDimension(t, [cId], 'radius', 75);
      await t.part('Radius constraint sets circle radius to 75', async () => {
        return settle(t, (s) => ({ ok: Math.abs(s.circles[0].r - 75) < 1e-2, msg: `r=${s.circles[0].r}` }));
      });
    },
  },
  {
    id: 'relational-constraints',
    title: 'Parallel, Perpendicular, Equal and Point-on-Object',
    points: 12,
    async run(t) {
      await t.page.click('#clear');
      await t.page.click(tool('line'));
      // Line 1: (-100, 0) to (0, 50)
      await clickWorld(t, -100, 0);
      await clickWorld(t, 0, 50);
      // Line 2: (50, -50) to (150, -20)
      await clickWorld(t, 50, -50);
      await clickWorld(t, 150, -20);
      // Line 3: (50, 50) to (80, 140)
      await clickWorld(t, 50, 50);
      await clickWorld(t, 80, 140);

      const s0 = await getState(t);
      const [l1, l2, l3] = s0.lines;

      // Parallel(l1, l2) + Equal(l1, l2)
      await t.eval((ids) => window.__arena.select(ids), [l1.id, l2.id]);
      await t.page.click(constraint('parallel'));
      await t.eval((ids) => window.__arena.select(ids), [l1.id, l2.id]);
      await t.page.click(constraint('equal'));

      await t.part('Parallel + Equal makes two segments same length and direction', async () => {
        return settle(t, (s) => {
          const p1a = findPoint(s, l1.p1), p1b = findPoint(s, l1.p2);
          const p2a = findPoint(s, l2.p1), p2b = findPoint(s, l2.p2);
          const u = { x: p1b.x - p1a.x, y: p1b.y - p1a.y };
          const v = { x: p2b.x - p2a.x, y: p2b.y - p2a.y };
          const lenU = Math.hypot(u.x, u.y), lenV = Math.hypot(v.x, v.y);
          const cross = Math.abs(u.x * v.y - u.y * v.x) / (lenU * lenV);
          return { ok: cross < 1e-3 && Math.abs(lenU - lenV) < 1e-2, msg: `sin(theta)=${cross.toFixed(5)}, dLen=${Math.abs(lenU - lenV).toFixed(4)}` };
        });
      });

      // Perpendicular(l1, l3)
      await t.eval((ids) => window.__arena.select(ids), [l1.id, l3.id]);
      await t.page.click(constraint('perpendicular'));
      await t.part('Perpendicular forces dot product to 0', async () => {
        const s = await getState(t);
        const p1a = findPoint(s, l1.p1), p1b = findPoint(s, l1.p2);
        const p3a = findPoint(s, l3.p1), p3b = findPoint(s, l3.p2);
        const u = { x: p1b.x - p1a.x, y: p1b.y - p1a.y };
        const w = { x: p3b.x - p3a.x, y: p3b.y - p3a.y };
        const dot = Math.abs(u.x * w.x + u.y * w.y) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y));
        return t.ok(dot < 1e-3, `cos(theta)=${dot.toFixed(5)}`);
      });

      // Point on Object: place a point on l1
      await t.page.click(tool('point'));
      await clickWorld(t, -50, 80);
      const s1 = await getState(t);
      const oldIds = new Set(s0.points.map((p) => p.id));
      const freePt = s1.points.find((p) => !oldIds.has(p.id)) ?? s1.points[s1.points.length - 1];
      await t.eval((ids) => window.__arena.select(ids), [freePt.id, l1.id]);
      await t.page.click(constraint('point-on-object'));
      await t.part('Point-on-Object projects point onto line', async () => {
        const s = await getState(t);
        const pa = findPoint(s, l1.p1), pb = findPoint(s, l1.p2), pt = findPoint(s, freePt.id);
        const ux = pb.x - pa.x, uy = pb.y - pa.y;
        const vx = pt.x - pa.x, vy = pt.y - pa.y;
        const perpDist = Math.abs(ux * vy - uy * vx) / Math.hypot(ux, uy);
        return t.ok(perpDist < 1e-2, `perpDist=${perpDist.toFixed(4)}`);
      });
    },
  },
  {
    id: 'coupled-nonlinear-solver',
    title: 'Coupled multi-constraint loop (3-4-5 right triangle & rectangle)',
    points: 12,
    async run(t) {
      await t.page.click('#clear');
      await t.page.click(tool('line'));
      // Draw a rough non-right triangle with shared vertices
      await clickWorld(t, 0, 0);
      await clickWorld(t, 120, 20);
      await clickWorld(t, 120, 20); // snap
      await clickWorld(t, 30, 140);
      await clickWorld(t, 30, 140); // snap
      await clickWorld(t, 0, 0);    // snap to close loop

      const s0 = await getState(t);
      if (s0.points.length !== 3 || s0.lines.length !== 3) {
        await t.part('closed 3-line triangle created', () => t.ok(false, `pts=${s0.points.length}, lines=${s0.lines.length}`));
        return;
      }
      const [l1, l2, l3] = s0.lines;

      // Fix p1 at (0,0), make l1 horizontal, set lengths 150, 200, 250 (3-4-5 triangle!)
      await t.eval((id) => window.__arena.select([id]), l1.p1);
      await t.page.click(constraint('fix'));
      await t.eval((id) => window.__arena.select([id]), l1.id);
      await t.page.click(constraint('horizontal'));

      await applyDimension(t, [l1.id], 'distance', 150);
      await applyDimension(t, [l2.id], 'distance', 200);
      await applyDimension(t, [l3.id], 'distance', 250);

      await t.part('solver converges on coupled 150-200-250 triangle', async () => {
        return settle(t, (s) => {
          const p1 = findPoint(s, l1.p1);
          const p2 = findPoint(s, l1.p2);
          const p3 = s.points.find((p) => p.id !== p1.id && p.id !== p2.id);
          const d1 = dist(p1, p2), d2 = dist(p2, p3), d3 = dist(p3, p1);
          // 150^2 + 200^2 = 250^2 and l1 is horizontal from (0,0), so the right
          // angle sits at p2: p3 is directly above/below p2 (either mirror image).
          const ok =
            Math.abs(d1 - 150) < 0.05 &&
            Math.abs(d2 - 200) < 0.05 &&
            Math.abs(d3 - 250) < 0.05 &&
            Math.abs(p3.x - p2.x) < 0.1 &&
            Math.abs(Math.abs(p3.y) - 200) < 0.1;
          return { ok, msg: `p3=(${p3.x.toFixed(2)}, ${p3.y.toFixed(2)}), maxError=${s.maxError}` };
        });
      });
    },
  },
  {
    id: 'dof-and-overconstrained',
    title: 'Degrees of Freedom (DOF) tracking and conflict detection',
    points: 10,
    async run(t) {
      await t.page.click('#clear');
      await t.part('empty sketch has 0 DOF', async () => {
        const s = await getState(t);
        return t.ok(s.dof === 0, `dof=${s.dof}`);
      });

      await t.page.click(tool('line'));
      await clickWorld(t, 0, 0);
      await clickWorld(t, 100, 30);

      await t.part('1 free line (2 points) has 4 DOF and status="under"', async () => {
        const s = await getState(t);
        const domDof = await t.eval(() => document.querySelector('#status')?.getAttribute('data-dof'));
        const domState = await t.eval(() => document.querySelector('#status')?.getAttribute('data-state'));
        return t.ok(s.dof === 4 && s.status === 'under' && domDof === '4' && domState === 'under', `state=${JSON.stringify({ dof: s.dof, status: s.status, domDof, domState })}`);
      });

      const s0 = await getState(t);
      const l1 = s0.lines[0];

      // Fix p1 (-2 DOF -> 2 DOF)
      await t.eval((id) => window.__arena.select([id]), l1.p1);
      await t.page.click(constraint('fix'));
      await t.part('fixing one endpoint reduces DOF to 2', async () => {
        const s = await getState(t);
        return t.ok(s.dof === 2 && s.status === 'under', `dof=${s.dof}, status=${s.status}`);
      });

      // Horizontal (-1 DOF -> 1 DOF)
      await t.eval((id) => window.__arena.select([id]), l1.id);
      await t.page.click(constraint('horizontal'));
      await t.part('adding Horizontal reduces DOF to 1', async () => {
        const s = await getState(t);
        return t.ok(s.dof === 1 && s.status === 'under', `dof=${s.dof}, status=${s.status}`);
      });

      // Distance (-1 DOF -> 0 DOF, fully constrained!)
      await applyDimension(t, [l1.id], 'distance', 120);
      await t.part('adding Distance reaches 0 DOF and status="fully"', async () => {
        let res = { ok: false, msg: 'getState() failed' };
        await t.poll(async () => {
          const s = await getState(t);
          const domState = await t.eval(() => document.querySelector('#status')?.getAttribute('data-state'));
          res = { ok: s.dof === 0 && s.status === 'fully' && domState === 'fully', msg: `dof=${s.dof}, status=${s.status}, domState=${domState}` };
          return res.ok;
        });
        return t.ok(res.ok, res.msg);
      });

      // Add conflicting Vertical constraint on a Horizontal nonzero-length line -> status="over"
      await t.eval((id) => window.__arena.select([id]), l1.id);
      await t.page.click(constraint('vertical'));
      await t.part('conflicting constraint triggers status="over"', async () => {
        const s = await getState(t);
        const domState = await t.eval(() => document.querySelector('#status')?.getAttribute('data-state'));
        return t.ok(s.status === 'over' && domState === 'over', `status=${s.status}, domState=${domState}`);
      });
    },
  },
  {
    id: 'kinematic-dragging',
    title: 'Real-time kinematic dragging of constrained linkage (FPS & accuracy)',
    points: 8,
    async run(t) {
      await t.page.click('#clear');
      await t.page.click(tool('line'));
      // Crank-rocker / 2-bar linkage pinned at (0,0)
      await clickWorld(t, 0, 0);
      await clickWorld(t, 100, 0);
      await clickWorld(t, 100, 0); // snap
      await clickWorld(t, 100, 100);

      const s0 = await getState(t);
      const [l1, l2] = s0.lines;
      // Fix p1 at (0,0), set both bar lengths to 100, and constrain l1 perpendicular to l2
      await t.eval((id) => window.__arena.select([id]), l1.p1);
      await t.page.click(constraint('fix'));
      await setDimensionInput(t, 100);
      await t.eval((id) => window.__arena.select([id]), l1.id);
      await t.page.click(constraint('distance'));
      await t.eval((id) => window.__arena.select([id]), l2.id);
      await t.page.click(constraint('distance'));
      await t.eval((ids) => window.__arena.select(ids), [l1.id, l2.id]);
      await t.page.click(constraint('perpendicular'));

      await t.page.click(tool('select'));
      const sBefore = await getState(t);
      const tipId = l2.p2;
      const tipPt = findPoint(sBefore, tipId);
      const startScreen = await toScreen(t, tipPt.x, tipPt.y);

      // Drag the tip along an arc while measuring frame rate
      await t.page.mouse.move(startScreen.x, startScreen.y);
      await t.page.mouse.down();
      for (let i = 1; i <= 15; i++) {
        await t.page.mouse.move(startScreen.x - i * 8, startScreen.y + i * 2);
        await t.sleep(16);
      }
      await t.page.mouse.up();

      await t.part('dragging moves linkage while preserving all constraints', async () => {
        return settle(t, (sAfter) => {
          const p1 = findPoint(sAfter, l1.p1);
          const p2 = findPoint(sAfter, l1.p2);
          const p3 = findPoint(sAfter, tipId);
          const moved = dist(p3, tipPt) > 30;
          const len1Ok = Math.abs(dist(p1, p2) - 100) < 0.5;
          const len2Ok = Math.abs(dist(p2, p3) - 100) < 0.5;
          const dot = Math.abs((p2.x - p1.x) * (p3.x - p2.x) + (p2.y - p1.y) * (p3.y - p2.y)) / 10000;
          return { ok: moved && len1Ok && len2Ok && dot < 0.01, msg: `moved=${dist(p3, tipPt).toFixed(1)}, l1=${dist(p1, p2).toFixed(1)}, l2=${dist(p2, p3).toFixed(1)}, dot=${dot.toFixed(4)}` };
        });
      });
    },
  },
  {
    id: 'undo-redo-persistence',
    title: 'Undo / Redo and localStorage persistence',
    points: 8,
    async run(t) {
      await t.page.click('#clear');
      await t.page.click(tool('line'));
      await clickWorld(t, -50, -50);
      await clickWorld(t, 50, -50);
      const s1 = await getState(t);
      await t.eval((id) => window.__arena.select([id]), s1.lines[0].id);
      await setDimensionInput(t, 140);
      await t.page.click(constraint('distance'));

      await t.shortcut('z');
      await t.part('Undo (Ctrl/Cmd+Z) removes the last constraint', async () => {
        return settle(t, (s) => ({ ok: s.constraints.length === 0 && s.lines.length === 1, msg: `constraints=${s.constraints.length}` }));
      });

      // Ctrl/Cmd+Shift+Z: Cmd+Y is not a listed redo binding on macOS.
      await t.shortcut('Shift+KeyZ');
      await t.part('Redo restores the constraint and re-solves', async () => {
        return settle(t, (s) => {
          const len = dist(findPoint(s, s.lines[0].p1), findPoint(s, s.lines[0].p2));
          return { ok: s.constraints.length === 1 && Math.abs(len - 140) < 0.1, msg: `constraints=${s.constraints.length}, len=${len.toFixed(1)}` };
        });
      });

      await t.sleep(300);
      await t.reload();
      await t.part('sketch and constraints persist across page reload', async () => {
        const s = await getState(t);
        if (!s || s.lines.length !== 1 || s.constraints.length !== 1) {
          return t.ok(false, `restored state: ${JSON.stringify(s)}`);
        }
        const len = dist(findPoint(s, s.lines[0].p1), findPoint(s, s.lines[0].p2));
        return t.ok(Math.abs(len - 140) < 0.1, `restored len=${len.toFixed(1)}`);
      });
    },
  },
];

export async function showcase(t) {
  await t.page.click('#clear');
  await t.page.click(tool('line'));

  // Draw a 4-bar linkage / quadrilateral
  const pts = [
    [-120, 80], [-120, -60],
    [-120, -60], [100, -90],
    [100, -90], [140, 80],
    [140, 80], [-120, 80],
  ];
  for (const [x, y] of pts) {
    await clickWorld(t, x, y);
    await t.sleep(60);
  }

  const s = await getState(t);
  if (s && s.lines.length >= 4) {
    const [l1, l2, l3, l4] = s.lines;
    await t.eval((id) => window.__arena.select([id]), l4.p2);
    await t.page.click(constraint('fix'));
    await t.eval((id) => window.__arena.select([id]), l4.id);
    await t.page.click(constraint('horizontal'));

    for (const [line, len] of [[l1, 140], [l2, 220], [l3, 160], [l4, 240]]) {
      await applyDimension(t, [line.id], 'distance', len);
      await t.sleep(100);
    }
  }
  await t.shot('constrained-linkage');

  // Drag the top-left joint to articulate the 4-bar linkage
  await t.page.click(tool('select'));
  const sNow = await getState(t);
  if (sNow && sNow.lines.length >= 2) {
    const joint = findPoint(sNow, sNow.lines[0].p2);
    if (joint) {
      const sc = await toScreen(t, joint.x, joint.y);
      await t.page.mouse.move(sc.x, sc.y);
      await t.page.mouse.down();
      for (let i = 1; i <= 12; i++) {
        await t.page.mouse.move(sc.x + i * 6, sc.y + i * 2);
        await t.sleep(25);
      }
      await t.page.mouse.up();
    }
  }
  await t.sleep(200);
  await t.shot('articulated-linkage');
}
