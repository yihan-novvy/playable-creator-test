/* 转化桥:把模板的转化时机翻译成结算卡片的显示/跳转时机。
   只使用落地页注入引擎的公开导出 —— window.showEndCard(服务侧保留的
   结算时刻上报,零 UI)与 window.novvyHandleAdClick(统一转化入口,自带
   上报与防重护栏)。不触碰服务注入的任何 DOM,不引用任何埋点 API。
   语义约定:卡片 DOM 由模板随包自带(core/overlays/cta-card,服务零 UI
   侵入契约),桥只派发 novvy:cta-card 显示事件 —— 单 playable 在第一次
   进入试玩时亮出底部常驻条并全程常驻;双 playable(__novvyTwoPhase)第一关
   同样亮底部条,主动跳转与全屏接管(takeover)推迟到引擎的 novvy:cta-moment
   (第 N 步或完成兜底),片尾只是两关之间的过渡。卡片点击经 novvy:cta-interact
   回到桥,与胜利/片尾自动跳转共享同一 converted 闩锁。
   本文件由各模板插件共享注入;注入时必须把 __CTA_URL_KEY__ 替换成模板
   自己的 CTA URL 全局名(如 __COLOREVER_CTA_URL__),SDK 包内该值恒为空 ——
   落地页由 SDK 取 adm.clicktrack,URL 只服务编辑器预览的裸兜底链。 */
(function () {
  var STORE_URL = window.__CTA_URL_KEY__ || '';

  /* 跳转兜底链(仅编辑器预览会走到):与旧 cta.js 同链。
     Novvy SDK 桥只发点击信号,落地页由 SDK 取 adm.clicktrack,不传 URL。 */
  function openStoreFallback() {
    if (window.__novvyBridgeVersion >= 1 && window.novvy && typeof window.novvy.open === 'function') {
      window.novvy.open();
      return;
    }
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

  function convert() {
    /* 注入引擎在场:走统一 primary_cta 上报 + 跳转 + 防重/冷却护栏;
       预览环境:裸兜底链。 */
    if (typeof window.novvyHandleAdClick === 'function') {
      try { window.novvyHandleAdClick(); } catch (e) {}
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

  /* 卡片点击/全屏接管态的任意点击都汇到这里:与胜利/片尾自动跳转共享
     converted 闩锁,整局只转化一次。 */
  window.addEventListener('novvy:cta-interact', function () {
    if (converted) return;
    converted = true;
    convert();
  });

  /* 试玩开始:亮出底部常驻卡(双 playable 第一关同样亮);随后请服务做
     结算时刻上报(公开 API;预览环境无此导出,自动降级)。双 playable 的
     showEndCard 与主动跳转仍推迟到 CTA 时刻(引擎 novvy:cta-moment)。 */
  function playableStarted() {
    showCard('bar');
    if (window.__novvyTwoPhase === true) return;
    if (typeof window.showEndCard === 'function') {
      try { window.showEndCard(); } catch (e) {}
    }
  }

  /* —— 胜利/片尾的自动转化时序(自旧 cta.js 迁移;卡片已由 playableStarted
     常驻亮出,这里只负责补充"结算时刻主动跳转"的转化动作) —— */
  var converted = false;
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
      convert();
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

  window.addEventListener('novvy:victory', function () {
    /* 无片尾配置:胜利即主动转化。有片尾时交给 outro 事件链。 */
    if (!window.__novvyOutroEnabled && !converted) {
      converted = true;
      convert();
    }
  });
  window.addEventListener('novvy:outro-finished', function (event) {
    var reason = event && event.detail && event.detail.reason;
    /* 双 playable:片尾只是两关之间的过渡,转化时机整体移交 novvy:cta-moment。 */
    if (!window.__novvyOutroEnabled || window.__novvyTwoPhase === true || converted) return;
    converted = true;
    if (reason === 'video_ended') {
      /* 片尾播完停留最后一帧,等待 1 秒(后台感知)再主动转化。 */
      waitingForOutroJump = true;
      remaining = 1000;
      armOutroJump();
    } else convert();
  });

  /* CTA 时刻(引擎在武装策略命中时派发:第 N 步,或完成兜底):
     双 playable 升级为全屏接管;随后首亮上报与主动转化一次;
     converted 闩锁保证整组动作只发生一次。单 playable 不接管 ——
     底部卡自试玩起常驻,这里只补主动转化。 */
  window.addEventListener('novvy:cta-moment', function () {
    if (converted) return;
    converted = true;
    if (window.__novvyTwoPhase === true) showCard('takeover');
    if (typeof window.showEndCard === 'function') {
      try { window.showEndCard(); } catch (e) {}
    }
    convert();
  });

  /* 试玩开始的判定:有片头覆盖层时等 intro 派发 novvy:intro-finished
     (播完/跳过/出错收场);未启用片头 = 加载即试玩。 */
  function boot() {
    if (document.getElementById('novvy-video-intro')) {
      window.addEventListener('novvy:intro-finished', playableStarted);
    } else {
      playableStarted();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
