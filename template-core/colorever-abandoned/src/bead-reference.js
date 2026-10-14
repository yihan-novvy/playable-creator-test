import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export const CAP_HEIGHT=.315;

// Solid square mosaic cells. Color belongs to each cell, not a backing image.
export function createBeadParts(palette){
  // Broad planar face; a narrow rolled bevel carries the highlight.
  const bodyGeometry=new RoundedBoxGeometry(.736,.736,.23,8,.070);
  bodyGeometry.translate(0,0,.085);
  const bodyMaterials={};
  for(const [key,color] of Object.entries(palette)){
    const rgb=new THREE.Color(color);const luminance=.2126*rgb.r+.7152*rgb.g+.0722*rgb.b;const black=luminance<.05,white=luminance>.8;
    bodyMaterials[key]=new THREE.MeshPhysicalMaterial({
      color,metalness:0,roughness:black?.18:white?.28:.25,
      clearcoat:black?.65:.40,clearcoatRoughness:black?.16:.22,
      envMapIntensity:black?1.0:.70,specularIntensity:.85,ior:1.48,
    });
  }
  const capGeometry=new THREE.CircleGeometry(.35,32);
  const capMaterials=Object.fromEntries(Object.keys(palette).map(key=>[key,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})]));
  const glintGeometry=new THREE.BufferGeometry(),glintMaterial=new THREE.MeshBasicMaterial({visible:false});
  return {bodyGeometry,bodyMaterials,capGeometry,capMaterials,glintGeometry,glintMaterial};
}
