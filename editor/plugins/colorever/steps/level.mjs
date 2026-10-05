import fs from 'node:fs';
import path from 'node:path';
import { coloreverLevel } from '../lib.mjs';

export function prerequisites() {
  return { uploads: [], generated: [] };
}

export async function run(ctx) {
  const { level, proof } = coloreverLevel(ctx.templateRoot, ctx.config, ctx.template);
  fs.writeFileSync(path.join(ctx.generatedDir, 'level.json'), JSON.stringify(level));
  return { metrics: { name: level.name, width: level.width, height: level.height, cells: level.target.filter(Boolean).length, colors: new Set(level.target.filter(Boolean)).size, solutionMoves: proof.moves, solvable: true }, warnings: [] };
}
