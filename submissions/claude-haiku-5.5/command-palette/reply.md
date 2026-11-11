```html
<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Commander — Notes</title>
<style>
  :root {
    --accent: #5b5bd6;
    --accent-soft: color-mix(in srgb, var(--accent) 14%, transparent);
    --accent-ring: color-mix(in srgb, var(--accent) 38%, transparent);
    --font: "Inter", "SF Pro Text", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    --ease: cubic-bezier(.2, .8, .2, 1);
  }
  html[data-theme="light"] {
    --bg: #ecedf1;
    --sidebar: #e7e8ee;
    --surface: #ffffff;
    --surface-2: #f6f6f9;
    --text: #17171c;
    --muted: #6b6b78;
    --faint: #9d9daa;
    --border: rgba(20, 20, 40, .08);
    --border-strong: rgba(20, 20, 40, .14);
    --hover: rgba(20, 20, 40, .045);
    --shadow: 0 1px 2px rgba(15, 15, 30, .05), 0 18px 44px -14px rgba(20, 20, 50, .28);
    --overlay: rgba(18, 18, 30, .24);
    --key-bg: #ffffff;
    --key-border: #d3d3dc;
    --key-shadow: #c2c2cc;
  }
  html[data-theme="dark"] {
    --bg: #0d0d10;
    --sidebar: #141418;
    --surface: #1a1a1f;
    --surface-2: #202026;
    --text: #ededf2;
    --muted: #90909d;
    --faint: #5e5e6b;
    --border: rgba(255, 255, 255, .07);
    --border-strong: rgba(255, 255, 255, .12);
    --hover: rgba(255, 255, 255, .05);
    --shadow: 0 1px 0 rgba(255, 255, 255, .05) inset, 0 26px 64px -12px rgba(0, 0, 0, .75);
    --overlay: rgba(0, 0, 0, .55);
    --key-bg: #2a2a31;
    --key-border: #3b3b44;
    --key-shadow: #0c0c0f;
  }

  *, *::before, *::after { box-sizing: border-box; }
  [hidden] { display: none !important; }
  html, body { height: 100%; margin: 0; }
  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }
  html.theming, html.theming * {
    transition: background-color .4s ease, color .4s ease, border-color .4s ease, fill .4s ease !important;
  }
  button { font: inherit; color: inherit; }
  button:focus-visible, textarea:focus-visible {
    outline: 2px solid var(--accent-ring);
    outline-offset: 2px;
  }

  /* ---------- App shell ---------- */
  .app {
    display: grid;
    grid-template-columns: 248px minmax(0, 1fr);
    height: 100vh;
    transition: grid-template-columns .3s var(--ease);
  }
  .app.no-sidebar, .app.focus { grid-template-columns: 0 minmax(0, 1fr); }

  .sidebar {
    background: var(--sidebar);
    border-right: 1px solid var(--border);
    overflow: hidden;
    min-width: 0;
  }
  .sidebar-inner {
    width: 248px;
    height: 100%;
    padding: 16px 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .brand { display: flex; align-items: center; gap: 10px; padding: 2px 6px; }
  .logo {
    width: 26px; height: 26px; border-radius: 8px;
    background: linear-gradient(140deg, var(--accent), color-mix(in srgb, var(--accent) 55%, #000 45%));
    box-shadow: 0 4px 12px -4px var(--accent-ring), inset 0 1px 0 rgba(255,255,255,.25);
    position: relative;
  }
  .logo::after {
    content: ""; position: absolute; left: 7px; top: 7px; width: 12px; height: 12px;
    border-radius: 3px; border: 2px solid rgba(255,255,255,.9);
  }
  .brand-name { font-weight: 650; letter-spacing: -.01em; font-size: 14.5px; }
  .section-head {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0 8px; font-size: 11px; font-weight: 600; letter-spacing: .07em;
    text-transform: uppercase; color: var(--faint);
  }
  .count {
    font-size: 11px; color: var(--muted); background: var(--hover);
    padding: 1px 7px; border-radius: 999px; letter-spacing: 0;
  }
  .note-list { display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
  .note {
    display: flex; flex-direction: column; gap: 3px;
    width: 100%; padding: 9px 10px; border: 0; border-radius: 10px;
    background: transparent; text-align: left; cursor: pointer;
    transition: background-color .2s ease, box-shadow .2s ease;
  }
  .note:hover { background: var(--hover); }
  .note[aria-current="true"] {
    background: var(--surface);
    box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 0 0 1px var(--border);
  }
  .note-title { font-size: 13.5px; font-weight: 550; }
  .note-sub {
    font-size: 12px; color: var(--muted);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ghost {
    width: 100%; height: 34px; border-radius: 10px;
    border: 1px dashed var(--border-strong); background: transparent;
    color: var(--muted); cursor: pointer; font-size: 13px;
    transition: border-color .2s ease, color .2s ease, background-color .2s ease;
  }
  .ghost:hover { color: var(--accent); border-color: var(--accent-ring); background: var(--accent-soft); }
  .sidebar-foot { margin-top: auto; }

  .main { display: flex; flex-direction: column; min-width: 0; background: var(--surface); }
  .topbar {
    height: 54px; flex: none; display: flex; align-items: center; gap: 12px;
    padding: 0 18px 0 20px; border-bottom: 1px solid var(--border);
  }
  .doc-path { display: flex; gap: 8px; align-items: center; font-size: 13px; color: var(--muted); min-width: 0; }
  .doc-path #doc-path { color: var(--text); font-weight: 550; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .doc-path .sep { color: var(--faint); }
  .spacer { flex: 1; }
  #open-palette {
    display: inline-flex; align-items: center; gap: 10px;
    height: 34px; width: min(300px, 42vw); padding: 0 7px 0 11px;
    border-radius: 10px; border: 1px solid var(--border-strong);
    background: var(--surface-2); color: var(--muted); cursor: pointer;
    font-size: 13px; transition: border-color .2s ease, box-shadow .2s ease;
  }
  #open-palette:hover { border-color: var(--accent-ring); box-shadow: 0 0 0 4px var(--accent-soft); }
  #open-palette .label { flex: 1; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  #open-palette svg { flex: none; opacity: .75; }

  .editor-wrap { flex: 1; overflow-y: auto; display: flex; justify-content: center; }
  .editor-col {
    width: min(760px, 100%); padding: 52px 44px 96px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .doc-title {
    font-size: 34px; font-weight: 700; letter-spacing: -.025em;
    margin: 0 0 8px; line-height: 1.15;
  }
  #editor {
    flex: 1; width: 100%; min-height: 460px; resize: none; border: 0; outline: none;
    background: transparent; color: var(--text); font-family: var(--font);
    font-size: 16px; line-height: 1.75; padding: 0;
  }
  #editor::placeholder { color: var(--faint); }

  /* ---------- Keycaps ---------- */
  kbd {
    font-family: var(--mono); font-size: 11px; line-height: 1;
    min-width: 20px; height: 20px; padding: 0 5px;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 6px; background: var(--key-bg); color: var(--muted);
    border: 1px solid var(--key-border);
    box-shadow: 0 1px 0 var(--key-shadow);
    font-weight: 500;
  }
  .keys { display: inline-flex; gap: 4px; flex: none; }

  /* ---------- Palette ---------- */
  .palette-overlay {
    position: fixed; inset: 0; z-index: 100;
    display: flex; justify-content: center; align-items: flex-start;
    padding-top: min(14vh, 120px);
    background: var(--overlay);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }
  .palette {
    width: min(640px, calc(100vw - 32px));
    max-height: min(72vh, 580px);
    display: flex; flex-direction: column; overflow: hidden;
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: 16px;
    box-shadow: var(--shadow);
    transform-origin: 50% 0;
  }
  .palette-head {
    flex: none; display: flex; align-items: center; gap: 10px;
    height: 58px; padding: 0 16px 0 18px;
    border-bottom: 1px solid var(--border);
  }
  .palette-head > svg { flex: none; color: var(--muted); }
  #palette-input {
    flex: 1; min-width: 0; height: 100%;
    border: 0; outline: none; background: transparent;
    color: var(--text); font: inherit; font-size: 16px; letter-spacing: -.005em;
  }
  #palette-input::placeholder { color: var(--faint); }
  .crumb {
    flex: none; display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px 4px 7px; border-radius: 999px;
    background: var(--accent-soft); color: var(--accent);
    font-size: 12.5px; font-weight: 600; white-space: nowrap;
  }
  .results { overflow: hidden; flex: 1 1 auto; min-height: 0; }
  .listbox {
    position: relative; max-height: 400px; overflow-y: auto;
    padding: 6px; scrollbar-width: thin;
  }
  .hl {
    position: absolute; left: 6px; right: 6px; top: 0; height: 38px;
    border-radius: 10px; background: var(--accent-soft);
    box-shadow: inset 0 0 0 1px var(--accent-ring);
    pointer-events: none; z-index: 0;
    transition: transform .26s var(--ease), height .26s var(--ease);
  }
  .hl.no-anim { transition: none; }
  .group-label {
    padding: 12px 10px 5px; font-size: 11px; font-weight: 600;
    letter-spacing: .08em; text-transform: uppercase; color: var(--faint);
  }
  .opt {
    position: relative; z-index: 1;
    display: flex; align-items: center; gap: 10px;
    height: 38px; padding: 0 10px; border-radius: 10px;
    font-size: 14px; color: var(--text); cursor: default; user-select: none;
  }
  .opt[aria-selected="true"] .opt-title { color: var(--text); }
  .opt-title {
    flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .opt mark {
    background: transparent; color: var(--accent); font-weight: 700;
  }
  .opt-meta { font-size: 12px; color: var(--faint); flex: none; }
  .opt .keys { margin-left: 4px; }
  .swatch {
    flex: none; width: 14px; height: 14px; border-radius: 50%;
    box-shadow: 0 0 0 2px var(--surface), 0 0 0 3px var(--border-strong);
  }
  #palette-empty {
    padding: 30px 16px; text-align: center; color: var(--muted); font-size: 14px;
  }
  .palette-foot {
    flex: none; display: flex; gap: 16px; align-items: center;
    padding: 9px 14px; border-top: 1px solid var(--border);
    font-size: 12px; color: var(--faint); background: var(--surface-2);
  }
  .palette-foot span { display: inline-flex; align-items: center; gap: 6px; }

  /* ---------- Toasts ---------- */
  #toasts {
    position: fixed; right: 20px; bottom: 20px; z-index: 200;
    display: flex; flex-direction: column; gap: 10px; pointer-events: none;
  }
  .toast {
    pointer-events: auto; display: flex; align-items: center; gap: 12px;
    min-width: 240px; max-width: 360px; padding: 12px 14px 12px 12px;
    border-radius: 12px; background: var(--surface);
    border: 1px solid var(--border-strong); box-shadow: var(--shadow);
    cursor: default;
  }
  .toast-icon {
    flex: none; width: 24px; height: 24px; border-radius: 50%;
    background: var(--accent); color: #fff;
    display: grid; place-items: center; font-size: 12px; font-weight: 700;
  }
  .toast-title { font-size: 13.5px; font-weight: 600; }
  .toast-detail { font-size: 12px; color: var(--muted); margin-top: 1px; }

  /* ---------- Responsive & reduced motion ---------- */
  @media (max-width: 900px) {
    .app { grid-template-columns: 208px minmax(0, 1fr); }
    .sidebar-inner { width: 208px; }
    .editor-col { padding: 36px 26px 80px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .app, .hl, .note { transition: none; }
  }
</style>
</head>
<body>
<div class="app" id="app">
  <aside class="sidebar" aria-label="Sidebar">
    <div class="sidebar-inner">
      <div class="brand">
        <span class="logo" aria-hidden="true"></span>
        <span class="brand-name">Commander</span>
      </div>
      <div class="section-head"><span>Notes</span><span class="count" id="note-count">0</span></div>
      <nav class="note-list" id="note-list" aria-label="Notes"></nav>
      <div class="sidebar-foot">
        <button type="button" class="ghost" id="sidebar-new">+ New note</button>
      </div>
    </div>
  </aside>

  <main class="main">
    <header class="topbar">
      <div class="doc-path">
        <span>Notes</span><span class="sep">/</span><span id="doc-path">Inbox</span>
      </div>
      <div class="spacer"></div>
      <button id="open-palette" type="button" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <span class="label">Search or run a command</span>
        <span class="keys"><kbd id="mod-key">Ctrl</kbd><kbd>K</kbd></span>
      </button>
    </header>

    <div class="editor-wrap">
      <div class="editor-col">
        <h1 class="doc-title" id="doc-title">Inbox</h1>
        <textarea id="editor" spellcheck="false" aria-label="Note editor"></textarea>
      </div>
    </div>
  </main>
</div>

<div class="palette-overlay" id="palette" hidden>
  <div class="palette" id="palette-panel" role="dialog" aria-modal="true" aria-label="Command palette">
    <div class="palette-head">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <span class="crumb" id="palette-crumb" hidden>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
        <span id="palette-crumb-text"></span>
      </span>
      <input id="palette-input" type="text" role="combobox" aria-expanded="true"
             aria-controls="palette-list" aria-autocomplete="list" aria-haspopup="listbox"
             placeholder="Type a command or search…" autocomplete="off" spellcheck="false">
      <kbd>esc</kbd>
    </div>
    <div class="results" id="palette-results">
      <div class="listbox" id="palette-list" role="listbox" aria-label="Commands"></div>
      <div id="palette-empty" hidden></div>
    </div>
    <div class="palette-foot">
      <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
      <span><kbd>↵</kbd> run</span>
      <span><kbd>esc</kbd> close</span>
    </div>
  </div>
</div>

<div id="toasts" role="status" aria-live="polite"></div>

<script>
(() => {
  'use strict';

  /* ---------------- Data ---------------- */
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
    { id: "about",             title: "About Commander",         group: "Help" },
  ];

  const ACCENTS = [
    { id: "accent-indigo",  title: "Indigo",  value: "#5b5bd6" },
    { id: "accent-emerald", title: "Emerald", value: "#10b981" },
    { id: "accent-rose",    title: "Rose",    value: "#e11d48" },
    { id: "accent-amber",   title: "Amber",   value: "#f59e0b" },
    { id: "accent-sky",     title: "Sky",     value: "#0ea5e9" },
  ];

  const PAGES = {
    accent: { title: "Change Accent Color…", placeholder: "Choose an accent color…" },
  };
  const ROOT_PLACEHOLDER = "Type a command or search…";
  const GROUPS = [...new Set(COMMANDS.map(c => c.group))];
  const RECENT_KEY = "commander:recent";
  const MAX_RECENT = 5;
  const MAX_RESULTS = 50;
  const EASE = "cubic-bezier(.2, .8, .2, 1)";

  /* ---------------- Helpers ---------------- */
  const $ = sel => document.querySelector(sel);
  const root = document.documentElement;
  const app = $("#app");
  const overlay = $("#palette");
  const panel = $("#palette-panel");
  const input = $("#palette-input");
  const crumb = $("#palette-crumb");
  const crumbText = $("#palette-crumb-text");
  const resultsWrap = $("#palette-results");
  const listbox = $("#palette-list");
  const emptyEl = $("#palette-empty");
  const editor = $("#editor");
  const noteList = $("#note-list");
  const docTitle = $("#doc-title");
  const docPath = $("#doc-path");
  const toastsEl = $("#toasts");

  const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Strip transform/size keyframes when the user prefers reduced motion.
  const motion = frames => reduced() ? frames.map(({ transform, ...rest }) => rest) : frames;

  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function keycaps(shortcut) {
    return shortcut.split("+").map(p => {
      const l = p.toLowerCase();
      if (l === "mod") return isMac ? "⌘" : "Ctrl";
      if (l === "shift") return "⇧";
      if (l === "alt") return isMac ? "⌥" : "Alt";
      return p.length === 1 ? p.toUpperCase() : p;
    });
  }

  function matchShortcut(shortcut, e) {
    const parts = shortcut.split("+");
    const key = parts[parts.length - 1].toLowerCase();
    const mods = parts.slice(0, -1).map(p => p.toLowerCase());
    return (e.ctrlKey || e.metaKey) === mods.includes("mod") &&
      e.shiftKey === mods.includes("shift") &&
      e.altKey === mods.includes("alt") &&
      e.key.toLowerCase() === key;
  }

  /* ---------------- Fuzzy matching ---------------- */
  function scorePositions(text, pos) {
    let s = 0;
    for (let k = 0; k < pos.length; k++) {
      const p = pos[k];
      const prev = p > 0 ? text[p - 1] : " ";
      const boundary = p === 0 || /[\s\-_/.:()[\]'"]/.test(prev) ||
        (/[a-z]/.test(prev) && /[A-Z]/.test(text[p]));
      if (boundary) s += 12;
      if (k > 0) {
        const gap = p - pos[k - 1] - 1;
        s += gap === 0 ? 10 : -Math.min(gap, 8);
      }
    }
    if (pos[0] === 0) s += 20;
    s -= text.length * 0.08;
    return s;
  }

  // Case-insensitive subsequence match. q must already be lowercased.
  function fuzzy(q, text) {
    if (!q) return { score: 0, pos: [] };
    const t = text.toLowerCase();
    let best = null;
    for (let s = 0; s < t.length; s++) {
      if (t[s] !== q[0]) continue;
      const pos = [];
      let j = 0;
      for (let i = s; i < t.length && j < q.length; i++) {
        if (t[i] === q[j]) { pos.push(i); j++; }
      }
      if (j < q.length) break;
      let sc = scorePositions(text, pos);
      if (t.startsWith(q)) sc += 60;
      if (t === q) sc += 200;
      if (!best || sc > best.score) best = { score: sc, pos };
    }
    return best;
  }

  function highlight(text, pos) {
    if (!pos || !pos.length) return esc(text);
    const set = new Set(pos);
    let out = "", open = false;
    for (let i = 0; i < text.length; i++) {
      const on = set.has(i);
      if (on && !open) { out += "<mark>"; open = true; }
      else if (!on && open) { out += "</mark>"; open = false; }
      out += esc(text[i]);
    }
    if (open) out += "</mark>";
    return out;
  }

  function rankItems(items) {
    return items.sort((a, b) => (b.tier - a.tier) || (b.score - a.score) || (a.idx - b.idx));
  }

  /* ---------------- Recents ---------------- */
  function getRecent() {
    try {
      const v = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      return Array.isArray(v) ? v.filter(x => typeof x === "string") : [];
    } catch (_) { return []; }
  }
  function recordRecent(id) {
    const list = [id, ...getRecent().filter(x => x !== id)].slice(0, MAX_RECENT);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch (_) { /* ignore */ }
  }

  /* ---------------- Palette state ---------------- */
  const state = {
    open: false,
    page: null,
    query: "",
    items: [],
    active: 0,
    lastFocus: null,
    token: 0,
    renderId: 0,
  };

  const mkCmd = (c, pos = [], tier = 0, score = 0, idx = 0) => ({
    kind: "cmd", id: c.id, cmd: c, title: c.title, group: c.group,
    shortcut: c.shortcut || null, pos, tier, score, idx,
  });

  function buildSections() {
    const q = state.query.trim().toLowerCase();

    if (state.page === "accent") {
      const items = [];
      ACCENTS.forEach((a, idx) => {
        if (!q) { items.push({ kind: "accent", id: a.id, title: a.title, value: a.value, pos: [], tier: 1, score: 0, idx }); return; }
        const m = fuzzy(q, a.title);
        if (m) items.push({ kind: "accent", id: a.id, title: a.title, value: a.value, pos: m.pos, tier: 1, score: m.score, idx });
      });
      return [{ label: null, items: rankItems(items) }];
    }

    if (!q) {
      const sections = [];
      const recents = getRecent()
        .map(id => COMMANDS.find(c => c.id === id))
        .filter(Boolean)
        .slice(0, MAX_RECENT);
      if (recents.length) sections.push({ label: "Recent", items: recents.map(c => mkCmd(c)) });
      for (const g of GROUPS) {
        sections.push({ label: g, items: COMMANDS.filter(c => c.group === g).map(c => mkCmd(c)) });
      }
      return sections;
    }

    const scored = [];
    COMMANDS.forEach((c, idx) => {
      const t = fuzzy(q, c.title);
      if (t) { scored.push(mkCmd(c, t.pos, 1, t.score, idx)); return; }
      let best = null;
      for (const kw of c.keywords || []) {
        const m = fuzzy(q, kw);
        if (m && (!best || m.score > best.score)) best = m;
      }
      if (best) scored.push(mkCmd(c, [], 0, best.score * 0.5, idx));
    });
    return [{ label: null, items: rankItems(scored).slice(0, MAX_RESULTS) }];
  }

  function optionHTML(it, k, showMeta) {
    const id = `opt-${state.renderId}-${k}`;
    let lead = "", meta = "", keys = "";
    if (it.kind === "accent") {
      lead = `<span class="swatch" style="background:${esc(it.value)}"></span>`;
    } else {
      if (showMeta) meta = `<span class="opt-meta">${esc(it.group)}</span>`;
      if (it.shortcut) {
        keys = `<span class="keys">${keycaps(it.shortcut).map(x => `<kbd>${esc(x)}</kbd>`).join("")}</span>`;
      }
    }
    return `<div class="opt" role="option" id="${id}" data-index="${k}" data-command="${esc(it.id)}" aria-selected="false">` +
      `${lead}<span class="opt-title">${highlight(it.title, it.pos)}</span>${meta}${keys}</div>`;
  }

  function moveHighlight(el, instant) {
    const hl = listbox.querySelector(".hl");
    if (!hl || !el) return;
    hl.hidden = false;
    if (instant) hl.classList.add("no-anim");
    hl.style.height = el.offsetHeight + "px";
    hl.style.transform = `translateY(${el.offsetTop}px)`;
    if (instant) {
      void hl.offsetWidth;
      hl.classList.remove("no-anim");
    }
  }

  function ensureVisible(el) {
    if (state.active === 0) { listbox.scrollTop = 0; return; }
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < listbox.scrollTop) {
      listbox.scrollTop = top - 6;
    } else if (bottom > listbox.scrollTop + listbox.clientHeight) {
      listbox.scrollTop = bottom - listbox.clientHeight + 6;
    }
  }

  function setActive(i, scroll, instant) {
    const n = state.items.length;
    const hl = listbox.querySelector(".hl");
    if (!n) {
      state.active = 0;
      input.removeAttribute("aria-activedescendant");
      if (hl) hl.hidden = true;
      return;
    }
    state.active = i;
    const opts = listbox.querySelectorAll('[role="option"]');
    opts.forEach((el, k) => el.setAttribute("aria-selected", String(k === i)));
    const el = opts[i];
    if (!el) return;
    input.setAttribute("aria-activedescendant", el.id);
    moveHighlight(el, instant);
    if (scroll) ensureVisible(el);
  }

  function move(delta) {
    const n = state.items.length;
    if (!n) return;
    setActive((state.active + delta + n) % n, true, false);
  }

  function buildResults() {
    const sections = buildSections();
    state.items = sections.flatMap(s => s.items);
    state.renderId++;
    const q = state.query.trim();
    let html = `<div class="hl no-anim" aria-hidden="true" hidden></div>`;
    let k = 0;
    for (const sec of sections) {
      if (sec.label) html += `<div class="group-label" role="presentation">${esc(sec.label)}</div>`;
      for (const it of sec.items) {
        html += optionHTML(it, k, !!q);
        k++;
      }
    }
    listbox.innerHTML = html;
    listbox.scrollTop = 0;
    emptyEl.hidden = state.items.length > 0;
    if (state.items.length === 0) {
      emptyEl.textContent = q ? `No results for “${q}”` : "Nothing here yet";
    }
    setActive(0, false, true);
  }

  function renderResults(animated) {
    const wrap = resultsWrap;
    if (!animated) {
      wrap.getAnimations().forEach(a => a.cancel());
      buildResults();
      return;
    }
    wrap.getAnimations().forEach(a => a.cancel());
    const from = wrap.getBoundingClientRect().height;
    buildResults();
    const to = wrap.getBoundingClientRect().height;
    if (reduced() || from === 0 || Math.abs(to - from) < 2) return;
    wrap.animate([{ height: from + "px" }, { height: to + "px" }], { duration: 220, easing: EASE });
  }

  function setPage(page) {
    state.page = page;
    state.query = "";
    input.value = "";
    if (page) {
      crumbText.textContent = PAGES[page].title;
      crumb.hidden = false;
      input.placeholder = PAGES[page].placeholder;
    } else {
      crumb.hidden = true;
      input.placeholder = ROOT_PLACEHOLDER;
    }
    renderResults(true);
    input.focus({ preventScroll: true });
  }

  function openPalette() {
    if (state.open) return;
    state.open = true;
    state.token++;
    const active = document.activeElement;
    state.lastFocus = active && active !== document.body ? active : null;

    overlay.getAnimations({ subtree: true }).forEach(a => a.cancel());
    overlay.hidden = false;
    state.page = null;
    state.query = "";
    input.value = "";
    input.placeholder = ROOT_PLACEHOLDER;
    crumb.hidden = true;
    renderResults(false);

    overlay.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
    panel.animate(
      motion([
        { opacity: 0, transform: "translateY(-8px) scale(.96)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ]),
      { duration: 200, easing: EASE }
    );
    input.focus({ preventScroll: true });
  }

  function closePalette(restoreFocus = true) {
    if (!state.open) return;
    state.open = false;
    const token = ++state.token;
    overlay.getAnimations({ subtree: true }).forEach(a => a.cancel());
    const hide = () => {
      if (token === state.token && !state.open) overlay.hidden = true;
    };
    const pa = panel.animate(
      motion([
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(-6px) scale(.97)" },
      ]),
      { duration: 140, easing: "ease-in", fill: "forwards" }
    );
    overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-in", fill: "forwards" });
    pa.onfinish = hide;
    setTimeout(hide, 220);

    state.page = null;
    const back = state.lastFocus;
    state.lastFocus = null;
    if (restoreFocus && back && back.isConnected && typeof back.focus === "function") {
      back.focus({ preventScroll: true });
    }
  }

  /* ---------------- Theme, accent, toasts ---------------- */
  let themingTimer = null;
  function flashTheming() {
    root.classList.add("theming");
    clearTimeout(themingTimer);
    themingTimer = setTimeout(() => root.classList.remove("theming"), 520);
  }

  function toggleTheme() {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    flashTheming();
    root.dataset.theme = next;
  }

  function applyAccent(value) {
    flashTheming();
    root.style.setProperty("--accent", value);
  }

  function toast(title, detail) {
    const el = document.createElement("div");
    el.className = "toast";
    el.dataset.toast = title;
    el.innerHTML =
      '<span class="toast-icon" aria-hidden="true">✓</span>' +
      '<div class="toast-body"><div class="toast-title"></div>' +
      (detail ? '<div class="toast-detail"></div>' : "") + "</div>";
    el.querySelector(".toast-title").textContent = title;
    if (detail) el.querySelector(".toast-detail").textContent = detail;
    toastsEl.appendChild(el);

    el.animate(
      motion([
        { opacity: 0, transform: "translateX(28px) scale(.97)" },
        { opacity: 1, transform: "translateX(0) scale(1)" },
      ]),
      { duration: 280, easing: EASE }
    );

    let dismissed = false;
    const remove = () => el.remove();
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      const a = el.animate(
        motion([
          { opacity: 1, transform: "translateX(0)" },
          { opacity: 0, transform: "translateX(28px)" },
        ]),
        { duration: 220, easing: "ease-in", fill: "forwards" }
      );
      a.onfinish = remove;
      setTimeout(remove, 320);
    };
    setTimeout(dismiss, 3000);
    el.addEventListener("click", dismiss);
  }

  /* ---------------- Notes & editor ---------------- */
  const notes = [
    { id: "inbox", title: "Inbox", body: "Welcome to Commander.\n\nPress Ctrl K (⌘K on macOS) to open the command palette from anywhere.\n\nTry typing “tdm” to find Toggle Dark Mode." },
    { id: "today", title: "Today", body: "- [ ] Review onboarding copy\n- [x] Ship release 2.4\n- [ ] Plan user interviews" },
    { id: "roadmap", title: "Q3 Roadmap", body: "Focus on editor performance, offline sync and a calmer default theme." },
    { id: "ideas", title: "Ideas", body: "A reading mode that hides the chrome.\nKeyboard-first table views." },
    { id: "reading", title: "Reading list", body: "Designing Data-Intensive Applications\nThe Pragmatic Programmer" },
  ];
  let activeId = "inbox";
  let zoom = 1;

  const firstLine = s => (s.split("\n").find(l => l.trim()) || "").slice(0, 60);
  const currentNote = () => notes.find(n => n.id === activeId);

  function renderSidebar() {
    noteList.innerHTML = notes.map(n =>
      `<button class="note" type="button" data-note="${esc(n.id)}" aria-current="${n.id === activeId}">` +
      `<span class="note-title">${esc(n.title)}</span>` +
      `<span class="note-sub">${esc(firstLine(n.body) || "Empty note")}</span></button>`
    ).join("");
    $("#note-count").textContent = String(notes.length);
  }

  function markActiveNote() {
    noteList.querySelectorAll("[data-note]").forEach(b =>
      b.setAttribute("aria-current", String(b.dataset.note === activeId)));
  }

  function selectNote(id) {
    const n = notes.find(x => x.id === id);
    if (!n) return;
    activeId = id;
    editor.value = n.body;
    docTitle.textContent = n.title;
    docPath.textContent = n.title;
    markActiveNote();
  }

  function syncNote() {
    const n = currentNote();
    if (!n) return;
    n.body = editor.value;
    const sub = noteList.querySelector(`[data-note="${CSS.escape(activeId)}"] .note-sub`);
    if (sub) sub.textContent = firstLine(n.body) || "Empty note";
  }

  function createNote() {
    const id = "note-" + Date.now().toString(36);
    const n = { id, title: `Untitled ${notes.length + 1}`, body: "" };
    notes.push(n);
    renderSidebar();
    selectNote(id);
    const btn = noteList.querySelector(`[data-note="${CSS.escape(id)}"]`);
    if (btn) {
      btn.animate(
        motion([
          { opacity: 0, transform: "translateY(-6px)" },
          { opacity: 1, transform: "translateY(0)" },
        ]),
        { duration: 240, easing: EASE }
      );
    }
    editor.focus();
  }

  function insertText(text) {
    const s = editor.selectionStart, e = editor.selectionEnd;
    editor.setRangeText(text, s, e, "end");
    syncNote();
    editor.focus();
  }

  function wrapSelection(before, after) {
    const s = editor.selectionStart, e = editor.selectionEnd;
    const sel = editor.value.slice(s, e) || "text";
    editor.setRangeText(before + sel + after, s, e, "end");
    syncNote();
    editor.focus();
  }

  function sortLines(dir) {
    const lines = editor.value.split("\n");
    lines.sort((a, b) => a.localeCompare(b) * dir);
    editor.value = lines.join("\n");
    syncNote();
  }

  function setZoom(z) {
    zoom = Math.min(1.6, Math.max(0.8, Math.round(z * 10) / 10));
    editor.style.fontSize = (16 * zoom) + "px";
  }

  /* ---------------- Commands ---------------- */
  function runCommand(cmd) {
    switch (cmd.id) {
      case "toggle-dark-mode": toggleTheme(); break;
      case "new-note": createNote(); break;
      case "go-inbox": selectNote("inbox"); break;
      case "go-today": selectNote("today"); break;
      case "toggle-sidebar": app.classList.toggle("no-sidebar"); break;
      case "toggle-focus-mode": app.classList.toggle("focus"); break;
      case "zoom-in": setZoom(zoom + 0.1); break;
      case "zoom-out": setZoom(zoom - 0.1); break;
      case "zoom-reset": setZoom(1); break;
      case "bold": wrapSelection("**", "**"); break;
      case "italic": wrapSelection("_", "_"); break;
      case "insert-checklist": insertText("\n- [ ] "); break;
      case "insert-code": insertText("\n```\n\n```\n"); break;
      case "sort-asc": sortLines(1); break;
      case "sort-desc": sortLines(-1); break;
      default: break;
    }
    toast(cmd.title);
  }

  function execute(item) {
    if (!item) return;
    if (item.kind === "accent") {
      applyAccent(item.value);
      recordRecent("change-accent");
      closePalette();
      toast("Change Accent Color…", item.title);
      return;
    }
    const cmd = item.cmd;
    if (cmd.page) {
      setPage(cmd.page);
      return;
    }
    recordRecent(cmd.id);
    closePalette();
    runCommand(cmd);
  }

  /* ---------------- Event wiring ---------------- */
  $("#open-palette").addEventListener("click", () => {
    if (state.open) closePalette(); else openPalette();
  });

  $("#sidebar-new").addEventListener("click", createNote);

  noteList.addEventListener("click", e => {
    const b = e.target.closest("[data-note]");
    if (b) selectNote(b.dataset.note);
  });

  editor.addEventListener("input", syncNote);

  // Global shortcuts: Ctrl/Cmd+K toggles the palette from anywhere.
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (state.open) closePalette(); else openPalette();
      return;
    }
    if (state.open) return;
    for (const c of COMMANDS) {
      if (c.shortcut && !c.page && matchShortcut(c.shortcut, e)) {
        e.preventDefault();
        runCommand(c);
        return;
      }
    }
  });

  // Focus trap: keep focus inside the open palette.
  document.addEventListener("focusin", e => {
    if (state.open && !panel.contains(e.target)) {
      input.focus({ preventScroll: true });
    }
  });

  // Clicking the backdrop (outside the panel) closes the palette.
  overlay.addEventListener("mousedown", e => {
    if (e.target === overlay) closePalette();
  });

  input.addEventListener("input", () => {
    state.query = input.value;
    renderResults(true);
  });

  input.addEventListener("keydown", e => {
    if (e.isComposing) return;
    const n = state.items.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault(); move(1); break;
      case "ArrowUp":
        e.preventDefault(); move(-1); break;
      case "Home":
        e.preventDefault(); if (n) setActive(0, true, false); break;
      case "End":
        e.preventDefault(); if (n) setActive(n - 1, true, false); break;
      case "Enter":
        e.preventDefault(); execute(state.items[state.active]); break;
      case "Escape":
        e.preventDefault();
        if (state.page) setPage(null); else closePalette();
        break;
      case "Backspace":
        if (state.page && input.value === "") { e.preventDefault(); setPage(null); }
        break;
      case "Tab":
        e.preventDefault(); break;
      default: break;
    }
  });

  listbox.addEventListener("mousedown", e => e.preventDefault());
  listbox.addEventListener("pointermove", e => {
    const el = e.target.closest('[role="option"]');
    if (!el) return;
    const k = Number(el.dataset.index);
    if (k !== state.active) setActive(k, false, false);
  });
  listbox.addEventListener("click", e => {
    const el = e.target.closest('[role="option"]');
    if (!el) return;
    execute(state.items[Number(el.dataset.index)]);
  });

  /* ---------------- Init ---------------- */
  $("#mod-key").textContent = isMac ? "⌘" : "Ctrl";
  renderSidebar();
  selectNote("inbox");
  input.placeholder = ROOT_PLACEHOLDER;
})();
</script>
</body>
</html>
```