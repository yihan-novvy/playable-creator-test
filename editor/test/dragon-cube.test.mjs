import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dragonLevel, dragonHtml } from '../plugins/dragon-cube/lib.mjs';
import { runStep, loadTemplate } from '../core/runner.mjs';
import { createServer } from '../server.mjs';
import { execFile } from '../core/lib/exec.mjs';
import { deleteTask } from '../lib/store.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const templateRoot = path.join(root, 'editor', 'templates', 'dragon-cube');

export default async function run(assert) {
  const template = loadTemplate(templateRoot);
  for (let id = 1; id <= 10; id++) {
    const level = dragonLevel(templateRoot, id);
    assert.equal(level.Index, id, `Unity 第 ${id} 关可选`);
  }
  for (const id of [0, 11, '1', 1.5]) {
    let rejected = false;
    try { dragonLevel(templateRoot, id); } catch { rejected = true; }
    assert.check(rejected, `拒绝无效关卡 ${id}`);
  }
  const preview = dragonHtml({
    root: templateRoot, template, level: dragonLevel(templateRoot, 8),
    config: template.defaults,
    media: { ctaIcon: '/templates/dragon-cube/overlays/cta/icon.png' },
    preview: true,
  }).html;
  assert.check(preview.includes('window.__DRAGON_CUBE_LEVEL__={"Index":8'), '预览注入所选第 8 关');
  assert.check(preview.includes('src="/templates/dragon-cube/game/game.js"'), '预览使用绝对脚本路径');
  assert.check(preview.includes('href="/templates/dragon-cube/game/style.css"'), '预览使用绝对样式路径');
  assert.check(preview.includes('data-novvy-cta-bridge') && preview.includes('__DRAGON_CUBE_CTA_URL__'), '预览注入共享转化桥');
  assert.check(!preview.includes('data-novvy-analytics'), '纯净包：预览不注入埋点组');
  assert.check(!preview.includes('data-novvy-cta>') && !preview.includes('novvy-cta-btn'), '下载卡片组不再随包，遗留 ctaIcon 配置不生效');
  assert.check(preview.includes('window.__novvyTwoPhase=false') && preview.includes('window.__DRAGON_CUBE_PHASE2__=null'), '默认配置无双 playable');
  assert.check(preview.includes('window.__DRAGON_CUBE_CTA_POLICY__={"mode":"complete","afterSteps":8}'), '默认第一关 CTA 策略注入');
  assert.check(!/2147483000|2147482000|2147483646/.test(preview), '小值层级契约替换旧 2^31 级 z-index');
  const shell = fs.readFileSync(path.join(templateRoot, 'game', 'game.js'), 'utf8');
  assert.check(shell.includes('function loadLevel') && shell.includes('novvy:cta-moment') && shell.includes('novvy:phase2-start'), '页内换关与转化时机契约进入引擎');
  assert.check(shell.includes('haptic') && shell.includes("play('coin')"), '震动反馈契约进入引擎');
  assert.check(!shell.includes('timer-pill') && !shell.includes('formatTime') && !shell.includes('state.left'), '右上角倒计时不进引擎（限时失败一并移除）');
  assert.check(shell.includes('playWinThen') && /playWinThen[\s\S]*?novvy:victory/.test(shell), '胜利音乐播完才派发 novvy:victory');
  assert.check(shell.includes("fire('novvy:playable-complete'") && /novvy:playable-complete[\s\S]*?playWinThen/.test(shell), '最后一步完成即派发 novvy:playable-complete（先于胜利音乐收尾）');
  assert.check(/if \(armedPolicy\) announceCtaMoment\(\)/.test(shell), 'steps 策略完成时兜底派发转化时刻');
  assert.check(!shell.includes('level-number') && shell.includes('applyHudTitle') && shell.includes('hud-title-line1'), '顶栏 LEVEL 角标已换成 HUD 标题（第二关换关时切换）');
  assert.check(preview.includes('window.__DRAGON_CUBE_HUD_TITLE__={"titleLine1":"DragonCube"'), 'HUD 标题配置注入预览');
  assert.check(preview.includes('data-novvy-hud') && preview.includes('id="novvy-training-hud" data-title-only') && preview.includes('novvy-hud-title-line1'), '仅标题 HUD 叠层随 colorever 同款样式注入');
  assert.check(!preview.includes('__HUD_LEFT_DRAGON__') && !preview.includes('hud-left.webp'), '仅标题模式剥离立绘节点，不依赖立绘素材');
  assert.check(preview.includes('.top-ui{visibility:hidden}'), 'HUD 叠层在场时收起引擎原生顶栏标题卡，避免双标题');
  assert.check(!shell.includes("addEventListener('novvy:intro-finished', startMusic)") && shell.includes('introMusicKick'), '片头结束自动起 BGM（补偿覆盖层 220ms 延迟移除）');
  assert.check(!/primeAudio\(\);\s*\n\s*reset\(\)/.test(shell), '开局不自动起声（仅视频播完切换 playable 时自动起播）');
  assert.check(/addEventListener\('novvy:phase2-start'[\s\S]*?primeAudio\(\); startMusic\(\)/.test(shell), '第二关就绪自动恢复 BGM');
  assert.check(preview.includes('window.__DRAGON_CUBE_IMAGES__={"first":[],"second":[]}'), '未开启自定义图片时不添加无效预加载资源');

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-cube-test-'));
  let server = null, id = null, phase2Temp = null;
  try {
    const projectRoot = path.join(temp, 'project');
    const resultRoot = path.join(temp, 'dist');
    fs.mkdirSync(path.join(projectRoot, 'generated'), { recursive: true });
    for (const levelId of [1, 8]) {
      const options = { taskId: 'smoke', templateRoot, scriptsRoot: path.join(root, 'editor', 'core', 'scripts'), projectRoot, resultRoot, config: { levelId }, engine: null };
      const levelResult = await runStep({ ...options, stepId: 'level' });
      assert.check(levelResult.ok, `第 ${levelId} 关校验步骤成功`);
      const packResult = await runStep({ ...options, stepId: 'pack' });
      assert.check(packResult.ok, `第 ${levelId} 关打包成功: ${packResult.error || ''}`);
      const html = fs.readFileSync(path.join(resultRoot, 'index.html'), 'utf8');
      assert.check(html.includes(`window.__DRAGON_CUBE_LEVEL__={"Index":${levelId}`), `第 ${levelId} 关进入广告包`);
      assert.check(!/type="module"|fetch\(["'](?:\.\/)?(?:levels?|assets)\//.test(html), '游戏资产无需模块脚本或运行时读取');
      assert.check(fs.existsSync(path.join(resultRoot, 'assets', 'Cat_Blue.png')), 'Unity 小猫素材进入广告包');
      assert.check(fs.existsSync(path.join(resultRoot, 'assets', 'bg-default.jpg')), '包内默认底图进入广告包');
      assert.check(!fs.readdirSync(resultRoot).some((name) => /^level\d+\.html$/.test(name)), '独立关卡入口不进广告包');
      assert.check(!fs.existsSync(path.join(resultRoot, 'assets', 'background.png')), '原版整图背景不进广告包(背景由 editor 模糊管线提供)');
    }

    // —— 双 playable 端到端：建任务 → 开片尾与第二关 → 上传片尾 → 全流程构建 ——
    phase2Temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-cube-phase2-'));
    server = createServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const api = async (url, body, method = 'POST') => {
      const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      return { status: res.status, body: await res.json() };
    };
    const created = await api('/api/tasks', { name: 'dragon-phase2-' + Date.now(), templateId: 'dragon-cube' });
    id = created.body.id;
    const patched = await api(`/api/tasks/${id}`, { config: { outro: { enabled: true }, secondPlayable: { enabled: true, levelId: 2, cta: { mode: 'steps', afterSteps: 5 } } } }, 'PATCH');
    assert.check(patched.status === 200 && patched.body.config.secondPlayable.enabled, '双 playable 与片尾设置可以保存');
    const videoPath = path.join(phase2Temp, 'outro.mp4');
    await execFile('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'color=c=blue:s=32x32:r=5:d=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', videoPath]);
    const uploaded = await fetch(base + `/api/tasks/${id}/uploads/outro-video`, { method: 'PUT', headers: { 'Content-Type': 'video/mp4' }, body: fs.readFileSync(videoPath) });
    assert.equal(uploaded.status, 200, '支持上传片尾 MP4');
    const built = await api(`/api/tasks/${id}/run`, { step: 'all' });
    assert.check(built.status === 200 && built.body.every((r) => r.ok), `双 playable 全流程构建成功: ${JSON.stringify(built.body.filter((r) => !r.ok).map((r) => r.stepId + ':' + r.error))}`);
    assert.equal(built.body.find((r) => r.stepId === 'level').metrics.phase2, 2, '关卡步骤导出第二关');
    const packMetrics = built.body.find((r) => r.stepId === 'pack').metrics;
    assert.check(!packMetrics.packageFiles.includes('app-icon.png'), '下载卡片图标不再进入交付包');
    assert.equal(packMetrics.phase2, 2, '打包指标携带第二关编号');
    const packed = await (await fetch(base + `/result/${id}/index.html`)).text();
    assert.check(packed.includes('window.__novvyTwoPhase=true'), '交付包内联双 playable 开关');
    assert.check(packed.includes('window.__DRAGON_CUBE_PHASE2__={"levelId":2'), '交付包内联第二关数据');
    assert.check(packed.includes('"mode":"steps","afterSteps":5'), '第二关转化时机进入内联数据');
    assert.check(packed.includes('window.__DRAGON_CUBE_HUD_TITLE__'), 'HUD 标题配置进入交付包');
    assert.check(packed.includes('data-novvy-cta-bridge') && packed.includes('__DRAGON_CUBE_CTA_URL__'), '转化桥进入交付包');
    assert.check(!packed.includes('data-novvy-analytics') && !packed.includes('data-novvy-cta>'), '纯净包：埋点组与旧下载卡片组不随包');
    assert.check(packed.includes('id="novvy-video-outro"'), '片尾覆盖层进入交付包');
    assert.check((await fetch(base + `/result/${id}/assets/bg-default.jpg`)).status === 200, '包内默认底图随交付包分发');
    const packedCss = await (await fetch(base + `/result/${id}/style.css`)).text();
    assert.check(packedCss.includes('assets/bg-default.jpg'), '默认底图由壳样式引用');
    assert.check(!packedCss.includes('timer-pill'), '倒计时样式不进交付包');
    const livePreview = await (await fetch(base + `/api/tasks/${id}/preview`)).text();
    assert.check(livePreview.includes('src="/templates/dragon-cube/game/game.js"'), '在线预览可用（工作台试玩按钮修复）');
  } finally {
    if (id) deleteTask(id);
    if (server) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(temp, { recursive: true, force: true });
    if (phase2Temp) fs.rmSync(phase2Temp, { recursive: true, force: true });
  }
}
