```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Commander</title>
<style>
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: var(--bg); color: var(--text); font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
  :root {
    --bg: #f6f6f4;
    --surface: #ffffff;
    --surface-2: #f1f1ed;
    --text: #1d1d20;
    --text-2: #71717a;
    --border: #e6e6e2;
    --accent: #5b5bd6;
    --accent-soft: rgba(91, 91, 214, 0.12);
    --option-active: rgba(91, 91, 214, 0.10);
    --sidebar-bg: #fafaf8;
    --editor-bg: #ffffff;
    --hover: rgba(20, 20, 30, 0.05);
    --shadow-lg: 0 30px 80px rgba(20, 20, 40, 0.25), 0 6px 24px rgba(20, 20, 40, 0.1);
    --shadow-sm: 0 1px 2px rgba(20, 20, 40, 0.06), 0 6px 18px rgba(20, 20, 40, 0.07);
  }
  [data-theme="dark"] {
    --bg: #0e0e10;
    --surface: #18181b;
    --surface-2: #222226;
    --text: #f2f2f5;
    --text-2: #9b9ba3;
    --border: #2a2a2f;
    --accent: #6d6df0;
    --accent-soft: rgba(109, 109, 240, 0.16);
    --option-active: rgba(109, 109, 240, 0.18);
    --sidebar-bg: #131315;
    --editor-bg: #111113;
    --hover: rgba(255, 255, 255, 0.055);
    --shadow-lg: 0 30px 80px rgba(0, 0, 0, 0.6), 0 6px 24px rgba(0, 0, 0, 0.45);
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4), 0 6px 18px rgba(0, 0, 0, 0.4);
  }
  html, body { height: 100%; }
  body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: var(--bg); color: var(--text); font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
  ::selection { background: var(--accent-soft); }
  button { font-family: inherit; }

  /* ---------- App shell ---------- */
  .app { display: flex; height: 100vh; height: 100dvh; overflow: hidden; }
  .sidebar { width: 272px; flex: 0 0 auto; background: var(--sidebar-bg); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 18px 14px 14px; gap: 6px; transition: width 200ms ease, padding 200ms ease, background 300ms ease; }
  .sidebar.collapsed { width: 0; min-width: 0; padding: 0; border-right: none; overflow: hidden; }
  .sidebar-brand { display: flex; align-items: center; gap: 10px; padding: 0 6px 14px; }
  .brand-mark { width: 30px; height: 30px; border-radius: 9px; background: linear-gradient(135deg, #6d6df0, #8b5cf6); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; box-shadow: 0 6px 16px rgba(109, 109, 240, 0.35); }
  .brand-name { font-weight: 700; font-size: 15px; letter-spacing: -0.01em; flex: 1; }
  .icon-btn { border: none; background: transparent; color: var(--text-2); width: 30px; height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: background 150ms ease, color 150ms ease; }
  .icon-btn:hover { background: var(--hover); color: var(--text); }
  .sidebar-section { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-2); padding: 8px 10px 4px; }
  .note-list { list-style: none; margin: 0; padding: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
  .note-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; cursor: pointer; color: var(--text); transition: background 120ms ease; }
  .note-item:hover { background: var(--hover); }
  .note-item.active { background: var(--accent-soft); }
  .note-item .note-title { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13.5px; font-weight: 550; }
  .note-item .note-date { font-size: 11px; color: var(--text-2); }
  .sidebar-footer { margin-top: auto; padding-top: 10px; }
  .open-palette-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 12px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 13px; font-weight: 650; cursor: pointer; box-shadow: var(--shadow-sm); transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease; }
  .open-palette-btn:hover { border-color: var(--accent); box-shadow: 0 8px 24px rgba(91, 91, 214, 0.18); transform: translateY(-1px); }
  .open-palette-left { display: flex; align-items: center; gap: 10px; }
  .kbd-row { display: inline-flex; align-items: center; gap: 3px; }

  .editor-pane { flex: 1; display: flex; flex-direction: column; min-width: 0; background: var(--editor-bg); }
  .editor-topbar { display: flex; align-items: center; gap: 12px; padding: 14px 28px; border-bottom: 1px solid var(--border); }
  .editor-topbar .crumb { font-size: 12px; color: var(--text-2); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
  .editor-topbar .crumb b { color: var(--text); font-weight: 700; text-transform: none; letter-spacing: 0; }
  .editor-scroll { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
  textarea.editor { flex: 1; width: 100%; border: none; outline: none; resize: none; background: transparent; color: var(--text); font-family: inherit; font-size: 15px; line-height: 1.75; padding: 34px 44px 70px; }

  /* ---------- Palette ---------- */
  .palette-overlay { position: fixed; inset: 0; display: flex; align-items: flex-start; justify-content: center; padding: 15vh 16px 16px; background: rgba(12, 12, 16, 0.42); z-index: 90; }
  .palette { width: min(600px, calc(100vw - 32px)); background: var(--surface); border: 1px solid var(--border); border-radius: 18px; box-shadow: var(--shadow-lg); display: flex; flex-direction: column; overflow: hidden; }
  .palette-head { display: flex; align-items: center; gap: 10px; padding: 12px 12px 10px; border-bottom: 1px solid var(--border); }
  .palette-crumb { font-size: 12.5px; font-weight: 650; color: var(--accent); background: var(--accent-soft); padding: 5px 12px; border-radius: 999px; }
  .palette-input { flex: 1; border: none; outline: none; background: transparent; color: var(--text); font-size: 16px; padding: 8px 6px; font-family: inherit; min-width: 0; }
  .palette-input::placeholder { color: var(--text-2); }
  .palette-clear { border: none; background: var(--surface-2); color: var(--text-2); width: 26px; height: 26px; border-radius: 8px; cursor: pointer; font-size: 12px; line-height: 1; }
  .palette-clear:hover { color: var(--text); }
  .palette-close { border: none; background: var(--surface-2); color: var(--text-2); width: 26px; height: 26px; border-radius: 8px; cursor: pointer; font-size: 12px; line-height: 1; }
  .palette-close:hover { color: var(--text); background: var(--hover); }
  .palette-body { padding: 8px; position: relative; }
  .palette-listbox { max-height: 320px; overflow-y: auto; overflow-x: hidden; }
  .palette-listbox::-webkit-scrollbar, .note-list::-webkit-scrollbar, .editor-scroll::-webkit-scrollbar { width: 10px; }
  .palette-listbox::-webkit-scrollbar-thumb, .note-list::-webkit-scrollbar-thumb, .editor-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 8px; border: 3px solid transparent; background-clip: content-box; }
  .palette-group-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-2); padding: 10px 12px 5px; }
  .palette-option { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; font-size: 13.5px; color: var(--text); cursor: default; }
  .palette-option.active { background: var(--option-active); }
  .palette-option .opt-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .palette-option mark { background: transparent; color: var(--accent); font-weight: 800; }
  .opt-key { margin-left: auto; display: inline-flex; align-items: center; flex: 0 0 auto; }
  .keycap { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 6px; background: var(--surface-2); border: 1px solid var(--border); border-bottom-width: 2px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10.5px; font-weight: 700; color: var(--text-2); box-shadow: 0 1px 0 rgba(0,0,0,0.08); }
  .keycap-sep { color: var(--text-2); margin: 0 3px; font-size: 10px; font-weight: 700; }

  .palette-empty { padding: 34px 20px; text-align: center; color: var(--text-2); font-size: 13px; }

  /* ---------- Toasts ---------- */
  .toast-region { position: fixed; bottom: 22px; right: 22px; display: flex; flex-direction: column; gap: 8px; z-index: 140; }
  .toast { display: flex; align-items: center; gap: 8px; background: #1b1b1f; color: #f4f4f6; padding: 11px 16px; border-radius: 12px; font-size: 13px; box-shadow: 0 14px 38px rgba(0,0,0,0.38); border: 1px solid rgba(255,255,255,0.07); max-width: 360px; animation: toast-in 240ms cubic-bezier(0.2, 0.9, 0.3, 1); }
  @keyframes toast-in { from { opacity: 0; transform: translateY(16px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }

  /* ---------- Motion helpers ---------- */
  @keyframes pal-in { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes pal-out { from { opacity: 1; transform: scale(1) translateY(0); } to { opacity: 0; transform: scale(0.96) translateY(8px); } }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
  }

  /* ---------- Misc ---------- */
  [hidden] { display: none !important; }
  .editor-scroll::-webkit-scrollbar { width: 10px; }
  button:focus-visible, textarea:focus-visible, input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
</style>
</head>
<body>
  <div class="app">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="brand-mark">C</div>
        <div class="brand-name">Commander</div>
        <button class="icon-btn" id="theme-toggle" type="button" aria-label="Toggle dark mode" title="Toggle dark mode">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        </button>
      </div>
      <div class="sidebar-section">Notes</div>
      <ul class="note-list" id="note-list">
        <li class="note-item" data-note="welcome"><span class="note-title">Welcome to Commander</span><span class="note-date">Today</span></li>
        <li class="note-item" data-note="groceries"><span class="note-title">Groceries</span><span class="note-date">Yesterday</span></li>
        <li class="note-item" data-note="reading"><span class="note-title">Reading List</span><span class="note-date">Mon</span></li>
        <li class="note-item" data-note="ideas"><span class="note-title">Ideas</span><span class="note-date">Dec 28</span></li>
      </ul>
      <div class="sidebar-footer">
        <button id="open-palette" class="open-palette-btn" type="button">
          <span class="open-palette-left">
            <span class="kbd-row"><span class="keycap">⌘</span><span class="keycap">K</span></span>
            <span>Command</span>
          </span>
        </button>
      </div>
    </aside>
    <main class="editor-pane">
      <div class="editor-topbar">
        <div class="crumb">Notes <b>/</b> <b>Personal</b></div>
      </div>
      <div class="editor-scroll">
        <textarea id="editor" class="editor" spellcheck="false" placeholder="Start writing…"># Welcome to Commander

This is your quiet corner of the app. Everything you write here is yours — and everything you need to run the app lives behind one shortcut.

- Fuzzy search over commands and notes
- Themes that feel like night and day
- Accents that change the whole mood
- Motion that respects your system

Select some text and press <b>⌘B</b> or <b>⌘I</b> to style it.</textarea>
      </div>
    </main>
  </div>

  <div class="palette-overlay" id="palette-overlay">
    <div class="palette" id="palette" role="dialog" aria-modal="true" aria-label="Command palette">
      <div class="palette-head">
        <div class="palette-crumb" id="palette-crumb" hidden>Accent</div>
        <input class="palette-input" id="palette-input" type="text" role="combobox" aria-expanded="false" aria-controls="palette-listbox" aria-activedescendant="" placeholder="Type a command or search…">
        <button class="palette-clear" id="palette-clear" type="button" aria-label="Clear query">✕</button>
        <button class="palette-close" id="palette-close" type="button" aria-label="Close palette">✕</button>
      </div>
      <div class="palette-body">
        <div class="palette-listbox" id="palette-listbox" role="listbox" aria-multiselectable="false"></div>
        <div class="palette-empty" id="palette-empty" hidden>No matching commands</div>
      </div>
    </div>
  </div>

  <div class="toast-region" id="toast-region" role="status" aria-live="polite"></div>

<script>
(function () {
  'use strict';

  var COMMANDS = [
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

  var ACCENTS = [
    { id: "accent-indigo",  title: "Indigo",  value: "#5b5bd6" },
    { id: "accent-emerald", title: "Emerald", value: "#10b981" },
    { id: "accent-rose",    title: "Rose",    value: "#e11d48" },
    { id: "accent-amber",   title: "Amber",   value: "#f59e0b" },
    { id: "accent-sky",     title: "Sky",     value: "#0ea5e9" },
  ];

  var isMac = (navigator.platform || "").toUpperCase().indexOf("MAC") > -1;
  var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  var state = {
    open: false,
    closing: false,
    closeTimer: 0,
    page: null,
    query: "",
    flat: [],
    groups: [],
    activeIndex: -1,
    prevActiveEl: null,
    returnFocus: null,
    recents: [],
  };

  var PALETTE = document.getElementById("palette");
  var OVERLAY = document.getElementById("palette-overlay");
  var INPUT = document.getElementById("palette-input");
  var LISTBOX = document.getElementById("palette-listbox");
  var EMPTY = document.getElementById("palette-empty");
  var CRUMB = document.getElementById("palette-crumb");
  var TOAST_REGION = document.getElementById("toast-region");
  var OPEN_BTN = document.getElementById("open-palette");
  var CLOSE_BTN = document.getElementById("palette-close");
  var CLEAR_BTN = document.getElementById("palette-clear");
  var THEME_TOGGLE = document.getElementById("theme-toggle");
  var SIDEBAR = document.getElementById("sidebar");
  var EDITOR = document.getElementById("editor");
  var NOTE_LIST = document.getElementById("note-list");

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c;
    });
  }

  function fuzzyScore(query, text) {
    var q = String(query == null ? "" : query).trim().toLowerCase();
    var t = String(text == null ? "" : text).toLowerCase();
    if (!q) return null;
    var positions = [];
    var ti = 0;
    for (var i = 0; i < q.length; i++) {
      var ch = q[i];
      var found = -1;
      for (var j = ti; j < t.length; j++) {
        if (t[j] === ch) { found = j; break; }
      }
      if (found === -1) return null;
      positions.push(found);
      ti = found + 1;
    }
    var score = 0;
    if (positions[0] === 0) score += 50;
    var p0 = positions[0];
    if (p0 === 0 || t.charAt(p0 - 1) === " ") score += 25;
    var contiguous = true;
    for (var c = 1; c < positions.length; c++) {
      if (positions[c] !== positions[c - 1] + 1) { contiguous = false; break; }
    }
    if (contiguous) score += 15;
    if (q === t) score += 100;
    score += (80 - t.length) * 0.5;
    return { score: score, positions: positions };
  }

  function cmdScore(cmd, query) {
    var q = String(query == null ? "" : query).trim().toLowerCase();
    if (!q) return null;
    var ts = fuzzyScore(q, cmd.title);
    if (ts) return { score: ts.score, positions: ts.positions };
    var best = null;
    var kws = cmd.keywords || [];
    for (var i = 0; i < kws.length; i++) {
      var s = fuzzyScore(q, kws[i]);
      if (s && (!best || s.score > best.score)) best = s;
    }
    if (best) return { score: best.score * 0.7, positions: null };
    return null;
  }

  function markedTitle(title, positions) {
    if (!positions) return escapeHtml(title);
    var out = "";
    var j = 0;
    for (var i = 0; i < title.length; i++) {
      if (j < positions.length && positions[j] === i) {
        out += '<mark>' + escapeHtml(title[i]) + '</mark>';
        j++;
      } else {
        out += escapeHtml(title[i]);
      }
    }
    return out;
  }

  function keycapHtml(shortcut) {
    var parts = String(shortcut || "").split("+").map(function (p) { return p.trim(); }).filter(function (p) { return p.length > 0; });
    var caps = [];
    for (var i = 0; i < parts.length; i++) {
      var label = parts[i] === "Mod" ? (isMac ? "⌘" : "Ctrl") : parts[i];
      var clean = label.replace(/[\s_]/g, "");
      caps.push('<span class="keycap">' + escapeHtml(clean) + '</span>');
    }
    var html = "";
    for (var k = 0; k < caps.length; k++) {
      if (k > 0) html += '<span class="keycap-sep">+</span>';
      html += caps[k];
    }
    return html;
  }

  function buildGroups() {
    var q = state.query;
    var groups = [];
    var push = function (label, options) {
      if (options.length > 0) groups.push({ label: label, options: options });
    };
    if (state.page === "accent") {
      var scored = [];
      for (var i = 0; i < ACCENTS.length; i++) {
        var s = fuzzyScore(q, ACCENTS[i].title);
        if (s) scored.push({ a: ACCENTS[i], s: s });
      }
      scored.sort(function (x, y) { return y.s.score - x.s.score; });
      var opts = [];
      for (var j = 0; j < Math.min(scored.length, 50); j++) {
        opts.push({ id: scored[j].a.id, commandId: scored[j].a.id, title: scored[j].a.title, group: "Accent", score: scored[j].s.score, positions: scored[j].s.positions, shortcut: null });
      }
      push(null, opts);
    } else if (String(q).trim() === "") {
      var recents = [];
      for (var r = 0; r < state.recents.length; r++) {
        var rc = null;
        for (var rc2 = 0; rc2 < COMMANDS.length; rc2++) { if (COMMANDS[rc2].id === state.recents[r]) { rc = COMMANDS[rc2]; break; } }
        if (rc) recents.push({ id: rc.id, commandId: rc.id, title: rc.title, group: rc.group, score: 999999, positions: null, shortcut: rc.shortcut });
      }
      push("Recent", recents);
      var byGroup = [];
      var seen = {};
      for (var g = 0; g < COMMANDS.length; g++) {
        if (!Object.prototype.hasOwnProperty.call(seen, COMMANDS[g].group)) { seen[COMMANDS[g].group] = true; byGroup.push(COMMANDS[g].group); }
      }
      var groupsMap = {};
      for (var gm = 0; gm < COMMANDS.length; gm++) {
        var cg = COMMANDS[gm].group;
        if (!groupsMap[cg]) groupsMap[cg] = [];
        groupsMap[cg].push(COMMANDS[gm]);
      }
      for (var gb = 0; gb < byGroup.length; gb++) {
        var gname = byGroup[gb];
        var gopts = [];
        var gl = groupsMap[gname];
        for (var gi = 0; gi < gl.length; gi++) {
          gopts.push({ id: gl[gi].id, commandId: gl[gi].id, title: gl[gi].title, group: gl[gi].group, score: 999999, positions: null, shortcut: gl[gi].shortcut });
        }
        push(gname, gopts);
      }
    } else {
      var scoredCmds = [];
      for (var sc = 0; sc < COMMANDS.length; sc++) {
        var c = COMMANDS[sc];
        var cs = cmdScore(c, q);
        if (cs) scoredCmds.push({ c: c, s: cs });
      }
      scoredCmds.sort(function (x, y) { return y.s.score - x.s.score; });
      var cops = [];
      for (var sci = 0; sci < Math.min(scoredCmds.length, 50); sci++) {
        cops.push({ id: scoredCmds[sci].c.id, commandId: scoredCmds[sci].c.id, title: scoredCmds[sci].c.title, group: scoredCmds[sci].c.group, score: scoredCmds[sci].s.score, positions: scoredCmds[sci].s.positions, shortcut: scoredCmds[sci].c.shortcut });
      }
      push(null, cops);
    }
    return groups;
  }

  function animateListHeight() {
    var list = LISTBOX;
    if (!list) return;
    var newH = list.scrollHeight;
    var prevH = parseFloat(list.style.height);
    list.style.height = newH + "px";
    if (!reducedMotion && !isNaN(prevH) && prevH > 2 && Math.abs(prevH - newH) > 1) {
      try { list.animate([{ height: prevH + "px" }, { height: newH + "px" }], { duration: 150, easing: "ease-out" }); } catch (err) {}
    }
  }

  function renderPalette() {
    LISTBOX.innerHTML = "";
    state.flat = [];
    var groups = buildGroups();
    var allRefs = [];
    for (var gi = 0; gi < groups.length; gi++) {
      var g = groups[gi];
      var groupEl = null;
      if (g.label !== null) {
        groupEl = document.createElement("div");
        groupEl.setAttribute("role", "group");
        groupEl.setAttribute("aria-label", g.label);
        var h = document.createElement("div");
        h.className = "palette-group-label";
        h.textContent = g.label;
        groupEl.appendChild(h);
        LISTBOX.appendChild(groupEl);
      }
      var parent = groupEl || LISTBOX;
      for (var oi = 0; oi < g.options.length; oi++) {
        var o = g.options[oi];
        var el = document.createElement("div");
        el.id = "palette-option-" + o.id;
        el.setAttribute("role", "option");
        el.setAttribute("data-command", o.commandId);
        el.setAttribute("aria-selected", "false");
        el.className = "palette-option";
        var textHtml = o.positions ? markedTitle(o.title, o.positions) : escapeHtml(o.title);
        el.innerHTML = '<span class="opt-text">' + textHtml + "</span>" + (o.shortcut ? '<span class="opt-key">' + keycapHtml(o.shortcut) + "</span>" : "");
        parent.appendChild(el);
        allRefs.push({ el: el, o: o });
      }
    }
    state.flat = allRefs;
    var hasResults = allRefs.length > 0;
    if (EMPTY) EMPTY.hidden = hasResults;
    if (LISTBOX) LISTBOX.style.display = hasResults ? "" : "none";
    if (hasResults) animateListHeight();
  }

  function setActive(index) {
    var items = state.flat;
    if (!items || items.length === 0) {
      state.activeIndex = -1;
      if (INPUT) INPUT.setAttribute("aria-activedescendant", "");
      if (EMPTY) EMPTY.hidden = false;
      return;
    }
    var i = index;
    if (i < 0) i = 0;
    if (i > items.length - 1) i = items.length - 1;
    state.activeIndex = i;
    var target = items[i];
    state.activeEl = target.el;
    for (var k = 0; k < items.length; k++) {
      items[k].el.setAttribute("aria-selected", k === i ? "true" : "false");
    }
    if (INPUT) INPUT.setAttribute("aria-activedescendant", target.el.id);
    if (target.el.scrollIntoView) target.el.scrollIntoView({ block: "nearest" });
    if (state.prevActiveEl && state.prevActiveEl !== target.el) state.prevActiveEl.classList.remove("active");
    target.el.classList.add("active");
    state.prevActiveEl = target.el;
  }

  function moveActive(delta) {
    var n = state.flat.length;
    if (n === 0) { if (EMPTY) EMPTY.hidden = false; return; }
    var start = state.activeIndex < 0 ? 0 : state.activeIndex;
    var i = (start + delta) % n;
    if (i < 0) i += n;
    setActive(i);
  }

  function showToast(title) {
    if (!TOAST_REGION) return;
    var el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("data-toast", title);
    el.setAttribute("role", "status");
    el.textContent = title;
    TOAST_REGION.appendChild(el);
    var remove = function () { if (el.parentNode) el.parentNode.removeChild(el); };
    if (reducedMotion) {
      var t2 = setTimeout(remove, 3000);
      return;
    }
    try { el.animate([{ opacity: 0, transform: "translateY(16px) scale(0.95)" }, { opacity: 1, transform: "translateY(0) scale(1)" }], { duration: 240, easing: "cubic-bezier(0.2,0.9,0.3,1)" }); } catch (err) {}
    var t1 = setTimeout(function () {
      try {
        var out = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-in", fill: "forwards" });
        if (out.onfinish) out.onfinish = function () { remove(); };
      } catch (err) { remove(); }
    }, 2700);
    var t2 = setTimeout(remove, 3100);
  }

  function addRecent(id) {
    state.recents = [id].concat(state.recents.filter(function (r) { return r !== id; })).slice(0, 5);
    try { localStorage.setItem("commander:recents", JSON.stringify(state.recents)); } catch (err) {}
  }

  function loadRecents() {
    try {
      var raw = localStorage.getItem("commander:recents");
      var arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) return arr.slice(0, 5);
    } catch (err) {}
    return [];
  }

  function toggleTheme() {
    var next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
  }

  function toggleSidebar() { if (SIDEBAR) SIDEBAR.classList.toggle("collapsed"); }

  function createNote() {
    var li = document.createElement("li");
    var nid = "note-" + Date.now();
    li.className = "note-item";
    li.setAttribute("data-note", nid);
    li.innerHTML = '<span class="note-title">New Note</span><span class="note-date">Just now</span>';
    if (NOTE_LIST) NOTE_LIST.prepend(li);
    if (EDITOR) EDITOR.value = "# New Note\n\nStart writing…\n";
  }

  function runCommand(o) {
    var id = o.commandId || o.id;
    if (id === "change-accent") { openSubPage(); return; }
    addRecent(id);
    showToast(o.title || id);
    closePalette();
    if (id === "toggle-dark-mode") toggleTheme();
    else if (id === "new-note") createNote();
    else if (id === "toggle-sidebar") toggleSidebar();
    else if (id === "bold") { if (EDITOR) document.execCommand("bold"); }
    else if (id === "italic") { if (EDITOR) document.execCommand("italic"); }
  }

  function openSubPage() {
    state.page = "accent";
    state.query = "";
    if (CRUMB) { CRUMB.hidden = false; CRUMB.textContent = "Accent"; }
    renderPalette();
    setActive(0);
    if (INPUT) INPUT.focus();
  }

  function pickAccent(a) {
    try { document.documentElement.style.setProperty("--accent", a.value); } catch (err) {}
    addRecent("change-accent");
    showToast(a.title);
    closePalette();
  }

  function closePalette() {
    if (!state.open) return;
    state.open = false;
    state.closing = true;
    clearTimeout(state.closeTimer);
    try { PALETTE.getAnimations().forEach(function (a) { a.cancel(); }); } catch (err) {}
    try { OVERLAY.getAnimations().forEach(function (a) { a.cancel(); }); } catch (err) {}
    if (!reducedMotion) {
      try {
        var a1 = PALETTE.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.96)" }], { duration: 150, easing: "cubic-bezier(0.4,0,0.2,1)" });
        var a2 = OVERLAY.animate([{ opacity: 0.55 }, { opacity: 0 }], { duration: 150 });
        var done = function () { PALETTE.style.display = "none"; OVERLAY.style.opacity = "0"; cleanupClose(); };
        if (a1.onfinish) a1.onfinish = done;
        if (a2.onfinish) a2.onfinish = done;
      } catch (err) { cleanupClose(); }
    }
    state.closeTimer = setTimeout(function () { PALETTE.style.display = "none"; OVERLAY.style.opacity = "0"; cleanupClose(); }, 320);
    function cleanupClose() { state.closing = false; if (state.returnFocus && document.contains(state.returnFocus)) { try { state.returnFocus.focus(); } catch (err) {} } }
  }

  function openPalette() {
    state.open = true;
    state.closing = false;
    clearTimeout(state.closeTimer);
    state.page = null;
    state.query = "";
    state.returnFocus = document.activeElement;
    if (CRUMB) { CRUMB.hidden = true; CRUMB.textContent = ""; }
    renderPalette();
    PALETTE.style.display = "flex";
    OVERLAY.style.display = "flex";
    OVERLAY.style.opacity = "0";
    if (!reducedMotion) {
      try {
        PALETTE.animate([{ opacity: 0, transform: "scale(0.96) translateY(8px)" }, { opacity: 1, transform: "scale(1) translateY(0)" }], { duration: 190, easing: "cubic-bezier(0.2,0.9,0.25,1)" });
        OVERLAY.animate([{ opacity: 0 }, { opacity: 0.55 }], { duration: 190, easing: "ease-out" });
      } catch (err) {}
    }
    if (INPUT) {
      INPUT.focus();
      INPUT.value = "";
      INPUT.setAttribute("aria-expanded", "true");
      INPUT.setAttribute("aria-activedescendant", state.flat.length > 0 ? state.flat[0].el.id : "");
      if (state.flat.length > 0) setActive(0);
    }
  }

  function handleEscape() {
    if (!state.open) return;
    if (state.page) {
      state.page = null;
      state.query = "";
      if (CRUMB) { CRUMB.hidden = true; CRUMB.textContent = ""; }
      renderPalette();
      setActive(0);
      if (INPUT) INPUT.focus();
    } else {
      closePalette();
    }
  }

  function trapFocus() {
    var focusables = [];
    if (PALETTE) {
      var nodes = PALETTE.querySelectorAll("button, input, textarea, [tabindex]");
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (el.disabled) continue;
        var r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        focusables.push(el);
      }
    }
    if (focusables.length === 0) { if (INPUT) INPUT.focus(); return; }
    var cur = document.activeElement;
    var idx = focusables.indexOf(cur);
    if (idx < 0) idx = focusables.indexOf(INPUT);
    if (idx < 0) idx = 0;
    var next = focusables[(idx + 1) % focusables.length];
    try { next.focus(); } catch (err) { if (INPUT) INPUT.focus(); }
  }

  function executeActive() {
    if (!state.flat || state.flat.length === 0) return;
    if (state.activeIndex < 0 || state.activeIndex >= state.flat.length) return;
    var entry = state.flat[state.activeIndex];
    runCommand(entry.o);
  }

  function init() {
    state.recents = loadRecents();

    if (OPEN_BTN) OPEN_BTN.addEventListener("click", function (e) { e.stopPropagation(); openPalette(); });

    if (CLOSE_BTN) CLOSE_BTN.addEventListener("click", function () { closePalette(); });

    if (CLEAR_BTN) CLEAR_BTN.addEventListener("click", function () {
      state.query = "";
      renderPalette();
      setActive(0);
      if (INPUT) INPUT.focus();
    });

    if (OVERLAY) OVERLAY.addEventListener("click", function () { if (state.open) closePalette(); });
    if (PALETTE) PALETTE.addEventListener("click", function (e) { e.stopPropagation(); });

    if (INPUT) {
      INPUT.addEventListener("input", function () {
        state.query = INPUT.value;
        renderPalette();
        setActive(0);
      });
      INPUT.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") { e.preventDefault(); moveActive(1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); moveActive(-1); }
        else if (e.key === "Home") { e.preventDefault(); setActive(0); }
        else if (e.key === "End") { e.preventDefault(); setActive(state.flat.length - 1); }
        else if (e.key === "Enter") { e.preventDefault(); executeActive(); }
        else if (e.key === "Tab") { e.preventDefault(); trapFocus(); }
        else if (e.key === "Backspace") { if (state.page && state.query === "") { e.preventDefault(); handleEscape(); } }
      });
    }

    document.addEventListener("keydown", function (e) {
      var k = (e.key || "").toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") { e.preventDefault(); if (state.open) closePalette(); else openPalette(); return; }
      if (e.key === "Escape") { handleEscape(); }
    });

    if (THEME_TOGGLE) THEME_TOGGLE.addEventListener("click", function () { toggleTheme(); });

    document.addEventListener("click", function (e) {
      if (state.open) {
        var t = e.target;
        if (PALETTE && PALETTE.contains(t)) return;
        if (OVERLAY && OVERLAY.contains(t)) return;
        closePalette();
      }
    });

    if (EDITOR) {
      EDITOR.addEventListener("input", function () {});
      EDITOR.addEventListener("keydown", function (e) {
        if ((e.metaKey || e.ctrlKey) && (e.key || "").toLowerCase() === "k") { e.preventDefault(); if (state.open) closePalette(); else openPalette(); }
        if ((e.metaKey || e.ctrlKey) && (e.key || "").toLowerCase() === "b") { e.preventDefault(); if (EDITOR) document.execCommand("bold"); }
        if ((e.metaKey || e.ctrlKey) && (e.key || "").toLowerCase() === "i") { e.preventDefault(); if (EDITOR) document.execCommand("italic"); }
      });
    }

    document.addEventListener("click", function (e) {
      var opt = null;
      var el = e.target;
      while (el) { if (el.getAttribute && el.getAttribute("role") === "option") { opt = el; break; } el = el.parentNode; }
      if (opt && state.open) {
        var idx = -1;
        for (var i = 0; i < state.flat.length; i++) { if (state.flat[i].el === opt) { idx = i; break; } }
        if (idx >= 0) setActive(idx);
        var entry = state.flat[idx];
        if (entry) {
          if (entry.o.id && entry.o.id.indexOf("accent-") === 0) { var acc = null; for (var ai = 0; ai < ACCENTS.length; ai++) { if (ACCENTS[ai].id === entry.o.id) { acc = ACCENTS[ai]; break; } } if (acc) pickAccent(acc); }
          else runCommand(entry.o);
        }
      }
    });
  }

  init();

  if (EDITOR) {
    // seed editor
  }
})();
</script>
</body>
</html>
```