// Nagesh City - HUD, menus, dialogue and the endings.
//
// Every button in this file plays Nagesh's one recorded word at a random pitch
// on hover and on click. That is not a gag bolted on at the end; it is the
// interface language of the whole game.

import { audio, VOICE } from './audio.js';
import { CHARACTERS } from './story.js';
import { portrait } from './art.js';
import { clamp, formatTime, formatMoney } from './util.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor() {
    this.el = {
      boot: $('boot'), menu: $('menu'), hud: $('hud'), pause: $('pause'),
      objective: $('objective'), objTitle: $('obj-title'), objText: $('obj-text'),
      objCount: $('obj-count'), hint: $('hint'),
      cash: $('cash'), fame: $('fame'), district: $('district-name'),
      healthFill: $('health-fill'), bodyFill: $('body-fill'), bodyWrap: $('body-wrap'),
      armourFill: $('armour-fill'), armourWrap: $('armour-wrap'),
      weapon: $('weapon'), wpnName: $('wpn-name'), wpnAmmo: $('wpn-ammo'), wpnHint: $('wpn-hint'),
      crosshair: $('crosshair'), killfeed: $('killfeed'), boom: $('boom'),
      shop: $('shop'), shopName: $('shop-name'), shopBlurb: $('shop-blurb'),
      shopList: $('shop-list'), shopCash: $('shop-cash'), shopLine: $('shop-line'),
      speedo: $('speedo'), speedVal: $('speed-val'), speedName: $('speed-name'),
      timer: $('timer'), progress: $('progress'), progFill: $('prog-fill'), progLabel: $('prog-label'),
      toast: $('toast'), interact: $('interact'), whistle: $('whistle-prompt'),
      dialogue: $('dialogue'), dlgPortrait: $('dlg-portrait'), dlgName: $('dlg-name'),
      dlgText: $('dlg-text'), dlgCue: $('dlg-cue'), dlgNext: $('dlg-next'),
      banner: $('banner'), bannerTitle: $('banner-title'), bannerSub: $('banner-sub'),
      titlecard: $('titlecard'), tcLabel: $('tc-label'), tcTitle: $('tc-title'), tcBrief: $('tc-brief'),
      chapter: $('chapter'), chNum: $('ch-num'), chName: $('ch-name'), chLine: $('ch-line'),
      fullmap: $('fullmap'), nav: $('nav'), flash: $('flash'), vignette: $('vignette'),
      choice: $('choice'), choiceList: $('choice-list'), choiceLabel: $('choice-label'),
      ending: $('ending'), endTitle: $('end-title'), endBody: $('end-body'), endEpi: $('end-epi'),
      controls: $('controls'), credits: $('credits'),
      fade: $('fade'), loading: $('loading'), loadBar: $('load-bar'), loadText: $('load-text'),
    };
    this.navCtx = this.el.nav.getContext('2d');
    this.dialogueActive = false;
    this._queue = null;
    this._onDone = null;
    this._typing = null;
    this._toastTimer = 0;
    this.portraitCache = new Map();

    this.wireButtons();
  }

  /**
   * Every .btn in the document speaks on hover and on click. Delegated, so
   * buttons created later are covered without re-wiring.
   */
  wireButtons() {
    const isBtn = (e) => e.target.closest && e.target.closest('.btn');
    document.addEventListener('pointerover', (e) => {
      const b = isBtn(e);
      if (!b || b.dataset.hovered === '1' || b.classList.contains('disabled')) return;
      b.dataset.hovered = '1';
      audio.voiceRandom(0.7, 1.75, 0.4);
    });
    document.addEventListener('pointerout', (e) => {
      const b = isBtn(e);
      if (b) b.dataset.hovered = '0';
    });
    document.addEventListener('pointerdown', (e) => {
      const b = isBtn(e);
      if (!b || b.classList.contains('disabled')) return;
      // A different pitch from the hover, so click reads as confirmation.
      audio.voiceRandom(0.55, 2.0, 0.65);
      audio.ui();
    });
  }

  // ------------------------------------------------------------- screens ---

  show(el) { el.classList.remove('hidden'); }
  hide(el) { el.classList.add('hidden'); }

  setLoading(frac, text) {
    this.el.loadBar.style.width = Math.round(frac * 100) + '%';
    if (text) this.el.loadText.textContent = text;
  }

  fadeTo(opacity, ms = 500) {
    return new Promise((resolve) => {
      this.el.fade.style.transition = 'opacity ' + ms + 'ms ease';
      this.el.fade.style.opacity = String(opacity);
      this.el.fade.style.pointerEvents = opacity > 0.01 ? 'auto' : 'none';
      setTimeout(resolve, ms);
    });
  }

  // ------------------------------------------------------------- dialogue ---

  getPortrait(who) {
    if (this.portraitCache.has(who)) return this.portraitCache.get(who);
    const c = CHARACTERS[who];
    const canvas = portrait(c ? c.portrait : { seed: 0 }, 128);
    this.portraitCache.set(who, canvas);
    return canvas;
  }

  /**
   * Play a list of lines. Nagesh's are the sample at a pitch; everyone else is
   * typed out with a blip per character in their own voice.
   */
  playDialogue(lines, onDone) {
    if (!lines || !lines.length) { if (onDone) onDone(); return; }
    this._queue = lines.slice();
    this._onDone = onDone;
    this.dialogueActive = true;
    this.show(this.el.dialogue);
    audio.duckMusic(0.45, 1.5);
    this.nextLine();
  }

  nextLine() {
    if (this._typing) { this.finishTyping(); return; }
    if (!this._queue || !this._queue.length) return this.endDialogue();
    const line = this._queue.shift();
    const chr = CHARACTERS[line.who] || CHARACTERS.crowd;

    const p = this.getPortrait(line.who);
    this.el.dlgPortrait.innerHTML = '';
    this.el.dlgPortrait.appendChild(p);
    this.el.dlgName.textContent = chr.name;
    this.el.dlgCue.textContent = line.cue ? '(' + line.cue + ')' : '';
    this.el.dlgNext.style.opacity = '0';

    if (line.who === 'nagesh') {
      // He says his name. The pitch is the performance.
      this.el.dlgText.textContent = '';
      this.el.dlgText.classList.add('nagesh-line');
      audio.voice(line.pitch !== undefined ? line.pitch : 1.0, { gain: 1.0, throttle: 0 });
      this.typeOut(line.text, null, 42);
    } else {
      this.el.dlgText.classList.remove('nagesh-line');
      audio.duckMusic(0.5, 2.2);
      this.typeOut(line.text, chr.voice, 17);
    }
  }

  typeOut(text, voice, speed) {
    const el = this.el.dlgText;
    el.textContent = '';
    let i = 0;
    const step = () => {
      if (i >= text.length) {
        this._typing = null;
        this.el.dlgNext.style.opacity = '1';
        return;
      }
      const ch = text[i];
      el.textContent += ch;
      // Blip on letters only; punctuation gets a pause instead of a noise.
      if (voice && /[a-zA-Z0-9]/.test(ch) && i % 2 === 0) audio.blip(voice, ch.charCodeAt(0));
      i++;
      let delay = speed;
      if (ch === ',') delay = speed + 130;
      if (ch === '.' || ch === '?' || ch === '!') delay = speed + 240;
      if (ch === '-') delay = speed + 90;
      this._typing = setTimeout(step, delay);
    };
    this._typing = setTimeout(step, 90);
    this._typingText = text;
  }

  finishTyping() {
    clearTimeout(this._typing);
    this._typing = null;
    this.el.dlgText.textContent = this._typingText;
    this.el.dlgNext.style.opacity = '1';
  }

  advanceDialogue() {
    if (!this.dialogueActive) return false;
    this.nextLine();
    return true;
  }

  endDialogue() {
    this.dialogueActive = false;
    this.hide(this.el.dialogue);
    clearTimeout(this._typing);
    this._typing = null;
    const cb = this._onDone;
    this._onDone = null;
    this._queue = null;
    if (cb) cb();
  }

  // ------------------------------------------------------------------ hud ---

  setObjective(title, text, remaining) {
    this.el.objTitle.textContent = title || '';
    this.el.objText.textContent = text || '';
    this.el.objCount.textContent = remaining ? remaining + ' left in this district' : '';
    this.el.objective.classList.toggle('hidden', !text);
  }

  setHint(text) {
    this.el.hint.textContent = text || '';
    this.el.hint.classList.toggle('hidden', !text);
  }

  setInteract(text) {
    this.el.interact.innerHTML = text ? '<kbd>E</kbd> ' + text : '';
    this.el.interact.classList.toggle('hidden', !text);
  }

  setWhistle(on) {
    this.el.whistle.classList.toggle('hidden', !on);
  }

  /** Fade the read-outs out while somebody is talking, so the shot is clean. */
  setCinematic(on) {
    if (this._cinematic === on) return;
    this._cinematic = on;
    this.el.hud.classList.toggle('cinematic', on);
  }

  setStats(s) {
    this.el.cash.textContent = formatMoney(s.cash);
    this.el.fame.textContent = String(Math.max(0, Math.round(s.fame)));
    this.el.district.textContent = s.district;
    this.el.healthFill.style.width = clamp(s.health, 0, 100) + '%';
    this.el.healthFill.style.background = s.health > 55 ? '#6dff8a' : s.health > 25 ? '#ffd23f' : '#ff4a4a';
    // The armour bar only exists while there is armour on it.
    const hasArmour = (s.armour || 0) > 0.5;
    this.el.armourWrap.classList.toggle('hidden', !hasArmour);
    if (hasArmour) this.el.armourFill.style.width = clamp(s.armour, 0, 100) + '%';
  }

  /**
   * The weapon read-out. Fists get a name and nothing else, which is the
   * cheapest possible way of saying "you have nothing".
   */
  setWeapon(w) {
    // Before Gurjaap there is exactly one thing in your hands and no reason to
    // put a box on screen about it.
    if (w.melee && w.count <= 1) { this.el.weapon.classList.add('hidden'); return; }
    this.el.weapon.classList.remove('hidden');
    this.el.wpnName.textContent = w.name;
    if (w.melee) {
      this.el.wpnAmmo.textContent = '--';
      this.el.wpnAmmo.classList.remove('dry');
      this.el.wpnHint.textContent = 'Q to switch';
      return;
    }
    this.el.wpnAmmo.textContent = w.mag + ' / ' + w.reserve;
    this.el.wpnAmmo.classList.toggle('dry', w.mag === 0);
    this.el.wpnHint.textContent = w.reloading ? 'RELOADING'
      : w.mag === 0 ? (w.reserve > 0 ? 'R to reload' : 'Out of ammunition')
        : 'Q to switch  ·  R to reload';
  }

  setCrosshair(aim, hit, spreadPx) {
    const el = this.el.crosshair;
    const show = aim > 0.02 || hit > 0.02;
    el.classList.toggle('hidden', !show);
    if (!show) return;
    el.style.setProperty('--gap', Math.round(clamp(spreadPx, 5, 46)) + 'px');
    el.style.opacity = String(clamp(0.35 + aim * 0.65, 0, 1));
    el.classList.toggle('hit', hit > 0.05);
  }

  /** A running list of what stopped moving, newest at the bottom. */
  killFeed(text) {
    const row = document.createElement('div');
    row.className = 'kf-row';
    row.textContent = text;
    this.el.killfeed.appendChild(row);
    while (this.el.killfeed.children.length > 4) this.el.killfeed.removeChild(this.el.killfeed.firstChild);
    setTimeout(() => { if (row.parentNode) row.parentNode.removeChild(row); }, 4200);
  }

  /** A dull orange thump across the whole screen, unlike the camera's white. */
  flashBoom() {
    const el = this.el.boom;
    el.classList.remove('hidden', 'go');
    void el.offsetWidth;
    el.classList.add('go');
    clearTimeout(this._boomTimer);
    this._boomTimer = setTimeout(() => el.classList.add('hidden'), 600);
  }

  // ---------------------------------------------------------------- shops ---

  /**
   * The counter. Rebuilt on every purchase rather than patched, because the
   * rows change shape when you buy something - a gun you now own becomes the
   * ammunition for it.
   */
  showShop(shop, items, cash, onBuy, onClose) {
    const chr = CHARACTERS[shop.def.keeper];
    this.el.shopName.textContent = shop.def.name;
    this.el.shopBlurb.textContent = shop.def.blurb;
    this.el.shopCash.textContent = formatMoney(cash);
    if (!this._shopLine || this._shopFor !== shop.id) {
      this._shopFor = shop.id;
      this._shopLine = shop.def.lines[Math.floor(Math.random() * shop.def.lines.length)];
    }
    this.el.shopLine.textContent = '"' + this._shopLine + '"  - ' + (chr ? chr.name : '');

    this.el.shopList.innerHTML = '';
    for (const item of items) {
      const b = document.createElement('button');
      const broke = cash < item.price;
      b.className = 'btn shop-row' + (broke || item.full ? ' disabled' : '');
      b.innerHTML =
        '<span class="si-name">' + item.name + '</span>' +
        '<span class="si-desc">' + item.desc + '</span>' +
        '<span class="si-price' + (broke ? ' broke' : '') + '">' +
        (item.full ? 'HELD' : formatMoney(item.price)) + '</span>';
      if (!broke && !item.full) b.addEventListener('click', () => onBuy(item));
      this.el.shopList.appendChild(b);
    }

    const close = document.createElement('button');
    close.className = 'btn shop-close';
    close.textContent = 'LEAVE THE COUNTER';
    close.addEventListener('click', () => onClose());
    this.el.shopList.appendChild(close);

    this.show(this.el.shop);
  }

  hideShop() { this.hide(this.el.shop); this._shopLine = null; }

  setVehicle(v) {
    if (!v) { this.el.speedo.classList.add('hidden'); this.el.bodyWrap.classList.add('hidden'); return; }
    this.el.speedo.classList.remove('hidden');
    this.el.bodyWrap.classList.remove('hidden');
    this.el.speedVal.textContent = String(Math.round(v.speedKph));
    this.el.speedName.textContent = v.spec.name;
    this.el.bodyFill.style.width = clamp(v.body, 0, 100) + '%';
  }

  setTimer(sec) {
    if (sec === null) { this.el.timer.classList.add('hidden'); return; }
    this.el.timer.classList.remove('hidden');
    this.el.timer.textContent = formatTime(sec);
    this.el.timer.classList.toggle('urgent', sec < 15);
  }

  setProgress(p) {
    if (!p) { this.el.progress.classList.add('hidden'); return; }
    this.el.progress.classList.remove('hidden');
    this.el.progLabel.textContent = p.label;
    this.el.progFill.style.width = clamp(p.value * 100, 0, 100) + '%';
  }

  /**
   * Long lines need longer on screen than "+400" does, so the dwell time
   * scales with how much there is to read.
   * @param kind 'speech' for overheard dialogue, otherwise a plain notice
   */
  toast(text, kind, ms) {
    const dwell = ms || clamp(1500 + text.length * 62, 2400, 8000);
    this.el.toast.textContent = text;
    this.el.toast.className = kind === 'speech' ? 'speech' : '';
    this.el.toast.classList.remove('hidden');
    void this.el.toast.offsetWidth;
    this.el.toast.classList.add('pop');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.el.toast.classList.add('hidden'), dwell);
  }

  flashBanner(title, sub, kind) {
    this.el.bannerTitle.textContent = title;
    this.el.bannerSub.textContent = sub || '';
    this.el.banner.className = 'banner ' + (kind || '');
    this.el.banner.classList.remove('hidden');
    void this.el.banner.offsetWidth;
    this.el.banner.classList.add('show');
    clearTimeout(this._bannerTimer);
    this._bannerTimer = setTimeout(() => {
      this.el.banner.classList.remove('show');
      setTimeout(() => this.el.banner.classList.add('hidden'), 500);
    }, 2600);
  }

  showTitleCard(title, brief) {
    this.el.tcLabel.textContent = 'NEW MISSION';
    this.el.tcTitle.textContent = title;
    this.el.tcBrief.textContent = brief || '';
    this.el.titlecard.classList.remove('hidden');
    void this.el.titlecard.offsetWidth;
    this.el.titlecard.classList.add('show');
    clearTimeout(this._tcTimer);
    this._tcTimer = setTimeout(() => {
      this.el.titlecard.classList.remove('show');
      setTimeout(() => this.el.titlecard.classList.add('hidden'), 600);
    }, 6200);
  }

  showChapter(ch, onDone) {
    this.el.chNum.textContent = ch.num;
    this.el.chName.textContent = ch.name;
    this.el.chLine.textContent = ch.line;
    this.el.chapter.classList.remove('hidden');
    void this.el.chapter.offsetWidth;
    this.el.chapter.classList.add('show');
    audio.voice(VOICE.unlock, { gain: 0.85 });
    setTimeout(() => {
      this.el.chapter.classList.remove('show');
      setTimeout(() => { this.el.chapter.classList.add('hidden'); if (onDone) onDone(); }, 900);
    }, 3800);
  }

  flashCamera() {
    this.el.flash.classList.remove('hidden');
    this.el.flash.classList.remove('go');
    void this.el.flash.offsetWidth;
    this.el.flash.classList.add('go');
    setTimeout(() => this.el.flash.classList.add('hidden'), 420);
  }

  setDamage(v) {
    this.el.vignette.style.opacity = String(clamp(v, 0, 1) * 0.85);
  }

  // ------------------------------------------------------------- choices ---

  showChoice(options, onPick) {
    this.el.choiceList.innerHTML = '';
    for (const o of options) {
      const b = document.createElement('button');
      b.className = 'btn choice-btn';
      b.innerHTML = '<span class="ct">' + o.text + '</span><span class="ch">' + (o.hint || '') + '</span>';
      b.addEventListener('click', () => {
        this.hide(this.el.choice);
        onPick(o.id);
      });
      this.el.choiceList.appendChild(b);
    }
    this.show(this.el.choice);
  }

  /** The endings are typed out one paragraph at a time, with Nagesh punctuating. */
  showEnding(ending, onDone) {
    this.el.endTitle.textContent = ending.title;
    this.el.endBody.innerHTML = '';
    this.el.endEpi.textContent = '';
    this.show(this.el.ending);
    let i = 0;
    const step = () => {
      if (i >= ending.lines.length) {
        this.el.endEpi.textContent = ending.epilogue;
        audio.voiceChord(ending.voice, 0.5);
        setTimeout(() => { if (onDone) onDone(); }, 2600);
        return;
      }
      const p = document.createElement('p');
      p.textContent = ending.lines[i];
      p.style.animationDelay = '0s';
      this.el.endBody.appendChild(p);
      audio.voice(ending.voice[i % ending.voice.length] * (0.92 + Math.random() * 0.16), { gain: 0.4 });
      i++;
      setTimeout(step, 3200);
    };
    setTimeout(step, 900);
  }

  // --------------------------------------------------- off-screen markers ---

  resizeNav() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.el.nav.width = Math.round(window.innerWidth * dpr);
    this.el.nav.height = Math.round(window.innerHeight * dpr);
  }

  /**
   * Draw an arrow at the screen edge for any waypoint that is off-camera, and
   * a distance chip for the ones that are on it. Between this, the light
   * column in the world and the minimap, a waypoint is very hard to lose.
   */
  drawNav(waypoints, camera, playerPos, THREE) {
    const ctx = this.navCtx;
    const W = this.el.nav.width, H = this.el.nav.height;
    ctx.clearRect(0, 0, W, H);
    if (!waypoints.length) return;

    const dpr = W / window.innerWidth;
    const margin = 46 * dpr;

    // A collect mission can have eight live markers. Ringing the screen with
    // eight arrows helps nobody, so only the nearest few get one.
    const sorted = waypoints
      .map((w) => ({ w, d: Math.hypot(w.x - playerPos.x, w.z - playerPos.z) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
      .map((e) => e.w);

    for (const w of sorted) {
      const col = '#' + w.color.toString(16).padStart(6, '0');
      const v = new THREE.Vector3(w.x, 2.5, w.z).project(camera);
      const dist = Math.hypot(w.x - playerPos.x, w.z - playerPos.z);
      const onScreen = v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1;

      let sx = (v.x * 0.5 + 0.5) * W;
      let sy = (-v.y * 0.5 + 0.5) * H;

      if (onScreen) {
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 16 * dpr);
        ctx.lineTo(sx + 11 * dpr, sy - 34 * dpr);
        ctx.lineTo(sx - 11 * dpr, sy - 34 * dpr);
        ctx.closePath();
        ctx.fill();
        ctx.font = 'bold ' + Math.round(13 * dpr) + 'px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.75)';
        ctx.lineWidth = 4 * dpr;
        ctx.strokeText(Math.round(dist) + ' m', sx, sy - 42 * dpr);
        ctx.fillText(Math.round(dist) + ' m', sx, sy - 42 * dpr);
        ctx.restore();
        continue;
      }

      // Behind the camera: mirror it so the arrow points the right way round.
      if (v.z > 1) { sx = W - sx; sy = H - sy; }
      const cx = W / 2, cy = H / 2;
      let dx = sx - cx, dy = sy - cy;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const rx = (W / 2 - margin), ry = (H / 2 - margin);
      const t = Math.min(rx / Math.abs(dx || 1e-6), ry / Math.abs(dy || 1e-6));
      let ax = cx + dx * t, ay = cy + dy * t;

      // The bottom-left corner belongs to the minimap and the mission card.
      // Slide an arrow that lands there out to the nearest free edge.
      const keepW = 262 * dpr, keepH = 300 * dpr;
      if (ax < keepW && ay > H - keepH) {
        if (H - ay < ax) ay = H - keepH; else ax = keepW;
      }

      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(Math.atan2(dy, dx) + Math.PI / 2);
      ctx.fillStyle = col;
      ctx.strokeStyle = 'rgba(8,10,14,0.8)';
      ctx.lineWidth = 3 * dpr;
      ctx.beginPath();
      ctx.moveTo(0, -15 * dpr);
      ctx.lineTo(11 * dpr, 11 * dpr);
      ctx.lineTo(0, 5 * dpr);
      ctx.lineTo(-11 * dpr, 11 * dpr);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.font = 'bold ' + Math.round(12 * dpr) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.lineWidth = 4 * dpr;
      const ty = ay + (dy > 0 ? 30 * dpr : -22 * dpr);
      ctx.strokeText(Math.round(dist) + ' m', ax, ty);
      ctx.fillText(Math.round(dist) + ' m', ax, ty);
      ctx.restore();
    }
  }
}
