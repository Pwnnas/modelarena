```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Commander</title>
<style>
:root {
  --accent: #5b5bd6;
  --bg: #f7f7f8;
  --bg-sidebar: #f0f0f2;
  --bg-editor: #ffffff;
  --text: #1a1a2e;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  --border: #e5e7eb;
  --border-light: #f0f0f2;
  --shadow: 0 25px 60px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.08);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --radius: 12px;
  --radius-sm: 6px;
  --palette-max-w: 640px;
  --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  --mono: 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
}

[data-theme="dark"] {
  --bg: #111113;
  --bg-sidebar: #18181b;
  --bg-editor: #1c1c20;
  --text: #e4e4e7;
  --text-secondary: #a1a1aa;
  --text-tertiary: #71717a;
  --border: #2a2a2e;
  --border-light: #1e1e22;
  --shadow: 0 25px 60px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  overflow: hidden;
}

body {
  font-family: var(--font);
  font-size: 14px;
  line-height: 1.5;
  color: var(--text);
  background: var(--bg);
  transition: background-color 0.3s ease, color 0.3s ease;
}

#app {
  display: flex;
  height: 100%;
}

/* Sidebar */
#sidebar {
  width: 260px;
  min-width: 260px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease, border-color 0.3s ease;
  overflow: hidden;
}

#sidebar-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--border);
}

#sidebar-header h2 {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 10px;
  letter-spacing: -0.01em;
}

#open-palette {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-editor);
  color: var(--text-secondary);
  font-size: 13px;
  font-family: var(--font);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}

#open-palette:hover {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--text);
}

#open-palette kbd {
  margin-left: auto;
  font-family: var(--mono);
  font-size: 11px;
  padding: 2px 6px;
  background: var(--bg-sidebar);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-tertiary);
}

.notes-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.notes-list-heading {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
  padding: 12px 8px 6px;
}

.note-item {
  display: block;
  width: 100%;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  text-align: left;
  font-family: var(--font);
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  transition: background-color 0.15s;
  text-decoration: none;
}

.note-item:hover {
  background: var(--bg);
}

.note-item[data-active="true"] {
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  color: var(--accent);
  font-weight: 500;
}

.note-item-title {
  font-weight: 500;
  margin-bottom: 2px;
}

.note-item-preview {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Main area */
#main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-editor);
  transition: background-color 0.3s ease;
  overflow: hidden;
}

#editor-toolbar {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
  transition: border-color 0.3s ease;
}

#editor-toolbar .note-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  flex: 1;
}

#editor-toolbar .note-meta {
  font-size: 12px;
  color: var(--text-tertiary);
}

#editor {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 24px 32px;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.7;
  background: var(--bg-editor);
  color: var(--text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

#editor:focus {
  outline: none;
}

/* Palette Overlay */
#palette-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: none;
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
}

[data-theme="dark"] #palette-overlay {
  background: rgba(0,0,0,0.6);
}

#palette-overlay.open {
  display: flex;
}

/* Palette Panel */
#palette {
  width: 100%;
  max-width: var(--palette-max-w);
  background: var(--bg-editor);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

#palette.animating-in {
  animation: paletteIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

#palette.animating-out {
  animation: paletteOut 180ms cubic-bezier(0.4, 0, 1, 1) forwards;
}

@keyframes paletteIn {
  from { opacity: 0; transform: scale(0.96) translateY(-4px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes paletteOut {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to { opacity: 0; transform: scale(0.96) translateY(-4px); }
}

@media (prefers-reduced-motion: reduce) {
  #palette.animating-in {
    animation: fadeInOnly 150ms ease forwards;
  }
  #palette.animating-out {
    animation: fadeOutOnly 150ms ease forwards;
  }
  @keyframes fadeInOnly { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fadeOutOnly { from { opacity: 1; } to { opacity: 0; } }
}

/* Palette Search */
#palette-search-wrap {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  gap: 10px;
  transition: border-color 0.3s ease;
}

#palette-search-wrap .search-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

#palette-search-wrap .search-icon svg {
  width: 16px;
  height: 16px;
}

#palette-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font);
  font-size: 14px;
  color: var(--text);
  padding: 4px 0;
}

#palette-input::placeholder {
  color: var(--text-tertiary);
}

#palette-input:focus {
  outline: none;
}

#palette-close-hint {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-tertiary);
  padding: 2px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  flex-shrink: 0;
}

/* Breadcrumb for sub-pages */
#palette-breadcrumb {
  display: none;
  align-items: center;
  padding: 8px 16px;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--accent) 5%, var(--bg-editor));
  transition: background-color 0.2s, border-color 0.3s;
}

#palette-breadcrumb.visible {
  display: flex;
}

#palette-breadcrumb .breadcrumb-back {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--bg-editor);
  font-size: 12px;
  font-family: var(--font);
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 0.2s;
}

#palette-breadcrumb .breadcrumb-back:hover {
  border-color: var(--accent);
  color: var(--accent);
}

#palette-breadcrumb .breadcrumb-label {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Results area */
#palette-results-wrapper {
  overflow: hidden;
  transition: none;
}

#palette-listbox {
  list-style: none;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px 0;
  position: relative;
}

.result-group-label {
  display: block;
  padding: 8px 16px 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
}

.result-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 10px;
  cursor: pointer;
  position: relative;
  transition: background-color 0.1s;
  border: none;
  background: none;
  width: 100%;
  font-family: var(--font);
  font-size: 13px;
  color: var(--text);
  text-align: left;
}

.result-item.active {
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.result-item:hover {
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.result-item mark {
  background: color-mix(in srgb, var(--accent) 25%, transparent);
  color: var(--accent);
  border-radius: 2px;
  padding: 0 1px;
}

[data-theme="dark"] .result-item mark {
  background: color-mix(in srgb, var(--accent) 35%, transparent);
}

.result-item-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-item-shortcut {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

.keycap {
  font-family: var(--mono);
  font-size: 10px;
  padding: 2px 5px;
  background: var(--bg-sidebar);
  border: 1px solid var(--border);
  border-radius: 3px;
  color: var(--text-tertiary);
  line-height: 1.4;
  transition: background-color 0.3s, border-color 0.3s;
}

.result-item.active .keycap {
  border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, var(--bg-sidebar));
}

.result-group-sep {
  height: 1px;
  background: var(--border);
  margin: 4px 16px;
  transition: background-color 0.3s;
}

/* Active indicator */
#active-indicator {
  position: absolute;
  left: 4px;
  right: 4px;
  height: 34px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
  pointer-events: none;
  opacity: 0;
  transition: top 0.12s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.1s;
  z-index: 0;
  box-sizing: border-box;
}

@media (prefers-reduced-motion: reduce) {
  #active-indicator {
    transition: none;
  }
  .result-item.active {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
  }
}

/* Empty state */
#palette-empty {
  display: none;
  padding: 32px 24px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
}

#palette-empty.visible {
  display: block;
}

/* Toasts */
#toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2000;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-editor);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  font-size: 13px;
  color: var(--text);
  animation: toastIn 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transition: background-color 0.3s, border-color 0.3s;
  min-width: 200px;
}

[data-theme="dark"] .toast {
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}

.toast.dismissing {
  animation: toastOut 200ms ease forwards;
}

@keyframes toastIn {
  from { opacity: 0; transform: translateY(12px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes toastOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(8px) scale(0.95); }
}

@media (prefers-reduced-motion: reduce) {
  .toast { animation: fadeToastIn 150ms ease forwards; }
  .toast.dismissing { animation: fadeToastOut 150ms ease forwards; }
  @keyframes fadeToastIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fadeToastOut { from { opacity: 1; } to { opacity: 0; } }
}

.toast-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

/* Scrollbar styling */
.notes-list::-webkit-scrollbar,
#palette-listbox::-webkit-scrollbar {
  width: 6px;
}

.notes-list::-webkit-scrollbar-thumb,
#palette-listbox::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

.notes-list::-webkit-scrollbar-thumb:hover,
#palette-listbox::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}
</style>
</head>
<body>
<div id="app">
  <aside id="sidebar">
    <div id="sidebar-header">
      <h2>Commander</h2>
      <button id="open-palette" type="button">
        <span>Search commands…</span>
        <kbd id="kbd-hint">⌘K</kbd>
      </button>
    </div>
    <nav class="notes-list">
      <div class="notes-list-heading">All Notes</div>
      <div id="notes-list"></div>
    </nav>
  </aside>
  <main id="main">
    <div id="editor-toolbar">
      <span class="note-title" id="editor-title">Welcome to Commander</span>
      <span class="note-meta">Last edited 2 min ago</span>
    </div>
    <textarea id="editor" spellcheck="false"># Welcome to Commander

A keyboard-first notes application with a powerful command palette.

## Getting Started

Press **⌘K** or **Ctrl+K** to open the command palette.
From there you can search for any command using fuzzy matching.

## Features

- Fuzzy search with smart ranking
- Keyboard-first navigation
- Theme switching (light & dark)
- Custom accent colors
- Recent commands tracking

## Try These Commands

- "tdm" → Toggle Dark Mode
- "new" → New Note
- "settings" → Go to Settings
- "accent" → Change Accent Color

---

> Tip: The palette remembers your recently used commands
> and surfaces them first when you open it.
</textarea>
  </main>
</div>

<div id="toast-container" role="status" aria-live="polite"></div>

<div id="palette-overlay">
  <div id="palette" role="dialog" aria-modal="true" aria-label="Command palette">
    <div id="palette-search-wrap">
      <span class="search-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>
      </span>
      <input id="palette-input" role="combobox" aria-expanded="true" aria-controls="palette-listbox" aria-activedescendant="" autocomplete="off" spellcheck="false" placeholder="Type a command…" />
      <span id="palette-close-hint">Esc</span>
    </div>
    <div id="palette-breadcrumb">
      <button type="button" class="breadcrumb-back" id="breadcrumb-back">← Back</button>
      <span class="breadcrumb-label" id="breadcrumb-label"></span>
    </div>
    <div id="palette-results-wrapper">
      <ul id="palette-listbox" role="listbox">
        <div id="active-indicator"></div>
      </ul>
    </div>
    <div id="palette-empty">No matching commands found.</div>
  </div>
</div>

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

const NOTES = [
  { id: "note-welcome", title: "Welcome to Commander", preview: "A keyboard-first notes application…" },
  { id: "note-q3", title: "Q3 Planning", preview: "Objectives and key results for Q3…" },
  { id: "note-books", title: "Book Recommendations", preview: "Interesting reads shared by the team…" },
  { id: "note-grocery", title: "Grocery List", preview: "Milk, eggs, bread, cheese…" },
  { id: "note-ideas", title: "Ideas & Brainstorms", preview: "Feature ideas and experiments…" },
];

const isMac = /Mac|iPhone|iPad/.test(navigator.platform) || /Mac/.test(navigator.userAgent);
const MOD_LABEL = isMac ? "⌘" : "Ctrl";

// Update kbd hint
document.getElementById("kbd-hint").textContent = MOD_LABEL + "K";

// State
let paletteOpen = false;
let currentSubPage = null; // null or 'accent'
let activeIndex = 0;
let currentResults = [];
let previouslyFocused = null;
let noteIndex = 0;

// Initialize notes sidebar
function renderNotes() {
  const list = document.getElementById("notes-list");
  list.innerHTML = "";
  NOTES.forEach((note, i) => {
    const btn = document.createElement("button");
    btn.className = "note-item";
    btn.setAttribute("data-note", note.id);
    btn.type = "button";
    if (i === noteIndex) btn.setAttribute("data-active", "true");
    btn.innerHTML = `<div class="note-item-title">${escapeHtml(note.title)}</div><div class="note-item-preview">${escapeHtml(note.preview)}</div>`;
    btn.addEventListener("click", () => {
      noteIndex = i;
      document.getElementById("editor-title").textContent = note.title;
      document.getElementById("editor").value = `# ${note.title}\n\n${note.preview}`;
      renderNotes();
    });
    list.appendChild(btn);
  });
}
renderNotes();

function escapeHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// --- Fuzzy Matching ---
function subsequenceMatch(query, text) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (q === t) return { score: 100000, positions: [...q].map((_, i) => i) };

  let qi = 0;
  const positions = [];
  let wordStartCount = 0;
  let contiguousCount = 0;
  let isPrefix = false;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      positions.push(ti);
      const prev = ti === 0 ? ' ' : t[ti - 1];
      const isStart = ti === 0 || prev === ' ' || prev === '-' || prev === '_' || prev === '.';
      if (isStart) wordStartCount++;
      if (positions.length > 1 && positions[positions.length - 2] === ti - 1) contiguousCount++;
      if (ti === 0) isPrefix = true;
      qi++;
    }
  }

  if (qi < q.length) return null;

  let score = 0;
  if (isPrefix) score += 50000;
  score += wordStartCount * 10000;
  score += contiguousCount * 1000;
  score += Math.max(0, 2000 - t.length * 3);
  score += positions[0] === 0 ? 5000 : 0;

  return { score, positions };
}

function getMatchInfo(query, command) {
  if (!query) return { matched: true, titleMatch: false, keywordMatch: false, score: 0, positions: [] };

  const titleResult = subsequenceMatch(query, command.title);
  let bestKeywordResult = null;

  if (command.keywords) {
    for (const kw of command.keywords) {
      const kr = subsequenceMatch(query, kw);
      if (kr && (!bestKeywordResult || kr.score > bestKeywordResult.score)) {
        bestKeywordResult = kr;
      }
    }
  }

  if (titleResult) {
    return { matched: true, titleMatch: true, keywordMatch: false, score: 100000 + titleResult.score, positions: titleResult.positions };
  }
  if (bestKeywordResult) {
    return { matched: true, titleMatch: false, keywordMatch: true, score: bestKeywordResult.score, positions: [] };
  }
  return { matched: false };
}

function fuzzySearch(query, commands) {
  if (!query) return commands.map((c, i) => ({ cmd: c, originalIndex: i, score: 0 }));

  const results = [];
  for (let i = 0; i < commands.length; i++) {
    const info = getMatchInfo(query, commands[i]);
    if (info.matched) {
      results.push({ cmd: commands[i], originalIndex: i, score: info.score });
    }
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.originalIndex - b.originalIndex;
  });

  return results.slice(0, 50);
}

function highlightTitle(title, positions) {
  if (!positions || positions.length === 0) return escapeHtml(title);
  const posSet = new Set(positions);
  let result = "";
  for (let i = 0; i < title.length; i++) {
    if (posSet.has(i)) {
      result += "<mark>" + escapeHtml(title[i]) + "</mark>";
    } else {
      result += escapeHtml(title[i]);
    }
  }
  return result;
}

// --- Recents ---
const RECENT_KEY = "commander-recents";
function loadRecents() {
  try {
    const data = localStorage.getItem(RECENT_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return [];
}

function saveRecents(recents) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recents));
  } catch (e) {}
}

function addRecent(cmdId) {
  let recents = loadRecents();
  recents = recents.filter(id => id !== cmdId);
  recents.unshift(cmdId);
  recents = recents.slice(0, 5);
  saveRecents(recents);
}

// --- Palette Rendering ---
function formatShortcut(shortcut) {
  if (!shortcut) return "";
  let s = shortcut.replace("Mod", MOD_LABEL);
  return s;
}

function renderResults(query) {
  const listbox = document.getElementById("palette-listbox");
  const wrapper = document.getElementById("palette-results-wrapper");
  const emptyEl = document.getElementById("palette-empty");
  const indicator = document.getElementById("active-indicator");

  const oldHeight = wrapper.offsetHeight;

  // Clear listbox but preserve indicator
  const savedIndicator = indicator;
  listbox.innerHTML = "";
  listbox.appendChild(savedIndicator);

  let items = [];

  if (currentSubPage === "accent") {
    // Sub-page mode
    const accentItems = query ? fuzzySearch(query, ACCENTS) : ACCENTS.map((c, i) => ({ cmd: c, score: 0, originalIndex: i }));
    accentItems.slice(0, 50).forEach(r => {
      const cmd = r.cmd;
      const positions = r.positions || [];
      items.push({ cmd, titleHtml: highlightTitle(cmd.title, positions), shortcut: null, dataId: cmd.id });
    });
  } else if (query) {
    // Flat search mode
    const results = fuzzySearch(query, COMMANDS);
    results.forEach(r => {
      const info = getMatchInfo(query, r.cmd);
      items.push({ cmd: r.cmd, titleHtml: highlightTitle(r.cmd.title, info.positions), shortcut: r.cmd.shortcut ? formatShortcut(r.cmd.shortcut) : null, dataId: r.cmd.id });
    });
  } else {
    // Default grouped mode
    const recents = loadRecents();
    const recentCmds = recents.map(id => COMMANDS.find(c => c.id === id)).filter(Boolean);

    if (recentCmds.length > 0) {
      // Render Recent group
      listbox.insertAdjacentHTML("beforeend", `<li class="result-group-label" role="presentation">Recent</li>`);
      recentCmds.forEach(cmd => {
        items.push({ cmd, titleHtml: escapeHtml(cmd.title), shortcut: cmd.shortcut ? formatShortcut(cmd.shortcut) : null, dataId: cmd.id });
      });
    }

    // Render all groups
    const groups = {};
    COMMANDS.forEach(cmd => {
      if (!groups[cmd.group]) groups[cmd.group] = [];
      groups[cmd.group].push(cmd);
    });

    const groupOrder = ["Navigation", "Notes", "Editor", "View", "Help"];
    for (const groupName of groupOrder) {
      if (!groups[groupName]) continue;
      listbox.insertAdjacentHTML("beforeend", `<li class="result-group-label" role="presentation">${escapeHtml(groupName)}</li>`);
      groups[groupName].forEach(cmd => {
        items.push({ cmd, titleHtml: escapeHtml(cmd.title), shortcut: cmd.shortcut ? formatShortcut(cmd.shortcut) : null, dataId: cmd.id });
      });
    }
  }

  // Render items
  items.forEach((item, idx) => {
    const li = document.createElement("li");
    li.className = "result-item";
    li.setAttribute("role", "option");
    li.setAttribute("data-command", item.dataId);
    li.setAttribute("id", "opt-" + item.dataId);
    li.setAttribute("aria-selected", "false");
    li.innerHTML = `<span class="result-item-title">${item.titleHtml}</span>` +
      (item.shortcut ? `<span class="result-item-shortcut"><span class="keycap">${escapeHtml(item.shortcut)}</span></span>` : "");
    listbox.appendChild(li);
  });

  currentResults = items;

  if (items.length === 0) {
    emptyEl.classList.add("visible");
  } else {
    emptyEl.classList.remove("visible");
  }

  // Animate height change
  const newHeight = wrapper.scrollHeight;
  if (oldHeight !== newHeight && newHeight > 0) {
    if (!prefersReducedMotion()) {
      wrapper.style.overflow = "hidden";
      wrapper.style.height = oldHeight + "px";
      const anim = wrapper.animate(
        [{ height: oldHeight + "px" }, { height: newHeight + "px" }],
        { duration: 130, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
      );
      anim.onfinish = () => { wrapper.style.height = ""; wrapper.style.overflow = ""; anim.cancel(); };
      anim.oncancel = () => { wrapper.style.height = ""; wrapper.style.overflow = ""; };
    }
  }

  // Set active to first item
  setActiveIndex(items.length > 0 ? 0 : -1);
  updateActiveDescendant();
}

function setActiveIndex(idx) {
  const listbox = document.getElementById("palette-listbox");
  const prev = listbox.querySelectorAll("[aria-selected='true']");
  prev.forEach(el => el.setAttribute("aria-selected", "false"));

  activeIndex = idx;

  if (idx >= 0 && idx < currentResults.length) {
    const items = listbox.querySelectorAll(".result-item");
    if (items[idx]) {
      items[idx].setAttribute("aria-selected", "true");
      items[idx].classList.add("active");
      scrollIntoView(items[idx]);
      updateActiveDescendant();
      moveIndicator(items[idx]);
    }
  } else {
    document.getElementById("palette-input").setAttribute("aria-activedescendant", "");
    document.getElementById("active-indicator").style.opacity = "0";
  }
}

function moveIndicator(el) {
  const indicator = document.getElementById("active-indicator");
  const listbox = document.getElementById("palette-listbox");
  const listRect = listbox.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const offsetTop = el.offsetTop;
  indicator.style.top = offsetTop + "px";
  indicator.style.height = el.offsetHeight + "px";
  indicator.style.opacity = "1";
}

function scrollIntoView(el) {
  const listbox = document.getElementById("palette-listbox");
  const listRect = listbox.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  if (elRect.top < listRect.top) {
    listbox.scrollTop -= listRect.top - elRect.top;
  } else if (elRect.bottom > listRect.bottom) {
    listbox.scrollTop += elRect.bottom - listRect.bottom;
  }
}

function updateActiveDescendant() {
  const input = document.getElementById("palette-input");
  if (activeIndex >= 0 && activeIndex < currentResults.length) {
    input.setAttribute("aria-activedescendant", "opt-" + currentResults[activeIndex].dataId);
  } else {
    input.setAttribute("aria-activedescendant", "");
  }
}

// --- Open/Close Palette ---
function openPalette() {
  if (paletteOpen) return;
  paletteOpen = true;
  previouslyFocused = document.activeElement;

  const overlay = document.getElementById("palette-overlay");
  const palette = document.getElementById("palette");
  overlay.classList.add("open");
  palette.classList.remove("animating-out");
  palette.classList.add("animating-in");

  currentSubPage = null;
  document.getElementById("palette-breadcrumb").classList.remove("visible");
  document.getElementById("palette-input").value = "";

  renderResults("");

  requestAnimationFrame(() => {
    document.getElementById("palette-input").focus();
  });
}

function closePalette() {
  if (!paletteOpen) return;

  const overlay = document.getElementById("palette-overlay");
  const palette = document.getElementById("palette");

  palette.classList.remove("animating-in");
  palette.classList.add("animating-out");

  palette.addEventListener("animationend", function handler() {
    palette.removeEventListener("animationend", handler);
    overlay.classList.remove("open");
    palette.classList.remove("animating-out");
  }, { once: true });

  // Fallback: force close after 400ms
  setTimeout(() => {
    if (paletteOpen) {
      overlay.classList.remove("open");
      palette.classList.remove("animating-out");
    }
  }, 380);

  paletteOpen = false;
  currentSubPage = null;
  document.getElementById("palette-breadcrumb").classList.remove("visible");

  if (previouslyFocused && previouslyFocused.focus) {
    previouslyFocused.focus();
  }
}

function togglePalette() {
  if (paletteOpen) closePalette();
  else openPalette();
}

// --- Execute Command ---
function executeCommand(cmdId) {
  const cmd = COMMANDS.find(c => c.id === cmdId) || ACCENTS.find(c => c.id === cmdId);
  if (!cmd) return;

  addRecent(cmdId);

  // Real effects
  if (cmdId === "toggle-dark-mode") {
    const html = document.documentElement;
    const current = html.dataset.theme || "light";
    html.dataset.theme = current === "light" ? "dark" : "light";
    showToast(cmd.title);
    closePalette();
    return;
  }

  if (cmdId === "new-note") {
    const newNote = { id: "note-" + Date.now(), title: "Untitled Note", preview: "New blank note" };
    NOTES.unshift(newNote);
    renderNotes();
    showToast(cmd.title);
    closePalette();
    return;
  }

  if (cmdId === "change-accent") {
    currentSubPage = "accent";
    document.getElementById("palette-breadcrumb").classList.add("visible");
    document.getElementById("breadcrumb-label").textContent = "Change Accent Color";
    document.getElementById("palette-input").value = "";
    renderResults("");
    document.getElementById("palette-input").focus();
    return;
  }

  if (cmd.id.startsWith("accent-")) {
    document.documentElement.style.setProperty("--accent", cmd.value);
    showToast(cmd.title);
    closePalette();
    return;
  }

  // Generic: show toast and close
  showToast(cmd.title);
  closePalette();
}

function showToast(title) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("data-toast", title);
  toast.innerHTML = `<span class="toast-dot"></span><span>${escapeHtml(title)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("dismissing");
    toast.addEventListener("animationend", () => { toast.remove(); }, { once: true });
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 250);
  }, 3000);
}

// --- Keyboard Handling ---
document.addEventListener("keydown", (e) => {
  // Cmd+K / Ctrl+K toggle
  if ((isMac && e.metaKey && e.key === "k") || (!isMac && e.ctrlKey && e.key === "k")) {
    e.preventDefault();
    togglePalette();
    return;
  }

  if (!paletteOpen) return;

  const key = e.key;

  if (key === "Escape") {
    e.preventDefault();
    if (currentSubPage === "accent") {
      currentSubPage = null;
      document.getElementById("palette-breadcrumb").classList.remove("visible");
      document.getElementById("palette-input").value = "";
      renderResults("");
    } else {
      closePalette();
    }
    return;
  }

  if (key === "ArrowDown") {
    e.preventDefault();
    if (currentResults.length === 0) return;
    const next = activeIndex + 1 >= currentResults.length ? 0 : activeIndex + 1;
    clearActiveClass();
    setActiveIndex(next);
    return;
  }

  if (key === "ArrowUp") {
    e.preventDefault();
    if (currentResults.length === 0) return;
    const prev = activeIndex - 1 < 0 ? currentResults.length - 1 : activeIndex - 1;
    clearActiveClass();
    setActiveIndex(prev);
    return;
  }

  if (key === "Home") {
    e.preventDefault();
    if (currentResults.length === 0) return;
    clearActiveClass();
    setActiveIndex(0);
    return;
  }

  if (key === "End") {
    e.preventDefault();
    if (currentResults.length === 0) return;
    clearActiveClass();
    setActiveIndex(currentResults.length - 1);
    return;
  }

  if (key === "Enter") {
    e.preventDefault();
    if (activeIndex >= 0 && activeIndex < currentResults.length) {
      executeCommand(currentResults[activeIndex].dataId);
    }
    return;
  }

  if (key === "Tab") {
    e.preventDefault();
    const palette = document.getElementById("palette");
    const focusables = palette.querySelectorAll('input, button, [tabindex="0"]');
    const arr = Array.from(focusables);
    if (arr.length === 0) return;
    const currentIdx = arr.indexOf(document.activeElement);
    let next;
    if (e.shiftKey) {
      next = currentIdx <= 0 ? arr.length - 1 : currentIdx - 1;
    } else {
      next = currentIdx >= arr.length - 1 ? 0 : currentIdx + 1;
    }
    arr[next].focus();
    return;
  }

  // Backspace on empty query in sub-page: go back to root
  if (key === "Backspace" && currentSubPage === "accent") {
    const input = document.getElementById("palette-input");
    if (input.value === "") {
      e.preventDefault();
      currentSubPage = null;
      document.getElementById("palette-breadcrumb").classList.remove("visible");
      renderResults("");
      document.getElementById("palette-input").focus();
    }
  }
});

function clearActiveClass() {
  document.querySelectorAll(".result-item.active").forEach(el => el.classList.remove("active"));
}

// --- Input handling ---
document.getElementById("palette-input").addEventListener("input", (e) => {
  const query = e.target.value.trim();
  renderResults(query);
});

// --- Click handling ---
document.getElementById("palette-overlay").addEventListener("mousedown", (e) => {
  if (e.target === document.getElementById("palette-overlay")) {
    closePalette();
  }
});

document.getElementById("palette-listbox").addEventListener("click", (e) => {
  const item = e.target.closest(".result-item");
  if (item) {
    const dataId = item.getAttribute("data-command");
    if (dataId) executeCommand(dataId);
  }
});

document.getElementById("palette-listbox").addEventListener("mousemove", (e) => {
  const item = e.target.closest(".result-item");
  if (item && item.getAttribute("data-command")) {
    const dataId = item.getAttribute("data-command");
    const idx = currentResults.findIndex(r => r.dataId === dataId);
    if (idx >= 0 && idx !== activeIndex) {
      clearActiveClass();
      setActiveIndex(idx);
    }
  }
});

document.getElementById("open-palette").addEventListener("click", openPalette);

document.getElementById("breadcrumb-back").addEventListener("click", () => {
  currentSubPage = null;
  document.getElementById("palette-breadcrumb").classList.remove("visible");
  document.getElementById("palette-input").value = "";
  renderResults("");
  document.getElementById("palette-input").focus();
});

// --- Motion ---
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Initial setup
document.documentElement.dataset.theme = "light";
document.documentElement.style.setProperty("--accent", "#5b5bd6");
</script>
</body>
</html>
```