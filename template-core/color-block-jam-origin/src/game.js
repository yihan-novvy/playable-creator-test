NovvyGame(async function(container,shell,options){
  options=options||{};
  const view=engineRoot(container,SOURCE.markup,SOURCE.css);
  const resources=SOURCE.resources,scope=createEngineScope(view.root,resources,'Color Block Jam');
  view.root.style.pointerEvents='none';
  let sceneReady;
  const ready=new Promise(resolve=>{sceneReady=resolve;});
  let cc,adapter,started=false,paused=true,destroyed=false,env=options.env||{};
  const sound=()=>{
    const mute=!started||paused||env.muted;
    adapter?.sound(mute);
    for(const context of scope.audioContexts){if(mute)context.suspend().catch(()=>{});else context.resume().catch(()=>{});}
  };
  try{
    // Minimal adapter for the source's channel lifecycle. No advertising SDK,
    // analytics transport or store navigation is carried into game.js.
    scope.window.MW_CONFIG={};
    scope.window.mvPlayable={channel:'web',disable_global_click:true,disable_auto_click:true,disable_induce_click:false,addEventListener(){},sendGameEvent(type){if(type==='gameReady')sceneReady();},sendAction(){},install(){}};
    scope.window.loadEmbeddedScript=source=>scope.run(source);
    scope.run(resources['src/polyfills.bundle.js']);scope.run(resources['src/system.bundle.js']);
    const system=scope.window.System;
    const dataGlobals={'assets.js':['assetsMap'],'data.js':['assetsPackage'],'dataMap.js':['assetsKeyMap','metaDatasMap'],'picDesc.js':['picDesc'],'src/settings.js':['cocosSettings']};
    for(const key of Object.keys(resources))if(!['src/polyfills.bundle.js','src/system.bundle.js'].includes(key)){
      const globals=dataGlobals[key]||[];
      scope.run((globals.length?'var '+globals.join(',')+';':'')+resources[key]+'\n'+globals.map(name=>'window.'+name+'='+name+';').join(''));
    }
    system.prepareImport=()=>Promise.resolve();
    const resolve=system.resolve.bind(system);
    system.resolve=function(name,parent){
      if(name==='cc')return 'chunks:///cc.js';
      if(system.registerRegistry?.[name])return name;
      if(name.startsWith('../src/chunks/'))return 'chunks:///src/chunks/'+name.split('/').pop();
      return resolve(name,parent||'chunks:///index.js');
    };
    cc=await system.import('chunks:///cc.js');scope.window.cc=cc;
    await system.import('chunks:///downloadHandle.js');
    const {Application}=await system.import('chunks:///application.js');
    const application=new Application();application.init(cc);
    cc.game.onPostProjectInitDelegate.add(async()=>{adapter=await colorBlockJamAdapter({cc,system,scope,shell,isRunning:()=>started&&!paused&&!destroyed});});
    await cc.game.init({debugMode:cc.DebugMode.ERROR,settingsPath:'',overrideSettings:{profiling:{showFPS:false},splashScreen:{totalTime:0}}});
    cc.game.run();
    await ready;
    cc.game.pause();scope.pause();sound();view.root.style.pointerEvents='none';
    function setEnv(patch){
      env={...env,...patch,viewport:{...env.viewport,...patch.viewport},insets:{...env.insets,...patch.insets},safeArea:{...env.safeArea,...patch.safeArea}};
      scope.window.devicePixelRatio=Math.min(2,env.viewport?.dpr||window.devicePixelRatio||1);
      scope.window.dispatchEvent(new Event('resize'));adapter?.layout(env);sound();
    }
    setEnv(env);
    return {
      start(){if(started||destroyed)return;started=true;paused=false;scope.resume();cc.game.resume();adapter?.start();setEnv(env);view.root.style.pointerEvents='auto';},
      pause(){if(destroyed)return;paused=true;view.root.style.pointerEvents='none';cc.game.pause();scope.pause();sound();},
      resume(){if(!started||destroyed)return;paused=false;view.root.style.pointerEvents='auto';scope.resume();cc.game.resume();sound();},
      setEnv,
      destroy(){if(destroyed)return;destroyed=true;try{cc.game.pause();cc.director.getScene()?.destroy();cc.assetManager.releaseAll();cc.director.root?.destroy();}finally{scope.dispose();view.mount.remove();}}
    };
  }catch(error){destroyed=true;scope.dispose();view.mount.remove();throw error;}
});
