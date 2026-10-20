import * as THREE from 'three';
import {createPyramidSurfaceGeometry,CAP_HEIGHT} from './bead-reference.js';
// Sweeps follow the same rounded pyramid surface as the bead.
// 全图扫光合批:单个 InstancedMesh 承载全部扫光,每实例携带起始时刻/时长/
// 强度三个实例属性,顶点着色器按 uTime 求相位、未激活或已完成的实例直接
// 裁剪到屏外。原实现对每格 new Mesh+ShaderMaterial(33×33 图案通关瞬间
// ~1089 个 draw 与材质),现恒定 1 次 draw。
export class GameEffects{
 constructor(scene,point,cells,scale=1){this.scale=scale;this.point=point;this.cells=cells;this.effects=[];this.group=new THREE.Group();scene.add(this.group);this.geometry=createPyramidSurfaceGeometry();this.starGeometry=new THREE.BufferGeometry();const vertices=[];for(let i=0;i<8;i++){const a=i*Math.PI/4,b=(i+1)*Math.PI/4;vertices.push(0,0,0,Math.cos(a)*(i%2?.12:.36),Math.sin(a)*(i%2?.12:.36),0,Math.cos(b)*(i%2?.36:.12),Math.sin(b)*(i%2?.36:.12),0);}this.starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  this.dummy=new THREE.Object3D();
  // 容量 ×2:color() 与 full() 的错峰扫光可能在同一格短暂并存。
  this.capacity=cells.size*2;
  this.starts=new Float32Array(this.capacity).fill(1e9);
  this.durations=new Float32Array(this.capacity).fill(1);
  this.strengths=new Float32Array(this.capacity);
  this.freeSlots=[...Array(this.capacity).keys()];
  this.geometry.setAttribute('aStart',new THREE.InstancedBufferAttribute(this.starts,1));
  this.geometry.setAttribute('aDuration',new THREE.InstancedBufferAttribute(this.durations,1));
  this.geometry.setAttribute('aStrength',new THREE.InstancedBufferAttribute(this.strengths,1));
  this.material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,
   uniforms:{uTime:{value:0}},
   vertexShader:`
    attribute float aStart,aDuration,aStrength;uniform float uTime;
    varying vec2 vUv;varying float vPhase,vStrength;
    void main(){
      vUv=uv;vStrength=aStrength;
      float phase=clamp((uTime-aStart)/max(aDuration,1.),0.,1.);
      if(phase<=0.||phase>=1.){gl_Position=vec4(2.,2.,2.,1.);return;}
      vPhase=phase;
      gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);
    }`,
   fragmentShader:`
    varying vec2 vUv;varying float vPhase,vStrength;
    void main(){
      float d=vUv.x+vUv.y-mix(-.4,2.4,vPhase);
      float band=exp(-d*d/.022);
      float edge=smoothstep(0.,.05,vUv.x)*smoothstep(0.,.05,vUv.y)*smoothstep(0.,.05,1.-vUv.x)*smoothstep(0.,.05,1.-vUv.y);
      float fade=sin(vPhase*3.14159);
      gl_FragColor=vec4(1.,.97,.82,band*edge*fade*vStrength);
    }`});
  this.mesh=new THREE.InstancedMesh(this.geometry,this.material,this.capacity);
  this.mesh.frustumCulled=false;this.mesh.renderOrder=10;this.mesh.count=this.capacity;
  this.group.add(this.mesh);
 }
 sweep(index,start=performance.now(),large=false){
  if(!this.freeSlots.length)return;
  const slot=this.freeSlots.pop();
  this.dummy.position.copy(this.point('board',index));this.dummy.position.z+=.004*this.scale;this.dummy.scale.setScalar(this.scale);this.dummy.updateMatrix();
  this.mesh.setMatrixAt(slot,this.dummy.matrix);this.mesh.instanceMatrix.needsUpdate=true;
  this.starts[slot]=start;this.durations[slot]=large?760:450;this.strengths[slot]=large?.85:.6;
  this.geometry.attributes.aStart.needsUpdate=true;this.geometry.attributes.aDuration.needsUpdate=true;this.geometry.attributes.aStrength.needsUpdate=true;
  this.effects.push({slot,start,duration:large?760:450});
 }
 color(color,start){for(const [i,b]of this.cells)if(b.code===color)this.sweep(i,start,true);}
 full(start){for(const [i,b]of this.cells)this.sweep(i,start+(b.row+b.col)*60,true);return start+Math.max(...[...this.cells.values()].map(b=>b.row+b.col))*60+760;}
 spark(index,start){const material=new THREE.MeshBasicMaterial({color:'#fff2a5',transparent:true,depthWrite:false,depthTest:false});const mesh=new THREE.Mesh(this.starGeometry,material);mesh.position.copy(this.point('board',index));mesh.position.z+=(CAP_HEIGHT+.07)*this.scale;mesh.renderOrder=11;mesh.visible=false;this.group.add(mesh);this.effects.push({mesh,start,duration:520,star:true});}
 update(now){
  if(!this.effects.length)return;
  this.material.uniforms.uTime.value=now;
  this.effects=this.effects.filter(e=>{
   if(e.star){
    const t=(now-e.start)/e.duration;
    if(t>=1){this.group.remove(e.mesh);e.mesh.material.dispose();return false;}
    e.mesh.visible=t>=0;
    if(t>=0){e.mesh.scale.setScalar(Math.sin(t*Math.PI)*1.25);e.mesh.rotation.z=t*.7;e.mesh.material.opacity=1-t;}
    return true;
   }
   if(now>=e.start+e.duration){this.starts[e.slot]=1e9;this.geometry.attributes.aStart.needsUpdate=true;this.freeSlots.push(e.slot);return false;}
   return true;
  });
 }
 clear(){
  for(const e of this.effects)if(e.star){this.group.remove(e.mesh);e.mesh.material.dispose();}
  this.effects=[];
  this.starts.fill(1e9);this.geometry.attributes.aStart.needsUpdate=true;
  this.freeSlots=[...Array(this.capacity).keys()];
 }
}
