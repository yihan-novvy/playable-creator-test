(function () {
  'use strict';
  var root = document.getElementById('novvy-story');
  if (!root) return;
  var feed = document.getElementById('tasty-story-feed');
  var next = document.getElementById('tasty-story-next');
  var skip = document.getElementById('tasty-story-skip');
  var sound = window.__novvyCreateStoryAudio && window.__novvyCreateStoryAudio(document.getElementById('tasty-story-sound'));
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var started = false, finished = false, cursor = 0, typing = null, timer = null, touch = null;
  // Fixed pilot story, transcribed from the three user-provided screenshots.
  // The original JPEGs are displayed through CSS crops; dialogue remains real DOM.
  var portraits = {
    policeman: [1, 778, 909, 250, 320],
    aurora: [1, 47, 1337, 259, 310],
    thinking: [3, 51, 570, 250, 320],
    angry: [3, 51, 1005, 250, 320]
  };
  var pages = [
    { scene: [1, 39, 283, 999, 546], label: 'A policeman holding a flashlight in a garden at night.' },
    { who: 'policeman', name: 'Policeman', text: "Ma’am, are you alright? What are you doing here?" },
    { who: 'aurora', name: 'Aurora', text: "Officer, thank goodness you’re here! That way, hurry!" },
    { who: 'aurora', name: 'Aurora', text: "What’s that?" },
    { scene: [2, 25, 653, 1029, 581], label: 'A mysterious silhouette surrounded by flames.' },
    { who: 'aurora', name: 'Aurora', text: 'Hello! Anyone there?' },
    { who: 'aurora', face: 'angry', name: 'Aurora', text: "Oh my god, the fire’s out of control!" },
    { who: 'policeman', name: 'Policeman', text: "Calm down, ma’am. What’s going on here?" },
    { who: 'aurora', face: 'thinking', name: 'Aurora', text: 'It was like, something was moving in and out of the flames.' },
    { who: 'aurora', face: 'angry', name: 'Aurora', text: 'It might’ve started the fire!' }
  ];
  function track(name, detail) {
    try { if (window.NovvyAnalytics) window.NovvyAnalytics.track(name, detail || {}); } catch (_) {}
  }
  function crop(area, className) {
    var node = document.createElement('span'), image = area[0], x = area[1], y = area[2], w = area[3], h = area[4];
    node.className = 'tasty-story-crop ' + className;
    node.dataset.reference = String(image);
    node.style.aspectRatio = w + ' / ' + h;
    node.style.backgroundSize = 1080 / w * 100 + '% ' + 2337 / h * 100 + '%';
    node.style.backgroundPosition = x / (1080 - w) * 100 + '% ' + y / (2337 - h) * 100 + '%';
    return node;
  }
  function scroll() { feed.scrollTo({ top: feed.scrollHeight, behavior: reduced ? 'auto' : 'smooth' }); }
  function controls() {
    var last = cursor >= pages.length && !typing;
    next.classList.toggle('story-continue', last);
    next.textContent = last ? 'Continue' : typing ? 'Tap to reveal' : 'Tap to continue ▾';
    next.setAttribute('aria-label', last ? 'Continue to game' : typing ? 'Reveal full dialogue' : 'Continue story');
    root.dataset.step = String(cursor);
  }
  function reveal() {
    if (!typing) return;
    typing.node.textContent = typing.text;
    typing.node.dataset.typing = 'false';
    typing = null;
    clearInterval(timer); timer = null;
    controls(); scroll();
  }
  function finish(reason) {
    if (!started || finished) return;
    finished = true;
    if (sound) sound.stop();
    clearInterval(timer); timer = null;
    next.disabled = true; skip.disabled = true;
    root.classList.add('story-leaving');
    window.__novvyStoryFinished = true;
    track('story_complete', { reason: reason, items_seen: cursor });
    window.dispatchEvent(new CustomEvent('novvy:story-finished', { detail: { reason: reason } }));
    window.setTimeout(function () { root.remove(); }, 220);
  }
  function advance() {
    if (!started || finished) return;
    if (typing) { reveal(); return; }
    if (cursor >= pages.length) { finish('continue'); return; }
    var item = pages[cursor++];
    if (item.scene) {
      var scene = crop(item.scene, 'tasty-story-scene tasty-story-new');
      scene.setAttribute('role', 'img'); scene.setAttribute('aria-label', item.label);
      feed.appendChild(scene);
      // The first illustration establishes the scene alongside the first line.
      if (cursor === 1) { advance(); return; }
    } else {
      var row = document.createElement('article');
      row.className = 'tasty-story-row tasty-story-new'; row.dataset.speaker = item.who;
      var portrait = crop(portraits[item.face || item.who], 'tasty-story-portrait');
      portrait.setAttribute('aria-hidden', 'true');
      var bubble = document.createElement('div'); bubble.className = 'tasty-story-bubble';
      var name = document.createElement('h2'); name.className = 'tasty-story-name'; name.textContent = item.name;
      var line = document.createElement('p'); line.className = 'tasty-story-line';
      line.setAttribute('aria-label', item.text);
      bubble.appendChild(name); bubble.appendChild(line); row.appendChild(portrait); row.appendChild(bubble); feed.appendChild(row);
      if (sound) sound.dialogue(item.who);
      if (reduced) line.textContent = item.text;
      else {
        typing = { node: line, text: item.text, count: 0 }; line.dataset.typing = 'true';
        timer = setInterval(function () {
          if (document.hidden || (window.__novvyBridgeVersion >= 1 && !window.__novvyViewable)) return;
          if (!typing) return;
          typing.count += 2; line.textContent = item.text.slice(0, typing.count);
          if (typing.count >= item.text.length) reveal();
        }, 28);
      }
    }
    controls(); scroll();
  }
  function start() {
    if (started || finished) return;
    started = true; root.hidden = false;
    if (sound) sound.start();
    track('story_start', { chapter: 'monster-in-flames-1' });
    advance();
  }
  root.addEventListener('pointerdown', function (event) {
    if (sound && !event.target.closest('#tasty-story-sound,#tasty-story-skip')) sound.unlock();
  });
  next.addEventListener('click', function (event) { event.stopPropagation(); if (sound) sound.unlock(); advance(); });
  skip.addEventListener('click', function (event) { event.stopPropagation(); finish('skip'); });
  feed.addEventListener('pointerdown', function (event) { touch = { x: event.clientX, y: event.clientY, top: feed.scrollTop }; });
  feed.addEventListener('click', function (event) {
    event.stopPropagation();
    var moved = touch && (Math.abs(event.clientX - touch.x) > 10 || Math.abs(event.clientY - touch.y) > 10 || Math.abs(feed.scrollTop - touch.top) > 10);
    touch = null;
    if (!moved) { if (sound) sound.unlock(); advance(); }
  });
  feed.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (sound) sound.unlock(); advance(); }
  });
  window.addEventListener('resize', function () { if (started && !finished) scroll(); });
  if (window.__ORIGIN_CONFIG__.intro && !window.__novvyIntroFinished) window.addEventListener('novvy:intro-finished', start, { once: true });
  else start();
})();
