// Nagesh City - boot, menus and the frame loop.

import { Game } from './game.js';
import { audio } from './audio.js';

const $ = (id) => document.getElementById(id);

let game = null;

async function boot() {
  const canvas = $('scene');
  const ui = { boot: $('boot'), menu: $('menu'), loading: $('loading') };

  // Audio must start from a real gesture, so the first click does double duty:
  // it wakes the AudioContext and it is the first thing that ever says "Nagesh".
  const begin = async () => {
    ui.boot.removeEventListener('click', begin);
    window.removeEventListener('keydown', beginKey);
    ui.boot.classList.add('leaving');

    $('load-text').textContent = 'Waking the city';
    ui.loading.classList.remove('hidden');

    await audio.init();
    audio.voice(1.0, { gain: 0.9 });

    await tick(60);
    $('load-bar').style.width = '25%';
    $('load-text').textContent = 'Printing hoardings';

    await tick(40);
    game = new Game(canvas);
    window.__nageshCity = game;

    $('load-bar').style.width = '70%';
    $('load-text').textContent = 'Pouring concrete';
    await tick(40);

    // Build the Flats up front so the first Start is instant.
    await game.getDistrict('slums');
    $('load-bar').style.width = '100%';
    $('load-text').textContent = 'Ready';
    await tick(220);

    ui.loading.classList.add('hidden');
    ui.boot.classList.add('hidden');
    ui.menu.classList.remove('hidden');
    wireMenus();
    requestAnimationFrame(loop);
  };
  const beginKey = () => begin();

  ui.boot.addEventListener('click', begin);
  window.addEventListener('keydown', beginKey);
}

function tick(ms) { return new Promise((r) => setTimeout(r, ms)); }

function wireMenus() {
  const hasSave = game.hasSave();
  const cont = $('btn-continue');
  if (!hasSave) cont.classList.add('disabled');

  $('btn-new').addEventListener('click', async () => {
    if (hasSave && !confirm('Start a new game? Your current progress in Nagesh City will be overwritten.')) return;
    hideAllPanels();
    await game.start(false);
  });

  cont.addEventListener('click', async () => {
    if (!game.hasSave()) return;
    hideAllPanels();
    await game.start(true);
  });

  $('btn-controls').addEventListener('click', () => togglePanel('controls'));
  $('btn-credits').addEventListener('click', () => togglePanel('credits'));
  for (const b of document.querySelectorAll('.panel-close')) {
    b.addEventListener('click', () => hideAllPanels());
  }

  // Pause menu.
  $('btn-resume').addEventListener('click', () => game.setPaused(false));
  $('btn-pause-map').addEventListener('click', () => { game.setPaused(false); game.toggleMap(); });
  $('btn-pause-controls').addEventListener('click', () => togglePanel('controls'));
  $('btn-quit').addEventListener('click', () => {
    game.save();
    game.setPaused(false);
    game.running = false;
    audio.stopTrack();
    audio.stopEngine();
    $('hud').classList.add('hidden');
    $('menu').classList.remove('hidden');
    $('btn-continue').classList.remove('disabled');
  });

  // Volume.
  const master = $('vol-master'), music = $('vol-music');
  master.addEventListener('input', () => audio.setMasterVolume(Number(master.value) / 100));
  music.addEventListener('input', () => audio.setMusicVolume(Number(music.value) / 100));

  // Clicking the dialogue box advances it, which is what everyone tries first.
  $('dialogue').addEventListener('click', () => game.ui.advanceDialogue());
}

function togglePanel(id) {
  const el = $(id);
  const wasHidden = el.classList.contains('hidden');
  hideAllPanels();
  if (wasHidden) el.classList.remove('hidden');
}

function hideAllPanels() {
  $('controls').classList.add('hidden');
  $('credits').classList.add('hidden');
}

function loop() {
  requestAnimationFrame(loop);
  if (game) game.frame();
}

boot();
