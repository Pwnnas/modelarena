This is a complex task to build a vector drawing editor in a single HTML file. Let me plan out the architecture:

1. **Layout**: Toolbar on top/left, SVG stage in center, properties panel on right
2. **Core data model**: Array of shapes with id, type, x, y, width, height, fill, stroke, strokeWidth, z-order
3. **Tools**: Select, Rectangle, Ellipse, Line
4. **Selection**: Single/multi select, marquee, handles
5. **Manipulation**: Move, resize, nudge, delete, duplicate, z-order
6. **Undo/Redo**: Command pattern with state snapshots
7. **Zoom/Pan**: Transform the SVG viewBox or use a group transform
8. **Export**: Generate SVG string, download as blob
9. **Persistence**: localStorage autosave

Key design decisions:
- Use SVG for the stage (required by contract)
- Shapes stored as JS objects, rendered as SVG elements
- For zoom/pan, I'll use a viewBox approach or a transform group
- Selection handles rendered as separate SVG elements (not with data-shape)
- Undo/redo using state snapshots (simpler and more reliable)

Let me think about the grader contract carefully:
1. `<svg id="stage">` at least 600×400
2. Shapes have `data-shape` and `data-id` - NO other element can have `data-shape`
3. `getBoundingClientRect()` must match mouse coordinates - this means the shapes need to be rendered at the correct position accounting for zoom/pan
4. Selected shapes have `data-selected="true"`
5. Tool buttons with `data-tool` attribute
6. Resize handles with `data-handle` attribute
7. Style inputs with specific ids
8. Export button with id `export-svg`
9. Keyboard shortcuts at document level

For the zoom/pan approach, I think using a `<g>` transform is cleaner than viewBox manipulation because it keeps the SVG coordinate system simple. But wait - if I use a transform, `getBoundingClientRect()` will still return the correct screen position, so that should work.

Actually, let me think about this more carefully. The grader says "the rendered geometry of a shape element must match the shape: the grader compares element.getBoundingClientRect() with the mouse coordinates it used (± 5 px)."

So if the grader clicks at (200, 300) on the stage and drags to (400, 500), the resulting shape's bounding rect should be approximately at that position. This means I need to convert screen coordinates to SVG coordinates properly.

Let me use a transform group approach:
- The SVG has a fixed size (filling the stage area)
- Inside, there's a `<g>` with a transform for pan/zoom
- Shapes are drawn in "world" coordinates
- To convert screen to world: subtract the pan offset and divide by zoom

Actually, let me reconsider. Using viewBox might be simpler:
- Set viewBox to reflect the current zoom and pan
- This way, the SVG coordinates directly correspond to world coordinates
- getBoundingClientRect() will automatically reflect the zoomed/panned position

Wait, but if I use viewBox, the shapes' getBoundingClientRect will be in screen pixels, which is what the grader expects. So viewBox approach works.

Let me go with:
- SVG fills the stage area
- viewBox is adjusted for zoom/pan
- Shapes are in world coordinates
- To convert mouse to world: use SVG's getScreenCTM() or compute from viewBox

Actually, the simplest approach:
- Keep the SVG element sized to fill the stage
- Use a `<g id="viewport">` with transform for zoom/pan
- Convert mouse events to world coordinates by inverting the transform

Let me think about the coordinate conversion:
- Mouse position relative to SVG element: (mouseX, mouseY)
- World position: ((mouseX - panX) / zoom, (mouseY - panY) / zoom)

Where panX, panY, zoom are the transform parameters.

For getBoundingClientRect to match mouse coordinates:
- If I draw a shape at world (100, 200) with zoom=1 and pan=(0,0), the shape appears at screen (100, 200) relative to the SVG element
- getBoundingClientRect() gives position relative to viewport
- So I need to account for the SVG element's position in the page

The grader likely accounts for this by using the SVG element's bounding rect as reference. Let me make sure my coordinate system is consistent.

Let me now write the code:

```html
<!DOCTYPE html>
<html>
<head>
<style>
/* ... styles ... */
</style>
</head>
<body>
<!-- toolbar -->
<!-- stage -->
<!-- properties panel -->
<script>
// ... all the logic ...
</script>
</body>
</html>
```

Let me structure the JavaScript:

```javascript
// State
let shapes = []; // array of shape objects
let selectedIds = new Set();
let currentTool = 'select';
let zoom = 1;
let panX = 0;
let panY = 0;
let currentStyle = { fill: '#4A90D9', stroke: '#333333', strokeWidth: 2 };
let undoStack = [];
let redoStack = [];
let maxUndo = 100;

// Shape object: { id, type, x, y, width, height, fill, stroke, strokeWidth }
// For lines: x, y is start point, width is dx, height is dy (or use x1,y1,x2,y2)
```

Wait, for lines I need to think about what "bounding box" means. A line from (0,0) to (100,50) has a bounding box of (0,0,100,50). I'll store lines as x,y (start) and width,height (delta, can be negative). The bounding box will be the normalized rect.

Actually, for consistency with the resize handles, let me store all shapes with their bounding box (x, y, width, height where width and height are always positive), and for lines I'll also store the direction (which corner to which corner).

Hmm, this is getting complex. Let me simplify:
- Rect: x, y, width, height (top-left corner, positive dimensions)
- Ellipse: x, y, width, height (bounding box, positive dimensions)  
- Line: x1, y1, x2, y2 (start and end points)

For the bounding box of a line: min(x1,x2), min(y1,y2), abs(x2-x1), abs(y2-y1)

For resize handles on a line, I'll just have the two endpoints as handles... but the contract says 8 handles. Let me think...

The contract says "A single selected shape shows 8 resize handles." For lines, I could show 8 handles that resize the bounding box, and the line would follow. Or I could just show 2 endpoint handles for lines. But the contract is specific about 8 handles with specific names.

I'll go with: for all shapes including lines, show 8 handles. For lines, resizing the bounding box changes the line endpoints proportionally.

Actually wait, re-reading the contract: "When exactly one shape is selected, its resize handles are elements with data-handle..." - it says "its" referring to the shape. So for a line, I should still show 8 handles? That seems odd but let's follow the contract.

Let me store lines as x, y, width, height where (x,y) is the top-left of the bounding box, and I'll also store a `flipX` and `flipY` to indicate which direction the line goes. So a line from top-left to bottom-right has flipX=false, flipY=false. From top-right to bottom-left has flipX=true, flipY=false.

Actually, let me just store lines with x1, y1, x2, y2 and compute the bounding box when needed. For the handles, I'll map the 8 handle positions to the bounding box and resize the line accordingly.

Let me reconsider the data model:

```javascript
// For rect and ellipse:
{ id, type: 'rect'|'ellipse', x, y, width, height, fill, stroke, strokeWidth }

// For line:
{ id, type: 'line', x1, y1, x2, y2, fill: 'none', stroke, strokeWidth }
```

For the bounding box of a line:
```javascript
function getBBox(shape) {
  if (shape.type === 'line') {
    const x = Math.min(shape.x1, shape.x2);
    const y = Math.min(shape.y1, shape.y2);
    const w = Math.abs(shape.x2 - shape.x1);
    const h = Math.abs(shape.y2 - shape.y1);
    return { x, y, width: w, height: h };
  }
  return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
}
```

For the SVG rendering:
- rect: `<rect x="" y="" width="" height="">`
- ellipse: `<ellipse cx="" cy="" rx="" ry="">`
- line: `<line x1="" y1="" x2="" y2="">`

Now, for the grader's check of getBoundingClientRect:
- For a rect at (100, 200) with width 150 and height 80, at zoom 1 and pan (0,0):
  - The rect element's bounding rect should start at approximately (100 + svgLeft, 200 + svgTop)
  - Width 150, height 80

This should work naturally with SVG rendering.

Let me now write the full implementation. I'll be thorough but try to keep it organized.

One important thing: the grader says "No other element may carry a data-shape attribute (not previews, not handles)." So I need to make sure my preview shapes and handle elements don't have data-shape.

For the preview during drawing, I'll render a temporary shape without data-shape, or I'll just draw it in a separate overlay layer.

Let me plan the SVG structure:
```svg
<svg id="stage">
  <g id="viewport" transform="...">
    <g id="shapes-layer">
      <!-- shapes with data-shape -->
    </g>
    <g id="preview-layer">
      <!-- preview shape during drawing (no data-shape) -->
    </g>
    <g id="selection-layer">
      <!-- selection outlines, handles with data-handle -->
    </g>
  </g>
</svg>
```

Wait, but the handles need to be positioned relative to the shapes. If I put them in the viewport group, they'll zoom with the shapes. That's actually what I want for the visual, but the handles should stay a fixed size on screen. Let me think...

Actually, for simplicity and to match the grader's expectations, let me put handles in the viewport group and scale them inversely. Or better: I'll compute handle positions in world space but make their size inversely proportional to zoom.

Hmm, actually the simplest approach: render handles in a separate layer that's NOT in the viewport group, and compute their screen positions manually. But that's more complex.

Alternative: keep handles in the viewport group, and set their size to `handleSize / zoom` so they appear constant size on screen. The positions will be in world coordinates.

Let me go with that approach.

Now let me think about the undo/redo system. I'll use a simple state snapshot approach:
- Before each action, push a deep copy of the shapes array to the undo stack
- Clear the redo stack
- On undo: push current state to redo, pop from undo, restore
- On redo: push current state to undo, pop from redo, restore

This is simple and reliable, though uses more memory. For 100 steps it should be fine.

Let me now write the complete code. This is going to be long but I'll make it clean and functional.

Let me think about edge cases:
1. Drawing with negative dimensions (dragging up-left) - need to normalize
2. Line with zero length - shouldn't create
3. Resize to negative dimensions - need to handle flipping
4. Zoom limits: 10% to 800%
5. Keyboard shortcuts should not fire when typing in inputs

For the properties panel, I need to show x, y, width, height, fill, stroke, strokeWidth of the selected shape. When multiple shapes are selected, I could show the bounding box or just disable the fields.

Let me also think about the marquee selection. When dragging on empty space with the select tool:
1. Start a marquee rect
2. On mouseup, select all shapes whose bounding box intersects the marquee

For the intersection test: two rects intersect if they overlap in both x and y.

OK let me write this out now. I'll aim for a clean, modern design with a dark toolbar and light stage.

Let me think about the visual design:
- Dark toolbar at top with tool icons (I'll use simple SVG icons or Unicode)
- Light gray stage with a subtle dot grid
- White properties panel on the right
- Clean, modern typography

For icons, I'll use simple inline SVGs or CSS shapes since I can't use external resources.

Actually, let me use simple text/unicode for the tool icons to keep it simple:
- Select: cursor arrow (↖ or a custom SVG)
- Rectangle: □
- Ellipse: ○
- Line: /

Or I'll draw small SVG icons inline in the toolbar buttons.

Let me write the full implementation now. I'll be careful about all the grader requirements.

One more thing to consider: the grader says keyboard shortcuts work "right after mouse interaction on the stage, without clicking anything else first." This means I should NOT prevent default on keydown when the focus is on the SVG element. The document-level keydown listener should catch it.

Also: "except while typing in a text/number input" - so I need to check if the active element is an input and skip shortcut handling.

Let me also make sure:
- The SVG stage is at least 600×400 CSS px
- Tool buttons have the correct data-tool attributes
- The export button has id="export-svg"
- Style inputs have the correct ids and types

Let me write it all out now.

For the zoom display, I'll add a small indicator in the toolbar or at the bottom of the stage.

For the grid background, I'll use a subtle pattern in the SVG or a CSS background on the container.

Let me finalize my plan and write the code:

```
HTML structure:
- .toolbar (top)
  - tool buttons
  - separator
  - zoom controls / indicator
  - separator
  - export button
- .main (flex row)
  - .stage-container
    - svg#stage
  - .properties-panel
    - x, y, w, h inputs
    - fill-color
    - stroke-color
    - stroke-width
```

Let me code this up properly now. I'll make it comprehensive and well-organized.

For the coordinate conversion, I'll use:
```javascript
function screenToWorld(sx, sy) {
  const rect = stage.getBoundingClientRect();
  const x = (sx - rect.left - panX) / zoom;
  const y = (sy - rect.top - panY) / zoom;
  return { x, y };
}
```

And the viewport transform will be:
```
transform: translate(panX, panY) scale(zoom)
```

This means: world point (wx, wy) appears at screen position (wx * zoom + panX, wy * zoom + panY) relative to the SVG element.

So to convert screen to world:
```
wx = (screenX - panX) / zoom
wy = (screenY - panY) / zoom
```

Where screenX, screenY are relative to the SVG element's top-left.

This is correct. Let me verify with getBoundingClientRect:
- If I place a rect at world (100, 200) with size 50×30
- With zoom=1, panX=0, panY=0
- The rect appears at screen (100, 200) relative to SVG
- getBoundingClientRect().left = svgLeft + 100
- getBoundingClientRect().top = svgTop + 200
- getBoundingClientRect().width = 50
- getBoundingClientRect().height = 30

If the grader clicks at absolute position (svgLeft + 100, svgTop + 200) and drags to (svgLeft + 150, svgTop + 230), the resulting shape should have a bounding rect starting at approximately (svgLeft + 100, svgTop + 200) with width 50 and height 30. ✓

With zoom=2, panX=0, panY=0:
- World point (50, 100) appears at screen (100, 200) relative to SVG
- A rect at world (50, 100) with size 25×15 appears at screen (100, 200) with size 50×30
- getBoundingClientRect().width = 50 (which is 25 * zoom)

So if the grader clicks at screen (100, 200) relative to SVG and drags to (150, 230):
- World coords: (50, 100) to (75, 115)
- Shape: x=50, y=100, width=25, height=15
- getBoundingClientRect: left=100, top=200, width=50, height=30

The grader expects the bounding rect to match the mouse coordinates (±5px). So it expects left≈100, top≈200, width≈50, height≈30. That matches! ✓

Great, my coordinate system is correct.

Now let me write the full code. This will be a long file but I'll make it clean.

One more consideration: for the line shape, getBoundingClientRect on an SVG line element returns the bounding box of the line (the box that contains both endpoints). So if a line goes from (0,0) to (100, 100), getBoundingClientRect returns x=0, y=0, width=100, height=100. That's what we want.

But wait - for a line, the "width" and "height" in the properties panel should show the bounding box dimensions, not the line length. That makes sense for the resize handles too.

Actually, I realize there might be an issue with lines and getBoundingClientRect. An SVG `<line>` element's bounding box is the minimum bounding rectangle of the line. For a line from (0,0) to (100,100), it would be (0,0,100,100). For a line from (100,100) to (0,0), it would also be (0,0,100,100). Good.

But what about a horizontal line from (0,0) to (100,0)? The bounding box would be (0,0,100,0) - zero height! That might cause issues. Let me handle this by giving the line a small stroke width which would make the bounding box slightly larger, but that's not ideal.

Actually, for the grader's purpose, if it draws a line and checks getBoundingClientRect, a zero-height line might be problematic. But the grader probably draws lines at an angle to avoid this. I'll handle it gracefully anyway.

For the stroke width affecting getBoundingClientRect: the bounding rect of an SVG element includes the stroke. So a line with stroke-width 2 would have a bounding rect that's 2px larger in each direction. This could cause issues with the ±5px tolerance... but 2px is within 5px so it should be fine.

Wait, actually I need to be more careful. The SVG spec says getBoundingClientRect returns the "border box" which for SVG includes the stroke. Let me check...

Actually, in practice, for SVG elements, getBoundingClientRect() returns the geometric bounding box (without stroke) in most browsers. Let me not worry about this and just make sure the geometry is correct.

Hmm, actually I just recalled that for SVG elements, `getBoundingClientRect()` does include the stroke width in Chrome. So a rect at (100, 200) with width 50, height 30, and stroke-width 4 would have a bounding rect of approximately (98, 198, 54, 34). That's 2px off in each direction, which is within the 5px tolerance.

For lines, a line from (0,0) to (100,100) with stroke-width 4 would have a bounding rect of approximately (-2, -2, 104, 104). That's also within tolerance.

OK, I think we're fine. Let me write the code now.

Actually, one more important thing: I need to make sure that when the grader checks `getComputedStyle(el).fill` and `.strokeWidth`, these values are set on the element itself. I'll set them as SVG attributes (fill, stroke, stroke-width) on the element.

For lines, the fill should be "none" (lines don't have a fill). But the contract says "The fill and stroke must be set on the data-shape element itself." So I'll set fill="none" on lines.

Let me now write the complete implementation. I'll structure it clearly with comments.

Here's my final plan for the code structure:

1. CSS: Modern dark toolbar, light stage, properties panel
2. HTML: Toolbar, stage SVG, properties panel
3. JS:
   - State management (shapes, selection, tool, zoom, pan)
   - Rendering (update SVG from state)
   - Event handlers (mouse, keyboard)
   - Tool logic (drawing, selecting, moving, resizing)
   - Undo/redo
   - Export
   - Persistence (localStorage)
   - Zoom/pan

Let me write it now. I'll aim for around 800-1200 lines of well-organized code.
