import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareLevel,validateLevel} from '../src/level.js';
import {Puzzle} from '../src/model.js';
import {decorate} from '../src/patterns/medical-kit.js';

const read=relative=>fs.readFileSync(new URL(relative,import.meta.url));
const source=JSON.parse(read('../src/patterns/medical-kit.json'));
const at=(x,y)=>source.target[y*source.width+x];

test('The medical kit has a complete coarse silhouette, hollow handle and enlarged cross',()=>{
  assert.equal(source.width,31);assert.equal(source.height,30);
  assert.equal(Object.keys(source.colors).length,7);
  assert.deepEqual(new Set(source.target.filter(Boolean)),new Set(Object.keys(source.colors).map(Number)));
  assert.equal(source.opening,null);assert.equal(source.decoration,'none');
  const puzzle=new Puzzle({width:source.width,height:source.height,target:source.target,openingBoard:source.target});
  assert.equal(puzzle.total,554);
  assert.equal(puzzle.connected(source.target.findIndex(Boolean),i=>source.target[i]!==0).length,puzzle.total);
  assert.ok(puzzle.total<source.target.length*.6,'the subject leaves open background');
  for(let x=0;x<source.width;x++)assert.equal(at(x,0)+at(x,source.height-1),0);
  for(let y=0;y<source.height;y++)assert.equal(at(0,y)+at(source.width-1,y),0);
  for(let y=5;y<=7;y++)for(let x=12;x<=18;x++)assert.equal(at(x,y),0,'the handle stays hollow');
  for(let y=11;y<=19;y++)for(let x=11;x<=19;x++){
    const cross=(x>=14&&x<=16)||(y>=14&&y<=16);
    assert.equal(at(x,y),cross?2:4,'the 9 × 9 red cross has clear ivory negative space');
  }
  for(let y=21;y<=25;y++)for(let x=4;x<=26;x++)assert.ok(at(x,y),'the lower case is fully playable');
  for(let y=20;y<=23;y++)for(let x=13;x<=17;x++)assert.ok([5,6,7].includes(at(x,y)),'the central clasp is made of metallic beads');
  decorate({scene:{add(){assert.fail('all medical-kit structures must be playable beads');}}});
});

test('All medical-kit opening modes conserve beads and replay the puzzle to completion',()=>{
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

test('The registered colorever-new template matches the medical-kit source',()=>{
  const prefix='../../../editor/templates/colorever-new/';
  assert.equal(JSON.parse(read('../src/patterns/catalog.json')).filter(p=>p.id==='medical-kit').length,1);
  const registry=read('../src/patterns/index.js').toString();
  assert.ok(registry.includes("'medical-kit':{level:medicalKitLevel,decorate:medicalKit}"));
  const catalog=JSON.parse(read(prefix+'game/patterns/catalog.json'));
  const entry=catalog.patterns.find(p=>p.id==='medical-kit');assert.ok(entry);
  const hash=data=>createHash('sha256').update(data).digest('hex');
  const pattern=read(prefix+'game/patterns/'+entry.level);
  assert.equal(hash(pattern),entry.templateSha256);
  assert.deepEqual(JSON.parse(pattern),validateLevel(source));
  const decorator=catalog.decorators['medical-kit'];
  assert.equal(hash(read(prefix+'game/'+decorator.file)),decorator.sha256);
  assert.equal(hash(read(prefix+'game/game.js')),catalog.engineSha256);
  assert.equal(hash(read(prefix+'game/'+catalog.levelEngine)),catalog.levelEngineSha256);
  assert.ok(JSON.parse(read(prefix+'game-manifest.json')).levels.some(p=>p.id==='medical-kit'&&p.path==='game/patterns/medical-kit.json'));
});
