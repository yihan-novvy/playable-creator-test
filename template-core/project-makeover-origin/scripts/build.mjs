import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=fileURLToPath(new URL('../',import.meta.url));
const output=path.resolve(root,'../../editor/templates/project-makeover-origin');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
const provenance=JSON.parse(read('source/provenance.json'));
for(const [file,hash] of Object.entries(provenance.files)){
  if(sha(fs.readFileSync(path.join(root,'source',file)))!==hash)throw new Error('Frozen source changed: '+file);
}
const raw=read('source/original.js').trim();
if(!raw.startsWith('al_renderHtml(')||!raw.endsWith(');'))throw new Error('Unknown source wrapper');
const html=JSON.parse(raw.slice('al_renderHtml('.length,-2)).html;
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(match=>match[1]).filter(s=>s.trim());
if(scripts.length!==1)throw new Error('Expected one frozen CreateJS payload');
function replaceRange(source,begin,end,replacement){
  if(source.split(begin).length!==2||source.split(end).length!==2)throw new Error('Patch anchor changed: '+begin);
  const start=source.indexOf(begin),stop=source.indexOf(end,start);
  if(stop<start)throw new Error('Patch order changed');
  return source.slice(0,start)+replacement+source.slice(stop);
}
let engine='var createjs=window.createjs={};\n'+scripts[0];
// Remove only network startup/store adapters. Native scene, art and gameplay stay frozen.
const boot='function initMRAID()';
if(engine.split(boot).length!==2)throw new Error('Bootstrap anchor changed');
engine=engine.slice(0,engine.indexOf(boot));
engine=replaceRange(engine,'function handleClickStore(e){','function setInteracive()', 'function handleClickStore(e){}');
engine=replaceRange(engine,'function setSQ(){','function removeMC(t)', 'function setSQ(){GlobalData.gameState="SQ";pmFinish();}function setSIP(){setSQ();}');
const sip='window.SIPID&&(window.vungleNetworkID&&parent.postMessage("complete","*"),window.mintegralNetworkID&&window.gameEnd&&window.gameEnd(),main_mc.addEventListener("pressup",handleClickStore)),';
if(engine.split(sip).length!==2)throw new Error('Single-interaction wrapper anchor changed');
engine=engine.replace(sip,'');
let markup=html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1].replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'').replace(/,\s*$/, '');
const css=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n').replace(/html\s*,\s*body/g,'.engine-root').replace(/\bbody\s*\{/g,'.engine-root{');
const icon=markup.match(/<img[^>]*src="data:image\/([^;]+);base64,([^"\s]+)"/);
if(!icon)throw new Error('Original loading icon missing');
const data={markup,css,engine:engine+'\n'+read('src/adapter.js')};
const game='(function(){\n'+read('src/engine-scope.js').replace(/^export /gm,'')+'\nconst SOURCE='+JSON.stringify(data)+';\n'+read('src/game.js')+'\n})();\n';
for(const forbidden of [/postMessage/,/messageHandlers/,/NovvyPlayable/,/NovvyAnalytics/,/NovvyShell/,/tracking\.novvy\.ai/,/window\.open\(/,/mraid\./])if(forbidden.test(game))throw new Error('Forbidden game dependency '+forbidden);
const files={'game/game.js':game,'game/index.html':read('src/index.html'),'game/host.js':read('src/host.js'),'game/cta-icon.png':Buffer.from(icon[2],'base64'),'source/provenance.json':JSON.stringify(provenance,null,2)+'\n'};
const version=JSON.parse(read('package.json')).version;
const manifest={id:'project-makeover-origin',name:'Project Makeover · 原版化妆试玩',version,entry:'game/index.html',levels:[{id:1,name:'选粉底并上妆（原版演示）',game:'game/game.js'}],constants:{game:{host:'game/host.js',hudInsideCanvas:true,ctaCard:{name:'Project Makeover',icon:'game/cta-icon.png'}},fileHashes:Object.fromEntries(Object.entries(files).map(([name,value])=>[name,sha(value)]))}};
fs.mkdirSync(output,{recursive:true});
for(const [name,value] of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(output,name)),{recursive:true});fs.writeFileSync(path.join(output,name),value);}
fs.writeFileSync(path.join(output,'game-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Built Project Makeover: frozen CreateJS makeup demonstration');
