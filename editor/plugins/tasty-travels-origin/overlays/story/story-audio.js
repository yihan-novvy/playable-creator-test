(function () {
  'use strict';
  // The assembly plays the original two music loops during the story. The
  // game starts its own audio only when the story hands over to gameplay.
  window.__novvyCreateStoryAudio = function (button) {
    var context = null, master = null, active = false, stopped = false, muted = new URLSearchParams(location.search).get('muted') === '1';
    var music = (window.__TASTY_STORY_MUSIC__ || []).map(function (track) {
      var audio = new Audio(track.src); audio.loop = true; audio.volume = track.volume; return audio;
    });
    var bubble = null, pendingCue = false, voices = new Set();
    var nativeSound = window.__novvyStorySound = { active: false, muted: false };
    function publish() {
      nativeSound.active = active && !stopped; nativeSound.muted = muted;
      window.dispatchEvent(new CustomEvent('novvy:story-sound'));
    }
    function allowed() { return active && !stopped && !muted && !document.hidden && (window.__novvyBridgeVersion >= 1 ? !!window.__novvyViewable : true); }
    function running() { return allowed() && context && context.state === 'running'; }
    function label() {
      if (!button) return;
      var audible = !!running();
      button.dataset.muted = String(!audible);
      button.setAttribute('aria-label', audible ? 'Mute story sound' : 'Enable story sound');
      button.setAttribute('aria-pressed', String(muted));
      button.querySelector('.tasty-story-sound-label').textContent = audible ? 'Sound' : 'Muted';
    }
    function createBubble() {
      var duration = .115, buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
      var samples = buffer.getChannelData(0), seed = 137;
      // A rapidly falling resonance and a tiny noisy attack make one wet pop,
      // with no pitched second note or ringing tail. Reuse the same short PCM.
      for (var i = 0; i < samples.length; i++) {
        var t = i / context.sampleRate, attack = 1 - Math.exp(-t / .0008);
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        var noise = seed / 2147483648 - 1;
        var phase = 2 * Math.PI * (150 * t + 1050 * .012 * (1 - Math.exp(-t / .012)));
        samples[i] = attack * (1 - t / duration) * (.8 * Math.sin(phase) * Math.exp(-t / .018) + .22 * noise * Math.exp(-t / .003));
      }
      return buffer;
    }
    function silence() {
      if (master) master.gain.value = 0;
      voices.forEach(function (source) {
        source.onended = null;
        try { source.stop(); } catch (_) {}
        source.disconnect();
      });
      voices.clear();
    }
    function cue() {
      var source = context.createBufferSource();
      source.buffer = bubble; source.connect(master); voices.add(source);
      source.onended = function () { voices.delete(source); source.disconnect(); };
      source.start();
    }
    function sync() {
      music.forEach(function (audio) { if (allowed()) audio.play().catch(function () {}); else audio.pause(); });
      if (running()) {
        master.gain.value = .45;
        if (pendingCue) { pendingCue = false; cue(); }
      } else {
        silence();
        if (!allowed()) {
          pendingCue = false;
          if (context && context.state === 'running') context.suspend().catch(function () {});
        }
      }
      label();
    }
    function unlock() {
      if (!allowed()) return;
      pendingCue = false;
      publish();
      try {
        if (!context) {
          var AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) return;
          context = new AudioContext(); master = context.createGain(); master.gain.value = 0; master.connect(context.destination);
          bubble = createBubble(); context.onstatechange = sync;
        }
        // Retry on real gestures when autoplay is blocked; never queue a delayed
        // sound that could outlive the story. Native BGM has its own lifecycle.
        if (context.state !== 'running') context.resume().then(sync, function () { label(); });
        sync();
      } catch (_) { silence(); label(); }
    }
    function lifecycle() { if (allowed()) unlock(); else sync(); }
    function toggle(event) {
      event.stopPropagation();
      muted = !!running();
      publish();
      if (muted) sync(); else unlock();
    }
    document.addEventListener('visibilitychange', lifecycle);
    window.addEventListener('novvy:viewablechange', lifecycle);
    if (button) button.addEventListener('click', toggle);
    label();
    return {
      start: function () { if (!stopped) { active = true; publish(); unlock(); } },
      unlock: unlock,
      dialogue: function () { if (!allowed()) return; if (running()) cue(); else pendingCue = true; },
      stop: function () {
        if (stopped) return;
        stopped = true; active = false; pendingCue = false; silence();
        music.forEach(function (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); });
        // The immediately following story-finished event hands music to the
        // playable. Do not emit a mute event here and interrupt those loops.
        nativeSound.active = false;
        document.removeEventListener('visibilitychange', lifecycle);
        window.removeEventListener('novvy:viewablechange', lifecycle);
        if (button) { button.removeEventListener('click', toggle); button.disabled = true; }
        if (context) { context.onstatechange = null; context.close().catch(function () {}); }
      }
    };
  };
})();
