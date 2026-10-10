import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {decorate,PHOENIX_PARTS} from '../src/patterns/phoenix.js';
import {decorate as originalDecorate} from '../../colorever/src/patterns/phoenix.js';
const source=JSON.parse(fs.readFileSync(new URL('../src/patterns/phoenix.json',import.meta.url)));
const original=JSON.parse(fs.readFileSync(new URL('../../colorever/src/patterns/phoenix.json',import.meta.url)));
const boardScale=33/40,unit=.784*boardScale,at=(x,y,z)=>new THREE.Vector3((x-760)*.02,(1360-y)*.02,z);
const build=level=>{const scene=new THREE.Group();decorate({scene,at,level,boardScale});scene.updateMatrixWorld(true);return scene;};
test('Phoenix adds red feather layers and retains independently adjustable eyes and beak',()=>{
 assert.deepEqual(source,original,'the current original pattern is the compatibility baseline');
 assert.deepEqual(Object.keys(PHOENIX_PARTS),['beak','eye']);
 assert.ok(source.target.some((c,i)=>c===7&&Math.floor(i/40)<24));
 assert.ok(source.target.some((c,i)=>c===9&&Math.floor(i/40)>=24));
 assert.equal(source.target[8*40+17],original.target[8*40+17]);
 assert.equal(source.target.filter(Boolean).length,original.target.filter(Boolean).length);
 const scene=build(source),moved=build({...source,decorations:{eye:{offsetX:2,offsetY:-1,scale:1.2}}});
 assert.deepEqual(scene.children.map(x=>x.name),Object.keys(PHOENIX_PARTS).map(x=>`phoenix-${x}`));
 const before=scene.children[1],after=moved.children[1];
 const authoredEye=source.decorations?.eye??{};
 assert.ok(Math.abs(after.position.x-before.position.x-(2-(authoredEye.offsetX??0))*unit)<1e-9);
 assert.ok(Math.abs(after.position.y-before.position.y-(1+(authoredEye.offsetY??0))*unit)<1e-9);
 assert.ok(Math.abs(after.scale.x-unit*1.2)<1e-9);
 assert.ok(moved.children[0].position.equals(scene.children[0].position));
});
test('Phoenix ornaments preserve the current original footprint at every playable cell',()=>{
 const scene=build(source),ray=new THREE.Raycaster(),direction=new THREE.Vector3(0,0,-1);
 const baseline=new THREE.Group();originalDecorate({scene:baseline,at,level:original,boardScale});baseline.updateMatrixWorld(true);
 source.target.forEach((color,i)=>{if(!color)return;
  const v=at(780+(i%40-19.5)*39.2*boardScale,1441+(Math.floor(i/40)-19.5)*39.2*boardScale,5);
  for(const [dx,dy] of [[0,0],[-.4,-.4],[.4,-.4],[-.4,.4],[.4,.4]]){
   ray.set(new THREE.Vector3(v.x+dx*unit,v.y+dy*unit,5),direction);
   assert.equal(ray.intersectObjects(scene.children,true).length,ray.intersectObjects(baseline.children,true).length,`bead ${i} changed its accessory footprint`);
  }
 });
});
