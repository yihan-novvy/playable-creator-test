import * as THREE from 'three';

export const CAP_HEIGHT=.320;
function smoothLathe(profile,steps=36){
  const curve=new THREE.CatmullRomCurve3(profile.map(([r,z])=>new THREE.Vector3(r,z,0)),false,'centripetal');
  const points=curve.getPoints(steps).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y));
  return new THREE.LatheGeometry(points,48).rotateX(Math.PI/2);
}

export function createBeadParts(palette){
  // A thick barrel, broad rounded shoulder and recessed inner wall.
  const bodyGeometry=smoothLathe([
    [.298,-.10],[.363,-.10],[.408,-.077],[.433,-.028],
    [.437,.09],[.437,.242],[.427,.303],[.405,.334],
    [.370,.347],[.347,.344],[.336,.330],[.328,.304],
    [.324,.250],[.324,.07],[.324,-.065],[.298,-.10],
  ]);
  // A nearly flat, non-reflective membrane below the highest point of the lip.
  const capGeometry=smoothLathe([
    [0,-.006],[.27,-.006],[.329,-.005],[.337,0],
    [.333,.010],[.27,.014],[0,.014],
  ],24);
  // Charcoal beads need a lighter lip while their vertical barrel stays dark.
  const position=bodyGeometry.getAttribute('position');
  const shading=new Float32Array(position.count*3);
  for(let i=0;i<position.count;i++){
    const t=THREE.MathUtils.smoothstep(position.getZ(i),.17,.30),v=.25+.75*t;
    shading.set([v,v,v],i*3);
  }
  bodyGeometry.setAttribute('color',new THREE.BufferAttribute(shading,3));
  const bodyMaterials={},capMaterials={};
  const capTints={K:'#2f2e36',W:'#fffdf7',P:'#ffb1cc',Y:'#ffe456',S:'#f6d3c1',B:'#36b5f5'};
  for(const [color,value]of Object.entries(palette)){
    bodyMaterials[color]=new THREE.MeshPhysicalMaterial({
      color:color==='K'?'#5d5e69':value,metalness:0,roughness:.37,
      clearcoat:1,clearcoatRoughness:.22,envMapIntensity:.65,
      specularIntensity:.6,ior:1.46,vertexColors:color==='K',
    });
    capMaterials[color]=new THREE.MeshBasicMaterial({
      color:capTints[color],transparent:true,opacity:color==='K'?.74:.68,
      depthWrite:false,toneMapped:false,
    });
  }
  return{bodyGeometry,capGeometry,bodyMaterials,capMaterials};
}
