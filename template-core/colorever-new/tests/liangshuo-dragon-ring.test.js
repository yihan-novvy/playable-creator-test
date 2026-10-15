import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareLevel,createPuzzle} from '../src/game-level.js';

const source=JSON.parse(fs.readFileSync(new URL('../src/patterns/liangshuo-2100421714782785537-2-1.json',import.meta.url)));

test('Liangshuo gemstone ring replays shipping modes within the transfer budget across fixed seeds',()=>{
  for(const openingMode of ['easy','medium'])for(const seed of [0,1,6,7,31,source.seed]){
    const {level,proof}=prepareLevel({...source,openingMode,seed,coverage:95,batchSize:30});
    assert.deepEqual([...level.opening].sort((a,b)=>a-b),[...level.target].sort((a,b)=>a-b));
    assert.ok(proof.moves>0);
    if(openingMode==='easy')assert.ok(proof.moves<=6);
    else {
      assert.ok(proof.moves<=80,`seed ${seed}: ${proof.moves} transfers exceeds 80`);
      assert.ok(proof.metrics.wrongPercent>=95,'retain the selected 95 percent mismatch target');
    }
    const puzzle=createPuzzle(level);
    for(const move of proof.solution)assert.ok(move.action==='pick'?puzzle.pick(move.region,move.index):puzzle.place(move.region,move.index));
    assert.ok(puzzle.complete);
    assert.equal(puzzle.tray.filter(Boolean).length,0);
    puzzle.reset();
    assert.deepEqual(puzzle.board,level.opening);
  }
});
