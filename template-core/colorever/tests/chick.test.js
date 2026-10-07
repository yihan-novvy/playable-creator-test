import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {prepareLevel,validateLevel} from '../src/level.js';
import {decorate} from '../src/patterns/chick.js';

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
  const boardScale=33/36,unit=.784*boardScale;
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
