import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {transformSync} from 'esbuild';

const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.resolve(root,'../../editor/templates/travel-town-origin');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
const provenance=JSON.parse(read('source/provenance.json'));
for(const [file,hash] of Object.entries(provenance.files))if(sha(fs.readFileSync(path.join(root,'source',file)))!==hash)throw new Error('Frozen source changed: '+file);
const raw=read('source/original.js').trim();
if(!raw.startsWith('al_renderHtml(')||!raw.endsWith(');'))throw new Error('Unknown source wrapper');
const html=JSON.parse(raw.slice(14,-2)).html;
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m=>m[1]).filter(s=>s.trim());
if(scripts.length!==3||!scripts[0].includes('window["Globals"]')||!scripts[2].includes('/id1521236603'))throw new Error('Unexpected Travel Town payload');
let engine=transformSync(scripts[2],{minify:false}).code;
function patch(before,after){if(engine.split(before).length!==2)throw new Error('Patch anchor changed: '+before.slice(0,100));engine=engine.replace(before,after);}
function module(id,body){
  const re=new RegExp('  }, '+id+': [\\s\\S]*?(?=\\n  }, [\\de]+:|\\n  } }, t = {})','g');
  const matches=[...engine.matchAll(re)];
  if(matches.length!==1)throw new Error('Module boundary changed: '+id);
  engine=engine.replace(re,()=>`  }, ${id}: (e2,t2,i) => { ${body}\n`);
}
// Remove the vendor's advertising adapters, inactivity/focus redirects and
// logger. The unchanged Pixi renderer, data, drag systems and animations remain.
for(const [id,name] of Object.entries({7502:'AppreciatePlatform',2214:'DapiPlatform',6130:'FacebookPlatform',2215:'GooglePlatform',4125:'InMobiPlatform',6970:'BigabidPlatform',1421:'MintegralPlatform',8623:'MraidPlatform',6766:'MyTargetPlatform',129:'PanglePlatform',9715:'VunglePlatform'}))module(id,`t2.${name}=i(1351).BasePlatform;`);
module(1351,'t2.BasePlatform=class extends i(561).EventEmitter {constructor(){super();this.code="local";}init(){return Promise.resolve();}redirect(){}};');
module(9843,'t2.PlatformFactory={create(){return new (i(1351).BasePlatform)();}};');
module(2126,'t2.PlatformsConfig={};');
module(7909,'t2.EventsLogger=class {log(){}};');
module(1455,'t2.RedirectEvent={};t2.RedirectManager=class RedirectManager {init(){}reset(){}resetTimeout(){}redirect(){}doComplete(){}waitFinalClick(){}removeInactivityRedirect(){}};');
module('6e3','t2.CustomRedirectManager=class CustomRedirectManager extends i(1455).RedirectManager {};');
module(48,'t2.RedirectCommand=class RedirectCommand extends i(3411).SceneStateActionBase {internalRun(){}};');
// The user requested consecutive repairs. Keep the original merge boards and
// repair animations, but return to selection instead of its conversion state.
module(1849,`t2.ShowItem0UpgradeCommand=class ShowItem0UpgradeCommand extends i(3411).SceneStateActionBase {
  internalRun(){super.internalRun();
    for(const id of [0,1])this.mainContainer.child('bg character_'+id).playIdle();
    if(window.TT_CONTEXT.repairComplete()){
      i(8646).dGet(i(4056).WinContainer).hintLabel.node.visible=false;
      for(const id of [0,1,2,3])this.mainContainer.child('item_'+id).node.visible=false;
    }else{
      i(8646).dGet(i(4056).WinContainer).hintLabel.render(i(893).TextShowRenderer,{dx:0,dy:-800});
      this.internalResolve();
    }
  }
  internalResolve(){super.internalResolve();i(9002).App.scenes.current.startState('Main');}
};`);
patch('this.startState("Game"), super._start();','this.startState("Game"), super._start(), window.TT_CONTEXT.ready(this);');
// Choice icons scale in after scene readiness; fit their final bounds as well
// as on resize, otherwise the lower option can grow beneath the shell card.
patch('this.main.child("item_0 item_icon").tweens.scaleTo(1, 300, { ease: "backOut" })','this.main.child("item_0 item_icon").tweens.scaleTo(1, 300, { ease: "backOut" }).then(()=>window.TT_CONTEXT.fitChoices())');
patch('this.main.child("item_1 item_icon").tweens.scaleTo({ x: 1, y: -1 }, 300, { ease: "backOut" })','this.main.child("item_1 item_icon").tweens.scaleTo({ x: 1, y: -1 }, 300, { ease: "backOut" }).then(()=>window.TT_CONTEXT.fitChoices())');
// A rapid second tap must not start the same merge state twice.
patch('o.App.audio.play("slot_button"), this.gameModel.current = e3,','if(this._choosing)return;this._choosing=true; o.App.audio.play("slot_button"), this.gameModel.current = e3,');
patch('this.main.node.filters = [], this.items = [], this.current = 1,','this.main.node.filters = [], this._choosing=false, this.items = [], this.current = 1,');
// Each board used to be visited only once. Release its old clip mask now that
// a room can contain multiple repairs.
patch('this.gameContainer.merge.cellsContainer.node.addChild(t3), this.gameContainer.merge.cellsContainer.node.mask = t3,','const cellsNode=this.gameContainer.merge.cellsContainer.node,previousMask=cellsNode.mask;cellsNode.mask=null;if(previousMask)previousMask.destroy(); cellsNode.addChild(t3), cellsNode.mask = t3,');
// Pixi emits pointermove for touch, pen and mouse. The vendor's capability
// switch drops mouse drags on touch-capable/hybrid devices and emulators.
patch('this.interactionManager.supportsTouchEvents ? this.stage.on("touchmove", this.onPointerMove, this) : this.stage.on("pointermove", this.onPointerMove, this)','this.stage.on("pointermove", this.onPointerMove, this)');
patch('this.interactionManager.supportsTouchEvents ? this.stage.off("touchmove", this.onPointerMove, this) : this.stage.off("pointermove", this.onPointerMove, this)','this.stage.off("pointermove", this.onPointerMove, this)');
patch('t3.level++, yield t3.render','t3.level++, window.TT_CONTEXT.merge(t3), yield t3.render');
patch('i2.item.cell = t3, yield t3.item.tweens.moveTo','i2.item.cell = t3, window.TT_CONTEXT.move(), yield t3.item.tweens.moveTo');
patch('o.App.audio.stopMusic(), o.App.audio.play("fail", 0.7)','window.TT_CONTEXT.fail(), o.App.audio.stopMusic(), o.App.audio.play("fail", 0.7)');
patch('return Array.isArray(e3) ? e3 : this.screen.width > this.screen.height ? e3.hor.map((e4) => u.CoordUtils.fixSdCoord(e4)) : e3.ver.map((e4) => u.CoordUtils.fixSdCoord(e4));','return window.TT_CONTEXT.bounds(this,Array.isArray(e3) ? e3 : this.screen.width > this.screen.height ? e3.hor.map((e4) => u.CoordUtils.fixSdCoord(e4)) : e3.ver.map((e4) => u.CoordUtils.fixSdCoord(e4)));');
patch('"visible" === document.visibilityState ? this.resume() : this.pause();','// Visibility is controlled by the outer lifecycle.');
patch('.then(this._onLoaderReady.bind(this));','.then(this._onLoaderReady.bind(this)).catch(error=>window.TT_CONTEXT.error(error));');
patch('window.addEventListener("DOMContentLoaded", () => {\n      (0, e2.injections)(), window.App = t2.App, t2.App.run(i.ProjectConfig);\n    });','(0, e2.injections)(); window.TT_CONTEXT.install(__webpack_require__,t2.App,i.ProjectConfig);');
// The original DI container keys classes by constructor.name. Preserve names.
const source={resources:scripts[0],engine:transformSync(engine,{minifyWhitespace:true,minifySyntax:true,minifyIdentifiers:false,keepNames:true,legalComments:'inline'}).code};
const game='(function(){\n'+read('src/engine-scope.js').replace(/^export /gm,'')+'\nconst SOURCE='+JSON.stringify(source)+';\n'+read('src/game.js')+'\n})();\n';
for(const forbidden of [/postMessage/,/messageHandlers/,/NovvyPlayable/,/NovvyAnalytics/,/NovvyShell/,/tracking\.novvy\.ai/,/window\.open\(/,/mraid\./,/window\[\\"location/])if(forbidden.test(game))throw new Error('Forbidden game dependency '+forbidden);
const files={'game/game.js':game,'game/index.html':read('src/index.html'),'game/host.js':read('src/host.js'),'game/cta-icon.jpg':fs.readFileSync(path.join(root,'source/app-icon.jpg'))};
const manifest={id:'travel-town-origin',name:'Travel Town · 原版剧情合并试玩',version:JSON.parse(read('package.json')).version,entry:'game/index.html',levels:[{id:1,name:'寒冷房间 · 连续粉刷与清理',game:'game/game.js'}],constants:{game:{host:'game/host.js',hudInsideCanvas:true,engine:'PixiJS',ctaCard:{name:provenance.brand.name,icon:'game/cta-icon.jpg',rating:provenance.brand.rating}},fileHashes:Object.fromEntries(Object.entries(files).map(([name,data])=>[name,sha(data)]))}};
for(const [name,data] of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(out,name)),{recursive:true});fs.writeFileSync(path.join(out,name),data);}
fs.writeFileSync(path.join(out,'game-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Built Travel Town: original story, consecutive repairs and embedded media');
