I'm planning out a complete spreadsheet app with a 2600-cell grid, using a table structure with sticky headers and first column for row/column labels.

For editing, I'm deciding to overlay an absolutely positioned input over the grid container rather than inside the cell itself, positioned using the cell's offset coordinates, since embedding it directly in the td would mess with the displayed text value.

For the formula bar, I'll sync its value to the selected cell and have Enter commit the edit, then move selection down like Excel does. For keyboard handling, I'll use a global document keydown listener for navigation and typing when not editing, letting the formula bar and cell-editing input handle their own Enter/Escape, so input works immediately after clicking any cell.

For typed characters while a cell is selected, I'll intercept the keydown, prevent default, and manually set the new input's value to that character rather than relying on focus-change timing. I need to track editing state (cell address, input element, original value) so Escape cancels and clicking another cell while editing commits the current value before switching selection.

Now I'm thinking through the formula bar: it should mirror the active cell's raw content while editing, update live as the user types in the cell, and also act as its own editor when the user types directly into it — pressing Enter there commits the value to the selected cell and moves selection down, while Escape restores the original. I'm deciding to keep this simple by treating the formula bar and cell editor as somewhat independent rather than fully syncing keystrokes between them.

Document-level keydown needs to skip handling entirely when the event target is an input (formula bar or cell editor), since those elements manage their own Enter/Tab/Escape logic for committing, moving selection, or canceling edits. I'm also confirming a default selection always exists so typing always has a target, and planning CSS classes to highlight the selected cell and its row/column headers.

Now I'm designing the spreadsheet engine's data model: raw values and computed values stored in 2D arrays indexed by row and column, with formulas parsed into reference lists that expand ranges into individual cell dependencies. For recalculation, I need to track dependents per cell, and when a cell changes, do a BFS to find all affected cells then topologically sort them using Kahn's algorithm before recomputing values in order.

Cells stuck in a dependency cycle, or downstream of one, won't resolve through Kahn's algorithm, so I need a way to flag them with a cycle error and propagate that error to anything depending on them, without resorting to full Tarjan SCC detection -- I'm working out a simpler approach using the leftover unresolved set after Kahn's algorithm finishes.

Actually a cleaner solution is DFS-based recursive evaluation with memoization: when evaluating a cell I mark it as "visiting," and if I hit a cell already marked visiting, that's a cycle, so I return a cycle error which gets stored and propagated to every dependent. This naturally handles both cycle members and downstream cells, and since each cell gets memoized after one evaluation, recalculation stays efficient -- though I'm now wondering if a very long dependency chain (thousands of cells) could risk a stack overflow from recursion depth.

Actually, I realize that any node remaining unresolved after Kahn's algorithm must be reachable from a cycle by definition—it's stuck because its upstream dependency never resolves, which only happens through an infinite backward chain, i.e., a cycle. So the simple rule holds: every node left in U should just get marked #CYCLE!.

If a node in a cycle is reachable from M which is affected, that node is also a dependent of M, so the entire cycle gets pulled into the affected set once any member is affected. And if X itself sits inside a cycle, the BFS from X naturally loops back and includes X in its own affected set, which is the right behavior.

For topological ordering, I compute indegree within the affected set by counting precedent edges that stay inside that set, then run Kahn's algorithm: pop nodes with zero indegree, decrement their dependents' indegree, and push newly-zero ones. Since all cycle members get marked as CYCLE errors upfront, any node evaluated later that depends on a cycle member will already see that error value, which keeps evaluation order safe.

I also need to maintain precedents/dependents sets per cell, updating them whenever a cell's raw formula changes -- removing old dependent links, reparsing the new formula, and registering the new references, skipping out-of-bounds range cells which should resolve to #REF! instead. On initial load I'll treat every formula cell as affected and run a full recalculation through the same topological process rather than trying to diff anything.

For recalculation itself, I'll do a BFS from the starting set through dependents to find all affected cells, then feed them through Kahn's algorithm to get evaluation order, treating non-formula cells uniformly as literal evaluations with zero precedents. Literal parsing needs to distinguish blanks (null), numbers, booleans (TRUE/FALSE case-insensitively), and plain text, while errors get wrapped in a dedicated error class with a code, and I'm defining a numeric coercion helper that converts null to 0, booleans to 1/0, and leaves numbers and strings handled appropriately for arithmetic.

For arithmetic, text operands should produce a #VALUE! error even if they look numeric, since any string involved in math is treated strictly. I'm designing comparison logic that normalizes nulls to 0 or empty string depending on context, handles numeric and case-insensitive string comparisons, and falls back to an Excel-like type ordering for mixed comparisons, plus a text coercion helper for concatenation that converts nulls to empty strings, booleans to TRUE/FALSE, and propagates errors.

Now I'm working out number formatting with ten significant digits using toPrecision, to handle floating point artifacts like 0.1+0.2 rendering cleanly.

I'm also figuring out literal parsing for numbers via regex, display alignment rules (numbers right, text left, booleans centered), and sketching out the tokenizer design for references, functions, operators, and ranges, including the lookahead needed to distinguish a cell reference from a function name.

For column/row parsing, columns past Z or rows out of the valid range should resolve to a #REF! error during evaluation, and I'm defining how number literals inside formulas get matched distinctly from identifiers. Now I'm working through string literal parsing with quoted text and escaped double-quote handling.

I'm mapping out operator precedence from comparisons down to concatenation, addition, multiplication, unary signs, and exponentiation, making sure exponentiation is right-associative and unary minus/plus interacts correctly with powers like -2^2 and 2^-1. Then I'm defining primary expressions to cover numbers, strings, booleans, cell references (including ranges via a colon), function calls with comma-separated arguments, and parenthesized expressions, while noting ranges should only be valid in specific contexts like function arguments.

Now I'm working through evaluation semantics: standalone ranges yield a VALUE error, while function arguments evaluating ranges extract numeric values and ignore text/empty cells but propagate any errors found. For SUM I'm deciding non-range arguments convert nulls to zero and booleans to 1/0 while strings cause VALUE errors, and for AVERAGE/MIN/MAX/COUNT I'm defining how they aggregate numeric values from both direct arguments and ranges, including DIV/0 handling when there's nothing to average.

For IF I'm making evaluation lazy so only the chosen branch runs, with truthiness rules for different types and errors propagating immediately; ABS and ROUND just convert to numbers and round half-away-from-zero carefully to avoid floating point issues. Unknown function names should fail at parse time, turning the whole cell into a parse error, and I'm representing errors as a distinct value class so cells can store and display error codes. Since topological ordering already resolves cycles before evaluation, reading a cell's value during eval can just pull from the already-computed cache.

Now I'm thinking through persistence using localStorage, saving only nonempty cell raw values keyed by address after each commit and reloading them on startup. For copy/paste, I'll keep an internal clipboard tracking the copied raw value and source address rather than relying on the system clipboard, so Ctrl+C/Ctrl+V work through key events, while allowing default paste behavior when actively editing a cell's input.

For relative reference shifting during paste, I need a function that tokenizes a formula and rewrites cell references by the row/column delta, carefully skipping string literals by splitting the text into string vs non-string segments first, then applying a regex to find column-letter/row-number refs (with optional $ anchors) outside identifiers. If a shifted reference falls outside valid bounds, it should resolve to a REF error when evaluated rather than crashing the parser.

I decide the simplest fix for out-of-bounds refs is to just emit "A0" for any invalid shift, since row 0 naturally evaluates to a REF error. I also need case-insensitive ref matching, consistent address formatting (column letter plus 1-based row), and a flat index scheme (row*26+col) to back the cell array.

For rendering, I plan a simple td-per-cell array where each cell shows its formatted value and gets an error/number/text/bool class, with error cells also getting a title tooltip. Editing swaps in an input element, and recalculation only re-renders the affected set of cells for performance, which should stay fast even with long dependency chains. Selection is tracked by row/col and managed via toggling the aria-selected attribute, removing it from the previously selected cell before setting it on the new one.

I'll also update the row/column header highlighting and scroll the selected cell into view, adding scroll-padding to account for the sticky headers so they don't obscure it. I'm keeping things simple by skipping multi-cell range selection for now and just syncing the formula bar to the selected cell's raw value, with the status bar showing basic info like sheet size and filled-cell count instead of a full sum/count summary.

For formula editing, I'm adding reference highlighting: when the editor text starts with '=', I tokenize it to find cell/range references and outline those cells with cycling colors so users can see what a formula points to as they type, clearing the highlights once editing ends. I'm skipping column resizing and formula syntax coloring in the bar itself to keep things manageable.

Now I'm working through the editing flow: starting an edit creates an input overlay on the cell with the raw formula or initial typed character, syncs its value to the formula bar on every keystroke (also triggering highlightRefs), and handles Enter/Tab/Shift+Tab/Escape to commit, move, or cancel the edit.

On commit, I take the input's value, remove the overlay, write the raw value back through setRaw to trigger recalculation, clear editing state and highlights, and rely on focus naturally falling back to the document/body so global keydown handling keeps working. Clicking elsewhere or double-clicking a cell commits any active edit before starting a new one (ignoring clicks that originate from inside the active input itself), while Escape just removes the input without saving.

For the global document-level keydown handling when not editing, I'm routing arrow keys to move the selection with scroll prevented, Tab/Enter to shift selection right/down (with shift-variants reversing direction), F2 to enter edit mode on the raw value, Delete/Backspace to clear the cell, copy/paste shortcuts, and any single printable character to immediately start editing by replacing the cell's content with that typed character.

For the formula bar itself, I'm wiring Enter to commit the raw value to the selected cell and return focus to the grid, Escape to discard and blur, and focus events to make sure any in-progress cell edit gets committed first.

Now I'm working out the recalculation logic: when a cell's raw value changes, I rebuild its precedent dependencies, gather the affected set by walking the dependents graph outward from the changed cell, and recompute each affected cell in order while keeping the formula bar in sync if it reflects the selected cell.

I'm doing a topological sort over the affected cells using indegree counts based on the dependents graph, pushing zero-indegree nodes into a processing queue and decrementing as I go. Any affected nodes left unprocessed after the queue empties are part of a cycle, so I mark them as a CYCLE error and make sure everything downstream of a cycle also inherits that error, then evaluate the rest of the ordered nodes and re-render all affected cells. I'm also thinking through the edge case where breaking a cycle — like redefining one of two mutually-referencing cells to a plain value — should correctly clear the cycle error for the other cell.

I also need to handle removing stale dependency edges whenever a cell's formula changes, and for the initial bulk load, I can just set all raw values first, build the full dependency graph, and recalc starting from every cell. For formula parsing, I'll cache each cell's parsed AST (or null for non-formula cells) and write an evaluator that walks the AST, handling numbers, strings, booleans, and references — where a reference to a cell outside the sheet returns a REF error and references to empty cells return null, which behaves as zero in arithmetic, while references to cells holding errors propagate those errors forward.

Writing evaluator logic...

String direct args should yield a VALUE error except in COUNT, and range functions should just skip empty or text cells. For IF, each argument evaluates individually and passing a range directly causes an error, while ROUND takes a numeric value and optional digit count that gets truncated to an integer. I'm deciding arg-count validation loosely — enforcing exact counts for IF, ABS, and ROUND, treating mismatches as parse errors yielding #ERROR!, and letting malformed expressions like trailing operators or a lone "=" also fail at parse time. Now I'm moving into writing the actual tokenizer, starting with whitespace handling and string literal scanning.

Still writing tokenizer...

Otherwise checking for TRUE/FALSE booleans, then the ref regex for optional dollar signs, column letters, and row digits to build the reference token with absolute flags, and throwing otherwise. For operators, I need to check two-character ones like '<>', '<=', '>=' before falling back to single-character operators and punctuation.

Now I'm writing the column-letter-to-index conversion, validating row/column bounds, and building the recursive-descent parser with precedence levels for comparison, concatenation, addition, and multiplication operators.

For exponentiation I'm handling right-associativity so expressions like 2^3^2 group correctly, and for primary expressions I'm parsing literals, cell references, and ranges with validation for out-of-bounds cells.

For function calls I'm parsing the name, opening paren, comma-separated arguments, and closing paren, then validating the function name and argument count before parens for grouping. During parsing I'm also tracking which cell references appear so I can build a dependency set, and for ranges I'm collecting the full list of cells while flagging bad ranges that should evaluate to a REF error.

For highlighting references while editing a formula, I'm writing a helper that tokenizes the text and pulls out ref and range tokens with their coordinates, treating a ref followed by ':' and another ref as a range, then assigning each distinct reference a rotating color class so cells get highlighted consistently, only when the text starts with '='.

Now I'm writing the formula-shifting logic for paste operations, using a regex to match cell references like column letters and row numbers while preserving dollar-sign anchors and avoiding false matches inside function names or string literals.

I'm working out how the regex avoids misfiring on adjacent references or identifiers, how to split formula text around quoted strings so only non-string segments get rewritten, and how shifted references that land outside the valid grid become an error reference instead of silently wrapping.

For clipboard paste behavior, I'm thinking through how pasting a formula should re-shift its relative references based on the offset between source and destination cells, and whether to rely on an internal clipboard versus intercepting native copy/paste events since preventDefault blocks the real clipboard from firing in headless testing.

For persistence, I'm planning a save function that serializes only non-empty cell contents to localStorage with error handling, and a load function that restores them back into the raw cell map.

Now I'm designing the dependency graph update logic for setRaw: clearing old precedent/dependent links, re-parsing the formula text to extract new references, wiring up the dependents map, and marking cells with parse errors so evalCell can surface them appropriately during recalculation.

I'm also working through evaluation edge cases—making sure standalone ranges resolve to a VALUE error, literals are parsed into numbers/booleans/strings on the fly, and references always return a defined value thanks to topological ordering. For rendering, I'm writing a renderCell function that updates text content and CSS classes based on the computed value, but I need to be careful not to destroy an active input element if the user is mid-edit on that cell.

To solve that editing conflict, I'm nesting the cell's displayed value inside a span so the renderer only touches the span's text while an editing input stays untouched as a sibling. Then I'm sketching the overall HTML structure—topbar, formula bar with a name box and fx input, the scrollable grid table with sticky header/row-header cells, and a status bar footer—along with CSS to keep headers pinned using sticky positioning and layered z-indexes.

Now I'm fixing the table layout with explicit column widths via colgroup, using separate border-collapse with zero spacing so grid lines render cleanly as right/bottom borders on each cell. I'm styling highlighted headers, sizing cells with fixed height and ellipsis overflow on the inner span, and using an inset box-shadow for selection highlighting plus relative positioning on cells so the absolutely-positioned edit input can overlay them.

Continuing the editing input's absolute positioning, then planning default column/row dimensions for the grid, skipping resize support, and adding error styling with a tooltip title attribute to explain formula errors, alongside Sheets-style accent colors and fonts.

Next I'm figuring out the status bar content, showing something like a simple cell count and selected cell reference rather than full sum/average/count stats, and confirming the flex layout handles window resizing fine.

Now I'm working through mouse event handling: mousedown on the grid body finds the target cell, commits any active edit, and updates selection, while dblclick starts editing the cell with the caret placed at the end.

I'm deciding header clicks should jump selection to A1 of that column or row A for a row header, keeping it simple, and making sure clicking during an edit commits first before selecting the new cell. I'm leaving out drag-selection and default-preventing on mousedown since we don't rely on native focus behavior, and I'm adding scrollIntoView with nearest alignment plus scroll-padding CSS so sticky headers don't obscure the selected cell.

I'm wiring up the formula bar and name box to reflect the current selection unless the formula bar itself is focused, defining move/startEdit helpers for arrow keys, typing, and F2, and now starting to write the full HTML document with its base styles and color variables.

Writing HTML boilerplate and CSS variables...

Still writing spreadsheet styles...

Adding more cell styles...

Assigning distinct colors to each reference set, then styling the editable input overlay to match the cell it's replacing, with a border using the accent color and transparent background.

For editing state, I'm hiding the cell's value span so innerText extraction works cleanly when reading back the edited content. I'm also laying out a status bar with flex spacing for cell info and a small sheet tab indicator.

Now I'm starting the JavaScript, setting up grid constants (26 columns, 100 rows), a storage key, and an error message lookup table for things like division by zero and reference errors.

I'm defining a custom error class for formula errors, then setting up the core state arrays tracking raw input, parsed formulas, parse error flags, computed values, and dependency sets for each cell, along with address conversion helpers for translating between spreadsheet notation and array indices.

I'm writing the number formatting function, rounding to ten significant digits and handling edge cases like negative zero and scientific notation for very large numbers.

Now I'm building the display function that converts cell values to strings based on their type, plus a literal parser that detects numbers, booleans, and plain text from raw input strings.

I'm defining the supported functions with their argument count ranges and writing a column-letter-to-index converter along with a regex for matching cell references with optional dollar-sign anchors. Now I'm starting the tokenizer function.

Writing tokenizer logic...

Confirming that "ABCD1" resolves correctly through alt2. Now I'm writing the tokenizer logic for booleans and cell references, parsing out the column and row indices and checking bounds.

Now I'm handling tokenizing the remaining operators, checking for two-character comparisons first and then single-character operators and punctuation, throwing an error for any unrecognized character before returning the token list.

Next I'm writing the formula parser, which strips the leading equals sign, tokenizes the rest, and tracks a position pointer along with a set of referenced cell indices. I need to build helper functions for peeking at tokens and checking operators, plus a way to turn a parsed cell reference into a node that flags out-of-range references as bad so evaluation can return a REF error, while valid references get added to the tracked set.

Building recursive descent functions for comparisons, concatenation, addition, multiplication, unary operators, and exponentiation...

Writing primary expression parser...

Still writing parser logic...

Finishing the range object with its flag, then adding validation that function calls match expected argument counts before throwing on mismatches. Finally I check that parsing consumes all tokens and return the resulting AST with its reference list, confirming empty input correctly errors out at the primary parser.

Now I'm writing the evaluator helpers for coercing values to numbers and text, handling errors, nulls, booleans, and strings appropriately. Then I'm building the node evaluator that dispatches on literal, reference, range, unary, binary, and call node types, treating standalone ranges as a value error and propagating reference errors and error objects through unary operations.

Now I'm defining the binary operator evaluator: concatenation coerces both sides to text, comparisons delegate to a compare function, and arithmetic coerces both sides to numbers, handling division by zero, zero raised to a negative power, and overflow results all as appropriate error codes, while errors from either operand short-circuit the result.

For compare, I'm propagating errors first, then normalizing nulls to the empty string, false, or zero depending on the other operand's type, then ranking values so numbers sort below text which sorts below booleans, comparing text case-insensitively and booleans/numbers with ordinary less-than logic.

For evalCall, I'm handling aggregate functions like SUM, AVERAGE, MIN, MAX, and COUNT by collecting numeric values from the arguments and propagating any error encountered, then moving to IF where I evaluate the condition, propagate errors, coerce null/boolean/number results into a truthy check, and return VALUE! for anything else before branching on the result.

Then I'm building out ABS and ROUND: ABS just coerces to a number and applies Math.abs with error propagation, while ROUND handles the digit count, truncates it, and applies a half-away-from-zero rounding scheme with a precision correction to avoid floating point artifacts before scaling back down.

Now I'm writing a collect helper that walks through arguments, flattening ranges into numeric arrays while propagating errors unless in count mode, and handling booleans so they count directly when passed as literal arguments but get ignored when they come from a range, matching Excel's behavior for functions like COUNT and SUM.

Next I'm sketching the aggregate functions themselves — SUM just totals, AVERAGE divides by length with a DIV0 guard, MIN/MAX need a manual loop instead of spreading to avoid argument-limit issues, and COUNT just returns the length of the collected numbers.

Then I start writing the main evalCell function, checking for empty strings, literal values, and whether the cell content begins with an equals sign to trigger formula evaluation.

Now I'm defining setRaw, which updates the raw text for a cell, clears out old dependency edges, reparses the formula if present while catching syntax errors as cell errors, rebuilds the precedent/dependent sets, triggers a recalculation, and persists state. I'm also starting the recalc function, which gathers an affected-cells set and a queue to propagate changes through the dependency graph.

Writing topological sort logic...

Checking edge cases around dependency ordering and affected-node tracking, then moving to the render function that updates cell styling based on value type (error, number, boolean, text).

Now I'm writing the save function for localStorage persistence, serializing only non-empty raw cell values keyed by address.

For loading, I'm parsing the saved JSON and restoring values into the raw array, validating indexes with a bounds check. I'm also writing the address parser to convert a string like "AB12" into its column/row index using a regex match.

I'm refactoring so setRaw clears dependencies before reparsing a cell, then recalculating only the affected index and saving, while initial load parses and recalculates all cells at once — making sure the DOM grid is built first so recalc has table cells to render into.

Writing grid DOM markup...

Now I'm setting up the tds, rowHeaders, and colHeaders arrays by querying the built grid, confirming the row-major ordering lines up with index math, and verifying that data-cell attributes and innerText reads work correctly through the span elements.

Writing selection state logic...

I'm also sketching out the edit mode, starting with a function that creates an input element over the selected cell, carrying forward the initial text and setting up its styling attributes.

Writing edit key handler...

Finishing commitEdit logic...

I'm also checking whether removing a focused input element triggers a blur event — it doesn't reliably in Chrome, and since there's no blur handler attached anyway, it shouldn't matter here.

For cancelEdit, I need to remove the input element, clear the edit cell class and reference highlighting, reset the edit state, and sync the formula bar back to the raw value. After committing, focus naturally falls back to the body, so the document-level keydown listener should still pick up subsequent key presses fine without extra handling.

Now I'm wiring up the formula bar's own keydown behavior: Enter commits the current cell's raw value and moves selection down, while Escape reverts the formula bar to the original raw value and clears any highlighted references — I need to make sure this stays in sync with the active cell editor if one is open.

I'm working through the tricky focus interactions between the formula bar and cell editing: focusing the formula bar should commit any in-progress cell edit first, typing in the formula bar should highlight referenced cells just like typing in a cell editor does, and blurring the formula bar should clear those highlights — but I need to be careful that clicking directly on another cell while the formula bar is focused doesn't break the commit-then-select ordering, since mousedown will shift focus before the click handler runs.

Still writing mousedown/dblclick handlers...

Now I'm adding keyboard navigation at the document level, skipping input/textarea targets and handling arrow key movement between cells.

I should skip ctrl+x handling for now, and make sure the document-level keydown listener returns early when editing is active, since the input's own keydown handler already deals with those events and the bubbled event shouldn't be double-processed.

Space key should start an edit with a space character typed in, and Delete should clear the current cell's raw value. I'm also defining a move function for arrow key navigation that clamps row/column to valid bounds and updates the selection.

Now I'm working through copy/paste: copy stores the current cell's raw value and index, and paste computes the row/column offset between source and destination to shift any formula references accordingly before writing the new raw text. I'm writing the formula-shifting logic that parses out quoted strings versus cell references and adjusts column/row indices based on whether they're relative or absolute (marked with $)... Still writing parser...

I'm also checking edge cases like out-of-bounds references defaulting to an invalid "A0" token, and making sure something like "1E5" doesn't get mistakenly matched as a cell reference since the preceding character class would include the digit.

Now I'm writing the function to clear and apply reference highlighting, tracking which table cells have highlight classes so they can be removed before reapplying new ones based on parsed formula tokens.

Duplicate class additions are harmless since removal is idempotent, and I'm adding an outline style per rank class for visual highlighting of referenced ranges.

For ranges, outlining each cell individually creates a grid effect across the selection, which is acceptable, though adding a subtle background tint alongside the outline would look cleaner. I'm also checking that tokenizing handles partial formulas safely and that range detection via the colon operator between tokens works correctly.

For the status bar, I'll keep it simple: a left-side message showing state like "Ready," "Editing," or "Copied A1," and a right side showing filled cell count plus the sheet name, skipping more complex selection statistics like sum or average for now.

I'm realizing scrollIntoView could accidentally scroll the whole page body since overflow is hidden, which would shift the layout and lose the top bar visually. I should write a custom ensureVisible function that calculates scroll position manually within the grid wrapper instead of relying on the browser's default scrolling behavior.

I'm confirming offsetTop correctly accounts for the table's position within wrap with border-spacing zero, and double-checking that giving td position:relative doesn't make it its own offsetParent—since offsetParent must be an ancestor, not itself.

Since the table itself is static and the td is positioned, the table isn't chosen as offsetParent, so it resolves to the wrap element as expected. To double-check this safely, I'll just compare bounding rectangles between the td and the wrap directly rather than relying on offsetParent semantics.

I'm now working through the layout details: computing content-relative positions accounting for sticky headers, setting header row height to 24px and row-header width to 48px, confirming scroll-into-view works without scrolling the body, and setting an explicit table width with column widths (100px per column, 48px for the first).

Writing sticky header and cell styles...

Adding more cell styling...

Overflow shouldn't matter for the editing cell. For reference highlight styling, I'm reconsidering using outline instead of box-shadow to avoid conflicts with selection styling, since both might apply simultaneously.

I'm also adding polish details: a topbar with the app name and column/row count subtitle, keyboard hints on the right, plus the formula bar and status bar. I'll skip extras like syntax coloring or header double-click actions to keep scope reasonable.

Now I'm double-checking edge cases around focus and key handling—making sure Enter and typing behave correctly whether the grid or formula bar has focus, that Delete doesn't leave focus in a weird state, and that starting an edit properly syncs selection before focusing the input so the cursor lands on the right cell.

I'm also reviewing display formatting (null/undefined collapsing to empty string), confirming recalculation correctly propagates through affected cells and handles bad formula references gracefully, and checking that per-cell dependency sets won't cause memory issues even at thousands of cells.

Writing parseInto function...

I'm confirming raw values default to empty strings across the array, then setting up the initial load to parse every cell's formula before running one full recalculation pass over all of them.

I'm checking that the function registry properly guards against prototype pollution by using uppercase-only matching, and sketching out how string literals and concatenation should tokenize correctly in formulas like `="a"&1`.

Now I'm verifying arithmetic edge cases: floating point rounding for `0.1+0.2`, operator precedence and right-associativity for exponents like `2^3^2`, negative exponent handling, and division by zero producing a DIV error. I'm also confirming that cell reference parsing correctly distinguishes valid refs like A1 from out-of-range ones like A101 or AA1, and that text cells display their raw string while formulas referencing them propagate values or VALUE errors appropriately. Finally, I'm starting to trace through a circular reference scenario where A1 and B1 reference each other.

With B1 indeg 0 and A1 indeg 1, the order resolves to B1 then A1, correctly computing A1=5, confirming the Kahn's algorithm logic for decrementing dependents works as intended. Now I should check edge cases like formulas referencing ranges that include their own cell.

A self-referencing range like A3's formula summing a range containing A3 creates a self-loop in the dependency graph, giving it indegree 1 from itself so it never becomes ready and correctly gets flagged as part of a cycle. That satisfies the requirement that every cell in a cycle shows the cycle status.

Now I'm handling the save counter and status display, making sure copy-paste shortcuts only fire when not actively editing, and verifying cell navigation after pressing Enter works correctly from the formula bar. I also want keyboard input to work without explicit grid focus by relying on the document-level listener, checking that the event target falls back to the body tag when nothing else has focus.

Writing the final HTML structure now, starting with the page body and header...

Now I'm wiring up header click handlers for selecting rows and columns, and double-checking that editing commits properly when clicking elsewhere on the grid. I'm also cleaning up the number formatting function to handle precision and edge cases like negative zero, and setting up the status bar to show a count of filled cells. Writing the full implementation now...

Finishing selection logic...

Writing ensureVisible scroll math...

But I realize offsetTop/offsetLeft are only accurate relative to the wrap container if offsetParent is actually wrap — need to verify that assumption holds.

Instead I'll compute positions using getBoundingClientRect for both the cell and the table itself, since those deltas stay consistent regardless of scroll position, which is more robust. I'll also set focus on the input with preventScroll to avoid unwanted jumping when editing starts.

Filtering out multi-character key names like 'Dead' so only single-character keys trigger cell typing, confirming the '=' key works correctly for starting formulas, and adding status messages for things like copy actions. I think the logic is solid now, so I'll write the final implementation.

