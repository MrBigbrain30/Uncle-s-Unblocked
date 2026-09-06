// Nagesh City - corner minimap and the full-screen map.
//
// Both are drawn from the same district data the 3D world was generated from,
// so what you see on the map is exactly what is standing in front of you.

const COL = {
  ground: '#141a16',
  groundHeights: '#1a2016',
  road: '#3d4148',
  roadEdge: '#565b64',
  building: '#2c3138',
  buildingTall: '#3a414a',
  wall: '#7a3f2f',
  player: '#ffd23f',
  vehicle: '#6dff8a',
  text: '#cfd6de',
};

export class Minimap {
  constructor(canvas, fullCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.full = fullCanvas;
    this.fullCtx = fullCanvas.getContext('2d');
    this.range = 95;          // world metres visible across the minimap radius
    this.zoom = 1;
    this._cacheKey = null;
    this._cache = null;       // offscreen static layer, redrawn only per district
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [this.canvas, this.full]) {
      const r = c.getBoundingClientRect();
      // A hidden element measures 0. Keep the last good size rather than
      // collapsing the canvas, and let the next resize pick up the real one.
      if (r.width < 4 || r.height < 4) continue;
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
    }
  }

  /**
   * The static parts of a district never change, so draw them once into an
   * offscreen canvas in world space and blit it with a transform each frame.
   */
  buildCache(district) {
    const half = district.half;
    const px = 900;                       // resolution of the cached layer
    const s = px / (half * 2);
    const c = document.createElement('canvas');
    c.width = px; c.height = px;
    const g = c.getContext('2d');

    const isHeights = district.def.id === 'heights';
    g.fillStyle = district.def.id === 'vault' ? '#0d1016' : (isHeights ? COL.groundHeights : COL.ground);
    g.fillRect(0, 0, px, px);

    const wx = (x) => (x + half) * s;
    const wz = (z) => (z + half) * s;

    // Roads.
    g.fillStyle = COL.road;
    for (const r of district.mapRoads) {
      g.fillRect(wx(r.x - r.w / 2), wz(r.z - r.d / 2), r.w * s, r.d * s);
    }
    g.strokeStyle = 'rgba(255,255,255,0.07)';
    g.lineWidth = 1;
    for (const r of district.mapRoads) {
      g.strokeRect(wx(r.x - r.w / 2), wz(r.z - r.d / 2), r.w * s, r.d * s);
    }

    // Buildings, taller ones lighter so the skyline reads on the map.
    for (const b of district.mapBuildings) {
      g.fillStyle = b.h > 20 ? COL.buildingTall : COL.building;
      g.fillRect(wx(b.x - b.w / 2), wz(b.z - b.d / 2), b.w * s, b.d * s);
    }

    // District wall and the one gate in it.
    g.strokeStyle = COL.wall;
    g.lineWidth = Math.max(2, 3 * s);
    g.strokeRect(wx(-half), wz(-half), half * 2 * s, half * 2 * s);
    const gate = district.landmarks && district.landmarks.gate;
    if (gate) {
      g.strokeStyle = '#f0c040';
      g.lineWidth = Math.max(3, 5 * s);
      g.beginPath();
      g.moveTo(wx(-gate.half), wz(gate.z));
      g.lineTo(wx(gate.half), wz(gate.z));
      g.stroke();
    }

    this._cache = { canvas: c, px, s, half };
    this._cacheKey = district.def.id;
  }

  ensureCache(district) {
    if (this._cacheKey !== district.def.id) this.buildCache(district);
    return this._cache;
  }

  // ------------------------------------------------------------- minimap ---

  render(game) {
    const ctx = this.ctx;
    if (this.canvas.width < 8 || this.canvas.height < 8) {
      // The HUD was hidden when we last measured. Try again now that it is not.
      this.resize();
      if (this.canvas.width < 8) return;
    }
    const W = this.canvas.width, H = this.canvas.height;
    const R = Math.max(6, Math.min(W, H) / 2);
    const d = game.district;
    const cache = this.ensureCache(d);
    const p = game.playerPos();
    const heading = game.player.inVehicle ? game.player.vehicle.heading : game.player.heading;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    // Circular mask.
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, R - 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#0b0e12';
    ctx.fillRect(0, 0, W, H);

    // World -> screen: rotate so the player's facing always points up.
    // Canvas +y is world +z, so the rotation that sends (sin h, cos h) to
    // straight up is (heading - PI).
    const spin = heading - Math.PI;
    const scale = (R * 2) / (this.range * 2 / this.zoom);
    ctx.translate(W / 2, H / 2);
    ctx.rotate(spin);
    ctx.scale(scale, scale);
    ctx.translate(-p.x, -p.z);

    // Blit the cached static layer in world coordinates.
    const c = cache;
    ctx.drawImage(c.canvas, -c.half, -c.half, c.half * 2, c.half * 2);

    // Dynamic markers.
    this.drawMarkers(ctx, game, 1 / scale, spin);
    ctx.restore();

    // Frame + cardinal N.
    ctx.save();
    ctx.strokeStyle = 'rgba(220,225,232,0.55)';
    ctx.lineWidth = Math.max(2, R * 0.022);
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, R - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Where world-north (-z) ends up once the map has been spun.
    const spinN = heading - Math.PI;
    const nAng = Math.atan2(-Math.cos(spinN), Math.sin(spinN));
    ctx.fillStyle = '#e05a4a';
    ctx.font = 'bold ' + Math.round(R * 0.2) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', W / 2 + Math.cos(nAng) * (R - R * 0.16), H / 2 + Math.sin(nAng) * (R - R * 0.16));
    ctx.restore();

    // Player arrow, dead centre.
    this.drawArrow(ctx, W / 2, H / 2, R * 0.11, game.player.inVehicle ? '#6dff8a' : COL.player);
  }

  drawMarkers(ctx, game, inv, spin) {
    const dot = (x, z, r, color, ring) => {
      ctx.beginPath();
      ctx.arc(x, z, r * inv, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      if (ring) {
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 1.5 * inv;
        ctx.stroke();
      }
    };

    // Parked vehicles.
    for (const v of game.vehicles) {
      if (v === (game.player.vehicle)) continue;
      dot(v.x, v.z, 3.2, COL.vehicle, true);
    }

    // Landmarks with names.
    for (const key in game.district.landmarks) {
      const l = game.district.landmarks[key];
      if (!l.label) continue;
      const x = l.spot ? l.spot.x : l.cx;
      const z = l.spot ? l.spot.z : l.cz;
      dot(x, z, 2.6, 'rgba(190,200,215,0.8)', false);
    }

    // Mission waypoints, drawn last so they sit on top.
    for (const w of game.waypoints) {
      const col = '#' + w.color.toString(16).padStart(6, '0');
      ctx.save();
      ctx.translate(w.x, w.z);
      ctx.rotate(performance.now() * 0.002 - spin);
      ctx.fillStyle = col;
      ctx.beginPath();
      const r = 5.5 * inv;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  drawArrow(ctx, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.25);
    ctx.lineTo(r * 0.82, r * 0.95);
    ctx.lineTo(0, r * 0.45);
    ctx.lineTo(-r * 0.82, r * 0.95);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,12,16,0.85)';
    ctx.lineWidth = Math.max(1.5, r * 0.16);
    ctx.stroke();
    ctx.restore();
  }

  // ----------------------------------------------------------- full map ---

  renderFull(game) {
    const ctx = this.fullCtx;
    if (this.full.width < 8 || this.full.height < 8) {
      this.resize();
      if (this.full.width < 8) return;
    }
    const W = this.full.width, H = this.full.height;
    const d = game.district;
    const cache = this.ensureCache(d);
    const p = game.playerPos();

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#080a0e';
    ctx.fillRect(0, 0, W, H);

    const pad = Math.min(W, H) * 0.06;
    const size = Math.min(W, H) - pad * 2;
    const s = size / (d.half * 2);
    const ox = (W - size) / 2, oy = (H - size) / 2;

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(s, s);
    ctx.translate(d.half, d.half);

    ctx.drawImage(cache.canvas, -cache.half, -cache.half, cache.half * 2, cache.half * 2);

    // Labels for every landmark, north-up.
    ctx.font = (11 / s) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const key in d.landmarks) {
      const l = d.landmarks[key];
      if (!l.label) continue;
      const x = l.spot ? l.spot.x : l.cx;
      const z = l.spot ? l.spot.z : l.cz;
      ctx.fillStyle = 'rgba(220,228,238,0.9)';
      ctx.beginPath();
      ctx.arc(x, z, 3 / s * 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(230,236,244,0.92)';
      ctx.fillText(l.label, x, z - 8 / s * 1.4);
    }

    for (const v of game.vehicles) {
      ctx.fillStyle = COL.vehicle;
      ctx.beginPath();
      ctx.arc(v.x, v.z, 3 / s, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const w of game.waypoints) {
      const col = '#' + w.color.toString(16).padStart(6, '0');
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5 / s;
      ctx.setLineDash([6 / s, 5 / s]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.z);
      ctx.lineTo(w.x, w.z);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(w.x, w.z, 6 / s, 0, Math.PI * 2);
      ctx.fill();
      if (w.label) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold ' + (12 / s) + 'px system-ui, sans-serif';
        // Sit above the landmark labels so the two never collide.
        ctx.fillText(w.label, w.x, w.z - 22 / s);
      }
    }

    ctx.restore();

    // Player arrow.
    const heading = game.player.inVehicle ? game.player.vehicle.heading : game.player.heading;
    ctx.save();
    ctx.translate(ox + (p.x + d.half) * s, oy + (p.z + d.half) * s);
    ctx.rotate(heading);
    this.drawArrow(ctx, 0, 0, Math.max(7, size * 0.014), COL.player);
    ctx.restore();

    // Title and the locked-district notice.
    ctx.fillStyle = '#e8eef6';
    ctx.font = 'bold ' + Math.round(H * 0.035) + 'px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(d.def.name.toUpperCase(), ox, oy - pad * 0.35);
    ctx.font = Math.round(H * 0.019) + 'px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,210,225,0.7)';
    ctx.fillText(d.def.subtitle || '', ox, oy - pad * 0.05);

    ctx.textAlign = 'right';
    const locked = game.districtLockMessage();
    ctx.fillStyle = locked ? '#e08a4a' : '#6dff8a';
    ctx.fillText(locked || 'Gate open - head north', ox + size, oy - pad * 0.05);
  }
}
