async function screwdomAdapter(ctx){
  const {cc,system,shell,root,isRunning}=ctx;
  const module=name=>system.import('chunks:///_virtual/'+name+'.ts');
  const [{GameSystem,getGameSystem},{Screw,eScrewState},{PickScrewHandle},{PlayableAdsManager},{LoseNode},{BGSystem},{MultiScreenSystem}]=await Promise.all(['GameSystem','Screw','PickScrewHandle','PlayableAdsManager','LoseNode','BGSystem','MultiScreenSystem'].map(module));
  let finished=false,environment={},layingOut=false;
  const cameraRects=new WeakMap(),titleNodes=new Map();
  const blockedNodes=new WeakSet();
  function disableAdNode(node){if(!node||blockedNodes.has(node))return;node.active=false;Object.defineProperty(node,'active',{get:()=>false,set(){},configurable:true});blockedNodes.add(node);}
  function result(kind){if(!isRunning()||finished)return;finished=true;kind==='win'?shell.win():shell.fail();}
  const win=GameSystem.prototype.win,lose=GameSystem.prototype.lose;
  GameSystem.prototype.win=function(...args){const value=win.apply(this,args);result('win');return value;};
  GameSystem.prototype.lose=function(...args){const value=lose.apply(this,args);result('fail');return value;};
  // Successful user actions remove a screw or transfer it to a matching box.
  // Automatic transfers from temporary holes to boxes do not add another step.
  const pick=Screw.prototype.onPickHandle;
  Screw.prototype.onPickHandle=function(...args){
    if(!isRunning()||finished)return;
    const previous=this.state,value=pick.apply(this,args);
    if(this.state!==previous){
      const level=getGameSystem().Level,total=level.totalScrewCount||level.screws.length;
      shell.step(100*(total-level.CurrentScrewRemain)/total);
    }
    return value;
  };
  // Remove only advertising gates, retaining tutorial and native raycast rules.
  PickScrewHandle.prototype.checkTutorial=function(event){
    if(!isRunning()||finished)return;
    if(this.shouldHandleTutorial())this.handlePickScrewTutorial(event);
    else{this.handlePickScrew(event);this.handleTutorialEnd();}
  };
  PlayableAdsManager.prototype.OpenStore=function(){};
  PlayableAdsManager.prototype.ForceOpenStore=function(){};
  function cleanControls(){
    const scene=cc.director.getScene();if(!scene)return;
    const game=getGameSystem();
    for(const node of [game?.btnPlayNow,game?.forceStoreUI])disableAdNode(node);
    for(const control of scene.getComponentsInChildren(LoseNode)){
      disableAdNode(control.playNowBtn);disableAdNode(control.replayUI);
    }
  }
  function layout(env=environment){
    environment=env;if(layingOut)return;layingOut=true;
    try{
      const scene=cc.director.getScene();if(!scene)return;
      const h=root.clientHeight||env.viewport?.height||1;
      const top=Math.max(0,env.insets?.top||0,env.safeArea?.top||0);
      const bottom=Math.max(0,env.insets?.bottom||0,env.safeArea?.bottom||0);
      const available=Math.max(.25,(h-top-bottom)/h);
      const backgrounds=new Set(scene.getComponentsInChildren(BGSystem).map(c=>c.camera));
      for(const camera of scene.getComponentsInChildren(cc.Camera)){
        if(!cameraRects.has(camera))cameraRects.set(camera,camera.rect.clone());
        const base=cameraRects.get(camera);
        camera.rect=backgrounds.has(camera)?base.clone():new cc.Rect(base.x,bottom/h+base.y*available,base.width,base.height*available);
      }
      for(const label of scene.getComponentsInChildren(cc.Label))if(/Only IQ.*solve this/i.test(label.string)){
        const node=label.node.parent;
        if(!titleNodes.has(node))titleNodes.set(node,node.active);
        node.active=env.insets?.top>0?false:titleNodes.get(node);
      }
      cleanControls();
    }finally{layingOut=false;}
  }
  const resize=MultiScreenSystem.prototype.onSizeChanged;
  MultiScreenSystem.prototype.onSizeChanged=function(...args){const value=resize.apply(this,args);layout();return value;};
  return {start(){cleanControls();layout();},layout};
}
