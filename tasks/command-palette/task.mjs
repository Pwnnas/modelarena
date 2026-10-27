export const meta = {
  title: 'Commander',
  subtitle: 'Command palette',
  order: 6,
  skills: ['fuzzy ranking', 'accessibility', 'motion design'],
  summary:
    'A ⌘K command palette in a notes app: fuzzy ranking with highlights, recents, a sub-page, toasts, dark mode, ARIA combobox semantics, focus management and reduced-motion support.',
  judging: [
    'Does it feel premium: typography, spacing, keycaps, shadows, the dark theme?',
    'Is the motion tasteful and quick (open, close, list resize, highlight, toasts)?',
    'Do the search results feel smart as you type?',
  ],
};

const DIALOG = '[role="dialog"][aria-modal="true"]';
const COMBO = '[role="combobox"]';
const ORDER = [
  'go-inbox', 'go-today', 'go-archive', 'go-settings', 'go-line', 'go-symbol', 'search-notes',
  'new-note', 'new-note-template', 'duplicate-note', 'rename-note', 'delete-note', 'pin-note', 'move-note', 'export-pdf', 'export-md', 'share-note',
  'bold', 'italic', 'insert-link', 'insert-table', 'insert-code', 'insert-checklist', 'word-wrap', 'format-doc', 'sort-asc', 'sort-desc',
  'toggle-dark-mode', 'change-accent', 'toggle-sidebar', 'toggle-focus-mode', 'zoom-in', 'zoom-out', 'zoom-reset',
  'shortcuts', 'release-notes', 'feedback', 'about',
];
const ACCENTS = ['accent-indigo', 'accent-emerald', 'accent-rose', 'accent-amber', 'accent-sky'];

const isOpen = (t) =>
  t.eval((sel) => [...document.querySelectorAll(sel)].some((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && !el.hidden && r.width > 0 && r.height > 0;
  }), DIALOG);

async function open(t, how = () => t.shortcut('k')) {
  await how();
  return t.poll(() => isOpen(t), { timeout: 800 });
}

const waitClosed = (t) => t.poll(async () => !(await isOpen(t)), { timeout: 1000 });

const options = (t) =>
  t.eval(() =>
    [...document.querySelectorAll('[role="option"]')]
      .filter((el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
      .map((el) => ({
        id: el.id,
        cmd: el.dataset.command,
        selected: el.getAttribute('aria-selected') === 'true',
        marks: [...el.querySelectorAll('mark')].map((m) => m.textContent).join(''),
      })),
  );

const active = async (t) => (await options(t)).find((o) => o.selected)?.cmd ?? 'none';

// Typing goes through the real input, but focus is set explicitly so a missing
// autofocus is only penalized by the check that tests it.
async function type(t, q) {
  await t.page.locator(COMBO).first().focus();
  await t.page.keyboard.type(q);
  await t.sleep(220);
}

async function clearQuery(t) {
  await t.page.locator(COMBO).first().focus();
  await t.shortcut('a');
  await t.page.keyboard.press('Delete');
  await t.sleep(200);
}

async function run(t, cmd, q) {
  if (!(await isOpen(t))) await open(t);
  await type(t, q);
  await t.page.click(`[role="option"][data-command="${cmd}"]`);
  await waitClosed(t);
  await t.sleep(150);
}

// Record every animation that exists during `action` (sampled each frame).
async function animationsDuring(t, action, ms = 450) {
  await t.eval((ms) => {
    window.__anims = [];
    const seen = new Set();
    const end = performance.now() + ms;
    const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
    const tick = () => {
      for (const a of document.getAnimations()) {
        if (seen.has(a)) continue;
        seen.add(a);
        let props = [];
        if (a.transitionProperty) props = [a.transitionProperty];
        else {
          try {
            props = [...new Set(a.effect.getKeyframes().flatMap((k) => Object.keys(k)))]
              .filter((k) => !['offset', 'easing', 'composite', 'computedOffset'].includes(k))
              .map(kebab);
          } catch {}
        }
        window.__anims.push({ props, duration: Number(a.effect?.getComputedTiming?.().duration) || 0 });
      }
      if (performance.now() < end) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, ms);
  await action();
  await t.sleep(ms + 80);
  return t.eval(() => window.__anims);
}

const MOVING = /^(transform|translate|scale|rotate|top|left|right|bottom|width|height|max-height|min-height|max-width|min-width|margin.*|inset.*|grid-template-rows)$/;
const moving = (anims) => anims.filter((a) => a.duration > 20 && a.props.some((p) => MOVING.test(p)));
const descr = (anims) => anims.map((a) => `${a.props.join('+') || '?'} ${Math.round(a.duration)}ms`).slice(0, 6).join(', ') || 'none';

export const checks = [
  {
    id: 'open-close',
    title: 'Opening and closing',
    points: 8,
    async run(t) {
      await t.part('Cmd/Ctrl+K opens', () => open(t));
      await t.part('search input is focused on open', () => t.eval((c) => !!document.activeElement?.matches(c), COMBO));
      await t.page.keyboard.press('Escape');
      await t.part('Escape closes', () => waitClosed(t));
      await t.part('Ctrl+K opens (Control key)', () => open(t, () => t.page.keyboard.press('Control+k')));
      await t.page.keyboard.press('Control+k');
      await t.part('the shortcut again closes', () => waitClosed(t));
      await t.page.click('#editor');
      await t.part('opens while typing in the editor', () => open(t));
      const vp = t.page.viewportSize();
      await t.page.mouse.click(16, vp.height - 16);
      await t.part('clicking outside closes', () => waitClosed(t));
      await t.part('the open button opens', () => open(t, () => t.page.click('#open-palette')));
    },
  },
  {
    id: 'aria',
    title: 'Dialog and combobox semantics',
    points: 6,
    async run(t) {
      await open(t);
      const a = await t.eval(({ DIALOG, COMBO }) => {
        const dlg = [...document.querySelectorAll(DIALOG)].find((d) => d.getClientRects().length);
        const input = dlg?.querySelector(COMBO);
        const list = input && document.getElementById(input.getAttribute('aria-controls'));
        const opts = [...document.querySelectorAll('[role="option"]')].filter((o) => o.getClientRects().length);
        const sel = opts.filter((o) => o.getAttribute('aria-selected') === 'true');
        return {
          dialog: !!dlg,
          input: !!input && input.tagName === 'INPUT' && input.getAttribute('aria-expanded') === 'true',
          listbox: list?.getAttribute('role') === 'listbox',
          ids: opts.length > 0 && new Set(opts.map((o) => o.id)).size === opts.length && opts.every((o) => o.id && o.dataset.command),
          oneSelected: sel.length === 1,
          descendant: sel.length === 1 && input?.getAttribute('aria-activedescendant') === sel[0].id,
          inside: opts.length > 0 && opts.every((o) => list?.contains(o)),
        };
      }, { DIALOG, COMBO });
      const p = (k, label) => t.part(label, () => t.ok(a[k], JSON.stringify(a)));
      await p('dialog', 'role=dialog with aria-modal=true');
      await p('input', 'input role=combobox, aria-expanded=true');
      await p('listbox', 'aria-controls points at the listbox');
      await p('ids', 'options have unique ids and data-command');
      await p('oneSelected', 'exactly one option aria-selected');
      await p('descendant', 'aria-activedescendant follows the active option');
      await p('inside', 'options live inside the listbox');
    },
  },
  {
    id: 'initial-list',
    title: 'Grouped list on an empty query',
    points: 4,
    async run(t) {
      await open(t);
      const opts = await options(t);
      await t.part('all 38 commands listed', () => t.ok(opts.length === 38 && new Set(opts.map((o) => o.cmd)).size === 38, `${opts.length} options`));
      await t.part('in the given order', () => t.ok(opts.map((o) => o.cmd).join() === ORDER.join(), `starts ${opts.slice(0, 4).map((o) => o.cmd).join(', ')}`));
      await t.part('group headings shown', async () => {
        const text = await t.eval((sel) => document.querySelector(sel)?.innerText ?? '', DIALOG);
        // innerText applies CSS text-transform, so uppercase headings are fine.
        const groups = ['Navigation', 'Notes', 'Editor', 'View', 'Help'].filter((g) => text.toLowerCase().includes(g.toLowerCase()));
        return { score: groups.length / 5, note: `found ${groups.join(', ')}` };
      });
      await t.part('first item active', () => t.ok(opts[0]?.selected, `active: ${opts.find((o) => o.selected)?.cmd}`));
    },
  },
  {
    id: 'fuzzy',
    title: 'Fuzzy ranking',
    points: 10,
    async run(t) {
      await open(t);
      const cases = [
        ['tdm', 'toggle-dark-mode'],
        ['dark', 'toggle-dark-mode'],
        ['gtl', 'go-line'],
        ['accent', 'change-accent'],
        ['new', 'new-note'],
        ['zen', 'toggle-focus-mode'],
        ['srt dsc', 'sort-desc'],
        ['pdf', 'export-pdf'],
        ['TOGGLE SIDE', 'toggle-sidebar'],
      ];
      for (const [q, want] of cases) {
        await clearQuery(t);
        await type(t, q);
        const opts = await options(t);
        const top = opts.slice(0, 3).map((o) => o.cmd);
        await t.part(`"${q}" → ${want}`, () => ({
          score: top[0] === want ? 1 : top.includes(want) ? 0.5 : 0,
          note: `top 3: ${top.join(', ') || 'none'}`,
        }));
      }
      await t.part('first result is active after typing', async () => t.ok((await options(t))[0]?.selected, `active: ${await active(t)}`));
    },
  },
  {
    id: 'highlight',
    title: 'Matched characters wrapped in <mark>',
    points: 4,
    async run(t) {
      await open(t);
      for (const q of ['tdm', 'dark']) {
        await clearQuery(t);
        await type(t, q);
        const first = (await options(t))[0];
        await t.part(`"${q}" highlights exactly its letters`, () => t.ok(first?.marks.toLowerCase().replace(/\s/g, '') === q, `marked: "${first?.marks}"`));
      }
    },
  },
  {
    id: 'empty-state',
    title: 'Empty state',
    points: 3,
    async run(t) {
      await open(t);
      await type(t, 'xyzzy');
      await t.part('no options for a non-matching query', async () => t.ok((await options(t)).length === 0, `${(await options(t)).length} options`));
      await t.part('#palette-empty is visible', () => t.visible('#palette-empty'));
      await clearQuery(t);
      await t.part('empty state disappears again', async () => t.ok(!(await t.visible('#palette-empty')) && (await options(t)).length > 0, 'still showing'));
    },
  },
  {
    id: 'keyboard',
    title: 'Keyboard and hover navigation',
    points: 8,
    async run(t) {
      await open(t);
      await t.page.locator(COMBO).first().focus();
      const k = t.page.keyboard;
      const expectActive = (want) => async () => {
        const a = await t.poll(async () => ((await active(t)) === want ? want : null), { timeout: 500 });
        return t.ok(a, `active: ${await active(t)}`);
      };
      await k.press('ArrowDown');
      await t.part('ArrowDown moves down', expectActive('go-today'));
      await k.press('ArrowUp');
      await k.press('ArrowUp');
      await t.part('ArrowUp wraps to the last item', expectActive('about'));
      await k.press('ArrowDown');
      await t.part('ArrowDown wraps to the first item', expectActive('go-inbox'));
      await k.press('End');
      await t.part('End jumps to the last item', expectActive('about'));
      await t.part('active item is scrolled into view', () =>
        t.eval((sel) => {
          const el = document.querySelector('[role="option"][aria-selected="true"]');
          const dlg = document.querySelector(sel);
          if (!el || !dlg) return false;
          const r = el.getBoundingClientRect(), d = dlg.getBoundingClientRect();
          const box = el.closest('[role="listbox"]')?.parentElement?.getBoundingClientRect() ?? d;
          return r.top >= Math.max(d.top, 0) - 1 && r.bottom <= Math.min(d.bottom, innerHeight) + 1 && r.bottom <= box.bottom + 1;
        }, DIALOG),
      );
      await k.press('Home');
      await t.part('Home jumps to the first item', expectActive('go-inbox'));
      const third = await t.box('[role="option"][data-command="go-archive"]');
      await t.page.mouse.move(third.x + third.width / 2, third.y + third.height / 2, { steps: 4 });
      await t.part('hover makes an item active', expectActive('go-archive'));
    },
  },
  {
    id: 'execute',
    title: 'Executing commands and toasts',
    points: 6,
    timeout: 40000,
    async run(t) {
      await open(t);
      await type(t, 'pin note');
      await t.page.keyboard.press('Enter');
      await t.part('Enter executes and closes', () => waitClosed(t));
      const toast = '[data-toast]';
      await t.part('toast shows the command title', () => t.poll(() => t.eval((s) => [...document.querySelectorAll(s)].some((e) => e.textContent.includes('Pin Note') && e.getClientRects().length), toast), { timeout: 800 }));
      await t.part('toast is in a live region', () => t.eval((s) => !!document.querySelector(s)?.closest('[role="status"],[aria-live]'), toast));
      await t.part('toast auto-dismisses', () =>
        t.poll(() => t.eval((s) => ![...document.querySelectorAll(s)].some((e) => e.textContent.includes('Pin Note') && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && Number(getComputedStyle(e).opacity) > 0.05), toast), { timeout: 6000, interval: 200 }),
      );
      await open(t);
      await type(t, 'release');
      await t.page.click('[role="option"][data-command="release-notes"]');
      await t.part('click executes', async () => (await waitClosed(t)) && t.eval(() => [...document.querySelectorAll('[data-toast]')].some((e) => e.textContent.includes('Release Notes'))));
    },
  },
  {
    id: 'dark-mode',
    title: 'Toggle Dark Mode',
    points: 6,
    async run(t) {
      const theme = () => t.eval(() => document.documentElement.dataset.theme);
      await t.part('starts in the light theme', async () => t.ok((await theme()) === 'light', `data-theme="${await theme()}"`));
      const before = await t.screenshot();
      await run(t, 'toggle-dark-mode', 'dark mode');
      await t.sleep(800);
      await t.part('data-theme becomes dark', async () => t.ok((await theme()) === 'dark', `data-theme="${await theme()}"`));
      const after = await t.screenshot();
      await t.part('the page visibly darkens', () => {
        const a = t.image.stats(before).lum, b = t.image.stats(after).lum;
        return t.ok(b < a * 0.7, `mean luminance ${a.toFixed(0)} → ${b.toFixed(0)}`);
      }, 2);
      await run(t, 'toggle-dark-mode', 'dark mode');
      await t.part('toggles back to light', async () => t.ok((await theme()) === 'light', `data-theme="${await theme()}"`));
    },
  },
  {
    id: 'accent',
    title: 'Accent color sub-page',
    points: 8,
    async run(t) {
      const accent = () => t.eval(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
      const a0 = await accent();
      await open(t);
      await type(t, 'accent');
      await t.page.keyboard.press('Enter');
      await t.sleep(300);
      await t.part('opens a sub-page (palette stays open)', () => isOpen(t));
      await t.part('lists the five accents', async () => {
        const o = (await options(t)).map((x) => x.cmd);
        return t.ok(o.join() === ACCENTS.join(), o.join(', '));
      });
      await t.part('query is cleared', async () => t.ok((await t.page.locator(COMBO).first().inputValue()) === '', 'query not empty'));
      await type(t, 'eme');
      await t.part('sub-page results filter', async () => t.ok((await options(t))[0]?.cmd === 'accent-emerald', `first: ${(await options(t))[0]?.cmd}`));
      await t.page.keyboard.press('Enter');
      await t.part('picking sets --accent and closes', async () => {
        const closed = await waitClosed(t);
        const a1 = await accent();
        return t.ok(closed && a1 && a1 !== a0, `--accent "${a0}" → "${a1}"${closed ? '' : ', palette still open'}`);
      }, 2);
      await open(t);
      await t.part('recorded in Recent', async () => t.ok((await options(t))[0]?.cmd === 'change-accent', `first: ${(await options(t))[0]?.cmd}`));
      await type(t, 'accent');
      await t.page.keyboard.press('Enter');
      await t.sleep(250);
      await t.page.keyboard.press('Backspace');
      await t.sleep(250);
      await t.part('Backspace on empty query returns to root', async () => {
        const o = await options(t);
        return t.ok(o.some((x) => x.cmd === 'toggle-dark-mode') && !o.some((x) => ACCENTS.includes(x.cmd)), `${o.length} options`);
      });
      await type(t, 'accent');
      await t.page.keyboard.press('Enter');
      await t.sleep(250);
      await t.page.keyboard.press('Escape');
      await t.sleep(300);
      await t.part('Escape in a sub-page goes back', async () => t.ok((await isOpen(t)) && (await options(t)).some((x) => x.cmd === 'toggle-dark-mode'), (await isOpen(t)) ? 'still in sub-page' : 'palette closed'));
    },
  },
  {
    id: 'recents',
    title: 'Recent commands',
    points: 5,
    async run(t) {
      await run(t, 'release-notes', 'release');
      await run(t, 'pin-note', 'pin note');
      await open(t);
      const opts = await options(t);
      await t.part('most recent first', () => t.ok(opts[0]?.cmd === 'pin-note' && opts[1]?.cmd === 'release-notes', `first: ${opts.slice(0, 3).map((o) => o.cmd).join(', ')}`), 2);
      await t.part('Recent heading shown', async () => t.ok(/recent/i.test(await t.eval((s) => document.querySelector(s)?.innerText ?? '', DIALOG)), 'no "Recent" text'));
      await t.part('recents also stay in their group', () => t.ok(opts.filter((o) => o.cmd === 'pin-note').length === 2, `${opts.filter((o) => o.cmd === 'pin-note').length}× pin-note`));
      await t.page.keyboard.press('Escape');
      await t.sleep(400);
      await t.reload();
      await open(t);
      await t.part('recents persist across reload', async () => t.ok((await options(t))[0]?.cmd === 'pin-note', `first: ${(await options(t))[0]?.cmd}`));
    },
  },
  {
    id: 'focus',
    title: 'Focus trap and focus return',
    points: 6,
    async run(t) {
      const inDialog = () => t.eval((s) => !!document.activeElement?.closest(s), DIALOG);
      await t.page.locator('#open-palette').focus();
      await open(t);
      await t.part('focus moves into the palette', inDialog);
      for (let i = 0; i < 3; i++) await t.page.keyboard.press('Tab');
      await t.part('Tab stays trapped', inDialog);
      for (let i = 0; i < 2; i++) await t.page.keyboard.press('Shift+Tab');
      await t.part('Shift+Tab stays trapped', inDialog);
      await t.page.keyboard.press('Escape');
      await waitClosed(t);
      await t.part('focus returns to the opener', () => t.eval(() => document.activeElement?.id === 'open-palette'));
      await t.page.click('#editor');
      await open(t);
      await t.page.keyboard.press('Escape');
      await waitClosed(t);
      await t.part('focus returns to the editor', () => t.eval(() => document.activeElement?.id === 'editor' || !!document.activeElement?.closest('#editor')));
    },
  },
  {
    id: 'motion',
    title: 'Motion design',
    points: 6,
    async run(t) {
      const opening = await animationsDuring(t, () => t.shortcut('k'));
      await t.part('opening animates (80–450 ms)', () => t.ok(opening.some((a) => a.duration >= 80 && a.duration <= 450), descr(opening)), 2);
      await t.page.locator(COMBO).first().focus();
      const typing = await animationsDuring(t, () => t.page.keyboard.type('zoom', { delay: 30 }));
      await t.part('list resizes smoothly when results change', () => t.ok(moving(typing).length > 0, descr(typing)));
      let stillVisible = false;
      const closing = await animationsDuring(t, async () => {
        await t.page.keyboard.press('Escape');
        await t.sleep(60);
        stillVisible = await isOpen(t);
      });
      await t.part('closing animates', () => t.ok(stillVisible && closing.some((a) => a.duration >= 60), `${stillVisible ? 'visible' : 'gone'} 60 ms after Escape; ${descr(closing)}`), 2);
      await open(t);
      await type(t, 'pin note');
      const toast = await animationsDuring(t, () => t.page.keyboard.press('Enter'));
      await t.part('toast slides in', () => t.ok(moving(toast).length > 0, descr(toast)));
    },
  },
  {
    id: 'reduced-motion',
    title: 'Respects prefers-reduced-motion',
    points: 5,
    context: { reducedMotion: 'reduce' },
    async run(t) {
      const opening = await animationsDuring(t, () => t.shortcut('k'));
      // "No motion" is only meaningful if there is a palette to not animate.
      if (!(await isOpen(t))) return { score: 0, note: 'palette did not open' };
      await t.part('no movement when opening', () => t.ok(moving(opening).length === 0, descr(moving(opening))), 2);
      await t.page.locator(COMBO).first().focus();
      const typing = await animationsDuring(t, () => t.page.keyboard.type('zoom', { delay: 30 }));
      await t.part('no size animation while filtering', () => t.ok(moving(typing).length === 0, descr(moving(typing))));
      const closing = await animationsDuring(t, () => t.page.keyboard.press('Escape'));
      await t.part('no movement when closing', () => t.ok(moving(closing).length === 0, descr(moving(closing))));
      await t.part('still closes promptly', () => waitClosed(t));
    },
  },
  {
    id: 'new-note',
    title: 'New Note adds to the sidebar',
    points: 3,
    async run(t) {
      const n0 = await t.count('[data-note]');
      await run(t, 'new-note', 'new note');
      await t.sleep(300);
      const n1 = await t.count('[data-note]');
      return t.ok(n0 > 0 && n1 === n0 + 1, `${n0} → ${n1} notes`);
    },
  },
];

export async function showcase(t) {
  await t.sleep(600);
  await t.shot('app');
  await t.shortcut('k');
  await t.sleep(400);
  await t.shot('palette');
  await t.page.keyboard.type('tdm', { delay: 140 });
  await t.sleep(300);
  await t.shot('fuzzy');
  for (let i = 0; i < 3; i++) {
    await t.page.keyboard.press('ArrowDown');
    await t.sleep(160);
  }
  await t.page.keyboard.press('Home');
  await t.page.keyboard.press('Enter');
  await t.sleep(900);
  await t.shot('dark');
  await t.shortcut('k');
  await t.sleep(300);
  await t.page.keyboard.type('accent', { delay: 90 });
  await t.page.keyboard.press('Enter');
  await t.sleep(400);
  await t.shot('accents');
  await t.page.keyboard.press('ArrowDown');
  await t.sleep(200);
  await t.page.keyboard.press('Enter');
  await t.sleep(1200);
}
