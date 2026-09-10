// Nagesh City - the game itself.
//
// Owns the renderer, the district you are currently standing in, the player,
// the traffic, the missions and the save file.

import * as THREE from '../vendor/three.module.js';
import { DISTRICTS, buildDistrict, buildVault } from './world.js';
import { Player, Input } from './player.js';
import { Vehicle } from './vehicles.js';
import { MissionRunner } from './missions.js';
import { Minimap } from './minimap.js';
import { UI } from './ui.js';
import { audio, VOICE } from './audio.js';
import { CHAPTERS, CHATTER, ENDINGS, CHARACTERS, SHOPS } from './story.js';
import { makeCharacter, makeFireFX, OUTFITS } from './actors.js';
import { Combat, WEAPONS, SERVICES } from './combat.js';
import { clamp, damp, dampAngle, dist2, makeRNG, TAU, angleDelta, resolveCircle, Box } from './util.js';
import { skyTexture } from './art.js';

const SAVE_KEY = 'nagesh-city-save-v1';
const ORDER = ['slums', 'midtown', 'heights', 'vault'];

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: window.devicePixelRatio < 1.5, powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.14;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.35, 900);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1536, 1536);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 260;
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this.ui = new UI();
    this.input = new Input(canvas);
    this.minimap = new Minimap(document.getElementById('minimap'), document.getElementById('fullmap-canvas'));

    this.player = new Player(this.scene);
    this.missions = new MissionRunner(this);
    this.missions.attach(this.scene);
    this.combat = new Combat(this);
    this.combat.attach(this.scene);

    this.districts = new Map();
    this.district = null;
    this.vehicles = [];
    this.burning = [];        // vehicles counting down to a crater
    this.peds = [];
    this.shops = [];
    this.waypoints = [];
    this.unlocked = new Set(['slums']);
    this.stats = { cash: 0, fame: 0, debt: 0, contract: false };
    this.canWhistle = false;
    this.paused = false;
    this.mapOpen = false;
    this.shopOpen = false;
    this.running = false;
    this.carrying = null;
    this.deathTimer = 0;
    this.damageFlash = 0;
    this.chatterTimer = 4;
    this.debtTick = 0;
    this.rng = makeRNG(7777);
    this._lampHits = [];
    this.clock = new THREE.Clock();
    this.frameSmooth = 16;
    this.ending = null;

    this.onResize();
    window.addEventListener('resize', () => this.onResize());
    canvas.addEventListener('click', () => {
      if (this.running && !this.paused && !this.ui.dialogueActive && !this.mapOpen && !this.shopOpen) {
        this.input.requestLock();
      }
    });
  }

  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.minimap.resize();
    this.ui.resizeNav();
  }

  // ------------------------------------------------------------- districts ---

  async getDistrict(id) {
    if (this.districts.has(id)) return this.districts.get(id);
    const def = DISTRICTS.find((d) => d.id === id);
    const built = def ? buildDistrict(def) : buildVault();
    // A gate barrier that only lifts when the district's work is done.
    if (built.landmarks.gate) {
      const g = built.landmarks.gate;
      const bar = new Box(0, g.z, g.half, 1.4, g.h, 'gate');
      built.grid.insert(bar);
      built.gateBarrier = bar;

      const field = new THREE.Mesh(
        new THREE.PlaneGeometry(g.half * 2, g.h),
        new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
      );
      field.position.set(0, g.h / 2, g.z);
      built.group.add(field);
      built.gateField = field;
    }
    this.scene.add(built.group);
    this.districts.set(id, built);
    return built;
  }

  async enterDistrict(id, opts = {}) {
    const d = await this.getDistrict(id);
    // A mission belongs to the district it was handed out in. If one is
    // somehow still live, drop it, or the new district gets no start marker.
    if (this.missions.state !== 'idle') this.missions.abandonAll();
    this.combat.clearAll();
    if (this.district) {
      this.district.group.visible = false;
      this.clearVehicles();
      this.clearPeds();
    }
    this.district = d;
    d.group.visible = true;

    const def = d.def;
    this.scene.background = skyTexture(def.sky.top, def.sky.mid, def.sky.bot, def.id);
    this.scene.fog = new THREE.Fog(def.fog.color, def.fog.near, def.fog.far);
    this.hemi.color.setHex(def.hemi.sky);
    this.hemi.groundColor.setHex(def.hemi.ground);
    this.hemi.intensity = def.hemi.intensity;
    this.sun.color.setHex(def.sun.color);
    this.sun.intensity = def.sun.intensity;
    this.sunDir = new THREE.Vector3(...def.sun.pos).normalize();

    const shadowSize = id === 'vault' ? 48 : 78;
    const sc = this.sun.shadow.camera;
    sc.left = -shadowSize; sc.right = shadowSize;
    sc.top = shadowSize; sc.bottom = -shadowSize;
    sc.updateProjectionMatrix();

    // Outfit tracks status. Nagesh dresses like wherever he has got to - and
    // he walks into Sub-Level 9 still wearing the Heights.
    this.player.setOutfit(id === 'vault' ? 'heights' : id);
    // The outfit change rebuilds the whole rig, gun hand included.
    this.combat.onPlayerRebuilt();

    const sp = opts.spawn || def.spawn || { x: 0, z: 0, rot: 0 };
    if (this.player.inVehicle) this.player.exit(d.grid);
    const safe = this.nudgeToOpen(d, sp.x, sp.z);
    this.player.teleport(safe.x, safe.z, sp.rot);
    this.player.revive();

    if (d.lamps) d.lamps.reset();
    this.spawnTraffic(d);
    this.spawnPeds(d);
    this.buildShops(d);
    this.refreshGate();
    this.minimap.ensureCache(d);
    audio.playTrack(def.music);
    this.missions.refreshStartMarker();
  }

  refreshGate() {
    const d = this.district;
    if (!d || !d.gateBarrier) return;
    // Aurum Heights is the top of the ladder and its gate never opens. Priya
    // spends a whole mission proving it; the collision has to agree with her.
    const done = this.missions.districtDone(d.def.id) && d.def.id !== 'heights';
    d.gateBarrier.disabled = done;
    if (d.gateField) {
      d.gateField.visible = !done;
      d.gateField.material.color.setHex(done ? 0x6dff8a : 0xff3b30);
    }
  }

  districtLockMessage() {
    const d = this.district;
    if (!d) return '';
    if (d.def.id === 'vault') return 'No way out but through';
    if (d.def.id === 'heights' && this.missions.districtDone('heights')) {
      return 'The gate only opens downward';
    }
    if (this.missions.districtDone(d.def.id)) return '';
    const n = this.missions.remainingInDistrict;
    return n + ' mission' + (n === 1 ? '' : 's') + ' before the gate opens';
  }

  async unlockDistrict(id, mission) {
    this.unlocked.add(id);
    this.stats.contract = true;
    this.refreshGate();
    audio.voice(VOICE.unlock);
    // Descending into Sub-Level 9 is not a promotion and does not get fanfare.
    if (id !== 'vault') {
      audio.gateOpen();
      this.ui.flashBanner('GATE OPEN', 'The road north is clear', 'good');
    }
    this.save();
  }

  async travelTo(id, spawn) {
    this.transitioning = true;
    this.input.releaseLock();
    await this.ui.fadeTo(1, 620);
    audio.stopTrack();
    audio.stopEngine();
    await this.enterDistrict(id, { spawn });
    const ch = CHAPTERS[id];
    await this.ui.fadeTo(0, 620);
    if (ch) this.ui.showChapter(ch);
    this.transitioning = false;
  }

  async descendToVault() {
    await this.travelTo('vault');
  }

  // -------------------------------------------------------------- vehicles ---

  spawnTraffic(d) {
    for (const v of (d.def.vehicles || [])) {
      this.spawnVehicle(v.type, v.x, v.z, v.rot || 0, v.color);
    }
    // Live traffic on top of the parked stuff. Six is enough for the roads to
    // feel used without turning every junction into a queue.
    const roads = d.def.roads || [];
    if (roads.length < 2) return;
    const types = d.def.id === 'slums' ? ['tuk', 'scooter', 'hatch', 'tuk', 'van', 'scooter']
      : d.def.id === 'midtown' ? ['sedan', 'hatch', 'van', 'sedan', 'scooter', 'hatch']
        : ['sedan', 'limo', 'sports', 'sedan', 'hatch', 'limo'];
    for (let i = 0; i < types.length; i++) {
      this.spawnTrafficVehicle(types[i], {
        axis: this.rng.chance(0.5) ? 'x' : 'z',
        laneIdx: this.rng.int(0, roads.length - 1),
        index: this.rng.int(0, roads.length - 1),
        dir: this.rng.sign(),
      });
    }
  }

  /**
   * A car with a driver in it. It is an ordinary Vehicle, so it collides with
   * you, takes gunfire and burns - the AI is only a set of inputs pushed into
   * the same physics everything else uses.
   *
   * The route is not a list of points. It is a lane: an axis to travel along, a
   * road to travel on, and a direction. At each junction it picks straight on
   * or a turn, and never a U-turn. The old version chose random road
   * coordinates for each leg, so roughly half of all legs reversed the car and
   * the traffic spent its life pacing up and down one street.
   */
  spawnTrafficVehicle(type, opts = {}) {
    const roads = this.district.def.roads;
    if (!roads || roads.length < 2) return null;
    const n = roads.length;
    const ai = {
      axis: opts.axis || 'x',
      laneIdx: clamp(opts.laneIdx === undefined ? 0 : opts.laneIdx, 0, n - 1),
      index: clamp(opts.index === undefined ? 0 : opts.index, 0, n - 1),
      dir: opts.dir >= 0 ? 1 : -1,
      cruise: this.rng.range(9, 14), panic: 0, honk: 0, stuck: 0,
    };
    // Start one junction back from the target so there is road to drive on.
    if (ai.index + ai.dir < 0 || ai.index + ai.dir >= n) ai.dir = -ai.dir;
    const from = this.aiPointAt(ai, ai.index);
    ai.index = clamp(ai.index + ai.dir, 0, n - 1);

    const v = this.spawnVehicle(type, from.x, from.z, 0, opts.color);
    v.ai = ai;
    const t = this.aiTargetPoint(ai);
    v.heading = Math.atan2(t.x - v.x, t.z - v.z);
    v.group.rotation.y = v.heading;
    this.addDriver(v);
    return v;
  }

  /**
   * How far to sit from the road's centre line, on the left of the direction of
   * travel, so oncoming traffic passes on the correct side instead of playing
   * chicken down the middle.
   */
  laneOffset(axis, dir) {
    const amt = (this.district.def.roadHalf || 7) * 0.46;
    return axis === 'x' ? (dir > 0 ? -amt : amt) : (dir > 0 ? amt : -amt);
  }

  /** A point on this lane at the given junction index. */
  aiPointAt(ai, index) {
    const roads = this.district.def.roads;
    const lane = roads[ai.laneIdx] + this.laneOffset(ai.axis, ai.dir);
    const along = roads[index];
    return ai.axis === 'x' ? { x: along, z: lane } : { x: lane, z: along };
  }

  aiTargetPoint(ai) { return this.aiPointAt(ai, ai.index); }

  /**
   * Pick the next leg at a junction: straight on, or a left or right turn.
   * A turn swaps the axes - the road you were crossing becomes the road you
   * are now driving along.
   */
  aiAdvance(v) {
    const ai = v.ai;
    const roads = this.district.def.roads;
    const n = roads.length;
    const options = [];

    const straight = ai.index + ai.dir;
    if (straight >= 0 && straight < n) {
      options.push({ axis: ai.axis, laneIdx: ai.laneIdx, index: straight, dir: ai.dir, w: 3 });
    }
    const otherAxis = ai.axis === 'x' ? 'z' : 'x';
    for (const d of [-1, 1]) {
      const idx = ai.laneIdx + d;
      if (idx < 0 || idx >= n) continue;
      options.push({ axis: otherAxis, laneIdx: ai.index, index: idx, dir: d, w: 1 });
    }

    if (!options.length) {
      // Boxed into a corner of the grid; turning round is the only move left.
      ai.dir = -ai.dir;
      ai.index = clamp(ai.index + ai.dir, 0, n - 1);
      return;
    }
    let total = 0;
    for (const o of options) total += o.w;
    let r = this.rng() * total;
    let pick = options[0];
    for (const o of options) { r -= o.w; if (r <= 0) { pick = o; break; } }
    ai.axis = pick.axis; ai.laneIdx = pick.laneIdx; ai.index = pick.index; ai.dir = pick.dir;
  }

  /** Index of the road nearest a world coordinate. */
  nearestRoadIdx(val) {
    const roads = this.district.def.roads;
    let bi = 0;
    for (let i = 1; i < roads.length; i++) {
      if (Math.abs(roads[i] - val) < Math.abs(roads[bi] - val)) bi = i;
    }
    return bi;
  }

  /** Traffic that has to start somewhere specific, e.g. a mission's van. */
  spawnTrafficNear(type, x, z, color) {
    const roads = this.district.def.roads;
    if (!roads || roads.length < 2) return null;
    const nx = this.nearestRoadIdx(x), nz = this.nearestRoadIdx(z);
    // Closer to a north-south road means it is driving along z, and vice versa.
    const axis = Math.abs(roads[nx] - x) < Math.abs(roads[nz] - z) ? 'z' : 'x';
    return this.spawnTrafficVehicle(type, {
      axis,
      laneIdx: axis === 'x' ? nz : nx,
      index: axis === 'x' ? nx : nz,
      dir: this.rng.sign(),
      color,
    });
  }

  /** Re-derive a lane from wherever the car has ended up. */
  aiRelocate(v) {
    const roads = this.district.def.roads;
    const nearestIdx = (val) => this.nearestRoadIdx(val);
    const ai = v.ai;
    // Whichever axis the car is better aligned with is the one it is on.
    const fx = Math.abs(Math.sin(v.heading)), fz = Math.abs(Math.cos(v.heading));
    ai.axis = fx >= fz ? 'x' : 'z';
    ai.dir = (ai.axis === 'x' ? Math.sin(v.heading) : Math.cos(v.heading)) >= 0 ? 1 : -1;
    ai.laneIdx = nearestIdx(ai.axis === 'x' ? v.z : v.x);
    ai.index = nearestIdx(ai.axis === 'x' ? v.x : v.z);
    const n = roads.length;
    if (ai.index + ai.dir < 0 || ai.index + ai.dir >= n) ai.dir = -ai.dir;
    ai.index = clamp(ai.index + ai.dir, 0, n - 1);
  }

  updateTraffic(dt) {
    for (const v of this.vehicles) {
      if (!v.ai || v.occupied || v.wrecked) continue;
      const ai = v.ai;
      if (ai.panic > 0) ai.panic -= dt;

      // Arrival is measured along the travel axis only, so drifting off the
      // lane laterally never counts as reaching the junction.
      let tgt = this.aiTargetPoint(ai);
      const along = (ai.axis === 'x' ? tgt.x - v.x : tgt.z - v.z) * ai.dir;
      if (along < 6) {
        this.aiAdvance(v);
        tgt = this.aiTargetPoint(ai);
      }

      const want = Math.atan2(tgt.x - v.x, tgt.z - v.z);
      // Vehicle.update turns by `heading -= steer * ...`, so a left turn is a
      // negative steer. Getting this backwards makes traffic drive in circles.
      const delta = angleDelta(v.heading, want);
      const steer = clamp(-delta * 1.7, -1, 1);

      const cruise = ai.panic > 0 ? ai.cruise * 1.9 : ai.cruise;
      let throttle = Math.abs(v.speed) > cruise ? 0 : 1;
      // Slow into corners, or a van takes a junction on two wheels.
      if (Math.abs(delta) > 0.7 && Math.abs(v.speed) > cruise * 0.55) throttle = -0.4;

      if (this.roadAheadBlocked(v)) {
        throttle = -0.7;
        ai.honk -= dt;
        if (ai.honk <= 0 && Math.abs(v.speed) < 3) {
          ai.honk = 2.2 + Math.random() * 3;
          const g = audio.gainAt(v.x, v.z, 30);
          if (g > 0.02) audio.tone(330 + Math.random() * 90, 0.34, { wave: 'square', gain: 0.05 * g });
        }
      }

      // Nudged into something and going nowhere: work out where it actually is
      // and give it a fresh lane out of there.
      if (Math.abs(v.speed) < 0.7 && throttle > 0) {
        ai.stuck += dt;
        if (ai.stuck > 2.4) { ai.stuck = 0; this.aiRelocate(v); }
      } else ai.stuck = 0;

      this.knockLamps(v, dt);
      v.update(dt, { throttle, steer, handbrake: false }, this.district.grid);
    }
  }

  /**
   * Put somebody behind the wheel. The driver is parented to the vehicle group
   * so it inherits the body's position and lean for free, and it is also what
   * marks the car as somebody else's: you cannot get into an occupied vehicle.
   */
  addDriver(v) {
    const key = this.district.def.id;
    const base = OUTFITS[key] || OUTFITS.slum;
    const outfit = Object.assign({}, base, {
      shirt: this.rng.pick(PED_SHIRTS[key] || PED_SHIRTS.slums),
      pants: this.rng.pick([0x2f2f36, 0x3b3a42, 0x4a4238, 0x24252c]),
    });
    const char = makeCharacter({
      outfit, simple: true,
      hairStyle: this.rng.pick(['short', 'short', 'cap', 'long']),
      tall: this.rng.range(0.94, 1.06),
    });
    const s = v.spec.seat || { x: 0, y: v.spec.seatY, z: 0 };
    // seatPoint() offsets by `s.x` along the vehicle's right, which is -x in
    // the model's own frame; the sit pose puts the hips 0.5 above the origin.
    char.group.position.set(-s.x, s.y - 0.5, s.z);
    char.update(0, 0, 'sit');
    v.group.add(char.group);
    v.driver = char;
    return char;
  }

  /** The driver gets out, or is no longer there to be shot at. */
  dismissDriver(v) {
    if (!v.driver) return;
    v.group.remove(v.driver.group);
    v.driver.group.traverse((n) => {
      if (n.isMesh) {
        n.geometry.dispose();
        if (Array.isArray(n.material)) n.material.forEach((m) => m.dispose());
        else if (n.material) n.material.dispose();
      }
    });
    v.driver = null;
  }

  /** Is there something in this car's way in the next few metres? */
  roadAheadBlocked(v) {
    const look = 6 + Math.abs(v.speed) * 0.95;
    const fx = Math.sin(v.heading), fz = Math.cos(v.heading);
    const rx = -Math.cos(v.heading), rz = Math.sin(v.heading);
    const test = (x, z, halfWidth) => {
      const dx = x - v.x, dz = z - v.z;
      const along = dx * fx + dz * fz;
      if (along < 0.5 || along > look) return false;
      return Math.abs(dx * rx + dz * rz) < halfWidth;
    };
    for (const o of this.vehicles) {
      if (o === v) continue;
      if (test(o.x, o.z, v.spec.w * 0.5 + o.spec.w * 0.5 + 0.4)) return true;
    }
    if (!this.player.inVehicle && test(this.player.x, this.player.z, v.spec.w * 0.5 + 1.1)) return true;
    for (const e of this.combat.enemies) {
      if (!e.dead && test(e.x, e.z, v.spec.w * 0.5 + 1.0)) return true;
    }
    return false;
  }

  // ------------------------------------------------------ vehicle damage ---

  /**
   * The single funnel for anything that hurts a vehicle. When the panels run
   * out it catches fire and starts a fuse rather than simply stopping working,
   * because a car that is about to go off is far more interesting than one
   * that has quietly died.
   */
  damageVehicleBody(v, amount, source) {
    if (!v || v.wrecked) return;
    const started = v.damage(amount, source);
    if (v.ai && !v.occupied) v.ai.panic = 9;
    if (!started) return;
    // Whoever was driving gets out rather than sitting in it for the three
    // seconds it spends on fire.
    this.dismissDriver(v);
    v.fx = makeFireFX();
    v.fx.position.y = 0.4;
    v.group.add(v.fx);
    v.crackle = 0;
    this.burning.push(v);
    if (this.player.inVehicle && this.player.vehicle === v) {
      this.ui.flashBanner('GET OUT', 'Press F. Now.', 'bad');
      audio.voice(VOICE.hurt, { gain: 0.9, throttle: 0 });
    } else {
      this.ui.toast('That one is going up');
    }
  }

  updateBurning(dt) {
    for (let i = this.burning.length - 1; i >= 0; i--) {
      const v = this.burning[i];
      if (v.fx) v.fx.userData.update(dt);
      v.crackle -= dt;
      if (v.crackle <= 0) {
        v.crackle = 0.35 + Math.random() * 0.4;
        audio.fireCrackle(audio.gainAt(v.x, v.z, 26));
      }
      v.fuse -= dt;
      if (v.fuse > 0) continue;
      this.burning.splice(i, 1);
      this.explodeVehicle(v);
    }
  }

  explodeVehicle(v) {
    if (v.fx) {
      v.group.remove(v.fx);
      v.fx.traverse((n) => { if (n.isMesh) { n.geometry.dispose(); n.material.dispose(); } });
      v.fx = null;
    }
    // Anyone still sitting in it is thrown clear, and then caught by the blast
    // anyway. The fuse was the warning.
    if (this.player.inVehicle && this.player.vehicle === v) {
      this.player.exit(this.district.grid);
      audio.stopEngine();
    }
    this.dismissDriver(v);
    v.wreck();
    v.ai = null;
    v.speed = 0; v.vx = 0; v.vz = 0;
    this.combat.boom(v.x, 1.0, v.z, { radius: 11.5, damage: 58, scale: 1.3, source: v });
  }

  spawnVehicle(type, x, z, rot, color) {
    const v = new Vehicle(type, x, z, rot, color);
    // Never leave a car wedged inside a wall it can't drive out of.
    if (this.district) {
      const safe = this.nudgeToOpen(this.district, x, z, v.radius + 0.5);
      v.x = safe.x; v.z = safe.z;
      v.group.position.set(safe.x, 0, safe.z);
    }
    this.scene.add(v.group);
    this.vehicles.push(v);
    return v;
  }

  removeVehicle(v) {
    const i = this.vehicles.indexOf(v);
    // Already gone - a mission and a district change can both want it removed.
    if (i < 0) return;
    this.vehicles.splice(i, 1);
    const b = this.burning.indexOf(v);
    if (b >= 0) this.burning.splice(b, 1);
    this.scene.remove(v.group);
    v.dispose();
  }

  clearVehicles() {
    if (this.player.inVehicle) this.player.exit(null);
    for (const v of this.vehicles) { this.scene.remove(v.group); v.dispose(); }
    this.vehicles.length = 0;
    this.burning.length = 0;
    this.missions.aiVehicles.length = 0;
  }

  /**
   * The nearest vehicle Nagesh could actually drive. Burnt-out shells are
   * scenery, and a car with somebody already in it is somebody else's - the
   * whistle used to teleport passing traffic to your feet, driver and all.
   */
  nearestVehicle(maxDist) {
    let best = null, bestD = maxDist * maxDist;
    for (const v of this.vehicles) {
      if (v.wrecked || v.driver) continue;
      const d = dist2(this.player.x, this.player.z, v.x, v.z);
      if (d < bestD) { bestD = d; best = v; }
    }
    return best;
  }

  /**
   * Knock over any lamp post the vehicle is about to hit hard, and disable its
   * collider in the same frame so the car keeps going through it.
   */
  knockLamps(v, dt) {
    const d = this.district;
    if (!d || !d.lamps) return;
    if (Math.abs(v.speed) < 5) return;
    const px = v.x + v.vx * dt;
    const pz = v.z + v.vz * dt;
    const boxes = d.grid.query(px, pz, v.radius + 2, this._lampHits);
    for (const b of boxes) {
      if (b.tag !== 'lamp' || b.disabled) continue;
      if (Math.abs(px - b.x) > b.hw + v.radius || Math.abs(pz - b.z) > b.hd + v.radius) continue;
      if (!d.lamps.knock(b.lamp, v.vx, v.vz)) continue;
      audio.clang(audio.gainAt(b.x, b.z));
      if (v === this.player.vehicle) {
        audio.voice(1.45, { gain: 0.5 });
        this.ui.toast('Light post down');
      }
      this.damageVehicleBody(v, 5, 'lamp');
      // Ploughing through costs a little speed, but not the run.
      v.vx *= 0.9; v.vz *= 0.9; v.speed *= 0.9;
    }
  }

  /** Two tonnes of tuk-tuk is a legitimate answer to a man with a pistol. */
  runOverCheck(v, dt) {
    const speed = Math.abs(v.speed);
    if (speed < 6) return;
    const r = v.spec.w * 0.6 + 0.55;
    for (const e of this.combat.enemies) {
      if (e.dead || dist2(e.x, e.z, v.x, v.z) > r * r) continue;
      this.combat.damageEnemy(e, 28 + speed * 4.5, false);
      audio.thump();
      v.speed *= 0.86;
      this.damageVehicleBody(v, 3, 'impact');
    }
  }

  /** Deepa said to whistle for it. */
  whistle() {
    if (!this.canWhistle || this.player.inVehicle) return;
    const v = this.nearestVehicle(400);
    if (!v) return;
    const a = this.player.heading + Math.PI / 2;
    for (let r = 6; r < 22; r += 2) {
      const x = this.player.x + Math.sin(a) * r;
      const z = this.player.z + Math.cos(a) * r;
      if (this.isClear(x, z, 3)) {
        v.x = x; v.z = z; v.vx = 0; v.vz = 0; v.speed = 0;
        v.heading = this.player.heading;
        v.group.position.set(x, 0, z);
        audio.voice(1.55, { gain: 0.6 });
        audio.tone(880, 0.14, { wave: 'sine', gain: 0.08, to: 1760 });
        this.ui.toast('You whistled. It came.');
        return;
      }
    }
  }

  // ----------------------------------------------------------------- shops ---

  buildShops(d) {
    this.shops = [];
    for (const key in d.landmarks) {
      const l = d.landmarks[key];
      if (!l.shop || !SHOPS[l.shop]) continue;
      this.shops.push({
        id: l.shop, def: SHOPS[l.shop],
        x: l.counter ? l.counter.x : l.cx,
        z: l.counter ? l.counter.z : l.cz,
      });
    }
  }

  nearestShop() {
    if (this.player.inVehicle) return null;
    for (const s of this.shops) {
      if (dist2(this.player.x, this.player.z, s.x, s.z) < 25) return s;
    }
    return null;
  }

  /**
   * Build the counter's list. Weapons you already own turn into ammunition for
   * that weapon, which is the only sensible way for a shop with six lines on it
   * to stay useful for a whole game.
   */
  shopItems(shop) {
    const items = [];
    for (const key of shop.def.stock) {
      const w = WEAPONS[key];
      if (w) {
        if (!this.combat.has(key)) {
          items.push({
            key, kind: 'weapon', wid: key, name: w.name, price: w.price,
            desc: w.melee
              ? Math.round(w.dmg) + ' damage, no ammunition, no noise'
              : Math.round(w.dmg) + ' damage  ·  ' + w.mag + '-round magazine  ·  ' + Math.round(w.range) + ' m',
          });
        } else if (w.mag) {
          const held = this.combat.reserve(key);
          items.push({
            key: key + '_ammo', kind: 'ammo', wid: key,
            name: w.name + ' rounds', price: w.ammoPrice,
            desc: '+' + w.ammoPer + ' rounds  ·  holding ' + held + ' / ' + w.maxAmmo,
            full: held >= w.maxAmmo,
          });
        }
        continue;
      }
      const s = SERVICES[key];
      if (!s) continue;
      const row = { key, kind: s.vehicle ? 'vehicle' : key, name: s.name, price: s.price, desc: s.desc };
      if (s.vehicle) row.vehicle = s.vehicle;
      if (key === 'medkit') row.full = this.player.health >= 100;
      if (key === 'armour') row.full = this.player.armour >= 100;
      if (key === 'repair') {
        const v = this.nearestVehicle(16);
        row.full = !v || v.wrecked || v.body >= 100;
        row.desc = !v ? 'No vehicle within reach of the counter'
          : v.wrecked ? 'That one is past panel beating'
            : s.desc + '  (' + v.spec.name + ' at ' + Math.round(v.body) + '%)';
      }
      items.push(row);
    }
    return items;
  }

  openShop(shop) {
    this.shopOpen = true;
    this.input.releaseLock();
    audio.duckMusic(0.4, 999);
    const refresh = () => this.ui.showShop(shop, this.shopItems(shop), this.stats.cash, buy, close);
    const buy = (item) => { this.buy(item); refresh(); };
    const close = () => this.closeShop();
    refresh();
  }

  closeShop() {
    this.shopOpen = false;
    this.ui.hideShop();
    audio.duckMusic(1, 0.2);
    if (this.running && !this.paused) this.input.requestLock();
  }

  buy(item) {
    if (item.full) { audio.denied(); this.ui.toast('Nothing to buy there'); return; }
    if (this.stats.cash < item.price) {
      audio.denied();
      this.ui.toast('Not enough cash. Gurjaap does not do credit and neither does anyone else.');
      return;
    }

    let ok = true;
    switch (item.kind) {
      case 'weapon':
        this.combat.give(item.wid);
        this.ui.toast(WEAPONS[item.wid].name + ' - yours, outright');
        break;
      case 'ammo':
        ok = this.combat.addAmmo(item.wid, WEAPONS[item.wid].ammoPer) > 0;
        if (ok) this.ui.toast('+' + WEAPONS[item.wid].ammoPer + ' rounds');
        break;
      case 'medkit':
        this.player.heal(100);
        this.ui.toast('Patched up');
        break;
      case 'armour':
        this.player.addArmour(100);
        this.ui.toast('Vest on');
        break;
      case 'repair': {
        const v = this.nearestVehicle(16);
        if (!v || v.wrecked) { ok = false; break; }
        v.body = 100;
        if (v.burning) {
          // Putting the fire out counts as panel beating, and at this price it
          // is the best value on the counter.
          const i = this.burning.indexOf(v);
          if (i >= 0) this.burning.splice(i, 1);
          if (v.fx) {
            v.group.remove(v.fx);
            v.fx.traverse((n) => { if (n.isMesh) { n.geometry.dispose(); n.material.dispose(); } });
            v.fx = null;
          }
          v.burning = false;
        }
        this.ui.toast(v.spec.name + ' straightened out');
        break;
      }
      case 'vehicle': {
        const spot = this.findDeliverySpot();
        const v = this.spawnVehicle(item.vehicle, spot.x, spot.z, this.player.heading);
        v.ai = null;
        this.ui.toast(v.spec.name + ' at the kerb outside');
        break;
      }
      default: ok = false;
    }

    if (!ok) { audio.denied(); return; }
    this.stats.cash -= item.price;
    audio.cashRegister();
    audio.voice(1.5, { gain: 0.5 });
    this.save();
  }

  /** Somewhere beside the shop with enough room to leave a car. */
  findDeliverySpot() {
    for (let r = 8; r < 40; r += 3) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        const x = this.player.x + Math.cos(a) * r;
        const z = this.player.z + Math.sin(a) * r;
        if (this.isClear(x, z, 3.4)) return { x, z };
      }
    }
    return { x: this.player.x + 6, z: this.player.z };
  }

  // ------------------------------------------------------------ pedestrians ---

  spawnPeds(d) {
    if (d.def.id === 'vault') return;
    const outfitKey = d.def.id;
    const n = 9;
    for (let i = 0; i < n; i++) {
      const spot = this.findOpenSpot(d, 22, d.half - 20);
      if (!spot) continue;
      const base = OUTFITS[outfitKey] || OUTFITS.slum;
      const outfit = Object.assign({}, base, {
        shirt: this.rng.pick(PED_SHIRTS[outfitKey] || PED_SHIRTS.slums),
        pants: this.rng.pick([0x2f2f36, 0x3b3a42, 0x4a4238, 0x24252c]),
      });
      const char = makeCharacter({
        outfit, simple: true,
        hairStyle: this.rng.pick(['short', 'short', 'long', 'cap']),
        tall: this.rng.range(0.92, 1.08),
        bulk: this.rng.range(0.9, 1.12),
      });
      char.group.position.set(spot.x, 0, spot.z);
      this.scene.add(char.group);
      this.peds.push({
        char, x: spot.x, z: spot.z, heading: this.rng() * TAU,
        speed: 0, target: this.findOpenSpot(d, 20, d.half - 20) || spot,
        wait: this.rng.range(0, 3), said: 0,
      });
    }
  }

  clearPeds() {
    for (const p of this.peds) {
      this.scene.remove(p.char.group);
      p.char.group.traverse((n) => {
        if (n.isMesh) {
          n.geometry.dispose();
          if (Array.isArray(n.material)) n.material.forEach((m) => m.dispose());
          else if (n.material) n.material.dispose();
        }
      });
    }
    this.peds.length = 0;
  }

  updatePeds(dt) {
    const d = this.district;
    for (const p of this.peds) {
      if (p.wait > 0) {
        p.wait -= dt;
        p.speed = damp(p.speed, 0, 8, dt);
      } else {
        const dx = p.target.x - p.x, dz = p.target.z - p.z;
        const dl = Math.hypot(dx, dz);
        if (dl < 2.5) {
          p.target = this.findOpenSpot(d, 15, d.half - 20) || p.target;
          p.wait = this.rng.range(0.8, 3.5);
        } else {
          p.heading = dampAngle(p.heading, Math.atan2(dx, dz), 4, dt);
          p.speed = damp(p.speed, 1.7, 3, dt);
        }
      }
      const nx = p.x + Math.sin(p.heading) * p.speed * dt;
      const nz = p.z + Math.cos(p.heading) * p.speed * dt;
      const pos = { x: nx, z: nz };
      const hit = resolveCircle(d.grid, pos, 0.5);
      if (hit.hits) { p.heading += 1.4; p.wait = 0.2; }
      p.x = pos.x; p.z = pos.z;
      p.char.group.position.set(p.x, 0, p.z);
      p.char.group.rotation.y = p.heading;
      p.char.update(dt, p.speed, 'walk');
    }

    // Ambient chatter from whoever is closest.
    this.chatterTimer -= dt;
    if (this.chatterTimer <= 0 && !this.ui.dialogueActive) {
      this.chatterTimer = this.rng.range(9, 18);
      const lines = CHATTER[d.def.id] || [];
      if (!lines.length) return;
      let near = null, bestD = 22 * 22;
      for (const p of this.peds) {
        const dd = dist2(p.x, p.z, this.player.x, this.player.z);
        if (dd < bestD) { bestD = dd; near = p; }
      }
      if (near) {
        const line = this.rng.pick(lines);
        this.ui.toast('“' + line + '”', 'speech');
        // Beep it out so the city is audibly full of people.
        const voice = CHARACTERS.crowd.voice;
        let i = 0;
        const t = setInterval(() => {
          if (i >= Math.min(line.length, 26)) return clearInterval(t);
          const c = line.charCodeAt(i);
          if (/[a-zA-Z]/.test(line[i])) audio.blip(voice, c);
          i += 2;
        }, 42);
      }
    }
  }

  // ------------------------------------------------------------------ util ---

  playerPos() { return { x: this.player.x, z: this.player.z }; }
  playerNear(x, z, r) { return dist2(this.player.x, this.player.z, x, z) < r * r; }

  isClear(x, z, radius) {
    const d = this.district;
    if (!d) return false;
    if (Math.abs(x) > d.half - 4 || Math.abs(z) > d.half - 4) return false;
    const p = { x, z };
    const hit = resolveCircle(d.grid, p, radius);
    return hit.hits === 0;
  }

  /**
   * Spiral out from a point until we find somewhere the player is not standing
   * inside a wall. Generation is procedural, so no hand-placed point is
   * guaranteed to stay clear.
   */
  nudgeToOpen(d, x, z, radius = 1.2) {
    const prev = this.district;
    this.district = d;
    try {
      if (this.isClear(x, z, radius)) return { x, z };
      for (let r = 2; r <= 44; r += 2) {
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * TAU;
          const nx = x + Math.cos(a) * r;
          const nz = z + Math.sin(a) * r;
          if (this.isClear(nx, nz, radius)) return { x: nx, z: nz };
        }
      }
      return { x, z };
    } finally { this.district = prev; }
  }

  findOpenSpot(d, minR, maxR) {
    for (let i = 0; i < 90; i++) {
      const a = this.rng() * TAU;
      const r = minR + this.rng() * (maxR - minR);
      const x = clamp(Math.cos(a) * r, -d.half + 8, d.half - 8);
      const z = clamp(Math.sin(a) * r, -d.half + 8, d.half - 8);
      if (this.isClear(x, z, 1.4)) return { x, z };
    }
    return null;
  }

  setCarrying(kind) { this.carrying = kind; }
  setPose(on) { this.player.posing = on; }

  addReward(r) {
    if (r.cash) {
      this.stats.cash += r.cash;
      // The contract is the point: earning always adds more to what you owe.
      if (this.stats.contract) this.stats.debt += r.cash * 1.7 + 4000;
    }
    if (r.fame) this.stats.fame = Math.max(0, this.stats.fame + r.fame);
    if (r.cash) this.ui.toast('+' + Math.round(r.cash) + (this.stats.contract ? '   (balance +' + Math.round(r.cash * 1.7 + 4000) + ')' : ''));
  }

  damagePlayer(amount, source) {
    if (this.player.dead || this.transitioning) return;
    const died = this.player.hurt(amount);
    this.damageFlash = Math.min(1, this.damageFlash + amount * 0.03);
    if (died) this.killPlayer();
  }

  killPlayer() {
    this.player.dead = true;
    this.deathTimer = 2.6;
    audio.voice(VOICE.death, { gain: 1.0, throttle: 0 });
    audio.heartbeat();
    audio.duckMusic(0.2, 3);
    this.ui.flashBanner('WASTED', 'Nagesh City does not send flowers', 'bad');
    if (this.player.inVehicle) this.player.exit(this.district.grid);
    audio.stopEngine();
    if (this.missions.state === 'active') this.missions.fail('Nagesh went down');
  }

  async respawn() {
    await this.ui.fadeTo(1, 450);
    const sp = this.district.def.spawn || { x: 0, z: 0, rot: 0 };
    this.player.teleport(sp.x, sp.z, sp.rot);
    this.player.revive();
    this.damageFlash = 0;
    await this.ui.fadeTo(0, 550);
    audio.voice(0.9, { gain: 0.6 });
  }

  resolveChoice(id) {
    this.ending = id;
    const e = ENDINGS[id];
    audio.stopTrack();
    audio.glitch();
    this.input.releaseLock();
    this.ui.showEnding(e, () => {
      this.ui.hide(this.ui.el.ending);
      this.ui.hide(this.ui.el.hud);
      this.ui.show(this.ui.el.menu);
      this.running = false;
      this.missions.completed.add('vault_3');
      this.save();
    });
  }

  // ------------------------------------------------------------------ save ---

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        district: this.district ? this.district.def.id : 'slums',
        stats: this.stats,
        unlocked: [...this.unlocked],
        missions: this.missions.serialize(),
        combat: this.combat.serialize(),
        armour: this.player.armour,
        canWhistle: this.canWhistle,
        ending: this.ending,
      }));
    } catch (e) { /* private mode, no save. The game still plays. */ }
  }

  loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  hasSave() { return !!this.loadSave(); }

  clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }

  // ------------------------------------------------------------------ loop ---

  async start(fromSave) {
    let startId = 'slums';
    if (fromSave) {
      const s = this.loadSave();
      if (s) {
        this.stats = Object.assign(this.stats, s.stats || {});
        this.unlocked = new Set(s.unlocked || ['slums']);
        this.missions.restore(s.missions);
        this.combat.restore(s.combat);
        this.player.armour = s.armour || 0;
        this.canWhistle = !!s.canWhistle;
        startId = s.district || 'slums';
      }
    } else {
      this.clearSave();
      this.missions.completed.clear();
      this.combat.reset();
      this.player.armour = 0;
      this.player.health = 100;
      this.stats = { cash: 0, fame: 0, debt: 0, contract: false };
      this.unlocked = new Set(['slums']);
      this.canWhistle = false;
    }

    this.ui.hide(this.ui.el.menu);
    this.ui.show(this.ui.el.hud);
    // The minimap canvas can only be measured once the HUD is actually laid out.
    this.minimap.resize();
    await this.ui.fadeTo(1, 10);
    await this.enterDistrict(startId);
    await this.ui.fadeTo(0, 800);
    if (!fromSave) this.ui.showChapter(CHAPTERS[startId]);
    this.running = true;
    this.clock.getDelta();
    this.input.requestLock();
  }

  setPaused(p) {
    this.paused = p;
    this.ui.el.pause.classList.toggle('hidden', !p);
    if (p) { this.input.releaseLock(); audio.duckMusic(0.35, 999); }
    else { audio.duckMusic(1, 0.1); }
  }

  toggleMap() {
    this.mapOpen = !this.mapOpen;
    this.ui.el.fullmap.classList.toggle('hidden', !this.mapOpen);
    if (this.mapOpen) { this.minimap.resize(); this.input.releaseLock(); }
    else this.input.requestLock();
    audio.voiceRandom(0.8, 1.5, 0.45);
  }

  frame() {
    const raw = this.clock.getDelta();
    const dt = Math.min(raw, 0.05);
    this.frameSmooth = this.frameSmooth * 0.92 + raw * 1000 * 0.08;

    // Pause and map are polled out here: once paused, update() no longer runs,
    // so a key handled inside it could never unpause the game.
    if (this.running && !this.transitioning) {
      if (this.input.hit('Escape')) {
        if (this.shopOpen) this.closeShop();
        else if (this.mapOpen) this.toggleMap();
        else this.setPaused(!this.paused);
      }
      if (this.input.hit('KeyM') && !this.paused && !this.shopOpen) this.toggleMap();
    }

    if (this.running && !this.paused && !this.transitioning) this.update(dt);

    if (this.mapOpen && this.district) this.minimap.renderFull(this);
    this.renderer.render(this.scene, this.camera);
    this.input.endFrame();
  }

  update(dt) {
    const d = this.district;
    const input = this.input;
    audio.setListener(this.player.x, this.player.z);

    // Escape and M are handled in frame(); see the note there.
    if (this.mapOpen) { this.updateHud(dt); return; }

    // The counter holds the whole world still. It is the only shop in a city
    // where standing still is billable, and that is the joke.
    if (this.shopOpen) { this.updateHud(dt); return; }

    if (this.ui.dialogueActive) {
      if (input.hit('Space') || input.hit('Enter') || input.hit('KeyE')) this.ui.advanceDialogue();
      // The world keeps running behind a conversation: the car you drove up in
      // rolls to a stop and its engine drops to idle instead of droning on.
      if (this.player.inVehicle) {
        const v = this.player.vehicle;
        v.update(dt, null, d.grid);
        audio.updateEngine(v.rpm01, 0);
      }
      this.player.update(dt, NULL_INPUT, d.grid, this.camera, { grid: d.grid, bounds: d.half - 2.5 });
      this.missions.idleTick(dt);
      this.updatePeds(dt);
      this.updateBurning(dt);
      this.combat.update(dt, NULL_INPUT);
      this.updateHud(dt);
      return;
    }

    // An engine must never outlive the person driving it.
    if (audio.engineRunning && !this.player.inVehicle) audio.stopEngine();

    // --- death -------------------------------------------------------------
    if (this.player.dead) {
      this.deathTimer -= dt;
      this.player.update(dt, NULL_INPUT, d.grid, this.camera);
      this.updateBurning(dt);
      this.combat.update(dt, NULL_INPUT);
      if (this.deathTimer <= 0) { this.player.dead = false; this.respawn(); }
      this.updateHud(dt);
      return;
    }

    // --- vehicles ----------------------------------------------------------
    if (input.hit('KeyF')) this.toggleVehicle();
    if (input.hit('KeyH')) this.whistle();
    if (input.hit('KeyE')) {
      // The counter comes first: if you are standing at one, E is for buying.
      const shop = this.nearestShop();
      if (shop) this.openShop(shop);
      else this.missions.interact();
    }

    if (this.player.inVehicle) {
      const v = this.player.vehicle;
      const throttle = (input.anyDown('KeyW', 'ArrowUp') ? 1 : 0) - (input.anyDown('KeyS', 'ArrowDown') ? 1 : 0);
      const steer = (input.anyDown('KeyD', 'ArrowRight') ? 1 : 0) - (input.anyDown('KeyA', 'ArrowLeft') ? 1 : 0);
      // Flatten any lamp post in the way *before* collision runs, otherwise
      // the post you are about to demolish stops you dead first.
      this.knockLamps(v, dt);
      v.update(dt, { throttle, steer, handbrake: input.down('Space') }, d.grid);
      audio.updateEngine(v.rpm01, Math.abs(throttle));
      // Bouncing off a wall at speed hurts.
      if (v.body < 25 && Math.abs(v.speed) > 12) this.damagePlayer(dt * 4, 'wreck');
      this.runOverCheck(v, dt);
    }

    this.updateTraffic(dt);
    for (const v of this.vehicles) {
      if (v === this.player.vehicle || v.ai) continue;
      v.update(dt, null, d.grid);
    }
    this.updateBurning(dt);

    this.player.aiming = this.combat.aiming;
    this.player.recoil = this.combat.recoil;
    this.player.update(dt, input, d.grid, this.camera, {
      grid: d.grid, bounds: d.half - 2.5, aimBlend: this.combat.aimBlend,
    });
    this.combat.update(dt, input);

    // --- world -------------------------------------------------------------
    this.updatePeds(dt);
    if (d.lamps) d.lamps.update(dt);
    this.missions.update(dt);
    this.checkGate();

    // Debt is always working, even when you are standing still.
    if (this.stats.contract) {
      this.debtTick += dt;
      if (this.debtTick > 1) {
        this.debtTick = 0;
        this.stats.debt *= 1.0009;
        this.stats.debt += 42;
      }
    }
    if (!this.canWhistle && this.missions.completed.has('slum_2')) {
      this.canWhistle = true;
      this.ui.flashBanner('WHISTLE', 'Press H and your ride will find you', 'good');
    }

    // --- lighting follows the player so shadows stay tight -----------------
    this.sun.position.set(
      this.player.x + this.sunDir.x * 120,
      this.sunDir.y * 120,
      this.player.z + this.sunDir.z * 120
    );
    this.sun.target.position.set(this.player.x, 0, this.player.z);
    this.sun.target.updateMatrixWorld();

    this.damageFlash = Math.max(0, this.damageFlash - dt * 0.8);
    this.updateHud(dt);
  }

  toggleVehicle() {
    if (this.player.exitCooldown > 0) return;
    if (this.player.inVehicle) {
      const v = this.player.vehicle;
      if (Math.abs(v.speed) > 9) { this.ui.toast('Too fast to get out'); return; }
      this.player.exit(this.district.grid);
      audio.stopEngine();
      audio.voice(1.15, { gain: 0.6 });
    } else {
      const v = this.nearestVehicle(4.6);
      if (!v) return;
      this.player.enter(v);
      audio.startEngine(v.spec.engine);
      audio.voice(VOICE.enterCar, { gain: 0.7 });
      this.ui.toast(v.spec.name);
    }
  }

  checkGate() {
    const d = this.district;
    if (!d.landmarks.gate || this.transitioning) return;
    const g = d.landmarks.gate;
    if (!this.missions.districtDone(d.def.id)) return;
    if (this.player.z < g.z + 3 && Math.abs(this.player.x) < g.half) {
      const idx = ORDER.indexOf(d.def.id);
      const next = ORDER[idx + 1];
      if (next && next !== 'vault' && this.unlocked.has(next)) {
        this.travelTo(next);
      }
    }
  }

  // ------------------------------------------------------------------- hud ---

  updateHud(dt) {
    const d = this.district;
    const mr = this.missions;
    this.ui.setCinematic(this.ui.dialogueActive);

    this.waypoints = mr.waypoints.slice();
    const vw = mr.vehicleWaypoint;
    if (vw) this.waypoints.unshift(vw);
    // Once the district's work is done, the gate itself becomes the waypoint.
    if (mr.state === 'idle' && !mr.pendingStart && d.landmarks.gate &&
        d.def.id !== 'vault' && d.def.id !== 'heights') {
      const g = d.landmarks.gate;
      this.waypoints.push({ x: 0, z: g.z + 4, color: 0x6dff8a, label: 'North Gate', kind: 'gate' });
    }

    this.ui.setStats({
      cash: this.stats.cash,
      fame: this.stats.fame,
      health: this.player.health,
      armour: this.player.armour,
      district: d.def.name,
    });

    const w = this.combat.weapon;
    this.ui.setWeapon({
      name: w.name,
      melee: !!w.melee,
      mag: this.combat.inMag(this.combat.current),
      magSize: w.mag,
      reserve: this.combat.reserve(this.combat.current),
      reloading: this.combat.reloading > 0,
      count: this.combat.owned.size,
    });
    this.ui.setCrosshair(
      this.combat.aimBlend, this.combat.hitMarker,
      this.combat.weapon.spread * (this.combat.aiming ? 0.45 : 1) * 900 + 6
    );
    document.getElementById('debt-row').classList.toggle('hidden', !this.stats.contract);
    document.getElementById('debt').textContent = '₹' + Math.round(this.stats.debt).toLocaleString('en-IN');

    this.ui.setVehicle(this.player.inVehicle ? this.player.vehicle : null);
    this.ui.setTimer(mr.timerActive ? mr.timer : null);
    this.ui.setProgress(mr.progress);
    this.ui.setHint(mr.hint);

    const shop = this.nearestShop();
    this.ui.setInteract(shop ? shop.def.name : mr.interactPrompt);
    const nearCar = !this.player.inVehicle && !!this.nearestVehicle(4.6);
    document.getElementById('veh-prompt').classList.toggle('hidden', !nearCar);
    // Only advertise the whistle when there is nothing to just walk into.
    this.ui.setWhistle(this.canWhistle && !this.player.inVehicle && !nearCar);

    this.ui.setDamage(this.damageFlash + (this.player.health < 35 ? (35 - this.player.health) / 90 : 0));
    this.minimap.render(this);
    this.ui.drawNav(this.waypoints, this.camera, this.playerPos(), THREE);
  }
}

// Used while Nagesh is face down: the camera still drifts, he does not move.
const NULL_INPUT = {
  mouseDX: 0, mouseDY: 0, wheel: 0,
  lmb: false, rmb: false, lmbHit: false, rmbHit: false,
  down: () => false, hit: () => false, anyDown: () => false,
};

const PED_SHIRTS = {
  slums: [0x5e6b57, 0x8a4a32, 0x4a5a6a, 0x7a6a4a, 0x6a4a5a, 0x3f5a4a],
  midtown: [0x2f4f7a, 0x6a2f3f, 0x2f6a5a, 0x4a4a58, 0x7a5a2f, 0x5a2f6a],
  heights: [0xe8e2d2, 0xd8c8b0, 0xf0ead8, 0xc8b898, 0xe0d0e0, 0xd0e0e0],
};
