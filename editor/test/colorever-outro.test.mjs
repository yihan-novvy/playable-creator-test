import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createServer} from '../server.mjs';
import {deleteTask, readTask} from '../lib/store.mjs';
import {execFile} from '../core/lib/exec.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const overlay=path.join(root,'editor/plugins/colorever/overlays');
function node(){
 const listeners=new Map();
 return {hidden:true,textContent:'',classList:{add(){}},setAttribute(){},addEventListener:(name,fn)=>listeners.set(name,fn),emit:(name,event={})=>listeners.get(name)?.(event)};
}
function playback({enabled=true,rejectPlay=false}={}){
 const listeners=new Map(),nodes=Object.fromEntries(['novvy-video-outro','novvy-outro-video','novvy-outro-sound','novvy-outro-play','novvy-cta','novvy-cta-btn','reset'].map(id=>[id,node()]));
 const video=nodes['novvy-outro-video'];
 let plays=0,opens=0,resets=0,pauses=0;
 const timers=[];
 video.currentTime=0;video.paused=true;video.muted=false;
 video.play=()=>{plays++;video.paused=rejectPlay;return rejectPlay?Promise.reject(new Error('blocked')):Promise.resolve();};
 video.pause=()=>{video.paused=true;pauses++;};
 nodes.reset.click=()=>resets++;
 const document={hidden:false,readyState:'complete',getElementById:id=>nodes[id],addEventListener:(name,fn)=>listeners.set('document:'+name,[fn])};
 const window={__novvyOutroEnabled:enabled,__novvyBridgeVersion:1,__novvyViewable:true,novvy:{open:()=>opens++},addEventListener:(name,fn)=>listeners.set(name,[...(listeners.get(name)||[]),fn]),dispatchEvent:event=>{for(const fn of listeners.get(event.type)||[])fn(event);}};
 const sandbox={document,window,setTimeout:fn=>timers.push(fn),CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}}};
 vm.runInNewContext(fs.readFileSync(path.join(overlay,'cta/cta.js'),'utf8'),sandbox);
 if(enabled)vm.runInNewContext(fs.readFileSync(path.join(overlay,'outro/outro.js'),'utf8'),sandbox);
 return {nodes,document,video,window,timers,counts:()=>({plays,opens,resets,pauses}),emit:(name,detail)=>window.dispatchEvent({type:name,detail})};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

export default async function run(assert){
 const p=playback();
 assert.equal(p.counts().plays,0,'片尾在页面加载时不播放');
 p.emit('novvy:hud-progress',{percent:100,correct:270,total:270});
 assert.check(p.nodes['novvy-video-outro'].hidden&&p.counts().plays===0,'达到 100% 时等待完成效果，不提前播放');
 p.emit('novvy:victory');await flush();
 assert.check(!p.nodes['novvy-video-outro'].hidden&&p.counts().plays===1,'效果结束后的胜利事件触发片尾');
 assert.equal([p.counts().opens,p.timers.length],[0,0],'片尾播放前不跳转、不安排重开');
 p.emit('novvy:victory');await flush();
 assert.equal(p.counts().plays,1,'重复胜利事件不会重播或打断片尾');
 p.emit('novvy:viewablechange',{viewable:false});
 assert.check(p.video.paused,'广告不可见时暂停片尾');
 p.emit('novvy:viewablechange',{viewable:true});await flush();
 assert.equal(p.counts().plays,2,'广告恢复可见后继续播放');
 p.document.hidden=true;p.emit('document:visibilitychange');
 assert.check(p.video.paused,'页面进入后台时暂停片尾');
 p.document.hidden=false;p.emit('document:visibilitychange');await flush();
 p.video.emit('ended');
 assert.check(p.nodes['novvy-video-outro'].hidden&&p.counts().opens===1,'片尾结束后才执行已有 CTA 跳转');
 assert.equal(p.counts().resets,0,'播放结束前后均不会立即重开');
 p.timers[0]();assert.equal(p.counts().resets,1,'片尾结束后按原来的延时重开');
 p.video.emit('ended');assert.equal(p.counts().opens,1,'重复结束事件只转化一次');
 p.emit('novvy:hud-progress',{percent:80});p.emit('novvy:victory');await flush();
 assert.check(!p.nodes['novvy-video-outro'].hidden,'新一局完成后允许再次播放片尾');
 const bare=playback({enabled:false});bare.emit('novvy:victory');
 assert.equal(bare.counts().opens,1,'未设置片尾时保留原来的完成跳转');
 const blocked=playback({rejectPlay:true});blocked.emit('novvy:victory');await flush();
 assert.check(blocked.video.muted&&!blocked.nodes['novvy-outro-play'].hidden,'自动播放被拒绝时提供播放按钮');
 assert.equal(blocked.counts().opens,0,'播放被阻止时不提前跳转');
 blocked.video.emit('error');
 assert.check(blocked.nodes['novvy-video-outro'].hidden&&blocked.counts().opens===1,'视频解码错误时退出片尾并继续完成流程');

 const {GameAudio}=await import('../../template-core/colorever/src/game-audio.js');
 const previous={document:globalThis.document,window:globalThis.window};
 const audioEvents=new Map();let bgmPlays=0,bgmPauses=0;
 try{
  globalThis.window={addEventListener:(name,fn)=>audioEvents.set(name,fn)};
  globalThis.document={hidden:false,getElementById:()=>null,body:{append(){}},createElement:()=>({dataset:{},paused:true,addEventListener(){},play(){bgmPlays++;return Promise.resolve();},pause(){bgmPauses++;}})};
  const audio=new GameAudio();audio.unlock();
  audioEvents.get('novvy:outro-started')();audio.unlock();
  assert.equal([bgmPlays,bgmPauses],[1,1],'片尾阶段暂停游戏背景音乐，点击不会重新播放 BGM');
  audioEvents.get('novvy:outro-finished')();assert.equal(bgmPlays,2,'片尾结束后恢复游戏音乐逻辑');
 }finally{for(const [key,value]of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}

 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'colorever-outro-'));
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;let id;
 const api=async(url,body,method='POST')=>{const res=await fetch(base+url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return{status:res.status,body:await res.json()};};
 try{
  const created=await api('/api/tasks',{name:'outro-test-'+Date.now(),templateId:'colorever'});id=created.body.id;
  const patched=await api(`/api/tasks/${id}`,{config:{outro:{enabled:true}}},'PATCH');
  assert.check(patched.body.config.outro.enabled,'片尾设置可以保存');
  let built=await api(`/api/tasks/${id}/run`,{step:'all'});
  assert.check(built.status===200&&built.body.length===6&&built.body.every(r=>r.ok)&&built.body.find(r=>r.stepId==='outro').metrics.skipped,'未上传片尾时整个构建流程可正常跳过');
  let preview=await(await fetch(base+`/api/tasks/${id}/preview`)).text();
  assert.check(!preview.includes('id="novvy-video-outro"')&&preview.includes('__novvyOutroEnabled=false'),'未上传时预览不注入片尾，也不拦截完成流程');
  const bad=await fetch(base+`/api/tasks/${id}/uploads/outro-video`,{method:'PUT',headers:{'Content-Type':'video/mp4'},body:'invalid video content with no mp4 signature'});
  assert.equal(bad.status,415,'片尾上传校验 MP4 文件内容');
  const videoPath=path.join(temp,'outro.mp4');
  await execFile('ffmpeg',['-y','-f','lavfi','-i','color=c=blue:s=32x32:r=5:d=1','-c:v','libx264','-pix_fmt','yuv420p',videoPath]);
  const bytes=fs.readFileSync(videoPath);
  const uploaded=await fetch(base+`/api/tasks/${id}/uploads/outro-video`,{method:'PUT',headers:{'Content-Type':'video/mp4'},body:bytes});
  assert.equal(uploaded.status,200,'支持上传片尾 MP4');
  assert.check(!readTask(id).steps.outro&&!readTask(id).steps.pack,'上传片尾后校验与旧打包状态失效');
  built=await api(`/api/tasks/${id}/run`,{step:'all'});
  assert.check(built.status===200&&built.body.every(r=>r.ok)&&built.body.find(r=>r.stepId==='outro').metrics.durationSec>0,'片尾视频进入有效性校验与完整构建');
  assert.equal(built.body.find(r=>r.stepId==='pack').metrics.packageFiles,['game.js','index.html','outro-video.mp4'],'交付包包含可选片尾视频');
  preview=await(await fetch(base+`/api/tasks/${id}/preview`)).text();
  assert.check(preview.includes('id="novvy-video-outro" hidden')&&preview.includes(`/project/${id}/uploads/outro-video.mp4`),'即时预览注入隐藏片尾，使用相同的上传视频');
  const packed=await(await fetch(base+`/result/${id}/index.html`)).text();
  assert.check(packed.includes('__novvyOutroEnabled=true')&&packed.includes('src="outro-video.mp4"'),'交付包启用片尾时引用包内视频');
  const delivered=new Uint8Array(await(await fetch(base+`/result/${id}/outro-video.mp4`)).arrayBuffer());
  assert.check(Buffer.from(delivered).equals(bytes),'打包片尾保留完整视频内容');
  await api(`/api/tasks/${id}`,{config:{outro:{enabled:false}}},'PATCH');
  built=await api(`/api/tasks/${id}/run`,{step:'all'});
  assert.equal(built.body.find(r=>r.stepId==='pack').metrics.packageFiles,['game.js','index.html'],'关闭片尾后不再打入视频');
  await api(`/api/tasks/${id}`,{config:{outro:{enabled:true}}},'PATCH');
  await api(`/api/tasks/${id}/run`,{step:'all'});
  const removed=await fetch(base+`/api/tasks/${id}/uploads/outro-video`,{method:'DELETE'});
  assert.equal(removed.status,200,'可以移除片尾视频');
  assert.check(!readTask(id).steps.outro&&!readTask(id).steps.pack,'移除片尾后旧打包状态失效');
  built=await api(`/api/tasks/${id}/run`,{step:'all'});
  assert.check(built.body.every(r=>r.ok)&&built.body.find(r=>r.stepId==='outro').metrics.skipped,'移除后构建恢复到无片尾模式');
 }finally{if(id)deleteTask(id);await new Promise(resolve=>server.close(resolve));fs.rmSync(temp,{recursive:true,force:true});}
}
