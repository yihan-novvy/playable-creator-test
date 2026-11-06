async function colorBlockJamAdapter({cc,system,scope,shell,isRunning}) {
  const module=name=>system.import('chunks:///_virtual/'+name+'.ts');
  const [{Game},{GameModel},{MapManager},{Over},framework]=await Promise.all([module('Game'),module('GameModel'),module('MapManager'),module('Over'),system.import('chunks:///_virtual/index.js')]);
  let game,gesture=null,level=1,total=2,result=false,env={},nativeCamera=null,backgrounds=[];
  const remaining=()=>GameModel.instance.blocks.filter(b=>b.color!==-1).length;
  const progress=()=>Math.max(0,Math.min(100,(total-remaining())/total*100));
  const wrap=(object,key,fn)=>{const original=object[key];if(typeof original!=='function')throw new Error('Missing native callback '+key);object[key]=function(...args){return fn.call(this,original,args);};};
  const commit=()=>{if(!gesture||gesture.emitted||!isRunning()||result)return;gesture.emitted=true;shell.step(progress());};
  wrap(Game.prototype,'onLoad',function(original,args){game=this;const answer=original.apply(this,args);nativeCamera={position:this.camera.node.position.clone(),fov:this.camera.fov};backgrounds=[this.plane,this.plane3].filter(Boolean).map(node=>({node,scale:node.scale.clone()}));return answer;});
  // The native adapt() schedules a later FOV write; replace that single layout
  // owner so a resize cannot overwrite host inset accommodation next frame.
  Game.prototype.adapt=function(){this.scheduleOnce(()=>layout(env));};
  wrap(Game.prototype,'onTouchStart',function(original,args){
    gesture=null;if(!isRunning()||this.isPause||result)return;
    const answer=original.apply(this,args);
    if(this.target)gesture={block:this.target,grid:JSON.stringify(this.target.grid),emitted:false};
    return answer;
  });
  wrap(Game.prototype,'onTouchMove',function(original,args){if(isRunning()&&!result)return original.apply(this,args);});
  wrap(Game.prototype,'onTouchEnd',function(original,args){
    if(!isRunning()||result)return;
    const token=gesture,answer=original.apply(this,args);
    if(token&&token===gesture&&JSON.stringify(token.block.grid)!==token.grid)commit();
    return answer;
  });
  wrap(GameModel.prototype,'removeBlock',function(original,args){
    const block=args[0],exists=this.blocks.includes(block),answer=original.apply(this,args);
    if(exists&&block.color!==-1&&gesture?.block===block)commit();
    return answer;
  });
  wrap(Game.prototype,'gameOver',function(original,args){
    if(!this.isOver&&!result&&remaining()===0&&isRunning()){
      result=true;shell.win(level<3?{continuePlaying:true}:undefined);
    }
    return original.apply(this,args);
  });
  wrap(MapManager.prototype,'createMap',function(original,args){
    const callback=args[0];args[0]=function(...values){
      const next=GameModel.instance.currentLevel;
      if(next!==level){if(next!==level+1)throw new Error('Unexpected native level transition');level=next;result=false;gesture=null;shell.level(level);}
      total=remaining();
      callback?.apply(this,values);
    };
    return original.apply(this,args);
  });
  // Existing explicit buttons are the only game-owned store controls. Both
  // placements were confirmed as cta_click by the user on 2026-11-06.
  let lastClick=-Infinity;
  const download=()=>{if(!isRunning()||performance.now()-lastClick<1000)return;lastClick=performance.now();shell.cta('cta_click');};
  Game.prototype.btn_play=download;
  Over.prototype.btn_next=download;
  framework.playable.install=()=>{};
  Game.prototype.timeInstall=function(){};
  Game.prototype.levelInstall=function(){};
  Game.prototype.addPress=function(){this.pressNum++;};
  Game.prototype.addDelete=function(){this.deleteNum++;};
  // Keep the canvas and background full screen; only the original content
  // camera/UI responds to the host's documented insets.
  function layout(next){
    env=next||env;if(!game||!nativeCamera)return;
    const height=scope.window.innerHeight,width=scope.window.innerWidth;
    const top=Math.max(env.insets?.top||0,env.safeArea?.top||0),bottom=Math.max(env.insets?.bottom||0,env.safeArea?.bottom||0);
    // The source board occupies at most 72% of the portrait view. Fit that
    // content to the free area instead of shrinking the entire screen twice.
    const ratio=Math.min(1,Math.max(.35,(height-top-bottom)/(height*.72)));
    const base=(height>width?41:35)*Math.PI/180;
    game.camera.fov=2*Math.atan(Math.tan(base/2)/ratio)*180/Math.PI;
    const position=nativeCamera.position,up=game.camera.node.up;
    const distance=Math.hypot(position.x,position.y,position.z);
    const offset=(top-bottom)/height*distance*Math.tan(game.camera.fov*Math.PI/360);
    game.camera.node.setPosition(position.x+up.x*offset,position.y+up.y*offset,position.z+up.z*offset);
    for(const {node,scale} of backgrounds)node.setScale(scale.x/ratio*1.2,scale.y,scale.z/ratio*1.2);
    if(game.bannerIcon?.node.parent)game.bannerIcon.node.parent.active=!(env.insets?.bottom>0);
    if(game.topNode)game.topNode.active=!(env.insets?.top>0);
    if(game.levelNode)game.levelNode.active=!(env.insets?.top>0);
    if(game.tishilNode){
      game.tishilNode.active=level===1&&!(env.insets?.top>0);
      const size=cc.view.getVisibleSize(),ui=game.tishilNode.getComponent(cc.UITransform);
      game.tishilNode.setPosition(0,-size.height/2+bottom/height*size.height+(ui?.height||80)/2+12,0);
    }
    if(game.guide?.active&&game.guidePar){
      const point=new cc.Vec3();game.camera.convertToUINode(game.guidePar.worldPosition,game.guide.parent,point);game.guide.setPosition(point);
      const guideScale=height>width?ratio:Math.min(ratio,.65);
      game.guide.setScale(guideScale,guideScale,guideScale);
    }
  }
  return {layout,start(){framework.playable.gameStart(!env.muted);layout(env);},sound(muted){framework.audioManager.enableSounds=!muted;}};
}
