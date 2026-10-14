import { run as runHud } from '../../../core/steps/hud.mjs';

export { prerequisites } from '../../../core/steps/hud.mjs';

// Colorever 的标题独立展示，未上传的立绘不作为构建依赖。
export async function run(ctx) {
  return runHud({ ...ctx, hudOptionalPortraits: true });
}
