(function () {
  'use strict';
  var installed = false;

  function guideNode(name, parent, group) {
    var node = new cc.Node(name);
    node.parent = parent;
    node.groupIndex = group;
    return node;
  }

  function positionGuide(game) {
    var guide = game.__tastyGuide;
    if (!guide || !guide.active || !game.tool) return;
    var sprite = game.tool.getChildByName('sp');
    var center = sprite.convertToWorldSpaceAR(cc.v2(0, 0));
    guide.setPosition(guide.parent.convertToNodeSpaceAR(center));
    // The native sprite is offset for transparent padding. The visible glass
    // and aiming line share the tool's x axis, which must bisect the arrow.
    var axis = game.tool.convertToWorldSpaceAR(cc.v2(0, sprite.y));
    guide.getChildByName('drag-arrows').setPosition(guide.convertToNodeSpaceAR(axis));
    // Anchor at the fingertip, so the tap pulse never slides off the glass.
    var touch = sprite.convertToWorldSpaceAR(cc.v2(0, -sprite.height * 0.2));
    game.hand.setPosition(game.hand.parent.convertToNodeSpaceAR(touch));
  }

  function arrowArtwork(length) {
    // One continuous white arrow sits behind the glass, as in the reference.
    // Fine amber edges and a soft halo stay crisp at phone size.
    var canvas = document.createElement('canvas');
    canvas.width = Math.ceil(length * 2 + 64) * 3;
    canvas.height = 96 * 3;
    var ctx = canvas.getContext('2d');
    ctx.scale(3, 3);
    ctx.translate(canvas.width / 6, 48);
    ctx.beginPath();
    ctx.moveTo(-length + 22, -5);
    ctx.lineTo(length - 22, -5);
    ctx.lineTo(length - 22, -15);
    ctx.quadraticCurveTo(length - 22, -18, length - 19, -16);
    ctx.lineTo(length - 1, -2);
    ctx.quadraticCurveTo(length + 2, 0, length - 1, 2);
    ctx.lineTo(length - 19, 16);
    ctx.quadraticCurveTo(length - 22, 18, length - 22, 15);
    ctx.lineTo(length - 22, 5);
    ctx.lineTo(-length + 22, 5);
    ctx.lineTo(-length + 22, 15);
    ctx.quadraticCurveTo(-length + 22, 18, -length + 19, 16);
    ctx.lineTo(-length + 1, 2);
    ctx.quadraticCurveTo(-length - 2, 0, -length + 1, -2);
    ctx.lineTo(-length + 19, -16);
    ctx.quadraticCurveTo(-length + 22, -18, -length + 22, -15);
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255, 194, 39, .65)';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = '#fffdf0';
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#efa719';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = '#fffef7';
    ctx.fill();
    var texture = new cc.Texture2D();
    texture.initWithElement(canvas);
    texture.handleLoadedTexture();
    return { texture: texture, frame: new cc.SpriteFrame(texture), width: canvas.width / 3, height: canvas.height / 3 };
  }

  function showGuide(game) {
    var tool = game.tool, sprite = tool.getChildByName('sp');
    var width = sprite.width * tool.scaleX, height = sprite.height * tool.scaleY;
    var guide = guideNode('tasty-drag-guide', game.itemParent.parent, tool.groupIndex);
    game.__tastyGuide = guide;
    // Keep decorations out of itemParent: its children are counted by physics.
    guide.zIndex = game.itemParent.zIndex;
    guide.setSiblingIndex(game.itemParent.getSiblingIndex());
    var glow = guideNode('glass-glow', guide, tool.groupIndex);
    var light = glow.addComponent(cc.Graphics), radius = Math.max(width, height) * 0.42;
    for (var i = 12; i > 0; i--) {
      light.fillColor = cc.color(255, 211, 65, 9);
      light.circle(0, 0, radius + i * 2.3);
      light.fill();
    }
    light.lineWidth = 3;
    light.strokeColor = cc.color(255, 248, 190, 230);
    light.circle(0, 0, radius);
    light.stroke();
    light.lineWidth = 2;
    light.strokeColor = cc.color(255, 213, 75, 190);
    light.circle(0, 0, radius + 6);
    light.stroke();
    cc.tween(glow).to(.8, { opacity: 165, scale: 1.06 }).to(.8, { opacity: 255, scale: 1 }).union().repeatForever().start();

    var arrows = guideNode('drag-arrows', guide, tool.groupIndex);
    // Match the visible glass rather than its transparent sprite margins.
    var reach = Math.min(124, Math.max(104, width * 1.45));
    var art = arrowArtwork(reach);
    game.__tastyArrowArt = art;
    var arrowSprite = arrows.addComponent(cc.Sprite);
    arrowSprite.spriteFrame = art.frame;
    arrowSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    arrows.width = art.width;
    arrows.height = art.height;
    cc.tween(arrows).to(.9, { scaleX: 1.025, opacity: 235 }, { easing: 'sineInOut' })
      .to(.9, { scaleX: 1, opacity: 255 }, { easing: 'sineInOut' }).union().repeatForever().start();
    var ghostScale = Math.min(1, 80 / Math.max(width, height));
    [-1, 1].forEach(function (side) {
      var ghost = guideNode('glass-preview-' + side, guide, tool.groupIndex);
      var image = ghost.addComponent(cc.Sprite);
      image.spriteFrame = sprite.getComponent(cc.Sprite).spriteFrame;
      image.sizeMode = cc.Sprite.SizeMode.CUSTOM;
      ghost.width = width * ghostScale;
      ghost.height = height * ghostScale;
      ghost.x = side * (reach + ghost.width * .5);
      ghost.opacity = 75;
    });

    cc.Tween.stopAllByTarget(game.hand);
    var finger = game.hand.getChildByName('hand');
    finger.anchorX = .08;
    finger.anchorY = .96;
    finger.setPosition(0, 0);
    game.hand.scale = .84;
    game.hand.zIndex = 1000;
    positionGuide(game);
    cc.tween(game.hand).to(.35, { scale: .8 }).to(.35, { scale: .84 }).delay(.5).union().repeatForever().start();
  }

  function hideGuide(game) {
    if (!game.__tastyGuide) return;
    game.__tastyGuide.active = false;
    game.hand.active = false;
    cc.Tween.stopAllByTarget(game.hand);
    cc.Tween.stopAllByTarget(game.__tastyGuide.getChildByName('glass-glow'));
    cc.Tween.stopAllByTarget(game.__tastyGuide.getChildByName('drag-arrows'));
    // The native post-drop ghost competes with the new, explicit drag hint.
    cc.Tween.stopAllByTarget(game.beikeTeach);
    game.beikeTeach.active = false;
  }

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
    var portrait = cc.view.getCanvasSize().height >= cc.view.getCanvasSize().width;
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
      // In portrait the native counters flank the island; the custom title sits
      // below it. Their position is independent of the gameplay camera inset.
      widget.top = portrait && node !== game.logo
        ? cc.winSize.height / 2 - game.camera.y - (height / 2 - 16) * units
        : cc.winSize.height / 2 - game.camera.y - (height / 2 - top) * units + node.__tastyWidget.top;
      widget.bottom = cc.winSize.height / 2 + game.camera.y + (bottom - height / 2) * units + node.__tastyWidget.bottom;
      widget.updateAlignment();
    });
    positionGuide(game);
  }

  window.__TASTY_LAYOUT__ = {
    install: function (requireModule) {
      if (installed) return;
      installed = true;
      var p = requireModule('GameScript').default.prototype;
      var sound = requireModule('SoundManager').SoundManager;
      var manager = requireModule('GameManager').GameManager;
      manager.canPlayAudio = true;
      // SetLabel uses these settings for the original order1-en/order2-en art.
      // GameScript has its own locale lookup, so pin its labels separately too.
      manager.isMultilingual = false;
      manager.curLanguage = 'en';
      var english = requireModule('LanguageCfg').LanguageCfg.language.en;
      p.setLanguage = function () {
        this.languageName = 'en';
        for (var i = 1; i <= 4; i++) {
          this['tipLab' + i + '_1'].string = english['tip' + i + 'Lab'];
          this['tipLab' + i + '_2'].string = english['tip' + i + 'Lab'];
        }
        this.NextLab.string = english.NextLab;
        this.NextLab2.string = english.NextLab;
      };
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
      var originalStart = p.gameStart;
      p.gameStart = function () { var result = originalStart.apply(this, arguments); showGuide(this); return result; };
      var originalDestroy = p.onDestroy;
      p.onDestroy = function () {
        if (this.__tastyArrowArt) {
          this.__tastyArrowArt.frame.destroy();
          this.__tastyArrowArt.texture.destroy();
          this.__tastyArrowArt = null;
        }
        if (originalDestroy) return originalDestroy.apply(this, arguments);
      };
      ['game1_Start', 'game1_Move', 'game1_End'].forEach(function (name) {
        var original = p[name];
        p[name] = function (event) {
          if (!event || !event.touch) return original.apply(this, arguments);
          var touch = event.touch, getLocation = touch.getLocation;
          var camera = this.camera.getComponent(cc.Camera);
          touch.getLocation = function () { return camera.getScreenToWorldPoint(getLocation.call(touch)); };
          try {
            var result = original.apply(this, arguments);
            if (name === 'game1_End' || !this.hand || !this.hand.active) hideGuide(this);
            return result;
          }
          finally { touch.getLocation = getLocation; }
        };
      });
    }
  };
})();
