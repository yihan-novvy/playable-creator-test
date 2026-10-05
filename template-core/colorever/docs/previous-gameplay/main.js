import './style.css';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {Puzzle} from './model.js';
import {PALETTE,WIDTH} from './pattern.js';
import {createKittySculpture} from './kitty-sculpture.js';

const $=id=>document.getElementById(id);
const puzzle=new Puzzle();
const canvas=$('game');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}catch(error){$('loading').textContent='Your browser needs WebGL to bring these beads to life.';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.NeutralToneMapping;
renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(32,1,.1,150);
// A controlled studio: one small softbox makes a clean resin highlight,
// rather than reflecting a whole room over every bead.
const studio=new THREE.Scene();studio.background=new THREE.Color('#202830');
for(const [x,y,z,w,h,intensity] of [[-7,10,14,5,8,4],[10,2,11,3,7,1.4]]){
  const softbox=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(intensity,intensity,intensity),side:THREE.DoubleSide}));
  softbox.position.set(x,y,z);softbox.lookAt(0,0,0);studio.add(softbox);
}
const pmrem=new THREE.PMREMGenerator(renderer),envTarget=pmrem.fromScene(studio,.03);
scene.environment=envTarget.texture;scene.environmentIntensity=.65;
studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xffffff,0x687f96,.85));
const key=new THREE.DirectionalLight(0xfff9ee,2.15);
key.position.set(-14,16,23);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-22,right:22,top:24,bottom:-25,near:1,far:75});
key.shadow.bias=-.001;key.shadow.normalBias=.10;key.shadow.radius=3;
scene.add(key);renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
const fill=new THREE.DirectionalLight(0xe2f4ff,.65);fill.position.set(15,-6,18);scene.add(fill);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({color:0x354f65,opacity:.30}));
ground.position.z=-.65;ground.receiveShadow=true;scene.add(ground);
const beadShape=new THREE.LatheGeometry([
  [0,-.12],[.31,-.12],[.393,-.075],[.422,.02],[.417,.12],[.37,.235],[.26,.29],[.135,.278],[.067,.24],[0,.24]
].map(([r,z])=>new THREE.Vector2(r,z)),32);
beadShape.rotateX(Math.PI/2);
const sweep={value:-100};
const beadMaterial=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.34,metalness:0,clearcoat:.85,clearcoatRoughness:.12,envMapIntensity:.9,specularIntensity:.7});
beadMaterial.onBeforeCompile=shader=>{
  shader.uniforms.uSweep=sweep;
  shader.vertexShader='varying vec3 vBeadWorld;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n vBeadWorld = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;');
  shader.fragmentShader='uniform float uSweep; varying vec3 vBeadWorld;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n float shine = pow(max(0.0, 1.0 - abs(vBeadWorld.x + vBeadWorld.y * 0.35 - uSweep) / 1.4), 2.0); totalEmissiveRadiance += vec3(0.34, 0.40, 0.45) * shine;');
};
const kitty=createKittySculpture(puzzle);scene.add(kitty.group);
const count=puzzle.total;
const beads=new THREE.InstancedMesh(beadShape,beadMaterial,count);
beads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
beads.castShadow=true;beads.receiveShadow=true;beads.frustumCulled=false;beads.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,0,1),32);scene.add(beads);
const backgroundBeads=new THREE.InstancedMesh(beadShape,new THREE.MeshPhysicalMaterial({color:'#26333e',roughness:.70,metalness:0,clearcoat:.10,clearcoatRoughness:.48,envMapIntensity:.20}),count);
backgroundBeads.frustumCulled=false;backgroundBeads.receiveShadow=true;backgroundBeads.castShadow=true;scene.add(backgroundBeads);
const beadIds=[],dummy=new THREE.Object3D(),color=new THREE.Color();
const socketShape=new THREE.LatheGeometry([[.43,.015],[.375,-.06],[.31,-.18],[.18,-.23],[0,-.23],[0,-.31],[.35,-.31],[.44,-.18],[.43,.015]].map(([r,z])=>new THREE.Vector2(r,z)),24);
socketShape.rotateX(Math.PI/2);
const sockets=new THREE.InstancedMesh(socketShape,new THREE.MeshStandardMaterial({roughness:.62}),count);
const boardIndices=[],positions=new Map();
function point(region,index){if(region==='board')return new THREE.Vector3(((index%WIDTH)-14)*.84,(14-Math.floor(index/WIDTH))*.84+5,.065+kitty.surfaceHeight(index));return new THREE.Vector3((index%12-5.5)*2.0,-11.525-Math.floor(index/12)*1.25,.30);}
let n=0;
for(let i=0;i<puzzle.target.length;i++)if(puzzle.target[i]){
  boardIndices.push(i);const p=point('board',i);positions.set(i,p);
  dummy.position.copy(p);dummy.position.z=p.z-.18;dummy.scale.setScalar(1);dummy.updateMatrix();sockets.setMatrixAt(n,dummy.matrix);
  color.set(PALETTE[puzzle.target[i]]).lerp(new THREE.Color('#dfeaf2'),.32);sockets.setColorAt(n,color);n++;
}
sockets.receiveShadow=true;sockets.castShadow=true;scene.add(sockets);
// A fine bevel and a real backing edge give the mosaic actual thickness.
const backing=new THREE.Mesh(new THREE.CylinderGeometry(11.50,11.50,.18,96).rotateX(Math.PI/2),new THREE.MeshStandardMaterial({color:'#374753',roughness:.75}));
backing.position.set(0,5,-.48);backing.castShadow=true;backing.receiveShadow=true;scene.add(backing);
function roundedPath(w,h,r,cx=0,cy=0){const shape=new THREE.Shape(),x=cx-w/2,y=cy-h/2;shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);return shape;}
const porcelain=new THREE.MeshPhysicalMaterial({color:'#ffffff',roughness:.28,clearcoat:.55,clearcoatRoughness:.16,envMapIntensity:.3});
const tray=new THREE.Mesh(new RoundedBoxGeometry(26.5,6.25,.48,5,.65),porcelain);
tray.position.set(0,-13.5,-.15);tray.castShadow=true;tray.receiveShadow=true;scene.add(tray);
const rimShape=roundedPath(26.5,6.25,.65);rimShape.holes.push(roundedPath(25.1,5.02,.30));
const rim=new THREE.Mesh(new THREE.ExtrudeGeometry(rimShape,{depth:.50,bevelEnabled:true,bevelSize:.13,bevelThickness:.13,bevelSegments:4,steps:1,curveSegments:10}),porcelain);
rim.position.set(0,-13.5,-.01);rim.castShadow=true;rim.receiveShadow=true;scene.add(rim);
// 48 actual open compartments. Walls cast shadows onto a lower floor.
const gridShape=roundedPath(25.05,4.95,.24);
for(let i=0;i<48;i++){const p=point('tray',i);gridShape.holes.push(roundedPath(1.82,1.07,.11,p.x,p.y+13.5));}
const grid=new THREE.Mesh(new THREE.ExtrudeGeometry(gridShape,{depth:.21,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:2,curveSegments:5}),porcelain);
grid.position.set(0,-13.5,.16);grid.castShadow=true;grid.receiveShadow=true;scene.add(grid);
const trayFloor=new THREE.Mesh(new RoundedBoxGeometry(24.98,4.84,.08,3,.20),new THREE.MeshStandardMaterial({color:'#e8f2f9',roughness:.8}));
trayFloor.position.set(0,-13.5,.085);trayFloor.receiveShadow=true;scene.add(trayFloor);
// Contact occlusion augments the dynamic shadow map at each bead's footprint.
const aoCanvas=document.createElement('canvas');aoCanvas.width=64;aoCanvas.height=64;
const aoCtx=aoCanvas.getContext('2d'),aoGradient=aoCtx.createRadialGradient(32,32,7,32,32,31);
aoGradient.addColorStop(0,'rgba(10,25,38,.44)');aoGradient.addColorStop(.5,'rgba(10,25,38,.23)');aoGradient.addColorStop(1,'rgba(10,25,38,0)');aoCtx.fillStyle=aoGradient;aoCtx.fillRect(0,0,64,64);
const aoTex=new THREE.CanvasTexture(aoCanvas);
const contact=new THREE.InstancedMesh(new THREE.PlaneGeometry(1.22,1.22),new THREE.MeshBasicMaterial({map:aoTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),count);
contact.frustumCulled=false;scene.add(contact);

// Delicate raised whiskers, like the little decorative pieces in the reference.
const whiskerMaterial=new THREE.MeshStandardMaterial({color:'#222c35',roughness:.5});
for(const side of [-1,1])for(const offset of [-.8,0,.8]){
  const curve=new THREE.CatmullRomCurve3([4.8,6.5,8.0].map((x,j)=>{const y=4.4+offset*[1,.8,.9][j];return new THREE.Vector3(side*x,y,kitty.headHeight(side*x,y)+.28);}));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,16,.075,8,false),whiskerMaterial);mesh.castShadow=true;scene.add(mesh);
}

const eyeMaterial=new THREE.MeshPhysicalMaterial({color:'#06080b',roughness:.10,clearcoat:1,envMapIntensity:.9});
for(const x of [10,18]){
  const p=point('board',12*WIDTH+x);
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.76,28,18),eyeMaterial);eye.scale.set(1,1.06,.72);eye.position.copy(p);eye.position.y-=.35;eye.position.z=kitty.headHeight(eye.position.x,eye.position.y)+.18;eye.castShadow=true;scene.add(eye);
  const glint=new THREE.Mesh(new THREE.SphereGeometry(.10,10,8),new THREE.MeshBasicMaterial({color:'#fffdf4'}));glint.position.copy(eye.position).add(new THREE.Vector3(-.23,.26,.48));scene.add(glint);
}
const bow=new THREE.Group();
const bowMat=new THREE.MeshPhysicalMaterial({color:'#008fde',roughness:.23,clearcoat:1,clearcoatRoughness:.10,envMapIntensity:.5});
for(const side of [-1,1]){
  const wing=new THREE.Shape();wing.moveTo(side*.37,.40);wing.bezierCurveTo(side*1.15,.72,side*2.30,1.38,side*2.65,.94);wing.bezierCurveTo(side*2.91,.40,side*2.91,-.65,side*2.56,-.98);wing.bezierCurveTo(side*2.23,-1.27,side*1.02,-.65,side*.37,-.40);wing.closePath();
  const piece=new THREE.Mesh(new THREE.ExtrudeGeometry(wing,{depth:.32,bevelSize:.12,bevelThickness:.12,bevelSegments:4,curveSegments:16}),bowMat);piece.castShadow=true;piece.receiveShadow=true;bow.add(piece);
  const seam=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(side*.60,.04,.47),new THREE.Vector3(side*1.13,.25,.47),new THREE.Vector3(side*1.73,.38,.42)]),12,.065,6,false),new THREE.MeshStandardMaterial({color:'#0065af',roughness:.4}));bow.add(seam);
}
const knot=new THREE.Mesh(new RoundedBoxGeometry(.93,.96,.65,4,.20),bowMat);knot.position.z=.25;knot.castShadow=true;bow.add(knot);bow.position.set(0,-.05,kitty.bodyHeight(0,-.05)+.22);scene.add(bow);
const nose=new THREE.Mesh(new THREE.SphereGeometry(.26,20,14),new THREE.MeshPhysicalMaterial({color:'#ff9cb8',roughness:.26,clearcoat:.7}));nose.scale.set(1,.72,.5);nose.position.set(0,4.95,kitty.headHeight(0,4.95)+.32);scene.add(nose);
for(const side of [-1,1]){
  const smile=new THREE.CatmullRomCurve3([[0,4.77],[side*.28,4.38],[side*.65,4.35],[side*.91,4.60]].map(([x,y])=>new THREE.Vector3(x,y,kitty.headHeight(x,y)+.28)));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(smile,18,.070,8,false),whiskerMaterial);scene.add(mesh);
}
const particles=[];
const sparkGeo=new THREE.OctahedronGeometry(.10,0);
const sparkMat=new THREE.MeshBasicMaterial({color:'#fff7cc',transparent:true});
const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=64;
const gc=glowCanvas.getContext('2d'),gg=gc.createRadialGradient(32,32,0,32,32,32);
gg.addColorStop(0,'rgba(255,255,255,1)');gg.addColorStop(.20,'rgba(225,248,255,.75)');gg.addColorStop(.55,'rgba(143,215,255,.18)');gg.addColorStop(1,'rgba(143,215,255,0)');gc.fillStyle=gg;gc.fillRect(0,0,64,64);
const glowTex=new THREE.CanvasTexture(glowCanvas);
const glowMaterial=new THREE.SpriteMaterial({map:glowTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.8});
let flights=[],busy=false,sweepStart=-Infinity,lastInput=performance.now(),hasPlayed=false,won=false;
const selectedGlow=new THREE.InstancedMesh(new THREE.TorusGeometry(.48,.045,8,32),new THREE.MeshBasicMaterial({color:'#eac37e',transparent:true,opacity:.85}),count);
selectedGlow.frustumCulled=false;scene.add(selectedGlow);
const audios={bgm:new Audio('audio/bgm.mp3'),pickup:new Audio('audio/pickup.mp3'),place:new Audio('audio/place.mp3'),store:new Audio('audio/store.mp3'),success:new Audio('audio/success.mp3')};
audios.bgm.loop=true;audios.bgm.volume=.24;for(const [k,a]of Object.entries(audios))if(k!=='bgm')a.volume=.45;
let sound=false,toastTimer;
function play(name){if(!sound)return;const a=name==='bgm'?audios.bgm:audios[name].cloneNode();a.volume=audios[name].volume;void a.play().catch(()=>{});}
function enableAudio(){if(sound&&!hasPlayed){play('bgm');hasPlayed=true;}}
$('sound').onclick=()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Mute sound':'Enable sound');if(sound){play('bgm');hasPlayed=true;}else audios.bgm.pause();};
document.addEventListener('visibilitychange',()=>{if(document.hidden)audios.bgm.pause();else if(sound&&hasPlayed)play('bgm');});

function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2200);}
function updateUI(){renderer.shadowMap.needsUpdate=true;const pct=Math.round(puzzle.correct/puzzle.total*100);$('percent').innerHTML=`${pct}<span>%</span>`;$('progress').style.width=`${pct}%`;$('placed').textContent=`${puzzle.correct} of ${puzzle.total} beads in place`;$('tray-count').textContent=`${puzzle.tray.filter(Boolean).length} / 48`;$('undo').disabled=!puzzle.history.length;
  $('instruction').textContent=puzzle.selection?'Place these beads in matching empty sockets.':puzzle.complete?'A little masterpiece, made by you.':'Pick a color. Find its little home.';
}
function hideGuide(){$('guide').style.display='none';}
function showHint(){if(busy)return;const h=puzzle.hint();if(!h){toast('Every bead is right where it belongs.');return;}const p=point(h.region,h.index).project(camera),rect=canvas.getBoundingClientRect();$('guide').style.left=`${(p.x*.5+.5)*rect.width}px`;$('guide').style.top=`${(-p.y*.5+.5)*rect.height}px`;$('guide').style.display='block';$('instruction').textContent=h.action==='pick'?'Tap the highlighted color group.':h.action==='store'?'Set this group in the tray to make room.':'Tap the highlighted empty sockets.';}
$('hint').onclick=()=>{enableAudio();showHint();};
function reset(){$('hint').disabled=false;flights=[];busy=false;won=false;particles.forEach(p=>{scene.remove(p.mesh);p.mesh.material.dispose();});particles.length=0;puzzle.reset();sweepStart=-Infinity;sweep.value=-100;$('win').hidden=true;hideGuide();updateUI();lastInput=performance.now();toast('A fresh little start.');}
$('restart').onclick=reset;$('play-again').onclick=reset;$('keep-looking').onclick=()=>{$('win').hidden=true;};
$('undo').onclick=()=>{if(busy)return;if(puzzle.undo()){won=false;$('win').hidden=true;hideGuide();updateUI();toast('One step back. No rush.');}};

function spark(position,amount=5){for(let i=0;i<amount;i++){const mesh=new THREE.Mesh(sparkGeo,sparkMat.clone());mesh.position.copy(position);mesh.position.z=Math.max(.8,position.z+.38);const glow=new THREE.Sprite(glowMaterial);glow.scale.set(.95,.95,1);mesh.add(glow);scene.add(mesh);particles.push({mesh,start:performance.now(),velocity:new THREE.Vector3((Math.random()-.5)*2,(Math.random()-.2)*2,Math.random()*.8)});}}
function fly(moves){$('hint').disabled=true;$('undo').disabled=true;const start=performance.now();flights=moves.map((m,k)=>({...m,start:start+k*30,duration:480,fromP:point(m.fromRegion,m.from),toP:point(m.toRegion,m.to)}));busy=true;play(moves[0].toRegion==='tray'?'store':'place');hideGuide();}
function finishMove(){$('hint').disabled=false;busy=false;flights=[];updateUI();sweepStart=performance.now();if(puzzle.complete&&!won){won=true;play('success');for(let k=0;k<25;k++)spark(new THREE.Vector3((Math.random()-.5)*24,(Math.random()-.5)*20+5,.8),2);setTimeout(()=>{if(puzzle.complete&&won)$('win').hidden=false;},1200);}else toast(puzzle.selection?'Lovely. Place the rest of this group.':'A little closer. ✧');}
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
function hitAt(x,y){const r=canvas.getBoundingClientRect();pointer.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObject(beads)[0];if(hit&&beadIds[hit.instanceId])return beadIds[hit.instanceId];
  const p=new THREE.Vector3();raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,0,1),-.30),p);
  const col=Math.round(p.x/2+5.5),row=Math.round((-11.525-p.y)/1.25);
  if(col>=0&&col<12&&row>=0&&row<4&&Math.abs(p.x-(col-5.5)*2)<.96&&Math.abs(p.y-(-11.525-row*1.25))<.60)return{region:'tray',index:row*12+col};
  // Empty sockets live on curved surfaces, so compare their projected centers.
  let nearest=null,dist=1;
  for(const i of boardIndices){
    const center=point('board',i),edge=center.clone().add(new THREE.Vector3(.66,0,0)).project(camera);center.project(camera);
    const sx=r.left+(center.x*.5+.5)*r.width,sy=r.top+(-center.y*.5+.5)*r.height;
    const radius=Math.abs(edge.x-center.x)*r.width*.5,d=Math.hypot(x-sx,y-sy)/radius;
    if(d<dist){dist=d;nearest={region:'board',index:i};}
  }
  return nearest;
}
function activate(hit){if(busy||!hit)return;enableAudio();lastInput=performance.now();hideGuide();const {region,index}=hit;
  if(puzzle.selection){const selected=puzzle.selection;if(selected.region===region&&selected.indices.includes(index)){puzzle.selection=null;updateUI();return;}const moves=puzzle.place(region,index);if(moves){fly(moves);return;}}
  if(puzzle.pick(region,index)){play('pickup');updateUI();return;}
  const list=region==='board'?puzzle.board:puzzle.tray;
  if(region==='board'&&list[index]===puzzle.target[index]&&list[index])toast('Already home. Try a bead with a gold ring.');else if(puzzle.selection)toast(region==='tray'?'This slot is full. Try an empty socket.':'Find empty sockets of the same color.');
}
let down=null;
canvas.addEventListener('pointerdown',e=>{if(busy)return;down={x:e.clientX,y:e.clientY,hit:hitAt(e.clientX,e.clientY),wasSelected:!!puzzle.selection};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointerup',e=>{if(!down)return;const d=down;down=null;const distance=Math.hypot(e.clientX-d.x,e.clientY-d.y);if(distance>12&&d.hit){if(!d.wasSelected)activate(d.hit);const end=hitAt(e.clientX,e.clientY);if(end&&puzzle.selection)activate(end);}else activate(hitAt(e.clientX,e.clientY));});
canvas.addEventListener('pointercancel',()=>{down=null;});

function resize(){const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;const viewHeight=Math.max(38.4,29.3/camera.aspect),distance=viewHeight/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));camera.position.set(0,-distance*Math.sin(.13),distance*Math.cos(.13));camera.lookAt(0,0,0);camera.updateProjectionMatrix();const label=new THREE.Vector3(0,-9.65,.6).project(camera);$('game').parentElement.querySelector('.tray-label').style.top=`${(-label.y*.5+.5)*rect.height}px`;$('game').parentElement.querySelector('.tray-label').style.bottom='auto';hideGuide();}
new ResizeObserver(resize).observe(canvas);resize();updateUI();$('loading').classList.add('hidden');
const targetColor=new THREE.Color();
function render(now){
  if(document.hidden)return;
  let slot=0,glow=0,backgroundSlot=0;beadIds.length=0;
  for(let k=0;k<boardIndices.length;k++){
    const i=boardIndices[k],p=point('board',i);
    const embedded=kitty.smoothAt(i)&&puzzle.board[i]===puzzle.target[i]&&!flights.some(f=>f.toRegion==='board'&&f.to===i);
    dummy.position.copy(p);dummy.position.z=p.z-.18;dummy.scale.setScalar(embedded?0:1);dummy.updateMatrix();sockets.setMatrixAt(k,dummy.matrix);
  }
  sockets.instanceMatrix.needsUpdate=true;
  const selection=puzzle.selection;
  const selected=new Set(selection?selection.indices.map(i=>`${selection.region}:${i}`):[]);
  kitty.update(puzzle.board,new Set(flights.filter(f=>f.toRegion==='board').map(f=>f.to)));
  const flightDest=new Set(flights.map(f=>`${f.toRegion}:${f.to}`));
  const add=(region,index,c,p,scale=1)=>{
    const sculpted=region==='board'&&kitty.partAt(index)!==0;
    const isSettled=region==='board'&&c===puzzle.target[index]&&!selected.has(`${region}:${index}`)&&!flightDest.has(`${region}:${index}`);
    if(isSettled&&c===2&&kitty.smoothAt(index))return;
    const isBackground=isSettled&&c===1&&!sculpted;
    dummy.position.copy(p);dummy.rotation.set(0,0,0);
    if(isBackground){dummy.position.z=-.015;dummy.scale.set(scale,scale,.46);dummy.updateMatrix();backgroundBeads.setMatrixAt(backgroundSlot++,dummy.matrix);return;}
    const inset=isSettled&&sculpted&&c===2;
    dummy.scale.set(scale*(inset?.97:1),scale*(inset?.97:1),scale*(inset?.63:1));dummy.updateMatrix();beads.setMatrixAt(slot,dummy.matrix);
    targetColor.set(PALETTE[c]);beads.setColorAt(slot,targetColor);
    dummy.position.set(p.x+.05,p.y-.07,region==='tray'?.137:sculpted?p.z-.15:-.39);dummy.scale.setScalar(scale);dummy.updateMatrix();contact.setMatrixAt(slot,dummy.matrix);
    beadIds[slot]={region,index};slot++;
  };
  for(const region of ['board','tray']){const list=region==='board'?puzzle.board:puzzle.tray;for(let i=0;i<list.length;i++){const c=list[i];if(!c||flightDest.has(`${region}:${i}`))continue;const p=point(region,i);if(region==='tray')p.z=.30;
    const isSelected=selected.has(`${region}:${i}`);if(isSelected){p.z+=.65+Math.sin(now*.005)*.055;}
    add(region,i,c,p,isSelected?1.06:1);
    if(isSelected){dummy.position.copy(p);dummy.position.z=isSelected?p.z+.05:.0;dummy.scale.setScalar(isSelected?1.05:1);dummy.updateMatrix();selectedGlow.setMatrixAt(glow++,dummy.matrix);}
  }}
  let allDone=true;
  for(const f of flights){const t=THREE.MathUtils.clamp((now-f.start)/f.duration,0,1);if(t<1)allDone=false;const ease=t<.5?4*t*t*t:1-(-2*t+2)**3/2;const p=f.fromP.clone().lerp(f.toP,ease);p.z=f.fromP.z+(f.toP.z-f.fromP.z)*ease+Math.sin(t*Math.PI)*3.2;add(f.toRegion,f.to,f.color,p,1+Math.sin(t*Math.PI)*.12);if(t===1&&!f.sparked){f.sparked=true;spark(f.toP);}}
  backgroundBeads.count=backgroundSlot;backgroundBeads.instanceMatrix.needsUpdate=true;
  contact.count=slot;contact.instanceMatrix.needsUpdate=true;
  bow.visible=puzzle.target.every((c,i)=>c!==4||puzzle.board[i]===4);
  beads.count=slot;beads.instanceMatrix.needsUpdate=true;if(beads.instanceColor)beads.instanceColor.needsUpdate=true;selectedGlow.count=glow;selectedGlow.instanceMatrix.needsUpdate=true;
  if(busy)renderer.shadowMap.needsUpdate=true;
  if(busy&&allDone)finishMove();
  const sweepT=(now-sweepStart)/1300;sweep.value=sweepT>=0&&sweepT<=1?-24+sweepT*48:-100;
  for(let i=particles.length-1;i>=0;i--){const p=particles[i],t=(now-p.start)/1000;p.mesh.position.addScaledVector(p.velocity,.016);p.mesh.rotation.z+=.035;p.mesh.material.opacity=Math.max(0,1-t/1.1);p.mesh.scale.setScalar(Math.max(.01,1-t/1.1));if(t>1.1){scene.remove(p.mesh);p.mesh.material.dispose();particles.splice(i,1);}}
  if(now-lastInput>5500&&!won&&$('guide').style.display!=='block'){showHint();lastInput=now;}
  renderer.render(scene,camera);
}
function captureReference(){
  const oldBoard=puzzle.board,oldTray=puzzle.tray;
  puzzle.board=[...puzzle.target];puzzle.tray=Array(puzzle.capacity).fill(0);
  renderer.shadowMap.needsUpdate=true;render(performance.now());
  const r=canvas.getBoundingClientRect(),dpr=renderer.getPixelRatio();
  const left=new THREE.Vector3(-12.7,5,0).project(camera),right=new THREE.Vector3(12.7,5,0).project(camera),top=new THREE.Vector3(0,17.7,0).project(camera),bottom=new THREE.Vector3(0,-7.7,0).project(camera);
  const x=(left.x*.5+.5)*r.width*dpr,y=(-top.y*.5+.5)*r.height*dpr,w=(right.x-left.x)*.5*r.width*dpr,h=(top.y-bottom.y)*.5*r.height*dpr;
  for(const id of ['reference','win-reference']){const dest=$(id),ctx=dest.getContext('2d');ctx.clearRect(0,0,dest.width,dest.height);ctx.drawImage(canvas,x,y,w,h,0,0,dest.width,dest.height);}
  puzzle.board=oldBoard;puzzle.tray=oldTray;renderer.shadowMap.needsUpdate=true;render(performance.now());
}
captureReference();
renderer.setAnimationLoop(render);
// Read-only inspection helpers used by the browser smoke test.
if(import.meta.env.DEV)window.__colorever={puzzle,renderer,scene,camera,screenPoint(region,index){const p=point(region,index).project(camera),r=canvas.getBoundingClientRect();return{x:r.left+(p.x*.5+.5)*r.width,y:r.top+(-p.y*.5+.5)*r.height};},get busy(){return busy;}};
