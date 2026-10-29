(function () {
  'use strict';
  var installed = false;

  // Extend the existing scenery at its edges. The original table image and all
  // physics nodes keep their coordinates; only the camera changes the framing.
  function extendBackground(game, background, camera) {
    var sprite = background.getComponent(cc.Sprite), frame = sprite.spriteFrame;
    var rect = frame.getRect(), texture = frame.getTexture();
    var width = background.width * background.scaleX;
    var height = background.height * background.scaleY;
    var left = background.x - width / 2, bottom = background.y - height / 2;
    var visibleWidth = cc.winSize.width / camera.zoomRatio;
    var visibleHeight = cc.winSize.height / camera.zoomRatio;
    var x = [game.camera.x - visibleWidth / 2, left, left + width, game.camera.x + visibleWidth / 2];
    var y = [game.camera.y - visibleHeight / 2, bottom, bottom + height, game.camera.y + visibleHeight / 2];
    if (!background.__tastyEdges) background.__tastyEdges = {};
    for (var row = 0; row < 3; row++) for (var col = 0; col < 3; col++) {
      if (row === 1 && col === 1) continue;
      var key = row + ':' + col, node = background.__tastyEdges[key];
      if (!node) {
        node = new cc.Node('tasty-background-edge-' + key);
        node.parent = background;
        var edge = node.addComponent(cc.Sprite);
        edge.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        node.scaleX = col === 1 ? 1 : -1;
        node.scaleY = row === 1 ? 1 : -1;
        background.__tastyEdges[key] = node;
      }
      var w = x[col + 1] - x[col], h = y[row + 1] - y[row];
      node.active = w > 0 && h > 0;
      if (node.active) {
        var cropW = col === 1 ? rect.width : Math.min(w / background.scaleX, 64);
        var cropH = row === 1 ? rect.height : Math.min(h / background.scaleY, 64);
        node.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(texture, cc.rect(
          rect.x + (col === 2 ? rect.width - cropW : 0),
          rect.y + (row === 0 ? rect.height - cropH : 0), cropW, cropH));
        node.width = w / background.scaleX;
        node.height = h / background.scaleY;
        node.x = ((x[col] + x[col + 1]) / 2 - background.x) / background.scaleX;
        node.y = ((y[row] + y[row + 1]) / 2 - background.y) / background.scaleY;
      }
    }
  }

  function layout(game) {
    game.downLoadBtn.active = false;
    game.downLoadBtnH.active = false;
    var style = getComputedStyle(document.documentElement);
    var top = parseFloat(style.getPropertyValue('--tasty-hud-space')) || 0;
    var bottom = parseFloat(style.getPropertyValue('--tasty-cta-space')) || 0;
    var card = document.getElementById('novvy-cta');
    if (card && !card.hidden) bottom = Math.max(bottom, card.getBoundingClientRect().height + 8);
    var height = document.getElementById('origin-game').clientHeight;
    var camera = game.camera.getComponent(cc.Camera);
    var ratio = Math.max(0.25, (height - top - bottom) / height);
    camera.zoomRatio *= ratio;
    game.camera.y += (top - bottom) * cc.winSize.height / height / (2 * camera.zoomRatio);
    // The source has a second camera for its counters, logo and merge guide.
    game.canvas.getComponentsInChildren(cc.Camera).forEach(function (other) {
      other.zoomRatio = camera.zoomRatio;
      other.node.y = game.camera.y;
    });
    extendBackground(game, game.bg.active ? game.bg : game.bg1, camera);

    // Widgets are positioned against the full Canvas. Bring the native counters
    // into the visible camera area while preserving their original edge gaps.
    [game.coinUI, game.coinUI2, game.nextToolSp.parent, game.nextToolSp2.parent, game.logo].forEach(function (node) {
      var widget = node.getComponent(cc.Widget);
      if (!widget) return;
      if (!node.__tastyWidget) node.__tastyWidget = { left: widget.left, right: widget.right, top: widget.top, bottom: widget.bottom };
      var margin = cc.winSize.width * (1 - 1 / camera.zoomRatio) / 2;
      widget.left = node.__tastyWidget.left + margin;
      widget.right = node.__tastyWidget.right + margin;
      var units = cc.winSize.height / height / camera.zoomRatio;
      widget.top = cc.winSize.height / 2 - game.camera.y - (height / 2 - top) * units + node.__tastyWidget.top;
      widget.bottom = cc.winSize.height / 2 + game.camera.y + (bottom - height / 2) * units + node.__tastyWidget.bottom;
      widget.updateAlignment();
    });
  }

  window.__TASTY_LAYOUT__ = {
    install: function (requireModule) {
      if (installed) return;
      installed = true;
      var p = requireModule('GameScript').default.prototype;
      var sound = requireModule('SoundManager').SoundManager;
      requireModule('GameManager').GameManager.canPlayAudio = true;
      var originalBgm = p.playBgm;
      p.playBgm = function () {
        if (sound.effectList.has('bgm') && sound.effectList.has('bgm2')) {
          this.node.off(cc.Node.EventType.TOUCH_START, this.playBgm, this);
          return;
        }
        return originalBgm.apply(this, arguments);
      };
      var originalLayout = p.changeLV;
      p.changeLV = function () { var result = originalLayout.apply(this, arguments); layout(this); return result; };
      ['game1_Start', 'game1_Move', 'game1_End'].forEach(function (name) {
        var original = p[name];
        p[name] = function (event) {
          if (!event || !event.touch) return original.apply(this, arguments);
          var touch = event.touch, getLocation = touch.getLocation;
          var camera = this.camera.getComponent(cc.Camera);
          touch.getLocation = function () { return camera.getScreenToWorldPoint(getLocation.call(touch)); };
          try { return original.apply(this, arguments); }
          finally { touch.getLocation = getLocation; }
        };
      });
    }
  };
})();
