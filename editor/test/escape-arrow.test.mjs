import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeLevel, escapeHtmlPage } from '../plugins/escape-arrow/lib.mjs';
import { getEntry } from '../core/registry.mjs';
import { runStep } from '../core/runner.mjs';
import { createServer } from '../server.mjs';
import { deleteTask, recordStepResult, readTask, recordUpload, clearUpload } from '../lib/store.mjs';
import { execFile } from '../core/lib/exec.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const templateRoot = path.join(root, 'editor/templates/escape-arrow');

export default async function run(assert) {
  const entry = getEntry('escape-arrow');
  assert.equal(entry.template.gallery, 'gallery.html', '清单提供试玩总览入口');
  assert.equal(entry.template.level.max, 100, '注册范围上限为第 100 关');
  for (const [directory, extension] of [['levels', 'json'], ['previews', 'svg'], ['play', 'html']]) {
    const ids = fs.readdirSync(path.join(templateRoot, directory)).map(file => Number(file.replace(`.${extension}`, ''))).sort((a, b) => a - b);
    assert.equal(JSON.stringify(ids), JSON.stringify(Array.from({ length: 100 }, (_, index) => index + 1)), `${directory} 仅保留第 1–100 关`);
  }
  for (let id = 1; id <= 100; id++) assert.equal(escapeLevel(templateRoot, id).Index, id, `原版第 ${id} 关可选`);
  for (const id of [0, 101, 634, '1', 1.1]) {
    let rejected = false; try { escapeLevel(templateRoot, id); } catch { rejected = true; }
    assert.check(rejected, `拒绝无效关卡 ${id}`);
  }
  const built = escapeHtmlPage({ root: templateRoot, template: entry.template, level: escapeLevel(templateRoot, 100), config: entry.template.defaults, media: { ctaIcon: '/templates/escape-arrow/app-icon.png' }, preview: true }).html;
  assert.check(built.includes('window.__ESCAPE_ARROW_LEVEL__={"Index":100'), '预览注入第 100 关');
  assert.check(built.includes('window.__novvyReplayable=true') && built.includes('data-novvy-playable-bridge'), '失败重玩接入共享段桥');
  assert.check(built.includes('/templates/escape-arrow/game/game.js') && built.includes('/templates/escape-arrow/game/style.css'), '预览游戏路径正确');
  assert.check(built.includes('min-height:calc(148px'), '为下载卡预留棋盘外空间');
  assert.check(built.includes('<body data-theme="night">') && built.includes('id="novvy-cta"') && built.includes('id="novvy-training-hud"'), '带主题属性的 body 正确注入 HUD 和下载卡 DOM');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'escape-arrow-editor-'));
  let server, taskId;
  try {
    const projectRoot = path.join(tmp, 'project'), resultRoot = path.join(tmp, 'result');
    fs.mkdirSync(path.join(projectRoot, 'generated'), { recursive: true });
    for (const levelId of [1, 100]) {
      const options = { taskId: 'smoke', templateId: entry.id, projectRoot, resultRoot, config: { levelId } };
      assert.check((await runStep({ ...options, stepId: 'level' })).ok, `第 ${levelId} 关导出成功`);
      const result = await runStep({ ...options, stepId: 'pack' });
      assert.check(result.ok, `第 ${levelId} 关打包成功: ${result.error || ''}`);
      const html = fs.readFileSync(path.join(resultRoot, 'index.html'), 'utf8');
      assert.check(html.includes(`window.__ESCAPE_ARROW_LEVEL__={"Index":${levelId}`), '选定关卡进入广告包');
      assert.check(!html.includes('type="module"') && fs.existsSync(path.join(resultRoot, 'assets/sfx/escape.m4a')), '离线脚本及 Unity 音效进入包');
      assert.check(!fs.existsSync(path.join(resultRoot, 'levels')), '关卡库不全量带进交付包');
      assert.check(!fs.existsSync(path.join(resultRoot, 'play')) && !fs.existsSync(path.join(resultRoot, 'gallery.html')), '关卡试玩入口与总览不进入广告交付包');
    }
    server = createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const api = async (url, body, method = 'POST') => {
      const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      return { status: res.status, body: await res.json() };
    };
    assert.check((await (await fetch(base + '/api/templates')).json()).some(item => item.id === entry.id), '模版自动注册到 editor');
    taskId = (await api('/api/tasks', { name: 'escape-arrow-test-' + Date.now(), templateId: entry.id })).body.id;
    const patch = { levelId: 100, outro: { enabled: true }, secondPlayable: { enabled: true, levelId: 100, cta: { mode: 'steps', afterSteps: 4 }, background: { enabled: true, source: 'video-last' } } };
    const saved = await api(`/api/tasks/${taskId}`, { config: patch }, 'PATCH');
    assert.equal(saved.status, 200, '保存第 100 关及双 playable 设置');
    assert.equal(saved.body.config.secondPlayable.levelId, 100, '第二关也可保存第 100 关');
    for (const bad of [{ levelId: 101 }, { secondPlayable: { levelId: 101 } }]) {
      assert.equal((await api(`/api/tasks/${taskId}`, { config: bad }, 'PATCH')).status, 400, '两关选择都拒绝越界');
    }
    assert.equal(readTask(taskId).config.levelId, 100, '非法保存没有覆盖原关卡');
    const video = path.join(tmp, 'outro.mp4');
    await execFile('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=blue:s=32x32:r=5:d=0.4', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', video]);
    const upload = await fetch(`${base}/api/tasks/${taskId}/uploads/outro-video`, { method: 'PUT', headers: { 'Content-Type': 'video/mp4' }, body: fs.readFileSync(video) });
    assert.equal(upload.status, 200, '片尾 MP4 上传成功');
    const all = await api(`/api/tasks/${taskId}/run`, { step: 'all' });
    assert.check(all.status === 200 && all.body.every(step => step.ok), `双关含独立背景全流程成功: ${JSON.stringify(all.body)}`);
    const packed = await (await fetch(`${base}/result/${taskId}/index.html`)).text();
    assert.check(packed.includes('window.__ESCAPE_ARROW_PHASE2__={"levelId":100'), '第二关数据正确内联');
    assert.check(packed.includes('window.__novvyStageChain__=["playable","video","playable"]'), '双 playable 段链正确');
    assert.equal((await fetch(`${base}/result/${taskId}/background2.webp`)).status, 200, '第二关背景进入包');
    assert.equal((await fetch(`${base}/api/tasks/${taskId}/preview`)).status, 200, '在线预览正常');
    assert.equal((await fetch(base + '/templates/escape-arrow/previews/100.svg')).status, 200, '第 100 关缩略图可访问');
    assert.equal((await fetch(base + '/templates/escape-arrow/play/101.html')).status, 404, '第 101 关试玩已移除');
    recordStepResult(taskId, { stepId: 'level', ok: true });
    recordStepResult(taskId, { stepId: 'pack', ok: true });
    recordUpload(taskId, 'outro-video', { bytes: 1 });
    assert.check(!readTask(taskId).steps.level && !readTask(taskId).steps.pack, '片尾更新使双关导出和包失效');
    clearUpload(taskId, 'outro-video');
    const stale = await api(`/api/tasks/${taskId}`, { config: { levelId: 1, outro: { enabled: false } } }, 'PATCH');
    assert.equal(stale.status, 200, '可切回单 playable');
    const single = await api(`/api/tasks/${taskId}/run`, { step: 'all' });
    assert.check(single.status === 200 && single.body.every(step => step.ok), '双关任务切回单关可重新打包');
    assert.check(!fs.existsSync(path.join(root, `project/${taskId}/generated/level2.json`)), '清理过期第二关数据');
    const singleHtml = await (await fetch(`${base}/result/${taskId}/index.html`)).text();
    assert.check(singleHtml.includes('window.__ESCAPE_ARROW_PHASE2__=null') && !fs.existsSync(path.join(root, `result/${taskId}/outro-video.mp4`)), '单关包移除旧片尾与第二关');
  } finally {
    if (taskId) deleteTask(taskId);
    if (server) await new Promise(resolve => server.close(resolve));
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
