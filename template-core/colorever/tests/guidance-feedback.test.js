import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Puzzle} from '../src/model.js';
import {GameTutorial,hintInstruction} from '../src/game-tutorial.js';
import {GameHaptics} from '../src/game-haptics.js';

test('Automatic tutorial follows legal exchanges for every pattern and stops after first board placement',()=>{
 for(const id of ['cat','house','axe','torch']){
  const level=JSON.parse(fs.readFileSync(new URL(`../src/patterns/${id}.json`,import.meta.url)));
  const puzzle=new Puzzle({...level,openingBoard:level.opening}),tutorial=new GameTutorial();
  const before=puzzle.snapshot();assert.ok(tutorial.hint(puzzle));assert.deepEqual(puzzle.snapshot(),before);
  assert.equal(tutorial.hint(puzzle,true),null);
  let stored=false,placed=false;
  for(let step=0;step<20&&tutorial.active;step++){
   const hint=tutorial.hint(puzzle);assert.ok(hint);assert.ok(hintInstruction(hint).includes('手指'));
   if(hint.action==='pick')assert.ok(puzzle.pick(hint.region,hint.index));
   else{assert.ok(puzzle.place(hint.region,hint.index));tutorial.placed(hint.region);if(hint.region==='tray')stored=true;else placed=true;}
  }
  assert.ok(stored&&placed);assert.equal(tutorial.active,false);assert.equal(tutorial.hint(puzzle),null);
  puzzle.reset();tutorial.reset();assert.ok(tutorial.hint(puzzle));
  const solved=new Puzzle({...level,openingBoard:level.target});assert.equal(tutorial.hint(solved),null);
 }
});

test('Persistent tutorial (two-playable first level) keeps guiding past the first board placement',()=>{
 const level=JSON.parse(fs.readFileSync(new URL('../src/patterns/cat.json',import.meta.url)));
 const puzzle=new Puzzle({...level,openingBoard:level.opening}),tutorial=new GameTutorial();
 assert.equal(tutorial.persistent,false,'默认常规引导:首次归位即关闭');
 tutorial.persistent=true;
 let placements=0;
 for(let step=0;step<40&&placements<3;step++){
  const hint=tutorial.hint(puzzle);assert.ok(hint,'持久引导始终给出下一步合法动作');
  if(hint.action==='pick')assert.ok(puzzle.pick(hint.region,hint.index));
  else{assert.ok(puzzle.place(hint.region,hint.index));tutorial.placed(hint.region);if(hint.region==='board')placements++;}
 }
 assert.ok(placements>=3);assert.equal(tutorial.active,true,'多次归位后引导仍常驻');
 tutorial.persistent=false;tutorial.reset();
 const hint=tutorial.hint(puzzle);assert.ok(hint);
 if(hint.action==='pick')assert.ok(puzzle.pick(hint.region,hint.index));
 else{assert.ok(puzzle.place(hint.region,hint.index));tutorial.placed(hint.region);}
 for(let step=0;step<20&&tutorial.active;step++){
  const next=tutorial.hint(puzzle);assert.ok(next);
  if(next.action==='pick')assert.ok(puzzle.pick(next.region,next.index));
  else{assert.ok(puzzle.place(next.region,next.index));tutorial.placed(next.region);}
 }
 assert.equal(tutorial.active,false,'关闭持久态后恢复首次归位即关闭的常规行为');
});

test('Haptics match gemsort styles, throttle bead bursts and preserve the success beat',()=>{
 let now=0;const received=[],host={novvy:{haptic:style=>received.push(style)}};
 const haptics=new GameHaptics({host,now:()=>now});
 for(const clip of ['pickup','store','store-move','place-single','place','success']){haptics.play(clip);now+=50;}
 assert.deepEqual(received,['light','selection','selection','selection','medium','success']);
 haptics.play('bgm');assert.equal(received.length,6);
 now+=50;haptics.play('store');now+=10;haptics.play('place-single');assert.equal(received.length,7);
 haptics.play('success');assert.equal(received.at(-1),'success');assert.equal(received.length,8);
 host.document={hidden:true};now+=100;haptics.play('pickup');assert.equal(received.length,8);
});

test('Haptics detect late SDK injection, survive bridge errors and fall back to browser vibration',()=>{
 let now=0;const host={},haptics=new GameHaptics({host,now:()=>now}),received=[];
 assert.doesNotThrow(()=>haptics.play('pickup'));
 host.novvy={haptic:style=>received.push(style)};haptics.play('pickup');assert.deepEqual(received,['light']);
 now+=50;host.novvy.haptic=()=>{throw new Error('bridge unavailable');};assert.doesNotThrow(()=>haptics.play('store'));
 delete host.novvy;host.navigator={vibrate:pattern=>received.push(pattern)};
 now+=50;haptics.play('place');now+=50;haptics.play('success');assert.deepEqual(received,['light',20,[25,50,35]]);
});
