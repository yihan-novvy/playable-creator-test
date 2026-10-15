import './style.css';
import {moveTiming,PREVIEW_SPEEDS} from './move-timing.js';
import {GameAudio} from './game-audio.js';
import {GameEffects} from './game-effects.js';
import {AmbientSheen} from './ambient-sheen.js';
import {GameTutorial,hintInstruction} from './game-tutorial.js';
import {GameHaptics} from './game-haptics.js';
import {guidePosition} from './guide-position.js';
import guideHand from './assets/guide-hand.png?inline';
import {trayLayout} from './tray-layout.js';
import {createReferenceTray} from './reference-tray.js';
import {actionableCell,resolveTouchTarget} from './touch-target.js';
import * as THREE from 'three';
import {patterns} from './patterns/index.js';
import {validateLevel,createPuzzle} from './game-level.js';
import {createBeadParts,BEAD_WIDTH} from './bead-reference.js';
import {lightBeadStudio} from './studio-reference.js';
import {createMosaicSockets} from './mosaic-sockets.js';

const patternId=globalThis.__COLOREVER_PATTERN_ID__??'cat';
// 引擎包不携带图案数据与装饰代码:关卡一律来自注入(广告/预览/离线样例),
// 装饰由 __COLOREVER_DECORATORS__ 按所选图案注册,dev 直连回退注册表模块。
const level=validateLevel(globalThis.__COLOREVER_LEVEL__);
const previewOptions=globalThis.__COLOREVER_PREVIEW__??null;
const previewOrigin=new URL(document.baseURI).origin;
if(!level.opening)throw new Error('Missing injected level (window.__COLOREVER_LEVEL__) with authored opening');
const resolveDecorate=id=>globalThis.__COLOREVER_DECORATORS__?.[id]?.({THREE})??patterns[id]?.decorate??(()=>{});
const pattern={decorate:resolveDecorate(patternId)};

const canvas=document.getElementById('game');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=false;
renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1.0;
const scene=new THREE.Scene();
const camera=new THREE.OrthographicCamera(-15.2,15.2,27.2,-27.2,.1,140);
camera.position.set(0,-7.5,85);camera.lookAt(0,0,0);
lightBeadStudio(renderer,scene);
const at=(x,y,z=.10)=>new THREE.Vector3((x-760)*.02,(1360-y)*.02,z);
const $=id=>document.getElementById(id);
const audio=new GameAudio();
const tutorial=new GameTutorial(),haptics=new GameHaptics();
$('guide-hand').src=guideHand;

/* —— 每关会话:buildLevel 重赋值;渲染器/相机/音频/引导等单例不重建 —— */
let session=null,puzzle=null,groups=[],cells=new Map(),target=[],capacity=48,trayCols=12,pitch=1,rowPitch=1,trayPoint=()=>new THREE.Vector3(),point=()=>new THREE.Vector3(),boardScale=1,trayScale=1,colorNames={},effects={clear(){}},ambientSheen={update(){},enabled:false};
let bodyGeometry=null,bodyMaterials={},letters={};
let busy=false,flights=[],hint=null,down=null,selectionStart=0,completion=null,completedColors=new Set(),pendingColors=[];
let wasWon=false;
let previewLastBatch=0;

/* —— CTA 时机策略(两关同构):complete=完成后跳转;steps=第 N 步跳转(N 不是上限,完成时兜底)。
   第一关策略仅注入于无片尾场景;双 playable 时第一关不武装,进第二关后换用 PHASE2.cta。 —— */
const phase2Spec=globalThis.__COLOREVER_PHASE2__??null;
let armedPolicy=phase2Spec?null:(globalThis.__COLOREVER_CTA_POLICY__??null);
let ctaAnnounced=false;
/* 双 playable:第一关手势提示全程常驻(首次归位不关闭),页内换关进第二关时恢复常规引导。 */
tutorial.persistent=!!phase2Spec;
function announceCtaMoment(){
  if(ctaAnnounced)return;
  ctaAnnounced=true;
  document.dispatchEvent(new CustomEvent('novvy:cta-moment',{bubbles:true}));
}

function disposeTree(root){
  root.traverse(node=>{
    node.geometry?.dispose();
    const material=node.material;
    for(const m of (Array.isArray(material)?material:[material])){if(!m)continue;for(const key of ['map','alphaMap','envMap'])m[key]?.dispose?.();m.dispose?.();}
  });
}

function buildLevel(level,pattern,patternId){
  clearHint();
  audio.stopEffects();
  if(session){scene.remove(session.group);disposeTree(session.group);}
  for(const f of flights)scene.remove(f.mesh);
  busy=false;flights=[];hint=null;down=null;selectionStart=0;completion=null;pendingColors=[];completedColors=new Set();wasWon=false;ctaAnnounced=false;
  const sessionGroup=new THREE.Group();scene.add(sessionGroup);
  const {width,height,capacity:cap,trayCols:tc}=level;
  const bs=Math.min(3,33/Math.max(width,height)),tray=trayLayout(cap,tc),trayRows=tray.rows;
  const ts=tray.scale;
  const reference={beads:level.target.flatMap((color,i)=>color?[{x:780+(i%width-(width-1)/2)*39.2*bs,y:1441+(Math.floor(i/width)-(height-1)/2)*39.2*bs,row:Math.floor(i/width),col:i%width,color}]:[])};
  const palette=level.colors;
  const {bodyGeometry:geo,bodyMaterials:mats}=createBeadParts(palette,{includeStudyParts:false});
  sessionGroup.add(createMosaicSockets(reference.beads,at,palette,bs));
  const codes=Object.fromEntries(Object.keys(palette).map(c=>[c,Number(c)]));
  const lettersMap=Object.fromEntries(Object.entries(codes).map(([k,v])=>[v,k]));
  const cellsMap=new Map(reference.beads.map(b=>[b.row*width+b.col,{...b,code:b.color}]));
  const tgt=level.target;
  puzzle=createPuzzle(level);
  const gList=[];
  for(const c of Object.keys(palette)){
    const mesh=new THREE.InstancedMesh(geo,mats[c],tgt.length+cap);
    mesh.frustumCulled=false;mesh.count=0;
    gList.push({mesh,entries:[],color:codes[c]});sessionGroup.add(mesh);
  }
  groups=gList;bodyGeometry=geo;bodyMaterials=mats;letters=lettersMap;
  pattern.decorate({scene:sessionGroup,at,level,boardScale:bs});
  const trayCenter=at(761,2425,-.02);
  const cacheTray=createReferenceTray(tray,trayCenter,cap);
  sessionGroup.add(cacheTray.group);
  pitch=tray.pitch;rowPitch=pitch;
  const tp=(col,row)=>new THREE.Vector3((col-(tc-1)/2)*pitch,trayCenter.y+((trayRows-1)/2-row)*rowPitch,.21);
  cells=cellsMap;target=tgt;capacity=cap;trayCols=tc;
  trayPoint=tp;boardScale=bs;trayScale=ts;
  colorNames=level.colorNames;
  const pt=(region,index)=>region==='board'?at(cellsMap.get(index).x,cellsMap.get(index).y,.10):tp(index%tc,Math.floor(index/tc));
  point=pt;
  effects=new GameEffects(sessionGroup,pt,cellsMap,bs);
  ambientSheen=new AmbientSheen(sessionGroup,tgt.length+cap,bs,ts);
  document.querySelector('.hud strong').textContent=level.name;
  document.title=level.name+' · Colorever';
  canvas.setAttribute('aria-label',level.name);
  document.querySelector('.app').dataset.decoration=level.decoration;
  document.querySelector('.app').dataset.patternId=patternId;
  document.querySelector('.app').dataset.levelName=level.name;
  session={group:sessionGroup};
  seedCompleteColors();
}

const dummy=new THREE.Object3D();
function rounded(w,h,r,x=0,y=0){const s=new THREE.Shape(),l=x-w/2,b=y-h/2;s.moveTo(l+r,b);s.lineTo(l+w-r,b);s.quadraticCurveTo(l+w,b,l+w,b+r);s.lineTo(l+w,b+h-r);s.quadraticCurveTo(l+w,b+h,l+w-r,b+h);s.lineTo(l+r,b+h);s.quadraticCurveTo(l,b+h,l,b+h-r);s.lineTo(l,b+r);s.quadraticCurveTo(l,b,l+r,b);return s;}
function seedCompleteColors(){completedColors=new Set([...new Set(target.filter(Boolean))].filter(c=>puzzle.isColorComplete(c)));}
const play=k=>{audio.play(k);haptics.play(k);};
document.addEventListener('click',e=>{if(e.target.closest?.('#downloadBtn'))haptics.trigger('light');},{capture:true});
document.addEventListener('pointerdown',e=>{if(e.target.closest('#sound'))return;audio.unlock();},{capture:true});
document.addEventListener('click',e=>{if(e.target.closest('#sound'))return;audio.unlock();},{capture:true});
function updateSound(){ $('sound').setAttribute('aria-pressed',String(audio.enabled));$('sound').setAttribute('aria-label',audio.enabled?'关闭音乐':'打开音乐');}
updateSound();
$('sheen').onclick=()=>{ambientSheen.enabled=!ambientSheen.enabled;$('sheen').setAttribute('aria-pressed',String(ambientSheen.enabled));$('sheen').setAttribute('aria-label',ambientSheen.enabled?'关闭常驻反光':'打开常驻反光');};
const markers=new THREE.Group();scene.add(markers);
// Keep the wrong-bead cue on the bead, leaving its target-colored margin clear.
const outline=rounded(BEAD_WIDTH+.012,BEAD_WIDTH+.012,.107);outline.holes.push(rounded(BEAD_WIDTH-.014,BEAD_WIDTH-.014,.094));
const outlineGeometry=new THREE.ShapeGeometry(outline),outlineMaterial=new THREE.MeshBasicMaterial({color:'#ffc526',depthTest:false,transparent:true,opacity:.9});
buildLevel(level,pattern,patternId);
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
  if(previewOptions&&window.parent!==window)window.parent.postMessage({type:'colorever-preview-state',id:previewOptions.id,moves:puzzle.moves,correct:puzzle.correct,total:puzzle.total,selected:puzzle.selection?.indices.length??0,cache:puzzle.tray.filter(Boolean).length,lastBatch:previewLastBatch,complete:puzzle.complete,busy},previewOrigin);
  if(armedPolicy&&!ctaAnnounced&&armedPolicy.mode==='steps'&&puzzle.moves>=armedPolicy.afterSteps)announceCtaMoment();
  if(!puzzle.complete)wasWon=false;
}
function projectHint(){
  if(!hint)return;
  const guide=$('guide'),container=guide.offsetParent;
  if(!container)return;
  const p=point(hint.region,hint.index).clone();p.z+=.5;
  const position=guidePosition(p,camera,canvas.getBoundingClientRect(),container.getBoundingClientRect());
  if(!position)return;
  guide.style.left=`${position.left}%`;guide.style.top=`${position.top}%`;
}
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
    previewLastBatch=moved.filter(m=>!m.shift).length;
    const timing=moveTiming(selection.region,region,previewOptions);
    flights=moved.map(m=>{const mesh=new THREE.Mesh(bodyGeometry,bodyMaterials[letters[m.color]]);scene.add(mesh);const a=point(m.fromRegion,m.from).clone();if(!m.shift)a.z+=.38;return{...m,mesh,start:now+(m.shift?0:order++*timing.stagger),duration:m.shift?timing.shiftDuration:timing.duration,a,b:point(m.toRegion,m.to),landed:false};});
    if(moved.some(m=>m.shift))play('store-move');refresh();return;}
}
  if(puzzle.pick(region,index)){selectionStart=performance.now();play('pickup');updateUI();}else if(tutorial.active){updateUI();}else{$('instruction').textContent=region==='board'&&puzzle.board[index]===target[index]?'这颗已归位，不能移动':selection?'请选择同色空格，或盒子里的空格':'点金色边框的错珠开始';}
}
$('sound').onclick=()=>{audio.setEnabled(!audio.enabled);updateSound();};
document.addEventListener('visibilitychange',()=>{if(document.hidden){audio.bgm.pause();audio.stopEffects();}else audio.unlock();});
function reset(){wasWon=false;previewLastBatch=0;for(const f of flights)scene.remove(f.mesh);flights=[];busy=false;completion=null;pendingColors=[];effects.clear();audio.stopEffects();clearHint();puzzle.reset();tutorial.reset();seedCompleteColors();$('win').hidden=true;$('celebration').hidden=true;refresh();if(puzzle.complete)afterFlights(performance.now());}
$('reset').onclick=reset;$('again').onclick=reset;$('dismiss').onclick=()=>{$('win').hidden=true;};
$('undo').onclick=()=>{if(!busy&&puzzle.undo()){clearHint();effects.clear();pendingColors=[];completion=null;seedCompleteColors();$('win').hidden=true;$('celebration').hidden=true;refresh();}};
$('hint').onclick=()=>{hint=puzzle.hint();showHint();};
$('guide').onclick=()=>{if(hint){const h=hint;activate(h.region,h.index);}};
if(previewOptions)window.addEventListener('message',event=>{
  if(event.source!==window.parent||event.origin!==previewOrigin||event.data?.type!=='colorever-preview-action')return;
  if(event.data.action==='speed'){
    if(PREVIEW_SPEEDS.includes(event.data.speed))previewOptions.speed=event.data.speed;
    return;
  }
  if(event.data.action==='reset'){reset();return;}
  if(event.data.action!=='step'||busy||puzzle.complete)return;
  let next=puzzle.hint();
  if(next?.action==='pick'){activate(next.region,next.index);next=puzzle.hint();}
  if(next&&next.action!=='pick')activate(next.region,next.index);
});
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),-.1);
function preciseHitAt(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObjects(groups.map(g=>g.mesh))[0];if(hit){const g=groups.find(g=>g.mesh===hit.object),entry=g.entries[hit.instanceId];if(entry)return{region:entry.region,index:entry.index};}
  const p=new THREE.Vector3();if(!raycaster.ray.intersectPlane(plane,p))return null;
  let closest=null,distance=Infinity;for(const [index]of cells){const q=point('board',index),d=Math.hypot(p.x-q.x,p.y-q.y);if(d<.48*boardScale&&d<distance){closest={region:'board',index};distance=d;}}
  if(closest)return closest;for(let i=0;i<capacity;i++){const q=point('tray',i);if(Math.abs(p.x-q.x)<pitch*.42&&Math.abs(p.y-q.y)<rowPitch*.42)return{region:'tray',index:i};}return null;}
function hitAt(e){
  const direct=preciseHitAt(e);
  if(direct&&actionableCell(puzzle,direct.region,direct.index))return direct;
  const r=canvas.getBoundingClientRect(),candidates=[];
  const add=(region,index)=>{const q=point(region,index).clone().project(camera);candidates.push({region,index,x:r.left+(q.x+1)*r.width/2,y:r.top+(1-q.y)*r.height/2});};
  for(const [index]of cells)add('board',index);
  for(let index=0;index<capacity;index++)add('tray',index);
  return resolveTouchTarget(puzzle,direct,candidates,e.clientX,e.clientY);
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
  if(puzzle.complete){const start=end+250;completion={start,end:effects.full(start),announced:false};busy=true;document.dispatchEvent(new CustomEvent('novvy:playable-complete',{bubbles:true}));}
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
  if(completion){if(now>=completion.start&&!completion.announced){completion.announced=true;play('success');$('instruction').textContent='拼画完成 · 全图扫光中…';}if(now>=completion.end){completion=null;busy=false;updateUI();if(armedPolicy&&!ctaAnnounced)announceCtaMoment();$('win-detail').textContent=`${puzzle.total} 颗珠子全部归位 · ${puzzle.moves} 步完成`;$('win').hidden=false;if(!wasWon){wasWon=true;document.dispatchEvent(new CustomEvent('novvy:victory',{bubbles:true}));}}}
  for(const {mesh,entries}of groups){for(let i=0;i<entries.length;i++){const e=entries[i],selected=puzzle.selection?.region===e.region&&puzzle.selection.indices.includes(e.index);const t=THREE.MathUtils.clamp((now-selectionStart)/150,0,1);e.lift=selected?.38*(1-Math.pow(1-t,3)):THREE.MathUtils.lerp(e.lift,0,.25);const flying=flights.some(f=>!f.landed&&f.toRegion===e.region&&f.to===e.index);dummy.position.copy(e.point);dummy.position.z+=e.lift;dummy.scale.setScalar(flying?0:(e.region==='tray'?trayScale:boardScale)*(selected?1+.07*Math.sin(Math.PI*t):1));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.instanceMatrix.needsUpdate=true;}
  ambientSheen.update(groups,flights,now);effects.update(now);renderer.render(scene,camera);
}
renderer.setAnimationLoop(render);$('loading').hidden=true;

/* —— 双 playable:片尾播完后立即页内换关进入第二关。一次性闩锁;
   phase2-start 在新关卡就绪后派发,outro/audio 据此收尾。 —— */
if(phase2Spec){
  const pattern2={decorate:resolveDecorate(phase2Spec.patternId)};
  const level2=validateLevel(phase2Spec.level);
  if(!level2.opening)throw new Error('Missing authored opening in phase-2 level');
  let switched=false;
  window.addEventListener('novvy:outro-finished',event=>{
    if(switched||event.detail?.reason!=='video_ended')return;
    switched=true;
    buildLevel(level2,pattern2,phase2Spec.patternId);
    armedPolicy=phase2Spec.cta??null;
    tutorial.persistent=false;
    tutorial.reset();
    refresh();
    if(puzzle.complete)afterFlights(performance.now());
    document.dispatchEvent(new CustomEvent('novvy:phase2-start',{bubbles:true,detail:{hud:phase2Spec.hud}}));
  });
}
