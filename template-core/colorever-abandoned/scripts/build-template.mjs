import {compilePatterns} from './pattern-artifact.mjs';
import {createHash} from 'node:crypto';
import {build} from 'vite';
import {buildGameBundle} from './build-game-bundle.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2);
if(args.length && (args.length!==2 || args[0]!=='--out' || !args[1]))throw new Error('Usage: npm run build:game -- [--out <dir>]');
const root=fileURLToPath(new URL('../',import.meta.url));
const out=args.length?path.resolve(args[1]):path.join(root,'build/template');
const pictures=await compilePatterns();
const {js,css,audio,html:source}=await buildGameBundle(pictures);
const html=source.replace(/<script\s+type="module"[^>]*>[\s\S]*?<\/script>/g,'')
  .replace('</head>',()=>`<style>${css}</style></head>`)
  .replace('</body>',()=>'<script src="game.js" defer></script></body>');
const script=`globalThis.__COLOREVER_OFFLINE_AUDIO__=${JSON.stringify(audio)};\n${js}`;
if(/type="module"|crossorigin|reference-kitty-source|成品参考/.test(html))throw new Error('Template shell retains unsupported resources');
if(/(?:^|[;\n])\s*import\s/.test(script))throw new Error('Template bundle retains external imports');
await fs.mkdir(out,{recursive:true});
for(const [name,content]of [['index.html',html],['game.js',script]]){
  await fs.writeFile(path.join(out,name),content);
  console.log(`${path.join(out,name)} (${Buffer.byteLength(content).toLocaleString()} bytes)`);
}

// Export validated pattern templates plus the opening engine. Patterns carry no
// baked opening; the ad editor generates per-task openings via the engine.
const hash=text=>createHash('sha256').update(text).digest('hex');
// 开局引擎(prepareLevel/validateLevel/solveLevel 及 model 依赖)打成自包含 ESM,
// 广告编辑器按任务配置即时生成开局;sha 经 catalog 与 manifest 双重锁定。
const engineBuild=await build({configFile:false,root,publicDir:false,build:{write:false,minify:true,cssCodeSplit:false,lib:{entry:path.join(root,'src/level.js'),formats:['es']},rollupOptions:{output:{inlineDynamicImports:true}}}});
const engine=(Array.isArray(engineBuild)?engineBuild:[engineBuild]).flatMap(r=>r.output).filter(o=>o.type==='chunk').map(o=>o.code).join('\n');
if(/(?:^|[;\n])\s*import\s/.test(engine))throw new Error('Level engine retains external imports');
if(!/\bprepareLevel\b/.test(engine))throw new Error('Level engine lost its entry exports');
await fs.writeFile(path.join(out,'level-engine.mjs'),engine);
console.log(`${path.join(out,'level-engine.mjs')} (${Buffer.byteLength(engine).toLocaleString()} bytes)`);
const catalog={version:2,engineSha256:hash(script),levelEngine:'level-engine.mjs',levelEngineSha256:hash(engine),patterns:[]};
await fs.mkdir(path.join(out,'patterns'),{recursive:true});
for(const picture of pictures){
 const file=picture.id+'.json',text=JSON.stringify(picture.level);
 if(picture.level.opening!==null)throw new Error('Pattern template must not carry a baked opening');
 await fs.writeFile(path.join(out,'patterns',file),text);
 catalog.patterns.push({id:picture.id,name:picture.name,description:picture.description,level:file,templateSha256:hash(text)});
}
await fs.writeFile(path.join(out,'patterns/catalog.json'),JSON.stringify(catalog,null,2)+'\n');

// 游戏侧契约清单：plugin/editor 只经 manifest 消费图案与常量，不猜游戏内部路径。
const {version}=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
const manifest={
  id:'colorever-abandoned',
  name:'Colorever',
  version,
  entry:'game/index.html',
  levels:pictures.map(picture=>({id:picture.id,name:picture.name,path:`game/patterns/${picture.id}.json`})),
  constants:{engineSha256:catalog.engineSha256,patternsCatalog:'game/patterns/catalog.json',levelEngine:'game/level-engine.mjs',levelEngineSha256:catalog.levelEngineSha256},
};
await fs.writeFile(path.resolve(out,'..','game-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(path.resolve(out,'..','game-manifest.json'));
