# Task: Tally — a personal-finance ledger built from real data

Build a polished single-file ledger app around the transaction data shipped in this task's
workspace folder. The star of the show is **data fidelity**: the app must present exactly
the transactions and budgets provided, with correct totals, filtering, search and sorting.

## Ground rules

- Deliver **one file: `index.html`** with all HTML, CSS and JavaScript inline.
- **No external resources of any kind**: no CDNs, libraries, frameworks, web fonts or remote
  images. Network access is blocked during grading.
- The workspace folder next to this PROMPT.md contains:
  - `data/transactions.csv` — 96 transactions, columns `id,date,description,category,amount`
    (signed decimal amounts: income positive, expenses negative; some descriptions contain
    commas, quotes or non-ASCII characters and are CSV-quoted).
  - `data/budgets.json` — spending limits per category for the whole period.

  **Read these files with your tools and embed the data in `index.html`.** The graded page
  cannot fetch them at runtime. If you cannot read the files, still build the app with
  sample data of your own: the UI checks are scored on whatever data your page renders,
  but the data-fidelity, totals and budget checks require the exact file contents.
- Target: latest desktop Google Chrome at a 1280×800 viewport; adapt to window resizing.
- No errors in the console. Never use `alert`, `confirm` or `prompt`.
- You are scored two ways: an automated grader drives the page with real mouse and keyboard
  input (follow the *Grader contract* exactly — ids and attributes are case-sensitive), and
  blind human judging compares visual design and feel side by side with other submissions.

## Requirements

### Summary cards
- `#total-income` — sum of all positive amounts.
- `#total-expenses` — sum of all negative amounts, shown as a **positive** number.
- `#net` — income minus expenses, signed.
- All three show currency with exactly two decimals (a `$` prefix and thousands separators
  are welcome; the grader parses the number out of the text).

### Transaction table
- `#tx-table` lists **every** transaction as `tr[data-tx="<id>"]`, initially in CSV order
  (date ascending). Cells: `td[data-field="date"]` (YYYY-MM-DD), `td[data-field="description"]`
  (exact text, unescaped), `td[data-field="category"]`, `td[data-field="amount"]`.
- Amounts show two decimals; expenses carry a minus sign, income may carry a plus.
- `#tx-count` shows how many rows are currently visible, as text starting with the number
  (e.g. "96 transactions").

### Filtering and search
- `#category-filter` is a `<select>` with an option `value="all"` (label like "All
  categories") plus one option per category present in the data, `value` = exact category
  name. Selecting filters the table.
- `#search` is a text input; it filters by case-insensitive substring of the description.
  It combines with the category filter (both must match).
- `#ledger-empty` is visible only when the current filter + search match nothing.

### Sorting
- `th[data-sort="date"]` and `th[data-sort="amount"]` are clickable. First click sorts
  ascending, second click descending, then toggles. Sorting applies to the currently
  filtered rows; amounts sort numerically (not lexicographically), dates chronologically.

### Budgets
- For each category in `budgets.json` → `limits`, render an element
  `[data-budget="<category>"]` showing the category name, the total spent (sum of that
  category's expenses as a positive number over the whole period) and the limit, plus a
  progress bar.
- Contract attributes: `data-spent` and `data-limit` with the exact numbers (two decimals),
  and `data-over="true"` when spent exceeds the limit. Inside, an element `.bar-fill` whose
  width is `min(100, spent / limit × 100)`% of its bar track (±3 percentage points).

### Polish (judged by humans)
- A premium fintech feel: clean typography, a considered light theme, sensible density,
  readable numbers (tabular figures), subtle color for income vs expense, over-budget
  states that communicate without shouting.

## Grader contract

1. Summary cards `#total-income`, `#total-expenses`, `#net` contain parseable numbers
   (currency symbols and separators are stripped before parsing).
2. Table rows are `tr[data-tx]` with the four `td[data-field]` cells; `#tx-count` starts
   with the visible row count.
3. `#category-filter` is a `<select>`; setting its value and firing `change` filters the
   table. `#search` reacts to `input` events.
4. `th[data-sort="date"]` / `th[data-sort="amount"]` toggle asc/desc on click.
5. Budget cards are `[data-budget]` with `data-spent`, `data-limit`, optional
   `data-over="true"`, and a `.bar-fill` child sized as described.
6. `#ledger-empty` is hidden (removed, `display:none` or `hidden`) whenever at least one
   row is visible.