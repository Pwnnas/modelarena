# Task: Gridcalc — a spreadsheet engine

Build a fast, good-looking spreadsheet application: a polished grid UI on top of a real formula
engine (tokenizer, parser, evaluator, dependency graph, incremental recalculation).

## Ground rules

- Deliver **one file: `index.html`** with all HTML, CSS and JavaScript inline.
- **No external resources of any kind**: no CDNs, libraries, frameworks, web fonts or remote
  images. Everything must be written by you or generated in code. Network access is blocked
  during grading.
- Target: latest desktop Google Chrome at a 1280×800 viewport; adapt to window resizing.
- No errors in the console. Never use `alert`, `confirm` or `prompt`.
- The page starts with an empty `localStorage` (fresh browser profile).
- You are scored two ways:
  1. **Automated grader**: a headless browser drives your page through the *Grader contract*
     below, using real mouse and keyboard input, and measures correctness, robustness and
     performance. Follow the contract exactly (ids, attributes and names are case-sensitive).
  2. **Blind human judging**: your page is shown side by side with other submissions; people
     use both and pick the better one on visual design, interaction quality and overall feel.

## Requirements

### Grid & selection
- 26 columns (A–Z) × 100 rows (1–100). Column headers and row headers stay visible (sticky)
  while the grid scrolls.
- Clicking a cell selects it. The selection is clearly highlighted, and the matching row and
  column headers are highlighted too.
- Arrow keys move the selection (stopping at the grid edges). The selected cell is always
  scrolled into view.

### Editing
- Typing a printable character while a cell is selected (and not being edited) starts editing
  and **replaces** the cell's content with that character.
- **F2** or **double-click** edits the existing content, with the caret at the end.
- While editing: **Enter** commits and moves the selection one row down; **Tab** commits and
  moves one column right; **Shift+Enter** / **Shift+Tab** commit and move up / left;
  **Escape** cancels and restores the previous content; clicking another cell commits.
- **Delete** or **Backspace** on a selected cell that is not being edited clears it.
- A formula bar above the grid shows the selected cell's address and its **raw** content
  (e.g. `=SUM(A1:A3)`). Typing in the formula bar and pressing Enter commits that content to
  the selected cell.

### Values & display
- Raw content is empty, a number (`42`, `-3.5`, `1e3`, `.5`), text, or a formula starting
  with `=`.
- Numbers display with no floating-point noise and at most 10 significant digits
  (`=0.1+0.2` shows `0.3`, `=1/3` shows `0.3333333333`), without thousands separators.
  Numbers are right-aligned, text left-aligned.
- Booleans display as `TRUE` / `FALSE`.

### Formula language
- Number literals, string literals in double quotes (`"abc"`), the literals `TRUE`/`FALSE`,
  cell references (`A1`, case-insensitive), absolute/mixed references (`$A$1`, `A$1`, `$A1`),
  and ranges (`A1:B3`) as function arguments.
- Operators, from **highest** to **lowest** precedence:
  1. `^` power, right-associative (`2^3^2` = 512)
  2. unary `-` and `+` (`-2^2` = -4)
  3. `*` `/`
  4. `+` `-`
  5. `&` text concatenation (numbers convert to their displayed text)
  6. comparisons `=` `<>` `<` `>` `<=` `>=` (result `TRUE`/`FALSE`)
- Parentheses override precedence. Whitespace is allowed anywhere between tokens.
- Functions, case-insensitive, taking any mix of ranges and expressions as arguments:
  `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT` (counts numeric values), `IF(cond, then, else)`,
  `ABS(x)`, `ROUND(x, digits)`.
- Empty cells are `0` in arithmetic. Range functions ignore empty and text cells.

### Errors (display exactly these codes)

| Code      | When                                                                     |
|-----------|--------------------------------------------------------------------------|
| `#DIV/0!` | division by zero                                                         |
| `#VALUE!` | text used in arithmetic (`="abc"*2`, or a text cell used with `+ - * / ^`) |
| `#REF!`   | reference outside A1:Z100 (`=A101`, `=AA1`)                              |
| `#ERROR!` | the formula cannot be parsed, or uses an unknown function                |
| `#CYCLE!` | circular reference: every cell that is part of the cycle shows it        |

- Errors propagate: a formula that depends on a cell holding an error shows that same error
  (so cells that depend on a cycle also show `#CYCLE!`).
- Editing any cell of a cycle so the cycle is broken makes every affected cell compute
  normally again.

### Recalculation
- When a cell changes, every cell that depends on it (directly or transitively) updates
  immediately, in dependency order, each recomputed once.
- It must be fast: changing the head of a 60-cell dependency chain must update the whole
  chain in well under 100 ms.

### Copy & paste
- **Ctrl+C / Cmd+C** copies the selected cell; **Ctrl+V / Cmd+V** pastes into the selected
  cell. Support both Ctrl and Cmd. Pasting a formula shifts its relative references by the
  row/column offset between source and destination; `$`-anchored parts don't shift (copying
  `=A1+$B$1` from C1 to C2 gives `=A2+$B$1`). An internal clipboard is fine.

### Persistence
- All cell contents persist in `localStorage` and are restored on reload.

### Polish (judged by humans)
- A crisp, professional look in the spirit of a modern spreadsheet product: good typography,
  sensible density, subtle grid lines, clear selection and edit states.
- While editing a formula, highlight the cells/ranges it references (e.g. colored outlines
  matching colored references in the editor).
- Error cells are visibly styled and explain the error on hover.
- Nice extras are welcome (status bar with SUM/COUNT of the selection, column resizing,
  formula syntax coloring), as long as they don't break the contract.

## Grader contract

1. All 2,600 cells exist in the DOM at all times (no virtualization). Each cell element has
   `data-cell="<ADDRESS>"` with an upper-case address, e.g. `data-cell="B7"`.
2. A cell element's visible text (`innerText`) is exactly its displayed value: the computed
   result, never the formula. An editor may be shown in or over the cell while editing.
3. The selected cell element has `aria-selected="true"`; no other cell does.
4. The formula bar is `<input id="formula-bar">`.
5. The grader uses real mouse clicks and keyboard input. Example: it clicks
   `[data-cell="B1"]`, types `=A1*2`, presses Enter, then reads `innerText` of cells.
   Keyboard input must work immediately after clicking a cell.
