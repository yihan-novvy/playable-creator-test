(() => {
  const root = document.getElementById('novvy-video-outro');
  const video = document.getElementById('novvy-outro-video');
  const sound = document.getElementById('novvy-outro-sound');
  const play = document.getElementById('novvy-outro-play');
  if (!root || !video || !sound || !play) return;
  let active = false, consumed = false;
  let viewable = window.__novvyBridgeVersion >= 1 ? !!window.__novvyViewable : true;
  let attempt = 0;
  const visible = () => !document.hidden && viewable;
  function updateSound() {
    sound.textContent = video.muted ? '声音关闭' : '声音开启';
    sound.setAttribute('aria-label', video.muted ? '打开声音' : '关闭声音');
  }
  function finish(reason) {
    if (!active) return;
    active = false;
    attempt++;
    video.pause();
    root.hidden = true;
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
    video.currentTime = 0;
    video.muted = false;
    root.hidden = false;
    updateSound();
    window.dispatchEvent(new CustomEvent('novvy:outro-started'));
    if (video.error) { finish('video_error'); return; }
    void playVideo();
  });
  window.addEventListener('novvy:hud-progress', event => {
    const detail = event.detail || {};
    if (!active && Number(detail.percent) < 100) consumed = false;
  });
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
  video.addEventListener('ended', () => finish('video_ended'));
  video.addEventListener('error', () => finish('video_error'));
})();
