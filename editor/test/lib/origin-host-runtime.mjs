import vm from 'node:vm';

const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

// Execute the actual assembly host AND its event/CTA bridges. This is an
// in-memory regression fixture, not evidence of an official platform session.
export async function assembledResult(html, kind, prefix, state = { level: 1, levelCount: 1 }) {
  const controls = [], events = [], calls = [];
  class Element extends EventTarget {
    hidden = true; style = {}; dataset = {}; clientWidth = 390; clientHeight = 844;
    after(node) { controls.push(node); }
  }
  const elements = Object.fromEntries(['standalone-origin', prefix + '-result', prefix + '-result-title', prefix + '-result-copy', prefix + '-replay'].map(id => [id, new Element()]));
  controls.push(elements[prefix + '-replay']);
  const document = Object.assign(new EventTarget(), { hidden: false, readyState: 'complete', getElementById: id => elements[id] || null, createElement: () => new Element() });
  const window = Object.assign(new EventTarget(), {
    NovvyPlayable: Object.fromEntries(['setStageList', 'setStage', 'onStart', 'onStep', 'onComplete', 'onReplay', 'endStage', 'click'].map(name => [name, (...args) => calls.push([name, ...args])])),
  });
  const dispatch = window.dispatchEvent.bind(window);
  window.dispatchEvent = event => { events.push(event); return dispatch(event); };
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(([, attrs, source]) =>
    /data-novvy-(origin-config|block-out-config|playable-bridge|origin-cta-config|cta-bridge)(?:\s|$)/.test(attrs) || source.includes('window.ORIGIN_HOST_SETTINGS='));
  if (scripts.length !== 5) throw new Error('Production assembly host or event bridges missing');
  const context = vm.createContext({ window, document, URLSearchParams, location: { search: '' }, navigator: { userAgent: '', language: 'en' }, devicePixelRatio: 1,
    console: { log() {}, error(error) { throw error; } }, CustomEvent, setTimeout, clearTimeout,
    ResizeObserver: class { observe() {} disconnect() {} },
  });
  for (const [, , source] of scripts) vm.runInContext(source, context);
  let shell, rounds = 0;
  window.NovvyGame((root, api) => {
    shell = api; rounds++;
    return { start() {}, pause() {}, resume() {}, destroy() { calls.push(['destroy']); }, setEnv() {}, getState: () => state };
  });
  await flush();
  if (kind) shell[kind]();
  return { controls, elements, events, calls, document, window, get shell() { return shell; }, get rounds() { return rounds; },
    async replay(times = 1) { for (let i = 0; i < times; i++) elements[prefix + '-replay'].dispatchEvent(new Event('click')); await flush(); } };
}

export async function checkAssemblyReplayCta(a, html, prefix) {
  for (const kind of ['win', 'fail']) {
    const result = await assembledResult(html, null, prefix);
    const clicks = () => result.calls.filter(call => call[0] === 'click');
    await result.replay();
    a.equal(clicks().length, 0, 'playing round ignores retry');
    // Consume the automatic CTA latch before the result; retry must bypass it.
    for (let step = 1; step <= 20; step++) result.shell.step(step);
    result.shell[kind]();
    const before = clicks().length;
    result.document.hidden = true; await result.replay(); result.document.hidden = false;
    a.equal(result.rounds, 1, 'hidden retry does not restart or convert');
    a.equal(clicks().length, before, 'hidden retry has no CTA');
    await result.replay(2);
    a.equal(clicks().length, before + 1, kind + ' retry requests one CTA even after automatic conversion');
    const click = clicks().at(-1);
    a.equal(click[1], { click_source: 'forced_click_to_appstore', scene: 'playable-replay' }, 'retry attribution matches the shared bridge');
    a.check(result.calls.indexOf(click) < result.calls.findIndex(call => call[0] === 'destroy'), 'CTA precedes destruction of the old round');
    a.equal(result.rounds, 2, 'double click starts only one new round');
    a.equal(result.calls.filter(call => call[0] === 'onReplay').length, 1, 'new round reports replay once');
    for (let step = 1; step <= 19; step++) result.shell.step(step);
    a.equal(clicks().length, before + 1, 'fresh round waits for its step threshold');
    result.shell.step(20);
    a.equal(clicks().length, before + 2, 'fresh round resets the automatic CTA latch');
  }
}
