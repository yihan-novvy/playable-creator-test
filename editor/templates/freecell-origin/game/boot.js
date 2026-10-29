var PLATFORM = 'web';
var callSDK = function (action) {
  if (action === 'download' && window.__ORIGIN_ADAPTER__) window.__ORIGIN_ADAPTER__.cta(true, 'native-cta');
};
(function () {
  var launched = false;
  var host = document.getElementById('origin-game');
  function viewable() { return !document.hidden && (window.__novvyBridgeVersion >= 1 ? !!window.__novvyViewable : true); }
  function audio() {
    Howler.mute(!launched || !viewable());
  }
  function fit() { if (launched) LayoutManager.fitLayout(); }
  function lifecycle() {
    if (!launched || !Game.app) return;
    if (viewable()) Game.resume(); else Game.pause();
    audio();
  }
  LayoutManager.resizeBody = false;
  LayoutManager.getScreenWidth = function () { return host.clientWidth; };
  LayoutManager.getScreenHeight = function () { return host.clientHeight; };
  Howler.mute(true);
  document.addEventListener('pointerdown', function () {
    if (!launched) return;
    SoundsManager.unlock(); audio();
  }, true);
  document.addEventListener('visibilitychange', lifecycle);
  window.addEventListener('novvy:viewablechange', lifecycle);
  window.addEventListener('resize', fit);
  function launch() {
    if (launched) return;
    launched = true;
    audio();
    Game.init(host);
    Game.on('preloadComplete', lifecycle);
    fit();
    lifecycle();
  }
  if (window.__ORIGIN_ADAPTER__) {
    window.__ORIGIN_ADAPTER__.start(launch);
  } else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', launch, { once: true });
  else launch();
})();
