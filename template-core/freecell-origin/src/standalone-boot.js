var PLATFORM = 'web';
var callSDK = function (action) {
  if (action === 'download' && window.__ORIGIN_ADAPTER__) window.__ORIGIN_ADAPTER__.cta(true, 'native-cta');
};
(function () {
  var launched = false, preparing = true;
  var host = document.getElementById('origin-game');
  window.ORIGIN_RUNTIME.lifecycle = lifecycle;
  function viewable() { return preparing || !window.ORIGIN_RUNTIME.paused; }
  function audio() {
    Howler.mute(preparing || !launched || !viewable() || window.ORIGIN_RUNTIME.env.muted === true);
  }
  function fit() { if (launched) LayoutManager.fitLayout(); }
  function lifecycle() {
    if (!launched || !Game.app) return;
    if (viewable()) Game.resume(); else Game.pause();
    audio();
  }
  LayoutManager.resizeBody = false;
  LayoutManager.getScreenWidth = function () { return host.clientWidth; };
  LayoutManager.getScreenHeight = function () { return host.clientHeight; };
  Howler.mute(true);
  document.addEventListener('pointerdown', function () {
    if (!launched) return;
    SoundsManager.unlock(); audio();
  }, true);
  document.addEventListener('visibilitychange', lifecycle);
  window.addEventListener('origin:viewablechange', lifecycle);
  window.addEventListener('resize', fit);
  function launch() {
    if (launched) return;
    launched = true;
    audio();
    Game.init(host);
    Game.on('preloadComplete', function(){
      // Native preloadComplete precedes the deal animation. Report readiness
      // only once the actual cards have reached their original board positions.
      function firstBoard() {
        if (window.ORIGIN_RUNTIME.destroyed) return;
        var field=Game.currentWindow && Game.currentWindow.field;
        var cards=field && field.tableau.cardsArr;
        if (!cards || !cards.length || !cards.every(function(card){return card.alpha>=.999 && Number.isFinite(card.initX) && Math.abs(card.x-card.initX)<.1 && Math.abs(card.y-card.initY)<.1;})) {
          requestAnimationFrame(firstBoard); return;
        }
        requestAnimationFrame(function(){preparing=false;lifecycle();window.ORIGIN_RUNTIME.ready();});
      }
      lifecycle();requestAnimationFrame(firstBoard);
    });
    fit();
    lifecycle();
  }
  if (window.__ORIGIN_ADAPTER__) {
    window.__ORIGIN_ADAPTER__.start(launch);
  } else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', launch, { once: true });
  else launch();
})();

window.Howler=Howler;window.ORIGIN_RUNTIME.dispose=function(){Game.pause();Game.app?.destroy(true,{children:true,texture:true,baseTexture:true});};
