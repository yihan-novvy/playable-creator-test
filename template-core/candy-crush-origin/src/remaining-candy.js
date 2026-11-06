// Longer rounds can leave every remaining candy on the back. After the original
// spin settles, turn one forward only if no remaining candy can be raycast.
function remainingCandyTurn(ball,camera,raycaster){
  ball.updateWorldMatrix(true,true);camera.updateWorldMatrix(true,false);
  const candies=ball.children.filter(node=>node.visible&&node.name.startsWith('сolorbombCandy_'));
  if(!candies.length)return null;
  for(const candy of candies){
    const point=candy.getWorldPosition(candy.position.clone()).project(camera);
    if(Math.abs(point.x)>=1||Math.abs(point.y)>=1||Math.abs(point.z)>=1)continue;
    raycaster.setFromCamera(point,camera);
    if(raycaster.intersectObjects(ball.children,false)[0]?.object===candy)return null;
  }
  const from=ball.quaternion.clone();
  const direction=ball.parent.worldToLocal(camera.getWorldPosition(ball.position.clone())).sub(ball.position).normalize();
  const current=candies[0].position.clone().normalize().applyQuaternion(from);
  const turn=from.clone().setFromUnitVectors(current,direction);
  return {from,to:from.clone().premultiply(turn)};
}
