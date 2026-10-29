(function () {
  'use strict';
  function hideDownload(game) {
    [game.scene, game.finalScreen].forEach(function (scene) {
      var button = scene && EditorRuntime.queryPath(scene, 'Cta');
      if (button) { button.visible = false; button.interactive = false; button.interactiveChildren = false; }
    });
  }
  function fitCards(game) {
    hideDownload(game);
    if (!game.field || game.field.isGameFinal) return;
    var host = document.getElementById('origin-game');
    var style = getComputedStyle(document.documentElement);
    var top = parseFloat(style.getPropertyValue('--origin-hud-space')) || 16;
    var bottom = parseFloat(style.getPropertyValue('--origin-cta-space')) || 132;
    var card = document.getElementById('novvy-cta');
    if (card && !card.hidden) bottom = Math.max(bottom, card.getBoundingClientRect().height + 8);
    var nodes = [game.field.tableau, game.field.foundations, game.field.emptySlots];
    function bounds() {
      var rects = nodes.map(function (node) { return node.getBounds(); });
      var left = Math.min.apply(Math, rects.map(function (r) { return r.x; }));
      var right = Math.max.apply(Math, rects.map(function (r) { return r.x + r.width; }));
      var top = Math.min.apply(Math, rects.map(function (r) { return r.y; }));
      var bottom = Math.max.apply(Math, rects.map(function (r) { return r.y + r.height; }));
      return { x: (left + right) / 2, y: (top + bottom) / 2, width: right - left, height: bottom - top };
    }
    var rect = bounds(), units = 1 / LayoutManager.scale;
    var ratio = Math.min(1, (host.clientWidth - 20) * units / rect.width, Math.max(100, host.clientHeight - top - bottom) * units / rect.height);
    game.field.scale.set(game.field.scale.x * ratio, game.field.scale.y * ratio);
    rect = bounds();
    var target = game.field.parent.toLocal(new PIXI.Point(host.clientWidth * units / 2, (top + host.clientHeight - bottom) * units / 2));
    var center = game.field.parent.toLocal(new PIXI.Point(rect.x, rect.y));
    game.field.position.x += target.x - center.x;
    game.field.position.y += target.y - center.y;
    if (game.field.tutorial) game.field.tutorial.onResize();
  }
  var p = MainWindow.prototype, resize = p.onResize, final = p.showFinalScene;
  p.onResize = function () { var value = resize.apply(this, arguments); fitCards(this); return value; };
  p.showFinalScene = function () { var value = final.apply(this, arguments); hideDownload(this); return value; };
})();
