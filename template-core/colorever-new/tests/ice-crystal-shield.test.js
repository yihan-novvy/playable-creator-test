import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareLevel,validateLevel} from '../src/level.js';
import {Puzzle} from '../src/model.js';
import {decorate} from '../src/patterns/ice-crystal-shield.js';

const read=relative=>fs.readFileSync(new URL(relative,import.meta.url));
const source=JSON.parse(read('../src/patterns/ice-crystal-shield.json'));
const cell=(x,y)=>source.target[y*source.width+x];

test('The icy shield has a closed symmetric silhouette and large connected color regions',()=>{
  assert.equal(source.width,29);assert.equal(source.height,32);
  assert.equal(Object.keys(source.colors).length,7);
  assert.deepEqual(new Set(source.target.filter(Boolean)),new Set(Object.keys(source.colors).map(Number)));
  assert.equal(source.opening,null);assert.equal(source.decoration,'none');
  const puzzle=new Puzzle({width:source.width,height:source.height,target:source.target,openingBoard:source.target});
  assert.equal(puzzle.total,486);
  assert.equal(puzzle.connected(source.target.findIndex(Boolean),i=>source.target[i]!==0).length,puzzle.total);
  assert.ok(puzzle.total<source.target.length*.6,'background remains open');
  for(let y=0;y<source.height;y++){
    const row=source.target.slice(y*source.width,(y+1)*source.width);
    const first=row.findIndex(Boolean),last=row.findLastIndex(Boolean);
    if(first>=0)assert.ok(row.slice(first,last+1).every(Boolean),'no holes interrupt the solid shield');
    for(let x=0;x<source.width;x++)assert.equal(!!cell(x,y),!!cell(source.width-1-x,y),'the complete silhouette is symmetric');
    assert.equal(cell(0,y)+cell(source.width-1,y),0);
  }
  assert.ok(source.target.slice(0,source.width).every(c=>c===0));
  assert.ok(source.target.slice(-source.width).every(c=>c===0));
  assert.equal(cell(14,1),1);assert.equal(cell(14,30),1,'both shield tips stay pointed');
  assert.equal(cell(14,9),4);assert.equal(cell(14,24),4,'the enlarged central crystal has two tips');
  assert.equal(cell(8,15),4);assert.equal(cell(20,15),4,'the crystal retains its broad icy edge');
  assert.ok([5,6,7].every(c=>source.target.filter(v=>v===c).length>=25),'each crystal facet is a substantial color block');
  const visited=new Set();
  source.target.forEach((color,i)=>{
    if(!color||visited.has(i))return;
    const region=puzzle.connected(i,j=>source.target[j]===color);
    region.forEach(j=>visited.add(j));
    assert.ok(region.length>=10,'avoid tiny disconnected color accents');
  });
  decorate({scene:{add(){assert.fail('the entire shield must consist of playable beads');}}});
});

test('All icy-shield openings conserve beads, solve, undo and reset in the actual puzzle model',()=>{
  for(const openingMode of ['easy','medium','scattered'])for(const seed of [0,7,173,source.seed]){
    const {level,proof}=prepareLevel({...source,openingMode,seed});
    assert.deepEqual(level,prepareLevel({...source,openingMode,seed}).level,'opening generation is deterministic');
    assert.deepEqual([...level.opening].sort((a,b)=>a-b),[...source.target].sort((a,b)=>a-b));
    assert.ok(level.opening.every((color,i)=>(color===0)===(source.target[i]===0)));
    if(openingMode==='easy')assert.ok(proof.moves>=4&&proof.moves<=6);
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

test('The demonstration completes within six placements',()=>{
  const {proof}=prepareLevel(source);
  assert.ok(proof.moves>0&&proof.moves<=6);
});

test('The actual colorever-new registration and engine hashes match the shield source',()=>{
  const id='ice-crystal-shield',prefix='../../../editor/templates/colorever-new/';
  assert.equal(JSON.parse(read('../src/patterns/catalog.json')).filter(p=>p.id===id).length,1);
  assert.ok(read('../src/patterns/index.js').toString().includes("'ice-crystal-shield':{level:iceCrystalShieldLevel,decorate:iceCrystalShield}"));
  const catalog=JSON.parse(read(prefix+'game/patterns/catalog.json'));
  const entry=catalog.patterns.find(p=>p.id===id);assert.ok(entry);
  const hash=data=>createHash('sha256').update(data).digest('hex');
  const pattern=read(prefix+'game/patterns/'+entry.level);
  assert.equal(hash(pattern),entry.templateSha256);
  assert.deepEqual(JSON.parse(pattern),validateLevel(source));
  const decorator=catalog.decorators[id];
  assert.equal(hash(read(prefix+'game/'+decorator.file)),decorator.sha256);
  assert.equal(hash(read(prefix+'game/game.js')),catalog.engineSha256);
  assert.equal(hash(read(prefix+'game/'+catalog.levelEngine)),catalog.levelEngineSha256);
  assert.ok(JSON.parse(read(prefix+'game-manifest.json')).levels.some(p=>p.id===id&&p.path===`game/patterns/${id}.json`));
});
