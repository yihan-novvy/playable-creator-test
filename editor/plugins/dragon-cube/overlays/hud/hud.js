(function () {
  var START = 10;
  var progress = START;
  var root = document.getElementById('novvy-training-hud');
  var label = document.getElementById('novvy-hud-progress-label');

  // Package mode ships the shell byte-identical across tasks: the title, aria
  // texts and the start percent live in the window.__NOVVY_UI__ head script
  // and are applied here. (Water-sort variant: no paced fallback — the game
  // reports the real homed-color fraction, see the listener below.)
  var ui = window.__NOVVY_UI__ && window.__NOVVY_UI__.hud;
  if (ui && typeof ui.progressStart === 'number') START = ui.progressStart;
  progress = START;
  if (root && ui) {
    var line1 = document.getElementById('novvy-hud-title-line1');
    var line2 = document.getElementById('novvy-hud-title-line2');
    if (line1 && typeof ui.titleLine1 === 'string') line1.textContent = ui.titleLine1;
    if (line2 && typeof ui.titleLine2 === 'string') line2.textContent = ui.titleLine2;
    if (typeof ui.ariaLabel === 'string') root.setAttribute('aria-label', ui.ariaLabel);
  }

  function render() {
    var shown = Math.round(progress);
    root.style.setProperty('--hud-progress', shown + '%');
    label.textContent = shown + '%';
  }

  // 真实数据源:广告壳(ad-main.js)在每次状态变化时把「已归位颜色比例」
  // 派发成 novvy:hud-progress(detail.percent 0-100)。起步垫 progressStart,
  // 只涨不跌,封顶 99——100 只属于胜利。
  function onHudProgress(event) {
    var percent = Math.round(Number(event.detail && event.detail.percent) || 0);
    var value = Math.min(99, Math.max(progress, Math.max(START, percent)));
    if (value > progress) {
      progress = value;
      render();
    }
  }

  // 胜利是 100 的唯一来源:归位比例在最后一瓶倒完时才到顶,和 colorever 一致,
  // 真实读数封顶 99,胜利瞬间直接打满。
  function snapComplete() {
    progress = 100;
    render();
  }

  window.addEventListener('novvy:hud-progress', onHudProgress);
  window.addEventListener('novvy:victory', snapComplete);
  // 双 playable:第二关就绪时换标题,进度回到起点(新关卡重新计数)。
  window.addEventListener('novvy:phase2-start', function (event) {
    var title = event.detail && event.detail.hud;
    if (title) {
      var line1 = document.getElementById('novvy-hud-title-line1');
      var line2 = document.getElementById('novvy-hud-title-line2');
      if (line1) line1.textContent = title.titleLine1 || '';
      if (line2) line2.textContent = title.titleLine2 || '';
    }
    progress = START;
    render();
  });
  window.novvyTrainingProgress = {
    get: function () { return Math.round(progress); },
    complete: snapComplete,
    reset: function () { progress = START; render(); }
  };

  render();
})();
