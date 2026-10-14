import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveTouchTarget} from '../src/touch-target.js';
const puzzle=()=>({board:[1,2,1,0],target:[1,1,2,2],tray:[0,1],selection:null});
const cells=[0,1,2,3].map(index=>({region:'board',index,x:10+index*9,y:20}));
test('Near misses and already homed neighbors select the nearest movable bead',()=>{
 const p=puzzle();
 assert.deepEqual(resolveTouchTarget(p,{region:'board',index:0},cells,12,20),{region:'board',index:1});
 assert.deepEqual(resolveTouchTarget(p,null,cells,19,32),{region:'board',index:1});
 assert.equal(resolveTouchTarget(p,null,cells,19,50),null);
 assert.equal(p.selection,null);
});
test('Precise actionable hits take priority over enlarged neighboring targets',()=>{
 const direct={region:'board',index:2};
 assert.deepEqual(resolveTouchTarget(puzzle(),direct,cells,19,20),direct);
});
test('Selected beads can be cancelled and empty matching destinations can be placed',()=>{
 const p=puzzle();p.selection={region:'board',indices:[1],color:2};
 assert.deepEqual(resolveTouchTarget(p,null,cells,41,20),{region:'board',index:3});
 assert.deepEqual(resolveTouchTarget(p,{region:'board',index:1},cells,19,20),{region:'board',index:1});
 assert.deepEqual(resolveTouchTarget(p,null,[{region:'tray',index:0,x:20,y:40}],22,42),{region:'tray',index:0});
});
