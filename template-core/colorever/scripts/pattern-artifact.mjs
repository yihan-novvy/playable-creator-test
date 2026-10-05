import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareLevel} from '../src/level.js';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function compilePatterns(){
 const catalog=JSON.parse(await fs.readFile(path.join(root,'src/patterns/catalog.json'),'utf8'));
 const result=[];
 for(const picture of catalog){
  if(!/^[a-z][a-z0-9-]*$/.test(picture.id)||!/^[-a-z0-9]+\.json$/.test(picture.level)||!/^[-a-z0-9]+\.js$/.test(picture.module))throw new Error('Invalid picture catalog entry');
  const {level,proof}=prepareLevel(JSON.parse(await fs.readFile(path.join(root,'src/patterns',picture.level),'utf8')));
  result.push({id:picture.id,name:picture.name,description:picture.description,module:picture.module,level,proof:{moves:proof.moves}});
 }
 return result;
}
export function patternRegistry(pictures){
 return pictures.map((p,i)=>`import {decorate as decorate${i}} from ${JSON.stringify(path.join(root,'src/patterns',p.module))};`).join('\n')+'\nexport const patterns={'+pictures.map((p,i)=>`${JSON.stringify(p.id)}:{level:${JSON.stringify(p.level)},decorate:decorate${i}}`).join(',')+'};';
}
