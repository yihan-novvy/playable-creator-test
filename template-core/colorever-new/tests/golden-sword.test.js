import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareLevel,validateLevel} from '../src/level.js';
import {Puzzle} from '../src/model.js';
import {decorate} from '../src/patterns/golden-sword.js';

const read=relative=>fs.readFileSync(new URL(relative,import.meta.url));
const source=JSON.parse(read('../src/patterns/golden-sword.json'));
const cell=(x,y)=>source.target[y*source.width+x];

test('The sword has a connected, centered silhouette with generous whitespace and bead-only structures',()=>{
  assert.equal(source.width,25);assert.equal(source.height,32);
  assert.equal(Object.keys(source.colors).length,7);
  assert.deepEqual(new Set(source.target.filter(Boolean)),new Set(Object.keys(source.colors).map(Number)));
  assert.equal(source.opening,null);assert.equal(source.decoration,'none');
  const puzzle=new Puzzle({width:source.width,height:source.height,target:source.target,openingBoard:source.target});
  assert.equal(puzzle.connected(source.target.findIndex(Boolean),i=>source.target[i]!==0).length,puzzle.total);
  assert.ok(puzzle.total<source.target.length*.35);
  for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++)assert.equal(!!cell(x,y),!!cell(source.width-1-x,y),'the entire contour stays symmetric');
  assert.ok(source.target.slice(0,source.width).every(c=>c===0));
  assert.ok(source.target.slice(-source.width).every(c=>c===0));
  for(let y=17;y<=27;y++)assert.deepEqual(source.target.slice(y*source.width+9,y*source.width+16),[1,7,7,6,6,5,1],'the blade uses continuous broad silver facets');
  assert.ok(cell(2,12)&&cell(22,12),'the wide crossguard remains prominent');
  assert.ok(cell(9,3)&&cell(15,3),'the round pommel is enlarged');
  assert.equal(cell(12,30),1);assert.equal(cell(11,30),0);assert.equal(cell(13,30),0);
  decorate({scene:{add(){assert.fail('all sword structures must be playable beads');}}});
});

test('Sword openings conserve every bead and replay to completion in all supported modes',()=>{
  for(const openingMode of ['easy','medium','scattered'])for(const seed of [0,7,173,source.seed]){
    const {level,proof}=prepareLevel({...source,openingMode,seed});
    assert.deepEqual(level,prepareLevel({...source,openingMode,seed}).level);
    assert.deepEqual([...level.opening].sort((a,b)=>a-b),[...source.target].sort((a,b)=>a-b));
    assert.ok(level.opening.every((color,i)=>(color===0)===(source.target[i]===0)));
    if(openingMode==='easy')assert.ok(proof.moves>0&&proof.moves<=6);
    if(openingMode==='medium')assert.ok(proof.moves>=12&&proof.moves<=14);
    const puzzle=new Puzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening});
    for(const move of proof.solution)assert.ok(move.action==='pick'?puzzle.pick(move.region,move.index):puzzle.place(move.region,move.index));
    assert.ok(puzzle.complete);assert.equal(puzzle.tray.filter(Boolean).length,0);
    assert.ok(puzzle.undo());assert.ok(!puzzle.complete);
    puzzle.reset();assert.deepEqual(puzzle.board,level.opening);
  }
});

test('The demo opening completes within six placements',()=>{
  const {proof}=prepareLevel(source);
  assert.ok(proof.moves>0&&proof.moves<=6);
});

test('The sword is registered with matching hashes in the actual colorever-new template',()=>{
  const prefix='../../../editor/templates/colorever-new/';
  const catalog=JSON.parse(read(prefix+'game/patterns/catalog.json'));
  const entry=catalog.patterns.find(p=>p.id==='golden-sword');assert.ok(entry);
  const hash=data=>createHash('sha256').update(data).digest('hex');
  const pattern=read(prefix+'game/patterns/'+entry.level);
  assert.equal(hash(pattern),entry.templateSha256);
  assert.deepEqual(JSON.parse(pattern),validateLevel(source));
  const decorator=catalog.decorators['golden-sword'];
  assert.equal(hash(read(prefix+'game/'+decorator.file)),decorator.sha256);
  assert.equal(hash(read(prefix+'game/game.js')),catalog.engineSha256);
  assert.equal(hash(read(prefix+'game/'+catalog.levelEngine)),catalog.levelEngineSha256);
  assert.ok(JSON.parse(read(prefix+'game-manifest.json')).levels.some(p=>p.id==='golden-sword'&&p.path==='game/patterns/golden-sword.json'));
});
