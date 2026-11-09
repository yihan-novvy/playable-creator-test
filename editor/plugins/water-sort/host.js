// Production editor assembly; the same standalone game is used by ZIP export.
(function () {
  const config = window.WATER_HOST_CONFIG;
  let instance, entered = !config.intro, started = false, viewable = true, generation = 0;
  const emit = (name, detail) => window.dispatchEvent(new CustomEvent('novvy:' + name, {detail}));
  const muted = new URLSearchParams(location.search).get('muted') === '1';
  const environment = () => {
    const root = document.getElementById('scene'), hud = document.getElementById('novvy-training-hud'), card = document.getElementById('novvy-cta');
    return {muted, language:navigator.language, platform:'web', viewport:{width:root.clientWidth,height:root.clientHeight,dpr:devicePixelRatio},
      insets:{top:hud ? hud.getBoundingClientRect().bottom + 8 : 0,bottom:card ? card.offsetHeight + 8 : 0}};
  };
  function sync() {
    if (!instance) return;
    instance.setEnv(environment());
    if (!entered || document.hidden || !viewable) instance.pause();
    else if (!started) { started = true; instance.start(); }
    else instance.resume();
  }
  window.NovvyGame = function (entry) {
    async function boot() {
      const root = document.createElement('div');
      root.style.cssText = 'position:absolute;inset:0';
      document.getElementById('scene').prepend(root);
      if (document.getElementById('novvy-dom-bg')) root.style.setProperty('--water-game-background','transparent');
      // The standalone creative has no game-owned footer or level selector.
      document.getElementById('hud').style.display = 'none';
      const shell = {
        step(percent) { emit('hud-progress',{percent}); },
        win() { document.getElementById('win').hidden = config.cta; emit('victory',{}); },
        fail() {}, end() { window.NovvyPlayable?.endStage(); },
        retry() { emit('hud-progress',{percent:0}); window.NovvyPlayable?.onReplay(); },
        sound() {}, haptic() {}, level() {},
      };
      async function create(replay = false) {
        const token = ++generation;
        instance?.destroy(); instance = null; started = false;
        document.getElementById('win').hidden = true;
        try {
          const game = await entry(root,shell,{base:'',env:environment(),config:{},allowReplay:true});
          if (token !== generation) { game.destroy(); return; }
          instance = game;
          if (replay) shell.retry(); else emit('hud-progress',{percent:0});
          document.getElementById('reset').disabled = false;
          sync();
        } catch (error) { document.getElementById('status').textContent = error.message; console.error(error); }
      }
      for (const id of ['reset','again']) document.getElementById(id).onclick = () => create(true);
      await create();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  };
  window.addEventListener('novvy:intro-finished',() => { entered = true; sync(); });
  window.addEventListener('novvy:viewablechange',event => { viewable = !!event.detail.viewable; sync(); });
  window.addEventListener('resize',sync);
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('pagehide',() => { generation++; instance?.destroy(); });
})();
