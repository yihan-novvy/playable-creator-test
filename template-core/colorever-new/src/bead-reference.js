import * as THREE from 'three';
export const BEAD_WIDTH=.59;
export const CAP_HEIGHT=.33;
const CORNER_RADIUS=.10,EDGE_HEIGHT=.105,BASE_HEIGHT=.025,RIM_WIDTH=.015;

// Four planar triangular faces meet at a single apex. The rounded perimeter
// clips the base corners without adding a table or a second set of shoulders.
export function createPyramidSurfaceGeometry(includeBase=false){
  const h=BEAD_WIDTH/2,r=CORNER_RADIUS,perimeter=[],innerPerimeter=[];
  for(let corner=0;corner<4;corner++){
    const angle=Math.PI/2+corner*Math.PI/2;
    const cx=(corner<2?-1:1)*(h-r),cy=(corner===0||corner===3?1:-1)*(h-r);
    for(let step=0;step<=8;step++){
      const a=angle+step*Math.PI/16;
      perimeter.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);
      innerPerimeter.push([cx+(r-RIM_WIDTH)*Math.cos(a),cy+(r-RIM_WIDTH)*Math.sin(a)]);
    }
  }
  const height=(x,y)=>CAP_HEIGHT-(CAP_HEIGHT-EDGE_HEIGHT)*Math.max(Math.abs(x),Math.abs(y))/h;
  const positions=[],colors=[],uvs=[];
  function triangle(a,b,c,shade){
    positions.push(...a,...b,...c);
    for(const [x,y]of [a,b,c]){colors.push(shade,shade,shade);uvs.push(x/BEAD_WIDTH+.5,y/BEAD_WIDTH+.5);}
  }
  const apex=[0,0,CAP_HEIGHT];
  for(let i=0;i<perimeter.length;i++){
    const [ax,ay]=perimeter[i],[bx,by]=perimeter[(i+1)%perimeter.length];
    const a=[ax,ay,height(ax,ay)],b=[bx,by,height(bx,by)];
    const x=ax+bx,y=ay+by;
    const shade=Math.abs(y)>Math.abs(x)?(y>0?1.02:.88):(x<0?.98:.95);
    if(includeBase){
      const [ix,iy]=innerPerimeter[i],[jx,jy]=innerPerimeter[(i+1)%perimeter.length];
      const innerA=[ix,iy,height(ix,iy)],innerB=[jx,jy,height(jx,jy)];
      triangle(apex,innerA,innerB,shade);
      // A narrow, darker lip follows the rounded base on all four sides. It
      // belongs to the bead, so it also follows lifts and flights into the tray.
      const rimShade=Math.abs(y)>Math.abs(x)?(y>0?.78:.50):(x<0?.69:.58);
      triangle(innerA,a,b,rimShade);triangle(innerA,b,innerB,rimShade);
      const lowA=[ax,ay,BASE_HEIGHT],lowB=[bx,by,BASE_HEIGHT];
      triangle(a,lowA,lowB,.35);triangle(a,lowB,b,.35);
      triangle([0,0,BASE_HEIGHT],lowB,lowA,.35);
    }else triangle(apex,a,b,shade);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  return geometry;
}

export function createBeadParts(palette){
  const bodyGeometry=createPyramidSurfaceGeometry(true);
  const bodyMaterials=Object.fromEntries(Object.entries(palette).map(([key,color])=>[key,new THREE.MeshPhysicalMaterial({
    color,vertexColors:true,toneMapped:false,metalness:0,roughness:.46,clearcoat:.04,
    clearcoatRoughness:.4,envMapIntensity:.02,specularIntensity:.05,ior:1.46,
  })]));
  // Preserve the original renderer interface for studies and decorations.
  const capGeometry=new THREE.CircleGeometry(BEAD_WIDTH/2,4);
  const capMaterials=Object.fromEntries(Object.keys(palette).map(key=>[key,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})]));
  const glintGeometry=new THREE.BufferGeometry(),glintMaterial=new THREE.MeshBasicMaterial({visible:false});
  return {bodyGeometry,bodyMaterials,capGeometry,capMaterials,glintGeometry,glintMaterial};
}
