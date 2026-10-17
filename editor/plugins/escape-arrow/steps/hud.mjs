import { run as runHud } from '../../../core/steps/hud.mjs';

export { prerequisites } from '../../../core/steps/hud.mjs';

// Dragon-cube 标题独立展示(colorever 同款)：未上传的立绘不作为构建依赖。
export async function run(ctx) {
  return runHud({ ...ctx, hudOptionalPortraits: true });
}
