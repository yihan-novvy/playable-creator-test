import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../core/overlays/cta-bridge/cta-bridge.js', import.meta.url), 'utf8');

function bridge({ twoPhase = true, endMask = true, replayable = false } = {}) {
  const listeners = new Map(), clicks = [], phases = [], pointers = [];
  const window = {
    __novvyTwoPhase: twoPhase, __NOVVY_CTA_END_MASK__: endMask, __novvyReplayable: replayable,
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
    tap: () => pointers.forEach(listener => listener({ target: { closest: () => null } })),
    tapOn: selector => pointers.forEach(listener => listener({ target: { closest: s => (s.split(',').some(part => part.trim() === selector) ? { matches: selector } : null) } })) };
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
  // GO 闸门按钮(片头/片尾)不参与回访每击转化:点 GO 是继续漏斗进下一段,
  // 不是再跳一次商店——真机上 pointerdown 先跳店会打断 click,震动与换关全丢。
  const gate = bridge({ endMask: false });
  gate.emit('novvy:playable-complete');
  gate.tapOn('.novvy-intro-go');
  assert.equal(gate.clicks.length, 1, 'GO 触压不触发回访转化');
  gate.tap();
  assert.equal(gate.clicks.length, 2, 'GO 之外的触压照旧转化');
  // 可重玩回合(detail.replayable=true 且模板声明 __novvyReplayable)转化后
  // 不武装回访每击:用户从商店切回来继续玩/重开,触压保持纯游玩;不可重玩的
  // 结算回合(纯结尾卡)维持每击转化。
  const replay = bridge({ endMask: false, replayable: true });
  replay.emit('novvy:cta-moment', { replayable: true });
  replay.emit('novvy:playable-complete', { replayable: true });
  replay.emit('novvy:victory', { replayable: true });
  replay.tap();
  assert.equal(replay.clicks.map(click => click.scene), ['cta-moment'], '可重玩回合转化一次后，回访触压不再逐击转化');
  const finished = bridge({ endMask: false, replayable: true });
  finished.emit('novvy:playable-complete', { replayable: false });
  finished.tap();
  assert.equal(finished.clicks.map(click => click.scene), ['playable-complete', 'post-complete-interact'], '不可重玩的结算回合转化后回访触压照旧武装');
  // 显式资源交换(novvy:hint-refill):用户主动要资源的转化,绕过自动闩锁每次
  // 请求都跳,不武装回访每击;完成时的自动转化窗口不受影响。
  const refill = bridge({ endMask: false, replayable: true });
  refill.emit('novvy:hint-refill');
  refill.emit('novvy:hint-refill');
  refill.tap();
  assert.equal(refill.clicks.map(click => click.scene), ['hint-refill', 'hint-refill'], '提示用完的显式换条每次请求都转化，触压不抢跑');
  refill.emit('novvy:cta-moment', { replayable: true });
  assert.equal(refill.clicks.map(click => click.scene), ['hint-refill', 'hint-refill', 'cta-moment'], '资源交换不消耗完成时机的自动转化窗口');
  const plain = bridge({ endMask: false });
  plain.emit('novvy:hint-refill');
  assert.equal(plain.clicks.length, 0, '未声明重玩的模板不做资源交换转化');
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
