import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { run } from '../core/lib/exec.mjs';
import { createServer } from '../server.mjs';
import { createTask, deleteTask, recordStepResult, updateTaskConfig, readTask } from '../lib/store.mjs';
import { taskResultDir, taskProjectDir } from '../lib/paths.mjs';
import { mockPublishService } from './publish-service-fixture.mjs';

export default async function test(a) {
  const mock = mockPublishService();
  const server = createServer({ publishBaseUrl: 'http://publish-fixture.test', publishFetch: mock.fetch });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const task = createTask({ name: 'publish-contract-' + Date.now(), templateId: 'tasty-travels-origin' });
  const prefix = base + '/api/tasks/' + task.id + '/publish';
  async function call(route = '', body, method = 'POST', headers = {}) {
    const response = await fetch(prefix + (route ? '/' + route : ''), {
      method: body === undefined ? 'GET' : method,
      headers: { 'Content-Type': 'application/json', ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    return { status: response.status, data, response };
  }
  const settings = { store_url: 'https://apps.apple.com/us/app/example/id123\nhttps://play.google.com/store/apps/details?id=com.example', app_name: 'Example', category: 'Tier1:剧情融合', sequence: '1', tag: 't'.repeat(64) };
  try {
    a.equal((await call('inspect', {})).status, 409, 'cannot publish without a successful current pack');
    fs.mkdirSync(taskResultDir(task.id), { recursive: true });
    fs.writeFileSync(path.join(taskResultDir(task.id), 'index.html'), '<!doctype html><html><head><title>HTTP fixture</title></head><body>ZIP contract fixture</body></html>');
    fs.writeFileSync(path.join(taskResultDir(task.id), 'asset.txt'), 'archive-content');
    recordStepResult(task.id, { stepId: 'pack', ok: true });
    const before = JSON.stringify(readTask(task.id));
    a.equal((await call('settings', settings, 'PATCH')).status, 200, 'publishing form can be saved');
    a.equal(JSON.stringify(readTask(task.id)), before, 'publishing settings do not invalidate gameplay pack');
    a.equal((await call()).data.settings.app_name, 'Example', 'form survives a reload');
    a.equal((await call('settings', { ...settings, video_link_mode: 'direct' }, 'PATCH')).data.settings.video_link_mode, 'auto', 'reference form always uses default video mode');
    const savedPath = path.join(taskProjectDir(task.id), 'publish', 'state.json');
    const legacyState = JSON.parse(fs.readFileSync(savedPath, 'utf8'));
    legacyState.settings.video_link_mode = 'orchestrated';
    legacyState.snapshot = { version: 'old', mode: 'orchestrated' };
    fs.writeFileSync(savedPath, JSON.stringify(legacyState));
    a.equal((await call()).data.settings.video_link_mode, 'auto', 'old saved nondefault mode is normalized on load');
    a.equal((await call()).data.inspectionStale, true, 'old inspection must be rerun after reverting to default mode');
    a.equal((await call('settings', { ...settings, episode: '1', drama_name: '' }, 'PATCH')).status, 400, 'episode needs a drama name');
    a.equal((await call('settings', { ...settings, tag: 't'.repeat(65) }, 'PATCH')).status, 400, 'Tag limit matches the reference form at 64 characters');
    a.equal((await call('settings', { ...settings, category: 'unknown' }, 'PATCH')).status, 400, 'only the three reference categories are accepted');
    a.equal((await call('settings', { ...settings, min_view_duration: '2' }, 'PATCH')).status, 400, 'minimum view duration is validated');
    a.equal((await call('inspect', {}, 'POST', { origin: 'https://other.example' })).status, 403, 'cross-origin mutations are rejected');
    a.equal((await call('parse-store', settings)).data.apps[0].app_name, '本地联调产品', 'store metadata is parsed through the service');
    a.equal((await call('parse-store', { ...settings, episode: '1', drama_name: '' })).status, 200, 'automatic app recognition is independent of incomplete drama fields');
    let release;
    mock.holdInspect(new Promise(resolve => { release = resolve; }));
    const checking = call('inspect', {});
    while (!mock.calls.some(item => item.path === '/api/interactive-zip/inspect')) await new Promise(resolve => setTimeout(resolve, 10));
    a.equal((await call()).data.running, true, 'in-flight operation survives frontend reload');
    a.equal((await call('package', {})).status, 409, 'duplicate operation is blocked while inspection runs');
    release();
    const inspection = await checking;
    a.equal(inspection.status, 200, 'ZIP is inspected');
    a.equal(inspection.data.inspection.event_check.requires_confirmation, true, 'warnings returned to the user');
    const token = inspection.data.inspection.event_check.confirmation_token;
    a.equal((await call('package', {})).status, 409, 'warnings cannot be silently accepted');
    a.equal(mock.calls.filter(item => item.path.endsWith('/package')).length, 0, 'no packaging request sent before user confirmation');
    a.equal((await call('package', { confirmation: 'wrong' })).status, 409, 'wrong confirmation rejected');
    const packaged = await call('package', { confirmation: token });
    a.equal(packaged.status, 200, 'confirmed original ZIP produces a final package');
    const packagedCall = mock.calls.find(item => item.path.endsWith('/package'));
    a.equal(packagedCall.body.event_check_confirmation, token, 'same-byte token is forwarded');
    a.equal(packagedCall.body.tag, settings.tag, 'full user Tag is forwarded without truncation or added suffixes');
    a.equal(packagedCall.body.video_link_mode, 'auto', 'packaging uses the default mode from the reference page');
    a.equal(mock.calls.find(item => item.path.endsWith('/inspect')).body.video_link_mode, 'auto', 'inspection uses the same default mode as packaging');
    a.equal(packagedCall.body.auto_launch, 'false', 'packaging explicitly disables automatic launch');
    a.equal(packagedCall.body.store_url, settings.store_url.split('\n')[0], 'primary store URL remains a single URL');
    a.equal(packagedCall.body.store_urls.split('\n').length, 2, 'packaging preserves both product URLs');
    a.check(!('admin_email' in packagedCall.body) && !('api_key' in packagedCall.body), 'packaging sends no platform credentials');
    a.equal(packaged.response.headers.get('set-cookie'), null, 'packaging needs no login session');
    a.check(!('user' in packaged.data) && !('launch' in packaged.data), 'workflow no longer exposes account or launch state');
    const file = path.join(taskProjectDir(task.id), 'publish', packaged.data.package.id, 'final.zip');
    const downloaded = await fetch(prefix + '/download');
    a.check(Buffer.from(await downloaded.arrayBuffer()).equals(fs.readFileSync(file)), 'download returns the untouched final ZIP');
    const preview = await fetch(prefix + '/preview/' + packaged.data.package.id + '/index.html?monitor=00000000-0000-0000-0000-000000000000');
    a.equal(preview.status, 200, 'processed package can be previewed');
    a.check((await preview.text()).includes('data-publish-monitor'), 'preview observes logs before creative scripts start');
    a.check(preview.headers.get('content-security-policy').includes('sandbox allow-scripts'), 'preview is separated from editor credentials');
    const asset = await fetch(prefix + '/preview/' + packaged.data.package.id + '/asset.txt');
    a.equal(await asset.text(), 'archive-content', 'preview resolves relative assets');
    const beforeRemovedRoutes = mock.calls.length;
    a.equal((await call('auth', {})).status, 404, 'login endpoint is removed');
    a.equal((await call('auth', {}, 'DELETE')).status, 404, 'logout endpoint is removed');
    a.equal((await call('launch', {})).status, 404, 'direct platform upload endpoint is removed');
    a.equal(mock.calls.length, beforeRemovedRoutes, 'removed routes cannot reach any upstream service');
    await call('settings', { ...settings, tag: 'changed', category: 'Tier 2:短剧情钩子' }, 'PATCH');
    a.equal((await call()).data.packageStale, true, 'changing packaging fields invalidates final package');
    a.equal((await call('package', { confirmation: token })).status, 200, 'package can be regenerated without login');
    a.equal(mock.calls.filter(item => item.path.endsWith('/package')).at(-1).body.category, 'Tier 2:短剧情钩子', 'selected category is included in regenerated package');
    await call('settings', { ...settings, tag: 'changed', min_view_duration: '8' }, 'PATCH');
    a.equal((await call()).data.packageStale, true, 'minimum view duration now invalidates package metadata');
    mock.setPackageError(true);
    a.equal((await call('package', { confirmation: token })).status, 502, 'packaging connection failure is surfaced');
    a.equal((await call()).data.running, false, 'failed packaging releases the operation lock');
    mock.setPackageError(false);
    a.equal((await call('package', { confirmation: token })).status, 200, 'packaging can recover after a service failure');
    const lastPackagedCall = mock.calls.filter(item => item.path.endsWith('/package')).at(-1);
    a.equal(lastPackagedCall.body.min_view_duration, '8', 'minimum view duration is included in the package request');
    a.check(mock.calls.every(item => ['/api/parse-store-url', '/api/interactive-zip/inspect', '/api/v1/interactive-zip/package', '/api/download'].includes(item.path)), 'workflow calls only the retained services');
    updateTaskConfig(task.id, { hud: { titleLine1: 'updated' } });
    a.equal((await call()).data.packageStale, true, 'gameplay edits invalidate published output');
    a.equal((await call('inspect', {})).status, 409, 'stale gameplay needs repackaging');

    const badZip = path.join(taskProjectDir(task.id), 'invalid.zip');
    await run('python3', ['-c', 'import sys,zipfile\nwith zipfile.ZipFile(sys.argv[1],"w") as z:\n z.writestr("index.html","fixture")\n z.writestr("../escaped.txt","unsafe")', badZip]);
    let rejected = false;
    try {
      await run('python3', [fileURLToPath(new URL('../lib/publish-extract.py', import.meta.url)), badZip, path.join(taskProjectDir(task.id), 'unsafe-preview')]);
    } catch { rejected = true; }
    a.check(rejected && !fs.existsSync(path.join(taskProjectDir(task.id), 'escaped.txt')), 'unsafe archive is rejected before extracting any files');

    // Verify the observer preserves real SDK behavior and never creates a fake SDK.
    const observed = [], callbacks = {}, calls = [];
    const sdk = { track(...args) { calls.push(args); return 17; } };
    const context = {
      window: { parent: { postMessage: message => observed.push(message) }, frames: [], NovvyAnalytics: sdk, addEventListener: (name, fn) => { callbacks[name] = fn; } },
      document: { title: 'fixture', addEventListener() {} },
      console: { log() {}, warn() {}, error() {} }, setInterval() { return 1; }, clearInterval() {},
    };
    vm.runInNewContext(fs.readFileSync(new URL('../public/publish-preview.js', import.meta.url), 'utf8').replace('__MONITOR_CHANNEL__', '"fixture"'), context);
    a.equal(sdk.track('real', { a: 1 }), 17, 'observer preserves SDK return values');
    a.equal(calls.length, 1, 'observer invokes original SDK once');
    a.equal(observed[0].name, 'track', 'real SDK invocation is logged');
    a.equal(context.window.novvy, undefined, 'observer does not install a simulated SDK');
    const count = observed.length;
    callbacks.message({ source: {}, data: { type: 'novvy_sdk_event' } });
    a.equal(observed.length, count, 'unrelated window messages are ignored');
  } finally {
    deleteTask(task.id);
    await new Promise(resolve => server.close(resolve));
  }
}
