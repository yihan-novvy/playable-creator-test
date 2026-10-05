import * as THREE from 'three';

// The vessel lives in local cup coordinates. Its rounded foot is an ellipsoid
// cap; every liquid boundary is perpendicular to gravity after the cup's scale
// and rotation are applied. Volumes are fractions of the complete interior.
const DEFAULTS = Object.freeze({
  radius: .365, bottom: .12, top: 2.6, rounding: .24,
  scaleY: 1.35, scaleXZ: .86, radialSegments: 48, roundedSegments: 10,
});
const EPSILON = 1e-7;
const vessels = new Map();

function vesselFor(options = {}) {
  const config = { ...DEFAULTS, ...options };
  const key = Object.keys(DEFAULTS).map(name => config[name]).join(':');
  if (vessels.has(key)) return vessels.get(key);
  const { radius, bottom, top, rounding, radialSegments, roundedSegments } = config;
  if (!(radius > 0 && top > bottom && rounding > 0 && rounding < top - bottom)) {
    throw new RangeError('The liquid vessel needs a positive radius, height, and rounded foot.');
  }
  const triangles = [];
  const rings = [];
  for (let j = 0; j <= roundedSegments; j++) {
    const angle = j / roundedSegments * Math.PI / 2;
    const y = bottom + rounding * (1 - Math.cos(angle));
    const r = radius * Math.sin(angle);
    rings.push(Array.from({ length: radialSegments }, (_, i) => {
      const theta = i / radialSegments * Math.PI * 2;
      return [r * Math.cos(theta), y, r * Math.sin(theta)];
    }));
  }
  rings.push(rings.at(-1).map(([x, , z]) => [x, top, z]));
  for (let j = 0; j < rings.length - 1; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const next = (i + 1) % radialSegments;
      const a = rings[j][i], b = rings[j + 1][i];
      const c = rings[j + 1][next], d = rings[j][next];
      triangles.push([a, b, c]);
      if (j > 0) triangles.push([a, c, d]);
    }
  }
  // This closes the vessel only when the top boundary reaches the lip.
  for (let i = 0; i < radialSegments; i++) {
    triangles.push([[0, top, 0], rings.at(-1)[(i + 1) % radialSegments], rings.at(-1)[i]]);
  }
  const slices = [];
  // Simpson integration is exact for the full ellipsoid foot. The straight
  // cylinder is integrated analytically below, avoiding stair steps as a cup
  // starts tilting away from vertical.
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const y = bottom + i / steps * rounding;
    const q = 1 - i / steps;
    const r = radius * Math.sqrt(1 - q * q);
    const factor = i === 0 || i === steps ? 1 : i % 2 ? 4 : 2;
    slices.push({ y, radius: r, area: Math.PI * r * r, weight: rounding / steps / 3 * factor });
  }
  const totalVolume = Math.PI * radius * radius * (top - bottom - rounding / 3);
  const vessel = { ...config, triangles, slices, totalVolume, levels: new Map() };
  if (vessels.size > 12) vessels.delete(vessels.keys().next().value);
  vessels.set(key, vessel);
  return vessel;
}

function gravity(tilt, vessel) {
  return [Math.sin(tilt) * vessel.scaleXZ, Math.cos(tilt) * vessel.scaleY, 0];
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function circleArea(t) {
  if (t <= -1) return 0;
  if (t >= 1) return Math.PI;
  return Math.acos(-t) + t * Math.sqrt(1 - t * t);
}

function circleAreaIntegral(t) {
  if (t <= -1) return 0;
  if (t >= 1) return Math.PI * t;
  const root = Math.sqrt(1 - t * t);
  return t * Math.acos(-t) + root - root * root * root / 3;
}

function fractionBelow(level, n, vessel) {
  const horizontal = Math.abs(n[0]);
  if (horizontal < 1e-8) {
    const y = level / n[1];
    if (n[1] < 0) return 1 - uprightFraction(y, vessel);
    return uprightFraction(y, vessel);
  }
  const { radius, bottom, top, rounding } = vessel;
  const straightBottom = bottom + rounding;
  const width = horizontal * radius;
  let volume;
  if (Math.abs(n[1]) < 1e-7) {
    volume = radius * radius * (top - straightBottom) * circleArea(level / width);
  } else {
    const first = (level - n[1] * straightBottom) / width;
    const last = (level - n[1] * top) / width;
    volume = radius * radius * width / n[1] * (circleAreaIntegral(first) - circleAreaIntegral(last));
  }
  for (const slice of vessel.slices) {
    if (!slice.radius) continue;
    const x = (level - n[1] * slice.y) / horizontal;
    volume += slice.radius * slice.radius * circleArea(x / slice.radius) * slice.weight;
  }
  return Math.max(0, Math.min(1, volume / vessel.totalVolume));
}

function uprightFraction(y, vessel) {
  const { bottom, top, rounding } = vessel;
  const height = Math.max(0, Math.min(top - bottom, y - bottom));
  const filled = height < rounding
    ? height * height / rounding - height * height * height / (3 * rounding * rounding)
    : height - rounding / 3;
  return filled / (top - bottom - rounding / 3);
}

/** Convert an upright liquid height to its full-interior volume fraction. */
export function liquidVolumeAtHeight(height, options = {}) {
  return uprightFraction(height, vesselFor(options));
}

/** Fraction of the interior below a world-horizontal plane, relative to cup origin. */
export function liquidVolumeBelowLevel(level, tilt = 0, options = {}) {
  const vessel = vesselFor(options);
  return fractionBelow(level, gravity(tilt, vessel), vessel);
}

// Explicit alias for callers that store all gameplay amounts as fractions.
export const liquidVolumeFractionAtLevel = liquidVolumeBelowLevel;

/** World y of a gravity-level liquid surface, relative to the cup origin. */
export function liquidSurfaceLevel(fraction, tilt = 0, options = {}) {
  const vessel = vesselFor(options);
  fraction = Math.max(0, Math.min(1, fraction));
  const key = `${tilt}:${fraction}`;
  if (vessel.levels.has(key)) return vessel.levels.get(key);
  const n = gravity(tilt, vessel);
  // Bounding box bounds deliberately extend beyond the rounded foot.
  let low = Math.min(n[1] * vessel.bottom, n[1] * vessel.top) - Math.abs(n[0]) * vessel.radius;
  let high = Math.max(n[1] * vessel.bottom, n[1] * vessel.top) + Math.abs(n[0]) * vessel.radius;
  let level;
  if (fraction === 0) level = low - EPSILON;
  else if (fraction === 1) level = high + EPSILON;
  else {
    for (let i = 0; i < 27; i++) {
      const middle = (low + high) / 2;
      if (fractionBelow(middle, n, vessel) < fraction) low = middle;
      else high = middle;
    }
    level = (low + high) / 2;
  }
  // A short cache shares boundaries between adjacent colors without retaining
  // the many slightly different fractions generated by a long animation.
  if (vessel.levels.size > 160) vessel.levels.clear();
  vessel.levels.set(key, level);
  return level;
}

/** Positive tilt at which this amount of liquid just reaches the lowest lip. */
export function angleForPour(fraction, options = {}) {
  const vessel = vesselFor(options);
  fraction = Math.max(0, Math.min(1, fraction));
  if (fraction >= 1) return 0;
  if (fraction <= 0) return Math.PI / 2;
  let low = 0, high = Math.PI / 2;
  for (let i = 0; i < 24; i++) {
    const angle = (low + high) / 2;
    const n = gravity(angle, vessel);
    const lip = n[1] * vessel.top - Math.abs(n[0]) * vessel.radius;
    if (fractionBelow(lip, n, vessel) > fraction) low = angle;
    else high = angle;
  }
  return (low + high) / 2;
}

function clipPolygon(polygon, n, level, keepBelow, intersections) {
  if (!polygon.length) return polygon;
  const output = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    const da = dot(n, a) - level, db = dot(n, b) - level;
    const aInside = keepBelow ? da <= EPSILON : da >= -EPSILON;
    const bInside = keepBelow ? db <= EPSILON : db >= -EPSILON;
    if (aInside) output.push(a);
    if (aInside !== bInside) {
      const t = da / (da - db);
      const point = a.map((value, axis) => value + (b[axis] - value) * t);
      output.push(point);
      intersections.push(point);
    }
  }
  return output;
}

function appendTriangle(positions, a, b, c) {
  positions.push(...a, ...b, ...c);
}

function appendCap(positions, points, n, faceUp) {
  // Each clipped triangle contributes duplicate edge points. Deduplicate before
  // forming a fan; the vessel and its intersection are both convex.
  const unique = new Map();
  for (const point of points) unique.set(point.map(value => Math.round(value * 1e6)).join(':'), point);
  const ring = [...unique.values()];
  if (ring.length < 3) return [];
  const center = [0, 0, 0];
  for (const point of ring) for (let j = 0; j < 3; j++) center[j] += point[j] / ring.length;
  const length = Math.hypot(n[0], n[1]);
  // Cross(u,v) = n, so increasing angle winds outwards on the upper cap.
  const u = [n[1] / length, -n[0] / length, 0];
  ring.sort((a, b) => {
    const angleA = Math.atan2(-(a[2] - center[2]), dot(u, a) - dot(u, center));
    const angleB = Math.atan2(-(b[2] - center[2]), dot(u, b) - dot(u, center));
    return angleA - angleB;
  });
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    if (faceUp) appendTriangle(positions, center, a, b);
    else appendTriangle(positions, center, b, a);
  }
  return ring;
}

/**
 * Closed geometry for one color between two cumulative volume fractions.
 * Apply the same scale/rotation supplied here to its parent cup group.
 * Material groups: 0 = curved wall, 1 = horizontal top/bottom surfaces.
 */
export function createLiquidGeometry(options = {}) {
  const vessel = vesselFor(options);
  const { tilt = 0 } = options;
  const lowerVolume = Math.max(0, Math.min(1, options.lowerVolume ?? 0));
  const upperVolume = Math.max(0, Math.min(1, options.upperVolume ?? 1));
  const lowerLevel = liquidSurfaceLevel(lowerVolume, tilt, options);
  const upperLevel = liquidSurfaceLevel(upperVolume, tilt, options);
  const geometry = new THREE.BufferGeometry();
  geometry.userData = { lowerLevel, upperLevel, lowerVolume, upperVolume };
  if (upperVolume - lowerVolume < 1e-7) return geometry;
  const n = gravity(tilt, vessel);
  const positions = [], lowerPoints = [], upperPoints = [];
  for (const triangle of vessel.triangles) {
    let polygon = clipPolygon(triangle, n, lowerLevel, false, lowerPoints);
    polygon = clipPolygon(polygon, n, upperLevel, true, upperPoints);
    for (let i = 1; i < polygon.length - 1; i++) appendTriangle(positions, polygon[0], polygon[i], polygon[i + 1]);
  }
  const sideCount = positions.length / 3;
  appendCap(positions, lowerPoints, n, false);
  geometry.userData.upperContour = appendCap(positions, upperPoints, n, true);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  // The shell is nonindexed to preserve hard meniscus boundaries. Give curved
  // walls analytic normals so tiny tessellation facets cannot dull reflections.
  const normals = geometry.getAttribute('normal');
  const { bottom, rounding, radius } = vessel;
  const curvedCenterY = bottom + rounding;
  for (let i = 0; i < sideCount; i++) {
    const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
    if (y >= vessel.top - EPSILON) continue;
    const nx = x / (radius * radius);
    const ny = y < curvedCenterY ? (y - curvedCenterY) / (rounding * rounding) : 0;
    const nz = z / (radius * radius);
    const length = Math.hypot(nx, ny, nz);
    if (length > EPSILON) normals.setXYZ(i, nx / length, ny / length, nz / length);
  }
  geometry.addGroup(0, sideCount, 0);
  geometry.addGroup(sideCount, positions.length / 3 - sideCount, 1);
  geometry.computeBoundingSphere();
  return geometry;
}
