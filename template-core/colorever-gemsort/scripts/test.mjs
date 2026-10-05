import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// 校验 build 产物与冻结源逐字节一致（含 manifest）。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'gemsort-build-'));
try {
  execFileSync(process.execPath, [path.join(root, 'scripts', 'build.mjs')], { stdio: 'pipe' });
  const source = path.join(root, 'src-game');
  const built = path.join(root, '..', '..', 'editor', 'templates', 'colorever-gemsort', 'game');
  const sha = file => execFileSync('shasum', ['-a', '256', file]).toString().trim().split(/\s+/)[0];
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [path.relative(source, full)];
  });
  const files = walk(source).sort();
  if (files.length === 0) throw new Error('冻结源为空');
  for (const rel of files) {
    if (sha(path.join(source, rel)) !== sha(path.join(built, rel))) throw new Error(`产物与源不一致: ${rel}`);
  }
  JSON.parse(fs.readFileSync(path.join(root, '..', '..', 'editor', 'templates', 'colorever-gemsort', 'game-manifest.json'), 'utf8'));
  console.log(`ok: ${files.length} 个文件逐字节一致，manifest 可解析`);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
