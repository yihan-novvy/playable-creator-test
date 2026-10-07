window.PlayablePlugins = window.PlayablePlugins || {};
// 广告任务仅选择已制作好的完整图案，编辑属于模板制作入口。
// task.js 在本文件之后加载；下列函数只在它完成初始化后才被调用。
(function () {
  let saving = Promise.resolve();
  function config() { return getConfig(); }
  function save(patch) {
    saving = saving.catch(()=>{}).then(async () => {
      taskDoc = await fetchJson(`/api/tasks/${taskId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config: patch }),
      });
      const state = document.getElementById('config-save-state');
      if (state) state.textContent = '已保存';
    });
    return saving;
  }
  function field(label, control) {
    return el('label', { class: 'dragon-field' }, [el('span', {}, [label]), control]);
  }
  function titleEnabled() {
    return config().hud?.titleEnabled ?? [config().hud?.titleLine1,config().hud?.titleLine2].some(value=>String(value??'').trim());
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
  function progressColor(label,key,normal,portrait) {
    const saved=config().hud?.[key];
    const input=el('input',{type:'color',value:/^#[0-9a-f]{6}$/i.test(saved??'')?saved:config().hud?.enabled?portrait:normal});
    input.addEventListener('change',async()=>{await save({hud:{[key]:input.value}});await refresh(true);});
    return field(label,input);
  }
  let pictures=[];
  async function saveLevel(){await saving;}
  // 开局模式与随机种子是广告任务的核心玩法决策:同一图案可按任务生成不同
  // 开局。种子决定确定的开局,便于复现与对比。
  function openingControls(getOpening, patchOpening) {
    const wrap=el('div',{class:'dragon-config-grid'});
    const mode=el('select',{'aria-label':'开局模式'});
    for (const [value,label] of [['easy','简易模式 · 整块搬运（验证 ≤6 步完成）'],['scattered','零散模式 · 碎块归位']]) mode.append(el('option',{value},[label]));
    mode.value=getOpening()?.mode??'easy';
    mode.onchange=async()=>{await save(patchOpening({mode:mode.value}));await refresh(true);};
    wrap.append(field('开局模式',mode));
    if(mode.value==='scattered'){
      const difficulty=el('input',{type:'number',min:1,max:100,step:1,value:getOpening()?.difficulty??21});
      difficulty.onchange=async()=>{await save(patchOpening({difficulty:Number(difficulty.value)}));await refresh(true);};
      wrap.append(field('打散对数（1–100）',difficulty));
    }
    const seed=el('input',{type:'number',min:0,max:2147483647,step:1,value:getOpening()?.seed??1});
    seed.onchange=async()=>{await save(patchOpening({seed:Number(seed.value)}));await refresh(true);};
    const shuffle=el('button',{onclick:async()=>{await save(patchOpening({seed:((Number(getOpening()?.seed??1)+1)%2147483648)}));await refresh(true);}},['换一个开局']);
    wrap.append(field('随机种子',seed),shuffle);
    wrap.append(el('p',{class:'hint'},[mode.value==='easy'?'整块搬运开局，出题器验证 6 次搬运内可完成。':'随机交换珠子生成开局，打散对数越高碎块越多；同一种子总是得到同一开局。']));
    return wrap;
  }
  function renderConfig(){
    document.getElementById('config-hint').textContent='选择已构建的图案模板；本任务的开局模式与随机种子在「关卡生成与校验」步骤中设置，第二关的开局在其专属设置区。';
    const root=document.getElementById('config-grid');root.textContent='';
    const wrap=el('div',{class:'dragon-config',style:'grid-column:1/-1'});
    const select=el('select',{'aria-label':'图案模板'});
    for(const p of pictures)select.append(el('option',{value:p.id},[p.name]));
    select.value=config().patternId??'cat';
    select.onchange=async()=>{await save({patternId:select.value});await refresh(true);};
    wrap.append(field('图案模板',select),el('p',{class:'hint'},[pictures.find(p=>p.id===select.value)?.description??'']),el('span',{class:'hint'},['图案由 colorever 构建提供；开局由本任务的开局参数即时生成并验证。']));
    const toggles=[
      checkbox('使用开场视频','intro','enabled'),checkbox('显示顶部立绘图片','hud','enabled'),checkbox('显示顶部立绘 title','hud','titleEnabled',titleEnabled()),checkbox('使用背景','background','enabled'),checkbox('使用片尾视频','outro','enabled'),
    ];
    // 存在片尾视频才允许增加第二个 playable。
    if(config().outro?.enabled)toggles.push(checkbox('增加第二个 playable','secondPlayable','enabled',config().secondPlayable?.enabled===true));
    wrap.append(el('div',{class:'dragon-config-grid'},toggles));
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
    if (slot === 'outro-video' && meta?.present) row.append(el('button', { onclick: async () => {
      await fetchJson(`/api/tasks/${taskId}/uploads/${slot}`, { method: 'DELETE' });
      await refresh(true);
    } }, ['移除视频']));
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
      button.disabled = true;
      try { await saveLevel(); await saving; await fetchJson(`/api/tasks/${taskId}/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: id }) }); }
      catch (error) { alert(`运行失败: ${error.message}`); button.disabled=false; return; }
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
    if (!config().hud?.enabled || !stepState('hud').ok) return;
    for (const side of ['left', 'right']) {
      if (!stepState('hud').metrics?.[side]) continue;
      container.append(el('img', {
        src: versioned(`/project/${taskId}/generated/hud-${side}.webp`, stepVersion('hud')),
        class: 'ws-avatar-preview', title: side === 'left' ? '左立绘' : '右立绘',
      }));
    }
  }
  function renderBackgroundPreview(container) {
    if (!config().background?.enabled || !stepState('background').ok) {
      container.append(el('span', { class: 'hint' }, [config().background?.enabled ? '运行后显示模糊背景成品。' : '已关闭：游戏使用自带纯色底。']));
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
    const outro = card('outro', 2, '片尾视频（可选）', '仅在游戏完成且完成效果结束后播放。未上传视频时直接跳过；播完停留最后一帧，等待 1 秒后转化跳转，返回时保留片尾画面。', [upload('outro-video','片尾视频 MP4（可选）','video/mp4')], right => {
      if (statusInfo?.uploads?.['outro-video']?.present) right.append(el('video', { controls:'',src:versioned(`/project/${taskId}/uploads/outro-video.mp4`,uploadVersion('outro-video')),style:'max-height:300px' }));
      else right.append(el('span',{class:'hint'},['未设置片尾视频，可直接跳过。']));
    });
    // 转化时机控件:两关同构(complete=完成后跳转;steps=第 N 步跳转,完成时兜底)。
    function ctaTimingControls(getCta, patchCta) {
      const wrap=el('div',{class:'dragon-config-grid'});
      const select=el('select',{'aria-label':'转化时机'});
      for (const [value,label] of [['steps','第 N 步跳转'],['complete','完成后跳转']]) select.append(el('option',{value},[label]));
      select.value=getCta()?.mode??'steps';
      select.onchange=async()=>{await save(patchCta({mode:select.value}));await refresh(true);};
      wrap.append(field('转化时机',select));
      if(select.value==='steps'){
        const steps=el('input',{type:'number',min:1,max:99,step:1,value:getCta()?.afterSteps??8});
        steps.onchange=async()=>{await save(patchCta({afterSteps:Number(steps.value)}));await refresh(true);};
        wrap.append(field('触发步数 N（完成时也会兜底跳转）',steps));
      }
      return wrap;
    }
    // 第二个 playable:片尾播完(留最后一帧)后页内换关进入;数据全量内联,不新增包文件。
    let secondPlayable=null;
    if(config().outro?.enabled){
      const select2=el('select',{'aria-label':'第二关图案'});
      for(const p of pictures)select2.append(el('option',{value:p.id},[p.name]));
      select2.value=config().secondPlayable?.patternId??'house';
      select2.onchange=async()=>{await save({secondPlayable:{patternId:select2.value}});await refresh(true);};
      secondPlayable=el('section',{class:'step-card',id:'second-playable-settings'},[
        el('h3',{},['第二个 playable']),
        el('p',{class:'hint'},['第一个 playable 完成并播完片尾后，页内切换进入第二个 playable；下载卡与跳转按此关的转化时机触发。']),
        el('div',{class:'dragon-config-grid'},[checkbox('启用第二个 playable','secondPlayable','enabled',config().secondPlayable?.enabled===true)]),
        field('第二关图案',select2),
        el('p',{class:'hint'},[pictures.find(p=>p.id===select2.value)?.description??'']),
        openingControls(()=>config().secondPlayable?.opening,patch=>({secondPlayable:{opening:patch}})),
        ctaTimingControls(()=>config().secondPlayable?.cta,patch=>({secondPlayable:{cta:patch}})),
      ]);
    }
    // 第一关转化时机:仅无片尾时可配(有片尾时第一关只负责引出片尾)。
    const ctaTiming=el('section',{class:'step-card',id:'cta-timing-settings'},[
      el('h3',{},['转化时机']),
      el('p',{class:'hint'},['仅在未使用片尾视频时生效：完成后自动跳转，或玩到第 N 步时亮出下载卡并自动跳转一次。']),
      ctaTimingControls(()=>config().playableCta,patch=>({playableCta:patch})),
    ]);
    const hudInputs = [upload('portrait-src-left', '左立绘', 'image/png,image/jpeg'), upload('portrait-src-right', '右立绘', 'image/png,image/jpeg')];
    if (config().hud?.enabled && config().intro?.enabled) {
      hudInputs.push(el('button', { onclick: async () => { await save({ hudImageSource: { left: 'poster', right: 'poster' } }); await refresh(true); } }, ['两侧使用视频海报']));
    }
    const hud = card('hud', 3, '顶部立绘图片', '上传所需的左右立绘图片，与标题开关独立。', hudInputs, renderHudPreview);
    const title = el('section',{class:'step-card',id:'hud-title-settings'},[
      el('h3',{},['顶部立绘 title']),
      el('div',{class:'dragon-config-grid'},[textField('HUD 主标题','hud','titleLine1',config().hud?.titleLine1),textField('HUD 副标题','hud','titleLine2',config().hud?.titleLine2)]),
    ]);
    const progressStyle=el('section',{class:'step-card',id:'progress-style-settings'},[
      el('h3',{},['进度样式']),
      el('div',{class:'dragon-config-grid'},[
        progressColor('进度数字颜色','progressTextColor','#326b83','#ffffff'),
        progressColor('进度条已完成颜色','progressFillColor','#329fc2','#ffd91e'),
        progressColor('进度条底色','progressTrackColor','#dff3fc','#b7834a'),
      ]),
    ]);
    const backgroundSource=el('select',{'aria-label':'背景图来源'});
    for (const [value,label] of [['auto','自动（上传图片优先，否则使用海报）'],['upload','上传背景图片'],['video-first','片头视频的首帧'],['video-last','片头视频的尾帧']]) backgroundSource.append(el('option',{value},[label]));
    backgroundSource.value=config().background?.source??'auto';
    backgroundSource.onchange=async()=>{await save({background:{source:backgroundSource.value}});await refresh(true);};
    const blur=el('input',{type:'number',min:0,max:50,step:1,value:config().background?.blurSigma??12});
    blur.onchange=async()=>{await save({background:{blurSigma:Number(blur.value)}});await refresh(true);};
    const backgroundInputs=[field('背景图来源',backgroundSource),field('背景模糊程度（0–50）',blur)];
    if(backgroundSource.value.startsWith('video-')) backgroundInputs.push(el('p',{class:'hint'},['使用“开场视频”步骤上传的 MP4，无需开启视频播放或先生成海报。']));
    else backgroundInputs.push(upload('background','背景图片 PNG / JPG','image/png,image/jpeg'));
    const background = card('background', 4, '自定义背景', config().background?.enabled ? '选择上传图片或片头视频的首帧、尾帧，调整模糊程度后运行。' : '已关闭：游戏使用自带纯色底。', backgroundInputs, renderBackgroundPreview);
    const level = card('level', 5, '关卡生成与校验', '选择开局模式与随机种子，从所选图案生成开局，并以真实解法回放验证可完成。换种子即换一个开局。', [openingControls(()=>config().opening,patch=>({opening:patch}))], (right) => {
      right.append(el('button', { onclick: () => mountPlayPreview(right, `/api/tasks/${taskId}/preview?v=${Date.now()}`) }, ['试玩当前关卡']));
    });
    const pack = card('pack', 6, '打包', '组合游戏、所选关卡与已启用素材，生成可导出的 H5 ZIP。', [], (right) => {
      if (stepState('pack').ok) {
        right.append(el('a', { class: 'primary', href: `/api/tasks/${taskId}/export`, download: `${taskId}.zip` }, ['下载 ZIP 包']));
        right.append(el('button', { onclick: () => mountPlayPreview(right, `/result/${taskId}/index.html?v=${Date.now()}`) }, ['试玩打包结果']));
      } else {
        right.append(el('span', { class: 'hint' }, ['打包成功后，这里可下载 ZIP 并试玩产物。']));
      }
    });
    if(config().intro?.enabled)root.append(intro);
    if(config().hud?.enabled)root.append(hud);
    if(titleEnabled())root.append(title);
    if(config().background?.enabled)root.append(background);
    if(config().outro?.enabled){root.append(outro);if(secondPlayable)root.append(secondPlayable);}
    root.append(progressStyle);
    if(!config().outro?.enabled)root.append(ctaTiming);
    root.append(level,pack);
    let number=0;
    for(const section of root.children){const badge=section.querySelector('.step-num');if(badge)badge.textContent=String(++number);}
  }
  window.PlayablePlugins['colorever'] = { render: async () => { try { pictures=await fetchJson('/api/colorever-options'); renderConfig(); renderSteps(); } catch(error){alert(error.message);} }, saveAll: saveLevel };
})();
