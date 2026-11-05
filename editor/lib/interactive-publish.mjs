import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { taskProjectDir, taskResultDir, PUBLIC_ROOT } from './paths.mjs';
import { readTask, computeStatus, stepInputFilesFor, withTaskLock } from './store.mjs';
import { getEntry } from '../core/registry.mjs';
import { archiveTask } from './task-archive.mjs';
import { run } from '../core/lib/exec.mjs';
import { readJsonBody, sendJson, serveFile, isInsideRoot } from './http-utils.mjs';

const MAX_ZIP = 150 * 1024 * 1024;
const DEFAULT_LAUNCH_EMAIL = 'yihan@novvy.ai';
const defaults = { store_url: '', app_name: '', drama_name: '', episode: '', category: 'Tier1:剧情融合', sequence: '1', tag: '', video_link_mode: 'auto', min_view_duration: '' };
const categories = ['Tier1:剧情融合', 'Tier 2:短剧情钩子', 'Tier3:原爆款素材'];
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const fail = (message, statusCode = 400, extra = {}) => Object.assign(new Error(message), { statusCode, ...extra });
const folder = id => path.join(taskProjectDir(id), 'publish');
const stateFile = id => path.join(folder(id), 'state.json');
function readState(id) {
  try {
    const state = JSON.parse(fs.readFileSync(stateFile(id), 'utf8'));
    // The reference form uses the service default, including for older saved forms.
    state.settings = { ...defaults, ...state.settings, video_link_mode: 'auto' };
    return state;
  }
  catch { return { settings: { ...defaults } }; }
}
function writeState(id, state) {
  // Never resurrect a task deleted while an upstream call was in flight.
  if (!readTask(id)) throw fail('任务已删除', 404);
  fs.mkdirSync(folder(id), { recursive: true });
  fs.writeFileSync(stateFile(id) + '.tmp', JSON.stringify(state, null, 2));
  fs.renameSync(stateFile(id) + '.tmp', stateFile(id));
}
function pruneArtifacts(id, state) {
  const keep = new Set([state.snapshot?.id, state.package?.id]);
  for (const entry of fs.readdirSync(folder(id), { withFileTypes: true })) {
    if (entry.isDirectory() && /^[a-f0-9-]{36}$/.test(entry.name) && !keep.has(entry.name)) {
      fs.rmSync(path.join(folder(id), entry.name), { recursive: true, force: true });
    }
  }
}
function settingsFrom(input = {}) {
  const settings = {};
  for (const [key, fallback] of Object.entries(defaults)) {
    settings[key] = key === 'video_link_mode' ? 'auto' : String(input[key] ?? fallback).trim();
    if (settings[key].length > (key === 'store_url' ? 8000 : 256)) throw fail('表单内容过长');
  }
  if (!categories.includes(settings.category)) throw fail('请选择推广分类');
  if (settings.tag.length > 64) throw fail('Tag 最多填写 64 个字符');
  if (settings.episode && !settings.drama_name) throw fail('填写剧集时必须同时填写剧名（不填剧名则作为通用素材，剧集也留空）！');
  if (settings.min_view_duration && (!/^\d+$/.test(settings.min_view_duration) || Number(settings.min_view_duration) < 3 || Number(settings.min_view_duration) > 2147483647)) {
    throw fail('最短观看时长须为至少 3 秒的整数，或留空');
  }
  settings.sequence ||= '1';
  return settings;
}
function sourceVersion(id) {
  const task = readTask(id);
  if (!task) throw fail('任务不存在', 404);
  const entries = [];
  const root = taskResultDir(id);
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) throw fail('产物目录不能包含符号链接');
      if (entry.isDirectory()) walk(file);
      else if (!entry.name.endsWith('.zip')) {
        const stat = fs.statSync(file);
        entries.push([path.relative(root, file), stat.size, stat.mtimeMs, stat.ctimeMs]);
      }
    }
  }
  walk(root);
  return sha(JSON.stringify([task.templateId, task.config, task.uploads, task.steps, entries]));
}
function ready(id) {
  const task = readTask(id);
  const steps = getEntry(task.templateId).template.steps;
  const status = computeStatus(id, steps, stepInputFilesFor(task.templateId));
  return status?.steps?.pack?.ok && !status.steps.pack.stale && status.hasResult;
}
function requireReady(id) {
  if (!ready(id)) throw fail('当前任务需要先完成最新版本的打包', 409);
}
function urls(settings) { return settings.store_url.split(/[\s,;]+/).filter(Boolean); }

export function createPublisher(options = {}) {
  const base = new URL(options.publishBaseUrl || process.env.INTERACTIVE_ZIP_SERVICE_URL || 'http://35.184.178.253:8780');
  const upstreamFetch = options.publishFetch || fetch;
  const active = new Set();
  function checkOrigin(req) {
    if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)) {
      throw fail('请从当前编辑器页面操作', 403);
    }
  }
  async function request(endpoint, init = {}) {
    let response;
    try {
      response = await upstreamFetch(new URL(endpoint, base), { ...init, redirect: 'error', signal: AbortSignal.timeout(options.publishTimeoutMs || 240000) });
    } catch (error) {
      throw fail('注入服务连接中断或超时：' + error.message, 502, { outcomeUnknown: true });
    }
    const body = await response.json().catch(() => null);
    if (!body) throw fail('注入服务未返回有效 JSON', 502, { outcomeUnknown: true });
    if (!response.ok || ['failed', 'error'].includes(body.status) || body.success === false || Number(body.code) >= 400) {
      const message = typeof body.error === 'string' ? body.error : body.error?.message;
      throw fail(message || body.message || '注入服务请求失败', response.status === 409 ? 409 : 502, { eventCheck: body.event_check, upstreamCode: body.code || response.status, outcomeUnknown: response.status >= 500 });
    }
    return body;
  }
  async function zipForm(id, snapshot, settings) {
    const bytes = fs.readFileSync(path.join(folder(id), snapshot.id, 'source.zip'));
    if (sha(bytes) !== snapshot.sha256) throw fail('原 ZIP 已变化，请重新检查', 409);
    const form = new FormData();
    form.append('zip', new Blob([bytes], { type: 'application/zip' }), id + '.zip');
    form.append('video_link_mode', settings.video_link_mode);
    return form;
  }
  async function download(url, target) {
    const parsed = new URL(url, base);
    if (parsed.origin !== base.origin || !/^\/(?:api\/download|jobs\/)/.test(parsed.pathname)) throw fail('注入服务返回了无效下载地址', 502);
    const response = await upstreamFetch(parsed, { redirect: 'error', signal: AbortSignal.timeout(120000) });
    if (!response.ok || !response.body) throw fail('最终素材包下载失败', 502);
    const fd = fs.openSync(target, 'w');
    let size = 0;
    try {
      for await (const chunk of response.body) {
        size += chunk.length;
        if (size > MAX_ZIP) throw fail('最终素材包超过 150 MiB', 413);
        fs.writeSync(fd, chunk);
      }
    } finally { fs.closeSync(fd); }
  }
  function view(id, req) {
    const state = readState(id);
    const account = options.publishAccount?.(req) || { user: null, expired: false };
    const version = sourceVersion(id);
    const packageStale = !!state.package && (state.package.version !== version || JSON.stringify(state.package.settings) !== JSON.stringify(state.settings) || !ready(id));
    const operation = ['inspect', 'package', 'launch'].includes(state.operation) ? state.operation : null;
    let launch = state.launch?.packageId === state.package?.id ? state.launch : null;
    if (launch?.status === 'running' && !active.has(id)) {
      launch = { ...launch, status: 'unknown', message: '直传连接已中断，结果尚未确认。请先到投放平台核实，避免重复创建创意。' };
    }
    return {
      settings: state.settings, inspection: state.inspection, package: state.package,
      launch, launchEmail: account.expired ? null : account.user?.email || DEFAULT_LAUNCH_EMAIL, account,
      error: state.error,
      running: active.has(id), operation,
      interrupted: !!operation && !active.has(id),
      ready: !!ready(id), packageStale,
      inspectionStale: !!state.snapshot && (state.snapshot.version !== version || state.snapshot.mode !== state.settings.video_link_mode || !ready(id)),
    };
  }

  return async function handle(req, res, url, id, parts) {
    const action = parts[0] || '';
    if (req.method === 'GET' && action === '') return sendJson(res, 200, view(id, req));
    if (req.method === 'GET' && action === 'download') {
      const item = readState(id).package;
      if (!item) throw fail('请先生成投放素材包', 404);
      const bytes = fs.readFileSync(path.join(folder(id), item.id, 'final.zip'));
      res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Length': bytes.length, 'Content-Disposition': "attachment; filename=\"creative.zip\"; filename*=UTF-8''" + encodeURIComponent(item.filename), 'Cache-Control': 'no-store' });
      return res.end(bytes);
    }
    if (req.method === 'GET' && action === 'preview') {
      const revision = parts[1];
      if (!/^[a-f0-9-]{36}$/.test(revision || '') || readState(id).package?.id !== revision) throw fail('预览版本不存在，请重新打开预览', 404);
      const root = path.join(folder(id), revision, 'preview');
      const relative = decodeURIComponent(parts.slice(2).join('/') || 'index.html');
      const file = path.resolve(root, relative);
      if (!isInsideRoot(root, file) || !fs.existsSync(file)) throw fail('预览文件不存在', 404);
      // Opaque-origin iframe; packaged scripts cannot access the editor's DOM or storage.
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Security-Policy', "sandbox allow-scripts; frame-ancestors 'self'");
      if (/\.html?$/i.test(file)) {
        const supplied = url.searchParams.get('monitor') || '';
        const channel = /^[a-f0-9-]{36}$/.test(supplied) ? supplied : '';
        const script = fs.readFileSync(path.join(PUBLIC_ROOT, 'publish-preview.js'), 'utf8');
        const inject = '<script data-publish-monitor>' + script.replace('__MONITOR_CHANNEL__', () => JSON.stringify(channel)) + '</script>';
        const html = fs.readFileSync(file, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(/<head\b[^>]*>/i.test(html) ? html.replace(/<head\b[^>]*>/i, match => match + inject) : inject + html);
      }
      return serveFile(req, res, file);
    }
    if (!(req.method === 'PATCH' && action === 'settings') &&
        !(req.method === 'POST' && ['parse-store', 'inspect', 'package', 'launch'].includes(action))) {
      throw fail('未知素材处理接口', 404);
    }
    checkOrigin(req);
    const body = await readJsonBody(req);
    // A second request can finish receiving its body after another operation starts.
    if (active.has(id)) throw fail('该任务正在处理，请等待当前操作完成', 409);
    const state = readState(id);
    if (action === 'settings') {
      state.settings = settingsFrom(body);
      writeState(id, state);
      return sendJson(res, 200, view(id, req));
    }
    if (action === 'parse-store') {
      // Product recognition does not depend on the other, possibly incomplete fields.
      const settings = settingsFrom({ store_url: body.store_url });
      const result = await request('/api/parse-store-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ store_url: urls(settings)[0], store_urls: urls(settings) }) });
      return sendJson(res, 200, result);
    }
    requireReady(id);
    let launchFile, launchEmail;
    if (action === 'launch') {
      const account = options.publishAccount?.(req);
      if (account?.expired) throw fail('登录已失效，请重新登录或明确退出后使用默认账号', 401);
      launchEmail = account?.user?.email || DEFAULT_LAUNCH_EMAIL;
      if (body.launchEmail != null && body.launchEmail !== launchEmail) throw fail('投放账号已变化，请确认当前账号后重新直传', 409);
      const item = state.package;
      if (!item) throw fail('请先生成投放素材包', 409);
      if (body.packageId !== item.id) throw fail('素材包版本已变化，请刷新后重新操作', 409);
      if (item.version !== sourceVersion(id) || JSON.stringify(item.settings) !== JSON.stringify(state.settings)) {
        throw fail('配置或素材已更新，请重新生成投放素材包后直传', 409);
      }
      const file = path.join(folder(id), item.id, 'final.zip');
      if (!fs.existsSync(file)) throw fail('投放素材包不存在，请重新生成', 409);
      launchFile = fs.readFileSync(file);
      if (launchFile.length > MAX_ZIP || sha(launchFile) !== item.sha256) throw fail('投放素材包已变化，请重新生成', 409);
    }
    active.add(id);
    state.operation = action;
    state.error = null;
    try {
      writeState(id, state);
      if (action === 'inspect') {
        state.inspection = null;
        const revision = crypto.randomUUID();
        const dest = path.join(folder(id), revision);
        fs.mkdirSync(dest, { recursive: true });
        const version = await withTaskLock(id, async () => {
          requireReady(id);
          const before = sourceVersion(id);
          await archiveTask(id, path.join(dest, 'source.zip'));
          if (sourceVersion(id) !== before) throw fail('打包内容发生变化，请重新检查', 409);
          return before;
        });
        const bytes = fs.readFileSync(path.join(dest, 'source.zip'));
        if (bytes.length > MAX_ZIP) throw fail('原 ZIP 超过 150 MiB', 413);
        state.snapshot = { id: revision, version, sha256: sha(bytes), mode: state.settings.video_link_mode };
        const result = await request('/api/interactive-zip/inspect', { method: 'POST', body: await zipForm(id, state.snapshot, state.settings) });
        if (!result.event_check) throw fail('服务未返回原 ZIP 事件检查报告', 502);
        state.inspection = result;
      } else if (action === 'package') {
        if (!state.settings.store_url) throw fail('请填写推广商店地址');
        if (!state.snapshot || state.snapshot.version !== sourceVersion(id) || state.snapshot.mode !== state.settings.video_link_mode) throw fail('请重新进行原 ZIP 事件检查', 409);
        const report = state.inspection?.event_check;
        if (!report) throw fail('请先进行原 ZIP 事件检查', 409);
        if (report.requires_confirmation && body.confirmation !== report.confirmation_token) {
          throw fail('原 ZIP 事件检查有提醒，请确认后继续', 409, { eventCheck: report });
        }
        const form = await zipForm(id, state.snapshot, state.settings);
        for (const [key, value] of Object.entries(state.settings)) if (key !== 'video_link_mode' && value !== '') form.set(key, value);
        form.set('store_url', urls(state.settings)[0]);
        form.set('store_urls', urls(state.settings).join('\n'));
        form.set('auto_launch', 'false');
        const revision = crypto.randomUUID();
        if (report.requires_confirmation) form.set('event_check_confirmation', body.confirmation);
        const result = await request('/api/v1/interactive-zip/package', { method: 'POST', body: form });
        const data = result.data || result;
        if (!data.download_url) throw fail('服务未返回素材包下载地址', 502);
        const dest = path.join(folder(id), revision);
        fs.mkdirSync(dest, { recursive: true });
        await download(data.download_url, path.join(dest, 'final.zip'));
        await run('python3', [fileURLToPath(new URL('./publish-extract.py', import.meta.url)), path.join(dest, 'final.zip'), path.join(dest, 'preview')]);
        state.package = {
          id: revision, version: state.snapshot.version, settings: state.settings,
          filename: path.basename(data.package_file || data.zip_filename || 'creative.zip'),
          jobId: data.job_id, bytes: fs.statSync(path.join(dest, 'final.zip')).size,
          sha256: sha(fs.readFileSync(path.join(dest, 'final.zip'))),
          createdAt: new Date().toISOString(), injectedEvents: data.injected_events || [],
          eventWarningsAccepted: data.event_warnings_accepted === true,
        };
        state.launch = null;
        if (data.event_check) state.inspection.event_check = data.event_check;
      } else if (action === 'launch') {
        const item = state.package;
        const settings = item.settings;
        // Use the documented multipart API and the exact processed ZIP being previewed/downloaded.
        const form = new FormData();
        form.set('file', new Blob([launchFile], { type: 'application/zip' }), item.filename);
        form.set('admin_email', launchEmail);
        form.set('store_urls', urls(settings).join('\n'));
        form.set('category', settings.category);
        if (settings.drama_name) form.set('drama_id', settings.drama_name);
        if (settings.episode) form.set('episode', settings.episode);
        if (settings.min_view_duration) form.set('min_view_duration', settings.min_view_duration);
        state.launch = { packageId: item.id, status: 'running', email: launchEmail, startedAt: new Date().toISOString() };
        writeState(id, state);
        const result = await request('/api/v1/auto-launch', { method: 'POST', body: form });
        if ((result.status !== 'ok' && result.success !== true) || !result.data || typeof result.data !== 'object' ||
            (!result.data.creativeId && !result.data.creatives?.some?.(creative => creative?.creativeId))) {
          throw fail('投放服务未返回可确认的直传结果', 502, { outcomeUnknown: true });
        }
        state.launch = { ...state.launch, status: 'success', completedAt: new Date().toISOString(), data: result.data };
      }
    } catch (error) {
      state.error = error.message;
      if (action === 'launch' && state.launch?.packageId === state.package?.id) {
        state.launch = { ...state.launch, status: error.outcomeUnknown ? 'unknown' : 'failed', message: error.outcomeUnknown ? error.message + '。请先到投放平台核实结果，避免重复创建创意。' : error.message, code: error.upstreamCode || error.statusCode || 502 };
      }
      if (error.eventCheck) {
        state.inspection = { ...state.inspection, event_check: error.eventCheck };
        sendJson(res, error.statusCode, { error: { message: error.message }, event_check: error.eventCheck });
        return;
      }
      throw error;
    } finally {
      state.operation = null;
      active.delete(id);
      if (readTask(id)) {
        writeState(id, state);
        pruneArtifacts(id, state);
      }
    }
    return sendJson(res, 200, view(id, req));
  };
}
