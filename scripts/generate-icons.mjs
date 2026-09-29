// Uygulama ikonlarını üretir: node scripts/generate-icons.mjs
// Simge Material Design Icons'tan (Apache 2.0) alınır; uygulama içi ikon diliyle aynıdır.
import { mdiCarClock } from '@mdi/js';
import sharp from 'sharp';

const SIZE = 1024;
const BRAND = '#2563EB';
const BRAND_2 = '#7C3AED';

const backgroundSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BRAND}"/>
      <stop offset="100%" stop-color="${BRAND_2}"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
</svg>`);

/**
 * MDI yolunu saydam zeminde basar ve kenar boşluklarını kırpar. Yolun kendi
 * kutusu 24x24'te ortalı olmadığından, kırpmadan basılan ikon kayık duruyor.
 */
async function glyph(path, box) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048" viewBox="0 0 24 24"><path d="${path}" fill="#FFFFFF"/></svg>`;
  const trimmed = await sharp(Buffer.from(svg)).trim().png().toBuffer();
  const buffer = await sharp(trimmed).resize({ width: box, height: box, fit: 'inside' }).png().toBuffer();
  const { width = box, height = box } = await sharp(buffer).metadata();
  return { buffer, left: Math.round((SIZE - width) / 2), top: Math.round((SIZE - height) / 2) };
}

async function write(file, pipeline) {
  await pipeline.toFile(file);
  const meta = await sharp(file).metadata();
  console.log(`${file} ${meta.width}x${meta.height} alpha=${meta.hasAlpha}`);
}

const transparentCanvas = () =>
  sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });

const main = await glyph(mdiCarClock, 560);
// App Store ikonu saydamlık kabul etmez.
const iconBuffer = await sharp(backgroundSvg)
  .composite([{ input: main.buffer, left: main.left, top: main.top }])
  .flatten({ background: BRAND })
  .removeAlpha()
  .png()
  .toBuffer();
await write('assets/icon.png', sharp(iconBuffer).png());
await write('assets/favicon.png', sharp(iconBuffer).resize(48, 48).png());

// Android ön planı güvenli alanda kalmalı (merkezin ~%66'sı).
const adaptive = await glyph(mdiCarClock, 500);
await write('assets/adaptive-icon.png', transparentCanvas().composite([{ input: adaptive.buffer, left: adaptive.left, top: adaptive.top }]).png());

const splash = await glyph(mdiCarClock, 620);
await write('assets/splash-icon.png', transparentCanvas().composite([{ input: splash.buffer, left: splash.left, top: splash.top }]).png());
