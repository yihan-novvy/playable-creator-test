(function () {
  var START = 10;
  var STEP = 15;
  var progress = START;
  var lastSuccessAt = 0;
  var root = document.getElementById('novvy-training-hud');
  var label = document.getElementById('novvy-hud-progress-label');

  // Package mode ships the shell byte-identical across tasks: the title, aria
  // texts and the fallback bar pacing live in materials.js
  // (window.__NOVVY_UI__, loaded in <head>) and are applied here. Legacy
  // single-file packs pre-filled the DOM at pack time and carry no pacing, so
  // they keep the legacy constants.
  var ui = window.__NOVVY_UI__ && window.__NOVVY_UI__.hud;
  if (ui && typeof ui.progressStart === 'number') START = ui.progressStart;
  if (ui && typeof ui.progressStep === 'number' && ui.progressStep > 0) STEP = ui.progressStep;
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

  function registerSuccess() {
    var now = Date.now();
    if (now - lastSuccessAt < 450) return;
    lastSuccessAt = now;
    progress = Math.min(99, progress + STEP);
    render();
    root.classList.remove('novvy-hud-success');
    void root.offsetWidth;
    root.classList.add('novvy-hud-success');
    setTimeout(pollRealFill, 500);
  }

  // Gem_success plays at the level-complete moment — the board is visually
  // done here, so the bar must read 100% at the same time. This is the only
  // writer of 100: real readings cap at 99 because the fill ratio already
  // peaks on the last LIFT (occupied drops the wrong gems), a beat before the
  // final gems land.
  function snapComplete() {
    progress = 100;
    render();
  }

  window.addEventListener('novvy:correct-placement', registerSuccess);
  window.addEventListener('novvy:victory', snapComplete);

  // The pattern-reference polaroid arrives with the playable, not under the
  // intro video: no intro overlay → show at once; otherwise the intro's
  // novvy:intro-finished hands over. The timer only backs up a wedged intro
  // (its own 12s failsafe normally fires first).
  function showReference() {
    root.classList.add('is-live');
  }
  if (document.getElementById('novvy-video-intro')) {
    window.addEventListener('novvy:intro-finished', showReference, { once: true });
    window.setTimeout(showReference, 15000);
  } else {
    showReference();
  }
  window.novvyTrainingProgress = {
    get: function () { return Math.round(progress); },
    success: registerSuccess,
    complete: snapComplete,
    reset: function () { progress = START; render(); }
  };

  // Real completion: the board model answers getCorrectFillRatio()
  // (correct/occupied, 0..1 — the exact metric the game's win check uses).
  // It beats the paced fallback, whose step sizes were tuned for the old
  // grouped boards and lag far behind move-cycle boards that open ~90%
  // correct. Find it by scanning the live scene for a component (or its
  // _model) that exposes the accessor — property names survive minification,
  // node names don't. Until the scan succeeds (or the accessor ever reports
  // 0, which is what an unbuilt board returns), the paced bar stands in.
  var fillSource = null;
  function findFillSource() {
    var scene = window.cc && window.cc.director && window.cc.director.getScene && window.cc.director.getScene();
    if (!scene) return null;
    var stack = [scene];
    while (stack.length > 0) {
      var node = stack.pop();
      if (!node) continue;
      var comps = node.components;
      if (comps) {
        for (var i = 0; i < comps.length; i++) {
          var comp = comps[i];
          if (!comp) continue;
          if (typeof comp.getCorrectFillRatio === 'function') return comp;
          var model = comp._model;
          if (model && typeof model.getCorrectFillRatio === 'function') return model;
        }
      }
      var kids = node.children;
      if (kids) for (var j = 0; j < kids.length; j++) stack.push(kids[j]);
    }
    return null;
  }

  function pollRealFill() {
    if (progress >= 100) return;
    if (!fillSource || typeof fillSource.getCorrectFillRatio !== 'function') {
      fillSource = findFillSource();
      if (!fillSource) return;
    }
    var ratio = fillSource.getCorrectFillRatio();
    if (typeof ratio !== 'number' || !(ratio > 0)) return;
    var value = Math.min(99, Math.round(Math.min(1, ratio) * 100));
    if (value > progress) {
      progress = value;
      render();
    }
  }

  setInterval(pollRealFill, 400);

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
      // Gem_othregion_place_single fires once per gem and would over-count for
      // the HUD, so the placement signal uses that first clip. Gem_success only
      // fires after completing a whole color/level — too late for HUD progress,
      // but exactly the level-complete (victory) moment for analytics.
      if (/(^|\/)Gem_othregion_place(?:\.mp3)?$/i.test(String(name))) {
        window.dispatchEvent(new CustomEvent('novvy:correct-placement'));
      }
      if (/(^|\/)Gem_success(?:\.mp3)?$/i.test(String(name))) {
        window.dispatchEvent(new CustomEvent('novvy:victory'));
      }
      return result;
    };
    prototype.__novvyProgressHooked = true;
  }

  render();
  hookSuccessAudio();
})();
