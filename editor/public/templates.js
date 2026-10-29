import { catalog } from './template-catalog.mjs';

const $ = (id) => document.getElementById(id);
const detail = $('detail-dialog');
const create = $('create-dialog');
let current = null;
let creating = null;
let filter = 'all';
let request = null;
let demoTimer = null;
let pendingCreate = false;
let returnFocus = null;

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// The studio is a separate Vite service on the same development machine.
const studio = new URL(location.href);
studio.port = '5175'; studio.pathname = '/editor/'; studio.search = ''; studio.hash = '';
$('studio-link').href = studio.href;

function renderCards() {
  const query = $('search').value.trim().toLocaleLowerCase();
  const matches = catalog.filter(item => (filter === 'all' || item.group === filter)
    && [item.id, item.name, item.subtitle, item.kind, item.summary, ...item.tags, ...item.features].join(' ').toLocaleLowerCase().includes(query));
  $('template-grid').replaceChildren(...matches.map(item => {
    const card = node('article', 'template-card');
    const cover = node('button', 'cover');
    cover.type = 'button'; cover.style.setProperty('--cover-bg', item.color);
    cover.setAttribute('aria-label', `查看 ${item.name} 详情与演示`);
    const image = node('img'); image.src = `/showcase/${item.id}.png`; image.alt = `${item.name} 真实游戏画面`;
    image.loading = 'lazy'; image.width = 390; image.height = 844;
    cover.append(image, node('span', 'cover-label', item.kind), node('span', 'cover-number', `${String(catalog.indexOf(item) + 1).padStart(2, '0')} / PLAYABLE`), node('span', 'cover-play', '▶'));
    if (item.isNew) cover.append(node('span', 'cover-label new-label', 'NEW'));
    cover.addEventListener('click', () => openDetail(item));
    const copy = node('div', 'card-copy');
    copy.append(node('h3', '', item.name), node('p', 'card-subtitle', item.subtitle), node('p', 'card-description', item.summary));
    const badges = node('div', 'badges'); badges.append(...item.tags.map(tag => node('span', 'badge', tag))); copy.append(badges);
    const actions = node('div', 'card-actions');
    const play = node('button', '', '了解与试玩'); play.type = 'button'; play.setAttribute('aria-label', `了解与试玩 ${item.name}`);
    play.append(node('span', '', '↗')); play.addEventListener('click', () => openDetail(item));
    const use = node('button', 'quick-create', '+'); use.type = 'button'; use.setAttribute('aria-label', `使用 ${item.name} 创建任务`); use.title = '使用此模板创建任务';
    use.addEventListener('click', () => openCreate(item));
    actions.append(play, use); card.append(cover, copy, actions); return card;
  }));
  $('empty-state').hidden = matches.length > 0;
  $('result-count').textContent = `显示 ${matches.length} 套模板，共 ${catalog.length} 套`;
}

function demoUrl() {
  const url = new URL(`/api/templates/${current.id}/demo`, location.origin);
  if (current.levels) url.searchParams.set('level', $('demo-level').value || '1');
  return url.pathname + url.search;
}

function unloadDemo() {
  request?.abort(); request = null;
  clearTimeout(demoTimer);
  $('demo-frame').onload = null;
  $('demo-frame').removeAttribute('srcdoc');
  $('demo-frame').src = 'about:blank';
  $('demo-frame').hidden = true;
}

async function loadDemo() {
  unloadDemo();
  const controller = new AbortController(); request = controller;
  const url = demoUrl();
  $('standalone-demo').href = url;
  const status = $('demo-status'); status.hidden = false; status.textContent = '正在加载玩法…';
  demoTimer = setTimeout(() => { controller.abort(); status.textContent = '加载时间较长，请点击「重玩」重试，或在独立窗口打开。'; }, 30000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error?.message || `演示加载失败（${response.status}）`);
    }
    const html = await response.text();
    if (controller.signal.aborted) return;
    const frame = $('demo-frame');
    frame.title = `${current.name} 可玩演示`;
    frame.onload = () => {
      if (controller.signal.aborted) return;
      clearTimeout(demoTimer); status.hidden = true;
    };
    frame.srcdoc = html; frame.hidden = false;
  } catch (error) {
    if (controller.signal.aborted) return;
    clearTimeout(demoTimer); status.textContent = `${error.message}。请点击「重玩」重试。`;
  }
}

function openDetail(item, updateHash = true) {
  if (!detail.open) returnFocus = document.activeElement;
  current = item;
  $('detail-title').textContent = item.name;
  $('detail-id').textContent = item.id;
  $('detail-description').textContent = item.description;
  $('detail-how').textContent = item.how;
  $('detail-config').textContent = item.config;
  $('detail-note').textContent = item.note;
  $('detail-badges').replaceChildren(...[item.kind, item.group === 'origin' ? '原版玩法' : '可配置关卡'].map(text => node('span', 'badge', text)));
  $('detail-features').replaceChildren(...item.features.map(text => node('li', '', text)));
  $('detail-tools').replaceChildren(...item.tools.map(tool => {
    const link = node('a', '', `${tool.label} ↗`);
    if (tool.href === 'levels') {
      link.href = '#demo-level'; link.addEventListener('click', event => { event.preventDefault(); $('demo-level').focus(); });
    } else if (tool.href === '#tools') {
      link.href = '#tools'; link.addEventListener('click', () => detail.close());
    } else {
      link.href = tool.href === 'studio' ? studio.href : tool.href; link.target = '_blank'; link.rel = 'noopener';
    }
    return link;
  }));
  if (!item.tools.length) $('detail-tools').append(node('p', '', '使用下方按钮进入此模板的任务工作台，配置素材并导出。'));
  $('level-control').hidden = !item.levels;
  $('demo-level').replaceChildren(...Array.from({ length: item.levels || 0 }, (_, index) => {
    const option = node('option', '', `第 ${index + 1} 关`); option.value = index + 1; return option;
  }));
  if (!detail.open) detail.showModal();
  detail.scrollTop = 0;
  if (updateHash) history.pushState(null, '', `#${item.id}`);
  loadDemo();
}

function openCreate(item) {
  if (pendingCreate) return;
  creating = item;
  $('create-template-name').textContent = `${item.name} · ${item.subtitle}`;
  $('new-task-name').value = '';
  $('create-error').textContent = '';
  create.showModal(); $('new-task-name').focus();
}

function syncHash() {
  const item = catalog.find(item => `#${item.id}` === location.hash);
  if (item) { if (!detail.open || current?.id !== item.id) openDetail(item, false); }
  else if (detail.open) detail.close();
}

document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(other => { const active = other === button; other.classList.toggle('active', active); other.setAttribute('aria-pressed', active); });
  renderCards();
}));
$('search').addEventListener('input', renderCards);
$('reset-filters').addEventListener('click', () => { $('search').value = ''; document.querySelector('[data-filter="all"]').click(); $('search').focus(); });
document.addEventListener('keydown', event => {
  if (event.key === '/' && !detail.open && !create.open && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !event.metaKey && !event.ctrlKey && !event.altKey) { event.preventDefault(); $('search').focus(); }
});
$('close-detail').addEventListener('click', () => detail.close());
$('close-create').addEventListener('click', () => create.close());
for (const dialog of [detail, create]) dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) {
    if (dialog !== create || !pendingCreate) dialog.close();
  }
});
detail.addEventListener('close', () => {
  unloadDemo();
  if (catalog.some(item => `#${item.id}` === location.hash)) history.replaceState(null, '', location.pathname + location.search);
  returnFocus?.focus();
});
create.addEventListener('cancel', event => { if (pendingCreate) event.preventDefault(); });
$('restart-demo').addEventListener('click', loadDemo);
$('demo-level').addEventListener('change', loadDemo);
$('use-template').addEventListener('click', () => openCreate(current));
$('create-template-form').addEventListener('submit', async event => {
  event.preventDefault();
  const name = $('new-task-name').value.trim();
  if (!name || !creating || pendingCreate) { if (!name) $('create-error').textContent = '请输入任务名称。'; return; }
  pendingCreate = true;
  $('confirm-create').disabled = true; $('close-create').disabled = true;
  $('confirm-create').textContent = '正在创建…'; $('create-error').textContent = '';
  try {
    const response = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, templateId: creating.id }) });
    const task = await response.json();
    if (!response.ok) throw new Error(task?.error?.message || '创建失败，请稍后重试');
    location.href = `/task.html?id=${encodeURIComponent(task.id)}`;
  } catch (error) {
    $('create-error').textContent = error.message;
    pendingCreate = false; $('confirm-create').disabled = false; $('close-create').disabled = false;
    $('confirm-create').textContent = '创建并进入工作台 ↗';
  }
});
window.addEventListener('hashchange', syncHash);
renderCards(); syncHash();
