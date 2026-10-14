import * as THREE from 'three';

const PITCH=.84;
const clamp=THREE.MathUtils.clamp;

function contains(polygon,x,y){
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}

function boundaryDistance(polygon,x,y){
  let best=Infinity;
  for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length],dx=b.x-a.x,dy=b.y-a.y;
    const t=clamp(((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);
    best=Math.min(best,Math.hypot(x-a.x-t*dx,y-a.y-t*dy));
  }
  return best;
}

function headContour(){
  const s=new THREE.Shape();
  s.moveTo(0,10.75);
  s.bezierCurveTo(-1.7,10.75,-3.2,10.8,-4.0,10.65);
  s.bezierCurveTo(-5.0,11.9,-6.55,14.0,-7.25,13.35);
  s.bezierCurveTo(-7.75,12.8,-7.35,10.1,-7.1,8.3);
  s.bezierCurveTo(-8.9,7.3,-9.15,5.35,-8.45,3.65);
  s.bezierCurveTo(-7.7,1.25,-4.0,.75,0,.75);
  s.bezierCurveTo(4.0,.75,7.7,1.25,8.45,3.65);
  s.bezierCurveTo(9.15,5.35,8.9,7.3,7.1,8.3);
  s.bezierCurveTo(7.35,10.1,7.75,12.8,7.25,13.35);
  s.bezierCurveTo(6.55,14.0,5.0,11.9,4.0,10.65);
  s.bezierCurveTo(3.2,10.8,1.7,10.75,0,10.75);
  return s;
}

function bodyContour(){
  const s=new THREE.Shape();s.moveTo(-4.4,1.65);
  s.bezierCurveTo(-5.45,.95,-6.25,-.6,-6.1,-2.55);
  s.bezierCurveTo(-7.05,-3.0,-7.2,-5.4,-5.55,-5.65);
  s.bezierCurveTo(-3.5,-6.0,-1.5,-5.4,0,-5.3);
  s.bezierCurveTo(1.5,-5.4,3.5,-6.0,5.55,-5.65);
  s.bezierCurveTo(7.2,-5.4,7.05,-3.0,6.1,-2.55);
  s.bezierCurveTo(6.25,-.6,5.45,.95,4.4,1.65);
  s.bezierCurveTo(2.9,2.3,-2.9,2.3,-4.4,1.65);return s;
}

function earContour(side){
  const s=new THREE.Shape();s.moveTo(side*5.92,11.85);
  s.bezierCurveTo(side*6.32,11.9,side*6.34,9.25,side*6.18,8.72);
  s.bezierCurveTo(side*5.78,8.25,side*4.24,8.3,side*3.78,8.60);
  s.bezierCurveTo(side*4.32,9.75,side*5.57,11.84,side*5.92,11.85);return s;
}

// The color matrix and the sculpted silhouette share the same curves.
export function sampleKittyPattern(width=29){
  const head=headContour().getPoints(100),body=bodyContour().getPoints(80),ears=[earContour(-1).getPoints(45),earContour(1).getPoints(45)];
  return Array.from({length:width*width},(_,i)=>{
    const col=i%width,row=Math.floor(i/width),x=(col-14)*PITCH,y=(14-row)*PITCH+5;
    if((col-14)**2+(row-14)**2>13.8**2)return 0;
    let c=1;if(contains(head,x,y)||contains(body,x,y))c=2;
    if(ears.some(p=>contains(p,x,y)))c=3;
    if([ -1,1 ].some(side=>((x-side*5.04)/1.33)**2+((y-4.18)/1.13)**2<=1))c=5;
    if((col===10||col===18)&&row>=12&&row<=13)c=6;
    if(col===14&&row===14)c=7;
    if(row>=19&&row<=21&&((col>=10&&col<=12)||(col>=16&&col<=18)))c=4;
    if(row===20&&col>=13&&col<=15)c=4;
    return c;
  });
}

export function createKittySculpture({target,width}){
  const group=new THREE.Group();group.name='Sculpted kitten';
  const milk=new THREE.MeshPhysicalMaterial({color:'#fffdf5',roughness:.60,clearcoat:.20,clearcoatRoughness:.40,envMapIntensity:.10});
  const outline=new THREE.MeshStandardMaterial({color:'#b9c6ce',roughness:.64});
  const pink=new THREE.MeshPhysicalMaterial({color:'#ff9ab8',roughness:.32,clearcoat:.65,envMapIntensity:.30});
  const yellow=new THREE.MeshPhysicalMaterial({color:'#ffe236',roughness:.29,clearcoat:.75,clearcoatRoughness:.20,envMapIntensity:.35});
  const head=headContour(),body=bodyContour(),headPoly=head.getPoints(100),bodyPoly=body.getPoints(80);
  const rawPoint=i=>({x:(i%width-14)*PITCH,y:(14-Math.floor(i/width))*PITCH+5});
  const headDome=(x,y)=>1.30*Math.max(0,1-(x/9.5)**2-((y-6.2)/8.4)**2);
  const bodyDome=(x,y)=>.85*Math.max(0,1-(x/7.3)**2-((y+1.8)/4.7)**2);
  const surface=new Float32Array(target.length),part=new Uint8Array(target.length),smooth=new Uint8Array(target.length);
  for(let i=0;i<target.length;i++){
    const {x,y}=rawPoint(i);
    if(contains(headPoly,x,y)){part[i]=1;surface[i]=.095+headDome(x,y);}
    else if(contains(bodyPoly,x,y)){part[i]=2;surface[i]=.065+bodyDome(x,y);}
    if(part[i]&&target[i]===2&&boundaryDistance(part[i]===1?headPoly:bodyPoly,x,y)>.67)smooth[i]=1;
  }

  const shells=[];
  // One regular surface avoids overlapping bevels where neighboring bead holes meet.
  function perforated(shape,polygon,material,z,bulge,centerY){
    function makeGeometry(board,blocked){
      const holes=[];
      for(let i=0;i<target.length;i++){
        if(!target[i])continue;const {x,y}=rawPoint(i);
        if(!contains(polygon,x,y)||boundaryDistance(polygon,x,y)<.49)continue;
        if(material===milk&&smooth[i]&&board[i]===target[i]&&!blocked.has(i))continue;
        holes.push({x,y});
      }
      const step=.16,minX=Math.min(...polygon.map(p=>p.x)),maxX=Math.max(...polygon.map(p=>p.x));
      const minY=Math.min(...polygon.map(p=>p.y)),maxY=Math.max(...polygon.map(p=>p.y));
      const nx=Math.ceil((maxX-minX)/step),ny=Math.ceil((maxY-minY)/step),positions=[],normals=[],indices=[];
      for(let row=0;row<=ny;row++)for(let col=0;col<=nx;col++){
        const x=minX+col*step,y=minY+row*step;
        positions.push(x,y,.16+bulge(x,y));
        const dx=(bulge(x+.001,y)-bulge(x-.001,y))/.002,dy=(bulge(x,y+.001)-bulge(x,y-.001))/.002;
        const length=Math.hypot(dx,dy,1);normals.push(-dx/length,-dy/length,1/length);
      }
      function addTriangle(a,b,c){
        const x=(positions[a*3]+positions[b*3]+positions[c*3])/3,y=(positions[a*3+1]+positions[b*3+1]+positions[c*3+1])/3;
        if(contains(polygon,x,y)&&!holes.some(h=>(h.x-x)**2+(h.y-y)**2<.355**2))indices.push(a,b,c);
      }
      for(let row=0;row<ny;row++)for(let col=0;col<nx;col++){
        const a=row*(nx+1)+col,b=a+1,c=a+nx+1,d=c+1;addTriangle(a,b,c);addTriangle(b,d,c);
      }
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setIndex(indices);geometry.computeBoundingSphere();return geometry;
    }
    const mesh=new THREE.Mesh(makeGeometry(target,new Set()),material);mesh.position.z=z;mesh.castShadow=material!==milk;mesh.receiveShadow=true;group.add(mesh);
    if(material===milk)shells.push({mesh,makeGeometry});
    if(material===milk){
      const edgeGeo=new THREE.ExtrudeGeometry(shape,{depth:.11,bevelEnabled:true,bevelSize:.16,bevelThickness:.09,bevelSegments:4,curveSegments:18});
      edgeGeo.translate(0,-centerY,0);
      const edge=new THREE.Mesh(edgeGeo,outline);edge.scale.set(1.022,1.022,1);edge.position.set(0,centerY,z-.12);edge.castShadow=true;group.add(edge);
    }
    return mesh;
  }
  perforated(body,bodyPoly,milk,.00,bodyDome,-1.8).name='Continuous body surface';
  perforated(head,headPoly,milk,.03,headDome,6.2).name='Continuous head surface';
  for(const side of [-1,1]){
    const ear=earContour(side),poly=ear.getPoints(45);
    perforated(ear,poly,pink,.10,headDome,6.2);
  }

  const decorationRegions=[];
  function puff(name,x,y,z,sx,sy,sz,material){
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,36,24),material);
    mesh.name=name;mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
    const cells=[];
    for(let i=0;i<target.length;i++)if(target[i]){const p=rawPoint(i);if(((p.x-x)/sx)**2+((p.y-y)/sy)**2<=.92)cells.push(i);}
    decorationRegions.push({mesh,cells});return mesh;
  }
  for(const side of [-1,1]){
    const cheek=puff('Rounded yellow cheek',side*5.04,4.18,.26+headDome(side*5.04,4.18),1.33,1.13,.36,yellow);
    puff('Soft muzzle',side*.58,4.55,.23+headDome(side*.58,4.55),.95,.64,.20,milk);
    puff('Sculpted paw',side*4.22,-4.0,.18+bodyDome(side*4.22,-4),1.66,1.13,.36,milk);
    const glint=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),new THREE.MeshBasicMaterial({color:'#fff8b4'}));
    glint.position.set(side*5.04-.36,4.55,cheek.position.z+.35);group.add(glint);decorationRegions.push({mesh:glint,cells:decorationRegions.find(r=>r.mesh===cheek).cells});
  }
  let lastSurfaceKey='';
  return{
    group,
    smoothAt:i=>smooth[i],
    headHeight:(x,y)=>.19+headDome(x,y),
    bodyHeight:(x,y)=>.16+bodyDome(x,y),
    partAt:i=>part[i],
    surfaceHeight:i=>surface[i],
    update(board,blocked=new Set()){
      const key=board.map((c,i)=>smooth[i]&&(c!==target[i]||blocked.has(i))?i:'').join(',');
      if(key!==lastSurfaceKey){
        lastSurfaceKey=key;
        for(const {mesh,makeGeometry}of shells){const previous=mesh.geometry;mesh.geometry=makeGeometry(board,blocked);previous.dispose();}
      }
      for(const {mesh,cells}of decorationRegions)mesh.visible=cells.every(i=>board[i]===target[i]&&!blocked.has(i));
    },
  };
}
