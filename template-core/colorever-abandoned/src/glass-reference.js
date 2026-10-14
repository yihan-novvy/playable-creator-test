import * as THREE from 'three';

export function createGlassCaps(palette){
  const curve=new THREE.CatmullRomCurve3([[0,-.002],[.30,-.002],[.356,-.001],[.358,.002],[.353,.005],[.27,.008],[0,.009]].map(([r,z])=>new THREE.Vector3(r,z,0)),false,'centripetal');
  const geometry=new THREE.LatheGeometry(curve.getPoints(24).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y)),64).rotateX(Math.PI/2);
  const materials={};
  for(const color of Object.keys(palette))materials[color]=new THREE.MeshPhysicalMaterial({color:'#ffffff',metalness:0,transmission:1,thickness:.003,ior:1.24,roughness:.022,transparent:true,opacity:.14,depthWrite:false,toneMapped:false,envMapIntensity:.18,specularIntensity:.5,attenuationColor:new THREE.Color('#ffffff'),attenuationDistance:Infinity});
  return{geometry,materials};
}
