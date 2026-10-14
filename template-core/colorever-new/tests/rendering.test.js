import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBeadParts,BEAD_WIDTH,CAP_HEIGHT} from '../src/bead-reference.js';
import {createMosaicSockets,SOCKET_PITCH,SOCKET_OPENING} from '../src/mosaic-sockets.js';
import {AmbientSheen} from '../src/ambient-sheen.js';

test('Polished rounded square pyramids retain four planar slopes and a single apex',()=>{
  const {bodyGeometry,bodyMaterials}=createBeadParts({orange:'#f8911c'});
  const position=bodyGeometry.attributes.position,normal=bodyGeometry.attributes.normal;
  assert.ok(bodyGeometry.boundingBox.max.z>=CAP_HEIGHT-.00001);
  assert.ok(BEAD_WIDTH<SOCKET_OPENING,'the bead must fit inside the unchanged container opening');
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
    assert.ok(hitAt(x*(BEAD_WIDTH/2-.05),y*(BEAD_WIDTH/2-.05)),'the inner part of each rounded corner remains filled');
    assert.ok(!hitAt(x*(BEAD_WIDTH/2-.015),y*(BEAD_WIDTH/2-.015)),'the four outer square corners must be rounded away');
  }
  bodyGeometry.dispose();bodyMaterials.orange.dispose();
});

test('The lightweight substrate preserves target colors and exposed margins without hidden backing layers',()=>{
  const palette={1:'#ffe12d',2:'#f8911c'};
  const board=createMosaicSockets([{x:0,y:0,color:1}],(x,y,z)=>new THREE.Vector3(x,y,z),palette);
  const floor=board.children[0],color=new THREE.Color();floor.getColorAt(0,color);
  const target=new THREE.Color(palette[1]);
  assert.ok(Math.max(Math.abs(color.r-target.r),Math.abs(color.g-target.g),Math.abs(color.b-target.b))<1e-7);
  assert.equal(floor.material.toneMapped,false,'target colors must also bypass tone mapping');
  assert.equal(floor.material.transparent,false,'gaps between beads must retain their opaque target-color containers');
  assert.equal(floor.material.depthWrite,true);
  assert.equal(floor.material.opacity,1);
  const triangleCount=board.children.reduce((sum,mesh)=>sum+(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3,0);
  assert.ok(triangleCount<=4,'the substrate must retain its small per-cell geometry budget');
  for(const mesh of board.children){
    const color=new THREE.Color();mesh.getColorAt(0,color);
    assert.ok(Math.max(Math.abs(color.r-target.r),Math.abs(color.g-target.g),Math.abs(color.b-target.b))<1e-7,'the substrate inherits the authored target color');
    assert.equal(mesh.material.toneMapped,false);
  }
  const margin=(floor.geometry.parameters.width-BEAD_WIDTH)/2;
  assert.ok(margin>=.06,'the unchanged container rim must remain clearly visible around each bead');
  board.traverse(node=>{node.geometry?.dispose();node.material?.dispose();});
});

test('Tinted sheen follows lifted beads and packs visible instances while beads fly',()=>{
  const scene=new THREE.Scene(),parts=createBeadParts({red:'#f53b40',navy:'#25364d'});
  const groups=[
    {mesh:new THREE.Mesh(parts.bodyGeometry,parts.bodyMaterials.red),entries:[{region:'board',index:3,point:new THREE.Vector3(1,2,.1),lift:.2}]},
    {mesh:new THREE.Mesh(parts.bodyGeometry,parts.bodyMaterials.navy),entries:[{region:'tray',index:0,point:new THREE.Vector3(-1,-2,.21),lift:0}]},
  ];
  const sheen=new AmbientSheen(scene,2,1.2,1.5),color=new THREE.Color(),matrix=new THREE.Matrix4();
  sheen.update(groups,[],2500);
  assert.equal(sheen.mesh.count,2);
  sheen.mesh.getColorAt(0,color);
  for(const channel of ['r','g','b'])assert.ok(Math.abs(color[channel]-parts.bodyMaterials.red.color[channel])<1e-7);
  sheen.mesh.getMatrixAt(0,matrix);assert.ok(Math.abs(matrix.elements[14]-(.1+.2+.003*1.2))<1e-6);
  sheen.update(groups,[{landed:false,toRegion:'board',to:3}],3000);
  assert.equal(sheen.mesh.count,1);
  sheen.mesh.getColorAt(0,color);
  assert.ok(Math.abs(color.r-parts.bodyMaterials.navy.color.r)<1e-7);
  assert.ok(Math.abs(color.g-parts.bodyMaterials.navy.color.g)<1e-7);
  assert.ok(Math.abs(color.b-parts.bodyMaterials.navy.color.b)<1e-7);
  sheen.mesh.getMatrixAt(0,matrix);assert.ok(Math.abs(matrix.elements[0]-1.5)<1e-6);
  sheen.enabled=false;sheen.update(groups,[],3500);assert.equal(sheen.mesh.visible,false);
  sheen.mesh.geometry.dispose();sheen.material.dispose();parts.bodyGeometry.dispose();
  Object.values(parts.bodyMaterials).forEach(material=>material.dispose());
});
