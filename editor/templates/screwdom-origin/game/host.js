// Product assembly host. This file is excluded from the standalone game ZIP.
(function(){
  const config=window.SCREWDOM_CONFIG,root=document.getElementById('screwdom-game'),status=document.getElementById('screwdom-status'),replay=document.getElementById('screwdom-replay');
  const result=document.getElementById('screwdom-result'),resultTitle=document.getElementById('screwdom-result-title'),resultCopy=document.getElementById('screwdom-result-copy');
  let entry,instance,entered=!config.intro,started=false,settled=false,steps=0,generation=0,creating=false,replayPending=false,muted=false,viewable=true;
  const policy=config.policy||{enabled:false,mode:'steps',afterSteps:20,intervals:[]};
  let nextCta=policy.afterSteps,intervalIndex=0,autoJumped=false,lastCta=-Infinity;
  const chain=config.intro?['video','playable']:['playable'];
  const sdk=()=>window.NovvyPlayable;
  const call=(name,...args)=>{try{sdk()?.[name]?.(...args);}catch(error){console.warn('Screwdom host SDK',error);}};
  call('setStageList',chain);call('setStage',1,chain[0]);
  const safeProbe=document.createElement('div');
  safeProbe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.append(safeProbe);
  const environment=()=>{
    const style=getComputedStyle(safeProbe),safeArea={top:parseFloat(style.paddingTop)||0,right:parseFloat(style.paddingRight)||0,bottom:parseFloat(style.paddingBottom)||0,left:parseFloat(style.paddingLeft)||0};
    const hud=document.getElementById('novvy-training-hud'),card=document.getElementById('novvy-cta');
    const top=config.title&&hud?hud.getBoundingClientRect().bottom+10:0;
    // offsetHeight is stable while the shared card slides in; its translated
    // bounding rect would under-reserve space and overlap the lowest screws.
    const bottom=card&&!card.hidden?card.offsetHeight+8:0;
    document.documentElement.style.setProperty('--screwdom-cta-inset',bottom+'px');
    document.documentElement.style.setProperty('--screwdom-top-inset',Math.max(top,safeArea.top+12)+'px');
    return {api:1,platform:/Android/i.test(navigator.userAgent)?'android':/iPhone|iPad/i.test(navigator.userAgent)?'ios':'web',language:navigator.language,mode:'preview',viewport:{width:root.clientWidth,height:root.clientHeight,dpr:devicePixelRatio},safeArea,orientation:innerWidth>innerHeight?'landscape':'portrait',muted,insets:{top,bottom}};
  };
  function showResult(kind){
    resultTitle.textContent=kind==='win'?'You win!':kind==='fail'?'Out of space':kind==='error'?'Unable to load':'Round complete';
    resultCopy.textContent=kind==='win'?'All screws cleared.':kind==='fail'?'Try a different color order.':kind==='error'?'Please try loading the puzzle again.':'Start a fresh puzzle and try again.';
    replay.hidden=!config.allowReplay;replay.textContent=kind==='win'?'Play again':'Try again';
    result.hidden=false;root.inert=true;
    (config.allowReplay&&!replay.disabled?replay:result).focus({preventScroll:true});
  }
  function finish(kind){if(!started||settled)return;settled=true;showResult(kind);
    if(kind==='end'){if(!config.allowReplay)call('endStage');}else call('onComplete',{result:kind,continue_playing:config.allowReplay});
    if(kind==='win'&&policy.enabled!==false&&(policy.mode==='complete'||!autoJumped)){
      if(click('forced_click_to_appstore',{scene:'playable-complete',auto_jump:'true',auto_jump_mode:'win'}))autoJumped=true;
    }
  }
  function click(source,details={}){
    if(!started||creating||document.hidden||!viewable||performance.now()-lastCta<1000)return false;
    if(source!=='cta_click'&&source!=='forced_click_to_appstore')return false;
    lastCta=performance.now();
    if(typeof sdk()?.click==='function')call('click',{...details,click_source:source});
    else console.info('[Screwdom CTA preview]',{...details,click_source:source});
    return true;
  }
  function step(percent){
    if(!started||settled||document.hidden||!viewable)return;
    steps++;call('onStep',steps,{progress:percent});
    // Only the product assembly owns automatic navigation. The independent
    // game reports successful screw actions without any store policy.
    if(policy.enabled!==false&&policy.mode==='steps'&&steps>=nextCta&&click('forced_click_to_appstore',{scene:'playable-steps',auto_jump:'true',auto_jump_mode:'steps',step:steps})){
      autoJumped=true;
      const gap=policy.intervals[Math.min(intervalIndex++,policy.intervals.length-1)];
      nextCta=gap?steps+gap:Infinity;
    }
  }
  const shell={step,win(){finish('win');},fail(){finish('fail');},end(){finish('end');},retry(){call('onReplay');},level(){},sound(value){muted=value===true;instance?.setEnv({muted});},haptic(){},cta:click};
  async function begin(){if(!instance||!entered||started)return;const token=generation;started=true;
    if(config.ctaEnabled){window.__novvyCtaCardPhase='bar';window.dispatchEvent(new CustomEvent('novvy:cta-card',{detail:{phase:'bar'}}));}
    instance.setEnv(environment());await instance.start();if(token!==generation)return;
    creating=false;status.hidden=true;replay.disabled=false;result.hidden=true;root.inert=false;
    if(replayPending)root.focus({preventScroll:true});
    if(replayPending){replayPending=false;call('onReplay');}
    if(document.hidden||!viewable)instance.pause();
  }
  function loadFailed(error){creating=false;started=false;settled=true;instance?.destroy();instance=null;replay.disabled=false;status.hidden=true;showResult('error');console.error(error);}
  async function create(restarting=false){if(creating)return;creating=true;
    // Close the whole result before rebuilding; hiding only its button leaves
    // a smaller stale dialog visible throughout the asynchronous scene load.
    result.hidden=true;
    const token=++generation;instance?.destroy();instance=null;started=false;settled=false;touched=false;steps=0;nextCta=policy.afterSteps;intervalIndex=0;autoJumped=false;replayPending=restarting;replay.hidden=true;replay.disabled=true;root.inert=true;status.hidden=false;status.textContent='Loading…';
    try{const game=await entry(root,shell,{base:'./',env:environment(),config:{}});if(token!==generation){game.destroy?.();return;}instance=game;await begin();}
    catch(error){if(token===generation)loadFailed(error);}
  }
  result.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    event.preventDefault();
    (!replay.hidden&&!replay.disabled?replay:result).focus({preventScroll:true});
  });
  window.NovvyGame=function(factory){entry=factory;create();};
  window.addEventListener('novvy:intro-finished',()=>{if(entered)return;entered=true;call('setStage',chain.length,'playable');begin().catch(loadFailed);});
  replay.addEventListener('click',()=>{if(!settled||!config.allowReplay||creating)return;create(started||replayPending);});
  let touched=false;
  root.addEventListener('pointerdown',()=>{if(started&&!settled&&!touched){touched=true;call('onStart');}},{passive:true});
  const resize=()=>instance?.setEnv(environment());
  window.addEventListener('resize',resize);
  const observer=new ResizeObserver(resize);
  for(const element of [root,document.getElementById('novvy-training-hud'),document.getElementById('novvy-cta')])if(element)observer.observe(element);
  window.addEventListener('novvy:cta-interact',()=>{if(config.ctaEnabled)click('cta_click',{scene:'cta-card'});});
  
  const syncVisibility=()=>{if(document.hidden||!viewable)instance?.pause();else if(started)instance?.resume();};
  document.addEventListener('visibilitychange',syncVisibility);
  window.addEventListener('novvy:viewablechange',event=>{viewable=event.detail?.viewable===true;syncVisibility();});
  window.addEventListener('pagehide',()=>{if(started)call('endStage');generation++;observer.disconnect();instance?.destroy();});
  const video=document.getElementById('novvy-intro-video');
  document.getElementById('novvy-intro-sound')?.addEventListener('click',()=>queueMicrotask(()=>{muted=video.muted;instance?.setEnv({muted});}));
  try{if(video)window.NovvyAnalytics?.registerMedia(video,{name:'intro_video'});}catch(_){}
})();
