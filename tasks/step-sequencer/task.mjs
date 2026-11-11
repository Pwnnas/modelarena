export const meta = {
  title: 'Pulse',
  subtitle: 'Drum machine & step sequencer',
  order: 3,
  skills: ['Web Audio synthesis', 'real-time scheduling', 'hardware-style UI'],
  summary:
    'An 8-track, 16-step drum machine with synthesized voices, a lookahead scheduler on the audio clock, live tempo and swing, mutes, a visualizer and persistence.',
  judging: [
    'Do the drums sound good (punchy kick, crisp hats, recognizable voices)? Turn your sound on.',
    'Does it look and feel like a premium instrument: tactile steps, glowing playhead, micro-animations?',
    'Is the playhead in sync with what you hear? Does a tempo change stay smooth?',
  ],
};

const step = (tr, st) => `button[data-track="${tr}"][data-step="${st}"]`;
const STEP_120 = 60 / 120 / 4;

async function clearPattern(t) {
  for (let round = 0; round < 3; round++) {
    // Resolve to stable track/step selectors first: an nth() locator over
    // [aria-pressed="true"] shifts as each click un-presses a step.
    const pressed = await t.page
      .locator('button[data-track][data-step][aria-pressed="true"]')
      .evaluateAll((els) => els.map((el) => [el.dataset.track, el.dataset.step]));
    if (!pressed.length) return;
    for (const [tr, st] of pressed) await t.page.click(step(tr, st));
  }
}

async function setPattern(t, cells) {
  await clearPattern(t);
  for (const [tr, st] of cells) await t.page.click(step(tr, st));
}

const playhead = (t) => t.eval(() => Number(document.querySelector('#sequencer')?.getAttribute('data-playhead')));
const isPlaying = async (t) => (await playhead(t)) >= 0;

async function play(t) {
  await t.page.click('#play');
  await t.poll(() => isPlaying(t), { timeout: 1500 });
}

async function stop(t) {
  if (await isPlaying(t)) await t.page.click('#play');
  await t.poll(async () => !(await isPlaying(t)), { timeout: 800 });
}

// Collect source-node starts for `ms` of wall time and collapse voices that
// start together (kick body + click, etc.) into single hits.
async function captureHits(t, ms) {
  const before = (await t.probe()).audio.starts.length;
  await t.sleep(ms);
  const starts = (await t.probe()).audio.starts.slice(before);
  return { starts, hits: clusterHits(starts) };
}

function clusterHits(starts, gap = 0.012) {
  const times = starts.map((s) => Math.max(s.when, s.now)).sort((a, b) => a - b);
  const hits = [];
  for (const x of times) if (!hits.length || x - hits.at(-1) > gap) hits.push(x);
  return hits;
}

const intervals = (hits) => hits.slice(1).map((h, i) => h - hits[i]);
const ms = (s) => `${(s * 1000).toFixed(2)} ms`;

export const checks = [
  {
    id: 'grid',
    title: 'Step grid and controls',
    points: 5,
    async run(t) {
      await t.part('128 step toggles with unique track/step', () =>
        t.eval(() => {
          const els = [...document.querySelectorAll('button[data-track][data-step]')];
          const keys = new Set(els.map((e) => `${e.dataset.track}:${e.dataset.step}`));
          return els.length === 128 && keys.size === 128;
        }),
      );
      await t.part('clicking toggles aria-pressed', async () => {
        const s = step(3, 6);
        const get = () => t.page.getAttribute(s, 'aria-pressed');
        const a = await get();
        await t.page.click(s);
        const b = await get();
        await t.page.click(s);
        const c = await get();
        return t.ok(a !== b && a === c && ['true', 'false'].includes(b), `${a} → ${b} → ${c}`);
      }, 2);
      await t.part('8 mute buttons and 8 volume sliders', async () =>
        t.ok((await t.count('button[data-mute]')) === 8 && (await t.count('input[data-volume]')) === 8, `${await t.count('button[data-mute]')} mutes, ${await t.count('input[data-volume]')} volumes`),
      );
      await t.part('#play, #tempo, #swing, #sequencer exist', () =>
        t.eval(() => ['#play', '#tempo', '#swing', '#sequencer'].every((s) => document.querySelector(s))),
      );
    },
  },
  {
    id: 'transport',
    title: 'Play / stop / Space and playhead',
    points: 6,
    async run(t) {
      await clearPattern(t);
      await t.page.click('#play');
      const seen = new Set();
      for (let i = 0; i < 24; i++) {
        seen.add(await playhead(t));
        await t.sleep(50);
      }
      await t.part('playhead advances while playing', () => {
        const valid = [...seen].filter((v) => v >= 0 && v <= 15);
        return t.ok(valid.length >= 6, `distinct playhead values in 1.2 s: ${[...seen].join(',')}`);
      }, 2);
      await t.page.click('#play');
      await t.part('stop sets data-playhead to -1', async () => t.ok(await t.poll(async () => (await playhead(t)) === -1, { timeout: 800 }), `playhead: ${await playhead(t)}`));
      await t.blur();
      await t.page.keyboard.press('Space');
      await t.part('Space starts playback', async () => t.ok(await t.poll(() => isPlaying(t), { timeout: 1000 }), 'did not start'));
      await t.blur();
      await t.page.keyboard.press('Space');
      await t.part('Space stops playback', async () => t.ok(await t.poll(async () => (await playhead(t)) === -1, { timeout: 1000 }), 'did not stop'));
    },
  },
  {
    id: 'triggers',
    title: 'Programmed steps produce scheduled notes',
    points: 8,
    async run(t) {
      await setPattern(t, [[0, 0], [0, 4], [0, 8], [0, 12]]);
      await play(t);
      const { hits } = await captureHits(t, 2300);
      await stop(t);
      await t.part('notes are started on the audio graph', () => t.ok(hits.length >= 3, `${hits.length} hits in 2.3 s`));
      await t.part('four-on-the-floor lands every 500 ms', () => {
        const iv = intervals(hits);
        if (!iv.length) return t.ok(false, 'no intervals');
        const good = iv.filter((d) => Math.abs(d - 0.5) <= 0.01).length;
        return { score: good / iv.length, note: `intervals: ${iv.map(ms).join(', ')}` };
      }, 2);
    },
  },
  {
    id: 'mapping',
    title: 'Pattern-to-time mapping across tracks',
    points: 8,
    async run(t) {
      const pattern = [[0, 0], [1, 5], [2, 10], [5, 13]];
      await setPattern(t, pattern);
      await play(t);
      const { hits } = await captureHits(t, 2400);
      await stop(t);
      await t.part('hits land on the programmed steps', () => {
        if (hits.length < 2) return t.ok(false, `${hits.length} hits`);
        const rel = new Set(hits.map((h) => ((Math.round((h - hits[0]) / STEP_120) % 16) + 16) % 16));
        const expected = pattern.map(([, s]) => s);
        let best = 0;
        for (const r of expected) {
          const shifted = new Set(expected.map((e) => (e - r + 16) % 16));
          const inter = [...rel].filter((x) => shifted.has(x)).length;
          best = Math.max(best, inter / new Set([...rel, ...shifted]).size);
        }
        return { score: best, note: `relative step positions heard: ${[...rel].sort((a, b) => a - b).join(',')}` };
      }, 3);
      await t.part('every programmed step sounds each bar', () => t.ok(hits.length >= 4, `${hits.length} hits in 2.4 s (expected ≥ 4)`));
    },
  },
  {
    id: 'timing',
    title: 'Sample-accurate timing (lookahead scheduling)',
    points: 10,
    async run(t) {
      await setPattern(t, Array.from({ length: 16 }, (_, s) => [2, s]));
      await play(t);
      await t.sleep(300);
      const { starts, hits } = await captureHits(t, 2000);
      await stop(t);
      await t.part('16th-note intervals are exact', () => {
        const iv = intervals(hits);
        if (iv.length < 8) return t.ok(false, `${hits.length} hits`);
        const dev = Math.max(...iv.map((d) => Math.abs(d - STEP_120)));
        const score = dev <= 0.0005 ? 1 : dev <= 0.002 ? 0.75 : dev <= 0.006 ? 0.5 : dev <= 0.015 ? 0.25 : 0;
        return { score, note: `max deviation from 125 ms grid: ${ms(dev)} over ${iv.length} intervals` };
      }, 3);
      await t.part('notes are scheduled ahead on the audio clock', () => {
        if (!starts.length) return t.ok(false, 'no starts');
        const ahead = starts.filter((s) => s.when > s.now + 0.002).length / starts.length;
        return { score: ahead >= 0.9 ? 1 : ahead, note: `${Math.round(ahead * 100)}% of start() calls scheduled in the future` };
      });
    },
  },
  {
    id: 'tempo',
    title: 'Live tempo change',
    points: 8,
    async run(t) {
      await setPattern(t, Array.from({ length: 16 }, (_, s) => [2, s]));
      await play(t);
      await t.sleep(500);
      await t.setInput('#tempo', '90');
      await t.sleep(350);
      const { hits } = await captureHits(t, 1600);
      const still = await isPlaying(t);
      await stop(t);
      await t.part('new tempo applies while playing (166.7 ms steps)', () => {
        const iv = intervals(hits);
        if (iv.length < 4) return t.ok(false, `${hits.length} hits`);
        const target = 60 / 90 / 4;
        const good = iv.filter((d) => Math.abs(d - target) <= 0.002).length;
        return { score: good / iv.length, note: `intervals: ${iv.slice(0, 6).map(ms).join(', ')}…` };
      }, 3);
      await t.part('playback continues through the change', () => t.ok(still, 'stopped after tempo change'));
    },
  },
  {
    id: 'swing',
    title: 'Swing',
    points: 5,
    async run(t) {
      await setPattern(t, Array.from({ length: 16 }, (_, s) => [2, s]));
      await t.setInput('#swing', '60');
      await play(t);
      await t.sleep(300);
      const { hits } = await captureHits(t, 1500);
      await stop(t);
      const iv = intervals(hits);
      if (iv.length < 6) return { score: 0, note: `${hits.length} hits` };
      const even = iv.filter((_, i) => i % 2 === 0);
      const odd = iv.filter((_, i) => i % 2 === 1);
      const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
      const long = Math.max(mean(even), mean(odd));
      const short = Math.min(mean(even), mean(odd));
      const exact = Math.abs(long - 0.15) <= 0.003 && Math.abs(short - 0.1) <= 0.003;
      return {
        score: exact ? 1 : long / short > 1.15 ? 0.5 : 0,
        note: `long/short pair: ${ms(long)} / ${ms(short)} (expected 150 / 100 ms at swing 60)`,
      };
    },
  },
  {
    id: 'mute',
    title: 'Mute stops a track from triggering',
    points: 5,
    async run(t) {
      await setPattern(t, [[0, 0], [0, 4], [0, 8], [0, 12], [1, 4], [1, 12]]);
      await t.page.click('button[data-mute="0"]');
      await t.part('mute button reports aria-pressed', async () => t.ok((await t.page.getAttribute('button[data-mute="0"]', 'aria-pressed')) === 'true', 'aria-pressed not "true"'));
      await play(t);
      const muted = await captureHits(t, 2100);
      await stop(t);
      await t.part('muted kick triggers nothing (snare only)', () => {
        const iv = intervals(muted.hits);
        const ok = muted.hits.length >= 2 && iv.every((d) => Math.abs(d - 1) <= 0.01);
        return t.ok(ok, `${muted.hits.length} hits, intervals ${iv.map(ms).join(', ')}`);
      }, 2);
      await t.page.click('button[data-mute="0"]');
      await play(t);
      const open = await captureHits(t, 2100);
      await stop(t);
      await t.part('unmuting brings the kick back', () => {
        const iv = intervals(open.hits);
        const ok = open.hits.length >= 4 && iv.every((d) => Math.abs(d - 0.5) <= 0.01);
        return t.ok(ok, `${open.hits.length} hits, intervals ${iv.map(ms).join(', ')}`);
      });
    },
  },
  {
    id: 'playhead-sync',
    title: 'Playhead matches the audio clock',
    points: 5,
    async run(t) {
      await setPattern(t, [[0, 0]]);
      await play(t);
      await t.sleep(400);
      const samples = await t.eval(
        () =>
          new Promise((resolve) => {
            const ctx = window.__probe.audio.contexts[0];
            const out = [];
            const end = performance.now() + 1600;
            const tick = () => {
              out.push([ctx.currentTime, Number(document.querySelector('#sequencer').getAttribute('data-playhead'))]);
              if (performance.now() < end) requestAnimationFrame(tick);
              else resolve(out);
            };
            requestAnimationFrame(tick);
          }),
      );
      const kicks = clusterHits((await t.probe()).audio.starts);
      await stop(t);
      let good = 0, total = 0;
      for (const [time, ph] of samples) {
        const last = kicks.filter((k) => k <= time).at(-1);
        if (last == null) continue;
        const expected = Math.floor((time - last) / STEP_120 + 1e-6) % 16;
        const d = Math.abs(ph - expected);
        if (Math.min(d, 16 - d) <= 1) good++;
        total++;
      }
      if (!total) return { score: 0, note: 'no samples after the first kick' };
      const frac = good / total;
      return { score: frac >= 0.9 ? 1 : frac, note: `${Math.round(frac * 100)}% of ${total} frames within one step of the audio clock` };
    },
  },
  {
    id: 'persistence',
    title: 'State persists across reload',
    points: 5,
    async run(t) {
      await setPattern(t, [[0, 0], [3, 7], [7, 15]]);
      await t.setInput('#tempo', '100');
      await t.page.click('button[data-mute="2"]');
      await t.sleep(700);
      await t.reload();
      await t.part('pattern restored', async () => {
        const on = await t.eval(() => [...document.querySelectorAll('button[data-track][data-step][aria-pressed="true"]')].map((b) => `${b.dataset.track}:${b.dataset.step}`).sort());
        return t.ok(on.join(' ') === ['0:0', '3:7', '7:15'].sort().join(' '), `active after reload: ${on.join(' ') || 'none'}`);
      }, 2);
      await t.part('tempo restored', async () => {
        const v = await t.page.inputValue('#tempo');
        return t.ok(Number(v) === 100, `#tempo = ${v}`);
      });
      await t.part('mute restored', async () => t.ok((await t.page.getAttribute('button[data-mute="2"]', 'aria-pressed')) === 'true', 'mute 2 not pressed'));
    },
  },
  {
    id: 'visuals',
    title: 'Animation, frame rate and visualizer',
    points: 5,
    async run(t) {
      await setPattern(t, Array.from({ length: 16 }, (_, s) => [2, s]));
      await play(t);
      await t.sleep(500);
      const reads0 = (await t.probe()).audio.analyserReads;
      const a = await t.screenshot();
      await t.sleep(130);
      const b = await t.screenshot();
      await t.part('UI animates with the music', () => {
        const d = t.image.diff(a, b);
        return t.ok(d > 0.0005, `${(d * 100).toFixed(3)}% of pixels changed between frames`);
      });
      const f = await t.fps(2000);
      await t.part('smooth while playing', () => ({
        score: f.fps >= 55 ? 1 : f.fps >= 45 ? 0.6 : f.fps >= 30 ? 0.3 : 0,
        note: `${f.fps.toFixed(1)} fps, p95 frame ${f.p95.toFixed(1)} ms`,
      }), 2);
      await t.part('AnalyserNode drives a visualizer', async () => {
        const reads = (await t.probe()).audio.analyserReads - reads0;
        return t.ok(reads > 20, `${reads} analyser reads in 2 s`);
      });
      await stop(t);
    },
  },
];

export async function showcase(t) {
  const beat = [
    [0, 0], [0, 6], [0, 8], [0, 11],
    [1, 4], [1, 12],
    ...[0, 2, 4, 6, 8, 10, 12, 14].map((s) => [2, s]),
    [3, 15], [4, 12], [5, 13], [6, 14], [7, 3], [7, 10],
  ];
  await clearPattern(t);
  for (const [tr, st] of beat) {
    await t.page.click(step(tr, st));
    await t.sleep(40);
  }
  await t.shot('pattern');
  await t.page.click('#play');
  await t.sleep(2500);
  await t.shot('playing');
  await t.setInput('#swing', '45');
  await t.sleep(2500);
  await t.setInput('#tempo', '140');
  await t.sleep(2000);
  await t.shot('fast');
  await t.page.click('#play');
}
