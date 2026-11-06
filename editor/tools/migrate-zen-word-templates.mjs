import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECTS_ROOT } from '../lib/paths.mjs';

// Run with the editor stopped. Preserve task ids, uploads and all other settings.
export function splitZenWordTask(doc) {
  if (doc.templateId !== 'zen-word-origin') return null;
  const level = doc.config?.levelId ?? 1;
  if (level !== 1 && level !== 2) throw new Error(`${doc.id}: unknown original Zen Word variant ${level}`);
  const next = structuredClone(doc);
  next.templateId = level === 1 ? 'zen-word-100m-origin' : 'zen-word-92m-origin';
  next.config = { ...next.config, levelId: 1 };
  next.steps = { ...next.steps };
  delete next.steps.pack;
  return next;
}

export function migrateZenWordTasks(projectsRoot = PROJECTS_ROOT) {
  const changes = [];
  for (const entry of fs.readdirSync(projectsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(projectsRoot, entry.name, 'project.json');
    if (!fs.existsSync(file)) continue;
    const original = fs.readFileSync(file, 'utf8');
    const next = splitZenWordTask(JSON.parse(original));
    if (next) changes.push({ file, original, next });
  }
  // Validate every task before writing any migration.
  for (const { file, original, next } of changes) {
    const backup = path.join(path.dirname(file), 'project.zen-word-before-split.json');
    if (!fs.existsSync(backup)) fs.writeFileSync(backup, original, { flag: 'wx' });
    next.updatedAt = new Date().toISOString();
    fs.writeFileSync(file + '.tmp', JSON.stringify(next, null, 2) + '\n');
    fs.renameSync(file + '.tmp', file);
  }
  return changes.map(({ next }) => ({ taskId: next.id, templateId: next.templateId }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(migrateZenWordTasks(), null, 2));
}
