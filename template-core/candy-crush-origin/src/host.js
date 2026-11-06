// Product assembly host. This file is excluded from the standalone game ZIP.
(function(){
  const config=window.CCS_CONFIG,root=document.getElementById('ccs-game'),status=document.getElementById('ccs-status'),replay=document.getElementById('ccs-replay');
  let entry,instance,entered=!config.intro,started=false,settled=false,steps=0,generation=0,creating=false,replayPending=false,muted=config.intro===true,viewable=true;
  const policy=config.policy||{enabled:true,mode:'steps',afterSteps:10,intervals:[5,4,3,2]};
  let nextCta=policy.afterSteps,intervalIndex=0,autoJumped=false,lastCta=-Infinity;
  const chain=config.intro?['video','playable']:['playable'];
  const sdk=()=>window.NovvyPlayable;
  const call=(name,...args)=>{try{sdk()?.[name]?.(...args);}catch(error){console.warn('Candy Crush Saga host SDK',error);}};
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
    document.documentElement.style.setProperty('--ccs-cta-inset',bottom+'px');
    return {api:1,platform:/Android/i.test(navigator.userAgent)?'android':/iPhone|iPad/i.test(navigator.userAgent)?'ios':'web',language:navigator.language,mode:'preview',viewport:{width:root.clientWidth,height:root.clientHeight,dpr:devicePixelRatio},safeArea,orientation:innerWidth>innerHeight?'landscape':'portrait',muted,insets:{top,bottom}};
  };
  function finish(kind){if(!started||settled)return;settled=true;replay.hidden=!config.allowReplay;replay.textContent=kind==='fail'?'Try again':'Play again';
    if(kind==='end'){if(!config.allowReplay)call('endStage');else document.getElementById('ccs-continue').hidden=false;}else call('onComplete',{result:kind,continue_playing:config.allowReplay});
    if(kind==='win'&&policy.enabled!==false&&!autoJumped)autoClick('win');
  }
  function requestClick(detail){
    if(!started||document.hidden||!viewable||performance.now()-lastCta<1000)return false;
    lastCta=performance.now();
    if(typeof sdk()?.click==='function')call('click',detail);
    else console.info('Candy Crush Saga CTA preview '+JSON.stringify(detail));
    return true;
  }
  // Step policies belong to this assembly host; game.js only reports successful candy hits.
  function autoClick(mode){
    const detail={click_source:'forced_click_to_appstore',scene:'playable-'+mode,auto_jump:'true',auto_jump_mode:mode};
    if(mode==='steps')detail.step=steps;
    if(!requestClick(detail))return false;
    autoJumped=true;return true;
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
    if(policy.enabled!==false&&policy.mode==='steps'&&steps>=nextCta&&autoClick('steps')){
      const gap=policy.intervals[Math.min(intervalIndex++,policy.intervals.length-1)];
      nextCta=gap?steps+gap:Infinity;
    }
  }
  const shell={step,win(){finish('win');},fail(){finish('fail');},end(){finish('end');},retry(){call('onReplay');},level(){},sound(value){muted=value===true;instance?.setEnv({muted});},haptic(){},cta(){}};
  async function begin(){if(!instance||!entered||started)return;const token=generation;started=true;
    window.dispatchEvent(new CustomEvent('novvy:cta-card',{detail:{phase:'bar'}}));
    instance.setEnv(environment());await instance.start();if(token!==generation)return;
    creating=false;status.hidden=true;replay.disabled=false;
    if(replayPending){replayPending=false;call('onReplay');}
    if(document.hidden||!viewable)instance.pause();
  }
  function loadFailed(error){creating=false;started=false;settled=true;instance?.destroy();instance=null;replay.disabled=false;replay.hidden=!config.allowReplay;replay.textContent='Try again';status.hidden=false;status.textContent='Unable to load Candy Crush Saga: '+error.message;console.error(error);}
  async function create(restarting=false){if(creating)return;creating=true;const token=++generation;instance?.destroy();instance=null;started=false;settled=false;touched=false;steps=0;nextCta=policy.afterSteps;intervalIndex=0;autoJumped=false;replayPending=restarting;replay.hidden=true;document.getElementById('ccs-continue').hidden=true;replay.disabled=true;status.hidden=false;status.textContent='Loading…';
    try{const game=await entry(root,shell,{base:'./',env:environment(),config:{}});if(token!==generation){game.destroy?.();return;}instance=game;await begin();}
    catch(error){if(token===generation)loadFailed(error);}
  }
  document.getElementById('ccs-continue').addEventListener('click',()=>{call('endStage');replay.hidden=true;document.getElementById('ccs-continue').hidden=true;});
  window.NovvyGame=function(factory){entry=factory;create();};
  window.addEventListener('novvy:intro-finished',()=>{if(entered)return;entered=true;muted=document.getElementById('novvy-intro-video')?.muted??muted;call('setStage',chain.length,'playable');begin().catch(loadFailed);});
  replay.addEventListener('click',()=>{if(!settled||!config.allowReplay||creating)return;create(started||replayPending);});
  let touched=false;
  root.addEventListener('pointerdown',()=>{if(started&&!settled&&!touched){touched=true;call('onStart');}},{passive:true});
  const resize=()=>instance?.setEnv(environment());
  window.addEventListener('resize',resize);
  const observer=new ResizeObserver(resize);
  for(const element of [root,document.getElementById('novvy-training-hud'),document.getElementById('novvy-cta')])if(element)observer.observe(element);
  window.addEventListener('novvy:cta-interact',click);
  
  const syncVisibility=()=>{if(document.hidden||!viewable)instance?.pause();else if(started)instance?.resume();};
  document.addEventListener('visibilitychange',syncVisibility);
  window.addEventListener('novvy:viewablechange',event=>{viewable=event.detail?.viewable===true;syncVisibility();});
  window.addEventListener('pagehide',()=>{if(started)call('endStage');generation++;observer.disconnect();instance?.destroy();});
  const video=document.getElementById('novvy-intro-video');
  document.getElementById('novvy-intro-sound')?.addEventListener('click',()=>queueMicrotask(()=>{muted=video.muted;instance?.setEnv({muted});}));
  try{if(video)window.NovvyAnalytics?.registerMedia(video,{name:'intro_video'});}catch(_){}
})();
