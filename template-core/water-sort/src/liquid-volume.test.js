import test from 'node:test';
import { VESSEL } from './vessel-shape.js';
const interior = {radius:VESSEL.liquidRadius,bottom:VESSEL.innerBottom,top:VESSEL.mouthHeight,rounding:VESSEL.innerBottomHeight};
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createLiquidGeometry, liquidSurfaceLevel, liquidVolumeBelowLevel, liquidVolumeAtHeight, angleForPour } from './liquid-volume.js';

function enclosedVolume(geometry) {
  const p = geometry.getAttribute('position');
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  let volume = 0;
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    volume += a.dot(b.cross(c)) / 6;
  }
  return volume;
}

test('rounded vessel rest heights map to volume and invert correctly', () => {
  for (const height of [.2, .5, 1.3, 2.24, 2.4]) {
    const fraction = liquidVolumeAtHeight(height, interior);
    assert.ok(Math.abs(liquidSurfaceLevel(fraction, 0, interior) - height * 1.35) < 1e-6);
  }
  assert.ok(Math.abs(liquidVolumeAtHeight(VESSEL.mouthHeight, interior) - 1) < 1e-9);
});

test('tilted closed liquid layers preserve volume and have horizontal surfaces', () => {
  const full = createLiquidGeometry(interior);
  const fullVolume = enclosedVolume(full);
  full.dispose();
  for (const tilt of [0, .001, .5, -1.1, 1.5]) {
    for (const [lowerVolume, upperVolume] of [[0, .9], [.25, .5], [0, .05]]) {
      const geometry = createLiquidGeometry({ ...interior, tilt, lowerVolume, upperVolume });
      const measured = enclosedVolume(geometry) / fullVolume;
      assert.ok(Math.abs(measured - (upperVolume - lowerVolume)) < .001, `volume at ${tilt}: ${measured}`);
      const cap = geometry.groups[1];
      const positions = geometry.getAttribute('position');
      for (let i = cap.start; i < cap.start + cap.count; i++) {
        const worldY = Math.sin(tilt) * positions.getX(i) * .86 + Math.cos(tilt) * positions.getY(i) * 1.35;
        const error = Math.min(Math.abs(worldY - geometry.userData.upperLevel), Math.abs(worldY - geometry.userData.lowerLevel));
        assert.ok(error < 1e-6, `cap follows gravity at ${tilt}`);
      }
      geometry.dispose();
    }
  }
});

test('pour angle follows the draining volume and touches the lowest lip', () => {
  let previousAngle = 0;
  for (const fraction of [.92, .85, .6, .3, .1, .01]) {
    const angle = angleForPour(fraction, interior);
    assert.ok(angle > previousAngle);
    previousAngle = angle;
    const lip = Math.cos(angle) * 2.6 * 1.35 - Math.sin(angle) * .365 * .86;
    assert.ok(Math.abs(liquidVolumeBelowLevel(lip, angle, interior) - fraction) < 1e-6);
  }
});

test('empty layer produces no triangles', () => {
  const geometry = createLiquidGeometry({ ...interior, lowerVolume: .3, upperVolume: .3, tilt: 1 });
  assert.equal(geometry.getAttribute('position'), undefined);
  geometry.dispose();
});
