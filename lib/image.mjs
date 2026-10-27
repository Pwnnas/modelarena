// Pixel analysis on Playwright screenshots. Images are { width, height, data }
// with RGBA bytes; regions are { x, y, width, height } in image pixels.
import { PNG } from 'pngjs';

export function decode(buffer) {
  const png = PNG.sync.read(buffer);
  return { width: png.width, height: png.height, data: png.data };
}

function clampRegion(img, region) {
  const r = region ?? { x: 0, y: 0, width: img.width, height: img.height };
  const x0 = Math.max(0, Math.floor(r.x));
  const y0 = Math.max(0, Math.floor(r.y));
  const x1 = Math.min(img.width, Math.ceil(r.x + r.width));
  const y1 = Math.min(img.height, Math.ceil(r.y + r.height));
  return { x0, y0, x1, y1 };
}

const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// Fraction of pixels whose largest channel difference exceeds `tolerance`.
export function diff(a, b, { tolerance = 24, region, step = 2 } = {}) {
  if (a.width !== b.width || a.height !== b.height) return 1;
  const { x0, y0, x1, y1 } = clampRegion(a, region);
  let changed = 0;
  let total = 0;
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const i = (y * a.width + x) * 4;
      const d = Math.max(
        Math.abs(a.data[i] - b.data[i]),
        Math.abs(a.data[i + 1] - b.data[i + 1]),
        Math.abs(a.data[i + 2] - b.data[i + 2]),
      );
      if (d > tolerance) changed++;
      total++;
    }
  }
  return total ? changed / total : 0;
}

// Mean color, mean luminance and luminance standard deviation of a region.
export function stats(img, region, step = 2) {
  const { x0, y0, x1, y1 } = clampRegion(img, region);
  let n = 0, r = 0, g = 0, b = 0, l = 0, l2 = 0;
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const i = (y * img.width + x) * 4;
      const pr = img.data[i], pg = img.data[i + 1], pb = img.data[i + 2];
      const pl = luma(pr, pg, pb);
      r += pr; g += pg; b += pb; l += pl; l2 += pl * pl;
      n++;
    }
  }
  if (!n) return { mean: [0, 0, 0], lum: 0, lumStd: 0 };
  const lum = l / n;
  return {
    mean: [r / n, g / n, b / n],
    lum,
    lumStd: Math.sqrt(Math.max(0, l2 / n - lum * lum)),
  };
}

// Fraction of pixels in a region that differ from `color` by more than `tolerance`.
export function coverage(img, region, color, { tolerance = 20, step = 2 } = {}) {
  const { x0, y0, x1, y1 } = clampRegion(img, region);
  let hit = 0, total = 0;
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const i = (y * img.width + x) * 4;
      const d = Math.max(
        Math.abs(img.data[i] - color[0]),
        Math.abs(img.data[i + 1] - color[1]),
        Math.abs(img.data[i + 2] - color[2]),
      );
      if (d > tolerance) hit++;
      total++;
    }
  }
  return total ? hit / total : 0;
}

export function pixel(img, x, y) {
  const i = (Math.round(y) * img.width + Math.round(x)) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
}
