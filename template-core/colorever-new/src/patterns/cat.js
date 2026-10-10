import * as THREE from 'three';
export function decorate({scene,at,level,boardScale}){
const layers={};let active=scene;
function layer(id){const group=new THREE.Group();layers[id]=group;scene.add(group);active=group;}
function part(geometry,material,x,y,z=.5,sx=1,sy=1,sz=1){
  const mesh=new THREE.Mesh(geometry,material);mesh.position.copy(at(x,y,z));mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;active.add(mesh);return mesh;
}
const eyeMat=new THREE.MeshPhysicalMaterial({color:'#070606',roughness:.055,clearcoat:1,clearcoatRoughness:.045,envMapIntensity:1.15});
const brown=new THREE.MeshPhysicalMaterial({color:'#4c2717',roughness:.25,clearcoat:1});
for(const x of [624,920]){
  layer(x===624?'eye-left':'eye-right');
  part(new THREE.SphereGeometry(1,48,32),brown,x,1410,.29,.88,1.08,.38);
  const eye=part(new THREE.SphereGeometry(1,48,32),eyeMat,x,1409,.40,.80,1.00,.49);
  const glint=new THREE.Mesh(new THREE.SphereGeometry(.145,20,14),new THREE.MeshBasicMaterial({color:'#fffefa'}));
  glint.position.copy(eye.position).add(new THREE.Vector3(-.24,.34,.425));active.add(glint);
}
const ink=new THREE.MeshPhysicalMaterial({color:'#18110f',roughness:.24,clearcoat:.8});
function line(points,radius=.073,material=ink){
  const curve=new THREE.CatmullRomCurve3(points.map(([x,y,z=.38])=>at(x,y,z)));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,28,radius,12,false),material);mesh.castShadow=true;active.add(mesh);return mesh;
}
layer('whiskers');
for(const points of [
 [[453,1428],[393,1421],[327,1418]],[[451,1481],[388,1480],[323,1481]],[[457,1527],[404,1541],[339,1564]],
 [[1103,1428],[1166,1420],[1252,1416]],[[1107,1480],[1179,1480],[1258,1481]],[[1101,1529],[1170,1548],[1245,1571]],
])line(points,.091);
layer('nose');
const noseShape=new THREE.Shape();noseShape.moveTo(-.46,.18);noseShape.bezierCurveTo(-.67,.08,-.35,-.24,0,-.32);noseShape.bezierCurveTo(.35,-.24,.67,.08,.46,.18);noseShape.bezierCurveTo(.18,.27,-.18,.27,-.46,.18);
const nose=part(new THREE.ExtrudeGeometry(noseShape,{depth:.12,bevelEnabled:true,bevelSize:.055,bevelThickness:.055,bevelSegments:4,curveSegments:20}),new THREE.MeshPhysicalMaterial({color:'#ff83ad',roughness:.23,clearcoat:1}),771,1452,.35);
layer('mouth');
line([[771,1465,.43],[754,1489,.45],[733,1495,.45],[719,1485,.43]],.079);
line([[771,1465,.43],[791,1489,.45],[815,1495,.45],[832,1483,.43]],.079);
layer('bow');
const bow=new THREE.Group();bow.position.copy(at(779,1700,.34));active.add(bow);
const bowEdge=new THREE.MeshPhysicalMaterial({color:'#0064ae',roughness:.23,clearcoat:1,envMapIntensity:.38});
const bowFace=new THREE.MeshPhysicalMaterial({color:'#0095e8',roughness:.22,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:.42});
for(const side of [-1,1]){
  const shape=new THREE.Shape();shape.moveTo(side*.36,.54);
  shape.bezierCurveTo(side*1.15,.79,side*2.32,1.57,side*2.62,1.08);
  shape.bezierCurveTo(side*2.89,.56,side*2.85,-.94,side*2.57,-1.21);
  shape.bezierCurveTo(side*2.13,-1.56,side*1.08,-.79,side*.36,-.48);shape.closePath();
  const edge=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.30,bevelSize:.115,bevelThickness:.12,bevelSegments:5,curveSegments:24}),bowEdge);edge.castShadow=true;bow.add(edge);
  const front=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.12,bevelSize:.14,bevelThickness:.16,bevelSegments:5,curveSegments:24}),bowFace);front.scale.set(.92,.87,1);front.position.z=.24;front.castShadow=true;bow.add(front);
  const fold=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(side*.40,.10,.48),new THREE.Vector3(side*.94,.21,.48),new THREE.Vector3(side*1.32,.13,.46)]),16,.105,12,false),bowEdge);bow.add(fold);
}
const knotEdge=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),bowEdge);knotEdge.scale.set(.52,.59,.34);knotEdge.position.z=.39;bow.add(knotEdge);
const knotFace=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),bowFace);knotFace.scale.set(.43,.50,.24);knotFace.position.z=.58;bow.add(knotFace);

const pivots={'eye-left':[624,1409],'eye-right':[920,1409],whiskers:[780,1480],nose:[771,1452],mouth:[771,1480],bow:[779,1700]};
for(const [id,group]of Object.entries(layers)){
  const t=level.decorations?.[id]??{},scale=t.scale??1,pivot=at(...pivots[id],0);
  group.scale.setScalar(scale);group.position.copy(pivot).multiplyScalar(1-scale);
  group.position.x+=(t.offsetX??0)*.784*boardScale;
  group.position.y-=(t.offsetY??0)*.784*boardScale;
}

}
