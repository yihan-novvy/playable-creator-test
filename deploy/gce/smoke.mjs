import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const base = new URL(process.argv[2]);
const request = (route, options = {}) => fetch(new URL(route, base), {
  ...options, signal: AbortSignal.timeout(600_000),
});
async function json(route, method = 'GET', body) {
  const response = await request(route, { method, ...(body === undefined ? {} : {
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }) });
  const result = await response.json();
  assert.ok(response.ok, `${method} ${route}: ${response.status} ${JSON.stringify(result)}`);
  return result;
}

const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'playable-cloud-smoke-'));
let id;
try {
  assert.equal((await request('/')).status, 200);
  assert.equal((await json('/api/env')).ok, true);
  assert.ok((await json('/api/templates')).some(template => template.id === 'dragon-cube'));
  const video = path.join(temporary, 'intro.mp4');
  await promisify(execFile)('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i',
    'color=c=blue:s=64x96:r=5:d=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', video]);
  const task = await json('/api/tasks', 'POST', { name: `deployment-check-${Date.now()}`, templateId: 'dragon-cube' });
  id = task.id;
  await json(`/api/tasks/${id}`, 'PATCH', { config: { intro: { enabled: true }, background: { enabled: true } } });
  const upload = await request(`/api/tasks/${id}/uploads/intro-video`, {
    method: 'PUT', headers: { 'Content-Type': 'video/mp4' }, body: await fs.readFile(video),
  });
  assert.equal(upload.status, 200, await upload.text());
  const range = await request(`/api/tasks/${id}/uploads/intro-video`, { headers: { Range: 'bytes=0-31' } });
  assert.equal(range.status, 206);
  assert.equal((await range.arrayBuffer()).byteLength, 32);
  const steps = await json(`/api/tasks/${id}/run`, 'POST', { step: 'all' });
  assert.ok(steps.every(step => step.ok), JSON.stringify(steps));
  assert.equal((await request(`/api/tasks/${id}/preview`)).status, 200);
  assert.equal((await request(`/result/${id}/index.html`)).status, 200);
  const exported = await request(`/api/tasks/${id}/export`);
  assert.equal(exported.status, 200);
  const zip = Buffer.from(await exported.arrayBuffer());
  assert.equal(zip.subarray(0, 2).toString(), 'PK');
  const zipPath = path.join(temporary, 'result.zip');
  await fs.writeFile(zipPath, zip);
  await promisify(execFile)('unzip', ['-t', zipPath]);
  console.log(JSON.stringify({ ok: true, steps: steps.map(step => ({ step: step.stepId, ok: step.ok })), zipBytes: zip.length }));
} finally {
  try { if (id) await json(`/api/tasks/${id}`, 'DELETE'); }
  finally { await fs.rm(temporary, { recursive: true, force: true }); }
}
