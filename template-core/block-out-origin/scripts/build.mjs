import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliDecompressSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(root, '../../editor/templates/block-out-origin');
const hash = value => createHash('sha256').update(value).digest('hex');
export function replaceOnce(text, anchor, replacement) {
  if (text.split(anchor).length !== 2) throw new Error(`Block Out source anchor changed: ${anchor.slice(0, 90)}`);
  return text.replace(anchor, () => replacement);
}

export function compileSource(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  if (scripts.length !== 3 || !scripts[0][0].includes('mraid.js')) throw new Error('Unexpected Block Out source scripts');
  const sourceParams = scripts[1][1];
  const start = sourceParams.indexOf('window.editorParameters =') + 'window.editorParameters ='.length;
  const end = sourceParams.indexOf(';"use strict";', start);
  if (start < 26 || end < start) throw new Error('Missing source parameters boundary');
  const params = JSON.parse(sourceParams.slice(start, end));
  const counts = params.levelAssets.map(level => level.BMS.length);
  if (JSON.stringify(counts) !== '[2,37]') throw new Error('Expected original tutorial + 37-block level');
  const compressed = [...scripts[2][1].matchAll(/"([A-Za-z0-9+/=]{20000,})"/g)];
  if (compressed.length !== 1) throw new Error('Expected one Brotli core');
  let core = brotliDecompressSync(Buffer.from(compressed[0][1], 'base64')).toString('utf8');
  // Expose only the versioned adapter seam. Original source stays frozen; any
  // upstream change fails these unique-anchor checks rather than guessing.
  const boot = '(async()=>await Or.instance.init())()';
  core = replaceOnce(core, boot, 'window.__BLOCK_OUT_ADAPTER__&&window.__BLOCK_OUT_ADAPTER__.install({Manager:z,Drag:G2,App:vt,Boot:Or,Sound:st});' + boot);
  const store = 'function Fo(r,e={}){return!p.hasMarketParams||e.automatic&&Nk()!==Tl.CANT_PLAY&&Tt.hasOpenedStore?!1:(MA.emit(Qf),Tt.hasOpenedStore=!0,Tt.adBridge?Tt.adBridge.openStore(r):window.open(r.ios,"_blank"),!0)}';
  core = replaceOnce(core, store, store.replace('{return', '{if(window.__BLOCK_OUT_ADAPTER__)return window.__BLOCK_OUT_ADAPTER__.openStore(e);return'));
  // The source bridge remains local but uses its browser lifecycle adapter.
  // Signed assets and store links remain intact for source integrity checks.
  params.adNetwork = 'web';
  for (const key of ['gotoMarketAfterXClick', 'goToMarketAfterXClickOnFinalLevel', 'gotoMarketAfterXSeconds', 'gotoMarketAfterXBlocksPass', 'gotoMarketAfterXProgress', 'goToMarketWhenXBlockersRemain', 'endcardGoToMarketAfterXSeconds']) params[key] = 0;
  params.hasEndcardFullScreenClick = false;
  params.canPlayAfterStore = 1;
  const assets = `window.editorParameters=${JSON.stringify(params).replaceAll('<', '\\u003c')}${sourceParams.slice(end)}\n`;
  let shell = html;
  for (const script of scripts) shell = shell.replace(script[0], '');
  shell = shell.replace('<title>Block Out - Applovin</title>', '<title>Block Out</title>');
  shell = replaceOnce(shell, '</body>', '<!--BLOCK_OUT_BOOT--><script src="assets.js"></script><script src="core.js"></script><!--BLOCK_OUT_BOOT_END-->\n</body>');
  return { shell, assets, core, counts };
}

export function build() {
  const source = fs.readFileSync(path.join(root, 'source/original.html'), 'utf8');
  const provenance = JSON.parse(fs.readFileSync(path.join(root, 'source/provenance.json'), 'utf8'));
  if (hash(source) !== provenance.hashes['unpacked-game.html']) throw new Error('Frozen Block Out source hash mismatch');
  const result = compileSource(source);
  const files = { 'game/index.html': result.shell, 'game/assets.js': result.assets, 'game/core.js': result.core };
  fs.rmSync(path.join(out, 'game'), { recursive: true, force: true });
  fs.mkdirSync(path.join(out, 'game'), { recursive: true });
  for (const [file, content] of Object.entries(files)) fs.writeFileSync(path.join(out, file), content);
  const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
  fs.writeFileSync(path.join(out, 'game-manifest.json'), JSON.stringify({
    id: 'block-out-origin', name: 'Block Out Origin（原版两关）', version, entry: 'game/index.html',
    constants: {
      sourceSha256: hash(source),
      game: { assetsJs: 'game/assets.js', coreJs: 'game/core.js' },
      fileHashes: Object.fromEntries(Object.entries(files).map(([file, content]) => [file, hash(content)])),
      blockCounts: result.counts,
      sourceUrl: 'https://data.insightrackr.com/creative/preplay/detail/7ffa03d526a4b106c4f1f82c8ab1afae',
      appStoreUrl: 'https://apps.apple.com/us/app/block-out-color-sort-puzzle/id6752672568',
    },
  }, null, 2) + '\n');
  console.log(`block-out-origin: built ${result.counts.join(' + ')} blocks, local assets and core`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) build();
