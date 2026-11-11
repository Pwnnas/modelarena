# Task: Keystone — a parametric 2D CAD sketcher & constraint solver

Build an interactive 2D parametric CAD sketcher where users draw geometric entities, apply dimensional and geometric constraints, and drag parts of the sketch while a numerical solver maintains all constraints in real time.

## Ground rules

- Deliver **one file: `index.html`** with all HTML, CSS and JavaScript inline.
- **No external resources of any kind**: no CDNs, libraries, frameworks, web fonts or remote images. Every algorithm (including the numerical constraint solver) must be written by you in code. Network access is blocked during grading.
- Target: latest desktop Google Chrome at a 1280×800 viewport; adapt to window resizing.
- No errors in the console. Never use `alert`, `confirm` or `prompt`.
- The page starts with an empty `localStorage` (fresh browser profile).
- You are scored two ways:
  1. **Automated grader**: a headless browser drives your page through the *Grader contract* below, using real mouse and keyboard input, and measures geometric accuracy, solver convergence, interaction and performance. Follow the contract exactly (ids, attributes and names are case-sensitive).
  2. **Blind human judging**: your page is shown side by side with other submissions; people use both and pick the better one on visual clarity, CAD-like precision, smooth dragging and overall feel.

## Requirements

### Workspace & Coordinate System
- A full-viewport `<canvas>` workspace with an infinite grid, origin axes $(0,0)$, pan and zoom.
- Initially, world origin $(0,0)$ is at the exact center of the `<canvas>`, and scale is **1 world unit = 1 CSS pixel**, with $+x$ right and $+y$ down (matching standard screen direction).
- Middle-drag (or Space + left-drag) pans the view; mouse wheel zooms around the cursor.

### Entities & Drawing Tools
- **Select / Move tool** (`[data-tool="select"]`, active initially):
  - Click an entity (point, segment, or circle perimeter) to select it.
  - **Shift+click** toggles entities in and out of a multi-selection.
  - Clicking empty space clears the selection.
  - **Left-drag** on any point moves it in real time, continuously running the constraint solver so connected geometry reacts smoothly like a physical linkage.
- **Point tool** (`[data-tool="point"]`): click on the canvas to place a free point.
- **Line tool** (`[data-tool="line"]`): click once for the start point, click again for the end point, creating two points and a line segment between them. If a click is within **12 px** of an existing point, **snap** to and reuse that existing point instead of creating a duplicate.
- **Circle tool** (`[data-tool="circle"]`): click once for the center point (snapping within 12 px if near an existing point), click again to set the radius.
- Pressing `Escape` cancels an in-progress drawing operation or clears the current selection.
- Pressing `Delete` or `Backspace` deletes selected entities and any constraints attached to them.

### Parametric Constraints & Numerical Solver
Users can select entities and apply constraints from the toolbar. When a constraint is added or a point is dragged, your solver (e.g. Levenberg–Marquardt, Gauss–Newton, BFGS, or high-iteration Position-Based Dynamics) must minimize constraint error to within **$10^{-3}$ world units / degrees**:

1. **Coincident** (`[data-constraint="coincident"]`): requires 2 selected points. Locks them to the exact same $(x, y)$ position (or merges them).
2. **Horizontal** (`[data-constraint="horizontal"]`): requires 1 selected line segment (or 2 points). Forces $y_1 = y_2$.
3. **Vertical** (`[data-constraint="vertical"]`): requires 1 selected line segment (or 2 points). Forces $x_1 = x_2$.
4. **Parallel** (`[data-constraint="parallel"]`): requires 2 selected line segments. Forces their directions to be parallel ($\vec{u} \times \vec{v} = 0$).
5. **Perpendicular** (`[data-constraint="perpendicular"]`): requires 2 selected line segments. Forces a $90^\circ$ angle ($\vec{u} \cdot \vec{v} = 0$).
6. **Equal** (`[data-constraint="equal"]`): requires 2 selected line segments (equal length) or 2 circles (equal radius).
7. **Fix** (`[data-constraint="fix"]`): requires 1 selected point. Locks its $(x, y)$ coordinates at their current values.
8. **Distance / Length** (`[data-constraint="distance"]`): requires 1 line segment or 2 points. Constrains the Euclidean distance between them to the numeric value read from `#dimension-input`.
9. **Radius** (`[data-constraint="radius"]`): requires 1 circle. Constrains its radius to the value in `#dimension-input`.
10. **Angle** (`[data-constraint="angle"]`): requires 2 line segments. Constrains the interior angle between them (in degrees, $0\text{–}180$) to the value in `#dimension-input`.
11. **Point-on-Object** (`[data-constraint="point-on-object"]`): requires 1 point and 1 line segment (or circle). Forces the point to lie on the infinite line (or circle perimeter).

### Degrees of Freedom (DOF) & Solver Status
- Track the sketch's **Degrees of Freedom (DOF)**:
  - Each independent point adds 2 DOF; each circle adds 1 DOF for its radius (plus 2 for its center point).
  - Subtract the rank / number of independent scalar equations removed by active constraints (e.g., Fix removes 2; Coincident removes 2; Horizontal, Vertical, Parallel, Perpendicular, Equal, Distance, Radius, Angle, Point-on-Object each remove 1).
- Detect solver state:
  - `'under'`: solver converged (max error $\le 10^{-3}$), and $\text{DOF} > 0$.
  - `'fully'`: solver converged (max error $\le 10^{-3}$), and $\text{DOF} = 0$ (where at least one entity exists).
  - `'over'`: conflicting constraints where the solver cannot converge (residual error $> 10^{-2}$), or redundant/conflicting constraints drive effective DOF below 0.
- Display the current DOF and status clearly in the UI. Color-code geometry (e.g. blue for under-constrained, green for fully constrained, red for conflicting/over-constrained).

### History & Persistence
- **Undo / Redo**: `Ctrl+Z` (or `Cmd+Z`) and `Ctrl+Y` / `Ctrl+Shift+Z` step backward and forward through sketch modifications.
- **Clear** (`#clear`): resets the sketch to empty.
- Automatically save the sketch (entities and constraints) to `localStorage` and restore it on reload.

### Polish (judged by humans)
- Looks and feels like a modern precision CAD tool (Shapr3D, Onshape, Linear-style dark/light UI): crisp anti-aliased rendering, clear constraint badges/icons next to lines, callout leaders with editable dimension labels, hover highlights, snap indicators, and buttery 60 FPS kinematic dragging.

## Grader contract

1. Full-viewport `<canvas id="cad-canvas">`.
2. Tool buttons: `<button data-tool="select">`, `<button data-tool="point">`, `<button data-tool="line">`, `<button data-tool="circle">` with `aria-pressed="true"` on the active tool.
3. Constraint buttons: `<button data-constraint="coincident">`, `horizontal`, `vertical`, `parallel`, `perpendicular`, `equal`, `fix`, `distance`, `radius`, `angle`, `point-on-object`. Clicking a constraint button applies that constraint to the currently selected entities and triggers the solver.
4. `#dimension-input`: an `<input type="number">` whose current value is used when applying `distance`, `radius`, or `angle` constraints. If a user selects an existing dimensional constraint (or the entity it constrains) and changes `#dimension-input` (firing `input`/`change`), that constraint's target value updates and re-solves immediately.
5. `#clear`: `<button>` that clears all entities and constraints and resets the view to default (origin at canvas center, zoom = 1).
6. `#status`: an element with `data-dof="<integer>"` and `data-state="under"|"fully"|"over"`.
7. `window.__arena` exposes:
   - `getState()` returning:
     ```js
     {
       points: [{ id: string, x: number, y: number, fixed: boolean }],
       lines: [{ id: string, p1: string, p2: string }], // p1, p2 are point ids
       circles: [{ id: string, center: string, r: number }], // center is a point id
       constraints: [{ id: string, type: string, entities: string[], value?: number }],
       dof: number,
       status: 'under' | 'fully' | 'over',
       maxError: number // maximum scalar residual across all active constraints
     }
     ```
      note: If `coincident` merges two points into one, either keep both point records at identical $(x,y)$ or merge them and update `p1`/`p2` references—both are accepted as long as `dof` and coordinates are accurate.
   - `screenToWorld(clientX, clientY)` → `{ x: number, y: number }` and `worldToScreen(x, y)` → `{ x: number, y: number }` (in viewport CSS pixels matching `MouseEvent.clientX/Y`).
   - `select(ids: string[])`: programmatically sets the selection to the given entity/constraint IDs.
   - `solve()`: runs the constraint solver to convergence immediately and returns `{ converged: boolean, maxError: number }`.
