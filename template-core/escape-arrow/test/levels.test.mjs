import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateLevel, createState, escapeRoute, attemptEscape, availableArrows, solveLevel, roundedPath, pathMetrics, movingPath } from '../src/level-model.mjs';

const load = id => ({ Index: id, ...JSON.parse(fs.readFileSync(new URL(`../src/levels/${id}.json`, import.meta.url), 'utf8')) });

test('all twenty original levels have valid, solvable paths without mutating source data', () => {
  for (let id = 1; id <= 20; id++) {
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
