import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {prepareLevel,validateLevel} from '../src/level.js';
import {decorate,CHICK_PARTS} from '../src/patterns/chick.js';

const source=JSON.parse(fs.readFileSync(new URL('../src/patterns/chick.json',import.meta.url)));
test('Chick easy openings conserve beads and replay a solution across seeds',()=>{
  for(let seed=0;seed<30;seed++){
    const {level,proof}=prepareLevel({...source,opening:null,seed});
    assert.ok(proof.moves>=4&&proof.moves<=6);
    assert.deepEqual([...level.opening].sort(),[...level.target].sort());
    assert.ok(level.opening.every((c,i)=>(c===0)===(level.target[i]===0)));
  }
});
test('Chick accessories follow grid anchors, board scale and independent editor transforms',()=>{
  const boardScale=Math.min(3,33/Math.max(source.width,source.height)),unit=.784*boardScale;
  const at=(x,y,z)=>new THREE.Vector3((x-760)*.02,(1360-y)*.02,z);
  const scene=new THREE.Group();decorate({scene,at,level:source,boardScale});
  assert.deepEqual(scene.children.map(p=>p.name),['chick-eye-chick','chick-beak','chick-feet']);
  assert.ok(scene.children.every(group=>group.children.length>0&&Math.abs(group.scale.x-unit)<1e-9));
  const moved=new THREE.Group(),level=validateLevel({...source,decorations:{beak:{offsetX:2,offsetY:-1,scale:1.4}}});
  decorate({scene:moved,at,level,boardScale});
  const before=scene.children[1],after=moved.children[1];
  assert.ok(Math.abs(after.position.x-before.position.x-2*unit)<1e-9);
  assert.ok(Math.abs(after.position.y-before.position.y-unit)<1e-9);
  assert.ok(Math.abs(after.scale.x-unit*1.4)<1e-9);
  assert.ok(moved.children[0].position.equals(scene.children[0].position));
});
test('Accessory anchors agree with the studio catalog and the beak has a connected mosaic footprint',()=>{
  const catalog=JSON.parse(fs.readFileSync(new URL('../src/patterns/catalog.json',import.meta.url)));
  const picture=catalog.find(p=>p.id==='chick'),boardScale=33/Math.max(source.width,source.height);
  for(const part of picture.editableParts){
    const [x,y]=CHICK_PARTS[part.id];
    assert.ok(Math.abs(part.x-(780+(x-(source.width-1)/2)*39.2*boardScale))<1e-9);
    assert.ok(Math.abs(part.y-(1441+(y-(source.height-1)/2)*39.2*boardScale))<1e-9);
  }
  const [x,y]=CHICK_PARTS.beak,row=Math.round(y);
  assert.equal(source.target[row*source.width+Math.round(x)],4);
  assert.ok(source.target[row*source.width+Math.round(x+1.7)]>0);
});
