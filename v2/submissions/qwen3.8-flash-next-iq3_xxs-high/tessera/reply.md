```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Tessera</title>
<style>
  :root {
    --bg: #07101b;
    --panel: #101a2d;
    --panel-2: #15213a;
    --text: #e7eef8;
    --muted: #93a3b8;
    --accent: #4cc9f0;
    --line: rgba(255, 255, 255, 0.08);
    --pv-cell: 10px;
  }

  html, body {
    height: 100%;
    margin: 0;
    overflow: hidden;
    background:
      radial-gradient(1000px 700px at 20% 10%, rgba(76, 201, 240, 0.08), transparent 60%),
      radial-gradient(900px 650px at 85% 80%, rgba(168, 85, 247, 0.07), transparent 65%),
      var(--bg);
    color: var(--text);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  #app {
    height: 100%;
    padding: 16px;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: minmax(210px, 250px) minmax(260px, 1fr) minmax(220px, 270px);
    gap: 14px;
    max-width: 1450px;
    margin: 0 auto;
  }

  .panel {
    min-height: 0;
    overflow: auto;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015)), var(--panel);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35);
  }

  .box {
    border: 1px solid rgba(255,255,255,0.055);
    border-radius: 12px;
    background: rgba(255,255,255,0.03);
    padding: 10px;
  }

  .box h2 {
    margin: 0 0 8px;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    font-weight: 700;
  }

  .stat {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
    margin: 7px 0;
  }

  .stat span {
    color: var(--muted);
    font-size: 0.95rem;
  }

  .stat strong {
    font-variant-numeric: tabular-nums;
    font-size: 1.25rem;
    letter-spacing: 0.02em;
  }

  #score, #lines, #level, #combo, #best, #seedDisplay, #fps {
    font-variant-numeric: tabular-nums;
  }

  #score { color: var(--accent); }
  #level { color: #34d399; }
  #combo { color: #f472b6; }
  #best { color: #fde047; }

  #hold, .preview-row {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 52px;
  }

  .preview-row {
    flex-wrap: wrap;
    gap: 7px;
  }

  #hold,
  #hold .pv,
  .preview {
    display: flex;
    justify-content: center;
  }

  .pv {
    display: grid;
    gap: 2px;
    width: max-content;
  }

  .pv i {
    width: var(--pv-cell);
    height: var(--pv-cell);
    border-radius: 3px;
    background: transparent;
  }

  .p-I { background: #4cc9f0; box-shadow: inset 0 2px 0 rgba(255,255,255,.28); }
  .p-J { background: #60a5fa; box-shadow: inset 0 2px 0 rgba(255,255,255,.28); }
  .p-L { background: #fb923c; box-shadow: inset 0 2px 0 rgba(255,255,255,.28); }
  .p-O { background: #facc15; box-shadow: inset 0 2px 0 rgba(255,255,255,.28); }
  .p-S { background: #4ade80; box-shadow: inset 0 2px 0 rgba(255,255,255,.28); }
  .p-T { background: #c084fc; box-shadow: inset 0 2px 0 rgba(255,255,255,.28); }
  .p-Z { background: #f87171; box-shadow: inset 0 2px 0 rgba(255,255,255,.28); }

  .empty {
    color: var(--muted);
    font-size: 1.2rem;
  }

  #controls {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .button-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  button {
    appearance: none;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 11px;
    background: linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.015)), #17233a;
    color: var(--text);
    font: inherit;
    font-weight: 650;
    letter-spacing: 0.02em;
    min-height: 42px;
    cursor: pointer;
    transition: transform 0.08s ease, background 0.12s ease, border-color 0.12s ease;
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
  }

  #controls button {
    font-size: 1.15rem;
    min-height: 46px;
  }

  button:hover {
    background: #20304a;
    border-color: rgba(255,255,255,0.14);
  }

  button:active {
    transform: translateY(1px) scale(0.99);
  }

  button[aria-pressed="true"] {
    background: linear-gradient(180deg, rgba(76,201,240,0.2), rgba(76,201,240,0.08));
    border-color: rgba(76,201,240,0.45);
    color: #e7f8ff;
  }

  #stage {
    min-width: 0;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  #boardWrap {
    position: relative;
    line-height: 0;
  }

  #board {
    display: block;
    border-radius: 14px;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.055),
      0 18px 55px rgba(0,0,0,0.55),
      0 0 34px rgba(76,201,240,0.08);
  }

  #overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    border-radius: 14px;
    text-align: center;
    background: rgba(7, 13, 25, 0.58);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.18s ease;
  }

  #overlay[data-state="paused"],
  #overlay[data-state="over"] {
    opacity: 1;
    visibility: visible;
  }

  #overlayMessage {
    font-size: clamp(18px, 3vw, 34px);
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: white;
    text-shadow: 0 0 18px rgba(76,201,240,0.75), 0 0 4px rgba(255,255,255,0.45);
  }

  .hint {
    color: var(--muted);
    line-height: 1.45;
    font-size: 0.92rem;
  }

  .kbd {
    display: inline-block;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.05);
    border-radius: 6px;
    padding: 1px 5px;
    margin-right: 4px;
    font-size: 0.82rem;
  }

  @media (max-width: 1000px) {
    #app {
      grid-template-columns: minmax(180px, 220px) minmax(240px, 1fr) minmax(180px, 220px);
      padding: 10px;
      gap: 10px;
    }
  }

  @media (max-width: 820px) {
    html, body { overflow: auto; }
    #app {
      height: auto;
      min-height: 100%;
      grid-template-columns: 1fr;
      grid-template-areas: "stage" "left" "right";
    }
    #stage { grid-area: stage; min-height: 520px; }
    .panel.left { grid-area: left; }
    .panel.right { grid-area: right; }
  }
</style>
</head>
<body>
  <div id="app">
    <aside class="panel left" id="leftPanel">
      <section class="box">
        <h2>Hold</h2>
        <div id="hold" data-piece="none"></div>
      </section>

      <section class="box">
        <h2>Next</h2>
        <div id="next" class="preview-row"></div>
      </section>

      <section class="box">
        <div class="stat"><span>Score</span><strong id="score">0</strong></div>
        <div class="stat"><span>Lines</span><strong id="lines">0</strong></div>
        <div class="stat"><span>Level</span><strong id="level">1</strong></div>
        <div class="stat"><span>Combo</span><strong id="combo">0</strong></div>
      </section>

      <section class="box">
        <h2>Controls</h2>
        <div id="controls">
          <button data-action="left" aria-label="Move left">←</button>
          <button data-action="right" aria-label="Move right">→</button>
          <button data-action="cw" aria-label="Rotate clockwise">⟳</button>
          <button data-action="ccw" aria-label="Rotate counter-clockwise">⟲</button>
          <button data-action="soft" aria-label="Soft drop">↓</button>
          <button data-action="hard" aria-label="Hard drop">⇓</button>
          <button data-action="hold" aria-label="Hold">⇧</button>
        </div>
      </section>

      <div class="button-row">
        <button id="pause">Pause</button>
        <button id="restart">Restart</button>
      </div>
      <div class="button-row">
        <button id="autoplay" aria-pressed="false">Autoplay</button>
        <button id="mute" aria-pressed="false">Mute</button>
      </div>
    </aside>

    <main id="stage">
      <div id="boardWrap">
        <canvas id="board" width="360" height="720"></canvas>
        <div id="overlay" data-state="playing">
          <div id="overlayMessage"></div>
        </div>
      </div>
    </main>

    <aside class="panel right" id="rightPanel">
      <section class="box">
        <h2>Best</h2>
        <div class="stat"><span>Score</span><strong id="best">0</strong></div>
      </section>

      <section class="box">
        <h2>Seed</h2>
        <div class="stat"><span>Current</span><strong id="seedDisplay">0</strong></div>
      </section>

      <section class="box">
        <h2>Performance</h2>
        <div class="stat"><span>FPS</span><strong id="fps">60</strong></div>
      </section>

      <section class="box">
        <h2>Keys</h2>
        <div class="hint">
          <div><span class="kbd">←</span><span class="kbd">→</span> move</div>
          <div><span class="kbd">↓</span> soft drop · <span class="kbd">Space</span> hard drop</div>
          <div><span class="kbd">↑</span>/<span class="kbd">X</span> rotate · <span class="kbd">Z</span>/<span class="kbd">Ctrl</span> rotate</div>
          <div><span class="kbd">C</span>/<span class="kbd">Shift</span> hold</div>
          <div><span class="kbd">P</span>/<span class="kbd">Esc</span> pause · <span class="kbd">R</span> restart</div>
        </div>
      </section>
    </aside>
  </div>

<script>
(function () {
  "use strict";

  const COLS = 10;
  const ROWS = 20;
  const DEFAULT_SEED = 20240401;

  const LETTERS = ["I", "J", "L", "O", "S", "T", "Z"];
  const PIECE_IDS = { I: 1, J: 2, L: 3, O: 4, S: 5, T: 6, Z: 7 };
  const ID_TO_LETTER = { 1: "I", 2: "J", 3: "L", 4: "O", 5: "S", 6: "T", 7: "Z" };
  const PIECE_COLORS = {
    I: "#4cc9f0",
    J: "#60a5fa",
    L: "#fb923c",
    O: "#facc15",
    S: "#4ade80",
    T: "#c084fc",
    Z: "#f87171"
  };
  const PIECE_SIZE = { I: 4, J: 3, L: 3, O: 2, S: 3, T: 3, Z: 3 };
  const SPAWN_X = { I: 3, J: 3, L: 3, O: 4, S: 3, T: 3, Z: 3 };

  const LINE_BASE = [0, 100, 300, 500, 800];
  const FULL_T = [400, 800, 1200, 1600];
  const MINI_T = [100, 200, 400, 400];
  const PC_VALUES = [0, 800, 1200, 1800, 2000];

  const ACTION_CODE = { left: 0, right: 1, cw: 2, ccw: 3, soft: 4, hard: 5, hold: 6 };
  const CODE_ACTION = ["left", "right", "cw", "ccw", "soft", "hard", "hold"];

  function sortCells(cells) {
    return cells.slice().sort((a, b) => (a[1] - b[1]) || (a[0] - b[0]));
  }

  function rotateCells(cells, size, dir) {
    return cells.map(([x, y]) => dir === 1 ? [size - 1 - y, x] : [y, size - 1 - x]);
  }

  function makeRotations(base, size) {
    const out = [sortCells(base)];
    for (let r = 1; r < 4; r++) out.push(sortCells(rotateCells(out[r - 1], size, 1)));
    return out;
  }

  const PIECE_CELLS = {
    I: makeRotations([[0, 1], [1, 1], [2, 1], [3, 1]], 4),
    J: makeRotations([[0, 0], [0, 1], [1, 1], [2, 1]], 3),
    L: makeRotations([[2, 0], [0, 1], [1, 1], [2, 1]], 3),
    S: makeRotations([[1, 0], [2, 0], [0, 1], [1, 1]], 3),
    T: makeRotations([[1, 0], [0, 1], [1, 1], [2, 1]], 3),
    Z: makeRotations([[0, 0], [1, 0], [1, 1], [2, 1]], 3),
    O: [sortCells([[0, 0], [1, 0], [0, 1], [1, 1]])]
  };
  PIECE_CELLS.O = [PIECE_CELLS.O[0], PIECE_CELLS.O[0], PIECE_CELLS.O[0], PIECE_CELLS.O[0]];

  const KICKS_COMMON = {
    "0>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "1>0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    "1>2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    "2>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "2>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    "3>2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "3>0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "0>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]
  };

  const KICKS_I = {
    "0>1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
    "1>0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
    "1>2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
    "2>1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
    "2>3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
    "3>2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
    "3>0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
    "0>3": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]]
  };

  let board = new Uint8Array(ROWS * COLS);
  let phase = "playing";
  let score = 0;
  let lines = 0;
  let level = 1;
  let combo = 0;
  let b2b = false;
  let lastSpin = "none";
  let holdPiece = "none";
  let queue = [];
  let rng;
  let currentSeed = DEFAULT_SEED;
  let active = null;
  let lastAction = "spawn";
  let lastSpawnedType = "I";

  let simTime = 0;
  let pendingMs = 0;
  let lastReal = performance.now();
  let gravityMs = 1000;
  let gravityTimer = 0;

  let best = 0;
  let muted = false;
  let autoplayEnabled = false;
  let importing = false;

  let replayEvents = [];
  let effects = [];
  let shake = null;
  let renderDirty = false;

  let audioCtx = null;
  let masterGain = null;

  const heldKeys = new Map();
  const buttonRepeats = new Map();

  let fpsFrames = 0;
  let fpsLast = performance.now();

  let canvas = null;
  let ctx = null;
  let cellSize = 18;
  let boardW = 180;
  let boardH = 360;
  let dpr = 1;

  let pauseButton = null;
  let restartButton = null;
  let autoplayButton = null;
  let muteButton = null;
  let scoreEl = null;
  let linesEl = null;
  let levelEl = null;
  let comboEl = null;
  let bestEl = null;
  let seedEl = null;
  let fpsEl = null;
  let overlayEl = null;
  let overlayMessageEl = null;
  let holdEl = null;
  let nextEl = null;

  function mulberry32(a) {
    a = a >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function ensureQueue(n) {
    while (queue.length < n) fillBag();
  }

  function fillBag() {
    const bag = LETTERS.slice();
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = bag[i];
      bag[i] = bag[j];
      bag[j] = t;
    }
    for (let i = 0; i < bag.length; i++) queue.push(bag[i]);
  }

  function canPlace(type, rot, x, y) {
    const cells = PIECE_CELLS[type] && PIECE_CELLS[type][rot];
    if (!cells) return false;
    for (let i = 0; i < cells.length; i++) {
      const cx = x + cells[i][0];
      const cy = y + cells[i][1];
      if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return false;
      if (board[cy * COLS + cx] !== 0) return false;
    }
    return true;
  }

  function makeActive(type) {
    return {
      type: type,
      rot: 0,
      x: SPAWN_X[type] === undefined ? 3 : SPAWN_X[type],
      y: 0,
      holdUsed: false,
      resting: false,
      restTimer: 0,
      restResets: 0
    };
  }

  function spawnFromQueue() {
    ensureQueue(1);
    const type = queue.shift();
    lastSpawnedType = type;
    active = makeActive(type);
    lastAction = "spawn";

    if (!canPlace(active.type, active.rot, active.x, active.y)) {
      active = null;
      gameOver();
      return;
    }

    updateLockState();
    updateHoldNext();
  }

  function updateLockState() {
    if (!active) return;
    const grounded = !canPlace(active.type, active.rot, active.x, active.y + 1);
    if (grounded) {
      if (active.restResets >= 15) {
        lockActive();
        return;
      }
      if (!active.resting) {
        active.resting = true;
        active.restTimer = 500;
      } else {
        active.restResets++;
        active.restTimer = 500;
      }
    } else {
      active.resting = false;
      active.restTimer = 0;
    }
  }

  function applyGravityStep() {
    gravityTimer = 0;
    if (!active) return;

    if (canPlace(active.type, active.rot, active.x, active.y + 1)) {
      active.y++;
      lastAction = "move";
      if (!canPlace(active.type, active.rot, active.x, active.y + 1)) {
        if (active.restResets >= 15) {
          lockActive();
        } else {
          active.resting = true;
          active.restTimer = 500;
        }
      } else {
        active.resting = false;
        active.restTimer = 0;
      }
    } else {
      if (!active.resting) {
        if (active.restResets >= 15) {
          lockActive();
        } else {
          active.resting = true;
          active.restTimer = 500;
        }
      }
    }
  }

  function advance(elapsed) {
    if (elapsed <= 0) return;
    if (phase !== "playing" || !active) {
      simTime += elapsed;
      return;
    }

    let remaining = elapsed;
    while (remaining > 0) {
      if (phase !== "playing" || !active) {
        simTime += remaining;
        return;
      }

      if (active.resting && active.restTimer <= 0) {
        lockActive();
        continue;
      }

      if (gravityTimer >= gravityMs) {
        applyGravityStep();
        continue;
      }

      let step = remaining;
      if (active.resting) step = Math.min(step, active.restTimer);
      step = Math.min(step, gravityMs - gravityTimer);
      if (step <= 0) step = Math.min(remaining, 1);

      active.restTimer -= step;
      gravityTimer += step;
      simTime += step;
      remaining -= step;

      if (gravityTimer >= gravityMs) applyGravityStep();
      if (phase === "playing" && active && active.resting && active.restTimer <= 0) lockActive();
    }
  }

  function occupiedAt(arr, x, y) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
    return arr[y * COLS + x] !== 0;
  }

  function detectSpinOnBoard(arr, type, rot, x, y) {
    if (type !== "T") return "none";
    const cx = x + 1;
    const cy = y + 1;

    const ul = occupiedAt(arr, cx - 1, cy - 1);
    const ur = occupiedAt(arr, cx + 1, cy - 1);
    const dl = occupiedAt(arr, cx - 1, cy + 1);
    const dr = occupiedAt(arr, cx + 1, cy + 1);

    let count = 0;
    if (ul) count++;
    if (ur) count++;
    if (dl) count++;
    if (dr) count++;
    if (count < 3) return "none";

    let front1 = false, front2 = false;
    if (rot === 0) {
      front1 = ul;
      front2 = ur;
    } else if (rot === 1) {
      front1 = ur;
      front2 = dr;
    } else if (rot === 2) {
      front1 = dl;
      front2 = dr;
    } else {
      front1 = ul;
      front2 = dl;
    }

    return (front1 && front2) ? "full" : "mini";
  }

  function detectSpin() {
    if (!active || lastAction !== "rotate") return "none";
    return detectSpinOnBoard(board, active.type, active.rot, active.x, active.y);
  }

  function isBoardEmpty() {
    for (let i = 0; i < board.length; i++) if (board[i] !== 0) return false;
    return true;
  }

  function removeRows(fullRows) {
    const nb = new Uint8Array(board.length);
    let dest = ROWS - 1;
    const fullSet = new Set(fullRows);
    for (let r = ROWS - 1; r >= 0; r--) {
      if (fullSet.has(r)) continue;
      const src = r * COLS;
      const dst = dest * COLS;
      for (let c = 0; c < COLS; c++) nb[dst + c] = board[src + c];
      dest--;
    }
    board = nb;
  }

  function removeRowsInArray(arr, fullRows) {
    const nb = new Uint8Array(arr.length);
    let dest = ROWS - 1;
    const fullSet = new Set(fullRows);
    for (let r = ROWS - 1; r >= 0; r--) {
      if (fullSet.has(r)) continue;
      const src = r * COLS;
      const dst = dest * COLS;
      for (let c = 0; c < COLS; c++) nb[dst + c] = arr[src + c];
      dest--;
    }
    arr.set(nb);
  }

  function addScore(amount) {
    if (amount === 0) return;
    score += amount;
    if (score > best) {
      best = score;
      saveBest();
    }
    updateHUD();
  }

  function lockActive() {
    if (!active) return;

    const cells = PIECE_CELLS[active.type][active.rot];
    const id = PIECE_IDS[active.type];
    const placed = [];

    for (let i = 0; i < cells.length; i++) {
      const cx = active.x + cells[i][0];
      const cy = active.y + cells[i][1];
      if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) continue;
      board[cy * COLS + cx] = id;
      placed.push([cx, cy]);
    }

    addLockEffect(placed, PIECE_COLORS[active.type]);
    playLock();

    const spin = detectSpin();
    lastSpin = spin;

    const fullRows = [];
    for (let r = 0; r < ROWS; r++) {
      let full = true;
      for (let c = 0; c < COLS; c++) {
        if (board[r * COLS + c] === 0) {
          full = false;
          break;
        }
      }
      if (full) fullRows.push(r);
    }

    const cleared = fullRows.length;
    const oldLevel = level;
    const prevB2B = b2b;

    let base = 0;
    if (spin !== "none") {
      const arr = spin === "full" ? FULL_T : MINI_T;
      base = arr[Math.min(cleared, arr.length - 1)];
    } else if (cleared > 0) {
      base = LINE_BASE[Math.min(cleared, LINE_BASE.length - 1)];
    }

    const difficult = cleared === 4 || spin !== "none";
    if (difficult && prevB2B) base = Math.round(base * 1.5);
    if (difficult) b2b = true;
    else if (cleared > 0) b2b = false;

    if (cleared > 0) combo++;
    else combo = 0;

    let gained = base * level;
    if (cleared > 0 && combo >= 2) gained += 50 * (combo - 1) * level;

    if (cleared > 0) removeRows(fullRows);

    let perfect = false;
    if (cleared > 0 && isBoardEmpty()) {
      perfect = true;
      gained += PC_VALUES[Math.min(cleared, 4)] * level;
    }

    if (gained !== 0) addScore(gained);

    if (cleared > 0) lines += cleared;
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel !== level) {
      level = newLevel;
      gravityMs = gravityForLevel(level);
      gravityTimer = Math.min(gravityTimer, gravityMs);
    }

    if (cleared > 0) {
      addLineEffect(fullRows, cleared, spin);
      announceClear(cleared, spin, perfect, combo, newLevel > oldLevel ? level : 0);
      addShake(2 + cleared * 1.1 + (spin !== "none" ? 1.5 : 0) + (perfect ? 1.5 : 0), 190 + cleared * 28);
    }

    playClear(cleared, spin);
    if (perfect) playPerfect();
    if (newLevel > oldLevel) playLevelUp();

    spawnFromQueue();
    renderDirty = true;
  }

  function gravityForLevel(lvl) {
    return Math.max(50, Math.round(1000 * Math.pow(0.8, lvl - 1)));
  }

  function gameOver() {
    phase = "over";
    active = null;
    combo = 0;
    pendingMs = 0;
    lastReal = performance.now();
    addText("GAME OVER", "#f87171", 1300);
    playGameOver();
    saveBest();
    updateOverlay();
    updatePauseButton();
    updateHUD();
    updateHoldNext();
    renderDirty = true;
  }

  function tryMove(dx) {
    if (!active) return false;
    const nx = active.x + dx;
    if (!canPlace(active.type, active.rot, nx, active.y)) return false;
    active.x = nx;
    lastAction = "move";
    playMove();
    updateLockState();
    return true;
  }

  function tryRotate(dir) {
    if (!active) return false;
    if (!canPlace(active.type, active.rot, active.x, active.y)) return false;

    if (active.type === "O") {
      lastAction = "rotate";
      playRotate();
      updateLockState();
      return true;
    }

    const from = active.rot;
    const to = dir === 1 ? (from + 1) % 4 : (from + 3) % 4;
    const table = active.type === "I" ? KICKS_I : KICKS_COMMON;
    const kicks = table[from + ">" + to] || [];

    for (let i = 0; i < kicks.length; i++) {
      const dx = kicks[i][0];
      const dy = kicks[i][1];
      const nx = active.x + dx;
      const ny = active.y + dy;
      if (canPlace(active.type, to, nx, ny)) {
        active.x = nx;
        active.y = ny;
        active.rot = to;
        lastAction = "rotate";
        playRotate();
        updateLockState();
        return true;
      }
    }
    return false;
  }

  function trySoft() {
    if (!active) return false;
    if (!canPlace(active.type, active.rot, active.x, active.y + 1)) return false;
    active.y++;
    lastAction = "move";
    playMove();
    addScore(1);
    updateLockState();
    return true;
  }

  function tryHard() {
    if (!active) return false;
    const start = active.y;
    let target = active.y;
    while (canPlace(active.type, active.rot, active.x, target + 1)) target++;

    if (target !== start) {
      active.y = target;
      addScore(2 * (target - start));
      playHardDrop();
    }

    lockActive();
    return true;
  }

  function tryHold() {
    if (!active) return false;
    if (active.holdUsed) return false;

    const oldType = active.type;
    if (holdPiece === "none") {
      holdPiece = oldType;
      spawnFromQueue();
      playHold();
      return true;
    }

    const swapped = holdPiece;
    holdPiece = oldType;
    active = makeActive(swapped);
    lastSpawnedType = swapped;
    lastAction = "spawn";

    if (!canPlace(active.type, active.rot, active.x, active.y)) {
      active = null;
      gameOver();
      playHold();
      return true;
    }

    playHold();
    updateLockState();
    updateHoldNext();
    return true;
  }

  function recordReplay(action) {
    if (importing) return;
    const code = ACTION_CODE[action];
    if (code === undefined) return;
    replayEvents.push({ t: simTime, c: code });
  }

  function applyInput(action) {
    if (phase !== "playing" || !active) return false;

    let changed = false;
    if (action === "left") changed = tryMove(-1);
    else if (action === "right") changed = tryMove(1);
    else if (action === "cw") changed = tryRotate(1);
    else if (action === "ccw") changed = tryRotate(-1);
    else if (action === "soft") changed = trySoft();
    else if (action === "hard") changed = tryHard();
    else if (action === "hold") changed = tryHold();
    else return false;

    if (changed) {
      recordReplay(action);
      updateHUD();
      renderDirty = true;
    }
    return changed;
  }

  function resetInternal(seed) {
    if (seed !== undefined && seed !== null) {
      const n = Number(seed);
      currentSeed = isFinite(n) ? n : 0;
    }

    rng = mulberry32(currentSeed);
    board = new Uint8Array(ROWS * COLS);
    phase = "playing";
    score = 0;
    lines = 0;
    level = 1;
    combo = 0;
    b2b = false;
    lastSpin = "none";
    holdPiece = "none";
    queue = [];
    active = null;
    lastAction = "spawn";
    lastSpawnedType = "I";

    simTime = 0;
    pendingMs = 0;
    lastReal = performance.now();
    gravityMs = gravityForLevel(level);
    gravityTimer = 0;

    effects = [];
    shake = null;
    replayEvents = [];

    ensureQueue(5);
    spawnFromQueue();

    updateHUD();
    updateSeed();
    updateOverlay();
    updatePauseButton();
    updateHoldNext();
    renderDirty = true;
  }

  function setBoardAPI(cells) {
    const nb = new Uint8Array(ROWS * COLS);
    const src = cells || [];
    for (let i = 0; i < 200; i++) {
      nb[i] = cellValue(src[i]);
    }
    board = nb;

    const type = active ? active.type : (lastSpawnedType || "I");
    active = makeActive(type);
    active.holdUsed = false;
    lastAction = "spawn";
    updateLockState();
    renderDirty = true;
  }

  function cellValue(v) {
    if (typeof v === "number") {
      if (!isFinite(v)) return 0;
      v = Math.trunc(v);
      if (v < 0) return 0;
      if (v > 7) return 7;
      return v;
    }
    if (typeof v === "string") {
      const up = v.toUpperCase();
      if (PIECE_IDS[up] !== undefined) return PIECE_IDS[up];
      const n = Number(v);
      if (!isFinite(n)) return 0;
      return cellValue(n);
    }
    return 0;
  }

  function spawnAPI(type, x, y) {
    type = String(type || "").toUpperCase();
    if (!PIECE_CELLS[type]) return false;

    let x2 = Number(x);
    let y2 = Number(y);
    if (!isFinite(x2)) x2 = SPAWN_X[type];
    if (!isFinite(y2)) y2 = 0;
    x2 = Math.trunc(x2);
    y2 = Math.trunc(y2);

    const cells = PIECE_CELLS[type][0];
    for (let i = 0; i < cells.length; i++) {
      const cx = x2 + cells[i][0];
      const cy = y2 + cells[i][1];
      if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return false;
    }

    active = {
      type: type,
      rot: 0,
      x: x2,
      y: y2,
      holdUsed: false,
      resting: false,
      restTimer: 0,
      restResets: 0
    };
    lastSpawnedType = type;
    lastAction = "spawn";
    updateLockState();
    renderDirty = true;
    return true;
  }

  function setLinesAPI(n) {
    const num = Number(n);
    if (!isFinite(num)) return;
    lines = Math.max(0, Math.floor(num));
    level = Math.floor(lines / 10) + 1;
    gravityMs = gravityForLevel(level);
    gravityTimer = Math.min(gravityTimer, gravityMs);
    updateHUD();
  }

  function advanceReal(now) {
    if (phase !== "playing") {
      lastReal = now;
      pendingMs = 0;
      return;
    }

    let delta = now - lastReal;
    if (delta < 0) delta = 0;
    if (delta > 100) delta = 100;

    pendingMs += delta;
    const whole = Math.floor(pendingMs);
    if (whole > 0) {
      pendingMs -= whole;
      advance(whole);
    }
    lastReal = now;
  }

  function exportReplay() {
    let ev = "";
    for (let i = 0; i < replayEvents.length; i++) {
      if (i > 0) ev += ";";
      ev += replayEvents[i].t + ":" + replayEvents[i].c;
    }
    return "1|" + currentSeed + "|" + simTime + "|" + ev;
  }

  function importReplay(str) {
    const oldAutoplay = autoplayEnabled;
    autoplayEnabled = false;
    importing = true;

    try {
      const parts = String(str || "").split("|");
      const seedPart = parts[1];
      const endPart = parts[2];
      const evPart = parts.length > 3 ? parts[3] : "";

      const seed = seedPart === undefined || seedPart === "" ? undefined : Number(seedPart);
      const end = Number(endPart);

      resetInternal(isFinite(seed) ? seed : undefined);

      const parsed = [];
      if (evPart) {
        const items = evPart.split(";");
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item) continue;
          const [tStr, cStr] = item.split(":");
          const t = Number(tStr);
          const c = Number(cStr);
          if (!isFinite(t) || !isFinite(c)) continue;
          parsed.push({ t: t, c: c });

          if (t > simTime) advance(t - simTime);
          if (c >= 0 && c < CODE_ACTION.length) applyInput(CODE_ACTION[c]);
        }
      }

      if (isFinite(end) && end > simTime) advance(end - simTime);

      replayEvents = parsed;
      lastReal = performance.now();
      pendingMs = 0;
    } catch (e) {
      resetInternal(currentSeed);
      replayEvents = [];
    } finally {
      importing = false;
      autoplayEnabled = oldAutoplay;
      updateAutoplayButton();
      render(performance.now());
    }
  }

  function ghostPosition() {
    if (!active) return null;
    let y = active.y;
    while (canPlace(active.type, active.rot, active.x, y + 1)) y++;
    return { x: active.x, y: y, rot: active.rot };
  }

  function ghostTopRow() {
    const gp = ghostPosition();
    if (!gp) return -1;
    const cells = PIECE_CELLS[active.type][gp.rot];
    let min = 999;
    for (let i = 0; i < cells.length; i++) if (cells[i][1] < min) min = cells[i][1];
    return gp.y + min;
  }

  function pieceCellsAbsolute(piece) {
    const cells = PIECE_CELLS[piece.type][piece.rot];
    const out = [];
    for (let i = 0; i < cells.length; i++) {
      out.push([piece.x + cells[i][0], piece.y + cells[i][1]]);
    }
    return out;
  }

  /* ----- DOM / UI ----- */

  function updateHUD() {
    if (scoreEl) scoreEl.textContent = String(score);
    if (linesEl) linesEl.textContent = String(lines);
    if (levelEl) levelEl.textContent = String(level);
    if (comboEl) comboEl.textContent = String(combo);
    if (bestEl) bestEl.textContent = String(best);
  }

  function updateSeed() {
    if (seedEl) seedEl.textContent = String(currentSeed);
  }

  function updateOverlay() {
    if (!overlayEl) return;
    overlayEl.dataset.state = phase;
    if (overlayMessageEl) {
      if (phase === "paused") overlayMessageEl.textContent = "Paused";
      else if (phase === "over") overlayMessageEl.textContent = "Game Over";
      else overlayMessageEl.textContent = "";
    }
  }

  function updatePauseButton() {
    if (!pauseButton) return;
    pauseButton.textContent = phase === "paused" ? "Resume" : "Pause";
  }

  function updateMuteButton() {
    if (!muteButton) return;
    muteButton.setAttribute("aria-pressed", muted ? "true" : "false");
    muteButton.textContent = muted ? "Muted" : "Mute";
  }

  function updateAutoplayButton() {
    if (!autoplayButton) return;
    autoplayButton.setAttribute("aria-pressed", autoplayEnabled ? "true" : "false");
    autoplayButton.textContent = autoplayEnabled ? "Autoplay On" : "Autoplay";
  }

  function updateFPS(now) {
    fpsFrames++;
    if (now - fpsLast >= 750) {
      const fps = Math.round(fpsFrames * 1000 / (now - fpsLast));
      fpsFrames = 0;
      fpsLast = now;
      if (fpsEl) fpsEl.textContent = String(fps);
    }
  }

  function piecePreview(type) {
    if (!type || type === "none") return '<span class="empty">–</span>';
    const size = PIECE_SIZE[type] || 3;
    const cells = PIECE_CELLS[type] && PIECE_CELLS[type][0] ? PIECE_CELLS[type][0] : [];
    const filled = new Uint8Array(size * size);
    for (let i = 0; i < cells.length; i++) {
      const dx = cells[i][0];
      const dy = cells[i][1];
      if (dx >= 0 && dx < size && dy >= 0 && dy < size) filled[dy * size + dx] = 1;
    }

    let html = '<div class="pv" style="grid-template-columns: repeat(' + size + ', var(--pv-cell));">';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        html += filled[r * size + c]
          ? '<i class="p p-' + type + '"></i>'
          : '<i></i>';
      }
    }
    html += '</div>';
    return html;
  }

  function updateHoldNext() {
    if (holdEl) {
      holdEl.dataset.piece = holdPiece;
      holdEl.innerHTML = piecePreview(holdPiece);
    }

    if (!nextEl) return;
    ensureQueue(5);

    let previews = nextEl.querySelectorAll("[data-preview]");
    if (previews.length < 5) {
      while (previews.length < 5) {
        const p = document.createElement("div");
        p.className = "preview";
        p.dataset.preview = String(previews.length);
        p.dataset.piece = "none";
        nextEl.appendChild(p);
        previews = nextEl.querySelectorAll("[data-preview]");
      }
    }

    for (let i = 0; i < 5; i++) {
      const preview = previews[i];
      if (!preview) continue;
      const type = queue[i] || "none";
      preview.dataset.piece = type;
      preview.innerHTML = piecePreview(type);
    }
  }

  /* ----- Persistence ----- */

  function loadSettings() {
    try {
      const raw = localStorage.getItem("tessera.settings");
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && typeof obj.mute === "boolean") muted = obj.mute;
      }
    } catch (e) {
      muted = false;
    }
    updateMuteButton();
    saveSettings();
  }

  function saveSettings() {
    try {
      localStorage.setItem("tessera.settings", JSON.stringify({
        mute: muted,
        autoplay: autoplayEnabled,
        seed: currentSeed
      }));
    } catch (e) {}
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem("tessera.best");
      const n = Number(raw);
      best = isFinite(n) ? n : 0;
    } catch (e) {
      best = 0;
    }
    saveBest();
  }

  function saveBest() {
    try {
      localStorage.setItem("tessera.best", String(best));
    } catch (e) {}
    if (bestEl) bestEl.textContent = String(best);
  }

  function setMuted(val) {
    muted = !!val;
    ensureAudio();
    if (audioCtx && masterGain) {
      try {
        masterGain.gain.setTargetAtTime(muted ? 0 : 0.25, audioCtx.currentTime, 0.01);
      } catch (e) {}
    }
    updateMuteButton();
    saveSettings();
  }

  /* ----- Audio ----- */

  function ensureAudio() {
    if (audioCtx) {
      try {
        if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
      } catch (e) {}
      return;
    }

    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    try {
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = muted ? 0 : 0.25;
      masterGain.connect(audioCtx.destination);
      if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    } catch (e) {
      audioCtx = null;
      masterGain = null;
    }
  }

  function playTone(freq, opts) {
    if (!audioCtx || !masterGain || muted) return;
    try {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const now = audioCtx.currentTime;
      const delay = opts.delay || 0;
      const dur = Math.max(0.02, opts.dur || 0.08);
      const vol = Math.max(0.0008, opts.vol || 0.1);
      const attack = Math.min(opts.attack === undefined ? 0.004 : opts.attack, dur * 0.4);
      const start = now + delay;

      o.type = opts.type || "sine";
      o.frequency.setValueAtTime(freq, start);
      if (opts.glideTo && opts.glideTo > 0) {
        o.frequency.exponentialRampToValueAtTime(opts.glideTo, start + dur);
      }

      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(vol, start + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      o.connect(g);
      g.connect(masterGain);
      o.start(start);
      o.stop(start + dur + 0.03);
    } catch (e) {}
  }

  function playMove() {
    playTone(320, { dur: 0.032, type: "square", vol: 0.045, attack: 0.002 });
  }

  function playRotate() {
    playTone(560, { dur: 0.045, type: "triangle", vol: 0.055, glideTo: 640 });
  }

  function playHold() {
    playTone(700, { dur: 0.06, type: "sine", vol: 0.06, glideTo: 480 });
  }

  function playHardDrop() {
    playTone(640, { dur: 0.08, type: "triangle", vol: 0.06, glideTo: 190 });
  }

  function playLock() {
    playTone(110, { dur: 0.09, type: "square", vol: 0.11, glideTo: 70 });
    playTone(230, { delay: 0.015, dur: 0.04, type: "triangle", vol: 0.035 });
  }

  function playClear(count, spin) {
    if (!audioCtx || muted) return;
    if (spin !== "none") {
      const notes = spin === "full" ? [349, 440, 523, 659] : [294, 349, 440];
      for (let i = 0; i < notes.length; i++) {
        playTone(notes[i], { delay: i * 0.04, dur: 0.18, type: "sine", vol: 0.105 });
      }
      return;
    }

    if (count === 4) {
      const notes = [523, 659, 784, 1047];
      for (let i = 0; i < notes.length; i++) {
        playTone(notes[i], { delay: i * 0.025, dur: 0.26, type: "triangle", vol: 0.13 });
      }
      playTone(392, { dur: 0.32, type: "sine", vol: 0.08 });
      return;
    }

    for (let i = 0; i < count; i++) {
      playTone(310 + i * 100, { delay: i * 0.045, dur: 0.15, type: "square", vol: 0.085 });
    }
  }

  function playLevelUp() {
    if (!audioCtx || muted) return;
    const notes = [440, 554, 659];
    for (let i = 0; i < notes.length; i++) {
      playTone(notes[i], { delay: i * 0.06, dur: 0.18, type: "sine", vol: 0.075 });
    }
  }

  function playPerfect() {
    if (!audioCtx || muted) return;
    const notes = [659, 784, 880, 1047];
    for (let i = 0; i < notes.length; i++) {
      playTone(notes[i], { delay: i * 0.03, dur: 0.24, type: "triangle", vol: 0.1 });
    }
  }

  function playGameOver() {
    if (!audioCtx || muted) return;
    const notes = [392, 311, 247, 196];
    for (let i = 0; i < notes.length; i++) {
      playTone(notes[i], { delay: i * 0.12, dur: 0.34, type: "sawtooth", vol: 0.075 });
    }
  }

  /* ----- Visual effects ----- */

  function trimEffects() {
    if (effects.length > 90) effects.splice(0, effects.length - 90);
  }

  function addLockEffect(cells, color) {
    effects.push({ kind: "lock", cells: cells.slice(), color: color, start: performance.now(), duration: 180 });
    trimEffects();
  }

  function addLineEffect(rows, cleared, spin) {
    const color = cleared === 4 ? "#fff7c4" : (spin !== "none" ? "#c084fc" : "#7dd3fc");
    effects.push({ kind: "lines", rows: rows.slice(), color: color, start: performance.now(), duration: 240 + cleared * 35 });
    trimEffects();
  }

  function addText(text, color, duration) {
    if (!text) return;
    effects.push({ kind: "text", text: text, color: color, start: performance.now(), duration: duration || 900 });
    trimEffects();
  }

  function announceClear(cleared, spin, perfect, comboNow, leveledTo) {
    let text = "";
    let color = "#ffffff";

    if (spin === "full") {
      text = "T-SPIN";
      color = "#c084fc";
    } else if (spin === "mini") {
      text = "T-SPIN MINI";
      color = "#c084fc";
    }

    if (cleared === 4) {
      text = (text ? text + " · " : "") + "TETRIS";
      color = "#fde047";
    } else if (cleared === 3) {
      text = (text ? text + " · " : "") + "TRIPLE";
      color = "#4cc9f0";
    } else if (cleared === 2) {
      text = (text ? text + " · " : "") + "DOUBLE";
      color = "#4cc9f0";
    }

    if (perfect) {
      text = (text ? text + " · " : "") + "PERFECT";
      color = "#4cc9f0";
    }

    if (comboNow >= 2) {
      text = (text ? text + " · " : "") + "COMBO ×" + comboNow;
      color = "#f472b6";
    }

    if (leveledTo > 0) {
      text = (text ? text + " · " : "") + "LEVEL " + leveledTo;
      color = "#34d399";
    }

    if (text) addText(text, color, 950);
  }

  function addShake(mag, duration) {
    const now = performance.now();
    if (!shake || now >= shake.until) {
      shake = { start: now, until: now + duration, duration: duration, mag: mag };
    } else {
      shake.mag = Math.max(shake.mag, mag);
      shake.until = Math.max(shake.until, now + duration);
      shake.start = now;
      shake.duration = duration;
    }
  }

  /* ----- Canvas rendering ----- */

  function resizeCanvas() {
    const stage = document.getElementById("stage");
    if (!stage || !canvas) return;

    dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const availW = stage.clientWidth || 320;
    const availH = stage.clientHeight || 640;
    let cell = Math.min(Math.floor(availW / COLS), Math.floor(availH / ROWS), 42);
    if (!isFinite(cell) || cell < 8) cell = 8;

    cellSize = cell;
    boardW = cellSize * COLS;
    boardH = cellSize * ROWS;

    canvas.style.width = boardW + "px";
    canvas.style.height = boardH + "px";
    canvas.width = Math.max(1, Math.round(boardW * dpr));
    canvas.height = Math.max(1, Math.round(boardH * dpr));

    ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render(performance.now());
  }

  function drawCell(col, row, color, alpha, glow) {
    if (!ctx) return;
    const x = col * cellSize;
    const y = row * cellSize;
    const inset = Math.max(1, cellSize * 0.12);
    const w = cellSize - 2 * inset;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
    }

    ctx.fillStyle = color;
    ctx.fillRect(x + inset, y + inset, w, w);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(x + inset, y + inset, w, Math.max(1, w * 0.32));

    ctx.fillStyle = "rgba(0,0,0,0.24)";
    ctx.fillRect(x + inset, y + inset + w * 0.68, w, Math.max(1, w * 0.32));

    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + inset + 0.5, y + inset + 0.5, Math.max(1, w - 1), Math.max(1, w - 1));

    ctx.restore();
  }

  function drawGhostCell(col, row, color) {
    if (!ctx) return;
    const x = col * cellSize;
    const y = row * cellSize;
    const inset = Math.max(1, cellSize * 0.16);
    const w = cellSize - 2 * inset;
    const lw = Math.max(1, cellSize * 0.11);

    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.fillStyle = color;
    ctx.fillRect(x + inset, y + inset, w, w);
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.strokeRect(x + inset, y + inset, w, w);
    ctx.restore();
  }

  function drawGrid() {
    if (!ctx) return;
    ctx.save();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.11)";
    ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellSize + 0.5, 0);
      ctx.lineTo(c * cellSize + 0.5, boardH);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellSize + 0.5);
      ctx.lineTo(boardW, r * cellSize + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEffects(now) {
    if (!ctx) return;
    for (let i = effects.length - 1; i >= 0; i--) {
      const e = effects[i];
      const p = (now - e.start) / e.duration;
      if (p < 0) continue;
      if (p > 1) {
        effects.splice(i, 1);
        continue;
      }

      if (e.kind === "lock") {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p);
        for (let j = 0; j < e.cells.length; j++) {
          const cx = e.cells[j][0];
          const cy = e.cells[j][1];
          if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) continue;
          const x = cx * cellSize;
          const y = cy * cellSize;
          const inset = Math.max(1, cellSize * 0.08);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x + inset, y + inset, cellSize - 2 * inset, cellSize - 2 * inset);
        }
        ctx.restore();
      } else if (e.kind === "lines") {
        ctx.save();
        for (let j = 0; j < e.rows.length; j++) {
          const r = e.rows[j];
          if (r < 0 || r >= ROWS) continue;
          const y = r * cellSize;
          ctx.globalAlpha = 0.62 * (1 - p);
          ctx.fillStyle = e.color;
          ctx.fillRect(0, y, boardW, cellSize);

          const band = Math.max(cellSize * 0.22, 3);
          let x = boardW * p - band / 2;
          if (x < 0) x = 0;
          if (x > boardW - band) x = boardW - band;
          ctx.globalAlpha = 0.92 * (1 - p);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x, y, band, cellSize);
        }
        ctx.restore();
      } else if (e.kind === "text") {
        ctx.save();
        const alpha = p < 0.35 ? p / 0.35 : (1 - p) / 0.65;
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const fontSize = Math.max(14, Math.min(cellSize * 1.25, (boardW * 1.35) / Math.max(1, String(e.text).length)));
        ctx.font = "800 " + fontSize + "px system-ui, -apple-system, sans-serif";
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 22;
        ctx.fillStyle = e.color;
        ctx.fillText(e.text, boardW / 2, boardH * 0.42);
        ctx.restore();
      }
    }
  }

  function render(now) {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, boardW, boardH);

    ctx.fillStyle = "#08111f";
    ctx.fillRect(0, 0, boardW, boardH);

    let ox = 0, oy = 0;
    if (shake) {
      const p = (now - shake.start) / shake.duration;
      if (p < 1) {
        const amp = shake.mag * (1 - p);
        ox = Math.sin(p * Math.PI * 13) * amp;
        oy = Math.cos(p * Math.PI * 11) * amp;
      } else {
        shake = null;
      }
    }

    ctx.save();
    ctx.translate(ox, oy);

    drawGrid();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = board[r * COLS + c];
        if (!v) continue;
        const letter = ID_TO_LETTER[v] || "I";
        drawCell(c, r, PIECE_COLORS[letter], 1, 0);
      }
    }

    if (active) {
      const gp = ghostPosition();
      if (gp) {
        const gCells = PIECE_CELLS[active.type][gp.rot];
        const gColor = PIECE_COLORS[active.type];
        for (let i = 0; i < gCells.length; i++) {
          const cx = gp.x + gCells[i][0];
          const cy = gp.y + gCells[i][1];
          if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) continue;
          drawGhostCell(cx, cy, gColor);
        }
      }

      const cells = PIECE_CELLS[active.type][active.rot];
      const color = PIECE_COLORS[active.type];
      const glow = Math.max(8, cellSize * 0.35);
      for (let i = 0; i < cells.length; i++) {
        const cx = active.x + cells[i][0];
        const cy = active.y + cells[i][1];
        if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) continue;
        drawCell(cx, cy, color, 1, glow);
      }
    }

    drawEffects(now);
    ctx.restore();

    renderDirty = false;
  }

  /* ----- Autoplay agent ----- */

  function simulateAction(type, state, action) {
    const x = state.x, y = state.y, rot = state.rot;

    if (action === "left") {
      if (canPlace(type, rot, x - 1, y)) return { x: x - 1, y: y, rot: rot };
      return null;
    }
    if (action === "right") {
      if (canPlace(type, rot, x + 1, y)) return { x: x + 1, y: y, rot: rot };
      return null;
    }
    if (action === "soft") {
      if (canPlace(type, rot, x, y + 1)) return { x: x, y: y + 1, rot: rot };
      return null;
    }
    if (action === "cw" || action === "ccw") {
      if (type === "O") return null;
      const dir = action === "cw" ? 1 : -1;
      const to = dir === 1 ? (rot + 1) % 4 : (rot + 3) % 4;
      const table = type === "I" ? KICKS_I : KICKS_COMMON;
      const kicks = table[rot + ">" + to] || [];
      for (let i = 0; i < kicks.length; i++) {
        const nx = x + kicks[i][0];
        const ny = y + kicks[i][1];
        if (canPlace(type, to, nx, ny)) return { x: nx, y: ny, rot: to };
      }
      return null;
    }
    return null;
  }

  function shapePenalty(nb) {
    let holes = 0;
    let aggregate = 0;
    let bumpiness = 0;
    let maxHeight = 0;
    let prevHeight = 0;

    for (let c = 0; c < COLS; c++) {
      let seen = false;
      let topFilled = ROWS;
      for (let r = 0; r < ROWS; r++) {
        const v = nb[r * COLS + c];
        if (v !== 0) {
          if (topFilled === ROWS) topFilled = r;
          seen = true;
        } else if (seen) {
          holes++;
        }
      }
      const height = topFilled === ROWS ? 0 : ROWS - topFilled;
      aggregate += height;
      if (height > maxHeight) maxHeight = height;
      if (c > 0) bumpiness += Math.abs(height - prevHeight);
      prevHeight = height;
    }

    let score = 0;
    score -= holes * 1150;
    score -= aggregate * 22;
    score -= bumpiness * 18;
    if (maxHeight >= 16) score -= 18000;
    if (maxHeight >= 18) score -= 55000;
    return score;
  }

  function evaluateHardFromState(type, rot, x, y) {
    if (!canPlace(type, rot, x, y)) return -1e9;

    let fy = y;
    while (canPlace(type, rot, x, fy + 1)) fy++;

    const nb = Uint8Array.from(board);
    const cells = PIECE_CELLS[type][rot];
    for (let i = 0; i < cells.length; i++) {
      const cx = x + cells[i][0];
      const cy = fy + cells[i][1];
      if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return -1e9;
      nb[cy * COLS + cx] = PIECE_IDS[type];
    }

    const spin = detectSpinOnBoard(nb, type, rot, x, fy);

    const fullRows = [];
    for (let r = 0; r < ROWS; r++) {
      let full = true;
      for (let c = 0; c < COLS; c++) {
        if (nb[r * COLS + c] === 0) {
          full = false;
          break;
        }
      }
      if (full) fullRows.push(r);
    }

    let cleared = fullRows.length;
    let s = 0;

    if (cleared === 1) s += 105000;
    else if (cleared === 2) s += 145000;
    else if (cleared === 3) s += 185000;
    else if (cleared === 4) s += 260000;

    if (spin === "full") s += 22000 + cleared * 55000;
    else if (spin === "mini") s += 11000 + cleared * 36000;

    if (cleared > 0) removeRowsInArray(nb, fullRows);
    if (isBoardEmptyArray(nb)) s += 65000;

    s += shapePenalty(nb);
    return s;
  }

  function isBoardEmptyArray(arr) {
    for (let i = 0; i < arr.length; i++) if (arr[i] !== 0) return false;
    return true;
  }

  function planAutoplay() {
    if (!active) return [];
    const type = active.type;
    const startKey = active.x + "," + active.y + "," + active.rot;

    const visited = new Map();
    visited.set(startKey, {
      x: active.x,
      y: active.y,
      rot: active.rot,
      parent: null,
      action: null,
      depth: 0
    });

    const queue = [startKey];
    let bestKey = startKey;
    let bestScore = evaluateHardFromState(type, active.rot, active.x, active.y);

    const maxDepth = 15;
    const actionsList = ["left", "right", "cw", "ccw", "soft"];

    while (queue.length) {
      const key = queue.shift();
      const st = visited.get(key);

      if (st.depth >= maxDepth) continue;

      for (let i = 0; i < actionsList.length; i++) {
        const action = actionsList[i];
        const ns = simulateAction(type, st, action);
        if (!ns) continue;

        const nKey = ns.x + "," + ns.y + "," + ns.rot;
        if (visited.has(nKey)) continue;

        visited.set(nKey, {
          x: ns.x,
          y: ns.y,
          rot: ns.rot,
          parent: key,
          action: action,
          depth: st.depth + 1
        });

        queue.push(nKey);

        const sc = evaluateHardFromState(type, ns.rot, ns.x, ns.y);
        if (sc > bestScore || (sc === bestScore && visited.get(bestKey).depth > visited.get(nKey).depth)) {
          bestScore = sc;
          bestKey = nKey;
        }
      }
    }

    const actions = [];
    let k = bestKey;
    while (visited.has(k)) {
      const st = visited.get(k);
      if (!st || !st.parent) break;
      actions.push(st.action);
      k = st.parent;
    }
    return actions.reverse();
  }

  function autoplayTurn() {
    if (!active || phase !== "playing") return;
    const target = active;
    const actions = planAutoplay();

    for (let i = 0; i < actions.length; i++) {
      if (active !== target || phase !== "playing") return;
      const changed = applyInput(actions[i]);
      if (!changed) {
        if (active === target && phase === "playing") applyInput("hard");
        return;
      }
    }

    if (active === target && phase === "playing") applyInput("hard");
  }

  /* ----- Input handling ----- */

  function clearHeldKeys() {
    heldKeys.forEach(rec => {
      clearTimeout(rec.timeout);
      if (rec.interval) clearInterval(rec.interval);
    });
    heldKeys.clear();
  }

  function clearButtonRepeats() {
    buttonRepeats.forEach(rec => {
      clearTimeout(rec.first);
      if (rec.interval) clearInterval(rec.interval);
    });
    buttonRepeats.clear();
  }

  function applyRepeat(action) {
    const now = performance.now();
    advanceReal(now);
    if (phase === "playing") {
      applyInput(action);
      if (renderDirty) renderIfDirty();
    }
  }

  function startKeyRepeat(key, action) {
    stopKeyRepeat(key);
    const rec = { action: action };
    rec.timeout = setTimeout(() => {
      applyRepeat(action);
      rec.interval = setInterval(() => applyRepeat(action), 35);
    }, 150);
    heldKeys.set(key, rec);
  }

  function stopKeyRepeat(key) {
    const rec = heldKeys.get(key);
    if (!rec) return;
    clearTimeout(rec.timeout);
    if (rec.interval) clearInterval(rec.interval);
    heldKeys.delete(key);
  }

  function startButtonRepeat(btn, action) {
    stopButtonRepeat(btn);
    const rec = { action: action };
    rec.first = setTimeout(() => {
      applyRepeat(action);
      rec.interval = setInterval(() => applyRepeat(action), 35);
    }, 150);
    buttonRepeats.set(btn, rec);
  }

  function stopButtonRepeat(btn) {
    const rec = buttonRepeats.get(btn);
    if (!rec) return;
    clearTimeout(rec.first);
    if (rec.interval) clearInterval(rec.interval);
    buttonRepeats.delete(btn);
  }

  function togglePause() {
    ensureAudio();
    if (phase === "playing") {
      phase = "paused";
      pendingMs = 0;
      lastReal = performance.now();
    } else if (phase === "paused") {
      phase = "playing";
      pendingMs = 0;
      lastReal = performance.now();
    } else if (phase === "over") {
      resetInternal(currentSeed);
    }
    updateOverlay();
    updatePauseButton();
    renderDirty = true;
  }

  function onDocumentKeyDown(e) {
    ensureAudio();
    const now = performance.now();
    advanceReal(now);

    const k = e.key;
    if (k === " " || k === "Spacebar" || (typeof k === "string" && k.indexOf("Arrow") === 0)) {
      e.preventDefault();
    }

    if (k === " " || k === "Spacebar") {
      if (!e.repeat) applyInput("hard");
      if (renderDirty) renderIfDirty();
      return;
    }

    if (k === "ArrowLeft") {
      if (!e.repeat) {
        applyInput("left");
        startKeyRepeat(k, "left");
      }
      if (renderDirty) renderIfDirty();
      return;
    }

    if (k === "ArrowRight") {
      if (!e.repeat) {
        applyInput("right");
        startKeyRepeat(k, "right");
      }
      if (renderDirty) renderIfDirty();
      return;
    }

    if (k === "ArrowDown") {
      if (!e.repeat) {
        applyInput("soft");
        startKeyRepeat(k, "soft");
      }
      if (renderDirty) renderIfDirty();
      return;
    }

    if (k === "ArrowUp" || k === "x" || k === "X") {
      if (!e.repeat) applyInput("cw");
      if (renderDirty) renderIfDirty();
      return;
    }

    if (k === "z" || k === "Z" || k === "Control") {
      if (!e.repeat) applyInput("ccw");
      if (renderDirty) renderIfDirty();
      return;
    }

    if (k === "c" || k === "C" || k === "Shift") {
      if (!e.repeat) applyInput("hold");
      if (renderDirty) renderIfDirty();
      return;
    }

    if (k === "p" || k === "P" || k === "Escape") {
      if (!e.repeat) togglePause();
      return;
    }

    if (k === "r" || k === "R") {
      if (!e.repeat) {
        resetInternal(currentSeed);
        renderIfDirty();
      }
      return;
    }
  }

  function onDocumentKeyUp(e) {
    stopKeyRepeat(e.key);
  }

  function setupButtons() {
    const controls = document.getElementById("controls");
    if (!controls) return;

    const buttons = controls.querySelectorAll("button[data-action]");
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const action = btn.dataset.action;
      const repeatable = action === "left" || action === "right" || action === "soft";

      btn.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        ensureAudio();
        const now = performance.now();
        advanceReal(now);
        applyInput(action);
        if (renderDirty) renderIfDirty();

        if (repeatable) startButtonRepeat(btn, action);

        if (btn.setPointerCapture && e.pointerId !== undefined) {
          try { btn.setPointerCapture(e.pointerId); } catch (err) {}
        }
      });

      btn.addEventListener("pointerup", function () { stopButtonRepeat(btn); });
      btn.addEventListener("pointercancel", function () { stopButtonRepeat(btn); });
      btn.addEventListener("lostpointercapture", function () { stopButtonRepeat(btn); });
    }

    window.addEventListener("pointerup", function () { clearButtonRepeats(); });
    window.addEventListener("pointercancel", function () { clearButtonRepeats(); });

    if (pauseButton) {
      pauseButton.addEventListener("click", function () {
        ensureAudio();
        togglePause();
        renderIfDirty();
      });
    }

    if (restartButton) {
      restartButton.addEventListener("click", function () {
        ensureAudio();
        resetInternal(currentSeed);
        renderIfDirty();
      });
    }

    if (autoplayButton) {
      autoplayButton.addEventListener("click", function () {
        ensureAudio();
        autoplayEnabled = !autoplayEnabled;
        if (autoplayEnabled && phase === "over") resetInternal(currentSeed);
        updateAutoplayButton();
        saveSettings();
        renderIfDirty();
      });
    }

    if (muteButton) {
      muteButton.addEventListener("click", function () {
        ensureAudio();
        setMuted(!muted);
        renderIfDirty();
      });
    }
  }

  function renderIfDirty() {
    if (renderDirty || effects.length || shake) {
      render(performance.now());
      renderDirty = false;
    }
  }

  function frame(now) {
    if (document.visibilityState !== "visible") {
      lastReal = now;
      pendingMs = 0;
      requestAnimationFrame(frame);
      return;
    }

    advanceReal(now);

    if (autoplayEnabled && phase === "playing" && active) {
      autoplayTurn();
    }

    updateFPS(now);
    render(now);
    requestAnimationFrame(frame);
  }

  /* ----- Setup / API ----- */

  function initDomRefs() {
    canvas = document.getElementById("board");
    pauseButton = document.getElementById("pause");
    restartButton = document.getElementById("restart");
    autoplayButton = document.getElementById("autoplay");
    muteButton = document.getElementById("mute");
    scoreEl = document.getElementById("score");
    linesEl = document.getElementById("lines");
    levelEl = document.getElementById("level");
    comboEl = document.getElementById("combo");
    bestEl = document.getElementById("best");
    seedEl = document.getElementById("seedDisplay");
    fpsEl = document.getElementById("fps");
    overlayEl = document.getElementById("overlay");
    overlayMessageEl = document.getElementById("overlayMessage");
    holdEl = document.getElementById("hold");
    nextEl = document.getElementById("next");
  }

  function addGlobalListeners() {
    document.addEventListener("keydown", onDocumentKeyDown);
    document.addEventListener("keyup", onDocumentKeyUp);

    window.addEventListener("blur", function () {
      clearHeldKeys();
      clearButtonRepeats();
    });

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState !== "visible") {
        clearHeldKeys();
        clearButtonRepeats();
      }
      lastReal = performance.now();
      pendingMs = 0;
    });

    window.addEventListener("resize", resizeCanvas);
  }

  function init() {
    initDomRefs();
    loadSettings();
    loadBest();
    resizeCanvas();
    resetInternal(currentSeed);
    setupButtons();
    addGlobalListeners();
    updateAutoplayButton();
    requestAnimationFrame(frame);
  }

  window.__arena = {
    state: function () {
      ensureQueue(5);
      return {
        phase: phase,
        score: score,
        lines: lines,
        level: level,
        combo: combo,
        b2b: b2b,
        gravityMs: gravityMs,
        lastSpin: lastSpin,
        hold: holdPiece,
        next: queue.slice(0, 5),
        seed: currentSeed
      };
    },

    board: function () {
      return Array.from(board);
    },

    piece: function () {
      if (!active) return null;
      return {
        type: active.type,
        rot: active.rot,
        cells: pieceCellsAbsolute(active)
      };
    },

    ghostY: function () {
      return ghostTopRow();
    },

    input: function (action) {
      const res = applyInput(action);
      if (res) renderIfDirty();
      return res;
    },

    reset: function (seed) {
      resetInternal(seed);
      renderIfDirty();
    },

    setSeed: function (n) {
      const v = Number(n);
      currentSeed = isFinite(v) ? v : 0;
      updateSeed();
      saveSettings();
    },

    setBoard: function (cells) {
      setBoardAPI(cells);
      renderIfDirty();
    },

    spawn: function (type, x, y) {
      const ok = spawnAPI(type, x, y);
      if (ok) renderIfDirty();
      return ok;
    },

    setLines: function (n) {
      setLinesAPI(n);
    },

    exportReplay: exportReplay,
    importReplay: importReplay
  };

  init();
})();
</script>
</body>
</html>
```