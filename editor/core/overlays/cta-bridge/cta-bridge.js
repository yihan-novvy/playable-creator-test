/* 转化桥:把模板的转化时机翻译成结算卡片的显示/跳转时机。
   转化只走打包侧新事件规范(docs/original-zip-required-event-integration.md §6)
   的统一入口 window.NovvyPlayable.click —— click_source 区分主动/被动跳转:
   手动点击 CTA 区域(novvy:cta-interact)= cta_click;素材控制自行跳转
   (完成/胜利/CTA 时刻/片尾结束/回访每击等自动时机)= forced_click_to_appstore;
   scene 带触发时机名。SDK 缺失(编辑器预览)时退回裸兜底链;旧落地页注入引擎的
   转化与结算上报契约已整体退场,不再引用。
   语义约定:卡片 DOM 由模板随包自带(core/overlays/cta-card,服务零 UI
   侵入契约),桥只派发 novvy:cta-card 显示事件 —— 单 playable 在第一次
   进入试玩时亮出底部常驻条并全程常驻;双 playable(__novvyTwoPhase)第一关
   同样亮底部条。转化时机:引擎派发 novvy:playable-complete(最后一步完成,
   不等胜利扫光/片尾音乐收尾)即主动跳转一次;显式 continuing:true 的过渡段
   保留底卡，延后自动跳转；victory 带 ctaBeforeContinue:true 时，在庆祝
   动画结束后请求一次 CTA，再由素材衔接后续视频，不武装回访每击。双 playable 进第二关
   (novvy:phase2-start)重置闩锁,第二关的 novvy:cta-moment(第 N 步或完成
   兜底)升级全屏接管并再次转化。自动时机经分相 autoConverted 闩锁去重;
   手动点击统一复用 Download,预览兜底经 novvy:cta-interact 回到桥,
   每次点击都可请求转化,不读写自动时机的闩锁。显式资源交换同理绕过自动
   闩锁:novvy:replay-cta(重玩)与 novvy:hint-refill(提示用完再点换一条)。
   结束遮罩(colorever 注入 __NOVVY_CTA_END_MASK__):false = 到转化时刻不再
   弹全屏接管,直接跳转,并武装"回访每击转化"—— 用户从商店切回来后,每一次
   触压既操作 playable、也再触发一次跳转(takeover"每一击都是一次转化"的
   语义搬到无遮罩形态,连点由 SDK 冷却护栏去重);未注入或 true = 保持遮罩。
   本文件由各模板插件共享注入;注入时必须把 __CTA_URL_KEY__ 替换成模板
   自己的 CTA URL 全局名(如 __COLOREVER_CTA_URL__),SDK 包内该值恒为空 ——
   跳转由 NovvyPlayable.click 统一上送,URL 只服务编辑器预览的裸兜底链。 */
(function () {
  var STORE_URL = window.__CTA_URL_KEY__ || '';
  /* 结束遮罩开关:仅显式注入 false 时关闭(colorever 的 cta.endMask);
     未注入的模板/存量包保持全屏接管现状。 */
  var END_MASK = window.__NOVVY_CTA_END_MASK__ !== false;

  /* 跳转兜底链(仅编辑器预览会走到):与旧 cta.js 同链,只服务预览的裸跳转。 */
  function openStoreFallback() {
    if (window.super_html && typeof window.super_html.download === 'function') {
      window.super_html.download(STORE_URL);
      return;
    }
    if (STORE_URL && window.mraid && typeof window.mraid.open === 'function') {
      window.mraid.open(STORE_URL);
      return;
    }
    if (STORE_URL) window.open(STORE_URL, '_blank');
  }

  function convert(reason) {
    /* 测试可见性:预览环境无法真正跳转,控制台标出每次转化触发与来源。 */
    console.log('[NovvyCTA] CTA 转化触发 → 跳转商店 (' + (reason || 'unknown') + ')');
    /* 注入桥在场:走统一 click API,click_source 区分主动/被动跳转(doc §6);
       预览环境:裸兜底链。 */
    if (window.NovvyPlayable && typeof window.NovvyPlayable.click === 'function') {
      try {
        window.NovvyPlayable.click({
          click_source: reason === 'cta-card' ? 'cta_click' : 'forced_click_to_appstore',
          scene: reason || 'unknown'
        });
      } catch (e) {}
      return;
    }
    // Original-engine adapters route their native download API back here.
    // Their editor previews have no SDK; calling that API would recurse.
    if (!window.__novvyCtaSdkOnly) openStoreFallback();
  }

  /* 卡片显示事件:'bar'=底部常驻条(试玩开始,含双 playable 第一关);
     'takeover'=全屏接管(仅双 playable 的 CTA 时刻)。同步属性 + 事件双通道,
     卡片脚本无论先于还是晚于桥注入都能追平状态;派发 try/catch —— 剥离版
     VM 沙箱(无 dispatchEvent/CustomEvent)不致崩。零 DOM:只发事件不摸元素。 */
  function showCard(phase) {
    window.__novvyCtaCardPhase = phase;
    try { window.dispatchEvent(new CustomEvent('novvy:cta-card', { detail: { phase: phase } })); } catch (e) {}
  }

  /* Download 的兜底交互入口:每次手动点击都请求转化,与自动时机去重独立。
     注入引擎的冷却/返回保护不会锁死后续点击,也不会提前消耗 CTA 时机。 */
  window.addEventListener('novvy:cta-interact', function () {
    manualGestureVersion += 1;
    convert('cta-card');
  });
  // A replay is an explicit CTA request, independent of the completed round's
  // automatic-conversion latch. The game resets its current round afterwards.
  window.addEventListener('novvy:replay-cta', function () {
    if (window.__novvyReplayable) convert('playable-replay');
  });
  // 用尽限次资源后再点 = 用户主动要资源的转化(提示用完换一条),与 replay-cta
  // 同类:绕过自动闩锁,每次请求都转化,也不武装回访每击。素材在派发后同步补
  // 发资源,回店即见新提示;完成时的自动转化(autoConverted)不受影响。
  window.addEventListener('novvy:hint-refill', function () {
    if (window.__novvyReplayable) convert('hint-refill');
  });

  /* 遮罩关闭形态的"回访每击转化":转化时刻(主动跳转)过后,用户从商店切
     回来,每一次触压既继续操作 playable、也再触发一次跳转。捕获段监听且不
     preventDefault —— 游戏输入零感知;不设闩锁,每次触压都是一次转化请求,
     连点交给 SDK 的冷却护栏;300ms 去抖只过滤同一次触压的多发事件。
     CTA 区域由 Download 处理,避免 pointerdown 与按钮 click 重复转化。
     武装点见各转化终点(目标时刻已到即武装,即使自动闩锁拦下了重复
     跳转)。
     例外:可重玩回合(detail.replayable=true 且模板声明 __novvyReplayable)
     转化后用户还会切回来继续玩/重开,回访触压保持纯游玩,不武装——重玩
     按钮(Try again/Play again)与常驻底卡的主动点击照常转化。 */
  var interactArmed = false, interactListening = false, lastInteractAt = -1e9;
  var manualGestureVersion = 0, canvasGesture = null;
  function postCompleteInteract() {
    if (!interactArmed) return;
    var now = Date.now();
    if (now - lastInteractAt < 300) return;
    lastInteractAt = now;
    convert('post-complete-interact');
  }
  function replayContinues(event) {
    return !!(window.__novvyReplayable && event && event.detail && event.detail.replayable);
  }
  function armInteractConvert() {
    interactArmed = true;
    if (interactListening) return;
    interactListening = true;
    document.addEventListener('pointerdown', function (event) {
      if (!interactArmed) return;
      var target = event && event.target;
      /* .novvy-intro-go = 片头/片尾 GO 闸门按钮:点 GO 是继续漏斗(进下一段
         playable),不是再跳一次商店——真机上 pointerdown 先转化跳店会把
         click 打断,震动与换关全都跑不到。 */
      if (target && target.closest && target.closest('#novvy-cta,[data-novvy-click-source="cta_click"],[data-novvy-replay],.novvy-intro-go,#origin-sound,#block-out-sound')) return;
      // Canvas engines identify their download button on release. Let that
      // native handler report cta_click before considering a background tap.
      if (window.__novvyDeferCanvasCta && target && target.closest && target.closest('canvas')) {
        canvasGesture = { id: event.pointerId, version: manualGestureVersion };
        return;
      }
      postCompleteInteract();
    }, true);
    if (window.__novvyDeferCanvasCta) {
      document.addEventListener('pointerup', function (event) {
        var gesture = canvasGesture;
        if (!gesture || gesture.id !== event.pointerId) return;
        canvasGesture = null;
        setTimeout(function () {
          if (gesture.version === manualGestureVersion && visible()) postCompleteInteract();
        }, 0);
      }, true);
      document.addEventListener('pointercancel', function () { canvasGesture = null; }, true);
    }
  }

  /* 试玩开始:亮出底部常驻卡(双 playable 第一关同样亮)。双 playable 的
     主动跳转推迟到 CTA 时刻(引擎 novvy:cta-moment)。 */
  function playableStarted() {
    showCard('bar');
  }

  /* —— 胜利/片尾的自动转化时序(自旧 cta.js 迁移;卡片已由 playableStarted
     常驻亮出,这里只负责补充"结算时刻主动跳转"的转化动作) —— */
  var autoConverted = false;
  var viewable = window.__novvyBridgeVersion >= 1 ? !!window.__novvyViewable : true;
  var timer = null, remaining = 1000, armedAt = 0;
  function visible() { return !document.hidden && viewable; }
  function armOutroJump() {
    if (timer !== null || !visible()) return;
    armedAt = Date.now();
    timer = setTimeout(function () {
      timer = null;
      remaining = 0;
      waitingForOutroJump = false;
      if (!END_MASK) armInteractConvert();
      convert('outro-finished');
    }, remaining);
  }
  var waitingForOutroJump = false;
  function onVisibility() {
    if (!waitingForOutroJump) return;
    if (!visible() && timer !== null) {
      clearTimeout(timer);
      timer = null;
      remaining = Math.max(0, remaining - (Date.now() - armedAt));
    } else if (visible()) armOutroJump();
  }
  window.addEventListener('novvy:viewablechange', function (event) {
    viewable = !!(event.detail && event.detail.viewable);
    onVisibility();
  });
  document.addEventListener('visibilitychange', onVisibility);

  /* 闩锁按 playable 分相:双 playable 进第二关(novvy:phase2-start)时重置,
     第二关的完成/触发步数时刻重新可自动转化;手动点击不受此闩锁限制。 */
  window.addEventListener('novvy:phase2-start', function () {
    autoConverted = false;
    // 第一关完成后的回访触压不应越过第二关自己的步数门槛。
    interactArmed = false;
    lastInteractAt = -1e9;
  });
  // Replay-capable games start a fresh conversion window with a new round.
  window.addEventListener('novvy:playable-replay', function () {
    if (!window.__novvyReplayable) return;
    autoConverted = false;
    interactArmed = false;
    lastInteractAt = -1e9;
  });
  /* 默认在最后一步完成(playable-complete)时主动转化:不等胜利
     扫光/片尾音乐收尾,请求与结算显露都在这一刻发生。victory 保留为兜底
     (未派发新事件的旧素材),两者经同一闩锁只转化一次。 */
  window.addEventListener('novvy:playable-complete', function (event) {
    // Explicit opt-in for a round that immediately continues into another
    // video/playable. Keep manual CTA available without interrupting the flow.
    if (event && event.detail && event.detail.continuing === true) return;
    if (!END_MASK && !replayContinues(event)) armInteractConvert();
    if (autoConverted) return;
    autoConverted = true;
    convert('playable-complete');
  });
  window.addEventListener('novvy:victory', function (event) {
    if (event && event.detail && event.detail.continuing === true) {
      // A transitional win can request CTA after its animation. Keep the bar
      // and leave the following video interactive when the user returns.
      if (event.detail.ctaBeforeContinue === true && !autoConverted) {
        autoConverted = true;
        convert('victory');
      }
      return;
    }
    if (!END_MASK && !replayContinues(event)) armInteractConvert();
    if (autoConverted) return;
    autoConverted = true;
    convert('victory');
  });
  window.addEventListener('novvy:outro-finished', function (event) {
    var reason = event && event.detail && event.detail.reason;
    /* 双 playable:片尾只是两关之间的过渡,转化时机整体移交 novvy:cta-moment。 */
    if (!window.__novvyOutroEnabled || window.__novvyTwoPhase === true || autoConverted) return;
    autoConverted = true;
    if (reason === 'video_ended') {
      /* 片尾播完停留最后一帧,等待 1 秒(后台感知)再主动转化。 */
      waitingForOutroJump = true;
      remaining = 1000;
      armOutroJump();
    } else convert('outro-finished');
  });

  /* CTA 时刻(引擎在武装策略命中时派发:第 N 步,或完成兜底):
     遮罩开启时双 playable 升级为全屏接管;关闭时不弹遮罩,只主动转化一次,
     并交由回访每击转化接管后续(可重玩回合除外,见上方例外)。autoConverted
     闩锁只对自动时机去重。
     单 playable 不接管 —— 底部卡自试玩起常驻,这里只补主动转化。
     步数循环素材(detail.everySteps>0):游玩期由"每 M 步"节奏驱动转化,
     不再武装回访每击(否则每次触压抢跑循环节奏);repeat=引擎在循环间隔
     的再次派发,绕过自动闩锁请求转化(连点交给 SDK 冷却护栏),亮卡状态
     保持不变。未携带 everySteps 的既有素材行为逐字节不变。 */
  window.addEventListener('novvy:cta-moment', function (event) {
    var everySteps = !!(event && event.detail && event.detail.everySteps > 0);
    if (!everySteps && !END_MASK && !replayContinues(event)) armInteractConvert();
    if (everySteps && event.detail.repeat) {
      convert('cta-moment');
      return;
    }
    if (autoConverted) return;
    autoConverted = true;
    var replayable = window.__novvyReplayable && event && event.detail && event.detail.replayable;
    if (window.__novvyTwoPhase === true && END_MASK && !replayable) showCard('takeover');
    convert('cta-moment');
  });

  /* 试玩开始的判定:有片头覆盖层时等 intro 派发 novvy:intro-finished
     (播完/跳过/出错收场);未启用片头 = 加载即试玩。 */
  function boot() {
    if (document.getElementById('novvy-video-intro') && !window.__novvyIntroFinished) {
      window.addEventListener('novvy:intro-finished', playableStarted);
    } else {
      playableStarted();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
