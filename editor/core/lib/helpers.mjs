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
