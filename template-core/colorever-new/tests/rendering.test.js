import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBeadParts,BEAD_WIDTH,CAP_HEIGHT} from '../src/bead-reference.js';
import {createMosaicSockets,SOCKET_PITCH} from '../src/mosaic-sockets.js';

test('Rounded square pyramids have four planar slopes and a single apex without a flat table',()=>{
  const {bodyGeometry,bodyMaterials}=createBeadParts({orange:'#f8911c'});
  const position=bodyGeometry.attributes.position,normal=bodyGeometry.attributes.normal;
  assert.ok(bodyGeometry.boundingBox.max.z>=CAP_HEIGHT-.00001);
  assert.ok(BEAD_WIDTH/SOCKET_PITCH>=.72&&BEAD_WIDTH/SOCKET_PITCH<=.77);
  let slopes=0;
  for(let i=0;i<position.count;i++){
    assert.ok([position.getX(i),position.getY(i),position.getZ(i),normal.getX(i),normal.getY(i),normal.getZ(i)].every(Number.isFinite));
    if(position.getZ(i)>.17)assert.ok(normal.getZ(i)<.99,'the crown must not contain a horizontal table');
    if(Math.abs(position.getZ(i)-CAP_HEIGHT)<.00001)assert.ok(Math.hypot(position.getX(i),position.getY(i))<.00001,'only the central apex reaches the maximum height');
    if(position.getZ(i)>.22&&normal.getZ(i)>.1&&normal.getZ(i)<.99)slopes++;
  }
  assert.ok(slopes>12,'crown needs actual sloping geometry');
  const mesh=new THREE.Mesh(bodyGeometry,bodyMaterials.orange);
  const hitAt=(x,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,2),new THREE.Vector3(0,0,-1)).intersectObject(mesh)[0];
  const apex=hitAt(0,0);
  assert.ok(apex&&Math.abs(apex.point.z-CAP_HEIGHT)<.00001);
  const normals=new Set();
  for(const [x,y]of [[1,0],[0,1],[-1,0],[0,-1]]){
    const near=hitAt(x*.12,y*.12),far=hitAt(x*.24,y*.24);
    assert.ok(near&&far&&apex.point.z>near.point.z&&near.point.z>far.point.z,'each face descends continuously from the apex');
    assert.ok(Math.abs((apex.point.z-near.point.z)-(near.point.z-far.point.z))<.00001,'each main face must be planar');
    normals.add(near.face.normal.toArray().map(n=>n.toFixed(3)).join(','));
  }
  assert.equal(normals.size,4,'four distinct triangular faces must remain visible');
  for(const [x,y]of [[1,1],[1,-1],[-1,1],[-1,-1]]){
    assert.ok(hitAt(x*.26,y*.26),'the inner part of each rounded corner remains filled');
    assert.ok(!hitAt(x*.28,y*.28),'the four outer square corners must be rounded away');
  }
  bodyGeometry.dispose();bodyMaterials.orange.dispose();
});

test('The visible substrate stores the authored target color independently of the bead',()=>{
  const palette={1:'#ffe12d',2:'#f8911c'};
  const board=createMosaicSockets([{x:0,y:0,color:1}],(x,y,z)=>new THREE.Vector3(x,y,z),palette);
  const floor=board.children[2],color=new THREE.Color();floor.getColorAt(0,color);
  const target=new THREE.Color(palette[1]);
  assert.ok(Math.max(Math.abs(color.r-target.r),Math.abs(color.g-target.g),Math.abs(color.b-target.b))<1e-7);
  assert.ok(floor.material.isMeshBasicMaterial,'lighting must not change the target-color cue');
  assert.equal(floor.material.toneMapped,false,'target colors must also bypass tone mapping');
  for(const mesh of board.children){
    const color=new THREE.Color();mesh.getColorAt(0,color);
    assert.ok(Math.max(Math.abs(color.r-target.r),Math.abs(color.g-target.g),Math.abs(color.b-target.b))<1e-7,'the plate, walls, floor and shading all inherit the target color');
    assert.equal(mesh.material.toneMapped,false);
  }
  const margin=(board.children[1].geometry.parameters.width-BEAD_WIDTH)/2;
  assert.ok(margin>.09,'the colored plate leaves the target hue visible around a bead');
  board.traverse(node=>{node.geometry?.dispose();node.material?.dispose();});
});
