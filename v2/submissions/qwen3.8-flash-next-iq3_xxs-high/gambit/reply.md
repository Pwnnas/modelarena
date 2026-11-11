```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gambit</title>
<style>
  :root {
    --board-size: 520px;
    --label-size: 34px;
    --light: #f0d9b5;
    --dark: #b27056;
    --ink: #e7e5df;
    --panel: #1d222b;
    --panel-2: #252c37;
    --frame: #2b313c;
    --gold: #ffc963;
  }

  html, body {
    height: 100%;
    margin: 0;
  }

  body {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    background: radial-gradient(900px 600px at 20% 10%, #181f28, #0d1014 60%);
    color: var(--ink);
    overflow: hidden;
  }

  #app {
    display: flex;
    height: 100vh;
    width: 100vw;
  }

  .board-area {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 22px;
  }

  #stage {
    position: relative;
    width: calc(var(--board-size) + var(--label-size));
    height: calc(var(--board-size) + var(--label-size));
  }

  #board {
    position: absolute;
    left: var(--label-size);
    top: var(--label-size);
    width: var(--board-size);
    height: var(--board-size);
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
    border-radius: 7px;
    overflow: hidden;
    background: var(--frame);
    box-shadow:
      0 18px 45px rgba(0,0,0,.38),
      0 2px 0 rgba(255,255,255,.06) inset;
  }

  .square {
    position: relative;
    user-select: none;
  }

  .square.light {
    background: var(--light);
  }

  .square.dark {
    background: var(--dark);
  }

  .square.selected {
    box-shadow: inset 0 0 0 4px rgba(255, 210, 92, .78);
  }

  .square.last {
    box-shadow: inset 0 0 0 4px rgba(255, 197, 82, .56);
  }

  .square.check {
    box-shadow:
      inset 0 0 0 4px rgba(216, 54, 54, .86),
      inset 0 0 28px rgba(216, 54, 54, .42);
  }

  .square.legal::after {
    content: "";
    position: absolute;
    inset: 50%;
    transform: translate(-50%, -50%);
    width: 30%;
    height: 30%;
    border-radius: 50%;
    background: rgba(30, 30, 30, .34);
    pointer-events: none;
    z-index: 1;
  }

  .square.legal-capture {
    box-shadow: inset 0 0 0 7px rgba(24, 24, 24, .27);
  }

  .square.legal-capture::after {
    width: 74%;
    height: 74%;
    background: transparent;
    border: 5px solid rgba(24, 24, 24, .32);
  }

  .square.capture-flash {
    animation: captureFlash .26s ease-out;
  }

  @keyframes captureFlash {
    0% { box-shadow: inset 0 0 0 0 rgba(255, 220, 120, 0); background-color: rgba(255, 220, 120, .16); }
    35% { box-shadow: inset 0 0 0 12px rgba(255, 220, 120, .72); background-color: rgba(255, 220, 120, .16); }
    100% { box-shadow: inset 0 0 0 0 rgba(255, 220, 120, 0); }
  }

  .piece {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    font-size: calc(var(--board-size) * 0.107);
    font-family: "Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols2", "DejaVu Sans", "Arial Unicode MS", sans-serif;
    user-select: none;
    z-index: 2;
  }

  .piece.w {
    color: #f7f2e5;
    text-shadow:
      0 0 2px #1e2126,
      0 2px 4px rgba(0,0,0,.42);
  }

  .piece.b {
    color: #23262b;
    text-shadow:
      0 0 2px rgba(245, 240, 231, .78),
      0 2px 4px rgba(0,0,0,.34);
  }

  .labels {
    position: absolute;
    color: rgba(230, 230, 230, .82);
    font-size: 13px;
    font-weight: 650;
    pointer-events: none;
  }

  .labels.rank {
    left: 0;
    top: var(--label-size);
    width: var(--label-size);
    height: var(--board-size);
    display: flex;
    flex-direction: column;
  }

  .labels.file {
    left: var(--label-size);
    top: var(--board-size);
    height: var(--label-size);
    width: var(--board-size);
    display: flex;
    flex-direction: row;
  }

  .labels span {
    flex: 1 1 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #promo {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    z-index: 20;
    transition: opacity .12s ease;
  }

  #promo.active {
    opacity: 1;
    pointer-events: auto;
  }

  .promo-card {
    background: rgba(20, 24, 30, .94);
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 12px;
    padding: 14px 16px;
    box-shadow: 0 18px 45px rgba(0,0,0,.45);
    min-width: 250px;
  }

  .promo-title {
    font-weight: 700;
    margin-bottom: 10px;
    letter-spacing: .03em;
    opacity: .9;
  }

  .promo-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .promo-row button {
    appearance: none;
    border: 1px solid rgba(255,255,255,.13);
    background: #2d3441;
    color: var(--ink);
    border-radius: 10px;
    padding: 8px 10px;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    min-width: 62px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 14px rgba(0,0,0,.28);
  }

  .promo-row button:hover {
    background: #394252;
  }

  .promo-row .promo-icon {
    font-family: "Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols2", "DejaVu Sans", sans-serif;
    font-size: 24px;
    line-height: 1;
  }

  .promo-row .promo-icon.w { color: #f7f2e5; }
  .promo-row .promo-icon.b { color: #23262b; }

  .promo-row .cancel {
    background: transparent;
    color: rgba(230,230,230,.75);
    margin-left: auto;
  }

  #dragLayer {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
  }

  .drag-ghost {
    position: fixed;
    pointer-events: none;
    z-index: 10000;
    transform: translate(-50%, -50%) scale(1.12);
    opacity: .9;
    font-family: "Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols2", "DejaVu Sans", sans-serif;
    line-height: 1;
    filter: drop-shadow(0 10px 12px rgba(0,0,0,.45));
  }

  .drag-ghost.w { color: #f7f2e5; }
  .drag-ghost.b { color: #23262b; }

  .panel {
    width: 338px;
    flex: 0 0 338px;
    background: var(--panel);
    border-left: 1px solid rgba(255,255,255,.08);
    padding: 18px 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow: hidden;
  }

  h1 {
    margin: 0;
    font-size: 22px;
    letter-spacing: .18em;
    font-weight: 750;
    opacity: .92;
  }

  #status {
    background: var(--panel-2);
    border-radius: 10px;
    padding: 11px 12px;
    font-weight: 700;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
  }

  #status.check {
    background: linear-gradient(90deg, #4a2929, var(--panel-2));
    box-shadow: inset 0 0 0 1px rgba(230, 78, 78, .55);
  }

  #status.checkmate,
  #status.stalemate,
  #status.draw {
    background: linear-gradient(90deg, #2f3a47, var(--panel-2));
  }

  .controls {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .controls button {
    appearance: none;
    border: 1px solid rgba(255,255,255,.11);
    background: #2d3441;
    color: var(--ink);
    border-radius: 10px;
    padding: 10px 12px;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,.22);
  }

  .controls button:hover {
    background: #394252;
  }

  #engine[aria-pressed="true"] {
    background: #294737;
    border-color: rgba(96, 215, 155, .38);
    color: #d9ffe9;
  }

  .panel-body {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-title {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: .14em;
    opacity: .55;
    font-weight: 700;
  }

  #moves {
    flex: 1 1 auto;
    min-height: 120px;
    overflow: auto;
    margin: 0;
    padding: 0 2px 0 0;
    list-style: none;
    font-variant-numeric: tabular-nums;
  }

  #moves li {
    display: grid;
    grid-template-columns: 34px 1fr 1fr;
    gap: 8px;
    padding: 4px 0;
    border-radius: 6px;
  }

  #moves li:nth-child(odd) {
    background: rgba(255,255,255,.025);
  }

  #moves .num {
    opacity: .55;
    text-align: right;
  }

  #moves .san {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  #moves .black {
    opacity: .78;
  }

  .info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0 0;
    border-top: 1px solid rgba(255,255,255,.08);
  }

  #material {
    font-weight: 800;
    letter-spacing: .03em;
  }

  .caps {
    min-height: 22px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    font-family: "Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols2", "DejaVu Sans", sans-serif;
    font-size: 18px;
    line-height: 1;
  }

  .cap.w {
    color: #f2ebdc;
  }

  .cap.b {
    color: #c8ccd2;
  }

  .cap-label {
    font-size: 12px;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    opacity: .55;
    margin-bottom: 4px;
    font-weight: 700;
  }

  @media (max-width: 940px) {
    #app {
      flex-direction: column;
    }
    .panel {
      width: 100%;
      flex: 0 0 auto;
      max-height: 42vh;
      border-left: 0;
      border-top: 1px solid rgba(255,255,255,.08);
    }
  }
</style>
</head>
<body>
<div id="app">
  <section class="board-area" id="boardArea">
    <div id="stage" class="stage">
      <div id="board" data-flipped="false"></div>
      <div id="rankLabels" class="labels rank" aria-hidden="true"></div>
      <div id="fileLabels" class="labels file" aria-hidden="true"></div>

      <div id="promo" aria-hidden="true">
        <div class="promo-card">
          <div class="promo-title">Promote to</div>
          <div class="promo-row">
            <button data-promote="q" type="button"><span class="promo-icon b">♛</span> Queen</button>
            <button data-promote="r" type="button"><span class="promo-icon b">♜</span> Rook</button>
            <button data-promote="b" type="button"><span class="promo-icon b">♝</span> Bishop</button>
            <button data-promote="n" type="button"><span class="promo-icon b">♞</span> Knight</button>
            <button data-promote-cancel="true" type="button" class="cancel">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <aside class="panel">
    <h1>GAMBIT</h1>
    <div id="status" data-state="normal" data-turn="w">White to move</div>

    <div class="controls">
      <button id="new" type="button">New</button>
      <button id="flip" type="button">Flip</button>
      <button id="undo" type="button">Undo</button>
      <button id="engine" type="button" aria-pressed="false">Engine: off</button>
    </div>

    <div class="panel-body">
      <div>
        <div class="section-title">Move list</div>
        <ol id="moves" class="moves"></ol>
      </div>

      <div>
        <div class="section-title">Material</div>
        <div id="material">Equal</div>
      </div>

      <div>
        <div class="cap-label">White captured</div>
        <div id="capturedByWhite" class="caps"></div>
        <div class="cap-label">Black captured</div>
        <div id="capturedByBlack" class="caps"></div>
      </div>
    </div>
  </aside>
</div>

<div id="dragLayer"></div>

<script>
(function() {
  "use strict";

  /* ---------- constants ---------- */

  const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const FILES = "abcdefgh";

  const WHITE = 1;
  const BLACK = -1;

  const EMPTY = 0;
  const P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6;

  const PROMO_Q = 1, PROMO_R = 2, PROMO_B = 3, PROMO_N = 4;
  const PROMO_TO_PIECE = [0, Q, R, B, N];
  const PROMO_LETTER = ["", "Q", "R", "B", "N"];
  const UCI_LETTER = ["", "q", "r", "b", "n"];

  const PIECE_LETTER = ["", "", "N", "B", "R", "Q", "K"];
  const DATA_LETTER = ["", "P", "N", "B", "R", "Q", "K"];
  const PIECE_VALUE = [0, 1, 3, 3, 5, 9, 0];

  const GLYPH_W = ["", "♙", "♘", "♗", "♖", "♕", "♔"];
  const GLYPH_B = ["", "♟", "♞", "♝", "♜", "♛", "♚"];

  const CHAR_PIECE = {
    "p": -1, "n": -2, "b": -3, "r": -4, "q": -5, "k": -6,
    "P":  1, "N":  2, "B":  3, "R":  4, "Q":  5, "K":  6
  };

  const CAST_WK = 1, CAST_WQ = 2, CAST_BK = 4, CAST_BQ = 8;

  const KNIGHT_D = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [ 1, -2], [ 1, 2], [ 2, -1], [ 2, 1]
  ];

  const KING_D = [
    [-1, -1], [-1, 0], [-1, 1],
    [ 0, -1],          [ 0, 1],
    [ 1, -1], [ 1, 0], [ 1, 1]
  ];

  const ORTH_D = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const DIAG_D = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  const MATE = 1000000;
  const MAX_SEARCH_DEPTH = 8;

  /* ---------- piece-square tables for the engine ---------- */

  const PST_P = [
      0,  0,  0,  0,  0,  0,  0,  0,
     50, 50, 50, 50, 50, 50, 50, 50,
     10, 10, 20, 30, 30, 20, 10, 10,
      5,  5, 10, 25, 25, 10,  5,  5,
      0,  0,  0, 20, 20,  0,  0,  0,
      5, -5,-10,  0,  0,-10, -5,  5,
      5, 10, 10,-20,-20, 10, 10,  5,
      0,  0,  0,  0,  0,  0,  0,  0
  ];

  const PST_N = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ];

  const PST_B = [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
  ];

  const PST_R = [
      0,  0,  0,  0,  0,  0,  0,  0,
      5, 10, 10, 10, 10, 10, 10,  5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
      0,  0,  0,  5,  5,  0,  0,  0
  ];

  const PST_Q = [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
  ];

  const PST_K = [
     0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0
  ];

  const PST = [null, PST_P, PST_N, PST_B, PST_R, PST_Q, PST_K];

  /* ---------- basic helpers ---------- */

  function abs(x) { return x < 0 ? -x : x; }
  function color(x) { return x > 0 ? WHITE : (x < 0 ? BLACK : 0); }
  function fileOf(s) { return s & 7; }
  function rankOf(s) { return s >> 3; }
  function insideFileRank(f, r) { return f >= 0 && f < 8 && r >= 0 && r < 8; }

  function sqName(i) {
    return FILES[i & 7] + (1 + (i >> 3));
  }

  function sqIndex(s) {
    if (typeof s !== "string") return -1;
    s = s.trim().toLowerCase();
    if (s.length !== 2) return -1;
    const f = s.charCodeAt(0) - 97;
    const r = s.charCodeAt(1) - 49;
    if (f < 0 || f > 7 || r < 0 || r > 7) return -1;
    return r * 8 + f;
  }

  function encodeMove(from, to, promo, castle) {
    promo = promo || 0;
    castle = castle || 0;
    return from | (to << 6) | (promo << 12) | (castle << 15);
  }

  function decodeMove(m) {
    return {
      from: m & 63,
      to: (m >> 6) & 63,
      promo: (m >> 12) & 7,
      castle: (m >> 15) & 3
    };
  }

  function moveToUci(m) {
    const d = decodeMove(m);
    return sqName(d.from) + sqName(d.to) + (d.promo ? UCI_LETTER[d.promo] : "");
  }

  function pieceChar(p) {
    if (p > 0) return PIECE_LETTER[abs(p)] ? PIECE_LETTER[abs(p)].toUpperCase() : "P";
    if (p < 0) return PIECE_LETTER[abs(p)].toLowerCase();
    return "";
  }

  function dataPieceCode(p) {
    return (p > 0 ? "w" : "b") + DATA_LETTER[abs(p)];
  }

  function glyphFor(p) {
    return p > 0 ? GLYPH_W[abs(p)] : GLYPH_B[abs(p)];
  }

  function rookSquares(side, castle) {
    if (!castle) return null;
    if (side === WHITE) {
      return castle === 1 ? [7, 5] : [0, 3];
    } else {
      return castle === 1 ? [63, 61] : [56, 59];
    }
  }

  /* ---------- FEN ---------- */

  function parseFen(fen) {
    if (typeof fen !== "string") return null;
    const parts = fen.trim().split(/\s+/);
    if (parts.length !== 6) return null;

    const place = parts[0];
    const turnStr = parts[1];
    const castStr = parts[2];
    const epStr = parts[3];
    const halfStr = parts[4];
    const fullStr = parts[5];

    const board = new Int8Array(64).fill(0);
    let kingW = -1, kingB = -1;

    const ranks = place.split("/");
    if (ranks.length !== 8) return null;

    for (let r = 7; r >= 0; r--) {
      const seg = ranks[7 - r];
      let f = 0;

      for (let i = 0; i < seg.length; i++) {
        const ch = seg[i];

        if (ch >= "1" && ch <= "8") {
          f += ch.charCodeAt(0) - 48;
          if (f > 8) return null;
          continue;
        }

        const p = CHAR_PIECE[ch];
        if (p === undefined) return null;
        if (f >= 8) return null;

        const idx = r * 8 + f;
        board[idx] = p;

        if (p === K) kingW = idx;
        else if (p === -K) kingB = idx;

        f++;
      }

      if (f !== 8) return null;
    }

    if (kingW < 0 || kingB < 0) return null;
    if (turnStr !== "w" && turnStr !== "b") return null;

    const side = turnStr === "w" ? WHITE : BLACK;

    let cast = 0;
    if (castStr !== "-") {
      for (let i = 0; i < castStr.length; i++) {
        const ch = castStr[i];
        if (ch === "K") cast |= CAST_WK;
        else if (ch === "Q") cast |= CAST_WQ;
        else if (ch === "k") cast |= CAST_BK;
        else if (ch === "q") cast |= CAST_BQ;
        else return null;
      }
    }

    let ep = -1;
    if (epStr !== "-") {
      ep = sqIndex(epStr);
      if (ep < 0) return null;
      const er = rankOf(ep);
      const expectedRank = side === WHITE ? 5 : 2;
      if (er !== expectedRank) return null;

      const behind = ep - 8 * side;
      if (behind < 0 || behind >= 64) return null;
      const behindPiece = board[behind];
      if (color(behindPiece) !== -side || abs(behindPiece) !== P) return null;
    }

    const half = Number(halfStr);
    const full = Number(fullStr);
    if (!Number.isInteger(half) || !Number.isInteger(full)) return null;
    if (half < 0 || full < 0) return null;

    return {
      board,
      side,
      castling: cast,
      ep,
      halfmove: half,
      fullmove: full,
      kingW,
      kingB
    };
  }

  function boardString(st) {
    const out = [];

    for (let r = 7; r >= 0; r--) {
      let line = "";
      let empty = 0;

      for (let f = 0; f < 8; f++) {
        const p = st.board[r * 8 + f];
        if (p === EMPTY) {
          empty++;
        } else {
          if (empty) {
            line += empty;
            empty = 0;
          }
          line += pieceChar(p);
        }
      }

      if (empty) line += empty;
      out.push(line);
    }

    return out.join("/");
  }

  function castlingString(cast) {
    let s = "";
    if (cast & CAST_WK) s += "K";
    if (cast & CAST_WQ) s += "Q";
    if (cast & CAST_BK) s += "k";
    if (cast & CAST_BQ) s += "q";
    return s || "-";
  }

  function toFen(st) {
    return boardString(st) + " " +
      (st.side === WHITE ? "w" : "b") + " " +
      castlingString(st.castling) + " " +
      (st.ep === -1 ? "-" : sqName(st.ep)) + " " +
      st.halfmove + " " +
      st.fullmove;
  }

  function positionKey(st) {
    return boardString(st) + "|" +
      (st.side === WHITE ? "w" : "b") + "|" +
      castlingString(st.castling) + "|" +
      (st.ep === -1 ? "-" : sqName(st.ep));
  }

  /* ---------- attack detection ---------- */

  function isAttacked(sq, attacker, b) {
    const f = sq & 7;
    const r = sq >> 3;

    // pawns
    if (attacker === WHITE) {
      if (f > 0) {
        const from = sq - 9;
        if (from >= 0 && b[from] === P) return true;
      }
      if (f < 7) {
        const from = sq - 7;
        if (from >= 0 && b[from] === P) return true;
      }
    } else {
      if (f > 0) {
        const from = sq + 7;
        if (from < 64 && b[from] === -P) return true;
      }
      if (f < 7) {
        const from = sq + 9;
        if (from < 64 && b[from] === -P) return true;
      }
    }

    // knights
    for (let i = 0; i < KNIGHT_D.length; i++) {
      const nr = r + KNIGHT_D[i][0];
      const nf = f + KNIGHT_D[i][1];
      if (!insideFileRank(nf, nr)) continue;
      const p = b[nr * 8 + nf];
      if (p && color(p) === attacker && abs(p) === N) return true;
    }

    // king
    for (let i = 0; i < KING_D.length; i++) {
      const nr = r + KING_D[i][0];
      const nf = f + KING_D[i][1];
      if (!insideFileRank(nf, nr)) continue;
      const p = b[nr * 8 + nf];
      if (p && color(p) === attacker && abs(p) === K) return true;
    }

    // rook/queen along orthogonals
    for (let i = 0; i < ORTH_D.length; i++) {
      const dr = ORTH_D[i][0];
      const df = ORTH_D[i][1];
      let nr = r + dr;
      let nf = f + df;

      while (insideFileRank(nf, nr)) {
        const p = b[nr * 8 + nf];
        if (p) {
          if (color(p) === attacker) {
            const t = abs(p);
            if (t === R || t === Q) return true;
          }
          break;
        }
        nr += dr;
        nf += df;
      }
    }

    // bishop/queen along diagonals
    for (let i = 0; i < DIAG_D.length; i++) {
      const dr = DIAG_D[i][0];
      const df = DIAG_D[i][1];
      let nr = r + dr;
      let nf = f + df;

      while (insideFileRank(nf, nr)) {
        const p = b[nr * 8 + nf];
        if (p) {
          if (color(p) === attacker) {
            const t = abs(p);
            if (t === B || t === Q) return true;
          }
          break;
        }
        nr += dr;
        nf += df;
      }
    }

    return false;
  }

  function isInCheck(st) {
    const kingSq = st.side === WHITE ? st.kingW : st.kingB;
    if (kingSq < 0) return false;
    return isAttacked(kingSq, -st.side, st.board);
  }

  /* ---------- legal move generation ---------- */

  function forEachLegalMove(st, cb) {
    const b = st.board;
    const side = st.side;
    const enemy = -side;
    const kingSq = side === WHITE ? st.kingW : st.kingB;
    const kingInCheck = isAttacked(kingSq, enemy, b);

    function tryMove(from, to, promo, castle) {
      promo = promo || 0;
      castle = castle || 0;

      const piece = b[from];
      if (!piece || color(piece) !== side) return;

      const type = abs(piece);
      let capSq = to;
      let captured = b[to];

      if (captured === 0 && type === P && st.ep !== -1 && to === st.ep) {
        capSq = to - 8 * side;
        if (capSq < 0 || capSq >= 64) return;
        captured = b[capSq];
        if (!captured || color(captured) !== enemy) return;
      } else if (captured !== 0 && color(captured) === side) {
        return;
      }

      const rook = castle ? rookSquares(side, castle) : null;
      const rookPiece = rook ? b[rook[0]] : 0;

      if (rook && (!rookPiece || color(rookPiece) !== side || abs(rookPiece) !== R)) {
        return;
      }

      // Apply only on the board array. State fields are untouched for legality testing.
      b[from] = 0;
      if (rook) {
        b[rook[0]] = 0;
        b[rook[1]] = rookPiece;
      }
      b[to] = promo ? (side === WHITE ? PROMO_TO_PIECE[promo] : -PROMO_TO_PIECE[promo]) : piece;
      if (capSq !== to) b[capSq] = 0;

      const checkSq = (type === K) ? to : kingSq;
      const legal = !isAttacked(checkSq, enemy, b);

      // Undo temporary board mutation.
      b[from] = piece;
      if (rook) {
        b[rook[1]] = 0;
        b[rook[0]] = rookPiece;
      }
      b[to] = (capSq === to) ? captured : 0;
      if (capSq !== to) b[capSq] = captured;

      if (legal) cb(encodeMove(from, to, promo, castle));
    }

    function addPromo(from, to) {
      tryMove(from, to, PROMO_Q, 0);
      tryMove(from, to, PROMO_R, 0);
      tryMove(from, to, PROMO_B, 0);
      tryMove(from, to, PROMO_N, 0);
    }

    for (let i = 0; i < 64; i++) {
      const p = b[i];
      if (!p || color(p) !== side) continue;

      const t = abs(p);
      const f = fileOf(i);
      const r = rankOf(i);

      if (t === P) {
        if (side === WHITE) {
          if (r < 7) {
            const one = i + 8;
            if (b[one] === 0) {
              if (r === 6) addPromo(i, one);
              else tryMove(i, one, 0, 0);

              if (r === 1) {
                const two = one + 8;
                if (b[two] === 0) tryMove(i, two, 0, 0);
              }
            }
          }

          if (f < 7) {
            const target = i + 7;
            const tp = b[target];
            if (tp !== 0) {
              if (color(tp) === enemy) {
                if (r === 6) addPromo(i, target);
                else tryMove(i, target, 0, 0);
              }
            } else if (st.ep !== -1 && target === st.ep) {
              if (r === 6) addPromo(i, target);
              else tryMove(i, target, 0, 0);
            }
          }

          if (f > 0) {
            const target = i + 9;
            const tp = b[target];
            if (tp !== 0) {
              if (color(tp) === enemy) {
                if (r === 6) addPromo(i, target);
                else tryMove(i, target, 0, 0);
              }
            } else if (st.ep !== -1 && target === st.ep) {
              if (r === 6) addPromo(i, target);
              else tryMove(i, target, 0, 0);
            }
          }
        } else {
          if (r > 0) {
            const one = i - 8;
            if (b[one] === 0) {
              if (r === 1) addPromo(i, one);
              else tryMove(i, one, 0, 0);

              if (r === 6) {
                const two = one - 8;
                if (b[two] === 0) tryMove(i, two, 0, 0);
              }
            }
          }

          if (f < 7) {
            const target = i - 7;
            const tp = b[target];
            if (tp !== 0) {
              if (color(tp) === enemy) {
                if (r === 1) addPromo(i, target);
                else tryMove(i, target, 0, 0);
              }
            } else if (st.ep !== -1 && target === st.ep) {
              if (r === 1) addPromo(i, target);
              else tryMove(i, target, 0, 0);
            }
          }

          if (f > 0) {
            const target = i - 9;
            const tp = b[target];
            if (tp !== 0) {
              if (color(tp) === enemy) {
                if (r === 1) addPromo(i, target);
                else tryMove(i, target, 0, 0);
              }
            } else if (st.ep !== -1 && target === st.ep) {
              if (r === 1) addPromo(i, target);
              else tryMove(i, target, 0, 0);
            }
          }
        }
      } else if (t === N) {
        for (let d = 0; d < KNIGHT_D.length; d++) {
          const nr = r + KNIGHT_D[d][0];
          const nf = f + KNIGHT_D[d][1];
          if (!insideFileRank(nf, nr)) continue;
          const to = nr * 8 + nf;
          const tp = b[to];
          if (tp === 0 || color(tp) === enemy) tryMove(i, to, 0, 0);
        }
      } else if (t === B) {
        for (let d = 0; d < DIAG_D.length; d++) {
          const dr = DIAG_D[d][0];
          const df = DIAG_D[d][1];
          let nr = r + dr;
          let nf = f + df;

          while (insideFileRank(nf, nr)) {
            const to = nr * 8 + nf;
            const tp = b[to];
            if (tp === 0) {
              tryMove(i, to, 0, 0);
            } else {
              if (color(tp) === enemy) tryMove(i, to, 0, 0);
              break;
            }
            nr += dr;
            nf += df;
          }
        }
      } else if (t === R) {
        for (let d = 0; d < ORTH_D.length; d++) {
          const dr = ORTH_D[d][0];
          const df = ORTH_D[d][1];
          let nr = r + dr;
          let nf = f + df;

          while (insideFileRank(nf, nr)) {
            const to = nr * 8 + nf;
            const tp = b[to];
            if (tp === 0) {
              tryMove(i, to, 0, 0);
            } else {
              if (color(tp) === enemy) tryMove(i, to, 0, 0);
              break;
            }
            nr += dr;
            nf += df;
          }
        }
      } else if (t === Q) {
        for (let d = 0; d < ORTH_D.length; d++) {
          const dr = ORTH_D[d][0];
          const df = ORTH_D[d][1];
          let nr = r + dr;
          let nf = f + df;

          while (insideFileRank(nf, nr)) {
            const to = nr * 8 + nf;
            const tp = b[to];
            if (tp === 0) {
              tryMove(i, to, 0, 0);
            } else {
              if (color(tp) === enemy) tryMove(i, to, 0, 0);
              break;
            }
            nr += dr;
            nf += df;
          }
        }

        for (let d = 0; d < DIAG_D.length; d++) {
          const dr = DIAG_D[d][0];
          const df = DIAG_D[d][1];
          let nr = r + dr;
          let nf = f + df;

          while (insideFileRank(nf, nr)) {
            const to = nr * 8 + nf;
            const tp = b[to];
            if (tp === 0) {
              tryMove(i, to, 0, 0);
            } else {
              if (color(tp) === enemy) tryMove(i, to, 0, 0);
              break;
            }
            nr += dr;
            nf += df;
          }
        }
      } else if (t === K) {
        for (let d = 0; d < KING_D.length; d++) {
          const nr = r + KING_D[d][0];
          const nf = f + KING_D[d][1];
          if (!insideFileRank(nf, nr)) continue;
          const to = nr * 8 + nf;
          const tp = b[to];
          if (tp === 0 || color(tp) === enemy) tryMove(i, to, 0, 0);
        }

        if (!kingInCheck) {
          const cast = st.castling;

          if (side === WHITE && i === 4) {
            if ((cast & CAST_WK) &&
                b[5] === 0 && b[6] === 0 &&
                b[7] === R &&
                !isAttacked(5, enemy, b) &&
                !isAttacked(6, enemy, b)) {
              tryMove(4, 6, 0, 1);
            }

            if ((cast & CAST_WQ) &&
                b[1] === 0 && b[2] === 0 && b[3] === 0 &&
                b[0] === R &&
                !isAttacked(3, enemy, b) &&
                !isAttacked(2, enemy, b)) {
              tryMove(4, 2, 0, 2);
            }
          } else if (side === BLACK && i === 60) {
            if ((cast & CAST_BK) &&
                b[61] === 0 && b[62] === 0 &&
                b[63] === -R &&
                !isAttacked(61, enemy, b) &&
                !isAttacked(62, enemy, b)) {
              tryMove(60, 62, 0, 1);
            }

            if ((cast & CAST_BQ) &&
                b[57] === 0 && b[58] === 0 && b[59] === 0 &&
                b[56] === -R &&
                !isAttacked(59, enemy, b) &&
                !isAttacked(58, enemy, b)) {
              tryMove(60, 58, 0, 2);
            }
          }
        }
      }
    }
  }

  function legalMoves(st) {
    const out = [];
    forEachLegalMove(st, m => out.push(m));
    return out;
  }

  const STOP = Symbol("stop");

  function anyLegalMove(st) {
    try {
      forEachLegalMove(st, () => { throw STOP; });
      return false;
    } catch (e) {
      if (e === STOP) return true;
      throw e;
    }
  }

  function isCaptureEncoded(st, m) {
    const d = decodeMove(m);
    if (d.castle) return false;
    const piece = st.board[d.from];
    if (!piece) return false;
    const type = abs(piece);

    if (st.board[d.to] !== 0) return true;

    if (type === P) {
      if (fileOf(d.from) !== fileOf(d.to)) return true;
      if (st.ep !== -1 && d.to === st.ep && st.board[d.to] === 0) return true;
    }

    return false;
  }

  /* ---------- state and application ---------- */

  let state = {
    board: new Int8Array(64).fill(0),
    side: WHITE,
    castling: 0,
    ep: -1,
    halfmove: 0,
    fullmove: 1,
    kingW: -1,
    kingB: -1,
    startFen: START_FEN,
    history: [],
    gameOver: null
  };

  let currentLegal = [];
  let repCount = new Map();

  function cloneSearchState(st) {
    return {
      board: st.board.slice(),
      side: st.side,
      castling: st.castling,
      ep: st.ep,
      halfmove: st.halfmove,
      fullmove: st.fullmove,
      kingW: st.kingW,
      kingB: st.kingB
    };
  }

  function snapshotState(st) {
    return {
      board: st.board.slice(),
      side: st.side,
      castling: st.castling,
      ep: st.ep,
      halfmove: st.halfmove,
      fullmove: st.fullmove,
      kingW: st.kingW,
      kingB: st.kingB
    };
  }

  function assignState(parsed, startFen) {
    state.board = parsed.board.slice();
    state.side = parsed.side;
    state.castling = parsed.castling;
    state.ep = parsed.ep;
    state.halfmove = parsed.halfmove;
    state.fullmove = parsed.fullmove;
    state.kingW = parsed.kingW;
    state.kingB = parsed.kingB;
    state.startFen = startFen;
    state.history = [];
    state.gameOver = null;
    currentLegal = [];
  }

  function applyMove(st, m) {
    const d = decodeMove(m);
    const from = d.from;
    const to = d.to;
    const promo = d.promo;
    const castle = d.castle;

    const side = st.side;
    const b = st.board;
    const piece = b[from];
    const type = abs(piece);

    let capSq = to;
    if (type === P && st.ep !== -1 && to === st.ep && b[to] === 0) {
      capSq = to - 8 * side;
    }
    const captured = b[capSq];

    const rook = castle ? rookSquares(side, castle) : null;
    const rookPiece = rook ? b[rook[0]] : 0;

    const oldSide = side;
    const oldEp = st.ep;
    const oldCast = st.castling;
    const oldHalf = st.halfmove;
    const oldFull = st.fullmove;
    const oldKingW = st.kingW;
    const oldKingB = st.kingB;

    st.halfmove = (type === P || captured !== 0) ? 0 : st.halfmove + 1;

    let newCast = st.castling;

    if (castle) {
      if (side === WHITE) newCast &= ~(CAST_WK | CAST_WQ);
      else newCast &= ~(CAST_BK | CAST_BQ);
    }

    if (type === K) {
      if (side === WHITE) newCast &= ~(CAST_WK | CAST_WQ);
      else newCast &= ~(CAST_BK | CAST_BQ);
    } else if (type === R) {
      if (side === WHITE) {
        if (from === 0) newCast &= ~CAST_WQ;
        if (from === 7) newCast &= ~CAST_WK;
      } else {
        if (from === 56) newCast &= ~CAST_BQ;
        if (from === 63) newCast &= ~CAST_BK;
      }
    }

    if (to === 7) newCast &= ~CAST_WK;
    if (to === 0) newCast &= ~CAST_WQ;
    if (to === 63) newCast &= ~CAST_BK;
    if (to === 56) newCast &= ~CAST_BQ;

    st.castling = newCast;

    st.ep = (type === P && Math.abs(to - from) === 16) ? (to - 8 * side) : -1;

    if (side === BLACK) st.fullmove++;
    st.side = -side;

    b[from] = 0;
    if (rook) {
      b[rook[0]] = 0;
      b[rook[1]] = rookPiece;
    }

    b[to] = promo ? (side === WHITE ? PROMO_TO_PIECE[promo] : -PROMO_TO_PIECE[promo]) : piece;

    if (capSq !== to) b[capSq] = 0;

    if (type === K) {
      if (side === WHITE) st.kingW = to;
      else st.kingB = to;
    }

    return {
      from,
      to,
      sideBefore: oldSide,
      piece,
      captured,
      capSq,
      rook,
      rookPiece,
      oldEp,
      oldCast,
      oldHalf,
      oldFull,
      oldKingW,
      oldKingB
    };
  }

  function unapplyMove(st, m, info) {
    const b = st.board;
    const rook = info.rook;

    b[info.from] = info.piece;

    if (rook) {
      b[rook[1]] = 0;
      b[rook[0]] = info.rookPiece;
    }

    b[info.to] = (info.capSq === info.to) ? info.captured : 0;
    if (info.capSq !== info.to) b[info.capSq] = info.captured;

    st.side = info.sideBefore;
    st.ep = info.oldEp;
    st.castling = info.oldCast;
    st.halfmove = info.oldHalf;
    st.fullmove = info.oldFull;
    st.kingW = info.oldKingW;
    st.kingB = info.oldKingB;
  }

  function updateCurrentLegal() {
    currentLegal = legalMoves(state);
  }

  function incRep(st) {
    const k = positionKey(st);
    repCount.set(k, (repCount.get(k) || 0) + 1);
  }

  function decRep(st) {
    const k = positionKey(st);
    const v = (repCount.get(k) || 1) - 1;
    if (v <= 0) repCount.delete(k);
    else repCount.set(k, v);
  }

  function insufficientMaterial(st) {
    let minors = 0;

    for (let i = 0; i < 64; i++) {
      const p = st.board[i];
      if (!p) continue;
      const t = abs(p);
      if (t === K) continue;
      if (t === P || t === R || t === Q) return false;
      minors++;
      if (minors > 1) return false;
    }

    return true;
  }

  function refreshAfterMutation() {
    let over = null;

    if (currentLegal.length === 0) {
      if (isInCheck(state)) {
        const winner = state.side === WHITE ? "Black" : "White";
        over = { state: "checkmate", reason: "Checkmate — " + winner + " wins" };
      } else {
        over = { state: "stalemate", reason: "Stalemate" };
      }
    } else if (state.halfmove >= 100) {
      over = { state: "draw", reason: "Draw by 50-move rule" };
    } else if (insufficientMaterial(state)) {
      over = { state: "draw", reason: "Draw by insufficient material" };
    } else if ((repCount.get(positionKey(state)) || 0) >= 3) {
      over = { state: "draw", reason: "Draw by threefold repetition" };
    }

    state.gameOver = over;
  }

  /* ---------- SAN ---------- */

  function checkMateSuffix(st, m) {
    const temp = cloneSearchState(st);
    applyMove(temp, m);

    const check = isInCheck(temp);
    if (!check) return "";
    return anyLegalMove(temp) ? "+" : "#";
  }

  function buildSan(st, m, legalArr, suffix) {
    const d = decodeMove(m);
    const from = d.from;
    const to = d.to;
    const piece = st.board[from];
    const type = abs(piece);
    const dest = sqName(to);

    if (d.castle) {
      return (d.castle === 1 ? "O-O" : "O-O-O") + suffix;
    }

    let capture = false;
    if (st.board[to] !== 0) capture = true;
    else if (type === P) {
      if (fileOf(from) !== fileOf(to)) capture = true;
      else if (st.ep !== -1 && to === st.ep && st.board[to] === 0) capture = true;
    }

    let san = "";

    if (type === P) {
      san = capture ? FILES[fileOf(from)] + "x" + dest : dest;
      if (d.promo) san += "=" + PROMO_LETTER[d.promo];
    } else {
      san = PIECE_LETTER[type];

      if (type !== K) {
        const others = [];
        for (let i = 0; i < legalArr.length; i++) {
          const om = legalArr[i];
          const od = decodeMove(om);
          if (od.to === to && od.from !== from) {
            const op = st.board[od.from];
            if (op && abs(op) === type) others.push(od.from);
          }
        }

        if (others.length) {
          const sameFile = others.some(x => fileOf(x) === fileOf(from));
          const sameRank = others.some(x => rankOf(x) === rankOf(from));

          if (!sameFile) san += FILES[fileOf(from)];
          else if (!sameRank) san += (rankOf(from) + 1);
          else san += FILES[fileOf(from)] + (rankOf(from) + 1);
        }
      }

      if (capture) san += "x";
      san += dest;
    }

    return san + suffix;
  }

  function computeSanFromSnapshot(snap, m, legalArr) {
    const suffix = checkMateSuffix(snap, m);
    return buildSan(snap, m, legalArr, suffix);
  }

  /* ---------- UI: board and status ---------- */

  const boardEl = document.getElementById("board");
  const stageEl = document.getElementById("stage");
  const boardArea = document.getElementById("boardArea");
  const rankLabels = document.getElementById("rankLabels");
  const fileLabels = document.getElementById("fileLabels");
  const statusEl = document.getElementById("status");
  const moveList = document.getElementById("moves");
  const materialEl = document.getElementById("material");
  const capturedByWhiteEl = document.getElementById("capturedByWhite");
  const capturedByBlackEl = document.getElementById("capturedByBlack");
  const promoEl = document.getElementById("promo");
  const dragLayer = document.getElementById("dragLayer");

  const newBtn = document.getElementById("new");
  const flipBtn = document.getElementById("flip");
  const undoBtn = document.getElementById("undo");
  const engineBtn = document.getElementById("engine");

  const squareEls = new Array(64);

  let isFlipped = false;
  let engineOn = false;
  let engineTimer = null;
  let engineRunId = 0;

  let selected = -1;
  let selectedMoves = [];
  let pendingPromo = null;
  let suppressClick = false;
  let lastStatusVal = "normal";

  function createBoardSquares() {
    for (let i = 0; i < 64; i++) {
      const f = fileOf(i);
      const r = rankOf(i);
      const name = sqName(i);
      const isDark = ((f + r) % 2) === 0;

      const el = document.createElement("div");
      el.className = "square " + (isDark ? "dark" : "light");
      el.dataset.square = name;
      el.dataset.color = isDark ? "dark" : "light";

      squareEls[i] = el;
      boardEl.appendChild(el);
    }
  }

  function updateBoardOrientation() {
    boardEl.dataset.flipped = isFlipped ? "true" : "false";

    for (let i = 0; i < 64; i++) {
      const f = fileOf(i);
      const r = rankOf(i);

      const row = isFlipped ? (r + 1) : (8 - r);
      const col = isFlipped ? (8 - f) : (f + 1);

      squareEls[i].style.gridRowStart = String(row);
      squareEls[i].style.gridColumnStart = String(col);
    }
  }

  function updateLabels() {
    rankLabels.textContent = "";
    fileLabels.textContent = "";

    const ranks = isFlipped
      ? ["1", "2", "3", "4", "5", "6", "7", "8"]
      : ["8", "7", "6", "5", "4", "3", "2", "1"];

    const files = isFlipped
      ? ["h", "g", "f", "e", "d", "c", "b", "a"]
      : ["a", "b", "c", "d", "e", "f", "g", "h"];

    for (const r of ranks) {
      const s = document.createElement("span");
      s.textContent = r;
      rankLabels.appendChild(s);
    }

    for (const f of files) {
      const s = document.createElement("span");
      s.textContent = f;
      fileLabels.appendChild(s);
    }
  }

  function fitStage() {
    const rect = boardArea.getBoundingClientRect();
    const label = 34;
    const padding = 44;

    let size = Math.min(rect.width - label - padding, rect.height - label - padding);
    size = Math.max(220, Math.floor(size));

    stageEl.style.setProperty("--label-size", label + "px");
    stageEl.style.setProperty("--board-size", size + "px");
    stageEl.style.width = (size + label) + "px";
    stageEl.style.height = (size + label) + "px";

    document.documentElement.style.setProperty("--board-size", size + "px");
  }

  function renderBoard() {
    for (let i = 0; i < 64; i++) {
      const sq = squareEls[i];
      sq.textContent = "";

      const p = state.board[i];
      if (!p) continue;

      const piece = document.createElement("div");
      piece.className = "piece " + (p > 0 ? "w" : "b");
      piece.dataset.piece = dataPieceCode(p);
      piece.textContent = glyphFor(p);
      sq.appendChild(piece);
    }
  }

  function applyBoardHighlights() {
    for (let i = 0; i < 64; i++) {
      const sq = squareEls[i];
      sq.removeAttribute("data-legal");
      sq.removeAttribute("data-last");
      sq.classList.remove("selected", "last", "check", "legal", "legal-capture", "capture-flash");
    }

    if (selected >= 0) {
      squareEls[selected].classList.add("selected");
    }

    for (const m of selectedMoves) {
      const d = decodeMove(m);
      const sq = squareEls[d.to];
      sq.dataset.legal = "true";
      sq.classList.add("legal");

      if (isCaptureEncoded(state, m)) {
        sq.classList.add("legal-capture");
      }
    }

    if (state.history.length) {
      const last = state.history[state.history.length - 1];
      squareEls[last.from].dataset.last = "true";
      squareEls[last.to].dataset.last = "true";
      squareEls[last.from].classList.add("last");
      squareEls[last.to].classList.add("last");
    }

    if (isInCheck(state)) {
      const k = state.side === WHITE ? state.kingW : state.kingB;
      if (k >= 0) squareEls[k].classList.add("check");
    }
  }

  function updateStatus() {
    let val, text;

    if (state.gameOver) {
      val = state.gameOver.state;
      text = state.gameOver.reason;
    } else {
      val = isInCheck(state) ? "check" : "normal";
      text = (state.side === WHITE ? "White" : "Black") + " to move" + (val === "check" ? " · check" : "");
    }

    statusEl.dataset.state = val;
    statusEl.dataset.turn = state.side === WHITE ? "w" : "b";
    statusEl.textContent = text;
    statusEl.className = "status " + val;

    lastStatusVal = val;
  }

  function renderMoves() {
    moveList.textContent = "";

    for (let i = 0; i < state.history.length; i += 2) {
      const li = document.createElement("li");

      const no = document.createElement("span");
      no.className = "num";
      no.textContent = (i / 2 + 1) + ".";
      li.appendChild(no);

      const w = document.createElement("span");
      w.className = "san white";
      w.textContent = state.history[i].san || "";
      li.appendChild(w);

      const b = document.createElement("span");
      b.className = "san black";
      b.textContent = state.history[i + 1] ? state.history[i + 1].san : "";
      li.appendChild(b);

      moveList.appendChild(li);
    }

    moveList.scrollTop = moveList.scrollHeight;
  }

  function capPiece(c) {
    const span = document.createElement("span");
    span.className = "cap " + (c > 0 ? "w" : "b");
    span.textContent = glyphFor(c);
    return span;
  }

  function renderPanel() {
    const capsW = [];
    const capsB = [];

    for (const h of state.history) {
      if (!h.captured) continue;
      if (h.side === WHITE) capsW.push(h.captured);
      else capsB.push(h.captured);
    }

    capsW.sort((a, b) => PIECE_VALUE[abs(b)] - PIECE_VALUE[abs(a)]);
    capsB.sort((a, b) => PIECE_VALUE[abs(b)] - PIECE_VALUE[abs(a)]);

    capturedByWhiteEl.textContent = "";
    capturedByBlackEl.textContent = "";

    for (const c of capsW) capturedByWhiteEl.appendChild(capPiece(c));
    for (const c of capsB) capturedByBlackEl.appendChild(capPiece(c));

    let material = 0;
    for (let i = 0; i < 64; i++) {
      const p = state.board[i];
      if (p > 0) material += PIECE_VALUE[abs(p)];
      else if (p < 0) material -= PIECE_VALUE[abs(p)];
    }

    materialEl.textContent = material === 0
      ? "Equal"
      : (material > 0 ? "White +" + material : "Black +" + (-material));
  }

  /* ---------- selection / promotion / interaction ---------- */

  function selectSquare(sq) {
    if (state.gameOver || pendingPromo) return;

    const p = state.board[sq];
    if (!p || color(p) !== state.side) {
      clearSelection();
      return;
    }

    selected = sq;
    selectedMoves = currentLegal.filter(m => (m & 63) === sq);
    applyBoardHighlights();
  }

  function clearSelection() {
    selected = -1;
    selectedMoves = [];
    applyBoardHighlights();
  }

  function openPromotion(candidates) {
    if (candidates.length <= 1) return;
    const first = decodeMove(candidates[0]);

    pendingPromo = {
      from: first.from,
      to: first.to,
      candidates
    };

    promoEl.classList.add("active");
    promoEl.setAttribute("aria-hidden", "false");
  }

  function closePromotion() {
    pendingPromo = null;
    promoEl.classList.remove("active");
    promoEl.setAttribute("aria-hidden", "true");
  }

  function handleClick(sq) {
    if (pendingPromo) return;

    if (sq < 0) {
      clearSelection();
      return;
    }

    if (selected >= 0) {
      const candidates = selectedMoves.filter(m => decodeMove(m).to === sq);

      if (candidates.length > 0) {
        const hasPromo = candidates.some(m => decodeMove(m).promo !== 0);
        if (candidates.length > 1 && hasPromo) {
          openPromotion(candidates);
          return;
        }

        performGameMove(candidates[0], true);
        return;
      }
    }

    const p = state.board[sq];

    if (!state.gameOver && p && color(p) === state.side) {
      if (selected === sq) clearSelection();
      else selectSquare(sq);
      return;
    }

    clearSelection();
  }

  function squareFromEvent(e) {
    let el = e.target;
    if (!el || !el.closest) return -1;
    const sq = el.closest("[data-square]");
    if (!sq) return -1;
    return sqIndex(sq.dataset.square);
  }

  /* drag */
  let dragCandidate = null;

  function createDragGhost(from) {
    const sq = squareEls[from];
    const original = sq.querySelector(".piece");
    if (!original) return false;

    const ghost = original.cloneNode(true);
    ghost.removeAttribute("data-piece");
    ghost.className = "drag-ghost " + (original.classList.contains("w") ? "w" : "b");

    const rect = sq.getBoundingClientRect();
    const size = Math.floor(rect.width * 0.86);
    ghost.style.width = size + "px";
    ghost.style.height = size + "px";
    ghost.style.fontSize = Math.floor(rect.width * 0.78) + "px";

    ghost.dataset.dragFrom = String(from);
    dragLayer.appendChild(ghost);

    original.style.opacity = "0.22";

    dragCandidate.ghost = ghost;
    dragCandidate.originalEl = original;

    return true;
  }

  function updateDragGhost(x, y) {
    if (!dragCandidate || !dragCandidate.ghost) return;
    dragCandidate.ghost.style.left = x + "px";
    dragCandidate.ghost.style.top = y + "px";
  }

  function removeDragGhost() {
    if (!dragCandidate) return;

    if (dragCandidate.ghost && dragCandidate.ghost.parentNode) {
      dragCandidate.ghost.parentNode.removeChild(dragCandidate.ghost);
    }

    if (dragCandidate.originalEl && dragCandidate.originalEl.isConnected) {
      dragCandidate.originalEl.style.opacity = "";
    }

    dragCandidate.ghost = null;
    dragCandidate.originalEl = null;
  }

  boardEl.addEventListener("click", e => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    ensureAudio();
    const sq = squareFromEvent(e);
    handleClick(sq);
  });

  boardEl.addEventListener("pointerdown", e => {
    if (e.button && e.button !== 0) return;
    ensureAudio();

    if (state.gameOver || pendingPromo) return;

    const sq = squareFromEvent(e);
    if (sq < 0) return;

    const p = state.board[sq];
    if (!p || color(p) !== state.side) return;

    dragCandidate = {
      from: sq,
      x: e.clientX,
      y: e.clientY,
      activated: false,
      pointerId: e.pointerId,
      ghost: null,
      originalEl: null
    };

    try { boardEl.setPointerCapture(e.pointerId); } catch (_) {}
  });

  boardEl.addEventListener("pointermove", e => {
    if (!dragCandidate) return;

    if (!dragCandidate.activated) {
      const dx = e.clientX - dragCandidate.x;
      const dy = e.clientY - dragCandidate.y;
      if (dx * dx + dy * dy < 18) return;

      dragCandidate.activated = true;
      selectSquare(dragCandidate.from);
      if (!createDragGhost(dragCandidate.from)) {
        dragCandidate = null;
        return;
      }
    }

    updateDragGhost(e.clientX, e.clientY);
  });

  boardEl.addEventListener("pointerup", e => {
    if (!dragCandidate) return;

    const activated = dragCandidate.activated;
    const from = dragCandidate.from;

    removeDragGhost();
    dragCandidate = null;

    if (activated) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 120);

      if (state.gameOver || pendingPromo) {
        clearSelection();
        return;
      }

      const sq = squareFromEvent(e);
      if (selected >= 0 && selected === from) {
        const candidates = selectedMoves.filter(m => decodeMove(m).to === sq);

        if (candidates.length > 1 && candidates.some(m => decodeMove(m).promo !== 0)) {
          openPromotion(candidates);
        } else if (candidates.length > 0) {
          performGameMove(candidates[0], true);
        } else if (sq === from) {
          selectSquare(from);
        } else {
          clearSelection();
        }
      } else {
        clearSelection();
      }
    }
  });

  boardEl.addEventListener("pointercancel", () => {
    removeDragGhost();
    dragCandidate = null;
  });

  promoEl.addEventListener("click", e => {
    const btn = e.target && e.target.closest ? e.target.closest("button") : null;
    if (!btn) return;

    if (btn.dataset.promoteCancel) {
      closePromotion();
      clearSelection();
      return;
    }

    const promoLetter = btn.dataset.promote;
    if (!promoLetter || !pendingPromo) return;

    let promo = 0;
    if (promoLetter === "q") promo = PROMO_Q;
    else if (promoLetter === "r") promo = PROMO_R;
    else if (promoLetter === "b") promo = PROMO_B;
    else if (promoLetter === "n") promo = PROMO_N;

    const m = pendingPromo.candidates.find(x => decodeMove(x).promo === promo);
    if (m) performGameMove(m, true);

    closePromotion();
  });

  window.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
      e.preventDefault();
      if (pendingPromo) {
        closePromotion();
        clearSelection();
        return;
      }
      undo();
      return;
    }

    if (e.key === "Escape" && pendingPromo) {
      closePromotion();
      clearSelection();
    }
  });

  /* ---------- animation ---------- */

  function captureAnimationData(m) {
    const d = decodeMove(m);
    const data = {
      specs: [],
      flashTo: null
    };

    const fromSq = squareEls[d.from];
    const fromPiece = fromSq.querySelector(".piece");
    if (fromPiece) {
      data.specs.push({
        newSquare: d.to,
        oldRect: fromPiece.getBoundingClientRect()
      });
    }

    if (d.castle) {
      const r = rookSquares(state.side, d.castle);
      const rookEl = squareEls[r[0]].querySelector(".piece");
      if (rookEl) {
        data.specs.push({
          newSquare: r[1],
          oldRect: rookEl.getBoundingClientRect()
        });
      }
    }

    if (isCaptureEncoded(state, m)) data.flashTo = d.to;

    return data;
  }

  function applyAnimation(data) {
    if (!data) return;

    for (const spec of data.specs) {
      const el = squareEls[spec.newSquare].querySelector(".piece");
      if (!el || !spec.oldRect) continue;

      const newRect = el.getBoundingClientRect();
      const dx = spec.oldRect.left - newRect.left;
      const dy = spec.oldRect.top - newRect.top;

      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;

      el.style.transition = "none";
      el.style.transform = "translate(" + dx + "px," + dy + "px)";
      void el.offsetWidth;

      el.style.transition = "transform 150ms cubic-bezier(.2,.78,.28,1)";
      el.style.transform = "";

      setTimeout(() => {
        if (el && el.isConnected) {
          el.style.transition = "";
          el.style.transform = "";
        }
      }, 190);
    }

    if (data.flashTo != null) {
      const sq = squareEls[data.flashTo];
      sq.classList.add("capture-flash");
      setTimeout(() => {
        if (sq) sq.classList.remove("capture-flash");
      }, 260);
    }
  }

  /* ---------- sounds ---------- */

  let audioCtx = null;
  let masterGain = null;

  function ensureAudio() {
    if (audioCtx) {
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;

      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.24;
      masterGain.connect(audioCtx.destination);
    } catch (_) {
      audioCtx = null;
    }
  }

  function tone(freq, dur, type, vol, freqEnd) {
    if (!audioCtx || !masterGain) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type || "triangle";
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + dur);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + dur + 0.03);
  }

  function playMoveSound(info, statusVal) {
    if (!audioCtx) return;

    if (info && info.captured) {
      tone(230, 0.18, "triangle", 0.42, 110);
      tone(145, 0.22, "sine", 0.24, 90);
    } else {
      tone(392, 0.11, "triangle", 0.26, 292);
    }

    if (statusVal === "check" || statusVal === "checkmate") {
      tone(660, 0.10, "sine", 0.19, 630);
      tone(880, 0.14, "sine", 0.16, 820);
    }

    if (statusVal === "checkmate") {
      tone(440, 0.38, "sawtooth", 0.2, 190);
    }
  }

  /* ---------- UCI parsing ---------- */

  function parseUci(uci) {
    if (typeof uci !== "string") return null;
    const s = uci.trim().toLowerCase();
    if (s.length < 4 || s.length > 5) return null;

    const from = sqIndex(s.slice(0, 2));
    const to = sqIndex(s.slice(2, 4));
    if (from < 0 || to < 0) return null;

    let promo = 0;
    if (s.length === 5) {
      const p = s[4];
      if (p === "q") promo = PROMO_Q;
      else if (p === "r") promo = PROMO_R;
      else if (p === "b") promo = PROMO_B;
      else if (p === "n") promo = PROMO_N;
      else return null;
    }

    return { from, to, promo };
  }

  function findMoveFromUci(uci) {
    const parsed = parseUci(uci);
    if (!parsed) return null;

    for (const m of currentLegal) {
      const d = decodeMove(m);
      if (d.from === parsed.from && d.to === parsed.to && d.promo === parsed.promo) {
        return m;
      }
    }

    return null;
  }

  /* ---------- core game actions ---------- */

  function performGameMove(m, animate) {
    if (!m || state.gameOver) return false;
    if (!currentLegal.includes(m)) return false;

    closePromotion();
    clearSelection();

    const legalBefore = currentLegal;
    const snap = snapshotState(state);
    const anim = animate ? captureAnimationData(m) : null;

    const info = applyMove(state, m);
    const san = computeSanFromSnapshot(snap, m, legalBefore);

    state.history.push({
      san,
      uci: moveToUci(m),
      from: info.from,
      to: info.to,
      captured: info.captured || 0,
      side: info.sideBefore,
      snapshot: snap
    });

    incRep(state);
    updateCurrentLegal();
    refreshAfterMutation();

    renderBoard();
    applyBoardHighlights();
    updateStatus();
    renderMoves();
    renderPanel();

    if (animate) applyAnimation(anim);

    playMoveSound(info, lastStatusVal);
    saveGame();

    if (engineOn) scheduleEngine();

    return true;
  }

  function undo() {
    if (!state.history.length) return false;

    cancelEngine();
    closePromotion();
    clearSelection();

    decRep(state);

    const entry = state.history.pop();

    state.board = entry.snapshot.board.slice();
    state.side = entry.snapshot.side;
    state.castling = entry.snapshot.castling;
    state.ep = entry.snapshot.ep;
    state.halfmove = entry.snapshot.halfmove;
    state.fullmove = entry.snapshot.fullmove;
    state.kingW = entry.snapshot.kingW;
    state.kingB = entry.snapshot.kingB;
    state.gameOver = null;

    updateCurrentLegal();
    refreshAfterMutation();

    renderBoard();
    applyBoardHighlights();
    updateStatus();
    renderMoves();
    renderPanel();
    saveGame();

    if (engineOn) scheduleEngine();

    return true;
  }

  function newGame() {
    cancelEngine();
    closePromotion();
    clearSelection();

    const parsed = parseFen(START_FEN);
    assignState(parsed, START_FEN);

    repCount.clear();
    incRep(state);
    updateCurrentLegal();
    refreshAfterMutation();

    isFlipped = false;
    updateBoardOrientation();
    updateLabels();

    renderBoard();
    applyBoardHighlights();
    updateStatus();
    renderMoves();
    renderPanel();

    saveGame();
    if (engineOn) scheduleEngine();
  }

  function loadGame(fen) {
    const parsed = parseFen(fen);
    if (!parsed) return false;

    cancelEngine();
    closePromotion();
    clearSelection();

    assignState(parsed, fen);
    state.startFen = toFen(state);

    repCount.clear();
    incRep(state);
    updateCurrentLegal();
    refreshAfterMutation();

    updateBoardOrientation();
    updateLabels();

    renderBoard();
    applyBoardHighlights();
    updateStatus();
    renderMoves();
    renderPanel();

    saveGame();
    if (engineOn) scheduleEngine();

    return true;
  }

  function flipBoard() {
    isFlipped = !isFlipped;
    updateBoardOrientation();
    updateLabels();
    renderBoard();
    applyBoardHighlights();
    saveGame();
  }

  /* ---------- persistence ---------- */

  const SAVE_KEY = "gambit-chess-v1";

  function saveGame() {
    try {
      const data = {
        v: 1,
        startFen: state.startFen,
        moves: state.history.map(h => h.uci),
        flipped: isFlipped
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (_) {
      // localStorage may be unavailable; persistence simply fails quietly.
    }
  }

  function restoreSaved(data) {
    if (!data || typeof data.startFen !== "string" || !Array.isArray(data.moves)) return false;

    const parsed = parseFen(data.startFen);
    if (!parsed) return false;

    assignState(parsed, data.startFen);
    state.startFen = toFen(state);

    if (typeof data.flipped === "boolean") isFlipped = data.flipped;
    else isFlipped = false;

    repCount.clear();
    incRep(state);
    updateCurrentLegal();

    for (const uci of data.moves) {
      const m = findMoveFromUci(uci);
      if (!m) return false;

      const legalBefore = currentLegal;
      const snap = snapshotState(state);
      const info = applyMove(state, m);
      const san = computeSanFromSnapshot(snap, m, legalBefore);

      state.history.push({
        san,
        uci: moveToUci(m),
        from: info.from,
        to: info.to,
        captured: info.captured || 0,
        side: info.sideBefore,
        snapshot: snap
      });

      incRep(state);
      updateCurrentLegal();
    }

    refreshAfterMutation();

    updateBoardOrientation();
    updateLabels();
    renderBoard();
    applyBoardHighlights();
    updateStatus();
    renderMoves();
    renderPanel();

    return true;
  }

  function loadSaved() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!restoreSaved(data)) return false;
      saveGame();
      return true;
    } catch (_) {
      return false;
    }
  }

  /* ---------- engine opponent and search ---------- */

  function cancelEngine() {
    if (engineTimer) {
      clearTimeout(engineTimer);
      engineTimer = null;
    }
    engineRunId++;
  }

  function scheduleEngine() {
    if (!engineOn || state.gameOver || state.side !== BLACK) return;

    if (engineTimer) clearTimeout(engineTimer);
    const run = ++engineRunId;

    engineTimer = setTimeout(() => {
      engineTimer = null;

      if (run !== engineRunId || !engineOn || state.gameOver || state.side !== BLACK) return;

      const m = bestMoveEncoded(800);
      if (m) performGameMove(m, true);
    }, 650);
  }

  function toggleEngine() {
    engineOn = !engineOn;
    engineBtn.setAttribute("aria-pressed", engineOn ? "true" : "false");
    engineBtn.textContent = engineOn ? "Engine: on" : "Engine: off";

    if (engineOn) scheduleEngine();
    else cancelEngine();
  }

  function evaluate(st) {
    let whiteScore = 0;
    let blackScore = 0;

    for (let i = 0; i < 64; i++) {
      const p = st.board[i];
      if (!p) continue;

      const t = abs(p);
      const val = PIECE_VALUE[t];

      if (p > 0) {
        whiteScore += val + PST[t][i];
      } else {
        const mirrored = ((7 - rankOf(i)) << 3) | fileOf(i);
        blackScore += val + PST[t][mirrored];
      }
    }

    return st.side === WHITE ? (whiteScore - blackScore) : (blackScore - whiteScore);
  }

  function orderedMoves(st, moves) {
    const scored = [];

    for (const m of moves) {
      const d = decodeMove(m);
      const from = d.from;
      const to = d.to;
      const piece = st.board[from];
      const type = abs(piece);

      let score = 0;
      const victim = st.board[to];
      const victimAbs = victim ? abs(victim) : 0;

      if (victimAbs) {
        score += 100 * PIECE_VALUE[victimAbs] - PIECE_VALUE[type] + 100;
      } else if (type === P && st.ep !== -1 && to === st.ep && st.board[to] === 0) {
        score += 100;
      }

      if (d.promo) {
        score += 90 + PIECE_VALUE[PROMO_TO_PIECE[d.promo]];
      }

      if (d.castle) score += 12;

      scored.push({ m, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.map(x => x.m);
  }

  let timeLimit = 0;
  let stopFlag = false;
  let nodes = 0;

  function negamax(st, depth, alpha, beta) {
    if (stopFlag) return 0;

    if ((nodes & 255) === 0 && performance.now() > timeLimit) {
      stopFlag = true;
      return 0;
    }
    nodes++;

    if (depth <= 0) return evaluate(st);

    const moves = legalMoves(st);
    if (moves.length === 0) {
      if (isInCheck(st)) return -MATE + depth;
      return 0;
    }

    const ordered = orderedMoves(st, moves);

    let best = -Infinity;

    for (const m of ordered) {
      const info = applyMove(st, m);
      const score = -negamax(st, depth - 1, -beta, -alpha);
      unapplyMove(st, m, info);

      if (stopFlag) break;

      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }

    return best;
  }

  function bestMoveEncoded(ms) {
    let budget = Number(ms);
    if (!Number.isFinite(budget) || budget < 0) budget = 0;

    const st = cloneSearchState(state);
    const rootMoves = legalMoves(st);

    if (rootMoves.length === 0) return null;

    if (budget < 12) return rootMoves[0];

    const ordered = orderedMoves(st, rootMoves);

    timeLimit = performance.now() + budget;
    stopFlag = false;
    nodes = 0;

    let best = rootMoves[0];

    for (let depth = 1; depth <= MAX_SEARCH_DEPTH && !stopFlag; depth++) {
      let alpha = -Infinity;
      let beta = Infinity;
      let depthBest = null;
      let depthBestScore = -Infinity;

      for (const m of ordered) {
        if ((nodes & 255) === 0 && performance.now() > timeLimit) {
          stopFlag = true;
          break;
        }
        nodes++;

        const info = applyMove(st, m);
        const score = -negamax(st, depth - 1, -beta, -alpha);
        unapplyMove(st, m, info);

        if (stopFlag) break;

        if (score > depthBestScore) {
          depthBestScore = score;
          depthBest = m;
        }

        if (depthBestScore > alpha) alpha = depthBestScore;
        if (alpha >= beta) break;
      }

      if (!stopFlag && depthBest) best = depthBest;
      if (stopFlag) break;
    }

    return best;
  }

  /* ---------- perft ---------- */

  function perftCalc(st, depth) {
    if (depth < 0) return 0;
    if (depth === 0) return 1;

    let total = 0;

    forEachLegalMove(st, m => {
      const info = applyMove(st, m);
      total += perftCalc(st, depth - 1);
      unapplyMove(st, m, info);
    });

    return total;
  }

  /* ---------- controls wiring ---------- */

  newBtn.addEventListener("click", () => {
    ensureAudio();
    newGame();
  });

  flipBtn.addEventListener("click", () => {
    ensureAudio();
    flipBoard();
  });

  undoBtn.addEventListener("click", () => {
    ensureAudio();
    undo();
  });

  engineBtn.addEventListener("click", () => {
    ensureAudio();
    toggleEngine();
  });

  window.addEventListener("resize", fitStage);

  /* ---------- init ---------- */

  createBoardSquares();
  updateBoardOrientation();
  updateLabels();
  fitStage();

  if (!loadSaved()) newGame();

  /* ---------- grader API ---------- */

  window.__arena = {
    fen() {
      return toFen(state);
    },

    load(fen) {
      return loadGame(fen);
    },

    moves(square) {
      if (square === undefined) {
        return currentLegal.map(moveToUci);
      }

      const sq = sqIndex(square);
      if (sq < 0) return [];

      const seen = new Set();
      for (const m of currentLegal) {
        if ((m & 63) === sq) seen.add(sqName((m >> 6) & 63));
      }

      return Array.from(seen);
    },

    move(uci) {
      const m = findMoveFromUci(uci);
      if (!m) return false;
      return performGameMove(m, true);
    },

    perft(depth) {
      let d = Number(depth);
      if (!Number.isInteger(d) || d < 0) return 0;

      const st = cloneSearchState(state);
      return perftCalc(st, d);
    },

    san(uci) {
      const m = findMoveFromUci(uci);
      if (!m) return null;

      return computeSanFromSnapshot(state, m, currentLegal);
    },

    bestMove(ms) {
      const m = bestMoveEncoded(ms);
      return m ? moveToUci(m) : null;
    }
  };
})();
</script>
</body>
</html>
```