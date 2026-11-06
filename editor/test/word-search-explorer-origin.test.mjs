import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {createServer} from '../server.mjs';
import {deleteTask} from '../lib/store.mjs';
export default async function test(a){
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`,tmp=fs.mkdtempSync(path.join(os.tmpdir(),'wse-test-'));let id;
 const request=(route,body,method='POST')=>fetch(base+route,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
  const created=await request('/api/tasks',{name:`word-search-test-${Date.now()}`,templateId:'word-search-explorer-origin'});a.equal(created.status,201,'template can create tasks');id=(await created.json()).id;const route='/api/tasks/'+id;
  let preview=await(await fetch(base+route+'/preview')).text();a.check(preview.includes('"allowReplay":false')&&preview.includes('id="novvy-cta"'),'default replay off and shell download card on');
  a.check(preview.includes('data:image/jpeg;base64,')&&preview.includes('<small>4.9</small>')&&preview.includes('data-novvy-click-source="cta_click"'),'card embeds the App Store icon, rating and standard banner attribution');
  const settings=html=>JSON.parse(html.match(/window\.WSE_CONFIG=(.*?);<\/script>/)[1]);
  a.equal(settings(preview).policy,{mode:'steps',afterSteps:4,intervals:[4,3,2],enabled:true},'default step policy is visible in preview');
  const initialConfig=(await(await fetch(base+route)).json()).config;
  for(const policy of [null,[],{enabled:'yes'},{mode:'complete'},{afterSteps:0},{afterSteps:100},{afterSteps:2.5},{intervals:[0]},{intervals:[1.5]},{intervals:Array(25).fill(1)},{unexpected:true}]){
   a.equal((await request(route,{config:{playableCta:policy}},'PATCH')).status,400,'reject invalid step policy '+JSON.stringify(policy));
  }
  a.equal((await(await fetch(base+route)).json()).config,initialConfig,'invalid policy leaves saved config intact');
  a.equal((await request(route,{config:{playableCta:{afterSteps:3,intervals:[2,1]}}},'PATCH')).status,200,'custom step thresholds save');
  await request(route,{config:{playableCta:{enabled:false}}},'PATCH');
  preview=await(await fetch(base+route+'/preview')).text();
  a.equal(settings(preview).policy,{mode:'steps',afterSteps:3,intervals:[2,1],enabled:false},'partial edit preserves policy and explicit disable');
  a.check(preview.includes('id="novvy-cta"'),'step policy is independent from download card');
  await request(route,{config:{playableCta:{enabled:true}}},'PATCH');
  const patch=await request(route,{config:{gameplay:{allowReplay:true},hud:{titleEnabled:true,titleLine1:'Test',titleLine2:'Second line'}}},'PATCH');a.equal(patch.status,200,'settings save');
  const saved=await(await fetch(base+route)).json();a.check(saved.config.gameplay.allowReplay&&saved.config.hud.titleLine2==='Second line','settings read back');
  a.equal((await request(route,{config:{levelId:2}},'PATCH')).status,400,'reject unsupported level');
  a.equal((await request(route,{config:{gameplay:{allowReplay:'yes'}}},'PATCH')).status,400,'reject invalid replay flag');
  const pack=async()=>{const r=await request(route+'/run',{step:'pack'});const j=await r.json();a.equal(r.status,200,`pack succeeds: ${j.error||''}`);return j;};
  const first=await pack();a.check(first.metrics.gameZipBytes<5000000,'standalone meets 5 MB budget');
  await request(route,{config:{playableCta:{intervals:[]}}},'PATCH');
  a.equal((await fetch(base+route+'/export')).status,409,'step policy edit invalidates packed export');
  await pack();
  const exports={};
  for(const format of ['','?format=game']){
   const response=await fetch(base+route+'/export'+format);a.equal(response.status,200,'export endpoint succeeds');const file=path.join(tmp,format?'game.zip':'assembly.zip');fs.writeFileSync(file,Buffer.from(await response.arrayBuffer()));
   const names=execFileSync('unzip',['-Z1',file],{encoding:'utf8'}).trim().split('\n');
   a.equal(names.sort(),format?['game.js']:['game.js','index.html'],'archive contains only intended root entries');exports[format]=file;
  }
  const assemblyHtml=execFileSync('unzip',['-p',exports[''],'index.html'],{encoding:'utf8',maxBuffer:16000000});
  a.equal(settings(assemblyHtml).policy,{mode:'steps',afterSteps:3,intervals:[],enabled:true},'pack preserves an empty interval list for one jump');
  const firstGame=execFileSync('unzip',['-p',exports['?format=game'],'game.js'],{maxBuffer:16000000});await pack();
  const second=await fetch(base+route+'/export?format=game');const repeat=path.join(tmp,'repeat.zip');fs.writeFileSync(repeat,Buffer.from(await second.arrayBuffer()));a.check(firstGame.equals(execFileSync('unzip',['-p',repeat,'game.js'],{maxBuffer:16000000})),'repack payload deterministic');
  await request(route,{config:{hud:{titleLine1:'changed'}}},'PATCH');a.equal((await fetch(base+route+'/export')).status,409,'HUD edit invalidates old export');
  a.equal((await(await fetch(base+route)).json()).config.hud.titleLine2,'Second line','partial title edit preserves second line');
  await request(route,{config:{cta:{enabled:false}}},'PATCH');
  preview=await(await fetch(base+route+'/preview')).text();a.check(!preview.includes('id="novvy-cta"'),'card can be switched off');
  await request(route,{config:{cta:{enabled:true,buttonText:'Play & Win',guideText:'Find <words>'}}},'PATCH');
  preview=await(await fetch(base+route+'/preview')).text();a.check(preview.includes('<span>Play &amp; Win</span>')&&preview.includes('Find &lt;words>'),'card copy is saved and escaped');
  await request(route,{config:{intro:{enabled:true,goEnabled:true,goText:'Legacy GO'}}},'PATCH');a.equal((await request(route+'/run',{step:'pack'})).status,422,'video requires transcoded assets');
  const video=path.join(tmp,'intro.mp4');execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c=blue:s=160x284:r=15:d=6','-c:v','libx264','-pix_fmt','yuv420p',video],{stdio:'ignore'});
  a.equal((await fetch(base+route+'/uploads/intro-video',{method:'PUT',headers:{'Content-Type':'application/octet-stream'},body:fs.readFileSync(video)})).status,200,'intro upload succeeds');
  a.equal((await request(route+'/run',{step:'intro'})).status,200,'core video processing succeeds');
  preview=await(await fetch(base+route+'/preview')).text();const ui=JSON.parse(preview.match(/window\.__NOVVY_UI__=(.*?);<\/script>/)[1]);a.check(ui.intro.goEnabled===false&&!preview.includes('Legacy GO'),'legacy GO does not block automatic entry');
  const composed=await pack();a.equal(composed.metrics.stageChain,['video','playable'],'video stage precedes game');
  await request(route,{config:{playableCta:{afterSteps:4,intervals:[4,3,2]}}},'PATCH');
  const afterPolicy=await(await fetch(base+route)).json();a.check(afterPolicy.steps.intro?.ok&&!afterPolicy.steps.pack,'policy edit keeps transcoded video and clears pack');
  await pack();
  await request(route,{config:{cta:{buttonText:'Play Now'}}},'PATCH');a.equal((await fetch(base+route+'/export')).status,409,'CTA edit invalidates old export');
  await request(route,{config:{intro:{enabled:false}}},'PATCH');await pack();
  const final=path.join(tmp,'final.zip');fs.writeFileSync(final,Buffer.from(await(await fetch(base+route+'/export')).arrayBuffer()));a.equal(execFileSync('unzip',['-Z1',final],{encoding:'utf8'}).trim().split('\n').sort(),['game.js','index.html'],'disabling intro removes old video and poster');
  await request(route,{config:{gameplay:{allowReplay:false}}},'PATCH');a.equal((await fetch(base+route+'/export?format=game')).status,409,'replay edit invalidates export');
 }finally{if(id)deleteTask(id);fs.rmSync(tmp,{recursive:true,force:true});await new Promise(resolve=>server.close(resolve));}
}
