import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from '../server.mjs';

// water-sort 模板的端到端管线:intro/hud/background/level 四步 + pack 的
// overlay 注入(HUD/开场视频/DOM 背景),模板感知分发,按模板的 config 白名单。

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TEST_DIR, '..', '..');
const EXAMPLE = path.join(ROOT, 'editor', 'test', 'fixtures', 'dragon-baby-color-ever');

async function startServer() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { server, base: `http://127.0.0.1:${port}` };
}

async function api(base, method, pathname, body) {
  const res = await fetch(`${base}${pathname}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function createTask(base, templateId, name) {
  const { status, json } = await api(base, 'POST', '/api/tasks', { name, templateId });
  if (status !== 201) throw new Error(`create ${templateId} task failed: ${status}`);
  return json.id;
}

async function uploadFile(base, taskId, slot, file) {
  const res = await fetch(`${base}/api/tasks/${taskId}/uploads/${slot}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream', 'x-novvy-original-name': path.basename(file) },
    body: fs.readFileSync(file),
  });
  return res.status;
}

// capacity 3、每色 3 层、含 2 个空瓶:结构合法且显然可解。
const VALID_LEVEL = {
  name: '测试关卡',
  extraKey: '应被归一化丢弃',
  capacity: 3,
  colors: { a: '#FF0000', b: '#00FF00', c: '#0000FF' },
  bottles: [
    ['a', 'b', 'c'],
    ['b', 'c', 'a'],
    ['c', 'a', 'b'],
    [],
    [],
  ],
};

const FULL_DIST = ['app-icon.png', 'background.webp', 'game.js', 'hud-left.webp', 'hud-right.webp', 'index.html', 'poster.webp', 'stone.svg', 'tail-ad-video.mp4'];
// hud/intro 关掉但 CTA(默认开)仍在的布局:基础包 + 背景 + CTA 图标。
const BARE_DIST = ['app-icon.png', 'background.webp', 'game.js', 'index.html', 'stone.svg'];

export default async function run(assert) {
  const { server, base } = await startServer();
  const created = [];
  try {
    // --- level 步:自定义合法关卡 ---
    const taskId = await createTask(base, 'water-sort', `ws-level-${Date.now()}`);
    created.push(taskId);
    const patch = await api(base, 'PATCH', `/api/tasks/${taskId}`, { config: { level: VALID_LEVEL } });
    assert.check(patch.status === 200, 'water-sort 任务可保存 config.level');
    assert.equal(patch.json?.config?.level?.bottles, VALID_LEVEL.bottles, 'config.level 通过 PATCH 原样保存');

    const run = await api(base, 'POST', `/api/tasks/${taskId}/run`, { step: 'level' });
    assert.check(run.status === 200 && run.json?.ok === true, `run level 成功 (${run.status})`);
    assert.equal(run.json?.metrics?.source, 'config', 'metrics.source 记录 config');
    assert.equal(run.json?.metrics?.solvable, true, 'BFS 判定可解');
    assert.equal(run.json?.metrics?.colorCounts, { a: 3, b: 3, c: 3 }, 'metrics 记录每色层数');

    const generated = JSON.parse(fs.readFileSync(path.join(ROOT, 'project', taskId, 'generated', 'level.json'), 'utf8'));
    assert.equal(generated, {
      name: '测试关卡',
      capacity: 3,
      colors: VALID_LEVEL.colors,
      bottles: VALID_LEVEL.bottles,
    }, 'generated/level.json 是去掉未知键的归一化关卡');

    // --- level 步:未编辑时回落模板默认关卡(模板根 level.json,构建时内联) ---
    const defaultsId = await createTask(base, 'water-sort', `ws-default-${Date.now()}`);
    created.push(defaultsId);
    const runDefault = await api(base, 'POST', `/api/tasks/${defaultsId}/run`, { step: 'level' });
    assert.check(runDefault.status === 200 && runDefault.json?.ok === true, '未配置关卡也能跑 level');
    assert.equal(runDefault.json?.metrics?.source, 'template-default', 'metrics.source 记录 template-default');
    const defaultGenerated = JSON.parse(fs.readFileSync(path.join(ROOT, 'project', defaultsId, 'generated', 'level.json'), 'utf8'));
    const templateLevel = JSON.parse(fs.readFileSync(path.join(ROOT, 'editor', 'templates', 'water-sort', 'level.json'), 'utf8'));
    assert.equal(defaultGenerated, templateLevel, '回落产物与模板默认关卡一致');

    // --- level 步:负例 ---
    await api(base, 'PATCH', `/api/tasks/${taskId}`, {
      config: { level: { capacity: 3, colors: { a: '#FF0000' }, bottles: [['a', 'a'], []] } },
    });
    const badRun = await api(base, 'POST', `/api/tasks/${taskId}/run`, { step: 'level' });
    assert.check(badRun.status === 422, `颜色数不整除时 run level 返回 422 (${badRun.status})`);
    assert.check(String(badRun.json?.error || '').includes('整除'), '报错说明整除约束');
    const unsolvable = await api(base, 'PATCH', `/api/tasks/${taskId}`, {
      config: { level: { capacity: 2, colors: { a: '#FF0000', b: '#00FF00' }, bottles: [['a', 'b'], ['a', 'b']] } },
    });
    assert.check(unsolvable.status === 200, '不可解关卡能通过 PATCH 保存(拦截发生在 level 步)');
    const unsolvableRun = await api(base, 'POST', `/api/tasks/${taskId}/run`, { step: 'level' });
    assert.check(unsolvableRun.status === 422, '不可解关卡 run level 返回 422');
    assert.check(String(unsolvableRun.json?.error || '').includes('不可解'), '报错含「不可解」');
    const status = await api(base, 'GET', `/api/tasks/${taskId}`);
    assert.equal(status.json?.status?.steps?.level?.ok, false, 'status.steps.level.ok 为 false');
    assert.check(typeof status.json?.status?.steps?.level?.error === 'string', 'status 记录错误信息');

    // --- 模板感知分发 ---
    const wrongStep = await api(base, 'POST', `/api/tasks/${taskId}/run`, { step: 'pattern' });
    assert.check(wrongStep.status === 400, `water-sort 任务跑 colorever 步骤被拒 (${wrongStep.status})`);
    const coloreverId = await createTask(base, 'colorever-gemsort', `ws-control-${Date.now()}`);
    created.push(coloreverId);
    const coloreverWrong = await api(base, 'POST', `/api/tasks/${coloreverId}/run`, { step: 'level' });
    assert.check(coloreverWrong.status === 400, 'colorever 任务跑 level 同样被拒');
    const wsStatus = await api(base, 'GET', `/api/tasks/${taskId}`);
    assert.equal(Object.keys(wsStatus.json?.status?.steps || {}).sort(), ['background', 'hud', 'intro', 'level', 'pack'], 'water-sort status.steps 只含五步');
    const coloreverStatus = await api(base, 'GET', `/api/tasks/${coloreverId}`);
    assert.equal(Object.keys(coloreverStatus.json?.status?.steps || {}).sort(), ['background', 'hud', 'intro', 'levels', 'pack', 'pattern'], 'colorever status.steps 仍是六步');

    // --- 白名单按模板 ---
    assert.equal((await api(base, 'GET', `/api/tasks/${taskId}`)).json?.config?.level?.capacity, 2, 'water-sort 任务保留 config.level');
    await api(base, 'PATCH', `/api/tasks/${coloreverId}`, { config: { level: VALID_LEVEL } });
    assert.equal((await api(base, 'GET', `/api/tasks/${coloreverId}`)).json?.config?.level, undefined, 'colorever 任务丢弃 config.level');

    // --- 全流程:intro/hud/background/level/pack 五步 + overlay 注入 ---
    const packId = await createTask(base, 'water-sort', `ws-pack-${Date.now()}`);
    created.push(packId);
    assert.check(await uploadFile(base, packId, 'intro-video', path.join(EXAMPLE, 'ad-assets', 'final', 'intro-video.mp4')) === 200, '片头视频上传成功');
    assert.check(await uploadFile(base, packId, 'portrait-src-left', path.join(EXAMPLE, 'editable', 'hud', 'dragon-left.png')) === 200, '左立绘上传成功');
    assert.check(await uploadFile(base, packId, 'portrait-src-right', path.join(EXAMPLE, 'editable', 'hud', 'dragon-right.png')) === 200, '右立绘上传成功');
    assert.check(await uploadFile(base, packId, 'background', path.join(EXAMPLE, 'editable', 'source-images', 'new-game-background.png')) === 200, '背景图上传成功');
    await api(base, 'PATCH', `/api/tasks/${packId}`, { config: { level: VALID_LEVEL, hud: { titleLine1: '整理颜色', titleLine2: 'HELP WATER SORT' } } });
    const packRun = await api(base, 'POST', `/api/tasks/${packId}/run`, { step: 'all' });
    assert.check(packRun.status === 200 && Array.isArray(packRun.json), '一键跑全流程成功');
    assert.equal(packRun.json.length, 5, 'water-sort 的 all 是五步');
    assert.check(packRun.json.every((single) => single.ok), `五步全部成功 (${packRun.json.filter((s) => !s.ok).map((s) => `${s.stepId}:${s.error}`).join('; ')})`);
    const backgroundStatus = (await api(base, 'GET', `/api/tasks/${packId}`)).json?.status?.steps?.background;
    assert.equal(backgroundStatus?.metrics?.source, 'background-upload', '背景步采用上传图(模糊管线)');

    const resultDir = path.join(ROOT, 'result', packId);
    assert.equal(fs.readdirSync(resultDir).sort(), FULL_DIST, 'dist 是全量交付布局(引擎+壳+overlay 媒体)');
    const distShell = fs.readFileSync(path.join(resultDir, 'index.html'), 'utf8');
    assert.check(distShell.includes('<script src="game.js" defer></script>'), 'dist 壳用经典 defer 标签加载 game.js');
    assert.check(!/type="module"|crossorigin/.test(distShell), 'dist 壳无 module/crossorigin(file:// 直开)');
    assert.check(distShell.includes('window.__WATER_SORT_LEVEL__={"name":"测试关卡"'), '关卡以内联对象注入');
    assert.check(distShell.includes('window.__NOVVY_UI__='), '__NOVVY_UI__ 文案注入');
    assert.check(distShell.includes('id="novvy-hud-title-line1"></div>'), 'HUD DOM 的文案占位为空(文案走 __NOVVY_UI__)');
    assert.check(distShell.includes('id="novvy-training-hud"'), '注入 HUD overlay');
    assert.check(distShell.includes('hud-left.webp') && distShell.includes('hud-right.webp'), 'HUD 立绘引用兄弟文件');
    assert.check(distShell.includes('id="novvy-video-intro"') && distShell.includes('src="tail-ad-video.mp4"'), '注入开场视频 overlay');
    assert.check(distShell.includes('id="novvy-dom-bg"') && distShell.includes('url("background.webp")'), '注入 DOM 背景层');
    assert.check(distShell.includes('id="novvy-cta"') && distShell.includes('src="app-icon.png"'), '注入底部 CTA 卡(图标为兄弟文件)');
    assert.check(distShell.includes('data-novvy-ws-shell') && distShell.includes('footer#hud{display:none!important}') && distShell.includes('#win{display:none!important}'), '壳层收缩:引导 footer 与胜利浮层被隐藏');
    assert.check(distShell.includes('novvy:victory'), '胜利跳转接线随 CTA 注入');
    assert.check(distShell.includes('<script data-novvy-analytics-lib>') && distShell.includes('window.NovvyAnalytics'), '埋点库以 head 内联脚本注入');
    assert.check(distShell.includes('<script data-novvy-analytics>') && distShell.includes("name: 'tail_ad_video'"), '开场视频注册媒体埋点(media_play/25/50/75/complete)');
    assert.check(distShell.indexOf('<script data-novvy-analytics>') > distShell.indexOf('<script data-novvy-cta>'), '埋点 boot 收尾 body(位于 CTA 脚本之后)');
    assert.check(distShell.includes('url(./stone.svg)'), '壳保留 stone 兜底背景');
    assert.check(!['__HUD_LEFT_DRAGON__', '__HUD_RIGHT_DRAGON__', '__NOVVY_INTRO_VIDEO__', '__NOVVY_INTRO_POSTER__', '__NOVVY_INTRO_ARIA__', '__NOVVY_BG_FILE__', '__CTA_ICON__'].some((token) => distShell.includes(token)), '无占位符残留');
    assert.check(distShell.indexOf('#novvy-dom-bg') < distShell.indexOf('id="novvy-video-intro"') && distShell.indexOf('id="novvy-video-intro"') < distShell.indexOf('id="novvy-training-hud"') && distShell.indexOf('id="novvy-training-hud"') < distShell.indexOf('id="novvy-cta"'), 'DOM 叠放顺序为 背景→intro→HUD→CTA');

    // --- overlay 可关:disabled 后 dist 不含对应 DOM 与媒体 ---
    await api(base, 'PATCH', `/api/tasks/${packId}`, { config: { hud: { enabled: false }, intro: { enabled: false } } });
    const packAgain = await api(base, 'POST', `/api/tasks/${packId}/run`, { step: 'pack' });
    assert.check(packAgain.status === 200 && packAgain.json?.metrics?.overlays?.hud === false && packAgain.json?.metrics?.overlays?.intro === false && packAgain.json?.metrics?.overlays?.cta === true, '重跑 pack 按 config 跳过 overlay(cta 仍开)');
    assert.equal(fs.readdirSync(resultDir).sort(), BARE_DIST, 'disabled 后 dist 只剩引擎/壳/背景/CTA 图标');
    const bareShell = fs.readFileSync(path.join(resultDir, 'index.html'), 'utf8');
    assert.check(!bareShell.includes('id="novvy-training-hud"') && !bareShell.includes('id="novvy-video-intro"') && !bareShell.includes('hud-left.webp'), 'disabled 后壳无 HUD/intro 痕迹');
    assert.check(bareShell.includes('id="novvy-dom-bg"'), '背景层不受 hud/intro 开关影响');
    assert.check(bareShell.includes('<script data-novvy-analytics-lib>') && bareShell.includes('<script data-novvy-analytics>'), '埋点组不随 hud/intro 开关退场(无视频时 boot 自动跳过 registerMedia)');

    // --- CTA 可关:整组原子生效(卡片 + 壳层收缩 + 胜利接线一起退场) ---
    await api(base, 'PATCH', `/api/tasks/${packId}`, { config: { cta: { enabled: false } } });
    const ctaOffRun = await api(base, 'POST', `/api/tasks/${packId}/run`, { step: 'pack' });
    assert.check(ctaOffRun.status === 200 && ctaOffRun.json?.metrics?.overlays?.cta === false, 'cta.enabled=false 时 pack 跳过 CTA 组');
    assert.equal(fs.readdirSync(resultDir).sort(), ['background.webp', 'game.js', 'index.html', 'stone.svg'], 'CTA 关闭后 dist 无图标');
    const ctaOffShell = fs.readFileSync(path.join(resultDir, 'index.html'), 'utf8');
    assert.check(!ctaOffShell.includes('id="novvy-cta"') && !ctaOffShell.includes('data-novvy-cta') && !ctaOffShell.includes('data-novvy-ws-shell'), 'CTA 关闭后壳无 CTA/收缩样式(boot 里的 #novvy-cta 选择器字符串不算 CTA DOM)');
    assert.check(ctaOffShell.includes('<script data-novvy-analytics>'), '埋点组不随 CTA 开关退场');

    // --- 在线试玩预览:overlay 与 /project/ 媒体 URL ---
    const preview = await fetch(`${base}/api/tasks/${packId}/preview`);
    assert.check(preview.status === 200, `preview 返回 200 (${preview.status})`);
    assert.check((preview.headers.get('content-type') || '').includes('text/html'), 'preview 是 text/html');
    const previewHtml = await preview.text();
    assert.check(previewHtml.includes('window.__WATER_SORT_LEVEL__={"name":"测试关卡"'), 'preview 内联注入当前关卡对象');
    assert.check(previewHtml.includes('<script src="/templates/water-sort/game/game.js" defer></script>'), 'preview 用模板绝对路径加载 game.js');
    assert.check(!previewHtml.includes('src="./game.js"'), 'preview 不按文档相对路径加载 game.js');
    assert.check(!previewHtml.includes('id="novvy-training-hud"') && !previewHtml.includes('id="novvy-video-intro"') && !previewHtml.includes('id="novvy-cta"'), 'disabled 的组不出现在预览');
    assert.check(previewHtml.includes('<script data-novvy-analytics-lib>') && previewHtml.includes('<script data-novvy-analytics>'), '预览同样注入埋点库与 boot');
    assert.check(previewHtml.includes('id="novvy-dom-bg"') && previewHtml.includes(`/project/${packId}/generated/background.webp`), '背景层用 /project/ 绝对 URL');

    await api(base, 'PATCH', `/api/tasks/${packId}`, { config: { hud: { enabled: true }, intro: { enabled: true }, cta: { enabled: true } } });
    const enabledPreview = await (await fetch(`${base}/api/tasks/${packId}/preview`)).text();
    assert.check(enabledPreview.includes('id="novvy-training-hud"') && enabledPreview.includes(`/project/${packId}/generated/hud-left.webp`), '重新启用后 HUD 出现在预览');
    assert.check(enabledPreview.includes('id="novvy-video-intro"') && enabledPreview.includes(`/project/${packId}/uploads/intro-video.mp4`), '开场视频指向 /project/ 上传件');
    assert.check(enabledPreview.includes('id="novvy-cta"') && enabledPreview.includes('/plugins/water-sort/overlays/cta/icon.png'), 'CTA 图标在预览中指向模板绝对路径');
    const coloreverPreview = await api(base, 'GET', `/api/tasks/${coloreverId}/preview`);
    assert.check(coloreverPreview.status === 400, 'colorever 任务 preview 被拒');

    // --- 关卡编辑使 level/pack 步骤记录失效 ---
    await api(base, 'PATCH', `/api/tasks/${taskId}`, { config: { level: VALID_LEVEL } });
    const rerun = await api(base, 'POST', `/api/tasks/${taskId}/run`, { step: 'level' });
    assert.check(rerun.status === 200, '修复关卡后重跑成功');
    await api(base, 'PATCH', `/api/tasks/${taskId}`, { config: { level: VALID_LEVEL } });
    const afterEdit = await api(base, 'GET', `/api/tasks/${taskId}`);
    assert.equal(afterEdit.json?.steps?.level, undefined, '编辑关卡清掉 level 步骤记录');
    assert.equal(afterEdit.json?.steps?.pack, undefined, '编辑关卡清掉 pack 步骤记录');
  } finally {
    server.close();
    for (const id of created) {
      fs.rmSync(path.join(ROOT, 'project', id), { recursive: true, force: true });
      fs.rmSync(path.join(ROOT, 'result', id), { recursive: true, force: true });
    }
  }
}
