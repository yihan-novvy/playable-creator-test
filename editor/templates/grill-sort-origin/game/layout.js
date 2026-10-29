(function () {
  'use strict';
  var patched = new WeakSet();
  function reset(game) {
    var widget = game.node.getComponent('cc.Widget');
    if (widget) widget.enabled = false;
    game.node.setScale(1, 1, 1);
    game.node.setPosition(0, 0, 0);
  }
  function fit(game) {
    var host = document.getElementById('origin-game');
    var style = getComputedStyle(document.documentElement);
    var top = parseFloat(style.getPropertyValue('--origin-hud-space')) || 70;
    var bottom = parseFloat(style.getPropertyValue('--origin-cta-space')) || 132;
    var card = document.getElementById('novvy-cta');
    if (card && !card.hidden) bottom = Math.max(bottom, card.getBoundingClientRect().height + 8);
    var size = cc.view.getVisibleSize(), units = size.height / host.clientHeight;
    var rects = [];
    function collect(node) {
      if (!node.active) return;
      var ui = node.getComponent('cc.UITransform');
      if (ui && node.getComponent('cc.Sprite')) rects.push(ui.getBoundingBoxToWorld());
      node.children.forEach(collect);
    }
    game.m_container.children.forEach(collect);
    if (!rects.length) return;
    var left = Math.min.apply(Math, rects.map(function (r) { return r.x; }));
    var right = Math.max.apply(Math, rects.map(function (r) { return r.x + r.width; }));
    var low = Math.min.apply(Math, rects.map(function (r) { return r.y; }));
    var high = Math.max.apply(Math, rects.map(function (r) { return r.y + r.height; }));
    var scale = Math.min(1, (host.clientWidth - 20) * units / (right - left), Math.max(100, host.clientHeight - top - bottom) * units / (high - low));
    var canvas = game.node.parent.worldPosition;
    game.node.setScale(scale, scale, 1);
    game.node.setPosition(size.width / 2 - canvas.x - ((left + right) / 2 - canvas.x) * scale,
      (bottom + host.clientHeight - top) * units / 2 - canvas.y - ((low + high) / 2 - canvas.y) * scale, 0);
    game.itemWscale = game.getBoxComp(0)._items[0].node.worldScale.x;
    if (game.inGuide) game.dealGuidePos();
    var timer = game.node.parent.getChildByName('time');
    if (timer) {
      var widget = timer.getComponent('cc.Widget');
      if (widget) widget.enabled = false;
      // The native clock extends 160 units left of the timer's origin.
      // Keep its entire 280-unit group beside the centered Dynamic Island.
      var timerScale = Math.min(0.6, (host.clientWidth / 2 - 83) * units / 280);
      timer.setScale(timerScale, timerScale, 1);
      timer.setPosition(-size.width / 2 + 8 * units + 160 * timerScale, size.height / 2 - 31 * units, 0);
    }
  }
  function patch(name, value) {
    if (typeof value !== 'function' || patched.has(value)) return;
    patched.add(value);
    var p = value.prototype;
    if (name === 'Game') {
      var layout = p.dealBoardPos;
      p.dealBoardPos = function () { reset(this); var out = layout.apply(this, arguments); fit(this); return out; };
    } else if (name === 'Main') {
      var show = p.showRes;
      p.showRes = function () { var out = show.apply(this, arguments); this.node.getChildByPath('endUI/button').active = false; return out; };
    } else if (name === 'KWGame') {
      var init = p.init;
      p.init = function () { var out = init.apply(this, arguments); this.enableAudio = true; return out; };
    }
  }
  window.__GRILL_LAYOUT__ = {
    install: function (system) {
      var register = system.register;
      system.register = function (id, deps, declare) {
        if (typeof id !== 'string' || !/^chunks:\/\/\/_virtual\/(Game|Main|KWGame)\.ts$/.test(id)) return register.apply(this, arguments);
        return register.call(this, id, deps, function (publish, context) {
          return declare(function (name, value) { patch(name, value); return publish(name, value); }, context);
        });
      };
    }
  };
})();
