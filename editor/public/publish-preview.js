// Observational instrumentation added only to preview responses, never to exported ZIPs.
// It does not simulate an SDK, manufacture gameplay events, or acknowledge Tracking.
(function () {
  'use strict';
  var channel = __MONITOR_CHANNEL__;
  if (!channel) return;
  function serial(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch (_) { return String(value); }
  }
  function report(kind, name, payload) {
    window.parent.postMessage({ publishMonitor: channel, kind: kind, name: name, payload: serial(payload), ts: Date.now() }, '*');
  }
  ['log', 'warn', 'error'].forEach(function (name) {
    var original = console[name];
    console[name] = function () {
      report('console', name, Array.prototype.map.call(arguments, serial));
      return original.apply(this, arguments);
    };
  });
  window.addEventListener('error', function (event) {
    report('error', 'runtime_error', { message: event.message || '资源加载失败', file: event.filename || event.target?.src, line: event.lineno });
  }, true);
  window.addEventListener('unhandledrejection', function (event) { report('error', 'unhandledrejection', String(event.reason)); });
  // Legacy creatives can have nested engine frames. Forward only messages from our own children.
  window.addEventListener('message', function (event) {
    var own = false;
    for (var i = 0; i < window.frames.length; i++) if (window.frames[i] === event.source) own = true;
    if (!own || !event.data || typeof event.data !== 'object') return;
    if (event.data.type === 'novvy_sdk_event' || event.data.type === 'novvy_playable_event' || event.data.novvy === 'h5') {
      report('message', event.data.event || event.data.type, event.data);
    }
  });
  var wrapped = new WeakSet();
  function observe(object, name, kind) {
    if (!object || typeof object[name] !== 'function' || wrapped.has(object[name])) return;
    var original = object[name];
    var wrapper = function () {
      report(kind, name, Array.prototype.map.call(arguments, serial));
      return original.apply(this, arguments);
    };
    wrapped.add(wrapper);
    try { object[name] = wrapper; } catch (_) { /* Read-only SDKs still emit message/console evidence. */ }
  }
  function attach() {
    ['track', 'click', 'interaction'].forEach(function (name) { observe(window.NovvyAnalytics, name, 'analytics'); });
    ['open', 'click', 'request', 'useCustomClose'].forEach(function (name) { observe(window.novvy, name, 'sdk'); });
  }
  attach();
  var timer = setInterval(attach, 100);
  window.addEventListener('pagehide', function () { clearInterval(timer); });
  document.addEventListener('DOMContentLoaded', function () { attach(); report('preview', 'loaded', { title: document.title }); });
})();
