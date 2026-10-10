import * as THREE from 'three';
import {createPyramidSurfaceGeometry} from './bead-reference.js';

// The reflection follows the four sloping faces instead of hovering above a
// flat diamond. A soft upper-face highlight keeps the apex and ridges visible.
export class AmbientSheen{
 constructor(scene,capacity=1154,boardScale=1,trayScale=1.3){
  this.boardScale=boardScale;this.trayScale=trayScale;this.enabled=true;this.dummy=new THREE.Object3D();
  const geometry=createPyramidSurfaceGeometry();this.strengths=new Float32Array(capacity);
  geometry.setAttribute('sheenStrength',new THREE.InstancedBufferAttribute(this.strengths,1));
  this.material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,vertexShader:`
    attribute float sheenStrength;varying vec2 vUv;varying float vStrength;
    void main(){vUv=uv;vStrength=sheenStrength;gl_Position=projectionMatrix*viewMatrix*modelMatrix*instanceMatrix*vec4(position,1.);}
  `,fragmentShader:`
    varying vec2 vUv;varying float vStrength;
    void main(){vec2 p=vUv-.5;float upper=step(abs(p.x),p.y);float glint=exp(-dot(p-vec2(-.10,.19),p-vec2(-.10,.19))/.024);
    float edge=1.-smoothstep(.36,.5,max(abs(p.x),abs(p.y)));gl_FragColor=vec4(1.,.985,.96,glint*upper*edge*vStrength*.045);}
  `});
  this.mesh=new THREE.InstancedMesh(geometry,this.material,capacity);this.mesh.frustumCulled=false;this.mesh.renderOrder=5;this.mesh.count=0;scene.add(this.mesh);
 }
 update(groups,flights){
  this.mesh.visible=this.enabled;let i=0;
  for(const group of groups)for(const e of group.entries){
   if(flights.some(f=>!f.landed&&f.toRegion===e.region&&f.to===e.index))continue;
   const scale=e.region==='tray'?this.trayScale:this.boardScale;
   this.dummy.position.copy(e.point);this.dummy.position.z+=.003*scale+e.lift;
   this.dummy.scale.setScalar(scale);this.dummy.updateMatrix();this.mesh.setMatrixAt(i,this.dummy.matrix);
   const luminance=.2126*group.mesh.material.color.r+.7152*group.mesh.material.color.g+.0722*group.mesh.material.color.b;
   this.strengths[i]=luminance<.05?.82:luminance>.8?.38:.63;i++;
  }
  this.mesh.count=i;this.mesh.instanceMatrix.needsUpdate=true;this.mesh.geometry.attributes.sheenStrength.needsUpdate=true;
 }
}
