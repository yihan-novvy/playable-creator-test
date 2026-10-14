import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareLevel} from '../src/level.js';
import {Puzzle} from '../src/model.js';
import {decorate} from '../src/patterns/golden-madonna.js';

const source=JSON.parse(fs.readFileSync(new URL('../src/patterns/golden-madonna.json',import.meta.url)));
const beforeFourPetals=JSON.parse(fs.readFileSync(new URL('../docs/golden-madonna-before-four-petals.json',import.meta.url)));

test('The four-petal flower preserves the accepted frame, loop, palette and every playable slot',()=>{
  assert.equal(source.width,beforeFourPetals.width);
  assert.equal(source.height,beforeFourPetals.height);
  assert.deepEqual(source.colors,beforeFourPetals.colors);
  assert.deepEqual(source.target.map(Boolean),beforeFourPetals.target.map(Boolean));
  source.target.forEach((color,index)=>{
    const row=Math.floor(index/source.width),col=index%source.width;
    const radius=((col-17.5)/16.5)**2+((row-21.5)/16.5)**2;
    if(radius>.65||row<9||row>33)assert.equal(color,beforeFourPetals.target[index]);
  });
});

test('The four-petal flower is centered and symmetric inside the oval frame',()=>{
  source.target.forEach((color,index)=>{
    const row=Math.floor(index/source.width),col=index%source.width;
    const radius=((col-17.5)/16.5)**2+((row-21.5)/16.5)**2;
    if(radius<=.65){
      assert.equal(color,source.target[row*source.width+source.width-1-col]);
      assert.equal(color,source.target[(43-row)*source.width+col]);
    }
  });
  for(const [x,y] of [[17,15],[11,21],[24,21],[17,28]])assert.equal(source.target[y*source.width+x],6,'each rounded petal has a clear pale-gold face');
  for(const [x,y] of [[10,14],[25,14],[10,29],[25,29]])assert.equal(source.target[y*source.width+x],3,'the four petals remain separated by recessed field');
});

test('The four-petal medallion has a connected playable silhouette and no overlay geometry',()=>{
  assert.ok(source.width>=24&&source.width<=40&&source.height>=24&&source.height<=40);
  assert.equal(Object.keys(source.colors).length,7);
  assert.equal(source.opening,null);
  assert.equal(source.decoration,'none');
  assert.deepEqual(new Set(source.target.filter(Boolean)),new Set(Object.keys(source.colors).map(Number)));
  const puzzle=new Puzzle({width:source.width,height:source.height,target:source.target,openingBoard:source.target});
  const start=source.target.findIndex(Boolean);
  assert.equal(puzzle.connected(start,i=>source.target[i]!==0).length,puzzle.total);
  assert.ok(puzzle.total<source.width*source.height*.75,'the complete medallion needs space around its outer contour');
  decorate({scene:{add(){assert.fail('the main structures must remain playable');}}});
});

test('The four-petal medallion conserves its silhouette and every color and solves in all opening modes',()=>{
  for(const openingMode of ['easy','medium','scattered'])for(const seed of [0,7,173,source.seed]){
    const {level,proof}=prepareLevel({...source,openingMode,seed});
    assert.deepEqual(level,prepareLevel({...source,openingMode,seed}).level);
    assert.deepEqual([...level.opening].sort((a,b)=>a-b),[...level.target].sort((a,b)=>a-b));
    assert.ok(level.opening.every((color,index)=>(color===0)===(level.target[index]===0)));
    assert.ok(proof.moves>0);
    if(openingMode==='easy')assert.ok(proof.moves<=6);
    if(openingMode==='medium')assert.ok(proof.moves>=12&&proof.moves<=14);
    const puzzle=new Puzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening});
    const initialCounts=[...puzzle.board,...puzzle.tray].sort((a,b)=>a-b);
    for(const move of proof.solution){
      assert.ok(move.action==='pick'?puzzle.pick(move.region,move.index):puzzle.place(move.region,move.index));
      assert.deepEqual([...puzzle.board,...puzzle.tray].sort((a,b)=>a-b),initialCounts);
    }
    assert.ok(puzzle.complete);
    assert.equal(puzzle.tray.filter(Boolean).length,0);
    assert.ok(puzzle.undo());
    assert.ok(!puzzle.complete);
    puzzle.reset();
    assert.deepEqual(puzzle.board,level.opening);
  }
});

test('The default medallion demo keeps the entire flower inset intact before play',()=>{
  const {level,proof}=prepareLevel(source);
  level.target.forEach((color,index)=>{
    const row=Math.floor(index/level.width),col=index%level.width;
    const radius=((col-17.5)/16.5)**2+((row-21.5)/16.5)**2;
    if(radius<=.59)assert.equal(level.opening[index],color);
  });
  assert.ok(proof.moves>0&&proof.moves<=6);
});
