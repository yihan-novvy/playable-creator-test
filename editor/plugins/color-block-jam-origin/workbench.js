window.PlayablePlugins = window.PlayablePlugins || {};
// Color Block Jam 工作台：片头与打包，固定一份原版素材。
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
  function ctaCardControls() {
    const cta = config().cta || {};
    const wrap = el('div', { class: 'dragon-config-grid' });
    wrap.append(
      checkbox('显示 CTA 卡片', 'cta', 'enabled', cta.enabled !== false),
      textField('CTA 按钮文案（默认 Play Now）', 'cta', 'buttonText', cta.buttonText, 'Play Now'),
      textField('CTA 引导文案（默认 Enjoy for free）', 'cta', 'guideText', cta.guideText, 'Enjoy for free'),
    );
    const color = el('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(cta.buttonColor || '') ? cta.buttonColor : '#10b981' });
    color.addEventListener('change', async () => { await save({ cta: { buttonColor: color.value } }); await refresh(true); });
    wrap.append(field('CTA 按钮颜色（默认绿色）', color));
    return wrap;
  }
  function renderConfig() {
    document.getElementById('config-hint').textContent = '保留原版三关：拖动方块到同色出口，依次完成 2、15、15 个目标方块。';
    const root = document.getElementById('config-grid'); root.textContent = '';
    const wrap = el('div', { class: 'dragon-config' });
    wrap.append(el('div', { class: 'dragon-config-grid' }, [
      checkbox('使用开场视频', 'intro', 'enabled'),
      checkbox('显示顶部 HUD 标题', 'hud', 'titleEnabled', config().hud?.titleEnabled === true),
    ]));
    wrap.append(el('div', { class: 'dragon-config-grid' }, [
      textField('HUD 主标题', 'hud', 'titleLine1', config().hud?.titleLine1, 'Color Block Jam'),
      textField('HUD 副标题', 'hud', 'titleLine2', config().hud?.titleLine2, 'Slide blocks to matching exits'),
    ]));
    wrap.append(el('h3', {}, ['游戏设置']), el('div', { class: 'dragon-config-grid' }, [
      checkbox('允许重玩', 'gameplay', 'allowReplay'),
    ]), el('p', { class: 'hint' }, ['默认关闭。开启后结算使用弹窗：成功 Retry、失败 Try Again；点击触发 CTA，返回试玩后恢复第一关棋盘与引导，不重复片头。']));
    const policy=config().playableCta||{};
    const mode=el('select',{},[el('option',{value:'steps'},['按有效步数']),el('option',{value:'complete'},['通关时'])]);
    mode.value=policy.mode||'steps';
    mode.addEventListener('change',async()=>{await save({playableCta:{mode:mode.value}});await refresh(true);});
    const first=el('input',{type:'number',min:1,max:99,step:1,required:'',value:policy.afterSteps??12});
    first.addEventListener('change',async()=>{if(!first.checkValidity()){first.reportValidity();return;}await save({playableCta:{afterSteps:Number(first.value)}});await refresh(true);});
    const intervals=el('input',{type:'text',placeholder:'8,6,4'});intervals.value=(policy.intervals??[8,6,4]).join(',');
    intervals.addEventListener('input',()=>intervals.setCustomValidity(''));
    intervals.addEventListener('change',async()=>{
      const list=intervals.value.trim()?intervals.value.trim().split(/[,，\s]+/).map(Number):[];
      if(list.length>24||list.some(n=>!Number.isInteger(n)||n<1||n>99)){intervals.setCustomValidity('请输入 1–99 的整数，最多 24 项');intervals.reportValidity();return;}
      intervals.setCustomValidity('');await save({playableCta:{intervals:list}});await refresh(true);
    });
    mode.disabled=policy.enabled===false;
    first.disabled=intervals.disabled=policy.enabled===false||mode.value!=='steps';
    wrap.append(el('h3',{},['自动跳转']),el('div',{class:'dragon-config-grid'},[
      checkbox('启用自动跳转','playableCta','enabled',policy.enabled!==false),field('跳转时机',mode),
      field('首次跳转的有效步数',first),field('后续间隔（最后一项重复，留空仅首跳）',intervals)
    ]),el('p',{class:'hint'},['默认第 12 次有效移动或出门后跳转，之后间隔 8、6、4 步，最后每 4 步重复。无效拖动不计步；首次跳转前最终通关会补跳一次。重玩重新计数，返回后可继续操作。']));
    wrap.append(el('h3', {}, ['CTA 卡片']), ctaCardControls(), el('p', { class: 'hint' }, ['进入试玩后显示，可独立关闭。按钮文案与引导文案留空时使用默认值；颜色用于底部常驻卡按钮，结算弹窗的重玩按钮保持金色。修改后可直接预览，导出需重新打包。']));
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
    const pack = card('pack', 2, '打包', '生成项目视频加试玩包，以及可上传新版平台的独立 game.js ZIP。片头、HUD、下载卡、重玩和自动跳转设置只用于项目组装包。', [], (right) => {
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
  window.PlayablePlugins['color-block-jam-origin'] = { render: async () => { renderConfig(); renderSteps(); }, saveAll: async () => { await saving; document.getElementById('config-save-state').textContent = '已保存'; } };
})();
