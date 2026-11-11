```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vectorly</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; background: #1e1e2e; color: #cdd6f4; }

.app { display: flex; flex-direction: column; height: 100vh; }

.toolbar { display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: #181825; border-bottom: 1px solid #313244; flex-shrink: 0; z-index: 10; }

.tool-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 6px; background: transparent; color: #cdd6f4; cursor: pointer; position: relative; transition: background 0.15s; }
.tool-btn:hover { background: #313244; }
.tool-btn.active { background: #45475a; color: #89b4fa; }
.tool-btn.active::after { content: ''; position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%); width: 14px; height: 2px; background: #89b4fa; border-radius: 1px; }
.tool-btn svg { width: 18px; height: 18px; }

.separator { width: 1px; height: 24px; background: #313244; margin: 0 6px; }

.toolbar-label { font-size: 11px; color: #6c7086; margin: 0 4px; }

.zoom-display { font-size: 12px; color: #a6adc8; min-width: 48px; text-align: center; user-select: none; }

.export-btn { margin-left: auto; padding: 6px 14px; background: #45475a; border: none; border-radius: 6px; color: #cdd6f4; font-size: 12px; cursor: pointer; font-weight: 500; transition: background 0.15s; }
.export-btn:hover { background: #585b70; }

.main { display: flex; flex: 1; overflow: hidden; }

.stage-container { flex: 1; position: relative; overflow: hidden; background: #1e1e2e; }
.stage-container svg { display: block; width: 100%; height: 100%; }

.stage-bg { position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(circle, #313244 1px, transparent 1px); background-size: 20px 20px; opacity: 0.5; }

.properties-panel { width: 220px; background: #181825; border-left: 1px solid #313244; padding: 14px; overflow-y: auto; flex-shrink: 0; }
.panel-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6c7086; margin-bottom: 12px; }
.prop-group { margin-bottom: 14px; }
.prop-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.prop-label { font-size: 11px; color: #a6adc8; width: 16px; text-align: right; flex-shrink: 0; }
.prop-input { flex: 1; height: 28px; background: #1e1e2e; border: 1px solid #313244; border-radius: 4px; color: #cdd6f4; padding: 0 8px; font-size: 12px; outline: none; width: 60px; }
.prop-input:focus { border-color: #89b4fa; }
.color-input { width: 32px; height: 28px; padding: 2px; cursor: pointer; background: #1e1e2e; border: 1px solid #313244; border-radius: 4px; }
.color-input::-webkit-color-swatch-wrapper { padding: 2px; }
.color-input::-webkit-color-swatch { border-radius: 2px; border: none; }
.prop-input[type="number"] { -moz-appearance: textfield; }
.prop-input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }

.no-selection { color: #6c7086; font-size: 12px; font-style: italic; }

.zoom-controls { display: flex; align-items: center; gap: 4px; }
.zoom-btn { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 4px; background: transparent; color: #cdd6f4; cursor: pointer; font-size: 14px; }
.zoom-btn:hover { background: #313244; }
</style>
</head>
<body>
<div class="app">
  <div class="toolbar">
    <button class="tool-btn active" data-tool="select" title="Select (V)">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 2l12 8-6 1-2 6z"/></svg>
    </button>
    <button class="tool-btn" data-tool="rect" title="Rectangle (R)">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="14" height="10" rx="1"/></svg>
    </button>
    <button class="tool-btn" data-tool="ellipse" title="Ellipse (E)">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="10" cy="10" rx="7" ry="5"/></svg>
    </button>
    <button class="tool-btn" data-tool="line" title="Line (L)">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="4" y1="16" x2="16" y2="4"/></svg>
    </button>
    <div class="separator"></div>
    <div class="zoom-controls">
      <button class="zoom-btn" id="zoom-out">−</button>
      <span class="zoom-display" id="zoom-display">100%</span>
      <button class="zoom-btn" id="zoom-in">+</button>
    </div>
    <div class="separator"></div>
    <span class="toolbar-label" id="hint-text">Draw shapes on the canvas</span>
    <button class="export-btn" id="export-svg">Export SVG</button>
  </div>
  <div class="main">
    <div class="stage-container" id="stage-container">
      <div class="stage-bg"></div>
      <svg id="stage" xmlns="http://www.w3.org/2000/svg">
        <g id="viewport">
          <g id="shapes-layer"></g>
          <g id="preview-layer"></g>
          <g id="selection-layer"></g>
        </g>
      </svg>
    </div>
    <div class="properties-panel">
      <div class="panel-title">Properties</div>
      <div id="props-content">
        <div class="no-selection">No selection</div>
      </div>
    </div>
  </div>
</div>

<script>
(function() {
  'use strict';

  // === State ===
  let shapes = [];
  let selectedIds = new Set();
  let currentTool = 'select';
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let currentStyle = { fill: '#4a90d9', stroke: '#333333', strokeWidth: 2 };
  let undoStack = [];
  let redoStack = [];
  const MAX_UNDO = 120;
  let idCounter = 0;

  // Interaction state
  let isDragging = false;
  let dragType = null; // 'draw', 'move', 'resize', 'marquee', 'pan'
  let dragStart = null;
  let dragData = null;
  let spaceDown = false;
  let middleMouseDown = false;

  // DOM refs
  const stage = document.getElementById('stage');
  const stageContainer = document.getElementById('stage-container');
  const viewport = document.getElementById('viewport');
  const shapesLayer = document.getElementById('shapes-layer');
  const previewLayer = document.getElementById('preview-layer');
  const selectionLayer = document.getElementById('selection-layer');
  const zoomDisplay = document.getElementById('zoom-display');
  const hintText = document.getElementById('hint-text');
  const propsContent = document.getElementById('props-content');
  const exportBtn = document.getElementById('export-svg');

  // === Utility ===
  function genId() { return 'shape_' + (++idCounter) + '_' + Date.now().toString(36); }

  function clone(arr) { return JSON.parse(JSON.stringify(arr)); }

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

  function rectsIntersect(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function screenToWorld(sx, sy) {
    const rect = stage.getBoundingClientRect();
    return {
      x: (sx - rect.left - panX) / zoom,
      y: (sy - rect.top - panY) / zoom
    };
  }

  function worldToScreen(wx, wy) {
    const rect = stage.getBoundingClientRect();
    return {
      x: wx * zoom + panX + rect.left,
      y: wy * zoom + panY + rect.top
    };
  }

  // === Rendering ===
  function updateViewportTransform() {
    viewport.setAttribute('transform', `translate(${panX},${panY}) scale(${zoom})`);
    zoomDisplay.textContent = Math.round(zoom * 100) + '%';
  }

  function renderShapes() {
    shapesLayer.innerHTML = '';
    for (const shape of shapes) {
      const el = createShapeElement(shape);
      shapesLayer.appendChild(el);
    }
  }

  function createShapeElement(shape) {
    let el;
    if (shape.type === 'rect') {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      el.setAttribute('x', shape.x);
      el.setAttribute('y', shape.y);
      el.setAttribute('width', Math.max(0, shape.width));
      el.setAttribute('height', Math.max(0, shape.height));
    } else if (shape.type === 'ellipse') {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      el.setAttribute('cx', shape.x + shape.width / 2);
      el.setAttribute('cy', shape.y + shape.height / 2);
      el.setAttribute('rx', Math.max(0, shape.width / 2));
      el.setAttribute('ry', Math.max(0, shape.height / 2));
    } else if (shape.type === 'line') {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      el.setAttribute('x1', shape.x1);
      el.setAttribute('y1', shape.y1);
      el.setAttribute('x2', shape.x2);
      el.setAttribute('y2', shape.y2);
      el.setAttribute('fill', 'none');
    }
    el.setAttribute('data-shape', shape.type);
    el.setAttribute('data-id', shape.id);
    el.setAttribute('fill', shape.fill || 'none');
    el.setAttribute('stroke', shape.stroke || 'none');
    el.setAttribute('stroke-width', shape.strokeWidth || 0);
    if (selectedIds.has(shape.id)) {
      el.setAttribute('data-selected', 'true');
    }
    return el;
  }

  function renderSelection() {
    selectionLayer.innerHTML = '';
    if (selectedIds.size === 0) return;

    const selShapes = shapes.filter(s => selectedIds.has(s.id));

    if (selectedIds.size === 1) {
      const shape = selShapes[0];
      const bb = getBBox(shape);
      const hw = 5 / zoom;
      const hs = 9 / zoom;

      // Selection outline
      const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      outline.setAttribute('x', bb.x);
      outline.setAttribute('y', bb.y);
      outline.setAttribute('width', bb.width);
      outline.setAttribute('height', bb.height);
      outline.setAttribute('fill', 'none');
      outline.setAttribute('stroke', '#89b4fa');
      outline.setAttribute('stroke-width', 1.5 / zoom);
      outline.setAttribute('stroke-dasharray', `${4/zoom},${3/zoom}`);
      selectionLayer.appendChild(outline);

      // 8 handles
      const handles = [
        { name: 'nw', x: bb.x, y: bb.y },
        { name: 'n', x: bb.x + bb.width/2, y: bb.y },
        { name: 'ne', x: bb.x + bb.width, y: bb.y },
        { name: 'e', x: bb.x + bb.width, y: bb.y + bb.height/2 },
        { name: 'se', x: bb.x + bb.width, y: bb.y + bb.height },
        { name: 's', x: bb.x + bb.width/2, y: bb.y + bb.height },
        { name: 'sw', x: bb.x, y: bb.y + bb.height },
        { name: 'w', x: bb.x, y: bb.y + bb.height/2 }
      ];

      for (const h of handles) {
        const handle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        handle.setAttribute('x', h.x - hw/2);
        handle.setAttribute('y', h.y - hw/2);
        handle.setAttribute('width', hw);
        handle.setAttribute('height', hw);
        handle.setAttribute('fill', '#ffffff');
        handle.setAttribute('stroke', '#89b4fa');
        handle.setAttribute('stroke-width', 1 / zoom);
        handle.setAttribute('data-handle', h.name);
        handle.style.cursor = getHandleCursor(h.name);
        selectionLayer.appendChild(handle);
      }
    } else {
      // Multi-selection: show combined bounding box
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const s of selShapes) {
        const bb = getBBox(s);
        minX = Math.min(minX, bb.x);
        minY = Math.min(minY, bb.y);
        maxX = Math.max(maxX, bb.x + bb.width);
        maxY = Math.max(maxY, bb.y + bb.height);
      }
      const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      outline.setAttribute('x', minX);
      outline.setAttribute('y', minY);
      outline.setAttribute('width', maxX - minX);
      outline.setAttribute('height', maxY - minY);
      outline.setAttribute('fill', 'none');
      outline.setAttribute('stroke', '#89b4fa');
      outline.setAttribute('stroke-width', 1.5 / zoom);
      outline.setAttribute('stroke-dasharray', `${4/zoom},${3/zoom}`);
      selectionLayer.appendChild(outline);
    }
  }

  function getHandleCursor(name) {
    const cursors = { nw: 'nw-resize', se: 'nw-resize', ne: 'ne-resize', sw: 'ne-resize', n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize' };
    return cursors[name] || 'default';
  }

  function renderAll() {
    renderShapes();
    renderSelection();
    updateProperties();
  }

  // === Properties Panel ===
  function updateProperties() {
    if (selectedIds.size === 0) {
      propsContent.innerHTML = '<div class="no-selection">No selection</div>';
      return;
    }
    const selShapes = shapes.filter(s => selectedIds.has(s.id));
    let x, y, w, h, fill, stroke, strokeWidth;

    if (selShapes.length === 1) {
      const s = selShapes[0];
      const bb = getBBox(s);
      x = Math.round(bb.x); y = Math.round(bb.y);
      w = Math.round(bb.width); h = Math.round(bb.height);
      fill = s.fill || '#000000';
      stroke = s.stroke || '#000000';
      strokeWidth = s.strokeWidth || 0;
    } else {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const s of selShapes) {
        const bb = getBBox(s);
        minX = Math.min(minX, bb.x); minY = Math.min(minY, bb.y);
        maxX = Math.max(maxX, bb.x + bb.width); maxY = Math.max(maxY, bb.y + bb.height);
      }
      x = Math.round(minX); y = Math.round(minY);
      w = Math.round(maxX - minX); h = Math.round(maxY - minY);
      fill = selShapes[0].fill || '#000000';
      stroke = selShapes[0].stroke || '#000000';
      strokeWidth = selShapes[0].strokeWidth || 0;
    }

    propsContent.innerHTML = `
      <div class="prop-group">
        <div class="prop-row"><span class="prop-label">X</span><input type="number" class="prop-input" id="prop-x" value="${x}"></div>
        <div class="prop-row"><span class="prop-label">Y</span><input type="number" class="prop-input" id="prop-y" value="${y}"></div>
        <div class="prop-row"><span class="prop-label">W</span><input type="number" class="prop-input" id="prop-w" value="${w}"></div>
        <div class="prop-row"><span class="prop-label">H</span><input type="number" class="prop-input" id="prop-h" value="${h}"></div>
      </div>
      <div class="prop-group">
        <div class="prop-row"><span class="prop-label" style="width:auto;font-size:11px">Fill</span><input type="color" class="color-input" id="fill-color" value="${toHex(fill)}"></div>
        <div class="prop-row"><span class="prop-label" style="width:auto;font-size:11px">Stroke</span><input type="color" class="color-input" id="stroke-color" value="${toHex(stroke)}"></div>
        <div class="prop-row"><span class="prop-label" style="width:auto;font-size:11px">Width</span><input type="number" class="prop-input" id="stroke-width" value="${strokeWidth}" min="0" max="100" step="1"></div>
      </div>
    `;

    // Attach events
    document.getElementById('prop-x').addEventListener('input', onPropChange);
    document.getElementById('prop-y').addEventListener('input', onPropChange);
    document.getElementById('prop-w').addEventListener('input', onPropChange);
    document.getElementById('prop-h').addEventListener('input', onPropChange);
    document.getElementById('fill-color').addEventListener('input', onStyleChange);
    document.getElementById('stroke-color').addEventListener('input', onStyleChange);
    document.getElementById('stroke-width').addEventListener('input', onStyleChange);
  }

  function toHex(color) {
    if (!color || color === 'none') return '#000000';
    if (color.startsWith('#')) return color.length === 4 ? '#' + color[1]+color[1]+color[2]+color[2]+color[3]+color[3] : color;
    return '#000000';
  }

  function onPropChange(e) {
    const selShapes = shapes.filter(s => selectedIds.has(s.id));
    if (selShapes.length === 0) return;
    pushUndo();
    const field = e.target.id;
    const val = parseFloat(e.target.value) || 0;
    if (field === 'prop-x' || field === 'prop-y') {
      // Move all selected shapes
      for (const s of selShapes) {
        const bb = getBBox(s);
        const dx = field === 'prop-x' ? val - bb.x : 0;
        const dy = field === 'prop-y' ? val - bb.y : 0;
        moveShape(s, dx, dy);
      }
    } else if (field === 'prop-w' || field === 'prop-h') {
      for (const s of selShapes) {
        const bb = getBBox(s);
        if (s.type === 'line') {
          const nw = field === 'prop-w' ? val : bb.width;
          const nh = field === 'prop-h' ? val : bb.height;
          const cx = bb.x + bb.width/2, cy = bb.y + bb.height/2;
          const sx = s.x2 > s.x1 ? 1 : -1;
          const sy = s.y2 > s.y1 ? 1 : -1;
          if (s.x2 === s.x1) sx = 1;
          if (s.y2 === s.y1) sy = 1;
          s.x1 = cx - nw/2 * (s.x1 <= s.x2 ? -1 : 1) * (s.x1 === s.x2 ? 1 : (s.x1 < s.x2 ? 1 : -1));
          s.x2 = cx + nw/2 * (s.x1 <= s.x2 ? 1 : -1) * (s.x1 === s.x2 ? 1 : (s.x1 < s.x2 ? 1 : -1));
          s.y1 = cy - nh/2 * (s.y1 <= s.y2 ? -1 : 1) * (s.y1 === s.y2 ? 1 : (s.y1 < s.y2 ? 1 : -1));
          s.y2 = cy + nh/2 * (s.y1 <= s.y2 ? 1 : -1) * (s.y1 === s.y2 ? 1 : (s.y1 < s.y2 ? 1 : -1));
        } else {
          if (field === 'prop-w') s.width = val;
          if (field === 'prop-h') s.height = val;
        }
      }
    }
    renderAll();
    save();
  }

  function onStyleChange(e) {
    const selShapes = shapes.filter(s => selectedIds.has(s.id));
    if (selShapes.length === 0) return;
    pushUndo();
    const field = e.target.id;
    if (field === 'fill-color') {
      currentStyle.fill = e.target.value;
      for (const s of selShapes) { s.fill = e.target.value; }
    } else if (field === 'stroke-color') {
      currentStyle.stroke = e.target.value;
      for (const s of selShapes) { s.stroke = e.target.value; }
    } else if (field === 'stroke-width') {
      currentStyle.strokeWidth = parseFloat(e.target.value) || 0;
      for (const s of selShapes) { s.strokeWidth = currentStyle.strokeWidth; }
    }
    renderAll();
    save();
  }

  // === Shape hit testing ===
  function hitTest(worldX, worldY) {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      if (shapeContainsPoint(s, worldX, worldY)) return s;
    }
    return null;
  }

  function shapeContainsPoint(shape, px, py) {
    const bb = getBBox(shape);
    const tolerance = 5 / zoom;
    if (shape.type === 'line') {
      // Distance from point to line segment
      const dx = shape.x2 - shape.x1;
      const dy = shape.y2 - shape.y1;
      const len2 = dx*dx + dy*dy;
      if (len2 === 0) return Math.hypot(px - shape.x1, py - shape.y1) < tolerance;
      let t = ((px - shape.x1)*dx + (py - shape.y1)*dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const cx = shape.x1 + t*dx;
      const cy = shape.y1 + t*dy;
      return Math.hypot(px - cx, py - cy) < tolerance;
    }
    return px >= bb.x - tolerance && px <= bb.x + bb.width + tolerance &&
           py >= bb.y - tolerance && py <= bb.y + bb.height + tolerance;
  }

  // === Move shape ===
  function moveShape(shape, dx, dy) {
    if (shape.type === 'line') {
      shape.x1 += dx; shape.y1 += dy;
      shape.x2 += dx; shape.y2 += dy;
    } else {
      shape.x += dx; shape.y += dy;
    }
  }

  // === Undo/Redo ===
  function pushUndo() {
    undoStack.push(clone(shapes));
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
  }

  function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(clone(shapes));
    shapes = undoStack.pop();
    // Clean up selection
    const validIds = new Set(shapes.map(s => s.id));
    selectedIds = new Set([...selectedIds].filter(id => validIds.has(id)));
    renderAll();
    save();
  }

  function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(clone(shapes));
    shapes = redoStack.pop();
    const validIds = new Set(shapes.map(s => s.id));
    selectedIds = new Set([...selectedIds].filter(id => validIds.has(id)));
    renderAll();
    save();
  }

  // === Tools ===
  function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
    updateCursor();
    hintText.textContent = tool === 'select' ? 'Click or drag to select' :
                          tool === 'rect' ? 'Click and drag to draw rectangle' :
                          tool === 'ellipse' ? 'Click and drag to draw ellipse' :
                          'Click and drag to draw line';
  }

  function updateCursor() {
    if (spaceDown || middleMouseDown) {
      stage.style.cursor = 'grab';
    } else {
      stage.style.cursor = currentTool === 'select' ? 'default' : 'crosshair';
    }
  }

  // === Drawing ===
  function startDraw(startWorld, shiftKey) {
    dragType = 'draw';
    dragStart = startWorld;
    dragData = { shiftKey, startX: startWorld.x, startY: startWorld.y };
  }

  function updateDraw(currentWorld, shiftKey) {
    const sx = dragData.startX;
    const sy = dragData.startY;
    let ex = currentWorld.x;
    let ey = currentWorld.y;
    let dx = ex - sx;
    let dy = ey - sy;

    if (currentTool === 'line') {
      if (shiftKey) {
        const angle = Math.atan2(dy, dx);
        const snapAngle = Math.round(angle / (Math.PI/4)) * (Math.PI/4);
        const len = Math.hypot(dx, dy);
        dx = Math.cos(snapAngle) * len;
        dy = Math.sin(snapAngle) * len;
        ex = sx + dx;
        ey = sy + dy;
      }
      drawPreview({ type: 'line', x1: sx, y1: sy, x2: ex, y2: ey });
    } else {
      if (shiftKey) {
        const side = Math.max(Math.abs(dx), Math.abs(dy));
        dx = dx < 0 ? -side : side;
        dy = dy < 0 ? -side : side;
        ex = sx + dx;
        ey = sy + dy;
      }
      const x = Math.min(sx, ex);
      const y = Math.min(sy, ey);
      const w = Math.abs(dx);
      const h = Math.abs(dy);
      drawPreview({ type: currentTool, x, y, width: w, height: h });
    }
  }

  function drawPreview(shape) {
    previewLayer.innerHTML = '';
    let el;
    if (shape.type === 'line') {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      el.setAttribute('x1', shape.x1); el.setAttribute('y1', shape.y1);
      el.setAttribute('x2', shape.x2); el.setAttribute('y2', shape.y2);
      el.setAttribute('fill', 'none');
    } else if (shape.type === 'rect') {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      el.setAttribute('x', shape.x); el.setAttribute('y', shape.y);
      el.setAttribute('width', shape.width); el.setAttribute('height', shape.height);
    } else {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      el.setAttribute('cx', shape.x + shape.width/2); el.setAttribute('cy', shape.y + shape.height/2);
      el.setAttribute('rx', shape.width/2); el.setAttribute('ry', shape.height/2);
    }
    el.setAttribute('fill', currentStyle.fill + '40');
    el.setAttribute('stroke', currentStyle.stroke);
    el.setAttribute('stroke-width', currentStyle.strokeWidth);
    el.setAttribute('stroke-dasharray', `${4/zoom},${3/zoom}`);
    previewLayer.appendChild(el);
  }

  function finishDraw(currentWorld, shiftKey) {
    previewLayer.innerHTML = '';
    const sx = dragData.startX;
    const sy = dragData.startY;
    let ex = currentWorld.x;
    let ey = currentWorld.y;
    let dx = ex - sx;
    let dy = ey - sy;

    if (currentTool === 'line') {
      if (shiftKey) {
        const angle = Math.atan2(dy, dx);
        const snapAngle = Math.round(angle / (Math.PI/4)) * (Math.PI/4);
        const len = Math.hypot(dx, dy);
        dx = Math.cos(snapAngle) * len;
        dy = Math.sin(snapAngle) * len;
        ex = sx + dx;
        ey = sy + dy;
      }
      if (Math.hypot(ex - sx, ey - sy) < 3) return;
      pushUndo();
      const shape = { id: genId(), type: 'line', x1: sx, y1: sy, x2: ex, y2: ey, fill: 'none', stroke: currentStyle.stroke, strokeWidth: currentStyle.strokeWidth };
      shapes.push(shape);
      selectedIds = new Set([shape.id]);
    } else {
      if (shiftKey) {
        const side = Math.max(Math.abs(dx), Math.abs(dy));
        dx = dx < 0 ? -side : side;
        dy = dy < 0 ? -side : side;
        ex = sx + dx;
        ey = sy + dy;
      }
      const w = Math.abs(ex - sx);
      const h = Math.abs(ey - sy);
      if (w < 3 && h < 3) return;
      pushUndo();
      const shape = { id: genId(), type: currentTool, x: Math.min(sx, ex), y: Math.min(sy, ey), width: w, height: h, fill: currentStyle.fill, stroke: currentStyle.stroke, strokeWidth: currentStyle.strokeWidth };
      shapes.push(shape);
      selectedIds = new Set([shape.id]);
    }
    setTool('select');
    renderAll();
    save();
  }

  // === Selection ===
  function startMarquee(startWorld) {
    dragType = 'marquee';
    dragStart = startWorld;
    dragData = { startX: startWorld.x, startY: startWorld.y, initialSelection: new Set(selectedIds) };
  }

  function updateMarquee(currentWorld) {
    const sx = dragData.startX, sy = dragData.startY;
    const ex = currentWorld.x, ey = currentWorld.y;
    const x = Math.min(sx, ex), y = Math.min(sy, ey);
    const w = Math.abs(ex - sx), h = Math.abs(ey - sy);

    selectionLayer.innerHTML = '';
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y);
    rect.setAttribute('width', w); rect.setAttribute('height', h);
    rect.setAttribute('fill', 'rgba(137,180,250,0.1)');
    rect.setAttribute('stroke', '#89b4fa');
    rect.setAttribute('stroke-width', 1 / zoom);
    selectionLayer.appendChild(rect);
  }

  function finishMarquee(currentWorld) {
    const sx = dragData.startX, sy = dragData.startY;
    const ex = currentWorld.x, ey = currentWorld.y;
    const x = Math.min(sx, ex), y = Math.min(sy, ey);
    const w = Math.abs(ex - sx), h = Math.abs(ey - sy);

    if (w < 3 && h < 3) return;

    const marquee = { x, y, width: w, height: h };
    selectedIds = new Set();
    for (const s of shapes) {
      if (rectsIntersect(getBBox(s), marquee)) {
        selectedIds.add(s.id);
      }
    }
    renderAll();
  }

  // === Move ===
  function startMove(startWorld) {
    dragType = 'move';
    dragStart = startWorld;
    dragData = {
      originalPositions: shapes.filter(s => selectedIds.has(s.id)).map(s => {
        if (s.type === 'line') return { id: s.id, x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 };
        return { id: s.id, x: s.x, y: s.y };
      })
    };
  }

  function updateMove(currentWorld) {
    const dx = currentWorld.x - dragStart.x;
    const dy = currentWorld.y - dragStart.y;
    for (const s of shapes) {
      if (!selectedIds.has(s.id)) continue;
      const orig = dragData.originalPositions.find(o => o.id === s.id);
      if (!orig) continue;
      if (s.type === 'line') {
        s.x1 = orig.x1 + dx; s.y1 = orig.y1 + dy;
        s.x2 = orig.x2 + dx; s.y2 = orig.y2 + dy;
      } else {
        s.x = orig.x + dx; s.y = orig.y + dy;
      }
    }
    renderShapes();
    renderSelection();
  }

  function finishMove() {
    renderAll();
    save();
  }

  // === Resize ===
  function startResize(handleName, shape, startWorld) {
    dragType = 'resize';
    dragStart = startWorld;
    const bb = getBBox(shape);
    dragData = {
      handleName,
      shapeId: shape.id,
      origBB: { ...bb },
      origShape: clone([shape])[0],
      shape
    };
  }

  function updateResize(currentWorld, shiftKey) {
    const { handleName, origBB, origShape, shape } = dragData;
    const dx = currentWorld.x - dragStart.x;
    const dy = currentWorld.y - dragStart.y;

    let { x, y, width, height } = origBB;

    if (handleName.includes('e')) width = origBB.width + dx;
    if (handleName.includes('w')) { x = origBB.x + dx; width = origBB.width - dx; }
    if (handleName.includes('s')) height = origBB.height + dy;
    if (handleName.includes('n')) { y = origBB.y + dy; height = origBB.height - dy; }

    if (shiftKey && origBB.width > 0 && origBB.height > 0) {
      const ratio = origBB.width / origBB.height;
      if (Math.abs(width / height) > ratio) {
        width = height * ratio;
      } else {
        height = width / ratio;
      }
      if (handleName.includes('w')) x = origBB.x + origBB.width - width;
      if (handleName.includes('n')) y = origBB.y + origBB.height - height;
    }

    if (width < 0) { width = -width; x = x + width; }
    if (height < 0) { height = -height; y = y + height; }

    if (shape.type === 'line') {
      const ob = origBB;
      const nx = Math.min(x, x + width);
      const ny = Math.min(y, y + height);
      const nw = Math.abs(width);
      const nh = Math.abs(height);
      const flipX = origShape.x2 < origShape.x1;
      const flipY = origShape.y2 < origShape.y1;
      shape.x1 = flipX ? nx + nw : nx;
      shape.y1 = flipY ? ny + nh : ny;
      shape.x2 = flipX ? nx : nx + nw;
      shape.y2 = flipY ? ny : ny + nh;
    } else {
      shape.x = Math.min(x, x + width);
      shape.y = Math.min(y, y + height);
      shape.width = Math.abs(width);
      shape.height = Math.abs(height);
    }
    renderShapes();
    renderSelection();
  }

  function finishResize() {
    renderAll();
    save();
  }

  // === Pan ===
  function startPan(sx, sy) {
    dragType = 'pan';
    dragStart = { x: sx, y: sy };
    dragData = { startPanX: panX, startPanY: panY };
    stage.style.cursor = 'grabbing';
  }

  function updatePan(sx, sy) {
    panX = dragData.startPanX + (sx - dragStart.x);
    panY = dragData.startPanY + (sy - dragStart.y);
    updateViewportTransform();
  }

  function finishPan() {
    updateCursor();
  }

  // === Event Handlers ===
  function getMousePos(e) {
    return { x: e.clientX, y: e.clientY };
  }

  function getWorldPos(e) {
    return screenToWorld(e.clientX, e.clientY);
  }

  stage.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  stage.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  function onMouseDown(e) {
    if (e.button === 1 || (spaceDown && e.button === 0)) {
      e.preventDefault();
      middleMouseDown = e.button === 1;
      startPan(e.clientX, e.clientY);
      return;
    }
    if (e.button !== 0) return;

    const world = getWorldPos(e);

    // Check if clicking a handle
    if (currentTool === 'select' && selectedIds.size === 1) {
      const handleEl = e.target.closest('[data-handle]');
      if (handleEl) {
        e.preventDefault();
        const shape = shapes.find(s => s.id === [...selectedIds][0]);
        if (shape) {
          pushUndo();
          startResize(handleEl.dataset.handle, shape, world);
        }
        return;
      }
    }

    if (currentTool === 'select') {
      // Check hit
      const hit = hitTest(world.x, world.y);
      if (hit) {
        if (e.shiftKey) {
          if (selectedIds.has(hit.id)) selectedIds.delete(hit.id);
          else selectedIds.add(hit.id);
          renderAll();
        } else {
          if (!selectedIds.has(hit.id)) {
            selectedIds = new Set([hit.id]);
            renderAll();
          }
          pushUndo();
          startMove(world);
        }
      } else {
        if (!e.shiftKey) {
          selectedIds = new Set();
        }
        renderAll();
        startMarquee(world);
      }
    } else {
      // Drawing tools
      startDraw(world, e.shiftKey);
    }
  }

  function onMouseMove(e) {
    if (!isDragging && !dragType) return;
    const world = getWorldPos(e);

    switch (dragType) {
      case 'draw':
        updateDraw(world, e.shiftKey);
        break;
      case 'move':
        updateMove(world);
        break;
      case 'resize':
        updateResize(world, e.shiftKey);
        break;
      case 'marquee':
        updateMarquee(world);
        break;
      case 'pan':
        updatePan(e.clientX, e.clientY);
        break;
    }
  }

  function onMouseUp(e) {
    if (!dragType) { middleMouseDown = false; return; }
    const world = getWorldPos(e);

    switch (dragType) {
      case 'draw':
        finishDraw(world, e.shiftKey);
        break;
      case 'move':
        finishMove();
        break;
      case 'resize':
        finishResize();
        break;
      case 'marquee':
        finishMarquee(world);
        break;
      case 'pan':
        finishPan();
        break;
    }
    dragType = null;
    dragStart = null;
    dragData = null;
    middleMouseDown = false;
  }

  function onWheel(e) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = Math.exp(delta * 0.01);
      const newZoom = Math.max(0.1, Math.min(8, zoom * factor));
      if (newZoom === zoom) return;

      const rect = stage.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      panX = mx - (mx - panX) * (newZoom / zoom);
      panY = my - (my - panY) * (newZoom / zoom);
      zoom = newZoom;
      updateViewportTransform();
      renderSelection();
    } else if (e.shiftKey) {
      e.preventDefault();
      panY += e.deltaY;
      updateViewportTransform();
    } else {
      panX -= e.deltaX;
      panY -= e.deltaY;
      updateViewportTransform();
    }
  }

  // === Keyboard ===
  function onKeyDown(e) {
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
      if (e.key === 'Escape') active.blur();
      return;
    }

    if (e.key === ' ') {
      spaceDown = true;
      updateCursor();
      e.preventDefault();
      return;
    }

    // Tool shortcuts
    if (!e.ctrlKey && !e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'v') { setTool('select'); return; }
      if (key === 'r') { setTool('rect'); return; }
      if (key === 'e') { setTool('ellipse'); return; }
      if (key === 'l') { setTool('line'); return; }
    }

    // Delete
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      deleteSelection();
      return;
    }

    // Ctrl/Cmd shortcuts
    const mod = e.ctrlKey || e.metaKey;
    if (mod) {
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }
      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        selectedIds = new Set(shapes.map(s => s.id));
        renderAll();
        return;
      }
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        duplicateSelection();
        return;
      }
    }

    // Nudge
    if (e.key.startsWith('Arrow') && selectedIds.size > 0) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      let dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;
      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;
      pushUndo();
      for (const s of shapes) {
        if (selectedIds.has(s.id)) moveShape(s, dx, dy);
      }
      renderAll();
      save();
      return;
    }

    // Z-order
    if (e.key === ']') {
      e.preventDefault();
      bringForward();
      return;
    }
    if (e.key === '[') {
      e.preventDefault();
      sendBackward();
      return;
    }
  }

  function onKeyUp(e) {
    if (e.key === ' ') {
      spaceDown = false;
      updateCursor();
    }
  }

  // === Actions ===
  function deleteSelection() {
    if (selectedIds.size === 0) return;
    pushUndo();
    shapes = shapes.filter(s => !selectedIds.has(s.id));
    selectedIds = new Set();
    renderAll();
    save();
  }

  function duplicateSelection() {
    if (selectedIds.size === 0) return;
    pushUndo();
    const newIds = new Set();
    for (const id of selectedIds) {
      const orig = shapes.find(s => s.id === id);
      if (!orig) continue;
      const dup = JSON.parse(JSON.stringify(orig));
      dup.id = genId();
      if (dup.type === 'line') { dup.x1 += 10; dup.y1 += 10; dup.x2 += 10; dup.y2 += 10; }
      else { dup.x += 10; dup.y += 10; }
      shapes.push(dup);
      newIds.add(dup.id);
    }
    selectedIds = newIds;
    renderAll();
    save();
  }

  function bringForward() {
    if (selectedIds.size === 0) return;
    pushUndo();
    for (const id of selectedIds) {
      const idx = shapes.findIndex(s => s.id === id);
      if (idx >= 0 && idx < shapes.length - 1) {
        [shapes[idx], shapes[idx+1]] = [shapes[idx+1], shapes[idx]];
      }
    }
    renderAll();
    save();
  }

  function sendBackward() {
    if (selectedIds.size === 0) return;
    pushUndo();
    for (const id of selectedIds) {
      const idx = shapes.findIndex(s => s.id === id);
      if (idx > 0) {
        [shapes[idx], shapes[idx-1]] = [shapes[idx-1], shapes[idx]];
      }
    }
    renderAll();
    save();
  }

  // === Export ===
  function exportSVG() {
    let minX = 0, minY = 0, maxX = 1000, maxY = 1000;
    if (shapes.length > 0) {
      minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
      for (const s of shapes) {
        const bb = getBBox(s);
        const pad = s.strokeWidth || 0;
        minX = Math.min(minX, bb.x - pad);
        minY = Math.min(minY, bb.y - pad);
        maxX = Math.max(maxX, bb.x + bb.width + pad);
        maxY = Math.max(maxY, bb.y + bb.height + pad);
      }
      const pad = 10;
      minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    }

    let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${maxX-minX} ${maxY-minY}" width="${maxX-minX}" height="${maxY-minY}">\n`;

    for (const s of shapes) {
      if (s.type === 'rect') {
        svg += `  <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}"/>\n`;
      } else if (s.type === 'ellipse') {
        svg += `  <ellipse cx="${s.x + s.width/2}" cy="${s.y + s.height/2}" rx="${s.width/2}" ry="${s.height/2}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}"/>\n`;
      } else if (s.type === 'line') {
        svg += `  <line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" fill="none" stroke="${s.stroke}" stroke-width="${s.strokeWidth}"/>\n`;
      }
    }
    svg += `</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drawing.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  exportBtn.addEventListener('click', exportSVG);

  // === Persistence ===
  function save() {
    try {
      localStorage.setItem('vectorly_doc', JSON.stringify({ shapes, idCounter }));
    } catch (e) {}
  }

  function load() {
    try {
      const data = localStorage.getItem('vectorly_doc');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.shapes) {
          shapes = parsed.shapes;
          idCounter = parsed.idCounter || shapes.length;
        }
      }
    } catch (e) {}
  }

  // === Tool button events ===
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => setTool(btn.dataset.tool));
  });

  // === Zoom buttons ===
  document.getElementById('zoom-in').addEventListener('click', () => {
    const rect = stage.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    const newZoom = Math.min(8, zoom * 1.25);
    panX = cx - (cx - panX) * (newZoom / zoom);
    panY = cy - (cy - panY) * (newZoom / zoom);
    zoom = newZoom;
    updateViewportTransform();
    renderSelection();
  });

  document.getElementById('zoom-out').addEventListener('click', () => {
    const rect = stage.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    const newZoom = Math.max(0.1, zoom / 1.25);
    panX = cx - (cx - panX) * (newZoom / zoom);
    panY = cy - (cy - panY) * (newZoom / zoom);
    zoom = newZoom;
    updateViewportTransform();
    renderSelection();
  });

  // === Init ===
  load();
  renderAll();
  updateViewportTransform();

  // Prevent context menu on stage
  stage.addEventListener('contextmenu', e => e.preventDefault());

  // Middle mouse pan
  stage.addEventListener('mousedown', e => {
    if (e.button === 1) {
      e.preventDefault();
      middleMouseDown = true;
      startPan(e.clientX, e.clientY);
    }
  });

  // Ensure minimum size for stage
  function resizeStage() {
    const w = stageContainer.clientWidth;
    const h = stageContainer.clientHeight;
    stage.setAttribute('width', Math.max(600, w));
    stage.setAttribute('height', Math.max(400, h));
  }
  resizeStage();
  window.addEventListener('resize', resizeStage);

})();
</script>
</body>
</html>
```