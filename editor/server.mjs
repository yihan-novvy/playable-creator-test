import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import {
  ROOT,
  PUBLIC_ROOT,
  PROJECTS_ROOT,
  RESULT_ROOT,
  TEMPLATES_ROOT,
  SCRIPTS_ROOT,
  ensureDir,
  taskProjectDir,
  taskResultDir,
  taskUploadsDir,
  taskGeneratedDir,
  templateRoot,
} from './lib/paths.mjs';
import { sendJson, sendError, readJsonBody, serveFile, writeBodyToFile, isInsideRoot } from './lib/http-utils.mjs';
import {
  UPLOAD_SLOTS,
  isValidTaskId,
  createTask,
  readTask,
  listTasks,
  deleteTask,
  updateTaskConfig,
  recordUpload,
  clearUpload,
  recordStepResult,
  withTaskLock,
  uploadPath,
  resultIndexPath,
  computeStatus,
  stepInputFilesFor,
  isColoreverTemplate,
  isOriginTemplate,
  updateColoreverTemplate,
} from './lib/store.mjs';
import { STEP_IDS, runStep, runAll, templateSteps, stepPrerequisites, effectiveConfig } from './core/runner.mjs';
import { getEntry, listEntries, importStepModule, getLib } from './core/registry.mjs';
import { validateRegistry } from './core/validate.mjs';
import { environment, run } from './core/lib/exec.mjs';
import { fixedViewportHtml } from './core/lib/fixed-viewport.mjs';
import { showcasePreview } from './lib/template-showcase.mjs';

const UPLOAD_CAP_BYTES = 100 * 1024 * 1024;
const UPLOAD_MIME = {
  'intro-video': { types: ['video/mp4'], ext: ['.mp4'] },
  'background-music': { types: ['audio/mpeg', 'audio/mp3'], ext: ['.mp3'] },
  'outro-video': { types: ['video/mp4'], ext: ['.mp4'] },
  'intro-poster': { types: ['image/jpeg'], ext: ['.jpg', '.jpeg'] },
  background: { types: ['image/png', 'image/jpeg'], ext: ['.png', '.jpg', '.jpeg'] },
  background2: { types: ['image/png', 'image/jpeg'], ext: ['.png', '.jpg', '.jpeg'] },
  // Portrait SOURCE images for HUD portraits (used whole by default, or
  // cropped down by the hud step). The example's shipped portraits are JPEG
  // bytes carrying .png names, so accept both formats.
  'portrait-src-left': { types: ['image/png', 'image/jpeg'], ext: ['.png', '.jpg', '.jpeg'] },
  'portrait-src-right': { types: ['image/png', 'image/jpeg'], ext: ['.png', '.jpg', '.jpeg'] },
  'pattern-source': { types: ['image/png', 'image/jpeg'], ext: ['.png', '.jpg', '.jpeg'] },
};
// Magic-byte sniffers per slot; content-type headers lie surprisingly often.
const isPngOrJpeg = (buf) =>
  (buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47) ||
  (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff);
const UPLOAD_MAGIC = {
  'background-music': (buf) => buf.length >= 3 && (buf.subarray(0, 3).toString() === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0 && (buf[1] & 0x06) === 0x02)),
  'intro-video': (buf) => buf.length > 12 && buf.readUInt32BE(4) === 0x66747970, // ISO-BMFF "ftyp"
  'outro-video': (buf) => buf.length > 12 && buf.readUInt32BE(4) === 0x66747970,
  'intro-poster': (buf) => buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  background: isPngOrJpeg,
  background2: isPngOrJpeg,
  'portrait-src-left': isPngOrJpeg,
  'portrait-src-right': isPngOrJpeg,
  'pattern-source': isPngOrJpeg,
};

// 人工筛选保存时,前端把编辑结果渲染成 PNG dataURL 一并上传;落盘前校验
// 格式与大小,与上传槽位同一套魔数纪律。
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PATTERN_PREVIEW_CAP_BYTES = 2 * 1024 * 1024;
function decodePngDataUrl(dataUrl) {
  const match = typeof dataUrl === 'string' && dataUrl.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error('预览图必须是 image/png 的 dataURL');
  const bytes = Buffer.from(match[1], 'base64');
  if (bytes.length > PATTERN_PREVIEW_CAP_BYTES) throw new Error('预览图超过 2MB 上限');
  if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) throw new Error('预览图 PNG 魔数不符');
  return bytes;
}

function listTemplates() {
  return listEntries().map((entry) => ({
    id: entry.id,
    name: entry.template.name,
    steps: entry.template.steps,
    workbench: entry.plugin.workbench || entry.id,
    defaults: entry.plugin.defaults,
    palette: entry.template.pattern?.palette || {},
  }));
}

function templateById(templateId) {
  try {
    const plugin = getEntry(templateId);
    return { root: plugin.templateDir, template: plugin.template, plugin };
  } catch {
    return null;
  }
}

// Per-template step list (plugin.json declares them); falls back to the
// legacy list if the template disappeared or is unreadable.
function taskSteps(task) {
  try {
    return templateSteps(templateById(task.templateId)?.template);
  } catch {
    return STEP_IDS;
  }
}

async function handleApi(req, res, url) {
  const { pathname } = url;
  const segments = pathname.split('/').filter(Boolean); // ["api", ...]

  if (req.method === 'GET' && pathname === '/api/env') {
    return sendJson(res, 200, await environment());
  }
  if (req.method === 'GET' && pathname === '/api/templates') {
    return sendJson(res, 200, listTemplates());
  }

  if (req.method === 'GET' && segments.length === 4 && segments[1] === 'templates' && segments[3] === 'demo') {
    const html = await showcasePreview(segments[2], url.searchParams);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(html);
  }

  if(pathname==='/api/colorever-options'&&req.method==='GET'){
    // 旧 colorever 已废弃改名:遗留端点的无参默认指向仍在线的新模板。
    const templateId=url.searchParams.get('templateId') || 'colorever-new';
    const linked=isColoreverTemplate(templateId) ? templateById(templateId) : null;
    if(!linked)return sendError(res,404,'未知模板');
    const lib=await getLib(linked.plugin);
    if(!lib||typeof lib.patterns!=='function')return sendError(res,404,'该模板不提供图案列表');
    return sendJson(res,200,lib.patterns(linked.root,linked.template));
  }

  // ----------------------- 图案库直接试玩 -----------------------
  // patterns.html 的卡片点击即玩:按图案 id 现场组装单文件预览形态 playable
  // (originHtml preview=true:载荷/图案数据全内联,无片头无任务),不落盘不取锁。
  // 图案 id 只认 levels/ 目录里实际存在的文件,天然挡住路径拼接。
  if (pathname === '/api/colorever-pattern-play' && req.method === 'GET') {
    const linked = templateById('colorever-origin');
    if (!linked) return sendError(res, 404, '未知模板');
    const id = url.searchParams.get('pattern') || 'flower5-original';
    let known = [];
    try {
      known = fs.readdirSync(path.join(linked.root, 'levels')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
    } catch { /* levels 缺失时下面按未知图案拒绝 */ }
    if (!known.includes(id)) return sendError(res, 404, `未知图案: ${id}`);
    const lib = await getLib(linked.plugin);
    if (!lib || typeof lib.originHtml !== 'function') return sendError(res, 404, '该模板不支持直接试玩');
    try {
      const html = fixedViewportHtml(lib.originHtml({
        root: linked.root,
        overlaysRoot: linked.plugin.dir,
        template: linked.template,
        config: effectiveConfig(linked.template, { patternId: id }),
        media: {},
        preview: true,
      }).html);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(html);
    } catch (error) {
      return sendError(res, error?.code === 'ENOENT' ? 404 : 500, error.message);
    }
    return undefined;
  }

  if (segments[0] !== 'api') return sendError(res, 404, '未知接口');

  // /api/tasks...
  if (pathname === '/api/tasks' && req.method === 'GET') {
    const tasks = listTasks().map((doc) => ({
      id: doc.id,
      name: doc.name,
      templateId: doc.templateId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
    return sendJson(res, 200, tasks);
  }
  if (pathname === '/api/tasks' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const name = String(body.name || '').trim();
    if (!name) return sendError(res, 400, '任务名不能为空');
    if (!templateById(String(body.templateId || ''))) return sendError(res, 400, '未知模板');
    const doc = createTask({ name, templateId: String(body.templateId) });
    return sendJson(res, 201, doc);
  }

  if (segments[1] !== 'tasks' || !segments[2]) return sendError(res, 404, '未知接口');
  const taskId = segments[2];
  const task = readTask(taskId);
  if (!task) return sendError(res, 404, `任务不存在: ${taskId}`);
  const rest = segments.slice(3);

  if (rest.length === 0) {
    if (req.method === 'GET') {
      return sendJson(res, 200, {
        ...task,
        status: computeStatus(taskId, taskSteps(task), stepInputFilesFor(task.templateId)),
      });
    }
    if (req.method === 'PATCH') {
      const body = await readJsonBody(req);
      const updated = updateTaskConfig(taskId, body.config);
      return sendJson(res, 200, updated);
    }
    if (req.method === 'DELETE') {
      deleteTask(taskId);
      return sendJson(res, 200, { deleted: taskId });
    }
  }

  if (rest.length === 1 && rest[0] === 'template' && req.method === 'PATCH') {
    const body = await readJsonBody(req);
    const templateId = body.templateId;
    if (!isColoreverTemplate(task.templateId) || !isColoreverTemplate(templateId)) {
      return sendError(res, 400, '只能在 Colorever 和 Colorever New 之间切换');
    }
    try {
      const updated = await withTaskLock(taskId, async () => {
        const current = readTask(taskId);
        if (current.templateId === templateId) return current;
        const before = templateById(current.templateId), after = templateById(templateId);
        if (!before || !after) throw new Error('游戏版本未安装');
        const libs = await Promise.all([getLib(before.plugin), getLib(after.plugin)]);
        const config = effectiveConfig(before.template, current.config);
        const levels = [config];
        if (config.secondPlayable?.patternId) levels.push({ patternId: config.secondPlayable.patternId, opening: config.secondPlayable.opening });
        // Reject missing or divergent patterns instead of silently resetting
        // either playable's selected pattern, colors, or deterministic opening.
        for (const levelConfig of levels) {
          const [a, b] = await Promise.all([
            libs[0].coloreverLevel(before.root, levelConfig, before.template),
            libs[1].coloreverLevel(after.root, levelConfig, after.template),
          ]);
          if (!isDeepStrictEqual(a.level, b.level)) throw new Error('两个版本的图案数据或开局不一致，请先同步构建图案后再切换');
        }
        return updateColoreverTemplate(taskId, templateId);
      });
      return sendJson(res, 200, updated);
    } catch (error) {
      return sendError(res, 400, error.message);
    }
  }

  if (rest[0] === 'uploads') {
    const slot = rest[1];
    if (!UPLOAD_SLOTS.includes(slot)) return sendError(res, 400, `未知上传槽位: ${slot}`);
    if (slot === 'background-music' && !isColoreverTemplate(task.templateId)) return sendError(res, 400, '该模板不支持背景音乐上传');
    const slotPath = uploadPath(taskId, slot);
    if (req.method === 'PUT') {
      const declaredType = (req.headers['content-type'] || '').split(';')[0];
      const allowedTypes = UPLOAD_MIME[slot].types;
      const declaredOk = !declaredType || declaredType === 'application/octet-stream' || allowedTypes.includes(declaredType);
      if (!declaredOk) {
        return sendError(res, 415, `${slot} 需要 ${allowedTypes.join(' 或 ')},收到 ${declaredType}`);
      }
      const originalName = decodeURIComponent(req.headers['x-novvy-original-name'] || path.basename(slotPath));
      // Sniff magic bytes before committing: peek the first chunk.
      const header = await readHeader(req, 16);
      if (header.length === 0) return sendError(res, 400, '空上传');
      if (!UPLOAD_MAGIC[slot](header)) {
        return sendError(res, 415, `${slot} 的文件内容与 ${allowedTypes.join(' 或 ')} 不符(魔数校验失败)`);
      }
      const bytes = await writeBodyToFile(req, slotPath, UPLOAD_CAP_BYTES);
      const { createHash } = await import('node:crypto');
      const sha256 = createHash('sha256').update(fs.readFileSync(slotPath)).digest('hex');
      recordUpload(taskId, slot, {
        originalName,
        bytes,
        sha256,
        uploadedAt: new Date().toISOString(),
      });
      // Uploading a portrait source image makes it that side's source (the
      // full image becomes the portrait until a crop is confirmed).
      if (slot === 'portrait-src-left' || slot === 'portrait-src-right') {
        const side = slot === 'portrait-src-left' ? 'left' : 'right';
        updateTaskConfig(taskId, {
          hudImageSource: { ...(readTask(taskId).config?.hudImageSource || {}), [side]: 'upload' },
          hudCrop: { ...(readTask(taskId).config?.hudCrop || {}), [side]: null },
        });
      }
      if (slot === 'pattern-source') {
        updateTaskConfig(taskId, {
          patternSource: 'upload',
          patternCrop: { ...(readTask(taskId).config?.patternCrop || {}), upload: null },
        });
      }
      return sendJson(res, 200, { slot, bytes, sha256, originalName });
    }
    if (req.method === 'GET') {
      if (!fs.existsSync(slotPath)) return sendError(res, 404, '未上传');
      return serveFile(req, res, slotPath);
    }
    if (req.method === 'DELETE') {
      if (fs.existsSync(slotPath)) fs.rmSync(slotPath, { force: true });
      clearUpload(taskId, slot);
      if (slot === 'pattern-source') {
        const config = readTask(taskId).config || {};
        updateTaskConfig(taskId, {
          patternSource: config.patternSource === 'upload' ? 'right' : (config.patternSource || 'right'),
          patternCrop: { ...(config.patternCrop || {}), upload: null },
        });
      }
      return sendJson(res, 200, { cleared: slot });
    }
    return sendError(res, 405, '不支持的方法');
  }

  if (rest[0] === 'run' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const stepId = String(body.step || '');
    const steps = taskSteps(task);
    if (!steps.includes(stepId) && stepId !== 'all') {
      return sendError(res, 400, `未知步骤: ${stepId}`);
    }
    try {
      // engine 让单个步骤选择变体(目前只有 pattern:'ai' → 视觉 LLM 生成掩膜)。
      const engine = String(body.engine || '') === 'ai' ? 'ai' : undefined;
      const result = await withTaskLock(taskId, async () => {
        const patched = readTask(taskId);
        const common = {
          taskId,
          templateRoot: templateRoot(patched.templateId),
          scriptsRoot: SCRIPTS_ROOT,
          projectRoot: taskProjectDir(taskId),
          resultRoot: taskResultDir(taskId),
          config: patched.config,
        };
        if (stepId === 'all') {
          const results = await runAll({ ...common, steps });
          for (const single of results) recordStepResult(taskId, single);
          return results;
        }
        const introState = isOriginTemplate(patched.templateId) && stepId === 'pack'
          && effectiveConfig(getEntry(patched.templateId).template, patched.config).intro?.enabled === true
          ? computeStatus(taskId, steps, stepInputFilesFor(patched.templateId)).steps.intro : null;
        const single = introState && (!introState.ok || introState.stale)
          ? { stepId, ok: false, error: '片头素材尚未处理或已更新，请先重新运行开场视频。', metrics: null, warnings: [], durationMs: 0 }
          : await runStep({ ...common, stepId, engine });
        recordStepResult(taskId, single);
        return single;
      });
      const failed = Array.isArray(result) ? result.find((single) => !single.ok) : !result.ok ? result : null;
      return sendJson(res, failed ? 422 : 200, result);
    } catch (error) {
      if (error?.code === 'RUNNING') return sendError(res, 409, '该任务正在运行,请稍候');
      return sendError(res, 500, error.message);
    }
  }

  if (rest[0] === 'prerequisites' && req.method === 'GET') {
    const patched = readTask(taskId);
    const entry = templateById(patched.templateId);
    if (!entry) return sendJson(res, 200, { uploads: [], generated: [] });
    return sendJson(res, 200, await stepPrerequisites(rest[1], patched.config, entry.template));
  }

  // Task-specific music never mutates the shared template bundle.
  if (['preview-game.js', 'music'].includes(rest[0]) && req.method === 'GET') {
    if (!isColoreverTemplate(task.templateId)) return sendError(res, 400, '该模板不支持任务音乐');
    const linked = templateById(task.templateId);
    const lib = await getLib(linked.plugin);
    try {
      const script = lib.previewScript({ plugin: linked.plugin, task, taskId });
      const music = rest[0] === 'music';
      const payload = music ? lib.previewMusic(script) : script;
      res.writeHead(200, { 'Content-Type': music ? 'audio/mpeg' : 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(payload);
    } catch (error) { return sendError(res, 400, error.message); }
    return undefined;
  }

  // ----------------------- 在线试玩预览（插件钩子） -----------------------
  // 手机框 iframe 直接可玩当前配置的关卡,不需要先打包。不取任务锁:只读
  // 模板与任务配置(与 pattern 端点同理)。预览页组装逻辑在插件 lib.mjs 的
  // previewHtml 里;没有该钩子的模板不支持在线预览。
  if (rest[0] === 'preview' && req.method === 'GET') {
    const linked = templateById(task.templateId);
    if (!linked) return sendError(res, 400, '该任务模板不支持在线预览');
    const lib = await getLib(linked.plugin);
    if (!lib || typeof lib.previewHtml !== 'function') {
      return sendError(res, 400, '该任务模板不支持在线预览');
    }
    try {
      const html = fixedViewportHtml(await lib.previewHtml({ plugin: linked.plugin, task, taskId, previewView: url.searchParams.get('view') }));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(html);
    } catch (error) {
      return sendError(res, 500, error.message);
    }
    return undefined;
  }

  // ----------------------- 打包产物 ZIP 导出 -----------------------
  // dist/ 目录就是交付包(壳 + 引擎 + 素材 + 埋点);这里把整个目录即时压成
  // 一个 zip 以 attachment 返回,前端一个链接就能拿到完整多文件包。排除
  // 目录里可能存在的历史 *.zip,避免把旧导出打进新导出。
  if (rest[0] === 'export' && req.method === 'GET') {
    const patched = readTask(taskId);
    const originPack = isOriginTemplate(patched.templateId)
      ? computeStatus(taskId, taskSteps(patched), stepInputFilesFor(patched.templateId)).steps.pack : null;
    if ((isColoreverTemplate(patched.templateId) && !patched.steps.pack?.ok) || (originPack && (!originPack.ok || originPack.stale))) {
      return sendError(res, 409, '当前游戏效果尚未打包，请先重新运行打包');
    }
    const resultDir = taskResultDir(taskId);
    if (!fs.existsSync(path.join(resultDir, 'index.html'))) {
      return sendError(res, 404, '该任务还没有打包产物,请先执行 pack');
    }
    const temporaryZip = path.join(os.tmpdir(), `novvy-export-${taskId}-${Date.now()}.zip`);
    try {
      await run('zip', ['-q', '-r', '-X', temporaryZip, '.', '-x', '*.zip'], { cwd: resultDir });
      const bytes = fs.readFileSync(temporaryZip);
      const safeName = String(patched.name || taskId).replace(/[^\w.-]+/g, '_').slice(0, 80) || taskId;
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Length': bytes.length,
        'Content-Disposition': `attachment; filename="${safeName}.zip"`,
      });
      res.end(bytes);
    } catch (error) {
      return sendError(res, 500, `导出失败: ${error.message}`);
    } finally {
      fs.rmSync(temporaryZip, { force: true });
    }
    return undefined;
  }

  // ----------------------- 人工筛选(pattern 编辑器)-----------------------
  // 与脚本引擎的分工:image-to-pattern-full.py 把源图完整转成珠子网格(无过滤,
  // 长边 40),前端编辑器负责擦除;保存时由这里编码成 write-levels 消费的
  // 标准 pattern.json 并把 pattern step 标记为 ok。
  if (rest[0] === 'pattern' && rest[1] === 'raw' && req.method === 'POST') {
    try {
      // 不取任务锁:只写 pattern-raw*.json(步骤不碰这些文件),避免长时间
      // AI 运行期间编辑器打开被卡住;唯一共享的 pattern-src 裁剪产物是幂等的。
      const patched = readTask(taskId);
      const linked = templateById(patched.templateId);
      if (!linked) return sendError(res, 400, '未知模板');
      const tplRoot = linked.root;
      const config = effectiveConfig(linked.template, patched.config);
      const uploads = {
        'pattern-source': path.join(taskUploadsDir(taskId), 'pattern-source.png'),
        'portrait-src-left': path.join(taskProjectDir(taskId), 'uploads', 'portrait-src-left.png'),
        'portrait-src-right': path.join(taskProjectDir(taskId), 'uploads', 'portrait-src-right.png'),
      };
      const generatedDir = taskGeneratedDir(taskId);
      const patternModule = await importStepModule(linked.plugin, 'pattern');
      const { sourcePath } = await patternModule.resolvePatternSource({
        config, uploads, generatedDir, scriptsRoot: SCRIPTS_ROOT,
      });
      const pc = config.patternConfig;
      const allowedTiles = Array.isArray(pc.allowedTiles)
        ? pc.allowedTiles
        : String(pc.allowedTiles || '').split(',').map((tile) => tile.trim()).filter(Boolean);
      const patternArgs = [
        path.join(linked.plugin.pluginScriptsDir, 'image-to-pattern-full.py'),
        '--source', sourcePath,
        '--template-json', path.join(tplRoot, 'template.json'),
        '--out', path.join(generatedDir, 'pattern-raw.json'),
        '--preview', path.join(generatedDir, 'pattern-raw-preview.png'),
      ];
      patternArgs.push('--prune-floor', String(pc.pruneFloor));
      if (allowedTiles.length > 0) patternArgs.push('--allowed-tiles', allowedTiles.join(','));
      await run('python3', patternArgs);
      const raw = JSON.parse(fs.readFileSync(path.join(generatedDir, 'pattern-raw.json'), 'utf8'));
      const editPath = path.join(generatedDir, 'pattern-edit.json');
      let edit = null;
      if (fs.existsSync(editPath)) {
        const saved = JSON.parse(fs.readFileSync(editPath, 'utf8'));
        // 源图或参数变化导致网格尺寸变了,旧擦除结果不再对位,丢弃。
        if (saved.width === raw.width && saved.height === raw.height) {
          // Manual edits only erase/restore cells. Keep their mask but use
          // today's reduced palette, so old saves cannot reintroduce colors.
          edit = raw.tiles.map((row, y) => row.map((tile, x) => saved.tiles?.[y]?.[x] === 0 ? 0 : tile));
        }
      }
      return sendJson(res, 200, { width: raw.width, height: raw.height, raw: raw.tiles, edit });
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  if (rest[0] === 'pattern' && rest[1] === 'manual' && req.method === 'POST') {
    const body = await readJsonBody(req);
    try {
      const result = await withTaskLock(taskId, async () => {
        const patched = readTask(taskId);
        const palette = templateById(patched.templateId)?.template.pattern?.palette || {};
        const tiles = body.tiles;
        if (!Array.isArray(tiles) || tiles.length === 0 || !Array.isArray(tiles[0]) || tiles[0].length === 0) {
          throw new Error('图案数据不合法');
        }
        const height = tiles.length;
        const width = tiles[0].length;
        if (Math.max(width, height) > 60) throw new Error(`网格过大: ${width}x${height}`);
        for (const row of tiles) {
          if (!Array.isArray(row) || row.length !== width) throw new Error('各行长度不一致');
          for (const tile of row) {
            if (!Number.isInteger(tile) || tile < 0 || (tile !== 0 && !palette[String(tile)])) {
              throw new Error(`非法色号: ${tile}`);
            }
          }
        }
        const counts = new Map();
        for (const row of tiles) {
          for (const tile of row) {
            if (tile) counts.set(tile, (counts.get(tile) || 0) + 1);
          }
        }
        if (counts.size === 0) throw new Error('图案是空的:请先擦掉背景或重置');
        // scramblePattern 无法对单色棋盘打乱,提前拦住比 levels 报错更直观。
        if (counts.size < 2) throw new Error('至少需要保留 2 种颜色才能生成关卡');
        if (counts.size > 36) throw new Error(`颜色数超过符号表上限(36): ${counts.size}`);

        // 符号表与 python 脚本一致:按 tile id 升序分配 a-z0-9。
        const SYMBOLS = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const sortedTiles = [...counts.keys()].sort((left, right) => left - right);
        const symbolByTile = new Map(sortedTiles.map((tile, index) => [tile, SYMBOLS[index]]));
        const rows = tiles.map((row) => row.map((tile) => (tile ? symbolByTile.get(tile) : ' ')).join(''));
        const symbolToTile = {};
        const tileNames = {};
        const colorCounts = {};
        for (const tile of sortedTiles) {
          symbolToTile[symbolByTile.get(tile)] = tile;
          tileNames[String(tile)] = palette[String(tile)]?.name || String(tile);
          colorCounts[String(tile)] = counts.get(tile);
        }
        const filledCells = sortedTiles.reduce((sum, tile) => sum + counts.get(tile), 0);
        // 最大单色占比过高时 scramblePattern 可能找不到合规打乱(levels 报
        // LPCS 错误);把数值放进 metrics 供保存前判断。
        const dominantColorShare = Math.max(...counts.values()) / filledCells;
        const preview = decodePngDataUrl(body.preview);

        const generatedDir = taskGeneratedDir(taskId);
        fs.mkdirSync(generatedDir, { recursive: true });
        fs.writeFileSync(path.join(generatedDir, 'pattern.json'), JSON.stringify({
          width,
          height,
          rows,
          symbolToTile,
          tileNames,
          colorCounts,
          generator: { type: 'manual', source: 'editor/manual-filter' },
        }, null, 2));
        fs.writeFileSync(path.join(generatedDir, 'pattern-edit.json'), JSON.stringify({ width, height, tiles }));
        fs.writeFileSync(path.join(generatedDir, 'pattern-preview.png'), preview);
        recordStepResult(taskId, {
          stepId: 'pattern',
          ok: true,
          durationMs: 0,
          metrics: {
            engine: 'manual',
            width,
            height,
            filledCells,
            coverage: filledCells / (width * height),
            colorCount: counts.size,
            colorCounts,
            colorNames: tileNames,
            dominantColorShare: Number(dominantColorShare.toFixed(3)),
          },
          warnings: [],
        });
        return { ok: true, width, height, filledCells, colorCount: counts.size };
      });
      return sendJson(res, 200, result);
    } catch (error) {
      if (error?.code === 'RUNNING') return sendError(res, 409, '该任务正在运行,请稍候');
      return sendError(res, 400, error.message);
    }
  }

  return sendError(res, 404, '未知接口');
}

// Peek the first bytes of the request body without consuming them from the
// downstream pipe: prepend the peeked chunk back by stashing it for
// writeBodyToFile via a synthetic pass-through.
function readHeader(req, byteCount) {
  return new Promise((resolve, reject) => {
    const onReadable = () => {
      const chunk = req.read(byteCount);
      if (chunk === null) {
        // EOF before any data.
        req.removeListener('readable', onReadable);
        resolve(Buffer.alloc(0));
        return;
      }
      req.removeListener('readable', onReadable);
      req.unshift(chunk); // push back so streaming consumers see it again
      resolve(chunk);
    };
    req.on('readable', onReadable);
    req.on('error', reject);
    req.on('end', () => {
      req.removeListener('readable', onReadable);
      resolve(Buffer.alloc(0));
    });
  });
}

function serveTaskStatic(req, res, url, baseSegments, rootResolver, taskId) {
  if (!isValidTaskId(taskId)) return sendError(res, 400, '非法任务 id');
  const rel = url.pathname
    .split('/')
    .slice(baseSegments)
    .map((segment) => decodeURIComponent(segment))
    .join('/');
  const target = path.resolve(rootResolver(), rel);
  if (!isInsideRoot(rootResolver(), target)) return sendError(res, 403, '路径越界');
  serveFile(req, res, target);
}

async function handleStatic(req, res, url) {
  const { pathname } = url;

  if (pathname.startsWith('/project/')) {
    const [, , taskId, kind] = pathname.split('/');
    const roots = { uploads: taskUploadsDir, generated: taskGeneratedDir };
    if (!roots[kind]) return sendError(res, 404, '未知资源目录');
    // ['', 'project', <id>, <kind>, ...rest] → rest is relative to the mount root.
    serveTaskStatic(req, res, url, 4, () => roots[kind](taskId), taskId);
    return;
  }
  if (pathname.startsWith('/result/')) {
    const [, , taskId] = pathname.split('/');
    serveTaskStatic(req, res, url, 3, () => taskResultDir(taskId), taskId);
    return;
  }
  // 模板资产只读透传(如 HUD 预览用的 overlays/hud/hud.css),编辑器直接引用
  // 模板源文件而非拷贝,模板更新预览自动跟随。
  if (pathname.startsWith('/templates/')) {
    const [, , templateId] = pathname.split('/');
    serveTaskStatic(req, res, url, 3, () => templateRoot(templateId), templateId);
    return;
  }
  // 插件资产只读透传(覆盖层、工作台脚本):编辑器直接引用插件源文件而非拷贝。
  if (pathname.startsWith('/plugins/')) {
    const [, , pluginId] = pathname.split('/');
    let pluginDir = null;
    try {
      pluginDir = getEntry(pluginId).dir;
    } catch {
      return sendError(res, 404, '未知插件');
    }
    serveTaskStatic(req, res, url, 3, () => pluginDir, pluginId);
    return;
  }

  // Editor frontend; task.html is the SPA-ish workbench (?id=...).
  const rel = pathname === '/' ? 'index.html' : pathname.slice(1);
  const target = path.resolve(PUBLIC_ROOT, rel);
  if (!isInsideRoot(PUBLIC_ROOT, target) || !fs.existsSync(target)) {
    return sendError(res, 404, '页面不存在');
  }
  serveFile(req, res, target);
}

export function createServer(options = {}) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    try {
      if (url.pathname.startsWith('/api/')) {
        await handleApi(req, res, url);
      } else {
        await handleStatic(req, res, url);
      }
    } catch (error) {
      const status = error?.statusCode || 500;
      if (!res.headersSent) {
        sendError(res, status, error.message || '服务器内部错误');
      } else {
        res.destroy();
      }
    }
  });
}

export async function main(argv = process.argv.slice(2)) {
  const envFile = path.join(ROOT, '.env');
  if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
  const settingsIndex = argv.indexOf('--ai-settings');
  if (settingsIndex !== -1) {
    if (!argv[settingsIndex + 1] || argv[settingsIndex + 1].startsWith('--')) {
      throw new Error('--ai-settings 需要配置文件路径');
    }
    const saved = JSON.parse(fs.readFileSync(path.resolve(argv[settingsIndex + 1]), 'utf8')).env || {};
    for (const key of ['ANTHROPIC_BASE_URL', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL']) {
      if (!process.env[key] && typeof saved[key] === 'string') process.env[key] = saved[key];
    }
  }
  const portIndex = argv.indexOf('--port');
  const port = portIndex !== -1 ? Number(argv[portIndex + 1]) : 8088;
  ensureDir(PROJECTS_ROOT);
  ensureDir(RESULT_ROOT);
  // 启动即校验插件注册表：错误（契约损坏）拒绝启动，警告（如版本护栏）仅提示。
  const { errors, warnings } = validateRegistry();
  for (const warning of warnings) console.warn(`警告: ${warning}`);
  if (errors.length > 0) {
    for (const error of errors) console.error(`错误: ${error}`);
    throw new Error(`插件注册表校验失败（${errors.length} 个错误）；运行 npm run validate 查看详情`);
  }
  const server = createServer();
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  const env = await environment();
  console.log(`Playable editor: http://127.0.0.1:${port}`);
  if (!env.ok) {
    console.warn(`环境缺工具: ${Object.entries(env).filter(([key, value]) => !value && key !== 'ok').map(([key]) => key).join(', ')}`);
  }
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
