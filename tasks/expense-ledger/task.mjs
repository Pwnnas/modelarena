import fs from 'node:fs';

export const meta = {
  title: 'Tally',
  subtitle: 'Data-faithful expense ledger',
  order: 7,
  suite: 'v2',
  skills: ['tool use: file reading', 'CSV parsing', 'aggregation', 'filter/sort UI'],
  summary:
    'A personal-finance ledger built around a 96-row CSV and a budgets JSON shipped in the workspace. The data must be read with tools and embedded exactly; totals, budgets, filtering, search and sorting are all graded. UI checks work on any data, so models without tool access still earn partial credit.',
  judging: [
    'Does it feel like a premium fintech product: typography, density, tabular numbers?',
    'Are income vs expense and over-budget states communicated clearly?',
    'Do filtering, search and sorting feel instant and correct?',
  ],
};

// ── Expected values, computed from the workspace files the agent receives ──
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const WS = new URL('./workspace/', import.meta.url);
const csv = parseCSV(fs.readFileSync(new URL('data/transactions.csv', WS), 'utf8'));
const EXPECTED = csv.slice(1).map(([id, date, description, category, amount]) => ({
  id, date, description, category, amount: Number(amount),
}));
const BUDGETS = JSON.parse(fs.readFileSync(new URL('data/budgets.json', WS), 'utf8')).limits;
const INCOME = EXPECTED.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
const EXPENSES = -EXPECTED.filter((r) => r.amount < 0).reduce((s, r) => s + r.amount, 0);
const SPENT = Object.fromEntries(Object.keys(BUDGETS).map((c) => [
  c, -EXPECTED.filter((r) => r.category === c && r.amount < 0).reduce((s, r) => s + r.amount, 0),
]));

// ── Page helpers ───────────────────────────────────────────────────────────
const money = (text) => Number(String(text).replace(/\u2212/g, '-').replace(/[^0-9.\-]/g, ''));
const near = (a, b) => Number.isFinite(a) && Math.abs(a - b) < 0.005;
const frac = (hits, total) => (total ? hits / total : 0);

const rows = (t) =>
  t.eval(() =>
    [...document.querySelectorAll('tr[data-tx]')]
      .filter((tr) => tr.getClientRects().length)
      .map((tr) => ({
        id: tr.dataset.tx,
        date: tr.querySelector('[data-field="date"]')?.textContent.trim() ?? '',
        description: tr.querySelector('[data-field="description"]')?.textContent ?? '',
        category: tr.querySelector('[data-field="category"]')?.textContent.trim() ?? '',
        amountText: tr.querySelector('[data-field="amount"]')?.textContent.trim() ?? '',
      })),
  );

const setSelect = (t, sel, value) =>
  t.eval(({ sel, value }) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`${sel} not found`);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, { sel, value });

const countText = (t) => t.eval(() => document.querySelector('#tx-count')?.textContent.trim() ?? '');
const leadingInt = (s) => Number(String(s).match(/\d+/)?.[0] ?? NaN);
const emptyVisible = (t) => t.visible('#ledger-empty');

async function resetFilters(t) {
  await setSelect(t, '#category-filter', 'all');
  await t.setInput('#search', '');
  await t.sleep(150);
}

export const checks = [
  {
    id: 'shell',
    title: 'App shell renders',
    points: 6,
    async run(t) {
      await t.part('transaction table renders rows', async () => t.ok((await t.count('tr[data-tx]')) > 0, `${await t.count('tr[data-tx]')} rows`), 2);
      await t.part('summary cards present', () => t.eval(() => ['#total-income', '#total-expenses', '#net'].every((s) => document.querySelector(s))));
      await t.part('filter and search controls', () => t.eval(() => document.querySelector('#category-filter')?.tagName === 'SELECT' && !!document.querySelector('#search')));
      await t.part('budget cards present', async () => t.ok((await t.count('[data-budget]')) > 0, `${await t.count('[data-budget]')} cards`));
      await t.part('tx-count starts with a number', async () => t.ok(Number.isFinite(leadingInt(await countText(t))), `"${await countText(t)}"`));
    },
  },
  {
    id: 'data-rows',
    title: 'Every transaction matches the CSV',
    points: 12,
    async run(t) {
      const got = await rows(t);
      const byId = new Map(got.map((r) => [r.id, r]));
      await t.part('all 96 transaction ids present', () => ({
        score: frac(EXPECTED.filter((r) => byId.has(r.id)).length, EXPECTED.length),
        note: `${byId.size} rows rendered, ${EXPECTED.length} expected`,
      }), 2);
      const field = (name, cmp, weight) => t.part(`${name} exact`, () => ({
        score: frac(EXPECTED.filter((r) => byId.has(r.id) && cmp(byId.get(r.id), r)).length, EXPECTED.length),
        note: `${EXPECTED.filter((r) => byId.has(r.id) && cmp(byId.get(r.id), r)).length}/${EXPECTED.length} match`,
      }), weight);
      await field('dates', (g, e) => g.date === e.date, 2);
      await field('descriptions (CSV quoting)', (g, e) => g.description.trim() === e.description, 3);
      await field('categories', (g, e) => g.category === e.category, 2);
      await field('amounts', (g, e) => near(money(g.amountText), e.amount), 3);
    },
  },
  {
    id: 'totals',
    title: 'Summary totals',
    points: 8,
    async run(t) {
      const card = async (sel, want, weight, label) => {
        const text = await t.eval((s) => document.querySelector(s)?.textContent ?? '', sel);
        await t.part(label, () => t.ok(near(money(text), want), `"${text.trim()}" → ${money(text)}, expected ${want.toFixed(2)}`), weight);
      };
      await card('#total-income', INCOME, 3, 'total income');
      await card('#total-expenses', EXPENSES, 3, 'total expenses (positive)');
      await card('#net', INCOME - EXPENSES, 2, 'net');
    },
  },
  {
    id: 'budgets',
    title: 'Budget cards match budgets.json',
    points: 6,
    async run(t) {
      const cards = await t.eval(() =>
        [...document.querySelectorAll('[data-budget]')].map((el) => ({
          cat: el.dataset.budget,
          spent: Number(el.dataset.spent),
          limit: Number(el.dataset.limit),
          over: el.dataset.over === 'true',
          barPct: (() => {
            const fill = el.querySelector('.bar-fill');
            const track = fill?.parentElement;
            if (!fill || !track || !track.getBoundingClientRect().width) return null;
            return (fill.getBoundingClientRect().width / track.getBoundingClientRect().width) * 100;
          })(),
        })),
      );
      const byCat = new Map(cards.map((c) => [c.cat, c]));
      const cats = Object.keys(BUDGETS);
      await t.part('spent per category', () => ({
        score: frac(cats.filter((c) => byCat.has(c) && near(byCat.get(c).spent, SPENT[c])).length, cats.length),
        note: cats.map((c) => `${c}: ${byCat.get(c)?.spent ?? '—'} (want ${SPENT[c].toFixed(2)})`).join(', '),
      }), 4);
      await t.part('limits match budgets.json', () => ({
        score: frac(cats.filter((c) => byCat.has(c) && near(byCat.get(c).limit, BUDGETS[c])).length, cats.length),
      }), 1);
      await t.part('over flags and bar widths', () => ({
        score: frac(cats.filter((c) => {
          const g = byCat.get(c);
          if (!g) return false;
          const wantPct = Math.min(100, (SPENT[c] / BUDGETS[c]) * 100);
          return g.over === SPENT[c] > BUDGETS[c] && g.barPct != null && Math.abs(g.barPct - wantPct) <= 3;
        }).length, cats.length),
        note: cats.map((c) => `${c}: ${byCat.get(c)?.barPct?.toFixed(0) ?? '—'}%`).join(', '),
      }), 1);
    },
  },
  {
    id: 'filter-search',
    title: 'Filtering and search (on the page\'s own data)',
    points: 6,
    async run(t) {
      const all = await rows(t);
      const counts = {};
      for (const r of all) counts[r.category] = (counts[r.category] ?? 0) + 1;
      const cat = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      const needle = (all.find((r) => r.description.trim().length >= 5)?.description ?? '').trim().slice(0, 5).toLowerCase();

      await setSelect(t, '#category-filter', cat);
      await t.sleep(200);
      const filtered = await rows(t);
      await t.part('category filter shows only that category', () => t.ok(filtered.length > 0 && filtered.every((r) => r.category === cat), `${filtered.length} rows, cat "${cat}"`));
      await t.part('tx-count matches filtered rows', async () => t.ok(leadingInt(await countText(t)) === filtered.length, `"${await countText(t)}" vs ${filtered.length}`));

      await setSelect(t, '#category-filter', 'all');
      await t.setInput('#search', needle);
      await t.sleep(250);
      const searched = await rows(t);
      await t.part('search narrows by description', () => t.ok(searched.length > 0 && searched.every((r) => r.description.toLowerCase().includes(needle)), `${searched.length} rows for "${needle}"`));

      await setSelect(t, '#category-filter', cat);
      await t.sleep(200);
      const combined = await rows(t);
      await t.part('filter and search combine', () => t.ok(combined.every((r) => r.category === cat && r.description.toLowerCase().includes(needle)), `${combined.length} rows`));

      await t.setInput('#search', 'zzz-no-such-text-xyzzy');
      await t.sleep(250);
      await t.part('empty state for a non-matching query', async () => t.ok((await rows(t)).length === 0 && (await emptyVisible(t)), `${(await rows(t)).length} rows, empty visible: ${await emptyVisible(t)}`));

      await resetFilters(t);
      await t.part('clearing restores all rows', async () => t.ok((await rows(t)).length === all.length && !(await emptyVisible(t)), `${(await rows(t)).length} of ${all.length}`));
    },
  },
  {
    id: 'sort',
    title: 'Sorting (on the page\'s own data)',
    points: 6,
    async run(t) {
      await resetFilters(t);
      const dates = async () => (await rows(t)).map((r) => r.date);
      const amounts = async () => (await rows(t)).map((r) => money(r.amountText));
      const sorted = (a, desc = false) => a.every((v, i) => !i || (desc ? a[i - 1] >= v : a[i - 1] <= v));

      await t.page.click('th[data-sort="date"]');
      await t.sleep(200);
      await t.part('date ascending on first click', async () => t.ok(sorted(await dates()), (await dates()).slice(0, 3).join(', ')), 2);
      await t.page.click('th[data-sort="date"]');
      await t.sleep(200);
      await t.part('date descending on second click', async () => t.ok(sorted(await dates(), true), (await dates()).slice(0, 3).join(', ')), 1);
      await t.page.click('th[data-sort="amount"]');
      await t.sleep(200);
      await t.part('amount ascending, numerically', async () => t.ok(sorted(await amounts()), (await amounts()).slice(0, 3).join(', ')), 2);
      await t.page.click('th[data-sort="amount"]');
      await t.sleep(200);
      await t.part('amount descending', async () => t.ok(sorted(await amounts(), true), (await amounts()).slice(0, 3).join(', ')), 1);
    },
  },
  {
    id: 'format',
    title: 'Number formatting',
    points: 4,
    async run(t) {
      await resetFilters(t);
      const all = await rows(t);
      await t.part('amounts show exactly two decimals', () => ({
        score: frac(all.filter((r) => /\d\.\d{2}(?!\d)/.test(r.amountText)).length, all.length),
        note: `${all.filter((r) => /\d\.\d{2}(?!\d)/.test(r.amountText)).length}/${all.length}`,
      }), 2);
      const neg = all.filter((r) => money(r.amountText) < 0).length;
      const pos = all.filter((r) => money(r.amountText) > 0).length;
      await t.part('income and expense both present and signed', () => ({
        score: neg > 0 && pos > 0 ? 1 : neg > 0 || pos > 0 ? 0.5 : 0,
        note: `${pos} positive, ${neg} negative`,
      }), 1);
      await setSelect(t, '#category-filter', (await t.eval(() => document.querySelector('#category-filter option:nth-child(2)')?.value)) ?? 'all');
      await t.sleep(200);
      await t.part('tx-count tracks the visible rows', async () => t.ok(leadingInt(await countText(t)) === (await rows(t)).length, `"${await countText(t)}"`), 1);
    },
  },
];

export async function showcase(t) {
  await t.sleep(600);
  await t.shot('ledger');
  const cat = await t.eval(() => document.querySelector('#category-filter option:nth-child(2)')?.value);
  if (cat) {
    await t.eval((v) => {
      const el = document.querySelector('#category-filter');
      el.value = v;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, cat);
    await t.sleep(400);
    await t.shot('filtered');
  }
  await t.eval(() => {
    const el = document.querySelector('#category-filter');
    el.value = 'all';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await t.setInput('#search', 'coffee');
  await t.sleep(400);
  await t.shot('search');
  await t.setInput('#search', '');
  await t.page.click('th[data-sort="amount"]').catch(() => {});
  await t.sleep(400);
  await t.shot('sorted');
  await t.eval(() => document.querySelector('[data-budget]')?.scrollIntoView({ block: 'center' }));
  await t.sleep(400);
  await t.shot('budgets');
}