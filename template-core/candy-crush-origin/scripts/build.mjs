import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {candyModel} from './candy-model.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=path.resolve(root,'../../editor/templates/candy-crush-origin');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
const provenance=JSON.parse(read('source/provenance.json'));
for(const [file,hash] of Object.entries(provenance.files))if(sha(fs.readFileSync(path.join(root,'source',file)))!==hash)throw new Error('Frozen source changed: '+file);
const scripts=[...read('source/original.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m=>m[1]).filter(s=>s.trim());
const {maxHits}=candyModel(read('source/original.html'));
if(maxHits!==71)throw new Error('The fixed 71-candy model changed');
if(scripts.length!==3)throw new Error('Expected config, platform wrapper and embedded engine');
const data={};vm.runInNewContext(scripts[0].slice(0,scripts[0].indexOf('function CreatePreloader')),data,{timeout:500});
data.params.tapsToBreak.value=data.params.tapsToBreak.default=maxHits;
if(data.texts.en.textLegal!=='2024 king.com Ltd.')throw new Error('Footer text anchor changed');
for(const locale of Object.values(data.texts))locale.textLegal='';
for(const key of ['linkAndroid','linkIOS'])delete data.params[key];
for(const [key,value] of Object.entries({hideCTA:true,logoRedirect:false,fullscreenCta:false,modeClicks:0,preloaderTimeout:0}))data.params[key].value=value;
let engine=scripts[2];
function patch(a,b){if(engine.split(a).length!==2)throw new Error('Patch anchor changed: '+a.slice(0,100));engine=engine.replace(a,b);}
function range(a,b,value){if(engine.split(a).length!==2||engine.split(b).length!==2)throw new Error('Range anchor changed: '+a);const start=engine.indexOf(a),end=engine.indexOf(b,start);if(end<start)throw new Error('Patch order');engine=engine.slice(0,start)+value+engine.slice(end);}
// Replace obsolete asynchronous schedulers with instance-owned timers. No window messaging.
range('var n,i,r=t.MutationObserver','var h=[]','var i,n=function(){setTimeout(c,0)};');
range('c=c&&c.setTimeout','c.setImmediate=','c=t,n=function(t){setTimeout(d,0,t)},');
// PIXI's optional image workers are unused; decode embedded images on the main thread.
range('let im=null;','function cm(', 'const hm={isImageBitmapSupported:async()=>false};');
patch('this.#At++,this.#At>=','this.#At++,globalThis.CCS_CONTEXT.step(this.#At,this.#Y.params.tapsToBreak.value,this.components.World["сolorbomb"],this.#Et),this.#At>=');
patch('if(this.#G=10,this.#Y.platformManager.end(),','if(this.#G=10,globalThis.CCS_CONTEXT.win(),this.#Y.platformManager.end(),');
// Native winGame schedules the camera, logo and randomized candy landing tweens.
// Capture them after scheduling; the adapter waits for the main candy landing
// instead of the longer decorative jitter and offscreen explosion particles.
patch('visible:!0})}};enterframe=t=>{let e;', 'visible:!0}),globalThis.CCS_CONTEXT.winAnimationReady()}};enterframe=t=>{let e;');
patch('this.components.World.gameStage.visible&&(e=this.components.World["сolorbomb000"]', 'globalThis.CCS_CONTEXT.winFrame(),this.components.World.gameStage.visible&&(e=this.components.World["сolorbomb000"]');
patch('10!=this.#G&&(this.#G=10,this.#Y.platformManager.end(),','10!=this.#G&&(this.#G=10,globalThis.CCS_CONTEXT.fail(),this.#Y.platformManager.end(),');
patch('globalThis.playable.add("Game",new PR({app:globalThis.playable})),globalThis.playable.resizeManager.call()', 'globalThis.playable.add("Game",new PR({app:globalThis.playable})),globalThis.playable.resizeManager.call(),globalThis.CCS_CONTEXT.ready(globalThis.playable,ux.Howler,iT)');
patch('this.params=r,this.onCompleteLoad=i,this.#Rt=n;', 'this.params=r,this.onCompleteLoad=i,this.#Rt=n,globalThis.CCS_CONTEXT.attach(this,n);');
patch('this.#jt()}))','globalThis.CCS_CONTEXT.alive()&&this.#jt()}))');
// Full canvases; native scene content and raycasting use the shell's safe content area.
patch('t.resize(this.#C.width/this.#C.scene.scale.x,this.#C.height/this.#C.scene.scale.x)','t.resize(globalThis.CCS_CONTEXT.area().width/this.#C.scene.scale.x,globalThis.CCS_CONTEXT.area().height/this.#C.scene.scale.x)');
patch('this.scene.scale.set(this.height/720)),this.app.renderer.render(this.scene)','this.scene.scale.set(this.height/720)),globalThis.CCS_CONTEXT.fit2d(this),this.app.renderer.render(this.scene)');
patch('this.camera.updateProjectionMatrix(),this.enterframe()','globalThis.CCS_CONTEXT.fit3d(this),this.enterframe()');
patch('this.#Ot.x=+this.#Ot.x*this.#Y.view2d.scene.scale.x/(.5*this.#Y.view2d.width),this.#Ot.y=-this.#Ot.y*this.#Y.view2d.scene.scale.x/(.5*this.#Y.view2d.height)','this.#Ot.x=t.global.x/this.#Y.view2d.width*2-1,this.#Ot.y=1-t.global.y/this.#Y.view2d.height*2');
// Original sound.on can be called by focus/first touch, so enforce env.muted at that boundary.
patch('this.#u.playSounds.value&&this.activeFocus&&this.activeUser','globalThis.CCS_CONTEXT.audible()&&this.#u.playSounds.value&&this.activeFocus&&this.activeUser');
const source={params:data.params,images:data.images,texts:data.texts,engine};
const game='(function(){\n'+read('src/engine-scope.js').replace(/^export /gm,'')+'\nconst SOURCE='+JSON.stringify(source)+';\nconst CANDY_TARGET_HITS='+data.params.tapsToBreak.value+';\n'+read('src/remaining-candy.js')+'\n'+read('src/game.js')+'\n})();\n';
for(const forbidden of [/postMessage/,/messageHandlers/,/NovvyPlayable/,/NovvyAnalytics/,/NovvyShell/,/tracking\.novvy\.ai/,/window\.open\(/,/mraid\./])if(forbidden.test(game))throw new Error('Forbidden game dependency '+forbidden);
new vm.Script(game);
const files={'game/game.js':game,'game/index.html':read('src/index.html'),'game/host.js':read('src/host.js'),'game/cta-icon.jpg':fs.readFileSync(path.join(root,'source/app-icon.jpg')),'source/provenance.json':JSON.stringify(provenance,null,2)+'\n'};
const manifest={id:'candy-crush-origin',name:'Candy Crush Saga · 原版糖果球',version:'1.2.1',entry:'game/index.html',levels:[{id:1,name:'Poke the Candy · 固定 71 次点击',game:'game/game.js'}],constants:{game:{host:'game/host.js',maxHits,hudInsideCanvas:true,ctaCard:{name:'Candy Crush Saga',icon:'game/cta-icon.jpg',rating:provenance.card.rating}},fileHashes:Object.fromEntries(Object.entries(files).map(([name,value])=>[name,sha(value)]))}};
for(const [name,value] of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(output,name)),{recursive:true});fs.writeFileSync(path.join(output,name),value);}fs.writeFileSync(path.join(output,'game-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Built Candy Crush Saga: fixed ${maxHits} candy hits, footer removed`);
