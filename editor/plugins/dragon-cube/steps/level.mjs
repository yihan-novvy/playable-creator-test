import fs from 'node:fs';
import path from 'node:path';
import { dragonLevel } from '../lib.mjs';

export function prerequisites() {
  return { uploads: [], generated: [] };
}

export async function run(ctx) {
  const level = dragonLevel(ctx.templateRoot, ctx.config.levelId);
  fs.writeFileSync(path.join(ctx.generatedDir, 'level.json'), JSON.stringify(level));
  return { metrics: { levelId: level.Index, cells: level.Cells.length, boxes: level.Boxes.length, timeLimit: level.TimeLimit }, warnings: [] };
}
