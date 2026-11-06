// Product assembly host. This file is excluded from the standalone game ZIP.
(function(){
  const config=window.ZEN_CONFIG,root=document.getElementById('zen-game'),status=document.getElementById('zen-status'),replay=document.getElementById('zen-replay');
  const dialog=document.getElementById('zen-result'),heading=document.getElementById('zen-result-title'),description=document.getElementById('zen-result-copy');
  let entry,instance,entered=!config.intro,started=false,settled=false,steps=0,generation=0,creating=false,replayPending=false,loadError=false,replayTimer=0;
  const policy=config.policy||{enabled:true,mode:'steps',afterSteps:20,intervals:[10,8,6,4]};
  let nextCta=policy.afterSteps,intervalIndex=0,lastCta=-Infinity;
  const chain=config.intro?['video','playable']:['playable'];
  const sdk=()=>window.NovvyPlayable;
  const call=(name,...args)=>{try{sdk()?.[name]?.(...args);}catch(error){console.warn('Zen Word host SDK',error);}};
  call('setStageList',chain);call('setStage',1,chain[0]);
  const safeProbe=document.createElement('div');
  safeProbe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.append(safeProbe);
  const environment=()=>{
    const style=getComputedStyle(safeProbe),safeArea={top:parseFloat(style.paddingTop)||0,right:parseFloat(style.paddingRight)||0,bottom:parseFloat(style.paddingBottom)||0,left:parseFloat(style.paddingLeft)||0};
    const hud=document.getElementById('novvy-training-hud'),card=document.getElementById('novvy-cta');
    const top=config.title&&hud?hud.getBoundingClientRect().bottom+10:0;
    const bottom=card&&!card.hidden?root.clientHeight-card.getBoundingClientRect().top+8:0;
    document.documentElement.style.setProperty('--zen-cta-inset',bottom+'px');
    return {api:1,platform:/Android/i.test(navigator.userAgent)?'android':/iPhone|iPad/i.test(navigator.userAgent)?'ios':'web',language:navigator.language,mode:'preview',viewport:{width:root.clientWidth,height:root.clientHeight,dpr:devicePixelRatio},safeArea,orientation:innerWidth>innerHeight?'landscape':'portrait',muted:false,insets:{top,bottom}};
  };
  function replayAvailability(){
    clearTimeout(replayTimer);replayTimer=0;
    if(!settled||creating)return;
    const remaining=loadError?0:Math.max(0,1000-(performance.now()-lastCta));
    replay.disabled=remaining>0;
    if(remaining>0)replayTimer=setTimeout(replayAvailability,remaining+1);
  }
  function finish(kind){if(!started||settled)return;settled=true;replay.hidden=!config.allowReplay;replay.textContent=kind==='fail'?'Try again':'Play again';
    heading.textContent=kind==='win'?'All words found!':kind==='fail'?'Try once more':'Round complete';
    description.textContent=kind==='win'?'You completed the whole puzzle.':kind==='fail'?'A fresh puzzle is waiting for you.':'Thanks for playing.';
    if(config.allowReplay)description.textContent+=' Play again and enjoy another round.';
    dialog.hidden=false;replayAvailability();dialog.focus();
    if(kind==='end'){if(!config.allowReplay)call('endStage');}else call('onComplete',{result:kind,continue_playing:config.allowReplay});
  }
  function click(source,detail={}){
    if(!started||document.hidden||performance.now()-lastCta<1000)return false;
    lastCta=performance.now();call('click',{...detail,click_source:source});
    replayAvailability();return true;
  }
  function step(percent){
    if(!started||settled||document.hidden)return;
    steps++;call('onStep',steps,{progress:percent});
    if(policy.enabled!==false&&policy.mode==='steps'&&steps>=nextCta){
      const gap=policy.intervals[Math.min(intervalIndex++,policy.intervals.length-1)];
      nextCta=gap?nextCta+gap:Infinity;
      click('forced_click_to_appstore',{scene:'playable',auto_jump:'true',auto_jump_mode:'steps',step:steps});
    }
  }
  const shell={step,win(){finish('win');},fail(){finish('fail');},end(){finish('end');},retry(){call('onReplay');},level(){},sound(muted){instance?.setEnv({muted});},haptic(){},cta:click};
  async function begin(){if(!instance||!entered||started)return;const token=generation;started=true;
    window.dispatchEvent(new CustomEvent('novvy:cta-card',{detail:{phase:'bar'}}));
    instance.setEnv(environment());await instance.start();if(token!==generation)return;
    creating=false;status.hidden=true;replay.disabled=false;
    if(replayPending){replayPending=false;call('onReplay');}
    if(document.hidden)instance.pause();
  }
  function loadFailed(error){creating=false;started=false;settled=true;loadError=true;instance?.destroy();instance=null;replay.disabled=false;replay.hidden=false;replay.textContent='Retry loading';heading.textContent='Unable to load';description.textContent='Please try loading the puzzle again.';dialog.hidden=false;status.hidden=true;console.error(error);}
  async function create(restarting=false){if(creating)return;creating=true;clearTimeout(replayTimer);dialog.hidden=true;const token=++generation;instance?.destroy();instance=null;started=false;settled=false;loadError=false;touched=false;steps=0;nextCta=policy.afterSteps;intervalIndex=0;replayPending=restarting;replay.hidden=true;replay.disabled=true;status.hidden=false;status.textContent='Loading…';
    try{const game=await entry(root,shell,{base:'./',env:environment(),config:{}});if(token!==generation){game.destroy?.();return;}instance=game;await begin();}
    catch(error){if(token===generation)loadFailed(error);}
  }
  window.NovvyGame=function(factory){entry=factory;create();};
  window.addEventListener('novvy:intro-finished',()=>{if(entered)return;entered=true;call('setStage',chain.length,'playable');begin().catch(loadFailed);});
  replay.addEventListener('click',()=>{
    if(!settled||creating||replay.disabled||document.hidden)return;
    // A failed load retries without monetizing a non-gameplay action.
    if(loadError){create(replayPending);return;}
    if(!config.allowReplay)return;
    // User decision: Play again and Try again request CTA before any reset.
    if(click('forced_click_to_appstore',{scene:'playable-replay'}))create(true);
  });
  let touched=false;
  root.addEventListener('pointerdown',()=>{if(started&&!settled&&!touched){touched=true;call('onStart');}},{passive:true});
  const resize=()=>instance?.setEnv(environment());
  window.addEventListener('resize',resize);
  const observer=new ResizeObserver(resize);
  for(const element of [root,document.getElementById('novvy-training-hud'),document.getElementById('novvy-cta')])if(element)observer.observe(element);
  window.addEventListener('novvy:cta-interact',()=>click('cta_click'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)instance?.pause();else instance?.resume();});
  window.addEventListener('pagehide',()=>{if(started)call('endStage');generation++;clearTimeout(replayTimer);observer.disconnect();instance?.destroy();});
  const video=document.getElementById('novvy-intro-video');
  try{if(video)window.NovvyAnalytics?.registerMedia(video,{name:'intro_video'});}catch(_){}
})();
