import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareGlobalLevel,globalPreviewOptions} from '../src/global-opening.js';
import {GlobalPuzzle} from '../src/global-puzzle.js';

const pattern=id=>JSON.parse(fs.readFileSync(new URL(`../src/patterns/${id}.json`,import.meta.url)));
const counts=values=>[...values].filter(Boolean).sort((a,b)=>a-b);
const puzzleFor=(level,batchSize=30)=>new GlobalPuzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening,batchSize});
function assertConnected(puzzle,indices) {
  assert.ok(indices.length);
  const remaining=new Set(indices),queue=[indices[0]];remaining.delete(indices[0]);
  for(let q=0;q<queue.length;q++)for(const n of puzzle.neighbors(queue[q]))if(remaining.delete(n))queue.push(n);
  assert.equal(remaining.size,0,'one action must stay within a connected region');
}

test('Global previews cover the silhouette and replay connected transfers with conserved colors',()=>{
  for(const id of ['cat','house','golden-key','blue-diamond-ring','ice-wolf-head','medical-kit','golden-madonna']) {
    for(const seed of [1,7,31]) {
      const source=pattern(id),before=JSON.stringify(source);
      const {level,proof}=prepareGlobalLevel({...source,seed});
      assert.equal(JSON.stringify(source),before,'preview does not modify authored data');
      assert.ok(proof.metrics.wrongPercent>=95,id);
      if(id==='cat')assert.ok(proof.metrics.averageBatch>=12,'large uniform pictures retain large transfers');
      assert.deepEqual(counts(level.opening),counts(level.target));
      level.target.forEach((c,i)=>assert.equal(level.opening[i]===0,c===0));
      const puzzle=puzzleFor(level),initial=counts(level.target);
      for(const hint of proof.solution) {
        if(hint.action==='pick') {
          assert.ok(puzzle.pick(hint.region,hint.index));
          assert.ok(puzzle.selection.indices.length<=30);
          if(hint.region==='board')assertConnected(puzzle,puzzle.selection.indices);
        } else {
          const moved=puzzle.place(hint.region,hint.index);
          assert.ok(moved);
          assert.ok(moved.filter(m=>!m.shift).length<=30);
          if(hint.region==='board')assertConnected(puzzle,moved.filter(m=>!m.shift).map(m=>m.to));
          if(puzzle.selection?.region==='board')assertConnected(puzzle,puzzle.selection.indices);
        }
        assert.deepEqual(counts([...puzzle.board,...puzzle.tray]),initial);
        assert.ok(puzzle.tray.filter(Boolean).length<=puzzle.capacity);
      }
      assert.ok(puzzle.complete,id);assert.equal(puzzle.moves,proof.moves);
      assert.ok(puzzle.tray.every(c=>c===0));
      assert.ok(puzzle.undo());assert.ok(!puzzle.complete);
      puzzle.reset();assert.deepEqual(puzzle.board,level.opening);assert.equal(puzzle.moves,0);
    }
  }
});

test('Seed and tuning controls are deterministic and change the prepared opening or batch limit',()=>{
  const source=pattern('cat'),options={coverage:80,batchSize:18};
  const first=prepareGlobalLevel({...source,seed:13},options);
  assert.deepEqual(prepareGlobalLevel({...source,seed:13},options),first);
  assert.notDeepEqual(prepareGlobalLevel({...source,seed:14},options).level.opening,first.level.opening);
  assert.ok(first.proof.metrics.wrongPercent>=80&&first.proof.metrics.wrongPercent<81);
  assert.equal(first.proof.metrics.batchSize,18);
  assert.ok(first.proof.metrics.averageBatch<=18);
  assert.throws(()=>globalPreviewOptions({coverage:79}));
  assert.throws(()=>globalPreviewOptions({batchSize:0}));
  assert.throws(()=>globalPreviewOptions({batchSize:30.5}));
});

test('Dominant colors respect the maximum possible mismatch rather than losing beads',()=>{
  const source={width:10,height:10,target:[...Array(92).fill(1),...Array(8).fill(2)],colors:{1:'#112233',2:'#fedcba'},capacity:12,trayCols:4,seed:1};
  const {level,proof}=prepareGlobalLevel(source);
  assert.equal(proof.metrics.wrongBeads,16);
  assert.equal(proof.metrics.maximumWrongPercent,16);
  assert.deepEqual(counts(level.target),counts(level.opening));
});

test('Disconnected same-color islands need separate picks and separate destination clicks',()=>{
  const target=Array(32).fill(0);
  for(const i of [0,1,6,7])target[i]=1;
  for(const i of [24,25,30,31])target[i]=2;
  const puzzle=puzzleFor({width:8,height:4,target,opening:target.map(c=>c?3-c:0),capacity:12,trayCols:4});
  assert.equal(puzzle.pick('board',-1),false);
  assert.ok(puzzle.pick('board',0));assert.deepEqual(puzzle.selection.indices,[0,1]);
  assert.equal(puzzle.place('board',1),null);
  assert.equal(puzzle.place('tray',0).filter(m=>!m.shift).length,2);
  assert.ok(puzzle.pick('board',6));assert.deepEqual(puzzle.selection.indices,[6,7]);
  puzzle.place('tray',2);
  puzzle.pick('board',24);puzzle.place('tray',4);
  puzzle.pick('board',30);puzzle.place('tray',6);
  assert.ok(puzzle.pick('tray',0));
  assert.equal(puzzle.selection.indices.length,4);
  assert.equal(puzzle.place('board',24).filter(m=>!m.shift).length,2);
  assert.equal(puzzle.board[30],0);assert.equal(puzzle.board[31],0);
  assert.equal(puzzle.selection.indices.length,2);
  puzzle.place('board',30);
  puzzle.pick('tray',0);puzzle.place('board',0);puzzle.place('board',6);
  assert.ok(puzzle.complete);
});

test('Diagonal neighbors still connect, while removing a bridge deselects the disconnected remainder',()=>{
  const target=Array(32).fill(1),opening=[...target];
  for(const i of [0,9,18,27])opening[i]=2;
  const diagonal=puzzleFor({width:8,height:4,target,opening,capacity:12,trayCols:4});
  diagonal.pick('board',0);assert.deepEqual(diagonal.selection.indices,[0,9,18,27]);

  const bridge=puzzleFor({width:8,height:4,target,opening:[...target],capacity:4,trayCols:4});
  for(const i of [8,9,10])bridge.board[i]=2;
  bridge.tray=[1,1,1,0];
  bridge.pick('board',9);assert.deepEqual(bridge.selection.indices,[9,8,10]);
  bridge.place('tray',3);
  assert.deepEqual(bridge.selection.indices,[8]);
  assert.equal(bridge.board[10],2);
});
