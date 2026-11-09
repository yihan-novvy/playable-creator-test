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
      // this small image-name inventory separately for native label loading.
      var images = new Set(window.__ORIGIN_CONFIG__.localizedImages);
      function syncManager() {
        // This creative is the user's English template, as in layout.js.
        // Device language supplied by the host must not translate its content.
        manager.isMultilingual = false;
        manager.curLanguage = 'en';
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
      syncManager();
    }
  };
})();
