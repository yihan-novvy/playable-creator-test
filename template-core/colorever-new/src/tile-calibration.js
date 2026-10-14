import * as THREE from 'three';
import {createBeadParts} from './bead-reference.js';
import {AmbientSheen} from './ambient-sheen.js';
import {createMosaicSockets} from './mosaic-sockets.js';
import house from './patterns/gem-house.json';

const canvas=document.getElementById('study');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=false;
const scene=new THREE.Scene();
const camera=new THREE.OrthographicCamera(-1.68,1.68,.42,-.42,.1,100);
camera.position.set(0,-1,12);camera.lookAt(0,0,0);
const palette={R:house.colors[2],Y:house.colors[3],B:house.colors[5],K:house.colors[1]};
const {bodyGeometry,bodyMaterials}=createBeadParts(palette,{includeStudyParts:false});
const groups=Object.keys(palette).map((color,i)=>{
  const mesh=new THREE.Mesh(bodyGeometry,bodyMaterials[color]);
  const point=new THREE.Vector3((i-1.5)*.84,0,.1);mesh.position.copy(point);scene.add(mesh);
  return {mesh,entries:[{point,region:'board',index:i,lift:0}]};
});
const sheen=new AmbientSheen(scene,4,1,1);
const cells=Object.keys(palette).map((color,i)=>({color,x:(i-1.5)*.84/.02,y:0}));
scene.add(createMosaicSockets(cells,(x,y,z)=>new THREE.Vector3(x*.02,-y*.02,z),palette));
function resize(){const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);}
new ResizeObserver(resize).observe(canvas);resize();

// Empty wells share the actual playable material, without any bead covering it.
const emptyCanvas=document.getElementById('empty-study');
const emptyRenderer=new THREE.WebGLRenderer({canvas:emptyCanvas,antialias:true,alpha:true});
emptyRenderer.setPixelRatio(Math.min(devicePixelRatio,2));emptyRenderer.shadowMap.enabled=false;
const emptyScene=new THREE.Scene();
emptyScene.add(createMosaicSockets(cells,(x,y,z)=>new THREE.Vector3(x*.02,-y*.02,z),palette));
function resizeEmpty(){const rect=emptyCanvas.getBoundingClientRect();emptyRenderer.setSize(rect.width,rect.height,false);}
new ResizeObserver(resizeEmpty).observe(emptyCanvas);resizeEmpty();

// A square art view uses the same geometry, colors, sockets and sheen as the
// playable, without the HUD and tray reducing the artwork's display size.
const pictureCanvas=document.getElementById('picture');
const pictureRenderer=new THREE.WebGLRenderer({canvas:pictureCanvas,antialias:true,alpha:true});
pictureRenderer.setPixelRatio(Math.min(devicePixelRatio,2));pictureRenderer.shadowMap.enabled=false;
const pictureScene=new THREE.Scene(),view=Math.max(house.width,house.height)*.784/2+1;
const pictureCamera=new THREE.OrthographicCamera(-view,view,view,-view,.1,100);
pictureCamera.position.set(0,-7.5,85);pictureCamera.lookAt(0,0,0);
const pictureParts=createBeadParts(house.colors,{includeStudyParts:false});
const pictureCells=house.target.flatMap((color,i)=>color?[{
  color,x:(i%house.width-(house.width-1)/2)*39.2,
  y:(Math.floor(i/house.width)-(house.height-1)/2)*39.2,index:i,
}]:[]);
const pictureAt=(x,y,z)=>new THREE.Vector3(x*.02,-y*.02,z);
pictureScene.add(createMosaicSockets(pictureCells,pictureAt,house.colors));
const pictureGroups=Object.keys(house.colors).map(color=>{
  const entries=pictureCells.filter(cell=>cell.color===Number(color)).map(cell=>({point:pictureAt(cell.x,cell.y,.1),region:'board',index:cell.index,lift:0}));
  const mesh=new THREE.InstancedMesh(pictureParts.bodyGeometry,pictureParts.bodyMaterials[color],entries.length);
  const transform=new THREE.Object3D();entries.forEach((entry,i)=>{transform.position.copy(entry.point);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);});
  mesh.frustumCulled=false;pictureScene.add(mesh);return {mesh,entries};
});
const pictureSheen=new AmbientSheen(pictureScene,pictureCells.length,1,1);
function resizePicture(){const rect=pictureCanvas.getBoundingClientRect();pictureRenderer.setSize(rect.width,rect.height,false);}
new ResizeObserver(resizePicture).observe(pictureCanvas);resizePicture();
renderer.setAnimationLoop(now=>{
  sheen.update(groups,[],now);renderer.render(scene,camera);
  emptyRenderer.render(emptyScene,camera);
  pictureSheen.update(pictureGroups,[],now);pictureRenderer.render(pictureScene,pictureCamera);
});
