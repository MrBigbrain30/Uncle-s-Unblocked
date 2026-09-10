# Nagesh City

A 3D open-world browser game about climbing out of the slums, being handed a
gun by a man who used to collect debts for the people at the top, and finding
out what the top of the city is actually for.

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
| Right mouse | Aim — hold |
| Left mouse | Fire — works from the driver's seat too |
| `R` | Reload |
| `Q` · `1`–`6` | Next weapon · pick one |
| `Shift` | Sprint |
| `Space` | Jump · handbrake in a vehicle |
| `F` | Enter / exit a vehicle (an empty one — traffic has drivers in it) |
| `E` | Interact · buy at a counter · advance dialogue |
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
| **Kaduva Flats** | The slums. Dust, corrugated iron, a dry standpipe. | 6 missions done |
| **Ravi Cross** | Midtown. Neon, debt, cameras. | 6 missions done |
| **Aurum Heights** | The rich suburbs. Every lawn cut, nobody happy. | 6 missions done |
| **Sub-Level 9** | The VANTA archive. No sky. | — |

The north gate of each district is physically sealed until every mission in
that district is finished. The map tells you how many are left. It opens one
way, which turns out to matter.

21 missions across fifteen objective types: collect, deliver, timed multi-drop,
checkpoint rings, photo poses, drone survival, drone hunts, vehicle tailing,
escorts, target shooting, firefights, holding ground, burning a specific
vehicle, a boss, and a final choice with two endings.

## The people

**Deepa** runs the scrapyard and pays cash. **Bittu** has ideas. **Mr. Chandran**
signs you up. **"Fixer" Salim** books the jobs. **Auditor Vashti** reads out the
arithmetic. **Priya Vale** has been famous for six years and would like to
discuss refrigerators.

**Gurjaap** collected for VANTA for eleven years and stopped on the Tuesday the
address on the sheet turned out to be his mother's. He runs a yard on the east
side of the Flats, hands you a .32 and a berm to shoot at, and sells rounds,
plates and patching-up for cash — nothing he sells you is ever added to
anything.

**Hishaan** came out of the Flats four streets from the standpipe and now runs
Retrieval for the region. He is what the contract looks like when somebody
decides to be on the winning end of it. He is polite about it, which is worse.

## Guns

Hitscan. A ray leaves the camera, stops at the first wall, and whatever sphere
it passed through on the way takes the damage; the tracer is drawn from the
muzzle to that point, which is a small lie that makes third-person shooting
land where you looked. Head shots are worth about two and a half times a body
shot.

Six things to hold: bare hands, a length of rebar, the Kaduva .32, the Ravi
Cross Spitter, the Standpipe 12-Bore and a VANTA Retrieval Rifle. Aiming pulls
the camera over the shoulder, cuts your spread to under half and pins your body
to the crosshair so you strafe rather than turn. Hip fire scatters, and from a
moving car it scatters twice as much again.

Enemies close to whatever range their weapon likes, strafe while they do it,
burst-fire the automatics, and lose you behind cover — line of sight is an
exact ray against the same collision grid your feet use, re-checked at the
instant the trigger goes, so you really can break contact by putting a shack
between you. They drop cash and sometimes ammunition,
and cash picked up off the floor is the only money in this game that is not also
added to what you owe.

Rounds that miss you go into whatever was behind you, which is usually parked
traffic, which eventually catches fire. Standing behind a car is cover for
about as long as the car lasts.

Nagesh patches himself up at 8 health a second once he has not been hit for
five and a half seconds. Armour does not come back on its own. Standing still
in the open in front of one Retrieval rifle kills you in about nine seconds;
shooting back kills them in four rounds.

You can also just run them over.

## Vehicles

Arcade physics: grip that lets go under the handbrake, weight that transfers,
and walls that cost you speed rather than ending the run. Movement is substepped
so nothing tunnels through a wall at full throttle.

Six AI drivers per district work their way around the road network on real
physics — they collide with you, queue behind you, lean on the horn, take
gunfire and catch fire. There is somebody visible behind each wheel, and that
person is also what makes the car theirs: you cannot get into an occupied
vehicle, and whistling never fetches one.

The route is a lane, not a list of points: an axis to travel along, a road to
travel on, and a direction. At each junction a driver picks straight on, left,
or right — never a U-turn — and holds the left-hand side of the road, so
oncoming traffic passes rather than meets. Measured over two minutes, one car
covers about 1.4 km across twenty-five distinct legs and ends up a metre from
its lane centre.

Every vehicle has panels. When the panels run out it catches fire and starts a
fuse — a little longer if somebody is sitting in it, because the fuse is a
chance to get out rather than a punishment for having been in the wrong seat.
Then it goes off, hurts everything within about eleven metres, and stays there
as a blackened shell for the rest of your visit to that district.

Street lights are real objects. Hit one above ~20 km/h and it topples in the
direction you were going, its collider drops out in the same frame so you keep
going through it, and its lamp goes dark. They are drawn as two InstancedMeshes
per district — about 140 posts for two draw calls — which is what makes it cheap
enough to animate any one of them individually.

## Shops

One counter per district: **Gurjaap's Yard** in the Flats, **Cross Pawn &
Surplus** in Ravi Cross, the **Aurum Concierge** up top. Walk up and press `E`.

They sell weapons, ammunition for whatever you are already carrying, field
dressings, vests, panel beating for the car you parked outside, and — in the two
richer districts — cars, delivered to the kerb.

The whole point of them is the line at the bottom of the panel: nothing bought
here is added to your balance. Everything you *earn* increases what you owe by
more than you earned. Spending is the only transaction in Nagesh City that ends
when it ends.

## Collision

Everything solid is an axis-aligned box in a uniform spatial hash, so queries
are O(1) regardless of district size. Circles are resolved against the *closest
point* on each box rather than along the shallowest axis, so grazing an outside
corner slides you around it instead of snapping you flat against one face; and
the deepest overlap is resolved first and then re-queried, so being wedged
between two boxes settles instead of ping-ponging one into the other.

Resolution is height-aware: boxes shorter than your feet are stepped over, which
is why you can jump onto and over the knee-height clutter that used to end
fights.

Gunfire and line of sight use the same grid, gathering candidate boxes from the
cells along the ray and then testing each one exactly. An earlier version
marched in fixed steps asking "is there a box at this point?", which stepped
straight over anything thinner than the step — fences, railings, hoarding legs —
and that is what let people shoot each other through walls. An exact 90-metre
ray costs about two microseconds, so it is also the cheaper of the two.

Vehicles keep the velocity running *along* a wall and lose only the part going
into it, with friction applied as a rate rather than a per-frame multiplier —
grazing a building for a hundred frames in a row should cost you some speed, not
all of it. A genuine head-on still stops you, dents the panels and bounces.

## Finding your way

Three redundant systems, because getting lost is not the interesting part:

- a **light column** in the world you can see over rooftops,
- a **rotating minimap** in the bottom-left corner (and `M` for the full
  district map with every landmark named),
- **screen-edge arrows** with live distances for the nearest markers.

When an objective needs a vehicle and you are on foot, a green marker points at
the car instead of the destination. During a firefight the markers point at
whoever is currently shooting at you. Arrows keep clear of the minimap corner,
and the HUD fades out while anyone is talking.

## Sound

Everything is Web Audio; there is one audio file in the project.

- **Nagesh** — `assets/nagesh.wav`, trimmed and normalised from the supplied
  recording, played through a `BufferSource` at a `playbackRate` chosen per
  event. Low rates get a lowpass so they read as a groan; high rates get a
  high-shelf cut so they stay bright rather than piercing. Gain is
  pitch-compensated so every register sits at the same level.
- **Everyone else** — one oscillator blip per character typed, with waveform,
  base pitch, spread and filter per speaker, so Deepa and Gurjaap are
  distinguishable before you read the name tag.
- **Gunfire** — three ingredients in different proportions: a crack of filtered
  noise, a body thump and a tail. The proportions are what make the pistol sound
  like a pistol and the rifle sound like a decision. Distant fire is softened by
  range.
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

Characters, vehicles, drones, guns, muzzle flashes, explosions and pickups are
built from primitives in `src/actors.js`.

## Performance

- Every static thing in a district is merged into a handful of meshes by
  material, so ~200 buildings and ~600 props cost about 30 draw calls.
- Collision runs against a uniform spatial hash, so it is O(1) regardless of
  district size.
- Enemy line of sight is recomputed a few times a second rather than every
  frame, staggered per enemy so the cost never lands on one frame all at once.
- Tracers come from a pool; nothing is allocated per shot.
- Only the current district is in the scene graph.
- One shadow-casting directional light with a 1536² map on a tight ortho box
  that follows the player.
- Pixel ratio capped at 1.75; crowd characters use a reduced rig.

## Layout

```
index.html          markup for every screen and HUD element
css/style.css       interface
serve.mjs           static file server
assets/nagesh.wav   the voice line
vendor/             three.js r169
src/
  main.js           boot, menus, frame loop
  game.js           renderer, districts, traffic, shops, save file
  world.js          district definitions and generation
  art.js            every texture and portrait
  actors.js         characters, vehicles, drones, guns, explosions, pickups
  combat.js         weapons, shooting, enemies, waves, drops
  vehicles.js       arcade vehicle physics and damage
  player.js         input, player controller, chase camera
  missions.js       mission runner and objective types
  story.js          cast, dialogue, shops, mission script, endings
  ui.js             HUD, dialogue, menus, shop, endings
  minimap.js        corner minimap and full map
  util.js           RNG, geometry merging, spatial hash, collision, rays
```

## Save data

Progress is stored in `localStorage` under `nagesh-city-save-v1`: district,
money, debt, missions completed, weapons owned, ammunition and armour.
**New Game** overwrites it; the pause menu saves and quits.
