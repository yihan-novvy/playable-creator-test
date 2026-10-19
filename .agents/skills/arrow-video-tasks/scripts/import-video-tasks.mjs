#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const TEMPLATE = 'escape-arrow';
const SKILL = 'arrow-video-tasks';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const log = message => console.log(`${new Date().toISOString()} ${message}`);
const arg = {};
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i];
  if (['--apply', '--help'].includes(key)) arg[key.slice(2)] = true;
  else if (['--source', '--repo', '--date', '--base-url', '--report', '--resume', '--concurrency'].includes(key)) {
    assert.ok(process.argv[i + 1] && !process.argv[i + 1].startsWith('--'), `${key} needs a value`);
    arg[key.slice(2)] = process.argv[++i];
  } else throw new Error(`Unknown argument: ${key}`);
}
if (arg.help) {
  console.log('Preview: node import-video-tasks.mjs --repo REPO --source SOURCE [--date MM-DD] [--report FILE]\nApply: add --apply [--base-url http://127.0.0.1:8088] [--concurrency 2]\nResume/apply saved plan: node import-video-tasks.mjs --resume REPORT --apply');
  process.exit(0);
}
const saved = arg.resume ? read(path.resolve(arg.resume)) : null;
if (saved) {
  assert.equal(saved.version, 1, 'Unsupported report version');
  assert.equal(saved.skill, SKILL, 'Report belongs to another skill');
  for (const field of ['source', 'repo', 'date', 'base-url', 'report']) assert.ok(!arg[field], `Do not override --${field} while resuming`);
}
let repo = arg.repo ? path.resolve(arg.repo) : saved?.repo || process.cwd();
if (!arg.repo && !saved) {
  while (!fs.existsSync(path.join(repo, 'editor/server.mjs')) && path.dirname(repo) !== repo) repo = path.dirname(repo);
}
assert.ok(fs.existsSync(path.join(repo, 'editor/server.mjs')), 'Pass --repo pointing to playable-creator');
const source = saved?.source || (arg.source ? path.resolve(arg.source) : null);
assert.ok(source && fs.statSync(source).isDirectory(), 'Pass --source containing first/second-level directories');
const date = saved?.date || arg.date || new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit' }).format(new Date()).replace('/', '-');
assert.ok(/^\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`2000-${date}T00:00:00Z`)) && new Date(`2000-${date}T00:00:00Z`).toISOString().slice(5, 10) === date, 'Date must be a valid MM-DD');
const baseUrl = new URL(saved?.baseUrl || arg['base-url'] || 'http://127.0.0.1:8088');
assert.ok(baseUrl.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(baseUrl.hostname) && !baseUrl.username && !baseUrl.password && baseUrl.pathname === '/' && !baseUrl.search && !baseUrl.hash, 'Use a local editor HTTP origin');
const concurrency = Number(arg.concurrency || 2);
assert.ok(Number.isInteger(concurrency) && concurrency >= 1 && concurrency <= 4, 'Concurrency must be 1–4');
const plugin = read(path.join(repo, `editor/plugins/${TEMPLATE}/plugin.json`));
assert.equal(plugin.id, TEMPLATE);
const manifest = read(path.join(repo, `editor/templates/${TEMPLATE}/game-manifest.json`));
const validLevels = new Set(manifest.levels.map(level => level.id));
function levelId(value) {
  assert.ok(Number.isInteger(value) && validLevels.has(value), `Invalid Arrow level: ${value}`);
  const entry = manifest.levels.find(level => level.id === value);
  assert.ok(fs.existsSync(path.join(repo, 'editor/templates', TEMPLATE, entry.path)), `Missing Arrow level: ${value}`);
  return value;
}
function object(value, label) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `Expected object: ${label}`);
  return value;
}
function title(source, label) {
  if (source === undefined) source = {};
  object(source, label);
  assert.ok(Object.keys(source).every(key => ['enabled', 'titleEnabled', 'titleLine1', 'titleLine2', 'ariaLabel'].includes(key)), `Unsupported HUD field: ${label}`);
  assert.ok(source.enabled === undefined || source.enabled === false, `Portraits require a separate workflow: ${label}`);
  assert.ok(source.titleEnabled === undefined || typeof source.titleEnabled === 'boolean', `Invalid title switch: ${label}`);
  for (const key of ['titleLine1', 'titleLine2', 'ariaLabel']) assert.ok(source[key] === undefined || typeof source[key] === 'string', `Invalid ${label}.${key}`);
  return { titleEnabled: source.titleEnabled ?? true, titleLine1: source.titleLine1 ?? '', titleLine2: source.titleLine2 ?? '', ...(source.ariaLabel !== undefined ? { ariaLabel: source.ariaLabel } : {}) };
}
function timing(value, label) {
  object(value, label);
  assert.ok(Object.keys(value).every(key => ['mode', 'afterSteps'].includes(key)), `Unsupported ${label} field`);
  assert.ok(value.mode === undefined || ['complete', 'steps'].includes(value.mode), `Invalid ${label}.mode`);
  assert.ok(value.afterSteps === undefined || (Number.isInteger(value.afterSteps) && value.afterSteps >= 1 && value.afterSteps <= 99), `Invalid ${label}.afterSteps`);
  return value;
}
function fromSource(sourceConfig, dual, videos, name) {
  const input = sourceConfig?.data ?? {};
  const warnings = [];
  if (sourceConfig) {
    assert.equal(input.schemaVersion, 1, `Unsupported source config schema: ${name}`);
    assert.equal(input.templateId, TEMPLATE, `Source config belongs to another template: ${name}`);
    const known = ['schemaVersion', 'templateId', 'source', 'drama', 'intro', 'outro', 'hud', 'secondPlayable', 'popup', 'forcedWatchSeconds', 'assets', 'videoSelection', 'readiness', 'levelId', 'gameplay', 'playableCta'];
    assert.ok(Object.keys(input).every(key => known.includes(key)), `Unsupported source config field: ${name}`);
    for (const [key, expected, allowed] of [['intro', true, ['enabled']], ['outro', dual, ['enabled']], ['secondPlayable', dual, ['enabled', 'hud', 'levelId', 'cta']]]) {
      if (input[key] === undefined) continue;
      object(input[key], key);
      assert.ok(Object.keys(input[key]).every(field => allowed.includes(field)), `Unsupported ${key} config: ${name}`);
      assert.ok(input[key].enabled === undefined || input[key].enabled === expected, `Source ${key}.enabled conflicts with media files: ${name}`);
    }
    if (input.assets !== undefined) {
      object(input.assets, 'assets');
      assert.ok(Object.keys(input.assets).every(key => ['introVideo', 'outroVideo', 'game1References', 'game2References'].includes(key)), `Unsupported asset field: ${name}`);
      const intro = videos.includes('1.mp4') ? '1.mp4' : '2.mp4';
      if ('introVideo' in input.assets) assert.equal(input.assets.introVideo, intro, `Source introVideo conflicts with media files: ${name}`);
      if ('outroVideo' in input.assets) assert.equal(input.assets.outroVideo, dual ? '2.mp4' : null, `Source outroVideo conflicts with media files: ${name}`);
      for (const key of ['game1References', 'game2References']) if (input.assets[key] !== undefined) {
        assert.ok(Array.isArray(input.assets[key]), `Invalid ${key}: ${name}`);
        if (input.assets[key].length) warnings.push({ field: `assets.${key}`, value: input.assets[key], reason: 'Reference images are preserved in this report; no level authoring is performed.' });
      }
    }
    if ('forcedWatchSeconds' in input) {
      assert.ok(Number.isFinite(input.forcedWatchSeconds) && input.forcedWatchSeconds >= 0, `Invalid forcedWatchSeconds: ${name}`);
      warnings.push({ field: 'forcedWatchSeconds', value: input.forcedWatchSeconds, reason: 'Current editor has no supported forced-watch setting; preserved in report and not applied.' });
    }
  }
  const config = {
    levelId: levelId(input.levelId ?? plugin.defaults.levelId),
    gameplay: structuredClone(input.gameplay ?? plugin.defaults.gameplay),
    intro: { enabled: true },
    hud: { enabled: false, ...title(input.hud, 'hud') },
    background: { enabled: false },
    outro: { enabled: dual },
    secondPlayable: dual ? { enabled: true, levelId: levelId(input.secondPlayable?.levelId ?? plugin.defaults.secondPlayable.levelId), hud: title(input.secondPlayable?.hud, 'secondPlayable.hud'), background: { enabled: false } } : { enabled: false, background: { enabled: false } },
  };
  object(config.gameplay, 'gameplay');
  assert.ok(Object.entries(config.gameplay).every(([key, value]) => key === 'allowReplay' ? typeof value === 'boolean' : ['lives', 'hints'].includes(key) && (value === 'unlimited' || Number.isInteger(value) && value >= 1 && value <= 99)), `Invalid gameplay: ${name}`);
  if (input.playableCta !== undefined) config.playableCta = timing(input.playableCta, 'playableCta');
  if (input.secondPlayable?.cta !== undefined) {
    assert.ok(dual, `Second playable CTA without dual videos: ${name}`);
    config.secondPlayable.cta = timing(input.secondPlayable.cta, 'secondPlayable.cta');
  }
  if (input.popup !== undefined) {
    object(input.popup, 'popup');
    assert.ok(Object.keys(input.popup).every(key => ['title', 'body', 'rawText'].includes(key)), `Unsupported popup field: ${name}`);
    for (const value of Object.values(input.popup)) assert.equal(typeof value, 'string', `Invalid popup text: ${name}`);
    const text = [input.popup.title, input.popup.body].filter(value => value !== undefined && value !== '').join('\n') || input.popup.rawText || '';
    if (input.popup.rawText && text) assert.equal(input.popup.rawText.trim(), text.trim(), `Popup rawText conflicts with title/body: ${name}`);
    config.cta = { takeoverText: text };
  }
  return { config, warnings };
}
const projectFile = id => {
  assert.ok(/^[a-z0-9][a-z0-9-]{0,63}$/.test(id), 'Invalid editor task ID');
  return path.join(repo, 'project', id, 'project.json');
};
const existing = fs.existsSync(path.join(repo, 'project')) ? fs.readdirSync(path.join(repo, 'project'), { withFileTypes: true }).filter(entry => entry.isDirectory() && /^[a-z0-9][a-z0-9-]{0,63}$/.test(entry.name)).map(entry => projectFile(entry.name)).filter(fs.existsSync).map(read) : [];
const collator = new Intl.Collator('en', { numeric: true });
function entries(root) {
  const result = fs.readdirSync(root, { withFileTypes: true }).filter(entry => entry.name !== '.DS_Store');
  assert.ok(result.every(entry => !entry.isSymbolicLink()), `Symlinks are not supported: ${root}`);
  return result.sort((a, b) => collator.compare(a.name, b.name));
}
function directories(root) {
  const result = entries(root);
  assert.ok(result.length && result.every(entry => entry.isDirectory()), `Expected nonempty directory groups: ${root}`);
  return result.map(entry => entry.name);
}
const tasks = [];
for (const parent of directories(source)) {
  for (const directory of directories(path.join(source, parent))) {
    const folder = path.join(source, parent, directory);
    const files = entries(folder);
    assert.ok(files.every(entry => entry.isFile()), `Unexpected third directory level or special file: ${folder}`);
    assert.ok(files.every(entry => ['1.mp4', '2.mp4', 'config.json'].includes(entry.name)), `Expected 1.mp4 and/or 2.mp4, optional config.json: ${folder}`);
    const videos = files.map(entry => entry.name).filter(name => name.endsWith('.mp4')).sort();
    assert.ok(['["1.mp4"]', '["2.mp4"]', '["1.mp4","2.mp4"]'].includes(JSON.stringify(videos)), `Expected 1.mp4 and/or 2.mp4: ${folder}`);
    const name = `${date}-${directory}-${parent}-${TEMPLATE}`;
    const configFile = path.join(folder, 'config.json');
    const sourceConfig = fs.existsSync(configFile) ? { file: configFile, sha256: sha(fs.readFileSync(configFile)), data: object(read(configFile), configFile) } : null;
    const dual = videos.length === 2;
    const { config, warnings } = fromSource(sourceConfig, dual, videos, name);
    const uploads = videos.map(filename => {
      const file = path.join(folder, filename);
      const size = fs.statSync(file).size;
      assert.ok(size > 12 && size <= 100 * 1024 * 1024, `Invalid upload size: ${file}`);
      const bytes = fs.readFileSync(file);
      assert.equal(bytes.readUInt32BE(4), 0x66747970, `Invalid MP4 magic: ${file}`);
      return { file, filename, slot: videos.length === 2 && filename === '2.mp4' ? 'outro-video' : 'intro-video', bytes: size, sha256: sha(bytes) };
    });
    tasks.push({ name, dual, uploads, config, sourceConfig, warnings, requiredSteps: dual ? ['intro', 'outro'] : ['intro'] });
  }
}
assert.ok(tasks.length, 'No second-level directories found');
assert.equal(new Set(tasks.map(task => task.name)).size, tasks.length, 'Duplicate generated task names');
if (saved) assert.deepEqual(saved.tasks.map(({ name, dual, uploads, config, sourceConfig, warnings, requiredSteps }) => ({ name, dual, uploads, config, sourceConfig, warnings, requiredSteps })), tasks, 'Source files or batch rules changed; inspect before resuming');
const reportPath = path.resolve(arg.resume || arg.report || path.join(os.tmpdir(), `${SKILL}-${crypto.randomUUID()}.json`));
for (const protectedRoot of [source, path.join(repo, 'project'), path.join(repo, 'result'), path.join(repo, 'editor'), path.join(repo, 'template-core'), path.join(repo, '.agents'), path.join(repo, '.git')]) {
  const rel = path.relative(fs.existsSync(protectedRoot) ? fs.realpathSync(protectedRoot) : path.resolve(protectedRoot), path.join(fs.realpathSync(path.dirname(reportPath)), path.basename(reportPath)));
  assert.ok(rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel), 'Save reports outside source, task, template and skill directories');
}
if (!saved && (arg.apply || arg.report)) assert.ok(!fs.existsSync(reportPath), 'Report already exists; use --resume or choose a new report');
for (const task of tasks) {
  const owned = saved?.tasks.find(item => item.name === task.name);
  const matches = existing.filter(item => item.name === task.name);
  task.existing = matches.map(item => item.id);
  if (arg.apply) assert.ok(matches.length === 0 || (matches.length === 1 && owned?.id === matches[0].id), `Existing or ambiguous task: ${task.name}. Do not repeat POST; inspect prior creation/report.`);
  if (owned?.id) assert.ok(matches.some(item => item.id === owned.id), `Recorded task is missing: ${owned.id}`);
}
const report = saved || { version: 1, skill: SKILL, startedAt: new Date().toISOString(), repo, source, date, baseUrl: baseUrl.origin, baseline: existing.map(task => ({ id: task.id, sha256: sha(fs.readFileSync(projectFile(task.id))) })), tasks: tasks.map(({ existing: ignored, ...task }) => ({ ...task, state: 'planned' })) };
const persist = () => {
  fs.writeFileSync(`${reportPath}.writing`, JSON.stringify(report, null, 2));
  fs.renameSync(`${reportPath}.writing`, reportPath);
};
if (!arg.apply) {
  if (arg.report) persist();
  console.log(JSON.stringify({ mode: 'preview', repo, source, date, ...(arg.report || saved ? { reportPath } : {}), tasks: tasks.map(task => ({ name: task.name, type: task.dual ? 'dual' : 'single', levels: [task.config.levelId, ...(task.dual ? [task.config.secondPlayable.levelId] : [])], config: task.config, warnings: task.warnings, uploads: task.uploads.map(({ filename, slot, bytes }) => ({ filename, slot, bytes })), existing: task.existing })), summary: { tasks: tasks.length, dual: tasks.filter(task => task.dual).length, single: tasks.filter(task => !task.dual).length, videos: tasks.reduce((sum, task) => sum + task.uploads.length, 0) } }, null, 2));
  process.exit(0);
}

async function api(route, method = 'GET', payload, headers = {}) {
  const response = await fetch(new URL(route, baseUrl), { method, headers: { ...(payload !== undefined && !Buffer.isBuffer(payload) ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: payload === undefined ? undefined : Buffer.isBuffer(payload) ? payload : JSON.stringify(payload), signal: AbortSignal.timeout(10 * 60_000) });
  const body = await response.json();
  if (!response.ok) throw new Error(`${method} ${route}: ${response.status} ${JSON.stringify(body)}`);
  return body;
}
const env = await api('/api/env');
assert.equal(env.ok, true, 'Editor toolchain is not ready');
const templates = await api('/api/templates');
const remoteTemplate = templates.find(template => template.id === TEMPLATE);
assert.ok(remoteTemplate, 'Template missing from service');
assert.deepEqual(remoteTemplate.defaults, plugin.defaults, 'Service template defaults differ from local plugin');
const listed = await api('/api/tasks');
assert.deepEqual(listed.map(task => task.id).sort(), existing.map(task => task.id).sort(), 'Service task list differs from the chosen repository');
for (const item of listed) {
  const local = existing.find(task => task.id === item.id);
  const remote = await api(`/api/tasks/${item.id}`);
  delete remote.status;
  assert.deepEqual(remote, local, `Service uses a different repository or task changed: ${item.id}`);
}
persist();
log(`Report: ${reportPath}`);
const allowedUploads = task => task.uploads.map(upload => upload.slot).sort();
function checkOwned(doc, task) {
  if (task.sourceConfig) assert.equal(sha(fs.readFileSync(task.sourceConfig.file)), task.sourceConfig.sha256, `Source config changed: ${task.name}`);
  assert.equal(doc.name, task.name);
  assert.equal(doc.templateId, TEMPLATE);
  assert.ok(Object.keys(doc.steps).every(step => task.requiredSteps.includes(step)), `Non-media step exists: ${task.id}`);
  assert.equal(doc.status.hasResult, false, `Task has been packaged: ${task.id}`);
  if (task.savedConfig) assert.deepEqual(doc.config, task.savedConfig, `Task config was edited: ${task.id}`);
  assert.ok(Object.keys(doc.uploads).every(slot => allowedUploads(task).includes(slot)), `Unexpected uploads: ${task.id}`);
}
for (const task of report.tasks) {
  if (!task.id) {
    task.state = 'creating'; persist();
    let created;
    try {
      created = await api('/api/tasks', 'POST', { name: task.name, templateId: TEMPLATE });
    } catch (error) {
      task.state = 'creation-uncertain'; task.error = error.message; persist();
      throw new Error(`Creation outcome needs inspection before retry: ${task.name}: ${error.message}`);
    }
    task.id = created.id; task.state = 'created'; persist();
    assert.ok(fs.existsSync(projectFile(task.id)), 'New task did not appear in the target repository; stop');
  }
  try {
    let doc = await api(`/api/tasks/${task.id}`);
    checkOwned(doc, task);
    if (!task.savedConfig) {
      if (doc.config !== null) assert.deepEqual(doc.config, task.config, `Task config was edited: ${task.id}`);
      const updated = await api(`/api/tasks/${task.id}`, 'PATCH', { config: task.config });
      assert.deepEqual(updated.config, task.config, 'Config differs from batch profile');
      task.savedConfig = updated.config; persist();
    }
    for (const upload of task.uploads) {
      assert.equal(sha(fs.readFileSync(upload.file)), upload.sha256, 'Source changed before upload');
      if (doc.uploads[upload.slot]) {
        assert.equal(doc.uploads[upload.slot].sha256, upload.sha256, `Uploaded media changed: ${task.id}/${upload.slot}`);
        const file = path.join(repo, 'project', task.id, 'uploads', `${upload.slot}.mp4`);
        if (fs.existsSync(file) && sha(fs.readFileSync(file)) === upload.sha256) continue;
      }
      const result = await api(`/api/tasks/${task.id}/uploads/${upload.slot}`, 'PUT', fs.readFileSync(upload.file), { 'Content-Type': 'video/mp4', 'x-novvy-original-name': encodeURIComponent(upload.filename) });
      assert.equal(result.sha256, upload.sha256, 'Upload checksum mismatch');
      assert.equal(result.bytes, upload.bytes);
    }
    task.state = 'uploaded'; delete task.error; persist();
    log(`Ready: ${task.id}`);
  } catch (error) {
    task.state = 'failed'; task.error = error.message; persist();
    log(`FAILED preparation: ${task.id}: ${error.message}`);
  }
}
function outputs(task, step) {
  return ({ intro: ['intro-video.mp4', 'poster.webp'], outro: ['outro-video.mp4'] })[step].map(name => path.join(repo, 'project', task.id, 'generated', name));
}
let cursor = 0;
async function worker() {
  while (cursor < report.tasks.length) {
    const task = report.tasks[cursor++];
    if (task.state === 'failed') continue;
    try {
      task.state = 'running'; persist();
      for (const step of task.requiredSteps) {
        const doc = await api(`/api/tasks/${task.id}`);
        checkOwned(doc, task);
        task.results = doc.steps;
        if (doc.status.steps[step]?.ok && !doc.status.steps[step].stale && outputs(task, step).every(file => fs.existsSync(file) && fs.statSync(file).size > 0)) continue;
        const result = await api(`/api/tasks/${task.id}/run`, 'POST', { step });
        assert.ok(result.ok && !result.metrics?.skipped, `Step did not produce media: ${task.id}/${step}`);
        task.results[step] = result;
        persist();
        log(`Passed: ${task.id}/${step}`);
      }
      const doc = await api(`/api/tasks/${task.id}`);
      checkOwned(doc, task);
      assert.deepEqual(doc.config, task.config, 'Config differs from batch profile');
      assert.deepEqual(Object.keys(doc.steps).sort(), [...task.requiredSteps].sort());
      assert.deepEqual(Object.keys(doc.uploads).sort(), allowedUploads(task));
      for (const upload of task.uploads) {
        assert.equal(doc.uploads[upload.slot].originalName, upload.filename);
        assert.equal(doc.uploads[upload.slot].bytes, upload.bytes);
        assert.equal(doc.uploads[upload.slot].sha256, upload.sha256);
        assert.equal(sha(fs.readFileSync(path.join(repo, 'project', task.id, 'uploads', `${upload.slot}.mp4`))), upload.sha256);
        assert.equal(sha(fs.readFileSync(upload.file)), upload.sha256, 'Source changed');
      }
      for (const step of task.requiredSteps) {
        assert.ok(doc.status.steps[step].ok && !doc.status.steps[step].stale);
        assert.ok(outputs(task, step).every(file => fs.statSync(file).size > 0));
        const videoFile = outputs(task, step)[0];
        assert.equal(fs.statSync(videoFile).size, doc.steps[step].metrics.videoPackagedBytes, 'Transcoded video size mismatch');
        assert.ok(doc.steps[step].metrics.durationSec > 0 && doc.steps[step].metrics.packagedWidth > 0 && doc.steps[step].metrics.packagedHeight > 0, 'Invalid video metrics');
      }
      assert.ok(!fs.existsSync(path.join(repo, 'result', task.id)), 'Unexpected package output');
      const generated = fs.readdirSync(path.join(repo, 'project', task.id, 'generated')).sort();
      assert.deepEqual(generated, task.requiredSteps.flatMap(step => outputs(task, step).map(file => path.basename(file))).sort());
      task.results = doc.steps; task.state = 'complete'; delete task.error; persist();
      log(`Complete: ${task.id}`);
    } catch (error) {
      task.state = 'failed'; task.error = error.message; persist();
      log(`FAILED: ${task.id}: ${error.message}`);
    }
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));
report.finishedAt = new Date().toISOString();
report.summary = { tasks: report.tasks.length, dual: report.tasks.filter(task => task.dual).length, single: report.tasks.filter(task => !task.dual).length, videos: report.tasks.reduce((sum, task) => sum + task.uploads.length, 0), completed: report.tasks.filter(task => task.state === 'complete').length, warnings: report.tasks.flatMap(task => task.warnings.map(warning => ({ id: task.id, ...warning }))), successfulSteps: report.tasks.reduce((sum, task) => sum + Object.values(task.results || {}).filter(result => result.ok).length, 0), failures: report.tasks.filter(task => task.state === 'failed').map(task => ({ id: task.id, error: task.error })), baselineTasksUnchanged: report.baseline.every(task => fs.existsSync(projectFile(task.id)) && sha(fs.readFileSync(projectFile(task.id))) === task.sha256) };
persist();
log(`FINAL ${JSON.stringify(report.summary)}`);
if (report.summary.failures.length || !report.summary.baselineTasksUnchanged) process.exitCode = 1;
