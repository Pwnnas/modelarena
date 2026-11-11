

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Commander</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --accent: #5b5bd6;
  --accent-light: rgba(91,91,214,0.08);
  --accent-glow: rgba(91,91,214,0.15);
  --bg: #ffffff;
  --bg-secondary: #f5f5f7;
  --bg-tertiary: #e8e8ed;
  --text: #1d1d1f;
  --text-secondary: #6e6e73;
  --text-tertiary: #aeaeb2;
  --border: #d2d2d7;
  --border-light: #e8e8ed;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.12);
  --radius: 10px;
  --radius-sm: 6px;
  --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

[data-theme="dark"] {
  --bg: #1c1c1e;
  --bg-secondary: #2c2c2e;
  --bg-tertiary: #3a3a3c;
  --text: #f5f5f7;
  --text-secondary: #98989d;
  --text-tertiary: #6e6e73;
  --border: #38383a;
  --border-light: #2c2c2e;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.2);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.3);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.4);
  --accent-light: rgba(91,91,214,0.12);
  --accent-glow: rgba(91,91,214,0.2);
}

html { font-size: 16px; }

body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  height: 100vh;
  overflow: hidden;
  transition: background-color 0.3s ease, color 0.3s ease;
}

#app {
  display: flex;
  height: 100vh;
  transition: background-color 0.3s ease;
}

/* Sidebar */
#sidebar {
  width: 260px;
  min-width: 260px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease, border-color 0.3s ease, margin-left 0.3s ease, opacity 0.3s ease;
  overflow: hidden;
}

#sidebar.hidden {
  margin-left: -260px;
  opacity: 0;
  pointer-events: none;
}

.sidebar-header {
  padding: 20px 16px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-header h1 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -0.01em;
}

#open-palette {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary);
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  font-family: var(--font);
}

#open-palette:hover {
  background: var(--bg);
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-glow);
}

#open-palette:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.keycap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  box-shadow: 0 1px 0 var(--border);
  font-family: var(--font);
}

#notes-list {
  list-style: none;
  padding: 4px 8px;
  flex: 1;
  overflow-y: auto;
}

.note-item {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
  transition: background-color 0.15s ease, color 0.15s ease;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-item:hover {
  background: var(--bg-tertiary);
  color: var(--text);
}

.note-item.active {
  background: var(--accent-light);
  color: var(--accent);
  font-weight: 500;
}

/* Editor */
#editor-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  transition: background-color 0.3s ease;
}

#editor-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-light);
  transition: border-color 0.3s ease;
}

#note-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -0.02em;
}

#editor {
  flex: 1;
  padding: 24px;
  border: none;
  outline: none;
  resize: none;
  font-family: var(--mono);
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
  background: var(--bg);
  transition: background-color 0.3s ease, color 0.3s ease;
}

#editor:focus {
  box-shadow: inset 0 0 0 2px var(--accent-glow);
}

/* Palette Overlay */
#palette-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
  background: rgba(0,0,0,0.2);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity 0.2s ease;
}

#palette-overlay.open {
  opacity: 1;
}

#palette-overlay.closing {
  opacity: 0;
}

#palette {
  width: 600px;
  max-width: 90vw;
  max-height: 480px;
  background: var(--bg);
  border-radius: 14px;
  box-shadow: var(--shadow-lg), 0 0 0 1px var(--border-light);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transform: scale(0.95);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

#palette-overlay.open #palette {
  transform: scale(1);
}

#palette-overlay.closing #palette {
  transform: scale(0.95);
}

.palette-input-wrap {
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  gap: 10px;
  transition: border-color 0.3s ease;
}

.palette-icon {
  width: 18px;
  height: 18px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

#palette-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  font-family: var(--font);
  color: var(--text);
  background: transparent;
  caret-color: var(--accent);
}

#palette-input::placeholder {
  color: var(--text-tertiary);
}

.palette-breadcrumb {
  display: none;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-bottom: 1px solid var(--border-light);
  font-size: 13px;
  color: var(--text-secondary);
  transition: border-color 0.3s ease;
}

.palette-breadcrumb.visible {
  display: flex;
}

.palette-breadcrumb .breadcrumb-chip {
  background: var(--accent-light);
  color: var(--accent);
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

#palette-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  position: relative;
  overscroll-behavior: contain;
}

#palette-list::-webkit-scrollbar {
  width: 6px;
}

#palette-list::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

.active-indicator {
  position: absolute;
  left: 6px;
  right: 6px;
  height: 44px;
  background: var(--accent-light);
  border-radius: var(--radius-sm);
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  z-index: 0;
}

.group-header {
  padding: 10px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
  position: relative;
  z-index: 1;
}

.option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  color: var(--text);
  position: relative;
  z-index: 1;
  transition: background-color 0.1s ease;
  height: 44px;
}

.option:hover {
  background: var(--bg-tertiary);
}

.option .option-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.option .option-title mark {
  background: transparent;
  color: var(--accent);
  font-weight: 600;
}

.option .option-shortcut {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
  margin-left: 12px;
}

.option .option-shortcut .keycap {
  min-width: 18px;
  height: 18px;
  font-size: 10px;
}

.option .accent-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-left: 12px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

#palette-empty {
  display: none;
  padding: 32px 20px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 14px;
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
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  padding: 12px 20px;
  background: var(--text);
  color: var(--bg);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  box-shadow: var(--shadow-md);
  animation: toast-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  pointer-events: auto;
  max-width: 320px;
}

.toast.exiting {
  animation: toast-out 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes toast-in {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes toast-out {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(12px) scale(0.96); }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .active-indicator {
    transition: none;
  }
  .toast {
    animation: none;
    opacity: 1;
    transform: none;
  }
  .toast.exiting {
    animation: none;
    opacity: 0;
  }
}
</style>
</head>
<body>
<div id="app">
  <aside id="sidebar">
    <div class="sidebar-header">
      <h1>Notes</h1>
      <button id="open-palette" aria-label="Open command palette">
        <span class="keycap" id="mod-key">⌘</span><span class="keycap">K</span>
      </button>
    </div>
    <ul id="notes-list">
      <li data-note="note-1" class="note-item active">Meeting Notes</li>
      <li data-note="note-2" class="note-item">Project Ideas</li>
      <li data-note="note-3" class="note-item">Reading List</li>
      <li data-note="note-4" class="note-item">Weekly Goals</li>
      <li data-note="note-5" class="note-item">Code Snippets</li>
    </ul>
  </aside>
  <main id="editor-area">
    <div id="editor-header">
      <h2 id="note-title">Meeting Notes</h2>
    </div>
    <textarea id="editor" spellcheck="false" placeholder="Start typing…">Meeting Notes
============

- Review Q3 roadmap and milestones
- Discuss hiring plan for engineering team
- Budget allocation for Q4 infrastructure
- Follow up with design on new dashboard mockups
- Prepare sprint retrospective deck

Action Items:
  [ ] Send updated timeline to stakeholders
  [ ] Schedule 1:1 with new team members
  [ ] Update budget spreadsheet</textarea>
  </main>
</div>

<div id="toast-container" role="status" aria-live="polite"></div>

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
  { id: "about", title: "About Commander", group: "Help" }
];

const ACCENTS = [
  { id: "accent-indigo", title: "Indigo", value: "#5b5bd6" },
  { id: "accent-emerald", title: "Emerald", value: "#10b981" },
  { id: "accent-rose", title: "Rose", value: "#e11d48" },
  { id: "accent-amber", title: "Amber", value: "#f59e0b" },
  { id: "accent-sky", title: "Sky", value: "#0ea5e9" }
];

const GROUP_ORDER = ["Navigation", "Notes", "Editor", "View", "Help"];

let paletteOpen = false;
let paletteMode = 'root';
let activeIndex = 0;
let currentResults = [];
let lastFocusedElement = null;
let recents = [];
let noteCounter = 5;
let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = id => document.getElementById(id);

// Detect platform for modifier key
const isMac = /Mac/i.test(navigator.platform);
document.getElementById('mod-key').textContent = isMac ? '⌘' : 'Ctrl';

// Load recents
function loadRecents() {
  try {
    const stored = localStorage.getItem('commander-recents');
    if (stored) recents = JSON.parse(stored);
  } catch (e) { recents = []; }
}

function saveRecents() {
  try {
    localStorage.setItem('commander-recents', JSON.stringify(recents));
  } catch (e) {}
}

function addRecent(id) {
  recents = recents.filter(r => r !== id);
  recents.unshift(id);
  if (recents.length > 5) recents = recents.slice(0, 5);
  saveRecents();
}

// Fuzzy matching
function findSubsequence(query, text) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let matches = [];
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      matches.push(i);
      qi++;
    }
  }
  if (qi < q.length) return null;
  return matches;
}

function scoreMatch(query, text, isKeyword) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const matches = findSubsequence(q, t);
  if (!matches) return null;

  let score = 0;

  if (t === q) score += 100000;
  else if (t.startsWith(q)) score += 50000;
  else {
    // Word boundary bonus
    for (const pos of matches) {
      if (pos === 0 || /[\s\-_/.]/.test(t[pos - 1])) {
        score += 200;
      }
    }
    // Contiguous run bonus
    let maxRun = 1, curRun = 1;
    for (let i = 1; i < matches.length; i++) {
      if (matches[i] === matches[i - 1] + 1) {
        curRun++;
        maxRun = Math.max(maxRun, curRun);
      } else {
        curRun = 1;
      }
    }
    score += maxRun * 100;
    // Proximity
    if (matches.length > 1) {
      const span = matches[matches.length - 1] - matches[0] + 1;
      score += Math.max(0, 150 - span);
    }
    // Length penalty
    score -= t.length * 2;
  }

  if (isKeyword) score -= 10000;

  return { score, matches };
}

function getMatchedTitle(query, text) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const matches = findSubsequence(q, t);
  if (!matches) return text;
  const set = new Set(matches);
  let result = '';
  for (let i = 0; i < text.length; i++) {
    if (set.has(i)) {
      result += '<mark>' + text[i] + '</mark>';
    } else {
      result += text[i];
    }
  }
  return result;
}

function rankCommands(query) {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const results = [];
  for (const cmd of COMMANDS) {
    const titleResult = scoreMatch(q, cmd.title, false);
    let best = titleResult;
    let isKw = false;

    if (cmd.keywords) {
      for (const kw of cmd.keywords) {
        const kwResult = scoreMatch(q, kw, true);
        if (kwResult && (!best || kwResult.score > best.score)) {
          best = kwResult;
          isKw = true;
        }
      }
    }

    if (best) {
      results.push({ cmd, score: best.score, matches: titleResult ? titleResult.matches : null, isKw });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 50);
}

function rankAccents(query) {
  const q = query.toLowerCase().trim();
  if (!q) return ACCENTS.map(a => ({ cmd: a, score: 0 }));
  const results = [];
  for (const acc of ACCENTS) {
    const r = scoreMatch(q, acc.title, false);
    if (r) results.push({ cmd: acc, score: r.score });
  }
  results.sort((a, b) => b.score - a.score);
  return results;
}

// Build results
function buildResults() {
  const input = $('palette-input');
  const query = input.value;

  if (paletteMode === 'accent') {
    currentResults = rankAccents(query).map(r => ({ ...r.cmd, _isAccent: true }));
  } else if (!query.trim()) {
    // Grouped results
    currentResults = [];
    const recentsList = recents.map(id => COMMANDS.find(c => c.id === id)).filter(Boolean);
    if (recentsList.length > 0) {
      currentResults.push({ _group: 'Recent' });
      for (const r of recentsList) currentResults.push(r);
    }
    for (const group of GROUP_ORDER) {
      const groupCmds = COMMANDS.filter(c => c.group === group);
      if (groupCmds.length > 0) {
        currentResults.push({ _group: group });
        for (const c of groupCmds) currentResults.push(c);
      }
    }
  } else {
    const ranked = rankCommands(query);
    if (ranked) {
      currentResults = ranked.map(r => r.cmd);
    } else {
      currentResults = [];
    }
  }
}

// Render
function render() {
  const listEl = $('palette-list');
  const emptyEl = $('palette-empty');
  const input = $('palette-input');

  const oldHeight = listEl.offsetHeight;

  // Clear
  listEl.innerHTML = '';

  const indicator = document.createElement('div');
  indicator.className = 'active-indicator';
  indicator.id = 'active-indicator';
  listEl.appendChild(indicator);

  const optionEls = [];
  let optionIndex = 0;

  for (const item of currentResults) {
    if (item._group) {
      const header = document.createElement('div');
      header.className = 'group-header';
      header.textContent = item._group;
      listEl.appendChild(header);
      continue;
    }

    const optId = 'opt-' + item.id;
    const opt = document.createElement('div');
    opt.className = 'option';
    opt.id = optId;
    opt.setAttribute('role', 'option');
    opt.setAttribute('data-command', item.id);
    opt.setAttribute('aria-selected', 'false');

    const titleEl = document.createElement('span');
    titleEl.className = 'option-title';

    if (item._isAccent) {
      titleEl.textContent = item.title;
      opt.appendChild(titleEl);
      const dot = document.createElement('span');
      dot.className = 'accent-dot';
      dot.style.background = item.value;
      opt.appendChild(dot);
    } else {
      const query = $('palette-input').value;
      if (query.trim()) {
        titleEl.innerHTML = getMatchedTitle(query, item.title);
      } else {
        titleEl.textContent = item.title;
      }
      opt.appendChild(titleEl);

      if (item.shortcut) {
        const shortcutEl = document.createElement('span');
        shortcutEl.className = 'option-shortcut';
        const keys = item.shortcut.split('+');
        for (const key of keys) {
          const kc = document.createElement('span');
          kc.className = 'keycap';
          kc.textContent = key === 'Mod' ? (isMac ? '⌘' : 'Ctrl') : key;
          shortcutEl.appendChild(kc);
        }
        opt.appendChild(shortcutEl);
      }
    }

    opt.addEventListener('mouseenter', () => setActiveIndex(optionIndex));
    opt.addEventListener('click', () => executeCommand(item.id));
    listEl.appendChild(opt);
    optionEls.push(opt);
    optionIndex++;
  }

  // Set active
  if (optionEls.length > 0) {
    activeIndex = Math.min(activeIndex, optionEls.length - 1);
    updateActive(optionEls);
  } else {
    activeIndex = -1;
  }

  // Empty state
  const hasOptions = optionEls.length > 0;
  emptyEl.classList.toggle('visible', !hasOptions);

  // Aria
  input.setAttribute('aria-activedescendant', hasOptions ? optionEls[activeIndex].id : '');

  // Animate height
  const newHeight = listEl.offsetHeight;
  if (oldHeight !== newHeight && !reducedMotion) {
    listEl.style.height = oldHeight + 'px';
    listEl.style.overflow = 'hidden';
    const anim = listEl.animate(
      [{ height: oldHeight + 'px' }, { height: newHeight + 'px' }],
      { duration: 200, easing: 'ease' }
    );
    anim.onfinish = () => {
      listEl.style.height = '';
      listEl.style.overflow = '';
    };
  }
}

function updateActive(optionEls) {
  if (!optionEls.length) return;
  const activeEl = optionEls[activeIndex];
  for (const el of optionEls) {
    el.setAttribute('aria-selected', el === activeEl ? 'true' : 'false');
  }
  const indicator = $('active-indicator');
  if (indicator && activeEl) {
    indicator.style.transform = `translateY(${activeEl.offsetTop}px)`;
  }
  $('palette-input').setAttribute('aria-activedescendant', activeEl.id);
  // Scroll into view
  activeEl.scrollIntoView({ block: 'nearest' });
}

function setActiveIndex(idx) {
  const optionEls = [...document.querySelectorAll('#palette-list .option')];
  if (!optionEls.length) return;
  activeIndex = ((idx % optionEls.length) + optionEls.length) % optionEls.length;
  updateActive(optionEls);
}

// Palette open/close
function openPalette() {
  if (paletteOpen) return;
  paletteOpen = true;
  paletteMode = 'root';
  lastFocusedElement = document.activeElement;

  // Create overlay
  let overlay = $('palette-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'palette-overlay';
    overlay.innerHTML = `
      <div id="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div class="palette-input-wrap">
          <svg class="palette-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input id="palette-input" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-activedescendant="" placeholder="Type a command or search…" autocomplete="off" spellcheck="false">
        </div>
        <div class="palette-breadcrumb" id="palette-breadcrumb">
          <span>←</span>
          <span class="breadcrumb-chip">Change Accent Color</span>
        </div>
        <div id="palette-list" role="listbox"></div>
        <div id="palette-empty">No results found</div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePalette();
    });

    $('palette-input').addEventListener('input', onQueryChange);
    $('palette-input').addEventListener('keydown', onPaletteKeyDown);
  }

  // Reset
  $('palette-input').value = '';
  $('palette-breadcrumb').classList.remove('visible');
  $('palette-overlay').classList.remove('closing');
  $('palette-overlay').style.display = '';

  buildResults();
  render();

  // Animate in
  requestAnimationFrame(() => {
    overlay.classList.add('open');
    $('palette-input').focus();
  });
}

function closePalette() {
  if (!paletteOpen) return;
  paletteOpen = false;
  const overlay = $('palette-overlay');

  if (reducedMotion) {
    overlay.style.display = 'none';
    overlay.classList.remove('open');
    restoreFocus();
    return;
  }

  overlay.classList.add('closing');
  overlay.classList.remove('open');

  const anim = overlay.animate(
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: 200, easing: 'ease' }
  );
  const palette = $('palette');
  const pAnim = palette.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }],
    { duration: 200, easing: 'ease' }
  );

  const done = () => {
    overlay.style.display = 'none';
    overlay.classList.remove('closing');
    restoreFocus();
  };
  pAnim.onfinish = done;
}

function restoreFocus() {
  if (lastFocusedElement && document.contains(lastFocusedElement)) {
    lastFocusedElement.focus();
  }
}

// Query change
function onQueryChange() {
  activeIndex = 0;
  buildResults();
  render();
}

// Keyboard handling in palette
function onPaletteKeyDown(e) {
  const optionEls = [...document.querySelectorAll('#palette-list .option')];

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      if (optionEls.length) {
        activeIndex = (activeIndex + 1) % optionEls.length;
        updateActive(optionEls);
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (optionEls.length) {
        activeIndex = (activeIndex - 1 + optionEls.length) % optionEls.length;
        updateActive(optionEls);
      }
      break;
    case 'Home':
      e.preventDefault();
      if (optionEls.length) {
        activeIndex = 0;
        updateActive(optionEls);
      }
      break;
    case 'End':
      e.preventDefault();
      if (optionEls.length) {
        activeIndex = optionEls.length - 1;
        updateActive(optionEls);
      }
      break;
    case 'Enter':
      e.preventDefault();
      if (optionEls.length && activeIndex >= 0) {
        const cmdId = optionEls[activeIndex].getAttribute('data-command');
        executeCommand(cmdId);
      }
      break;
    case 'Escape':
      e.preventDefault();
      if (paletteMode === 'accent') {
        paletteMode = 'root';
        $('palette-breadcrumb').classList.remove('visible');
        $('palette-input').value = '';
        activeIndex = 0;
        buildResults();
        render();
      } else {
        closePalette();
      }
      break;
    case 'Backspace':
      if (paletteMode === 'accent' && $('palette-input').value === '') {
        e.preventDefault();
        paletteMode = 'root';
        $('palette-breadcrumb').classList.remove('visible');
        activeIndex = 0;
        buildResults();
        render();
      }
      break;
    case 'Tab':
      e.preventDefault();
      break;
  }
}

// Execute command
function executeCommand(id) {
  addRecent(id);

  // Handle special commands
  if (id === 'toggle-dark-mode') {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === 'light' ? 'dark' : 'light';
  } else if (id === 'change-accent') {
    // Open sub-page
    paletteMode = 'accent';
    $('palette-breadcrumb').classList.add('visible');
    $('palette-input').value = '';
    activeIndex = 0;
    buildResults();
    render();
    $('palette-input').focus();
    return; // Don't close palette
  } else if (id === 'new-note') {
    noteCounter++;
    const noteName = 'New Note ' + noteCounter;
    const li = document.createElement('li');
    li.className = 'note-item';
    li.setAttribute('data-note', 'note-' + noteCounter);
    li.textContent = noteName;
    li.addEventListener('click', () => selectNote(li, noteName));
    $('notes-list').appendChild(li);
  } else if (id === 'toggle-sidebar') {
    $('sidebar').classList.toggle('hidden');
  }

  // Close palette (unless it's the accent sub-page)
  if (id !== 'change-accent') {
    closePalette();
  }

  // Show toast
  const cmd = COMMANDS.find(c => c.id === id) || ACCENTS.find(a => a.id === id);
  if (cmd) {
    showToast(cmd.title);
  }
}

// Accent selection
function selectAccent(id) {
  const accent = ACCENTS.find(a => a.id === id);
  if (accent) {
    document.documentElement.style.setProperty('--accent', accent.value);
    // Update accent-light and accent-glow
    const r = parseInt(accent.value.slice(1, 3), 16);
    const g = parseInt(accent.value.slice(3, 5), 16);
    const b = parseInt(accent.value.slice(5, 7), 16);
    document.documentElement.style.setProperty('--accent-light', `rgba(${r},${g},${b},0.08)`);
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.15)`);
    addRecent('change-accent');
    closePalette();
    showToast('Change Accent Color…');
  }
}

// Override executeCommand for accents
const _origExecute = executeCommand;
executeCommand = function(id) {
  if (id.startsWith('accent-')) {
    selectAccent(id);
    return;
  }
  _origExecute(id);
};

// Toast
function showToast(title) {
  const container = $('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('data-toast', title);
  toast.textContent = title;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('exiting');
    const anim = toast.animate(
      [{ opacity: 1, transform: 'translateY(0) scale(1)' }, { opacity: 0, transform: 'translateY(12px) scale(0.96)' }],
      { duration: reducedMotion ? 50 : 300, easing: 'ease' }
    );
    anim.onfinish = () => {
      toast.remove();
    };
  }, 3000);
}

// Note selection
function selectNote(el, name) {
  document.querySelectorAll('.note-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  $('note-title').textContent = name;
}

document.querySelectorAll('.note-item').forEach(el => {
  el.addEventListener('click', () => selectNote(el, el.textContent));
});

// Global keyboard handler
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (paletteOpen) {
      closePalette();
    } else {
      openPalette();
    }
  }
});

// Open button
$('open-palette').addEventListener('click', () => {
  if (paletteOpen) {
    closePalette();
  } else {
    openPalette();
  }
});

// Initialize
loadRecents();
</script>
</body>
</html>
```