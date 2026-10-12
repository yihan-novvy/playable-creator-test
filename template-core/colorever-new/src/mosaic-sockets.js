import * as THREE from 'three';

// One square recess per bead, with the same pitch and silhouette as the mosaic.
export const SOCKET_PITCH=.784;
export const SOCKET_OPENING=.676;
const SOCKET_RADIUS=.158;
const recessFunctions=`
  float roundedWellDistance(vec2 p,float radius){
    vec2 q=abs(p)-vec2(.5-radius);
    return length(max(q,0.))+min(max(q.x,q.y),0.)-radius;
  }
  vec3 recessColor(vec2 p,float radius,float distanceToEdge,vec3 targetColor){
    float inset=-distanceToEdge;
    float wall=exp(-pow((inset-.035)/.085,2.));
    vec2 q=abs(p)-vec2(.5-radius),edgeNormal=max(q,0.);
    if(length(edgeNormal)<.00001)edgeNormal=abs(p.y)>abs(p.x)?vec2(0.,sign(p.y)):vec2(sign(p.x),0.);
    else edgeNormal=normalize(edgeNormal)*sign(p);
    float upperLeft=clamp(.5+.5*(edgeNormal.y-edgeNormal.x),0.,1.);
    vec3 color=targetColor*(.88-wall*(.06+.30*upperLeft));
    return mix(color,mix(targetColor,vec3(1.),.055),wall*(1.-upperLeft)*.40);
  }`;

// A continuous rounded inner wall uses the pocket's own color. Soft shading
// gives depth without introducing a white highlight or a dark graphic stroke.
export function createRecessShading(width,radius,count){
  const material=new THREE.ShaderMaterial({toneMapped:false,
    uniforms:{cornerRadius:{value:radius/width}},
    vertexShader:`varying vec2 vUv;varying vec3 vColor;void main(){vUv=uv;vColor=instanceColor;gl_Position=projectionMatrix*viewMatrix*modelMatrix*instanceMatrix*vec4(position,1.);}`,
    fragmentShader:`
      varying vec2 vUv;varying vec3 vColor;uniform float cornerRadius;
      ${recessFunctions}
      void main(){
        vec2 p=vUv-.5;
        float distanceToEdge=roundedWellDistance(p,cornerRadius);
        if(distanceToEdge>0.)discard;
        gl_FragColor=vec4(recessColor(p,cornerRadius,distanceToEdge,vColor),1.);
        #include <colorspace_fragment>
      }`,
  });
  const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(width,width),material,count);
  const color=new THREE.Color('#d4b296');for(let i=0;i<count;i++)mesh.setColorAt(i,color);
  mesh.name='Same-color rounded recess';mesh.frustumCulled=false;
  return mesh;
}

function mosaicMaterial(){
  return new THREE.ShaderMaterial({toneMapped:false,
    uniforms:{openingWidth:{value:SOCKET_OPENING},cornerRadius:{value:SOCKET_RADIUS/SOCKET_OPENING}},
    vertexShader:`varying vec3 vColor;varying vec2 vLocal;void main(){vColor=instanceColor;vLocal=position.xy;gl_Position=projectionMatrix*viewMatrix*modelMatrix*instanceMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 vColor;varying vec2 vLocal;uniform float openingWidth,cornerRadius;
      ${recessFunctions}
      void main(){
        vec2 p=vLocal/openingWidth;
        float d=roundedWellDistance(p,cornerRadius);
        float lip=exp(-pow((d*openingWidth-.014)/.023,2.));
        vec3 plate=mix(vColor,vec3(1.),.025+.025*lip);
        float feather=max(fwidth(d),.0005);
        vec3 color=plate;
        if(d<feather)color=mix(recessColor(p,cornerRadius,d,vColor),plate,smoothstep(-feather,feather,d));
        gl_FragColor=vec4(color,1.);
        #include <colorspace_fragment>
      }`,
  });
}
export function createMosaicSockets(beads,at,palette,scale=1){
  const group=new THREE.Group();group.name='Target-color mosaic sockets';
  // One quad paints the target-colored plate, rounded opening and recessed
  // walls together. No hidden floor, backing box or extruded frame is needed.
  const surface=new THREE.InstancedMesh(new THREE.PlaneGeometry(SOCKET_PITCH,SOCKET_PITCH),mosaicMaterial(),beads.length);
  surface.name='Combined target-color plate and rounded recess';
  const dummy=new THREE.Object3D();
  dummy.scale.setScalar(scale);
  beads.forEach((bead,i)=>{
    const color=new THREE.Color(palette[bead.color]);
    surface.setColorAt(i,color);
    dummy.position.copy(at(bead.x,bead.y,.046));dummy.updateMatrix();surface.setMatrixAt(i,dummy.matrix);
  });
  surface.frustumCulled=false;group.add(surface);
  return group;
}
