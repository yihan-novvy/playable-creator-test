import {validateLevel} from './level.js';
import {GlobalPuzzle} from './global-puzzle.js';

export function globalPreviewOptions({coverage=95,batchSize=30}={}) {
  if(!Number.isInteger(coverage)||coverage<80||coverage>100)throw new Error('全局错位目标应为 80–100');
  if(!Number.isInteger(batchSize)||batchSize<12||batchSize>48)throw new Error('单批珠子应为 12–48');
  return {coverage,batchSize};
}

export function replayGlobalLevel(level,options) {
  const puzzle=new GlobalPuzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening,batchSize:options.batchSize});
  const solution=[],amounts=[];
  let peakCache=0;
  for(let step=0;step<level.target.length*8+100;step++) {
    if(puzzle.complete) {
      const wrongBeads=level.target.reduce((n,c,i)=>n+Number(c!==level.opening[i]),0);
      return {moves:puzzle.moves,solution,metrics:{total:puzzle.total,wrongBeads,wrongPercent:Math.round(wrongBeads/puzzle.total*1000)/10,
        averageBatch:Math.round(amounts.reduce((sum,n)=>sum+n,0)/amounts.length*10)/10,
        largeBatchPercent:Math.round(amounts.filter(n=>n>=12).length/amounts.length*100),
        smallBatchPercent:Math.round(amounts.filter(n=>n<=2).length/amounts.length*100),peakCache,moves:puzzle.moves,batchSize:puzzle.batchSize}};
    }
    const hint=puzzle.hint();
    if(!hint)throw new Error('全局开局没有可继续的搬运');
    if(hint.action==='pick') {
      if(!puzzle.pick(hint.region,hint.index))throw new Error('全局开局拾取无效');
    } else {
      const moved=puzzle.place(hint.region,hint.index);
      if(!moved)throw new Error('全局开局归位无效');
      amounts.push(moved.filter(m=>!m.shift).length);
      peakCache=Math.max(peakCache,puzzle.tray.filter(Boolean).length);
    }
    solution.push(hint);
  }
  throw new Error('全局开局超过求解上限');
}

// Generate over the whole silhouette, conserving every color. Compact swaps
// provide large regions where the picture permits them. The replay uses actual
// connected picks and placements, including the picture's separate details.
export function prepareGlobalLevel(input,rawOptions={}) {
  const options=globalPreviewOptions(rawOptions);
  const level=validateLevel({...input,opening:null,openingMode:'medium'});
  const {target,width,height,capacity}=level;
  const total=target.filter(Boolean).length,counts=new Map();
  target.forEach(c=>{if(c)counts.set(c,(counts.get(c)||0)+1);});
  const maximumWrong=Math.min(total,2*(total-Math.max(...counts.values())));
  const requestedWrong=Math.min(maximumWrong,Math.ceil(total*options.coverage/100));
  const adjacency=target.map((c,i)=>{
    if(!c)return [];
    const x=i%width,y=Math.floor(i/width),out=[];
    if(x)out.push(i-1);if(x+1<width)out.push(i+1);if(y)out.push(i-width);if(y+1<height)out.push(i+width);
    return out;
  });
  let state=level.seed||1;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const preferred=Math.min(options.batchSize,Math.max(1,Math.floor(capacity*.65)),Math.max(12,Math.round(Math.sqrt(total))));
  let best=null;
  for(let attempt=0;attempt<6;attempt++) {
    const board=[...target],used=new Set();
    while(used.size<requestedWrong) {
      const unseen=new Set(target.flatMap((c,i)=>c&&!used.has(i)?[i]:[])),byColor=new Map();
      while(unseen.size) {
        const start=unseen.values().next().value,color=target[start],group=[start];
        unseen.delete(start);
        for(let q=0;q<group.length;q++)for(const i of adjacency[group[q]])if(target[i]===color&&unseen.delete(i))group.push(i);
        if(!byColor.has(color))byColor.set(color,{count:0,groups:[]});
        const entry=byColor.get(color);entry.count+=group.length;entry.groups.push(group);
      }
      if(byColor.size<2)break;
      const [a,b]=[...byColor.keys()].sort((a,b)=>byColor.get(b).count-byColor.get(a).count||a-b);
      const choose=color=>{
        const groups=byColor.get(color).groups.sort((a,b)=>b.length-a.length);
        return groups[Math.floor(random()*Math.min(2,groups.length))];
      };
      const first=choose(a),second=choose(b);
      const size=Math.min(preferred,first.length,second.length,Math.ceil((requestedWrong-used.size)/2));
      const patch=group=>{
        const allowed=new Set(group),start=group[Math.floor(random()*group.length)],frontier=[start],seen=new Set([start]),out=[];
        const x=start%width,y=Math.floor(start/width),distance=i=>(i%width-x)**2+(Math.floor(i/width)-y)**2;
        while(frontier.length&&out.length<size) {
          frontier.sort((a,b)=>distance(a)-distance(b)||a-b);
          const i=frontier.shift();out.push(i);
          for(const n of adjacency[i])if(allowed.has(n)&&!seen.has(n)){seen.add(n);frontier.push(n);}
        }
        return out;
      };
      for(const i of patch(first)){board[i]=b;used.add(i);}
      for(const i of patch(second)){board[i]=a;used.add(i);}
    }
    const candidate={...level,opening:board};
    try {
      const proof=replayGlobalLevel(candidate,options),m=proof.metrics;
      const score=m.averageBatch-m.smallBatchPercent*.1-m.peakCache/capacity;
      if(!best||score>best.score)best={level:candidate,proof,score};
    } catch {
      // A candidate must replay to completion using the same preview rules.
    }
  }
  if(!best)throw new Error('无法生成可完成的全局开局，请增大篮子或更换种子');
  best.proof.metrics.maximumWrongPercent=Math.round(maximumWrong/total*1000)/10;
  return {level:best.level,proof:best.proof,options};
}
