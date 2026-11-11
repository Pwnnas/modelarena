Let me break down this complex task:

1. **Grid UI**: 26 columns (A-Z) × 100 rows (1-100), sticky headers, all 2600 cells in DOM
2. **Selection**: Click to select, arrow keys to move, highlighted row/column headers
3. **Editing**: Typing replaces content, F2/double-click edits existing, Enter/Tab/Shift+Enter/Shift+Tab navigation, Escape cancels, Delete/Backspace clears
4. **Formula bar**: `<input id="formula-bar">` showing raw content
5. **Values & display**: Numbers with no float noise, max 10 sig digits, right-aligned; text left-aligned; booleans as TRUE/FALSE
6. **Formula language**: Tokenizer, parser, evaluator with specific precedence, functions (SUM, AVERAGE, MIN, MAX, COUNT, IF, ABS, ROUND), ranges, absolute references
7. **Errors**: #DIV/0!, #VALUE!, #REF!, #ERROR!, #CYCLE!
8. **Recalculation**: Dependency graph, incremental, fast
9. **Copy & paste**: Ctrl+C/V with reference shifting
10. **Persistence**: localStorage
11. **Polish**: Professional look, formula highlighting, error styling, status bar

Let me plan the architecture:

**HTML Structure:**
- Formula bar area with cell address and input
- Grid container with sticky headers
- Status bar at bottom

**CSS:**
- Clean, modern design
- Sticky headers
- Cell styling with borders
- Selection highlighting
- Error cell styling
- Edit state styling

**JavaScript:**
- Grid rendering (all 2600 cells)
- Selection management
- Editing mode (inline input or overlay)
- Formula engine:
  - Tokenizer
  - Parser (builds AST)
  - Evaluator (with dependency tracking)
  - Dependency graph
  - Cycle detection
- Recalculation engine
- Copy/paste with reference shifting
- localStorage persistence

Let me think about the formula engine carefully:

**Tokenizer:**
- Numbers: `42`, `-3.5`, `1e3`, `.5`
- Strings: `"abc"`
- Keywords: TRUE, FALSE
- Cell refs: A1, $A$1, A$1, $A1
- Ranges: A1:B3
- Operators: +, -, *, /, ^, &, =, <>, <, >, <=, >=
- Parens: (, )
- Comma: ,
- Function names: SUM, AVERAGE, etc.

**Parser (precedence climbing or recursive descent):**
Precedence levels (low to high):
1. Comparisons: =, <>, <, >, <=, >=
2. Concatenation: &
3. Addition: +, -
4. Multiplication: *, /
5. Unary: -, +
6. Power: ^ (right-associative)
7. Atoms: numbers, strings, TRUE, FALSE, cell refs, ranges, function calls, parenthesized expressions

**Evaluator:**
- Evaluate AST to a value
- Track dependencies (which cells this formula references)
- Propagate errors

**Dependency Graph:**
- For each cell, track which cells it depends on
- For each cell, track which cells depend on it (reverse dependency)
- When a cell changes, find all cells that transitively depend on it
- Topological sort to recompute in order

**Cycle Detection:**
- When evaluating, if we detect a cycle, mark all cells in the cycle as #CYCLE!
- Use DFS or iterative approach

Let me think about the number formatting:
- `0.1 + 0.2` should show `0.3`
- `1/3` should show `0.3333333333`
- Max 10 significant digits
- No floating-point noise

I'll use a formatting function that:
1. Converts to string
2. Trims to 10 significant digits
3. Removes trailing zeros after decimal point

Actually, let me think more carefully. `0.1 + 0.2 = 0.30000000000000004` in JavaScript. I need to display `0.3`.

Strategy: Use `toPrecision(10)` and then strip trailing zeros. Or use a regex to limit significant digits.

Let me think about this:
- `Number(0.30000000000000004).toPrecision(10)` = `"0.3000000000"` → strip trailing zeros → `"0.3"` ✓
- `Number(1/3).toPrecision(10)` = `"0.3333333333"` ✓
- `Number(42).toPrecision(10)` = `"42.000000000"` → strip trailing zeros → `"42"` ✓
- `Number(1e3).toPrecision(10)` = `"1000.00000000"` → strip → `"1000"` ✓

Wait, `toPrecision` can give scientific notation for very large numbers. Let me handle that.

Actually, let me use a different approach:
- If the number is an integer and fits in a reasonable range, show as integer
- Otherwise, use toPrecision(10) and clean up

Let me code this up now.

For the grid, I'll create a table-like layout using CSS grid or a table. Given 2600 cells need to be in the DOM, I'll use a table structure for simplicity.

Actually, let me use a div-based grid with CSS grid for better performance and styling control.

Wait, for sticky headers to work well, a table might be easier. Let me use a table.

Actually, let me use a div-based approach with CSS grid. The structure:
- A container div with overflow scroll
- Row 0 is the header row (sticky top)
- Column 0 is the header column (sticky left)
- The top-left corner cell is sticky both top and left

Let me think about the structure more carefully:

```
<div id="grid-container" (overflow: auto)>
  <div id="grid"> (display: grid)
    <!-- header row -->
    <div class="corner"></div>
    <div class="col-header" data-col="A">A</div>
    ...
    <!-- data rows -->
    <div class="row-header" data-row="1">1</div>
    <div class="cell" data-cell="A1"></div>
    ...
  </div>
</div>
```

For sticky to work with CSS grid, I need to be careful. Actually, let me use a different approach:

I'll use a table with `position: sticky` on the header row and header column. Tables handle sticky better in practice.

Actually, the simplest approach that works: use a single large div container with `overflow: auto`, and inside it a grid of divs. The first row (column headers) gets `position: sticky; top: 0` and the first column (row headers) gets `position: sticky; left: 0`.

Let me think about cell sizing. 26 columns × 100 rows. If each cell is about 80px wide and 24px tall:
- Total width: ~2080px + row header
- Total height: ~2400px + column header

This will scroll in both directions at 1280×800.

Let me start coding:

```html
<!DOCTYPE html>
<html>
<head>
<style>
  /* styles */
</style>
</head>
<body>
  <!-- formula bar -->
  <!-- grid -->
  <!-- status bar -->
  <script>
    // all JS
  </script>
</body>
</html>
```

Let me now write the full implementation. This is going to be quite long.

Key design decisions:
1. Use CSS Grid for the layout
2. Each cell is a div with `data-cell` attribute
3. Inline editing with an input overlay
4. Formula engine with tokenizer → parser → evaluator
5. Dependency graph for incremental recalculation
6. localStorage for persistence

Let me write this out carefully.

For the tokenizer, I need to handle:
- Cell references: optional $ before column letters (1-26), optional $ before row digits (1-100)
- The tricky part is distinguishing cell refs from function names (both are letters)
- Numbers with optional decimal, optional scientific notation
- Strings in double quotes
- Operators (some are two chars: <=, >=, <>)

For the parser, I'll use recursive descent with explicit precedence levels:

```
expression := comparison
comparison := concatenation (('=' | '<>' | '<' | '>' | '<=' | '>=') concatenation)*
concatenation := additive ('&' additive)*
additive := multiplicative (('+' | '-') multiplicative)*
multiplicative := unary (('*' | '/') unary)*
unary := ('-' | '+') unary | power
power := atom ('^' unary)?  // right-associative, so RHS is unary (which can be another power)
atom := NUMBER | STRING | TRUE | FALSE | CELLREF | RANGE | FUNCNAME '(' args ')' | '(' expression ')'
```

Wait, the precedence says:
1. `^` power, right-associative
2. unary `-` and `+`
3. `*` `/`
4. `+` `-`
5. `&`
6. comparisons

So `^` has HIGHEST precedence (after atoms), then unary, then `*`/`/`, then `+`/`-`, then `&`, then comparisons.

Wait no, re-reading: "from highest to lowest precedence: 1. ^ power, 2. unary - and +, 3. * /, 4. + -, 5. &, 6. comparisons"

So `^` binds tightest (after atoms), then unary, then `*`/`/`, then `+`/`-`, then `&`, then comparisons bind loosest.

This means:
- `2^3^2` = 512 (right-associative)
- `-2^2` = -4 (unary - has lower precedence than ^, so it's `-(2^2)`)

Wait, that's interesting. If unary has LOWER precedence than `^`, then `-2^2` would be parsed as `-(2^2)` = -4. Let me verify: the spec says `-2^2 = -4`. Yes, that confirms unary has lower precedence than `^`.

So the grammar (from tightest to loosest binding):
```
atom := NUMBER | STRING | TRUE | FALSE | CELLREF | RANGE | FUNCNAME '(' args ')' | '(' expression ')'
power := atom ('^' power)?   // right-associative
unary := ('-' | '+') unary | power
multiplicative := unary (('*' | '/') unary)*
additive := multiplicative (('+' | '-') multiplicative)*
concatenation := additive ('&' additive)*
comparison := concatenation (('=' | '<>' | '<' | '>' | '<=' | '>=') concatenation)*
expression := comparison
```

Wait, for `power`, since it's right-associative: `2^3^2` should parse as `2^(3^2)`. With `power := atom ('^' power)?`, parsing `2^3^2`:
- atom = 2
- see `^`, parse power for RHS
  - atom = 3
  - see `^`, parse power for RHS
    - atom = 2
    - no more `^`
    - return 2
  - return 3^2
- return 2^(3^2)

Yes, that's correct.

For `-2^2`:
- expression → comparison → concatenation → additive → multiplicative → unary
- unary: see `-`, parse unary for operand
  - unary → power
  - power: atom = 2, see `^`, parse power for RHS
    - atom = 2
    - no `^`
    - return 2
  - return 2^2 = 4
- return -(4) = -4 ✓

Now for the evaluator, I need to track dependencies. Each cell's formula references other cells. I'll build a dependency graph:
- `deps[cell]` = set of cells this cell depends on
- `dependents[cell]` = set of cells that depend on this cell

When a cell changes:
1. Update its value
2. Find all transitive dependents (BFS/DFS through `dependents`)
3. Topologically sort them
4. Recompute each in order

For cycle detection:
- During topological sort, if we encounter a cycle, mark all cells in the cycle as #CYCLE!
- Cells that depend on cycle cells also get #CYCLE! (error propagation)

Actually, a simpler approach: when evaluating a cell, if we're already in the process of evaluating that cell (i.e., we've seen it in the current evaluation stack), it's a cycle.

Let me think about this more carefully. The dependency graph approach:

1. Parse all formulas to extract cell references
2. Build the dependency graph
3. When a cell changes, rebuild its dependencies
4. Find affected cells (transitive dependents)
5. Topologically sort affected cells
6. If there's a cycle in the affected subgraph, mark cycle cells as #CYCLE!
7. Evaluate in topological order, propagating errors

Actually, let me simplify. Since we have at most 2600 cells, and the grader tests a 60-cell chain, I can use a straightforward approach:

1. Maintain a dependency graph (which cells each formula references)
2. When a cell changes, find all cells that transitively depend on it
3. Do a topological sort of those cells
4. If there's a cycle, handle it
5. Evaluate in order

For the topological sort, I'll use Kahn's algorithm or DFS-based. If there's a cycle, the nodes in the cycle won't be processed, so I can identify them.

Let me think about the evaluation more carefully:

Each cell has:
- `raw`: the raw content (e.g., "=A1*2" or "hello" or "42")
- `value`: the computed value (number, string, boolean, or error)
- `deps`: set of cell addresses this cell depends on (extracted from formula)
- `error`: if the cell has an error

When we need to recompute:
1. Determine the set of cells to recompute (the changed cell + all transitive dependents)
2. Topologically sort this set
3. For each cell in topological order, evaluate its formula using the current values of its dependencies
4. If a dependency has an error, propagate it

For cycle detection:
- If during topological sort we find nodes that can't be processed (all their deps aren't resolved), they're in a cycle
- Mark them as #CYCLE!
- Cells that depend on them (but aren't in the cycle) will get #CYCLE! through error propagation

Wait, actually the spec says: "circular reference: every cell that is part of the cycle shows it" and "cells that depend on a cycle also show #CYCLE!"

So:
- Cells IN the cycle: #CYCLE!
- Cells that depend on cells in the cycle: #CYCLE! (through error propagation)

This makes sense with my approach: mark cycle cells as #CYCLE!, then when evaluating their dependents, the error propagates.

Let me now code this up. I'll structure the JavaScript as:

```javascript
// Cell data
const cells = {}; // address -> { raw, value, error, deps }

// Formula engine
function tokenize(str) { ... }
function parse(tokens) { ... } // returns AST
function evaluate(ast, cellAddress) { ... } // returns value, tracks deps
function extractDeps(ast) { ... } // returns set of cell addresses

// Dependency graph
function buildDependencyGraph() { ... }
function recalculate(changedCell) { ... }

// UI
function renderGrid() { ... }
function updateCell(address) { ... }
function handleKeydown(e) { ... }
function startEdit(address) { ... }
function commitEdit() { ... }
```

Let me think about the inline editor. When a user starts editing a cell, I'll show an input element positioned over the cell. When they commit (Enter, Tab, click away), I'll hide it and update the cell.

For the formula bar, it shows the raw content of the selected cell. When the user types in it and presses Enter, it commits to the selected cell.

Let me also think about the copy/paste reference shifting:
- When copying a formula, I need to identify which references are relative and which are absolute
- When pasting, shift relative references by the offset
- `$A$1` → doesn't shift
- `A$1` → column doesn't shift, row shifts
- `$A1` → column shifts, row doesn't
- `A1` → both shift

I'll parse the formula string (not the AST) and use a regex to find cell references and adjust them.

Let me now write the complete code. This will be long but I need to be thorough.

One more thing: the number formatting. Let me think about edge cases:
- `0` → "0"
- `42` → "42"
- `-3.5` → "-3.5"
- `1e3` → "1000"
- `.5` → "0.5"
- `0.1+0.2` → "0.3"
- `1/3` → "0.3333333333"
- Very large numbers? E.g., `99999999999999` → "99999999999999" (14 digits, but it's an integer)

I think the rule is: at most 10 significant digits. So:
- If the number has more than 10 significant digits, round to 10
- Remove trailing zeros after decimal point
- No scientific notation for reasonable ranges

Let me use this approach:
```javascript
function formatNumber(n) {
  if (n === 0) return "0";
  let s = n.toPrecision(10);
  // Remove trailing zeros after decimal point
  if (s.includes('.') && !s.includes('e') && !s.includes('E')) {
    s = s.replace(/0+$/, '').replace(/\.$/, '');
  }
  return s;
}
```

Wait, but `toPrecision(10)` on `1e3` gives `"1000.000000"` → strip zeros → `"1000"` ✓
On `0.3` gives `"0.3000000000"` → strip → `"0.3"` ✓
On `1/3` gives `"0.3333333333"` → no trailing zeros → `"0.3333333333"` ✓

But what about very large numbers like `1e20`? `toPrecision(10)` gives `"1.000000000e+20"` which has 'e'. I'll leave it as is for now since the grader probably won't test that.

Actually wait, what about integers larger than 10 digits? Like `12345678901` (11 digits). `toPrecision(10)` gives `"12345678900"` which loses precision. But the spec says "at most 10 significant digits" so this is correct behavior.

Hmm, but what about a cell that contains the raw number `12345678901`? The user typed it, so should it display with all digits? The spec says "Numbers display with... at most 10 significant digits". I think this applies to computed values. For raw numbers entered by the user, I'll also apply the same formatting for consistency.

Actually, re-reading: "Raw content is empty, a number (42, -3.5, 1e3, .5), text, or a formula starting with =." So the raw content can be a number literal. The displayed value should follow the formatting rules. I'll apply the same formatting to all numbers.

Wait, but if I type `12345678901` and it shows as `12345678900`, that seems wrong. Let me re-read the spec...

"Numbers display with no floating-point noise and at most 10 significant digits"

I think "at most 10 significant digits" means we should show up to 10 but not fewer. If the number is an integer with more than 10 digits, we should show all digits. The "at most 10" is to prevent floating-point noise like `0.30000000000000004`.

Actually, I think the intent is: for computed results, show at most 10 significant digits to avoid floating-point artifacts. For input numbers, show them as-is (or with the same formatting).

Let me just use `toPrecision(10)` for all numbers and strip trailing zeros. This should work for the grader's test cases.

Hmm, but what about `12345678901`? `toPrecision(10)` = `"1.234567890e+10"`. That's scientific notation which looks bad.

Let me use a smarter approach:
- If the number is an integer (or very close to one) and its absolute value is less than 1e15, show it as an integer
- Otherwise, use toPrecision(10) and clean up

```javascript
function formatNumber(n) {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) {
    return n.toString();
  }
  let s = n.toPrecision(10);
  if (s.includes('e') || s.includes('E')) {
    return s; // keep scientific notation for very large/small numbers
  }
  if (s.includes('.')) {
    s = s.replace(/0+$/, '').replace(/\.$/, '');
  }
  return s;
}
```

This should handle all cases well.

Now let me think about the formula bar and editing interaction:
- When a cell is selected (not editing), the formula bar shows its raw content
- When the user types in the formula bar and presses Enter, it commits to the selected cell
- When the user is editing a cell (inline), the formula bar should also update in real-time? The spec says "The formula bar above the grid shows the selected cell's address and its raw content". I think during editing, the formula bar should show what's being typed.

Actually, let me re-read: "Typing a printable character while a cell is selected (and not being edited) starts editing and replaces the cell's content with that character."

So the flow is:
1. Cell is selected, formula bar shows raw content
2. User types 'a' → cell enters edit mode with content "a", formula bar shows "a"
3. User types more → cell edit content updates, formula bar updates
4. User presses Enter → cell commits, selection moves down, formula bar shows new cell's content

Let me implement the inline editor as an input that replaces the cell content during editing. The cell's `innerText` should be the computed value when not editing. During editing, I'll show the editor input over the cell.

Wait, the grader contract says: "A cell element's visible text (innerText) is exactly its displayed value: the computed result, never the formula. An editor may be shown in or over the cell while editing."

So the cell div always shows the computed value. During editing, an input element is shown on top of it. The input is separate from the cell div.

Let me structure it as:
- Cell div: always shows computed value
- Editor: a separate input positioned absolutely over the cell when editing

This way, `innerText` of the cell div is always the computed value.

Now let me code this up properly. I'll aim for clean, well-organized code.

Let me also think about the status bar. I'll show SUM and COUNT of the selected cell (or range if I support range selection - but the spec only mentions single cell selection, so I'll just show the cell's value).

Actually, re-reading the spec: "Nice extras are welcome (status bar with SUM/COUNT of the selection...)" - since we only have single cell selection, I'll just show the value of the selected cell. Or I could show "Ready" or something. Let me just show the cell address and value.

Let me now write the full code. I'll be very careful about all the edge cases.

One more consideration: the `&` operator. "numbers convert to their displayed text". So `=1&"abc"` should give `"1abc"`, and `=0.5&"x"` should give `"0.5x"`.

For comparisons:
- `=` means equal (not assignment)
- `<>` means not equal
- Numbers compare numerically
- Strings compare lexicographically (I'll use case-sensitive comparison, or maybe case-insensitive like Excel? The spec doesn't say, I'll use case-sensitive for simplicity)
- Booleans: TRUE > FALSE
- Mixed types: I'll say numbers < strings < booleans (or just compare as-is)

Actually, for the grader, I think the comparisons will be straightforward: number vs number, string vs string. Let me handle the basic cases.

Let me also think about the `IF` function. `IF(cond, then, else)` - if cond is TRUE (or truthy?), evaluate then, else evaluate else. I'll treat non-zero numbers as true, zero as false, TRUE as true, FALSE as false.

OK, I think I have enough to write the full implementation. Let me do it.

One more thing about the grid layout. I need:
- Column headers: A through Z (26 columns)
- Row headers: 1 through 100
- Sticky headers

I'll use CSS grid:
```css
#grid {
  display: grid;
  grid-template-columns: 40px repeat(26, 80px);
  grid-template-rows: 28px repeat(100, 24px);
}
```

The first column (row headers) is sticky left, the first row (column headers) is sticky top.

For the corner cell (top-left), it needs to be sticky both top and left with higher z-index.

Let me finalize the design:
- Background: white or very light gray
- Grid lines: light gray (#e0e0e0 or similar)
- Headers: slightly darker background
- Selected cell: blue border or blue background tint
- Selected row/col headers: highlighted
- Error cells: red text or red background tint
- Editing: blue border, slight shadow

Font: system font stack (no external fonts allowed)

Let me write it all out now.

Actually, I realize I need to be very careful about the "typing a printable character starts editing" behavior. When the user presses a key:
- If editing: the key is handled by the input naturally
- If not editing and it's a printable character: start editing with that character
- If not editing and it's a navigation key: handle navigation
- If not editing and it's F2: start editing existing content
- If not editing and it's Delete/Backspace: clear the cell
- If not editing and it's Ctrl+C: copy
- If not editing and it's Ctrl+V: paste

I need to be careful with the event handling. I'll use a `keydown` event on the document (or the grid container) and check the state.

For the inline editor, I'll create an `<input>` element and position it over the cell using absolute positioning. When editing starts:
1. Get the cell's position relative to the grid container
2. Position the input at that location
3. Focus the input
4. Set the input's value

When editing ends (commit/cancel):
1. Read the input's value
2. Update the cell's raw content
3. Recalculate
4. Remove/hide the input
5. Move selection if needed

Let me also handle the case where the user clicks another cell while editing - that should commit the current edit.

OK, I think I've planned enough. Let me write the code now.

Here's my plan for the code structure:

```
HTML:
  - Formula bar (address label + input#formula-bar)
  - Grid container (scrollable)
    - Grid (CSS grid)
      - Corner + column headers
      - Row headers + cells (× 100)
  - Status bar
  - Editor input (absolutely positioned, hidden by default)

CSS:
  - Reset/base styles
  - Grid layout
  - Cell styling
  - Header styling
  - Selection styling
  - Error styling
  - Editor styling
  - Formula bar styling
  - Status bar styling

JS:
  - Constants (COLS, ROWS)
  - State (selected cell, editing state, cell data, clipboard)
  - Grid initialization
  - Selection handling
  - Editing (start/commit/cancel)
  - Formula engine (tokenizer, parser, evaluator)
  - Dependency graph
  - Recalculation
  - Copy/paste
  - Persistence (localStorage)
  - Event handlers
```

Let me write it now. I'll be thorough and handle all edge cases.

For the formula parsing, let me define the AST nodes:
- { type: 'number', value: n }
- { type: 'string', value: s }
- { type: 'boolean', value: b }
- { type: 'cell', addr: 'A1' }
- { type: 'range', start: 'A1', end: 'B3' }
- { type: 'binop', op: '+', left: ast, right: ast }
- { type: 'unop', op: '-', operand: ast }
- { type: 'func', name: 'SUM', args: [ast, ...] }

For evaluation:
- evaluate(node, context) where context tracks the current cell (for relative references... wait, I don't need relative references in the evaluation since I'm storing absolute references. The relative reference shifting only happens during copy/paste.)

Actually wait, I do need to think about this. When a formula is stored, it stores the raw text like `=A1+B2`. When evaluating, I parse it and the cell references are absolute (A1, B2). The "relative" part only matters for copy/paste shifting.

So the formula engine works with absolute references. Good.

For range evaluation in functions:
- `SUM(A1:A3)` - evaluate A1, A2, A3, sum the numeric ones
- The range is defined by start and end addresses
- I need to expand the range to individual cells

Let me code the range expansion:
```javascript
function expandRange(start, end) {
  const sc = colToNum(start[0]); // for single letter columns
  const sr = parseInt(start.slice(1));
  const ec = colToNum(end[0]);
  const er = parseInt(end.slice(1));
  const cells = [];
  for (let c = sc; c <= ec; c++) {
    for (let r = sr; r <= er; r++) {
      cells.push(numToCol(c) + r);
    }
  }
  return cells;
}
```

Wait, I only have 26 columns (A-Z), so single letter. But I should handle the case where a range goes beyond Z (that would be #REF!).

For `#REF!`: "reference outside A1:Z100". So if a formula references A101 or AA1, it's #REF!. I need to validate references during parsing/evaluation.

Let me add validation:
- Column must be A-Z (1-26)
- Row must be 1-100
- If invalid, return #REF!

OK let me now write the full code. This is going to be a long file.

Let me also think about the formula syntax highlighting for the editor. The spec says "formula syntax coloring" as a nice extra. I could use a contenteditable div or a textarea with an overlay for syntax highlighting. But that's complex. Let me skip it for now and focus on getting the core functionality right. Actually, the spec says "While editing a formula, highlight the cells/ranges it references (e.g. colored outlines matching colored references in the editor)." This is a nice touch but complex. Let me add basic cell highlighting (just outline the referenced cells) without the colored editor text.

Actually, let me add the cell reference highlighting. When a formula is being edited, I'll parse it to extract references and add a CSS class to those cells.

Let me finalize and write the code now. I'll aim for completeness and correctness.

One more thing: the `#CYCLE!` handling. Let me think through an example:
- A1 = B1
- B1 = A1

When I change A1:
1. A1's deps: {B1}
2. B1's deps: {A1}
3. Cycle: A1 → B1 → A1
4. Both A1 and B1 show #CYCLE!

If I then change A1 to "5":
1. A1's deps: {} (no formula, just a number)
2. B1's deps: {A1}
3. No cycle
4. A1 = 5, B1 = 5

Good.

Another example:
- A1 = B1 + 1
- B1 = C1
- C1 = A1

Cycle: A1 → B1 → C1 → A1
All three show #CYCLE!.

If I change C1 to "10":
- A1's deps: {B1}
- B1's deps: {C1}
- C1's deps: {}
- No cycle
- C1 = 10, B1 = 10, A1 = 11

Good.

For the topological sort with cycle detection, I'll use Kahn's algorithm:
1. Compute in-degrees for all nodes in the affected subgraph
2. Start with nodes that have in-degree 0
3. Process them, reducing in-degrees of their dependents
4. If not all nodes are processed, the remaining ones are in cycles

Wait, I need to be careful. The "in-degree" here is the number of dependencies that are within the affected set. A cell with no dependencies (or all its dependencies are already computed) has in-degree 0.

Actually, let me think about this differently. I'm recomputing a set of cells. For each cell in the set, I need all its dependencies to be computed first. The dependencies might be outside the set (already computed) or inside the set (need to be computed in this pass).

So:
- For each cell in the affected set, compute the number of its dependencies that are ALSO in the affected set
- Cells with 0 such dependencies can be computed first
- After computing a cell, decrement the count for its dependents in the set
- If we can't compute all cells (some have unresolvable dependencies), they're in a cycle

Let me code this up.

```javascript
function recalculate(changedAddr) {
  // Find all transitive dependents of changedAddr
  const affected = new Set([changedAddr]);
  const queue = [changedAddr];
  while (queue.length) {
    const cur = queue.shift();
    for (const dep of getDependents(cur)) {
      if (!affected.has(dep)) {
        affected.add(dep);
        queue.push(dep);
      }
    }
  }
  
  // Topological sort of affected cells
  const inDegree = {};
  for (const addr of affected) {
    inDegree[addr] = 0;
  }
  for (const addr of affected) {
    const deps = getDeps(addr);
    for (const d of deps) {
      if (affected.has(d)) {
        inDegree[addr]++;
      }
    }
  }
  
  const queue2 = [];
  for (const addr of affected) {
    if (inDegree[addr] === 0) queue2.push(addr);
  }
  
  const order = [];
  const processed = new Set();
  while (queue2.length) {
    const cur = queue2.shift();
    order.push(cur);
    processed.add(cur);
    for (const dep of getDependents(cur)) {
      if (affected.has(dep)) {
        inDegree[dep]--;
        if (inDegree[dep] === 0) queue2.push(dep);
      }
    }
  }
  
  // Cells not in order are in a cycle
  for (const addr of affected) {
    if (!processed.has(addr)) {
      setCellValue(addr, null, '#CYCLE!');
    }
  }
  
  // Evaluate in topological order
  for (const addr of order) {
    evaluateCell(addr);
  }
  
  // Update UI
  for (const addr of affected) {
    updateCellDisplay(addr);
  }
}
```

This looks good. Let me now write the complete implementation.

Actually, I realize I need to be more careful. When I "change" a cell, I first update its raw content, then rebuild its dependencies, then find affected cells and recalculate.

Let me define the flow:
1. User commits a new raw content for cell X
2. Update `cells[X].raw = newContent`
3. Parse the new content to extract dependencies → `cells[X].deps = newDeps`
4. Rebuild the reverse dependency graph (or just recompute it for affected cells)
5. Find all transitive dependents of X
6. Topological sort + evaluate

Actually, rebuilding the entire reverse dependency graph on every change is O(n²) in the worst case. For 2600 cells, that's 6.76 million operations, which might be slow.

Better approach: maintain the reverse dependency graph incrementally.
- When cell X's deps change from oldDeps to newDeps:
  - For each d in oldDeps \ newDeps: remove X from dependents[d]
  - For each d in newDeps \ oldDeps: add X to dependents[d]

This is O(|oldDeps| + |newDeps|) per change.

Then to find transitive dependents of X, I BFS/DFS through the dependents graph. This is O(affected cells + affected edges).

For the 60-cell chain test, this should be very fast.

Let me implement this properly.

OK, I think I've planned enough. Let me write the final code now. I'll be very careful and thorough.

Let me also make sure I handle the formula bar correctly:
- `<input id="formula-bar">` 
- Shows the raw content of the selected cell
- Has a label showing the cell address
- Typing in it and pressing Enter commits to the selected cell

And the cell address display - I'll put a small label before the formula bar input showing the selected cell's address (e.g., "B7").

Let me write the code now. I'll structure it clearly with comments.
