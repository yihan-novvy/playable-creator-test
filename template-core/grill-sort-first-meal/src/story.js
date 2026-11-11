// The native game remains responsible for all rules, input, timing and results.
// This layer consumes delivery observations; it never creates gameplay steps.
export function createFirstMealEntry(baseFactory, artwork, css) {
  return async function firstMeal(root, shell, options = {}) {
    let env = mergeEnvironment({muted: false}, options.env || {});
    let base, started = false, paused = true, destroyed = false, result = null;
    let delivered = 0, lastWidth = 0, lastHeight = 0;
    const animations = new Map();
    const chime = createStageChime(() => running() && !env.muted && env.capabilities?.webaudio !== false);
    const wrapper = document.createElement('div');
    wrapper.className = 'first-meal';
    wrapper.dataset.motion = env.reducedMotion ? 'reduced' : 'full';
    wrapper.dataset.running = 'false';
    wrapper.innerHTML = `<style>${css}</style>
      <div class="fm-content">
        <div class="fm-story" role="img" aria-label="Vera is hungry, waiting for a warm meal.">
          <div class="fm-scene fm-scene--hungry"></div>
          <div class="fm-scene fm-scene--hopeful"></div>
          <div class="fm-scene fm-scene--happy"></div>
          <div class="fm-glow" aria-hidden="true"></div>
          <span class="fm-chapter">HER FIRST WARM MEAL</span>
          <span class="fm-delivery" aria-hidden="true">+3 served</span>
          <span class="fm-stage-notice" aria-hidden="true"></span>
        </div>
        <div class="fm-dialogue"><span class="fm-speaker">VERA</span><span class="fm-line">“Just one warm meal. Please…”</span></div>
        <div class="fm-progress">
          <div class="fm-status">She's so hungry…</div>
          <ol class="fm-stages" aria-label="Vera's journey">
            <li class="fm-stage fm-stage--hungry">
              <svg class="fm-stage-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 10h.01M16 10h.01M8 17q4-5 8 0"/></svg>
              <span>Hungry</span><span class="fm-stage-bar" aria-hidden="true"></span>
            </li>
            <li class="fm-stage fm-stage--hopeful">
              <svg class="fm-stage-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h18c-1 6-4 8-9 8s-8-2-9-8ZM7 8c-3-3 3-3 0-6M12 8c-3-3 3-3 0-6M17 8c-3-3 3-3 0-6"/></svg>
              <span>First Bite</span><span class="fm-stage-bar" aria-hidden="true"></span>
            </li>
            <li class="fm-stage fm-stage--happy">
              <svg class="fm-stage-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21 3.5 12.5C-3 5.5 7-2 12 6c5-8 15-.5 8.5 6.5Z"/></svg>
              <span>Warm Again</span><span class="fm-stage-bar" aria-hidden="true"></span>
            </li>
          </ol>
        </div>
        <div class="fm-game"></div>
        <div class="fm-hint">Match 3 skewers. Bring her a warm meal.</div>
      </div>`;
    root.appendChild(wrapper);
    const query = selector => wrapper.querySelector(selector);
    const board = query('.fm-game'), story = query('.fm-story');
    const line = query('.fm-line'), speaker = query('.fm-speaker'), status = query('.fm-status');
    const stageItems = ['hungry', 'hopeful', 'happy'].map(mood => query(`.fm-stage--${mood}`));
    const notice = query('.fm-delivery');
    const stageNotice = query('.fm-stage-notice'), glow = query('.fm-glow');
    const unlockAudio = () => chime.unlock();
    wrapper.addEventListener('pointerdown', unlockAudio, {capture: true, passive: true});
    for (const scene of wrapper.querySelectorAll('.fm-scene')) scene.style.backgroundImage = `url("${artwork}")`;
    const preload = new Image();
    const imageReady = new Promise((resolve, reject) => {
      preload.onload = resolve;
      preload.onerror = () => reject(new Error('First meal artwork failed to load'));
      preload.src = artwork;
    });
    function running() { return started && !paused && !destroyed && !result; }
    function animationState() {
      wrapper.dataset.running = String(running());
      for (const animation of animations.values()) {
        if (running()) animation.play(); else animation.pause();
      }
      if (!running()) chime.stop();
    }
    function animate(key, element, frames, timing) {
      const previous = animations.get(key);
      if (previous) { previous.onfinish = null; previous.cancel(); }
      const animation = element.animate(frames, timing);
      animations.set(key, animation);
      animation.onfinish = () => { if (animations.get(key) === animation) animations.delete(key); };
    }
    function cancelAnimations() {
      for (const animation of animations.values()) { animation.onfinish = null; animation.cancel(); }
      animations.clear();
    }
    function enterStage(previous, mood) {
      if (!running()) return;
      const delivery = animations.get('delivery');
      if (delivery) { delivery.onfinish = null; delivery.cancel(); animations.delete('delivery'); }
      stageNotice.textContent = mood === 'hopeful' ? 'HER FIRST BITE' : 'HOPE IS BACK';
      chime.play(mood);
      if (env.reducedMotion) return;
      animate('scene-out', query(`.fm-scene--${previous}`), [{opacity: 1}, {opacity: 0}], {duration: 850, easing: 'ease-out'});
      animate('scene-in', query(`.fm-scene--${mood}`), [
        {opacity: 0, transform: 'scale(1.09)'},
        {opacity: 1, transform: 'scale(1.025)', offset: .55},
        {opacity: 1, transform: 'scale(1)'}
      ], {duration: 1300, easing: 'ease-out'});
      animate('glow', glow, [{opacity: 0}, {opacity: .8, offset: .25}, {opacity: 0}], {duration: 1000, easing: 'ease-out'});
      animate('stage-notice', stageNotice, [
        {opacity: 0, transform: 'translate(-50%, 12px) scale(.85)'},
        {opacity: 1, transform: 'translate(-50%, 0) scale(1.05)', offset: .16},
        {opacity: 1, transform: 'translate(-50%, 0) scale(1)', offset: .8},
        {opacity: 0, transform: 'translate(-50%, -8px) scale(1)'}
      ], {duration: 2200, easing: 'ease-out'});
    }
    function animateDelivery() {
      if (!running() || env.reducedMotion) return;
      animate('delivery', notice, [
        {opacity: 0, transform: 'translate(-50%, 12px) scale(.8)'},
        {opacity: 1, transform: 'translate(-50%, 0) scale(1.08)', offset: .2},
        {opacity: 1, transform: 'translate(-50%, -6px) scale(1)', offset: .7},
        {opacity: 0, transform: 'translate(-50%, -18px) scale(1)'}
      ], {duration: 1500, easing: 'ease-out'});
    }
    function paint() {
      const percent = Math.min(100, delivered / 120 * 100);
      const mood = percent < 10 ? 'hungry' : percent < 30 ? 'hopeful' : 'happy';
      const previous = wrapper.dataset.mood;
      wrapper.dataset.mood = mood;
      const currentStage = mood === 'hungry' ? 0 : mood === 'hopeful' ? 1 : 2;
      stageItems.forEach((item, index) => {
        item.dataset.state = index < currentStage ? 'past' : index === currentStage ? 'current' : 'upcoming';
        item.setAttribute('aria-current', index === currentStage ? 'step' : 'false');
      });
      status.textContent = ["She's so hungry…", 'Her first bite. Keep cooking!', 'Warm food. Hope is back.'][currentStage];
      speaker.textContent = 'VERA';
      if (result === 'fail') {
        line.textContent = delivered ? '“The kitchen closed too soon…”' : '“Please… I’m still hungry.”';
        status.textContent = 'The kitchen is closed';
      } else if (result === 'win') {
        line.textContent = '“I won’t go hungry anymore.”';
        status.textContent = 'A warm meal. A new beginning.';
      } else if (percent < 10) {
        line.textContent = '“Just one warm meal. Please…”';
      } else if (percent < 20) {
        line.textContent = '“Is that… really for me?”';
      } else if (percent < 30) {
        speaker.textContent = 'THE KING';
        line.textContent = '“You won’t go hungry here.”';
      } else if (percent < 75) {
        line.textContent = '“I haven’t felt this warm in days.”';
      } else {
        line.textContent = '“Thank you for not giving up on me.”';
      }
      story.setAttribute('aria-label', `${mood === 'hungry' ? 'Hungry' : mood === 'hopeful' ? 'Hopeful' : 'Relieved'} Vera at the palace table. ${status.textContent}`);
      if (previous && previous !== mood) enterStage(previous, mood);
      return previous && previous !== mood;
    }
    function served(detail) {
      if (!running() || !Number.isInteger(detail?.delivered) || detail.delivered <= delivered || detail.delivered > 120) return;
      delivered = detail.delivered;
      if (!paint()) animateDelivery();
    }
    function finish(kind, detail) {
      if (!running()) return;
      result = kind;
      if (kind === 'win') delivered = 120;
      paint(); animationState();
      shell[kind](detail);
    }
    function innerEnvironment() {
      return {...env, safeArea: {top: 0, right: 0, bottom: 0, left: 0}, insets: {top: 0, right: 0, bottom: 0, left: 0},
        viewport: {...env.viewport, width: board.clientWidth, height: board.clientHeight}};
    }
    function resize(force = false) {
      if (destroyed) return;
      const width = wrapper.clientWidth, height = wrapper.clientHeight;
      const top = Math.max(0, env.safeArea?.top || 0, env.insets?.top || 0);
      const bottom = Math.max(0, env.safeArea?.bottom || 0, env.insets?.bottom || 0);
      const left = Math.max(0, env.safeArea?.left || 0, env.insets?.left || 0);
      const right = Math.max(0, env.safeArea?.right || 0, env.insets?.right || 0);
      wrapper.style.setProperty('--fm-top', `${top}px`);
      wrapper.style.setProperty('--fm-bottom', `${bottom}px`);
      wrapper.style.setProperty('--fm-left', `${left}px`);
      wrapper.style.setProperty('--fm-right', `${right}px`);
      wrapper.dataset.landscape = String(width > height);
      if (force || width !== lastWidth || height !== lastHeight) {
        lastWidth = width; lastHeight = height;
        base?.setEnv(innerEnvironment());
      }
    }
    const observer = new ResizeObserver(() => resize());
    observer.observe(wrapper);
    const runtime = {
      async init() { return runtime; },
      async start() { if (started || destroyed) return; started = true; paused = false; animationState(); await base.start(); },
      pause() { if (destroyed) return; paused = true; animationState(); base?.pause(); },
      resume() { if (!started || destroyed || result) return; paused = false; animationState(); base?.resume(); },
      setEnv(patch = {}) {
        if (destroyed) return;
        env = mergeEnvironment(env, patch);
        wrapper.dataset.motion = env.reducedMotion ? 'reduced' : 'full';
        if (env.reducedMotion) cancelAnimations();
        if (env.muted || env.capabilities?.webaudio === false) chime.stop();
        resize(true);
      },
      setMuted(muted) { runtime.setEnv({muted: Boolean(muted)}); },
      setInsets(insets) { runtime.setEnv({insets}); },
      resize(viewport) { runtime.setEnv(viewport ? {viewport} : {}); },
      replay() { return Promise.resolve(false); },
      end() { if (!running()) return false; const ended = base.end(); if (ended) { paused = true; animationState(); } return ended; },
      getState() { return {...base?.getState(), templateId: 'grill-sort-first-meal', meal: {delivered, total: 120, progress: delivered / 120 * 100}, destroyed, paused}; },
      on(type, listener) { return base.on(type, listener); },
      off(type, listener) { return base.off(type, listener); },
      destroy() {
        if (destroyed) return;
        destroyed = true; paused = true;
        observer.disconnect();
        preload.onload = preload.onerror = null;
        wrapper.removeEventListener('pointerdown', unlockAudio, true);
        cancelAnimations(); chime.destroy();
        try { base?.destroy(); } finally { wrapper.remove(); }
      }
    };
    paint(); resize();
    const bridge = {
      step: percent => { if (running()) shell.step(percent); },
      win: detail => finish('win', detail), fail: detail => finish('fail', detail),
      end: () => { if (running()) shell.end(); },
      sound: muted => shell.sound(muted), haptic: style => shell.haptic?.(style)
    };
    try {
      const baseReady = baseFactory(board, bridge, {...options, env: innerEnvironment(), allowReplay: false, onMealServed: served});
      const values = await Promise.allSettled([baseReady, imageReady]);
      if (values[0].status === 'fulfilled') base = values[0].value;
      const failure = values.find(value => value.status === 'rejected');
      if (failure) throw failure.reason;
      resize(true);
      return runtime;
    } catch (error) { runtime.destroy(); throw error; }
  };
}

export function mergeEnvironment(previous, patch) {
  return {...previous, ...patch, viewport: {...previous.viewport, ...patch.viewport},
    safeArea: {...previous.safeArea, ...patch.safeArea}, insets: {...previous.insets, ...patch.insets},
    capabilities: {...previous.capabilities, ...patch.capabilities}};
}

// One small, gesture-unlocked audio graph per playable instance. A suspended
// context never queues a delayed milestone sound; the next real gesture unlocks it.
export function createStageChime(allowed) {
  let context, disposed = false;
  const voices = new Set();
  const ignore = promise => promise?.catch(() => {});
  function stop() {
    for (const voice of voices) {
      voice.oscillator.onended = null;
      try { voice.oscillator.stop(); } catch (_) {}
      voice.oscillator.disconnect(); voice.gain.disconnect();
    }
    voices.clear();
    if (context?.state === 'running') ignore(context.suspend());
  }
  return {
    unlock() {
      if (disposed || !allowed()) return;
      try {
        const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Audio) return;
        context ||= new Audio();
        if (context.state === 'suspended') ignore(context.resume().then(() => {
          if (disposed) ignore(context.close()); else if (!allowed()) stop();
        }));
      } catch (_) { /* Sound is optional when Web Audio is unavailable. */ }
    },
    play(mood) {
      if (disposed || !allowed() || context?.state !== 'running') return;
      const notes = mood === 'hopeful' ? [523.25, 659.25, 783.99] : [659.25, 783.99, 1046.5, 1318.51];
      try {
        notes.forEach((frequency, index) => {
          const oscillator = context.createOscillator(), gain = context.createGain();
          const voice = {oscillator, gain}; voices.add(voice);
          const at = context.currentTime + .01 + index * .115;
          oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, at);
          gain.gain.setValueAtTime(0, at);
          gain.gain.linearRampToValueAtTime(.12, at + .015);
          gain.gain.exponentialRampToValueAtTime(.001, at + .42);
          oscillator.connect(gain); gain.connect(context.destination);
          oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); voices.delete(voice); };
          oscillator.start(at); oscillator.stop(at + .44);
        });
      } catch (_) { stop(); }
    },
    stop,
    destroy() { if (disposed) return; disposed = true; stop(); if (context && context.state !== 'closed') ignore(context.close()); }
  };
}
