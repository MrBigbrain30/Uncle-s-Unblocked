// Nagesh City - characters, vehicles, drones and pickups.
// All geometry is built from primitives at runtime; nothing is imported.

import * as THREE from '../vendor/three.module.js';
import { makeRNG, clamp, TAU } from './util.js';

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, s = 10, hs = 1, open = false) => new THREE.CylinderGeometry(rt, rb, h, s, hs, open);

function mat(color, opts = {}) {
  return new THREE.MeshLambertMaterial(Object.assign({ color }, opts));
}

// ------------------------------------------------------------- character ---

export const OUTFITS = {
  slum: { skin: 0x8d5a33, shirt: 0x5e6b57, pants: 0x3b3a42, hair: 0x140f0b, accent: 0x8a4a32 },
  midtown: { skin: 0x8d5a33, shirt: 0x2f4f7a, pants: 0x242830, hair: 0x140f0b, accent: 0xd9b45a },
  heights: { skin: 0x8d5a33, shirt: 0xe8e2d2, pants: 0xf0ead8, hair: 0x1a120c, accent: 0xd4af37 },
  vault: { skin: 0x8d5a33, shirt: 0x1b1b22, pants: 0x14141a, hair: 0x1a120c, accent: 0x9b2f2f },
};

/**
 * A blocky humanoid with enough joints to sell a walk cycle.
 * Returns the group plus a stateful `update` for animation.
 */
export function makeCharacter(opts = {}) {
  const o = Object.assign({
    scale: 1, outfit: OUTFITS.slum, hairStyle: 'short', bulk: 1, tall: 1, simple: false,
  }, opts);
  const c = o.outfit;

  const g = new THREE.Group();
  const skinM = mat(c.skin);
  const shirtM = mat(c.shirt);
  const pantsM = mat(c.pants);
  const hairM = mat(c.hair);
  const accentM = mat(c.accent);

  // Hips are the animation root so the whole body can bob.
  const root = new THREE.Group();
  root.position.y = 0.86 * o.tall;
  g.add(root);

  const torso = new THREE.Mesh(box(0.52 * o.bulk, 0.62 * o.tall, 0.3 * o.bulk), shirtM);
  torso.position.y = 0.31 * o.tall;
  root.add(torso);

  const hips = new THREE.Mesh(box(0.46 * o.bulk, 0.18, 0.28 * o.bulk), pantsM);
  hips.position.y = -0.03;
  root.add(hips);

  if (!o.simple) {
    const neck = new THREE.Mesh(box(0.14, 0.1, 0.14), skinM);
    neck.position.y = 0.66 * o.tall;
    root.add(neck);
  }

  const headPivot = new THREE.Group();
  headPivot.position.y = 0.72 * o.tall;
  root.add(headPivot);
  const head = new THREE.Mesh(box(0.34, 0.38, 0.32), skinM);
  head.position.y = 0.19;
  headPivot.add(head);

  // Hair / headwear.
  if (o.hairStyle !== 'bald') {
    const hair = new THREE.Mesh(box(0.37, 0.14, 0.35), hairM);
    hair.position.y = 0.35;
    headPivot.add(hair);
    if (o.hairStyle === 'long') {
      const back = new THREE.Mesh(box(0.34, 0.3, 0.1), hairM);
      back.position.set(0, 0.18, -0.15);
      headPivot.add(back);
    }
    if (o.hairStyle === 'cap') {
      const brim = new THREE.Mesh(box(0.36, 0.04, 0.16), accentM);
      brim.position.set(0, 0.31, 0.22);
      headPivot.add(brim);
    }
  }

  // Crowd characters skip the face: nine of them on screen is nine times the
  // draw calls, and you never see a pedestrian's pupils anyway.
  if (!o.simple) {
    // Nose gives the silhouette a facing direction from behind the camera.
    const nose = new THREE.Mesh(box(0.07, 0.07, 0.07), skinM);
    nose.position.set(0, 0.18, 0.18);
    headPivot.add(nose);

    const eyeM = new THREE.MeshBasicMaterial({ color: 0xf4f0e6 });
    const pupilM = new THREE.MeshBasicMaterial({ color: 0x140f0a });
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(box(0.07, 0.06, 0.02), eyeM);
      eye.position.set(0.08 * s, 0.25, 0.163);
      headPivot.add(eye);
      const pupil = new THREE.Mesh(box(0.032, 0.036, 0.01), pupilM);
      pupil.position.set(0.08 * s, 0.25, 0.174);
      headPivot.add(pupil);
    }
  }

  function limb(w, len, m, px, py) {
    const pivot = new THREE.Group();
    pivot.position.set(px, py, 0);
    const seg = new THREE.Mesh(box(w, len, w), m);
    seg.position.y = -len / 2;
    pivot.add(seg);
    return { pivot, seg };
  }

  const armL = limb(0.145, 0.58 * o.tall, shirtM, -0.35 * o.bulk, 0.58 * o.tall);
  const armR = limb(0.145, 0.58 * o.tall, shirtM, 0.35 * o.bulk, 0.58 * o.tall);
  const legL = limb(0.175, 0.8 * o.tall, pantsM, -0.13 * o.bulk, -0.06);
  const legR = limb(0.175, 0.8 * o.tall, pantsM, 0.13 * o.bulk, -0.06);
  root.add(armL.pivot, armR.pivot, legL.pivot, legR.pivot);

  // Hands and shoes read at distance where fingers never would.
  if (!o.simple) {
    for (const a of [armL, armR]) {
      const hand = new THREE.Mesh(box(0.15, 0.13, 0.15), skinM);
      hand.position.y = -0.58 * o.tall - 0.03;
      a.pivot.add(hand);
    }
    const shoeM = mat(0x24211f);
    for (const l of [legL, legR]) {
      const shoe = new THREE.Mesh(box(0.19, 0.1, 0.28), shoeM);
      shoe.position.set(0, -0.8 * o.tall - 0.03, 0.04);
      l.pivot.add(shoe);
    }
  }

  g.scale.setScalar(o.scale);
  g.traverse((n) => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = false; } });

  const state = { phase: Math.random() * TAU, root, headPivot };

  /**
   * @param dt seconds
   * @param speed metres/sec, drives cadence and stride
   * @param mode 'walk' | 'sit' | 'pose' | 'idle'
   */
  function update(dt, speed, mode = 'walk') {
    if (mode === 'sit') {
      legL.pivot.rotation.x = -1.45; legR.pivot.rotation.x = -1.45;
      legL.pivot.rotation.z = 0; legR.pivot.rotation.z = 0;
      armL.pivot.rotation.x = -1.1; armR.pivot.rotation.x = -1.1;
      armL.pivot.rotation.z = 0.25; armR.pivot.rotation.z = -0.25;
      root.position.y = 0.5 * o.tall;
      root.rotation.x = 0;
      torso.rotation.x = 0.08;
      return;
    }
    root.position.y = 0.86 * o.tall;

    if (mode === 'pose') {
      state.phase += dt * 3;
      armL.pivot.rotation.x = -2.4 + Math.sin(state.phase) * 0.12;
      armR.pivot.rotation.x = -0.4;
      armR.pivot.rotation.z = -0.9;
      armL.pivot.rotation.z = 0.5;
      legL.pivot.rotation.x = 0.12; legR.pivot.rotation.x = -0.12;
      torso.rotation.y = Math.sin(state.phase * 0.5) * 0.18;
      headPivot.rotation.z = 0.14;
      root.position.y += Math.sin(state.phase * 2) * 0.01;
      return;
    }

    const sp = Math.min(speed, 9);
    const cadence = 2.2 + sp * 1.15;
    state.phase += dt * cadence;
    const amp = clamp(sp / 4.2, 0, 1);
    const sw = Math.sin(state.phase);
    const sw2 = Math.sin(state.phase * 2);

    legL.pivot.rotation.x = sw * 0.72 * amp;
    legR.pivot.rotation.x = -sw * 0.72 * amp;
    armL.pivot.rotation.x = -sw * 0.6 * amp;
    armR.pivot.rotation.x = sw * 0.6 * amp;
    armL.pivot.rotation.z = 0.1 + amp * 0.05;
    armR.pivot.rotation.z = -0.1 - amp * 0.05;
    torso.rotation.y = -sw * 0.1 * amp;
    torso.rotation.x = amp * 0.12;
    headPivot.rotation.x = -amp * 0.07;
    root.position.y += Math.abs(sw2) * 0.05 * amp;

    // Idle breathing when standing still.
    if (amp < 0.05) {
      const b = Math.sin(performance.now() * 0.0018) * 0.012;
      root.position.y += b;
      armL.pivot.rotation.x = b * 2;
      armR.pivot.rotation.x = b * 2;
    }
  }

  return { group: g, update, parts: { head: headPivot, torso, armL, armR, legL, legR, root } };
}

// --------------------------------------------------------------- vehicles ---

export const VEHICLE_TYPES = {
  tuk: {
    name: 'Tuk-Tuk', body: 0xf2c53d, roof: 0x1f6f4a, wheels: 3, w: 1.5, l: 2.9, h: 1.0,
    ride: 0.36, wheelR: 0.34, topSpeed: 17, accel: 12, handling: 3.4, grip: 0.86, mass: 0.6,
    engine: { wave: 'square', base: 62, top: 300 }, seatY: 0.62, canopy: true, doors: false,
    seat: { x: 0, y: 0.8, z: 0.24 },
  },
  scooter: {
    name: 'Scooter', body: 0x9a2f2f, roof: 0x9a2f2f, wheels: 2, w: 0.7, l: 1.9, h: 0.7,
    ride: 0.3, wheelR: 0.3, topSpeed: 20, accel: 15, handling: 4.0, grip: 0.8, mass: 0.4,
    engine: { wave: 'sawtooth', base: 80, top: 420 }, seatY: 0.55, canopy: false, doors: false,
    seat: { x: 0, y: 0.88, z: -0.05 },
  },
  hatch: {
    name: 'Hatchback', body: 0xc0c0c8, roof: 0xa8a8b0, wheels: 4, w: 1.8, l: 3.9, h: 1.3,
    ride: 0.35, wheelR: 0.36, topSpeed: 26, accel: 13, handling: 2.7, grip: 1.0, mass: 1.0,
    engine: { wave: 'sawtooth', base: 48, top: 250 }, seatY: 0.72, doors: true,
    seat: { x: 0.42, y: 0.8, z: 0.2 },
  },
  van: {
    name: 'Panel Van', body: 0x36506e, roof: 0x2b405a, wheels: 4, w: 2.05, l: 4.9, h: 1.95,
    ride: 0.4, wheelR: 0.42, topSpeed: 23, accel: 9, handling: 2.1, grip: 0.95, mass: 1.6,
    engine: { wave: 'sawtooth', base: 40, top: 190 }, seatY: 1.0, doors: true, boxy: true,
    seat: { x: 0.46, y: 1.05, z: 1.3 },
  },
  sedan: {
    name: 'Sedan', body: 0x1e2733, roof: 0x161d27, wheels: 4, w: 1.9, l: 4.6, h: 1.32,
    ride: 0.34, wheelR: 0.38, topSpeed: 30, accel: 15, handling: 2.8, grip: 1.05, mass: 1.1,
    engine: { wave: 'sawtooth', base: 45, top: 260 }, seatY: 0.74, doors: true,
    seat: { x: 0.46, y: 0.78, z: 0.35 },
  },
  sports: {
    name: 'Vantage GT', body: 0xc4342a, roof: 0x8f251d, wheels: 4, w: 2.0, l: 4.5, h: 1.02,
    ride: 0.26, wheelR: 0.36, topSpeed: 44, accel: 26, handling: 3.2, grip: 1.25, mass: 0.95,
    engine: { wave: 'sawtooth', base: 55, top: 400 }, seatY: 0.6, doors: true, spoiler: true, low: true,
    seat: { x: 0.46, y: 0.48, z: 0.15 },
  },
  limo: {
    name: 'Executive Limo', body: 0x101014, roof: 0x0a0a0d, wheels: 4, w: 2.0, l: 6.6, h: 1.35,
    ride: 0.34, wheelR: 0.38, topSpeed: 28, accel: 11, handling: 1.7, grip: 1.0, mass: 1.8,
    engine: { wave: 'sawtooth', base: 38, top: 200 }, seatY: 0.76, doors: true, tint: true,
    seat: { x: 0.46, y: 0.8, z: 0.6 },
  },
};

/** Build the mesh for a vehicle type. Returns group + wheel pivots. */
export function makeVehicle(typeKey, colorOverride) {
  const t = VEHICLE_TYPES[typeKey];
  const g = new THREE.Group();
  const bodyColor = colorOverride !== undefined ? colorOverride : t.body;
  const bodyM = mat(bodyColor);
  const roofM = mat(colorOverride !== undefined ? darken(colorOverride, 0.75) : t.roof);
  const glassM = new THREE.MeshLambertMaterial({
    color: t.tint ? 0x0a0d12 : 0x2b3d52, transparent: true, opacity: t.tint ? 0.92 : 0.72,
  });
  const trimM = mat(0x1c1c20);
  const chromeM = new THREE.MeshLambertMaterial({ color: 0xb9bec6, emissive: 0x22262c });

  const y0 = t.ride + t.wheelR;

  if (typeKey === 'scooter') {
    const deck = new THREE.Mesh(box(t.w, 0.16, t.l * 0.6), bodyM);
    deck.position.y = y0 - 0.05;
    g.add(deck);
    const front = new THREE.Mesh(box(0.5, 0.7, 0.3), bodyM);
    front.position.set(0, y0 + 0.35, t.l * 0.36);
    g.add(front);
    const seat = new THREE.Mesh(box(0.5, 0.16, 0.8), trimM);
    seat.position.set(0, y0 + 0.28, -t.l * 0.12);
    g.add(seat);
    const bar = new THREE.Mesh(box(0.9, 0.08, 0.08), trimM);
    bar.position.set(0, y0 + 0.78, t.l * 0.34);
    g.add(bar);
    const lamp = new THREE.Mesh(box(0.3, 0.22, 0.1), new THREE.MeshBasicMaterial({ color: 0xffeeba }));
    lamp.position.set(0, y0 + 0.5, t.l * 0.5);
    g.add(lamp);
  } else if (t.canopy) {
    // Open three-wheeler: floor pan, nose, low side skirts, and a fabric roof
    // on four posts. Everything above knee height is deliberately see-through,
    // because half the charm is watching the driver in there.
    const floor = new THREE.Mesh(box(t.w, 0.16, t.l * 0.92), bodyM);
    floor.position.y = y0 + 0.08;
    g.add(floor);

    const nose = new THREE.Mesh(box(t.w * 0.72, t.h * 0.8, t.l * 0.26), bodyM);
    nose.position.set(0, y0 + t.h * 0.42, t.l * 0.34);
    g.add(nose);

    const screen = new THREE.Mesh(box(t.w * 0.68, t.h * 0.5, 0.06), glassM);
    screen.position.set(0, y0 + t.h * 1.02, t.l * 0.22);
    g.add(screen);

    for (const sx of [-1, 1]) {
      const skirt = new THREE.Mesh(box(0.1, t.h * 0.44, t.l * 0.6), bodyM);
      skirt.position.set(sx * t.w * 0.47, y0 + t.h * 0.22, -t.l * 0.1);
      g.add(skirt);
    }

    const rear = new THREE.Mesh(box(t.w, t.h * 0.74, t.l * 0.2), bodyM);
    rear.position.set(0, y0 + t.h * 0.37, -t.l * 0.42);
    g.add(rear);

    // Driver's saddle up front, passenger bench behind it.
    const saddle = new THREE.Mesh(box(t.w * 0.5, 0.13, 0.52), trimM);
    saddle.position.set(0, y0 + 0.58, t.l * 0.08);
    g.add(saddle);
    const bench = new THREE.Mesh(box(t.w * 0.88, 0.14, 0.62), trimM);
    bench.position.set(0, y0 + 0.56, -t.l * 0.26);
    g.add(bench);
    const backrest = new THREE.Mesh(box(t.w * 0.88, 0.5, 0.1), trimM);
    backrest.position.set(0, y0 + 0.86, -t.l * 0.42);
    g.add(backrest);

    // Handlebars.
    const bar = new THREE.Mesh(box(t.w * 0.55, 0.07, 0.07), trimM);
    bar.position.set(0, y0 + t.h * 0.86, t.l * 0.3);
    g.add(bar);

    const roof = new THREE.Mesh(box(t.w * 1.06, 0.09, t.l * 0.78), roofM);
    roof.position.set(0, y0 + t.h * 1.42, -t.l * 0.05);
    g.add(roof);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const post = new THREE.Mesh(box(0.07, t.h * 1.42, 0.07), trimM);
        post.position.set(sx * t.w * 0.46, y0 + t.h * 0.71, sz * t.l * 0.32);
        g.add(post);
      }
    }

    const headM = new THREE.MeshBasicMaterial({ color: 0xfff2c8 });
    const hl = new THREE.Mesh(box(t.w * 0.3, 0.18, 0.08), headM);
    hl.position.set(0, y0 + t.h * 0.42, t.l * 0.47);
    g.add(hl);
    const tailM = new THREE.MeshBasicMaterial({ color: 0xd2342a });
    for (const sx of [-1, 1]) {
      const tl = new THREE.Mesh(box(t.w * 0.2, 0.12, 0.06), tailM);
      tl.position.set(sx * t.w * 0.3, y0 + t.h * 0.42, -t.l * 0.52);
      g.add(tl);
    }
  } else {
    // Lower body.
    const lower = new THREE.Mesh(box(t.w, t.h * 0.52, t.l), bodyM);
    lower.position.y = y0 + t.h * 0.26;
    g.add(lower);

    // Cabin: shorter and set back, which is what makes a box read as a car.
    const cabLen = t.boxy ? t.l * 0.62 : t.l * 0.46;
    const cabZ = t.boxy ? t.l * 0.02 : -t.l * 0.06;
    const cab = new THREE.Mesh(box(t.w * 0.9, t.h * (t.boxy ? 0.62 : 0.5), cabLen), roofM);
    cab.position.set(0, y0 + t.h * (t.boxy ? 0.83 : 0.72), cabZ);
    g.add(cab);

    // Glass band around the cabin.
    const glass = new THREE.Mesh(box(t.w * 0.93, t.h * 0.26, cabLen * 0.94), glassM);
    glass.position.set(0, y0 + t.h * (t.boxy ? 0.86 : 0.74), cabZ);
    g.add(glass);

    if (t.spoiler) {
      const wing = new THREE.Mesh(box(t.w * 0.95, 0.06, 0.34), trimM);
      wing.position.set(0, y0 + t.h * 0.95, -t.l * 0.48);
      g.add(wing);
      for (const s of [-1, 1]) {
        const stalk = new THREE.Mesh(box(0.07, 0.22, 0.1), trimM);
        stalk.position.set(s * t.w * 0.34, y0 + t.h * 0.84, -t.l * 0.47);
        g.add(stalk);
      }
    }

    // Bumpers and lights (saloons and vans only; the tuk has its own).
    const headM = new THREE.MeshBasicMaterial({ color: 0xfff2c8 });
    const tailM = new THREE.MeshBasicMaterial({ color: 0xd2342a });
    for (const s of [-1, 1]) {
      const hl = new THREE.Mesh(box(t.w * 0.26, 0.14, 0.08), headM);
      hl.position.set(s * t.w * 0.3, y0 + t.h * 0.3, t.l * 0.5);
      g.add(hl);
      const tl = new THREE.Mesh(box(t.w * 0.22, 0.12, 0.06), tailM);
      tl.position.set(s * t.w * 0.32, y0 + t.h * 0.34, -t.l * 0.5);
      g.add(tl);
    }
    const bump = new THREE.Mesh(box(t.w * 1.02, 0.16, 0.12), chromeM);
    bump.position.set(0, y0 + 0.06, t.l * 0.5);
    g.add(bump);
    const bumpR = bump.clone();
    bumpR.position.z = -t.l * 0.5;
    g.add(bumpR);
  }

  // Wheels.
  const wheelGeo = cyl(t.wheelR, t.wheelR, t.w * 0.16, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = cyl(t.wheelR * 0.5, t.wheelR * 0.5, t.w * 0.17, 8);
  rimGeo.rotateZ(Math.PI / 2);
  const tyreM = mat(0x141416);
  const rimM = new THREE.MeshLambertMaterial({ color: 0x9aa0a8, emissive: 0x141519 });

  const wheels = [];
  const positions = t.wheels === 3
    ? [[0, t.l * 0.38], [-t.w * 0.45, -t.l * 0.32], [t.w * 0.45, -t.l * 0.32]]
    : t.wheels === 2
      ? [[0, t.l * 0.42], [0, -t.l * 0.36]]
      : [[-t.w * 0.5, t.l * 0.33], [t.w * 0.5, t.l * 0.33], [-t.w * 0.5, -t.l * 0.33], [t.w * 0.5, -t.l * 0.33]];

  for (const [wx, wz] of positions) {
    const pivot = new THREE.Group();
    // 'YXZ' so the roll happens about the axle *after* the wheel is steered.
    // With the default order a steered wheel rolls about a tilted axis.
    pivot.rotation.order = 'YXZ';
    pivot.position.set(wx, t.wheelR, wz);
    const tyre = new THREE.Mesh(wheelGeo, tyreM);
    const rim = new THREE.Mesh(rimGeo, rimM);
    pivot.add(tyre, rim);
    g.add(pivot);
    wheels.push({ pivot, steers: wz > 0 });
  }

  g.traverse((n) => { if (n.isMesh) n.castShadow = true; });
  return { group: g, wheels, spec: t };
}

function darken(hex, f) {
  const r = ((hex >> 16) & 255) * f, gg = ((hex >> 8) & 255) * f, b = (hex & 255) * f;
  return (r << 16) | (gg << 8) | b;
}

// ----------------------------------------------------------------- drone ---

/** VANTA's camera drones: a lens, a shell, and four screaming rotors. */
export function makeDrone(colorHex = 0x2b2f38) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 9), mat(colorHex));
  shell.scale.set(1, 0.72, 1.1);
  g.add(shell);

  const lensHousing = new THREE.Mesh(cyl(0.17, 0.2, 0.24, 10), mat(0x15171c));
  lensHousing.rotation.x = Math.PI / 2;
  lensHousing.position.set(0, -0.06, 0.4);
  g.add(lensHousing);

  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
  lens.position.set(0, -0.06, 0.52);
  g.add(lens);

  const rotors = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const armM = new THREE.Mesh(box(0.06, 0.05, 0.5), mat(0x1a1d22));
      armM.position.set(sx * 0.26, 0.06, sz * 0.26);
      armM.rotation.y = sx * sz > 0 ? 0.7 : -0.7;
      g.add(armM);
      const rotor = new THREE.Mesh(box(0.62, 0.02, 0.06), new THREE.MeshLambertMaterial({
        color: 0xdadde2, transparent: true, opacity: 0.4,
      }));
      rotor.position.set(sx * 0.44, 0.12, sz * 0.44);
      g.add(rotor);
      rotors.push(rotor);
    }
  }

  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), new THREE.MeshBasicMaterial({ color: 0x60d9ff }));
  beacon.position.set(0, 0.28, -0.2);
  g.add(beacon);

  g.traverse((n) => { if (n.isMesh) n.castShadow = true; });
  return { group: g, rotors, lens, beacon };
}

// -------------------------------------------------------------- pickups ---

const PICKUP_SHAPES = {
  scrap: () => {
    const g = new THREE.Group();
    const rng = makeRNG(7);
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(box(0.3 + rng() * 0.3, 0.08 + rng() * 0.12, 0.24 + rng() * 0.3),
        mat([0x8a6a4a, 0x6f7a6a, 0x96794f][i % 3]));
      m.position.set((rng() - 0.5) * 0.3, i * 0.11, (rng() - 0.5) * 0.3);
      m.rotation.y = rng() * TAU;
      g.add(m);
    }
    return g;
  },
  crate: () => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(box(0.6, 0.6, 0.6), mat(0x8a6a3f));
    g.add(body);
    for (const ax of ['x', 'y']) {
      const strap = new THREE.Mesh(box(ax === 'x' ? 0.64 : 0.09, ax === 'x' ? 0.09 : 0.64, 0.64), mat(0x3a3128));
      g.add(strap);
    }
    return g;
  },
  cash: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(box(0.42, 0.06, 0.24), mat(i % 2 ? 0x4e7a4c : 0x6f9c5e));
      m.position.y = i * 0.07;
      m.rotation.y = i * 0.2;
      g.add(m);
    }
    return g;
  },
  slate: () => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(box(0.5, 0.7, 0.05), mat(0x22262e));
    g.add(body);
    const screen = new THREE.Mesh(box(0.42, 0.6, 0.02), new THREE.MeshBasicMaterial({ color: 0x53d0ff }));
    screen.position.z = 0.035;
    g.add(screen);
    return g;
  },
  star: () => {
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), new THREE.MeshBasicMaterial({ color: 0xffd45e }));
    g.add(core);
    return g;
  },
};

/** A floating, spinning collectible with a glow disc under it. */
export function makePickup(kind = 'scrap', glowHex = 0xffc94a) {
  const g = new THREE.Group();
  const inner = (PICKUP_SHAPES[kind] || PICKUP_SHAPES.scrap)();
  inner.position.y = 0.45;
  g.add(inner);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.95, 20),
    new THREE.MeshBasicMaterial({ color: glowHex, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.04;
  g.add(halo);

  const beam = new THREE.Mesh(
    cyl(0.34, 0.34, 3.2, 8, 1),
    new THREE.MeshBasicMaterial({ color: glowHex, transparent: true, opacity: 0.1, depthWrite: false })
  );
  beam.position.y = 1.6;
  g.add(beam);

  g.userData.spin = inner;
  g.userData.halo = halo;
  return g;
}

/** Big navigable marker: ground ring plus a light column you can see over roofs. */
export function makeWaypoint(colorHex = 0xffd23f) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.0, 2.7, 32),
    new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  g.add(ring);

  const inner = new THREE.Mesh(
    new THREE.CircleGeometry(2.0, 28),
    new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
  );
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.05;
  g.add(inner);

  const column = new THREE.Mesh(
    cyl(1.5, 1.9, 44, 14, 1, true),
    new THREE.MeshBasicMaterial({
      color: colorHex, transparent: true, opacity: 0.13,
      side: THREE.DoubleSide, depthWrite: false,
    })
  );
  column.position.y = 22;
  g.add(column);

  g.userData.ring = ring;
  g.userData.column = column;
  return g;
}

/** Drive-through checkpoint ring for the timed missions. */
export function makeGateRing(colorHex = 0x4ad8ff) {
  const g = new THREE.Group();
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(3.4, 0.22, 8, 24),
    new THREE.MeshBasicMaterial({ color: colorHex })
  );
  torus.position.y = 3.6;
  g.add(torus);
  const fill = new THREE.Mesh(
    new THREE.CircleGeometry(3.4, 24),
    new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })
  );
  fill.position.y = 3.6;
  g.add(fill);
  g.userData.torus = torus;
  return g;
}

export { mat as lambert, box as boxGeo, cyl as cylGeo };
