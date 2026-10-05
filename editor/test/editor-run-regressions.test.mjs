import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import strict from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { execFile } from '../core/lib/exec.mjs';
import { scramblePattern, assertScrambleContract } from '../plugins/colorever-gemsort/lib/lpcs.mjs';
import { scrambleMoveCycle } from '../plugins/colorever-gemsort/lib/move-cycle-scramble.mjs';
import { runStep } from '../core/runner.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const templateRoot = path.join(ROOT, 'editor/templates/colorever-gemsort');
const template = JSON.parse(fs.readFileSync(path.join(templateRoot, 'template.json')));

export default async function run(assert) {
  const target = [
    ...Array(1072).fill(31), ...Array(415).fill(4), ...Array(43).fill(3),
    ...Array(36).fill(1), ...Array(34).fill(32),
  ];
  const config = { ...template.scrambleOverrides, fallbackMaxCompletion: template.maxOpeningCompletion };
  const result = scramblePattern({ target, width: 40, height: 40, config });
  assert.check(assertScrambleContract({ target, scrambled: result.colors, width: 40, height: 40 }), 'dominant-color fallback preserves shape and inventory');
  assert.check(result.metrics.completion <= template.maxOpeningCompletion, 'fallback stays below game opening limit');
  assert.check(result.metrics.largestComponent <= target.length * config.maxComponentRatio, 'fallback respects largest group limit');
  assert.check(result.metrics.singletonCount <= target.length * config.maxSingletonRatio, 'fallback respects singleton limit');
  assert.check(result.metrics.componentCount >= target.length / 20 && result.metrics.componentCount <= target.length * config.maxComponentCountRatio, 'fallback respects group count limits');
  assert.equal(result.colors, scramblePattern({ target, width: 40, height: 40, config }).colors, 'fallback is deterministic');
  strict.throws(() => scramblePattern({ target: Array(100).fill(1), width: 10, height: 10, config }), /颜色过于集中/);
  strict.throws(() => scramblePattern({ target, width: 40, height: 40, config: template.scrambleOverrides }), /最低开局匹配率/);
  assert.check(true, 'impossible inventory and strict limits fail with actionable messages');

  const reference = JSON.parse(fs.readFileSync(path.join(ROOT, 'editor/test/fixtures/dragon-baby-color-ever/tools/dragon-pattern.generated.json')));
  const originalTarget = reference.rows.flatMap(row => [...row.padEnd(reference.width, ' ')].map(symbol => reference.symbolToTile[symbol] || 0));
  const original = scramblePattern({ target: originalTarget, width: reference.width, height: reference.height, config: template.scrambleOverrides });
  const compatible = scramblePattern({ target: originalTarget, width: reference.width, height: reference.height, config });
  assert.equal(compatible.colors, original.colors, 'existing reference scramble remains unchanged');

  const moveCycleArgs = {
    target: originalTarget,
    width: reference.width,
    height: reference.height,
    maxCompletion: template.maxOpeningCompletion,
    seed: 7,
    ...(template.scrambleMoveCycle || {}),
  };
  const moveCycle = scrambleMoveCycle(moveCycleArgs);
  assert.check(moveCycle.method === 'move-cycle', 'reference pattern scrambles into a move cycle');
  assert.check(assertScrambleContract({ target: originalTarget, scrambled: moveCycle.colors, width: reference.width, height: reference.height }), 'move cycle preserves shape and inventory');
  assert.check(moveCycle.metrics.completion <= template.maxOpeningCompletion, 'move cycle stays below the game opening limit');
  assert.check(moveCycle.certifiedMoveCount === moveCycle.movePatchCount + 1, 'certified moves equal patch count + 1');
  assert.check(moveCycle.certifiedMoveCount >= template.scrambleMoveCycle.minMoves && moveCycle.certifiedMoveCount <= template.scrambleMoveCycle.maxMoves, 'certified moves stay in template bounds');
  assert.equal(moveCycle.colors, scrambleMoveCycle(moveCycleArgs).colors, 'move cycle is deterministic for a fixed seed');
  const checker = Array.from({ length: 20 * 20 }, (_, index) => (((index % 20) + Math.floor(index / 20)) % 2) + 1);
  strict.throws(() => scrambleMoveCycle({ target: checker, width: 20, height: 20, seed: 1, maxCompletion: 0.8 }), /轮转色块组合/);
  assert.check(true, 'checkerboard without safe blobs fails with an actionable message');

  const source = fs.readFileSync(path.join(ROOT, 'editor/public/task.js'), 'utf8');
  const helper = source.slice(source.indexOf('async function fetchJson('), source.indexOf('\nfunction getConfig('));
  for (const body of [{ ok: false, error: '模型凭据缺失' }, [{ ok: true }, { ok: false, error: '打散失败详情' }], { error: { message: '接口详情' } }]) {
    const sandbox = { fetch: async () => ({ ok: false, status: 422, statusText: 'Unprocessable Entity', json: async () => body }) };
    vm.runInNewContext(`${helper}; this.call = fetchJson;`, sandbox);
    const failed = Array.isArray(body) ? body[1] : body;
    await strict.rejects(sandbox.call('/api/test'), error => error.message === (typeof failed.error === 'string' ? failed.error : failed.error.message));
  }
  assert.check(true, 'frontend displays specific errors for single-step, run-all and API failures');

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'editor-ai-regression-'));
  let server;
  try {
    fs.mkdirSync(path.join(tmp, 'uploads'));
    fs.mkdirSync(path.join(tmp, 'generated'));
    const sourcePath = path.join(tmp, 'uploads/pattern-source.png');
    await execFile('python3', ['-c', 'from PIL import Image; import sys; im=Image.new("RGB",(160,160),(230,230,230)); im.paste((200,45,40),(40,40,120,140)); im.save(sys.argv[1])', sourcePath]);
    const previous = {};
    for (const key of ['ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_API_KEY']) {
      previous[key] = process.env[key];
      delete process.env[key];
    }
    try {
      const missing = await runStep({ taskId: 'local-test', templateRoot, scriptsRoot: path.join(ROOT, 'editor/core/scripts'), projectRoot: tmp, resultRoot: path.join(tmp, 'dist'), stepId: 'pattern', engine: 'ai', config: { patternSource: 'upload' } });
      assert.check(!missing.ok && missing.error.includes('未配置模型凭据'), 'missing AI credentials fail clearly before a network request');
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key]; else process.env[key] = value;
      }
    }
    const rows = Array.from({ length: 40 }, (_, y) => {
      const row = [...(' '.repeat(5) + '#'.repeat(30) + ' '.repeat(5))];
      if (y >= 5 && y < 10) for (let x = 15; x < 25; x++) row[x] = ' ';
      return row.join('');
    });
    let payload;
    server = http.createServer(async (req, res) => {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      payload = JSON.parse(Buffer.concat(chunks));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify({ rows }) }], stop_reason: 'end_turn' }));
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const output = path.join(tmp, 'ai.json');
    await execFile('python3', [path.join(ROOT, 'editor/plugins/colorever-gemsort/scripts/ai-image-to-pattern.py'), '--source', sourcePath, '--template-json', path.join(templateRoot, 'template.json'), '--out', output, '--preview', path.join(tmp, 'ai.png'), '--attempts', '1', '--smoothing-passes', '0'], {
      env: { ...process.env, ANTHROPIC_BASE_URL: `http://127.0.0.1:${server.address().port}`, ANTHROPIC_AUTH_TOKEN: 'local-test-only', ANTHROPIC_MODEL: 'local-test' },
    });
    const pattern = JSON.parse(fs.readFileSync(output));
    assert.check(payload.messages[0].content[0].type === 'image', 'AI request carries the selected source image');
    assert.check(payload.messages[0].content[1].text.includes('Do not invent a person'), 'AI supports object uploads');
    assert.check(pattern.generator.attempts === 1 && pattern.rows.length === 40, 'local mock AI response produces a valid pattern');
    assert.check(pattern.rows[6][18] === ' ', 'AI mask preserves object handle holes');
  } finally {
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
