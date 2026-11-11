import fs from 'node:fs';
import zlib from 'node:zlib';

export const meta = {
  title: 'Relay',
  subtitle: 'Binary protocol decoder + capture explorer',
  order: 8,
  suite: 'v2',
  skills: ['tool use: multi-step decoding', 'binary protocols', 'varint/zigzag/CRC', 'data visualization'],
  summary:
    'Implement a telemetry packet protocol (LEB128 varints, zigzag, CRC-16/CCITT-FALSE) and explore a capture that ships gzipped and split into three base64 parts with checksums. Recovering the capture requires a real multi-step tool workflow; the decoder itself is fully specified in the prompt, so half the points are reachable without tools.',
  judging: [
    'Does it feel like an instrument panel: hex typography, crisp tables, clear states?',
    'Is the valid/invalid distinction and the stats bar readable at a glance?',
    'Does decoding feel responsive and precise?',
  ],
};

// ── Reference decoder (mirrors the spec in PROMPT.md) ─────────────────────
function crc16(bytes) {
  let crc = 0xffff;
  for (const b of bytes) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc;
}

function decodePacket(hex) {
  if (typeof hex !== 'string' || hex.length === 0 || hex.length % 2 || /[^0-9a-fA-F]/.test(hex)) return { ok: false, error: 'format' };
  const b = Buffer.from(hex, 'hex');
  if (b[0] !== 0xa7) return { ok: false, error: 'magic' };
  if (b.length < 2 || b[1] !== 0x02) return { ok: false, error: 'version' };
  if (b.length >= 3 && b[2] & 0xf0) return { ok: false, error: 'flags' };
  if (b.length < 5) return { ok: false, error: 'truncated' };
  const flags = b[2], seq = b[3], n = b[4];
  const end = b.length - 2;
  let off = 5;
  if (n < 1 || n > 15 || off + n > end) return { ok: false, error: 'truncated' };
  const device = b.subarray(off, off + n).toString('ascii');
  off += n;
  const varint = () => {
    let v = 0, shift = 0, count = 0;
    for (;;) {
      if (off >= end) throw new Error('truncated');
      const x = b[off++];
      if (++count > 5) throw new Error('truncated');
      v |= (x & 0x7f) << shift;
      if (!(x & 0x80)) return v >>> 0;
      shift += 7;
    }
  };
  const zigzag = () => { const v = varint(); return (v >>> 1) ^ -(v & 1); };
  const out = { ok: true, seq, device };
  try {
    if (flags & 1) out.temperature = zigzag() / 10;
    if (flags & 2) { if (off >= end) throw new Error('truncated'); out.humidity = b[off++]; }
    if (flags & 4) out.battery = varint();
    if (flags & 8) out.gps = { lat: zigzag() / 1e5, lon: zigzag() / 1e5 };
  } catch {
    return { ok: false, error: 'truncated' };
  }
  if (off !== end) return { ok: false, error: 'trailing' };
  if (crc16(b.subarray(0, end)) !== ((b[end] << 8) | b[end + 1])) return { ok: false, error: 'crc' };
  return out;
}

// Device name as far as the header can be read (for data-device on invalid packets).
function headerDevice(hex) {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2) return '';
  const b = Buffer.from(hex, 'hex');
  if (b[0] !== 0xa7 || b.length < 5) return '';
  const n = b[4];
  if (n < 1 || n > 15 || 5 + n > b.length) return '';
  return b.subarray(5, 5 + n).toString('ascii');
}
const headerSeq = (hex) => {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 || hex.length < 8) return null;
  return Buffer.from(hex, 'hex')[3];
};

// ── Expected values from the workspace bundle ─────────────────────────────
const WS = new URL('./workspace/', import.meta.url);
const VECTORS = JSON.parse(fs.readFileSync(new URL('vectors.json', WS), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(new URL('capture/manifest.json', WS), 'utf8'));
const gz = Buffer.concat(manifest.parts.map((p) => Buffer.from(fs.readFileSync(new URL(`capture/${p.file}`, WS), 'utf8').trim(), 'base64')));
const CAPTURE = zlib.gunzipSync(gz).toString('utf8').trim().split('\n').map((l) => JSON.parse(l).hex)
  .map((hex) => ({ hex, decoded: decodePacket(hex), device: headerDevice(hex), seq: headerSeq(hex) }));
const VALID = CAPTURE.filter((p) => p.decoded.ok);
const TEMPS = VALID.filter((p) => p.decoded.temperature != null).map((p) => p.decoded.temperature);
const MIN_TEMP = Math.min(...TEMPS), MAX_TEMP = Math.max(...TEMPS);
const DEVICES = [...new Set(VALID.map((p) => p.decoded.device))].sort();
const DEVICE_COUNTS = Object.fromEntries(DEVICES.map((d) => [d, VALID.filter((p) => p.decoded.device === d).length]));

// ── Comparison helpers ─────────────────────────────────────────────────────
const near = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1e-6;
function matches(got, want) {
  if (!got || typeof got !== 'object' || got.ok !== want.ok) return false;
  if (!want.ok) return got.error === want.error;
  if (got.seq !== want.seq || got.device !== want.device) return false;
  const keys = ['temperature', 'humidity', 'battery', 'gps'];
  if (keys.some((k) => (k in got) !== (k in want))) return false;
  if (want.temperature != null && !near(got.temperature, want.temperature)) return false;
  if (want.humidity != null && got.humidity !== want.humidity) return false;
  if (want.battery != null && got.battery !== want.battery) return false;
  if (want.gps && (!got.gps || !near(got.gps.lat, want.gps.lat) || !near(got.gps.lon, want.gps.lon))) return false;
  return true;
}
const frac = (hits, total) => (total ? hits / total : 0);
const num = (text) => Number(String(text).replace(/\u2212/g, '-').replace(/[^0-9.\-]/g, ''));

const setSelect = (t, sel, value) =>
  t.eval(({ sel, value }) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`${sel} not found`);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, { sel, value });

async function decodeInUI(t, hex) {
  await t.setInput('#hex-input', hex);
  await t.page.click('#decode-btn');
  await t.sleep(200);
}

const detailFields = (t, sel) =>
  t.eval((sel) => {
    const root = document.querySelector(sel);
    if (!root) return null;
    const out = { text: root.textContent ?? '' };
    for (const tr of root.querySelectorAll('tr[data-field]')) {
      out[tr.dataset.field] = tr.querySelector('td.value')?.textContent.trim() ?? tr.textContent.trim();
    }
    return out;
  }, sel);

const fieldOK = (fields, decoded) => {
  if (!fields) return false;
  if (fields.seq != null && num(fields.seq) !== decoded.seq) return false;
  if (fields.device != null && fields.device !== decoded.device) return false;
  if (decoded.temperature != null && (fields.temperature == null || !near(num(fields.temperature), decoded.temperature))) return false;
  if (decoded.humidity != null && (fields.humidity == null || num(fields.humidity) !== decoded.humidity)) return false;
  if (decoded.battery != null && (fields.battery == null || num(fields.battery) !== decoded.battery)) return false;
  if (decoded.gps) {
    const m = String(fields.gps ?? '').match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);
    if (!m || !near(Number(m[1]), decoded.gps.lat) || !near(Number(m[2]), decoded.gps.lon)) return false;
  }
  return true;
};

export const checks = [
  {
    id: 'decoder-basic',
    title: 'decodePacket: valid packets',
    points: 8,
    async run(t) {
      for (const v of VECTORS.filter((v) => v.expect.ok)) {
        await t.part(`vector "${v.name}"`, async () => {
          const got = await t.eval((hex) => (typeof window.decodePacket === 'function' ? window.decodePacket(hex) : null), v.hex);
          return t.ok(matches(got, v.expect), JSON.stringify(got));
        });
      }
    },
  },
  {
    id: 'decoder-errors',
    title: 'decodePacket: error classification',
    points: 8,
    async run(t) {
      for (const v of VECTORS.filter((v) => !v.expect.ok)) {
        await t.part(`"${v.name}" → ${v.expect.error}`, async () => {
          const got = await t.eval((hex) => (typeof window.decodePacket === 'function' ? window.decodePacket(hex) : null), v.hex);
          return t.ok(matches(got, v.expect), JSON.stringify(got));
        });
      }
    },
  },
  {
    id: 'decoder-ui',
    title: 'Decoder UI',
    points: 6,
    async run(t) {
      const full = VECTORS.find((v) => v.name === 'all-fields');
      await decodeInUI(t, full.hex);
      await t.part('valid packet renders every field', async () => {
        const visible = await t.visible('#decode-result');
        const fields = await detailFields(t, '#decode-result');
        return t.ok(visible && fieldOK(fields, full.expect), JSON.stringify(fields));
      }, 2);
      const bad = VECTORS.find((v) => v.name === 'bad-crc');
      await decodeInUI(t, bad.hex);
      await t.part('error packet shows the code', async () => {
        const errVisible = await t.visible('#decode-error');
        const text = await t.eval(() => document.querySelector('#decode-error')?.textContent ?? '');
        return t.ok(errVisible && text.includes('crc') && !(await t.visible('#decode-result')), `"${text.trim()}"`);
      }, 2);
      const minimal = VECTORS.find((v) => v.name === 'minimal');
      await decodeInUI(t, minimal.hex);
      await t.part('decoding again replaces the result', async () => {
        const fields = await detailFields(t, '#decode-result');
        return t.ok((await t.visible('#decode-result')) && fieldOK(fields, minimal.expect) && fields.temperature == null && !(await t.visible('#decode-error')), JSON.stringify(fields));
      }, 2);
    },
  },
  {
    id: 'capture-rows',
    title: 'Capture explorer lists the real capture',
    points: 14,
    timeout: 45000,
    async run(t) {
      const items = await t.eval(() =>
        [...document.querySelectorAll('[data-packet]')].map((el) => ({
          seq: el.dataset.packet, device: el.dataset.device ?? '', invalid: el.dataset.invalid === 'true',
        })),
      );
      const bySeq = new Map(items.map((i) => [String(i.seq), i]));
      await t.part('all 26 packets listed', () => ({
        score: frac(CAPTURE.filter((p) => bySeq.has(String(p.seq))).length, CAPTURE.length),
        note: `${items.length} items, ${CAPTURE.length} expected`,
      }), 2);
      await t.part('device names and validity flags', () => ({
        score: frac(CAPTURE.filter((p) => {
          const g = bySeq.get(String(p.seq));
          return g && g.device === p.device && g.invalid === !p.decoded.ok;
        }).length, CAPTURE.length),
        note: `${CAPTURE.filter((p) => { const g = bySeq.get(String(p.seq)); return g && g.device === p.device && g.invalid === !p.decoded.ok; }).length}/${CAPTURE.length} correct`,
      }), 4);
      let hits = 0;
      const misses = [];
      for (const p of VALID) {
        const clicked = await t.eval((seq) => {
          const el = document.querySelector(`[data-packet="${seq}"]`);
          if (!el) return false;
          el.click();
          return true;
        }, String(p.seq));
        await t.sleep(80);
        const fields = clicked ? await detailFields(t, '#packet-detail') : null;
        if (fieldOK(fields, p.decoded)) hits++;
        else misses.push(p.decoded.seq);
      }
      await t.part('per-packet detail matches the decode', () => ({
        score: frac(hits, VALID.length),
        note: `${hits}/${VALID.length} packets correct${misses.length ? `; wrong: ${misses.slice(0, 8).join(', ')}` : ''}`,
      }), 8);
    },
  },
  {
    id: 'capture-stats',
    title: 'Capture statistics',
    points: 8,
    async run(t) {
      const stat = async (sel) => num(await t.eval((s) => document.querySelector(s)?.textContent ?? '', sel));
      const total = await stat('#stat-total'), valid = await stat('#stat-valid'), invalid = await stat('#stat-invalid');
      await t.part('total / valid / invalid counts', () => ({
        score: frac([total === CAPTURE.length, valid === VALID.length, invalid === CAPTURE.length - VALID.length].filter(Boolean).length, 3),
        note: `${total}/${valid}/${invalid}, want ${CAPTURE.length}/${VALID.length}/${CAPTURE.length - VALID.length}`,
      }), 3);
      const minT = await stat('#stat-min-temp'), maxT = await stat('#stat-max-temp');
      await t.part('min / max temperature', () => ({
        score: frac([near(minT, MIN_TEMP), near(maxT, MAX_TEMP)].filter(Boolean).length, 2),
        note: `${minT}…${maxT} °C, want ${MIN_TEMP}…${MAX_TEMP}`,
      }), 3);
      const counts = await t.eval(() =>
        Object.fromEntries([...document.querySelectorAll('[data-device-count]')].map((el) => [el.dataset.deviceCount, el.textContent])),
      );
      await t.part('per-device valid counts', () => ({
        score: frac(DEVICES.filter((d) => num(counts[d]) === DEVICE_COUNTS[d]).length, DEVICES.length),
        note: DEVICES.map((d) => `${d}: ${num(counts[d]) || 0} (want ${DEVICE_COUNTS[d]})`).join(', '),
      }), 2);
    },
  },
  {
    id: 'capture-ui',
    title: 'Explorer interactions',
    points: 4,
    async run(t) {
      await t.part('clicking a packet shows its detail', async () => {
        const ok = await t.eval(() => {
          const el = document.querySelector('[data-packet]');
          if (!el) return false;
          el.click();
          return true;
        });
        await t.sleep(200);
        const d = await detailFields(t, '#packet-detail');
        return t.ok(ok && d && (Object.keys(d).length > 1 || /[a-z]+/.test(d.text)), JSON.stringify(d)?.slice(0, 120));
      }, 2);
      await t.part('invalid packets are marked and show an error', async () => {
        const ok = await t.eval(() => {
          const el = document.querySelector('[data-invalid="true"]');
          if (!el) return false;
          el.click();
          return true;
        });
        if (!ok) return t.ok(false, 'no [data-invalid="true"] item');
        await t.sleep(200);
        const text = await t.eval(() => document.querySelector('#packet-detail')?.textContent ?? '');
        return t.ok(/format|magic|version|flags|truncated|trailing|crc/.test(text), `"${text.trim().slice(0, 80)}"`);
      }, 2);
    },
  },
];

export async function showcase(t) {
  await t.sleep(500);
  await t.shot('app');
  const full = VECTORS.find((v) => v.name === 'all-fields');
  await t.setInput('#hex-input', full.hex);
  await t.page.click('#decode-btn');
  await t.sleep(400);
  await t.shot('decoded');
  const bad = VECTORS.find((v) => v.name === 'bad-crc');
  await t.setInput('#hex-input', bad.hex);
  await t.page.click('#decode-btn');
  await t.sleep(400);
  await t.shot('error');
  await t.eval(() => document.querySelector('#capture-list')?.scrollIntoView({ block: 'start' }));
  await t.sleep(300);
  await t.shot('capture');
  const gpsPacket = VALID.find((p) => p.decoded.gps);
  if (gpsPacket) {
    await t.eval((seq) => document.querySelector(`[data-packet="${seq}"]`)?.click(), String(gpsPacket.decoded.seq));
    await t.sleep(400);
    await t.shot('packet-detail');
  }
}