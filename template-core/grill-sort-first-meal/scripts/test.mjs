import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createFirstMealEntry, createStageChime} from '../src/story.js';
import {observeDeliveries, ORIGINAL_SHA} from './build.mjs';
import {unpackGame} from '../../shared/standalone/build.mjs';

// Unit fixtures only: these do not stand in for official platform acceptance.
class Element {
  children = []; dataset = {}; attributes = {}; selectors = new Map(); clientWidth = 393; clientHeight = 600;
  style = {setProperty(key, value) {this[key] = value;}};
  listeners = new Map(); animationLog = [];
  addEventListener(type, listener) {this.listeners.set(type, listener);}
  removeEventListener(type, listener) {if(this.listeners.get(type)===listener)this.listeners.delete(type);}
  appendChild(node) {this.children.push(node); node.parent = this;}
  remove() {if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this);}
  setAttribute(key, value) {this.attributes[key] = value;}
  querySelector(key) {if (!this.selectors.has(key)) this.selectors.set(key, new Element()); return this.selectors.get(key);}
  querySelectorAll() {return ['hungry', 'hopeful', 'happy'].map(name => this.querySelector(name));}
  animate(frames, timing) {const animation={frames,timing,play(){this.paused=false;},pause(){this.paused=true;},cancel(){this.cancelled=true;}};this.animationLog.push(animation);return animation;}
}
globalThis.document = {createElement: () => new Element()};
globalThis.Image = class {set src(value) {queueMicrotask(() => this.onload?.());}};
const observers = [];
globalThis.ResizeObserver = class {constructor(fn) {this.fn=fn;observers.push(this);} observe(){} disconnect(){this.disconnected=true;}};
function fixture() {
  const instances = [], calls = [];
  const shell = Object.fromEntries(['step','win','fail','end','sound'].map(name => [name, (...args) => calls.push([name,...args])]));
  const entry = createFirstMealEntry(async(root, bridge, options) => {
    const native = {root, bridge, options, starts:0, pauses:0, resumes:0, destroyed:0,
      async start(){this.starts++;},pause(){this.pauses++;},resume(){this.resumes++;},setEnv(env){this.env=env;},destroy(){this.destroyed++;},
      end(){bridge.end();return true;},getState(){return {steps:0};},on(){return()=>{};},off(){}};
    instances.push(native);return native;
  }, 'data:image/jpeg;base64,unit-fixture', '');
  return {entry, instances, calls, shell};
}
test('story observes actual delivery without creating any steps; lifecycle gates callbacks', async () => {
  const f = fixture(), root = new Element(), game = await f.entry(root,f.shell,{}), native=f.instances[0];
  native.options.onMealServed({delivered:3});assert.equal(game.getState().meal.delivered,0);
  await Promise.all([game.start(),game.start()]);assert.equal(native.starts,1);
  native.bridge.step(0);native.options.onMealServed({delivered:3});
  assert.deepEqual(f.calls,[['step',0]]);assert.equal(game.getState().meal.progress,2.5);
  native.options.onMealServed({delivered:3});native.options.onMealServed({delivered:121});
  game.pause();native.options.onMealServed({delivered:6});native.bridge.step(5);
  assert.equal(game.getState().meal.delivered,3);assert.equal(f.calls.length,1);
  game.resume();native.options.onMealServed({delivered:6});native.bridge.win();native.bridge.fail();native.bridge.step(100);
  assert.equal(game.getState().meal.delivered,120);assert.deepEqual(f.calls,[['step',0],['win',undefined]]);
  game.destroy();game.destroy();assert.equal(native.destroyed,1);assert.equal(root.children.length,0);
  native.options.onMealServed({delivered:90});assert.equal(game.getState().meal.delivered,120);
});
test('instances, environment merges and cleanup remain independent', async () => {
  const f=fixture(), aRoot=new Element(),bRoot=new Element();
  const a=await f.entry(aRoot,f.shell,{env:{muted:true,viewport:{width:393,height:852,dpr:2},safeArea:{top:20},insets:{bottom:50}}});
  const b=await f.entry(bRoot,f.shell,{});await a.start();await b.start();
  f.instances[0].options.onMealServed({delivered:60});assert.equal(b.getState().meal.delivered,0);
  a.setEnv({viewport:{width:420},insets:{bottom:60},reducedMotion:true});
  assert.equal(f.instances[0].env.muted,true);assert.equal(f.instances[0].env.viewport.dpr,2);
  assert.equal(f.instances[0].env.insets.bottom,0,'insets already consumed by outer story');
  assert.equal(aRoot.children[0].style['--fm-top'],'20px');
  assert.equal(aRoot.children[0].style['--fm-bottom'],'60px');
  a.pause();a.destroy();assert.equal(f.instances[1].destroyed,0);
  f.instances[1].options.onMealServed({delivered:3});assert.equal(b.getState().meal.delivered,3);
  b.destroy();assert(observers.every(observer=>observer.disconnected));
});
test('artwork load failure disposes a successfully loaded base', async () => {
  globalThis.Image=class {set src(value){queueMicrotask(()=>this.onerror?.());}};
  const f=fixture(),root=new Element();
  await assert.rejects(f.entry(root,f.shell,{}),/artwork failed/);
  assert.equal(f.instances[0].destroyed,1);assert.equal(root.children.length,0);
  globalThis.Image=class {set src(value){queueMicrotask(()=>this.onload?.());}};
});
test('story crosses exactly at 10% and 30%; delivery feedback cannot cancel stage feedback', async () => {
  const f=fixture(),root=new Element(),game=await f.entry(root,f.shell,{}),wrapper=root.children[0];
  const serve=delivered=>f.instances[0].options.onMealServed({delivered});
  const badge=wrapper.querySelector('.fm-line');
  assert.equal(wrapper.dataset.mood,'hungry');assert.equal(badge.animationLog.length,0);
  await game.start();
  for(const n of [3,6,9]) serve(n);
  assert.equal(wrapper.dataset.mood,'hungry');assert.equal(badge.animationLog.length,0);
  serve(12);assert.equal(wrapper.dataset.mood,'hopeful');assert.equal(badge.animationLog.length,1);
  const first=badge.animationLog[0];serve(12);serve(15);
  assert.equal(first.cancelled,undefined);assert.equal(badge.animationLog.length,1);
  game.pause();assert.equal(first.paused,true);serve(36);assert.equal(wrapper.dataset.mood,'hopeful');
  game.resume();assert.equal(first.paused,false);
  serve(33);assert.equal(wrapper.dataset.mood,'hopeful');serve(36);
  assert.equal(wrapper.dataset.mood,'happy');assert.equal(badge.animationLog.length,2);
  serve(39);serve(60);assert.equal(badge.animationLog.length,2);assert.deepEqual(f.calls,[]);
  game.setEnv({reducedMotion:true});assert(badge.animationLog.every(a=>a.cancelled));
  game.destroy();assert.equal(wrapper.listeners.size,0);
});

function mockAudio() {
  const contexts=[];
  const param=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  class Audio {
    state='suspended';currentTime=0;destination={};oscillators=[];gains=[];
    constructor(){contexts.push(this);}
    resume(){this.state='running';return Promise.resolve();}
    suspend(){this.state='suspended';return Promise.resolve();}
    close(){this.state='closed';return Promise.resolve();}
    createOscillator(){const node={frequency:param(),connect(){},disconnect(){this.disconnected=true;},start(at){this.startedAt=at;},stop(at){if(at===undefined)this.stopped=true;}};this.oscillators.push(node);return node;}
    createGain(){const node={gain:param(),connect(){},disconnect(){this.disconnected=true;}};this.gains.push(node);return node;}
  }
  globalThis.AudioContext=Audio;return {contexts,Audio};
}
test('chime is gesture gated, plays once per threshold and stops on mute/pause/result/destroy', async () => {
  const {contexts}=mockAudio();
  try {
    const f=fixture(),root=new Element(),game=await f.entry(root,f.shell,{}),wrapper=root.children[0];
    const gesture=()=>wrapper.listeners.get('pointerdown')();
    const serve=delivered=>f.instances[0].options.onMealServed({delivered});
    gesture();assert.equal(contexts.length,0);await game.start();gesture();await Promise.resolve();
    serve(9);assert.equal(contexts[0].oscillators.length,0);
    serve(12);assert.equal(contexts[0].oscillators.length,3);serve(15);assert.equal(contexts[0].oscillators.length,3);
    game.setMuted(true);assert(contexts[0].oscillators.every(n=>n.stopped&&n.disconnected));
    gesture();assert.equal(contexts[0].state,'suspended');
    game.setMuted(false);gesture();await Promise.resolve();serve(36);assert.equal(contexts[0].oscillators.length,7);
    game.pause();assert(contexts[0].oscillators.every(n=>n.stopped));
    game.resume();gesture();await Promise.resolve();serve(39);assert.equal(contexts[0].oscillators.length,7,'resume never replays an old stage');
    f.instances[0].bridge.fail();assert.equal(contexts[0].state,'suspended');
    game.destroy();assert.equal(contexts[0].state,'closed');assert.equal(f.calls.filter(c=>c[0]==='sound').length,0);
  } finally {delete globalThis.AudioContext;}
});
test('late audio resume and separate instances cannot leak sound after disposal', async () => {
  const {contexts}=mockAudio();
  try {
    let allowed=true,resolve;
    const a=createStageChime(()=>allowed),b=createStageChime(()=>true);
    a.unlock();b.unlock();await Promise.resolve();
    contexts[0].state='suspended';contexts[0].resume=()=>new Promise(done=>{resolve=()=>{contexts[0].state='running';done();};});
    a.unlock();allowed=false;a.stop();resolve();await Promise.resolve();
    a.play('hopeful');assert.equal(contexts[0].oscillators.length,0);assert.equal(contexts[0].state,'suspended');
    b.play('happy');assert.equal(contexts[1].oscillators.length,4);
    a.destroy();assert.equal(contexts[1].state,'running');
    b.destroy();assert(contexts[1].oscillators.every(n=>n.stopped&&n.disconnected));
  } finally {delete globalThis.AudioContext;}
});
test('base is byte-exact; adapter observation preserves frozen code and gameplay configuration', () => {
  const base=fs.readFileSync(new URL('../game.base.js',import.meta.url));
  assert.equal(createHash('sha256').update(base).digest('hex'),ORIGINAL_SHA);
  const {source}=unpackGame(base.toString()), modified=observeDeliveries(source);
  const registry=text=>JSON.parse(text.match(/^const SOURCE=(.+);$/m)[1]);
  const before=registry(source),after=registry(modified);
  assert.deepEqual(after.resources,before.resources);assert.deepEqual(after.settings,before.settings);
  assert.equal(after.markup,before.markup);assert.equal(after.css,before.css);
  assert.equal((after.code.match(/emit\('origin:meal-served'/g)||[]).length,1);
  assert.equal((after.code.match(/emit\('origin:origin-step'/g)||[]).length,1);
  assert.match(after.code,/if \(this\._doneNum > before\)/);
  assert.match(modified,/options\.onMealServed\?\.\(detail\)/);
  assert.throws(()=>observeDeliveries(modified),/seam changed/);
});
