import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {unpackGame, packageGame} from '../../shared/standalone/build.mjs';

const here = fileURLToPath(new URL('../', import.meta.url));
const read = name => fs.readFileSync(path.join(here, name), 'utf8');
const sha = value => createHash('sha256').update(value).digest('hex');
export const ORIGINAL_SHA = '519eae54d8c0e222bb424a5fe5ab82394e115497c28b87ae77149d147212fa72';
export function once(source, anchor, replacement) {
  if (source.split(anchor).length !== 2) throw new Error('Native integration seam changed: ' + anchor.slice(0, 80));
  return source.replace(anchor, () => replacement);
}
export function observeDeliveries(source) {
  const sourceMatch = source.match(/^const SOURCE=(.+);$/m);
  if (!sourceMatch) throw new Error('Missing native source registry');
  const registry = JSON.parse(sourceMatch[1]);
  // Observe the existing releaseDone callback after its third skewer settles.
  // The frozen Cocos game/assets, move counts, clock and input are untouched.
  registry.code = once(registry.code,
    "wrap(p, 'releaseDone', function (original, args) { if (settled || restarting) return; var out = original.apply(this, args); reportProgress(false); return out; });",
    "wrap(p, 'releaseDone', function (original, args) { if (settled || restarting) return; var before = this._doneNum; var out = original.apply(this, args); reportProgress(false); if (this._doneNum > before) emit('origin:meal-served', {delivered: this._doneNum}); return out; });");
  source = source.replace(sourceMatch[0], () => 'const SOURCE=' + JSON.stringify(registry) + ';');
  source = once(source,
    "      if (name.endsWith('-step')) {",
    "      if (name === 'origin:meal-served') {\n        try { options.onMealServed?.(detail); } catch (error) { console.error('Meal observer failed', error); }\n        return;\n      }\n      if (name.endsWith('-step')) {");
  return source;
}
export function build() {
  const base = read('game.base.js');
  if (sha(base) !== ORIGINAL_SHA) throw new Error('game.base.js no longer matches the retained original');
  const unpacked = unpackGame(base);
  const instrumented = observeDeliveries(unpacked.source);
  const packaged = packageGame(instrumented, unpacked.metadata);
  const privateBase = once(packaged.output,
    'NovvyGame(createStandaloneEntry(factory,metadata));',
    'registerBase(createStandaloneEntry(factory,metadata));');
  const artwork = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(here, 'assets/story-states.jpg')).toString('base64');
  const wrapper = read('src/story.js').replace(/^export /gm, '');
  const output = `(function(){\n'use strict';\nlet baseFactory;\n(function(registerBase){\n${privateBase}\n})(entry=>{baseFactory=entry;});\n${wrapper}\nNovvyGame(createFirstMealEntry(baseFactory,${JSON.stringify(artwork)},${JSON.stringify(read('src/story.css'))}));\n})();\n`;
  new vm.Script(output);
  let registrations = 0;
  vm.runInNewContext(output, {atob, TextDecoder, NovvyGame(entry) { if (typeof entry !== 'function') throw new Error('Invalid entry'); registrations++; }}, {timeout: 5000});
  if (registrations !== 1) throw new Error('Exactly one synchronous public registration required');
  if (Buffer.byteLength(output) > 5000000) throw new Error('Final game.js exceeds 5 MB');
  const delivery = path.resolve(here, '../../result/grill-sort-first-meal');
  fs.mkdirSync(delivery, {recursive: true});
  fs.writeFileSync(path.join(delivery, 'game.js'), output);
  const native = JSON.parse(unpacked.source.match(/^const SOURCE=(.+);$/m)[1]);
  const changed = JSON.parse(instrumented.match(/^const SOURCE=(.+);$/m)[1]);
  const nativeAssetsUnchanged = JSON.stringify(native.resources) === JSON.stringify(changed.resources);
  if (!nativeAssetsUnchanged) throw new Error('Frozen native resources changed');
  const manifest = {id: 'grill-sort-first-meal', name: 'Grill Sort · Her First Warm Meal', playableType: 'level', levelCount: 1,
    bytes: Buffer.byteLength(output), sha256: sha(output), baseSha256: sha(base), nativeAssetsUnchanged,
    nativeAssetsSha256: sha(JSON.stringify(native.resources)), instrumentedPayloadSha256: sha(instrumented),
    gameplay: {grills: 12, skewers: 120, countdownSeconds: 180}, ctaPlacements: [],
    observation: 'releaseDone after native _doneNum increases; story-only callback, no additional shell.step',
    protocol: 'https://developer.novvy.ai/eventLogs'};
  fs.writeFileSync(path.join(delivery, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify(manifest, null, 2));
  return {output, manifest, source: instrumented};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) build();
