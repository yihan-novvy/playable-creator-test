import fs from 'node:fs';
import path from 'node:path';
import { getEntry, importStepModule, deepMerge, CORE_SCRIPTS_ROOT } from './registry.mjs';

// Step orchestration. The editor server just dispatches step ids; which module
// runs a step is decided by the plugin's plugin.json (see core/registry.mjs).
//
// Principles:
// - editor/templates is READ-ONLY: pack copies it into an mkdtemp workspace and
//   applies task resources there; the runner never writes under templates/.
// - Each step writes only into project/<id>/generated/ (or result/ for pack).
// - project.json is owned by the editor store; the runner returns StepResults
//   and never persists them itself.

// Legacy fallback step order for plugins that don't declare steps.
export const STEP_IDS = Object.freeze(['intro', 'hud', 'background', 'pattern', 'levels', 'pack']);

// Legacy shim: the per-template contract file still carries the game-side
// sections the python scripts consume (--template-json). New code should read
// the merged registry view instead.
export function loadTemplate(templateRoot) {
  return JSON.parse(fs.readFileSync(path.join(templateRoot, 'template.json'), 'utf8'));
}

// Steps are declared per plugin in plugin.json; registry flattens them to ids.
export function templateSteps(template) {
  const steps = template?.steps;
  if (Array.isArray(steps) && steps.length > 0 && steps.every((step) => typeof step === 'string')) {
    return Object.freeze([...steps]);
  }
  return STEP_IDS;
}

// Also used by the editor server's manual-pattern endpoints, which need the
// effective patternConfig without spinning up a full step run.
export function effectiveConfig(template, configPatch) {
  return deepMerge(template.defaults || {}, configPatch || {});
}

// Pre-flight check for one step: delegates to the step module's optional
// prerequisites(config) (conditional logic lives in code, not declarations).
export async function stepPrerequisites(stepId, config, template) {
  const entry = getEntry(template?.id);
  const stepModule = await importStepModule(entry, stepId);
  if (typeof stepModule.prerequisites !== 'function') return { uploads: [], generated: [] };
  const result = stepModule.prerequisites(config || {});
  return { uploads: [...(result.uploads || [])], generated: [...(result.generated || [])] };
}

export async function runStep({ taskId, templateId, templateRoot, scriptsRoot, projectRoot, resultRoot, stepId, config, engine }) {
  const startedAt = Date.now();
  const id = templateId || (templateRoot ? path.basename(templateRoot) : null);
  const entry = getEntry(id);
  const effective = effectiveConfig(entry.template, config);

  // 上传槽位 → 任务 uploads/ 下的落盘文件名，由 plugin.json 声明。
  const uploads = {};
  for (const [slot, declaration] of Object.entries(entry.plugin.uploads || {})) {
    uploads[slot] = path.join(projectRoot, 'uploads', declaration.file);
  }

  const ctx = {
    taskId,
    stepId,
    plugin: entry.plugin,
    template: entry.template,
    config: effective,
    engine, // per-step variant, e.g. pattern 'ai' vs the default threshold script
    templateRoot: entry.templateDir,
    templateDir: entry.templateDir,
    pluginDir: entry.dir,
    pluginScriptsDir: path.join(entry.dir, 'scripts'),
    scriptsRoot: scriptsRoot || CORE_SCRIPTS_ROOT,
    uploadsDir: path.join(projectRoot, 'uploads'),
    generatedDir: path.join(projectRoot, 'generated'),
    resultDir: resultRoot,
    uploads,
  };

  try {
    const stepModule = await importStepModule(entry, stepId);
    const { metrics, warnings } = await stepModule.run(ctx);
    return {
      stepId,
      ok: true,
      metrics,
      warnings,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      stepId,
      ok: false,
      metrics: null,
      warnings: [],
      error: error.message,
      missing: error.missing,
      durationMs: Date.now() - startedAt,
    };
  }
}

export async function runAll(options) {
  const entry = getEntry(options.templateId || (options.templateRoot ? path.basename(options.templateRoot) : null));
  const steps = options.steps || entry.template.steps;
  const results = [];
  for (const stepId of steps) {
    const result = await runStep({ ...options, stepId });
    results.push(result);
    if (!result.ok) break;
  }
  return results;
}
