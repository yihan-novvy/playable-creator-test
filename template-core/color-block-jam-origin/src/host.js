// Product assembly host. This file is excluded from the standalone game ZIP.
(function(){
  const config=window.COLOR_BLOCK_JAM_CONFIG,root=document.getElementById('color-block-jam-game'),status=document.getElementById('color-block-jam-status'),replay=document.getElementById('color-block-jam-replay');
  const result=document.getElementById('color-block-jam-result'),resultTitle=document.getElementById('color-block-jam-result-title'),resultCopy=document.getElementById('color-block-jam-result-copy'),continueButton=document.getElementById('color-block-jam-continue');
  let entry,instance,entered=!config.intro,started=false,settled=false,steps=0,generation=0,creating=false,replayPending=false,muted=false,viewable=true,currentLevel=1;
  let returnPending=false,leftForStore=false,pageSuspended=false,loadError=false,stageEnded=false,resultKind='win';
  const policy=config.policy||{enabled:false,mode:'steps',afterSteps:12,intervals:[]};
  let nextCta=policy.afterSteps,intervalIndex=0,autoJumped=false,lastCta=-Infinity;
  const chain=config.intro?['video','playable']:['playable'];
  const sdk=()=>window.NovvyPlayable;
  const call=(name,...args)=>{try{sdk()?.[name]?.(...args);}catch(error){console.warn('Color Block Jam host SDK',error);}};
  call('setStageList',chain);call('setStage',1,chain[0]);
  const safeProbe=document.createElement('div');
  safeProbe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.append(safeProbe);
  const environment=()=>{
    const style=getComputedStyle(safeProbe),safeArea={top:parseFloat(style.paddingTop)||0,right:parseFloat(style.paddingRight)||0,bottom:parseFloat(style.paddingBottom)||0,left:parseFloat(style.paddingLeft)||0};
    const hud=document.getElementById('novvy-training-hud'),card=document.getElementById('novvy-cta');
    const top=config.title&&hud?hud.getBoundingClientRect().bottom+10:0;
    // offsetHeight is stable while the shared card slides in; its translated
    // bounding rect would under-reserve space and overlap the lowest blocks.
    const bottom=card&&!card.hidden?card.offsetHeight+8:0;
    document.documentElement.style.setProperty('--color-block-jam-cta-inset',bottom+'px');
    document.documentElement.style.setProperty('--color-block-jam-hud-inset',top+'px');
    return {api:1,platform:/Android/i.test(navigator.userAgent)?'android':/iPhone|iPad/i.test(navigator.userAgent)?'ios':'web',language:navigator.language,mode:'preview',viewport:{width:root.clientWidth,height:root.clientHeight,dpr:devicePixelRatio},safeArea,orientation:innerWidth>innerHeight?'landscape':'portrait',muted,insets:{top,bottom}};
  };
  function showResult(kind){
    resultKind=kind;resultTitle.textContent=kind==='fail'?'Try again!':'You win!';
    resultCopy.textContent=kind==='fail'?'Give it another try.':'All blocks cleared!';
    replay.textContent=kind==='fail'?'Try Again':'Retry';replay.disabled=false;continueButton.hidden=false;result.hidden=false;
    root.inert=true;instance?.pause();replay.focus();
  }
  function finish(kind){if(!started||settled)return;settled=true;
    if(kind==='end'){endStage();return;}
    if(config.allowReplay)showResult(kind);
    call('onComplete',{result:kind,continue_playing:config.allowReplay});
    if(kind==='win'&&policy.enabled!==false&&(policy.mode==='complete'||!autoJumped)){
      if(click('forced_click_to_appstore',{scene:'playable-complete',auto_jump:'true',auto_jump_mode:'win'}))autoJumped=true;
    }
  }
  function click(source,details={}){
    if(!started||creating||document.hidden||!viewable||pageSuspended||performance.now()-lastCta<1000)return false;
    if(source!=='cta_click'&&source!=='forced_click_to_appstore')return false;
    if(typeof sdk()?.click==='function'){
      try{if(sdk().click({...details,click_source:source})===false)return false;}
      catch(error){console.warn('Color Block Jam host SDK',error);return false;}
    }else console.info('[Color Block Jam CTA preview]',{...details,click_source:source});
    lastCta=performance.now();
    return true;
  }
  function step(percent){
    if(!started||settled||document.hidden||!viewable)return;
    steps++;call('onStep',steps,{progress:((currentLevel-1)*100+percent)/3});
    // Only the product assembly owns automatic navigation. The independent
    // game reports successful block moves without any store policy.
    if(policy.enabled!==false&&policy.mode==='steps'&&steps>=nextCta&&click('forced_click_to_appstore',{scene:'playable-steps',auto_jump:'true',auto_jump_mode:'steps',step:steps})){
      autoJumped=true;
      const gap=policy.intervals[Math.min(intervalIndex++,policy.intervals.length-1)];
      nextCta=gap?steps+gap:Infinity;
    }
  }
  const shell={step,win(options){if(!options?.continuePlaying)finish('win');},fail(){finish('fail');},end(){finish('end');},retry(){call('onReplay');},level(n){currentLevel=n;},sound(value){muted=value===true;instance?.setEnv({muted});},haptic(){},cta:click};
  async function begin(){if(!instance||!entered||started)return;const token=generation;started=true;
    if(config.ctaEnabled){window.__novvyCtaCardPhase='bar';window.dispatchEvent(new CustomEvent('novvy:cta-card',{detail:{phase:'bar'}}));}
    instance.setEnv(environment());await instance.start();if(token!==generation)return;
    creating=false;status.hidden=true;result.hidden=true;root.inert=false;replay.disabled=false;
    if(replayPending){replayPending=false;call('onReplay');}
    if(document.hidden||!viewable||pageSuspended)instance.pause();
  }
  function loadFailed(error){creating=false;started=false;settled=true;loadError=true;instance?.destroy();instance=null;replay.disabled=false;replay.textContent='Reload';resultTitle.textContent='Unable to load';resultCopy.textContent='Please try loading the game again.';continueButton.hidden=true;result.hidden=false;status.hidden=true;console.error(error);}
  async function create(restarting=false){if(creating||stageEnded)return;creating=true;const token=++generation;instance?.destroy();instance=null;started=false;settled=false;touched=false;steps=0;currentLevel=1;nextCta=policy.afterSteps;intervalIndex=0;autoJumped=false;replayPending=restarting;returnPending=false;leftForStore=false;loadError=false;continueButton.hidden=true;replay.disabled=true;
    if(result.hidden){status.hidden=false;status.textContent='Loading…';}else{replay.textContent='Preparing…';resultCopy.textContent='Getting the blocks ready.';}
    // Ignore late callbacks from an old instance after a replay or unload.
    const scopedShell=Object.fromEntries(Object.entries(shell).map(([name,fn])=>[name,(...args)=>{if(token===generation)return fn(...args);} ]));
    try{const game=await entry(root,scopedShell,{base:'./',env:environment(),config:{}});if(token!==generation){game.destroy?.();return;}instance=game;await begin();}
    catch(error){if(token===generation)loadFailed(error);}
  }
  function endStage(){if(stageEnded)return;stageEnded=true;returnPending=false;leftForStore=false;call('endStage');result.hidden=true;root.inert=false;}
  continueButton.addEventListener('click',()=>{if(!settled||returnPending||creating)return;endStage();});
  window.NovvyGame=function(factory){entry=factory;create();};
  window.addEventListener('novvy:intro-finished',()=>{if(entered)return;entered=true;call('setStage',chain.length,'playable');begin().catch(loadFailed);});
  replay.addEventListener('click',()=>{
    if(!settled||creating||returnPending||stageEnded)return;
    // Loading failures are not a gameplay result and do not open the store.
    if(loadError){create(replayPending);return;}
    if(!config.allowReplay)return;
    returnPending=true;leftForStore=false;replay.disabled=true;continueButton.hidden=true;
    replay.textContent='Waiting…';resultCopy.textContent='Return to the game to play again.';
    // Arm before click: native SDKs can synchronously change viewability.
    if(!click('forced_click_to_appstore',{scene:'playable-replay',result:resultKind})){
      returnPending=false;leftForStore=false;showResult(resultKind);
    }
  });
  let touched=false;
  root.addEventListener('pointerdown',()=>{if(started&&!settled&&!touched){touched=true;call('onStart');}},{passive:true});
  const resize=()=>instance?.setEnv(environment());
  window.addEventListener('resize',resize);
  const observer=new ResizeObserver(resize);
  for(const element of [root,document.getElementById('novvy-training-hud'),document.getElementById('novvy-cta')])if(element)observer.observe(element);
  window.addEventListener('novvy:cta-interact',()=>{if(config.ctaEnabled&&!returnPending)click('cta_click',{scene:'cta-card'});});
  
  const syncVisibility=()=>{
    const hidden=document.hidden||!viewable||pageSuspended;
    if(returnPending){
      if(hidden)leftForStore=true;
      else if(leftForStore){returnPending=false;leftForStore=false;create(true);return;}
    }
    if(hidden||returnPending||(!result.hidden&&settled))instance?.pause();else if(started&&!stageEnded)instance?.resume();
  };
  document.addEventListener('visibilitychange',syncVisibility);
  window.addEventListener('novvy:viewablechange',event=>{viewable=event.detail?.viewable===true;syncVisibility();});
  window.addEventListener('pagehide',event=>{
    if(event.persisted){pageSuspended=true;syncVisibility();return;}
    if(started&&!stageEnded)endStage();returnPending=false;generation++;observer.disconnect();instance?.destroy();
  });
  window.addEventListener('pageshow',()=>{pageSuspended=false;syncVisibility();});
  const video=document.getElementById('novvy-intro-video');
  document.getElementById('novvy-intro-sound')?.addEventListener('click',()=>queueMicrotask(()=>{muted=video.muted;instance?.setEnv({muted});}));
  try{if(video)window.NovvyAnalytics?.registerMedia(video,{name:'intro_video'});}catch(_){}
})();
