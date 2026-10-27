# Task: Vectorly — a vector drawing editor

Build a small but genuinely usable vector design tool in the browser, in the spirit of
Figma/Illustrator basics: draw, select, move, resize, style, undo, zoom, export.

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

### Layout
- A toolbar, a large drawing stage (the canvas area), and a properties panel showing the
  selected shape's x, y, width, height, fill, stroke and stroke width (editable).

### Tools & drawing
- Tools: **Select** (V), **Rectangle** (R), **Ellipse** (E), **Line** (L). The keyboard
  shortcuts switch tools; the active tool is clearly indicated.
- With Rectangle/Ellipse, press–drag–release on the stage creates a shape whose bounding box
  spans from the press point to the release point, in any drag direction. Holding **Shift**
  during the drag constrains to a square/circle (side = the larger of |dx| and |dy|).
- With Line, the line goes from the press point to the release point; Shift snaps the angle
  to 45° increments.
- Drags shorter than 3 px create nothing.
- After a shape is drawn it becomes the (only) selected shape, and the tool switches back to
  Select.
- A live preview of the shape is shown while dragging.
- New shapes use the current style (fill, stroke, stroke width).

### Selection & manipulation
- With Select: clicking a shape selects it (deselecting others); **Shift+click** toggles a
  shape in/out of the selection; clicking empty stage clears the selection; dragging on
  empty stage draws a marquee that selects every shape whose bounding box intersects it.
- Selected shapes show a selection outline. A single selected shape shows 8 resize handles.
- Dragging any selected shape moves all selected shapes.
- Dragging a handle resizes: the opposite corner/edge stays fixed; Shift keeps aspect ratio.
- Arrow keys nudge the selection by 1 px (Shift+Arrow: 10 px).
- **Delete**/**Backspace** deletes the selection. **Ctrl/Cmd+A** selects all.
  **Ctrl/Cmd+D** duplicates the selection (offset by 10 px, duplicates become selected).
- `]` brings the selection forward one step, `[` sends it backward.
- Optional but valued: smart guides / snapping to other shapes' edges and centers.

### Undo / redo
- **Ctrl/Cmd+Z** undo; **Ctrl/Cmd+Shift+Z** and **Ctrl/Cmd+Y** redo. Support both Ctrl and Cmd.
- Covers create, move (one drag = one step), resize, delete, duplicate, nudge, z-order and
  style changes. At least 100 steps.

### Style
- Fill color, stroke color and stroke width controls apply to all selected shapes (and become
  the style for new shapes).

### Zoom & pan
- **Ctrl/Cmd + mouse wheel** (and trackpad pinch, which arrives as wheel + ctrlKey) zooms
  around the cursor, 10%–800%. Show the zoom level. Space+drag or middle-drag pans.
- Drawing, selecting, moving and resizing must work correctly at any zoom/pan.

### Export & persistence
- An export button downloads `drawing.svg`: a valid standalone SVG (with `xmlns`) containing
  only the shapes, with no UI, handles, background or grid.
- The document autosaves to `localStorage` and is restored on reload.

### Polish (judged by humans)
- A clean, modern design-tool look: tidy toolbar with clear icons, good hover/active states,
  precise selection chrome, sensible cursors, a subtle stage background.
- Smooth, responsive direct manipulation (no lag, no jumping), crisp rendering at any zoom.

## Grader contract

1. The stage is an `<svg id="stage">`, at least 600×400 CSS px.
2. Every user shape is exactly one element inside `#stage` with
   `data-shape="rect" | "ellipse" | "line"` and a unique `data-id`. No other element may carry
   a `data-shape` attribute (not previews, not handles).
3. The rendered geometry of a shape element must match the shape: the grader compares
   `element.getBoundingClientRect()` with the mouse coordinates it used (± 5 px). The fill
   and stroke must be set on the `data-shape` element itself (attribute or style), so
   `getComputedStyle(el).fill` and `.strokeWidth` reflect them.
4. Selected shape elements have `data-selected="true"`; unselected ones have no such attribute
   (or `"false"`).
5. Tool buttons: `[data-tool="select"]`, `[data-tool="rect"]`, `[data-tool="ellipse"]`,
   `[data-tool="line"]`.
6. When exactly one shape is selected, its resize handles are elements with
   `data-handle="nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"`, centered on the matching
   corner/edge midpoint of the shape's bounding box. Press-dragging a handle resizes.
7. Style inputs: `<input type="color" id="fill-color">`, `<input type="color" id="stroke-color">`,
   `<input type="number" id="stroke-width">`. Changes arrive as `input` and/or `change` events.
8. Export button: `#export-svg`. It must trigger a real file download named `drawing.svg`
   (e.g. a Blob URL on an `<a download="drawing.svg">`).
9. Keyboard shortcuts are handled at the document level (they must work right after mouse
   interaction on the stage, without clicking anything else first), except while typing in a
   text/number input.
