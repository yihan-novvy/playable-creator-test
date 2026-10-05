import fs from 'node:fs';
import path from 'node:path';
import { run as spawnRun } from '../../../core/lib/exec.mjs';
import { requireFiles } from '../../../core/lib/helpers.mjs';

export function prerequisites() {
  return { uploads: [], generated: ['pattern.json'] };
}

async function step(ctx) {
  const patternPath = path.join(ctx.generatedDir, 'pattern.json');
  const outPath = path.join(ctx.generatedDir, 'levels.json');
  requireFiles([patternPath]);
  await spawnRun('node', [
    path.join(ctx.pluginScriptsDir, 'write-levels.mjs'),
    '--pattern', patternPath,
    '--template-root', ctx.templateRoot,
    '--out', outPath,
  ]);
  const artifact = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  const { metrics } = artifact;
  return {
    metrics: {
      width: artifact.width,
      height: artifact.height,
      activeCells: metrics.activeCells,
      openingCompletion: metrics.openingCompletion,
      componentCount: metrics.componentCount,
      largestComponent: metrics.largestComponent,
      singletonCount: metrics.singletonCount,
      shift: metrics.shift,
      scrambleMethod: metrics.scrambleMethod,
      certifiedMoveCount: metrics.certifiedMoveCount,
      movePatchCount: metrics.movePatchCount,
      patchSize: metrics.patchSize,
      moveCyclePatchColors: metrics.moveCyclePatchColors,
      seed: metrics.seed,
      colorCounts: metrics.colorCounts,
      colorNames: artifact.tileNames,
      levels: artifact.levels.map((level) => level.name),
    },
    warnings: artifact.warnings || [],
  };
}

export { step as run };
