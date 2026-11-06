import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.resolve(root,'../../editor/templates/color-block-jam-origin');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const sha=data=>createHash('sha256').update(data).digest('hex');
const provenance=JSON.parse(read('source/provenance.json'));
for(const [file,hash] of Object.entries(provenance.files))if(sha(fs.readFileSync(path.join(root,'source',file)))!==hash)throw new Error('Frozen source changed: '+file);
const zip=fs.readFileSync(path.join(root,'source/original.zip')),resources={};
let end=zip.length-22;
while(end>=0&&zip.readUInt32LE(end)!==0x06054b50)end--;
if(end<0)throw new Error('Missing ZIP directory');
let cursor=zip.readUInt32LE(end+16),total=0;
for(let i=0;i<zip.readUInt16LE(end+10);i++){
  if(zip.readUInt32LE(cursor)!==0x02014b50)throw new Error('Invalid ZIP entry');
  const method=zip.readUInt16LE(cursor+10),size=zip.readUInt32LE(cursor+20),rawSize=zip.readUInt32LE(cursor+24),len=zip.readUInt16LE(cursor+28),extra=zip.readUInt16LE(cursor+30),comment=zip.readUInt16LE(cursor+32),offset=zip.readUInt32LE(cursor+42);
  const name=zip.subarray(cursor+46,cursor+46+len).toString();cursor+=46+len+extra+comment;
  if(name.startsWith('/')||name.split('/').includes('..'))throw new Error('Unsafe source path');
  if(name.endsWith('/'))continue;
  const begin=offset+30+zip.readUInt16LE(offset+26)+zip.readUInt16LE(offset+28),compressed=zip.subarray(begin,begin+size);
  const data=method===8?inflateRawSync(compressed):method===0?compressed:null;
  if(!data||data.length!==rawSize)throw new Error('Invalid archive bytes');
  total+=data.length;if(total>30000000)throw new Error('Source exceeds budget');
  resources[name.slice(name.indexOf('/')+1)]=data.toString('utf8');
}
if(Object.keys(resources).length!==30)throw new Error('Source inventory changed');
const once=(s,a,b)=>{if(s.split(a).length!==2)throw new Error('Patch anchor changed: '+a.slice(0,100));return s.replace(a,b);};
// The immutable ZIP remains intact. Only unavailable host/navigation paths are
// removed from the derived engine; native physics, puzzles and visuals stay intact.
const core='cocos-js/_virtual_cc-d95a6d72.js';
resources[core]=once(resources[core],'i.openURL=function(t){window.open(t)}','i.openURL=function(t){}');
resources[core]=once(resources[core],'i.exit=function(){window.close()}','i.exit=function(){}');
resources[core]=once(resources[core],'this._openDataContext.postMessage({fromEngine:!0,type:"engine",event:"viewport",x:h,y:l,width:c,height:_})','void 0');
for(const [file,first,ready,call,branch,tail] of [
  ['meshopt_decoder.asm-700d8e85.js','        function i(e4) {','        return { ready: r3,','          s(e4);','return f.length > 0 ?',' : r3.then'],
  ['meshopt_decoder.wasm-ebbcb6df.js','      function i(e3) {','      return { ready: r,','        a(e3);','return c.length > 0 ?',' : r.then']
]){
  const key='cocos-js/'+file;let code=transformSync(resources[key],{minify:false}).code;
  const from=code.indexOf(first),to=code.indexOf(ready,from);
  if(from<0||to<0)throw new Error('Mesh decoder worker boundary changed');
  code=code.slice(0,from)+code.slice(to);code=once(code,call,'');
  const begin=code.indexOf(branch),finish=code.indexOf(tail,begin);
  if(begin<0||finish<0)throw new Error('Mesh decoder branch changed');
  resources[key]=code.slice(0,begin)+'return '+code.slice(finish+3);
}
// Only the original pure data assignments are evaluated, with no host objects.
const data={};vm.runInNewContext(resources['data.js'],data,{timeout:1000});
const icon=data.assetsPackage['resource/common/icon.png'];
if(!icon?.startsWith('data:image/png;base64,'))throw new Error('Missing native brand icon');
const config=JSON.parse(data.assetsPackage['resource/config/gameConfig.json']);
const layouts=config.gameConfig.config.items.map(x=>x.value);
if(JSON.stringify(layouts)!=='[1,2,3]')throw new Error('Native level chain changed');
// Resource scripts must execute in the instance scope instead of the page.
// Use the original resource mapping/download implementation with one narrowly
// scoped script loader substitution (minified source anchor).
resources['downloadHandle.js']=once(resources['downloadHandle.js'],'a.body.appendChild(r),t(null)','window.loadEmbeddedScript(r.text),t(null)');
const order=['src/polyfills.bundle.js','src/system.bundle.js','assets.js','data.js','dataMap.js','picDesc.js',...Object.keys(resources).filter(k=>k.startsWith('cocos-js/')&&k.endsWith('.js')),'src/chunks/bundle.js','src/settings.js','downloadHandle.js','application.js'];
const embedded=Object.fromEntries(order.map(k=>[k,resources[k]]));
const source={resources:embedded,css:resources['style.css'].replace(/\bhtml\b/g,'.engine-root').replace(/\bbody\b/g,'.engine-root').replace(/:root/g,'.engine-root'),markup:'<div id="GameDiv" cc_exact_fit_screen="true"><div id="Cocos3dGameContainer"><canvas id="GameCanvas" tabindex="99"></canvas></div></div>'};
const game='(function(){\n'+read('src/engine-scope.js').replace(/^export /gm,'')+'\nconst SOURCE='+JSON.stringify(source)+';\n'+read('src/adapter.js')+'\n'+read('src/game.js')+'\n})();\n';
for(const bad of [/postMessage/,/messageHandlers/,/NovvyPlayable/,/NovvyAnalytics/,/NovvyShell/,/tracking\.novvy\.ai/,/window\.open\(/])if(bad.test(game))throw new Error('Forbidden game dependency: '+bad);
const files={'game/game.js':game,'game/index.html':read('src/index.html'),'game/host.js':read('src/host.js'),'game/cta-icon.png':Buffer.from(icon.split(',')[1],'base64')};
const version=JSON.parse(read('package.json')).version;
const manifest={id:'color-block-jam-origin',name:'Color Block Jam · 原版三关滑块试玩',version,entry:'game/index.html',levels:[{id:1,name:'原版三关连续试玩',game:'game/game.js'}],constants:{game:{host:'game/host.js',hudInsideCanvas:true,engine:'Cocos Creator 3.8.2',playableType:'level',levelCount:3,ctaCard:{name:'Color Block Jam',icon:'game/cta-icon.png',rating:4.6}},fileHashes:Object.fromEntries(Object.entries(files).map(([name,data])=>[name,sha(data)]))}};
fs.mkdirSync(out,{recursive:true});
for(const [name,data] of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(out,name)),{recursive:true});fs.writeFileSync(path.join(out,name),data);}
fs.writeFileSync(path.join(out,'game-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Built Color Block Jam: original three levels, embedded Cocos 3.8.2');
