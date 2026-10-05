import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {buildWsOverlayInjection} from './ws-overlays.mjs';
const SCRIPT='<script src="game.js" defer></script>';
const hash=text=>createHash('sha256').update(text).digest('hex');
function artifact(root){
 const built=JSON.parse(fs.readFileSync(path.join(root,'game/patterns/catalog.json'),'utf8'));
 if(built.version!==1||!Array.isArray(built.patterns)||hash(fs.readFileSync(path.join(root,'game/game.js')))!==built.engineSha256)throw new Error('Colorever 构建产物不完整，请从源项目重新 build:template');
 return built;
}
export function coloreverPatterns(root){return artifact(root).patterns.map(({id,name,description})=>({id,name,description}));}
export function coloreverLevel(root,config){
 const id=config?.patternId??'cat',picture=artifact(root).patterns.find(p=>p.id===id);
 if(!picture)throw new Error('未知已构建图案: '+id);
 if(!/^[a-z][a-z0-9-]*\.json$/.test(picture.level))throw new Error('无效的构建图案路径');
 const text=fs.readFileSync(path.join(root,'game/patterns',picture.level),'utf8');
 if(hash(text)!==picture.levelSha256)throw new Error('固定图案数据已改变，请在 colorever 中修改并重新构建');
 const level=JSON.parse(text);
 if(!Array.isArray(level.opening))throw new Error('构建产物缺少固定开局');
 return {level,proof:picture.proof,patternId:id};
}
const inline=value=>JSON.stringify(value).replaceAll('<','\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');
export function coloreverHtml({root,template,level,config,media={},preview=false}){
  let html=fs.readFileSync(path.join(root,template.game.indexHtml),'utf8');
  for(const anchor of [SCRIPT,'</head>','<body>','</body>'])if(html.split(anchor).length!==2)throw new Error(`Colorever New 基础壳缺少唯一锚点 ${anchor}`);
  const url=String(config?.cta?.destinationUrl||'');
  if(url&&!/^https?:\/\//i.test(url))throw new Error('CTA 地址必须为 http(s) URL');
  const injection=buildWsOverlayInjection({templateRoot:root,template,config,media});
  const top=injection.hudEnabled?'.18':'0',bottom=injection.ctaEnabled?'.16':'0';
  const styles=`<style data-colorever-shell>.app{z-index:1;position:fixed;top:calc(100svh * ${top});width:min(100vw,calc(100svh * (1 - ${top} - ${bottom}) * .558824));left:50%;transform:translateX(-50%)}${injection.backgroundEnabled?':root,body,.app{background:transparent}':''}${injection.hudEnabled?'.app>.hud{visibility:hidden}':''}${injection.ctaEnabled?'#win{display:none!important}':''}</style>`;
  const data=`<script>window.__COLOREVER_PATTERN_ID__=${inline(config?.patternId??'cat')};window.__COLOREVER_LEVEL__=${inline(level)};window.__COLOREVER_CTA_URL__=${inline(url)};</script>`;
  html=html.replace('</head>',()=>`${[...injection.headStyles,styles,...injection.headScripts].join('\n')}</head>`)
    .replace(SCRIPT,()=>`${injection.uiScript}${data}${preview?`<script src="/templates/${template.id}/game/game.js" defer></script>`:SCRIPT}`)
    .replace('<body>',()=>`<body>${injection.bodyDom.join('\n')}`)
    .replace('</body>',()=>`${injection.bodyScripts.join('\n')}</body>`);
  return {html,injection};
}
