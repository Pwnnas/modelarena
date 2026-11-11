export const meta = {
  title: 'Enigma',
  subtitle: 'Enigma M3 simulator',
  order: 9,
  suite: 'v2',
  skills: ['exact simulation', 'state machines', 'the double-step anomaly', 'ring settings'],
  summary:
    'A faithful three-rotor Enigma I/M3: rotor choice I–V, reflectors B/C, ring settings, plugboard and the historically correct double-stepping. Graded letter-for-letter against a reference implementation across configurations and long messages. Hard, subtle, and quick to grade — no rendering or timing involved.',
  judging: [
    'Does it feel like a machine: lamp glow, odometer-like rotor windows, key feedback?',
    'Is the configuration readable and the layout restrained rather than cosplay?',
    'Does typing feel immediate and alive?',
  ],
};

// ── Reference machine (verified against published vectors: AAAA→BDZGO and
//    the ADU→ADV→AEW→BFX→BFY double-step sequence) ─────────────────────────
const ROTORS = {
  I: { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q' },
  II: { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E' },
  III: { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V' },
  IV: { wiring: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notch: 'J' },
  V: { wiring: 'VZBRGITYUPSDNHLXAWMJQOFECK', notch: 'Z' },
};
const REFLECTORS = { B: 'YRUHQSLDPXNGOKMIEBFZCWVJAT', C: 'FVPJIAOYEDRZXWGCTKUQSBNMHL' };
const A = 'A'.charCodeAt(0);
const mod = (n) => ((n % 26) + 26) % 26;

function makeMachine({ rotors = ['I', 'II', 'III'], reflector = 'B', rings = [1, 1, 1], positions = 'AAA', plugboard = '' } = {}) {
  const wiring = rotors.map((r) => ROTORS[r].wiring);
  const inv = wiring.map((w) => { const i = Array(26); for (let k = 0; k < 26; k++) i[w.charCodeAt(k) - A] = k; return i; });
  const notch = rotors.map((r) => ROTORS[r].notch.charCodeAt(0) - A);
  const refl = REFLECTORS[reflector];
  const ring = rings.map((r) => r - 1);
  const plug = Array.from({ length: 26 }, (_, i) => i);
  for (const pair of plugboard.toUpperCase().split(/\s+/).filter(Boolean)) {
    const a = pair.charCodeAt(0) - A, b = pair.charCodeAt(1) - A;
    plug[a] = b; plug[b] = a;
  }
  const pos = [...positions.toUpperCase()].map((c) => c.charCodeAt(0) - A);
  const step = () => {
    if (pos[1] === notch[1]) { pos[0] = mod(pos[0] + 1); pos[1] = mod(pos[1] + 1); }
    else if (pos[2] === notch[2]) { pos[1] = mod(pos[1] + 1); }
    pos[2] = mod(pos[2] + 1);
  };
  const fwd = (i, c) => mod(wiring[i].charCodeAt(mod(c + pos[i] - ring[i])) - A - pos[i] + ring[i]);
  const bwd = (i, c) => mod(inv[i][mod(c + pos[i] - ring[i])] - pos[i] + ring[i]);
  const letter = (ch) => {
    step();
    let c = plug[ch.charCodeAt(0) - A];
    for (let i = 2; i >= 0; i--) c = fwd(i, c);
    c = refl.charCodeAt(c) - A;
    for (let i = 0; i < 3; i++) c = bwd(i, c);
    return String.fromCharCode(plug[c] + A);
  };
  return {
    encrypt(text) {
      let out = '';
      for (const ch of text.toUpperCase()) out += /[A-Z]/.test(ch) ? letter(ch) : ch;
      return out;
    },
    windows: () => pos.map((p) => String.fromCharCode(p + A)).join(''),
  };
}

// ── Page helpers ───────────────────────────────────────────────────────────
const setSelect = (t, sel, value) =>
  t.eval(({ sel, value }) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`${sel} not found`);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, { sel, value });

async function configure(t, { rotors = ['I', 'II', 'III'], reflector = 'B', rings = [1, 1, 1], positions = 'AAA', plugboard = '' } = {}) {
  await setSelect(t, '#rotor-left', rotors[0]);
  await setSelect(t, '#rotor-middle', rotors[1]);
  await setSelect(t, '#rotor-right', rotors[2]);
  await setSelect(t, '#reflector', reflector);
  await t.setInput('#ring-left', rings[0]);
  await t.setInput('#ring-middle', rings[1]);
  await t.setInput('#ring-right', rings[2]);
  await setSelect(t, '#pos-left', positions[0]);
  await setSelect(t, '#pos-middle', positions[1]);
  await setSelect(t, '#pos-right', positions[2]);
  await t.setInput('#plugboard', plugboard);
  await t.sleep(150);
}

const output = (t) => t.eval(() => document.querySelector('#machine-output')?.value ?? null);
const windows = (t) =>
  t.eval(() => ['left', 'middle', 'right'].map((s) => (document.querySelector(`[data-window="${s}"]`)?.textContent ?? '').trim()).join(''));
const litLamps = (t) =>
  t.eval(() => [...document.querySelectorAll('[data-lamp].lit')].map((el) => el.dataset.lamp));

async function typeMessage(t, text) {
  await t.setInput('#machine-input', text);
  await t.sleep(150);
  return output(t);
}

const LONG_1 = 'THECONVOYSAILSATDAWNWITHSUPPLIESFORTHEGARRISONANDMEDICALSTORESFORTHEFIELDHOSPITALSIXESCORTVESSELSWILLJOINTHEFORMATIONBEYONDTHEHEADLANDSIGNALSFREQUENCYCHANGESATEIGHTEENHUNDREDS';
const LONG_2 = 'WEATHEROVERCASTWITHRAINEXPECTEDBYMIDNIGHTVISIBILITYPOORONTHECOASTALROADSUPPLYTRUCKSDELAYEDUNTILTHESTORMPASSINGTHROUGHTHEVALLEYREPORTPOSITIONEVERYSIXHOURSANDCONSERVEFUEL';

export const checks = [
  {
    id: 'controls',
    title: 'Machine controls and initial state',
    points: 4,
    async run(t) {
      await t.part('rotor selects default to I, II, III', () => t.eval(() =>
        ['#rotor-left', '#rotor-middle', '#rotor-right'].map((s) => document.querySelector(s)?.value).join() === 'I,II,III'));
      await t.part('reflector B, rings 1, positions A', () => t.eval(() =>
        document.querySelector('#reflector')?.value === 'B' &&
        ['#ring-left', '#ring-middle', '#ring-right'].every((s) => Number(document.querySelector(s)?.value) === 1) &&
        ['#pos-left', '#pos-middle', '#pos-right'].every((s) => document.querySelector(s)?.value === 'A')));
      await t.part('26 lamps, none lit', async () => {
        const n = await t.count('[data-lamp]');
        return t.ok(n === 26 && (await litLamps(t)).length === 0, `${n} lamps`);
      });
      await t.part('windows show AAA; input, output, plugboard, reset exist', async () => t.ok(
        (await windows(t)) === 'AAA' &&
        (await t.eval(() => ['#machine-input', '#machine-output', '#plugboard', '#reset-btn'].every((s) => document.querySelector(s)))),
        `windows: ${await windows(t)}`,
      ));
    },
  },
  {
    id: 'known-answer',
    title: 'Known-answer encryption (default settings)',
    points: 10,
    async run(t) {
      await configure(t);
      const cases = [
        ['AAAAA', 2],
        ['HELLOWORLD', 3],
        ['THEQUICKBROWNFOXJUMPSOVERTHELAZYDOG', 3],
        ['Hello, World! 123', 2],
      ];
      for (const [msg, weight] of cases) {
        const want = makeMachine().encrypt(msg);
        const got = await typeMessage(t, msg);
        await t.part(`"${msg.slice(0, 24)}${msg.length > 24 ? '…' : ''}"`, () => t.ok(got === want, `got "${got}", want "${want}"`), weight);
      }
    },
  },
  {
    id: 'stepping',
    title: 'Rotor stepping and the double-step anomaly',
    points: 8,
    async run(t) {
      await configure(t, { positions: 'ADU' });
      await t.page.click('#machine-input');
      await t.page.keyboard.type('A');
      await t.sleep(200);
      await t.part('ADU → ADV (right steps)', async () => t.ok((await windows(t)) === 'ADV', `windows: ${await windows(t)}`), 2);
      const want = ['AEW', 'BFX', 'BFY'];
      for (let i = 0; i < 3; i++) {
        await t.setInput('#machine-input', 'A'.repeat(i + 2));
        await t.sleep(150);
        await t.part(`→ ${want[i]}${i === 1 ? ' (double step)' : ''}`, async () => t.ok((await windows(t)) === want[i], `windows: ${await windows(t)}`), 2);
      }
    },
  },
  {
    id: 'rings',
    title: 'Ring settings',
    points: 6,
    async run(t) {
      const cases = [
        [{ rings: [5, 1, 1], positions: 'AAA' }, 'ATTACKATDAWN'],
        [{ rings: [3, 7, 11], positions: 'QWE' }, 'MIDNIGHTSUPPLYDROP'],
      ];
      for (const [cfg, msg] of cases) {
        await configure(t, cfg);
        const want = makeMachine(cfg).encrypt(msg);
        const got = await typeMessage(t, msg);
        await t.part(`rings ${cfg.rings.join('-')} from ${cfg.positions}`, () => t.ok(got === want, `got "${got}", want "${want}"`), 3);
      }
    },
  },
  {
    id: 'plugboard',
    title: 'Plugboard',
    points: 6,
    async run(t) {
      const cases = [
        [{ plugboard: 'AB CD EF GH IJ KL', positions: 'AAA' }, 'CONVOYDEPARTSATELEVEN'],
        [{ plugboard: 'PO ML IU KJ NH YT', positions: 'VFX' }, 'RETREATNORTHWEST'],
      ];
      for (const [cfg, msg] of cases) {
        await configure(t, cfg);
        const want = makeMachine(cfg).encrypt(msg);
        const got = await typeMessage(t, msg);
        await t.part(`plugboard "${cfg.plugboard}"`, () => t.ok(got === want, `got "${got}", want "${want}"`), 3);
      }
    },
  },
  {
    id: 'rotor-variants',
    title: 'Rotor choices and reflector C',
    points: 6,
    async run(t) {
      const cases = [
        [{ rotors: ['IV', 'I', 'V'], reflector: 'C', positions: 'MERK' }, 'WEATHERREPORTCLEAR'],
        [{ rotors: ['II', 'V', 'III'], rings: [1, 2, 3], positions: 'ZAZ' }, 'SECONDTESTVECTOR'],
      ];
      for (const [cfg, msg] of cases) {
        await configure(t, cfg);
        const want = makeMachine(cfg).encrypt(msg);
        const got = await typeMessage(t, msg);
        await t.part(`rotors ${cfg.rotors.join('-')}, reflector ${cfg.reflector ?? 'B'}`, () => t.ok(got === want, `got "${got}", want "${want}"`), 3);
      }
    },
  },
  {
    id: 'long-message',
    title: 'Long messages across many turnovers',
    points: 8,
    async run(t) {
      await configure(t, { positions: 'KDO' });
      for (const [msg, label] of [[LONG_1, '176 letters'], [LONG_2, '164 letters']]) {
        const want = makeMachine({ positions: 'KDO' }).encrypt(msg);
        const got = (await typeMessage(t, msg)) ?? '';
        let hits = 0;
        for (let i = 0; i < want.length; i++) if (got[i] === want[i]) hits++;
        await t.part(`${label}, letter-for-letter`, () => ({
          score: hits / want.length,
          note: `${hits}/${want.length} letters match`,
        }), 4);
      }
    },
  },
  {
    id: 'reciprocal',
    title: 'Reciprocity and lamp behavior',
    points: 4,
    async run(t) {
      await configure(t);
      const msg = 'DEFENDTHEEASTWALL';
      const ct = (await typeMessage(t, msg)) ?? '';
      await t.part('no letter encrypts to itself', () => t.ok(ct.length === msg.length && [...msg].every((c, i) => c !== ct[i]), `ct: ${ct}`), 2);
      await t.part('last letter lamp is lit', async () => {
        const lit = await litLamps(t);
        return t.ok(lit.length === 1 && lit[0] === ct.at(-1), `lit: ${lit.join(',') || 'none'}, last: ${ct.at(-1)}`);
      });
      await t.page.click('#reset-btn');
      await t.sleep(200);
      const back = await typeMessage(t, ct);
      await t.part('same settings decrypt back to plaintext', () => t.ok(back === msg, `got "${back}"`), 2);
    },
  },
  {
    id: 'reset-behavior',
    title: 'Reset and configuration changes',
    points: 4,
    async run(t) {
      await configure(t);
      await typeMessage(t, 'HELLOWORLD');
      await t.page.click('#reset-btn');
      await t.sleep(200);
      await t.part('reset clears input/output, windows AAA, lamps off', async () => {
        const inp = await t.eval(() => document.querySelector('#machine-input')?.value ?? null);
        return t.ok(inp === '' && (await output(t)) === '' && (await windows(t)) === 'AAA' && (await litLamps(t)).length === 0,
          `input "${inp}", windows ${await windows(t)}`);
      }, 2);
      await typeMessage(t, 'AGAIN');
      await setSelect(t, '#rotor-left', 'II');
      await t.sleep(200);
      await t.part('config change resets the machine', async () => {
        const inp = await t.eval(() => document.querySelector('#machine-input')?.value ?? null);
        return t.ok(inp === '' && (await output(t)) === '' && (await windows(t)) === 'AAA', `input "${inp}", windows ${await windows(t)}`);
      }, 2);
    },
  },
];

export async function showcase(t) {
  await t.sleep(500);
  await t.shot('machine');
  await t.page.click('#machine-input');
  await t.page.keyboard.type('HELLOWORLD', { delay: 130 });
  await t.sleep(500);
  await t.shot('encrypted');
  await t.page.click('#reset-btn');
  await t.sleep(200);
  await setSelect(t, '#pos-left', 'A');
  await setSelect(t, '#pos-middle', 'D');
  await setSelect(t, '#pos-right', 'U');
  await t.page.click('#machine-input');
  await t.page.keyboard.type('AAAA', { delay: 350 });
  await t.sleep(400);
  await t.shot('double-step');
  await t.setInput('#plugboard', 'AB CD EF GH IJ KL');
  await t.page.click('#machine-input');
  await t.page.keyboard.type('CONVOY', { delay: 130 });
  await t.sleep(500);
  await t.shot('plugboard');
}