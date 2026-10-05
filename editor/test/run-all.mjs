import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Plain-node test runner: `node editor/test/run-all.mjs [name-filter ...]`
// Each test file default-exports an async function receiving the assert kit.

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));

export function createAssert() {
  let passed = 0;
  const failures = [];

  function check(condition, label, detail) {
    if (condition) {
      passed += 1;
      console.log(`  ok  ${label}`);
    } else {
      failures.push({ label, detail });
      console.error(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
    }
  }

  function equal(actual, expected, label) {
    const actualJson = JSON.stringify(actual);
    const expectedJson = JSON.stringify(expected);
    check(actualJson === expectedJson, label, actualJson === expectedJson ? undefined : `expected ${expectedJson}, received ${actualJson}`);
  }

  function summary(testName) {
    if (failures.length === 0) {
      console.log(`== ${testName}: ${passed} checks passed ==`);
      return true;
    }
    console.error(`== ${testName}: ${failures.length} FAILED, ${passed} passed ==`);
    return false;
  }

  return { check, equal, summary };
}

export const TESTS = [
  { name: 'colorever', file: path.join(TEST_DIR, 'colorever.test.mjs') },
  { name: 'colorever-outro', file: path.join(TEST_DIR, 'colorever-outro.test.mjs') },
  { name: 'pattern-colors', file: path.join(TEST_DIR, 'pattern-colors.test.mjs') },
  { name: 'editor-run-regressions', file: path.join(TEST_DIR, 'editor-run-regressions.test.mjs') },
  { name: 'repack-port', file: path.join(TEST_DIR, 'repack-port.test.mjs') },
  { name: 'analytics-pack', file: path.join(TEST_DIR, 'analytics-pack.test.mjs') },
  { name: 'steps', file: path.join(TEST_DIR, 'steps.test.mjs') },
  { name: 'meta-patch', file: path.join(TEST_DIR, 'meta-patch.test.mjs') },
  { name: 'config-patch', file: path.join(TEST_DIR, 'config-patch.test.mjs') },
  { name: 'e2e-reference', file: path.join(TEST_DIR, 'e2e-reference.test.mjs') },
  { name: 'water-sort', file: path.join(TEST_DIR, 'water-sort.test.mjs') },
  { name: 'dragon-cube', file: path.join(TEST_DIR, 'dragon-cube.test.mjs') },
];

async function main() {
  const filters = process.argv.slice(2);
  const selected = TESTS.filter((test) => filters.length === 0 || filters.includes(test.name));
  if (selected.length === 0) {
    console.error(`No tests matched: ${filters.join(', ')}`);
    process.exit(1);
  }
  let allGreen = true;
  for (const test of selected) {
    console.log(`\n== ${test.name} ==`);
    const assert = createAssert();
    try {
      const { default: run } = await import(test.file);
      await run(assert);
    } catch (error) {
      console.error(`FAIL  test crashed — ${error.stack || error}`);
      allGreen = false;
      continue;
    }
    if (!assert.summary(test.name)) allGreen = false;
  }
  process.exitCode = allGreen ? 0 : 1;
}

await main();
