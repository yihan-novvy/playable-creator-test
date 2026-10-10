import * as THREE from 'three';

// Anchors are traced from the source photograph, on a 7 px grid at (42, 12).
export const CHICK_PARTS={
  'eye-chick':[(98-42)/7,(102-12)/7],
  beak:[(67-42)/7,(122-12)/7],
  feet:[(130-42)/7,(266-12)/7],
};
export function decorate({scene,at,level,boardScale}){
  const unit=.784*boardScale;
  const position=(x,y,z=.35)=>at(780+(x-(level.width-1)/2)*39.2*boardScale,1441+(y-(level.height-1)/2)*39.2*boardScale,z);
  function layer(id){
    const [x,y]=CHICK_PARTS[id],t=level.decorations?.[id]??{},group=new THREE.Group();
    group.name=`chick-${id}`;group.position.copy(position(x+(t.offsetX??0),y+(t.offsetY??0)));
    group.scale.setScalar(unit*(t.scale??1));scene.add(group);return group;
  }
  const resin=color=>new THREE.MeshPhysicalMaterial({color,roughness:.25,clearcoat:.7,clearcoatRoughness:.14});
  function mesh(group,geometry,material,x=0,y=0,z=0,sx=1,sy=1,sz=1){
    const part=new THREE.Mesh(geometry,material);part.position.set(x,y,z);part.scale.set(sx,sy,sz);part.castShadow=true;part.receiveShadow=true;group.add(part);return part;
  }
  const sphere=new THREE.SphereGeometry(1,40,28),eye=layer('eye-chick');
  mesh(eye,sphere,resin('#fff4ce'),0,0,.10,1.68,1.90,.28);
  const brown=new THREE.MeshPhysicalMaterial({color:'#714221',roughness:.09,clearcoat:1,clearcoatRoughness:.05});
  mesh(eye,sphere,brown,-.10,.03,.31,1.18,1.43,.37);
  mesh(eye,sphere,resin('#372316'),-.15,.03,.55,.82,1.01,.18);
  mesh(eye,sphere,new THREE.MeshBasicMaterial({color:'#fffaf0'}),-.47,.55,.66,.21,.25,.10);

  const orange=resin('#ff9c1e'),deepOrange=resin('#e35f16'),beak=layer('beak');
  // Restore the rounded upper and lower bill, fitted to the current face anchor.
  const profile=[[0,0],[.52,.22],[.86,.48],[1.06,.80],[1.10,1.06],[1.00,1.38],[.78,1.80],[.52,2.22],[.28,2.66],[.10,2.98],[0,3.18]];
  function bill(start,verticalScale){
    const geometry=new THREE.LatheGeometry(profile.map(([r,x])=>new THREE.Vector2(r,x)),48,start,Math.PI);
    geometry.rotateZ(Math.PI/2);geometry.scale(1,verticalScale,.85);
    geometry.computeVertexNormals();return geometry;
  }
  mesh(beak,bill(0,1.05),orange,1.7,.025,.36);
  mesh(beak,bill(Math.PI,.70),deepOrange,1.7,-.025,.36);

  const feet=layer('feet');
  function toe(points,radius=.17){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    mesh(feet,new THREE.TubeGeometry(curve,16,radius,12,false),deepOrange);
  }
  for(const x of [-3,3]){
    toe([[x,1.3,.03],[x,.2,.12],[x,-.6,.16]],.23);
    for(const spread of [-1,0,1])toe([[x,-.45,.16],[x+spread*.55,-.77,.19],[x+spread*1.15,-1.08,.17]],.18);
  }
}
