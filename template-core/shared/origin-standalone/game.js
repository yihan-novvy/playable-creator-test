NovvyGame(function(container, shell, options) {
  options = options || {};
  const view = engineRoot(container, SOURCE.markup, SOURCE.css);
  const scope = createEngineScope(view.root, {...SOURCE.resources}, SOURCE.title);
  const settings = {...SOURCE.settings, gameplay: {...SOURCE.settings.gameplay}};
  let started = false, paused = true, destroyed = false, finished = false, closed = false, continuing = false;
  let level = 1, lastStep = 0, lastCta = -Infinity;
  const continueButton = view.root.querySelector('[data-origin-continue]');
  const replayButton = view.root.querySelector('[data-origin-replay]');
  let env = options.env || {}, resolveReady, rejectReady;
  const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  function sound() {
    const off = !started || paused || closed || env.muted === true;
    scope.window.__ORIGIN_MUTED__ = off;
    scope.window.isMute = off ? 1 : 0;
    scope.window.Howler?.mute(off);
    const cc = scope.window.cc;
    if (cc?.audioEngine) {
      cc.audioEngine.setEffectsVolume(off ? 0 : 1);
      cc.audioEngine.setMusicVolume(off ? 0 : 1);
      if (off) cc.audioEngine.pauseAll();
      else { cc.audioEngine._restore?.(); cc.audioEngine.resumeAll(); }
    }
    cc?.director?.getScene()?.getComponentsInChildren?.('cc.AudioSource').forEach(source => { source.volume = off ? 0 : 1; });
    for (const context of scope.audioContexts) {
      if (context.state !== 'closed') (off ? context.suspend() : context.resume()).catch(() => {});
    }
  }
  function lifecycle() {
    if (destroyed) return;
    view.root.style.pointerEvents = started && !paused ? 'auto' : 'none';
    scope.window.ORIGIN_RUNTIME.paused = paused || !started;
    if (started && !paused) scope.resume();
    scope.window.ORIGIN_RUNTIME.lifecycle?.();
    sound();
    if (!started || paused) scope.pause();
  }
  function setEnv(patch = {}) {
    if (destroyed) return;
    const previous = env;
    env = {...env, ...patch, viewport: {...env.viewport, ...patch.viewport}, insets: {...env.insets, ...patch.insets}, safeArea: {...env.safeArea, ...patch.safeArea}};
    scope.window.ORIGIN_RUNTIME.env = env;
    scope.window.devicePixelRatio = Math.min(2, env.viewport.dpr || window.devicePixelRatio || 1);
    const top = Math.max(0, env.insets.top || 0, env.safeArea.top || 0);
    const bottom = Math.max(0, env.insets.bottom || 0, env.safeArea.bottom || 0);
    for (const prefix of ['origin', 'tasty']) {
      view.root.style.setProperty('--' + prefix + '-hud-space', top + 'px');
      view.root.style.setProperty('--' + prefix + '-cta-space', bottom + 'px');
    }
    scope.window.ORIGIN_RUNTIME.environmentChanged?.(env, previous);
    scope.window.dispatchEvent(new Event('resize'));
    scope.window.ORIGIN_RUNTIME.resize?.();
    lifecycle();
  }
  const runtime = {
    start() { if (started || destroyed) return; started = true; paused = false; lifecycle(); },
    pause() { paused = true; lifecycle(); },
    resume() { if (!started || destroyed) return; paused = false; lifecycle(); },
    setEnv,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      scope.window.ORIGIN_RUNTIME.destroyed = true;
      continueButton?.removeEventListener('click', end);
      const cc = scope.window.cc;
      try {
        scope.window.ORIGIN_RUNTIME.dispose?.();
        scope.window.Howler?.unload();
        cc?.game?.pause(); cc?.audioEngine?.stopAll(); cc?.director?.getScene()?.destroy(); cc?.game?.destroy?.();
      } finally { try { scope.dispose(); } finally { view.mount.remove(); } }
    },
  };
  function end() {
    if (!started || paused || destroyed || closed || !finished || !continuing || replayButton?.disabled) return;
    closed = true; continuing = false;
    if (continueButton) { continueButton.disabled = true; continueButton.hidden = true; }
    if (replayButton) replayButton.disabled = true;
    shell.end();
    runtime.pause();
  }
  continueButton?.addEventListener('click', end);
  scope.window.ORIGIN_RUNTIME = {
    env, paused: true, destroyed: false,
    ready() { if (destroyed) return; lifecycle(); resolveReady(runtime); },
    error(error) { try { runtime.destroy(); } finally { rejectReady(error); } },
    event(name, detail) {
      if (name === 'origin:grill-ready') { scope.window.dispatchEvent(new Event(name)); return; }
      if (!started || paused || destroyed || closed) return;
      if (name.endsWith('-step')) {
        if (!finished && detail.step > lastStep) { lastStep = detail.step; shell.step(detail.progress); }
      } else if (name.endsWith('-result') || name === 'origin:playable-complete' || name === 'origin:playable-failed') {
        if (finished) return;
        finished = true;
        const result = detail.result || (name.endsWith('-complete') ? 'win' : 'fail');
        continuing = detail.continuePlaying === true || detail.replay === true || detail.replayable === true;
        closed = !continuing;
        if (continueButton) continueButton.hidden = !(detail.replay === true || detail.replayable === true);
        if (result === 'win') shell.win(continuing ? {continuePlaying: true} : undefined);
        else shell.fail(continuing ? {continuePlaying: true} : undefined);
        sound();
      } else if (name.endsWith('-level')) {
        if (!finished || !continuing || detail.level !== level + 1 || detail.level > SOURCE.levelCount) return;
        level = detail.level; finished = false; continuing = false; lastStep = 0;
        if (continueButton) continueButton.hidden = true;
        shell.level(level);
      } else if (name.endsWith('-replay')) {
        if (!finished || !continuing) return;
        finished = false; continuing = false; lastStep = 0;
        if (continueButton) { continueButton.hidden = true; continueButton.disabled = false; }
        shell.retry(); lifecycle();
      }
    },
    cta(placement) {
      if (!started || paused || destroyed || performance.now() - lastCta < 1000) return;
      // Filled only after the user has confirmed each retained native placement.
      const source = SOURCE.placements[placement];
      if (!source) return;
      lastCta = performance.now();
      if (source === 'cta_click') shell.cta('cta_click');
      else if (source === 'forced_click_to_appstore') shell.cta('forced_click_to_appstore');
    },
  };
  scope.window.ORIGIN_RESOURCES = {...SOURCE.resources};
  scope.window.__ORIGIN_CONFIG__ = settings;
  scope.window.__BLOCK_OUT_CONFIG__ = settings;
  setEnv(env);
  // Loading may schedule engine work; pause again at the first displayable frame.
  scope.resume();
  try { if (SOURCE.prelude) scope.run(SOURCE.prelude); scope.run(SOURCE.code); } catch (error) { scope.window.ORIGIN_RUNTIME.error(error); }
  return ready;
});
