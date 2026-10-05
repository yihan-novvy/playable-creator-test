(() => {
  const root = document.getElementById('novvy-video-intro');
  const video = document.getElementById('novvy-intro-video');
  const soundButton = document.getElementById('novvy-intro-sound');
  if (!root || !video || !soundButton) return;

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    window.__novvyIntroFinished = true;
    root.classList.add('is-finished');
    window.setTimeout(() => root.remove(), 220);
  };

  const showMutedFallback = async () => {
    video.muted = true;
    soundButton.hidden = false;
    try {
      await video.play();
    } catch (_error) {
      soundButton.textContent = 'TAP TO START';
    }
  };

  soundButton.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    video.muted = false;
    try {
      await video.play();
      soundButton.hidden = true;
    } catch (_error) {
      video.muted = true;
    }
  });

  video.addEventListener('ended', finish, { once: true });
  video.addEventListener('error', finish, { once: true });
  window.setTimeout(finish, 12000);

  video.muted = false;
  const playback = video.play();
  if (playback && typeof playback.catch === 'function') playback.catch(showMutedFallback);
})();
