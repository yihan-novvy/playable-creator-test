import * as THREE from 'three';
import {createBeadParts as createBefore,CAP_HEIGHT as beforeHeight} from './bead.js';
import {createBeadParts as createAfter,CAP_HEIGHT as afterHeight} from './bead-reference.js';

import {createGlassCaps} from './glass-reference.js';
import {createGlassCaps as createOldGlass} from './glass-cap.js';
import {createUnderpainting} from './underpainting.js';
import {lightBeadStudio as lightBefore} from './studio.js';
import {lightBeadStudio} from './studio-reference.js';

const palette={K:'#202126',W:'#fffef5',P:'#ff9dbd'};
const colors=['K','W','P'];
const variantStages=[],allStages=[];let centerMode='glass';
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;
const ctx=shadowCanvas.getContext('2d'),shade=ctx.createRadialGradient(64,64,0,64,64,63);shade.addColorStop(0,'rgba(22,35,45,0)');shade.addColorStop(.60,'rgba(22,35,45,0)');shade.addColorStop(.76,'rgba(22,35,45,.18)');shade.addColorStop(.94,'rgba(22,35,45,.06)');shade.addColorStop(1,'rgba(22,35,45,0)');ctx.fillStyle=shade;ctx.fillRect(0,0,128,128);
const aoTexture=new THREE.CanvasTexture(shadowCanvas);
function paintedBackdrop(){
  const canvas=document.createElement('canvas');canvas.width=900;canvas.height=210;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#c1e7f5';ctx.fillRect(0,0,900,210);
  ctx.strokeStyle='#fffaf0';ctx.lineWidth=42;
  for(let x=-150;x<1000;x+=110){ctx.beginPath();ctx.moveTo(x,210);ctx.lineTo(x+100,0);ctx.stroke();}
  for(const x of [153,450,747]){
    ctx.strokeStyle='#75b78f';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,109);ctx.quadraticCurveTo(x+4,147,x-7,174);ctx.stroke();
    ctx.fillStyle='#9acda4';ctx.beginPath();ctx.ellipse(x+15,144,21,9,-.5,0,Math.PI*2);ctx.fill();
    for(let i=0;i<5;i++){const a=-Math.PI/2+i*Math.PI*2/5;ctx.fillStyle=i%2?'#ffacc6':'#ffc0d4';ctx.beginPath();ctx.ellipse(x+Math.cos(a)*24,97+Math.sin(a)*24,26,22,a,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#ffe17a';ctx.beginPath();ctx.arc(x,97,18,0,Math.PI*2);ctx.fill();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
const flowerTexture=paintedBackdrop();
function referenceBackdrop(){
  const painting=createUnderpainting(),canvas=document.createElement('canvas');canvas.width=900;canvas.height=210;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#bde6f6';ctx.fillRect(0,0,900,210);
  const ratio=1024/1270;
  for(const [target,x,y]of [[153,780,934],[450,780,1280.5],[747,487.4,1181.5]]){
    ctx.drawImage(painting.canvas,(x-135-28)*ratio,(y-806-28)*ratio,56*ratio,56*ratio,target-105,0,210,210);
  }
  painting.texture.dispose();const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
const backgroundTexture=referenceBackdrop();
function stage(id,improved,cluster=false){
  const canvas=document.getElementById(id),renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.NeutralToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.VSMShadowMap;
  const scene=new THREE.Scene();if(improved)lightBeadStudio(renderer,scene,{left:-4,right:4,top:2,bottom:-2});else lightBefore(renderer,scene,{left:-4,right:4,top:2,bottom:-2});
  const camera=new THREE.OrthographicCamera(-2.5,2.5,cluster?.444:.583,cluster?-.444:-.583,.1,100);camera.position.set(0,-1.8,20);camera.lookAt(0,0,0);
  const parts=(improved?createAfter:createBefore)(palette),height=improved?afterHeight:beforeHeight;
  const glass=improved?createGlassCaps(palette):createOldGlass(palette),caps=[];
  const illustration=new THREE.Mesh(new THREE.PlaneGeometry(5,cluster?.888:1.166),new THREE.MeshBasicMaterial({map:backgroundTexture,toneMapped:false}));illustration.position.z=-.145;scene.add(illustration);
  const shadowShape=new THREE.Shape();shadowShape.moveTo(-4,-2);shadowShape.lineTo(4,-2);shadowShape.lineTo(4,2);shadowShape.lineTo(-4,2);shadowShape.closePath();
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(8,4),new THREE.ShadowMaterial({color:'#35526a',opacity:.24}));ground.position.z=-.13;ground.receiveShadow=true;scene.add(ground);
  for(let n=0;n<3;n++){
    const color=colors[n];const layout=cluster?Array.from({length:12},(_,i)=>[(n-1)*1.65+(i%4-1.5)*.22,(1-Math.floor(i/4))*.24]):[[(n-1)*1.65,0]];
    for(const[x,y]of layout){
      const scale=cluster?.245:1;
      const window=new THREE.Path();window.absarc(x,y+(-.1+.1*scale+height*scale+.13)*(improved?.09:.025),(improved?.365:.355)*scale,0,Math.PI*2,true);shadowShape.holes.push(window);
      const ao=new THREE.Mesh(new THREE.PlaneGeometry(1.14,1.14),new THREE.MeshBasicMaterial({map:aoTexture,transparent:true,depthWrite:false}));ao.position.set(x+.018*scale,y-.025*scale,-.12);ao.scale.setScalar(scale);scene.add(ao);
      const bead=new THREE.Mesh(parts.bodyGeometry,parts.bodyMaterials[color]);bead.position.set(x,y,-.1+.1*scale);bead.scale.setScalar(scale);bead.castShadow=true;scene.add(bead);
      if(improved){const glint=new THREE.Mesh(parts.glintGeometry,parts.glintMaterial);glint.position.copy(bead.position);glint.scale.setScalar(scale);glint.renderOrder=3;scene.add(glint);}
      const cap=new THREE.Mesh(glass.geometry,glass.materials[color]);cap.position.copy(bead.position);cap.position.z+=height*scale;cap.scale.setScalar(scale);cap.renderOrder=2;scene.add(cap);caps.push({cap,color});
    }
  }
  ground.geometry.dispose();ground.geometry=new THREE.ShapeGeometry(shadowShape,32);
  const draw=()=>{const box=canvas.getBoundingClientRect();renderer.setSize(box.width,box.height,false);renderer.render(scene,camera);};
  allStages.push({draw,illustration});
  if(improved)variantStages.push({draw,caps,parts,glass});
  new ResizeObserver(draw).observe(canvas);draw();
}
stage('before',false);stage('after',true);stage('cluster',true,true);
function selectCenter(mode){
  centerMode=mode;
  for(const state of variantStages){
    for(const {cap,color}of state.caps){
      cap.geometry=mode==='glass'?state.glass.geometry:state.parts.capGeometry;
      cap.material=mode==='glass'?state.glass.materials[color]:state.parts.capMaterials[color];
    }
    state.draw();
  }
  for(const button of document.querySelectorAll('[data-center-mode]'))button.setAttribute('aria-pressed',String(button.dataset.centerMode===mode));
  document.getElementById('center-description').textContent=mode==='glass'?'薄玻璃：直接透出底图，保留少量反光。':'透明开口：直接透出底图，不叠加玻璃反光。';
}
for(const button of document.querySelectorAll('[data-center-mode]'))button.onclick=()=>selectCenter(button.dataset.centerMode);
selectCenter(centerMode);
for(const button of document.querySelectorAll('[data-background]'))button.onclick=()=>{
  const flower=button.dataset.background==='flower';
  for(const state of allStages){state.illustration.material.map=flower?flowerTexture:backgroundTexture;state.draw();}
  for(const b of document.querySelectorAll('[data-background]'))b.setAttribute('aria-pressed',String(b===button));
};
function crops(){for(const box of document.querySelectorAll('.crop')){const w=box.clientWidth,s=w/56,img=box.querySelector('img');img.style.width=`${1520*s}px`;img.style.left=`${(28-Number(box.dataset.x))*s}px`;img.style.top=`${(28-Number(box.dataset.y))*s}px`;}}
new ResizeObserver(crops).observe(document.querySelector('.samples'));crops();
