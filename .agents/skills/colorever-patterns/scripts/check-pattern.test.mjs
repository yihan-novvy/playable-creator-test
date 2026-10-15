import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkPattern, parseArgs} from './check-pattern.mjs';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const sourceRoot = path.join(repoRoot, 'template-core/colorever-new/src');
const {prepareLevel, createPuzzle} = await import(new URL('../../../../template-core/colorever-new/src/game-level.js', import.meta.url));
const {prepareLevel: prepareLegacyLevel} = await import(new URL('../../../../template-core/colorever-new/src/level.js', import.meta.url));

function pattern(size = 16, kind = 'quadrants', seed = 1) {
  return {
    version: 1, name: 'Checker fixture', width: size, height: size,
    colors: {1: '#112233', 2: '#eeaaaa', 3: '#336655', 4: '#bbddff'},
    target: Array.from({length: size * size}, (_, i) => {
      const x = i % size, y = Math.floor(i / size);
      return kind === 'quadrants'
        ? 1 + Math.floor(x / (size / 2)) + 2 * Math.floor(y / (size / 2))
        : 1 + (Math.floor(x / 4) + Math.floor(y / 4)) % 4;
    }),
    opening: null, capacity: 48, trayCols: 12,
    openingMode: 'easy', difficulty: 21, seed, decoration: 'none',
  };
}

async function fixture(t, source) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'colorever-check-'));
  t.after(() => fs.rm(root, {recursive: true, force: true}));
  const src = path.join(root, 'template-core/colorever-new/src');
  const patterns = path.join(src, 'patterns');
  await fs.mkdir(patterns, {recursive: true});
  // Exercise the real shipping engine, with isolated pattern/registry files.
  for (const file of ['level.js', 'game-level.js']) {
    await fs.symlink(path.join(sourceRoot, file), path.join(src, file));
  }
  await fs.writeFile(path.join(patterns, 'fixture.json'), JSON.stringify(source));
  await fs.writeFile(path.join(patterns, 'fixture.js'), 'export function decorate() {}\n');
  await fs.writeFile(path.join(patterns, 'catalog.json'), JSON.stringify([
    {id: 'fixture', name: source.name, description: 'test', level: 'fixture.json', module: 'fixture.js'},
  ]));
  await fs.writeFile(path.join(patterns, 'index.js'), [
    "import level from './fixture.json';",
    "import {decorate as decorator} from './fixture.js';",
    "export const patterns = {'fixture': {level: level, decorate: decorator}};",
  ].join('\n'));
  return {id: 'fixture', repoRoot: root};
}

test('reports shipping global metrics, including real placements and excluding cache shifts', async t => {
  const source = pattern(), options = await fixture(t, source);
  const result = await checkPattern(options);
  const {level, proof} = prepareLevel({...source, openingMode: 'medium', coverage: 95, batchSize: 30});
  assert.equal(result.ok, true);
  assert.equal(result.modes.medium.moves, proof.moves);
  assert.equal(result.modes.medium.actions, proof.solution.length);
  assert.equal(result.modes.medium.withinMoveBudget, true);
  assert.equal(result.modes.medium.coverage, 95);
  assert.equal(result.modes.medium.batchSize, 30);
  assert.equal(result.modes.medium.maxMoves, 80);
  const puzzle = createPuzzle(level), amounts = [];
  for (const hint of proof.solution) {
    if (hint.action === 'pick') assert.ok(puzzle.pick(hint.region, hint.index));
    else {
      const moved = puzzle.place(hint.region, hint.index);
      assert.ok(moved);
      amounts.push(moved.filter(move => !move.shift).length);
    }
  }
  assert.ok(puzzle.complete);
  assert.equal(amounts.length, result.modes.medium.moves);
  assert.equal(result.modes.medium.averageBatch, Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length * 10) / 10);
  assert.equal(result.modes.medium.smallBatchPercent, Math.round(amounts.filter(n => n <= 2).length / amounts.length * 100));
});

test('rejects a fragmented global opening even when legacy medium passes in 12–14 moves', async t => {
  const source = pattern(32, 'blocks'), options = await fixture(t, source);
  const legacy = prepareLegacyLevel({...source, openingMode: 'medium'});
  assert.ok(legacy.proof.moves <= 14);
  const actual = prepareLevel({...source, openingMode: 'medium'});
  assert.ok(actual.proof.moves > 80);
  await assert.rejects(checkPattern({...options, coverage: 95}), error => {
    assert.match(error.message, /超过 80 次上限/);
    assert.equal(error.result.ok, false);
    assert.equal(error.result.modes.medium.moves, actual.proof.moves);
    assert.equal(error.result.modes.medium.averageBatch, actual.proof.metrics.averageBatch);
    assert.equal(error.result.modes.medium.withinMoveBudget, false);
    return true;
  });
});

test('preserves the artwork and retries at 80 percent before rejecting the move budget', async t => {
  const source = pattern(32, 'blocks'), options = await fixture(t, source);
  const result = await checkPattern(options);
  assert.equal(result.ok, true);
  assert.deepEqual(result.openingTrials.map(trial => trial.coverage), [95, 80]);
  assert.ok(result.openingTrials[0].moves > 80);
  assert.ok(result.openingTrials[1].moves <= 80);
  assert.equal(result.modes.medium.coverage, 80);
  assert.equal(result.recommendedOpening.coverage, 80);
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(options.repoRoot, 'template-core/colorever-new/src/patterns/fixture.json'), 'utf8')), source);

  const tooLarge = await fixture(t, pattern(40, 'blocks'));
  await assert.rejects(checkPattern(tooLarge), error => {
    assert.equal(error.result.modes.medium.coverage, 80);
    assert.ok(error.result.modes.medium.moves > 80);
    assert.equal(error.result.openingTrials.length, 2);
    return true;
  });
});

test('accepts exactly 80 moves and retains source data when checking task overrides', async t => {
  const boundary = await checkPattern(await fixture(t, pattern(40, 'quadrants', 5)));
  assert.equal(boundary.modes.medium.moves, 80);
  assert.equal(boundary.ok, true);

  const source = pattern(), options = await fixture(t, source);
  const checked = await checkPattern({...options, seed: 7, coverage: 90, batchSize: 24});
  const expected = prepareLevel({...source, openingMode: 'medium', seed: 7, coverage: 90, batchSize: 24});
  assert.equal(checked.sourceSeed, 1);
  assert.equal(checked.seed, 7);
  assert.equal(checked.modes.medium.coverage, 90);
  assert.equal(checked.modes.medium.batchSize, 24);
  assert.equal(checked.modes.medium.averageBatch, expected.proof.metrics.averageBatch);
  assert.equal(checked.modes.medium.moves, expected.proof.moves);
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(options.repoRoot, 'template-core/colorever-new/src/patterns/fixture.json'), 'utf8')), source);
});

test('validates task parameters and rejects unknown or incomplete CLI options', async t => {
  assert.deepEqual(parseArgs(['fixture', '--seed', '7', '--built', '--coverage', '90', '--batch-size', '24']), {
    id: 'fixture', seed: 7, built: true, coverage: 90, batchSize: 24,
  });
  for (const args of [[], ['fixture', '--seed'], ['fixture', '--seed', '7.5'], ['fixture', '--max-moves', '100'], ['fixture', '--built', '--built']]) {
    assert.throws(() => parseArgs(args));
  }
  const options = await fixture(t, pattern());
  await assert.rejects(checkPattern({...options, coverage: 79}), /80–100/);
  await assert.rejects(checkPattern({...options, batchSize: 49}), /12–48/);
  await assert.rejects(checkPattern({...options, seed: -1}), /随机种子/);
});
