import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(root, '../../editor/templates/freecell-origin');
const hash = data => createHash('sha256').update(data).digest('hex');
const appStore = JSON.parse(fs.readFileSync(path.join(root, 'source/app-store.json'), 'utf8'));
function storeIcon() {
  const icon = fs.readFileSync(path.join(root, 'source', appStore.icon.file));
  if (hash(icon) !== appStore.icon.sha256) throw new Error('App Store icon hash mismatch');
  return icon;
}
export function compileSource(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(s => s.trim());
  if (scripts.length !== 7) throw new Error('FreeCell source script layout changed');
  const config = JSON.parse(scripts[1].trim().replace(/^var CONFIG = /, '').replace(/;$/, ''));
  if (!config.appStoreUrl.includes('/id301987699')) throw new Error('Unexpected advertised app');
  const level = config.application.buildVariants[1];
  config.application.tapsToRedirect = 0;
  config.application.secToRedirect = null;
  config.application.randomField = false;
  const names = ['vendor', 'config', 'runtime', 'core', 'assets', 'preloader'];
  const files = Object.fromEntries(names.map((name, i) => [`game/${name}.js`, i === 1 ? `var CONFIG=${JSON.stringify(config).replaceAll('<', '\\u003c')};\n` : scripts[i]]));
  files['game/level.json'] = JSON.stringify(level, null, 2) + '\n';
  files['game/cta-icon.webp'] = storeIcon();
  files['game/layout.js'] = fs.readFileSync(path.join(root, 'src/layout.js'), 'utf8');
  files['game/boot.js'] = fs.readFileSync(path.join(root, 'src/boot.js'), 'utf8');
  files['game/index.html'] = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
  return { files, scripts: [...names.map(name => `game/${name}.js`), 'game/layout.js'] };
}
export function build() {
  const raw = fs.readFileSync(path.join(root, 'source/original.html'));
  const provenance = JSON.parse(fs.readFileSync(path.join(root, 'source/provenance.json')));
  if (hash(raw) !== provenance.originalSha256) throw new Error('Frozen FreeCell source hash mismatch');
  const result = compileSource(raw.toString('utf8'));
  fs.rmSync(path.join(out, 'game'), { recursive: true, force: true });
  fs.mkdirSync(path.join(out, 'game'), { recursive: true });
  for (const [file, content] of Object.entries(result.files)) fs.writeFileSync(path.join(out, file), content);
  const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
  fs.writeFileSync(path.join(out, 'game-manifest.json'), JSON.stringify({
    id: 'freecell-origin', name: appStore.name, version, entry: 'game/index.html',
    levels: [{ id: 'original', name: 'Original 52-card deal', path: 'game/level.json' }],
    constants: { game: { scripts: result.scripts, boot: 'game/boot.js', hudInsideCanvas: true, ctaCard: { name: appStore.name, icon: 'game/cta-icon.webp' } }, totalCards: 52,
      sourceSha256: hash(raw), sourceUrl: provenance.sourceUrl, appStoreUrl: provenance.appStoreUrl,
      fileHashes: Object.fromEntries(Object.entries(result.files).map(([file, value]) => [file, hash(value)])) },
  }, null, 2) + '\n');
  console.log('freecell-origin: built original 52-card playable');
}
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) build();
