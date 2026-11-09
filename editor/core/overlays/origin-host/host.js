// Production assembly host. The independent artifact contains only game.js.
(function() {
  const config = window.ORIGIN_HOST_SETTINGS;
  const root = document.getElementById('standalone-origin');
  const prefix = config.blockOut ? 'block-out' : 'origin';
  const replayCta = ['grill', 'freecell'].includes(config.resultPrefix);
  if (replayCta) window.__novvyReplayable = config.gameplay.allowReplay === true;
  // A local preview can request silence without changing the exported game's
  // defaults; on the platform the real host provides options.env.muted.
  let instance, entry, creating = false, generation = 0, settled = false, started = false, steps = 0, viewable = true, muted = new URLSearchParams(location.search).get('muted') === '1';
  let entered = !config.intro && !config.story, nextCta = config.policy.afterSteps, intervalIndex = 0;
  const emit = (name, detail) => window.dispatchEvent(new CustomEvent('novvy:' + name, {detail: detail || {}}));
  const panel = document.getElementById(config.resultPrefix + '-result');
  const replayButton = document.getElementById(config.resultPrefix + '-replay');
  const continueButton = ['grill', 'freecell', 'block-out'].includes(config.resultPrefix) ? null : document.createElement('button');
  if (continueButton) {
    continueButton.type = 'button'; continueButton.textContent = 'Continue';
    continueButton.dataset.originContinue = '';
    continueButton.style.cssText = 'display:block;margin:12px auto 0;border:1px solid currentColor;border-radius:12px;padding:10px 24px;background:transparent;color:inherit;font:inherit;cursor:pointer;touch-action:manipulation';
    if (replayButton) replayButton.after(continueButton);
  }
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
    const intermediate = options?.continuePlaying === true && instance?.getState().level < instance?.getState().levelCount;
    const replay = intermediate || config.gameplay.allowReplay === true;
    if (!intermediate) {
      settled = true;
      if (panel && replay) {
        const won = kind === 'win';
        const text = config.resultPrefix === 'grill'
          ? [won ? 'All served!' : 'Time’s up!', won ? 'Every skewer is ready. Great work!' : 'The kitchen is closed for this round.']
          : config.resultPrefix === 'tasty'
            ? [won ? 'You win!' : 'Try a fresh start!', won ? 'A delicious finish!' : 'Drop, merge, and try again.']
            : config.resultPrefix === 'freecell'
              ? [won ? 'You win!' : 'No moves left', won ? 'All 52 cards are home.' : 'Start a fresh deal and try again.']
              : [won ? 'You win!' : 'Try again!', won ? 'All blocks cleared!' : 'Slide each block to its matching exit.'];
        document.getElementById(config.resultPrefix + '-result-title').textContent = text[0];
        const copy = document.getElementById(config.resultPrefix + '-result-copy');
        if (copy && text[1]) copy.textContent = text[1];
        replayButton.disabled = false; replayButton.textContent = won ? 'Play again' : 'Try again';
        panel.hidden = false;
      }
    }
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
  async function create(restarting = false) {
    if (creating) return;
    creating = true; const token = ++generation;
    instance?.destroy(); instance = null; started = false; settled = false;
    if (panel) panel.hidden = true;
    try {
      const value = await entry(root, shell, {base:'', env:environment(), config:{}, allowReplay:config.gameplay.allowReplay === true});
      if (token !== generation) { value.destroy(); return; }
      instance = value;
      if (restarting) shell.retry();
      sync();
    } catch (error) { root.textContent = 'Unable to load game: ' + error.message; console.error(error); }
    finally { creating = false; }
  }
  window.NovvyGame = function(factory) { entry = factory; create(); };
  replayButton?.addEventListener('click', () => {
    if (!settled || creating || !config.gameplay.allowReplay || !entered || document.hidden || !viewable) return;
    replayButton.disabled = true;
    // Request conversion while the completed round still exists, then reset it.
    if (replayCta) emit('replay-cta');
    create(true);
  });
  continueButton?.addEventListener('click', () => {
    if (!settled) return;
    if (panel) panel.hidden = true;
    if (!instance?.end()) shell.end();
    settled = false;
  });
  window.addEventListener('novvy:intro-finished', () => { if (!config.story) { entered = true; sync(); } });
  window.addEventListener('novvy:story-finished', () => { entered = true; sync(); });
  window.addEventListener('novvy:viewablechange', event => { viewable = !!event.detail.viewable; sync(); });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('resize', sync);
  const observer = new ResizeObserver(sync);
  for (const node of [root, document.getElementById('novvy-training-hud'), document.getElementById('novvy-cta')]) if (node) observer.observe(node);
  window.addEventListener('pagehide', event => { if (event.persisted) instance?.pause(); else { generation++; observer.disconnect(); instance?.destroy(); } });
  window.addEventListener('pageshow', sync);
})();
