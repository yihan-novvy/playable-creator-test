import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareLevel,validateLevel} from '../src/level.js';
import {Puzzle} from '../src/model.js';
import {decorate} from '../src/patterns/ice-wolf.js';

const read=relative=>fs.readFileSync(new URL(relative,import.meta.url));
const source=JSON.parse(read('../src/patterns/ice-wolf.json'));

test('The frontal wolf head is a connected enlarged silhouette made entirely of playable beads',()=>{
  assert.equal(source.width,40);assert.equal(source.height,40);
  assert.equal(Object.keys(source.colors).length,7);
  assert.deepEqual(new Set(source.target.filter(Boolean)),new Set(Object.keys(source.colors).map(Number)));
  assert.equal(source.opening,null);assert.equal(source.decoration,'none');
  const puzzle=new Puzzle({width:source.width,height:source.height,target:source.target,openingBoard:source.target});
  assert.equal(puzzle.total,686);
  assert.equal(puzzle.connected(source.target.findIndex(Boolean),i=>source.target[i]!==0).length,puzzle.total);
  assert.ok(puzzle.total<source.target.length*.6,'the wolf leaves an open background');
  const active=source.target.flatMap((c,i)=>c?[[i%source.width,Math.floor(i/source.width)]]:[]);
  const bounds={width:Math.max(...active.map(([x])=>x))-Math.min(...active.map(([x])=>x))+1,height:Math.max(...active.map(([,y])=>y))-Math.min(...active.map(([,y])=>y))+1};
  assert.ok(bounds.width<=28&&bounds.height===37,'the cheek and mane contour stays narrow and tall');
  for(let x=0;x<source.width;x++)assert.equal(source.target[x]+source.target[(source.height-1)*source.width+x],0);
  for(let y=0;y<source.height;y++)assert.equal(source.target[y*source.width]+source.target[y*source.width+source.width-1],0);
  for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++)assert.equal(source.target[y*source.width+x],source.target[y*source.width+source.width-1-x],'the frontal ears, face and mane remain balanced');
  decorate({scene:{add(){assert.fail('the wolf must not use non-playable overlays');}}});
});

test('All wolf opening modes conserve colors and replay to completion with undo and reset',()=>{
  for(const openingMode of ['easy','medium','scattered'])for(const seed of [0,7,173,source.seed]){
    const {level,proof}=prepareLevel({...source,openingMode,seed});
    assert.deepEqual(level,prepareLevel({...source,openingMode,seed}).level);
    assert.deepEqual([...level.opening].sort((a,b)=>a-b),[...source.target].sort((a,b)=>a-b));
    assert.ok(level.opening.every((c,i)=>(c===0)===(source.target[i]===0)));
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

test('The demo completes within six placements',()=>{
  const {proof}=prepareLevel(source);
  assert.ok(proof.moves>0&&proof.moves<=6);
});

test('The registered colorever-new wolf and hashes match the source',()=>{
  const prefix='../../../editor/templates/colorever-new/';
  assert.equal(JSON.parse(read('../src/patterns/catalog.json')).filter(p=>p.id==='ice-wolf').length,1);
  assert.ok(read('../src/patterns/index.js').toString().includes("'ice-wolf':{level:iceWolfLevel,decorate:iceWolf}"));
  const catalog=JSON.parse(read(prefix+'game/patterns/catalog.json'));
  const entry=catalog.patterns.find(p=>p.id==='ice-wolf');assert.ok(entry);
  const hash=data=>createHash('sha256').update(data).digest('hex');
  const pattern=read(prefix+'game/patterns/'+entry.level);
  assert.equal(hash(pattern),entry.templateSha256);
  assert.deepEqual(JSON.parse(pattern),validateLevel(source));
  const decorator=catalog.decorators['ice-wolf'];
  assert.equal(hash(read(prefix+'game/'+decorator.file)),decorator.sha256);
  assert.equal(hash(read(prefix+'game/game.js')),catalog.engineSha256);
  assert.equal(hash(read(prefix+'game/'+catalog.levelEngine)),catalog.levelEngineSha256);
  const manifest=JSON.parse(read(prefix+'game-manifest.json'));
  assert.equal(manifest.id,'colorever-new');
  assert.ok(manifest.levels.some(p=>p.id==='ice-wolf'&&p.path==='game/patterns/ice-wolf.json'));
});
