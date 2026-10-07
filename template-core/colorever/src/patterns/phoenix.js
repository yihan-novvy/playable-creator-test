import * as THREE from 'three';

// Grid-relative sculpted accessories, independently movable in the pattern studio.
export const PHOENIX_PARTS={beak:[16.2,9.2],eye:[17.4,8.1]};
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
  function vein(g,points,color=gold,r=.045,z=.25){const curve=new THREE.CatmullRomCurve3(points.map(([x,y])=>new THREE.Vector3(x,y,z)));part(g,new THREE.TubeGeometry(curve,40,r,8,false),color);}


  const beak=layer('beak');
  part(beak,relief(shape([['M',.15,.62],['C',-.8,.62,-1.8,.35,-2.7,-.15],['C',-1.9,-.05,-.75,-.08,.15,-.2]]),.15,.04),gold);
  part(beak,relief(shape([['M',.1,-.16],['L',-2.65,-.15],['C',-1.6,-.5,-.35,-.57,.1,-.35]]),.10,.035),copper,0,0,-.015);

  const eye=layer('eye'),sphere=new THREE.SphereGeometry(1,40,24);
  const rim=resin('#813123'),ivory=resin('#fff5cb'),iris=resin('#dc8d25');
  const ink=new THREE.MeshPhysicalMaterial({color:'#24151f',roughness:.08,clearcoat:1,clearcoatRoughness:.04});
  const almond=shape([['M',-.92,-.04],['C',-.48,.53,.25,.60,.98,.20],['C',.48,-.46,-.35,-.52,-.92,-.04]]);
  part(eye,relief(almond,.10,.035),rim,0,0,.18);
  part(eye,relief(almond,.07,.025),ivory,0,0,.30,.84,.73,1);
  part(eye,sphere,iris,-.22,.035,.40,.35,.33,.10);
  part(eye,sphere,ink,-.27,.035,.48,.225,.28,.11);
  const shine=new THREE.MeshBasicMaterial({color:'#fffef5'});
  part(eye,sphere,shine,-.36,.15,.59,.09,.10,.04);
  part(eye,sphere,shine,-.16,-.085,.59,.035,.04,.025);
  vein(eye,[[-.77,.17],[-.20,.44],[.50,.42],[1.08,.29]],rim,.055,.40);
}
