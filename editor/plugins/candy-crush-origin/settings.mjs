export function candyHitTarget(game,settings={}){
  const count=settings.tapsToBreak===undefined?game.defaultHits:settings.tapsToBreak;
  if(!Number.isInteger(count)||count<1||count>game.maxHits)throw Object.assign(new Error(`每局有效点击次数须为 1–${game.maxHits} 的整数（最多 ${game.maxHits} 个糖果点）。`),{statusCode:400});
  return count;
}

// Bake the editor setting into both exports; the platform supplies config: {}.
export function configureCandyGame(source,game,settings){
  const count=candyHitTarget(game,settings),anchor=`const CANDY_TARGET_HITS=${game.defaultHits};`;
  if(source.split(anchor).length!==2)throw new Error('Candy count build anchor changed');
  return source.replace(anchor,`const CANDY_TARGET_HITS=${count};`);
}
