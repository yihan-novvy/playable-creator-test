import {prepareLevel as prepareEasyLevel,validateLevel as validateBaseLevel,solveLevel as solveEasyLevel} from './level.js';
import {prepareGlobalLevel,replayGlobalLevel,globalOpeningOptions} from './global-opening.js';
import {Puzzle} from './model.js';
import {GlobalPuzzle} from './global-puzzle.js';

// Shipping entry: preserve the existing easy generator, and route medium (plus
// old scattered configurations) through the approved connected global rules.
export function validateLevel(input) {
  const requested=input?.openingMode??'easy';
  const openingMode=requested==='scattered'?'medium':requested;
  if(!['easy','medium'].includes(openingMode))throw new Error('开局模式必须为简易或全局模式');
  const level=validateBaseLevel({...input,openingMode});
  return openingMode==='medium'?{...level,...globalOpeningOptions(input)}:level;
}

export function createPuzzle(level) {
  const SessionPuzzle=level.openingMode==='medium'?GlobalPuzzle:Puzzle;
  return new SessionPuzzle({width:level.width,height:level.height,target:level.target,capacity:level.capacity,trayCols:level.trayCols,openingBoard:level.opening,batchSize:level.batchSize});
}

export function solveLevel(input) {
  const level=validateLevel(input);
  return level.openingMode==='medium'?replayGlobalLevel(level,globalOpeningOptions(level)):solveEasyLevel(level);
}

export function prepareLevel(input) {
  const level=validateLevel(input);
  if(level.openingMode==='easy')return prepareEasyLevel(level);
  if(level.opening)return {level,proof:solveLevel(level)};
  const prepared=prepareGlobalLevel(level,globalOpeningOptions(level));
  return {...prepared,level:{...prepared.level,...prepared.options}};
}
