NovvyGame(async function(container,shell,options){
  options=options||{};
  const view=engineRoot(container,SOURCE.markup,SOURCE.css);
  const resources=SOURCE.resources,scope=createEngineScope(view.root,resources,SOURCE.title),fonts=new Set();
  let cc,started=false,paused=true,destroyed=false,env=options.env||{},adapter;
  const keyFor=url=>{const clean=String(url).split('?')[0];return Object.keys(resources).find(key=>clean===key||clean.endsWith('/'+key));};
  const resource=url=>{const key=keyFor(url);if(!key)throw new Error('Missing embedded resource: '+url);return resources[key];};
  const sound=()=>{for(const context of scope.audioContexts){if(!started||paused||env.muted)context.suspend().catch(()=>{});else context.resume().catch(()=>{});}};
  try{
    scope.window._XMLLocalRequest=scope.window.XMLHttpRequest;
    scope.window._SUPER_URL=scope.window.URL;
    scope.window.super_html_channel='web';
    scope.window.super_html={download(){},game_end(){},is_hide_download(){return true;},is_audio(){return started&&!paused&&!env.muted;}};
    scope.run(resources['src/polyfills.bundle.js']);
    scope.run(resources['src/system.bundle.js']);
    const system=scope.window.System;
    const nativeInstantiate=system.instantiate.bind(system),nativeResolve=system.resolve.bind(system);
    system.prepareImport=()=>Promise.resolve();
    system.resolve=function(name,parent){
      if(name==='cc')return 'https://screwdom.local/cocos-js/cc.js';
      if(system.registerRegistry&&Object.hasOwn(system.registerRegistry,name))return name;
      if(name.startsWith('chunks:')||name.startsWith('virtual:'))return name;
      try{return nativeResolve(name,parent||'https://screwdom.local/index.html');}
      catch(_){return new URL(name,parent||'https://screwdom.local/index.html').href;}
    };
    system.instantiate=function(url,parent){
      if(system.registerRegistry?.[url])return nativeInstantiate(url,parent);
      scope.run(resource(url));
      const registration=system.getRegister();
      if(!registration)throw new Error('Missing module registration: '+url);
      return registration;
    };
    cc=await system.import('cc');scope.window.cc=cc;
    for(const name of ['internal','resources','main'])scope.run(resources['assets/'+name+'/index.js']);
    const downloader=cc.assetManager.downloader;
    const loadScript=(url,config,done)=>{try{scope.run(resource(url));done(null);}catch(error){done(error);}};
    const loadJson=(url,config,done)=>{try{done(null,JSON.parse(resource(url)));}catch(error){done(error);}};
    const loadImage=(url,config,done)=>{const image=new Image();image.onload=()=>done(null,image);image.onerror=()=>done(new Error('Image failed: '+url));image.src=resource(url);};
    const bytes=url=>{const data=resource(url),raw=atob(data.slice(data.indexOf(',')+1));return Uint8Array.from(raw,c=>c.charCodeAt(0)).buffer;};
    downloader.register({'.js':loadScript,'.json':loadJson,'.png':loadImage,'.jpg':loadImage,'.jpeg':loadImage,'.webp':loadImage,'.bin':(url,config,done)=>{try{done(null,bytes(url));}catch(error){done(error);}},'.ttf':(url,config,done)=>{const family='screwdom-'+url.replace(/\W/g,'');const face=new FontFace(family,'url('+resource(url)+')');fonts.add(face);document.fonts.add(face);face.load().then(()=>{if(!destroyed)done(null,family);},error=>{if(!destroyed)done(error);});}});
    view.root.style.pointerEvents='none';
    // Cocos bundle scripts are classic embedded resources; no file:// request.
    scope.window._createLocalJSElement=()=>{
      const element=document.createElement('script');element.type='application/x-screwdom-embedded';let embeddedUrl='';
      Object.defineProperty(element,'src',{get:()=>embeddedUrl,set:value=>{embeddedUrl=value;}});
      element.addEventListener=function(type,callback){if(type==='load')scope.window.setTimeout(()=>{try{scope.run(resource(element.src));callback();}catch(error){console.error(error);}},0);};
      return element;
    };
    const app=await system.import('./application.js','https://screwdom.local/index.html');
    const application=new app.Application();application.init(cc);
    cc.game.onPostProjectInitDelegate.add(async()=>{
      adapter=await screwdomAdapter({cc,system,scope,shell,root:view.root,isRunning:()=>started&&!paused&&!destroyed});
    });
    await cc.game.init({debugMode:cc.DebugMode.ERROR,settingsPath:'src/settings.json',overrideSettings:{profiling:{showFPS:false},splashScreen:{totalTime:0}}});
    await new Promise(resolve => cc.game.run(() => {
      adapter?.start();
      scope.window.requestAnimationFrame(resolve);
    }));
    cc.game.pause();scope.pause();sound();
    view.root.style.pointerEvents='none';
    function setEnv(patch){
      env={...env,...patch,viewport:{...env.viewport,...patch.viewport},insets:{...env.insets,...patch.insets},safeArea:{...env.safeArea,...patch.safeArea}};
      scope.window.devicePixelRatio=Math.min(2,env.viewport?.dpr||window.devicePixelRatio||1);
      scope.window.dispatchEvent(new Event('resize'));adapter?.layout(env);sound();
    }
    setEnv(env);
    return {
      start(){if(started||destroyed)return;started=true;paused=false;scope.resume();cc.game.resume();setEnv(env);view.root.style.pointerEvents='auto';},
      pause(){if(destroyed)return;paused=true;view.root.style.pointerEvents='none';cc.game.pause();scope.pause();sound();},
      resume(){if(!started||destroyed)return;paused=false;view.root.style.pointerEvents='auto';scope.resume();cc.game.resume();sound();},
      setEnv,
      destroy(){if(destroyed)return;destroyed=true;try{cc.game.pause();cc.director.getScene()?.destroy();cc.game.destroy?.();}finally{fonts.forEach(face=>document.fonts.delete(face));fonts.clear();scope.dispose();view.mount.remove();}}
    };
  }catch(error){destroyed=true;fonts.forEach(face=>document.fonts.delete(face));fonts.clear();scope.dispose();view.mount.remove();throw error;}
});
