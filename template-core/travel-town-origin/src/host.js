// Product assembly host. This file is excluded from the standalone game ZIP.
(function(){
  const config=window.TRAVEL_TOWN_CONFIG,root=document.getElementById('travel-town-game'),status=document.getElementById('travel-town-status'),replay=document.getElementById('travel-town-replay');
  const dialog=document.getElementById('travel-town-result'),title=document.getElementById('travel-town-result-title'),copy=document.getElementById('travel-town-result-copy');
  let entry,instance,entered=!config.intro,started=false,settled=false,steps=0,generation=0,creating=false,replayPending=false,muted=false,viewable=true;
  let replayRequest=null,pageSuspended=false,blurred=false,lastResult='win',ended=false;
  const policy=config.policy||{enabled:true,mode:'complete',afterSteps:20,intervals:[10,8,6,4]};
  let nextCta=policy.afterSteps,intervalIndex=0,lastCta=-Infinity;
  const chain=config.intro?['video','playable']:['playable'];
  const sdk=()=>window.NovvyPlayable;
  // Keep SDK calls explicit so the original-ZIP inspector can recognize them.
  const call=(name,...args)=>{try{
    if(sdk()?.[name]==null)return;
    switch(name){
      case 'setStageList': window.NovvyPlayable.setStageList(...args);break;
      case 'setStage': window.NovvyPlayable.setStage(...args);break;
      case 'onStep': window.NovvyPlayable.onStep(...args);break;
      case 'onStart': window.NovvyPlayable.onStart(...args);break;
      case 'onComplete': window.NovvyPlayable.onComplete(...args);break;
      case 'onReplay': window.NovvyPlayable.onReplay(...args);break;
      case 'endStage': window.NovvyPlayable.endStage(...args);break;
    }
  }catch(error){console.warn('Travel Town host SDK',error);}};
  call('setStageList',chain);call('setStage',1,chain[0]);
  const safeProbe=document.createElement('div');
  safeProbe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.append(safeProbe);
  const environment=()=>{
    const style=getComputedStyle(safeProbe),safeArea={top:parseFloat(style.paddingTop)||0,right:parseFloat(style.paddingRight)||0,bottom:parseFloat(style.paddingBottom)||0,left:parseFloat(style.paddingLeft)||0};
    const hud=document.getElementById('novvy-training-hud'),card=document.getElementById('novvy-cta');
    const top=config.title&&hud?hud.getBoundingClientRect().bottom+10:0;
    // offsetHeight is stable while the shared card slides in; its translated
    // bounding rect would under-reserve space and overlap the lowest board row.
    const bottom=card&&!card.hidden?card.offsetHeight+8:0;
    document.documentElement.style.setProperty('--travel-town-hud-inset',Math.max(top,safeArea.top)+'px');
    document.documentElement.style.setProperty('--travel-town-cta-inset',bottom+'px');
    return {api:1,platform:/Android/i.test(navigator.userAgent)?'android':/iPhone|iPad/i.test(navigator.userAgent)?'ios':'web',language:navigator.language,mode:'preview',viewport:{width:root.clientWidth,height:root.clientHeight,dpr:devicePixelRatio},safeArea,orientation:innerWidth>innerHeight?'landscape':'portrait',muted,insets:{top,bottom}};
  };
  function showResult(kind,message){
    lastResult=kind;title.textContent=kind==='win'?'You win!':'Try a fresh start!';
    copy.textContent=message||(kind==='win'?'The room is looking better!':'Merge matching items and try again.');
    replay.textContent=kind==='win'?'Retry':'Try again';replay.disabled=false;
    replay.hidden=!config.allowReplay;
    dialog.hidden=!config.allowReplay;
    if(!dialog.hidden)replay.focus({preventScroll:true});
  }
  function finish(kind){if(!started||settled||ended)return;settled=true;showResult(kind);
    if(kind==='end'){if(!config.allowReplay)call('endStage');}else call('onComplete',{result:kind,continue_playing:config.allowReplay});
    if(kind==='win'&&policy.enabled===true&&policy.mode==='complete'){
      click('forced_click_to_appstore',{scene:'playable-complete',auto_jump:'true',auto_jump_mode:'win'});
    }
  }
  function click(source,details={}){
    if(!started||creating||document.hidden||!viewable||pageSuspended||performance.now()-lastCta<1000)return false;
    if(source!=='cta_click'&&source!=='forced_click_to_appstore')return false;
    const previous=lastCta;lastCta=performance.now();
    try{
      if(typeof sdk()?.click==='function')window.NovvyPlayable.click({...details,click_source:source});
      else console.info('[Travel Town CTA preview]',{...details,click_source:source});
    }catch(error){lastCta=previous;console.warn('Travel Town CTA failed',error);return false;}
    return true;
  }
  function step(percent){
    if(!started||settled||document.hidden||!viewable)return;
    steps++;call('onStep',steps,{progress:percent});
    // Only the product assembly owns automatic navigation. The independent
    // game reports confirmed merge and relocation actions without any store policy.
    if(policy.enabled===true&&policy.mode==='steps'&&steps>=nextCta&&click('forced_click_to_appstore',{scene:'playable-steps',auto_jump:'true',auto_jump_mode:'steps',step:steps})){
      const gap=policy.intervals[Math.min(intervalIndex++,policy.intervals.length-1)];
      nextCta=gap?steps+gap:Infinity;
    }
  }
  const shell={step,win(){finish('win');},fail(){finish('fail');},end(){finish('end');},retry(){call('onReplay');},level(){},sound(value){muted=value===true;instance?.setEnv({muted});},haptic(){},cta:click};
  async function begin(){if(!instance||!entered||started)return;const token=generation;started=true;
    if(config.ctaEnabled){window.__novvyCtaCardPhase='bar';window.dispatchEvent(new CustomEvent('novvy:cta-card',{detail:{phase:'bar'}}));}
    instance.setEnv(environment());await instance.start();if(token!==generation)return;
    creating=false;status.hidden=true;dialog.hidden=true;replay.disabled=false;
    if(replayPending){replayPending=false;call('onReplay');}
    if(document.hidden||!viewable||pageSuspended)instance.pause();
  }
  function loadFailed(error){creating=false;started=false;settled=true;replayRequest=null;instance?.destroy();instance=null;showResult('fail','Unable to restart. Please try again.');status.hidden=config.allowReplay;status.textContent='Unable to load Travel Town: '+error.message;console.error(error);}
  async function create(restarting=false){if(creating||ended)return;creating=true;const token=++generation;instance?.destroy();instance=null;started=false;settled=false;touched=false;steps=0;nextCta=policy.afterSteps;intervalIndex=0;replayPending=restarting;replay.disabled=true;
    if(restarting){dialog.hidden=false;replay.textContent='Preparing…';copy.textContent='Preparing your next try…';status.hidden=true;}
    else{dialog.hidden=true;status.hidden=false;status.textContent='Loading…';}
    try{const game=await entry(root,shell,{base:'./',env:environment(),config:{}});if(token!==generation){game.destroy?.();return;}instance=game;await begin();}
    catch(error){if(token===generation)loadFailed(error);}
  }
  dialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    event.preventDefault();
    if(replay.hidden||replay.disabled)dialog.focus();else replay.focus();
  });
  window.NovvyGame=function(factory){entry=factory;create();};
  window.addEventListener('novvy:intro-finished',()=>{if(entered)return;entered=true;call('setStage',chain.length,'playable');begin().catch(loadFailed);});
  replay.addEventListener('click',()=>{
    if(!settled||!config.allowReplay||creating||replayRequest||ended||document.hidden||!viewable)return;
    // Loading errors are not gameplay results and must remain recoverable.
    if(!started){create(replayPending);return;}
    const request={away:false};replayRequest=request;replay.disabled=true;dialog.focus({preventScroll:true});
    replay.textContent='Waiting…';copy.textContent='Return to the game to play again.';instance?.pause();
    const hasSdk=typeof sdk()?.click==='function';
    // User requested the same replay CTA as Tasty Travels for both results.
    if(!click('forced_click_to_appstore',{scene:'playable-replay',result:lastResult})){
      if(replayRequest===request){replayRequest=null;showResult(lastResult,'Please try again in a moment.');}
      return;
    }
    // Plain editor previews have no destination to return from. Production
    // must observe away -> visible before it can rebuild or report a replay.
    if(!hasSdk&&replayRequest===request){replayRequest=null;create(true);}
  });
  let touched=false;
  root.addEventListener('pointerdown',()=>{if(started&&!settled&&!touched){touched=true;call('onStart');}},{passive:true});
  const resize=()=>instance?.setEnv(environment());
  window.addEventListener('resize',resize);
  const observer=new ResizeObserver(resize);
  for(const element of [root,document.getElementById('novvy-training-hud'),document.getElementById('novvy-cta')])if(element)observer.observe(element);
  window.addEventListener('novvy:cta-interact',()=>{if(config.ctaEnabled)click('cta_click',{scene:'cta-card'});});
  
  const syncVisibility=()=>{
    const hidden=document.hidden||!viewable||pageSuspended;
    if(replayRequest){
      if(hidden||blurred){replayRequest.away=true;instance?.pause();return;}
      if(replayRequest.away){replayRequest=null;create(true);}
      return;
    }
    if(hidden||settled||ended)instance?.pause();else if(started)instance?.resume();
  };
  document.addEventListener('visibilitychange',syncVisibility);
  window.addEventListener('novvy:viewablechange',event=>{viewable=event.detail?.viewable===true;syncVisibility();});
  window.addEventListener('blur',()=>{blurred=true;if(replayRequest)syncVisibility();});
  window.addEventListener('focus',()=>{blurred=false;if(replayRequest)syncVisibility();});
  window.addEventListener('pagehide',event=>{
    if(event.persisted){pageSuspended=true;syncVisibility();return;}
    if(started&&!ended)call('endStage');ended=true;replayRequest=null;generation++;observer.disconnect();instance?.destroy();
  });
  window.addEventListener('pageshow',event=>{if(event.persisted){pageSuspended=false;resize();syncVisibility();}});
  const video=document.getElementById('novvy-intro-video');
  document.getElementById('novvy-intro-sound')?.addEventListener('click',()=>queueMicrotask(()=>{muted=video.muted;instance?.setEnv({muted});}));
  try{if(video)window.NovvyAnalytics?.registerMedia(video,{name:'intro_video'});}catch(_){}
})();
