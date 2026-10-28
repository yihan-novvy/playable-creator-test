(function () {
  var started = false, touched = false, muted = false;
  var sound = document.getElementById('origin-sound');
  function viewable() { return !document.hidden && (window.__novvyBridgeVersion >= 1 ? !!window.__novvyViewable : true); }
  function audio() {
    window.__ORIGIN_MUTED__ = muted || !touched || !viewable();
    sound.textContent = window.__ORIGIN_MUTED__ ? 'Sound off' : 'Sound on';
    sound.setAttribute('aria-label', window.__ORIGIN_MUTED__ ? 'Unmute sound' : 'Mute sound');
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
  document.addEventListener('pointerdown', function (e) { if (started && e.target !== sound) { touched = true; audio(); } }, true);
  sound.addEventListener('click', function () { muted = touched ? !muted : false; touched = true; audio(); });
  document.addEventListener('visibilitychange', lifecycle);
  window.addEventListener('novvy:viewablechange', lifecycle);
  function launch() {
    if (started) return;
    started = true; sound.hidden = false;
    var video = document.getElementById('novvy-intro-video');
    if (video) muted = video.muted;
    audio();
    window.__ORIGIN_LOAD__();
    // Intercept only named game modules; the frozen Cocos runtime and resource loader remain intact.
    if (window.__ORIGIN_ADAPTER__) window.__ORIGIN_ADAPTER__.install(System);
    playable.ccInitBegan();
  }
  if (window.__ORIGIN_ADAPTER__) { sound.hidden = !!window.__ORIGIN_CONFIG__.intro; window.__ORIGIN_ADAPTER__.start(launch); }
  else launch();
})();
