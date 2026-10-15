import {Puzzle} from './model.js';

// Connected global rules shared by the pattern studio and shipped playables.
// Keep the original Puzzle (and easy mode) unchanged.
export class GlobalPuzzle extends Puzzle {
  constructor(options={}) {
    super(options);
    this.batchSize=Math.min(this.capacity,options.batchSize??30);
  }

  pick(region,index) {
    if(!super.pick(region,index))return false;
    // Puzzle returns a breadth-first connected region starting at the click.
    // A prefix stays connected; never top up a small region from elsewhere.
    this.selection.indices=this.selection.indices.slice(0,this.batchSize);
    return true;
  }

  place(region,index) {
    const moved=super.place(region,index);
    if(moved&&this.selection?.region==='board') {
      // A partial transfer can remove a bridge. Keep only one connected
      // remainder selected; disconnected leftovers need their own click.
      const remaining=new Set(this.selection.indices);
      this.selection={...this.selection,indices:this.connected(this.selection.indices[0],i=>remaining.has(i))};
    }
    return moved;
  }

  hint() {
    const holes=new Map(),seenHoles=new Set();
    for(let i=0;i<this.target.length;i++)if(this.target[i]&&this.board[i]===0&&!seenHoles.has(i)) {
      const color=this.target[i],group=this.connected(i,n=>this.board[n]===0&&this.target[n]===color);
      group.forEach(n=>seenHoles.add(n));
      if(!holes.has(color)||holes.get(color).count<group.length)holes.set(color,{index:i,count:group.length});
    }
    if(this.selection) {
      const hole=holes.get(this.selection.color);
      if(hole)return {region:'board',index:hole.index,action:'place'};
      const empty=this.tray.indexOf(0);
      if(this.selection.region==='board'&&empty>=0)return {region:'tray',index:empty,action:'store'};
      // A partial batch may be held while the cache is full. Another color can
      // fill the vacancies and release cache space; a new pick replaces it.
    }
    const sources=[],seenSources=new Set();
    for(let i=0;i<this.target.length;i++) {
      if(this.board[i]&&this.board[i]!==this.target[i]&&!seenSources.has(i)) {
        const color=this.board[i],group=this.connected(i,n=>this.board[n]===color&&this.board[n]!==this.target[n]);
        group.forEach(n=>seenSources.add(n));
        sources.push({region:'board',index:i,color,count:group.length});
      }
    }
    for(let i=0;i<this.tray.length;) {
      const color=this.tray[i];
      if(!color){i++;continue;}
      let end=i+1;
      while(this.tray[end]===color)end++;
      sources.push({region:'tray',index:i,color,count:end-i});
      i=end;
    }
    const amount=s=>Math.min(this.batchSize,holes.get(s.color)?.count||0,s.count);
    sources.sort((a,b)=>amount(b)-amount(a)||Number(b.region==='tray')-Number(a.region==='tray')||b.count-a.count||a.index-b.index);
    const source=sources.find(s=>holes.has(s.color))||sources.find(s=>s.region==='board');
    return source?{region:source.region,index:source.index,action:'pick'}:null;
  }
}
