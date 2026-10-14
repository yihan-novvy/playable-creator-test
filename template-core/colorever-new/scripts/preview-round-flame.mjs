import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import * as THREE from 'three';
import {prepareLevel} from '../src/level.js';
import {Puzzle} from '../src/model.js';
import {trayLayout} from '../src/tray-layout.js';

// Run after package-round-flame.mjs. Exercise the actual offline template with
// mobile touch input, then save its opening and completed mobile screenshots.
const source=JSON.parse(await fs.readFile(new URL('../src/patterns/round-flame.json',import.meta.url)));
const {level,proof}=prepareLevel(source);
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  page.setDefaultTimeout(60000);
  const errors=[],external=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(/^https?:/.test(request.url()))external.push(request.url());});
  await page.goto(new URL('../docs/round-flame-playable.html',import.meta.url).href,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.getElementById('loading')?.hidden);
  const save=async name=>page.screenshot({path:fileURLToPath(new URL('../docs/'+name,import.meta.url)),timeout:60000});
  assert.deepEqual(await page.evaluate(()=>globalThis.__COLOREVER_LEVEL__),level);
  await save('round-flame-opening-390.png');
  console.log('Offline opening:',await page.locator('.hud span').textContent());

  const camera=new THREE.OrthographicCamera(-15.2,15.2,27.2,-27.2,.1,140);
  camera.position.set(0,-7.5,85);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const scale=Math.min(3,33/Math.max(level.width,level.height));
  const tray=trayLayout(level.capacity,level.trayCols);
  const point=(region,index)=>{
    if(region==='tray')return new THREE.Vector3((index%level.trayCols-(level.trayCols-1)/2)*tray.pitch,-21.3+((tray.rows-1)/2-Math.floor(index/level.trayCols))*tray.pitch,.21);
    const x=780+(index%level.width-(level.width-1)/2)*39.2*scale;
    const y=1441+(Math.floor(index/level.width)-(level.height-1)/2)*39.2*scale;
    return new THREE.Vector3((x-760)*.02,(1360-y)*.02,.10);
  };
  const puzzle=new Puzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening});
  for(const move of proof.solution){
    const rect=await page.locator('#game').boundingBox();
    const p=point(move.region,move.index).project(camera);
    await page.touchscreen.tap(rect.x+(p.x+1)*rect.width/2,rect.y+(1-p.y)*rect.height/2);
    assert.ok(move.action==='pick'?puzzle.pick(move.region,move.index):puzzle.place(move.region,move.index));
    if(move.action==='place'){
      await page.waitForFunction(expected=>document.querySelector('.hud span').textContent===expected,`${puzzle.correct} / ${puzzle.total}`);
      if(!puzzle.complete)await page.waitForFunction(()=>!document.getElementById('undo').disabled);
    }
  }
  // The ad template hides the development win card with CSS. Its state and
  // victory text still confirm that the real engine completed the touch flow.
  await page.waitForFunction(()=>!document.getElementById('win').hidden);
  const victory=await page.locator('#win-detail').textContent();
  assert.equal(victory,`${puzzle.total} 颗珠子全部归位 · ${proof.moves} 步完成`);
  for(const [width,height] of [[320,568],[390,844]]){
    await page.setViewportSize({width,height});
    await page.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth);
    await save(`round-flame-preview-${width}.png`);
    console.log(`${width} px: ${puzzle.total} / ${puzzle.total}, no horizontal overflow`);
  }
  assert.deepEqual(errors,[]);
  assert.deepEqual(external,[]);
  console.log(victory+'; no browser errors or external HTTP requests');
}finally{
  await browser.close();
}
