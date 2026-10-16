import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareLevel,validateLevel} from '../src/level.js';
import {Puzzle} from '../src/model.js';
import {decorate} from '../src/patterns/jh-gold-ring.js';

const id='jh-gold-ring';
const source=JSON.parse(fs.readFileSync(new URL(`../src/patterns/${id}.json`,import.meta.url)));
const puzzleFor=level=>new Puzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening??level.target});
const counts=values=>[...values].sort((a,b)=>a-b);

test('The ring has one complete playable silhouette, an enclosed finger hole and six colors',()=>{
  assert.ok(source.width>=24&&source.width<=32&&source.height>=24&&source.height<=32);
  assert.equal(Object.keys(source.colors).length,6);
  assert.deepEqual(new Set(source.target.filter(Boolean)),new Set(Object.keys(source.colors).map(Number)));
  assert.equal(source.decoration,'none');
  const puzzle=puzzleFor(source),start=source.target.findIndex(Boolean);
  assert.equal(puzzle.connected(start,i=>source.target[i]!==0).length,puzzle.total);
  assert.ok(puzzle.total<source.width*source.height*.6,'retain space around the ring');
  const fingerHole=puzzle.connected(8*source.width+15,i=>source.target[i]===0);
  assert.ok(fingerHole.length>70,'the finger hole must remain large enough to read');
  assert.ok(fingerHole.every(i=>i%source.width>0&&i%source.width<source.width-1&&Math.floor(i/source.width)>0&&Math.floor(i/source.width)<source.height-1),'the finger hole must be fully enclosed by the band');
  decorate({scene:{add(){assert.fail('ring geometry and lettering must use playable beads');}}});
});

test('Every opening mode conserves the ring and colors and replays to completion',()=>{
  for(const openingMode of ['easy','medium','scattered'])for(const seed of [0,7,173,source.seed]){
    const {level,proof}=prepareLevel({...source,openingMode,seed});
    assert.deepEqual(level,prepareLevel({...source,openingMode,seed}).level);
    assert.deepEqual(counts(level.opening),counts(level.target));
    assert.ok(level.opening.every((color,i)=>(color===0)===(level.target[i]===0)));
    assert.ok(proof.moves>0);
    if(openingMode==='easy')assert.ok(proof.moves<=6);
    if(openingMode==='medium')assert.ok(proof.moves>=12&&proof.moves<=14);
    const puzzle=puzzleFor(level),initial=counts([...puzzle.board,...puzzle.tray]);
    for(const move of proof.solution){
      assert.ok(move.action==='pick'?puzzle.pick(move.region,move.index):puzzle.place(move.region,move.index));
      assert.deepEqual(counts([...puzzle.board,...puzzle.tray]),initial);
    }
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

test('The registered colorever-new artifact matches its source and checksums',()=>{
  const root=new URL('../../../editor/templates/colorever-new/',import.meta.url);
  const read=relative=>fs.readFileSync(new URL(relative,root));
  const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
  const catalog=JSON.parse(read('game/patterns/catalog.json'));
  const picture=catalog.patterns.find(p=>p.id===id);
  assert.ok(picture);
  const data=read(`game/patterns/${picture.level}`);
  assert.equal(hash(data),picture.templateSha256);
  assert.deepEqual(JSON.parse(data),validateLevel(source));
  const decorator=catalog.decorators[id];
  assert.equal(hash(read(`game/${decorator.file}`)),decorator.sha256);
  assert.equal(hash(read('game/game.js')),catalog.engineSha256);
  assert.equal(hash(read(`game/${catalog.levelEngine}`)),catalog.levelEngineSha256);
  const manifest=JSON.parse(read('game-manifest.json'));
  assert.equal(manifest.id,'colorever-new');
  assert.equal(manifest.levels.find(p=>p.id===id)?.path,`game/patterns/${id}.json`);
  const sourceCatalog=JSON.parse(fs.readFileSync(new URL('../src/patterns/catalog.json',import.meta.url)));
  assert.equal(sourceCatalog.filter(p=>p.id===id).length,1);
  assert.ok(fs.readFileSync(new URL('../src/patterns/index.js',import.meta.url),'utf8').includes(`'${id}':{level:jhGoldRingLevel,decorate:jhGoldRing}`));
});
