NovvyGame(function(container,shell,options){
  options=options||{};
  let env={...(options.env||{})},started=false,paused=false,destroyed=false,settled=false,layout=()=>{};
  const view=engineRoot(container,SOURCE.markup,SOURCE.css),scope=createEngineScope(view.root),w=scope.window;
  const running=()=>started&&!paused&&!destroyed&&!settled;
  const buffer=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0)).buffer;
  w.jsons=structuredClone(SOURCE.jsons);
  w.sounds=Object.fromEntries(Object.entries(SOURCE.sounds).map(([key,value])=>[key,buffer(value)]));
  w.blobs=Object.fromEntries(Object.entries(SOURCE.blobs).map(([key,value])=>[key,buffer(value)]));
  scope.run(SOURCE.config);
  scope.run(SOURCE.input);
  w.$environment.baseUrl=options.base||'./';
  w.$environment.packageConfig.languages=[env.language||'en',env.language||'en'];
  w.pi={logCustomEvent(){},logError(){},logEvent(){}};
  function audio(){
    const muted=!started||paused||destroyed||env.muted===true;
    if(w.UnityEngine?.AudioListener)w.UnityEngine.AudioListener.volume=muted?0:1;
    const app=w.app?.app;if(app)(muted?app.muteAudio:app.unmuteAudio)?.call(app);
    scope.audioContexts.forEach(c=>{if(c.state!=='closed')(muted?c.suspend():c.resume()).catch(()=>{});});
  }
  function resize(){w.dispatchEvent(new Event('resize'));layout();}
  function finish(kind){if(!running())return;settled=true;if(kind==='win')shell.win();else shell.fail();}
  function dispose(){if(destroyed)return;destroyed=true;audio();try{w.app?.app?.destroy?.();}finally{scope.dispose();view.mount.remove();}}
  return new Promise(async(resolve,reject)=>{
    try{
      scope.run(SOURCE.engine);
      await Promise.all([w.pc.waitForBox2D,w.pc.waitForMecanim]);
      if(destroyed)return;
      layout=installPixelFlow(w,view.root,shell,()=>env,running,finish,SOURCE.pixelCount);
      w.pc.TextGenerator.fontRatio=2;
      w.app=new w.LunaUnity.Application(view.root.querySelector('#application-canvas'),w.$environment,new w.LunaUnity.Application.StartupScene('-1',SOURCE.scene));
      const task=w.app.InitializeAsync?w.app.InitializeAsync():w.System.Threading.Tasks.Task.fromResult(true);
      task.continueWith(function(done){
        if(done?.exception){dispose();reject(new Error(String(done.exception)));return;}
        audio();scope.pause();
        resolve({
          start(){if(started||destroyed)return;started=true;scope.resume();
            return new Promise(resolve=>{w.app.StartWithJSCallback(function(){view.root.querySelector('#application-preloader')?.remove();audio();resize();resolve();});audio();});},
          pause(){if(!started||paused||destroyed)return;paused=true;w.Luna.Unity.LifeCycle.OnPause?.();w.app.app?.pause?.();audio();scope.pause();},
          resume(){if(!started||!paused||destroyed)return;paused=false;scope.resume();w.Luna.Unity.LifeCycle.OnResume?.();w.app.app?.resume?.();audio();},
          setEnv(patch){env={...env,...patch};if(patch.language)w.$environment.packageConfig.languages=[patch.language,patch.language];resize();audio();},
          destroy:dispose
        });
      });
    }catch(error){dispose();reject(error);}
  });
});
