import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateLevel, createState, escapeRoute, attemptEscape, availableArrows, solveLevel, roundedPath, pathMetrics, movingPath, escapeTiming, trailMarkers, normalizeGameplay } from '../src/level-model.mjs';

const load = id => ({ Index: id, ...JSON.parse(fs.readFileSync(new URL(`../src/levels/${id}.json`, import.meta.url), 'utf8')) });

test('the library contains exactly the first 100 Unity levels, all valid and solvable without mutating source data', () => {
  const files = fs.readdirSync(new URL('../src/levels/', import.meta.url)).filter(file => /^\d+\.json$/.test(file)).map(file => Number(file.slice(0, -5))).sort((a, b) => a - b);
  assert.deepEqual(files, Array.from({ length: 100 }, (_, index) => index + 1));
  for (let id = 1; id <= 100; id++) {
    const level = load(id), before = JSON.stringify(level);
    assert.equal(validateLevel(level, id), level);
    const solution = solveLevel(level), state = createState(level);
    assert.equal(solution.length, level.Arrows.length, `level ${id}`);
    for (const arrowId of solution) assert.equal(attemptEscape(state, arrowId).kind, 'escape');
    assert.equal(state.occupancy.size, 0);
    assert.equal(state.lives, 3);
    assert.equal(state.won, true);
    assert.equal(JSON.stringify(level), before);
  }
});

test('head-first Unity indices determine direction and occupied rays gate escape', () => {
  const state = createState(load(2));
  assert.equal(availableArrows(state).length, 1);
  const blockedId = state.arrows.find(a => !escapeRoute(state, a.id).clear).id;
  assert.equal(attemptEscape(state, blockedId).kind, 'blocked');
  assert.equal(state.lives, 2);
  assert.equal(state.arrows[blockedId].marked, true);
  assert.equal(attemptEscape(state, blockedId).lifeLost, false);
  assert.equal(state.lives, 2, 'same failed arrow costs a life only once');
  for (const id of solveLevel(load(2))) attemptEscape(state, id);
  assert.equal(state.won, true);
  assert.equal(state.lives, 2);
});

test('three distinct blocked arrows fail the round, a new state resets lives and marks', () => {
  const state = createState(load(16));
  const blocked = state.arrows.filter(a => !escapeRoute(state, a.id).clear).slice(0, 3);
  for (const arrow of blocked) assert.equal(attemptEscape(state, arrow.id).lifeLost, true);
  assert.equal(state.failed, true);
  assert.equal(state.lives, 0);
  assert.equal(attemptEscape(state, availableArrows(state)[0]), null);
  const fresh = createState(load(16));
  assert.equal(fresh.lives, 3);
  assert.ok(fresh.arrows.every(a => !a.marked));
});

test('logical occupancy releases at escape start and cannot be consumed twice', () => {
  const state = createState(load(9)), id = availableArrows(state)[0];
  const count = state.occupancy.size;
  attemptEscape(state, id);
  assert.equal(state.occupancy.size, count - state.arrows[id].indices.length);
  assert.equal(attemptEscape(state, id), null);
  assert.equal(state.steps, 1);
});

test('an arrow whose forward ray hits its own body remains blocked', () => {
  const level = { GridXSize: 4, GridYSize: 3, Arrows: [{ Indices: [5, 4, 0, 1, 2, 6], ColorIndex: 0 }] };
  const state = createState(level);
  assert.equal(escapeRoute(state, 0).blocker, 0);
  assert.equal(solveLevel(level), null);
});

test('invalid indices, row wrapping, diagonals and overlaps are rejected', () => {
  for (const indices of [[-1, 0], [24, 25], [4, 5], [0, 6], [0, 1, 0]]) {
    assert.throws(() => validateLevel({ GridXSize: 5, GridYSize: 5, Arrows: [{ Indices: indices, ColorIndex: 0 }] }));
  }
});

test('snake animation keeps its path length and follows bends instead of translating the body', () => {
  const points = [{ x: 2, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 0 }, { x: 0, y: 0 }];
  const path = pathMetrics(roundedPath(points));
  assert.ok(path.points.length > points.length, 'corners are rounded');
  for (const distance of [0, .2, 1, path.length, path.length + 3]) {
    const moved = movingPath(path, { x: 1, y: 0 }, distance);
    assert.ok(Math.abs(pathMetrics(moved).length - path.length) < 1e-8);
    assert.ok(Math.abs(moved.at(-1).x - (2 + distance)) < 1e-8);
  }
  assert.equal(movingPath(path, { x: 1, y: 0 }, 1)[0].y > 0, true, 'tail travels around the corner');
});

test('escape stays visible for short arrows and longer paths take proportionally longer', () => {
  const short = escapeTiming(5, 4);
  assert.equal(short.duration, 380);
  assert.equal(short.travel, 9.5, 'travel ends when the tail clears the canvas, without invisible padding');
  const long = escapeTiming(50, 20), longer = escapeTiming(70, 20);
  assert.ok(long.duration > 1000 && long.duration < 1200, 'long arrows use the faster 64 cells per second pace');
  assert.ok(longer.duration > long.duration);
  assert.equal(long.travel / long.duration, longer.travel / longer.duration, 'same grid speed for long arrows');
  assert.equal(escapeTiming(5, -3).travel, 5.5, 'a head already outside the viewport still animates its full body');
});

test('unlimited lives never run out, while a single-life game fails on its first new blocked arrow', () => {
  const unlimited = createState(load(16), null);
  const blocked = unlimited.arrows.filter(arrow => !escapeRoute(unlimited, arrow.id).clear);
  for (const arrow of blocked) assert.equal(attemptEscape(unlimited, arrow.id).lifeLost, false);
  assert.equal(unlimited.lives, null);
  assert.equal(unlimited.failed, false);
  const single = createState(load(16), 1);
  assert.equal(attemptEscape(single, blocked[0].id).lifeLost, true);
  assert.equal(single.lives, 0);
  assert.equal(single.failed, true);
});

test('gameplay settings preserve finite counts, unlimited values and replay choice', () => {
  assert.deepEqual(normalizeGameplay(), { lives: 3, hints: null, allowReplay: true });
  assert.deepEqual(normalizeGameplay({ lives: 'unlimited', hints: 2, allowReplay: false }), { lives: null, hints: 2, allowReplay: false });
  for (const settings of [{ lives: 0 }, { lives: 100 }, { lives: 1.5 }, { hints: -1 }, { hints: '2' }, { allowReplay: 'false' }]) assert.throws(() => normalizeGameplay(settings));
});

test('dot markers follow the tail through rounded bends instead of waiting for the whole escape', () => {
  const points = [{ x: 2, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 0 }, { x: 0, y: 0 }];
  const path = pathMetrics(roundedPath(points)), markers = trailMarkers(points, path);
  assert.deepEqual(markers.map(marker => marker.index), [3, 2, 1, 0]);
  assert.equal(markers[0].distance, .12);
  for (let i = 1; i < markers.length; i++) assert.ok(markers[i].distance > markers[i - 1].distance);
  assert.equal(markers.filter(marker => marker.distance <= .5).length, 1, 'the first dot appears while the rest of the arrow is still on the board');
  assert.ok(Math.abs(markers.at(-1).distance - path.length - .12) < 1e-8);
});
