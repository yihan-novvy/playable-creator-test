import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECTS_ROOT,
  RESULT_ROOT,
  ensureDir,
  taskProjectDir,
  taskResultDir,
  taskUploadsDir,
  taskGeneratedDir,
} from './paths.mjs';

const TASK_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const UPLOAD_SLOTS = Object.freeze([
  'intro-video',
  'intro-poster',
  'background',
  'portrait-src-left',
  'portrait-src-right',
  'pattern-source',
]);

// Keep in-repo work out of git; final deliverables live under dist/ and are
// exported by hand.
export { UPLOAD_SLOTS };

const taskLocks = new Map();

export function isValidTaskId(id) {
  return typeof id === 'string' && TASK_ID_RE.test(id);
}

export function slugify(name) {
  const slug = String(name)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'task';
}

export function createTask({ name, templateId }) {
  const base = slugify(name);
  let id = base;
  let n = 2;
  while (fs.existsSync(taskProjectDir(id)) || fs.existsSync(taskResultDir(id))) {
    id = `${base}-${n}`;
    n += 1;
  }
  const now = new Date().toISOString();
  const doc = {
    id,
    name: String(name),
    templateId,
    createdAt: now,
    updatedAt: now,
    config: null, // filled by runner defaults at first use
    uploads: {},
    steps: {},
  };
  ensureDir(taskUploadsDir(id));
  ensureDir(taskGeneratedDir(id));
  fs.writeFileSync(path.join(taskProjectDir(id), 'project.json'), JSON.stringify(doc, null, 2));
  return doc;
}

export function readTask(id) {
  if (!isValidTaskId(id)) return null;
  const file = path.join(taskProjectDir(id), 'project.json');
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

export function writeTask(doc) {
  doc.updatedAt = new Date().toISOString();
  fs.writeFileSync(
    path.join(taskProjectDir(doc.id), 'project.json'),
    JSON.stringify(doc, null, 2),
  );
  return doc;
}

export function listTasks() {
  if (!fs.existsSync(PROJECTS_ROOT)) return [];
  return fs
    .readdirSync(PROJECTS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && isValidTaskId(entry.name))
    .map((entry) => readTask(entry.name))
    .filter(Boolean)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function deleteTask(id) {
  if (!isValidTaskId(id)) return;
  fs.rmSync(taskProjectDir(id), { recursive: true, force: true });
  fs.rmSync(taskResultDir(id), { recursive: true, force: true });
}

// 'pattern' 是历史误写(模板里的键);任务配置实际叫 patternConfig。
// 少了它,配置界面的全部图案参数会被静默丢弃。
const CONFIG_PATCH_WHITELIST = new Set(['hud', 'intro', 'cta', 'recolorPortraits', 'patternSource', 'background', 'pattern', 'patternConfig', 'patternCrop', 'hudImageSource', 'hudCrop', 'win']);

// Water Sort 保存关卡数据；Colorever New 任务仅选择完整图案 ID。
const CONFIG_WHITELISTS = new Map([
  ['colorever-new', new Set(['hud','intro','cta','background','hudImageSource','hudCrop','patternId'])],
  ['water-sort', new Set([...CONFIG_PATCH_WHITELIST, 'level'])],
  ['dragon-cube', new Set([...CONFIG_PATCH_WHITELIST, 'levelId'])],
]);

export function configWhitelistFor(templateId) {
  return CONFIG_WHITELISTS.get(templateId) || CONFIG_PATCH_WHITELIST;
}

// 前端逐字段保存(如 PATCH {hud:{titleLine1:'…'}}):对象深合并,避免同
// 顶层键下的兄弟字段(标题第二行、ariaLabel…)被整块替换丢失。标量、数组
// 与显式 null 仍整值替换,保持 hudCrop/patternCrop 置 null 清除裁剪的语义。
function mergeConfigValue(base, patch) {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) return patch;
  const out = base && typeof base === 'object' && !Array.isArray(base) ? { ...base } : {};
  for (const [key, value] of Object.entries(patch)) out[key] = mergeConfigValue(out[key], value);
  return out;
}

export function updateTaskConfig(id, patch) {
  const doc = readTask(id);
  if (!doc) return null;
  doc.config = doc.config || {};
  const whitelist = configWhitelistFor(doc.templateId);
  if(doc.templateId==='colorever-new'){
    if('level' in (patch||{}))throw new Error('图案和玩法参数只能在 colorever 源项目修改，任务仅选择已构建的 patternId');
    if('patternId' in (patch||{})){
      const catalog=JSON.parse(fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../editor/templates/colorever-new/game/patterns/catalog.json'),'utf8'));
      if(!catalog.patterns.some(p=>p.id===patch.patternId))throw new Error('未知图案模板');
      delete doc.config.level;delete doc.steps.level;delete doc.steps.pack;
    }
  }
  for (const [key, value] of Object.entries(patch || {})) {
    if (!whitelist.has(key)) continue;
    doc.config[key] = mergeConfigValue(doc.config[key], value);
  }
  if (['patternSource', 'patternCrop', 'patternConfig'].some((key) => key in (patch || {}))) {
    for (const step of ['pattern', 'levels', 'pack']) delete doc.steps[step];
    const editPath = path.join(taskGeneratedDir(id), 'pattern-edit.json');
    if (fs.existsSync(editPath)) fs.unlinkSync(editPath);
  }
  // 获胜次数只影响 pack 产物里的 meta 补丁,重跑 pack 即可生效。
  if ('win' in (patch || {})) delete doc.steps.pack;
  // 关卡编辑会让 water-sort 的校验产物与打包同时过期(colorever 任务的 level
  // 键进不了白名单,这里天然不可达)。
  if ('level' in (patch || {})) {
    delete doc.steps.level;
    delete doc.steps.pack;
  }
  if ('levelId' in (patch || {})) {
    if (!Number.isInteger(patch.levelId) || patch.levelId < 1 || patch.levelId > 10) throw new Error('DragonCube 只能选择第 1–10 关');
    delete doc.steps.level;
    delete doc.steps.pack;
  }
  if (['dragon-cube','colorever-new'].includes(doc.templateId)) {
    if ('intro' in (patch || {})) { delete doc.steps.intro; delete doc.steps.hud; delete doc.steps.background; delete doc.steps.pack; }
    if ('hud' in (patch || {}) || 'hudImageSource' in (patch || {}) || 'hudCrop' in (patch || {})) { delete doc.steps.hud; delete doc.steps.pack; }
    if ('background' in (patch || {})) { delete doc.steps.background; delete doc.steps.pack; }
    if ('cta' in (patch || {})) delete doc.steps.pack;
  }
  return writeTask(doc);
}

export function recordUpload(id, slot, meta) {
  const doc = readTask(id);
  if (!doc) return null;
  doc.uploads[slot] = meta;
  return writeTask(doc);
}

export function clearUpload(id, slot) {
  const doc = readTask(id);
  if (!doc) return null;
  delete doc.uploads[slot];
  return writeTask(doc);
}

export function recordStepResult(id, result) {
  const doc = readTask(id);
  if (!doc) return null;
  doc.steps[result.stepId] = {
    ok: result.ok,
    lastRunAt: new Date().toISOString(),
    durationMs: result.durationMs,
    metrics: result.metrics,
    warnings: result.warnings || [],
    error: result.ok ? undefined : String(result.error || '未知错误'),
  };
  return writeTask(doc);
}

// Serialized per task; parallel runs on DIFFERENT tasks are fine because each
// pack uses its own mkdtemp workspace.
export async function withTaskLock(id, fn) {
  const previous = taskLocks.get(id) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  taskLocks.set(id, Promise.race([previous.catch(() => {}), current]).then(() => {}));
  // Chain: current run starts only after the previous one settles.
  const chained = previous.catch(() => {}).then(fn);
  taskLocks.set(id, chained);
  try {
    return await chained;
  } finally {
    release();
    if (taskLocks.get(id) === chained) taskLocks.delete(id);
  }
}

export function uploadPath(id, slot) {
  const extBySlot = {
    'intro-video': '.mp4',
    'intro-poster': '.jpg',
    background: '.png',
    // Portrait SOURCE images keep a fixed .png name regardless of the
    // original bytes (PIL and browsers both sniff the real format).
    'portrait-src-left': '.png',
    'portrait-src-right': '.png',
    'pattern-source': '.png',
  };
  return path.join(taskUploadsDir(id), `${slot}${extBySlot[slot] || ''}`);
}

export function generatedPath(id, filename) {
  return path.join(taskGeneratedDir(id), filename);
}

export function resultIndexPath(id) {
  return path.join(taskResultDir(id), 'index.html');
}

export function computeStatus(id, runnerSteps, inputFiles = STEP_INPUT_FILES) {
  const doc = readTask(id);
  if (!doc) return null;
  const uploads = {};
  for (const slot of UPLOAD_SLOTS) {
    const file = uploadPath(id, slot);
    const present = fs.existsSync(file);
    uploads[slot] = {
      present,
      bytes: present ? fs.statSync(file).size : 0,
      meta: doc.uploads[slot] || null,
    };
  }
  const steps = {};
  for (const stepId of runnerSteps) {
    const record = doc.steps[stepId];
    steps[stepId] = {
      ok: record?.ok === true,
      lastRunAt: record?.lastRunAt || null,
      stale: record ? computeStale(id, stepId, record.lastRunAt, inputFiles) : false,
      metrics: record?.metrics || null,
      error: record?.error || null,
    };
  }
  let hasResult = false;
  let resultBytes = 0;
  const resultFile = resultIndexPath(id);
  if (fs.existsSync(resultFile)) {
    hasResult = true;
    resultBytes = fs.statSync(resultFile).size;
  }
  return { id, uploads, steps, hasResult, resultBytes };
}

// A step is stale when any of its input files (uploads or generated outputs of
// earlier steps) is newer than the step's last run.
const STEP_INPUT_FILES = {
  intro: ['uploads/intro-video.mp4', 'uploads/intro-poster.jpg'],
  // portraits derive from a per-side source image (poster or upload); the
  // poster also feeds the background step's no-upload fallback
  hud: ['generated/poster.jpg', 'uploads/portrait-src-left.png', 'uploads/portrait-src-right.png'],
  background: ['uploads/background.png', 'generated/poster.jpg'],
  pattern: ['generated/hud-right.png', 'generated/hud-left.png'],
  levels: ['generated/pattern.json'],
  pack: [
    'uploads/intro-video.mp4',
    'uploads/intro-poster.jpg',
    'uploads/background.png',
    'uploads/portrait-src-left.png',
    'uploads/portrait-src-right.png',
    'generated/poster.jpg',
    'generated/hud-left.png',
    'generated/hud-right.png',
    'generated/background.png',
    'generated/pattern.json',
    'generated/levels.json',
  ],
};

function computeStale(id, stepId, lastRunAt, inputFiles = STEP_INPUT_FILES) {
  const inputs = inputFiles[stepId] || [];
  const root = taskProjectDir(id);
  const runTime = Date.parse(lastRunAt);
  if (!Number.isFinite(runTime)) return true;
  return inputs.some((rel) => {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) return false; // missing input handled by prereq gate
    return fs.statSync(file).mtimeMs > runTime + 5; // 5ms clock skew guard
  });
}

// water-sort 的输入图:intro/hud/background 三步与 colorever 吃同样的上传/
// 产物(但海报是 poster.webp),level 消费配置(不是文件),pack 吃全部产物。
const WATER_SORT_STEP_INPUT_FILES = {
  intro: ['uploads/intro-video.mp4', 'uploads/intro-poster.jpg'],
  hud: ['generated/poster.webp', 'uploads/portrait-src-left.png', 'uploads/portrait-src-right.png'],
  background: ['uploads/background.png', 'generated/poster.webp'],
  level: [],
  pack: [
    'generated/level.json',
    'generated/poster.webp',
    'generated/background.webp',
    'generated/hud-left.webp',
    'generated/hud-right.webp',
    'uploads/intro-video.mp4',
    'uploads/intro-poster.jpg',
    'uploads/background.png',
  ],
};

export function stepInputFilesFor(templateId) {
  return ['water-sort','dragon-cube','colorever-new'].includes(templateId) ? WATER_SORT_STEP_INPUT_FILES : STEP_INPUT_FILES;
}

export { RESULT_ROOT, PROJECTS_ROOT };
