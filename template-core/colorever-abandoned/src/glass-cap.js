import * as THREE from 'three';

// A thin clear coating. Most of the background remains directly visible;
// a small physical reflection contribution supplies the glass sheen.
export function createGlassCaps(palette){
  const curve=new THREE.CatmullRomCurve3([
    [0,-.012],[.27,-.012],[.33,-.009],[.337,0],
    [.332,.008],[.26,.018],[.14,.026],[0,.029],
  ].map(([r,z])=>new THREE.Vector3(r,z,0)),false,'centripetal');
  const geometry=new THREE.LatheGeometry(curve.getPoints(32).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y)),48).rotateX(Math.PI/2);
  const materials={};
  for(const color of Object.keys(palette)){
    materials[color]=new THREE.MeshPhysicalMaterial({
      color:'#ffffff',metalness:0,roughness:.025,
      transmission:1,thickness:.008,ior:1.30,
      envMapIntensity:.20,specularIntensity:.55,
      transparent:true,opacity:.22,depthWrite:false,toneMapped:false,
      attenuationColor:new THREE.Color('#ffffff'),attenuationDistance:Infinity,
    });
  }
  return{geometry,materials};
}
