import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {execFile} from '../core/lib/exec.mjs';
import {createServer} from '../server.mjs';
import {deleteTask,stepInputFilesFor} from '../lib/store.mjs';
import {loadTemplate,templateSteps,stepPrerequisites,runStep} from '../core/runner.mjs';
import {coloreverHtml,coloreverLevel,coloreverPatterns} from '../plugins/colorever/lib.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const custom=()=>({name:'Custom house </script><script>bad()</script>',width:8,height:6,colors:{10:'#123456',20:'#fedcba',30:'#ff0055'},target:Array.from({length:48},(_,i)=>i<8?0:i%3===0?10:i%3===1?20:30),capacity:12,trayCols:4,difficulty:10,seed:7,decoration:'none'});
export default async function run(assert){
 const bridgeSource=fs.readFileSync(path.join(root,'editor/plugins/colorever/overlays/cta-bridge/cta-bridge.js'),'utf8');
 assert.check(!bridgeSource.includes('novvyEndCard')&&!bridgeSource.includes('downloadBtn')&&!bridgeSource.includes('pointer-events'),'转化桥零 DOM 耦合：不引用服务卡片与任何元素结构');
 function bridgeRun({intro=false,engine=true,outro=false}={}){
  const listeners=new Map();let endCards=0,engineClicks=0,opens=0;
  const sandbox={window:{__COLOREVER_CTA_URL__:'',__novvyOutroEnabled:outro,__novvyBridgeVersion:1,novvy:{open:()=>opens++},addEventListener:(event,fn)=>listeners.set(event,[...(listeners.get(event)||[]),fn]),showEndCard:()=>{endCards+=1;},novvyHandleAdClick:engine?()=>{engineClicks+=1;}:undefined},document:{hidden:false,readyState:'complete',getElementById:id=>intro&&id==='novvy-video-intro'?{}:null,addEventListener(){}},setTimeout(){},clearTimeout(){}};
  vm.runInNewContext(bridgeSource,sandbox);
  return {counts:()=>({endCards,engineClicks,opens}),emit:(name,detail)=>{for(const fn of listeners.get(name)||[])fn({detail});}};
 }
 const plain=bridgeRun();
 assert.equal(plain.counts(),{endCards:1,engineClicks:0,opens:0},'无片头时加载即经服务公开 API 亮出结算卡片');
 plain.emit('novvy:victory');
 assert.equal(plain.counts(),{endCards:1,engineClicks:1,opens:0},'胜利经注入引擎统一转化，不重复亮卡');
 const gated=bridgeRun({intro:true});
 assert.equal(gated.counts().endCards,0,'片头期间不亮卡片');
 gated.emit('novvy:intro-finished',{reason:'video_ended'});
 assert.equal(gated.counts().endCards,1,'片头播完进入试玩时亮出结算卡片');
 const withOutro=bridgeRun({intro:true,outro:true});
 withOutro.emit('novvy:intro-finished',{reason:'video_ended'});
 assert.equal(withOutro.counts().endCards,1,'有片尾时试玩开始同样亮卡');
 withOutro.emit('novvy:victory');
 assert.equal(withOutro.counts().engineClicks,0,'有片尾时胜利不立即转化，交给片尾事件链');
 withOutro.emit('novvy:outro-finished',{reason:'video_ended'});
 assert.equal(withOutro.counts().engineClicks,0,'片尾播完等待 1 秒后才主动转化，当前不立即跳转');
 const preview=bridgeRun({engine:false});
 preview.emit('novvy:victory');
 assert.equal(preview.counts().opens,1,'预览环境无注入引擎时胜利走裸兜底链跳转');
 assert.check(!bridgeSource.includes('NovvyAnalytics'),'转化桥不携带事件上报');
 const hudListeners=new Map(),hudNodes=Object.fromEntries(['novvy-training-hud','novvy-hud-progress-label','novvy-hud-title-line1','novvy-hud-title-line2'].map(id=>[id,{textContent:'',style:{setProperty(){}},setAttribute(){}}]));
 const hudSandbox={window:{__NOVVY_UI__:{hud:{titleLine1:'主标题',titleLine2:'副标题'}},addEventListener:(event,fn)=>hudListeners.set(event,fn)},document:{getElementById:id=>hudNodes[id]}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'editor/plugins/colorever/overlays/hud/hud.js'),'utf8'),hudSandbox);
 assert.equal([hudNodes['novvy-hud-title-line1'].textContent,hudNodes['novvy-hud-title-line2'].textContent],['主标题','副标题'],'HUD 两行配置标题进入展示节点');
 hudListeners.get('novvy:hud-progress')({detail:{percent:88,correct:238,total:270}});
 assert.equal(hudNodes['novvy-hud-progress-label'].textContent,'238/270','HUD 显示真实珠子数量而非百分比');
 hudListeners.get('novvy:hud-progress')({detail:{percent:80,correct:216,total:270}});
 assert.equal(hudNodes['novvy-hud-progress-label'].textContent,'216/270','回退时数量跟随实际棋盘');
 const templateRoot=path.join(root,'editor/templates/colorever'),template=loadTemplate(templateRoot);
 assert.equal(templateSteps(template),['intro','outro','hud','background','level','pack'],'独立六步流程');
 assert.equal(await stepPrerequisites('pack',{},template),{uploads:[],generated:['level.json']},'关闭叠层时只依赖自己的关卡');
 assert.check(stepInputFilesFor('colorever').level.length===0,'图案只消费构建产物');
 const gameDir=path.join(templateRoot,'game'),html=fs.readFileSync(path.join(gameDir,'index.html'),'utf8'),js=fs.readFileSync(path.join(gameDir,'game.js'),'utf8');new vm.Script(js);
 assert.check(!/type="module"|crossorigin|成品参考|reference-kitty-source/.test(html),'基础壳适合本地直开且无参考图片');
 assert.check(html.includes('<script src="game.js" defer></script>')&&html.includes('<style>'),'相对经典脚本入口与内联样式');
 const audio=JSON.parse(js.match(/^globalThis\.__COLOREVER_OFFLINE_AUDIO__=(.*);\n/)[1]);
 assert.equal(Object.keys(audio).sort(),['bgm','pickup','place','place-single','store','store-move','success'].sort(),'全部七个音频嵌入');
 assert.check(js.includes('__COLOREVER_LEVEL__')&&js.includes('novvy:victory')&&js.includes('novvy:hud-progress')&&js.includes('novvy:intro-finished'),'数据读取、完成、进度与片头音频契约进入引擎');
 assert.check(html.includes('id="guide-hand"')&&js.includes(fs.readFileSync(path.join(root,'template-core/colorever/src/assets/guide-hand.png')).toString('base64')),'旧版手势图片内嵌，无额外图片依赖');
 assert.check(js.includes('.haptic(')&&js.includes('selection'),'SDK 震动反馈进入广告引擎');
 const {level}=coloreverLevel(templateRoot,{patternId:'house'},template);
 const overlayArgs={root:templateRoot,overlaysRoot:path.join(root,'editor/plugins/colorever'),template,level,media:{}};
 const progressPalette={progressTextColor:'#7d315c',progressFillColor:'#e76b3f',progressTrackColor:'#f5dfbd'};
 for(const enabled of [false,true]){
  const colored=coloreverHtml({...overlayArgs,config:{hud:{enabled,titleEnabled:true,...progressPalette}}}).html;
  assert.check(colored.includes('--colorever-progress-text:#7d315c')&&colored.includes('--colorever-progress-fill:#e76b3f')&&colored.includes('--colorever-progress-track:#f5dfbd'),'三个进度颜色同时应用到原生和立绘 HUD，立绘开关 '+enabled);
 }
 const invalidColor=coloreverHtml({...overlayArgs,config:{hud:{progressTextColor:'#fff;}body{display:none}'}}}).html;
 assert.check(!invalidColor.includes('#fff;}body{display:none}'),'非法颜色不会注入 CSS');
 const withoutTitle=coloreverHtml({...overlayArgs,config:{hud:{enabled:false,titleEnabled:false}}}).html;
 const withTitle=coloreverHtml({...overlayArgs,config:{hud:{enabled:false,titleEnabled:true,titleLine1:'主标题',titleLine2:'副标题'}}}).html;
 const shell=text=>text.match(/<style data-colorever-shell>([\s\S]*?)<\/style>/)[1];
 assert.equal(shell(withTitle),shell(withoutTitle),'仅标题开关不改变画布尺寸与原生进度');
 assert.check(withTitle.includes('id="novvy-training-hud" data-title-only')&&!withTitle.includes('id="novvy-hud-progress-label"')&&!withTitle.includes('id="novvy-hud-progress-fill"'),'仅标题模式不注入额外进度节点');
 const titleOnlyNodes=Object.fromEntries(['novvy-training-hud','novvy-hud-title-line1','novvy-hud-title-line2'].map(id=>[id,{textContent:'',setAttribute(){}}]));
 vm.runInNewContext(fs.readFileSync(path.join(root,'editor/plugins/colorever/overlays/hud/hud.js'),'utf8'),{window:{__NOVVY_UI__:{hud:{titleLine1:'主标题',titleLine2:'副标题'}}},document:{getElementById:id=>titleOnlyNodes[id]}});
 assert.equal([titleOnlyNodes['novvy-hud-title-line1'].textContent,titleOnlyNodes['novvy-hud-title-line2'].textContent],['主标题','副标题'],'仅标题模式没有进度节点也可正常显示两行文字');
 level.name=custom().name;
 const injection=coloreverHtml({root:templateRoot,overlaysRoot:path.join(root,'editor/plugins/colorever'),template,level,config:{hud:{enabled:true},intro:{enabled:true},background:{enabled:true},cta:{enabled:true,destinationUrl:'https://example.com/app'}},media:{hudLeft:'left.webp',hudRight:'right.webp',introVideo:'video.mp4',introPoster:'poster.webp',background:'background.webp',ctaIcon:'app-icon.png'}}).html;
 for(const marker of ['id="novvy-video-intro"','id="novvy-training-hud"','id="novvy-dom-bg"','data-novvy-cta-bridge','__COLOREVER_CTA_URL__'])assert.check(injection.includes(marker),`叠层 ${marker} 注入`);
 assert.check(!injection.includes('id="novvy-cta"')&&!injection.includes('data-novvy-analytics')&&!injection.includes('data-novvy-cta>'),'下载卡片与埋点组不再随包，遗留 cta 配置不生效');
 assert.check(injection.includes('\\u003c/script>')&&!injection.includes('<script>bad()'),'作者字段不能逃逸内联脚本');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'colorever-media-test-'));
 try{
  const generated=path.join(temp,'generated');fs.mkdirSync(generated);fs.mkdirSync(path.join(temp,'uploads'));
  fs.writeFileSync(path.join(generated,'level.json'),JSON.stringify(coloreverLevel(templateRoot,{patternId:'house'},template).level));
  const fixtureIcon=path.join(root,'template-core/colorever/src/assets/guide-hand.png');
  for(const name of ['hud-left.webp','hud-right.webp','background.webp','poster.webp'])fs.copyFileSync(fixtureIcon,path.join(generated,name));
  fs.writeFileSync(path.join(temp,'uploads/intro-video.mp4'),'fixture');
  const result=await runStep({taskId:'fixture',templateRoot,scriptsRoot:path.join(root,'editor/core/scripts'),projectRoot:temp,resultRoot:path.join(temp,'dist'),stepId:'pack',config:{patternId:'house',intro:{enabled:true},hud:{enabled:true},background:{enabled:true},cta:{enabled:true}}});
  assert.check(result.ok,`全叠层打包成功 ${result.error||''}`);
  assert.equal(result.metrics.packageFiles,['background.webp','game.js','hud-left.webp','hud-right.webp','index.html','poster.webp','tail-ad-video.mp4'],'下载卡片图标(app-icon.png)不再进入交付包,由落地页服务补齐');
  fs.copyFileSync(fixtureIcon,path.join(temp,'uploads/portrait-src-left.png'));
  const optionalHud=await runStep({taskId:'fixture',templateRoot,projectRoot:temp,resultRoot:path.join(temp,'dist'),stepId:'hud',config:{hud:{enabled:true}}});
  assert.check(optionalHud.ok&&optionalHud.metrics.left&&!optionalHud.metrics.right,'仅上传单侧立绘也可以生成 HUD');
  assert.check(!fs.existsSync(path.join(generated,'hud-right.webp')),'移除未上传一侧的旧立绘产物');
  const {run:requiredHud}=await import('../core/steps/hud.mjs');
  let requiredRejected=false;
  try { await requiredHud({config:{hud:{enabled:true},hudImageSource:{left:'upload'}},generatedDir:generated,uploads:{'portrait-src-left':path.join(temp,'missing.png')}}); } catch { requiredRejected=true; }
  assert.check(requiredRejected,'其他模板的立绘必填行为保持不变');
  assert.equal(await stepPrerequisites('background',{background:{enabled:true,source:'video-last'}},template),{uploads:['intro-video'],generated:[]},'视频背景只依赖上传视频，不要求开场视频海报');
  await execFile('ffmpeg',['-y','-f','lavfi','-i','color=c=red:s=32x32:r=5:d=1','-f','lavfi','-i','color=c=blue:s=32x32:r=5:d=1','-filter_complex','[0:v][1:v]concat=n=2:v=1:a=0[out]','-map','[out]','-c:v','libx264','-pix_fmt','yuv420p',path.join(temp,'uploads/intro-video.mp4')]);
  fs.copyFileSync(fixtureIcon,path.join(temp,'uploads/background.png'));
  for (const source of ['video-first','video-last']) {
   const background=await runStep({taskId:'fixture',templateRoot,projectRoot:temp,resultRoot:path.join(temp,'dist'),stepId:'background',config:{intro:{enabled:false},background:{enabled:true,source,blurSigma:7}}});
   assert.check(background.ok&&background.metrics.source===source&&background.metrics.sigma===7,'视频背景提取并应用模糊参数 '+source);
   const {stdout}=await execFile('python3',['-c','from PIL import Image; import sys,json; print(json.dumps(Image.open(sys.argv[1]).convert("RGB").getpixel((0,0))))',path.join(generated,'background.webp')]);
   const [red,,blue]=JSON.parse(stdout);
   assert.check(source==='video-first'?red>200&&blue<40:blue>200&&red<40,'背景使用视频真实首尾帧，忽略已上传背景与海报 '+source);
   assert.check(!fs.existsSync(path.join(generated,'background-video-frame.webp')),'提取背景后清理临时帧');
  }
  fs.cpSync(path.join(templateRoot,'game'),path.join(temp,'game'),{recursive:true});
  const fixed=path.join(temp,'game/patterns/house.json');
  const tampered=JSON.parse(fs.readFileSync(fixed,'utf8'));tampered.opening=null;fs.writeFileSync(fixed,JSON.stringify(tampered));
  let rejected=false;try{coloreverLevel(temp,{patternId:'house'},template);}catch{rejected=true;}
  assert.check(rejected,'构建数据被改动时拒绝交付，不自行重新生成开局');
  assert.check(!js.includes('无法生成通过求解验证的开局'),'构建引擎不含随机开局生成器');

 }finally{fs.rmSync(temp,{recursive:true,force:true});}
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;let id;
 const api=async(url,body,method='POST')=>{const res=await fetch(base+url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:res.status,body:await res.json()};};
 try{
  const templates=await(await fetch(base+'/api/templates')).json();assert.check(templates.some(t=>t.id==='colorever')&&templates.some(t=>t.id==='colorever-gemsort'),'新旧模板独立可选');
  const created=await api('/api/tasks',{name:'colorever-test-'+Date.now(),templateId:'colorever'});id=created.body.id;assert.equal(created.status,201,'创建任务');
  let results=await api(`/api/tasks/${id}/run`,{step:'all'});assert.check(results.status===200&&results.body.length===6&&results.body.every(r=>r.ok),'默认猫咪六步全部通过');
  const patch=await api(`/api/tasks/${id}`,{config:{patternId:'house'}},'PATCH');assert.equal(patch.body.config.patternId,'house','任务保存固定图案 ID');
  assert.check(!patch.body.steps.level&&!patch.body.steps.pack,'选择图案使校验和打包失效');
  const rejected=await api(`/api/tasks/${id}`,{config:{level:custom()}},'PATCH');assert.check(rejected.status>=400,'任务不能编辑图案数据');
  const unknown=await api(`/api/tasks/${id}`,{config:{patternId:'unknown'}},'PATCH');assert.check(unknown.status>=400,'任务不能选择未知图案');
  const preview=await fetch(base+`/api/tasks/${id}/preview`),previewText=await preview.text();assert.equal(preview.status,200,'固定小屋即时预览');
  assert.check(previewText.includes('user-scalable=no')&&previewText.includes('data-novvy-fixed-viewport'),'在线预览应用公共视口和手势锁定');
  assert.check(previewText.includes('src="/templates/colorever/game/game.js"')&&previewText.includes('"width":20')&&previewText.includes('__COLOREVER_PATTERN_ID__="house"'),'预览注入小屋完整模板');
  results=await api(`/api/tasks/${id}/run`,{step:'all'});assert.check(results.status===200&&results.body.every(r=>r.ok),'小屋模板六步通过');
  assert.check(results.body.find(r=>r.stepId==='level').metrics.solvable,'实际解法回放验证完成');
  const packed=await(await fetch(base+`/result/${id}/index.html`)).text();assert.check(packed.includes('"width":20')&&packed.includes('__COLOREVER_PATTERN_ID__="house"'),'交付选择相同图案模块');
  assert.check(packed.includes('user-scalable=no')&&packed.includes('data-novvy-fixed-viewport'),'导出页面应用与预览一致的视口和手势锁定');
  for (const enabled of [false, true]) {
   await api(`/api/tasks/${id}`,{config:{hud:{enabled,titleLine1:'只显示主标题',titleLine2:'无需立绘'}}},'PATCH');
   const titlePreview=await(await fetch(base+`/api/tasks/${id}/preview`)).text();
   assert.check(titlePreview.includes('id="novvy-training-hud"')&&titlePreview.includes('"titleLine1":"只显示主标题"')&&titlePreview.includes('"titleLine2":"无需立绘"'),'标题独立进入即时预览，立绘开关 '+enabled);
   assert.check(!/<img[^>]*class="novvy-hud-dragon/.test(titlePreview)&&!titlePreview.includes('__HUD_LEFT_DRAGON__'),'无图片时不渲染空立绘');
   const titleBuild=await api(`/api/tasks/${id}/run`,{step:'all'});
   assert.check(titleBuild.status===200&&titleBuild.body.every(r=>r.ok),'没有上传立绘时全部步骤成功，立绘开关 '+enabled);
   assert.equal(titleBuild.body.find(r=>r.stepId==='pack').metrics.packageFiles,['game.js','index.html'],'标题模式打包不依赖立绘素材');
   const titleOutput=await(await fetch(base+`/result/${id}/index.html`)).text();
   assert.check(titleOutput.includes('id="novvy-training-hud"')&&titleOutput.includes('"titleLine1":"只显示主标题"')&&!/<img[^>]*class="novvy-hud-dragon/.test(titleOutput),'标题独立进入交付包');
  }
  await api(`/api/tasks/${id}`,{config:{hud:{enabled:false,titleLine1:'',titleLine2:''}}},'PATCH');
  await api(`/api/tasks/${id}`,{config:{hud:{enabled:true,titleEnabled:false,titleLine1:'已关闭标题',titleLine2:'保留编辑内容'}}},'PATCH');
  const hiddenTitlePreview=await(await fetch(base+`/api/tasks/${id}/preview`)).text();
  assert.check(hiddenTitlePreview.includes('id="novvy-training-hud"')&&hiddenTitlePreview.includes('"titleLine1":""')&&!hiddenTitlePreview.includes('已关闭标题'),'立绘开启、标题关闭时不把保存的标题显示到预览');
  await api(`/api/tasks/${id}/run`,{step:'all'});
  const hiddenTitleOutput=await(await fetch(base+`/result/${id}/index.html`)).text();
  assert.check(!hiddenTitleOutput.includes('已关闭标题'),'关闭标题也在打包结果生效');
  await api(`/api/tasks/${id}`,{config:{hud:{enabled:false,titleEnabled:true}}},'PATCH');
  const enabledTitlePreview=await(await fetch(base+`/api/tasks/${id}/preview`)).text();
  assert.check(enabledTitlePreview.includes('已关闭标题')&&!/<img[^>]*class="novvy-hud-dragon/.test(enabledTitlePreview),'重新勾选标题可恢复原文案，无需启用立绘图片');
  await api(`/api/tasks/${id}`,{config:{hud:{enabled:false,titleEnabled:false}}},'PATCH');
  const disabledHudPreview=await(await fetch(base+`/api/tasks/${id}/preview`)).text();
  assert.check(!disabledHudPreview.includes('id="novvy-training-hud"'),'两个顶部开关都关闭时不注入顶部 HUD');
  const paletteSaved=await api(`/api/tasks/${id}`,{config:{hud:progressPalette}},'PATCH');
  assert.equal(paletteSaved.body.config.hud.progressTextColor,'#7d315c','进度颜色设置可以保存');
  const palettePreview=await(await fetch(base+`/api/tasks/${id}/preview`)).text();
  assert.check(palettePreview.includes('--colorever-progress-fill:#e76b3f')&&palettePreview.includes('--colorever-progress-track:#f5dfbd'),'自定义进度颜色进入即时预览');
  await api(`/api/tasks/${id}/run`,{step:'all'});
  const paletteOutput=await(await fetch(base+`/result/${id}/index.html`)).text();
  assert.check(paletteOutput.includes('--colorever-progress-text:#7d315c')&&paletteOutput.includes('--colorever-progress-fill:#e76b3f')&&paletteOutput.includes('--colorever-progress-track:#f5dfbd'),'自定义进度颜色进入交付包');
  assert.equal(fs.readFileSync(path.join(root,'result',id,'game.js'),'utf8'),js,'换图复用同一引擎');
  const exported=await fetch(base+`/api/tasks/${id}/export`),bytes=new Uint8Array(await exported.arrayBuffer());assert.check(exported.status===200&&bytes[0]===80&&bytes[1]===75,'ZIP 导出成功');
  const catalog=await(await fetch(base+'/api/colorever-options')).json();assert.equal(catalog.map(p=>p.id),['cat','house','axe','torch'],'广告项目只列出已构建的成品选项');
  assert.check(!catalog[0].editableParts,'广告项目不公开作者编辑参数');
  for(const patternId of ['axe','torch']){
   const selected=await api(`/api/tasks/${id}`,{config:{patternId}},'PATCH');assert.equal(selected.body.config.patternId,patternId,'任务可选择新增图案');
   const response=await fetch(base+`/api/tasks/${id}/preview`),text=await response.text();
   assert.check(response.status===200&&text.includes(`__COLOREVER_PATTERN_ID__="${patternId}"`),'新增图案即时预览');
   const built=await api(`/api/tasks/${id}/run`,{step:'all'});assert.check(built.status===200&&built.body.every(r=>r.ok),'新增图案六步构建通过');
   const output=await(await fetch(base+`/result/${id}/index.html`)).text();assert.check(output.includes(`__COLOREVER_PATTERN_ID__="${patternId}"`),'交付包含新增图案');
   assert.check(coloreverLevel(templateRoot,{patternId},template).level.openingMode==='easy','新增图案使用固定简易开局');
  }
  await api(`/api/tasks/${id}`,{config:{patternId:'house'}},'PATCH');
  const before=coloreverLevel(templateRoot,{patternId:'house'},template).level;
  await api(`/api/tasks/${id}`,{config:{openingMode:'easy',seed:99,capacity:4}},'PATCH');
  assert.equal(coloreverLevel(templateRoot,{patternId:'house'},template).level,before,'广告任务不能改变固定开局和玩法参数');
  const oldRead=await fetch(base+'/api/colorever-patterns/cat');assert.equal(oldRead.status,404,'删除 Wholehouse 图案编辑读取接口');
  const oldWrite=await api('/api/colorever-patterns/house',custom(),'PUT');assert.equal(oldWrite.status,404,'删除 Wholehouse 模板写入接口');
  const oldPreview=await api('/api/colorever-patterns/cat/preview',custom(),'POST');assert.equal(oldPreview.status,404,'删除 Wholehouse 草稿预览接口');
  const authorUi=await fetch(base+'/colorever-patterns.html');assert.equal(authorUi.status,404,'Wholehouse 不再提供模板制作页面');
  const taskUi=await(await fetch(base+'/task-colorever-new.js')).text();assert.check(!taskUi.includes('colorever-patterns.html')&&!taskUi.includes('createImageBitmap'),'广告任务没有图案制作入口');
  assert.check(!fs.existsSync(path.join(templateRoot,'logic'))&&!fs.existsSync(path.join(templateRoot,'patterns')),'交付模板不携带图案生成器和装饰源码');
  await api(`/api/tasks/${id}`,{config:{cta:{enabled:true,destinationUrl:'javascript:bad()'}}},'PATCH');
  const unsafePreview=await fetch(base+`/api/tasks/${id}/preview`);assert.equal(unsafePreview.status,200,'Colorever 不消费 CTA 自定义地址');
  const sdkOnlyPreview=await unsafePreview.text();assert.check(!sdkOnlyPreview.includes('javascript:bad()')&&sdkOnlyPreview.includes('__COLOREVER_CTA_URL__=""'),'CTA 交付只使用 SDK 跳转，不注入自定义地址');
 }finally{if(id)deleteTask(id);await new Promise(resolve=>server.close(resolve));}
}
