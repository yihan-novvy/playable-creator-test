import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateLevel} from '../src/level.js';
import {prepareLevel} from '../src/game-level.js';
import {Puzzle} from '../src/model.js';
import {validatePreviewSpeed} from '../src/move-timing.js';
const sourceRoot=fileURLToPath(new URL('../',import.meta.url));
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>1024*1024)throw new Error('图案数据超过 1 MB');}return JSON.parse(text);}
export function authoringPlugin({root=sourceRoot,previewRoots={original:path.resolve(sourceRoot,'../colorever-abandoned'),new:root}}={}){return {name:'colorever-authoring',configureServer(server){
 server.middlewares.use(async(req,res,next)=>{
  const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith('/api/patterns'))return next();
  try{
   const catalog=JSON.parse(await fs.readFile(path.join(root,'src/patterns/catalog.json'),'utf8'));
   const segments=url.pathname.split('/').filter(Boolean),picture=catalog.find(p=>p.id===segments[2]);
   if(segments.length===2&&req.method==='GET')return json(res,200,catalog);
   if(!picture)return json(res,404,{error:{message:'未知图案'}});
   const file=path.join(root,'src/patterns',picture.level),saved=JSON.parse(await fs.readFile(file,'utf8'));
   if(segments.length===3&&req.method==='GET')return json(res,200,saved);
   if((segments.length===3&&req.method==='PUT')||(segments.length===4&&segments[3]==='preview'&&['GET','POST'].includes(req.method))){
    const input=req.method==='GET'?saved:await body(req);
    if(input.decoration!==saved.decoration)throw new Error('不能替换图案的专属装饰模块');
    if(req.method==='PUT'){
     // 保存标准图案:不再烘焙具体开局。开局模式与随机参数属于广告任务,由
     // 广告编辑器在生成任务时决定;这里存下的 openingMode/difficulty/seed 仅
     // 作为开发页与离线样例的演示默认。
     const level=validateLevel({...input,opening:null});
     const temp=file+'.tmp';await fs.writeFile(temp,JSON.stringify(level,null,2)+'\n');await fs.rename(temp,file);
     return json(res,200,level);
    }
    const renderer=url.searchParams.get('renderer')||'new';
    if(!Object.hasOwn(previewRoots,renderer))throw new Error('未知预览版本');
    const previewRoot=previewRoots[renderer];
    const mode=url.searchParams.get('mode')??(input.openingMode==='easy'?'easy':'medium');
    if(!['easy','medium'].includes(mode))throw new Error('预览支持简易或全局模式');
    if(mode==='medium'&&renderer!=='new')throw new Error('全局模式请使用新版 Colorever New 预览');
    const speed=validatePreviewSpeed(url.searchParams.get('speed')??1);
    const prepared={...input,opening:null,openingMode:mode,seed:url.searchParams.has('seed')?Number(url.searchParams.get('seed')):input.seed};
    const options={coverage:Number(url.searchParams.get('coverage')??95),batchSize:Number(url.searchParams.get('batch')??30)};
    const {level,proof}=prepareLevel({...prepared,...options});
    let metrics=proof.metrics;
    if(!metrics){
     const puzzle=new Puzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening}),amounts=[];
     let peakCache=0;
     for(const hint of proof.solution)if(hint.action==='pick')puzzle.pick(hint.region,hint.index);else{amounts.push(puzzle.place(hint.region,hint.index).filter(m=>!m.shift).length);peakCache=Math.max(peakCache,puzzle.tray.filter(Boolean).length);}
     const wrongBeads=level.target.reduce((n,c,i)=>n+Number(c!==level.opening[i]),0);
     metrics={total:puzzle.total,wrongBeads,wrongPercent:Math.round(wrongBeads/puzzle.total*1000)/10,averageBatch:Math.round(amounts.reduce((sum,n)=>sum+n,0)/amounts.length*10)/10,peakCache,moves:proof.moves};
    }
    if(url.searchParams.get('completed')==='1')level.opening=[...level.target];
    const inline=value=>JSON.stringify(value).replaceAll('<','\\u003c');
    let html=await fs.readFile(path.join(previewRoot,'index.html'),'utf8');
    // Both renderers consume the same prepared draft. Vite serves a sibling
    // renderer from this server, without requiring another localhost port.
    if(path.resolve(previewRoot)!==path.resolve(root))html=html.replace('src="/src/main.js"',`src="/@fs/${encodeURI(path.join(previewRoot,'src/main.js').replaceAll(path.sep,'/'))}"`);
    html=html.replace('<body>',`<body data-colorever-renderer="${renderer}">`);
    const preview={globalMode:mode==='medium',batchSize:options.batchSize,id:url.searchParams.get('previewId')??'',speed};
    html=html.replace('</head>',`<base href="/"><script>globalThis.__COLOREVER_PATTERN_ID__=${inline(picture.id)};globalThis.__COLOREVER_LEVEL__=${inline(level)};globalThis.__COLOREVER_PREVIEW__=${inline(preview)};</script>${url.searchParams.get('completed')==='1'?'<style>#win{display:none!important}</style>':''}</head>`);
    html=await server.transformIndexHtml('/index.html',html);
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Colorever-Solution-Moves':String(proof.moves),'X-Colorever-Renderer':renderer,'X-Colorever-Opening-Metrics':JSON.stringify(metrics)});return res.end(html);
   }
   return json(res,405,{error:{message:'不支持此操作'}});
  }catch(error){return json(res,400,{error:{message:error.message}});}
 });
}};}
