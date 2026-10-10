import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from '../server.mjs';
import {getEntry} from '../core/registry.mjs';
import {deleteTask,configWhitelistFor,stepInputFilesFor} from '../lib/store.mjs';
import {taskGeneratedDir,taskResultDir} from '../lib/paths.mjs';
import {execFile} from '../core/lib/exec.mjs';
import {coloreverLevel as oldLevel} from '../plugins/colorever/lib.mjs';
import {coloreverLevel as newLevel} from '../plugins/colorever-new/lib.mjs';
import {embeddedAudio} from '../plugins/colorever-new/music.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export default async function run(assert){
  const old=getEntry('colorever'),next=getEntry('colorever-new');
  const originalScript=fs.readFileSync(path.join(old.templateDir,'game/game.js'),'utf8');
  const newScript=fs.readFileSync(path.join(next.templateDir,'game/game.js'),'utf8');
  assert.check(old.templateDir!==next.templateDir&&old.dir!==next.dir,'新旧模板与插件目录独立');
  for(const key of ['defaults','steps','uploads','overlays','background','patterns'])assert.equal(next.plugin[key],old.plugin[key],`兼容原版 ${key}`);
  assert.equal([...configWhitelistFor(next.id)],[...configWhitelistFor(old.id)],'配置保存白名单一致');
  assert.equal(stepInputFilesFor(next.id),stepInputFilesFor(old.id),'步骤输入与过期依赖一致');
  const catalog=JSON.parse(fs.readFileSync(path.join(old.templateDir,'game/patterns/catalog.json'),'utf8'));
  const newCatalog=JSON.parse(fs.readFileSync(path.join(next.templateDir,'game/patterns/catalog.json'),'utf8'));
  assert.equal(newCatalog.patterns,catalog.patterns,'全部图案 ID、名称、数据校验值一致');
  assert.check(fs.readFileSync(path.join(next.templateDir,'game/level-engine.mjs')).equals(fs.readFileSync(path.join(old.templateDir,'game/level-engine.mjs'))),'开局引擎逐字节一致');
  assert.equal(embeddedAudio(newScript).audio,embeddedAudio(originalScript).audio,'全部音乐与音效一致');
  for(const picture of catalog.patterns){
    assert.check(fs.readFileSync(path.join(next.templateDir,'game/patterns',picture.level)).equals(fs.readFileSync(path.join(old.templateDir,'game/patterns',picture.level))),`图案数据逐字节一致：${picture.id}`);
    for(const mode of ['easy','medium','scattered']){
      const config={patternId:picture.id,opening:{mode,seed:7,difficulty:21}};
      const a=await oldLevel(old.templateDir,config,old.template),b=await newLevel(next.templateDir,config,next.template);
      assert.equal(b,a,`同参数产生相同开局与解法：${picture.id}/${mode}`);
    }
  }

  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`,ids=[],temp=fs.mkdtempSync(path.join(os.tmpdir(),'colorever-new-'));
  const api=async(url,body,method='POST')=>{
    const res=await fetch(base+url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    return {status:res.status,body:await res.json()};
  };
  try{
    const listed=await(await fetch(base+'/api/templates')).json();
    assert.check(listed.some(x=>x.id===old.id)&&listed.some(x=>x.id===next.id),'editor 同时列出新旧版本');
    const options=await(await fetch(base+'/api/colorever-options?templateId=colorever-new')).json();
    assert.equal(options.map(x=>x.id),catalog.patterns.map(x=>x.id),'新工作台列出相同的全部图案');
    const legacyOptions=await(await fetch(base+'/api/colorever-options')).json();
    assert.equal(options,legacyOptions,'原版图案接口保持兼容');
    const created=await api('/api/tasks',{name:'colorever-new-test-'+Date.now(),templateId:next.id});
    assert.equal(created.status,201,'创建独立的新版本任务');
    const id=created.body.id;ids.push(id);const url=`/api/tasks/${id}`;
    const patch=config=>api(url,{config},'PATCH');
    let result=await api(url+'/run',{step:'all'});
    assert.check(result.status===200&&result.body.length===7&&result.body.every(x=>x.ok),'默认七步制作流程通过');
    assert.check((await patch({level:{width:1}})).status>=400,'沿用原版禁止任务修改图案数据的规则');
    assert.check((await patch({patternId:'unknown'})).status>=400,'拒绝未知图案');
    assert.check((await patch({music:{source:'invalid'}})).status>=400,'拒绝未知音乐来源');
    const config={patternId:'orange-pixel-cat',opening:{mode:'scattered',difficulty:12,seed:163},hud:{enabled:false,titleEnabled:true,titleLine1:'宝石拼图',progressFillColor:'#e76b32'},playableCta:{mode:'steps',afterSteps:8},cta:{takeoverText:'继续挑战',takeoverActionText:'立即体验'}};
    const saved=await patch(config);
    assert.equal(saved.body.config.patternId,config.patternId,'沿用原图案 ID');
    assert.equal(saved.body.config.opening,config.opening,'保存原版开局配置');
    assert.check(!saved.body.steps.level&&!saved.body.steps.pack,'修改开局使关卡和打包过期');
    await patch({hud:{titleLine2:'目标颜色始终可见'}});
    const deepSaved=await(await fetch(base+url)).json();
    assert.check(deepSaved.config.hud.titleLine1==='宝石拼图'&&deepSaved.config.hud.titleLine2==='目标颜色始终可见','逐字段保存保留兄弟字段');
    const preview=await(await fetch(base+url+'/preview')).text();
    assert.check(preview.includes('/templates/colorever-new/game/game.js')&&preview.includes('__COLOREVER_PATTERN_ID__="orange-pixel-cat"')&&preview.includes('data-novvy-fixed-viewport'),'即时预览使用新引擎、原版数据与视口约束');
    assert.check(preview.includes('宝石拼图')&&preview.includes('--colorever-progress-fill:#e76b32'),'HUD 文案和配色兼容');
    result=await api(url+'/run',{step:'all'});
    assert.check(result.body.every(x=>x.ok),'原版配置在新版本七步通过');
    const generated=JSON.parse(fs.readFileSync(path.join(taskGeneratedDir(id),'level.json'),'utf8'));
    assert.equal(generated,(await oldLevel(old.templateDir,config,old.template)).level,'广告任务实际生成的关卡与原版一致');
    assert.equal(generated.capacity,48,'保持原图案的 48 格缓存');
    assert.equal(fs.readFileSync(path.join(taskResultDir(id),'game.js'),'utf8'),newScript,'交付新视觉引擎');

    const music=fs.readFileSync(path.join(root,'template-core/colorever/public/audio/pickup.mp3'));
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
    await patch({intro:{enabled:true},outro:{enabled:true},hud:{enabled:true,titleEnabled:true},background:{enabled:true,source:'video-first',blurSigma:2},secondPlayable:{enabled:true,patternId:'house',opening:{mode:'medium',seed:23,difficulty:21},background:{enabled:true,source:'video-last',blurSigma:2},cta:{mode:'steps',afterSteps:5}}});
    result=await api(url+'/run',{step:'all'});
    assert.check(result.status===200&&result.body.every(x=>x.ok),'片头、HUD、双背景、片尾、第二关完整流程通过');
    const task=await(await fetch(base+url)).json();
    const second=JSON.parse(fs.readFileSync(path.join(taskGeneratedDir(id),'level2.json'),'utf8'));
    assert.equal(second,(await oldLevel(old.templateDir,{patternId:'house',opening:task.config.secondPlayable.opening},old.template)).level,'第二关数据与原版一致');
    const packed=fs.readFileSync(path.join(taskResultDir(id),'index.html'),'utf8');
    assert.check(packed.includes('data-novvy-outro')&&packed.includes('__COLOREVER_PHASE2__')&&packed.includes('background2.webp')&&packed.includes('data-novvy-cta-bridge'),'沿用视频、换关、背景和 CTA 注入');
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
    assert.equal(fs.readFileSync(path.join(old.templateDir,'game/game.js'),'utf8'),originalScript,'全部操作未修改原版引擎');
  }finally{
    for(const id of ids)deleteTask(id);
    fs.rmSync(temp,{recursive:true,force:true});
    await new Promise(resolve=>server.close(resolve));
  }
}
