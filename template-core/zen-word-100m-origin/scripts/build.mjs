import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { brotliDecompressSync } from 'node:zlib';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.resolve(root, '../../editor/templates/zen-word-100m-origin');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const sha = s => createHash('sha256').update(s).digest('hex');
const provenance = JSON.parse(read('source/provenance.json'));
function replaceOne(s, from, to) {
  if (s.split(from).length !== 2) throw new Error(`Source anchor changed: ${from.slice(0, 100)}`);
  return s.replace(from, () => to);
}
function base122(s) {
  const illegal=[0,10,13,34,38,92], bytes=[]; let carry=0,bits=0;
  const add=n=>{carry|=(n<<1)>>>bits;bits+=7;if(bits>=8){bytes.push(carry);bits-=8;carry=(n<<1)<<(7-bits)&255;}};
  for(const c of s){const n=c.charCodeAt(0);if(n>127){const k=n>>>8&7;if(k!==7)add(illegal[k]);add(n&127);}else add(n);}
  return Buffer.from(bytes);
}
if(provenance.variants.length!==1)throw new Error('Independent template requires exactly one frozen playable');
const files = {};
for (const variant of provenance.variants) {
  const raw = fs.readFileSync(path.join(root, `source/${variant.key}.html`));
  if (sha(raw) !== variant.sha256) throw new Error(`Frozen source hash mismatch: ${variant.key}`);
  const html = raw.toString('utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m=>m[1]).filter(s=>s.trim());
  if (scripts.length !== variant.inlineScripts) throw new Error('Inline script inventory changed');
  let engine, jsons={}, sounds={}, blobs={};
  const payloads=scripts.join('\n');
  const pattern=/decompress(String|ArrayBuffer)\(\s*"([A-Za-z0-9+/=]+)"\s*,\s*false\s*(?:,\s*\d+\s*)?\)\.then\(\s*function\(\s*(\w+)\s*\)\s*\{([\s\S]*?)\}\s*\)/g;
  for (const m of payloads.matchAll(pattern)) {
    const bytes=brotliDecompressSync(Buffer.from(m[2],'base64'));
    if (/window\.eval/.test(m[4])) { if(engine)throw new Error('Multiple engines');engine=bytes.toString('utf8');continue; }
    const target=m[4].match(/window\.(jsons|sounds|blobs)\[\s*"([^"]+)"\s*\]/);
    if(!target)throw new Error('Unknown embedded payload');
    if(target[1]==='jsons')jsons[target[2]]=JSON.parse(bytes.toString('utf8'));
    else (target[1]==='sounds'?sounds:blobs)[target[2]]=bytes.toString('base64');
  }
  if(!engine||Object.keys(jsons).length!==4||Object.keys(sounds).length!==variant.sounds||Object.keys(blobs).length!==(variant.id===2?1:0))throw new Error(`Payload inventory changed: ${variant.key} engine=${!!engine} json=${Object.keys(jsons).length} sounds=${Object.keys(sounds).length} blobs=${Object.keys(blobs).length}`);
  // Bridge's internal task scheduler used window messages. Keep scheduling local.
  engine=replaceOne(engine,'e.setImmediate?t.setImmediate=e.setImmediate.bind(e):t.setImmediate=function(){var e={},t=e,n=Math.random();function i(t){if(t.data==n){var i=(e=e.next).func;delete e.func,i()}}return"undefined"!=typeof window&&(window.addEventListener?window.addEventListener("message",i):window.attachEvent("onmessage",i)),function(e){t=t.next={func:e},"undefined"!=typeof window&&window.postMessage(n,"*")}}()', 't.setImmediate=function(fn){return setTimeout(fn,0)}');
  const stub = variant.id===1 ? 'window.parent&&window.parent.postMessage({target:"editor:stubber",propertyOrMethodName:e,calledFrom:C()},"*")' : 'window.parent&&window.parent.postMessage({target:"editor:stubber",propertyOrMethodName:e,calledFrom:B()},"*")';
  engine=replaceOne(engine,stub,'void e');
  // The scoped Function factory retains the native prototype. Bridge compares
  // constructors by identity, so use that prototype's constructor for its test.
  if(engine.split('constructor===Function').length!==4)throw new Error('Bridge constructor identity anchors changed');
  engine=engine.replaceAll('constructor===Function','constructor===Function.prototype.constructor');
  if(variant.id===2)engine=replaceOne(engine,'window.Mecanim().then(onMecanimLoaded)','Mecanim().then(onMecanimLoaded)');
  engine=replaceOne(engine,'var t=window.open(e,"_blank");t&&t.focus()','void e');
  engine=replaceOne(engine,'window.open("",this.name,`width=${this.width},height=${this.height}`)','({document:{write:function(){},close:function(){}}})');
  let markup=html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1].replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');
  markup=markup.replace(/data-src122="([^"]*)"\s+data-mime="([^"]*)"/g,(_,s,mime)=>`src="data:${mime};base64,${base122(s).toString('base64')}"`);
  // Some builds reverse the two attributes; retain a guarded decoder below.
  const css=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n').replace(/\bbody\s*\{/g,'.engine-root{');
  const envIndex=variant.id===1?2:2;
  let config=scripts[envIndex];
  config=config.replace(/targetPlatform\s*:\s*"[^"]+"/,'targetPlatform:"web"').replace(/"(?:iosLink|androidLink)"\s*:\s*"[^"]*"\s*,?/g,'');
  config='window.LUNA_PLAYGROUND_PACKAGE_CONFIG={orientation:"unspecified",languages:["en","en"]};window.playgroundOverrides={};window.playgroundAssetOverrides={};window.DEBUG=false;window.TRACE=false;window.DEVELOP=false;window.TESTS=false;window.FORCE_STABLE_RANDOM_SEED=false;'+config;
  const scope=read('src/engine-scope.js').replace(/^export /gm,'');
  const runtime=read('src/layout.js')+'\n'+read('src/game.js');
  const data={variant:variant.key,scene:variant.scene,markup,css,config,engine,jsons,sounds,blobs};
  const game=`(function(){\n${scope}\nconst SOURCE=${JSON.stringify(data)};\n${runtime}\n})();\n`;
  for(const prohibited of [/postMessage/,/messageHandlers/,/NovvyPlayable/,/NovvyAnalytics/,/NovvyShell/,/tracking\.novvy\.ai/,/window\.open\(/])if(prohibited.test(game))throw new Error(`Forbidden game code ${prohibited}`);
  files['game/game.js']=game;
  const logo=markup.match(/<img[^>]*class="loading-logo"[^>]*src="data:image\/png;base64,([^"]+)"/);
  if(!logo)throw new Error('Original Zen Word icon missing');
  files['game/cta-icon.png']=Buffer.from(logo[1],'base64');
}
files['game/index.html']=read('src/index.html');
files['game/host.js']=read('src/host.js');
files['source/provenance.json']=JSON.stringify(provenance,null,2)+'\n';
const manifest={id:'zen-word-100m-origin',name:'Zen Word · 1 亿展示版',version:'1.2.0',entry:'game/index.html',levels:provenance.variants.map(v=>({id:1,name:v.name,game:'game/game.js'})),constants:{game:{host:'game/host.js',ctaCard:{name:'Zen Word',icon:'game/cta-icon.png'}},fileHashes:Object.fromEntries(Object.entries(files).map(([f,s])=>[f,sha(s)]))}};
fs.mkdirSync(out,{recursive:true});
for(const [file,s] of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(out,file)),{recursive:true});fs.writeFileSync(path.join(out,file),s);}
fs.writeFileSync(path.join(out,'game-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Built Zen Word: ${Object.keys(files).length} files, one independent original playable`);
