// Nagesh City - procedural art.
//
// There are no image files in this project. Every surface in the city is drawn
// here with a 2D canvas and uploaded as a texture. Keeping it all in one place
// also means the whole look of a district can be retuned from one palette.

import * as THREE from '../vendor/three.module.js';
import { makeRNG } from './util.js';

const cache = new Map();

function canvas(size, h) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = h || size;
  return c;
}

function texture(key, size, draw, repeat = [1, 1], h) {
  if (cache.has(key)) return cache.get(key);
  const c = canvas(size, h);
  const ctx = c.getContext('2d');
  draw(ctx, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

// --------------------------------------------------------------- noise ---

function valueNoise(w, h, cells, seed) {
  const rng = makeRNG(seed);
  const gw = cells + 1;
  const grid = new Float32Array(gw * gw);
  for (let i = 0; i < grid.length; i++) grid[i] = rng();
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const fx = (x / w) * cells, fy = (y / h) * cells;
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const tx = fx - x0, ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const i00 = grid[(y0 % cells) * gw + (x0 % cells)];
      const i10 = grid[(y0 % cells) * gw + ((x0 + 1) % cells)];
      const i01 = grid[((y0 + 1) % cells) * gw + (x0 % cells)];
      const i11 = grid[((y0 + 1) % cells) * gw + ((x0 + 1) % cells)];
      const a = i00 + (i10 - i00) * sx;
      const b = i01 + (i11 - i01) * sx;
      out[y * w + x] = a + (b - a) * sy;
    }
  }
  return out;
}

function fbm(w, h, seed, octaves = 4, base = 4) {
  const out = new Float32Array(w * h);
  let amp = 1, total = 0, cells = base;
  for (let o = 0; o < octaves; o++) {
    const n = valueNoise(w, h, cells, seed + o * 977);
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp;
    total += amp;
    amp *= 0.5;
    cells *= 2;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

/** Paint an fbm field through a colour ramp. */
function paintNoise(ctx, w, h, seed, ramp, octaves = 4, base = 4) {
  const n = fbm(w, h, seed, octaves, base);
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const c = ramp(n[i], i % w, Math.floor(i / w));
    img.data[i * 4] = c[0];
    img.data[i * 4 + 1] = c[1];
    img.data[i * 4 + 2] = c[2];
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function hexToRgb(hex) {
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

function rgbCss(c) {
  return 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';
}

// ---------------------------------------------------------------- ground ---

export function asphalt(seed = 1, dark = 0.0) {
  return texture('asphalt' + seed + dark, 256, (ctx, w, h) => {
    const a = hexToRgb(0x2a2a2e), b = hexToRgb(0x46464d);
    paintNoise(ctx, w, h, seed, (n) => {
      const c = mix(a, b, n * 0.9 + 0.05);
      return [c[0] * (1 - dark), c[1] * (1 - dark), c[2] * (1 - dark)];
    }, 5, 8);
    // Grit specks and hairline cracks.
    const rng = makeRNG(seed + 99);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = 'rgba(255,255,255,' + (rng() * 0.05) + ')';
      ctx.fillRect(rng() * w, rng() * h, 1, 1);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    for (let i = 0; i < 7; i++) {
      ctx.lineWidth = rng() * 1.2 + 0.3;
      ctx.beginPath();
      let x = rng() * w, y = rng() * h;
      ctx.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        x += (rng() - 0.5) * 60;
        y += (rng() - 0.5) * 60;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }, [1, 1]);
}

export function dirt(seed = 2) {
  return texture('dirt' + seed, 256, (ctx, w, h) => {
    const a = hexToRgb(0x4a3c2c), b = hexToRgb(0x776045);
    paintNoise(ctx, w, h, seed, (n) => mix(a, b, n), 5, 5);
    const rng = makeRNG(seed + 7);
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = 'rgba(40,32,24,' + (0.1 + rng() * 0.3) + ')';
      const r = rng() * 3 + 1;
      ctx.beginPath(); ctx.arc(rng() * w, rng() * h, r, 0, 7); ctx.fill();
    }
  });
}

export function grass(seed = 3) {
  return texture('grass' + seed, 256, (ctx, w, h) => {
    const a = hexToRgb(0x2f5c2a), b = hexToRgb(0x5f9a45);
    paintNoise(ctx, w, h, seed, (n) => mix(a, b, n), 4, 10);
    const rng = makeRNG(seed + 3);
    ctx.strokeStyle = 'rgba(120,180,90,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 400; i++) {
      const x = rng() * w, y = rng() * h;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rng() - 0.5) * 3, y - 3 - rng() * 3); ctx.stroke();
    }
  });
}

export function sidewalk(seed = 4, light = 0) {
  return texture('sidewalk' + seed + light, 256, (ctx, w, h) => {
    const a = hexToRgb(light ? 0x9a978f : 0x66645f);
    const b = hexToRgb(light ? 0xc9c6bd : 0x8a8781);
    paintNoise(ctx, w, h, seed, (n) => mix(a, b, n), 4, 6);
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      const p = (i / 4) * w;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(w, p); ctx.stroke();
    }
  });
}

export function marble(seed = 5) {
  return texture('marble' + seed, 256, (ctx, w, h) => {
    const a = hexToRgb(0xe8e4da), b = hexToRgb(0xfdfbf5);
    paintNoise(ctx, w, h, seed, (n) => mix(a, b, n), 4, 3);
    const rng = makeRNG(seed);
    ctx.strokeStyle = 'rgba(150,145,135,0.4)';
    for (let i = 0; i < 12; i++) {
      ctx.lineWidth = rng() * 1.6 + 0.2;
      ctx.beginPath();
      let x = rng() * w, y = rng() * h;
      ctx.moveTo(x, y);
      for (let s = 0; s < 8; s++) { x += (rng() - 0.5) * 70; y += (rng() - 0.4) * 50; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(120,115,105,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, w, h);
  });
}

export function plaza(seed = 6) {
  return texture('plaza' + seed, 256, (ctx, w, h) => {
    const a = hexToRgb(0x3c3f46), b = hexToRgb(0x565a63);
    paintNoise(ctx, w, h, seed, (n) => mix(a, b, n), 4, 6);
    ctx.strokeStyle = 'rgba(20,22,26,0.6)';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 2; i++) {
      const p = (i / 2) * w;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(w, p); ctx.stroke();
    }
  });
}

// ----------------------------------------------------------------- walls ---

export function corrugated(hue = 0x8a6a4a, seed = 11) {
  return texture('corr' + hue + seed, 256, (ctx, w, h) => {
    const base = hexToRgb(hue);
    for (let x = 0; x < w; x++) {
      const wave = 0.55 + 0.45 * Math.sin((x / w) * Math.PI * 2 * 16);
      const c = mix([base[0] * 0.45, base[1] * 0.45, base[2] * 0.45], base, wave);
      ctx.fillStyle = rgbCss(c);
      ctx.fillRect(x, 0, 1, h);
    }
    // Rust blooms and streaks.
    const rng = makeRNG(seed);
    for (let i = 0; i < 26; i++) {
      const x = rng() * w, y = rng() * h, r = rng() * 26 + 6;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(126,58,22,0.55)');
      g.addColorStop(1, 'rgba(126,58,22,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    ctx.fillStyle = 'rgba(60,30,12,0.25)';
    for (let i = 0; i < 40; i++) {
      const x = rng() * w, y = rng() * h;
      ctx.fillRect(x, y, 1 + rng() * 2, rng() * 40);
    }
  });
}

export function brick(seed = 12) {
  return texture('brick' + seed, 256, (ctx, w, h) => {
    const rng = makeRNG(seed);
    ctx.fillStyle = '#6b6259';
    ctx.fillRect(0, 0, w, h);
    const bh = 20, bw = 48;
    for (let row = 0, y = 0; y < h; y += bh, row++) {
      const off = (row % 2) * (bw / 2);
      for (let x = -bw; x < w + bw; x += bw) {
        const v = rng();
        const c = mix(hexToRgb(0x7a3b2a), hexToRgb(0xa9614a), v);
        ctx.fillStyle = rgbCss(c);
        ctx.fillRect(x + off + 1.5, y + 1.5, bw - 3, bh - 3);
        if (rng() < 0.12) {
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          ctx.fillRect(x + off + 1.5, y + 1.5, bw - 3, bh - 3);
        }
      }
    }
    ctx.fillStyle = 'rgba(30,24,20,0.18)';
    for (let i = 0; i < 300; i++) ctx.fillRect(rng() * w, rng() * h, 2, 2);
  });
}

export function plaster(hue = 0xb8a98c, seed = 13, grime = 0.5) {
  return texture('plaster' + hue + seed + grime, 256, (ctx, w, h) => {
    const base = hexToRgb(hue);
    paintNoise(ctx, w, h, seed, (n) => mix([base[0] * 0.78, base[1] * 0.78, base[2] * 0.78], base, n), 4, 5);
    const rng = makeRNG(seed + 5);
    // Water stains bleeding down from the top.
    for (let i = 0; i < 18 * grime; i++) {
      const x = rng() * w;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(50,44,36,' + (0.25 * grime) + ')');
      g.addColorStop(1, 'rgba(50,44,36,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, 4 + rng() * 16, h * (0.4 + rng() * 0.6));
    }
    // Exposed patches.
    ctx.fillStyle = 'rgba(90,78,64,' + (0.35 * grime) + ')';
    for (let i = 0; i < 10 * grime; i++) {
      ctx.beginPath();
      ctx.ellipse(rng() * w, rng() * h, rng() * 20 + 4, rng() * 14 + 3, rng() * 3, 0, 7);
      ctx.fill();
    }
  });
}

export function concrete(seed = 14, tintHex = 0x8e8e92) {
  return texture('concrete' + seed + tintHex, 256, (ctx, w, h) => {
    const base = hexToRgb(tintHex);
    paintNoise(ctx, w, h, seed, (n) => mix([base[0] * 0.7, base[1] * 0.7, base[2] * 0.72], base, n), 5, 4);
    const rng = makeRNG(seed + 21);
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      let x = rng() * w, y = 0;
      ctx.moveTo(x, y);
      while (y < h) { y += 20 + rng() * 30; x += (rng() - 0.5) * 26; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  });
}

// --------------------------------------------------------------- facades ---

/**
 * Office / apartment facade. `lit` is the fraction of windows with someone
 * still awake behind them, which is a quiet mood dial per district.
 */
export function facade(opts) {
  const o = Object.assign({
    seed: 20, wall: 0x3a3f4a, frame: 0x22252c, glass: 0x121820,
    lit: 0.35, litColors: [0xffd28a, 0xffe9c0, 0x9fd8ff],
    cols: 6, rows: 8, sill: false, balcony: false, key: 'fac',
  }, opts);
  return texture(o.key + o.seed + o.wall + o.lit + o.cols + o.rows, 256, (ctx, w, h) => {
    const rng = makeRNG(o.seed);
    const base = hexToRgb(o.wall);
    paintNoise(ctx, w, h, o.seed, (n) => mix([base[0] * 0.75, base[1] * 0.75, base[2] * 0.78], base, n), 4, 5);

    const cw = w / o.cols, ch = h / o.rows;
    const mx = cw * 0.22, my = ch * 0.22;
    for (let r = 0; r < o.rows; r++) {
      for (let c = 0; c < o.cols; c++) {
        const x = c * cw + mx, y = r * ch + my;
        const ww = cw - mx * 2, wh = ch - my * 2;
        ctx.fillStyle = rgbCss(hexToRgb(o.frame));
        ctx.fillRect(x - 2, y - 2, ww + 4, wh + 4);
        if (rng() < o.lit) {
          const lc = hexToRgb(o.litColors[Math.floor(rng() * o.litColors.length)]);
          const g = ctx.createLinearGradient(x, y, x, y + wh);
          g.addColorStop(0, rgbCss(lc));
          g.addColorStop(1, rgbCss([lc[0] * 0.55, lc[1] * 0.5, lc[2] * 0.4]));
          ctx.fillStyle = g;
          ctx.fillRect(x, y, ww, wh);
          // Silhouette of somebody in there.
          if (rng() < 0.3) {
            ctx.fillStyle = 'rgba(20,14,8,0.65)';
            const bw = ww * 0.22;
            ctx.fillRect(x + rng() * (ww - bw), y + wh * 0.35, bw, wh * 0.65);
          }
        } else {
          const g = ctx.createLinearGradient(x, y, x + ww, y + wh);
          const gc = hexToRgb(o.glass);
          g.addColorStop(0, rgbCss([gc[0] * 1.5 + 12, gc[1] * 1.5 + 14, gc[2] * 1.5 + 20]));
          g.addColorStop(0.5, rgbCss(gc));
          g.addColorStop(1, rgbCss([gc[0] * 0.6, gc[1] * 0.6, gc[2] * 0.7]));
          ctx.fillStyle = g;
          ctx.fillRect(x, y, ww, wh);
        }
        // Mullion.
        ctx.fillStyle = rgbCss(hexToRgb(o.frame));
        ctx.fillRect(x + ww / 2 - 1, y, 2, wh);
        if (o.sill) {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(x - 4, y + wh + 2, ww + 8, 3);
        }
        if (o.balcony && rng() < 0.5) {
          ctx.strokeStyle = 'rgba(20,20,20,0.7)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x - 3, y + wh * 0.45, ww + 6, wh * 0.55);
          // Laundry, satellite dishes, the stuff of actual lives.
          if (rng() < 0.5) {
            ctx.fillStyle = ['#c94f4f', '#4f8fc9', '#d9c25a', '#e0e0e0'][Math.floor(rng() * 4)];
            ctx.fillRect(x + rng() * ww * 0.6, y + wh * 0.5, 6, 10);
          }
        }
      }
    }
    // Storey bands.
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let r = 1; r < o.rows; r++) ctx.fillRect(0, r * ch - 1, w, 2);
  });
}

export function shackWall(seed = 30) {
  return texture('shack' + seed, 256, (ctx, w, h) => {
    const rng = makeRNG(seed);
    ctx.fillStyle = '#4a4038';
    ctx.fillRect(0, 0, w, h);
    // A shack is whatever sheet metal, board and tarp was available.
    const panels = ['#8a6a4a', '#6f7a6a', '#7a5a48', '#5f6b78', '#96794f', '#8f4f42'];
    let y = 0;
    while (y < h) {
      const ph = 24 + rng() * 40;
      let x = 0;
      while (x < w) {
        const pw = 34 + rng() * 60;
        const col = panels[Math.floor(rng() * panels.length)];
        ctx.fillStyle = col;
        ctx.fillRect(x, y, pw - 2, ph - 2);
        // Corrugation ribs.
        ctx.fillStyle = 'rgba(0,0,0,0.16)';
        for (let rx = x; rx < x + pw - 2; rx += 5) ctx.fillRect(rx, y, 2, ph - 2);
        // Rust and nail heads.
        if (rng() < 0.6) {
          ctx.fillStyle = 'rgba(120,52,20,0.35)';
          ctx.beginPath();
          ctx.ellipse(x + rng() * pw, y + rng() * ph, rng() * 14 + 3, rng() * 10 + 2, 0, 0, 7);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(30,26,22,0.7)';
        for (let n = 0; n < 4; n++) ctx.fillRect(x + 3 + rng() * (pw - 8), y + 3 + rng() * (ph - 8), 2, 2);
        x += pw;
      }
      y += ph;
    }
    ctx.fillStyle = 'rgba(20,16,12,0.25)';
    for (let i = 0; i < 400; i++) ctx.fillRect(rng() * w, rng() * h, 2, 2);
  });
}

export function glassCurtain(seed = 40, tintHex = 0x203040, lit = 0.2) {
  return texture('glasscurtain' + seed + tintHex + lit, 256, (ctx, w, h) => {
    const rng = makeRNG(seed);
    const g = ctx.createLinearGradient(0, 0, w, h);
    const t = hexToRgb(tintHex);
    g.addColorStop(0, rgbCss([t[0] * 1.9, t[1] * 1.9, t[2] * 2.0]));
    g.addColorStop(0.45, rgbCss(t));
    g.addColorStop(0.6, rgbCss([t[0] * 2.4, t[1] * 2.4, t[2] * 2.5]));
    g.addColorStop(1, rgbCss([t[0] * 0.7, t[1] * 0.7, t[2] * 0.8]));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const cols = 8, rows = 10;
    const cw = w / cols, ch = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rng() < lit) {
          ctx.fillStyle = 'rgba(255,214,150,' + (0.25 + rng() * 0.5) + ')';
          ctx.fillRect(c * cw + 2, r * ch + 2, cw - 4, ch - 4);
        }
      }
    }
    ctx.strokeStyle = 'rgba(10,14,20,0.85)';
    ctx.lineWidth = 2.5;
    for (let c = 0; c <= cols; c++) { ctx.beginPath(); ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, h); ctx.stroke(); }
    for (let r = 0; r <= rows; r++) { ctx.beginPath(); ctx.moveTo(0, r * ch); ctx.lineTo(w, r * ch); ctx.stroke(); }
  });
}

// -------------------------------------------------------------- billboards ---

/**
 * The advertising is the story. Each district's hoardings say the quiet part a
 * little louder than the last.
 */
export function billboard(spec) {
  const key = 'bb' + spec.headline + spec.bg;
  return texture(key, 512, (ctx, w, h) => {
    const rng = makeRNG(spec.seed || 1);
    const bg = hexToRgb(spec.bg);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, rgbCss(bg));
    g.addColorStop(1, rgbCss([bg[0] * 0.45, bg[1] * 0.45, bg[2] * 0.5]));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Halftone dots so it reads as print, not a flat rectangle.
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let y = 0; y < h; y += 8) {
      for (let x = 0; x < w; x += 8) {
        ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill();
      }
    }

    if (spec.face) drawAdFace(ctx, w, h, spec);

    const fg = spec.fg !== undefined ? spec.fg : 0xffffff;
    // Text column: beside the face if there is one, otherwise the full panel.
    const colX = spec.face ? w * 0.44 : w * 0.07;
    const colW = spec.face ? w * 0.52 : w * 0.86;
    ctx.textAlign = 'left';

    // Headline gets the top 46% of the panel and is shrunk to fit it, so a
    // long line of ad copy never runs off the hoarding.
    ctx.fillStyle = rgbCss(hexToRgb(fg));
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 12;
    const headBottom = fitText(ctx, spec.headline, colX, h * 0.14, colW, h * 0.44,
      spec.size || 56, 18, (px) => 'bold ' + px + 'px "Arial Black", Impact, sans-serif', 1.02);
    ctx.shadowBlur = 0;

    if (spec.sub) {
      ctx.fillStyle = 'rgba(255,255,255,0.84)';
      fitText(ctx, spec.sub, colX, Math.max(headBottom + 12, h * 0.6), colW, h * 0.22,
        spec.subSize || 27, 13, (px) => px + 'px Georgia, serif', 1.15);
    }

    if (spec.brand !== false) {
      ctx.textAlign = 'right';
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillText(spec.brandName || 'VANTA', w - 22, h - 24);
      ctx.font = '14px Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillText(spec.fine || 'terms apply in perpetuity', w - 22, h - 8);
    }

    // Weathering: the poor districts get torn posters, the rich get pristine.
    const wear = spec.wear !== undefined ? spec.wear : 0;
    if (wear > 0) {
      ctx.fillStyle = 'rgba(30,26,20,0.5)';
      for (let i = 0; i < 30 * wear; i++) {
        ctx.beginPath();
        ctx.ellipse(rng() * w, rng() * h, rng() * 18 + 2, rng() * 12 + 2, rng() * 3, 0, 7);
        ctx.fill();
      }
      // A torn corner.
      ctx.fillStyle = 'rgba(15,12,10,0.85)';
      ctx.beginPath();
      ctx.moveTo(w, 0); ctx.lineTo(w - 90 * wear, 0); ctx.lineTo(w, 70 * wear);
      ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, w, h);
  }, [1, 1], 256);
}

// A generic glamour portrait: the same rictus grin on every hoarding.
function drawAdFace(ctx, w, h, spec) {
  const cx = w * 0.21, cy = h * 0.5, r = h * 0.33;
  const skin = hexToRgb(spec.skin || 0xc98d5e);
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy + r * 0.1, r * 1.25, 0, 7); ctx.clip();
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.4);
  bg.addColorStop(0, 'rgba(255,255,255,0.28)');
  bg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Hair.
  ctx.fillStyle = rgbCss(hexToRgb(spec.hair || 0x1a1310));
  ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.34, r * 0.86, r * 0.78, 0, 0, 7); ctx.fill();
  // Head.
  ctx.fillStyle = rgbCss(skin);
  ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.68, r * 0.84, 0, 0, 7); ctx.fill();
  // Eyes - deliberately a little too wide.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(cx - r * 0.27, cy - r * 0.12, r * 0.17, r * 0.13, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + r * 0.27, cy - r * 0.12, r * 0.17, r * 0.13, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#1a1a22';
  ctx.beginPath(); ctx.arc(cx - r * 0.27, cy - r * 0.11, r * 0.075, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.27, cy - r * 0.11, r * 0.075, 0, 7); ctx.fill();
  // Smile.
  ctx.strokeStyle = 'rgba(90,40,40,0.9)';
  ctx.lineWidth = r * 0.06;
  ctx.beginPath(); ctx.arc(cx, cy + r * 0.18, r * 0.34, 0.18 * Math.PI, 0.82 * Math.PI); ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.36, r * 0.3, r * 0.1, 0, Math.PI, 0, true); ctx.fill();
  // Specular glint - the sheen of a very expensive retouch.
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.ellipse(cx - r * 0.3, cy - r * 0.45, r * 0.18, r * 0.1, -0.5, 0, 7); ctx.fill();
}

/**
 * Lay out text from `top` downwards, shrinking the font until it fits inside
 * maxW x maxH. Returns the y of the last baseline so the next block can sit
 * under it. Ad copy is written by a human and has to fit a fixed panel.
 */
function fitText(ctx, text, x, top, maxW, maxH, startPx, minPx, fontOf, leading) {
  let px = startPx;
  let lines = [];
  while (px >= minPx) {
    ctx.font = fontOf(px);
    lines = layoutLines(ctx, String(text), maxW);
    if (lines.length * px * leading <= maxH) break;
    px -= 2;
  }
  ctx.font = fontOf(px);
  const lh = px * leading;
  lines.forEach((l, i) => ctx.fillText(l, x, top + px * 0.86 + i * lh));
  return top + px * 0.86 + (lines.length - 1) * lh;
}

function layoutLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(' ');
  let line = '';
  const lines = [];
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
  return lines.length;
}

/** Small vertical neon sign for shopfronts. */
export function neonSign(text, colorHex, seed = 1) {
  return texture('neon' + text + colorHex, 128, (ctx, w, h) => {
    ctx.fillStyle = '#0b0b10';
    ctx.fillRect(0, 0, w, h);
    const col = rgbCss(hexToRgb(colorHex));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 34px Arial, sans-serif';
    ctx.shadowColor = col;
    ctx.shadowBlur = 26;
    ctx.fillStyle = col;
    const chars = text.split('');
    const step = h / (chars.length + 1);
    chars.forEach((c, i) => ctx.fillText(c, w / 2, step * (i + 1)));
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, w - 6, h - 6);
  }, [1, 1], 256);
}

/** Roadside poster - torn, defaced, human. */
export function poster(spec) {
  return texture('poster' + spec.text, 256, (ctx, w, h) => {
    const rng = makeRNG(spec.seed || 4);
    ctx.fillStyle = rgbCss(hexToRgb(spec.bg || 0xd8cfb8));
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = rgbCss(hexToRgb(spec.fg || 0x22201c));
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px Georgia, serif';
    wrapText(ctx, spec.text, w / 2, h * 0.42, w * 0.84, 34);
    if (spec.sub) {
      ctx.font = '18px Georgia, serif';
      ctx.fillStyle = 'rgba(40,36,30,0.75)';
      wrapText(ctx, spec.sub, w / 2, h * 0.74, w * 0.8, 22);
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = 'rgba(60,50,40,' + (rng() * 0.2) + ')';
      ctx.fillRect(rng() * w, rng() * h, rng() * 30, rng() * 6);
    }
  }, [1, 1], 320);
}

// ----------------------------------------------------------------- skies ---

export function skyTexture(topHex, midHex, botHex, key) {
  return texture('sky' + key, 32, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, rgbCss(hexToRgb(topHex)));
    g.addColorStop(0.55, rgbCss(hexToRgb(midHex)));
    g.addColorStop(1, rgbCss(hexToRgb(botHex)));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }, [1, 1], 256);
}

// ------------------------------------------------------------- portraits ---

/**
 * Dialogue portrait, drawn to a canvas the UI can show directly.
 * Faces are built from a few parameters so every character is distinct but
 * clearly from the same world.
 */
export function portrait(p, size = 96) {
  const c = canvas(size);
  const ctx = c.getContext('2d');
  const rng = makeRNG(p.seed || 1);
  const w = size, h = size;

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, rgbCss(hexToRgb(p.bg || 0x2a2f3a)));
  bg.addColorStop(1, rgbCss(hexToRgb(p.bg2 || 0x14171e)));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const skin = hexToRgb(p.skin || 0xa8703f);
  const cx = w / 2, cy = h * 0.55, r = h * 0.3;

  // Shoulders.
  ctx.fillStyle = rgbCss(hexToRgb(p.cloth || 0x3a4250));
  ctx.beginPath();
  ctx.ellipse(cx, h * 1.12, w * 0.48, h * 0.42, 0, 0, 7);
  ctx.fill();

  // Neck + head.
  ctx.fillStyle = rgbCss([skin[0] * 0.8, skin[1] * 0.8, skin[2] * 0.8]);
  ctx.fillRect(cx - r * 0.24, cy + r * 0.5, r * 0.48, r * 0.6);
  ctx.fillStyle = rgbCss(skin);
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.76, r, 0, 0, 7);
  ctx.fill();

  // Hair.
  const hair = rgbCss(hexToRgb(p.hair === undefined ? 0x14100c : p.hair));
  ctx.fillStyle = hair;
  if (p.hairStyle === 'bald') {
    // nothing
  } else if (p.hairStyle === 'slick') {
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.62, r * 0.78, r * 0.42, 0, Math.PI, 0);
    ctx.fill();
  } else if (p.hairStyle === 'long') {
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.25, r * 0.92, r * 1.02, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - r * 0.92, cy - r * 0.3, r * 0.3, r * 1.3);
    ctx.fillRect(cx + r * 0.62, cy - r * 0.3, r * 0.3, r * 1.3);
  } else {
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.5, r * 0.84, r * 0.6, 0, Math.PI, 0);
    ctx.fill();
  }

  // Eyes.
  const eyeY = cy - r * 0.1;
  ctx.fillStyle = '#f2f0ea';
  ctx.beginPath(); ctx.ellipse(cx - r * 0.3, eyeY, r * 0.17, r * (p.tired ? 0.08 : 0.13), 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + r * 0.3, eyeY, r * 0.17, r * (p.tired ? 0.08 : 0.13), 0, 0, 7); ctx.fill();
  ctx.fillStyle = rgbCss(hexToRgb(p.eyes || 0x241a12));
  ctx.beginPath(); ctx.arc(cx - r * 0.3, eyeY, r * 0.075, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.3, eyeY, r * 0.075, 0, 7); ctx.fill();

  // Brows carry most of the expression.
  ctx.strokeStyle = hair;
  ctx.lineWidth = r * 0.09;
  ctx.lineCap = 'round';
  const tilt = p.brow === undefined ? 0 : p.brow;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.46, eyeY - r * 0.28 + tilt * r * 0.12);
  ctx.lineTo(cx - r * 0.14, eyeY - r * 0.32 - tilt * r * 0.12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.14, eyeY - r * 0.32 - tilt * r * 0.12);
  ctx.lineTo(cx + r * 0.46, eyeY - r * 0.28 + tilt * r * 0.12);
  ctx.stroke();

  // Mouth: smile > 0 happy, < 0 grim.
  const smile = p.smile === undefined ? 0 : p.smile;
  ctx.strokeStyle = 'rgba(90,45,40,0.9)';
  ctx.lineWidth = r * 0.08;
  ctx.beginPath();
  const my = cy + r * 0.44;
  ctx.moveTo(cx - r * 0.26, my - smile * r * 0.12);
  ctx.quadraticCurveTo(cx, my + smile * r * 0.3, cx + r * 0.26, my - smile * r * 0.12);
  ctx.stroke();

  if (p.beard) {
    ctx.fillStyle = hair;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.5, r * 0.6, r * 0.42, 0, 0, Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (p.glasses) {
    ctx.strokeStyle = 'rgba(20,20,24,0.9)';
    ctx.lineWidth = r * 0.07;
    ctx.beginPath(); ctx.arc(cx - r * 0.3, eyeY, r * 0.24, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + r * 0.3, eyeY, r * 0.24, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - r * 0.06, eyeY); ctx.lineTo(cx + r * 0.06, eyeY); ctx.stroke();
  }
  if (p.shades) {
    ctx.fillStyle = 'rgba(12,12,16,0.94)';
    ctx.fillRect(cx - r * 0.56, eyeY - r * 0.2, r * 1.12, r * 0.36);
    ctx.fillStyle = 'rgba(120,180,255,0.22)';
    ctx.fillRect(cx - r * 0.5, eyeY - r * 0.16, r * 0.4, r * 0.12);
  }
  // Scanline sheen so the whole cast looks broadcast.
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);

  return c;
}

export { hexToRgb, rgbCss, mix, wrapText };
