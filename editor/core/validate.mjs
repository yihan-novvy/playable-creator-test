import fs from 'node:fs';
import path from 'node:path';
import { PLUGINS_ROOT, TEMPLATES_ROOT, registry } from './registry.mjs';

// 规范 §6 注册表校验（docs/template-plugin-spec.md）。
// errors = 启动阻断项；warnings = 提示项（版本护栏、未知字段等）。
// editor server 启动与 `npm run validate` 共用同一实现。

const STEP_ID_RE = /^[a-z][a-z0-9-]*$/;
const SUPPORTED_MAGIC = new Set(['mp4', 'jpg', 'png', 'webp']);

export function validateRegistry() {
  const errors = [];
  const warnings = [];
  const seen = new Set();

  const pluginDirs = fs.existsSync(PLUGINS_ROOT)
    ? fs.readdirSync(PLUGINS_ROOT, { withFileTypes: true }).filter((item) => item.isDirectory()).map((item) => item.name)
    : [];
  if (pluginDirs.length === 0) errors.push('plugins/ 下没有任何插件目录');

  for (const dirName of pluginDirs) {
    const label = `plugins/${dirName}`;
    const pluginFile = path.join(PLUGINS_ROOT, dirName, 'plugin.json');
    let plugin;
    try {
      plugin = JSON.parse(fs.readFileSync(pluginFile, 'utf8'));
    } catch (error) {
      errors.push(`${label}/plugin.json 不可解析: ${error.message}`);
      continue;
    }
    if (plugin.id !== dirName) errors.push(`${label}: plugin.id(${plugin.id}) 与目录名不一致`);
    if (seen.has(plugin.id)) errors.push(`${label}: plugin.id 重复(${plugin.id})`);
    seen.add(plugin.id);
    for (const key of Object.keys(plugin)) {
      if (!['id', 'name', 'template', 'workbench', 'steps', 'uploads', 'overlays', 'defaults', 'background', 'level', 'patterns'].includes(key)) {
        warnings.push(`${label}/plugin.json: 未知顶层字段 "${key}"（多为拼写错误）`);
      }
    }

    // template 产物与 manifest
    const templateId = plugin.template || plugin.id;
    const templateDir = path.join(TEMPLATES_ROOT, templateId);
    const manifestFile = path.join(templateDir, 'game-manifest.json');
    if (!fs.existsSync(templateDir)) {
      errors.push(`${label}: template "${templateId}" 不存在（应有 editor/templates/${templateId}/）`);
      continue;
    }
    if (!fs.existsSync(manifestFile)) {
      errors.push(`${label}: 缺少 editor/templates/${templateId}/game-manifest.json —— 先在 template-core/${templateId} 运行 npm run build`);
      continue;
    }
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    } catch (error) {
      errors.push(`${label}: game-manifest.json 不可解析: ${error.message}`);
      continue;
    }
    if (manifest.id !== templateId) errors.push(`templates/${templateId}: game-manifest.id(${manifest.id}) 与目录名不一致`);
    const entryFile = path.join(templateDir, manifest.entry || '');
    if (!manifest.entry || !fs.existsSync(entryFile)) errors.push(`templates/${templateId}: entry "${manifest.entry}" 不存在`);
    if (!fs.existsSync(path.join(templateDir, 'game'))) errors.push(`templates/${templateId}: game/ 目录缺失`);

    // 版本护栏：manifest.version == template-core/<id>/package.json version
    const corePackage = path.resolve(TEMPLATES_ROOT, '..', '..', 'template-core', templateId, 'package.json');
    if (fs.existsSync(corePackage)) {
      try {
        const { version } = JSON.parse(fs.readFileSync(corePackage, 'utf8'));
        if (version !== manifest.version) {
          warnings.push(`template-core/${templateId} 版本(${version}) ≠ 已入库产物版本(${manifest.version}) —— 源码有更新，请重新 npm run build`);
        }
      } catch {
        warnings.push(`template-core/${templateId}/package.json 不可解析，跳过版本护栏`);
      }
    }

    // steps
    const steps = Array.isArray(plugin.steps) ? plugin.steps : [];
    if (steps.length === 0) errors.push(`${label}: steps 不能为空`);
    const ids = steps.map((step) => step.id);
    if (new Set(ids).size !== ids.length) errors.push(`${label}: steps id 重复`);
    for (const step of steps) {
      if (!STEP_ID_RE.test(step.id || '')) errors.push(`${label}: 非法 step id "${step.id}"`);
      if (typeof step.runner !== 'string') { errors.push(`${label}: step "${step.id}" 缺少 runner`); continue; }
      const runnerFile = step.runner.startsWith('core:')
        ? path.resolve(TEMPLATES_ROOT, '..', 'core', 'steps', `${step.runner.slice(5)}.mjs`)
        : path.resolve(PLUGINS_ROOT, dirName, step.runner);
      if (!fs.existsSync(runnerFile)) {
        errors.push(`${label}: step "${step.id}" 的 runner 不存在: ${step.runner}`);
        continue;
      }
      const source = fs.readFileSync(runnerFile, 'utf8');
      if (!/export\s+(async\s+)?function\s+run\b|export\s*{[^}]*\brun\b/.test(source)) {
        errors.push(`${label}: step "${step.id}" 的 runner 未导出 run(): ${step.runner}`);
      }
    }
    if (ids[ids.length - 1] !== 'pack') errors.push(`${label}: 最后一步必须是 pack`);
    if (ids.filter((id) => id === 'pack').length !== 1) errors.push(`${label}: 必须恰好一个 pack 步骤`);

    // uploads
    const files = new Set();
    for (const [slot, declaration] of Object.entries(plugin.uploads || {})) {
      if (!SUPPORTED_MAGIC.has(declaration.magic) && !(Array.isArray(declaration.magic) && declaration.magic.every((m) => SUPPORTED_MAGIC.has(m)))) {
        errors.push(`${label}: uploads.${slot} 的 magic 类型不支持: ${JSON.stringify(declaration.magic)}`);
      }
      if (files.has(declaration.file)) errors.push(`${label}: uploads 文件名冲突: ${declaration.file}`);
      files.add(declaration.file);
    }

    // overlays / workbench 路径
    const pluginDir = path.join(PLUGINS_ROOT, dirName);
    for (const [key, rel] of Object.entries(plugin.overlays || {})) {
      if (!fs.existsSync(path.join(pluginDir, rel))) errors.push(`${label}: overlays.${key} 不存在: ${rel}`);
    }
    if (typeof plugin.workbench === 'string' && plugin.workbench.startsWith('./')) {
      // 路径形态的 workbench 字段 = 声明专用工作台脚本；裸字符串是过渡期的
      // 前端展示分组键（见规范 §3.5），不要求 workbench.js 存在。
      if (!fs.existsSync(path.join(pluginDir, plugin.workbench))) errors.push(`${label}: workbench 脚本不存在: ${plugin.workbench}`);
    }
  }

  return { errors, warnings };
}
