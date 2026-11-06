// Each call gets its own Luna / Bridge / PlayCanvas globals and resource registry.
NovvyGame(function (container, shell, options) {
  options=options||{};
  let env={...(options.env||{})}, started=false, paused=false, destroyed=false, settled=false, letters=null,lastCta=-Infinity,startPromise=null;
  const rounds=new WeakMap();
  const view=engineRoot(container,SOURCE.markup,SOURCE.css);
  const scope=createEngineScope(view.root), w=scope.window;
  view.root.querySelectorAll('audio,video').forEach(element=>scope.audioElements.add(element));
  const running=()=>started&&!paused&&!destroyed;
  const buffer=encoded=>Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)).buffer;
  w.jsons=structuredClone(SOURCE.jsons);
  w.sounds=Object.fromEntries(Object.entries(SOURCE.sounds).map(([key,value])=>[key,buffer(value)]));
  w.blobs=Object.fromEntries(Object.entries(SOURCE.blobs).map(([key,value])=>[key,buffer(value)]));
  scope.run(SOURCE.config);
  w.$environment.baseUrl=options.base||'./';
  w.$environment.packageConfig.languages=[env.language||'en',env.language||'en'];
  // The network wrapper is intentionally excluded; these are local engine hooks.
  w.pi={logCustomEvent:function(){},logError:function(){},logEvent:function(){}};
  function resize(){
    // Insets constrain native UI, never the full-screen background or canvas.
    view.mount.style.inset='0';
    w.dispatchEvent(new Event('resize'));
  }
  function audio(){
    const muted=!started||paused||destroyed||env.muted===true;
    if(w.UnityEngine?.AudioListener)w.UnityEngine.AudioListener.volume=muted?0:1;
    const app=w.app?.app;
    if(app)(muted?app.muteAudio:app.unmuteAudio)?.call(app);
    scope.audioContexts.forEach(c=>{if(c.state!=='closed')(muted?c.suspend():c.resume()).catch(()=>{});});
  }
  function result(kind){
    if(!running()||settled)return;
    settled=true;
    if(kind==='win')shell.win();else if(kind==='fail')shell.fail();else shell.end();
  }
  function wrap(type,method,fn){
    const proto=type?.prototype,original=proto?.[method];
    if(typeof original!=='function')throw new Error(`Zen Word callback missing: ${method}`);
    proto[method]=function(...args){return fn.call(this,original,args);};
  }
  function wire(){
    w.Luna.Unity.Playable.InstallFullGame=function(){};
    w.Luna.Unity.LifeCycle.GameEnded=function(){};
    w.Luna.Unity.Analytics.LogEvent$1=function(){};
    wrap(w.LetterManager,'Start',function(original,args){
      // User-requested full puzzle: disable only the native submission cutoff.
      // The native final-word coroutine still owns completion after its animation.
      this.StepCount=0;this.StepIndex=0;letters=this;
      rounds.set(this,{total:this.mBlocks.Count,remaining:this.mBlocks.Count,answered:new WeakSet()});
      return original.apply(this,args);
    });
    wrap(w.LetterManager,'SetColor',function(original,args){
      letters=this;
      const round=rounds.get(this),block=args[1];
      // Update has already removed the matched block. Repeated words and wrong
      // submissions cannot advance this remaining-word count.
      if(args[0]===true&&block&&round&&running()&&!settled&&!round.answered.has(block)&&this.mBlocks.Count<round.remaining){
        round.answered.add(block);round.remaining=this.mBlocks.Count;
        shell.step((round.total-round.remaining)/round.total*100);
      }
      return original.apply(this,args);
    });
    wrap(w.LunaManager,'GameOver',function(original,args){
      if(!running()||settled||!letters||letters.mBlocks.Count!==0)return;
      const wasOver=this.isGameOver,value=original.apply(this,args);
      if(!wasOver)result('win');
      return value;
    });
    wrap(w.LunaManager,'Update',function(original,args){
      this.isPlayAudio=env.muted!==true;
      const tapped=this.isGameOver&&w.UnityEngine.Input.GetMouseButtonDown(0);
      const value=original.apply(this,args);
      if(env.muted)audio();
      // User decision: source/cta-decision.md, 92m-ended-tap.
      if(tapped&&running()&&performance.now()-lastCta>=1000){lastCta=performance.now();shell.cta('forced_click_to_appstore');}
      return value;
    });
    installZenLayout(w,view.root,()=>env,wrap);
  }
  function dispose(){
    if(destroyed)return;destroyed=true;audio();
    try{w.app?.app?.destroy?.();}finally{scope.dispose();view.mount.remove();}
  }
  const ready=new Promise(async (resolve,reject)=>{
    try{
      resize();scope.run(SOURCE.engine);
      await Promise.all([w.pc.waitForBox2D,w.pc.waitForMecanim]);
      wire();
      w.pc.TextGenerator.fontRatio=2;
      w.app=new w.LunaUnity.Application(view.root.querySelector('#application-canvas'),w.$environment,new w.LunaUnity.Application.StartupScene('-1',SOURCE.scene));
      const task=w.app.InitializeAsync?w.app.InitializeAsync():w.System.Threading.Tasks.Task.fromResult(true);
      task.continueWith(function(done){
        if(done?.exception){dispose();reject(new Error(String(done.exception)));return;}
        audio();scope.pause();
        resolve({
          start(){if(destroyed)return;if(started)return startPromise;started=true;scope.resume();
            startPromise=new Promise((resolve,reject)=>{
              try{w.app.StartWithJSCallback(function(){
                if(destroyed){resolve();return;}
                try{view.root.querySelector('#application-preloader')?.remove();audio();resize();resolve();}catch(error){reject(error);}
              });audio();}catch(error){reject(error);}
            });return startPromise;
          },
          pause(){if(!started||paused||destroyed)return;paused=true;w.Luna.Unity.LifeCycle.OnPause?.();w.app.app?.pause?.();audio();scope.pause();},
          resume(){if(!started||!paused||destroyed)return;paused=false;scope.resume();w.Luna.Unity.LifeCycle.OnResume?.();w.app.app?.resume?.();audio();},
          setEnv(patch){env={...env,...patch};resize();audio();},
          destroy:dispose
        });
      });
    }catch(error){dispose();reject(error);}
  });
  return ready;
});
