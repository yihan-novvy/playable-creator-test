import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateLevel, getMove, pour, isWon } from './game.js';
const level=JSON.parse(readFileSync(new URL('./level.json',import.meta.url)));
test('pour transfers contiguous top colors, respects space, and preserves original',()=>{
 const state=[['a','b','b'],['b'],['a']];
 assert.deepEqual(pour(state,0,1,3),[['a'],['b','b','b'],['a']]);
 assert.equal(getMove(state,0,2,3),null);
 assert.deepEqual(state,[['a','b','b'],['b'],['a']]);
 assert.equal(getMove(state,0,0,3),null);
 assert.equal(getMove([['a'],['a','a','a']],0,1,3),null);
 assert.equal(getMove([[],[]],0,1,3),null);
 assert.deepEqual(pour([['a','a'],['a','a']],0,1,3),[['a'],['a','a','a']]);
});
test('invalid config rejected and partial uniform bottles do not win',()=>{
 assert.throws(()=>validateLevel({...level,capacity:0}));
 assert.throws(()=>validateLevel({...level,bottles:[['unknown'],[]]}));
 assert.throws(()=>validateLevel({...level,colors:{coral:'red'}}));
 assert.equal(isWon([['a'],[]],4),false);
});
test('default level is solvable under actual game rules',()=>{
 validateLevel(level);
 const queue=[{state:level.bottles,path:[]}], seen=new Set();
 for(let cursor=0;cursor<queue.length;cursor++){
  const {state,path}=queue[cursor];
  if(isWon(state,level.capacity)){console.log('Solution:',JSON.stringify(path));return;}
  for(let a=0;a<state.length;a++)for(let b=0;b<state.length;b++){
   const next=pour(state,a,b,level.capacity);if(!next)continue;
   const key=next.map(x=>x.join(',')).sort().join('|');
   if(!seen.has(key)){seen.add(key);queue.push({state:next,path:[...path,[a,b]]});}
  }
 }
 assert.fail('Default level is not solvable');
});
