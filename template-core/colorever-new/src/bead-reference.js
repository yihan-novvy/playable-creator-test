import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const BEAD_WIDTH=.646;
export const CAP_HEIGHT=.34;

// A raised diamond table and four sloping shoulders share one instanced mesh.
// Neutral vertex shading makes the facets readable even at phone resolution.
function facetedGeometry(){
  const body=new RoundedBoxGeometry(BEAD_WIDTH,BEAD_WIDTH,.19,4,.036);
  body.deleteAttribute('uv');
  body.translate(0,0,.11);
  const bodyColors=new Float32Array(body.attributes.position.count*3).fill(.83);
  body.setAttribute('color',new THREE.BufferAttribute(bodyColors,3));
  const h=BEAD_WIDTH/2,r=.276,cut=.035;
  const perimeter=[[0,h],[-h+cut,h],[-h,h-cut],[-h,0],[-h,-h+cut],[-h+cut,-h],[0,-h],[h-cut,-h],[h,-h+cut],[h,0],[h,h-cut],[h-cut,h]];
  const diamond=[[0,r,CAP_HEIGHT],[-r,0,CAP_HEIGHT],[0,-r,CAP_HEIGHT],[r,0,CAP_HEIGHT]];
  const positions=[],colors=[];
  function triangle(a,b,c,shade){
    positions.push(...a,...b,...c);
    for(let i=0;i<3;i++)colors.push(shade,shade,shade);
  }
  triangle(diamond[0],diamond[1],diamond[2],1);
  triangle(diamond[0],diamond[2],diamond[3],1);
  const shoulders=[1.04,.86,.66,.88]; // upper left → lower left → lower right → upper right
  for(let quadrant=0;quadrant<4;quadrant++){
    const outer=Array.from({length:4},(_,i)=>{
      const [x,y]=perimeter[(quadrant*3+i)%12];
      return [x,y,CAP_HEIGHT-.30*(Math.abs(x)+Math.abs(y)-r)];
    });
    const polygon=[diamond[quadrant],...outer,diamond[(quadrant+1)%4]];
    for(let i=1;i<polygon.length-1;i++)triangle(polygon[0],polygon[i],polygon[i+1],shoulders[quadrant]);
    for(let i=0;i<3;i++){
      const a=outer[i],b=outer[i+1],lowA=[a[0],a[1],.19],lowB=[b[0],b[1],.19];
      triangle(a,lowA,lowB,.72);triangle(a,lowB,b,.72);
    }
  }
  const crown=new THREE.BufferGeometry();
  crown.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  crown.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  crown.computeVertexNormals();
  const geometry=mergeGeometries([body,crown]);
  body.dispose();crown.dispose();
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  return geometry;
}

export function createBeadParts(palette){
  const bodyGeometry=facetedGeometry();
  const bodyMaterials=Object.fromEntries(Object.entries(palette).map(([key,color])=>[key,new THREE.MeshPhysicalMaterial({
    color,vertexColors:true,metalness:0,roughness:.46,clearcoat:.04,
    clearcoatRoughness:.4,envMapIntensity:.06,specularIntensity:.25,ior:1.46,
  })]));
  // Preserve the original renderer interface for studies and decorations.
  const capGeometry=new THREE.CircleGeometry(.276,4);
  const capMaterials=Object.fromEntries(Object.keys(palette).map(key=>[key,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})]));
  const glintGeometry=new THREE.BufferGeometry(),glintMaterial=new THREE.MeshBasicMaterial({visible:false});
  return {bodyGeometry,bodyMaterials,capGeometry,capMaterials,glintGeometry,glintMaterial};
}
