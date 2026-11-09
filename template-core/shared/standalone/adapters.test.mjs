import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('Block Out reports separate native boards, with 2 and 37 block denominators',async()=>{
  const events=[],element={addEventListener(){},hidden:true},runtime={paused:false,env:{insets:{},muted:true},event:(...args)=>events.push(args),ready(){}};
  const scene={async startLevel(){},stopTutorialForLevelCompletion(){}};
  class Manager {
    currentLevel=0;blocks=[];gameScene=scene;
    setSelectedBlock(){}onBlockPassedExit(block){this.blocks=this.blocks.filter(x=>x!==block);}
    showEndcard(){throw Error('Native conversion endcard must not run');}startEndcardScene(){throw Error('Native endcard must not run');}
    loadNextLevel(){return !!Parameters.levelAssets[this.currentLevel];}
  }
  class Drag{async pointerUpHandler(){}}
  class App{resumeGame(){}pauseGame(){}}App.instance=new App();
  class Boot{async start(){}}
  const Parameters={levelAssets:[{BMS:Array(2)},{BMS:Array(37)}]},Sound={muteAll(){},unmuteAll(){}};
  Manager.instance=new Manager();
  const window={__BLOCK_OUT_CONFIG__:{gameplay:{allowReplay:false},intro:false,policy:{}},ORIGIN_RUNTIME:runtime,addEventListener(){}};
  vm.runInNewContext(fs.readFileSync(new URL('../../block-out-origin/src/standalone-adapter.js',import.meta.url),'utf8'),{window,document:{getElementById:()=>element,addEventListener(){}},requestAnimationFrame:fn=>fn(),console});
  window.__BLOCK_OUT_ADAPTER__.install({Manager,Drag,App,Boot,Sound,Parameters});await new Boot().start();
  const manager=Manager.instance;
  function clear(){const block={cellsData:[{x:0,y:0}]};manager.blocks.push(block);manager.setSelectedBlock(block);manager.onBlockPassedExit(block);}
  clear();clear();assert.deepEqual(events.filter(e=>e[0].endsWith('-step')).map(e=>e[1].progress),[50,100]);
  manager.currentLevel=1;manager.loadNextLevel();assert.equal(events.at(-1)[1].continuePlaying,true);
  await scene.startLevel();assert.equal(events.at(-1)[0],'origin:block-out-level');assert.equal(events.at(-1)[1].level,2);
  clear();assert.equal(events.at(-1)[1].step,1);assert.equal(events.at(-1)[1].progress,100/37);
  manager.showEndcard();assert.equal(events.at(-1)[0],'origin:playable-complete');assert.equal(events.at(-1)[1].replayable,false);
});

test('Tasty locale changes use retained image metadata after Cocos consumes resource config',()=>{
  class Game{}class SetLabel{};
  const manager={},images=[],words={en:{NextLab:'Next'},fr:{NextLab:'Suivant'},ar:{NextLab:'Next'}};
  const modules={GameScript:{default:Game},GameManager:{GameManager:manager},LanguageCfg:{LanguageCfg:{language:words}},SetLabel:{default:SetLabel},Utils:{default:{setSpriteFrame:(_node,name)=>images.push(name)}}};
  const window={ORIGIN_RESOURCES:{},__ORIGIN_CONFIG__:{localizedImages:['images/order1-en','images/order1-fr']},ORIGIN_RUNTIME:{env:{language:'fr-FR'}}};
  const cc={Label:class{},Sprite:class{},director:{getScene:()=>null}};
  vm.runInNewContext(fs.readFileSync(new URL('../../tasty-travels-origin/src/standalone-language.js',import.meta.url),'utf8'),{window,cc,navigator:{language:'en'}});
  window.__TASTY_LANGUAGE__.install(name=>modules[name]);assert.equal(manager.curLanguage,'fr');
  const component=new SetLabel();component.node={name:'order1',getComponent:type=>type===cc.Sprite?{}:null};component.onLoad();assert.equal(images.at(-1),'order1-fr');
  window.ORIGIN_RUNTIME.env={language:'ar'};window.ORIGIN_RUNTIME.environmentChanged({language:'ar'},{language:'fr-FR'});component.onLoad();assert.equal(images.at(-1),'order1-en','missing translated sprite falls back to embedded English');
  window.ORIGIN_RUNTIME.env={language:'xx'};component.onLoad();assert.equal(manager.curLanguage,'en');
});
