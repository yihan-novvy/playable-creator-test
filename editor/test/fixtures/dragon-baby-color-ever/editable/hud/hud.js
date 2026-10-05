(function () {
  var START = 10;
  var STEP = 15;
  var progress = START;
  var lastSuccessAt = 0;
  var root = document.getElementById('novvy-training-hud');
  var label = document.getElementById('novvy-hud-progress-label');

  function render() {
    root.style.setProperty('--hud-progress', progress + '%');
    label.textContent = progress + '%';
  }

  function registerSuccess() {
    var now = Date.now();
    if (now - lastSuccessAt < 450) return;
    lastSuccessAt = now;
    progress = Math.min(100, progress + STEP);
    render();
    root.classList.remove('novvy-hud-success');
    void root.offsetWidth;
    root.classList.add('novvy-hud-success');
  }

  window.addEventListener('novvy:correct-placement', registerSuccess);
  window.novvyTrainingProgress = {
    get: function () { return progress; },
    success: registerSuccess,
    reset: function () { progress = START; render(); }
  };

  function hookSuccessAudio() {
    var AudioSource = window.cc && window.cc.AudioSourceComponent;
    var prototype = AudioSource && AudioSource.prototype;
    if (!prototype || typeof prototype.playOneShot !== 'function') {
      setTimeout(hookSuccessAudio, 50);
      return;
    }
    if (prototype.__novvyProgressHooked) return;
    var original = prototype.playOneShot;
    prototype.playOneShot = function (clip) {
      var result = original.apply(this, arguments);
      var name = clip && (clip.name || clip._name || clip._native || clip.nativeUrl || '');
      // The game plays Gem_othregion_place once after a complete valid placement.
      // Gem_othregion_place_single fires once per gem and would over-count; Gem_success
      // only fires after completing a whole color/level and is too late for this HUD.
      if (/(^|\/)Gem_othregion_place(?:\.mp3)?$/i.test(String(name))) {
        window.dispatchEvent(new CustomEvent('novvy:correct-placement'));
      }
      return result;
    };
    prototype.__novvyProgressHooked = true;
  }

  render();
  hookSuccessAudio();
})();
