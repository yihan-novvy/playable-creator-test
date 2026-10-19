window.PlayablePlugins = window.PlayablePlugins || {};
// Escape Arrow 工作台只保存 Unity 原版的关卡编号，不提供关卡创作入口。
// task.js 在本文件之后加载；下列函数只在它完成初始化后才被调用。
(function () {
  let saving = Promise.resolve();
  let catalog = [];
  let galleryPath = null;
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
  // 标题独立于立绘(colorever 同款):默认跟随两行标题文案是否有内容。
  function titleEnabled() {
    return config().hud?.titleEnabled ?? [config().hud?.titleLine1, config().hud?.titleLine2].some(value => String(value ?? '').trim());
  }
  function textField(label, key, subkey, value, placeholder = '') {
    const input = el('input', { type: 'text', placeholder }); input.value = value || '';
    input.addEventListener('change', () => save({ [key]: { [subkey]: input.value.trim() } }));
    return field(label, input);
  }
  // 转化时机控件:两关同构(complete=完成后跳转;steps=成功逃出满 N 次跳转,完成时兜底)。
  function ctaTimingControls(getCta, patchCta) {
    const wrap = el('div', { class: 'dragon-config-grid' });
    const select = el('select', { 'aria-label': '转化时机' });
    for (const [value, label] of [['steps', '第 N 次成功逃出跳转'], ['complete', '完成后跳转']]) select.append(el('option', { value }, [label]));
    select.value = getCta()?.mode ?? 'steps';
    select.addEventListener('change', async () => { await save(patchCta({ mode: select.value })); await refresh(true); });
    wrap.append(field('转化时机', select));
    if (select.value === 'steps') {
      const steps = el('input', { type: 'number', min: 1, max: 99, step: 1, value: getCta()?.afterSteps ?? 4 });
      steps.addEventListener('change', async () => { await save(patchCta({ afterSteps: Number(steps.value) })); await refresh(true); });
      wrap.append(field('触发成功逃出次数 N（完成时也会兜底跳转）', steps));
    }
    return wrap;
  }
  function finalReplayControls() {
    const trailingVideo = config().outro?.enabled && !config().secondPlayable?.enabled;
    const toggle = checkbox('允许重玩', 'gameplay', 'allowReplay', !trailingVideo && config().gameplay?.allowReplay !== false);
    toggle.querySelector('input').disabled = !!trailingVideo;
    return el('div', { id: 'final-playable-replay' }, [toggle,
      el('p', { class: 'hint' }, [trailingVideo
        ? '当前试玩后还接片尾视频，不能在片尾后返回前面的试玩重玩。关闭片尾或启用第二个 playable 后，可为最后一段开启重玩。'
        : '此设置控制最后一个 playable 在“All clear!”或“Out of lives”结算中是否显示重玩按钮。双 playable 的首段失败时始终可重试。点击先跳转 CTA，再重置当前关卡；返回后开始新一局，前面的试玩和视频不重复播放。']),
    ]);
  }
  function renderConfig() {
    document.getElementById('config-hint').textContent = `关卡来自 Unity 的前 ${catalog.length} 关。双 playable 首段失败可重试；成功后播完庆祝动画并跳转 CTA，返回后播放中间视频，再进入第二段。最后一段按设置结算或重玩。`;
    const root = document.getElementById('config-grid'); root.textContent = '';
    const wrap = el('div', { class: 'dragon-config' });
    if (galleryPath) wrap.append(el('a', { href: '/templates/escape-arrow/' + galleryPath, target: '_blank', rel: 'noopener', class: 'primary' }, [`浏览前 ${catalog.length} 关并试玩 ↗`]));
    const select = el('select', { 'aria-label': '选择 Escape Arrow 关卡' });
    for (const level of catalog) {
      const i = level.id;
      const option = el('option', { value: String(i) }, [level.name]);
      if (i === config().levelId) option.selected = true;
      select.append(option);
    }
    select.addEventListener('change', async () => { await save({ levelId: Number(select.value) }); await refresh(true); });
    wrap.append(field('选择原版关卡', select));
    const selected = catalog.find(level => level.id === config().levelId);
    if (selected) {
      wrap.append(el('img', { src: '/templates/escape-arrow/' + selected.preview, alt: selected.name, style: 'width:180px;height:210px;object-fit:contain;border-radius:12px;background:#191b2d' }));
      wrap.append(el('p', { class: 'hint' }, [selected.width + ' × ' + selected.height + ' 格 · ' + selected.arrows + ' 根箭头 · 开局可逃出 ' + selected.initiallyFree + ' 根；点击箭头身体即可操作，拖动 / 双指缩放查看棋盘。']));
    }

    wrap.append(el('div', { class: 'dragon-config-grid' }, [
      checkbox('使用开场视频', 'intro', 'enabled'),
      checkbox('使用顶部 HUD 立绘', 'hud', 'enabled'),
      checkbox('显示顶部 HUD title', 'hud', 'titleEnabled', titleEnabled()),
      checkbox('使用自定义背景', 'background', 'enabled'),
      checkbox('使用片尾视频', 'outro', 'enabled'),
    ]));
    wrap.append(el('div', { class: 'dragon-config-grid' }, [
      textField('HUD 主标题', 'hud', 'titleLine1', config().hud?.titleLine1, 'Escape Arrow'),
      textField('HUD 副标题', 'hud', 'titleLine2', config().hud?.titleLine2),
    ]));
    wrap.append(el('p', { class: 'hint' }, ['片头结束后显示底部下载卡，可随时手动点击。双 playable 首段成功庆祝后跳转 CTA，返回后衔接视频；失败点击 Try again 时先跳转 CTA 再重试。']));
    const gameplay = config().gameplay || {};
    const limits = el('div', { class: 'dragon-config-grid' });
    for (const [key, label, fallback] of [['lives', '生命次数', 3], ['hints', '提示次数', 'unlimited']]) {
      const value = gameplay[key] ?? fallback;
      const mode = el('select', { 'aria-label': `${label}限制` });
      for (const [value, text] of [['unlimited', '无限'], ['limited', '有限']]) mode.append(el('option', { value }, [text]));
      mode.value = value === 'unlimited' ? 'unlimited' : 'limited';
      mode.addEventListener('change', async () => { await save({ gameplay: { [key]: mode.value === 'unlimited' ? 'unlimited' : 3 } }); await refresh(true); });
      limits.append(field(label, mode));
      if (value !== 'unlimited') {
        const count = el('input', { type: 'number', min: 1, max: 99, step: 1, value, 'aria-label': `${label}数量` });
        count.addEventListener('change', async () => {
          if (!count.checkValidity()) { count.reportValidity(); return; }
          await save({ gameplay: { [key]: Number(count.value) } }); await refresh(true);
        });
        limits.append(field(`每局${label}（1–99）`, count));
      }
    }
    wrap.append(el('h3', {}, ['玩法限制']), limits,
      el('p', { class: 'hint' }, ['每局分别计数。双 playable 首段生命耗尽后显示 Try again，点击先跳转 CTA 再重试当前关；首段提示耗尽后停止提示。最后一段达到生命或提示次数限制时立即跳转 CTA。重试会重置当前关卡的生命和提示。']));
    if (!(config().outro?.enabled && config().secondPlayable?.enabled)) wrap.append(finalReplayControls());
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
      if (slot.startsWith('portrait-src-')) {
        const side = slot.endsWith('left') ? 'left' : 'right';
        await save({ hudImageSource: { [side]: 'upload' } });
      }
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
  // 产物预览与 water-sort 同一套约定:开关关闭时步骤是 skipped,不渲染旧产物
  // 以免误导;versioned/stepVersion/uploadVersion 是 task.js 的 window 函数,
  // 只在渲染期调用。
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
  function renderHudPreview(container) {
    if (!config().hud?.enabled || !stepState('hud').ok) {
      container.append(el('span', { class: 'hint' }, [config().hud?.enabled ? '运行后显示两侧圆形头像。' : '已关闭。']));
      return;
    }
    for (const side of ['left', 'right']) {
      container.append(el('img', {
        src: versioned(`/project/${taskId}/generated/hud-${side}.webp`, stepVersion('hud')),
        class: 'ws-avatar-preview', title: side === 'left' ? '左立绘' : '右立绘',
      }));
    }
  }
  function renderBackgroundPreview(container) {
    if (!config().background?.enabled || !stepState('background').ok) {
      container.append(el('span', { class: 'hint' }, [config().background?.enabled ? '运行后显示模糊背景成品。' : '已关闭：游戏使用包内默认深色背景。']));
      return;
    }
    container.append(el('img', {
      src: versioned(`/project/${taskId}/generated/background.webp`, stepVersion('background')),
      style: 'max-height:360px', title: 'background.webp（海报或上传图高斯模糊）',
    }));
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
    // 片头倒计时标题与 GO 按钮:通用能力(core intro 覆盖层),仅在启用片头时出现。
    let introGate = null;
    if (config().intro?.enabled) {
      introGate = el('section', { class: 'step-card', id: 'intro-gate-settings' }, [
        el('h3', {}, ['倒计时标题与 GO 按钮']),
        el('p', { class: 'hint' }, ['真实的 HUD 标题直接参演：片头最后 3 秒先移到倒计时数字下方吸引等待中的用户；倒计时结束后升到画面中央、底部亮出 GO 按钮，点击 GO 标题回到顶部原位后再进入 playable。无需额外配置文案。']),
        checkbox('倒计时结束后显示 GO 按钮', 'intro', 'goEnabled'),
        el('div', { class: 'dragon-config-grid' }, [
          textField('GO 按钮文字', 'intro', 'goText', config().intro?.goText, 'GO'),
        ]),
      ]);
    }
    const outro = card('outro', 2, '片尾视频（可选）', '仅在游戏完成且完成效果结束后播放。未上传视频时直接跳过；有第二个 playable 时，播完立即换关；单 playable 播完停留最后一帧，等待 1 秒后转化跳转。', [upload('outro-video', '片尾视频 MP4（可选）', 'video/mp4')], (right) => {
      if (statusInfo?.uploads?.['outro-video']?.present) right.append(el('video', { controls: '', src: versioned(`/project/${taskId}/uploads/outro-video.mp4`, uploadVersion('outro-video')), style: 'max-height:300px' }));
      else right.append(el('span', { class: 'hint' }, ['未设置片尾视频，可直接跳过。']));
    });
    const hudInputs = [upload('portrait-src-left', '左立绘', 'image/png,image/jpeg'), upload('portrait-src-right', '右立绘', 'image/png,image/jpeg')];
    if (config().hud?.enabled && config().intro?.enabled) {
      hudInputs.push(el('button', { onclick: async () => { await save({ hudImageSource: { left: 'poster', right: 'poster' } }); await refresh(true); } }, ['两侧使用视频海报']));
    }
    const hud = card('hud', 3, '顶部 HUD', config().hud?.enabled ? '上传两张立绘，或使用视频海报作为来源。' : '已关闭，可直接跳过。', hudInputs, renderHudPreview);
    const background = card('background', 4, '自定义背景', config().background?.enabled ? '上传背景图（或用片头海报），按 1560×2598 高斯模糊成 background.webp 垫在透明棋盘之下——与 water-sort/colorever 同一条管线。' : '已关闭：游戏使用包内默认深色背景。', [upload('background', '背景图 PNG / JPG', 'image/png,image/jpeg')], renderBackgroundPreview);
    // 第二个 playable:片尾播完后立即页内换关进入;数据全量内联,不新增包文件。
    let secondPlayable = null;
    if (config().outro?.enabled) {
      const select2 = el('select', { 'aria-label': '第二关编号' });
      for (const level of catalog) select2.append(el('option', { value: String(level.id) }, [level.name]));
      select2.value = String(config().secondPlayable?.levelId ?? 2);
      select2.addEventListener('change', async () => { await save({ secondPlayable: { levelId: Number(select2.value) } }); await refresh(true); });
      secondPlayable = el('section', { class: 'step-card', id: 'second-playable-settings' }, [
        el('h3', {}, ['第二个 playable']),
        el('p', { class: 'hint' }, ['第一个 playable 失败后显示 Try again，点击先跳转 CTA，再重试首段。成功后不弹结算框，播完庆祝动画后跳转 CTA，返回后播放片尾视频，再进入本关。最后一段按下方设置触发 CTA，并决定是否允许重玩。']),
        el('div', { class: 'dragon-config-grid' }, [checkbox('启用第二个 playable', 'secondPlayable', 'enabled')]),
        field('第二关编号', select2),
        el('div', { class: 'dragon-config-grid' }, ['titleLine1', 'titleLine2'].map((key, index) => {
          const input = el('input', { type: 'text', 'aria-label': `第二关 HUD 标题 第${index + 1}行` });
          input.value = config().secondPlayable?.hud?.[key] ?? '';
          input.addEventListener('change', async () => { await save({ secondPlayable: { hud: { [key]: input.value.trim() } } }); await refresh(true); });
          return field(`第二关 HUD 标题 第${index + 1}行`, input);
        })),
        ctaTimingControls(() => config().secondPlayable?.cta, patch => ({ secondPlayable: { cta: patch } })),
        ...(config().secondPlayable?.enabled ? [finalReplayControls()] : []),
      ]);
    }
    let secondBackground = null;
    if (config().outro?.enabled && config().secondPlayable?.enabled) {
      const bg = config().secondPlayable?.background ?? {};
      const saveBackground = async (patch) => { await save({ secondPlayable: { background: patch } }); await refresh(true); };
      const enabled = el('input', { type: 'checkbox' }); enabled.checked = bg.enabled === true;
      enabled.addEventListener('change', () => saveBackground({ enabled: enabled.checked }));
      const source = el('select', { 'aria-label': '第二关背景图来源' });
      for (const [value, label] of [['video-last', '片尾视频的尾帧'], ['video-first', '片尾视频的首帧'], ['upload', '上传背景图片'], ['auto', '自动（上传图片优先，否则使用片尾尾帧）']]) source.append(el('option', { value }, [label]));
      source.value = bg.source ?? 'video-last';
      source.addEventListener('change', () => saveBackground({ source: source.value }));
      const blur = el('input', { type: 'number', min: 0, max: 50, step: 1, value: bg.blurSigma ?? 12 });
      blur.addEventListener('change', () => saveBackground({ blurSigma: Number(blur.value) }));
      const inputs = [field('启用第二关独立背景', enabled)];
      if (enabled.checked) {
        inputs.push(field('背景图来源', source), field('背景模糊程度（0–50）', blur));
        if (source.value === 'upload' || source.value === 'auto') inputs.push(upload('background2', '第二关背景图片 PNG / JPG', 'image/png,image/jpeg'));
      }
      secondBackground = card('background2', 5, '第二关自定义背景', '从片尾视频提取首帧或尾帧，也可以单独上传；进入第二关时切换。关闭时沿用包内默认深色背景。', inputs, (right) => {
        if (enabled.checked && stepState('background2').ok && !stepState('background2').metrics?.skipped) right.append(el('img', { src: versioned(`/project/${taskId}/generated/background2.webp`, stepVersion('background2')), style: 'max-height:360px', title: '第二关背景' }));
      });
    }
    // 第一关转化时机:仅无片尾时可配(有片尾时第一关只负责引出片尾)。
    const ctaTiming = el('section', { class: 'step-card', id: 'cta-timing-settings' }, [
      el('h3', {}, ['转化时机']),
      el('p', { class: 'hint' }, ['底部下载卡从试玩开始常驻；未使用片尾视频时可选择完成后跳转，或有效成功逃出满 N 次时跳转。']),
      ctaTimingControls(() => config().playableCta, patch => ({ playableCta: patch })),
    ]);
    const endMaskOn = config().cta?.endMask === true;
    const ctaCopy = el('section', { class: 'step-card', id: 'cta-copy-settings' }, [
      el('h3', {}, ['CTA 下载卡与结束遮罩']),
      el('p', { class: 'hint' }, ['默认不显示全屏遮罩：达到转化时刻自动跳转，返回后可继续试玩，每次交互再次触发跳转。开启遮罩后，第二个 playable 到达转化时刻时显示文案浮层，点击任意位置跳转。']),
      checkbox('显示底部下载卡', 'cta', 'enabled', config().cta?.enabled !== false),
      checkbox('结束后全屏遮罩', 'cta', 'endMask', endMaskOn),
    ]);
    if (endMaskOn) {
      for (const [key, label, fallback] of [
        ['takeoverText', '中间主文案', 'Ready for another challenge?\nDiscover more levels!'],
        ['takeoverActionText', '底部强调文案', 'Tap to keep playing'],
      ]) {
        const input = el('textarea', { rows: 3, 'aria-label': label, style: 'width:100%;box-sizing:border-box;resize:vertical' });
        input.value = config().cta?.[key] ?? fallback;
        input.addEventListener('change', async () => { await save({ cta: { [key]: input.value } }); await refresh(true); });
        ctaCopy.append(field(label, input));
      }
      ctaCopy.append(el('button', { onclick: async () => {
        await saving;
        mountPlayPreview(ctaCopy, versioned(`/api/tasks/${taskId}/preview?view=cta`, Date.now()));
      } }, ['预览 CTA 遮罩']));
    }
    const phase2On = config().outro?.enabled && config().secondPlayable?.enabled;
    const levelDesc = `第 ${config().levelId} 关` + (phase2On ? ` + 第二关第 ${config().secondPlayable?.levelId ?? 2} 关 · 原版 JSON 校验与导出。` : ' · 原版 JSON 校验与导出。');
    const level = card('level', 6, '关卡', levelDesc, [], (right) => {
      right.append(el('button', { onclick: () => mountPlayPreview(right, `/api/tasks/${taskId}/preview?v=${Date.now()}`) }, ['试玩当前关卡']));
    });
    const pack = card('pack', 7, '打包', '组合游戏、所选关卡与已启用素材，生成可导出的 H5 ZIP。', [], (right) => {
      if (stepState('pack').ok) {
        right.append(el('a', { class: 'primary', href: `/api/tasks/${taskId}/export`, download: `${taskId}.zip` }, ['下载 ZIP 包']));
        right.append(el('button', { onclick: () => mountPlayPreview(right, `/result/${taskId}/index.html?v=${Date.now()}`) }, ['试玩打包结果']));
      } else {
        right.append(el('span', { class: 'hint' }, ['打包成功后，这里可下载 ZIP 并试玩产物。']));
      }
    });
    root.append(intro);
    if (introGate) root.append(introGate);
    root.append(hud, background);
    if (config().outro?.enabled) { root.append(outro); if (secondPlayable) root.append(secondPlayable); if (secondBackground) root.append(secondBackground); }
    if (!config().outro?.enabled) root.append(ctaTiming);
    root.append(ctaCopy, level, pack);
    let number = 0;
    for (const section of root.children) { const badge = section.querySelector('.step-num'); if (badge) badge.textContent = String(++number); }
  }
  window.PlayablePlugins['escape-arrow'] = { render: async () => { if (!catalog.length) { const manifest = await fetchJson('/templates/escape-arrow/game-manifest.json'); catalog = manifest.levels; galleryPath = manifest.constants.gallery; } renderConfig(); renderSteps(); }, saveAll: async () => { await saving; document.getElementById('config-save-state').textContent = '已保存'; } };
})();
