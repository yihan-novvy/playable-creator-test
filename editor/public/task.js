// Task workbench: config, per-step upload/run/preview, final phone-frame.
const STEP_DEFS = [
  { id: 'intro', name: '开场视频', slots: ['intro-video', 'intro-poster'] },
  { id: 'background', name: '背景图', slots: ['background'] }, // 紧跟开场视频:背景默认由海报计算
  { id: 'hud', name: 'HUD 立绘', slots: [] }, // custom source picker + cropper below
  { id: 'pattern', name: '珠子图案', slots: [] },
  { id: 'levels', name: '关卡打散', slots: [] },
  { id: 'pack', name: '打包', slots: [] },
];

const HUD_SIDE_DEFS = [
  { side: 'left', label: '左立绘' },
  { side: 'right', label: '右立绘' },
];

const SLOT_LABELS = {
  'intro-video': '片头视频 mp4',
  'intro-poster': '海报 jpg(可选,默认取首帧)',
  background: '背景图 png(可选,默认用海报计算)',
};

const taskId = new URLSearchParams(window.location.search).get('id');
let taskDoc = null;
let templateInfo = null;
let statusInfo = null;

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

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const failed = Array.isArray(body) ? body.find((step) => step.ok === false) : body;
    const detail = typeof failed?.error === 'string' ? failed.error : failed?.error?.message;
    throw new Error(detail || `${res.status} ${res.statusText}`);
  }
  return body;
}

// 拖拽上传:容器常驻虚线标记(.drop-zone),拖文件悬停时高亮,松手把首个文件
// 交给 onFile(与点击上传同一处理)。dragenter/leave 成对计数,避免扫过子元素时闪烁。
function wireDropZone(target, onFile) {
  target.classList.add('drop-zone');
  let depth = 0;
  target.addEventListener('dragenter', (event) => {
    if (!event.dataTransfer?.types?.includes('Files')) return;
    event.preventDefault();
    depth += 1;
    target.classList.add('drag-over');
  });
  target.addEventListener('dragover', (event) => event.preventDefault());
  target.addEventListener('dragleave', () => {
    depth = Math.max(0, depth - 1);
    if (!depth) target.classList.remove('drag-over');
  });
  target.addEventListener('drop', (event) => {
    event.preventDefault();
    depth = 0;
    target.classList.remove('drag-over');
    const file = event.dataTransfer?.files?.[0];
    if (file) onFile(file);
  });
}

function getConfig() {
  // effective config = template defaults merged with task config
  return deepMerge(templateInfo.defaults, taskDoc.config || {});
}

function deepMerge(base, over) {
  if (over === undefined || over === null) return structuredClone(base);
  if (typeof base !== 'object' || base === null || Array.isArray(base)) return structuredClone(over);
  const out = { ...base };
  for (const [key, value] of Object.entries(over)) out[key] = key in base ? deepMerge(base[key], value) : structuredClone(value);
  return out;
}

/* ------------------------------ config card ------------------------------ */

// 默认只展示两个 HUD 标题;其余配置日常无需调整,收进「高级设置」折叠区。
const CONFIG_FIELDS = [
  { path: 'hud.titleLine1', label: 'HUD 标题 第一行', type: 'text' },
  { path: 'hud.titleLine2', label: 'HUD 标题 第二行', type: 'text' },
  { path: 'hud.enabled', label: '启用 HUD 覆盖层', type: 'checkbox', advanced: true },
  { path: 'hud.ariaLabel', label: 'HUD aria-label', type: 'text', advanced: true },
  { path: 'intro.enabled', label: '启用片头视频', type: 'checkbox', advanced: true },
  { path: 'intro.ariaLabel', label: 'intro aria-label', type: 'text', advanced: true },
  { path: 'cta.enabled', label: '启用底部下载卡(CTA)', type: 'checkbox', advanced: true },
  { path: 'recolorPortraits', label: '对 HUD 立绘做金色重调色(可选)', type: 'checkbox', advanced: true },
  { path: 'patternSource', label: '珠子图案来源', type: 'select', advanced: true, options: [['right', '右立绘(hud-right)'], ['left', '左立绘(hud-left)'], ['upload', '独立上传图片']] },
  { path: 'background.blurSigma', label: '背景模糊 sigma(默认 12)', type: 'number', step: '0.5', advanced: true },
  { path: 'win.placements', label: '获胜次数:净正确放置 N 颗后触发跳转("complete"=图案完成/最后一步才跳转,数字=固定颗数,0=关闭)', type: 'text', advanced: true },
  { path: 'patternConfig.width', label: '图案宽(格)', type: 'number', advanced: true },
  { path: 'patternConfig.height', label: '图案高(格)', type: 'number', advanced: true },
  { path: 'patternConfig.brightnessThreshold', label: '图案亮度阈值', type: 'number', step: '0.05', advanced: true },
  { path: 'patternConfig.minCoverage', label: '格子最低覆盖率', type: 'number', step: '0.05', advanced: true },
  { path: 'patternConfig.pruneFloor', label: '稀有色修剪下限', type: 'number', advanced: true },
  { path: 'patternConfig.smoothingPasses', label: '平滑次数', type: 'number', advanced: true },
  { path: 'patternConfig.allowedTiles', label: '允许色号(all 或留空=全部 34 色;逗号分隔可收窄子集)', type: 'text', placeholder: 'all 或例: 2,25,26,27,28,31', advanced: true },
  { path: 'patternConfig.aiModel', label: 'AI 图案模型(留空=glm-5.3-flash)', type: 'text', placeholder: 'glm-5.3-flash / glm-5.3 / glm-5', advanced: true },
];

function getPath(obj, dotted) {
  return dotted.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function setPath(obj, dotted, value) {
  const keys = dotted.split('.');
  const last = keys.pop();
  let cursor = obj;
  for (const key of keys) {
    if (typeof cursor[key] !== 'object' || cursor[key] === null) cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[last] = value;
}

// 「高级设置」折叠状态:refresh 会重建配置区,存模块级变量避免展开被重置。
let advancedOpen = false;

function renderConfigItem(field) {
  const value = getPath(getConfig(), field.path);
  const item = el('label', { class: 'config-item' });
  if (field.type === 'checkbox') {
    const input = el('input', { type: 'checkbox', 'data-path': field.path });
    input.checked = value !== false;
    input.addEventListener('change', () => saveConfig(field.path, input.checked));
    item.append(el('span', {}, [field.label]), input);
  } else if (field.type === 'select') {
    const input = el('select', { 'data-path': field.path });
    for (const [val, label] of field.options) {
      const option = el('option', { value: val }, [label]);
      if (val === value) option.selected = true;
      input.append(option);
    }
    input.addEventListener('change', () => saveConfig(field.path, input.value));
    item.append(el('span', {}, [field.label]), input);
  } else {
    const input = el('input', { type: field.type, 'data-path': field.path });
    input.value = value ?? '';
    if (field.step) input.step = field.step;
    if (field.placeholder) input.placeholder = field.placeholder;
    input.addEventListener('change', () => {
      const next = field.type === 'number' ? Number(input.value) : input.value;
      saveConfig(field.path, next);
    });
    item.append(el('span', {}, [field.label]), input);
  }
  return item;
}

function renderConfig() {
  const grid = document.getElementById('config-grid');
  grid.textContent = '';
  for (const field of CONFIG_FIELDS.filter((field) => !field.advanced)) {
    grid.append(renderConfigItem(field));
  }

  const advancedWrap = el('div', { class: 'config-grid advanced-config' });
  advancedWrap.hidden = !advancedOpen;
  for (const field of CONFIG_FIELDS.filter((field) => field.advanced)) {
    advancedWrap.append(renderConfigItem(field));
  }
  const toggle = el('button', {
    class: 'advanced-toggle',
    onclick: () => {
      advancedOpen = !advancedOpen;
      advancedWrap.hidden = !advancedOpen;
      toggle.textContent = advancedOpen ? '收起高级设置 ▴' : '高级设置 ▾';
    },
  }, [advancedOpen ? '收起高级设置 ▴' : '高级设置 ▾']);
  grid.append(toggle, advancedWrap);
}

let saveTimer = null;
function saveConfig(path, value) {
  const patch = {};
  setPath(patch, path, value);
  fetchJson(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config: patch }),
  }).then((doc) => {
    taskDoc = doc;
  }).catch((error) => alert(`保存配置失败: ${error.message}`));
}

// 显式保存:收集界面上全部配置项,只把与当前生效值不同的字段 PATCH 上去
// (避免无谓触发 patternConfig 系的步骤失效)。输入框失焦时本就自动保存,
// 但「输入完直接 F5」不会触发 change,这个按钮兜底防丢。
async function saveAllConfig(button) {
  const patch = {};
  for (const field of CONFIG_FIELDS) {
    const input = document.querySelector(`#config-grid [data-path="${field.path}"]`);
    if (!input) continue;
    const value = field.type === 'checkbox' ? input.checked
      : field.type === 'number' ? Number(input.value)
      : input.value;
    if (value === getPath(getConfig(), field.path)) continue;
    setPath(patch, field.path, value);
  }
  const state = document.getElementById('config-save-state');
  button.disabled = true;
  try {
    if (Object.keys(patch).length > 0) {
      taskDoc = await fetchJson(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: patch }),
      });
    }
    state.textContent = Object.keys(patch).length > 0
      ? `已保存 ${new Date().toLocaleTimeString()}`
      : '无改动';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { state.textContent = ''; }, 3000);
  } catch (error) {
    alert(`保存配置失败: ${error.message}`);
  } finally {
    button.disabled = false;
  }
}
function pluginUi() {
  return templateInfo ? (window.PlayablePlugins || {})[templateInfo.id] || null : null;
}
document.getElementById('save-config').addEventListener('click', (event) => {
  const ui = pluginUi();
  if (ui?.saveAll) { Promise.resolve(ui.saveAll(event.target)).catch(error => alert(error.message)); return; }
  saveAllConfig(event.target);
});

/* ------------------------------- step cards ------------------------------ */

function stepState(stepId) {
  return statusInfo?.steps?.[stepId] || { ok: false, stale: false, metrics: null };
}

function renderSteps() {
  const container = document.getElementById('steps');
  container.textContent = '';
  for (const def of STEP_DEFS) {
    container.append(renderStepCard(def));
  }
}

// 有专用工作台的模板由 plugins/<id>/workbench.js 接管(PlayablePlugins 注册);
// 其余模板维持通用的配置卡 + 步骤卡分工。
function renderWorkbench(rerender) {
  const ui = pluginUi();
  if (ui?.render) { ui.render(); return; }
  if (rerender) {
    renderSteps();
  } else {
    // light refresh: update state chips + metrics + previews in place
    renderSteps();
    renderConfig();
  }
}

function renderStepCard(def) {
  const state = stepState(def.id);
  const card = el('section', { class: 'step-card', id: `step-${def.id}` });
  const stateClass = state.ok ? (state.stale ? 'stale' : 'ok') : (state.lastRunAt ? 'fail' : '');
  const stateText = state.ok ? (state.stale ? '成功 · 输入已更新,建议重跑' : '成功') : (state.lastRunAt ? '失败' : '未运行');
  card.append(el('h3', {}, [
    el('span', { class: 'step-num' }, [String((templateInfo?.steps || STEP_DEFS.map(d => d.id)).indexOf(def.id) + 1)]),
    def.name,
    el('span', { class: `step-state ${stateClass}` }, [stateText]),
  ]));

  const body = el('div', { class: 'step-body' });
  const left = el('div', {});
  const right = el('div', { class: 'preview-area' }, [el('span', { class: 'hint' }, ['运行后显示预览'])]);
  left.id = `step-${def.id}-left`;
  right.id = `step-${def.id}-preview`;

  if (def.id === 'hud') {
    renderHudControls(left);
  } else {
    for (const slot of def.slots) {
      left.append(renderUploadSlot(slot));
    }
  }
  if (def.id === 'pattern') {
    left.append(renderPatternCropControls());
    left.append(el('div', { class: 'hint' }, ['普通运行和人工筛选最多保留数量最多的 8 种颜色,其余颜色合并到最接近的保留色。']));
  }

  if (def.id === 'levels') {
    left.append(el('div', { class: 'hint' }, ['同色珠子聚成大块,随机排列位置。每种颜色数量保持不变,适合广告试玩。']));
  }

  const runButton = el('button', { class: 'primary', onclick: () => runStep(def.id) }, [state.ok ? '重新运行' : '运行']);
  runButton.id = `run-${def.id}`;
  const runRow = el('div', { class: 'row', style: 'margin-top:10px' }, [runButton]);
  if (def.id === 'pattern') {
    // AI 引擎:视觉 LLM 画掩膜,颜色仍从立绘精确采样。跑得慢(LLM 调用),按钮独立于重新运行。
    const aiButton = el('button', {
      title: '用视觉 LLM 从立绘生成珠子图案(需要服务端配置 ANTHROPIC_AUTH_TOKEN;颜色仍从立绘精确采样)',
      onclick: () => runStep(def.id, { engine: 'ai', button: aiButton }),
    }, ['AI创建']);
    aiButton.id = `run-${def.id}-ai`;
    runRow.append(aiButton);
    // 人工筛选:全图转珠子(无过滤),弹窗里手动擦掉不要的部分后保存为图案。
    const manualButton = el('button', {
      title: '把源图等比转成最多 8 色的珠子网格(长边 40),手动擦除背景只留主体',
      onclick: () => openPatternEditor(manualButton),
    }, ['人工筛选']);
    manualButton.id = `run-${def.id}-manual`;
    runRow.append(manualButton);
  }
  left.append(runRow);

  const metricsNode = el('div', { class: 'metrics', id: `metrics-${def.id}` }, [metricsSummary(def.id, state)]);
  left.append(metricsNode);

  const errorNode = el('div', { class: 'error-text', id: `error-${def.id}`, style: state.lastRunAt && !state.ok ? '' : 'display:none' }, [state.lastRunAt && !state.ok ? (state.error || '运行失败,请重试。') : '']);
  left.append(errorNode);

  body.append(left, right);
  card.append(body);
  renderStepPreview(def.id, right);
  return card;
}

function renderUploadSlot(slot) {
  const wrap = el('div', { class: 'upload-slot' });
  const meta = statusInfo?.uploads?.[slot];
  const isVideo = slot === 'intro-video';
  const acceptType = isVideo ? 'video/' : 'image/';
  // 原生 file input 太丑,隐藏掉,用与 HUD「上传图片」同款的按钮唤起。
  const input = el('input', { type: 'file', accept: isVideo ? 'video/mp4' : 'image/*', style: 'display:none' });
  input.addEventListener('change', () => uploadSlot(slot, input.files[0]));
  const pickButton = el('button', { onclick: () => input.click() }, ['上传文件']);
  wrap.append(el('span', { class: 'slot-name' }, [SLOT_LABELS[slot] || slot]), pickButton, input);
  const label = meta?.present
    ? `${(meta.bytes / 1024).toFixed(0)} KB${meta.meta?.originalName ? ` · ${meta.meta.originalName}` : ''}`
    : '未上传 · 可拖入文件';
  wrap.append(el('span', { class: `slot-state ${meta?.present ? '' : 'error-text'}` }, [label]));
  wireDropZone(wrap, (file) => {
    if (!file.type.startsWith(acceptType)) {
      alert(`请拖入${isVideo ? ' mp4 视频' : '图片'}文件`);
      return;
    }
    uploadSlot(slot, file);
  });
  return wrap;
}

async function uploadSlot(slot, file) {
  if (!file) return;
  try {
    await fetch(`/api/tasks/${taskId}/uploads/${slot}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream', 'x-novvy-original-name': encodeURIComponent(file.name) },
      body: file,
    });
    await refresh(false);
  } catch (error) {
    alert(`上传失败: ${error.message}`);
  }
}

function metricsSummary(stepId, state) {
  if (!state.ok || !state.metrics) return '尚未成功运行。';
  const m = state.metrics;
  const lines = [];
  const fmt = (value) => (typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(3)) : value);
  const flatten = (obj, prefix = '') => {
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, `${prefix}${key}.`);
      else lines.push(`${prefix}${key}: ${fmt(value)}`);
    }
  };
  flatten(m);
  return lines.join('\n');
}

async function runStep(stepId, { engine, button } = {}) {
  const target = button || document.getElementById(`run-${stepId}`);
  if (target) {
    target.disabled = true;
    target.textContent = engine === 'ai' ? 'AI 创建中…(可能需要几分钟)' : '运行中…';
  }
  try {
    await fetchJson(`/api/tasks/${taskId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: stepId, ...(engine ? { engine } : {}) }),
    });
  } catch (error) {
    alert(`运行失败: ${error.message}`);
  }
  await refresh(true);
}

document.getElementById('run-all').addEventListener('click', async (event) => {
  event.target.disabled = true;
  try {
    const ui = pluginUi();
    if (ui?.saveAll) await ui.saveAll();
    await fetchJson(`/api/tasks/${taskId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 'all' }),
    });
  } catch (error) {
    alert(`运行失败: ${error.message}`);
  }
  event.target.disabled = false;
  await refresh(true);
});

/* --------------------- HUD portrait sources + cropper -------------------- */

// Flow per side: ① pick a source (poster / upload) → the FULL image is the
// portrait; ② optionally crop (modal); ③ 重新运行 applies. The crop is just
// config until the hud step runs.
function hudBadge(side) {
  const config = getConfig();
  const source = config.hudImageSource?.[side];
  const crop = config.hudCrop?.[side];
  const cropped = !!(crop && Number(crop.width) > 0 && Number(crop.height) > 0);
  if (source === 'poster') return cropped ? ['poster-crop', '来源:海报 · 已裁剪'] : ['poster-crop', '来源:海报 · 完整图'];
  if (source === 'upload') return cropped ? ['poster-crop', '来源:上传图片 · 已裁剪'] : ['upload', '来源:上传图片 · 完整图'];
  return ['none', '来源:未设置'];
}

function renderHudControls(left) {
  const config = getConfig();
  const posterReady = statusInfo?.steps?.intro?.ok === true;
  for (const { side, label } of HUD_SIDE_DEFS) {
    const [badgeClass, badgeText] = hudBadge(side);
    const source = config.hudImageSource?.[side];
    const crop = config.hudCrop?.[side];
    const cropped = !!(crop && Number(crop.width) > 0 && Number(crop.height) > 0);
    const card = el('div', { class: 'portrait-source' });

    const head = el('div', { class: 'row', style: 'justify-content:space-between' });
    head.append(el('span', { class: 'slot-name' }, [label]));
    head.append(el('span', { class: `source-badge ${badgeClass}` }, [badgeText]));
    card.append(head);

    const actions = el('div', { class: 'row', style: 'margin:8px 0' });
    const posterButton = el('button', {
      class: source ? '' : 'primary',
      onclick: () => choosePosterSource(side),
    }, ['从海报获取']);
    posterButton.disabled = !posterReady;
    posterButton.title = posterReady ? '' : '先运行「开场视频」生成海报';
    actions.append(posterButton);
    actions.append(el('button', {
      onclick: () => pickSourceImage(side),
    }, ['上传图片']));
    const cropButton = el('button', {
      onclick: () => openCropModal(side, label),
    }, [cropped ? '重新裁剪…' : '裁剪…']);
    cropButton.disabled = !source;
    cropButton.title = source ? '' : '先选择来源(从海报获取或上传图片)';
    actions.append(cropButton);
    if (cropped) {
      actions.append(el('button', { onclick: () => clearCrop(side) }, ['恢复完整图']));
    }
    card.append(actions);
    if (!source) {
      card.append(el('div', { class: 'hint' }, ['先「从海报获取」(免上传)、「上传图片」或直接拖入图片;完整图片默认直接作为立绘。']));
    } else {
      card.append(el('div', { class: 'hint' }, [cropped ? '已设定裁剪区域,点「重新运行」生效。' : '当前使用完整图片;如需裁剪点「裁剪…」。也可直接拖入新图替换。']));
    }
    wireDropZone(card, (file) => {
      if (!file.type.startsWith('image/')) {
        alert('请拖入图片文件');
        return;
      }
      uploadPortraitSource(side, file);
    });
    left.append(card);
  }
}

// Per-side config helpers: PATCH payloads must carry the FULL map because the
// server replaces whitelisted top-level config keys verbatim.
async function patchHudPortraitConfig(patchBuilder) {
  const config = getConfig();
  const { imageSource, crop } = patchBuilder({
    imageSource: config.hudImageSource || {},
    crop: config.hudCrop || {},
  });
  taskDoc = await fetchJson(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config: { hudImageSource: imageSource, hudCrop: crop } }),
  });
  await refresh(true);
}

function choosePosterSource(side) {
  patchHudPortraitConfig(({ imageSource, crop }) => ({
    imageSource: { ...imageSource, [side]: 'poster' },
    crop: { ...crop, [side]: null },
  })).catch((error) => alert(`设置来源失败: ${error.message}`));
}

/* ------------------------- pattern framing crop -------------------------- */

// 图案独立裁剪:默认整图;只影响珠子图案,HUD 头像的裁剪完全不受影响。
async function patchPatternCrop(crop) {
  taskDoc = await fetchJson(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config: { patternCrop: crop } }),
  });
  await refresh(true);
}

function renderPatternCropControls() {
  const config = getConfig();
  const side = config.patternSource === 'upload' ? 'upload' : config.patternSource === 'left' ? 'left' : 'right';
  const label = side === 'upload' ? '上传图片' : side === 'left' ? '左立绘' : '右立绘';
  const crop = config.patternCrop?.[side];
  const cropped = !!(crop && Number(crop.width) > 0 && Number(crop.height) > 0);
  const card = el('div', { class: 'portrait-source' });
  const head = el('div', { class: 'row', style: 'justify-content:space-between' });
  head.append(el('span', { class: 'slot-name' }, ['图案构图']));
  head.append(el('span', { class: `source-badge ${cropped ? 'poster-crop' : 'upload'}` },
    [cropped ? `已裁剪 ${Math.round(crop.width)}×${Math.round(crop.height)}` : `来源:${label} · 完整图`]));
  card.append(head);
  const actions = el('div', { class: 'row', style: 'margin:8px 0' });
  actions.append(el('button', {
    onclick: () => openCropModal(side, `珠子图案 · ${label}`, 'pattern'),
    ...(side === 'upload' && !statusInfo?.uploads?.['pattern-source']?.present ? { disabled: '' } : {}),
  }, [cropped ? '重新裁剪…' : '裁剪…']));
  if (cropped) {
    actions.append(el('button', {
      onclick: () => patchPatternCrop({ ...(config.patternCrop || {}), [side]: null })
        .catch((error) => alert(`恢复完整图失败: ${error.message}`)),
    }, ['恢复完整图']));
  }
  actions.prepend(el('button', { onclick: pickPatternImage }, ['上传图片']));
  if (statusInfo?.uploads?.['pattern-source']?.present) {
    actions.append(el('button', { onclick: async () => {
      try {
        await fetchJson(`/api/tasks/${taskId}/uploads/pattern-source`, { method: 'DELETE' });
        await refresh(true);
      } catch (error) { alert(`移除失败: ${error.message}`); }
    } }, ['移除上传图']));
  }
  card.append(actions);
  if (side === 'upload' && statusInfo?.uploads?.['pattern-source']?.present) {
    card.append(el('img', { src: versioned(`/project/${taskId}/uploads/pattern-source.png`, uploadVersion('pattern-source')), alt: '珠子图案源图', style: 'max-width:100%;max-height:160px;object-fit:contain' }));
  }
  card.append(el('div', { class: 'hint' }, [cropped
    ? '已保存裁剪区域,可继续运行、AI创建或人工筛选。也可拖入新图替换。'
    : '可独立上传或拖入 PNG/JPG 图片,裁剪后再运行、AI创建或人工筛选;未上传时使用所选立绘。']));
  wireDropZone(card, (file) => {
    if (!file.type.startsWith('image/')) {
      alert('请拖入图片文件');
      return;
    }
    uploadPatternSource(file);
  });
  return card;
}

// Upload a standalone pattern source image, then open the crop modal.
// Shared by the 上传图片 button and file drops.
async function uploadPatternSource(file) {
  try {
    await fetchJson(`/api/tasks/${taskId}/uploads/pattern-source`, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream', 'x-novvy-original-name': encodeURIComponent(file.name) },
      body: file,
    });
    await refresh(true);
    openCropModal('upload', '上传图片', 'pattern');
  } catch (error) { alert(`上传失败: ${error.message}`); }
}

function pickPatternImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg';
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    uploadPatternSource(file);
  });
  input.click();
}

function clearCrop(side) {
  patchHudPortraitConfig(({ imageSource, crop }) => ({
    imageSource: { ...imageSource },
    crop: { ...crop, [side]: null },
  })).catch((error) => alert(`恢复完整图失败: ${error.message}`));
}

// Upload a local image as this side's source; the server marks the source as
// 'upload' and clears any crop. Shared by the 上传图片 button and file drops.
async function uploadPortraitSource(side, file) {
  try {
    await fetch(`/api/tasks/${taskId}/uploads/portrait-src-${side}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream', 'x-novvy-original-name': encodeURIComponent(file.name) },
      body: file,
    });
    await refresh(true);
  } catch (error) {
    alert(`上传失败: ${error.message}`);
  }
}

function pickSourceImage(side) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg';
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    uploadPortraitSource(side, file);
  });
  input.click();
}

function openCropModal(side, label, kind = 'hud') {
  const config = getConfig();
  const source = config.hudImageSource?.[side] || 'poster';
  const fullUploadReady = statusInfo?.uploads?.[`portrait-src-${side}`]?.present === true;
  let sourceUrl;
  let title;
  if (kind === 'pattern') {
    // 图案裁剪作用在完整立绘上(与 runner 的裁剪输入同一张图,坐标一一对应)。
    sourceUrl = side === 'upload'
      ? versioned(`/project/${taskId}/uploads/pattern-source.png`, uploadVersion('pattern-source'))
      : fullUploadReady
      ? versioned(`/project/${taskId}/uploads/portrait-src-${side}.png`, uploadVersion(`portrait-src-${side}`))
      : versioned(`/project/${taskId}/generated/hud-${side}.webp`, stepVersion('hud'));
    title = `裁剪图案构图 · ${label}`;
  } else {
    sourceUrl = source === 'upload'
      ? versioned(`/project/${taskId}/uploads/portrait-src-${side}.png`, uploadVersion(`portrait-src-${side}`))
      : versioned(`/project/${taskId}/generated/poster.webp`, stepVersion('intro'));
    title = source === 'upload' ? `裁剪上传图片 · ${label}` : `裁剪海报 · ${label}`;
  }
  // One modal at a time.
  document.querySelectorAll('.modal-backdrop').forEach((node) => node.remove());

  const backdrop = el('div', { class: 'modal-backdrop' });
  const dialog = el('div', { class: 'modal-dialog' });
  const header = el('div', { class: 'modal-header' }, []);
  header.append(el('h3', {}, [title]));
  const closeBtn = el('button', { class: 'modal-close', title: '关闭' }, ['×']);
  header.append(closeBtn);
  dialog.append(header);

  const stage = el('div', { class: 'crop-stage' });
  const img = el('img', { src: sourceUrl, draggable: 'false', alt: '源图' });
  const sel = el('div', { class: 'crop-selection', hidden: '' });
  for (const corner of ['nw', 'ne', 'sw', 'se']) {
    sel.append(el('div', { class: `crop-handle ${corner}`, 'data-handle': corner }));
  }
  stage.append(img, sel);
  dialog.append(stage);

  const toolbar = el('div', { class: 'crop-toolbar' });
  const preview = el('div', { class: 'crop-preview', title: '头像圆形预览' });
  const applyBtn = el('button', { class: 'primary', disabled: '' }, ['应用裁剪']);
  const resetBtn = el('button', {}, ['重置选区']);
  toolbar.append(
    preview,
    applyBtn,
    resetBtn,
    el('span', { class: 'hint' }, ['空白处拖动画新框 · 框内拖动移动 · 角点缩放']),
  );
  dialog.append(toolbar);
  backdrop.append(dialog);
  document.body.append(backdrop);

  let scale = 1; // display px per natural px
  let drag = null;
  let rect = null;

  const close = () => {
    document.removeEventListener('keydown', onKeydown);
    backdrop.remove();
  };
  const onKeydown = (event) => {
    if (event.key === 'Escape') close();
  };

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('pointerdown', (event) => {
    if (event.target === backdrop) close();
  });
  document.addEventListener('keydown', onKeydown);

  const clampRect = (candidate) => {
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const width = Math.max(8, Math.min(candidate.width, naturalWidth));
    const height = Math.max(8, Math.min(candidate.height, naturalHeight));
    return {
      x: Math.max(0, Math.min(candidate.x, naturalWidth - width)),
      y: Math.max(0, Math.min(candidate.y, naturalHeight - height)),
      width,
      height,
    };
  };

  const layout = () => {
    if (!rect || !img.naturalWidth) return;
    scale = img.clientWidth / img.naturalWidth;
    sel.hidden = false;
    sel.style.left = `${rect.x * scale}px`;
    sel.style.top = `${rect.y * scale}px`;
    sel.style.width = `${rect.width * scale}px`;
    sel.style.height = `${rect.height * scale}px`;
    // Circle preview mimicking the HUD avatar's object-fit: cover.
    const zoom = 96 / (kind === 'pattern' ? Math.max(rect.width, rect.height) : Math.min(rect.width, rect.height));
    if (kind === 'pattern') {
      preview.title = '图案裁剪预览';
      preview.style.borderRadius = '0';
      preview.style.width = `${rect.width * zoom}px`;
      preview.style.height = `${rect.height * zoom}px`;
    }
    preview.style.backgroundImage = `url("${sourceUrl}")`;
    preview.style.backgroundSize = `${img.naturalWidth * zoom}px ${img.naturalHeight * zoom}px`;
    preview.style.backgroundPosition =
      kind === 'pattern' ? `${-rect.x * zoom}px ${-rect.y * zoom}px`
        : `${48 - (rect.x + rect.width / 2) * zoom}px ${48 - (rect.y + rect.height / 2) * zoom}px`;
    applyBtn.disabled = false;
  };

  img.addEventListener('load', () => {
    if (!rect) {
      const saved = kind === 'pattern' ? getConfig().patternCrop?.[side] : getConfig().hudCrop?.[side];
      if (saved?.width) {
        rect = clampRect(saved);
      } else {
        const size = Math.min(img.naturalWidth, img.naturalHeight) * 0.55;
        rect = clampRect({
          x: (img.naturalWidth - size) / 2,
          y: (img.naturalHeight - size) / 2,
          width: size,
          height: size,
        });
      }
    }
    layout();
  });

  stage.addEventListener('pointerdown', (event) => {
    if (!rect) return;
    const bounds = stage.getBoundingClientRect();
    const px = (event.clientX - bounds.left) / scale;
    const py = (event.clientY - bounds.top) / scale;
    const handle = event.target?.dataset?.handle;
    stage.setPointerCapture(event.pointerId);
    if (handle) {
      drag = { kind: 'resize', handle, origin: { ...rect } };
    } else if (px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height) {
      drag = { kind: 'move', grabX: px - rect.x, grabY: py - rect.y };
    } else {
      drag = { kind: 'draw', anchorX: px, anchorY: py };
      rect = { x: px, y: py, width: 1, height: 1 };
    }
    event.preventDefault();
  });
  stage.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const bounds = stage.getBoundingClientRect();
    const px = (event.clientX - bounds.left) / scale;
    const py = (event.clientY - bounds.top) / scale;
    const next = { ...rect };
    if (drag.kind === 'move') {
      next.x = px - drag.grabX;
      next.y = py - drag.grabY;
    } else if (drag.kind === 'draw') {
      next.x = Math.min(drag.anchorX, px);
      next.y = Math.min(drag.anchorY, py);
      next.width = Math.abs(px - drag.anchorX);
      next.height = Math.abs(py - drag.anchorY);
    } else {
      const { handle, origin } = drag;
      if (handle.includes('e')) {
        next.width = Math.max(8, px - origin.x);
      } else {
        next.width = Math.max(8, origin.x + origin.width - px);
        next.x = origin.x + origin.width - next.width;
      }
      if (handle.includes('s')) {
        next.height = Math.max(8, py - origin.y);
      } else {
        next.height = Math.max(8, origin.y + origin.height - py);
        next.y = origin.y + origin.height - next.height;
      }
    }
    rect = clampRect(next);
    layout();
  });
  stage.addEventListener('pointerup', () => { drag = null; });
  stage.addEventListener('pointercancel', () => { drag = null; });

  resetBtn.addEventListener('click', () => {
    rect = null;
    sel.hidden = true;
    applyBtn.disabled = true;
    preview.style.backgroundImage = 'none';
  });

  applyBtn.addEventListener('click', async () => {
    if (!rect) return;
    applyBtn.disabled = true;
    try {
      // Confirming only records the crop region; 重新运行/AI创建 (the hud or
      // pattern step) materializes it.
      if (kind === 'pattern') {
        await patchPatternCrop({
          ...(getConfig().patternCrop || {}),
          [side]: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        });
      } else {
        await patchHudPortraitConfig(({ imageSource, crop }) => ({
          imageSource: { ...imageSource },
          crop: { ...crop, [side]: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) } },
        }));
      }
      close();
    } catch (error) {
      alert(`保存裁剪失败: ${error.message}`);
      applyBtn.disabled = false;
    }
  });
}

/* ----------------- 人工筛选(manual pattern editor) ---------------------- */

// 全图转珠子 + 手动擦除:服务端把源图完整转成网格(无过滤),这里提供
// 擦除工具;保存时服务端把结果编码成标准 pattern.json 并标记 pattern 完成。
async function openPatternEditor(button) {
  if (button) { button.disabled = true; button.textContent = '生成中…'; }
  let data;
  try {
    data = await fetchJson(`/api/tasks/${taskId}/pattern/raw`, { method: 'POST' });
  } catch (error) {
    alert(`生成全图图案失败: ${error.message}`);
    return;
  } finally {
    if (button) { button.disabled = false; button.textContent = '人工筛选'; }
  }

  document.querySelectorAll('.modal-backdrop').forEach((node) => node.remove());
  const { width, height } = data;
  const palette = templateInfo?.palette || {};
  const colorOf = (tile) => {
    const rgb = palette[String(tile)]?.rgb;
    return rgb ? `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` : 'rgb(128,128,128)';
  };
  const raw = data.raw.map((row) => row.slice());
  let grid = (data.edit || data.raw).map((row) => row.slice());
  let dirty = false;
  const undoStack = [];
  const redoStack = [];

  // ---- 弹窗骨架(与裁剪弹窗同一套 modal 样式) ----
  const backdrop = el('div', { class: 'modal-backdrop' });
  const dialog = el('div', { class: 'modal-dialog pattern-dialog' });
  const closeBtn = el('button', { class: 'modal-close', title: '关闭' }, ['×']);
  dialog.append(el('div', { class: 'modal-header' }, [el('h3', {}, [`人工筛选 · ${width}×${height} · 最多 8 色`]), closeBtn]));

  // ---- 工具栏 ----
  let tool = 'erase';
  let brush = 1; // 半径:1 → 1×1,2 → 3×3,3 → 5×5
  const toolButtons = {};
  const toolGroup = el('div', { class: 'row pattern-tool-group' });
  for (const [id, label] of [['erase', '擦除'], ['restore', '恢复'], ['rect', '矩形擦除'], ['magic', '魔棒'], ['color', '按色删']]) {
    const btn = el('button', { class: 'pattern-tool', onclick: () => setTool(id) }, [label]);
    toolButtons[id] = btn;
    toolGroup.append(btn);
  }
  const brushButtons = {};
  const brushGroup = el('div', { class: 'row pattern-tool-group' });
  for (const size of [1, 2, 3]) {
    const label = `${size * 2 - 1}×${size * 2 - 1}`;
    const btn = el('button', { class: 'pattern-tool', title: '笔刷大小(擦除/恢复)', onclick: () => setBrush(size) }, [label]);
    brushButtons[size] = btn;
    brushGroup.append(btn);
  }
  function setTool(id) {
    tool = id;
    for (const [key, btn] of Object.entries(toolButtons)) btn.classList.toggle('active', key === id);
  }
  function setBrush(size) {
    brush = size;
    for (const [key, btn] of Object.entries(brushButtons)) btn.classList.toggle('active', Number(key) === size);
  }
  const actionGroup = el('div', { class: 'row pattern-tool-group' });
  actionGroup.append(
    el('button', { title: '只保留最大 4 连通色块,其余全部擦除', onclick: keepLargestComponent }, ['只留最大连通块']),
    el('button', { onclick: doUndo }, ['撤销']),
    el('button', { onclick: doRedo }, ['重做']),
    el('button', { title: '恢复为全图原始图案', onclick: resetGrid }, ['重置']),
  );

  // ---- 画布 ----
  const stage = el('div', { class: 'pattern-stage' });
  const canvas = document.createElement('canvas');
  canvas.className = 'pattern-canvas';
  canvas.width = width;
  canvas.height = height;
  const cellPx = Math.max(6, Math.floor(Math.min(560 / width, (window.innerHeight * 0.55) / height)));
  canvas.style.width = `${cellPx * width}px`;
  canvas.style.height = `${cellPx * height}px`;
  const gridlines = el('div', { class: 'pattern-gridlines' });
  gridlines.style.setProperty('--cell', `${cellPx}px`);
  const selection = el('div', { class: 'pattern-selection' });
  selection.hidden = true;
  const stageInner = el('div', { class: 'pattern-stage-inner' });
  stageInner.append(canvas, gridlines, selection);
  stage.append(stageInner);

  // ---- 状态条 + 保存 ----
  const statusText = el('span', { class: 'hint' });
  const chipsWrap = el('div', { class: 'pattern-chips' });
  const saveBtn = el('button', { class: 'primary', onclick: savePattern }, ['保存图案']);
  const footer = el('div', { class: 'pattern-footer' }, [statusText, chipsWrap, saveBtn]);
  dialog.append(el('div', { class: 'pattern-toolbar' }, [toolGroup, brushGroup, actionGroup]), stage, footer);
  backdrop.append(dialog);
  document.body.append(backdrop);

  const onKey = (event) => { if (event.key === 'Escape') requestClose(); };
  document.addEventListener('keydown', onKey);
  backdrop.addEventListener('pointerdown', (event) => { if (event.target === backdrop) requestClose(); });
  closeBtn.addEventListener('click', requestClose);
  function close() {
    document.removeEventListener('keydown', onKey);
    backdrop.remove();
  }
  function requestClose() {
    if (dirty && !window.confirm('当前擦除尚未保存,确定关闭?')) return;
    close();
  }

  // ---- 网格操作(全部先快照进撤销栈) ----
  function snapshot() {
    undoStack.push(grid.map((row) => row.slice()));
    if (undoStack.length > 100) undoStack.shift();
    redoStack.length = 0;
  }
  function doUndo() {
    if (!undoStack.length) return;
    redoStack.push(grid.map((row) => row.slice()));
    grid = undoStack.pop();
    render();
  }
  function doRedo() {
    if (!redoStack.length) return;
    undoStack.push(grid.map((row) => row.slice()));
    grid = redoStack.pop();
    render();
  }
  function resetGrid() {
    snapshot();
    grid = raw.map((row) => row.slice());
    dirty = true;
    render();
  }
  function setCells(cells, value) {
    let changed = false;
    for (const [x, y] of cells) {
      const next = value === -1 ? raw[y][x] : value; // -1 = 恢复为原始颜色
      if (grid[y][x] !== next) {
        grid[y][x] = next;
        changed = true;
      }
    }
    if (changed) {
      dirty = true;
      render();
    }
  }
  function eraseCells(cells) { snapshot(); setCells(cells, 0); }
  function magicErase([cx, cy]) {
    const target = grid[cy][cx];
    if (!target) return;
    const cells = [];
    const seen = new Set([cy * width + cx]);
    const stack = [[cx, cy]];
    while (stack.length) {
      const [x, y] = stack.pop();
      cells.push([x, y]);
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        const key = ny * width + nx;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height && !seen.has(key) && grid[ny][nx] === target) {
          seen.add(key);
          stack.push([nx, ny]);
        }
      }
    }
    eraseCells(cells);
  }
  function eraseColor(target) {
    if (!target) return;
    const cells = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (grid[y][x] === target) cells.push([x, y]);
      }
    }
    eraseCells(cells);
  }
  function keepLargestComponent() {
    const seen = new Set();
    let best = null;
    for (let y0 = 0; y0 < height; y0 += 1) {
      for (let x0 = 0; x0 < width; x0 += 1) {
        if (!grid[y0][x0] || seen.has(y0 * width + x0)) continue;
        const cells = [];
        const stack = [[x0, y0]];
        seen.add(y0 * width + x0);
        while (stack.length) {
          const [x, y] = stack.pop();
          cells.push([x, y]);
          for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
            const key = ny * width + nx;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny][nx] && !seen.has(key)) {
              seen.add(key);
              stack.push([nx, ny]);
            }
          }
        }
        if (!best || cells.length > best.length) best = cells;
      }
    }
    if (!best) return;
    const keep = new Set(best.map(([x, y]) => y * width + x));
    const cells = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (grid[y][x] && !keep.has(y * width + x)) cells.push([x, y]);
      }
    }
    eraseCells(cells);
  }

  // ---- 指针交互 ----
  let painting = false;
  let strokeSnapshotDone = false;
  let dragStart = null; // 矩形工具:锚点(stageInner 显示像素)
  function cellFromEvent(event) {
    const bounds = canvas.getBoundingClientRect();
    const cx = Math.floor(((event.clientX - bounds.left) / bounds.width) * width);
    const cy = Math.floor(((event.clientY - bounds.top) / bounds.height) * height);
    return [Math.min(width - 1, Math.max(0, cx)), Math.min(height - 1, Math.max(0, cy))];
  }
  function brushCells([cx, cy]) {
    const cells = [];
    for (let dy = -(brush - 1); dy <= brush - 1; dy += 1) {
      for (let dx = -(brush - 1); dx <= brush - 1; dx += 1) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < width && y >= 0 && y < height) cells.push([x, y]);
      }
    }
    return cells;
  }
  function paintStroke(cell) {
    // 一笔只快照一次,拖动过程连续上色。
    if (!strokeSnapshotDone) {
      snapshot();
      strokeSnapshotDone = true;
    }
    setCells(brushCells(cell), tool === 'restore' ? -1 : 0);
  }
  function updateSelection(event) {
    const bounds = stageInner.getBoundingClientRect();
    const x = Math.min(dragStart.x, event.clientX - bounds.left);
    const y = Math.min(dragStart.y, event.clientY - bounds.top);
    const w = Math.abs(event.clientX - bounds.left - dragStart.x);
    const h = Math.abs(event.clientY - bounds.top - dragStart.y);
    selection.style.left = `${x}px`;
    selection.style.top = `${y}px`;
    selection.style.width = `${w}px`;
    selection.style.height = `${h}px`;
  }
  function applyRectSelection() {
    if (selection.hidden || !selection.style.width) return;
    const cb = canvas.getBoundingClientRect();
    const sb = selection.getBoundingClientRect();
    const x0 = Math.max(0, Math.floor(((sb.left - cb.left) / cb.width) * width));
    const y0 = Math.max(0, Math.floor(((sb.top - cb.top) / cb.height) * height));
    const x1 = Math.min(width, Math.ceil(((sb.right - cb.left) / cb.width) * width));
    const y1 = Math.min(height, Math.ceil(((sb.bottom - cb.top) / cb.height) * height));
    const cells = [];
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) cells.push([x, y]);
    }
    if (cells.length) eraseCells(cells);
  }
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    // 合成事件(自动化测试)没有活动指针,setPointerCapture 会抛 NotFoundError。
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // 无活动指针时无需捕获,继续处理本次按下。
    }
    const cell = cellFromEvent(event);
    if (tool === 'erase' || tool === 'restore') {
      painting = true;
      strokeSnapshotDone = false;
      paintStroke(cell);
    } else if (tool === 'magic') {
      magicErase(cell);
    } else if (tool === 'color') {
      eraseColor(grid[cell[1]][cell[0]]);
    } else if (tool === 'rect') {
      const bounds = stageInner.getBoundingClientRect();
      dragStart = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      selection.hidden = false;
      updateSelection(event);
    }
  });
  canvas.addEventListener('pointermove', (event) => {
    if (painting) paintStroke(cellFromEvent(event));
    else if (dragStart) updateSelection(event);
  });
  const endPointer = () => {
    painting = false;
    if (dragStart) {
      applyRectSelection();
      dragStart = null;
      selection.hidden = true;
    }
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  // ---- 渲染 ----
  function render() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const tile = grid[y][x];
        if (!tile) continue;
        ctx.fillStyle = colorOf(tile);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    const counts = new Map();
    let filled = 0;
    for (const row of grid) {
      for (const tile of row) {
        if (!tile) continue;
        filled += 1;
        counts.set(tile, (counts.get(tile) || 0) + 1);
      }
    }
    statusText.textContent = `剩余 ${filled} / ${width * height} 格 · ${counts.size} 色`;
    if (filled > 0) {
      // 最大单色占比过高时,后续 LPCS 打乱可能找不到合规解(levels 会报错)。
      const dominant = Math.max(...counts.values()) / filled;
      statusText.textContent += ` · 最大色 ${Math.round(dominant * 100)}%`;
      if (dominant > 0.55) statusText.textContent += '(偏高,建议多擦掉该色或保留更多杂色,否则关卡可能无法打乱)';
    }
    chipsWrap.textContent = '';
    for (const [tile, count] of [...counts.entries()].sort((left, right) => right[1] - left[1])) {
      const chip = el('button', { class: 'pattern-color-chip', title: '点击删除该颜色全部格子' }, [
        el('span', { class: 'color-swatch', style: `background:${colorOf(tile)}` }),
        `×${count}`,
      ]);
      chip.addEventListener('click', () => eraseColor(tile));
      chipsWrap.append(chip);
    }
  }
  function renderPreviewDataUrl() {
    const cell = 12;
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = width * cell;
    previewCanvas.height = height * cell;
    const pctx = previewCanvas.getContext('2d');
    pctx.fillStyle = 'rgb(18, 18, 22)';
    pctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const tile = grid[y][x];
        if (!tile) continue;
        pctx.fillStyle = colorOf(tile);
        pctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
      }
    }
    return previewCanvas.toDataURL('image/png');
  }
  async function savePattern() {
    saveBtn.disabled = true;
    try {
      await fetchJson(`/api/tasks/${taskId}/pattern/manual`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tiles: grid, preview: renderPreviewDataUrl() }),
      });
      dirty = false;
      close();
      await refresh(true);
    } catch (error) {
      alert(`保存失败: ${error.message}`);
      saveBtn.disabled = false;
    }
  }

  setTool('erase');
  setBrush(1);
  render();
}

/* ------------------------------- previews -------------------------------- */

// 模板覆盖层 CSS 由服务端只读透传(非拷贝),模板更新预览自动跟随。
function ensureTemplateStylesheet(templateId) {
  if (!templateId) return;
  const href = `/plugins/${encodeURIComponent(templateId)}/overlays/hud/hud.css`;
  if (!document.querySelector(`link[data-novvy-template-css="${href}"]`)) {
    document.head.append(el('link', { rel: 'stylesheet', 'data-novvy-template-css': href, href }));
  }
}

// HUD 立绘预览:复刻打包产物的 hud.html DOM,直接套模板 hud.css,放进 9:16
// 手机框并用生成的背景图打底——所见即最终游戏顶部的 HUD 效果。
function renderHudPreview() {
  const config = getConfig();
  ensureTemplateStylesheet(templateInfo?.id);
  const stage = el('div', { class: 'hud-preview' });
  // 背景打底:优先背景图,退化到海报,都没有就用暗色渐变(stage 自带)。
  const bg = el('img', { class: 'hud-preview-bg', alt: '', src: versioned(`/project/${taskId}/generated/background.webp`, stepVersion('background')) });
  bg.addEventListener('error', () => {
    bg.src = versioned(`/project/${taskId}/generated/poster.webp`, stepVersion('intro'));
    bg.addEventListener('error', () => bg.remove(), { once: true });
  }, { once: true });
  const hud = el('div', { id: 'novvy-training-hud', 'aria-label': config.hud.ariaLabel || '' });
  hud.innerHTML = `
    <div class="novvy-hud-title"><div>${escapeHtml(config.hud.titleLine1 ?? '')}</div><div>${escapeHtml(config.hud.titleLine2 ?? '')}</div></div>
    <img class="novvy-hud-dragon novvy-hud-dragon-left" src="${versioned(`/project/${taskId}/generated/hud-left.webp`, stepVersion('hud'))}" alt="">
    <img class="novvy-hud-dragon novvy-hud-dragon-right" src="${versioned(`/project/${taskId}/generated/hud-right.webp`, stepVersion('hud'))}" alt="">
    <div class="novvy-hud-progress-wrap">
      <div class="novvy-hud-progress-track"><div id="novvy-hud-progress-fill"></div><div class="novvy-hud-progress-shine"></div></div>
      <div id="novvy-hud-progress-label">10%</div>
    </div>`;
  stage.append(bg, hud);
  return stage;
}

// Generated/uploaded files keep the same URL across runs, so preview tags
// must carry a version or the browser serves the stale cached image after a
// re-run (reported: crop applied but the avatar did not change until F5).
function versioned(url, version) {
  if (!version) return url;
  return `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`;
}

function stepVersion(stepId) {
  return statusInfo?.steps?.[stepId]?.lastRunAt || '';
}

function uploadVersion(slot) {
  return statusInfo?.uploads?.[slot]?.meta?.uploadedAt || '';
}

function renderStepPreview(stepId, container) {
  const state = stepState(stepId);
  container.textContent = '';
  if (!state.ok) {
    container.append(el('span', { class: 'hint' }, ['运行后显示预览']));
    return;
  }
  if (stepId === 'intro') {
    const video = el('video', { controls: '', src: versioned(`/project/${taskId}/uploads/intro-video.mp4`, uploadVersion('intro-video')), style: 'max-height:300px' });
    container.append(video);
    container.append(el('img', { src: versioned(`/project/${taskId}/generated/poster.webp`, stepVersion('intro')), style: 'max-height:300px', title: 'poster(视频首帧或上传覆盖)' }));
  } else if (stepId === 'hud') {
    container.append(renderHudPreview());
  } else if (stepId === 'background') {
    container.append(el('img', { src: versioned(`/project/${taskId}/generated/background.webp`, stepVersion('background')), style: 'max-height:360px' }));
  } else if (stepId === 'pattern') {
    container.append(el('img', { src: versioned(`/project/${taskId}/generated/pattern-preview.png`, stepVersion('pattern')), style: 'max-height:360px' }));
    container.append(renderColorTable(state.metrics?.colorCounts, state.metrics?.colorNames));
  } else if (stepId === 'levels') {
    renderBoardPreview(container);
  } else if (stepId === 'pack') {
    container.append(el('a', { class: 'primary', href: `/api/tasks/${taskId}/export`, download: `${taskId}.zip` }, ['下载 ZIP 包']));
    container.append(el('a', { href: `/result/${taskId}/index.html`, download: 'index.html' }, ['下载 index.html']));
    for (const name of statusInfo?.steps?.pack?.metrics?.packageFiles || []) {
      container.append(el('a', { href: versioned(`/result/${taskId}/${name}`, stepVersion('pack')), download: name }, [`下载 ${name}`]));
    }
    container.append(el('span', { class: 'hint' }, [`${(statusInfo?.distBytes / 1024 / 1024).toFixed(1)} MB · 点击下方按钮在手机框里试玩`]));
    const mountButton = el('button', { onclick: () => mountPhoneFrame(container) }, ['试玩预览']);
    container.append(mountButton);
  }
}

function renderColorTable(counts, names) {
  const table = el('table', { class: 'color-table' });
  const palette = templateInfo?.palette || {};
  for (const [tile, count] of Object.entries(counts || {})) {
    const tr = el('tr', {});
    const rgb = palette[tile]?.rgb;
    const name = names?.[tile] || palette[tile]?.name || tile;
    tr.append(el('td', {}, [
      el('span', {
        class: 'color-swatch',
        style: rgb ? `background:rgb(${rgb.join(',')})` : '',
      }),
      `${name} ×${count}`,
    ]));
    table.append(tr);
  }
  return table;
}

async function renderBoardPreview(container) {
  container.append(el('span', { class: 'hint' }, ['加载关卡数据…']));
  let artifact;
  try {
    artifact = await fetchJson(`/project/${taskId}/generated/levels.json`);
  } catch {
    container.textContent = '';
    container.append(el('span', { class: 'hint' }, ['levels.json 不存在']));
    return;
  }
  container.textContent = '';
  const canvas = el('canvas', { class: 'board-preview', width: artifact.width, height: artifact.height });
  canvas.style.width = `${Math.min(390, artifact.width * 8)}px`;
  const ctx = canvas.getContext('2d');
  const palette = templateInfo?.palette || {};
  const gems = artifact.levels[0]?.gemsData || [];
  const offset = artifact.metrics?.gemTileOffset ?? 68;
  for (let y = 0; y < artifact.height; y += 1) {
    for (let x = 0; x < artifact.width; x += 1) {
      const gem = gems[y * artifact.width + x] || 0;
      if (gem === 0) continue;
      const rgb = palette[String(gem - offset)]?.rgb || [128, 128, 128];
      ctx.fillStyle = `rgb(${rgb.join(',')})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  container.append(canvas);
  container.append(el('span', { class: 'hint' }, [`开局完成度 ${(artifact.metrics.openingCompletion * 100).toFixed(1)}% · ${artifact.metrics.componentCount} 个色块`]));
}

function mountPhoneFrame(container) {
  container.querySelectorAll('.phone-scale').forEach((node) => node.remove());
  const scale = el('div', { class: 'phone-scale' });
  const frame = el('div', { class: 'phone-frame' });
  const iframe = el('iframe', { src: `/result/${taskId}/index.html`, allow: 'autoplay' });
  frame.append(iframe);
  scale.append(frame);
  container.append(scale);
}

/* -------------------------------- bootstrap ------------------------------ */

async function refresh(rerender) {
  // renderSteps() rebuilds the whole workbench; keep the viewport stable so
  // re-running a step doesn't look like a page reload.
  const scrollY = window.scrollY;
  const statusRes = await fetch(`/api/tasks/${taskId}`);
  if (statusRes.status === 404) {
    document.getElementById('task-title').textContent = '任务不存在';
    throw new Error('task missing');
  }
  statusInfo = (await statusRes.json()).status;
  taskDoc = await fetchJson(`/api/tasks/${taskId}`);
  document.getElementById('task-title').textContent = taskDoc.name;
  if (rerender) renderWorkbench(rerender);
  else {
    // light refresh: update state chips + metrics + previews in place
    renderWorkbench(rerender);
  }
  window.scrollTo(0, scrollY);
}


// 按任务所属插件动态加载工作台脚本(plugin.json 扫描出的注册表,前端不硬编码)。
function loadWorkbenchScript(pluginId) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `/plugins/${encodeURIComponent(pluginId)}/workbench.js`;
    script.onload = resolve;
    script.onerror = resolve;
    document.head.append(script);
  });
}

(async function init() {
  if (!taskId) {
    window.location.href = '/';
    return;
  }
  const templates = await fetchJson('/api/templates');
  const statusRes = await fetch(`/api/tasks/${taskId}`);
  if (!statusRes.ok) {
    document.getElementById('task-title').textContent = '任务不存在';
    return;
  }
  const taskFull = await statusRes.json();
  taskDoc = taskFull;
  statusInfo = taskFull.status;
  templateInfo = templates.find((t) => t.id === taskDoc.templateId);
  if (templateInfo) await loadWorkbenchScript(templateInfo.id);
  document.getElementById('task-title').textContent = taskDoc.name;
  renderWorkbench(false);
})();
