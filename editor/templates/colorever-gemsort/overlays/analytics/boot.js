/* Playable funnel wiring for colorever-gemsort (spec docs/PLAYABLE_MATERIAL_SPECIFICATION.md
   §3 视频切入试玩过渡 + §4 试玩互动游戏阶段). Injected by repack as the LAST script of
   the document body: the analytics lib is already loaded (head script), the hud/cta/intro
   DOM exists, and being the last-registered 'novvy:correct-placement' listener means
   novvyTrainingProgress has already advanced when gem_place_success reads it.
   Do not move this block ahead of the hud block in repack.
   NOTE: never put a literal closing head/body tag in this file — repack uses
   those tags as injection anchors, and a stray one would poison the anchor. */
(function () {
  var analytics = window.NovvyAnalytics;
  if (!analytics || typeof analytics.track !== 'function') return;

  /* Spec §2: the intro video is the package's tail-ad-video.mp4; registerMedia
     auto-reports media_play / media_progress (25/50/75) / media_complete / media_error. */
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

  /* Spec §4 game_start — the engine calls super_html.game_ready() once the
     embedded resources are unpacked. The loader looks the function up by name
     at call time, so wrapping it here is safe; the poll only covers exotic
     embeds where super_html appears late. */
  var gameStartSent = false;
  function sendGameStart() {
    if (gameStartSent) return;
    gameStartSent = true;
    analytics.track('game_start', { template: 'colorever_gem_array_v1' });
  }
  function wrapGameReady() {
    var original = window.super_html && window.super_html.game_ready;
    if (typeof original !== 'function') return false;
    window.super_html.game_ready = function () {
      sendGameStart();
      return original.apply(this, arguments);
    };
    return true;
  }
  if (!wrapGameReady()) {
    var polls = 0;
    var pollTimer = window.setInterval(function () {
      polls += 1;
      if (wrapGameReady()) {
        window.clearInterval(pollTimer);
      } else if (polls >= 100) {
        window.clearInterval(pollTimer);
        sendGameStart();
      }
    }, 100);
  }

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

  /* Spec §4 gem_place_success — one event per valid placement; progress comes
     from the HUD's START=10/STEP=15 ladder after its own listener advanced it. */
  var placementSteps = 0;
  window.addEventListener('novvy:correct-placement', function () {
    placementSteps += 1;
    var progress = window.novvyTrainingProgress && typeof window.novvyTrainingProgress.get === 'function'
      ? window.novvyTrainingProgress.get()
      : null;
    analytics.track('gem_place_success', { progress: progress, step: placementSteps });
  });

  /* Spec §4 victory — the end-of-color/level clip fires once per run here. */
  var victorySent = false;
  window.addEventListener('novvy:victory', function () {
    if (victorySent) return;
    victorySent = true;
    analytics.track('victory', { successCount: placementSteps });
  });
})();
