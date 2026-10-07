/* 转化桥:取代旧版底部下载卡片(novvy-cta),自 cta.js 迁移全部转化时序,
   并适配 novvy_landing_page_service 互动广告 ZIP 注入引擎的接管契约。
   分工:本包只负责"按钮显隐时序 + 触达转化入口";事件上报、点击护栏、
   商店跳转、结算卡片由服务注入的 analytics.js / 事件脚本负责。
   本文件不引用任何埋点 API —— 注入引擎会带来自己的埋点库。 */
(function () {
  var STORE_URL = window.__COLOREVER_CTA_URL__ || '';

  /* 游戏期下载按钮。id 刻意不用 "cta":落地页注入引擎每 300ms 扫描可见的
     #cta/.cta 并据此永久激活其全屏结算卡(单向闸门),游戏期必须保持安静;
     而 #downloadBtn 在它 hookCtaButtons 的选择器表内,点击会被引擎接管并
     上报 primary_cta。引擎不在场(编辑器预览)时按钮走 openStoreFallback。 */
  var BRIDGE_CSS = [
    '#novvy-cta-bridge-style{display:none}',
    '.novvy-cta-bridge-btn{position:fixed;left:50%;transform:translateX(-50%);',
    'bottom:calc(14px + env(safe-area-inset-bottom));z-index:40;',
    'min-height:42px;padding:0 22px;border:0;border-radius:21px;',
    'background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;',
    'font:800 14px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;',
    'letter-spacing:.02em;cursor:pointer;box-shadow:0 4px 14px rgba(16,185,129,.4);',
    'display:flex;align-items:center;gap:6px;user-select:none;-webkit-user-select:none;}',
    '.novvy-cta-bridge-btn:active{transform:translateX(-50%) scale(.97);opacity:.92}',
    '.novvy-cta-bridge-btn[hidden]{display:none}',
  ].join('');

  var btn = null;
  function ensureButton() {
    if (btn) return btn;
    if (typeof document.createElement !== 'function' || !document.body) return null;
    if (!document.getElementById('novvy-cta-bridge-style')) {
      var style = document.createElement('style');
      style.id = 'novvy-cta-bridge-style';
      style.textContent = BRIDGE_CSS;
      (document.head || document.body).appendChild(style);
    }
    btn = document.createElement('button');
    btn.id = 'downloadBtn';
    btn.type = 'button';
    btn.className = 'novvy-cta-bridge-btn';
    btn.textContent = '立即下载';
    btn.addEventListener('click', function (event) {
      event.stopPropagation();
      /* 注入引擎在场即让位:引擎已在本按钮上挂了捕获监听(handleCtaClick),
         这里再跳一次会双发 novvy.open,SDK 侧双计费。 */
      if (typeof window.novvyHandleAdClick === 'function') return;
      openStoreFallback();
    });
    document.body.appendChild(btn);
    return btn;
  }
  function showBtn() { var el = ensureButton(); if (el) el.hidden = false; }
  function hideBtn() { if (btn) btn.hidden = true; }

  /* 跳转兜底链(仅编辑器预览会真正走到):与旧 cta.js 同链,去掉埋点调用。
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

  /* 结算卡片显露:showEndCard 由落地页注入脚本导出,调用即全屏卡片 + 整屏
     点击转化,同步生效无扫描延迟;预览环境不存在,自动降级为无卡片。
     层级契约:模板所有覆盖层(HUD/intro/outro)都压在卡片(999999)之下,
     见各 overlay css —— 这里直接调用即可,卡片天然在最顶层。 */
  function revealCard() {
    if (typeof window.showEndCard === 'function') {
      try { window.showEndCard(); } catch (e) {}
    }
  }

  /* —— 以下转化时序自旧 cta.js 原样迁移:胜利跳转、返回自动重开、片尾
     可见性感知延时跳转 —— */
  var pendingRestart = false, leftAfterOpen = false, converted = false;
  var viewable = window.__novvyBridgeVersion >= 1 ? !!window.__novvyViewable : true;
  var timer = null, remaining = 1000, armedAt = 0;
  function visible() { return !document.hidden && viewable; }
  function convert(restartOnReturn) {
    pendingRestart = restartOnReturn;
    leftAfterOpen = false;
    /* 注入引擎在场:走统一 primary_cta 上报 + 跳转 + 防重/冷却护栏;
       预览环境:裸兜底链。 */
    if (typeof window.novvyHandleAdClick === 'function') {
      try { window.novvyHandleAdClick(); } catch (e) {}
      return;
    }
    openStoreFallback();
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
        showBtn();
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

  /* 片尾视频起播:收起游戏期按钮(最终卡片由注入引擎承担)。 */
  window.addEventListener('novvy:outro-started', hideBtn);
  /* 片尾播完(视频自然结束):引擎卡片在此刻弹出,零延迟。 */
  window.addEventListener('novvy:outro-cta-ready', revealCard);
  window.addEventListener('novvy:outro-finished', function (event) {
    var reason = event && event.detail && event.detail.reason;
    /* 片尾被跳过/不可见中断:回到游戏,按钮重现(旧卡片此处的重现语义)。 */
    if (reason !== 'video_ended') showBtn();
    if (!window.__novvyOutroEnabled || converted) return;
    converted = true;
    if (reason === 'video_ended') {
      waitingForOutroJump = true;
      remaining = 1000;
      armOutroJump();
    } else convert(true);
  });
  window.addEventListener('novvy:victory', function () {
    /* 无片尾配置:胜利即最终时刻 —— 引擎卡片弹出 + 沿用旧的立即转化 +
       返回自动重开。有片尾时此处不动,交给 outro 事件链。 */
    if (!window.__novvyOutroEnabled && !converted) {
      converted = true;
      hideBtn();
      revealCard();
      convert(true);
    }
  });

  function boot() { showBtn(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
