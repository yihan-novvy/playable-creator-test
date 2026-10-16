import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareLevel} from '../src/level.js';
import {Puzzle} from '../src/model.js';
import {decorate} from '../src/patterns/blue-diamond-ring.js';

const source=JSON.parse(fs.readFileSync(new URL('../src/patterns/blue-diamond-ring.json',import.meta.url)));

test('The blue diamond ring keeps a connected bead silhouette and an enclosed empty finger hole',()=>{
  assert.equal(source.width,26);
  assert.equal(source.height,32);
  assert.equal(Object.keys(source.colors).length,8);
  assert.equal(source.opening,null);
  assert.equal(source.decoration,'none');
  assert.deepEqual(new Set(source.target.filter(Boolean)),new Set(Object.keys(source.colors).map(Number)));
  const puzzle=new Puzzle({width:source.width,height:source.height,target:source.target,openingBoard:source.target});
  assert.equal(puzzle.connected(source.target.findIndex(Boolean),i=>source.target[i]!==0).length,puzzle.total);
  assert.ok(puzzle.total<source.width*source.height*.5,'the ring must retain generous whitespace');
  const hole=puzzle.connected(20*source.width+12,i=>source.target[i]===0);
  assert.ok(hole.length>=140,'the finger hole must stay large and recognizable');
  assert.ok(hole.every(i=>i%source.width>0&&i%source.width<source.width-1&&Math.floor(i/source.width)>0&&Math.floor(i/source.width)<source.height-1),'the gold band must completely enclose the hole');
  assert.ok([5,6,7,8].every(c=>source.target.slice(0,12*source.width).filter(v=>v===c).length>=20),'the diamond uses broad blue facets and visible white highlights');
  decorate({scene:{add(){assert.fail('main structures must remain playable beads');}}});
});

test('The ring conserves every bead and replays to completion in all three opening modes',()=>{
  for(const openingMode of ['easy','medium','scattered'])for(const seed of [0,7,173,source.seed]){
    const {level,proof}=prepareLevel({...source,openingMode,seed});
    assert.deepEqual(level,prepareLevel({...source,openingMode,seed}).level);
    assert.deepEqual([...level.opening].sort((a,b)=>a-b),[...level.target].sort((a,b)=>a-b));
    assert.ok(level.opening.every((c,i)=>(c===0)===(level.target[i]===0)));
    if(openingMode==='easy')assert.ok(proof.moves>0&&proof.moves<=6);
    if(openingMode==='medium')assert.ok(proof.moves>=12&&proof.moves<=14);
    const puzzle=new Puzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening});
    for(const move of proof.solution)assert.ok(move.action==='pick'?puzzle.pick(move.region,move.index):puzzle.place(move.region,move.index));
    assert.ok(puzzle.complete);
    assert.equal(puzzle.tray.filter(Boolean).length,0);
    assert.ok(puzzle.undo());
    assert.ok(!puzzle.complete);
    puzzle.reset();
    assert.deepEqual(puzzle.board,level.opening);
  }
});

test('The default demo completes within six placements',()=>{
  const {proof}=prepareLevel(source);
  assert.ok(proof.moves>0&&proof.moves<=6);
});
