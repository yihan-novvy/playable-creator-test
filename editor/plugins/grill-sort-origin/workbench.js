window.PlayablePlugins = window.PlayablePlugins || {};
// Grill Sort Origin 工作台:流水线只有片头视频和打包两步——playable 本体是
// 原版烧烤 playable；可配置片头、标题与 CTA 循环节奏。
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
    input.addEventListener('change', () => save({ [key]: { [subkey]: input.value.trim() } }));
    return field(label, input);
  }
  // CTA 循环节奏(colorever-new 步数循环同款语义):steps 模式首跳第 N 步,
  // 之后按间隔表逐个间隔,表耗尽后按最后一个间隔循环;complete 模式完成后跳转。
  function ctaTimingControls() {
    const wrap = el('div', { class: 'dragon-config-grid' });
    const cta = config().playableCta || {};
    const select = el('select', { 'aria-label': '转化时机' });
    for (const [value, label] of [['steps', '第 N 次有效操作跳转'], ['complete', '完成后跳转']]) select.append(el('option', { value }, [label]));
    select.value = cta.mode ?? 'steps';
    select.addEventListener('change', async () => { await save({ playableCta: { mode: select.value } }); await refresh(true); });
    wrap.append(field('转化时机', select));
    if (select.value === 'steps') {
      const first = el('input', { type: 'number', min: 1, max: 99, step: 1, value: cta.afterSteps ?? 20 });
      first.addEventListener('change', async () => {
        if (!first.checkValidity()) { first.reportValidity(); return; }
        await save({ playableCta: { afterSteps: Number(first.value) } }); await refresh(true);
      });
      wrap.append(field('首跳步数 N（1–99）', first));
      const intervals = el('input', { type: 'text', placeholder: '10,8,6,4' });
      intervals.value = Array.isArray(cta.intervals) ? cta.intervals.join(',') : '10,8,6,4';
      intervals.addEventListener('change', async () => {
        const list = intervals.value.split(/[,，\s]+/).map((part) => Number(part)).filter((value) => Number.isInteger(value) && value >= 1 && value <= 99).slice(0, 24);
        await save({ playableCta: { intervals: list } }); await refresh(true);
      });
      wrap.append(field('循环间隔（逗号分隔，表耗尽后按最后一个循环）', intervals));
    }
    return wrap;
  }
  function renderConfig() {
    document.getElementById('config-hint').textContent = '原版烧烤：120 串烧烤与原版引导。有效放置记步，实际打包数计算进度；保留 180 秒倒计时和原版结算。默认第 20 次有效操作首跳，之后间隔 10/8/6/4，末间隔循环。';
    const root = document.getElementById('config-grid'); root.textContent = '';
    const wrap = el('div', { class: 'dragon-config' });
    wrap.append(el('div', { class: 'dragon-config-grid' }, [
      checkbox('使用开场视频', 'intro', 'enabled'),
      checkbox('显示顶部 HUD 标题', 'hud', 'titleEnabled', config().hud?.titleEnabled === true),
    ]));
    wrap.append(el('div', { class: 'dragon-config-grid' }, [
      textField('HUD 主标题', 'hud', 'titleLine1', config().hud?.titleLine1, 'Grill Sort'),
      textField('HUD 副标题', 'hud', 'titleLine2', config().hud?.titleLine2, 'Match three skewers'),
    ]));
    wrap.append(el('div', { class: 'dragon-config-grid' }, [
      checkbox('倒计时结束后显示 GO 按钮', 'intro', 'goEnabled'),
      textField('GO 按钮文字', 'intro', 'goText', config().intro?.goText, 'GO'),
    ]));
    wrap.append(el('h3', {}, ['转化时机']), ctaTimingControls());
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
    const pack = card('pack', 2, '打包', '组合片头视频与原版烧烤 playable，接入视频、操作、进度与转化事件，生成可导出的 H5 ZIP。', [], (right) => {
      if (stepState('pack').ok) {
        right.append(el('a', { class: 'primary', href: `/api/tasks/${taskId}/export`, download: `${taskId}.zip` }, ['下载 ZIP 包']));
        right.append(el('button', { onclick: () => mountPlayPreview(right, `/result/${taskId}/index.html?v=${Date.now()}`) }, ['试玩打包结果']));
      } else {
        right.append(el('span', { class: 'hint' }, ['打包成功后，这里可下载 ZIP 并试玩产物。']));
      }
    });
    root.append(intro, pack);
    let number = 0;
    for (const section of root.children) { const badge = section.querySelector('.step-num'); if (badge) badge.textContent = String(++number); }
  }
  window.PlayablePlugins['grill-sort-origin'] = { render: async () => { renderConfig(); renderSteps(); }, saveAll: async () => { await saving; document.getElementById('config-save-state').textContent = '已保存'; } };
})();
