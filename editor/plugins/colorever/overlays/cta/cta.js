(function () {
  var STORE_URL = window.__COLOREVER_CTA_URL__ || '';
  var root = document.getElementById('novvy-cta');
  if (!root) return;

  /* 没有 ke66qzj0xf 里那条 3 秒等待:注入即显示。 */
  function show() { root.classList.add('novvy-cta-visible'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
  else show();

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
  root.addEventListener('click', function (e) { if (e.target === root) openStore(); });

  /* water-sort 的胜利转化(colorever 是游戏内 installForGame 补丁,这里没有
     Cocos 引擎可打,改为监听壳已在派发的 novvy:victory——ad-main.js 在每次
     胜局上升沿广播,自动重开后下一局胜利会再次派发,即每一局完成都跳一次):
     立即走与 CTA 点击同一套桥链;随后点隐藏的 #reset(壳的 game.reset())自动
     开新一局,并把 HUD 进度条归位,胜利结算浮层已被壳隐藏 CSS 按住不出现。 */
  var RESTART_DELAY_MS = 1200;
  function finishGame() {
    openStore();
    setTimeout(function () {
      var reset = document.getElementById('reset');
      if (reset) reset.click();
      if (window.novvyTrainingProgress && typeof window.novvyTrainingProgress.reset === 'function') {
        window.novvyTrainingProgress.reset();
      }
    }, RESTART_DELAY_MS);
  }
  window.addEventListener('novvy:victory', function () {
    if (!window.__novvyOutroEnabled) finishGame();
  });
  window.addEventListener('novvy:outro-finished', function () {
    if (window.__novvyOutroEnabled) finishGame();
  });
})();
