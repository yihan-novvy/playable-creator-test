import * as THREE from 'three';

// One broad softbox for the upper-left lip; a subdued fill keeps the opposite edge soft.
export function lightBeadStudio(renderer,scene,bounds={left:-23,right:23,top:31,bottom:-31}){
  const studio=new THREE.Scene();studio.background=new THREE.Color('#626363');
  for(const[x,y,z,w,h,power]of [[-9,13,28,19,24,4],[16,6,24,12,18,.35]]){
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(power,power,power),side:THREE.DoubleSide}));
    panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel);
  }
  const pmrem=new THREE.PMREMGenerator(renderer);const environment=pmrem.fromScene(studio,.025);
  scene.environment=environment.texture;scene.environmentIntensity=.75;pmrem.dispose();
  studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  const ambient=new THREE.HemisphereLight(0xfffdf7,0x8ca4b0,1.3);
  ambient.position.set(0,0,1);scene.add(ambient);
  const key=new THREE.DirectionalLight(0xfffdf8,1.8);key.position.set(-14,20,45);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{...bounds,near:1,far:100});
  key.shadow.bias=-.0001;key.shadow.normalBias=.015;key.shadow.radius=6;key.shadow.blurSamples=8;scene.add(key);
  const fill=new THREE.DirectionalLight(0xe5f3ff,.35);fill.position.set(18,-9,30);scene.add(fill);
  renderer.shadowMap.type=THREE.VSMShadowMap;
  return{environment,key,fill};
}
