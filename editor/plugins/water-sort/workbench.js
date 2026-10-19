window.PlayablePlugins = window.PlayablePlugins || {};
// Water-sort 工作台:config 区是可视化关卡编辑器(瓶/颜色直接点选,自动保
// 存到 config.level),#steps 区是「关卡校验 / 打包」两张步骤卡。本文件在
// task.js 之前加载,入口由 task.js 的 renderWorkbench()/save-config 处理器
// 按 templateInfo.workbench 分支进来。
//
// 跨脚本约定:taskId/taskDoc/statusInfo/templateInfo 是 task.js 的顶层词法
// 绑定(不是 window 属性),fetchJson/el/wireDropZone/refresh/stepState/
// metricsSummary/versioned/stepVersion 是其顶层函数声明(window 属性)。
// 这里只在函数体内引用它们——所有调用都发生在 task.js 求值之后,顶层绝不
// 触碰词法绑定,否则 ReferenceError。

const WS_LIMITS = { minBottles: 2, maxBottles: 12, minCapacity: 2, maxCapacity: 6 };
// 新建颜色的循环色板(与系统取色器互补,保证新色可见)。
const WS_NEW_COLORS = ['#e5484d', '#e58c3d', '#f0c000', '#7cb342', '#2da44e', '#1f7fd0', '#7950f2', '#d6409f', '#5ec9d8', '#8d6e63'];

let wsLevel = null; // 编辑器工作副本(深度克隆自 config.level 或模板默认关卡)
let wsDirty = false;
let wsSaveTimer = null;
let wsJsonVisible = false;
// 文案类配置(HUD 标题/intro aria/模糊 sigma)的防抖队列:顶层键整块提交,
// 与关卡保存互不干扰;这些键不触发步骤失效(与 colorever 一致)。
let wsConfigPatchQueue = {};
let wsConfigTimer = null;

/* --------------------------------- 保存 --------------------------------- */

function wsMarkDirty() {
  wsDirty = true;
  clearTimeout(wsSaveTimer);
  wsSaveTimer = setTimeout(() => {
    wsSaveTimer = null;
    wsSaveNow();
  }, 600);
}

async function wsFlushSave() {
  if (wsSaveTimer) {
    clearTimeout(wsSaveTimer);
    wsSaveTimer = null;
  }
  if (wsDirty) await wsSaveNow();
}

// 整个 level 对象一次提交:服务端深合并对数组是整值替换,瓶子不会残留旧层。
async function wsSaveNow() {
  if (!wsDirty || !wsLevel) return;
  try {
    taskDoc = await fetchJson(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: { level: wsLevel } }),
    });
    wsDirty = false;
    const statusRes = await fetch(`/api/tasks/${taskId}`);
    if (statusRes.ok) statusInfo = (await statusRes.json()).status;
    const state = document.getElementById('config-save-state');
    if (state) {
      state.textContent = `已保存 ${new Date().toLocaleTimeString()}`;
      setTimeout(() => { state.textContent = ''; }, 3000);
    }
    // 只重绘步骤卡(状态芯片因失效而变化),不动编辑器避免丢焦点。
    wsRenderSteps();
  } catch (error) {
    alert(`保存配置失败: ${error.message}`);
  }
}

async function wsSaveAll(button) {
  if (button) button.disabled = true;
  try {
    await wsFlushSave();
    if (!wsDirty) {
      const state = document.getElementById('config-save-state');
      if (state && !wsLevel) state.textContent = '无改动';
    }
  } finally {
    if (button) button.disabled = false;
  }
}

// 文案类配置的合并保存:多个输入先后改动会合并成一次 PATCH。
function wsQueueConfig(topLevelPatch) {
  Object.assign(wsConfigPatchQueue, topLevelPatch);
  clearTimeout(wsConfigTimer);
  wsConfigTimer = setTimeout(() => {
    wsConfigTimer = null;
    wsFlushConfig();
  }, 600);
}

async function wsFlushConfig() {
  if (Object.keys(wsConfigPatchQueue).length === 0) return;
  const patch = wsConfigPatchQueue;
  wsConfigPatchQueue = {};
  try {
    taskDoc = await fetchJson(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: patch }),
    });
    const state = document.getElementById('config-save-state');
    if (state) {
      state.textContent = `已保存 ${new Date().toLocaleTimeString()}`;
      setTimeout(() => { state.textContent = ''; }, 3000);
    }
  } catch (error) {
    alert(`保存配置失败: ${error.message}`);
  }
}

/* --------------------------------- 校验 --------------------------------- */

// 与 runner 的 validateWaterSortLevel 同一套规则;这里只做即时提示,服务端
// 在 level 步仍是权威。
function wsValidate(level) {
  const errors = [];
  const capacity = level?.capacity;
  if (!Number.isInteger(capacity) || capacity < WS_LIMITS.minCapacity || capacity > WS_LIMITS.maxCapacity) {
    errors.push(`每瓶容量必须是 ${WS_LIMITS.minCapacity}-${WS_LIMITS.maxCapacity} 的整数`);
    return errors;
  }
  const colors = level?.colors || {};
  if (Object.keys(colors).length === 0) errors.push('至少需要一种颜色');
  for (const [name, hex] of Object.entries(colors)) {
    if (!/^#[0-9a-f]{6}$/i.test(String(hex))) errors.push(`颜色 ${name} 的值必须是 #RRGGBB`);
  }
  const bottles = level?.bottles || [];
  if (bottles.length < WS_LIMITS.minBottles || bottles.length > WS_LIMITS.maxBottles) {
    errors.push(`瓶子数量必须是 ${WS_LIMITS.minBottles}-${WS_LIMITS.maxBottles}`);
  }
  const counts = {};
  bottles.forEach((bottle, index) => {
    if (!Array.isArray(bottle)) {
      errors.push(`瓶子 ${index + 1} 数据损坏`);
      return;
    }
    if (bottle.length > capacity) errors.push(`瓶子 ${index + 1} 超过容量 ${capacity}`);
    for (const key of bottle) {
      if (!(key in colors)) errors.push(`瓶子 ${index + 1} 含未定义颜色 ${key}`);
      counts[key] = (counts[key] || 0) + 1;
    }
  });
  for (const [key, count] of Object.entries(counts)) {
    if (count % capacity !== 0) errors.push(`颜色 ${key} 共 ${count} 层,无法被容量 ${capacity} 整除(倒不满一整瓶)`);
  }
  return errors;
}

/* ------------------------------ 关卡编辑器 ------------------------------ */

async function wsLoadLevel() {
  const authored = taskDoc?.config?.level;
  if (authored && typeof authored === 'object' && !Array.isArray(authored)) {
    wsLevel = structuredClone(authored);
    return;
  }
  // 未编辑过:以模板默认关卡为起点,改一下就能存成自己的。
  try {
    wsLevel = await fetchJson('/templates/water-sort/game/level.json');
  } catch {
    wsLevel = { name: '我的关卡', capacity: 4, colors: {}, bottles: [[], []] };
  }
}

function wsTouch() {
  wsMarkDirty();
  wsRenderEditor();
}

function wsRenderEditor() {
  const container = document.getElementById('config-grid');
  container.textContent = '';
  if (!wsLevel) {
    container.append(el('span', { class: 'hint' }, ['关卡加载中…']));
    return;
  }
  if (!Array.isArray(wsLevel.bottles)) wsLevel.bottles = [];
  if (!wsLevel.colors || typeof wsLevel.colors !== 'object' || Array.isArray(wsLevel.colors)) wsLevel.colors = {};

  const wrap = el('div', { class: 'ws-editor' });

  const errors = wsValidate(wsLevel);
  const toolbar = el('div', { class: 'row' }, [
    el('span', { class: 'hint' }, ['每瓶容量']),
    wsCapacityInput(),
    el('span', { class: 'hint' }, [`瓶子 ${wsLevel.bottles.length}/${WS_LIMITS.maxBottles} · 颜色 ${Object.keys(wsLevel.colors).length}`]),
    el('button', {
      onclick: () => {
        if (wsLevel.bottles.length >= WS_LIMITS.maxBottles) {
          alert(`最多 ${WS_LIMITS.maxBottles} 个瓶子`);
          return;
        }
        wsLevel.bottles.push([]);
        wsTouch();
      },
    }, ['添加空瓶']),
    el('button', {
      onclick: () => {
        if (wsLevel.bottles.length <= WS_LIMITS.minBottles) {
          alert(`至少保留 ${WS_LIMITS.minBottles} 个瓶子`);
          return;
        }
        const last = wsLevel.bottles[wsLevel.bottles.length - 1];
        if (!Array.isArray(last) || last.length > 0) {
          alert('只能删除末尾的空瓶,先清空它');
          return;
        }
        wsLevel.bottles.pop();
        wsTouch();
      },
    }, ['删除末尾空瓶']),
    el('button', { class: 'advanced-toggle', onclick: () => { wsJsonVisible = !wsJsonVisible; wsRenderEditor(); } }, [wsJsonVisible ? '收起 JSON' : '编辑 JSON']),
  ]);
  wrap.append(toolbar);
  wrap.append(errors.length > 0
    ? el('div', { class: 'error-text', style: 'margin-top:0' }, [errors.join('\n')])
    : el('div', { class: 'hint', style: 'margin-top:0' }, ['关卡结构合法。改动会自动保存;点下方「关卡校验」运行可解性验证。']));

  // 文案节:HUD 标题两行(overlay 顶部)、intro aria、背景模糊强度。
  const copySection = el('div', {});
  copySection.append(el('div', { class: 'ws-section-title' }, ['HUD 文案 / 片头(打包时生效)']));
  copySection.append(wsConfigRow('HUD 标题 第一行', (config) => config.hud?.titleLine1 ?? '', (value) => ({ hud: { titleLine1: value } })));
  copySection.append(wsConfigRow('HUD 标题 第二行', (config) => config.hud?.titleLine2 ?? '', (value) => ({ hud: { titleLine2: value } })));
  copySection.append(wsConfigRow('片头 aria-label(高级)', (config) => config.intro?.ariaLabel ?? '', (value) => ({ intro: { ariaLabel: value } })));
  copySection.append(wsConfigRow('背景模糊 sigma(高级,默认 12)', (config) => config.background?.blurSigma ?? 12, (value) => ({ background: { blurSigma: Number(value) } }), 'number'));

  // 片头倒计时钩子与 GO 按钮(通用能力,core intro 覆盖层):goEnabled 开启后,
  // 片尾 3-2-1 下方亮钩子文案(留空回退 HUD 标题),倒计时结束先亮 GO 等点击,
  // 标题升到画面中央;点击 GO 标题飞回顶部 HUD 原位再进入试玩。
  const introGoRow = el('div', { class: 'ws-color-row' });
  const introGoCheck = el('input', { type: 'checkbox' });
  introGoCheck.checked = getConfig().intro?.goEnabled === true;
  introGoCheck.addEventListener('change', () => wsQueueConfig({ intro: { goEnabled: introGoCheck.checked } }));
  introGoRow.append(el('span', { class: 'hint', style: 'min-width:150px;display:inline-block' }, ['倒计时结束后显示 GO 按钮']), introGoCheck);
  copySection.append(introGoRow);
  copySection.append(wsConfigRow('倒计时钩子文案(留空=取 HUD 标题)', (config) => config.intro?.hookText ?? '', (value) => ({ intro: { hookText: value } })));
  copySection.append(wsConfigRow('GO 按钮文字(默认 GO)', (config) => config.intro?.goText ?? '', (value) => ({ intro: { goText: value } })));

  const colorSection = el('div', {});
  colorSection.append(el('div', { class: 'ws-section-title' }, ['颜色']));
  for (const [key, hex] of Object.entries(wsLevel.colors)) {
    colorSection.append(wsColorRow(key, hex));
  }
  colorSection.append(el('button', {
    onclick: () => {
      let index = 1;
      while (`color-${index}` in wsLevel.colors) index += 1;
      const name = `color-${index}`;
      wsLevel.colors[name] = WS_NEW_COLORS[Object.keys(wsLevel.colors).length % WS_NEW_COLORS.length];
      wsTouch();
    },
  }, ['+ 添加颜色']));
  wrap.append(copySection);
  wrap.append(colorSection);

  wrap.append(el('div', { class: 'ws-section-title' }, ['瓶子(自下而上,点色点往瓶口加一层)']));
  const board = el('div', { class: 'ws-bottles' });
  wsLevel.bottles.forEach((bottle, index) => board.append(wsBottleCard(index)));
  wrap.append(board);

  if (wsJsonVisible) wrap.append(wsJsonPanel());

  container.append(wrap);
}

// 文案输入行:取值走 getConfig()(模板 defaults + 任务补丁的合并结果),
// change(失焦/回车)才提交,避免每个键击重绘丢焦点。
function wsConfigRow(label, readValue, buildPatch, type = 'text') {
  const row = el('div', { class: 'ws-color-row' });
  const input = el('input', { type, ...(type === 'number' ? { step: '0.5' } : {}) });
  input.value = readValue(getConfig());
  if (type === 'number') input.style.width = '90px';
  input.addEventListener('change', () => {
    if (type === 'number' && !Number.isFinite(Number(input.value))) {
      wsRenderEditor();
      return;
    }
    wsQueueConfig(buildPatch(type === 'number' ? Number(input.value) : input.value));
  });
  row.append(el('span', { class: 'hint', style: 'min-width:150px;display:inline-block' }, [label]), input);
  return row;
}

function wsCapacityInput() {
  const input = el('input', {
    type: 'number',
    min: String(WS_LIMITS.minCapacity),
    max: String(WS_LIMITS.maxCapacity),
    value: String(wsLevel.capacity),
  });
  input.style.width = '70px';
  input.addEventListener('change', () => {
    const value = Number(input.value);
    if (!Number.isInteger(value) || value < WS_LIMITS.minCapacity || value > WS_LIMITS.maxCapacity) {
      alert(`容量必须是 ${WS_LIMITS.minCapacity}-${WS_LIMITS.maxCapacity}`);
      wsRenderEditor();
      return;
    }
    if (wsLevel.bottles.some((bottle) => bottle.length > value)) {
      alert('有瓶子已超过目标容量,先清空或撤顶再调小');
      wsRenderEditor();
      return;
    }
    wsLevel.capacity = value;
    wsTouch();
  });
  return input;
}

function wsColorRow(key, hex) {
  const row = el('div', { class: 'ws-color-row' });
  const used = wsLevel.bottles.some((bottle) => bottle.includes(key));
  // 颜色名的编辑只在 change(失焦/回车)时生效,避免每敲一个字重绘丢焦点。
  const nameInput = el('input', { type: 'text', value: key });
  nameInput.addEventListener('change', () => {
    const next = nameInput.value.trim();
    if (!next || next === key) {
      wsRenderEditor();
      return;
    }
    if (next in wsLevel.colors) {
      alert(`颜色 ${next} 已存在`);
      wsRenderEditor();
      return;
    }
    wsLevel.colors[next] = wsLevel.colors[key];
    delete wsLevel.colors[key];
    for (const bottle of wsLevel.bottles) {
      for (let index = 0; index < bottle.length; index += 1) {
        if (bottle[index] === key) bottle[index] = next;
      }
    }
    wsTouch();
  });
  const colorInput = el('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(String(hex)) ? hex : '#888888' });
  colorInput.addEventListener('change', () => {
    wsLevel.colors[key] = colorInput.value;
    wsTouch();
  });
  row.append(nameInput, colorInput);
  row.append(el('button', {
    onclick: () => {
      if (wsLevel.bottles.some((bottle) => bottle.includes(key))) {
        alert('该颜色仍在瓶子里使用,先清空相关瓶子');
        return;
      }
      delete wsLevel.colors[key];
      wsTouch();
    },
  }, ['删除']));
  if (used) row.append(el('span', { class: 'hint' }, ['使用中']));
  return row;
}

function wsBottleCard(index) {
  const bottle = Array.isArray(wsLevel.bottles[index]) ? wsLevel.bottles[index] : [];
  const capacity = wsLevel.capacity;
  const card = el('div', { class: 'ws-bottle' });
  card.append(el('span', { class: 'hint' }, [`#${index + 1}`]));
  const tube = el('div', { class: 'ws-tube', style: `height:${capacity * 22 + 8}px` });
  for (let layer = 0; layer < capacity; layer += 1) {
    const key = bottle[layer];
    const cell = el('span', { class: `ws-cell${key ? ' filled' : ' empty'}` });
    if (key) cell.style.background = wsLevel.colors[key] || '#666';
    tube.append(cell);
  }
  card.append(tube);
  const actions = el('div', { class: 'ws-bottle-actions' });
  for (const [key, hex] of Object.entries(wsLevel.colors)) {
    const dot = el('button', { class: 'ws-color-dot', title: `往瓶口加一层 ${key}`, 'aria-label': `往瓶口加一层 ${key}` });
    dot.style.background = hex;
    dot.addEventListener('click', () => {
      if (wsLevel.bottles[index].length >= capacity) {
        alert('这瓶已经满了');
        return;
      }
      wsLevel.bottles[index].push(key);
      wsTouch();
    });
    actions.append(dot);
  }
  actions.append(
    el('button', { title: '撤销顶层', onclick: () => { wsLevel.bottles[index].pop(); wsTouch(); } }, ['↶']),
    el('button', { title: '清空这瓶', onclick: () => { wsLevel.bottles[index] = []; wsTouch(); } }, ['清空']),
  );
  card.append(actions);
  return card;
}

function wsJsonPanel() {
  const wrap = el('div', { class: 'advanced-config ws-json' });
  const textarea = el('textarea', { class: 'ws-json-text', rows: '12', spellcheck: 'false' });
  textarea.value = JSON.stringify(wsLevel, null, 2);
  const errorNode = el('div', { class: 'error-text', style: 'display:none' });
  wrap.append(textarea);
  wrap.append(el('div', { class: 'row' }, [
    el('button', {
      class: 'primary',
      onclick: () => {
        try {
          const parsed = JSON.parse(textarea.value);
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('关卡必须是 JSON 对象');
          wsLevel = parsed;
          const errors = wsValidate(wsLevel);
          if (errors.length > 0) {
            errorNode.textContent = errors.join('\n');
            errorNode.style.display = '';
          }
          wsTouch();
        } catch (error) {
          errorNode.textContent = `JSON 解析失败: ${error.message}`;
          errorNode.style.display = '';
        }
      },
    }, ['应用 JSON']),
  ]));
  wrap.append(errorNode);
  return wrap;
}

/* -------------------------------- 步骤卡 --------------------------------- */

function wsStateChip(stepId) {
  const state = stepState(stepId);
  const stateClass = state.ok ? (state.stale ? 'stale' : 'ok') : (state.lastRunAt ? 'fail' : '');
  const stateText = state.ok ? (state.stale ? '成功 · 输入已更新,建议重跑' : '成功') : (state.lastRunAt ? '失败' : '未运行');
  return el('span', { class: `step-state ${stateClass}` }, [stateText]);
}

function wsRunButton(stepId, label) {
  const state = stepState(stepId);
  const button = el('button', { class: 'primary', onclick: (event) => wsRunStep(stepId, event.target) }, [state.ok ? '重新运行' : label]);
  button.id = `run-${stepId}`;
  return button;
}

async function wsRunStep(stepId, button) {
  await wsFlushSave();
  if (button) {
    button.disabled = true;
    button.textContent = '运行中…';
  }
  try {
    await fetchJson(`/api/tasks/${taskId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: stepId }),
    });
  } catch (error) {
    alert(`运行失败: ${error.message}`);
  }
  await refresh(true);
}

function wsErrorNode(stepId) {
  const state = stepState(stepId);
  const text = state.lastRunAt && !state.ok ? (state.error || '运行失败,请重试。') : '';
  return el('div', { class: 'error-text', style: text ? '' : 'display:none' }, [text]);
}

function wsMountPreview(container, src) {
  container.querySelectorAll('.phone-scale').forEach((node) => node.remove());
  const scale = el('div', { class: 'phone-scale' });
  const frame = el('div', { class: 'phone-frame' });
  frame.append(el('iframe', { src, allow: 'autoplay' }));
  scale.append(frame);
  container.append(scale);
}

function wsIntroCard() {
  const card = el('section', { class: 'step-card', id: 'step-intro' });
  card.append(el('h3', {}, [
    el('span', { class: 'step-num' }, ['1']),
    '开场视频',
    wsStateChip('intro'),
  ]));
  const body = el('div', { class: 'step-body' });
  const left = el('div', { id: 'step-intro-left' });
  const right = el('div', { class: 'preview-area', id: 'step-intro-preview' });
  left.append(wsUploadRow('intro-video', '片头视频 mp4', { accept: 'video/mp4', emptyLabel: '未上传' }));
  left.append(wsUploadRow('intro-poster', '海报 jpg(可选,默认取首帧)'));
  const runRow = el('div', { class: 'row', style: 'margin-top:10px' }, [wsRunButton('intro', '运行')]);
  left.append(runRow);
  left.append(el('div', { class: 'metrics' }, [metricsSummary('intro', stepState('intro'))]));
  left.append(wsErrorNode('intro'));
  body.append(left, right);
  card.append(body);
  wsRenderIntroPreview(right);
  return card;
}

function wsRenderIntroPreview(container) {
  container.textContent = '';
  if (!stepState('intro').ok) {
    container.append(el('span', { class: 'hint' }, ['运行后显示片头视频与海报帧。']));
    return;
  }
  container.append(el('video', {
    controls: '',
    src: versioned(`/project/${taskId}/uploads/intro-video.mp4`, uploadVersion('intro-video')),
    style: 'max-height:300px',
  }));
  container.append(el('img', {
    src: versioned(`/project/${taskId}/generated/poster.webp`, stepVersion('intro')),
    style: 'max-height:300px',
    title: 'poster(视频首帧或上传覆盖)',
  }));
}

// HUD 立绘:与 colorever 同一套来源语义(海报 or 上传)与裁剪配置(hudCrop)。
// 裁剪弹窗复用 task.js 的 openCropModal —— 同一页面共享,调用时闭包里读的
// getConfig/statusInfo/taskId 都已就位;应用裁剪后它走 refresh 重建工作台。
const WS_HUD_SIDES = [
  { side: 'left', label: '左立绘' },
  { side: 'right', label: '右立绘' },
];

function wsHudCard() {
  const card = el('section', { class: 'step-card', id: 'step-hud' });
  card.append(el('h3', {}, [
    el('span', { class: 'step-num' }, ['2']),
    'HUD 立绘',
    wsStateChip('hud'),
  ]));
  const body = el('div', { class: 'step-body' });
  const left = el('div', { id: 'step-hud-left' });
  const right = el('div', { class: 'preview-area', id: 'step-hud-preview' });
  for (const { side, label } of WS_HUD_SIDES) {
    left.append(wsHudSideControls(side, label));
  }
  left.append(el('div', { class: 'hint' }, ['未上传源图时用海报图当立绘;裁剪是可选的,完整图默认直接入圆形头像(object-fit 裁边)。']));
  const runRow = el('div', { class: 'row', style: 'margin-top:10px' }, [wsRunButton('hud', '运行')]);
  left.append(runRow);
  left.append(el('div', { class: 'metrics' }, [metricsSummary('hud', stepState('hud'))]));
  left.append(wsErrorNode('hud'));
  body.append(left, right);
  card.append(body);
  wsRenderHudPreview(right);
  return card;
}

function wsHudSideControls(side, label) {
  const wrap = el('div', { class: 'portrait-source' });
  const source = getConfig().hudImageSource?.[side] === 'upload' ? 'upload' : 'poster';
  const uploaded = statusInfo?.uploads?.[`portrait-src-${side}`]?.present === true;
  const badge = el('span', { class: `source-badge ${source}` }, [source === 'upload' ? '来源:上传图片' : '来源:海报图']);
  wrap.append(el('span', { class: 'slot-name' }, [label]), badge);
  const row = el('div', { class: 'row', style: 'margin-top:6px' });
  row.append(el('button', {
    onclick: async () => {
      await wsQueueConfigNow({ hudImageSource: { ...(getConfig().hudImageSource || {}), [side]: 'poster' } });
    },
  }, ['从海报获取']));
  row.append(el('button', { onclick: () => pickPortraitSource(side) }, ['上传图片']));
  if (source === 'upload' && uploaded) {
    row.append(el('button', { onclick: () => openCropModal(side, label) }, ['裁剪']));
  }
  wrap.append(row);
  return wrap;
}

async function wsQueueConfigNow(patch) {
  clearTimeout(wsConfigTimer);
  wsConfigTimer = null;
  wsConfigPatchQueue = { ...wsConfigPatchQueue, ...patch };
  await wsFlushConfig();
  await refresh(false);
}

function pickPortraitSource(side) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg';
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    wsUploadSlot(`portrait-src-${side}`, file);
  });
  input.click();
}

function wsRenderHudPreview(container) {
  container.textContent = '';
  if (!stepState('hud').ok) {
    container.append(el('span', { class: 'hint' }, ['运行后显示两侧圆形头像。']));
    return;
  }
  for (const { side } of WS_HUD_SIDES) {
    container.append(el('img', {
      src: versioned(`/project/${taskId}/generated/hud-${side}.webp`, stepVersion('hud')),
      class: 'ws-avatar-preview',
      title: side === 'left' ? '左立绘' : '右立绘',
    }));
  }
}

function wsBackgroundCard() {
  const card = el('section', { class: 'step-card', id: 'step-background' });
  card.append(el('h3', {}, [
    el('span', { class: 'step-num' }, ['3']),
    '背景图',
    wsStateChip('background'),
  ]));
  const body = el('div', { class: 'step-body' });
  const left = el('div', { id: 'step-background-left' });
  const right = el('div', { class: 'preview-area', id: 'step-background-preview' });
  left.append(wsUploadRow('background', '背景图 png(可选)', { emptyLabel: '未上传 · 用海报图模糊' }));
  left.append(el('div', { class: 'hint' }, ['和 colorever 同一条管线:海报(或上传图)按 1560×2598 高斯模糊成 background.webp,垫在透明画布之下。']));
  const runRow = el('div', { class: 'row', style: 'margin-top:10px' }, [wsRunButton('background', '运行')]);
  left.append(runRow);
  left.append(el('div', { class: 'metrics' }, [metricsSummary('background', stepState('background'))]));
  left.append(wsErrorNode('background'));
  body.append(left, right);
  card.append(body);
  wsRenderBackgroundPreview(right);
  return card;
}

function wsRenderBackgroundPreview(container) {
  container.textContent = '';
  if (!stepState('background').ok) {
    container.append(el('span', { class: 'hint' }, ['运行后显示模糊背景。']));
    return;
  }
  container.append(el('img', {
    src: versioned(`/project/${taskId}/generated/background.webp`, stepVersion('background')),
    style: 'max-height:360px',
  }));
}

function wsLevelCard() {
  const card = el('section', { class: 'step-card', id: 'step-level' });
  card.append(el('h3', {}, [
    el('span', { class: 'step-num' }, ['4']),
    '关卡校验',
    wsStateChip('level'),
  ]));
  const body = el('div', { class: 'step-body' });
  const left = el('div', { id: 'step-level-left' });
  const right = el('div', { class: 'preview-area', id: 'step-level-preview' });
  left.append(el('div', { class: 'hint' }, ['校验结构(容量/颜色配比)并做 BFS 可解性验证;从未编辑过关卡时使用模板默认关卡。']));
  const runRow = el('div', { class: 'row', style: 'margin-top:10px' }, [
    wsRunButton('level', '运行'),
    el('button', { onclick: () => wsMountPreview(right, `/api/tasks/${taskId}/preview`) }, ['试玩预览']),
  ]);
  left.append(runRow);
  left.append(el('div', { class: 'metrics' }, [metricsSummary('level', stepState('level'))]));
  left.append(wsErrorNode('level'));
  body.append(left, right);
  card.append(body);
  wsRenderLevelPreview(right);
  return card;
}

async function wsRenderLevelPreview(container) {
  container.textContent = '';
  if (!stepState('level').ok) {
    container.append(el('span', { class: 'hint' }, ['运行后显示关卡缩略图;「试玩预览」不依赖运行结果,可直接试玩当前配置。']));
    return;
  }
  let level;
  try {
    level = await fetchJson(versioned(`/project/${taskId}/generated/level.json`, stepVersion('level')));
  } catch {
    container.append(el('span', { class: 'hint' }, ['level.json 不存在']));
    return;
  }
  container.append(wsMiniBoard(level));
}

function wsMiniBoard(level) {
  const capacity = level.capacity || 4;
  const wrap = el('div', { class: 'ws-bottles' });
  for (const bottle of level.bottles || []) {
    const tube = el('div', { class: 'ws-mini-tube', style: `height:${capacity * 12 + 6}px` });
    for (let layer = 0; layer < capacity; layer += 1) {
      const key = bottle[layer];
      const cell = el('span', { class: `ws-mini-cell${key ? '' : ' empty'}` });
      if (key) cell.style.background = level.colors?.[key] || '#666';
      tube.append(cell);
    }
    wrap.append(tube);
  }
  return wrap;
}

function wsPackCard() {
  const card = el('section', { class: 'step-card', id: 'step-pack' });
  card.append(el('h3', {}, [
    el('span', { class: 'step-num' }, ['5']),
    '打包',
    wsStateChip('pack'),
  ]));
  const body = el('div', { class: 'step-body' });
  const left = el('div', { id: 'step-pack-left' });
  const right = el('div', { class: 'preview-area', id: 'step-pack-preview' });
  left.append(el('div', { class: 'hint' }, ['打包 = 模板基础包 + 内联关卡 + 四组 overlay(HUD/片头/背景/底部 CTA,可在配置里关闭)+ 媒体兄弟文件,平铺输出可直接分发。CTA 组同时负责胜利跳转与自动重开(胜利结算页与底部引导条不再出现)。']));
  const runRow = el('div', { class: 'row', style: 'margin-top:10px' }, [wsRunButton('pack', '运行')]);
  left.append(runRow);
  left.append(el('div', { class: 'metrics' }, [metricsSummary('pack', stepState('pack'))]));
  left.append(wsErrorNode('pack'));
  body.append(left, right);
  card.append(body);
  wsRenderPackPreview(right);
  return card;
}

function wsRenderPackPreview(container) {
  container.textContent = '';
  if (!stepState('pack').ok) {
    container.append(el('span', { class: 'hint' }, ['运行后可下载 ZIP 并在手机框里试玩。']));
    return;
  }
  container.append(el('a', { class: 'primary', href: `/api/tasks/${taskId}/export`, download: `${taskId}.zip` }, ['下载 ZIP 包']));
  for (const name of statusInfo?.steps?.pack?.metrics?.packageFiles || []) {
    container.append(el('a', { href: versioned(`/result/${taskId}/${name}`, stepVersion('pack')), download: name }, [`下载 ${name}`]));
  }
  container.append(el('span', { class: 'hint' }, [`${((statusInfo?.distBytes || 0) / 1024 / 1024).toFixed(1)} MB`]));
  container.append(el('button', { onclick: () => wsMountPreview(container, `/result/${taskId}/index.html`) }, ['试玩预览']));
}

// 通用上传行:点击/拖入同一处理,已上传显示大小与原名并可移除。
function wsUploadRow(slot, label, { accept = 'image/png', emptyLabel = '未上传' } = {}) {
  const wrap = el('div', { class: 'upload-slot' });
  const meta = statusInfo?.uploads?.[slot];
  const input = el('input', { type: 'file', accept, style: 'display:none' });
  input.addEventListener('change', () => wsUploadSlot(slot, input.files[0]));
  wrap.append(
    el('span', { class: 'slot-name' }, [label]),
    el('button', { onclick: () => input.click() }, ['上传文件']),
    input,
  );
  wrap.append(el('span', { class: `slot-state ${meta?.present ? '' : 'error-text'}` }, [
    meta?.present
      ? `${(meta.bytes / 1024).toFixed(0)} KB${meta.meta?.originalName ? ` · ${meta.meta.originalName}` : ''}`
      : emptyLabel,
  ]));
  if (meta?.present) {
    wrap.append(el('button', {
      onclick: async () => {
        try {
          await fetchJson(`/api/tasks/${taskId}/uploads/${slot}`, { method: 'DELETE' });
          await refresh(false);
        } catch (error) {
          alert(`移除失败: ${error.message}`);
        }
      },
    }, ['移除']));
  }
  wireDropZone(wrap, (file) => {
    const expected = accept === 'video/mp4' ? 'video/mp4' : 'image/';
    if (!(file.type === expected || file.type.startsWith(expected))) {
      alert(`请拖入 ${label} 对应的${accept === 'video/mp4' ? ' mp4 视频' : '图片'}文件`);
      return;
    }
    wsUploadSlot(slot, file);
  });
  return wrap;
}

async function wsUploadSlot(slot, file) {
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

/* -------------------------------- 入口 ---------------------------------- */

async function render() {
  // colorever 的配置区说明文案不适用于关卡编辑器。
  document.getElementById('config-hint')?.setAttribute('hidden', '');
  await wsLoadLevel();
  wsRenderEditor();
  wsRenderSteps();
}

function wsRenderSteps() {
  const container = document.getElementById('steps');
  container.textContent = '';
  container.append(wsIntroCard(), wsHudCard(), wsBackgroundCard(), wsLevelCard(), wsPackCard());
}

window.PlayablePlugins['water-sort'] = { render, saveAll: wsSaveAll };
