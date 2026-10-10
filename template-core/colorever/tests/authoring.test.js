import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {authoringPlugin} from '../scripts/authoring.mjs';
import {authoringPlugin as newAuthoringPlugin} from '../../colorever-new/scripts/authoring.mjs';
import {compilePatterns} from '../scripts/pattern-artifact.mjs';
test('Colorever owns visual authoring and saves standard patterns without baked openings',async()=>{
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
  const data=await saved.json();assert.equal(data.openingMode,'easy');assert.equal(data.opening,null);
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(root,'src/patterns/cat.json'),'utf8')),data);
  const bad=await fetch(base+'/api/patterns/cat',{...options,method:'PUT',body:JSON.stringify({...draft,target:[255]})});assert.equal(bad.status,400);
  const built=await compilePatterns();assert.ok(built.every(p=>p.level.opening===null&&Number.isInteger(p.level.seed)));
 }finally{if(server)await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true});}
});

test('Both studios switch renderers using the same draft and opening without changing pattern files',async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'colorever-renderer-preview-'));
 const roots={original:path.join(temp,'original'),new:path.join(temp,'new')};
 let server;
 try{
  for(const renderer of Object.keys(roots)){
   const root=roots[renderer];await fs.mkdir(path.join(root,'src/patterns'),{recursive:true});
   for(const file of ['cat.json','catalog.json'])await fs.copyFile(new URL('../src/patterns/'+file,import.meta.url),path.join(root,'src/patterns',file));
   await fs.copyFile(new URL('../index.html',import.meta.url),path.join(root,'index.html'));
  }
  const original=await fs.readFile(path.join(roots.original,'src/patterns/cat.json'),'utf8');
  const draft={...JSON.parse(original),name:'Renderer comparison draft',opening:null,openingMode:'easy',seed:7,decorations:{bow:{offsetX:.7,offsetY:0,scale:1.1}}};
  const options={method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)};
  for(const [host,plugin]of [['original',authoringPlugin],['new',newAuthoringPlugin]]){
   let handler;plugin({root:roots[host],previewRoots:roots}).configureServer({middlewares:{use(fn){handler=fn;}},transformIndexHtml:async(_,html)=>html});
   server=http.createServer((req,res)=>handler(req,res,()=>{res.writeHead(404);res.end();}));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const base=`http://127.0.0.1:${server.address().port}`;
   const defaultPreview=await fetch(base+'/api/patterns/cat/preview?completed=1',options);
   assert.equal(defaultPreview.headers.get('X-Colorever-Renderer'),host,'each studio keeps its current default renderer');
   await defaultPreview.text();
   for(const completed of [0,1]){
    const levels=[];
    for(const renderer of Object.keys(roots)){
     const response=await fetch(base+`/api/patterns/cat/preview?completed=${completed}&renderer=${renderer}`,options),html=await response.text();
     assert.equal(response.status,200);assert.equal(response.headers.get('X-Colorever-Renderer'),renderer);
     assert.ok(html.includes(`data-colorever-renderer="${renderer}"`));
     assert.ok(html.includes('<base href="/">'),'preview audio resolves from the studio root');
     if(renderer===host)assert.ok(html.includes('src="/src/main.js"'));
     else assert.ok(html.includes(`/@fs/${roots[renderer]}/src/main.js`),'the sibling renderer is served by this studio');
     const level=JSON.parse(html.split('globalThis.__COLOREVER_LEVEL__=')[1].split(';</script>')[0]);
     assert.deepEqual(level.target,draft.target);assert.deepEqual(level.decorations,draft.decorations);
     if(completed)assert.deepEqual(level.opening,level.target);
     levels.push(level);
    }
    assert.deepEqual(levels[0],levels[1],'renderer changes preserve the entire prepared level and opening');
   }
   const bad=await fetch(base+'/api/patterns/cat/preview?renderer=unknown',options);assert.equal(bad.status,400);
   await new Promise(resolve=>server.close(resolve));server=null;
  }
  for(const root of Object.values(roots))assert.equal(await fs.readFile(path.join(root,'src/patterns/cat.json'),'utf8'),original,'previewing never saves either pattern store');
 }finally{if(server)await new Promise(resolve=>server.close(resolve));await fs.rm(temp,{recursive:true,force:true});}
});
