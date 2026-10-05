import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetRoot = path.join(root, 'editable', 'assets');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'editable', 'asset-manifest.json'), 'utf8'));
const rows = [];

for (const [resourcePath, metadata] of Object.entries(manifest)) {
  if (!metadata.mime?.startsWith('image/')) continue;
  const absolutePath = path.join(assetRoot, resourcePath);
  let dimensions = 'unknown';
  try {
    const output = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', absolutePath], { encoding: 'utf8' });
    const width = /pixelWidth: (\d+)/.exec(output)?.[1];
    const height = /pixelHeight: (\d+)/.exec(output)?.[1];
    if (width && height) dimensions = `${width}×${height}`;
  } catch {}

  const stem = path.basename(resourcePath, path.extname(resourcePath));
  const importPrefix = resourcePath.replace('/native/', '/import/').replace(/\/[^/]+$/, `/${stem}`);
  const descriptor = Object.keys(manifest).find((candidate) => candidate.startsWith(importPrefix) && candidate.endsWith('@f9941.json'));
  let logicalName = '';
  if (descriptor) {
    const content = fs.readFileSync(path.join(assetRoot, descriptor), 'utf8');
    logicalName = /"name"\s*:\s*"([^"]+)"/.exec(content)?.[1] ?? '';
  }
  rows.push({ logicalName, dimensions, resourcePath });
}

rows.sort((a, b) => a.logicalName.localeCompare(b.logicalName, 'zh-CN') || a.resourcePath.localeCompare(b.resourcePath));
const lines = [
  '# Image asset guide',
  '',
  'Replace a file at the path below, keep its filename, then run `node tools/repack-assets.mjs`.',
  '',
  '| Logical name | Size | Editable file |',
  '|---|---:|---|',
  ...rows.map(({ logicalName, dimensions, resourcePath }) => `| ${logicalName || '—'} | ${dimensions} | \`${path.posix.join('assets', resourcePath)}\` |`),
  '',
];
fs.writeFileSync(path.join(root, 'editable', 'ASSET_GUIDE.md'), lines.join('\n'));
console.log(`Cataloged ${rows.length} images`);
