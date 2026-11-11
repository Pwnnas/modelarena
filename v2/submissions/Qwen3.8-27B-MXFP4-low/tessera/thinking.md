This is a complex task to build a complete Tetris-like game with specific rules, a grader contract, and various features. Let me break down what I need to implement:

1. **Game Board**: 10×20 grid
2. **Pieces**: 7 tetrominoes with specific spawn orientations
3. **SRS Rotation System**: With kick tables
4. **7-bag Randomizer**: Seeded
5. **Hold System**: Once per piece
6. **Ghost Piece**: Shows landing position
7. **Lock Delay**: 500ms, max 15 resets
8. **T-spin Detection**: With full/mini distinction
9. **Scoring**: With B2B, combo, perfect clear
10. **Gravity**: Fixed timestep
11. **Autoplay Agent**: Must actually clear lines
12. **Replay System**: Deterministic
13. **UI**: Canvas rendering, HUD, buttons
14. **Audio**: Web Audio API synthesized
15. **Persistence**: localStorage
16. **Grader Contract**: `window.__arena`

Let me plan the architecture:

- Game state object
- Piece definitions (shapes, rotations)
- SRS kick tables
- Seeded random number generator (for 7-bag)
- Game loop (fixed timestep for gravity)
- Input handling (keyboard + buttons + autoplay)
- Canvas rendering
- Audio synthesis
- Autoplay AI
- Replay system
- Grader contract methods

Let me think about the piece definitions:

Pieces and their rotations (using 3×3 or 4×4 boxes):

**J piece** (3×3 box):
- Spawn (0): cells at (0,1), (0,2), (1,2), (2,2) → J.. / JJJ
- R (1): cells at (2,0), (2,1), (2,2), (1,2) → ..J / .JJ / ..J
- 2 (2): cells at (0,0), (1,0), (2,0), (2,1) → JJJ / ..J
- L (3): cells at (0,0), (0,1), (0,2), (1,0) → J.. / JJJ / ..J

Wait, let me be more careful. The spawn orientation shows:
```
J (3×2)
J..
JJJ
```

So in the 3×3 box, the spawn is in the top two rows. Let me define cells relative to the 3×3 box:

J spawn (0): (0,0), (0,1), (1,1), (2,1)
J R (1): (2,0), (1,1), (2,1), (2,2)
J 2 (2): (0,0), (1,0), (2,0), (2,1)
J L (3): (0,0), (0,1), (0,2), (1,2)

Wait, let me think about this more carefully. The SRS rotation is around the center of the 3×3 box. The center is at (1,1) in the 3×3 box.

For a 3×3 box, rotation clockwise around center (1,1):
- (x, y) → (1 - (y - 1), 1 + (x - 1)) = (2 - y, x)

Let me verify: (0,0) → (2, 0), (2,0) → (2, 2), (2,2) → (0, 2), (0,2) → (0, 0). Yes, that's correct for clockwise rotation.

**J piece:**
- Spawn (0): (0,0), (0,1), (1,1), (2,1)
- R (1): rotate (0,0)→(2,0), (0,1)→(1,0), (1,1)→(1,1), (2,1)→(1,2)
  So R: (2,0), (1,0), (1,1), (1,2)
- 2 (2): rotate (2,0)→(2,2), (1,0)→(2,1), (1,1)→(1,1), (1,2)→(0,1)
  So 2: (2,2), (2,1), (1,1), (0,1)
- L (3): rotate (2,2)→(0,2), (2,1)→(1,2), (1,1)→(1,1), (0,1)→(1,0)
  So L: (0,2), (1,2), (1,1), (1,0)

Let me verify with the visual:
```
J..       ..J       JJJ       J..
JJJ       .JJ       ..J       JJJ
          ..J       ..J       ..J
```

Wait, the standard SRS orientations for J:
- 0: 
```
J..
JJJ
...
```
- R:
```
..J
.JJ
.J.
```
- 2:
```
...
JJJ
..J
```
- L:
```
J..
J..
JJ.
```

Hmm, let me reconsider. The standard SRS piece definitions:

J piece in 3×3:
- 0: (0,0), (0,1), (1,1), (2,1)
- R: (1,0), (1,1), (2,1), (1,2)
- 2: (1,1), (2,1), (2,2), (0,2)  -- wait this doesn't look right

Actually let me just use the standard SRS definitions that are well-known:

**J piece:**
- 0: [(0,0), (0,1), (1,1), (2,1)]
- R: [(1,0), (1,1), (2,1), (1,2)]
- 2: [(1,1), (2,1), (2,2), (0,2)]  -- hmm

Wait, I should just apply the rotation formula. Let me redo:

Clockwise rotation in a 3×3 box around center (1,1):
(x, y) → (2-y, x)

Counter-clockwise:
(x, y) → (y, 2-x)

**J piece:**
- 0: (0,0), (0,1), (1,1), (2,1)
- R (CW from 0): (2,0), (1,0), (1,1), (1,2)
  - (0,0)→(2,0), (0,1)→(1,0), (1,1)→(1,1), (2,1)→(1,2)
- 2 (CW from R): (2,2), (2,1), (1,1), (0,1)
  - (2,0)→(2,2), (1,0)→(2,1), (1,1)→(1,1), (1,2)→(0,1)
- L (CW from 2): (0,2), (1,2), (1,1), (1,0)
  - (2,2)→(0,2), (2,1)→(1,2), (1,1)→(1,1), (0,1)→(1,0)

Let me visualize:
- 0: 
```
J..
JJJ
...
```
- R:
```
..J
.JJ
.J.
```
- 2:
```
...
JJJ
..J
```
- L:
```
J..
J..
JJ.
```

Yes! That matches the standard SRS J piece.

**L piece:**
- 0: (2,0), (0,1), (1,1), (2,1)
  From the visual:
```
..L
LLL
...
```
So cells are (2,0), (0,1), (1,1), (2,1)

- R: (2,0)→(2,2), (0,1)→(1,0), (1,1)→(1,1), (2,1)→(1,2)
  R: (2,2), (1,0), (1,1), (1,2)
  Visual:
```
.L.
.L.
..L
```
Wait that doesn't look right. Let me recheck.

(2,0) → (2-0, 2) = (2, 2) ✓
(0,1) → (2-1, 0) = (1, 0) ✓
(1,1) → (2-1, 1) = (1, 1) ✓
(2,1) → (2-1, 2) = (1, 2) ✓

So R: (1,0), (1,1), (1,2), (2,2)
Visual:
```
.L.
.L.
.LL
```
Yes! That's correct for L piece R state.

- 2: (1,0)→(2,1), (1,1)→(1,1), (1,2)→(0,1), (2,2)→(0,2)
  2: (2,1), (1,1), (0,1), (0,2)
  Visual:
```
...
LLL
L..
```
Yes!

- L: (2,1)→(1,2), (1,1)→(1,1), (0,1)→(1,0), (0,2)→(0,0)
  L: (1,2), (1,1), (1,0), (0,0)
  Visual:
```
L..
L..
LL.
```
Yes!

**S piece:**
- 0: From visual:
```
.SS
SS.
...
```
Cells: (1,0), (2,0), (0,1), (1,1)

- R: (1,0)→(2,1), (2,0)→(2,2), (0,1)→(1,0), (1,1)→(1,1)
  R: (2,1), (2,2), (1,0), (1,1)
  Visual:
```
.S.
.SS
..S
```
Yes!

- 2: (2,1)→(1,2), (2,2)→(0,2), (1,0)→(2,1), (1,1)→(1,1)
  2: (1,2), (0,2), (2,1), (1,1)
  Visual:
```
...
.SS
SS.
```
Yes!

- L: (1,2)→(0,1), (0,2)→(0,0), (2,1)→(1,2), (1,1)→(1,1)
  L: (0,1), (0,0), (1,2), (1,1)
  Visual:
```
S..
SS.
.S.
```
Yes!

**Z piece:**
- 0: From visual:
```
ZZ.
.ZZ
...
```
Cells: (0,0), (1,0), (1,1), (2,1)

- R: (0,0)→(2,0), (1,0)→(2,1), (1,1)→(1,1), (2,1)→(1,2)
  R: (2,0), (2,1), (1,1), (1,2)
  Visual:
```
..Z
.ZZ
.Z.
```
Yes!

- 2: (2,0)→(2,2), (2,1)→(1,2), (1,1)→(1,1), (1,2)→(0,1)
  2: (2,2), (1,2), (1,1), (0,1)
  Visual:
```
...
.ZZ
ZZ.
```
Yes!

- L: (2,2)→(0,2), (1,2)→(0,1), (1,1)→(1,1), (0,1)→(1,0)
  L: (0,2), (0,1), (1,1), (1,0)
  Visual:
```
.Z.
ZZ.
Z..
```
Yes!

**T piece:**
- 0: From visual:
```
.T.
TTT
...
```
Cells: (1,0), (0,1), (1,1), (2,1)

- R: (1,0)→(2,1), (0,1)→(1,0), (1,1)→(1,1), (2,1)→(1,2)
  R: (2,1), (1,0), (1,1), (1,2)
  Visual:
```
.L.
.LL
.L.
```
Wait, for T it should be:
```
.T.
.TT
.T.
```
Hmm, let me recheck. (1,0)→(2-0, 1) = (2, 1). (0,1)→(2-1, 0) = (1, 0). (1,1)→(2-1, 1) = (1, 1). (2,1)→(2-1, 2) = (1, 2).
So R: (1,0), (2,1), (1,1), (1,2)
Visual:
```
.T.
.TT
.T.
```
Yes! That's correct.

- 2: (1,0)→(2,1), (2,1)→(1,2), (1,1)→(1,1), (1,2)→(0,1)
  2: (2,1), (1,2), (1,1), (0,1)
  Visual:
```
...
TTT
.T.
```
Yes!

- L: (2,1)→(1,2), (1,2)→(0,1), (1,1)→(1,1), (0,1)→(1,0)
  L: (1,2), (0,1), (1,1), (1,0)
  Visual:
```
.T.
TT.
.T.
```
Yes!

**O piece:**
- All rotations: (0,0), (1,0), (0,1), (1,1)
  Visual:
```
OO
OO
```
In a 2×2 box (or 3×3 with offset). Actually O is in a 2×2 box. But for consistency, I'll keep it as a 2×2 box that doesn't rotate.

Wait, the spec says "the O never changes shape." So I'll just keep the same cells for all rotations.

**I piece:**
The I piece is in a 4×4 box. The flat I sits in row 1 (second row) of its 4×4 box.

- 0: (0,1), (1,1), (2,1), (3,1)
  Visual:
```
....
IIII
....
....
```

Clockwise rotation in 4×4 box around center (1.5, 1.5):
(x, y) → (3-y, x)

- R: (0,1)→(2,0), (1,1)→(2,1), (2,1)→(2,2), (3,1)→(2,3)
  R: (2,0), (2,1), (2,2), (2,3)
  Visual:
```
..I.
..I.
..I.
..I.
```
Yes!

- 2: (2,0)→(3,2), (2,1)→(2,2), (2,2)→(1,2), (2,3)→(0,2)
  2: (3,2), (2,2), (1,2), (0,2)
  Visual:
```
....
....
IIII
....
```
Yes!

- L: (3,2)→(1,3), (2,2)→(1,2), (1,2)→(1,1), (0,2)→(1,0)
  L: (1,3), (1,2), (1,1), (1,0)
  Visual:
```
.I..
.I..
.I..
.I..
```
Yes!

Now let me plan the SRS kick tables. The spec gives them in well coordinates where positive dy is downwards.

For J, L, S, T, Z:
- 0→R: (0,0) (-1,0) (-1,-1) (0,+2) (-1,+2)
- R→0: (0,0) (+1,0) (+1,+1) (0,-2) (+1,-2)
- R→2: (0,0) (+1,0) (+1,+1) (0,-2) (+1,-2)
- 2→R: (0,0) (-1,0) (-1,-1) (0,+2) (-1,+2)
- 2→L: (0,0) (+1,0) (+1,-1) (0,+2) (+1,+2)
- L→2: (0,0) (-1,0) (-1,+1) (0,-2) (-1,-2)
- L→0: (0,0) (-1,0) (-1,+1) (0,-2) (-1,-2)
- 0→L: (0,0) (+1,0) (+1,-1) (0,+2) (+1,+2)

For I:
- 0→R: (0,0) (-2,0) (+1,0) (-2,+1) (+1,-2)
- R→0: (0,0) (+2,0) (-1,0) (+2,-1) (-1,+2)
- R→2: (0,0) (-1,0) (+2,0) (-1,-2) (+2,+1)
- 2→R: (0,0) (+1,0) (-2,0) (+1,+2) (-2,-1)
- 2→L: (0,0) (+2,0) (-1,0) (+2,-1) (-1,+2)
- L→2: (0,0) (-2,0) (+1,0) (-2,+1) (+1,-2)
- L→0: (0,0) (+1,0) (-2,0) (+1,+2) (-2,-1)
- 0→L: (0,0) (-1,0) (+2,0) (-1,-2) (+2,+1)

Now for the seeded random number generator, I'll use a simple PRNG like mulberry32 or similar.

For the 7-bag:
- Generate a permutation of [0,1,2,3,4,5,6] using the seeded RNG
- Deal them out
- When the bag is empty, generate a new permutation

For the autoplay agent, I need a simple but effective AI:
- For each possible position (column, rotation), simulate the drop
- Score based on: number of lines cleared, height penalty, holes penalty, bumpiness penalty
- Pick the best position
- Execute the moves to get there

For the replay system:
- Record each input action with a timestamp or just the sequence
- Since the game is deterministic with a fixed seed, just recording the sequence of actions should be sufficient
- But we need to handle timing... Actually, since the grader says "replays that input string synchronously, reproducing the same result", I think the replay just needs to record the sequence of actions in order.

Wait, but gravity is time-based. If I just record actions, the timing of gravity matters. Let me think about this...

Actually, for a deterministic replay, I need to record the exact sequence of actions in the order they occur. Since the game is deterministic (same seed, same actions in same order = same result), I just need to record the actions in order.

But wait - gravity adds rows over time. If I record "left, right, cw, hard" in order, the gravity between actions matters. So I need to either:
1. Record actions with timestamps
2. Record actions with the number of gravity ticks between them
3. Use a frame-based system where each "tick" is a fixed time step

I think the cleanest approach is to record actions in order, and since the game uses a fixed timestep, I can record the number of gravity ticks that occurred between each action. Or even simpler: since `importReplay` replays synchronously, I can just record the actions in order and replay them one by one. The gravity between actions would be... hmm.

Actually, re-reading the spec: "replays that input string synchronously, reproducing the same result: when it returns, the board, score and lines are already final"

I think the simplest approach is: record each action as it happens, and when replaying, just apply them in order. The gravity between actions is implicit in the order. But that's not quite right either, because gravity is continuous.

Let me think differently. For a truly deterministic replay, I should:
1. Use a fixed timestep for gravity
2. Record each action along with the tick number at which it occurred
3. When replaying, advance the game tick by tick, applying actions at the right tick

Or even simpler: since the game is fully deterministic given the seed and the sequence of actions (including their timing), I can encode the timing.

Actually, the simplest approach that works: record actions in order. When replaying, apply them one at a time. Between each action, advance gravity by a fixed number of ticks (or just let the piece fall naturally). But this won't reproduce the exact same game because gravity timing matters.

Hmm, let me reconsider. The spec says "a string encoding every gameplay input since the game started." So it's just the sequence of inputs. For the replay to be deterministic, the game must be deterministic given the same sequence of inputs.

But gravity is time-based... unless I make gravity tick-based and the replay records the number of ticks between inputs.

I think the cleanest solution is:
- The game runs on a fixed timestep (e.g., 16.67ms or the gravity interval)
- Each input is recorded with the tick number at which it occurred
- The replay string encodes: tick_number:action for each input
- When replaying, advance tick by tick, applying actions at the right tick

Actually, let me simplify further. I'll use a frame-based system:
- Each frame is a fixed duration
- Gravity advances once per frame
- Inputs are recorded as: frame_number:action
- Replay advances frame by frame

Wait, but the gravity interval changes with level. So I can't use a fixed frame for gravity.

Let me think about this differently. The key insight is: the game state is fully determined by:
1. The seed (determines piece sequence)
2. The sequence of actions and their timing relative to gravity

For a deterministic replay, I'll encode the number of "gravity ticks" between each action. A gravity tick is one step of the piece falling. The replay will:
1. Reset with the same seed
2. For each recorded action, advance gravity by the recorded number of ticks, then apply the action
3. After the last action, advance gravity until the game ends

Actually, I think the simplest approach that the grader likely expects is:
- Record actions in order (just the sequence)
- The replay applies them in order
- Since the game is deterministic with a fixed seed, and the actions are applied in the same order, the result is the same

But this only works if gravity doesn't affect the outcome differently based on timing. In a real Tetris game, timing matters a lot.

Let me re-read the spec: "replays that input string synchronously, reproducing the same result"

I think the intended interpretation is that the replay records enough information to reproduce the exact same game. The simplest way is to record the number of gravity steps between each action.

Let me go with this format:
- Each entry is: `ticks:action`
- E.g., `0:left;3:right;5:cw;2:hard`
- The replay advances gravity by `ticks` steps, then applies the action

Actually, I'll make it even simpler. I'll record actions as they happen, and between each pair of consecutive actions, I'll record the number of gravity ticks that elapsed. The format will be:
- `action:gravityTicks`
- E.g., `left:0 right:3 cw:5 hard:2`

When replaying:
1. Start a new game with the same seed
2. For each entry, advance gravity by the recorded number of ticks
3. Apply the action
4. After the last entry, the game state is final

Wait, but what about the initial state? The first piece spawns, and then gravity starts. So the first entry would be: advance gravity by N ticks, then apply action.

Let me just go with: the replay string is a sequence of `action:ticks` pairs. When replaying, for each pair, first advance gravity by `ticks` ticks, then apply the action. After all pairs are processed, the game is in its final state.

Hmm, but this is getting complicated. Let me simplify:

I'll record the replay as a JSON-like string: `["left",3,"right",5,"cw",2,"hard"]` where numbers are gravity ticks between actions.

Actually, for maximum simplicity and to ensure determinism, let me use a different approach:

The game runs on a fixed internal clock. Each "tick" is a fixed duration (let's say 1ms). Gravity advances the piece down by one row every `gravityMs` ticks. The replay records: for each action, the tick number at which it occurred.

Replay format: `tick1:action1,tick2:action2,...`

When replaying:
1. Reset with same seed
2. Advance tick by tick
3. At each recorded tick, apply the action
4. Continue until game over

This is the most robust approach. But it might produce very long strings.

For practical purposes, let me use: `action@tick` separated by commas.

OK let me just go with a simple approach: record the sequence of actions with the number of gravity ticks between them. The format will be a string like:
`0:left|3:right|5:cw|2:hard|...`

Where the number before the colon is the number of gravity ticks since the previous action (or since game start for the first action).

Let me now plan the code structure:

```javascript
// Constants
const COLS = 10, ROWS = 20;
const PIECES = { I: ..., J: ..., L: ..., O: ..., S: ..., T: ..., Z: ... };
const KICKS_JLSTZ = { ... };
const KICKS_I = { ... };

// State
let state = {
  board: [], // 20x10 array of 0-7
  activePiece: null, // { type, rot, x, y }
  hold: null,
  holdUsed: false,
  bag: [],
  rng: null,
  score: 0,
  lines: 0,
  level: 1,
  combo: -1,
  b2b: false,
  lastSpin: "none",
  phase: "playing",
  lockDelay: 0,
  lockResets: 0,
  replay: [],
  seed: 0,
};

// Functions
function resetGame(seed) { ... }
function nextPiece() { ... }
function tryMove(dx, dy) { ... }
function tryRotate(dir) { ... }
function hardDrop() { ... }
function softDrop() { ... }
function holdPiece() { ... }
function lockPiece() { ... }
function clearLines() { ... }
function checkTSpin() { ... }
function getGhostY() { ... }
function update() { ... } // main game loop
function render() { ... } // canvas rendering
```

Let me now write the full implementation. This is going to be a long file.

For the seeded RNG, I'll use mulberry32:
```javascript
function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
```

For the 7-bag:
```javascript
function refillBag() {
  const bag = [0, 1, 2, 3, 4, 5, 6];
  for (let i = 5; i >= 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  state.bag = bag;
}
```

For the piece definitions, I'll store them as arrays of [x, y] offsets in the bounding box:

```javascript
const PIECE_SHAPES = {
  I: [
    [[0,1],[1,1],[2,1],[3,1]], // 0
    [[2,0],[2,1],[2,2],[2,3]], // R
    [[0,2],[1,2],[2,2],[3,2]], // 2
    [[1,0],[1,1],[1,2],[1,3]], // L
  ],
  J: [
    [[0,0],[0,1],[1,1],[2,1]], // 0
    [[1,0],[1,1],[2,1],[1,2]], // R
    [[1,1],[2,1],[2,2],[0,2]], // 2
    [[0,0],[0,1],[0,2],[1,0]], // L
  ],
  // ... etc
};
```

Wait, I need to double-check my rotation calculations. Let me redo the J piece:

J spawn (0): (0,0), (0,1), (1,1), (2,1)

CW rotation in 3×3: (x,y) → (2-y, x)
- (0,0) → (2, 0)
- (0,1) → (1, 0)
- (1,1) → (1, 1)
- (2,1) → (1, 2)

So R: (2,0), (1,0), (1,1), (1,2)

CW from R:
- (2,0) → (2, 2)
- (1,0) → (2, 1)
- (1,1) → (1, 1)
- (1,2) → (0, 1)

So 2: (2,2), (2,1), (1,1), (0,1)

CW from 2:
- (2,2) → (0, 2)
- (2,1) → (1, 2)
- (1,1) → (1, 1)
- (0,1) → (1, 0)

So L: (0,2), (1,2), (1,1), (1,0)

Let me verify visually:
- 0:
```
J..
JJJ
...
```
✓

- R:
```
..J
.JJ
.J.
```
✓

- 2:
```
...
JJJ
..J
```
✓

- L:
```
J..
J..
JJ.
```
✓

Great. Now let me code this up properly.

For the O piece, it's special - it never changes shape. Its cells in all rotations are the same. But what box is it in? The spec says it's 2×2. I'll treat it as a 2×2 box where the cells are (0,0), (1,0), (0,1), (1,1) in all rotations.

Actually wait, looking at the spawn position: "the 2-wide O at column 4". So the O's bounding box top-left is at column 4, row 0. The cells are at (4,0), (5,0), (4,1), (5,1) in well coordinates.

For the I piece, the bounding box is 4×4, and the top of the box is at row 0. The flat I is in row 1 of the box. So the I's cells in spawn orientation are at (x+0, 1), (x+1, 1), (x+2, 1), (x+3, 1) where x is the left column of the box.

Spawn positions:
- 3-wide pieces (J, L, S, T, Z): box left = column 3
- 4-wide piece (I): box left = column 3
- 2-wide piece (O): box left = column 4

So the spawn x positions:
- I: x = 3 (box left), cells at (3,1), (4,1), (5,1), (6,1)
- J, L, S, T, Z: x = 3 (box left), cells at (3,0), (3,1), (4,1), (5,1) for J
- O: x = 4 (box left), cells at (4,0), (5,0), (4,1), (5,1)

Now for the T-spin detection:
- The T's centre cell is the middle cell of its three-cell bar
- In spawn orientation (0), the bar is horizontal: (0,1), (1,1), (2,1). The centre is (1,1).
- In R, the bar is vertical: (1,0), (1,1), (1,2). The centre is (1,1).
- In 2, the bar is horizontal: (0,1), (1,1), (2,1). The centre is (1,1).
- In L, the bar is vertical: (1,0), (1,1), (1,2). The centre is (1,1).

Wait, that's not right. Let me look at the T piece orientations:
- 0: (1,0), (0,1), (1,1), (2,1) - bar is (0,1)-(1,1)-(2,1), centre is (1,1)
- R: (1,0), (2,1), (1,1), (1,2) - bar is (1,0)-(1,1)-(1,2), centre is (1,1)
- 2: (2,1), (1,2), (1,1), (0,1) - bar is (0,1)-(1,1)-(2,1), centre is (1,1)
- L: (1,2), (0,1), (1,1), (1,0) - bar is (1,0)-(1,1)-(1,2), centre is (1,1)

So the centre is always (1,1) in the 3×3 box. In well coordinates, it's (x+1, y+1) where (x,y) is the box top-left.

The four diagonal cells around the centre (in well coordinates):
- Top-left: (x, y)
- Top-right: (x+2, y)
- Bottom-left: (x, y+2)
- Bottom-right: (x+2, y+2)

For T-spin: at least 3 of these 4 must be occupied.

For full vs mini: the "front corners" are the two corners on the side the T points at.
- In orientation 0 (pointing up): front corners are top-left and top-right
- In orientation R (pointing right): front corners are top-right and bottom-right
- In orientation 2 (pointing down): front corners are bottom-left and bottom-right
- In orientation L (pointing left): front corners are top-left and bottom-left

Wait, "the side the T points at" - the T piece has a "point" (the single cell sticking out). In orientation 0, the point is at the top (row 0), so it points up. The front corners would be the top two: top-left and top-right.

In orientation R, the point is at the right (column 2), so it points right. The front corners would be the right two: top-right and bottom-right.

In orientation 2, the point is at the bottom (row 2), so it points down. The front corners would be the bottom two: bottom-left and bottom-right.

In orientation L, the point is at the left (column 0), so it points left. The front corners would be the left two: top-left and bottom-left.

So:
- 0: front = top-left (x,y) and top-right (x+2,y)
- R: front = top-right (x+2,y) and bottom-right (x+2,y+2)
- 2: front = bottom-left (x,y+2) and bottom-right (x+2,y+2)
- L: front = top-left (x,y) and bottom-left (x,y+2)

If both front corners are occupied → full T-spin
If at least 3 of 4 are occupied but not both front → mini T-spin

Now let me think about the autoplay AI. A simple but effective approach:
1. For the current piece, try all valid positions (all columns × all rotations)
2. For each position, simulate the hard drop
3. Score the resulting board:
   - +1000 × lines cleared
   - -0.5 × height
   - -0.3 × holes
   - -0.5 × bumpiness (sum of absolute differences between adjacent column heights)
4. Pick the position with the best score
5. Execute the moves: rotate to the desired rotation, move to the desired column, hard drop

For the moves, I need to figure out the sequence of actions:
- Determine the target rotation
- Determine the target column
- Figure out the shortest path of moves

Actually, for simplicity, I'll:
1. Determine target rotation and column
2. Rotate to target (using CW or CCW as appropriate)
3. Move left/right to target column
4. Hard drop

But I need to be careful about the order - I should rotate first, then move, then drop. Or I could try all sequences and pick the one that works.

For a simple implementation, I'll:
1. For each (rotation, column) pair, check if the piece can be placed there
2. Score it
3. Pick the best
4. Execute: rotate to target rotation, then move to target column, then hard drop

The rotation sequence: from current rotation to target rotation, use the shortest path (CW or CCW).

Let me now write the full code. This is going to be quite long.

Let me also think about the lock delay system:
- When the piece can't move down, it "rests"
- It doesn't lock for 500ms
- Any successful move or rotation during that window restarts the 500ms
- At most 15 restarts
- After that, the piece locks

I'll track:
- `isResting`: whether the piece is currently resting
- `lockTimer`: ms since the piece started resting
- `lockResets`: number of times the lock delay has been reset

When the piece can't move down:
- If not resting, start resting, set lockTimer = 0, lockResets = 0
- If resting and lockTimer >= 500 and lockResets >= 15, lock the piece
- If resting and lockTimer >= 500 and lockResets < 15, continue waiting (but actually, the spec says "at most 15 times" - I think this means after 15 resets, the next time it can't move down, it locks immediately)

Wait, re-reading: "it does not lock for 500 ms. Any successful move or rotation during that window restarts the 500 ms, at most 15 times. After that the piece locks."

So:
- Piece can't move down → starts 500ms timer
- If a move/rotation succeeds within 500ms → reset timer to 0, increment lockResets
- If lockResets reaches 15 → next time piece can't move down, lock immediately
- If 500ms elapses without a successful move/rotation → lock

Actually, I think the interpretation is:
- The 500ms timer starts when the piece first can't move down
- Each successful move/rotation resets the timer to 0
- You can reset at most 15 times
- After 15 resets, the piece locks immediately (no more delay)

So the logic is:
- When piece can't move down:
  - If lockResets >= 15: lock immediately
  - Else: start/reset 500ms timer
- When a move/rotation succeeds:
  - If piece was resting (can't move down before the move):
    - If lockResets < 15: reset timer, increment lockResets
    - Else: do nothing (piece will lock next time it can't move down)
- When 500ms elapses: lock

Actually, I think the standard interpretation is:
- The piece is "on the ground" when it can't move down
- When it's on the ground, a 500ms timer starts
- If a move/rotation succeeds while on the ground, the timer resets
- This can happen at most 15 times total
- After 15 resets, the piece locks immediately when it's on the ground

Let me implement it as:
- `grounded`: boolean, true when piece can't move down
- `lockTimer`: ms elapsed since last reset
- `lockResets`: count of resets

Each frame:
- If piece can move down: grounded = false, lockTimer = 0
- If piece can't move down:
  - If !grounded: grounded = true, lockTimer = 0
  - lockTimer += deltaTime
  - If lockTimer >= 500: lock the piece

On successful move/rotation:
- If grounded and lockResets < 15: lockTimer = 0, lockResets++
- (If lockResets >= 15, the piece will lock on the next frame when it can't move down)

Wait, but if lockResets >= 15, the piece should lock immediately when it can't move down. So:
- If piece can't move down and lockResets >= 15: lock immediately

Let me refine:
- Each frame:
  - Try to move down
  - If can move down: grounded = false
  - If can't move down:
    - If lockResets >= 15: lock
    - Else:
      - If !grounded: grounded = true, lockTimer = 0
      - lockTimer += dt
      - If lockTimer >= 500: lock

- On successful move/rotation (while grounded):
  - If lockResets < 15: lockTimer = 0, lockResets++

This seems right.

Now for the gravity system:
- Fall interval: `max(50, round(1000 × 0.8^(level − 1)))` ms
- Fixed timestep loop independent of display refresh

I'll use a fixed timestep of, say, 16.67ms (60fps) for the game loop, and accumulate time for gravity.

Actually, for the fixed timestep, I'll use a small step (like 1ms or 16ms) and accumulate. Let me use requestAnimationFrame for the display and a fixed internal timestep for logic.

Let me use a 16ms fixed timestep for logic, and requestAnimationFrame for rendering.

Actually, for simplicity and to avoid complexity, I'll use requestAnimationFrame and track delta time, with a maximum delta to prevent time jumps (for tab blur). I'll cap delta at 100ms.

For the fixed timestep requirement, I'll accumulate time and step in fixed increments:

```javascript
let lastTime = 0;
let accumulator = 0;
const FIXED_DT = 16; // ms

function gameLoop(timestamp) {
  let dt = timestamp - lastTime;
  lastTime = timestamp;
  if (dt > 100) dt = 100; // cap for tab blur
  
  accumulator += dt;
  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
  }
  
  render();
  requestAnimationFrame(gameLoop);
}
```

In `update(dt)`:
- If phase is "playing" and not paused:
  - gravityAccumulator += dt
  - while gravityAccumulator >= gravityMs:
    - try to move piece down
    - if can't move down: handle lock delay
    - gravityAccumulator -= gravityMs
  - update lock delay timer

Now let me think about the replay encoding. I'll encode it as a string of actions separated by delimiters, with gravity tick counts.

Format: `gN:action,gN:action,...` where gN is the number of gravity ticks since the previous action.

Actually, let me simplify. I'll just record the actions in order, and the number of gravity ticks between them. The format will be:
`action1:ticks1,action2:ticks2,...`

Where ticksN is the number of gravity ticks that occurred between action N-1 and action N.

When replaying:
1. Reset with same seed
2. For each entry:
   a. Advance gravity by ticksN ticks
   b. Apply action N
3. Done

But wait, this doesn't account for the lock delay. If a piece is resting and I advance gravity, the lock delay timer also advances. So I need to simulate the full game state, including the lock delay.

I think the cleanest approach is:
- Record each action with the total number of gravity ticks that have elapsed since game start
- When replaying, advance tick by tick, applying actions at the right tick

Format: `tick:action,tick:action,...`

When replaying:
1. Reset with same seed
2. currentTick = 0
3. For each entry (in order):
   a. While currentTick < entry.tick: advance one tick (gravity, lock delay, etc.)
   b. Apply entry.action
   c. currentTick = entry.tick
4. Continue advancing until game over

This is the most robust approach. Let me go with this.

Actually, for the replay to work correctly, I need to make sure that the "advance one tick" operation is deterministic. Since I'm using a fixed timestep, this should be fine.

Let me define a "tick" as one fixed timestep (16ms). Each tick:
- Advance gravity accumulator by 16ms
- Process gravity (move piece down if accumulator >= gravityMs)
- Update lock delay timer

This way, the replay is fully deterministic.

Let me now write the complete code. I'll structure it as:

1. HTML structure
2. CSS styling
3. JavaScript:
   a. Constants and piece definitions
   b. RNG
   c. Game state
   d. Core game logic (move, rotate, drop, lock, clear)
   e. T-spin detection
   f. Scoring
   g. Input handling
   h. Autoplay AI
   i. Audio
   j. Rendering
   k. Replay
   l. Grader contract
   m. Main loop

Let me start coding:

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Tessera</title>
<style>
/* CSS here */
</style>
</head>
<body>
<!-- HTML structure -->
<script>
// JavaScript here
</script>
</body>
</html>
```

Let me write this out fully now. This will be a very long file.

For the audio, I'll create simple synthesized sounds:
- Move: short blip
- Rotate: slightly different blip
- Lock: thud
- Line clear: ascending arpeggio
- Tetris: fanfare
- Level up: rising tone
- Game over: descending tone

For the autoplay AI, I'll use a simple heuristic:
- For each possible (rotation, column) combination:
  - Check if the piece can be placed there (after rotating and moving)
  - Simulate the hard drop
  - Score the resulting board
- Pick the best score
- Execute the moves

The scoring function:
- +1000 × lines cleared (with the actual scoring formula)
- -0.5 × total height
- -0.3 × number of holes
- -0.5 × bumpiness

For executing the moves, I'll:
1. Determine the target rotation
2. Rotate to it (using shortest path)
3. Move to target column
4. Hard drop

But I need to be careful: the piece might not be able to reach the target position with simple left/right moves. For a basic AI, I'll just try and if it fails, skip that option.

Actually, for the AI to work properly, I should:
1. For each (targetRotation, targetColumn):
   a. Check if the piece in targetRotation at targetColumn is valid (all cells in bounds and not overlapping)
   b. If valid, score it
2. Pick the best
3. Execute: rotate to targetRotation, then move left/right to targetColumn, then hard drop

For step 3, I'll just try the moves and if any fail, the AI will try the next best option.

Actually, for simplicity, I'll just:
1. Find the best (rotation, column)
2. Rotate to that rotation (try CW or CCW)
3. Move to that column (try left or right)
4. Hard drop

If any step fails, just hard drop from the current position.

Let me now write the complete implementation. I'll be very careful about the details.

One important detail: the `setBoard(cells)` method. It says "moves the active piece back to its spawn position in spawn orientation (same type; nothing is drawn from the bag, so the piece sequence is unchanged)". So after setting the board, the active piece is reset to its spawn position with the same type.

Another detail: `spawn(type, x?, y?)`. If x/y are given, the piece's spawn-orientation bounding box top-left is at (x, y). If any cell would be outside the well, the call is ignored and returns false.

Let me also think about the `piece()` return value: `{ type, rot, cells }` where cells is an array of [col, row] pairs in well coordinates.

And `ghostY()`: the row of the topmost cell of the ghost. So if the piece's bounding box top-left is at (x, y) and the piece falls to (x, y+drop), the ghost's topmost cell row is y+drop+minRowOffset where minRowOffset is the minimum row offset of the piece's cells.

Wait, actually the ghost position is where the piece would land. The topmost cell of the ghost is the minimum row among all the ghost cells.

Let me code this up now. I'll write the complete file.

One more thing about the replay: I need to make sure that the replay encoding captures enough information. Since the game is deterministic given the seed and the sequence of actions (with timing), I'll encode:
- For each action: the total number of ticks since game start when the action was applied

Format: `tick:action|tick:action|...`

When importing:
1. Reset with the same seed (the seed is stored in the replay or I use the current seed)

Wait, the spec says "restarts the current game and replays that input string". So it uses the current seed. I'll store the seed in the replay string as well, or just use the current seed.

Actually, re-reading: "restarts the current game" - I think this means it calls reset() with the current seed, then replays the actions. So the seed is implicit (it's the current seed).

Let me finalize my approach:
- Replay string format: `seed|tick:action|tick:action|...`
- Actually, the spec says "restarts the current game" so I'll just use the current seed.
- Format: `tick:action|tick:action|...`

When importing:
1. Call reset() (with current seed)
2. Parse the replay string
3. For each entry, advance to the specified tick, then apply the action
4. Continue advancing until game over (or until all entries are processed)

Actually, I realize there's a subtlety: after the last recorded action, the game might still be ongoing (the last piece might still be falling). The spec says "when it returns, the board, score and lines are already final". So I need to continue the simulation until the game is over (or until no more actions are pending and the game has settled).

Hmm, but "final" might just mean "the state after all recorded actions have been applied". Let me re-read: "replays that input string synchronously, reproducing the same result: when it returns, the board, score and lines are already final"

I think "final" means the state after all actions in the replay have been processed. If the game is still ongoing (e.g., a piece is still falling), the state is whatever it is at that point. But if the game is over, it's the final game-over state.

Actually, I think the simplest interpretation is: after replaying all the recorded actions, the game state is exactly what it would be after those actions. If the game is still in progress, it's in progress. If it's over, it's over.

Let me go with: after processing all recorded actions, the state is the current state. I won't advance further.

But wait, what if the last action was a hard drop that locked a piece and cleared lines? The state after that action is the final state (next piece spawned, etc.). So I just need to process all actions in order and the state is final.

OK, I think my approach is correct. Let me code it up.

One more consideration: the `input(action)` method returns `true` when the action changed the game. So:
- `left`/`right`: true if the piece moved
- `cw`/`ccw`: true if the rotation succeeded
- `soft`: true if the piece moved down
- `hard`: true (always, since it always drops and locks)
- `hold`: true if the hold succeeded

Let me now write the full code. I'll aim for a clean, well-organized implementation.

Actually, I realize I need to be more careful about the lock delay in the context of the replay. When I advance "one tick", I need to:
1. Add FIXED_DT to the gravity accumulator
2. If gravity accumulator >= gravityMs, try to move the piece down
3. Update the lock delay timer
4. If the lock delay expires, lock the piece

This needs to be done in the correct order. Let me define the tick update:

```javascript
function tick(dt) {
  if (phase !== 'playing') return;
  
  // Gravity
  gravityAcc += dt;
  while (gravityAcc >= gravityMs) {
    gravityAcc -= gravityMs;
    if (!tryMove(0, 1)) {
      // Piece is on the ground
      handleGrounded();
    }
  }
  
  // Lock delay
  if (grounded) {
    lockTimer += dt;
    if (lockTimer >= 500 && lockResets < 15) {
      lockPiece();
    } else if (lockResets >= 15) {
      lockPiece();
    }
  }
}
```

Wait, I need to be more careful. The lock delay should only advance when the piece is grounded. And the gravity should only try to move the piece down if it's not already grounded (or rather, it tries, and if it fails, the piece is grounded).

Let me restructure:

```javascript
function tick(dt) {
  if (phase !== 'playing' || !activePiece) return;
  
  // Try gravity
  gravityAcc += dt;
  while (gravityAcc >= gravityMs) {
    gravityAcc -= gravityMs;
    if (tryMove(0, 1)) {
      // Successfully moved down, not grounded
      grounded = false;
    } else {
      // Can't move down, piece is grounded
      if (!grounded) {
        grounded = true;
        lockTimer = 0;
      }
    }
  }
  
  // Lock delay
  if (grounded) {
    lockTimer += dt;
    if (lockResets >= 15 || lockTimer >= 500) {
      lockPiece();
    }
  }
}
```

Hmm, but there's a subtlety: if the piece moves down (isn't grounded), the lock delay should reset. And if the piece is grounded and a move/rotation succeeds, the lock delay resets.

Let me restructure:

```javascript
function tick(dt) {
  if (phase !== 'playing' || !activePiece) return;
  
  // Try gravity
  gravityAcc += dt;
  while (gravityAcc >= gravityMs) {
    gravityAcc -= gravityMs;
    if (tryMove(0, 1)) {
      grounded = false;
      lockTimer = 0;
    }
  }
  
  // Check if piece is grounded (can't move down)
  if (!grounded && !canMove(0, 1)) {
    grounded = true;
    lockTimer = 0;
  }
  
  // Lock delay
  if (grounded) {
    lockTimer += dt;
    if (lockResets >= 15 || lockTimer >= 500) {
      lockPiece();
    }
  }
}
```

And in the move/rotation handlers:
```javascript
function onSuccessfulMoveOrRotation() {
  if (grounded && lockResets < 15) {
    lockTimer = 0;
    lockResets++;
  }
}
```

This seems cleaner. Let me go with this.

Now, one issue: in the `while (gravityAcc >= gravityMs)` loop, if the piece can't move down, I should break out of the loop (or just not move it). Actually, if the piece can't move down, `tryMove(0, 1)` returns false, and I just continue the loop (the gravity accumulator keeps decreasing but the piece doesn't move). This is fine - the piece stays in place and the lock delay handles the rest.

Wait, but if I keep the while loop going, the gravity accumulator will keep decreasing even though the piece isn't moving. That's actually correct - the gravity is "wasted" while the piece is grounded. The piece will lock via the lock delay, not via gravity.

OK, I think my logic is correct. Let me now write the full implementation.

Let me also think about the "at most 15 times" for lock resets. The spec says "Any successful move or rotation during that window restarts the 500 ms, at most 15 times. After that the piece locks."

I interpret this as: the piece can be "saved" from locking at most 15 times by a successful move/rotation. After the 15th save, the next time the piece is grounded, it locks immediately.

So:
- `lockResets` starts at 0
- Each time a move/rotation succeeds while grounded: if `lockResets < 15`, reset timer and increment `lockResets`
- When grounded and `lockResets >= 15`: lock immediately

This is what I have above. Good.

Now let me think about one more edge case: what if the piece is grounded, a move succeeds (resetting the timer), and then the piece can move down again? In that case, `grounded` becomes false and the lock delay is irrelevant. The next time the piece is grounded, the timer starts fresh (but `lockResets` is still incremented from before).

Wait, should `lockResets` reset when the piece leaves the ground? I don't think so - the spec says "at most 15 times" for the entire life of the piece. So `lockResets` accumulates across the entire piece's life.

OK, I think my implementation is correct. Let me now write the full code.

For the canvas rendering, I'll:
- Draw the well background
- Draw the locked blocks
- Draw the ghost piece (outline)
- Draw the active piece
- Add some glow effects

For the color scheme, I'll use a dark theme with vibrant piece colors:
- I: cyan
- J: blue
- L: orange
- O: yellow
- S: green
- T: purple
- Z: red

Let me now write everything out. This is going to be a very long file, but I'll make it as clean and complete as possible.

Let me also handle the "deterministic replay" requirement carefully. The key is that the game must be fully deterministic given:
1. The seed
2. The sequence of actions and their timing

Since I'm using a fixed timestep and a seeded RNG, this should be guaranteed.

One potential issue: the autoplay AI. If the grader enables autoplay, the AI's decisions must be deterministic. Since the AI is based on the game state (which is deterministic), the AI's decisions will be deterministic. Good.

Let me now write the complete file. I'll organize the JavaScript into sections with comments.

Actually, let me reconsider the replay format. The spec says "a string encoding every gameplay input since the game started". This suggests it's just the sequence of inputs, not including timing. But for the replay to reproduce the same result, timing must be encoded.

I'll use the format: `tick:action|tick:action|...` where tick is the number of fixed-timestep ticks since game start.

For `importReplay(str)`:
1. Reset the game (with current seed)
2. Parse the replay string
3. Sort entries by tick (they should already be in order)
4. Advance the game tick by tick, applying actions at the right tick
5. After all actions are applied, the state is final

Wait, but "restarts the current game" - does this mean it uses the same seed? I'll assume yes.

Let me also consider: what if the replay includes actions that would be invalid in the replayed game (e.g., trying to move left when already at the left wall)? In that case, the action is simply ignored (returns false), just like in normal play.

OK, I think I have a solid plan. Let me write the code now.

One more thing: the `exportReplay()` method should return the replay string. I'll maintain a `replayLog` array that records each action with its tick number.

For the tick counter, I'll maintain a `tickCount` that increments every fixed timestep.

Let me now write the complete implementation:

```javascript
// === CONSTANTS ===
const COLS = 10, ROWS = 20;
const PIECE_IDS = { I: 1, J: 2, L: 3, O: 4, S: 5, T: 6, Z: 7 };
const PIECE_NAMES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

// Piece shapes: array of 4 rotations, each rotation is array of [x, y] in the bounding box
const SHAPES = {
  I: [
    [[0,1],[1,1],[2,1],[3,1]],
    [[2,0],[2,1],[2,2],[2,3]],
    [[0,2],[1,2],[2,2],[3,2]],
    [[1,0],[1,1],[1,2],[1,3]]
  ],
  J: [
    [[0,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[2,1],[1,2]],
    [[1,1],[2,1],[2,2],[0,2]],
    [[0,0],[0,1],[0,2],[1,0]]
  ],
  L: [
    [[2,0],[0,1],[1,1],[2,1]],
    [[2,0],[2,1],[1,1],[2,2]],
    [[0,1],[1,1],[2,1],[2,0]],
    [[0,0],[1,0],[0,1],[0,2]]
  ],
  O: [
    [[0,0],[1,0],[0,1],[1,1]],
    [[0,0],[1,0],[0,1],[1,1]],
    [[0,0],[1,0],[0,1],[1,1]],
    [[0,0],[1,0],[0,1],[1,1]]
  ],
  S: [
    [[1,0],[2,0],[0,1],[1,1]],
    [[1,0],[1,1],[2,1],[2,2]],
    [[1,1],[2,1],[1,2],[2,2]],  // Wait, this doesn't look right
    [[0,0],[0,1],[1,1],[1,2]]
  ],
  T: [
    [[1,0],[0,1],[1,1],[2,1]],
    [[1,0],[2,1],[1,1],[1,2]],
    [[2,1],[1,2],[1,1],[0,1]],  // Wait
    [[0,1],[1,1],[1,2],[1,0]]  // Wait
  ],
  Z: [
    [[0,0],[1,0],[1,1],[2,1]],
    [[2,0],[1,1],[2,1],[1,2]],
    [[1,1],[2,1],[0,2],[1,2]],  // Wait
    [[0,0],[0,1],[1,1],[1,2]]  // Wait
  ]
};
```

Hmm, I'm getting confused with the S, T, Z rotations. Let me redo them carefully using the rotation formula.

For 3×3 box, CW rotation: (x, y) → (2-y, x)

**S piece:**
- 0: (1,0), (2,0), (0,1), (1,1)
  ```
  .SS
  SS.
  ...
  ```
- R: (1,0)→(2,1), (2,0)→(2,2), (0,1)→(1,0), (1,1)→(1,1)
  R: (2,1), (2,2), (1,0), (1,1)
  ```
  .S.
  .SS
  ..S
  ```
- 2: (2,1)→(1,2), (2,2)→(0,2), (1,0)→(2,1), (1,1)→(1,1)
  2: (1,2), (0,2), (2,1), (1,1)
  ```
  ...
  .SS
  SS.
  ```
- L: (1,2)→(0,1), (0,2)→(0,0), (2,1)→(1,2), (1,1)→(1,1)
  L: (0,1), (0,0), (1,2), (1,1)
  ```
  S..
  SS.
  .S.
  ```

**T piece:**
- 0: (1,0), (0,1), (1,1), (2,1)
  ```
  .T.
  TTT
  ...
  ```
- R: (1,0)→(2,1), (0,1)→(1,0), (1,1)→(1,1), (2,1)→(1,2)
  R: (2,1), (1,0), (1,1), (1,2)
  ```
  .T.
  .TT
  .T.
  ```
- 2: (2,1)→(1,2), (1,0)→(2,1), (1,1)→(1,1), (1,2)→(0,1)
  2: (1,2), (2,1), (1,1), (0,1)
  ```
  ...
  TTT
  .T.
  ```
- L: (1,2)→(0,1), (2,1)→(1,2), (1,1)→(1,1), (0,1)→(1,0)
  L: (0,1), (1,2), (1,1), (1,0)
  ```
  .T.
  TT.
  .T.
  ```

**Z piece:**
- 0: (0,0), (1,0), (1,1), (2,1)
  ```
  ZZ.
  .ZZ
  ...
  ```
- R: (0,0)→(2,0), (1,0)→(2,1), (1,1)→(1,1), (2,1)→(1,2)
  R: (2,0), (2,1), (1,1), (1,2)
  ```
  ..Z
  .ZZ
  .Z.
  ```
- 2: (2,0)→(2,2), (2,1)→(1,2), (1,1)→(1,1), (1,2)→(0,1)
  2: (2,2), (1,2), (1,1), (0,1)
  ```
  ...
  .ZZ
  ZZ.
  ```
- L: (2,2)→(0,2), (1,2)→(0,1), (1,1)→(1,1), (0,1)→(1,0)
  L: (0,2), (0,1), (1,1), (1,0)
  ```
  .Z.
  ZZ.
  Z..
  ```

**L piece:**
- 0: (2,0), (0,1), (1,1), (2,1)
  ```
  ..L
  LLL
  ...
  ```
- R: (2,0)→(2,2), (0,1)→(1,0), (1,1)→(1,1), (2,1)→(1,2)
  R: (2,2), (1,0), (1,1), (1,2)
  ```
  .L.
  .L.
  ..L
  ```
  Wait, that should be:
  ```
  .L.
  .L.
  .LL
  ```
  Let me recheck: cells are (2,2), (1,0), (1,1), (1,2)
  Row 0: col 1 → .L.
  Row 1: col 1 → .L.
  Row 2: col 1, col 2 → .LL
  Yes! ✓

- 2: (2,2)→(0,2), (1,0)→(2,1), (1,1)→(1,1), (1,2)→(0,1)
  2: (0,2), (2,1), (1,1), (0,1)
  Row 1: col 0, col 1, col 2 → LLL
  Row 2: col 0 → L..
  ```
  ...
  LLL
  L..
  ```
  ✓

- L: (0,2)→(0,0), (2,1)→(1,2), (1,1)→(1,1), (0,1)→(1,0)
  L: (0,0), (1,2), (1,1), (1,0)
  Row 0: col 0 → L..
  Row 1: col 1 → .L.
  Row 2: col 1 → .L.
  Wait, that gives:
  ```
  L..
  .L.
  .L.
  ```
  But the standard L piece L state should be:
  ```
  L..
  L..
  LL.
  ```
  
  Hmm, let me recheck. L piece L state from the standard:
  ```
  L..
  L..
  LL.
  ```
  Cells: (0,0), (0,1), (0,2), (1,2)
  
  But my calculation gives: (0,0), (1,2), (1,1), (1,0)
  Which is:
  Row 0: col 0, col 1 → LL.
  Row 1: col 1 → .L.
  Row 2: col 1 → .L.
  
  That doesn't match. Let me recheck my rotation.

  Starting from 2: (0,2), (2,1), (1,1), (0,1)
  
  CW rotation: (x,y) → (2-y, x)
  - (0,2) → (2-2, 0) = (0, 0)
  - (2,1) → (2-1, 2) = (1, 2)
  - (1,1) → (2-1, 1) = (1, 1)
  - (0,1) → (2-1, 0) = (1, 0)
  
  So L: (0,0), (1,2), (1,1), (1,0)
  
  Visual:
  Row 0: col 0 → L..
  Row 1: col 1 → .L.
  Row 2: col 1 → .L.
  
  But the standard SRS L piece in state L should be:
  ```
  L..
  L..
  LL.
  ```
  
  Hmm, that's (0,0), (0,1), (0,2), (1,2). Let me recheck.

  Actually wait, I think I made an error in the 2 state. Let me redo from the beginning.

  L piece spawn (0): The visual is:
  ```
  ..L
  LLL
  ```
  In the 3×3 box (top two rows), the cells are:
  - Row 0: col 2 → (2, 0)
  - Row 1: col 0, 1, 2 → (0, 1), (1, 1), (2, 1)
  
  So 0: (2,0), (0,1), (1,1), (2,1) ✓

  CW to R:
  - (2,0) → (2-0, 2) = (2, 2)
  - (0,1) → (2-1, 0) = (1, 0)
  - (1,1) → (2-1, 1) = (1, 1)
  - (2,1) → (2-1, 2) = (1, 2)
  
  R: (2,2), (1,0), (1,1), (1,2)
  
  Visual:
  Row 0: col 1 → .L.
  Row 1: col 1 → .L.
  Row 2: col 1, col 2 → .LL
  
  Standard L R state:
  ```
  .L.
  .L.
  .LL
  ```
  ✓

  CW to 2:
  - (2,2) → (2-2, 2) = (0, 2)
  - (1,0) → (2-0, 1) = (2, 1)
  - (1,1) → (2-1, 1) = (1, 1)
  - (1,2) → (2-2, 1) = (0, 1)
  
  2: (0,2), (2,1), (1,1), (0,1)
  
  Visual:
  Row 1: col 0, 1, 2 → LLL
  Row 2: col 0 → L..
  
  Standard L 2 state:
  ```
  ...
  LLL
  L..
  ```
  ✓

  CW to L:
  - (0,2) → (2-2, 0) = (0, 0)
  - (2,1) → (2-1, 2) = (1, 2)
  - (1,1) → (2-1, 1) = (1, 1)
  - (0,1) → (2-1, 0) = (1, 0)
  
  L: (0,0), (1,2), (1,1), (1,0)
  
  Visual:
  Row 0: col 0, col 1 → LL.
  Row 1: col 1 → .L.
  Row 2: col 1 → .L.
  
  But the standard L L state is:
  ```
  L..
  L..
  LL.
  ```
  Which is (0,0), (0,1), (0,2), (1,2).
  
  My result is (0,0), (1,0), (1,1), (1,2), which is:
  ```
  LL.
  .L.
  .L.
  ```
  
  These don't match! Let me figure out what's going wrong.

  Oh wait, I think I'm confusing myself. Let me look at the standard SRS L piece more carefully.

  Standard SRS L piece:
  - 0:
  ```
  ..L
  LLL
  ```
  - R:
  ```
  .L.
  .LL
  .L.
  ```
  Wait no, that's not right either. Let me look this up properly.

  Actually, the standard SRS L piece:
  - 0:
  ```
  ..L
  LLL
  ...
  ```
  - R:
  ```
  .L.
  .LL
  .L.
  ```
  No wait, that's 5 cells. The L piece has 4 cells.

  Let me be very careful. The L piece is:
  ```
  ..L
  LLL
  ```
  That's 4 cells: (2,0), (0,1), (1,1), (2,1). ✓

  Rotating CW around center of 3×3:
  (x,y) → (2-y, x)
  
  (2,0) → (2, 2)
  (0,1) → (1, 0)
  (1,1) → (1, 1)
  (2,1) → (1, 2)
  
  R state cells: (2,2), (1,0), (1,1), (1,2)
  
  Visual:
  ```
  .L.
  .L.
  .LL
  ```
  
  Hmm, but the standard SRS L piece in R state is:
  ```
  .L.
  .LL
  .L.
  ```
  
  Wait, that's 4 cells: (1,0), (1,1), (2,1), (1,2). Let me check if that matches my calculation.
  
  My calculation: (2,2), (1,0), (1,1), (1,2)
  Standard: (1,0), (1,1), (2,1), (1,2)
  
  These are different! (2,2) vs (2,1).
  
  Let me re-examine. I think the issue is that I might have the wrong spawn orientation.

  Looking at the spec again:
  ```
  L (3×2)
  ..L
  LLL
  ```
  
  So the L piece spawn is:
  Row 0: col 2 (the single L on the right)
  Row 1: col 0, 1, 2 (the three L's)
  
  In the 3×3 box:
  - (2, 0)
  - (0, 1)
  - (1, 1)
  - (2, 1)
  
  This is what I had. Let me re-verify the rotation.
  
  CW rotation in 3×3: the formula is (x, y) → (2-y, x).
  
  Let me verify with a known example. If I have a cell at (0, 0) (top-left), after CW rotation it should be at (2, 0) (top-right). Formula: (2-0, 0) = (2, 0). ✓
  
  If I have a cell at (2, 0) (top-right), after CW rotation it should be at (2, 2) (bottom-right). Formula: (2-0, 2) = (2, 2). ✓
  
  If I have a cell at (2, 2) (bottom-right), after CW rotation it should be at (0, 2) (bottom-left). Formula: (2-2, 2) = (0, 2). ✓
  
  If I have a cell at (0, 2) (bottom-left), after CW rotation it should be at (0, 0) (top-left). Formula: (2-2, 0) = (0, 0). ✓
  
  OK so the formula is correct. Let me re-examine the L piece R state.
  
  L spawn: (2,0), (0,1), (1,1), (2,1)
  
  After CW:
  (2,0) → (2, 2)
  (0,1) → (1, 0)
  (1,1) → (1, 1)
  (2,1) → (1, 2)
  
  R: (2,2), (1,0), (1,1), (1,2)
  
  Visual:
  Row 0: col 1 → .L.
  Row 1: col 1 → .L.
  Row 2: col 1, col 2 → .LL
  
  So the R state is:
  ```
  .L.
  .L.
  .LL
  ```
  
  Let me check against the actual SRS definition. Looking at the Tetris wiki:
  
  L piece:
  - 0: (1,0), (0,1), (1,1), (2,1) -- Wait, that's different from what the spec says!
  
  Hmm, actually I think there might be a discrepancy. Let me look at the spec's visual again:
  ```
  L (3×2)
  ..L
  LLL
  ```
  
  This clearly shows the single L in the top-right and the three L's in the bottom row. So the cells are (2,0), (0,1), (1,1), (2,1).
  
  But the standard SRS L piece spawn is:
  ```
  L..
  LLL
  ```
  Wait no, that's the J piece!
  
  Let me re-read the spec:
  ```
  I (4×1)   J (3×2)   L (3×2)   O (2×2)   S (3×2)   T (3×2)   Z (3×2)
  IIII      J..       ..L       OO        .SS       .T.       ZZ.
            JJJ       LLL       OO        SS.       TTT       .ZZ
  ```
  
  So:
  - J: J.. / JJJ → (0,0), (0,1), (1,1), (2,1)
  - L: ..L / LLL → (2,0), (0,1), (1,1), (2,1)
  
  Yes, the spec has J on the left and L on the right. This is the standard SRS layout.
  
  So my calculation is correct. The L piece R state is:
  ```
  .L.
  .L.
  .LL
  ```
  
  Let me verify against the Tetris wiki. Actually, I recall that the standard SRS L piece R state IS:
  ```
  .L.
  .LL
  .L.
  ```
  
  Wait, that's 4 cells: (1,0), (1,1), (2,1), (1,2). But my calculation gives (1,0), (1,1), (1,2), (2,2).
  
  Hmm, let me look at this more carefully. I think the issue might be that I'm confusing the L and J pieces, or there's a different convention.
  
  Actually, let me just trust my math. The rotation formula (x,y) → (2-y, x) is correct for CW rotation in a 3×3 box. The spawn cells are as given by the spec. So the result is what it is.
  
  Let me double-check by doing a full cycle:
  
  0: (2,0), (0,1), (1,1), (2,1)
  R: (2,2), (1,0), (1,1), (1,2)
  2: (0,2), (2,1), (1,1), (0,1)
  L: (0,0), (1,2), (1,1), (1,0)
  
  Back to 0 (CW from L):
  (0,0) → (2,0)
  (1,2) → (0,1)
  (1,1) → (1,1)
  (1,0) → (2,1)
  
  Result: (2,0), (0,1), (1,1), (2,1) ✓ (same as spawn)
  
  Great, the full cycle works. So my piece definitions are correct.
  
  Now let me also verify the J piece:
  
  J spawn: (0,0), (0,1), (1,1), (2,1)
  R: (2,0), (1,0), (1,1), (1,2)
  2: (2,2), (2,1), (1,1), (0,1)
  L: (0,2), (1,2), (1,1), (1,0)
  
  Back to 0:
  (0,2) → (0,0)
  (1,2) → (0,1)
  (1,1) → (1,1)
  (1,0) → (2,1)
  
  Result: (0,0), (0,1), (1,1), (2,1) ✓
  
  And the I piece:
  0: (0,1), (1,1), (2,1), (3,1)
  R: (2,0), (2,1), (2,2), (2,3)
  2: (3,2), (2,2), (1,2), (0,2)
  L: (1,3), (1,2), (1,1), (1,0)
  
  Back to 0:
  (1,3) → (0,1)
  (1,2) → (1,1)
  (1,1) → (2,1)
  (1,0) → (3,1)
  
  Result: (0,1), (1,1), (2,1), (3,1) ✓
  
  All good. Now let me write the complete code.

Let me also think about the "box size" for each piece:
- I: 4×4
- J, L, S, T, Z: 3×3
- O: 2×2 (but I'll treat it as 2×2 for simplicity)

The spawn position is the top-left of the bounding box:
- I: (3, 0) → cells at (3,1), (4,1), (5,1), (6,1)
- J, L, S, T, Z: (3, 0) → cells at (3+dx, 0+dy) for each (dx,dy) in the shape
- O: (4, 0) → cells at (4,0), (5,0), (4,1), (5,1)

Now for the `piece()` return value, `cells` should be the actual well coordinates of the piece's cells.

For the ghost, I need to find where the piece would land. I'll drop the piece as far as it can go and find the minimum row of the resulting cells.

Let me now write the complete code. I'll be thorough and handle all edge cases.

For the autoplay AI, I'll implement a simple but effective heuristic:

```javascript
function aiDecision() {
  const piece = activePiece;
  let bestScore = -Infinity;
  let bestAction = null;
  
  for (let rot = 0; rot < 4; rot++) {
    for (let x = 0; x <= COLS - boxWidth; x++) {
      // Check if piece can be placed at (x, y) with this rotation
      // Find the lowest valid y
      let y = findDropY(piece.type, rot, x);
      if (y < 0) continue; // Can't place here
      
      // Simulate the board after placing the piece
      let simBoard = simulateDrop(piece.type, rot, x, y);
      
      // Score the board
      let score = scoreBoard(simBoard);
      
      if (score > bestScore) {
        bestScore = score;
        bestAction = { rot, x };
      }
    }
  }
  
  // Execute bestAction
  executeAIAction(bestAction);
}
```

For `scoreBoard`:
```javascript
function scoreBoard(board) {
  let height = 0;
  let holes = 0;
  let bumpiness = 0;
  
  // Calculate column heights
  let heights = [];
  for (let col = 0; col < COLS; col++) {
    let h = 0;
    for (let row = 0; row < ROWS; row++) {
      if (board[row][col] !== 0) {
        h = ROWS - row;
        break;
      }
    }
    heights.push(h);
  }
  
  height = sum(heights);
  
  // Count holes
  for (let col = 0; col < COLS; col++) {
    let foundBlock = false;
    for (let row = 0; row < ROWS; row++) {
      if (board[row][col] !== 0) foundBlock = true;
      else if (foundBlock) holes++;
    }
  }
  
  // Bumpiness
  for (let col = 0; col < COLS - 1; col++) {
    bumpiness += Math.abs(heights[col] - heights[col+1]);
  }
  
  return -0.5 * height - 0.3 * holes - 0.5 * bumpiness + 1000 * linesCleared;
}
```

For the AI to actually clear lines, I need to make sure the scoring heavily rewards line clears. With the weights above, a single line clear (1000 points) should outweigh the height/holes penalty.

Actually, let me also add a bonus for flat surfaces (reward for creating flat tops) and a penalty for leaving gaps.

Let me refine the scoring:
- +1000 × lines cleared (using the actual scoring formula with level)
- -0.5 × aggregate height
- -0.3 × number of holes
- -0.5 × bumpiness
- +1.0 × flat bonus (for each pair of adjacent columns with the same height)

This should give the AI enough incentive to clear lines.

Now, for executing the AI's action, I need to:
1. Rotate to the target rotation
2. Move to the target column
3. Hard drop

For step 1, I'll calculate the shortest rotation path:
- Current rotation: curRot
- Target rotation: targetRot
- CW steps: (targetRot - curRot + 4) % 4
- CCW steps: (curRot - targetRot + 4) % 4
- Use the shorter path

For step 2, I'll move left or right to the target column.

But I need to be careful: the moves might fail (e.g., the piece can't reach the target position). In that case, I'll just hard drop from the current position.

Let me also add a small delay between AI actions to make the game more watchable (e.g., 200ms between actions).

Actually, for the AI, I'll just call the same input functions that the player uses. This way, the replay system works the same way for AI and human play.

Let me now write the complete code. I'll aim for a clean, well-organized implementation that handles all the requirements.

Here's my plan for the HTML structure:

```html
<div id="game-container">
  <div id="left-panel">
    <div id="hold-label">HOLD</div>
    <canvas id="hold"></canvas>
    <div id="score-label">SCORE</div>
    <div id="score">0</div>
    <div id="lines-label">LINES</div>
    <div id="lines">0</div>
    <div id="level-label">LEVEL</div>
    <div id="level">1</div>
  </div>
  <canvas id="board"></canvas>
  <div id="right-panel">
    <div id="next-label">NEXT</div>
    <div id="next">
      <canvas data-preview="0"></canvas>
      <canvas data-preview="1"></canvas>
      <canvas data-preview="2"></canvas>
      <canvas data-preview="3"></canvas>
      <canvas data-preview="4"></canvas>
    </div>
  </div>
</div>
<div id="controls">
  <button data-action="left">←</button>
  <button data-action="right">→</button>
  <button data-action="cw">↻</button>
  <button data-action="ccw">↺</button>
  <button data-action="soft">↓</button>
  <button data-action="hard">⤓</button>
  <button data-action="hold">⇡</button>
</div>
<div id="buttons">
  <button id="pause">Pause</button>
  <button id="restart">Restart</button>
  <button id="autoplay" aria-pressed="false">Autoplay</button>
  <button id="mute" aria-pressed="false">Mute</button>
</div>
<div id="overlay" data-state="playing"></div>
<div id="fps">60</div>
```

OK let me just write the whole thing now. I'll be comprehensive.

Let me think about one more thing: the `setBoard(cells)` method. It says it "replaces the whole field with the given 200 numbers and moves the active piece back to its spawn position in spawn orientation (same type; nothing is drawn from the bag, so the piece sequence is unchanged)".

So after calling `setBoard`:
1. The board is replaced with the given cells
2. The active piece is reset to its spawn position (same type as before)
3. The bag is not modified (no new piece is drawn)
4. Score, lines, level, combo, B2B are unchanged

This is useful for the grader to set up specific board states for testing.

Similarly, `spawn(type, x?, y?)`:
- Replaces the active piece with the given type
- If x/y are given, the piece's bounding box top-left is at (x, y)
- If any cell would be outside the well, the call is ignored and returns false
- Otherwise returns true

This is also for testing.

And `setLines(n)`:
- Sets the lines counter
- This changes the level (level = floor(lines/10) + 1)
- Does not change the score

OK, I think I have everything planned. Let me write the code now.

One last thing: the "deterministic replay" requirement. I need to make sure that:
1. The RNG is seeded and deterministic
2. The game logic is deterministic (no floating-point issues, no timing-dependent behavior)
3. The replay records enough information to reproduce the game

For the RNG, I'll use a simple seeded PRNG (mulberry32 or similar).

For the game logic, I'll use integer arithmetic where possible. The gravity and lock delay use milliseconds, which are integers.

For the replay, I'll record each action with its tick number. The tick number is the total number of fixed-timestep ticks since game start.

I think I'm ready to write the code. Let me do it now.

Actually, one more consideration: the spec says "Gravity runs on a fixed-timestep loop, independent of the display refresh rate." This means I need to decouple the game logic from the rendering. I'll use:
- `requestAnimationFrame` for rendering
- A fixed timestep (e.g., 16.67ms) for game logic
- An accumulator to handle variable frame times

The fixed timestep should be small enough to handle the lock delay (500ms) accurately. 16.67ms (60fps) should be fine.

Let me use 16ms as the fixed timestep (close to 60fps).

OK, now I'm really writing the code. Let me structure it carefully.

Wait, I also need to handle the "held direction key auto-repeats: first repeat after ~150 ms, then every ~35 ms." This is for left/right keys. I'll implement this with a key repeat system:
- When a direction key is first pressed, apply the action immediately
- After 150ms of holding, start repeating every 35ms
- When the key is released, stop repeating

I'll use `keydown` and `keyup` events, and a timer for the repeat.

For the on-screen buttons, "press-and-hold works" means that holding a button should also auto-repeat. I'll use `mousedown`/`touchstart` to start the action and repeat, and `mouseup`/`touchend` to stop.

OK, let me write the code now. For real this time.

Let me also think about the audio synthesis. I'll create a simple audio system:

```javascript
let audioCtx = null;
let muted = false;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type) {
  if (muted || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  switch(type) {
    case 'move':
      osc.frequency.value = 200;
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
      break;
    case 'rotate':
      osc.frequency.value = 300;
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
      break;
    case 'lock':
      osc.frequency.value = 150;
      gain.gain.value = 0.2;
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
      break;
    // ... etc
  }
}
```

For more complex sounds (like line clear, tetris), I'll use multiple oscillators or frequency sweeps.

OK, I'm going to write the full code now. Let me be very careful and thorough.

Let me also think about the rendering. The canvas should show:
- The well (10×20 grid)
- Locked blocks (colored)
- The active piece (colored, maybe slightly brighter)
- The ghost piece (outline only)
- Grid lines (subtle)

I'll use a cell size that fits the canvas. For a 10×20 well, I'll use a cell size of about 30px, giving a canvas of 300×600.

For the preview canvases (hold and next), I'll use smaller canvases (about 100×100 for hold, 80×80 for each next piece).

Let me now write the complete code. I'll aim for about 1500-2000 lines of well-organized code.

Here's my final plan for the code structure:

1. HTML: Game layout with all required elements
2. CSS: Dark theme, modern styling, responsive
3. JavaScript:
   a. Constants (piece shapes, kick tables, colors)
   b. Seeded RNG
   c. Game state object
   d. Core functions (reset, spawn, move, rotate, drop, lock, clear)
   e. T-spin detection
   f. Scoring
   g. Gravity and lock delay (fixed timestep)
   h. Input handling (keyboard, buttons, auto-repeat)
   i. Autoplay AI
   j. Audio synthesis
   k. Canvas rendering
   l. Replay system
   m. Grader contract (window.__arena)
   n. Main loop
   o. Initialization

Let me write it all out now.
