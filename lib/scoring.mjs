import fs from 'node:fs';
import path from 'node:path';
import { VOTES_FILE } from './paths.mjs';

// How the single "Arena" number is formed. Automated checks are objective but
// blind to beauty; human preference covers that once there are enough votes.
export const WEIGHTS = { auto: 0.7, preference: 0.3 };
export const MIN_VOTES_FOR_PREFERENCE = 5;

export function readVotes() {
  try {
    return JSON.parse(fs.readFileSync(VOTES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

export function writeVotes(votes) {
  fs.mkdirSync(path.dirname(VOTES_FILE), { recursive: true });
  fs.writeFileSync(VOTES_FILE, JSON.stringify(votes, null, 1));
}

// Bradley–Terry strengths fitted with the classic MM iteration, reported on the
// Elo scale. Unlike running Elo updates, the result doesn't depend on vote
// order. Every model also plays one virtual win and one virtual loss against a
// fixed 1500-rated anchor, so a model with only wins gets a finite, cautious
// rating instead of infinity. Ties ("tie" and "both bad") count half a win each.
export function bradleyTerry(votes, models) {
  const ANCHOR = '\u0000anchor';
  const players = [...models, ANCHOR];
  const idx = new Map(players.map((m, i) => [m, i]));
  const n = players.length;
  const wins = new Float64Array(n);
  const games = Array.from({ length: n }, () => new Float64Array(n));
  const record = Object.fromEntries(models.map((m) => [m, { wins: 0, losses: 0, ties: 0, games: 0 }]));

  const add = (a, b, scoreA) => {
    const i = idx.get(a), j = idx.get(b);
    games[i][j]++;
    games[j][i]++;
    wins[i] += scoreA;
    wins[j] += 1 - scoreA;
  };
  for (const v of votes) {
    if (!idx.has(v.a) || !idx.has(v.b) || v.a === v.b) continue;
    const s = v.winner === 'a' ? 1 : v.winner === 'b' ? 0 : 0.5;
    add(v.a, v.b, s);
    const ra = record[v.a], rb = record[v.b];
    ra.games++; rb.games++;
    if (s === 1) { ra.wins++; rb.losses++; }
    else if (s === 0) { rb.wins++; ra.losses++; }
    else { ra.ties++; rb.ties++; }
  }
  for (const m of models) {
    add(m, ANCHOR, 1);
    add(m, ANCHOR, 0);
  }

  const p = new Float64Array(n).fill(1);
  const anchor = idx.get(ANCHOR);
  for (let iter = 0; iter < 500; iter++) {
    let delta = 0;
    for (let i = 0; i < n; i++) {
      if (i === anchor) continue;
      let denom = 0;
      for (let j = 0; j < n; j++) if (games[i][j]) denom += games[i][j] / (p[i] + p[j]);
      const next = denom ? Math.max(1e-6, wins[i] / denom) : p[i];
      delta = Math.max(delta, Math.abs(next - p[i]));
      p[i] = next;
    }
    if (delta < 1e-9) break;
  }
  const out = {};
  for (const m of models) {
    const elo = 1500 + 400 * Math.log10(p[idx.get(m)]);
    out[m] = { elo: Math.round(elo), ...record[m] };
  }
  return out;
}

// Expected score against an average (1500) opponent, as 0–100.
export const preferenceScore = (elo) => 100 / (1 + 10 ** ((1500 - elo) / 400));

export function leaderboard({ tasks, models, results, votes }) {
  // Two suites share one board. The original tasks (no `suite` in meta, or
  // suite !== 'v2') keep their historical meaning: Auto/Arena are computed
  // over them alone, so models graded before the v2 tasks existed keep their
  // exact scores. Auto v2/Arena v2 cover the original tasks PLUS the v2 tasks
  // and are only shown once a model has been graded on every active v2 task.
  const v1Tasks = tasks.filter((t) => t.meta.suite !== 'v2');
  const v2Tasks = tasks.filter((t) => t.meta.suite === 'v2');
  // Tasks nobody has attempted don't drag everyone's average down equally;
  // tasks some models skipped count as 0 for those models.
  const activeV1 = v1Tasks.filter((t) => models.some((m) => results[m]?.[t.id]));
  const activeV2 = v2Tasks.filter((t) => models.some((m) => results[m]?.[t.id]));
  const active = [...activeV1, ...activeV2];
  const overall = bradleyTerry(votes, models);
  const perTask = Object.fromEntries(
    tasks.map((t) => [t.id, bradleyTerry(votes.filter((v) => v.task === t.id), models)]),
  );
  const rows = models.map((model) => {
    const scores = Object.fromEntries(tasks.map((t) => [t.id, results[model]?.[t.id]?.score ?? null]));
    const attempted = active.filter((t) => scores[t.id] != null).length;
    const auto = activeV1.length ? activeV1.reduce((s, t) => s + (scores[t.id] ?? 0), 0) / activeV1.length : 0;
    const v2Attempted = activeV2.filter((t) => scores[t.id] != null).length;
    const v2Complete = activeV2.length > 0 && v2Attempted === activeV2.length;
    const auto2 = v2Complete ? active.reduce((s, t) => s + (scores[t.id] ?? 0), 0) / active.length : null;
    const pref = overall[model];
    const hasPref = pref.games >= MIN_VOTES_FOR_PREFERENCE;
    const prefScore = hasPref ? preferenceScore(pref.elo) : null;
    const arena = hasPref ? WEIGHTS.auto * auto + WEIGHTS.preference * prefScore : auto;
    const arena2 = auto2 == null ? null : hasPref ? WEIGHTS.auto * auto2 + WEIGHTS.preference * prefScore : auto2;
    const round1 = (n) => (n == null ? null : Math.round(n * 10) / 10);
    return {
      model,
      arena: round1(arena),
      auto: round1(auto),
      arena2: round1(arena2),
      auto2: round1(auto2),
      preference: prefScore == null ? null : round1(prefScore),
      elo: pref.elo,
      record: { wins: pref.wins, losses: pref.losses, ties: pref.ties, games: pref.games },
      attempted,
      of: active.length,
      v2Attempted,
      v2Of: activeV2.length,
      scores,
      taskElo: Object.fromEntries(tasks.map((t) => [t.id, perTask[t.id][model]])),
    };
  });
  rows.sort((a, b) => b.arena - a.arena || b.auto - a.auto || a.model.localeCompare(b.model));
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}
