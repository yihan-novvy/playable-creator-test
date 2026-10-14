import {WIDTH,HEIGHT,kittyPattern} from './legacy-pattern.js';
export class Puzzle {
  constructor({width=WIDTH,height=HEIGHT,target=kittyPattern(),capacity=48,trayCols=12,openingSeeds=null,openingBoard=null}={}){this.width=width;this.height=height;this.target=[...target];this.capacity=capacity;this.trayCols=trayCols;this.openingSeeds=openingSeeds;this.openingBoard=openingBoard;this.reset();}
  neighbors(i){const x=i%this.width,y=Math.floor(i/this.width),out=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;if(xx>=0&&xx<this.width&&yy>=0&&yy<this.height)out.push(yy*this.width+xx);}return out;}
  connected(start,accept){if(!accept(start))return[];const seen=new Set([start]),queue=[start];for(let q=0;q<queue.length;q++)for(const i of this.neighbors(queue[q]))if(!seen.has(i)&&accept(i)){seen.add(i);queue.push(i);}return queue;}
  reset(){this.board=[...this.target];this.tray=Array(this.capacity).fill(0);this.selection=null;this.history=[];this.moves=0;
    if(this.openingBoard){this.board=[...this.openingBoard];this.openingPatches=[];return;}
    // Connected cycles share the sculpture's sampled matrix and conserve all colors.
    const claimed=new Set();
    const cluster=(color,seed,size)=>{
      const candidates=this.target.map((c,i)=>c===color&&!claimed.has(i)?i:-1).filter(i=>i>=0).sort((a,b)=>Math.hypot(a%this.width-seed[0],Math.floor(a/this.width)-seed[1])-Math.hypot(b%this.width-seed[0],Math.floor(b/this.width)-seed[1]));
      for(const start of candidates){const group=this.connected(start,i=>this.target[i]===color&&!claimed.has(i)).slice(0,size);if(group.length===size){group.forEach(i=>claimed.add(i));return group;}}
      throw new Error('Not enough uniform cells for an opening cycle');
    };
    const seeds=this.openingSeeds??[[9,23],[7,9],[2,13],[14,23],[24,14]];
    const patches=[cluster(2,seeds[0],6),cluster(3,seeds[1],6),cluster(1,seeds[2],6)];
    const colors=patches.map(p=>this.target[p[0]]);
    patches.forEach((p,k)=>p.forEach(i=>this.board[i]=colors[(k+1)%patches.length]));
    this.openingPatches=patches;
    const white=cluster(2,seeds[3],12),dark=cluster(1,seeds[4],12);
    white.forEach(i=>this.board[i]=1);dark.forEach(i=>this.board[i]=2);
    this.openingPatches.push(white,dark);
  }
  get correct(){return this.target.reduce((n,c,i)=>n+(c!==0&&this.board[i]===c?1:0),0);}
  get total(){return this.target.filter(Boolean).length;}
  get complete(){return this.correct===this.total;}
  snapshot(){return{board:[...this.board],tray:[...this.tray],moves:this.moves};}
  undo(){const s=this.history.pop();if(!s)return false;Object.assign(this,s);this.selection=null;return true;}
  pick(region,index){if(!['board','tray'].includes(region)||!Number.isInteger(index)||index<0)return false;const list=region==='board'?this.board:this.tray;if(index>=list.length)return false;const color=list[index];if(!color)return false;if(region==='board'&&color===this.target[index])return false;
    let indices;
    if(region==='board')indices=this.connected(index,i=>this.board[i]===color&&this.board[i]!==this.target[i]);
    else{let lo=index,hi=index;while(lo>0&&list[lo-1]===color)lo--;while(hi+1<list.length&&list[hi+1]===color)hi++;indices=Array.from({length:hi-lo+1},(_,k)=>lo+k);}
    this.selection={region,indices,color};return true;
  }
  destinations(region,index){const s=this.selection;if(!s||!['board','tray'].includes(region)||!Number.isInteger(index)||index<0||index>=(region==='board'?this.board.length:this.tray.length))return[];
    if(region==='board')return this.connected(index,i=>this.target[i]===s.color&&this.board[i]===0).slice(0,s.indices.length);
    if(s.region!=='board'||this.tray[index]!==0)return[];
    return Array.from({length:this.capacity},(_,k)=>(index+k)%this.capacity).filter(i=>this.tray[i]===0).slice(0,s.indices.length);
  }
  isColorComplete(color){return this.target.some(c=>c===color)&&this.target.every((c,i)=>c!==color||this.board[i]===c);}
  place(region,index){
    const s=this.selection,dest=this.destinations(region,index);if(!dest.length)return null;
    this.history.push(this.snapshot());const moved=[];const n=dest.length;
    if(region==='tray'){
      // Original classic cache: append after the last matching color and shift later groups.
      const occupied=this.tray.map((color,from)=>({color,from})).filter(e=>e.color);
      const last=occupied.findLastIndex(e=>e.color===s.color),insert=last<0?occupied.length:last+1;
      const incoming=s.indices.slice(0,n).map(from=>({color:s.color,from,incoming:true}));
      occupied.splice(insert,0,...incoming);this.tray.fill(0);
      occupied.forEach((e,to)=>{this.tray[to]=e.color;if(e.incoming){this.board[e.from]=0;moved.push({fromRegion:'board',from:e.from,toRegion:'tray',to,color:e.color});}else if(e.from!==to)moved.push({fromRegion:'tray',from:e.from,toRegion:'tray',to,color:e.color,shift:true});});
    }else{
      const from=s.region==='board'?this.board:this.tray;
      dest.forEach((to,k)=>{const index=s.indices[k];from[index]=0;this.board[to]=s.color;moved.push({fromRegion:s.region,from:index,toRegion:'board',to,color:s.color});});
      if(s.region==='tray'){
        const remaining=this.tray.map((color,from)=>({color,from})).filter(e=>e.color);this.tray.fill(0);
        remaining.forEach((e,to)=>{this.tray[to]=e.color;if(e.from!==to)moved.push({fromRegion:'tray',from:e.from,toRegion:'tray',to,color:e.color,shift:true});});
        if(n<s.indices.length){const oldRemaining=new Set(s.indices.slice(n));this.selection={...s,indices:remaining.map((e,to)=>oldRemaining.has(e.from)?to:-1).filter(i=>i>=0)};}
      }
    }
    this.moves++;if(!(s.region==='tray'&&region==='board'&&n<s.indices.length))this.selection=n<s.indices.length?{...s,indices:s.indices.slice(n)}:null;
    return moved;
  }
  hint(){if(this.selection){for(let i=0;i<this.board.length;i++)if(this.destinations('board',i).length)return{region:'board',index:i,action:'place'};if(this.selection.region==='board'){const i=this.tray.indexOf(0);if(i>=0)return{region:'tray',index:i,action:'store'};}return null;}
    for(const region of ['board','tray']){const list=region==='board'?this.board:this.tray;for(let i=0;i<list.length;i++){if(!list[i]||(region==='board'&&list[i]===this.target[i]))continue;if(this.target.some((c,k)=>c===list[i]&&this.board[k]===0))return{region,index:i,action:'pick'};}}
    const i=this.board.findIndex((c,k)=>c&&c!==this.target[k]);return i<0?null:{region:'board',index:i,action:'pick'};
  }
}
