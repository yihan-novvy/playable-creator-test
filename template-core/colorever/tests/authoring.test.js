import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {authoringPlugin} from '../scripts/authoring.mjs';
import {compilePatterns} from '../scripts/pattern-artifact.mjs';
test('Colorever alone owns visual authoring, source saves, preview and build-time openings',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'colorever-authoring-'));
 let server;
 try{
  await fs.mkdir(path.join(root,'src/patterns'),{recursive:true});
  for(const file of ['cat.json','catalog.json'])await fs.copyFile(new URL('../src/patterns/'+file,import.meta.url),path.join(root,'src/patterns',file));
  await fs.copyFile(new URL('../index.html',import.meta.url),path.join(root,'index.html'));
  let handler;authoringPlugin({root}).configureServer({middlewares:{use(fn){handler=fn;}},transformIndexHtml:async(_,html)=>html});
  server=http.createServer((req,res)=>handler(req,res,()=>{res.writeHead(404);res.end();}));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const original=await(await fetch(base+'/api/patterns/cat')).json();
  const draft={...original,name:'Author </script>',opening:null,openingMode:'easy',decorations:{bow:{offsetX:.7,scale:1.1}}};
  const options={method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)};
  const preview=await fetch(base+'/api/patterns/cat/preview?completed=0',options),html=await preview.text();
  assert.equal(preview.status,200);assert.ok(Number(preview.headers.get('X-Colorever-Solution-Moves'))<=6);
  assert.ok(html.includes('/src/main.js')&&html.includes('"offsetX":0.7'));assert.ok(!html.includes('Author </script>'));
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(root,'src/patterns/cat.json'),'utf8')),original);
  const saved=await fetch(base+'/api/patterns/cat',{...options,method:'PUT'});assert.equal(saved.status,200);
  const data=await saved.json();assert.equal(data.openingMode,'easy');assert.ok(Array.isArray(data.opening));
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(root,'src/patterns/cat.json'),'utf8')),data);
  const bad=await fetch(base+'/api/patterns/cat',{...options,method:'PUT',body:JSON.stringify({...draft,target:[255]})});assert.equal(bad.status,400);
  const built=await compilePatterns();assert.ok(built.every(p=>Array.isArray(p.level.opening)&&Number.isInteger(p.proof.moves)));
 }finally{if(server)await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true});}
});
