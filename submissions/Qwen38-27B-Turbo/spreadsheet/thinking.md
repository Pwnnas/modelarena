This is a complex task. I need to build a complete spreadsheet application in a single HTML file. Let me break down what I need to build:

1. **Grid UI**: 26 columns (A-Z) × 100 rows (1-100), sticky headers
2. **Formula Engine**: Tokenizer, parser, evaluator, dependency graph
3. **Cell Management**: Edit states, selection, formula bar
4. **Persistence**: localStorage
5. **Copy/Paste**: With reference shifting
6. **Error Handling**: Specific error codes
7. **Polish**: Good visual design

Let me start building this step by step.

### Architecture

**Tokenizer**: Break formula string into tokens (numbers, strings, identifiers, operators, parentheses, commas, colons)

**Parser**: Build AST from tokens using recursive descent with proper precedence

**Evaluator**: Evaluate AST, handling cell references, ranges, functions

**Dependency Graph**: Track which cells depend on which, for incremental recalculation

**Cell State**: Each cell has raw content, computed value, display value, error state

Let me code this:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Gridcalc</title>
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

Let me think about the formula engine carefully.

### Token Types
- NUMBER: 42, -3.5, 1e3, .5
- STRING: "abc"
- IDENT: A1, SUM, TRUE, FALSE
- OP: +, -, *, /, ^, &, =, <>, <, >, <=, >=
- PAREN: (, )
- COMMA: ,
- COLON: :

### Tokenizer
Need to handle:
- Multi-character operators: <>, <=, >=
- Numbers with scientific notation
- Strings with escaped quotes? (spec doesn't mention, keep simple)
- Identifiers that are cell references vs function names vs literals

### Parser Precedence
1. ^ (right-associative)
2. unary +/- 
3. * /
4. + -
5. &
6. comparisons (=, <>, <, >, <=, >=)

Wait, the spec says comparisons are lowest. Let me re-read:
- `^` power, right-associative
- unary `-` and `+`
- `*` `/`
- `+` `-`
- `&` text concatenation
- comparisons `=` `<>` `<` `>` `<=` `>=`

So comparisons are lowest precedence. That means `1 + 2 = 3` parses as `(1+2) = 3` which is `TRUE`. And `1 & 2 < 3` parses as `(1 & 2) < 3` = `"12" < 3`. Hmm, comparing string to number... In spreadsheets that's usually an error or type coercion. Let me check the spec... it doesn't specify cross-type comparison behavior explicitly. I'll do type coercion: if either side is a string, convert both to strings. If both are numbers, numeric comparison. If both booleans, treat as 0/1.

Actually, let me think about this more carefully. The spec says comparisons result in TRUE/FALSE. For `="abc"*2` it should be #VALUE!. So text used in arithmetic is an error. But for comparisons, `"abc" < "def"` makes sense as string comparison. And `5 < 10` as numeric. What about `5 < "10"`? In Excel, that converts the string to number and does numeric comparison. Let me follow that: if both can be numbers, do numeric; otherwise string comparison.

Actually, let's keep it simpler and more predictable:
- If both are numbers: numeric comparison
- If both are strings: string comparison
- If one is number, one is string: #VALUE!
- Booleans convert to 1/0 for comparison

Hmm, but the spec says "comparisons result in TRUE/FALSE" without much detail. Let me be pragmatic:
- Numbers: numeric comparison
- Strings: string comparison
- Mixed types: #VALUE! (consistent with arithmetic behavior)
- Booleans: convert to numbers (TRUE=1, FALSE=0) for comparison

### Functions
- SUM(range/expression list): sum numeric values
- AVERAGE: mean of numeric values
- MIN: minimum
- MAX: maximum
- COUNT: count numeric values only
- IF(cond, then, else): conditional
- ABS(x): absolute value
- ROUND(x, digits): round to N decimal places

For range functions (SUM, AVERAGE, MIN, MAX, COUNT):
- Empty cells are treated as 0 in arithmetic, but "Range functions ignore empty and text cells"
- So SUM ignores empty and text, AVERAGE ignores empty and text, etc.
- But IF can take any expression

### Cell Reference Shifting for Copy/Paste
`=A1+$B$1` copied from C1 to C2:
- A1 → A2 (relative, shifted down 1)
- $B$1 → $B$1 (absolute, no shift)
- Result: `=A2+$B$1`

Need to parse references and track their absolute/relative parts.

### Dependency Graph and Cycle Detection
When evaluating cell X:
1. Find all cell references in X's formula
2. Evaluate those cells first (recursively)
3. Detect cycles using a "currently evaluating" set

For incremental recalc:
- Build reverse dependency graph (who depends on whom)
- When cell changes, find all dependents and re-evaluate in topological order

Actually, simpler approach: when a cell changes, re-evaluate all cells that depend on it. Use DFS to find all dependents, topological sort, then evaluate.

Or even simpler for correctness: when any cell changes, re-evaluate the entire sheet. But that might be slow for the grader's performance test. The spec says "changing the head of a 60-cell dependency chain must update the whole chain in well under 100 ms." Full recalc of 2600 cells should still be fast enough, but let's do incremental to be safe.

Let me use this approach:
1. Maintain `dependsOn[cell]` = list of cells that cell depends on (computed when cell is evaluated)
2. Maintain `dependents[cell]` = list of cells that depend on this cell (reverse of above)
3. When cell X changes:
   a. Clear X's value
   b. Do BFS/DFS from X through `dependents` to find all cells to re-evaluate
   c. Topologically sort those cells
   d. Evaluate them in order

For cycle detection: during evaluation, track the "evaluation stack." If we're evaluating cell X and encounter a reference to cell Y which is on the evaluation stack, we have a cycle.

### Error Propagation
If a cell evaluates to an error, any cell that depends on it should show the same error. This happens naturally if we check for errors when reading cell values.

### Number Formatting
- No floating-point noise: `0.1+0.2` should show `0.3`
- At most 10 significant digits
- No thousands separators

For `0.1+0.2`, in IEEE 754 that's `0.30000000000000004`. To display as `0.3`, I need to round to a reasonable number of decimal places. The spec says "at most 10 significant digits." So `0.30000000000000004` → `0.3` (1 sig fig), `1/3` → `0.3333333333` (10 sig figs).

Algorithm:
1. Compute the value
2. If it's an integer (or very close), display as integer
3. Otherwise, display with up to 10 significant digits, trimming trailing zeros

Actually, a simpler approach: use `toPrecision(10)` which gives 10 significant digits, then convert to number and back to string to remove trailing zeros. But `toPrecision` uses exponential notation for large/small numbers. Let me handle this carefully.

```javascript
function formatNumber(n) {
    if (typeof n !== 'number' || isNaN(n)) return String(n);
    if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
    // Round to 10 significant digits
    const s = n.toPrecision(10);
    // Convert back to number to remove trailing zeros, then to string
    // But be careful with exponential notation
    if (s.includes('e') || s.includes('E')) {
        return s; // Keep exponential for very large/small
    }
    // Remove trailing zeros
    return String(parseFloat(s));
}
```

Wait, `parseFloat("0.3000000000")` gives `0.3`, and `String(0.3)` gives `"0.3"`. Good.
`parseFloat("0.3333333333")` gives `0.3333333333`, `String` gives `"0.3333333333"`. Good.

But what about `10000000000` (10^10)? `toPrecision(10)` gives `"10000000000"`. `parseFloat` gives `10000000000`. `String` gives `"10000000000"`. Good.

What about `123456789.012345`? `toPrecision(10)` gives `"123456789.0"` (10 sig figs). `parseFloat` gives `123456789`. `String` gives `"123456789"`. Good.

What about `1.5`? `toPrecision(10)` gives `"1.500000000"`. `parseFloat` gives `1.5`. `String` gives `"1.5"`. Good.

What about negative zero? `-0` should probably show as `0`. `String(-0)` gives `"-0"`. Let me handle that: if value is 0, show `0`.

```javascript
function formatNumber(n) {
    if (typeof n !== 'number') return String(n);
    if (n === 0) return "0";
    if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
    const s = n.toPrecision(10);
    if (s.includes('e') || s.includes('E')) return s;
    return String(parseFloat(s));
}
```

### Cell Types
Each cell has:
- `raw`: string (the formula or value entered)
- `type`: 'empty' | 'number' | 'string' | 'bool' | 'formula' | 'error'
- `value`: computed value (number, string, bool, or error code)
- `display`: string (what to show)

When user types `42`, raw="42", type="number", value=42, display="42"
When user types `=1+2`, raw="=1+2", type="formula", value=3, display="3"
When formula errors, type="error", value="#DIV/0!", display="#DIV/0!"

### DOM Structure

```html
<div id="app">
    <div id="toolbar">
        <span id="cell-address">A1</span>
        <input id="formula-bar" />
    </div>
    <div id="grid-container">
        <div id="grid">
            <!-- Row 0: column headers -->
            <div class="row header-row">
                <div class="cell corner"></div>
                <div class="cell col-header">A</div>
                ...
            </div>
            <!-- Rows 1-100 -->
            <div class="row">
                <div class="cell row-header">1</div>
                <div class="cell" data-cell="A1"></div>
                ...
            </div>
            ...
        </div>
    </div>
</div>
```

Actually, using a CSS Grid for the whole thing might be cleaner. Let me think...

The grid needs to be scrollable with sticky headers. CSS Grid with `position: sticky` on header row and first column should work.

Let me use a table-like structure with divs. Each row is a flex row, headers are sticky.

Actually, for 2600 cells, a simple approach is to use CSS Grid for layout:

```css
#grid {
    display: grid;
    grid-template-columns: 40px repeat(26, 100px);
    grid-template-rows: 25px repeat(100, 25px);
    height: 100%;
    overflow: auto;
}
```

Then position headers with sticky.

Let me write the full code now. This is going to be large.

I'll structure the JavaScript as:
1. Constants and state
2. Tokenizer
3. Parser (AST builder)
4. Evaluator
5. Cell management (dependency graph, recalculation)
6. UI (grid creation, event handlers, formula bar, editing)
7. Persistence (localStorage)
8. Copy/paste with reference shifting
9. Initialization

Let me start coding:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Gridcalc</title>
<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    color: #2c2c2c;
    overflow: hidden;
}

#app {
    display: flex;
    flex-direction: column;
    height: 100%;
}

#toolbar {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    border-bottom: 1px solid #d1d5db;
    background: #f9fafb;
    gap: 8px;
}

#cell-address {
    font-weight: 600;
    font-size: 12px;
    color: #6b7280;
    min-width: 40px;
}

#formula-bar {
    flex: 1;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    padding: 5px 8px;
    font-size: 13px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
}

#formula-bar:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

#grid-container {
    flex: 1;
    overflow: auto;
    position: relative;
}

#grid {
    display: grid;
    grid-template-columns: 48px repeat(26, 100px);
    grid-template-rows: 26px repeat(100, 26px);
    background: #fff;
}

.cell {
    display: flex;
    align-items: center;
    padding: 0 6px;
    border-right: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
    overflow: hidden;
    white-space: nowrap;
    cursor: cell;
    position: relative;
    user-select: none;
}

.cell:hover {
    background: #f3f4f6;
}

.cell.selected {
    background: #eff6ff;
    outline: 2px solid #3b82f6;
    outline-offset: -1px;
    z-index: 2;
}

.cell.editing {
    background: #fff;
    outline: 2px solid #1d4ed8;
    outline-offset: -1px;
    z-index: 3;
}

.cell input {
    width: 100%;
    border: none;
    outline: none;
    font-size: 13px;
    font-family: inherit;
    padding: 0;
    background: transparent;
}

.col-header, .row-header, .corner {
    background: #f9fafb;
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    cursor: default;
    justify-content: center;
    position: sticky;
    z-index: 5;
}

.col-header {
    top: 0;
    border-bottom: 2px solid #d1d5db;
}

.row-header {
    left: 0;
    border-right: 2px solid #d1d5db;
}

.corner {
    top: 0;
    left: 0;
    z-index: 6;
    border-right: 2px solid #d1d5db;
    border-bottom: 2px solid #d1d5db;
}

.col-header.selected, .row-header.selected {
    background: #dbeafe;
    color: #1d4ed8;
}

.cell.error {
    background: #fef2f2;
    color: #dc2626;
    font-size: 11px;
}

.cell.error::after {
    content: attr(data-error);
    position: absolute;
    top: 100%;
    left: 0;
    background: #1f2937;
    color: #fff;
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    z-index: 10;
    display: none;
}

.cell.error:hover::after {
    display: block;
}

.cell.number {
    justify-content: flex-end;
}

.cell.string {
    justify-content: flex-start;
}

.cell.bool {
    justify-content: flex-end;
    font-weight: 500;
}

/* Cell reference highlighting */
.cell.ref-highlight {
    box-shadow: inset 0 0 0 2px #fbbf24;
}

.cell.ref-highlight-2 {
    box-shadow: inset 0 0 0 2px #34d399;
}
</style>
</head>
<body>
<div id="app">
    <div id="toolbar">
        <span id="cell-address">A1</span>
        <input id="formula-bar" placeholder="Enter value or formula" />
    </div>
    <div id="grid-container">
        <div id="grid"></div>
    </div>
</div>

<script>
// Gridcalc Spreadsheet Engine

const COLS = 26;
const ROWS = 100;
const COL_NAMES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// State
let cells = {}; // Map from address -> { raw, type, value, display }
let selectedCell = "A1";
let editingCell = null;
let editingValue = "";
let clipboard = null;
let clipboardSource = null;

// DOM references
const gridEl = document.getElementById("grid");
const formulaBar = document.getElementById("formula-bar");
const cellAddressEl = document.getElementById("cell-address");

// Build grid
function buildGrid() {
    let html = "";
    
    // Corner
    html += '<div class="cell corner"></div>';
    
    // Column headers
    for (let c = 0; c < COLS; c++) {
        html += `<div class="cell col-header" data-col="${c}">${COL_NAMES[c]}</div>`;
    }
    
    // Rows
    for (let r = 1; r <= ROWS; r++) {
        html += `<div class="cell row-header" data-row="${r}">${r}</div>`;
        for (let c = 0; c < COLS; c++) {
            const addr = `${COL_NAMES[c]}${r}`;
            html += `<div class="cell" data-cell="${addr}"></div>`;
        }
    }
    
    gridEl.innerHTML = html;
}

// Address parsing
function colToIndex(colChar) {
    return colChar.charCodeAt(0) - 65;
}

function rowToIndex(rowStr) {
    return parseInt(rowStr) - 1;
}

function indexToCol(index) {
    return COL_NAMES[index];
}

function parseAddress(addr) {
    addr = addr.toUpperCase();
    const match = addr.match(/^(\$?)([A-Z])(\$?)(\d+)$/);
    if (!match) return null;
    return {
        col: colToIndex(match[2]),
        row: rowToIndex(match[4]),
        colAbsolute: match[1] === '$',
        rowAbsolute: match[3] === '$'
    };
}

function formatAddress(row, col, rowAbs, colAbs) {
    let addr = "";
    if (colAbs) addr += "$";
    addr += indexToCol(col);
    if (rowAbs) addr += "$";
    addr += row + 1;
    return addr;
}

function getCellElement(addr) {
    return document.querySelector(`[data-cell="${addr}"]`);
}

// Cell management
function getCell(addr) {
    if (!cells[addr]) {
        cells[addr] = { raw: "", type: "empty", value: null, display: "" };
    }
    return cells[addr];
}

function setCellRaw(addr, raw) {
    const cell = getCell(addr);
    cell.raw = raw.trim();
    evaluateCell(addr);
}

function evaluateCell(addr) {
    const cell = getCell(addr);
    const raw = cell.raw;
    
    if (raw === "") {
        cell.type = "empty";
        cell.value = null;
        cell.display = "";
        updateCellDisplay(addr);
        return cell;
    }
    
    // Try number
    if (/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(raw)) {
        const n = parseFloat(raw);
        cell.type = "number";
        cell.value = n;
        cell.display = formatNumber(n);
        updateCellDisplay(addr);
        return cell;
    }
    
    // Try boolean
    if (raw.toUpperCase() === "TRUE") {
        cell.type = "bool";
        cell.value = true;
        cell.display = "TRUE";
        updateCellDisplay(addr);
        return cell;
    }
    if (raw.toUpperCase() === "FALSE") {
        cell.type = "bool";
        cell.value = false;
        cell.display = "FALSE";
        updateCellDisplay(addr);
        return cell;
    }
    
    // Formula
    if (raw.startsWith("=")) {
        cell.type = "formula";
        try {
            const ast = parseFormula(raw.slice(1));
            const value = evalAst(ast, addr);
            cell.value = value;
            cell.display = formatValue(value);
        } catch (e) {
            cell.type = "error";
            cell.value = "#ERROR!";
            cell.display = "#ERROR!";
        }
        updateCellDisplay(addr);
        return cell;
    }
    
    // Plain text
    cell.type = "string";
    cell.value = raw;
    cell.display = raw;
    updateCellDisplay(addr);
    return cell;
}

function formatNumber(n) {
    if (typeof n !== 'number') return String(n);
    if (n === 0) return "0";
    if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
    const s = n.toPrecision(10);
    if (s.includes('e') || s.includes('E')) return s;
    return String(parseFloat(s));
}

function formatValue(value) {
    if (typeof value === 'number') return formatNumber(value);
    if (typeof value === 'boolean') return value ? "TRUE" : "FALSE";
    if (typeof value === 'string' && value.startsWith("#")) return value;
    return String(value);
}

function updateCellDisplay(addr) {
    const cell = getCell(addr);
    const el = getCellElement(addr);
    if (!el) return;
    
    el.textContent = cell.display;
    el.className = "cell";
    if (addr === selectedCell) el.classList.add("selected");
    if (addr === editingCell) el.classList.add("editing");
    
    if (cell.type === "number" || cell.type === "bool") {
        el.classList.add("number");
    } else if (cell.type === "string") {
        el.classList.add("string");
    }
    
    if (cell.type === "error") {
        el.classList.add("error");
        el.setAttribute("data-error", cell.display);
    } else {
        el.removeAttribute("data-error");
    }
}

// Update all cells display (for reload)
function updateAllCells() {
    for (const addr in cells) {
        updateCellDisplay(addr);
    }
}

// Selection
function selectCell(addr) {
    // Commit editing if active
    if (editingCell) {
        commitEdit();
    }
    
    const old = selectedCell;
    selectedCell = addr;
    
    // Update UI
    const oldEl = getCellElement(old);
    if (oldEl) oldEl.classList.remove("selected");
    const el = getCellElement(addr);
    if (el) {
        el.classList.add("selected");
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    
    // Update formula bar
    const cell = getCell(addr);
    formulaBar.value = cell.raw;
    cellAddressEl.textContent = addr;
    
    // Highlight headers
    document.querySelectorAll(".col-header.selected").forEach(h => h.classList.remove("selected"));
    document.querySelectorAll(".row-header.selected").forEach(h => h.classList.remove("selected"));
    const info = parseAddress(addr);
    if (info) {
        const colHeader = document.querySelector(`[data-col="${info.col}"]`);
        if (colHeader) colHeader.classList.add("selected");
        const rowHeader = document.querySelector(`[data-row="${info.row + 1}"]`);
        if (rowHeader) rowHeader.classList.add("selected");
    }
}

// Editing
function startEdit(addr, replace) {
    if (editingCell) {
        commitEdit();
    }
    
    const cell = getCell(addr);
    editingCell = addr;
    editingValue = replace ? "" : cell.raw;
    
    const el = getCellElement(addr);
    el.classList.add("editing");
    el.textContent = "";
    
    const input = document.createElement("input");
    input.value = editingValue;
    el.appendChild(input);
    input.focus();
    
    if (!replace) {
        input.select();
    } else {
        input.setSelectionRange(0, 0);
    }
}

function commitEdit() {
    if (!editingCell) return;
    
    const el = getCellElement(editingCell);
    const input = el.querySelector("input");
    const value = input ? input.value : "";
    
    setCellRaw(editingCell, value);
    
    el.classList.remove("editing");
    editingCell = null;
    editingValue = "";
    
    updateCellDisplay(editingCell || selectedCell);
}

function cancelEdit() {
    if (!editingCell) return;
    
    const addr = editingCell;
    const el = getCellElement(addr);
    el.classList.remove("editing");
    editingCell = null;
    
    updateCellDisplay(addr);
}

// Tokenizer
const TOKEN_TYPES = {
    NUMBER: "NUMBER",
    STRING: "STRING",
    IDENT: "IDENT",
    OP: "OP",
    LPAREN: "LPAREN",
    RPAREN: "RPAREN",
    COMMA: "COMMA",
    COLON: "COLON"
};

function tokenize(input) {
    const tokens = [];
    let i = 0;
    
    while (i < input.length) {
        const ch = input[i];
        
        // Skip whitespace
        if (/\s/.test(ch)) {
            i++;
            continue;
        }
        
        // Number
        if (/[0-9.]/.test(ch)) {
            let start = i;
            while (i < input.length && /[0-9.]/.test(input[i])) i++;
            // Handle scientific notation
            if (i < input.length && (input[i] === 'e' || input[i] === 'E')) {
                i++;
                if (i < input.length && (input[i] === '+' || input[i] === '-')) i++;
                while (i < input.length && /[0-9]/.test(input[i])) i++;
            }
            tokens.push({ type: TOKEN_TYPES.NUMBER, value: input.slice(start, i) });
            continue;
        }
        
        // String
        if (ch === '"') {
            let start = i;
            i++;
            let str = "";
            while (i < input.length && input[i] !== '"') {
                if (input[i] === '\\' && i + 1 < input.length) {
                    i++;
                }
                str += input[i];
                i++;
            }
            if (i < input.length) i++; // skip closing quote
            tokens.push({ type: TOKEN_TYPES.STRING, value: str });
            continue;
        }
        
        // Identifier (cell ref, function name, TRUE/FALSE)
        if (/[a-zA-Z$]/.test(ch)) {
            let start = i;
            while (i < input.length && /[a-zA-Z0-9$]/.test(input[i])) i++;
            tokens.push({ type: TOKEN_TYPES.IDENT, value: input.slice(start, i) });
            continue;
        }
        
        // Two-character operators
        if (i + 1 < input.length) {
            const two = input.slice(i, i + 2);
            if (two === "<>" || two === "<=" || two === ">=") {
                tokens.push({ type: TOKEN_TYPES.OP, value: two });
                i += 2;
                continue;
            }
        }
        
        // Single-character operators and punctuation
        if (ch === "+" || ch === "-" || ch === "*" || ch === "/" || ch === "^" || ch === "&") {
            tokens.push({ type: TOKEN_TYPES.OP, value: ch });
            i++;
            continue;
        }
        if (ch === "=") {
            tokens.push({ type: TOKEN_TYPES.OP, value: "=" });
            i++;
            continue;
        }
        if (ch === "<" || ch === ">") {
            tokens.push({ type: TOKEN_TYPES.OP, value: ch });
            i++;
            continue;
        }
        if (ch === "(") {
            tokens.push({ type: TOKEN_TYPES.LPAREN, value: "(" });
            i++;
            continue;
        }
        if (ch === ")") {
            tokens.push({ type: TOKEN_TYPES.RPAREN, value: ")" });
            i++;
            continue;
        }
        if (ch === ",") {
            tokens.push({ type: TOKEN_TYPES.COMMA, value: "," });
            i++;
            continue;
        }
        if (ch === ":") {
            tokens.push({ type: TOKEN_TYPES.COLON, value: ":" });
            i++;
            continue;
        }
        
        throw new Error("Unexpected character: " + ch);
    }
    
    return tokens;
}

// Parser
function parseFormula(input) {
    const tokens = tokenize(input);
    const parser = { tokens, pos: 0 };
    const ast = parseExpr(parser);
    if (parser.pos < parser.tokens.length) {
        throw new Error("Unexpected token: " + parser.tokens[parser.pos].value);
    }
    return ast;
}

function parseExpr(parser) {
    // Lowest precedence: comparisons
    let node = parseConcat(parser);
    
    while (parser.pos < parser.tokens.length) {
        const tok = parser.tokens[parser.pos];
        if (tok.type === TOKEN_TYPES.OP && ["=", "<>", "<", ">", "<=", ">="].includes(tok.value)) {
            parser.pos++;
            const right = parseConcat(parser);
            node = { type: "compare", op: tok.value, left: node, right };
        } else {
            break;
        }
    }
    
    return node;
}

function parseConcat(parser) {
    // & concatenation
    let node = parseAddSub(parser);
    
    while (parser.pos < parser.tokens.length) {
        const tok = parser.tokens[parser.pos];
        if (tok.type === TOKEN_TYPES.OP && tok.value === "&") {
            parser.pos++;
            const right = parseAddSub(parser);
            node = { type: "concat", left: node, right };
        } else {
            break;
        }
    }
    
    return node;
}

function parseAddSub(parser) {
    // + and -
    let node = parseMulDiv(parser);
    
    while (parser.pos < parser.tokens.length) {
        const tok = parser.tokens[parser.pos];
        if (tok.type === TOKEN_TYPES.OP && (tok.value === "+" || tok.value === "-")) {
            parser.pos++;
            const right = parseMulDiv(parser);
            node = { type: "binary", op: tok.value, left: node, right };
        } else {
            break;
        }
    }
    
    return node;
}

function parseMulDiv(parser) {
    // * and /
    let node = parsePower(parser);
    
    while (parser.pos < parser.tokens.length) {
        const tok = parser.tokens[parser.pos];
        if (tok.type === TOKEN_TYPES.OP && (tok.value === "*" || tok.value === "/")) {
            parser.pos++;
            const right = parsePower(parser);
            node = { type: "binary", op: tok.value, left: node, right };
        } else {
            break;
        }
    }
    
    return node;
}

function parsePower(parser) {
    // ^ right-associative
    let node = parseUnary(parser);
    
    if (parser.pos < parser.tokens.length) {
        const tok = parser.tokens[parser.pos];
        if (tok.type === TOKEN_TYPES.OP && tok.value === "^") {
            parser.pos++;
            const right = parsePower(parser); // Right-associative
            node = { type: "binary", op: "^", left: node, right };
        }
    }
    
    return node;
}

function parseUnary(parser) {
    // Unary + and -
    if (parser.pos < parser.tokens.length) {
        const tok = parser.tokens[parser.pos];
        if (tok.type === TOKEN_TYPES.OP && (tok.value === "+" || tok.value === "-")) {
            parser.pos++;
            const operand = parseUnary(parser);
            return { type: "unary", op: tok.value, operand };
        }
    }
    
    return parseAtom(parser);
}

function parseAtom(parser) {
    if (parser.pos >= parser.tokens.length) {
        throw new Error("Unexpected end of formula");
    }
    
    const tok = parser.tokens[parser.pos];
    
    // Parenthesized expression
    if (tok.type === TOKEN_TYPES.LPAREN) {
        parser.pos++;
        const expr = parseExpr(parser);
        if (parser.pos >= parser.tokens.length || parser.tokens[parser.pos].type !== TOKEN_TYPES.RPAREN) {
            throw new Error("Missing closing parenthesis");
        }
        parser.pos++;
        return expr;
    }
    
    // Number
    if (tok.type === TOKEN_TYPES.NUMBER) {
        parser.pos++;
        return { type: "literal", value: parseFloat(tok.value) };
    }
    
    // String
    if (tok.type === TOKEN_TYPES.STRING) {
        parser.pos++;
        return { type: "literal", value: tok.value };
    }
    
    // Identifier
    if (tok.type === TOKEN_TYPES.IDENT) {
        parser.pos++;
        const val = tok.value.toUpperCase();
        
        // TRUE/FALSE
        if (val === "TRUE") return { type: "literal", value: true };
        if (val === "FALSE") return { type: "literal", value: false };
        
        // Cell reference or function
        // Check if it's a cell reference (e.g., A1, $A$1)
        const info = parseAddress(tok.value);
        if (info) {
            return { type: "ref", address: tok.value.toUpperCase(), row: info.row, col: info.col, rowAbs: info.rowAbsolute, colAbs: info.colAbsolute };
        }
        
        // Function call - check for opening paren
        if (parser.pos < parser.tokens.length && parser.tokens[parser.pos].type === TOKEN_TYPES.LPAREN) {
            parser.pos++; // skip (
            const args = [];
            if (parser.pos < parser.tokens.length && parser.tokens[parser.pos].type !== TOKEN_TYPES.RPAREN) {
                args.push(parseFuncArg(parser));
                while (parser.pos < parser.tokens.length && parser.tokens[parser.pos].type === TOKEN_TYPES.COMMA) {
                    parser.pos++;
                    args.push(parseFuncArg(parser));
                }
            }
            if (parser.pos >= parser.tokens.length || parser.tokens[parser.pos].type !== TOKEN_TYPES.RPAREN) {
                throw new Error("Missing closing parenthesis for function " + val);
            }
            parser.pos++; // skip )
            return { type: "func", name: val, args };
        }
        
        throw new Error("Unknown identifier: " + tok.value);
    }
    
    throw new Error("Unexpected token: " + tok.value);
}

function parseFuncArg(parser) {
    // Could be expression or range
    let node = parseExpr(parser);
    
    // Check for range (colon)
    if (parser.pos < parser.tokens.length && parser.tokens[parser.pos].type === TOKEN_TYPES.COLON) {
        parser.pos++;
        const end = parseAtom(parser);
        if (node.type !== "ref" || end.type !== "ref") {
            throw new Error("Range must use cell references");
        }
        return { type: "range", start: node, end };
    }
    
    return node;
}

// Evaluator
function evalAst(node, currentAddr) {
    if (node.type === "literal") return node.value;
    
    if (node.type === "unary") {
        const operand = evalAst(node.operand, currentAddr);
        if (node.op === "-") return -toNumber(operand);
        if (node.op === "+") return toNumber(operand);
        throw new Error("Unknown unary op: " + node.op);
    }
    
    if (node.type === "binary") {
        const left = evalAst(node.left, currentAddr);
        const right = evalAst(node.right, currentAddr);
        
        switch (node.op) {
            case "+":
                return addValues(left, right);
            case "-":
                return toNumber(left) - toNumber(right);
            case "*":
                return toNumber(left) * toNumber(right);
            case "/": {
                const r = toNumber(right);
                if (r === 0) throw { type: "error", value: "#DIV/0!" };
                return toNumber(left) / r;
            }
            case "^":
                return Math.pow(toNumber(left), toNumber(right));
            case "&":
                return formatValue(left) + formatValue(right);
            case "=":
                return compareValues(left, right, "=");
            case "<>":
                return compareValues(left, right, "<>");
            case "<":
                return compareValues(left, right, "<");
            case ">":
                return compareValues(left, right, ">");
            case "<=":
                return compareValues(left, right, "<=");
            case ">=":
                return compareValues(left, right, ">=");
            default:
                throw new Error("Unknown op: " + node.op);
        }
    }
    
    if (node.type === "ref") {
        return getCellValue(node.address);
    }
    
    if (node.type === "range") {
        return evalRange(node);
    }
    
    if (node.type === "func") {
        return evalFunc(node, currentAddr);
    }
    
    if (node.type === "compare") {
        const left = evalAst(node.left, currentAddr);
        const right = evalAst(node.right, currentAddr);
        return compareValues(left, right, node.op);
    }
    
    if (node.type === "concat") {
        const left = evalAst(node.left, currentAddr);
        const right = evalAst(node.right, currentAddr);
        return formatValue(left) + formatValue(right);
    }
    
    throw new Error("Unknown node type: " + node.type);
}

function toNumber(value) {
    if (typeof value === "number") return value;
    if (typeof value === "boolean") return value ? 1 : 0;
    if (typeof value === "string") {
        if (value === "") return 0;
        const n = parseFloat(value);
        if (!isNaN(n)) return n;
    }
    throw { type: "error", value: "#VALUE!" };
}

function addValues(left, right) {
    // If both are strings, concatenate
    if (typeof left === "string" && typeof right === "string") {
        return left + right;
    }
    // Otherwise, add as numbers
    return toNumber(left) + toNumber(right);
}

function compareValues(left, right, op) {
    // Type coercion for comparison
    let l = left, r = right;
    
    // If both numbers, compare numerically
    if (typeof l === "number" && typeof r === "number") {
        switch (op) {
            case "=": return l === r;
            case "<>": return l !== r;
            case "<": return l < r;
            case ">": return l > r;
            case "<=": return l <= r;
            case ">=": return l >= r;
        }
    }
    
    // Convert booleans to numbers
    if (typeof l === "boolean") l = l ? 1 : 0;
    if (typeof r === "boolean") r = r ? 1 : 0;
    
    // If one is number and one is string, try to convert string to number
    if (typeof l === "number" && typeof r === "string") {
        const nr = parseFloat(r);
        if (!isNaN(nr)) r = nr;
    }
    if (typeof r === "number" && typeof l === "string") {
        const nl = parseFloat(l);
        if (!isNaN(nl)) l = nl;
    }
    
    // Both should be strings now (or one is)
    l = String(l);
    r = String(r);
    
    switch (op) {
        case "=": return l === r;
        case "<>": return l !== r;
        case "<": return l < r;
        case ">": return l > r;
        case "<=": return l <= r;
        case ">=": return l >= r;
    }
}

function getCellValue(addr) {
    const cell = getCell(addr);
    
    // Validate address
    const info = parseAddress(addr);
    if (!info || info.col >= COLS || info.row >= ROWS) {
        throw { type: "error", value: "#REF!" };
    }
    
    if (cell.type === "empty") {
        return 0;
    }
    
    if (cell.type === "error") {
        throw { type: "error", value: cell.value };
    }
    
    return cell.value;
}

function evalRange(node) {
    const start = evalAst(node.start);
    const end = evalAst(node.end);
    if (typeof start !== "object" || typeof end !== "object") {
        throw { type: "error", value: "#VALUE!" };
    }
    
    let minRow = Math.min(start.row, end.row);
    let maxRow = Math.max(start.row, end.row);
    let minCol = Math.min(start.col, end.col);
    let maxCol = Math.max(start.col, end.col);
    
    const values = [];
    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            const addr = formatAddress(r, c, false, false);
            const cell = getCell(addr);
            if (cell.type === "empty" || cell.type === "string") continue;
            if (cell.type === "error") throw { type: "error", value: cell.value };
            values.push(cell.value);
        }
    }
    
    return values;
}

function evalFunc(node, currentAddr) {
    const name = node.name;
    const args = node.args;
    
    switch (name) {
        case "SUM": {
            let total = 0;
            for (const arg of args) {
                if (arg.type === "range") {
                    const values = evalRange(arg);
                    for (const v of values) total += toNumber(v);
                } else {
                    const val = evalAst(arg, currentAddr);
                    total += toNumber(val);
                }
            }
            return total;
        }
        case "AVERAGE": {
            let total = 0;
            let count = 0;
            for (const arg of args) {
                if (arg.type === "range") {
                    const values = evalRange(arg);
                    for (const v of values) {
                        total += toNumber(v);
                        count++;
                    }
                } else {
                    const val = evalAst(arg, currentAddr);
                    total += toNumber(val);
                    count++;
                }
            }
            if (count === 0) throw { type: "error", value: "#DIV/0!" };
            return total / count;
        }
        case "MIN": {
            let min = Infinity;
            for (const arg of args) {
                if (arg.type === "range") {
                    const values = evalRange(arg);
                    for (const v of values) {
                        const n = toNumber(v);
                        if (n < min) min = n;
                    }
                } else {
                    const val = evalAst(arg, currentAddr);
                    const n = toNumber(val);
                    if (n < min) min = n;
                }
            }
            if (min === Infinity) return 0;
            return min;
        }
        case "MAX": {
            let max = -Infinity;
            for (const arg of args) {
                if (arg.type === "range") {
                    const values = evalRange(arg);
                    for (const v of values) {
                        const n = toNumber(v);
                        if (n > max) max = n;
                    }
                } else {
                    const val = evalAst(arg, currentAddr);
                    const n = toNumber(val);
                    if (n > max) max = n;
                }
            }
            if (max === -Infinity) return 0;
            return max;
        }
        case "COUNT": {
            let count = 0;
            for (const arg of args) {
                if (arg.type === "range") {
                    const values = evalRange(arg);
                    count += values.length;
                } else {
                    const val = evalAst(arg, currentAddr);
                    if (typeof val === "number") count++;
                }
            }
            return count;
        }
        case "IF": {
            if (args.length !== 3) throw { type: "error", value: "#ERROR!" };
            const cond = evalAst(args[0], currentAddr);
            if (cond) {
                return evalAst(args[1], currentAddr);
            } else {
                return evalAst(args[2], currentAddr);
            }
        }
        case "ABS": {
            if (args.length !== 1) throw { type: "error", value: "#ERROR!" };
            return Math.abs(toNumber(evalAst(args[0], currentAddr)));
        }
        case "ROUND": {
            if (args.length !== 2) throw { type: "error", value: "#ERROR!" };
            const val = toNumber(evalAst(args[0], currentAddr));
            const digits = toNumber(evalAst(args[1], currentAddr));
            const factor = Math.pow(10, digits);
            return Math.round(val * factor) / factor;
        }
        default:
            throw { type: "error", value: "#ERROR!" };
    }
}

// Event handling
gridEl.addEventListener("click", (e) => {
    const cell = e.target.closest("[data-cell]");
    if (!cell) return;
    const addr = cell.getAttribute("data-cell");
    
    if (editingCell && editingCell !== addr) {
        commitEdit();
    }
    
    selectCell(addr);
});

gridEl.addEventListener("dblclick", (e) => {
    const cell = e.target.closest("[data-cell]");
    if (!cell) return;
    const addr = cell.getAttribute("data-cell");
    startEdit(addr, false);
});

document.addEventListener("keydown", (e) => {
    // If editing
    if (editingCell) {
        if (e.key === "Enter") {
            e.preventDefault();
            commitEdit();
            moveSelection(1, 0);
        } else if (e.key === "Tab") {
            e.preventDefault();
            commitEdit();
            moveSelection(0, e.shiftKey ? -1 : 1);
        } else if (e.key === "Escape") {
            e.preventDefault();
            cancelEdit();
        }
        return;
    }
    
    // Not editing
    const info = parseAddress(selectedCell);
    if (!info) return;
    
    if (e.key === "ArrowUp") {
        e.preventDefault();
        moveSelection(-1, 0);
    } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveSelection(1, 0);
    } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveSelection(0, -1);
    } else if (e.key === "ArrowRight") {
        e.preventDefault();
        moveSelection(0, 1);
    } else if (e.key === "Enter") {
        e.preventDefault();
        startEdit(selectedCell, true);
    } else if (e.key === "F2") {
        e.preventDefault();
        startEdit(selectedCell, false);
    } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        setCellRaw(selectedCell, "");
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        // Typing a character
        e.preventDefault();
        startEdit(selectedCell, true);
        const el = getCellElement(selectedCell);
        const input = el.querySelector("input");
        input.value = e.key;
        editingValue = e.key;
    } else if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        copyCell();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        pasteCell();
    }
});

function moveSelection(rowDelta, colDelta) {
    const info = parseAddress(selectedCell);
    if (!info) return;
    
    let newRow = info.row + rowDelta;
    let newCol = info.col + colDelta;
    
    newRow = Math.max(0, Math.min(ROWS - 1, newRow));
    newCol = Math.max(0, Math.min(COLS - 1, newCol));
    
    const newAddr = formatAddress(newRow, newCol, false, false);
    selectCell(newAddr);
}

// Copy/Paste with reference shifting
function copyCell() {
    clipboard = getCell(selectedCell).raw;
    clipboardSource = selectedCell;
}

function pasteCell() {
    if (clipboard === null) return;
    
    const sourceInfo = parseAddress(clipboardSource);
    const destInfo = parseAddress(selectedCell);
    const rowDelta = destInfo.row - sourceInfo.row;
    const colDelta = destInfo.col - sourceInfo.col;
    
    const shifted = shiftReferences(clipboard, rowDelta, colDelta);
    setCellRaw(selectedCell, shifted);
}

function shiftReferences(formula, rowDelta, colDelta) {
    if (!formula.startsWith("=")) return formula;
    
    return formula.replace(/(\$?)([A-Z])(\$?)(\d+)/g, (match, colDollar, colChar, rowDollar, rowNum) => {
        let col = colToIndex(colChar);
        let row = rowToIndex(rowNum);
        
        if (!colDollar) col = Math.max(0, Math.min(COLS - 1, col + colDelta));
        if (!rowDollar) row = Math.max(0, Math.min(ROWS - 1, row + rowDelta));
        
        return formatAddress(row, col, rowDollar === '$', colDollar === '$');
    });
}

// Formula bar
formulaBar.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        setCellRaw(selectedCell, formulaBar.value);
        formulaBar.blur();
    }
});

formulaBar.addEventListener("input", () => {
    // Live update formula bar value
});

// Persistence
function saveToStorage() {
    const data = {};
    for (const addr in cells) {
        if (cells[addr].raw !== "") {
            data[addr] = cells[addr].raw;
        }
    }
    localStorage.setItem("gridcalc-data", JSON.stringify(data));
}

function loadFromStorage() {
    try {
        const data = JSON.parse(localStorage.getItem("gridcalc-data") || "{}");
        for (const addr in data) {
            setCellRaw(addr, data[addr]);
        }
    } catch (e) {
        // Ignore load errors
    }
}

// Initialize
buildGrid();
selectCell("A1");
loadFromStorage();
```

Wait, I need to think about the dependency graph and cycle detection more carefully. The current approach evaluates cells on demand, but doesn't handle cycles. Let me add that.

For cycle detection, I need to track the evaluation stack. When evaluating a cell, if I encounter a reference to a cell that's already on the stack, it's a cycle.

For incremental recalculation, I should rebuild the dependency graph when cells change, then re-evaluate in the correct order.

Actually, let me simplify: when any cell changes, re-evaluate all cells that might depend on it. To do this efficiently, I'll maintain a dependency graph.

Let me redesign the evaluation system:

1. When a cell's raw content changes, parse it to find all cell references
2. Update the dependency graph (which cells depend on which)
3. Find all cells that transitively depend on the changed cell
4. Topologically sort those cells
5. Evaluate them in order

For cycle detection:
- During topological sort, if we can't sort (cycle exists), mark all cells in the cycle as #CYCLE!
- Cells that depend on cycle cells also show #CYCLE!

Let me implement this properly.

Actually, let me think about the simplest correct approach:

1. When a cell changes, mark it as dirty
2. Propagate "dirty" to all dependents
3. Find all dirty cells
4. Try to evaluate them in dependency order
5. If a cell can't be evaluated because it depends on another dirty cell, that's a cycle

Hmm, this is getting complex. Let me use a simpler approach that's still correct:

When a cell changes:
1. Clear all computed values (mark all cells as needing re-evaluation)
2. Evaluate all cells in row-major order

Wait, but that doesn't work for formulas that reference cells below/right. We need to evaluate in dependency order.

Let me use a topological sort approach:
1. Build dependency graph: for each cell, find which cells it depends on
2. When a cell changes, find all cells that depend on it (directly or transitively)
3. Topologically sort those cells
4. Evaluate in that order

For cycle detection during topological sort: if we visit a cell that's already being visited, it's a cycle.

Let me implement this properly now. I'll rewrite the evaluation system.

Actually, given the complexity, let me use a pragmatic approach:

1. Maintain a `dependsOn` map: cell -> list of cells it depends on
2. When evaluating a cell:
   a. First evaluate all cells it depends on
   b. Then evaluate itself
3. Use a "currently evaluating" set to detect cycles
4. If a cycle is detected, mark all cells in the cycle as #CYCLE!

For incremental recalc:
1. When cell X changes, clear its computed value
2. Find all cells that depend on X (using a reverse dependency map)
3. Clear their computed values too
4. Re-evaluate them in dependency order

Let me code this properly. This is the core of the spreadsheet engine.

I think the cleanest approach is:

1. `evaluateAll()`: Re-evaluate all cells. Used for initial load and after structural changes.
2. `evaluateDependents(addr)`: When a cell changes, find all cells that depend on it and re-evaluate them.

For `evaluateDependents`:
1. Build reverse dependency map from current formulas
2. BFS from changed cell through reverse deps to find all affected cells
3. Topological sort the affected cells
4. Evaluate in order

For cycle detection, during topological sort, if we detect a cycle, mark all cells in the cycle as #CYCLE!

Let me implement this. I'll need to:
1. Parse each formula to find its dependencies
2. Build the reverse dependency graph
3. Use it for incremental recalc

Here's my plan for the rewritten code:

```javascript
// Dependency tracking
let dependsOn = {}; // addr -> [addrs this cell depends on]
let dependents = {}; // addr -> [addrs that depend on this cell]

function parseDependencies(raw) {
    // Parse formula and return list of cell references
    // ...
}

function updateDependencies(addr, raw) {
    const deps = parseDependencies(raw);
    dependsOn[addr] = deps;
    
    // Update reverse deps
    if (!dependents[addr]) dependents[addr] = [];
    for (const dep of deps) {
        if (!dependents[dep]) dependents[dep] = [];
        if (!dependents[dep].includes(addr)) {
            dependents[dep].push(addr);
        }
    }
}

function evaluateDependents(addr) {
    // Find all cells that depend on addr
    const toEval = new Set();
    const queue = [addr];
    while (queue.length > 0) {
        const current = queue.pop();
        if (toEval.has(current)) continue;
        toEval.add(current);
        if (dependents[current]) {
            for (const dep of dependents[current]) {
                queue.push(dep);
            }
        }
    }
    
    // Topological sort and evaluate
    // ...
}
```

This is getting quite involved. Let me write the complete, polished code now. I'll focus on getting it right.

Let me also add the visual polish:
- Better styling
- Cell reference highlighting while editing
- Status bar with sum/count

And handle edge cases:
- Empty cells in formulas (treated as 0)
- Error propagation
- Cycle detection

Let me write the final code:

I realize I need to be more careful with several things:

1. **Cycle Detection**: When evaluating, track the call stack. If a cell is evaluated while it's already on the stack, it's a cycle.

2. **Incremental Recalculation**: Maintain a dependency graph. When a cell changes, re-evaluate only its dependents.

3. **Reference Parsing for Copy/Paste**: Need to correctly parse $A$1, A$1, $A1, A1 in formulas.

Let me write a more robust implementation. I'll structure it carefully.

Key design decisions:
- Store cell state as objects with `raw`, `type`, `value`, `display`
- Evaluate lazily: when a cell's value is needed, evaluate its formula
- Use a "visiting" set during evaluation to detect cycles
- Maintain dependency graph for incremental recalc

For the grader, the most important things are:
- Correct formula evaluation
- Correct error codes
- Correct copy/paste with reference shifting
- Correct keyboard/mouse interaction
- Correct DOM structure (data-cell attributes, aria-selected, etc.)

Let me write the complete code now, focusing on correctness first, then polish.

I'll use a simpler approach for cycle detection: during evaluation, maintain a set of cells currently being evaluated. If we encounter a cell in that set, it's a cycle.

For incremental recalc, I'll rebuild the dependency graph whenever a formula changes, then use it to find affected cells.

Actually, let me use an even simpler approach that's guaranteed correct: when any cell changes, re-evaluate ALL cells. For 2600 cells, this should be fast enough in JavaScript. The grader's performance test is for a 60-cell chain, which will be evaluated quickly even with full recalc.

But the spec says "incremental recalculation" is required. Let me do it properly with dependency tracking.

OK, here's my final design:

1. Each cell has `raw` content
2. When a cell's raw content changes:
   a. Parse the formula to find dependencies
   b. Update the dependency graph
   c. Find all cells that depend on this cell (BFS through dependents)
   d. Topologically sort those cells
   e. Evaluate them in order
3. During evaluation, detect cycles using a "visiting" set
4. If a cycle is detected, mark all cells in the cycle as #CYCLE!

Let me implement this. I'll be careful with the topological sort.

For topological sort of the affected cells:
1. Compute in-degrees for each affected cell (only counting edges within the affected set)
2. Start with cells that have in-degree 0
3. Process them, decrement in-degrees of dependents
4. If we can't process all cells, the remaining ones are in cycles

Actually, for simplicity, let me use DFS-based cycle detection during evaluation:

```javascript
let visiting = new Set();
let visited = new Set();

function evaluateCell(addr) {
    if (visited.has(addr)) return cells[addr].value;
    if (visiting.has(addr)) {
        // Cycle detected
        markCycle(addr);
        return "#CYCLE!";
    }
    
    visiting.add(addr);
    
    // Evaluate formula
    // ...
    
    visiting.delete(addr);
    visited.add(addr);
    return cells[addr].value;
}
```

But this doesn't correctly mark all cells in the cycle. Let me think...

When we detect a cycle at cell X (X is in `visiting`), we need to mark X and all cells from X to the current cell in the visiting stack as #CYCLE!.

Let me maintain a stack instead of just a set:

```javascript
let visitStack = [];
let visitSet = new Set();

function evaluateCell(addr) {
    if (visitSet.has(addr)) {
        // Cycle: find where addr is in the stack and mark from there
        let idx = visitStack.indexOf(addr);
        for (let i = idx; i < visitStack.length; i++) {
            cells[visitStack[i]].type = "error";
            cells[visitStack[i]].value = "#CYCLE!";
            cells[visitStack[i]].display = "#CYCLE!";
        }
        return "#CYCLE!";
    }
    
    visitStack.push(addr);
    visitSet.add(addr);
    
    // Evaluate...
    
    visitStack.pop();
    visitSet.delete(addr);
    return cells[addr].value;
}
```

This is getting complex. Let me simplify by using a different approach:

1. When any cell changes, do a full re-evaluation of all cells
2. Use the visiting stack approach for cycle detection
3. This is simpler and guaranteed correct

For performance, evaluating 2600 cells should be fast. Let me benchmark mentally: each cell evaluation involves parsing and evaluating a formula, which is maybe 100-1000 operations. 2600 * 1000 = 2.6 million operations, which should complete in well under 100ms in JavaScript.

Actually, the spec says "changing the head of a 60-cell dependency chain must update the whole chain in well under 100 ms." Full recalc of 2600 cells might be close to that. Let me do incremental recalc to be safe.

OK, let me implement incremental recalc with proper dependency tracking. Here's the plan:

1. `cellDependencies[addr]` = list of cells that `addr`'s formula depends on
2. `cellDependents[addr]` = list of cells that depend on `addr`
3. When cell `addr` changes:
   a. Update `cellDependencies[addr]` by parsing its formula
   b. Find all affected cells by BFS through `cellDependents`
   c. Topologically sort the affected cells
   d. Evaluate in order

For topological sort, I'll use Kahn's algorithm.

Let me write this out carefully. I'll parse dependencies from the raw formula string by looking for cell references.

Parsing cell references from a formula:
- Look for patterns like `A1`, `$A$1`, `A$1`, `$A1`
- But not inside strings
- And not function names (though function names don't have digits, so `A1` pattern is safe)

Simple regex: `(\$?[A-Z]\$?\d+)` should match cell references.

Let me write the complete code now. This is going to be a long file.

I'll also add:
- Better visual design
- Cell reference highlighting while editing
- Status bar

Let me start writing:
