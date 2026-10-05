import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the actual movement and collection functions without a canvas/audio device.
const source = fs.readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');
const functions = source.slice(source.indexOf('  function boxCells('), source.indexOf('  function onDown('));
function game({ cats = [], blocks = [], offsets = [{ x: 0, y: 0 }], others = [] } = {}) {
  const box = { x: 0, y: 0, color: 0, remaining: 4, offsets };
  const state = {
    cells: new Set(Array.from({ length: 6 }, (_, x) => `${x},0`)),
    cats, blocks, boxes: [box, ...others], collected: 0, total: 4, finished: false,
  };
  const context = vm.createContext({
    state, key: (x, y) => `${x},${y}`, ghosts: [], performance: { now: () => 0 },
    directions: [[0, 1], [1, 0], [0, -1], [-1, 0]],
    fire() {}, play() {}, render() {}, setTimeout() {},
  });
  vm.runInContext(functions, context);
  return { box, state, move: (x, y) => context.move(box, x, y) };
}

test('异色小龙阻挡移动，不能越过，位置和收集数保持不变', () => {
  const g = game({ cats: [{ x: 2, y: 0, color: 1 }] });
  assert.equal(g.move(1, 0), true);
  assert.equal(g.move(2, 0), false);
  assert.equal(g.box.x, 1);
  assert.equal(g.state.collected, 0);
  assert.equal(g.state.cats.length, 1);
});

test('同色小龙可进入并收集，收集后的格子不再阻挡其他颜色', () => {
  const g = game({ cats: [{ x: 1, y: 0, color: 0 }] });
  assert.equal(g.move(1, 0), true);
  assert.equal(g.state.collected, 1);
  assert.equal(g.box.remaining, 3);
  assert.equal(g.state.cats.length, 0);
  assert.equal(g.move(0, 0), true);
  g.box.color = 1;
  assert.equal(g.move(1, 0), true);
});

test('多格滑块任一部分触及异色小龙都应阻挡，不能部分收集', () => {
  const g = game({
    offsets: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    cats: [{ x: 2, y: 0, color: 0 }, { x: 3, y: 0, color: 1 }],
  });
  assert.equal(g.move(2, 0), false);
  assert.equal(g.box.x, 0);
  assert.equal(g.state.collected, 0);
  assert.equal(g.state.cats.length, 2);
});

test('其他滑块、定向猫块和棋盘边界继续阻挡', () => {
  const other = { x: 1, y: 0, color: 0, remaining: 1, offsets: [{ x: 0, y: 0 }] };
  const g = game({ others: [other], blocks: [{ x: 2, y: 0, queue: [] }] });
  assert.equal(g.move(1, 0), false);
  assert.equal(g.move(2, 0), false);
  assert.equal(g.move(-1, 0), false);
  other.remaining = 0;
  assert.equal(g.move(1, 0), true);
});
