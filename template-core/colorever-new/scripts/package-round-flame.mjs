import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {coloreverLevel,coloreverHtml} from '../../../editor/plugins/colorever-new/lib.mjs';
import {validateLevel} from '../src/level.js';
import {emitDecorators} from './build-decorators.mjs';

// Export the built colorever-new template as a standalone, offline demo.
// --build refreshes only this pattern and its registration before packaging.
// Other patterns and the shared engine are preserved.
const sourceRoot=fileURLToPath(new URL('../',import.meta.url));
const root=path.resolve(sourceRoot,'../../editor/templates/colorever-new');
const template=JSON.parse(await fs.readFile(path.join(root,'template.json'),'utf8'));
const source=JSON.parse(await fs.readFile(path.join(sourceRoot,'src/patterns/round-flame.json'),'utf8'));
const args=process.argv.slice(2);
if(args.length&&!(args.length===1&&args[0]==='--build'))throw new Error('Usage: node scripts/package-round-flame.mjs [--build]');
if(args.includes('--build')){
  const id='round-flame',hash=value=>createHash('sha256').update(value).digest('hex');
  const picture=JSON.parse(await fs.readFile(path.join(sourceRoot,'src/patterns/catalog.json'),'utf8')).find(p=>p.id===id);
  if(!picture)throw new Error('Missing round-flame source registration');
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'round-flame-build-'));
  try{
    const decorators=await emitDecorators([picture],temp);
    const data=JSON.stringify(validateLevel({...source,opening:null}));
    const catalogPath=path.join(root,'game/patterns/catalog.json');
    const catalog=JSON.parse(await fs.readFile(catalogPath,'utf8'));
    if(hash(await fs.readFile(path.join(root,'game/game.js')))!==catalog.engineSha256||hash(await fs.readFile(path.join(root,'game',catalog.levelEngine)))!==catalog.levelEngineSha256)throw new Error('Existing colorever-new engine does not match its catalog');
    const entry={id,name:picture.name,description:picture.description,level:id+'.json',templateSha256:hash(data)};
    const index=catalog.patterns.findIndex(p=>p.id===id);
    if(index<0)catalog.patterns.push(entry);else catalog.patterns[index]=entry;
    catalog.decorators[id]=decorators[id];
    await fs.writeFile(path.join(root,'game/patterns',entry.level),data);
    await fs.copyFile(path.join(temp,decorators[id].file),path.join(root,'game',decorators[id].file));
    await fs.writeFile(catalogPath+'.round-flame.tmp',JSON.stringify(catalog,null,2)+'\n');
    await fs.rename(catalogPath+'.round-flame.tmp',catalogPath);
    const manifestPath=path.join(root,'game-manifest.json');
    const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
    const registered={id,name:picture.name,path:`game/patterns/${id}.json`};
    const levelIndex=manifest.levels.findIndex(p=>p.id===id);
    if(levelIndex<0)manifest.levels.push(registered);else manifest.levels[levelIndex]=registered;
    await fs.writeFile(manifestPath+'.round-flame.tmp',JSON.stringify(manifest,null,2)+'\n');
    await fs.rename(manifestPath+'.round-flame.tmp',manifestPath);
  }finally{await fs.rm(temp,{recursive:true,force:true});}
}
const config={...template.defaults,patternId:'round-flame',opening:{mode:source.openingMode,difficulty:source.difficulty,seed:source.seed},cta:{enabled:false}};
const {level,proof}=await coloreverLevel(root,config,template);
const {html}=await coloreverHtml({root,template,config,level});
const script=await fs.readFile(path.join(root,'game/game.js'),'utf8');
const playable=html.replace('<script src="game.js" defer></script>',()=>`<script>${script.replace(/<\/script/gi,'<\\/script')}</script>`);
const out=path.join(sourceRoot,'docs/round-flame-playable.html');
await fs.mkdir(path.dirname(out),{recursive:true});
await fs.writeFile(out,playable);
console.log(`${out} (${Buffer.byteLength(playable)} bytes, ${proof.moves} placements)`);
