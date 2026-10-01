// Google Play öne çıkan görsel (1024x500): node scripts/make-feature-graphic.mjs <çıktı>
import { mdiCarClock } from '@mdi/js';
import sharp from 'sharp';

const WIDTH = 1024;
const HEIGHT = 500;
const BRAND = '#2563EB';
const BRAND_2 = '#7C3AED';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BRAND}"/>
      <stop offset="100%" stop-color="${BRAND_2}"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <g transform="translate(96 132) scale(10.2)" opacity="0.95">
    <path d="${mdiCarClock}" fill="#FFFFFF"/>
  </g>
  <text x="392" y="228" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-size="68" font-weight="bold">Araç Takvimi</text>
  <text x="392" y="292" fill="rgba(255,255,255,0.92)" font-family="Helvetica, Arial, sans-serif" font-size="34">Muayene, sigorta, MTV ve bakım takibi</text>
  <text x="392" y="344" fill="rgba(255,255,255,0.92)" font-family="Helvetica, Arial, sans-serif" font-size="34">Yakıt ve masraf kaydı</text>
</svg>`;

const out = process.argv[2] ?? 'feature-graphic.png';
await sharp(Buffer.from(svg)).flatten({ background: BRAND }).removeAlpha().png().toFile(out);
console.log(out);
