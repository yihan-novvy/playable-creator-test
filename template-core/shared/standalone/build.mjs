import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {deflateSync,inflateSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {buildSync} from 'esbuild';

export const ROOT=fileURLToPath(new URL('../../../',import.meta.url));
export const IDS=['block-out-origin','candy-crush-origin','color-block-jam-origin','freecell-origin','grill-sort-origin','pixel-flow-origin','project-makeover-origin','screwdom-origin','tasty-travels-origin','travel-town-origin','water-sort','word-search-explorer-origin','zen-word-100m-origin','zen-word-92m-origin'];
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const sha=data=>createHash('sha256').update(data).digest('hex');
const METHODS=['init','start','pause','resume','replay','end','destroy','setEnv','setMuted','setInsets','resize','getState','on','off'];
const decoder=()=>buildSync({stdin:{contents:"export {unzlibSync} from 'three/examples/jsm/libs/fflate.module.js'",resolveDir:ROOT},write:false,bundle:true,format:'iife',globalName:'EmbeddedDeflate',minify:true,legalComments:'eof',target:'es2020'}).outputFiles[0].text;

export function validatePayload(source,id) {
  new vm.Script(source,{filename:id+'/game.js'});
  for(const pattern of [/postMessage/,/webkit\.messageHandlers/,/NovvyPlayable|NovvyAnalytics|NovvyShell/,/tracking\.novvy\.ai/,/window\.open\(/,/getElementById\(["']novvy/]) {
    if(pattern.test(source))throw new Error(id+': forbidden game dependency '+pattern);
  }
  let registrations=0;
  vm.runInNewContext(source,{NovvyGame(entry){if(typeof entry!=='function')throw new Error('Invalid entry');registrations++;}},{timeout:1000});
  if(registrations!==1)throw new Error(id+': expected exactly one synchronous registration');
}

export function packageGame(source,metadata) {
  validatePayload(source,metadata.id);
  const bytes=Buffer.from(source),packed=deflateSync(bytes,{level:9});
  if(!inflateSync(packed).equals(bytes))throw new Error('Embedded payload roundtrip failed');
  const runtime=read('template-core/shared/standalone/runtime.js').replace(/^export /gm,'');
  const output=`(function(){\n${decoder()}\n${runtime}\nconst metadata=${JSON.stringify(metadata)};\nconst payload=${JSON.stringify(packed.toString('base64'))};\nconst bytes=Uint8Array.from(atob(payload),c=>c.charCodeAt(0));\nconst source=new TextDecoder().decode(EmbeddedDeflate.unzlibSync(bytes));\nlet factory;\nnew Function('NovvyGame',source)(function(entry){if(factory)throw new Error('Duplicate embedded entry');factory=entry;});\nif(!factory)throw new Error('Missing embedded entry');\nNovvyGame(createStandaloneEntry(factory,metadata));\n})();\n`;
  if(Buffer.byteLength(output)>5000000)throw new Error(metadata.id+': single game.js exceeds 5 MB');
  new vm.Script(output);
  let count=0;
  vm.runInNewContext(output,{TextDecoder,atob,NovvyGame(entry){if(typeof entry!=='function')throw new Error('Invalid public entry');count++;}},{timeout:5000});
  if(count!==1)throw new Error('Public registration failed');
  return {output,payloadSha256:sha(source),uncompressedBytes:bytes.length};
}

function waterSource() {
  const engine=buildSync({entryPoints:[path.join(ROOT,'template-core/water-sort/src/standalone-engine.js')],bundle:true,format:'iife',write:false,minify:true,legalComments:'eof',loader:{'.mp3':'dataurl'},target:'es2020'}).outputFiles[0].text;
  const scope=read('template-core/shared/origin-standalone/engine-scope.js').replace(/^export /gm,'');
  const stone='data:image/svg+xml;base64,'+Buffer.from(read('template-core/water-sort/public/stone.svg')).toString('base64');
  const css='.engine-root{background:#30322e url("'+stone+'") center/cover;touch-action:none}canvas{display:block;width:100%;height:100%}';
  return `(function(){\n${scope}\nNovvyGame(function(root,shell,options){\nconst view=engineRoot(root,'',${JSON.stringify(css)});\nconst scope=createEngineScope(view.root);\ntry { scope.run(${JSON.stringify(engine)});const game=scope.window.createWaterSort(view.root,shell,options.env||{});\nreturn {start(){scope.resume();game.start();},pause(){game.pause();scope.pause();},resume(){scope.resume();game.resume();},setEnv:game.setEnv,destroy(){try{game.destroy();}finally{scope.dispose();view.mount.remove();}}};\n}catch(error){scope.dispose();view.mount.remove();throw error;}\n});\n})();`;
}

export function buildAll({rebuild=true}={}) {
  const delivery=path.join(ROOT,'result/standalone-games');fs.mkdirSync(delivery,{recursive:true});
  const catalog={apiVersion:'1.0',protocol:'https://developer.novvy.ai/eventLogs',excluded:['colorever-*','escape-arrow','dragon-cube*'],methods:METHODS,events:['ready','start','pause','resume','step','result','retry','level','end','sound','env','destroy'],games:[]};
  for(const id of IDS) {
    if(rebuild&&id!=='water-sort')execFileSync(process.execPath,[path.join(ROOT,'template-core',id,'scripts/build.mjs')],{cwd:ROOT,stdio:'inherit'});
    let source=id==='water-sort'?waterSource():read(`editor/templates/${id}/game/game.js`);
    // Final standalone artifacts have no game-owned replay/end controls. The
    // host can enable replay through the uniform entry option instead.
    source=source.replace(/const GAME_CONFIG=\/\*ORIGIN_GAME_CONFIG\*\/([^;]+);/,(_,json)=>'const GAME_CONFIG=/*ORIGIN_GAME_CONFIG*/'+JSON.stringify({...JSON.parse(json),allowReplay:false})+';');
    const manifest=JSON.parse(read(`editor/templates/${id}/game-manifest.json`));
    const metadata={id,name:manifest.name,levelCount:id==='block-out-origin'?2:id==='color-block-jam-origin'?3:1,playableType:'level'};
    const {output,...check}=packageGame(source,metadata);
    const local=`editor/templates/${id}/standalone/game.js`;
    for(const file of [path.join(ROOT,local),path.join(delivery,id,'game.js')]){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,output);}
    const entry={...metadata,file:local,bytes:Buffer.byteLength(output),sha256:sha(output),...check};catalog.games.push(entry);
    fs.writeFileSync(path.join(ROOT,`editor/templates/${id}/standalone/manifest.json`),JSON.stringify({...entry,methods:METHODS},null,2)+'\n');
    console.log(`Standalone ${id}: ${entry.bytes} bytes`);
  }
  fs.writeFileSync(path.join(delivery,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
  fs.writeFileSync(path.join(ROOT,'editor/templates/standalone-catalog.json'),JSON.stringify(catalog,null,2)+'\n');
  const rows=catalog.games.map(game=>`| ${game.name} | [game.js](./${game.id}/game.js) | ${(game.bytes/1000000).toFixed(3)} | ${game.levelCount} |`).join('\n');
  fs.writeFileSync(path.join(delivery,'README.md'),`# 独立 game.js 文件清单\n\n共 ${catalog.games.length} 个游戏，每个子目录只提供一个 game.js，资源全部内嵌。无需配套 assets 或 ZIP。\n\n排除 Colorever、Escape Arrow、Dragon Cube 系列。\n\n| 模板 | 文件 | 大小（MB，十进制） | 关卡数 |\n|---|---|---:|---:|\n${rows}\n\n统一方法：init / start / pause / resume / replay / end / destroy / setEnv / setMuted / setInsets / resize / getState，事件通过 on / off 监听。\n\n完整接口说明见 [接口文档](../../docs/origin-standalone-export.md)。构建命令：npm run build:standalone。\n\n本地检查不等于平台事件验收；本次未登录、未上传。\n`);
  return catalog;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))buildAll({rebuild:!process.argv.includes('--no-rebuild')});
