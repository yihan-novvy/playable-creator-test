(function () {
  window.addEventListener('novvy:phase2-start', function () {
    document.documentElement.classList.add('novvy-phase2');
    var second = document.getElementById('novvy-dom-bg2');
    // 未配置第二关背景时不换层:基底层(#novvy-dom-bg,纯色或第一关背景图)原样带过。
    if (!second) return;
    var first = document.getElementById('novvy-dom-bg');
    if (first) first.hidden = true;
    second.hidden = false;
  });
})();
