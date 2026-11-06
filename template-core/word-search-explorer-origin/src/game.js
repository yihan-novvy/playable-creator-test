NovvyGame(function(container,shell,options){
  options=options||{};
  const view=engineRoot(container,'<div id="loading"></div>','.engine-root{background:#000;touch-action:none}canvas{touch-action:none}');
  const scope=createEngineScope(view.root);
  let app,env=options.env||{},started=false,paused=true,disposed=false,finished=false,last=0,resolveReady,rejectReady;
  const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
  function input(enabled){app?.playable?.phaserGame?.scene?.scenes.forEach(scene=>{if(scene.input)scene.input.enabled=enabled;});view.root.style.pointerEvents=enabled?'auto':'none';}
  function sound(){const game=app?.playable?.phaserGame;if(game?.sound)game.sound.mute=paused||env.muted===true;}
  function pause(){if(disposed)return;paused=true;input(false);sound();scope.pause();scope.audioContexts.forEach(c=>c.suspend().catch(()=>{}));}
  function resume(){if(disposed||!started)return;paused=false;scope.resume();sound();input(!finished);if(env.muted!==true)scope.audioContexts.forEach(c=>c.resume().catch(()=>{}));}
  function bounds(component){
    const width=view.root.clientWidth,height=view.root.clientHeight,dpr=scope.window.devicePixelRatio||1;
    if(/^(background|dimmer)/i.test(component.componentId||''))return {left:0,top:0,width:width*dpr,height:height*dpr};
    const top=Math.max(Number(env.safeArea?.top)||0,Number(env.insets?.top)||0),bottom=Math.max(Number(env.safeArea?.bottom)||0,Number(env.insets?.bottom)||0);
    const left=Math.max(Number(env.safeArea?.left)||0,Number(env.insets?.left)||0),right=Math.max(Number(env.safeArea?.right)||0,Number(env.insets?.right)||0);
    return {left:left*dpr,top:top*dpr,width:Math.max(1,width-left-right)*dpr,height:Math.max(1,height-top-bottom)*dpr};
  }
  function contentBounds(component){
    const area=bounds(component),portrait=component.scene.getOrientation()==='portrait',design=portrait?[375,667]:[667,375];
    const banner=component.options.isBannerEnabled?area.height*(portrait?.08:.1):0;
    const scale=Math.min(area.width/design[0],Math.max(1,area.height-banner)/design[1]);
    return {leftX:area.left+(area.width-design[0]*scale)/2,topY:area.top+banner+(area.height-banner-design[1]*scale)/2,width:design[0]*scale,height:design[1]*scale};
  }
  function layout(){if(!app?.areComponentsReady)return;app.playable.props.options.isBannerEnabled=!(Number(env.insets?.top)>0);app.playable.onResizeHandler();sound();}
  scope.window.WSE_CONTEXT={
    configure(config){Object.assign(config.options,{isGoToMarketEnabled:false,openStoreForEveryMove:false,goToMarketMoves:0,goToMarketSeconds:0,goToMarketTaps:0,isEntireScreenCTAEnabled:false,isInGameCTAEnabled:false,isEndCardEnabled:false,endCardAutoForwardToStoreSeconds:0,isAutoplayEnabled:false});},
    attach(value){app=value;input(false);sound();},bounds,contentBounds,
    loadError(files){rejectReady(new Error('Original embedded assets failed: '+files.size));},
    ready(value){app=value;layout();input(false);sound();scope.window.requestAnimationFrame(()=>{pause();resolveReady(runtime);});},
    step(count,total){if(!started||paused||disposed||finished||count<=last||total<=0)return;last=count;shell.step(Math.min(100,count/total*100));if(count===total){finished=true;scope.window.setTimeout(()=>{if(!disposed){input(false);shell.win();}},600);}},
  };
  const runtime={
    start(){if(disposed||started)return;started=true;resume();},pause,resume,
    setEnv(patch){env={...env,...patch};layout();sound();},
    destroy(){if(disposed)return;disposed=true;input(false);const game=app?.playable?.phaserGame;if(game){game.destroy(true);game.runDestroy?.();}scope.dispose();view.mount.remove();},
  };
  try{scope.run(SOURCE.engine);}catch(error){runtime.destroy();rejectReady(error);}
  return ready.catch(error=>{runtime.destroy();throw error;});
});
