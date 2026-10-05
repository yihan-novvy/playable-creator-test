import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { locateZipPayload, readBundle } from './res-bundle.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.join(root, 'index.html');
const outputRoot = path.join(root, 'editable', 'assets');
const manifestPath = path.join(root, 'editable', 'asset-manifest.json');
const zipManifestPath = path.join(root, 'editable', 'zip-manifest.json');
const { source, resources } = readBundle(input);
const manifest = {};

fs.mkdirSync(outputRoot, { recursive: true });

for (const [resourcePath, value] of Object.entries(resources)) {
  const normalized = path.posix.normalize(resourcePath);
  if (normalized.startsWith('../') || path.posix.isAbsolute(normalized)) {
    throw new Error(`Unsafe resource path: ${resourcePath}`);
  }

  const destination = path.join(outputRoot, normalized);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const match = /^data:([^;,]+)?(?:;charset=([^;,]+))?(;base64)?,([\s\S]*)$/.exec(value);
  if (match) {
    const [, mime = 'application/octet-stream', charset = null, base64Flag, payload] = match;
    const data = base64Flag ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload));
    fs.writeFileSync(destination, data);
    manifest[resourcePath] = { mode: 'data-uri', mime, charset, base64: Boolean(base64Flag) };
  } else {
    fs.writeFileSync(destination, value, 'utf8');
    manifest[resourcePath] = { mode: 'text' };
  }
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const zipPayload = locateZipPayload(source).payload;
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'playable-extract-'));
const archivePath = path.join(temporaryRoot, 'embedded.zip');
fs.writeFileSync(archivePath, Buffer.from(zipPayload, 'base64'));
const zipEntries = execFileSync('unzip', ['-Z1', archivePath], { encoding: 'utf8' })
  .split('\n').filter((entry) => entry && !entry.endsWith('/'));
for (const entry of zipEntries) {
  const normalized = path.posix.normalize(entry);
  if (normalized.startsWith('../') || path.posix.isAbsolute(normalized)) throw new Error(`Unsafe ZIP path: ${entry}`);
}
execFileSync('unzip', ['-oq', archivePath, '-d', outputRoot]);
fs.writeFileSync(zipManifestPath, `${JSON.stringify(zipEntries, null, 2)}\n`);
fs.rmSync(temporaryRoot, { recursive: true, force: true });
console.log(`Extracted ${Object.keys(resources).length} direct resources and ${zipEntries.length} ZIP resources to ${outputRoot}`);
