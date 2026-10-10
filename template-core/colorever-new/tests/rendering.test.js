import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBeadParts,BEAD_WIDTH,CAP_HEIGHT} from '../src/bead-reference.js';
import {createMosaicSockets,SOCKET_PITCH} from '../src/mosaic-sockets.js';

test('Faceted beads render as one finite geometry with a raised diamond and sloping faces',()=>{
  const {bodyGeometry,bodyMaterials}=createBeadParts({orange:'#f8911c'});
  const position=bodyGeometry.attributes.position,normal=bodyGeometry.attributes.normal;
  assert.ok(bodyGeometry.boundingBox.max.z>=CAP_HEIGHT-.00001);
  assert.ok(BEAD_WIDTH/SOCKET_PITCH>=.80&&BEAD_WIDTH/SOCKET_PITCH<=.84);
  let slopes=0;
  for(let i=0;i<position.count;i++){
    assert.ok([position.getX(i),position.getY(i),position.getZ(i),normal.getX(i),normal.getY(i),normal.getZ(i)].every(Number.isFinite));
    if(position.getZ(i)>.22&&normal.getZ(i)>.1&&normal.getZ(i)<.99)slopes++;
  }
  assert.ok(slopes>12,'crown needs actual sloping geometry');
  const mesh=new THREE.Mesh(bodyGeometry,bodyMaterials.orange);
  const hit=new THREE.Raycaster(new THREE.Vector3(0,0,2),new THREE.Vector3(0,0,-1)).intersectObject(mesh)[0];
  assert.ok(hit&&Math.abs(hit.point.z-CAP_HEIGHT)<.00001,'raised table must face the camera');
  bodyGeometry.dispose();bodyMaterials.orange.dispose();
});

test('The visible substrate stores the authored target color independently of the bead',()=>{
  const palette={1:'#ffe12d',2:'#f8911c'};
  const board=createMosaicSockets([{x:0,y:0,color:1}],(x,y,z)=>new THREE.Vector3(x,y,z),palette);
  const floor=board.children[2],color=new THREE.Color();floor.getColorAt(0,color);
  const target=new THREE.Color(palette[1]);
  assert.ok(Math.max(Math.abs(color.r-target.r),Math.abs(color.g-target.g),Math.abs(color.b-target.b))<1e-7);
  assert.ok(floor.material.isMeshBasicMaterial,'lighting must not change the target-color cue');
  const margin=(floor.geometry.parameters.width-BEAD_WIDTH)/2;
  assert.ok(margin>.045,'target color remains visible with a bead in place');
  board.traverse(node=>{node.geometry?.dispose();node.material?.dispose();});
});
