import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {IDS, unpackGame} from '../../template-core/shared/standalone/build.mjs';
import {standaloneGame} from '../core/lib/standalone-artifact.mjs';
import {getEntry, getLib} from '../core/registry.mjs';
import {runStep} from '../core/runner.mjs';
import {createTask, deleteTask, recordStepResult, computeStatus} from '../lib/store.mjs';

export default async function test(a) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'standalone-artifact-'));
  try {
    for (const id of IDS) {
      const entry = getEntry(id), lib = await getLib(entry);
      const canonical = fs.readFileSync(path.join(entry.templateDir,'standalone/game.js'),'utf8');
      const config = {intro:{enabled:false},hud:{enabled:false},gameplay:{allowReplay:true}};
      a.check(standaloneGame(entry.templateDir,config) === canonical, id + ' shell options preserve final standalone bytes');
      const preview = await lib.previewHtml({plugin:entry,task:{config},taskId:'standalone-artifact-fixture'});
      a.check(preview.includes(canonical), id + ' actual editor preview embeds final artifact');
      const dir = path.join(tmp,id), generated = path.join(dir,'generated'), result = path.join(dir,'result');
      fs.mkdirSync(generated,{recursive:true});
      if (id === 'water-sort') {
        fs.copyFileSync(path.join(entry.templateDir,'level.json'),path.join(generated,'level.json'));
        fs.copyFileSync(path.join(entry.dir,'overlays/cta/icon.png'),path.join(generated,'background.webp'));
      }
      const packed = await runStep({taskId:'standalone-artifact-fixture',templateId:id,projectRoot:dir,resultRoot:result,stepId:'pack',config});
      a.check(packed.ok,id + ' production pack succeeds',packed.error);
      if (!packed.ok) continue;
      a.check(fs.readFileSync(path.join(result,'game.js'),'utf8') === canonical,id + ' assembly contains final standalone bytes');
      const exported = execFileSync('unzip',['-p',path.join(result,'game-only.zip'),'game.js'],{maxBuffer:10000000,encoding:'utf8'});
      a.check(exported === canonical,id + ' game-only ZIP contains identical bytes');
      a.equal(packed.metrics.gameArtifactVersion,'standalone-v1',id + ' pack records migration version');
    }
    for (const [id,config,needle] of [
      ['grill-sort-origin',{gameplay:{countdownSeconds:17,allowReplay:true}},'"countdownSeconds":17'],
      ['tasty-travels-origin',{gameplay:{spawnTierOffset:3,allowReplay:true},story:{enabled:true}},'"spawnTierOffset":3'],
      ['water-sort',{level:{name:'Baked task',capacity:2,colors:{a:'#ffffff'},bottles:[['a','a'],[]],ignored:true}},'WATER_LEVEL*/{"name":"Baked task"'],
    ]) {
      const entry = getEntry(id), game = standaloneGame(entry.templateDir,config);
      a.check(game === standaloneGame(entry.templateDir,config),id + ' configured artifact is deterministic');
      a.check(unpackGame(game).source.includes(needle),id + ' gameplay configuration is baked into payload');
      const preview = await (await getLib(entry)).previewHtml({plugin:entry,task:{config},taskId:'standalone-artifact-fixture'});
      a.check(preview.includes(game),id + ' configured preview uses the same final artifact');
      if (id === 'tasty-travels-origin') {
        a.check(preview.includes('id="novvy-story"') && !preview.includes('data-novvy-origin-adapter'), 'story retains its overlay without legacy engine boot');
        a.check(preview.includes('window.__TASTY_STORY_MUSIC__='), 'story retains original music outside the game');
      }
    }
    const corrupt = path.join(tmp,'corrupt');
    fs.mkdirSync(path.join(corrupt,'standalone'),{recursive:true});
    const original = path.join(getEntry('grill-sort-origin').templateDir,'standalone');
    fs.copyFileSync(path.join(original,'manifest.json'),path.join(corrupt,'standalone/manifest.json'));
    fs.writeFileSync(path.join(corrupt,'standalone/game.js'),'NovvyGame(function(){});');
    let rejected = false;
    try { standaloneGame(corrupt); } catch (error) { rejected = /校验失败/.test(error.message); }
    a.check(rejected,'editor rejects corrupted artifacts instead of falling back to raw source');
    const task = createTask({name:'standalone-migration-check-' + Date.now(),templateId:'zen-word-100m-origin'});
    try {
      recordStepResult(task.id,{stepId:'pack',ok:true,metrics:{},durationMs:1});
      a.check(computeStatus(task.id,['pack']).steps.pack.stale,'old raw-bundle package is marked stale');
      recordStepResult(task.id,{stepId:'pack',ok:true,metrics:{gameArtifactVersion:'standalone-v1'},durationMs:1});
      a.check(!computeStatus(task.id,['pack']).steps.pack.stale,'current standalone package clears migration flag');
    } finally { deleteTask(task.id); }
  } finally { fs.rmSync(tmp,{recursive:true,force:true}); }
}
