import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {brotliDecompressSync} from 'node:zlib';

const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.resolve(root,'../../editor/templates/pixel-flow-origin');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
const provenance=JSON.parse(read('source/provenance.json'));
for(const [file,hash] of Object.entries(provenance.files))if(sha(fs.readFileSync(path.join(root,'source',file)))!==hash)throw new Error('Frozen source changed: '+file);
const html=read('source/original.html');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m=>m[1]).filter(s=>s.trim());
if(scripts.length!==25)throw new Error('Inline script inventory changed');
let engine,jsons={},sounds={},blobs={};
const payload=/decompress(String|ArrayBuffer)\(\s*"([A-Za-z0-9+/=]+)"\s*,\s*false\s*(?:,\s*\d+\s*)?\)\.then\(\s*function\(\s*(\w+)\s*\)\s*\{([\s\S]*?)\}\s*\)/g;
for(const match of scripts.join('\n').matchAll(payload)){
  const bytes=brotliDecompressSync(Buffer.from(match[2],'base64'));
  if(/window\.eval/.test(match[4])){if(engine)throw new Error('Multiple engines');engine=bytes.toString();continue;}
  const target=match[4].match(/window\.(jsons|sounds|blobs)\[\s*"([^"]+)"\s*\]/);
  if(!target)throw new Error('Unrecognized embedded resource');
  if(target[1]==='jsons')jsons[target[2]]=JSON.parse(bytes.toString());
  else{
    const registry=target[1]==='sounds'?sounds:blobs,encoded=bytes.toString('base64');
    if(registry[target[2]]&&registry[target[2]]!==encoded)throw new Error('Conflicting resource');
    registry[target[2]]=encoded;
  }
}
if(!engine||Object.keys(jsons).length!==4||Object.keys(sounds).length!==2||Object.keys(blobs).length!==1)throw new Error('Payload inventory changed');
function once(before,after){if(engine.split(before).length!==2)throw new Error('Patch anchor changed: '+before.slice(0,90));engine=engine.replace(before,()=>after);}
// Playground overrides use eval after the engine's initial evaluation ends.
once('var Deserializers=', 'var Deserializers=window.Deserializers=');
// The vendor's diagnostic asks Unity to deserialize an untyped System.Object,
// which Luna does not implement. Keep syntax validation without false errors.
once('UnityEngine.JsonUtility.FromJson(System.Object,this.levelJsonOverride)','JSON.parse(this.levelJsonOverride)');
once('UnityEngine.JsonUtility.FromJson(System.Object,this.pixelJsonOverride)','JSON.parse(this.pixelJsonOverride)');
// Reparenting a shooter briefly clears its parent before the slot sort runs.
// Unity returns index 0 in this state; Luna's generated implementation dereferences null.
once('var e=this.lNa$.parent.children,t=0;', 'var e=this.lNa$.parent?this.lNa$.parent.children:[],t=0;');
// Remove the network wrapper and unused developer navigation. Frozen input is
// unchanged; these reproducible patches only isolate the original engine.
once('e.setImmediate?t.setImmediate=e.setImmediate.bind(e):t.setImmediate=function(){var e={},t=e,n=Math.random();function i(t){if(t.data==n){var i=(e=e.next).func;delete e.func,i()}}return"undefined"!=typeof window&&(window.addEventListener?window.addEventListener("message",i):window.attachEvent("onmessage",i)),function(e){t=t.next={func:e},"undefined"!=typeof window&&window.postMessage(n,"*")}}()','t.setImmediate=function(fn){return setTimeout(fn,0)}');
once('window.parent&&window.parent.postMessage({target:"editor:stubber",propertyOrMethodName:e,calledFrom:v()},"*")','void e');
once('var t=window.open(e,"_blank");t&&t.focus()','void e');
once('window.open("",this.name,`width=${this.width},height=${this.height}`)','({document:{write:function(){},close:function(){}}})');
once('window.Mecanim().then(onMecanimLoaded)','Mecanim().then(onMecanimLoaded)');
if(engine.split('constructor===Function').length!==3)throw new Error('Bridge constructor anchors changed');
engine=engine.replaceAll('constructor===Function','constructor===Function.prototype.constructor');
const overrides=scripts[1].match(/window\.playgroundOverrides\s*=\s*(\{[\s\S]*?\});\s*window\.playgroundAssetOverrides/);
if(!overrides)throw new Error('Missing original level overrides');
const originalOverrides=JSON.parse(overrides[1]);
const loader=originalOverrides['Crescive.Game.Loader.LevelLoader'];
const level=JSON.parse(loader.levelJsonOverride[1]),pixels=JSON.parse(loader.pixelJsonOverride[1]);
if(level.SlotCount!==5||level.ConveyorLimit!==5||pixels.width!==31||pixels.height!==35)throw new Error('Level identity changed');
let markup=html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1].replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');
if(/data-src122=/.test(markup))throw new Error('Unexpected encoded markup');
const css=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n').replace(/\bbody\s*\{/g,'.engine-root{');
const config='window.DEBUG=false;window.TRACE=false;window.DEVELOP=false;window.TESTS=false;window.FORCE_STABLE_RANDOM_SEED=false;window.playgroundOverrides='+JSON.stringify(originalOverrides)+';window.playgroundAssetOverrides={};'+scripts[2].replace('targetPlatform:"unityads"','targetPlatform:"web"');
const data={scene:'Gameplay',markup,css,config,input:scripts[0],engine,jsons,sounds,blobs,pixelCount:pixels.pixels.length,level};
const game='(function(){\n'+read('src/engine-scope.js').replace(/^export /gm,'')+'\nconst SOURCE='+JSON.stringify(data)+';\n'+read('src/adapter.js')+'\n'+read('src/game.js')+'\n})();\n';
for(const forbidden of [/postMessage/,/messageHandlers/,/NovvyPlayable/,/NovvyAnalytics/,/NovvyShell/,/tracking\.novvy\.ai/,/window\.open\(/])if(forbidden.test(game))throw new Error('Forbidden game dependency '+forbidden);
const files={'game/game.js':game,'game/index.html':read('src/index.html'),'game/host.js':read('src/host.js'),'game/cta-icon.jpg':fs.readFileSync(path.join(root,'source/app-icon.jpg'))};
const manifest={id:'pixel-flow-origin',name:'Pixel Flow! · 原版像素传送带',version:JSON.parse(read('package.json')).version,entry:'game/index.html',levels:[{id:1,name:'彩色拼图 · 31×35',game:'game/game.js'}],constants:{game:{indexHtml:'game/index.html',host:'game/host.js',hudInsideCanvas:true,engine:'Unity / Luna / PlayCanvas',ctaCard:{name:'Pixel Flow!',icon:'game/cta-icon.jpg',rating:provenance.brand.rating}},fileHashes:Object.fromEntries(Object.entries(files).map(([file,value])=>[file,sha(value)]))}};
fs.mkdirSync(out,{recursive:true});
for(const [file,value] of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(out,file)),{recursive:true});fs.writeFileSync(path.join(out,file),value);}
fs.writeFileSync(path.join(out,'game-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Built Pixel Flow: '+pixels.pixels.length+' pixels; '+level.QueueGroup.shooterQueues.reduce((n,q)=>n+q.shooters.length,0)+' shooters; all original resources embedded');
