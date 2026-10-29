import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import { createHash } from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(root, '../../editor/templates/tasty-travels-origin');
const hash = data => createHash('sha256').update(data).digest('hex');
// This frozen ZIP uses local headers with explicit sizes and only STORE/DEFLATE.
// Read into an in-memory resource map, never extract archive paths to the filesystem.
export function readArchive(bytes) {
  const files = {}; let cursor = 0;
  while (bytes.readUInt32LE(cursor) === 0x04034b50) {
    const flags = bytes.readUInt16LE(cursor + 6), method = bytes.readUInt16LE(cursor + 8);
    const length = bytes.readUInt32LE(cursor + 18), size = bytes.readUInt32LE(cursor + 22);
    const nameLength = bytes.readUInt16LE(cursor + 26), extraLength = bytes.readUInt16LE(cursor + 28);
    const name = bytes.subarray(cursor + 30, cursor + 30 + nameLength).toString('utf8');
    const start = cursor + 30 + nameLength + extraLength, end = start + length;
    if ((flags & 9) || ![0, 8].includes(method) || size > 16000000 || end > bytes.length || name.includes('..') || name.startsWith('/')) throw new Error('Unsupported source ZIP entry');
    if (!name.endsWith('/')) {
      const value = method === 8 ? inflateRawSync(bytes.subarray(start, end), { maxOutputLength: size }) : bytes.subarray(start, end);
      if (value.length !== size || Object.hasOwn(files, name)) throw new Error('Invalid source ZIP entry');
      files[name] = value.toString('utf8');
    }
    cursor = end;
  }
  if (bytes.readUInt32LE(cursor) !== 0x02014b50) throw new Error('Source ZIP central directory missing');
  return files;
}
export function compileSource(html) {
  const found = [...html.matchAll(/window\.__zip\s*=\s*"([A-Za-z0-9+/=]+)"/g)];
  if (found.length !== 1) throw new Error('Expected one embedded Tasty Travels ZIP');
  const archive = readArchive(Buffer.from(found[0][1], 'base64'));
  const assets = { ...archive, ...JSON.parse(archive.__res) };
  delete assets.__res;
  for (const key of Object.keys(assets)) if (key.startsWith('@')) delete assets[key];
  if (!assets['assets/main/index.js'].includes('/id6471045672')) throw new Error('Unexpected advertised app');
  assets['assets/main/index.js'] += '\nif(window.__TASTY_LAYOUT__)window.__TASTY_LAYOUT__.install(window.__require);\nif(window.__ORIGIN_ADAPTER__)window.__ORIGIN_ADAPTER__.install(window.__require);\n';
  const encodedLogo = assets['assets/main/native/06/06a5cf19-0881-4cf2-97c1-3beebb4c217e.png'];
  // The frozen loader removes the sentinel at index 27 from encoded images.
  const logo = encodedLogo.slice(0, 27) + encodedLogo.slice(28);
  const files = {
    'game/assets.js': `window.__res=${JSON.stringify(assets).replaceAll('<', '\\u003c')};\n`,
    'game/settings.js': archive['@src/settings.js'],
    'game/main.js': archive['@main.js'],
    'game/loader.js': archive['@src/cc.adapter.js'],
    'game/layout.js': fs.readFileSync(path.join(root, 'src/layout.js'), 'utf8'),
    'game/cta-icon.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 667 667"><rect width="667" height="667" rx="100" fill="#b8cc7b"/><image href="${logo}" y="146" width="667" height="375"/></svg>`,
    'game/boot.js': fs.readFileSync(path.join(root, 'src/boot.js'), 'utf8'),
    'game/index.html': fs.readFileSync(path.join(root, 'src/index.html'), 'utf8'),
  };
  return { files, assets, archive };
}
export function build() {
  const raw = fs.readFileSync(path.join(root, 'source/original.html'));
  const provenance = JSON.parse(fs.readFileSync(path.join(root, 'source/provenance.json')));
  if (hash(raw) !== provenance.originalSha256) throw new Error('Frozen Tasty Travels source hash mismatch');
  const { files } = compileSource(raw.toString());
  fs.rmSync(path.join(out, 'game'), { recursive: true, force: true });
  fs.mkdirSync(path.join(out, 'game'), { recursive: true });
  for (const [file, content] of Object.entries(files)) fs.writeFileSync(path.join(out, file), content);
  fs.writeFileSync(path.join(out, 'game-manifest.json'), JSON.stringify({ id: 'tasty-travels-origin', name: 'Tasty Travels Origin', version: '1.0.0', entry: 'game/index.html',
    constants: { game: { scripts: ['game/assets.js','game/settings.js','game/main.js','game/layout.js','game/loader.js'], boot: 'game/boot.js', hudInsideCanvas: true, ctaCard: { name: 'Tasty Travels', icon: 'game/cta-icon.svg' } }, targetTier: 9,
      sourceSha256: hash(raw), sourceUrl: provenance.sourceUrl, appStoreUrl: provenance.appStoreUrl,
      fileHashes: Object.fromEntries(Object.entries(files).map(([file, value]) => [file, hash(value)])) } }, null, 2) + '\n');
  console.log('tasty-travels-origin: built original physics merge game and local resources');
}
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) build();
