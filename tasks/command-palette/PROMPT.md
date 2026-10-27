# Task: Commander — a command palette with fuzzy search and motion design

Build a small notes-app shell whose star feature is a polished, keyboard-first command
palette (think the ⌘K palettes of Linear, Raycast or VS Code), with real fuzzy ranking,
proper accessibility semantics and refined motion.

## Ground rules

- Deliver **one file: `index.html`** with all HTML, CSS and JavaScript inline.
- **No external resources of any kind**: no CDNs, libraries, frameworks, web fonts or remote
  images. Everything must be written by you or generated in code. Network access is blocked
  during grading.
- Target: latest desktop Google Chrome at a 1280×800 viewport; adapt to window resizing.
- No errors in the console. Never use `alert`, `confirm` or `prompt`.
- The page starts with an empty `localStorage` (fresh browser profile).
- You are scored two ways:
  1. **Automated grader**: a headless browser drives your page through the *Grader contract*
     below, using real mouse and keyboard input, and measures correctness, robustness and
     performance. Follow the contract exactly (ids, attributes and names are case-sensitive).
  2. **Blind human judging**: your page is shown side by side with other submissions; people
     use both and pick the better one on visual design, motion quality and overall feel.

## Requirements

### App shell
- A sidebar listing notes and an editor area showing the current note (a `<textarea>` or a
  contenteditable element). Static sample content is fine, but it should look like a real,
  well-designed app. Starts in the **light** theme.
- A visible button that opens the palette (showing its ⌘K / Ctrl K hint).

### Opening & closing
- **Ctrl+K** and **Cmd+K** open the palette from anywhere, including while typing in the
  editor. Pressing the shortcut again, pressing **Escape**, or clicking outside the palette
  panel closes it.
- On open the search input is focused. Focus is **trapped** inside the palette while it is
  open, and **returns** to the previously focused element when it closes.

### Results
- Empty query: a **Recent** group (up to 5 most recently executed commands, most recent
  first; hidden when there are none) followed by all commands grouped by `group`, in the
  order given below. Recent commands also stay in their normal group. Recents persist in
  `localStorage`.
- With a query: a flat ranked list (no groups), at most 50 results.
- **Fuzzy matching**: case-insensitive subsequence matching against the title, and also
  against the keywords (title matches rank above keyword-only matches). Ranking should
  favor, roughly in this order: exact and prefix matches, matches at word starts (`tdm` →
  "Toggle Dark Mode"), contiguous runs, then shorter titles; remaining ties keep the
  original order. Matched characters in titles are wrapped in `<mark>`.
- An empty state when nothing matches.

### Keyboard & mouse
- **ArrowDown/ArrowUp** move the active item, wrapping around at the ends; **Home/End** jump
  to the first/last item; **Enter** executes the active item. Hovering an item makes it
  active; clicking executes it. The active item is always scrolled into view. Whenever the
  query changes, the first result becomes active.

### Commands
- Executing a command closes the palette (unless it opens a sub-page) and shows a toast
  with the command's title, which auto-dismisses after ~3 s with an exit animation. Toasts
  stack.
- Real effects:
  - **Toggle Dark Mode** switches the whole app between light and dark themes with a smooth
    transition.
  - **Change Accent Color…** opens a *sub-page* inside the palette listing the accent colors
    below (query cleared, a breadcrumb/chip shows the page name, results filterable).
    Picking one sets the CSS custom property `--accent` on `<html>`, which the UI uses
    throughout, closes the palette and records "Change Accent Color…" in Recent.
    **Backspace** on an empty query or **Escape** returns from the sub-page to the root list.
  - **New Note** adds a note to the sidebar.
- Shortcut hints are shown as keycaps on the right of items (`Mod` = ⌘ on macOS, Ctrl
  elsewhere). Implementing the shortcuts themselves is optional.

### Motion
- The palette opens with a quick scale + fade (150–250 ms) and closes with an exit
  animation; the list height animates smoothly when the result count changes; the active
  highlight moves smoothly; toasts slide in and out.
- Implement motion with CSS transitions/animations or the Web Animations API.
- With `prefers-reduced-motion: reduce`, no movement or size animation at all (short opacity
  fades are fine).

### Data (use exactly these ids, titles, groups and order)

```js
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

// Sub-page "accent" (opened by change-accent)
const ACCENTS = [
  { id: "accent-indigo",  title: "Indigo",  value: "#5b5bd6" },
  { id: "accent-emerald", title: "Emerald", value: "#10b981" },
  { id: "accent-rose",    title: "Rose",    value: "#e11d48" },
  { id: "accent-amber",   title: "Amber",   value: "#f59e0b" },
  { id: "accent-sky",     title: "Sky",     value: "#0ea5e9" },
];
```

### Polish (judged by humans)
- Premium feel: beautiful typography and spacing, crisp keycaps, soft shadows/backdrop,
  tasteful motion, a carefully designed dark theme too.

## Grader contract

1. The open palette is an element with `role="dialog"` and `aria-modal="true"`. When closed
   (after any exit animation, which must finish within 400 ms), it is removed from the DOM or
   hidden with `display: none`, `hidden` or `visibility: hidden`.
2. The search input has `role="combobox"`, `aria-expanded="true"`, `aria-controls` set to the
   id of the `role="listbox"` element, and `aria-activedescendant` set to the id of the
   active option.
3. Each result is an element with `role="option"`, a unique `id`, `data-command="<command id>"`
   (e.g. `data-command="toggle-dark-mode"`, `data-command="accent-emerald"`), and
   `aria-selected="true"` on the active option only. Group headings are not options.
4. The empty state is an element `#palette-empty`, visible only when there are no results.
5. Each toast is an element with a `data-toast` attribute containing the command title, in a
   `role="status"` or `aria-live="polite"` region, removed or hidden once dismissed.
6. Theme: `document.documentElement.dataset.theme` is `"light"` or `"dark"` (initially
   `"light"`), and the page background visibly changes with it.
7. Accent: `getComputedStyle(document.documentElement).getPropertyValue('--accent')` changes
   when an accent is picked.
8. Sidebar notes are elements with a `data-note` attribute (one per note).
9. The editor element has `id="editor"`; the palette's open button has `id="open-palette"`.
10. Motion is measured through `document.getAnimations()`, so use CSS transitions/animations
    or the Web Animations API, not JS-driven per-frame style changes.
