import fs from 'node:fs';
import path from 'node:path';

// Step runner 共享的最小工具集。错误带 .missing 时，前端把它展示为「建议重跑」清单。
export function requireFiles(files) {
  const missing = files.filter((file) => !fs.existsSync(file));
  if (missing.length > 0) {
    const error = new Error(`缺少前置文件: ${missing.map((file) => path.basename(file)).join(', ')}`);
    error.missing = missing;
    throw error;
  }
}

// CTA 时机策略(两关同构,转化桥 novvy:cta-moment 的配置面):complete=完成后
// 跳转;steps=第 N 步跳转(N 不是上限,先完成则在完成时兜底跳转)。非法配置
// 回退默认。各模板共享一份,保证桥的触发语义跨模板一致。
export function normalizeCtaPolicy(raw, fallbackMode) {
  const mode = raw?.mode === 'steps' || raw?.mode === 'complete' ? raw.mode : fallbackMode;
  const afterSteps = Number.isInteger(raw?.afterSteps) && raw.afterSteps >= 1 && raw.afterSteps <= 99 ? raw.afterSteps : 8;
  return { mode, afterSteps };
}
