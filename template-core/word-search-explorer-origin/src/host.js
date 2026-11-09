// Product assembly host. This file is excluded from the standalone game ZIP.
(function(){
  const config=window.WSE_CONFIG,root=document.getElementById('wse-game'),status=document.getElementById('wse-status'),replay=document.getElementById('wse-replay');
  const result=document.getElementById('wse-result'),resultTitle=document.getElementById('wse-result-title'),resultCopy=document.getElementById('wse-result-copy');
  let entry,instance,entered=!config.intro,started=false,settled=false,steps=0,generation=0,creating=false,replayPending=false,muted=config.intro===true,viewable=true;
  const policy=config.policy||{enabled:true,mode:'steps',afterSteps:4,intervals:[4,3,2]};
  let nextCta=policy.afterSteps,intervalIndex=0,lastCta=-Infinity,pendingWinCta=false,winCtaTimer=null;
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
      case 'click': window.NovvyPlayable.click(...args);break;
    }
  }catch(error){console.warn('Word Search Explorer host SDK',error);}};
  call('setStageList',chain);call('setStage',1,chain[0]);
  const safeProbe=document.createElement('div');
  safeProbe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.append(safeProbe);
  const environment=()=>{
    const style=getComputedStyle(safeProbe),safeArea={top:parseFloat(style.paddingTop)||0,right:parseFloat(style.paddingRight)||0,bottom:parseFloat(style.paddingBottom)||0,left:parseFloat(style.paddingLeft)||0};
    if(root.clientHeight>root.clientWidth)safeArea.top=Math.max(54,safeArea.top);
    const hud=document.getElementById('novvy-training-hud'),card=document.getElementById('novvy-cta');
    const top=config.title&&hud?hud.getBoundingClientRect().bottom+10:0;
    // Include the card's full height while its entrance transform is animating.
    const bottom=card&&!card.hidden?Math.max(card.offsetHeight,root.getBoundingClientRect().bottom-card.getBoundingClientRect().top)+8:0;
    document.documentElement.style.setProperty('--wse-cta-inset',bottom+'px');
    document.documentElement.style.setProperty('--wse-top-inset',Math.max(top,safeArea.top+12)+'px');
    return {api:1,platform:/Android/i.test(navigator.userAgent)?'android':/iPhone|iPad/i.test(navigator.userAgent)?'ios':'web',language:navigator.language,mode:'preview',viewport:{width:root.clientWidth,height:root.clientHeight,dpr:devicePixelRatio},safeArea,orientation:innerWidth>innerHeight?'landscape':'portrait',muted,insets:{top,bottom}};
  };
  function showResult(kind){
    resultTitle.textContent=kind==='win'?'You win!':kind==='error'?'Unable to load':kind==='fail'?'Try again':'Round complete';
    resultCopy.textContent=kind==='win'?'All 17 words found.':kind==='error'?'Please try loading the puzzle again.':'Start a fresh puzzle and try again.';
    replay.hidden=!config.allowReplay;replay.textContent=kind==='win'?'Play again':'Try again';
    result.hidden=false;root.inert=true;
    (config.allowReplay&&!replay.disabled?replay:result).focus({preventScroll:true});
  }
  function finish(kind){if(!started||settled)return;settled=true;showResult(kind);
    if(kind==='end'){if(!config.allowReplay)call('endStage');}else call('onComplete',{result:kind,continue_playing:config.allowReplay});
    if(kind==='win'&&policy.enabled!==false){pendingWinCta=true;replay.disabled=true;flushWinCta();}
  }
  function clearWinCta(){clearTimeout(winCtaTimer);winCtaTimer=null;pendingWinCta=false;}
  function flushWinCta(){
    clearTimeout(winCtaTimer);winCtaTimer=null;
    if(!pendingWinCta||!started||document.hidden||!viewable)return;
    const wait=1000-(performance.now()-lastCta);
    if(wait>0){winCtaTimer=setTimeout(flushWinCta,Math.ceil(wait));return;}
    // A real win owns one request even after earlier step jumps. Only its cooldown is deferred.
    pendingWinCta=false;autoClick('win');replay.disabled=false;
  }
  function requestClick(detail){
    if(!started||document.hidden||!viewable||performance.now()-lastCta<1000)return false;
    lastCta=performance.now();
    if(typeof sdk()?.click==='function')call('click',detail);
    else console.info('Word Search Explorer CTA preview '+JSON.stringify(detail));
    return true;
  }
  // Step policies belong to this assembly host; game.js only reports successful words.
  function autoClick(mode){
    const detail={click_source:'forced_click_to_appstore',scene:'playable-'+mode,auto_jump:'true',auto_jump_mode:mode};
    if(mode==='steps')detail.step=steps;
    if(!requestClick(detail))return false;
    return true;
  }
  // Shell-owned download card: the standard banner source is fixed by §2.1.
  function click(){
    const card=document.getElementById('novvy-cta');
    if(config.ctaEnabled!==true||!card||card.hidden)return;
    requestClick({click_source:'cta_click',scene:'cta-card'});
  }
  function step(percent){
    if(!started||settled||document.hidden||!viewable)return;
    steps++;call('onStep',steps,{progress:percent});
    // The last successful word is still reported as a step; its CTA belongs to the win.
    if(percent<100&&policy.enabled!==false&&policy.mode==='steps'&&steps>=nextCta&&autoClick('steps')){
      const gap=policy.intervals[Math.min(intervalIndex++,policy.intervals.length-1)];
      nextCta=gap?steps+gap:Infinity;
    }
  }
  const shell={step,win(){finish('win');},fail(){finish('fail');},end(){finish('end');},retry(){call('onReplay');},level(){},sound(value){muted=value===true;instance?.setEnv({muted});},haptic(){},cta(){}};
  async function begin(){if(!instance||!entered||started)return;const token=generation;started=true;
    window.dispatchEvent(new CustomEvent('novvy:cta-card',{detail:{phase:'bar'}}));
    instance.setEnv(environment());await instance.start();if(token!==generation)return;
    creating=false;status.hidden=true;replay.disabled=false;result.hidden=true;root.inert=false;
    if(replayPending)root.focus({preventScroll:true});
    if(replayPending){replayPending=false;call('onReplay');}
    if(document.hidden||!viewable)instance.pause();
  }
  function loadFailed(error){clearWinCta();creating=false;started=false;settled=true;instance?.destroy();instance=null;replay.disabled=false;status.hidden=true;showResult('error');console.error(error);}
  async function create(restarting=false){if(creating)return;clearWinCta();creating=true;const token=++generation;instance?.destroy();instance=null;started=false;settled=false;touched=false;steps=0;nextCta=policy.afterSteps;intervalIndex=0;replayPending=restarting;replay.hidden=true;replay.disabled=true;root.inert=true;status.hidden=false;status.textContent='Loading…';
    try{const game=await entry(root,shell,{base:'./',env:environment(),config:{}});if(token!==generation){game.destroy?.();return;}instance=game;await begin();}
    catch(error){if(token===generation)loadFailed(error);}
  }
  result.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    event.preventDefault();
    (!replay.hidden&&!replay.disabled?replay:result).focus({preventScroll:true});
  });
  window.NovvyGame=function(factory){entry=factory;create();};
  window.addEventListener('novvy:intro-finished',()=>{if(entered)return;entered=true;muted=document.getElementById('novvy-intro-video')?.muted??muted;call('setStage',chain.length,'playable');begin().catch(loadFailed);});
  replay.addEventListener('click',()=>{if(!settled||!config.allowReplay||creating||pendingWinCta)return;create(started||replayPending);});
  let touched=false;
  root.addEventListener('pointerdown',()=>{if(started&&!settled&&!touched){touched=true;call('onStart');}},{passive:true});
  const resize=()=>instance?.setEnv(environment());
  window.addEventListener('resize',resize);
  const observer=new ResizeObserver(resize);
  for(const element of [root,document.getElementById('novvy-training-hud'),document.getElementById('novvy-cta')])if(element)observer.observe(element);
  window.addEventListener('novvy:cta-interact',click);
  
  const syncVisibility=()=>{if(document.hidden||!viewable){clearTimeout(winCtaTimer);winCtaTimer=null;instance?.pause();}else if(started){instance?.resume();flushWinCta();}};
  document.addEventListener('visibilitychange',syncVisibility);
  window.addEventListener('novvy:viewablechange',event=>{viewable=event.detail?.viewable===true;syncVisibility();});
  window.addEventListener('pagehide',()=>{clearWinCta();if(started)call('endStage');generation++;observer.disconnect();instance?.destroy();});
  const video=document.getElementById('novvy-intro-video');
  document.getElementById('novvy-intro-sound')?.addEventListener('click',()=>queueMicrotask(()=>{muted=video.muted;instance?.setEnv({muted});}));
  try{if(video)window.NovvyAnalytics?.registerMedia(video,{name:'intro_video'});}catch(_){}
})();
