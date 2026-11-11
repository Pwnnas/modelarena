export const meta = {
  title: 'Tessera',
  subtitle: 'Block-stacking game engine',
  order: 4,
  skills: ['game rules', 'deterministic simulation', 'input handling', 'real-time rendering', 'audio synthesis'],
  summary:
    'A 10×20 block-stacking game with Super Rotation System kicks, a seeded 7-bag randomiser, hold/ghost/lock delay, T-spin and perfect-clear detection, guideline scoring with combo and back-to-back, a deterministic replay system and an autoplay agent — in a single HTML file.',
  judging: [
    'Does the board, panels, typography and colour look like a premium modern game?',
    'Do the effects (lock, line clear, tetris, level up, game over) feel satisfying?',
    'Is the HUD legible and are the controls obvious at a glance?',
  ],
};

/* ------------------------------------------------------------------ helpers */

const apiInfo = (t) =>
  t.eval(() => {
    const a = window.__arena;
    if (!a) return { ok: false, note: 'window.__arena is missing' };
    const missing = ['state', 'board', 'piece', 'input'].filter((k) => typeof a[k] !== 'function');
    if (missing.length) return { ok: false, note: `window.__arena is missing: ${missing.join(', ')}` };
    return { ok: true, note: '' };
  });

const getState = (t) => t.eval(() => window.__arena.state());
const getBoard = (t) => t.eval(() => window.__arena.board());
const getPiece = (t) => t.eval(() => window.__arena.piece());

const send = (t, action) =>
  t.eval((a) => {
    try { return !!window.__arena.input(a); } catch (e) { return false; }
  }, action);

const newGame = (t, seed) =>
  t.eval((s) => {
    try { window.__arena.reset(s == null ? undefined : s); } catch (e) {}
    return true;
  }, seed ?? null);

const putBoard = (t, cells) =>
  t.eval((c) => { try { window.__arena.setBoard(c); } catch (e) {} return true; }, cells);

const putPiece = (t, type, x, y) =>
  t.eval((s) => { try { window.__arena.spawn(s.type, s.x, s.y); } catch (e) {} return true; },
    { type, x: x ?? null, y: y ?? null });

const putLines = (t, n) =>
  t.eval((v) => {
    try { if (typeof window.__arena.setLines === 'function') { window.__arena.setLines(v); return true; } } catch (e) {}
    return false;
  }, n);

const hasApi = (t, name) => t.eval((n) => typeof (window.__arena || {})[n] === 'function', name);

const minCol = (cs) => Math.min(...cs.map((c) => c[0]));
const maxRow = (cs) => Math.max(...cs.map((c) => c[1]));
const cellKey = (cs) => (cs || []).map(([c, r]) => `${c}:${r}`).sort().join(' ');

function boardOf(filled) {
  const b = new Array(200).fill(0);
  for (const [c, r] of filled) if (r >= 0 && r < 20 && c >= 0 && c < 10) b[r * 10 + c] = 1;
  return b;
}

function topRowOf(b) {
  for (let r = 0; r < 20; r++) for (let c = 0; c < 10; c++) if (b[r * 10 + c]) return r;
  return null;
}

/** row the active piece would come to rest on (topmost cell), simulated in-page */
const landingRow = (t) =>
  t.eval(() => {
    const a = window.__arena;
    const p = a.piece();
    const b = a.board();
    if (!p || !b) return null;
    let cells = p.cells.map(([c, r]) => [c, r]);
    for (let i = 0; i < 40; i++) {
      const next = cells.map(([c, r]) => [c, r + 1]);
      if (next.some(([c, r]) => r > 19 || c < 0 || c > 9 || b[r * 10 + c] !== 0)) break;
      cells = next;
    }
    return Math.min(...cells.map(([c, r]) => r));
  });

async function alignColumn(t, target) {
  for (let i = 0; i < 14; i++) {
    const p = await getPiece(t);
    if (!p || !p.cells || !p.cells.length) return false;
    const c = minCol(p.cells);
    if (c === target) return true;
    await send(t, c > target ? 'left' : 'right');
    await t.sleep(40);
  }
  return false;
}

async function waitNewPiece(t, prev, timeout = 2500) {
  const hit = await t.poll(async () => {
    const p = await getPiece(t);
    if (!p) return null;
    return !prev || cellKey(p.cells) !== cellKey(prev.cells) ? true : null;
  }, { timeout });
  return !!hit;
}

/** hard drop and wait until the stack changed */
async function dropAndSettle(t, timeout = 2500) {
  const before = await getBoard(t);
  const prev = await getPiece(t);
  await send(t, 'hard');
  const hit = await t.poll(async () => {
    const b = await getBoard(t);
    return b && b.join('') !== (before || []).join('') ? true : null;
  }, { timeout });
  await waitNewPiece(t, prev, 800);
  return !!hit;
}

/** collect the sequence of dealt pieces (optionally wiping the well to survive) */
async function collectTypes(t, n, seed, keepAlive = false) {
  await newGame(t, seed);
  await t.sleep(140);
  const out = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 5) {
    const p = await getPiece(t);
    if (!p || !p.type) { await t.sleep(60); continue; }
    out.push(p.type);
    const prev = p;
    await send(t, 'hard');
    await waitNewPiece(t, prev, 2000);
    if (keepAlive) {
      const b = await getBoard(t);
      const top = b ? topRowOf(b) : null;
      if (top !== null && top < 5) { await putBoard(t, new Array(200).fill(0)); await t.sleep(70); }
    }
  }
  return out;
}

async function advance(t, ms) {
  const can = await hasApi(t, 'tick');
  if (can) {
    await t.eval((v) => { try { window.__arena.tick(v); } catch (e) {} return true; }, ms);
    await t.sleep(120);
    return true;
  }
  await t.sleep(ms);
  return false;
}

const blur = (t) => t.eval(() => { try { document.activeElement && document.activeElement.blur(); } catch (e) {} return true; });

/* ------------------------------------------------------------------ checks */

export const checks = [
  {
    id: 'structure',
    title: 'Well, HUD, hold/next panels and controls',
    points: 4,
    async run(t) {
      await t.part('#board canvas is present and visible', async () => {
        if (!(await t.exists('#board'))) return t.ok(false, '#board missing');
        const isCanvas = await t.eval(() => (document.getElementById('board') || {}).tagName === 'CANVAS');
        if (!isCanvas) return t.ok(false, '#board is not a <canvas>');
        return t.visible('#board');
      });
      await t.part('#score / #lines / #level show numbers', async () => {
        const v = await t.eval(() =>
          ['score', 'lines', 'level'].map((id) => ((document.getElementById(id) || {}).innerText || '').trim()));
        return t.ok(v.every((s) => /^\d+$/.test(s)), `HUD values: ${JSON.stringify(v)}`);
      });
      await t.part('#hold exposes data-piece, #next lists five previews', async () => {
        const v = await t.eval(() => {
          const hold = document.getElementById('hold');
          const previews = [...document.querySelectorAll('#next [data-preview]')];
          return {
            hold: hold ? hold.getAttribute('data-piece') : null,
            n: previews.length,
            indexes: previews.map((p) => p.getAttribute('data-preview')).join(','),
            pieces: previews.every((p) => typeof p.getAttribute('data-piece') === 'string'),
          };
        });
        return t.ok(v.hold != null && v.n >= 5 && v.pieces, JSON.stringify(v));
      });
      await t.part('pause / restart / autoplay / mute and control buttons exist', async () => {
        const missing = [];
        for (const id of ['pause', 'restart', 'autoplay', 'mute']) if (!(await t.exists('#' + id))) missing.push(id);
        const acts = await t.eval(() =>
          [...document.querySelectorAll('#controls [data-action]')].map((b) => b.getAttribute('data-action')));
        for (const need of ['left', 'right', 'cw', 'ccw', 'soft', 'hard', 'hold']) if (!acts.includes(need)) missing.push(need);
        return t.ok(missing.length === 0, `missing: ${missing.join(', ')}`);
      });
    },
  },

  {
    id: 'movement',
    title: 'Movement, hard drop, locking',
    points: 6,
    async run(t) {
      await t.part('ArrowLeft / ArrowRight move the piece one column', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.sleep(150);
        const p0 = await getPiece(t);
        if (!p0 || !p0.cells || !p0.cells.length) return t.ok(false, 'no active piece');
        const c0 = minCol(p0.cells);
        await blur(t);
        await t.page.keyboard.press('ArrowLeft');
        await t.sleep(130);
        const p1 = await getPiece(t);
        await t.page.keyboard.press('ArrowRight');
        await t.sleep(130);
        const p2 = await getPiece(t);
        if (!p1 || !p2) return t.ok(false, 'piece disappeared');
        const c1 = minCol(p1.cells);
        const c2 = minCol(p2.cells);
        return t.ok(c1 === c0 - 1 && c2 === c0, `columns ${c0} -> ${c1} -> ${c2}`);
      });
      await t.part('Space hard-drops the piece onto the floor', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.sleep(150);
        const p0 = await getPiece(t);
        if (!p0) return t.ok(false, 'no active piece');
        await blur(t);
        await t.page.keyboard.press('Space');
        const hit = await t.poll(async () => {
          const b = await getBoard(t);
          return b && b.some((v) => v !== 0) ? true : null;
        }, { timeout: 3000 });
        if (!hit) return t.ok(false, 'nothing locked after Space');
        const b = await getBoard(t);
        const rows = [];
        for (let i = 0; i < 200; i++) if (b[i]) rows.push(Math.floor(i / 10));
        return t.ok(Math.max(...rows) === 19, `lowest locked row ${Math.max(...rows)}`);
      });
      await t.part('a new piece spawns after the lock', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.sleep(150);
        const p0 = await getPiece(t);
        await send(t, 'hard');
        const ok = await waitNewPiece(t, p0, 2500);
        const p1 = await getPiece(t);
        return t.ok(ok && p1 && cellKey(p1.cells) !== cellKey(p0.cells), `next piece ${p1 ? p1.type : 'none'}`);
      });
    },
  },

  {
    id: 'rotation',
    title: 'Rotation: SRS kicks, refusals and legality',
    points: 8,
    async run(t) {
      await t.part('a clockwise rotation changes the piece', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.sleep(140);
        const p0 = await getPiece(t);
        if (!p0) return t.ok(false, 'no active piece');
        await send(t, 'cw');
        await t.sleep(90);
        const p1 = await getPiece(t);
        if (!p1) return t.ok(false, 'piece disappeared');
        return t.ok(cellKey(p0.cells) !== cellKey(p1.cells), 'rotation had no effect');
      });
      await t.part('four clockwise rotations return to the starting shape', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.sleep(140);
        const p0 = await getPiece(t);
        if (!p0) return t.ok(false, 'no active piece');
        const start = cellKey(p0.cells);
        for (let i = 0; i < 4; i++) { await send(t, 'cw'); await t.sleep(70); }
        const p1 = await getPiece(t);
        if (!p1) return t.ok(false, 'piece disappeared');
        return t.ok(cellKey(p1.cells) === start, `${start} vs ${cellKey(p1.cells)}`);
      });
      await t.part('the O piece never changes shape', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await putPiece(t, 'O', 4, 6);
        await t.sleep(90);
        const p0 = await getPiece(t);
        if (!p0 || p0.type !== 'O') return t.ok(false, 'could not spawn an O');
        for (let i = 0; i < 4; i++) { await send(t, 'cw'); await t.sleep(70); }
        const p1 = await getPiece(t);
        if (!p1) return t.ok(false, 'piece disappeared');
        return t.ok(cellKey(p0.cells) === cellKey(p1.cells), `${cellKey(p0.cells)} vs ${cellKey(p1.cells)}`);
      });
      await t.part('a rotation against a wall stays inside the well', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        const problems = await t.eval(() => {
          const a = window.__arena;
          const out = [];
          for (const type of ['I', 'J', 'L', 'S', 'T', 'Z']) {
            for (const x of [0, 9]) {
              a.spawn(type, x, 6);
              for (const act of ['cw', 'ccw', 'cw']) {
                a.input(act);
                const p = a.piece();
                if (!p) continue;
                for (const [c, r] of p.cells) {
                  if (c < 0 || c > 9 || r < 0 || r > 19) out.push(`${type}@${x} ${act} -> ${c},${r}`);
                }
              }
            }
          }
          return out.slice(0, 4);
        });
        return t.ok(problems.length === 0, JSON.stringify(problems));
      });
      await t.part('no rotation ever produces an overlapping or out-of-bounds piece', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        const problems = await t.eval(() => {
          const a = window.__arena;
          const out = [];
          const types = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
          for (const type of types) {
            for (let x = 0; x <= 8; x += 4) {
              for (let y = 0; y <= 12; y += 6) {
                a.spawn(type, x, y);
                const b = a.board();
                for (const act of ['cw', 'ccw', 'cw', 'ccw']) {
                  a.input(act);
                  const p = a.piece();
                  if (!p) continue;
                  for (const [c, r] of p.cells) {
                    if (c < 0 || c > 9 || r < 0 || r > 19) out.push(`${type} out ${c},${r}`);
                    else if (b[r * 10 + c] !== 0) out.push(`${type} overlap ${c},${r}`);
                  }
                }
              }
            }
          }
          return out.slice(0, 4);
        });
        return t.ok(problems.length === 0, JSON.stringify(problems));
      });
    },
  },

  {
    id: 'lines',
    title: 'Line clears and the stack falling down',
    points: 8,
    async run(t) {
      await t.part('a single row clears and the counter advances', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        const filled = [];
        for (let c = 0; c < 9; c++) filled.push([c, 19]);
        await putBoard(t, boardOf(filled));
        await t.sleep(90);
        await putPiece(t, 'I', 6, 4);
        await t.sleep(90);
        await send(t, 'cw');
        await t.sleep(90);
        if (!(await alignColumn(t, 9))) return t.ok(false, 'could not align the I piece');
        await send(t, 'hard');
        await t.sleep(350);
        const s = await getState(t);
        const b = await getBoard(t);
        const filledCells = b.filter((v) => v !== 0).length;
        return t.ok(s.lines === 1 && filledCells === 3, `lines=${s.lines} remaining cells=${filledCells}`);
      });
      await t.part('four rows clear at once (tetris)', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        const filled = [];
        for (let r = 16; r < 20; r++) for (let c = 0; c < 6; c++) filled.push([c, r]);
        await putBoard(t, boardOf(filled));
        await t.sleep(90);
        await putPiece(t, 'I', 6, 16);
        await t.sleep(90);
        await send(t, 'hard');
        await t.sleep(350);
        const s = await getState(t);
        const b = await getBoard(t);
        return t.ok(s.lines === 4 && b.every((v) => v === 0), `lines=${s.lines} empty=${b.every((v) => v === 0)}`);
      });
      await t.part('two rows clear and the stack above falls down', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        const filled = [];
        for (const r of [18, 19]) for (let c = 0; c < 8; c++) filled.push([c, r]);
        await putBoard(t, boardOf(filled));
        await t.sleep(90);
        await putPiece(t, 'O', 8, 18);
        await t.sleep(90);
        await send(t, 'hard');
        await t.sleep(350);
        const s = await getState(t);
        return t.ok(s.lines === 2, `lines=${s.lines}`);
      });
      await t.part('rows above a cleared row move down', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        const filled = [];
        for (let c = 0; c < 9; c++) filled.push([c, 19]);
        filled.push([0, 15]);
        await putBoard(t, boardOf(filled));
        await t.sleep(90);
        await putPiece(t, 'I', 6, 4);
        await t.sleep(90);
        await send(t, 'cw');
        await t.sleep(90);
        await alignColumn(t, 9);
        await send(t, 'hard');
        await t.sleep(350);
        const b = await getBoard(t);
        return t.ok(b[18 * 10] === 1 && b[15 * 10] === 0, `block now at row ${b[18 * 10] ? 18 : 'not 18'}`);
      });
    },
  },

  {
    id: 'bag',
    title: '7-bag randomiser, seeding and reproducibility',
    points: 6,
    async run(t) {
      await t.part('every seven consecutive pieces contain all seven types', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        const types = await collectTypes(t, 7);
        if (types.length < 7) return t.ok(false, `only ${types.length} pieces seen`);
        return t.ok(new Set(types).size === 7, `types: ${types.join('')}`);
      });
      await t.part('70 pieces contain each type exactly ten times', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        const types = await collectTypes(t, 70, undefined, true);
        if (types.length < 70) return t.ok(false, `only ${types.length} pieces seen`);
        const counts = {};
        for (const ty of types) counts[ty] = (counts[ty] || 0) + 1;
        const ok = Object.keys(counts).length === 7 && Object.values(counts).every((v) => v === 10);
        return t.ok(ok, JSON.stringify(counts));
      });
      await t.part('the same seed reproduces the same sequence', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        const a = await collectTypes(t, 14, 1234);
        const b = await collectTypes(t, 14, 1234);
        if (a.length < 14 || b.length < 14) return t.ok(false, 'not enough pieces');
        return t.ok(a.join('') === b.join(''), `${a.join('')} vs ${b.join('')}`);
      });
      await t.part('a different seed produces a different sequence', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        const a = await collectTypes(t, 14, 1234);
        const b = await collectTypes(t, 14, 98765);
        if (a.length < 14 || b.length < 14) return t.ok(false, 'not enough pieces');
        return t.ok(a.join('') !== b.join(''), `${a.join('')} vs ${b.join('')}`);
      });
    },
  },

  {
    id: 'hold',
    title: 'Hold slot',
    points: 5,
    async run(t) {
      await t.part('holding stores the piece and swaps it out', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.sleep(140);
        const p0 = await getPiece(t);
        if (!p0) return t.ok(false, 'no active piece');
        await send(t, 'hold');
        await t.sleep(140);
        const held = await t.eval(() => {
          const h = document.getElementById('hold');
          return h ? h.getAttribute('data-piece') : null;
        });
        const p1 = await getPiece(t);
        return t.ok(held === p0.type && p1 && p1.type !== p0.type, `held=${held} was=${p0.type} now=${p1 ? p1.type : 'none'}`);
      });
      await t.part('hold cannot be used twice before the piece locks', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.sleep(140);
        const p0 = await getPiece(t);
        await send(t, 'hold');
        await t.sleep(120);
        const p1 = await getPiece(t);
        await send(t, 'hold');
        await t.sleep(120);
        const p2 = await getPiece(t);
        if (!p1 || !p2) return t.ok(false, 'piece disappeared');
        return t.ok(cellKey(p1.cells) === cellKey(p2.cells), `piece changed on the second hold: ${p1.type} -> ${p2.type}`);
      });
      await t.part('hold works again once a piece has locked', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.sleep(140);
        const first = await getPiece(t);
        await send(t, 'hold');
        await t.sleep(120);
        const cur = await getPiece(t);
        await dropAndSettle(t);
        const p = await getPiece(t);
        if (!p) return t.ok(false, 'no active piece');
        await send(t, 'hold');
        await t.sleep(150);
        const held = await t.eval(() => {
          const h = document.getElementById('hold');
          return h ? h.getAttribute('data-piece') : null;
        });
        const p2 = await getPiece(t);
        return t.ok(held === p.type && p2 && p2.type !== p.type, `held=${held} expected=${p.type} now=${p2 ? p2.type : 'none'} (first=${first ? first.type : '?'}, cur=${cur ? cur.type : '?'})`);
      });
    },
  },

  {
    id: 'ghost',
    title: 'Ghost piece',
    points: 3,
    async run(t) {
      await t.part('ghostY matches the landing row', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.sleep(140);
        const v = await t.eval(() => {
          const a = window.__arena;
          if (typeof a.ghostY !== 'function') return null;
          const p = a.piece();
          const b = a.board();
          if (!p || !b) return null;
          let cells = p.cells.map(([c, r]) => [c, r]);
          for (let i = 0; i < 40; i++) {
            const next = cells.map(([c, r]) => [c, r + 1]);
            if (next.some(([c, r]) => r > 19 || c < 0 || c > 9 || b[r * 10 + c] !== 0)) break;
            cells = next;
          }
          return { ghost: a.ghostY(), real: Math.min(...cells.map(([c, r]) => r)) };
        });
        if (!v) return t.ok(false, 'ghostY() unavailable');
        return t.ok(v.ghost === v.real, `ghostY=${v.ghost} landing=${v.real}`);
      });
      await t.part('the ghost lands on the stack, not on the floor', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        const filled = [];
        for (let c = 0; c < 10; c++) filled.push([c, 19]);
        filled.push([4, 18]);
        await putBoard(t, boardOf(filled));
        await t.sleep(140);
        const v = await t.eval(() => {
          const a = window.__arena;
          if (typeof a.ghostY !== 'function') return null;
          const p = a.piece();
          const b = a.board();
          let cells = p.cells.map(([c, r]) => [c, r]);
          for (let i = 0; i < 40; i++) {
            const next = cells.map(([c, r]) => [c, r + 1]);
            if (next.some(([c, r]) => r > 19 || c < 0 || c > 9 || b[r * 10 + c] !== 0)) break;
            cells = next;
          }
          return { ghost: a.ghostY(), real: Math.min(...cells.map(([c, r]) => r)) };
        });
        if (!v) return t.ok(false, 'ghostY() unavailable');
        return t.ok(v.ghost === v.real && v.real < 19, `ghostY=${v.ghost} landing=${v.real}`);
      });
    },
  },


  {
    id: 'lockdelay',
    title: 'Lock delay',
    points: 5,
    async run(t) {
      await t.part('a resting piece does not lock immediately', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await putPiece(t, 'O', 4, 18);
        await t.sleep(120);
        const b1 = await getBoard(t);
        await t.sleep(220);
        const b2 = await getBoard(t);
        return t.ok(b1.join('') === b2.join(''), 'the piece locked within 220 ms');
      });
      await t.part('moving the piece restarts the lock delay', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await putPiece(t, 'O', 4, 18);
        await t.sleep(120);
        await t.sleep(500);
        await send(t, 'left');
        await t.sleep(320);
        const b = await getBoard(t);
        return t.ok(b.every((v) => v === 0), 'the piece locked despite the reset');
      });
      await t.part('the piece eventually locks', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await putPiece(t, 'O', 4, 18);
        await t.sleep(120);
        const hit = await t.poll(async () => {
          const b = await getBoard(t);
          return b && b.some((v) => v !== 0) ? true : null;
        }, { timeout: 3000 });
        return t.ok(!!hit, 'the piece never locked');
      });
    },
  },

  {
    id: 'gravity',
    title: 'Gravity curve and levels',
    points: 6,
    async run(t) {
      await t.part('level 1: the piece does not fall within 400 ms', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await putLines(t, 0);
        await t.sleep(120);
        const p0 = await getPiece(t);
        if (!p0) return t.ok(false, 'no active piece');
        const r0 = Math.min(...p0.cells.map((c) => c[1]));
        await t.sleep(420);
        const p1 = await getPiece(t);
        if (!p1) return t.ok(false, 'piece disappeared');
        const r1 = Math.min(...p1.cells.map((c) => c[1]));
        return t.ok(r1 === r0, `piece fell from row ${r0} to ${r1}`);
      });
      await t.part('level 10: the piece falls quickly', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await putLines(t, 90);
        await t.sleep(120);
        const p0 = await getPiece(t);
        if (!p0) return t.ok(false, 'no active piece');
        const r0 = Math.min(...p0.cells.map((c) => c[1]));
        const hit = await t.poll(async () => {
          const p = await getPiece(t);
          if (!p) return null;
          return Math.min(...p.cells.map((c) => c[1])) !== r0 ? true : null;
        }, { timeout: 2000 });
        return t.ok(!!hit, 'the piece never fell at level 10');
      });
      await t.part('level = floor(lines / 10) + 1', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        if (!(await putLines(t, 19))) return t.ok(false, 'setLines() unavailable');
        await t.sleep(80);
        const s1 = await getState(t);
        await putLines(t, 20);
        await t.sleep(80);
        const s2 = await getState(t);
        return t.ok(s1.level === 2 && s2.level === 3, `levels ${s1.level} and ${s2.level}`);
      });
    },
  },

  {
    id: 'scoring',
    title: 'Scoring: line clears, drop points, level and combo',
    points: 7,
    async run(t) {
      await t.part('hard drop awards 2 points per row', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await putPiece(t, 'T', 3, 0);
        await t.sleep(120);
        const p0 = await getPiece(t);
        if (!p0) return t.ok(false, 'no active piece');
        const startRow = Math.min(...p0.cells.map((c) => c[1]));
        await send(t, 'hard');
        await t.sleep(300);
        const s = await getState(t);
        const b = await getBoard(t);
        const rows = [];
        for (let i = 0; i < 200; i++) if (b[i]) rows.push(Math.floor(i / 10));
        const dist = Math.min(...rows) - startRow;
        return t.ok(s.score === 2 * dist, `score ${s.score}, expected ${2 * dist} (dropped ${dist} rows)`);
      });
      await t.part('a single row clear scores 100 × level', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        const filled = [];
        for (let c = 0; c < 9; c++) filled.push([c, 19]);
        await putBoard(t, boardOf(filled));
        await t.sleep(90);
        await putPiece(t, 'I', 6, 4);
        await t.sleep(90);
        await send(t, 'cw');
        await t.sleep(90);
        await alignColumn(t, 9);
        const land = await landingRow(t);
        const p0 = await getPiece(t);
        const startRow = Math.min(...p0.cells.map((c) => c[1]));
        await send(t, 'hard');
        await t.sleep(350);
        const s = await getState(t);
        const expected = 100 + 2 * (land - startRow);
        return t.ok(s.lines === 1 && s.score === expected, `score ${s.score}, expected ${expected}`);
      });
      await t.part('a four row clear scores 800 × level', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        const filled = [];
        for (let r = 16; r < 20; r++) for (let c = 0; c < 6; c++) filled.push([c, r]);
        await putBoard(t, boardOf(filled));
        await t.sleep(90);
        await putPiece(t, 'I', 6, 16);
        await t.sleep(90);
        await send(t, 'hard');
        await t.sleep(350);
        const s = await getState(t);
        const expected = 800 + 2 * 3;
        return t.ok(s.lines === 4 && s.score === expected, `score ${s.score}, expected ${expected}`);
      });
      await t.part('the line clear value scales with the level', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await putLines(t, 10);
        const filled = [];
        for (let c = 0; c < 9; c++) filled.push([c, 19]);
        await putBoard(t, boardOf(filled));
        await t.sleep(90);
        await putPiece(t, 'I', 6, 4);
        await t.sleep(90);
        await send(t, 'cw');
        await t.sleep(90);
        await alignColumn(t, 9);
        const land = await landingRow(t);
        const p0 = await getPiece(t);
        const startRow = Math.min(...p0.cells.map((c) => c[1]));
        await send(t, 'hard');
        await t.sleep(350);
        const s = await getState(t);
        const expected = 200 + 2 * (land - startRow);
        return t.ok(s.level === 2 && s.score === expected, `level ${s.level}, score ${s.score}, expected ${expected}`);
      });
      await t.part('two clears in a row pay a combo bonus', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        const filled = [];
        for (let c = 0; c < 9; c++) filled.push([c, 19]);
        await putBoard(t, boardOf(filled));
        await t.sleep(90);
        await putPiece(t, 'I', 6, 4);
        await t.sleep(90);
        await send(t, 'cw');
        await t.sleep(90);
        await alignColumn(t, 9);
        let land = await landingRow(t);
        let p0 = await getPiece(t);
        let startRow = Math.min(...p0.cells.map((c) => c[1]));
        const d1 = land - startRow;
        await send(t, 'hard');
        await t.sleep(350);
        const after1 = await getState(t);

        await putBoard(t, boardOf(filled));
        await t.sleep(90);
        await putPiece(t, 'I', 6, 4);
        await t.sleep(90);
        await send(t, 'cw');
        await t.sleep(90);
        await alignColumn(t, 9);
        land = await landingRow(t);
        p0 = await getPiece(t);
        startRow = Math.min(...p0.cells.map((c) => c[1]));
        const d2 = land - startRow;
        await send(t, 'hard');
        await t.sleep(400);
        const s = await getState(t);
        const expected = (100 + 2 * d1) + (100 + 50 + 2 * d2);
        return t.ok(s.lines === 2 && s.score === expected, `score ${s.score}, expected ${expected}, combo=${s.combo}`);
      });
    },
  },

  {
    id: 'tspin',
    title: 'T-spin detection',
    points: 6,
    async run(t) {
      await t.part('the game reports the last spin', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        const s = await getState(t);
        return t.ok('lastSpin' in (s || {}), `state has no lastSpin: ${JSON.stringify(s)}`);
      });
      await t.part('a wedged T that is rotated in is recognised as a spin', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        // a lone block at row 17, column 3: rotating the T down into the well leaves
        // three of the four corners around the T's centre occupied (block + floor + floor)
        await putBoard(t, boardOf([[3, 17]]));
        await t.sleep(90);
        await putPiece(t, 'T', 3, 17);
        await t.sleep(120);
        const p0 = await getPiece(t);
        if (!p0 || p0.type !== 'T') return t.ok(false, 'could not spawn a T');
        await send(t, 'cw');
        await t.sleep(80);
        await send(t, 'cw');
        await t.sleep(120);
        await t.sleep(1100);
        const s = await getState(t);
        const spin = s && s.lastSpin;
        if (!spin || spin === 'none') return t.ok(false, 'no spin detected');
        return t.ok(spin === 'full', `lastSpin=${spin}`);
      });
      await t.part('a spin is paid with the T-spin value', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await putBoard(t, boardOf([[3, 17]]));
        await t.sleep(90);
        await putPiece(t, 'T', 3, 17);
        await t.sleep(120);
        await send(t, 'cw');
        await t.sleep(80);
        await send(t, 'cw');
        await t.sleep(120);
        await t.sleep(1100);
        const s = await getState(t);
        if (!s.lastSpin || s.lastSpin === 'none') return t.ok(false, 'no spin detected');
        return t.ok(s.score >= 400, `score ${s.score}, a T-spin without lines is worth 400`);
      });
    },
  },

  {
    id: 'perfect',
    title: 'Perfect clear',
    points: 3,
    async run(t) {
      await t.part('clearing the whole well pays the perfect clear bonus', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        const filled = [];
        for (const r of [18, 19]) for (let c = 0; c < 8; c++) filled.push([c, r]);
        await putBoard(t, boardOf(filled));
        await t.sleep(90);
        await putPiece(t, 'O', 8, 18);
        await t.sleep(90);
        await send(t, 'hard');
        await t.sleep(400);
        const s = await getState(t);
        const b = await getBoard(t);
        const empty = b.every((v) => v === 0);
        const expected = 300 + 1200; // double + perfect clear double, level 1
        return t.ok(empty && s.lines === 2 && s.score === expected,
          `empty=${empty} lines=${s.lines} score=${s.score} expected=${expected}`);
      });
    },
  },

  {
    id: 'input',
    title: 'Keyboard, auto-repeat, on-screen buttons and pause',
    points: 5,
    async run(t) {
      await t.part('holding a direction key auto-repeats', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.sleep(150);
        const p0 = await getPiece(t);
        if (!p0) return t.ok(false, 'no active piece');
        const c0 = minCol(p0.cells);
        await blur(t);
        await t.page.keyboard.down('ArrowLeft');
        await t.sleep(750);
        await t.page.keyboard.up('ArrowLeft');
        await t.sleep(120);
        const p1 = await getPiece(t);
        if (!p1) return t.ok(false, 'piece disappeared');
        const c1 = minCol(p1.cells);
        return t.ok(c1 < c0 - 1 || c1 === 0, `column ${c0} -> ${c1} after holding the key`);
      });
      await t.part('the on-screen buttons work', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.sleep(150);
        const p0 = await getPiece(t);
        if (!p0) return t.ok(false, 'no active piece');
        const c0 = minCol(p0.cells);
        const btn = await t.eval(() => {
          const b = document.querySelector('#controls [data-action="left"]');
          if (!b) return null;
          const r = b.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
        });
        if (!btn || btn.w === 0) return t.ok(false, 'no visible left button');
        await t.page.mouse.click(btn.x, btn.y);
        await t.sleep(150);
        const p1 = await getPiece(t);
        if (!p1) return t.ok(false, 'piece disappeared');
        return t.ok(minCol(p1.cells) === c0 - 1, `column ${c0} -> ${minCol(p1.cells)}`);
      });
      await t.part('P pauses and resumes the game', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.sleep(150);
        await blur(t);
        await t.page.keyboard.press('p');
        await t.sleep(200);
        const s1 = await getState(t);
        if (!s1 || s1.phase !== 'paused') return t.ok(false, `phase after P is ${s1 ? s1.phase : '?'}`);
        const b1 = await getBoard(t);
        await t.sleep(600);
        const b2 = await getBoard(t);
        if (b1.join('') !== b2.join('')) return t.ok(false, 'the stack changed while paused');
        await t.page.keyboard.press('p');
        await t.sleep(250);
        const s2 = await getState(t);
        return t.ok(s2 && s2.phase !== 'paused', `phase after the second P is ${s2 ? s2.phase : '?'}`);
      });
    },
  },

  {
    id: 'replay',
    title: 'Deterministic replay',
    points: 5,
    async run(t) {
      await t.part('exportReplay returns a non-empty string', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        if (!(await hasApi(t, 'exportReplay'))) return t.ok(false, 'exportReplay() missing');
        await newGame(t, 4242);
        await t.sleep(120);
        await send(t, 'left');
        await t.sleep(80);
        const r = await t.eval(() => {
          try { return String(window.__arena.exportReplay()); } catch (e) { return ''; }
        });
        return t.ok(r.length > 0, `replay length ${r.length}`);
      });
      await t.part('importing a replay reproduces the same game', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        if (!(await hasApi(t, 'exportReplay')) || !(await hasApi(t, 'importReplay')))
          return t.ok(false, 'exportReplay/importReplay missing');
        const snap = () =>
          t.eval(() => {
            const a = window.__arena;
            const s = a.state();
            const p = a.piece();
            return {
              board: (a.board() || []).join(''),
              score: s.score,
              lines: s.lines,
              piece: p ? p.type + ':' + p.cells.map((c) => c.join(',')).sort().join(' ') : 'none',
            };
          });

        await newGame(t, 4242);
        await t.sleep(150);
        const acts = ['left', 'cw', 'hard', 'hold', 'right', 'ccw', 'hard'];
        for (const a of acts) { await send(t, a); await t.sleep(90); }
        await t.sleep(300);
        const before = await snap();
        const replay = await t.eval(() => {
          try { return String(window.__arena.exportReplay()); } catch (e) { return ''; }
        });
        if (!replay) return t.ok(false, 'empty replay');

        await newGame(t, 4242);
        await t.sleep(150);
        await t.eval((r) => { try { window.__arena.importReplay(r); } catch (e) {} return true; }, replay);
        await t.sleep(600);
        const after = await snap();
        const same = before.board === after.board && before.score === after.score && before.lines === after.lines;
        return t.ok(same, `before ${JSON.stringify(before)} / after ${JSON.stringify(after)}`);
      });
    },
  },

  {
    id: 'autoplay',
    title: 'Autoplay agent',
    points: 4,
    async run(t) {
      await t.part('#autoplay toggles and the agent plays', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.sleep(150);
        await t.page.click('#autoplay').catch(() => {});
        await t.sleep(200);
        const pressed = await t.eval(() => {
          const b = document.getElementById('autoplay');
          return b ? b.getAttribute('aria-pressed') : null;
        });
        const b0 = await getBoard(t);
        await t.sleep(2500);
        const b1 = await getBoard(t);
        const moved = b0.join('') !== b1.join('');
        await t.page.click('#autoplay').catch(() => {});
        return t.ok(pressed === 'true' && moved, `aria-pressed=${pressed} stackChanged=${moved}`);
      });
      await t.part('the agent actually clears lines', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.sleep(150);
        await t.page.click('#autoplay').catch(() => {});
        await t.sleep(200);
        await advance(t, 45000);
        await t.sleep(300);
        const s = await getState(t);
        await t.page.click('#autoplay').catch(() => {});
        return t.ok(s && s.lines >= 1, `lines cleared by the agent: ${s ? s.lines : '?'}`);
      });
    },
  },

  {
    id: 'persistence',
    title: 'Persistence across reload',
    points: 4,
    async run(t) {
      await t.part('the best score survives a reload', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.sleep(120);
        await send(t, 'hard');
        await t.sleep(300);
        const best = await t.eval(() => Number(localStorage.getItem('tessera.best') || 0));
        await t.reload();
        await t.sleep(700);
        const best2 = await t.eval(() => Number(localStorage.getItem('tessera.best') || 0));
        return t.ok(best > 0 && best2 >= best, `best ${best} -> ${best2}`);
      });
      await t.part('the mute setting survives a reload', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await t.page.click('#mute').catch(() => {});
        await t.sleep(250);
        const pressed = await t.eval(() => {
          const b = document.getElementById('mute');
          return b ? b.getAttribute('aria-pressed') : null;
        });
        const settings = await t.eval(() => {
          try { return JSON.parse(localStorage.getItem('tessera.settings') || 'null'); } catch (e) { return null; }
        });
        await t.reload();
        await t.sleep(700);
        const pressed2 = await t.eval(() => {
          const b = document.getElementById('mute');
          return b ? b.getAttribute('aria-pressed') : null;
        });
        return t.ok(pressed === 'true' && settings && settings.mute === true && pressed2 === 'true',
          `pressed=${pressed} settings=${JSON.stringify(settings)} afterReload=${pressed2}`);
      });
    },
  },

  {
    id: 'performance',
    title: 'Performance, rendering and robustness',
    points: 6,
    async run(t) {
      await t.part('the canvas really renders the well', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        const url1 = await t.eval(() => {
          const c = document.getElementById('board');
          return c && typeof c.toDataURL === 'function' ? c.toDataURL() : '';
        });
        await newGame(t);
        await t.sleep(120);
        await putBoard(t, boardOf([[0, 19], [1, 19], [2, 18], [3, 17]]));
        await t.sleep(250);
        const url2 = await t.eval(() => {
          const c = document.getElementById('board');
          return c && typeof c.toDataURL === 'function' ? c.toDataURL() : '';
        });
        return t.ok(url1 && url2 && url1 !== url2, 'the canvas did not change when the stack changed');
      });
      await t.part('holds a smooth frame rate while playing', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.page.click('#autoplay').catch(() => {});
        await t.sleep(400);
        const fps = await t.eval(() => new Promise((res) => {
          let n = 0;
          const t0 = performance.now();
          const step = () => {
            n++;
            const dt = performance.now() - t0;
            if (dt < 2000) requestAnimationFrame(step);
            else res(n / (dt / 1000));
          };
          requestAnimationFrame(step);
        }));
        await t.page.click('#autoplay').catch(() => {});
        return t.ok(fps >= 45, `${Number(fps).toFixed(1)} fps`);
      });
      await t.part('survives a viewport resize', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.sleep(120);
        await t.page.setViewport({ width: 900, height: 700 });
        await t.sleep(500);
        const v = await t.eval(() => {
          const c = document.getElementById('board');
          return c ? { w: c.width, h: c.height, cw: c.clientWidth, ch: c.clientHeight } : null;
        });
        await t.page.setViewport({ width: 1280, height: 800 });
        await t.sleep(400);
        const s = await getState(t);
        return t.ok(v && v.w > 0 && v.h > 0 && v.cw > 0 && s !== null, `canvas ${JSON.stringify(v)}`);
      });
      await t.part('keeps playing for a long session', async () => {
        const api = await apiInfo(t);
        if (!api.ok) return t.ok(false, api.note);
        await newGame(t);
        await t.page.click('#autoplay').catch(() => {});
        await advance(t, 30000);
        await t.sleep(300);
        const s = await getState(t);
        const b = await getBoard(t);
        await t.page.click('#autoplay').catch(() => {});
        return t.ok(s && b && s.phase !== undefined, `phase ${s ? s.phase : '?'}`);
      });
    },
  },
];

/* ------------------------------------------------------------------ showcase */

export async function showcase(t) {
  await t.sleep(800);
  await t.shot('01-fresh');

  // a believable stack for the screenshot
  await t.eval(() => {
    const a = window.__arena;
    if (!a || typeof a.setBoard !== 'function') return;
    const b = new Array(200).fill(0);
    const heights = [4, 6, 3, 7, 5, 2, 6, 8, 3, 5];
    for (let c = 0; c < 10; c++) {
      for (let k = 0; k < heights[c]; k++) {
        const r = 19 - k;
        if ((c * 5 + k * 3) % 4 !== 0) b[r * 10 + c] = 1 + ((c + k) % 7);
      }
    }
    a.setBoard(b);
  });
  await t.sleep(500);
  await t.shot('02-stack');

  await t.page.keyboard.press('ArrowLeft').catch(() => {});
  await t.page.keyboard.press('ArrowUp').catch(() => {});
  await t.page.keyboard.press('Space').catch(() => {});
  await t.sleep(400);
  await t.shot('03-after-drop');

  await t.eval(() => {
    const a = window.__arena;
    if (!a || typeof a.setBoard !== 'function') return;
    const b = new Array(200).fill(0);
    for (let c = 0; c < 10; c++) if (c !== 9) b[19 * 10 + c] = 1 + (c % 7);
    a.setBoard(b);
  });
  await t.sleep(300);
  await t.eval(() => {
    const a = window.__arena;
    if (!a || typeof a.spawn !== 'function') return;
    a.spawn('I', 6, 4);
  });
  await t.sleep(200);
  await t.eval(() => { try { window.__arena.input('cw'); } catch (e) {} });
  await t.sleep(200);
  await t.eval(() => { try { window.__arena.input('right'); } catch (e) {} });
  await t.sleep(200);
  await t.shot('04-pre-clear');
  await t.eval(() => { try { window.__arena.input('hard'); } catch (e) {} });
  await t.sleep(350);
  await t.shot('05-line-clear');

  await t.page.click('#autoplay').catch(() => {});
  await t.sleep(3000);
  await t.shot('06-autoplay');
  await t.page.click('#autoplay').catch(() => {});
}

