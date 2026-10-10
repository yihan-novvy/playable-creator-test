import test from 'node:test';
import assert from 'node:assert/strict';
import { WIDTH, kittyPattern } from '../src/pattern.js';
import { createKittySculpture } from '../src/kitty-sculpture.js';

function surfaceCovers(mesh,x,y){
  const geometry=mesh.geometry,pos=geometry.attributes.position,index=geometry.index;
  for(let n=0;n<index.count;n+=3){
    const ids=[index.getX(n),index.getX(n+1),index.getX(n+2)];
    const cx=ids.reduce((sum,i)=>sum+pos.getX(i),0)/3,cy=ids.reduce((sum,i)=>sum+pos.getY(i),0)/3;
    if(Math.hypot(cx-x,cy-y)<.24)return true;
  }
  return false;
}
function dispose(kitty){kitty.group.traverse(o=>o.geometry?.dispose());}

test('The face leaves an open socket for wrong, empty and still-flying white beads',()=>{
  const target=kittyPattern(),board=[...target],kitty=createKittySculpture({target,width:WIDTH});
  const cell=10*WIDTH+14,x=0,y=(14-10)*.84+5;
  assert.equal(target[cell],2);
  const face=kitty.group.children.find(o=>o.name==='Continuous head surface');
  assert.ok(face,'Continuous face surface must exist');
  kitty.update(board);assert.ok(surfaceCovers(face,x,y));
  for(const color of [1,0]){
    board[cell]=color;kitty.update(board);assert.equal(surfaceCovers(face,x,y),false);
  }
  board[cell]=target[cell];kitty.update(board,new Set([cell]));assert.equal(surfaceCovers(face,x,y),false);
  kitty.update(board);assert.ok(surfaceCovers(face,x,y));
  dispose(kitty);
});

test('Raised cheeks never conceal an incorrect, empty or arriving bead',()=>{
  const target=kittyPattern(),board=[...target],kitty=createKittySculpture({target,width:WIDTH});
  const cell=15*WIDTH+20,cheek=kitty.group.children.find(o=>o.name==='Rounded yellow cheek'&&o.position.x>0);
  assert.equal(target[cell],5);
  kitty.update(board);assert.equal(cheek.visible,true);
  for(const color of [3,0]){
    board[cell]=color;kitty.update(board);assert.equal(cheek.visible,false);
  }
  board[cell]=target[cell];kitty.update(board,new Set([cell]));assert.equal(cheek.visible,false);
  kitty.update(board);assert.equal(cheek.visible,true);
  dispose(kitty);
});
