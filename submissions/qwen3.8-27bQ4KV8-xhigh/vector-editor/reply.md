```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vectorly — vector drawing editor</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28'%3E%3Crect width='28' height='28' rx='7' fill='%234d8dff'/%3E%3Cpath d='M8 20.5C11.5 9.5 16 9 20.5 12' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3Ccircle cx='8' cy='20.5' r='2' fill='white'/%3E%3Ccircle cx='20.5' cy='12' r='2' fill='white'/%3E%3C/svg%3E">
<style>
:root{
  color-scheme:dark;
  --bg-app:#14171f; --bg-bar:#212633; --bg-panel:#1e2330; --bg-input:#161b25;
  --line:rgba(255,255,255,.09); --text:#e9edf5; --muted:#98a2b8; --faint:#6d7890;
  --accent:#4d8dff; --accent-deep:#3d7eff; --pink:#ff5fa8;
  --canvas:#f4f5f8; --dot:rgba(101,111,135,.32);
  --font-ui:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",sans-serif;
  --font-mono:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace;
}
*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0;font-family:var(--font-ui);font-size:13px;color:var(--text);background:var(--bg-app);
  display:flex;flex-direction:column;overflow:hidden;
  -webkit-user-select:none;user-select:none;
}
input{-webkit-user-select:text;user-select:text}
button{font-family:inherit}
button:focus-visible{outline:2px solid var(--accent);outline-offset:1px}

/* ── top bar ─────────────────────────────────────── */
#topbar{
  height:54px;flex:0 0 54px;position:relative;z-index:5;
  background:linear-gradient(180deg,#272d3b,#202531);
  border-bottom:1px solid rgba(255,255,255,.07);
  box-shadow:0 10px 24px -18px rgba(0,0,0,.9);
  display:flex;align-items:center;gap:14px;padding:0 14px;
}
.brand{display:flex;align-items:center;gap:10px;min-width:0}
.brand .logo{display:block;flex:0 0 auto}
.wordmark{font-weight:800;font-size:15px;letter-spacing:-.02em;color:#fff}
#doc-name{
  background:transparent;border:1px solid transparent;border-radius:7px;color:var(--muted);
  font:inherit;padding:5px 9px;width:132px;min-width:0;
  transition:border-color .15s,background .15s,color .15s;
}
#doc-name:hover{border-color:var(--line)}
#doc-name:focus{outline:none;color:#fff;background:rgba(255,255,255,.05);border-color:var(--accent)}

#tools{margin:0 auto;display:flex;gap:2px;background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:11px;padding:3px}
#tools button{
  width:40px;height:32px;border:0;border-radius:8px;background:transparent;color:#a7b0c4;
  display:grid;place-items:center;cursor:pointer;
  transition:background .15s,color .15s,box-shadow .15s,transform .05s;
}
#tools button svg{width:18px;height:18px;display:block}
#tools button:hover{background:rgba(255,255,255,.08);color:#e6ebf5}
#tools button:active{transform:scale(.94)}
#tools button.active{background:var(--accent);color:#fff;box-shadow:0 3px 12px -2px rgba(77,141,255,.55),inset 0 1px 0 rgba(255,255,255,.25)}

.tb-right{display:flex;align-items:center;gap:8px;margin-left:auto}
.ib{
  width:32px;height:32px;border:1px solid transparent;border-radius:8px;background:transparent;
  color:#a7b0c4;display:grid;place-items:center;cursor:pointer;
  transition:background .15s,color .15s,transform .05s;
}
.ib svg{width:17px;height:17px;display:block}
.ib:hover:not(:disabled){background:rgba(255,255,255,.08);color:#fff}
.ib:active:not(:disabled){transform:scale(.93)}
.ib:disabled{opacity:.32;cursor:default}
.sep{width:1px;height:22px;background:rgba(255,255,255,.1)}

.zoom-seg{display:flex;align-items:center;gap:2px;background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:9px;padding:2px}
.zoom-seg .ib{width:26px;height:26px;border-radius:6px}
#zoom-label{
  min-width:52px;height:26px;border:0;border-radius:6px;background:transparent;color:var(--muted);
  font:600 11.5px var(--font-mono);letter-spacing:.02em;cursor:pointer;transition:background .15s,color .15s;
}
#zoom-label:hover{background:rgba(255,255,255,.08);color:#fff}

.export{
  display:flex;align-items:center;gap:8px;border:0;border-radius:9px;cursor:pointer;
  background:linear-gradient(180deg,#5b93ff,#4078f0);color:#fff;font:600 12.5px var(--font-ui);
  padding:9px 14px;box-shadow:0 4px 14px -4px rgba(64,120,240,.6),inset 0 1px 0 rgba(255,255,255,.25);
  transition:filter .15s,transform .05s;
}
.export svg{width:15px;height:15px;display:block}
.export:hover{filter:brightness(1.08)}
.export:active{transform:translateY(1px)}

/* ── main / stage ────────────────────────────────── */
#main{flex:1;display:flex;min-height:0}
#stage-wrap{
  flex:1;position:relative;background:var(--canvas);overflow:hidden;
  box-shadow:inset 0 0 0 1px rgba(23,28,40,.06),inset 0 16px 34px -26px rgba(23,28,40,.55);
}
#grid{position:absolute;inset:0;background-image:radial-gradient(circle,var(--dot) 1px,transparent 1.5px);background-size:24px 24px}
#stage{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
#stageWrap.pan-ready #stage{cursor:grab}
#stageWrap.grabbing #stage{cursor:grabbing}

.sel-outline{fill:none;stroke:var(--accent-deep);stroke-width:1.25;vector-effect:non-scaling-stroke;pointer-events:none}
.sel-line{fill:none;stroke:var(--accent-deep);stroke-width:3.5;vector-effect:non-scaling-stroke;stroke-linecap:round;pointer-events:none;opacity:.95}
.hover-outline{fill:none;stroke:rgba(61,126,255,.45);stroke-width:1.2;vector-effect:non-scaling-stroke;pointer-events:none}
.hover-line{fill:none;stroke:rgba(61,126,255,.3);stroke-width:6;vector-effect:non-scaling-stroke;stroke-linecap:round;pointer-events:none}
.handle{fill:#fff;stroke:var(--accent-deep);stroke-width:1.25;vector-effect:non-scaling-stroke;transition:fill .1s}
.handle:hover{fill:#dbe7ff}
.guide{stroke:var(--pink);stroke-width:1;vector-effect:non-scaling-stroke;pointer-events:none}
.marquee{fill:rgba(61,126,255,.08);stroke:var(--accent-deep);stroke-width:1;vector-effect:non-scaling-stroke;stroke-dasharray:5 4;pointer-events:none}
.preview{fill:rgba(61,126,255,.13);stroke:var(--accent-deep);stroke-width:1.5;vector-effect:non-scaling-stroke;stroke-dasharray:6 4;pointer-events:none}
.preview-line{fill:none}
[data-handle="nw"],[data-handle="se"]{cursor:nwse-resize}
[data-handle="ne"],[data-handle="sw"]{cursor:nesw-resize}
[data-handle="n"],[data-handle="s"]{cursor:ns-resize}
[data-handle="e"],[data-handle="w"]{cursor:ew-resize}

#empty-state{
  position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;
  pointer-events:none;transition:opacity .4s ease;animation:esIn .6s ease .1s both;
}
#empty-state.hidden{opacity:0}
#empty-state svg{margin-bottom:5px}
.es-title{font-size:15px;font-weight:650;color:#78829a;letter-spacing:-.01em}
.es-sub{font-size:12.5px;color:#98a2b8;display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:center}
@keyframes esIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
kbd{
  font:600 10.5px var(--font-mono);color:#5c667e;background:#e9ecf2;border:1px solid #d4d9e4;
  border-bottom-width:2px;border-radius:5px;padding:2px 6px;
}

/* ── properties panel ────────────────────────────── */
#panel{
  width:264px;flex:0 0 264px;background:var(--bg-panel);border-left:1px solid rgba(255,255,255,.07);
  display:flex;flex-direction:column;padding:14px 14px 10px;overflow-y:auto;
}
#panel::-webkit-scrollbar{width:9px}
#panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:5px}
#panel section{margin-bottom:18px}
.sec-title{
  margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);
  display:flex;align-items:center;gap:8px;
}
.sec-title::after{content:"";flex:1;height:1px;background:rgba(255,255,255,.07)}
.sec-note{margin:-4px 0 10px;font-size:10.5px;color:#5f6980}
#sel-row{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px;gap:8px}
.sel-name{font-weight:650;font-size:13px;color:var(--text)}
.sel-count{font:500 10.5px var(--font-mono);color:#7b8499;white-space:nowrap}
.prop-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.field{display:flex;flex-direction:column;gap:4px}
.field span{font-size:9.5px;font-weight:700;letter-spacing:.1em;color:var(--faint);text-transform:uppercase}
input[type=number]{
  width:100%;min-width:0;background:var(--bg-input);border:1px solid rgba(255,255,255,.1);border-radius:7px;
  color:var(--text);font:500 12px var(--font-mono);padding:6px 8px;
  transition:border-color .15s,box-shadow .15s;
}
input[type=number]:disabled{opacity:.35;cursor:default}
input[type=number]:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(77,141,255,.16)}

.row{display:flex;align-items:center;gap:8px;margin-bottom:9px}
.row .lbl{flex:0 0 48px;font-size:11.5px;color:var(--muted)}
input[type=color]{
  -webkit-appearance:none;appearance:none;width:40px;height:28px;padding:3px;cursor:pointer;
  border:1px solid rgba(255,255,255,.14);border-radius:8px;background:var(--bg-input);
  transition:transform .06s,border-color .15s;
}
input[type=color]:hover{border-color:rgba(255,255,255,.3)}
input[type=color]:active{transform:scale(.94)}
input[type=color]:focus{outline:none;border-color:var(--accent)}
input[type=color]::-webkit-color-swatch-wrapper{padding:0}
input[type=color]::-webkit-color-swatch{border:none;border-radius:5px}
.hex{
  flex:1;min-width:0;background:var(--bg-input);border:1px solid rgba(255,255,255,.1);border-radius:7px;
  color:var(--muted);font:500 11.5px var(--font-mono);padding:6px 8px;text-transform:lowercase;
  transition:border-color .15s,box-shadow .15s;
}
.hex:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(77,141,255,.16);color:#fff}
.unit{font:500 10.5px var(--font-mono);color:var(--faint);width:18px}

.ib-row{display:flex;gap:6px}
.ib-row .ib{flex:1;height:32px}
.ib.danger:hover:not(:disabled){background:rgba(255,92,92,.16);color:#ff8f8f}

.panel-help{margin-top:auto;padding-top:14px;border-top:1px solid rgba(255,255,255,.07)}
.ph-title{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);margin-bottom:9px}
.ph-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px 8px;font-size:11px;color:#8b94a8;align-items:center}

/* ── status bar ──────────────────────────────────── */
#statusbar{
  height:30px;flex:0 0 30px;background:#141821;border-top:1px solid rgba(255,255,255,.06);
  display:flex;align-items:center;justify-content:space-between;padding:0 12px;font-size:11px;color:#7f899e;
}
.st-left{display:flex;align-items:center;gap:10px}
.st-sep{width:1px;height:12px;background:rgba(255,255,255,.09)}
.mono{font-family:var(--font-mono);font-size:10.5px;letter-spacing:.02em}
#saved{display:flex;align-items:center;gap:6px;opacity:.4;transition:opacity .5s}
#saved .dot{width:6px;height:6px;border-radius:50%;background:#3ecf8e;box-shadow:0 0 6px rgba(62,207,142,.8)}
#saved.on{animation:savedPulse 1.6s ease-out}
@keyframes savedPulse{0%{opacity:1}60%{opacity:1}100%{opacity:.4}}
.st-right{white-space:nowrap}

@media (max-width:1120px){#doc-name{display:none}.st-right{display:none}}
@media (max-width:940px){#panel{width:236px;flex-basis:236px}}
</style>
</head>
<body>

<header id="topbar">
  <div class="brand">
    <svg class="logo" width="26" height="26" viewBox="0 0 28 28" aria-hidden="true">
      <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#5b8cff"/><stop offset="1" stop-color="#3b5fe8"/>
      </linearGradient></defs>
      <rect x="1" y="1" width="26" height="26" rx="7" fill="url(#lg)"/>
      <path d="M8 20.5 C 11.5 9.5, 16 9, 20.5 12" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <circle cx="8" cy="20.5" r="2" fill="#fff"/>
      <circle cx="20.5" cy="12" r="2" fill="#fff"/>
    </svg>
    <span class="wordmark">Vectorly</span>
    <input id="doc-name" type="text" value="Untitled" maxlength="48" spellcheck="false" aria-label="Document name">
  </div>

  <nav id="tools" class="seg" aria-label="Tools">
    <button type="button" data-tool="select" class="active" title="Select — V" aria-label="Select tool" aria-pressed="true">
      <svg viewBox="0 0 24 24" fill="none"><path d="M5.5 3.5 L19 12.2 L12.4 13.4 L15.6 19.6 L13.1 20.8 L10 14.6 L5.5 17.6 Z" fill="currentColor" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>
    </button>
    <button type="button" data-tool="rect" title="Rectangle — R" aria-label="Rectangle tool" aria-pressed="false">
      <svg viewBox="0 0 24 24" fill="none"><rect x="4.5" y="6" width="15" height="12" rx="1.6" stroke="currentColor" stroke-width="1.7"/></svg>
    </button>
    <button type="button" data-tool="ellipse" title="Ellipse — E" aria-label="Ellipse tool" aria-pressed="false">
      <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="1.7"/></svg>
    </button>
    <button type="button" data-tool="line" title="Line — L" aria-label="Line tool" aria-pressed="false">
      <svg viewBox="0 0 24 24" fill="none"><path d="M5 19 L19 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="5" cy="19" r="1.7" fill="currentColor"/><circle cx="19" cy="5" r="1.7" fill="currentColor"/></svg>
    </button>
  </nav>

  <div class="tb-right">
    <button id="undo" type="button" class="ib" title="Undo — ⌘/Ctrl+Z" aria-label="Undo" disabled>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 4.8 L4.8 8.5 L8.5 12.2"/><path d="M4.8 8.5 H14.2 A5.2 5.2 0 0 1 14.2 18.9 H10"/></svg>
    </button>
    <button id="redo" type="button" class="ib" title="Redo — ⌘/Ctrl+Shift+Z" aria-label="Redo" disabled>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 4.8 L19.2 8.5 L15.5 12.2"/><path d="M19.2 8.5 H9.8 A5.2 5.2 0 0 0 9.8 18.9 H14"/></svg>
    </button>
    <div class="sep"></div>
    <div class="zoom-seg">
      <button id="zoom-out" type="button" class="ib" title="Zoom out" aria-label="Zoom out">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6.5 12 H17.5"/></svg>
      </button>
      <button id="zoom-label" type="button" title="Reset to 100%">100%</button>
      <button id="zoom-in" type="button" class="ib" title="Zoom in" aria-label="Zoom in">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6.5 12 H17.5"/><path d="M12 6.5 V17.5"/></svg>
      </button>
    </div>
    <div class="sep"></div>
    <button id="export-svg" type="button" class="export" title="Download drawing.svg" aria-label="Export SVG">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5 V14.5"/><path d="M7.8 10.8 L12 15 L16.2 10.8"/><path d="M5.5 19 H18.5"/></svg>
      <span>Export SVG</span>
    </button>
  </div>
</header>

<div id="main">
  <div id="stage-wrap">
    <div id="grid"></div>
    <svg id="stage" aria-label="Drawing canvas">
      <g id="viewport" transform="translate(0 0) scale(1)">
        <g id="shapesG"></g>
        <g id="overlay"></g>
      </g>
    </svg>
    <div id="empty-state">
      <svg width="54" height="54" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 18.5 C 9 8, 14 7.5, 19 11.5" stroke="#8f9bb3" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M6 18.5 L10.5 9.5" stroke="#b9c2d4" stroke-width="1" stroke-dasharray="2 2.4"/>
        <rect x="4.6" y="17.1" width="2.8" height="2.8" rx="0.7" fill="#eef1f6" stroke="#8f9bb3" stroke-width="1.2"/>
        <circle cx="19" cy="11.5" r="1.9" fill="#eef1f6" stroke="#8f9bb3" stroke-width="1.2"/>
      </svg>
      <div class="es-title">A blank canvas, ready for vectors</div>
      <div class="es-sub">
        <span><kbd>R</kbd> rectangle</span><span>·</span><span><kbd>E</kbd> ellipse</span><span>·</span><span><kbd>L</kbd> line</span>
        <span>— click-drag to draw, <kbd>V</kbd> to select</span>
      </div>
    </div>
  </div>

  <aside id="panel" aria-label="Properties">
    <section>
      <h3 class="sec-title">Selection</h3>
      <div id="sel-row"><span id="sel-name" class="sel-name">Nothing selected</span><span id="sel-count" class="sel-count"></span></div>
      <div class="prop-grid">
        <label class="field"><span>X</span><input type="number" id="prop-x" step="1" disabled></label>
        <label class="field"><span>Y</span><input type="number" id="prop-y" step="1" disabled></label>
        <label class="field"><span>W</span><input type="number" id="prop-w" step="1" disabled></label>
        <label class="field"><span>H</span><input type="number" id="prop-h" step="1" disabled></label>
      </div>
    </section>

    <section>
      <h3 class="sec-title">Style</h3>
      <div id="style-note" class="sec-note">sets the style for new shapes</div>
      <div class="row"><span class="lbl">Fill</span><input type="color" id="fill-color" value="#5b8cff"><input type="text" id="fill-hex" class="hex" value="#5b8cff" spellcheck="false" aria-label="Fill hex"></div>
      <div class="row"><span class="lbl">Stroke</span><input type="color" id="stroke-color" value="#2b3550"><input type="text" id="stroke-hex" class="hex" value="#2b3550" spellcheck="false" aria-label="Stroke hex"></div>
      <div class="row"><span class="lbl">Width</span><input type="number" id="stroke-width" min="0" max="500" step="1" value="2"><span class="unit">px</span></div>
    </section>

    <section>
      <h3 class="sec-title">Arrange</h3>
      <div class="ib-row">
        <button id="btn-fwd" type="button" class="ib" title="Bring forward — ]" aria-label="Bring forward" disabled>
          <svg viewBox="0 0 24 24" fill="none"><rect x="9.5" y="9.5" width="10" height="10" rx="1.8" fill="currentColor"/><path d="M14.5 4.5 H6.8 A2.3 2.3 0 0 0 4.5 6.8 V14.5" stroke="currentColor" stroke-width="1.6"/></svg>
        </button>
        <button id="btn-bwd" type="button" class="ib" title="Send backward — [" aria-label="Send backward" disabled>
          <svg viewBox="0 0 24 24" fill="none"><path d="M9.5 14.5 H17.2 A2.3 2.3 0 0 0 19.5 12.2 V4.5" stroke="currentColor" stroke-width="1.6"/><rect x="4.5" y="9.5" width="10" height="10" rx="1.8" fill="currentColor"/></svg>
        </button>
        <button id="btn-dup" type="button" class="ib" title="Duplicate — ⌘/Ctrl+D" aria-label="Duplicate" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="8.2" y="8.2" width="11" height="11" rx="2"/><path d="M15.5 4.5 H6.8 A2.3 2.3 0 0 0 4.5 6.8 V15.5"/></svg>
        </button>
        <button id="btn-del" type="button" class="ib danger" title="Delete — ⌫" aria-label="Delete" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 7 H18.5"/><path d="M9.5 7 V4.8 H14.5 V7"/><path d="M7.5 7 L8.3 19 H15.7 L16.5 7"/><path d="M10.5 10.5 V15.5 M13.5 10.5 V15.5"/></svg>
        </button>
      </div>
    </section>

    <div class="panel-help">
      <div class="ph-title">Shortcuts</div>
      <div class="ph-grid">
        <span><kbd>V</kbd> select</span><span><kbd>R</kbd> rectangle</span>
        <span><kbd>E</kbd> ellipse</span><span><kbd>L</kbd> line</span>
        <span><kbd>Space</kbd> + drag pan</span><span><kbd>⌘/Ctrl</kbd>+scroll zoom</span>
        <span><kbd>⇧</kbd> constrain / snap</span><span><kbd>[</kbd> <kbd>]</kbd> layer order</span>
        <span><kbd>⌫</kbd> delete</span><span><kbd>⌘D</kbd> duplicate</span>
      </div>
    </div>
  </aside>
</div>

<footer id="statusbar">
  <div class="st-left">
    <span id="saved"><i class="dot"></i>Saved</span>
    <span class="st-sep"></span>
    <span id="coords" class="mono">x 0&nbsp;&nbsp;&nbsp;y 0</span>
    <span class="st-sep"></span>
    <span id="shape-count">0 shapes</span>
  </div>
  <div class="st-right mono">V select · R rect · E ellipse · L line · shift constrains · space+drag pans · ⌘1 fit</div>
</footer>

<script>
(function () {
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);

const stage = $('stage'), viewport = $('viewport'), shapesG = $('shapesG'), overlay = $('overlay');
const stageWrap = $('stage-wrap'), grid = $('grid'), emptyState = $('empty-state');
const coordsEl = $('coords'), countEl = $('shape-count'), savedEl = $('saved'), zoomLabel = $('zoom-label');
const fillInp = $('fill-color'), fillHex = $('fill-hex');
const strokeInp = $('stroke-color'), strokeHex = $('stroke-hex');
const swInp = $('stroke-width');
const propX = $('prop-x'), propY = $('prop-y'), propW = $('prop-w'), propH = $('prop-h');

/* ── state ─────────────────────────────────────────── */
const S = {
  shapes: [], sel: new Set(), tool: 'select',
  style: { fill: '#5b8cff', stroke: '#2b3550', sw: 2 },
  zoom: 1, panX: 0, panY: 0, idc: 1, name: 'Untitled'
};
let drag = null, guides = null, spaceDown = false, hoverId = null;

/* ── helpers ───────────────────────────────────────── */
const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
const r2 = n => Math.round(n * 100) / 100;
const clone = a => a.map(s => Object.assign({}, s));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function nextId() { return 's' + (S.idc++); }
function normColor(v) {
  if (typeof v !== 'string') return '#000000';
  v = v.toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if (/^#[0-9a-f]{3}$/.test(v)) return '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
  return '#000000';
}
function bbox(s) {
  if (s.type === 'line') {
    const x = Math.min(s.x1, s.x2), y = Math.min(s.y1, s.y2);
    return { x, y, w: Math.abs(s.x2 - s.x1), h: Math.abs(s.y2 - s.y1) };
  }
  return { x: s.x, y: s.y, w: s.w, h: s.h };
}
function unionBox(list) {
  if (!list.length) return { x: 0, y: 0, w: 0, h: 0 };
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const s of list) {
    const b = bbox(s);
    if (b.x < x1) x1 = b.x; if (b.y < y1) y1 = b.y;
    if (b.x + b.w > x2) x2 = b.x + b.w; if (b.y + b.h > y2) y2 = b.y + b.h;
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}
const typeLabel = t => t === 'rect' ? 'Rectangle' : t === 'ellipse' ? 'Ellipse' : 'Line';
function distSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / l2, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function toWorld(e) {
  const r = stage.getBoundingClientRect();
  return { x: (e.clientX - r.left - S.panX) / S.zoom, y: (e.clientY - r.top - S.panY) / S.zoom };
}

/* ── history ───────────────────────────────────────── */
const undoStack = [], redoStack = [], HMAX = 400;
function pushHistory(pre) {
  undoStack.push(pre);
  if (undoStack.length > HMAX) undoStack.shift();
  redoStack.length = 0;
  refreshHist();
}
function refreshHist() {
  $('undo').disabled = !undoStack.length;
  $('redo').disabled = !redoStack.length;
}
function undo() { if (undoStack.length) { redoStack.push(clone(S.shapes)); restore(undoStack.pop()); } }
function redo() { if (redoStack.length) { undoStack.push(clone(S.shapes)); restore(redoStack.pop()); } }
function restore(shapes) {
  S.shapes = shapes;
  const ids = new Set(shapes.map(s => s.id));
  S.sel = new Set([...S.sel].filter(id => ids.has(id)));
  renderAll(); saveSoon();
}

/* ── rendering: shapes ─────────────────────────────── */
const shapeEls = new Map();
function setGeom(s, el) {
  if (s.type === 'rect') {
    el.setAttribute('x', s.x); el.setAttribute('y', s.y);
    el.setAttribute('width', Math.max(0, s.w)); el.setAttribute('height', Math.max(0, s.h));
  } else if (s.type === 'ellipse') {
    el.setAttribute('cx', s.x + s.w / 2); el.setAttribute('cy', s.y + s.h / 2);
    el.setAttribute('rx', Math.max(0, s.w / 2)); el.setAttribute('ry', Math.max(0, s.h / 2));
  } else {
    el.setAttribute('x1', s.x1); el.setAttribute('y1', s.y1);
    el.setAttribute('x2', s.x2); el.setAttribute('y2', s.y2);
  }
}
function syncShapeEl(s) {
  let el = shapeEls.get(s.id);
  if (!el) {
    el = document.createElementNS(NS, s.type === 'line' ? 'line' : (s.type === 'ellipse' ? 'ellipse' : 'rect'));
    el.setAttribute('data-shape', s.type);
    el.setAttribute('data-id', s.id);
    if (s.type === 'line') el.setAttribute('stroke-linecap', 'round');
    shapeEls.set(s.id, el);
  }
  setGeom(s, el);
  el.setAttribute('fill', s.fill);
  el.setAttribute('stroke', s.stroke);
  el.setAttribute('stroke-width', s.sw);
  if (S.sel.has(s.id)) el.setAttribute('data-selected', 'true');
  else el.removeAttribute('data-selected');
  return el;
}
function renderShapes() {
  const alive = new Set(S.shapes.map(s => s.id));
  for (const [id, el] of [...shapeEls]) if (!alive.has(id)) { el.remove(); shapeEls.delete(id); }
  for (const s of S.shapes) shapesG.appendChild(syncShapeEl(s));
}

/* ── rendering: overlay chrome ─────────────────────── */
function svgEl(name, attrs, cls) {
  const el = document.createElementNS(NS, name);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (cls) el.setAttribute('class', cls);
  return el;
}
function drawHandles(s) {
  const b = bbox(s), hs = 8 / S.zoom;
  const pts = {
    nw: [b.x, b.y], n: [b.x + b.w / 2, b.y], ne: [b.x + b.w, b.y], e: [b.x + b.w, b.y + b.h / 2],
    se: [b.x + b.w, b.y + b.h], s: [b.x + b.w / 2, b.y + b.h], sw: [b.x, b.y + b.h], w: [b.x, b.y + b.h / 2]
  };
  for (const k in pts) {
    overlay.appendChild(svgEl('rect', {
      x: pts[k][0] - hs / 2, y: pts[k][1] - hs / 2, width: hs, height: hs,
      rx: 1.6 / S.zoom, 'data-handle': k
    }, 'handle'));
  }
}
function mq() {
  return {
    x: Math.min(drag.sx, drag.cx), y: Math.min(drag.sy, drag.cy),
    w: Math.abs(drag.cx - drag.sx), h: Math.abs(drag.cy - drag.sy)
  };
}
function drawRectGeom() {
  let w = drag.cx - drag.sx, h = drag.cy - drag.sy;
  if (drag.shift) {
    const m = Math.max(Math.abs(w), Math.abs(h));
    w = (w < 0 ? -1 : 1) * m; h = (h < 0 ? -1 : 1) * m;
  }
  return { x: Math.min(drag.sx, drag.sx + w), y: Math.min(drag.sy, drag.sy + h), w: Math.abs(w), h: Math.abs(h) };
}
function lineGeomEnd() {
  let x2 = drag.cx, y2 = drag.cy;
  if (drag.shift) {
    const ang = Math.atan2(drag.cy - drag.sy, drag.cx - drag.sx);
    const a = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4);
    const len = Math.hypot(x2 - drag.sx, y2 - drag.sy);
    x2 = drag.sx + Math.cos(a) * len; y2 = drag.sy + Math.sin(a) * len;
  }
  return { x: x2, y: y2 };
}
function drawPreview() {
  if (drag.tool === 'line') {
    const e = lineGeomEnd();
    overlay.appendChild(svgEl('line', { x1: drag.sx, y1: drag.sy, x2: e.x, y2: e.y }, 'preview preview-line'));
  } else {
    const r = drawRectGeom();
    if (drag.tool === 'rect') overlay.appendChild(svgEl('rect', { x: r.x, y: r.y, width: r.w, height: r.h }, 'preview'));
    else overlay.appendChild(svgEl('ellipse', { cx: r.x + r.w / 2, cy: r.y + r.h / 2, rx: r.w / 2, ry: r.h / 2 }, 'preview'));
  }
}
function renderOverlay() {
  overlay.textContent = '';
  if (guides) for (const g of guides) overlay.appendChild(svgEl('line', { x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2 }, 'guide'));
  for (const s of S.shapes) {
    if (!S.sel.has(s.id)) continue;
    if (s.type === 'line') overlay.appendChild(svgEl('line', { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 }, 'sel-line'));
    else { const b = bbox(s); overlay.appendChild(svgEl('rect', { x: b.x, y: b.y, width: b.w, height: b.h }, 'sel-outline')); }
  }
  if (hoverId && S.tool === 'select' && !drag && !S.sel.has(hoverId)) {
    for (const s of S.shapes) if (s.id === hoverId) {
      if (s.type === 'line') overlay.appendChild(svgEl('line', { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 }, 'hover-line'));
      else { const b = bbox(s); overlay.appendChild(svgEl('rect', { x: b.x, y: b.y, width: b.w, height: b.h }, 'hover-outline')); }
      break;
    }
  }
  if (S.sel.size === 1) {
    for (const s of S.shapes) if (S.sel.has(s.id)) { drawHandles(s); break; }
  }
  if (drag) {
    if (drag.kind === 'draw') drawPreview();
    else if (drag.kind === 'marquee') { const m = mq(); overlay.appendChild(svgEl('rect', { x: m.x, y: m.y, width: m.w, height: m.h }, 'marquee')); }
  }
}
function renderAll() {
  renderShapes();
  renderOverlay();
  syncPanel();
  emptyState.classList.toggle('hidden', S.shapes.length > 0);
}

/* ── view: zoom & pan ──────────────────────────────── */
function gridStep() { let st = 24 * S.zoom; while (st < 13) st *= 2; while (st > 52) st /= 2; return st; }
function applyView() {
  viewport.setAttribute('transform', 'translate(' + S.panX + ' ' + S.panY + ') scale(' + S.zoom + ')');
  const st = gridStep();
  grid.style.backgroundSize = st + 'px ' + st + 'px';
  grid.style.backgroundPosition = (S.panX % st) + 'px ' + (S.panY % st) + 'px';
  zoomLabel.textContent = Math.round(S.zoom * 100) + '%';
  renderOverlay();
}
function setZoom(nz, cx, cy) {
  const r = stage.getBoundingClientRect();
  if (cx == null) { cx = r.width / 2; cy = r.height / 2; }
  nz = clamp(nz, 0.1, 8);
  S.panX = cx - (cx - S.panX) / S.zoom * nz;
  S.panY = cy - (cy - S.panY) / S.zoom * nz;
  S.zoom = nz;
  applyView(); saveSoon();
}
function zoomFit() {
  const r = stage.getBoundingClientRect();
  if (!S.shapes.length) { setZoom(1); return; }
  const b = unionBox(S.shapes), pad = 60;
  const z = clamp(Math.min((r.width - pad * 2) / Math.max(b.w, 1), (r.height - pad * 2) / Math.max(b.h, 1)), 0.1, 8);
  S.zoom = z;
  S.panX = (r.width - b.w * z) / 2 - b.x * z;
  S.panY = (r.height - b.h * z) / 2 - b.y * z;
  applyView(); saveSoon();
}

/* ── properties panel ──────────────────────────────── */
function setNum(inp, v) { inp.value = (v == null || !Number.isFinite(v)) ? '' : r2(v); }
function syncPanel() {
  const sel = S.shapes.filter(s => S.sel.has(s.id));
  const single = sel.length === 1 ? sel[0] : null;
  $('sel-name').textContent = sel.length === 0 ? 'Nothing selected' : (single ? typeLabel(single.type) : 'Multi-selection');
  $('sel-count').textContent = sel.length ? (sel.length + (sel.length === 1 ? ' object' : ' objects')) : '';
  const b = sel.length ? unionBox(sel) : null;
  setNum(propX, b ? b.x : null); setNum(propY, b ? b.y : null);
  setNum(propW, b ? b.w : null); setNum(propH, b ? b.h : null);
  propX.disabled = propY.disabled = propW.disabled = propH.disabled = !sel.length;
  const f = normColor(single ? single.fill : S.style.fill);
  const st = normColor(single ? single.stroke : S.style.stroke);
  fillInp.value = f; fillHex.value = f;
  strokeInp.value = st; strokeHex.value = st;
  const sw = single ? single.sw : S.style.sw;
  swInp.value = Number.isFinite(sw) ? r2(sw) : '';
  $('btn-del').disabled = $('btn-dup').disabled = $('btn-fwd').disabled = $('btn-bwd').disabled = !sel.length;
  $('style-note').textContent = sel.length
    ? ('applies to ' + (sel.length === 1 ? 'the selected shape' : sel.length + ' shapes'))
    : 'sets the style for new shapes';
  countEl.textContent = S.shapes.length + (S.shapes.length === 1 ? ' shape' : ' shapes');
}

/* transactional history for input widgets */
let txPre = null;
function beginTx() { if (txPre === null) txPre = clone(S.shapes); }
function flushTx() {
  if (txPre === null) return;
  if (!same(clone(S.shapes), txPre)) pushHistory(txPre);
  txPre = null;
}
function offsetShape(s, dx, dy) {
  if (s.type === 'line') { s.x1 += dx; s.y1 += dy; s.x2 += dx; s.y2 += dy; }
  else { s.x += dx; s.y += dy; }
}
function setSize(s, key, val) {
  if (s.type === 'line') {
    if (key === 'w') { const mn = Math.min(s.x1, s.x2); if (s.x1 >= s.x2) s.x1 = mn + val; else s.x2 = mn + val; }
    else { const mn = Math.min(s.y1, s.y2); if (s.y1 >= s.y2) s.y1 = mn + val; else s.y2 = mn + val; }
  } else s[key] = Math.max(0, val);
}
function applyProp(key, val) {
  const sel = S.shapes.filter(s => S.sel.has(s.id));
  if (!sel.length) return;
  const u = unionBox(sel);
  if (key === 'x') for (const s of sel) offsetShape(s, val - u.x, 0);
  else if (key === 'y') for (const s of sel) offsetShape(s, 0, val - u.y);
  else for (const s of sel) setSize(s, key, val);
}
function bindProp(inp, key) {
  const apply = () => { const v = parseFloat(inp.value); if (Number.isFinite(v)) applyProp(key, v); };
  inp.addEventListener('input', () => { beginTx(); apply(); renderShapes(); renderOverlay(); saveSoon(); });
  inp.addEventListener('change', () => { beginTx(); apply(); flushTx(); renderAll(); });
}
bindProp(propX, 'x'); bindProp(propY, 'y'); bindProp(propW, 'w'); bindProp(propH, 'h');

function styleSet(which, v) {
  S.style[which] = v;
  for (const s of S.shapes) if (S.sel.has(s.id)) s[which] = v;
}
function bindColor(colorInp, hexInp, which) {
  const apply = () => { const v = colorInp.value || '#000000'; styleSet(which, v); hexInp.value = v; };
  colorInp.addEventListener('input', () => { beginTx(); apply(); renderShapes(); saveSoon(); });
  colorInp.addEventListener('change', () => { beginTx(); apply(); flushTx(); renderAll(); });
  hexInp.addEventListener('change', () => {
    let v = hexInp.value.trim();
    if (v && v[0] !== '#') v = '#' + v;
    if (/^#[0-9a-f]{3}$|^#[0-9a-f]{6}$/i.test(v)) {
      v = normColor(v);
      colorInp.value = v;
      beginTx(); styleSet(which, v); hexInp.value = v; flushTx(); renderAll();
    } else hexInp.value = colorInp.value;
  });
}
bindColor(fillInp, fillHex, 'fill');
bindColor(strokeInp, strokeHex, 'stroke');
swInp.addEventListener('input', () => {
  const v = parseFloat(swInp.value);
  if (!Number.isFinite(v)) return;
  beginTx(); styleSet('sw', clamp(v, 0, 500)); renderShapes(); saveSoon();
});
swInp.addEventListener('change', () => {
  const v = parseFloat(swInp.value);
  if (!Number.isFinite(v)) return;
  beginTx(); styleSet('sw', clamp(v, 0, 500)); flushTx(); renderAll();
});

/* ── hit testing ───────────────────────────────────── */
function hitTest(p) {
  for (let i = S.shapes.length - 1; i >= 0; i--) {
    const s = S.shapes[i];
    if (s.type === 'line') {
      if (distSeg(p.x, p.y, s.x1, s.y1, s.x2, s.y2) <= Math.max(s.sw / 2, 3 / S.zoom) + 3 / S.zoom) return s;
    } else if (s.type === 'ellipse') {
      const rx = s.w / 2, ry = s.h / 2, cx = s.x + rx, cy = s.y + ry;
      if (rx < 0.75 || ry < 0.75) {
        const b = bbox(s), t = 3 / S.zoom;
        if (p.x >= b.x - t && p.x <= b.x + b.w + t && p.y >= b.y - t && p.y <= b.y + b.h + t) return s;
      } else {
        const nx = (p.x - cx) / rx, ny = (p.y - cy) / ry;
        if (nx * nx + ny * ny <= 1) return s;
      }
    } else {
      if (p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h) return s;
    }
  }
  return null;
}

/* ── drag interactions ─────────────────────────────── */
function startPan(e) {
  drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, panX: S.panX, panY: S.panY };
  stageWrap.classList.add('grabbing');
  try { stage.setPointerCapture(e.pointerId); } catch (_) {}
}
function startMove(e, p) {
  drag = {
    kind: 'move', sx: p.x, sy: p.y, cx: p.x, cy: p.y,
    sxC: e.clientX, syC: e.clientY, pre: clone(S.shapes),
    base: unionBox(S.shapes.filter(s => S.sel.has(s.id))), moved: false
  };
}
function startResize(e, p, h) {
  let s = null;
  for (const sh of S.shapes) if (S.sel.has(sh.id)) { s = sh; break; }
  drag = {
    kind: 'resize', handle: h, shape: s, pre: clone(S.shapes),
    start: p, orig: Object.assign({}, s), base: bbox(s),
    sxC: e.clientX, syC: e.clientY, moved: false
  };
}
function startMarquee(e, p, additive) {
  drag = { kind: 'marquee', sx: p.x, sy: p.y, cx: p.x, cy: p.y, sxC: e.clientX, syC: e.clientY, additive: !!additive };
  renderOverlay();
}
function startDraw(e, p) {
  drag = {
    kind: 'draw', tool: S.tool, sx: p.x, sy: p.y, cx: p.x, cy: p.y,
    sxC: e.clientX, syC: e.clientY, shift: e.shiftKey, pre: clone(S.shapes)
  };
  renderOverlay();
}
function offsetAll(dx, dy) {
  for (const s of S.shapes) if (S.sel.has(s.id)) offsetShape(s, dx, dy);
}

const ORIGIN = { x: 0, y: 0, w: 0, h: 0 };
function computeSnap(dx, dy) {
  const tol = 6 / S.zoom;
  const g = drag.base;
  const gx = [g.x + dx, g.x + g.w / 2 + dx, g.x + g.w + dx];
  const gy = [g.y + dy, g.y + g.h / 2 + dy, g.y + g.h + dy];
  const candsX = [{ v: 0, box: ORIGIN }], candsY = [{ v: 0, box: ORIGIN }];
  for (const s of S.shapes) {
    if (S.sel.has(s.id)) continue;
    const b = bbox(s);
    candsX.push({ v: b.x, box: b }, { v: b.x + b.w / 2, box: b }, { v: b.x + b.w, box: b });
    candsY.push({ v: b.y, box: b }, { v: b.y + b.h / 2, box: b }, { v: b.y + b.h, box: b });
  }
  let bx = null, by = null;
  for (const c of candsX) for (const f of gx) {
    const d = c.v - f;
    if (Math.abs(d) <= tol && (!bx || Math.abs(d) < Math.abs(bx.d))) bx = { d, v: c.v, box: c.box };
  }
  for (const c of candsY) for (const f of gy) {
    const d = c.v - f;
    if (Math.abs(d) <= tol && (!by || Math.abs(d) < Math.abs(by.d))) by = { d, v: c.v, box: c.box };
  }
  const pad = 24 / S.zoom, lines = [];
  if (bx) lines.push({ x1: bx.v, x2: bx.v, y1: Math.min(gy[0], bx.box.y) - pad, y2: Math.max(gy[2], bx.box.y + bx.box.h) + pad });
  if (by) lines.push({ y1: by.v, y2: by.v, x1: Math.min(gx[0], by.box.x) - pad, x2: Math.max(gx[2], by.box.x + by.box.w) + pad });
  return { dx: dx + (bx ? bx.d : 0), dy: dy + (by ? by.d : 0), lines };
}
function applyResize(p, shift) {
  const o = drag.orig, b = drag.base, h = drag.handle;
  const dx = p.x - drag.start.x, dy = p.y - drag.start.y;
  let nx = b.x, ny = b.y, nw = b.w, nh = b.h;
  if (h === 'w' || h === 'nw' || h === 'sw') { nx += dx; nw -= dx; }
  if (h === 'e' || h === 'ne' || h === 'se') { nw += dx; }
  if (h === 'n' || h === 'nw' || h === 'ne') { ny += dy; nh -= dy; }
  if (h === 's' || h === 'se' || h === 'sw') { nh += dy; }
  if (shift && (h === 'nw' || h === 'ne' || h === 'se' || h === 'sw') && b.w > 0.01 && b.h > 0.01) {
    const r = b.w / b.h;
    if (Math.abs(nw / nh) > r) nw = nh * r; else nh = nw / r;
  }
  if (nw < 0) { nx += nw; nw = -nw; }
  if (nh < 0) { ny += nh; nh = -nh; }
  const s = drag.shape;
  if (s.type === 'line') {
    const west = o.x1 < o.x2, north = o.y1 < o.y2;
    s.x1 = west ? nx : nx + nw;
    s.y1 = north ? ny : ny + nh;
    s.x2 = west ? nx + nw : nx;
    s.y2 = north ? ny + nh : ny;
  } else { s.x = nx; s.y = ny; s.w = nw; s.h = nh; }
}

stage.addEventListener('pointerdown', e => {
  flushTx();
  if (e.button === 1 || (spaceDown && e.button === 0)) {
    e.preventDefault();
    startPan(e);
    return;
  }
  if (e.button !== 0) return;
  try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  const p = toWorld(e);
  hoverId = null;
  const h = (e.target && e.target.getAttribute) ? e.target.getAttribute('data-handle') : null;
  if (h && S.tool === 'select') { startResize(e, p, h); return; }
  if (S.tool !== 'select') { startDraw(e, p); return; }
  const hit = hitTest(p);
  if (hit) {
    if (e.shiftKey) {
      if (S.sel.has(hit.id)) S.sel.delete(hit.id); else S.sel.add(hit.id);
      renderAll();
      return;
    }
    if (!S.sel.has(hit.id)) S.sel = new Set([hit.id]);
    renderShapes(); renderOverlay(); syncPanel();
    startMove(e, p);
  } else {
    startMarquee(e, p, e.shiftKey);
  }
});

stage.addEventListener('pointermove', e => {
  const p = toWorld(e);
  coordsEl.textContent = 'x ' + Math.round(p.x) + '   y ' + Math.round(p.y);
  if (!drag) {
    if (S.tool === 'select' && !spaceDown) {
      const hh = hitTest(p);
      const hid = hh ? hh.id : null;
      if (hid !== hoverId) { hoverId = hid; renderOverlay(); }
      stage.style.cursor = hh ? 'move' : '';
    } else if (hoverId !== null) { hoverId = null; renderOverlay(); }
    return;
  }
  if (drag.kind === 'pan') {
    S.panX = drag.panX + (e.clientX - drag.sx);
    S.panY = drag.panY + (e.clientY - drag.sy);
    applyView();
    return;
  }
  if (drag.kind === 'draw') {
    drag.cx = p.x; drag.cy = p.y; drag.shift = e.shiftKey;
    renderOverlay();
    return;
  }
  if (drag.kind === 'marquee') {
    drag.cx = p.x; drag.cy = p.y;
    renderOverlay();
    return;
  }
  const d = Math.hypot(e.clientX - drag.sxC, e.clientY - drag.syC);
  if (d >= 2) drag.moved = true;
  if (drag.kind === 'move') {
    const snap = computeSnap(p.x - drag.sx, p.y - drag.sy);
    offsetAll(snap.dx, snap.dy);
    guides = snap.lines;
  } else if (drag.kind === 'resize') {
    applyResize(p, e.shiftKey);
  }
  renderShapes(); renderOverlay(); syncPanel();
});

function cancelDrag() {
  if (!drag) return;
  if (drag.kind === 'move' || drag.kind === 'resize') S.shapes = drag.pre;
  drag = null; guides = null;
  stageWrap.classList.remove('grabbing');
  renderAll();
}
function endDrag(e) {
  if (!drag) return;
  const d = Math.hypot(e.clientX - drag.sxC, e.clientY - drag.syC);
  const kind = drag.kind;
  if (kind === 'draw') {
    const p = toWorld(e);
    drag.cx = p.x; drag.cy = p.y; drag.shift = e.shiftKey;
    if (d >= 3) {
      pushHistory(drag.pre);
      let s;
      if (drag.tool === 'line') {
        const en = lineGeomEnd();
        s = { id: nextId(), type: 'line', x1: drag.sx, y1: drag.sy, x2: en.x, y2: en.y };
      } else {
        const rr = drawRectGeom();
        s = { id: nextId(), type: drag.tool, x: rr.x, y: rr.y, w: rr.w, h: rr.h };
      }
      s.fill = S.style.fill; s.stroke = S.style.stroke; s.sw = S.style.sw;
      S.shapes.push(s);
      S.sel = new Set([s.id]);
      setTool('select');
    }
  } else if (kind === 'move' || kind === 'resize') {
    if (drag.moved) pushHistory(drag.pre);
  } else if (kind === 'marquee') {
    if (d >= 3) {
      const m = mq();
      const next = new Set(drag.additive ? [...S.sel] : []);
      for (const s of S.shapes) if (intersects(m, bbox(s))) next.add(s.id);
      S.sel = next;
    } else if (!drag.additive) S.sel = new Set();
  }
  stageWrap.classList.remove('grabbing');
  drag = null; guides = null;
  renderAll();
  saveSoon();
}
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', cancelDrag);

stageWrap.addEventListener('wheel', e => {
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) {
    const r = stage.getBoundingClientRect();
    setZoom(S.zoom * Math.exp(-e.deltaY * 0.0022), e.clientX - r.left, e.clientY - r.top);
  } else {
    S.panX -= e.deltaX; S.panY -= e.deltaY;
    applyView(); saveSoon();
  }
}, { passive: false });

/* ── tools ─────────────────────────────────────────── */
function setTool(t) {
  S.tool = t;
  hoverId = null;
  const btns = document.querySelectorAll('[data-tool]');
  for (const b of btns) {
    const on = b.getAttribute('data-tool') === t;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  stage.style.cursor = t === 'select' ? '' : 'crosshair';
  renderOverlay();
}
document.querySelectorAll('[data-tool]').forEach(b =>
  b.addEventListener('click', () => setTool(b.getAttribute('data-tool'))));

/* ── edit actions ──────────────────────────────────── */
function deleteSel() {
  if (!S.sel.size) return;
  pushHistory(clone(S.shapes));
  S.shapes = S.shapes.filter(s => !S.sel.has(s.id));
  S.sel = new Set();
  renderAll(); saveSoon();
}
function duplicateSel() {
  if (!S.sel.size) return;
  pushHistory(clone(S.shapes));
  const copies = [];
  for (const s of S.shapes) if (S.sel.has(s.id)) {
    const c = Object.assign({}, s, { id: nextId() });
    if (c.type === 'line') { c.x1 += 10; c.y1 += 10; c.x2 += 10; c.y2 += 10; }
    else { c.x += 10; c.y += 10; }
    copies.push(c);
  }
  S.shapes.push(...copies);
  S.sel = new Set(copies.map(c => c.id));
  renderAll(); saveSoon();
}
function zOrder(dir) {
  if (!S.sel.size) return;
  const pre = clone(S.shapes), changed = [false];
  const swap = (i, j) => { const t = S.shapes[i]; S.shapes[i] = S.shapes[j]; S.shapes[j] = t; changed[0] = true; };
  if (dir > 0) {
    for (let i = S.shapes.length - 1; i >= 0; i--)
      if (S.sel.has(S.shapes[i].id) && i < S.shapes.length - 1 && !S.sel.has(S.shapes[i + 1].id)) swap(i, i + 1);
  } else {
    for (let i = 0; i < S.shapes.length; i++)
      if (S.sel.has(S.shapes[i].id) && i > 0 && !S.sel.has(S.shapes[i - 1].id)) swap(i, i - 1);
  }
  if (changed[0]) { pushHistory(pre); renderAll(); saveSoon(); }
}
function nudge(dx, dy) {
  if (!S.sel.size) return;
  pushHistory(clone(S.shapes));
  offsetAll(dx, dy);
  renderAll(); saveSoon();
}

/* ── keyboard ──────────────────────────────────────── */
document.addEventListener('keydown', e => {
  const t = e.target;
  const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  if (e.code === 'Space' && !typing) {
    e.preventDefault();
    if (!spaceDown) { spaceDown = true; stageWrap.classList.add('pan-ready'); }
    return;
  }
  if (typing) return;
  flushTx();
  if (e.key === 'Escape') {
    if (drag) cancelDrag();
    else if (S.sel.size) { S.sel = new Set(); renderAll(); }
    return;
  }
  if (drag) return;
  const mod = e.ctrlKey || e.metaKey, k = e.key;
  if (mod && (k === 'z' || k === 'Z')) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
  if (mod && (k === 'y' || k === 'Y')) { e.preventDefault(); redo(); return; }
  if (mod && (k === 'a' || k === 'A')) {
    e.preventDefault();
    S.sel = new Set(S.shapes.map(s => s.id));
    renderAll();
    return;
  }
  if (mod && (k === 'd' || k === 'D')) { e.preventDefault(); duplicateSel(); return; }
  if (mod && k === '0') { e.preventDefault(); setZoom(1); return; }
  if (mod && (k === '=' || k === '+')) { e.preventDefault(); setZoom(S.zoom * 1.25); return; }
  if (mod && k === '-') { e.preventDefault(); setZoom(S.zoom / 1.25); return; }
  if (mod && k === '1') { e.preventDefault(); zoomFit(); return; }
  if (mod) return;
  if (k === 'v' || k === 'V') return setTool('select');
  if (k === 'r' || k === 'R') return setTool('rect');
  if (k === 'e' || k === 'E') return setTool('ellipse');
  if (k === 'l' || k === 'L') return setTool('line');
  if ((k === 'Delete' || k === 'Backspace') && S.sel.size) { e.preventDefault(); deleteSel(); return; }
  if (k === ']' && S.sel.size) { e.preventDefault(); zOrder(1); return; }
  if (k === '[' && S.sel.size) { e.preventDefault(); zOrder(-1); return; }
  if (k.indexOf('Arrow') === 0 && S.sel.size) {
    e.preventDefault();
    const st = e.shiftKey ? 10 : 1;
    let dx = 0, dy = 0;
    if (k === 'ArrowLeft') dx = -st; else if (k === 'ArrowRight') dx = st;
    else if (k === 'ArrowUp') dy = -st; else if (k === 'ArrowDown') dy = st;
    if (dx || dy) nudge(dx, dy);
    return;
  }
});
document.addEventListener('keyup', e => {
  if (e.code === 'Space') { spaceDown = false; stageWrap.classList.remove('pan-ready'); }
});
window.addEventListener('blur', () => {
  spaceDown = false;
  stageWrap.classList.remove('pan-ready');
  if (drag) cancelDrag();
});

/* ── toolbar wiring ────────────────────────────────── */
$('undo').addEventListener('click', undo);
$('redo').addEventListener('click', redo);
$('zoom-in').addEventListener('click', () => setZoom(S.zoom * 1.25));
$('zoom-out').addEventListener('click', () => setZoom(S.zoom / 1.25));
zoomLabel.addEventListener('click', () => setZoom(1));
$('btn-fwd').addEventListener('click', () => zOrder(1));
$('btn-bwd').addEventListener('click', () => zOrder(-1));
$('btn-dup').addEventListener('click', duplicateSel);
$('btn-del').addEventListener('click', deleteSel);
$('doc-name').addEventListener('input', e => { S.name = e.target.value; saveSoon(); });

/* ── export ────────────────────────────────────────── */
function shapeSvg(s) {
  const common = ' fill="' + s.fill + '" stroke="' + s.stroke + '" stroke-width="' + s.sw + '"';
  if (s.type === 'line')
    return '  <line x1="' + r2(s.x1) + '" y1="' + r2(s.y1) + '" x2="' + r2(s.x2) + '" y2="' + r2(s.y2) + '" stroke-linecap="round"' + common + '/>';
  if (s.type === 'ellipse')
    return '  <ellipse cx="' + r2(s.x + s.w / 2) + '" cy="' + r2(s.y + s.h / 2) + '" rx="' + r2(s.w / 2) + '" ry="' + r2(s.h / 2) + '"' + common + '/>';
  return '  <rect x="' + r2(s.x) + '" y="' + r2(s.y) + '" width="' + r2(s.w) + '" height="' + r2(s.h) + '"' + common + '/>';
}
$('export-svg').addEventListener('click', () => {
  let b = S.shapes.length ? unionBox(S.shapes) : null;
  if (!b) b = { x: 0, y: 0, w: 800, h: 600 };
  else if (b.w < 1 && b.h < 1) b = { x: b.x - 40, y: b.y - 40, w: 80, h: 80 };
  else { const p = 12; b = { x: b.x - p, y: b.y - p, w: b.w + p * 2, h: b.h + p * 2 }; }
  let out = '<svg xmlns="http://www.w3.org/2000/svg" width="' + r2(b.w) + '" height="' + r2(b.h) +
    '" viewBox="' + r2(b.x) + ' ' + r2(b.y) + ' ' + r2(b.w) + ' ' + r2(b.h) + '">\n' +
    S.shapes.map(shapeSvg).join('\n') + '\n</svg>';
  const blob = new Blob([out], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'drawing.svg';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
});

/* ── persistence ───────────────────────────────────── */
const LS_KEY = 'vectorly.doc.v1';
let saveTimer = null;
function saveSoon() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => { saveTimer = null; saveNow(); }, 350);
}
function saveNow() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      v: 1, name: S.name, idc: S.idc, shapes: S.shapes, sel: [...S.sel],
      style: { fill: S.style.fill, stroke: S.style.stroke, sw: S.style.sw },
      view: { z: S.zoom, x: S.panX, y: S.panY }
    }));
    savedEl.classList.remove('on');
    void savedEl.offsetWidth;
    savedEl.classList.add('on');
  } catch (_) {}
}
window.addEventListener('beforeunload', saveNow);
function idNum(id) { const m = /(\d+)$/.exec(String(id)); return m ? +m[1] : 0; }
function isShape(s) {
  if (!s || typeof s !== 'object') return false;
  if (s.type === 'line') return [s.x1, s.y1, s.x2, s.y2].every(Number.isFinite);
  if (s.type === 'rect' || s.type === 'ellipse') return [s.x, s.y, s.w, s.h].every(Number.isFinite);
  return false;
}
function normShape(s) {
  const n = {
    id: String(s.id), type: s.type,
    fill: typeof s.fill === 'string' ? s.fill : '#000000',
    stroke: typeof s.stroke === 'string' ? s.stroke : '#000000',
    sw: Number.isFinite(s.sw) ? Math.max(0, s.sw) : 2
  };
  if (s.type === 'line') { n.x1 = +s.x1; n.y1 = +s.y1; n.x2 = +s.x2; n.y2 = +s.y2; }
  else { n.x = +s.x; n.y = +s.y; n.w = Math.max(0, +s.w); n.h = Math.max(0, +s.h); }
  return n;
}
function loadDoc() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (!d || !Array.isArray(d.shapes)) return;
    S.shapes = d.shapes.filter(isShape).map(normShape);
    S.sel = new Set(Array.isArray(d.sel) ? d.sel.filter(id => S.shapes.some(s => s.id === id)) : []);
    if (d.style && typeof d.style === 'object') {
      S.style.fill = normColor(d.style.fill);
      S.style.stroke = normColor(d.style.stroke);
      S.style.sw = Number.isFinite(d.style.sw) ? clamp(d.style.sw, 0, 500) : 2;
    }
    if (d.view && typeof d.view === 'object') {
      S.zoom = clamp(Number(d.view.z) || 1, 0.1, 8);
      S.panX = Number(d.view.x) || 0;
      S.panY = Number(d.view.y) || 0;
    }
    S.idc = Math.max(Number(d.idc) || 1, S.shapes.reduce((m, s) => Math.max(m, idNum(s.id)), 0) + 1);
    if (typeof d.name === 'string' && d.name.length) S.name = d.name.slice(0, 60);
  } catch (_) {}
}

/* ── init ──────────────────────────────────────────── */
loadDoc();
$('doc-name').value = S.name;
setTool('select');
applyView();
renderAll();
refreshHist();
})();
</script>
</body>
</html>
```