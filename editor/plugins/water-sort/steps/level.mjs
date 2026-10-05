import fs from 'node:fs';
import path from 'node:path';

// 关卡规则移植自 water-sort-puzzle/src/game.js(模板 game.js 的未打包源码),
// 校验与可解性判据必须和游戏本体完全一致,否则打包出的关卡可能玩不通。

function validateWaterSortLevel(level) {
  const capacity = level?.capacity;
  if (!Number.isInteger(capacity) || capacity < 2 || capacity > 6) {
    throw new Error(`capacity 必须是 2-6 的整数,收到 ${JSON.stringify(capacity ?? null)}`);
  }
  const colors = level?.colors;
  if (!colors || typeof colors !== 'object' || Array.isArray(colors) || Object.keys(colors).length === 0) {
    throw new Error('colors 必须是非空的颜色表(名称 → #RRGGBB)');
  }
  for (const [name, hex] of Object.entries(colors)) {
    if (!/^#[0-9a-f]{6}$/i.test(String(hex))) {
      throw new Error(`颜色 ${name} 的值必须是 #RRGGBB,收到 ${JSON.stringify(hex ?? null)}`);
    }
  }
  const bottles = level?.bottles;
  if (!Array.isArray(bottles) || bottles.length < 2 || bottles.length > 12) {
    throw new Error('bottles 必须是 2-12 个瓶子的数组(瓶内自下而上,空瓶为 [])');
  }
  const colorCounts = {};
  for (const [index, bottle] of bottles.entries()) {
    if (!Array.isArray(bottle)) throw new Error(`瓶子 ${index} 不是数组`);
    if (bottle.length > capacity) throw new Error(`瓶子 ${index} 有 ${bottle.length} 层,超过 capacity ${capacity}`);
    for (const color of bottle) {
      if (typeof color !== 'string' || !(color in colors)) {
        throw new Error(`瓶子 ${index} 含未定义的颜色: ${JSON.stringify(color ?? null)}`);
      }
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    }
  }
  for (const [name, count] of Object.entries(colorCounts)) {
    if (count % capacity !== 0) {
      throw new Error(`颜色 ${name} 共 ${count} 层,无法被 capacity ${capacity} 整除(倒不满一整瓶)`);
    }
  }
  return colorCounts;
}

// BFS 可解性(与 water-sort-puzzle/src/game.test.js 同一判据):穷尽全部状态
// 都没有胜利局面 → 不可解;超过状态/时间上限 → truncated(结构已合法,降级
// 为告警而不是拦打包)。
const SOLVE_MAX_STATES = 150_000;
const SOLVE_DEADLINE_MS = 2000;

function waterSortSolvability(level) {
  const { capacity, bottles } = level;
  const isWon = (state) =>
    state.every((bottle) => bottle.length === 0 || (bottle.length === capacity && bottle.every((color) => color === bottle[0])));
  const topRun = (bottle) => {
    const color = bottle[bottle.length - 1];
    let count = 0;
    for (let index = bottle.length - 1; index >= 0 && bottle[index] === color; index -= 1) count += 1;
    return { color, count };
  };
  const keyOf = (state) => state.map((bottle) => bottle.join(',')).sort().join('|');
  const start = bottles.map((bottle) => [...bottle]);
  if (isWon(start)) return { solvable: true, explored: 0, truncated: false };
  const seen = new Set([keyOf(start)]);
  let frontier = [start];
  const deadline = Date.now() + SOLVE_DEADLINE_MS;
  let explored = 0;
  while (frontier.length > 0) {
    const next = [];
    for (const state of frontier) {
      explored += 1;
      if (explored > SOLVE_MAX_STATES || Date.now() > deadline) {
        return { solvable: false, explored, truncated: true };
      }
      for (let from = 0; from < state.length; from += 1) {
        const source = state[from];
        if (source.length === 0) continue;
        const { color, count } = topRun(source);
        for (let to = 0; to < state.length; to += 1) {
          if (to === from) continue;
          const target = state[to];
          if (target.length >= capacity) continue;
          if (target.length > 0 && target[target.length - 1] !== color) continue;
          // 剪枝:把整瓶同色倒进空瓶不产生新局面(同构),只拖慢 BFS。
          if (target.length === 0 && count === source.length) continue;
          const moved = Math.min(count, capacity - target.length);
          const child = state.map((bottle, index) => {
            if (index === from) return bottle.slice(0, bottle.length - moved);
            if (index === to) return [...bottle, ...Array(moved).fill(color)];
            return bottle;
          });
          const key = keyOf(child);
          if (seen.has(key)) continue;
          seen.add(key);
          if (isWon(child)) return { solvable: true, explored: explored + 1, truncated: false };
          next.push(child);
        }
      }
    }
    frontier = next;
  }
  return { solvable: false, explored, truncated: false };
}

export function prerequisites() {
  return { uploads: [], generated: [] };
}

export async function run(ctx) {
  const authored = ctx.config?.level;
  let level;
  let source;
  if (authored && typeof authored === 'object' && !Array.isArray(authored)) {
    level = structuredClone(authored);
    source = 'config';
  } else {
    // 未编辑过关卡:回落到模板自带关卡,创建后一键跑全流程就能出可玩包。
    const assetPath = ctx.template.level?.assetPath || 'level.json';
    level = JSON.parse(fs.readFileSync(path.join(ctx.templateRoot, assetPath), 'utf8'));
    source = 'template-default';
  }
  // 归一化:只保留游戏认识的键,作者多写的字段不进产物。
  const normalized = {
    ...(level.id !== undefined ? { id: String(level.id) } : {}),
    ...(level.name !== undefined ? { name: String(level.name) } : {}),
    capacity: level.capacity,
    colors: level.colors,
    bottles: level.bottles,
  };
  const colorCounts = validateWaterSortLevel(normalized);
  const solvability = waterSortSolvability(normalized);
  if (!solvability.truncated && !solvability.solvable) {
    throw new Error(`关卡不可解:BFS 穷尽 ${solvability.explored} 个状态也没有胜利局面,请调整瓶内颜色`);
  }
  fs.writeFileSync(path.join(ctx.generatedDir, 'level.json'), JSON.stringify(normalized, null, 2));
  const warnings = [];
  if (solvability.truncated) {
    warnings.push(`瓶状态空间超过上限(已探索 ${solvability.explored} 个),未完成可解性验证;结构校验已通过`);
  }
  return {
    metrics: {
      source,
      capacity: normalized.capacity,
      bottleCount: normalized.bottles.length,
      emptyBottles: normalized.bottles.filter((bottle) => bottle.length === 0).length,
      colorCount: Object.keys(normalized.colors).length,
      colorCounts,
      solvable: solvability.solvable,
      bfsStatesExplored: solvability.explored,
      truncated: solvability.truncated,
    },
    warnings,
  };
}
