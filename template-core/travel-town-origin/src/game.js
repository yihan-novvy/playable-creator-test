NovvyGame(function(container,shell,options){
  options=options||{};
  const view=engineRoot(container,'<canvas id="game-canvas"></canvas>','.engine-root{background:#182630;touch-action:none}canvas{display:block;touch-action:none}');
  const scope=createEngineScope(view.root);
  let app,requireModule,config,scene,env=options.env||{},started=false,paused=true,disposed=false,finished=false,progress=0,resolveStart,rejectStart,startPromise;
  function sound(){if(app?.audio)app.audio.available=started&&!paused&&env.muted!==true;}
  function input(){view.root.style.pointerEvents=started&&!paused&&!finished?'auto':'none';}
  function area(){
    const width=app?.screen?.width||1,height=app?.screen?.height||1;
    const ratioX=width/Math.max(1,view.root.clientWidth),ratioY=height/Math.max(1,view.root.clientHeight);
    const edge=(key,ratio)=>Math.max(0,Number(env.safeArea?.[key])||0,Number(env.insets?.[key])||0)*ratio;
    const left=edge('left',ratioX),top=edge('top',ratioY),right=edge('right',ratioX),bottom=edge('bottom',ratioY);
    return {left,top,width:Math.max(1,width-left-right),height:Math.max(1,height-top-bottom)};
  }
  function layout(){
    if(!scene||disposed)return;
    app.screen.reset();app.screen.emit('resize');
    const get=type=>requireModule(8646).dGet(type),ui=get(requireModule(4959).UiContainer),a=area();
    for(const key of ['ctaButton','playNowButton','disclaimer']){const item=ui.child(key);if(item){item.node.visible=false;item.node.interactive=false;item.node.removeAllListeners('pointerdown');}}
    const logo=ui.child('logo');
    logo.node.visible=a.top===0;
    if(logo.node.visible){logo.node.x=a.left+160;logo.node.y=a.top+110;}
    // Background uses the full native viewport. Only the native board and its
    // goal chain use the reserved title/card rectangle (see bounds below).
    fitChoices();
    sound();
  }
  function fitChoices(){
    if(!scene||disposed||finished)return;
    const main=requireModule(8646).dGet(requireModule(2678).MainContainer),a=area();
    for(const key of ['item_0','item_1']){
      const item=main.child(key),node=item?.node;if(!node?.visible)continue;
      const b=node.getBounds(),pad=12;
      const dx=b.x<a.left+pad?a.left+pad-b.x:Math.min(0,a.left+a.width-pad-b.x-b.width);
      const dy=b.y<a.top+pad?a.top+pad-b.y:Math.min(0,a.top+a.height-pad-b.y-b.height);
      if(dx||dy){const p=node.parent.toLocal({x:b.x+dx,y:b.y+dy}),q=node.parent.toLocal({x:b.x,y:b.y});node.x+=p.x-q.x;node.y+=p.y-q.y;}
    }
  }
  function pause(){if(disposed||paused)return;paused=true;input();sound();scope.pause();scope.audioContexts.forEach(c=>c.suspend().catch(()=>{}));}
  function resume(){if(disposed||!started)return;paused=false;scope.resume();input();sound();if(env.muted!==true)scope.audioContexts.forEach(c=>c.resume().catch(()=>{}));}
  function step(){if(started&&!paused&&!disposed&&!finished)shell.step(progress);}
  function complete(result){if(!started||disposed||finished)return;finished=true;input();shell[result]();}
  scope.window.TT_CONTEXT={
    fitChoices,
    error(error){rejectStart?.(error);},
    install(req,value,data){requireModule=req;app=value;config=data;
      // Native UI conversion controls are removed from config as well as hidden
      // after layout, so they never appear before the first renderer frame.
      const ui=config.layouts.gameScene.children.ui.children;
      ui.ctaButton.visible=false;ui.playNowButton.visible=false;ui.disclaimer.visible=false;
    },
    ready(value){if(disposed)return;scene=value;layout();input();sound();resolveStart?.();},
    bounds(component,original){
      if(component.getElement().key!=='gameContainer')return original;
      const a=area();return [a.left,a.top,a.width,a.height];
    },
    merge(item){if(!started||paused||disposed||finished)return;const model=requireModule(8646).dGet(requireModule(2528).GameModel);
      const target=model.current===0?3:2;
      if(item.type===model.current)progress=Math.max(progress,Math.min(100,item.level/target*100));
      step();
    },
    move(){step();},complete(){complete('win');},fail(){complete('fail');},
  };
  const runtime={
    start(){if(disposed)return Promise.resolve();if(started)return startPromise;started=true;paused=false;input();
      startPromise=new Promise((resolve,reject)=>{resolveStart=resolve;rejectStart=reject;});
      try{scope.window.Globals.settings.network='local';scope.window.Globals.settings.allowAudioOnInteract=true;app.run(config);sound();}catch(error){rejectStart(error);}
      return startPromise;
    },pause,resume,
    setEnv(patch){env={...env,...patch};layout();sound();},
    destroy(){if(disposed)return;disposed=true;view.root.style.pointerEvents='none';
      if(app?.audio){app.audio.available=false;Object.values(app.audio._audios||{}).forEach(audio=>audio.unload());}
      app?.ticker?.stop();app?.app?.destroy(true,{children:true,texture:true,baseTexture:true});
      scope.dispose();view.mount.remove();resolveStart?.();
    },
  };
  input();scope.run(SOURCE.resources);scope.run(SOURCE.engine);
  return runtime;
});
