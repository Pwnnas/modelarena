# Task: Latch — a synchronous digital logic workbench

Build an interactive digital logic bench: place gates, draw wires, toggle inputs, single-step or run, and watch signals propagate with a strict 1-tick gate delay, including edge-triggered flip-flops.

## Ground rules

- Deliver **one file: `index.html`** with all HTML, CSS and JavaScript inline.
- **No external resources of any kind**: no CDNs, libraries, frameworks, web fonts, remote images or audio. Everything must be written by you. Network access is blocked during grading.
- Target: latest desktop Google Chrome at a 1280×800 viewport; adapt to window resizing.
- No errors in the console. Never use `alert`, `confirm` or `prompt`. Do not call `console.error` or `console.warn`. API methods and event handlers must not throw.
- The page starts with an empty `localStorage` (fresh browser profile).
- You are scored two ways:
  1. **Automated grader**: a headless browser drives your page through the *Grader contract* below, using real mouse and keyboard input, and measures correctness, robustness and performance. Follow the contract exactly (ids, attributes and names are case-sensitive).
  2. **Blind human judging**: your page is shown side by side with other submissions; people use both and pick the better one on visual design, how physical and readable the schematic feels, and overall polish.

## Simulation model

This is a **synchronous unit-delay** simulator, not a zero-delay one and not an iterate-to-quiescence one.

- Time is an integer. `time()` starts at **0**.
- Signal values are the numbers **0** and **1** only (not booleans, not `"x"`).
- Every gate output and every flip-flop `Q` starts at **0**. Unconnected inputs read as **0**.
- Wires have no delay. A gate's delay is inside the gate.
- `tick(n)` performs **exactly n delay-steps** (default n = 1; ignore non-finite or negative; `Math.floor` positive values) and then returns. It must **not** loop until the circuit is stable. A ring oscillator and a 40-gate chain must both return from `tick(100)` promptly; `tick(200)` on a 40-gate chain should take well under 250 ms. Solving to steady state inside one `tick()` is wrong.
- Each delay-step, in this order:
  1. Let `k = time() + 1`.
  2. Update every `clk` output from the waveform at time `k` (clocks are stimuli, not delayed gates).
  3. **Sample every component's inputs** from the values visible before this step's commits (clock outputs already updated).
  4. Compute every next output from those samples.
  5. **Commit all outputs together.** Adding a source before a sink must not let the sink observe the source's new output in the same step.
  6. `time()` becomes `k`.
- `set()` on an input changes that input's `Y` **immediately**, with no tick and no gate update. Edges are detected only from clock samples taken inside `tick()`, never from the `set()` calls themselves. Toggling a clock input 0→1→0 between ticks, with no `tick()` while it is 1, is not an edge.

### Components

| type | inputs | primary output | next output |
| --- | --- | --- | --- |
| `in` | — | `Y` | holds the last `set()` value (default 0). `tick` does not change it. |
| `clk` | — | `Y` | waveform below. Default period **8**. |
| `out` | `A` | the value of `A` | a probe. `get(id)` reads `A`. |
| `not` | `A` | `Y` | `1` if sampled `A` is `0`, else `0` |
| `and` | `A`, `B` | `Y` | `1` iff both samples are `1` |
| `or` | `A`, `B` | `Y` | `1` iff either sample is `1` |
| `xor` | `A`, `B` | `Y` | `1` iff the samples differ |
| `nand` | `A`, `B` | `Y` | opposite of `and` |
| `nor` | `A`, `B` | `Y` | opposite of `or` |
| `dff` | `D`, `CLK`, `RST` | `Q` | see below |

Exactly two inputs on the boolean gates. Pin names are exactly `A`, `B`, `Y`, `D`, `CLK`, `RST`, `Q`.

**Clock waveform.** For a period `p` (even integer ≥ 2), at time `k` the output is `1` when `(k % p) >= p / 2`, else `0`. Time 0 is always low. Period 4:

```
time: 0 1 2 3 4 5 6 7 8
clk:  0 0 1 1 0 0 1 1 0
```

`setClock` stores the period and immediately refreshes `Y` for the current `time()` (still 0 at time 0). Odd periods or periods less than 2 are ignored. `tick(n)` must match calling `tick(1)` n times, including the clock.

**D flip-flop**, evaluated from the samples of this step and the previous step's `CLK` sample (initially 0):

- If sampled `RST` is `1`, next `Q` is `0` (level-sensitive, overrides the clock, same 1-step delay).
- Else if sampled `CLK` is `1` and the previous `CLK` sample was `0` (rising edge), next `Q` is `1` if sampled `D` is `1`, else `0`.
- Else next `Q` equals current `Q`.

So `Q` does not follow `D` while the clock is held high, and a falling edge captures nothing. `RST` unconnected is `0`.

**Shift-register rule** (this is the sample-then-commit rule, and it must not depend on `add` order): two DFFs, `Q` of the first wired to `D` of the second, same clock. `D` of the first is `1`, one rising edge → first `Q` becomes `1`, second `Q` stays `0`. Then `D` of the first is `0`, another rising edge → first `Q` becomes `0`, second `Q` becomes `1`.

**Oscillation.** A 2-NOT ring toggles every step and must not hang, throw, or freeze the UI. `stable()` is `true` iff the most recent delay-step changed no `clk` output, gate output, or `Q`. Before any `tick()` since `reset()` / undo re-init, `stable()` is `true`.

Worked NOT delay: input set to `1` before any tick → `Y` is still `0` until `tick(1)`, then `Y` is `0` (`NOT 1`). Input then set to `0` → `Y` stays `0` until the next `tick(1)`, then `Y` is `1`.

## Requirements

### Bench
- A schematic surface, not a bare truth-table form. Gates are real DOM elements (SVG is fine) drawn as recognizable schematic symbols, not a single undifferentiated canvas bitmap.
- 11 tools: Select, Input, Output, NOT, AND, OR, XOR, NAND, NOR, DFF, Clock.
- Select is the initial tool. With a placement tool armed, a click on empty board places that component at the cursor. A click on a gate must not also place. Escape or the Select tool disarms placement.
- Drag from an output pin to an input pin to wire them. Wires are visible, orthogonal, and colored by level (off vs on). Replacing a wire updates the drawing.
- Clicking an input gate, while Select is armed, toggles it. Clicking a gate selects it. Delete and Backspace remove the selected gate (document-level, unless focus is in a text field) and its wires.
- `#tick` advances one step. `#run` toggles free-run. **Space** toggles free-run the same way (document-level, unless focus is in a text field). Free-run starts paused, and advances by calling the same `tick(1)` about 10 times per second. `#reset` clears the circuit, pauses, and returns to time 0. `#undo` undoes.
- `#ticks` is a non-editable text element whose trimmed text is the current time, updated during free-run too.
- API-created components auto-layout into a visible non-overlapping grid (about 96 px apart, 16 px margin) so the first 10 sit inside a 1280×800 viewport without the user dragging them. Each gate element is at least 36×36 CSS pixels. Pin hit targets are at least 8×8. Nothing invisible may cover the board, the gates, or the toolbar (pointer events must hit the elements the grader clicks).
- No CSS transform on the board at rest that would make the click target disagree with the visible gate.

### Editing semantics
- Connecting to an already-driven input **replaces** the old driver.
- `remove` drops the component and every wire touching it. Downstream inputs read `0` immediately; downstream gate outputs change only on a later tick.
- `undo()` rewinds one edit (`add`, `connect`, `disconnect`, `remove`, `set`, `setClock`) and **re-inits the simulation**: time 0, gate/`Q` outputs 0, clocks at time 0, previous clock samples 0, paused. It does not replay ticks. Undo of an empty history is a no-op and does not throw. History holds at least 50 edits. `reset()` clears history.
- Invalid ids, duplicate ids, and unknown pins are no-ops and do not throw.

### Persistence
- Persist **synchronously** inside `add` / `connect` / `disconnect` / `remove` / `set` / `setClock` / `tick` / `undo` / `reset` (write `localStorage` before the call returns, not in a debounced timer). The grader reloads almost immediately.
- On load, if saved state exists, restore it instead of any demo: topology, wire endpoints, input values, clock periods, **time, every output, and each DFF's previous clock sample**. A reload must not invent a rising edge.
- A demo circuit on first visit is optional, but the page loads **paused at time 0** when there is no saved state, and `reset()` clears a demo completely.

### Polish (judged by humans)
- A dark, dense, instrument-like bench: crisp gate symbols, pin names, a selected-gate treatment, wires that glow when high, a playhead-like run state, satisfying toggles.
- Optional and welcome: a timing strip for the selected probe, a small on-canvas label per gate, snap-to-grid, wheel zoom / pan (must not break the initial click contract), a paused demo that looks alive once Run is pressed.
- Beauty matters, but a pretty bench with the wrong tick is still the wrong bench.

## Grader contract

1. Toolbar and transport buttons: `#tool-select`, `#tool-in`, `#tool-out`, `#tool-not`, `#tool-and`, `#tool-or`, `#tool-xor`, `#tool-nand`, `#tool-nor`, `#tool-dff`, `#tool-clk`, `#tick`, `#run`, `#reset`, `#undo`. All are `<button>`s. `#run` has `aria-pressed="true"` while running and `"false"` while paused. `#ticks` is not an input. `#board` is the schematic surface.
2. Each component is an element `[data-gate="id"][data-type="not"]` (type as given to `add` / the tool), visible, inside `#board`. Pins are descendants `[data-pin="Y"]` (and `A`, `B`, `D`, `CLK`, `RST`, `Q` as applicable). The selected gate has `aria-selected="true"`. Each wire element has `data-wire`. The DOM (`[data-gate]`, `[data-pin]`, `[data-wire]`) reflects each `add` / `connect` / `disconnect` / `remove` / `set` call before that call returns (the grader queries the DOM in the same script, without waiting for a frame).
3. `window.__arena` methods:
   - `reset()`: empty circuit, time 0, paused, outputs at initial values, undo history cleared.
   - `add(type, id) → id`: create a component with that string id.
   - `connect(srcId, srcPin, dstId, dstPin)` and `disconnect(dstId, dstPin)`.
   - `remove(id)`.
   - `set(id, 0|1)`: input switches only; other types ignored.
   - `get(id)` → primary output number; `get(id, pin)` → that pin's current number (`0` if an input is undriven).
   - `setClock(id, period)`.
   - `tick(n?)`, `time() → number`, `run(on?: boolean)` (`true` start, `false` stop, omitted toggles), `stable() → boolean`, `undo()`, `list() → { id: string, type: string }[]` in insertion order.
4. Keyboard: Space toggles run; Delete and Backspace remove the selected gate; Escape returns to the select tool. All are document-level and ignored while a text field is focused.
5. Placement, selection, toggling, and deletion work with real clicks on the elements above, without calling the API.
