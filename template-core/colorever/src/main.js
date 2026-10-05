import './style.css';
import {Puzzle} from './model.js';
import {GameAudio} from './game-audio.js';
import {GameEffects} from './game-effects.js';
import {AmbientSheen} from './ambient-sheen.js';
import {GameTutorial,hintInstruction} from './game-tutorial.js';
import {GameHaptics} from './game-haptics.js';
import guideHand from './assets/guide-hand.png?inline';
import {trayLayout} from './tray-layout.js';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {patterns} from './patterns/index.js';
const patternId=globalThis.__COLOREVER_PATTERN_ID__??'cat';
const pattern=patterns[patternId];
if(!pattern)throw new Error('Unknown picture template: '+patternId);
import {validateLevel} from './level.js';
const level=validateLevel(globalThis.__COLOREVER_LEVEL__??pattern.level);
if(!level.opening)throw new Error('Missing authored opening; generate it in the Colorever editor and build again');
const {width,height,capacity,trayCols}=level;
const boardScale=Math.min(3,33/Math.max(width,height)),tray=trayLayout(capacity,trayCols),trayRows=tray.rows;
const trayScale=tray.scale;
const reference={beads:level.target.flatMap((color,i)=>color?[{x:780+(i%width-(width-1)/2)*39.2*boardScale,y:1441+(Math.floor(i/width)-(height-1)/2)*39.2*boardScale,row:Math.floor(i/width),col:i%width,color}]:[])};
import {createBeadParts} from './bead-reference.js';
import {lightBeadStudio} from './studio-reference.js';
import {createMosaicSockets} from './mosaic-sockets.js';

const canvas=document.getElementById('game');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,3));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1.0;
const scene=new THREE.Scene();
const camera=new THREE.OrthographicCamera(-15.2,15.2,27.2,-27.2,.1,140);
camera.position.set(0,-7.5,85);camera.lookAt(0,0,0);
lightBeadStudio(renderer,scene);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(80,100),new THREE.ShadowMaterial({color:'#285469',opacity:.14}));
ground.position.z=-.45;ground.receiveShadow=true;scene.add(ground);
const at=(x,y,z=.10)=>new THREE.Vector3((x-760)*.02,(1360-y)*.02,z);
const palette=level.colors;
const {bodyGeometry,bodyMaterials}=createBeadParts(palette);
scene.add(createMosaicSockets(reference.beads,at,palette,boardScale));
const codes=Object.fromEntries(Object.keys(palette).map(c=>[c,Number(c)])),letters=Object.fromEntries(Object.entries(codes).map(([k,v])=>[v,k]));
const cells=new Map(reference.beads.map(b=>[b.row*width+b.col,{...b,code:b.color}]));
const target=level.target;
const puzzle=new Puzzle({width,height,target,capacity,trayCols,openingBoard:level.opening});
const groups=[],dummy=new THREE.Object3D();
for(const c of Object.keys(palette)){
  const mesh=new THREE.InstancedMesh(bodyGeometry,bodyMaterials[c],target.length+capacity);
  mesh.castShadow=true;mesh.receiveShadow=false;mesh.frustumCulled=false;mesh.count=0;
  groups.push({mesh,entries:[],color:codes[c]});scene.add(mesh);
}
// Small contact shadows join the pellets without drawing outlines on their faces.
const occlusionCanvas=document.createElement('canvas');occlusionCanvas.width=64;occlusionCanvas.height=64;
const ctx=occlusionCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,31);
gradient.addColorStop(0,'rgba(21,26,36,.24)');gradient.addColorStop(.65,'rgba(21,26,36,.20)');gradient.addColorStop(.83,'rgba(21,26,36,.08)');gradient.addColorStop(1,'rgba(21,26,36,0)');
ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
const occlusion=new THREE.InstancedMesh(new THREE.PlaneGeometry(.87,.87),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(occlusionCanvas),transparent:true,depthWrite:false}),reference.beads.filter(b=>b.row>=0).length);
occlusion.frustumCulled=false;
reference.beads.filter(b=>b.row>=0).forEach((b,i)=>{dummy.position.copy(at(b.x,b.y,.002));dummy.scale.setScalar(boardScale);dummy.updateMatrix();occlusion.setMatrixAt(i,dummy.matrix);});scene.add(occlusion);
pattern.decorate({scene,at,level,boardScale});
// Compact square pockets sized just above the beads, in a fitted warm shell.
const trayCenter=at(761,2425,-.02);
function rounded(w,h,r,x=0,y=0){const s=new THREE.Shape(),l=x-w/2,b=y-h/2;s.moveTo(l+r,b);s.lineTo(l+w-r,b);s.quadraticCurveTo(l+w,b,l+w,b+r);s.lineTo(l+w,b+h-r);s.quadraticCurveTo(l+w,b+h,l+w-r,b+h);s.lineTo(l+r,b+h);s.quadraticCurveTo(l,b+h,l,b+h-r);s.lineTo(l,b+r);s.quadraticCurveTo(l,b,l+r,b);return s;}
const shellMaterial=new THREE.MeshPhysicalMaterial({color:'#fff0e0',roughness:.38,clearcoat:.3,clearcoatRoughness:.26,envMapIntensity:.25});
const pocketMaterial=new THREE.MeshStandardMaterial({color:'#d4b296',roughness:.72});
const base=new THREE.Mesh(new THREE.ExtrudeGeometry(rounded(tray.width, tray.height,.6),{depth:.25,bevelSize:.13,bevelThickness:.11,bevelSegments:6,curveSegments:20}),shellMaterial);
base.position.set(0,trayCenter.y,-.27);base.castShadow=true;base.receiveShadow=true;scene.add(base);
const rimShape=rounded(tray.width-.1,tray.height-.1,.55);rimShape.holes.push(rounded(tray.width-.65,tray.height-.65,.3));
const rim=new THREE.Mesh(new THREE.ExtrudeGeometry(rimShape,{depth:.37,bevelSize:.18,bevelThickness:.14,bevelSegments:6,curveSegments:20}),shellMaterial);
rim.position.set(0,trayCenter.y,.04);rim.castShadow=true;rim.receiveShadow=true;scene.add(rim);
const pitch=tray.pitch,rowPitch=pitch,trayPoint=(col,row)=>new THREE.Vector3((col-(trayCols-1)/2)*pitch,trayCenter.y+((trayRows-1)/2-row)*rowPitch,.21);
const insetShape=rounded(tray.width-.9,tray.height-.9,.25);
for(let row=0;row<trayRows;row++)for(let col=0;col<trayCols;col++){
  if(row*trayCols+col>=capacity)continue;
  const position=trayPoint(col,row);
  insetShape.holes.push(rounded(tray.pocketWidth,tray.pocketWidth,.09,position.x,position.y-trayCenter.y));
  const floor=new THREE.Mesh(new RoundedBoxGeometry(tray.pocketWidth+.06,tray.pocketWidth+.06,.09,4,.035),pocketMaterial);
  floor.position.set(position.x,position.y,.09);floor.receiveShadow=true;scene.add(floor);
}
const inset=new THREE.Mesh(new THREE.ExtrudeGeometry(insetShape,{depth:.21,bevelSize:.065,bevelThickness:.065,bevelSegments:4,curveSegments:12}),shellMaterial);
inset.position.set(0,trayCenter.y,.085);inset.castShadow=true;inset.receiveShadow=true;scene.add(inset);
const audio=new GameAudio();
let busy=false,flights=[],hint=null,down=null,selectionStart=0,completion=null,completedColors=new Set(),pendingColors=[];
const $=id=>document.getElementById(id);
const tutorial=new GameTutorial(),haptics=new GameHaptics();
$('guide-hand').src=guideHand;
const point=(region,index)=>region==='board'?at(cells.get(index).x,cells.get(index).y,.10):trayPoint(index%trayCols,Math.floor(index/trayCols));
const effects=new GameEffects(scene,point,cells,boardScale);
const ambientSheen=new AmbientSheen(scene,target.length+capacity,boardScale,trayScale);
$('sheen').onclick=()=>{ambientSheen.enabled=!ambientSheen.enabled;$('sheen').setAttribute('aria-pressed',String(ambientSheen.enabled));$('sheen').setAttribute('aria-label',ambientSheen.enabled?'关闭常驻反光':'打开常驻反光');};
const colorNames=level.colorNames;
document.querySelector('.hud strong').textContent=level.name;
document.title=level.name+' · Colorever';
canvas.setAttribute('aria-label',level.name);
document.querySelector('.app').dataset.decoration=level.decoration;
document.querySelector('.app').dataset.patternId=patternId;
document.querySelector('.app').dataset.levelName=level.name;
let wasWon=false;
const play=k=>{audio.play(k);haptics.play(k);};
document.addEventListener('click',e=>{if(e.target.closest?.('#novvy-cta-btn')||e.target.id==='novvy-cta')haptics.trigger('light');},{capture:true});
function seedCompleteColors(){completedColors=new Set([...new Set(target.filter(Boolean))].filter(c=>puzzle.isColorComplete(c)));}
seedCompleteColors();
document.addEventListener('pointerdown',e=>{if(e.target.closest('#sound'))return;audio.unlock();},{capture:true});
document.addEventListener('click',e=>{if(e.target.closest('#sound'))return;audio.unlock();},{capture:true});
function updateSound(){ $('sound').setAttribute('aria-pressed',String(audio.enabled));$('sound').setAttribute('aria-label',audio.enabled?'关闭音乐':'打开音乐');}
updateSound();
const markers=new THREE.Group();scene.add(markers);
const outline=rounded(.77,.77,.08);outline.holes.push(rounded(.70,.70,.06));
const outlineGeometry=new THREE.ShapeGeometry(outline),outlineMaterial=new THREE.MeshBasicMaterial({color:'#ffc526',depthTest:false,transparent:true,opacity:.9});
function refresh(){
  for(const g of groups){g.entries=[];for(const region of ['board','tray'])puzzle[region].forEach((color,index)=>{if(color===g.color){g.entries.push({region,index,point:point(region,index),lift:0});}});g.mesh.count=g.entries.length;}
  while(markers.children.length)markers.remove(markers.children[0]);
  for(const [index]of cells)if(puzzle.board[index]&&puzzle.board[index]!==target[index]){const m=new THREE.Mesh(outlineGeometry,outlineMaterial);m.position.copy(point('board',index));m.position.z=.5;m.scale.setScalar(boardScale);markers.add(m);}
  updateUI();
}
function updateUI(){
  $('progress').textContent=`${puzzle.correct} / ${puzzle.total}`;
  $('progress-bar').value=puzzle.correct;$('progress-bar').max=puzzle.total;
  $('moves').textContent=`${puzzle.moves} 步 · 缓存 ${puzzle.tray.filter(Boolean).length}/${capacity}`;
  $('undo').disabled=busy||!puzzle.history.length;$('hint').disabled=busy||puzzle.complete;
  $('instruction').textContent=completion?'全图扫光中…':puzzle.complete?'拼画完成！':puzzle.selection?`已选 ${puzzle.selection.indices.length} 颗 · 点同色空格归位，或点盒子暂存`:'点金色边框的错珠，再点底部空格暂存';
  if(tutorial.active)hint=tutorial.hint(puzzle,busy);
  showHint();
  document.dispatchEvent(new CustomEvent('novvy:hud-progress',{bubbles:true,detail:{percent:Math.round(puzzle.correct/puzzle.total*100),correct:puzzle.correct,total:puzzle.total}}));
  if(!puzzle.complete)wasWon=false;
}
function projectHint(){if(!hint)return;const p=point(hint.region,hint.index).clone();p.z+=.5;p.project(camera);$('guide').style.left=`${(p.x+1)*50}%`;$('guide').style.top=`${(1-p.y)*50}%`;}
function showHint(){
  $('guide').hidden=!hint||busy||puzzle.complete;
  if($('guide').hidden)return;
  $('guide').setAttribute('aria-label',`执行提示：${hintInstruction(hint)}`);
  $('instruction').textContent=hintInstruction(hint);projectHint();
}
function clearHint(){hint=null;$('guide').hidden=true;}
function activate(region,index){
  if(busy||puzzle.complete)return;clearHint();
  const selection=puzzle.selection;
  if(selection&&selection.region===region&&selection.indices.includes(index)){puzzle.selection=null;updateUI();return;}
  if(selection){const moved=puzzle.place(region,index);if(moved){tutorial.placed(region);busy=true;let order=0;const now=performance.now();
    flights=moved.map(m=>{const mesh=new THREE.Mesh(bodyGeometry,bodyMaterials[letters[m.color]]);mesh.castShadow=true;scene.add(mesh);const a=point(m.fromRegion,m.from).clone();if(!m.shift)a.z+=.38;return{...m,mesh,start:now+(m.shift?0:order++*(region==='tray'?55:m.fromRegion==='tray'?65:50)),duration:m.shift?210:(m.fromRegion==='tray'||m.toRegion==='tray')?360:260,a,b:point(m.toRegion,m.to),landed:false};});
    if(moved.some(m=>m.shift))play('store-move');refresh();return;}
}
  if(puzzle.pick(region,index)){selectionStart=performance.now();play('pickup');updateUI();}else if(tutorial.active){updateUI();}else{$('instruction').textContent=region==='board'&&puzzle.board[index]===target[index]?'这颗已归位，不能移动':selection?'请选择同色空格，或盒子里的空格':'点金色边框的错珠开始';}
}
$('sound').onclick=()=>{audio.setEnabled(!audio.enabled);updateSound();};
document.addEventListener('visibilitychange',()=>{if(document.hidden){audio.bgm.pause();audio.stopEffects();}else audio.unlock();});
function reset(){wasWon=false;for(const f of flights)scene.remove(f.mesh);flights=[];busy=false;completion=null;pendingColors=[];effects.clear();audio.stopEffects();clearHint();puzzle.reset();tutorial.reset();seedCompleteColors();$('win').hidden=true;$('celebration').hidden=true;refresh();if(puzzle.complete)afterFlights(performance.now());}
$('reset').onclick=reset;$('again').onclick=reset;$('dismiss').onclick=()=>{$('win').hidden=true;};
$('undo').onclick=()=>{if(!busy&&puzzle.undo()){clearHint();effects.clear();pendingColors=[];completion=null;seedCompleteColors();$('win').hidden=true;$('celebration').hidden=true;refresh();}};
$('hint').onclick=()=>{hint=puzzle.hint();showHint();};
$('guide').onclick=()=>{if(hint){const h=hint;activate(h.region,h.index);}};
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),-.1);
function hitAt(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObjects(groups.map(g=>g.mesh))[0];if(hit){const g=groups.find(g=>g.mesh===hit.object),entry=g.entries[hit.instanceId];if(entry)return{region:entry.region,index:entry.index};}
  const p=new THREE.Vector3();if(!raycaster.ray.intersectPlane(plane,p))return null;
  let closest=null,distance=Infinity;for(const [index]of cells){const q=point('board',index),d=Math.hypot(p.x-q.x,p.y-q.y);if(d<.48*boardScale&&d<distance){closest={region:'board',index};distance=d;}}
  if(closest)return closest;for(let i=0;i<capacity;i++){const q=point('tray',i);if(Math.abs(p.x-q.x)<pitch*.42&&Math.abs(p.y-q.y)<rowPitch*.42)return{region:'tray',index:i};}return null;
}
canvas.addEventListener('pointerdown',e=>{if(busy)return;down={x:e.clientX,y:e.clientY,hit:hitAt(e)};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointerup',e=>{if(!down)return;const start=down;down=null;const end=hitAt(e);if(!end)return;const drag=Math.hypot(e.clientX-start.x,e.clientY-start.y)>8;if(drag&&start.hit&&!puzzle.selection&&puzzle.pick(start.hit.region,start.hit.index)){selectionStart=performance.now();play('pickup');}activate(end.region,end.index);});
canvas.addEventListener('pointercancel',()=>{down=null;});
function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.updateProjectionMatrix();projectHint();}
new ResizeObserver(resize).observe(canvas);resize();refresh();if(puzzle.complete)afterFlights(performance.now());
function afterFlights(now){
  const hadBoardPlacement=flights.some(f=>!f.shift&&f.toRegion==='board');
  if(hadBoardPlacement)play('place');
  for(const f of flights)scene.remove(f.mesh);flights=[];
  const colors=[...new Set(target.filter(Boolean))].filter(c=>!completedColors.has(c)&&puzzle.isColorComplete(c));
  let end=now;
  for(const c of colors){completedColors.add(c);const start=end+400;effects.color(c,start);const indices=[...cells].filter(([i])=>target[i]===c).map(([i])=>i);for(let k=0;k<indices.length;k+=Math.max(1,Math.floor(indices.length/12)))effects.spark(indices[k],start+80);pendingColors.push({color:c,start,announced:false});end=start+900;}
  if(puzzle.complete){const start=end+250;completion={start,end:effects.full(start),announced:false};busy=true;}
  else busy=colors.length>0;
  updateUI();
}
function render(now){
  if(busy&&flights.length){
    for(const f of flights){const t=THREE.MathUtils.clamp((now-f.start)/f.duration,0,1),ease=1-Math.pow(1-t,3);f.mesh.position.lerpVectors(f.a,f.b,ease);f.mesh.position.z+=Math.sin(Math.PI*t)*(f.shift?.08:.8);f.mesh.scale.setScalar(THREE.MathUtils.lerp(f.fromRegion==='tray'?trayScale:boardScale,f.toRegion==='tray'?trayScale:boardScale,ease));
      if(t===1&&!f.landed){f.landed=true;f.mesh.visible=false;if(!f.shift){play(f.toRegion==='tray'?'store':'place-single');if(f.toRegion==='board')effects.sweep(f.to);}}}
    if(flights.every(f=>f.landed))afterFlights(now);
  }
  for(const event of pendingColors)if(now>=event.start&&!event.announced){event.announced=true;play('success');$('celebration').textContent=`${colorNames[event.color]}全部归位！`;$('celebration').hidden=false;}
  pendingColors=pendingColors.filter(event=>now<event.start+900);
  if(!pendingColors.length){$('celebration').hidden=true;if(busy&&!flights.length&&!completion){busy=false;updateUI();}}
  if(completion){if(now>=completion.start&&!completion.announced){completion.announced=true;play('success');$('instruction').textContent='拼画完成 · 全图扫光中…';}if(now>=completion.end){completion=null;busy=false;updateUI();$('win-detail').textContent=`${puzzle.total} 颗珠子全部归位 · ${puzzle.moves} 步完成`;$('win').hidden=false;if(!wasWon){wasWon=true;document.dispatchEvent(new CustomEvent('novvy:victory',{bubbles:true}));}}}
  for(const {mesh,entries}of groups){for(let i=0;i<entries.length;i++){const e=entries[i],selected=puzzle.selection?.region===e.region&&puzzle.selection.indices.includes(e.index);const t=THREE.MathUtils.clamp((now-selectionStart)/150,0,1);e.lift=selected?.38*(1-Math.pow(1-t,3)):THREE.MathUtils.lerp(e.lift,0,.25);const flying=flights.some(f=>!f.landed&&f.toRegion===e.region&&f.to===e.index);dummy.position.copy(e.point);dummy.position.z+=e.lift;dummy.scale.setScalar(flying?0:(e.region==='tray'?trayScale:boardScale)*(selected?1+.07*Math.sin(Math.PI*t):1));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.instanceMatrix.needsUpdate=true;}
  ambientSheen.update(groups,flights);effects.update(now);renderer.render(scene,camera);
}
renderer.setAnimationLoop(render);$('loading').hidden=true;
