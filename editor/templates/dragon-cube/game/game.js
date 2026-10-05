(function () {
  'use strict';
  var DEFAULT_LEVEL = {"Index":1,"Difficulty":"0","TimeLimit":300,"Cells":[{"Index":{"x":0,"y":0},"Cat":{"Color":7,"Gimmicks":[]},"ColorPath":-1},{"Index":{"x":0,"y":1},"Cat":{"Color":7,"Gimmicks":[]},"ColorPath":-1},{"Index":{"x":0,"y":2},"ColorPath":-1},{"Index":{"x":0,"y":3},"ColorPath":-1},{"Index":{"x":0,"y":4},"ColorPath":-1},{"Index":{"x":1,"y":0},"Cat":{"Color":7,"Gimmicks":[]},"ColorPath":-1},{"Index":{"x":1,"y":1},"Cat":{"Color":7,"Gimmicks":[]},"ColorPath":-1},{"Index":{"x":1,"y":2},"ColorPath":-1},{"Index":{"x":1,"y":3},"ColorPath":-1},{"Index":{"x":1,"y":4},"ColorPath":-1},{"Index":{"x":2,"y":0},"ColorPath":-1},{"Index":{"x":2,"y":1},"ColorPath":-1},{"Index":{"x":2,"y":2},"ColorPath":-1},{"Index":{"x":2,"y":3},"Cat":{"Color":4,"Gimmicks":[]},"ColorPath":-1},{"Index":{"x":2,"y":4},"Cat":{"Color":4,"Gimmicks":[]},"ColorPath":-1},{"Index":{"x":3,"y":0},"ColorPath":-1},{"Index":{"x":3,"y":1},"ColorPath":-1},{"Index":{"x":3,"y":2},"ColorPath":-1},{"Index":{"x":3,"y":3},"Cat":{"Color":4,"Gimmicks":[]},"ColorPath":-1},{"Index":{"x":3,"y":4},"Cat":{"Color":4,"Gimmicks":[]},"ColorPath":-1}],"Boxes":[{"Index":1,"Color":7,"Cells":[{"x":0,"y":4},{"x":0,"y":3},{"x":1,"y":4},{"x":1,"y":3}],"Count":4,"Gimmicks":[]},{"Index":2,"Color":4,"Cells":[{"x":2,"y":1},{"x":2,"y":0},{"x":3,"y":1},{"x":3,"y":0}],"Count":4,"Gimmicks":[]}],"Groups":[],"Scratchers":[],"Ropes":[],"Barricades":null};
  var level = window.__DRAGON_CUBE_LEVEL__ || DEFAULT_LEVEL;
  var colors = ['#4b5c9b', '#3f6d5b', '#9bc64c', '#f0a44b', '#ed87a0', '#ae78c2', '#d75d62', '#6ba9d5', '#e2eff6', '#f3ce54'];
  var names = ['Blue', 'Green', 'Lime', 'Orange', 'Pink', 'Purple', 'Red', 'Sky', 'White', 'Yellow'];
  var script = document.currentScript;
  var assetRoot = new URL('assets/', script && script.src || document.baseURI);
  var sprites = names.map(function (name) {
    var image = new Image();
    image.src = new URL('Cat_' + name + '.png', assetRoot).href;
    return image;
  });
  var floorImg = new Image();
  floorImg.src = new URL('floor.png', assetRoot).href;
  var boxImgs = {};
  function boxImage(key) {
    if (!boxImgs[key]) {
      var image = new Image();
      image.src = new URL('boxes/' + key + '.png', assetRoot).href;
      boxImgs[key] = image;
    }
    return boxImgs[key];
  }
  var canvas = document.getElementById('board');
  var ctx = canvas.getContext('2d');
  var wrap = document.getElementById('board-wrap');
  var timerNode = document.getElementById('timer');
  var hintNode = document.getElementById('hint');
  var resultNode = document.getElementById('win');
  var state, layout, drag = null, tick = null, particles = [], ghosts = [];
  var directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  document.getElementById('level-number').textContent = level.Index;

  // ---- 音效：WebAudio 优先（http(s) 环境），HTMLAudio 兜底（file://）；iOS 需首次手势解锁 ----
  var SFX_NAMES = ['click', 'drop', 'collect', 'coin', 'win', 'fail'];
  var audio = { ctx: null, muted: false, unlocked: false, music: null, buffers: {}, elems: {}, volumes: { click: .55, drop: .9, collect: .8, coin: .65, win: 1, fail: .9 } };
  function sfxUrl(name) { return new URL('sfx/' + name + '.m4a', assetRoot).href; }
  function initAudio() {
    if (audio.elems.click) return;
    audio.music = new Audio(sfxUrl('bgm'));
    audio.music.loop = true;
    audio.music.volume = .5;
    audio.music.preload = 'auto';
    audio.music.muted = audio.muted;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC) { try { audio.ctx = new AC(); } catch (err) { audio.ctx = null; } }
    for (var i = 0; i < SFX_NAMES.length; i++) {
      var name = SFX_NAMES[i];
      var el = new Audio(sfxUrl(name));
      el.preload = 'auto';
      audio.elems[name] = el;
      loadBuffer(name);
    }
  }
  function loadBuffer(name) {
    if (!audio.ctx || typeof fetch !== 'function') return;
    fetch(sfxUrl(name)).then(function (res) { return res.arrayBuffer(); })
      .then(function (raw) { return audio.ctx.decodeAudioData(raw); })
      .then(function (buf) { audio.buffers[name] = buf; })
      .catch(function () {});
  }
  function primeAudio() {
    initAudio();
    if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
    startMusic();
    if (audio.unlocked) return;
    audio.unlocked = true;
    // iOS WebView 需要在手势内触发过一次播放，这里静音试播解锁所有音效元素
    for (var name in audio.elems) {
      var el = audio.elems[name];
      el.volume = 0;
      var p = el.play();
      if (p && p.then) (function (element) {
        p.then(function () {
          // A real SFX may have started before this unlock promise resolves.
          if (element.volume === 0) { element.pause(); element.currentTime = 0; }
        }).catch(function () {});
      })(el);
    }
  }
  function startMusic() {
    if (!audio.music || audio.muted || document.hidden || !audio.music.paused) return;
    // 片头视频还在播时不起 BGM(广告壳会注入 #novvy-video-intro 覆盖层):
    // 点跳过/静音属于视频阶段的手势,不该把游戏音乐漏出来盖过视频;
    // 视频结束(novvy:intro-finished)后再起。原版页面没有该元素,不受影响。
    if (document.getElementById('novvy-video-intro')) return;
    var p = audio.music.play();
    if (p && p.catch) p.catch(function () {});
  }
  function setMuted(muted) {
    audio.muted = !!muted;
    if (audio.music) {
      audio.music.muted = audio.muted;
      if (audio.muted) audio.music.pause();
      else if (audio.unlocked) startMusic();
    }
  }
  function play(name) {
    if (audio.muted) return;
    initAudio();
    var buf = audio.buffers[name];
    var vol = audio.volumes[name] || 1;
    if (buf && audio.ctx && audio.ctx.state === 'running') {
      var src = audio.ctx.createBufferSource();
      src.buffer = buf;
      var gain = audio.ctx.createGain();
      gain.gain.value = vol;
      src.connect(gain);
      gain.connect(audio.ctx.destination);
      src.start();
    } else {
      var el = audio.elems[name];
      if (el) { el.volume = vol; el.currentTime = 0; var p = el.play(); if (p && p.catch) p.catch(function () {}); }
    }
  }

  function key(x, y) { return x + ',' + y; }
  function clamp(value, low, high) { return Math.min(high, Math.max(low, value)); }
  function fire(name, detail) { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); }
  function easeInBack(t) { var c1 = 1.70158; return t * t * ((c1 + 1) * t - c1); }
  // BoxShapeDetector.cs 的移植：按归一化格子形状判断盒子类型，决定用哪张贴图。
  function detectBoxType(cells) {
    var minX = Math.min.apply(null, cells.map(function (c) { return c.x; }));
    var minY = Math.min.apply(null, cells.map(function (c) { return c.y; }));
    var s = new Set(cells.map(function (c) { return (c.x - minX) + ',' + (c.y - minY); }));
    var has = function (x, y) { return s.has(x + ',' + y); };
    var parts = Array.from(s, function (k) { return k.split(',').map(Number); });
    switch (s.size) {
      case 1: return 'Block_01';
      case 2:
        if (has(0, 0) && has(1, 0)) return 'I2_90';
        if (has(0, 0) && has(0, 1)) return 'I2';
        return 'Block_01';
      case 3:
        if (has(0, 0) && has(1, 0) && has(2, 0)) return 'I3_90';
        if (has(0, 0) && has(0, 1) && has(0, 2)) return 'I3';
        if (has(0, 0) && has(0, 1) && has(1, 0)) return 'R_0';
        if (has(0, 0) && has(1, 0) && has(1, 1)) return 'R_90';
        if (has(1, 0) && has(1, 1) && has(0, 1)) return 'R_180';
        if (has(0, 0) && has(0, 1) && has(1, 1)) return 'R_270';
        return 'Block_01';
      case 4:
        if (has(0, 0) && has(1, 0) && has(0, 1) && has(1, 1)) return 'Block_02';
        for (var y = 0; y < 3; y++) {
          if (has(0, y) && has(1, y) && has(2, y)) {
            var hstem = parts.find(function (p) { return p[1] !== y; });
            if (hstem && hstem[0] === 1 && hstem[1] < y) return 'T_0';
            if (hstem && hstem[0] === 1 && hstem[1] > y) return 'T_180';
          }
        }
        for (var x = 0; x < 3; x++) {
          if (has(x, 0) && has(x, 1) && has(x, 2)) {
            var vstem = parts.find(function (p) { return p[0] !== x; });
            if (vstem && vstem[1] === 1 && vstem[0] > x) return 'T_90';
            if (vstem && vstem[1] === 1 && vstem[0] < x) return 'T_270';
          }
        }
        if (has(0, 0) && has(1, 0) && has(0, 1) && has(0, 2)) return 'L_0';
        if (has(0, 0) && has(1, 0) && has(2, 0) && has(2, 1)) return 'L_90';
        if (has(1, 0) && has(1, 1) && has(1, 2) && has(0, 2)) return 'L_180';
        if (has(0, 0) && has(0, 1) && has(1, 1) && has(2, 1)) return 'L_270';
        if (has(0, 0) && has(1, 0) && has(1, 1) && has(1, 2)) return 'J_0';
        if (has(0, 1) && has(1, 1) && has(2, 1) && has(2, 0)) return 'J_90';
        if (has(0, 0) && has(0, 1) && has(0, 2) && has(1, 2)) return 'J_180';
        if (has(0, 0) && has(0, 1) && has(1, 0) && has(2, 0)) return 'J_270';
        if (has(0, 0) && has(0, 1) && has(0, 2) && has(1, 0)) return 'R_0';
        if (has(0, 0) && has(1, 0) && has(2, 0) && has(0, 2)) return 'R_90';
        if (has(1, 0) && has(1, 1) && has(1, 2) && has(2, 2)) return 'R_180';
        if (has(0, 1) && has(1, 1) && has(2, 1) && has(2, 2)) return 'R_270';
        return 'Block_01';
      case 5:
        if (has(1, 1) && has(0, 1) && has(2, 1) && has(1, 0) && has(1, 2)) return 'Plus';
        return 'Block_01';
      default: return 'Block_01';
    }
  }
  function initialState() {
    var cells = new Set(level.Cells.map(function (cell) { return key(cell.Index.x, cell.Index.y); }));
    var cats = level.Cells.filter(function (cell) { return cell.Cat; }).map(function (cell) {
      return { x: cell.Index.x, y: cell.Index.y, color: cell.Cat.Color };
    });
    var blocks = level.Cells.filter(function (cell) { return cell.Block; }).map(function (cell) {
      return { x: cell.Index.x, y: cell.Index.y, direction: cell.Block.Direction, queue: cell.Block.Cats.map(function (cat) { return cat.Color; }) };
    });
    var boxes = level.Boxes.map(function (box) {
      var origin = box.Cells[0];
      var offsets = box.Cells.map(function (cell) { return { x: cell.x - origin.x, y: cell.y - origin.y }; });
      var minOx = Math.min.apply(null, offsets.map(function (o) { return o.x; }));
      var maxOy = Math.max.apply(null, offsets.map(function (o) { return o.y; }));
      var minOy = Math.min.apply(null, offsets.map(function (o) { return o.y; }));
      var type = detectBoxType(box.Cells);
      return {
        id: box.Index, x: origin.x, y: origin.y, offsets: offsets, color: box.Color, remaining: box.Count,
        type: type, minOx: minOx, maxOy: maxOy,
        w: Math.max.apply(null, offsets.map(function (o) { return o.x; })) - minOx + 1,
        h: maxOy - minOy + 1, dying: 0
      };
    });
    return { cells: cells, cats: cats, blocks: blocks, boxes: boxes, left: Math.max(1, level.TimeLimit), total: cats.length + blocks.reduce(function (n, b) { return n + b.queue.length; }, 0), collected: 0, started: false, finished: false };
  }
  function reset() {
    if (tick) clearInterval(tick);
    tick = null;
    state = initialState();
    drag = null;
    particles = [];
    ghosts = [];
    resultNode.hidden = true;
    hintNode.textContent = '拖动色块，收集同色小猫';
    timerNode.textContent = formatTime(state.left);
    render(performance.now());
    fire('novvy:hud-progress', { percent: 0 });
  }
  function formatTime(seconds) { return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0'); }
  function startTimer() {
    if (state.started || state.finished) return;
    state.started = true;
    tick = setInterval(function () {
      if (state.finished) return;
      state.left -= 1;
      timerNode.textContent = formatTime(state.left);
      if (state.left <= 0) finish(false);
    }, 1000);
    fire('dragon-cube:start', { levelId: level.Index });
  }
  function finish(won) {
    if (state.finished) return;
    state.finished = true;
    if (tick) clearInterval(tick);
    play(won ? 'win' : 'fail');
    document.getElementById('result-title').textContent = won ? '关卡完成！' : '时间到！';
    document.getElementById('result-copy').textContent = won ? '所有小猫都回家了' : '再试一次，收集所有小猫';
    resultNode.hidden = false;
    if (won) fire('novvy:victory', { levelId: level.Index, collected: state.collected });
    else fire('dragon-cube:fail', { levelId: level.Index });
  }
  function bounds() {
    var xs = level.Cells.map(function (cell) { return cell.Index.x; });
    var ys = level.Cells.map(function (cell) { return cell.Index.y; });
    return { minX: Math.min.apply(null, xs), maxX: Math.max.apply(null, xs), minY: Math.min.apply(null, ys), maxY: Math.max.apply(null, ys) };
  }
  var boardBounds = bounds();
  function resize() {
    var rect = wrap.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var columns = boardBounds.maxX - boardBounds.minX + 1;
    var rows = boardBounds.maxY - boardBounds.minY + 1;
    var cell = Math.min((rect.width - 26) / columns, (rect.height - 28) / rows, 64);
    layout = { cell: cell, left: (rect.width - columns * cell) / 2, top: (rect.height - rows * cell) / 2, width: rect.width, height: rect.height };
    render(performance.now());
  }
  function center(x, y) {
    return { x: layout.left + (x - boardBounds.minX + .5) * layout.cell, y: layout.top + (boardBounds.maxY - y + .5) * layout.cell };
  }
  function boardPoint(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    var x = clientX - rect.left, y = clientY - rect.top;
    return { x: boardBounds.minX + Math.floor((x - layout.left) / layout.cell), y: boardBounds.maxY - Math.floor((y - layout.top) / layout.cell), px: x, py: y };
  }
  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function boxCells(box, nextX, nextY) {
    return box.offsets.map(function (part) { return { x: (nextX === undefined ? box.x : nextX) + part.x, y: (nextY === undefined ? box.y : nextY) + part.y }; });
  }
  function valid(box, x, y) {
    var occupied = new Set();
    for (var other of state.boxes) if (other !== box && other.remaining > 0) for (var part of boxCells(other)) occupied.add(key(part.x, part.y));
    // Unity only ignores box/cat collisions for matching colors.
    for (var cat of state.cats) if (cat.color !== box.color) occupied.add(key(cat.x, cat.y));
    var blocks = new Set(state.blocks.map(function (b) { return key(b.x, b.y); }));
    return boxCells(box, x, y).every(function (part) { var k = key(part.x, part.y); return state.cells.has(k) && !occupied.has(k) && !blocks.has(k); });
  }
  function emitProgress() { fire('novvy:hud-progress', { percent: Math.round(100 * state.collected / state.total) }); }
  function burst(x, y) {
    var now = performance.now();
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2 + Math.random() * .6;
      var speed = layout.cell * (.9 + Math.random() * .9);
      particles.push({ x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - layout.cell * .4, born: now, life: 550 });
    }
  }
  function collect(box) {
    var hit = new Set(boxCells(box).map(function (cell) { return key(cell.x, cell.y); }));
    var kept = [];
    for (var cat of state.cats) {
      if (cat.color === box.color && hit.has(key(cat.x, cat.y)) && box.remaining > 0) {
        box.remaining -= 1; state.collected += 1;
        ghosts.push({ x: cat.x, y: cat.y, color: cat.color, born: performance.now() });
        emitProgress(); fire('dragon-cube:collect', { color: cat.color, collected: state.collected });
      } else kept.push(cat);
    }
    state.cats = kept;
    // 猫块只在朝向上的第一块色块与队列首只猫同色时出猫。
    for (var block of state.blocks) {
      if (!block.queue.length) continue;
      var dir = directions[block.direction];
      var x = block.x + dir[0], y = block.y + dir[1];
      while (state.cells.has(key(x, y))) {
        if (hit.has(key(x, y))) {
          if (block.queue[0] === box.color && box.remaining > 0) {
            block.queue.shift(); box.remaining -= 1; state.collected += 1;
            ghosts.push({ x: block.x, y: block.y, color: box.color, born: performance.now() });
            emitProgress(); fire('dragon-cube:collect', { color: box.color, collected: state.collected });
          }
          break;
        }
        if (state.boxes.some(function (other) { return other !== box && other.remaining > 0 && boxCells(other).some(function (part) { return part.x === x && part.y === y; }); })) break;
        x += dir[0]; y += dir[1];
      }
    }
    // 收完的盒子开始缩小退场，全部收完后延迟到动画结束再判定胜利。
    for (var item of state.boxes) {
      if (item.remaining <= 0 && !item.dying) { item.dying = performance.now(); play('coin'); }
    }
    if (!state.finished && state.boxes.every(function (b) { return b.remaining <= 0; })) {
      var snapshot = state;
      setTimeout(function () { if (state === snapshot) finish(true); }, 300);
    }
  }
  function move(box, x, y) {
    if (!valid(box, x, y)) return false;
    box.x = x; box.y = y;
    collect(box);
    render(performance.now());
    return true;
  }
  function onDown(event) {
    primeAudio();
    if (state.finished || !layout) return;
    var point = boardPoint(event.clientX, event.clientY);
    var found = state.boxes.slice().reverse().find(function (box) { return box.remaining > 0 && boxCells(box).some(function (part) { return part.x === point.x && part.y === point.y; }); });
    if (!found) return;
    startTimer();
    drag = { id: found.id, x: point.x, y: point.y };
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
    hintNode.textContent = '把色块移到同色小猫上';
    render(performance.now());
  }
  function onMove(event) {
    if (!drag || state.finished) return;
    var box = state.boxes.find(function (item) { return item.id === drag.id; });
    if (!box || box.remaining <= 0) { drag = null; return; }
    var point = boardPoint(event.clientX, event.clientY);
    for (var step = 0; step < 16; step++) {
      var dx = clamp(point.x - drag.x, -1, 1), dy = clamp(point.y - drag.y, -1, 1);
      if (!dx && !dy) break;
      var first = Math.abs(point.x - drag.x) >= Math.abs(point.y - drag.y) ? [dx, 0] : [0, dy];
      var second = first[0] ? [0, dy] : [dx, 0];
      var chosen = null;
      for (var delta of [first, second]) {
        if ((delta[0] || delta[1]) && move(box, box.x + delta[0], box.y + delta[1])) { chosen = delta; break; }
      }
      if (!chosen) break;
      drag.x += chosen[0]; drag.y += chosen[1];
      if (state.finished || !state.boxes.includes(box) || box.remaining <= 0) { drag = null; break; }
    }
    event.preventDefault();
  }
  function drawCell(cell) {
    var p = center(cell.Index.x, cell.Index.y), s = layout.cell;
    ctx.save();
    ctx.shadowColor = '#a9595b66'; ctx.shadowBlur = s * .08; ctx.shadowOffsetY = s * .045;
    if (floorImg.complete && floorImg.naturalWidth) {
      ctx.drawImage(floorImg, p.x - s * .5, p.y - s * .5, s, s);
    } else {
      roundRect(p.x - s * .48, p.y - s * .48, s * .96, s * .96, s * .17);
      ctx.fillStyle = '#a9595b55'; ctx.fill();
      roundRect(p.x - s * .48, p.y - s * .52, s * .96, s * .91, s * .17);
      ctx.fillStyle = '#fff3d8'; ctx.fill();
      ctx.strokeStyle = '#f4d4ad'; ctx.lineWidth = Math.max(1, s * .035); ctx.stroke();
    }
    ctx.restore();
  }
  function drawCat(cat, scale) {
    var p = center(cat.x, cat.y);
    var s = layout.cell * (scale || .92);
    if (!scale) s *= 1 + .035 * Math.sin(performance.now() / 420 + cat.x * .7 + cat.y * 1.3); // 待机呼吸
    var image = sprites[cat.color];
    if (image && image.complete && image.naturalWidth) ctx.drawImage(image, p.x - s / 2, p.y - s / 2, s, s);
    else { ctx.fillStyle = colors[cat.color] || '#888'; ctx.beginPath(); ctx.arc(p.x, p.y, s * .34, 0, Math.PI * 2); ctx.fill(); }
  }
  function drawBox(box, now) {
    var s = layout.cell;
    var scale = 1;
    if (box.dying) {
      var dt = (now - box.dying) / 220;
      if (dt >= 1) return;
      scale = 1 - dt * dt; // 收完后缩小退场，对应 Unity 的 DOScale(Vector3.zero)
    }
    var selected = drag && drag.id === box.id;
    var img = boxImage(names[box.color] + '/' + box.type);
    var origin = center(box.x + box.minOx, box.y + box.maxOy);
    // sprite 尺寸恰好是格子数的 128px/格，以形状几何中心定位（origin 是左上格中心）
    var w = box.w * s * scale, h = box.h * s * scale;
    var cx = origin.x + (box.w - 1) * s / 2;
    var cy = origin.y + (box.h - 1) * s / 2;
    ctx.save();
    ctx.shadowColor = '#79474b66'; ctx.shadowBlur = (selected ? 14 : 6) * scale; ctx.shadowOffsetY = (selected ? 6 : 3) * scale;
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    } else {
      for (var part of boxCells(box)) {
        var pp = center(part.x, part.y);
        roundRect(pp.x - s * .46 * scale, pp.y - s * .46 * scale, s * .92 * scale, s * .92 * scale, s * .18 * scale);
        ctx.fillStyle = colors[box.color] || '#888'; ctx.fill();
        ctx.strokeStyle = '#ffffffb9'; ctx.lineWidth = s * .045 * scale; ctx.stroke();
      }
    }
    ctx.restore();
    if (scale > .5) {
      var label = center(box.x, box.y);
      var ls = s * scale;
      ctx.fillStyle = '#fff7e9'; ctx.beginPath(); ctx.arc(label.x + ls * .25, label.y - ls * .25, ls * .21, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7a4b51'; ctx.font = '900 ' + Math.round(ls * .25) + 'px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(box.remaining, label.x + ls * .25, label.y - ls * .25);
    }
  }
  function render(now) {
    if (!layout || !state) return;
    ctx.clearRect(0, 0, layout.width, layout.height);
    for (var cell of level.Cells) drawCell(cell);
    for (var cat of state.cats) drawCat(cat);
    for (var block of state.blocks) {
      var p = center(block.x, block.y), s = layout.cell;
      roundRect(p.x - s * .45, p.y - s * .45, s * .9, s * .9, s * .16); ctx.fillStyle = '#826884'; ctx.fill();
      ctx.strokeStyle = '#ffe5c9'; ctx.lineWidth = s * .04; ctx.stroke();
      if (block.queue.length) {
        drawCat({ x: block.x, y: block.y, color: block.queue[0] }, .7);
        ctx.fillStyle = '#fff9e8'; ctx.font = '900 ' + Math.round(s * .26) + 'px Arial'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(block.queue.length, p.x + s * .39, p.y + s * .39);
      }
      ctx.fillStyle = '#fff9e8'; ctx.font = '900 ' + Math.round(s * .32) + 'px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(['↑', '→', '↓', '←'][block.direction], p.x, p.y - s * .32);
    }
    var dragged = state.boxes.filter(function (box) { return drag && drag.id === box.id; });
    for (var box of state.boxes) if (dragged.indexOf(box) < 0) drawBox(box, now);
    for (var item of dragged) drawBox(item, now);
    for (var ghost of ghosts) { // 被收进盒子的猫：原位缩小吞入
      var t = (now - ghost.born) / 420;
      if (t < 1) drawCat({ x: ghost.x, y: ghost.y, color: ghost.color }, .92 * Math.max(0, 1 - easeInBack(t)));
    }
    particles = particles.filter(function (pt) { return now - pt.born < pt.life; });
    for (var pt of particles) {
      var age = (now - pt.born) / pt.life;
      var pos = center(pt.x, pt.y);
      ctx.globalAlpha = 1 - age;
      ctx.fillStyle = '#fff';
      ctx.font = '900 ' + Math.round(layout.cell * (.28 + age * .2)) + 'px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('✦', pos.x + pt.vx * age, pos.y + pt.vy * age);
      ctx.globalAlpha = 1;
    }
  }
  function frame() {
    var now = performance.now();
    ghosts = ghosts.filter(function (ghost) {
      if (now - ghost.born < 420) return true;
      burst(ghost.x, ghost.y);
      play('drop');
      return false;
    });
    if (state) state.boxes = state.boxes.filter(function (box) { return !box.dying || now - box.dying < 220; });
    render(now);
    requestAnimationFrame(frame);
  }
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', function () { drag = null; });
  canvas.addEventListener('pointercancel', function () { drag = null; });
  document.getElementById('reset').addEventListener('click', function () { play('click'); reset(); });
  document.getElementById('result-reset').addEventListener('click', function () { play('click'); reset(); });
  window.addEventListener('resize', resize);
  document.addEventListener('pointerdown', primeAudio);
  window.addEventListener('novvy:intro-finished', startMusic);
  document.addEventListener('visibilitychange', function () {
    if (!audio.music) return;
    if (document.hidden) audio.music.pause();
    else if (audio.unlocked) startMusic();
  });
  if (window.ResizeObserver) new ResizeObserver(resize).observe(wrap);
  window.DragonCube = {
    reset: reset,
    setMuted: setMuted,
    getState: function () { return { levelId: level.Index, left: state.left, collected: state.collected, total: state.total, boxes: state.boxes.filter(function (b) { return b.remaining > 0; }).length, finished: state.finished }; }
  };
  reset();
  resize();
  requestAnimationFrame(frame);
})();
