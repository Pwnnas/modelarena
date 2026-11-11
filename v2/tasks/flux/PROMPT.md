# Task: Flux — a four-state digital logic laboratory

Build a polished, interactive digital logic workbench: construct circuits, connect wires,
simulate logic and memory, inspect signals, and generate truth tables.

This is an engineering instrument, not a static diagram. The visible circuit, simulation,
inspector, history, persistence, and exported document must all describe the same state.

## Ground rules

- Deliver one file: `index.html`, containing all HTML, CSS and JavaScript inline.
- No external resources: no libraries, frameworks, fonts, images, network requests, or CDNs.
- Target latest desktop Chrome at 1280×800. Handle resizing and devicePixelRatio.
- No console errors. Never use alert, confirm, or prompt.
- Initially localStorage is empty.
- Automated grading uses real mouse and keyboard input.
- Blind human judging also evaluates visual design, interaction quality, clarity, and polish.
- Implement the exact grader contract below. Names and attributes are case-sensitive.
- Partial credit is awarded independently. Prioritize a working editor and basic simulation
  before advanced memory and truth-table features.

## 1. Workbench

Provide:

- A component palette.
- An SVG circuit workspace with draggable components and visible, connected wires.
- A selected-component inspector.
- Simulation controls: Step, Run/Pause, Reset State.
- Undo, Redo, New Circuit.
- Import/export through an on-page JSON textarea.
- A truth-table panel.
- A clear tick counter and readable live values.

The initial circuit is empty. A separate optional Demo button is welcome.

Components should look like a coherent professional tool: legible labels, clear ports,
distinct signal colors, attractive wiring, selection states, and a useful inspector.

Nodes and wires must remain aligned during dragging, panning, zooming, and resizing.
Use routed SVG paths or polylines; do not merely list connections as text.

## 2. Circuit document

The import/export format is:

{
  "version": 1,
  "nodes": [
    {
      "id": "a",
      "type": "INPUT",
      "x": 100,
      "y": 100,
      "width": 4,
      "value": "0011"
    },
    {
      "id": "p",
      "type": "PROBE",
      "x": 400,
      "y": 100,
      "width": 4
    }
  ],
  "wires": [
    {
      "id": "w1",
      "from": { "node": "a", "port": "out" },
      "to": { "node": "p", "port": "in" }
    }
  ]
}

Rules:

- Node and wire IDs are nonempty strings matching [A-Za-z0-9_-]+.
- Node IDs are unique among nodes. Wire IDs are unique among wires.
- x and y are finite world coordinates and identify the node's upper-left corner.
- width is an integer from 1 through 8.
- INPUT requires value: exactly width characters from 0, 1, X, Z.
- CLOCK requires width 1 and integer period from 1 through 32.
- Other node types do not require value or period.
- Every node except PROBE has one output port named out.
- Connections must reference existing nodes and ports.
- Source and destination port widths must match.
- Multiple drivers on an input are allowed.
- Duplicate connections with identical source and destination endpoints are invalid.
- Fan-out, feedback, and disconnected ports are allowed.
- Support at least 1,024 nodes and 4,096 wires.
- Export only the document, not simulation state, selection, or viewport state.
- Ordering of nodes and wires in exported JSON is not significant.

Reject an invalid document atomically: show a useful error, but leave the current document,
simulation, selection, viewport, and undo history unchanged. Never partially import it.

## 3. Components and ports

All ports have the node's width except ports explicitly marked as one or four bits.

| Type  | Input ports                         | Behavior |
|-------|-------------------------------------|----------|
| INPUT | none                                | User-controlled four-state word |
| CLOCK | none                                | Automatic one-bit clock |
| NOT   | in                                  | Bitwise NOT |
| AND   | a, b                                | Bitwise AND |
| OR    | a, b                                | Bitwise OR |
| XOR   | a, b                                | Bitwise XOR |
| MUX   | a, b, s:1                           | Select a when s=0, b when s=1 |
| TRI   | in, en:1                            | Tri-state driver |
| ADD   | a, b                                | Unsigned addition, discard overflow |
| DFF   | d, clk:1, rst:1                      | Rising-edge register |
| RAM   | addr:4, din, we:1, clk:1             | 16-word synchronous RAM |
| PROBE | in                                  | Display the resolved input |

Word strings are most-significant-bit first.

A newly added component has width 1. INPUT starts at "0"; CLOCK starts with period 2.
New IDs must not collide with any current node or wire ID.

The inspector must allow editing width and INPUT value or CLOCK period.

Changing width removes incident wires that have become width-incompatible.
When changing an INPUT's width, preserve its least-significant bits: truncate on the left
when shrinking, zero-pad on the left when growing.

## 4. Four-state logic

Every bit is 0, 1, X, or Z:

- X: unknown or conflicting.
- Z: high impedance / undriven.

Resolve each input bit from all connected output drivers:

- No drivers, or all drivers Z: Z.
- Ignore Z if other drivers exist.
- Any X among the remaining drivers: X.
- Both 0 and 1 among remaining drivers: X.
- Otherwise use the sole remaining binary value.

For NOT, AND, OR, XOR, and ADD, treat Z as X.

- NOT: invert 0/1; unknown remains X.
- AND: any 0 forces 0; otherwise both 1 produce 1; otherwise X.
- OR: any 1 forces 1; otherwise both 0 produce 0; otherwise X.
- XOR: binary inputs produce XOR; otherwise X.
- ADD: if either operand contains X or Z, the entire result is X. Otherwise add modulo
  the number of distinct values representable at the node's width.
- MUX: s=0 passes a unchanged; s=1 passes b unchanged. For s=X or Z, compare a and b
  bit-by-bit: equal characters pass unchanged, unequal characters produce X.
- TRI: en=0 outputs all Z; en=1 passes its input unchanged. For en=X or Z, an input bit
  that is Z remains Z; every other input bit becomes X.
- PROBE always shows its currently resolved input, without an extra tick of delay.

## 5. Exact simulation semantics

This is a deterministic discrete-tick simulator, NOT a combinational fixed-point solver.

### Reset state

After load, New, Reset State, or any successful document edit:

- Tick is 0 and playback is stopped.
- INPUT outputs equal their configured values.
- CLOCK outputs are 0.
- DFF outputs are all 0.
- RAM contains 16 all-zero words and outputs an all-zero word.
- DFF and RAM previous-clock values are 0.
- All other output-producing components output all X.
- PROBE values are resolved from those outputs.

### One tick

Use a snapshot of all outputs at the beginning of the tick.

1. Resolve every input from that snapshot.
2. Calculate every component's next output and internal state.
3. Commit all results simultaneously.
4. Increment the tick counter.
5. Resolve probes from the newly committed outputs.

Iteration order must not affect results. A chain of three NOT gates requires three ticks
for an INPUT change to propagate through all three gates.

INPUT retains its configured value.

For CLOCK, after committing tick number n, output is:
- 0 when floor(n / period) is even.
- 1 when floor(n / period) is odd.

A receiving register therefore sees a CLOCK transition on the following tick, because
all components sample the previous snapshot.

### Clock interpretation

For DFF and RAM clock inputs, normalize Z to X.

Let old be the stored previous-clock value and new be the currently resolved clock.

- Definite rising edge: old=0 and new=1.
- Possible but not definite rising edge: old is not 1 and new is not 0, excluding the
  definite case. This includes X→X.
- Otherwise there is no rising edge.

Always store new as the previous-clock value at the end of the tick.

### DFF

- rst=1: output all 0.
- rst=X or Z: output all X.
- rst=0:
  - Definite rising edge: capture d, converting any Z bits to X.
  - Possible but not definite rising edge: output all X.
  - Otherwise hold the previous output.

Reset takes priority over capture but does not prevent the previous-clock value updating.

### RAM

RAM has no reset port; Reset State clears it.

On a definite rising edge:

- Read-before-write: next output is the OLD memory word at addr.
- If addr contains X or Z, next output is all X.
- Then apply the write rules below.

On a possible but not definite rising edge:

- Next output is all X.
- Apply the conservative write rules below.

With no rising edge, hold output and memory.

For writes, normalize Z bits in din to X:

- we=0: no write.
- Definite edge, binary addr, we=1: replace that word with din.
- Otherwise, if an edge is possible and we is not 0:
  - Binary addr: merge din into that word.
  - Unknown addr: merge din into ALL 16 words.

Merging compares characters bit-by-bit: equal characters survive; unequal characters become X.

## 6. Editing and history

- Click a node body to select it.
- Drag its body to move it.
- Drag from an output port to an input port to create a wire.
- Reject incompatible widths without modifying the document or history.
- Dragging a duplicate connection is a no-op.
- Delete/Backspace removes the selected node and all incident wires, unless a text-editing
  control has focus.
- Escape clears selection.
- Undo/Redo support at least 50 document edits.
- One completed drag is ONE history entry, regardless of pointer-move count.
- Adding, deleting, wiring, inspector changes, New, and successful import are document edits.
- A document edit resets simulation as described above.
- Undo/Redo restore the document and reset simulation; restoring prior simulation state
  is not required.
- Selection may clear during Undo/Redo.
- Simulation ticks, Run/Pause, Reset State, selection, export, viewport movement, and
  truth-table generation do not create history entries.
- A new document edit after Undo discards the redo branch.
- Ctrl/Cmd+Z performs Undo; Ctrl/Cmd+Shift+Z performs Redo when not editing text.

## 7. Viewport and interaction

- Pan by Alt+left-drag on empty workspace.
- Zoom using the wheel, anchored at the cursor.
- Provide Zoom In, Zoom Out, and Fit buttons.
- Zoom In multiplies scale by 1.25; Zoom Out divides by 1.25.
- Clamp scale to 0.25 through 4.
- Button zoom is anchored at the workspace center.
- Fit keeps every node visible with a margin.
- World coordinates are independent of zoom.
- The scene transform maps world coordinates to workspace CSS pixels as:
  screenX = view.x + worldX * view.scale
  screenY = view.y + worldY * view.scale
- The workspace SVG's local coordinate system must use CSS pixels.
- Space toggles Run/Pause unless focus is in an input, textarea, select, or contenteditable.
- Run advances approximately 10 ticks per second, independent of display refresh rate.
- Pausing stops advancement. The rendered circuit and values remain unchanged while paused.

## 8. Truth tables

Generate a truth table for an acyclic circuit containing only INPUT, combinational
components, and PROBE.

Supported domain:

- At least one INPUT and one PROBE.
- At most 8 total INPUT bits and 16 probes.
- No CLOCK, DFF, RAM, or directed cycles.

Sort INPUT nodes and PROBE nodes by ID using ordinary ascending ASCII string order.

Enumerate every binary assignment in ascending order. The assignment is the concatenation
of INPUT words in that order, most-significant-bit first.

For each assignment:

1. Use a separate simulation state.
2. Substitute the INPUT values for that assignment.
3. Reset that separate state.
4. Execute exactly 64 ticks.
5. Record each probe's resolved word.

Support the full 256-row table. Do not modify the live document, simulation, selection,
viewport, playback state, or undo history.

For unsupported circuits, show a clear error and leave the live state unchanged.

The table may be generated asynchronously, but must finish within 5 seconds.

## 9. Persistence and robustness

Persist the document and viewport in localStorage within 500 ms of changes.

On reload:

- Restore the document and viewport.
- Reset simulation to tick 0.
- Start paused, with no selection and empty undo/redo history.

Malformed saved data must not crash the page; fall back to a usable empty circuit.

Large circuits should remain responsive. The grader exercises a 256-stage propagation
chain and large fan-out graphs. Aim to execute 256 ticks of the chain within 1 second.

## 10. Grader contract

### Required elements

- `#workspace`: the SVG workspace.
- `#scene`: the transformed SVG group containing nodes and wires.
- Palette buttons: `[data-add="INPUT"]`, `[data-add="CLOCK"]`, and equivalent buttons for
  NOT, AND, OR, XOR, MUX, TRI, ADD, DFF, RAM, PROBE.
- Each node: an SVG group `[data-node="ID"]`.
- Its clickable/draggable title/body target: a descendant `[data-title]`.
- A selected node has `aria-selected="true"`; all others have `"false"`.
- Each port: a visible SVG element inside its node with `[data-port="NAME"]`.
  The center of its bounding box is a valid drag endpoint.
- Each wire: an SVG path or polyline `[data-wire="ID"]` inside #scene.
- Every node has visible text `[data-value="ID"]`, showing exactly its current output
  word, or its resolved input for a PROBE.
- Inspector:
  - `#node-width`: number input.
  - `#node-value`: text input for INPUT.
  - `#node-period`: number input for CLOCK.
  - Changes commit on Enter or change; the same edit must not commit twice.
- Buttons: `#new`, `#undo`, `#redo`, `#step`, `#run`, `#reset-state`,
  `#zoom-in`, `#zoom-out`, `#fit`, `#import`, `#export`, `#truth`.
- `#step-count`: number input, default 1, range 1–4096.
  Clicking #step advances exactly this many ticks while paused.
- `#run`: `aria-pressed="true"` while running and `"false"` while paused.
- `#tick`: text containing only the current integer tick.
- `#json`: textarea used by both Import and Export.
- `#status`: visible status/error text.
  Its `data-error` is `"import"` after rejected import, `"truth-unsupported"` after
  rejected truth-table generation, and `""` after a successful corresponding operation.
- `#truth-table`: a table.
  Each data row has `data-assignment="BINARY_STRING"`.
  Each probe result cell has `data-probe="PROBE_ID"` and contains exactly that result.

All core controls must be reachable without browser zoom or a larger viewport.

### Read-only inspection API

Expose:

window.__arena.snapshot()

It returns a detached, JSON-serializable object:

{
  circuit: { version: 1, nodes: [...], wires: [...] },
  tick: 0,
  outputs: {
    nodeId: { out: "01XZ" }
  },
  probes: {
    probeId: "01XZ"
  },
  memory: {
    ramNodeId: ["0000", "... exactly 16 words ..."]
  },
  clocks: {
    dffOrRamNodeId: "0"
  },
  selection: null,
  view: { x: 0, y: 0, scale: 1 },
  running: false
}

- outputs includes every non-PROBE node.
- probes includes every PROBE.
- memory includes every RAM.
- clocks includes every DFF and RAM, containing their stored previous-clock values.
- selection is the selected node ID or null.
- view reflects the actual rendered transform.
- The returned object must not expose mutable application state.
- The API is inspection-only. Do not add special grading behavior.
- The grader imports fixtures through the visible textarea and Import button, edits using
  mouse and keyboard, and verifies both this API and visible values.

## Polish

Make Flux feel like a tool someone would enjoy using:

- Visually distinct 0, 1, X, and Z signals.
- Clear bus widths and signal direction.
- Wires that visibly follow components while dragging.
- A compact, readable inspector and useful feedback for rejected operations.
- Smooth pan/zoom and thoughtful keyboard behavior.
- Attractive truth tables and memory inspection.
- Optional live signal-history visualization and a built-in demo circuit.

Correctness matters, but the showcase should also be beautiful and understandable.
