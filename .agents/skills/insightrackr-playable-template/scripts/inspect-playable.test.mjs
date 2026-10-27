import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { brotliCompressSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inspectPlayable } from './inspect-playable.mjs';

function fixture(t, source, extension = '.html') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inspect-playable-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const input = path.join(root, `input${extension}`), out = path.join(root, 'out');
  fs.writeFileSync(input, source);
  return { input, out };
}

test('literal JSON wrapper preserves source, HTML, parameters and script bytes without executing', t => {
  const script = 'globalThis.__insightrackrUnexpectedExecution = true; throw new Error("do not execute");\nwindow.editorParameters = ' + JSON.stringify({ adNetwork: 'applovin', levelAssets: [{ BMS: [1, 2] }, { BMS: [3] }], assetSignature: 'private', gotoMarketAfterXClick: 30, label: 'a } and \\" {' }) + ';';
  const html = `<html>\n<script>${script}</script>\n</html>`;
  const source = Buffer.from(`al_renderHtml(${JSON.stringify({ html })});`);
  const options = fixture(t, source, '.js');
  const report = inspectPlayable(options);
  assert.equal(report.format, 'applovin-json-html');
  assert.deepEqual(fs.readFileSync(path.join(options.out, 'source-original.js')), source);
  assert.equal(fs.readFileSync(path.join(options.out, 'unpacked.html'), 'utf8'), html);
  assert.equal(fs.readFileSync(path.join(options.out, 'inline-001.js'), 'utf8'), script);
  assert.equal(globalThis.__insightrackrUnexpectedExecution, undefined);
  assert.deepEqual(report.editorParameters[0].bmsBlockCounts, [2, 1]);
  assert.equal(report.editorParameters[0].storeTriggers.gotoMarketAfterXClick, 30);
  assert.equal(report.editorParameters[0].hasAssetSignature, true);
  assert.ok(!JSON.stringify(report).includes('private'));
  assert.equal(report.source.sha256, createHash('sha256').update(source).digest('hex'));
});

test('long Brotli text is decoded byte-for-byte and duplicate payloads are counted once', t => {
  const core = Buffer.from('/*' + randomBytes(24000).toString('hex') + '*/\nthrow new Error("never execute this");');
  const encoded = brotliCompressSync(core).toString('base64');
  assert.ok(encoded.length > 20000);
  const options = fixture(t, `const first="${encoded}"; const again='${encoded}';`, '.js');
  const report = inspectPlayable(options);
  assert.equal(report.brotli.candidates, 1);
  assert.equal(report.brotli.decoded, 1);
  assert.deepEqual(fs.readFileSync(path.join(options.out, 'decoded-001.txt')), core);
});

test('external references and source URL are sanitized without modifying original HTML', t => {
  const html = '<script src="https://user:secret@example.invalid/game.js?token=SECRET#fragment"></script><iframe src="./game.html?session=PRIVATE"></iframe><link href="//example.invalid/game.css?v=2">';
  const options = fixture(t, html);
  const report = inspectPlayable({ ...options, sourceUrl: 'https://u:p@example.invalid/detail/id?token=SECRET#fragment' });
  assert.equal(report.source.url, 'https://example.invalid/detail/id');
  assert.deepEqual(report.references.map(ref => ref.reference), ['https://example.invalid/game.js', './game.html', 'https://example.invalid/game.css']);
  assert.ok(!JSON.stringify(report).includes('SECRET'));
  assert.ok(!JSON.stringify(report).includes('PRIVATE'));
  assert.equal(fs.readFileSync(path.join(options.out, 'source-original.html'), 'utf8'), html);
  assert.equal(report.brotli.decoded, 0);
});

test('unknown executable wrappers remain unexecuted and do not produce invented HTML', t => {
  const options = fixture(t, 'al_renderHtml((globalThis.__insightrackrUnexpectedExecution = true, {html:"hello"}));', '.js');
  const report = inspectPlayable(options);
  assert.equal(report.format, 'javascript');
  assert.equal(globalThis.__insightrackrUnexpectedExecution, undefined);
  assert.equal(fs.existsSync(path.join(options.out, 'unpacked.html')), false);
  assert.ok(report.warnings.some(w => w.includes('not a supported literal JSON')));
});

test('existing output is left untouched', t => {
  const options = fixture(t, '<html></html>');
  fs.mkdirSync(options.out);
  fs.writeFileSync(path.join(options.out, 'sentinel'), 'keep');
  assert.throws(() => inspectPlayable(options), /already exists/);
  assert.equal(fs.readFileSync(path.join(options.out, 'sentinel'), 'utf8'), 'keep');
  assert.deepEqual(fs.readdirSync(options.out), ['sentinel']);
});

test('invalid or binary payloads are counted without being emitted as UTF-8 code', t => {
  const binary = randomBytes(25000);
  binary[0] = 0xff;
  const encoded = brotliCompressSync(binary).toString('base64');
  const options = fixture(t, `const invalid="${'A'.repeat(24000)}"; const binary="${encoded}";`, '.js');
  const report = inspectPlayable(options);
  assert.equal(report.brotli.candidates, 2);
  assert.equal(report.brotli.failed, 1);
  assert.equal(report.brotli.nonUtf8, 1);
  assert.equal(report.brotli.decoded, 0);
});

test('unsupported file types and oversized files fail before creating output', t => {
  const options = fixture(t, 'PK zip placeholder', '.zip');
  assert.throws(() => inspectPlayable(options), /extract ZIP/);
  const large = path.join(path.dirname(options.input), 'large.js');
  fs.writeFileSync(large, '');
  fs.truncateSync(large, 32 * 1024 * 1024 + 1);
  assert.throws(() => inspectPlayable({ ...options, input: large }), /32 MiB/);
  assert.equal(fs.existsSync(options.out), false);
});

test('CLI executes through a symlink and emits an inspection report', t => {
  const options = fixture(t, '<html><script>void 0;</script></html>');
  const alias = path.join(path.dirname(options.input), 'inspector-alias.mjs');
  fs.symlinkSync(fileURLToPath(new URL('./inspect-playable.mjs', import.meta.url)), alias);
  const result = spawnSync(process.execPath, [alias, '--input', options.input, '--out', options.out], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).format, 'html');
  assert.equal(JSON.parse(fs.readFileSync(path.join(options.out, 'inspection.json'))).inlineScriptCount, 1);
});
