/* 自有下载卡(随包)的展示与交互信号。纪律:本文件零埋点、零跳转链——
   整卡复用 Download 入口,跳转/上报/冷却由注入引擎与共享转化桥处理;
   这里只响应 novvy:cta-card 显示事件并派发 novvy:cta-interact 兜底。与桥的
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
  /* 按钮保留预览兜底监听;落地页服务会在按钮 capture 段接管下载。
     卡片其余区域同步转发到按钮,复用同一套下载/上报/冷却规则;按钮及其
     子元素直接放行,避免递归或重复转发。bar 模式只接收卡片点击,
     takeover 模式的遮罩与文案点击也复用 Download。 */
  function interact(event) {
    if (event && event.stopPropagation) event.stopPropagation();
    window.dispatchEvent(new CustomEvent('novvy:cta-interact', { detail: { phase: phase } }));
  }
  var btn = document.getElementById('novvy-cta-btn');
  if (btn) btn.addEventListener('click', interact);
  root.addEventListener('click', function (event) {
    if (btn && btn.contains(event.target)) return;
    if (event.stopPropagation) event.stopPropagation();
    if (btn) btn.click();
    else interact(event);
  });
})();
