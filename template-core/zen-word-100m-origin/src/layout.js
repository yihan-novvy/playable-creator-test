// Keep the camera/background full bleed. Only gameplay nodes respect shell insets.
function zenLayoutRects(width,height,env){
  const safe=env.safeArea||{},insets=env.insets||{},landscape=width>height;
  const top=Math.max(Number(safe.top)||0,Number(insets.top)||0,landscape?8:56);
  const bottom=height-Math.max(Number(safe.bottom)||0,Number(insets.bottom)||0)-12;
  const left=Math.max(12,Number(safe.left)||0),right=width-Math.max(12,Number(safe.right)||0);
  const title=(Number(insets.top)||0)>(Number(safe.top)||0)+8;
  const header=title?0:Math.min(34,(right-left)*.095);
  const progress={x:(left+right)/2,y:top+header+(title?2:8),width:Math.min(420,right-left-8)};
  const contentTop=progress.y+progress.width*44/924+12;
  const available=Math.max(80,bottom-contentTop),gap=32;
  let board,wheel;
  if(landscape){
    board={x:left,y:contentTop,width:(right-left)*.57,height:available};
    const diameter=Math.min((right-left)*.34,available-12);
    wheel={x:left+(right-left)*.8,y:contentTop+available/2+8,diameter};
  }else{
    const diameter=Math.min((right-left)*.63,(available-gap)*.45);
    board={x:left,y:contentTop,width:right-left,height:available-diameter-gap};
    wheel={x:(left+right)/2,y:bottom-diameter/2,diameter};
  }
  return {title,top,header,progress,board,wheel};
}

function installZenLayout(w,root,getEnv,wrap){
  let boardBounds=null;
  const rects=()=>zenLayoutRects(root.clientWidth,root.clientHeight,getEnv());
  const world=(x,y)=>{
    const cam=w.UnityEngine.Camera.main,units=cam.orthographicSize*2/root.clientHeight,p=cam.transform.position;
    return new w.pc.Vec3(p.x+(x-root.clientWidth/2)*units,p.y+(root.clientHeight/2-y)*units,0);
  };
  wrap(w.GameMgr,'Start',function(original,args){
    const value=original.apply(this,args),bounds={left:Infinity,right:-Infinity,bottom:Infinity,top:-Infinity};
    for(let i=0;i<this.wordBoxList.Count;i++){
      const word=this.wordBoxList.getItem(i),base=word.transform.localPosition;
      for(const renderer of word.boxSpRenderer){
        const p=renderer.transform.localPosition,size=renderer.size;
        bounds.left=Math.min(bounds.left,base.x+p.x-size.x/2);bounds.right=Math.max(bounds.right,base.x+p.x+size.x/2);
        bounds.bottom=Math.min(bounds.bottom,base.y+p.y-size.y/2);bounds.top=Math.max(bounds.top,base.y+p.y+size.y/2);
      }
    }
    if(Number.isFinite(bounds.left))boardBounds=bounds;
    return value;
  });
  wrap(w.WordBoxGroup,'Update',function(original,args){
    const value=original.apply(this,args);if(!boardBounds)return value;
    const r=rects().board,b=boardBounds,units=w.UnityEngine.Camera.main.orthographicSize*2/root.clientHeight;
    const scale=Math.min(r.width*units/(b.right-b.left),r.height*units/(b.top-b.bottom));
    const center=world(r.x+r.width/2,r.y+r.height/2);
    this.transform.localScale=new w.pc.Vec3(scale,scale,scale);
    this.transform.position=new w.pc.Vec3(center.x-(b.left+b.right)*scale/2,center.y-(b.bottom+b.top)*scale/2,0);
    return value;
  });
  wrap(w.CharacterWheel,'Update',function(original,args){
    const r=rects().wheel,scale=r.diameter*w.UnityEngine.Camera.main.orthographicSize*2/root.clientHeight/4.26;
    this.horPos=this.verPos=world(r.x,r.y);this.horScale=this.verScale=scale;
    return original.apply(this,args);
  });
  wrap(w.InputZone,'Update',function(original,args){
    const r=rects().wheel;this.horPos=this.verPos=world(r.x,r.y-r.diameter/2-17);
    return original.apply(this,args);
  });
  wrap(w.MainPanel,'Start',function(original,args){
    const value=original.apply(this,args);this.playBtn.gameObject.SetActive(false);return value;
  });
  wrap(w.MainPanel,'Update',function(original,args){
    const value=original.apply(this,args),layout=rects();
    const place=(rect,x,top,width)=>{
      const parent=rect.parent.GetComponent(w.UnityEngine.RectTransform),height=width*rect.rect.height/rect.rect.width;
      const point=world(x+(rect.pivot.x-.5)*width,top+(1-rect.pivot.y)*height);
      const p=this.WoldPointToUI$1(point,parent),q=this.WoldPointToUI$1(world(x+width,top),parent);
      const a=this.WoldPointToUI$1(world(x,top),parent),scale=Math.abs(q.x-a.x)/rect.rect.width;
      rect.localScale=new w.pc.Vec3(scale,scale,1);rect.localPosition=new w.pc.Vec3(p.x,p.y,0);
    };
    const panel=root.clientWidth>root.clientHeight?this.horPanel:this.verPanel;
    const top=panel.transform.Find('TopUI'),header=top.Find('Header');
    header.gameObject.SetActive(!layout.title);
    if(!layout.title)place(header.GetComponent(w.UnityEngine.RectTransform),layout.progress.x,layout.top,layout.progress.width);
    place(top.Find('ProgressBG').GetComponent(w.UnityEngine.RectTransform),layout.progress.x,layout.progress.y,layout.progress.width);
    place(this.heartImg.rectTransform,layout.wheel.x+layout.wheel.diameter*.52,layout.wheel.y-layout.wheel.diameter*.48,30);
    return value;
  });
}
