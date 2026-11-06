// Full camera/background; only the original content groups consume shell insets.
function zenLayoutRects(width,height,env){
  const safe=env.safeArea||{},insets=env.insets||{},landscape=width>height;
  const top=Math.max(Number(safe.top)||0,Number(insets.top)||0,landscape?8:64);
  const bottom=height-Math.max(Number(safe.bottom)||0,Number(insets.bottom)||0)-12;
  const left=Math.max(12,Number(safe.left)||0),right=width-Math.max(12,Number(safe.right)||0),widthAvailable=right-left;
  const title=(Number(insets.top)||0)>(Number(safe.top)||0)+8;
  const headerHeight=title?0:Math.min(36,widthAvailable*92/1008);
  const contentTop=top+headerHeight+(title?0:16),available=Math.max(80,bottom-contentTop);
  const header={x:left,y:top,width:widthAvailable,height:headerHeight};
  let board,wheel,tip;
  if(landscape){
    board={x:left,y:contentTop,width:widthAvailable*.56,height:available};
    const diameter=Math.min(widthAvailable*.34,available-32);
    wheel={x:left+widthAvailable*.79,y:bottom-diameter,width:diameter,height:diameter};
    wheel.x-=diameter/2;
    tip={x:wheel.x,y:contentTop,width:wheel.width,height:20};
  }else{
    const gap=height<600?38:42,diameter=Math.min(widthAvailable*.72,(available-gap)*.46);
    board={x:left,y:contentTop,width:widthAvailable,height:available-diameter-gap};
    wheel={x:(left+right-diameter)/2,y:bottom-diameter,width:diameter,height:diameter};
    tip={x:left,y:wheel.y-40,width:widthAvailable,height:22};
  }
  return {title,header,board,wheel,tip};
}

function installZenLayout(w,root,getEnv,wrap){
  function fit(transform,bounds,rect){
    const camera=w.UnityEngine.Camera.main,units=camera.orthographicSize*2/root.clientHeight;
    const scale=Math.min(rect.width/(bounds.right-bounds.left),rect.height/(bounds.top-bounds.bottom))*units;
    const parentScale=transform.parent.lossyScale,p=camera.transform.position;
    transform.localScale=new w.pc.Vec3(scale/parentScale.x,scale/parentScale.y,1);
    transform.position=new w.pc.Vec3(
      p.x+(rect.x+rect.width/2-root.clientWidth/2)*units-(bounds.left+bounds.right)*scale/2,
      p.y+(root.clientHeight/2-rect.y-rect.height/2)*units-(bounds.bottom+bounds.top)*scale/2,
      transform.position.z);
  }
  wrap(w.UIPos,'Update',function(original,args){
    const value=original.apply(this,args),transform=this.transform;
    const bounds=SOURCE.layout[transform.parent.name];
    if(!bounds)return value;
    const layout=zenLayoutRects(root.clientWidth,root.clientHeight,getEnv());
    switch(transform.name){
      case 'Image':
        // Keep the component active so a later environment change restores it.
        if(layout.title)transform.localScale=new w.pc.Vec3(0,0,0);
        else fit(transform,bounds.header,layout.header);
        break;
      case '题目待填充格背景':fit(transform,bounds.board,layout.board);break;
      case 'GameUI':fit(transform,bounds.wheel,layout.wheel);break;
      case 'Tip':fit(transform,bounds.tip,layout.tip);break;
    }
    return value;
  });
}
