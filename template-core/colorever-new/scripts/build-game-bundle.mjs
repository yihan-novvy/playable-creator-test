import {patternRegistry} from './pattern-artifact.mjs';
import {build} from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function buildGameBundle(){
const result=await build({configFile:false,root,publicDir:false,plugins:[{name:'fixed-picture-registry',load(id){if(id===path.join(root,'src/patterns/index.js'))return patternRegistry();}}],build:{write:false,minify:true,cssCodeSplit:false,lib:{entry:path.join(root,'src/main.js'),name:'ColoreverOffline',formats:['iife']},rollupOptions:{output:{inlineDynamicImports:true}}}});
const output=(Array.isArray(result)?result:[result]).flatMap(r=>r.output);
const js=output.filter(o=>o.type==='chunk').map(o=>o.code).join('\n');
if(/(?:^|[;\n])\s*import\s/.test(js))throw new Error('Offline output still contains external imports');
const css=output.filter(o=>o.type==='asset'&&o.fileName.endsWith('.css')).map(o=>String(o.source)).join('\n');
const audio={};for(const name of ['bgm','pickup','place','place-single','store','store-move','success'])audio[name]=(await fs.readFile(path.join(root,`public/audio/${name}.mp3`))).toString('base64');
return {js,css,audio,html:await fs.readFile(path.join(root,'index.html'),'utf8')};
}
