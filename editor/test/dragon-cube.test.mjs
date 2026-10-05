import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dragonLevel, dragonHtml } from '../core/lib/dragon-cube.mjs';
import { runStep, loadTemplate } from '../core/runner.mjs';

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

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-cube-test-'));
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
      assert.check(!fs.readdirSync(resultRoot).some((name) => /^level\d+\.html$/.test(name)), '独立关卡入口不进广告包');
      assert.check(!fs.existsSync(path.join(resultRoot, 'assets', 'background.png')), '原版整图背景不进广告包(背景由 editor 模糊管线提供)');
    }
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
