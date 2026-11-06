// Each call gets its own Luna / Bridge / PlayCanvas globals and resource registry.
NovvyGame(function (container, shell, options) {
  options=options||{};
  let env={...(options.env||{})}, started=false, paused=false, destroyed=false, settled=false;
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
    installZenLayout(w,view.root,()=>env,wrap);
    wrap(w.GameMgr,'CreatWordBox',function(original,args){
      const value=original.apply(this,args),total=this.wordBoxList.Count;
      if(!Number.isInteger(total)||total<1)throw new Error('Zen Word board has no words');
      this.victoryTargetTimes=total;
      // Native progress had only four entries for the original three-word demo.
      this.fillAmounts=Array.from({length:total+1},(_,index)=>index/total);
      return value;
    });
    wrap(w.GameMgr,'OnCorrectInput',function(original,args){
      if(!running()||settled)return;
      shell.step(Math.min(100,(this.correctInputTimes+1)/this.victoryTargetTimes*100));
      return original.apply(this,args);
    });
    wrap(w.GameMgr,'OnVictory',function(original,args){
      if(!running()||settled||this.correctInputTimes<this.victoryTargetTimes)return;
      const value=original.apply(this,args);result('win');return value;
    });
    wrap(w.GameMgr,'OnLose',function(original,args){if(!running()||settled)return;const value=original.apply(this,args);result('fail');return value;});
    wrap(w.GameMgr,'Update',function(original,args){this.isPlayAudio=env.muted!==true;const value=original.apply(this,args);if(env.muted)audio();return value;});
    // The user replaced Play Free with the assembly's shared CTA card.
    w.TZ_Script.prototype.ButtonOnClick=function(){};
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
          start(){if(started||destroyed)return;started=true;scope.resume();
            return new Promise(resolve=>{w.app.StartWithJSCallback(function(){view.root.querySelector('#application-preloader')?.remove();audio();resize();resolve();});audio();});},
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
