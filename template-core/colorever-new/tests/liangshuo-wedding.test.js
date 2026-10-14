import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareLevel} from '../src/level.js';
import {Puzzle} from '../src/model.js';

const source=JSON.parse(fs.readFileSync(new URL('../src/patterns/liangshuo-2104824229023064066-2-2.json',import.meta.url)));

test('Liangshuo wedding conserves every bead and replays to completion in all modes',()=>{
  for(const openingMode of ['easy','medium','scattered'])for(const seed of [0,7,173]){
    const {level,proof}=prepareLevel({...source,openingMode,seed});
    assert.deepEqual([...level.opening].sort((a,b)=>a-b),[...level.target].sort((a,b)=>a-b));
    assert.ok(proof.moves>0);
    if(openingMode==='easy')assert.ok(proof.moves<=6);
    const puzzle=new Puzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening});
    for(const move of proof.solution)assert.ok(move.action==='pick'?puzzle.pick(move.region,move.index):puzzle.place(move.region,move.index));
    assert.ok(puzzle.complete);
    assert.equal(puzzle.tray.filter(Boolean).length,0);
    puzzle.reset();
    assert.deepEqual(puzzle.board,level.opening);
  }
});
