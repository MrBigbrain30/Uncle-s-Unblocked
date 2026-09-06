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
 * boxes hit and writes the corrected position back into `pos` {x,z}.
 */
export function resolveCircle(grid, pos, radius) {
  const boxes = grid.query(pos.x, pos.z, radius + 2, _scratch);
  let hits = 0;
  let nx = 0, nz = 0;
  for (const b of boxes) {
    if (b.disabled) continue;
    const dx = pos.x - b.x;
    const dz = pos.z - b.z;
    const ox = b.hw + radius - Math.abs(dx);
    const oz = b.hd + radius - Math.abs(dz);
    if (ox > 0 && oz > 0) {
      hits++;
      // Resolve along the shallowest axis.
      if (ox < oz) {
        const s = dx < 0 ? -1 : 1;
        pos.x += ox * s; nx += s;
      } else {
        const s = dz < 0 ? -1 : 1;
        pos.z += oz * s; nz += s;
      }
    }
  }
  return { hits, nx, nz };
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
