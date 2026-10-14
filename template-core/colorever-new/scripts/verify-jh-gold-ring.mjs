import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import * as THREE from 'three';
import {prepareLevel} from '../src/level.js';
import {trayLayout} from '../src/tray-layout.js';

// Exercise the packaged template through real touch events at two phone sizes.
const source=JSON.parse(await fs.readFile(new URL('../src/patterns/jh-gold-ring.json',import.meta.url),'utf8'));
const {level,proof}=prepareLevel(source);
const playable=new URL('../docs/jh-gold-ring-playable.html',import.meta.url);
const camera=new THREE.OrthographicCamera(-15.2,15.2,27.2,-27.2,.1,140);
camera.position.set(0,-7.5,85);camera.lookAt(0,0,0);camera.updateMatrixWorld();
const scale=Math.min(3,33/Math.max(level.width,level.height));
const tray=trayLayout(level.capacity,level.trayCols);
const worldPoint=(region,index)=>{
  if(region==='tray')return new THREE.Vector3((index%level.trayCols-(level.trayCols-1)/2)*tray.pitch,(1360-2425)*.02+((tray.rows-1)/2-Math.floor(index/level.trayCols))*tray.pitch,.21);
  return new THREE.Vector3((780+(index%level.width-(level.width-1)/2)*39.2*scale-760)*.02,(1360-1441-(Math.floor(index/level.width)-(level.height-1)/2)*39.2*scale)*.02,.1);
};
const browser=await chromium.launch({headless:true});
try{
  for(const [width,height] of [[320,693],[390,844]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    const errors=[],externalRequests=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if(/^https?:/.test(request.url()))externalRequests.push(request.url());});
    await page.goto(playable.href);
    await page.locator('#loading').waitFor({state:'hidden'});
    await page.waitForTimeout(800);
    assert.equal(await page.locator('.app').getAttribute('data-pattern-id'),'jh-gold-ring');
    await page.screenshot({path:fileURLToPath(new URL(`../docs/jh-gold-ring-opening-${width}.png`,import.meta.url))});
    const canvas=await page.locator('#game').boundingBox();
    assert.ok(canvas&&canvas.x>=0&&canvas.y>=0&&canvas.x+canvas.width<=width+.5&&canvas.y+canvas.height<=height+.5,'the phone canvas must fit the viewport');
    let placements=0;
    for(const move of proof.solution){
      const point=worldPoint(move.region,move.index).project(camera);
      await page.touchscreen.tap(canvas.x+(point.x+1)*canvas.width/2,canvas.y+(1-point.y)*canvas.height/2);
      if(move.action!=='pick'){
        placements++;
        await page.waitForFunction(n=>document.getElementById('moves').textContent.startsWith(n+' 步'),placements,{timeout:10000});
        await page.waitForFunction(()=>!document.getElementById('hint').disabled||document.getElementById('progress-bar').value===document.getElementById('progress-bar').max,null,{timeout:10000});
        await page.waitForTimeout(200);
        if(placements===1&&width===390)await page.screenshot({path:fileURLToPath(new URL('../docs/jh-gold-ring-empty-slots-390.png',import.meta.url))});
      }else{
        await page.waitForFunction(()=>/已选|将珠子/.test(document.getElementById('instruction').textContent),null,{timeout:10000});
        await page.waitForTimeout(350);
      }
    }
    assert.equal(await page.locator('#progress').textContent(),`${level.target.filter(Boolean).length} / ${level.target.filter(Boolean).length}`);
    // The ad shell hides the native win card; its hidden flag still marks the
    // end of the template's completion sweep.
    await page.waitForFunction(()=>!document.getElementById('win').hidden,null,{timeout:15000});
    await page.waitForTimeout(300);
    await page.screenshot({path:fileURLToPath(new URL(`../docs/jh-gold-ring-preview-${width}.png`,import.meta.url))});
    assert.deepEqual(errors,[]);
    assert.deepEqual(externalRequests,[],'the exported playable must work offline');
    console.log(`${width}×${height}: ${placements} touch placements, all ${level.target.filter(Boolean).length} beads complete, no page errors or network dependencies`);
    await page.close();
  }
}finally{
  await browser.close();
}
