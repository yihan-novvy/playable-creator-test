import * as THREE from 'three';
import {createPyramidSurfaceGeometry,BEAD_WIDTH,BEAD_CORNER_RADIUS} from './bead-reference.js';

// The material owns broad, hue-preserving face light. This layer adds only
// small polished reflections and faint color-tinted pulses on selected beads.
export class AmbientSheen{
 constructor(scene,capacity=1154,boardScale=1,trayScale=1.3){
  this.boardScale=boardScale;this.trayScale=trayScale;this.enabled=true;this.dummy=new THREE.Object3D();
  const geometry=createPyramidSurfaceGeometry();this.strengths=new Float32Array(capacity);
  geometry.setAttribute('sheenStrength',new THREE.InstancedBufferAttribute(this.strengths,1));
  this.material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,toneMapped:false,
   uniforms:{time:{value:0},cornerRadius:{value:BEAD_CORNER_RADIUS/BEAD_WIDTH}},vertexShader:`
    attribute float sheenStrength;varying vec2 vUv;varying vec3 vTint;varying float vStrength,vSeed;
    void main(){vUv=uv;vTint=instanceColor;vStrength=sheenStrength;vSeed=fract(sin(dot(instanceMatrix[3].xy,vec2(12.9898,78.233)))*43758.5453);gl_Position=projectionMatrix*viewMatrix*modelMatrix*instanceMatrix*vec4(position,1.);}
  `,fragmentShader:`
    uniform float time,cornerRadius;varying vec2 vUv;varying vec3 vTint;varying float vStrength,vSeed;
    void main(){
      vec2 p=vUv-.5,q=abs(p)-vec2(.5-cornerRadius);
      float d=length(max(q,0.))+min(max(q.x,q.y),0.)-cornerRadius;
      float edge=exp(-pow((d+.022)/.017,2.))*smoothstep(-.08,.20,p.y-p.x);
      float upper=smoothstep(-.006,.012,p.y-abs(p.x));
      float glint=exp(-pow((p.x+.22)/.18,2.)-pow((p.y-.42)/.024,2.))*upper;
      float corner=exp(-dot(p-vec2(-.32,.38),p-vec2(-.32,.38))/.001);
      float phase=fract(time*.18+vSeed);
      float pulse=exp(-pow((phase-.5)/.07,2.))*step(.90,vSeed);
      float pinpoint=exp(-dot(p-vec2(-.16,.39),p-vec2(-.16,.39))/.0012);
      float specular=(edge*.14+glint*.28+corner*.32+pinpoint*pulse*.16)*vStrength;
      float facePulse=upper*pulse*.035;
      float alpha=clamp(specular+facePulse,0.,.28);
      vec3 tint=min(vTint*1.45,vec3(1.));
      vec3 reflection=mix(tint,vec3(1.,.985,.96),specular/max(alpha,.0001));
      gl_FragColor=vec4(reflection,alpha);
      #include <colorspace_fragment>
    }
  `});
  this.mesh=new THREE.InstancedMesh(geometry,this.material,capacity);this.mesh.frustumCulled=false;this.mesh.renderOrder=5;this.mesh.count=0;scene.add(this.mesh);
  this.mesh.setColorAt(0,new THREE.Color());
 }
 update(groups,flights,now=performance.now()){
  this.material.uniforms.time.value=now*.001;
  this.mesh.visible=this.enabled;let i=0;
  for(const group of groups)for(const e of group.entries){
   if(flights.some(f=>!f.landed&&f.toRegion===e.region&&f.to===e.index))continue;
   const scale=e.region==='tray'?this.trayScale:this.boardScale;
   this.dummy.position.copy(e.point);this.dummy.position.z+=.003*scale+e.lift;
   this.dummy.scale.setScalar(scale);this.dummy.updateMatrix();this.mesh.setMatrixAt(i,this.dummy.matrix);
   const luminance=.2126*group.mesh.material.color.r+.7152*group.mesh.material.color.g+.0722*group.mesh.material.color.b;
   this.mesh.setColorAt(i,group.mesh.material.color);
   this.strengths[i]=luminance<.05?.72:luminance>.8?.32:.65;i++;
  }
  this.mesh.count=i;this.mesh.instanceMatrix.needsUpdate=true;this.mesh.geometry.attributes.sheenStrength.needsUpdate=true;
  this.mesh.instanceColor.needsUpdate=true;
 }
}
