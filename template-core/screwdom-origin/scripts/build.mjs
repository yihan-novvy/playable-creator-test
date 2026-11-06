import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.resolve(root,'../../editor/templates/screwdom-origin');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
const provenance=JSON.parse(read('source/provenance.json'));
for(const [file,hash] of Object.entries(provenance.files))if(sha(fs.readFileSync(path.join(root,'source',file)))!==hash)throw new Error('Frozen source changed: '+file);
const raw=read('source/original.js').trim();
if(!raw.startsWith('al_renderHtml(')||!raw.endsWith(');'))throw new Error('Unknown source wrapper');
const html=JSON.parse(raw.slice(14,-2)).html;
const matches=[...html.matchAll(/window\.__zip = "([A-Za-z0-9+/=]+)"/g)];
if(matches.length!==1)throw new Error('Expected one embedded Cocos archive');
const zip=Buffer.from(matches[0][1],'base64'),resources={};
let end=zip.length-22;
while(end>=0&&zip.readUInt32LE(end)!==0x06054b50)end--;
if(end<0)throw new Error('Missing ZIP directory');
let cursor=zip.readUInt32LE(end+16),total=0;
for(let i=0;i<zip.readUInt16LE(end+10);i++){
  if(zip.readUInt32LE(cursor)!==0x02014b50)throw new Error('Invalid ZIP entry');
  const method=zip.readUInt16LE(cursor+10),size=zip.readUInt32LE(cursor+20),rawSize=zip.readUInt32LE(cursor+24),len=zip.readUInt16LE(cursor+28),extra=zip.readUInt16LE(cursor+30),comment=zip.readUInt16LE(cursor+32),offset=zip.readUInt32LE(cursor+42);
  const name=zip.subarray(cursor+46,cursor+46+len).toString();cursor+=46+len+extra+comment;
  if(name.startsWith('/')||name.split('/').includes('..'))throw new Error('Unsafe archive path');
  if(name.endsWith('/'))continue;
  const begin=offset+30+zip.readUInt16LE(offset+26)+zip.readUInt16LE(offset+28),compressed=zip.subarray(begin,begin+size);
  const data=method===8?inflateRawSync(compressed):method===0?compressed:null;
  if(!data||data.length!==rawSize)throw new Error('Invalid archive bytes: '+name);
  total+=data.length;if(total>30000000)throw new Error('Archive exceeds budget');
  resources[name]=data.toString('utf8');
}
if(Object.keys(resources).length!==47)throw new Error('Frozen Cocos resource inventory changed');
const looseStart=html.indexOf('window.__res=')+'window.__res='.length;
const looseEnd=html.indexOf('window.super_html_channel',looseStart);
if(looseStart<13||looseEnd<looseStart)throw new Error('Loose resource boundary changed');
const loose=JSON.parse(html.slice(looseStart,looseEnd).trim().replace(/;$/, ''));
if(Object.keys(loose).length!==299)throw new Error('Loose resource inventory changed');
for(const [name,value] of Object.entries(loose)){
  if(name.startsWith('/')||name.split('/').includes('..')||typeof value!=='string')throw new Error('Unsafe loose resource');
  if(resources[name]&&resources[name]!==value)throw new Error('Conflicting resource: '+name);
  resources[name]=value;
}
const settings=JSON.parse(resources['src/settings.json']);
if(settings.CocosEngine!=='3.8.7')throw new Error('Engine changed');
const title=html.match(/<title>(.*?)<\/title>/)[1];
function once(text,before,after){if(text.split(before).length!==2)throw new Error('Patch anchor changed: '+before.slice(0,70));return text.replace(before,after);}
// Remove unused host-navigation and mini-game sub-context integration. Original
// bytes remain frozen; physics, rendering, levels and native input are intact.
const core='cocos-js/_virtual_cc-BwGnPUtN.js';
resources[core]=once(resources[core],'i.openURL=function(t){window.open(t)}','i.openURL=function(t){}');
resources[core]=once(resources[core],'this._openDataContext.postMessage({fromEngine:!0,type:"engine",event:"viewport",x:h,y:c,width:l,height:d})','void 0');
// Meshopt uses its existing synchronous ASM decoder. Worker-only messaging is
// removed, rather than renamed or hidden from the source guard.
const meshKey='cocos-js/meshopt_decoder.asm-B2ZM8mVv.js',mesh=resources[meshKey],at=mesh.indexOf('System['),table={};
vm.runInNewContext(mesh.slice(0,at-1)+');',table,{timeout:1000});
const aliases=new Set(['b']);
for(let n=0;n<12;n++)for(const match of mesh.matchAll(/\b([A-Za-z_$]\w*)=([A-Za-z_$]\w*)[;,]/g))if(aliases.has(match[2]))aliases.add(match[1]);
let decoded=mesh.slice(at).replace(/\b([A-Za-z_$]\w*)\((0x[\da-f]+)\)/g,(all,fn,arg)=>aliases.has(fn)?JSON.stringify(table.b(Number(arg))):all);
decoded=transformSync('function b(){};'+decoded.slice(0,-2)+';',{minify:false}).code;
const workerStart=decoded.indexOf('        function z(D) {'),workerEnd=decoded.indexOf('        return { "ready": m,');
if(workerStart<0||workerEnd<workerStart)throw new Error('Meshopt worker boundary changed');
decoded=decoded.slice(0,workerStart)+decoded.slice(workerEnd);
decoded=once(decoded,'          A(D);','          // Synchronous embedded ASM decoder.');
decoded=once(decoded,'return x["length"] > 0 ? B(D, E, F, w[G], v[H]) : m["then"]','return m["then"]');
resources[meshKey]=decoded;
const markup='<div id="GameDiv" cc_exact_fit_screen="true"><div id="Cocos3dGameContainer"><canvas id="GameCanvas" tabindex="99"></canvas></div></div>';
const css=html.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/\bhtml\b/g,'.engine-root').replace(/\bbody\b/g,'.engine-root').replace(/:root/g,'.engine-root');
const source={title,markup,css,resources};
const game='(function(){\n'+read('src/engine-scope.js').replace(/^export /gm,'')+'\nconst SOURCE='+JSON.stringify(source)+';\n'+read('src/adapter.js')+'\n'+read('src/game.js')+'\n})();\n';
for(const forbidden of [/postMessage/,/messageHandlers/,/NovvyPlayable/,/NovvyAnalytics/,/NovvyShell/,/tracking\.novvy\.ai/,/window\.open\(/])if(forbidden.test(game))throw new Error('Forbidden game dependency '+forbidden);
const files={'game/game.js':game,'game/index.html':read('src/index.html'),'game/host.js':read('src/host.js')};
const version=JSON.parse(read('package.json')).version;
const manifest={id:'screwdom-origin',name:'Screwdom · 原版 3D 螺丝试玩',version,entry:'game/index.html',levels:[{id:1,name:'冬季粉色小屋',game:'game/game.js'}],constants:{game:{host:'game/host.js',hudInsideCanvas:true,engine:'Cocos Creator 3.8.7'},fileHashes:Object.fromEntries(Object.entries(files).map(([name,data])=>[name,sha(data)]))}};
fs.mkdirSync(out,{recursive:true});
for(const [name,data] of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(out,name)),{recursive:true});fs.writeFileSync(path.join(out,name),data);}
fs.writeFileSync(path.join(out,'game-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Built Screwdom: '+Object.keys(resources).length+' embedded Cocos resources');
