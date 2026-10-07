/* 转化桥:把"试玩开始"这一模板时机翻译成服务结算卡片的显示时机。
   只使用落地页注入引擎的公开导出 —— window.showEndCard(亮出结算卡片,
   服务自管其 DOM/层级/交互)与 window.novvyHandleAdClick(统一转化入口,
   自带上报与防重护栏)。不触碰服务注入的任何 DOM,不引用任何埋点 API。
   语义约定:卡片在第一次进入试玩时出现并全程常驻(服务 API 无隐藏能力),
   卡片为全屏接管型 —— 出现后任何点击都会走统一转化跳转。 */
(function () {
  var STORE_URL = window.__COLOREVER_CTA_URL__ || '';

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

  /* 试玩开始:请服务亮出结算卡片(公开 API,零 DOM 耦合;预览环境无此
     导出,自动降级为无 CTA)。 */
  function playableStarted() {
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
    if (!window.__novvyOutroEnabled || converted) return;
    converted = true;
    if (reason === 'video_ended') {
      /* 片尾播完停留最后一帧,等待 1 秒(后台感知)再主动转化。 */
      waitingForOutroJump = true;
      remaining = 1000;
      armOutroJump();
    } else convert();
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
