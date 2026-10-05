import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from '../core/lib/exec.mjs';

export default async function run(assert) {
  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'pattern-colors.test.py');
  await execFile('python3', [script]);
  assert.check(true, 'dominant eight colors, rare-color merging, empty cells, inventory and preview agree');
}
