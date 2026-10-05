import * as THREE from 'three';
import { VESSEL } from './vessel-shape.js';

// The environment contains only studio cards. A bright room would wash out
// saturated liquid colours and make empty transparent tubes look milky.
export function lightStudio(renderer, scene) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#101317');
  for (const [position, size, intensity, tint] of [
    [[-3, 3, 4], [1.1, 6], 3.2, '#fff3df'],
    [[3, 2, 3], [.35, 5], 2.4, '#deedff'],
    [[0, 6, 0], [4, 1], 2, '#ffffff'],
    [[-1, 1, -4], [2, 3], .4, '#b8c8de'],
  ]) {
    const card = new THREE.Mesh(new THREE.PlaneGeometry(...size), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(intensity) }));
    card.position.set(...position); card.lookAt(0, 1.2, 0); studio.add(card);
  }
  const generator = new THREE.PMREMGenerator(renderer);
  const environment = generator.fromScene(studio, .015);
  scene.environment = environment.texture;
  generator.dispose();
  studio.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
  scene.add(new THREE.HemisphereLight(0xe9f3ff, 0x13171d, .38));
  for (const [color, intensity, position] of [[0xfff6e7, 2.1, [-4, 6, 5]], [0xc7e3ff, .8, [4, 3, -1]], [0xbac8e0, .45, [-1, -3, 5]]]) {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(...position); scene.add(light);
  }
  return environment;
}

const outerProfile = [new THREE.Vector2(0, 0)];
// Compensate for the taller cup scale: the heel reads as a rounded test tube,
// rather than a long bulb beneath a second inner U-shaped outline.
for (let i = 1; i <= 32; i++) {
  const angle = i / 32 * Math.PI / 2;
  outerProfile.push(new THREE.Vector2(VESSEL.outerRadius * Math.sin(angle), VESSEL.outerBottomHeight * (1 - Math.cos(angle))));
}
outerProfile.push(new THREE.Vector2(VESSEL.outerRadius, VESSEL.rimStart));
const innerProfile = [new THREE.Vector2(VESSEL.innerRadius, VESSEL.rimStart), new THREE.Vector2(VESSEL.innerRadius, VESSEL.innerBottom + VESSEL.innerBottomHeight)];
for (let i = 31; i >= 0; i--) {
  const angle = i / 32 * Math.PI / 2;
  innerProfile.push(new THREE.Vector2(VESSEL.innerRadius * Math.sin(angle), VESSEL.innerBottom + VESSEL.innerBottomHeight * (1 - Math.cos(angle))));
}
// The wall and the rolled mouth meet at precisely the same inner/outer rings.
const wallGeometry = new THREE.LatheGeometry([...outerProfile, ...innerProfile], 96);
const outerReflectionGeometry = new THREE.LatheGeometry(outerProfile, 96);
const rimProfile = [new THREE.Vector2(VESSEL.outerRadius, VESSEL.rimStart)];
function rimCurve(c1, c2, end) {
  const curve = new THREE.CubicBezierCurve(rimProfile.at(-1), new THREE.Vector2(...c1), new THREE.Vector2(...c2), new THREE.Vector2(...end));
  rimProfile.push(...curve.getPoints(12).slice(1));
}
// Flared lower shoulder, round bead, then a recessed open bore. This replaces
// the two intersecting toruses and flat annulus that looked like a fitted cap.
rimCurve([.415,2.549], [.448,2.545], [.453,2.576]);
rimCurve([.461,2.607], [.439,2.619], [.418,2.619]);
rimCurve([.394,2.619], [.378,2.613], [.378,2.6]);
rimCurve([.378,2.578], [.378,2.548], [.378,VESSEL.rimStart]);
const lipGeometry = new THREE.LatheGeometry(rimProfile, 96);
const glassPhysical = new THREE.MeshPhysicalMaterial({
  color: '#edf6ff', transmission: 1, thickness: .06, ior: 1.46,
  roughness: .025, metalness: 0, transparent: true, opacity: .055,
  depthWrite: false, envMapIntensity: .8, side: THREE.FrontSide,
});
const rimPhysical = new THREE.MeshPhysicalMaterial({
  color: '#f3f7fa', transmission: .94, thickness: .045, ior: 1.46,
  roughness: .035, metalness: 0, transparent: true, opacity: .24,
  depthWrite: false, envMapIntensity: 1.6, clearcoat: 1,
});
// Thin, view-dependent specular lobes describe curved transparent walls without
// painting an opaque white stripe over the liquid. Reflection changes on tilt.
const glassReflection = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.FrontSide,
  vertexShader: `varying vec3 normalView; varying vec3 viewDirection; varying vec3 localPosition;
    void main(){vec4 p=modelViewMatrix*vec4(position,1.); normalView=normalize(normalMatrix*normal); viewDirection=normalize(-p.xyz);localPosition=position;gl_Position=projectionMatrix*p;}`,
  fragmentShader: `varying vec3 normalView; varying vec3 viewDirection; varying vec3 localPosition;
    void main(){
      vec3 n=normalize(normalView);vec3 v=normalize(viewDirection);
      float fresnel=pow(1.-abs(dot(n,v)),3.);
      vec3 r=reflect(-v,n);
      float left=exp(-pow((r.x+.73)/.075,2.))*smoothstep(-.3,.5,r.z);
      float leftSoft=exp(-pow((r.x+.63)/.19,2.))*.20*smoothstep(-.3,.5,r.z);
      float right=exp(-pow((r.x-.86)/.038,2.))*smoothstep(-.4,.35,r.z)*.65;
      float taper=smoothstep(.035,.31,localPosition.y)*(1.-smoothstep(2.36,2.58,localPosition.y));
      float alpha=.007+fresnel*.29+(left+leftSoft+right)*taper*.5;
      vec3 tint=mix(vec3(.78,.86,.94),vec3(1.,.98,.92),left);
      gl_FragColor=vec4(tint,clamp(alpha,0.,.78));
    }`,
});
export function createGlass() {
  const group = new THREE.Group();
  const physical = new THREE.Mesh(wallGeometry, glassPhysical); physical.renderOrder = 3;
  const reflections = new THREE.Mesh(outerReflectionGeometry, glassReflection); reflections.renderOrder = 4;
  group.add(physical, reflections);
  const lip = new THREE.Mesh(lipGeometry, rimPhysical); lip.renderOrder = 5;
  const lipReflection = new THREE.Mesh(lipGeometry, glassReflection); lipReflection.renderOrder = 6;
  group.add(lip, lipReflection);
  return group;
}

export function createLiquidMaterial(color) {
  // A deeper base keeps blue and amber rich under the white specular reflection.
  return new THREE.MeshPhysicalMaterial({ color, roughness: .19, metalness: 0,
    ior: 1.33, specularIntensity: .75, clearcoat: .65, clearcoatRoughness: .085,
    envMapIntensity: .48, side: THREE.DoubleSide });
}
export function createSurfaceMaterial(color) {
  return new THREE.MeshPhysicalMaterial({color, roughness:.13, metalness:0,
    ior:1.33, specularIntensity:1, clearcoat:1, clearcoatRoughness:.04,
    envMapIntensity:.65, side:THREE.DoubleSide});
}
