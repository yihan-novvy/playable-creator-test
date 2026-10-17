(function () {
  'use strict';
  const M = EscapeArrowModel;
  const DEFAULT_LEVEL = __DEFAULT_LEVEL_JSON__;
  const $ = id => document.getElementById(id);
  const canvas = $('board'), wrap = $('board-wrap'), ctx = canvas.getContext('2d');
  const scriptBase = new URL('.', document.currentScript.src || document.baseURI);
  const asset = file => window.__ESCAPE_ARROW_ASSETS__?.[file] || new URL('assets/' + file, scriptBase).href;
  $('guide-hand').src = asset('guide-hand.png');
  $('hint-icon').src = asset('hint.png');
  for (const image of document.querySelectorAll('img[data-escape-asset]')) image.src = asset(image.dataset.escapeAsset);
  const colors = ['#5ee6ff', '#6cffb5', '#6fa8ff', '#b48cff', '#ff9e7a', '#ffd966', '#ff7fa8', '#4dffd2', '#c9b6ff', '#b6ff6a'];
  const fire = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const phase2 = window.__ESCAPE_ARROW_PHASE2__ || null;
  const gameplay = M.normalizeGameplay(window.__ESCAPE_ARROW_GAMEPLAY__);
  let level = window.__ESCAPE_ARROW_LEVEL__ || DEFAULT_LEVEL;
  let policy = phase2 ? null : window.__ESCAPE_ARROW_CTA_POLICY__;
  let state, paths, markers, hintsRemaining, motions = new Map(), trails = new Map(), hintId = null, hintUntil = 0;
  let width = 0, height = 0, fit = 1, zoom = 1, pan = { x: 0, y: 0 }, frame = null, lastTime = 0;
  let introActive = !!$('novvy-video-intro') && !window.__novvyIntroFinished, outroActive = false;
  let viewable = window.__novvyBridgeVersion >= 1 ? !!window.__novvyViewable : true;
  let ctaAnnounced = false, victorySent = false, resultSent = false, failureReported = false, phase2Started = false;
  let tutorial = true, toastTimer = null, muted = false, unlocked = false;
  const music = new Audio(asset('sfx/bgm.m4a'));
  music.loop = true; music.volume = .17; music.preload = 'none';
  const sounds = new Map();
  function visible() { return !document.hidden && viewable; }
  function playable() { return visible() && !introActive && !outroActive; }
  function hasNextPlayable() { return !!phase2 && !phase2Started; }
  function replayAllowed() { return gameplay.allowReplay && (!phase2 || phase2Started) && (!window.__novvyOutroEnabled || !!phase2); }
  function canReplay() {
    const finished = (state.won && victorySent) || (state.failed && resultSent);
    return replayAllowed() && finished && !motions.size && !$('result').hidden;
  }
  function audioSync() {
    if (unlocked && !muted && playable()) music.play().catch(() => {});
    else { music.pause(); for (const sound of sounds.values()) sound.pause(); }
  }
  function unlockAudio() { unlocked = true; audioSync(); }
  function sound(name) {
    if (!unlocked || muted || !playable()) return;
    let audio = sounds.get(name);
    if (!audio) { audio = new Audio(asset('sfx/' + name + '.m4a')); audio.volume = .55; sounds.set(name, audio); }
    audio.currentTime = 0; audio.play().catch(() => {});
  }
  function haptic(kind) {
    try { if (typeof window.novvy?.haptic === 'function') window.novvy.haptic(kind); else navigator.vibrate?.(kind === 'heavy' ? 45 : 12); } catch (_) {}
  }
  function setMuted(value) { muted = !!value; audioSync(); }
  function toast(text) {
    $('toast').textContent = text; $('toast').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 1800);
  }
  function title(spec) {
    $('hud-title-line1').textContent = spec?.titleLine1 || 'Escape Arrow';
    $('hud-title-line2').textContent = spec?.titleLine2 || '';
    $('hud-title-line2').hidden = !spec?.titleLine2;
  }
  function progress(emit = true) {
    const showLifeSlots = state.maxLives !== null && state.maxLives <= 5;
    $('lives').innerHTML = Array.from({ length: showLifeSlots ? state.maxLives : 1 }, (_, i) => {
      const empty = state.lives !== null && i >= state.lives;
      return '<svg class="life-heart' + (empty ? ' is-empty' : '') + '" viewBox="0 0 28 28" aria-hidden="true" focusable="false">' +
        '<defs><linearGradient id="life-fill-' + i + '" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ff91b0"/><stop offset="1" stop-color="#f44f82"/></linearGradient></defs>' +
        '<path class="life-heart-shape" fill="url(#life-fill-' + i + ')" d="M14 24 4.8 15.3C1.6 12.3 1.3 7.5 4.3 4.7c2.7-2.5 7-2.2 9.7 1.1 2.7-3.3 7-3.6 9.7-1.1 3 2.8 2.7 7.6-.5 10.6Z"/>' +
        '<path class="life-heart-shine" d="M6 8.2c.6-1.6 2.5-2.2 4.1-1.4"/></svg>';
    }).join('') + (showLifeSlots ? '' : '<span class="life-count" aria-hidden="true">' + (state.lives === null ? '∞' : state.lives) + '</span>');
    $('lives').setAttribute('aria-label', state.lives === null ? 'Unlimited lives' : state.lives + ' lives remaining');
    $('hint-count').textContent = hintsRemaining === null ? '∞' : String(hintsRemaining);
    $('hint').setAttribute('aria-label', hintsRemaining === null ? 'Hint: unlimited' : 'Hint: ' + hintsRemaining + ' remaining');
    $('progress-escaped').textContent = state.steps;
    $('progress-total').textContent = state.arrows.length;
    $('progress').style.setProperty('--progress-digits', String(state.arrows.length).length + 'ch');
    $('progress').setAttribute('aria-label', state.steps + ' of ' + state.arrows.length + ' arrows escaped');
    if (emit) fire('novvy:hud-progress', { percent: state.steps / state.arrows.length * 100, correct: state.steps, total: state.arrows.length });
  }
  function loadLevel(data, replay = false) {
    level = M.validateLevel(data);
    state = M.createState(level, gameplay.lives);
    hintsRemaining = gameplay.hints;
    paths = state.arrows.map(arrow => M.pathMetrics(M.roundedPath(arrow.points)));
    markers = state.arrows.map(arrow => M.trailMarkers(arrow.points, paths[arrow.id]));
    motions.clear(); trails.clear(); pointers.clear();
    hintId = null; ctaAnnounced = false; victorySent = false; resultSent = false; failureReported = false;
    tutorial = true; $('result').hidden = true; $('toast').hidden = true;
    $('instruction').textContent = 'Tap an arrow to set it free';
    zoom = 1; pan = { x: 0, y: 0 };
    if (replay) fire('novvy:playable-replay', { levelId: level.Index });
    progress(); resize(); audioSync();
    fire('escape-arrow:start', { levelId: level.Index });
  }
  function screen(point) {
    return { x: width / 2 + pan.x + (point.x - (state.width - 1) / 2) * fit * zoom, y: height / 2 + pan.y - (point.y - (state.height - 1) / 2) * fit * zoom };
  }
  function world(point) {
    return { x: (point.x - width / 2 - pan.x) / (fit * zoom) + (state.width - 1) / 2, y: -(point.y - height / 2 - pan.y) / (fit * zoom) + (state.height - 1) / 2 };
  }
  function clampPan() {
    const x = Math.max(0, (state.width * fit * zoom - width) / 2 + width * .18);
    const y = Math.max(0, (state.height * fit * zoom - height) / 2 + height * .18);
    pan.x = clamp(pan.x, -x, x); pan.y = clamp(pan.y, -y, y);
  }
  function zoomAt(value, anchor = { x: width / 2, y: height / 2 }) {
    const before = world(anchor);
    zoom = clamp(value, 1, Math.max(4, Math.min(16, 32 / fit)));
    const after = screen(before);
    pan.x += anchor.x - after.x; pan.y += anchor.y - after.y;
    clampPan(); requestFrame();
  }
  function resize() {
    const rect = wrap.getBoundingClientRect(), ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    fit = Math.min(width / (state.width + 1.5), height / (state.height + 1.5));
    if (tutorial && state.steps === 0) $('instruction').textContent = fit < 12 ? 'Pinch to zoom, then tap an arrow' : 'Tap an arrow to set it free';
    clampPan(); requestFrame();
  }
  function requestFrame() { if (frame === null) frame = requestAnimationFrame(render); }
  function arrowColor(color) { return colors[color % colors.length]; }
  function drawArrow(arrow, points, highlight, dashed) {
    if (points.length < 2) return;
    const color = arrowColor(arrow.color);
    ctx.beginPath();
    // Unity tiles its dash texture from head to tail, with transparent gaps.
    const body = dashed ? [...points].reverse() : points;
    body.forEach((point, i) => { const p = screen(point); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
    const scale = fit * zoom;
    ctx.strokeStyle = highlight ? '#ffffff' : color;
    ctx.lineWidth = Math.max(2.1, scale * .19); ctx.lineCap = dashed ? 'butt' : 'round'; ctx.lineJoin = 'round';
    ctx.globalAlpha = 1;
    ctx.setLineDash(dashed ? [Math.max(3, scale * .28), Math.max(2, scale * .20)] : []);
    ctx.shadowColor = color; ctx.shadowBlur = highlight ? 10 : 0;
    ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'round';
    const head = points[points.length - 1], d = arrow.direction;
    const tip = screen({ x: head.x + d.x * .16, y: head.y + d.y * .16 });
    const back = { x: head.x - d.x * .15, y: head.y - d.y * .15 };
    const a = screen({ x: back.x - d.y * .19, y: back.y + d.x * .19 });
    const b = screen({ x: back.x + d.y * .19, y: back.y - d.x * .19 });
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(tip.x, tip.y); ctx.lineTo(b.x, b.y);
    ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }
  function render(time) {
    frame = null;
    const delta = lastTime ? Math.min(time - lastTime, 48) : 0; lastTime = time;
    ctx.clearRect(0, 0, width, height);
    for (const [id, motion] of motions) {
      if (playable()) motion.elapsed += delta;
      if (motion.kind !== 'escape') continue;
      const distance = Math.min(1, motion.elapsed / motion.duration) * motion.travel;
      const cells = markers[id], arrow = state.arrows[id];
      while (motion.trailStep < cells.length && cells[motion.trailStep].distance <= distance) {
        trails.set(arrow.indices[cells[motion.trailStep].index], arrow.color);
        motion.trailStep++;
      }
    }
    if (trails.size) {
      for (const [index, color] of trails) { const p = screen({ x: index % state.width, y: Math.floor(index / state.width) }); ctx.fillStyle = arrowColor(color); ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, fit * zoom * .055), 0, Math.PI * 2); ctx.fill(); }
    }
    for (const arrow of state.arrows) {
      const motion = motions.get(arrow.id);
      if (arrow.escaped && !motion) continue;
      const t = motion ? clamp(motion.elapsed / motion.duration, 0, 1) : 0;
      const distance = !motion ? 0 : motion.kind === 'escape' ? t * motion.travel : Math.sin(Math.PI * t) * motion.travel;
      const points = motion ? M.movingPath(paths[arrow.id], arrow.direction, distance) : paths[arrow.id].points;
      const dashed = arrow.marked && (!motion || motion.markedAtStart || t >= 1);
      drawArrow(arrow, points, arrow.id === hintId && time < hintUntil && Math.sin(time / 130) > -.3, dashed);
      if (motion && t >= 1) {
        motions.delete(arrow.id);
      }
    }
    const guide = tutorial && playable() && !state.won && !state.failed ? M.availableArrows(state)[0] : undefined;
    $('guide-hand').hidden = guide === undefined;
    if (guide !== undefined) { const p = screen(state.arrows[guide].points[0]); $('guide-hand').style.left = p.x + 5 + 'px'; $('guide-hand').style.top = p.y - 18 + 'px'; }
    if (hintId !== null && time >= hintUntil) hintId = null;
    if (!motions.size && state.won && !victorySent && playable()) finish(true);
    if (!motions.size && state.failed && !resultSent && playable()) finish(false);
    if (playable() && (motions.size || hintId !== null)) requestFrame();
  }
  function announceCta(reason = 'progress') {
    // The first of two playables leads into the next video. Automatic CTA and
    // takeover belong to the final playable; the download card stays usable.
    if (hasNextPlayable() || ctaAnnounced) return;
    ctaAnnounced = true;
    fire('novvy:cta-moment', { levelId: level.Index, steps: state.steps, reason, replayable: replayAllowed() });
  }
  function reportFailure() {
    if (failureReported) return;
    failureReported = true;
    fire('novvy:playable-failed', { levelId: level.Index, retryable: replayAllowed(), continuing: hasNextPlayable() });
  }
  function finish(won) {
    if (won) {
      victorySent = true; sound('win');
      $('instruction').textContent = 'Every arrow is free!';
      fire('novvy:victory', { levelId: level.Index, escaped: state.steps, replayable: replayAllowed(), continuing: hasNextPlayable() });
      if (policy) announceCta();
      if (window.__novvyOutroEnabled && !phase2Started) return;
    } else {
      resultSent = true; sound('fail');
      reportFailure();
      if (hasNextPlayable()) {
        fire('escape-arrow:continue-video', { levelId: level.Index, result: 'fail' });
        return;
      }
    }
    $('result-icon').textContent = won ? '✧' : '♡';
    $('result-title').textContent = won ? 'All clear!' : 'Out of lives';
    $('result-copy').textContent = won ? 'You found a way out for every arrow.' : 'Look for arrows with a clear path ahead.';
    $('result-reset').textContent = won ? 'Play again' : 'Try again';
    // Only the last playable's finished round offers a same-stage replay.
    $('result-reset').hidden = !replayAllowed();
    $('result').hidden = false;
  }
  function tryArrow(id) {
    if (!playable() || motions.has(id)) return false;
    const markedAtStart = state.arrows[id]?.marked === true;
    const result = M.attemptEscape(state, id);
    if (!result) return false;
    tutorial = false; hintId = null; $('guide-hand').hidden = true;
    const path = paths[id];
    const arrow = state.arrows[id], head = screen(arrow.points[0]), direction = arrow.direction;
    const pixelsToEdge = direction.x > 0 ? width - head.x : direction.x < 0 ? head.x : direction.y > 0 ? head.y : height - head.y;
    const timing = result.clear
      ? M.escapeTiming(path.length, pixelsToEdge / (fit * zoom))
      : { travel: Math.max(.15, result.distance - .55), duration: 440 };
    motions.set(id, { kind: result.kind, ...timing, elapsed: 0, trailStep: 0, markedAtStart });
    sound(result.clear ? 'escape' : 'blocked'); haptic(result.clear ? 'light' : 'heavy');
    if (result.clear) {
      progress();
      fire('escape-arrow:escape', { levelId: level.Index, arrowId: id, steps: state.steps });
      if (policy?.mode === 'steps' && state.steps >= policy.afterSteps) announceCta();
      if (state.won) fire('novvy:playable-complete', { levelId: level.Index, escaped: state.steps, replayable: replayAllowed(), continuing: hasNextPlayable() });
    } else {
      progress(false);
      if (state.failed) { reportFailure(); announceCta('lives-exhausted'); }
    }
    requestFrame(); return true;
  }
  function pick(point) {
    const p = world(point), x = Math.round(p.x), y = Math.round(p.y);
    // The cell map preserves Unity's body-wide touch targets without selecting a
    // neighboring arrow through an oversized pixel tolerance on dense levels.
    if (x < 0 || y < 0 || x >= state.width || y >= state.height) return;
    const id = state.occupancy.get(y * state.width + x);
    if (id !== undefined) tryArrow(id);
  }
  const pointers = new Map();
  let gesture = null;
  function local(event) { const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
  function pair() { const [a, b] = [...pointers.values()]; return { distance: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }; }
  canvas.addEventListener('pointerdown', event => {
    if (!playable() || state.won || state.failed) return;
    unlockAudio();
    const p = local(event); pointers.set(event.pointerId, p);
    canvas.setPointerCapture(event.pointerId);
    if (pointers.size === 1) gesture = { start: p, last: p, moved: false };
    else { const pinch = pair(); gesture = { moved: true, pinch, zoom }; }
  });
  canvas.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId) || !gesture) return;
    const p = local(event); pointers.set(event.pointerId, p);
    if (pointers.size >= 2) {
      const current = pair(), previous = gesture.pinch;
      if (previous) {
        zoomAt(zoom * current.distance / Math.max(1, previous.distance), previous.mid);
        pan.x += current.mid.x - previous.mid.x; pan.y += current.mid.y - previous.mid.y; clampPan();
      }
      gesture.pinch = current; gesture.moved = true;
    } else {
      if (!gesture.last) gesture.last = p;
      if (gesture.moved || Math.hypot(p.x - gesture.start.x, p.y - gesture.start.y) >= 8) {
        pan.x += p.x - gesture.last.x; pan.y += p.y - gesture.last.y;
        gesture.moved = true; tutorial = false; clampPan();
      }
      gesture.last = p;
    }
    requestFrame();
  });
  function endPointer(event, cancelled) {
    if (!pointers.has(event.pointerId)) return;
    const tap = !cancelled && pointers.size === 1 && gesture && !gesture.moved;
    pointers.delete(event.pointerId);
    if (tap) pick(local(event));
    if (pointers.size) { const p = [...pointers.values()][0]; gesture = { start: p, last: p, moved: true }; }
    else gesture = null;
  }
  canvas.addEventListener('pointerup', event => endPointer(event, false));
  canvas.addEventListener('pointercancel', event => endPointer(event, true));
  canvas.addEventListener('lostpointercapture', event => endPointer(event, true));
  canvas.addEventListener('wheel', event => { event.preventDefault(); if (playable()) zoomAt(zoom * Math.exp(-event.deltaY * .0015), local(event)); }, { passive: false });
  $('zoom-in').onclick = () => zoomAt(zoom * 1.3);
  $('zoom-out').onclick = () => zoomAt(zoom / 1.3);
  $('recenter').onclick = () => { zoom = 1; pan = { x: 0, y: 0 }; requestFrame(); };
  function replay() {
    if (!playable() || !canReplay()) return;
    unlockAudio();
    // Convert while the completed round is still visible to the SDK. Reset the
    // current level synchronously afterwards, even if opening CTA hides the ad.
    fire('novvy:replay-cta', { levelId: level.Index });
    loadLevel(level, true);
  }
  $('result-reset').onclick = replay;
  $('hint').onclick = () => {
    if (!playable() || state.won || state.failed) return;
    if (hintsRemaining === 0) { toast('No hints remaining.'); announceCta('hints-exhausted'); return; }
    unlockAudio(); sound('click');
    hintId = M.availableArrows(state).find(id => !motions.has(id)) ?? null;
    if (hintId === null) { toast('Wait for the arrows to settle, then try again.'); return; }
    tutorial = false; hintUntil = performance.now() + 2400;
    if (fit * zoom < 18) zoomAt(18 / fit);
    const p = screen(state.arrows[hintId].points[0]);
    if (p.x < 20 || p.x > width - 20 || p.y < 20 || p.y > height - 20) {
      const head = state.arrows[hintId].points[0];
      pan.x = -(head.x - (state.width - 1) / 2) * fit * zoom;
      pan.y = (head.y - (state.height - 1) / 2) * fit * zoom; clampPan();
    }
    if (hintsRemaining !== null) hintsRemaining--;
    progress(false);
    if (hintsRemaining === 0) announceCta('hints-exhausted');
    requestFrame();
  };
  function resume() { lastTime = 0; audioSync(); requestFrame(); }
  window.addEventListener('novvy:intro-finished', () => { introActive = false; unlockAudio(); resume(); });
  window.addEventListener('novvy:outro-started', () => { outroActive = true; pointers.clear(); gesture = null; $('guide-hand').hidden = true; audioSync(); });
  window.addEventListener('novvy:outro-finished', event => {
    if (phase2Started || event.detail?.reason !== 'video_ended' || !phase2) return;
    phase2Started = true;
    secondAssetsReady.then(() => {
      policy = phase2.cta; title(phase2.hud); loadLevel(phase2.level);
      // Reset the SDK/overlay stage before this level's first progress event.
      fire('novvy:phase2-start', { hud: phase2.hud });
      outroActive = false; progress(); resume();
    });
  });
  window.addEventListener('novvy:viewablechange', event => { viewable = !!event.detail?.viewable; pointers.clear(); gesture = null; resume(); });
  document.addEventListener('visibilitychange', () => { pointers.clear(); gesture = null; resume(); });
  function prepareImages(urls) {
    return Promise.all((urls || []).map(url => new Promise(resolve => {
      const img = new Image(); const timeout = setTimeout(resolve, 5000);
      const done = () => { clearTimeout(timeout); resolve(); };
      img.onload = () => { if (img.decode) img.decode().catch(() => {}).then(done); else done(); };
      img.onerror = done; img.src = window.__ESCAPE_ARROW_ASSETS__?.[url] || url;
    })));
  }
  const extraImages = window.__ESCAPE_ARROW_IMAGES__ || {};
  const secondAssetsReady = prepareImages(extraImages.second);
  title(window.__ESCAPE_ARROW_HUD_TITLE__ || { titleLine1: 'Escape Arrow', titleLine2: 'Find a way. Set them free.' });
  loadLevel(level);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(wrap);
  window.addEventListener('resize', resize);
  // Public inspection API supports editor QA without coupling the engine to it.
  window.EscapeArrow = {
    setMuted,
    reset: replay,
    getState: () => ({ levelId: level.Index, escaped: state.steps, total: state.arrows.length, remaining: state.remaining, lives: state.lives, maxLives: state.maxLives, hintsRemaining, allowReplay: replayAllowed(), canReplay: canReplay(), won: state.won, failed: state.failed, zoom, pan: { ...pan }, moving: motions.size, trails: trails.size, available: M.availableArrows(state) }),
    getArrowScreenPoint: id => state.arrows[id] ? screen(state.arrows[id].points[0]) : null,
  };
  canvas.style.visibility = 'hidden';
  prepareImages([...extraImages.first || [], asset('guide-hand.png'), asset('hint.png')]).then(() => {
    if (frame !== null) cancelAnimationFrame(frame);
    render(performance.now()); canvas.style.visibility = '';
    window.__ESCAPE_ARROW_READY__ = true; fire('escape-arrow:ready', { levelId: level.Index });
  });
})();
