import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from '../server.mjs';
import { deleteTask, uploadPath } from '../lib/store.mjs';
import { taskResultDir } from '../lib/paths.mjs';
import { embeddedAudio, taskGameScript } from '../plugins/colorever/music.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export default async function run(assert) {
  const template = path.join(root, 'editor/templates/colorever');
  const original = fs.readFileSync(path.join(template, 'game/game.js'), 'utf8');
  const originalAudio = embeddedAudio(original);
  const replacement = fs.readFileSync(path.join(root, 'template-core/colorever/public/audio/pickup.mp3'));
  assert.equal(taskGameScript(template, {}, null), original, '旧任务保持模版原样');
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const ids = [];
  const api = async (url, body, method = 'POST') => {
    const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: res.status, body: await res.json() };
  };
  try {
    const created = await api('/api/tasks', { name: `music-test-${Date.now()}`, templateId: 'colorever' });
    const id = created.body.id; ids.push(id);
    const url = `/api/tasks/${id}`;
    const runStep = step => api(url + '/run', { step });
    assert.equal((await api(url, { config: { music: { source: 'invalid' } } }, 'PATCH')).status, 500, '拒绝未知音乐来源');
    let res = await fetch(base + url + '/music');
    assert.check(res.ok && Buffer.from(await res.arrayBuffer()).equals(Buffer.from(originalAudio.audio.bgm, 'base64')), '原版音乐可试听');
    await runStep('level'); await runStep('pack');
    res = await fetch(base + url + '/uploads/background-music', { method: 'PUT', headers: { 'Content-Type': 'audio/mpeg', 'x-novvy-original-name': 'new-music.mp3' }, body: replacement });
    assert.equal(res.status, 200, '任务接受 MP3 上传');
    const patch = await api(url, { config: { music: { source: 'custom' } } }, 'PATCH');
    assert.check(patch.body.steps.level && !patch.body.steps.pack, '音乐更换只使打包失效');
    res = await fetch(base + url + '/preview');
    assert.check((await res.text()).includes(`src="${url}/preview-game.js"`), '预览使用任务专属游戏脚本');
    const preview = await (await fetch(base + url + '/preview-game.js')).text();
    const changed = embeddedAudio(preview);
    assert.equal(changed.audio.bgm, replacement.toString('base64'), '预览 BGM 为上传内容');
    assert.equal(preview.slice(changed.length), original.slice(originalAudio.length), '游戏执行代码保持原样');
    for (const key of Object.keys(originalAudio.audio).filter(key => key !== 'bgm')) assert.equal(changed.audio[key], originalAudio.audio[key], `音效 ${key} 保持原样`);
    assert.check(!preview.includes(originalAudio.audio.bgm), '任务脚本不再携带原版 BGM');
    res = await fetch(base + url + '/music');
    assert.check(Buffer.from(await res.arrayBuffer()).equals(replacement), '新音乐试听与任务脚本一致');
    const packed = await runStep('pack');
    assert.check(packed.body.ok, '自定义音乐任务打包成功');
    assert.equal(fs.readdirSync(taskResultDir(id)).sort(), ['game.js', 'index.html'], '不额外打包音乐文件');
    assert.equal(fs.readFileSync(path.join(taskResultDir(id), 'game.js'), 'utf8'), preview, '预览与导出游戏脚本逐字节一致');
    assert.equal(fs.readFileSync(path.join(template, 'game/game.js'), 'utf8'), original, '共享模版未修改');
    await api(url, { config: { music: { source: 'original' } } }, 'PATCH');
    assert.check((await runStep('pack')).body.ok, '保留上传音乐时也可切回原版打包');
    assert.equal(fs.readFileSync(path.join(taskResultDir(id), 'game.js'), 'utf8'), original, '切回原版不会内嵌上传音乐');
    await api(url, { config: { music: { source: 'custom' } } }, 'PATCH');

    const other = await api('/api/tasks', { name: `music-other-${Date.now()}`, templateId: 'colorever' }); ids.push(other.body.id);
    assert.equal(await (await fetch(base + `/api/tasks/${other.body.id}/preview-game.js`)).text(), original, '其他任务仍使用原版音乐');
    assert.equal((await fetch(base + `/api/tasks/${other.body.id}/uploads/background-music`, { method: 'DELETE' })).status, 200, '未配置音乐的新任务也可清除上传槽位');

    res = await fetch(base + url + '/uploads/background-music', { method: 'PUT', body: Buffer.from('this is not an mp3 audio file') });
    assert.equal(res.status, 415, '拒绝错误文件内容');
    assert.check(fs.readFileSync(uploadPath(id, 'background-music')).equals(replacement), '错误上传不会覆盖已有音乐');
    fs.rmSync(uploadPath(id, 'background-music'));
    assert.equal((await fetch(base + url + '/preview-game.js')).status, 400, '缺少音乐时预览明确报错');
    assert.check(!(await runStep('pack')).body.ok, '缺少选中的音乐阻止打包');
    await fetch(base + url + '/uploads/background-music', { method: 'DELETE' });
    const restored = await (await fetch(base + url)).json();
    assert.equal(restored.config.music.source, 'original', '移除音乐恢复原版');
    assert.check((await runStep('pack')).body.ok, '恢复原版后可重新打包');
    assert.equal(fs.readFileSync(path.join(taskResultDir(id), 'game.js'), 'utf8'), original, '恢复原版后导出与模版一致');
  } finally {
    for (const id of ids) deleteTask(id);
    await new Promise(resolve => server.close(resolve));
  }
}
