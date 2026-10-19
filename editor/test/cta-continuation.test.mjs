import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../core/overlays/cta-bridge/cta-bridge.js', import.meta.url), 'utf8');

function bridge({ twoPhase = true, endMask = true } = {}) {
  const listeners = new Map(), clicks = [], phases = [], pointers = [];
  const window = {
    __novvyTwoPhase: twoPhase, __NOVVY_CTA_END_MASK__: endMask,
    NovvyPlayable: { click: detail => clicks.push(detail) },
    addEventListener(name, listener) { listeners.set(name, [...listeners.get(name) || [], listener]); },
    dispatchEvent(event) { for (const listener of listeners.get(event.type) || []) listener(event); },
  };
  window.addEventListener('novvy:cta-card', event => phases.push(event.detail.phase));
  const document = { hidden: false, readyState: 'complete', getElementById: () => null,
    addEventListener(name, listener) { if (name === 'pointerdown') pointers.push(listener); } };
  vm.runInNewContext(source, { window, document, console: { log() {} }, Date, setTimeout, clearTimeout,
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } } });
  return { clicks, phases, emit: (type, detail) => window.dispatchEvent({ type, detail }),
    tap: () => pointers.forEach(listener => listener({ target: { closest: () => null } })) };
}

export default async function run(assert) {
  for (const endMask of [true, false]) {
    const first = bridge({ endMask });
    first.emit('novvy:playable-complete', { continuing: true });
    first.emit('novvy:victory', { continuing: true });
    first.tap();
    assert.equal(first.clicks.length, 0, '过渡段完成不自动转化，也不武装回访触压转化');
    assert.equal(first.phases, ['bar'], '过渡段只显示底卡，不出现全屏接管');
    first.emit('novvy:cta-interact');
    assert.equal(first.clicks.map(click => click.click_source), ['cta_click'], '过渡段仍可手动点击下载卡');
    first.emit('novvy:victory', { continuing: true, ctaBeforeContinue: true });
    first.emit('novvy:victory', { continuing: true, ctaBeforeContinue: true });
    first.tap();
    assert.equal(first.clicks.map(click => click.scene), ['cta-card', 'victory'], '首段庆祝结束后只自动跳转一次，返回视频不会因触压再次转化');
    assert.equal(first.phases, ['bar'], '首段庆祝后的转化不弹结束遮罩');
    first.emit('novvy:phase2-start');
    first.emit('novvy:cta-moment');
    first.emit('novvy:victory');
    assert.equal(first.clicks.map(click => click.scene), ['cta-card', 'victory', 'cta-moment'], '末关有自己的转化窗口且不重复');
    assert.equal(first.phases, endMask ? ['bar', 'takeover'] : ['bar'], '末关仍遵守结束遮罩配置');
  }
  // 步数循环素材(detail.everySteps>0):首跳建立转化窗口,循环间隔逐次转化;
  // 回访触压不再武装(节奏由步数驱动);完成兜底不重复跳转,但回访触压照旧。
  const loop = bridge({ endMask: false });
  loop.emit('novvy:cta-moment', { everySteps: 5 });
  loop.emit('novvy:cta-moment', { everySteps: 5, repeat: true });
  loop.emit('novvy:cta-moment', { everySteps: 5, repeat: true });
  loop.tap();
  assert.equal(loop.clicks.map(click => click.scene), ['cta-moment', 'cta-moment', 'cta-moment'], '步数循环素材按间隔逐次转化，触压不抢跑');
  assert.equal(loop.phases, ['bar'], '循环转化不重复亮卡');
  const loopFallback = bridge({ endMask: false });
  loopFallback.emit('novvy:cta-moment', { everySteps: 5 });
  loopFallback.emit('novvy:playable-complete');
  loopFallback.emit('novvy:victory');
  loopFallback.tap();
  assert.equal(loopFallback.clicks.map(click => click.scene), ['cta-moment', 'post-complete-interact'], '循环素材完成兜底不重复跳转，完成后的回访触压照旧武装');
  for (const continuing of [undefined, false]) {
    const legacy = bridge({ twoPhase: false });
    legacy.emit('novvy:playable-complete', { continuing });
    legacy.emit('novvy:victory', { continuing });
    assert.equal(legacy.clicks.map(click => click.scene), ['playable-complete'], '未声明过渡的模板仍在完成时转化一次');
  }
  const victoryOnly = bridge({ twoPhase: false });
  victoryOnly.emit('novvy:victory');
  assert.equal(victoryOnly.clicks.map(click => click.scene), ['victory'], '旧模板只发 victory 仍正常自动转化');
}
