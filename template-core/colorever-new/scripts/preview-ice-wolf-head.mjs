import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
import * as THREE from 'three';
import {prepareLevel} from '../src/level.js';
import {Puzzle} from '../src/model.js';
import {trayLayout} from '../src/tray-layout.js';

// Render and touch-replay the packaged template, using the game's cell projection.
const source=JSON.parse(fs.readFileSync(new URL('../src/patterns/ice-wolf-head.json',import.meta.url)));
const file=fileURLToPath(new URL('../docs/ice-wolf-head-playable.html',import.meta.url));
const {level,proof}=prepareLevel(source);
const camera=new THREE.OrthographicCamera(-15.2,15.2,27.2,-27.2,.1,140);
camera.position.set(0,-7.5,85);camera.lookAt(0,0,0);camera.updateMatrixWorld();
const boardScale=Math.min(3,33/Math.max(level.width,level.height));
const tray=trayLayout(level.capacity,level.trayCols);
const at=(x,y,z=.1)=>new THREE.Vector3((x-760)*.02,(1360-y)*.02,z);
const point=move=>move.region==='board'
  ?at(780+(move.index%level.width-(level.width-1)/2)*39.2*boardScale,1441+(Math.floor(move.index/level.width)-(level.height-1)/2)*39.2*boardScale)
  :new THREE.Vector3((move.index%level.trayCols-(level.trayCols-1)/2)*tray.pitch,at(761,2425).y+((tray.rows-1)/2-Math.floor(move.index/level.trayCols))*tray.pitch,.21);
const browser=await chromium.launch({headless:true});
try{
  for(const width of [390,320]){
    const page=await browser.newPage({viewport:{width,height:Math.round(width*844/390)},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>document.addEventListener('novvy:playable-complete',()=>globalThis.iceWolfHeadCompleted=true));
    await page.goto(pathToFileURL(file).href);
    await page.waitForSelector('.app[data-pattern-id="ice-wolf-head"]');
    await page.waitForTimeout(1200);
    const screenshot=name=>page.screenshot({path:fileURLToPath(new URL(`../docs/ice-wolf-head-${name}-${width}.png`,import.meta.url))});
    await screenshot('opening');
    const bounds=await page.locator('#game').boundingBox();
    assert.ok(bounds.width<=width&&bounds.x>=0,'the actual game fits the mobile viewport');
    const puzzle=new Puzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening});
    for(const [step,move]of proof.solution.entries()){
      await page.waitForFunction(()=>!document.getElementById('hint').disabled);
      const projected=point(move).project(camera);
      await page.touchscreen.tap(bounds.x+(projected.x+1)*bounds.width/2,bounds.y+(1-projected.y)*bounds.height/2);
      assert.ok(move.action==='pick'?puzzle.pick(move.region,move.index):puzzle.place(move.region,move.index));
      await page.waitForFunction(correct=>Number(document.getElementById('progress-bar').value)===correct,puzzle.correct);
      if(step===1){
        await page.waitForFunction(()=>!document.getElementById('hint').disabled);
        await screenshot('empty-slots');
      }
    }
    await page.waitForFunction(()=>globalThis.iceWolfHeadCompleted===true);
    await page.waitForFunction(()=>document.getElementById('instruction').textContent==='拼画完成！');
    await screenshot('preview');
    if(width===390){
      // Inspect the enlarged frontal wolf head in the actual template render.
      const screenCell=(x,y)=>{
        const projected=point({region:'board',index:y*level.width+x}).project(camera);
        return {x:bounds.x+(projected.x+1)*bounds.width/2,y:bounds.y+(1-projected.y)*bounds.height/2};
      };
      const topLeft=screenCell(1,1),bottomRight=screenCell(level.width-2,level.height-2),padding=7;
      await page.screenshot({path:fileURLToPath(new URL('../docs/ice-wolf-head-face-detail.png',import.meta.url)),clip:{x:topLeft.x-padding,y:topLeft.y-padding,width:bottomRight.x-topLeft.x+padding*2,height:bottomRight.y-topLeft.y+padding*2}});
    }
    assert.deepEqual(errors,[],'no runtime errors');
    assert.equal(await page.locator('#progress').textContent(),`${puzzle.total} / ${puzzle.total}`);
    console.log(`${width}px: ${puzzle.total} beads, ${puzzle.moves} placements, touch replay complete, no runtime errors`);
    await page.close();
  }
}finally{await browser.close();}
