import fs from 'node:fs';
import path from 'node:path';
import { dragonLevel } from '../lib.mjs';

export function prerequisites() {
  return { uploads: [], generated: [] };
}

export async function run(ctx) {
  const level = dragonLevel(ctx.templateRoot, ctx.config.levelId);
  fs.writeFileSync(path.join(ctx.generatedDir, 'level.json'), JSON.stringify(level));
  // 双 playable:第二关仅在有片尾视频时允许(与 pack 的 gating 同源)。
  const outroActive = ctx.config.outro?.enabled === true && fs.existsSync(ctx.uploads['outro-video']);
  const phase2 = outroActive && ctx.config.secondPlayable?.enabled === true
    ? dragonLevel(ctx.templateRoot, ctx.config.secondPlayable?.levelId ?? 2)
    : null;
  if (phase2) fs.writeFileSync(path.join(ctx.generatedDir, 'level2.json'), JSON.stringify(phase2));
  return { metrics: { levelId: level.Index, cells: level.Cells.length, boxes: level.Boxes.length, timeLimit: level.TimeLimit, phase2: phase2 ? phase2.Index : null }, warnings: [] };
}
