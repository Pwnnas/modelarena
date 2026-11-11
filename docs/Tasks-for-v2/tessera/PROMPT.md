# Task: Tessera — a modern block-stacking game with guideline rules

Build a complete, polished 10 × 20 block-stacking game (the classic "stack four at a time"
genre) that implements the modern guideline rules *exactly*: Super Rotation System kicks, a
seeded 7-bag randomiser, hold, ghost piece, lock delay, T-spin detection, perfect clears,
guideline scoring, a deterministic replay system — plus an autoplay agent that can play the
game by itself.

This is not a "looks like Tetris" brief: the grader drives the rules, checks the numbers and
compares replays.

## Ground rules

- Deliver **one file: `index.html`** with all HTML, CSS and JavaScript inline.
- **No external resources of any kind**: no CDNs, libraries, frameworks, web fonts, remote
  images or audio files. Every sound must be synthesized in code. Network access is blocked
  during grading.
- Target: latest desktop Google Chrome at a 1280×800 viewport; adapt to window resizing.
- No errors in the console. Never use `alert`, `confirm` or `prompt`.
- The page starts with an empty `localStorage` (fresh browser profile).
- You are scored two ways:
  1. **Automated grader**: a headless browser drives your page through the *Grader contract*
     below, using real mouse and keyboard input, and measures correctness, robustness and
     performance. Follow the contract exactly (ids, attributes and names are case-sensitive).
  2. **Blind human judging**: your page is shown side by side with other submissions; people
     play and listen to both and pick the better one on look & feel, sound, interaction quality
     and overall polish.

## The well

- 10 columns × 20 rows. **Row 0 is the top row**, column 0 is the leftmost column. There are
  no hidden rows: pieces spawn fully visible.
- Seven pieces. The ids used by the grader in `board()` and in `data-piece` attributes are
  `I = 1, J = 2, L = 3, O = 4, S = 5, T = 6, Z = 7`.
- **Spawn orientations** (the flat row is on the *bottom* for J, L, S, T, Z):
I (4×1) J (3×2) L (3×2) O (2×2) S (3×2) T (3×2) Z (3×2)
IIII J.. ..L OO .SS .T. ZZ.
JJJ JJJ OO SS. JJJ .ZZ

- **Spawn position**: the piece's bounding box is horizontally centred — a 3-wide piece starts
  at column 3, the 4-wide I at column 3, the 2-wide O at column 4 — and the top of the box is
  row 0.

## Movement, rotation, locking

- ← / → move the piece one column when the move is legal.
- The piece rotates 90° clockwise (`cw`) or counter-clockwise (`ccw`) around its rotation
  centre: J, L, S, T and Z rotate around the centre of their 3×3 box, the I rotates around
  the centre of its 4×4 box, and the **O never changes shape**.
- Rotation uses **Super Rotation System kicks**: if the rotated position collides, the piece is
  offset by the first legal entry of the table for that transition. The tables below are given
  in *well coordinates*: `dx` is columns, `dy` is rows, **positive `dy` is downwards**.
  `0` = spawn orientation, `R` = one step clockwise, `2` = 180°, `L` = one step
  counter-clockwise.

  **J, L, S, T, Z**

  | from → to | offsets, in order |
  |---|---|
  | 0→R | (0,0) (−1,0) (−1,−1) (0,+2) (−1,+2) |
  | R→0 | (0,0) (+1,0) (+1,+1) (0,−2) (+1,−2) |
  | R→2 | (0,0) (+1,0) (+1,+1) (0,−2) (+1,−2) |
  | 2→R | (0,0) (−1,0) (−1,−1) (0,+2) (−1,+2) |
  | 2→L | (0,0) (+1,0) (+1,−1) (0,+2) (+1,+2) |
  | L→2 | (0,0) (−1,0) (−1,+1) (0,−2) (−1,−2) |
  | L→0 | (0,0) (−1,0) (−1,−1) (0,−2) (−1,−2) |
  | 0→L | (0,0) (+1,0) (+1,−1) (0,+2) (+1,+2) |

  **I**

  | from → to | offsets, in order |
  |---|---|
  | 0→R | (0,0) (−2,0) (+1,0) (−2,+1) (+1,−2) |
  | R→0 | (0,0) (+2,0) (−1,0) (+2,−1) (−1,+2) |
  | R→2 | (0,0) (−1,0) (+2,0) (−1,−2) (+2,+1) |
  | 2→R | (0,0) (+1,0) (−2,0) (+1,+2) (−2,−1) |
  | 2→L | (0,0) (+2,0) (−1,0) (+2,−1) (−1,+2) |
  | L→2 | (0,0) (+2,0) (−1,0) (+2,−1) (−1,+2) |
  | L→0 | (0,0) (+1,0) (−2,0) (+1,+2) (−2,−1) |
  | 0→L | (0,0) (−1,0) (+2,0) (−1,−2) (+2,+1) |

- If no entry of the table produces a legal position, the rotation is **refused** and the piece
  does not move. A rotation must never leave the piece overlapping a locked block or outside
  the well.
- ↓ soft drop moves the piece down one row (+1 point per row). Space hard drops the piece as
  far as it can go, locks it immediately (+2 points per row).
- When the piece cannot move down it *rests*: it does **not** lock for **500 ms**. Any
  successful move or rotation during that window restarts the 500 ms, at most **15** times.
  After that the piece locks.
- Locked cells join the stack, every completely filled row is removed and everything above it
  falls down. The next piece spawns immediately; if the spawn position is blocked the game is
  over.

## Randomiser

- **7-bag**: shuffle the seven pieces, deal that order, then reshuffle.
- The generator is seeded. The default seed is fixed; `setSeed(n)` changes it. The same seed
  always produces the same sequence of pieces.

## Hold

- One hold slot. Holding stores the active piece and brings out the held one (a new piece if
  the slot is empty). Hold may be used only **once per piece**: a second attempt before the
  current piece locks is ignored.

## Ghost

- A ghost outline shows where the active piece would land.

## Gravity & level

- `level = floor(lines / 10) + 1`.
- Fall interval per row: `max(50, round(1000 × 0.8^(level − 1)))` milliseconds.
- Gravity runs on a fixed-timestep loop, independent of the display refresh rate.

## Scoring

- Line clear base: 1 row **100**, 2 rows **300**, 3 rows **500**, 4 rows **800**, multiplied
  by the current level.
- T-spin (full): 0 rows **400**, 1 row **800**, 2 rows **1200**, 3 rows **1600**, × level.
- T-spin mini: 0 rows **100**, 1 row **200**, 2 rows **400**, × level.
- A T-spin that clears rows uses the T-spin value *instead of* the line-clear base.
- **Back-to-back**: if the previous line-clearing placement was a 4-row clear or any T-spin,
  the base of the current clear is multiplied by **1.5**.
- **Combo**: `combo` counts consecutive line-clearing placements. A placement with
  `combo ≥ 2` adds **50 × (combo − 1) × level**.
- **Perfect clear**: if the well is empty after the clear, add **800 / 1200 / 1800 / 2000**
  (for 1 / 2 / 3 / 4 rows) × level.
- Soft drop +1 per row, hard drop +2 per row.
- `state().lastSpin` reports the last spin: `"none"`, `"mini"` or `"full"`.

## T-spin rule

- A T-spin is registered when the **last successful action was a rotation** *and* at least
  three of the four diagonal cells around the T's centre cell are occupied. Locked blocks, the
  floor and the walls all count as occupied.
- The T's centre cell is the middle cell of its three-cell bar.
- *Full* vs *mini*: if both **front corners** — the two corners on the side the T points at —
  are occupied, it is a **full** T-spin, otherwise a **mini** T-spin.

## Input

- ← → move, ↓ soft drop, Space hard drop, ↑ or X rotate CW, Z or Ctrl rotate CCW,
  C or Shift hold, P or Esc pause/resume, R restart.
- Keys are handled at the document level and `preventDefault()` is called for Space and the
  arrows, so the game works even when a button has focus and the page never scrolls.
- A held direction key auto-repeats: first repeat after ~150 ms, then every ~35 ms.
- On-screen buttons mirror every action and work with mouse and touch (press-and-hold works).

## UI

- The well is drawn on a `<canvas id="board">`.
- `#score`, `#lines`, `#level` show the current numbers as text.
- `#hold` shows the held piece and carries `data-piece` with the piece letter (`"I"…"Z"`) or
  `"none"`.
- `#next` shows the next five pieces; every preview element has `data-preview="0".."4"` and a
  `data-piece` attribute.
- `#pause`, `#restart`, `#autoplay` and `#mute` are buttons. `#autoplay` and `#mute` carry
  `aria-pressed="true"` / `"false"`.
- `#controls` holds the on-screen buttons; each has a `data-action` attribute:
  `left`, `right`, `cw`, `ccw`, `soft`, `hard`, `hold`.
- `#overlay` reports the state of the game through `data-state`: `playing`, `paused` or `over`.
- `#fps` shows the current frame rate.

## Autoplay

- `#autoplay` toggles an agent that plays the game by itself. It must genuinely play: it has to
  clear lines, not just wiggle the piece.

## Persistence

- `localStorage["tessera.best"]` — the best score so far (a number), updated whenever the score
  beats it.
- `localStorage["tessera.settings"]` — a JSON object that contains at least `mute` (boolean).

## Audio (synthesized)

- Every sound is synthesized with the Web Audio API: move, rotate, lock, line clear, tetris,
  level up, game over, plus optional music. The AudioContext is created or resumed on the
  first user interaction. `#mute` silences everything.

## Polish (judged by humans)

- Looks like a premium modern block-stacking game: crisp board, elegant side panels, good
  typography and colour, tasteful glow.
- Satisfying feedback: the piece locks with a flash, lines clear with a sweep and a shake,
  tetris and T-spins get their own celebration, level-up is announced.
- Feels solid: no input lag, no dropped frames, obvious controls, a readable HUD.

## Grader contract

`window.__arena` must exist and provide:

| method | behaviour |
|---|---|
| `state()` | `{ phase, score, lines, level, combo, b2b, gravityMs, lastSpin, hold, next, seed }` — `phase` is `"playing"`, `"paused"` or `"over"`; `hold` is the held letter or `"none"`; `next` is an array with the next five piece letters |
| `board()` | array of 200 numbers, row-major from the top-left (index `row * 10 + col`); `0` = empty, otherwise the piece id (1…7) of the locked cell |
| `piece()` | `{ type, rot, cells }` for the active piece, where `cells` is an array of `[col, row]` pairs in well coordinates (`null` when there is no active piece) |
| `ghostY()` | the row of the topmost cell of the ghost (the landing position) |
| `input(action)` | applies one of `left`, `right`, `cw`, `ccw`, `soft`, `hard`, `hold`; returns `true` when the action changed the game |
| `reset(seed?)` | starts a new game; when a seed is given it is used for that game |
| `setSeed(n)` | changes the seed used by the following games |
| `setBoard(cells)` | replaces the whole field with the given 200 numbers and spawns a new piece; it does **not** change score, lines, level, combo or back-to-back state |
| `spawn(type, x?, y?)` | replaces the active piece with the given type (`"I"…"Z"`); with `x`/`y` the piece's spawn-orientation bounding box is placed with its top-left cell at that column/row |
| `setLines(n)` | sets the lines counter (and therefore the level) without changing the score |
| `exportReplay()` | a string encoding every gameplay input since the game started |
| `importReplay(str)` | restarts the current game and replays that input string, reproducing the same result |

Also required:

- `localStorage["tessera.best"]` and `localStorage["tessera.settings"]` as described above.
- The keyboard mapping above, working without clicking anything first.
- The canvas really shows the well: when the stack changes, the rendered canvas changes.
- The game must survive a viewport resize, a tab blur (no time jumps, no bursts of catch-up
  gravity) and long play sessions.
