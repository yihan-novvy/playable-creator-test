// Haptic feedback for the gemsort board, routed through the Novvy SDK
// bridge `window.novvy.haptic(style)` — one style name set on both ends
// (iOS maps to UIKit feedback generators, Android to HapticFeedbackConstants;
// unknown styles fall back to medium natively). The bridge is injected at
// document start, so it exists before this head script runs — but it only
// exists inside an SDK WebView, so every call feature-detects and
// plain-browser previews (editor, smoke) just no-op.
//
// Signal source is the same trick the HUD progress bar uses (hud.js): the
// game's audio clip names survive minification, so hooking
// AudioSourceComponent.playOneShot yields exact gameplay moments —
//   Gem_pickup                  lift a gem       -> light
//   Gem_store_place             park in cache    -> selection
//   Gem_store_move              leave the cache  -> selection
//   Gem_othregion_place_single  per-gem snap     -> selection
//   Gem_othregion_place         board placement  -> medium
//   Gem_success                 level complete   -> success
// plus a light tick when the end-card CTA activates. Cache parks and
// per-gem snaps fire in quick bursts (move-cycle patches snap K gems at
// once), so buzzes share a 45ms floor; 'success' is exempt — the win beat
// must always land.
(function () {
  var MIN_GAP_MS = 45;
  var lastBuzzAt = 0;

  function haptic(style) {
    var novvy = window.novvy;
    if (!novvy || typeof novvy.haptic !== 'function') return;
    var now = Date.now();
    if (style !== 'success' && now - lastBuzzAt < MIN_GAP_MS) return;
    lastBuzzAt = now;
    try { novvy.haptic(style); } catch (e) {}
  }

  // Clip names arrive either bare or as a path; anchored like hud.js so
  // Gem_othregion_place never also matches ..._place_single.
  var CLIP_STYLES = [
    [/(^|\/)Gem_pickup(?:\.mp3)?$/i, 'light'],
    [/(^|\/)Gem_store_(?:place|move)(?:\.mp3)?$/i, 'selection'],
    [/(^|\/)Gem_othregion_place_single(?:\.mp3)?$/i, 'selection'],
    [/(^|\/)Gem_othregion_place(?:\.mp3)?$/i, 'medium'],
    [/(^|\/)Gem_success(?:\.mp3)?$/i, 'success'],
  ];

  function hookPlayOneShot() {
    var AudioSource = window.cc && window.cc.AudioSourceComponent;
    var prototype = AudioSource && AudioSource.prototype;
    if (!prototype || typeof prototype.playOneShot !== 'function') {
      setTimeout(hookPlayOneShot, 50);
      return;
    }
    if (prototype.__novvyHapticsHooked) return;
    var original = prototype.playOneShot;
    prototype.playOneShot = function (clip) {
      var result = original.apply(this, arguments);
      var name = String((clip && (clip.name || clip._name || clip._native || clip.nativeUrl)) || '');
      for (var i = 0; i < CLIP_STYLES.length; i++) {
        if (CLIP_STYLES[i][0].test(name)) {
          haptic(CLIP_STYLES[i][1]);
          break;
        }
      }
      return result;
    };
    prototype.__novvyHapticsHooked = true;
  }

  // The CTA card exists only after the document body parses; capture phase so
  // the tick fires before cta.js's own button handler stopPropagation()s.
  function wireCta() {
    var root = document.getElementById('novvy-cta');
    if (!root) return;
    root.addEventListener('click', function (e) {
      var target = e.target;
      var onButton = target === root || (target.closest && target.closest('#novvy-cta-btn'));
      if (onButton) haptic('light');
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireCta);
  else wireCta();
  hookPlayOneShot();
})();
