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
  });
  window.addEventListener('novvy:origin-replay', function () {
    if (!settled || ended) return;
    settled = false;
    try { window.NovvyPlayable.onReplay(); } catch (_) {}
  });
  window.addEventListener('novvy:origin-cta', function (event) {
    if (!entered) return;
    console.log('[NovvyCTA]', event.detail.scene, event.detail.click_source);
    try { window.NovvyPlayable.click({ click_source: event.detail.click_source, scene: event.detail.scene }); } catch (_) {}
  });
  window.addEventListener('pagehide', function (event) {
    if (!entered || ended || event.persisted) return;
    ended = true;
    try { window.NovvyPlayable.endStage(); } catch (_) {}
  });
})();
