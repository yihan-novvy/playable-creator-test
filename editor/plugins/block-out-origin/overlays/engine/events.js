/* Block Out counts a completed drag even when it only repositions a block.
   Keep steps separate from monotonic exit progress; do not use hud-progress's
   progress-increase-only step inference. Both native levels form one stage. */
(function () {
  var NovvyPlayable = window.NovvyPlayable;
  var NovvyAnalytics = window.NovvyAnalytics;
  var chain = window.__novvyStageChain__;
  var ended = false, settled = false, entered = chain[0] === 'playable';
  try { NovvyPlayable.setStageList(chain.slice()); NovvyPlayable.setStage(1, chain[0]); } catch (_) {}
  var video = document.getElementById('novvy-intro-video');
  try { if (video) NovvyAnalytics.registerMedia(video, { name: 'intro_video' }); } catch (_) {}
  window.addEventListener('novvy:intro-finished', function () {
    if (entered) return;
    entered = true;
    try { NovvyPlayable.setStage(chain.length, 'playable'); } catch (_) {}
  });
  window.addEventListener('novvy:block-out-step', function (event) {
    if (!entered || settled || ended) return;
    try { NovvyPlayable.onStep(event.detail.step, { progress: event.detail.progress }); } catch (_) {}
  });
  function settle(result, event) {
    if (settled || ended || !entered) return;
    settled = true;
    var replayable = !!event.detail.replayable;
    ended = !replayable;
    try { NovvyPlayable.onComplete(replayable ? { result: result, continue_playing: true } : { result: result }); } catch (_) {}
  }
  window.addEventListener('novvy:playable-complete', function (event) { settle('win', event); });
  window.addEventListener('novvy:playable-failed', function (event) { settle('fail', event); });
  window.addEventListener('novvy:block-out-replay', function () {
    if (!settled || ended) return;
    settled = false;
    try { NovvyPlayable.onReplay(); } catch (_) {}
    window.dispatchEvent(new CustomEvent('novvy:playable-replay'));
  });
  // Only an actual page departure ends an unfinished stage. Backgrounding or
  // opening a store can resume and must not fabricate a final result.
  window.addEventListener('pagehide', function (event) {
    if (!entered || ended || event.persisted) return;
    ended = true;
    try { NovvyPlayable.endStage(); } catch (_) {}
  });
  window.addEventListener('novvy:block-out-cta', function (event) {
    if (!entered) return;
    window.dispatchEvent(new CustomEvent(event.detail.click_source === 'cta_click' ? 'novvy:cta-interact' : 'novvy:cta-moment', { detail: event.detail }));
  });
})();
