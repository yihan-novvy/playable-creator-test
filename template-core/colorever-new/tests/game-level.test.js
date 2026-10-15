import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareLevel,validateLevel,solveLevel,createPuzzle} from '../src/game-level.js';
import {prepareLevel as prepareLegacyLevel} from '../src/level.js';
import {prepareGlobalLevel} from '../src/global-opening.js';

const pattern=id=>JSON.parse(fs.readFileSync(new URL(`../src/patterns/${id}.json`,import.meta.url)));

test('Shipping easy mode retains exactly the existing generated board and solution',()=>{
  for(const id of ['cat','house','golden-retriever'])for(const seed of [0,1,7,23]) {
    const input={...pattern(id),opening:null,openingMode:'easy',seed};
    assert.deepEqual(prepareLevel(input),prepareLegacyLevel(input));
  }
});

test('Shipping global mode matches the approved studio and replays with the shipping puzzle factory',()=>{
  for(const id of ['cat','house','golden-retriever']) {
    const input={...pattern(id),opening:null,openingMode:'medium',seed:2,coverage:90,batchSize:24};
    const prepared=prepareLevel(input),preview=prepareGlobalLevel(input,input);
    assert.deepEqual(prepared.level.opening,preview.level.opening);
    assert.deepEqual(prepared.proof,preview.proof);
    assert.deepEqual(prepareLevel({...input,openingMode:'scattered'}),prepared,'legacy scattered configs migrate to global');
    const level=validateLevel(JSON.parse(JSON.stringify(prepared.level))),puzzle=createPuzzle(level);
    assert.equal(level.batchSize,24);assert.equal(level.coverage,90);
    for(const hint of prepared.proof.solution) {
      if(hint.action==='pick') {
        assert.ok(puzzle.pick(hint.region,hint.index));
        assert.ok(puzzle.selection.indices.length<=24);
      } else assert.ok(puzzle.place(hint.region,hint.index));
    }
    assert.ok(puzzle.complete);assert.equal(puzzle.moves,prepared.proof.moves);
    assert.deepEqual(solveLevel(level),prepared.proof);
  }
});

test('Preview speed never enters shipping level data and completed global openings stay valid',()=>{
  const source=pattern('house');
  const prepared=prepareLevel({...source,opening:null,openingMode:'medium',speed:3,previewSpeed:3});
  assert.ok(!Object.hasOwn(prepared.level,'speed'));assert.ok(!Object.hasOwn(prepared.level,'previewSpeed'));
  const solved=prepareLevel({...prepared.level,opening:[...prepared.level.target]});
  assert.equal(solved.proof.moves,0);assert.equal(solved.proof.metrics.averageBatch,0);
  assert.equal(solved.proof.metrics.smallBatchPercent,0);assert.equal(solved.proof.metrics.largeBatchPercent,0);
  assert.equal(validateLevel({...source,openingMode:'scattered'}).openingMode,'medium');
  assert.throws(()=>validateLevel({...source,openingMode:'unknown'}));
});
