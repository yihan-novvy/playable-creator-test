(() => {
  /* WebAudio autoplay-policy unlock. Injected into <head> (document start),
     before the engine's loader runs.

     The engine creates its AudioContext during boot — before any user
     gesture exists — so on WebViews that enforce the gesture policy (iOS
     WKWebView: mediaTypesRequiringUserActionForAction defaults to .all) the
     context comes up suspended and every game sound queues behind it
     forever: the intro <video> has audio (it rides the muted-start +
     restore path instead), the game does not. cc.js carries a canvas-touch
     resume fallback, but it never fires in practice (verified via CDP:
     created suspended, game plays into it, no resume() call, no
     statechange).

     Three unlocks run on the first real user gesture, because resume()
     alone is not sufficient on iOS:
       1. resume() every captured context — the documented requirement.
       2. start a 1-sample silent buffer through each context — Safari only
          wires up the output path for a context that has actually run a
          buffer (the classic unlock pattern).
       3. keep an UNMUTED silent <audio> element looping for the page's
          life — media elements hold the host app's audio session open;
          WebAudio does not. On iOS the intro <video> keeps that session
          alive while it rolls, and the moment it ends the session closes
          and the game's WebAudio renders into a dead session. The looping
          element replaces it as the session holder.

     The gesture listeners stay registered forever: iOS is reported to
     re-lock the context again seconds after an idle unlock, and the engine
     may create contexts lazily. Everything is logged to a probe timeline
     (console + window.__novvyAudioProbe) so a device can be diagnosed
     through vConsole / the Web Inspector without a rebuild. */

  const probe = [];
  const startedAt = Date.now();
  function log(event, detail) {
    const entry = {
      t: Date.now() - startedAt,
      event,
      ...(detail !== undefined ? { detail } : {}),
    };
    probe.push(entry);
    if (probe.length > 200) probe.shift();
    try { console.log('[novvy-audio]', event, detail !== undefined ? detail : ''); } catch (_error) {}
  }
  window.__novvyAudioProbe = probe;

  // The engine picks window.AudioContext first and falls back to the
  // webkit-prefixed one; wrap whichever it will actually construct.
  const key = window.AudioContext
    ? 'AudioContext'
    : (window.webkitAudioContext ? 'webkitAudioContext' : null);
  if (!key) { log('no-audiocontext'); return; }
  const NativeAudioContext = window[key];

  const contexts = [];
  function WrappedAudioContext(...args) {
    // bind.apply preserves constructor semantics; the returned instance
    // makes `instanceof AudioContext` keep working through the shared
    // prototype.
    const context = new (Function.prototype.bind.apply(NativeAudioContext, [null, ...args]))();
    contexts.push(context);
    if (contexts.length > 8) contexts.shift();
    log('context-created', context.state);
    context.addEventListener('statechange', () => log('statechange', context.state));
    return context;
  }
  WrappedAudioContext.prototype = NativeAudioContext.prototype;
  window[key] = WrappedAudioContext;

  // Unlock (2): a real buffer through the context, once per context. One
  // silent sample at 22050 Hz (within the 8k-96k spec range) is enough to
  // make Safari wire the output path.
  const kicked = new WeakSet();
  function kickWithSilentBuffer(context) {
    if (kicked.has(context)) return;
    kicked.add(context);
    try {
      const source = context.createBufferSource();
      source.buffer = context.createBuffer(1, 1, 22050);
      source.connect(context.destination);
      source.start(0);
      log('silent-buffer-kicked');
    } catch (error) {
      log('silent-buffer-failed', String(error));
    }
  }

  // Unlock (3): the session keeper. A detached, looping, UNMUTED audio
  // element playing generated silence — silent samples, but a live media
  // element, which is what holds the iOS audio session open (muted elements
  // and volume=0 are optimized out of playback entirely).
  let keeper = null;
  function ensureSessionKeeper() {
    if (keeper) {
      if (keeper.paused && !keeper.ended) {
        const playback = keeper.play();
        if (playback && playback.catch) playback.catch((error) => log('keeper-resume-failed', String(error)));
      }
      return;
    }
    try {
      const sampleRate = 8000;
      const samples = sampleRate / 4; // 250ms of silence per loop
      const bytes = new ArrayBuffer(44 + samples * 2);
      const view = new DataView(bytes);
      const ascii = (offset, text) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)); };
      ascii(0, 'RIFF'); view.setUint32(4, 36 + samples * 2, true);
      ascii(8, 'WAVE'); ascii(12, 'fmt ');
      view.setUint32(16, 16, true); view.setUint16(20, 1, true);
      view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true);
      view.setUint16(34, 16, true); ascii(36, 'data');
      view.setUint32(40, samples * 2, true); // payload stays zero = silence
      const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
      keeper = new Audio(url);
      keeper.loop = true;
      const playback = keeper.play();
      if (playback && playback.then) {
        playback.then(
          () => log('keeper-playing'),
          (error) => log('keeper-play-failed', String(error)),
        );
      }
    } catch (error) {
      log('keeper-create-failed', String(error));
    }
  }

  function unlock(eventName) {
    log('gesture', eventName);
    for (const context of contexts) {
      try {
        if (context.state === 'suspended') {
          const resume = context.resume();
          if (resume && resume.then) {
            resume.then(
              () => log('resumed', context.state),
              (error) => log('resume-rejected', String(error)),
            );
          }
        }
        if (context.state !== 'closed') kickWithSilentBuffer(context);
      } catch (error) {
        log('unlock-failed', String(error)); // a dead context must never break the gesture
      }
    }
    ensureSessionKeeper();
  }
  window.addEventListener('touchend', () => unlock('touchend'), { capture: true, passive: true });
  window.addEventListener('mouseup', () => unlock('mouseup'), { capture: true, passive: true });
  window.addEventListener('pointerup', () => unlock('pointerup'), { capture: true, passive: true });
})();
