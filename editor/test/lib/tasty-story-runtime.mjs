import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../plugins/tasty-travels-origin/overlays/story/story.js', import.meta.url), 'utf8');
function runtime({ intro = false, introFinished = false, reduced = false } = {}) {
  const timers = new Set(), timeouts = [], events = [], listeners = new Map();
  class Element {
    children = []; style = {}; dataset = {}; attributes = {}; handlers = {}; textContent = ''; scrollTop = 0; scrollHeight = 100;
    classList = { toggle() {}, add() {} };
    appendChild(child) { this.children.push(child); }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(name, handler) { this.handlers[name] = handler; }
    scrollTo({ top }) { this.scrollTop = top; }
    remove() { this.removed = true; }
    fire(type, properties = {}) { this.handlers[type]?.({ stopPropagation() {}, preventDefault() {}, ...properties }); }
  }
  const nodes = Object.fromEntries(['novvy-story', 'tasty-story-feed', 'tasty-story-next', 'tasty-story-skip'].map(id => [id, new Element()]));
  const root = nodes['novvy-story'], feed = nodes['tasty-story-feed'], next = nodes['tasty-story-next'], skip = nodes['tasty-story-skip'];
  root.hidden = intro;
  const document = { hidden: false, getElementById: id => nodes[id], createElement: () => new Element() };
  const window = {
    __ORIGIN_CONFIG__: { intro }, __novvyIntroFinished: introFinished, __novvyBridgeVersion: 1, __novvyViewable: true,
    matchMedia: () => ({ matches: reduced }), setTimeout: fn => timeouts.push(fn),
    addEventListener(name, fn) { listeners.set(name, fn); },
    dispatchEvent(event) { events.push(event); listeners.get(event.type)?.(event); },
  };
  vm.runInNewContext(source, { document, window, setInterval(fn) { timers.add(fn); return fn; }, clearInterval(fn) { timers.delete(fn); }, CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } } });
  return { root, feed, next, skip, document, window, events, timers,
    tick: () => [...timers].forEach(fn => fn()), flush: () => timeouts.splice(0).forEach(fn => fn()),
    lines: () => feed.children.filter(node => node.dataset.speaker).map(row => row.children[1].children[1].textContent),
  };
}

export function testStory(a) {
  const r = runtime();
  a.check(!r.root.hidden && r.feed.children.length === 2, 'story starts with scene and first dialogue');
  r.tick(); const partial = r.lines()[0]; r.document.hidden = true; r.tick();
  a.equal(r.lines()[0], partial, 'typing pauses in hidden documents');
  r.document.hidden = false; r.window.__novvyViewable = false; r.tick();
  a.equal(r.lines()[0], partial, 'typing pauses when ad is not viewable');
  r.window.__novvyViewable = true; r.next.fire('click');
  a.equal(r.lines()[0], 'Ma’am, are you alright? What are you doing here?', 'first tap reveals full dialogue without skipping it');
  r.feed.fire('pointerdown', { clientX: 50, clientY: 200 }); r.feed.fire('click', { clientX: 50, clientY: 150 });
  a.equal(r.feed.children.length, 2, 'scroll gestures do not advance dialogue');
  r.feed.fire('keydown', { key: 'Enter' }); r.next.fire('click');
  a.equal(r.lines()[1], 'Officer, thank goodness you’re here! That way, hurry!', 'keyboard advances and tap reveals the next line');
  for (let count = 0; count < 25 && r.next.attributes['aria-label'] !== 'Continue to game'; count++) r.next.fire('click');
  a.equal(r.lines().length, 8, 'full story contains all eight dialogue lines');
  a.equal(r.lines().at(-1), 'It might’ve started the fire!', 'story reaches the final hook before entering the game');
  a.check(!r.window.__novvyStoryFinished && r.timers.size === 0, 'final line waits for Continue and leaves no typing timer');
  r.next.fire('click'); r.skip.fire('click'); r.flush();
  a.equal(r.events.map(e => [e.type, e.detail.reason]), [['novvy:story-finished', 'continue']], 'Continue signals entry only once even after another click');
  a.check(r.root.removed && r.next.disabled && r.skip.disabled, 'finished overlay is removed and controls are disabled');
  const video = runtime({ intro: true });
  a.check(video.root.hidden && !video.feed.children.length, 'story waits behind video');
  video.skip.fire('click'); a.equal(video.events.length, 0, 'hidden story cannot end early');
  video.window.dispatchEvent({ type: 'novvy:intro-finished' });
  a.check(!video.root.hidden && video.feed.children.length === 2, 'video completion reveals story');
  video.skip.fire('click'); video.skip.fire('click');
  a.equal(video.events.filter(e => e.type === 'novvy:story-finished').map(e => e.detail.reason), ['skip'], 'skip exits exactly once while typing');
  a.equal(video.timers.size, 0, 'skip clears active typing timer');
  const ready = runtime({ intro: true, introFinished: true, reduced: true });
  a.check(!ready.root.hidden && ready.lines()[0].length > 10 && !ready.timers.size, 'finished video starts immediately and reduced motion shows complete text');
}
