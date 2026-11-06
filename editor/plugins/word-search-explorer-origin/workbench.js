window.PlayablePlugins = window.PlayablePlugins || {};
// Word Search Explorer 工作台：片头与打包，固定一份原版素材。
// task.js 在本文件之后加载;下列函数只在它完成初始化后才被调用。
(function () {
  let saving = Promise.resolve();
  function config() { return getConfig(); }
  function save(patch) {
    saving = saving.then(async () => {
      taskDoc = await fetchJson(`/api/tasks/${taskId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config: patch }),
      });
      const state = document.getElementById('config-save-state');
      if (state) state.textContent = '已保存';
    }).catch((error) => { alert(`保存失败: ${error.message}`); });
    return saving;
  }
  function field(label, control) {
    return el('label', { class: 'dragon-field' }, [el('span', {}, [label]), control]);
  }
  function checkbox(label, key, subkey, checked = config()[key]?.[subkey] === true) {
    const input = el('input', { type: 'checkbox' });
    input.checked = checked;
    input.addEventListener('change', async () => { await save({ [key]: { [subkey]: input.checked } }); await refresh(true); });
    return field(label, input);
  }
  function textField(label, key, subkey, value, placeholder = '') {
    const input = el('input', { type: 'text', placeholder }); input.value = value || '';
    input.addEventListener('change', async () => { await save({ [key]: { [subkey]: input.value.trim() } }); await refresh(true); });
    return field(label, input);
  }
  function renderConfig() {
    document.getElementById('config-hint').textContent = '原版 7×11 字母网格：沿直线划过单词，完成清单中的 17 项目标（含两项 KIND）。';
    const root = document.getElementById('config-grid'); root.textContent = '';
    const wrap = el('div', { class: 'dragon-config' });
    wrap.append(el('div', { class: 'dragon-config-grid' }, [
      checkbox('使用开场视频', 'intro', 'enabled'),
      checkbox('显示顶部 HUD 标题', 'hud', 'titleEnabled', config().hud?.titleEnabled === true),
    ]));
    wrap.append(el('div', { class: 'dragon-config-grid' }, [
      textField('HUD 主标题', 'hud', 'titleLine1', config().hud?.titleLine1, 'Word Search Explorer'),
      textField('HUD 副标题', 'hud', 'titleLine2', config().hud?.titleLine2, 'Find every hidden word'),
    ]));
    wrap.append(el('h3', {}, ['游戏设置']), el('div', { class: 'dragon-config-grid' }, [
      checkbox('允许重玩', 'gameplay', 'allowReplay'),
    ]), el('p', { class: 'hint' }, ['默认关闭。开启后找齐目标可重玩；重玩恢复棋盘、目标与选中状态，不重复片头。']));

    root.append(wrap);
  }
  function stateChip(id) {
    const info = stepState(id); return el('span', { class: `step-state ${info.ok ? info.stale ? 'stale' : 'ok' : ''}` }, [info.ok ? info.stale ? '需重跑' : '成功' : '未运行']);
  }
  function upload(slot, label, accept) {
    const row = el('div', { class: 'upload-slot' });
    const input = el('input', { type: 'file', accept, style: 'display:none' });
    input.addEventListener('change', async () => {
      const file = input.files?.[0]; if (!file) return;
      const response = await fetch(`/api/tasks/${taskId}/uploads/${slot}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/octet-stream', 'x-novvy-original-name': encodeURIComponent(file.name) }, body: file,
      });
      if (!response.ok) { alert(`上传失败: ${(await response.json()).error?.message || response.status}`); return; }
      await refresh(true);
    });
    row.append(el('span', { class: 'slot-name' }, [label]), el('button', { onclick: () => input.click() }, ['上传文件']), input);
    const meta = statusInfo?.uploads?.[slot];
    row.append(el('span', { class: 'hint' }, [meta?.present ? `${Math.round(meta.bytes / 1024)} KB` : '未上传']));
    return row;
  }
  function card(id, number, title, description, inputs = [], buildPreview = null) {
    const section = el('section', { class: 'step-card', id: `step-${id}` });
    section.append(el('h3', {}, [el('span', { class: 'step-num' }, [String(number)]), title, stateChip(id)]));
    section.append(el('p', { class: 'hint' }, [description]));
    const body = el('div', { class: 'step-body' });
    const left = el('div');
    for (const row of inputs) left.append(row);
    const button = el('button', { class: 'primary', onclick: async () => {
      await saving; button.disabled = true;
      try { await fetchJson(`/api/tasks/${taskId}/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: id }) }); }
      catch (error) { alert(`运行失败: ${error.message}`); }
      await refresh(true);
    } }, [stepState(id).ok ? '重新运行' : '运行']);
    left.append(button);
    const info = stepState(id);
    if (info.lastRunAt && !info.ok) left.append(el('p', { class: 'error-text' }, [info.error || '运行失败']));
    const right = el('div', { class: 'preview-area', id: `step-${id}-preview` });
    if (buildPreview) buildPreview(right);
    body.append(left, right);
    section.append(body);
    return section;
  }
  function renderIntroPreview(container) {
    if (!statusInfo?.uploads?.['intro-video']?.present) {
      container.append(el('span', { class: 'hint' }, ['上传并运行后，这里显示片头视频与海报帧。']));
      return;
    }
    container.append(el('video', {
      controls: '', src: versioned(`/project/${taskId}/uploads/intro-video.mp4`, uploadVersion('intro-video')), style: 'max-height:300px',
    }));
    if (config().intro?.enabled && stepState('intro').ok) {
      container.append(el('img', {
        src: versioned(`/project/${taskId}/generated/poster.webp`, stepVersion('intro')),
        style: 'max-height:300px', title: 'poster（视频首帧或上传覆盖）',
      }));
    }
  }
  function mountPlayPreview(container, url) {
    container.querySelector('.phone-scale')?.remove();
    const scale = el('div', { class: 'phone-scale' }); const frame = el('div', { class: 'phone-frame' });
    frame.append(el('iframe', { src: url, allow: 'autoplay' })); scale.append(frame); container.append(scale);
  }
  function renderSteps() {
    const root = document.getElementById('steps'); root.textContent = '';
    const introInputs = [upload('intro-video', '片头视频 MP4', 'video/mp4'), upload('intro-poster', '可选海报 JPG', 'image/jpeg')];
    const intro = card('intro', 1, '开场视频', config().intro?.enabled ? '上传视频后运行。' : '已关闭，可直接跳过。', introInputs, renderIntroPreview);
    const pack = card('pack', 2, '打包', '生成项目视频加试玩包，以及可上传新版平台的独立 game.js ZIP。独立包不含片头、HUD 和重玩壳。', [], (right) => {
      if (stepState('pack').ok) {
        right.append(el('a', { class: 'primary', href: `/api/tasks/${taskId}/export`, download: `${taskId}.zip` }, ['下载项目组装 ZIP']));
        right.append(el('a', { class: 'primary', href: `/api/tasks/${taskId}/export?format=game`, download: `${taskId}-game.zip` }, ['下载独立 game.js ZIP']));
        appendPackPreviewControls(right, () => mountPlayPreview(right, `/result/${taskId}/index.html?v=${Date.now()}`));
      } else {
        right.append(el('span', { class: 'hint' }, ['打包成功后，这里可下载 ZIP 并试玩产物。']));
      }
    });
    root.append(intro, pack);
    let number = 0;
    for (const section of root.children) { const badge = section.querySelector('.step-num'); if (badge) badge.textContent = String(++number); }
  }
  window.PlayablePlugins['word-search-explorer-origin'] = { render: async () => { renderConfig(); renderSteps(); }, saveAll: async () => { await saving; document.getElementById('config-save-state').textContent = '已保存'; } };
})();
