// Runs in the same instance-local scope as the unmodified native scene functions.
var pmContext=window.PM_CONTEXT,pmEnv={...pmContext.env},pmStarted=false,pmPaused=false,pmDestroyed=false,pmEnded=false,pmApplying=false;
function pmRunning(){return pmStarted&&!pmPaused&&!pmDestroyed;}
function pmFinish(){
  if(!pmRunning()||pmEnded)return;
  pmEnded=true;
  // Native nextLevel stops after foundation and shows a store invitation.
  // It is the end of this demonstration, not a fabricated full-makeover win.
  pmContext.shell.end();
}
function getUrlParams(){return {loc:pmEnv.language||'en'};}
var pmNativeSetColor=setColor;
setColor=function(color){if(!pmRunning()||pmEnded||pmApplying)return;pmNativeSetColor(color);pmContext.shell.step(0);};
var pmNativeAddColor=addColor;
addColor=function(){if(!pmRunning()||pmEnded||pmApplying||last_color==null)return;pmApplying=true;pmNativeAddColor();pmContext.shell.step(100);};
function pmAudio(){
  const muted=!pmRunning()||pmEnv.muted===true;
  if(muted){onMuteSounds();pauseAllSounds();}else{onUnmuteSounds();resumeAllSounds();}
}
var pmPlaySound=playSound,pmPlayLoop=playLoopSound;
playSound=function(key){if(pmRunning()&&pmEnv.muted!==true)pmPlaySound(key);};
playLoopSound=function(key){if(pmRunning()&&pmEnv.muted!==true)pmPlayLoop(key);};
function pmResize(){
  if(!stage)return;
  const width=pmContext.root.clientWidth,height=pmContext.root.clientHeight,dpr=Math.min(2,Math.max(1,Number(pmEnv.viewport?.dpr)||window.devicePixelRatio||1));
  GlobalData.width=width;GlobalData.height=height;
  GlobalData.orientation=width<height?'portr':'lands';
  const ratio=width<height?height/lib.properties.height:width/lib.properties.width;
  GlobalData.posRatio=ratio;
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  canvas.style.width='100%';canvas.style.height='100%';
  stage.scaleX=stage.scaleY=ratio*dpr;stage.x=(width-lib.properties.width*ratio)*dpr/2;stage.y=(height-lib.properties.height*ratio)*dpr/2;
  setOrientation();
  const top=Math.max(Number(pmEnv.insets?.top)||0,Number(pmEnv.safeArea?.top)||0),bottom=Math.max(Number(pmEnv.insets?.bottom)||0,Number(pmEnv.safeArea?.bottom)||0);
  // The native content keeps its shared coordinate system (including brush
  // tweens and hit testing). A duplicate original background remains full bleed.
  if(main_mc){
    const contentHeight=top+bottom>0?Math.max(height,ratio*760):height;
    const fit=Math.max(.25,Math.min(1,(height-top-bottom)/contentHeight));
    main_mc.scaleX=main_mc.scaleY=fit;
    main_mc.x=480*(1-fit);main_mc.y=480*(1-fit)+(top-bottom)/(2*ratio);
  }
  if(logo_l)logo_l.visible=top===0;if(logo_r)logo_r.visible=top===0;
  stage.tickOnUpdate=!main_mc;stage.update();stage.tickOnUpdate=true;
}
function pmStart(){
  if(pmStarted||pmDestroyed)return;
  pmStarted=true;
  document.getElementById('loading').style.display='none';document.getElementById('font-preload').style.display='none';
  const scene=new lib.main();stage=new lib.Stage(canvas);stage.addChild(scene);
  pmResize(); // Native frame zero creates the scene references and listeners.
  main_mc.instance.visible=false;scene.shape_1.visible=false;
  stage.addChildAt(new lib.bg_pm(),0);
  createjs.Touch.enable(stage);createjs.Ticker.framerate=lib.properties.fps;createjs.Ticker.addEventListener('tick',stage);
  // The first native frame installs the palette and face listeners.
  pmResize();pmAudio();window.addEventListener('resize',pmResize);
}
canvas=document.getElementById('canvas');
var pmComposition=AdobeAn.getComposition(comp_id);lib=pmComposition.getLibrary();
return new Promise(function(resolve,reject){
  const images=pmComposition.getImages();
  Promise.all(lib.properties.manifest.map(item=>new Promise((done,fail)=>{
    const img=new Image();img.onload=()=>{images[item.id]=img;done();};img.onerror=()=>fail(new Error('Original image unavailable: '+item.id));img.src=item.src;
  }))).then(()=>{
    for(const info of lib.ssMetadata)pmComposition.getSpriteSheet()[info.name]=new createjs.SpriteSheet({images:[images[info.name]],frames:info.frames});
    resolve({
      start:pmStart,
      pause(){if(!pmStarted||pmPaused||pmDestroyed)return;pmPaused=true;stage.mouseEnabled=false;stage.enableDOMEvents(false);createjs.Touch.disable(stage);pmAudio();pmContext.scope.pause();},
      resume(){if(!pmStarted||!pmPaused||pmDestroyed)return;pmPaused=false;pmContext.scope.resume();stage.mouseEnabled=true;stage.enableDOMEvents(true);createjs.Touch.enable(stage);pmAudio();},
      setEnv(patch){pmEnv={...pmEnv,...patch};pmResize();pmAudio();},
      destroy(){if(pmDestroyed)return;pmDestroyed=true;stopAllSounds();createjs.Ticker.removeAllEventListeners();createjs.Ticker.reset();createjs.Tween.removeAllTweens();if(stage){createjs.Touch.disable(stage);stage.enableDOMEvents(false);stage.removeAllEventListeners();stage.removeAllChildren();}if(window.Howler)window.Howler.unload();}
    });
  }).catch(reject);
});
