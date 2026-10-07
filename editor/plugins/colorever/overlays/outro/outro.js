(() => {
  const root = document.getElementById('novvy-video-outro');
  const video = document.getElementById('novvy-outro-video');
  const sound = document.getElementById('novvy-outro-sound');
  const play = document.getElementById('novvy-outro-play');
  if (!root || !video || !sound || !play) return;
  let active = false, consumed = false;
  let ctaReady = false;
  function revealCta() {
    if (ctaReady) return;
    ctaReady = true;
    window.dispatchEvent(new CustomEvent('novvy:outro-cta-ready'));
  }
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
  // The engine emits victory only after all completion effects have ended.
  window.addEventListener('novvy:victory', () => {
    if (active || consumed) return;
    consumed = true;
    active = true;
    ctaReady = false;
    video.currentTime = 0;
    video.muted = false;
    root.hidden = false;
    updateSound();
    window.dispatchEvent(new CustomEvent('novvy:outro-started'));
    if (video.error) { finish('video_error'); return; }
    void playVideo();
  });
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
