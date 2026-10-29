import fs from 'node:fs';
import { createServer } from '../server.mjs';
import { listTasks } from '../lib/store.mjs';
import { PROJECTS_ROOT, RESULT_ROOT } from '../lib/paths.mjs';
import { catalog } from '../public/template-catalog.mjs';

export default async function test(a) {
  const expected = ['colorever-new', 'colorever-origin', 'escape-arrow', 'dragon-cube', 'block-out-origin', 'freecell-origin', 'grill-sort-origin', 'tasty-travels-origin'];
  a.equal(catalog.map(item => item.id), expected, 'gallery contains exactly the requested eight templates');
  const snapshot = () => ({ tasks: listTasks(), project: fs.readdirSync(PROJECTS_ROOT).sort(), result: fs.readdirSync(RESULT_ROOT).sort() });
  const before = snapshot();
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const get = route => fetch(base + route);
  try {
    for (const id of expected) {
      const response = await get(`/api/templates/${id}/demo`);
      const html = await response.text();
      a.equal(response.status, 200, `${id}: demo builds without a task`);
      a.check(html.includes('data-novvy-fixed-viewport'), `${id}: viewport guard is retained`);
      a.check(!html.includes('/project/'), `${id}: demo does not read task media`);
      const screenshot = await get(`/showcase/${id}.png`);
      a.equal(screenshot.status, 200, `${id}: real screenshot is served`); await screenshot.arrayBuffer();
      // Every external local script and stylesheet referenced by a preview must resolve.
      const resources = [...html.matchAll(/(?:src|href)="(\/(?:templates|plugins)\/[^"<>]+)"/g)].map(match => match[1]);
      for (const resource of new Set(resources)) {
        const asset = await get(resource); a.equal(asset.status, 200, `${id}: ${resource} resolves`); await asset.arrayBuffer();
      }
    }
    for (const [id, level, marker] of [['dragon-cube', 10, '__DRAGON_CUBE_LEVEL__'], ['escape-arrow', 100, '__ESCAPE_ARROW_LEVEL__']]) {
      const response = await get(`/api/templates/${id}/demo?level=${level}`);
      const html = await response.text();
      a.equal(response.status, 200, `${id}: last supported level builds`);
      const injected = html.match(new RegExp(`window\\.${marker}=(\\{.*?\\});`));
      a.equal(injected ? JSON.parse(injected[1]).Index : null, level, `${id}: selected level reaches game`);
    }
    for (const route of ['/api/templates/water-sort/demo', '/api/templates/colorever-abandoned/demo', '/api/templates/not-real/demo']) {
      const response = await get(route); a.equal(response.status, 404, `${route}: unlisted template rejected`); await response.text();
    }
    for (const route of ['/api/templates/dragon-cube/demo?level=11', '/api/templates/dragon-cube/demo?level=1.5', '/api/templates/escape-arrow/demo?level=101', '/api/templates/escape-arrow/demo?level=../../secret', '/api/templates/colorever-new/demo?pattern=../../secret']) {
      const response = await get(route); a.equal(response.status, 400, `${route}: invalid selection rejected`); await response.text();
    }
    for (const route of ['/templates.html', '/templates.css', '/templates.js', '/template-catalog.mjs', '/patterns.html', '/templates/escape-arrow/gallery.html']) {
      const response = await get(route); a.equal(response.status, 200, `${route}: page or tool resolves`); await response.text();
    }
    a.equal(snapshot(), before, 'browsing demos does not create or change tasks or output directories');
  } finally { await new Promise(resolve => server.close(resolve)); }
}
