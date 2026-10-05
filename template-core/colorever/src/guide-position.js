// Use the same camera state as rendering, even before the first WebGL frame.
export function guidePosition(point,camera,canvasRect,containerRect){
  if(!canvasRect.width||!canvasRect.height||!containerRect.width||!containerRect.height)return null;
  camera.updateWorldMatrix(true,false);
  const projected=point.clone().project(camera);
  const x=canvasRect.left+(projected.x+1)*.5*canvasRect.width;
  const y=canvasRect.top+(1-projected.y)*.5*canvasRect.height;
  return {left:(x-containerRect.left)/containerRect.width*100,top:(y-containerRect.top)/containerRect.height*100};
}
