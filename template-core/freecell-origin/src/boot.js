var PLATFORM = 'web';
var callSDK = function (action) {
  if (action === 'download' && window.__ORIGIN_ADAPTER__) window.__ORIGIN_ADAPTER__.cta(true, 'native-cta');
};
(function () {
  var launched = false, touched = false, muted = false;
  var host = document.getElementById('origin-game'), sound = document.getElementById('origin-sound');
  function viewable() { return !document.hidden && (window.__novvyBridgeVersion >= 1 ? !!window.__novvyViewable : true); }
  function audio() {
    var off = muted || !touched || !viewable();
    Howler.mute(off);
    sound.textContent = off ? 'Sound off' : 'Sound on';
    sound.setAttribute('aria-label', off ? 'Unmute sound' : 'Mute sound');
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
  document.addEventListener('pointerdown', function (event) {
    if (event.target === sound || !launched) return;
    touched = true; audio();
  }, true);
  sound.addEventListener('click', function () { muted = touched ? !muted : false; touched = true; audio(); });
  document.addEventListener('visibilitychange', lifecycle);
  window.addEventListener('novvy:viewablechange', lifecycle);
  window.addEventListener('resize', fit);
  function launch() {
    if (launched) return;
    launched = true;
    sound.hidden = false;
    var video = document.getElementById('novvy-intro-video');
    if (video) muted = video.muted;
    Game.init(host);
    Game.on('preloadComplete', lifecycle);
    fit();
    lifecycle();
  }
  if (window.__ORIGIN_ADAPTER__) {
    sound.hidden = !!window.__ORIGIN_CONFIG__.intro;
    window.__ORIGIN_ADAPTER__.start(launch);
  } else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', launch, { once: true });
  else launch();
})();
