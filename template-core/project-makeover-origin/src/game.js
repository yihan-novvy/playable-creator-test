NovvyGame(function(container,shell,options){
  options=options||{};
  const view=engineRoot(container,SOURCE.markup,SOURCE.css);
  const scope=createEngineScope(view.root);
  scope.window.PM_CONTEXT={shell,env:options.env||{},root:view.root,scope};
  return Promise.resolve(scope.run(SOURCE.engine)).then(runtime=>({
    start:()=>runtime.start(),pause:()=>runtime.pause(),resume:()=>runtime.resume(),
    setEnv:patch=>runtime.setEnv(patch),
    destroy(){runtime.destroy();scope.dispose();view.mount.remove();}
  })).catch(error=>{scope.dispose();view.mount.remove();throw error;});
});
