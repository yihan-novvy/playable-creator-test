import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {createServer} from '../server.mjs';
import {deleteTask,stepInputFilesFor} from '../lib/store.mjs';
import {loadTemplate,templateSteps,stepPrerequisites,runStep} from '../core/runner.mjs';
import {coloreverHtml,coloreverLevel,coloreverPatterns} from '../plugins/colorever/lib.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const custom=()=>({name:'Custom house </script><script>bad()</script>',width:8,height:6,colors:{10:'#123456',20:'#fedcba',30:'#ff0055'},target:Array.from({length:48},(_,i)=>i<8?0:i%3===0?10:i%3===1?20:30),capacity:12,trayCols:4,difficulty:10,seed:7,decoration:'none'});
export default async function run(assert){
 const templateRoot=path.join(root,'editor/templates/colorever'),template=loadTemplate(templateRoot);
 assert.equal(templateSteps(template),['intro','hud','background','level','pack'],'独立五步流程');
 assert.equal(await stepPrerequisites('pack',{},template),{uploads:[],generated:['level.json']},'关闭叠层时只依赖自己的关卡');
 assert.check(stepInputFilesFor('colorever').level.length===0,'图案只消费构建产物');
 const gameDir=path.join(templateRoot,'game'),html=fs.readFileSync(path.join(gameDir,'index.html'),'utf8'),js=fs.readFileSync(path.join(gameDir,'game.js'),'utf8');new vm.Script(js);
 assert.check(!/type="module"|crossorigin|成品参考|reference-kitty-source/.test(html),'基础壳适合本地直开且无参考图片');
 assert.check(html.includes('<script src="game.js" defer></script>')&&html.includes('<style>'),'相对经典脚本入口与内联样式');
 const audio=JSON.parse(js.match(/^globalThis\.__COLOREVER_OFFLINE_AUDIO__=(.*);\n/)[1]);
 assert.equal(Object.keys(audio).sort(),['bgm','pickup','place','place-single','store','store-move','success'].sort(),'全部七个音频嵌入');
 assert.check(js.includes('__COLOREVER_LEVEL__')&&js.includes('novvy:victory')&&js.includes('novvy:hud-progress')&&js.includes('novvy:intro-finished'),'数据读取、完成、进度与片头音频契约进入引擎');
 const {level}=coloreverLevel(templateRoot,{patternId:'house'},template);
 level.name=custom().name;
 const injection=coloreverHtml({root:templateRoot,overlaysRoot:path.join(root,'editor/plugins/colorever'),template,level,config:{hud:{enabled:true},intro:{enabled:true},background:{enabled:true},cta:{enabled:true,destinationUrl:'https://example.com/app'}},media:{hudLeft:'left.webp',hudRight:'right.webp',introVideo:'video.mp4',introPoster:'poster.webp',background:'background.webp',ctaIcon:'app-icon.png'}}).html;
 for(const marker of ['id="novvy-video-intro"','id="novvy-training-hud"','id="novvy-dom-bg"','id="novvy-cta"','data-novvy-analytics','__COLOREVER_CTA_URL__'])assert.check(injection.includes(marker),`叠层 ${marker} 注入`);
 assert.check(injection.includes('\\u003c/script>')&&!injection.includes('<script>bad()'),'作者字段不能逃逸内联脚本');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'colorever-media-test-'));
 try{
  const generated=path.join(temp,'generated');fs.mkdirSync(generated);fs.mkdirSync(path.join(temp,'uploads'));
  fs.writeFileSync(path.join(generated,'level.json'),JSON.stringify(coloreverLevel(templateRoot,{patternId:'house'},template).level));
  for(const name of ['hud-left.webp','hud-right.webp','background.webp','poster.webp'])fs.copyFileSync(path.join(root,'editor/plugins/colorever/overlays/cta/icon.png'),path.join(generated,name));
  fs.writeFileSync(path.join(temp,'uploads/intro-video.mp4'),'fixture');
  const result=await runStep({taskId:'fixture',templateRoot,scriptsRoot:path.join(root,'editor/core/scripts'),projectRoot:temp,resultRoot:path.join(temp,'dist'),stepId:'pack',config:{patternId:'house',intro:{enabled:true},hud:{enabled:true},background:{enabled:true},cta:{enabled:true}}});
  assert.check(result.ok,`全叠层打包成功 ${result.error||''}`);
  assert.equal(result.metrics.packageFiles,['app-icon.png','background.webp','game.js','hud-left.webp','hud-right.webp','index.html','poster.webp','tail-ad-video.mp4'],'所有已启用素材进入平铺交付包');
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
  let results=await api(`/api/tasks/${id}/run`,{step:'all'});assert.check(results.status===200&&results.body.length===5&&results.body.every(r=>r.ok),'默认猫咪五步全部通过');
  const patch=await api(`/api/tasks/${id}`,{config:{patternId:'house'}},'PATCH');assert.equal(patch.body.config.patternId,'house','任务保存固定图案 ID');
  assert.check(!patch.body.steps.level&&!patch.body.steps.pack,'选择图案使校验和打包失效');
  const rejected=await api(`/api/tasks/${id}`,{config:{level:custom()}},'PATCH');assert.check(rejected.status>=400,'任务不能编辑图案数据');
  const unknown=await api(`/api/tasks/${id}`,{config:{patternId:'unknown'}},'PATCH');assert.check(unknown.status>=400,'任务不能选择未知图案');
  const preview=await fetch(base+`/api/tasks/${id}/preview`),previewText=await preview.text();assert.equal(preview.status,200,'固定小屋即时预览');
  assert.check(previewText.includes('src="/templates/colorever/game/game.js"')&&previewText.includes('"width":20')&&previewText.includes('__COLOREVER_PATTERN_ID__="house"'),'预览注入小屋完整模板');
  results=await api(`/api/tasks/${id}/run`,{step:'all'});assert.check(results.status===200&&results.body.every(r=>r.ok),'小屋模板五步通过');
  assert.check(results.body.find(r=>r.stepId==='level').metrics.solvable,'实际解法回放验证完成');
  const packed=await(await fetch(base+`/result/${id}/index.html`)).text();assert.check(packed.includes('"width":20')&&packed.includes('__COLOREVER_PATTERN_ID__="house"'),'交付选择相同图案模块');
  assert.equal(fs.readFileSync(path.join(root,'result',id,'game.js'),'utf8'),js,'换图复用同一引擎');
  const exported=await fetch(base+`/api/tasks/${id}/export`),bytes=new Uint8Array(await exported.arrayBuffer());assert.check(exported.status===200&&bytes[0]===80&&bytes[1]===75,'ZIP 导出成功');
  const catalog=await(await fetch(base+'/api/colorever-options')).json();assert.equal(catalog.map(p=>p.id),['cat','house'],'广告项目只列出已构建的成品选项');
  assert.check(!catalog[0].editableParts,'广告项目不公开作者编辑参数');
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
  const unsafePreview=await fetch(base+`/api/tasks/${id}/preview`);assert.equal(unsafePreview.status,500,'非法 CTA 地址不能进入预览');
 }finally{if(id)deleteTask(id);await new Promise(resolve=>server.close(resolve));}
}
