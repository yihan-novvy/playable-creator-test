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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'arrow-import-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const repo = path.join(root, 'repo');
  const source = path.join(root, 'source');
  const leaf = path.join(source, '1234567890123456789', 'george-1');
  fs.mkdirSync(path.join(repo, 'editor/plugins/escape-arrow'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'editor/templates/escape-arrow/levels'), { recursive: true });
  fs.mkdirSync(leaf, { recursive: true });
  fs.writeFileSync(path.join(repo, 'editor/server.mjs'), '');
  fs.writeFileSync(path.join(repo, 'editor/plugins/escape-arrow/plugin.json'), JSON.stringify({ id: 'escape-arrow', defaults: { levelId: 1, secondPlayable: { levelId: 2 }, gameplay: { lives: 3, hints: 'unlimited', allowReplay: true } } }));
  fs.writeFileSync(path.join(repo, 'editor/templates/escape-arrow/game-manifest.json'), JSON.stringify({ levels: [1, 2, 100].map(id => ({ id, path: `levels/${id}.json` })) }));
  for (const level of [1, 2, 100]) fs.writeFileSync(path.join(repo, `editor/templates/escape-arrow/levels/${level}.json`), '{}');
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
  assert.deepEqual(preview.tasks[0].levels, [1, 2]);
  assert.equal(fs.existsSync(path.join(f.repo, 'project')), false);
  assert.equal(fs.existsSync(f.report), false);
});

test('a lone 2.mp4 is assigned to intro without an outro or second playable', t => {
  const f = fixture(t, ['2.mp4']);
  const single = f.run(['--report', f.report]);
  assert.equal(single.status, 0, single.stderr);
  const plan = read(f.report).tasks[0];
  assert.equal(plan.uploads[0].slot, 'intro-video');
  assert.equal(plan.uploads[0].filename, '2.mp4');
  assert.equal(plan.config.outro.enabled, false);
  assert.equal(plan.config.secondPlayable.enabled, false);
  assert.deepEqual(plan.requiredSteps, ['intro']);

});

test('a saved plan preserves levels and rejects changed source media', t => {
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
  const doc = { id: 'owned', name: '10-16-george-1-1234567890123456789-escape-arrow' };
  fs.mkdirSync(path.join(f.repo, 'project/owned'), { recursive: true });
  fs.writeFileSync(path.join(f.repo, 'project/owned/project.json'), JSON.stringify(doc));
  const result = f.run(['--apply', '--report', f.report]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Existing or ambiguous task/);
  assert.deepEqual(read(path.join(f.repo, 'project/owned/project.json')), doc);
  assert.equal(fs.existsSync(f.report), false);
});

const sourceConfig = () => ({ schemaVersion: 1, templateId: 'escape-arrow', intro: { enabled: true }, outro: { enabled: false }, hud: { titleEnabled: true, titleLine1: 'ROTATE THE RED ARROW', titleLine2: '' }, secondPlayable: { enabled: false }, popup: { title: 'FIRST TURN.', body: 'NEXT TURN?', rawText: 'FIRST TURN.\nNEXT TURN?' }, forcedWatchSeconds: 30, assets: { introVideo: '1.mp4', outroVideo: null, game1References: [], game2References: [] } });

test('source config maps text and levels; unsupported forced-watch remains explicit', t => {
  const f = fixture(t, ['1.mp4']);
  const config = { ...sourceConfig(), levelId: 100, gameplay: { lives: 'unlimited', hints: 2, allowReplay: false } };
  fs.writeFileSync(path.join(f.leaf, 'config.json'), JSON.stringify(config));
  const result = f.run(['--report', f.report]);
  assert.equal(result.status, 0, result.stderr);
  const task = read(f.report).tasks[0];
  assert.equal(task.config.hud.titleLine1, config.hud.titleLine1);
  assert.equal(task.config.cta.takeoverText, 'FIRST TURN.\nNEXT TURN?');
  assert.deepEqual(task.config.gameplay, config.gameplay);
  assert.equal(task.config.levelId, 100);
  assert.equal('popup' in task.config, false);
  assert.equal('forcedWatchSeconds' in task.config, false);
  assert.deepEqual(task.sourceConfig.data, config);
  assert.equal(task.warnings[0].field, 'forcedWatchSeconds');
  assert.equal(task.warnings[0].value, 30);
  const before = fs.readFileSync(f.report, 'utf8');
  fs.writeFileSync(path.join(f.leaf, 'config.json'), JSON.stringify({ ...config, hud: { titleLine1: 'CHANGED' } }));
  const resumed = spawnSync(process.execPath, [script, '--resume', f.report], { encoding: 'utf8', timeout: 10000 });
  assert.notEqual(resumed.status, 0);
  assert.match(resumed.stderr, /Source files or batch rules changed/);
  assert.equal(fs.readFileSync(f.report, 'utf8'), before);
});

test('incompatible source template, video switches and unknown settings fail before writes', t => {
  const f = fixture(t, ['1.mp4']);
  for (const config of [
    { ...sourceConfig(), templateId: 'dragon-cube' },
    { ...sourceConfig(), outro: { enabled: true } },
    { ...sourceConfig(), assets: { introVideo: '2.mp4' } },
    { ...sourceConfig(), levelId: 101 },
    { ...sourceConfig(), unknownSetting: true },
    { ...sourceConfig(), popup: { title: 'Title', rawText: 'Different' } },
  ]) {
    fs.writeFileSync(path.join(f.leaf, 'config.json'), JSON.stringify(config));
    const result = f.run(['--apply', '--report', f.report]);
    assert.notEqual(result.status, 0);
    assert.equal(fs.existsSync(f.report), false);
    assert.equal(fs.existsSync(path.join(f.repo, 'project')), false);
  }
});

test('symlinks are rejected before writes', t => {
  const f = fixture(t, ['1.mp4']);
  fs.symlinkSync(path.join(f.leaf, '1.mp4'), path.join(f.leaf, '2.mp4'));
  const result = f.run(['--report', f.report]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Symlinks are not supported/);
  assert.equal(fs.existsSync(f.report), false);
});
