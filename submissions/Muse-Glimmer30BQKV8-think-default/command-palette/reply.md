```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<title>Commander</title>
<style>
:root{
  --accent:#5b5bd6;
  --bg:#ffffff;
  --fg:#111111;
  --muted:#666;
  --panel-bg:#fff;
  --border:#e5e5e5;
  --hover:#f5f5f5;
  --active:#eef;
}
[data-theme="dark"]{
  --bg:#0f1115;
  --fg:#e6e8ee;
  --muted:#9aa4b2;
  --panel-bg:#1a1e27;
  --border:#2a313d;
  --hover:#242b38;
  --active:#2a3550;
}
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--fg);transition:background 300ms,color 300ms}
#app{height:100%;display:flex;flex-direction:column}
header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border)}
h1{margin:0;font-size:18px;font-weight:600}
#open-palette{padding:6px 10px;border-radius:8px;border:1px solid var(--border);background:var(--panel-bg);cursor:pointer}
#layout{flex:1;display:flex;min-height:0}
#sidebar{width:260px;border-right:1px solid var(--border);padding:8px;overflow:auto;background:var(--panel-bg)}
.note-item{padding:8px 10px;border-radius:6px;margin:2px 0;cursor:pointer}
.note-item:hover,.note-item.selected{background:var(--hover)}
main{flex:1;display:flex;flex-direction:column;min-width:0}
#editor{flex:1;margin:0;padding:16px;font:14px/1.6 ui-monospace,monospace;background:transparent;color:var(--fg);border:none;outline:none;resize:none}
#palette{position:fixed;inset:0;display:flex;align-items:flex-start;justify-content:center;pointer-events:none}
#palette[hidden]{display:none}
.palette-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(6px);opacity:0;transition:opacity 200ms}
#palette.open .palette-backdrop{opacity:1}
.palette-panel{position:relative;margin-top:20vh;width:min(640px,92vw);background:var(--panel-bg);border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.3);transform:scale(.96);opacity:0;transition:transform 200ms cubic-bezier(.2,.8,.2,1),opacity 200ms;pointer-events:auto}
#palette.open .palette-panel{transform:scale(1);opacity:1}
.palette-header{padding:12px;border-bottom:1px solid var(--border)}
#palette-input{width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--fg);font-size:15px;outline:none}
#palette-breadcrumb{margin-top:6px;font-size:12px;color:var(--muted)}
#palette-listbox{max-height:50vh;overflow:auto;padding:6px}
.group-heading{padding:6px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-top:6px}
.option{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:8px;cursor:pointer;transition:background 150ms}
.option:hover,.option.active{background:var(--hover)}
.option.active{background:var(--active)}
.option-title{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
mark{background:color-mix(in srgb,var(--accent) 30%,transparent);padding:0 2px;border-radius:3px}
.shortcut{font-size:11px;padding:2px 6px;border:1px solid var(--border);border-radius:4px;background:var(--hover);font-family:monospace}
#palette-empty{padding:24px;text-align:center;color:var(--muted)}
#toast-container{position:fixed;bottom:24px;right:24px;z-index:10000}
.toast{background:var(--panel-bg);color:var(--fg);padding:10px 14px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.2);margin-top:8px;transform:translateY(20px);opacity:0;transition:transform 200ms,opacity 200ms}
.toast.show{transform:translateY(0);opacity:1}
.color-swatch{width:16px;height:16px;border-radius:4px;display:inline-block;margin-left:8px}
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
</style>
</head>
<body>
<div id="app">
  <header>
    <h1>Notes</h1>
    <button id="open-palette">⌘K</button>
  </header>
  <div id="layout">
    <aside id="sidebar"></aside>
    <main>
      <textarea id="editor" placeholder="Select a note…"></textarea>
    </main>
  </div>
</div>

<div id="palette" role="dialog" aria-modal="true" hidden>
  <div class="palette-backdrop"></div>
  <div class="palette-panel">
    <div class="palette-header">
      <input id="palette-input" role="combobox" aria-expanded="true" aria-controls="palette-listbox" aria-activedescendant="" placeholder="Type a command or search…" autocomplete="off"/>
      <div id="palette-breadcrumb"></div>
    </div>
    <div id="palette-listbox" role="listbox"></div>
    <div id="palette-empty" hidden>No results</div>
  </div>
</div>

<div id="toast-container" role="status" aria-live="polite"></div>

<script>
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

const isMac = navigator.platform.toUpperCase().includes('MAC');
const palette = document.getElementById('palette');
const input = document.getElementById('palette-input');
const listbox = document.getElementById('palette-listbox');
const emptyState = document.getElementById('palette-empty');
const breadcrumb = document.getElementById('palette-breadcrumb');
const toastContainer = document.getElementById('toast-container');
const editor = document.getElementById('editor');
const sidebar = document.getElementById('sidebar');
const openBtn = document.getElementById('open-palette');

let page = 'root';
let query = '';
let selectedIndex = -1;
let optionElements = [];
let recent = [];
try{ recent = JSON.parse(localStorage.getItem('commander_recent')||'[]'); }catch{}
let lastFocused = null;
let notes = [
  {id:'note-1', title:'Welcome', content:'Welcome to Commander. Press ⌘K to open the palette.'},
  {id:'note-2', title:'Ideas', content:'- First idea\n- Second idea'},
  {id:'note-3', title:'Tasks', content:'[ ] Buy milk\n[ ] Write code'}
];

function findPositions(text, query){
  let ti=0; const pos=[];
  for(let i=0;i<query.length;i++){
    const ch=query[i]; let found=-1;
    for(let j=ti;j<text.length;j++){ if(text[j]===ch){found=j;ti=j+1;break;} }
    if(found===-1) return null;
    pos.push(found);
  }
  return pos;
}
function computeScore(text,query,positions){
  let score=0;
  if(text===query) score+=1000;
  else if(text.startsWith(query)) score+=500;
  for(const p of positions){ if(p===0||/[\s\-_\/]/.test(text[p-1])) score+=50; }
  for(let i=1;i<positions.length;i++){ if(positions[i]===positions[i-1]+1) score+=30; }
  score -= text.length*0.2;
  return score;
}
function matchCommand(cmd,q){
  const ql=q.toLowerCase();
  const tl=cmd.title.toLowerCase();
  const tpos=findPositions(tl,ql);
  if(tpos){ return {score:computeScore(tl,ql,tpos)+200, positions:tpos, isTitle:true}; }
  if(cmd.keywords){
    let best=null;
    for(const kw of cmd.keywords){
      const kl=kw.toLowerCase();
      const p=findPositions(kl,ql);
      if(p){ const s=computeScore(kl,ql,p); if(!best||s>best.score) best={score:s}; }
    }
    if(best) return {score:best.score, positions:null, isTitle:false};
  }
  return null;
}
function highlight(text,positions){
  if(!positions||!positions.length) return text;
  let out=''; let last=0;
  for(const p of positions){ out+=text.slice(last,p)+'<mark>'+text[p]+'</mark>'; last=p+1; }
  return out+text.slice(last);
}
function formatShortcut(s){ return s.replace('Mod', isMac?'⌘':'Ctrl'); }

function recordRecent(id){
  recent = recent.filter(x=>x!==id);
  recent.unshift(id);
  recent = recent.slice(0,5);
  localStorage.setItem('commander_recent', JSON.stringify(recent));
}
function showToast(title){
  const t=document.createElement('div');
  t.className='toast'; t.setAttribute('data-toast',title); t.textContent=title;
  toastContainer.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{ t.classList.remove('show'); t.addEventListener('transitionend',()=>t.remove(),{once:true}); },3000);
}
function setActive(idx){
  selectedIndex=idx;
  optionElements.forEach((el,i)=>{ const a=i===idx; el.setAttribute('aria-selected', a?'true':'false'); el.classList.toggle('active',a); });
  input.setAttribute('aria-activedescendant', idx>=0?optionElements[idx].id:'');
  if(idx>=0) optionElements[idx].scrollIntoView({block:'nearest'});
}
function moveSelection(delta){
  if(!optionElements.length) return;
  let i=selectedIndex<0?0:selectedIndex;
  i=(i+delta+optionElements.length)%optionElements.length;
  setActive(i);
}
function createOption(cmd,match){
  const el=document.createElement('div');
  el.setAttribute('role','option');
  el.id='option-'+optionElements.length;
  el.setAttribute('data-command',cmd.id);
  el.className='option';
  let title=cmd.title;
  if(match && match.isTitle && match.positions) title=highlight(cmd.title,match.positions);
  const span=document.createElement('span'); span.className='option-title'; span.innerHTML=title; el.appendChild(span);
  if(cmd.shortcut){ const k=document.createElement('span'); k.className='shortcut'; k.textContent=formatShortcut(cmd.shortcut); el.appendChild(k); }
  el.addEventListener('click',()=>executeCommand(cmd));
  el.addEventListener('mouseenter',()=>{ const idx=optionElements.indexOf(el); setActive(idx); });
  optionElements.push(el);
  return el;
}
function executeCommand(cmd){
  if(cmd.id==='change-accent'){
    page='accent'; query=''; input.value=''; breadcrumb.textContent='Accent Colors'; render(); return;
  }
  if(cmd.id==='toggle-dark-mode') toggleDarkMode();
  else if(cmd.id==='new-note') addNewNote();
  recordRecent(cmd.id);
  showToast(cmd.title);
  closePalette();
}
function toggleDarkMode(){
  const h=document.documentElement;
  h.dataset.theme = h.dataset.theme==='dark'?'light':'dark';
}
function render(){
  optionElements=[]; listbox.innerHTML=''; emptyState.hidden=true;
  breadcrumb.textContent = page==='accent' ? 'Accent Colors' : '';
  if(page==='accent'){
    const items=ACCENTS.filter(a=>{ if(!query) return true; return findPositions(a.title.toLowerCase(), query.toLowerCase())!==null; });
    if(!items.length){ emptyState.hidden=false; return; }
    items.forEach(a=>{
      const el=document.createElement('div');
      el.setAttribute('role','option'); el.id='option-'+optionElements.length; el.setAttribute('data-command',a.id); el.className='option';
      const title=highlight(a.title, findPositions(a.title.toLowerCase(), query.toLowerCase()));
      el.innerHTML=`<span class="option-title">${title}</span><span class="color-swatch" style="background:${a.value}"></span>`;
      el.addEventListener('click',()=>{ document.documentElement.style.setProperty('--accent',a.value); recordRecent('change-accent'); showToast(a.title); closePalette(); });
      el.addEventListener('mouseenter',()=>{ const idx=optionElements.indexOf(el); setActive(idx); });
      optionElements.push(el); listbox.appendChild(el);
    });
  }else{
    if(!query){
      if(recent.length){ const h=document.createElement('div'); h.className='group-heading'; h.textContent='Recent'; listbox.appendChild(h); recent.forEach(id=>{ const c=COMMANDS.find(x=>x.id===id); if(c){ listbox.appendChild(createOption(c)); } }); }
      const groups=[]; COMMANDS.forEach(c=>{ if(!groups.includes(c.group)) groups.push(c.group); });
      groups.forEach(g=>{ const h=document.createElement('div'); h.className='group-heading'; h.textContent=g; listbox.appendChild(h); COMMANDS.filter(c=>c.group===g).forEach(c=>{ listbox.appendChild(createOption(c)); }); });
    }else{
      const matches=[]; COMMANDS.forEach((c,i)=>{ const m=matchCommand(c,query); if(m) matches.push({cmd:c,m,idx:i}); });
      matches.sort((a,b)=> b.m.score!==a.m.score ? b.m.score-a.m.score : a.idx-b.idx);
      const limited=matches.slice(0,50);
      if(!limited.length){ emptyState.hidden=false; return; }
      limited.forEach(it=> listbox.appendChild(createOption(it.cmd,it.m)));
    }
  }
  selectedIndex = optionElements.length?0:-1; setActive(selectedIndex);
}
function openPalette(){
  lastFocused=document.activeElement;
  palette.hidden=false; requestAnimationFrame(()=>palette.classList.add('open'));
  page='root'; query=''; input.value=''; breadcrumb.textContent=''; render(); input.focus();
}
function closePalette(){
  palette.classList.remove('open');
  setTimeout(()=>{ palette.hidden=true; palette.classList.remove('open'); },200);
  if(lastFocused && lastFocused.focus) lastFocused.focus();
}
function goBack(){ page='root'; query=''; input.value=''; breadcrumb.textContent=''; render(); }
function renderSidebar(){
  sidebar.innerHTML='';
  notes.forEach(n=>{ const el=document.createElement('div'); el.className='note-item'; el.setAttribute('data-note',n.id); el.textContent=n.title; el.addEventListener('click',()=>selectNote(n.id)); sidebar.appendChild(el); });
}
function selectNote(id){ const n=notes.find(x=>x.id===id); if(n){ editor.value=n.content; document.querySelectorAll('.note-item').forEach(e=>e.classList.toggle('selected', e.dataset.note===id)); } }
function addNewNote(){ const id='note-'+Date.now(); const n={id,title:'Untitled',content:''}; notes.push(n); renderSidebar(); selectNote(id); }

openBtn.addEventListener('click',openPalette);
input.addEventListener('input',e=>{ query=e.target.value; render(); });
input.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'){ e.preventDefault(); moveSelection(1); }
  else if(e.key==='ArrowUp'){ e.preventDefault(); moveSelection(-1); }
  else if(e.key==='Home'){ e.preventDefault(); setActive(0); }
  else if(e.key==='End'){ e.preventDefault(); setActive(optionElements.length-1); }
  else if(e.key==='Escape'){ if(page!=='root') goBack(); else closePalette(); }
  else if(e.key==='Backspace'){ if(!query && page!=='root'){ e.preventDefault(); goBack(); } }
  else if(e.key==='Enter'){ e.preventDefault(); if(selectedIndex>=0){ optionElements[selectedIndex].click(); } }
});
palette.addEventListener('click',e=>{ if(e.target===palette||e.target.classList.contains('palette-backdrop')) closePalette(); });
palette.addEventListener('keydown',e=>{ if(e.key==='Tab'){ e.preventDefault(); input.focus(); } });
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); if(palette.hidden) openPalette(); else closePalette(); }
});

renderSidebar(); selectNote(notes[0].id);
</script>
</body>
</html>
```