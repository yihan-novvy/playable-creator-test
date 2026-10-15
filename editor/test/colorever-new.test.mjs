import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createServer} from '../server.mjs';
import {getEntry} from '../core/registry.mjs';
import {deleteTask,readTask,configWhitelistFor,stepInputFilesFor} from '../lib/store.mjs';
import {taskGeneratedDir,taskResultDir,taskUploadsDir} from '../lib/paths.mjs';
import {execFile} from '../core/lib/exec.mjs';
import {coloreverLevel as newLevel} from '../plugins/colorever-new/lib.mjs';
import {embeddedAudio} from '../plugins/colorever-new/music.mjs';
import {normalizeOpening} from '../plugins/colorever-new/lib.mjs';
import {createPuzzle,prepareLevel as prepareShippingLevel} from '../../template-core/colorever-new/src/game-level.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export default async function run(assert){
  const next=getEntry('colorever-new');
  assert.equal(normalizeOpening({mode:'scattered',seed:17,speed:3}),{mode:'medium',coverage:95,batchSize:30,seed:17},'旧零散配置转为全局，测试速度不进入正式开局配置');
  const workbench=fs.readFileSync(path.join(next.dir,'workbench.js'),'utf8');
  assert.check(workbench.includes('全局大块归位')&&!workbench.includes("['scattered',")&&!workbench.includes('测试搬运速度'),'正式 editor 仅展示两种模式，无测试调速控件');
  const newScript=fs.readFileSync(path.join(next.templateDir,'game/game.js'),'utf8');
  // 白名单与步骤输入沿用 colorever 家族契约(纯 store 层字符串映射,不依赖注册表)。
  assert.equal([...configWhitelistFor(next.id)],[...configWhitelistFor('colorever')],'配置保存白名单沿用家族契约');
  assert.equal(stepInputFilesFor(next.id),stepInputFilesFor('colorever'),'步骤输入与过期依赖沿用家族契约');
  const catalog=JSON.parse(fs.readFileSync(path.join(next.templateDir,'game/patterns/catalog.json'),'utf8'));
  assert.check(!newScript.includes('"target":')&&!newScript.includes('"openingMode"')&&!newScript.includes('"colors":'),'引擎包不再内嵌图案数据');
  assert.equal(Object.keys(embeddedAudio(newScript).audio).length,7,'七段音乐与音效随包');
  assert.check(createHash('sha256').update(fs.readFileSync(path.join(next.templateDir,'game/level-engine.mjs'),'utf8')).digest('hex')===catalog.levelEngineSha256,'开局引擎校验值一致');
  assert.check(catalog.decorators&&typeof catalog.decorators==='object'&&Object.keys(catalog.decorators).length===catalog.patterns.length,'装饰片段清单与图案一一对应');
  for(const [decoratorId,meta] of Object.entries(catalog.decorators)){
    assert.check(/^decorators\/[-a-z0-9]+\.js$/.test(meta.file)&&createHash('sha256').update(fs.readFileSync(path.join(next.templateDir,'game',meta.file),'utf8')).digest('hex')===meta.sha256,`装饰片段在盘且校验值一致：${decoratorId}`);
  }
  for(const picture of catalog.patterns){
    const text=fs.readFileSync(path.join(next.templateDir,'game/patterns',picture.level),'utf8');
    assert.check(text.length>2&&createHash('sha256').update(text).digest('hex')===picture.templateSha256,`图案数据在盘且校验值一致：${picture.id}`);
  }

  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`,ids=[],temp=fs.mkdtempSync(path.join(os.tmpdir(),'colorever-new-'));
  const api=async(url,body,method='POST')=>{
    const res=await fetch(base+url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    return {status:res.status,body:await res.json()};
  };
  try{
    const listed=await(await fetch(base+'/api/templates')).json();
    assert.check(listed.some(x=>x.id==='colorever-abandoned')&&listed.some(x=>x.id===next.id),'editor 同时列出废弃版(改名后仍注册)与新版');
    const options=await(await fetch(base+'/api/colorever-options?templateId=colorever-new')).json();
    assert.equal(options.map(x=>x.id),catalog.patterns.map(x=>x.id),'新工作台列出相同的全部图案');
    const legacyOptions=await(await fetch(base+'/api/colorever-options')).json();
    assert.equal(options,legacyOptions,'遗留无参图案接口默认指向在线模板');
    const created=await api('/api/tasks',{name:'colorever-new-test-'+Date.now(),templateId:next.id});
    assert.equal(created.status,201,'创建独立的新版本任务');
    const id=created.body.id;ids.push(id);const url=`/api/tasks/${id}`;
    const patch=config=>api(url,{config},'PATCH');
    let result=await api(url+'/run',{step:'all'});
    assert.check(result.status===200&&result.body.length===7&&result.body.every(x=>x.ok),'默认七步制作流程通过');
    assert.check((await patch({level:{width:1}})).status>=400,'沿用原版禁止任务修改图案数据的规则');
    assert.check((await patch({patternId:'unknown'})).status>=400,'拒绝未知图案');
    assert.check((await patch({music:{source:'invalid'}})).status>=400,'拒绝未知音乐来源');
    const config={patternId:'orange-pixel-cat',opening:{mode:'medium',coverage:90,batchSize:24,seed:163},hud:{enabled:false,titleEnabled:true,titleLine1:'宝石拼图',progressFillColor:'#e76b32'},playableCta:{mode:'steps',afterSteps:8},cta:{takeoverText:'继续挑战',takeoverActionText:'立即体验'}};
    const saved=await patch(config);
    assert.equal(saved.body.config.patternId,config.patternId,'沿用原图案 ID');
    assert.equal(saved.body.config.opening,config.opening,'保存全局开局配置');
    assert.check(!saved.body.steps.level&&!saved.body.steps.pack,'修改开局使关卡和打包过期');
    await patch({hud:{titleLine2:'目标颜色始终可见'}});
    const deepSaved=await(await fetch(base+url)).json();
    assert.check(deepSaved.config.hud.titleLine1==='宝石拼图'&&deepSaved.config.hud.titleLine2==='目标颜色始终可见','逐字段保存保留兄弟字段');
    const preview=await(await fetch(base+url+'/preview')).text();
    assert.check(preview.includes('/templates/colorever-new/game/game.js')&&preview.includes('__COLOREVER_PATTERN_ID__="orange-pixel-cat"')&&preview.includes('data-novvy-fixed-viewport'),'即时预览使用新引擎、原版数据与视口约束');
    assert.check(preview.includes('data-colorever-decorators')&&preview.includes('__COLOREVER_DECORATORS__')&&preview.includes('["orange-pixel-cat"]=function'),'预览按所选图案注入装饰片段');
    await patch({patternId:'phoenix'});
    const phoenixPreview=await(await fetch(base+url+'/preview')).text();
    assert.check(phoenixPreview.includes('["phoenix"]=function')&&!phoenixPreview.includes('["orange-pixel-cat"]=function'),'真装饰图案只注入自身的装饰代码');
    await patch({patternId:'orange-pixel-cat'});
    assert.check(preview.includes('宝石拼图')&&preview.includes('--colorever-progress-fill:#e76b32'),'HUD 文案和配色兼容');
    result=await api(url+'/run',{step:'all'});
    assert.check(result.body.every(x=>x.ok),'原版配置在新版本七步通过');
    const generated=JSON.parse(fs.readFileSync(path.join(taskGeneratedDir(id),'level.json'),'utf8'));
    assert.check(Array.isArray(generated.opening)&&Array.isArray(generated.target)&&generated.target.length===generated.opening.length,'任务实际生成带开局的关卡');
    assert.equal(generated.capacity,48,'保持原图案的 48 格缓存');
    const shipping=prepareShippingLevel({...JSON.parse(fs.readFileSync(path.join(next.templateDir,'game/patterns/orange-pixel-cat.json'),'utf8')),openingMode:'medium',...config.opening});
    assert.equal(generated,shipping.level,'正式内置开局引擎与源码生成相同的全局关卡');
    assert.check(shipping.proof.metrics.wrongPercent>=90,'正式全局关卡达到配置的错位比例');
    const puzzle=createPuzzle(generated);
    for(const hint of shipping.proof.solution)assert.check(hint.action==='pick'?puzzle.pick(hint.region,hint.index):puzzle.place(hint.region,hint.index),'正式全局关卡按实际连通规则回放');
    assert.check(puzzle.complete,'正式全局关卡完成回放');
    assert.check(!preview.includes('__COLOREVER_PREVIEW__'),'正式预览不注入测试调速上下文');
    const legacy=await newLevel(next.templateDir,{...config,opening:{...config.opening,mode:'scattered',speed:3}},next.template);
    assert.equal(legacy.level,generated,'旧零散配置兼容全局模式，测试速度不改变正式关卡');
    assert.equal(fs.readFileSync(path.join(taskResultDir(id),'game.js'),'utf8'),newScript,'交付新视觉引擎');

    const music=fs.readFileSync(path.join(root,'template-core/colorever-new/public/audio/pickup.mp3'));
    let res=await fetch(base+url+'/uploads/background-music',{method:'PUT',headers:{'Content-Type':'audio/mpeg'},body:music});
    assert.equal(res.status,200,'新版本支持原版音乐上传槽位');
    const changed=await patch({music:{source:'custom'}});
    assert.check(changed.body.steps.level&&!changed.body.steps.pack,'音乐修改仅使打包过期');
    const musicPreview=await(await fetch(base+url+'/preview')).text();
    assert.check(musicPreview.includes(url+'/preview-game.js'),'自定义音乐即时预览流程一致');
    const changedScript=await(await fetch(base+url+'/preview-game.js')).text();
    assert.equal(embeddedAudio(changedScript).audio.bgm,music.toString('base64'),'新引擎嵌入任务音乐');
    assert.check(Buffer.from(await(await fetch(base+url+'/music')).arrayBuffer()).equals(music),'音乐试听一致');
    assert.check((await api(url+'/run',{step:'pack'})).body.ok,'自定义音乐打包通过');
    assert.equal(fs.readFileSync(path.join(taskResultDir(id),'game.js'),'utf8'),changedScript,'音乐预览脚本与交付逐字节一致');
    await fetch(base+url+'/uploads/background-music',{method:'DELETE'});
    const restored=await(await fetch(base+url)).json();
    assert.equal(restored.config.music.source,'original','删除音乐恢复原版来源');

    const video=path.join(temp,'video.mp4');
    await execFile('ffmpeg',['-y','-f','lavfi','-i','color=c=orange:s=64x96:r=5:d=1','-c:v','libx264','-pix_fmt','yuv420p',video]);
    const videoBytes=fs.readFileSync(video);
    for(const slot of ['intro-video','outro-video']){
      res=await fetch(base+url+'/uploads/'+slot,{method:'PUT',headers:{'Content-Type':'video/mp4'},body:videoBytes});
      assert.equal(res.status,200,`兼容视频槽位 ${slot}`);
    }
    await patch({intro:{enabled:true},outro:{enabled:true},hud:{enabled:true,titleEnabled:true},background:{enabled:true,source:'video-first',blurSigma:2},secondPlayable:{enabled:true,patternId:'house',opening:{mode:'medium',seed:23,coverage:95,batchSize:30},background:{enabled:true,source:'video-last',blurSigma:2},cta:{mode:'steps',afterSteps:5}}});
    result=await api(url+'/run',{step:'all'});
    assert.check(result.status===200&&result.body.every(x=>x.ok),'片头、HUD、双背景、片尾、第二关完整流程通过');
    const second=JSON.parse(fs.readFileSync(path.join(taskGeneratedDir(id),'level2.json'),'utf8'));
    assert.check(Array.isArray(second.opening)&&second.opening.length===second.target.length,'第二关生成带开局的数据');
    assert.check(second.openingMode==='medium'&&second.coverage===95&&second.batchSize===30,'第二关保留自己的全局开局参数');
    const packed=fs.readFileSync(path.join(taskResultDir(id),'index.html'),'utf8');
    assert.check(!packed.includes('__COLOREVER_PREVIEW__'),'交付 HTML 无测试速度上下文，运行使用基础速度');
    assert.check(packed.includes('data-novvy-outro')&&packed.includes('__COLOREVER_PHASE2__')&&packed.includes('background2.webp')&&packed.includes('data-novvy-cta-bridge'),'沿用视频、换关、背景和 CTA 注入');
    assert.check(packed.includes('data-colorever-decorators')&&packed.includes('["orange-pixel-cat"]=function')&&packed.includes('["house"]=function'),'双关各自的装饰片段去重注入');
    const beforeSwitch=readTask(id);
    const filesBeforeSwitch=[taskUploadsDir(id),taskGeneratedDir(id)].flatMap(dir=>fs.readdirSync(dir).map(name=>({file:path.join(dir,name),bytes:fs.readFileSync(path.join(dir,name))})));
    assert.equal((await api(url+'/template',{templateId:'colorever-abandoned'},'PATCH')).status,400,'废弃模板(新 id)不可切换');
    assert.equal((await api(url+'/template',{templateId:'colorever'},'PATCH')).status,400,'旧 id 已下线不可切换');
    assert.equal(readTask(id),beforeSwitch,'失败切换不改动项目');
    assert.check(filesBeforeSwitch.every(({file,bytes})=>fs.readFileSync(file).equals(bytes)),'失败切换不改写上传或生成文件');
    const live=await(await fetch(base+url+'/preview')).text();
    assert.check(live.includes('/templates/colorever-new/game/game.js')&&live.includes('__COLOREVER_PHASE2__')&&live.includes('background2.webp'),'即时试玩保留第二关与媒体');
    assert.equal(JSON.parse(fs.readFileSync(path.join(taskGeneratedDir(id),'level.json'),'utf8')),generated,'第一关开局保持一致');
    assert.equal(JSON.parse(fs.readFileSync(path.join(taskGeneratedDir(id),'level2.json'),'utf8')),second,'第二关开局保持一致');
    assert.check((await api(url+'/run',{step:'pack'})).body.ok,'复用关卡与媒体重新打包通过');
    assert.equal(fs.readFileSync(path.join(taskResultDir(id),'game.js'),'utf8'),newScript,'交付脚本与模板引擎一致');
    const same=await api(url+'/template',{templateId:'colorever-new'},'PATCH');
    assert.equal(same.body,readTask(id),'重复选择当前版本不改动项目或打包状态');
    const stable=readTask(id);
    assert.equal((await api(url+'/template',{templateId:'water-sort'},'PATCH')).status,400,'禁止切换到不兼容的其他游戏');
    assert.equal((await api(url+'/template',{templateId:'unknown'},'PATCH')).status,400,'禁止未知版本');
    assert.equal(readTask(id),stable,'失败切换不修改项目');
    const other=await api('/api/tasks',{name:'colorever-switch-other-'+Date.now(),templateId:'water-sort'});ids.push(other.body.id);
    assert.equal((await api(`/api/tasks/${other.body.id}/template`,{templateId:'colorever-abandoned'},'PATCH')).status,400,'其他游戏不支持跨模板切换');
    await patch({secondPlayable:{patternId:'unknown'}});
    const invalid=readTask(id);
    assert.equal((await api(url+'/run',{step:'level'})).status,422,'第二关图案不存在时关卡步骤拒绝');
    assert.equal(readTask(id).config,invalid.config,'图案不兼容时保留原配置');
    await patch({secondPlayable:{patternId:'house'}});
    await api(url+'/run',{step:'level'});await api(url+'/run',{step:'pack'});
    const zip=await fetch(base+url+'/export'),bytes=Buffer.from(await zip.arrayBuffer());
    assert.check(zip.ok&&bytes[0]===80&&bytes[1]===75,'完整流程 ZIP 导出通过');
    const archive=path.join(temp,'export.zip');fs.writeFileSync(archive,bytes);
    const listing=(await execFile('unzip',['-Z1',archive])).stdout.trim().split('\n').sort();
    assert.equal(listing,fs.readdirSync(taskResultDir(id)).sort(),'ZIP 文件与交付目录一致');
    await patch({cta:{takeoverText:'新的接管文案'}});
    const takeover=await(await fetch(base+url+'/preview?view=cta')).text();
    assert.check(takeover.includes('新的接管文案')&&takeover.includes("__novvyCtaCardPhase='takeover'"),'CTA 独立预览兼容');
    await fetch(base+url+'/uploads/outro-video',{method:'DELETE'});
    const removed=await(await fetch(base+url)).json();
    assert.check(!removed.steps.outro&&!removed.steps.background2&&!removed.steps.pack,'删除片尾使依赖步骤过期');
  }finally{
    for(const id of ids)deleteTask(id);
    fs.rmSync(temp,{recursive:true,force:true});
    await new Promise(resolve=>server.close(resolve));
  }
}
