import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {prepareLevel,validateLevel} from '../src/level.js';
import {Puzzle} from '../src/model.js';
import {decorate} from '../src/patterns/golden-retriever.js';

const read=relative=>fs.readFileSync(new URL(relative,import.meta.url));
const source=JSON.parse(read('../src/patterns/golden-retriever.json'));

test('The retriever uses one connected coarse-grid silhouette and playable structures',()=>{
  assert.equal(source.width,30);assert.equal(source.height,32);
  assert.equal(Object.keys(source.colors).length,7);
  assert.deepEqual(new Set(source.target.filter(Boolean)),new Set(Object.keys(source.colors).map(Number)));
  assert.equal(source.opening,null);assert.equal(source.decoration,'none');
  const puzzle=new Puzzle({width:source.width,height:source.height,target:source.target,openingBoard:source.target});
  assert.equal(puzzle.connected(source.target.findIndex(Boolean),i=>source.target[i]!==0).length,puzzle.total);
  assert.ok(puzzle.total<source.target.length*.65,'the silhouette leaves breathing room');
  for(let x=0;x<source.width;x++)assert.equal(source.target[x]+source.target[(source.height-1)*source.width+x],0);
  for(let y=0;y<source.height;y++)assert.equal(source.target[y*source.width]+source.target[y*source.width+source.width-1],0);
  decorate({scene:{add(){assert.fail('ears, face, harness and tag must all remain playable beads');}}});
});

test('All retriever opening modes conserve beads and replay the actual puzzle to completion',()=>{
  for(const openingMode of ['easy','medium','scattered'])for(const seed of [0,7,173,source.seed]){
    const {level,proof}=prepareLevel({...source,openingMode,seed});
    assert.deepEqual(level,prepareLevel({...source,openingMode,seed}).level);
    assert.deepEqual([...level.opening].sort((a,b)=>a-b),[...source.target].sort((a,b)=>a-b));
    assert.ok(level.opening.every((c,i)=>(c===0)===(source.target[i]===0)));
    if(openingMode==='easy')assert.ok(proof.moves>0&&proof.moves<=6);
    if(openingMode==='medium')assert.ok(proof.moves>=12&&proof.moves<=14);
    const puzzle=new Puzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening});
    for(const move of proof.solution)assert.ok(move.action==='pick'?puzzle.pick(move.region,move.index):puzzle.place(move.region,move.index));
    assert.ok(puzzle.complete);assert.equal(puzzle.tray.filter(Boolean).length,0);
    assert.ok(puzzle.undo());assert.ok(!puzzle.complete);
    puzzle.reset();assert.deepEqual(puzzle.board,level.opening);
  }
});

test('The demo opening preserves the entire head, the harness and the gold tag',()=>{
  const {level,proof}=prepareLevel(source);
  assert.deepEqual(level.opening.slice(0,20*source.width),source.target.slice(0,20*source.width));
  source.target.forEach((c,i)=>{
    if(c===6||c===7)assert.equal(level.opening[i],c,'the navy harness stays readable at the start');
  });
  for(let y=25;y<=27;y++)for(let x=19;x<=21;x++)assert.equal(level.opening[y*source.width+x],source.target[y*source.width+x]);
  assert.equal(proof.moves,5);
});

test('The actual colorever-new template and offline ZIP contain the registered retriever',()=>{
  const prefix='../../../editor/templates/colorever-new/';
  const catalog=JSON.parse(read(prefix+'game/patterns/catalog.json'));
  const entry=catalog.patterns.find(p=>p.id==='golden-retriever');assert.ok(entry);
  const hash=data=>createHash('sha256').update(data).digest('hex');
  const pattern=read(prefix+'game/patterns/'+entry.level);
  assert.equal(hash(pattern),entry.templateSha256);
  assert.deepEqual(JSON.parse(pattern),validateLevel(source));
  const decorator=catalog.decorators['golden-retriever'];
  assert.equal(hash(read(prefix+'game/'+decorator.file)),decorator.sha256);
  assert.equal(hash(read(prefix+'game/game.js')),catalog.engineSha256);
  assert.equal(hash(read(prefix+'game/'+catalog.levelEngine)),catalog.levelEngineSha256);
  assert.ok(JSON.parse(read(prefix+'game-manifest.json')).levels.some(p=>p.id==='golden-retriever'&&p.path==='game/patterns/golden-retriever.json'));
  const html=read('../docs/golden-retriever-playable.html').toString();
  assert.ok(html.includes('__COLOREVER_PATTERN_ID__="golden-retriever"'));
  assert.ok(!html.includes('<script src="game.js"'),'the offline demo embeds its actual template engine');
  const zip=fileURLToPath(new URL('../docs/golden-retriever-playable.zip',import.meta.url));
  assert.equal(execFileSync('unzip',['-Z1',zip],{encoding:'utf8'}).trim(),'index.html');
  assert.equal(execFileSync('unzip',['-p',zip,'index.html'],{encoding:'utf8',maxBuffer:2*1024*1024}),html);
});
