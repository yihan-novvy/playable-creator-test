import { createServer } from '../server.mjs';
import { createTask, deleteTask, listTasks } from '../lib/store.mjs';
import { effectiveConfig } from '../core/runner.mjs';
import { getEntry } from '../core/registry.mjs';

export default async function test(a) {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const ids = [];
  const create = templateId => fetch(`${base}/api/tasks`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `creation-policy-${templateId}-${Date.now()}`, templateId }),
  });
  try {
    const templates = await (await fetch(`${base}/api/templates`)).json();
    a.equal(templates.filter(item => item.creatable).map(item => item.id), ['block-out-origin', 'candy-crush-origin', 'color-block-jam-origin', 'freecell-origin', 'grill-sort-origin', 'screwdom-origin', 'tasty-travels-origin', 'travel-town-origin', 'word-search-explorer-origin', 'zen-word-100m-origin', 'zen-word-92m-origin'], 'Registered supported templates are offered for creation');
    const before = listTasks().map(task => task.id).sort();
    for (const item of templates.filter(item => !item.creatable)) {
      const response = await create(item.id);
      const body = await response.json();
      if (response.status === 201) ids.push(body.id);
      a.equal(response.status, 400, `${item.id}: direct API creation is rejected`);
    }
    a.equal(listTasks().map(task => task.id).sort(), before, 'rejected requests do not create tasks');
    const response = await create('tasty-travels-origin');
    const task = await response.json();
    if (task.id) ids.push(task.id);
    a.equal(response.status, 201, 'Tasty Travels can be created');
    const config = effectiveConfig(getEntry('tasty-travels-origin').template, task.config);
    a.equal(config.story.enabled, false, 'new tasks start without the story opening');
    a.equal(config.intro.goEnabled, false, 'new tasks start without the GO button');

    const legacy = createTask({ name: `legacy-creation-policy-${Date.now()}`, templateId: 'dragon-cube' });
    ids.push(legacy.id);
    a.check(templates.some(item => item.id === legacy.templateId), 'existing task template metadata remains available');
    const loaded = await fetch(`${base}/api/tasks/${legacy.id}`);
    a.equal(loaded.status, 200, 'existing non-Tasty tasks remain readable');
    const saved = await fetch(`${base}/api/tasks/${legacy.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: { intro: { enabled: false } } }),
    });
    a.equal(saved.status, 200, 'existing non-Tasty task settings remain editable');
  } finally {
    for (const id of ids) deleteTask(id);
    await new Promise(resolve => server.close(resolve));
  }
}
