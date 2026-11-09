import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { listEntries, getLib } from '../../editor/core/registry.mjs';
import { standaloneGame } from '../../editor/core/lib/standalone-artifact.mjs';
import { unpackGame } from '../../template-core/shared/standalone/build.mjs';

// Run from the extracted release, before changing the active service. Importing
// every plugin catches dependencies that development node_modules can conceal.
const entries = listEntries();
let previews = 0;
for (const entry of entries) {
  const lib = await getLib(entry);
  if (!fs.existsSync(path.join(entry.templateDir, 'standalone/manifest.json'))) continue;
  const html = await lib.previewHtml({ plugin: entry, task: { config: {} }, taskId: 'runtime-dependency-probe' });
  assert.ok(html.includes('NovvyGame'), entry.id + ': standalone preview missing');
  previews++;
}
// Force the configured path, which invokes esbuild and resolves the decoder
// from three; merely importing the server or checking /api/env would miss this.
const grill = entries.find(entry => entry.id === 'grill-sort-origin');
const configured = standaloneGame(grill.templateDir, { gameplay: { countdownSeconds: 17 } });
assert.ok(unpackGame(configured).source.includes('"countdownSeconds":17'));
assert.equal(previews, 14);
console.log(JSON.stringify({ ok: true, pluginImports: entries.length, standalonePreviews: previews, configuredExport: true }));
