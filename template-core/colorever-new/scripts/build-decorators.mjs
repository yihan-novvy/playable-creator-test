import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
const root=fileURLToPath(new URL('../',import.meta.url));
const virtual=id=>`virtual:colorever-decorator:${id}`;
// 装饰代码与引擎分离的产物:每个图案的装饰模块打成自包含 chunk,three 改为
// 工厂参数注入(片段作为内联脚本先于 defer 的 game.js 执行,THREE 要到
// buildLevel 调用时才取),再包成一条注册语句:
//   (globalThis.__COLOREVER_DECORATORS__??={})["<id>"]=function(E){...;return decorate;};
// 广告编辑器按所选图案(主关+第二关)把对应片段内联进 index.html,引擎包
// 不再携带任何装饰代码——新增图案不改变 game.js 字节与 engineSha256。
export async function emitDecorators(pictures,outDir){
 const input=Object.fromEntries(pictures.map(picture=>[picture.id,virtual(picture.id)]));
 const result=await build({configFile:false,root,publicDir:false,logLevel:'warn',plugins:[{name:'colorever-decorator-entries',enforce:'pre',resolveId(id){return id.startsWith('virtual:colorever-decorator:')?id:undefined;},load(id){const picture=pictures.find(p=>virtual(p.id)===id);return picture?`import {decorate} from ${JSON.stringify(path.join(root,'src/patterns',picture.module))};\nexport default decorate;`:undefined;}}],build:{write:false,minify:true,cssCodeSplit:false,rollupOptions:{input,external:id=>id==='three',preserveEntrySignatures:'strict',output:{format:'es',entryFileNames:'[name].js'}}}});
 const chunks=(Array.isArray(result)?result:[result]).flatMap(r=>r.output).filter(o=>o.type==='chunk');
 if(chunks.length!==pictures.length)throw new Error(`装饰模块产生了共享 chunk(${chunks.length} != ${pictures.length});装饰模块应只依赖 three,共享代码请内联进各图案模块`);
 await fs.mkdir(path.join(outDir,'decorators'),{recursive:true});
 const decorators={};
 for(const chunk of chunks){
  const id=String(chunk.facadeModuleId??'').match(/^virtual:colorever-decorator:(.+)$/)?.[1];
  if(!id)throw new Error('装饰 chunk 缺少虚拟入口标记');
  const code=String(chunk.code);
  const imported=code.match(/import\s*\*\s*as\s+([\w$]+)\s*from\s*(["'])three\2;?/);
  const exported=code.match(/export\{([\w$]+) as default\};?/);
  if(!exported)throw new Error(`装饰模块 ${id} 的导出形态无法识别: …${code.slice(-120)}`);
  // 工厂参数名不得与压缩后的顶层绑定撞名(含 three 的局部名,防 TDZ),逐候选排除。
  const taken=new Set([exported[1],imported?.[1]].filter(Boolean));
  const param=['E','T','_','C'].find(name=>!taken.has(name)&&!new RegExp(`\\b(?:const|let|var|function|class)\\s+${name}\\b`).test(code))??(()=>{throw new Error('无法为装饰模块选择工厂参数名: '+id)})();
  // three 引用改为工厂参数注入;空壳装饰没有 three import,允许缺失。
  const body=code.replace(/import\s*\*\s*as\s+([\w$]+)\s*from\s*(["'])three\2;?/,(_,local)=>`const ${local}=${param}.THREE;`).replace(/export\{[\w$]+ as default\};?/,'');
  const snippet=`(globalThis.__COLOREVER_DECORATORS__??={})[${JSON.stringify(id)}]=function(${param}){${body}return ${exported[1]};};\n`;
  if(/(?:^|[;\n])\s*import\s/.test(snippet))throw new Error(`装饰片段 ${id} 残留外部 import,three 外部化失败`);
  const file=`decorators/${id}.js`;
  await fs.writeFile(path.join(outDir,file),snippet);
  decorators[id]={file,sha256:createHash('sha256').update(snippet).digest('hex')};
 }
 return decorators;
}
