import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareLevel,validateLevel} from '../src/level.js';
import {Puzzle} from '../src/model.js';
import {decorate} from '../src/patterns/ice-wolf-head.js';

const read=relative=>fs.readFileSync(new URL(relative,import.meta.url));
const source=JSON.parse(read('../src/patterns/ice-wolf-head.json'));
const cell=(x,y)=>source.target[y*source.width+x];

test('The frontal ice wolf head is a connected enlarged silhouette made entirely of playable beads',()=>{
  assert.equal(source.width,32);assert.equal(source.height,32);
  assert.equal(Object.keys(source.colors).length,7);
  assert.deepEqual(new Set(source.target.filter(Boolean)),new Set(Object.keys(source.colors).map(Number)));
  assert.equal(source.opening,null);assert.equal(source.decoration,'none');
  const puzzle=new Puzzle({width:source.width,height:source.height,target:source.target,openingBoard:source.target});
  assert.equal(puzzle.total,502);
  assert.equal(puzzle.connected(source.target.findIndex(Boolean),i=>source.target[i]!==0).length,puzzle.total);
  assert.ok(puzzle.total<source.target.length*.55,'the wolf leaves an open background');
  for(let x=0;x<source.width;x++)assert.equal(source.target[x]+source.target[(source.height-1)*source.width+x],0);
  for(let y=0;y<source.height;y++)assert.equal(source.target[y*source.width]+source.target[y*source.width+source.width-1],0);
  for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++)assert.equal(source.target[y*source.width+x],source.target[y*source.width+source.width-1-x],'the frontal ears, face and mane remain balanced');
  decorate({scene:{add(){assert.fail('the wolf must not use non-playable overlays');}}});
});

test('The wolf has a slender wedge silhouette, a long bridge, small nose and restrained mouth',()=>{
  const span=y=>{
    const active=source.target.slice(y*source.width,(y+1)*source.width).flatMap((c,x)=>c?[x]:[]);
    return active.length?active.at(-1)-active[0]+1:0;
  };
  assert.ok(Math.max(...Array.from({length:source.height},(_,y)=>span(y)))<=26,'the cheeks stay narrower than the former round face');
  assert.ok(span(20)<=22&&span(24)<=18&&span(27)<=12,'the cheeks and jaw taper towards the chin');
  assert.equal(cell(8,2),7);assert.equal(cell(23,2),7);
  for(const x of [8,9,22,23])assert.equal(cell(x,5),1);
  for(let x=12;x<=19;x++)assert.equal(cell(x,5),0);
  assert.equal(cell(9,14),4);assert.equal(cell(22,14),4);
  assert.equal(cell(8,14),1);assert.equal(cell(23,14),1);
  assert.equal(cell(10,15),1);assert.equal(cell(21,15),1);
  assert.equal(cell(15,13),3);assert.equal(cell(16,13),3);
  assert.equal(cell(15,14),5);assert.equal(cell(16,14),5);
  for(let y=16;y<=21;y++)for(let x=14;x<=17;x++)assert.equal(cell(x,y),5,'the white bridge stays long and continuous');
  for(let x=13;x<=18;x++)assert.equal(cell(x,22),1);
  for(let x=14;x<=17;x++)assert.equal(cell(x,23),1);
  for(let x=15;x<=16;x++)assert.equal(cell(x,24),1);
  for(let x=13;x<=18;x++)assert.equal(cell(x,26),6,'the short mouth is quieter than the dark nose');
  for(let x=13;x<=18;x++)assert.equal(cell(x,27),5);
});

test('All ice wolf head opening modes conserve colors and replay to completion with undo and reset',()=>{
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
  const sourceCatalog=JSON.parse(read('../src/patterns/catalog.json'));
  assert.equal(sourceCatalog.filter(p=>p.id==='ice-wolf-head').length,1);
  assert.equal(sourceCatalog.filter(p=>p.id==='ice-wolf').length,1);
  const original=JSON.parse(read('../src/patterns/ice-wolf.json'));
  assert.notDeepEqual(source.target,original.target);
  assert.notEqual(source.name,original.name);
  assert.equal(sourceCatalog.find(p=>p.id==='ice-wolf-head').level,'ice-wolf-head.json');
  assert.equal(sourceCatalog.find(p=>p.id==='ice-wolf').level,'ice-wolf.json');
  assert.ok(read('../src/patterns/index.js').toString().includes("'ice-wolf-head':{level:iceWolfHeadLevel,decorate:iceWolfHead}"));
  const catalog=JSON.parse(read(prefix+'game/patterns/catalog.json'));
  const entry=catalog.patterns.find(p=>p.id==='ice-wolf-head');assert.ok(entry);
  const hash=data=>createHash('sha256').update(data).digest('hex');
  const pattern=read(prefix+'game/patterns/'+entry.level);
  assert.equal(hash(pattern),entry.templateSha256);
  assert.deepEqual(JSON.parse(pattern),validateLevel(source));
  const decorator=catalog.decorators['ice-wolf-head'];
  assert.equal(hash(read(prefix+'game/'+decorator.file)),decorator.sha256);
  assert.equal(hash(read(prefix+'game/game.js')),catalog.engineSha256);
  assert.equal(hash(read(prefix+'game/'+catalog.levelEngine)),catalog.levelEngineSha256);
  const manifest=JSON.parse(read(prefix+'game-manifest.json'));
  assert.equal(manifest.id,'colorever-new');
  assert.ok(manifest.levels.some(p=>p.id==='ice-wolf-head'&&p.path==='game/patterns/ice-wolf-head.json'));
});
