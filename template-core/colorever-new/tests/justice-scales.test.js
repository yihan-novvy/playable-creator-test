import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {prepareLevel,validateLevel} from '../src/level.js';
import {Puzzle} from '../src/model.js';
import {decorate} from '../src/patterns/justice-scales.js';

const id='justice-scales';
const read=relative=>fs.readFileSync(new URL(relative,import.meta.url));
const source=JSON.parse(read(`../src/patterns/${id}.json`));
const cell=(x,y)=>source.target[y*source.width+x];

test('The scales retain two open suspensions, level pans and a complete symmetric bead silhouette',()=>{
  assert.equal(source.width,31);assert.equal(source.height,32);
  assert.equal(Object.keys(source.colors).length,6);
  assert.deepEqual(new Set(source.target.filter(Boolean)),new Set(Object.keys(source.colors).map(Number)));
  assert.equal(source.opening,null);assert.equal(source.decoration,'none');
  const puzzle=new Puzzle({width:source.width,height:source.height,target:source.target,openingBoard:source.target});
  assert.equal(puzzle.total,333);
  assert.equal(puzzle.connected(source.target.findIndex(Boolean),i=>source.target[i]!==0).length,puzzle.total);
  for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++){
    assert.equal(!!cell(x,y),!!cell(source.width-1-x,y),'the silhouette must stay balanced');
    if(x===0||y===0||x===source.width-1||y===source.height-1)assert.equal(cell(x,y),0,'all edges retain whitespace');
  }
  for(const center of [7,23]){
    for(let y=13;y<=18;y++)assert.equal(cell(center,y),0,'each suspension has a visibly open interior');
    for(let x=center-5;x<=center+5;x++)assert.ok(cell(x,19),'the broad pan rim remains complete');
    assert.ok(cell(center,23),'the curved bowl has a closed bottom');
  }
  for(let x=6;x<=24;x++)assert.ok(cell(x,7),'both arms form one level crossbeam');
  for(let y=9;y<=25;y++)assert.ok(cell(15,y),'the shaft joins the crossbeam to the pedestal');
  decorate({scene:{add(){assert.fail('all scales structures must be playable beads');}}});
});

test('Every supported scales opening conserves beads and replays to completion',()=>{
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

test('The mobile demo preserves the full finial, crossbeam and both suspensions',()=>{
  const {level,proof}=prepareLevel(source);
  assert.deepEqual(level.opening.slice(0,19*source.width),source.target.slice(0,19*source.width));
  assert.equal(proof.moves,6);
});

test('The actual colorever-new template and offline ZIP contain the registered scales',()=>{
  const prefix='../../../editor/templates/colorever-new/';
  const catalog=JSON.parse(read(prefix+'game/patterns/catalog.json'));
  const entry=catalog.patterns.find(p=>p.id===id);assert.ok(entry);
  const hash=data=>createHash('sha256').update(data).digest('hex');
  const pattern=read(prefix+'game/patterns/'+entry.level);
  assert.equal(hash(pattern),entry.templateSha256);
  assert.deepEqual(JSON.parse(pattern),validateLevel(source));
  const decorator=catalog.decorators[id];
  assert.equal(hash(read(prefix+'game/'+decorator.file)),decorator.sha256);
  assert.equal(hash(read(prefix+'game/game.js')),catalog.engineSha256);
  assert.equal(hash(read(prefix+'game/'+catalog.levelEngine)),catalog.levelEngineSha256);
  assert.ok(JSON.parse(read(prefix+'game-manifest.json')).levels.some(p=>p.id===id&&p.path===`game/patterns/${id}.json`));
  const html=read(`../docs/${id}-playable.html`).toString();
  const injected=JSON.parse(html.match(/window\.__COLOREVER_LEVEL__=(.*?);window\.__COLOREVER_CTA_URL__/)[1]);
  assert.deepEqual(injected,prepareLevel(source).level,'the packaged demo matches the current pattern and opening');
  assert.ok(html.includes(`__COLOREVER_PATTERN_ID__="${id}"`));
  assert.ok(!html.includes('<script src="game.js"'),'the offline demo embeds the actual template engine');
  const zip=fileURLToPath(new URL(`../docs/${id}-playable.zip`,import.meta.url));
  assert.equal(execFileSync('unzip',['-Z1',zip],{encoding:'utf8'}).trim(),'index.html');
  assert.equal(execFileSync('unzip',['-p',zip,'index.html'],{encoding:'utf8',maxBuffer:2*1024*1024}),html);
});
