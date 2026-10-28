import vm from 'node:vm';
import { originCtaBridge } from '../../core/lib/origin-playable.mjs';

// Execute the exact shared scripts used by preview and pack. Timers stay
// deterministic so a native Canvas CTA can cancel its pending background tap.
export function installOriginCta(context) {
  const timers = new Map();
  let id = 0;
  context.setTimeout = fn => { timers.set(++id, fn); return id; };
  context.clearTimeout = key => timers.delete(key);
  context.document.addEventListener ||= context.window.addEventListener;
  context.document.readyState ||= 'complete';
  context.document.hidden = false;
  for (const match of originCtaBridge({ cta: { endMask: false } }).matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) vm.runInContext(match[1], context);
  return {
    flush() { const pending = [...timers.values()]; timers.clear(); for (const fn of pending) fn(); },
    pointer(type, selector = 'canvas') {
      context.window.dispatchEvent({ type, pointerId: 1, target: { closest: selectors => selectors.split(',').includes(selector) ? {} : null } });
    },
  };
}
