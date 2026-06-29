/**
 * Builds a tight, transparent wordmark from iTOOLS.svg for UI use.
 * Run: node scripts/build-wordmark.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "../public");
const sourceSvg = path.join(publicDir, "iTOOLS.svg");
const wordmarkPng = path.join(publicDir, "iTOOLS-wordmark.png");
const wordmarkSvg = path.join(publicDir, "iTOOLS-wordmark.svg");

const RENDER_SIZE = 1500;

const rendered = await sharp(sourceSvg, { density: 200 })
  .resize(RENDER_SIZE, RENDER_SIZE)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { data, info } = rendered;
const { width, height, channels } = info;

let minX = width;
let minY = height;
let maxX = 0;
let maxY = 0;
const threshold = 28;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > threshold || g > threshold || b > threshold) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
}

const pad = 8;
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(width - 1, maxX + pad);
maxY = Math.min(height - 1, maxY + pad);

const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;

const pixels = Buffer.alloc(cropW * cropH * 4);
for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const src = ((minY + y) * width + (minX + x)) * channels;
    const dst = (y * cropW + x) * 4;
    const r = data[src];
    const g = data[src + 1];
    const b = data[src + 2];
    pixels[dst] = r;
    pixels[dst + 1] = g;
    pixels[dst + 2] = b;
    pixels[dst + 3] = r + g + b < threshold * 3 ? 0 : 255;
  }
}

await sharp(pixels, { raw: { width: cropW, height: cropH, channels: 4 } })
  .png()
  .toFile(wordmarkPng);

const viewBox = `${minX} ${minY} ${cropW} ${cropH}`;
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${cropW}" height="${cropH}">
  <image href="/iTOOLS.svg" width="${RENDER_SIZE}" height="${RENDER_SIZE}" />
</svg>
`;
fs.writeFileSync(wordmarkSvg, svg);

console.log("Wordmark PNG:", wordmarkPng, `${cropW}x${cropH}`);
console.log("Wordmark SVG viewBox:", viewBox);
