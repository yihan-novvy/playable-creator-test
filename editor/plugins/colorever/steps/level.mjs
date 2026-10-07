import fs from 'node:fs';
import path from 'node:path';
import { coloreverLevel, coloreverPhase2 } from '../lib.mjs';

export function prerequisites() {
  return { uploads: [], generated: [] };
}

export async function run(ctx) {
  const { level, proof } = coloreverLevel(ctx.templateRoot, ctx.config, ctx.template);
  fs.writeFileSync(path.join(ctx.generatedDir, 'level.json'), JSON.stringify(level));
  // 双 playable:第二关仅在有片尾视频时允许(与 pack 的 gating 同源)。
  const phase2 = coloreverPhase2(ctx.templateRoot, ctx.config, ctx.template, ctx.config.outro?.enabled === true && fs.existsSync(ctx.uploads['outro-video']));
  if (phase2) fs.writeFileSync(path.join(ctx.generatedDir, 'level2.json'), JSON.stringify(phase2.level));
  return { metrics: { name: level.name, width: level.width, height: level.height, cells: level.target.filter(Boolean).length, colors: new Set(level.target.filter(Boolean)).size, solutionMoves: proof.moves, solvable: true, phase2: phase2 ? phase2.patternId : null }, warnings: [] };
}
