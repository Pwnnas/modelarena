// Arena dashboard: hash-routed views over /api/state.
//   #/standings            ranked table
//   #/tasks/<id>[/<model>] task brief, prompt and every graded submission
//   #/judge[/<task>]       blind side-by-side voting
const app = document.getElementById('app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (n, d = 1) => (n == null ? '—' : Number(n).toFixed(d));
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const num = (n) => Math.round(n).toLocaleString('en-US');
const kTok = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : String(Math.round(n)));
function dur(ms) {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${(ms / 1000).toFixed(1)} s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(s / 3600)}h ${String(Math.floor(s / 60) % 60).padStart(2, '0')}m`;
}

let S = null;
const J = { filter: 'any', pair: null, revealed: false, busy: false, last: null, guardUntil: 0 };

async function refresh() {
  const res = await fetch('/api/state');
  S = await res.json();
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast-msg';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.append(el);
  setTimeout(() => el.remove(), 2200);
}

const task = (id) => S.tasks.find((t) => t.id === id);
const result = (m, t) => S.results[m]?.[t];
const resultUrl = (m, t, rel) => `/results/${encodeURIComponent(m)}/${t}/${rel}`;
const glyph = (score) => `<span class="glyph ${score >= 0.999 ? 'pass' : score > 0 ? 'partial' : 'fail'}" aria-label="${score >= 0.999 ? 'passed' : score > 0 ? 'partial' : 'failed'}"></span>`;

// ── Standings ────────────────────────────────────────────────────────────
function standingsView() {
  if (!S.models.length) {
    return `<h1>Standings</h1>
      <div class="empty">No submissions yet. Give a model a task prompt, save its page as
      <span class="path">submissions/&lt;model&gt;/&lt;task&gt;/index.html</span>, then run <code>npm run grade</code>.</div>`;
  }
  const head = S.tasks
    .map((t) => `<th class="num task-col" title="${esc(t.subtitle)}">${esc(t.title)}</th>`)
    .join('');
  const anyRun = S.models.some((m) => S.runTotals?.[m]);
  const genHead = anyRun
    ? `<th class="num" title="Totals over the tasks generated with arena.mjs run: wall time, output tokens (thinking included) and generation speed">Generation</th>`
    : '';
  const genCell = (m) => {
    const g = S.runTotals?.[m];
    if (!anyRun) return '';
    if (!g) return `<td class="num"><span class="none">—</span></td>`;
    const est = g.estimated ? '~' : '';
    const tip = `${g.tasks} task(s), ${num(g.completionTokens)} output tokens${g.reasoningTokens ? `, ${num(g.reasoningTokens)} thinking` : ''}${g.truncated ? `, ${g.truncated} cut off at the token limit` : ''}`;
    return `<td class="num" title="${esc(tip)}"><span class="mid">${dur(g.wallMs)}</span>
      <small class="cell-sub">${est}${kTok(g.completionTokens)} tok${g.genTokensPerSec ? ` · ${g.genTokensPerSec} tok/s` : ''}</small></td>`;
  };
  const rows = S.board
    .map((r) => {
      const cells = S.tasks
        .map((t) => {
          const s = r.scores[t.id];
          const has = S.available[r.model]?.includes(t.id);
          if (s == null) return `<td class="num task-col"><span class="none">${has ? 'not graded' : '—'}</span></td>`;
          return `<td class="num task-col"><a href="#/tasks/${t.id}/${encodeURIComponent(r.model)}">
            <span class="cell-score">${fmt(s, 0)}</span><div class="meter"><i style="width:${s}%"></i></div></a></td>`;
        })
        .join('');
      const pref =
        r.preference == null
          ? `<span class="none">—</span><small class="muted" style="display:block;font-size:12px">${r.record.games}/${S.minVotes} votes</small>`
          : `<span class="mid">${fmt(r.preference)}</span><small class="muted" style="display:block;font-size:12px">Elo ${r.elo}, ${r.record.wins}–${r.record.losses}–${r.record.ties}</small>`;
      return `<tr>
        <td class="rank">${r.rank}</td>
        <td class="model">${esc(r.model)}<small>${r.attempted} of ${r.of} tasks</small></td>
        <td class="num"><span class="big">${fmt(r.arena)}</span></td>
        <td class="num"><span class="mid">${fmt(r.auto)}</span></td>
        <td class="num">${pref}</td>
        ${cells}
        ${genCell(r.model)}
      </tr>`;
    })
    .join('');
  const w = S.weights;
  return `<h1>Standings</h1>
    <p class="lede">Each model builds the same six browser apps from identical prompts. Click a score to see what passed, what failed and a recording of the app.</p>
    <div class="standings-wrap"><table class="standings">
      <thead><tr><th>#</th><th>Model</th><th class="num">Arena</th><th class="num">Auto</th><th class="num">Preference</th>${head}${genHead}</tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <section class="explain" aria-label="How scoring works">
      <div><h3>Auto</h3><p>The mean task score from the automated grader. A headless Chrome drives every page with real mouse, keyboard and audio instrumentation, and awards partial credit per check. Tasks a model skipped count as 0.</p></div>
      <div><h3>Preference</h3><p>From blind side-by-side votes on the Judge page, fitted with Bradley–Terry (order-independent Elo). Shown as the expected win rate against an average model, after ${S.minVotes} votes.</p></div>
      <div><h3>Arena</h3><p>${Math.round(w.auto * 100)}% Auto plus ${Math.round(w.preference * 100)}% Preference once a model has enough votes, otherwise Auto alone. Automated checks are objective; human votes judge what they can't measure: beauty and feel.</p></div>
    </section>`;
}

// ── Tasks ────────────────────────────────────────────────────────────────
function tasksView(id, focusModel) {
  const t = task(id) ?? S.tasks[0];
  const rail = S.tasks
    .map((x) => {
      const best = Math.max(...S.models.map((m) => result(m, x.id)?.score ?? -1));
      return `<a href="#/tasks/${x.id}" ${x.id === t.id ? 'aria-current="page"' : ''}>
        <span class="t">${esc(x.title)}</span><span class="best">${best >= 0 ? fmt(best, 0) : ''}</span><span class="s">${esc(x.subtitle)}</span></a>`;
    })
    .join('');
  const models = S.models
    .filter((m) => S.available[m]?.includes(t.id))
    .sort((a, b) => (result(b, t.id)?.score ?? -1) - (result(a, t.id)?.score ?? -1));
  const subs = models.length
    ? models.map((m) => submissionCard(t, m, m === focusModel)).join('')
    : `<div class="empty">No submissions for this task yet. Copy the prompt, give it to a model and save the page it makes as
       <span class="path">submissions/&lt;model&gt;/${t.id}/index.html</span>.</div>`;
  const pts = t.checks.reduce((s, c) => s + c.points, 0);
  return `<div class="tasks-layout">
    <nav class="task-rail" aria-label="Tasks">${rail}</nav>
    <div>
      <div class="task-head">
        <div>
          <h1>${esc(t.title)}</h1>
          <p class="muted" style="margin:0 0 8px;font-weight:500">${esc(t.subtitle)}, ${t.checks.length} checks, ${pts} points</p>
          <p style="margin:0;max-width:72ch">${esc(t.summary)}</p>
          <ul class="skills">${(t.skills ?? []).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
        </div>
        <div class="task-actions">
          <button class="btn primary" data-action="copy-prompt" data-task="${t.id}">Copy prompt</button>
          <button class="btn" data-action="toggle-prompt" aria-expanded="false" aria-controls="prompt">Show prompt</button>
        </div>
      </div>
      <pre class="prompt" id="prompt" hidden>${esc(t.prompt)}</pre>
      <div class="subs">${subs}</div>
    </div>
  </div>`;
}

// How the page was generated, when it came from `arena.mjs run` (or a
// hand-written run.json).
function runStats(m, tid) {
  const r = S.runs?.[m]?.[tid];
  if (!r) return '';
  const est = r.tokensEstimated ? '~' : '';
  const items = [
    ['Time', dur(r.wallMs)],
    ['Tokens', est + num(r.completionTokens ?? 0)],
    r.reasoningTokens ? ['Thinking', est + num(r.reasoningTokens)] : null,
    r.genTokensPerSec ? ['Speed', `${r.genTokensPerSec} tok/s`] : null,
    r.ttftMs != null ? ['First token', dur(r.ttftMs)] : null,
    r.promptTokensPerSec ? ['Prompt', `${r.promptTokensPerSec} tok/s`] : null,
  ].filter(Boolean);
  const params = Object.entries(r.params ?? {}).map(([k, v]) => `${k} ${typeof v === 'object' ? JSON.stringify(v) : v}`);
  const src = [r.servedModel ?? r.apiModel, r.endpoint, ...params].filter(Boolean).join(' · ');
  const live = S.urls[m]?.[tid] ?? '';
  const file = (name) => esc(live.replace(/index\.html$/, name));
  const links = [r.replyChars ? `<a href="${file('reply.md')}" target="_blank" rel="noopener">reply</a>` : '', r.reasoningChars ? `<a href="${file('thinking.md')}" target="_blank" rel="noopener">thinking</a>` : '']
    .filter(Boolean)
    .join(' · ');
  const warn = r.finishReason === 'length' ? `<p class="run-warn">Cut off at the token limit, so the page is incomplete. Raise --max-tokens or the server's context size.</p>` : '';
  return `<dl class="run">${items.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    <p class="run-src">${esc(src)}${links && live ? ` · ${links}` : ''}</p>${warn}`;
}

function submissionCard(t, m, focused) {
  const r = result(m, t.id);
  const live = S.urls[m]?.[t.id];
  if (!r) {
    return `<article class="sub" id="sub-${esc(m)}"><div class="sub-media"></div><div class="sub-body">
      <div class="sub-top"><span class="model">${esc(m)}</span></div>
      <p class="muted">Submitted but not graded yet. Run <code>npm run grade</code>.</p>${runStats(m, t.id)}
      <div class="sub-links"><a class="btn" href="${esc(live)}" target="_blank" rel="noopener">Open live</a></div></div></article>`;
  }
  const shots = r.media?.shots ?? [];
  const hero = shots[0] ? resultUrl(m, t.id, shots[0]) : '';
  const media = r.media?.video
    ? `<video controls muted loop playsinline preload="metadata" poster="${hero}" src="${resultUrl(m, t.id, r.media.video)}"></video>`
    : hero ? `<img class="hero" src="${hero}" alt="Screenshot of ${esc(m)}'s ${esc(t.title)}">` : '';
  const thumbs = shots.length > 1 || r.media?.video
    ? `<div class="thumbs">${r.media?.video ? `<button data-action="show-video" aria-pressed="true" title="Showcase video"><img src="${hero}" alt="Video"></button>` : ''}
       ${shots.map((s) => `<button data-action="show-shot" data-src="${resultUrl(m, t.id, s)}" aria-pressed="false" title="${esc(s.replace(/^shots\/\d+-|\.png$/g, ''))}"><img loading="lazy" src="${resultUrl(m, t.id, s)}" alt=""></button>`).join('')}</div>`
    : '';
  const checks = r.checks
    .map((c) => {
      const parts = c.parts.length
        ? `<ul class="parts">${c.parts.map((p) => `<li>${glyph(p.score)}<span>${esc(p.label)}${p.note ? `<span class="note">${esc(p.note)}</span>` : ''}</span></li>`).join('')}</ul>`
        : '';
      const notes = [c.error && `Error: ${c.error}`, ...(c.notes ?? [])].filter(Boolean);
      const noteList = notes.length ? `<ul class="parts">${notes.map((n) => `<li><span></span><span class="note">${esc(n)}</span></li>`).join('')}</ul>` : '';
      const shot = c.shot ? `<a href="${resultUrl(m, t.id, c.shot)}" target="_blank" rel="noopener"><img class="fail-shot" loading="lazy" src="${resultUrl(m, t.id, c.shot)}" alt="Page state after the ${esc(c.title)} check"></a>` : '';
      return `<li class="${c.category === 'health' ? 'health' : ''}"><details>
        <summary>${glyph(c.score)}<span>${esc(c.title)}</span><span class="pts">${fmt(c.earned, c.earned % 1 ? 1 : 0)} / ${c.points}</span></summary>
        ${parts}${noteList}${shot}</details></li>`;
    })
    .join('');
  const when = new Date(r.gradedAt).toLocaleString();
  return `<article class="sub" id="sub-${esc(m)}" ${focused ? 'data-focus="1"' : ''}>
    <div class="sub-media">${media}${thumbs}</div>
    <div class="sub-body">
      <div class="sub-top"><span class="model">${esc(m)}</span><span class="big">${fmt(r.score)}</span><span class="of">/ 100</span></div>
      <div class="sub-meta">Graded ${esc(when)} in ${Math.round(r.durationMs / 1000)} s, ${(r.submission.bytes / 1024).toFixed(0)} KB page, Chrome ${esc(r.browser)}</div>
      ${runStats(m, t.id)}
      <div class="sub-links">
        <a class="btn" href="${esc(live)}" target="_blank" rel="noopener">Open live</a>
      </div>
      <ul class="checks">${checks}</ul>
    </div>
  </article>`;
}

// ── Judge ────────────────────────────────────────────────────────────────
const pairKey = (t, x, y) => `${t}|${[x, y].sort().join('|')}`;

function judgeableTasks() {
  return S.tasks.filter((t) => S.models.filter((m) => S.available[m]?.includes(t.id)).length >= 2);
}

// Prefer the least-judged pairing so votes spread evenly; sides are random so
// position bias averages out.
function nextPair() {
  const tasks = judgeableTasks().filter((t) => J.filter === 'any' || t.id === J.filter);
  const counts = new Map();
  for (const v of S.votes) counts.set(pairKey(v.task, v.a, v.b), (counts.get(pairKey(v.task, v.a, v.b)) ?? 0) + 1);
  const pool = [];
  for (const t of tasks) {
    const ms = S.models.filter((m) => S.available[m]?.includes(t.id));
    for (let i = 0; i < ms.length; i++)
      for (let j = i + 1; j < ms.length; j++) pool.push({ task: t.id, x: ms[i], y: ms[j], n: counts.get(pairKey(t.id, ms[i], ms[j])) ?? 0 });
  }
  if (!pool.length) return null;
  const min = Math.min(...pool.map((p) => p.n));
  let best = pool.filter((p) => p.n === min);
  const fresh = best.filter((p) => pairKey(p.task, p.x, p.y) !== J.last);
  if (fresh.length) best = fresh;
  const p = best[Math.floor(Math.random() * best.length)];
  return Math.random() < 0.5 ? { task: p.task, a: p.x, b: p.y } : { task: p.task, a: p.y, b: p.x };
}

function judgeView(filter) {
  J.filter = filter && task(filter) ? filter : 'any';
  const valid = J.pair && S.urls[J.pair.a]?.[J.pair.task] && S.urls[J.pair.b]?.[J.pair.task] && (J.filter === 'any' || J.pair.task === J.filter);
  // A re-render after voting (e.g. leaving and coming back) would show a
  // disabled ballot without the reveal overlay, so deal a fresh pair instead.
  if (!valid || J.revealed) {
    J.pair = nextPair();
    J.revealed = false;
  }
  const judgeable = new Set(judgeableTasks().map((t) => t.id));
  const seg = [`<button data-action="filter" data-task="any" aria-pressed="${J.filter === 'any'}">Any task</button>`]
    .concat(S.tasks.map((t) => `<button data-action="filter" data-task="${t.id}" aria-pressed="${J.filter === t.id}" ${judgeable.has(t.id) ? '' : 'disabled title="Needs two models with a submission"'}>${esc(t.title)}</button>`))
    .join('');
  const top = `<div class="judge-top"><h2>Judge</h2><div class="seg" role="group" aria-label="Task">${seg}</div>
    <span class="count">${plural(S.votes.length, 'vote')} cast</span></div>`;
  if (!J.pair) {
    return `<div class="judge">${top}<div class="empty">Judging needs at least two models with a submission for the same task.
      Add another model under <span class="path">submissions/</span> and reload.</div></div>`;
  }
  const t = task(J.pair.task);
  const pane = (side) => `<div class="pane ${side}" data-side="${side}">
      <div class="pane-head"><span class="corner">${side.toUpperCase()}</span><span class="label">Contender ${side.toUpperCase()}</span>
        <span class="tools"><button class="icon-btn" data-action="reload" data-side="${side}">Reload</button>
        <button class="icon-btn" data-action="expand" data-side="${side}" aria-pressed="false">Full screen</button></span></div>
      <div class="screen"><iframe title="Contender ${side.toUpperCase()}" src="${esc(S.urls[J.pair[side]][J.pair.task])}" allow="autoplay; clipboard-read; clipboard-write"></iframe>
        <div class="reveal" data-reveal="${side}"></div></div>
    </div>`;
  return `<div class="judge" tabindex="-1">${top}
    <p class="brief"><strong>${esc(t.title)}, ${esc(t.subtitle.toLowerCase())}.</strong> ${esc(t.judging.join(' '))}
      Use both apps for a while before voting; each runs live at 1280×800.</p>
    <div class="duel">${pane('a')}${pane('b')}</div>
    <div class="ballot" id="ballot">
      <button class="vote-a" data-action="vote" data-winner="a" ${J.revealed ? 'disabled' : ''}>A is better <span class="kbd">1</span></button>
      <button data-action="vote" data-winner="tie" ${J.revealed ? 'disabled' : ''}>Tie <span class="kbd">3</span></button>
      <button data-action="vote" data-winner="bad" ${J.revealed ? 'disabled' : ''}>Both bad <span class="kbd">4</span></button>
      <button class="vote-b" data-action="vote" data-winner="b" ${J.revealed ? 'disabled' : ''}>B is better <span class="kbd">2</span></button>
    </div>
    <div class="judge-foot">
      <button class="icon-btn" data-action="next">${J.revealed ? 'Next pair' : 'Skip pair'} <span class="kbd">N</span></button>
      <button class="icon-btn" data-action="undo" ${S.votes.length ? '' : 'disabled'}>Undo last vote</button>
    </div>
  </div>`;
}

function fitScreens() {
  for (const screen of document.querySelectorAll('.screen')) {
    const pane = screen.closest('.pane');
    const iframe = screen.querySelector('iframe');
    if (pane.classList.contains('expanded')) {
      screen.style.height = '';
      iframe.style.transform = 'none';
      continue;
    }
    const w = screen.clientWidth;
    screen.style.height = `${(w * 800) / 1280}px`;
    iframe.style.transform = `scale(${w / 1280})`;
  }
}

async function vote(winner) {
  if (J.busy || J.revealed || !J.pair) return;
  J.busy = true;
  const before = Object.fromEntries(S.board.map((r) => [r.model, r.taskElo[J.pair.task]?.elo]));
  try {
    const res = await fetch('/api/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...J.pair, winner }) });
    if (!res.ok) throw new Error((await res.json()).error);
    S = await res.json();
  } catch (e) {
    toast(`Vote not saved: ${e.message}`);
    J.busy = false;
    return;
  }
  J.busy = false;
  J.revealed = true;
  J.last = pairKey(J.pair.task, J.pair.a, J.pair.b);
  const after = Object.fromEntries(S.board.map((r) => [r.model, r.taskElo[J.pair.task]?.elo]));
  for (const side of ['a', 'b']) {
    const m = J.pair[side];
    const el = document.querySelector(`[data-reveal="${side}"]`);
    const won = winner === side;
    const verdict = winner === 'tie' ? 'Tie' : winner === 'bad' ? 'Both bad' : won ? 'Preferred' : 'Not preferred';
    const d = (after[m] ?? 0) - (before[m] ?? 0);
    el.innerHTML = `<div><div class="who">${esc(m)}</div><div class="verdict">${verdict}</div><div class="delta">${d >= 0 ? '+' : ''}${d} on this task</div></div>`;
    el.classList.toggle('winner', won);
    requestAnimationFrame(() => el.classList.add('on'));
  }
  for (const b of document.querySelectorAll('#ballot button')) b.disabled = true;
  const next = document.querySelector('[data-action="next"]');
  next.innerHTML = 'Next pair <span class="kbd">N</span>';
  next.focus();
  document.querySelector('.count').textContent = `${plural(S.votes.length, 'vote')} cast`;
  document.querySelector('[data-action="undo"]').disabled = false;
}

// ── Router & events ──────────────────────────────────────────────────────
function render() {
  const [view = 'standings', a, b] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  for (const l of document.querySelectorAll('.nav a')) {
    if (l.dataset.view === view) l.setAttribute('aria-current', 'page');
    else l.removeAttribute('aria-current');
  }
  document.querySelector('.meta').textContent = `${plural(S.models.length, 'model')}, ${plural(S.tasks.length, 'task')}, ${plural(S.votes.length, 'vote')}`;
  app.innerHTML = view === 'tasks' ? tasksView(a, b) : view === 'judge' ? judgeView(a) : standingsView();
  if (view === 'judge') {
    fitScreens();
    guardFocus();
  }
  const focus = document.querySelector('[data-focus="1"]');
  if (focus) focus.scrollIntoView({ block: 'start', behavior: 'instant' });
  else window.scrollTo(0, 0);
}

app.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  if (action === 'copy-prompt') {
    await navigator.clipboard.writeText(task(el.dataset.task).prompt);
    toast('Prompt copied');
  } else if (action === 'toggle-prompt') {
    const p = document.getElementById('prompt');
    p.hidden = !p.hidden;
    el.setAttribute('aria-expanded', String(!p.hidden));
    el.textContent = p.hidden ? 'Show prompt' : 'Hide prompt';
  } else if (action === 'show-shot' || action === 'show-video') {
    const media = el.closest('.sub-media');
    const video = media.querySelector('video');
    let img = media.querySelector('img.hero');
    for (const b of media.querySelectorAll('.thumbs button')) b.setAttribute('aria-pressed', String(b === el));
    if (action === 'show-video') {
      img?.remove();
      if (video) video.hidden = false;
      return;
    }
    if (video) { video.pause(); video.hidden = true; }
    if (!img) {
      img = document.createElement('img');
      img.className = 'hero';
      img.alt = 'Screenshot';
      media.prepend(img);
    }
    img.src = el.dataset.src;
  } else if (action === 'filter') {
    J.pair = null;
    location.hash = el.dataset.task === 'any' ? '#/judge' : `#/judge/${el.dataset.task}`;
  } else if (action === 'vote') {
    vote(el.dataset.winner);
  } else if (action === 'next') {
    J.pair = null;
    J.revealed = false;
    render();
  } else if (action === 'undo') {
    S = await (await fetch('/api/vote/undo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json();
    toast('Last vote removed');
    J.revealed = false;
    render();
  } else if (action === 'reload') {
    const f = document.querySelector(`.pane.${el.dataset.side} iframe`);
    const src = f.src;
    f.src = 'about:blank';
    requestAnimationFrame(() => {
      f.src = src;
      guardFocus([f]);
    });
  } else if (action === 'expand') {
    const pane = el.closest('.pane');
    const on = !pane.classList.contains('expanded');
    pane.classList.toggle('expanded', on);
    el.setAttribute('aria-pressed', String(on));
    el.textContent = on ? 'Back to split view' : 'Full screen';
    fitScreens();
  }
});

document.addEventListener('keydown', (e) => {
  if (!location.hash.startsWith('#/judge') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.closest?.('input, textarea, select')) return;
  const map = { 1: 'a', 2: 'b', 3: 'tie', 4: 'bad' };
  if (map[e.key]) vote(map[e.key]);
  else if (e.key === 'n' || e.key === 'N') document.querySelector('[data-action="next"]')?.click();
  else if (e.key === 'Escape') document.querySelector('.pane.expanded [data-action="expand"]')?.click();
});

// Apps that focus themselves on load (a spreadsheet's grid, an editor's canvas)
// would pull the keyboard into their iframe and silently disable the vote keys.
// Until the frames have loaded, hand any such focus back to the dashboard;
// after that, clicking into an app works as usual.
function guardFocus(frames = [...document.querySelectorAll('.duel iframe')]) {
  if (!frames.length) return;
  J.guardUntil = performance.now() + 10000;
  let pending = frames.length;
  for (const f of frames)
    f.addEventListener('load', () => {
      if (--pending === 0) J.guardUntil = performance.now() + 1000;
    }, { once: true });
}

window.addEventListener('blur', () => {
  if (performance.now() > J.guardUntil) return;
  setTimeout(() => {
    if (document.activeElement?.matches?.('.duel iframe')) document.querySelector('.judge')?.focus({ preventScroll: true });
  });
});

window.addEventListener('hashchange', render);
new ResizeObserver(() => fitScreens()).observe(document.body);

refresh()
  .then(render)
  .catch((e) => {
    app.innerHTML = `<div class="empty">Could not load arena state: ${esc(e.message)}. Is <code>npm run serve</code> running?</div>`;
  });
