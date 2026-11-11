export const meta = {
  title: 'Latch',
  subtitle: 'Synchronous logic bench',
  order: 5,
  skills: ['discrete-event simulation', 'sequential logic', 'graph editing', 'persistence'],
  summary:
    'A unit-delay digital logic workbench: combinational gates, a phase-accurate clock, edge-triggered flip-flops with sample-then-commit semantics, and a schematic UI.',
  judging: [
    'Does the bench look like a real schematic instrument: symbols, wires, contrast, density?',
    'Do toggles, selection, wiring and the playhead feel immediate and physical?',
    'Can you read signal flow without hovering every pin?',
  ],
};

function bit(v) {
  if (v === true || v === 1 || v === '1') return 1;
  if (v === false || v === 0 || v === '0') return 0;
  return null;
}

function eqBit(actual, expected) {
  return bit(actual) === expected;
}

const TOOLS = [
  '#tool-select', '#tool-in', '#tool-out', '#tool-not', '#tool-and', '#tool-or',
  '#tool-xor', '#tool-nand', '#tool-nor', '#tool-dff', '#tool-clk',
];

async function ticksText(t) {
  return t.eval(() => document.querySelector('#ticks')?.textContent?.trim() ?? '');
}

export const checks = [
  {
    id: 'scaffold',
    title: 'Board, toolbar and API surface',
    points: 6,
    async run(t) {
      await t.part('transport and palette exist', async () => {
        const missing = [];
        for (const sel of ['#board', '#ticks', '#tick', '#run', '#reset', '#undo', ...TOOLS]) {
          if (!(await t.exists(sel))) missing.push(sel);
        }
        return t.ok(missing.length === 0, missing.length ? `missing ${missing.join(' ')}` : 'ok');
      });
      await t.part('board visible', () => t.visible('#board'));
      await t.part('API surface', async () => {
        const miss = await t.eval(() => {
          const need = ['reset', 'add', 'connect', 'disconnect', 'remove', 'set', 'get', 'setClock', 'tick', 'time', 'run', 'stable', 'undo', 'list'];
          const a = window.__arena;
          if (!a) return need;
          return need.filter((k) => typeof a[k] !== 'function');
        });
        return t.ok(Array.isArray(miss) && miss.length === 0, miss?.length ? `missing ${miss.join(' ')}` : 'no __arena');
      });
    },
  },
  {
    id: 'ui',
    title: 'Buttons, placement, delete and run',
    points: 4,
    async run(t) {
      await t.part('#tick advances #ticks', async () => {
        await t.page.click('#reset');
        await t.page.click('#tick');
        const a = await ticksText(t);
        await t.page.click('#tick');
        const b = await ticksText(t);
        return t.ok(a === '1' && b === '2', `#ticks after two clicks: "${a}", "${b}"`);
      });
      await t.part('#run starts and stops', async () => {
        await t.page.click('#reset');
        await t.page.click('#run');
        const moved = await t.poll(async () => {
          const n = Number(await ticksText(t));
          return Number.isFinite(n) && n > 0 ? n : null;
        }, { timeout: 1600 });
        const pressed = await t.eval(() => document.querySelector('#run')?.getAttribute('aria-pressed'));
        await t.page.click('#run');
        await t.sleep(350);
        const froze = await ticksText(t);
        await t.sleep(400);
        const still = await ticksText(t);
        if (!moved) return { ok: false, note: '#ticks never advanced while running' };
        if (pressed !== 'true') return { ok: false, note: `aria-pressed while running: ${pressed}` };
        return t.ok(froze === still, `time kept moving after stop (${froze} → ${still})`);
      });
      await t.part('palette click places a gate; Delete removes it', async () => {
        await t.page.click('#reset');
        await t.page.click('#tool-not');
        await t.page.click('#board');
        const n = await t.count('[data-gate]');
        if (n < 1) return { ok: false, note: 'clicking #board with NOT armed created no [data-gate]' };
        await t.page.click('[data-gate]');
        const selected = await t.eval(() => document.querySelector('[data-gate]')?.getAttribute('aria-selected'));
        await t.page.keyboard.press('Delete');
        const left = await t.count('[data-gate]');
        if (selected !== 'true') return { ok: false, note: `aria-selected after click: ${selected}` };
        return t.ok(left === 0, `gates left after Delete: ${left}`);
      });
      await t.part('Space toggles free-run', async () => {
        await t.page.click('#reset');
        await t.page.click('#ticks');
        await t.page.keyboard.press('Space');
        const moved = await t.poll(async () => {
          const n = Number(await ticksText(t));
          return Number.isFinite(n) && n > 0 ? n : null;
        }, { timeout: 1600 });
        await t.page.keyboard.press('Space');
        await t.sleep(350);
        const a = await ticksText(t);
        await t.sleep(400);
        const b = await ticksText(t);
        if (!moved) return { ok: false, note: 'Space did not start the clock' };
        return t.ok(a === b, `still running after second Space (${a} → ${b})`);
      });
    },
  },
  {
    id: 'visual-sync',
    title: 'API components appear as gated DOM',
    points: 3,
    async run(t) {
      await t.part('[data-gate] and pins mirror add()', async () => {
        const info = await t.eval(() => {
          const a = window.__arena;
          if (!a) return { error: 'no api' };
          a.reset();
          a.add('and', 'vis1');
          const el = document.querySelector('[data-gate="vis1"]');
          if (!el) return { error: 'missing element' };
          const r = el.getBoundingClientRect();
          const pins = [...el.querySelectorAll('[data-pin]')].map((p) => p.dataset.pin);
          return {
            type: el.dataset.type,
            w: r.width,
            h: r.height,
            pins,
            inBoard: !!el.closest('#board'),
          };
        });
        if (info?.error) return { ok: false, note: info.error };
        const pins = info.pins || [];
        const ok = info.type === 'and' && info.inBoard && info.w >= 36 && info.h >= 36
          && pins.includes('A') && pins.includes('B') && pins.includes('Y');
        return t.ok(ok, `type=${info.type} ${Math.round(info.w)}×${Math.round(info.h)} pins=${pins.join(',')}`);
      });
    },
  },
  {
    id: 'inputs',
    title: 'Input switches',
    points: 4,
    async run(t) {
      let clickable = false;
      await t.part('set() is immediate and survives tick', async () => {
        const r = await t.eval(() => {
          const a = window.__arena;
          a.reset();
          a.add('in', 'sw');
          const before = a.get('sw');
          a.set('sw', 1);
          const mid = a.get('sw');
          const t0 = a.time();
          a.tick(2);
          return { before, mid, after: a.get('sw'), time: a.time(), t0 };
        });
        return t.ok(eqBit(r.before, 0) && eqBit(r.mid, 1) && eqBit(r.after, 1) && r.time === r.t0 + 2,
          `before=${r.before} mid=${r.mid} after=${r.after} time=${r.time}`);
      });
      await t.part('click toggles an input gate', async () => {
        await t.eval(() => {
          window.__arena.reset();
          window.__arena.add('in', 'sw');
        });
        await t.page.click('#tool-select');
        await t.page.click('[data-gate="sw"]');
        const on = await t.eval(() => window.__arena.get('sw'));
        await t.page.click('[data-gate="sw"]');
        const off = await t.eval(() => window.__arena.get('sw'));
        clickable = true;
        return t.ok(eqBit(on, 1) && eqBit(off, 0), `after clicks: ${on}, then ${off}`);
      });
      await t.part('toggle does not place a second gate', async () => {
        if (!clickable) return { ok: false, note: 'click toggle did not run' };
        const n = await t.count('[data-gate]');
        return t.ok(n === 1, `gate count ${n}`);
      });
      await t.part('set on a non-input does not throw', async () => {
        const r = await t.eval(() => {
          const a = window.__arena;
          a.reset();
          a.add('and', 'g');
          try {
            a.set('g', 1);
            a.connect('nope', 'Y', 'g', 'A');
            a.tick(1);
            return { ok: true, y: a.get('g') };
          } catch (e) {
            return { ok: false, error: String(e) };
          }
        });
        return t.ok(r.ok && eqBit(r.y, 0), r.error || `Y=${r.y}`);
      });
    },
  },
  {
    id: 'not-gate',
    title: 'NOT truth and 1-tick delay',
    points: 6,
    async run(t) {
      await t.part('NOT 1 settles to 0, NOT 0 settles to 1', async () => {
        const r = await t.eval(() => {
          const a = window.__arena;
          const run = (v) => {
            a.reset();
            a.add('in', 'i');
            a.add('not', 'n');
            a.connect('i', 'Y', 'n', 'A');
            a.set('i', v);
            a.tick(4);
            return a.get('n');
          };
          return { hi: run(1), lo: run(0) };
        });
        return t.ok(eqBit(r.hi, 0) && eqBit(r.lo, 1), `NOT 1 → ${r.hi}, NOT 0 → ${r.lo}`);
      });
      await t.part('output holds until the next tick', async () => {
        const r = await t.eval(() => {
          const a = window.__arena;
          a.reset();
          a.add('in', 'i');
          a.add('not', 'n');
          a.connect('i', 'Y', 'n', 'A');
          a.set('i', 1);
          const before = a.get('n');
          a.tick(1);
          const highIn = a.get('n');
          a.set('i', 0);
          const still = a.get('n');
          a.tick(1);
          return { before, highIn, still, after: a.get('n'), time: a.time() };
        });
        const ok = eqBit(r.before, 0) && eqBit(r.highIn, 0) && eqBit(r.still, 0) && eqBit(r.after, 1) && r.time === 2;
        return t.ok(ok, `before=${r.before} after first tick=${r.highIn} after set=${r.still} next=${r.after} time=${r.time}`);
      });
      await t.part('unconnected NOT reads 0 and drives 1', async () => {
        const r = await t.eval(() => {
          const a = window.__arena;
          a.reset();
          a.add('not', 'n');
          const pin = a.get('n', 'A');
          a.tick(1);
          return { pin, y: a.get('n') };
        });
        return t.ok(eqBit(r.pin, 0) && eqBit(r.y, 1), `A=${r.pin} Y=${r.y}`);
      });
    },
  },
  {
    id: 'gates',
    title: 'AND OR XOR NAND NOR',
    points: 6,
    async run(t) {
      const table = await t.eval(() => {
        const a = window.__arena;
        const types = ['and', 'or', 'xor', 'nand', 'nor'];
        const combos = [[0, 0], [0, 1], [1, 0], [1, 1]];
        const got = {};
        for (const type of types) {
          got[type] = [];
          for (const [x, y] of combos) {
            a.reset();
            a.add('in', 'a');
            a.add('in', 'b');
            a.add(type, 'g');
            a.connect('a', 'Y', 'g', 'A');
            a.connect('b', 'Y', 'g', 'B');
            a.set('a', x);
            a.set('b', y);
            a.tick(4);
            got[type].push(a.get('g'));
          }
        }
        return got;
      });
      const expect = {
        and: [0, 0, 0, 1],
        or: [0, 1, 1, 1],
        xor: [0, 1, 1, 0],
        nand: [1, 1, 1, 0],
        nor: [1, 0, 0, 0],
      };
      for (const type of Object.keys(expect)) {
        await t.part(type, async () => {
          const got = (table?.[type] || []).map(bit);
          const ok = expect[type].every((v, i) => got[i] === v);
          return t.ok(ok, `got [${got.join(',')}] expected [${expect[type].join(',')}]`);
        });
      }
    },
  },
  {
    id: 'wiring',
    title: 'Fan-out, replace, remove, wire elements',
    points: 6,
    async run(t) {
      await t.part('fan-out drives every sink on the same tick', async () => {
        const r = await t.eval(() => {
          const a = window.__arena;
          a.reset();
          a.add('in', 'i');
          a.add('not', 'n');
          a.add('and', 'g');
          a.add('in', 'b');
          a.add('out', 'o');
          a.connect('i', 'Y', 'n', 'A');
          a.connect('i', 'Y', 'g', 'A');
          a.connect('i', 'Y', 'o', 'A');
          a.connect('b', 'Y', 'g', 'B');
          a.set('i', 1);
          a.set('b', 1);
          a.tick(1);
          return { n: a.get('n'), g: a.get('g'), o: a.get('o') };
        });
        return t.ok(eqBit(r.n, 0) && eqBit(r.g, 1) && eqBit(r.o, 1), `not=${r.n} and=${r.g} out=${r.o}`);
      });
      await t.part('a new connection replaces the old driver', async () => {
        const r = await t.eval(() => {
          const a = window.__arena;
          a.reset();
          a.add('in', 'a');
          a.add('in', 'b');
          a.add('not', 'n');
          a.connect('a', 'Y', 'n', 'A');
          a.set('a', 1);
          a.connect('b', 'Y', 'n', 'A');
          a.set('b', 0);
          a.tick(1);
          return a.get('n');
        });
        return t.ok(eqBit(r, 1), `NOT after replace → ${r}, expected 1`);
      });
      await t.part('remove drops the drive on the next tick', async () => {
        const r = await t.eval(() => {
          const a = window.__arena;
          a.reset();
          a.add('in', 'i');
          a.add('not', 'n');
          a.connect('i', 'Y', 'n', 'A');
          a.set('i', 1);
          a.tick(1);
          const driven = a.get('n');
          a.remove('i');
          const pin = a.get('n', 'A');
          const held = a.get('n');
          a.tick(1);
          return { driven, pin, held, next: a.get('n'), listed: a.list().some((g) => g.id === 'i') };
        });
        const ok = eqBit(r.driven, 0) && eqBit(r.pin, 0) && eqBit(r.held, 0) && eqBit(r.next, 1) && r.listed === false;
        return t.ok(ok, `driven=${r.driven} pin=${r.pin} held=${r.held} next=${r.next} stillListed=${r.listed}`);
      });
      await t.part('wires are elements and disappear with the gate', async () => {
        const r = await t.eval(() => {
          const a = window.__arena;
          a.reset();
          a.add('in', 'i');
          a.add('not', 'n');
          a.connect('i', 'Y', 'n', 'A');
          const wired = document.querySelectorAll('[data-wire]').length;
          a.remove('i');
          return { wired, left: document.querySelectorAll('[data-wire]').length };
        });
        return t.ok(r.wired >= 1 && r.left === 0, `wires before=${r.wired} after remove=${r.left}`);
      });
    },
  },
  {
    id: 'half-adder',
    title: 'Half adder composed of XOR and AND',
    points: 4,
    async run(t) {
      const vectors = [[0, 0, 0, 0], [1, 0, 1, 0], [0, 1, 1, 0], [1, 1, 0, 1]];
      const got = await t.eval(() => {
        const a = window.__arena;
        const out = [];
        for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          a.reset();
          a.add('in', 'a');
          a.add('in', 'b');
          a.add('xor', 's');
          a.add('and', 'c');
          a.connect('a', 'Y', 's', 'A');
          a.connect('b', 'Y', 's', 'B');
          a.connect('a', 'Y', 'c', 'A');
          a.connect('b', 'Y', 'c', 'B');
          a.set('a', x);
          a.set('b', y);
          a.tick(4);
          out.push([a.get('s'), a.get('c')]);
        }
        return out;
      });
      for (let i = 0; i < vectors.length; i++) {
        const [x, y, s, c] = vectors[i];
        await t.part(`${x}${y} → sum ${s} cout ${c}`, async () => {
          const row = got?.[i] || [];
          return t.ok(eqBit(row[0], s) && eqBit(row[1], c), `got sum=${row[0]} cout=${row[1]}`);
        });
      }
    },
  },
  {
    id: 'full-adder',
    title: '1-bit full adder',
    points: 4,
    async run(t) {
      const vectors = [[0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [1, 1, 0, 0, 1], [1, 0, 1, 0, 1]];
      const got = await t.eval(() => {
        const a = window.__arena;
        const out = [];
        for (const [x, y, cin] of [[0, 0, 0], [1, 1, 1], [1, 1, 0], [1, 0, 1]]) {
          a.reset();
          a.add('in', 'a');
          a.add('in', 'b');
          a.add('in', 'cin');
          a.add('xor', 'x1');
          a.add('xor', 'sum');
          a.add('and', 'a1');
          a.add('and', 'a2');
          a.add('or', 'cout');
          a.connect('a', 'Y', 'x1', 'A');
          a.connect('b', 'Y', 'x1', 'B');
          a.connect('x1', 'Y', 'sum', 'A');
          a.connect('cin', 'Y', 'sum', 'B');
          a.connect('a', 'Y', 'a1', 'A');
          a.connect('b', 'Y', 'a1', 'B');
          a.connect('cin', 'Y', 'a2', 'A');
          a.connect('x1', 'Y', 'a2', 'B');
          a.connect('a1', 'Y', 'cout', 'A');
          a.connect('a2', 'Y', 'cout', 'B');
          a.set('a', x);
          a.set('b', y);
          a.set('cin', cin);
          a.tick(8);
          out.push([a.get('sum'), a.get('cout')]);
        }
        return out;
      });
      for (let i = 0; i < vectors.length; i++) {
        const [x, y, cin, s, c] = vectors[i];
        await t.part(`${x}${y}${cin} → ${s},${c}`, async () => {
          const row = got?.[i] || [];
          return t.ok(eqBit(row[0], s) && eqBit(row[1], c), `got sum=${row[0]} cout=${row[1]}`);
        });
      }
    },
  },
  {
    id: 'step-semantics',
    title: 'tick is one delay step, not a fixed point',
    points: 4,
    timeout: 20000,
    async run(t) {
      const r = await t.eval(() => {
        const a = window.__arena;
        a.reset();
        a.add('in', 'i');
        a.add('not', 'n1');
        a.add('not', 'n2');
        a.connect('i', 'Y', 'n1', 'A');
        a.connect('n1', 'Y', 'n2', 'A');
        a.tick(8);
        const settled = a.get('n2');
        a.set('i', 1);
        const t0 = a.time();
        a.tick(1);
        const mid = { n1: a.get('n1'), n2: a.get('n2'), time: a.time() };
        a.tick(1);
        const done = { n2: a.get('n2'), time: a.time() };
        return { settled, t0, mid, done };
      });
      await t.part('chain of two settles with input 0', () =>
        t.ok(eqBit(r.settled, 0), `n2=${r.settled}`));
      await t.part('one tick does not deliver the new value', () =>
        t.ok(eqBit(r.mid.n2, 0) && r.mid.time === r.t0 + 1, `n2=${r.mid.n2} time=${r.mid.time} (start ${r.t0})`));
      await t.part('second tick delivers NOT NOT 1', () =>
        t.ok(eqBit(r.done.n2, 1) && r.done.time === r.t0 + 2, `n2=${r.done.n2} time=${r.done.time}`));
      await t.part('first gate has already reacted on tick 1', () =>
        t.ok(eqBit(r.mid.n1, 0), `n1=${r.mid.n1}, expected 0`));
    },
  },
  {
    id: 'delay-chain',
    title: '40-NOT propagation delay',
    points: 8,
    timeout: 20000,
    async run(t) {
      const r = await t.eval(() => {
        const a = window.__arena;
        a.reset();
        a.add('in', 'i');
        for (let k = 1; k <= 40; k++) a.add('not', 'n' + k);
        a.connect('i', 'Y', 'n1', 'A');
        for (let k = 2; k <= 40; k++) a.connect('n' + (k - 1), 'Y', 'n' + k, 'A');
        const tSettle = performance.now();
        a.tick(200);
        const settleMs = performance.now() - tSettle;
        const settled = a.get('n40');
        a.set('i', 1);
        const t0 = a.time();
        a.tick(39);
        const early = { y: a.get('n40'), time: a.time() };
        a.tick(1);
        const arrived = { y: a.get('n40'), time: a.time() };
        return { settled, settleMs, t0, early, arrived };
      });
      await t.part('even chain settles to 0', () =>
        t.ok(eqBit(r.settled, 0), `n40=${r.settled}`));
      await t.part('wave has not arrived after 39 ticks', () =>
        t.ok(eqBit(r.early.y, 0) && r.early.time === r.t0 + 39, `n40=${r.early.y} time=${r.early.time}`));
      await t.part('wave arrives on tick 40', () =>
        t.ok(eqBit(r.arrived.y, 1) && r.arrived.time === r.t0 + 40, `n40=${r.arrived.y} time=${r.arrived.time}`));
      await t.part('settle is interactive', async () => {
        const ms = r.settleMs ?? 1e9;
        const score = ms <= 250 ? 1 : ms <= 800 ? 0.6 : ms <= 2000 ? 0.3 : 0;
        return { score, note: `tick(200) on 40 NOTs took ${ms.toFixed(0)} ms` };
      });
    },
  },
  {
    id: 'clock',
    title: 'Clock waveform and tick(n)',
    points: 5,
    async run(t) {
      const r = await t.eval(() => {
        const a = window.__arena;
        a.reset();
        a.add('clk', 'c');
        a.setClock('c', 4);
        const ys = [a.get('c')];
        for (let i = 0; i < 8; i++) {
          a.tick(1);
          ys.push(a.get('c'));
        }
        a.reset();
        a.add('clk', 'd');
        const def = [];
        for (let i = 0; i < 4; i++) {
          a.tick(1);
          def.push(a.get('d'));
        }
        a.reset();
        a.add('clk', 'e');
        a.setClock('e', 4);
        a.tick(6);
        return { ys, def, batch: { y: a.get('e'), time: a.time() } };
      });
      await t.part('period 4 matches the phase rule', async () => {
        const expect = [0, 0, 1, 1, 0, 0, 1, 1, 0];
        const got = (r.ys || []).map(bit);
        return t.ok(expect.every((v, i) => got[i] === v), `got [${got.join(',')}]`);
      });
      await t.part('default period is 8 and starts low', async () => {
        const got = (r.def || []).map(bit);
        return t.ok(got[0] === 0 && got[1] === 0 && got[2] === 0 && got[3] === 1, `first four ticks [${got.join(',')}]`);
      });
      await t.part('tick(6) equals six steps', async () => {
        return t.ok(eqBit(r.batch?.y, 1) && r.batch?.time === 6, `Y=${r.batch?.y} time=${r.batch?.time}`);
      });
    },
  },
  {
    id: 'dff',
    title: 'Rising-edge DFF, not level-sensitive',
    points: 8,
    async run(t) {
      const r = await t.eval(() => {
        const a = window.__arena;
        const build = () => {
          a.reset();
          a.add('in', 'd');
          a.add('in', 'ck');
          a.add('dff', 'ff');
          a.connect('d', 'Y', 'ff', 'D');
          a.connect('ck', 'Y', 'ff', 'CLK');
        };
        build();
        a.set('d', 1);
        const before = a.get('ff');
        a.set('ck', 1);
        const beforeTick = a.get('ff');
        a.tick(1);
        const captured = a.get('ff');
        a.set('d', 0);
        a.tick(3);
        const held = a.get('ff');
        a.set('ck', 0);
        a.tick(1);
        const fell = a.get('ff');
        a.set('d', 0);
        a.set('ck', 1);
        a.tick(1);
        const second = a.get('ff');
        return { before, beforeTick, captured, held, fell, second };
      });
      await t.part('Q updates on the tick that sees the rising edge, not on set()', () =>
        t.ok(eqBit(r.before, 0) && eqBit(r.beforeTick, 0) && eqBit(r.captured, 1),
          `before=${r.before} after set=${r.beforeTick} after tick=${r.captured}`));
      await t.part('Q holds while CLK stays high', () =>
        t.ok(eqBit(r.held, 1), `Q=${r.held}, expected 1`));
      await t.part('falling edge does not capture', () =>
        t.ok(eqBit(r.fell, 1), `Q=${r.fell}, expected 1`));
      await t.part('next rising edge captures the new D', () =>
        t.ok(eqBit(r.second, 0), `Q=${r.second}, expected 0`));
    },
  },
  {
    id: 'dff-reset',
    title: 'Async reset priority',
    points: 4,
    async run(t) {
      const r = await t.eval(() => {
        const a = window.__arena;
        a.reset();
        a.add('in', 'd');
        a.add('in', 'ck');
        a.add('in', 'r');
        a.add('dff', 'ff');
        a.connect('d', 'Y', 'ff', 'D');
        a.connect('ck', 'Y', 'ff', 'CLK');
        a.connect('r', 'Y', 'ff', 'RST');
        a.set('d', 1);
        a.set('ck', 1);
        a.tick(1);
        const stored = a.get('ff');
        a.set('r', 1);
        const before = a.get('ff');
        a.tick(1);
        const cleared = a.get('ff');
        a.reset();
        a.add('in', 'd');
        a.add('in', 'ck');
        a.add('in', 'r');
        a.add('dff', 'ff');
        a.connect('d', 'Y', 'ff', 'D');
        a.connect('ck', 'Y', 'ff', 'CLK');
        a.connect('r', 'Y', 'ff', 'RST');
        a.set('d', 1);
        a.set('ck', 1);
        a.set('r', 1);
        a.tick(1);
        const override = a.get('ff');
        a.set('r', 0);
        a.tick(2);
        const released = a.get('ff');
        return { stored, before, cleared, override, released };
      });
      await t.part('RST clears Q on the next tick', () =>
        t.ok(eqBit(r.stored, 1) && eqBit(r.before, 1) && eqBit(r.cleared, 0),
          `stored=${r.stored} before=${r.before} after=${r.cleared}`));
      await t.part('RST wins over a rising edge in the same tick', () =>
        t.ok(eqBit(r.override, 0), `Q=${r.override}, expected 0`));
      await t.part('releasing RST does not load D without a new edge', () =>
        t.ok(eqBit(r.released, 0), `Q=${r.released}, expected 0`));
    },
  },
  {
    id: 'shift',
    title: 'Sample-then-commit shift register',
    points: 10,
    timeout: 20000,
    async run(t) {
      const r = await t.eval(() => {
        const a = window.__arena;
        const run = (sinkFirst) => {
          a.reset();
          a.add('in', 'd');
          a.add('in', 'ck');
          if (sinkFirst) {
            a.add('dff', 'ff2');
            a.add('dff', 'ff1');
          } else {
            a.add('dff', 'ff1');
            a.add('dff', 'ff2');
          }
          a.connect('d', 'Y', 'ff1', 'D');
          a.connect('ff1', 'Q', 'ff2', 'D');
          a.connect('ck', 'Y', 'ff1', 'CLK');
          a.connect('ck', 'Y', 'ff2', 'CLK');
          const pulse = () => {
            a.set('ck', 0);
            a.tick(1);
            a.set('ck', 1);
            a.tick(1);
          };
          a.set('d', 1);
          pulse();
          const e1 = { q1: a.get('ff1'), q2: a.get('ff2') };
          a.set('d', 0);
          pulse();
          const e2 = { q1: a.get('ff1'), q2: a.get('ff2') };
          return { e1, e2 };
        };
        return { src: run(false), sink: run(true) };
      });
      await t.part('source-first: first edge shifts a 0 into ff2', () =>
        t.ok(eqBit(r.src?.e1?.q1, 1) && eqBit(r.src?.e1?.q2, 0),
          `q1=${r.src?.e1?.q1} q2=${r.src?.e1?.q2}`));
      await t.part('source-first: second edge shifts the 1 along', () =>
        t.ok(eqBit(r.src?.e2?.q1, 0) && eqBit(r.src?.e2?.q2, 1),
          `q1=${r.src?.e2?.q1} q2=${r.src?.e2?.q2}`));
      await t.part('sink-first: first edge shifts a 0 into ff2', () =>
        t.ok(eqBit(r.sink?.e1?.q1, 1) && eqBit(r.sink?.e1?.q2, 0),
          `q1=${r.sink?.e1?.q1} q2=${r.sink?.e1?.q2}`));
      await t.part('sink-first: second edge shifts the 1 along', () =>
        t.ok(eqBit(r.sink?.e2?.q1, 0) && eqBit(r.sink?.e2?.q2, 1),
          `q1=${r.sink?.e2?.q1} q2=${r.sink?.e2?.q2}`));
    },
  },
  {
    id: 'toggle',
    title: 'Clocked toggle built from DFF and NOT',
    points: 4,
    timeout: 20000,
    async run(t) {
      const r = await t.eval(() => {
        const a = window.__arena;
        a.reset();
        a.add('clk', 'c');
        a.add('dff', 'ff');
        a.add('not', 'n');
        a.setClock('c', 8);
        a.connect('c', 'Y', 'ff', 'CLK');
        a.connect('ff', 'Q', 'n', 'A');
        a.connect('n', 'Y', 'ff', 'D');
        a.tick(4);
        const t4 = a.get('ff');
        a.tick(8);
        const t12 = a.get('ff');
        a.tick(8);
        const t20 = a.get('ff');
        return { t4, t12, t20, time: a.time() };
      });
      await t.part('Q is 1 at the first rising edge (t=4)', () =>
        t.ok(eqBit(r.t4, 1), `Q=${r.t4}`));
      await t.part('Q is 0 at t=12', () =>
        t.ok(eqBit(r.t12, 0), `Q=${r.t12}`));
      await t.part('Q is 1 at t=20', () =>
        t.ok(eqBit(r.t20, 1) && r.time === 20, `Q=${r.t20} time=${r.time}`));
    },
  },
  {
    id: 'undo',
    title: 'Undo rewinds edits and re-inits time',
    points: 4,
    async run(t) {
      const r = await t.eval(() => {
        const a = window.__arena;
        a.reset();
        a.add('in', 'i');
        a.add('not', 'n');
        a.connect('i', 'Y', 'n', 'A');
        a.set('i', 1);
        a.tick(4);
        const before = { y: a.get('n'), time: a.time(), input: a.get('i') };
        a.undo();
        const afterSet = { input: a.get('i'), time: a.time(), y: a.get('n'), n: a.list().length };
        a.set('i', 1);
        a.tick(1);
        const live = a.get('n');
        a.undo();
        a.undo();
        a.set('i', 1);
        a.tick(1);
        const disconnected = a.get('n');
        const countAfterDisconnect = a.list().length;
        a.undo();
        const afterAdd = a.list().map((g) => g.id);
        a.undo();
        const empty = a.list().length;
        let threw = false;
        try { a.undo(); } catch (e) { threw = true; }
        return { before, afterSet, live, disconnected, countAfterDisconnect, afterAdd, empty, threw };
      });
      await t.part('undo of set clears the input and time', () =>
        t.ok(eqBit(r.before.y, 0) && r.before.time === 4 && eqBit(r.afterSet.input, 0) && r.afterSet.time === 0 && eqBit(r.afterSet.y, 0),
          `time ${r.before.time}→${r.afterSet.time} in ${r.before.input}→${r.afterSet.input} Y=${r.afterSet.y}`));
      await t.part('circuit is live after undo re-init', () =>
        t.ok(eqBit(r.live, 0), `NOT 1 → ${r.live}`));
      await t.part('undo of connect breaks the wire', () =>
        t.ok(eqBit(r.disconnected, 1) && r.countAfterDisconnect === 2, `Y=${r.disconnected} count=${r.countAfterDisconnect}`));
      await t.part('undo of add, then extra undo is a no-op', () =>
        t.ok(Array.isArray(r.afterAdd) && r.afterAdd.length === 1 && r.empty === 0 && r.threw === false,
          `after one undo ids=${r.afterAdd} empty=${r.empty} threw=${r.threw}`));
    },
  },
  {
    id: 'persistence',
    title: 'Synchronous restore of time and outputs',
    points: 4,
    timeout: 20000,
    async run(t) {
      await t.eval(() => {
        const a = window.__arena;
        a.reset();
        a.add('in', 'i');
        a.add('not', 'n');
        a.connect('i', 'Y', 'n', 'A');
        a.set('i', 1);
        a.tick(1);
      });
      await t.sleep(50);
      await t.reload();
      await t.part('time, input and output survive reload', async () => {
        const r = await t.poll(async () => {
          const v = await t.eval(() => {
            const a = window.__arena;
            if (!a || typeof a.time !== 'function') return null;
            return { time: a.time(), i: a.get('i'), n: a.get('n'), ids: a.list().map((g) => g.id).sort() };
          });
          return v && v.time === 1 ? v : null;
        }, { timeout: 2500 });
        if (!r) {
          const v = await t.eval(() => window.__arena && ({ time: window.__arena.time(), i: window.__arena.get('i'), n: window.__arena.get('n') }));
          return { ok: false, note: `after reload ${JSON.stringify(v)}` };
        }
        const ids = (r.ids || []).join(',');
        return t.ok(eqBit(r.i, 1) && eqBit(r.n, 0) && ids === 'i,n', `time=${r.time} i=${r.i} n=${r.n} ids=${ids}`);
      });
      await t.part('restored NOT is still a formula', async () => {
        const r = await t.eval(() => {
          const a = window.__arena;
          a.set('i', 0);
          a.tick(1);
          return { n: a.get('n'), time: a.time() };
        });
        return t.ok(eqBit(r.n, 1) && r.time === 2, `n=${r.n} time=${r.time}`);
      });
      await t.part('DFF previous clock sample is restored', async () => {
        await t.eval(() => {
          const a = window.__arena;
          a.reset();
          a.add('in', 'd');
          a.add('in', 'ck');
          a.add('dff', 'ff');
          a.connect('d', 'Y', 'ff', 'D');
          a.connect('ck', 'Y', 'ff', 'CLK');
          a.set('d', 1);
          a.set('ck', 1);
          a.tick(1);
          a.set('d', 0);
          a.tick(1);
        });
        await t.sleep(50);
        await t.reload();
        const r = await t.poll(async () => {
          const v = await t.eval(() => {
            const a = window.__arena;
            if (!a) return null;
            return { time: a.time(), q: a.get('ff'), ck: a.get('ck'), d: a.get('d') };
          });
          return v && v.time === 2 ? v : null;
        }, { timeout: 2500 });
        if (!r) return { ok: false, note: 'DFF state did not restore' };
        const after = await t.eval(() => {
          window.__arena.tick(1);
          return window.__arena.get('ff');
        });
        return t.ok(eqBit(r.q, 1) && eqBit(r.ck, 1) && eqBit(r.d, 0) && eqBit(after, 1),
          `restored Q=${r.q} ck=${r.ck} d=${r.d}; after extra tick Q=${after}`);
      });
    },
  },
  {
    id: 'oscillation',
    title: 'Ring oscillator steps without hanging',
    points: 6,
    timeout: 15000,
    async run(t) {
      const r = await t.eval(() => {
        const a = window.__arena;
        a.reset();
        a.add('not', 'a');
        a.add('not', 'b');
        a.connect('a', 'Y', 'b', 'A');
        a.connect('b', 'Y', 'a', 'A');
        const t0 = performance.now();
        a.tick(100);
        const ms = performance.now() - t0;
        const mid = { a: a.get('a'), b: a.get('b'), time: a.time(), stable: a.stable() };
        a.disconnect('a', 'A');
        a.tick(3);
        return {
          ms,
          mid,
          recovered: { a: a.get('a'), b: a.get('b'), stable: a.stable(), time: a.time() },
        };
      });
      await t.part('tick(100) returns and lands on the even phase', () =>
        t.ok(r.mid && r.mid.time === 100 && eqBit(r.mid.a, 0) && eqBit(r.mid.b, 0) && r.ms < 3000,
          `time=${r.mid?.time} a=${r.mid?.a} b=${r.mid?.b} ${r.ms?.toFixed?.(0)} ms`));
      await t.part('the ring is not reported stable', () =>
        t.ok(r.mid?.stable === false, `stable=${r.mid?.stable}`));
      await t.part('breaking the loop settles', () =>
        t.ok(eqBit(r.recovered?.a, 1) && eqBit(r.recovered?.b, 0) && r.recovered?.stable === true && r.recovered?.time === 103,
          `a=${r.recovered?.a} b=${r.recovered?.b} stable=${r.recovered?.stable} time=${r.recovered?.time}`));
    },
  },
];

export async function showcase(t) {
  const sleep = (ms) => t.sleep(ms);
  try {
    await t.page.click('#tool-dff');
    await sleep(200);
    await t.page.click('#board');
    await sleep(200);
    await t.page.click('#tool-clk');
    await t.page.click('#board');
    await sleep(250);
    await t.shot('placing');
  } catch (e) {
    await t.shot('placing-failed');
  }
  try {
    await t.eval(() => {
      const a = window.__arena;
      if (!a) return;
      a.reset();
      a.add('clk', 'clk');
      a.setClock('clk', 8);
      a.add('dff', 'ff1');
      a.add('dff', 'ff2');
      a.add('dff', 'ff3');
      a.add('not', 'n1');
      a.add('not', 'n2');
      a.add('not', 'n3');
      a.add('out', 'o1');
      a.add('out', 'o2');
      a.add('out', 'o3');
      const wire = (ff, n, o) => {
        a.connect('clk', 'Y', ff, 'CLK');
        a.connect(ff, 'Q', n, 'A');
        a.connect(n, 'Y', ff, 'D');
        a.connect(ff, 'Q', o, 'A');
      };
      wire('ff1', 'n1', 'o1');
      a.connect('ff1', 'Q', 'ff2', 'CLK');
      a.connect('ff2', 'Q', 'n2', 'A');
      a.connect('n2', 'Y', 'ff2', 'D');
      a.connect('ff2', 'Q', 'o2', 'A');
      a.connect('ff2', 'Q', 'ff3', 'CLK');
      a.connect('ff3', 'Q', 'n3', 'A');
      a.connect('n3', 'Y', 'ff3', 'D');
      a.connect('ff3', 'Q', 'o3', 'A');
    });
    await sleep(400);
    await t.shot('wired');
    await t.page.click('#run');
    await sleep(900);
    await t.shot('running');
    await sleep(700);
    await t.shot('running-later');
  } catch (e) {
    await t.shot('showcase-fallback');
  }
}

