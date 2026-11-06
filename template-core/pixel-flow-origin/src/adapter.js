// Hooks verified against the frozen Luna build. Shots and animations are not
// steps; only a successful user-initiated reservation on the conveyor is one.
function installPixelFlow(w, root, shell, getEnv, running, finish, pixelCount) {
  let removed=0, placement=null, integration=null, cameraBase=null;
  const dead=new WeakSet();
  function wrap(type, name, callback) {
    const original=type?.prototype?.[name];
    if(typeof original!=='function')throw new Error('Pixel Flow callback missing: '+name);
    type.prototype[name]=function(...args){return callback.call(this,original,args);};
  }
  const game=w.Loom.Game, playable=w.Loom.Playables;
  w.Luna.Unity.Playable.InstallFullGame=function(){};
  w.Luna.Unity.LifeCycle.GameEnded=function(){};
  for(const key of Object.keys(w.Luna.Unity.Analytics))if(key.startsWith('Log'))w.Luna.Unity.Analytics[key]=function(){};
  playable.InstallHelper.InstallFullGame=function(){};
  playable.DownloadGameButton.prototype.OnClick=function(){};
  playable.PlayableIntegration.prototype.UpdateClicksAndSecondsToEnd=function(){};
  playable.PlayableIntegration.prototype.OpenStore=function(){};
  wrap(playable.DownloadGameButton,'Awake',function(original,args){
    // The user chose the shared shell card in place of the native button.
    this.gameObject.SetActive(false);
  });
  wrap(playable.PlayableIntegration,'Start',function(original,args){
    integration=this;
    const nativeButton=w.pc.Application.getApplication().root.findByName('Play Now Button');
    if(nativeButton)nativeButton.enabled=false;
    return original.apply(this,args);
  });
  wrap(game.Map.MapController,'OnTapShooter',function(original,args){
    if(!running())return;
    const previous=placement, current={accepted:false};placement=current;
    try{return original.apply(this,args);}finally{
      placement=previous;
      if(current.accepted&&running())shell.step(Math.min(100,removed/pixelCount*100));
    }
  });
  wrap(game.Map.MapEventsData,'TriggerShootersWillBePlacedToConveyor',function(original,args){
    if(placement&&args[0]?.Count>0)placement.accepted=true;
    return original.apply(this,args);
  });
  wrap(game.PixelImages.PixelGridDamageController,'OnPixelDamaged',function(original,args){
    const value=original.apply(this,args),pixel=args[0];
    if(pixel.IsDead&&!dead.has(pixel)){dead.add(pixel);removed++;}
    return value;
  });
  wrap(playable.PlayableIntegration,'OnGameWin',function(original,args){const value=original.apply(this,args);finish('win');return value;});
  wrap(playable.PlayableIntegration,'OnGameOver',function(original,args){const value=original.apply(this,args);finish('fail');return value;});
  return function layout(){
    const entity=w.pc.Application.getApplication().root.findByName('Gameplay Main Camera');
    const camera=entity?.camera;
    if(!camera)return;
    const env=getEnv(),height=root.clientHeight,width=root.clientWidth;
    if(!height||!width)return;
    if(!cameraBase)cameraBase={camera,size:camera.orthoHeight,position:entity.getLocalPosition().clone()};
    const top=Math.max(Number(env.safeArea?.top)||0,Number(env.insets?.top)||0);
    const bottom=Math.max(Number(env.safeArea?.bottom)||0,Number(env.insets?.bottom)||0);
    const available=Math.max(height*.35,height-top-bottom);
    // The original framing includes the offscreen queue tail. Fit the board,
    // five holding slots and the first playable rows inside the shell insets.
    const size=Math.max(cameraBase.size*.8*height/available,4.3*height/Math.max(100,width-24));
    camera.orthoHeight=size;
    const position=cameraBase.position.clone();position.y+=(top-bottom)*size/height;
    entity.setLocalPosition(position);
    if(integration){
      const logo=w.pc.Application.getApplication().root.findByName('Pixel Flow Logo');
      if(logo)logo.enabled=!(env.insets?.top>0);
    }
  };
}
