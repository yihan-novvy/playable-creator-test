import * as THREE from 'three';

export const CAP_HEIGHT=.266;

function smoothLathe(profile,steps=36){
  const curve=new THREE.CatmullRomCurve3(profile.map(([r,z])=>new THREE.Vector3(r,z,0)),false,'centripetal');
  const points=curve.getPoints(steps).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y));
  return new THREE.LatheGeometry(points,48).rotateX(Math.PI/2);
}

// The colored barrel rolls smoothly over the lip into a shallow central window.
export function createBeadParts(palette){
  const bodyGeometry=smoothLathe([
    [.285,-.075],[.365,-.075],[.412,-.045],[.433,.015],
    [.434,.174],[.421,.245],[.395,.281],[.357,.295],
    [.326,.289],[.300,.280],[.283,.253],[.281,.09],
    [.281,-.035],[.285,-.075],
  ]);
  const capGeometry=smoothLathe([
    [0,-.006],[.24,-.006],[.300,-.004],[.308,0],
    [.302,.010],[.24,.016],[0,.016],
  ],24);
  const bodyMaterials={},capMaterials={};
  const capTints={K:'#26272d',W:'#fffdf4',P:'#ffa5c1',Y:'#ffdf35',S:'#f8d2bd',B:'#13aaf4'};
  for(const [color,value]of Object.entries(palette)){
    bodyMaterials[color]=new THREE.MeshPhysicalMaterial({
      color:value,metalness:0,roughness:.23,clearcoat:1,clearcoatRoughness:.11,
      envMapIntensity:.65,specularIntensity:.8,
    });
    // Diffuse-only cap: tinted translucency, with no specular, clearcoat or environment reflection.
    // Its shallow surface sits below the rounded lip, so all gloss belongs to the ring.
    capMaterials[color]=new THREE.MeshLambertMaterial({
      color:capTints[color],transparent:true,
      opacity:color==='K'?.66:.62,depthWrite:false,
    });
  }
  return{bodyGeometry,capGeometry,bodyMaterials,capMaterials};
}
