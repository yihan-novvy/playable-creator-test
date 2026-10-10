import * as THREE from 'three';

// An overhead key separates the four pyramid faces; soft fill preserves their color.
export function lightBeadStudio(renderer,scene,bounds={left:-23,right:23,top:31,bottom:-31}){
  const studio=new THREE.Scene();studio.background=new THREE.Color('#171717');
  // One compact upper-left softbox gives a corner highlight, with a dim fill.
  for(const[x,y,z,w,h,power]of [[-20,22,10,6,8,12],[18,-8,24,12,16,.25]]){
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(power,power,power),side:THREE.DoubleSide}));
    panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel);
  }
  const pmrem=new THREE.PMREMGenerator(renderer);const environment=pmrem.fromScene(studio,.025);
  scene.environment=environment.texture;scene.environmentIntensity=.45;pmrem.dispose();
  studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  const ambient=new THREE.HemisphereLight(0xffffff,0x9b9b9b,1.7);
  ambient.position.set(0,0,1);scene.add(ambient);
  const key=new THREE.DirectionalLight(0xffffff,2.4);key.position.set(-5,24,50);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{...bounds,near:1,far:100});
  key.shadow.bias=-.0001;key.shadow.normalBias=.015;key.shadow.radius=2.5;scene.add(key);
  const fill=new THREE.DirectionalLight(0xffffff,.28);fill.position.set(18,-9,30);scene.add(fill);
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  return{environment,key,fill};
}
