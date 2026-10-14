import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareLevel,validateLevel} from '../src/level.js';
import {Puzzle} from '../src/model.js';
import {decorate} from '../src/patterns/round-flame.js';

const source=JSON.parse(fs.readFileSync(new URL('../src/patterns/round-flame.json',import.meta.url)));

test('The reference flame and ivory circle use six continuous playable color regions',()=>{
  assert.equal(source.width,29);
  assert.equal(source.height,29);
  assert.equal(Object.keys(source.colors).length,6);
  assert.equal(source.opening,null);
  assert.equal(source.decoration,'none');
  const puzzle=new Puzzle({width:source.width,height:source.height,target:source.target,openingBoard:source.target});
  assert.equal(puzzle.total,633);
  assert.equal(source.target.filter(c=>c>1).length,271);
  assert.equal(puzzle.connected(source.target.findIndex(Boolean),i=>source.target[i]>0).length,puzzle.total);
  assert.equal(puzzle.connected(source.target.findIndex(c=>c>1),i=>source.target[i]>1).length,271);
  for(const color of Object.keys(source.colors).map(Number)){
    const indices=source.target.flatMap((c,i)=>c===color?[i]:[]);
    assert.ok(indices.length>=12,'each color must form a substantial block');
    assert.equal(puzzle.connected(indices[0],i=>source.target[i]===color).length,indices.length,'no isolated decorative beads');
  }
  for(let y=0;y<29;y++)for(let x=0;x<29;x++){
    assert.equal(Boolean(source.target[y*29+x]),Boolean(source.target[y*29+28-x]));
    assert.equal(Boolean(source.target[y*29+x]),Boolean(source.target[(28-y)*29+x]));
  }
  decorate({scene:{add(){assert.fail('all major structures must be playable beads');}}});
});

test('Round flame openings conserve all beads and solve in all three modes',()=>{
  for(const openingMode of ['easy','medium','scattered'])for(const seed of [0,1,7,173,source.seed]){
    const {level,proof}=prepareLevel({...source,openingMode,seed});
    assert.deepEqual(level,prepareLevel({...source,openingMode,seed}).level);
    assert.deepEqual([...level.opening].sort((a,b)=>a-b),[...level.target].sort((a,b)=>a-b));
    assert.ok(level.opening.every((color,i)=>(color===0)===(level.target[i]===0)));
    assert.ok(proof.moves>0);
    if(openingMode==='easy')assert.ok(proof.moves<=6);
    if(openingMode==='medium')assert.ok(proof.moves>=12&&proof.moves<=14);
    const puzzle=new Puzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening});
    const counts=[...puzzle.board,...puzzle.tray].sort((a,b)=>a-b);
    for(const move of proof.solution){
      assert.ok(move.action==='pick'?puzzle.pick(move.region,move.index):puzzle.place(move.region,move.index));
      assert.deepEqual([...puzzle.board,...puzzle.tray].sort((a,b)=>a-b),counts);
    }
    assert.ok(puzzle.complete);
    assert.equal(puzzle.tray.filter(Boolean).length,0);
    assert.ok(puzzle.undo());
    assert.ok(!puzzle.complete);
    puzzle.reset();
    assert.deepEqual(puzzle.board,level.opening);
  }
});

test('The default opening preserves the circle, tip, red outline and pale yellow core',()=>{
  const {level,proof}=prepareLevel(source);
  level.target.forEach((color,i)=>{
    if([1,2,6].includes(color)||(color>1&&Math.floor(i/29)<14))assert.equal(level.opening[i],color);
  });
  assert.equal(proof.moves,5);
});

test('The new template registers and packages the exact validated round flame',()=>{
  const root=new URL('../../../editor/templates/colorever-new/',import.meta.url);
  const catalog=JSON.parse(fs.readFileSync(new URL('game/patterns/catalog.json',root)));
  const manifest=JSON.parse(fs.readFileSync(new URL('game-manifest.json',root)));
  const picture=catalog.patterns.find(p=>p.id==='round-flame');
  const packed=fs.readFileSync(new URL('game/patterns/'+picture.level,root));
  assert.deepEqual(JSON.parse(packed),validateLevel(source));
  const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash(packed),picture.templateSha256);
  const decorator=catalog.decorators['round-flame'];
  assert.equal(hash(fs.readFileSync(new URL('game/'+decorator.file,root))),decorator.sha256);
  assert.equal(hash(fs.readFileSync(new URL('game/game.js',root))),catalog.engineSha256);
  assert.equal(hash(fs.readFileSync(new URL('game/'+catalog.levelEngine,root))),catalog.levelEngineSha256);
  assert.equal(manifest.id,'colorever-new');
  assert.ok(manifest.levels.some(p=>p.id===picture.id&&p.path==='game/patterns/round-flame.json'));
});
