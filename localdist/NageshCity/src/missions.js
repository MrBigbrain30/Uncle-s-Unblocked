// Nagesh City - mission runner.
//
// Missions are declared as data in story.js. This file turns that data into
// waypoints, pickups, drones, timers and fail states.

import * as THREE from '../vendor/three.module.js';
import { MISSIONS, CHARACTERS } from './story.js';
import { makePickup, makeGateRing, makeWaypoint, makeDrone, makeCharacter, OUTFITS } from './actors.js';
import { WEAPONS } from './combat.js';
import { audio, VOICE } from './audio.js';
import { clamp, dist2, makeRNG, TAU, dampAngle } from './util.js';

export class MissionRunner {
  constructor(game) {
    this.game = game;
    this.state = 'idle';          // idle | intro | active | outro | done
    this.mission = null;
    this.objIndex = 0;
    this.obj = null;
    this.completed = new Set();
    this.dynamic = new THREE.Group();
    this.props = [];              // meshes to clean up when an objective ends
    this.drones = [];
    this.dronesKilled = 0;
    this.aiVehicles = [];         // real, destructible vehicles owned by a mission
    this.escortNpc = null;
    this.startMarker = null;
    this.giverNpc = null;
    this.waypoints = [];
    this.timer = 0;
    this.timerActive = false;
    this.hint = '';
    this.progress = null;         // {label, value} for a bar in the HUD
    this.rng = makeRNG(20260906);
    this.failCooldown = 0;
    this.startGrace = 0;
  }

  attach(scene) { scene.add(this.dynamic); }

  // ------------------------------------------------------------- queries ---

  /** Missions for a district in script order. */
  forDistrict(id) { return MISSIONS.filter((m) => m.district === id); }

  nextFor(id) { return this.forDistrict(id).find((m) => !this.completed.has(m.id)) || null; }

  districtDone(id) { return this.forDistrict(id).every((m) => this.completed.has(m.id)); }

  get remainingInDistrict() {
    const list = this.forDistrict(this.game.district.def.id);
    return list.filter((m) => !this.completed.has(m.id)).length;
  }

  // ------------------------------------------------- start marker handling ---

  /** Place the "go here to begin" marker for the next mission of this district. */
  refreshStartMarker() {
    this.clearStartMarker();
    this.clearGiver();
    if (this.state !== 'idle') return;
    const m = this.nextFor(this.game.district.def.id);
    if (!m) { this.setWaypoints([]); return; }

    const p = this.resolvePos(m.start);
    this.pendingStart = { mission: m, x: p.x, z: p.z };

    const marker = makeWaypoint(0xffd23f);
    marker.position.set(p.x, 0, p.z);
    this.dynamic.add(marker);
    this.startMarker = marker;

    // The giver stands in the marker so the city has a face in it.
    const chr = CHARACTERS[m.giver];
    if (chr) {
      const outfit = m.district === 'heights' ? OUTFITS.heights
        : m.district === 'midtown' ? OUTFITS.midtown
          : m.district === 'vault' ? OUTFITS.vault : OUTFITS.slum;
      const npc = makeCharacter({
        outfit: Object.assign({}, outfit, { shirt: chr.portrait.cloth, hair: chr.portrait.hair, skin: chr.portrait.skin }),
        hairStyle: chr.portrait.hairStyle === 'long' ? 'long' : chr.portrait.hairStyle === 'bald' ? 'bald' : 'short',
      });
      npc.group.position.set(p.x, 0, p.z);
      npc.group.rotation.y = Math.random() * TAU;
      this.dynamic.add(npc.group);
      this.giverNpc = { char: npc, x: p.x, z: p.z, heading: npc.group.rotation.y };
    }

    this.setWaypoints([{ x: p.x, z: p.z, color: 0xffd23f, label: m.title, kind: 'mission' }]);
    this.game.ui.setObjective(null, 'Go to ' + m.title, this.remainingInDistrict);
    // Some missions hand off at the same address as the last one. Give the
    // player a beat to read MISSION COMPLETE before the next one starts.
    this.startGrace = 2.2;
  }

  /** Removes the "begin here" ring but leaves the person standing in it. */
  clearStartMarker() {
    if (this.startMarker) {
      this.dynamic.remove(this.startMarker);
      disposeTree(this.startMarker);
      this.startMarker = null;
    }
    this.pendingStart = null;
  }

  /**
   * The mission giver is a person, not a trigger volume. They stay put for the
   * whole mission - through the briefing, the objectives and the debrief - and
   * only leave when the next mission's giver takes over.
   */
  clearGiver() {
    if (!this.giverNpc) return;
    this.dynamic.remove(this.giverNpc.char.group);
    disposeTree(this.giverNpc.char.group);
    this.giverNpc = null;
  }

  /** Keep the giver alive and looking at whoever is talking to them. */
  updateGiver(dt) {
    const g = this.giverNpc;
    if (!g) return;
    const p = this.game.playerPos();
    const d = Math.hypot(p.x - g.x, p.z - g.z);
    if (d < 12 && d > 0.4) {
      g.heading = dampAngle(g.heading, Math.atan2(p.x - g.x, p.z - g.z), 4, dt);
    }
    g.char.group.rotation.y = g.heading;
    g.char.update(dt, 0, 'walk');
  }

  // ---------------------------------------------------------------- flow ---

  begin(mission) {
    this.clearStartMarker();
    this.mission = mission;
    this.state = 'intro';
    audio.voice(VOICE.missionStart);
    // Anything the briefing puts in your hands arrives before the briefing
    // ends, so the line about the .32 lands while you are holding it.
    if (mission.grant) {
      const gr = mission.grant;
      if (gr.weapon) {
        const isNew = this.game.combat.give(gr.weapon, false);
        if (gr.ammo) this.game.combat.addAmmo(gr.weapon, gr.ammo);
        if (isNew) this.game.ui.flashBanner('ARMED', WEAPONS[gr.weapon].name, 'good');
      }
      if (gr.armour) this.game.player.addArmour(gr.armour);
    }
    this.game.ui.playDialogue(mission.intro, () => this.startObjectives());
  }

  startObjectives() {
    // The card lands as the briefing ends and you actually set off, rather
    // than competing with the first line of dialogue.
    this.game.ui.showTitleCard(this.mission.title, this.mission.brief);
    this.state = 'active';
    this.objIndex = -1;
    this.nextObjective();
  }

  nextObjective() {
    this.endObjective();
    this.objIndex++;
    const list = this.mission.objectives;
    if (this.objIndex >= list.length) return this.finishMission();
    this.obj = JSON.parse(JSON.stringify(list[this.objIndex]));
    // Functions and resolved data do not survive the clone, so re-derive.
    this.obj.__src = list[this.objIndex];
    this.beginObjective();
    if (this.objIndex > 0) audio.voice(VOICE.checkpoint, { gain: 0.6 });
  }

  finishMission() {
    const m = this.mission;
    this.completed.add(m.id);
    this.clearMissionAI();
    this.state = 'outro';
    audio.voice(VOICE.missionComplete);
    this.game.ui.flashBanner('MISSION COMPLETE', m.title, 'good');
    if (m.reward) this.game.addReward(m.reward);

    const after = () => {
      this.state = 'idle';
      this.mission = null;
      if (m.unlocks) this.game.unlockDistrict(m.unlocks, m);
      else this.refreshStartMarker();
      this.game.save();
    };
    if (m.outro && m.outro.length) this.game.ui.playDialogue(m.outro, after);
    else after();
  }

  fail(reason) {
    if (this.state !== 'active' || this.failCooldown > 0) return;
    this.failCooldown = 1.2;
    audio.voice(VOICE.fail);
    audio.alarm();
    this.game.ui.flashBanner('MISSION FAILED', reason, 'bad');
    this.endObjective();
    this.clearMissionAI();
    const m = this.mission;
    this.state = 'idle';
    this.mission = null;
    this.game.ui.setObjective(null, '', 0);
    // Put the player back on their feet near the giver so a retry is instant.
    setTimeout(() => { if (this.state === 'idle') this.refreshStartMarker(); }, 600);
  }

  // ---------------------------------------------------- objective lifecycle ---

  beginObjective() {
    const o = this.obj;
    const src = o.__src;
    this.timerActive = false;
    this.progress = null;
    this.hint = '';
    o.state = {};

    if (src.spawn) this.spawnMissionVehicle(src.spawn);
    if (src.escort) this.spawnEscort(src.escort);

    switch (o.type) {
      case 'goto':
      case 'deliver':
      case 'descend':
      case 'read':
      case 'sign': {
        const p = src.at ? this.resolvePos(src.at) : this.game.playerPos();
        o.state.target = p;
        this.setWaypoints([{ x: p.x, z: p.z, color: 0x4ad8ff, label: o.label, kind: 'objective' }]);
        this.spawnRingMarker(p.x, p.z, 0x4ad8ff, o.radius || 5);
        break;
      }
      case 'enterVehicle': {
        const v = this.missionVehicle;
        if (v) this.setWaypoints([{ x: v.x, z: v.z, color: 0x6dff8a, label: o.label, kind: 'vehicle' }]);
        break;
      }
      case 'collect': {
        const pts = this.resolveScatter(src.at, src.nearLm);
        o.state.points = pts;
        o.state.got = 0;
        pts.forEach((p) => {
          const m = makePickup(src.kind || 'scrap', src.glow || 0xffc94a);
          m.position.set(p.x, 0, p.z);
          this.dynamic.add(m);
          this.props.push(m);
          p.mesh = m;
        });
        this.syncWaypointsFrom(pts, src.glow || 0xffc94a, o.label);
        break;
      }
      case 'multiDeliver': {
        const pts = this.resolveScatter(src.at, src.nearLm);
        o.state.points = pts;
        o.state.got = 0;
        pts.forEach((p) => {
          const m = makeWaypoint(src.glow || 0x4fc3e8);
          m.position.set(p.x, 0, p.z);
          this.dynamic.add(m);
          this.props.push(m);
          p.mesh = m;
        });
        this.syncWaypointsFrom(pts, src.glow || 0x4fc3e8, o.label);
        if (src.time) { this.timer = src.time; this.timerActive = true; }
        break;
      }
      case 'rings': {
        const pts = this.resolveScatter(src.at, src.nearLm);
        o.state.points = pts;
        o.state.index = 0;
        pts.forEach((p, i) => {
          const m = makeGateRing(i === 0 ? 0x4ad8ff : 0x2a5a70);
          m.position.set(p.x, 0, p.z);
          this.dynamic.add(m);
          this.props.push(m);
          p.mesh = m;
        });
        this.timer = src.time || 120;
        this.timerActive = true;
        this.setWaypoints([{ x: pts[0].x, z: pts[0].z, color: 0x4ad8ff, label: 'Checkpoint 1', kind: 'objective' }]);
        break;
      }
      case 'pose': {
        const pts = this.resolveScatter(src.at, src.nearLm);
        o.state.points = pts;
        o.state.got = 0;
        o.state.hold = 0;
        pts.forEach((p) => {
          const m = makeWaypoint(0xff3d8a);
          m.position.set(p.x, 0, p.z);
          this.dynamic.add(m);
          this.props.push(m);
          p.mesh = m;
        });
        this.syncWaypointsFrom(pts, 0xff3d8a, o.label);
        break;
      }
      case 'survive': {
        this.timer = src.time || 60;
        this.timerActive = true;
        const n = src.drones || 4;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU;
          this.spawnDrone(
            this.game.playerPos().x + Math.cos(a) * 40,
            this.game.playerPos().z + Math.sin(a) * 40,
            src.aggressive ? 1.35 : 1.0
          );
        }
        this.setWaypoints([]);
        break;
      }
      case 'tail': {
        this.timer = src.time || 90;
        this.timerActive = true;
        o.state.tooClose = 0;
        o.state.tooFar = 0;
        const start = this.resolvePos(this.mission.start);
        // A real vehicle, not a puppet: once you stop tailing it you are very
        // likely to want to shoot it, and you cannot shoot a puppet.
        this.targetCar = this.spawnMissionAI('van', start.x, start.z, 0x36506e, 'collections');
        break;
      }

      // --- combat ---------------------------------------------------------
      case 'shoot': {
        const p = this.resolvePos(src.at);
        const n = src.count || 6;
        this.game.combat.clearTargets();
        for (let i = 0; i < n; i++) {
          const t = (i / Math.max(1, n - 1) - 0.5) * Math.min(18, n * 3);
          this.game.combat.spawnTarget(p.x + t, p.z);
        }
        o.state.total = n;
        this.setWaypoints([{ x: p.x, z: p.z, color: 0xff3d8a, label: o.label, kind: 'objective' }]);
        break;
      }
      case 'hunt': {
        o.state.origin = src.at ? this.resolvePos(src.at) : null;
        o.state.total = src.total || 5;
        o.state.tripped = false;
        if (!o.state.origin) this.tripFight(o, src);
        else {
          this.setWaypoints([{ x: o.state.origin.x, z: o.state.origin.z, color: 0xff5a4a, label: o.label, kind: 'target' }]);
          this.spawnRingMarker(o.state.origin.x, o.state.origin.z, 0xff5a4a, src.radius || 22);
        }
        break;
      }
      case 'defend': {
        const p = this.resolvePos(src.at);
        o.state.target = p;
        this.timer = src.time || 60;
        this.timerActive = true;
        this.spawnRingMarker(p.x, p.z, 0xff6a4a, src.radius || 22);
        this.setWaypoints([{ x: p.x, z: p.z, color: 0xff6a4a, label: o.label, kind: 'objective' }]);
        this.game.combat.startWave({
          endless: true, live: src.live || 3, tiers: src.tiers || ['goon'],
          radius: 38, minRadius: 20, interval: src.interval || 2.2,
        });
        break;
      }
      case 'cull': {
        const n = src.drones || 5;
        o.state.total = n;
        o.state.base = this.dronesKilled;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU;
          this.spawnDrone(
            this.game.playerPos().x + Math.cos(a) * 38,
            this.game.playerPos().z + Math.sin(a) * 38,
            src.aggressive ? 1.2 : 0.92
          );
        }
        this.setWaypoints([]);
        break;
      }
      case 'wreck': {
        o.state.total = src.count || 1;
        break;
      }
      case 'boss': {
        o.state.origin = src.at ? this.resolvePos(src.at) : this.game.playerPos();
        o.state.tripped = false;
        o.state.boss = null;
        this.setWaypoints([{ x: o.state.origin.x, z: o.state.origin.z, color: 0xff3b30, label: src.name || o.label, kind: 'target' }]);
        this.spawnRingMarker(o.state.origin.x, o.state.origin.z, 0xff3b30, 18);
        break;
      }

      case 'choice': {
        this.game.ui.showChoice(src.options, (id) => this.game.resolveChoice(id));
        break;
      }
      default: break;
    }

    this.game.ui.setObjective(this.mission ? this.mission.title : null, o.label, this.remainingInDistrict);
  }

  endObjective() {
    for (const p of this.props) { this.dynamic.remove(p); disposeTree(p); }
    this.props.length = 0;
    for (const d of this.drones) { this.dynamic.remove(d.group); disposeTree(d.group); }
    this.drones.length = 0;
    // Scripted traffic outlives the objective that spawned it - you tail the
    // van in one objective and set fire to it two objectives later - so it is
    // only parked here, and removed when the mission itself ends.
    for (const v of this.aiVehicles) { v.ai = null; this.game.dismissDriver(v); }
    this.targetCar = null;
    this.timerActive = false;
    this.progress = null;
    this.setWaypoints([]);
    // Whoever was still shooting stops being anyone's problem the moment the
    // objective they belonged to is over.
    this.game.combat.stopWave();
    this.game.combat.clearEnemies();
    this.game.combat.clearTargets();
    if (this.escortNpc) {
      this.dynamic.remove(this.escortNpc.char.group);
      disposeTree(this.escortNpc.char.group);
      this.escortNpc = null;
    }
    this.obj = null;
  }

  abandonAll() {
    this.endObjective();
    this.clearMissionAI();
    this.clearStartMarker();
    this.clearGiver();
    this.state = 'idle';
    this.mission = null;
    if (this.missionVehicle) { this.game.removeVehicle(this.missionVehicle); this.missionVehicle = null; }
  }

  // ---------------------------------------------------------------- update ---

  update(dt) {
    if (this.failCooldown > 0) this.failCooldown -= dt;
    if (this.startGrace > 0) this.startGrace -= dt;
    this.animateProps(dt);
    this.updateGiver(dt);

    if (this.state === 'idle') {
      const s = this.pendingStart;
      if (s && this.startGrace <= 0 && this.game.playerNear(s.x, s.z, 4.2)) {
        this.begin(s.mission);
      }
      return;
    }
    if (this.state !== 'active' || !this.obj) return;

    if (this.timerActive) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timerActive = false;
        // These three end when the clock does; everything else fails on it.
        if (this.obj.type === 'survive' || this.obj.type === 'tail' || this.obj.type === 'defend') {
          this.game.combat.stopWave();
          return this.nextObjective();
        }
        return this.fail('Out of time');
      }
    }

    const o = this.obj;
    const src = o.__src;
    const p = this.game.playerPos();

    switch (o.type) {
      case 'goto': case 'deliver': {
        const t = o.state.target;
        if (src.onFoot && this.game.player.inVehicle) { this.hint = 'On foot from here'; break; }
        if (src.requireVehicle && !this.game.player.inVehicle) { this.hint = 'Get back in a vehicle'; break; }
        this.hint = '';
        if (dist2(p.x, p.z, t.x, t.z) < Math.pow(src.radius || 5, 2)) this.nextObjective();
        break;
      }
      case 'enterVehicle': {
        if (this.game.player.inVehicle) this.nextObjective();
        break;
      }
      case 'collect': {
        for (const pt of o.state.points) {
          if (pt.done) continue;
          if (dist2(p.x, p.z, pt.x, pt.z) < 9) {
            pt.done = true;
            o.state.got++;
            this.dynamic.remove(pt.mesh);
            disposeTree(pt.mesh);
            audio.voiceLadder(o.state.got, 0.55);
            audio.pickupChime(o.state.got * 2);
            this.game.ui.toast(o.state.got + ' / ' + o.state.points.length);
          }
        }
        this.progress = { label: o.label, value: o.state.got / o.state.points.length };
        this.syncWaypointsFrom(o.state.points, src.glow || 0xffc94a, o.label);
        if (o.state.got >= o.state.points.length) {
          this.game.setCarrying(src.kind || 'scrap');
          this.nextObjective();
        }
        break;
      }
      case 'multiDeliver': {
        for (const pt of o.state.points) {
          if (pt.done) continue;
          if (dist2(p.x, p.z, pt.x, pt.z) < 20) {
            pt.done = true;
            o.state.got++;
            this.dynamic.remove(pt.mesh);
            disposeTree(pt.mesh);
            audio.voiceLadder(o.state.got, 0.55);
            audio.pickupChime(o.state.got * 2);
            this.game.ui.toast('Delivered ' + o.state.got + ' / ' + o.state.points.length);
          }
        }
        this.progress = { label: o.label, value: o.state.got / o.state.points.length };
        this.syncWaypointsFrom(o.state.points, src.glow || 0x4fc3e8, o.label);
        if (o.state.got >= o.state.points.length) this.nextObjective();
        break;
      }
      case 'rings': {
        const pts = o.state.points;
        const i = o.state.index;
        const pt = pts[i];
        if (!this.game.player.inVehicle) { this.hint = 'Get back in the car'; }
        else this.hint = '';
        if (pt && this.game.player.inVehicle && dist2(p.x, p.z, pt.x, pt.z) < 26) {
          pt.done = true;
          this.dynamic.remove(pt.mesh);
          disposeTree(pt.mesh);
          o.state.index++;
          this.timer += 9; // each gate buys a little more airtime
          audio.voiceLadder(o.state.index, 0.6);
          audio.pickupChime(o.state.index * 2);
          const nxt = pts[o.state.index];
          if (nxt) {
            nxt.mesh.userData.torus.material.color.setHex(0x4ad8ff);
            this.setWaypoints([{ x: nxt.x, z: nxt.z, color: 0x4ad8ff, label: 'Checkpoint ' + (o.state.index + 1), kind: 'objective' }]);
          }
        }
        this.progress = { label: 'Checkpoints', value: o.state.index / pts.length };
        if (o.state.index >= pts.length) this.nextObjective();
        break;
      }
      case 'pose': {
        const pts = o.state.points;
        let inSpot = null;
        for (const pt of pts) {
          if (pt.done) continue;
          if (dist2(p.x, p.z, pt.x, pt.z) < 9 && !this.game.player.inVehicle) { inSpot = pt; break; }
        }
        if (inSpot) {
          this.game.setPose(true);
          o.state.hold += dt;
          this.hint = 'Hold the pose';
          if (o.state.hold >= (src.hold || 3)) {
            inSpot.done = true;
            o.state.got++;
            o.state.hold = 0;
            this.dynamic.remove(inSpot.mesh);
            disposeTree(inSpot.mesh);
            audio.camera();
            audio.voiceLadder(o.state.got, 0.6);
            this.game.ui.flashCamera();
          }
        } else {
          this.game.setPose(false);
          o.state.hold = Math.max(0, o.state.hold - dt * 2);
          this.hint = 'Stand on a plinth';
        }
        this.progress = {
          label: inSpot ? 'Holding' : o.label,
          value: inSpot ? o.state.hold / (src.hold || 3) : o.state.got / pts.length,
        };
        this.syncWaypointsFrom(pts, 0xff3d8a, o.label);
        if (o.state.got >= pts.length) { this.game.setPose(false); this.nextObjective(); }
        break;
      }
      case 'survive': {
        this.progress = { label: 'Time remaining', value: this.timer / (src.time || 60) };
        this.hint = src.requireVehicle && !this.game.player.inVehicle ? 'Get to a car!' : '';
        break;
      }
      case 'tail': {
        const c = this.targetCar;
        if (!c) break;
        const d = Math.sqrt(dist2(p.x, p.z, c.x, c.z));
        this.setWaypoints([{ x: c.x, z: c.z, color: 0xff9a2f, label: 'Collections van', kind: 'target' }]);
        const min = src.min || 12, max = src.max || 45;
        if (d < min) {
          o.state.tooClose += dt; o.state.tooFar = 0;
          this.hint = 'Too close - back off';
          if (o.state.tooClose > 3) return this.fail('You were spotted');
        } else if (d > max) {
          o.state.tooFar += dt; o.state.tooClose = 0;
          this.hint = 'Falling behind';
          if (o.state.tooFar > 5) return this.fail('You lost the van');
        } else {
          o.state.tooClose = Math.max(0, o.state.tooClose - dt);
          o.state.tooFar = Math.max(0, o.state.tooFar - dt);
          this.hint = '';
        }
        this.progress = { label: Math.round(d) + ' m  (' + min + '-' + max + ')', value: this.timer / (src.time || 90) };
        break;
      }

      // --- combat ---------------------------------------------------------
      case 'shoot': {
        const down = this.game.combat.targetsDown;
        this.progress = { label: 'Boards down', value: down / o.state.total };
        this.hint = down === 0 ? 'Right mouse to aim, left mouse to fire' : '';
        if (down >= o.state.total) this.nextObjective();
        break;
      }
      case 'hunt': {
        if (!o.state.tripped) {
          const t = o.state.origin;
          this.hint = 'Get to it';
          if (dist2(p.x, p.z, t.x, t.z) < Math.pow(src.radius || 22, 2)) this.tripFight(o, src);
          break;
        }
        this.hint = '';
        this.progress = {
          label: this.game.combat.liveEnemies + ' still standing',
          value: clamp(this.killedInObjective(o) / o.state.total, 0, 1),
        };
        this.markEnemies();
        if (o.state.clear) this.nextObjective();
        break;
      }
      case 'defend': {
        const t = o.state.target;
        const r = src.radius || 22;
        const away = dist2(p.x, p.z, t.x, t.z) > r * r;
        this.hint = away ? 'Get back inside the yard' : '';
        // Wander off and the clock stops: the objective is holding the ground,
        // not outrunning it.
        this.timerActive = !away;
        this.progress = { label: away ? 'Out of position' : 'Holding', value: 1 - this.timer / (src.time || 60) };
        this.markEnemies(t);
        break;
      }
      case 'cull': {
        const got = this.dronesKilled - o.state.base;
        this.progress = { label: 'Drones down', value: got / o.state.total };
        this.setWaypoints(this.drones.filter((d) => !d.dead).slice(0, 3)
          .map((d) => ({ x: d.x, z: d.z, color: 0xff5a4a, label: 'Census drone', kind: 'target' })));
        if (got >= o.state.total) this.nextObjective();
        break;
      }
      case 'wreck': {
        const list = this.game.vehicles.filter((v) => v.missionTag === src.ofTag);
        const gone = list.filter((v) => v.wrecked || v.burning).length;
        this.progress = { label: 'Written off', value: clamp(gone / o.state.total, 0, 1) };
        this.setWaypoints(list.filter((v) => !v.wrecked && !v.burning)
          .map((v) => ({ x: v.x, z: v.z, color: 0xff5a4a, label: 'Collections van', kind: 'target' })));
        this.hint = gone >= o.state.total ? '' : 'Shoot it until it stops being an asset';
        if (gone >= o.state.total) this.nextObjective();
        break;
      }
      case 'boss': {
        if (!o.state.tripped) {
          const t = o.state.origin;
          this.hint = 'He is waiting';
          if (dist2(p.x, p.z, t.x, t.z) < 26 * 26) this.tripBoss(o, src);
          break;
        }
        const b = o.state.boss;
        if (b && !b.dead) {
          this.progress = { label: (src.name || 'Boss') + '  -  ' + this.game.combat.liveEnemies + ' on the floor', value: b.health / b.maxHealth };
          this.setWaypoints([{ x: b.x, z: b.z, color: 0xff3b30, label: src.name || 'Target', kind: 'target' }]);
        } else {
          this.game.combat.stopWave();
          this.nextObjective();
        }
        break;
      }
      default: break;
    }

    this.updateDrones(dt);
    this.updateEscort(dt);
  }

  // ------------------------------------------------------------ combat glue ---

  /** Kick off a `hunt` fight, either on arrival or straight away. */
  tripFight(o, src) {
    o.state.tripped = true;
    o.state.clear = false;
    o.state.killBase = this.game.combat.kills;
    this.setWaypoints([]);
    for (const pr of this.props) { this.dynamic.remove(pr); disposeTree(pr); }
    this.props.length = 0;
    audio.alarm();
    this.game.ui.flashBanner('CONTACT', src.label || 'They saw you', 'bad');
    this.game.combat.startWave({
      total: src.total || 5, live: src.live || 3, tiers: src.tiers || ['goon'],
      radius: src.spawnRadius || 34, minRadius: src.minRadius || 15,
      interval: src.interval || 1.5,
      onClear: () => { o.state.clear = true; },
    });
  }

  tripBoss(o, src) {
    o.state.tripped = true;
    this.setWaypoints([]);
    for (const pr of this.props) { this.dynamic.remove(pr); disposeTree(pr); }
    this.props.length = 0;
    audio.alarm();
    const t = o.state.origin;
    const a = Math.atan2(this.game.player.x - t.x, this.game.player.z - t.z);
    o.state.boss = this.game.combat.spawnEnemy({
      x: t.x + Math.sin(a) * 12, z: t.z + Math.cos(a) * 12,
      tier: src.boss || 'hishaan', name: src.name, alert: true,
    });
    this.game.ui.flashBanner(src.name || 'TARGET', 'Retrieval, this region', 'bad');
    this.game.combat.startWave({
      total: src.adds || 6, live: src.live || 3, tiers: src.tiers || ['enforcer'],
      radius: 34, minRadius: 16, interval: 2.6, endless: false,
    });
  }

  killedInObjective(o) {
    return Math.max(0, this.game.combat.kills - (o.state.killBase || 0));
  }

  /** Point the navigation at whoever is currently shooting at you. */
  markEnemies(fallback) {
    const live = this.game.combat.enemies.filter((e) => !e.dead);
    if (!live.length) {
      this.setWaypoints(fallback ? [{ x: fallback.x, z: fallback.z, color: 0xff6a4a, label: 'Hold here', kind: 'objective' }] : []);
      return;
    }
    const p = this.game.playerPos();
    live.sort((a, b) => dist2(a.x, a.z, p.x, p.z) - dist2(b.x, b.z, p.x, p.z));
    this.setWaypoints(live.slice(0, 3).map((e) => ({
      x: e.x, z: e.z, color: 0xff5a4a, label: e.name || 'Retrieval', kind: 'target',
    })));
  }

  // ---------------------------------------------------------------- props ---

  animateProps(dt) {
    const t = performance.now() * 0.001;
    for (const p of this.props) {
      if (p.userData.spin) {
        p.userData.spin.rotation.y += dt * 1.6;
        p.userData.spin.position.y = 0.45 + Math.sin(t * 2 + p.position.x) * 0.14;
      }
      if (p.userData.halo) p.userData.halo.material.opacity = 0.25 + Math.sin(t * 3) * 0.12;
      if (p.userData.ring) {
        p.userData.ring.material.opacity = 0.55 + Math.sin(t * 3.2) * 0.25;
        p.userData.ring.rotation.z += dt * 0.6;
      }
      if (p.userData.torus) p.userData.torus.rotation.z += dt * 0.8;
    }
    if (this.startMarker) {
      this.startMarker.userData.ring.material.opacity = 0.55 + Math.sin(t * 3.2) * 0.25;
      this.startMarker.userData.ring.rotation.z += dt * 0.6;
    }
  }

  /** Animation still has to run while a cutscene is up. */
  idleTick(dt) {
    this.animateProps(dt);
    this.updateGiver(dt);
    this.updateEscort(dt);
  }

  spawnRingMarker(x, z, color, radius) {
    const m = makeWaypoint(color);
    m.position.set(x, 0, z);
    m.scale.setScalar(clamp(radius / 2.4, 0.7, 3));
    this.dynamic.add(m);
    this.props.push(m);
  }

  // --------------------------------------------------------------- drones ---

  spawnDrone(x, z, speedScale = 1) {
    const d = makeDrone(0x2b2f38);
    d.group.position.set(x, 9 + Math.random() * 4, z);
    this.dynamic.add(d.group);
    this.drones.push({
      isDrone: true, group: d.group, rotors: d.rotors, lens: d.lens,
      x, z, y: 9, vx: 0, vz: 0, speed: (7.5 + Math.random() * 2.5) * speedScale,
      phase: Math.random() * TAU, scan: 0, whir: Math.random(),
      hp: 42, dead: false,
    });
    return d;
  }

  /** Drones are cheap and they are not armoured. Gurjaap was right. */
  damageDrone(d, dmg) {
    if (d.dead) return;
    d.hp -= dmg;
    audio.ricochet(0.8);
    if (d.hp > 0) return;
    d.dead = true;
    this.dronesKilled++;
    this.game.combat.puff(d.x, d.y, d.z, 0.55);
    audio.enemyDown();
    this.game.ui.killFeed('Census drone');
  }

  updateDrones(dt) {
    if (!this.drones.length) return;
    const p = this.game.playerPos();
    const inCar = this.game.player.inVehicle;
    // Nine drones all converging used to deal nine lots of damage at once,
    // which is not a swarm, it is a wall. The total is capped instead.
    let scanDps = 0;
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const d = this.drones[i];
      if (d.dead) {
        // Comes down under its own weight, then stops being anything.
        d.y -= (d.fall = (d.fall || 0) + dt * 26) * dt;
        d.group.position.set(d.x, Math.max(0.2, d.y), d.z);
        d.group.rotation.z += dt * 5;
        d.group.rotation.x += dt * 3;
        if (d.y <= 0.3) {
          this.dynamic.remove(d.group);
          disposeTree(d.group);
          this.drones.splice(i, 1);
        }
        continue;
      }
      const dx = p.x - d.x, dz = p.z - d.z;
      const dist = Math.hypot(dx, dz) || 1;
      // Steer toward the player with a lazy orbit so they do not stack up.
      d.phase += dt * 0.8;
      const tx = p.x - (dx / dist) * 5 + Math.cos(d.phase) * 4;
      const tz = p.z - (dz / dist) * 5 + Math.sin(d.phase) * 4;
      const ax = (tx - d.x), az = (tz - d.z);
      const al = Math.hypot(ax, az) || 1;
      d.vx += (ax / al) * d.speed * dt * 2.2;
      d.vz += (az / al) * d.speed * dt * 2.2;
      const sp = Math.hypot(d.vx, d.vz);
      const maxSp = d.speed * (inCar ? 1.45 : 1);
      if (sp > maxSp) { d.vx = d.vx / sp * maxSp; d.vz = d.vz / sp * maxSp; }
      d.x += d.vx * dt; d.z += d.vz * dt;
      d.y = 7.5 + Math.sin(d.phase * 1.7) * 1.6;
      d.group.position.set(d.x, d.y, d.z);
      d.group.rotation.y = Math.atan2(dx, dz);
      d.group.rotation.z = -d.vx * 0.02;
      for (const r of d.rotors) r.rotation.y += dt * 40;

      // The lens goes hot when it has you.
      const scanning = dist < 9;
      d.scan = clamp(d.scan + (scanning ? dt * 1.4 : -dt * 1.8), 0, 1);
      d.lens.material.color.setRGB(1, 0.23 + d.scan * 0.6, 0.19);
      if (scanning) {
        scanDps += (this.obj && this.obj.__src.aggressive ? 9 : 6);
      }
      d.whir -= dt;
      if (d.whir <= 0 && dist < 40) { d.whir = 0.35 + Math.random() * 0.4; audio.droneWhir(); }
    }
    if (scanDps > 0) this.game.damagePlayer(Math.min(scanDps, 15) * dt, 'drone');
  }

  // ------------------------------------------------------- mission traffic ---

  /**
   * A scripted vehicle that drives the road network like any other traffic,
   * except it is tagged so an objective can ask about it later. It goes into
   * the game's vehicle list, which means it collides, burns and can be stolen.
   */
  spawnMissionAI(type, x, z, color, tag) {
    const v = this.game.spawnTrafficNear(type, x, z, color);
    if (!v) return null;
    v.missionTag = tag;
    this.aiVehicles.push(v);
    return v;
  }

  clearMissionAI() {
    for (const v of this.aiVehicles) {
      // Leave a burnt-out one where it died; it is scenery now, and it is
      // usually the most interesting thing in the street.
      if (v.wrecked) { v.missionTag = null; continue; }
      this.game.removeVehicle(v);
    }
    this.aiVehicles.length = 0;
  }

  // -------------------------------------------------------------- escorts ---

  spawnEscort(who) {
    const chr = CHARACTERS[who];
    if (!chr) return;
    const outfit = Object.assign({}, OUTFITS.heights, {
      shirt: chr.portrait.cloth, hair: chr.portrait.hair, skin: chr.portrait.skin,
    });
    const char = makeCharacter({ outfit, hairStyle: chr.portrait.hairStyle === 'long' ? 'long' : 'short' });
    const p = this.game.playerPos();
    char.group.position.set(p.x + 2, 0, p.z + 2);
    this.dynamic.add(char.group);
    this.escortNpc = { char, who, x: p.x + 2, z: p.z + 2, heading: 0 };
  }

  updateEscort(dt) {
    const e = this.escortNpc;
    if (!e) return;
    const p = this.game.playerPos();
    if (this.game.player.inVehicle) {
      // Ride along, mirrored to the other side of the driver's seat.
      const v = this.game.player.vehicle;
      const seat = v.seatPoint();
      const spec = v.spec.seat || { x: 0, y: v.spec.seatY, z: 0 };
      const rx = -Math.cos(v.heading), rz = Math.sin(v.heading);
      if (Math.abs(spec.x) < 0.15) {
        // Single file: a tuk-tuk or a scooter has no seat beside the driver.
        e.x = seat.x - Math.sin(v.heading) * 1.0;
        e.z = seat.z - Math.cos(v.heading) * 1.0;
      } else {
        e.x = seat.x - rx * spec.x * 2;
        e.z = seat.z - rz * spec.x * 2;
      }
      e.char.group.position.set(e.x, seat.y - 0.5, e.z);
      e.char.group.rotation.y = v.heading;
      e.char.update(dt, 0, 'sit');
      return;
    }
    const dx = p.x - e.x, dz = p.z - e.z;
    const d = Math.hypot(dx, dz);
    let sp = 0;
    if (d > 2.4) {
      sp = clamp((d - 2.0) * 1.6, 0, 6.2);
      e.x += (dx / d) * sp * dt;
      e.z += (dz / d) * sp * dt;
      e.heading = dampAngle(e.heading, Math.atan2(dx, dz), 8, dt);
    }
    e.char.group.position.set(e.x, 0, e.z);
    e.char.group.rotation.y = e.heading;
    e.char.update(dt, sp, 'walk');
  }

  // ------------------------------------------------------- mission vehicle ---

  spawnMissionVehicle(spec) {
    const p = this.resolvePos(spec.at);
    const off = spec.offset || [5, 5];
    const v = this.game.spawnVehicle(spec.type, p.x + off[0], p.z + off[1], this.rng.range(0, TAU), spec.color);
    this.missionVehicle = v;
    return v;
  }

  // ------------------------------------------------------------ positions ---

  resolvePos(spec) {
    if (!spec) return this.game.playerPos();
    if (spec.lm) {
      const l = this.game.district.landmarks[spec.lm];
      if (!l) return { x: 0, z: 0 };
      // A landmark can name sub-spots - the yard's berm, the impound's bay.
      if (spec.key && l[spec.key]) return { x: l[spec.key].x, z: l[spec.key].z };
      return l.spot ? { x: l.spot.x, z: l.spot.z } : { x: l.cx, z: l.cz };
    }
    if (spec.x !== undefined) return { x: spec.x, z: spec.z };
    return { x: 0, z: 0 };
  }

  /**
   * Turn a scatter spec into concrete, reachable points: on open ground,
   * inside the district, and spread out enough to be a journey.
   */
  resolveScatter(spec, nearLm) {
    if (Array.isArray(spec)) return spec.map((s) => ({ x: s.x, z: s.z }));
    const cfg = spec.scatter || { count: 4, min: 30, max: 100 };
    const d = this.game.district;
    const half = d.half - 12;
    const origin = nearLm && d.landmarks[nearLm]
      ? { x: d.landmarks[nearLm].cx, z: d.landmarks[nearLm].cz }
      : this.game.playerPos();

    const pts = [];
    let guard = 0;
    while (pts.length < cfg.count && guard < 4000) {
      guard++;
      const a = this.rng() * TAU;
      const r = cfg.min + this.rng() * (cfg.max - cfg.min);
      const x = clamp(origin.x + Math.cos(a) * r, -half, half);
      const z = clamp(origin.z + Math.sin(a) * r, -half, half);
      if (!this.game.isClear(x, z, 2.2)) continue;
      // Keep them apart so the route reads as a route.
      if (pts.some((p) => dist2(p.x, p.z, x, z) < 20 * 20)) continue;
      pts.push({ x, z });
    }
    // If the district is unusually dense, fall back to whatever we found.
    while (pts.length < cfg.count) pts.push({ x: origin.x, z: origin.z + 8 * pts.length });
    return pts;
  }

  syncWaypointsFrom(points, color, label) {
    this.setWaypoints(points.filter((p) => !p.done).map((p) => ({ x: p.x, z: p.z, color, label, kind: 'objective' })));
  }

  setWaypoints(list) { this.waypoints = list; }

  /**
   * If the current objective needs wheels and Nagesh is on foot, the most
   * useful marker in the world is the car, not the destination.
   */
  get vehicleWaypoint() {
    if (this.state !== 'active' || !this.obj) return null;
    if (!this.obj.__src.requireVehicle || this.game.player.inVehicle) return null;
    const v = this.missionVehicle && this.game.vehicles.includes(this.missionVehicle)
      ? this.missionVehicle
      : this.game.nearestVehicle(500);
    if (!v) return null;
    return { x: v.x, z: v.z, color: 0x6dff8a, label: v.spec.name, kind: 'vehicle' };
  }

  // ----------------------------------------------------------- interaction ---

  /** Called when the player presses the interact key. */
  interact() {
    if (this.state !== 'active' || !this.obj) return false;
    const o = this.obj;
    const t = o.state.target;
    if (!t) return false;
    if (!this.game.playerNear(t.x, t.z, (o.__src.radius || 5) + 1)) return false;
    if (o.type === 'sign') {
      audio.voice(VOICE.unlock);
      audio.gateOpen();
      this.nextObjective();
      return true;
    }
    if (o.type === 'descend') { this.game.descendToVault(); this.nextObjective(); return true; }
    if (o.type === 'read') { audio.glitch(); this.nextObjective(); return true; }
    return false;
  }

  /** Prompt text for the interact key, or empty. */
  get interactPrompt() {
    if (this.state !== 'active' || !this.obj) return '';
    const o = this.obj;
    if (!['sign', 'descend', 'read'].includes(o.type)) return '';
    const t = o.state.target;
    if (!t || !this.game.playerNear(t.x, t.z, (o.__src.radius || 5) + 1)) return '';
    return o.type === 'sign' ? 'Sign' : o.type === 'descend' ? 'Take the lift down' : 'Read';
  }

  serialize() { return { completed: [...this.completed] }; }
  restore(data) { if (data && data.completed) this.completed = new Set(data.completed); }
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
