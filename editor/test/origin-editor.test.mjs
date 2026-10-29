import fs from 'node:fs';
import path from 'node:path';
import { createServer } from '../server.mjs';
import { createTask, deleteTask, readTask, recordUpload, clearUpload, recordStepResult, updateTaskConfig, computeStatus, stepInputFilesFor } from '../lib/store.mjs';
import { taskGeneratedDir, taskUploadsDir, taskResultDir } from '../lib/paths.mjs';

export default async function test(a) {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (task, route, body) => fetch(`${base}/api/tasks/${task.id}/${route}`, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  try {
    for (const templateId of ['colorever-origin', 'block-out-origin', 'freecell-origin', 'grill-sort-origin', 'tasty-travels-origin']) {
      const task = createTask({ name: `origin-fix-${templateId}-${Date.now()}`, templateId });
      try {
        const packed = await request(task, 'run', { step: 'pack' });
        a.equal(packed.status, 200, `${templateId}: initial pack succeeds`); await packed.json();
        const initialZip = await request(task, 'export');
        a.equal(initialZip.status, 200, `${templateId}: current ZIP exports`); await initialZip.arrayBuffer();
        const oldHtml = fs.readFileSync(path.join(taskResultDir(task.id), 'index.html'), 'utf8');
        const patches = [
          { hud: { titleLine1: 'Saved audit title', titleEnabled: true } },
          { hud: { titleLine2: 'Saved subtitle' } },
          { intro: { goEnabled: true, goText: 'BEGIN' } },
          { intro: { enabled: false } },
          { cta: { endMask: true } },
          { playableCta: { afterSteps: 25, intervals: [7, 3] } },
        ];
        if (templateId === 'colorever-origin') patches.push({ patternId: 'apple-red' });
        if (['block-out-origin', 'freecell-origin', 'tasty-travels-origin'].includes(templateId)) {
          recordStepResult(task.id, { stepId: 'intro', ok: true });
          patches.push({ gameplay: { allowReplay: false } }, { gameplay: { allowReplay: true } });
        }
        if (templateId === 'grill-sort-origin') {
          recordStepResult(task.id, { stepId: 'intro', ok: true });
          patches.push({ gameplay: { countdownSeconds: 45 } }, { gameplay: { allowReplay: false } });
        }
        for (const patch of patches) {
          recordStepResult(task.id, { stepId: 'pack', ok: true });
          const saved = await fetch(`${base}/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ config: patch }) });
          a.equal(saved.status, 200, `${templateId}: ${Object.keys(patch)[0]} saves`); await saved.json();
          const status = computeStatus(task.id, ['intro', 'pack'], stepInputFilesFor(templateId));
          a.check(!status.steps.pack.ok, `${templateId}: changed settings invalidate pack`);
          const blocked = await request(task, 'export');
          a.equal(blocked.status, 409, `${templateId}: stale ZIP is blocked`); await blocked.json();
        }
        const config = readTask(task.id).config;
        if (['block-out-origin', 'freecell-origin', 'tasty-travels-origin'].includes(templateId)) {
          a.equal(config.gameplay, { allowReplay: true }, `${templateId}: replay setting persists`);
          a.check(readTask(task.id).steps.intro.ok, `${templateId}: replay edits retain the transcoded intro`);
          for (const gameplay of [{ allowReplay: 'true' }, { allowReplay: 1 }, { unknown: true }, null, []]) {
            const invalid = await fetch(`${base}/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ config: { gameplay } }) });
            a.equal(invalid.status, 400, `${templateId}: invalid replay settings are rejected`); await invalid.json();
          }
          a.equal(readTask(task.id).config.gameplay, config.gameplay, `${templateId}: rejected settings do not mutate the task`);
        }
        if (templateId === 'grill-sort-origin') {
          a.equal(config.gameplay, { countdownSeconds: 45, allowReplay: false }, 'Grill: gameplay sibling settings persist');
          a.check(readTask(task.id).steps.intro.ok, 'Grill: gameplay edits retain the transcoded intro');
          for (const gameplay of [{ countdownSeconds: 0 }, { countdownSeconds: 3601 }, { countdownSeconds: 1.5 }, { countdownSeconds: '45' }, { allowReplay: 'true' }, { unknown: true }, null]) {
            const invalid = await fetch(`${base}/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ config: { gameplay } }) });
            a.equal(invalid.status, 400, 'Grill: invalid gameplay settings are rejected'); await invalid.json();
          }
          a.equal(readTask(task.id).config.gameplay, config.gameplay, 'Grill: rejected settings do not mutate the task');
        }
        a.equal([config.hud.titleLine1, config.hud.titleLine2, config.intro.goText], ['Saved audit title', 'Saved subtitle', 'BEGIN'], `${templateId}: sibling edits persist`);
        const rebuilt = await request(task, 'run', { step: 'pack' });
        a.equal(rebuilt.status, 200, `${templateId}: edited pack rebuilds`); await rebuilt.json();
        const html = fs.readFileSync(path.join(taskResultDir(task.id), 'index.html'), 'utf8');
        a.check(html !== oldHtml && html.includes('Saved audit title') && html.includes('Saved subtitle'), `${templateId}: rebuilt HTML contains saved text`);
        if (templateId === 'grill-sort-origin') a.check(html.includes('"countdownSeconds":45,"allowReplay":false'), 'Grill: package uses saved timer and replay settings');
        if (['block-out-origin', 'freecell-origin', 'tasty-travels-origin'].includes(templateId)) a.check(html.includes('"gameplay":{"allowReplay":true}'), `${templateId}: package uses saved replay setting`);
        const fresh = await request(task, 'export'); a.equal(fresh.status, 200, `${templateId}: rebuilt ZIP exports`); await fresh.arrayBuffer();

        updateTaskConfig(task.id, { intro: { enabled: true } });
        fs.writeFileSync(path.join(taskGeneratedDir(task.id), 'intro-video.mp4'), 'old transcoded video');
        fs.writeFileSync(path.join(taskGeneratedDir(task.id), 'poster.webp'), 'poster');
        fs.writeFileSync(path.join(taskUploadsDir(task.id), 'intro-video.mp4'), 'new uploaded video');
        recordStepResult(task.id, { stepId: 'intro', ok: true });
        recordStepResult(task.id, { stepId: 'pack', ok: true });
        recordUpload(task.id, 'intro-video', { name: 'new.mp4' });
        a.check(!readTask(task.id).steps.intro && !readTask(task.id).steps.pack, `${templateId}: new video invalidates intro and pack`);
        const preview = await request(task, 'preview'); const previewHtml = await preview.text();
        a.equal(preview.status, 200, `${templateId}: preview builds after video replacement`);
        a.check(previewHtml.includes(`/project/${task.id}/uploads/intro-video.mp4`) && !previewHtml.includes(`/project/${task.id}/generated/intro-video.mp4`), `${templateId}: preview uses current upload`);
        const blockedPack = await request(task, 'run', { step: 'pack' });
        a.equal(blockedPack.status, 422, `${templateId}: old transcode cannot be repackaged`); await blockedPack.json();
        recordStepResult(task.id, { stepId: 'intro', ok: true });
        recordStepResult(task.id, { stepId: 'pack', ok: true });
        clearUpload(task.id, 'intro-poster');
        a.check(!readTask(task.id).steps.intro && !readTask(task.id).steps.pack, `${templateId}: removing poster invalidates its outputs`);
      } finally { deleteTask(task.id); }
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
}
