import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// editor/lib/paths.mjs → editor → monorepo root（project/ 与 result/ 在根上）
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const EDITOR_ROOT = path.join(ROOT, 'editor');
export const PUBLIC_ROOT = path.join(EDITOR_ROOT, 'public');
export const CORE_ROOT = path.join(EDITOR_ROOT, 'core');
export const SCRIPTS_ROOT = path.join(CORE_ROOT, 'scripts');
export const TEMPLATES_ROOT = path.join(EDITOR_ROOT, 'templates');
export const PROJECTS_ROOT = path.join(ROOT, 'project');
export const RESULT_ROOT = path.join(ROOT, 'result');

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function taskProjectDir(taskId) {
  return path.join(PROJECTS_ROOT, taskId);
}

export function taskResultDir(taskId) {
  return path.join(RESULT_ROOT, taskId);
}

export function taskUploadsDir(taskId) {
  return path.join(taskProjectDir(taskId), 'uploads');
}

export function taskGeneratedDir(taskId) {
  return path.join(taskProjectDir(taskId), 'generated');
}

export function templateRoot(templateId) {
  return path.join(TEMPLATES_ROOT, templateId);
}
