import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const width = 1200;
const height = 630;
const overlay = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#25132e" stop-opacity=".96"/><stop offset=".58" stop-color="#3e1938" stop-opacity=".75"/><stop offset="1" stop-color="#3e1938" stop-opacity=".08"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#shade)"/>
  <rect x="55" y="54" width="685" height="516" rx="36" fill="#fff5d9" stroke="#f5c73d" stroke-width="9"/>
  <text x="100" y="151" fill="#a3162d" font-family="Arial Rounded MT Bold, Trebuchet MS, sans-serif" font-size="30" font-weight="900" letter-spacing="5">GRAND TOUR · V2</text>
  <text x="98" y="269" fill="#241a2c" font-family="Arial Rounded MT Bold, Trebuchet MS, sans-serif" font-size="91" font-weight="900">Cappy</text>
  <text x="98" y="358" fill="#d32638" font-family="Arial Rounded MT Bold, Trebuchet MS, sans-serif" font-size="91" font-weight="900">Clicker</text>
  <text x="102" y="427" fill="#594451" font-family="Trebuchet MS, sans-serif" font-size="31" font-weight="700">Toss Cappy. Tour kingdoms.</text>
  <text x="102" y="468" fill="#594451" font-family="Trebuchet MS, sans-serif" font-size="31" font-weight="700">Make an irresponsible number of coins.</text>
  <g transform="translate(103 515) rotate(-2)"><rect width="415" height="45" rx="8" fill="#3b2944"/><text x="22" y="31" fill="#f8d75d" font-family="Trebuchet MS, sans-serif" font-size="19" font-weight="900">A PERSONAL FAN-MADE CLICKER</text></g>
</svg>`);

await mkdir('public/assets/ui', { recursive: true });
const cappy = await sharp('public/assets/cappy/cappy-hero.svg', { density: 320 })
  .resize({ width: 410, height: 330, fit: 'inside' })
  .png()
  .toBuffer();
await sharp('public/assets/kingdoms/cascade.webp')
  .resize(width, height, { fit: 'cover' })
  .composite([
    { input: overlay, left: 0, top: 0 },
    { input: cappy, left: 760, top: 150 },
  ])
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toFile('public/assets/ui/og-cappy-clicker.png');

console.log('Created public/assets/ui/og-cappy-clicker.png');
