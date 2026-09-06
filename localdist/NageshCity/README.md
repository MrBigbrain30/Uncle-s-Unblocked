# Nagesh City

A 3D open-world browser game about climbing out of the slums and finding out
what the top of the city is actually for.

Nagesh has exactly one recorded voice line — his own name. Everything he ever
expresses is that one sample played back at a different pitch: `0.46×` when he
dies, `2.05×` when he wins, and a fresh random pitch every time you so much as
hover a menu button.

## Running it

```
node serve.mjs
```

Then open <http://localhost:8080>. Any static file server works; it must be
served over HTTP rather than opened as a `file://` URL, because the game is
built from ES modules and fetches the voice sample.

There is no build step, no bundler, and no network access required at runtime —
three.js is vendored into `vendor/`.

## Controls

| Key | Action |
| --- | --- |
| `W` `A` `S` `D` | Move / drive |
| Mouse | Look (click the world once to capture the pointer) |
| `Shift` | Sprint |
| `Space` | Jump · handbrake in a vehicle |
| `F` | Enter / exit a vehicle |
| `E` | Interact · advance dialogue |
| `H` | Whistle for your vehicle (after the second slum mission) |
| `M` | Full district map |
| `Esc` | Pause |
| Wheel | Zoom the camera |

## The city

Four districts, each a walled block of city with its own palette, music,
traffic, pedestrians and advertising. Only one is ever in the scene graph at a
time, which is both why it runs fast and why Nagesh cannot simply walk out of
the slums.

| District | | Gate opens when |
| --- | --- | --- |
| **Kaduva Flats** | The slums. Dust, corrugated iron, a dry standpipe. | 5 missions done |
| **Ravi Cross** | Midtown. Neon, debt, cameras. | 5 missions done |
| **Aurum Heights** | The rich suburbs. Every lawn cut, nobody happy. | 5 missions done |
| **Sub-Level 9** | The VANTA archive. No sky. | — |

The north gate of each district is physically sealed until every mission in
that district is finished. The map tells you how many are left. It opens one
way, which turns out to matter.

17 missions across nine objective types: collect, deliver, timed multi-drop,
checkpoint rings, photo poses, drone survival, vehicle tailing, escorts, and a
final choice with two endings.

## Finding your way

Three redundant systems, because getting lost is not the interesting part:

- a **light column** in the world you can see over rooftops,
- a **rotating minimap** in the bottom-left corner (and `M` for the full
  district map with every landmark named),
- **screen-edge arrows** with live distances for the nearest markers.

When an objective needs a vehicle and you are on foot, a green marker points at
the car instead of the destination. Arrows keep clear of the minimap corner, and
the HUD fades out while anyone is talking.

## Driving

Arcade physics: grip that lets go under the handbrake, weight that transfers,
and walls that cost you speed rather than ending the run. Movement is substepped
so nothing tunnels through a wall at full throttle.

Street lights are real objects. Hit one above ~20 km/h and it topples in the
direction you were going, its collider drops out in the same frame so you keep
going through it, and its lamp goes dark. They are drawn as two InstancedMeshes
per district - about 140 posts for two draw calls - which is what makes it cheap
enough to animate any one of them individually.

## Sound

Everything is Web Audio; there is one audio file in the project.

- **Nagesh** — `assets/nagesh.wav`, trimmed and normalised from the supplied
  recording, played through a `BufferSource` at a `playbackRate` chosen per
  event. Low rates get a lowpass so they read as a groan; high rates get a
  high-shelf cut so they stay bright rather than piercing. Gain is
  pitch-compensated so every register sits at the same level.
- **Everyone else** — one oscillator blip per character typed, with waveform,
  base pitch, spread and filter per speaker, so Deepa and Auditor Vashti are
  distinguishable before you read the name tag.
- **Music** — a step sequencer, one track per district. The Flats are modal and
  hungry; Ravi Cross drives; Aurum Heights is major, lush, and detuned fourteen
  cents flat; Sub-Level 9 has no key at all.
- **Engines** — a filtered oscillator pair whose frequency tracks your speed.

## Art

Every surface is drawn at runtime onto a 2D canvas and uploaded as a texture.
There are no image files. `src/art.js` generates the asphalt, dirt, grass,
marble, brick, corrugated shack panelling, office facades with lit windows and
silhouettes in them, glass curtain walls, neon signs, torn posters, the
character portraits for dialogue, and every VANTA hoarding — including the ad
copy layout, which auto-fits so a long headline never runs off the panel.

Characters and vehicles are built from primitives in `src/actors.js`.

## Performance

- Every static thing in a district is merged into a handful of meshes by
  material, so ~200 buildings and ~600 props cost about 30 draw calls.
- Collision runs against a uniform spatial hash, so it is O(1) regardless of
  district size.
- Only the current district is in the scene graph.
- One shadow-casting directional light with a 1536² map on a tight ortho box
  that follows the player.
- Pixel ratio capped at 1.75; crowd characters use a reduced rig.

Measured in-browser: ~40 draw calls standing still in the Flats, ~200 with
traffic, pedestrians and mission props on screen, ~63k triangles.

## Layout

```
index.html          markup for every screen and HUD element
css/style.css       interface
serve.mjs           static file server
assets/nagesh.wav   the voice line
vendor/             three.js r169
src/
  main.js           boot, menus, frame loop
  game.js           renderer, districts, traffic, save file
  world.js          district definitions and generation
  art.js            every texture and portrait
  actors.js         characters, vehicles, drones, pickups
  vehicles.js       arcade vehicle physics
  player.js         input, player controller, chase camera
  missions.js       mission runner and objective types
  story.js          cast, dialogue, mission script, endings
  ui.js             HUD, dialogue, menus, endings
  minimap.js        corner minimap and full map
  util.js           RNG, geometry merging, spatial hash
```

## Save data

Progress is stored in `localStorage` under `nagesh-city-save-v1`. **New Game**
overwrites it; the pause menu saves and quits.
