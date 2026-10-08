import fs from 'node:fs';
import { probeVideo } from '../../../core/lib/exec.mjs';

export function prerequisites() {
  return { uploads: [], generated: [] };
}

export async function run(ctx) {
  const source = ctx.uploads['outro-video'];
  if (ctx.config.outro?.enabled !== true || !fs.existsSync(source)) {
    return { metrics: { skipped: true }, warnings: [] };
  }
  const video = await probeVideo(source);
  return { metrics: { ...video, videoBytes: fs.statSync(source).size }, warnings: [] };
}
