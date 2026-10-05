import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// 插件注册表：扫描 editor/plugins/*/plugin.json，按名解析 editor/templates/<id>/
// 的 game-manifest.json，产出 runner/server 共用的合并视图。
//
// 合并规则（plugin 字段优先）：
//   base    = game-manifest（id/name/entry/levels + constants 平铺到顶层；
//             game.indexHtml 来自 entry，constants.game 叠加其上）
//   merged  = deepMerge(base, plugin.json)   ← template.background 这类
//             「游戏侧 assetPath + 编辑侧尺寸」由此自然合体
//   merged.steps = plugin.steps 的 id 列表（server 的步骤顺序契约）
//
// 本模块不做完整校验（见 tools/validate-registry.mjs）；解析失败的 plugin 目录
// 在扫描期跳过，getEntry 时报错。

export const CORE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
export const EDITOR_ROOT = path.resolve(CORE_ROOT, '..');
export const PLUGINS_ROOT = path.join(EDITOR_ROOT, 'plugins');
export const TEMPLATES_ROOT = path.join(EDITOR_ROOT, 'templates');
export const CORE_SCRIPTS_ROOT = path.join(CORE_ROOT, 'scripts');

export function deepMerge(base, over) {
  if (over === undefined || over === null) return structuredClone(base);
  if (typeof base !== 'object' || base === null || Array.isArray(base)) return structuredClone(over);
  const out = { ...base };
  for (const [key, value] of Object.entries(over)) {
    out[key] = key in base ? deepMerge(base[key], value) : structuredClone(value);
  }
  return out;
}

function loadEntry(dir) {
  const plugin = JSON.parse(fs.readFileSync(path.join(dir, 'plugin.json'), 'utf8'));
  if (plugin.id !== path.basename(dir)) throw new Error(`plugin.id 与目录名不一致: ${dir}`);
  const templateId = plugin.template || plugin.id;
  const templateDir = path.join(TEMPLATES_ROOT, templateId);
  const manifest = JSON.parse(fs.readFileSync(path.join(templateDir, 'game-manifest.json'), 'utf8'));
  if (manifest.id !== templateId) throw new Error(`game-manifest.id 与模板目录名不一致: ${templateDir}`);

  const base = {
    id: manifest.id,
    name: manifest.name,
    entry: manifest.entry,
    levels: manifest.levels || [],
    ...(manifest.constants || {}),
  };
  base.game = { indexHtml: manifest.entry, ...(base.game || {}) };
  const merged = deepMerge(base, plugin);
  merged.steps = plugin.steps.map((step) => step.id);

  return {
    id: plugin.id,
    name: plugin.name,
    dir,
    templateDir,
    pluginScriptsDir: path.join(dir, 'scripts'),
    plugin,
    manifest,
    template: merged,
    lib: null, // 惰性加载，见 getLib
  };
}

let cache = null;

export function registry() {
  if (cache) return cache;
  const plugins = new Map();
  if (fs.existsSync(PLUGINS_ROOT)) {
    for (const item of fs.readdirSync(PLUGINS_ROOT, { withFileTypes: true })) {
      if (!item.isDirectory()) continue;
      const dir = path.join(PLUGINS_ROOT, item.name);
      if (!fs.existsSync(path.join(dir, 'plugin.json'))) continue;
      try {
        const entry = loadEntry(dir);
        plugins.set(entry.id, entry);
      } catch {
        // 解析失败的插件不进注册表；server 启动校验会把它报告出来。
      }
    }
  }
  cache = plugins;
  return plugins;
}

export function getEntry(templateId) {
  const entry = registry().get(templateId);
  if (!entry) throw new Error(`未知模板/插件: ${templateId}`);
  return entry;
}

export function listEntries() {
  return [...registry().values()];
}

// runner 按声明解析 step runner 模块："core:<id>" → core/steps/<id>.mjs，
// "./..." → 相对插件目录。
export async function importStepModule(entry, stepId) {
  const step = entry.plugin.steps.find((item) => item.id === stepId);
  if (!step) throw new Error(`插件 ${entry.id} 未声明步骤: ${stepId}`);
  const file = step.runner.startsWith('core:')
    ? path.join(CORE_ROOT, 'steps', `${step.runner.slice('core:'.length)}.mjs`)
    : path.join(entry.dir, step.runner);
  return import(pathToFileURL(file).href);
}

// 插件的可选共享模块 lib.mjs（预览钩子、图案列表等 server/step 两端复用的逻辑）。
export async function getLib(entry) {
  if (entry.lib !== null) return entry.lib;
  const file = path.join(entry.dir, 'lib.mjs');
  entry.lib = fs.existsSync(file) ? await import(pathToFileURL(file).href) : false;
  return entry.lib;
}
