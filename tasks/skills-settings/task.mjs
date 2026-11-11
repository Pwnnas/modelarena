export const meta = {
  title: 'Harbor',
  subtitle: 'Settings app built with skills',
  order: 7,
  skills: ['following skills', 'theming', 'UX writing', 'accessibility'],
  summary:
    'A six-panel settings app built by following three attached Claude skills (theme-factory with Ocean Depths, ux-copy, accessibility-review), checked on every panel to see whether the model keeps applying them to the end.',
  judging: [
    'Does it look like one carefully themed product, from the first panel to the last?',
    'Is the writing clear and specific: buttons, errors, dialogs, the empty state?',
    'Is it pleasant and easy to use with the keyboard as well as the mouse?',
  ],
};

const PANELS = ['profile', 'notifications', 'team', 'projects', 'billing', 'danger'];
const DECLINED = '4000 0000 0000 0002';
// Ocean Depths: Deep Navy, Teal, Seafoam, Cream.
const PALETTE = [[0x1a, 0x23, 0x32], [0x2d, 0x8b, 0x8b], [0xa8, 0xda, 0xdc], [0xf1, 0xfa, 0xee]];
const RULES = ['colors', 'fonts', 'contrast', 'targets', 'labels', 'ctas'];

const DIALOG = '[role="dialog"][aria-modal="true"]';
const panel = (id) => `[data-panel="${id}"]`;
const action = (a) => `[data-action="${a}"]`;
const field = (f) => `[data-field="${f}"]`;

// ux-copy: CTAs "start with a verb" and "be specific". The verb list is broad on
// purpose; a label that fails is shown in the note so a person can judge it.
const VERBS = `accept activate add allow apply archive back block book browse buy cancel change charge check
  choose clear close complete confirm connect continue copy create deactivate decline delete disable discard dismiss
  download downgrade edit enable export finish get go hide import invite join keep leave learn manage move mute open
  pay pick place preview proceed publish purchase remove rename renew replace reset resend restore retry return
  review revoke save schedule search select send set share show sign start stay submit subscribe switch test transfer
  try turn undo unmute unsubscribe update upgrade upload use verify view`.split(/\s+/);
const GENERIC = ['submit', 'ok', 'okay', 'yes', 'no', 'cancel', 'confirm', 'continue', 'proceed', 'go', 'done', 'close', 'click here', 'are you sure'];

// Runs in the page. Audits every visible element under `roots` (minus anything
// inside `exclude`) against the theme, typography, contrast, target-size,
// labelling and CTA rules, and returns { rule: { pass, total, fails } }.
function audit({ roots, exclude, palette, verbs, generic }) {
  const out = {};
  for (const r of ['colors', 'fonts', 'contrast', 'targets', 'labels', 'ctas']) out[r] = { pass: 0, total: 0, fails: [] };
  const tally = (rule, ok, what) => {
    out[rule].total++;
    if (ok) out[rule].pass++;
    else if (out[rule].fails.length < 4) out[rule].fails.push(what);
  };

  const cv = document.createElement('canvas');
  cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const cache = new Map();
  // Any CSS color (rgb, hex, oklch, color-mix…) to [r, g, b, a] via the canvas.
  const rgba = (css) => {
    if (cache.has(css)) return cache.get(css);
    let v = null;
    if (css && css !== 'transparent') {
      cx.clearRect(0, 0, 1, 1);
      cx.fillStyle = '#000';
      cx.fillStyle = css;
      cx.fillRect(0, 0, 1, 1);
      const d = cx.getImageData(0, 0, 1, 1).data;
      v = [d[0], d[1], d[2], d[3] / 255];
    }
    cache.set(css, v);
    return v;
  };
  const hex = (c) => '#' + c.slice(0, 3).map((n) => n.toString(16).padStart(2, '0')).join('');
  // A palette color, or a blend of two of them: rgba(teal, .15) over navy is
  // already accepted (only its RGB is compared), so the same shade written as
  // an opaque hex must be too. Distance is to the line segment between colors.
  const toSegment = (c, a, b) => {
    const d = [0, 1, 2].map((i) => b[i] - a[i]);
    const len2 = d[0] ** 2 + d[1] ** 2 + d[2] ** 2;
    const k = len2 ? Math.max(0, Math.min(1, [0, 1, 2].reduce((s, i) => s + (c[i] - a[i]) * d[i], 0) / len2)) : 0;
    return Math.hypot(...[0, 1, 2].map((i) => a[i] + k * d[i] - c[i]));
  };
  const inPalette = (c) => !c || c[3] === 0 || palette.some((a) => palette.some((b) => toSegment(c, a, b) <= 8));
  const lum = (c) => {
    const [r, g, b] = c.slice(0, 3).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const over = (top, under) => {
    const a = top[3];
    return [0, 1, 2].map((i) => Math.round(top[i] * a + under[i] * (1 - a))).concat(1);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };

  const visible = (el) => {
    if (!el.getClientRects().length) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const ownText = (el) =>
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
      ? (el.value ?? '').trim()
      : [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
  const name = (el) => {
    const by = el.getAttribute('aria-labelledby');
    if (by) {
      const s = by.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim();
      if (s) return s;
    }
    const al = el.getAttribute('aria-label')?.trim();
    if (al) return al;
    const labels = el.labels ? [...el.labels].map((l) => l.textContent).join(' ').trim() : '';
    if (labels) return labels;
    if (['BUTTON', 'A', 'SUMMARY'].includes(el.tagName) || /^(button|switch|checkbox|link|tab)$/.test(el.getAttribute('role') ?? ''))
      if (el.textContent.trim()) return el.textContent.trim();
    return el.getAttribute('title')?.trim() ?? '';
  };
  const describe = (el) => {
    const t = (ownText(el) || name(el) || el.className || '').toString().replace(/\s+/g, ' ').slice(0, 28);
    return `${el.tagName.toLowerCase()}${t ? ` "${t}"` : ''}`;
  };
  const disabled = (el) => !!el.closest('[disabled], [aria-disabled="true"]');

  // Background candidates under `el`: every ancestor's color layered from the
  // canvas (white) up; a gradient contributes each of its stops.
  const backgrounds = (el) => {
    const chain = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) chain.unshift(n);
    let cands = [[255, 255, 255, 1]];
    for (const n of chain) {
      const cs = getComputedStyle(n);
      const stops = (cs.backgroundImage.match(/(rgba?|oklch|oklab|lab|lch|hsla?|color)\([^)]*\)|#[0-9a-f]{3,8}\b/gi) ?? []).map(rgba).filter(Boolean);
      const bg = rgba(cs.backgroundColor);
      if (bg && bg[3] > 0) cands = cands.map((c) => over(bg, c));
      if (stops.length) cands = stops.flatMap((s) => cands.map((c) => over(s, c)));
    }
    return cands;
  };

  const els = [];
  for (const sel of roots)
    for (const root of document.querySelectorAll(sel)) {
      if (!visible(root)) continue;
      for (const el of [root, ...root.querySelectorAll('*')]) {
        if (exclude && el.closest(exclude) && !root.matches(exclude)) continue;
        if (['SCRIPT', 'STYLE', 'TEMPLATE', 'BR', 'OPTION'].includes(el.tagName)) continue;
        if (el.closest('[aria-hidden="true"]') || !visible(el)) continue;
        els.push(el);
      }
    }

  for (const el of new Set(els)) {
    const cs = getComputedStyle(el);
    const text = ownText(el);
    const control = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(el.tagName);
    const svgShape = el instanceof SVGElement && el.tagName !== 'svg';

    // theme-factory: every color the element paints comes from the palette.
    const used = [];
    if (text || control) used.push(['text', cs.color]);
    used.push(['background', cs.backgroundColor]);
    for (const s of ['Top', 'Right', 'Bottom', 'Left'])
      if (parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== 'none') used.push(['border', cs[`border${s}Color`]]);
    if (svgShape) {
      if (cs.fill !== 'none' && !cs.fill.startsWith('url')) used.push(['fill', cs.fill]);
      if (cs.stroke !== 'none' && !cs.stroke.startsWith('url')) used.push(['stroke', cs.stroke]);
    }
    const off = used.map(([k, v]) => [k, rgba(v)]).filter(([, c]) => !inPalette(c));
    if (used.some(([, v]) => rgba(v)?.[3] > 0)) tally('colors', !off.length, `${describe(el)} ${off.map(([k, c]) => `${k} ${hex(c)}`).join(', ')}`);

    // theme-factory: DejaVu Sans for text, bold headers.
    if (text || control) {
      const first = cs.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '').toLowerCase();
      tally('fonts', first === 'dejavu sans', `${describe(el)} in ${first}`);
      if (/^H[1-6]$/.test(el.tagName)) tally('fonts', parseInt(cs.fontWeight) >= 600, `${describe(el)} weight ${cs.fontWeight}`);
    }

    // accessibility-review 1.4.3: 4.5:1, or 3:1 for large text.
    if (text && !disabled(el)) {
      const fg = rgba(cs.color);
      if (fg) {
        const size = parseFloat(cs.fontSize);
        const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight) >= 700);
        const worst = Math.min(...backgrounds(el).map((b) => ratio(over(fg, b), b)));
        tally('contrast', worst >= (large ? 3 : 4.5) - 0.02, `${describe(el)} ${worst.toFixed(2)}:1`);
      }
    }

    // accessibility-review 2.5.5: targets at least 44×44 (a wrapping label counts).
    const role = el.getAttribute('role') ?? '';
    const interactive =
      (el.tagName === 'BUTTON' || /^(button|switch|checkbox|radio|tab)$/.test(role) || el.tagName === 'SELECT' ||
        (el.tagName === 'INPUT' && /^(checkbox|radio|button|submit)$/.test(el.type)) ||
        (el.tagName === 'A' && el.href && !el.closest('p, li'))) && !disabled(el);
    if (interactive) {
      const r = el.getBoundingClientRect();
      const l = el.closest('label')?.getBoundingClientRect();
      const w = Math.max(r.width, l?.width ?? 0), h = Math.max(r.height, l?.height ?? 0);
      tally('targets', w >= 43.5 && h >= 43.5, `${describe(el)} ${Math.round(w)}×${Math.round(h)}`);
    }

    // accessibility-review 3.3.2 / 4.1.2: every control has a name.
    const field = ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) && !/^(hidden|submit|button)$/.test(el.type);
    if (field || interactive) tally('labels', !!name(el), `${describe(el)} has no label`);

    // ux-copy: CTAs start with a verb and say what they do.
    if ((el.matches('[data-action]') || (el.tagName === 'BUTTON' && el.closest('[role="dialog"]'))) && !disabled(el)) {
      const label = name(el).replace(/[^\p{L}\p{N}'’ -]+/gu, ' ').replace(/\s+/g, ' ').trim();
      const words = label.split(' ').filter(Boolean);
      const ok = words.length >= 2 && verbs.includes(words[0].toLowerCase()) && !generic.includes(label.toLowerCase());
      // A dialog's icon-only close button is fine as "Close dialog"; skip bare "Close"/"×".
      if (!(el.closest('[role="dialog"]') && !el.matches('[data-action]') && /^(close|×|x)?$/i.test(label) && !ownText(el).match(/\p{L}{2}/u)))
        tally('ctas', ok, `"${label || '(no label)'}"`);
    }
  }
  return out;
}

const auditArgs = { palette: PALETTE, verbs: VERBS, generic: GENERIC };
const scan = (t, roots, exclude) => t.eval(audit, { roots, exclude, ...auditArgs });

function merge(...audits) {
  const out = {};
  for (const r of RULES) {
    out[r] = { pass: 0, total: 0, fails: [] };
    for (const a of audits.filter(Boolean)) {
      out[r].pass += a[r].pass;
      out[r].total += a[r].total;
      out[r].fails.push(...a[r].fails);
    }
  }
  return out;
}

const frac = (x) => (x?.total ? x.pass / x.total : null);
const pct = (f) => (f == null ? '—' : `${Math.round(f * 100)}%`);

async function show(t, id) {
  await t.page.click(`[data-nav="${id}"]`, { timeout: 3000 });
  await t.poll(() => t.visible(panel(id)), { timeout: 1000 });
  await t.sleep(250);
}

async function openDialog(t, selector) {
  await t.page.click(selector, { timeout: 3000 });
  await t.poll(() => t.visible(DIALOG), { timeout: 1000 });
  await t.sleep(300); // let entry animations settle before measuring colors
}

async function closeDialog(t) {
  await t.page.keyboard.press('Escape');
  await t.poll(async () => !(await t.visible(DIALOG)), { timeout: 1000 });
}

// Puts each panel in its states (error shown, dialog open, empty and filled)
// and audits the panel plus any open dialog. Returns { panel: audit | null }.
async function auditPanels(t) {
  const res = {};
  const roots = (id) => [panel(id), DIALOG];
  const steps = {
    profile: async () => {
      const a = await scan(t, roots('profile'));
      await t.page.fill(field('name'), '');
      await t.page.click(action('save-profile'));
      await t.sleep(300);
      return merge(a, await scan(t, roots('profile')));
    },
    notifications: async () => scan(t, roots('notifications')),
    team: async () => {
      await t.page.fill(field('invite-email'), 'not-an-email');
      await t.page.click(action('invite'));
      await t.sleep(300);
      const a = await scan(t, roots('team'));
      await openDialog(t, `${panel('team')} ${action('remove-member')}`);
      const b = await scan(t, [DIALOG]);
      await closeDialog(t);
      return merge(a, b);
    },
    projects: async () => {
      const a = await scan(t, roots('projects'));
      await t.page.click(action('create-project'));
      await t.sleep(400);
      return merge(a, await scan(t, roots('projects')));
    },
    billing: async () => {
      await t.page.fill(field('card-number'), DECLINED);
      await t.page.fill(field('card-expiry'), '12/30');
      await t.page.fill(field('card-cvc'), '123');
      await t.page.click(action('pay'));
      await t.sleep(400);
      return scan(t, roots('billing'));
    },
    danger: async () => {
      const a = await scan(t, roots('danger'));
      await openDialog(t, action('delete-workspace'));
      const b = await scan(t, [DIALOG]);
      await closeDialog(t);
      return merge(a, b);
    },
  };
  res.shell = await scan(t, ['body'], `[data-panel], ${DIALOG}`).catch(() => null);
  for (const id of PANELS) {
    try {
      await show(t, id);
      res[id] = await steps[id]();
    } catch (e) {
      // A panel that can't be reached or put in its state still gets audited as
      // far as it renders, so one broken button doesn't hide the rest.
      res[id] = (await scan(t, [panel(id), DIALOG]).catch(() => null)) ?? null;
      t.note(`${id}: ${String(e.message).split('\n')[0].slice(0, 100)}`);
    }
  }
  return res;
}

// One part per panel (plus the app shell), so the check's detail reads as a
// profile → danger timeline of how well this rule held.
async function rulePerPanel(t, rule, { shell = true } = {}) {
  const res = await auditPanels(t);
  for (const id of [...(shell ? ['shell'] : []), ...PANELS]) {
    const a = res[id]?.[rule];
    await t.part(id === 'shell' ? 'app shell (sidebar, header)' : `${id} panel`, () => {
      if (!res[id]) return { score: 0, note: 'panel not reachable' };
      if (!a.total) return { score: rule === 'labels' ? 1 : 0, note: rule === 'labels' ? 'no controls' : 'nothing found to check' };
      return { score: a.pass / a.total, note: `${a.pass}/${a.total}${a.fails.length ? `; ${a.fails.join('; ')}` : ''}` };
    });
  }
}

const sentences = (s) => (s.match(/[.!?](\s|$)/g) ?? []).length;
const words = (s) => s.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;

// An error message: visible, worded as what happened + why + how to fix
// (ux-copy), tied to its field (accessibility-review 3.3.1).
async function judgeError(t, panelId, fieldName) {
  const info = await t.eval(
    ({ p, f }) => {
      const err = [...document.querySelectorAll(`${p} [data-error]`)].find((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && e.textContent.trim());
      const input = document.querySelector(`[data-field="${f}"]`);
      if (!err) return null;
      const ids = (input?.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      const described = ids.some((id) => {
        const d = document.getElementById(id);
        return d && (d === err || d.contains(err) || err.contains(d));
      });
      const live = !!err.closest('[role="alert"], [aria-live="assertive"], [aria-live="polite"]') || !!err.querySelector('[role="alert"]');
      return { text: err.textContent.replace(/\s+/g, ' ').trim(), invalid: input?.getAttribute('aria-invalid') === 'true', described, live };
    },
    { p: panel(panelId), f: fieldName },
  );
  if (!info) return { score: 0, note: 'no visible [data-error] in the panel' };
  const structure = sentences(info.text) >= 2 && words(info.text) >= 8;
  const generic = /^(error|invalid|failed|something went wrong)\b[.!]?$/i.test(info.text);
  const score = (structure && !generic ? 0.5 : 0) + (info.invalid ? 0.25 : 0) + (info.described || info.live ? 0.25 : 0);
  return {
    score,
    note: `"${info.text.slice(0, 90)}"${structure ? '' : ' (not what + why + how)'}${info.invalid ? '' : ', field lacks aria-invalid'}${info.described || info.live ? '' : ', not linked to the field or announced'}`,
  };
}

// A confirmation dialog: a specific question naming the thing, the
// consequence, action-labelled buttons (ux-copy), and focus handled
// (accessibility-review 2.4.3 / 2.1.1).
async function judgeDialog(t, opener, subject) {
  await t.page.locator(opener).first().focus();
  await openDialog(t, opener);
  const info = await t.eval((sel) => {
    const d = [...document.querySelectorAll(sel)].find((e) => e.getClientRects().length);
    if (!d) return null;
    const by = d.getAttribute('aria-labelledby');
    const title = ((by && document.getElementById(by)?.textContent) || d.querySelector('h1, h2, h3, h4')?.textContent || d.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
    const buttons = [...d.querySelectorAll('button, [role="button"]')].filter((b) => b.getClientRects().length).map((b) => (b.getAttribute('aria-label') || b.textContent).replace(/\s+/g, ' ').trim());
    return { title, text: d.textContent.replace(/\s+/g, ' ').trim(), buttons, focusInside: d.contains(document.activeElement) };
  }, DIALOG);
  if (!info) return [{ label: 'dialog opens', score: 0, note: 'no visible role="dialog" aria-modal="true"' }];
  await closeDialog(t).catch(() => {});
  const closed = !(await t.visible(DIALOG));
  const returned = await t.eval((sel) => document.activeElement === document.querySelector(sel), opener);
  const labelled = info.buttons.filter((b) => !/^(close|×|x)$/i.test(b));
  const badButtons = labelled.filter((b) => b.split(/\s+/).length < 2 || GENERIC.includes(b.toLowerCase()) || !VERBS.includes(b.split(/\s+/)[0].toLowerCase()));
  return [
    {
      label: 'title asks a specific question',
      score: info.title && !/are you sure/i.test(info.title) && /\?/.test(info.title) && subject.test(info.title) ? 1 : info.title && !/are you sure/i.test(info.title) ? 0.5 : 0,
      note: `"${info.title}"`,
    },
    { label: 'states the consequence', score: /can['’]?t be undone|cannot be undone|can not be undone|permanent|irreversib|will lose|will be (removed|deleted|lost)|lose access|no longer/i.test(info.text) ? 1 : 0, note: info.text.slice(0, 120) },
    { label: 'buttons named for their action', score: labelled.length >= 2 && !badButtons.length ? 1 : 0, note: info.buttons.map((b) => `"${b}"`).join(', ') },
    { label: 'focus moves into the dialog', score: info.focusInside ? 1 : 0, note: '' },
    { label: 'Escape closes it and focus returns', score: closed ? (returned ? 1 : 0.5) : 0, note: closed ? (returned ? '' : 'focus not returned to the button') : 'still open after Escape' },
  ];
}

export const checks = [
  {
    id: 'structure',
    title: 'Panels, navigation and landmarks',
    points: 5,
    async run(t) {
      const shown = async () => t.eval(() => [...document.querySelectorAll('[data-panel]')].filter((p) => p.getClientRects().length && !p.hidden).map((p) => p.dataset.panel));
      await t.part('starts on Profile, one panel at a time', async () => {
        const s = await shown();
        return t.ok(s.length === 1 && s[0] === 'profile', `visible: ${s.join(', ') || 'none'}`);
      });
      let good = 0;
      for (const id of PANELS) {
        await show(t, id).catch(() => {});
        const s = await shown();
        if (s.length === 1 && s[0] === id) good++;
      }
      await t.part('each sidebar button shows its panel', () => ({ score: good / PANELS.length, note: `${good}/${PANELS.length}` }), 2);
      await t.part('landmarks: nav, main, one h1, lang', () =>
        t.eval(() => {
          const nav = document.querySelector('nav, [role="navigation"]');
          const ok = [!!nav?.querySelector('[data-nav]'), !!document.querySelector('main, [role="main"]'), document.querySelectorAll('h1').length === 1, !!document.documentElement.lang];
          return { score: ok.filter(Boolean).length / 4, note: `nav ${ok[0]}, main ${ok[1]}, h1×${document.querySelectorAll('h1').length}, lang "${document.documentElement.lang}"` };
        }),
      );
      await t.part('every panel has a heading', () =>
        t.eval((ids) => {
          const n = ids.filter((id) => document.querySelector(`[data-panel="${id}"] :is(h1, h2, h3)`)).length;
          return { score: n / ids.length, note: `${n}/${ids.length}` };
        }, PANELS),
      );
    },
  },
  {
    id: 'works',
    title: 'Everything works',
    points: 10,
    timeout: 45000,
    async run(t) {
      const status = (id) => t.eval((p) => [...document.querySelectorAll(`${p} [role="status"], ${p} [aria-live]`)].some((s) => s.getClientRects().length && s.textContent.trim()), panel(id));
      await t.part('profile saves', async () => {
        await t.page.fill(field('name'), 'Jordan Rivera');
        await t.page.click(action('save-profile'));
        return t.poll(() => status('profile'), { timeout: 1000 });
      });
      await t.part('an empty name is refused with an error', async () => {
        await t.page.fill(field('name'), '');
        await t.page.click(action('save-profile'));
        return t.poll(() => t.visible(`${panel('profile')} [data-error]`), { timeout: 1000 });
      });
      await show(t, 'notifications');
      const sw = t.page.locator(`${panel('notifications')} [role="switch"]`).first();
      await t.part('four labelled switches toggle on click', async () => {
        const n = await t.count(`${panel('notifications')} [role="switch"][data-switch]`);
        const a = await sw.getAttribute('aria-checked');
        await sw.click();
        const b = await sw.getAttribute('aria-checked');
        return t.ok(n === 4 && a !== b && /^(true|false)$/.test(b), `${n} switches, aria-checked ${a} → ${b}`);
      });
      await t.part('switches toggle with Space (keyboard)', async () => {
        const a = await sw.getAttribute('aria-checked');
        await sw.focus();
        await t.page.keyboard.press('Space');
        await t.sleep(100);
        const b = await sw.getAttribute('aria-checked');
        return t.ok(a !== b, `aria-checked ${a} → ${b}`);
      });
      await t.part('notification settings save', async () => {
        await t.page.click(action('save-notifications'));
        return t.poll(() => status('notifications'), { timeout: 1000 });
      });
      await show(t, 'team');
      await t.part('a valid invite adds a member', async () => {
        const n0 = await t.count(`${panel('team')} [data-member]`);
        await t.page.fill(field('invite-email'), 'sam.lee@northwind.example');
        await t.page.click(action('invite'));
        await t.sleep(400);
        const n1 = await t.count(`${panel('team')} [data-member]`);
        return t.ok(n0 === 3 && n1 === 4, `${n0} → ${n1} members`);
      });
      await t.part('a member can be removed after confirming', async () => {
        const n0 = await t.count(`${panel('team')} [data-member]`);
        await openDialog(t, `${panel('team')} ${action('remove-member')}`);
        await t.page.locator(`${DIALOG} button`, { hasText: /remove/i }).first().click({ timeout: 2000 });
        await t.sleep(400);
        const n1 = await t.count(`${panel('team')} [data-member]`);
        return t.ok(n1 === n0 - 1, `${n0} → ${n1} members`);
      });
      await show(t, 'projects');
      await t.part('creating a project lists it', async () => {
        await t.page.click(action('create-project'));
        await t.sleep(400);
        return t.ok((await t.count(`${panel('projects')} [data-project]`)) >= 1, `${await t.count('[data-project]')} projects`);
      });
      await show(t, 'billing');
      await t.part('a good card is accepted', async () => {
        await t.page.fill(field('card-number'), '4242 4242 4242 4242');
        await t.page.fill(field('card-expiry'), '12/30');
        await t.page.fill(field('card-cvc'), '123');
        await t.page.click(action('pay'));
        return t.poll(() => status('billing'), { timeout: 1500 });
      });
      await t.part('the declined card shows an error', async () => {
        await t.page.fill(field('card-number'), DECLINED);
        await t.page.click(action('pay'));
        return t.poll(() => t.visible(`${panel('billing')} [data-error]`), { timeout: 1500 });
      });
    },
  },
  {
    id: 'theme-colors',
    title: 'theme-factory: only Ocean Depths colors',
    points: 12,
    timeout: 45000,
    run: (t) => rulePerPanel(t, 'colors'),
  },
  {
    id: 'theme-fonts',
    title: 'theme-factory: DejaVu Sans, bold headers',
    points: 8,
    timeout: 45000,
    run: (t) => rulePerPanel(t, 'fonts'),
  },
  {
    id: 'contrast',
    title: 'accessibility-review: text contrast (1.4.3)',
    points: 12,
    timeout: 45000,
    run: (t) => rulePerPanel(t, 'contrast'),
  },
  {
    id: 'targets',
    title: 'accessibility-review: 44×44 targets (2.5.5)',
    points: 6,
    timeout: 45000,
    run: (t) => rulePerPanel(t, 'targets'),
  },
  {
    id: 'labels',
    title: 'accessibility-review: labelled controls (3.3.2, 4.1.2)',
    points: 6,
    timeout: 45000,
    run: (t) => rulePerPanel(t, 'labels', { shell: false }),
  },
  {
    id: 'ctas',
    title: 'ux-copy: buttons start with a verb and are specific',
    points: 8,
    timeout: 45000,
    run: (t) => rulePerPanel(t, 'ctas', { shell: false }),
  },
  {
    id: 'focus',
    title: 'accessibility-review: visible keyboard focus (2.4.7)',
    points: 7,
    timeout: 60000,
    async run(t) {
      for (const id of PANELS) {
        await t.part(`${id} panel`, async () => {
          await show(t, id);
          await t.page.mouse.move(1, 1);
          await t.page.locator(`[data-nav="${id}"]`).focus();
          const seen = [];
          for (let i = 0; i < 30; i++) {
            await t.page.keyboard.press('Tab');
            const info = await t.eval((p) => {
              const el = document.activeElement;
              if (!el?.closest(p)) return null;
              el.dataset.focusProbe = String(Math.random()).slice(2);
              const cs = getComputedStyle(el);
              return { probe: el.dataset.focusProbe, tag: el.tagName.toLowerCase(), label: (el.getAttribute('aria-label') || el.textContent || el.dataset.field || '').trim().slice(0, 24), s: [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.boxShadow, cs.borderColor, cs.backgroundColor, cs.color, cs.textDecorationLine].join('|'), outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 };
            }, panel(id));
            if (!info) {
              if (seen.length) break;
              continue;
            }
            if (seen.some((x) => x.probe === info.probe)) break;
            seen.push(info);
          }
          if (!seen.length) return { score: 0, note: 'Tab never reached the panel' };
          await t.blur();
          const plain = await t.eval((probes) => probes.map((p) => {
            const el = document.querySelector(`[data-focus-probe="${p}"]`);
            if (!el) return '';
            const cs = getComputedStyle(el);
            return [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.boxShadow, cs.borderColor, cs.backgroundColor, cs.color, cs.textDecorationLine].join('|');
          }), seen.map((x) => x.probe));
          const bad = seen.filter((x, i) => !x.outline && x.s === plain[i]);
          return { score: 1 - bad.length / seen.length, note: `${seen.length - bad.length}/${seen.length} show focus${bad.length ? `; none on ${bad.slice(0, 3).map((b) => `${b.tag} "${b.label}"`).join(', ')}` : ''}` };
        });
      }
    },
  },
  {
    id: 'errors',
    title: 'Error messages: what, why, how; tied to the field',
    points: 8,
    timeout: 40000,
    async run(t) {
      await t.part('profile: empty name', async () => {
        await t.page.fill(field('name'), '');
        await t.page.click(action('save-profile'));
        await t.sleep(300);
        return judgeError(t, 'profile', 'name');
      });
      await t.part('team: invalid invite email', async () => {
        await show(t, 'team');
        await t.page.fill(field('invite-email'), 'not-an-email');
        await t.page.click(action('invite'));
        await t.sleep(300);
        return judgeError(t, 'team', 'invite-email');
      });
      await t.part('billing: declined card', async () => {
        await show(t, 'billing');
        await t.page.fill(field('card-number'), DECLINED);
        await t.page.fill(field('card-expiry'), '12/30');
        await t.page.fill(field('card-cvc'), '123');
        await t.page.click(action('pay'));
        await t.sleep(400);
        return judgeError(t, 'billing', 'card-number');
      });
    },
  },
  {
    id: 'dialogs',
    title: 'Confirmation dialogs (ux-copy, focus handling)',
    points: 8,
    timeout: 40000,
    async run(t) {
      await show(t, 'team');
      // The member's name may come after an avatar's initials or a role badge,
      // so any capitalised word from the card counts as naming them (not
      // all-caps badges like "JD" or "OWNER", and not the email).
      const words = await t.eval((p) => {
        const card = document.querySelector(`${p} [data-member]`);
        if (!card) return [];
        // Read text node by node: textContent glues "AL" + "Ana Lee" +
        // "ana@…" into "ALAna Leeana@…", losing both names.
        const skip = 'button, select, input, [role="button"], [data-action]';
        const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
        const parts = [];
        for (let n; (n = walker.nextNode()); ) if (!n.parentElement.closest(skip)) parts.push(n.data);
        const roles = /^(owner|admin|administrator|member|editor|viewer|guest|billing|you)$/i;
        const found = parts.join(' ').replace(/\S+@\S+/g, ' ').match(/\b[A-ZÀ-Þ][a-zß-ÿ'’-]+/g) ?? [];
        return [...new Set(found.filter((w) => !roles.test(w)))];
      }, panel('team'));
      const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const subject = words.length ? new RegExp(`\\b(${words.map(esc).join('|')})\\b`) : /\u0000/;
      for (const p of await judgeDialog(t, `${panel('team')} ${action('remove-member')}`, subject))
        await t.part(`remove member: ${p.label}`, () => p);
      await show(t, 'danger');
      for (const p of await judgeDialog(t, action('delete-workspace'), /workspace|northwind/i)) await t.part(`delete workspace: ${p.label}`, () => p);
    },
  },
  {
    id: 'empty-state',
    title: 'Projects empty state: what, why, how to start',
    points: 5,
    async run(t) {
      await show(t, 'projects');
      const info = await t.eval((p) => {
        const e = [...document.querySelectorAll(`${p} [data-empty]`)].find((x) => x.getClientRects().length);
        return e && { text: e.textContent.replace(/\s+/g, ' ').trim(), button: !!e.querySelector('[data-action="create-project"]') };
      }, panel('projects'));
      await t.part('shown while there are no projects', () => t.ok(!!info, info ? '' : 'no visible [data-empty]'));
      await t.part('explains what, why and how', () => t.ok(info && sentences(info.text) >= 2 && words(info.text) >= 8, info ? `"${info.text.slice(0, 100)}"` : ''), 2);
      await t.part('the way to start is inside it', () => t.ok(info?.button, 'create-project button inside [data-empty]'));
      await t.part('goes away once a project exists', async () => {
        await t.page.click(action('create-project'));
        await t.sleep(400);
        const gone = !(await t.visible(`${panel('projects')} [data-empty]`));
        return t.ok(gone && (await t.count(`${panel('projects')} [data-project]`)) >= 1, gone ? '' : 'empty state still visible');
      });
    },
  },
  {
    id: 'consistency',
    title: 'Skills kept to the last panel',
    points: 8,
    timeout: 45000,
    // How the rules hold up in the last three panels relative to the first
    // three, independent of how well they were followed overall: a model that
    // drops the skills halfway loses these points, a consistent one keeps them.
    async run(t) {
      const res = await auditPanels(t);
      const per = PANELS.map((id) => {
        const fs = RULES.map((r) => frac(res[id]?.[r])).filter((f) => f != null);
        return res[id] && fs.length ? fs.reduce((s, f) => s + f, 0) / fs.length : 0;
      });
      const early = (per[0] + per[1] + per[2]) / 3;
      const late = (per[3] + per[4] + per[5]) / 3;
      const timeline = PANELS.map((id, i) => `${id} ${pct(per[i])}`).join(' · ');
      if (early < 0.3) return { score: 0, note: `skills barely applied even at the start (${pct(early)}); ${timeline}` };
      return { score: Math.min(1, late / early), note: `first three ${pct(early)} → last three ${pct(late)}; ${timeline}` };
    },
  },
];

export async function showcase(t) {
  await t.sleep(500);
  await t.shot('profile');
  await t.page.fill(field('name'), '').catch(() => {});
  await t.page.click(action('save-profile')).catch(() => {});
  await t.sleep(700);
  for (const id of ['notifications', 'team']) {
    await show(t, id).catch(() => {});
    await t.sleep(700);
  }
  await t.page.click(`${panel('team')} ${action('remove-member')}`).catch(() => {});
  await t.sleep(900);
  await t.shot('dialog');
  await t.page.keyboard.press('Escape');
  await show(t, 'projects').catch(() => {});
  await t.sleep(800);
  await t.shot('empty-state');
  await show(t, 'billing').catch(() => {});
  await t.page.fill(field('card-number'), DECLINED).catch(() => {});
  await t.page.click(action('pay')).catch(() => {});
  await t.sleep(900);
  await t.shot('billing');
  await show(t, 'danger').catch(() => {});
  await t.sleep(900);
}
