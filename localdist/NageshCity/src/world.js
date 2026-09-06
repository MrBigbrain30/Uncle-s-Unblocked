// Nagesh City - district generation.
//
// Each district is a self-contained walled block of city built at the origin.
// Only one is ever in the scene graph at a time, which is both the reason the
// game runs fast and the reason Nagesh cannot simply walk out of the slums.
//
// Everything static is merged into a handful of meshes, so a district of ~200
// buildings and ~600 props costs about 30 draw calls.

import * as THREE from '../vendor/three.module.js';
import { makeRNG, mergeGeometries, tint, place, Box, SpatialGrid, TAU } from './util.js';
import * as art from './art.js';

// --------------------------------------------------------------- batching ---

class Batch {
  constructor(material) { this.material = material; this.geos = []; }
  add(geo) { this.geos.push(geo); return geo; }
  build(group, opts = {}) {
    if (!this.geos.length) return null;
    const mesh = new THREE.Mesh(mergeGeometries(this.geos), this.material);
    mesh.castShadow = opts.cast !== false;
    mesh.receiveShadow = opts.receive !== false;
    mesh.matrixAutoUpdate = false;
    group.add(mesh);
    for (const g of this.geos) g.dispose();
    this.geos.length = 0;
    return mesh;
  }
}

/**
 * BoxGeometry whose UVs repeat according to real-world size, so a 4m shack and
 * a 40m tower share one texture without either looking smeared.
 */
function texBox(w, h, d, tile) {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
  const uv = g.attributes.uv;
  // Face order after toNonIndexed: +X, -X, +Y, -Y, +Z, -Z (6 verts each).
  const scales = [
    [d / tile, h / tile], [d / tile, h / tile],
    [w / tile, d / tile], [w / tile, d / tile],
    [w / tile, h / tile], [w / tile, h / tile],
  ];
  for (let f = 0; f < 6; f++) {
    const [su, sv] = scales[f];
    for (let i = f * 6; i < f * 6 + 6; i++) {
      uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
    }
  }
  return g;
}

function plane(w, d, tile) {
  const g = new THREE.PlaneGeometry(w, d).toNonIndexed();
  g.rotateX(-Math.PI / 2);
  if (tile) {
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / tile), uv.getY(i) * (d / tile));
  }
  return g;
}

const cbox = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const ccyl = (rt, rb, h, s = 8) => new THREE.CylinderGeometry(rt, rb, h, s);

// ------------------------------------------------------------- definitions ---

/**
 * Every district. The ad copy on the hoardings is the spine of the story, so it
 * lives right here next to the geometry that carries it.
 */
export const DISTRICTS = [
  {
    id: 'slums',
    name: 'Kaduva Flats',
    subtitle: 'The Slums',
    seed: 1337,
    half: 128,
    roads: [-104, -52, 0, 52, 104],
    roadHalf: 7,
    sky: { top: 0xb98a52, mid: 0xd9a96b, bot: 0xe8c48c },
    fog: { color: 0xd6ab77, near: 60, far: 300 },
    sun: { color: 0xffdcae, intensity: 1.5, pos: [70, 90, 40] },
    hemi: { sky: 0xe8c48c, ground: 0x7a6244, intensity: 1.15 },
    ground: () => art.dirt(2),
    groundTile: 12,
    road: () => art.asphalt(1, 0.15),
    roadTile: 10,
    walk: () => art.sidewalk(4, 0),
    curbColor: 0x6a6058,
    density: 9,          // metres per building cell - small = dense
    fill: 0.88,
    heightRange: [2.6, 5.6],
    tallChance: 0.12,
    tallHeight: [9, 17],
    wallColor: 0x5a4a38,
    gateSide: 'north',
    music: {
      id: 'slums', bpm: 84,
      chords: [110, 110, 146.83, 130.81],
      bass: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      arp: [0, null, 7, null, 3, null, 10, null, 0, null, 3, null, 7, null, 3, null],
      pad: [0, 3, 7, 10],
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1],
      arpWave: 'triangle', bassWave: 'sawtooth', detune: 6,
    },
    styles: [
      { key: 'shack', tex: () => art.shackWall(30), tile: 6 },
      { key: 'shack2', tex: () => art.shackWall(31), tile: 5 },
      { key: 'brick', tex: () => art.brick(12), tile: 6 },
      { key: 'plaster', tex: () => art.plaster(0x9c8a68, 13, 1.0), tile: 7 },
      {
        key: 'tenement',
        tex: () => art.facade({
          key: 'slumfac', seed: 22, wall: 0x6d6152, frame: 0x2a251e, glass: 0x1a1a18,
          lit: 0.22, cols: 4, rows: 5, balcony: true, litColors: [0xffc070, 0xffdca0],
        }),
        tile: 9, emissive: 0x4a4a4a,
      },
    ],
    ads: [
      { headline: 'YOU COULD BE SOMEBODY', sub: 'Ask about a Visibility Loan.', bg: 0xc4472f, wear: 0.9, face: true, seed: 3 },
      { headline: 'FAME PAYS BETTER THAN WORK', sub: 'VANTA Talent. Walk-ins welcome.', bg: 0x2f5aa8, wear: 1.0, seed: 4 },
      { headline: 'GET SEEN. GET PAID.', sub: 'No experience. No deposit. No exit.', bg: 0x7a2f6a, wear: 0.8, face: true, seed: 5 },
      { headline: 'THE FLATS ARE NOT YOUR CEILING', sub: 'They are your starting balance.', bg: 0x2f6a4a, wear: 1.0, seed: 6 },
    ],
    posters: [
      { text: 'WATER TUESDAY + FRIDAY', sub: 'Standpipe 4. Bring your own can.', bg: 0xcfc3a4, seed: 8 },
      { text: 'MISSING', sub: 'Left for an audition. Did not come back.', bg: 0xd8d2c0, seed: 9 },
      { text: 'RENT IS DUE', sub: 'It was always due.', bg: 0xc9b89a, seed: 10 },
    ],
    // Parked on the carriageways - the blocks between them are solid shacks.
    vehicles: [
      { type: 'tuk', x: 2, z: -22, rot: 0 },
      { type: 'scooter', x: -50, z: 30, rot: 0 },
      { type: 'tuk', x: -18, z: 54, rot: 1.57, color: 0x3f7f6a },
      { type: 'hatch', x: 54, z: 66, rot: 0, color: 0x7a6a52 },
      { type: 'scooter', x: 88, z: -102, rot: 1.57 },
    ],
    spawn: { x: 4, z: 104, rot: Math.PI },
  },

  {
    id: 'midtown',
    name: 'Ravi Cross',
    subtitle: 'Midtown - The Grind',
    seed: 4242,
    half: 128,
    roads: [-104, -52, 0, 52, 104],
    roadHalf: 8,
    sky: { top: 0x241f42, mid: 0x5c3a70, bot: 0xa8506a },
    fog: { color: 0x4a3557, near: 80, far: 340 },
    sun: { color: 0xffc4dc, intensity: 1.25, pos: [-60, 70, -50] },
    hemi: { sky: 0x9a76b8, ground: 0x3e3a4e, intensity: 1.25 },
    ground: () => art.asphalt(3, 0.02),
    groundTile: 12,
    road: () => art.asphalt(1, -0.16),
    roadTile: 10,
    walk: () => art.sidewalk(5, 0),
    curbColor: 0x4a4a52,
    density: 14,
    fill: 0.9,
    heightRange: [16, 44],
    tallChance: 0.28,
    tallHeight: [50, 82],
    wallColor: 0x2a2e38,
    gateSide: 'north',
    neon: true,
    music: {
      id: 'midtown', bpm: 116,
      chords: [123.47, 164.81, 138.59, 155.56],
      bass: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0],
      arp: [0, 7, 12, 7, 3, 10, 15, 10, 0, 7, 12, 15, 3, 7, 10, 12],
      pad: [0, 3, 7],
      kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      hat: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      arpWave: 'square', bassWave: 'sawtooth', detune: 0,
    },
    styles: [
      {
        key: 'office',
        tex: () => art.facade({ key: 'mtoff', seed: 50, wall: 0x2e3441, frame: 0x191d24, glass: 0x101822, lit: 0.42, cols: 6, rows: 10 }),
        tile: 11, emissive: 0x6e6e6e,
      },
      {
        key: 'apartment',
        tex: () => art.facade({ key: 'mtapt', seed: 51, wall: 0x4a4038, frame: 0x241f1a, glass: 0x14161c, lit: 0.5, cols: 5, rows: 9, balcony: true, sill: true }),
        tile: 10, emissive: 0x6e6e6e,
      },
      { key: 'glass', tex: () => art.glassCurtain(40, 0x1d2a3e, 0.3), tile: 12, emissive: 0x5a5a5a },
      { key: 'glassB', tex: () => art.glassCurtain(41, 0x2c1f3a, 0.36), tile: 12, emissive: 0x5a5a5a },
      { key: 'concrete', tex: () => art.concrete(14, 0x6a6a72), tile: 9 },
    ],
    ads: [
      { headline: 'SMILE. YOU OWE IT TO US.', sub: 'Engagement is a payment method.', bg: 0xb5203f, face: true, seed: 11 },
      { headline: 'YOUR FACE IS COLLATERAL', sub: 'VANTA Visibility Finance', bg: 0x1f3f8a, seed: 12 },
      { headline: 'NEVER STOP BEING WATCHED', sub: 'Idle accounts accrue interest.', bg: 0x7a1f6a, face: true, seed: 13 },
      { headline: 'THE HEIGHTS ARE WAITING', sub: 'Terms: everything, forever.', bg: 0x1f6a5a, seed: 14 },
      { headline: 'A GOOD CITIZEN IS A VISIBLE ONE', sub: 'Report dim neighbours.', bg: 0x8a5a1f, seed: 15 },
    ],
    posters: [
      { text: 'CASTING TODAY', sub: 'Bring ID. Bring nothing else.', bg: 0xe0d8c0, seed: 16 },
      { text: 'DEBT RELIEF IN 90 DAYS', sub: 'Ninety days is not a promise.', bg: 0xd0c8b8, seed: 17 },
    ],
    vehicles: [
      { type: 'sedan', x: 3, z: 20, rot: 0 },
      { type: 'hatch', x: -49, z: -14, rot: 0, color: 0x2f6a8a },
      { type: 'van', x: 74, z: -101, rot: 1.57 },
      { type: 'sedan', x: -101, z: 68, rot: 0, color: 0x6a2f3f },
      { type: 'scooter', x: 3, z: -84, rot: 0 },
      { type: 'sports', x: -50, z: -104, rot: 1.57, color: 0x2a2f3a },
    ],
    spawn: { x: 4, z: 104, rot: Math.PI },
  },

  {
    id: 'heights',
    name: 'Aurum Heights',
    subtitle: 'The Rich Suburbs',
    seed: 909,
    half: 128,
    roads: [-104, -52, 0, 52, 104],
    roadHalf: 8,
    sky: { top: 0x4a86c8, mid: 0x9fc6e0, bot: 0xf0dcb0 },
    fog: { color: 0xd8dcc8, near: 90, far: 400 },
    sun: { color: 0xfff0d0, intensity: 1.7, pos: [-80, 110, 60] },
    hemi: { sky: 0xbfd8f0, ground: 0x8a8a70, intensity: 0.9 },
    ground: () => art.grass(3),
    groundTile: 14,
    road: () => art.asphalt(7, -0.25),
    roadTile: 10,
    walk: () => art.sidewalk(6, 1),
    curbColor: 0xb8b4a8,
    density: 19,
    fill: 0.72,
    heightRange: [7, 13],
    tallChance: 0.08,
    tallHeight: [22, 36],
    wallColor: 0xd8d2c0,
    gateSide: 'north',
    lawns: true,
    music: {
      id: 'heights', bpm: 92,
      chords: [130.81, 174.61, 164.81, 196.0],
      bass: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      arp: [0, 4, 7, 11, 12, 11, 7, 4, 0, 4, 7, 11, 14, 11, 7, 4],
      pad: [0, 4, 7, 11],
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      // Beautiful, and about eight cents flat. Nobody in the Heights mentions it.
      arpWave: 'triangle', bassWave: 'triangle', detune: -14,
    },
    styles: [
      { key: 'marble', tex: () => art.marble(5), tile: 8 },
      { key: 'stucco', tex: () => art.plaster(0xe8dcc0, 60, 0.1), tile: 8 },
      { key: 'stuccoW', tex: () => art.plaster(0xf4efe2, 61, 0.06), tile: 9 },
      { key: 'glassV', tex: () => art.glassCurtain(62, 0x486a80, 0.1), tile: 10 },
      {
        key: 'villa',
        tex: () => art.facade({ key: 'villafac', seed: 63, wall: 0xe4d8bc, frame: 0x8a7a5a, glass: 0x2a3f4a, lit: 0.18, cols: 4, rows: 3, sill: true, litColors: [0xfff0c8] }),
        tile: 10,
      },
    ],
    ads: [
      { headline: 'THANK YOU FOR YOUR VISIBILITY', sub: 'Balance statements issued weekly.', bg: 0xe0c070, fg: 0x241c10, face: true, seed: 18 },
      { headline: 'YOU HAVE ARRIVED', sub: 'Arrival is a subscription.', bg: 0x2a5a6a, seed: 19 },
      { headline: 'REST IS A BREACH OF CONTRACT', sub: 'Please continue.', bg: 0x8a2a3a, face: true, seed: 20 },
      { headline: 'EVERY WINDOW IS A CAMERA', sub: 'For your comfort.', bg: 0x3a3a5a, seed: 21 },
    ],
    posters: [
      { text: 'NO SOLICITORS. NO PRESS. NO EXIT.', sub: 'Aurum Heights Residents Association', bg: 0xf0e8d0, seed: 22 },
    ],
    vehicles: [
      { type: 'sports', x: 3, z: 26, rot: 0 },
      { type: 'limo', x: -49, z: -20, rot: 0 },
      { type: 'sports', x: 55, z: -70, rot: 0, color: 0xd8c840 },
      { type: 'sedan', x: -101, z: 80, rot: 0, color: 0xe8e8ee },
      { type: 'limo', x: 88, z: 101, rot: 1.57 },
    ],
    spawn: { x: 4, z: 104, rot: Math.PI },
  },
];

// The Vault is hand-built rather than generated; see buildVault().
export const VAULT_MUSIC = {
  id: 'vault', bpm: 60,
  chords: [61.74, 65.41, 61.74, 58.27],
  bass: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  arp: [0, null, null, 1, null, null, 6, null, null, 1, null, null, 11, null, null, null],
  pad: [0, 1, 6, 11],
  kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  arpWave: 'sine', bassWave: 'sine', detune: 24,
};

// ------------------------------------------------------------- generation ---

export function buildDistrict(def) {
  const rng = makeRNG(def.seed);
  const group = new THREE.Group();
  const grid = new SpatialGrid(16);
  const colliders = [];
  const mapBuildings = [];
  const mapRoads = [];
  const landmarks = {};
  const half = def.half;

  const addCollider = (b) => { colliders.push(b); grid.insert(b); return b; };

  // --- materials -----------------------------------------------------------
  const groundMat = new THREE.MeshLambertMaterial({ map: def.ground() });
  const roadMat = new THREE.MeshLambertMaterial({ map: def.road() });
  const walkMat = new THREE.MeshLambertMaterial({ map: def.walk() });
  const propMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const styleMats = def.styles.map((s) => {
    const map = s.tex();
    const m = new THREE.MeshLambertMaterial({ map });
    if (s.emissive) {
      // Reusing the diffuse map as the emissive map means only the bright
      // texels - the lit windows - glow. The brickwork stays dark.
      m.emissive = new THREE.Color(s.emissive);
      m.emissiveMap = map;
    }
    return m;
  });

  const groundB = new Batch(groundMat);
  const roadB = new Batch(roadMat);
  const walkB = new Batch(walkMat);
  const propB = new Batch(propMat);
  const glowB = new Batch(glowMat);
  const styleB = styleMats.map((m) => new Batch(m));

  const prop = (geo, color, x, y, z, ry = 0) => propB.add(tint(place(geo, x, y, z, ry), color));
  const glow = (geo, color, x, y, z, ry = 0) => glowB.add(tint(place(geo, x, y, z, ry), color));

  // --- ground and roads ----------------------------------------------------
  groundB.add(place(plane(half * 2, half * 2, def.groundTile), 0, 0, 0));

  for (const r of def.roads) {
    // East-west and north-south carriageways.
    roadB.add(place(plane(half * 2, def.roadHalf * 2, def.roadTile), 0, 0.02, r));
    roadB.add(place(plane(def.roadHalf * 2, half * 2, def.roadTile), r, 0.021, 0));
    mapRoads.push({ x: 0, z: r, w: half * 2, d: def.roadHalf * 2 });
    mapRoads.push({ x: r, z: 0, w: def.roadHalf * 2, d: half * 2 });
  }

  // Centre lines, skipping intersections so the markings look surveyed.
  const dashMat = 0xdcd6b4;
  for (const r of def.roads) {
    for (let p = -half + 4; p < half - 4; p += 9) {
      if (def.roads.some((o) => Math.abs(p - o) < def.roadHalf + 3)) continue;
      glow(cbox(3.4, 0.02, 0.34), dashMat, p, 0.05, r);
      glow(cbox(0.34, 0.02, 3.4), dashMat, r, 0.051, p);
    }
  }

  // --- blocks --------------------------------------------------------------
  const bands = [];
  let prev = -half + 2;
  for (const r of def.roads) { bands.push([prev, r - def.roadHalf]); prev = r + def.roadHalf; }
  bands.push([prev, half - 2]);

  const blocks = [];
  for (let bx = 0; bx < bands.length; bx++) {
    for (let bz = 0; bz < bands.length; bz++) {
      const [x0, x1] = bands[bx];
      const [z0, z1] = bands[bz];
      if (x1 - x0 < 8 || z1 - z0 < 8) continue;
      blocks.push({ bx, bz, x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 });
    }
  }

  // Landmarks claim whole blocks before the generator fills the rest.
  const reserved = new Set();
  const claim = (name, pred) => {
    let best = null, bestD = Infinity;
    for (const b of blocks) {
      if (reserved.has(b.bx + ',' + b.bz)) continue;
      const d = pred(b);
      if (d !== null && d < bestD) { bestD = d; best = b; }
    }
    if (best) { reserved.add(best.bx + ',' + best.bz); landmarks[name] = best; }
    return best;
  };

  // --- sidewalks + buildings ----------------------------------------------
  for (const b of blocks) {
    // Kerb slab under every block.
    walkB.add(place(cbox(b.w + 1.5, 0.14, b.d + 1.5), b.cx, 0.07, b.cz));
    if (def.lawns && b.w > 20) {
      groundB.add(place(plane(b.w - 5, b.d - 5, def.groundTile), b.cx, 0.16, b.cz));
    }
  }

  return finishDistrict({
    def, rng, group, grid, colliders, mapBuildings, mapRoads, landmarks, blocks,
    reserved, claim, addCollider, half, bands, lights: [],
    batches: { groundB, roadB, walkB, propB, glowB, styleB },
    helpers: { prop, glow, texBox, plane },
    materials: { groundMat, roadMat, walkMat, propMat, glowMat, styleMats },
  });
}

/**
 * Second half of generation: landmarks, buildings, props, walls.
 * Split out purely so each half stays readable.
 */
function finishDistrict(ctx) {
  const { def, rng, group, blocks, reserved, claim, addCollider, half, batches, helpers, landmarks, mapBuildings } = ctx;
  const { propB, glowB, styleB, walkB } = batches;
  const { prop, glow } = helpers;

  // --- reserve landmark blocks --------------------------------------------
  const near = (tx, tz) => (b) => Math.hypot(b.cx - tx, b.cz - tz);
  const wantsBig = (tx, tz) => (b) => (b.w > 30 && b.d > 30 ? Math.hypot(b.cx - tx, b.cz - tz) : null);

  if (def.id === 'slums') {
    claim('scrapyard', wantsBig(-70, 20));
    claim('standpipe', wantsBig(60, 60));
    claim('impound', wantsBig(70, -60));
    claim('castingVan', wantsBig(-20, -70));
    claim('deepaHut', near(-25, 55));
  } else if (def.id === 'midtown') {
    claim('vantaOffice', wantsBig(0, -25));
    claim('depot', wantsBig(-70, 60));
    claim('studio9', wantsBig(70, 20));
    claim('loop', wantsBig(-60, -60));
  } else if (def.id === 'heights') {
    claim('villa', wantsBig(-60, 25));
    claim('pavilion', wantsBig(55, 55));
    claim('emptyHouse', wantsBig(65, -55));
    claim('spire', wantsBig(-25, -60));
  }

  // --- fill the ordinary blocks -------------------------------------------
  for (const b of blocks) {
    if (reserved.has(b.bx + ',' + b.bz)) continue;
    fillBlock(ctx, b);
  }

  // --- landmark construction ----------------------------------------------
  buildLandmarks(ctx);

  // --- street furniture ----------------------------------------------------
  streetFurniture(ctx);
  const lamps = buildLampPosts(ctx);

  // --- perimeter wall ------------------------------------------------------
  buildWall(ctx);

  // --- hoardings -----------------------------------------------------------
  buildHoardings(ctx);

  // --- commit batches ------------------------------------------------------
  batches.groundB.build(group, { cast: false });
  batches.roadB.build(group, { cast: false });
  walkB.build(group, { cast: false });
  for (const sb of styleB) sb.build(group);
  propB.build(group);
  const glowMesh = glowB.build(group, { cast: false, receive: false });
  if (glowMesh) glowMesh.renderOrder = 1;

  group.visible = false;

  return {
    def,
    group,
    grid: ctx.grid,
    colliders: ctx.colliders,
    mapBuildings,
    mapRoads: ctx.mapRoads,
    landmarks,
    lamps,
    half,
    materials: ctx.materials,
    dispose() {
      group.traverse((n) => { if (n.isMesh) n.geometry.dispose(); });
    },
  };
}

// ------------------------------------------------------------ block filling ---

function fillBlock(ctx, b) {
  const { def, rng, batches, addCollider, mapBuildings } = ctx;
  const inset = 3.2;
  const x0 = b.x0 + inset, x1 = b.x1 - inset;
  const z0 = b.z0 + inset, z1 = b.z1 - inset;
  const bw = x1 - x0, bd = z1 - z0;
  if (bw < 4 || bd < 4) return;

  const cols = Math.max(1, Math.round(bw / def.density));
  const rows = Math.max(1, Math.round(bd / def.density));
  const cw = bw / cols, cd = bd / rows;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (rng() > def.fill) continue;
      const cx = x0 + cw * (i + 0.5);
      const cz = z0 + cd * (j + 0.5);
      const w = cw * rng.range(0.62, 0.94);
      const d = cd * rng.range(0.62, 0.94);
      const tall = rng.chance(def.tallChance);
      const h = tall
        ? rng.range(def.tallHeight[0], def.tallHeight[1])
        : rng.range(def.heightRange[0], def.heightRange[1]);
      const si = tall && def.styles.length > 2
        ? rng.int(2, def.styles.length - 1)
        : rng.int(0, def.styles.length - 1);
      addBuilding(ctx, cx, cz, w, d, h, si);
    }
  }
}

function addBuilding(ctx, cx, cz, w, d, h, styleIndex) {
  const { def, rng, batches, addCollider, mapBuildings, helpers } = ctx;
  const style = def.styles[styleIndex];
  const geo = texBox(w, h, d, style.tile);
  batches.styleB[styleIndex].add(place(geo, cx, h / 2 + 0.14, cz));

  addCollider(new Box(cx, cz, w / 2, d / 2, h, 'building'));
  mapBuildings.push({ x: cx, z: cz, w, d, h });

  // Roof: overhanging slab, plus whatever people put up there.
  const roofColor = def.id === 'slums' ? 0x6a5a44 : def.id === 'heights' ? 0xc8bda4 : 0x2a2e36;
  helpers.prop(cbox(w + 0.6, 0.3, d + 0.6), roofColor, cx, h + 0.3, cz);

  if (def.id === 'slums') {
    // Tarps and stones holding a roof down say more than any dialogue.
    if (rng.chance(0.55)) {
      helpers.prop(cbox(w * 0.7, 0.12, d * 0.7), rng.pick([0x2f5a8a, 0x7a3f2f, 0x4a6a3f]),
        cx + rng.range(-1, 1), h + 0.5, cz + rng.range(-1, 1), rng.range(-0.3, 0.3));
    }
    for (let k = 0; k < rng.int(2, 5); k++) {
      helpers.prop(ccyl(0.14, 0.18, 0.2, 6), 0x8a8276,
        cx + rng.range(-w / 2, w / 2) * 0.8, h + 0.5, cz + rng.range(-d / 2, d / 2) * 0.8);
    }
    if (rng.chance(0.3)) {
      // Water drum on stilts.
      helpers.prop(ccyl(0.55, 0.55, 0.9, 8), 0x3f6a8a, cx, h + 1.0, cz - d * 0.25);
    }
    if (rng.chance(0.25)) {
      helpers.prop(cbox(0.06, 2.4, 0.06), 0x3a3a3a, cx + w * 0.3, h + 1.5, cz + d * 0.3);
    }
  } else if (h > 14) {
    // Plant, tanks, aerials.
    for (let k = 0; k < rng.int(1, 4); k++) {
      const uw = rng.range(1.2, 2.6);
      helpers.prop(cbox(uw, rng.range(0.8, 1.6), uw), 0x8e939c,
        cx + rng.range(-w / 2 + 2, w / 2 - 2), h + 0.9, cz + rng.range(-d / 2 + 2, d / 2 - 2));
    }
    if (rng.chance(0.4)) {
      helpers.prop(ccyl(0.08, 0.08, rng.range(3, 7), 5), 0x9aa0a8, cx + rng.range(-2, 2), h + 3.4, cz + rng.range(-2, 2));
    }
    if (rng.chance(0.5)) {
      // Aircraft warning light - a red pulse over the whole skyline.
      helpers.glow(new THREE.SphereGeometry(0.22, 6, 5), 0xff3b30, cx, h + 0.7, cz);
    }
    if (def.neon && rng.chance(0.35)) {
      const nh = rng.range(3, 6);
      helpers.glow(cbox(0.3, nh, 0.3), rng.pick([0xff3d8a, 0x3df0ff, 0xffd23f, 0x9d5cff]),
        cx + w / 2 * 0.9, h * 0.6, cz);
    }
  }

  if (def.id === 'heights' && rng.chance(0.5)) {
    // Colonnade across the front of the villa.
    const n = Math.max(2, Math.round(w / 4));
    for (let k = 0; k < n; k++) {
      const px = cx - w / 2 + (w / (n - 1 || 1)) * k;
      helpers.prop(ccyl(0.32, 0.36, h * 0.8, 8), 0xf0ead8, px, h * 0.4 + 0.14, cz + d / 2 + 0.9);
      addCollider(new Box(px, cz + d / 2 + 0.9, 0.42, 0.42, h * 0.8, 'prop'));
    }
    helpers.prop(cbox(w + 2.4, 0.4, 2.6), 0xf4efe2, cx, h * 0.8 + 0.34, cz + d / 2 + 0.9);
  }
}

// -------------------------------------------------------------- landmarks ---

function buildLandmarks(ctx) {
  const { def, rng, landmarks, addCollider, helpers, batches, mapBuildings } = ctx;
  const L = landmarks;
  const solid = (x, z, hw, hd, h) => addCollider(new Box(x, z, hw, hd, h, 'prop'));

  const pad = (b, color, h = 0.2) => helpers.prop(cbox(b.w - 2, h, b.d - 2), color, b.cx, 0.16 + h / 2, b.cz);

  if (def.id === 'slums') {
    if (L.scrapyard) {
      const b = L.scrapyard;
      b.label = "Deepa's Scrapyard";
      b.spot = { x: b.cx, z: b.cz };
      pad(b, 0x5a4a36);
      // Chain fence.
      fence(ctx, b, 0x6a6a62, 2.6);
      // Heaps of salvage.
      for (let i = 0; i < 26; i++) {
        const x = b.cx + rng.range(-b.w / 2 + 5, b.w / 2 - 5);
        const z = b.cz + rng.range(-b.d / 2 + 5, b.d / 2 - 5);
        const s = rng.range(0.6, 2.2);
        helpers.prop(cbox(s, s * rng.range(0.4, 1.1), s), rng.pick([0x8a6a4a, 0x6f7a6a, 0x96794f, 0x7a4a3a]),
          x, s * 0.4, z, rng() * TAU);
        solid(x, z, s * 0.62, s * 0.62, s);
      }
      // A crushed car on the pile, tyres to the sky.
      helpers.prop(cbox(4.2, 1.1, 1.9), 0x6a4a3a, b.cx + 6, 2.4, b.cz - 5, 0.5);
      solid(b.cx + 6, b.cz - 5, 2.2, 1.6, 3.2);
      const hut = { w: 6, d: 5, h: 3.4 };
      addBuilding(ctx, b.cx - b.w / 4, b.cz + b.d / 4, hut.w, hut.d, hut.h, 0);
    }
    if (L.standpipe) {
      const b = L.standpipe;
      b.label = 'Standpipe 4';
      b.spot = { x: b.cx + 5, z: b.cz + 5 };
      pad(b, 0x6a6258);
      helpers.prop(ccyl(0.22, 0.26, 3.2, 8), 0x7a8a92, b.cx, 1.6, b.cz);
      helpers.prop(cbox(1.6, 0.3, 1.6), 0x8a8a84, b.cx, 0.35, b.cz);
      solid(b.cx, b.cz, 0.9, 0.9, 3.2);
      // The queue of empty cans that never gets shorter.
      for (let i = 0; i < 16; i++) {
        const a = i * 0.5;
        helpers.prop(ccyl(0.22, 0.22, 0.42, 6), rng.pick([0x3f6a8a, 0xd8c04a, 0xc85a3a]),
          b.cx + Math.cos(a) * (3 + i * 0.5), 0.4, b.cz + Math.sin(a) * (3 + i * 0.5));
      }
    }
    if (L.impound) {
      const b = L.impound;
      b.label = 'Municipal Impound';
      b.spot = { x: b.cx, z: b.cz };
      pad(b, 0x4a4a48);
      fence(ctx, b, 0x8a3f2f, 3.2);
      for (let i = 0; i < 6; i++) {
        const cx = b.cx - b.w / 2 + 6 + (i % 3) * 7;
        const cz = b.cz - 6 + Math.floor(i / 3) * 8;
        helpers.prop(cbox(3.8, 1.2, 1.7), rng.pick([0x5a5a62, 0x6a4a3a, 0x3f5a4a]),
          cx, 0.8, cz, rng.range(-0.2, 0.2));
        solid(cx, cz, 2.0, 1.2, 1.4);
      }
    }
    if (L.castingVan) {
      const b = L.castingVan;
      b.label = 'VANTA Mobile Casting';
      b.spot = { x: b.cx, z: b.cz + 4 };
      pad(b, 0x3a3a42);
      // A stage, a queue rail, and a very clean van in a very dirty place.
      helpers.prop(cbox(9, 0.6, 5), 0x8a2f3a, b.cx, 0.5, b.cz - 3);
      helpers.prop(cbox(7.5, 2.8, 0.3), 0xb5203f, b.cx, 2.2, b.cz - 5.4);
      solid(b.cx, b.cz - 5.4, 3.8, 0.4, 3.6);
      for (let i = -3; i <= 3; i++) {
        helpers.prop(ccyl(0.09, 0.09, 1.0, 6), 0xc8c8c8, b.cx + i * 1.8, 0.7, b.cz + 5);
      }
      helpers.glow(cbox(6.4, 1.6, 0.1), 0xffe08a, b.cx, 3.4, b.cz - 5.6);
    }
    if (L.deepaHut) {
      L.deepaHut.label = "Deepa's Place";
      L.deepaHut.spot = { x: L.deepaHut.cx, z: L.deepaHut.cz };
    }
  }

  if (def.id === 'midtown') {
    if (L.vantaOffice) {
      const b = L.vantaOffice;
      b.label = 'VANTA Midtown';
      b.spot = { x: b.cx, z: b.cz + b.d / 2 - 5 };
      pad(b, 0x2a2e36);
      addBuilding(ctx, b.cx, b.cz - 3, Math.min(b.w - 6, 26), Math.min(b.d - 10, 22), 68, 2);
      // Lobby canopy and the logo wall.
      helpers.prop(cbox(18, 0.5, 5), 0x1a1d24, b.cx, 5.2, b.cz + b.d / 2 - 7);
      helpers.glow(cbox(14, 2.2, 0.2), 0xb5203f, b.cx, 6.8, b.cz + b.d / 2 - 9.4);
      for (const s of [-1, 1]) {
        helpers.prop(ccyl(0.5, 0.5, 5, 10), 0x3a3f48, b.cx + s * 8, 2.7, b.cz + b.d / 2 - 5);
      }
    }
    if (L.depot) {
      const b = L.depot;
      b.label = 'Collections Depot';
      b.spot = { x: b.cx, z: b.cz };
      pad(b, 0x35353c);
      fence(ctx, b, 0x4a4a52, 3.0);
      addBuilding(ctx, b.cx, b.cz - b.d / 4, b.w - 12, b.d / 3, 9, 4);
      for (let i = 0; i < 4; i++) {
        helpers.prop(cbox(2.2, 2.6, 5), 0x36506e, b.cx - 9 + i * 6, 1.5, b.cz + b.d / 4);
        solid(b.cx - 9 + i * 6, b.cz + b.d / 4, 1.2, 2.6, 2.8);
      }
      helpers.glow(cbox(9, 1.2, 0.15), 0xff9a2f, b.cx, 10.6, b.cz - b.d / 4 + b.d / 6);
    }
    if (L.studio9) {
      const b = L.studio9;
      b.label = 'Studio 9';
      b.spot = { x: b.cx, z: b.cz + b.d / 2 - 5 };
      pad(b, 0x2f2a34);
      addBuilding(ctx, b.cx, b.cz - 4, b.w - 10, b.d * 0.4, 14, 4);
      // Lighting rig over the forecourt.
      for (let i = -2; i <= 2; i++) {
        helpers.prop(ccyl(0.12, 0.12, 7, 6), 0x2a2a30, b.cx + i * 5, 3.5, b.cz + b.d / 2 - 6);
        solid(b.cx + i * 5, b.cz + b.d / 2 - 6, 0.28, 0.28, 7);
        helpers.glow(cbox(0.9, 0.5, 0.5), 0xfff2c0, b.cx + i * 5, 7.2, b.cz + b.d / 2 - 6);
      }
    }
    if (L.loop) {
      const b = L.loop;
      b.label = 'The Loop';
      b.spot = { x: b.cx, z: b.cz };
      pad(b, 0x3a3444);
      // A ring of plinths where people stand to be seen.
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        helpers.prop(ccyl(1.5, 1.7, 0.7, 10), 0x555060, b.cx + Math.cos(a) * 11, 0.5, b.cz + Math.sin(a) * 11);
        solid(b.cx + Math.cos(a) * 11, b.cz + Math.sin(a) * 11, 1.6, 1.6, 0.85);
        helpers.glow(new THREE.TorusGeometry(1.5, 0.06, 6, 16).rotateX(Math.PI / 2), 0x3df0ff,
          b.cx + Math.cos(a) * 11, 0.9, b.cz + Math.sin(a) * 11);
      }
      helpers.glow(ccyl(0.6, 0.6, 9, 8), 0xff3d8a, b.cx, 4.6, b.cz);
    }
  }

  if (def.id === 'heights') {
    if (L.villa) {
      const b = L.villa;
      b.label = 'Vale Residence';
      b.spot = { x: b.cx - b.w / 4, z: b.cz + b.d / 2 - 6 };
      pad(b, 0xd8d2bc, 0.3);
      addBuilding(ctx, b.cx, b.cz - 4, b.w - 14, b.d * 0.42, 11, 0);
      poolAt(ctx, b.cx, b.cz + b.d / 4, 10, 5);
      hedgeRing(ctx, b);
    }
    if (L.pavilion) {
      const b = L.pavilion;
      b.label = 'The Pavilion';
      b.spot = { x: b.cx, z: b.cz + 6 };
      pad(b, 0xe8e2d0, 0.3);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        helpers.prop(ccyl(0.4, 0.44, 7, 8), 0xfaf6ea, b.cx + Math.cos(a) * 9, 3.6, b.cz + Math.sin(a) * 9);
        solid(b.cx + Math.cos(a) * 9, b.cz + Math.sin(a) * 9, 0.5, 0.5, 7);
      }
      helpers.prop(ccyl(11, 11.5, 0.7, 12), 0xf0e8d4, b.cx, 7.4, b.cz);
      addCollider(new Box(b.cx, b.cz, 2.5, 2.5, 8, 'building'));
      helpers.glow(new THREE.SphereGeometry(0.9, 8, 6), 0xffe9b0, b.cx, 6.4, b.cz);
    }
    if (L.emptyHouse) {
      const b = L.emptyHouse;
      b.label = 'The Empty House';
      b.spot = { x: b.cx, z: b.cz + b.d / 2 - 6 };
      pad(b, 0xb8b4a0, 0.25);
      addBuilding(ctx, b.cx, b.cz, b.w - 16, b.d * 0.4, 10, 1);
      // Boarded windows and a lawn nobody cuts.
      for (let i = 0; i < 5; i++) {
        helpers.prop(cbox(3, 0.2, 0.2), 0x6a5a44, b.cx - 6 + i * 3, 4, b.cz + b.d * 0.2 + 0.4, rng.range(-0.3, 0.3));
      }
      hedgeRing(ctx, b, 0x4a5a38);
    }
    if (L.spire) {
      const b = L.spire;
      b.label = 'VANTA Spire';
      b.spot = { x: b.cx, z: b.cz + b.d / 2 - 6 };
      pad(b, 0xdad4c0, 0.3);
      addBuilding(ctx, b.cx, b.cz, 18, 18, 74, 3);
      helpers.glow(cbox(11, 2.4, 0.2), 0xb5203f, b.cx, 12, b.cz + 9.3);
      helpers.prop(ccyl(0.3, 0.3, 14, 6), 0xc8c8d0, b.cx, 81, b.cz);
      helpers.glow(new THREE.SphereGeometry(0.8, 8, 6), 0xff3b30, b.cx, 88.5, b.cz);
      // The way down. It is not advertised.
      helpers.prop(cbox(5, 0.4, 5), 0x3a3a3f, b.cx + 12, 0.4, b.cz + 12);
      helpers.glow(cbox(3.4, 0.1, 3.4), 0x53d0ff, b.cx + 12, 0.62, b.cz + 12);
      L.spire.descent = { x: b.cx + 12, z: b.cz + 12 };
    }
  }
}

const _clearScratch = [];

/**
 * True if a rectangular footprint of open ground exists here - nothing solid
 * taller than `minHeight` overlapping it. Used to stop hoardings and poster
 * boards being planted inside buildings or on top of each other.
 */
function stripClear(ctx, cx, cz, facing, length, depth, minHeight = 0.6) {
  const ax = Math.cos(facing), az = -Math.sin(facing);   // along the panel
  const samples = Math.max(3, Math.round(length / 2));
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples - 0.5) * length;
    const px = cx + ax * t;
    const pz = cz + az * t;
    const boxes = ctx.grid.query(px, pz, depth + 2, _clearScratch);
    for (const b of boxes) {
      if (b.disabled || b.height < minHeight) continue;
      if (Math.abs(px - b.x) < b.hw + depth && Math.abs(pz - b.z) < b.hd + depth) return false;
    }
  }
  return true;
}

function fence(ctx, b, color, h) {
  const { helpers, addCollider } = ctx;
  const t = 0.16;
  const hw = b.w / 2 - 1, hd = b.d / 2 - 1;
  helpers.prop(cbox(hw * 2, h, t), color, b.cx, h / 2, b.cz - hd);
  helpers.prop(cbox(hw * 2, h, t), color, b.cx, h / 2, b.cz + hd);
  helpers.prop(cbox(t, h, hd * 2), color, b.cx - hw, h / 2, b.cz);
  // The gap on the +X side is the way in.
  helpers.prop(cbox(t, h, hd * 0.7), color, b.cx + hw, h / 2, b.cz - hd * 0.65);
  helpers.prop(cbox(t, h, hd * 0.7), color, b.cx + hw, h / 2, b.cz + hd * 0.65);
  addCollider(new Box(b.cx, b.cz - hd, hw, t, h, 'fence'));
  addCollider(new Box(b.cx, b.cz + hd, hw, t, h, 'fence'));
  addCollider(new Box(b.cx - hw, b.cz, t, hd, h, 'fence'));
  addCollider(new Box(b.cx + hw, b.cz - hd * 0.65, t, hd * 0.35, h, 'fence'));
  addCollider(new Box(b.cx + hw, b.cz + hd * 0.65, t, hd * 0.35, h, 'fence'));
}

function poolAt(ctx, x, z, w, d) {
  const { helpers, addCollider } = ctx;
  helpers.prop(cbox(w + 1.6, 0.3, d + 1.6), 0xf0ead8, x, 0.3, z);
  helpers.glow(cbox(w, 0.06, d), 0x4fc3e8, x, 0.48, z);
  addCollider(new Box(x, z, w / 2 + 0.8, d / 2 + 0.8, 0.5, 'pool'));
}

function hedgeRing(ctx, b, color = 0x2f5c2a) {
  const { helpers, rng } = ctx;
  const hw = b.w / 2 - 1.5, hd = b.d / 2 - 1.5;
  const step = 2.4;
  const solid = (x, z, hx, hz) => ctx.addCollider(new Box(x, z, hx, hz, 1.55, 'hedge'));
  for (let x = -hw; x <= hw; x += step) {
    // A gap at the front, or the house has no way in.
    if (Math.abs(x) < 4) continue;
    helpers.prop(cbox(step * 0.95, 1.4, 1.1), color, b.cx + x, 0.85, b.cz + hd);
    helpers.prop(cbox(step * 0.95, 1.4, 1.1), color, b.cx + x, 0.85, b.cz - hd);
    solid(b.cx + x, b.cz + hd, step * 0.5, 0.6);
    solid(b.cx + x, b.cz - hd, step * 0.5, 0.6);
  }
  for (let z = -hd; z <= hd; z += step) {
    helpers.prop(cbox(1.1, 1.4, step * 0.95), color, b.cx - hw, 0.85, b.cz + z);
    helpers.prop(cbox(1.1, 1.4, step * 0.95), color, b.cx + hw, 0.85, b.cz + z);
    solid(b.cx - hw, b.cz + z, 0.6, step * 0.5);
    solid(b.cx + hw, b.cz + z, 0.6, step * 0.5);
  }
}

// -------------------------------------------------------- street furniture ---

function streetFurniture(ctx) {
  const { def, rng, helpers, addCollider, half } = ctx;

  // Lights on every intersection corner, and along the carriageways. The arm
  // always reaches out over the road it is lighting.
  const off = def.roadHalf + 1.4;
  for (const rx of def.roads) {
    for (const rz of def.roads) {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          streetLight(ctx, rx + sx * off, rz + sz * off, Math.atan2(-sx, -sz));
        }
      }
    }
  }
  for (const r of def.roads) {
    for (let p = -half + 26; p < half - 26; p += 26) {
      if (def.roads.some((o) => Math.abs(p - o) < 14)) continue;
      streetLight(ctx, p, r + off, Math.PI);
      streetLight(ctx, r + off, p, -Math.PI / 2);
    }
  }

  const scatter = def.id === 'slums' ? 220 : def.id === 'midtown' ? 150 : 110;
  for (let i = 0; i < scatter; i++) {
    // Keep clutter on the pavement, never in the middle of a carriageway.
    const x = rng.range(-half + 6, half - 6);
    const z = rng.range(-half + 6, half - 6);
    const onRoad = def.roads.some((r) => Math.abs(x - r) < def.roadHalf) ||
      def.roads.some((r) => Math.abs(z - r) < def.roadHalf);
    if (onRoad) continue;

    if (def.id === 'slums') {
      const k = rng();
      if (k < 0.24) barrel(ctx, x, z, rng.chance(0.3));
      else if (k < 0.42) tyrePile(ctx, x, z);
      else if (k < 0.58) crates(ctx, x, z);
      else if (k < 0.72) awning(ctx, x, z);
      else if (k < 0.86) handCart(ctx, x, z);
      else rubble(ctx, x, z);
    } else if (def.id === 'midtown') {
      const k = rng();
      if (k < 0.2) dumpster(ctx, x, z);
      else if (k < 0.4) bench(ctx, x, z);
      else if (k < 0.58) planter(ctx, x, z);
      else if (k < 0.74) bollards(ctx, x, z);
      else if (k < 0.9) adScreenPost(ctx, x, z);
      else crates(ctx, x, z);
    } else {
      const k = rng();
      if (k < 0.34) palm(ctx, x, z);
      else if (k < 0.56) topiary(ctx, x, z);
      else if (k < 0.72) bench(ctx, x, z, 0xe8e2d0);
      else if (k < 0.88) planter(ctx, x, z, 0xf0ead8);
      else statue(ctx, x, z);
    }
  }
}

/**
 * Street lights are registered rather than merged, because unlike the rest of
 * the furniture you are allowed to drive into them.
 */
function streetLight(ctx, x, z, ry) {
  const i = ctx.lights.length;
  ctx.lights.push({ x, z, ry, angle: 0, av: 0, down: false, fx: 0, fz: 1 });
  const box = new Box(x, z, 0.3, 0.3, ctx.def.id === 'slums' ? 5.5 : 7.5, 'lamp');
  box.lamp = i;
  ctx.addCollider(box);
}

/**
 * Every lamp post in a district as two InstancedMeshes - one for the metal, one
 * for the lit panel. Two draw calls for ~150 posts, and any one of them can
 * still be knocked flat, because rewriting a single instance matrix is cheap.
 */
export class LampField {
  constructor(body, lamp, lights, colliders, litColor) {
    this.body = body;
    this.lamp = lamp;
    this.lights = lights;
    this.colliders = colliders;
    this.litColor = litColor;
    this.dark = new THREE.Color(0x24242a);
    this.falling = [];
    this._m = new THREE.Matrix4();
    this._r = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._axis = new THREE.Vector3();
    for (let i = 0; i < lights.length; i++) this.write(i);
    this.body.instanceMatrix.needsUpdate = true;
    this.lamp.instanceMatrix.needsUpdate = true;
  }

  /** Compose T * fall * yaw for one post and push it to both meshes. */
  write(i) {
    const l = this.lights[i];
    this._r.makeRotationY(l.ry);
    if (l.angle > 0.0001) {
      // Tip about the horizontal axis perpendicular to the direction of travel.
      this._axis.set(-l.fz, 0, l.fx).normalize();
      this._q.setFromAxisAngle(this._axis, l.angle);
      this._m.makeRotationFromQuaternion(this._q);
      this._r.premultiply(this._m);
    }
    this._r.setPosition(l.x, 0, l.z);
    this.body.setMatrixAt(i, this._r);
    this.lamp.setMatrixAt(i, this._r);
  }

  /** Shove post `i` over in the direction the thing that hit it was going. */
  knock(i, dx, dz) {
    const l = this.lights[i];
    if (!l || l.down) return false;
    const len = Math.hypot(dx, dz) || 1;
    l.fx = dx / len;
    l.fz = dz / len;
    l.down = true;
    l.av = 1.1;
    if (this.colliders[i]) this.colliders[i].disabled = true;
    this.lamp.setColorAt(i, this.dark);
    if (this.lamp.instanceColor) this.lamp.instanceColor.needsUpdate = true;
    this.falling.push(i);
    return true;
  }

  update(dt) {
    if (!this.falling.length) return;
    for (let k = this.falling.length - 1; k >= 0; k--) {
      const i = this.falling[k];
      const l = this.lights[i];
      // Topples under its own weight, then settles after one dull bounce.
      l.av += 5.2 * Math.cos(l.angle) * dt + 1.4 * dt;
      l.angle += l.av * dt;
      if (l.angle >= Math.PI / 2) {
        l.angle = Math.PI / 2;
        if (l.av > 1.6) l.av = -l.av * 0.18;
        else { l.av = 0; this.falling.splice(k, 1); }
      }
      this.write(i);
    }
    this.body.instanceMatrix.needsUpdate = true;
    this.lamp.instanceMatrix.needsUpdate = true;
  }

  /** Stand every post back up, for when a district is re-entered. */
  reset() {
    let any = false;
    for (let i = 0; i < this.lights.length; i++) {
      const l = this.lights[i];
      if (!l.down) continue;
      l.down = false; l.angle = 0; l.av = 0;
      if (this.colliders[i]) this.colliders[i].disabled = false;
      this.lamp.setColorAt(i, this.litColor);
      this.write(i);
      any = true;
    }
    this.falling.length = 0;
    if (!any) return;
    this.body.instanceMatrix.needsUpdate = true;
    this.lamp.instanceMatrix.needsUpdate = true;
    if (this.lamp.instanceColor) this.lamp.instanceColor.needsUpdate = true;
  }
}

function buildLampPosts(ctx) {
  const { def, group, lights, colliders } = ctx;
  if (!lights.length) return null;
  const h = def.id === 'slums' ? 5.5 : 7.5;
  const col = def.id === 'heights' ? 0xdcd6c4 : 0x3a3a40;

  // One post, built at the origin with its arm reaching along +Z.
  const bodyGeo = mergeGeometries([
    place(ccyl(0.11, 0.15, h, 6), 0, h / 2, 0),
    place(cbox(0.12, 0.12, 1.7), 0, h, 0.85),
    place(cbox(0.5, 0.18, 1.0), 0, h - 0.12, 0.85),
  ]);
  const lampGeo = place(cbox(0.42, 0.06, 0.86), 0, h - 0.22, 0.85);

  const body = new THREE.InstancedMesh(
    bodyGeo, new THREE.MeshLambertMaterial({ color: col }), lights.length);
  body.castShadow = true;
  body.receiveShadow = true;
  body.frustumCulled = false;

  const lamp = new THREE.InstancedMesh(
    lampGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), lights.length);
  lamp.frustumCulled = false;
  const lit = new THREE.Color(def.id === 'midtown' ? 0xbfe4ff : 0xffdca0);
  for (let i = 0; i < lights.length; i++) lamp.setColorAt(i, lit);

  group.add(body, lamp);

  const lampColliders = colliders.filter((c) => c.tag === 'lamp');
  return new LampField(body, lamp, lights, lampColliders, lit);
}


function barrel(ctx, x, z, burning) {
  const { helpers, addCollider, rng } = ctx;
  helpers.prop(ccyl(0.42, 0.42, 1.1, 8), rng.pick([0x7a4a2a, 0x3f5a4a, 0x6a2f2a]), x, 0.55, z);
  if (burning) {
    helpers.glow(ccyl(0.3, 0.05, 1.1, 6), 0xff8a2a, x, 1.55, z);
    helpers.glow(ccyl(0.18, 0.02, 0.6, 6), 0xffe08a, x, 1.9, z);
  }
  addCollider(new Box(x, z, 0.45, 0.45, 1.1, 'prop'));
}

function tyrePile(ctx, x, z) {
  const { helpers, rng, addCollider } = ctx;
  const n = rng.int(3, 6);
  for (let i = 0; i < n; i++) {
    const t = new THREE.TorusGeometry(0.42, 0.16, 5, 10).rotateX(Math.PI / 2);
    helpers.prop(t, 0x1e1e20, x + rng.range(-0.12, 0.12), 0.16 + i * 0.3, z + rng.range(-0.12, 0.12), rng() * TAU);
  }
  addCollider(new Box(x, z, 0.6, 0.6, n * 0.3, 'prop'));
}

function crates(ctx, x, z) {
  const { helpers, rng, addCollider } = ctx;
  const n = rng.int(2, 5);
  for (let i = 0; i < n; i++) {
    const s = rng.range(0.5, 0.85);
    helpers.prop(cbox(s, s, s), rng.pick([0x8a6a3f, 0x6a5a34, 0x9a7a4a]),
      x + rng.range(-0.5, 0.5), s / 2 + i * 0.5, z + rng.range(-0.5, 0.5), rng() * TAU);
  }
  addCollider(new Box(x, z, 0.8, 0.8, n * 0.5, 'prop'));
}

/** A market stall: canopy, counter, and something on the counter to sell. */
function awning(ctx, x, z) {
  const { helpers, rng, addCollider } = ctx;
  const c = rng.pick([0x2f5a8a, 0x8a3f2f, 0x4a6a3f, 0x8a7a2f]);
  const r = rng() * TAU;
  const fx = Math.sin(r), fz = Math.cos(r);
  const ax = Math.cos(r), az = -Math.sin(r);

  // Canopy, pitched slightly so it is not a floating table top.
  helpers.prop(cbox(3.2, 0.1, 1.4), c, x - fx * 0.5, 2.45, z - fz * 0.5, r);
  helpers.prop(cbox(3.2, 0.1, 1.3), c, x + fx * 0.62, 2.24, z + fz * 0.62, r);
  helpers.prop(cbox(3.2, 0.34, 0.08), c, x + fx * 1.2, 2.0, z + fz * 1.2, r);

  // Counter.
  helpers.prop(cbox(2.9, 0.9, 1.0), 0x6a563c, x, 0.45, z, r);
  helpers.prop(cbox(3.1, 0.09, 1.2), 0x8a7250, x, 0.94, z, r);
  addCollider(new Box(x, z, 1.5, 0.7, 1.0, 'prop'));

  // Goods.
  for (let i = 0; i < rng.int(2, 5); i++) {
    const t = (i / 4 - 0.4) * 2.2;
    helpers.prop(cbox(0.42, 0.3, 0.42), rng.pick([0xc8543a, 0x6a8a3a, 0xd8b44a, 0x8a4a6a]),
      x + ax * t, 1.14, z + az * t, rng() * TAU);
  }

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const px = x + ax * sx * 1.45 + fx * sz * 0.9;
      const pz = z + az * sx * 1.45 + fz * sz * 0.9;
      helpers.prop(ccyl(0.055, 0.055, 2.4, 5), 0x4a4238, px, 1.2, pz);
    }
  }
}

function handCart(ctx, x, z) {
  const { helpers, rng, addCollider } = ctx;
  const r = rng() * TAU;
  helpers.prop(cbox(1.9, 0.16, 1.1), 0x7a5a3a, x, 0.75, z, r);
  helpers.prop(cbox(1.9, 0.5, 0.1), 0x6a4a2a, x, 1.0, z, r);
  for (const s of [-1, 1]) {
    const w = new THREE.TorusGeometry(0.34, 0.08, 5, 10);
    helpers.prop(w, 0x2a2a2c, x + Math.cos(r) * s * 0.6, 0.34, z - Math.sin(r) * s * 0.6, r + Math.PI / 2);
  }
  addCollider(new Box(x, z, 1.0, 0.7, 1.1, 'prop'));
}

function rubble(ctx, x, z) {
  const { helpers, rng } = ctx;
  for (let i = 0; i < rng.int(4, 9); i++) {
    const s = rng.range(0.2, 0.6);
    helpers.prop(cbox(s, s * 0.6, s), rng.pick([0x6a6258, 0x7a7268, 0x5a5248]),
      x + rng.range(-1.4, 1.4), s * 0.3, z + rng.range(-1.4, 1.4), rng() * TAU);
  }
}

function dumpster(ctx, x, z) {
  const { helpers, rng, addCollider } = ctx;
  const r = rng() * TAU;
  helpers.prop(cbox(2.4, 1.3, 1.4), rng.pick([0x2f5a4a, 0x4a3f5a, 0x5a4a2f]), x, 0.75, z, r);
  helpers.prop(cbox(2.5, 0.12, 1.5), 0x1f1f24, x, 1.46, z, r);
  addCollider(new Box(x, z, 1.4, 1.0, 1.4, 'prop'));
}

function bench(ctx, x, z, color = 0x4a3f34) {
  const { helpers, rng, addCollider } = ctx;
  const r = rng() * TAU;
  helpers.prop(cbox(2.2, 0.12, 0.7), color, x, 0.5, z, r);
  helpers.prop(cbox(2.2, 0.6, 0.1), color, x - Math.sin(r) * 0.3, 0.85, z - Math.cos(r) * 0.3, r);
  for (const s of [-1, 1]) {
    helpers.prop(cbox(0.12, 0.5, 0.6), 0x2a2a2e, x + Math.cos(r) * s * 0.9, 0.25, z - Math.sin(r) * s * 0.9, r);
  }
  addCollider(new Box(x, z, 1.2, 0.6, 0.9, 'prop'));
}

function planter(ctx, x, z, color = 0x5a5a60) {
  const { helpers, rng, addCollider } = ctx;
  helpers.prop(cbox(1.8, 0.7, 1.8), color, x, 0.5, z);
  helpers.prop(new THREE.SphereGeometry(0.9, 7, 5), rng.pick([0x3f6a34, 0x2f5c2a, 0x4a7a3a]), x, 1.5, z);
  addCollider(new Box(x, z, 0.95, 0.95, 1.0, 'prop'));
}

function bollards(ctx, x, z) {
  const { helpers, rng, addCollider } = ctx;
  const r = rng() * TAU;
  for (let i = -2; i <= 2; i++) {
    const px = x + Math.cos(r) * i * 1.6, pz = z + Math.sin(r) * i * 1.6;
    helpers.prop(ccyl(0.13, 0.15, 0.95, 6), 0x8a8a92, px, 0.48, pz);
    helpers.glow(new THREE.SphereGeometry(0.13, 6, 4), 0xffb03a, px, 0.98, pz);
  }
}

function adScreenPost(ctx, x, z) {
  const { helpers, rng, addCollider } = ctx;
  const r = rng() * TAU;
  helpers.prop(ccyl(0.14, 0.16, 3.2, 6), 0x2a2a30, x, 1.6, z);
  helpers.prop(cbox(1.5, 2.4, 0.16), 0x1a1a20, x, 3.4, z, r);
  helpers.glow(cbox(1.32, 2.2, 0.06), rng.pick([0x3df0ff, 0xff3d8a, 0xffd23f]), x, 3.4, z + 0.1, r);
  addCollider(new Box(x, z, 0.3, 0.3, 4.6, 'prop'));
}

function palm(ctx, x, z) {
  const { helpers, rng, addCollider } = ctx;
  const h = rng.range(5, 9);
  const lean = rng.range(-0.12, 0.12);
  for (let i = 0; i < 6; i++) {
    helpers.prop(ccyl(0.16, 0.2, h / 6, 6), 0x7a6a4a, x + lean * i * 1.2, (i + 0.5) * (h / 6), z);
  }
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU;
    const frond = cbox(0.25, 0.1, 3.2);
    helpers.prop(frond, rng.pick([0x2f6a34, 0x3f7a3a]),
      x + lean * 7.2 + Math.cos(a) * 1.5, h - 0.2 - Math.abs(Math.sin(i)) * 0.3, z + Math.sin(a) * 1.5, a);
  }
  addCollider(new Box(x, z, 0.35, 0.35, h, 'tree'));
}

function topiary(ctx, x, z) {
  const { helpers, rng, addCollider } = ctx;
  const h = rng.range(1.6, 3.2);
  helpers.prop(ccyl(0.16, 0.2, h * 0.4, 6), 0x6a5a44, x, h * 0.2, z);
  const shape = rng.chance(0.5)
    ? new THREE.SphereGeometry(h * 0.42, 8, 6)
    : new THREE.ConeGeometry(h * 0.4, h * 0.9, 8);
  helpers.prop(shape, 0x2f5c2a, x, h * 0.4 + h * 0.4, z);
  addCollider(new Box(x, z, h * 0.4, h * 0.4, h, 'tree'));
}

function statue(ctx, x, z) {
  const { helpers, rng, addCollider } = ctx;
  helpers.prop(cbox(1.6, 1.4, 1.6), 0xe8e2d0, x, 0.7, z);
  helpers.prop(cbox(0.5, 1.6, 0.35), 0xf4efe2, x, 2.2, z);
  helpers.prop(new THREE.SphereGeometry(0.3, 7, 5), 0xf4efe2, x, 3.2, z);
  // Arm raised in the standard pose of a person being photographed.
  helpers.prop(cbox(0.16, 1.1, 0.16), 0xf4efe2, x + 0.42, 2.7, z, 0.5);
  addCollider(new Box(x, z, 0.9, 0.9, 3.4, 'prop'));
}

// ------------------------------------------------------------------ walls ---

function buildWall(ctx) {
  const { def, helpers, addCollider, half, landmarks } = ctx;
  const h = def.id === 'heights' ? 7 : 11;
  const t = 1.6;
  const color = def.wallColor;
  const gateHalf = 9;

  const side = (axis, sign) => {
    const isX = axis === 'x';
    // North (-Z) carries the gate to the next district.
    const isGate = (!isX && sign < 0);
    if (!isGate) {
      const geo = isX ? cbox(t, h, half * 2) : cbox(half * 2, h, t);
      helpers.prop(geo, color, isX ? sign * half : 0, h / 2, isX ? 0 : sign * half);
      // The collider is deliberately thicker than the wall it represents:
      // nothing should ever get out of a district by driving fast enough.
      addCollider(new Box(isX ? sign * half : 0, isX ? 0 : sign * half,
        isX ? 3 : half, isX ? half : 3, h, 'wall'));
    } else {
      const seg = half - gateHalf;
      for (const s of [-1, 1]) {
        const cx = s * (gateHalf + seg / 2);
        helpers.prop(cbox(seg, h, t), color, cx, h / 2, sign * half);
        addCollider(new Box(cx, sign * half, seg / 2, 3, h, 'wall'));
      }
      // Gatehouse.
      for (const s of [-1, 1]) {
        helpers.prop(cbox(2.4, h + 3, 3.2), color, s * gateHalf, (h + 3) / 2, sign * half);
        addCollider(new Box(s * gateHalf, sign * half, 1.2, 1.6, h + 3, 'wall'));
      }
      helpers.prop(cbox(gateHalf * 2 + 4, 2.2, 3.4), color, 0, h + 1.8, sign * half);
      helpers.glow(cbox(gateHalf * 2 - 1, 0.5, 0.2), 0xff3b30, 0, h + 1.8, sign * half + 1.8);
      landmarks.gate = { x: 0, z: sign * half, half: gateHalf, h };
    }
  };

  side('x', -1); side('x', 1); side('z', -1); side('z', 1);

  // Razor wire / decorative crest along the top.
  for (let p = -half; p <= half; p += 4) {
    for (const s of [-1, 1]) {
      helpers.prop(cbox(0.1, 0.7, 0.1), color, s * half, h + 0.35, p);
      if (Math.abs(p) > 12 || s > 0) helpers.prop(cbox(0.1, 0.7, 0.1), color, p, h + 0.35, s * half);
    }
  }
}

// ------------------------------------------------------------- hoardings ---

/** Billboards get their own meshes: few enough to be cheap, loud enough to read. */
function buildHoardings(ctx) {
  const { def, rng, group, helpers, addCollider, half, mapBuildings } = ctx;

  const w = 11, hh = 5.5;
  const y = def.id === 'slums' ? 6.4 : 9.2;
  const legTop = y - hh / 2 + 0.4;

  // Hoardings go on the pavement in front of the buildings, never through
  // them, and never within shouting distance of another hoarding.
  const spots = [];
  const want = def.ads.length * 2;
  for (let guard = 0; guard < 500 && spots.length < want; guard++) {
    const alongX = rng.chance(0.5);
    const r = def.roads[rng.int(0, def.roads.length - 1)];
    const p = rng.range(-half + 30, half - 30);
    if (def.roads.some((o) => Math.abs(p - o) < 18)) continue;
    const off = (def.roadHalf + 2.1) * rng.sign();
    const x = alongX ? p : r + off;
    const z = alongX ? r + off : p;
    const facing = alongX ? (off > 0 ? Math.PI : 0) : (off > 0 ? -Math.PI / 2 : Math.PI / 2);
    if (!stripClear(ctx, x, z, facing, w + 2, 1.8)) continue;
    if (spots.some((o) => (o.x - x) * (o.x - x) + (o.z - z) * (o.z - z) < 38 * 38)) continue;
    spots.push({ x, z, facing, ad: def.ads[spots.length % def.ads.length] });
  }

  for (const s of spots) {
    // Unit vectors: `n` points out of the panel face, `a` runs along it.
    const nx = Math.sin(s.facing), nz = Math.cos(s.facing);
    const ax = Math.cos(s.facing), az = -Math.sin(s.facing);
    const tex = art.billboard(s.ad);
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), mat);
    panel.position.set(s.x + nx * 0.18, y, s.z + nz * 0.18);
    panel.rotation.y = s.facing;
    group.add(panel);

    // Backing board sits behind the artwork; the legs sit behind the board.
    helpers.prop(cbox(w + 0.4, hh + 0.4, 0.3), 0x2a2a2e, s.x, y, s.z, s.facing);
    for (const sx of [-1, 1]) {
      helpers.prop(ccyl(0.16, 0.2, legTop, 6), 0x33333a,
        s.x + ax * sx * (w / 2 - 1.2) - nx * 0.5, legTop / 2,
        s.z + az * sx * (w / 2 - 1.2) - nz * 0.5);
    }
    // Floodlights on the bottom lip, angled up at the artwork.
    for (let i = -2; i <= 2; i++) {
      helpers.glow(cbox(0.5, 0.14, 0.2), 0xfff0c0,
        s.x + ax * i * 2.4 + nx * 0.55, y - hh / 2 - 0.3,
        s.z + az * i * 2.4 + nz * 0.55, s.facing);
    }
    // Only the legs are solid; the panel itself is overhead.
    for (const sx of [-1, 1]) {
      addCollider(new Box(s.x + ax * sx * (w / 2 - 1.2) - nx * 0.5,
        s.z + az * sx * (w / 2 - 1.2) - nz * 0.5, 0.35, 0.35, legTop, 'prop'));
    }
  }

  // Street-level posters pasted on walls.
  for (const p of def.posters) {
    let placed = 0;
    for (let i = 0; i < 60 && placed < 5; i++) {
      const r = def.roads[rng.int(0, def.roads.length - 1)];
      const along = rng.range(-half + 20, half - 20);
      const alongX = rng.chance(0.5);
      const off = (def.roadHalf + 1.6) * rng.sign();
      const x = alongX ? along : r + off;
      const z = alongX ? r + off : along;
      const facing = alongX ? (off > 0 ? Math.PI : 0) : (off > 0 ? -Math.PI / 2 : Math.PI / 2);
      if (!stripClear(ctx, x, z, facing, 2.6, 1.2, 0.5)) continue;
      placed++;
      // Fly-posted onto a plywood board on legs, so it is standing on
      // something rather than floating over the pavement.
      const py = 1.75;
      const tex = art.poster(p);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.9), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      m.position.set(x + Math.sin(facing) * 0.07, py, z + Math.cos(facing) * 0.07);
      m.rotation.y = facing;
      m.rotation.z = rng.range(-0.04, 0.04);
      group.add(m);
      helpers.prop(cbox(1.7, 2.1, 0.09), 0x6a5a44, x, py, z, facing);
      for (const sx of [-1, 1]) {
        helpers.prop(cbox(0.09, py - 0.75, 0.09), 0x554836,
          x + Math.cos(facing) * sx * 0.68, (py - 0.75) / 2, z - Math.sin(facing) * sx * 0.68);
      }
      addCollider(new Box(x, z, 0.85, 0.3, 2.8, 'prop'));
    }
  }

  // Neon shop signs give midtown its glow.
  if (def.neon) {
    const words = ['LOANS', 'CASTING', 'NOODLE', 'PAWN', 'LIVE', 'CLINIC', 'RENTS', 'STUDIO'];
    for (let i = 0; i < 90; i++) {
      const r = def.roads[rng.int(0, def.roads.length - 1)];
      const along = rng.range(-half + 20, half - 20);
      const alongX = rng.chance(0.5);
      const off = (def.roadHalf + 3.4) * rng.sign();
      const x = alongX ? along : r + off;
      const z = alongX ? r + off : along;
      const facing = alongX ? (off > 0 ? Math.PI : 0) : (off > 0 ? -Math.PI / 2 : Math.PI / 2);
      // Only mount a sign where there is actually a wall behind it.
      if (stripClear(ctx, x, z, facing, 1.6, 1.4, 6)) continue;
      const tex = art.neonSign(rng.pick(words), rng.pick([0xff3d8a, 0x3df0ff, 0xffd23f, 0x9d5cff, 0x6dff8a]));
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), new THREE.MeshBasicMaterial({ map: tex }));
      m.position.set(x, 4.5 + rng.range(0, 3), z);
      m.rotation.y = facing;
      group.add(m);
    }
  }
}

// ------------------------------------------------------------------ vault ---

/**
 * The Vault. Hand-built, small, and the only place in Nagesh City with no sky.
 * Everything the districts implied is written on the walls down here.
 */
export function buildVault() {
  const group = new THREE.Group();
  const grid = new SpatialGrid(12);
  const colliders = [];
  const mapBuildings = [];
  const mapRoads = [];
  const rng = makeRNG(66);
  const half = 52;

  const floorMat = new THREE.MeshLambertMaterial({ map: art.concrete(80, 0x3a3d44) });
  const wallMat = new THREE.MeshLambertMaterial({ map: art.concrete(81, 0x2a2d33) });
  const propMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true });

  const floorB = new Batch(floorMat);
  const wallB = new Batch(wallMat);
  const propB = new Batch(propMat);
  const glowB = new Batch(glowMat);
  const prop = (g, c, x, y, z, ry = 0) => propB.add(tint(place(g, x, y, z, ry), c));
  const glow = (g, c, x, y, z, ry = 0) => glowB.add(tint(place(g, x, y, z, ry), c));
  const addCollider = (b) => { colliders.push(b); grid.insert(b); return b; };

  floorB.add(place(plane(half * 2, half * 2, 8), 0, 0, 0));
  // Ceiling, low enough to feel it.
  floorB.add(place(plane(half * 2, half * 2, 8).rotateX(Math.PI), 0, 12, 0));

  // Outer walls.
  for (const [x, z, w, d] of [[0, -half, half * 2, 1.5], [0, half, half * 2, 1.5], [-half, 0, 1.5, half * 2], [half, 0, 1.5, half * 2]]) {
    wallB.add(place(texBox(w, 12, d, 8), x, 6, z));
    addCollider(new Box(x, z, w / 2, d / 2, 12, 'wall'));
  }

  // Server aisles: the ledger, physically.
  const racks = [];
  for (let i = -3; i <= 3; i++) {
    for (let j = -1; j <= 1; j++) {
      const x = i * 12;
      const z = j * 22 - 6;
      // Keep a clear central aisle from the lift all the way to the terminal.
      if (Math.abs(x) < 8) continue;
      prop(cbox(3.2, 6, 12), 0x1a1d23, x, 3, z);
      addCollider(new Box(x, z, 1.8, 6.2, 6, 'building'));
      mapBuildings.push({ x, z, w: 3.6, d: 12.4, h: 6 });
      for (let k = 0; k < 22; k++) {
        glow(cbox(0.1, 0.1, 0.1), rng.chance(0.75) ? 0x4affa0 : 0xff4a4a,
          x + 1.65, 0.6 + (k % 11) * 0.5, z - 5 + Math.floor(k / 11) * 10 + rng.range(-4, 4));
      }
      racks.push({ x, z });
    }
  }

  // The wall of faces at the far end: every contracted celebrity, still smiling.
  const facesTex = art.billboard({
    headline: 'ACTIVE VISIBILITY CONTRACTS', sub: '11,402 faces currently servicing debt',
    bg: 0x1a1d26, face: true, seed: 90, size: 40, brandName: 'VANTA', fine: 'no contract has ever been retired',
  });
  const wallScreen = new THREE.Mesh(new THREE.PlaneGeometry(30, 15), new THREE.MeshBasicMaterial({ map: facesTex }));
  wallScreen.position.set(0, 7.5, -half + 1.2);
  group.add(wallScreen);

  // The terminal you walk up to. This is where the game says it out loud.
  prop(cbox(4, 1.1, 2), 0x2a2e36, 0, 0.55, -half + 10);
  glow(cbox(3.2, 0.06, 1.4), 0x53d0ff, 0, 1.14, -half + 10);
  prop(cbox(4.4, 3.4, 0.3), 0x1a1d23, 0, 2.8, -half + 11.4);
  glow(cbox(3.8, 2.8, 0.06), 0x53d0ff, 0, 2.8, -half + 11.2);
  addCollider(new Box(0, -half + 10.5, 2.4, 1.4, 2, 'prop'));

  // Ceiling strips - the only light down here.
  for (let i = -4; i <= 4; i++) {
    glow(cbox(0.6, 0.08, half * 1.7), 0xbfe4ff, i * 11, 11.6, 0);
  }

  // The lift you arrived in.
  prop(cbox(6, 0.3, 6), 0x3a3f48, 0, 0.16, half - 10);
  glow(cbox(4.6, 0.06, 4.6), 0xffb03a, 0, 0.34, half - 10);

  floorB.build(group, { cast: false });
  wallB.build(group);
  propB.build(group);
  const gm = glowB.build(group, { cast: false, receive: false });
  if (gm) gm.renderOrder = 1;

  group.visible = false;

  return {
    def: {
      id: 'vault', name: 'Sub-Level 9', subtitle: 'VANTA Archive',
      half, spawn: { x: 0, z: half - 10, rot: Math.PI },
      sky: { top: 0x05060a, mid: 0x080a10, bot: 0x0a0c12 },
      fog: { color: 0x070910, near: 8, far: 90 },
      sun: { color: 0xaec6e0, intensity: 0.55, pos: [0, 40, 30] },
      hemi: { sky: 0x5a6f8c, ground: 0x232a34, intensity: 1.15 },
      music: VAULT_MUSIC,
      vehicles: [],
      roads: [], roadHalf: 0,
    },
    group, grid, colliders, mapBuildings, mapRoads,
    landmarks: {
      terminal: { cx: 0, cz: -half + 13, label: 'The Ledger', spot: { x: 0, z: -half + 14 } },
      lift: { cx: 0, cz: half - 10, label: 'Lift', spot: { x: 0, z: half - 10 } },
    },
    half,
    dispose() { group.traverse((n) => { if (n.isMesh) n.geometry.dispose(); }); },
  };
}
