This is a massive task - building a complete digital logic laboratory in a single HTML file. Let me break down what I need to build:

1. **Workbench UI**: Component palette, SVG workspace, inspector, simulation controls, undo/redo, import/export, truth table panel, tick counter
2. **Circuit document**: JSON format with validation
3. **Components**: INPUT, CLOCK, NOT, AND, OR, XOR, MUX, TRI, ADD, DFF, RAM, PROBE
4. **Four-state logic**: 0, 1, X, Z with specific resolution rules
5. **Simulation semantics**: Discrete-tick, not fixed-point
6. **Editing and history**: Drag, wire creation, undo/redo (50+ entries)
7. **Viewport**: Pan, zoom, fit
8. **Truth tables**: Generate for acyclic circuits
9. **Persistence**: localStorage
10. **Grader contract**: Specific element IDs, attributes, API

Let me plan the architecture:

- State management: document (nodes, wires), simulation state (outputs, memory, clocks), viewport, selection, history
- SVG rendering: scene group with transform, nodes as groups, wires as paths
- Simulation engine: tick-based, snapshot-based
- UI: palette, inspector, controls, truth table, JSON textarea

Let me start building this systematically.

Key design decisions:
- Use a single SVG with a scene group for the transform
- Nodes are rendered as SVG groups with rect backgrounds, text labels, port indicators
- Wires are SVG paths with bezier or orthogonal routing
- Simulation state is separate from document state
- History stores document snapshots

Let me think about the simulation carefully:

**Reset state:**
- Tick = 0, paused
- INPUT outputs = configured values
- CLOCK outputs = 0
- DFF outputs = all 0
- RAM = 16 zero words, output = all-zero word
- DFF/RAM prev clock = 0
- Other components output all X
- PROBE values resolved from outputs

**One tick:**
1. Snapshot all outputs
2. Resolve every input from snapshot
3. Calculate next output and internal state
4. Commit all simultaneously
5. Increment tick
6. Resolve probes from new outputs

**CLOCK after committing tick n:**
- 0 when floor(n / period) is even
- 1 when floor(n / period) is odd

So at tick 0: output = 0 (floor(0/period) = 0, even)
After tick 1: floor(1/period) depends on period. If period=2: floor(1/2)=0, even, so 0.
After tick 2: floor(2/2)=1, odd, so 1.
After tick 3: floor(3/2)=1, odd, so 1.
After tick 4: floor(4/2)=2, even, so 0.

Wait, let me re-read: "after committing tick number n, output is: 0 when floor(n / period) is even, 1 when floor(n / period) is odd"

So the output AFTER committing tick n is based on n. At reset (tick 0), the output is 0. After the first tick (tick becomes 1), the clock output is floor(1/period). If period=2, floor(1/2)=0, even, so 0. After tick 2, floor(2/2)=1, odd, so 1.

Actually wait - "A receiving register therefore sees a CLOCK transition on the following tick, because all components sample the previous snapshot."

So the clock output at any point is determined by the current tick number. Let me think about this more carefully.

At reset: tick=0, clock output=0 (floor(0/period)=0, even)
After tick 1: tick=1, clock output = floor(1/period). For period=2: floor(1/2)=0, even → 0
After tick 2: tick=2, clock output = floor(2/2)=1, odd → 1
After tick 3: tick=3, clock output = floor(3/2)=1, odd → 1
After tick 4: tick=4, clock output = floor(4/2)=2, even → 0

So the clock toggles every `period` ticks. That makes sense.

**DFF clock edge detection:**
- old = stored previous-clock value
- new = currently resolved clock (from the snapshot)
- Definite rising: old=0, new=1
- Possible but not definite: old≠1 AND new≠0, excluding definite case. So old∈{0,X} and new∈{1,X} but not (old=0,new=1). So (old=X,new=1) or (old=0,new=X) or (old=X,new=X).

Wait, let me re-read: "old is not 1 and new is not 0, excluding the definite case"
- old ≠ 1 means old ∈ {0, X}
- new ≠ 0 means new ∈ {1, X}
- Excluding definite (old=0, new=1)
- So: (old=0, new=X), (old=X, new=1), (old=X, new=X)

And Z is normalized to X for clock inputs.

**DFF behavior:**
- rst=1: output all 0
- rst=X or Z: output all X
- rst=0:
  - Definite rising edge: capture d, Z→X
  - Possible edge: output all X
  - Otherwise: hold previous output

**RAM behavior:**
On definite rising edge:
- Read-before-write: output = OLD memory word at addr
- If addr has X or Z: output = all X
- Then apply write

On possible edge:
- Output = all X
- Apply conservative write

No edge: hold output and memory

Writes (Z in din → X):
- we=0: no write
- Definite edge, binary addr, we=1: replace word
- Otherwise if edge possible and we≠0:
  - Binary addr: merge din into that word
  - Unknown addr: merge din into ALL 16 words

Merge: bit-by-bit, equal chars survive, unequal → X

Now let me think about the UI layout:

```
+----------------------------------------------------------+
| Toolbar: New | Undo | Redo | Step | Run | Reset | Zoom  |
+----------------------------------------------------------+
| Palette |  SVG Workspace                    | Inspector  |
| INPUT   |                                  | Node: ...  |
| CLOCK   |                                  | Width: [ ] |
| NOT     |                                  | Value: [ ] |
| AND     |                                  | Period: [ ]|
| ...     |                                  |            |
|         |                                  |            |
+----------------------------------------------------------+
| Step Count: [1] | Tick: 0 | Import/Export | Truth Table|
+----------------------------------------------------------+
```

Actually, let me think about a more practical layout for 1280x800:

Top bar: controls
Left: palette
Center: workspace
Right: inspector
Bottom: status, JSON, truth table

Let me code this up now. This is going to be a very long file.

I'll structure the JavaScript as:
1. State management (document, simulation, viewport, history)
2. Validation
3. Simulation engine
4. Rendering (SVG)
5. Interaction (drag, wire creation, pan, zoom)
6. UI controls
7. Truth table generation
8. Persistence
9. API

Let me be very careful about the simulation semantics.

For the four-state logic resolution:
- No drivers or all Z → Z
- Ignore Z if other drivers exist
- Any X among remaining → X
- Both 0 and 1 among remaining → X
- Otherwise sole binary value

For gates (treating Z as X):
- NOT: invert 0/1, unknown → X
- AND: any 0 → 0; both 1 → 1; else X
- OR: any 1 → 1; both 0 → 0; else X
- XOR: binary inputs → XOR; else X
- ADD: if either has X or Z → all X; else add mod 2^width

MUX:
- s=0: pass a
- s=1: pass b
- s=X or Z: compare a and b bit-by-bit: equal chars pass, unequal → X

TRI:
- en=0: all Z
- en=1: pass input
- en=X or Z: input Z stays Z, other input bits → X

Let me think about the node rendering. Each node needs:
- A rect body
- A label (type name)
- Port indicators (circles or squares at specific positions)
- Value text
- Selection highlight

Port positions:
- Input ports on the left side
- Output port on the right side

For a node at (x, y) with width w:
- The node body is a rect
- Input ports are on the left edge
- Output port is on the right edge

Let me define port positions:
- For a node with n input ports, they're stacked vertically on the left
- The output port is on the right, vertically centered

Node dimensions: Let's say the body is 120px wide and 40px tall (in world units). Ports are small circles.

Actually, for bus widths, I should make the port indicators wider for wider buses. Let me think...

The port width in the visual should reflect the bus width. A 1-bit port is a small circle, a 4-bit port is a wider rectangle, etc.

Let me define:
- Node body: 120 wide, height depends on number of ports
- Port indicators: circles for 1-bit, wider rects for multi-bit
- Port spacing: 20px vertical

Actually, let me keep it simpler:
- Node body: 120 × 60 (or adjust based on ports)
- Ports: small circles/rects at specific positions
- The "width" of a port in the visual is proportional to the bus width

Let me define port positions more carefully:

For a node at (x, y):
- Body rect: (x, y) to (x+120, y+60)
- Input ports: left side, at x, y + 20 + i*20 for port i
- Output port: right side, at x+120, y+30

For multi-bit ports, I'll make them wider (the visual width represents the bus width).

Actually, for the grader contract: "The center of its bounding box is a valid drag endpoint." So I need to make sure the port elements have proper bounding boxes.

Let me use small rects for ports:
- 1-bit: 8×8 rect
- n-bit: n*8 × 8 rect? Or maybe just 8×8 for all, with the width shown in the label.

Actually, let me make ports as circles with radius 5, and for multi-bit, make them wider rects. The key is that the center of the bounding box is the drag endpoint.

Let me think about wire routing. I'll use cubic bezier curves:
- From source port center to destination port center
- Control points offset horizontally

For the wire path:
```
M sx sy C sx+dx sy, tx-dx ty, tx ty
```

Where dx is some offset based on the distance.

Now let me think about the history system:
- Stack of document snapshots
- Current index
- Max 50+ entries
- Undo: go back one
- Redo: go forward one
- New edit: truncate redo branch

For the document, I'll store it as a plain object:
```
{
  nodes: [{id, type, x, y, width, value?, period?}],
  wires: [{id, from: {node, port}, to: {node, port}}]
}
```

Let me now write the code. This is going to be very long but I'll be thorough.

Actually, let me think about the rendering performance. For 1024 nodes and 4096 wires, I need to be efficient. SVG can handle this if I'm careful. I'll use a single SVG with a scene group, and update only what changes.

For the simulation, I need to be careful about the tick semantics:

```
function tick() {
  // 1. Snapshot all outputs
  const snapshot = {};
  for (const node of doc.nodes) {
    if (node.type !== 'PROBE') {
      snapshot[node.id] = sim.outputs[node.id];
    }
  }
  
  // 2. Resolve every input from snapshot
  const resolved = {};
  for (const node of doc.nodes) {
    for (const port of getInputPorts(node.type)) {
      resolved[node.id + '.' + port] = resolveInput(node.id, port, snapshot, doc.wires);
    }
  }
  
  // 3. Calculate next output and internal state
  const newOutputs = {};
  const newMemory = {};
  const newClocks = {};
  
  for (const node of doc.nodes) {
    // Calculate based on type
  }
  
  // 4. Commit all simultaneously
  sim.outputs = newOutputs;
  sim.memory = newMemory;
  sim.clocks = newClocks;
  
  // 5. Increment tick
  sim.tick++;
  
  // 6. Resolve probes
  sim.probes = {};
  for (const node of doc.nodes.filter(n => n.type === 'PROBE')) {
    sim.probes[node.id] = resolveInput(node.id, 'in', newOutputs, doc.wires);
  }
}
```

Wait, I need to be more careful. The "snapshot" at the beginning of the tick is the current state of all outputs. Then I resolve inputs from that snapshot, calculate new outputs, commit, increment, and resolve probes.

Let me think about the clock more carefully:

After committing tick n, the clock output is:
- 0 when floor(n / period) is even
- 1 when floor(n / period) is odd

So at tick 0 (reset), clock = 0.
After the first tick (tick becomes 1), clock = floor(1/period).

But wait - the clock output is part of the "outputs" that get snapshotted. So at the start of tick 1, the snapshot has clock=0 (from tick 0). The DFF sees this as the "new" clock value.

After committing tick 1, the clock output becomes floor(1/period). For period=2, that's 0. So the DFF still sees 0.

After committing tick 2, clock = floor(2/2) = 1. Now the DFF sees 1 on the next tick.

So the DFF's "previous clock" is updated at the end of each tick to the current clock value. Let me re-read:

"Always store new as the previous-clock value at the end of the tick."

So at the end of tick n, the stored previous-clock = the resolved clock value at tick n (which is from the snapshot at the start of tick n).

Wait, I'm confusing myself. Let me re-read the tick procedure:

1. Resolve every input from that snapshot (snapshot = outputs at start of tick)
2. Calculate every component's next output and internal state
3. Commit all results simultaneously
4. Increment the tick counter
5. Resolve probes from the newly committed outputs

So the "resolved clock" in step 2 is the clock value from the snapshot (i.e., the clock output at the start of the tick). The "new" in edge detection is this resolved value.

The "old" is the stored previous-clock value from the previous tick.

At the end of the tick, the stored previous-clock = the resolved clock (from snapshot).

But what about the clock's own output? The clock output is determined by the tick number. So:

At tick 0 (reset): clock output = 0, stored prev-clock = 0
Start of tick 1: snapshot has clock=0. DFF resolves clock input = 0. old=0, new=0. No edge. At end of tick 1, stored prev-clock = 0. Clock output after tick 1 = floor(1/period).
Start of tick 2: snapshot has clock = floor(1/period). For period=2: 0. DFF resolves clock=0. old=0, new=0. No edge. At end of tick 2, stored prev-clock = 0. Clock output after tick 2 = floor(2/2) = 1.
Start of tick 3: snapshot has clock=1. DFF resolves clock=1. old=0, new=1. Definite rising edge! Capture d. At end of tick 3, stored prev-clock = 1. Clock output after tick 3 = floor(3/2) = 1.
Start of tick 4: snapshot has clock=1. DFF resolves clock=1. old=1, new=1. No edge. At end of tick 4, stored prev-clock = 1. Clock output after tick 4 = floor(4/2) = 0.

So the DFF captures on tick 3, which is the tick after the clock transitions. This matches "A receiving register therefore sees a CLOCK transition on the following tick."

Now, the clock output after committing tick n:
- The clock's output in the committed state after tick n is floor(n/period) parity.
- But the DFF samples the clock from the snapshot at the start of the tick, which is the clock output from the previous committed state.

So at the start of tick n, the clock value in the snapshot is the clock output from the state after tick n-1, which is floor((n-1)/period) parity.

Wait, I think I need to be more precise. Let me define:

- `clockOutput(n)` = the clock's output value in the state after committing tick n.
  - `clockOutput(n)` = 0 if floor(n/period) is even, 1 if odd.

- At reset (before any ticks), the state is "after tick 0" in a sense, so clock = 0.

- At the start of tick n (1-indexed), the snapshot contains the clock output from the state after tick n-1.
  - So the clock value in the snapshot = clockOutput(n-1).

- The DFF's "new" = clockOutput(n-1) (from snapshot)
- The DFF's "old" = stored prev-clock from the end of tick n-1 = clockOutput(n-1)

Wait, that can't be right because then old always equals new and there's never an edge.

Let me re-read: "Always store new as the previous-clock value at the end of the tick."

So at the end of tick n, stored prev-clock = new = the resolved clock from the snapshot at the start of tick n = clockOutput(n-1).

At the start of tick n+1, the snapshot has clock = clockOutput(n). The DFF's "new" = clockOutput(n). The DFF's "old" = stored prev-clock = clockOutput(n-1).

So edge detection compares clockOutput(n) with clockOutput(n-1). That makes sense!

For period=2:
- clockOutput(0) = 0
- clockOutput(1) = 0 (floor(1/2)=0, even)
- clockOutput(2) = 1 (floor(2/2)=1, odd)
- clockOutput(3) = 1 (floor(3/2)=1, odd)
- clockOutput(4) = 0 (floor(4/2)=2, even)

At start of tick 1: new=clockOutput(0)=0, old=0 (initial). No edge.
At start of tick 2: new=clockOutput(1)=0, old=0. No edge.
At start of tick 3: new=clockOutput(2)=1, old=0. Definite rising edge!
At start of tick 4: new=clockOutput(3)=1, old=1. No edge.
At start of tick 5: new=clockOutput(4)=0, old=1. No edge (falling).

So the DFF captures on tick 3. The clock transitioned between tick 2 and tick 3 (from the DFF's perspective). This matches the spec.

OK so in my implementation:
- `sim.clocks[nodeId]` stores the "previous clock" value
- At reset: `sim.clocks[nodeId] = "0"` for DFF and RAM
- During a tick:
  - `new` = resolved clock input (from snapshot)
  - `old` = `sim.clocks[nodeId]`
  - Edge detection
  - At the end: `newClocks[nodeId] = new` (the resolved value)

And the clock output is computed based on the tick number:
- After committing tick n: `clockOutput = floor(n / period) % 2 === 0 ? "0" : "1"`

So in the simulation loop:
```
function doTick() {
  // 1. Snapshot
  const snap = {...sim.outputs};
  
  // 2. Resolve inputs from snap
  const resolved = resolveAllInputs(snap);
  
  // 3. Calculate next state
  const newOutputs = {};
  const newMemory = {};
  const newClocks = {};
  
  for (const node of doc.nodes) {
    switch (node.type) {
      case 'INPUT':
        newOutputs[node.id] = node.value;
        break;
      case 'CLOCK':
        // Will be set after tick increment
        break;
      case 'NOT':
        // ...
        break;
      // etc.
    }
  }
  
  // 4. Commit
  // 5. Increment tick
  sim.tick++;
  
  // Set clock outputs based on new tick number
  for (const node of doc.nodes.filter(n => n.type === 'CLOCK')) {
    const n = sim.tick;
    const p = node.period;
    newOutputs[node.id] = (Math.floor(n / p) % 2 === 0) ? "0" : "1";
  }
  
  sim.outputs = newOutputs;
  sim.memory = newMemory;
  sim.clocks = newClocks;
  
  // 6. Resolve probes
  sim.probes = {};
  for (const node of doc.nodes.filter(n => n.type === 'PROBE')) {
    sim.probes[node.id] = resolveInput(node.id, 'in', newOutputs, doc.wires);
  }
}
```

Wait, I need to be more careful. The clock output is part of the "outputs" that get committed. But the clock output depends on the tick number, which is incremented in step 4. So the clock output for the new state is based on the new tick number.

Actually, let me re-read the spec: "CLOCK outputs are 0" at reset. And "after committing tick number n, output is: 0 when floor(n / period) is even, 1 when floor(n / period) is odd."

So the clock output in the state after committing tick n is determined by n. At reset (which is like "after tick 0"), the output is 0 (floor(0/period)=0, even).

In the tick procedure:
1. Snapshot (contains clock output from previous state)
2. Resolve inputs from snapshot
3. Calculate next output - for CLOCK, this is based on the NEW tick number (after increment)
4. Commit
5. Increment tick
6. Resolve probes

Wait, but step 3 happens before step 5. So how does the clock know the new tick number?

I think the clock output calculation is special - it's not based on inputs but on the tick number. So in step 3, when calculating the clock's next output, we use (currentTick + 1) since we're about to increment.

Let me restructure:

```
function doTick() {
  const tickBefore = sim.tick; // This is the tick number of the current state
  
  // 1. Snapshot
  const snap = {...sim.outputs};
  
  // 2. Resolve inputs from snap
  const resolved = resolveAllInputs(snap);
  
  // 3. Calculate next state (tick will be tickBefore + 1)
  const newTick = tickBefore + 1;
  const newOutputs = {};
  const newMemory = {};
  const newClocks = {};
  
  for (const node of doc.nodes) {
    if (node.type === 'INPUT') {
      newOutputs[node.id] = node.value;
    } else if (node.type === 'CLOCK') {
      newOutputs[node.id] = (Math.floor(newTick / node.period) % 2 === 0) ? "0" : "1";
    } else if (node.type === 'NOT') {
      // ...
    }
    // etc.
  }
  
  // 4. Commit
  sim.outputs = newOutputs;
  sim.memory = newMemory;
  sim.clocks = newClocks;
  
  // 5. Increment tick
  sim.tick = newTick;
  
  // 6. Resolve probes
  sim.probes = {};
  for (const node of doc.nodes.filter(n => n.type === 'PROBE')) {
    sim.probes[node.id] = resolveInput(node.id, 'in', newOutputs, doc.wires);
  }
}
```

This makes sense. The clock output for the new state is based on the new tick number.

Now for the DFF:
- `old` = sim.clocks[dffId] (stored previous clock)
- `new` = resolved clock input (from snapshot, which is the clock output from the previous state)
- Edge detection
- At the end: newClocks[dffId] = new (the resolved value)

Let me also think about the "resolve input" function:

```
function resolveInput(nodeId, portName, outputs, wires) {
  // Find all wires that go TO this node's port
  const drivers = wires.filter(w => w.to.node === nodeId && w.to.port === portName);
  
  if (drivers.length === 0) return 'Z'.repeat(width);
  
  // For each bit position, resolve from all drivers
  const result = [];
  for (let i = 0; i < width; i++) {
    const driverVals = drivers.map(w => outputs[w.from.node][w.from.port === 'out' ? 'out' : w.from.port]);
    // Wait, the source port is always 'out' for non-PROBE nodes
    // Actually, the source is always the 'out' port of the source node
    const vals = drivers.map(w => outputs[w.from.node]);
    // Each val is a string of width characters
    // Get the i-th character from each
    const bits = vals.map(v => v[i]);
    
    // Remove Z
    const nonZ = bits.filter(b => b !== 'Z');
    if (nonZ.length === 0) {
      result.push('Z');
    } else if (nonZ.includes('X')) {
      result.push('X');
    } else if (nonZ.includes('0') && nonZ.includes('1')) {
      result.push('X');
    } else {
      result.push(nonZ[0]);
    }
  }
  return result.join('');
}
```

Wait, but the wire's `from` has a `port` field. For most nodes, the output port is "out". But for some nodes, there might be other output ports? Let me re-read the spec.

"Every node except PROBE has one output port named out."

So the source port is always "out" (except PROBE which has no output). The `from.port` in the wire is always "out" for the source.

Actually wait, looking at the wire format:
```
{
  "id": "w1",
  "from": { "node": "a", "port": "out" },
  "to": { "node": "p", "port": "in" }
}
```

So `from.port` is "out" and `to.port` is the input port name. The output is always accessed as `outputs[nodeId]` (which is the "out" port value).

OK so my resolve function is correct. Let me also handle the case where the source node is a PROBE - but PROBE has no output, so it can't be a source. The validation should catch this.

Now let me think about the gate implementations:

```
function gateNOT(input) {
  return input.split('').map(c => c === '0' ? '1' : c === '1' ? '0' : 'X').join('');
}

function gateAND(a, b) {
  const result = [];
  for (let i = 0; i < a.length; i++) {
    const x = a[i] === 'Z' ? 'X' : a[i];
    const y = b[i] === 'Z' ? 'X' : b[i];
    if (x === '0' || y === '0') result.push('0');
    else if (x === '1' && y === '1') result.push('1');
    else result.push('X');
  }
  return result.join('');
}

function gateOR(a, b) {
  const result = [];
  for (let i = 0; i < a.length; i++) {
    const x = a[i] === 'Z' ? 'X' : a[i];
    const y = b[i] === 'Z' ? 'X' : b[i];
    if (x === '1' || y === '1') result.push('1');
    else if (x === '0' && y === '0') result.push('0');
    else result.push('X');
  }
  return result.join('');
}

function gateXOR(a, b) {
  const result = [];
  for (let i = 0; i < a.length; i++) {
    const x = a[i] === 'Z' ? 'X' : a[i];
    const y = b[i] === 'Z' ? 'X' : b[i];
    if ((x === '0' || x === '1') && (y === '0' || y === '1')) {
      result.push(x === y ? '0' : '1');
    } else {
      result.push('X');
    }
  }
  return result.join('');
}

function gateADD(a, b, width) {
  // If either contains X or Z, result is all X
  if (a.includes('X') || a.includes('Z') || b.includes('X') || b.includes('Z')) {
    return 'X'.repeat(width);
  }
  // Add modulo 2^width
  const va = parseInt(a, 2);
  const vb = parseInt(b, 2);
  const result = (va + vb) % (1 << width);
  return result.toString(2).padStart(width, '0');
}

function gateMUX(a, b, s) {
  if (s === '0') return a;
  if (s === '1') return b;
  // s is X or Z
  const result = [];
  for (let i = 0; i < a.length; i++) {
    result.push(a[i] === b[i] ? a[i] : 'X');
  }
  return result.join('');
}

function gateTRI(input, en) {
  if (en === '0') return 'Z'.repeat(input.length);
  if (en === '1') return input;
  // en is X or Z
  const result = [];
  for (let i = 0; i < input.length; i++) {
    result.push(input[i] === 'Z' ? 'Z' : 'X');
  }
  return result.join('');
}
```

Now for DFF:
```
function dffTick(d, clk, rst, oldOutput, oldClk) {
  // Normalize Z to X for clk
  const clkNorm = clk === 'Z' ? 'X' : clk;
  const rstNorm = rst; // rst is 1-bit
  
  let output;
  if (rstNorm === '1') {
    output = '0'.repeat(oldOutput.length);
  } else if (rstNorm === 'X' || rstNorm === 'Z') {
    output = 'X'.repeat(oldOutput.length);
  } else {
    // rst = 0
    const old = oldClk === 'Z' ? 'X' : oldClk;
    const new_ = clkNorm;
    
    if (old === '0' && new_ === '1') {
      // Definite rising edge: capture d, Z→X
      output = d.split('').map(c => c === 'Z' ? 'X' : c).join('');
    } else if (old !== '1' && new_ !== '0' && !(old === '0' && new_ === '1')) {
      // Possible but not definite
      output = 'X'.repeat(oldOutput.length);
    } else {
      // No edge: hold
      output = oldOutput;
    }
  }
  
  return { output, newClk: new_ }; // newClk = resolved clock value
}
```

Wait, the "new" in the clock edge detection is the resolved clock input (which could be Z, but we normalize to X). And "old" is the stored previous-clock value (also normalized).

Let me re-read: "For DFF and RAM clock inputs, normalize Z to X."

So both old and new have Z→X normalization.

"Let old be the stored previous-clock value and new be the currently resolved clock."

So old = stored value (from previous tick), new = resolved clock input (from snapshot).

Both get Z→X normalization.

"Definite rising edge: old=0 and new=1."
"Possible but not definite rising edge: old is not 1 and new is not 0, excluding the definite case."

After Z→X normalization, the possible values are 0, 1, X.

- old ≠ 1: old ∈ {0, X}
- new ≠ 0: new ∈ {1, X}
- Excluding (old=0, new=1)
- So: (old=0, new=X), (old=X, new=1), (old=X, new=X)

This matches what I had.

For RAM:
```
function ramTick(addr, din, we, clk, mem, oldOutput, oldClk) {
  const clkNorm = clk === 'Z' ? 'X' : clk;
  const old = oldClk === 'Z' ? 'X' : oldClk;
  const new_ = clkNorm;
  
  let definite = (old === '0' && new_ === '1');
  let possible = (old !== '1' && new_ !== '0') && !definite;
  
  let output;
  let newMem = [...mem]; // copy
  
  if (definite) {
    // Read-before-write
    if (addr.includes('X') || addr.includes('Z')) {
      output = 'X'.repeat(addr.length);
    } else {
      output = mem[parseInt(addr, 2)];
    }
  } else if (possible) {
    output = 'X'.repeat(addr.length);
  } else {
    output = oldOutput;
  }
  
  // Write
  const dinNorm = din.split('').map(c => c === 'Z' ? 'X' : c).join('');
  
  if (we !== '0') {
    if (definite && !addr.includes('X') && !addr.includes('Z') && we === '1') {
      newMem[parseInt(addr, 2)] = dinNorm;
    } else if ((definite || possible) && we !== '0') {
      // Wait, the spec says:
      // "Otherwise, if an edge is possible and we is not 0:"
      // This means: NOT (definite edge AND binary addr AND we=1)
      // AND (edge is possible [definite or possible] AND we ≠ 0)
      
      // Actually let me re-read:
      // "we=0: no write."
      // "Definite edge, binary addr, we=1: replace that word with din."
      // "Otherwise, if an edge is possible and we is not 0:"
      //   "Binary addr: merge din into that word."
      //   "Unknown addr: merge din into ALL 16 words."
      
      // So the "otherwise" case is: NOT (definite AND binary addr AND we=1)
      // AND (edge is possible [definite or possible] AND we ≠ 0)
      
      // But we already handled we=0 above (no write).
      // And we already handled definite+binary+we=1 above.
      // So the "otherwise" is: (definite OR possible) AND we≠0 AND NOT (definite AND binary AND we=1)
      
      // Which simplifies to:
      // (definite OR possible) AND we≠0 AND (NOT definite OR NOT binary OR we≠1)
      
      // Since we≠0 is already established:
      // (definite OR possible) AND (NOT definite OR NOT binary OR we≠1)
      
      // Case 1: definite AND binary AND we=1 → handled above (replace)
      // Case 2: definite AND binary AND we≠1 (i.e., we=X) → merge into that word
      // Case 3: definite AND unknown addr → merge into ALL words
      // Case 4: possible AND any addr → merge
    }
  }
  
  return { output, newMem, newClk: new_ };
}
```

Let me be more careful with the RAM write logic:

```
// After determining output:
const dinNorm = din.split('').map(c => c === 'Z' ? 'X' : c).join('');

if (we === '0') {
  // No write
} else if (definite && isBinary(addr) && we === '1') {
  newMem[parseInt(addr, 2)] = dinNorm;
} else if ((definite || possible) && we !== '0') {
  // This is the "Otherwise, if an edge is possible and we is not 0" case
  // But we need to exclude the case already handled above
  // Actually, the spec says "Otherwise" meaning it's the fallback for cases not handled above
  // Since we=0 is handled, and definite+binary+we=1 is handled,
  // this covers: (definite or possible) AND we≠0 AND NOT(definite AND binary AND we=1)
  
  if (isBinary(addr)) {
    // Merge din into that word
    const idx = parseInt(addr, 2);
    newMem[idx] = mergeWords(newMem[idx], dinNorm);
  } else {
    // Merge din into ALL 16 words
    for (let i = 0; i < 16; i++) {
      newMem[i] = mergeWords(newMem[i], dinNorm);
    }
  }
}
```

Wait, but there's a subtlety. The condition "Otherwise, if an edge is possible and we is not 0" - does "an edge is possible" mean "definite OR possible"? I think so, because "possible" in the context of the spec includes both definite and possible-but-not-definite edges.

Actually, re-reading: the three cases for writes are:
1. we=0: no write
2. Definite edge, binary addr, we=1: replace
3. Otherwise, if an edge is possible and we is not 0: merge

"An edge is possible" = definite edge OR possible-but-not-definite edge.

So case 3 is: (definite OR possible) AND we≠0 AND NOT (definite AND binary AND we=1)

Which means:
- If definite AND binary AND we=X: merge into that word (case 3, binary addr)
- If definite AND unknown addr: merge into all words (case 3, unknown addr)
- If possible AND binary addr AND we=1 or we=X: merge into that word
- If possible AND unknown addr AND we=1 or we=X: merge into all words

This looks right.

Now let me think about the merge function:
```
function mergeWords(a, b) {
  const result = [];
  for (let i = 0; i < a.length; i++) {
    result.push(a[i] === b[i] ? a[i] : 'X');
  }
  return result.join('');
}
```

OK, I think I have a good understanding of the simulation. Let me now focus on the UI and rendering.

For the SVG rendering, I'll use:
- A main SVG element (#workspace)
- A scene group (#scene) with transform for pan/zoom
- Node groups with data-node attribute
- Wire paths with data-wire attribute
- Port elements with data-port attribute

The transform: `translate(view.x, view.y) scale(view.scale)`

For node rendering, each node is a group containing:
- A rect (body)
- Text (type label)
- Port indicators (circles/rects)
- Value text

For wire rendering, each wire is a path with a cubic bezier curve.

Let me now write the full code. I'll aim for a clean, well-organized structure.

Let me plan the layout for 1280×800:
- Top bar (40px): controls
- Left panel (160px): palette
- Right panel (220px): inspector
- Bottom panel (200px): JSON, truth table, status
- Center: workspace (fills remaining space)

Actually, let me think about this more carefully. The grader needs all controls to be reachable without scrolling. At 1280×800:

- Top bar: 48px (controls: New, Undo, Redo, Step, Run, Reset, Zoom In, Zoom Out, Fit, Import, Export, Truth, Step Count, Tick)
- Left: 140px (palette)
- Right: 240px (inspector)
- Bottom: 180px (JSON textarea, status, truth table)
- Center: workspace

That should fit in 800px height: 48 + 800 - 48 - 180 = 572px for workspace. Width: 1280 - 140 - 240 = 900px for workspace.

Let me start coding now. I'll write it all out.

One more thing - the truth table generation. For an acyclic circuit with INPUT and combinational components and PROBE:

1. Validate: at least 1 INPUT, at least 1 PROBE, at most 8 total INPUT bits, at most 16 probes, no CLOCK/DFF/RAM, no cycles.
2. Sort INPUT nodes by ID (ASCII).
3. Enumerate all 2^n binary assignments in ascending order.
4. For each assignment:
   - Create a separate simulation state
   - Set INPUT values
   - Reset
   - Execute 64 ticks
   - Record probe values

The "separate simulation state" means I need to run the simulation independently for each assignment without affecting the main state.

For 256 rows (8 input bits), each with 64 ticks, that's 16384 simulation steps. Each step involves resolving all inputs and computing all outputs. For a small circuit, this should be fast.

Let me think about the cycle detection. I need to check if the circuit (considering only the relevant nodes) has a directed cycle. I'll use DFS or topological sort.

Actually, the spec says "No CLOCK, DFF, RAM, or directed cycles." So I need to check:
1. No CLOCK, DFF, or RAM nodes in the circuit
2. No directed cycles in the wire graph

For cycle detection, I'll do a DFS on the node graph (edges = wires).

Now let me write the code. This is going to be long but I'll be thorough.

Let me also think about the "step" button. "Clicking #step advances exactly this many ticks while paused." So if step count is 3, clicking step advances 3 ticks. If running, step does nothing? Or does it still advance? The spec says "while paused", so it only works when paused.

Actually, re-reading: "Clicking #step advances exactly this many ticks while paused." I think this means: the step button, when clicked, advances the specified number of ticks. It only works while paused (if running, it does nothing or pauses first).

Let me make it: if paused, advance N ticks. If running, do nothing (or pause first then advance).

I'll go with: step only works when paused.

Now let me also think about the "Run" button. It advances ~10 ticks per second. I'll use a setInterval or requestAnimationFrame with timing.

For the run loop:
```
let runInterval = null;
function startRun() {
  if (runInterval) return;
  running = true;
  updateRunButton();
  runInterval = setInterval(() => {
    doTick();
    render();
  }, 100); // 100ms = 10 ticks per second
}
function stopRun() {
  if (!runInterval) return;
  running = false;
  updateRunButton();
  clearInterval(runInterval);
  runInterval = null;
}
```

Actually, for more precise timing independent of display refresh, I'll use a time-based approach:
```
let runTimer = null;
let lastRunTime = 0;
let runRAF = null;

function startRun() {
  running = true;
  updateRunButton();
  lastRunTime = performance.now();
  runLoop();
}

function runLoop() {
  if (!running) return;
  const now = performance.now();
  const elapsed = now - lastRunTime;
  const ticksToAdvance = Math.floor(elapsed / 100); // 100ms per tick
  
  if (ticksToAdvance > 0) {
    for (let i = 0; i < ticksToAdvance; i++) doTick();
    lastRunTime = now;
    render();
  }
  requestAnimationFrame(runLoop);
}
```

This is more robust. Let me use this approach.

OK, I think I have enough planning. Let me write the code now.

One more consideration: the "New Circuit" button. It should clear the document and reset everything.

And "Import" reads from the #json textarea, validates, and if valid, replaces the document and resets. If invalid, shows an error in #status with data-error="import".

"Export" writes the document JSON to the #json textarea.

Let me also think about the ID generation for new nodes and wires:
- New IDs must not collide with existing node or wire IDs.
- I'll use a counter: "n0", "n1", "n2", ... for nodes and "w0", "w1", "w2", ... for wires.
- Or I can use a global counter that increments.

Actually, let me use a simple approach: generate IDs like "n0", "n1", etc., and check for collisions. If collision, increment until no collision.

Let me now write the full code. I'll organize it into sections:

1. HTML structure
2. CSS
3. JavaScript:
   a. State
   b. Validation
   c. Simulation
   d. Rendering
   e. Interaction
   f. UI controls
   g. Truth table
   h. Persistence
   i. API
   j. Initialization

This is going to be a very long file. Let me write it efficiently.

Let me think about the node visual design:
- Body: rounded rect, dark background, light border
- Type label: top-left, small text
- Value: center, monospace, colored by signal
- Ports: small circles/rects on left (input) and right (output)
- Selection: bright border or glow

Color scheme:
- 0: blue (#4a9eff)
- 1: green (#4aff4a)
- X: red/orange (#ff6644)
- Z: gray (#888888)

Background: dark (#1a1a2e or similar)
Node body: #2a2a3e
Wire: gradient or solid color based on signal

Let me go with a dark theme for a professional look.

Now let me write the code. I'll be as concise as possible while maintaining readability.

Actually, for the wire routing, let me use a simple approach:
- From source port center, go right some distance
- Then curve to the destination port center
- Use a cubic bezier: M sx,sy C sx+50,sy tx-50,ty tx,ty

For the port positions:
- Node body: 120×50 (or adjust)
- Input ports: left side, evenly spaced
- Output port: right side, centered

Let me define:
- Node width: 120 (world units)
- Node height: 50 + 20 * (numInputPorts - 1) if multiple input ports, else 50
- Actually, let me keep it simple: fixed height of 60 for all nodes
- Input ports at x=0, y = 20, 40, 60 (for up to 3 ports)
- Output port at x=120, y=30

Wait, for nodes with 1 input port (NOT, PROBE, TRI, ADD has 2):
- NOT: 1 input (in), 1 output
- AND: 2 inputs (a, b), 1 output
- OR: 2 inputs, 1 output
- XOR: 2 inputs, 1 output
- MUX: 3 inputs (a, b, s), 1 output
- TRI: 2 inputs (in, en), 1 output
- ADD: 2 inputs (a, b), 1 output
- DFF: 3 inputs (d, clk, rst), 1 output
- RAM: 4 inputs (addr, din, we, clk), 1 output
- PROBE: 1 input, no output
- INPUT: 0 inputs, 1 output
- CLOCK: 0 inputs, 1 output

So the max input ports is 4 (RAM). Let me make the node height accommodate this.

Node height: 20 + 20 * numInputPorts (so 20 for 0 ports, 40 for 1, 60 for 2, 80 for 3, 100 for 4)

Actually, let me just use a fixed height that works for all: 100px. Or I can make it dynamic.

Let me make it dynamic: height = 30 + 20 * max(1, numInputPorts)

For 0 ports: 50
For 1 port: 50
For 2 ports: 70
For 3 ports: 90
For 4 ports: 110

Input port y positions: evenly spaced in the node.
Output port y: center of the node.

Let me define:
- Node width: 120
- Node height: 30 + 20 * max(1, numInputPorts)
- Input port i at: (0, height/2 + (i - (n-1)/2) * 25)
- Output port at: (120, height/2)

Actually, let me simplify. I'll use:
- Node width: 120
- Node height: 60 for all (simple and consistent)
- Input ports: left side, at y = 15, 30, 45, 60 (for up to 4 ports, but I'll only use as many as needed)
- Output port: right side, at y = 30

Wait, for 4 input ports in a 60px height, that's tight. Let me use:
- Port spacing: 15px
- For n ports: start at (60 - (n-1)*15)/2, step 15

For 1 port: y=30
For 2 ports: y=22.5, 37.5
For 3 ports: y=15, 30, 45
For 4 ports: y=7.5, 22.5, 37.5, 52.5

That works. Let me use this.

Actually, for visual clarity, let me make the node a bit taller: 70px.
- Port spacing: 16px
- For n ports: centered vertically

OK let me just code it up and adjust as needed.

Let me also think about the port visual size. For the grader, "The center of its bounding box is a valid drag endpoint." So I need to make sure the port elements are visible and have a clear center.

I'll use circles with radius 6 for 1-bit ports and wider rects for multi-bit ports. The width of the rect will be proportional to the bus width: width = 4 + busWidth * 2.

Actually, for simplicity and to ensure the center is clear, let me use rects for all ports:
- Height: 12
- Width: 8 + busWidth * 2 (so 10 for 1-bit, 12 for 2-bit, ..., 24 for 8-bit)
- Centered on the port position

The center of the bounding box is the port position.

For the drag interaction:
- Click on a port to start a wire drag
- Move the mouse to draw the wire
- Release on an input port to create the wire
- If incompatible width, reject
- If duplicate, no-op

For node dragging:
- Click on the node body (data-title element) to start drag
- Move the node
- On release, commit as one history entry

For pan:
- Alt+left-drag on empty workspace
- Move the view

Let me now write the code. I'll be comprehensive.

One more thing: the "Fit" button. It should zoom and pan so all nodes are visible with a margin.

```
function fitView() {
  if (doc.nodes.length === 0) {
    view.x = 0; view.y = 0; view.scale = 1;
    return;
  }
  const margin = 50;
  const minX = Math.min(...doc.nodes.map(n => n.x)) - margin;
  const maxX = Math.max(...doc.nodes.map(n => n.x + NODE_W)) + margin;
  const minY = Math.min(...doc.nodes.map(n => n.y)) - margin;
  const maxY = Math.max(...doc.nodes.map(n => n.y + NODE_H)) + margin;
  
  const w = maxX - minX;
  const h = maxY - minY;
  const sw = workspace.clientWidth;
  const sh = workspace.clientHeight;
  
  view.scale = Math.min(sw / w, sh / h);
  view.scale = Math.max(0.25, Math.min(4, view.scale));
  
  view.x = (sw - w * view.scale) / 2 - minX * view.scale;
  view.y = (sh - h * view.scale) / 2 - minY * view.scale;
}
```

OK, I think I've planned enough. Let me write the full code now.

Let me also make sure I handle the "step count" input correctly. It's a number input with default 1, range 1-4096. Clicking #step advances exactly this many ticks while paused.

For the truth table, I need to be careful about the "separate simulation state" requirement. I'll create a function that takes a document and input values, runs 64 ticks, and returns the probe values. This function should not modify the main state.

```
function runSeparateSim(doc, inputValueMap) {
  // Create a separate simulation state
  const sim = createSimState(doc);
  // Set input values
  for (const [id, value] of Object.entries(inputValueMap)) {
    sim.outputs[id] = value;
  }
  // Reset
  resetSim(sim, doc);
  // Run 64 ticks
  for (let i = 0; i < 64; i++) {
    doTick(sim, doc);
  }
  // Return probe values
  return sim.probes;
}
```

Wait, but the INPUT values are part of the document, not the simulation state. When I "substitute the INPUT values for that assignment", I need to modify the document's INPUT values temporarily.

Actually, re-reading: "Use a separate simulation state. Substitute the INPUT values for that assignment. Reset that separate state. Execute exactly 64 ticks."

So I create a copy of the document with modified INPUT values, create a simulation state for it, reset, and run 64 ticks.

Let me implement it as:
```
function generateTruthTable() {
  // Validate
  // ...
  
  const inputNodes = doc.nodes.filter(n => n.type === 'INPUT').sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const probeNodes = doc.nodes.filter(n => n.type === 'PROBE').sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  
  const totalBits = inputNodes.reduce((sum, n) => sum + n.width, 0);
  
  const rows = [];
  for (let i = 0; i < (1 << totalBits); i++) {
    // Create the assignment string
    const assignment = i.toString(2).padStart(totalBits, '0');
    
    // Distribute bits among input nodes
    let bitPos = 0;
    const modDoc = deepCopy(doc);
    for (const node of inputNodes) {
      node.value = assignment.substring(bitPos, bitPos + node.width);
      bitPos += node.width;
    }
    
    // Run separate simulation
    const sim = createSimState(modDoc);
    resetSim(sim, modDoc);
    for (let t = 0; t < 64; t++) doTick(sim, modDoc);
    
    rows.push({ assignment, probes: sim.probes });
  }
  
  return rows;
}
```

This should work. The "separate simulation state" is achieved by creating a new sim object and a modified document copy.

Now, for performance with 256 rows × 64 ticks = 16384 tick executions, each involving all nodes and wires, I need to make sure the simulation is fast. For a small circuit (a few nodes), this should be trivial. For a large circuit, it might take a moment, but the spec says "must finish within 5 seconds" which should be fine for reasonable circuit sizes.

OK, let me now write the actual code. I'll aim for completeness and correctness.

Let me structure the HTML:

```html
<!DOCTYPE html>
<html>
<head>
<style>/* CSS */</style>
</head>
<body>
<div id="app">
  <div id="topbar">
    <!-- Controls -->
  </div>
  <div id="main">
    <div id="palette">
      <!-- Palette buttons -->
    </div>
    <div id="workspace-container">
      <svg id="workspace">
        <g id="scene">
          <!-- Wires and nodes -->
        </g>
      </svg>
    </div>
    <div id="inspector">
      <!-- Inspector -->
    </div>
  </div>
  <div id="bottom">
    <!-- JSON, status, truth table -->
  </div>
</div>
<script>/* JS */</script>
</body>
</html>
```

Let me write it all now. This will be a very long file.

I need to be careful about:
1. The exact grader contract (element IDs, attributes, etc.)
2. The simulation semantics (exact tick behavior)
3. The validation rules
4. The history system
5. The viewport transform
6. The truth table generation
7. The API

Let me write it section by section.

For the SVG, I need to handle devicePixelRatio. The spec says "Handle resizing and devicePixelRatio." For SVG, this is mostly handled automatically by the browser, but I should make sure the SVG viewBox and dimensions are correct.

Actually, for SVG, devicePixelRatio is handled by the browser's rendering. I just need to make sure the SVG element's width and height match its CSS size. I'll set the SVG width/height to 100% and use the container's dimensions.

For the scene transform, I'll use:
```
scene.setAttribute('transform', `translate(${view.x}, ${view.y}) scale(${view.scale})`);
```

This maps world coordinates to screen coordinates as:
screenX = view.x + worldX * view.scale
screenY = view.y + worldY * view.scale

Which matches the spec.

Now let me write the full code. I'll be as thorough as possible.

Let me think about one more thing: the "wire creation" interaction. When the user drags from an output port to an input port:
1. Mousedown on an output port: start wire drag
2. Mousemove: update the wire preview
3. Mouseup on an input port: create the wire (if valid)
4. Mouseup elsewhere: cancel

I need to track:
- Which port the drag started from (node ID, port name)
- The current mouse position (for the preview)
- The target port (if hovering over one)

For the wire preview, I'll draw a temporary path that follows the mouse.

For the "valid" check:
- Widths must match (source port width == destination port width)
- Not a duplicate (same source and destination endpoints)
- Source and destination must be valid (exist in document)

If invalid, show a status message but don't modify the document.

OK, I think I'm ready to write the code. Let me do it now.

One final thought on the node rendering: I need to make sure the value text is visible and shows the correct value. For non-PROBE nodes, it shows the output. For PROBE, it shows the resolved input.

The value text should be colored based on the signal:
- All 0s: blue
- All 1s: green
- Contains X: red/orange
- Contains Z: gray
- Mixed: use the "worst" color (X > Z > 1 > 0)

Actually, let me color each character individually. That's more informative.

For the wire color, I'll use the color of the signal it carries. If the signal is mixed, I'll use a gradient or just the "dominant" color.

Let me use a simple approach: color the wire based on the source output:
- All 0: blue
- All 1: green
- Contains X: orange
- Contains Z: gray
- Mixed 0/1: yellow

OK, let me write the code now. I'll aim for a complete, working implementation.

Let me also think about the "Demo" button. I'll create a simple demo circuit:
- An INPUT (4-bit)
- A NOT gate
- An AND gate
- A PROBE
- A CLOCK
- A DFF

This will showcase the features.

Alright, let me write the full code now. I'll be thorough and aim for correctness.

Here's my plan for the code structure:

```javascript
// ===== STATE =====
let doc = { nodes: [], wires: [] };
let sim = {};
let view = { x: 0, y: 0, scale: 1 };
let selection = null;
let running = false;
let history = [];
let historyIndex = -1;
let nextIdCounter = 0;

// ===== VALIDATION =====
function validateDocument(doc) { ... }

// ===== SIMULATION =====
function resetSim() { ... }
function doTick() { ... }
function resolveInput(nodeId, port) { ... }

// ===== RENDERING =====
function render() { ... }
function renderNodes() { ... }
function renderWires() { ... }

// ===== INTERACTION =====
// Mouse handlers for drag, wire creation, pan, zoom

// ===== UI CONTROLS =====
// Button handlers

// ===== TRUTH TABLE =====
function generateTruthTable() { ... }

// ===== PERSISTENCE =====
function save() { ... }
function load() { ... }

// ===== API =====
window.__arena = { snapshot: function() { ... } };

// ===== INIT =====
function init() { ... }
```

Let me write it all now. I'll be as complete as possible.

Actually, I realize I need to think more carefully about the history system. The spec says "Undo/Redo support at least 50 document edits." So I need to keep at least 50 history entries.

I'll use a simple approach:
- `history` is an array of document snapshots
- `historyIndex` is the current position
- On a new edit: truncate history after historyIndex, push new snapshot, increment historyIndex
- On undo: decrement historyIndex, restore document
- On redo: increment historyIndex, restore document
- Max size: 100 (to be safe)

Each snapshot is a deep copy of the document.

For the "one completed drag is ONE history entry" requirement: I only push to history on mouseup (when the drag is complete), not on every mousemove.

Let me also think about what constitutes a "document edit":
- Adding a node
- Deleting a node
- Moving a node (drag complete)
- Creating a wire
- Inspector changes (width, value, period)
- New circuit
- Successful import

All of these reset the simulation.

OK, I'm going to write the code now. Let me be efficient and thorough.

Let me think about the node port definitions:

```javascript
const PORTS = {
  INPUT: { inputs: [], outputs: ['out'] },
  CLOCK: { inputs: [], outputs: ['out'] },
  NOT: { inputs: ['in'], outputs: ['out'] },
  AND: { inputs: ['a', 'b'], outputs: ['out'] },
  OR: { inputs: ['a', 'b'], outputs: ['out'] },
  XOR: { inputs: ['a', 'b'], outputs: ['out'] },
  MUX: { inputs: ['a', 'b', 's'], outputs: ['out'] },
  TRI: { inputs: ['in', 'en'], outputs: ['out'] },
  ADD: { inputs: ['a', 'b'], outputs: ['out'] },
  DFF: { inputs: ['d', 'clk', 'rst'], outputs: ['out'] },
  RAM: { inputs: ['addr', 'din', 'we', 'clk'], outputs: ['out'] },
  PROBE: { inputs: ['in'], outputs: [] }
};
```

Port widths:
- All ports have the node's width EXCEPT ports marked as 1 or 4 bits.
- MUX.s: 1 bit
- TRI.en: 1 bit
- DFF.clk: 1 bit, DFF.rst: 1 bit
- RAM.addr: 4 bits, RAM.we: 1 bit, RAM.clk: 1 bit

So:
```javascript
const PORT_WIDTHS = {
  MUX: { s: 1 },
  TRI: { en: 1 },
  DFF: { clk: 1, rst: 1 },
  RAM: { addr: 4, we: 1, clk: 1 }
};
```

When checking wire compatibility, the source port width must equal the destination port width.

Source port width:
- For 'out' port: the node's width
- For other output ports: (none in this spec, since all outputs are 'out')

Destination port width:
- For ports in PORT_WIDTHS: the specified width
- Otherwise: the node's width

So for a wire from node A (width 4) 'out' to node B (width 4) 's' (MUX, s is 1-bit):
- Source width: 4
- Dest width: 1
- Incompatible! Reject.

This makes sense.

Let me now write the code. I'll aim for a complete, working implementation that covers all the requirements.

I'll write it in one go, being careful about correctness.

Let me also think about the "width change removes incident wires" requirement:
"Changing width removes incident wires that have become width-incompatible."

So when I change a node's width, I need to check all wires connected to that node and remove any that are now incompatible.

For example, if I change a MUX's width from 4 to 2, the 's' port is still 1-bit, so wires to 's' are still compatible. But the 'out' port changes from 4 to 2, so any wire from 'out' to a 4-bit input becomes incompatible.

I need to check both the source and destination port widths.

OK let me write the code now. I'll be thorough.

Let me also handle the "INPUT value preservation on width change":
"preserve its least-significant bits: truncate on the left when shrinking, zero-pad on the left when growing"

Example: "0011" (width 4) → width 2: "11" (truncate left)
Example: "11" (width 2) → width 4: "0011" (zero-pad left)

For X and Z characters, I'll just keep them in the LSB positions and pad/truncate the rest.

OK, I'm going to write the code now. Let me be efficient.

Let me also think about the "step count" input. It's a number input with default 1, range 1-4096. I'll add min=1, max=4096, and validate on input.

For the "Run" button, I need to handle the aria-pressed attribute:
- aria-pressed="true" while running
- aria-pressed="false" while paused

The Space key toggles Run/Pause (unless in a text input).

Let me now write the complete code. I'll structure it clearly.

Here's my final plan for the layout:

```
+------------------------------------------------------------------+
| [New] [Undo] [Redo] [Step] [Run] [Reset] [Zoom+] [Zoom-] [Fit] |
| Step: [1]  Tick: 0  [Import] [Export] [Truth] [Demo]           |
+------------------------------------------------------------------+
| Palette  |              Workspace                    | Inspector  |
| [INPUT]  |                                         | Node: ... |
| [CLOCK]  |                                         | Type: ... |
| [NOT]    |                                         | Width: [ ] |
| [AND]    |                                         | Value: [ ] |
| [OR]     |                                         | Period: [ ]|
| [XOR]    |                                         |           |
| [MUX]    |                                         |           |
| [TRI]    |                                         |           |
| [ADD]    |                                         |           |
| [DFF]    |                                         |           |
| [RAM]    |                                         |           |
| [PROBE]  |                                         |           |
+------------------------------------------------------------------+
| Status: ...                                              |
| JSON: [textarea]                                         |
| Truth Table: [table]                                     |
+------------------------------------------------------------------+
```

Actually, for 1280×800, let me adjust:
- Top bar: 80px (two rows of controls)
- Left: 120px
- Right: 200px
- Bottom: 200px
- Workspace: 1280-120-200=960px wide, 800-80-200=520px tall

That should work.

Let me write the code now. I'll be as complete and correct as possible.

Actually, I realize I should think about one more thing: the "Reset State" button. It resets the simulation to tick 0, stopped, with the initial state. It does NOT reset the document or history.

"Reset State" → sim.tick = 0, running = false, sim.outputs = initial, sim.memory = initial, sim.clocks = initial, sim.probes = resolved.

OK, let me write the code now. For real this time.

I'll write it as a single HTML file with inline CSS and JS. Let me be thorough and aim for correctness.

Let me think about one more edge case: when a node is selected and the user presses Delete/Backspace, it should remove the node and all incident wires. But if a text input has focus, it should not.

I'll check `document.activeElement` to see if it's an input/textarea/select/contenteditable.

OK, writing the code now.

Let me also make sure I handle the "Escape clears selection" requirement.

And "Ctrl/Cmd+Z performs Undo; Ctrl/Cmd+Shift+Z performs Redo when not editing text."

Let me write the keyboard handler:
```javascript
document.addEventListener('keydown', (e) => {
  const tag = document.activeElement?.tagName?.toLowerCase();
  const isEditing = tag === 'input' || tag === 'textarea' || tag === 'select' || document.activeElement?.isContentEditable;
  
  if (isEditing) return;
  
  if (e.key === ' ' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    toggleRun();
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    deleteSelected();
  } else if (e.key === 'Escape') {
    selection = null;
    render();
  } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    undo();
  } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
    e.preventDefault();
    redo();
  }
});
```

OK, I'm going to write the full code now. Let me be comprehensive.

One more thing: the "visible text [data-value='ID']" requirement. Every node must have a visible text element with this attribute showing its current output (or resolved input for PROBE).

I'll add a text element to each node group with the data-value attribute.

And "Each port: a visible SVG element inside its node with [data-port='NAME']". I'll add small rects/circles for each port with the data-port attribute.

And "A selected node has aria-selected='true'; all others have 'false'". I'll set this on the node group.

Let me now write the complete code. I'll aim for a working, polished implementation.

I realize this is going to be a very long file (probably 2000+ lines). Let me write it efficiently.

Let me start with the HTML structure, then CSS, then JS.

For the JS, I'll organize it into clear sections with comments.

Let me write it now.
