// Teach one cache/board exchange using the same legal moves as the hint button.
export class GameTutorial {
  constructor(){this.reset();}
  reset(){this.active=true;}
  hint(puzzle,busy=false){return this.active&&!busy&&!puzzle.complete?puzzle.hint():null;}
  placed(region){if(region==='board')this.active=false;}
}

export const hintInstruction=hint=>hint.action==='pick'
  ?(hint.region==='tray'?'点击手指指向的缓存珠子':'点击手指指向的错珠')
  :hint.action==='store'?'点击手指指向的空格，将珠子暂存':'点击手指指向的空格，将珠子归位';
