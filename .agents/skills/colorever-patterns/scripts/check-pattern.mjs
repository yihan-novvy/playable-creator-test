import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';

const defaultRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
const inventory = cells => cells.filter(Boolean).sort((a, b) => a - b);
const MAX_GLOBAL_MOVES = 50;
const assertFileName = (name, extension) => {
  assert.match(name ?? '', new RegExp(`^[a-z][a-z0-9-]*\\.${extension}$`), 'Invalid pattern file name');
};

// Read-only entry point; accepts a root in tests without copying the real repo.
export async function checkPattern({id, built = false, seed, coverage = 95, batchSize = 30, repoRoot = defaultRoot}) {
  assert.match(id ?? '', /^[a-z][a-z0-9-]*$/, 'Invalid pattern ID');
  const root = path.join(repoRoot, 'template-core/colorever-new');
  const sourceDir = path.join(root, 'src/patterns');
  const catalog = await readJson(path.join(sourceDir, 'catalog.json'));
  const matches = catalog.filter(picture => picture.id === id);
  assert.equal(matches.length, 1, `Expected exactly one source registration for ${id}`);
  const picture = matches[0];
  assertFileName(picture.level, 'json');
  assertFileName(picture.module, 'js');
  await fs.access(path.join(sourceDir, picture.module));

  const registry = await fs.readFile(path.join(sourceDir, 'index.js'), 'utf8');
  // Match the source registry convention; actual module loading is checked in Vite.
  const quoted = name => `['"]\\./${name.replaceAll('.', '\\.')}['"]`;
  const levelImport = registry.match(new RegExp(`import\\s+(\\w+)\\s+from\\s*${quoted(picture.level)}`));
  const moduleImport = registry.match(new RegExp(`import\\s*\\{\\s*decorate\\s+as\\s+(\\w+)\\s*\\}\\s*from\\s*${quoted(picture.module)}`));
  assert.ok(levelImport && moduleImport, 'Missing level/decorator import in src/patterns/index.js');
  const member = new RegExp(`(?:['"]${id}['"]|\\b${id})\\s*:\\s*\\{\\s*level\\s*:\\s*${levelImport[1]}\\s*,\\s*decorate\\s*:\\s*${moduleImport[1]}\\s*\\}`);
  assert.match(registry, member, 'Missing pattern member in src/patterns/index.js');

  const source = await readJson(path.join(sourceDir, picture.level));
  assert.equal(source.version, 1, 'Expected pattern version 1');
  assert.ok(typeof source.name === 'string' && source.name.trim() && source.name.length <= 100, 'Expected a nonempty pattern name of at most 100 characters');
  assert.equal(source.opening, null, 'Source patterns must not contain a baked opening');
  // Keep the source schema for built-data comparison; generate openings through
  // the shipping entry, where medium uses GlobalPuzzle rather than legacy patches.
  const {validateLevel} = await import(pathToFileURL(path.join(root, 'src/level.js')).href);
  const {prepareLevel} = await import(pathToFileURL(path.join(root, 'src/game-level.js')).href);
  const normalized = validateLevel(source);
  const checkedSeed = seed ?? normalized.seed;
  const modes = {};
  for (const mode of ['easy', 'medium']) {
    let prepared;
    try {
      prepared = prepareLevel({...normalized, openingMode: mode, seed: checkedSeed, coverage, batchSize});
    } catch (error) {
      throw new Error(`${mode}, seed ${checkedSeed}: ${error.message}`);
    }
    assert.deepEqual(inventory(prepared.level.opening), inventory(normalized.target), `${mode}: color inventory changed`);
    assert.ok(prepared.level.opening.every((color, index) => (color === 0) === (normalized.target[index] === 0)), `${mode}: board silhouette changed`);
    modes[mode] = {moves: prepared.proof.moves, actions: prepared.proof.solution.length, seed: checkedSeed};
    if (mode === 'medium') {
      const metrics = prepared.proof.metrics;
      assert.ok(metrics && Number.isFinite(metrics.averageBatch), 'Shipping global replay must report transfer metrics');
      modes.medium = {
        ...modes.medium, ...metrics, coverage, batchSize,
        capacity: prepared.level.capacity, trayCols: prepared.level.trayCols,
        maxMoves: MAX_GLOBAL_MOVES, withinMoveBudget: prepared.proof.moves <= MAX_GLOBAL_MOVES,
      };
    }
  }

  const result = {
    ok: true, id, name: normalized.name,
    width: normalized.width, height: normalized.height,
    beads: normalized.target.filter(Boolean).length,
    colors: new Set(normalized.target.filter(Boolean)).size,
    seed: checkedSeed, sourceSeed: normalized.seed, difficulty: normalized.difficulty, modes,
    warnings: batchSize === 30 && modes.medium.averageBatch < 12
      ? ['全局模式平均搬运不足 12 颗；优先合并碎色、扩大连续色块，并检查小批搬运占比。12 颗是优化参考，50 次是硬门槛。'] : [],
    built: false,
  };
  const finish = report => {
    if (!modes.medium.withinMoveBudget) {
      const error = new Error(`全局大块归位需要 ${modes.medium.moves} 次搬运，超过 ${MAX_GLOBAL_MOVES} 次上限（seed ${checkedSeed}, coverage ${coverage}, batchSize ${batchSize}）；请简化图案并扩大连续色块`);
      error.result = {...report, ok: false, error: error.message};
      throw error;
    }
    return report;
  };
  if (!built) return finish(result);

  const builtRoot = path.join(repoRoot, 'editor/templates/colorever-new');
  const gameRoot = path.join(builtRoot, 'game');
  const compiled = await readJson(path.join(gameRoot, 'patterns/catalog.json'));
  assert.equal(compiled.version, 2, 'Unsupported built catalog version');
  const entries = compiled.patterns.filter(entry => entry.id === id);
  assert.equal(entries.length, 1, `Expected exactly one built registration for ${id}`);
  const entry = entries[0];
  assertFileName(entry.level, 'json');
  const data = await fs.readFile(path.join(gameRoot, 'patterns', entry.level));
  assert.equal(hash(data), entry.templateSha256, 'Built pattern hash mismatch');
  assert.deepEqual(JSON.parse(data), normalized, 'Built pattern differs from source; rebuild colorever-new');
  assert.equal(entry.name, picture.name, 'Built pattern name differs from source catalog');
  assert.equal(entry.description, picture.description, 'Built description differs from source catalog');

  assert.equal(hash(await fs.readFile(path.join(gameRoot, 'game.js'))), compiled.engineSha256, 'Game engine hash mismatch');
  assertFileName(compiled.levelEngine, 'mjs');
  assert.equal(hash(await fs.readFile(path.join(gameRoot, compiled.levelEngine))), compiled.levelEngineSha256, 'Level engine hash mismatch');
  const decorator = compiled.decorators?.[id];
  assert.match(decorator?.file ?? '', /^decorators\/[a-z][a-z0-9-]*\.js$/, 'Missing or invalid decorator artifact');
  assert.equal(hash(await fs.readFile(path.join(gameRoot, decorator.file))), decorator.sha256, 'Decorator hash mismatch');

  const manifest = await readJson(path.join(builtRoot, 'game-manifest.json'));
  assert.equal(manifest.id, 'colorever-new', 'Wrong template manifest');
  const levels = manifest.levels.filter(level => level.id === id);
  assert.equal(levels.length, 1, 'Missing or duplicate manifest registration');
  assert.equal(levels[0].path, `game/patterns/${entry.level}`, 'Manifest pattern path mismatch');
  assert.equal(levels[0].name, picture.name, 'Manifest name differs from source catalog');
  assert.equal(manifest.constants.engineSha256, compiled.engineSha256, 'Manifest game engine hash mismatch');
  assert.equal(manifest.constants.levelEngine, `game/${compiled.levelEngine}`, 'Manifest level engine path mismatch');
  assert.equal(manifest.constants.levelEngineSha256, compiled.levelEngineSha256, 'Manifest level engine hash mismatch');
  return finish({...result, built: true, engineSha256: compiled.engineSha256});
}

export function parseArgs(args) {
  const usage = 'Usage: node check-pattern.mjs <pattern-id> [--built] [--seed N] [--coverage 80..100] [--batch-size 12..48]';
  assert.match(args[0] ?? '', /^[a-z][a-z0-9-]*$/, usage);
  const options = {id: args[0]}, seen = new Set();
  const numeric = {'--seed': 'seed', '--coverage': 'coverage', '--batch-size': 'batchSize'};
  for (let i = 1; i < args.length; i++) {
    const flag = args[i];
    assert.ok(!seen.has(flag), `Duplicate option ${flag}. ${usage}`);
    seen.add(flag);
    if (flag === '--built') options.built = true;
    else {
      assert.ok(Object.hasOwn(numeric, flag), `Unknown option ${flag}. ${usage}`);
      const raw = args[++i];
      assert.match(raw ?? '', /^\d+$/, `Expected an integer for ${flag}. ${usage}`);
      options[numeric[flag]] = Number(raw);
    }
  }
  return options;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    console.log(JSON.stringify(await checkPattern(parseArgs(process.argv.slice(2))), null, 2));
  } catch (error) {
    console.error(JSON.stringify(error.result ?? {ok: false, error: error.message}, null, 2));
    process.exitCode = 1;
  }
}
