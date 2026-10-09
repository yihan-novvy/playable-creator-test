/* 自有下载卡(随包)的展示与交互信号。纪律:本文件零埋点、零跳转链——
   转化/上报/防重全部在共享转化桥(cta-bridge)的 convert() 闩锁内;这里只
   响应桥的 novvy:cta-card 显示事件并对外派发 novvy:cta-interact。与桥的
   协作双通道:桥先派发时靠同步属性 __novvyCtaCardPhase 追平,晚注册则靠
   事件,两种脚本注入顺序都覆盖。 */
(function () {
  var root = document.getElementById('novvy-cta');
  if (!root) return;
  var phase = '';
  function apply(next) {
    if (phase === next) return;
    phase = next;
    root.hidden = false; /* offsetParent 出现 → 落地页服务轮询上报 end_card_shown */
    root.classList.add('novvy-cta-visible');
    if (next === 'takeover') root.classList.add('novvy-cta-takeover');
  }
  if (window.__novvyCtaCardPhase) apply(window.__novvyCtaCardPhase);
  window.addEventListener('novvy:cta-card', function (event) {
    apply((event.detail && event.detail.phase) || 'bar');
  });
  /* 按钮必须自带监听:落地页服务会在按钮上 capture+stopPropagation,拦掉
     冒泡到 root 的路径。bar 模式压暗层 pointer-events:none 点不到,点击都
     来自卡片;takeover 模式 root 覆盖整屏,target===root 也走到这里——
     "任意点击转化一次"。 */
  function interact(event) {
    if (event && event.stopPropagation) event.stopPropagation();
    window.dispatchEvent(new CustomEvent('novvy:cta-interact'));
  }
  var btn = document.getElementById('novvy-cta-btn');
  if (btn) btn.addEventListener('click', interact);
  root.addEventListener('click', interact);
})();
