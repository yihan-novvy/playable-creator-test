import vm from 'node:vm';
import { fixedViewportHtml } from '../core/lib/fixed-viewport.mjs';

export default async function run(assert) {
  const html = fixedViewportHtml(`<html><head><meta charset="utf-8"><meta content='width=900,initial-scale=.5,user-scalable=yes,viewport-fit=cover' name='viewport'><meta NAME="VIEWPORT" content="maximum-scale=9"></head><body><canvas></canvas></body></html>`);
  assert.equal((html.match(/name="viewport"/g) || []).length, 1, '冲突的 viewport 合并为唯一设置');
  assert.check(html.includes('width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover'), '固定倍率，并保留安全区配置');
  assert.check(html.includes('<meta charset="utf-8">') && html.includes('<canvas></canvas>'), '保留原有编码和游戏内容');
  assert.equal(fixedViewportHtml(html), html, '重复合成不增加重复监听器或标签');
  assert.check(fixedViewportHtml('<html><head></head><body></body></html>').includes('user-scalable=no'), '没有 viewport 的模板也固定视口');
  const listeners = new Map();
  vm.runInNewContext(html.match(/<script data-novvy-fixed-viewport>([\s\S]*?)<\/script>/)[1], {
    document: { addEventListener: (type, fn, options) => listeners.set(type, { fn, options }) },
  });
  let prevented = 0;
  const event = count => ({ touches: Array(count).fill({}), cancelable: true, preventDefault: () => prevented++ });
  listeners.get('touchstart').fn(event(1));listeners.get('touchmove').fn(event(1));
  assert.equal(prevented, 0, '单指点击和拖动不会被拦截');
  listeners.get('touchstart').fn(event(2));listeners.get('touchmove').fn(event(2));
  assert.equal(prevented, 2, '双指开始和移动均禁止浏览器默认缩放');
  listeners.get('gesturestart').fn(event(2));listeners.get('gesturechange').fn(event(2));
  assert.equal(prevented, 4, 'WebKit 手势缩放也被拦截');
  assert.check([...listeners.values()].every(({options}) => options.capture && options.passive === false), '手势拦截可调用 preventDefault 且先于游戏监听器');
  assert.check(html.includes('touch-action:pan-x pan-y!important'), '公共触摸区域排除 pinch-zoom');
}
