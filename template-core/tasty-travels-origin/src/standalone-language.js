(function () {
  'use strict';
  window.__TASTY_LANGUAGE__ = {
    install: function (requireModule) {
      var Game = requireModule('GameScript').default;
      var manager = requireModule('GameManager').GameManager;
      var languages = requireModule('LanguageCfg').LanguageCfg.language;
      var SetLabel = requireModule('SetLabel').default;
      var utils = requireModule('Utils').default;
      // Cocos consumes and removes config.json while loading. The build keeps
      // this small image-name inventory separately for later locale changes.
      var images = new Set(window.__ORIGIN_CONFIG__.localizedImages);
      function language() {
        var requested = window.ORIGIN_RUNTIME.env.language || navigator.language || 'en';
        var key = String(requested).toLowerCase().split(/[-_]/)[0];
        return Object.prototype.hasOwnProperty.call(languages, key) ? key : 'en';
      }
      function syncManager() {
        // The native component reads cc.sys when this flag is true. Resolve
        // from env here instead, including supported-language fallback.
        manager.isMultilingual = false;
        manager.curLanguage = language();
      }
      Game.prototype.setLanguage = function () {
        syncManager();
        this.languageName = manager.curLanguage;
        var words = languages[this.languageName];
        for (var i = 1; i <= 4; i++) {
          for (var side = 1; side <= 2; side++) {
            var label = this['tipLab' + i + '_' + side];
            if (label) label.string = words['tip' + i + 'Lab'];
          }
        }
        if (this.NextLab) this.NextLab.string = words.NextLab;
        if (this.NextLab2) this.NextLab2.string = words.NextLab;
      };
      SetLabel.prototype.onLoad = function () {
        syncManager();
        var label = this.node.getComponent(cc.Label);
        if (label) {
          var text = languages[manager.curLanguage][this.node.name] ?? languages.en[this.node.name];
          if (text !== undefined) label.string = text;
        } else if (this.node.getComponent(cc.Sprite)) {
          var name = this.node.name + '-' + manager.curLanguage;
          if (!images.has('images/' + name)) name = this.node.name + '-en';
          utils.setSpriteFrame(this.node, name);
        }
      };
      var previous = window.ORIGIN_RUNTIME.environmentChanged;
      window.ORIGIN_RUNTIME.environmentChanged = function (env, old) {
        if (previous) previous(env, old);
        if (env.language === old.language) return;
        syncManager();
        var game = Game.instance;
        if (game) game.setLanguage();
        var scene = cc.director.getScene();
        if (scene) scene.getComponentsInChildren(SetLabel).forEach(function (component) { component.onLoad(); });
      };
      syncManager();
    }
  };
})();
