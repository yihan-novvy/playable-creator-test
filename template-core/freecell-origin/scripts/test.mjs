import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { compileSource } from './build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'source/original.html'), 'utf8');
const provenance = JSON.parse(fs.readFileSync(path.join(root, 'source/provenance.json')));
assert.equal(createHash('sha256').update(source).digest('hex'), provenance.originalSha256);
const first = compileSource(source), second = compileSource(source);
assert.deepEqual(first, second);
const level = JSON.parse(first.files['game/level.json']);
const cards = Object.values(level.tableau).flatMap(column => [...column.closed, ...column.opened]);
assert.equal(cards.length, 52);
assert.equal(new Set(cards.map(card => `${card.suit}:${card.value}`)).size, 52);
for (const suit of ['spades','clubs','diamonds','hearts']) assert.equal(cards.filter(card => card.suit === suit).length, 13);
const sourceRuntime = first.files['game/runtime.js'];
const from = sourceRuntime.indexOf('function Card('), to = sourceRuntime.indexOf('function Tableau(', from);
assert.ok(from >= 0 && to > from);
const ctx = vm.createContext({});
vm.runInContext(sourceRuntime.slice(from, to), ctx);
const foundations = new ctx.Foundations({ 1: [], 2: [], 3: [], 4: [] });
assert.equal(foundations.checkForOccupancy(0, new ctx.Card({ suit:'hearts', value:'2' })), false);
for (const [index, suit] of ['spades','clubs','diamonds','hearts'].entries()) {
  for (const value of ['A','2','3','4','5','6','7','8','9','10','J','Q','K']) {
    const card = new ctx.Card({ suit, value });
    assert.equal(foundations.checkForOccupancy(index, card), true);
    foundations.addCard(card);
    if (index < 3 || value !== 'K') assert.equal(foundations.isFilled(), false);
  }
}
assert.equal(foundations.isFilled(), true);
assert.equal(foundations.columns.reduce((n, column) => n + column.cards.length, 0), 52);
const config = JSON.parse(first.files['game/config.js'].slice('var CONFIG='.length).trim().slice(0,-1));
assert.equal(config.application.tapsToRedirect, 0);
assert.equal(config.application.secToRedirect, null);
for (const [file, content] of Object.entries(first.files)) {
  if (file.endsWith('.js')) new vm.Script(content, { filename: file });
  assert.equal(fs.readFileSync(path.resolve(root, '../../editor/templates/freecell-origin', file), 'utf8'), content);
}
console.log('FreeCell: frozen source, deterministic build, 52-card conservation, native foundation rules, source syntax and generated files passed');
