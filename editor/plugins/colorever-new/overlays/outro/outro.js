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
    if (canStageTitle()) stageTitle('below'); // 真实 HUD 标题降到数字下方
  }

  /* —— GO 闸门(勾选 intro.goEnabled 后,通往第二段的片尾与片头同款等点击):
     片尾 ended 不再直接派发 outro-finished,先冻结末帧到 canvas,把第二关的
     HUD 标题(引擎在 phase2-start 会再写一次,文本一致无闪变)升到中线上方、
     中线下方亮出 GO 按钮;点击(heavy 震动一拍)后标题归位、撤场,才放行
     outro-finished 进入第二段。闸门期间不自动放行。 —— */
  const gateSpec = window.__COLOREVER_PHASE2__?.go ?? null;
  const goGate = !!(gateSpec?.enabled && window.__novvyTwoPhase);
  const goButton = document.getElementById('novvy-outro-go');
  const hud = document.getElementById('novvy-training-hud');
  const title = hud ? hud.querySelector('.novvy-hud-title') : null;
  const TITLE_MOVE_MS = 520;
  let goWaiting = false, goConfirmed = false, titleStaged = false, titleHome = null, titleStyleBefore = '';
  const canStageTitle = () => !!(goGate && hud && title);
  if (goButton && gateSpec?.text) goButton.textContent = gateSpec.text;
  function stageTitle(phase) {
    if (!canStageTitle()) return;
    if (!titleStaged) {
      const rect = title.getBoundingClientRect();
      titleHome = { left: rect.left, top: rect.top, width: rect.width };
      titleStyleBefore = title.getAttribute('style') || '';
      title.style.cssText = `${titleStyleBefore};position:fixed;left:0;top:0;margin:0;width:${rect.width}px;transform:translate(${rect.left}px, ${rect.top}px);transition:none;`;
      hud.classList.add('novvy-intro-title-live');
      void title.offsetWidth;
      title.style.transition = `transform ${TITLE_MOVE_MS}ms cubic-bezier(0.3, 0.7, 0.3, 1)`;
      titleStaged = true;
    }
    const y = phase === 'below' ? window.innerHeight / 2 + Math.min(window.innerHeight * 0.13, 104) - title.offsetHeight / 2
      : phase === 'center' ? window.innerHeight / 2 - 24 - title.offsetHeight / 2
        : titleHome.top;
    title.style.transform = `translate(${titleHome.left}px, ${y}px)`;
  }
  function unstageTitle() {
    if (!titleStaged) return;
    titleStaged = false;
    titleHome = null;
    hud.classList.remove('novvy-intro-title-live');
    if (titleStyleBefore) title.setAttribute('style', titleStyleBefore);
    else title.removeAttribute('style');
    titleStyleBefore = '';
  }
  function freezeLastFrame() {
    if (!video.videoWidth || !video.videoHeight) return false;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    try { ctx.drawImage(video, 0, 0); } catch (_) { return false; }
    canvas.className = 'novvy-intro-frame';
    root.insertBefore(canvas, video.nextSibling);
    return true;
  }
  // 摘掉 src 释放媒体与解码器,ended 视频不再贯穿第二关常驻;
  // active 已闩死,不存在再 play() 的路径。
  function releaseVideo() {
    try { video.removeAttribute('src'); video.load(); } catch (_) {}
  }
  function buzzGo() {
    try {
      if (typeof window.novvy?.haptic === 'function') { window.novvy.haptic('heavy'); return; }
    } catch (_) {}
    try { navigator.vibrate?.(65); } catch (_) {}
  }
  function showGoGate() {
    if (!goGate || goWaiting) return;
    goWaiting = true;
    hideCountdown();
    freezeLastFrame();
    const spec = window.__COLOREVER_PHASE2__ || {};
    const lines = [document.getElementById('novvy-hud-title-line1'), document.getElementById('novvy-hud-title-line2')];
    if (spec.hud) {
      if (lines[0]) lines[0].textContent = spec.hud.titleLine1 || '';
      if (lines[1]) lines[1].textContent = spec.hud.titleLine2 || '';
    }
    stageTitle('center');
    if (goButton) goButton.hidden = false;
  }
  goButton?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (!goWaiting || goConfirmed) return;
    goConfirmed = true;
    buzzGo();
    if (titleStaged) {
      stageTitle('home');
      window.setTimeout(() => { unstageTitle(); finish('video_ended'); }, TITLE_MOVE_MS + 80);
    } else finish('video_ended');
  });
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
    // 模板自有游戏背景图兜底,视频播完直接摘掉 src 释放媒体与解码器,
    // 不依赖视频尾帧;active 已闩死,不存在再 play() 的路径。
    releaseVideo();
    if (reason === 'video_ended') revealCta();
    root.hidden = reason !== 'video_ended';
    sound.hidden = reason === 'video_ended';
    play.hidden = true;
    window.dispatchEvent(new CustomEvent('novvy:outro-finished', { detail: { reason } }));
  }
  async function playVideo() {
    // 闸门等待期视频已 ended:play() 可能把片尾从头重播,盖掉定帧画面。
    if (!active || goWaiting || !visible()) return;
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
    if (!active || goWaiting) return;
    if (visible()) void playVideo();
    else { attempt++; video.pause(); }
  }
  // The engine emits victory only after all completion effects have ended.
  window.addEventListener('novvy:victory', () => {
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
  });
  window.addEventListener('novvy:hud-progress', event => {
    /* 双 playable:片尾位于两关之间只播一次,第二关的进度回落不复位 consumed。 */
    if (window.__novvyTwoPhase) return;
    const detail = event.detail || {};
    if (!active && Number(detail.percent) < 100) consumed = false;
  });
  /* 第二关就绪:收起最后一帧,把画面交还游戏。 */
  window.addEventListener('novvy:phase2-start', () => { unstageTitle(); root.hidden = true; });
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
  root.addEventListener('click', () => { if (active && !goWaiting && video.paused) void playVideo(); });
  updateSound();
  video.addEventListener('volumechange', updateSound);
  // 视频自然结束进 GO 闸门等点击(勾选时);解码出错照旧直接收尾。
  video.addEventListener('ended', () => { if (goGate) showGoGate(); else finish('video_ended'); });
  video.addEventListener('timeupdate', () => {
    if (active && visible() && video.currentTime >= 5) revealCta();
  });
  video.addEventListener('error', () => finish('video_error'));
})();
