import * as THREE from 'three';
import reference from './reference-pattern.json';

// A complete illustration below the bead layer. Coordinates share the reference photograph.
export function createUnderpainting(){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;
  const ctx=canvas.getContext('2d'),size=1270,scale=canvas.width/size;
  ctx.setTransform(scale,0,0,scale,(635-770)*scale,(635-1441)*scale);
  // Fill the interior, but keep only the actual bead footprints at the outer edge.
  ctx.save();ctx.beginPath();
  for(const bead of reference.beads){ctx.moveTo(bead.x+22.2,bead.y);ctx.arc(bead.x,bead.y,22.2,0,Math.PI*2);}
  const points=reference.beads.map(({x,y})=>({x,y})).sort((a,b)=>a.x-b.x||a.y-b.y);
  const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const lower=[],upper=[];
  for(const p of points){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
  for(const p of [...points].reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
  const hull=lower.slice(0,-1).concat(upper.slice(0,-1));
  ctx.moveTo(hull[0].x,hull[0].y);for(const p of hull.slice(1))ctx.lineTo(p.x,p.y);ctx.closePath();ctx.clip();
  const background=ctx.createRadialGradient(615,1180,80,770,1441,640);
  background.addColorStop(0,'#34333c');background.addColorStop(.6,'#23222a');background.addColorStop(1,'#181b25');
  ctx.fillStyle=background;ctx.fillRect(100,770,1340,1350);

  function paint(path,fill,stroke='#322c32',width=14){
    ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineJoin='round';
    ctx.fill(path);if(width)ctx.stroke(path);
  }
  const body=new Path2D();
  body.moveTo(596,1649);body.bezierCurveTo(528,1675,500,1740,485,1814);
  body.bezierCurveTo(448,1913,496,1994,595,2003);
  body.bezierCurveTo(707,2019,890,2019,989,1995);
  body.bezierCurveTo(1086,1966,1113,1906,1070,1810);
  body.bezierCurveTo(1061,1733,1021,1674,965,1649);body.closePath();
  const milk=ctx.createLinearGradient(430,1080,1060,2000);
  milk.addColorStop(0,'#fffef2');milk.addColorStop(.5,'#f9f7ec');milk.addColorStop(1,'#ecebe5');
  ctx.save();ctx.shadowColor='rgba(3,13,27,.38)';ctx.shadowBlur=21;ctx.shadowOffsetY=11;paint(body,milk);ctx.restore();

  const head=new Path2D();head.moveTo(650,1120);
  head.bezierCurveTo(597,1089,520,956,490,972);
  head.bezierCurveTo(464,1023,452,1110,443,1204);
  head.bezierCurveTo(421,1303,414,1426,424,1493);
  head.bezierCurveTo(427,1588,493,1637,607,1652);
  head.bezierCurveTo(701,1665,870,1665,969,1654);
  head.bezierCurveTo(1083,1642,1134,1584,1144,1497);
  head.bezierCurveTo(1154,1386,1129,1273,1100,1192);
  head.bezierCurveTo(1091,1091,1070,996,1042,974);
  head.bezierCurveTo(1004,971,949,1083,903,1118);
  head.bezierCurveTo(830,1114,719,1114,650,1120);head.closePath();
  ctx.save();ctx.shadowColor='rgba(7,11,25,.30)';ctx.shadowBlur=18;ctx.shadowOffsetY=12;paint(head,milk);ctx.restore();

  for(const side of [-1,1]){
    const map=x=>side===-1?x:1540-x;
    const ear=new Path2D();ear.moveTo(map(490),1009);
    ear.bezierCurveTo(map(530),1021,map(598),1122,map(643),1223);
    ear.bezierCurveTo(map(578),1250,map(489),1251,map(452),1220);
    ear.bezierCurveTo(map(448),1128,map(471),1029,map(490),1009);ear.closePath();
    const pink=ctx.createLinearGradient(map(484),1030,map(555),1235);
    pink.addColorStop(0,'#ffc4d7');pink.addColorStop(.6,'#fba8c2');pink.addColorStop(1,'#ec89ae');paint(ear,pink,'#f4aac4',2);
  }
  for(const x of [531,1053]){
    const glow=ctx.createRadialGradient(x-19,1462,6,x,1481,77);
    glow.addColorStop(0,'#fffbb0');glow.addColorStop(.25,'#ffeb66');glow.addColorStop(.75,'#ffda30');glow.addColorStop(1,'rgba(255,211,56,0)');
    ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(x,1481,79,71,0,0,Math.PI*2);ctx.fill();
  }
  // Independent 3D eyes and bow sit over these painted details.
  for(const x of [624,920]){
    ctx.fillStyle='#462720';ctx.beginPath();ctx.ellipse(x,1410,44,55,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#110e12';ctx.beginPath();ctx.ellipse(x,1408,40,50,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fffefa';ctx.beginPath();ctx.ellipse(x-13,1390,10,10,0,0,Math.PI*2);ctx.fill();
  }
  ctx.lineWidth=9;ctx.lineCap='round';ctx.strokeStyle='#302027';
  for(const side of [-1,1]){
    ctx.beginPath();ctx.moveTo(771,1463);ctx.bezierCurveTo(771+side*15,1490,771+side*38,1502,771+side*60,1482);ctx.stroke();
  }
  const nose=new Path2D();nose.moveTo(744,1445);nose.bezierCurveTo(748,1428,798,1428,800,1445);
  nose.bezierCurveTo(798,1454,780,1468,772,1469);nose.bezierCurveTo(762,1467,747,1453,744,1445);
  paint(nose,'#f58bac',null,0);
  for(const [a,b,c] of [
    [[453,1428],[391,1421],[327,1418]],[[451,1481],[388,1480],[323,1481]],[[457,1527],[404,1541],[339,1564]],
    [[1103,1428],[1166,1420],[1252,1416]],[[1107,1480],[1179,1480],[1258,1481]],[[1101,1529],[1170,1548],[1245,1571]],
  ]){ctx.strokeStyle='#201b24';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(...a);ctx.quadraticCurveTo(...b,...c);ctx.stroke();}

  for(const side of [-1,1]){
    const wing=new Path2D();wing.moveTo(779+side*20,1675);
    wing.bezierCurveTo(779+side*60,1660,779+side*126,1611,779+side*135,1649);
    wing.bezierCurveTo(779+side*148,1680,779+side*145,1749,779+side*131,1766);
    wing.bezierCurveTo(779+side*105,1791,779+side*59,1752,779+side*20,1725);wing.closePath();
    paint(wing,'#139ce8','#0963a9',10);
  }
  ctx.fillStyle='#139dea';ctx.strokeStyle='#0868b0';ctx.lineWidth=8;ctx.beginPath();ctx.roundRect(756,1672,47,54,15);ctx.fill();ctx.stroke();
  ctx.restore();
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=4;
  return{texture,size:25.4,canvas};
}
