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
    for (const [value,label] of [['easy','简易模式 · 整块搬运（验证 ≤6 步完成）'],['medium','适中模式 · 全局大块归位']]) mode.append(el('option',{value},[label]));
    mode.value=getOpening()?.mode==='scattered'?'medium':getOpening()?.mode??'easy';
    mode.onchange=async()=>{await save(patchOpening({mode:mode.value}));await refresh(true);};
    wrap.append(field('开局模式',mode));
    if(mode.value==='medium'){
      const coverage=el('input',{type:'number',min:80,max:100,step:1,value:getOpening()?.coverage??95});
      coverage.onchange=async()=>{await save(patchOpening({coverage:Number(coverage.value)}));await refresh(true);};
      const batchSize=el('input',{type:'number',min:12,max:48,step:1,value:getOpening()?.batchSize??30});
      batchSize.onchange=async()=>{await save(patchOpening({batchSize:Number(batchSize.value)}));await refresh(true);};
      wrap.append(field('错位目标（80–100%）',coverage),field('单批最多珠子（12–48）',batchSize));
    }
    const seed=el('input',{type:'number',min:0,max:2147483647,step:1,value:getOpening()?.seed??1});
    seed.onchange=async()=>{await save(patchOpening({seed:Number(seed.value)}));await refresh(true);};
    const shuffle=el('button',{onclick:async()=>{await save(patchOpening({seed:((Number(getOpening()?.seed??1)+1)%2147483648)}));await refresh(true);}},['换一个开局']);
    wrap.append(field('随机种子',seed),shuffle);
    wrap.append(el('p',{class:'hint'},[mode.value==='easy'?'整块搬运开局，出题器验证 6 次搬运内可完成。':'全局错位，只搬运与点击位置连通的同色错珠（含斜向相邻），不从远处补选。默认错位目标 95%、单批最多 30 颗；颜色数量和连通结构决定实际覆盖与搬运量。正式运行使用基础速度；同一种子与参数得到同一开局。']));
    return wrap;
  }
  let musicPlayer;
  function musicControls() {
    if (musicPlayer) musicPlayer.pause();
    const row = el('div', { class: 'dragon-config-grid', style: 'grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr))' });
    const meta = statusInfo?.uploads?.['background-music'];
    const select = el('select', { 'aria-label': '背景音乐' });
    select.append(el('option', { value: 'original' }, ['Colorever 原版音乐']), el('option', { value: 'custom' }, ['上传的音乐']));
    select.value = config().music?.source ?? 'original';
    select.onchange = async () => { await save({ music: { source: select.value } }); await refresh(true); };
    const input = el('input', { type: 'file', accept: '.mp3,audio/mpeg', style: 'display:none' });
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return;
      musicPlayer.pause();
      try {
        const response = await fetch(`/api/tasks/${taskId}/uploads/background-music`, {
          method: 'PUT', headers: { 'Content-Type': 'application/octet-stream', 'x-novvy-original-name': encodeURIComponent(file.name) }, body: file,
        });
        if (!response.ok) throw new Error((await response.json()).error?.message || '音乐上传失败');
        await save({ music: { source: 'custom' } });
        await refresh(true);
      } catch (error) { alert(error.message); }
      input.value = '';
    };
    musicPlayer = el('audio', { controls: '', preload: 'none', style: 'min-width:0;width:100%;max-width:300px', 'aria-label': '背景音乐试听' });
    musicPlayer.src = `/api/tasks/${taskId}/music?v=${encodeURIComponent(select.value + '-' + (meta?.meta?.sha256 ?? 'original'))}`;
    row.append(field('背景音乐', select), el('button', { onclick: () => input.click() }, ['上传 MP3']), input);
    row.append(el('span', { class: 'hint' }, [meta?.present ? `${meta.meta?.originalName || '已上传音乐'} · ${Math.round(meta.bytes / 1024)} KB` : '未上传自定义音乐']));
    if (meta?.present) row.append(el('button', { onclick: async () => {
      musicPlayer.pause();
      await fetchJson(`/api/tasks/${taskId}/uploads/background-music`, { method: 'DELETE' });
      await refresh(true);
    } }, ['移除音乐']));
    if (select.value !== 'custom' || meta?.present) row.append(field('试听', musicPlayer));
    else row.append(el('span', { class: 'hint' }, ['请上传 MP3，或切回原版音乐。']));
    row.append(el('p', { class: 'hint', style: 'grid-column:1/-1' }, ['仅作用于本任务，操作音效不受影响。更换音乐后请重新打包。']));
    return row;
  }
  function renderConfig(){
    document.getElementById('config-hint').textContent='选择已构建的图案模板；本任务的开局模式与随机种子在「关卡生成与校验」步骤中设置，第二关的开局在其专属设置区。';
    const root=document.getElementById('config-grid');root.textContent='';
    const wrap=el('div',{class:'dragon-config',style:'grid-column:1/-1'});
    wrap.append(coloreverTemplateSwitch(),el('p',{class:'hint'},['切换作用于当前项目的试玩和打包，图案、开局与上传素材保留。切换后请重新打包。']));
    const select=el('select',{'aria-label':'图案模板'});
    for(const p of pictures)select.append(el('option',{value:p.id},[p.name]));
    select.value=config().patternId??'cat';
    select.onchange=async()=>{await save({patternId:select.value});await refresh(true);};
    wrap.append(field('图案模板',select),el('p',{class:'hint'},[pictures.find(p=>p.id===select.value)?.description??'']),el('span',{class:'hint'},['图案由 colorever-new 构建提供；开局由本任务的开局参数即时生成并验证。']));
    const toggles=[
      checkbox('使用开场视频','intro','enabled'),checkbox('显示顶部立绘图片','hud','enabled'),checkbox('显示顶部立绘 title','hud','titleEnabled',titleEnabled()),checkbox('使用背景','background','enabled'),checkbox('使用片尾视频','outro','enabled'),
    ];
    // 存在片尾视频才允许增加第二个 playable。
    if(config().outro?.enabled)toggles.push(checkbox('增加第二个 playable','secondPlayable','enabled',config().secondPlayable?.enabled===true));
    wrap.append(el('div',{class:'dragon-config-grid'},toggles));
    wrap.append(musicControls());
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
  function mountPlayPreview(container, url, takeover = false) {
    container.querySelector('.phone-scale')?.remove();
    const scale = el('div', { class: 'phone-scale' }); const frame = el('div', { class: 'phone-frame' });
    const iframe = el('iframe', { src: url, allow: 'autoplay', title: takeover ? 'CTA 遮罩预览' : '游戏预览' });
    frame.append(iframe); scale.append(frame); container.append(scale);
  }
  function renderSteps() {
    const root = document.getElementById('steps'); root.textContent = '';
    const introInputs = [upload('intro-video', '片头视频 MP4', 'video/mp4'), upload('intro-poster', '可选海报 JPG', 'image/jpeg')];
    const intro = card('intro', 1, '开场视频', config().intro?.enabled ? '上传视频后运行。' : '已关闭，可直接跳过。', introInputs, renderIntroPreview);
    const outro = card('outro', 2, '片尾视频（可选）', '仅在游戏完成且完成效果结束后播放。未上传视频时直接跳过；有第二个 playable 时，播完立即换关；单 playable 播完停留最后一帧，等待 1 秒后转化跳转。', [upload('outro-video','片尾视频 MP4（可选）','video/mp4')], right => {
      if (statusInfo?.uploads?.['outro-video']?.present) right.append(el('video', { controls:'',src:versioned(`/project/${taskId}/uploads/outro-video.mp4`,uploadVersion('outro-video')),style:'max-height:300px' }));
      else right.append(el('span',{class:'hint'},['未设置片尾视频，可直接跳过。']));
    });
    // 转化时机控件:两关同构(complete=完成后跳转;steps=第 N 步跳转,完成时兜底;
    // everySteps=首跳后每 M 步再跳一次,0=只跳一次)。
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
        const every=el('input',{type:'number',min:0,max:99,step:1,value:getCta()?.everySteps??0});
        every.onchange=async()=>{await save(patchCta({everySteps:Number(every.value)}));await refresh(true);};
        wrap.append(field('此后每 M 步再跳一次（0=只跳一次）',every));
      }
      return wrap;
    }
    // 第二个 playable:片尾播完后立即页内换关进入;数据全量内联,不新增包文件。
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
        el('div',{class:'dragon-config-grid'},['titleLine1','titleLine2'].map((key,index)=>{
          const input=el('input',{type:'text','aria-label':`第二关 HUD 标题 第${index+1}行`});
          input.value=config().secondPlayable?.hud?.[key]??(index===0?pictures.find(p=>p.id===select2.value)?.name??'':'');
          input.onchange=async()=>{await save({secondPlayable:{hud:{[key]:input.value.trim()}}});await refresh(true);};
          return field(`第二关 HUD 标题 第${index+1}行`,input);
        })),
        el('p',{class:'hint'},[pictures.find(p=>p.id===select2.value)?.description??'']),
        openingControls(()=>config().secondPlayable?.opening,patch=>({secondPlayable:{opening:patch}})),
        ctaTimingControls(()=>config().secondPlayable?.cta,patch=>({secondPlayable:{cta:patch}})),
      ]);
    }
    let secondBackground=null;
    if(config().outro?.enabled&&config().secondPlayable?.enabled){
      const bg=config().secondPlayable?.background??{};
      const saveBackground=async patch=>{await save({secondPlayable:{background:patch}});await refresh(true);};
      const enabled=el('input',{type:'checkbox'});enabled.checked=bg.enabled===true;
      enabled.onchange=()=>saveBackground({enabled:enabled.checked});
      const source=el('select',{'aria-label':'第二关背景图来源'});
      for(const [value,label]of [['video-last','片尾视频的尾帧'],['video-first','片尾视频的首帧'],['upload','上传背景图片'],['auto','自动（上传图片优先，否则使用片尾尾帧）']])source.append(el('option',{value},[label]));
      source.value=bg.source??'video-last';source.onchange=()=>saveBackground({source:source.value});
      const blur=el('input',{type:'number',min:0,max:50,step:1,value:bg.blurSigma??12});
      blur.onchange=()=>saveBackground({blurSigma:Number(blur.value)});
      const inputs=[field('启用第二关独立背景',enabled)];
      if(enabled.checked){
        inputs.push(field('背景图来源',source),field('背景模糊程度（0–50）',blur));
        if(source.value==='upload'||source.value==='auto')inputs.push(upload('background2','第二关背景图片 PNG / JPG','image/png,image/jpeg'));
      }
      secondBackground=card('background2',4,'第二关自定义背景','从片尾视频提取首帧或尾帧，也可以单独上传；进入第二关时切换。关闭时使用游戏自带纯色底。',inputs,right=>{
        if(enabled.checked&&stepState('background2').ok&&!stepState('background2').metrics?.skipped)right.append(el('img',{src:versioned(`/project/${taskId}/generated/background2.webp`,stepVersion('background2')),style:'max-height:360px',title:'第二关背景'}));
      });
    }
    // 第一关转化时机:仅无片尾时可配(有片尾时第一关只负责引出片尾)。
    const ctaTiming=el('section',{class:'step-card',id:'cta-timing-settings'},[
      el('h3',{},['转化时机']),
      el('p',{class:'hint'},['仅在未使用片尾视频时生效：完成后自动跳转，或玩到第 N 步时亮出下载卡并自动跳转；填写循环间隔 M 后，首次跳转每再玩 M 步会再跳转一次（0=只跳一次）。']),
      ctaTimingControls(()=>config().playableCta,patch=>({playableCta:patch})),
    ]);
    // 结算重玩弹窗:作用于最后一个 playable(无片尾=唯一 playable;双关=第二关)。
    const replayOn=config().replay?.enabled===true;
    const replayCard=el('section',{class:'step-card',id:'replay-settings'},[
      el('h3',{},['结算重玩弹窗']),
      el('p',{class:'hint'},['最后一个 playable（未开片尾时即唯一的 playable）拼图完成动画结束后，亮出小弹窗引导点击 Replay；点击后先请求一次跳转，再页内重开本关开局重玩。建议保持「结束后全屏遮罩」关闭。']),
      checkbox('启用结算重玩弹窗','replay','enabled',replayOn),
    ]);
    if(replayOn){
      replayCard.append(el('div',{class:'dragon-config-grid'},[
        textField('弹窗文案','replay','text',config().replay?.text,'Puzzle complete! Play again?'),
        textField('按钮文字','replay','button',config().replay?.button,'Replay'),
      ]));
    }
    // 倒计时标题与 GO 按钮:片头与片尾(双 playable 时通往第二段)共用同一开关。
    let introGate=null;
    if(config().intro?.enabled || config().outro?.enabled){
      const goEnabled=config().intro?.goEnabled===true;
      introGate=el('section',{class:'step-card',id:'intro-gate-settings'},[
        el('h3',{},['倒计时标题与 GO 按钮']),
        el('p',{class:'hint'},['真实的 HUD 标题直接参演：片头与片尾(双 playable 时通往第二段)最后 3 秒先移到倒计时数字下方吸引等待中的用户；倒计时结束升到中线上方、中线下方亮出 GO 按钮，点击 GO 标题回到顶部原位后再进入 playable。无需额外配置文案。']),
        checkbox('倒计时结束后显示 GO 按钮','intro','goEnabled',goEnabled),
        el('div',{class:'dragon-config-grid'},[
          textField('GO 按钮文字','intro','goText',config().intro?.goText,'GO'),
        ]),
      ]);
    }
    const endMaskOn = config().cta?.endMask === true;
    const ctaCopy = el('section', { class: 'step-card', id: 'cta-copy-settings' }, [
      el('h3', {}, ['CTA 遮罩文案']),
      el('p', { class: 'hint' }, ['不勾选（默认）：到达转化时刻直接跳转商店；用户从商店切回来后可继续试玩，但每次点击都会同时再触发一次跳转。勾选：第二个 playable 到达转化时刻后压暗全屏并显示文案浮层，点击屏幕任意位置跳转。']),
      checkbox('显示底部下载卡', 'cta', 'enabled', config().cta?.enabled !== false),
      checkbox('结束后全屏遮罩', 'cta', 'endMask', endMaskOn),
    ]);
    if (endMaskOn) {
      ctaCopy.append(
        el('div', { class: 'dragon-config-grid' }, [
          ['takeoverText', '中间主文案', '还想继续挑战？\n更多精彩等你体验'],
          ['takeoverActionText', '底部强调文案', '点击屏幕，继续体验'],
        ].map(([key, label, fallback]) => {
          const input = el('textarea', { rows: 3, 'aria-label': label, style: 'width:100%;box-sizing:border-box;resize:vertical;font:inherit;padding:10px;border:1px solid var(--border);border-radius:8px' });
          input.value = config().cta?.[key] ?? fallback;
          input.onchange = () => { saving = save({ cta: { [key]: input.value } }).then(() => refresh(true)); };
          return el('label', { style: 'display:flex;flex-direction:column;gap:8px' }, [el('span', {}, [label]), input]);
        })),
        el('p', { class: 'hint' }, ['支持换行；修改后自动保存，重新打包后写入 ZIP。']),
      );
      const ctaPreview = el('div', { id: 'cta-copy-preview' });
      const previewCtaButton = el('button', { onclick: async () => {
        await saving;
        mountPlayPreview(document.getElementById('cta-copy-preview'), `/api/tasks/${taskId}/preview?view=cta&v=${Date.now()}`, true);
      } }, ['预览遮罩']);
      previewCtaButton.disabled = config().cta?.enabled === false;
      ctaCopy.append(previewCtaButton, ctaPreview);
    }
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
      right.append(coloreverTemplateSwitch());
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
    if(introGate)root.append(introGate);
    if(config().hud?.enabled)root.append(hud);
    if(titleEnabled())root.append(title);
    if(config().background?.enabled)root.append(background);
    if(config().outro?.enabled){root.append(outro);if(secondPlayable)root.append(secondPlayable);if(secondBackground)root.append(secondBackground);}
    root.append(progressStyle);
    if(!config().outro?.enabled)root.append(ctaTiming);
    root.append(replayCard);
    root.append(ctaCopy);
    root.append(level,pack);
    let number=0;
    for(const section of root.children){const badge=section.querySelector('.step-num');if(badge)badge.textContent=String(++number);}
  }
  window.PlayablePlugins['colorever-new'] = { render: async () => { try { pictures=await fetchJson('/api/colorever-options?templateId=colorever-new'); renderConfig(); renderSteps(); } catch(error){alert(error.message);} }, saveAll: saveLevel, previewCurrentLevel: () => mountPlayPreview(document.getElementById('step-level-preview'), `/api/tasks/${taskId}/preview?v=${Date.now()}`) };
})();
