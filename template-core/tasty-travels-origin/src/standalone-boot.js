(function () {
  var started = false, ready = false;
  var config = window.__ORIGIN_CONFIG__ || {};
  var entered = config.story ? !!false : !config.intro || !!false;
  window.super_html_channel = 'web';
  window.SW_qudao = 'web';
  window.isMute = 0;
  window.super_log = function () {};
  window.super_eval = function (key) {
    var source = window.__res[key];
    if (source) { (0, eval)(source); delete window.__res[key]; }
  };
  window.ORIGIN_RUNTIME.lifecycle = lifecycle;
  function viewable() { return (!window.ORIGIN_RUNTIME.paused); }
  function audio() {
    var storySound = null;
    var storyMusic = storySound && storySound.active && !storySound.muted;
    var wasMuted = window.isMute === 1, off = (!entered && !storyMusic) || !ready || !viewable() || window.ORIGIN_RUNTIME.env.muted === true;
    window.isMute = off ? 1 : 0;
    if (window.cc && cc.audioEngine) {
      cc.audioEngine.setEffectsVolume(off ? 0 : 1); cc.audioEngine.setMusicVolume(off ? 0 : 1);
      if (off) cc.audioEngine.pauseAll();
      else {
        // This frozen engine pauses audio together with cc.game.pause(). Restore
        // its audio cache without resuming physics behind the story overlay.
        cc.audioEngine._restore(); cc.audioEngine.resumeAll();
        var context = cc.sys.__audioSupport && cc.sys.__audioSupport.context;
        if (context && context.state !== 'running' && context.state !== 'closed') context.resume().catch(function () {});
      }
    }
    if (window.__require) { try {
      window.__require('GameManager').GameManager.isMute = off;
      // Start the original bgm/bgm2 loops once the scene is ready. Existing
      // SoundManager deduplication keeps the same tracks through story → game.
      if (wasMuted && !off) {
        var game = window.__require('GameScript').default.instance;
        if (game) game.playBgm();
      }
    } catch (_) {} }
  }
  function lifecycle() {
    // Finish initialization and one real draw under the video before pausing.
    // Pausing at scene launch would leave an unpainted canvas at the transition.
    if (window.cc && ready) { if (entered && viewable()) cc.game.resume(); else cc.game.pause(); }
    audio();
  }
  window.super_html = {
    is_hide_download: function () { return true; }, is_audio: function () { return !window.isMute; },
    game_end: function () {}, download: function () { if (window.__ORIGIN_ADAPTER__) window.__ORIGIN_ADAPTER__.cta(true, 'native-cta'); }
  };
  // The native first-touch handler unlocks browser audio and starts both BGM tracks.
  document.addEventListener('pointerdown', function () { if (started) audio(); }, true);
  document.addEventListener('visibilitychange', lifecycle);
  window.addEventListener('origin:viewablechange', lifecycle);
  window.addEventListener('origin:story-sound', lifecycle);
  window.addEventListener(config.story ? 'origin:story-finished' : 'origin:intro-finished', function () { entered = true; lifecycle(); });
  function launch() {
    if (started) return;
    started = true;
    audio();
    var originalBoot = window.boot;
    window.boot = function () {
      // Fill the embedded viewport; the scene camera reserves HUD/CTA space.
      // The build also disables the native onStart's later fullscreen request.
      cc.view._frame = document.getElementById('origin-game');
      cc.view.enableAutoFullScreen(false);
      cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
        // Cocos resumes on a native visibility event too. Reapply the intro
        // gate after that handler so returning to the ad cannot start play early.
        cc.game.on(cc.game.EVENT_SHOW, lifecycle);
        cc.director.once(cc.Director.EVENT_AFTER_DRAW, function () { ready = true; lifecycle(); window.ORIGIN_RUNTIME.ready(); });
      });
      originalBoot();
    };
    // Give the splash a paint before synchronous engine evaluation, including
    // the all-inline preview where no network request yields to the renderer.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { window.super_boot_engine(); });
    });
  }
  if (window.__ORIGIN_ADAPTER__) window.__ORIGIN_ADAPTER__.start(launch);
  else launch();
})();
