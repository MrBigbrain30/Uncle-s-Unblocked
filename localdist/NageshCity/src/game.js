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
import { CHAPTERS, CHATTER, ENDINGS, CHARACTERS } from './story.js';
import { makeCharacter, OUTFITS } from './actors.js';
import { clamp, damp, dampAngle, dist2, makeRNG, TAU, resolveCircle, Box } from './util.js';
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

    this.districts = new Map();
    this.district = null;
    this.vehicles = [];
    this.peds = [];
    this.waypoints = [];
    this.unlocked = new Set(['slums']);
    this.stats = { cash: 0, fame: 0, debt: 0, contract: false };
    this.canWhistle = false;
    this.paused = false;
    this.mapOpen = false;
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
      if (this.running && !this.paused && !this.ui.dialogueActive && !this.mapOpen) this.input.requestLock();
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

    const sp = opts.spawn || def.spawn || { x: 0, z: 0, rot: 0 };
    if (this.player.inVehicle) this.player.exit(d.grid);
    const safe = this.nudgeToOpen(d, sp.x, sp.z);
    this.player.teleport(safe.x, safe.z, sp.rot);
    this.player.revive();

    if (d.lamps) d.lamps.reset();
    this.spawnTraffic(d);
    this.spawnPeds(d);
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
    if (i >= 0) this.vehicles.splice(i, 1);
    this.scene.remove(v.group);
    v.dispose();
  }

  clearVehicles() {
    if (this.player.inVehicle) this.player.exit(null);
    for (const v of this.vehicles) { this.scene.remove(v.group); v.dispose(); }
    this.vehicles.length = 0;
  }

  nearestVehicle(maxDist) {
    let best = null, bestD = maxDist * maxDist;
    for (const v of this.vehicles) {
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
    if (!d.lamps) return;
    if (Math.abs(v.speed) < 5) return;
    const px = v.x + v.vx * dt;
    const pz = v.z + v.vz * dt;
    const boxes = d.grid.query(px, pz, v.radius + 2, this._lampHits);
    for (const b of boxes) {
      if (b.tag !== 'lamp' || b.disabled) continue;
      if (Math.abs(px - b.x) > b.hw + v.radius || Math.abs(pz - b.z) > b.hd + v.radius) continue;
      if (!d.lamps.knock(b.lamp, v.vx, v.vz)) continue;
      audio.clang();
      audio.voice(1.45, { gain: 0.5 });
      this.ui.toast('Light post down');
      v.body = Math.max(0, v.body - 5);
      // Ploughing through costs a little speed, but not the run.
      v.vx *= 0.9; v.vz *= 0.9; v.speed *= 0.9;
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
      this.missions.completed.add('vault_2');
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
        this.canWhistle = !!s.canWhistle;
        startId = s.district || 'slums';
      }
    } else {
      this.clearSave();
      this.missions.completed.clear();
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
        if (this.mapOpen) this.toggleMap();
        else this.setPaused(!this.paused);
      }
      if (this.input.hit('KeyM') && !this.paused) this.toggleMap();
    }

    if (this.running && !this.paused && !this.transitioning) this.update(dt);

    if (this.mapOpen && this.district) this.minimap.renderFull(this);
    this.renderer.render(this.scene, this.camera);
    this.input.endFrame();
  }

  update(dt) {
    const d = this.district;
    const input = this.input;

    // Escape and M are handled in frame(); see the note there.
    if (this.mapOpen) { this.updateHud(dt); return; }

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
      this.updateHud(dt);
      return;
    }

    // An engine must never outlive the person driving it.
    if (audio.engineRunning && !this.player.inVehicle) audio.stopEngine();

    // --- death -------------------------------------------------------------
    if (this.player.dead) {
      this.deathTimer -= dt;
      this.player.update(dt, NULL_INPUT, d.grid, this.camera);
      if (this.deathTimer <= 0) { this.player.dead = false; this.respawn(); }
      this.updateHud(dt);
      return;
    }

    // --- vehicles ----------------------------------------------------------
    if (input.hit('KeyF')) this.toggleVehicle();
    if (input.hit('KeyH')) this.whistle();
    if (input.hit('KeyE')) this.missions.interact();

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
    }

    for (const v of this.vehicles) {
      if (v === this.player.vehicle) continue;
      v.update(dt, null, d.grid);
    }

    this.player.update(dt, input, d.grid, this.camera, { grid: d.grid, bounds: d.half - 2.5 });

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
      district: d.def.name,
    });
    document.getElementById('debt-row').classList.toggle('hidden', !this.stats.contract);
    document.getElementById('debt').textContent = '₹' + Math.round(this.stats.debt).toLocaleString('en-IN');

    this.ui.setVehicle(this.player.inVehicle ? this.player.vehicle : null);
    this.ui.setTimer(mr.timerActive ? mr.timer : null);
    this.ui.setProgress(mr.progress);
    this.ui.setHint(mr.hint);

    this.ui.setInteract(mr.interactPrompt);
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
  down: () => false, hit: () => false, anyDown: () => false,
};

const PED_SHIRTS = {
  slums: [0x5e6b57, 0x8a4a32, 0x4a5a6a, 0x7a6a4a, 0x6a4a5a, 0x3f5a4a],
  midtown: [0x2f4f7a, 0x6a2f3f, 0x2f6a5a, 0x4a4a58, 0x7a5a2f, 0x5a2f6a],
  heights: [0xe8e2d2, 0xd8c8b0, 0xf0ead8, 0xc8b898, 0xe0d0e0, 0xd0e0e0],
};
