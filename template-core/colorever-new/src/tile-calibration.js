import * as THREE from 'three';
import {createBeadParts} from './bead-reference.js';
import {createMosaicSockets} from './mosaic-sockets.js';
import {lightBeadStudio} from './studio-reference.js';
const canvas=document.getElementById('study');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,3));
renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1.55,1.55,1.55,-1.55,.1,100);camera.position.set(0,-1,12);camera.lookAt(0,0,0);
lightBeadStudio(renderer,scene,{left:-3,right:3,top:3,bottom:-3});
const palette={K:'#252a30',W:'#f3f3f4',P:'#f5a4c1',Y:'#f5ce21',T:'#c99877',B:'#039def'};
const {bodyGeometry,bodyMaterials}=createBeadParts(palette),colors=['K','W','T','K','W','P','K','Y','B'];
const at=(x,y,z)=>new THREE.Vector3(x*.02,-y*.02,z);
const cells=colors.map((color,i)=>({color,x:(i%3-1)*39.2,y:(Math.floor(i/3)-1)*39.2}));
scene.add(createMosaicSockets(cells,at,palette));
for(const cell of cells){const mesh=new THREE.Mesh(bodyGeometry,bodyMaterials[cell.color]);mesh.position.copy(at(cell.x,cell.y,.1));mesh.castShadow=true;scene.add(mesh);}
const ground=new THREE.Mesh(new THREE.PlaneGeometry(6,6),new THREE.ShadowMaterial({opacity:.14}));ground.position.z=-.3;ground.receiveShadow=true;scene.add(ground);
function resize(){const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);renderer.render(scene,camera);}
new ResizeObserver(resize).observe(canvas);resize();
