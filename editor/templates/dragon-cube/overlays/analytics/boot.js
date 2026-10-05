/* Playable funnel wiring for water-sort (spec docs/PLAYABLE_MATERIAL_SPECIFICATION.md
   §2 视频阶段 + §3 视频切入试玩过渡 + §4 试玩互动游戏阶段). Injected by
   buildWsOverlayInjection as the LAST body script: the analytics lib is already
   loaded (head inline script), the hud/cta/intro DOM exists, and the shell's
   game.js is a defer script — it executes after this block, so the shell's boot
   emit of novvy:hud-progress (the readiness signal below) cannot slip past
   these listeners. This file must never contain a literal closing script tag —
   not even in comments — it is spliced into an inline script block. */
(function () {
  var analytics = window.NovvyAnalytics;
  if (!analytics || typeof analytics.track !== 'function') return;

  /* Spec §2: the intro video ships as tail-ad-video.mp4; registerMedia
     auto-reports media_play / media_pause / media_progress (25/50/75) /
     media_complete / media_error. */
  var introVideo = document.getElementById('novvy-intro-video');
  if (introVideo && typeof analytics.registerMedia === 'function') {
    analytics.registerMedia(introVideo, { name: 'tail_ad_video' });
  }

  /* Spec §3 playable_entry — fired by the intro overlay's finish(reason). */
  window.addEventListener('novvy:intro-finished', function (event) {
    var detail = (event && event.detail) || {};
    analytics.track('playable_entry', {
      reason: detail.reason || 'video_ended',
      switch_seconds: typeof detail.switch_seconds === 'number' ? detail.switch_seconds : 0
    });
  });

  /* Spec §4 game_start — the shell has no engine-ready callback; its first
     novvy:hud-progress IS readiness (the game broadcasts once while booting,
     after the initial board layout, before any input exists). */
  var gameStartSent = false;
  function sendGameStart() {
    if (gameStartSent) return;
    gameStartSent = true;
    analytics.track('game_start', { template: 'dragon_cube_v1' });
  }

  /* Spec §4 puzzle_placement — every rising edge of the homed-color percent is
     one pour that placed new liquid. The boot emit (initial board) and
     non-advancing states (selection, undo, reset, post-restart redeal) never
     rise, so only real progress counts; progress is the raw homed fraction
     (percent 0-100), step counts placements across auto-restarts. */
  var placementSteps = 0;
  var seenBootProgress = false;
  var lastPercent = 0;
  window.addEventListener('novvy:hud-progress', function (event) {
    sendGameStart();
    var percent = Math.round(Number(event.detail && event.detail.percent) || 0);
    if (!seenBootProgress) {
      seenBootProgress = true;
      lastPercent = percent;
      return;
    }
    if (percent > lastPercent) {
      placementSteps += 1;
      analytics.track('puzzle_placement', { progress: percent, step: placementSteps });
      lastPercent = percent;
    }
  });

  /* Spec §4 victory — the shell raises novvy:victory on every win (the CTA
     layer auto-restarts after each one); the BI funnel is first-win rate, so
     the event is latched like colorever's boot does. */
  var victorySent = false;
  window.addEventListener('novvy:victory', function () {
    if (victorySent) return;
    victorySent = true;
    analytics.track('victory', { successCount: placementSteps });
  });

  /* Spec §4 first_interaction — first touch that can actually reach the board.
     While the intro overlay exists the video phase is still running; taps on
     the CTA card belong to cta_click, not board engagement. */
  function firstTouch(event) {
    if (document.getElementById('novvy-video-intro') !== null) return;
    if (event && event.target && event.target.closest && event.target.closest('#novvy-cta')) return;
    document.removeEventListener('pointerdown', firstTouch, true);
    document.removeEventListener('touchstart', firstTouch, true);
    analytics.track('first_interaction', { trigger: 'canvas_touch' });
  }
  document.addEventListener('pointerdown', firstTouch, true);
  document.addEventListener('touchstart', firstTouch, true);
})();
