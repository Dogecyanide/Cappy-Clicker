import sharp from 'sharp';

const source = 'scripts/source-assets/shine-pair.png';
const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const pixelCount = info.width * info.height;
const background = new Uint8Array(pixelCount);
const queue = new Int32Array(pixelCount);
let head = 0;
let tail = 0;

function isBackgroundCandidate(index) {
  const offset = index * 3;
  const r = data[offset];
  const g = data[offset + 1];
  const b = data[offset + 2];
  return Math.min(r, g, b) >= 195 && Math.max(r, g, b) - Math.min(r, g, b) <= 28;
}

function enqueue(index) {
  if (background[index] || !isBackgroundCandidate(index)) return;
  background[index] = 1;
  queue[tail++] = index;
}

for (let x = 0; x < info.width; x += 1) {
  enqueue(x);
  enqueue((info.height - 1) * info.width + x);
}
for (let y = 0; y < info.height; y += 1) {
  enqueue(y * info.width);
  enqueue(y * info.width + info.width - 1);
}

while (head < tail) {
  const index = queue[head++];
  const x = index % info.width;
  const y = Math.floor(index / info.width);
  if (x > 0) enqueue(index - 1);
  if (x + 1 < info.width) enqueue(index + 1);
  if (y > 0) enqueue(index - info.width);
  if (y + 1 < info.height) enqueue(index + info.width);
}

const rgba = Buffer.alloc(pixelCount * 4);
for (let index = 0; index < pixelCount; index += 1) {
  const input = index * 3;
  const output = index * 4;
  rgba[output] = data[input];
  rgba[output + 1] = data[input + 1];
  rgba[output + 2] = data[input + 2];
  rgba[output + 3] = background[index] ? 0 : 255;
}

const transparentSheet = await sharp(rgba, {
  raw: { width: info.width, height: info.height, channels: 4 },
}).png().toBuffer();
const split = Math.floor(info.width / 2);
const outputs = [
  { left: 0, width: split, path: 'public/assets/shines/shine-sprite.webp' },
  { left: split, width: info.width - split, path: 'public/assets/shines/gloom-shine.webp' },
];

for (const output of outputs) {
  const half = await sharp(transparentSheet)
    .extract({ left: output.left, top: 0, width: output.width, height: info.height })
    .png()
    .toBuffer();
  await sharp(half)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: 512, height: 512, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 92, alphaQuality: 100, effort: 5 })
    .toFile(output.path);
  const metadata = await sharp(output.path).metadata();
  console.log(`${output.path}: ${metadata.width}x${metadata.height}, alpha=${metadata.hasAlpha}`);
}
