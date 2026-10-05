import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
} from './lib/store.mjs';
import { STEP_IDS, runStep, runAll, loadTemplate, templateSteps, stepPrerequisites, effectiveConfig, resolvePatternSource } from './core/runner.mjs';
import { buildWsOverlayInjection } from './core/lib/ws-overlays.mjs';
import {coloreverHtml,coloreverLevel,coloreverPatterns} from './core/lib/colorever-new.mjs';
import { dragonHtml, dragonLevel } from './core/lib/dragon-cube.mjs';
import { environment, run } from './core/lib/exec.mjs';

const UPLOAD_CAP_BYTES = 100 * 1024 * 1024;
const UPLOAD_MIME = {
  'intro-video': { types: ['video/mp4'], ext: ['.mp4'] },
  'intro-poster': { types: ['image/jpeg'], ext: ['.jpg', '.jpeg'] },
  background: { types: ['image/png'], ext: ['.png'] },
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
  'intro-video': (buf) => buf.length > 12 && buf.readUInt32BE(4) === 0x66747970, // ISO-BMFF "ftyp"
  'intro-poster': (buf) => buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  background: (buf) => buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47,
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
  if (!fs.existsSync(TEMPLATES_ROOT)) return [];
  return fs
    .readdirSync(TEMPLATES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      try {
        const template = loadTemplate(templateRoot(entry.name));
        return {
          id: template.id,
          name: template.name,
          steps: template.steps,
          workbench: template.workbench || 'colorever',
          defaults: template.defaults,
          palette: template.pattern?.palette || {},
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function templateById(templateId) {
  const root = templateRoot(templateId);
  if (!isInsideRoot(TEMPLATES_ROOT, root) || !fs.existsSync(root)) return null;
  try {
    return { root, template: loadTemplate(root) };
  } catch {
    return null;
  }
}

// Per-template step list (template.json declares them); falls back to the
// colorever list if the template disappeared or is unreadable.
function taskSteps(task) {
  try {
    return templateSteps(loadTemplate(templateRoot(task.templateId)));
  } catch {
    return STEP_IDS;
  }
}

const WS_SHELL_SCRIPT_TAG = '<script src="game.js" defer></script>';
const WS_SHELL_STONE_URL = 'url(./stone.svg)';

// 构造 water-sort 试玩预览页:关卡以内联对象注入 window.__WATER_SORT_LEVEL__
// (游戏优先读它;内联脚本先于后面的 game.js 标签执行,顺序可靠),资源全部
// 改写为模板绝对路径,绕开文档相对路径(./game.js、url(./stone.svg))的解析。
// 基础包是经典脚本、无运行时 fetch(file:// 直开可用),不再有 level.json 请求。
function buildWaterSortPreviewHtml({ root, template }, task, taskId) {
  let level = task.config?.level;
  if (!level || typeof level !== 'object' || Array.isArray(level)) {
    level = JSON.parse(fs.readFileSync(path.join(root, template.level?.assetPath || 'level.json'), 'utf8'));
  }
  // 作者可控字段(关卡名等)直接进内联脚本,必须防 </script> 与行分隔符逃逸。
  const levelJson = JSON.stringify(level)
    .replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
  const shell = fs.readFileSync(path.join(root, template.game.indexHtml), 'utf8');
  if (!shell.includes(WS_SHELL_SCRIPT_TAG) || !shell.includes(WS_SHELL_STONE_URL)) {
    throw new Error('预览改写失败:模板壳缺少预期的 script/url 标记');
  }
  for (const anchor of ['</head>', '<body>', '</body>']) {
    const count = shell.split(anchor).length - 1;
    if (count !== 1) throw new Error(`模板壳锚点 ${anchor} 出现 ${count} 次,拒绝注入`);
  }
  const generated = (name) => path.join(taskGeneratedDir(taskId), name);
  const uploaded = (name) => path.join(taskUploadsDir(taskId), name);
  const projectUrl = (kind, name, version = '') =>
    `/project/${taskId}/${kind}/${name}${version ? `?v=${encodeURIComponent(version)}` : ''}`;
  const media = {
    hudLeft: fs.existsSync(generated('hud-left.webp')) ? projectUrl('generated', 'hud-left.webp') : null,
    hudRight: fs.existsSync(generated('hud-right.webp')) ? projectUrl('generated', 'hud-right.webp') : null,
    introVideo: fs.existsSync(uploaded('intro-video.mp4'))
      ? projectUrl('uploads', 'intro-video.mp4', task.uploads?.['intro-video']?.uploadedAt || '')
      : null,
    introPoster: fs.existsSync(generated('poster.webp')) ? projectUrl('generated', 'poster.webp') : null,
    background: fs.existsSync(generated('background.webp')) ? projectUrl('generated', 'background.webp') : null,
    // CTA 图标是模板自带文件(非任务产物),按 /templates/ 绝对 URL 注入。
    ctaIcon: template.overlays?.cta && fs.existsSync(path.join(root, template.overlays.cta, 'icon.png'))
      ? `/templates/${template.id}/${template.overlays.cta}/icon.png`
      : null,
  };
  const injection = buildWsOverlayInjection({ templateRoot: root, template, config: task.config, media });
  let html = shell
    .replace('</head>', `${[...injection.headStyles, ...injection.headScripts].join('\n')}\n</head>`)
    .replace(
      WS_SHELL_SCRIPT_TAG,
      `${injection.uiScript}<script>window.__WATER_SORT_LEVEL__=${levelJson};</script><script src="/templates/${template.id}/game/game.js" defer></script>`,
    );
  const bodyDom = injection.bodyDom.join('\n');
  if (bodyDom) html = html.replace('<body>', `<body>\n${bodyDom}`);
  const bodyScripts = injection.bodyScripts.join('\n');
  if (bodyScripts) html = html.replace('</body>', `${bodyScripts}\n</body>`);
  return html;
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

  if(pathname==='/api/colorever-options'&&req.method==='GET'){
    const entry=templateById('colorever-new');return sendJson(res,200,coloreverPatterns(entry.root));
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

  if (rest[0] === 'uploads') {
    const slot = rest[1];
    if (!UPLOAD_SLOTS.includes(slot)) return sendError(res, 400, `未知上传槽位: ${slot}`);
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
        const single = await runStep({ ...common, stepId, engine });
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
    return sendJson(res, 200, stepPrerequisites(rest[1], patched.config, entry?.template));
  }

  // ----------------------- water-sort 在线试玩预览 -----------------------
  // 手机框 iframe 直接可玩当前配置的关卡,不需要先打包。不取任务锁:只读
  // 模板与任务配置(与 pattern 端点同理)。
  if (rest[0] === 'preview' && req.method === 'GET') {
    const entry = templateById(task.templateId);
    if (!['water-sort', 'dragon-cube', 'colorever-new'].includes(entry?.template?.workbench)) {
      return sendError(res, 400, '该任务模板不支持在线预览');
    }
    try {
      let html;
      if (entry.template.workbench === 'colorever-new') {
        const config=effectiveConfig(entry.template,task.config);
        const {level}=coloreverLevel(entry.root,config);
        const generated=name=>fs.existsSync(path.join(taskGeneratedDir(taskId),name))?`/project/${taskId}/generated/${name}`:null;
        const intro=config.intro?.enabled===true,hud=config.hud?.enabled===true,bg=config.background?.enabled===true;
        html=coloreverHtml({root:entry.root,template:entry.template,level,config,preview:true,media:{introVideo:intro&&fs.existsSync(path.join(taskUploadsDir(taskId),'intro-video.mp4'))?`/project/${taskId}/uploads/intro-video.mp4`:null,introPoster:intro?generated('poster.webp'):null,hudLeft:hud?generated('hud-left.webp'):null,hudRight:hud?generated('hud-right.webp'):null,background:bg?generated('background.webp'):null,ctaIcon:config.cta?.enabled===true?'/templates/colorever-new/overlays/cta/icon.png':null}}).html;
      } else if (entry.template.workbench === 'dragon-cube') {
        const config = effectiveConfig(entry.template, task.config);
        const level = dragonLevel(entry.root, config.levelId);
        const generated = (name) => path.join(taskGeneratedDir(taskId), name);
        const uploaded = (name) => path.join(taskUploadsDir(taskId), name);
        const media = {
          hudLeft: fs.existsSync(generated('hud-left.webp')) ? `/project/${taskId}/generated/hud-left.webp` : null,
          hudRight: fs.existsSync(generated('hud-right.webp')) ? `/project/${taskId}/generated/hud-right.webp` : null,
          introVideo: fs.existsSync(uploaded('intro-video.mp4')) ? `/project/${taskId}/uploads/intro-video.mp4` : null,
          introPoster: fs.existsSync(generated('poster.webp')) ? `/project/${taskId}/generated/poster.webp` : null,
          background: config.background?.enabled === true && fs.existsSync(generated('background.webp')) ? `/project/${taskId}/generated/background.webp` : null,
          ctaIcon: `/templates/dragon-cube/overlays/cta/icon.png`,
        };
        html = dragonHtml({ root: entry.root, template: entry.template, level, config, media, preview: true }).html;
      } else {
        html = buildWaterSortPreviewHtml(entry, task, taskId);
      }
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
      const tplRoot = templateRoot(patched.templateId);
      const config = effectiveConfig(loadTemplate(tplRoot), patched.config);
      const uploads = {
        'pattern-source': path.join(taskUploadsDir(taskId), 'pattern-source.png'),
        'portrait-src-left': path.join(taskProjectDir(taskId), 'uploads', 'portrait-src-left.png'),
        'portrait-src-right': path.join(taskProjectDir(taskId), 'uploads', 'portrait-src-right.png'),
      };
      const generatedDir = taskGeneratedDir(taskId);
      const { sourcePath } = await resolvePatternSource({
        config, uploads, generatedDir, scriptsRoot: SCRIPTS_ROOT,
      });
      const pc = config.patternConfig;
      const allowedTiles = Array.isArray(pc.allowedTiles)
        ? pc.allowedTiles
        : String(pc.allowedTiles || '').split(',').map((tile) => tile.trim()).filter(Boolean);
      const patternArgs = [
        path.join(SCRIPTS_ROOT, 'image-to-pattern-full.py'),
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
        const palette = loadTemplate(templateRoot(patched.templateId)).pattern?.palette || {};
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
