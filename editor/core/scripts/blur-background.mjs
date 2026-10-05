import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Parameterized port of the example's tools/blur-game-background.mjs: resize +
// Gaussian-blur a theme background into the exact game_pic_bg spriteFrame
// geometry. The Cocos import data fixes that rect, so the output dimensions
// must match --width/--height exactly or scene layout breaks.
//
// Output is lossy WebP: the heavy gaussian blur leaves no detail to preserve,
// so q80 weighs ~40KB against ~1.4MB for the equivalent PNG — and the
// game_pic_bg slot is a webp asset to begin with (see asset-manifest mime).
//
//   node blur-background.mjs --source <png> --out <webp> [--width 1560] [--height 2598] [--sigma 12] [--quality 80]

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

function flag(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 && process.argv[index + 1] !== undefined ? process.argv[index + 1] : fallback;
}

const sourcePath = path.resolve(flag('source', ''));
const targetPath = path.resolve(flag('out', ''));
const WIDTH = Number(flag('width', 1560));
const HEIGHT = Number(flag('height', 2598));

// Gaussian sigma applied after upscaling. 12 keeps the scene readable while
// letting foreground tiles pop; override via --sigma.
const blurRadius = Number(flag('sigma', 12));
const quality = Number(flag('quality', 80));

if (!sourcePath) throw new Error('Missing --source');
if (!targetPath) throw new Error('Missing --out');
if (!fs.existsSync(sourcePath)) throw new Error(`Missing source image: ${sourcePath}`);

const python = `
import sys, json
from PIL import Image, ImageFilter

source, target = sys.argv[1], sys.argv[2]
width, height, radius, quality = int(sys.argv[3]), int(sys.argv[4]), float(sys.argv[5]), int(sys.argv[6])
image = Image.open(source).convert("RGB")
resized = image.resize((width, height), Image.LANCZOS)
blurred = resized.filter(ImageFilter.GaussianBlur(radius))
blurred.save(target, "WEBP", quality=quality, method=6)
with open(target, "rb") as f:
    size = len(f.read())
print(json.dumps({"width": width, "height": height, "bytes": size}))
`;

const stdout = execFileSync('python3', ['-c', python, sourcePath, targetPath, String(WIDTH), String(HEIGHT), String(blurRadius), String(quality)], {
  encoding: 'utf8',
});

// Trust the reported geometry from the encoder pass (webp has no trivially
// parsed header like PNG's IHDR).
const lastLine = stdout.trim().split('\n').pop();
const dims = JSON.parse(lastLine);
if (dims.width !== WIDTH || dims.height !== HEIGHT) {
  throw new Error(`Output is ${dims.width}x${dims.height}, expected ${WIDTH}x${HEIGHT}`);
}
console.log(`Wrote ${targetPath} (${dims.width}x${dims.height}, q${quality}, ${dims.bytes} bytes)`);
