```html
<!doctype html>
<html lang="en" data-theme="light" style="--accent:#5b5bd6">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Commander — Command Palette</title>
<style>
  :root {
    --accent: #5b5bd6;
    --bg: #f2f4f7;
    --app: #f7f8fa;
    --sidebar: #ffffff;
    --surface: #ffffff;
    --surface-2: #f1f3f6;
    --surface-3: #e8ecf1;
    --text: #121519;
    --muted: #68727c;
    --faint: #8c96a1;
    --border: rgba(15, 20, 25, 0.10);
    --border-strong: rgba(15, 20, 25, 0.18);
    --overlay: rgba(17, 21, 26, 0.28);
    --shadow-sm: 0 1px 2px rgba(0,0,0,.05);
    --shadow-md: 0 10px 28px rgba(0,0,0,.11);
    --shadow-lg: 0 32px 90px rgba(0,0,0,.23), 0 2px 10px rgba(0,0,0,.12);

    --accent-soft: color-mix(in srgb, var(--accent) 14%, var(--surface));
    --accent-soft-strong: color-mix(in srgb, var(--accent) 22%, var(--surface));
    --accent-border: color-mix(in srgb, var(--accent) 34%, transparent);
    --accent-text: color-mix(in srgb, var(--accent) 68%, var(--text));
    --mark-bg: color-mix(in srgb, var(--accent) 24%, var(--surface));
    --mark-text: color-mix(in srgb, var(--accent) 72%, var(--text));
  }

  [data-theme="dark"] {
    --bg: #07090c;
    --app: #0b0e12;
    --sidebar: #101419;
    --surface: #141920;
    --surface-2: #1c232b;
    --surface-3: #252d36;
    --text: #e8edf3;
    --muted: #97a3af;
    --faint: #6c7885;
    --border: rgba(255,255,255,.10);
    --border-strong: rgba(255,255,255,.18);
    --overlay: rgba(2,5,9,.58);
    --shadow-md: 0 12px 32px rgba(0,0,0,.34);
    --shadow-lg: 0 34px 100px rgba(0,0,0,.52), 0 2px 10px rgba(0,0,0,.32);

    --accent-soft: color-mix(in srgb, var(--accent) 22%, var(--surface));
    --accent-soft-strong: color-mix(in srgb, var(--accent) 30%, var(--surface));
    --accent-border: color-mix(in srgb, var(--accent) 42%, transparent);
    --accent-text: color-mix(in srgb, var(--accent) 78%, var(--text));
    --mark-bg: color-mix(in srgb, var(--accent) 38%, var(--surface));
    --mark-text: color-mix(in srgb, var(--accent) 85%, var(--text));
  }

  html[data-theme="light"] { color-scheme: light; }
  html[data-theme="dark"] { color-scheme: dark; }

  * { box-sizing: border-box; }
  [hidden] { display: none !important; }

  body {
    margin: 0;
    height: 100vh;
    overflow: hidden;
    background: var(--bg);
    color: var(--text);
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 14px;
    line-height: 1.45;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    transition: background-color .28s ease, color .28s ease;
  }

  button, input, textarea { font: inherit; color: inherit; }
  button { border: 0; background: transparent; cursor: pointer; }
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  .app {
    display: flex;
    height: 100vh;
    min-height: 0;
    background: var(--app);
    transition: background-color .28s ease;
  }

  .sidebar {
    width: 286px;
    flex: 0 0 286px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 14px;
    border-right: 1px solid var(--border);
    background: var(--sidebar);
    transition: background-color .28s ease, border-color .28s ease, opacity .24s ease, width .24s ease, min-width .24s ease, padding .24s ease, border-right-width .24s ease;
    overflow: hidden;
  }

  .app.no-sidebar .sidebar,
  .app.focus-mode .sidebar {
    width: 0;
    min-width: 0;
    padding-left: 0;
    padding-right: 0;
    border-right-width: 0;
    opacity: 0;
    pointer-events: none;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 2px 2px 6px;
    color: var(--text);
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .brand .logo {
    width: 30px;
    height: 30px;
    border-radius: 9px;
    display: grid;
    place-items: center;
    background: var(--accent);
    color: white;
    font-weight: 800;
    box-shadow: var(--shadow-sm);
  }

  .brand .brand-copy {
    min-width: 0;
  }

  .brand .brand-copy strong { display:block; }
  .brand .brand-copy small { color: var(--muted); font-weight: 500; }

  .side-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font-weight: 600;
    box-shadow: var(--shadow-sm);
    transition: border-color .16s ease, background-color .16s ease, transform .16s ease, box-shadow .16s ease;
  }

  .side-btn:hover { border-color: var(--border-strong); background: var(--surface-2); }
  .side-btn:active { transform: translateY(1px); }

  .views {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .view {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    border-radius: 9px;
    color: var(--muted);
    font-weight: 560;
    text-align: left;
    transition: background-color .16s ease, color .16s ease;
  }

  .view svg { width: 16px; height: 16px; }
  .view:hover { background: var(--surface-2); color: var(--text); }
  .view.active {
    background: var(--accent-soft);
    color: var(--accent-text);
    box-shadow: inset 0 0 0 1px var(--accent-border);
  }

  .notes-label {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    padding: 0 10px;
    margin-top: 2px;
    font-size: 11px;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--faint);
    font-weight: 700;
  }

  .note-list {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-right: 2px;
  }

  .note {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    width: 100%;
    text-align: left;
    padding: 9px 10px;
    border-radius: 10px;
    color: var(--muted);
    border: 1px solid transparent;
    transition: background-color .14s ease, color .14s ease, border-color .14s ease;
  }

  .note:hover { background: var(--surface-2); color: var(--text); }

  .note.is-current {
    background: var(--surface-2);
    color: var(--text);
    border-color: var(--border);
    box-shadow: var(--shadow-sm);
  }

  .note .note-dot {
    width: 7px;
    height: 7px;
    margin-top: 7px;
    border-radius: 999px;
    background: var(--surface-3);
    border: 1px solid var(--border);
  }

  .note.is-current .note-dot { background: var(--accent); border-color: var(--accent); }

  .note .note-copy { min-width: 0; }
  .note .note-title {
    display: block;
    font-weight: 620;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .note .note-preview {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .main {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: var(--app);
  }

  .topbar {
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 16px;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface) 70%, transparent);
    backdrop-filter: blur(10px);
    transition: background-color .28s ease, border-color .28s ease, opacity .24s ease;
  }

  .app.focus-mode .topbar { opacity: .72; }

  .breadcrumb {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--muted);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .breadcrumb svg { width: 15px; height: 15px; }

  #open-palette {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 34px;
    padding: 0 10px 0 11px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
    color: var(--muted);
    font-weight: 600;
    box-shadow: var(--shadow-sm);
    transition: border-color .16s ease, background-color .16s ease, color .16s ease, transform .16s ease;
  }

  #open-palette:hover { color: var(--text); border-color: var(--border-strong); background: var(--surface-2); }
  #open-palette:active { transform: translateY(1px); }
  #open-palette svg { width: 15px; height: 15px; }
  #open-palette .open-label { padding-right: 2px; }

  .editor-shell {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    justify-content: center;
    overflow: hidden;
    padding: 24px 28px;
    transition: padding .24s ease, max-width .24s ease;
  }

  .app.focus-mode .editor-shell { padding: 28px; }

  .editor-card {
    flex: 1 1 auto;
    max-width: 880px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 10px;
    border-radius: 16px;
    background: color-mix(in srgb, var(--surface) 50%, transparent);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-md);
  }

  .app.focus-mode .editor-card { background: var(--surface); }

  #note-title {
    border: 0;
    background: transparent;
    outline: none;
    padding: 10px 12px 0;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--text);
    width: 100%;
  }

  #note-title::placeholder { color: var(--faint); }

  #editor {
    flex: 1 1 auto;
    min-height: 0;
    resize: none;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--surface);
    color: var(--text);
    padding: 18px 20px;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: calc(15.5px * var(--zoom, 1));
    line-height: 1.72;
    box-shadow: inset 0 1px 2px rgba(0,0,0,.03);
    outline: none;
    transition: border-color .16s ease, box-shadow .16s ease, background-color .28s ease, color .28s ease;
  }

  #editor:focus { border-color: var(--accent-border); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent); }
  #editor.nowrap { white-space: pre; overflow-x: auto; }

  .kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 20px;
    padding: 0 5px;
    border: 1px solid var(--border);
    border-bottom-width: 2px;
    border-radius: 5px;
    background: var(--surface);
    color: var(--muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
    font-size: 10.5px;
    font-weight: 650;
    line-height: 1;
    box-shadow: 0 1px 0 rgba(0,0,0,.02);
    transition: border-color .28s ease, background-color .28s ease, color .28s ease;
  }

  [data-theme="dark"] .kbd { background: var(--surface-2); border-bottom-color: rgba(0,0,0,.35); }
  .kbd + .kbd { margin-left: 3px; }

  .palette {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 12vh 16px 16px;
  }

  .palette-backdrop {
    position: fixed;
    inset: 0;
    background: var(--overlay);
    backdrop-filter: blur(4px);
    z-index: -1;
  }

  .palette-panel {
    position: relative;
    width: min(620px, 100%);
    max-height: calc(100vh - 88px);
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--border-strong) 70%, transparent);
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    transform-origin: center top;
  }

  .palette.open .palette-panel { animation: panelIn 190ms cubic-bezier(.2,.8,.2,1) both; }
  .palette.open .palette-backdrop { animation: fadeIn 150ms ease both; }
  .palette.closing .palette-panel { animation: panelOut 150ms ease both; }
  .palette.closing .palette-backdrop { animation: fadeOut 150ms ease both; }

  .palette-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 14px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  .crumb {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    max-width: 240px;
    height: 26px;
    padding: 0 9px 0 7px;
    border-radius: 999px;
    background: var(--accent-soft-strong);
    border: 1px solid var(--accent-border);
    color: var(--accent-text);
    font-weight: 680;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .crumb-arrow { font-size: 13px; transform: translateY(.5px); }

  .search-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1 1 auto;
    min-width: 0;
  }

  .search-icon { color: var(--faint); display: grid; place-items: center; }
  .search-icon svg { width: 17px; height: 17px; }

  #palette-search {
    flex: 1 1 auto;
    min-width: 0;
    border: 0;
    background: transparent;
    outline: none;
    padding: 3px 0;
    font-size: 16px;
    font-weight: 520;
    color: var(--text);
    caret-color: var(--accent);
  }

  #palette-search::placeholder { color: var(--faint); font-weight: 500; }

  .palette-body {
    padding: 7px;
    min-height: 0;
    overflow: hidden;
  }

  .palette-list {
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    max-height: 45vh;
    height: 0;
    transition: height 180ms cubic-bezier(.2,.8,.2,1);
    scrollbar-width: thin;
  }

  .results-inner { position: relative; }

  .active-highlight {
    position: absolute;
    left: 4px;
    right: 4px;
    top: 0;
    height: 0;
    border-radius: 9px;
    background: var(--accent-soft);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 32%, transparent);
    opacity: 0;
    pointer-events: none;
    z-index: 0;
    transition:
      transform 125ms cubic-bezier(.2,.8,.2,1),
      height 125ms cubic-bezier(.2,.8,.2,1),
      opacity 120ms ease;
  }

  .options {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding-bottom: 5px;
  }

  .group-heading {
    padding: 10px 10px 5px;
    color: var(--faint);
    font-size: 10.5px;
    font-weight: 780;
    letter-spacing: .10em;
    text-transform: uppercase;
  }

  .option {
    display: flex;
    align-items: center;
    gap: 11px;
    min-height: 39px;
    padding: 7px 10px;
    border-radius: 9px;
    cursor: pointer;
    color: var(--text);
    user-select: none;
    -webkit-user-select: none;
  }

  .option-icon {
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    color: var(--faint);
    flex: 0 0 auto;
  }

  .option[aria-selected="true"] .option-icon { color: var(--accent-text); }

  .swatch {
    width: 16px;
    height: 16px;
    border-radius: 999px;
    border: 1px solid rgba(0,0,0,.18);
    box-shadow: 0 1px 3px rgba(0,0,0,.18);
  }

  [data-theme="dark"] .swatch { border-color: rgba(255,255,255,.25); }

  .option-main {
    min-width: 0;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .option-title {
    display: block;
    font-weight: 560;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .option[aria-selected="true"] .option-title { font-weight: 680; }

  .option-sub {
    display: block;
    color: var(--muted);
    font-size: 11.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .option-keys {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-left: auto;
    padding-left: 12px;
    color: var(--muted);
    flex: 0 0 auto;
  }

  mark {
    background: var(--mark-bg);
    color: var(--mark-text);
    border-radius: 3px;
    padding: 0 1px;
  }

  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 108px;
    padding: 28px 18px;
    color: var(--muted);
    font-weight: 560;
    text-align: center;
  }

  .palette-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 8px 13px 9px;
    border-top: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface-2) 55%, var(--surface));
    color: var(--muted);
    font-size: 12px;
    font-weight: 560;
  }

  .footer-group {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
  }

  .footer-group .kbd { height: 18px; min-width: 17px; font-size: 10px; }
  .footer-right { margin-left: auto; }

  .toasts {
    position: fixed;
    top: 18px;
    right: 18px;
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: min(340px, calc(100vw - 36px));
    pointer-events: none;
  }

  .toast {
    pointer-events: auto;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 10px;
    align-items: center;
    padding: 12px 13px;
    border-radius: 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-md);
    animation: toastIn 240ms cubic-bezier(.2,.8,.2,1) both;
  }

  .toast::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 16%, transparent);
  }

  .toast-body { min-width: 0; }
  .toast-title { display: block; font-weight: 690; color: var(--text); }
  .toast-sub { display: block; margin-top: 1px; color: var(--muted); font-size: 12px; }
  .toast.exiting { animation: toastOut 210ms cubic-bezier(.4,0,.6,1) both; }

  @keyframes panelIn {
    from { opacity: 0; transform: scale(.965) translateY(-9px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  @keyframes panelOut {
    from { opacity: 1; transform: scale(1) translateY(0); }
    to { opacity: 0; transform: scale(.985) translateY(-4px); }
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
  @keyframes fadeOnly { from { opacity: 0; } to { opacity: 1; } }

  @keyframes toastIn {
    from { opacity: 0; transform: translate3d(16px, -6px, 0) scale(.97); }
    to { opacity: 1; transform: translate3d(0,0,0) scale(1); }
  }

  @keyframes toastOut {
    from { opacity: 1; transform: translate3d(0,0,0) scale(1); }
    to { opacity: 0; transform: translate3d(12px, -4px, 0) scale(.97); }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
    .palette.open .palette-panel,
    .palette.closing .palette-panel,
    .palette.open .palette-backdrop,
    .palette.closing .palette-backdrop,
    .toast,
    .toast.exiting {
      animation-name: fadeOnly !important;
    }
    .active-highlight,
    .palette-list,
    .sidebar,
    .editor-shell,
    .editor-card,
    .topbar,
    body { transition: none !important; }
  }

  @media (max-width: 920px) {
    .sidebar { width: 248px; flex-basis: 248px; }
    .editor-shell { padding: 18px; }
  }

  @media (max-width: 680px) {
    .sidebar { position: fixed; inset: 0 auto 0 0; z-index: 60; box-shadow: var(--shadow-lg); }
    .app.no-sidebar .sidebar, .app.focus-mode .sidebar { display: none; }
    .topbar { padding: 0 10px; }
    #open-palette .open-label { display: none; }
    .palette { padding: 8vh 10px 10px; }
    .palette-panel { max-height: calc(100vh - 42px); }
    .palette-footer { font-size: 11px; }
    .footer-left { display: none; }
  }
</style>
</head>
<body>
  <div class="app" id="app">
    <aside class="sidebar" aria-label="Notes sidebar">
      <div class="brand">
        <div class="logo" aria-hidden="true">C</div>
        <div class="brand-copy">
          <strong>Commander</strong>
          <small>Notes workspace</small>
        </div>
      </div>

      <button class="side-btn" type="button" id="sidebar-new-note" title="New Note">
        <span aria-hidden="true">+</span> New Note
      </button>

      <nav class="views" aria-label="Views">
        <button class="view active" type="button" data-view="Inbox">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 13h6l1 3h7"/><path d="M3 7h18v12H4"/><path d="M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2"/></svg>
          Inbox
        </button>
        <button class="view" type="button" data-view="Today">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 2v6"/><path d="M3 10h18"/><path d="M5 10v10h14V10"/><path d="M17 2v6"/></svg>
          Today
        </button>
        <button class="view" type="button" data-view="Archive">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="5"/><path d="M5 9v11h14V9"/><path d="M9 13h6"/></svg>
          Archive
        </button>
        <button class="view" type="button" data-view="Settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 4h4l.5 3 3-1.2 2 2-1.2 3 3 .5v4l-3 .5 1.2 3-2 2-3-1.2-.5 3h-4l-.5-3-3 1.2-2-2 1.2-3-3-.5v-4l3-.5-1.2-3 2-2 3 1.2z"/><circle cx="12" cy="12" r="2.5"/></svg>
          Settings
        </button>
      </nav>

      <div class="notes-label">
        <span>Notes</span>
        <span id="note-count">0</span>
      </div>
      <div class="note-list" id="notes" aria-label="Note list"></div>
    </aside>

    <main class="main">
      <header class="topbar">
        <div class="breadcrumb" aria-live="polite">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l8-8h3l-2 4 9 4-9 4 2 4h-3l-8-8z"/></svg>
          <span id="current-view">Inbox</span>
        </div>
        <button id="open-palette" type="button" aria-label="Open command palette">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>
          <span class="open-label">Search or command</span>
          <span class="hint" id="palette-hint"></span>
        </button>
      </header>

      <section class="editor-shell">
        <div class="editor-card">
          <input id="note-title" autocomplete="off" spellcheck="false" placeholder="Untitled note">
          <textarea id="editor" autocomplete="off" spellcheck="false" placeholder="Start writing…"></textarea>
        </div>
      </section>
    </main>
  </div>

  <div id="palette" class="palette" role="dialog" aria-modal="true" aria-label="Command palette" hidden>
    <div class="palette-backdrop" aria-hidden="true"></div>
    <div class="palette-panel">
      <div class="palette-header">
        <div id="palette-crumb" class="crumb" hidden>
          <span class="crumb-arrow" aria-hidden="true">←</span>
          <span id="palette-crumb-label">Change Accent Color…</span>
        </div>
        <div class="search-wrap">
          <span class="search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>
          </span>
          <input
            id="palette-search"
            role="combobox"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-controls="palette-list"
            aria-expanded="false"
            aria-activedescendant=""
            autocomplete="off"
            spellcheck="false"
            placeholder="Type a command or search…"
          >
        </div>
      </div>

      <div class="palette-body">
        <div id="palette-list" class="palette-list" role="listbox" aria-label="Commands">
          <div class="results-inner">
            <div id="active-highlight" class="active-highlight" aria-hidden="true"></div>
            <div id="options" class="options"></div>
          </div>
        </div>
        <div id="palette-empty" class="empty" hidden>No matching commands</div>
      </div>

      <div class="palette-footer">
        <div class="footer-left">
          <span class="footer-group"><span class="kbd">↑</span><span class="kbd">↓</span> navigate</span>
          <span class="footer-group"><span class="kbd">Enter</span> execute</span>
        </div>
        <div class="footer-group footer-right"><span class="kbd">Esc</span> close</div>
      </div>
    </div>
  </div>

  <div id="toasts" class="toasts" role="status" aria-live="polite"></div>

<script>
  "use strict";

  const COMMANDS = [
    { id: "go-inbox",          title: "Go to Inbox",             group: "Navigation", keywords: ["home"] },
    { id: "go-today",          title: "Go to Today",             group: "Navigation" },
    { id: "go-archive",        title: "Go to Archive",           group: "Navigation" },
    { id: "go-settings",       title: "Go to Settings",          group: "Navigation", keywords: ["preferences", "options"], shortcut: "Mod+," },
    { id: "go-line",           title: "Go to Line…",             group: "Navigation", keywords: ["jump"], shortcut: "Mod+G" },
    { id: "go-symbol",         title: "Go to Symbol…",           group: "Navigation", shortcut: "Mod+Shift+O" },
    { id: "search-notes",      title: "Search Notes…",           group: "Navigation", keywords: ["find"], shortcut: "Mod+Shift+F" },
    { id: "new-note",          title: "New Note",                group: "Notes", keywords: ["create", "add"], shortcut: "Mod+N" },
    { id: "new-note-template", title: "New Note from Template…", group: "Notes" },
    { id: "duplicate-note",    title: "Duplicate Note",          group: "Notes", keywords: ["copy", "clone"] },
    { id: "rename-note",       title: "Rename Note…",            group: "Notes", shortcut: "F2" },
    { id: "delete-note",       title: "Delete Note",             group: "Notes", keywords: ["remove", "trash"] },
    { id: "pin-note",          title: "Pin Note",                group: "Notes", keywords: ["favorite", "star"] },
    { id: "move-note",         title: "Move Note to Folder…",    group: "Notes" },
    { id: "export-pdf",        title: "Export Note as PDF",      group: "Notes" },
    { id: "export-md",         title: "Export Note as Markdown", group: "Notes" },
    { id: "share-note",        title: "Share Note Link",         group: "Notes", keywords: ["copy", "url"] },
    { id: "bold",              title: "Bold",                    group: "Editor", shortcut: "Mod+B" },
    { id: "italic",            title: "Italic",                  group: "Editor", shortcut: "Mod+I" },
    { id: "insert-link",       title: "Insert Link…",            group: "Editor", keywords: ["url"] },
    { id: "insert-table",      title: "Insert Table",            group: "Editor" },
    { id: "insert-code",       title: "Insert Code Block",       group: "Editor", keywords: ["snippet"] },
    { id: "insert-checklist",  title: "Insert Checklist",        group: "Editor", keywords: ["todo", "task"] },
    { id: "word-wrap",         title: "Toggle Word Wrap",        group: "Editor", shortcut: "Alt+Z" },
    { id: "format-doc",        title: "Format Document",         group: "Editor", keywords: ["prettify", "beautify"], shortcut: "Shift+Alt+F" },
    { id: "sort-asc",          title: "Sort Lines Ascending",    group: "Editor" },
    { id: "sort-desc",         title: "Sort Lines Descending",   group: "Editor" },
    { id: "toggle-dark-mode",  title: "Toggle Dark Mode",        group: "View", keywords: ["theme", "night", "appearance"], shortcut: "Mod+Shift+L" },
    { id: "change-accent",     title: "Change Accent Color…",    group: "View", keywords: ["theme", "color"], page: "accent" },
    { id: "toggle-sidebar",    title: "Toggle Sidebar",          group: "View", shortcut: "Mod+\\" },
    { id: "toggle-focus-mode", title: "Toggle Focus Mode",       group: "View", keywords: ["zen", "distraction free"] },
    { id: "zoom-in",           title: "Zoom In",                 group: "View", shortcut: "Mod+=" },
    { id: "zoom-out",          title: "Zoom Out",                group: "View", shortcut: "Mod+-" },
    { id: "zoom-reset",        title: "Reset Zoom",              group: "View", shortcut: "Mod+0" },
    { id: "shortcuts",         title: "Keyboard Shortcuts",      group: "Help", keywords: ["keys", "hotkeys"], shortcut: "Mod+/" },
    { id: "release-notes",     title: "Release Notes",           group: "Help", keywords: ["changelog", "what's new"] },
    { id: "feedback",          title: "Send Feedback",           group: "Help" },
    { id: "about",             title: "About Commander",         group: "Help" }
  ];

  const ACCENTS = [
    { id: "accent-indigo",  title: "Indigo",  value: "#5b5bd6" },
    { id: "accent-emerald", title: "Emerald", value: "#10b981" },
    { id: "accent-rose",    title: "Rose",    value: "#e11d48" },
    { id: "accent-amber",   title: "Amber",   value: "#f59e0b" },
    { id: "accent-sky",     title: "Sky",     value: "#0ea5e9" }
  ];

  const GROUP_ORDER = Array.from(new Set(COMMANDS.map(c => c.group)));
  const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || "");

  const LS_THEME = "commander:theme";
  const LS_ACCENT = "commander:accent";
  const LS_RECENTS = "commander:recents";

  const palette = document.getElementById("palette");
  const palettePanel = palette.querySelector(".palette-panel");
  const searchInput = document.getElementById("palette-search");
  const paletteCrumb = document.getElementById("palette-crumb");
  const paletteCrumbLabel = document.getElementById("palette-crumb-label");
  const paletteList = document.getElementById("palette-list");
  const optionsEl = document.getElementById("options");
  const emptyEl = document.getElementById("palette-empty");
  const highlightEl = document.getElementById("active-highlight");
  const toastRegion = document.getElementById("toasts");

  const appEl = document.getElementById("app");
  const openPaletteButton = document.getElementById("open-palette");
  const paletteHint = document.getElementById("palette-hint");
  const notesEl = document.getElementById("notes");
  const noteCount = document.getElementById("note-count");
  const noteTitle = document.getElementById("note-title");
  const editor = document.getElementById("editor");
  const currentView = document.getElementById("current-view");
  const viewButtons = Array.from(document.querySelectorAll(".view"));
  const sidebarNewNote = document.getElementById("sidebar-new-note");

  const SVG_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true"';
  const GROUP_ICONS = {
    Navigation: `<svg ${SVG_ATTRS}><path d="M4 12h15"/><path d="M13 5l7 7-7 7"/></svg>`,
    Notes: `<svg ${SVG_ATTRS}><path d="M8 3h8l3 3v15H8z"/><path d="M12 9h5"/><path d="M12 13h5"/><path d="M12 17h3"/></svg>`,
    Editor: `<svg ${SVG_ATTRS}><path d="M13.5 6.5l4 4L8 20H4v-4z"/><path d="M11.5 8.5l4 4"/></svg>`,
    View: `<svg ${SVG_ATTRS}><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/></svg>`,
    Help: `<svg ${SVG_ATTRS}><circle cx="12" cy="12" r="9"/><path d="M9.3 9.5a2.8 2.8 0 015.4 1c0 1.8-2.2 2-2.7 3.2"/><path d="M12 17h.01"/></svg>`
  };

  let paletteOpen = false;
  let paletteClosing = false;
  let closeTimer = null;
  let lastFocused = null;
  let activeIndex = -1;
  let optionSeq = 0;
  let optionsData = [];
  const state = { page: "root", query: "" };

  let reducedMotion = false;
  try {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion = mq.matches;
    if (mq.addEventListener) mq.addEventListener("change", e => { reducedMotion = e.matches; });
  } catch (_) {
    reducedMotion = false;
  }

  let notes = [
    {
      id: "welcome",
      title: "Welcome to Commander",
      body: "This is a small notes-app shell with a ⌘K command palette.\n\nTry opening the palette with Ctrl/Cmd + K and search for:\n\n- tdm  → Toggle Dark Mode\n- new  → New Note\n- accent → Change Accent Color…\n\nThe palette supports fuzzy matching, keyboard navigation, grouped commands, recent items, toasts, sub-pages, motion and light/dark themes.",
      pinned: true
    },
    {
      id: "release-2-4",
      title: "Release notes 2.4",
      body: "## Highlights\n\n- Refined command ranking for word starts\n- Recent commands now persist across sessions\n- Smooth active-item indicator\n- Better dark theme contrast\n- Sub-pages like Change Accent Color…",
      pinned: false
    },
    {
      id: "team-sync",
      title: "Team sync notes",
      body: "- Ship the palette polish pass\n- Verify keyboard focus trapping\n- Test reduced-motion fallback\n- Review accent contrast\n- Maybe add custom icons",
      pinned: false
    },
    {
      id: "ideas",
      title: "Product ideas",
      body: "1. Global command search\n2. Saved searches\n3. Templates\n4. Sidebar filters\n5. Quick open with Ctrl P\n\nUseful but probably not needed.",
      pinned: false
    },
    {
      id: "bug-sidebar",
      title: "Bug: sidebar collapse",
      body: "On narrow windows the sidebar can squeeze the editor too much.\n\nPossible fix:\n- Use overlay sidebar on small breakpoints\n- Keep command results scrollable",
      pinned: false
    }
  ];

  let currentNoteId = notes[0].id;
  let zoomLevel = 1;
  let wordWrapEnabled = true;

  function readLS(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function writeLS(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function getRecents() {
    const raw = readLS(LS_RECENTS);
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.filter(id => COMMANDS.some(c => c.id === id));
    } catch (_) {
      return [];
    }
  }

  function recordRecent(id) {
    if (!COMMANDS.some(c => c.id === id)) return;
    const next = [id, ...getRecents().filter(x => x !== id)].slice(0, 20);
    writeLS(LS_RECENTS, JSON.stringify(next));
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  function highlightText(text, positions) {
    if (!positions || !positions.length) return esc(text);
    const set = new Set(positions);
    let html = "";
    for (let i = 0; i < text.length; i++) {
      if (set.has(i)) {
        let j = i;
        while (j + 1 < text.length && set.has(j + 1)) j++;
        html += `<mark>${esc(text.slice(i, j + 1))}</mark>`;
        i = j;
      } else {
        html += esc(text[i]);
      }
    }
    return html;
  }

  function kbdText(token) {
    if (token === "Mod") return isMac ? "⌘" : "Ctrl";
    if (token === "Shift") return isMac ? "⇧" : "Shift";
    if (token === "Alt") return isMac ? "⌥" : "Alt";
    if (token === "Ctrl") return isMac ? "⌃" : "Ctrl";
    if (token.length > 1) return token;
    return token.toUpperCase();
  }

  function formatShortcutHTML(shortcut) {
    if (!shortcut) return "";
    return shortcut
      .split("+")
      .map(part => `<kbd class="kbd">${esc(kbdText(part))}</kbd>`)
      .join("");
  }

  function isWordStart(index, lower) {
    if (index === 0) return true;
    return !/[a-z0-9]/.test(lower[index - 1]);
  }

  function firstScore(j, lower) {
    let score = 10;
    if (j === 0) score += 72;
    else if (isWordStart(j, lower)) score += 46;
    else score += 8;
    return score;
  }

  function stepScore(prev, j, lower) {
    let score = 10;
    if (j === prev + 1) {
      score += 58;
    } else {
      const gap = j - prev - 1;
      score += Math.max(14 - gap * 2, 1);
      if (isWordStart(j, lower)) score += 32;
    }
    return score;
  }

  function bonusScore(lower, q) {
    let score = 0;
    if (lower === q) {
      score += 3500;
    } else {
      if (lower.replace(/[…]+$/, "").trim() === q) score += 2750;
      if (lower.startsWith(q)) score += 1500;
      else if (lower.includes(q)) score += 700;
    }
    score += Math.max(0, 40 - lower.length) * 7;
    return score;
  }

  function scoreTextMatch(text, q) {
    if (!q) return null;
    const lower = String(text).toLowerCase();
    query = String(q).toLowerCase();
    const n = lower.length;
    const m = query.length;
    if (m === 0 || m > n) return null;

    let qi = 0;
    for (let i = 0; i < n && qi < m; i++) {
      if (lower[i] === query[qi]) qi++;
    }
    if (qi < m) return null;

    const dp = [];
    const parents = [];

    for (let i = 0; i < m; i++) {
      const cur = new Array(n).fill(-Infinity);
      const par = new Array(n).fill(-1);

      for (let j = i; j <= n - (m - i); j++) {
        if (lower[j] !== query[i]) continue;

        let best = -Infinity;
        let bestPrev = -1;

        if (i === 0) {
          best = firstScore(j, lower);
        } else {
          const prevDp = dp[i - 1];
          for (let k = i - 1; k < j; k++) {
            const prevScore = prevDp[k];
            if (prevScore === -Infinity) continue;
            const candidate = prevScore + stepScore(k, j, lower);
            if (candidate > best) {
              best = candidate;
              bestPrev = k;
            }
          }
        }

        cur[j] = best;
        par[j] = bestPrev;
      }

      dp.push(cur);
      parents.push(par);
    }

    let best = -Infinity;
    let bestJ = -1;
    const last = dp[m - 1];
    for (let j = m - 1; j < n; j++) {
      if (last[j] > best) {
        best = last[j];
        bestJ = j;
      }
    }

    if (bestJ < 0 || best === -Infinity) return null;

    const positions = new Array(m);
    let cursor = bestJ;
    for (let i = m - 1; i >= 0; i--) {
      positions[i] = cursor;
      cursor = parents[i][cursor];
    }

    return {
      score: best + bonusScore(lower, query),
      positions
    };
  }

  function commandSearch(cmd, q) {
    if (!q) return null;
    let best = null;

    const title = scoreTextMatch(cmd.title, q);
    if (title) {
      best = {
        score: title.score + 10000,
        source: "title",
        positions: title.positions,
        keyword: null
      };
    }

    if (Array.isArray(cmd.keywords)) {
      for (const kw of cmd.keywords) {
        const match = scoreTextMatch(kw, q);
        if (!match) continue;
        const total = match.score + 5000;
        if (!best || total > best.score) {
          best = {
            score: total,
            source: "keyword",
            positions: null,
            keyword: kw
          };
        }
      }
    }

    return best;
  }

  function iconFor(cmd) {
    if (cmd && typeof cmd.id === "string" && cmd.id.startsWith("accent-")) {
      return `<span class="swatch" style="background:${esc(cmd.value || "transparent")}"></span>`;
    }
    if (cmd && cmd.group && GROUP_ICONS[cmd.group]) return GROUP_ICONS[cmd.group];
    return GROUP_ICONS.Help;
  }

  function addHeading(label) {
    const heading = document.createElement("div");
    heading.className = "group-heading";
    heading.textContent = label;
    optionsEl.appendChild(heading);
  }

  function addOption(command, match, showSubtitle) {
    const index = optionsData.length;
    const el = document.createElement("div");
    el.id = `palette-option-${optionSeq++}`;
    el.className = "option";
    el.setAttribute("role", "option");
    el.setAttribute("aria-selected", "false");
    el.dataset.command = command.id;
    el.dataset.index = String(index);

    const titleHtml = match && match.source === "title"
      ? highlightText(command.title, match.positions)
      : esc(command.title);

    let sub = "";
    if (showSubtitle) {
      if (command.id.startsWith("accent-")) sub = command.value || "";
      else if (match && match.source === "keyword") sub = `Keyword: ${match.keyword}`;
      else sub = command.group || "";
    }

    const keys = formatShortcutHTML(command.shortcut || "");
    el.innerHTML = `
      <span class="option-icon">${iconFor(command)}</span>
      <span class="option-main">
        <span class="option-title">${titleHtml}</span>
        ${sub ? `<span class="option-sub">${esc(sub)}</span>` : ""}
      </span>
      <span class="option-keys">${keys}</span>
    `;

    optionsEl.appendChild(el);
    optionsData.push({ command, match, el });
  }

  function maxListHeight() {
    const vh = Math.max(160, Math.floor(window.innerHeight * 0.45));
    return Math.min(420, vh);
  }

  function animateList(oldHeight, newHeight) {
    const target = Math.max(0, newHeight);
    if (reducedMotion) {
      paletteList.style.height = `${target}px`;
      return;
    }
    if (Math.abs(oldHeight - target) < 1) {
      paletteList.style.height = `${target}px`;
      return;
    }

    paletteList.style.transition = "none";
    paletteList.style.height = `${oldHeight}px`;
    void paletteList.offsetHeight;
    paletteList.style.transition = "";
    paletteList.style.height = `${target}px`;
  }

  function updateCrumb() {
    if (state.page === "accent") {
      paletteCrumb.hidden = false;
      paletteCrumbLabel.textContent = "Change Accent Color…";
      searchInput.placeholder = "Search colors…";
      paletteList.setAttribute("aria-label", "Accent colors");
    } else {
      paletteCrumb.hidden = true;
      searchInput.placeholder = "Type a command or search…";
      paletteList.setAttribute("aria-label", "Commands");
    }
  }

  function renderPalette() {
    const oldHeight = paletteList.offsetHeight;
    optionsEl.innerHTML = "";
    optionsData = [];
    optionSeq = 0;

    const q = state.query.trim().toLowerCase();
    const source = state.page === "accent" ? ACCENTS : COMMANDS;
    const showSubtitle = q.length > 0;

    if (q.length > 0) {
      const matches = [];
      source.forEach((cmd, idx) => {
        const match = commandSearch(cmd, q);
        if (match) matches.push({ cmd, match, idx });
      });

      matches.sort((a, b) => (b.match.score - a.match.score) || (a.idx - b.idx));
      matches.slice(0, 50).forEach(item => addOption(item.cmd, item.match, showSubtitle));
    } else if (state.page === "accent") {
      source.forEach(cmd => addOption(cmd, null, false));
    } else {
      const recents = getRecents().slice(0, 5);
      if (recents.length) {
        addHeading("Recent");
        recents.forEach(id => {
          const cmd = COMMANDS.find(c => c.id === id);
          if (cmd) addOption(cmd, null, false);
        });
      }

      GROUP_ORDER.forEach(group => {
        addHeading(group);
        COMMANDS.filter(c => c.group === group).forEach(cmd => addOption(cmd, null, false));
      });
    }

    emptyEl.hidden = optionsData.length !== 0;
    updateCrumb();

    const contentHeight = optionsEl.scrollHeight;
    const targetHeight = Math.min(contentHeight, maxListHeight());
    animateList(oldHeight, targetHeight);

    setActive(optionsData.length ? 0 : -1, { scroll: false });
  }

  function updateHighlight() {
    if (activeIndex < 0 || !optionsData[activeIndex]) {
      highlightEl.style.opacity = "0";
      return;
    }
    const el = optionsData[activeIndex].el;
    highlightEl.style.opacity = "1";
    highlightEl.style.transform = `translate3d(0, ${el.offsetTop}px, 0)`;
    highlightEl.style.height = `${el.offsetHeight}px`;
  }

  function setActive(index, options = { scroll: true }) {
    if (!optionsData.length) {
      activeIndex = -1;
      highlightEl.style.opacity = "0";
      searchInput.setAttribute("aria-activedescendant", "");
      return;
    }

    let target = index;
    if (target < 0) target = 0;
    if (target >= optionsData.length) target = optionsData.length - 1;

    activeIndex = target;
    optionsData.forEach((item, i) => {
      item.el.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
    });

    searchInput.setAttribute("aria-activedescendant", optionsData[activeIndex].el.id);

    if (options.scroll !== false) {
      optionsData[activeIndex].el.scrollIntoView({ block: "nearest" });
    }

    updateHighlight();
  }

  function moveActive(delta) {
    if (!optionsData.length) return;
    const len = optionsData.length;
    if (activeIndex < 0) {
      setActive(delta > 0 ? 0 : len - 1);
      return;
    }
    const next = (activeIndex + delta + len) % len;
    setActive(next);
  }

  function getTheme() {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }

  function setTheme(theme) {
    const next = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    writeLS(LS_THEME, next);
  }

  function toggleTheme() {
    setTheme(getTheme() === "dark" ? "light" : "dark");
  }

  function currentAccent() {
    const stored = readLS(LS_ACCENT);
    return ACCENTS.find(a => a.id === stored) || ACCENTS[0];
  }

  function setAccent(accent) {
    document.documentElement.style.setProperty("--accent", accent.value);
    writeLS(LS_ACCENT, accent.id);
  }

  function showToast(title, sub) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("data-toast", title);
    toast.innerHTML = `
      <span class="toast-body">
        <span class="toast-title">${esc(title)}</span>
        ${sub ? `<span class="toast-sub">${esc(sub)}</span>` : ""}
      </span>
    `;

    toastRegion.appendChild(toast);

    const cleanup = () => {
      if (toast.isConnected) toast.remove();
    };

    toast.addEventListener("animationend", event => {
      if (event.target !== toast) return;
      if (toast.classList.contains("exiting")) cleanup();
    });

    window.setTimeout(() => {
      if (!toast.isConnected) return;
      if (reducedMotion) {
        cleanup();
      } else {
        toast.classList.add("exiting");
      }
    }, 3000);

    window.setTimeout(() => {
      if (toast.isConnected) toast.remove();
    }, reducedMotion ? 3050 : 3380);
  }

  function currentNote() {
    return notes.find(n => n.id === currentNoteId) || notes[0] || null;
  }

  function saveEditor() {
    const note = currentNote();
    if (note) note.body = editor.value;
  }

  function renderNotes() {
    saveEditor();
    notesEl.innerHTML = "";

    const displayNotes = [...notes].sort((a, b) => {
      const pa = a.pinned ? 1 : 0;
      const pb = b.pinned ? 1 : 0;
      return pb - pa;
    });

    noteCount.textContent = String(notes.length);

    displayNotes.forEach(note => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "note" + (note.id === currentNoteId ? " is-current" : "");
      button.setAttribute("data-note", note.id);

      const preview = note.body.replace(/\s+/g, " ").trim() || "No additional text";
      button.innerHTML = `
        <span class="note-dot" aria-hidden="true"></span>
        <span class="note-copy">
          <span class="note-title">${esc(note.title)}</span>
          <span class="note-preview">${esc(preview)}</span>
        </span>
      `;

      button.addEventListener("click", () => selectNote(note.id));
      notesEl.appendChild(button);
    });
  }

  function selectNote(id) {
    if (!notes.some(n => n.id === id)) return;
    currentNoteId = id;
    const note = currentNote();
    if (!note) return;
    noteTitle.value = note.title;
    editor.value = note.body;
    renderNotes();
  }

  function newNote() {
    const id = `note-${Date.now()}`;
    notes.unshift({
      id,
      title: "Untitled note",
      body: "Start writing…",
      pinned: false
    });
    currentNoteId = id;
    noteTitle.value = "Untitled note";
    editor.value = "Start writing…";
    renderNotes();
  }

  function duplicateNote() {
    const note = currentNote();
    if (!note) return;
    const copy = {
      ...note,
      id: `note-${Date.now()}`,
      title: `${note.title} copy`,
      pinned: false
    };
    const idx = notes.findIndex(n => n.id === note.id);
    notes.splice(idx + 1, 0, copy);
    currentNoteId = copy.id;
    noteTitle.value = copy.title;
    editor.value = copy.body;
    renderNotes();
  }

  function deleteNote() {
    saveEditor();
    const idx = notes.findIndex(n => n.id === currentNoteId);
    if (idx < 0) return;

    notes.splice(idx, 1);
    if (!notes.length) {
      newNote();
      return;
    }

    const next = notes[Math.min(idx, notes.length - 1)];
    selectNote(next.id);
  }

  function pinNote() {
    const note = currentNote();
    if (!note) return;
    note.pinned = !note.pinned;
    renderNotes();
  }

  function setView(view) {
    viewButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });
    currentView.textContent = view;
  }

  function setZoom(next) {
    zoomLevel = Math.max(0.82, Math.min(1.28, next));
    document.documentElement.style.setProperty("--zoom", String(zoomLevel));
  }

  function setWordWrap(on) {
    wordWrapEnabled = !!on;
    editor.wrap = wordWrapEnabled ? "soft" : "off";
    editor.classList.toggle("nowrap", !wordWrapEnabled);
  }

  function insertSurround(token) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = editor.value.slice(start, end) || "text";
    editor.setRangeText(`${token}${selected}${token}`, start, end, "select");
    editor.focus();
    saveEditor();
    renderNotes();
  }

  function insertText(text) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.setRangeText(text, start, end, "end");
    editor.focus();
    saveEditor();
    renderNotes();
  }

  function sortLines(ascending) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const hasSelection = end > start;
    const block = hasSelection ? editor.value.slice(start, end) : editor.value;
    const lines = block.split("\n");
    lines.sort((a, b) => ascending ? a.localeCompare(b) : b.localeCompare(a));
    const sorted = lines.join("\n");

    if (hasSelection) {
      const before = editor.value.slice(0, start);
      const after = editor.value.slice(end);
      editor.value = before + sorted + after;
      editor.selectionStart = start;
      editor.selectionEnd = start + sorted.length;
    } else {
      editor.value = sorted;
    }

    saveEditor();
    renderNotes();
  }

  function formatDocument() {
    const normalized = editor.value.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trimStart();
    editor.value = normalized;
    saveEditor();
    renderNotes();
  }

  function runCommandEffect(cmd) {
    switch (cmd.id) {
      case "toggle-dark-mode":
        toggleTheme();
        break;
      case "new-note":
        newNote();
        break;
      case "duplicate-note":
        duplicateNote();
        break;
      case "delete-note":
        deleteNote();
        break;
      case "pin-note":
        pinNote();
        break;
      case "go-inbox":
        setView("Inbox");
        break;
      case "go-today":
        setView("Today");
        break;
      case "go-archive":
        setView("Archive");
        break;
      case "go-settings":
        setView("Settings");
        break;
      case "toggle-sidebar":
        appEl.classList.toggle("no-sidebar");
        break;
      case "toggle-focus-mode":
        appEl.classList.toggle("focus-mode");
        break;
      case "zoom-in":
        setZoom(zoomLevel + 0.08);
        break;
      case "zoom-out":
        setZoom(zoomLevel - 0.08);
        break;
      case "zoom-reset":
        setZoom(1);
        break;
      case "word-wrap":
        setWordWrap(!wordWrapEnabled);
        break;
      case "bold":
        insertSurround("**");
        break;
      case "italic":
        insertSurround("*");
        break;
      case "insert-link":
        insertText("[link text](https://example.com)");
        break;
      case "insert-table":
        insertText("\n| Column | Column |\n| --- | --- |\n| Cell | Cell |\n");
        break;
      case "insert-code":
        insertText("\n```\ncode\n```\n");
        break;
      case "insert-checklist":
        insertText("\n- [ ] Task\n- [ ] Another task\n");
        break;
      case "sort-asc":
        sortLines(true);
        break;
      case "sort-desc":
        sortLines(false);
        break;
      case "format-doc":
        formatDocument();
        break;
      default:
        break;
    }
  }

  function openSubPage(pageId) {
    state.page = pageId;
    state.query = "";
    searchInput.value = "";
    renderPalette();
    searchInput.focus();
  }

  function backToRoot() {
    if (state.page === "root") return;
    state.page = "root";
    state.query = "";
    searchInput.value = "";
    renderPalette();
    searchInput.focus();
  }

  function restoreFocus() {
    try {
      if (lastFocused && document.contains(lastFocused) && typeof lastFocused.focus === "function" && !lastFocused.disabled) {
        lastFocused.focus();
        return;
      }
    } catch (_) {}

    try {
      if (editor && typeof editor.focus === "function") editor.focus();
    } catch (_) {}
  }

  function openPalette() {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }

    paletteClosing = false;
    palette.classList.remove("closing");

    if (paletteOpen) {
      searchInput.focus();
      return;
    }

    lastFocused = document.activeElement;
    paletteOpen = true;
    palette.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");

    state.page = "root";
    state.query = "";
    searchInput.value = "";

    palette.classList.add("open");
    void palette.offsetWidth;

    renderPalette();
    searchInput.focus();
  }

  function closePalette() {
    if (!paletteOpen) return;

    paletteOpen = false;
    paletteClosing = true;
    searchInput.setAttribute("aria-expanded", "false");
    palette.classList.add("closing");

    const duration = reducedMotion ? 24 : 190;
    closeTimer = window.setTimeout(() => {
      closeTimer = null;
      paletteClosing = false;
      palette.hidden = true;
      palette.classList.remove("open", "closing");
      restoreFocus();
    }, duration);
  }

  function executeOption(option) {
    if (!option) return;
    const cmd = option.command;

    if (cmd.page) {
      openSubPage(cmd.page);
      return;
    }

    if (typeof cmd.id === "string" && cmd.id.startsWith("accent-")) {
      const accent = cmd;
      setAccent(accent);
      recordRecent("change-accent");
      showToast("Change Accent Color…", `Accent set to ${accent.title}`);
      closePalette();
      return;
    }

    recordRecent(cmd.id);
    try {
      runCommandEffect(cmd);
    } catch (_) {}

    showToast(cmd.title);
    closePalette();
  }

  function executeActive() {
    if (activeIndex < 0 || !optionsData[activeIndex]) return;
    executeOption(optionsData[activeIndex]);
  }

  function handleGlobalKey(event) {
    const key = event.key;
    const isCtrlOrMeta = event.ctrlKey || event.metaKey;

    if (isCtrlOrMeta && !event.altKey && !event.shiftKey && (key === "k" || key === "K")) {
      event.preventDefault();
      if (paletteOpen) closePalette();
      else openPalette();
      return;
    }

    if (!paletteOpen) return;

    if (key === "Escape") {
      event.preventDefault();
      if (state.page !== "root") backToRoot();
      else closePalette();
      return;
    }

    if (key === "Tab") {
      event.preventDefault();
      searchInput.focus();
      return;
    }

    if (key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
      return;
    }

    if (key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
      return;
    }

    if (key === "Home") {
      event.preventDefault();
      setActive(0);
      return;
    }

    if (key === "End") {
      event.preventDefault();
      setActive(optionsData.length - 1);
      return;
    }

    if (key === "Enter") {
      event.preventDefault();
      executeActive();
      return;
    }

    if (key === "Backspace" && state.page !== "root" && searchInput.value === "") {
      event.preventDefault();
      backToRoot();
      return;
    }
  }

  function initApp() {
    const storedTheme = readLS(LS_THEME);
    setTheme(storedTheme === "dark" ? "dark" : "light");
    setAccent(currentAccent());
    setWordWrap(true);
    setZoom(1);
    paletteHint.innerHTML = formatShortcutHTML("Mod+K");

    selectNote(currentNoteId);
    renderNotes();

    openPaletteButton.addEventListener("click", openPalette);
    sidebarNewNote.addEventListener("click", () => {
      newNote();
      showToast("New Note");
    });

    noteTitle.addEventListener("input", () => {
      const note = currentNote();
      if (!note) return;
      note.title = noteTitle.value;
      renderNotes();
    });

    editor.addEventListener("input", () => {
      saveEditor();
      renderNotes();
    });

    viewButtons.forEach(btn => {
      btn.addEventListener("click", () => setView(btn.dataset.view));
    });

    searchInput.addEventListener("input", () => {
      state.query = searchInput.value;
      renderPalette();
    });

    palette.addEventListener("click", event => {
      if (event.target === palette || event.target.classList.contains("palette-backdrop")) {
        closePalette();
      }
    });

    optionsEl.addEventListener("mousedown", event => {
      if (event.target.closest('[role="option"]')) event.preventDefault();
    });

    optionsEl.addEventListener("click", event => {
      const el = event.target.closest('[role="option"]');
      if (!el) return;
      const idx = Number(el.dataset.index);
      if (!Number.isInteger(idx) || !optionsData[idx]) return;
      executeOption(optionsData[idx]);
    });

    optionsEl.addEventListener("mousemove", event => {
      const el = event.target.closest('[role="option"]');
      if (!el) return;
      const idx = Number(el.dataset.index);
      if (!Number.isInteger(idx) || !optionsData[idx]) return;
      if (idx !== activeIndex) setActive(idx, { scroll: false });
    });

    document.addEventListener("keydown", handleGlobalKey);

    window.addEventListener("resize", () => {
      if (!paletteOpen) return;
      const target = Math.min(optionsEl.scrollHeight, maxListHeight());
      paletteList.style.height = `${target}px`;
      updateHighlight();
    });
  }

  initApp();
</script>
</body>
</html>
```