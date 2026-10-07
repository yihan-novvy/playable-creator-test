import * as THREE from 'three';

// Grid-relative accessories share the mosaic's scale and follow editor transforms.
export function decorate({scene,at,level,boardScale}){
  const unit=.784*boardScale;
  const position=(x,y,z=.35)=>at(780+(x-(level.width-1)/2)*39.2*boardScale,1441+(y-(level.height-1)/2)*39.2*boardScale,z);
  function layer(id,x,y){
    const group=new THREE.Group(),t=level.decorations?.[id]??{};
    group.name=`chick-${id}`;group.position.copy(position(x+(t.offsetX??0),y+(t.offsetY??0)));
    group.scale.setScalar(unit*(t.scale??1));scene.add(group);return group;
  }
  const resin=color=>new THREE.MeshPhysicalMaterial({color,roughness:.24,clearcoat:.8,clearcoatRoughness:.13});
  const cream=resin('#fff3ce'),orange=resin('#ffad32'),deepOrange=resin('#d4691c');
  function mesh(group,geometry,material,x=0,y=0,z=0,sx=1,sy=1,sz=1){
    const part=new THREE.Mesh(geometry,material);part.position.set(x,y,z);part.scale.set(sx,sy,sz);part.castShadow=true;part.receiveShadow=true;group.add(part);return part;
  }
  const sphere=new THREE.SphereGeometry(1,40,28);
  const eye=layer('eye-chick',10.3,9.3);
  mesh(eye,sphere,cream,0,0,.12,1.55,1.75,.28);
  const black=new THREE.MeshPhysicalMaterial({color:'#24170f',roughness:.065,clearcoat:1,clearcoatRoughness:.05});
  mesh(eye,sphere,black,-.08,.04,.36,.95,1.20,.42);
  const white=new THREE.MeshBasicMaterial({color:'#ffffff'});
  mesh(eye,sphere,white,-.31,.40,.73,.19,.22,.10);
  mesh(eye,sphere,white,.18,-.26,.76,.075,.085,.045);

  const beak=layer('beak',5.2,12.3);
  // Rounded cross sections taper toward the tip. Both halves have real volume,
  // rather than two flat extruded triangles stacked over the mosaic.
  // The root tapers back into the face instead of ending in a vertical cut.
  const profile=[[0,0],[.52,.22],[.86,.48],[1.06,.80],[1.10,1.06],[1.00,1.38],[.78,1.80],[.52,2.22],[.28,2.66],[.10,2.98],[0,3.18]];
  function bill(start,verticalScale){
    const geometry=new THREE.LatheGeometry(profile.map(([r,x])=>new THREE.Vector2(r,x)),48,start,Math.PI);
    geometry.rotateZ(Math.PI/2);geometry.scale(1,verticalScale,.85);
    geometry.computeVertexNormals();return geometry;
  }
  mesh(beak,bill(0,1.05),orange,1.7,.025,.36);
  mesh(beak,bill(Math.PI,.70),deepOrange,1.7,-.025,.36);

  const feet=layer('feet',15,31);
  function toe(points,radius=.17){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    mesh(feet,new THREE.TubeGeometry(curve,16,radius,12,false),deepOrange);
  }
  for(const x of [-3,3]){
    toe([[x,1.3,.03],[x,.2,.12],[x,-.6,.16]],.23);
    for(const spread of [-1,0,1])toe([[x,-.45,.16],[x+spread*.55,-.77,.19],[x+spread*1.15,-1.08,.17]],.18);
  }
}
