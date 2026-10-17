(function () {
  'use strict';
  const levels = window.__ESCAPE_ARROW_CATALOG__;
  const $ = id => document.getElementById(id);
  const grid = $('level-grid'), frame = $('game-player'), panel = $('player-panel');
  const mobile = window.matchMedia('(max-width: 900px)');
  const cards = new Map();
  let current = null, previousFocus = null;

  function navigateFrame(url) {
    frame.dataset.levelUrl = url;
    // Replacing the child location keeps browser Back for the selected levels,
    // instead of adding a second history entry for every iframe navigation.
    try { frame.contentWindow.location.replace(new URL(url, document.baseURI).href); }
    catch (_) { frame.src = url; }
  }

  function closePlayer() {
    panel.classList.remove('is-open');
    document.body.classList.remove('player-open');
    panel.removeAttribute('role'); panel.removeAttribute('aria-modal');
    document.querySelector('.library').inert = false;
    document.querySelector('.page-header').inert = false;
    if (mobile.matches) navigateFrame('about:blank');
    previousFocus?.focus();
  }

  function openPlayer() {
    if (!mobile.matches) return;
    if (!panel.classList.contains('is-open')) previousFocus = document.activeElement;
    panel.classList.add('is-open');
    document.body.classList.add('player-open');
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
    document.querySelector('.library').inert = true;
    document.querySelector('.page-header').inert = true;
    $('close-player').focus();
  }

  function selectLevel(id, options = {}) {
    const index = levels.findIndex(level => level.id === id);
    if (index < 0) return;
    current = levels[index];
    for (const [levelId, card] of cards) {
      card.setAttribute('aria-pressed', String(levelId === id));
      card.querySelector('.play-label').textContent = levelId === id ? '已选择' : '试玩 ↗';
    }
    $('player-title').textContent = `第 ${id} 关`;
    $('player-meta').textContent = `${current.width} × ${current.height} 格 · ${current.arrows} 根箭头 · 开局可逃出 ${current.initiallyFree} 根`;
    $('player-status').textContent = '正在加载关卡…';
    $('previous-level').disabled = index === 0;
    $('next-level').disabled = index === levels.length - 1;
    $('open-level').href = current.play;
    frame.title = `第 ${id} 关试玩`;
    if (options.open) openPlayer();
    navigateFrame(current.play);
    if (options.history !== false) {
      const url = new URL(window.location.href); url.searchParams.set('level', String(id));
      history.pushState(null, '', url);
    }
  }

  for (const level of levels) {
    const card = document.createElement('button');
    card.type = 'button'; card.className = 'level-card';
    card.dataset.level = String(level.id); card.setAttribute('aria-pressed', 'false');
    card.setAttribute('aria-label', `试玩第 ${level.id} 关`);
    const image = document.createElement('img');
    image.src = level.preview; image.alt = `第 ${level.id} 关棋盘`; image.loading = 'lazy';
    const row = document.createElement('div'); row.className = 'level-card-top';
    const title = document.createElement('strong'); title.textContent = `第 ${level.id} 关`;
    const play = document.createElement('span'); play.className = 'play-label'; play.textContent = '试玩 ↗';
    row.append(title, play);
    const meta = document.createElement('p'); meta.textContent = `${level.width} × ${level.height} 格 · ${level.arrows} 根箭头`;
    card.append(image, row, meta);
    card.addEventListener('click', () => selectLevel(level.id, { open: true }));
    cards.set(level.id, card); grid.append(card);
  }
  $('level-count').textContent = String(levels.length);
  $('previous-level').onclick = () => { const index = levels.indexOf(current); if (index > 0) selectLevel(levels[index - 1].id); };
  $('next-level').onclick = () => { const index = levels.indexOf(current); if (index < levels.length - 1) selectLevel(levels[index + 1].id); };
  $('restart-level').onclick = () => { if (current) navigateFrame(current.play); };
  $('close-player').onclick = closePlayer;
  frame.addEventListener('load', () => { if (frame.dataset.levelUrl !== 'about:blank') $('player-status').textContent = '点击箭头让它逃出 · 拖动与双指缩放查看棋盘'; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && mobile.matches) closePlayer(); });
  window.addEventListener('popstate', () => {
    const id = Number(new URL(window.location.href).searchParams.get('level'));
    if (mobile.matches && !levels.some(level => level.id === id)) { closePlayer(); return; }
    selectLevel(levels.some(level => level.id === id) ? id : levels[0].id, { history: false, open: mobile.matches });
  });
  mobile.addEventListener('change', () => {
    closePlayer();
    if (!mobile.matches && current) navigateFrame(current.play);
  });
  const requested = Number(new URL(window.location.href).searchParams.get('level'));
  const initial = levels.some(level => level.id === requested) ? requested : levels[0].id;
  if (mobile.matches && !requested) {
    // Keep the library visible and avoid running a hidden game on small screens.
    current = levels[0];
  } else selectLevel(initial, { history: false, open: mobile.matches });
})();
