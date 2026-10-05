import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'editable', 'source-images', 'new-game-background.png');
const targetPath = path.join(
  root,
  'editable',
  'assets',
  'assets',
  'resources',
  'native',
  '84',
  '84bd2963-92cb-4267-a10d-869a4f71db21.png',
);

// The game_pic_bg spriteFrame rect is fixed at 1560x2598 in the Cocos import
// data, so the replacement PNG must match those dimensions exactly or the
// spriteFrame geometry breaks.
const WIDTH = 1560;
const HEIGHT = 2598;

// Gaussian sigma applied after upscaling. 12 keeps the scene readable while
// letting foreground tiles pop; override via the first CLI argument.
const radiusArg = Number(process.argv[2]);
const blurRadius = Number.isFinite(radiusArg) && radiusArg > 0 ? radiusArg : 12;

if (!fs.existsSync(sourcePath)) throw new Error(`Missing source image: ${sourcePath}`);

const python = `
import sys
from PIL import Image, ImageFilter

source, target = sys.argv[1], sys.argv[2]
width, height, radius = int(sys.argv[3]), int(sys.argv[4]), float(sys.argv[5])
image = Image.open(source).convert("RGB")
resized = image.resize((width, height), Image.LANCZOS)
blurred = resized.filter(ImageFilter.GaussianBlur(radius))
blurred.save(target, "PNG")
print(f"resized {image.size} -> {width}x{height}, gaussian sigma {radius}")
`;

execFileSync('python3', ['-c', python, sourcePath, targetPath, String(WIDTH), String(HEIGHT), String(blurRadius)], {
  stdio: 'inherit',
});

// Verify the written PNG header so a silent PIL failure cannot reach repack.
const png = fs.readFileSync(targetPath);
if (png.readUInt32BE(0) !== 0x89504e47) throw new Error('Output is not a PNG');
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
if (width !== WIDTH || height !== HEIGHT) {
  throw new Error(`Output is ${width}x${height}, expected ${WIDTH}x${HEIGHT}`);
}
console.log(`Wrote ${targetPath} (${width}x${height}, ${png.length} bytes)`);
console.log('Next: node tools/repack-assets.mjs to rebuild editable/index.html');
