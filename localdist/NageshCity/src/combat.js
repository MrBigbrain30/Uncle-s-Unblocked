// Nagesh City - guns, the people pointing them, and everything that catches
// fire afterwards.
//
// Shooting is hitscan. A ray leaves the camera, stops at the first wall, and
// whatever sphere it passed through on the way takes the damage. The tracer you
// see is drawn from the muzzle to that point, which is a small lie that makes
// third-person shooting read correctly.

import * as THREE from '../vendor/three.module.js';
import {
  makeCharacter, makeGun, makeMuzzleFlash, makeExplosion, makeTarget, makePickup, OUTFITS,
} from './actors.js';
import { audio, VOICE } from './audio.js';
import {
  clamp, damp, dampAngle, dist2, makeRNG, TAU, rayHitWorld, raySphere, resolveCircle,
} from './util.js';

// ---------------------------------------------------------------- weapons ---

/**
 * `rate` is seconds between shots, `spread` is radians of cone at the muzzle.
 * Prices are in the same rupees the missions pay, and they are meant to hurt:
 * every rupee you spend here is a rupee that was not coming off the balance.
 */
export const WEAPONS = {
  fists: {
    id: 'fists', name: 'Bare Hands', model: 'melee', melee: true,
    dmg: 11, rate: 0.44, range: 2.4, mag: 0, spread: 0, pellets: 1,
    auto: false, recoil: 0.3, reload: 0, prefer: 2, price: 0,
  },
  bar: {
    id: 'bar', name: 'Length of Rebar', model: 'melee', melee: true,
    dmg: 34, rate: 0.52, range: 2.9, mag: 0, spread: 0, pellets: 1,
    auto: false, recoil: 0.4, reload: 0, prefer: 2, price: 900,
  },
  pistol: {
    id: 'pistol', name: 'Kaduva .32', model: 'pistol', sound: 'pistol',
    dmg: 24, rate: 0.24, range: 95, mag: 12, spread: 0.016, pellets: 1,
    auto: false, recoil: 0.55, reload: 1.2, prefer: 13,
    price: 2600, ammoPrice: 180, ammoPer: 36, maxAmmo: 144,
  },
  smg: {
    id: 'smg', name: 'Ravi Cross Spitter', model: 'smg', sound: 'smg',
    dmg: 15, rate: 0.075, range: 68, mag: 34, spread: 0.038, pellets: 1,
    auto: true, recoil: 0.4, reload: 1.7, prefer: 11,
    price: 9800, ammoPrice: 420, ammoPer: 102, maxAmmo: 408,
  },
  shotgun: {
    id: 'shotgun', name: 'Standpipe 12-Bore', model: 'shotgun', sound: 'shotgun',
    dmg: 13, rate: 0.82, range: 32, mag: 6, spread: 0.085, pellets: 8,
    auto: false, recoil: 1.0, reload: 2.3, prefer: 7,
    price: 14500, ammoPrice: 380, ammoPer: 24, maxAmmo: 96,
  },
  rifle: {
    id: 'rifle', name: 'VANTA Retrieval Rifle', model: 'rifle', sound: 'rifle',
    dmg: 52, rate: 0.4, range: 190, mag: 20, spread: 0.006, pellets: 1,
    auto: true, recoil: 0.85, reload: 2.1, prefer: 24,
    price: 38000, ammoPrice: 620, ammoPer: 60, maxAmmo: 240,
  },
};

export const WEAPON_ORDER = ['fists', 'bar', 'pistol', 'smg', 'shotgun', 'rifle'];

/**
 * Everything on a shop counter that is not a gun. Vehicles are delivered to
 * the kerb rather than handed over, because a limo does not fit behind a
 * counter and because watching one arrive is half of what you paid for.
 */
export const SERVICES = {
  medkit: { name: 'Field Dressing', desc: 'Straight back to a hundred.', price: 900 },
  armour: { name: 'Repo Vest', desc: 'Soaks two thirds of everything, until it does not.', price: 3400 },
  repair: { name: 'Panel Beating', desc: 'Your vehicle, straightened out and put out.', price: 1900 },
  car_hatch: { name: 'Hatchback', desc: 'Nothing special. Doors, though.', price: 12000, vehicle: 'hatch' },
  car_sedan: { name: 'Sedan', desc: 'Quick enough to leave with.', price: 21000, vehicle: 'sedan' },
  car_sports: { name: 'Vantage GT', desc: 'The car the hoardings are advertising.', price: 56000, vehicle: 'sports' },
  car_limo: { name: 'Executive Limo', desc: 'Six and a half metres of being looked at.', price: 74000, vehicle: 'limo' },
};

/**
 * Who is shooting at you, and how good they are at it.
 *
 * `dmg` and `pellets` are deliberately *not* taken from the player's weapon
 * table. A shotgun in the player's hands is eight pellets of thirteen, which is
 * a fine thing to be holding and an unsurvivable thing to be standing in front
 * of: one breacher could take a hundred points off you in a single trigger
 * pull, from off screen, before the sound arrived. Enemies fire the same guns
 * with their own, much gentler, numbers.
 */
const ENEMY_TIERS = {
  goon: { health: 60, weapon: 'pistol', dmg: 6, accuracy: 0.3, sight: 44, outfit: 'goon', speed: 3.6, cash: 180 },
  repo: { health: 85, weapon: 'pistol', dmg: 8, accuracy: 0.36, sight: 52, outfit: 'enforcer', speed: 4.0, cash: 320 },
  enforcer: { health: 120, weapon: 'smg', dmg: 5, accuracy: 0.4, sight: 60, outfit: 'enforcer', speed: 4.4, cash: 520 },
  retrieval: { health: 160, weapon: 'rifle', dmg: 14, accuracy: 0.46, sight: 84, outfit: 'retrieval', speed: 4.2, cash: 900 },
  breacher: { health: 150, weapon: 'shotgun', dmg: 6, pellets: 4, accuracy: 0.44, sight: 40, outfit: 'retrieval', speed: 5.2, cash: 700 },
  hishaan: { health: 900, weapon: 'rifle', dmg: 17, accuracy: 0.54, sight: 105, outfit: 'hishaan', speed: 5.0, cash: 0, boss: true },
};

const _v = new THREE.Vector3();
const _dir = new THREE.Vector3();

export class Combat {
  constructor(game) {
    this.game = game;
    this.group = new THREE.Group();
    this.rng = makeRNG(31337);

    // Loadout. Fists are always available; nothing else is until it is bought
    // or handed over.
    this.owned = new Set(['fists']);
    this.ammo = {};
    this.mag = {};
    this.current = 'fists';
    this.cooldown = 0;
    this.reloading = 0;
    this.recoil = 0;
    this.aiming = false;
    this.aimBlend = 0;
    this.shotsFired = 0;
    this.kills = 0;
    this.hitMarker = 0;

    this.enemies = [];
    this.targets = [];
    this.effects = [];      // explosions and other self-animating groups
    this.drops = [];
    this.wave = null;

    this.gunMesh = null;
    this.gunKind = null;
    this.flash = makeMuzzleFlash();
    this.flashTimer = 0;

    this._tracers = [];
    this._tracerMat = new THREE.MeshBasicMaterial({
      color: 0xffe9a8, transparent: true, opacity: 0.9, depthWrite: false,
    });
    this._enemyTracerMat = new THREE.MeshBasicMaterial({
      color: 0xff7a5a, transparent: true, opacity: 0.85, depthWrite: false,
    });
    this._scratch = [];
  }

  attach(scene) {
    scene.add(this.group);
    // The flash lives here rather than on the gun: changing district rebuilds
    // the whole player rig and disposes everything hanging off it, and this is
    // the one thing that has to survive that.
    this.group.add(this.flash);
  }

  // ------------------------------------------------------------- loadout ---

  reset() {
    this.clearEnemies();
    this.clearTargets();
    this.clearDrops();
    this.owned = new Set(['fists']);
    this.ammo = {};
    this.mag = {};
    this.select('fists');
    this.kills = 0;
  }

  serialize() {
    return { owned: [...this.owned], ammo: this.ammo, mag: this.mag, current: this.current, kills: this.kills };
  }

  restore(d) {
    if (!d) return;
    this.owned = new Set(d.owned && d.owned.length ? d.owned : ['fists']);
    this.ammo = d.ammo || {};
    this.mag = d.mag || {};
    this.kills = d.kills || 0;
    this.select(this.owned.has(d.current) ? d.current : 'fists');
  }

  has(id) { return this.owned.has(id); }

  give(id, withAmmo = true) {
    const w = WEAPONS[id];
    if (!w) return;
    const isNew = !this.owned.has(id);
    this.owned.add(id);
    if (withAmmo && w.mag) {
      if (this.mag[id] === undefined) this.mag[id] = w.mag;
      this.addAmmo(id, w.mag * 2);
    }
    if (isNew) this.select(id);
    return isNew;
  }

  addAmmo(id, n) {
    const w = WEAPONS[id];
    if (!w || !w.mag) return 0;
    const before = this.ammo[id] || 0;
    this.ammo[id] = clamp(before + n, 0, w.maxAmmo || 999);
    return this.ammo[id] - before;
  }

  /** Ammo for whatever the player is holding, for the shop and the HUD. */
  reserve(id) { return this.ammo[id] || 0; }
  inMag(id) { return this.mag[id] === undefined ? (WEAPONS[id] ? WEAPONS[id].mag : 0) : this.mag[id]; }

  get weapon() { return WEAPONS[this.current]; }

  select(id) {
    if (!WEAPONS[id] || !this.owned.has(id)) return false;
    if (this.current === id) return true;
    this.current = id;
    this.reloading = 0;
    this.cooldown = Math.min(this.cooldown, 0.25);
    if (this.mag[id] === undefined) this.mag[id] = WEAPONS[id].mag;
    this.buildGun();
    audio.gunSwap();
    return true;
  }

  cycle(dir) {
    const list = WEAPON_ORDER.filter((k) => this.owned.has(k));
    if (list.length < 2) return;
    const i = list.indexOf(this.current);
    this.select(list[(i + dir + list.length) % list.length]);
  }

  /** Hang the current weapon off the player's right hand. */
  buildGun() {
    const hold = this.game.player.char.parts.hold;
    if (this.gunMesh && this.gunMesh.parent) this.gunMesh.parent.remove(this.gunMesh);
    if (this.gunMesh) disposeTree(this.gunMesh);
    this.gunMesh = null;
    this.gunKind = null;
    if (this.current === 'fists') return;
    const g = makeGun(WEAPONS[this.current].model);
    hold.add(g);
    this.gunMesh = g;
    this.gunKind = this.current;
  }

  /** The player model is rebuilt whenever the outfit changes; re-arm them. */
  onPlayerRebuilt() { this.gunMesh = null; this.buildGun(); }

  // ---------------------------------------------------------------- input ---

  update(dt, input) {
    const g = this.game;

    if (this.cooldown > 0) this.cooldown -= dt;
    this.recoil = Math.max(0, this.recoil - dt * 4.5);
    this.hitMarker = Math.max(0, this.hitMarker - dt * 3);
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) this.flash.visible = false;
    }

    const canAct = !g.player.dead && !g.ui.dialogueActive && !g.mapOpen && !g.shopOpen;

    // Aiming down the camera. Held, not toggled.
    this.aiming = canAct && !g.player.inVehicle && input.rmb;
    this.aimBlend = damp(this.aimBlend, this.aiming ? 1 : 0, 12, dt);

    if (canAct) {
      if (input.hit('KeyQ')) this.cycle(1);
      if (input.hit('KeyR')) this.reload();
      for (let i = 0; i < WEAPON_ORDER.length; i++) {
        if (input.hit('Digit' + (i + 1))) this.select(WEAPON_ORDER[i]);
      }
      const w = this.weapon;
      const wantFire = w.auto ? input.lmb : input.lmbHit;
      if (wantFire) this.tryFire();
    }

    if (this.reloading > 0) {
      this.reloading -= dt;
      if (this.reloading <= 0) this.finishReload();
    }

    this.updateTracers(dt);
    this.updateEffects(dt);
    this.updateEnemies(dt);
    this.updateDrops(dt);
    this.updateTargets(dt);
    this.updateWave(dt);
  }

  reload() {
    const w = this.weapon;
    if (!w.mag || this.reloading > 0) return;
    if (this.inMag(this.current) >= w.mag) return;
    if (this.reserve(this.current) <= 0) { this.game.ui.toast('No ammunition'); return; }
    this.reloading = w.reload;
    audio.reload();
  }

  finishReload() {
    const w = this.weapon;
    const need = w.mag - this.inMag(this.current);
    const take = Math.min(need, this.reserve(this.current));
    this.mag[this.current] = this.inMag(this.current) + take;
    this.ammo[this.current] = this.reserve(this.current) - take;
    audio.reloadDone();
  }

  tryFire() {
    const g = this.game;
    const w = this.weapon;
    if (this.cooldown > 0 || this.reloading > 0) return;

    if (w.melee) {
      this.cooldown = w.rate;
      this.recoil = 1;
      audio.swing();
      this.meleeSwing(w);
      return;
    }

    if (this.inMag(this.current) <= 0) {
      audio.dryFire();
      this.cooldown = 0.3;
      if (this.reserve(this.current) > 0) this.reload();
      return;
    }

    this.mag[this.current] = this.inMag(this.current) - 1;
    this.cooldown = w.rate;
    this.recoil = 1;
    this.shotsFired++;
    audio.gunshot(w.sound || 'pistol');
    g.player.shake = Math.min(1.0, g.player.shake + w.recoil * 0.24);

    // Where the camera is looking is where the bullet goes.
    const cam = g.camera;
    cam.getWorldDirection(_dir);
    const ox = cam.position.x, oy = cam.position.y, oz = cam.position.z;
    const muzzle = this.muzzlePoint();

    this.flash.visible = true;
    this.flash.userData.mat.opacity = 0.95;
    this.flash.position.set(muzzle.x, muzzle.y, muzzle.z);
    this.flash.lookAt(muzzle.x + _dir.x, muzzle.y + _dir.y, muzzle.z + _dir.z);
    this.flash.rotateZ(this.rng() * TAU);
    this.flashTimer = 0.05;

    for (let p = 0; p < (w.pellets || 1); p++) {
      const spread = w.spread * (this.aiming ? 0.45 : 1) * (g.player.inVehicle ? 2.1 : 1);
      const dx = _dir.x + (this.rng() - 0.5) * spread * 2;
      const dy = _dir.y + (this.rng() - 0.5) * spread * 2;
      const dz = _dir.z + (this.rng() - 0.5) * spread * 2;
      const len = Math.hypot(dx, dy, dz);
      this.fireRay(ox, oy, oz, dx / len, dy / len, dz / len, w, muzzle, false);
    }
  }

  /** World-space point the tracer is drawn from. */
  muzzlePoint() {
    const p = this.game.player;
    if (p.inVehicle) {
      const s = p.vehicle.seatPoint();
      return { x: s.x + Math.sin(p.heading) * 0.8, y: s.y + 0.55, z: s.z + Math.cos(p.heading) * 0.8 };
    }
    const h = p.heading;
    return {
      x: p.x + Math.sin(h) * 0.55 - Math.cos(h) * 0.22,
      y: p.y + 1.36,
      z: p.z + Math.cos(h) * 0.55 + Math.sin(h) * 0.22,
    };
  }

  /**
   * One bullet. Finds the nearest thing along the ray, applies damage, and
   * leaves a tracer behind.
   */
  fireRay(ox, oy, oz, dx, dy, dz, w, from, byEnemy) {
    const g = this.game;
    const grid = g.district ? g.district.grid : null;
    let best = grid ? rayHitWorld(grid, ox, oy, oz, dx, dy, dz, w.range) : w.range;
    let hit = null, headshot = false;

    const consider = (t, obj, head) => {
      if (t < 0 || t >= best) return;
      best = t; hit = obj; headshot = !!head;
    };

    if (!byEnemy) {
      for (const e of this.enemies) {
        if (e.dead) continue;
        consider(raySphere(ox, oy, oz, dx, dy, dz, e.x, e.y + 1.62, e.z, 0.3), e, true);
        consider(raySphere(ox, oy, oz, dx, dy, dz, e.x, e.y + 0.95, e.z, 0.56), e, false);
      }
      for (const t of this.targets) {
        if (t.down) continue;
        consider(raySphere(ox, oy, oz, dx, dy, dz, t.x, 1.9, t.z, 0.62), t, false);
      }
      const drones = g.missions.drones;
      for (const d of drones) {
        if (d.dead) continue;
        consider(raySphere(ox, oy, oz, dx, dy, dz, d.x, d.y, d.z, 0.62), d, false);
      }
      for (const v of g.vehicles) {
        if (v === g.player.vehicle || v.wrecked) continue;
        consider(raySphere(ox, oy, oz, dx, dy, dz, v.x, 0.9, v.z, v.spec.w * 0.62), v, false);
      }
    }

    const hx = ox + dx * best, hy = oy + dy * best, hz = oz + dz * best;
    this.tracer(from.x, from.y, from.z, hx, hy, hz, byEnemy);

    if (!hit) {
      if (best < w.range - 0.01) audio.ricochet();
      return null;
    }

    const dmg = w.dmg * (headshot ? 2.6 : 1);
    if (hit.isEnemy) this.damageEnemy(hit, dmg, headshot);
    else if (hit.isTarget) this.hitTarget(hit);
    else if (hit.isDrone) g.missions.damageDrone(hit, dmg * 1.4);
    else if (hit.spec) g.damageVehicleBody(hit, dmg * 0.55, 'gunfire');
    this.hitMarker = 1;
    return hit;
  }

  meleeSwing(w) {
    const g = this.game;
    const p = g.player;
    const fx = Math.sin(p.heading), fz = Math.cos(p.heading);
    let any = false;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = e.x - p.x, dz = e.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d > w.range) continue;
      if ((dx / d) * fx + (dz / d) * fz < 0.45) continue;
      this.damageEnemy(e, w.dmg, false);
      e.stagger = 0.4;
      any = true;
    }
    for (const t of this.targets) {
      if (t.down) continue;
      if (dist2(t.x, t.z, p.x, p.z) < w.range * w.range) { this.hitTarget(t); any = true; }
    }
    if (any) { audio.thump(); this.hitMarker = 1; }
  }

  // -------------------------------------------------------------- tracers ---

  tracer(x0, y0, z0, x1, y1, z1, byEnemy) {
    let t = this._tracers.find((n) => !n.live);
    if (!t) {
      const geo = new THREE.BoxGeometry(0.045, 0.045, 1);
      const mesh = new THREE.Mesh(geo, byEnemy ? this._enemyTracerMat : this._tracerMat);
      mesh.matrixAutoUpdate = true;
      t = { mesh, live: false, age: 0 };
      this.group.add(mesh);
      this._tracers.push(t);
    }
    t.mesh.material = byEnemy ? this._enemyTracerMat : this._tracerMat;
    const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
    const len = Math.max(0.2, Math.hypot(dx, dy, dz));
    t.mesh.position.set(x0 + dx / 2, y0 + dy / 2, z0 + dz / 2);
    t.mesh.scale.set(1, 1, len);
    t.mesh.lookAt(x1, y1, z1);
    t.mesh.visible = true;
    t.live = true;
    t.age = 0;
  }

  updateTracers(dt) {
    for (const t of this._tracers) {
      if (!t.live) continue;
      t.age += dt;
      if (t.age > 0.06) { t.live = false; t.mesh.visible = false; }
    }
  }

  // ------------------------------------------------------------- effects ---

  /** A bang with a blast radius. Everything nearby feels it. */
  boom(x, y, z, opts = {}) {
    const g = this.game;
    const radius = opts.radius || 9;
    const damage = opts.damage || 70;
    const fx = makeExplosion(opts.scale || 1);
    fx.position.set(x, y, z);
    this.group.add(fx);
    this.effects.push(fx);
    audio.explosion();
    g.player.shake = Math.min(1.6, g.player.shake + 1.1);
    g.ui.flashBoom();

    // Squared falloff: standing at the edge of a blast should sting, not
    // halve you. Being on top of one still does what it should.
    const falloff = (px, pz) => {
      const d = Math.sqrt(dist2(px, pz, x, z));
      if (d > radius) return 0;
      const k = 1 - d / radius;
      return k * k;
    };

    const pf = falloff(g.player.x, g.player.z);
    if (pf > 0 && !g.player.dead) g.damagePlayer(damage * pf, 'blast');

    for (const e of this.enemies) {
      if (e.dead) continue;
      const f = falloff(e.x, e.z);
      if (f > 0) this.damageEnemy(e, damage * f * 1.2, false);
    }
    for (const v of g.vehicles) {
      if (v.wrecked) continue;
      const f = falloff(v.x, v.z);
      // Not enough to instantly chain every car on the street, enough to
      // make parking next to a burning one a bad idea.
      if (f > 0.25 && !(opts.source === v)) g.damageVehicleBody(v, damage * f * 0.9, 'blast');
    }
    for (const d of g.missions.drones) {
      if (d.dead) continue;
      const f = falloff(d.x, d.z);
      if (f > 0) g.missions.damageDrone(d, damage * f);
    }
  }

  /** A small burst with no blast: something broke, nobody nearby is hurt. */
  puff(x, y, z, scale = 0.5) {
    const fx = makeExplosion(scale);
    fx.position.set(x, y, z);
    this.group.add(fx);
    this.effects.push(fx);
  }

  updateEffects(dt) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const fx = this.effects[i];
      if (!fx.userData.update(dt)) {
        this.group.remove(fx);
        disposeTree(fx);
        this.effects.splice(i, 1);
      }
    }
  }

  // -------------------------------------------------------------- enemies ---

  spawnEnemy(opts = {}) {
    const tier = ENEMY_TIERS[opts.tier] || ENEMY_TIERS.goon;
    const outfitKey = opts.outfit || tier.outfit;
    const outfit = OUTFITS[outfitKey] || OUTFITS.goon;
    const char = makeCharacter({
      outfit,
      hairStyle: opts.hairStyle || (tier.boss ? 'slick' : this.rng.pick(['short', 'short', 'cap'])),
      tall: opts.tall || (tier.boss ? 1.06 : this.rng.range(0.95, 1.06)),
      bulk: tier.boss ? 1.12 : this.rng.range(0.95, 1.1),
    });
    const spot = this.game.nudgeToOpen(this.game.district, opts.x, opts.z, 0.7);
    char.group.position.set(spot.x, 0, spot.z);
    this.group.add(char.group);

    const wid = opts.weapon || tier.weapon;
    const gun = makeGun(WEAPONS[wid].model);
    char.parts.hold.add(gun);

    const e = {
      isEnemy: true, char, group: char.group, gun,
      x: spot.x, y: 0, z: spot.z, heading: this.rng() * TAU, speed: 0,
      health: opts.health || tier.health, maxHealth: opts.health || tier.health,
      weapon: WEAPONS[wid], accuracy: tier.accuracy, sight: tier.sight,
      dmg: tier.dmg, pellets: tier.pellets || 1,
      moveSpeed: tier.speed, cash: tier.cash, boss: !!tier.boss,
      name: opts.name || (tier.boss ? 'Hishaan' : null),
      alert: !!opts.alert, alertT: 0, fireT: this.rng.range(0.4, 1.4), burst: 0,
      strafe: this.rng.sign(), phase: this.rng() * TAU, stagger: 0,
      dead: false, deadT: 0, recoil: 0, hurtT: 0,
      home: { x: spot.x, z: spot.z }, guard: opts.guard || 0,
      onDeath: opts.onDeath || null, tag: opts.tag || null,
    };
    this.enemies.push(e);
    return e;
  }

  clearEnemies() {
    for (const e of this.enemies) { this.group.remove(e.group); disposeTree(e.group); }
    this.enemies.length = 0;
  }

  get liveEnemies() { return this.enemies.filter((e) => !e.dead).length; }

  damageEnemy(e, dmg, headshot) {
    if (e.dead) return;
    e.health -= dmg;
    e.hurtT = 0.12;
    e.alert = true;
    audio.flesh(headshot);
    if (headshot) this.game.ui.toast('Head shot');
    if (e.health <= 0) this.killEnemy(e);
  }

  killEnemy(e) {
    e.dead = true;
    e.deadT = 14;
    e.health = 0;
    this.kills++;
    audio.enemyDown(audio.gainAt(e.x, e.z));
    const g = this.game;
    g.ui.killFeed(e.name || (e.boss ? 'Hishaan' : 'VANTA Retrieval'));
    if (e.cash > 0) this.spawnDrop(e.x, e.z, 'cash', e.cash);
    if (this.rng.chance(0.45) && e.weapon.mag) this.spawnDrop(e.x + 0.8, e.z + 0.6, 'ammo', 0, e.weapon.id);
    if (e.onDeath) e.onDeath(e);
  }

  updateEnemies(dt) {
    const g = this.game;
    if (!g.district) return;
    const grid = g.district.grid;
    const p = g.player;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      if (e.dead) {
        e.deadT -= dt;
        e.char.update(dt, 0, 'down');
        if (e.deadT <= 0) {
          this.group.remove(e.group);
          disposeTree(e.group);
          this.enemies.splice(i, 1);
        }
        continue;
      }

      if (e.hurtT > 0) e.hurtT -= dt;
      if (e.stagger > 0) e.stagger -= dt;
      e.recoil = Math.max(0, e.recoil - dt * 5);

      const dx = p.x - e.x, dz = p.z - e.z;
      const dist = Math.hypot(dx, dz) || 0.001;

      // Line of sight is the expensive part of an enemy, so the version that
      // drives movement is recomputed a few times a second rather than every
      // frame, staggered per enemy so the cost never lands on one frame all at
      // once. Firing re-checks exactly - see enemyShoot.
      e.losT = (e.losT || 0) - dt;
      if (e.losT <= 0) {
        e.losT = 0.06 + this.rng() * 0.05;
        e.los = !p.dead && dist < e.sight * 1.4 && this.canSee(e, p, dist);
      }
      const los = e.los && !p.dead;

      if (!e.alert) {
        if (los && dist < e.sight) {
          e.alert = true;
          e.alertT = 0.75;   // a beat of reaction time before the first shot
          audio.enemyAlert(audio.gainAt(e.x, e.z));
        } else {
          // Standing guard, turning slowly on the spot.
          e.phase += dt * 0.4;
          e.heading = e.home.rot !== undefined ? e.home.rot : e.heading + Math.sin(e.phase) * dt * 0.5;
          e.speed = damp(e.speed, 0, 6, dt);
          this.placeEnemy(e, dt, grid);
          continue;
        }
      }

      if (e.alertT > 0) e.alertT -= dt;

      // Close to a comfortable range for whatever they are holding, and never
      // stand still while doing it.
      const prefer = e.weapon.prefer;
      let want = 0;
      if (dist > prefer * 1.25) want = e.moveSpeed;
      else if (dist < prefer * 0.55) want = -e.moveSpeed * 0.7;
      if (!los) want = e.moveSpeed;         // break cover to find the player
      if (e.stagger > 0) want = 0;

      e.phase += dt * 1.6;
      const strafe = (los && dist < prefer * 1.4 ? 1 : 0) * e.strafe * Math.sin(e.phase * 0.7) * e.moveSpeed * 0.55;
      const face = Math.atan2(dx, dz);
      e.heading = dampAngle(e.heading, face, 7, dt);
      e.speed = damp(e.speed, want, 6, dt);

      const mx = Math.sin(face) * e.speed + Math.cos(face) * strafe;
      const mz = Math.cos(face) * e.speed - Math.sin(face) * strafe;
      const pos = { x: e.x + mx * dt, z: e.z + mz * dt };
      const hit = resolveCircle(grid, pos, 0.5, { y: 0 });
      if (hit.hits) e.strafe = -e.strafe;
      // Never walk out of the district, and never walk into the player.
      const b = g.district.half - 3;
      e.x = clamp(pos.x, -b, b);
      e.z = clamp(pos.z, -b, b);

      // Shooting.
      e.fireT -= dt;
      if (los && e.alertT <= 0 && dist < e.weapon.range && e.fireT <= 0 && e.stagger <= 0) {
        this.enemyShoot(e, dist);
      }

      this.placeEnemy(e, dt, grid);
    }
  }

  /**
   * Can this enemy actually see the player? Fires an exact ray from eye height
   * to chest height. The direction has to be normalised or the returned
   * distance is in the wrong units and short walls stop counting.
   */
  canSee(e, p, dist) {
    const grid = this.game.district.grid;
    const eyeY = 1.5, tgtY = p.y + (p.inVehicle ? 1.2 : 1.0);
    let dx = p.x - e.x, dy = tgtY - eyeY, dz = p.z - e.z;
    const len = Math.hypot(dx, dy, dz) || 0.001;
    dx /= len; dy /= len; dz /= len;
    // A small tolerance so standing right against a wall does not make the
    // player invisible to somebody stood next to them.
    return rayHitWorld(grid, e.x, eyeY, e.z, dx, dy, dz, len) >= len - 0.5;
  }

  placeEnemy(e, dt, grid) {
    e.group.position.set(e.x, 0, e.z);
    e.group.rotation.y = e.heading;
    const mode = e.alert ? 'aim' : 'walk';
    e.char.update(dt, Math.abs(e.speed), mode, { recoil: e.recoil });
    // Flash red for a moment when hit, so you can tell you connected.
    if (e.hurtT > 0 && !e.flashed) { e.flashed = true; tintChar(e.char, 0xff5a4a); }
    else if (e.hurtT <= 0 && e.flashed) { e.flashed = false; untintChar(e.char); }
  }

  enemyShoot(e, dist) {
    const g = this.game;
    const w = e.weapon;

    // Re-check exactly at the moment of firing. The cached line of sight is up
    // to a tenth of a second old, and a tenth of a second is long enough to
    // step behind a shack - which is what made it look like they were shooting
    // through walls.
    if (!this.canSee(e, g.player, dist)) { e.los = false; e.fireT = 0.25; return; }

    e.recoil = 1;
    audio.gunshot(w.sound || 'pistol', 0.55, dist);

    // Burst fire on the automatics, so being shot at has a rhythm to it - and
    // so there is a gap in it long enough to move in.
    if (w.auto) {
      e.burst = e.burst > 0 ? e.burst - 1 : 3;
      e.fireT = e.burst > 0 ? w.rate * 2.2 : 1.5 + this.rng() * 1.1;
    } else {
      e.fireT = w.rate * 2.8 + this.rng() * 1.0;
    }

    const p = g.player;
    const ox = e.x, oy = 1.45, oz = e.z;
    const tx = p.x, ty = p.y + 1.0, tz = p.z;
    let dx = tx - ox, dy = ty - oy, dz = tz - oz;
    const len = Math.hypot(dx, dy, dz);
    dx /= len; dy /= len; dz /= len;

    // Accuracy falls off with range and improves when the player stands still.
    const moving = clamp(p.speed / 8, 0, 1);
    const acc = clamp(e.accuracy * (1 - dist / (w.range * 1.5)) * (1 - moving * 0.35), 0.04, 0.92);
    const miss = (1 - acc) * 0.09;
    dx += (this.rng() - 0.5) * miss * 2;
    dy += (this.rng() - 0.5) * miss;
    dz += (this.rng() - 0.5) * miss * 2;
    const l2 = Math.hypot(dx, dy, dz);

    for (let i = 0; i < e.pellets; i++) {
      const sx = dx / l2 + (this.rng() - 0.5) * w.spread;
      const sy = dy / l2 + (this.rng() - 0.5) * w.spread;
      const sz = dz / l2 + (this.rng() - 0.5) * w.spread;
      const sl = Math.hypot(sx, sy, sz);
      this.enemyRay(e, sx / sl, sy / sl, sz / sl, ox, oy, oz, w);
    }
  }

  enemyRay(e, dx, dy, dz, ox, oy, oz, w) {
    const g = this.game;
    const grid = g.district.grid;
    let best = rayHitWorld(grid, ox, oy, oz, dx, dy, dz, w.range);
    const p = g.player;

    // Does it find the player before it finds a wall?
    const tBody = raySphere(ox, oy, oz, dx, dy, dz, p.x, p.y + 1.0, p.z, 0.62);
    let struck = false;
    if (tBody >= 0 && tBody < best) { best = tBody; struck = true; }

    // Or a vehicle - the one the player is driving, the one they are hiding
    // behind, or somebody else's entirely. A round that misses you has to go
    // somewhere, and the parked traffic is what it goes into.
    let struckCar = null;
    if (!struck) {
      for (const v of g.vehicles) {
        if (v.wrecked) continue;
        const tv = raySphere(ox, oy, oz, dx, dy, dz, v.x, 0.9, v.z, v.spec.w * 0.6);
        if (tv >= 0 && tv < best) { best = tv; struckCar = v; }
      }
    }

    this.tracer(ox, oy, oz, ox + dx * best, oy + dy * best, oz + dz * best, true);

    if (struck) {
      g.damagePlayer(e.dmg * (p.inVehicle ? 0.45 : 1), 'gunfire');
      audio.flesh(false);
    } else if (struckCar) {
      g.damageVehicleBody(struckCar, e.dmg * 0.8, 'gunfire');
    } else {
      audio.ricochet(0.5);
    }
  }

  /** Aim everyone in the district at the player. Used when an ambush trips. */
  alertAll() { for (const e of this.enemies) e.alert = true; }

  // ------------------------------------------------------------- ai waves ---

  /**
   * A rolling fight: keep `live` enemies on the field until `total` have been
   * spawned, then let the caller know when the last one drops.
   */
  startWave(cfg) {
    this.wave = Object.assign({
      total: 6, live: 3, tiers: ['goon'], spawned: 0, timer: 0, interval: 1.6,
      radius: 34, minRadius: 18, onClear: null, endless: false,
    }, cfg);
  }

  stopWave() { this.wave = null; }

  updateWave(dt) {
    const wv = this.wave;
    if (!wv) return;
    const g = this.game;
    wv.timer -= dt;
    const live = this.liveEnemies;
    if ((wv.endless || wv.spawned < wv.total) && live < wv.live && wv.timer <= 0) {
      wv.timer = wv.interval;
      const spot = this.spawnSpotNearPlayer(wv.minRadius, wv.radius);
      if (spot) {
        this.spawnEnemy({
          x: spot.x, z: spot.z, tier: this.rng.pick(wv.tiers), alert: true,
        });
        wv.spawned++;
      }
    }
    if (!wv.endless && wv.spawned >= wv.total && live === 0) {
      const cb = wv.onClear;
      this.wave = null;
      if (cb) cb();
    }
  }

  spawnSpotNearPlayer(minR, maxR) {
    const g = this.game;
    for (let i = 0; i < 60; i++) {
      const a = this.rng() * TAU;
      const r = minR + this.rng() * (maxR - minR);
      const x = g.player.x + Math.cos(a) * r;
      const z = g.player.z + Math.sin(a) * r;
      if (Math.abs(x) > g.district.half - 6 || Math.abs(z) > g.district.half - 6) continue;
      if (!g.isClear(x, z, 1.2)) continue;
      return { x, z };
    }
    return null;
  }

  // ------------------------------------------------------- shooting range ---

  spawnTarget(x, z) {
    const m = makeTarget();
    const spot = this.game.nudgeToOpen(this.game.district, x, z, 1.0);
    m.position.set(spot.x, 0, spot.z);
    m.rotation.y = Math.atan2(this.game.player.x - spot.x, this.game.player.z - spot.z);
    this.group.add(m);
    const t = { isTarget: true, mesh: m, x: spot.x, z: spot.z, down: false, fall: 0 };
    this.targets.push(t);
    return t;
  }

  hitTarget(t) {
    if (t.down) return;
    t.down = true;
    t.fall = 0;
    audio.targetPing();
    audio.voiceLadder(this.targets.filter((x) => x.down).length, 0.5);
  }

  updateTargets(dt) {
    for (const t of this.targets) {
      if (!t.down || t.fall >= 1) continue;
      t.fall = Math.min(1, t.fall + dt * 4);
      t.mesh.rotation.x = -t.fall * (Math.PI / 2);
      t.mesh.position.y = -t.fall * 0.2;
    }
  }

  get targetsDown() { return this.targets.filter((t) => t.down).length; }

  clearTargets() {
    for (const t of this.targets) { this.group.remove(t.mesh); disposeTree(t.mesh); }
    this.targets.length = 0;
  }

  // ---------------------------------------------------------------- drops ---

  spawnDrop(x, z, kind, amount = 0, weaponId = null) {
    const g = this.game;
    const spot = g.nudgeToOpen(g.district, x, z, 0.6);
    const mesh = kind === 'cash' ? pickupFor('cash', 0x8de08a)
      : kind === 'ammo' ? pickupFor('ammo', 0xffc94a)
        : kind === 'armour' ? pickupFor('armour', 0x6fc8ff)
          : pickupFor('medkit', 0xff6a6a);
    mesh.position.set(spot.x, 0, spot.z);
    this.group.add(mesh);
    this.drops.push({ mesh, x: spot.x, z: spot.z, kind, amount, weaponId, life: 60 });
  }

  updateDrops(dt) {
    const g = this.game;
    const t = performance.now() * 0.001;
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.life -= dt;
      if (d.mesh.userData.spin) {
        d.mesh.userData.spin.rotation.y += dt * 2.2;
        d.mesh.userData.spin.position.y = 0.45 + Math.sin(t * 3 + d.x) * 0.1;
      }
      let taken = false;
      if (dist2(g.player.x, g.player.z, d.x, d.z) < 6) {
        taken = this.collect(d);
      }
      if (taken || d.life <= 0) {
        this.group.remove(d.mesh);
        disposeTree(d.mesh);
        this.drops.splice(i, 1);
      }
    }
  }

  collect(d) {
    const g = this.game;
    if (d.kind === 'cash') {
      g.stats.cash += d.amount;
      g.ui.toast('+' + Math.round(d.amount) + ' from the body');
      audio.pickupChime(4);
      return true;
    }
    if (d.kind === 'ammo') {
      const id = this.owned.has(d.weaponId) ? d.weaponId : this.current;
      const w = WEAPONS[id];
      if (!w || !w.mag) return false;
      const got = this.addAmmo(id, Math.round(w.mag * 1.5));
      if (got <= 0) return false;
      g.ui.toast('+' + got + ' ' + w.name + ' rounds');
      audio.pickupChime(6);
      return true;
    }
    if (d.kind === 'medkit') {
      if (g.player.health >= 100) return false;
      g.player.heal(40);
      g.ui.toast('Patched up');
      audio.pickupChime(8);
      return true;
    }
    if (d.kind === 'armour') {
      if (g.player.armour >= 100) return false;
      g.player.addArmour(50);
      g.ui.toast('Vest on');
      audio.pickupChime(10);
      return true;
    }
    return false;
  }

  clearDrops() {
    for (const d of this.drops) { this.group.remove(d.mesh); disposeTree(d.mesh); }
    this.drops.length = 0;
  }

  /** Called when the player leaves a district: nothing survives the trip. */
  clearAll() {
    this.clearEnemies();
    this.clearTargets();
    this.clearDrops();
    this.stopWave();
    for (const fx of this.effects) { this.group.remove(fx); disposeTree(fx); }
    this.effects.length = 0;
  }
}

// ----------------------------------------------------------------- helpers ---

function pickupFor(kind, glow) { return makePickup(kind, glow); }

const _tintCache = new WeakMap();

function tintChar(char, hex) {
  const seen = new Set();
  char.group.traverse((n) => {
    if (!n.isMesh || !n.material || seen.has(n.material)) return;
    seen.add(n.material);
    if (!_tintCache.has(n.material)) _tintCache.set(n.material, n.material.color.getHex());
    n.material.color.setHex(hex);
  });
}

function untintChar(char) {
  const seen = new Set();
  char.group.traverse((n) => {
    if (!n.isMesh || !n.material || seen.has(n.material)) return;
    seen.add(n.material);
    const c = _tintCache.get(n.material);
    if (c !== undefined) n.material.color.setHex(c);
  });
}

function disposeTree(obj) {
  obj.traverse((n) => {
    if (n.isMesh) {
      n.geometry.dispose();
      if (Array.isArray(n.material)) n.material.forEach((m) => m.dispose());
      else if (n.material) n.material.dispose();
    }
  });
}
