import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { compileSource } from './build.mjs';

const source = fs.readFileSync(new URL('../source/original.html', import.meta.url), 'utf8');
const provenance = JSON.parse(fs.readFileSync(new URL('../source/provenance.json', import.meta.url)));
assert.equal(createHash('sha256').update(source).digest('hex'), provenance.hashes['unpacked-game.html']);
const a = compileSource(source), b = compileSource(source);
assert.deepEqual(a, b, 'deterministic extraction');
assert.deepEqual(a.counts, [2, 37]);
new vm.Script(a.core);
new vm.Script(a.assets);
assert(!a.shell.includes('mraid.js'));
assert(!/<(?:script|link)[^>]+(?:src|href)=["']https?:/.test(a.shell));
const params = JSON.parse(a.assets.slice('window.editorParameters='.length, a.assets.indexOf(';"use strict";')));
for (const level of params.levelAssets) {
  const cells = new Set(level.CMS.map(c => `${c.BPM.x},${c.BPM.y}`));
  const occupied = new Set();
  for (const block of level.BMS) {
    assert(block.BPMS.length > 0);
    for (const cell of block.BPMS) {
      const key = `${cell.x},${cell.y}`;
      assert(cells.has(key), `Block outside board: ${key}`);
      assert(!occupied.has(key), `Overlapping blocks: ${key}`);
      occupied.add(key);
    }
    assert(level.DMS.some(door => door.BCT === block.BCT), `Missing color exit: ${block.BCT}`);
  }
}
for (const key of ['gotoMarketAfterXClick', 'gotoMarketAfterXBlocksPass', 'endcardGoToMarketAfterXSeconds']) assert.equal(params[key], 0);
assert.throws(() => compileSource(source.replace('mraid.js', 'changed.js')), /Unexpected/);
console.log('Block Out source integrity, deterministic build, board occupancy and color exits passed');
