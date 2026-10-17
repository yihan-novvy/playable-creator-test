(() => {
  /* Intro video phase owner. Injected by repack as the data-novvy-intro script
     before the closing body tag; the analytics lib (head) and the hud/cta DOM
     already exist. This file must never emit a literal closing head/body/script
     tag — not even in comments — because repack splices on those anchors and a
     stray one poisons the document. Everything registered here (sound watch,
     lifecycle listeners, failsafe) dies with the overlay in teardown(); the
     game shell owns pause/resume from that point on. The novvy:intro-finished
     dispatch is the analytics contract consumed by analytics/boot.js. */

  const root = document.getElementById('novvy-video-intro');
  const video = document.getElementById('novvy-intro-video');
  const soundButton = document.getElementById('novvy-intro-sound');
  const countdown = document.getElementById('novvy-intro-countdown');
  if (!root || !video || !soundButton) return;

  // Package mode carries the aria text in materials.js; see hud.js note.
  const introUi = window.__NOVVY_UI__ && window.__NOVVY_UI__.intro;
  if (introUi && typeof introUi.ariaLabel === 'string') {
    root.setAttribute('aria-label', introUi.ariaLabel);
  }

  const track = (name, params) => {
    if (window.NovvyAnalytics) window.NovvyAnalytics.track(name, params);
  };

  /* —— 进入 playable 前的 3-2-1 倒计时:取视频真实剩余时间,最后 3 秒逐秒
     亮出白色浮字;数字 3 为中等震动、2 为重震动、1 为两拍重震动(桥 haptic,预览退回 vibrate),
     配合数字的缩放回落动画提醒用户 playable 马上开始。 —— */
  let countdownPulse = null, browserPulse = false;
  const cancelPulse = () => {
    if (countdownPulse !== null) { clearTimeout(countdownPulse); countdownPulse = null; }
    if (browserPulse) { try { navigator.vibrate?.(0); } catch (_) {} browserPulse = false; }
  };
  // Build anticipation: medium on 3, heavy on 2, two heavy beats on 1.
  const buzz = n => {
    cancelPulse();
    try {
      if (typeof window.novvy?.haptic === 'function') {
        window.novvy.haptic(n === 3 ? 'medium' : 'heavy');
        if (n === 1) countdownPulse = setTimeout(() => {
          countdownPulse = null;
          if (countdownShown !== 1 || document.hidden || video.paused || video.ended) return;
          try { window.novvy.haptic('heavy'); } catch (_) {}
        }, 120);
        return;
      }
    } catch (_) {}
    try { navigator.vibrate?.(n === 3 ? 40 : n === 2 ? 65 : [65, 70, 85]); browserPulse = n === 1; } catch (_) {}
  };
  let countdownShown = 0;
  function hideCountdown() {
    cancelPulse();
    if (!countdownShown) return;
    countdownShown = 0;
    if (countdown) { countdown.hidden = true; countdown.innerHTML = ''; }
  }
  function syncCountdown() {
    if (!countdown) return;
    const duration = video.duration;
    const remaining = duration - video.currentTime;
    if (!Number.isFinite(duration) || duration <= 0 || video.ended || remaining > 3 || remaining <= 0) { hideCountdown(); return; }
    const n = Math.ceil(remaining);
    if (n === countdownShown) return;
    countdownShown = n;
    buzz(n);
    countdown.hidden = false;
    countdown.innerHTML = '<span>' + n + '</span>';
  }
  video.addEventListener('timeupdate', syncCountdown);
  video.addEventListener('ended', hideCountdown);

  // Icon + label live in one place; the button itself ships empty because the
  // SVG strings are static template content (safe to bake into the shell).
  const SVG_SOUND_ON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';
  const SVG_SOUND_OFF = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon><line x1="22" y1="9" x2="16" y2="15"></line><line x1="16" y1="9" x2="22" y2="15"></line></svg>';

  function updateSoundControl() {
    const muted = video.muted;
    soundButton.innerHTML = muted ? SVG_SOUND_OFF : SVG_SOUND_ON;
    soundButton.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
    soundButton.setAttribute('title', muted ? 'Unmute sound' : 'Mute sound');
  }

  let finished = false;
  let customCloseRequested = false;
  let creativeStarted = false;
  let playbackBlocked = false;
  // True while the SDK lifecycle (or finish) paused the video on purpose —
  // the self-heal below must never fight an intentional pause.
  let ownerPaused = false;

  // reason maps onto the spec's playable_entry payload: video_ended (natural
  // end or decode error) and timer_reached (the failsafe) are dispatched;
  // user_skip stays in the contract but is no longer fired — tapping the
  // video focuses it (unlock sound) instead of skipping. The DOM event
  // decouples this overlay from analytics.
  const finish = (reason) => {
    if (finished) return;
    finished = true;
    let switchSeconds = 0;
    try { switchSeconds = Math.round(video.currentTime || 0); } catch (_error) {}
    ownerPaused = true;
    try { video.pause(); } catch (_error) {}
    hideCountdown();
    teardown(reason || 'video_ended'); // release close BEFORE playable_entry lands
    // 保留视频最后一帧,直到图片解码且棋盘首帧已绘制;game.js 晚到也能接上。
    let revealed = false, readyTimeout = null;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      window.removeEventListener('escape-arrow:ready', reveal);
      if (readyTimeout !== null) window.clearTimeout(readyTimeout);
      window.__novvyIntroFinished = true;
      try {
        window.dispatchEvent(new CustomEvent('novvy:intro-finished', {
          detail: { reason: reason || 'video_ended', switch_seconds: switchSeconds },
        }));
      } catch (_error) {}
      root.classList.add('is-finished');
      window.setTimeout(() => root.remove(), 220);
    };
    if (window.__ESCAPE_ARROW_READY__) reveal();
    else {
      window.addEventListener('escape-arrow:ready', reveal);
      // 脚本本身下载失败时也不永久锁住广告;单张图片的超时/错误由引擎兜底。
      readyTimeout = window.setTimeout(reveal, 12000);
    }
  };

  function releaseCustomClose(reason) {
    if (!customCloseRequested) return;
    if (window.novvy && typeof window.novvy.useCustomClose === 'function') {
      try {
        window.novvy.useCustomClose(false);
        track('custom_close_disabled', { reason: reason });
      } catch (error) {
        track('custom_close_disable_failed', { reason: reason });
      }
    }
    customCloseRequested = false;
  }

  // Everything the intro registered dies with it: the game shell owns
  // pause/resume from here, and a detached video must never be played by a
  // stale page-level listener.
  function teardown(reason) {
    stopSoundWatch();
    clearFailsafe();
    window.removeEventListener('novvy:viewablechange', onViewableChange);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    releaseCustomClose(reason);
  }

  soundButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    video.muted = !video.muted;
    soundLocked = true; // explicit user choice — stop second-guessing it
    updateSoundControl();
    // interaction(), not click(): muting is not an ad click. click() asks the
    // SDK to fire the campaign's click URL, so routing the sound toggle
    // through it billed a click and inflated CTR every time someone tapped it.
    if (window.NovvyAnalytics) {
      window.NovvyAnalytics.interaction('sound_button', video.muted ? 'mute' : 'unmute');
    }
    // Template-only addition (the reference recovers a blocked video through
    // its end card; we have none): an unmute tap is a gesture, so let it kick
    // a frozen video too.
    if (!video.muted && video.paused && !video.ended) playVideo();
  });

  // The autoplay fallback below is a one-way latch: it mutes when the platform
  // refuses audible playback, and nothing ever unmutes again.  On iOS that
  // refusal is usually transient — the host app's own player is holding the
  // audio session at the moment the ad appears, and lets go a moment later —
  // so a single refusal at frame one should not pin the creative silent for
  // its whole life.  Keep asking while the video is rolling. (docs/example port)
  let soundLocked = false;
  let soundTimer = setInterval(restoreSound, 500);

  function stopSoundWatch() {
    if (soundTimer) { clearInterval(soundTimer); soundTimer = null; }
  }

  function restoreSound() {
    if (soundLocked || video.ended) { stopSoundWatch(); return; }
    if (ownerPaused || document.hidden || !creativeStarted) return; // lifecycle owns playback
    if (video.paused) { resumeSilently(); return; } // frozen — see the pause self-heal below
    if (!video.muted) return; // rolling with sound — nothing to fix
    video.muted = false;
    updateSoundControl();
    const playback = video.play();
    if (playback && playback.catch) playback.catch(() => {});
    // Unmuting is not free: WebKit pauses a video that was only allowed to play *because*
    // it was muted, the instant you unmute it.  Verify we are still rolling and go back to
    // silent playback if not — a muted ad is bad, a frozen one is worse.
    setTimeout(() => {
      if (video.muted) return; // the user muted it themselves in the meantime
      if (!video.paused || video.ended) { track('sound_restored'); return; }
      resumeSilently();
    }, 120);
  }

  // Silent playback always stays legal (muted autoplay), so it is the recovery
  // path for any pause the platform forced on us: the unmute fight above can
  // lose the race twice — WebKit's pause can land after the verify window has
  // given up (it then logs sound_restored and walks away), and a rejected
  // re-play fires no event at all.  Either way the video used to sit frozen
  // until a tap; a muted ad is bad, a frozen one is worse.  Tracked once per
  // intro so the funnel shows how often platforms force the pause.
  let selfHealTracked = false;
  function resumeSilently() {
    if (!video.muted) {
      video.muted = true;
      updateSoundControl();
    }
    if (!selfHealTracked) { selfHealTracked = true; track('playback_self_healed'); }
    const resume = video.play();
    if (resume && resume.catch) resume.catch(() => {});
  }

  function playVideo() {
    ownerPaused = false; // any owner path resuming here reclaims playback
    const playback = video.play();
    if (!playback || typeof playback.catch !== 'function') return;
    playback.catch(() => {
      // Some browsers prohibit audible autoplay.  Keep the creative moving
      // and expose the visible control so the user can enable sound.
      video.muted = true;
      updateSoundControl();
      track('autoplay_muted_fallback');
      const retry = video.play();
      if (retry && typeof retry.catch === 'function') {
        retry.catch(() => {
          // No end card in this template — the failsafe finishes the intro
          // and the playable starts.  Record why nothing rolled so the
          // funnel explains the short watch time.
          if (!playbackBlocked) { playbackBlocked = true; track('playback_blocked'); }
        });
      }
    });
  }

  // The 30s failsafe bounds the video phase.  The reference has no timer; ours
  // must not keep ticking while the SDK has us paused — a timer_reached finish
  // during a backgrounded ad would drop the user into the playable with the
  // video unseen.  Count only creative-visible time.
  const FAILSAFE_MS = 30000;
  let failsafeTimer = null;
  let failsafeRemaining = FAILSAFE_MS;
  let failsafeArmedAt = 0;
  function armFailsafe() {
    if (failsafeTimer) window.clearTimeout(failsafeTimer);
    failsafeArmedAt = Date.now();
    failsafeTimer = window.setTimeout(() => finish('timer_reached'), failsafeRemaining);
  }
  function freezeFailsafe() {
    if (failsafeTimer === null) return;
    window.clearTimeout(failsafeTimer);
    failsafeTimer = null;
    failsafeRemaining = Math.max(0, failsafeRemaining - (Date.now() - failsafeArmedAt));
  }
  function clearFailsafe() {
    if (failsafeTimer !== null) { window.clearTimeout(failsafeTimer); failsafeTimer = null; }
  }

  // The SDK owns playback while an ad is visible.  The fallback preserves
  // normal browser playback for local previews and older integrations.
  // (docs/example bindNovvyLifecycle, un-nested so finish() can remove it.)
  let started = false;
  function startCreative() {
    creativeStarted = true;
    if (!customCloseRequested && window.novvy && typeof window.novvy.useCustomClose === 'function') {
      try {
        window.novvy.useCustomClose(true);
        customCloseRequested = true;
        track('custom_close_enabled');
      } catch (error) {
        track('custom_close_enable_failed');
      }
    }
    playVideo();
    armFailsafe();
    track('creative_started');
  }
  function pauseCreative() {
    ownerPaused = true;
    video.pause();
    track('creative_paused');
    freezeFailsafe();
  }
  function resumeCreative() {
    playVideo();
    armFailsafe();
    track('creative_resumed');
  }
  function run(viewable) {
    if (finished) return; // lifecycle after the intro ended must stay inert
    if (!viewable) { if (started) pauseCreative(); return; }
    if (!started) { started = true; startCreative(); }
    else resumeCreative();
  }
  function onViewableChange(event) {
    run(!!(event && event.detail && event.detail.viewable));
  }
  function onVisibilityChange() {
    if (finished) return;
    if (document.hidden) { freezeFailsafe(); return; }
    releaseCustomClose('creative_returned');
    // Store handoffs/backgrounding do not consistently re-dispatch the
    // native bridge event, so resume directly when the page returns.
    if (creativeStarted && !video.ended) {
      playVideo();
      armFailsafe();
      track('creative_resumed_browser');
    }
  }

  if (window.__novvyBridgeVersion >= 1) {
    if (window.__novvyViewable) run(true);
    window.addEventListener('novvy:viewablechange', onViewableChange);
  } else {
    run(true);
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Tap-to-focus, not tap-to-skip: a tap is the user gesture WebViews demand
  // before allowing audible playback, so it flips mute off and kicks playback.
  // The restore watch keeps that promise when the platform pauses the newly
  // unmuted video; soundLocked stays reserved for the explicit icon toggle.
  // The video phase cannot be skipped by tapping.
  root.addEventListener('click', (event) => {
    if (finished) return; // the overlay lingers ~220ms after finish
    if (event.target === soundButton || (soundButton.contains && soundButton.contains(event.target))) return;
    if (video.muted) {
      video.muted = false;
      updateSoundControl();
      // Same telemetry-only channel as the icon: a focus tap is not an ad click.
      if (window.NovvyAnalytics) {
        window.NovvyAnalytics.interaction('video', 'unmute');
      }
    }
    if (!video.ended) playVideo(); // frozen video resumes; a rolling one no-ops
  });

  // WebKit keeps the poster placeholder composited over the video even while
  // it plays — frames decode (audio rolls, timeupdate fires) but the
  // placeholder layer never swaps out, so the screen stays on the poster
  // forever. The attribute's job (covering parse→first-frame while the engine
  // boots) is done once a real frame exists: drop it on the first presented
  // frame (rVFC), with 'playing' as the fallback — in the stuck state rVFC
  // may never fire, and removing the poster is itself what un-sticks the
  // compositor.
  const dropPoster = () => video.removeAttribute('poster');
  if (typeof video.requestVideoFrameCallback === 'function') {
    video.requestVideoFrameCallback(dropPoster);
  }
  video.addEventListener('playing', dropPoster, { once: true });

  // Instant self-heal: a platform-forced pause fires 'pause' the moment it
  // lands, so recover here instead of waiting for the next 500ms watch tick —
  // that gap is a visible stall, and before this handler existed nothing
  // recovered at all except the tap-to-focus handler, which is why frozen
  // intros needed a tap to continue.  Intentional pauses (lifecycle, finish)
  // are excluded via ownerPaused; a soundLocked user keeps their explicit
  // mute choice.
  video.addEventListener('pause', () => {
    if (finished || video.ended || ownerPaused || document.hidden) return;
    if (!soundLocked) resumeSilently();
    else playVideo();
  });

  video.addEventListener('ended', () => finish('video_ended'), { once: true });
  video.addEventListener('error', () => finish('video_ended'), { once: true });

  // Playback starts through the lifecycle above (startCreative → playVideo);
  // with no bridge, run(true) already fired synchronously there.
  video.muted = false;
  updateSoundControl();
})();
