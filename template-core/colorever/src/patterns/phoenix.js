import * as THREE from 'three';

// Grid-relative sculpted accessories, independently movable in the pattern studio.
export const PHOENIX_PARTS={beak:[16.2,9.2],eye:[17,8]};
export function decorate({scene,at,level,boardScale}){
  const unit=.784*boardScale;
  const position=(x,y,z=.34)=>at(780+(x-(level.width-1)/2)*39.2*boardScale,1441+(y-(level.height-1)/2)*39.2*boardScale,z);
  function layer(id){
    const [x,y]=PHOENIX_PARTS[id],t=level.decorations?.[id]??{},g=new THREE.Group();
    g.name=`phoenix-${id}`;g.position.copy(position(x+(t.offsetX??0),y+(t.offsetY??0)));g.scale.setScalar(unit*(t.scale??1));scene.add(g);return g;
  }
  const resin=(color,metalness=.12)=>new THREE.MeshPhysicalMaterial({color,metalness,roughness:.24,clearcoat:.8,clearcoatRoughness:.12});
  const copper=resin('#b97827'),gold=resin('#ffcb4b');
  function part(g,geometry,material,x=0,y=0,z=0,sx=1,sy=1,sz=1){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
  function shape(cmd){const s=new THREE.Shape();for(const [op,...v] of cmd)if(op==='M')s.moveTo(...v);else if(op==='L')s.lineTo(...v);else s.bezierCurveTo(...v);s.closePath();return s;}
  function relief(s,depth=.12,bevel=.055){return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:4,curveSegments:32});}



  const beak=layer('beak');
  part(beak,relief(shape([['M',.15,.62],['C',-.8,.62,-1.8,.35,-2.7,-.15],['C',-1.9,-.05,-.75,-.08,.15,-.2]]),.15,.04),gold);
  part(beak,relief(shape([['M',.1,-.16],['L',-2.65,-.15],['C',-1.6,-.5,-.35,-.57,.1,-.35]]),.10,.035),copper,0,0,-.015);

  const eye=layer('eye'),sphere=new THREE.SphereGeometry(1,48,32);
  const edge=new THREE.MeshPhysicalMaterial({color:'#703d23',roughness:.24,clearcoat:1});
  const ink=new THREE.MeshPhysicalMaterial({color:'#080606',roughness:.055,clearcoat:1,clearcoatRoughness:.045,envMapIntensity:1.15});
  // Match the cat's domed resin eye and single clear highlight at the bird's scale.
  part(eye,sphere,edge,0,0,.22,.54,.62,.21);
  part(eye,sphere,ink,0,.015,.35,.49,.57,.29);
  const shine=new THREE.MeshBasicMaterial({color:'#fffefa'});
  part(eye,sphere,shine,-.15,.21,.62,.115,.125,.065);
}
