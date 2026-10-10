import * as THREE from 'three';
import {createRecessShading} from './mosaic-sockets.js';

function roundedRectangle(width,height,radius){
  const shape=new THREE.Shape(),x=-width/2,y=-height/2;
  shape.moveTo(x+radius,y);shape.lineTo(x+width-radius,y);
  shape.absarc(x+width-radius,y+radius,radius,-Math.PI/2,0,false);
  shape.lineTo(x+width,y+height-radius);shape.absarc(x+width-radius,y+height-radius,radius,0,Math.PI/2,false);
  shape.lineTo(x+radius,y+height);shape.absarc(x+radius,y+height-radius,radius,Math.PI/2,Math.PI,false);
  shape.lineTo(x,y+radius);shape.absarc(x+radius,y+radius,radius,Math.PI,Math.PI*1.5,false);
  shape.closePath();return shape;
}

// A continuous cream tray and white rolled edge surround rounded wells.
// The wells use the same cream hue, so gaps remain part of the tray's floor.
export function createReferenceTray(layout,center,capacity){
  const group=new THREE.Group();group.name='Cream tray with rounded white rim';
  const shell=new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRectangle(layout.width,layout.height,.62),{
    depth:.24,bevelEnabled:false,curveSegments:12,
  }),new THREE.MeshBasicMaterial({color:'#d5c9bc',toneMapped:false}));
  shell.position.set(center.x,center.y,-.065);shell.castShadow=true;group.add(shell);
  const surface=new THREE.Mesh(new THREE.PlaneGeometry(layout.width,layout.height),new THREE.ShaderMaterial({
    toneMapped:false,
    uniforms:{halfSize:{value:new THREE.Vector2(layout.width/2,layout.height/2)},
      floorColor:{value:new THREE.Color('#e3d6c5')},whiteColor:{value:new THREE.Color('#fffdfa')},
      edgeColor:{value:new THREE.Color('#b9aea3')}},
    vertexShader:`varying vec2 vLocal;void main(){vLocal=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vLocal;uniform vec2 halfSize;uniform vec3 floorColor,whiteColor,edgeColor;
      void main(){
        vec2 q=abs(vLocal)-(halfSize-vec2(.62));
        float d=length(max(q,0.))+min(max(q.x,q.y),0.)-.62;
        if(d>0.)discard;
        float inset=-d;
        vec3 color=mix(edgeColor,whiteColor,smoothstep(.01,.095,inset));
        float innerEdge=smoothstep(.27,.35,inset);
        color=mix(color,edgeColor,innerEdge);
        vec3 floor=mix(floorColor*.82,floorColor,smoothstep(.37,.64,inset));
        color=mix(color,floor,smoothstep(.35,.44,inset));
        gl_FragColor=vec4(color,1.);
        #include <colorspace_fragment>
      }`,
  }));
  surface.name='Continuous cream floor and white bevel';surface.position.set(center.x,center.y,.18);group.add(surface);

  const wells=createRecessShading(layout.pocketWidth,layout.pocketWidth*.23,capacity);
  const wellColor=new THREE.Color('#e3d6c5'),wellTransform=new THREE.Object3D();
  for(let index=0;index<capacity;index++){
    wellTransform.position.set(center.x+(index%layout.cols-(layout.cols-1)/2)*layout.pitch,
      center.y+((layout.rows-1)/2-Math.floor(index/layout.cols))*layout.pitch,.181);
    wellTransform.updateMatrix();wells.setMatrixAt(index,wellTransform.matrix);wells.setColorAt(index,wellColor);
  }
  wells.name='Cream tray rounded recesses';group.add(wells);

  const contacts=new THREE.InstancedMesh(new THREE.PlaneGeometry(layout.beadWidth*1.16,layout.beadWidth*1.16),new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*viewMatrix*modelMatrix*instanceMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vUv;void main(){
      vec2 q=abs(vUv-.5)-vec2(.30);
      float d=length(max(q,0.))+min(max(q.x,q.y),0.)-.12;
      float alpha=(1.-smoothstep(-.05,.07,d))*.17;
      gl_FragColor=vec4(.24,.13,.065,alpha);
      #include <colorspace_fragment>
    }`,
  }),capacity);
  contacts.name='Occupied tray bead contact shadows';contacts.count=0;contacts.frustumCulled=false;group.add(contacts);
  return {group,contacts};
}
