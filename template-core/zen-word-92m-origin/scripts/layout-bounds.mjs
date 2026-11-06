// Read frozen RectTransform geometry, before native animations can move tiles.
export function layoutBounds(jsons) {
  const scene=jsons['assets/bundles/-1/bundle.json'].scenes[0],result={};
  const child=(node,name)=>{
    const matches=node.children.filter(n=>n.data[0]===name);
    if(matches.length!==1)throw new Error(`Layout anchor changed: ${node.data[0]}/${name}`);
    return matches[0];
  };
  function bounds(group,includeRoot=false){
    const b={left:Infinity,right:-Infinity,bottom:Infinity,top:-Infinity};
    const hasImage=node=>node.components.some(c=>c.type===8&&c.class===17)||node.children.some(hasImage);
    function visit(node,x,y,sx,sy,apply){
      if(!hasImage(node))return;
      const r=node.components.find(c=>c.type===6)?.data;
      if(!r)throw new Error(`Expected RectTransform: ${node.data[0]}`);
      if(apply){
        if(r.slice(2,6).some(v=>v!==.5)||r.slice(11,14).some(v=>v!==0))throw new Error('Layout needs centered anchors without rotation');
        x+=r[8]*sx;y+=r[9]*sy;sx*=r[15];sy*=r[16];
      }
      if(node.components.some(c=>c.type===8&&c.class===17)){
        b.left=Math.min(b.left,x-r[0]*r[6]*sx);b.right=Math.max(b.right,x+(1-r[0])*r[6]*sx);
        b.bottom=Math.min(b.bottom,y-r[1]*r[7]*sy);b.top=Math.max(b.top,y+(1-r[1])*r[7]*sy);
      }
      for(const n of node.children)visit(n,x,y,sx,sy,true);
    }
    visit(group,0,0,1,1,includeRoot);
    if(!Object.values(b).every(Number.isFinite)||b.right<=b.left||b.top<=b.bottom)throw new Error('Empty layout bounds');
    return b;
  }
  for(const canvas of scene.objects.filter(n=>/^Canvas[A-Z]+$/.test(n.data[0]))){
    const game=child(canvas,'GameUI');
    result[canvas.data[0]]={
      header:bounds(child(canvas,'Image')),
      board:bounds(child(canvas,'题目待填充格背景')),
      wheel:bounds(child(child(game,'字母盘'),'底盘'),true),
      tip:bounds(child(canvas,'Tip')),
    };
  }
  if(Object.keys(result).length!==7)throw new Error('Expected all seven original language layouts');
  return result;
}
