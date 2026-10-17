(() => {
  const root = document.getElementById('novvy-video-outro');
  const video = document.getElementById('novvy-outro-video');
  const sound = document.getElementById('novvy-outro-sound');
  const play = document.getElementById('novvy-outro-play');
  const countdown = document.getElementById('novvy-outro-countdown');
  if (!root || !video || !sound || !play) return;
  let active = false, consumed = false;
  let ctaReady = false;
  function revealCta() {
    if (ctaReady) return;
    ctaReady = true;
    window.dispatchEvent(new CustomEvent('novvy:outro-cta-ready'));
  }
  /* —— 双 playable:片尾之后还有第二关,最后 3 秒逐秒亮出 3-2-1 白色浮字,
     数字 3 为中等震动、2 为重震动、1 为两拍重震动(桥 haptic,预览退回 vibrate),配合缩放回落
     动画提醒用户 playable 马上开始。单 playable 片尾通向结算停留,不出倒计时。 —— */
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
    if (!window.__novvyTwoPhase || !active || !Number.isFinite(duration) || duration <= 0 || video.ended || remaining > 3 || remaining <= 0) { hideCountdown(); return; }
    const n = Math.ceil(remaining);
    if (n === countdownShown) return;
    countdownShown = n;
    buzz(n);
    countdown.hidden = false;
    countdown.innerHTML = '<span>' + n + '</span>';
  }
  video.addEventListener('timeupdate', syncCountdown);
  video.addEventListener('ended', hideCountdown);
  let viewable = window.__novvyBridgeVersion >= 1 ? !!window.__novvyViewable : true;
  let attempt = 0;
  const visible = () => !document.hidden && viewable;
  const SVG_SOUND_ON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';
  const SVG_SOUND_OFF = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon><line x1="22" y1="9" x2="16" y2="15"></line><line x1="16" y1="9" x2="22" y2="15"></line></svg>';

  function updateSound() {
    sound.innerHTML = video.muted ? SVG_SOUND_OFF : SVG_SOUND_ON;
    sound.setAttribute('aria-label', video.muted ? 'Unmute sound' : 'Mute sound');
    sound.setAttribute('title', video.muted ? 'Unmute sound' : 'Mute sound');
  }
  function finish(reason) {
    if (!active) return;
    active = false;
    attempt++;
    video.pause();
    hideCountdown();
    if (reason === 'video_ended') revealCta();
    root.hidden = reason !== 'video_ended';
    sound.hidden = reason === 'video_ended';
    play.hidden = true;
    window.dispatchEvent(new CustomEvent('novvy:outro-finished', { detail: { reason } }));
  }
  async function playVideo() {
    if (!active || !visible()) return;
    const token = ++attempt;
    play.hidden = true;
    try { await video.play(); }
    catch (_) {
      if (token !== attempt || !active || !visible()) return;
      video.muted = true;
      updateSound();
      try { await video.play(); }
      catch (_) { if (token === attempt && active && visible()) play.hidden = false; }
    }
  }
  function syncVisibility() {
    if (!active) return;
    if (visible()) void playVideo();
    else { attempt++; video.pause(); }
  }
  // Start after the current round's animation settles. In a two-playable ad,
  // the first round advances through this video on either win or failure.
  function startVideo() {
    if (active || consumed) return;
    consumed = true;
    active = true;
    ctaReady = false;
    countdownShown = 0;
    video.currentTime = 0;
    video.muted = false;
    root.hidden = false;
    updateSound();
    window.dispatchEvent(new CustomEvent('novvy:outro-started'));
    if (video.error) { finish('video_error'); return; }
    void playVideo();
  }
  window.addEventListener('novvy:victory', startVideo);
  window.addEventListener('escape-arrow:continue-video', startVideo);
  window.addEventListener('novvy:hud-progress', event => {
    /* 双 playable:片尾位于两关之间只播一次,第二关的进度回落不复位 consumed。 */
    if (window.__novvyTwoPhase) return;
    const detail = event.detail || {};
    if (!active && Number(detail.percent) < 100) consumed = false;
  });
  /* 第二关就绪:收起最后一帧,把画面交还游戏。 */
  window.addEventListener('novvy:phase2-start', () => { root.hidden = true; });
  window.addEventListener('novvy:viewablechange', event => {
    viewable = !!event.detail?.viewable;
    syncVisibility();
  });
  document.addEventListener('visibilitychange', syncVisibility);
  sound.addEventListener('click', event => {
    event.stopPropagation();
    video.muted = !video.muted;
    updateSound();
    if (active && video.paused) void playVideo();
  });
  root.addEventListener('click', () => { if (active && video.paused) void playVideo(); });
  updateSound();
  video.addEventListener('volumechange', updateSound);
  video.addEventListener('ended', () => finish('video_ended'));
  video.addEventListener('timeupdate', () => {
    if (active && visible() && video.currentTime >= 5) revealCta();
  });
  video.addEventListener('error', () => finish('video_error'));
})();
