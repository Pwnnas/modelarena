# Task: Gambit — a chess board with a correct rules engine

Build a complete, playable chess app: a beautiful board you drive with the mouse, backed by a
fully correct chess engine, plus a built-in opponent.

## Ground rules

- Deliver **one file: `index.html`** with all HTML, CSS and JavaScript inline.
- **No external resources of any kind**: no CDNs, libraries, frameworks, web fonts, remote
  images or piece sets. Piece art must be Unicode glyphs, inline SVG or drawn in code. Network
  access is blocked during grading.
- Target: latest desktop Google Chrome at a 1280×800 viewport; adapt to window resizing.
- No errors in the console. Never use `alert`, `confirm` or `prompt`.
- The page starts with an empty `localStorage` (fresh browser profile).
- You are scored two ways:
  1. **Automated grader**: a headless browser drives your page through the *Grader contract*
     below, using real mouse and keyboard input, and calls your `window.__arena` API directly.
     It measures correctness, robustness and speed, and awards partial credit per check.
     Follow the contract exactly (ids, attributes and names are case-sensitive).
  2. **Blind human judging**: your page is shown side by side with other submissions; people
     play both and pick the better one on beauty, clarity and feel.

## Requirements

### Board
- A standard 8×8 board; from White's view **a1 is the bottom-left square and is dark**
  (a1, h8 dark; h1, a8 light). File letters (a–h) and rank numbers (1–8) are visible.
- Standard starting position. Pieces must be drawn without external assets (Unicode is fine,
  inline SVG is better) and must be clearly distinguishable and attractive.
- Squares are hit-testable over their whole area. The board scales with the window and stays
  square-celled.

### Interaction
- **Click-to-move**: click a piece, its legal destinations are marked; click a destination to
  move. Clicking another of your own pieces re-targets the selection.
- **Drag & drop**: press on a piece, drag, release on a destination. Both input styles must work.
- Illegal moves are never applied (the position must not change at all).
- **Promotion**: when a pawn reaches the last rank, show a chooser with four options
  (queen/rook/bishop/knight). The move is **not** applied until a piece is chosen.
- Last move, current selection and check are visually highlighted.
- Moving pieces animate smoothly (≈80–200 ms); no teleporting.

### Rules
- Complete legal move generation for every piece, including: pawn double push, **en passant**
  (only on the immediately following move), **castling** on both sides (king and rook unmoved,
  squares between empty, king not in / through / into check), promotion to Q/R/B/N.
- Detect and expose **check**, **checkmate**, **stalemate**, and draws by **insufficient
  material** (e.g. K vs K, K+B vs K), the **50-move rule** and **threefold repetition**
  (same position with the same side to move, castling rights and en-passant availability).
- Once the game is over, no further moves are accepted.

### Game management
- `#new` starts a fresh game; `#flip` flips the board orientation; `#undo` (and Ctrl/Cmd+Z)
  takes back the last move.
- Show a move list in SAN, and optionally captured pieces / a material count.
- `#engine` toggles a built-in opponent that plays **Black**. It is **off on first load**.
  When on, it must answer the player's move within ~2 s with a legal move.

### Persistence
- The full game state (position + move history) survives a page reload.

### Performance
- `perft(4)` from the start position must finish in well under 10 s.
- The board must stay responsive (no multi-second freezes) while playing and animating.

### Polish (judged by humans)
- Looks like a premium chess app: board palette, typography, coordinate labels, subtle
  shadows, satisfying highlight and capture animations. Synthesized sound effects are welcome
  (no audio files). The opponent should move at a human pace, not instantly.

## Grader contract

1. **Squares**: exactly 64 elements with `data-square="a1"` … `"h8"`, each also carrying
   `data-color="light"` or `data-color="dark"`. Geometry must match the orientation: with
   `#board[data-flipped="false"]`, `a1`'s box is below `a8`'s and left of `h1`'s. `#board`
   carries `data-flipped="true"` when flipped.
2. **Pieces**: every occupied square contains **exactly one descendant element** with
   `data-piece` = `wK wQ wR wB wN wP bK bQ bR bB bN bP`. Empty squares contain none.
3. **Legal targets**: while a piece is selected, every square that is a legal destination has
   `data-legal="true"`; the attribute is removed everywhere when nothing is selected.
4. **Last move**: the origin and destination squares of the most recent move have
   `data-last="true"` (and only those).
5. **Status**: an element `#status` with `data-state` ∈ `normal | check | checkmate |
   stalemate | draw` and `data-turn` ∈ `w | b`, kept current at all times.
6. **Promotion chooser**: visible elements `[data-promote="q"]`, `[data-promote="r"]`,
   `[data-promote="b"]`, `[data-promote="n"]`.
7. **Controls**: buttons `#new`, `#flip`, `#undo`; `#engine` toggles the opponent and has
   `aria-pressed="true"` while it is on.
8. **`window.__arena`** (all calls must be reflected in the DOM/board immediately):
   - `fen()` → the current position as a 6-field FEN string.
   - `load(fen)` → `true` if the FEN was accepted; the board, status and history reset to it.
   - `moves(square?)` → with a square name: the **unique** target squares of that piece's legal
     moves (order irrelevant). Without an argument: **all** legal moves as UCI strings, e.g.
     `"e2e4"`, `"e7e8q"`, `"e1g1"`.
   - `move(uci)` → `true` and applies the move exactly like a user move (animation, history,
     status, repetition table); `false` and no change if it is illegal or the game is over.
   - `perft(depth)` → the number of leaf nodes for the current position.
   - `san(uci)` → the SAN of a legal move in the current position (`null` if illegal), e.g.
     `"Nbd2"`, `"exd5"`, `"O-O"`, `"Qh8+"`, `"Rb8#"`.
   - `bestMove(ms)` → a UCI move for the side to move, chosen within the time budget in
     milliseconds. Must be legal whenever a legal move exists.
9. **Keyboard**: Ctrl/Cmd+Z undoes the last move with the page focused and no UI clicked first.
10. **Persistence**: after a reload, `fen()` and `#status` report the same game as before.
