// Nagesh City - shared math, RNG and geometry helpers.
import * as THREE from '../vendor/three.module.js';

export const TAU = Math.PI * 2;

export function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function invLerp(a, b, v) { return (v - a) / (b - a); }
export function smoothstep(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

// Frame-rate independent exponential approach.
export function damp(a, b, lambda, dt) { return lerp(a, b, 1 - Math.exp(-lambda * dt)); }

export function angleDelta(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

export function dampAngle(a, b, lambda, dt) {
  return a + angleDelta(a, b) * (1 - Math.exp(-lambda * dt));
}

// Deterministic PRNG (mulberry32) so a district always generates the same way.
export function makeRNG(seed) {
  let s = seed >>> 0;
  const rng = function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.range = (a, b) => a + rng() * (b - a);
  rng.int = (a, b) => Math.floor(a + rng() * (b - a + 1));
  rng.pick = (arr) => arr[Math.floor(rng() * arr.length)];
  rng.chance = (p) => rng() < p;
  rng.sign = () => (rng() < 0.5 ? -1 : 1);
  return rng;
}

/**
 * Merge an array of BufferGeometries into a single non-indexed geometry.
 * Keeps position / normal / uv / color so wildly different props can share one
 * draw call. This is the main reason the city holds 60fps in a browser.
 */
export function mergeGeometries(geoms) {
  let total = 0;
  const prepared = [];
  for (const g of geoms) {
    const ng = g.index ? g.toNonIndexed() : g;
    const count = ng.attributes.position.count;
    total += count;
    prepared.push(ng);
  }
  const position = new Float32Array(total * 3);
  const normal = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2);
  const color = new Float32Array(total * 3);
  let vo = 0;
  for (const g of prepared) {
    const p = g.attributes.position;
    const n = g.attributes.normal;
    const t = g.attributes.uv;
    const c = g.attributes.color;
    const count = p.count;
    position.set(p.array.subarray(0, count * 3), vo * 3);
    if (n) normal.set(n.array.subarray(0, count * 3), vo * 3);
    if (t) uv.set(t.array.subarray(0, count * 2), vo * 2);
    if (c) {
      color.set(c.array.subarray(0, count * 3), vo * 3);
    } else {
      color.fill(1, vo * 3, (vo + count) * 3);
    }
    vo += count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(position, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setAttribute('color', new THREE.BufferAttribute(color, 3));
  out.computeBoundingSphere();
  return out;
}

// Paint every vertex of a geometry one colour so it can be merged into a
// vertexColors material.
export function tint(geo, hex) {
  const c = new THREE.Color(hex);
  const count = geo.attributes.position.count;
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();

// Place a geometry in world space without needing a Mesh/Object3D.
export function place(geo, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1) {
  _e.set(0, ry, 0);
  _q.setFromEuler(_e);
  _m.compose(_v.set(x, y, z), _q, new THREE.Vector3(sx, sy, sz));
  geo.applyMatrix4(_m);
  return geo;
}

/** Axis-aligned box obstacle used for all world collision. */
export class Box {
  constructor(x, z, hw, hd, height = 20, tag = 'solid') {
    this.x = x; this.z = z; this.hw = hw; this.hd = hd; this.height = height; this.tag = tag;
    // Set true to make the box pass-through without rebuilding the grid.
    this.disabled = false;
  }
  contains(px, pz, pad = 0) {
    return Math.abs(px - this.x) < this.hw + pad && Math.abs(pz - this.z) < this.hd + pad;
  }
}

/**
 * Uniform spatial hash so collision queries stay O(1) no matter how many
 * buildings a district has.
 */
export class SpatialGrid {
  constructor(cell = 16) { this.cell = cell; this.map = new Map(); }
  _key(cx, cz) { return cx * 73856093 ^ cz * 19349663; }
  insert(box) {
    const c = this.cell;
    const x0 = Math.floor((box.x - box.hw) / c), x1 = Math.floor((box.x + box.hw) / c);
    const z0 = Math.floor((box.z - box.hd) / c), z1 = Math.floor((box.z + box.hd) / c);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const k = this._key(cx, cz);
        let list = this.map.get(k);
        if (!list) { list = []; this.map.set(k, list); }
        list.push(box);
      }
    }
  }
  query(x, z, radius, out) {
    out.length = 0;
    const c = this.cell;
    const x0 = Math.floor((x - radius) / c), x1 = Math.floor((x + radius) / c);
    const z0 = Math.floor((z - radius) / c), z1 = Math.floor((z + radius) / c);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const list = this.map.get(this._key(cx, cz));
        if (!list) continue;
        for (const b of list) if (out.indexOf(b) === -1) out.push(b);
      }
    }
    return out;
  }
}

const _scratch = [];

/**
 * Push a circle of `radius` out of any overlapping boxes. Returns the number of
 * boxes hit, the accumulated push direction, and writes the corrected position
 * back into `pos` {x,z}.
 *
 * Two things make this behave rather than merely work:
 *
 *  - It resolves against the *closest point* on each box rather than along the
 *    shallowest axis, so a circle grazing an outside corner slides around it
 *    instead of snapping flat against one face.
 *  - It resolves the deepest overlap first and then re-queries, so being wedged
 *    between two boxes settles instead of ping-ponging one into the other. The
 *    old single pass could push you out of a wall and straight into its
 *    neighbour depending only on which order the grid handed them back.
 *
 * @param opts.y      feet height; boxes shorter than this are stepped over
 * @param opts.iter   maximum resolve passes (default 5)
 * @param opts.skip   a tag to ignore entirely
 */
export function resolveCircle(grid, pos, radius, opts) {
  const y = opts && opts.y !== undefined ? opts.y : null;
  const maxIter = (opts && opts.iter) || 5;
  const skip = opts && opts.skip;
  let hits = 0, nx = 0, nz = 0;

  for (let it = 0; it < maxIter; it++) {
    const boxes = grid.query(pos.x, pos.z, radius + 2, _scratch);
    let best = null, bestDepth = 1e-6, bx = 0, bz = 0;

    for (const b of boxes) {
      if (b.disabled) continue;
      if (skip && b.tag === skip) continue;
      // Anything you are already standing above is not in the way.
      if (y !== null && b.height <= y + 0.04) continue;

      // Closest point on the box to the circle centre.
      const px = clamp(pos.x, b.x - b.hw, b.x + b.hw);
      const pz = clamp(pos.z, b.z - b.hd, b.z + b.hd);
      let dx = pos.x - px, dz = pos.z - pz;
      const d2 = dx * dx + dz * dz;

      let depth, ux, uz;
      if (d2 > 1e-9) {
        // Outside the box: push straight out along the corner/edge normal.
        if (d2 >= radius * radius) continue;
        const d = Math.sqrt(d2);
        depth = radius - d;
        ux = dx / d; uz = dz / d;
      } else {
        // Centre is inside the box - the only sane exit is the nearest face.
        const ox = b.hw + radius - Math.abs(pos.x - b.x);
        const oz = b.hd + radius - Math.abs(pos.z - b.z);
        if (ox <= 0 || oz <= 0) continue;
        if (ox < oz) { depth = ox; ux = pos.x < b.x ? -1 : 1; uz = 0; }
        else { depth = oz; ux = 0; uz = pos.z < b.z ? -1 : 1; }
      }

      if (depth > bestDepth) { bestDepth = depth; best = b; bx = ux; bz = uz; }
    }

    if (!best) break;
    hits++;
    // A hair of slop, so the next frame does not immediately re-collide.
    pos.x += bx * (bestDepth + 0.001);
    pos.z += bz * (bestDepth + 0.001);
    nx += bx; nz += bz;
  }
  return { hits, nx, nz };
}

/**
 * March a ray across the collision grid and return how far it gets before
 * something solid stops it. Used by gunfire and by line-of-sight checks, which
 * is why it takes a height: you can shoot over a crate you cannot walk through.
 */
const _rayScratch = [];
let _rayEpoch = 0;

/**
 * Exact slab test against one box, treated as standing on the ground with its
 * own height. Returns the distance to the near face, or -1 for a miss.
 */
function rayBox(ox, oy, oz, dx, dy, dz, b) {
  let tmin = 0, tmax = Infinity;

  if (Math.abs(dx) < 1e-9) {
    if (ox < b.x - b.hw || ox > b.x + b.hw) return -1;
  } else {
    const inv = 1 / dx;
    let t1 = (b.x - b.hw - ox) * inv, t2 = (b.x + b.hw - ox) * inv;
    if (t1 > t2) { const s = t1; t1 = t2; t2 = s; }
    if (t1 > tmin) tmin = t1;
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return -1;
  }

  if (Math.abs(dz) < 1e-9) {
    if (oz < b.z - b.hd || oz > b.z + b.hd) return -1;
  } else {
    const inv = 1 / dz;
    let t1 = (b.z - b.hd - oz) * inv, t2 = (b.z + b.hd - oz) * inv;
    if (t1 > t2) { const s = t1; t1 = t2; t2 = s; }
    if (t1 > tmin) tmin = t1;
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return -1;
  }

  if (Math.abs(dy) < 1e-9) {
    if (oy < 0 || oy > b.height) return -1;
  } else {
    const inv = 1 / dy;
    let t1 = (0 - oy) * inv, t2 = (b.height - oy) * inv;
    if (t1 > t2) { const s = t1; t1 = t2; t2 = s; }
    if (t1 > tmin) tmin = t1;
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return -1;
  }

  return tmin;
}

/**
 * How far a ray gets before something solid stops it. Used by gunfire and by
 * line-of-sight checks, which is why it is height-aware: you can shoot over a
 * crate you cannot walk through.
 *
 * Candidate boxes are gathered from the grid cells along the ray and then
 * tested exactly. The previous version marched in fixed steps asking "is there
 * a box at this point?", which silently stepped straight over anything thinner
 * than the step - fences, railings, hoarding legs, shop counters - and that is
 * precisely what let people shoot each other through walls.
 */
export function rayHitWorld(grid, ox, oy, oz, dx, dy, dz, maxDist) {
  const out = _rayScratch;
  const epoch = ++_rayEpoch;
  let best = maxDist;

  // The ground is solid too, or a downhill shot travels forever underneath it.
  if (dy < -1e-9) {
    const tg = -oy / dy;
    if (tg >= 0 && tg < best) best = tg;
  }

  // Sample cells at half the grid pitch so consecutive queries overlap and no
  // cell along the line is skipped.
  const stride = grid.cell * 0.5;
  const steps = Math.ceil(maxDist / stride);
  for (let i = 0; i <= steps; i++) {
    const t = Math.min(i * stride, maxDist);
    // Everything from here on is at least (t - stride) away, so once the best
    // hit is behind us there is nothing left that could beat it.
    if (t - stride > best) break;
    const boxes = grid.query(ox + dx * t, oz + dz * t, stride, out);
    for (const b of boxes) {
      if (b.disabled || b._rayEpoch === epoch) continue;
      b._rayEpoch = epoch;
      const hit = rayBox(ox, oy, oz, dx, dy, dz, b);
      if (hit >= 0 && hit < best) best = hit;
    }
  }
  return best;
}

/**
 * Nearest intersection of a ray with a sphere, or -1. Everything shootable in
 * this game is approximated by one or two of these.
 */
export function raySphere(ox, oy, oz, dx, dy, dz, cx, cy, cz, r) {
  const ex = cx - ox, ey = cy - oy, ez = cz - oz;
  const b = ex * dx + ey * dy + ez * dz;
  if (b < 0) return -1;
  const c = ex * ex + ey * ey + ez * ez - r * r;
  const disc = b * b - c;
  if (disc < 0) return -1;
  const s = Math.sqrt(disc);
  const t0 = b - s;
  return t0 >= 0 ? t0 : (b + s >= 0 ? 0 : -1);
}

export function dist2(ax, az, bx, bz) {
  const dx = ax - bx, dz = az - bz;
  return dx * dx + dz * dz;
}

export function formatTime(sec) {
  sec = Math.max(0, sec);
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
}

export function formatMoney(n) {
  return '\u20B9' + Math.round(n).toLocaleString('en-IN');
}
