(function () {
  var chain = window.__novvyStageChain__, entered = chain[0] === 'playable', settled = false, ended = false;
  try { window.NovvyPlayable.setStageList(chain.slice()); window.NovvyPlayable.setStage(1, chain[0]); } catch (_) {}
  var video = document.getElementById('novvy-intro-video');
  try { if (video) window.NovvyAnalytics.registerMedia(video, { name: 'intro_video' }); } catch (_) {}
  window.addEventListener('novvy:intro-finished', function () {
    if (entered) return;
    entered = true;
    try { window.NovvyPlayable.setStage(chain.length, 'playable'); } catch (_) {}
  });
  window.addEventListener('novvy:origin-step', function (event) {
    if (!entered || settled || ended) return;
    try { window.NovvyPlayable.onStep(event.detail.step, { progress: event.detail.progress }); } catch (_) {}
  });
  window.addEventListener('novvy:origin-result', function (event) {
    if (!entered || settled || ended) return;
    settled = true;
    var detail = event.detail;
    ended = !detail.replay;
    try { window.NovvyPlayable.onComplete({ result: detail.result, continue_playing: !!detail.replay }); } catch (_) {}
    if (detail.result === 'win') window.dispatchEvent(new CustomEvent('novvy:playable-complete', { detail: { replayable: !!detail.replay } }));
  });
  window.addEventListener('novvy:origin-replay', function () {
    if (!settled || ended) return;
    settled = false;
    try { window.NovvyPlayable.onReplay(); } catch (_) {}
    window.dispatchEvent(new CustomEvent('novvy:playable-replay'));
  });
  window.addEventListener('novvy:origin-cta', function (event) {
    if (!entered) return;
    window.dispatchEvent(new CustomEvent(event.detail.click_source === 'cta_click' ? 'novvy:cta-interact' : 'novvy:cta-moment', { detail: event.detail }));
  });
  window.addEventListener('pagehide', function (event) {
    if (!entered || ended || event.persisted) return;
    ended = true;
    try { window.NovvyPlayable.endStage(); } catch (_) {}
  });
})();
