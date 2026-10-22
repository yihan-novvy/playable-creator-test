import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import test from 'node:test';

const script = fileURLToPath(new URL('./import-video-tasks.mjs', import.meta.url));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
function fixture(t, files = ['1.mp4']) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'colorever-origin-import-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const repo = path.join(root, 'repo');
  const source = path.join(root, 'source');
  const leaf = path.join(source, 'keble', '2059541389654171649');
  fs.mkdirSync(path.join(repo, 'editor/plugins/colorever-origin'), { recursive: true });
  fs.mkdirSync(leaf, { recursive: true });
  fs.writeFileSync(path.join(repo, 'editor/server.mjs'), '');
  fs.writeFileSync(path.join(repo, 'editor/plugins/colorever-origin/plugin.json'), JSON.stringify({
    id: 'colorever-origin', steps: [{ id: 'intro' }, { id: 'pack' }], uploads: { 'intro-video': {} },
    defaults: { hud: { titleEnabled: true, titleLine1: 'Colorever', titleLine2: 'The Best Brain-Training Game' }, intro: { enabled: false } },
  }));
  for (const file of files) fs.writeFileSync(path.join(leaf, file), Buffer.from('0000ftypisom0000000000000000'));
  const report = path.join(root, 'report.json');
  const invoke = (args, preload) => spawnSync(process.execPath, [...(preload ? ['--import', preload] : []), script, ...args], { encoding: 'utf8', timeout: 10000, env: { ...process.env, ORIGIN_TEST_ROOT: root } });
  const run = (args = [], preload) => invoke(['--repo', repo, '--source', source, '--date', '10-22', ...args], preload);
  return { root, repo, source, leaf, report, run, invoke };
}

test('preview maps 1.mp4, exact CTA profile and names without writing tasks', t => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.source, '.DS_Store'), 'ignored');
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  const preview = JSON.parse(result.stdout);
  assert.deepEqual(preview.summary, { tasks: 1, videos: 1 });
  const task = preview.tasks[0];
  assert.equal(task.name, '10-22-2059541389654171649-keble-colorever-origin');
  assert.deepEqual(task.config, { intro: { enabled: true }, hud: { titleEnabled: true }, playableCta: { mode: 'steps', afterSteps: 20, intervals: [10, 8, 6, 4] } });
  assert.deepEqual(task.requiredSteps, ['intro']);
  assert.deepEqual(task.uploads.map(x => [x.filename, x.slot]), [['1.mp4', 'intro-video']]);
  assert.equal(fs.existsSync(path.join(f.repo, 'project')), false);
  assert.equal(fs.existsSync(f.report), false);
});

test('same leaf names in different parent groups produce distinct tasks', t => {
  const f = fixture(t);
  const other = path.join(f.source, 'liangshuo', path.basename(f.leaf));
  fs.mkdirSync(other, { recursive: true });
  fs.copyFileSync(path.join(f.leaf, '1.mp4'), path.join(other, '1.mp4'));
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  const preview = JSON.parse(result.stdout);
  assert.equal(preview.summary.tasks, 2);
  assert.equal(new Set(preview.tasks.map(x => x.name)).size, 2);
});

test('2.mp4 cannot substitute for 1.mp4 or create an outro', t => {
  for (const files of [['2.mp4'], ['1.mp4', '2.mp4']]) {
    const f = fixture(t, files);
    const result = f.run(['--report', f.report]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Expected exactly 1.mp4/);
    assert.equal(fs.existsSync(f.report), false);
  }
});

test('resume detects changed source without overwriting its report', t => {
  const f = fixture(t);
  const result = f.run(['--report', f.report]);
  assert.equal(result.status, 0, result.stderr);
  const saved = fs.readFileSync(f.report, 'utf8');
  assert.equal(f.invoke(['--resume', f.report]).status, 0);
  fs.appendFileSync(path.join(f.leaf, '1.mp4'), 'changed');
  const changed = f.invoke(['--resume', f.report]);
  assert.notEqual(changed.status, 0);
  assert.match(changed.stderr, /Source files or batch rules changed/);
  assert.equal(fs.readFileSync(f.report, 'utf8'), saved);
});

test('nested folders and invalid MP4 fail before writes', t => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.leaf, 'nested'));
  assert.match(f.run(['--report', f.report]).stderr, /Unexpected third directory level/);
  fs.rmdirSync(path.join(f.leaf, 'nested'));
  fs.writeFileSync(path.join(f.leaf, '1.mp4'), 'not a valid mp4 file');
  assert.match(f.run(['--report', f.report]).stderr, /Invalid MP4 magic/);
  assert.equal(fs.existsSync(f.report), false);
});

test('same-name existing tasks block apply before contacting API', t => {
  const f = fixture(t);
  const doc = { id: 'owned', name: '10-22-2059541389654171649-keble-colorever-origin' };
  fs.mkdirSync(path.join(f.repo, 'project/owned'), { recursive: true });
  fs.writeFileSync(path.join(f.repo, 'project/owned/project.json'), JSON.stringify(doc));
  const result = f.run(['--apply', '--report', f.report]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Existing or ambiguous task/);
  assert.deepEqual(read(path.join(f.repo, 'project/owned/project.json')), doc);
  assert.equal(fs.existsSync(f.report), false);
});

test('API failure and resume preserve task identity, upload hash and intro-only execution', t => {
  const f = fixture(t);
  const preload = path.join(f.root, 'mock-api.mjs');
  fs.writeFileSync(preload, `
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = process.env.ORIGIN_TEST_ROOT;
const repo = path.join(root, 'repo');
const taskDir = path.join(repo, 'project/server-assigned');
const docFile = path.join(taskDir, 'project.json');
const calls = path.join(root, 'calls.jsonl');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = doc => fs.writeFileSync(docFile, JSON.stringify(doc));
globalThis.fetch = async (input, options = {}) => {
  const route = new URL(input).pathname;
  const method = options.method || 'GET';
  const payload = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
  fs.appendFileSync(calls, JSON.stringify({ route, method, ...(payload?.step ? { step: payload.step } : {}) }) + '\\n');
  let body, status = 200;
  if (route === '/api/env') body = { ok: true };
  else if (route === '/api/templates') body = [read(path.join(repo, 'editor/plugins/colorever-origin/plugin.json'))];
  else if (route === '/api/tasks' && method === 'GET') body = fs.existsSync(docFile) ? [read(docFile)] : [];
  else if (route === '/api/tasks' && method === 'POST') {
    fs.mkdirSync(path.join(taskDir, 'uploads'), { recursive: true });
    fs.mkdirSync(path.join(taskDir, 'generated'));
    body = { id: 'server-assigned', name: payload.name, templateId: payload.templateId, config: null, uploads: {}, steps: {} };
    save(body);
  } else if (route.startsWith('/api/tasks/server-assigned')) {
    const doc = read(docFile);
    if (method === 'PATCH') { doc.config = payload.config; save(doc); body = doc; }
    else if (method === 'PUT' && route.endsWith('/uploads/intro-video')) {
      fs.writeFileSync(path.join(taskDir, 'uploads/intro-video.mp4'), payload);
      doc.uploads['intro-video'] = { originalName: decodeURIComponent(options.headers['x-novvy-original-name']), bytes: payload.length, sha256: crypto.createHash('sha256').update(payload).digest('hex') };
      save(doc); body = doc.uploads['intro-video'];
    } else if (method === 'POST' && route.endsWith('/run') && payload.step === 'intro') {
      const failure = path.join(root, 'failed-once');
      if (!fs.existsSync(failure)) { fs.writeFileSync(failure, '1'); status = 500; body = { error: 'simulated transcoding failure' }; }
      else {
        fs.writeFileSync(path.join(taskDir, 'generated/intro-video.mp4'), 'transcoded');
        fs.writeFileSync(path.join(taskDir, 'generated/poster.webp'), 'poster');
        doc.steps.intro = { ok: true, metrics: { durationSec: 7, videoPackagedBytes: 10, packagedWidth: 720, packagedHeight: 1280 } };
        save(doc); body = doc.steps.intro;
      }
    } else if (method === 'GET') body = { ...doc, status: { hasResult: false, steps: { intro: { ok: !!doc.steps.intro?.ok, stale: false } } } };
    else throw new Error('Unexpected task action: ' + route);
  } else throw new Error('Unexpected API: ' + route);
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
};
`);
  const first = f.run(['--apply', '--report', f.report], preload);
  assert.equal(first.status, 1, first.stderr);
  assert.equal(read(f.report).tasks[0].id, 'server-assigned');
  assert.equal(read(f.report).summary.failures.length, 1);
  const resumed = f.invoke(['--resume', f.report, '--apply'], preload);
  assert.equal(resumed.status, 0, resumed.stderr);
  assert.equal(read(f.report).summary.completed, 1);
  const docFile = path.join(f.repo, 'project/server-assigned/project.json');
  const docBefore = fs.readFileSync(docFile, 'utf8');
  const callFile = path.join(f.root, 'calls.jsonl');
  const callsBefore = fs.readFileSync(callFile, 'utf8');
  const again = f.invoke(['--resume', f.report, '--apply'], preload);
  assert.equal(again.status, 0, again.stderr);
  const calls = fs.readFileSync(callFile, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(calls.filter(x => x.route === '/api/tasks' && x.method === 'POST').length, 1);
  assert.equal(calls.filter(x => x.method === 'PUT').length, 1);
  assert.deepEqual(calls.filter(x => x.route.endsWith('/run')).map(x => x.step), ['intro', 'intro']);
  assert.ok(fs.readFileSync(callFile, 'utf8').slice(callsBefore.length).trim().split('\n').map(JSON.parse).every(x => x.method === 'GET'));
  assert.equal(fs.readFileSync(docFile, 'utf8'), docBefore);
  assert.deepEqual(Object.keys(read(docFile).steps), ['intro']);
  assert.equal(fs.existsSync(path.join(f.repo, 'result')), false);
});
