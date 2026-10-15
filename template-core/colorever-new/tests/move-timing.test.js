import test from 'node:test';
import assert from 'node:assert/strict';
import {moveTiming,validatePreviewSpeed,PREVIEW_SPEEDS} from '../src/move-timing.js';

const totalTime=(timing,count)=>timing.stagger*(count-1)+timing.duration;

test('Production and default previews keep the original per-bead timing for every route',()=>{
  for(const [from,to,stagger,duration]of [['board','board',50,260],['board','tray',55,360],['tray','board',65,360]]) {
    const expected={stagger,duration,shiftDuration:210};
    assert.deepEqual(moveTiming(from,to),expected);
    assert.deepEqual(moveTiming(from,to,{globalMode:true}),expected);
    assert.deepEqual(moveTiming(from,to,{globalMode:true,speed:1}),expected);
  }
  assert.equal(totalTime(moveTiming('tray','board'),30),2245);
});

test('Explicit preview speed scales departure intervals and flights without compressing the batch',()=>{
  const baseline=totalTime(moveTiming('tray','board'),30);
  for(const speed of PREVIEW_SPEEDS) {
    const timing=moveTiming('tray','board',{speed});
    assert.ok(Math.abs(totalTime(timing,30)-baseline/speed)<.0001);
    assert.equal(timing.shiftDuration,210/speed);
    assert.equal(validatePreviewSpeed(String(speed)),speed);
  }
  assert.deepEqual(moveTiming('tray','board',{speed:0}),moveTiming('tray','board'));
  assert.deepEqual(moveTiming('tray','board',{speed:100}),moveTiming('tray','board'));
  for(const value of [0,-1,100,Infinity,'fast',null])assert.throws(()=>validatePreviewSpeed(value));
});
