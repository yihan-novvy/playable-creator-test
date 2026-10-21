import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { originCtaPolicy, originCtaSchedule, originHtml } from '../plugins/colorever-origin/lib.mjs';
import { getEntry } from '../core/registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const templateRoot = path.join(root, 'editor/templates/colorever-origin');
const sha = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

export default async function run(assert) {
  const entry = getEntry('colorever-origin');

  // —— 冻结产物：源/产物/清单三方 sha 一致 ——
  const source = path.join(root, 'template-core/colorever-origin/src-game/index.html');
  const built = path.join(templateRoot, 'game/index.html');
  assert.equal(sha(source), sha(built), '入库产物与冻结源逐字节一致');
  const manifest = JSON.parse(fs.readFileSync(path.join(templateRoot, 'game-manifest.json'), 'utf8'));
  assert.equal(manifest.constants.sourceSha256, sha(built), '清单 sha 与产物一致');
  assert.equal(entry.template.game.indexHtml, 'game/index.html', 'registry 合成 game.indexHtml');

  // —— CTA 循环节奏纯函数 ——
  const defaults = entry.template.defaults.playableCta;
  assert.equal(originCtaPolicy(defaults), { mode: 'steps', afterSteps: 10, intervals: [5, 4, 3, 2] }, '默认策略 = 10 步首跳 + 5/4/3/2 间隔表');
  assert.equal(
    originCtaSchedule(originCtaPolicy(defaults)).slice(0, 8).map((item) => item.step),
    [10, 15, 19, 22, 24, 26, 28, 30],
    '触发点表 10 → +5 → +4 → +3 → +2 → 之后每 2 步',
  );
  assert.equal(originCtaSchedule({ mode: 'steps', afterSteps: 10, intervals: [] }).map((item) => item.step), [10], '间隔表剔空 = 只保留首跳');
  assert.equal(originCtaSchedule({ mode: 'complete', afterSteps: 10, intervals: [5] }), [], 'complete 模式无步数循环');
  assert.equal(originCtaPolicy({ mode: 'steps', afterSteps: 10, intervals: [3, 0, -1, 2.5, 'x', 200, 4] }).intervals, [3, 4], '非法间隔逐项剔除');
  assert.equal(originCtaPolicy({}).afterSteps, 8, '非法 afterSteps 回退共享默认 8');

  // —— 注入组装（预览形态，读真实冻结产物） ——
  const html = fs.readFileSync(built, 'utf8');
  const withIntro = originHtml({
    root: templateRoot, template: entry.template,
    config: { ...entry.template.defaults, intro: { ...entry.template.defaults.intro, enabled: true } },
    media: { introVideo: 'tail-ad-video.mp4', introPoster: 'poster.webp' },
    preview: true,
  });
  assert.equal(withIntro.stageChain, ['video', 'playable'], '片头启用时段链 = video + playable');
  assert.check(withIntro.html.includes('id="novvy-video-intro"') && withIntro.html.includes('data-novvy-intro'), '注入 core 片头三件套');
  assert.equal(withIntro.html.split('</head>').length - 1, 1, 'head 锚点拼接后仍唯一');
  assert.equal(withIntro.html.split('</body>').length - 1, 1, 'body 锚点拼接后仍唯一');

  const withoutIntro = originHtml({ root: templateRoot, template: entry.template, config: entry.template.defaults, media: {}, preview: true });
  assert.equal(withoutIntro.stageChain, ['playable'], '片头关闭时段链 = 单 playable');
  assert.check(!withoutIntro.html.includes('id="novvy-video-intro"'), '片头关闭不注入片头 DOM');

  for (const built of [withIntro, withoutIntro]) {
    const out = built.html;
    assert.check(out.includes('data-novvy-playable-bridge') && out.includes('data-novvy-cta-bridge'), '段桥与转化桥都在场');
    assert.check(out.includes('__ORIGIN_CTA_URL__'), '转化桥 URL 变量替换为 origin 专属全局名');
    assert.check(out.includes('data-novvy-origin-engine'), '注入 origin 引擎适配');
    assert.check(out.includes('"__novvyStageChain__"') || out.includes('window.__novvyStageChain__='), '段链字面量注入');
    assert.check(out.includes('window.__NOVVY_CTA_END_MASK__=false'), 'endMask 默认 false（colorever-new 回访每击语义）');
    assert.check(out.includes('"schedule":[{"step":10,"gap":5}'), '循环节奏表随策略注入');
    assert.check(!out.includes('data-novvy-cta-card') && !out.includes('id="novvy-cta"'), '不注入 cta-card（CTA 用 playable 自带横幅）');
    assert.check(out.includes('GameCanvas') && out.includes('bundle_gemsort') && out.includes('super_html'), 'playable 本体结构完整');
    assert.check(out.includes('__CTA_URL_KEY__') === false, '桥占位符无残留');
    assert.check(!/__NOVVY_INTRO_VIDEO__|__NOVVY_INTRO_POSTER__|__HUD_[LR]/.test(out), '覆盖层占位符无残留');
    // playable 本体除注入外一字节不改：剥掉注入后与源完全一致。
    const stripped = out
      .replace(/<script>window\.__novvyStageChain__[\s\S]*?<\/script>\n?/, '')
      .replace(/<style data-novvy-intro>[\s\S]*?<\/style>\n?<\/head>/, '</head>')
      .replace(/<div id="novvy-video-intro"[\s\S]*?<script data-novvy-cta-bridge>[\s\S]*?<\/script>\n?<\/body>/, '</body>')
      .replace(/<script data-novvy-playable-bridge>[\s\S]*?<script data-novvy-cta-bridge>[\s\S]*?<\/script>\n?<\/body>/, '</body>');
    assert.equal(stripped, html, '剥离注入后与冻结源逐字节一致');
  }

  // —— previewHtml 钩子签名 ——
  assert.equal(typeof (await import('../plugins/colorever-origin/lib.mjs')).previewHtml, 'function', '提供在线预览钩子');
}
