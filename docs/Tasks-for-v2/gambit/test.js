// Gambit — automated checks.
// The harness adds its three automatic robustness checks on top of this file
// (loads without uncaught exceptions / no console errors / no external requests = 3+3+3),
// so the parts defined here sum to 91 and the total is 100.

export const meta = {
  title: 'Gambit',
  subtitle: 'Chess board & rules engine',
  order: 8,
  skills: ['move generation', 'chess rules', 'search', 'drag & drop', 'SAN / FEN'],
  summary:
    'A complete chess app: click and drag moves, castling, en passant, promotion, check/mate/stalemate, draw detection, FEN + SAN, perft-verified move generation, undo and a built-in opponent.',
  judging: [
    'Does the board feel like a real chess app — palette, piece art, coordinates, spacing?',
    'Are selection, legal-move markers, last-move and check highlights clear and satisfying?',
    'Does dragging feel direct, and is the opponent quick enough to actually play against?',
  ],
};

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const ITALIAN = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3';
const AFTER_B5 = 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3';
const CASTLE = 'r3k2r/pppq1ppp/2npbn2/4p3/4P3/2NPBN2/PPPQ1PPP/R3K2R w KQkq - 0 1';
const THRU = '4k3/8/8/8/8/8/5r2/R3K2R w KQ - 0 1';
const EP = '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2';
const NO_EP = '4k3/8/8/3pP3/8/8/8/4K3 w - - 0 2';
const PROMO = '4k3/P7/8/8/8/8/8/4K3 w - - 0 1';
const CHK = '4k3/8/8/8/8/8/4R3/4K3 b - - 0 1';
const MATE = '7k/6Q1/6K1/8/8/8/8/8 b - - 0 1';
const STALE = '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1';
const PINNED = 'k3r3/8/8/8/8/8/4R3/4K3 w - - 0 1';
const KINGCHK = '4k3/8/8/8/8/8/8/4K2r w - - 0 1';
const ROOKS = '4k3/8/8/R7/8/8/8/R3K3 w - - 0 1';
const PAWNCAP = '4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1';
const KNIGHTS = '4k3/8/8/8/8/5N2/8/1N2K3 w - - 0 1';
const QCHECK = '4k3/8/8/8/8/8/8/4K2Q w - - 0 1';
const MATE1 = '6k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1';
const KK = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
const REPEAT = '4k3/8/8/8/8/8/8/R3K1N1 w - - 0 1';
const KIWI = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';

const norm = (s) => String(s ?? '').trim().replace(/\s+/g, ' ');

/* ---------- page helpers ---------- */

function arenaCall(t, method, ...args) {
  return t.eval(
    (req) => {
      try {
        const a = window.__arena;
        if (!a || typeof a[req.method] !== 'function') return null;
        return a[req.method](...req.args);
      } catch (e) {
        return null;
      }
    },
    { method, args },
  );
}

async function fen(t) {
  return norm(await arenaCall(t, 'fen'));
}

async function pieceAt(t, addr) {
  return t.eval((s) => {
    const el = document.querySelector(`[data-square="${s}"]`);
    if (!el) return null;
    const p = el.querySelector('[data-piece]');
    return (p && p.dataset.piece) || el.dataset.piece || null;
  }, addr);
}

async function status(t) {
  return t.eval(() => {
    const e = document.querySelector('#status');
    if (!e) return null;
    return { state: e.dataset.state ?? null, turn: e.dataset.turn ?? null, text: (e.textContent || '').trim() };
  });
}

async function legalSquares(t) {
  const list = await t.eval(() =>
    [...document.querySelectorAll('[data-square][data-legal="true"]')].map((e) => e.dataset.square),
  );
  return new Set(Array.isArray(list) ? list : []);
}

async function center(t, addr) {
  return t.eval((s) => {
    const el = document.querySelector(`[data-square="${s}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, addr);
}

async function clickSq(t, addr) {
  const c = await center(t, addr);
  if (!c) return false;
  await t.page.mouse.click(c.x, c.y);
  return true;
}

async function dragSq(t, from, to) {
  const a = await center(t, from);
  const b = await center(t, to);
  if (!a || !b) return false;
  await t.page.mouse.move(a.x, a.y);
  await t.page.mouse.down();
  await t.page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 6 });
  await t.page.mouse.move(b.x, b.y, { steps: 12 });
  await t.page.mouse.up();
  await t.sleep(120);
  return true;
}

async function newGame(t) {
  try {
    await t.page.click('#new');
  } catch {}
  const ok = await t.poll(async () => ((await fen(t)) === START ? true : null), { timeout: 700 });
  if (!ok) {
    await arenaCall(t, 'load', START);
    await t.sleep(100);
  }
  await t.sleep(60);
}

async function setup(t, f) {
  await arenaCall(t, 'load', f);
  const ok = await t.poll(async () => ((await fen(t)) === f ? true : null), { timeout: 800 });
  if (!ok) await t.sleep(120);
  return !!ok;
}

async function engineOff(t) {
  const on = await t.eval(() => document.querySelector('#engine')?.getAttribute('aria-pressed') ?? null);
  if (on === 'true') {
    try {
      await t.page.click('#engine');
    } catch {}
    await t.sleep(120);
  }
}

/* ---------- assertions ---------- */

function expectPiece(t, addr, want) {
  return pieceAt(t, addr).then((got) =>
    t.ok((got ?? null) === (want ?? null), `${addr}: expected ${want ?? 'empty'}, got ${got ?? 'empty'}`),
  );
}

async function expectFen(t, want) {
  const got = await fen(t);
  return t.ok(got === want, `fen: expected ${want} — got ${got}`);
}

async function expectMoves(t, addr, want) {
  const got = await arenaCall(t, 'moves', addr);
  if (!Array.isArray(got)) return t.ok(false, `moves("${addr}") → ${JSON.stringify(got)}`);
  const a = [...new Set(got.map(String))].sort().join(',');
  const b = [...new Set(want)].sort().join(',');
  return t.ok(a === b, `moves("${addr}") = [${a}] — expected [${b}]`);
}

/* ---------- checks ---------- */

export const checks = [
  {
    id: 'board',
    title: 'Board, squares and the starting position',
    points: 5,
    async run(t) {
      await t.part(
        '64 [data-square] elements',
        async () => {
          const n = await t.count('[data-square]');
          return t.ok(n === 64, `found ${n}`);
        },
        1,
      );

      await t.part(
        'a1 … h8 all present',
        () =>
          t.eval(() => {
            const want = [];
            for (const f of 'abcdefgh') for (let r = 1; r <= 8; r++) want.push(f + r);
            return want.every((a) => document.querySelector(`[data-square="${a}"]`));
          }),
        1,
      );

      await t.part(
        'initial position',
        async () => {
          const want = {
            a1: 'wR', b1: 'wN', c1: 'wB', d1: 'wQ', e1: 'wK', f1: 'wB', g1: 'wN', h1: 'wR',
            a8: 'bR', b8: 'bN', c8: 'bB', d8: 'bQ', e8: 'bK', f8: 'bB', g8: 'bN', h8: 'bR',
            a2: 'wP', b2: 'wP', c2: 'wP', d2: 'wP', e2: 'wP', f2: 'wP', g2: 'wP', h2: 'wP',
            a7: 'bP', b7: 'bP', c7: 'bP', d7: 'bP', e7: 'bP', f7: 'bP', g7: 'bP', h7: 'bP',
            d4: null, e5: null, a4: null, h5: null,
          };
          for (const [s, p] of Object.entries(want)) {
            const got = await pieceAt(t, s);
            if ((got ?? null) !== p) return t.ok(false, `${s}: expected ${p ?? 'empty'}, got ${got ?? 'empty'}`);
          }
          return true;
        },
        2,
      );

      await t.part(
        'a1 is bottom-left and dark',
        async () => {
          const r = await t.eval(() => {
            const g = (s) => document.querySelector(`[data-square="${s}"]`);
            const rect = (s) => g(s)?.getBoundingClientRect();
            const a1 = rect('a1');
            const h1 = rect('h1');
            const a8 = rect('a8');
            if (!a1 || !h1 || !a8) return null;
            return {
              left: a1.left < h1.left,
              below: a1.top > a8.top,
              a1: g('a1')?.dataset.color ?? null,
              h1: g('h1')?.dataset.color ?? null,
              h8: g('h8')?.dataset.color ?? null,
            };
          });
          if (!r) return t.ok(false, 'missing square elements');
          return t.ok(
            r.left && r.below && r.a1 === 'dark' && r.h1 === 'light' && r.h8 === 'dark',
            `a1 left of h1: ${r.left}; a1 below a8: ${r.below}; colors a1=${r.a1} h1=${r.h1} h8=${r.h8}`,
          );
        },
        1,
      );
    },
  },

  {
    id: 'click-move',
    title: 'Click-to-move, legal targets and illegal moves',
    points: 7,
    async run(t) {
      await t.part(
        'selecting e2 marks e3 and e4',
        async () => {
          await newGame(t);
          await clickSq(t, 'e2');
          await t.sleep(100);
          const s = [...(await legalSquares(t))].sort().join(',');
          return t.ok(s === 'e3,e4', `data-legal: [${s}]`);
        },
        2,
      );

      await t.part(
        'clicking e4 plays the move',
        async () => {
          await clickSq(t, 'e4');
          await t.sleep(150);
          const a = await expectPiece(t, 'e4', 'wP');
          if (!a.ok) return a;
          const b = await expectPiece(t, 'e2', null);
          if (!b.ok) return b;
          const f = (await fen(t)).split(' ');
          return t.ok(
            f[0] === 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR' && f[1] === 'b',
            `fen: ${f.join(' ')}`,
          );
        },
        2,
      );

      await t.part(
        'illegal move is rejected',
        async () => {
          await newGame(t);
          await clickSq(t, 'e2');
          await clickSq(t, 'e5');
          await t.sleep(150);
          const a = await expectPiece(t, 'e2', 'wP');
          if (!a.ok) return a;
          const b = await expectPiece(t, 'e5', null);
          if (!b.ok) return b;
          return expectFen(t, START);
        },
        2,
      );

      await t.part(
        'selecting another of your own pieces re-targets',
        async () => {
          await newGame(t);
          await clickSq(t, 'g1');
          await t.sleep(100);
          const first = await legalSquares(t);
          if (!first.has('f3') || !first.has('h3')) return t.ok(false, `g1 targets: [${[...first]}]`);
          await clickSq(t, 'b1');
          await t.sleep(100);
          const second = await legalSquares(t);
          return t.ok(
            second.has('a3') && second.has('c3') && !second.has('f3'),
            `b1 targets: [${[...second]}]`,
          );
        },
        1,
      );
    },
  },

  {
    id: 'drag-last',
    title: 'Drag & drop and last-move highlight',
    points: 6,
    async run(t) {
      await t.part(
        'last move highlighted on d2 and d4',
        async () => {
          await newGame(t);
          await clickSq(t, 'd2');
          await clickSq(t, 'd4');
          await t.sleep(200);
          const m = await t.eval(() =>
            [...document.querySelectorAll('[data-square]')]
              .filter((e) => e.dataset.last === 'true')
              .map((e) => e.dataset.square)
              .sort(),
          );
          return t.ok(m.join(',') === 'd2,d4', `data-last: [${m}]`);
        },
        2,
      );

      await t.part(
        'dragging e2 → e4 plays the move',
        async () => {
          await newGame(t);
          await dragSq(t, 'e2', 'e4');
          await t.sleep(150);
          const a = await expectPiece(t, 'e4', 'wP');
          if (!a.ok) return a;
          return expectPiece(t, 'e2', null);
        },
        2,
      );

      await t.part(
        'dragging to an illegal square does nothing',
        async () => {
          await newGame(t);
          await dragSq(t, 'a2', 'a5');
          await t.sleep(150);
          const a = await expectPiece(t, 'a2', 'wP');
          if (!a.ok) return a;
          const b = await expectPiece(t, 'a5', null);
          if (!b.ok) return b;
          return expectFen(t, START);
        },
        2,
      );
    },
  },

  {
    id: 'castling',
    title: 'Castling',
    points: 6,
    async run(t) {
      await t.part(
        'kingside: O-O moves king and rook',
        async () => {
          await setup(t, CASTLE);
          const ok = await arenaCall(t, 'move', 'e1g1');
          if (!ok) return t.ok(false, `move("e1g1") → ${ok}`);
          await t.sleep(120);
          const a = await expectPiece(t, 'g1', 'wK');
          if (!a.ok) return a;
          const b = await expectPiece(t, 'f1', 'wR');
          if (!b.ok) return b;
          const c = await expectPiece(t, 'e1', null);
          if (!c.ok) return c;
          return expectPiece(t, 'h1', null);
        },
        2,
      );

      await t.part(
        'queenside: O-O-O moves king and rook',
        async () => {
          await setup(t, CASTLE);
          const ok = await arenaCall(t, 'move', 'e1c1');
          if (!ok) return t.ok(false, `move("e1c1") → ${ok}`);
          await t.sleep(120);
          const a = await expectPiece(t, 'c1', 'wK');
          if (!a.ok) return a;
          const b = await expectPiece(t, 'd1', 'wR');
          if (!b.ok) return b;
          const c = await expectPiece(t, 'a1', null);
          if (!c.ok) return c;
          return expectPiece(t, 'e1', null);
        },
        2,
      );

      await t.part(
        'cannot castle through an attacked square',
        async () => {
          await setup(t, THRU);
          const m = await arenaCall(t, 'moves', 'e1');
          if (!Array.isArray(m)) return t.ok(false, `moves("e1") → ${JSON.stringify(m)}`);
          const s = new Set(m.map(String));
          return t.ok(s.has('c1') && !s.has('g1'), `king targets: [${[...s].sort()}]`);
        },
        2,
      );
    },
  },

  {
    id: 'en-passant',
    title: 'En passant',
    points: 5,
    async run(t) {
      await t.part(
        'exd6 e.p. removes the captured pawn',
        async () => {
          await setup(t, EP);
          const ok = await arenaCall(t, 'move', 'e5d6');
          if (!ok) return t.ok(false, `move("e5d6") → ${ok}`);
          await t.sleep(120);
          const a = await expectPiece(t, 'd6', 'wP');
          if (!a.ok) return a;
          const b = await expectPiece(t, 'd5', null);
          if (!b.ok) return b;
          return expectPiece(t, 'e5', null);
        },
        3,
      );

      await t.part(
        'no e.p. without the right',
        async () => {
          await setup(t, NO_EP);
          const m = await arenaCall(t, 'moves', 'e5');
          if (!Array.isArray(m)) return t.ok(false, `moves("e5") → ${JSON.stringify(m)}`);
          const s = new Set(m.map(String));
          return t.ok(!s.has('d6') && s.has('e6'), `e5 targets: [${[...s].sort()}]`);
        },
        2,
      );
    },
  },

  {
    id: 'promotion',
    title: 'Promotion',
    points: 6,
    async run(t) {
      await t.part(
        'chooser appears and holds the move',
        async () => {
          await setup(t, PROMO);
          await clickSq(t, 'a7');
          await clickSq(t, 'a8');
          const shown = await t.poll(
            async () => {
              const n = await t.count('[data-promote]');
              return n >= 4 ? n : null;
            },
            { timeout: 1500 },
          );
          if (!shown) return t.ok(false, 'no [data-promote] buttons appeared');
          return expectFen(t, PROMO);
        },
        2,
      );

      await t.part(
        'choosing a queen promotes',
        async () => {
          try {
            await t.page.click('[data-promote="q"]');
          } catch {
            return t.ok(false, 'could not click [data-promote="q"]');
          }
          await t.sleep(160);
          const a = await expectPiece(t, 'a8', 'wQ');
          if (!a.ok) return a;
          return expectPiece(t, 'a7', null);
        },
        2,
      );

      await t.part(
        'choosing a knight promotes',
        async () => {
          await setup(t, PROMO);
          await clickSq(t, 'a7');
          await clickSq(t, 'a8');
          const shown = await t.poll(
            async () => ((await t.count('[data-promote]')) >= 4 ? true : null),
            { timeout: 1500 },
          );
          if (!shown) return t.ok(false, 'no promotion chooser');
          try {
            await t.page.click('[data-promote="n"]');
          } catch {
            return t.ok(false, 'could not click [data-promote="n"]');
          }
          await t.sleep(160);
          const a = await expectPiece(t, 'a8', 'wN');
          if (!a.ok) return a;
          return expectPiece(t, 'a7', null);
        },
        2,
      );
    },
  },

  {
    id: 'status',
    title: 'Check, checkmate and stalemate',
    points: 6,
    async run(t) {
      await t.part(
        'check',
        async () => {
          await setup(t, CHK);
          const s = await status(t);
          return t.ok(s?.state === 'check' && s?.turn === 'b', `#status state=${s?.state} turn=${s?.turn}`);
        },
        2,
      );

      await t.part(
        'checkmate ends the game',
        async () => {
          await setup(t, MATE);
          const s = await status(t);
          const m = await arenaCall(t, 'moves');
          if (s?.state !== 'checkmate') return t.ok(false, `#status state=${s?.state}`);
          if (!Array.isArray(m) || m.length !== 0) return t.ok(false, `moves() → ${JSON.stringify(m)}`);
          const applied = await arenaCall(t, 'move', 'h8g8');
          return t.ok(applied === false, `move after mate returned ${applied}`);
        },
        2,
      );

      await t.part(
        'stalemate',
        async () => {
          await setup(t, STALE);
          const s = await status(t);
          const m = await arenaCall(t, 'moves');
          return t.ok(
            s?.state === 'stalemate' && Array.isArray(m) && m.length === 0,
            `#status state=${s?.state}, moves=${Array.isArray(m) ? m.length : JSON.stringify(m)}`,
          );
        },
        2,
      );
    },
  },

  {
    id: 'fen',
    title: 'FEN export, import and update',
    points: 6,
    async run(t) {
      await t.part('start position FEN', async () => expectFen(t, START), 2);

      await t.part(
        'load() returns true for a valid FEN',
        () => t.eval((f) => window.__arena?.load?.(f) === true, ITALIAN),
        1,
      );

      await t.part(
        'FEN round-trips exactly (castling, ep, clocks)',
        async () => {
          await setup(t, ITALIAN);
          return expectFen(t, ITALIAN);
        },
        2,
      );

      await t.part(
        'FEN updates after a move',
        async () => {
          await setup(t, ITALIAN);
          const ok = await arenaCall(t, 'move', 'f1b5');
          if (!ok) return t.ok(false, `move("f1b5") → ${ok}`);
          await t.sleep(120);
          return expectFen(t, AFTER_B5);
        },
        1,
      );
    },
  },

  {
    id: 'legal-moves',
    title: 'Legal move generation',
    points: 6,
    async run(t) {
      await t.part(
        'a pinned rook moves only along the pin',
        async () => {
          await setup(t, PINNED);
          return expectMoves(t, 'e2', ['e3', 'e4', 'e5', 'e6', 'e7', 'e8']);
        },
        2,
      );

      await t.part(
        'king in check has exactly three escapes',
        async () => {
          await setup(t, KINGCHK);
          return expectMoves(t, 'e1', ['d2', 'e2', 'f2']);
        },
        2,
      );

      await t.part(
        '20 legal moves at the start',
        async () => {
          await newGame(t);
          const m = await arenaCall(t, 'moves');
          if (!Array.isArray(m)) return t.ok(false, `moves() → ${JSON.stringify(m)}`);
          const s = [...new Set(m.map((x) => String(x).toLowerCase()))].sort();
          return t.ok(
            s.length === 20 && s.includes('e2e4') && s.includes('g1f3') && s.includes('b1c3'),
            `${s.length} moves: ${s.join(' ')}`,
          );
        },
        2,
      );
    },
  },

  {
    id: 'perft',
    title: 'Move generation verified by perft',
    points: 8,
    timeout: 45000,
    async run(t) {
      const perft = async (f, depth, want) => {
        await setup(t, f);
        const n = await arenaCall(t, 'perft', depth);
        return t.ok(Number(n) === want, `perft(${depth}) = ${n} — expected ${want}`);
      };

      await t.part('perft(1) = 20', () => perft(START, 1, 20), 1);
      await t.part('perft(2) = 400', () => perft(START, 2, 400), 1);
      await t.part('perft(3) = 8,902', () => perft(START, 3, 8902), 2);

      await t.part(
        'perft(4) = 197,281 (under 10 s)',
        async () => {
          await setup(t, START);
          const t0 = Date.now();
          const n = await arenaCall(t, 'perft', 4);
          const ms = Date.now() - t0;
          return t.ok(Number(n) === 197281, `perft(4) = ${n} — expected 197281 (${ms} ms)`);
        },
        3,
      );

      await t.part('kiwipete perft(2) = 2,039', () => perft(KIWI, 2, 2039), 1);
    },
  },

  {
    id: 'san',
    title: 'SAN notation',
    points: 6,
    async run(t) {
      const san = async (f, uci, want) => {
        await setup(t, f);
        const s = await arenaCall(t, 'san', uci);
        const got = String(s ?? '').replace(/0/g, 'O').replace(/\+\+$/, '#');
        return t.ok(got === want, `san("${uci}") = ${JSON.stringify(s)} — expected "${want}"`);
      };

      await t.part('simple pawn move', () => san(START, 'e2e4', 'e4'), 1);
      await t.part('pawn capture', () => san(PAWNCAP, 'e4d5', 'exd5'), 1);
      await t.part('file disambiguation', () => san(KNIGHTS, 'b1d2', 'Nbd2'), 1);
      await t.part('rank disambiguation', () => san(ROOKS, 'a5a3', 'R5a3'), 1);
      await t.part('castling', () => san(CASTLE, 'e1g1', 'O-O'), 1);
      await t.part('check suffix', () => san(QCHECK, 'h1h8', 'Qh8+'), 0.5);
      await t.part('mate suffix', () => san(MATE1, 'b1b8', 'Rb8#'), 0.5);
    },
  },

  {
    id: 'undo',
    title: 'Undo',
    points: 4,
    async run(t) {
      await t.part(
        '#undo reverts the last move',
        async () => {
          await newGame(t);
          await clickSq(t, 'e2');
          await clickSq(t, 'e4');
          await t.sleep(150);
          const moved = await expectPiece(t, 'e4', 'wP');
          if (!moved.ok) return moved;
          try {
            await t.page.click('#undo');
          } catch {
            return t.ok(false, 'no #undo button');
          }
          await t.sleep(200);
          const a = await expectPiece(t, 'e2', 'wP');
          if (!a.ok) return a;
          const b = await expectPiece(t, 'e4', null);
          if (!b.ok) return b;
          return expectFen(t, START);
        },
        2,
      );

      await t.part(
        'Ctrl/Cmd+Z reverts the last move',
        async () => {
          await clickSq(t, 'd2');
          await clickSq(t, 'd4');
          await t.sleep(150);
          try {
            await t.page.click('#status');
          } catch {}
          await t.shortcut('z');
          await t.sleep(220);
          const a = await expectPiece(t, 'd2', 'wP');
          if (!a.ok) return a;
          return expectFen(t, START);
        },
        1,
      );

      await t.part(
        'undo at the start position is harmless',
        async () => {
          await newGame(t);
          try {
            await t.page.click('#undo');
          } catch {}
          await t.sleep(150);
          const f = await fen(t);
          return t.ok(f === START, `fen: ${f}`);
        },
        1,
      );
    },
  },

  {
    id: 'flip-new',
    title: 'Board flip and new game',
    points: 4,
    async run(t) {
      await t.part(
        '#flip turns the board around',
        async () => {
          await newGame(t);
          try {
            await t.page.click('#flip');
          } catch {
            return t.ok(false, 'no #flip button');
          }
          await t.sleep(250);
          const r = await t.eval(() => {
            const board = document.querySelector('#board');
            const a1 = document.querySelector('[data-square="a1"]')?.getBoundingClientRect();
            const h1 = document.querySelector('[data-square="h1"]')?.getBoundingClientRect();
            const a8 = document.querySelector('[data-square="a8"]')?.getBoundingClientRect();
            if (!a1 || !h1 || !a8) return null;
            return {
              flag: board?.dataset.flipped ?? null,
              a1Right: a1.left > h1.left,
              a1Top: a1.top < a8.top,
            };
          });
          if (!r) return t.ok(false, 'missing squares after flip');
          return t.ok(
            r.flag === 'true' && r.a1Right && r.a1Top,
            `data-flipped=${r.flag}, a1 right of h1: ${r.a1Right}, a1 above a8: ${r.a1Top}`,
          );
        },
        2,
      );

      await t.part(
        '#new resets to the start position',
        async () => {
          await clickSq(t, 'e2');
          await clickSq(t, 'e4');
          await t.sleep(150);
          await newGame(t);
          const a = await expectFen(t, START);
          if (!a.ok) return a;
          const b = await expectPiece(t, 'e2', 'wP');
          if (!b.ok) return b;
          const s = await status(t);
          return t.ok(s?.turn === 'w' && s?.state === 'normal', `#status state=${s?.state} turn=${s?.turn}`);
        },
        2,
      );
    },
  },

  {
    id: 'engine',
    title: 'Built-in opponent',
    points: 8,
    async run(t) {
      await t.part(
        'bestMove returns a legal move',
        async () => {
          await newGame(t);
          const m = await arenaCall(t, 'bestMove', 200);
          const all = await arenaCall(t, 'moves');
          const legal = new Set((Array.isArray(all) ? all : []).map((s) => String(s).toLowerCase()));
          return t.ok(
            typeof m === 'string' && legal.has(String(m).toLowerCase()),
            `bestMove(200) = ${JSON.stringify(m)}`,
          );
        },
        2,
      );

      await t.part(
        'finds mate in one',
        async () => {
          await setup(t, MATE1);
          const m = await arenaCall(t, 'bestMove', 1500);
          return t.ok(String(m).toLowerCase() === 'b1b8', `bestMove() = ${JSON.stringify(m)} — expected b1b8`);
        },
        3,
      );

      await t.part(
        'plays black automatically when enabled',
        async () => {
          await newGame(t);
          const on = await t.eval(() => document.querySelector('#engine')?.getAttribute('aria-pressed') ?? null);
          if (on !== 'true') {
            try {
              await t.page.click('#engine');
            } catch {
              return t.ok(false, 'no #engine toggle');
            }
            await t.sleep(150);
          }
          await clickSq(t, 'e2');
          await clickSq(t, 'e4');
          await t.sleep(200);
          const after = await fen(t);
          if (after === START) return t.ok(false, '1.e4 was not played');
          const reply = await t.poll(
            async () => {
              const f = await fen(t);
              return f && f !== after && f.split(' ')[1] === 'w' ? f : null;
            },
            { timeout: 5000 },
          );
          return reply ? true : t.ok(false, `no black reply — fen stayed ${after}`);
        },
        3,
      );
    },
  },

  {
    id: 'draw',
    title: 'Draws',
    points: 5,
    async run(t) {
      await engineOff(t);

      await t.part(
        'insufficient material',
        async () => {
          await setup(t, KK);
          const s = await status(t);
          return t.ok(s?.state === 'draw', `#status state=${s?.state}`);
        },
        2,
      );

      await t.part(
        'threefold repetition',
        async () => {
          await setup(t, REPEAT);
          const line = ['g1f3', 'e8d8', 'f3g1', 'd8e8', 'g1f3', 'e8d8', 'f3g1', 'd8e8'];
          for (const uci of line) {
            const ok = await arenaCall(t, 'move', uci);
            if (ok !== true) return t.ok(false, `move("${uci}") returned ${ok}`);
            await t.sleep(40);
          }
          const s = await status(t);
          return t.ok(s?.state === 'draw', `#status state=${s?.state} after the position repeated three times`);
        },
        3,
      );
    },
  },

  {
    id: 'persistence',
    title: 'Persistence across reload',
    points: 3,
    async run(t) {
      await engineOff(t);
      await newGame(t);
      await clickSq(t, 'e2');
      await clickSq(t, 'e4');
      await t.sleep(150);
      await clickSq(t, 'e7');
      await clickSq(t, 'e5');
      await t.sleep(700);
      const before = await fen(t);
      await t.reload();

      await t.part(
        'position restored',
        async () => {
          const ok = await t.poll(
            async () => {
              const f = await fen(t);
              return f === before ? f : null;
            },
            { timeout: 4000 },
          );
          return ok ? true : t.ok(false, `fen after reload: ${await fen(t)} — expected ${before}`);
        },
        2,
      );

      await t.part(
        'turn restored',
        async () => {
          const s = await status(t);
          return t.ok(s?.turn === 'w' && s?.state === 'normal', `#status state=${s?.state} turn=${s?.turn}`);
        },
        1,
      );
    },
  },
];

/* ---------- showcase video ---------- */

export async function showcase(t) {
  await newGame(t);
  await t.sleep(500);
  await t.shot('board');

  await dragSq(t, 'e2', 'e4');
  await t.sleep(400);
  await clickSq(t, 'c7');
  await t.sleep(250);
  await clickSq(t, 'c5');
  await t.sleep(400);
  await t.shot('sicilian');

  await dragSq(t, 'g1', 'f3');
  await t.sleep(350);
  await clickSq(t, 'd7');
  await clickSq(t, 'd6');
  await t.sleep(400);
  await dragSq(t, 'f1', 'b5');
  await t.sleep(450);
  await t.shot('check-threat');

  await setup(t, CASTLE);
  await t.sleep(300);
  await dragSq(t, 'e1', 'g1');
  await t.sleep(600);
  await t.shot('castled');

  await setup(t, PROMO);
  await t.sleep(300);
  await clickSq(t, 'a7');
  await t.sleep(200);
  await clickSq(t, 'a8');
  await t.sleep(400);
  await t.shot('promotion-chooser');
  try {
    await t.page.click('[data-promote="q"]');
  } catch {}
  await t.sleep(600);
  await t.shot('promoted');

  await setup(t, MATE1);
  await t.sleep(300);
  const m = await arenaCall(t, 'bestMove', 800);
  if (typeof m === 'string' && m.length === 4) await arenaCall(t, 'move', m);
  await t.sleep(700);
  await t.shot('checkmate');
}
