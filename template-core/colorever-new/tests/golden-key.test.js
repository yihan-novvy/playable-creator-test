import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareLevel,validateLevel} from '../src/level.js';
import {Puzzle} from '../src/model.js';
import {decorate} from '../src/patterns/golden-key.js';

const read=relative=>fs.readFileSync(new URL(relative,import.meta.url));
const source=JSON.parse(read('../src/patterns/golden-key.json'));
const at=(x,y)=>source.target[y*source.width+x];

test('Golden key uses a connected coarse bead silhouette with a hollow bow and distinct teeth',()=>{
  assert.equal(source.width,24);assert.equal(source.height,32);
  assert.equal(Object.keys(source.colors).length,6);
  assert.deepEqual(new Set(source.target.filter(Boolean)),new Set(Object.keys(source.colors).map(Number)));
  assert.equal(source.opening,null);assert.equal(source.decoration,'none');
  const puzzle=new Puzzle({width:source.width,height:source.height,target:source.target,openingBoard:source.target});
  assert.equal(puzzle.connected(source.target.findIndex(Boolean),i=>source.target[i]!==0).length,puzzle.total);
  assert.ok(puzzle.total<source.width*source.height*.5,'the contour must retain substantial open background');
  for(let y=9;y<=11;y++)for(let x=8;x<=15;x++)assert.equal(at(x,y),0,'the main bow must stay hollow');
  assert.equal(at(11,3),0);assert.equal(at(12,3),0,'the small hanging loop stays hollow');
  for(let y=17;y<=24;y++)for(let x=10;x<=13;x++)assert.ok(at(x,y),'the shaft remains four beads wide');
  for(let x=16;x<=19;x++){
    assert.ok(at(x,25)&&at(x,26));assert.equal(at(x,27),0);assert.ok(at(x,28)&&at(x,29));
  }
  decorate({scene:{add(){assert.fail('key structures must be playable beads');}}});
});

test('Golden key openings conserve colors and replay to completion in every supported mode',()=>{
  for(const openingMode of ['easy','medium','scattered'])for(const seed of [0,7,173]){
    const {level,proof}=prepareLevel({...source,openingMode,seed});
    assert.deepEqual(level,prepareLevel({...source,openingMode,seed}).level);
    assert.deepEqual([...level.opening].sort((a,b)=>a-b),[...source.target].sort((a,b)=>a-b));
    assert.ok(level.opening.every((color,i)=>(color===0)===(source.target[i]===0)));
    if(openingMode==='easy')assert.ok(proof.moves>0&&proof.moves<=6);
    if(openingMode==='medium')assert.ok(proof.moves>=12&&proof.moves<=14);
    const puzzle=new Puzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening});
    const counts=[...puzzle.board,...puzzle.tray].sort((a,b)=>a-b);
    for(const move of proof.solution){
      assert.ok(move.action==='pick'?puzzle.pick(move.region,move.index):puzzle.place(move.region,move.index));
      assert.deepEqual([...puzzle.board,...puzzle.tray].sort((a,b)=>a-b),counts);
    }
    assert.ok(puzzle.complete);assert.equal(puzzle.tray.filter(Boolean).length,0);
    assert.ok(puzzle.undo());assert.ok(!puzzle.complete);
    puzzle.reset();assert.deepEqual(puzzle.board,level.opening);
  }
});

test('The default key demo completes within six placements',()=>{
  const {proof}=prepareLevel(source);
  assert.ok(proof.moves>0&&proof.moves<=6);
});

test('Golden key is registered in the built colorever-new template with verified artifact hashes',()=>{
  const prefix='../../../editor/templates/colorever-new/';
  const catalog=JSON.parse(read(prefix+'game/patterns/catalog.json'));
  const entry=catalog.patterns.find(p=>p.id==='golden-key');assert.ok(entry);
  const pattern=read(prefix+'game/patterns/'+entry.level);
  const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
  assert.equal(hash(pattern),entry.templateSha256);
  assert.deepEqual(JSON.parse(pattern),validateLevel(source));
  const decorator=catalog.decorators['golden-key'];
  assert.equal(hash(read(prefix+'game/'+decorator.file)),decorator.sha256);
  assert.equal(hash(read(prefix+'game/game.js')),catalog.engineSha256);
  assert.equal(hash(read(prefix+'game/'+catalog.levelEngine)),catalog.levelEngineSha256);
  const manifest=JSON.parse(read(prefix+'game-manifest.json'));
  assert.ok(manifest.levels.some(p=>p.id==='golden-key'&&p.path==='game/patterns/golden-key.json'));
});
