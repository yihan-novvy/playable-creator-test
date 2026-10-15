#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const OPENING = { mode: 'medium', coverage: 95, batchSize: 30, seed: 1 };
const CTA = { mode: 'steps', afterSteps: 8 };
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
  console.log('Preview: node import-video-tasks.mjs --repo REPO --source SOURCE [--date MM-DD]\nApply: add --apply [--base-url http://127.0.0.1:8088] [--report FILE] [--concurrency 2]\nResume: node import-video-tasks.mjs --resume REPORT --apply');
  process.exit(0);
}
const saved = arg.resume ? read(path.resolve(arg.resume)) : null;
if (saved) {
  assert.equal(saved.version, 1, 'Unsupported report version');
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
const plugin = read(path.join(repo, 'editor/plugins/colorever-new/plugin.json'));
assert.equal(plugin.id, 'colorever-new');
const projectFile = id => {
  assert.ok(/^[a-z0-9][a-z0-9-]{0,63}$/.test(id), 'Invalid editor task ID');
  return path.join(repo, 'project', id, 'project.json');
};
const existing = fs.existsSync(path.join(repo, 'project')) ? fs.readdirSync(path.join(repo, 'project'), { withFileTypes: true }).filter(entry => entry.isDirectory() && /^[a-z0-9][a-z0-9-]{0,63}$/.test(entry.name)).map(entry => projectFile(entry.name)).filter(fs.existsSync).map(read) : [];
const collator = new Intl.Collator('en', { numeric: true });
const directories = root => fs.readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort(collator.compare);
const tasks = [];
for (const parent of directories(source)) {
  for (const directory of directories(path.join(source, parent))) {
    const folder = path.join(source, parent, directory);
    assert.equal(directories(folder).length, 0, `Unexpected third directory level: ${folder}`);
    const videos = fs.readdirSync(folder).filter(name => /\.mp4$/i.test(name)).sort();
    assert.ok(['["1.mp4"]', '["2.mp4"]', '["1.mp4","2.mp4"]'].includes(JSON.stringify(videos)), `Expected 1.mp4 and/or 2.mp4: ${folder}`);
    const dual = videos.length === 2;
    const config = {
      intro: { enabled: true },
      hud: { enabled: false, titleEnabled: true, titleLine1: '', titleLine2: '' },
      background: { enabled: true, source: 'video-last', blurSigma: 12 },
      outro: { enabled: dual },
      secondPlayable: dual ? { enabled: true, opening: OPENING, cta: CTA, hud: { titleLine1: '', titleLine2: '' }, background: { enabled: true, source: 'video-last', blurSigma: 12 } } : { enabled: false, background: { enabled: false } },
      ...(!dual ? { opening: OPENING, playableCta: CTA } : {}),
    };
    const uploads = videos.map(filename => {
      const file = path.join(folder, filename);
      const size = fs.statSync(file).size;
      assert.ok(size > 12 && size <= 100 * 1024 * 1024, `Invalid upload size: ${file}`);
      const bytes = fs.readFileSync(file);
      assert.equal(bytes.readUInt32BE(4), 0x66747970, `Invalid MP4 magic: ${file}`);
      return { file, filename, slot: dual && filename === '2.mp4' ? 'outro-video' : 'intro-video', bytes: size, sha256: sha(bytes) };
    });
    tasks.push({ name: `${date}-${directory}-${parent}-colorever`, dual, uploads, config, requiredSteps: dual ? ['intro', 'background', 'outro', 'background2'] : ['intro', 'background'] });
  }
}
assert.ok(tasks.length, 'No second-level directories found');
assert.equal(new Set(tasks.map(task => task.name)).size, tasks.length, 'Duplicate generated task names');
if (saved) assert.deepEqual(saved.tasks.map(({ name, dual, uploads, config, requiredSteps }) => ({ name, dual, uploads, config, requiredSteps })), tasks, 'Source files or batch rules changed; inspect before resuming');
const reportPath = path.resolve(arg.resume || arg.report || path.join(os.tmpdir(), `colorever-video-tasks-${crypto.randomUUID()}.json`));
assert.ok(!tasks.some(task => task.uploads.some(upload => upload.file === reportPath)), 'Report must not replace media');
if (arg.apply && !saved) assert.ok(!fs.existsSync(reportPath), 'Report already exists; use --resume or choose a new report');
for (const task of tasks) {
  const owned = saved?.tasks.find(item => item.name === task.name);
  const matches = existing.filter(item => item.name === task.name);
  task.existing = matches.map(item => item.id);
  if (arg.apply) assert.ok(matches.length === 0 || (matches.length === 1 && owned?.id === matches[0].id), `Existing or ambiguous task: ${task.name}. Do not repeat POST; inspect prior creation/report.`);
  if (owned?.id) assert.ok(matches.some(item => item.id === owned.id), `Recorded task is missing: ${owned.id}`);
}
if (!arg.apply) {
  console.log(JSON.stringify({ mode: 'preview', repo, source, date, tasks: tasks.map(task => ({ name: task.name, type: task.dual ? 'dual' : 'single', uploads: task.uploads.map(({ filename, slot, bytes }) => ({ filename, slot, bytes })), existing: task.existing })), summary: { tasks: tasks.length, dual: tasks.filter(task => task.dual).length, single: tasks.filter(task => !task.dual).length, videos: tasks.reduce((sum, task) => sum + task.uploads.length, 0) } }, null, 2));
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
assert.ok(templates.some(template => template.id === 'colorever-new'), 'Template missing from service');
const listed = await api('/api/tasks');
assert.deepEqual(listed.map(task => task.id).sort(), existing.map(task => task.id).sort(), 'Service task list differs from the chosen repository');
for (const item of listed) {
  const local = existing.find(task => task.id === item.id);
  const remote = await api(`/api/tasks/${item.id}`);
  delete remote.status;
  assert.deepEqual(remote, local, `Service uses a different repository or task changed: ${item.id}`);
}
const report = saved || { version: 1, startedAt: new Date().toISOString(), repo, source, date, baseUrl: baseUrl.origin, baseline: existing.map(task => ({ id: task.id, sha256: sha(fs.readFileSync(projectFile(task.id))) })), tasks: tasks.map(({ existing: ignored, ...task }) => ({ ...task, state: 'planned' })) };
const persist = () => {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(`${reportPath}.writing`, JSON.stringify(report, null, 2));
  fs.renameSync(`${reportPath}.writing`, reportPath);
};
persist();
log(`Report: ${reportPath}`);
const allowedUploads = task => task.uploads.map(upload => upload.slot).sort();
function checkOwned(doc, task) {
  assert.equal(doc.name, task.name);
  assert.equal(doc.templateId, 'colorever-new');
  assert.ok(Object.keys(doc.steps).every(step => task.requiredSteps.includes(step)), `Non-media step exists: ${task.id}`);
  assert.equal(doc.status.hasResult, false, `Task has been packaged: ${task.id}`);
  if (task.savedConfig) assert.deepEqual(doc.config, task.savedConfig, `Task config was edited: ${task.id}`);
  assert.ok(Object.keys(doc.uploads).every(slot => allowedUploads(task).includes(slot)), `Unexpected uploads: ${task.id}`);
}
for (const task of report.tasks) {
  if (!task.id) {
    task.state = 'creating'; persist();
    const created = await api('/api/tasks', 'POST', { name: task.name, templateId: 'colorever-new' });
    task.id = created.id; task.state = 'created'; persist();
    assert.ok(fs.existsSync(projectFile(task.id)), 'New task did not appear in the target repository; stop');
  }
  let doc = await api(`/api/tasks/${task.id}`);
  checkOwned(doc, task);
  if (!task.savedConfig) {
    const updated = await api(`/api/tasks/${task.id}`, 'PATCH', { config: task.config });
    task.savedConfig = updated.config; persist();
  }
  for (const upload of task.uploads) {
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
}
function outputs(task, step) {
  return ({ intro: ['intro-video.mp4', 'poster.webp'], background: ['background.webp'], outro: ['outro-video.mp4'], background2: ['background2.webp'] })[step].map(name => path.join(repo, 'project', task.id, 'generated', name));
}
let cursor = 0;
async function worker() {
  while (cursor < report.tasks.length) {
    const task = report.tasks[cursor++];
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
        if (step.startsWith('background')) {
          assert.equal(doc.steps[step].metrics.source, 'video-last');
          assert.equal(doc.steps[step].metrics.width, plugin.background.width);
          assert.equal(doc.steps[step].metrics.height, plugin.background.height);
        }
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
report.summary = { tasks: report.tasks.length, dual: report.tasks.filter(task => task.dual).length, single: report.tasks.filter(task => !task.dual).length, videos: report.tasks.reduce((sum, task) => sum + task.uploads.length, 0), completed: report.tasks.filter(task => task.state === 'complete').length, successfulSteps: report.tasks.reduce((sum, task) => sum + Object.values(task.results || {}).filter(result => result.ok).length, 0), failures: report.tasks.filter(task => task.state === 'failed').map(task => ({ id: task.id, error: task.error })), baselineTasksUnchanged: report.baseline.every(task => fs.existsSync(projectFile(task.id)) && sha(fs.readFileSync(projectFile(task.id))) === task.sha256) };
persist();
log(`FINAL ${JSON.stringify(report.summary)}`);
if (report.summary.failures.length) process.exitCode = 1;
