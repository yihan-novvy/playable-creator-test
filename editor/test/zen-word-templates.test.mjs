import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {createServer} from '../server.mjs';
import {deleteTask} from '../lib/store.mjs';
import {splitZenWordTask, migrateZenWordTasks} from '../tools/migrate-zen-word-templates.mjs';

export default async function test(a){
  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`,ids=[],tmp=fs.mkdtempSync(path.join(os.tmpdir(),'zen-word-test-'));
  const request=(route,body,method='POST')=>fetch(base+route,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  try{
    const migrationRoot=path.join(tmp,'migration');fs.mkdirSync(migrationRoot);
    for(const [levelId,key] of [[1,'100m'],[2,'92m']]){
      const original={id:key,templateId:'zen-word-origin',config:{levelId,hud:{titleLine1:'keep'},gameplay:{allowReplay:true}},uploads:{'intro-video':{bytes:123}},steps:{intro:{ok:true},pack:{ok:true}}};
      const folder=path.join(migrationRoot,key);fs.mkdirSync(folder);fs.writeFileSync(path.join(folder,'project.json'),JSON.stringify(original));
      const changed=splitZenWordTask(original);
      a.equal(changed.templateId,`zen-word-${key}-origin`,'migration chooses the original engine');
      a.check(changed.config.levelId===1&&changed.config.hud.titleLine1==='keep'&&changed.config.gameplay.allowReplay,'migration preserves settings and fixes the single level');
      a.check(changed.steps.intro.ok&&!changed.steps.pack&&changed.uploads['intro-video'].bytes===123,'migration retains media and invalidates pack');
    }
    a.equal(migrateZenWordTasks(migrationRoot).length,2,'both old task variants migrate');
    a.equal(migrateZenWordTasks(migrationRoot),[],'migration is idempotent');
    a.check(fs.existsSync(path.join(migrationRoot,'92m','project.zen-word-before-split.json')),'original task has a recoverable backup');
    a.check(splitZenWordTask({templateId:'tasty-travels-origin'})===null,'unrelated tasks stay unchanged');
    for(const [key,templateId] of [['100m','zen-word-100m-origin'],['92m','zen-word-92m-origin']]){
      const created=await request('/api/tasks',{name:`zen-word-test-${key}-${Date.now()}`,templateId});a.equal(created.status,201,'Zen Word can be created');
      const task=await created.json();ids.push(task.id);
const route=`/api/tasks/${task.id}`;
      const initialPreview=await(await fetch(base+route+'/preview')).text();
      a.check(initialPreview.includes('"allowReplay":true'),'unset task config allows replay by default');
      a.equal((await request(route,{config:{levelId:1,gameplay:{allowReplay:true},hud:{titleEnabled:true,titleLine1:'</script><b>test</b>'}}},'PATCH')).status,200,'settings persist');
      a.equal((await request(route,{config:{levelId:2}},'PATCH')).status,400,'independent template rejects alternate variant');
      a.equal((await request(route,{config:{gameplay:{allowReplay:'yes'}}},'PATCH')).status,400,'invalid replay value rejected');
      const workbench=await(await fetch(base+'/plugins/'+templateId+'/workbench.js')).text();a.check(!workbench.includes('原版素材版本'),'workbench has no variant selector');
      const preview=await(await fetch(base+route+'/preview')).text();a.check(preview.includes('\"variant\":\"'+key+'\"'),'preview contains this template engine');a.check(!preview.includes('<b>test</b>'),'title is escaped');
      {
        const defaults=await(await fetch(base+route+'/preview')).text();
        a.check(defaults.includes('"afterSteps":20')&&defaults.includes('"intervals":[10,8,6,4]'),'default step CTA cadence reaches assembly');
        const changed=await request(route,{config:{playableCta:{afterSteps:12,intervals:[5,3]}}},'PATCH');
        a.equal((await changed.json()).config.playableCta,{afterSteps:12,intervals:[5,3]},'step policy persists in task');
        for(const policy of [{afterSteps:0},{afterSteps:2.5},{intervals:[10,0]},{intervals:'10,8'},{enabled:'yes'},{mode:'complete'}])a.equal((await request(route,{config:{playableCta:policy}},'PATCH')).status,400,'invalid/unapproved step policy rejected');
        await request(route,{config:{playableCta:{enabled:true,mode:'steps',afterSteps:20,intervals:[10,8,6,4]}}},'PATCH');
      }
      a.check(preview.includes('id="novvy-cta"')&&preview.includes('data:image/png;base64,'),'shared CTA contains bundled original icon');
      await request(route,{config:{cta:{enabled:false}}},'PATCH');
      const withoutCard=await(await fetch(base+route+'/preview')).text();
      a.check(!withoutCard.includes('id="novvy-cta"'),'CTA can be disabled without leaving a hidden interactive card');
      await request(route,{config:{cta:{enabled:true,buttonText:'Get Zen Word'}}},'PATCH');
      const withCard=await(await fetch(base+route+'/preview')).text();
      a.check(withCard.includes('Get Zen Word'),'CTA task text appears in preview');

      const packed=await request(route+'/run',{step:'pack'});const result=await packed.json();a.equal(packed.status,200,`${templateId} packs: ${result.error||''}`);
      a.check(result.metrics.gameZipBytes<=5000000,'game ZIP fits upload limit');
      for(const format of ['', '?format=game']){
        const exported=await fetch(base+route+'/export'+format);a.equal(exported.status,200,'export succeeds');
        const zip=path.join(tmp,`v${key}${format?'game':'assembly'}.zip`);fs.writeFileSync(zip,Buffer.from(await exported.arrayBuffer()));
        const names=execFileSync('unzip',['-Z1',zip],{encoding:'utf8'}).trim().split('\n');
        if(format){a.equal(names,['game.js'],'standalone ZIP contains only game.js');const game=execFileSync('unzip',['-p',zip,'game.js'],{maxBuffer:16000000,encoding:'utf8'});a.check(game.includes('\"variant\":\"'+key+'\"'),'export contains fixed template engine');}else a.check(names.includes('index.html')&&!names.some(n=>n.endsWith('.zip')),'assembly excludes nested ZIPs');
      }
      await request(route,{config:{gameplay:{allowReplay:false}}},'PATCH');
      a.equal((await fetch(base+route+'/export?format=game')).status,409,'changing replay invalidates standalone export');
      await request(route,{config:{intro:{enabled:true}}},'PATCH');
      a.equal((await request(route+'/run',{step:'pack'})).status,422,'enabled intro requires processed video');
      {
        const video=path.join(tmp,'intro.mp4');
        execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c=blue:s=160x284:r=15:d=6','-c:v','libx264','-pix_fmt','yuv420p',video],{stdio:'ignore'});
        const uploaded=await fetch(base+route+'/uploads/intro-video',{method:'PUT',headers:{'Content-Type':'application/octet-stream'},body:fs.readFileSync(video)});
        a.equal(uploaded.status,200,'intro upload accepted');
        const transcode=await request(route+'/run',{step:'intro'});a.equal(transcode.status,200,'core intro creates transcoded video and poster');
        const composed=await request(route+'/run',{step:'pack'});const composedResult=await composed.json();a.equal(composed.status,200,`video and game pack: ${composedResult.error||''}`);
        a.equal(composedResult.metrics.stageChain,['video','playable'],'video precedes selected playable');
        const zip=path.join(tmp,'with-intro.zip');fs.writeFileSync(zip,Buffer.from(await(await fetch(base+route+'/export')).arrayBuffer()));
        const entries=execFileSync('unzip',['-Z1',zip],{encoding:'utf8'});a.check(entries.includes('intro-video.mp4')&&entries.includes('poster.webp'),'assembly contains processed intro assets');
        await request(route,{config:{hud:{titleLine2:'changed'}}},'PATCH');
        a.equal((await fetch(base+route+'/export')).status,409,'HUD edits invalidate assembly');
      }
    }
  }finally{for(const id of ids)deleteTask(id);fs.rmSync(tmp,{recursive:true,force:true});await new Promise(resolve=>server.close(resolve));}
}
