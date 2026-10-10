import * as THREE from 'three';

// One square recess per bead, with the same pitch and silhouette as the mosaic.
export const SOCKET_PITCH=.784;
export const SOCKET_OPENING=.748;
function roundedPath(size,radius){
  const p=new THREE.Path(),h=size/2,r=radius;
  p.moveTo(-h+r,-h);p.lineTo(h-r,-h);p.quadraticCurveTo(h,-h,h,-h+r);
  p.lineTo(h,h-r);p.quadraticCurveTo(h,h,h-r,h);
  p.lineTo(-h+r,h);p.quadraticCurveTo(-h,h,-h,h-r);
  p.lineTo(-h,-h+r);p.quadraticCurveTo(-h,-h,-h+r,-h);p.closePath();return p;
}
export function createMosaicSockets(beads,at,palette,scale=1){
  const group=new THREE.Group();group.name='Target-color mosaic sockets';
  const shape=new THREE.Shape(roundedPath(SOCKET_PITCH,.008).getPoints(4));
  shape.holes.push(roundedPath(SOCKET_OPENING,.10));
  const wallsGeometry=new THREE.ExtrudeGeometry(shape,{depth:.115,bevelEnabled:false,curveSegments:8});
  const shellMaterial=new THREE.MeshStandardMaterial({color:'#fff5e7',roughness:.72,envMapIntensity:.12});
  // Unlit target colors remain legible under the raised bead's shadow. They are
  // fixed to the authored target, never recolored by the current board contents.
  const floorMaterial=new THREE.MeshBasicMaterial({color:'#ffffff'});
  const walls=new THREE.InstancedMesh(wallsGeometry,shellMaterial,beads.length);
  const base=new THREE.InstancedMesh(new THREE.BoxGeometry(SOCKET_PITCH,SOCKET_PITCH,.13),shellMaterial,beads.length);
  const floors=new THREE.InstancedMesh(new THREE.PlaneGeometry(SOCKET_OPENING,SOCKET_OPENING),floorMaterial,beads.length);
  const dummy=new THREE.Object3D();
  dummy.scale.setScalar(scale);
  beads.forEach((bead,i)=>{
    const color=new THREE.Color(palette[bead.color]);
    floors.setColorAt(i,color);
    dummy.position.copy(at(bead.x,bead.y,-.065));dummy.updateMatrix();walls.setMatrixAt(i,dummy.matrix);
    dummy.position.z=-.10;dummy.updateMatrix();base.setMatrixAt(i,dummy.matrix);
    dummy.position.z=.043;dummy.updateMatrix();floors.setMatrixAt(i,dummy.matrix);
  });
  for(const mesh of [walls,base,floors]){mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.castShadow=mesh!==floors;group.add(mesh);}
  return group;
}
