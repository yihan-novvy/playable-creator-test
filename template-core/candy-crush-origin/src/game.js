NovvyGame(function(container,shell,options){
  options=options||{};
  const view=engineRoot(container,'<div id="progress"></div><div id="main"><div id="three"><canvas id="canvas_3d"></canvas></div><div id="pixi"><canvas id="canvas_2d"></canvas></div></div>',
    '.engine-root{background:#006dc5;touch-action:none;user-select:none}#main,#three,#pixi{position:absolute;inset:0}#main{visibility:hidden}canvas{position:absolute;inset:0;touch-action:none}#progress{display:none}');
  const scope=createEngineScope(view.root);
  let targetTimer,turnState;
  let winning=false,priorAnimations,winAnimations;
  let app,renderers=[],howler,tween,env=options.env||{},started=false,paused=true,disposed=false,finished=false,last=0,unlocked=false,resolveReady,rejectReady;
  const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
  const audible=()=>started&&!paused&&!disposed&&unlocked&&env.muted!==true;
  function input(enabled){view.root.style.pointerEvents=enabled?'auto':'none';}
  function sound(){howler?.mute(!audible());if(app?.soundManager){app.soundManager.activeFocus=audible();audible()?app.soundManager.on():app.soundManager.off();}}
  function pause(){if(disposed)return;paused=true;input(false);sound();scope.pause();scope.audioContexts.forEach(c=>c.suspend().catch(()=>{}));}
  function resume(){if(disposed||!started)return;paused=false;scope.resume();input(!finished&&!winning);sound();if(audible())scope.audioContexts.forEach(c=>c.resume().catch(()=>{}));}
  function area(){
    const width=view.root.clientWidth,height=view.root.clientHeight;
    const inset=side=>Math.max(0,Number(env.safeArea?.[side])||0,Number(env.insets?.[side])||0);
    const left=inset('left'),top=inset('top'),right=inset('right'),bottom=inset('bottom');
    return {left,top,width:Math.max(1,width-left-right),height:Math.max(1,height-top-bottom),fullWidth:width,fullHeight:height};
  }
  function fit2d(renderer){const a=area(),portrait=a.width<a.height;
    renderer.scene.position.set(a.left+a.width/2,a.top+a.height/2);
    renderer.scene.scale.set(Math.min(a.width/(portrait?720:1280),a.height/(portrait?1280:720)));
  }
  function fit3d(renderer){const a=area(),camera=renderer.camera;
    camera.aspect=a.width/a.height;camera.fov=renderer.fov[a.width<a.height?0:1];camera.updateProjectionMatrix();
    const p=camera.projectionMatrix.elements;p[0]*=a.width/a.fullWidth;p[5]*=a.height/a.fullHeight;
    p[8]-=(2*a.left+a.width)/a.fullWidth-1;p[9]-=1-(2*a.top+a.height)/a.fullHeight;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }
  function nativeUi(){if(!app)return;
    for(const name of ['ButtonMini','ButtonCTA','FullscreenCTA','Legal']){const node=app.components[name];if(node){node.visible=false;node.renderable=false;node.eventMode='none';node.removeAllListeners?.();}}
    for(const name of ['LogoMini','Logo']){const node=app.components[name];if(node){node.eventMode='none';node.removeAllListeners?.();}}
  }
  function layout(){if(!app)return;app.resizeManager.call();nativeUi();sound();}
  function finish(kind){if(!started||paused||disposed||finished)return;finished=true;input(false);shell[kind]();}
  scope.window.CCS_CONTEXT={area,fit2d,fit3d,audible,alive:()=>!disposed,attach(value,views){app=value;renderers=views;},
    ready(value,audio,animation){app=value;howler=audio;tween=animation;layout();input(false);scope.window.requestAnimationFrame(()=>{if(disposed)return;pause();resolveReady(runtime);});},
    step(count,total,ball,raycaster){
      if(!started||paused||disposed||finished||winning||count!==last+1||total!==CANDY_TARGET_HITS||count>total)return;
      last=count;shell.step(count/total*100);
      scope.window.clearTimeout(targetTimer);if(turnState)tween.killTweensOf(turnState);
      if(count<total&&ball)targetTimer=scope.window.setTimeout(()=>{
        if(disposed||finished)return;
        const turn=remainingCandyTurn(ball,app.view3d.camera,raycaster);
        if(!turn)return;
        turnState={progress:0};const state=turnState;
        tween.to(state,{duration:0.65,progress:1,ease:'sine.inOut',onUpdate(){ball.quaternion.slerpQuaternions(turn.from,turn.to,state.progress);}});
      },1600);
    },
    win(){
      if(!started||paused||disposed||finished||winning||last!==CANDY_TARGET_HITS)return;
      winning=true;input(false);
      priorAnimations=new Set(tween.globalTimeline.getChildren(true,true,false));
    },
    winAnimationReady(){
      if(!winning||disposed||winAnimations)return;
      winAnimations=tween.globalTimeline.getChildren(true,true,false).filter(animation=>{
        if(priorAnimations.has(animation))return false;
        for(let node=animation;node;node=node.parent)if(node.repeat?.()===-1)return false;
        return true;
      });
      // The large falling candy balls define the visible end of the celebration.
      // Their child jitter/rotation and offscreen debris can continue much longer.
      const landingTargets=new Set(Object.entries(app.components.World||{})
        .filter(([name])=>name.startsWith('physicsBoxP_')).map(([,node])=>node.position));
      const landings=winAnimations.filter(animation=>animation.targets().some(target=>landingTargets.has(target)));
      if(landings.length)winAnimations=landings;
      priorAnimations=null;
    },
    winFrame(){
      if(!winning||!winAnimations||paused||disposed||finished)return;
      // GSAP removes completed/overwritten tweens from their parent. A paused
      // visible animation keeps its parent and must not release the result.
      if(winAnimations.some(animation=>animation.parent&&animation.totalProgress()<1))return;
      finish('win');winAnimations=null;
    },
    fail(){if(!winning)finish('fail');},
  };
  const unlock=()=>{if(!started||paused||disposed||finished)return;unlocked=true;sound();scope.audioContexts.forEach(c=>{if(audible())c.resume().catch(()=>{});});};
  view.root.addEventListener('pointerdown',unlock,{capture:true,passive:true});
  const runtime={
    start(){if(disposed||started)return;started=true;resume();},pause,resume,
    setEnv(patch){env={...env,...patch};scope.window.devicePixelRatio=Math.min(2,Math.max(1,env.viewport?.dpr||window.devicePixelRatio||1));layout();sound();},
    destroy(){if(disposed)return;disposed=true;input(false);view.root.removeEventListener('pointerdown',unlock,true);tween?.globalTimeline.clear();tween?.ticker.sleep();howler?.unload();
      const view3d=app?.view3d||renderers.find(v=>v.type==='view3d');const view2d=app?.view2d||renderers.find(v=>v.type==='view2d');
      if(view3d){view3d.scene.traverse(node=>{node.geometry?.dispose();for(const material of Array.isArray(node.material)?node.material:[node.material])if(material){for(const value of Object.values(material))if(value?.isTexture)value.dispose();material.dispose();}});view3d.renderer.dispose();view3d.renderer.forceContextLoss();}
      view2d?.app.destroy(true,{children:true,texture:true,baseTexture:true});scope.dispose();view.mount.remove();},
  };
  input(false);
  Object.assign(scope.window,{params:JSON.parse(JSON.stringify(SOURCE.params)),images:SOURCE.images,texts:SOURCE.texts,adPlatform:{value:'local'},CreatePreloader(){},hidePreloader(){},platform:{load:done=>scope.window.setTimeout(done,0),init(){},end(){},clickAd(){}}});
  scope.window.params.language.value=env.language||'en';
  scope.window.params.tapsToBreak.value=CANDY_TARGET_HITS;
  try{scope.run(SOURCE.engine);}catch(error){runtime.destroy();rejectReady(error);}
  return ready.catch(error=>{runtime.destroy();throw error;});
});
