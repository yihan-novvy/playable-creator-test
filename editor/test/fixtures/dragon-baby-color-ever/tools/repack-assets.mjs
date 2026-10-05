import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { locateZipPayload, readBundle } from './res-bundle.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const templatePath = path.join(root, 'index.html');
const editableRoot = path.join(root, 'editable');
const assetRoot = path.join(editableRoot, 'assets');
const hudRoot = path.join(editableRoot, 'hud');
const ctaRoot = path.join(editableRoot, 'cta');
const introRoot = path.join(editableRoot, 'intro');
const introVideoPath = path.join(root, 'ad-assets', 'final', 'intro-video.mp4');
const manifest = JSON.parse(fs.readFileSync(path.join(editableRoot, 'asset-manifest.json'), 'utf8'));
const zipEntries = JSON.parse(fs.readFileSync(path.join(editableRoot, 'zip-manifest.json'), 'utf8'));
const { source, range } = readBundle(templatePath);
const resources = {};

for (const [resourcePath, metadata] of Object.entries(manifest)) {
  const filePath = path.join(assetRoot, resourcePath);
  if (!fs.existsSync(filePath)) throw new Error(`Missing extracted resource: ${resourcePath}`);
  if (metadata.mode === 'text') {
    resources[resourcePath] = fs.readFileSync(filePath, 'utf8');
  } else {
    const data = fs.readFileSync(filePath);
    const charset = metadata.charset ? `;charset=${metadata.charset}` : '';
    if (metadata.base64) {
      resources[resourcePath] = `data:${metadata.mime}${charset};base64,${data.toString('base64')}`;
    } else {
      resources[resourcePath] = `data:${metadata.mime}${charset},${encodeURIComponent(data.toString())}`;
    }
  }
}

let output = `${source.slice(0, range.start)}${JSON.stringify(resources)}${source.slice(range.end)}`;
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'playable-repack-'));
const stagingRoot = path.join(temporaryRoot, 'staging');
fs.mkdirSync(stagingRoot);
for (const entry of zipEntries) {
  const sourcePath = path.join(assetRoot, entry);
  if (!fs.existsSync(sourcePath)) throw new Error(`Missing extracted ZIP resource: ${entry}`);
  const destinationPath = path.join(stagingRoot, entry);
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
}
const archivePath = path.join(temporaryRoot, 'embedded.zip');
execFileSync('zip', ['-q', '-X', '-r', archivePath, '.'], { cwd: stagingRoot });
const zipBase64 = fs.readFileSync(archivePath).toString('base64');
const zipRange = locateZipPayload(output);
output = `${output.slice(0, zipRange.start)}${zipBase64}${output.slice(zipRange.end)}`;
fs.rmSync(temporaryRoot, { recursive: true, force: true });

if (fs.existsSync(hudRoot)) {
  const imageDataUri = (name) => `data:image/png;base64,${fs.readFileSync(path.join(hudRoot, name)).toString('base64')}`;
  const hudHtml = fs.readFileSync(path.join(hudRoot, 'hud.html'), 'utf8')
    .replace('__HUD_LEFT_DRAGON__', imageDataUri('dragon-left.png'))
    .replace('__HUD_RIGHT_DRAGON__', imageDataUri('dragon-right.png'));
  const hudCss = fs.readFileSync(path.join(hudRoot, 'hud.css'), 'utf8');
  const hudJs = fs.readFileSync(path.join(hudRoot, 'hud.js'), 'utf8');
  output = output.replace('</head>', `<style data-novvy-hud>\n${hudCss}\n</style>\n</head>`);
  output = output.replace('<body>', `<body>\n${hudHtml}\n`);
  output = output.replace('</body>', `<script data-novvy-hud>\n${hudJs}\n</script>\n</body>`);
}
if (fs.existsSync(ctaRoot)) {
  const iconDataUri = `data:image/png;base64,${fs.readFileSync(path.join(ctaRoot, 'icon.png')).toString('base64')}`;
  const ctaHtml = fs.readFileSync(path.join(ctaRoot, 'cta.html'), 'utf8')
    .replace('__CTA_ICON__', iconDataUri);
  const ctaCss = fs.readFileSync(path.join(ctaRoot, 'cta.css'), 'utf8');
  const ctaJs = fs.readFileSync(path.join(ctaRoot, 'cta.js'), 'utf8');
  output = output.replace('</head>', `<style data-novvy-cta>\n${ctaCss}\n</style>\n</head>`);
  output = output.replace('<body>', `<body>\n${ctaHtml}\n`);
  output = output.replace('</body>', `<script data-novvy-cta>\n${ctaJs}\n</script>\n</body>`);
}
if (fs.existsSync(introRoot) && fs.existsSync(introVideoPath)) {
  const videoDataUri = `data:video/mp4;base64,${fs.readFileSync(introVideoPath).toString('base64')}`;
  const posterDataUri = `data:image/jpeg;base64,${fs.readFileSync(path.join(introRoot, 'poster.jpg')).toString('base64')}`;
  const introHtml = fs.readFileSync(path.join(introRoot, 'intro.html'), 'utf8')
    .replace('__NOVVY_INTRO_VIDEO__', videoDataUri)
    .replace('__NOVVY_INTRO_POSTER__', posterDataUri);
  const introCss = fs.readFileSync(path.join(introRoot, 'intro.css'), 'utf8');
  const introJs = fs.readFileSync(path.join(introRoot, 'intro.js'), 'utf8');
  output = output.replace('</head>', `<style data-novvy-intro>\n${introCss}\n</style>\n</head>`);
  output = output.replace('<body>', `<body>\n${introHtml}\n`);
  output = output.replace('</body>', `<script data-novvy-intro>\n${introJs}\n</script>\n</body>`);
}
const outputPath = path.join(editableRoot, 'index.html');
fs.writeFileSync(outputPath, output);
console.log(`Built ${outputPath} (${Buffer.byteLength(output)} bytes)`);
