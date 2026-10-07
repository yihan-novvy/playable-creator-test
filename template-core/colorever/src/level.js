import {Puzzle} from './model.js';

export function validateLevel(input){
  const fail=message=>{throw new Error(message);};
  if(!input||typeof input!=='object'||Array.isArray(input))fail('关卡必须是对象');
  const {width,height,capacity=48,trayCols=12}=input;
  for(const [key,value,min,max]of [['width',width,4,40],['height',height,4,40],['capacity',capacity,4,96],['trayCols',trayCols,4,16]])if(!Number.isInteger(value)||value<min||value>max)fail(`${key} 必须是 ${min}–${max} 的整数`);
  if(capacity<trayCols||Math.ceil(capacity/trayCols)>6)fail('篮子应为 1–6 行，容量不能小于列数');
  const colors={};
  for(const [id,hex]of Object.entries(input.colors||{})){
    if(!/^[1-9]\d*$/.test(id)||Number(id)>255||!/^#[0-9a-f]{6}$/i.test(hex))fail('颜色 ID 必须为 1–255，色值必须为 #RRGGBB');
    colors[id]=hex.toLowerCase();
  }
  if(Object.keys(colors).length<2||Object.keys(colors).length>16)fail('色板需要 2–16 种颜色');
  const validCell=c=>Number.isInteger(c)&&(c===0||Object.hasOwn(colors,c));
  if(!Array.isArray(input.target)||input.target.length!==width*height||!input.target.every(validCell))fail('target 必须与棋盘尺寸一致，0 为无格子，其余值对应颜色 ID');
  const target=[...input.target],active=target.filter(Boolean);
  if(new Set(active).size<2)fail('图案至少需要两个实际使用的颜色');
  const openingMode=input.openingMode??'scattered';
  if(!['easy','scattered'].includes(openingMode))fail('开局模式必须为简易模式或零散模式');
  const difficulty=input.difficulty??21,seed=input.seed??1;
  if(!Number.isInteger(difficulty)||difficulty<1||difficulty>100)fail('打散对数应为 1–100');
  if(!Number.isInteger(seed)||seed<0||seed>2147483647)fail('随机种子应为 0–2147483647');
  let opening=input.opening;
  if(opening!==undefined&&opening!==null){
    if(!Array.isArray(opening)||opening.length!==target.length||!opening.every(validCell)||opening.some((c,i)=>(target[i]===0)!==(c===0)))fail('开局必须保留图案的有效格子，不允许增加或缺失珠子');
    const counts=list=>{const result={};for(const c of list)if(c)result[c]=(result[c]||0)+1;return result;};
    const a=counts(target),b=counts(opening);
    if(Object.keys(a).some(c=>a[c]!==b[c]))fail('开局每种颜色的珠子数量必须与目标一致');
    opening=[...opening];
  }
  const colorNames={};for(const id of Object.keys(colors))colorNames[id]=String(input.colorNames?.[id]||`颜色 ${id}`).slice(0,40);
  const decoration=input.decoration??'none';
  if(!['cat','chick','phoenix','none'].includes(decoration))fail('未知装饰类型');
  const decorations={};
  if(input.decorations!==undefined){
    if(!input.decorations||typeof input.decorations!=='object'||Array.isArray(input.decorations)||Object.keys(input.decorations).length>16)fail('装饰微调必须为最多 16 项的对象');
    for(const [id,t]of Object.entries(input.decorations)){
      if(!/^[a-z][a-z0-9-]{0,39}$/.test(id)||!t||typeof t!=='object')fail('装饰 ID 或参数无效');
      const {offsetX=0,offsetY=0,scale=1}=t;
      if(![offsetX,offsetY,scale].every(Number.isFinite)||Math.abs(offsetX)>40||Math.abs(offsetY)>40||scale<.1||scale>4)fail('装饰偏移范围 ±40 格，缩放范围 0.1–4');
      decorations[id]={offsetX,offsetY,scale};
    }
  }
  return {version:1,name:String(input.name||'珠子拼画').slice(0,100),width,height,colors,colorNames,target,opening:opening??null,capacity,trayCols,difficulty,seed,openingMode,decoration,...(Object.keys(decorations).length?{decorations}:{})};
}

// Validate solvability with the actual deterministic hint policy. Successful replay
// is a constructive solution; a failure is rejected, never labelled solvable.
export function solveLevel(level){
  const puzzle=new Puzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening});
  const seen=new Set(),solution=[];
  for(let step=0;step<level.target.length*12+100;step++){
    if(puzzle.complete)return {moves:puzzle.moves,solution};
    const state=JSON.stringify([puzzle.board,puzzle.tray,puzzle.selection]);
    if(seen.has(state))throw new Error('当前开局无法通过自动求解验证，请增加篮子容量或重新生成开局');
    seen.add(state);
    const hint=puzzle.hint();if(!hint)throw new Error('当前开局无法通过自动求解验证，请增加篮子容量或重新生成开局');
    const result=hint.action==='pick'?puzzle.pick(hint.region,hint.index):puzzle.place(hint.region,hint.index);
    if(!result)throw new Error('自动求解发现无效移动');
    solution.push(hint);
  }
  throw new Error('开局超过自动求解步数上限，请降低打散数量');
}
export function prepareLevel(input){
  const level=validateLevel(input);
  if(level.opening){const proof=solveLevel(level);if(level.openingMode==='easy'&&proof.moves>6)throw new Error('此开局超过简易模式的 6 次搬运限制，请重新生成开局');return {level,proof};}
  const indices=level.target.map((c,i)=>c?i:-1).filter(i=>i>=0);
  let randomState=level.seed||1;
  const random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
  if(level.openingMode==='easy')return easyOpening(level,random);
  for(let attempt=0;attempt<40;attempt++){
    const board=[...level.target],available=[...indices];let swapped=0;
    while(available.length>=2&&swapped<level.difficulty){
      const ai=Math.floor(random()*available.length),a=available.splice(ai,1)[0];
      const candidates=available.filter(i=>board[i]!==board[a]);if(!candidates.length)continue;
      const b=candidates[Math.floor(random()*candidates.length)];available.splice(available.indexOf(b),1);
      [board[a],board[b]]=[board[b],board[a]];swapped++;
    }
    if(!swapped)throw new Error('图案没有可交换的不同颜色');
    try{const candidate={...level,opening:board};return {level:candidate,proof:solveLevel(candidate)};}catch{}
  }
  throw new Error('无法生成通过求解验证的开局，请降低打散数量或增加篮子容量');
}

// Two swaps of equal-size compact patches usually need six placements:
// A -> basket, B -> A, basket -> B, repeated for the other pair.
// Keep patches separated, conserve every color, then replay the actual game.
function easyOpening(level,random){
  const {target,width,height,capacity}=level;
  const neighbors=i=>{const x=i%width,y=Math.floor(i/width),out=[];if(x)out.push(i-1);if(x+1<width)out.push(i+1);if(y)out.push(i-width);if(y+1<height)out.push(i+width);return out;};
  const nearby=i=>{const x=i%width,y=Math.floor(i/width),out=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(x+dx>=0&&x+dx<width&&y+dy>=0&&y+dy<height)out.push((y+dy)*width+x+dx);return out;};
  const colors=[...new Set(target.filter(Boolean))],total=target.filter(Boolean).length;
  const preferred=Math.min(capacity,18,Math.max(6,Math.round(Math.sqrt(total)/2)));
  function patch(color,size,blocked){
    const available=new Set(target.flatMap((c,i)=>c===color&&!blocked.has(i)?[i]:[])),components=[];
    while(available.size){const start=available.values().next().value,group=[start];available.delete(start);for(let q=0;q<group.length;q++)for(const i of neighbors(group[q]))if(available.delete(i))group.push(i);if(group.length>=size)components.push(group);}
    if(!components.length)return null;
    const component=components[Math.floor(random()*components.length)],allowed=new Set(component),start=component[Math.floor(random()*component.length)],seen=new Set([start]),frontier=[start],result=[];
    const x=start%width,y=Math.floor(start/width),distance=i=>(i%width-x)**2+(Math.floor(i/width)-y)**2;
    while(frontier.length&&result.length<size){frontier.sort((a,b)=>distance(a)-distance(b)||a-b);const i=frontier.shift();result.push(i);for(const n of neighbors(i))if(allowed.has(n)&&!seen.has(n)){seen.add(n);frontier.push(n);}}
    return result.length===size?result:null;
  }
  // Prefer generous patches. Reduce only when a picture lacks enough uniform area.
  for(let size=preferred;size>=Math.min(4,preferred);size--){
    for(let attempt=0;attempt<60;attempt++){
      const blocked=new Set(),board=[...target];let swaps=0;
      for(let pair=0;pair<2;pair++){
        const combinations=[];for(let a=0;a<colors.length;a++)for(let b=a+1;b<colors.length;b++)combinations.push([colors[a],colors[b]]);
        for(let i=combinations.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[combinations[i],combinations[j]]=[combinations[j],combinations[i]];}
        let found=false;
        for(const [a,b]of combinations){
          const first=patch(a,size,blocked);if(!first)continue;
          const excluded=new Set(blocked);first.forEach(i=>nearby(i).forEach(n=>excluded.add(n)));
          const second=patch(b,size,excluded);if(!second)continue;
          first.forEach(i=>{board[i]=b;nearby(i).forEach(n=>blocked.add(n));});
          second.forEach(i=>{board[i]=a;nearby(i).forEach(n=>blocked.add(n));});swaps++;found=true;break;
        }
        if(!found)break;
      }
      if(swaps!==2)continue;
      try{const candidate={...level,opening:board},proof=solveLevel(candidate);if(proof.moves>=4&&proof.moves<=6)return {level:candidate,proof};}catch{}
    }
  }
  throw new Error('此图案或篮子没有足够的连续区域生成 6 次内完成的简易开局，请增加篮子容量、调整图案或选择零散模式');
}
