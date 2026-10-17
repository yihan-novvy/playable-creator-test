import fs from 'node:fs';
import path from 'node:path';
import { escapeLevel } from '../lib.mjs';

export function prerequisites() { return { uploads: [], generated: [] }; }

export async function run(ctx) {
  const level = escapeLevel(ctx.templateRoot, ctx.config.levelId);
  fs.writeFileSync(path.join(ctx.generatedDir, 'level.json'), JSON.stringify(level));
  const outroActive = ctx.config.outro?.enabled === true && fs.existsSync(ctx.uploads['outro-video']);
  const second = outroActive && ctx.config.secondPlayable?.enabled === true
    ? escapeLevel(ctx.templateRoot, ctx.config.secondPlayable.levelId ?? 2) : null;
  const secondPath = path.join(ctx.generatedDir, 'level2.json');
  if (second) fs.writeFileSync(secondPath, JSON.stringify(second));
  else fs.rmSync(secondPath, { force: true });
  return { metrics: { levelId: level.Index, width: level.GridXSize, height: level.GridYSize, arrows: level.Arrows.length, phase2: second?.Index ?? null }, warnings: [] };
}
