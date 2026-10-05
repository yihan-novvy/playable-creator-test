import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLevel } from '../src/level-model.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
test('Unity 前十关都符合 H5 支持范围，且色块目标与猫数量一致', () => {
  for (let i = 1; i <= 10; i++) {
    const level = JSON.parse(fs.readFileSync(path.join(root, 'src', 'levels', `${i}.json`), 'utf8'));
    const metrics = validateLevel(level, i);
    assert.ok(metrics.cats > 0);
    assert.ok(metrics.boxes > 0);
    assert.equal(level.Cells.some((cell) => cell.Block), i >= 7);
  }
});
test('关卡编号或颜色数量错误时拒绝构建', () => {
  const level = JSON.parse(fs.readFileSync(path.join(root, 'src', 'levels', '1.json'), 'utf8'));
  assert.throws(() => validateLevel(level, 2));
  level.Boxes[0].Count += 1;
  assert.throws(() => validateLevel(level, 1));
});
