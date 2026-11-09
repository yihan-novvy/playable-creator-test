import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {getEntry} from '../core/registry.mjs';
import {runStep} from '../core/runner.mjs';
import {configureOriginGame} from '../core/lib/standalone-origin.mjs';

export default async function test(a) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'origin-standalone-'));
  try {
    for (const id of ['tasty-travels','freecell','grill-sort','block-out']) {
      const entry = getEntry(id + '-origin');
      const game = fs.readFileSync(path.join(entry.templateDir, entry.template.game.standalone), 'utf8');
      let registrations = 0;
      vm.runInNewContext(game, {NovvyGame(fn) { registrations++; a.check(typeof fn === 'function', id + ' registers an entry'); }});
      a.equal(registrations, 1, id + ' registers synchronously without touching DOM');
      const source = JSON.parse(game.match(/const SOURCE=(.*);\nconst GAME_CONFIG=/)[1]);
      new vm.Script(source.code); if (source.prelude) new vm.Script(source.prelude);
      a.check(!/postMessage|NovvyPlayable|NovvyAnalytics|__novvy|webkit\.messageHandlers|window\.open\(/.test(game), id + ' contains no legacy transport');
      const configured = configureOriginGame(game, {allowReplay:true, countdownSeconds:17, spawnTierOffset:3, ignored:'bad'});
      const config = JSON.parse(configured.match(/ORIGIN_GAME_CONFIG\*\/([^;]+);/)[1]);
      a.equal(config.allowReplay, true, id + ' bakes replay into uploaded game');
      a.check(!('ignored' in config), id + ' excludes host and unknown config');
      if (id === 'grill-sort') a.equal(config.countdownSeconds, 17, 'Grill preserves task countdown');
      if (id === 'tasty-travels') a.equal(config.spawnTierOffset, 3, 'Tasty preserves task tier offset');
      const dir = path.join(root, id), output = path.join(dir, 'result');
      fs.mkdirSync(path.join(dir,'generated'), {recursive:true});
      const packed = await runStep({taskId:id, templateId:entry.id, projectRoot:dir, resultRoot:output, stepId:'pack'});
      a.check(packed.ok, id + ' production pack succeeds', packed.error);
      a.equal(execFileSync('unzip',['-Z1',path.join(output,'game-only.zip')],{encoding:'utf8'}).trim(), 'game.js', id + ' upload archive contains only game.js');
      a.check(packed.metrics.gameZipBytes <= 5000000 && packed.metrics.assemblyBytes <= 10000000, id + ' actual archives fit limits');
      const first = fs.readFileSync(path.join(output,'game.js'));
      await runStep({taskId:id,templateId:entry.id,projectRoot:dir,resultRoot:output,stepId:'pack'});
      a.check(first.equals(fs.readFileSync(path.join(output,'game.js'))), id + ' repeated packing is deterministic');
    }
  } finally { fs.rmSync(root, {recursive:true,force:true}); }

  // Unit fixture for the public entry contract, not a replacement browser shell.
  let entry; const instances = [], calls = [];
  const SOURCE = {markup:'',css:'',resources:{},settings:{gameplay:{}},placements:{},code:'engine'};
  const element = () => ({querySelector(){return null;},style:{setProperty(){}},remove(){this.removed=true;}});
  const scopes = [];
  vm.runInNewContext(fs.readFileSync(new URL('../../template-core/shared/origin-standalone/game.js', import.meta.url), 'utf8'), {
    SOURCE, window:{devicePixelRatio:1}, Event, performance,
    engineRoot(){const view={root:element(),mount:element()};instances.push(view);return view;},
    createEngineScope(){const scope={window:{dispatchEvent(){}},audioContexts:new Set(),pause(){this.paused=true;},resume(){this.paused=false;},dispose(){this.disposed=true;},run(){this.window.ORIGIN_RUNTIME.ready();}};scopes.push(scope);return scope;},
    NovvyGame(fn){entry=fn;},
  });
  const shell = Object.fromEntries(['step','win','fail','retry','cta'].map(name=>[name,(...args)=>calls.push([name,...args])]));
  const one = await entry({}, shell, {env:{muted:true}}), two = await entry({}, shell, {});
  const emit = (scope, name, detail={}) => scope.window.ORIGIN_RUNTIME.event('origin:origin-' + name,detail);
  emit(scopes[0],'step',{step:1,progress:25});
  a.equal(calls, [], 'initialization never emits gameplay');
  a.check(scopes.every(scope=>scope.paused), 'every prepared instance waits for start');
  one.start(); emit(scopes[0],'step',{step:1,progress:25}); emit(scopes[0],'step',{step:1,progress:30});
  a.equal(calls, [['step',25]], 'supplemental progress does not double count a step');
  one.pause(); emit(scopes[0],'step',{step:2,progress:50});
  a.equal(calls.length,1,'paused callbacks cannot report');
  one.resume(); emit(scopes[0],'result',{result:'fail',replay:true}); emit(scopes[0],'result',{result:'fail',replay:true});
  a.equal(calls.length,2,'one result per round');
  emit(scopes[0],'replay'); emit(scopes[0],'step',{step:1,progress:0});
  a.equal(calls.slice(-2),[['retry'],['step',0]],'retry permits a new round from the native counter');
  two.start(); emit(scopes[1],'step',{step:1,progress:10});
  a.equal(calls.at(-1),['step',10],'a second instance has an independent counter');
  one.destroy(); one.destroy(); emit(scopes[0],'step',{step:2,progress:75});
  a.check(scopes[0].disposed && instances[0].mount.removed && !scopes[1].disposed, 'destroy is idempotent and instance local');
  a.equal(calls.at(-1),['step',10],'destroyed callbacks cannot report');
  scopes[1].window.ORIGIN_RUNTIME.dispose = () => { throw new Error('native teardown failed'); };
  try { two.destroy(); } catch (error) { a.equal(error.message, 'native teardown failed', 'native teardown error is retained'); }
  a.check(scopes[1].disposed && instances[1].mount.removed, 'native teardown failure still releases the scope and DOM');

  // Exercise the actual scope scheduler without a browser or replacement shell.
  let now = 1000, serial = 0;
  const pending = new Map(), rafs = new Map();
  class Element extends EventTarget {
    constructor() { super(); this.children=[]; }
    append(node) { this.children.push(node); }
    appendChild(node) { this.append(node); return node; }
    remove() { this.removed=true; }
  }
  const native = {Date,Function,URL,performance:{now:()=>now},
    setTimeout(fn,ms){const id=++serial;pending.set(id,{fn,at:now+ms});return id;},
    clearTimeout(id){pending.delete(id);},
    requestAnimationFrame(fn){const id=++serial;rafs.set(id,fn);return id;},
    cancelAnimationFrame(id){rafs.delete(id);}, ResizeObserver:class {disconnect(){}}, Audio:class {},
  };
  const context = {window:native,document:{createElement:()=>new Element(),fonts:new Set()},EventTarget,Event,Response,TextEncoder,atob};
  vm.runInNewContext(fs.readFileSync(new URL('../../template-core/shared/origin-standalone/engine-scope.js',import.meta.url),'utf8').replace(/^export /gm,''),context);
  const scoped = context.createEngineScope(new Element()), other = context.createEngineScope(new Element());
  let ticks=0;
  scoped.window.setTimeout(()=>ticks++,100);
  scoped.window.requestAnimationFrame(()=>ticks++);
  now+=40; scoped.pause();
  const frozen = scoped.window.Date.now();
  a.check(pending.size===0 && rafs.size===0, 'pause cancels native timers and animation frames');
  now+=10000;
  a.equal(scoped.window.Date.now(),frozen,'paused game time excludes background duration');
  a.check(other.window.performance.now()>scoped.window.performance.now(),'another instance clock keeps running');
  scoped.resume();
  a.equal([...pending.values()][0].at-now,60,'resume preserves remaining timer delay');
  now+=60; for(const [id,item] of pending){pending.delete(id);item.fn();}
  for(const [id,fn] of rafs){rafs.delete(id);fn(now);}
  a.equal(ticks,2,'pending timeout and frame each fire once after resume');
  scoped.window.setInterval(()=>ticks++,100);
  scoped.window.requestAnimationFrame(()=>ticks++);
  scoped.dispose(); scoped.dispose();
  a.check(pending.size===0 && rafs.size===0,'destroy cancels pending interval and frame');
  a.equal(scoped.window.setTimeout(()=>ticks++,1),0,'destroyed scope cannot create new timers');
  other.dispose();
}
