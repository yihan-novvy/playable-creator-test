/* Shared ZIP processing panel: mounted after every template's existing pack/preview area. */
window.InteractivePublish = (() => {
  let root, task, state, busy = false, dirty = false, poll, saveTimer, parseTimer;
  let channel = '', previewId = '', sequence = 0, records = [], paused = false, saving = Promise.resolve(), logFrame = 0;
  let autoAppName = '', resolvedStoreUrl = '', resolvedApps = [], storeRequest;
  const fields = ['store_url', 'drama_name', 'episode', 'sequence', 'tag', 'min_view_duration'];
  const $ = id => root.querySelector('#pub-' + id);
  const endpoint = action => '/api/tasks/' + encodeURIComponent(task.id) + '/publish' + (action ? '/' + action : '');
  const text = (id, value) => { $(id).textContent = value; };
  async function api(action = '', body, method = 'POST') {
    const response = await fetch(endpoint(action), body === undefined ? {} : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (data.event_check) showInspection({ event_check: data.event_check });
      throw new Error(data.error?.message || data.error || data.message || '请求失败（' + response.status + '）');
    }
    return data;
  }
  function values() {
    return {
      ...Object.fromEntries(fields.map(key => [key, root.querySelector('[name="' + key + '"]').value])),
      category: root.querySelector('[name="category"]:checked')?.value || '',
      app_name: autoAppName,
    };
  }
  function updateFilenamePreview() {
    const data = values();
    const app = (data.app_name || '推广App').replace(/[\s\-_]+/g, '');
    const category = (data.category || 'Tier1:剧情融合').replace(/[\s:：]+/g, '');
    const tag = data.tag.trim().replace(/[\\/:*?"<>|\x00-\x1f\s]+/g, '_').replace(/^[._ ]+|[._ ]+$/g, '').slice(0, 64);
    text('filename-preview', [data.drama_name.trim(), data.episode.trim(), app, category, data.sequence.trim() || '1', tag].filter(Boolean).join('_') + '.zip');
  }
  function note(message, error = false) {
    text('notice', message);
    $('notice').classList.toggle('error-text', error);
  }
  function addLog(kind, name, payload, ts = Date.now()) {
    try {
      const encoded = JSON.stringify(payload);
      payload = encoded?.length > 16000 ? encoded.slice(0, 16000) + '…（内容已截断）' : JSON.parse(encoded ?? 'null');
    } catch { payload = '[无法序列化的事件内容]'; }
    records.push({ ts: Number.isFinite(Number(ts)) ? Number(ts) : Date.now(), kind: String(kind), name: String(name), payload });
    if (records.length > 1000) records.shift();
    if (!paused && !logFrame) logFrame = requestAnimationFrame(() => { logFrame = 0; if (!paused) renderLogs(); });
  }
  function renderLogs() {
    const query = $('filter').value.toLowerCase();
    const fragment = document.createDocumentFragment();
    for (const record of records.filter(row => JSON.stringify(row).toLowerCase().includes(query))) {
      const row = document.createElement('div');
      row.className = 'publish-log-row' + (record.kind === 'error' || record.name === 'error' ? ' error-text' : '');
      const time = document.createElement('time');
      time.textContent = new Date(record.ts).toLocaleTimeString('zh-CN', { hour12: false });
      const badge = document.createElement('strong');
      badge.textContent = record.kind + ' / ' + record.name;
      const detail = document.createElement('span');
      detail.textContent = typeof record.payload === 'string' ? record.payload : JSON.stringify(record.payload);
      row.append(time, badge, detail);
      fragment.append(row);
    }
    $('logs').replaceChildren(fragment);
    $('logs').scrollTop = $('logs').scrollHeight;
    text('log-count', records.length + ' 条' + (paused ? ' · 显示已暂停' : ' · 实时监听'));
  }
  // Same report order and wording as novvy_landing_page_service/web/zip-event-check.js.
  function describeInspection(report) {
    const lines = ['原 ZIP 事件检查（静态检查，不能证明运行时一定触发）'];
    lines.push('我们的程序负责：' + (report.injected_by_packager || []).join('；'));
    lines.push('原 ZIP 接入情况：');
    const labels = { injected: '程序负责', found: '发现调用线索', missing: '未发现调用' };
    for (const check of report.checks || []) lines.push(`• ${check.title || check.code}：${labels[check.status] || check.status}`);
    for (const warning of report.warnings || []) lines.push(`⚠ ${warning.title || warning.code}：${warning.detail}`);
    lines.push(...(report.runtime_requirements || []));
    return lines.join('\n');
  }
  function showInspection(inspection) {
    const report = inspection?.event_check;
    $('check').hidden = !report;
    if (!report) return;
    text('source-filename', task.id + '.zip');
    text('source-file-count', inspection.total_files == null ? '' : `共收录 ${inspection.total_files} 个文件`);
    text('inspection-badge', report.requires_confirmation ? '⚠ 事件接入待确认' : '已完成静态检查（需运行验收）');
    $('inspection-badge').classList.toggle('needs-confirmation', !!report.requires_confirmation);
    const fragment = document.createDocumentFragment();
    const badge = (tone, label) => {
      const chip = document.createElement('span');
      chip.className = 'publish-structure-badge ' + tone;
      chip.textContent = label;
      fragment.append(chip);
    };
    if (typeof inspection.has_index_html === 'boolean') badge('entry', inspection.has_index_html ? '✔ 包含入口 index.html' : '⚠️ 未见 index.html');
    if (typeof inspection.has_video === 'boolean') {
      badge(inspection.has_video ? 'video' : 'no-video', inspection.has_video ? '🎬 包含视频: ' + (inspection.video_filename || '') : '· 纯互动广告无独立视频');
    }
    if (inspection.asset_count != null) badge('assets', `📁 素材文件: ${inspection.asset_count} 个`);
    $('structure').hidden = !fragment.childNodes.length;
    $('structure').replaceChildren(fragment);
    text('check-report', describeInspection(report));
  }
  function safeLink(url) {
    try { const parsed = new URL(url); return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null; }
    catch { return null; }
  }
  function showApps(apps = []) {
    const first = apps[0];
    text('app-name', first?.app_name || first?.app_id || 'App 应用信息');
    text('app-status', first ? apps.length > 1 ? '已识别 ' + apps.length + ' 个产品' : '已自动识别' : '待识别');
    text('app-detail', apps.length > 1 ? '共输入 ' + apps.length + ' 个推广 App' : '点击 CTA 按钮将直接跳转至主推广商店落地页');
    const icon = safeLink(first?.icon_url);
    $('app-icon').hidden = !icon;
    if (icon) $('app-icon').src = icon;
    else $('app-icon').removeAttribute('src');
    $('apps').replaceChildren();
    $('apps').hidden = apps.length < 2;
    if (apps.length < 2) return;
    for (const app of apps) {
      const chip = document.createElement('div'); chip.className = 'publish-app';
      const image = safeLink(app.icon_url);
      if (image) { const img = document.createElement('img'); img.src = image; img.alt = ''; img.referrerPolicy = 'no-referrer'; chip.append(img); }
      const label = document.createElement('span'); label.textContent = (app.app_name || app.app_id || '未识别产品') + (app.platform ? ' · ' + app.platform : '');
      chip.append(label); $('apps').append(chip);
    }
  }
  function render() {
    if (!state) return;
    if (!dirty) {
      for (const key of fields) root.querySelector('[name="' + key + '"]').value = state.settings?.[key] ?? '';
      for (const input of root.querySelectorAll('[name="category"]')) input.checked = input.value === state.settings?.category;
      autoAppName = state.settings?.app_name || '';
      const storeUrl = state.settings?.store_url?.trim() || '';
      if (resolvedStoreUrl !== storeUrl) {
        resolvedStoreUrl = autoAppName ? storeUrl : '';
        resolvedApps = autoAppName ? [{ app_name: autoAppName }] : [];
      }
      showApps(resolvedApps);
    }
    updateFilenamePreview();
    const running = busy || state.running;
    $('fields').disabled = running;
    $('inspect').disabled = running || !state.ready;
    $('package').disabled = running || !state.ready;
    text('source', state.ready ? '自动使用当前任务已打包的 ZIP，无需下载后再上传。' : '请先在上方完成打包，再进行原 ZIP 事件检查。');
    const operations = { inspect: '正在生成原 ZIP 并检查事件…', package: '正在注入事件、生成并下载素材包…' };
    text('status', running ? operations[state.operation] || '处理中…' : state.packageStale ? '配置或素材已更新，需重新生成投放包' : state.package ? '投放包已生成' : '等待处理');
    $('status').className = 'chip ' + (state.packageStale ? 'bad' : state.package ? 'ok' : '');
    $('progress').hidden = !running;
    showInspection(state.inspection);
    $('inspection-stale').hidden = !state.inspectionStale;
    $('result').hidden = !state.package;
    if (state.package) {
      text('filename', state.package.filename);
      text('package-meta', (state.package.bytes / 1024 / 1024).toFixed(2) + ' MB · ' + new Date(state.package.createdAt).toLocaleString('zh-CN'));
      $('download').href = endpoint('download');
      text('injected', state.package.injectedEvents.join('\n'));
      if (previewId !== state.package.id) loadPreview();
    }
    if (state.interrupted) note('上次操作被中断，请重新检查或生成素材包。', true);
    else if (state.error && !running) note(state.error, true);
    if (state.running && !poll) poll = setInterval(() => reload().catch(error => note(error.message, true)), 2000);
    if (!state.running && poll) { clearInterval(poll); poll = null; }
  }
  async function reload() {
    const current = ++sequence;
    const result = await api();
    if (current !== sequence) return;
    state = result;
    render();
  }
  async function save() {
    clearTimeout(saveTimer);
    saving = saving.catch(() => {}).then(async () => {
      if (!dirty) return;
      const submitted = values();
      const result = await api('settings', submitted, 'PATCH');
      if (JSON.stringify(values()) === JSON.stringify(submitted)) dirty = false;
      state = result;
      note('');
      render();
    });
    return saving;
  }
  async function perform(action) {
    if (busy || state?.running) return;
    busy = true;
    note('');
    try {
      if (action === generate && values().store_url.trim() !== resolvedStoreUrl) {
        clearTimeout(parseTimer);
        await parseStore(true).catch(error => addLog('warning', 'parse-store', error.message));
      }
      await save(); render(); await action();
    }
    catch (error) { note(error.message, true); addLog('error', 'operation', error.message); }
    finally { busy = false; await reload().catch(error => note(error.message, true)); render(); }
  }
  async function inspect() {
    state = { ...state, operation: 'inspect' }; render();
    addLog('workflow', 'inspect', '开始检查当前任务原 ZIP');
    state = await api('inspect', {});
    render();
    addLog('workflow', 'inspect', '检查完成');
  }
  function confirmation(report) {
    const dialog = $('confirm');
    text('confirm-report', describeInspection(report) + '\n\n继续打包会注入基础统计，但不会补造缺失的阶段、进度、结果或结束行为，相应数据可能缺失。');
    return new Promise(resolve => {
      dialog.returnValue = '';
      dialog.addEventListener('close', () => resolve(dialog.returnValue === 'continue'), { once: true });
      dialog.showModal();
    });
  }
  async function generate() {
    if (!state.inspection || state.inspectionStale) await inspect();
    const report = state.inspection.event_check;
    if (report.requires_confirmation && !await confirmation(report)) { addLog('workflow', 'cancel', '已取消注入'); return; }
    state.operation = 'package'; render();
    addLog('workflow', 'package', '开始注入并生成投放包');
    state = await api('package', { confirmation: report.requires_confirmation ? report.confirmation_token : undefined });
    addLog('workflow', 'package', '投放素材包已生成');
  }
  function loadPreview() {
    if (!state?.package) return;
    previewId = state.package.id;
    channel = crypto.randomUUID();
    $('preview').src = endpoint('preview/' + previewId + '/index.html') + '?monitor=' + channel;
    $('preview-empty').hidden = true;
    $('preview').hidden = false;
    addLog('preview', 'load', state.package.filename);
  }
  async function parseStore(duringGenerate = false) {
    if ((busy && !duringGenerate) || state?.running) return;
    const storeUrl = values().store_url.trim();
    if (!storeUrl) { showApps(); return; }
    if (storeRequest?.url === storeUrl) return storeRequest.promise;
    const request = { url: storeUrl };
    storeRequest = request;
    text('app-status', '识别中…');
    request.promise = (async () => {
      try {
        const result = await api('parse-store', { store_url: storeUrl });
        if (values().store_url.trim() !== storeUrl || storeRequest !== request) return;
        resolvedApps = result.apps?.length ? result.apps : [result];
        autoAppName = resolvedApps[0]?.app_name || '';
        resolvedStoreUrl = storeUrl;
        dirty = true;
        showApps(resolvedApps);
        updateFilenamePreview();
        // Saving the other fields may still require the user to complete the drama name.
        await save().catch(error => note(error.message, true));
      } catch (error) {
        if (values().store_url.trim() === storeUrl) text('app-status', '识别失败');
        throw error;
      } finally {
        if (storeRequest === request) storeRequest = null;
      }
    })();
    return request.promise;
  }
  function setup() {
    root.innerHTML = '<section class="publish-panel">' +
      '<div class="row publish-heading"><h2>互动广告包 (ZIP) 注入与下载</h2><span id="pub-status" class="chip">等待处理</span></div>' +
      '<div class="publish-layout"><div class="publish-editor">' +
      '<form id="pub-form"><fieldset id="pub-fields" aria-label="互动广告包参数">' +
      '<label class="publish-field">最短观看时长（秒，可选）<input name="min_view_duration" type="number" min="3" max="2147483647" step="1" placeholder="留空使用平台默认规则" aria-describedby="pub-duration-hint"></label>' +
      '<p id="pub-duration-hint" class="hint publish-field-hint">控制广告关闭／划走门槛；不改变视频转互动的时间。留空继承默认配置。</p>' +
      '<h3 class="publish-section-title"><span class="publish-step" aria-hidden="true">1</span>当前任务的互动广告素材包 (ZIP 格式)</h3>' +
      '<div class="publish-source"><p id="pub-source" class="hint"></p><button type="button" id="pub-inspect">原 ZIP 事件检查</button></div>' +
      '<section id="pub-check" class="publish-check" aria-label="原 ZIP 事件检查结果" hidden><div class="publish-check-header"><span class="publish-zip-icon" aria-hidden="true">📦</span><div class="publish-zip-info"><strong id="pub-source-filename"></strong><div id="pub-source-file-count"></div></div><span id="pub-inspection-badge" class="publish-inspection-badge"></span></div>' +
      '<div id="pub-structure" class="publish-structure-badges"></div><pre id="pub-check-report" class="publish-check-report"></pre><p id="pub-inspection-stale" class="error-text" hidden>素材已变化，生成时将重新检查。</p></section>' +
      '<label class="publish-field publish-store-field"><span class="publish-section-title"><span class="publish-step" aria-hidden="true">2</span>输入商店地址 (支持输入多个产品链接，换行或逗号隔开) <span class="publish-required">*</span></span>' +
      '<textarea name="store_url" rows="2" placeholder="支持输入多个 App 商店地址或产品 ID (每行一个，或用逗号隔开)&#10;例如：&#10;https://apps.apple.com/us/app/arrow-escape/id6478901234&#10;https://play.google.com/store/apps/details?id=com.arrow.escape" required></textarea></label>' +
      '<p class="hint publish-field-hint">支持同时输入多个产品链接 (换行/逗号分隔)。</p>' +
      '<div class="publish-store-info"><div class="row"><img id="pub-app-icon" alt="App Icon" referrerpolicy="no-referrer" hidden><div class="publish-store-description"><strong id="pub-app-name">App 应用信息</strong><p id="pub-app-detail" class="hint">点击 CTA 按钮将直接跳转至主推广商店落地页</p></div><span id="pub-app-status" class="chip">待识别</span></div><div id="pub-apps" class="row" hidden></div></div>' +
      '<h3 class="publish-section-title"><span class="publish-step" aria-hidden="true">3</span>推广剧集与广告投放参数设置</h3><p class="hint publish-field-hint">(推广 App 将自动根据商店地址识别)</p>' +
      '<div class="publish-fields"><label class="publish-field">短剧剧名（选填）<input name="drama_name" type="text" placeholder="例如：千金落魄 / 逆袭之王"></label>' +
      '<label class="publish-field">剧集（选填）<input name="episode" type="text" placeholder="例如：01 或 EP01"></label></div>' +
      '<fieldset class="publish-category"><legend>推广主题 / 分类 <span class="publish-required">*</span> <span class="hint">3 选 1 · 广告系统投放题材分类</span></legend><div class="publish-category-options">' +
      '<label class="publish-category-pill"><input type="radio" name="category" value="Tier1:剧情融合" checked required><span>Tier1:剧情融合</span></label>' +
      '<label class="publish-category-pill"><input type="radio" name="category" value="Tier 2:短剧情钩子" required><span>Tier 2:短剧情钩子</span></label>' +
      '<label class="publish-category-pill"><input type="radio" name="category" value="Tier3:原爆款素材" required><span>Tier3:原爆款素材</span></label></div></fieldset>' +
      '<div class="publish-fields"><label class="publish-field"><span class="publish-field-label">同分类序号 n (选填)<span class="hint">未填默认 1</span></span><input name="sequence" type="text" placeholder="1" value="1"></label>' +
      '<label class="publish-field">Tag (选填)<input name="tag" type="text" maxlength="64" placeholder="仅追加到 ZIP 文件名，例如 testA"></label></div>' +
      '<div class="publish-filename-preview"><span>🏷️ 文件命名预览：</span><output id="pub-filename-preview" aria-live="polite"></output></div>' +
      '</fieldset><div class="row publish-actions"><button type="submit" id="pub-package" class="primary">⚡ 注入 4kubtiqn2s 事件并生成 ZIP</button></div></form>' +
      '<div id="pub-progress" class="publish-progress" hidden><span></span>处理中，请保留当前任务。刷新页面可恢复状态。</div><p id="pub-notice" role="status" aria-live="polite"></p>' +
      '<section id="pub-result" class="publish-result" hidden><h3>素材包已生成</h3><strong id="pub-filename"></strong><p id="pub-package-meta" class="hint"></p><pre id="pub-injected"></pre>' +
      '<div class="row"><a id="pub-download" class="primary">下载素材包 (.zip)</a></div></section>' +
      '</div><aside class="publish-preview-panel" aria-label="投放素材预览与事件监听">' +
      '<div class="publish-preview-actions"><button id="pub-reload" type="button" title="重新加载互动广告">🔄 重新体验</button><span class="publish-preview-mode">📦 互动广告模式</span></div>' +
      '<div class="publish-phone-wrapper"><div class="publish-phone"><div class="publish-phone-island" aria-hidden="true"></div><div class="publish-phone-screen"><p id="pub-preview-empty">生成素材包后<br>在这里试玩注入后的结果</p><iframe id="pub-preview" title="注入后的投放素材预览" sandbox="allow-scripts" allow="autoplay" hidden></iframe></div></div></div>' +
      '<section class="publish-console"><div class="publish-console-header"><h3><span class="publish-console-indicator" aria-hidden="true"></span>SDK & 事件实时监听控制台 (Live Monitor)</h3></div>' +
      '<div class="publish-console-tools"><input id="pub-filter" type="text" placeholder="筛选事件名称或内容" aria-label="筛选事件"><button id="pub-pause" type="button">暂停显示</button><button id="pub-clear" type="button">清空</button><button id="pub-export" type="button">导出日志</button></div>' +
      '<div id="pub-logs" class="publish-logs" role="log" aria-label="SDK 事件日志"></div><div class="publish-console-footer"><span id="pub-log-count" class="hint">0 条 · 实时监听</span><span class="hint">最多显示最近 1000 条</span></div></section>' +
      '<p class="hint publish-preview-hint">预览运行在隔离窗口中。仅监听当前预览窗口；SDK 调用记录表示调用已发生，不代表真实设备已跳转或服务端已入库。</p></aside></div></section>' +
      '<dialog id="pub-confirm"><form method="dialog"><h2>原 ZIP 事件接入需要确认</h2><pre id="pub-confirm-report"></pre><div class="row"><button value="cancel" autofocus>取消</button><button value="continue" class="primary">继续打包</button></div></form></dialog>';
    $('form').addEventListener('submit', event => {
      event.preventDefault();
      const data = values();
      if (data.episode.trim() && !data.drama_name.trim()) {
        alert('填写剧集时必须同时填写剧名（不填剧名则作为通用素材，剧集也留空）！');
        root.querySelector('[name="drama_name"]').focus();
        return;
      }
      perform(generate);
    });
    $('inspect').onclick = () => perform(inspect);
    $('fields').addEventListener('input', event => {
      dirty = true;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { if (!busy && !state?.running) save().catch(error => note(error.message, true)); }, 800);
      if (event.target.name === 'store_url') {
        autoAppName = '';
        resolvedStoreUrl = '';
        resolvedApps = [];
        showApps();
        clearTimeout(parseTimer);
        parseTimer = setTimeout(() => parseStore().catch(error => note('产品识别失败：' + error.message, true)), 400);
      }
      updateFilenamePreview();
    });
    updateFilenamePreview();
    $('reload').onclick = loadPreview;
    $('filter').oninput = renderLogs;
    $('pause').onclick = () => { paused = !paused; text('pause', paused ? '继续显示' : '暂停显示'); renderLogs(); };
    $('clear').onclick = () => { records = []; renderLogs(); };
    $('export').onclick = () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify({ packageId: previewId, recordedAt: new Date().toISOString(), events: records }, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = task.id + '-preview-events.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    window.addEventListener('message', event => {
      if (event.source !== $('preview').contentWindow || !event.data || typeof event.data !== 'object') return;
      const data = event.data;
      if (data.publishMonitor === channel && channel) addLog(data.kind, data.name, data.payload, data.ts);
      else if (['novvy_sdk_event', 'novvy_playable_event'].includes(data.type) || data.novvy === 'h5') {
        addLog('message', data.event || data.type, data, Date.now());
      }
    });
    addLog('workflow', 'ready', '等待生成素材包，预览开始后将记录实际事件。');
  }
  return {
    mount(doc) {
      task = doc;
      if (!root) { root = document.getElementById('interactive-publish'); setup(); }
      reload().catch(error => note(error.message, true));
    },
  };
})();
