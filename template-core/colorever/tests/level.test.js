import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareLevel,validateLevel,solveLevel} from '../src/level.js';
import {Puzzle} from '../src/model.js';
const sample=()=>({name:'Custom',width:8,height:6,colors:{10:'#123456',20:'#fedcba',30:'#ff0055'},target:Array.from({length:48},(_,i)=>i<8?0:i%3===0?10:i%3===1?20:30),capacity:12,trayCols:4,difficulty:10,seed:7,decoration:'none'});
test('Default cat retains its original opening and a replayable solution',()=>{
 const data=JSON.parse(fs.readFileSync(new URL('../src/patterns/cat.json',import.meta.url)));const {level,proof}=prepareLevel(data);assert.deepEqual(level.opening,data.opening);assert.ok(proof.moves>0);
});
test('Different geometry and arbitrary color IDs generate conserved reproducible solvable openings',()=>{
 for(let seed=0;seed<20;seed++){
  const {level,proof}=prepareLevel({...sample(),seed});assert.deepEqual(level,prepareLevel({...sample(),seed}).level);
  assert.deepEqual([...level.target].sort((a,b)=>a-b),[...level.opening].sort((a,b)=>a-b));
  const p=new Puzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening});
  for(const move of proof.solution)assert.ok(move.action==='pick'?p.pick(move.region,move.index):p.place(move.region,move.index));
  assert.ok(p.complete);assert.ok(p.undo());assert.ok(!p.complete);p.reset();assert.deepEqual(p.board,level.opening);
 }
});
test('Bad matrices, unknown colors, broken counts are rejected',()=>{
 assert.throws(()=>validateLevel({...sample(),width:50}));
 assert.throws(()=>validateLevel({...sample(),target:Array(48).fill(99)}));
 assert.throws(()=>prepareLevel({...sample(),opening:Array(48).fill(10)}));

 assert.throws(()=>prepareLevel({...sample(),capacity:96,trayCols:4}));
});
test('Explicit authored opening is verified, reset uses it and a solved opening is valid',()=>{
 const source=sample();const {level}=prepareLevel({...source,opening:[...source.target]});assert.equal(solveLevel(level).moves,0);
});

test('Picture-specific transforms survive normalization and reject invalid ranges',()=>{
 const decorations={'eye-left':{offsetX:.4,offsetY:-.2,scale:1.15}};
 assert.deepEqual(validateLevel({...sample(),decorations}).decorations,decorations);
 assert.throws(()=>validateLevel({...sample(),decorations:{bow:{offsetX:Infinity}}}));
 assert.throws(()=>validateLevel({...sample(),decorations:{bow:{scale:0}}}));
});

test('Easy mode has four connected patches and completes in five or six placements across seeds',()=>{
 for(const id of ['cat','house','axe','torch','contract','bank','phoenix','tree','backpack','rafflesia','portrait','portrait-frown','yellow-code','phoenix-feather','portrait-woman','bearing','gear','cottage','diamond','keble-quarterback-1','keble-quarterback-2','rebirth-phoenix','runway-gown','gemstone-phoenix']){
  const source=JSON.parse(fs.readFileSync(new URL(`../src/patterns/${id}.json`,import.meta.url)));
  for(let seed=0;seed<30;seed++){
   const input={...source,opening:null,openingMode:'easy',seed};
   const {level,proof}=prepareLevel(input);assert.deepEqual(level,prepareLevel(input).level);
   assert.ok(proof.moves>=5&&proof.moves<=6);
   assert.deepEqual([...level.target].sort((a,b)=>a-b),[...level.opening].sort((a,b)=>a-b));
   const p=new Puzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening});
   const wrong=new Set(level.target.flatMap((c,i)=>c!==level.opening[i]?[i]:[])),groups=[];
   while(wrong.size){const i=wrong.values().next().value;const group=p.connected(i,n=>wrong.has(n)&&level.opening[n]===level.opening[i]);groups.push(group);group.forEach(n=>wrong.delete(n));}
   assert.equal(groups.length,4);assert.ok(groups.every(g=>g.length>=7));
   for(const move of proof.solution)assert.ok(move.action==='pick'?p.pick(move.region,move.index):p.place(move.region,move.index));
   assert.ok(p.complete);assert.equal(p.moves,proof.moves);
  }
 }
});
test('Scattered mode remains the default, easy mode rejects unsupported pictures and impossible budgets',()=>{
 assert.equal(prepareLevel(sample()).level.openingMode,'scattered');
 assert.throws(()=>validateLevel({...sample(),openingMode:'unknown'}));
 const width=8,height=8,target=Array.from({length:64},(_,i)=>(i%width+Math.floor(i/width))%2+1);
 const checker={width,height,target,colors:{1:'#000000',2:'#ffffff'},capacity:12,trayCols:4,difficulty:12,seed:1,openingMode:'easy'};
 assert.throws(()=>prepareLevel(checker),/连续区域/);
 const fragmented=prepareLevel({...sample(),difficulty:15}).level;
 assert.throws(()=>prepareLevel({...fragmented,openingMode:'easy'}),/6 次搬运/);
});

test('Medium openings use ten connected small patches with conserved, reproducible solutions',()=>{
 for(const id of ['cat','chick','phoenix','house','axe','torch','contract','bank','tree','backpack','rafflesia','portrait','portrait-frown','yellow-code','phoenix-feather','portrait-woman','bearing','gear','cottage','diamond','keble-quarterback-1','keble-quarterback-2','rebirth-phoenix','runway-gown','gemstone-phoenix']){
  const source=JSON.parse(fs.readFileSync(new URL(`../src/patterns/${id}.json`,import.meta.url)));
  for(let seed=0;seed<30;seed++){
   const input={...source,opening:null,openingMode:'medium',seed};
   const {level,proof}=prepareLevel(input);
   assert.deepEqual(level,prepareLevel(input).level);
   assert.ok(proof.moves>=12&&proof.moves<=14);
   assert.deepEqual([...level.target].sort((a,b)=>a-b),[...level.opening].sort((a,b)=>a-b));
   const p=new Puzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening});
   const wrong=new Set(level.target.flatMap((c,i)=>c!==level.opening[i]?[i]:[])),groups=[];
   while(wrong.size){const i=wrong.values().next().value,group=p.connected(i,n=>wrong.has(n)&&level.opening[n]===level.opening[i]);groups.push(group);group.forEach(n=>wrong.delete(n));}
   assert.equal(groups.length,10);assert.ok(groups.every(g=>g.length>=3&&g.length<=5));
   for(const move of proof.solution)assert.ok(move.action==='pick'?p.pick(move.region,move.index):p.place(move.region,move.index));
   assert.ok(p.complete);
  }
 }
});
