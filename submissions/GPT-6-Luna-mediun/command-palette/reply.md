```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>Commander — Notes</title>
  <style>
    :root {
      --accent: #5b5bd6;
      --accent-rgb: 91, 91, 214;
      --bg: #f7f7f9;
      --surface: #ffffff;
      --surface-soft: #fafafc;
      --surface-hover: #f2f2f6;
      --text: #24242d;
      --text-soft: #626271;
      --text-faint: #9292a0;
      --border: #e9e9ee;
      --border-strong: #dedee6;
      --sidebar: #fbfbfc;
      --editor: #ffffff;
      --shadow: 0 24px 80px rgba(25, 25, 45, .18), 0 4px 16px rgba(25, 25, 45, .08);
      --ease-out: cubic-bezier(.2, .75, .25, 1);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background: var(--bg);
      font-synthesis: none;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    html[data-theme="dark"] {
      --bg: #15151a;
      --surface: #1d1d24;
      --surface-soft: #22222a;
      --surface-hover: #2a2a34;
      --text: #ededf3;
      --text-soft: #b2b2c0;
      --text-faint: #81818f;
      --border: #30303a;
      --border-strong: #3b3b47;
      --sidebar: #19191f;
      --editor: #1d1d24;
      --shadow: 0 24px 80px rgba(0, 0, 0, .5), 0 4px 16px rgba(0, 0, 0, .3);
    }

    * { box-sizing: border-box; }

    html, body {
      width: 100%;
      min-width: 320px;
      height: 100%;
      margin: 0;
      overflow: hidden;
    }

    body {
      background: var(--bg);
      color: var(--text);
      transition: background-color 220ms ease, color 220ms ease;
    }

    button, input, textarea { font: inherit; }
    button { color: inherit; }

    .app {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg);
      transition: background-color 220ms ease;
    }

    .topbar {
      height: 62px;
      flex: 0 0 62px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      transition: background-color 220ms ease, border-color 220ms ease;
      z-index: 2;
    }

    .brand-wrap, .top-actions, .top-center, .brand {
      display: flex;
      align-items: center;
    }

    .brand-wrap { gap: 34px; }
    .brand { gap: 10px; font-weight: 700; letter-spacing: -.035em; font-size: 16px; }
    .brand-mark {
      width: 27px;
      height: 27px;
      display: grid;
      place-items: center;
      color: white;
      background: var(--accent);
      border-radius: 8px;
      box-shadow: 0 3px 8px rgba(var(--accent-rgb), .24);
    }
    .brand-mark svg { width: 15px; height: 15px; }
    .top-center { gap: 8px; color: var(--text-faint); font-size: 12px; }
    .crumb-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--text-faint); }
    .top-actions { gap: 10px; }
    .top-icon-button {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      background: transparent;
      border: 0;
      border-radius: 8px;
      color: var(--text-soft);
      cursor: pointer;
      transition: background-color 150ms ease, color 150ms ease;
    }
    .top-icon-button:hover { background: var(--surface-hover); color: var(--text); }
    .top-icon-button svg { width: 17px; height: 17px; }

    .palette-trigger {
      height: 34px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 8px 0 11px;
      color: var(--text-soft);
      font-size: 12px;
      background: var(--surface-soft);
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      transition: border-color 150ms ease, background-color 150ms ease, color 150ms ease;
    }
    .palette-trigger:hover {
      color: var(--text);
      background: var(--surface-hover);
      border-color: var(--border-strong);
    }

    .keycap {
      min-width: 19px;
      height: 20px;
      padding: 0 5px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--text-soft);
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: 5px;
      box-shadow: 0 1px 0 var(--border);
      font-size: 10px;
      font-weight: 600;
      line-height: 1;
      white-space: nowrap;
    }
    .trigger-keys { display: flex; gap: 4px; }

    .workspace {
      min-height: 0;
      flex: 1;
      display: flex;
    }

    .sidebar {
      width: 260px;
      flex: 0 0 260px;
      display: flex;
      flex-direction: column;
      padding: 22px 14px 16px;
      background: var(--sidebar);
      border-right: 1px solid var(--border);
      transition: width 200ms ease, flex-basis 200ms ease, padding 200ms ease, background-color 220ms ease, border-color 220ms ease;
      overflow: hidden;
    }
    .sidebar.is-collapsed { width: 0; flex-basis: 0; padding-left: 0; padding-right: 0; border-right: 0; }
    .sidebar-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 9px;
      margin-bottom: 18px;
    }
    .sidebar-label {
      color: var(--text-faint);
      font-size: 10px;
      letter-spacing: .11em;
      font-weight: 700;
      text-transform: uppercase;
    }
    .add-note {
      width: 25px;
      height: 25px;
      display: grid;
      place-items: center;
      color: var(--text-soft);
      background: transparent;
      border: 0;
      border-radius: 6px;
      cursor: pointer;
    }
    .add-note:hover { color: var(--accent); background: var(--surface-hover); }
    .add-note svg { width: 15px; height: 15px; }
    .note-list { display: flex; flex-direction: column; gap: 4px; }
    .note-item {
      width: 100%;
      min-height: 44px;
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 0 10px;
      text-align: left;
      border: 0;
      border-radius: 8px;
      color: var(--text-soft);
      background: transparent;
      cursor: pointer;
      transition: color 140ms ease, background-color 140ms ease;
    }
    .note-item:hover { background: var(--surface-hover); color: var(--text); }
    .note-item.active { color: var(--accent); background: rgba(var(--accent-rgb), .09); }
    .note-item svg { width: 16px; height: 16px; flex: 0 0 auto; opacity: .8; }
    .note-item-text { min-width: 0; flex: 1; }
    .note-item-title {
      overflow: hidden;
      color: inherit;
      font-size: 12px;
      font-weight: 550;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .note-item-meta { margin-top: 3px; color: var(--text-faint); font-size: 10px; }
    .sidebar-bottom {
      margin-top: auto;
      padding: 13px 10px 0;
      border-top: 1px solid var(--border);
      color: var(--text-faint);
      font-size: 11px;
      line-height: 1.6;
    }
    .avatar-line { display: flex; align-items: center; gap: 9px; color: var(--text-soft); }
    .avatar {
      width: 25px;
      height: 25px;
      display: grid;
      place-items: center;
      color: white;
      background: linear-gradient(145deg, #d49a72, #ab6457);
      border-radius: 50%;
      font-size: 10px;
      font-weight: 700;
    }

    .main {
      min-width: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--editor);
      transition: background-color 220ms ease;
    }
    .doc-toolbar {
      height: 54px;
      flex: 0 0 54px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 38px;
      border-bottom: 1px solid var(--border);
    }
    .doc-context { display: flex; align-items: center; gap: 9px; color: var(--text-faint); font-size: 11px; }
    .doc-context svg { width: 14px; height: 14px; }
    .doc-actions { display: flex; align-items: center; gap: 6px; }
    .doc-action {
      width: 30px;
      height: 30px;
      display: grid;
      place-items: center;
      color: var(--text-faint);
      background: transparent;
      border: 0;
      border-radius: 7px;
      cursor: pointer;
    }
    .doc-action:hover { color: var(--text); background: var(--surface-hover); }
    .doc-action svg { width: 15px; height: 15px; }
    .editor-wrap {
      width: min(730px, calc(100% - 64px));
      margin: 0 auto;
      padding: 74px 0 80px;
      display: flex;
      flex: 1;
      flex-direction: column;
      overflow: auto;
    }
    .note-eyebrow {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 18px;
      color: var(--text-faint);
      font-size: 11px;
    }
    .eyebrow-dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; }
    .note-title {
      margin: 0 0 12px;
      color: var(--text);
      font-size: clamp(30px, 3.5vw, 40px);
      line-height: 1.2;
      letter-spacing: -.055em;
      font-weight: 650;
    }
    .note-subtitle {
      margin: 0 0 35px;
      color: var(--text-faint);
      font-size: 13px;
    }
    .editor {
      width: 100%;
      min-height: 300px;
      flex: 1;
      resize: none;
      padding: 0;
      color: var(--text-soft);
      background: transparent;
      border: 0;
      outline: none;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.95;
      letter-spacing: .005em;
    }
    .editor::placeholder { color: var(--text-faint); }
    .editor-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 13px;
      border-top: 1px solid var(--border);
      color: var(--text-faint);
      font-size: 10px;
    }
    .save-state { display: flex; align-items: center; gap: 6px; }
    .save-state svg { width: 12px; height: 12px; color: #28a875; }
    .focus-mode .sidebar, .focus-mode .topbar { display: none; }

    /* Command palette */
    .palette-overlay {
      position: fixed;
      inset: 0;
      z-index: 20;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: min(13vh, 112px) 20px 24px;
      background: rgba(18, 18, 28, .42);
      opacity: 0;
      transition: opacity 180ms ease;
      -webkit-backdrop-filter: blur(5px);
      backdrop-filter: blur(5px);
    }
    .palette-overlay.is-open { opacity: 1; }
    .palette-panel {
      width: min(620px, 100%);
      max-height: min(680px, calc(100vh - 48px));
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--surface);
      border: 1px solid rgba(255,255,255,.45);
      border-radius: 14px;
      box-shadow: var(--shadow);
      opacity: 0;
      transform: translateY(-7px) scale(.975);
      transform-origin: top center;
      transition: transform 190ms var(--ease-out), opacity 170ms ease, background-color 220ms ease;
      outline: none;
    }
    .palette-overlay.is-open .palette-panel { opacity: 1; transform: translateY(0) scale(1); }
    .palette-heading {
      min-height: 54px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 19px;
      border-bottom: 1px solid var(--border);
    }
    .palette-brand { display: flex; align-items: center; gap: 9px; }
    .palette-brand-icon {
      width: 22px;
      height: 22px;
      display: grid;
      place-items: center;
      color: var(--accent);
      background: rgba(var(--accent-rgb), .1);
      border-radius: 6px;
    }
    .palette-brand-icon svg { width: 13px; height: 13px; }
    .palette-heading-title { font-size: 12px; font-weight: 650; letter-spacing: -.01em; }
    .palette-heading-caption { margin-left: 2px; color: var(--text-faint); font-size: 11px; }
    .palette-close {
      width: 26px;
      height: 26px;
      display: grid;
      place-items: center;
      color: var(--text-faint);
      background: transparent;
      border: 0;
      border-radius: 6px;
      cursor: pointer;
    }
    .palette-close:hover { color: var(--text); background: var(--surface-hover); }
    .palette-close svg { width: 14px; height: 14px; }

    .search-row {
      min-height: 61px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 20px;
      border-bottom: 1px solid var(--border);
    }
    .search-icon { width: 18px; height: 18px; flex: 0 0 auto; color: var(--text-faint); }
    .search-input {
      width: 100%;
      min-width: 0;
      height: 48px;
      padding: 0;
      color: var(--text);
      background: transparent;
      border: 0;
      outline: none;
      font-size: 15px;
      letter-spacing: -.012em;
    }
    .search-input::placeholder { color: var(--text-faint); }
    .search-hint { flex: 0 0 auto; color: var(--text-faint); font-size: 10px; }
    .palette-breadcrumb {
      display: none;
      align-items: center;
      gap: 7px;
      padding: 9px 20px 0;
      color: var(--text-faint);
      font-size: 10px;
    }
    .palette-breadcrumb.visible { display: flex; }
    .breadcrumb-back {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 7px;
      color: var(--accent);
      background: rgba(var(--accent-rgb), .08);
      border: 0;
      border-radius: 5px;
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
    }
    .breadcrumb-back svg { width: 11px; height: 11px; }

    .results-viewport {
      height: 0;
      max-height: 410px;
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      scrollbar-color: var(--border-strong) transparent;
      transition: height 180ms var(--ease-out);
    }
    .results-viewport::-webkit-scrollbar { width: 7px; }
    .results-viewport::-webkit-scrollbar-thumb { background: var(--border-strong); border: 2px solid transparent; background-clip: padding-box; border-radius: 8px; }
    .results-list { padding: 9px 8px 10px; }
    .result-group { margin: 0 0 6px; }
    .result-group:last-child { margin-bottom: 0; }
    .group-heading {
      padding: 8px 10px 6px;
      color: var(--text-faint);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: .12em;
      line-height: 1;
      text-transform: uppercase;
    }
    .result-option {
      position: relative;
      min-height: 40px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 10px;
      color: var(--text-soft);
      border-radius: 7px;
      cursor: pointer;
      transition: background-color 120ms ease, color 120ms ease;
      user-select: none;
      outline: none;
    }
    .result-option:hover { color: var(--text); background: var(--surface-hover); }
    .result-option[aria-selected="true"] {
      color: var(--text);
      background: rgba(var(--accent-rgb), .105);
    }
    .result-option[aria-selected="true"]::before {
      position: absolute;
      top: 9px;
      bottom: 9px;
      left: 0;
      width: 2px;
      content: "";
      background: var(--accent);
      border-radius: 2px;
    }
    .result-icon {
      width: 23px;
      height: 23px;
      flex: 0 0 auto;
      display: grid;
      place-items: center;
      color: var(--text-faint);
      background: var(--surface-soft);
      border: 1px solid var(--border);
      border-radius: 6px;
      transition: color 120ms ease, border-color 120ms ease, background-color 120ms ease;
    }
    .result-option[aria-selected="true"] .result-icon { color: var(--accent); border-color: rgba(var(--accent-rgb), .2); background: var(--surface); }
    .result-icon svg { width: 13px; height: 13px; }
    .result-title { min-width: 0; flex: 1; overflow: hidden; font-size: 12px; font-weight: 520; text-overflow: ellipsis; white-space: nowrap; }
    .result-title mark { padding: 0; color: var(--accent); background: transparent; font-weight: 750; }
    .result-meta { display: flex; align-items: center; gap: 4px; margin-left: auto; }
    .result-meta .keycap { height: 19px; min-width: 18px; font-size: 9px; }
    .result-chevron { width: 13px; height: 13px; color: var(--text-faint); }
    .accent-swatch {
      width: 13px;
      height: 13px;
      border-radius: 50%;
      box-shadow: 0 0 0 2px var(--surface), 0 0 0 3px var(--border);
    }

    .palette-empty {
      min-height: 114px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 7px;
      color: var(--text-faint);
      font-size: 11px;
    }
    .palette-empty[hidden] { display: none; }
    .empty-search-icon {
      width: 26px;
      height: 26px;
      display: grid;
      place-items: center;
      margin-bottom: 1px;
      color: var(--text-faint);
      background: var(--surface-soft);
      border: 1px solid var(--border);
      border-radius: 8px;
    }
    .empty-search-icon svg { width: 14px; height: 14px; }
    .palette-footer {
      min-height: 39px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 15px;
      color: var(--text-faint);
      background: var(--surface-soft);
      border-top: 1px solid var(--border);
      font-size: 9px;
    }
    .footer-hints { display: flex; align-items: center; gap: 13px; }
    .footer-hint { display: flex; align-items: center; gap: 5px; }
    .footer-hint .keycap { min-width: 17px; height: 17px; padding: 0 4px; font-size: 9px; }

    #toasts {
      position: fixed;
      right: 22px;
      bottom: 20px;
      z-index: 40;
      display: flex;
      align-items: flex-end;
      flex-direction: column;
      gap: 9px;
      pointer-events: none;
    }
    .toast {
      min-width: 220px;
      max-width: min(360px, calc(100vw - 40px));
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 12px 15px;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      box-shadow: 0 8px 30px rgba(20, 20, 35, .12);
      font-size: 12px;
      animation: toast-in 220ms var(--ease-out) both;
      pointer-events: auto;
    }
    .toast.is-leaving { animation: toast-out 190ms ease forwards; }
    .toast-check {
      width: 20px;
      height: 20px;
      flex: 0 0 auto;
      display: grid;
      place-items: center;
      color: white;
      background: var(--accent);
      border-radius: 50%;
    }
    .toast-check svg { width: 12px; height: 12px; }
    .toast-copy { min-width: 0; flex: 1; }
    .toast-label { color: var(--text-faint); font-size: 9px; margin-bottom: 2px; }
    .toast-title { overflow: hidden; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
    @keyframes toast-in { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes toast-out { to { opacity: 0; transform: translateY(7px) scale(.98); } }

    [hidden] { display: none !important; }

    @media (max-width: 760px) {
      .topbar { padding: 0 15px; }
      .brand-wrap { gap: 15px; }
      .top-center { display: none; }
      .sidebar { width: 215px; flex-basis: 215px; }
      .doc-toolbar { padding: 0 20px; }
      .editor-wrap { width: calc(100% - 42px); padding-top: 48px; }
      .palette-overlay { padding-top: 8vh; }
    }
    @media (max-width: 560px) {
      .sidebar { width: 55px; flex-basis: 55px; padding: 18px 7px; }
      .sidebar-heading { justify-content: center; padding: 0; }
      .sidebar-label, .add-note, .note-item-text, .sidebar-bottom { display: none; }
      .note-item { justify-content: center; padding: 0; }
      .note-item svg { width: 18px; height: 18px; }
      .palette-trigger { gap: 6px; padding: 0 7px; font-size: 0; }
      .palette-trigger::before { content: "⌘K"; font-size: 11px; }
      .trigger-keys { display: none; }
      .top-actions { gap: 3px; }
      .doc-toolbar { padding: 0 12px; }
      .editor-wrap { width: calc(100% - 34px); padding-top: 36px; }
      .palette-overlay { padding: 4vh 10px 12px; }
      .palette-panel { max-height: 90vh; }
      .search-hint { display: none; }
      .footer-hints { gap: 7px; }
      .palette-footer { padding: 0 10px; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        scroll-behavior: auto !important;
        transition-duration: .01ms !important;
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <header class="topbar">
      <div class="brand-wrap">
        <div class="brand" aria-label="Commander">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none"><path d="M5.3 4.4h9.4M5.3 8.1h9.4M5.3 11.9h5.3M5.3 15.6h5.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
          </span>
          <span>commander</span>
        </div>
        <div class="top-center" aria-label="Current workspace">
          <span>Personal workspace</span><span class="crumb-dot"></span><span>Notes</span>
        </div>
      </div>
      <div class="top-actions">
        <button class="palette-trigger" id="open-palette" type="button" aria-label="Open command palette">
          <span>Search commands…</span>
          <span class="trigger-keys"><kbd class="keycap" id="mod-keycap">⌘</kbd><kbd class="keycap">K</kbd></span>
        </button>
        <button class="top-icon-button" type="button" aria-label="Help" title="Help">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="7.2" stroke="currentColor" stroke-width="1.5"/><path d="M8.2 7.5a1.9 1.9 0 1 1 3.1 1.5c-.8.6-1.3 1-1.3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="13.8" r=".8" fill="currentColor"/></svg>
        </button>
        <button class="top-icon-button" id="theme-button" type="button" aria-label="Toggle dark mode" title="Toggle theme">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M16.2 12A6.7 6.7 0 0 1 8 3.8 6.8 6.8 0 1 0 16.2 12Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </header>

    <div class="workspace">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-heading">
          <span class="sidebar-label">Your notes</span>
          <button class="add-note" id="sidebar-new-note" type="button" aria-label="Create a new note" title="New note">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
          </button>
        </div>
        <nav class="note-list" id="note-list" aria-label="Notes"></nav>
        <div class="sidebar-bottom">
          <div class="avatar-line"><span class="avatar">A</span><span>Alex Morgan</span></div>
          <div style="padding-left:34px">Personal plan</div>
        </div>
      </aside>

      <main class="main">
        <div class="doc-toolbar">
          <div class="doc-context">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 3.8h7l3 3V16H5V3.8Z" stroke="currentColor" stroke-width="1.35" stroke-linejoin="round"/><path d="M12 3.8v3.4h3M7.6 10h4.8M7.6 12.6h4.8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
            <span>Notes</span><span class="crumb-dot"></span><span id="context-title">A quieter kind of productivity</span>
          </div>
          <div class="doc-actions">
            <button class="doc-action" type="button" aria-label="Pin note" title="Pin note">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m7 3.5 6 0 .4 4.1 2 2v1H4.6v-1l2-2L7 3.5ZM10 10.6v5.9" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="doc-action" type="button" aria-label="More options" title="More options">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="4" cy="10" r="1.3"/><circle cx="10" cy="10" r="1.3"/><circle cx="16" cy="10" r="1.3"/></svg>
            </button>
          </div>
        </div>
        <section class="editor-wrap" aria-label="Note editor">
          <div class="note-eyebrow"><span class="eyebrow-dot"></span><span id="note-category">PERSONAL</span><span>·</span><span id="note-date">Edited today</span></div>
          <h1 class="note-title" id="note-title">A quieter kind of productivity</h1>
          <p class="note-subtitle">A few thoughts on making room for what matters.</p>
          <textarea class="editor" id="editor" aria-label="Note content" spellcheck="false">The best work rarely comes from doing more. It comes from giving the important things enough space to become clear.

A small practice for this week:

— Start the day with one intention, not a list.
— Leave a little room between meetings.
— Write down what can wait, and let it wait.
— Close the day by noticing what moved forward.

Progress can be quiet. It can look like attention, a considered pause, or a single good question asked at the right time.

“Almost everything will work again if you unplug it for a few minutes, including you.”
— Anne Lamott</textarea>
          <div class="editor-footer">
            <span class="save-state"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8.2 3.1 3.1L13 4.7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>All changes saved</span>
            <span id="word-count">72 words</span>
          </div>
        </section>
      </main>
    </div>
  </div>

  <div class="palette-overlay" id="palette-overlay" hidden>
    <section class="palette-panel" id="palette-panel" role="dialog" aria-modal="true" aria-labelledby="palette-title">
      <div class="palette-heading">
        <div class="palette-brand">
          <span class="palette-brand-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none"><path d="M5 5h10M5 10h7M5 15h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
          </span>
          <span class="palette-heading-title" id="palette-title">Command palette</span>
          <span class="palette-heading-caption">Find anything, move faster</span>
        </div>
        <button class="palette-close" id="palette-close" type="button" aria-label="Close command palette">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="search-row">
        <svg class="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.8" cy="8.8" r="5.8" stroke="currentColor" stroke-width="1.5"/><path d="m13.2 13.2 3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <input class="search-input" id="palette-search" type="text" role="combobox" aria-expanded="true" aria-controls="palette-listbox" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="Search commands and notes…" aria-label="Search commands">
        <span class="search-hint">Type to search</span>
      </div>
      <div class="palette-breadcrumb" id="palette-breadcrumb">
        <button class="breadcrumb-back" id="breadcrumb-back" type="button">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m9.8 3.5-4.5 4.5 4.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Commands
        </button>
        <span>/</span>
        <span>Change Accent Color…</span>
      </div>
      <div class="results-viewport" id="results-viewport">
        <div class="results-list" id="palette-listbox" role="listbox" aria-label="Commands"></div>
      </div>
      <div class="palette-empty" id="palette-empty" hidden>
        <span class="empty-search-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="5.6" stroke="currentColor" stroke-width="1.4"/><path d="m12.7 12.7 3.1 3.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span>
        <strong style="font-size:11px;font-weight:600;color:var(--text-soft)">No commands found</strong>
        <span>Try another search term</span>
      </div>
      <div class="palette-footer">
        <div class="footer-hints">
          <span class="footer-hint"><kbd class="keycap">↑</kbd><kbd class="keycap">↓</kbd> Navigate</span>
          <span class="footer-hint"><kbd class="keycap">↵</kbd> Select</span>
          <span class="footer-hint"><kbd class="keycap">esc</kbd> Close</span>
        </div>
        <span>COMMANDER</span>
      </div>
    </section>
  </div>

  <div id="toasts" aria-live="polite" aria-atomic="false"></div>

  <script>
    const COMMANDS = [
      { id: "go-inbox", title: "Go to Inbox", group: "Navigation", keywords: ["home"] },
      { id: "go-today", title: "Go to Today", group: "Navigation" },
      { id: "go-archive", title: "Go to Archive", group: "Navigation" },
      { id: "go-settings", title: "Go to Settings", group: "Navigation", keywords: ["preferences", "options"], shortcut: "Mod+," },
      { id: "go-line", title: "Go to Line…", group: "Navigation", keywords: ["jump"], shortcut: "Mod+G" },
      { id: "go-symbol", title: "Go to Symbol…", group: "Navigation", shortcut: "Mod+Shift+O" },
      { id: "search-notes", title: "Search Notes…", group: "Navigation", keywords: ["find"], shortcut: "Mod+Shift+F" },
      { id: "new-note", title: "New Note", group: "Notes", keywords: ["create", "add"], shortcut: "Mod+N" },
      { id: "new-note-template", title: "New Note from Template…", group: "Notes" },
      { id: "duplicate-note", title: "Duplicate Note", group: "Notes", keywords: ["copy", "clone"] },
      { id: "rename-note", title: "Rename Note…", group: "Notes", shortcut: "F2" },
      { id: "delete-note", title: "Delete Note", group: "Notes", keywords: ["remove", "trash"] },
      { id: "pin-note", title: "Pin Note", group: "Notes", keywords: ["favorite", "star"] },
      { id: "move-note", title: "Move Note to Folder…", group: "Notes" },
      { id: "export-pdf", title: "Export Note as PDF", group: "Notes" },
      { id: "export-md", title: "Export Note as Markdown", group: "Notes" },
      { id: "share-note", title: "Share Note Link", group: "Notes", keywords: ["copy", "url"] },
      { id: "bold", title: "Bold", group: "Editor", shortcut: "Mod+B" },
      { id: "italic", title: "Italic", group: "Editor", shortcut: "Mod+I" },
      { id: "insert-link", title: "Insert Link…", group: "Editor", keywords: ["url"] },
      { id: "insert-table", title: "Insert Table", group: "Editor" },
      { id: "insert-code", title: "Insert Code Block", group: "Editor", keywords: ["snippet"] },
      { id: "insert-checklist", title: "Insert Checklist", group: "Editor", keywords: ["todo", "task"] },
      { id: "word-wrap", title: "Toggle Word Wrap", group: "Editor", shortcut: "Alt+Z" },
      { id: "format-doc", title: "Format Document", group: "Editor", keywords: ["prettify", "beautify"], shortcut: "Shift+Alt+F" },
      { id: "sort-asc", title: "Sort Lines Ascending", group: "Editor" },
      { id: "sort-desc", title: "Sort Lines Descending", group: "Editor" },
      { id: "toggle-dark-mode", title: "Toggle Dark Mode", group: "View", keywords: ["theme", "night", "appearance"], shortcut: "Mod+Shift+L" },
      { id: "change-accent", title: "Change Accent Color…", group: "View", keywords: ["theme", "color"], page: "accent" },
      { id: "toggle-sidebar", title: "Toggle Sidebar", group: "View", shortcut: "Mod+\\" },
      { id: "toggle-focus-mode", title: "Toggle Focus Mode", group: "View", keywords: ["zen", "distraction free"] },
      { id: "zoom-in", title: "Zoom In", group: "View", shortcut: "Mod+=" },
      { id: "zoom-out", title: "Zoom Out", group: "View", shortcut: "Mod+-" },
      { id: "zoom-reset", title: "Reset Zoom", group: "View", shortcut: "Mod+0" },
      { id: "shortcuts", title: "Keyboard Shortcuts", group: "Help", keywords: ["keys", "hotkeys"], shortcut: "Mod+/" },
      { id: "release-notes", title: "Release Notes", group: "Help", keywords: ["changelog", "what's new"] },
      { id: "feedback", title: "Send Feedback", group: "Help" },
      { id: "about", title: "About Commander", group: "Help" },
    ];

    const ACCENTS = [
      { id: "accent-indigo", title: "Indigo", value: "#5b5bd6" },
      { id: "accent-emerald", title: "Emerald", value: "#10b981" },
      { id: "accent-rose", title: "Rose", value: "#e11d48" },
      { id: "accent-amber", title: "Amber", value: "#f59e0b" },
      { id: "accent-sky", title: "Sky", value: "#0ea5e9" },
    ];

    const RECENTS_KEY = "commander-recent-commands";
    const root = document.documentElement;
    const overlay = document.getElementById("palette-overlay");
    const panel = document.getElementById("palette-panel");
    const searchInput = document.getElementById("palette-search");
    const listbox = document.getElementById("palette-listbox");
    const viewport = document.getElementById("results-viewport");
    const emptyState = document.getElementById("palette-empty");
    const breadcrumb = document.getElementById("palette-breadcrumb");
    const toasts = document.getElementById("toasts");
    const editor = document.getElementById("editor");
    const noteList = document.getElementById("note-list");
    const noteTitle = document.getElementById("note-title");
    const contextTitle = document.getElementById("context-title");
    const prefersMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
    document.getElementById("mod-keycap").textContent = prefersMac ? "⌘" : "Ctrl";

    let recentIds = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
      if (Array.isArray(parsed)) recentIds = parsed.filter(id => COMMANDS.some(command => command.id === id)).slice(0, 5);
    } catch (_) {
      recentIds = [];
    }

    let isOpen = false;
    let page = "root";
    let activeIndex = 0;
    let currentItems = [];
    let previousFocus = null;
    let closeTimer = null;
    let closeToken = 0;
    let listAnimationFrame = null;
    let themeIsDark = false;
    let noteCounter = 4;
    let currentNoteId = "note-1";
    let notes = [
      { id: "note-1", title: "A quieter kind of productivity", category: "PERSONAL", date: "Edited today", content: editor.value },
      { id: "note-2", title: "Ideas for a slower Sunday", category: "LIFE", date: "Edited yesterday", content: "Make coffee slowly.\n\nTake the long way home. Leave the afternoon open for whatever feels good.\n\nA little bit of unplanned time can be its own kind of progress." },
      { id: "note-3", title: "Reading list — spring", category: "REFERENCE", date: "Edited Mar 12", content: "Books to make time for this spring:\n\n01  Four Thousand Weeks — Oliver Burkeman\n02  The Creative Act — Rick Rubin\n03  Braiding Sweetgrass — Robin Wall Kimmerer\n\nPick one. Read a little at a time." }
    ];

    function getIcon(name) {
      const icons = {
        navigation: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h11M10 5l5 5-5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        notes: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 3.7h7l3 3V16H5V3.7Z" stroke="currentColor" stroke-width="1.35" stroke-linejoin="round"/><path d="M12 3.8v3.1h3M7.5 10h5M7.5 12.6h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
        editor: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 14.8.7-3.1 7.9-7.9a1.7 1.7 0 0 1 2.4 2.4l-7.9 7.9-3.1.7Z" stroke="currentColor" stroke-width="1.35" stroke-linejoin="round"/><path d="m11.9 6.2 2.4 2.4" stroke="currentColor" stroke-width="1.35"/></svg>',
        view: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 3.2v1.4M10 15.4v1.4M3.2 10h1.4M15.4 10h1.4M5.2 5.2l1 1m7.6 7.6 1 1m0-9.6-1 1m-7.6 7.6-1 1" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/><circle cx="10" cy="10" r="3.1" stroke="currentColor" stroke-width="1.35"/></svg>',
        help: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.35"/><path d="M8 7.5a2 2 0 1 1 3.2 1.6c-.8.6-1.2.9-1.2 2" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/><circle cx="10" cy="13.6" r=".7" fill="currentColor"/></svg>',
        check: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8.2 3 3L13 4.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        chevron: '<svg class="result-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 3.5 4.5 4.5L6 12.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      };
      return icons[name] || icons.notes;
    }

    function renderNotes() {
      noteList.innerHTML = "";
      notes.forEach(note => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "note-item" + (note.id === currentNoteId ? " active" : "");
        button.dataset.note = note.id;
        button.setAttribute("aria-current", note.id === currentNoteId ? "page" : "false");
        button.innerHTML = getIcon("notes") +
          '<span class="note-item-text"><span class="note-item-title"></span><span class="note-item-meta"></span></span>';
        button.querySelector(".note-item-title").textContent = note.title || "Untitled note";
        button.querySelector(".note-item-meta").textContent = note.date;
        button.addEventListener("click", () => selectNote(note.id));
        noteList.appendChild(button);
      });
    }

    function selectNote(id) {
      const note = notes.find(item => item.id === id);
      if (!note) return;
      currentNoteId = id;
      editor.value = note.content;
      noteTitle.textContent = note.title || "Untitled note";
      contextTitle.textContent = note.title || "Untitled note";
      document.getElementById("note-category").textContent = note.category;
      document.getElementById("note-date").textContent = note.date;
      updateWordCount();
      renderNotes();
    }

    function updateWordCount() {
      const count = editor.value.trim() ? editor.value.trim().split(/\s+/).length : 0;
      document.getElementById("word-count").textContent = count + (count === 1 ? " word" : " words");
      const note = notes.find(item => item.id === currentNoteId);
      if (note) note.content = editor.value;
    }

    editor.addEventListener("input", updateWordCount);
    renderNotes();
    updateWordCount();

    function titlePositions(title, query) {
      const lower = title.toLocaleLowerCase();
      const needle = query.toLocaleLowerCase();
      const positions = [];
      let cursor = 0;
      for (const char of needle) {
        const found = lower.indexOf(char, cursor);
        if (found < 0) return null;
        positions.push(found);
        cursor = found + 1;
      }
      return positions;
    }

    function qualityFor(text, query) {
      const positions = titlePositions(text, query);
      if (!positions) return null;
      const lower = text.toLocaleLowerCase();
      const needle = query.toLocaleLowerCase();
      if (lower === needle) return 1000000;
      if (lower.startsWith(needle)) return 500000 - (text.length - query.length) * 2;

      let wordStarts = 0;
      let runs = 0;
      let gaps = 0;
      positions.forEach((position, index) => {
        if (position === 0 || !/[a-z0-9]/i.test(text[position - 1])) wordStarts++;
        if (index > 0) {
          if (position === positions[index - 1] + 1) runs++;
          else gaps += position - positions[index - 1] - 1;
        }
      });
      return wordStarts * 1200 + runs * 140 - gaps * 7 - text.length * 0.2;
    }

    function rankCommand(command, query, originalIndex) {
      const titleScore = qualityFor(command.title, query);
      if (titleScore !== null) {
        return { command, score: 10000000 + titleScore, originalIndex, positions: titlePositions(command.title, query) };
      }
      let keywordScore = null;
      (command.keywords || []).forEach(keyword => {
        const score = qualityFor(keyword, query);
        if (score !== null && (keywordScore === null || score > keywordScore)) keywordScore = score;
      });
      if (keywordScore === null) return null;
      return { command, score: keywordScore, originalIndex, positions: null };
    }

    function rankedCommands(query) {
      return COMMANDS.map((command, index) => rankCommand(command, query, index))
        .filter(Boolean)
        .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex)
        .slice(0, 50);
    }

    function createMarkedTitle(title, positions) {
      if (!positions || !positions.length) return document.createTextNode(title);
      const marked = new Set(positions);
      const fragment = document.createDocumentFragment();
      let runStart = -1;
      for (let i = 0; i <= title.length; i++) {
        if (marked.has(i) && runStart === -1) runStart = i;
        if ((!marked.has(i) || i === title.length) && runStart !== -1) {
          if (i > runStart) {
            const mark = document.createElement("mark");
            mark.textContent = title.slice(runStart, i);
            fragment.appendChild(mark);
          }
          runStart = -1;
        }
        if (!marked.has(i) && i < title.length) fragment.appendChild(document.createTextNode(title[i]));
      }
      return fragment;
    }

    function shortcutKeyLabel(part) {
      if (part === "Mod") return prefersMac ? "⌘" : "Ctrl";
      if (part === "Shift") return prefersMac ? "⇧" : "Shift";
      if (part === "Alt") return prefersMac ? "⌥" : "Alt";
      if (part === "Enter") return "↵";
      if (part === "Escape") return "esc";
      return part;
    }

    function appendShortcut(container, shortcut) {
      if (!shortcut) return;
      const meta = document.createElement("span");
      meta.className = "result-meta";
      shortcut.split("+").forEach(part => {
        const key = document.createElement("kbd");
        key.className = "keycap";
        key.textContent = shortcutKeyLabel(part);
        meta.appendChild(key);
      });
      container.appendChild(meta);
    }

    function makeOption(item, index, positions, isAccent) {
      const option = document.createElement("div");
      option.className = "result-option";
      option.id = "option-" + item.id;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", index === activeIndex ? "true" : "false");
      option.dataset.command = item.id;
      option.tabIndex = -1;

      const icon = document.createElement("span");
      icon.className = "result-icon";
      if (isAccent) {
        const swatch = document.createElement("span");
        swatch.className = "accent-swatch";
        swatch.style.backgroundColor = item.value;
        icon.appendChild(swatch);
      } else {
        const command = item.command || item;
        icon.innerHTML = getIcon(command.group ? command.group.toLowerCase() : "view");
      }

      const title = document.createElement("span");
      title.className = "result-title";
      title.appendChild(createMarkedTitle(item.title, positions));

      option.appendChild(icon);
      option.appendChild(title);

      if (isAccent) {
        const current = getComputedStyle(root).getPropertyValue("--accent").trim().toLowerCase();
        if (current === item.value.toLowerCase()) {
          const selected = document.createElement("span");
          selected.className = "result-meta";
          selected.innerHTML = '<span style="color:var(--accent);font-size:10px;font-weight:600">Current</span>';
          option.appendChild(selected);
        }
      } else if (item.command && item.command.shortcut) {
        appendShortcut(option, item.command.shortcut);
      } else if (item.command && item.command.page === "accent") {
        const meta = document.createElement("span");
        meta.className = "result-meta";
        meta.innerHTML = getIcon("chevron");
        option.appendChild(meta);
      }

      option.addEventListener("mouseenter", () => setActive(index));
      option.addEventListener("click", () => {
        setActive(index);
        executeItem(currentItems[index]);
      });
      return option;
    }

    function addGroup(parent, label, items, isRecent, query) {
      if (!items.length) return;
      const group = document.createElement("div");
      group.className = "result-group";
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", label);
      const heading = document.createElement("div");
      heading.className = "group-heading";
      heading.textContent = label;
      group.appendChild(heading);

      items.forEach(entry => {
        const item = entry.command ? entry.command : entry;
        const index = currentItems.length;
        currentItems.push(item);
        const positions = entry.positions || (query ? titlePositions(item.title, query) : null);
        group.appendChild(makeOption(entry.command ? entry : { command: item, title: item.title, id: item.id }, index, positions, false));
      });
      parent.appendChild(group);
    }

    function animateListHeight() {
      if (listAnimationFrame) cancelAnimationFrame(listAnimationFrame);
      const currentHeight = viewport.getBoundingClientRect().height;
      viewport.style.height = currentHeight + "px";
      const targetHeight = Math.min(viewport.scrollHeight, 410);
      listAnimationFrame = requestAnimationFrame(() => {
        viewport.style.height = targetHeight + "px";
      });
    }

    function renderPalette() {
      const query = searchInput.value.trim();
      const oldHeight = viewport.getBoundingClientRect().height;
      viewport.style.height = oldHeight + "px";
      listbox.innerHTML = "";
      currentItems = [];
      activeIndex = Math.max(0, Math.min(activeIndex, currentItems.length - 1));

      if (page === "accent") {
        breadcrumb.classList.add("visible");
        const matches = query
          ? ACCENTS.map((item, index) => {
              const score = qualityFor(item.title, query);
              return score === null ? null : { ...item, score, originalIndex: index, positions: titlePositions(item.title, query) };
            }).filter(Boolean).sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex)
          : ACCENTS.map((item, index) => ({ ...item, positions: null, originalIndex: index }));
        currentItems = matches;
        matches.forEach((item, index) => {
          listbox.appendChild(makeOption(item, index, item.positions, true));
        });
        activeIndex = matches.length ? Math.min(activeIndex, matches.length - 1) : 0;
        // Update selected state after normalizing the active index.
        Array.from(listbox.querySelectorAll('[role="option"]')).forEach((option, index) => option.setAttribute("aria-selected", index === activeIndex ? "true" : "false"));
      } else {
        breadcrumb.classList.remove("visible");
        if (query) {
          const results = rankedCommands(query);
          currentItems = results.map(result => result.command);
          results.forEach((result, index) => {
            listbox.appendChild(makeOption(result, index, result.positions, false));
          });
          activeIndex = 0;
          Array.from(listbox.querySelectorAll('[role="option"]')).forEach((option, index) => option.setAttribute("aria-selected", index === activeIndex ? "true" : "false"));
        } else {
          const recent = recentIds.map(id => COMMANDS.find(command => command.id === id)).filter(Boolean).slice(0, 5);
          if (recent.length) {
            addGroup(listbox, "Recent", recent.map(command => ({ command, positions: null })), true, "");
          }
          const groupOrder = [];
          COMMANDS.forEach(command => { if (!groupOrder.includes(command.group)) groupOrder.push(command.group); });
          groupOrder.forEach(groupName => {
            const commands = COMMANDS.filter(command => command.group === groupName);
            addGroup(listbox, groupName, commands.map(command => ({ command, positions: null })), false, "");
          });
          activeIndex = 0;
          Array.from(listbox.querySelectorAll('[role="option"]')).forEach((option, index) => option.setAttribute("aria-selected", index === activeIndex ? "true" : "false"));
        }
      }

      const hasItems = currentItems.length > 0;
      emptyState.hidden = hasItems;
      viewport.setAttribute("aria-hidden", hasItems ? "false" : "true");
      if (!hasItems) {
        searchInput.removeAttribute("aria-activedescendant");
        viewport.style.height = "0px";
      } else {
        searchInput.setAttribute("aria-activedescendant", "option-" + currentItems[activeIndex].id);
        animateListHeight();
      }
    }

    function setActive(index) {
      if (!currentItems.length) return;
      activeIndex = (index + currentItems.length) % currentItems.length;
      const options = listbox.querySelectorAll('[role="option"]');
      options.forEach((option, optionIndex) => option.setAttribute("aria-selected", optionIndex === activeIndex ? "true" : "false"));
      const active = options[activeIndex];
      searchInput.setAttribute("aria-activedescendant", active ? active.id : "");
      if (active) active.scrollIntoView({ block: "nearest" });
    }

    function openPalette() {
      if (isOpen) return;
      isOpen = true;
      page = "root";
      closeToken++;
      clearTimeout(closeTimer);
      previousFocus = document.activeElement;
      overlay.hidden = false;
      searchInput.value = "";
      activeIndex = 0;
      renderPalette();
      requestAnimationFrame(() => {
        overlay.classList.add("is-open");
        searchInput.focus({ preventScroll: true });
      });
    }

    function closePalette() {
      if (!isOpen) return;
      isOpen = false;
      const token = ++closeToken;
      overlay.classList.remove("is-open");
      closeTimer = setTimeout(() => {
        if (token !== closeToken) return;
        overlay.hidden = true;
        page = "root";
        breadcrumb.classList.remove("visible");
        if (previousFocus && typeof previousFocus.focus === "function" && document.contains(previousFocus)) {
          previousFocus.focus({ preventScroll: true });
        }
      }, 220);
    }

    function goBackToRoot() {
      if (page !== "accent") return;
      page = "root";
      searchInput.value = "";
      activeIndex = 0;
      renderPalette();
      searchInput.focus({ preventScroll: true });
    }

    function rememberCommand(id) {
      recentIds = [id, ...recentIds.filter(existing => existing !== id)].slice(0, 5);
      try { localStorage.setItem(RECENTS_KEY, JSON.stringify(recentIds)); } catch (_) {}
    }

    function showToast(title) {
      const toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.dataset.toast = title;
      toast.innerHTML = '<span class="toast-check">' + getIcon("check") + '</span><span class="toast-copy"><span class="toast-label">Command completed</span><span class="toast-title"></span></span>';
      toast.querySelector(".toast-title").textContent = title;
      toasts.appendChild(toast);
      const dismiss = () => {
        if (!toast.isConnected) return;
        toast.classList.add("is-leaving");
        setTimeout(() => toast.remove(), 200);
      };
      setTimeout(dismiss, 3000);
    }

    function createNote() {
      const note = {
        id: "note-" + noteCounter++,
        title: "Untitled note",
        category: "PERSONAL",
        date: "Edited just now",
        content: ""
      };
      notes.unshift(note);
      selectNote(note.id);
      noteTitle.textContent = "Untitled note";
      contextTitle.textContent = "Untitled note";
      editor.focus({ preventScroll: true });
    }

    function executeItem(item) {
      if (!item) return;
      if (page === "accent") {
        const accent = ACCENTS.find(color => color.id === item.id);
        if (!accent) return;
        root.style.setProperty("--accent", accent.value);
        const hex = accent.value.replace("#", "");
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        root.style.setProperty("--accent-rgb", `${r}, ${g}, ${b}`);
        const command = COMMANDS.find(entry => entry.id === "change-accent");
        rememberCommand(command.id);
        closePalette();
        showToast(command.title);
        return;
      }

      if (item.page === "accent") {
        page = "accent";
        searchInput.value = "";
        activeIndex = 0;
        renderPalette();
        searchInput.focus({ preventScroll: true });
        return;
      }

      if (item.id === "toggle-dark-mode") {
        themeIsDark = !themeIsDark;
        root.dataset.theme = themeIsDark ? "dark" : "light";
      } else if (item.id === "new-note") {
        createNote();
      } else if (item.id === "toggle-sidebar") {
        document.getElementById("sidebar").classList.toggle("is-collapsed");
      } else if (item.id === "toggle-focus-mode") {
        document.querySelector(".app").classList.toggle("focus-mode");
      } else if (item.id === "go-inbox" || item.id === "go-today" || item.id === "go-archive") {
        // Navigation commands are acknowledged in this compact notes shell.
      }

      rememberCommand(item.id);
      closePalette();
      showToast(item.title);
    }

    document.getElementById("open-palette").addEventListener("click", openPalette);
    document.getElementById("palette-close").addEventListener("click", closePalette);
    document.getElementById("breadcrumb-back").addEventListener("click", goBackToRoot);
    document.getElementById("sidebar-new-note").addEventListener("click", () => {
      createNote();
      showToast("New Note");
    });

    document.getElementById("theme-button").addEventListener("click", () => {
      const command = COMMANDS.find(item => item.id === "toggle-dark-mode");
      executeItem(command);
    });

    overlay.addEventListener("mousedown", event => {
      if (event.target === overlay) closePalette();
    });

    searchInput.addEventListener("input", () => {
      activeIndex = 0;
      renderPalette();
    });

    searchInput.addEventListener("keydown", event => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive(activeIndex + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(activeIndex - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        setActive(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setActive(currentItems.length - 1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        executeItem(currentItems[activeIndex]);
      } else if (event.key === "Escape") {
        event.preventDefault();
        if (page === "accent") goBackToRoot();
        else closePalette();
      } else if (event.key === "Backspace" && page === "accent" && searchInput.value === "") {
        event.preventDefault();
        goBackToRoot();
      }
    });

    panel.addEventListener("keydown", event => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(panel.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex="0"]'))
        .filter(element => element.offsetParent !== null);
      if (!focusable.length) {
        event.preventDefault();
        searchInput.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.addEventListener("keydown", event => {
      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isOpen) closePalette();
        else openPalette();
      }
    });

    // Keep the editor content associated with the note currently being edited.
    editor.addEventListener("blur", () => {
      const note = notes.find(item => item.id === currentNoteId);
      if (note) note.content = editor.value;
    });
  </script>
</body>
</html>
```