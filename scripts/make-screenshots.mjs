// Mağaza ekran görüntülerini hazırlar:
//   node scripts/make-screenshots.mjs <kaynak-klasör> <hedef-klasör>
// Kaynak klasördeki telefon ekran görüntülerini (1.png, 2.png ...) sıraya göre
// markalı tuvale yerleştirir. Apple 6.9" için 1290x2796 ister.
import { readdirSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const WIDTH = 1290;
const HEIGHT = 2796;
const SHOT_WIDTH = 1010;
const BRAND = '#2563EB';
const BRAND_2 = '#7C3AED';

const CAPTIONS = [
  'Muayene, sigorta ve\nMTV tarihini kaçırma',
  'Aracının tüm masrafı\ntek yerde',
  'Yakıt tüketimini\nkendisi hesaplasın',
  'Km’ye bağlı bakım\ntakibi',
  'Güncel yakıt fiyatı,\notopark ve yolculuk',
];

function escapeXml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;');
}

function captionSvg(caption) {
  const lines = caption.split('\n');
  const tspans = lines
    .map((line, i) => `<tspan x="${WIDTH / 2}" dy="${i === 0 ? 0 : 96}">${escapeXml(line)}</tspan>`)
    .join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${BRAND}"/>
        <stop offset="100%" stop-color="${BRAND_2}"/>
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <text x="${WIDTH / 2}" y="250" text-anchor="middle" fill="#FFFFFF"
      font-family="Helvetica, Arial, sans-serif" font-size="82" font-weight="bold">${tspans}</text>
  </svg>`);
}

/** Köşeleri yuvarlatılmış telefon görüntüsü. */
async function roundedShot(file) {
  const resized = await sharp(file).resize({ width: SHOT_WIDTH }).png().toBuffer();
  const { width = SHOT_WIDTH, height = 0 } = await sharp(resized).metadata();
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="56" ry="56"/></svg>`,
  );
  const buffer = await sharp(resized).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  return { buffer, width, height };
}

const [srcDir, outDir] = process.argv.slice(2);
if (!srcDir || !outDir) {
  console.error('Kullanım: node scripts/make-screenshots.mjs <kaynak> <hedef>');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const files = readdirSync(srcDir)
  .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
  .sort((a, b) => a.localeCompare(b, 'tr', { numeric: true }));

let index = 0;
for (const file of files) {
  const shot = await roundedShot(path.join(srcDir, file));
  const top = Math.min(470, HEIGHT - shot.height - 60);
  const out = path.join(outDir, `${String(index + 1).padStart(2, '0')}.png`);
  await sharp(captionSvg(CAPTIONS[index] ?? ''))
    .composite([{ input: shot.buffer, left: Math.round((WIDTH - shot.width) / 2), top }])
    .png()
    .toFile(out);
  console.log(`${out} <- ${file}`);
  index++;
}
