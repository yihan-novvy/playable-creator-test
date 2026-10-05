import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { readBundle, locateZipPayload } from '../core/lib/res-bundle.mjs';

// The strongest possible port check: run the parameterized repack against the
// EXAMPLE's own directories (same inputs the known-good build consumed) and
// compare its output to the shipped editable/index.html. zip mtimes/entry
// order differ per run, so the window.__zip span is compared by unzipped
// per-file bytes; everything else must be byte-identical, and the __res
// resource objects must deep-equal.

const execFile = promisify(execFileCallback);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const EXAMPLE = path.join(ROOT, 'editor', 'test', 'fixtures', 'dragon-baby-color-ever');
const KNOWN_GOOD = path.join(EXAMPLE, 'editable', 'index.html');

async function runPortedRepack(workDir) {
  // The example splits index.html (root) from the manifests (editable/);
  // the ported CLI expects all three in --game. Stage symlinks.
  const gameDir = path.join(workDir, 'game');
  fs.mkdirSync(gameDir);
  fs.symlinkSync(path.join(EXAMPLE, 'index.html'), path.join(gameDir, 'index.html'));
  fs.symlinkSync(path.join(EXAMPLE, 'editable', 'asset-manifest.json'), path.join(gameDir, 'asset-manifest.json'));
  fs.symlinkSync(path.join(EXAMPLE, 'editable', 'zip-manifest.json'), path.join(gameDir, 'zip-manifest.json'));
  const outPath = path.join(workDir, 'index.html');
  await execFile('node', [
    path.join(ROOT, 'editor', 'core', 'scripts', 'repack.mjs'),
    '--game', gameDir,
    '--assets-root', path.join(EXAMPLE, 'editable', 'assets'),
    '--overlays-root', path.join(EXAMPLE, 'editable'),
    '--hud-image-left', path.join(EXAMPLE, 'editable', 'hud', 'dragon-left.png'),
    '--hud-image-right', path.join(EXAMPLE, 'editable', 'hud', 'dragon-right.png'),
    '--cta-icon', path.join(EXAMPLE, 'editable', 'cta', 'icon.png'),
    '--intro-video', path.join(EXAMPLE, 'ad-assets', 'final', 'intro-video.mp4'),
    '--intro-poster', path.join(EXAMPLE, 'editable', 'intro', 'poster.jpg'),
    '--out', outPath,
  ]);
  return outPath;
}

function sourceWithoutZip(html) {
  const range = locateZipPayload(html);
  return `${html.slice(0, range.start)}${html.slice(range.end)}`;
}

// Intro builds now intentionally omit the template's __bootcover splash: the
// video overlay's poster covers parse-time paint, and an intact cover would
// paint OVER the playing video (both fixed at the same z-index, cover later
// in the DOM) until the scene-node poll drops it. The shipped known-good
// predates that and still carries the splash, so the byte comparison below
// normalizes it away on BOTH sides; the divergence itself is asserted
// explicitly instead of being left to chance. These patterns must mirror the
// removals in repack.mjs's intro branch.
const BOOT_COVER_BLOCKS = [
  /<script>\(function\(\)\{var t0=Date\.now\(\),same=0,last=-1;[\s\S]*?requestAnimationFrame\(tick\)\}\)\(\);<\/script>/,
  /<style>#__bootcover\{[\s\S]*?<\/style><div id="__bootcover"><div id="__bcspin"><\/div><div id="__bcn">Colorever<\/div><\/div>/,
];

function withoutBootCover(html) {
  let out = html;
  for (const block of BOOT_COVER_BLOCKS) {
    const hits = out.split(block).length - 1;
    if (hits > 1) throw new Error(`expected at most 1 boot-cover block, found ${hits}`);
    out = out.replace(block, '');
  }
  return out;
}

async function unzipTo(zipBase64, workDir, label) {
  const zipPath = path.join(workDir, `${label}.zip`);
  const destDir = path.join(workDir, label);
  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(zipPath, Buffer.from(zipBase64, 'base64'));
  await execFile('unzip', ['-oq', zipPath, '-d', destDir]);
  return destDir;
}

export default async function run(assert) {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repack-port-'));
  try {
    const portedPath = await runPortedRepack(workDir);
    const ported = fs.readFileSync(portedPath, 'utf8');
    const knownGood = fs.readFileSync(KNOWN_GOOD, 'utf8');

    assert.check(
      Math.abs(ported.length - knownGood.length) / knownGood.length < 0.02,
      `output size within 2% of known-good (ported ${ported.length} vs known ${knownGood.length})`,
    );

    const portedRes = readBundle(portedPath).resources;
    const knownRes = JSON.parse(JSON.stringify(readBundle(KNOWN_GOOD).resources));
    assert.equal(Object.keys(portedRes).length, Object.keys(knownRes).length, '__res entry count matches known-good');
    assert.equal(portedRes, knownRes, '__res resources deep-equal known-good');

    assert.equal(
      sourceWithoutZip(withoutBootCover(ported)),
      sourceWithoutZip(withoutBootCover(knownGood)),
      'entire document outside the __zip span is byte-identical to known-good (boot splash normalized away)',
    );

    // The normalization above must stay honest: the known-good ships the
    // splash, the ported intro build must not have it (neither the poll
    // script nor the style+markup block).
    assert.check(knownGood.includes('__bootcover'), 'known-good still ships the boot splash');
    assert.check(!ported.includes('__bootcover'), 'ported intro build omits the boot splash entirely');

    const portedZip = locateZipPayload(ported).payload;
    const knownZip = locateZipPayload(knownGood).payload;
    assert.check(portedZip.length > 1000000, 'ported __zip payload is a plausible archive');

    const portedTree = await unzipTo(portedZip, workDir, 'ported');
    const knownTree = await unzipTo(knownZip, workDir, 'known');
    const listFiles = (dir) => {
      const out = [];
      const walk = (current) => {
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
          const full = path.join(current, entry.name);
          if (entry.isDirectory()) walk(full);
          else out.push(path.relative(dir, full));
        }
      };
      walk(dir);
      return out.sort();
    };
    const portedFiles = listFiles(portedTree);
    assert.equal(portedFiles, listFiles(knownTree), 'zip file name sets identical');
    let byteDiffs = 0;
    for (const rel of portedFiles) {
      const a = fs.readFileSync(path.join(portedTree, rel));
      const b = fs.readFileSync(path.join(knownTree, rel));
      if (!a.equals(b)) {
        byteDiffs += 1;
        console.error(`  zip content differs: ${rel}`);
      }
    }
    assert.check(byteDiffs === 0, `zip per-file bytes identical (${portedFiles.length} files, ${byteDiffs} diffs)`);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}
