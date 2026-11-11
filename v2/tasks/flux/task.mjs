export const meta = {
  title: 'Flux',
  subtitle: 'Four-state digital logic laboratory',
  order: 1,
  skills: [
    'graph editing',
    'four-state logic',
    'synchronous simulation',
    'memory semantics',
    'transactional history',
  ],
  summary:
    'A circuit editor with buses, simultaneous tick semantics, registers, RAM, ' +
    'truth tables, undo/redo, and persistence.',
  judging: [
    'Does the workbench feel like a coherent professional engineering tool?',
    'Are ports, connections, bus widths, and live signals easy to understand?',
    'Are dragging, wiring, pan/zoom, and inspector interactions pleasant?',
    'Are truth tables and sequential circuits presented clearly?',
  ],
};

// These checks total 91 points.
// The enclosing harness supplies the existing 3+3+3 reliability points.
//
// Uses only the t helpers demonstrated in the supplied evaluator, plus
// Playwright-compatible mouse and keyboard methods.
//
// Application state is changed through visible controls, never via __arena.

const TYPES = [
  'INPUT', 'CLOCK', 'NOT', 'AND', 'OR', 'XOR',
  'MUX', 'TRI', 'ADD', 'DFF', 'RAM', 'PROBE',
];

const clone = (x) => JSON.parse(JSON.stringify(x));
const zeros = (w) => '0'.repeat(w);
const unknown = (w) => 'X'.repeat(w);
const norm = (s) => s.replace(/Z/g, 'X');
const binary = (s) => /^[01]+$/.test(s);
const word = (n, w) => (n % (2 ** w)).toString(2).padStart(w, '0');
const merge = (a, b) =>
  [...a].map((v, i) => v === b[i] ? v : 'X').join('');

function canonical(c) {
  return JSON.stringify({
    version: c.version,
    nodes: [...c.nodes].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
      .map((n) => ({
        id: n.id, type: n.type, x: n.x, y: n.y, width: n.width,
        ...(n.type === 'INPUT' ? { value: n.value } : {}),
        ...(n.type === 'CLOCK' ? { period: n.period } : {}),
      })),
    wires: [...c.wires].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
      .map((w) => ({
        id: w.id,
        from: { node: w.from.node, port: w.from.port },
        to: { node: w.to.node, port: w.to.port },
      })),
  });
}

function assert(ok, message) {
  if (!ok) throw new Error(message);
}

async function part(t, name, fn, weight) {
  return t.part(name, async () => {
    try {
      const result = await fn();
      return result === undefined ? true : result;
    } catch (e) {
      return { ok: false, note: String(e?.message || e).slice(0, 500) };
    }
  }, weight);
}

const snap = (t) => t.eval(() => {
  if (!window.__arena || typeof window.__arena.snapshot !== 'function') {
    throw new Error('Missing window.__arena.snapshot()');
  }
  return window.__arena.snapshot();
});

async function waitFor(t, fn, message, timeout = 2000) {
  const result = await t.poll(async () => {
    try {
      return await fn() ? true : null;
    } catch {
      return null;
    }
  }, { timeout });
  assert(result, message);
}

async function textInput(t, selector, value, enter = false) {
  await t.page.click(selector);
  await t.shortcut('a');
  // Browser input protocol, not DOM mutation.
  await t.page.keyboard.insertText(String(value));
  if (enter) await t.page.keyboard.press('Enter');
}

async function importRaw(t, raw) {
  await textInput(t, '#json', raw);
  await t.page.click('#import');
}

async function load(t, circuit, timeout = 2000) {
  await importRaw(t, JSON.stringify(circuit));
  await waitFor(t, async () => {
    const s = await snap(t);
    return canonical(s.circuit) === canonical(circuit) && s.tick === 0;
  }, 'Import did not install the requested circuit at tick 0', timeout);
}

// Commit #step-count via change (Tab blurs), not Enter: an app that steps on
// Enter would otherwise advance twice.
async function setStepCount(t, count) {
  await textInput(t, '#step-count', count);
  await t.page.keyboard.press('Tab');
}

async function advance(t, count = 1, timeout = 3000) {
  const before = await snap(t);
  assert(!before.running, 'Expected a paused simulator');
  await setStepCount(t, count);
  await t.page.click('#step');
  await waitFor(t, async () => (await snap(t)).tick === before.tick + count,
    `Step did not advance exactly ${count} ticks`, timeout);
}

async function center(t, selector) {
  return t.eval((selector) => {
    const e = document.querySelector(selector);
    if (!e) throw new Error(`Missing ${selector}`);
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) throw new Error(`Zero-size target ${selector}`);
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, selector);
}

async function drag(t, from, to, steps = 12, alt = false) {
  if (alt) await t.page.keyboard.down('Alt');
  try {
    await t.page.mouse.move(from.x, from.y);
    await t.page.mouse.down();
    try {
      await t.page.mouse.move(to.x, to.y, { steps });
    } finally {
      await t.page.mouse.up();
    }
  } finally {
    if (alt) await t.page.keyboard.up('Alt');
  }
}

// Grid snapping while dragging is permitted by the PROMPT.
const dragTolerance = (distance) => Math.max(20, Math.abs(distance) * 0.25);

const nodeSelector = (id) => `[data-node="${id}"]`;
const titleSelector = (id) => `${nodeSelector(id)} [data-title]`;
const portSelector = (id, port) =>
  `${nodeSelector(id)} [data-port="${port}"]`;

async function select(t, id) {
  await t.page.click(titleSelector(id));
}

async function connect(t, from, to, port) {
  await drag(t,
    await center(t, portSelector(from, 'out')),
    await center(t, portSelector(to, port)));
}

async function add(t, type) {
  const before = await t.eval(() =>
    [...document.querySelectorAll('[data-node]')].map((e) => e.dataset.node));
  await t.page.click(`[data-add="${type}"]`);
  let id;
  await waitFor(t, async () => {
    const ids = await t.eval(() =>
      [...document.querySelectorAll('[data-node]')].map((e) => e.dataset.node));
    id = ids.find((x) => !before.includes(x));
    return !!id;
  }, `Palette did not add ${type}`);
  return id;
}

async function setValue(t, id, value) {
  await select(t, id);
  await textInput(t, '#node-value', value, true);
}

function node(id, type, width = 1, extra = {}) {
  return { id, type, x: 100, y: 100, width, ...extra };
}

function input(id, value, x = 100, y = 100) {
  return node(id, 'INPUT', value.length, { value, x, y });
}

function circuit(nodes, connections = []) {
  return {
    version: 1,
    nodes,
    wires: connections.map(([from, to, port], i) => ({
      id: `w${i}`,
      from: { node: from, port: 'out' },
      to: { node: to, port },
    })),
  };
}

// ---------------------------------------------------------------------------
// Independent reference implementation.
// No application implementation functions are called by this oracle.
// ---------------------------------------------------------------------------

function makeOracle(c) {
  const document = clone(c);
  const outputs = {};
  const memory = {};
  const clocks = {};
  const incoming = new Map();

  for (const w of document.wires) {
    const key = `${w.to.node}:${w.to.port}`;
    if (!incoming.has(key)) incoming.set(key, []);
    incoming.get(key).push(w.from.node);
  }

  for (const n of document.nodes) {
    if (n.type === 'PROBE') continue;
    outputs[n.id] =
      n.type === 'INPUT' ? n.value :
      ['CLOCK', 'DFF', 'RAM'].includes(n.type) ? zeros(n.width) :
      unknown(n.width);
    if (n.type === 'RAM') {
      memory[n.id] = Array.from({ length: 16 }, () => zeros(n.width));
    }
    if (n.type === 'RAM' || n.type === 'DFF') clocks[n.id] = '0';
  }

  function resolve(id, port, width, source = outputs) {
    const drivers = (incoming.get(`${id}:${port}`) || []).map((id) => source[id]);
    return Array.from({ length: width }, (_, i) => {
      const bits = drivers.map((s) => s[i]).filter((b) => b !== 'Z');
      if (!bits.length) return 'Z';
      if (bits.includes('X')) return 'X';
      return bits.every((b) => b === bits[0]) ? bits[0] : 'X';
    }).join('');
  }

  const model = {
    tick: 0,
    outputs,
    memory,
    clocks,
    probes() {
      return Object.fromEntries(document.nodes
        .filter((n) => n.type === 'PROBE')
        .map((n) => [n.id, resolve(n.id, 'in', n.width)]));
    },
    step(count = 1) {
      for (let iteration = 0; iteration < count; iteration++) {
        const next = {};
        const nextMemory = clone(memory);
        const nextClocks = { ...clocks };

        for (const n of document.nodes) {
          const w = n.width;
          const get = (port, width = w) => resolve(n.id, port, width);
          const bitwise = (fn) => {
            const a = norm(get('a'));
            const b = norm(get('b'));
            return [...a].map((v, i) => fn(v, b[i])).join('');
          };

          switch (n.type) {
            case 'PROBE':
              continue;
            case 'INPUT':
              next[n.id] = n.value;
              break;
            case 'CLOCK':
              next[n.id] = String(Math.floor((model.tick + 1) / n.period) % 2);
              break;
            case 'NOT':
              next[n.id] = [...norm(get('in'))]
                .map((b) => b === '0' ? '1' : b === '1' ? '0' : 'X').join('');
              break;
            case 'AND':
              next[n.id] = bitwise((a, b) =>
                a === '0' || b === '0' ? '0' :
                a === '1' && b === '1' ? '1' : 'X');
              break;
            case 'OR':
              next[n.id] = bitwise((a, b) =>
                a === '1' || b === '1' ? '1' :
                a === '0' && b === '0' ? '0' : 'X');
              break;
            case 'XOR':
              next[n.id] = bitwise((a, b) =>
                binary(a + b) ? String(Number(a) ^ Number(b)) : 'X');
              break;
            case 'ADD': {
              const a = get('a'), b = get('b');
              next[n.id] = binary(a + b)
                ? word(parseInt(a, 2) + parseInt(b, 2), w)
                : unknown(w);
              break;
            }
            case 'MUX': {
              const s = get('s', 1);
              next[n.id] = s === '0' ? get('a') :
                s === '1' ? get('b') : merge(get('a'), get('b'));
              break;
            }
            case 'TRI': {
              const en = get('en', 1), data = get('in');
              next[n.id] = en === '0' ? 'Z'.repeat(w) :
                en === '1' ? data :
                [...data].map((b) => b === 'Z' ? 'Z' : 'X').join('');
              break;
            }
            case 'DFF':
            case 'RAM': {
              const clk = norm(get('clk', 1));
              const old = clocks[n.id];
              const definite = old === '0' && clk === '1';
              const possible = old !== '1' && clk !== '0';
              nextClocks[n.id] = clk;

              if (n.type === 'DFF') {
                const rst = get('rst', 1);
                next[n.id] = rst === '1' ? zeros(w) :
                  rst !== '0' ? unknown(w) :
                  definite ? norm(get('d')) :
                  possible ? unknown(w) : outputs[n.id];
                break;
              }

              next[n.id] = outputs[n.id];
              if (!possible) break;

              const addr = get('addr', 4);
              const knownAddress = binary(addr);
              const index = knownAddress ? parseInt(addr, 2) : -1;
              const data = norm(get('din'));
              const we = get('we', 1);
              next[n.id] = definite && knownAddress
                ? memory[n.id][index] : unknown(w);

              if (we !== '0') {
                if (definite && knownAddress && we === '1') {
                  nextMemory[n.id][index] = data;
                } else if (knownAddress) {
                  nextMemory[n.id][index] = merge(memory[n.id][index], data);
                } else {
                  nextMemory[n.id] = memory[n.id].map((v) => merge(v, data));
                }
              }
              break;
            }
            default:
              throw new Error(`Oracle: unsupported type ${n.type}`);
          }
        }

        Object.assign(outputs, next);
        Object.assign(memory, nextMemory);
        Object.assign(clocks, nextClocks);
        model.tick++;
      }
    },
  };
  return model;
}

async function verify(t, model, { visible = true } = {}) {
  const s = await snap(t);
  assert(s.tick === model.tick, `tick: expected ${model.tick}, got ${s.tick}`);

  const expected = {
    outputs: Object.fromEntries(Object.entries(model.outputs)
      .map(([id, value]) => [id, { out: value }])),
    probes: model.probes(),
    memory: model.memory,
    clocks: model.clocks,
  };

  for (const field of Object.keys(expected)) {
    for (const [id, value] of Object.entries(expected[field])) {
      assert(JSON.stringify(s[field]?.[id]) === JSON.stringify(value),
        `${field}.${id}: expected ${JSON.stringify(value)}, ` +
        `got ${JSON.stringify(s[field]?.[id])}`);
    }
  }

  // Visible text may lag the model by a frame (rAF renderers), so poll.
  const visibleMismatch = async () => {
    const tickText = await t.eval(() =>
      document.querySelector('#tick')?.textContent.trim());
    if (tickText !== String(model.tick)) return `Visible tick is "${tickText}"`;
    if (!visible) return null;
    const rendered = await t.eval(() => Object.fromEntries(
      [...document.querySelectorAll('[data-value]')]
        .map((e) => [e.dataset.value, e.textContent.trim()])));
    for (const [id, value] of Object.entries(model.outputs)) {
      if (rendered[id] !== value) {
        return `Visible ${id}: expected ${value}, got ${rendered[id]}`;
      }
    }
    for (const [id, value] of Object.entries(model.probes())) {
      if (rendered[id] !== value) {
        return `Visible probe ${id}: expected ${value}, got ${rendered[id]}`;
      }
    }
    return null;
  };
  let mismatch = await visibleMismatch();
  if (mismatch) {
    await t.poll(async () => (mismatch = await visibleMismatch()) ? null : true,
      { timeout: 1000 });
  }
  assert(!mismatch, mismatch);
}

// Poll until the snapshot view is stable across two reads ~100 ms apart.
async function settledView(t, timeout = 2000) {
  let last = (await snap(t)).view;
  let stable = null;
  await t.poll(async () => {
    await t.sleep(100);
    const view = (await snap(t)).view;
    const same = JSON.stringify(view) === JSON.stringify(last);
    last = view;
    return same ? (stable = view) : null;
  }, { timeout });
  return stable || last;
}

async function scenario(t, c, checkpoints) {
  await load(t, c);
  const model = makeOracle(c);
  await verify(t, model);
  for (const count of checkpoints) {
    await advance(t, count);
    model.step(count);
    await verify(t, model);
  }
}

function gateFixture(type, a, b, control) {
  const w = a.length;
  const nodes = [
    input('a', a, 60, 80),
    node('g', type, w, { x: 350, y: 120 }),
    node('p', 'PROBE', w, { x: 650, y: 120 }),
  ];
  const connections = [['g', 'p', 'in']];
  connections.push(['a', 'g', ['NOT', 'TRI'].includes(type) ? 'in' : 'a']);
  if (b !== undefined) {
    nodes.push(input('b', b, 60, 220));
    connections.push(['b', 'g', 'b']);
  }
  if (control !== undefined) {
    nodes.push(input('s', control, 60, 360));
    connections.push(['s', 'g', type === 'TRI' ? 'en' : 's']);
  }
  return circuit(nodes, connections);
}

function registerFixture({ clk = 'CLOCK', clockValue = 'X', rst = '0' } = {}) {
  return circuit([
    input('data', '10Z1', 50, 60),
    input('reset', rst, 50, 210),
    clk === 'CLOCK'
      ? node('clock', 'CLOCK', 1, { period: 2, x: 50, y: 350 })
      : input('clock', clockValue, 50, 350),
    node('q', 'DFF', 4, { x: 350, y: 130 }),
    node('p', 'PROBE', 4, { x: 650, y: 130 }),
  ], [
    ['data', 'q', 'd'], ['reset', 'q', 'rst'],
    ['clock', 'q', 'clk'], ['q', 'p', 'in'],
  ]);
}

function ramFixture({ addr = '0011', we = '1', clock = 'CLOCK' } = {}) {
  return circuit([
    input('addr', addr, 40, 40),
    input('data', '1010', 40, 150),
    input('we', we, 40, 260),
    clock === 'CLOCK'
      ? node('clock', 'CLOCK', 1, { period: 2, x: 40, y: 370 })
      : input('clock', 'X', 40, 370),
    node('ram', 'RAM', 4, { x: 360, y: 150 }),
    node('p', 'PROBE', 4, { x: 650, y: 150 }),
  ], [
    ['addr', 'ram', 'addr'], ['data', 'ram', 'din'],
    ['we', 'ram', 'we'], ['clock', 'ram', 'clk'],
    ['ram', 'p', 'in'],
  ]);
}

function basicFixture() {
  return circuit([
    input('a', '0', 120, 100),
    node('p', 'PROBE', 1, { x: 450, y: 100 }),
  ], [['a', 'p', 'in']]);
}

async function generatedTable(t) {
  return t.eval(() => [...document.querySelectorAll(
    '#truth-table [data-assignment]')].map((row) => ({
    assignment: row.dataset.assignment,
    values: Object.fromEntries([...row.querySelectorAll('[data-probe]')]
      .map((cell) => [cell.dataset.probe, cell.textContent.trim()])),
  })));
}

async function checkTruth(t, c) {
  await load(t, c);
  await advance(t, 3);
  const before = await snap(t);
  await t.page.click('#truth');

  const inputs = c.nodes.filter((n) => n.type === 'INPUT')
    .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const bits = inputs.reduce((sum, n) => sum + n.width, 0);
  const rowCount = 2 ** bits;

  await waitFor(t, async () => (await generatedTable(t)).length === rowCount,
    `Expected ${rowCount} truth-table rows`, 5000);

  const rows = await generatedTable(t);
  for (let assignment = 0; assignment < rowCount; assignment++) {
    const key = word(assignment, bits);
    assert(rows[assignment].assignment === key,
      `Truth-table row ${assignment}: expected assignment ${key}`);
    const copy = clone(c);
    let offset = 0;
    for (const n of inputs) {
      copy.nodes.find((x) => x.id === n.id).value = key.slice(offset, offset + n.width);
      offset += n.width;
    }
    const model = makeOracle(copy);
    model.step(64);
    for (const [id, value] of Object.entries(model.probes())) {
      assert(rows[assignment].values[id] === value,
        `Assignment ${key}, probe ${id}: expected ${value}, ` +
        `got ${rows[assignment].values[id]}`);
    }
  }

  const after = await snap(t);
  assert(JSON.stringify(after) === JSON.stringify(before),
    'Truth-table generation mutated live state');
}
// ---------------------------------------------------------------------------
// Checks: 91 points total.
// ---------------------------------------------------------------------------

export const checks = [
  {
    id: 'structure',
    title: 'Workbench, palette, controls and detached inspection',
    points: 4,
    async run(t) {
      await part(t, 'Workspace and all component buttons', async () => {
        assert(await t.exists('svg#workspace'), 'Missing SVG workspace');
        assert(await t.exists('#workspace #scene'), 'Missing scene group');
        for (const type of TYPES) {
          assert(await t.visible(`[data-add="${type}"]`), `Missing palette ${type}`);
        }
      });
      await part(t, 'Required controls', async () => {
        for (const id of [
          'new', 'undo', 'redo', 'step', 'run', 'reset-state',
          'zoom-in', 'zoom-out', 'fit', 'import', 'export', 'truth',
          'step-count', 'tick', 'json', 'status',
        ]) {
          assert(await t.exists(`#${id}`), `Missing #${id}`);
        }
      });
      await part(t, 'Read-only snapshot is detached', async () => {
        await t.page.click('#new');
        const id = await add(t, 'INPUT');
        const result = await t.eval((id) => {
          const a = window.__arena.snapshot();
          const expected = a.circuit.nodes.find((n) => n.id === id).x;
          a.circuit.nodes.find((n) => n.id === id).x = 999999;
          a.view.scale = 99;
          a.outputs[id].out = 'X';
          const b = window.__arena.snapshot();
          return b.circuit.nodes.find((n) => n.id === id).x === expected &&
            b.view.scale !== 99 && b.outputs[id].out === '0';
        }, id);
        assert(result, 'Snapshot exposes mutable application state');
      });
    },
  },

  {
    id: 'editing',
    title: 'Component creation, selection, inspector and deletion',
    points: 7,
    async run(t) {
      await part(t, 'Add several component types', async () => {
        await t.page.click('#new');
        for (const type of ['INPUT', 'NOT', 'DFF', 'RAM', 'PROBE']) {
          const id = await add(t, type);
          const s = await snap(t);
          assert(s.circuit.nodes.some((n) => n.id === id && n.type === type),
            `${type} is not in the actual document`);
        }
      });
      await part(t, 'Selection and INPUT editing', async () => {
        await t.page.click('#new');
        const id = await add(t, 'INPUT');
        await select(t, id);
        assert(await t.eval((id) =>
          document.querySelector(`[data-node="${id}"]`)
            ?.getAttribute('aria-selected') === 'true', id), 'Selection not visible');
        await textInput(t, '#node-width', 4, true);
        await textInput(t, '#node-value', '10XZ', true);
        const s = await snap(t);
        const n = s.circuit.nodes.find((n) => n.id === id);
        assert(n.width === 4 && n.value === '10XZ', 'Inspector edits not committed');
        assert(s.outputs[id].out === '10XZ', 'INPUT output not updated');
      });
      await part(t, 'Width changes preserve low bits', async () => {
        await t.page.click('#new');
        const id = await add(t, 'INPUT');
        await select(t, id);
        await textInput(t, '#node-width', 4, true);
        await textInput(t, '#node-value', '1011', true);
        await textInput(t, '#node-width', 2, true);
        assert((await snap(t)).outputs[id].out === '11', 'Shrink did not truncate left');
        await textInput(t, '#node-width', 5, true);
        assert((await snap(t)).outputs[id].out === '00011', 'Grow did not zero-pad');
      });
      await part(t, 'Delete node and incident wires; Escape clears selection', async () => {
        await load(t, basicFixture());
        await select(t, 'a');
        await t.page.keyboard.press('Escape');
        assert((await snap(t)).selection === null, 'Escape did not clear selection');
        await select(t, 'a');
        await t.page.keyboard.press('Delete');
        const s = await snap(t);
        assert(!s.circuit.nodes.some((n) => n.id === 'a'), 'Node not deleted');
        assert(s.circuit.wires.length === 0, 'Dangling incident wire remains');
        assert(s.probes.p === 'Z', 'Disconnected probe is not Z');
      });
    },
  },

  {
    id: 'wiring',
    title: 'Real pointer wiring, duplicate rejection and bus widths',
    points: 6,
    async run(t) {
      await part(t, 'Drag output to input creates a live wire', async () => {
        const c = basicFixture();
        c.wires = [];
        await load(t, c);
        await connect(t, 'a', 'p', 'in');
        const s = await snap(t);
        assert(s.circuit.wires.length === 1, 'Wire was not created');
        assert(s.probes.p === '0', 'Wire did not affect probe');
        const w = s.circuit.wires[0];
        assert(await t.exists(`#scene [data-wire="${w.id}"]`), 'Wire not rendered');
      });
      await part(t, 'Duplicate wire drag is a no-op', async () => {
        await load(t, basicFixture());
        await connect(t, 'a', 'p', 'in');
        assert((await snap(t)).circuit.wires.length === 1, 'Duplicate was added');
      });
      await part(t, 'Reject incompatible port widths', async () => {
        await load(t, circuit([
          input('a', '1010', 100, 100),
          node('p', 'PROBE', 1, { x: 450, y: 100 }),
        ]));
        await connect(t, 'a', 'p', 'in');
        assert((await snap(t)).circuit.wires.length === 0, 'Accepted mismatched wire');
      });
      await part(t, 'Changing width removes incompatible incident wires', async () => {
        await load(t, basicFixture());
        await select(t, 'a');
        await textInput(t, '#node-width', 3, true);
        const s = await snap(t);
        assert(s.circuit.wires.length === 0, 'Incompatible old wire survived');
        assert(s.probes.p === 'Z', 'Probe retained stale driven value');
      });
    },
  },

  {
    id: 'geometry',
    title: 'Dragging, zoom-space coordinates and viewport transforms',
    points: 5,
    async run(t) {
      await part(t, 'Drag updates world coordinates', async () => {
        await load(t, basicFixture());
        const before = await snap(t);
        const start = await center(t, titleSelector('a'));
        await drag(t, start, { x: start.x + 80, y: start.y + 40 }, 20);
        const after = await snap(t);
        const a = before.circuit.nodes.find((n) => n.id === 'a');
        const b = after.circuit.nodes.find((n) => n.id === 'a');
        // Grid snapping is allowed, so tolerate max(20 px, 25%) of the drag.
        assert(Math.abs((b.x - a.x) * before.view.scale - 80) <= dragTolerance(80),
          'Horizontal drag is not in world coordinates');
        assert(Math.abs((b.y - a.y) * before.view.scale - 40) <= dragTolerance(40),
          'Vertical drag is not in world coordinates');
        // Rendered node must agree with its stored world position.
        const end = await center(t, titleSelector('a'));
        const sx = (b.x - a.x) * before.view.scale;
        const sy = (b.y - a.y) * before.view.scale;
        assert(Math.abs(end.x - start.x - sx) < 3 &&
          Math.abs(end.y - start.y - sy) < 3, 'Rendered node did not follow drag');
      });
      await part(t, 'Zoom changes rendered scale; drag remains correct', async () => {
        await load(t, basicFixture());
        await t.page.click('#fit');
        const before = { view: await settledView(t) };
        await t.page.click('#zoom-out');
        await settledView(t);
        const after = await snap(t);
        const expected = Math.max(0.25, before.view.scale / 1.25);
        assert(Math.abs(after.view.scale - expected) < 1e-6, 'Incorrect zoom factor');

        const start = await center(t, titleSelector('a'));
        const oldX = after.circuit.nodes.find((n) => n.id === 'a').x;
        await drag(t, start, { x: start.x + 60, y: start.y }, 15);
        const moved = await snap(t);
        const newX = moved.circuit.nodes.find((n) => n.id === 'a').x;
        assert(Math.abs((newX - oldX) * after.view.scale - 60) <= dragTolerance(60),
          'Dragging at zoom used screen coordinates as world coordinates');
      });
      await part(t, 'Scene transform agrees with reported viewport', async () => {
        await load(t, basicFixture());
        const result = await t.eval(() => {
          const s = window.__arena.snapshot();
          const svg = document.querySelector('#workspace');
          const scene = document.querySelector('#scene');
          const base = svg.getScreenCTM();
          const local = base.inverse().multiply(scene.getScreenCTM());
          return { view: s.view, a: local.a, d: local.d, e: local.e, f: local.f };
        });
        assert(Math.abs(result.a - result.view.scale) < 0.01 &&
          Math.abs(result.d - result.view.scale) < 0.01 &&
          Math.abs(result.e - result.view.x) < 1 &&
          Math.abs(result.f - result.view.y) < 1,
        'Reported view does not match actual SVG transform');
      });
    },
  },

  {
    id: 'gates',
    title: 'Basic gates, unknown logic, mux and overflow',
    points: 9,
    async run(t) {
      const cases = [
        ['NOT', '01XZ'],
        ['AND', '01XZ', '1000'],
        ['OR', '01XZ', '1011'],
        ['XOR', '0101', '1100'],
        ['XOR', '0X1Z', '1010'],
        ['ADD', '1111', '0010'],
        ['ADD', '01X1', '0000'],
        ['MUX', '01ZZ', '11ZX', 'X'],
        ['MUX', '0Z10', '1111', '0'],
      ];
      for (const args of cases) {
        await part(t, args.join(' / '), () =>
          scenario(t, gateFixture(...args), [1, 2]));
      }
    },
  },

  {
    id: 'buses',
    title: 'Tri-state buses, contention and undriven inputs',
    points: 8,
    async run(t) {
      for (const [name, values] of [
        ['No drivers', []],
        ['Only high impedance', ['ZZZZ', 'ZZZZ']],
        ['Complementary driven lanes', ['10ZZ', 'ZZ01']],
        ['Conflicting lanes', ['1010', '1100']],
        ['Unknown dominates non-Z drivers', ['0X1Z', '001Z']],
      ]) {
        await part(t, name, async () => {
          const nodes = values.map((v, i) => input(`a${i}`, v, 30, 40 + i * 120));
          nodes.push(node('p', 'PROBE', 4, { x: 480, y: 150 }));
          await scenario(t, circuit(nodes,
            values.map((_, i) => [`a${i}`, 'p', 'in'])), [1]);
        });
      }
      for (const en of ['0', '1', 'X']) {
        await part(t, `TRI enable ${en}`, () =>
          scenario(t, gateFixture('TRI', '10Z0', undefined, en), [1, 2]));
      }
    },
  },

  {
    id: 'sequential',
    title: 'Simultaneous ticks, clocks, registers and playback',
    points: 9,
    async run(t) {
      await part(t, 'Three-stage propagation is not immediate settling', async () => {
        const c = circuit([
          input('a', '0'),
          node('n1', 'NOT'), node('n2', 'NOT'), node('n3', 'NOT'),
          node('p', 'PROBE'),
        ], [
          ['a', 'n1', 'in'], ['n1', 'n2', 'in'],
          ['n2', 'n3', 'in'], ['n3', 'p', 'in'],
        ]);
        await scenario(t, c, [1, 1, 1, 3]);
      });
      await part(t, 'Clocked capture, hold, and Z-to-X storage', () =>
        scenario(t, registerFixture(), [1, 1, 1, 1, 3, 6]));
      await part(t, 'Reset has priority and unknown reset contaminates', async () => {
        await scenario(t, registerFixture({ rst: '1' }), [3, 5]);
        await scenario(t, registerFixture({ rst: 'X' }), [1, 3]);
      });
      await part(t, 'Ambiguous rising edge is not silently ignored', () =>
        scenario(t, registerFixture({ clk: 'INPUT', clockValue: 'X' }), [1, 2]));
      await part(t, 'Node ordering does not change results', async () => {
        const c = registerFixture();
        c.nodes.reverse();
        c.wires.reverse();
        await scenario(t, c, [3, 4, 7]);
      });
      await part(t, 'Run advances, Space pauses, and pause is stable', async () => {
        await load(t, registerFixture());
        await t.page.click('#run');
        await t.sleep(700);
        const running = await snap(t);
        assert(running.running && running.tick >= 2 && running.tick <= 20,
          `Unexpected running state/tick: ${running.running}/${running.tick}`);
        await t.page.click('#tick');
        await t.page.keyboard.press('Space');
        const paused = await snap(t);
        assert(!paused.running, 'Space did not pause');
        await t.sleep(250);
        const later = await snap(t);
        assert(later.tick === paused.tick, 'Paused simulator continued advancing');
        assert(JSON.stringify(later.outputs) === JSON.stringify(paused.outputs),
          'Paused outputs changed');
      });
    },
  },

  {
    id: 'memory',
    title: 'RAM read-before-write and conservative unknown-state handling',
    points: 9,
    async run(t) {
      await part(t, 'Read-before-write then later readback', () =>
        scenario(t, ramFixture(), [2, 1, 4, 4]));
      await part(t, 'Write disabled leaves memory untouched', () =>
        scenario(t, ramFixture({ we: '0' }), [3, 8]));
      await part(t, 'Unknown write-enable merges bits', () =>
        scenario(t, ramFixture({ we: 'X' }), [3, 4]));
      await part(t, 'Unknown address conservatively contaminates all words', () =>
        scenario(t, ramFixture({ addr: '0X11' }), [3, 4]));
      await part(t, 'Ambiguous clock merges rather than definite write', () =>
        scenario(t, ramFixture({ clock: 'INPUT' }), [1, 2]));
      await part(t, 'Reset State clears RAM without changing document', async () => {
        const c = ramFixture();
        await load(t, c);
        await advance(t, 7);
        await t.page.click('#reset-state');
        await verify(t, makeOracle(c));
        assert(canonical((await snap(t)).circuit) === canonical(c),
          'Reset State altered the circuit');
      });
    },
  },

  {
    id: 'history',
    title: 'Transactional undo/redo, drag coalescing and branch invalidation',
    points: 7,
    async run(t) {
      await part(t, 'A multi-move drag is one undo entry', async () => {
        const c = basicFixture();
        await load(t, c);
        const start = await center(t, titleSelector('a'));
        await drag(t, start, { x: start.x + 65, y: start.y + 30 }, 30);
        const moved = (await snap(t)).circuit;
        await t.page.click('#undo');
        assert(canonical((await snap(t)).circuit) === canonical(c),
          'One Undo did not restore the complete pre-drag document');
        await t.page.click('#redo');
        assert(canonical((await snap(t)).circuit) === canonical(moved),
          'Redo did not restore drag');
      });
      await part(t, 'Delete and its incident wires undo together', async () => {
        const c = basicFixture();
        await load(t, c);
        await select(t, 'a');
        await t.page.keyboard.press('Delete');
        await t.page.click('#undo');
        assert(canonical((await snap(t)).circuit) === canonical(c),
          'Undo did not restore node and wire together');
      });
      await part(t, 'Simulation does not consume history', async () => {
        await load(t, basicFixture());
        await setValue(t, 'a', '1');
        await advance(t, 5);
        await t.page.click('#undo');
        const s = await snap(t);
        assert(s.circuit.nodes.find((n) => n.id === 'a').value === '0',
          'Undo reverted a simulation step instead of the edit');
        assert(s.tick === 0, 'Undo did not reset simulation');
      });
      await part(t, 'New edit invalidates redo branch', async () => {
        await load(t, basicFixture());
        await setValue(t, 'a', '1');
        await t.page.click('#undo');
        await setValue(t, 'a', 'X');
        await t.page.click('#redo');
        assert((await snap(t)).circuit.nodes.find((n) => n.id === 'a').value === 'X',
          'Discarded redo branch was resurrected');
      });
      await part(t, 'At least 50 edits can be undone', async () => {
        await load(t, basicFixture());
        for (let i = 0; i < 50; i++) {
          await setValue(t, 'a', i % 2 === 0 ? '1' : '0');
        }
        for (let i = 49; i >= 0; i--) {
          await t.page.click('#undo');
          const expected = i % 2 === 0 ? '0' : '1';
          assert((await snap(t)).circuit.nodes.find((n) => n.id === 'a').value === expected,
            `History failed at undo ${50 - i}`);
        }
      });
    },
    timeout: 90000,
  },

  {
    id: 'validation',
    title: 'Atomic import validation and round-trip export',
    points: 5,
    async run(t) {
      const invalid = [
        ['Malformed JSON', '{'],
        ['Duplicate node ID', (() => {
          const c = basicFixture();
          c.nodes.push(clone(c.nodes[0]));
          return JSON.stringify(c);
        })()],
        ['Dangling endpoint', (() => {
          const c = basicFixture();
          c.wires[0].from.node = 'missing';
          return JSON.stringify(c);
        })()],
        ['Width mismatch', (() => {
          const c = basicFixture();
          c.nodes[0].width = 2;
          c.nodes[0].value = '00';
          return JSON.stringify(c);
        })()],
        ['Invalid INPUT value', (() => {
          const c = basicFixture();
          c.nodes[0].value = 'Q';
          return JSON.stringify(c);
        })()],
      ];

      for (const [name, raw] of invalid) {
        await part(t, name, async () => {
          await load(t, basicFixture());
          await setValue(t, 'a', '1');
          await advance(t, 2);
          const before = await snap(t);
          await importRaw(t, raw);
          await t.sleep(80);
          assert(JSON.stringify(await snap(t)) === JSON.stringify(before),
            'Rejected import changed live state');
          assert(await t.eval(() =>
            document.querySelector('#status')?.dataset.error === 'import'),
          'Import error was not reported');
          await t.page.click('#undo');
          assert((await snap(t)).circuit.nodes.find((n) => n.id === 'a').value === '0',
            'Rejected import modified undo history');
        });
      }

      await part(t, 'Export/import round trip', async () => {
        const c = ramFixture();
        await load(t, c);
        await advance(t, 7);
        await t.page.click('#export');
        const exported = JSON.parse(await t.page.inputValue('#json'));
        assert(canonical(exported) === canonical(c), 'Export differs from document');
        assert(!('tick' in exported) && !('memory' in exported),
          'Export includes simulator state');
        await t.page.click('#new');
        await load(t, exported);
        await verify(t, makeOracle(c));
      });
    },
  },

  {
    id: 'persistence',
    title: 'Document and viewport persistence with clean simulation restart',
    points: 5,
    async run(t) {
      await part(t, 'Reload restores document and viewport, not runtime state', async () => {
        const c = ramFixture();
        await load(t, c);
        await t.page.click('#zoom-out');
        await settledView(t);
        await advance(t, 7);
        const before = await snap(t);
        await t.sleep(650);
        await t.reload();
        await waitFor(t, async () => canonical((await snap(t)).circuit) === canonical(c),
          'Saved document not restored', 3000);
        const after = await snap(t);
        assert(!after.running && after.selection === null,
          'Reload did not start paused and unselected');
        for (const key of ['x', 'y', 'scale']) {
          assert(Math.abs(after.view[key] - before.view[key]) < 0.01,
            `Viewport ${key} not restored`);
        }
        await verify(t, makeOracle(c));
      });
      await part(t, 'Restored wiring remains editable and undo starts empty', async () => {
        const c = basicFixture();
        await load(t, c);
        await t.sleep(650);
        await t.reload();
        await waitFor(t, async () => canonical((await snap(t)).circuit) === canonical(c),
          'Saved circuit not restored');
        await t.page.click('#undo');
        assert(canonical((await snap(t)).circuit) === canonical(c),
          'History unexpectedly survived reload');
        await setValue(t, 'a', '1');
        assert((await snap(t)).probes.p === '1', 'Restored wire is not functional');
      });
    },
  },

  {
    id: 'scale',
    title: 'Large graphs, propagation correctness and simulation latency',
    points: 7,
    timeout: 90000,
    async run(t) {
      await part(t, '256-stage chain propagates exactly one stage per tick', async () => {
        const nodes = [input('a', '0')];
        const connections = [];
        for (let i = 0; i < 256; i++) {
          nodes.push(node(`n${i}`, 'NOT', 1, {
            x: 300 + (i % 16) * 150, y: Math.floor(i / 16) * 100,
          }));
          connections.push([i === 0 ? 'a' : `n${i - 1}`, `n${i}`, 'in']);
        }
        nodes.push(node('p', 'PROBE'));
        connections.push(['n255', 'p', 'in']);
        const c = circuit(nodes, connections);
        await load(t, c, 10000);

        const model = makeOracle(c);
        await advance(t, 255, 10000);
        model.step(255);
        await verify(t, model, { visible: false });
        assert((await snap(t)).probes.p === 'X', 'Signal propagated too early');
        await advance(t, 1);
        model.step(1);
        await verify(t, model, { visible: false });
        assert((await snap(t)).probes.p === '0', 'Final chain value is wrong');
      }, 2);

      await part(t, '256 ticks latency, measured from actual Step click', async () => {
        const nodes = [input('a', '1')];
        const edges = [];
        for (let i = 0; i < 256; i++) {
          nodes.push(node(`n${i}`, 'NOT'));
          edges.push([i ? `n${i - 1}` : 'a', `n${i}`, 'in']);
        }
        const c = circuit(nodes, edges);
        await load(t, c, 10000);
        await setStepCount(t, 256);

        // Measurement instrumentation only; it cannot mutate application state.
        await t.eval(() => {
          const m = window.__fluxTiming = { start: 0, end: 0 };
          document.querySelector('#step').addEventListener('click', () => {
            m.start = performance.now();
          }, { capture: true, once: true });
          const deadline = performance.now() + 12000;
          const sample = () => {
            if (m.start && window.__arena.snapshot().tick === 256) {
              m.end = performance.now();
              return;
            }
            if (performance.now() < deadline) requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        });
        await t.page.click('#step');
        const timing = await t.poll(() => t.eval(() =>
          window.__fluxTiming.end ? window.__fluxTiming : null), { timeout: 10000 });
        assert(timing, '256 ticks did not complete within 10 seconds');

        const model = makeOracle(c);
        model.step(256);
        await verify(t, model, { visible: false });

        const ms = timing.end - timing.start;
        return {
          score: ms <= 1000 ? 1 : ms <= 2500 ? 0.6 : ms <= 5000 ? 0.3 : 0.1,
          note: `${ms.toFixed(1)} ms for 256 ticks of 256 gates`,
        };
      }, 2);

      await part(t, 'Large fan-out has no lost updates', async () => {
        const nodes = [input('a', '10XZ')];
        const edges = [];
        for (let i = 0; i < 300; i++) {
          nodes.push(node(`n${i}`, 'NOT', 4));
          nodes.push(node(`p${i}`, 'PROBE', 4));
          edges.push(['a', `n${i}`, 'in'], [`n${i}`, `p${i}`, 'in']);
        }
        const c = circuit(nodes, edges);
        await load(t, c, 10000);
        await advance(t, 1, 10000);
        const model = makeOracle(c);
        model.step(1);
        await verify(t, model, { visible: false });
      });
    },
  },

  {
    id: 'truth',
    title: 'Exhaustive truth tables, assignment order and live-state isolation',
    points: 10,
    timeout: 90000,
    async run(t) {
      await part(t, 'Binary XOR table', () =>
        checkTruth(t, gateFixture('XOR', '0', '1')));

      await part(t, 'Eight input bits: all 256 assignments with overflow', () =>
        checkTruth(t, gateFixture('ADD', '0011', '0101')), 2);

      await part(t, 'Multi-output table and ASCII ID ordering', async () => {
        const c = circuit([
          input('z', '0', 50, 50),
          input('A', '1', 50, 180),
          input('a', '0', 50, 310),
          node('mux', 'MUX', 1, { x: 300, y: 150 }),
          node('inv', 'NOT', 1, { x: 500, y: 280 }),
          node('Z', 'PROBE', 1, { x: 700, y: 100 }),
          node('b', 'PROBE', 1, { x: 700, y: 280 }),
        ], [
          ['A', 'mux', 'a'], ['a', 'mux', 'b'], ['z', 'mux', 's'],
          ['mux', 'Z', 'in'], ['mux', 'inv', 'in'], ['inv', 'b', 'in'],
        ]);
        await checkTruth(t, c);
      });

      await part(t, 'Truth-table generation does not consume undo history', async () => {
        const c = gateFixture('XOR', '0', '0');
        await load(t, c);
        await setValue(t, 'a', '1');
        await t.page.click('#truth');
        await waitFor(t, async () => (await generatedTable(t)).length === 4,
          'Truth table did not finish', 5000);
        await t.page.click('#undo');
        assert((await snap(t)).circuit.nodes.find((n) => n.id === 'a').value === '0',
          'Truth table inserted or cleared history');
      });

      for (const [name, c] of [
        ['Sequential circuit', registerFixture()],
        ['Directed cycle', circuit([
          input('a', '0'),
          node('n', 'NOT'), node('p', 'PROBE'),
        ], [['n', 'n', 'in'], ['n', 'p', 'in']])],
        ['More than eight INPUT bits', circuit([
          input('a', '00000000'),
          input('b', '0'),
          node('p', 'PROBE', 8),
        ], [['a', 'p', 'in']])],
      ]) {
        await part(t, `Reject unsupported: ${name}`, async () => {
          // Clear any leftover rejection first with a successful generation.
          await load(t, gateFixture('XOR', '0', '1'));
          await t.page.click('#truth');
          await waitFor(t, () => t.eval(() =>
            document.querySelector('#status')?.dataset.error !== 'truth-unsupported'),
          'Supported truth table left data-error="truth-unsupported"', 5000);
          await load(t, c);
          await advance(t, 2);
          const before = await snap(t);
          await t.page.click('#truth');
          await waitFor(t, () => t.eval(() =>
            document.querySelector('#status')?.dataset.error === 'truth-unsupported'),
          'Unsupported circuit was not rejected');
          assert(JSON.stringify(await snap(t)) === JSON.stringify(before),
            'Rejected truth-table request mutated live state');
        });
      }
    },
  },
];

// ---------------------------------------------------------------------------
// Showcase: a small clocked accumulator and its visible state transitions.
// ---------------------------------------------------------------------------

export async function showcase(t) {
  const c = circuit([
    input('one', '0001', 70, 80),
    input('reset', '0', 70, 240),
    node('clock', 'CLOCK', 1, { period: 3, x: 70, y: 400 }),
    node('sum', 'ADD', 4, { x: 340, y: 80 }),
    node('register', 'DFF', 4, { x: 610, y: 210 }),
    node('count', 'PROBE', 4, { x: 880, y: 210 }),
  ], [
    ['one', 'sum', 'a'],
    ['register', 'sum', 'b'],
    ['sum', 'register', 'd'],
    ['reset', 'register', 'rst'],
    ['clock', 'register', 'clk'],
    ['register', 'count', 'in'],
  ]);

  await load(t, c);
  await t.page.click('#fit');
  await advance(t, 4);
  await t.shot('clocked-accumulator');

  await t.page.click('#run');
  await t.sleep(2200);
  await t.shot('running');
  await t.page.click('#run');

  await select(t, 'register');
  await t.shot('register-inspector');

  const tableCircuit = gateFixture('ADD', '01', '10');
  await load(t, tableCircuit);
  await t.page.click('#fit');
  await t.page.click('#truth');
  await t.sleep(700);
  await t.shot('truth-table');
}

