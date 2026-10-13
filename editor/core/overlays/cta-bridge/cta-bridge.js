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
   不等胜利扫光/片尾音乐收尾)即主动跳转一次;双 playable 进第二关
   (novvy:phase2-start)重置闩锁,第二关的 novvy:cta-moment(第 N 步或完成
   兜底)升级全屏接管并再次转化。自动时机经分相 autoConverted 闩锁去重;
   手动点击统一复用 Download,预览兜底经 novvy:cta-interact 回到桥,
   每次点击都可请求转化,不读写自动时机的闩锁。
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
    openStoreFallback();
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
    convert('cta-card');
  });

  /* 遮罩关闭形态的"回访每击转化":转化时刻(主动跳转)过后,用户从商店切
     回来,每一次触压既继续操作 playable、也再触发一次跳转。捕获段监听且不
     preventDefault —— 游戏输入零感知;不设闩锁,每次触压都是一次转化请求,
     连点交给 SDK 的冷却护栏;300ms 去抖只过滤同一次触压的多发事件。
     CTA 区域由 Download 处理,避免 pointerdown 与按钮 click 重复转化。
     武装点见各转化终点(目标时刻已到即武装,即使自动闩锁拦下了重复
     跳转)。 */
  var interactArmed = false, interactListening = false, lastInteractAt = -1e9;
  function armInteractConvert() {
    interactArmed = true;
    if (interactListening) return;
    interactListening = true;
    document.addEventListener('pointerdown', function (event) {
      if (!interactArmed) return;
      var target = event && event.target;
      if (target && target.closest && target.closest('#novvy-cta')) return;
      var now = Date.now();
      if (now - lastInteractAt < 300) return;
      lastInteractAt = now;
      convert('post-complete-interact');
    }, true);
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
  /* 第一个 playable 最后一步完成(playable-complete)即主动转化:不等胜利
     扫光/片尾音乐收尾,请求与结算显露都在这一刻发生。victory 保留为兜底
     (未派发新事件的旧素材),两者经同一闩锁只转化一次。 */
  window.addEventListener('novvy:playable-complete', function () {
    if (!END_MASK) armInteractConvert();
    if (autoConverted) return;
    autoConverted = true;
    convert('playable-complete');
  });
  window.addEventListener('novvy:victory', function () {
    if (!END_MASK) armInteractConvert();
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
     并交由回访每击转化接管后续。autoConverted 闩锁只对自动时机去重。
     单 playable 不接管 —— 底部卡自试玩起常驻,这里只补主动转化。 */
  window.addEventListener('novvy:cta-moment', function () {
    if (!END_MASK) armInteractConvert();
    if (autoConverted) return;
    autoConverted = true;
    if (window.__novvyTwoPhase === true && END_MASK) showCard('takeover');
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
