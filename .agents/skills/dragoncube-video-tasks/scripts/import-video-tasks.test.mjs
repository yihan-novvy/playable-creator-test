import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import test from 'node:test';

const script = fileURLToPath(new URL('./import-video-tasks.mjs', import.meta.url));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
function fixture(t, files = ['1.mp4', '2.mp4']) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dragoncube-import-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const repo = path.join(root, 'repo');
  const source = path.join(root, 'source');
  const leaf = path.join(source, '1234567890123456789', 'george-1');
  fs.mkdirSync(path.join(repo, 'editor/plugins/dragon-cube'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'editor/templates/dragon-cube/levels'), { recursive: true });
  fs.mkdirSync(leaf, { recursive: true });
  fs.writeFileSync(path.join(repo, 'editor/server.mjs'), '');
  fs.writeFileSync(path.join(repo, 'editor/plugins/dragon-cube/plugin.json'), JSON.stringify({ id: 'dragon-cube', level: { directory: 'levels' } }));
  for (const level of [4, 5, 9, 10]) fs.writeFileSync(path.join(repo, `editor/templates/dragon-cube/levels/${level}.json`), '{}');
  for (const file of files) fs.writeFileSync(path.join(leaf, file), Buffer.from('0000ftypisom0000000000000000'));
  const report = path.join(root, 'report.json');
  const run = args => spawnSync(process.execPath, [script, '--repo', repo, '--source', source, '--date', '10-16', ...args], { encoding: 'utf8', timeout: 10000 });
  return { root, repo, source, leaf, report, run };
}

test('preview maps dual videos and leaves the repository untouched', t => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.source, '.DS_Store'), 'ignored');
  const result = f.run([]);
  assert.equal(result.status, 0, result.stderr);
  const preview = JSON.parse(result.stdout);
  assert.deepEqual(preview.summary, { tasks: 1, dual: 1, single: 0, videos: 2 });
  assert.deepEqual(preview.tasks[0].uploads.map(x => x.slot), ['intro-video', 'outro-video']);
  assert.ok([4, 5].includes(preview.tasks[0].levels[0]) && [9, 10].includes(preview.tasks[0].levels[1]));
  assert.equal(fs.existsSync(path.join(f.repo, 'project')), false);
  assert.equal(fs.existsSync(f.report), false);
});

test('a lone 2.mp4 is assigned to intro; repeat requires explicit selection', t => {
  const f = fixture(t, ['2.mp4']);
  const single = f.run(['--report', f.report]);
  assert.equal(single.status, 0, single.stderr);
  const plan = read(f.report).tasks[0];
  assert.equal(plan.uploads[0].slot, 'intro-video');
  assert.equal(plan.uploads[0].filename, '2.mp4');
  assert.equal(plan.config.outro.enabled, false);
  assert.equal(plan.config.secondPlayable.enabled, false);
  assert.deepEqual(plan.requiredSteps, ['intro']);
  const repeated = f.run(['--single-video', 'repeat']);
  assert.equal(repeated.status, 0, repeated.stderr);
  assert.deepEqual(JSON.parse(repeated.stdout).tasks[0].uploads.map(x => x.slot), ['intro-video', 'outro-video']);
});

test('a saved plan preserves random levels and rejects changed source media', t => {
  const f = fixture(t);
  const first = f.run(['--report', f.report]);
  assert.equal(first.status, 0, first.stderr);
  const plan = read(f.report);
  assert.equal(plan.tasks[0].config.background.enabled, false);
  assert.equal(plan.tasks[0].config.secondPlayable.background.enabled, false);
  assert.equal(plan.tasks[0].config.hud.titleEnabled, true);
  assert.deepEqual(plan.tasks[0].requiredSteps, ['intro', 'outro']);
  const resume = () => spawnSync(process.execPath, [script, '--resume', f.report], { encoding: 'utf8', timeout: 10000 });
  const second = resume();
  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual(JSON.parse(second.stdout).tasks[0].levels, JSON.parse(first.stdout).tasks[0].levels);
  fs.appendFileSync(path.join(f.leaf, '1.mp4'), 'changed');
  const changed = resume();
  assert.notEqual(changed.status, 0);
  assert.match(changed.stderr, /Source files or batch rules changed/);
  assert.deepEqual(read(f.report), plan);
});

test('extra files and third-level directories fail before writes', t => {
  const f = fixture(t, ['1.mp4', '2.mp4', '3.mp4']);
  const extra = f.run(['--report', f.report]);
  assert.notEqual(extra.status, 0);
  assert.match(extra.stderr, /Expected 1.mp4 and\/or 2.mp4/);
  fs.unlinkSync(path.join(f.leaf, '3.mp4'));
  fs.mkdirSync(path.join(f.leaf, 'nested'));
  const nested = f.run(['--report', f.report]);
  assert.notEqual(nested.status, 0);
  assert.match(nested.stderr, /Unexpected third directory level/);
  assert.equal(fs.existsSync(f.report), false);
});

test('existing same-name task blocks apply before any API connection', t => {
  const f = fixture(t);
  const doc = { id: 'owned', name: '10-16-george-1-1234567890123456789-dragon-cube' };
  fs.mkdirSync(path.join(f.repo, 'project/owned'), { recursive: true });
  fs.writeFileSync(path.join(f.repo, 'project/owned/project.json'), JSON.stringify(doc));
  const result = f.run(['--apply', '--report', f.report]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Existing or ambiguous task/);
  assert.deepEqual(read(path.join(f.repo, 'project/owned/project.json')), doc);
  assert.equal(fs.existsSync(f.report), false);
});
