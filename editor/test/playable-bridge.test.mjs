import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

// 段桥单测:node:vm 沙箱 + stub NovvyPlayable/NovvyAnalytics,验证
// docs/original-zip-required-event-integration.md 的段链声明/切段/媒体注册/
// 步骤进度/结果结算契约,以及预览环境(无 SDK)全 no-op。
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const source=fs.readFileSync(path.join(root,'editor/core/overlays/playable-bridge/playable-bridge.js'),'utf8');

function bridgeRun({chain,introVideo=false,outroVideo=false,sdk=true,media=true}={}){
 const listeners=new Map();
 const calls=[];
 const NovvyPlayable=sdk?{
  setStageList:list=>{calls.push(['setStageList',list]);return true;},
  setStage:(index,type)=>{calls.push(['setStage',index,type]);return true;},
  onStep:(step,detail)=>{calls.push(['onStep',step,detail]);},
  onComplete:detail=>{calls.push(['onComplete',detail]);},
 }:undefined;
 const NovvyAnalytics=media?{registerMedia:(element,name)=>{calls.push(['registerMedia',name.name]);}}:undefined;
 const document={getElementById:id=>{
  if(id==='novvy-intro-video')return introVideo?{}:null;
  if(id==='novvy-outro-video')return outroVideo?{}:null;
  return null;
 }};
 const sandbox={window:{__novvyStageChain__:chain,NovvyPlayable,NovvyAnalytics,addEventListener:(event,fn)=>listeners.set(event,[...(listeners.get(event)||[]),fn]),dispatchEvent:event=>{for(const fn of listeners.get(event.type)||[])fn(event);}},document,CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}}};
 vm.runInNewContext(source,sandbox);
 return {calls,emit:(name,detail)=>sandbox.window.dispatchEvent({type:name,detail}),
  stages:()=>calls.filter(([name])=>name==='setStage').map(([_,index,type])=>index+':'+type),
  steps:()=>calls.filter(([name])=>name==='onStep').map(([_,step,detail])=>[step,detail.progress]),
  completes:()=>calls.filter(([name])=>name==='onComplete')};
}

export default async function run(assert){
 // 段链×配置矩阵:字面量链(打包时注入)决定声明与首段切入(boot 只切首段,
 // 后续切段由事件驱动,在 full 用例覆盖);1 起下标。
 const matrix=[
  [['playable'],'1:playable'],
  [['video','playable'],'1:video'],
  [['video','playable','video'],'1:video'],
  [['playable','video'],'1:playable'],
  [['video','playable','video','playable'],'1:video'],
  [['playable','video','playable'],'1:playable'],
 ];
 for(const [chain,expected] of matrix){
  const run=bridgeRun({chain});
  assert.equal(run.calls[0],['setStageList',chain],`声明完整段链 ${JSON.stringify(chain)}`);
  assert.equal(run.stages().join(','),expected,`段链 ${JSON.stringify(chain)} 首段切入正确`);
 }
 // 切段事件映射:片头播完→第一关;胜利后片尾启动→video 段;phase2-start→末段。
 const full=bridgeRun({chain:['video','playable','video','playable'],introVideo:true,outroVideo:true});
 assert.equal(full.calls.filter(([name])=>name==='registerMedia').map(([_,name])=>name),['intro_video','outro_video'],'intro/outro 标准 <video> 注册媒体上报');
 full.emit('novvy:intro-finished',{reason:'video_ended'});
 assert.equal(full.stages().at(-1),'2:playable','片头播完切入第一关 playable 段');
 full.emit('novvy:hud-progress',{percent:40,correct:4,total:10});
 full.emit('novvy:playable-complete');
 assert.equal(full.completes(),[['onComplete',{result:'win'}]],'最后一步完成即结算 win(doc §5,不依赖 CTA)');
 assert.equal(full.stages().length,2,'完成结算不切段');
 full.emit('novvy:outro-started');
 assert.equal(full.stages().at(-1),'3:video','第一关后片尾启动切入独立 video 段');
 full.emit('novvy:victory');
 assert.equal(full.completes().length,1,'胜利(playable-complete 之后到达)经闩锁不重复结算');
 full.emit('novvy:phase2-start');
 assert.equal(full.stages().at(-1),'4:playable','第二关切入链尾 playable 段');
 full.emit('novvy:hud-progress',{percent:70,correct:7,total:10});
 full.emit('novvy:victory');
 assert.equal(full.completes().length,2,'phase2-start 重置闩锁，第二关单独结算一次');
 assert.equal(full.steps(),[[1,40],[1,70]],'第二关步骤计数同步重开');
 // 双触发反向到达(victory 先)同样只结算一次。
 const reversed=bridgeRun({chain:['playable']});
 reversed.emit('novvy:victory');reversed.emit('novvy:playable-complete');
 assert.equal(reversed.completes().length,1,'先胜利后完成同样只结算一次');
 // 有效步骤与真实进度(doc §4):只在 percent 上涨时记一步 —— colorever 系
 // {percent,correct,total} 与 dragon-cube {percent} 两形状、拾取/undo 的回落、
 // reset 归零、越界值都过滤。
 const steps=bridgeRun({chain:['playable']});
 steps.emit('novvy:hud-progress',{percent:0});
 steps.emit('novvy:hud-progress',{});
 steps.emit('novvy:hud-progress');
 assert.equal(steps.steps(),[],'进度 0/缺 percent/无 detail 不记步骤');
 steps.emit('novvy:hud-progress',{percent:45});
 steps.emit('novvy:hud-progress',{percent:45,correct:9,total:20});
 steps.emit('novvy:hud-progress',{percent:46});
 assert.equal(steps.steps(),[[1,45],[2,46]],'仅上涨时记一步并携带真实进度');
 steps.emit('novvy:hud-progress',{percent:10});
 assert.equal(steps.steps().length,2,'进度回落(undo/reset)不记步骤');
 steps.emit('novvy:hud-progress',{percent:101});
 assert.equal(steps.steps().length,2,'越界进度不记步骤');
 // 链型守卫:intro-only 不把片头段误认片尾;单关链不响应第二关切段。
 const introOnly=bridgeRun({chain:['video','playable']});
 introOnly.emit('novvy:outro-started');
 assert.equal(introOnly.stages().length,1,'intro-only 链对片尾事件不切段');
 const single=bridgeRun({chain:['video','playable','video']});
 single.emit('novvy:phase2-start');
 assert.equal(single.stages().length,1,'单关链不响应第二关切段');
 // 防御式:无 SDK(编辑器预览)与坏链都静默,不抛错、零调用。
 const preview=bridgeRun({chain:['video','playable','video','playable'],sdk:false,media:false,introVideo:true,outroVideo:true});
 preview.emit('novvy:intro-finished',{});preview.emit('novvy:hud-progress',{percent:50});preview.emit('novvy:playable-complete');preview.emit('novvy:outro-started');preview.emit('novvy:phase2-start');
 assert.equal(preview.calls.length,0,'预览环境(无 SDK)全部新 API 调用静默跳过');
 for(const broken of [undefined,['video'],[]]){
  let threw=false;
  try{bridgeRun({chain:broken});}catch{threw=true;}
  assert.check(!threw,`坏段链 ${JSON.stringify(broken)??'undefined'} 静默退出不抛错`);
 }
 const noVideo=bridgeRun({chain:['playable'],introVideo:false,outroVideo:false});
 assert.check(!noVideo.calls.some(([name])=>name==='registerMedia'),'未启用的视频段不注册媒体');
 // 三个插件 lib.mjs 的接线:段桥 unshift 到 bodyScripts 首位、段链字面量注入
 // data 脚本(静态预检可见的调用线索)。
 for(const plugin of ['colorever','colorever-new','dragon-cube']){
  const lib=fs.readFileSync(path.join(root,`editor/plugins/${plugin}/lib.mjs`),'utf8');
  assert.check(lib.includes('data-novvy-playable-bridge')&&lib.indexOf('bodyScripts.unshift')<lib.indexOf('data-novvy-cta-bridge'),`${plugin}: 段桥先于转化桥注入 bodyScripts 首位`);
  assert.check(lib.includes('window.__novvyStageChain__='),`${plugin}: 段链字面量进打包/预览文档`);
 }
}
