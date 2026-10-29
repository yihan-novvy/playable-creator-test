import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliDecompressSync } from 'node:zlib';
import { createHash } from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(root, '../../editor/templates/grill-sort-origin');
const hash = data => createHash('sha256').update(data).digest('hex');
const appStore = JSON.parse(fs.readFileSync(path.join(root, 'source/app-store.json'), 'utf8'));
function storeIcon() {
  const icon = fs.readFileSync(path.join(root, 'source', appStore.icon.file));
  if (hash(icon) !== appStore.icon.sha256) throw new Error('App Store icon hash mismatch');
  return icon;
}
export function compileSource(html) {
  const compressed = [...html.matchAll(/["']([A-Za-z0-9+/=]{20000,})["']/g)];
  const decoded = compressed.map(m => JSON.parse(brotliDecompressSync(Buffer.from(m[1], 'base64')).toString()));
  const assets = decoded.find(d => d['assets/main/index.js']);
  const platform = decoded.find(d => d.playable_newloader);
  if (decoded.length !== 2 || !assets || !platform || !assets['assets/main/index.js'].includes('/id6742812903')) throw new Error('Unexpected Grill Sort source');
  const settings = JSON.parse(assets['src/settings.json']);
  settings.screen.exactFitScreen = false;
  assets['src/settings.json'] = JSON.stringify(settings);
  const files = {
    'game/assets.js': `window.playableres=${JSON.stringify(assets).replaceAll('<', '\\u003c')};\n`,
    'game/loader.js': `window.__ORIGIN_LOAD__=function(){${platform.playable_newloader}\n};`,
    'game/cta-icon.webp': storeIcon(),
    'game/layout.js': fs.readFileSync(path.join(root, 'src/layout.js'), 'utf8'),
    'game/boot.js': fs.readFileSync(path.join(root, 'src/boot.js'), 'utf8'),
    'game/index.html': fs.readFileSync(path.join(root, 'src/index.html'), 'utf8'),
  };
  return { files, assets };
}
export function build() {
  const raw = fs.readFileSync(path.join(root, 'source/original.html'));
  const provenance = JSON.parse(fs.readFileSync(path.join(root, 'source/provenance.json')));
  if (hash(raw) !== provenance.originalSha256) throw new Error('Frozen Grill Sort source hash mismatch');
  const { files } = compileSource(raw.toString());
  fs.rmSync(path.join(out, 'game'), { recursive: true, force: true });
  fs.mkdirSync(path.join(out, 'game'), { recursive: true });
  for (const [file, content] of Object.entries(files)) fs.writeFileSync(path.join(out, file), content);
  fs.writeFileSync(path.join(out, 'game-manifest.json'), JSON.stringify({
    id: 'grill-sort-origin', name: appStore.name, version: '1.0.0', entry: 'game/index.html',
    constants: { game: { scripts: ['game/assets.js', 'game/loader.js', 'game/layout.js'], boot: 'game/boot.js', hudInsideCanvas: true, ctaCard: { name: appStore.name, icon: 'game/cta-icon.webp' } }, totalItems: 120,
      sourceSha256: hash(raw), sourceUrl: provenance.sourceUrl, appStoreUrl: provenance.appStoreUrl,
      fileHashes: Object.fromEntries(Object.entries(files).map(([file, value]) => [file, hash(value)])) },
  }, null, 2) + '\n');
  console.log('grill-sort-origin: built original Cocos game with local resources');
}
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) build();
