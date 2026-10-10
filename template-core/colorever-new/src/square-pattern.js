// Square sampling of the reference composition, in the same coordinates as accessories.
const pitch=39.2,centerX=780,centerY=1441;
function triangle(x,y,a,b,c){
  const cross=(p,q)=>(x-q[0])*(p[1]-q[1])-(p[0]-q[0])*(y-q[1]);
  const d=[cross(a,b),cross(b,c),cross(c,a)];
  return !(d.some(v=>v<0)&&d.some(v=>v>0));
}
function roundRect(x,y,cx,cy,hx,hy,r){
  const qx=Math.abs(x-cx)-hx+r,qy=Math.abs(y-cy)-hy+r;
  return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)<=r;
}
const beads=[];
for(let row=0;row<33;row++)for(let col=0;col<33;col++){
  const dx=col-16,dy=row-16;if(Math.hypot(dx,dy)>16.25)continue;
  const x=centerX+dx*pitch,y=centerY+dy*pitch;
  let color='K';
  // Broad rounded face, pointed ears and a smaller body beneath the bow.
  const face=roundRect(x,y,780,1393,425,265,157);
  const body=roundRect(x,y,780,1829,285,180,105);
  const earL=triangle(x,y,[490,975],[411,1277],[696,1210]);
  const earR=triangle(x,y,[1070,975],[864,1210],[1149,1277]);
  if(face||body||earL||earR)color='W';
  const pinkL=triangle(x,y,[494,1021],[448,1231],[650,1210]);
  const pinkR=triangle(x,y,[1066,1021],[910,1210],[1112,1231]);
  if(pinkL||pinkR)color='P';
  if(((x-531)/76)**2+((y-1481)/65)**2<=1||((x-1053)/76)**2+((y-1481)/65)**2<=1)color='Y';
  // Tiny pastel edge accents from the supplied composition.
  if(Math.hypot(dx,dy)>15.6&&((col===1&&row>=14&&row<=17)||(col===31&&row>=12&&row<=16)))color='P';
  beads.push({x,y,row,col,color});
}
export default {beads};
