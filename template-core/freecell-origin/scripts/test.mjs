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
  const generated = fs.readFileSync(path.resolve(root, '../../editor/templates/freecell-origin', file));
  assert.equal(createHash('sha256').update(generated).digest('hex'), createHash('sha256').update(content).digest('hex'), `${file} matches its compiled source`);
}
// Exercise the real boot script: audio unlock belongs to SoundsManager,
// while Sound only exposes the game's playback helpers.
const listeners = {}, muteStates = [];
let unlocked = 0;
const document = { hidden: false, readyState: 'complete', getElementById: () => ({ clientWidth: 320, clientHeight: 568 }), addEventListener: (name, fn) => { listeners[name] = fn; } };
vm.runInNewContext(first.files['game/boot.js'], {
  document, window: { addEventListener() {} },
  Howler: { mute: value => muteStates.push(value) },
  SoundsManager: { unlock: () => unlocked++ },
  LayoutManager: { fitLayout() {} },
  Game: { app: {}, init() {}, on() {}, resume() {}, pause() {} },
});
assert.equal(muteStates.at(-1), false, 'visible game defaults to audio on');
listeners.pointerdown();
assert.equal(unlocked, 1, 'first interaction unlocks the native sound manager');
document.hidden = true; listeners.visibilitychange();
assert.equal(muteStates.at(-1), true, 'background game is muted');
document.hidden = false; listeners.visibilitychange();
assert.equal(muteStates.at(-1), false, 'returning to the game restores sound');
console.log('FreeCell: frozen source, deterministic build, 52-card conservation, native foundation rules, source syntax and generated files passed');
