# Task: Octet — a tiny virtual game console (CHIP-8) with a bit-exact core

Build a complete virtual game console around a fully specified 8-bit interpreter: a CRT-style
screen, a clickable hex keypad, beeper sound, built-in games — and an emulator core exact
enough to pass a bit-level conformance suite.

## Ground rules

- Deliver **one file: `index.html`** with all HTML, CSS and JavaScript inline.
- **No external resources of any kind**: no CDNs, libraries, frameworks, web fonts, remote
  images or ROM downloads. Everything must be written by you or generated in code. Network
  access is blocked during grading.
- Target: latest desktop Google Chrome at a 1280×800 viewport; adapt to window resizing.
- No errors in the console. Never use `alert`, `confirm` or `prompt`.
- The page starts with an empty `localStorage` (fresh browser profile).
- You are scored two ways:
  1. **Automated grader**: a headless browser drives your page through the *Grader contract*
     below, injecting its own test programs through your API and checking machine state bit
     for bit. Follow the contract exactly (ids, names and casing are case-sensitive).
  2. **Blind human judging**: your page is shown side by side with other submissions; people
     play both and pick the better one on look, feel, sound and overall polish.

## Requirements

### The machine (hard spec — the grader checks it bit for bit)

- **Memory**: 4096 bytes (`0x000`–`0xFFF`), zeroed on reset/load, except the font. Programs
  load at `0x200`. The font below is stored at `0x050`–`0x09F`.
- **Registers**: `V0`–`VF` (8-bit; all register arithmetic is mod 256), 16-bit `I`, `PC`,
  and a return stack 16 levels deep with `SP` = number of pushed entries.
- **Timers**: `delay` and `sound` tick down toward 0 at exactly **60 Hz while running**
  (never below 0, never while paused, and **never inside `step()`**). While `sound` > 0 the
  console beeps (Web Audio square wave, ~440 Hz, no clicks). Create/resume the single
  `AudioContext` on the first user gesture; before that, stay silent without throwing.
- **Display**: 64×32, 1 bit per pixel, row-major index $y \times 64 + x$.
- **Keypad**: 16 keys `0`–`F`.

### Font (store exactly these 80 bytes at `0x050`)

```
0: F0 90 90 90 F0    8: F0 90 F0 90 F0
1: 20 60 20 20 70    9: F0 90 F0 10 F0
2: F0 10 F0 80 F0    A: F0 90 F0 90 90
3: F0 10 F0 10 F0    B: E0 90 E0 90 E0
4: 90 90 F0 10 10    C: F0 80 80 80 F0
5: F0 80 F0 10 F0    D: E0 90 90 90 E0
6: F0 80 F0 90 F0    E: F0 80 F0 80 F0
7: F0 10 20 40 40    F: F0 80 F0 80 80
```

### Instruction set

`PC` starts at `0x200`. Instructions are 2 bytes, big-endian. Normal advance is `PC += 2`;
a "skip" is `PC += 4` instead. Everything is deterministic except `CXNN`.

| Opcode | Exact semantics |
|---|---|
| `00E0` | Clear the display |
| `00EE` | `SP -= 1; PC = stack[SP]` |
| `0NNN` | NOP |
| `1NNN` | `PC = NNN` |
| `2NNN` | `stack[SP] = PC + 2; SP += 1; PC = NNN` |
| `3XNN` | Skip if `VX == NN` |
| `4XNN` | Skip if `VX != NN` |
| `5XY0` | Skip if `VX == VY` |
| `6XNN` | `VX = NN` |
| `7XNN` | `VX = (VX + NN) & 255`; VF unchanged |
| `8XY0` | `VX = VY`; VF unchanged |
| `8XY1` | `VX \|= VY`; **VF = 0** |
| `8XY2` | `VX &= VY`; **VF = 0** |
| `8XY3` | `VX ^= VY`; **VF = 0** |
| `8XY4` | `t = VX + VY; VX = t & 255; VF = (t > 255)` |
| `8XY5` | `VF = (VX >= VY)` (before); `VX = (VX - VY) & 255` |
| `8XY6` | `VF = VY & 1`; `VX = VY >> 1`; **VY unchanged** |
| `8XY7` | `VF = (VY >= VX)` (before); `VX = (VY - VX) & 255` |
| `8XYE` | `VF = VY >> 7`; `VX = (VY << 1) & 255`; **VY unchanged** |
| `9XY0` | Skip if `VX != VY` |
| `ANNN` | `I = NNN` |
| `BNNN` | `PC = NNN + V0` |
| `CXNN` | `VX = (uniform random byte) & NN` |
| `DXYN` | Draw `n` rows (`n = 0` → 16) from `I`, at `x = VX mod 64`, `y = VY mod 32`. XOR onto the display; **clip** at edges, never wrap. VF is always written: 1 if any lit pixel was erased by this draw, else 0 |
| `EX9E` | Skip if key `VX` is currently down |
| `EXA1` | Skip if key `VX` is currently up |
| `FX07` | `VX = delay` |
| `FX0A` | Wait for key (see rule 6 below) |
| `FX15` | `delay = VX` |
| `FX18` | `sound = VX` |
| `FX1E` | `I = (I + VX) & 0xFFF`; VF unchanged |
| `FX29` | `I = 0x50 + 5 × (VX mod 16)` |
| `FX33` | BCD: memory `I, I+1, I+2` = hundreds, tens, ones of `VX` |
| `FX55` | Store `V0..VX` at `I..I+X`; **then `I += X + 1`** |
| `FX65` | Load `V0..VX` from `I..I+X`; **then `I += X + 1`** |

### Edge-case rules (the famous quirks — we specify, you follow)

1. Shifts use **VY as the source** and leave VY unchanged (see table).
2. Logic ops (`8XY1/2/3`) reset `VF` to 0. `7XNN`, `8XY0` and `FX1E` never touch VF.
3. `FX55`/`FX65` increment `I` by `X + 1` afterwards (COSMAC VIP behavior).
4. `DXYN` clips, takes coordinates mod screen size, always writes VF, and only pixels
   actually drawn (not clipped away) count for collision.
5. `BNNN` uses `V0` (classic behavior).
6. `FX0A`: if any key is currently down, `VX` := the lowest such key and execution
   continues immediately. Otherwise the machine **blocks**: PC stays on the `FX0A`
   instruction, `waitingKey` is true, `step()` executes nothing, and the next key press
   completes the instruction (`VX` := that key, PC advances). While blocked in run mode,
   timers keep ticking.
7. `0NNN` is a NOP. Any other undefined opcode (e.g. `F0FF`) **halts** the machine:
   `halted` = true, PC stays on the bad instruction, further `step()`/run does nothing,
   and **no exception is thrown**.
8. A call when `SP` is already 16 halts the machine the same way.
9. `load()` and `reset()` clear registers, I, SP, stack, timers, display, `halted` and
   `waitingKey`, and all RAM except font + program; PC = `0x200`; the machine is left
   **paused**. Currently-held keys are *not* released.

### Deterministic control API — `window.__arena`

Ready by the `window.load` event, with exactly these members:

- `load(bytes: number[] | Uint8Array)`: reset + write bytes at `0x200` (the new current ROM).
- `reset()`: reset with the current ROM.
- `step(n = 1)`: synchronously execute up to `n` instructions (fewer if halted/blocked).
  **Timers never tick inside `step()`** and it must not touch the canvas per instruction —
  render at most once after the batch. It should run 2,000,000 simple instructions in well
  under a second on a modern laptop.
- `play()` / `pause()` / `running(): boolean`: real-time mode at the `#speed` rate
  (default 600 instructions/second); timers tick at 60 Hz only here.
- `state()` → `{ v: number[16], i, pc, sp, stack: number[16], delay, sound, halted, waitingKey }`
  — plain integers/booleans; `stack` entries at index ≥ `sp` are don't-care.
- `memory()` → a snapshot `Uint8Array(4096)`.
- `display()` → a snapshot of 2048 numbers (0 or 1), row-major — the *logical* framebuffer,
  independent of any CRT/glow effects you render.
- `press(k)` / `release(k)` (`k` = 0..15): simulate a physical key.
- `keysDown()` → currently held keys, sorted ascending.

**Determinism**: the same bytes plus the same sequence of `step()`/`press()`/`release()`
calls must produce bit-identical `state()`/`display()`, across resets and across page
reloads. `CXNN` is the only allowed source of nondeterminism.

### Console UI

- `canvas#display`: the 64×32 screen, scaled up. Art direction is yours.
- Hex keypad: `button` elements with `data-key="0".."9"` and `"A".."F"` (uppercase), and
  `aria-pressed="true"` while held. Buttons behave like real keys: press-and-hold keeps the
  key down (mouse and touch). Physical keyboard mapping (case-insensitive):

  ```
  1 2 3 4  →  1 2 3 C
  Q W E R  →  4 5 6 D
  A S D F  →  7 8 9 E
  Z X C V  →  A 0 B F
  ```

  On-screen buttons also light up for physical key presses.
- Transport: `#play` toggles run/pause (**Space** toggles too, unless focus is in a text
  input), `#step` executes one instruction while paused, `#reset` resets.
- `#speed`: `<input type="range" min="60" max="3600">`, default 600 (instructions/second),
  applies live.
- `#rom`: a `<select>` with **at least two built-in ROMs** embedded as byte arrays in your
  code (write or port small games: Pong-like, Breakout-like, maze, demos…). Changing it
  loads that ROM (paused).
- `#mute`: a toggle for the beeper with `aria-pressed`.
- ROM selection, speed and mute persist in `localStorage` and restore on reload.
- Debugger (humans will look): live V registers, I, PC, SP, timers and a disassembly of the
  upcoming instruction(s) while paused.

### Polish (judged by humans)

- Make it feel like a gorgeous little device: bezel, glowing phosphor pixels, scanlines,
  subtle screen curvature, tactile chunky keys, a power LED, a satisfying beeper.
- The built-in games should actually be playable and fun at the default speed.

## Grader contract

1. `canvas#display`; 16 `button[data-key]` (uppercase hex); `#play`, `#step`, `#reset`,
   `input#speed`, `select#rom` (≥2 options), `#mute` all present.
2. `window.__arena` with the exact API and state shapes above.
3. The instruction table and the 9 edge-case rules are graded bit-exactly via injected test
   programs (load → step → inspect `state()`/`memory()`/`display()`).
4. `step()` never ticks timers; `play()` ticks them at 60 Hz; `pause()` freezes them.
5. Determinism: identical inputs → identical state, across reset and reload.
6. Only one AudioContext, created/resumed on first user gesture; no console errors ever.
