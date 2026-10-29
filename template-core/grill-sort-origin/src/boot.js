(function () {
  var started = false;
  function viewable() { return !document.hidden && (window.__novvyBridgeVersion >= 1 ? !!window.__novvyViewable : true); }
  function audio() {
    window.__ORIGIN_MUTED__ = !started || !viewable();
    var scene = window.cc && cc.director.getScene();
    if (scene) scene.getComponentsInChildren('cc.AudioSource').forEach(function (source) { source.volume = window.__ORIGIN_MUTED__ ? 0 : 1; });
  }
  function lifecycle() { if (window.cc && started) { if (viewable()) cc.game.resume(); else cc.game.pause(); } audio(); }
  window.playable = {
    prData: {}, custom_config: {}, getPlatform: function () { return 'web'; }, getLanguage: function () { return 'en'; },
    isIos: function () { return /iPhone|iPad/.test(navigator.userAgent); }, log: function () {},
    gameReady: function () {}, gameStart: lifecycle, gameEnd: function () {},
    openUrl: function () { if (window.__ORIGIN_ADAPTER__) window.__ORIGIN_ADAPTER__.cta(true, 'native-cta'); }
  };
  window.playableGameData = { hideBlockDebug: true };
  document.addEventListener('pointerdown', function () { if (started) audio(); }, true);
  document.addEventListener('visibilitychange', lifecycle);
  window.addEventListener('novvy:viewablechange', lifecycle);
  function launch() {
    if (started) return;
    started = true;
    audio();
    window.__ORIGIN_LOAD__();
    window.__GRILL_LAYOUT__.install(System);
    // Intercept only named game modules; the frozen Cocos runtime and resource loader remain intact.
    if (window.__ORIGIN_ADAPTER__) window.__ORIGIN_ADAPTER__.install(System);
    playable.ccInitBegan();
  }
  if (window.__ORIGIN_ADAPTER__) { window.__ORIGIN_ADAPTER__.start(launch); }
  else launch();
})();
