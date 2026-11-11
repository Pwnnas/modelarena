export const meta = {
  title: 'Octet',
  subtitle: 'CHIP-8 virtual console',
  order: 3,
  skills: ['emulation', 'bit-level exactness', 'spec conformance', 'real-time input'],
  summary:
    'A fully specified CHIP-8 interpreter (exact flag/quirk semantics), a deterministic step API, 60 Hz timers, a clickable hex keypad, built-in games and persistence.',
  judging: [
    'Does it look and feel like a real little console: bezel, CRT glow, scanlines, tactile keys?',
    'Are the built-in games actually playable and fun, with a satisfying beeper?',
    'Is the debugger (registers, disassembly) clear and alive while stepping?',
  ],
};

const FONT = [
  0xf0, 0x90, 0x90, 0x90, 0xf0, 0x20, 0x60, 0x20, 0x20, 0x70, 0xf0, 0x10, 0xf0, 0x80, 0xf0, 0xf0, 0x10, 0xf0, 0x10, 0xf0,
  0x90, 0x90, 0xf0, 0x10, 0x10, 0xf0, 0x80, 0xf0, 0x10, 0xf0, 0xf0, 0x80, 0xf0, 0x90, 0xf0, 0xf0, 0x10, 0x20, 0x40, 0x40,
  0xf0, 0x90, 0xf0, 0x90, 0xf0, 0xf0, 0x90, 0xf0, 0x10, 0xf0, 0xf0, 0x90, 0xf0, 0x90, 0x90, 0xe0, 0x90, 0xe0, 0x90, 0xe0,
  0xf0, 0x80, 0x80, 0x80, 0xf0, 0xe0, 0x90, 0x90, 0x90, 0xe0, 0xf0, 0x80, 0xf0, 0x80, 0xf0, 0xf0, 0x80, 0xf0, 0x80, 0x80,
];

// ---- helpers ---------------------------------------------------------------

const A = (...words) => words.flatMap((w) => [(w >> 8) & 255, w & 255]);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const load = (t, bytes) => t.eval((b) => window.__arena.load(b), bytes);
const step = (t, n = 1) => t.eval((n) => window.__arena.step(n), n);
const press = (t, k) => t.eval((k) => window.__arena.press(k), k);
const release = (t, k) => t.eval((k) => window.__arena.release(k), k);

const state = (t) =>
  t.eval(() => {
    const s = window.__arena.state();
    return {
      v: [...s.v], i: s.i, pc: s.pc, sp: s.sp, stack: [...s.stack],
      delay: s.delay, sound: s.sound, halted: !!s.halted, waitingKey: !!s.waitingKey,
    };
  });
const memory = (t) => t.eval(() => [...window.__arena.memory()]);
const display = (t) => t.eval(() => [...window.__arena.display()]);
const keysDown = (t) => t.eval(() => window.__arena.keysDown());

const blank = () => new Array(2048).fill(0);
const lit = (d) => d.reduce((a, b) => a + b, 0);
function stamp(d, x0, y0, rows) {
  const out = d.slice();
  rows.forEach((b, r) => {
    for (let c = 0; c < 8; c++) {
      if (!(b & (0x80 >> c))) continue;
      const x = x0 + c, y = y0 + r;
      if (x < 64 && y < 32) out[y * 64 + x] ^= 1;
    }
  });
  return out;
}
async function expectDisplay(t, expected) {
  const d = await display(t);
  if (same(d, expected)) return { ok: true };
  const i = d.findIndex((v, j) => v !== expected[j]);
  return t.ok(false, `first mismatch at pixel ${i} (x=${i % 64}, y=${(i / 64) | 0})`);
}
async function runProg(t, words, steps = words.length) {
  await load(t, A(...words));
  await step(t, steps);
  return state(t);
}

// ---- checks (91 pts; harness adds loads/console/network) --------------------

export const checks = [
  {
    id: 'boot',
    title: 'Console structure (screen, keypad, controls, ROMs, API)',
    points: 5,
    async run(t) {
      await t.part('#display canvas is visible', () => t.visible('canvas#display'));
      await t.part('16 keypad buttons labelled 0-9 A-F', async () => {
        const ks = await t.eval(() => [...document.querySelectorAll('button[data-key]')].map((b) => b.dataset.key));
        return t.ok(same(ks.slice().sort(), [...'0123456789ABCDEF']), `found: ${ks.join(',')}`);
      });
      await t.part('transport and option controls exist', () =>
        t.eval(() =>
          ['#play', '#step', '#reset', '#mute'].every((s) => document.querySelector(s)) &&
          !!document.querySelector('input#speed') && !!document.querySelector('select#rom'),
        ),
      );
      await t.part('#rom offers at least two built-in ROMs', async () => {
        const n = await t.eval(() => document.querySelectorAll('#rom option').length);
        return t.ok(n >= 2, `${n} option(s)`);
      });
      await t.part('window.__arena API complete', () =>
        t.eval(() => {
          const a = window.__arena;
          return !!a && ['load', 'reset', 'step', 'play', 'pause', 'running', 'state', 'memory', 'display', 'press', 'release', 'keysDown']
            .every((f) => typeof a[f] === 'function');
        }),
      );
    },
  },
  {
    id: 'machine-state',
    title: 'Load, initial state and reset',
    points: 5,
    async run(t) {
      await load(t, A(0x6001, 0x6102, 0x6203));
      await t.part('program bytes land at 0x200', async () => {
        const m = await memory(t);
        return t.ok(same(m.slice(0x200, 0x206), [0x60, 0x01, 0x61, 0x02, 0x62, 0x03]), JSON.stringify(m.slice(0x200, 0x206)));
      });
      await t.part('font (16 × 5 bytes) at 0x050', async () => {
        const f = (await memory(t)).slice(0x50, 0xa0);
        return t.ok(same(f, FONT), `starts: ${f.slice(0, 5).map((b) => b.toString(16)).join(' ')}`);
      });
      await t.part('registers, PC, SP, timers start at zero', async () => {
        const s = await state(t);
        return t.ok(
          s.pc === 0x200 && s.i === 0 && s.sp === 0 && s.delay === 0 && s.sound === 0 && s.v.every((x) => x === 0) && !s.halted && !s.waitingKey,
          JSON.stringify({ pc: s.pc, i: s.i, sp: s.sp }),
        );
      });
      await t.part('display starts blank', async () => t.ok(lit(await display(t)) === 0, `${lit(await display(t))} lit`));
      await t.part('reset() reloads and clears', async () => {
        await step(t, 3);
        await t.eval(() => window.__arena.reset());
        const s = await state(t);
        const m = await memory(t);
        return t.ok(s.pc === 0x200 && s.v.every((x) => x === 0) && m[0x200] === 0x60, `pc=${s.pc.toString(16)}`);
      });
    },
  },
  {
    id: 'arithmetic',
    title: 'Core opcodes: loads, math and logic',
    points: 10,
    async run(t) {
      let s = await runProg(t, [0x6005, 0x61ff, 0x6f2a]);
      await t.part('6XNN loads immediates', () => t.ok(s.v[0] === 5 && s.v[1] === 255 && s.v[15] === 42 && s.pc === 0x206, `v0=${s.v[0]} v1=${s.v[1]} vF=${s.v[15]} pc=${s.pc.toString(16)}`));
      s = await runProg(t, [0x60ff, 0x7002]);
      await t.part('7XNN adds and wraps (255+2 → 1)', () => t.ok(s.v[0] === 1, `v0=${s.v[0]}`));
      s = await runProg(t, [0x60ff, 0x6101, 0x8014, 0x6205, 0x72ff]);
      await t.part('7XNN leaves VF alone', () => t.ok(s.v[2] === 4 && s.v[15] === 1, `v2=${s.v[2]} vF=${s.v[15]}`));
      s = await runProg(t, [0x612a, 0x8010]);
      await t.part('8XY0 copies VY into VX', () => t.ok(s.v[0] === 42 && s.v[1] === 42, `v0=${s.v[0]}`));
      s = await runProg(t, [0x60f0, 0x610f, 0x8011]);
      await t.part('8XY1 OR', () => t.ok(s.v[0] === 0xff, `v0=${s.v[0]}`));
      s = await runProg(t, [0x60f0, 0x613c, 0x8012]);
      await t.part('8XY2 AND', () => t.ok(s.v[0] === 0x30, `v0=${s.v[0]}`));
      s = await runProg(t, [0x60ff, 0x610f, 0x8013]);
      await t.part('8XY3 XOR', () => t.ok(s.v[0] === 0xf0, `v0=${s.v[0]}`));
      s = await runProg(t, [0x60ff, 0x6102, 0x8014]);
      await t.part('8XY4 add with carry', () => t.ok(s.v[0] === 1 && s.v[15] === 1, `v0=${s.v[0]} vF=${s.v[15]}`));
      s = await runProg(t, [0x6001, 0x6102, 0x8014]);
      await t.part('8XY4 clears VF without carry', () => t.ok(s.v[0] === 3 && s.v[15] === 0, `v0=${s.v[0]} vF=${s.v[15]}`));
      s = await runProg(t, [0x6005, 0x6103, 0x8015]);
      await t.part('8XY5 subtract, no borrow', () => t.ok(s.v[0] === 2 && s.v[15] === 1, `v0=${s.v[0]} vF=${s.v[15]}`));
      s = await runProg(t, [0x6003, 0x6105, 0x8015]);
      await t.part('8XY5 subtract with borrow', () => t.ok(s.v[0] === 0xfe && s.v[15] === 0, `v0=${s.v[0]} vF=${s.v[15]}`));
      s = await runProg(t, [0x6003, 0x6105, 0x8017]);
      await t.part('8XY7 VY−VX, no borrow', () => t.ok(s.v[0] === 2 && s.v[15] === 1, `v0=${s.v[0]} vF=${s.v[15]}`));
      s = await runProg(t, [0xa2bc]);
      await t.part('ANNN sets I', () => t.ok(s.i === 0x2bc, `i=${s.i.toString(16)}`));
      s = await runProg(t, [0x1206, 0x6001, 0x6002, 0x6109], 2);
      await t.part('1NNN jumps', () => t.ok(s.v[0] === 0 && s.v[1] === 9 && s.pc === 0x208, `v0=${s.v[0]} v1=${s.v[1]} pc=${s.pc.toString(16)}`));
    },
  },
  {
    id: 'flags',
    title: 'Flag edge cases (borrow, carry, VF rules)',
    points: 5,
    async run(t) {
      let s = await runProg(t, [0x60ff, 0x6101, 0x8014, 0x62f0, 0x630f, 0x8231]);
      await t.part('logic ops reset VF to 0', () => t.ok(s.v[2] === 0xff && s.v[15] === 0, `v2=${s.v[2]} vF=${s.v[15]}`));
      s = await runProg(t, [0x6007, 0x6107, 0x8015]);
      await t.part('8XY5 equal operands → 0, VF=1', () => t.ok(s.v[0] === 0 && s.v[15] === 1, `v0=${s.v[0]} vF=${s.v[15]}`));
      s = await runProg(t, [0x6007, 0x6107, 0x8017]);
      await t.part('8XY7 equal operands → 0, VF=1', () => t.ok(s.v[0] === 0 && s.v[15] === 1, `v0=${s.v[0]} vF=${s.v[15]}`));
      s = await runProg(t, [0x6000, 0x6101, 0x8015]);
      await t.part('8XY5: 0−1 wraps to 255, VF=0', () => t.ok(s.v[0] === 255 && s.v[15] === 0, `v0=${s.v[0]} vF=${s.v[15]}`));
      s = await runProg(t, [0x60ff, 0x61ff, 0x8014]);
      await t.part('8XY4: 255+255 → 254, VF=1', () => t.ok(s.v[0] === 254 && s.v[15] === 1, `v0=${s.v[0]} vF=${s.v[15]}`));
      s = await runProg(t, [0x60ff, 0x6101, 0x8014, 0xa300, 0x6205, 0xf21e]);
      await t.part('FX1E adds to I and keeps VF', () => t.ok(s.i === 0x305 && s.v[15] === 1, `i=${s.i.toString(16)} vF=${s.v[15]}`));
    },
  },
  {
    id: 'shifts',
    title: 'Shift semantics (VY is the source)',
    points: 4,
    async run(t) {
      let s = await runProg(t, [0x6300, 0x6409, 0x8346]);
      await t.part('8XY6 stores VY>>1 in VX, VF = out-bit', () => t.ok(s.v[3] === 4 && s.v[15] === 1, `v3=${s.v[3]} vF=${s.v[15]}`));
      await t.part('8XY6 leaves VY unchanged', () => t.ok(s.v[4] === 9, `v4=${s.v[4]}`));
      s = await runProg(t, [0x6300, 0x6481, 0x834e]);
      await t.part('8XYE stores VY<<1 in VX, VF = MSB', () => t.ok(s.v[3] === 0x02 && s.v[15] === 1, `v3=${s.v[3]} vF=${s.v[15]}`));
      s = await runProg(t, [0x6300, 0x6441, 0x834e]);
      await t.part('8XYE without MSB → VF=0, VY intact', () => t.ok(s.v[3] === 0x82 && s.v[15] === 0 && s.v[4] === 0x41, `v3=${s.v[3]} vF=${s.v[15]} v4=${s.v[4]}`));
    },
  },
  {
    id: 'control-flow',
    title: 'Calls, stack and skip instructions',
    points: 6,
    async run(t) {
      await load(t, A(0x2208, 0x6101, 0x1204, 0x0000, 0x220e, 0x00ee, 0x0000, 0x6207, 0x00ee));
      await step(t, 3);
      let s = await state(t);
      await t.part('nested calls push return addresses', () =>
        t.ok(s.sp === 2 && s.stack[0] === 0x202 && s.stack[1] === 0x20a && s.pc === 0x210, `sp=${s.sp} stack=[${s.stack.slice(0, 2).map((x) => x.toString(16))}] pc=${s.pc.toString(16)}`),
      );
      await step(t, 3);
      s = await state(t);
      await t.part('returns pop the stack correctly', () =>
        t.ok(s.v[1] === 1 && s.v[2] === 7 && s.sp === 0 && s.pc === 0x204, `v1=${s.v[1]} v2=${s.v[2]} sp=${s.sp} pc=${s.pc.toString(16)}`),
      );
      s = await runProg(t, [0x6004, 0xb206, 0x6101, 0x6102, 0x6103, 0x6209], 3);
      await t.part('BNNN jumps to NNN + V0', () => t.ok(s.v[1] === 0 && s.v[2] === 9 && s.pc === 0x20c, `v1=${s.v[1]} v2=${s.v[2]} pc=${s.pc.toString(16)}`));
      await load(t, A(
        0x6005, 0x6105, 0x6209, 0x6a00, 0x6b00, 0x6c00, 0x6d00, 0x6e00, 0x6f00,
        0x3005, 0x6a01, 0x3004, 0x6b01, 0x4004, 0x6c01, 0x4005, 0x6d01, 0x5010, 0x6e01, 0x9010, 0x6f01, 0x122a,
      ));
      await step(t, 25);
      s = await state(t);
      await t.part('3XNN skips when equal only', () => t.ok(s.v[10] === 0 && s.v[11] === 1, `vA=${s.v[10]} vB=${s.v[11]}`));
      await t.part('4XNN skips when different only', () => t.ok(s.v[12] === 0 && s.v[13] === 1, `vC=${s.v[12]} vD=${s.v[13]}`));
      await t.part('5XY0 / 9XY0 compare registers', () => t.ok(s.v[14] === 0 && s.v[15] === 1, `vE=${s.v[14]} vF=${s.v[15]}`));
    },
  },
  {
    id: 'timers',
    title: 'Delay / sound timers (frozen while stepping, 60 Hz live)',
    points: 6,
    async run(t) {
      await load(t, A(0x6a3c, 0xfa15, 0x6b07, 0xfb18, 0xf507, 0x120a));
      await step(t, 5);
      let s = await state(t);
      await t.part('FX15 sets the delay timer', () => t.ok(s.delay === 60, `delay=${s.delay}`));
      await t.part('FX18 sets the sound timer', () => t.ok(s.sound === 7, `sound=${s.sound}`));
      await t.part('FX07 reads the delay timer', () => t.ok(s.v[5] === 60, `v5=${s.v[5]}`));
      await step(t, 20);
      s = await state(t);
      await t.part('step() never ticks the timers', () => t.ok(s.delay === 60 && s.sound === 7, `delay=${s.delay} sound=${s.sound}`));
      await t.part('timers decay at 60 Hz while running', async () => {
        await load(t, A(0x6a06, 0xfa15, 0x1204));
        await step(t, 2);
        await t.eval(() => window.__arena.play());
        const t0 = Date.now();
        const hit = await t.poll(async () => ((await state(t)).delay === 0 ? true : null), { timeout: 2000 });
        await t.eval(() => window.__arena.pause());
        if (!hit) return t.ok(false, 'delay never reached 0');
        const ms = Date.now() - t0;
        const score = ms >= 50 && ms <= 260 ? 1 : ms <= 600 ? 0.5 : 0.2;
        return { score, note: `${ms} ms for 6 ticks (ideal ≈ 100 ms)` };
      }, 2);
      await t.part('pause() stops the timers', async () => {
        await load(t, A(0x6a1e, 0xfa15, 0x1204));
        await step(t, 2);
        await t.eval(() => window.__arena.play());
        await t.sleep(150);
        await t.eval(() => window.__arena.pause());
        const d1 = (await state(t)).delay;
        await t.sleep(200);
        const d2 = (await state(t)).delay;
        return t.ok(d1 === d2 && d1 < 30, `delay ${d1} → ${d2}`);
      });
    },
  },
  {
    id: 'drawing',
    title: 'Sprite drawing, XOR collision and clipping',
    points: 12,
    async run(t) {
      await load(t, A(0x600a, 0xf029, 0x6100, 0x6200, 0xd125, 0x120a));
      await step(t, 5);
      let s = await state(t);
      await t.part('FX29 points I at the font glyph', () => t.ok(s.i === 0x82, `i=${s.i.toString(16)}`));
      await t.part('glyph pixels are exact', () => expectDisplay(t, stamp(blank(), 0, 0, [0xf0, 0x90, 0xf0, 0x90, 0x90])));
      await t.part('VF=0 when nothing was erased', () => t.ok(s.v[15] === 0, `vF=${s.v[15]}`));

      await load(t, [...A(0xa20c, 0x610a, 0x6205, 0xd128, 0xd128, 0x120a), ...new Array(8).fill(0xff)]);
      await step(t, 4);
      await t.part('8×8 sprite lands at (10, 5)', () => expectDisplay(t, stamp(blank(), 10, 5, new Array(8).fill(0xff))));
      await step(t, 1);
      s = await state(t);
      await t.part('drawing again XOR-erases it', async () => t.ok(lit(await display(t)) === 0, `${lit(await display(t))} lit`));
      await t.part('VF=1 reports the collision', () => t.ok(s.v[15] === 1, `vF=${s.v[15]}`));

      await load(t, [...A(0xa20a, 0x613c, 0x621c, 0xd128, 0x1208), ...new Array(8).fill(0xff)]);
      await step(t, 4);
      await t.part('sprites clip at the edges (no wrap)', async () => {
        const exp = blank();
        for (let y = 28; y < 32; y++) for (let x = 60; x < 64; x++) exp[y * 64 + x] = 1;
        const d = await display(t);
        if (same(d, exp)) return { ok: true };
        return t.ok(false, d[28 * 64] === 1 || d[60] === 1 ? 'pixels wrapped around' : 'wrong pattern');
      });

      await load(t, [...A(0xa20a, 0x6142, 0x6221, 0xd121, 0x1208), 0xc0]);
      await step(t, 4);
      await t.part('coordinates are taken mod 64 / 32', () => expectDisplay(t, stamp(blank(), 2, 1, [0xc0])));

      await load(t, [...A(0xa20a, 0x6100, 0x6200, 0xd121, 0x1208), 0x81]);
      await step(t, 4);
      await t.part('bit 7 is the leftmost pixel', () => expectDisplay(t, stamp(blank(), 0, 0, [0x81])));

      await load(t, [...A(0xa20c, 0x610a, 0x6205, 0xd128, 0x00e0, 0x120a), ...new Array(8).fill(0xff)]);
      await step(t, 5);
      await t.part('00E0 clears the screen', async () => t.ok(lit(await display(t)) === 0, `${lit(await display(t))} lit`));

      await load(t, [...A(0xa20a, 0x6100, 0x6200, 0xd120, 0x1208), ...new Array(16).fill(0xf0)]);
      await step(t, 4);
      await t.part('DXYN with n=0 draws 16 rows', () => expectDisplay(t, stamp(blank(), 0, 0, new Array(16).fill(0xf0))));
      await t.part('clean draw resets VF to 0', async () => t.ok((await state(t)).v[15] === 0, `vF=${(await state(t)).v[15]}`));
    },
  },
  {
    id: 'memory-ops',
    title: 'BCD, register save/load and the I-increment quirk',
    points: 8,
    async run(t) {
      await t.part('FX33 stores BCD (255 → 2,5,5 / 8 → 0,0,8)', async () => {
        await load(t, A(0x60ff, 0xa300, 0xf033));
        await step(t, 3);
        let m = await memory(t);
        if (!same(m.slice(0x300, 0x303), [2, 5, 5])) return t.ok(false, `255 → ${m.slice(0x300, 0x303)}`);
        await load(t, A(0x6008, 0xa300, 0xf033));
        await step(t, 3);
        m = await memory(t);
        return t.ok(same(m.slice(0x300, 0x303), [0, 0, 8]), `8 → ${m.slice(0x300, 0x303)}`);
      });
      await load(t, A(0x6009, 0x6108, 0x6207, 0x6306, 0xa350, 0xf355));
      await step(t, 6);
      let s = await state(t);
      await t.part('FX55 stores V0..VX at I', async () => {
        const m = await memory(t);
        return t.ok(same(m.slice(0x350, 0x354), [9, 8, 7, 6]), JSON.stringify(m.slice(0x350, 0x354)));
      });
      await t.part('FX55 then advances I by X+1 (VIP quirk)', () => t.ok(s.i === 0x354, `i=${s.i.toString(16)}`));
      await load(t, A(0x6009, 0x6108, 0x6207, 0x6306, 0xa350, 0xf355, 0x6000, 0x6100, 0x6200, 0x6300, 0xa350, 0xf365, 0x1218));
      await step(t, 12);
      s = await state(t);
      await t.part('FX65 loads V0..VX back', () => t.ok(same(s.v.slice(0, 4), [9, 8, 7, 6]), JSON.stringify(s.v.slice(0, 4))));
      await t.part('FX65 also advances I by X+1', () => t.ok(s.i === 0x354, `i=${s.i.toString(16)}`));
      s = await runProg(t, [0xa300, 0x6005, 0xf01e]);
      await t.part('FX1E adds VX to I', () => t.ok(s.i === 0x305, `i=${s.i.toString(16)}`));
      await t.part('FX29 computes font addresses (F → 0x9B, 0 → 0x50)', async () => {
        await load(t, A(0x600f, 0xf029));
        await step(t, 2);
        if ((await state(t)).i !== 0x9b) return t.ok(false, `F → i=${(await state(t)).i.toString(16)}`);
        await load(t, A(0x6000, 0xf029));
        await step(t, 2);
        return t.ok((await state(t)).i === 0x50, `0 → i=${(await state(t)).i.toString(16)}`);
      });
      await t.part('FX55 with X=0 stores only V0, I += 1', async () => {
        await load(t, A(0x602a, 0xa360, 0xf055));
        await step(t, 3);
        const m = await memory(t);
        const s2 = await state(t);
        return t.ok(m[0x360] === 42 && s2.i === 0x361, `mem=${m[0x360]} i=${s2.i.toString(16)}`);
      });
    },
  },
  {
    id: 'input',
    title: 'Hex keypad and FX0A key-wait semantics',
    points: 8,
    async run(t) {
      await t.part('press()/release() drive keysDown()', async () => {
        await press(t, 10);
        await press(t, 3);
        const a = await keysDown(t);
        await release(t, 10);
        const b = await keysDown(t);
        await release(t, 3);
        const c = await keysDown(t);
        return t.ok(same(a, [3, 10]) && same(b, [3]) && same(c, []), JSON.stringify({ a, b, c }));
      });
      const skip9E = [0x6005, 0xe09e, 0x6101, 0x6102, 0x1208];
      await t.part('EX9E skips only while the key is down', async () => {
        await press(t, 5);
        await load(t, A(...skip9E));
        await step(t, 3);
        let s = await state(t);
        await release(t, 5);
        if (s.v[1] !== 2) return t.ok(false, `key down → v1=${s.v[1]} (want 2)`);
        await load(t, A(...skip9E));
        await step(t, 3);
        s = await state(t);
        return t.ok(s.v[1] === 1, `key up → v1=${s.v[1]} (want 1)`);
      });
      const skipA1 = [0x6005, 0xe0a1, 0x6101, 0x6102, 0x1208];
      await t.part('EXA1 skips only while the key is up', async () => {
        await load(t, A(...skipA1));
        await step(t, 3);
        let s = await state(t);
        if (s.v[1] !== 2) return t.ok(false, `key up → v1=${s.v[1]} (want 2)`);
        await press(t, 5);
        await load(t, A(...skipA1));
        await step(t, 3);
        s = await state(t);
        await release(t, 5);
        return t.ok(s.v[1] === 1, `key down → v1=${s.v[1]} (want 1)`);
      });
      const wait = [0xf00a, 0x6101, 0x1204];
      await t.part('FX0A takes an already-held key immediately', async () => {
        await press(t, 9);
        await load(t, A(...wait));
        await step(t, 1);
        const s = await state(t);
        await release(t, 9);
        return t.ok(s.v[0] === 9 && s.pc === 0x202 && !s.waitingKey, `v0=${s.v[0]} pc=${s.pc.toString(16)} waiting=${s.waitingKey}`);
      });
      await load(t, A(...wait));
      await step(t, 3);
      let s = await state(t);
      await t.part('FX0A blocks with PC frozen when no key is down', () =>
        t.ok(s.waitingKey && s.pc === 0x200 && !s.halted, `pc=${s.pc.toString(16)} waiting=${s.waitingKey}`),
      );
      await press(t, 12);
      await release(t, 12);
      s = await state(t);
      await t.part('the next key press completes the wait', () =>
        t.ok(s.v[0] === 12 && s.pc === 0x202 && !s.waitingKey, `v0=${s.v[0]} pc=${s.pc.toString(16)} waiting=${s.waitingKey}`),
      );
      await step(t, 1);
      s = await state(t);
      await t.part('execution resumes after the wait', () => t.ok(s.v[1] === 1 && s.pc === 0x204, `v1=${s.v[1]} pc=${s.pc.toString(16)}`));
      await t.part('physical keyboard maps to the hex keypad', async () => {
        await t.page.keyboard.down('1');
        const a = await keysDown(t);
        await t.page.keyboard.up('1');
        await t.page.keyboard.down('v');
        const b = await keysDown(t);
        await t.page.keyboard.up('v');
        return t.ok(a.includes(1) && b.includes(15), `1→${JSON.stringify(a)} v→${JSON.stringify(b)}`);
      });
      await t.part('on-screen buttons hold like real keys', async () => {
        const btn = await t.page.$('[data-key="7"]');
        await btn.scrollIntoViewIfNeeded();
        const box = await btn.boundingBox();
        await t.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await t.page.mouse.down();
        const down = await keysDown(t);
        const aria = await t.eval(() => document.querySelector('[data-key="7"]').getAttribute('aria-pressed'));
        await t.page.mouse.up();
        const up = await keysDown(t);
        return t.ok(down.includes(7) && !up.includes(7) && aria === 'true', `down=${JSON.stringify(down)} aria=${aria}`);
      });
    },
  },
  {
    id: 'rnd',
    title: 'CXNN randomness honours its mask',
    points: 3,
    async run(t) {
      await load(t, A(0xc20f, 0xc3ff, 0xc400, 0x1200));
      const v2 = [], v3 = [], v4 = [];
      for (let i = 0; i < 40; i++) {
        await step(t, 4);
        const s = await state(t);
        v2.push(s.v[2]); v3.push(s.v[3]); v4.push(s.v[4]);
      }
      await t.part('result never exceeds the mask', () => t.ok(v2.every((x) => x <= 15), `samples: ${v2.slice(0, 8)}`));
      await t.part('mask 0 always yields 0', () => t.ok(v4.every((x) => x === 0), `samples: ${v4.slice(0, 8)}`));
      await t.part('values actually vary', () => {
        const distinct = new Set(v3).size;
        const score = distinct >= 12 ? 1 : distinct >= 6 ? 0.5 : 0;
        return { score, note: `${distinct} distinct values in 40 draws` };
      });
    },
  },
  {
    id: 'robustness',
    title: 'Halting, NOPs and deep stacks',
    points: 4,
    async run(t) {
      await t.part('invalid opcode halts cleanly (no throw, PC frozen)', async () => {
        await load(t, A(0x6001, 0xf0ff, 0x6101));
        await step(t, 6);
        const s = await state(t);
        return t.ok(s.halted && s.pc === 0x202 && s.v[1] === 0, `halted=${s.halted} pc=${s.pc.toString(16)} v1=${s.v[1]}`);
      });
      await t.part('0NNN is a NOP', async () => {
        const s = await runProg(t, [0x0123, 0x6101, 0x1204], 2);
        return t.ok(s.v[1] === 1 && !s.halted, `v1=${s.v[1]} halted=${s.halted}`);
      });
      await t.part('16 nested calls fit the stack', async () => {
        const words = [];
        for (let i = 0; i < 16; i++) words.push(0x2200 | (0x202 + 2 * i));
        words.push(0x1220);
        await load(t, A(...words));
        await step(t, 16);
        const s = await state(t);
        return t.ok(s.sp === 16 && s.pc === 0x220 && !s.halted, `sp=${s.sp} pc=${s.pc.toString(16)}`);
      });
      await t.part('load() while running resets to a clean paused state', async () => {
        await load(t, A(0x1200));
        await t.eval(() => window.__arena.play());
        await t.sleep(80);
        await load(t, A(0x6101, 0x1202));
        const s = await state(t);
        const running = await t.eval(() => window.__arena.running());
        return t.ok(!running && s.pc === 0x200 && s.delay === 0 && s.v.every((x) => x === 0), `running=${running} pc=${s.pc.toString(16)}`);
      });
    },
  },
  {
    id: 'performance',
    title: 'Interpreter throughput (2M instructions)',
    points: 6,
    timeout: 60000,
    async run(t) {
      await load(t, A(0x7101, 0x1200));
      const r = await t.eval(() => {
        const t0 = performance.now();
        window.__arena.step(2000000);
        return { ms: performance.now() - t0, v1: window.__arena.state().v[1] };
      });
      await t.part('still correct after 2,000,000 instructions', () =>
        t.ok(r.v1 === 64, `v1=${r.v1} (1,000,000 increments mod 256 = 64)`), 1);
      await t.part('throughput', () => {
        const ms = r.ms;
        const score = ms <= 400 ? 1 : ms <= 900 ? 0.6 : ms <= 2000 ? 0.3 : 0.1;
        return { score, note: `${ms.toFixed(0)} ms for 2M instructions (${(2000 / ms).toFixed(1)} MIPS)` };
      }, 2);
    },
  },
  {
    id: 'determinism',
    title: 'Bit-exact determinism across reset and reload',
    points: 3,
    async run(t) {
      const prog = [...A(0xa210, 0x6013, 0x6127, 0x8014, 0x620a, 0x6305, 0xd235, 0x120e), 0xf0, 0x90, 0xf0, 0x90, 0xf0];
      const snap = async () => {
        await load(t, prog);
        await step(t, 7);
        const s = await state(t);
        return JSON.stringify({ v: s.v, i: s.i, pc: s.pc, d: await display(t) });
      };
      const first = await snap();
      await t.part('reset runs identically', async () => t.ok((await snap()) === first, 'state diverged after re-load'), 1);
      await t.part('page reload runs identically', async () => {
        await t.reload();
        await t.poll(() => t.eval(() => !!window.__arena), { timeout: 5000 });
        return t.ok((await snap()) === first, 'state diverged after reload');
      }, 2);
    },
  },
  {
    id: 'integration',
    title: 'Playing real ROMs, transport buttons and persistence',
    points: 6,
    async run(t) {
      const opts = await t.eval(() => [...document.querySelectorAll('#rom option')].map((o) => o.value));
      await t.part('built-in ROM boots into a non-blank screen', async () => {
        await t.page.selectOption('#rom', opts[0]);
        await t.eval(() => window.__arena.play());
        await t.sleep(1500);
        await t.eval(() => window.__arena.pause());
        const n = lit(await display(t));
        return t.ok(n >= 20, `${n} pixels lit`);
      });
      await t.part('switching ROMs resets the machine', async () => {
        await t.page.selectOption('#rom', opts[1 % opts.length]);
        const s = await state(t);
        const d = lit(await display(t));
        const running = await t.eval(() => window.__arena.running());
        if (!(s.pc === 0x200 && d === 0 && !running)) return t.ok(false, `pc=${s.pc.toString(16)} lit=${d} running=${running}`);
        await t.eval(() => window.__arena.play());
        await t.sleep(1500);
        await t.eval(() => window.__arena.pause());
        const n = lit(await display(t));
        return t.ok(n >= 20, `${n} pixels lit after 1.5 s of play`);
      });
      await t.part('#play toggles, Space toggles', async () => {
        await t.page.click('#play');
        const r1 = await t.eval(() => window.__arena.running());
        await t.blur();
        await t.page.keyboard.press('Space');
        const r2 = await t.eval(() => window.__arena.running());
        await t.eval(() => window.__arena.pause());
        return t.ok(r1 === true && r2 === false, `after click: ${r1}, after space: ${r2}`);
      });
      await t.part('#step executes instructions while paused', async () => {
        let moved = false;
        for (let i = 0; i < 5 && !moved; i++) {
          const before = JSON.stringify(await state(t));
          await t.page.click('#step');
          if (JSON.stringify(await state(t)) !== before) moved = true;
        }
        return t.ok(moved, 'state never changed after 5 steps');
      });
      await t.part('#reset button resets', async () => {
        await step(t, 10);
        await t.page.click('#reset');
        const s = await state(t);
        return t.ok(s.pc === 0x200 && s.sp === 0, `pc=${s.pc.toString(16)}`);
      });
      await t.part('ROM choice persists across reload', async () => {
        const cur = await t.eval(() => document.querySelector('#rom').value);
        const pick = opts.find((o) => o !== cur) ?? opts[opts.length - 1];
        await t.page.selectOption('#rom', pick);
        await t.sleep(300);
        await t.reload();
        await t.poll(() => t.eval(() => !!window.__arena), { timeout: 5000 });
        const v = await t.eval(() => document.querySelector('#rom').value);
        return t.ok(v === pick, `after reload: "${v}", expected "${pick}"`);
      });
    },
  },
];

export async function showcase(t) {
  await t.sleep(400);
  await t.shot('boot');
  const opts = await t.eval(() => [...document.querySelectorAll('#rom option')].map((o) => o.value));
  if (opts.length > 1) await t.page.selectOption('#rom', opts[opts.length - 1]);
  await t.sleep(300);
  await t.page.click('#play');
  await t.sleep(2500);
  for (const k of ['4', '5', '6', '5']) {
    const btn = await t.page.$(`[data-key="${k}"]`);
    if (btn) {
      const b = await btn.boundingBox();
      await t.page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await t.page.mouse.down();
      await t.sleep(220);
      await t.page.mouse.up();
    }
    await t.sleep(160);
  }
  await t.sleep(1200);
  await t.shot('gameplay');
  await t.page.keyboard.press('Space');
  await t.sleep(300);
  for (let i = 0; i < 3; i++) await t.page.click('#step');
  await t.shot('paused-stepping');
  await t.page.click('#play');
  await t.sleep(1500);
  await t.shot('resumed');
}
