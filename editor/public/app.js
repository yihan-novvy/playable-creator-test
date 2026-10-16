// Task list page.
const STEP_NAMES = {
  intro: '开场视频',
  hud: 'HUD',
  background: '背景',
  pattern: '图案',
  levels: '关卡',
  level: '关卡',
  pack: '打包',
};

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (typeof child === 'string') node.append(child);
    else node.append(child);
  }
  return node;
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || `${res.status} ${res.statusText}`);
  return body;
}

function chip(label, state) {
  return el('span', { class: `chip ${state}` }, [label]);
}

async function renderEnv() {
  const wrap = document.getElementById('env-chips');
  try {
    const env = await fetchJson('/api/env');
    for (const [key, value] of Object.entries(env)) {
      if (key === 'ok') continue;
      wrap.append(chip(key, value ? 'ok' : 'bad'));
    }
  } catch (error) {
    wrap.append(chip('环境不可用', 'bad'));
  }
}

let templatesCache = [];
const WORKBENCH_LABELS = {
  'colorever-new': '方形珠子拼图',
  colorever: '彩豆拼图案',
  'water-sort': '水色排序',
  'dragon-cube': 'DragonCube 选关',
};
async function renderTemplates() {
  templatesCache = await fetchJson('/api/templates');
}

function stepChips(steps) {
  const wrap = el('span', {});
  for (const [stepId, info] of Object.entries(steps || {})) {
    const state = info.ok ? (info.stale ? 'stale' : 'ok') : 'fail';
    const chipNode = el('span', {
      class: `step-state ${info.ok ? (info.stale ? 'stale' : 'ok') : ''}`,
      title: info.ok ? (info.stale ? '输入已更新,建议重跑' : `完成于 ${info.lastRunAt}`) : '未运行或失败',
    }, [STEP_NAMES[stepId] || stepId]);
    chipNode.style.marginRight = '4px';
    wrap.append(chipNode);
  }
  return wrap;
}

// 任务列表与各任务状态缓存:过滤只重渲染 DOM,不重新发请求。
let tasksCache = [];
const statusCache = new Map();

const EMPTY_HINT = '还没有任务。先创建一个,然后上传素材、逐步预览、打包。';
const FILTERED_EMPTY_HINT = '没有符合过滤条件的任务,试试调整名称或日期。';

// 按「更新时间为某一天」过滤:输入框的 value 是 YYYY-MM-DD,和本地时区日期串比较。
function localDateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function matchesFilters(task) {
  const query = document.getElementById('task-filter-text').value.trim().toLowerCase();
  if (query && !`${task.name} ${task.templateId}`.toLowerCase().includes(query)) return false;
  const day = document.getElementById('task-filter-date').value;
  if (day && localDateKey(new Date(task.updatedAt)) !== day) return false;
  return true;
}

async function renderTasks() {
  tasksCache = await fetchJson('/api/tasks');
  await Promise.all(tasksCache.map(async (task) => {
    try {
      statusCache.set(task.id, await fetchJson(`/api/tasks/${task.id}`));
    } catch {
      statusCache.set(task.id, null); // deleted mid-render
    }
  }));
  renderFilteredRows();
}

function renderFilteredRows() {
  const tbody = document.getElementById('task-rows');
  const hint = document.getElementById('empty-hint');
  const count = document.getElementById('task-filter-count');
  const clearButton = document.getElementById('task-filter-clear');
  const textValue = document.getElementById('task-filter-text').value;
  const dateValue = document.getElementById('task-filter-date').value;
  const filtersActive = textValue.trim() !== '' || dateValue !== '';

  tbody.textContent = '';
  const filtered = tasksCache.filter(matchesFilters);
  clearButton.hidden = !filtersActive;
  count.textContent = filtersActive ? `共 ${filtered.length} / ${tasksCache.length} 个任务` : '';
  if (tasksCache.length === 0) {
    hint.textContent = EMPTY_HINT;
    hint.hidden = false;
  } else if (filtered.length === 0) {
    hint.textContent = FILTERED_EMPTY_HINT;
    hint.hidden = false;
  } else {
    hint.hidden = true;
  }
  for (const task of filtered) {
    const status = statusCache.get(task.id);
    const tr = el('tr', {});
    tr.append(el('td', {}, [el('a', { href: `/task.html?id=${encodeURIComponent(task.id)}` }, [task.name])]));
    tr.append(el('td', {}, [task.templateId]));
    tr.append(el('td', {}, [status ? stepChips(status.status?.steps) : '']));
    const distBytes = status?.status?.hasDist ? `${(status.status.distBytes / 1024 / 1024).toFixed(1)} MB` : '—';
    tr.append(el('td', {}, [distBytes]));
    tr.append(el('td', {}, [new Date(task.updatedAt).toLocaleString('zh-CN')]));
    const del = el('button', {
      class: 'danger',
      onclick: async () => {
        if (!confirm(`删除任务「${task.name}」?project 与 dist 都会移除。`)) return;
        await fetchJson(`/api/tasks/${task.id}`, { method: 'DELETE' });
        renderTasks();
      },
    }, ['删除']);
    tr.append(el('td', {}, [del]));
    tbody.append(tr);
  }
}

// 创建弹窗:点「创建」后先选模板(水色排序 / 彩豆拼图案),确认才真正建任务。
// 复用与工作台弹窗同一套 .modal-backdrop 样式;Esc / 点背景 / × 关闭。
function openCreateModal(name) {
  document.querySelectorAll('.modal-backdrop').forEach((node) => node.remove());
  let selectedId = null;
  let confirmButton = null;

  const backdrop = el('div', { class: 'modal-backdrop' });
  const onKeyDown = (event) => {
    if (event.key === 'Escape') close();
  };
  const close = () => {
    document.removeEventListener('keydown', onKeyDown);
    backdrop.remove();
  };
  backdrop.addEventListener('pointerdown', (event) => {
    if (event.target === backdrop) close();
  });
  document.addEventListener('keydown', onKeyDown);

  const dialog = el('div', { class: 'modal-dialog create-dialog' });
  dialog.append(el('div', { class: 'modal-header' }, [
    el('h3', {}, [`选择模板 · ${name}`]),
    el('button', { class: 'modal-close', 'aria-label': '关闭', onclick: () => close() }, ['×']),
  ]));

  const list = el('div', { class: 'template-options' });
  for (const template of templatesCache) {
    const option = el('button', { type: 'button', class: 'template-option' });
    option.append(
      el('span', { class: 'template-option-name' }, [template.name]),
      el('span', { class: 'template-option-meta' }, [
        `${WORKBENCH_LABELS[template.workbench] || template.workbench || ''} · ${(template.steps || []).length} 步流水线`,
      ]),
    );
    option.addEventListener('click', () => {
      list.querySelectorAll('.template-option').forEach((node) => node.classList.remove('selected'));
      option.classList.add('selected');
      selectedId = template.id;
      confirmButton.disabled = false;
      confirmButton.textContent = `创建${template.name}任务`;
    });
    list.append(option);
  }

  confirmButton = el('button', { class: 'primary', disabled: true }, ['创建任务']);
  confirmButton.addEventListener('click', async () => {
    if (!selectedId) return;
    confirmButton.disabled = true;
    try {
      const task = await fetchJson('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, templateId: selectedId }),
      });
      window.location.href = `/task.html?id=${encodeURIComponent(task.id)}`;
    } catch (error) {
      alert(`创建失败: ${error.message}`);
      confirmButton.disabled = false;
    }
  });

  dialog.append(list, el('div', { class: 'row create-modal-footer' }, [
    confirmButton,
    el('span', { class: 'hint' }, ['创建后进入对应模板的工作台']),
  ]));
  backdrop.append(dialog);
  document.body.append(backdrop);
}

document.getElementById('create-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.getElementById('task-name').value.trim();
  if (!name) return;
  if (templatesCache.length === 0) {
    alert('模板列表尚未加载,请稍候重试');
    return;
  }
  openCreateModal(name);
});

// 过滤栏:输入/选日期只走缓存重渲染;清除按钮还原两个条件。
document.getElementById('task-filter-text').addEventListener('input', renderFilteredRows);
document.getElementById('task-filter-date').addEventListener('change', renderFilteredRows);
document.getElementById('task-filter-clear').addEventListener('click', () => {
  document.getElementById('task-filter-text').value = '';
  document.getElementById('task-filter-date').value = '';
  renderFilteredRows();
});

renderEnv();
renderTemplates().then(renderTasks).catch((error) => console.error(error));
