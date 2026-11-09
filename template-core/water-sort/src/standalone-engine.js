import {createGame} from './create-game.js';

window.createWaterSort = function(host, shell, initialEnv, level) {
  let env=initialEnv,started=false,paused=true,finished=false,moves=0;
  const game=createGame({host,level,autoStart:false,ui:{onState(state){
    if(!started||paused||finished||state.busy||state.moves<=moves)return;
    moves=state.moves;shell.step(state.sorted/state.colors*100);
    if(state.won){finished=true;shell.win();}
  }}});
  function setEnv(patch){
    env={...env,...patch};game.setMuted(env.muted===true);
    const height=host.clientHeight||env.viewport?.height||1;
    game.resize(Object.fromEntries(['top','bottom'].map(key=>[key,Math.min(.35,Math.max(0,env.insets?.[key]||0,env.safeArea?.[key]||0)/height)])));
  }
  setEnv(env);
  return {
    start(){if(started)return;started=true;paused=false;game.start();},
    pause(){paused=true;game.pause();},
    resume(){if(!started)return;paused=false;game.resume();},
    setEnv,destroy(){game.destroy();}
  };
};
