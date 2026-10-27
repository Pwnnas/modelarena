// The `t` object handed to every check and showcase. Checks score themselves
// through t.part(label, fn): each part is isolated (an exception fails only that
// part), returns true/false, a 0..1 number, or { ok | score, note }, and the
// check's score is the weighted mean of its parts.
import * as image from './image.mjs';

const clamp01 = (x) => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));

function shortError(e) {
  const msg = String(e?.message ?? e).split('\n')[0];
  return msg.length > 220 ? msg.slice(0, 217) + '…' : msg;
}

export function createHarness({ page, context, url, task }) {
  const parts = [];
  const notes = [];

  const t = {
    page,
    context,
    url,
    task,
    parts,
    notes,
    image,

    ok: (cond, note = '') => ({ ok: !!cond, note }),
    note: (msg) => notes.push(String(msg)),

    async part(label, fn, weight = 1) {
      let score = 0;
      let note = '';
      try {
        const r = await fn();
        if (typeof r === 'number') score = clamp01(r);
        else if (r && typeof r === 'object') {
          score = r.score != null ? clamp01(r.score) : r.ok ? 1 : 0;
          note = r.note ?? '';
        } else score = r ? 1 : 0;
      } catch (e) {
        note = shortError(e);
      }
      parts.push({ label, weight, score, note: String(note) });
      return score;
    },

    async load() {
      await page.goto(url, { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(400);
    },
    async reload() {
      await page.reload({ waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(400);
    },
    sleep: (ms) => page.waitForTimeout(ms),
    eval: (fn, arg) => page.evaluate(fn, arg),

    // Re-run fn until it returns something truthy or the timeout passes; returns
    // the last value either way, so callers can report what they actually saw.
    async poll(fn, { timeout = 1500, interval = 50 } = {}) {
      const end = Date.now() + timeout;
      let last;
      for (;;) {
        try {
          last = await fn();
        } catch (e) {
          last = undefined;
        }
        if (last || Date.now() > end) return last;
        await page.waitForTimeout(interval);
      }
    },

    exists: (selector) => page.locator(selector).count().then((n) => n > 0),
    count: (selector) => page.locator(selector).count(),
    visible: (selector) => page.locator(selector).first().isVisible().catch(() => false),

    async box(selector) {
      const b = await page.locator(selector).first().boundingBox({ timeout: 2000 });
      if (!b) throw new Error(`${selector} has no bounding box`);
      return b;
    },

    // Set a form control the way a user would end up setting it, then fire both
    // input and change: graders can't drag a range slider to an exact value.
    async setInput(selector, value) {
      const found = await page.evaluate(
        ({ selector, value }) => {
          const el = document.querySelector(selector);
          if (!el) return false;
          const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, String(value));
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        },
        { selector, value },
      );
      if (!found) throw new Error(`${selector} not found`);
    },

    async drag(from, to, { steps = 14, button = 'left', hold = [], pause = 0 } = {}) {
      await page.mouse.move(from.x, from.y);
      for (const k of hold) await page.keyboard.down(k);
      await page.mouse.down({ button });
      if (pause) await page.waitForTimeout(pause);
      await page.mouse.move(to.x, to.y, { steps });
      if (pause) await page.waitForTimeout(pause);
      await page.mouse.up({ button });
      for (const k of [...hold].reverse()) await page.keyboard.up(k);
    },

    // Ctrl on Windows/Linux, Cmd on macOS. Prompts require both to work.
    shortcut: (key) => page.keyboard.press(`ControlOrMeta+${key}`),

    blur: () => page.evaluate(() => document.activeElement?.blur?.()),

    async screenshot(options = {}) {
      return image.decode(await page.screenshot({ type: 'png', ...options }));
    },

    // Frame rate as the browser actually produces it while the page runs. A slow
    // page stalls the main thread, so our own rAF loop sees the dropped frames.
    async fps(ms = 2000) {
      return page.evaluate(
        (ms) =>
          new Promise((resolve) => {
            const deltas = [];
            let last = performance.now();
            const start = last;
            const tick = (now) => {
              deltas.push(now - last);
              last = now;
              if (now - start < ms) requestAnimationFrame(tick);
              else {
                deltas.shift();
                const sorted = [...deltas].sort((a, b) => a - b);
                const elapsed = (now - start) / 1000;
                resolve({
                  fps: deltas.length / elapsed,
                  p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
                  max: sorted.at(-1) ?? 0,
                });
              }
            };
            requestAnimationFrame((now) => {
              last = now;
              requestAnimationFrame(tick);
            });
          }),
        ms,
      );
    },

    // Wait until two screenshots `gap` ms apart are (nearly) identical, e.g. after
    // a WebGL scene regenerates. Returns the settled image, or the last one taken.
    async stableShot({ timeout = 5000, gap = 250, tolerance = 0.002, region } = {}) {
      const end = Date.now() + timeout;
      let prev = await t.screenshot();
      for (;;) {
        await page.waitForTimeout(gap);
        const next = await t.screenshot();
        if (image.diff(prev, next, { region }) <= tolerance) return next;
        if (Date.now() > end) return next;
        prev = next;
      }
    },

    // Serializable view of the instrumentation from probe.js.
    probe: () =>
      page.evaluate(() => {
        const p = window.__probe;
        if (!p) return null;
        return {
          canvases: p.canvases.map((c) => ({
            type: c.type,
            width: c.canvas.width,
            height: c.canvas.height,
            clientWidth: c.canvas.clientWidth,
            clientHeight: c.canvas.clientHeight,
            connected: c.canvas.isConnected,
          })),
          audio: {
            contexts: p.audio.contexts.length,
            starts: p.audio.starts.slice(),
            analyserReads: p.audio.analyserReads,
            currentTime: p.audio.contexts[0]?.currentTime ?? null,
            state: p.audio.contexts[0]?.state ?? null,
          },
        };
      }),
  };
  return t;
}

export function scoreParts(parts) {
  const total = parts.reduce((s, p) => s + p.weight, 0);
  if (!total) return 0;
  return parts.reduce((s, p) => s + p.weight * p.score, 0) / total;
}
