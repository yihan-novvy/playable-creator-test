import { validateRegistry } from '../core/validate.mjs';

// 注册表校验 CLI：node editor/tools/validate-registry.mjs
// 与 editor server 启动校验共用同一实现（core/validate.mjs）。
const { errors, warnings } = validateRegistry();
for (const warning of warnings) console.warn(`警告: ${warning}`);
for (const error of errors) console.error(`错误: ${error}`);
console.log(errors.length === 0 ? `校验通过（${warnings.length} 个警告）` : `校验失败：${errors.length} 个错误, ${warnings.length} 个警告`);
process.exitCode = errors.length === 0 ? 0 : 1;
