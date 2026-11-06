import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {buildWsOverlayInjection} from '../../core/lib/ws-overlays.mjs';
import {effectiveConfig} from '../../core/runner.mjs';
import {taskGeneratedDir,taskUploadsDir,taskResultDir} from '../../lib/paths.mjs';
import {requireFiles} from '../../core/lib/helpers.mjs';
import {fixedViewportHtml} from '../../core/lib/fixed-viewport.mjs';

const run=promisify(execFile);
const script=s=>`<script>${s.replace(/<\/script/gi,'<\\/script')}</script>`;
export function makeoverHtml({root,pluginDir,template,config,media={},preview=false}){
  // This template enters gameplay automatically, including tasks with legacy GO settings.
  const intro={...config.intro,goEnabled:false};delete intro.goText;
  config={...config,intro};
  const read=(file,encoding='utf8')=>{const bytes=fs.readFileSync(path.join(root,file));if(createHash('sha256').update(bytes).digest('hex')!==template.fileHashes[file])throw new Error(`模板校验失败，请重新 build: ${file}`);return encoding?bytes.toString(encoding):bytes;};
  const variant=template.levels[0];
  if(template.levels.length!==1||config.levelId!==1)throw Object.assign(new Error('该独立模板只有固定的一份 playable'),{statusCode:400});
  const injection=buildWsOverlayInjection({overlaysRoot:pluginDir,template,config,media,optionalHudPortraits:true,analytics:false});
  if(config.cta?.enabled===true)throw Object.assign(new Error('下载入口尚未配置，请先确认跳店分类。'),{statusCode:400});
  const settings={intro:injection.introEnabled,title:injection.hudEnabled,allowReplay:config.gameplay?.allowReplay===true};
  const game=read(variant.game),host=read(template.game.host);
  const tail=[...injection.bodyDom,injection.uiScript,script(`window.PM_CONFIG=${JSON.stringify(settings)};`),script(host),...injection.bodyScripts,preview?script(game):'<script src="game.js"></script>'].join('\n');
  const html=read(template.game.indexHtml).replace('<!--PM_HEAD-->',()=>injection.headStyles.join('\n')).replace(/<!--PM_SCRIPTS-->[\s\S]*?<!--PM_SCRIPTS_END-->/,()=>tail);
  return {html,game,variant,introEnabled:injection.introEnabled,stageChain:settings.intro?['video','playable']:['playable']};
}
export function previewHtml({plugin:entry,task,taskId}){
  const config=effectiveConfig(entry.template,task.config),generated=taskGeneratedDir(taskId),upload=path.join(taskUploadsDir(taskId),'intro-video.mp4');
  const video=fs.existsSync(upload)?`/project/${taskId}/uploads/intro-video.mp4?v=${fs.statSync(upload).mtimeMs}`:null;
  const poster=fs.existsSync(path.join(generated,'poster.webp'))?`/project/${taskId}/generated/poster.webp`:null;
  return makeoverHtml({root:entry.templateDir,pluginDir:entry.dir,template:entry.template,config,media:{introVideo:video,introPoster:poster},preview:true}).html;
}
export function prerequisites(config){return config?.intro?.enabled===true?{uploads:['intro-video'],generated:['intro-video.mp4','poster.webp']}:{uploads:[],generated:[]};}
export async function pack(ctx){
  const intro=ctx.config.intro?.enabled===true;
  if(intro)requireFiles([ctx.uploads['intro-video'],path.join(ctx.generatedDir,'intro-video.mp4'),path.join(ctx.generatedDir,'poster.webp')]);
  const built=makeoverHtml({root:ctx.templateRoot,pluginDir:ctx.pluginDir,template:ctx.template,config:ctx.config,media:{introVideo:intro?'intro-video.mp4':null,introPoster:intro?'poster.webp':null}});
  fs.rmSync(ctx.resultDir,{recursive:true,force:true});fs.mkdirSync(ctx.resultDir,{recursive:true});
  fs.writeFileSync(path.join(ctx.resultDir,'index.html'),fixedViewportHtml(built.html));fs.writeFileSync(path.join(ctx.resultDir,'game.js'),built.game);
  if(intro)for(const file of ['intro-video.mp4','poster.webp'])fs.copyFileSync(path.join(ctx.generatedDir,file),path.join(ctx.resultDir,file));
  const archive=path.join(ctx.resultDir,'game-only.zip');await run('zip',['-q','-X',archive,'game.js'],{cwd:ctx.resultDir});
  if(fs.statSync(archive).size>5000000)throw new Error('独立试玩 ZIP 超过 5 MB');
  const files=fs.readdirSync(ctx.resultDir).filter(f=>!f.endsWith('.zip'));
  const rawBytes=files.reduce((n,f)=>n+fs.statSync(path.join(ctx.resultDir,f)).size,0);
  if(rawBytes>30000000)throw new Error('组装包解压体积超过 30 MB');
  const budget=path.join(ctx.resultDir,'assembly-budget.zip');await run('zip',['-q','-X',budget,...files],{cwd:ctx.resultDir});
  const assemblyBytes=fs.statSync(budget).size;fs.rmSync(budget);
  if(assemblyBytes>10000000)throw new Error('组装 ZIP 超过 10 MB，请压缩片头视频');
  return {metrics:{variant:built.variant.name,stageChain:built.stageChain,introEnabled:intro,outputBytes:rawBytes,assemblyBytes,gameZipBytes:fs.statSync(archive).size},warnings:[]};
}
export function exportGameZip({taskId}){return fs.readFileSync(path.join(taskResultDir(taskId),'game-only.zip'));}
