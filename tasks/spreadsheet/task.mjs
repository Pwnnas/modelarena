export const meta = {
  title: 'Gridcalc',
  subtitle: 'Spreadsheet engine',
  order: 1,
  skills: ['parsing', 'dependency graphs', 'keyboard UX'],
  summary:
    'A 26×100 spreadsheet with a hand-written formula parser, incremental recalculation, cycle detection, copy/paste with reference shifting and persistence.',
  judging: [
    'Does it look like a professional spreadsheet: typography, density, grid lines, headers?',
    'Are selection, editing and formula-reference highlighting clear and pleasant?',
    'Does it feel fast and solid while typing and navigating?',
  ],
};

const cell = (a) => `[data-cell="${a}"]`;

function cellText(t, addr) {
  return t.eval((addr) => {
    const el = document.querySelector(`[data-cell="${addr}"]`);
    if (!el) return null;
    let s = el.innerText ?? '';
    if (!s.trim()) {
      const input = el.matches('input,textarea') ? el : el.querySelector('input,textarea');
      if (input) s = input.value;
    }
    return s.trim();
  }, addr);
}

function matches(actual, expected) {
  if (actual == null) return false;
  if (typeof expected === 'number') {
    const n = Number(actual.replace(/\s/g, ''));
    return actual.trim() !== '' && Number.isFinite(n) && Math.abs(n - expected) <= 1e-9 * Math.max(1, Math.abs(expected));
  }
  return actual.toLowerCase() === String(expected).toLowerCase();
}

async function expectCell(t, addr, expected, timeout = 1000) {
  const hit = await t.poll(async () => (matches(await cellText(t, addr), expected) ? true : null), { timeout });
  if (hit) return { ok: true };
  return { ok: false, note: `${addr}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(await cellText(t, addr))}` };
}

async function setCell(t, addr, text) {
  await t.page.click(cell(addr));
  await t.page.keyboard.type(text);
  await t.page.keyboard.press('Enter');
}

const selected = (t) =>
  t.eval(() => [...document.querySelectorAll('[data-cell][aria-selected="true"]')].map((e) => e.dataset.cell).join(',') || 'none');

async function expectSelected(t, addr) {
  const s = await t.poll(async () => ((await selected(t)) === addr ? addr : null), { timeout: 600 });
  return s ? { ok: true } : { ok: false, note: `selected: ${await selected(t)}, expected ${addr}` };
}

// Enter a list of [address, input, expected] cases, then score each one.
async function formulaCases(t, column, cases) {
  for (let i = 0; i < cases.length; i++) await setCell(t, `${column}${i + 1}`, cases[i][0]);
  for (let i = 0; i < cases.length; i++) {
    const [input, expected] = cases[i];
    await t.part(`${input} → ${expected}`, () => expectCell(t, `${column}${i + 1}`, expected));
  }
}

export const checks = [
  {
    id: 'grid',
    title: 'Grid structure (26×100 cells, formula bar)',
    points: 4,
    async run(t) {
      await t.part('2,600 [data-cell] elements', async () => {
        const n = await t.count('[data-cell]');
        return t.ok(n === 2600, `found ${n}`);
      });
      await t.part('A1, M50 and Z100 exist', () =>
        t.eval(() => ['A1', 'M50', 'Z100'].every((a) => document.querySelector(`[data-cell="${a}"]`))),
      );
      await t.part('#formula-bar input exists', () => t.exists('input#formula-bar'));
      await t.part('A1 visible on load', () => t.visible(cell('A1')));
    },
  },
  {
    id: 'entry',
    title: 'Typing values into cells',
    points: 6,
    async run(t) {
      await setCell(t, 'A1', '42');
      await t.part('number entry', () => expectCell(t, 'A1', 42));
      await t.part('Enter moves selection down', () => expectSelected(t, 'A2'));
      await setCell(t, 'B1', 'hello world');
      await t.part('text entry', () => expectCell(t, 'B1', 'hello world'));
      await setCell(t, 'A1', '7');
      await t.part('typing replaces existing content', () => expectCell(t, 'A1', 7));
    },
  },
  {
    id: 'keyboard',
    title: 'Keyboard navigation and edit keys',
    points: 6,
    async run(t) {
      const k = t.page.keyboard;
      await t.page.click(cell('C3'));
      await t.part('click selects', () => expectSelected(t, 'C3'));
      await k.press('ArrowRight');
      await t.part('ArrowRight', () => expectSelected(t, 'D3'));
      await k.press('ArrowDown');
      await t.part('ArrowDown', () => expectSelected(t, 'D4'));
      await k.press('ArrowLeft');
      await k.press('ArrowUp');
      await t.part('ArrowLeft + ArrowUp', () => expectSelected(t, 'C3'));
      await k.type('7');
      await k.press('Tab');
      await t.part('Tab commits and moves right', async () => {
        const v = await expectCell(t, 'C3', 7);
        if (!v.ok) return v;
        return expectSelected(t, 'D3');
      });
      await k.type('99');
      await k.press('Escape');
      await t.part('Escape cancels the edit', async () => {
        const v = await expectCell(t, 'D3', '');
        if (!v.ok) return v;
        return expectSelected(t, 'D3');
      });
      await t.page.click(cell('C6'));
      await k.type('1');
      await k.press('Shift+Enter');
      await t.part('Shift+Enter commits and moves up', async () => {
        const v = await expectCell(t, 'C6', 1);
        if (!v.ok) return v;
        return expectSelected(t, 'C5');
      });
      await t.page.click(cell('A1'));
      await k.press('ArrowUp');
      await k.press('ArrowLeft');
      await t.part('stops at grid edges', () => expectSelected(t, 'A1'));
    },
  },
  {
    id: 'edit-existing',
    title: 'F2 / double-click editing, Delete / Backspace',
    points: 4,
    async run(t) {
      const k = t.page.keyboard;
      await setCell(t, 'A1', '5');
      await t.page.click(cell('A1'));
      await k.press('F2');
      await k.type('0');
      await k.press('Enter');
      await t.part('F2 edits with caret at end (5 → 50)', () => expectCell(t, 'A1', 50));
      await t.page.dblclick(cell('A1'));
      await k.type('1');
      await k.press('Enter');
      await t.part('double-click edits (50 → 501)', () => expectCell(t, 'A1', 501));
      await t.page.click(cell('A1'));
      await k.press('Delete');
      await t.part('Delete clears', () => expectCell(t, 'A1', ''));
      await setCell(t, 'B2', '9');
      await t.page.click(cell('B2'));
      await k.press('Backspace');
      await t.part('Backspace clears', () => expectCell(t, 'B2', ''));
    },
  },
  {
    id: 'arithmetic',
    title: 'Arithmetic, precedence and references',
    points: 8,
    async run(t) {
      await setCell(t, 'A1', '4');
      await formulaCases(t, 'B', [
        ['=1+2*3', 7],
        ['=(1+2)*3', 9],
        ['=2^3^2', 512],
        ['=-2^2', -4],
        ['=-A1+10', 6],
        ['=10/4', 2.5],
        ['=A1*C99', 0],
        ['= 2 * ( A1 - 1 )', 6],
        ['=1e3+.5', 1000.5],
        ['=a1*2', 8],
      ]);
    },
  },
  {
    id: 'functions',
    title: 'Functions and ranges',
    points: 8,
    async run(t) {
      for (const [a, v] of [['A1', '1'], ['A2', '2'], ['A3', '3'], ['A4', '4'], ['A5', 'n/a']]) await setCell(t, a, v);
      await formulaCases(t, 'B', [
        ['=SUM(A1:A5)', 10],
        ['=AVERAGE(A1:A4)', 2.5],
        ['=MIN(A1:A4)', 1],
        ['=max(a1:a4)', 4],
        ['=COUNT(A1:A6)', 4],
        ['=IF(A1>0,"pos","neg")', 'pos'],
        ['=ROUND(10/3,2)', 3.33],
        ['=SUM(A1:A2,10,A4)', 17],
        ['=ABS(-7)', 7],
        ['=AVERAGE(A1:A4)*2', 5],
      ]);
    },
  },
  {
    id: 'text-logic',
    title: 'Strings, & concatenation and comparisons',
    points: 4,
    async run(t) {
      await setCell(t, 'A1', '1');
      await formulaCases(t, 'B', [
        ['="a"&"b"', 'ab'],
        ['=A1=1', 'TRUE'],
        ['=2>3', 'FALSE'],
        ['="n="&A1*2', 'n=2'],
        ['=IF(A1<>1,"x","y")', 'y'],
        ['=1<=1', 'TRUE'],
      ]);
    },
  },
  {
    id: 'recalc',
    title: 'Dependency tracking and recalculation',
    points: 10,
    async run(t) {
      await setCell(t, 'A1', '1');
      await setCell(t, 'B1', '=A1*2');
      await setCell(t, 'C1', '=B1+A1');
      await setCell(t, 'D1', '=SUM(A1:C1)');
      await setCell(t, 'E1', '=D1*10');
      await t.part('initial values', () => expectCell(t, 'E1', 60));
      await setCell(t, 'A1', '5');
      await t.part('direct dependent updates', () => expectCell(t, 'B1', 10));
      await t.part('transitive dependent updates', () => expectCell(t, 'C1', 15));
      await t.part('range dependent updates', () => expectCell(t, 'D1', 30));
      await t.part('deep dependent updates', () => expectCell(t, 'E1', 300));
      await setCell(t, 'B1', '=A1*3');
      await t.part('editing a formula re-wires dependents', () => expectCell(t, 'D1', 40));
      await setCell(t, 'B1', '7');
      await setCell(t, 'A1', '100');
      await t.part('stale dependencies are dropped', async () => {
        const b = await expectCell(t, 'B1', 7);
        if (!b.ok) return b;
        return expectCell(t, 'C1', 107);
      });
    },
  },
  {
    id: 'cycles',
    title: 'Circular reference detection and recovery',
    points: 8,
    async run(t) {
      await setCell(t, 'A1', '=B1');
      await setCell(t, 'B1', '=A1');
      await t.part('two-cell cycle', async () => {
        const a = await expectCell(t, 'A1', '#CYCLE!');
        return a.ok ? expectCell(t, 'B1', '#CYCLE!') : a;
      });
      await setCell(t, 'C1', '=C1');
      await t.part('self-reference', () => expectCell(t, 'C1', '#CYCLE!'));
      await setCell(t, 'D1', '=A1+1');
      await t.part('dependents of a cycle show #CYCLE!', () => expectCell(t, 'D1', '#CYCLE!'));
      await setCell(t, 'B1', '3');
      await t.part('breaking the cycle recovers all cells', async () => {
        const a = await expectCell(t, 'A1', 3);
        return a.ok ? expectCell(t, 'D1', 4) : a;
      });
      await setCell(t, 'E1', '=F1');
      await setCell(t, 'F1', '=G1');
      await setCell(t, 'G1', '=E1');
      await t.part('three-cell cycle', async () => {
        for (const a of ['E1', 'F1', 'G1']) {
          const r = await expectCell(t, a, '#CYCLE!');
          if (!r.ok) return r;
        }
        return true;
      });
    },
  },
  {
    id: 'errors',
    title: 'Error values and propagation',
    points: 8,
    async run(t) {
      await setCell(t, 'B1', 'hello');
      await formulaCases(t, 'A', [
        ['=1/0', '#DIV/0!'],
        ['=1+', '#ERROR!'],
        ['=FOO(1)', '#ERROR!'],
        ['=A1+1', '#DIV/0!'],
        ['=B1*2', '#VALUE!'],
        ['=A101', '#REF!'],
        ['=AA1', '#REF!'],
        ['=(1+2', '#ERROR!'],
      ]);
    },
  },
  {
    id: 'formula-bar',
    title: 'Formula bar',
    points: 5,
    async run(t) {
      await setCell(t, 'A1', '4');
      await setCell(t, 'B1', '=A1*2');
      await t.page.click(cell('B1'));
      await t.part('shows the raw formula', async () => {
        const v = (await t.page.inputValue('#formula-bar')).replace(/\s+/g, '');
        return t.ok(v.toUpperCase() === '=A1*2', `formula bar: "${v}"`);
      });
      await t.part('cell still shows the value', () => expectCell(t, 'B1', 8));
      await t.page.click(cell('A1'));
      await t.part('follows the selection', async () => {
        const v = await t.page.inputValue('#formula-bar');
        return t.ok(v.trim() === '4', `formula bar: "${v}"`);
      });
      await t.page.click(cell('B1'));
      await t.page.click('#formula-bar');
      await t.shortcut('a');
      await t.page.keyboard.type('=A1*3');
      await t.page.keyboard.press('Enter');
      await t.part('editing in the bar commits to the cell', () => expectCell(t, 'B1', 12));
    },
  },
  {
    id: 'number-format',
    title: 'Number display (no float noise, 10 significant digits)',
    points: 3,
    async run(t) {
      await setCell(t, 'A1', '=0.1+0.2');
      await setCell(t, 'A2', '=1/3');
      await setCell(t, 'A3', '=2/3');
      await setCell(t, 'A4', '=1e3');
      await t.part('0.1+0.2 shows 0.3', async () => {
        const v = await cellText(t, 'A1');
        return t.ok(v === '0.3', `got "${v}"`);
      });
      for (const [a, prefix] of [['A2', '0.333333'], ['A3', '0.666666']]) {
        await t.part(`${a} has ≤10 significant digits`, async () => {
          const v = await cellText(t, a);
          return t.ok(v?.startsWith(prefix) && v.length <= 12, `got "${v}"`);
        });
      }
      await t.part('1e3 shows 1000', async () => {
        const v = await cellText(t, 'A4');
        return t.ok(v === '1000', `got "${v}"`);
      });
    },
  },
  {
    id: 'copy-paste',
    title: 'Copy / paste with relative and absolute references',
    points: 6,
    async run(t) {
      await setCell(t, 'A1', '1');
      await setCell(t, 'A2', '2');
      await setCell(t, 'B1', '=A1*10');
      await t.page.click(cell('B1'));
      await t.shortcut('c');
      await t.page.click(cell('B2'));
      await t.shortcut('v');
      await t.part('pasting one row down shifts rows (=A2*10)', () => expectCell(t, 'B2', 20));
      await t.page.click(cell('C1'));
      await t.shortcut('v');
      await t.part('pasting one column right shifts columns (=B1*10)', () => expectCell(t, 'C1', 100));
      await setCell(t, 'D1', '=$A$1+A1');
      await t.page.click(cell('D1'));
      await t.shortcut('c');
      await t.page.click(cell('D2'));
      await t.shortcut('v');
      await t.part('$-anchored references stay fixed', () => expectCell(t, 'D2', 3));
      await t.page.click(cell('D2'));
      await t.part('pasted formula text is =$A$1+A2', async () => {
        const v = (await t.page.inputValue('#formula-bar')).replace(/\s+/g, '').toUpperCase();
        return t.ok(v === '=$A$1+A2', `formula bar: "${v}"`);
      });
    },
  },
  {
    id: 'persistence',
    title: 'Persistence across reload',
    points: 6,
    async run(t) {
      await setCell(t, 'A1', '5');
      await setCell(t, 'B1', '=A1*2');
      await setCell(t, 'C1', 'note');
      await t.sleep(700);
      await t.reload();
      await t.part('values restored', async () => {
        const b = await expectCell(t, 'B1', 10, 2000);
        return b.ok ? expectCell(t, 'C1', 'note') : b;
      });
      await setCell(t, 'A1', '6');
      await t.part('formulas restored as formulas', () => expectCell(t, 'B1', 12));
    },
  },
  {
    id: 'chain-speed',
    title: 'Recalculation speed (60-cell chain)',
    points: 6,
    timeout: 90000,
    async run(t) {
      await setCell(t, 'A1', '1');
      for (let r = 2; r <= 60; r++) await setCell(t, `A${r}`, `=A${r - 1}+1`);
      await t.part('chain computes', () => expectCell(t, 'A60', 60, 2000));
      await t.page.click(cell('A1'));
      await t.page.keyboard.type('100');
      await t.eval(() => {
        const m = (window.__chain = { t0: 0, t1: 0 });
        addEventListener('keydown', (e) => { if (e.key === 'Enter' && !m.t0) m.t0 = performance.now(); }, { capture: true });
        const check = () => {
          if (m.t1 || !m.t0) return;
          const el = document.querySelector('[data-cell="A60"]');
          if (el && el.innerText.trim() === '159') m.t1 = performance.now();
        };
        new MutationObserver(check).observe(document.body, { subtree: true, childList: true, characterData: true });
        const loop = () => { check(); if (!m.t1) requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
      });
      await t.page.keyboard.press('Enter');
      await t.part('update latency', async () => {
        const m = await t.poll(() => t.eval(() => (window.__chain.t1 ? window.__chain : null)), { timeout: 5000 });
        if (!m) return t.ok(false, 'A60 never showed 159');
        const ms = m.t1 - m.t0;
        const score = ms <= 100 ? 1 : ms <= 200 ? 0.6 : ms <= 500 ? 0.3 : 0.1;
        return { score, note: `${ms.toFixed(1)} ms from Enter to A60 = 159` };
      }, 2);
    },
  },
];

export async function showcase(t) {
  const k = t.page.keyboard;
  const rows = [
    ['A1', 'Item'], ['B1', 'Qty'], ['C1', 'Price'], ['D1', 'Total'],
    ['A2', 'Coffee beans'], ['B2', '3'], ['C2', '14.5'], ['D2', '=B2*C2'],
    ['A3', 'Oat milk'], ['B3', '6'], ['C3', '2.25'], ['D3', '=B3*C3'],
    ['A4', 'Croissants'], ['B4', '12'], ['C4', '1.8'], ['D4', '=B4*C4'],
    ['A6', 'Sum'], ['D6', '=SUM(D2:D4)'],
    ['A7', 'Average'], ['D7', '=ROUND(AVERAGE(D2:D4),2)'],
    ['A8', 'Over budget?'], ['D8', '=IF(D6>80,"yes","no")'],
  ];
  for (const [a, v] of rows) {
    await t.page.click(cell(a));
    await k.type(v, { delay: 25 });
    await k.press('Enter');
  }
  await t.shot('table');
  await t.page.click(cell('B2'));
  await k.type('5', { delay: 60 });
  await k.press('Enter');
  await t.sleep(400);
  await t.page.click(cell('F6'));
  await k.type('=SUM(D2:D4)*B', { delay: 90 });
  await t.sleep(300);
  await t.shot('editing-formula');
  await k.press('Escape');
  await t.page.click(cell('F2'));
  await k.type('=F3', { delay: 60 });
  await k.press('Enter');
  await k.type('=F2', { delay: 60 });
  await k.press('Enter');
  await t.sleep(300);
  await t.shot('cycle');
}
