import fs from 'node:fs';
import path from 'node:path';
import { taskResultDir } from './paths.mjs';
import { run } from '../core/lib/exec.mjs';

// Both manual export and publishing use the exact same package contents.
export async function archiveTask(taskId, target) {
  const root = taskResultDir(taskId);
  if (!fs.existsSync(path.join(root, 'index.html'))) {
    throw Object.assign(new Error('该任务还没有打包产物，请先运行打包'), { statusCode: 409 });
  }
  await run('zip', ['-q', '-r', '-X', target, '.', '-x', '*.zip'], { cwd: root });
}
