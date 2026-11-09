// Production assembly host. The independent artifact contains only game.js.
(function() {
  const config = window.ORIGIN_HOST_SETTINGS;
  const root = document.getElementById('standalone-origin');
  const prefix = config.blockOut ? 'block-out' : 'origin';
  // A local preview can request silence without changing the exported game's
  // defaults; on the platform the real host provides options.env.muted.
  let instance, started = false, steps = 0, viewable = true, muted = new URLSearchParams(location.search).get('muted') === '1';
  let entered = !config.intro && !config.story, nextCta = config.policy.afterSteps, intervalIndex = 0;
  const emit = (name, detail) => window.dispatchEvent(new CustomEvent('novvy:' + name, {detail: detail || {}}));
  function environment() {
    const hud = document.getElementById('novvy-training-hud'), card = document.getElementById('novvy-cta');
    return {api:1, platform:/Android/i.test(navigator.userAgent)?'android':/iPhone|iPad/i.test(navigator.userAgent)?'ios':'web', language:navigator.language, muted,
      viewport:{width:root.clientWidth, height:root.clientHeight, dpr:devicePixelRatio},
      insets:{top:config.title && hud ? hud.getBoundingClientRect().bottom + 10 : 0, bottom:card && !card.hidden ? card.offsetHeight + 8 : 0}};
  }
  function sync() {
    if (!instance) return;
    instance.setEnv(environment());
    if (!entered || document.hidden || !viewable) instance.pause();
    else if (!started) { started = true; instance.start(); }
    else instance.resume();
  }
  function result(kind, options) {
    const replay = options?.continuePlaying === true;
    if (config.blockOut) emit(kind === 'win' ? 'playable-complete' : 'playable-failed', {replayable:replay});
    else emit('origin-result', {result:kind, replay});
  }
  const shell = {
    step(progress) {
      steps++;
      emit(prefix + '-step', {step:steps, progress});
      if (config.policy.enabled !== false && config.policy.mode === 'steps' && steps >= nextCta) {
        const gap = config.policy.intervals[Math.min(intervalIndex, config.policy.intervals.length - 1)];
        emit(prefix + '-cta', {click_source:'forced_click_to_appstore', scene:'valid-game-step', everySteps:gap || 0, repeat:intervalIndex++ > 0, replayable:config.gameplay.allowReplay});
        nextCta = gap ? nextCta + gap : Infinity;
      }
    },
    win(options) { result('win', options); }, fail(options) { result('fail', options); },
    level(level) { steps = 0; emit(prefix + '-level', {level}); },
    retry() { steps = 0; nextCta = config.policy.afterSteps; intervalIndex = 0; emit(prefix + '-replay'); },
    end() { window.NovvyPlayable?.endStage(); },
    cta(source) { emit(prefix + '-cta', {click_source:source, scene:'native-cta', replayable:config.gameplay.allowReplay}); },
    sound(value) { muted = value; sync(); }, haptic() {},
  };
  window.NovvyGame = function(entry) {
    Promise.resolve().then(() => entry(root, shell, {base:'', env:environment(), config:{}})).then(value => {
      instance = value; sync();
    }).catch(error => { root.textContent = 'Unable to load game: ' + error.message; console.error(error); });
  };
  window.addEventListener('novvy:intro-finished', () => { if (!config.story) { entered = true; sync(); } });
  window.addEventListener('novvy:story-finished', () => { entered = true; sync(); });
  window.addEventListener('novvy:viewablechange', event => { viewable = !!event.detail.viewable; sync(); });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('resize', sync);
  const observer = new ResizeObserver(sync);
  for (const node of [root, document.getElementById('novvy-training-hud'), document.getElementById('novvy-cta')]) if (node) observer.observe(node);
  window.addEventListener('pagehide', event => { if (event.persisted) instance?.pause(); else { observer.disconnect(); instance?.destroy(); } });
  window.addEventListener('pageshow', sync);
})();
