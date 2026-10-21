import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// 校验冻结产物：build 幂等且与源逐字节一致；manifest 与源 sha 对得上；
// 源文件保有一条可注入单文件 playable 的全部结构假设（唯一锚点、无 CSP、
// super_html 通道胶水与 Cocos 画布在场）。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const built = path.resolve(root, '..', '..', 'editor', 'templates', 'colorever-origin');

function sha(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

execFileSync(process.execPath, [path.join(root, 'scripts', 'build.mjs')], { stdio: 'pipe' });

const source = path.join(root, 'src-game', 'index.html');
const entry = path.join(built, 'game', 'index.html');
if (sha(source) !== sha(entry)) throw new Error('产物与源不一致（game/index.html 被改动）');

const manifest = JSON.parse(fs.readFileSync(path.join(built, 'game-manifest.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (manifest.id !== 'colorever-origin') throw new Error('manifest.id 不符');
if (manifest.version !== pkg.version) throw new Error('manifest.version 与 package.json 不一致');
if (manifest.entry !== 'game/index.html') throw new Error('manifest.entry 不符');
if (manifest.constants?.sourceSha256 !== sha(source)) throw new Error('manifest.constants.sourceSha256 与源不符');

const bgmSource = path.join(root, 'assets', 'bgm.mp3');
const bgmBuilt = path.join(built, 'bgm.mp3');
if (sha(bgmSource) !== sha(bgmBuilt)) throw new Error('BGM 产物与源不一致（bgm.mp3 被改动）');
if (manifest.constants?.bgmSha256 !== sha(bgmBuilt)) throw new Error('manifest.constants.bgmSha256 与 BGM 不符');

const html = fs.readFileSync(entry, 'utf8');
for (const anchor of ['</head>', '<body>', '</body>']) {
  const count = html.split(anchor).length - 1;
  if (count !== 1) throw new Error(`注入锚点 ${anchor} 出现 ${count} 次（需要恰好 1 次）`);
}
if (/Content-Security-Policy/i.test(html)) throw new Error('源文件带 CSP，行内注入桥会被拦截');
for (const marker of ['GameCanvas', 'bundle_gemsort', 'super_html', 'window.__res']) {
  if (!html.includes(marker)) throw new Error(`源文件缺少 Cocos/super_html 结构标记 ${marker}`);
}
console.log(`ok: 产物逐字节一致，manifest 校验通过（${html.length} 字节）`);
