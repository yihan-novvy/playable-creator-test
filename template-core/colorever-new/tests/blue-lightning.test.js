import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareLevel} from '../src/level.js';
import {Puzzle} from '../src/model.js';
const source=JSON.parse(fs.readFileSync(new URL('../src/patterns/blue-lightning.json',import.meta.url)));
test('Blue lightning openings conserve every bead and replay to completion in all modes',()=>{
 for(const openingMode of ['easy','medium','scattered'])for(let seed=0;seed<20;seed++){
  const {level,proof}=prepareLevel({...source,opening:null,openingMode,seed});
  assert.deepEqual([...level.target].sort(),[...level.opening].sort());
  assert.ok(level.opening.every((c,i)=>(c===0)===(level.target[i]===0)));
  assert.ok(proof.moves>0);if(openingMode==='easy')assert.ok(proof.moves<=6);
  const puzzle=new Puzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening});
  for(const move of proof.solution)assert.ok(move.action==='pick'?puzzle.pick(move.region,move.index):puzzle.place(move.region,move.index));
  assert.ok(puzzle.complete);puzzle.reset();assert.deepEqual(puzzle.board,level.opening);
 }
});
