import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { taskProjectDir, taskResultDir, templateRoot, SCRIPTS_ROOT } from '../lib/paths.mjs';
import { readTask, recordStepResult, withTaskLock } from '../lib/store.mjs';
import { runStep, runAll } from '../core/runner.mjs';

// Headless step runner (no UI): node editor/tools/run-step.mjs <taskId> <step|all>

const [taskId, stepArg] = process.argv.slice(2);
if (!taskId || !stepArg) {
  console.error('Usage: node editor/tools/run-step.mjs <taskId> <step|all>');
  process.exit(1);
}
const doc = readTask(taskId);
if (!doc) {
  console.error(`Task not found: ${taskId}`);
  process.exit(1);
}

const common = {
  taskId,
  templateRoot: templateRoot(doc.templateId),
  scriptsRoot: SCRIPTS_ROOT,
  projectRoot: taskProjectDir(taskId),
  resultRoot: taskResultDir(taskId),
  config: doc.config,
};

await withTaskLock(taskId, async () => {
  const results = stepArg === 'all' ? await runAll(common) : [await runStep({ ...common, stepId: stepArg })];
  for (const result of results) {
    recordStepResult(taskId, result);
    const status = result.ok ? 'OK ' : 'FAIL';
    console.log(`[${status}] ${result.stepId} (${result.durationMs}ms)`);
    if (result.ok) console.log(JSON.stringify(result.metrics));
    else {
      console.error(result.error);
      if (result.missing?.length) console.error(`missing: ${result.missing.join(', ')}`);
    }
  }
  process.exitCode = results.every((result) => result.ok) ? 0 : 1;
});
