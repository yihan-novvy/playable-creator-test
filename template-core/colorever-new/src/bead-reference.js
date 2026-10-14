import * as THREE from 'three';
export const BEAD_WIDTH=.64;
export const BEAD_CORNER_RADIUS=.10;
export const CAP_HEIGHT=.255;
const CORNER_RADIUS=BEAD_CORNER_RADIUS,BEVEL_WIDTH=.045,EDGE_HEIGHT=.105,CROWN_EDGE_HEIGHT=.155,BASE_HEIGHT=.025;

// A shallow faceted crown and a three-step rounded bevel give the bead a soft
// toy silhouette. The four crown faces retain one continuous central apex.
export function createPyramidSurfaceGeometry(includeBase=false){
  const h=BEAD_WIDTH/2,r=CORNER_RADIUS,perimeter=[],innerPerimeter=[];
  for(let corner=0;corner<4;corner++){
    const angle=Math.PI/2+corner*Math.PI/2;
    const cx=(corner<2?-1:1)*(h-r),cy=(corner===0||corner===3?1:-1)*(h-r);
    for(let step=0;step<=4;step++){
      const a=angle+step*Math.PI/8;
      perimeter.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);
      innerPerimeter.push([cx+(r-BEVEL_WIDTH)*Math.cos(a),cy+(r-BEVEL_WIDTH)*Math.sin(a)]);
    }
  }
  const height=(x,y)=>CAP_HEIGHT-(CAP_HEIGHT-CROWN_EDGE_HEIGHT)*Math.max(Math.abs(x),Math.abs(y))/(h-BEVEL_WIDTH);
  const positions=[],colors=[],uvs=[];
  function triangle(a,b,c,shade){
    positions.push(...a,...b,...c);
    for(const [x,y]of [a,b,c]){colors.push(shade,shade,shade);uvs.push(x/BEAD_WIDTH+.5,y/BEAD_WIDTH+.5);}
  }
  const apex=[0,0,CAP_HEIGHT];
  for(let i=0;i<perimeter.length;i++){
    const [ax,ay]=perimeter[i],[bx,by]=perimeter[(i+1)%perimeter.length];
    const [ix,iy]=innerPerimeter[i],[jx,jy]=innerPerimeter[(i+1)%perimeter.length];
    const a=[ix,iy,height(ix,iy)],b=[jx,jy,height(jx,jy)];
    const edgeA=[ax,ay,EDGE_HEIGHT],edgeB=[bx,by,EDGE_HEIGHT];
    const x=ax+bx,y=ay+by;
    const shade=Math.abs(y)>Math.abs(x)?(y>0?1.065:.94):(x<0?1.01:.98);
    triangle(apex,a,b,shade);
    let previousA=a,previousB=b;
    for(let step=1;step<=3;step++){
      const t=step/3,spread=Math.sin(t*Math.PI/2),drop=1-Math.cos(t*Math.PI/2);
      const nextA=[ix+(ax-ix)*spread,iy+(ay-iy)*spread,a[2]+(EDGE_HEIGHT-a[2])*drop];
      const nextB=[jx+(bx-jx)*spread,jy+(by-jy)*spread,b[2]+(EDGE_HEIGHT-b[2])*drop];
      const bevelShade=Math.abs(y)>Math.abs(x)?(y>0?1.04-.14*drop:.91-.14*drop):(x<0?1.01-.13*drop:.97-.14*drop);
      triangle(previousA,nextA,nextB,bevelShade);triangle(previousA,nextB,previousB,bevelShade);
      previousA=nextA;previousB=nextB;
    }
    if(includeBase){
      const lowA=[ax,ay,BASE_HEIGHT],lowB=[bx,by,BASE_HEIGHT];
      const sideShade=Math.abs(y)>Math.abs(x)?(y>0?.82:.73):(x<0?.80:.75);
      triangle(edgeA,lowA,lowB,sideShade);triangle(edgeA,lowB,edgeB,sideShade);
      triangle([0,0,BASE_HEIGHT],lowB,lowA,.50);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  return geometry;
}

export function createBeadParts(palette,{includeStudyParts=true}={}){
  const bodyGeometry=createPyramidSurfaceGeometry(true);
  // Perceptual color shading preserves the authored hue on brighter facets.
  // White reflections are confined to small accents in the shared sheen layer.
  const bodyMaterials=Object.fromEntries(Object.entries(palette).map(([key,hex])=>{
    const color=new THREE.Color(hex);
    const material=new THREE.ShaderMaterial({vertexColors:true,toneMapped:false,
      uniforms:{baseColor:{value:color}},
      vertexShader:`varying vec2 vUv;varying float vShade;
        void main(){vUv=uv;vShade=color.r;vec4 p=vec4(position,1.);
          #ifdef USE_INSTANCING
            p=instanceMatrix*p;
          #endif
          gl_Position=projectionMatrix*modelViewMatrix*p;
        }`,
      fragmentShader:`uniform vec3 baseColor;varying vec2 vUv;varying float vShade;
        vec3 rgbToHsv(vec3 c){
          vec4 k=vec4(0.,-1./3.,2./3.,-1.);
          vec4 p=mix(vec4(c.bg,k.wz),vec4(c.gb,k.xy),step(c.b,c.g));
          vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));
          float d=q.x-min(q.w,q.y),e=1.e-8;
          return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x);
        }
        vec3 hsvToRgb(vec3 c){
          vec3 p=abs(fract(c.xxx+vec3(0.,2./3.,1./3.))*6.-3.);
          return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y);
        }
        vec3 toSrgb(vec3 c){return mix(c*12.92,1.055*pow(max(c,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),c));}
        vec3 toLinear(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
        void main(){
          vec3 hsv=rgbToHsv(toSrgb(baseColor));
          hsv.y=min(1.,hsv.y+.045*smoothstep(.20,.55,hsv.y));
          float upper=smoothstep(-.018,.026,vUv.y-.5-abs(vUv.x-.5));
          hsv.y*=1.-.16*upper;
          float softLight=.99+.025*vUv.y-.012*vUv.x;
          float upperLift=.08+.12*(1.-smoothstep(.30,.65,hsv.z));
          hsv.z=clamp(max(hsv.z,.035)*(vShade*softLight+upperLift*upper),0.,1.);
          gl_FragColor=vec4(toLinear(hsvToRgb(hsv)),1.);
          #include <colorspace_fragment>
        }`,
    });
    material.color=color;
    return [key,material];
  }));
  if(!includeStudyParts)return {bodyGeometry,bodyMaterials};
  // Preserve the original renderer interface for studies and decorations.
  const capGeometry=new THREE.CircleGeometry(BEAD_WIDTH/2,4);
  const capMaterials=Object.fromEntries(Object.keys(palette).map(key=>[key,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})]));
  const glintGeometry=new THREE.BufferGeometry(),glintMaterial=new THREE.MeshBasicMaterial({visible:false});
  return {bodyGeometry,bodyMaterials,capGeometry,capMaterials,glintGeometry,glintMaterial};
}
