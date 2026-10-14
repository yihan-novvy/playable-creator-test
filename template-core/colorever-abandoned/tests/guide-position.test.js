import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {guidePosition} from '../src/guide-position.js';

function camera(){
 const value=new THREE.OrthographicCamera(-15.2,15.2,27.2,-27.2,.1,140);
 value.position.set(0,-7.5,85);value.lookAt(0,0,0);
 return value;
}
const rect=(left,top,width,height)=>({left,top,width,height});

test('initial guidance agrees with the first rendered camera without depending on resize timing',()=>{
 const view=camera(),point=new THREE.Vector3(.4,6.5,.6),canvas=rect(0,0,338,605);
 const initial=guidePosition(point,view,canvas,canvas);
 view.updateMatrixWorld(true); // WebGLRenderer updates this before drawing.
 const rendered=point.clone().project(view);
 assert.ok(Math.abs(initial.left-(rendered.x+1)*50)<1e-9);
 assert.ok(Math.abs(initial.top-(1-rendered.y)*50)<1e-9);
 assert.deepEqual(guidePosition(point,view,canvas,canvas),initial);
});

test('guidance follows the actual canvas inside an offset container at different screen sizes',()=>{
 for(const scale of [1,2,3]){
  const container=rect(20,44,390*scale,760*scale);
  const canvas=rect(20+15*scale,44+90*scale,360*scale,600*scale);
  const view=camera(),point=new THREE.Vector3(-2,8,.6);
  const position=guidePosition(point,view,canvas,container);
  const projected=point.clone().project(view);
  assert.ok(Math.abs(container.left+position.left/100*container.width-(canvas.left+(projected.x+1)*.5*canvas.width))<1e-9);
  assert.ok(Math.abs(container.top+position.top/100*container.height-(canvas.top+(1-projected.y)*.5*canvas.height))<1e-9);
 }
});

test('hidden or unlaid-out canvas does not produce invalid guidance coordinates',()=>{
 assert.equal(guidePosition(new THREE.Vector3(),camera(),rect(0,0,0,0),rect(0,0,390,760)),null);
});
