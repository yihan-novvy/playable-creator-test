import {buildGameBundle} from './build-game-bundle.mjs';
import {compilePatterns,resolveOpenings} from './pattern-artifact.mjs';
import {emitDecorators} from './build-decorators.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
// 引擎包不再内嵌关卡与装饰:离线样例与广告包走同一套注入契约(样式不同,
// 数据相同)。默认样例用 cat,开局用模板自带演示参数(resolveOpenings)。
const fallback=resolveOpenings(await compilePatterns()).find(picture=>picture.id==='cat');
const {js,css,audio,html:source}=await buildGameBundle();
let html=source.replace(/<script\s+type="module"[^>]*>[\s\S]*?<\/script>/g,'');
html=html.replace('</head>',()=>`<style>${css}</style></head>`);
const out=fileURLToPath(new URL('../dist-offline/',import.meta.url));
const decorators=await emitDecorators([{id:fallback.id,module:fallback.module}],out);
const decorator=decorators[fallback.id]?(await fs.readFile(path.join(out,decorators[fallback.id].file),'utf8')):'';
const globals=`globalThis.__COLOREVER_PATTERN_ID__=${JSON.stringify(fallback.id)};globalThis.__COLOREVER_LEVEL__=${JSON.stringify(fallback.level).replaceAll('<','\\u003c')};${decorator}`.replace(/<\/script/gi,'<\\/script');
const script=`globalThis.__COLOREVER_OFFLINE_AUDIO__=${JSON.stringify(audio)};\n${js}`.replace(/<\/script/gi,'<\\/script');
html=html.replace('</head>',()=>`<script>${globals}</script></head>`);
html=html.replace('</body>',()=>`<script>${script}</script></body>`);
await fs.mkdir(out,{recursive:true});await fs.writeFile(out+'Colorever.html',html);
console.log(`Offline HTML: ${out}Colorever.html (${Buffer.byteLength(html).toLocaleString()} bytes)`);
