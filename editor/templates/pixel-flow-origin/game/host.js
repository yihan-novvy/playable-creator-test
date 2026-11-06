// Product assembly host. This file is excluded from the standalone game ZIP.
(function(){
  const config=window.PIXEL_FLOW_CONFIG,root=document.getElementById('pixel-flow-game'),status=document.getElementById('pixel-flow-status'),replay=document.getElementById('pixel-flow-replay');
  const result=document.getElementById('pixel-flow-result'),resultTitle=document.getElementById('pixel-flow-result-title'),resultCopy=document.getElementById('pixel-flow-result-copy');
  let entry,instance,entered=!config.intro,started=false,settled=false,steps=0,generation=0,creating=false,replayPending=false,muted=config.intro===true,viewable=window.__novvyBridgeVersion>=1?window.__novvyViewable===true:true;
  let outcome=null,storeVisit=null,pageHidden=false,loadError=false;
  const policy=config.policy||{enabled:false,mode:'steps',afterSteps:10,intervals:[8,6,4]};
  let nextCta=policy.afterSteps,intervalIndex=0,autoJumped=false,lastCta=-Infinity;
  const chain=config.intro?['video','playable']:['playable'];
  const sdk=()=>window.NovvyPlayable;
  const call=(name,...args)=>{try{sdk()?.[name]?.(...args);}catch(error){console.warn('Pixel Flow! host SDK',error);}};
  call('setStageList',chain);call('setStage',1,chain[0]);
  const safeProbe=document.createElement('div');
  safeProbe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.append(safeProbe);
  const environment=()=>{
    const style=getComputedStyle(safeProbe),safeArea={top:parseFloat(style.paddingTop)||0,right:parseFloat(style.paddingRight)||0,bottom:parseFloat(style.paddingBottom)||0,left:parseFloat(style.paddingLeft)||0};
    const hud=document.getElementById('novvy-training-hud'),card=document.getElementById('novvy-cta');
    const top=config.title&&hud?hud.getBoundingClientRect().bottom+10:0;
    // offsetHeight is stable while the shared card slides in; its translated
    // bounding rect would under-reserve space and overlap the shooter queue.
    const bottom=card&&!card.hidden?card.offsetHeight+8:0;
    document.documentElement.style.setProperty('--pixel-flow-cta-inset',bottom+'px');
    document.documentElement.style.setProperty('--pixel-flow-hud-inset',Math.max(top,safeArea.top)+'px');
    return {api:1,platform:/Android/i.test(navigator.userAgent)?'android':/iPhone|iPad/i.test(navigator.userAgent)?'ios':'web',language:navigator.language,mode:'preview',viewport:{width:root.clientWidth,height:root.clientHeight,dpr:devicePixelRatio},safeArea,orientation:innerWidth>innerHeight?'landscape':'portrait',muted,insets:{top,bottom}};
  };
  function showResult(){
    result.hidden=false;root.inert=true;
    const card=document.getElementById('novvy-cta');if(card)card.inert=true;
    replay.focus();
  }
  function hideResult(){
    result.hidden=true;root.inert=false;
    const card=document.getElementById('novvy-cta');if(card)card.inert=false;
  }
  function finish(kind){if(!started||settled)return;settled=true;outcome=kind;
    if(config.allowReplay){
      resultTitle.textContent=kind==='win'?'You win!':'Try a fresh start!';
      resultCopy.textContent=kind==='win'?'Every pixel cleared. Ready for another round?':'Send your pigs back into the flow.';
      replay.textContent=kind==='win'?'Retry':'Try Again';replay.disabled=false;
      showResult();instance?.pause();
    }
    if(kind==='end'){if(!config.allowReplay)call('endStage');}else call('onComplete',{result:kind,continue_playing:config.allowReplay});
  }
  function click(source,details={}){
    if(!started||creating||document.hidden||pageHidden||!viewable||performance.now()-lastCta<1000)return false;
    if(source!=='cta_click'&&source!=='forced_click_to_appstore')return false;
    const previousCta=lastCta;lastCta=performance.now();
    try{
      if(typeof sdk()?.click==='function'){
        if(sdk().click({...details,click_source:source})===false){lastCta=previousCta;return false;}
      }else console.info('[Pixel Flow! CTA preview] '+JSON.stringify({...details,click_source:source}));
    }catch(error){lastCta=previousCta;console.warn('Pixel Flow! CTA unavailable',error);return false;}
    return true;
  }
  function step(percent){
    if(!started||creating||settled||document.hidden||pageHidden||!viewable)return;
    steps++;call('onStep',steps,{progress:percent});
    // Only the product assembly owns automatic navigation. The independent
    // game reports successful conveyor placements without any store policy.
    if(policy.enabled!==false&&policy.mode==='steps'&&steps>=nextCta&&click('forced_click_to_appstore',{scene:'playable-steps',auto_jump:'true',auto_jump_mode:'steps',step:steps})){
      autoJumped=true;
      const gap=policy.intervals[Math.min(intervalIndex++,policy.intervals.length-1)];
      nextCta=gap?steps+gap:Infinity;
    }
  }
  const shell={step,win(){finish('win');},fail(){finish('fail');},end(){finish('end');},retry(){call('onReplay');},level(){},sound(value){muted=value===true;instance?.setEnv({muted});},haptic(){},cta:click};
  async function begin(){if(!instance||!entered||started||document.hidden||pageHidden||!viewable)return;const token=generation;started=true;
    if(config.ctaEnabled){window.__novvyCtaCardPhase='bar';window.dispatchEvent(new CustomEvent('novvy:cta-card',{detail:{phase:'bar'}}));}
    instance.setEnv(environment());await instance.start();if(token!==generation)return;
    creating=false;status.hidden=true;replay.disabled=false;hideResult();
    if(replayPending){replayPending=false;call('onReplay');}
    if(document.hidden||pageHidden||!viewable)instance.pause();
  }
  function loadFailed(error){creating=false;started=false;settled=true;loadError=true;instance?.destroy();instance=null;replay.disabled=false;replay.textContent='Reload';resultTitle.textContent='Unable to load';resultCopy.textContent='Please try loading the game again.';status.hidden=true;showResult();console.error(error);}
  async function create(restarting=false){if(creating)return;creating=true;const token=++generation;instance?.destroy();instance=null;started=false;settled=false;touched=false;steps=0;nextCta=policy.afterSteps;intervalIndex=0;autoJumped=false;replayPending=restarting;loadError=false;replay.disabled=true;
    hideResult();root.inert=true;status.hidden=false;status.textContent='Loading…';
    try{const game=await entry(root,shell,{base:'./',env:environment(),config:{}});if(token!==generation){game.destroy?.();return;}instance=game;await begin();}
    catch(error){if(token===generation)loadFailed(error);}
  }
  window.NovvyGame=function(factory){entry=factory;create();};
  window.addEventListener('novvy:intro-finished',()=>{if(entered)return;entered=true;muted=document.getElementById('novvy-intro-video')?.muted!==false;call('setStage',chain.length,'playable');begin().catch(loadFailed);});
  replay.addEventListener('click',()=>{
    if(creating||replay.disabled)return;
    // Loading recovery is not a gameplay retry and must not open the store again.
    if(loadError){create(replayPending);return;}
    if(!started||!settled||!config.allowReplay)return;
    storeVisit=typeof sdk()?.click==='function'?{left:false}:null;
    replay.disabled=true;
    // Request CTA once, then immediately reset the round. Visibility only
    // pauses/starts gameplay; it never gates dismissing the result dialog.
    if(click('forced_click_to_appstore',{scene:'playable-replay',result:outcome}))create(true);
    else{storeVisit=null;replay.disabled=false;}
  });
  result.addEventListener('keydown',event=>{if(event.key==='Tab'){event.preventDefault();replay.focus();}});
  let touched=false;
  root.addEventListener('pointerdown',()=>{if(started&&!settled&&!touched){touched=true;call('onStart');}},{passive:true});
  const resize=()=>instance?.setEnv(environment());
  window.addEventListener('resize',resize);
  const observer=new ResizeObserver(resize);
  for(const element of [root,document.getElementById('novvy-training-hud'),document.getElementById('novvy-cta')])if(element)observer.observe(element);
  window.addEventListener('novvy:cta-interact',()=>{if(config.ctaEnabled&&result.hidden)click('cta_click',{scene:'cta-card'});});
  
  const syncVisibility=()=>{
    if(document.hidden||pageHidden||!viewable){if(storeVisit)storeVisit.left=true;instance?.pause();return;}
    if(storeVisit?.left)storeVisit=null;
    if(instance&&!started)begin().catch(loadFailed);
    else if(started&&!(settled&&config.allowReplay))instance?.resume();
  };
  document.addEventListener('visibilitychange',syncVisibility);
  window.addEventListener('novvy:viewablechange',event=>{viewable=event.detail?.viewable===true;syncVisibility();});
  window.addEventListener('pagehide',event=>{
    if(storeVisit||event.persisted){pageHidden=true;syncVisibility();return;}
    if(started)call('endStage');generation++;observer.disconnect();instance?.destroy();
  });
  window.addEventListener('pageshow',()=>{pageHidden=false;syncVisibility();});
  const video=document.getElementById('novvy-intro-video');
  document.getElementById('novvy-intro-sound')?.addEventListener('click',()=>queueMicrotask(()=>{muted=video.muted;instance?.setEnv({muted});}));
  try{if(video)window.NovvyAnalytics?.registerMedia(video,{name:'intro_video'});}catch(_){}
})();
