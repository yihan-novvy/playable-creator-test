import * as THREE from 'three';

// One square recess per bead, with the same pitch and silhouette as the mosaic.
export const SOCKET_PITCH=.784;
export const SOCKET_OPENING=.676;
const SOCKET_RADIUS=.158;
function roundedPath(size,radius){
  const p=new THREE.Path(),h=size/2,r=radius;
  p.moveTo(-h+r,-h);p.lineTo(h-r,-h);p.absarc(h-r,-h+r,r,-Math.PI/2,0,false);
  p.lineTo(h,h-r);p.absarc(h-r,h-r,r,0,Math.PI/2,false);
  p.lineTo(-h+r,h);p.absarc(-h+r,h-r,r,Math.PI/2,Math.PI,false);
  p.lineTo(-h,-h+r);p.absarc(-h+r,-h+r,r,Math.PI,Math.PI*1.5,false);p.closePath();return p;
}

// A continuous rounded inner wall uses the pocket's own color. Soft shading
// gives depth without introducing a white highlight or a dark graphic stroke.
export function createRecessShading(width,radius,count){
  const material=new THREE.ShaderMaterial({toneMapped:false,
    uniforms:{cornerRadius:{value:radius/width}},
    vertexShader:`varying vec2 vUv;varying vec3 vColor;void main(){vUv=uv;vColor=instanceColor;gl_Position=projectionMatrix*viewMatrix*modelMatrix*instanceMatrix*vec4(position,1.);}`,
    fragmentShader:`
      varying vec2 vUv;varying vec3 vColor;uniform float cornerRadius;
      void main(){
        vec2 p=vUv-.5,q=abs(p)-vec2(.5-cornerRadius);
        float distanceToEdge=length(max(q,0.))+min(max(q.x,q.y),0.)-cornerRadius;
        if(distanceToEdge>0.)discard;
        float inset=-distanceToEdge;
        float wall=exp(-pow((inset-.035)/.085,2.));
        vec2 edgeNormal=max(q,0.);
        if(length(edgeNormal)<.00001)edgeNormal=abs(p.y)>abs(p.x)?vec2(0.,sign(p.y)):vec2(sign(p.x),0.);
        else edgeNormal=normalize(edgeNormal)*sign(p);
        float upperLeft=clamp(.5+.5*(edgeNormal.y-edgeNormal.x),0.,1.);
        float shade=.88-wall*(.06+.30*upperLeft);
        vec3 color=vColor*shade;
        // A broad, colored reflection on the lower wall rounds off the well.
        color=mix(color,mix(vColor,vec3(1.),.055),wall*(1.-upperLeft)*.40);
        gl_FragColor=vec4(color,1.);
        #include <colorspace_fragment>
      }`,
  });
  const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(width,width),material,count);
  const color=new THREE.Color('#d4b296');for(let i=0;i<count;i++)mesh.setColorAt(i,color);
  mesh.name='Same-color rounded recess';mesh.frustumCulled=false;
  return mesh;
}

function coloredPlateMaterial(){
  return new THREE.ShaderMaterial({toneMapped:false,
    uniforms:{openingHalf:{value:SOCKET_OPENING/2},cornerRadius:{value:SOCKET_RADIUS}},
    vertexShader:`varying vec3 vColor;varying vec2 vLocal;varying float vShade;void main(){vColor=instanceColor;vLocal=position.xy;vShade=normal.z>.5?1.:.80;gl_Position=projectionMatrix*viewMatrix*modelMatrix*instanceMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 vColor;varying vec2 vLocal;varying float vShade;uniform float openingHalf;uniform float cornerRadius;void main(){
      vec2 q=abs(vLocal)-vec2(openingHalf-cornerRadius);
      float d=length(max(q,0.))+min(max(q.x,q.y),0.)-cornerRadius;
      float lip=exp(-pow((d-.014)/.023,2.));
      gl_FragColor=vec4(mix(vColor,vec3(1.),.025+.050*lip)*vShade,1.);
      #include <colorspace_fragment>
    }`,
  });
}
export function createMosaicSockets(beads,at,palette,scale=1){
  const group=new THREE.Group();group.name='Target-color mosaic sockets';
  const h=SOCKET_PITCH/2,shape=new THREE.Shape();
  shape.moveTo(-h,-h);shape.lineTo(h,-h);shape.lineTo(h,h);shape.lineTo(-h,h);shape.closePath();
  shape.holes.push(roundedPath(SOCKET_OPENING,SOCKET_RADIUS));
  const wallsGeometry=new THREE.ExtrudeGeometry(shape,{depth:.115,bevelEnabled:false,curveSegments:8});
  const shellMaterial=coloredPlateMaterial();
  // Unlit target colors remain legible under the raised bead's shadow. They are
  // fixed to the authored target, never recolored by the current board contents.
  const floorMaterial=new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false});
  const walls=new THREE.InstancedMesh(wallsGeometry,shellMaterial,beads.length);
  const base=new THREE.InstancedMesh(new THREE.BoxGeometry(SOCKET_PITCH,SOCKET_PITCH,.13),shellMaterial,beads.length);
  const floors=new THREE.InstancedMesh(new THREE.PlaneGeometry(SOCKET_OPENING,SOCKET_OPENING),floorMaterial,beads.length);
  const shading=createRecessShading(SOCKET_OPENING,SOCKET_RADIUS,beads.length);
  const dummy=new THREE.Object3D();
  dummy.scale.setScalar(scale);
  beads.forEach((bead,i)=>{
    const color=new THREE.Color(palette[bead.color]);
    for(const mesh of [walls,base,floors,shading])mesh.setColorAt(i,color);
    dummy.position.copy(at(bead.x,bead.y,-.065));dummy.updateMatrix();walls.setMatrixAt(i,dummy.matrix);
    dummy.position.z=-.10;dummy.updateMatrix();base.setMatrixAt(i,dummy.matrix);
    dummy.position.z=.043;dummy.updateMatrix();floors.setMatrixAt(i,dummy.matrix);
    dummy.position.z=.046;dummy.updateMatrix();shading.setMatrixAt(i,dummy.matrix);
  });
  for(const mesh of [walls,base,floors]){mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.castShadow=mesh!==floors;group.add(mesh);}
  group.add(shading);
  return group;
}
