// Shared public contract. The native factory owns rendering and actual game rules.
export function createStandaloneEntry(factory, metadata) {
  return async function (root, shell, options = {}) {
    const listeners = new Map();
    let env = {muted: false, ...(options.env || {})};
    let native, generation = 0, initialized, started = false, paused = true, destroyed = false;
    let closed = false, result = null, continuing = false, level = 1, steps = 0, progress = 0, retries = 0, rebuilding = false, holdAfterRebuild = false;
    // Replay is an explicit host choice. With the default, the final result lets
    // the official shell advance. Multi-level campaigns keep their native flow.
    const allowReplay = options.allowReplay === true && metadata.levelCount === 1;
    // Assembly hosts may keep native result panels rendering after settlement.
    // Input and gameplay reports still stop at the result.
    const keepResultScene = options.keepResultScene === true;
    let presentingResult = false;
    const mount = document.createElement('div');
    mount.style.cssText = 'position:absolute;inset:0;overflow:hidden;';
    root.appendChild(mount);
    const running = () => started && !paused && !destroyed && !closed && !rebuilding;
    const state = () => ({apiVersion: '1.0', templateId: metadata.id, ready: !!native,
      started, paused, destroyed, ended: closed, result, continuing, level,
      levelCount: metadata.levelCount, steps, progress, retries, rebuilding,
      canReplay: allowReplay && continuing && !!result && !closed && retries < 50 && !rebuilding,
      muted: env.muted === true, env: structuredClone(env)});
    function emit(type, detail = {}) {
      const event = Object.freeze({type, ...detail, state: state()});
      for (const fn of [...(listeners.get(type) || []), ...(listeners.get('*') || [])]) {
        try { fn(event); } catch (error) { console.error('Game observer failed', error); }
      }
      try { options.onEvent?.(event); } catch (error) { console.error('Game observer failed', error); }
    }
    function guard(event) {
      if (!running() || result) { event.preventDefault(); event.stopImmediatePropagation(); }
    }
    const inputEvents = ['pointerdown', 'pointermove', 'pointerup', 'touchstart', 'touchmove', 'touchend', 'mousedown', 'mouseup', 'click', 'keydown', 'keyup'];
    inputEvents.forEach(type => mount.addEventListener(type, guard, {capture: true, passive: false}));
    function bridge(token) {
      const current = () => token === generation && !destroyed;
      function finish(kind, detail = {}) {
        if (!current() || !running() || result) return;
        result = kind;
        continuing = detail?.continuePlaying === true || allowReplay;
        closed = !continuing;
        const holdForHost = closed || (allowReplay && !detail?.continuePlaying);
        presentingResult = keepResultScene && holdForHost;
        shell[kind](continuing ? {continuePlaying: true} : undefined);
        emit('result', {result: kind, continuePlaying: continuing});
        // Native inter-level animations must keep running. Other completed
        // rounds wait for the host, with input, timers and sound held.
        if (holdForHost && !presentingResult) {
          paused = true;
          native?.pause();
        }
      }
      return {
        step(percent) {
          if (!current() || !running() || result) return;
          if (percent !== undefined && (!Number.isFinite(percent) || percent < 0 || percent > 100)) throw new Error('Invalid native progress');
          steps++;
          if (percent !== undefined) progress = Math.max(progress, percent);
          shell.step(percent);
          emit('step', {step: steps, progress: percent});
        },
        win: detail => finish('win', detail), fail: detail => finish('fail', detail),
        level(next) {
          if (!current() || !started || closed || !continuing || next !== level + 1 || next > metadata.levelCount) return;
          level = next; result = null; continuing = false; progress = 0; steps = 0;
          shell.level(next); emit('level', {level: next});
        },
        retry() {
          if (!current() || !continuing || closed || retries >= 50) return;
          result = null; continuing = false; presentingResult = false; retries++;
          shell.retry(); emit('retry', {retry: retries});
        },
        end() { if (current()) runtime.end(); },
        sound(muted) {
          if (!current() || !started || typeof muted !== 'boolean' || env.muted === muted) return;
          runtime.setMuted(muted); shell.sound(muted); emit('sound', {muted});
        },
        haptic(style) { if (current() && running()) shell.haptic?.(style); },
      };
    }
    async function construct() {
      const token = ++generation;
      const value = await factory(mount, bridge(token), {...options, env: structuredClone(env)});
      if (destroyed || token !== generation) { value?.destroy?.(); return; }
      for (const key of ['start', 'pause', 'resume', 'setEnv', 'destroy']) {
        if (typeof value?.[key] !== 'function') { value?.destroy?.(); throw new Error('Missing native method: ' + key); }
      }
      native = value;
      native.setEnv(env); native.pause();
    }
    const runtime = {
      init() { return initialized ||= construct().then(() => { if (!destroyed) emit('ready'); return runtime; }); },
      async start() {
        if (started || destroyed || closed) return;
        if (!native) await runtime.init();
        if (started || destroyed || closed) return;
        started = true; paused = false; emit('start');
        await native.start();
        if (paused || destroyed || (closed && !presentingResult)) native?.pause();
      },
      pause() { if (destroyed) return; if (rebuilding) holdAfterRebuild = true; const changed = !paused; paused = true; native?.pause(); if (changed) emit('pause'); },
      resume() { if (!started || destroyed || (closed && !presentingResult)) return; if (rebuilding) { holdAfterRebuild = false; return; } if (result && metadata.levelCount === 1 && !presentingResult) return; const changed = paused; paused = false; native.resume(); if (changed) emit('resume'); },
      async replay() {
        if (!state().canReplay) return false;
        rebuilding = true; holdAfterRebuild = false; presentingResult = false; paused = true; generation++; native.destroy(); native = null;
        try {
          await construct();
          if (destroyed) return false;
          result = null; continuing = false; retries++; rebuilding = false;
          shell.retry(); emit('retry', {retry: retries});
          paused = holdAfterRebuild;
          await native.start();
          if (paused || destroyed || (closed && !presentingResult)) native?.pause();
          return !destroyed;
        } catch (error) { runtime.destroy(); throw error; }
      },
      end() {
        if (!started || destroyed) return false;
        if (closed) { if (presentingResult) { presentingResult = false; paused = true; native?.pause(); } return false; }
        presentingResult = false;
        closed = true; continuing = false; paused = true;
        native?.pause(); shell.end(); emit('end'); return true;
      },
      destroy() {
        if (destroyed) return;
        destroyed = true; generation++; paused = true;
        try { native?.destroy(); } finally {
          inputEvents.forEach(type => mount.removeEventListener(type, guard, true));
          mount.remove(); emit('destroy'); listeners.clear();
        }
      },
      setEnv(patch = {}) {
        if (destroyed) return;
        env = {...env, ...patch, viewport: {...env.viewport, ...patch.viewport},
          insets: {...env.insets, ...patch.insets}, safeArea: {...env.safeArea, ...patch.safeArea}};
        native?.setEnv(env); emit('env', {env: structuredClone(env)});
      },
      setMuted(muted) { runtime.setEnv({muted: Boolean(muted)}); },
      setInsets(insets) { runtime.setEnv({insets}); },
      resize(viewport) { runtime.setEnv({viewport: viewport || {width: root.clientWidth, height: root.clientHeight}}); },
      getState: state,
      on(type, listener) {
        if (typeof listener !== 'function') throw new TypeError('Listener must be a function');
        if (destroyed) return () => {};
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(listener); return () => runtime.off(type, listener);
      },
      off(type, listener) { listeners.get(type)?.delete(listener); },
    };
    try { return await runtime.init(); } catch (error) { runtime.destroy(); throw error; }
  };
}
