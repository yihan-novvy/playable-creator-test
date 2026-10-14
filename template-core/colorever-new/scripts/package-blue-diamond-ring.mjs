import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {coloreverLevel,coloreverHtml} from '../../../editor/plugins/colorever-new/lib.mjs';

// Package the actual built colorever-new template as an offline playable.
// Run npm run build first. All outputs remain inside colorever-new.
const sourceRoot=fileURLToPath(new URL('../',import.meta.url));
const root=path.resolve(sourceRoot,'../../editor/templates/colorever-new');
const template=JSON.parse(await fs.readFile(path.join(root,'template.json'),'utf8'));
const source=JSON.parse(await fs.readFile(path.join(sourceRoot,'src/patterns/blue-diamond-ring.json'),'utf8'));
const config={...template.defaults,patternId:'blue-diamond-ring',opening:{mode:source.openingMode,difficulty:source.difficulty,seed:source.seed},cta:{enabled:false}};
const {level,proof}=await coloreverLevel(root,config,template);
const {html}=await coloreverHtml({root,template,config,level});
const script=await fs.readFile(path.join(root,'game/game.js'),'utf8');
const tag='<script src="game.js" defer></script>';
if(!html.includes(tag))throw new Error('Built template is missing its game script');
const playable=html.replace(tag,()=>`<script>${script.replace(/<\/script/gi,'<\\/script')}</script>`);
const out=path.join(sourceRoot,'docs/blue-diamond-ring-playable.html');
await fs.mkdir(path.dirname(out),{recursive:true});
await fs.writeFile(out,playable);
console.log(`${out} (${Buffer.byteLength(playable)} bytes, ${proof.moves} placements)`);
