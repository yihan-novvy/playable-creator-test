(function () {
  var config = window.__ORIGIN_CONFIG__ || {};
  var entered = !config.intro, ready = !window.__ORIGIN_ADAPTER__;
  document.getElementById('grill-loading').hidden = ready;
  window.ORIGIN_RUNTIME.lifecycle = lifecycle;
  function viewable() { return (!window.ORIGIN_RUNTIME.paused); }
  function audio() {
    window.__ORIGIN_MUTED__ = !entered || !ready || !viewable() || window.ORIGIN_RUNTIME.env.muted === true;
    var scene = window.cc && cc.director.getScene();
    if (scene) scene.getComponentsInChildren('cc.AudioSource').forEach(function (source) { source.volume = window.__ORIGIN_MUTED__ ? 0 : 1; });
  }
  function lifecycle() {
    // Let loading and the first draw finish under the video, then hold the
    // rendered scene until the playable is entered and the ad is viewable.
    if (window.cc && ready) { if (entered && viewable()) cc.game.resume(); else cc.game.pause(); }
    audio();
  }
  window.playable = {
    // Disable the source ad watermark, whose interval outlives its scene.
    prData: { iosMark: '', googleMark: '' }, custom_config: {}, getPlatform: function () { return 'web'; }, getLanguage: function () { return window.ORIGIN_RUNTIME.env.language || navigator.language; },
    isIos: function () { return window.ORIGIN_RUNTIME.env.platform === 'ios'; }, log: function () {},
    gameReady: function () {}, gameStart: lifecycle, gameEnd: function () {},
    openUrl: function () { if (window.__ORIGIN_ADAPTER__) window.__ORIGIN_ADAPTER__.cta(true, 'native-cta'); }
  };
  window.playableGameData = { hideBlockDebug: true };
  document.addEventListener('pointerdown', audio, true);
  document.addEventListener('visibilitychange', lifecycle);
  window.addEventListener('origin:viewablechange', lifecycle);
  window.addEventListener('origin:intro-finished', function () { entered = true; lifecycle(); });
  window.addEventListener('origin:grill-ready', function () {
    ready = true;
    document.getElementById('grill-loading').hidden = true;
    lifecycle(); window.ORIGIN_RUNTIME.ready();
  });
  audio();
  // Preload the same engine, assets and canvas used for gameplay immediately.
  window.__ORIGIN_LOAD__();
  window.__GRILL_LAYOUT__.install(System);
  if (window.__ORIGIN_ADAPTER__) window.__ORIGIN_ADAPTER__.install(System);
  playable.ccInitBegan();
})();
