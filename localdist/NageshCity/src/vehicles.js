// Nagesh City - arcade vehicle physics.
//
// Not a simulation. The car should feel like a toy you can throw at a corner:
// grip that lets go under the handbrake, weight that transfers, and a wall hit
// that costs you speed rather than ending the run.

import * as THREE from '../vendor/three.module.js';
import { makeVehicle, VEHICLE_TYPES } from './actors.js';
import { clamp, resolveCircle, damp, TAU } from './util.js';
import { audio } from './audio.js';

export class Vehicle {
  constructor(typeKey, x, z, heading, color) {
    const built = makeVehicle(typeKey, color);
    this.type = typeKey;
    this.spec = built.spec;
    this.group = built.group;
    this.wheels = built.wheels;
    this.x = x; this.z = z; this.heading = heading || 0;
    this.vx = 0; this.vz = 0;
    this.speed = 0;
    this.steerAngle = 0;
    this.body = 100;
    this.radius = this.spec.l * 0.36;
    this.bobPhase = Math.random() * TAU;
    this.roll = 0; this.pitch = 0;
    this.occupied = false;
    this.group.position.set(x, 0, z);
    this.group.rotation.order = 'YXZ';
    this.group.rotation.y = heading;
    // Far enough in the past that the very first impact always registers.
    this.lastCrash = -1e9;

    // Damage model. `burning` is the window between "this car is finished" and
    // "this car is a crater", and it is deliberately long enough to get out of.
    this.burning = false;
    this.fuse = 0;
    this.wrecked = false;
    this.ai = null;         // set by the traffic system
    this.fx = null;         // fire effect, owned by the game
  }

  /** @param input {throttle,steer,handbrake} all -1..1 / bool */
  update(dt, input, grid) {
    const s = this.spec;
    // A wreck is scenery with momentum. It rolls to a stop and stays there.
    if (this.wrecked) input = null;
    // Forward is the model's local +Z once yawed. In a Y-up right-handed
    // space, the driver's right is then (-cos h, sin h) - getting this
    // backwards is what made the steering feel inverted.
    const fwdX = Math.sin(this.heading), fwdZ = Math.cos(this.heading);
    const rgtX = -Math.cos(this.heading), rgtZ = Math.sin(this.heading);

    let fwd = this.vx * fwdX + this.vz * fwdZ;
    let lat = this.vx * rgtX + this.vz * rgtZ;

    if (input) {
      const th = input.throttle;
      if (th > 0) {
        fwd += s.accel * th * dt * (fwd < 0 ? 2.2 : 1);
      } else if (th < 0) {
        // Reverse is deliberately slow; braking is strong.
        fwd += s.accel * th * dt * (fwd > 0 ? 2.4 : 0.55);
      } else {
        fwd -= fwd * 1.1 * dt;
      }
      const maxRev = -s.topSpeed * 0.35;
      fwd = clamp(fwd, maxRev, s.topSpeed);

      // Steering authority falls off with speed so the car stays drivable flat out.
      const speedFrac = Math.abs(fwd) / s.topSpeed;
      const authority = 1 - speedFrac * 0.55;
      const target = input.steer * authority;
      this.steerAngle = damp(this.steerAngle, target, 12, dt);
      // steerAngle is positive for "turn right", and turning right means
      // rotating clockwise seen from above, which is a *decreasing* yaw.
      const turn = this.steerAngle * s.handling * dt * clamp(Math.abs(fwd) / 3.5, 0, 1) * Math.sign(fwd || 1);
      this.heading -= turn;

      // Handbrake breaks traction; the lateral velocity is what you feel as drift.
      const grip = input.handbrake ? s.grip * 0.16 : s.grip;
      lat -= lat * clamp(grip * 5.5 * dt, 0, 1);
      // Cornering throws the car toward the outside of the bend; that is the
      // slide you steer into.
      lat += turn * fwd * (input.handbrake ? 0.9 : 0.28);
      if (input.handbrake) fwd -= fwd * 0.45 * dt;

      // Body leans away from the corner and squats under power. Kept small:
      // any more and a box on wheels starts to look like it is floating.
      this.roll = damp(this.roll, clamp(-this.steerAngle * speedFrac * 0.13, -0.1, 0.1), 8, dt);
      this.pitch = damp(this.pitch, clamp(-input.throttle * 0.03, -0.035, 0.035), 6, dt);
    } else {
      fwd -= fwd * 1.6 * dt;
      lat -= lat * 4 * dt;
      this.roll = damp(this.roll, 0, 6, dt);
      this.pitch = damp(this.pitch, 0, 6, dt);
    }

    // Air + rolling drag.
    fwd -= fwd * Math.abs(fwd) * 0.0022 * dt * 60 / 60;
    lat -= lat * 3.2 * dt;

    this.vx = fwdX * fwd + rgtX * lat;
    this.vz = fwdZ * fwd + rgtZ * lat;
    this.speed = fwd;

    // Substep the move. Flat out, a sports car covers over two metres in a
    // frame, which is enough to pass clean through a wall in one go.
    const dx = this.vx * dt, dz = this.vz * dt;
    const steps = grid ? Math.min(8, Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.55))) : 1;
    const pos = { x: this.x, z: this.z };
    let hitCount = 0;
    let nx = 0, nz = 0;
    for (let i = 0; i < steps; i++) {
      pos.x += dx / steps;
      pos.z += dz / steps;
      if (!grid) continue;
      const r = resolveCircle(grid, pos, this.radius, { iter: 4 });
      hitCount += r.hits;
      nx += r.nx; nz += r.nz;
    }
    this.x = pos.x; this.z = pos.z;
    const hit = { hits: hitCount };

    if (hit.hits) {
      const impact = Math.abs(this.speed);
      if (impact > 5 && performance.now() - this.lastCrash > 220) {
        this.lastCrash = performance.now();
        audio.crash(clamp(impact / s.topSpeed, 0, 1), audio.gainAt(this.x, this.z));
        this.damage(impact * 0.42, 'crash');
      }
      // Kill the velocity going *into* the wall and keep what was going along
      // it, so glancing a building slides you down it instead of parking you.
      const nl = Math.hypot(nx, nz);
      if (nl > 0.001) {
        const ux = nx / nl, uz = nz / nl;
        const into = this.vx * ux + this.vz * uz;
        if (into < 0) {
          // Take out the component going into the wall, and give a real hit a
          // little of it back as a bounce. Below that threshold it just stops,
          // or nudging a kerb at walking pace turns into a rattle.
          const restitution = -into > 6 ? 1.22 : 1;
          this.vx -= ux * into * restitution;
          this.vz -= uz * into * restitution;
        }
        // Friction against the wall, proportional to how hard you are leaning
        // on it and scaled by dt. It has to be a rate rather than a per-frame
        // multiplier: a graze touches the wall for a hundred frames in a row,
        // and any flat multiplier compounds that into a dead stop.
        const mu = clamp(Math.abs(into) * 0.055, 0, 1.1);
        const k = Math.exp(-mu * dt);
        this.vx *= k; this.vz *= k;
        // Re-derive forward speed from what survived, or the wheels lie.
        this.speed = this.vx * fwdX + this.vz * fwdZ;
      } else {
        const loss = clamp(impact / 12, 0.25, 0.8);
        this.vx *= 1 - loss; this.vz *= 1 - loss;
        this.speed *= 1 - loss;
      }
    }

    // Presentation. 'YXZ' applies yaw first, so pitch and roll happen in the
    // car's own frame instead of tipping it around the world axes.
    this.group.position.set(this.x, this.wrecked ? -0.09 : 0, this.z);
    this.group.rotation.set(this.pitch, this.heading, this.roll + (this.wreckRoll || 0));
    const rot = (this.speed * dt) / this.spec.wheelR;
    for (const w of this.wheels) {
      w.pivot.rotation.x -= rot;
      if (w.steers) w.pivot.rotation.y = -this.steerAngle * 0.55;
    }
    // Idle shake so a parked engine still feels alive.
    if (this.occupied && Math.abs(this.speed) < 0.4) {
      this.bobPhase += dt * 18;
      this.group.position.y = Math.sin(this.bobPhase) * 0.006;
    } else {
      this.group.position.y = 0;
    }

    return hit.hits;
  }

  get speedKph() { return Math.abs(this.speed) * 3.6; }
  get rpm01() { return clamp(Math.abs(this.speed) / this.spec.topSpeed, 0, 1); }

  /**
   * Take damage. Returns true on the frame the car gives up, which is the
   * caller's cue to light it and start the countdown.
   * @returns {boolean} the vehicle just started burning
   */
  damage(amount, source) {
    if (this.wrecked || this.burning) return false;
    this.body = Math.max(0, this.body - amount);
    if (this.body > 0) return false;
    this.burning = true;
    // Longer if somebody is sitting in it: the fuse is a chance to get out,
    // not a punishment for having been in the wrong seat.
    this.fuse = this.occupied ? 3.4 : 2.2;
    return true;
  }

  /** Turn the burnt-out shell black and take it off the road permanently. */
  wreck() {
    this.wrecked = true;
    this.burning = false;
    this.group.traverse((n) => {
      if (!n.isMesh || !n.material || !n.material.color) return;
      n.material.color.multiplyScalar(0.22);
      if (n.material.emissive) n.material.emissive.setHex(0x000000);
      if (n.material.isMeshBasicMaterial) n.material.color.setHex(0x1a1614);
    });
    this.wreckRoll = (Math.random() - 0.5) * 0.16;
  }

  /** A point beside the car to step out onto (driver's side). */
  exitPoint() {
    const d = this.spec.w * 0.5 + 0.9;
    return {
      x: this.x - Math.cos(this.heading) * d,
      z: this.z + Math.sin(this.heading) * d,
    };
  }

  /** World position of the driver's hips, from the spec's local seat offset. */
  seatPoint() {
    const s = this.spec.seat || { x: 0, y: this.spec.seatY, z: 0 };
    const fx = Math.sin(this.heading), fz = Math.cos(this.heading);
    const rx = -Math.cos(this.heading), rz = Math.sin(this.heading);
    return {
      x: this.x + fx * s.z + rx * s.x,
      y: s.y,
      z: this.z + fz * s.z + rz * s.x,
    };
  }

  dispose() {
    this.group.traverse((n) => {
      if (n.isMesh) {
        n.geometry.dispose();
        if (Array.isArray(n.material)) n.material.forEach((m) => m.dispose());
        else if (n.material) n.material.dispose();
      }
    });
  }
}

export { VEHICLE_TYPES };
