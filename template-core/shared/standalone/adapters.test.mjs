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

test('Tasty English creative retains English labels and artwork in Chinese device environments',()=>{
  class Game{}class SetLabel{};
  const manager={},images=[],words={en:{NextLab:'Next',tip1Lab:'Drop and merge'},zh:{NextLab:'下一个',tip1Lab:'合成饮品'},fr:{NextLab:'Suivant'}};
  const modules={GameScript:{default:Game},GameManager:{GameManager:manager},LanguageCfg:{LanguageCfg:{language:words}},SetLabel:{default:SetLabel},Utils:{default:{setSpriteFrame:(_node,name)=>images.push(name)}}};
  const window={ORIGIN_RESOURCES:{},__ORIGIN_CONFIG__:{localizedImages:['images/order1-en','images/order2-en','images/order1-zh','images/order2-zh']},ORIGIN_RUNTIME:{env:{language:'zh-CN'}}};
  const cc={Label:class{},Sprite:class{},director:{getScene:()=>null}};
  vm.runInNewContext(fs.readFileSync(new URL('../../tasty-travels-origin/src/standalone-language.js',import.meta.url),'utf8'),{window,cc,navigator:{language:'zh-CN'}});
  window.__TASTY_LANGUAGE__.install(name=>modules[name]);
  const game=new Game();game.NextLab={};game.NextLab2={};game.tipLab1_1={};game.tipLab1_2={};
  for(const language of [undefined,'zh-CN','fr-FR','en-US']){
    window.ORIGIN_RUNTIME.env={language};game.setLanguage();
    assert.equal(manager.curLanguage,'en');assert.equal(manager.isMultilingual,false);
    assert.equal(game.languageName,'en');assert.equal(game.NextLab.string,'Next');assert.equal(game.NextLab2.string,'Next');
    assert.equal(game.tipLab1_1.string,'Drop and merge');assert.equal(game.tipLab1_2.string,'Drop and merge');
    const label={},component=new SetLabel();component.node={name:'NextLab',getComponent:type=>type===cc.Label?label:null};component.onLoad();assert.equal(label.string,'Next');
    for(const name of ['order1','order2']){
      component.node={name,getComponent:type=>type===cc.Sprite?{}:null};component.onLoad();assert.equal(images.at(-1),name+'-en');
    }
  }
});
