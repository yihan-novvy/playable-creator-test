(function () {
  var STORE_URL = window.__COLOREVER_CTA_URL__ || '';
  var root = document.getElementById('novvy-cta');

  /* 没有 ke66qzj0xf 里那条 3 秒等待:注入即显示。 */
  function show() { if (root) root.classList.add('novvy-cta-visible'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
  else show();
  window.addEventListener('novvy:outro-started', function () {
    if (root) {
      root.classList.remove('novvy-cta-visible');
      root.classList.add('novvy-cta-outro');
    }
  });
  window.addEventListener('novvy:outro-cta-ready', show);
  window.addEventListener('novvy:outro-finished', function (event) {
    if (root && event.detail && event.detail.reason !== 'video_ended') {
      root.classList.remove('novvy-cta-outro');
      show();
    }
  });

  function openStore() {
    if (window.NovvyAnalytics && typeof window.NovvyAnalytics.track === 'function') {
      try { window.NovvyAnalytics.track('cta_click', { target: 'primary_cta', action: 'click', scene: 'playable_end_card' }); } catch (e) {}
    }
    if (window.NovvyAnalytics && typeof window.NovvyAnalytics.click === 'function') {
      try { window.NovvyAnalytics.click('primary_cta', 'open_destination', { scene: 'playable_end_card' }); } catch (e) {}
    }
    /* Novvy SDK 桥(双端一致):只发点击信号,落地页由 SDK 取 adm.clicktrack,
       所以不传 URL(参数在两端都被忽略)。必须排在 super_html 之前——那是包内
       AppLovin loader 自带的 shim,在 SDK WebView 里永远存在,而它兜底的
       window.open 在 WebView 里是 no-op,会把这次跳转吞掉。 */
    if (window.__novvyBridgeVersion >= 1 && window.novvy && typeof window.novvy.open === 'function') {
      window.novvy.open();
      return;
    }
    /* 模板自带的跳转桥:广告 WebView 里走 mraid.open,普通浏览器里 window.open。 */
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

  var btn = document.getElementById('novvy-cta-btn');
  if (btn) btn.addEventListener('click', function (e) { e.stopPropagation(); openStore(); });
  /* 点到卡片外的压暗层也算一次 CTA 点击(与参考的 end-card 行为一致)。 */
  if (root) root.addEventListener('click', function (e) { if (e.target === root) openStore(); });

  var pendingRestart = false, leftAfterOpen = false, converted = false;
  var viewable = window.__novvyBridgeVersion >= 1 ? !!window.__novvyViewable : true;
  var timer = null, remaining = 1000, armedAt = 0;
  function visible() { return !document.hidden && viewable; }
  function convert(restartOnReturn) {
    pendingRestart = restartOnReturn;
    leftAfterOpen = false;
    openStore();
  }
  function armOutroJump() {
    if (timer !== null || !visible()) return;
    armedAt = Date.now();
    timer = setTimeout(function () {
      timer = null;
      remaining = 0;
      waitingForOutroJump = false;
      convert(false);
    }, remaining);
  }
  var waitingForOutroJump = false;
  function onVisibility() {
    if (pendingRestart) {
      if (!visible()) leftAfterOpen = true;
      else if (leftAfterOpen) {
        pendingRestart = false;
        leftAfterOpen = false;
        converted = false;
        var reset = document.getElementById('reset');
        if (reset) reset.click();
        if (window.novvyTrainingProgress) window.novvyTrainingProgress.reset();
      }
    }
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
    if (!window.__novvyOutroEnabled && !converted) {
      converted = true;
      convert(true);
    }
  });
  window.addEventListener('novvy:outro-finished', function (event) {
    if (!window.__novvyOutroEnabled || converted) return;
    converted = true;
    if (event.detail && event.detail.reason === 'video_ended') {
      waitingForOutroJump = true;
      remaining = 1000;
      armOutroJump();
    } else convert(true);
  });
})();
