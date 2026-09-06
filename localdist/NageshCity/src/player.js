// Nagesh City - input, the player controller and the chase camera.

import * as THREE from '../vendor/three.module.js';
import { makeCharacter, OUTFITS } from './actors.js';
import { clamp, damp, dampAngle, resolveCircle } from './util.js';

// ----------------------------------------------------------------- input ---

export class Input {
  constructor(dom) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = 0;
    this.locked = false;
    this.enabled = true;
    this.dom = dom;

    this._onKeyDown = (e) => {
      if (e.repeat) return;
      const c = e.code;
      // Let the browser keep its own shortcuts, but claim the game keys.
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(c)) e.preventDefault();
      this.keys.add(c);
      this.pressed.add(c);
    };
    this._onKeyUp = (e) => this.keys.delete(e.code);
    this._onMove = (e) => {
      if (!this.locked) return;
      this.mouseDX += e.movementX || 0;
      this.mouseDY += e.movementY || 0;
    };
    this._onWheel = (e) => { this.wheel += Math.sign(e.deltaY); e.preventDefault(); };
    this._onLock = () => { this.locked = document.pointerLockElement === this.dom; };
    this._onBlur = () => { this.keys.clear(); };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousemove', this._onMove);
    window.addEventListener('wheel', this._onWheel, { passive: false });
    document.addEventListener('pointerlockchange', this._onLock);
    window.addEventListener('blur', this._onBlur);
  }

  requestLock() { if (this.dom.requestPointerLock) this.dom.requestPointerLock(); }
  releaseLock() { if (document.exitPointerLock) document.exitPointerLock(); }

  down(code) { return this.enabled && this.keys.has(code); }
  hit(code) { return this.enabled && this.pressed.has(code); }
  anyDown(...codes) { return codes.some((c) => this.down(c)); }

  endFrame() {
    this.pressed.clear();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = 0;
  }
}

// ---------------------------------------------------------------- player ---

const WALK = 4.3;
const SPRINT = 7.8;

export class Player {
  constructor(scene) {
    this.char = makeCharacter({ outfit: OUTFITS.slum, hairStyle: 'short' });
    this.group = this.char.group;
    scene.add(this.group);

    this.x = 0; this.z = 0; this.y = 0;
    this.vy = 0;
    this.heading = 0;
    this.speed = 0;
    this.moveX = 0; this.moveZ = 0;
    this.grounded = true;
    this.radius = 0.46;

    this.health = 100;
    this.dead = false;
    this.posing = false;

    this.inVehicle = false;
    this.vehicle = null;
    this.exitCooldown = 0;

    // Camera rig.
    this.camYaw = Math.PI;
    this.camPitch = 0.22;
    this.camDist = 7.2;
    this.camDistTarget = 7.2;
    this.camPos = new THREE.Vector3(0, 3, 10);
    this.camLook = new THREE.Vector3();
    this.shake = 0;
  }

  setOutfit(key) {
    const parent = this.group.parent;
    const wasVisible = this.group.visible;
    parent.remove(this.group);
    this.char.group.traverse((n) => {
      if (n.isMesh) {
        n.geometry.dispose();
        if (Array.isArray(n.material)) n.material.forEach((m) => m.dispose());
        else if (n.material) n.material.dispose();
      }
    });
    this.char = makeCharacter({ outfit: OUTFITS[key] || OUTFITS.slum, hairStyle: 'short' });
    this.group = this.char.group;
    this.group.visible = wasVisible;
    parent.add(this.group);
  }

  teleport(x, z, heading) {
    this.x = x; this.z = z; this.y = 0; this.vy = 0;
    this.heading = heading !== undefined ? heading : this.heading;
    this.camYaw = this.heading + Math.PI;
    this.speed = 0;
    this.group.position.set(x, 0, z);
    this.group.rotation.y = this.heading;
  }

  // ------------------------------------------------------------- movement ---

  update(dt, input, grid, camera, opts = {}) {
    if (this.exitCooldown > 0) this.exitCooldown -= dt;

    // --- camera orbit ------------------------------------------------------
    const sens = 0.0022;
    this.camYaw -= input.mouseDX * sens;
    this.camPitch = clamp(this.camPitch + input.mouseDY * sens, -0.45, 1.15);
    if (input.wheel) this.camDistTarget = clamp(this.camDistTarget + input.wheel * 0.9, 3.2, 16);
    this.camDist = damp(this.camDist, this.camDistTarget, 9, dt);

    if (this.inVehicle) {
      this.updateInVehicle(dt, input, camera, opts);
      return;
    }

    // --- on foot -----------------------------------------------------------
    let ix = 0, iz = 0;
    if (input.down('KeyW') || input.down('ArrowUp')) iz += 1;
    if (input.down('KeyS') || input.down('ArrowDown')) iz -= 1;
    if (input.down('KeyA') || input.down('ArrowLeft')) ix -= 1;
    if (input.down('KeyD') || input.down('ArrowRight')) ix += 1;

    const posing = this.posing && ix === 0 && iz === 0;
    const len = Math.hypot(ix, iz);
    const sprint = input.down('ShiftLeft') || input.down('ShiftRight');
    let target = 0;

    if (len > 0 && !posing && !this.dead) {
      ix /= len; iz /= len;
      // Movement is relative to where the camera is pointing, as it should be.
      const cos = Math.cos(this.camYaw), sin = Math.sin(this.camYaw);
      const wx = ix * cos - iz * sin;
      const wz = -ix * sin - iz * cos;
      const want = Math.atan2(wx, wz);
      this.heading = dampAngle(this.heading, want, 13, dt);
      target = sprint ? SPRINT : WALK;
    }

    this.speed = damp(this.speed, target, target > this.speed ? 9 : 12, dt);

    if (this.grounded && (input.hit('Space')) && !this.dead) {
      this.vy = 6.6;
      this.grounded = false;
    }
    this.vy -= 21 * dt;
    this.y += this.vy * dt;
    if (this.y <= 0) { this.y = 0; this.vy = 0; this.grounded = true; }

    const nx = this.x + Math.sin(this.heading) * this.speed * dt;
    const nz = this.z + Math.cos(this.heading) * this.speed * dt;
    const pos = { x: nx, z: nz };
    if (grid) resolveCircle(grid, pos, this.radius);
    this.x = pos.x; this.z = pos.z;

    if (opts.bounds !== undefined) {
      const b = opts.bounds;
      this.x = clamp(this.x, -b, b);
      this.z = clamp(this.z, -b, b);
    }

    this.group.position.set(this.x, this.y, this.z);
    this.group.rotation.y = this.heading;
    this.char.update(dt, this.dead ? 0 : this.speed, posing ? 'pose' : 'walk');
    if (this.dead) {
      // Face down. The camera holds on him for a moment.
      this.group.rotation.x = damp(this.group.rotation.x, -1.4, 6, dt);
    } else {
      this.group.rotation.x = damp(this.group.rotation.x, 0, 10, dt);
    }

    this.updateCamera(dt, camera, grid, {
      height: 1.55, dist: this.camDist, lookAhead: 0.6,
    });
  }

  updateInVehicle(dt, input, camera, opts) {
    const v = this.vehicle;
    this.x = v.x; this.z = v.z; this.y = 0;
    this.heading = v.heading;
    this.speed = Math.abs(v.speed);
    // Sit in the driver's seat. The sit pose puts the hips 0.5 above the
    // group origin, so drop the group by that much to land them on the seat.
    const seat = v.seatPoint();
    this.group.position.set(seat.x, seat.y - 0.5, seat.z);
    this.group.rotation.set(0, v.heading, 0);
    this.char.update(dt, 0, 'sit');

    // The camera settles behind the car unless the player is looking around.
    if (Math.abs(input.mouseDX) < 0.5) {
      this.camYaw = dampAngle(this.camYaw, v.heading + Math.PI, 2.6, dt);
    }
    const speedFrac = clamp(Math.abs(v.speed) / v.spec.topSpeed, 0, 1);
    const dist = this.camDist * (1 + v.spec.l * 0.09) + speedFrac * 2.4;
    this.updateCamera(dt, camera, opts.grid, {
      height: 2.0 + v.spec.h * 0.35, dist, lookAhead: 2.2 + speedFrac * 5,
      fovBoost: speedFrac * 12,
    });
  }

  updateCamera(dt, camera, grid, cfg) {
    const cy = Math.cos(this.camPitch);
    const ox = Math.sin(this.camYaw) * cy;
    const oz = Math.cos(this.camYaw) * cy;
    const oy = Math.sin(this.camPitch);

    const tx = this.x, tz = this.z;
    const ty = this.y + cfg.height;

    let dist = cfg.dist;
    // Pull the camera in if a building is in the way. Sampling the boom is
    // cheaper than a raycast and good enough for a chase camera.
    if (grid) {
      const steps = 6;
      for (let i = steps; i >= 1; i--) {
        const d = (dist * i) / steps;
        const px = tx + ox * d, pz = tz + oz * d;
        const p = { x: px, z: pz };
        const hit = resolveCircle(grid, p, 0.55);
        if (hit.hits && ty + oy * d < 18) { dist = (dist * (i - 1)) / steps; }
      }
      dist = Math.max(1.6, dist);
    }

    const want = new THREE.Vector3(tx + ox * dist, ty + oy * dist + 0.9, tz + oz * dist);
    this.camPos.lerp(want, 1 - Math.exp(-11 * dt));

    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 2.4);
      const s = this.shake * 0.35;
      this.camPos.x += (Math.random() - 0.5) * s;
      this.camPos.y += (Math.random() - 0.5) * s;
      this.camPos.z += (Math.random() - 0.5) * s;
    }

    const lookTarget = new THREE.Vector3(
      tx - ox * cfg.lookAhead * 0.35,
      ty + 0.25,
      tz - oz * cfg.lookAhead * 0.35
    );
    this.camLook.lerp(lookTarget, 1 - Math.exp(-13 * dt));

    camera.position.copy(this.camPos);
    camera.lookAt(this.camLook);

    const wantFov = 62 + (cfg.fovBoost || 0);
    if (Math.abs(camera.fov - wantFov) > 0.05) {
      camera.fov = damp(camera.fov, wantFov, 5, dt);
      camera.updateProjectionMatrix();
    }
  }

  // ------------------------------------------------------------- vehicles ---

  enter(vehicle) {
    this.inVehicle = true;
    this.vehicle = vehicle;
    vehicle.occupied = true;
    this.exitCooldown = 0.35;
  }

  exit(grid) {
    const v = this.vehicle;
    if (!v) return;
    const p = v.exitPoint();
    const pos = { x: p.x, z: p.z };
    if (grid) resolveCircle(grid, pos, this.radius);
    this.x = pos.x; this.z = pos.z; this.y = 0;
    this.heading = v.heading + Math.PI / 2;
    this.speed = 0;
    v.occupied = false;
    this.vehicle = null;
    this.inVehicle = false;
    this.exitCooldown = 0.35;
    this.group.rotation.set(0, this.heading, 0);
  }

  hurt(amount) {
    if (this.dead) return false;
    this.health = clamp(this.health - amount, 0, 100);
    this.shake = Math.min(1.2, this.shake + amount * 0.02);
    if (this.health <= 0) { this.dead = true; return true; }
    return false;
  }

  heal(amount) { this.health = clamp(this.health + amount, 0, 100); }

  revive() {
    this.dead = false;
    this.health = 100;
    this.group.rotation.x = 0;
  }
}
