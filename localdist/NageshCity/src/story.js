// Nagesh City - cast, dialogue and the mission script.
//
// Nagesh only ever says his own name. Every line of his is the same recorded
// word at a different pitch, and the parenthetical tells you how to read it.
// Everyone else beeps.

// Position helpers. Resolved against a built district at runtime.
export const lm = (name) => ({ lm: name });
export const at = (x, z) => ({ x, z });
export const scatter = (count, min, max) => ({ scatter: { count, min, max } });

// ------------------------------------------------------------------ cast ---

export const CHARACTERS = {
  nagesh: {
    name: 'Nagesh',
    portrait: { seed: 1, skin: 0x8d5a33, hair: 0x140f0b, hairStyle: 'short', cloth: 0x5e6b57, bg: 0x3a3020, bg2: 0x171208, smile: 0.1 },
    voice: null, // uses the sample
  },
  deepa: {
    name: 'Deepa',
    portrait: { seed: 2, skin: 0x9a6a3f, hair: 0x3a3a3a, hairStyle: 'long', cloth: 0x8a3f4a, bg: 0x3a2a20, bg2: 0x18100a, smile: 0.2, brow: -0.3 },
    voice: { wave: 'triangle', pitch: 300, spread: 0.3, rate: 1.15, gain: 0.15, filter: 1800 },
  },
  bittu: {
    name: 'Bittu',
    portrait: { seed: 3, skin: 0x8a5c34, hair: 0x120d08, hairStyle: 'short', cloth: 0x3f6a8a, bg: 0x25303a, bg2: 0x0e141a, smile: 0.9 },
    voice: { wave: 'square', pitch: 660, spread: 0.34, rate: 0.85, gain: 0.1, filter: 3200 },
  },
  chandran: {
    name: 'Mr. Chandran',
    portrait: { seed: 4, skin: 0xb07a48, hair: 0x1a1a1e, hairStyle: 'slick', cloth: 0x1e2733, bg: 0x2a1f28, bg2: 0x120b10, smile: 0.7, shades: true },
    voice: { wave: 'sine', pitch: 420, spread: 0.14, rate: 1.05, gain: 0.16, filter: 2600 },
  },
  salim: {
    name: '"Fixer" Salim',
    portrait: { seed: 5, skin: 0x7a5230, hair: 0x14100c, hairStyle: 'short', cloth: 0x2f4f7a, bg: 0x2a2438, bg2: 0x100e18, beard: true, smile: 0.35 },
    voice: { wave: 'sawtooth', pitch: 250, spread: 0.26, rate: 1.1, gain: 0.11, filter: 1400 },
  },
  vashti: {
    name: 'Auditor Vashti',
    portrait: { seed: 6, skin: 0xc09a72, hair: 0x2a2018, hairStyle: 'slick', cloth: 0x22252c, bg: 0x1c2028, bg2: 0x0a0c10, smile: -0.35, brow: 0.4, glasses: true },
    voice: { wave: 'square', pitch: 380, spread: 0.05, rate: 0.95, gain: 0.13, filter: 2200 },
  },
  priya: {
    name: 'Priya Vale',
    portrait: { seed: 7, skin: 0xcf9c6e, hair: 0x2a1a12, hairStyle: 'long', cloth: 0xe8e2d2, bg: 0x3a3428, bg2: 0x1a1610, smile: 0.55, tired: true },
    voice: { wave: 'triangle', pitch: 480, spread: 0.1, rate: 1.4, gain: 0.13, filter: 2000 },
  },
  ledger: {
    name: 'VANTA',
    portrait: { seed: 8, skin: 0x5a5f6a, hair: 0x2a2e36, hairStyle: 'bald', cloth: 0x14161c, bg: 0x101820, bg2: 0x04060a, smile: 0, brow: 0, shades: true },
    voice: { wave: 'sine', pitch: 150, spread: 0.02, rate: 1.9, gain: 0.2, filter: 900 },
  },
  crowd: {
    name: 'A voice in the crowd',
    portrait: { seed: 9, skin: 0x8a6242, hair: 0x1a1410, hairStyle: 'cap', cloth: 0x4a4a52, bg: 0x2a2a30, bg2: 0x101014, smile: -0.1 },
    voice: { wave: 'square', pitch: 340, spread: 0.4, rate: 1.0, gain: 0.1, filter: 2000 },
  },
};

// Shorthand for a Nagesh line: the same word, a different feeling.
const N = (pitch, cue) => ({ who: 'nagesh', text: 'Nagesh.', cue, pitch });
const say = (who, text, cue) => ({ who, text, cue });

// -------------------------------------------------------------- missions ---

/**
 * Missions run in order within a district. The last mission of a district
 * unlocks the next one; until then the gate does not open, and that is the
 * whole point of the city's architecture.
 */
export const MISSIONS = [
  // =====================================================  KADUVA FLATS  =====
  {
    id: 'slum_1',
    district: 'slums',
    title: 'Scrap Metal Economy',
    brief: 'Collect scrap from around the Flats and bring it to Deepa.',
    giver: 'deepa',
    start: lm('deepaHut'),
    reward: { cash: 400, fame: 1 },
    intro: [
      say('deepa', 'You are late, and you are empty-handed. Those two things are usually related.'),
      N(0.95, 'flatly'),
      say('deepa', 'Six loads of scrap. The yard pays by weight, not by charm, so do not try charming it.'),
      say('deepa', 'And Nagesh - stay off the main road. The census drones are out again.'),
      N(1.25, 'agreeing, a bit too fast'),
    ],
    objectives: [
      { type: 'collect', at: scatter(6, 30, 105), kind: 'scrap', glow: 0xffc94a, label: 'Collect scrap' },
      { type: 'deliver', at: lm('scrapyard'), label: 'Deliver the scrap to the yard' },
    ],
    outro: [
      say('deepa', 'Four hundred. Which is four hundred more than yesterday.'),
      N(1.5, 'pleased'),
      say('deepa', 'Do not spend it looking up at the hoardings. They are not selling anything you can buy.'),
    ],
  },
  {
    id: 'slum_2',
    district: 'slums',
    title: 'Three Wheels and a Prayer',
    brief: 'Bittu found a tuk-tuk in the impound. Get it out and get it to the yard.',
    giver: 'bittu',
    start: lm('standpipe'),
    reward: { cash: 300, fame: 2 },
    unlockVehicleHint: true,
    intro: [
      say('bittu', 'Nagesh! Nagesh, listen. The impound gate is broken. Has been broken for a week.'),
      N(0.8, 'suspicious'),
      say('bittu', 'It is not stealing if the city already stole it. Deepa says that. Deepa says that all the time.'),
      say('bittu', 'Yellow one. Three wheels. Take it to the yard before somebody fixes the gate.'),
      N(1.35, 'convinced'),
    ],
    objectives: [
      { type: 'goto', at: lm('impound'), label: 'Get to the impound', radius: 12 },
      { type: 'enterVehicle', spawn: { type: 'tuk', at: lm('impound'), offset: [4, 4] }, label: 'Take the tuk-tuk' },
      { type: 'deliver', at: lm('scrapyard'), label: "Drive it to Deepa's yard", requireVehicle: true, radius: 9 },
    ],
    outro: [
      say('bittu', 'You drive like a man who has never been in a vehicle. Which is true. So that is fair.'),
      N(1.65, 'triumphant'),
      say('deepa', 'It is a good machine. Keep it. Whistle for it and it will find you.'),
      say('deepa', 'You have wheels now. That is the most dangerous thing that has ever happened to you.'),
    ],
  },
  {
    id: 'slum_3',
    district: 'slums',
    title: 'Water Tuesday',
    brief: 'The standpipe runs for twelve minutes. Get water to three houses before it stops.',
    giver: 'deepa',
    start: lm('scrapyard'),
    reward: { cash: 500, fame: 2 },
    intro: [
      say('deepa', 'The pipe runs Tuesday and Friday. Today it will run for maybe twelve minutes.'),
      say('deepa', 'Three houses cannot walk to it. So you will drive to them.'),
      N(1.1, 'ready'),
      say('deepa', 'Fast, Nagesh. Not brave. Fast.'),
    ],
    objectives: [
      { type: 'goto', at: lm('standpipe'), label: 'Fill the cans at Standpipe 4', radius: 9 },
      {
        type: 'multiDeliver', at: scatter(3, 40, 110), label: 'Deliver water', kind: 'crate',
        glow: 0x4fc3e8, time: 150,
      },
    ],
    outro: [
      say('deepa', 'The Nair family says thank you. The Nair family has nothing else to say it with.'),
      N(1.3, 'warm'),
      say('deepa', 'This is what the Flats are. Everyone carrying water for everyone else.'),
      say('deepa', 'Up there they have fountains. Nobody carries anything. Ask yourself who is paying for that.'),
    ],
  },
  {
    id: 'slum_4',
    district: 'slums',
    title: 'Census',
    brief: 'VANTA drones are scanning faces in the Flats. Stay out of their lenses.',
    giver: 'bittu',
    start: lm('deepaHut'),
    reward: { cash: 600, fame: 4 },
    intro: [
      say('bittu', 'They are not counting people. My cousin watched one. It only looks at faces.'),
      say('bittu', 'It looks at your face and then a light goes green and then a letter comes.'),
      N(0.75, 'uneasy'),
      say('bittu', 'Everyone who got a letter went for an audition. Nobody who went came back to say how it went.'),
      say('bittu', 'Keep out of the light. Ninety seconds and they cycle out.'),
    ],
    objectives: [
      { type: 'survive', time: 90, drones: 5, label: 'Avoid the census drones', damage: true },
    ],
    outro: [
      N(0.9, 'out of breath'),
      say('bittu', 'You did it! They did not get you!'),
      say('bittu', '...they got me last week, though. Green light and everything.'),
      say('bittu', 'It is fine. It is probably fine.'),
      N(0.68, 'not sure it is fine'),
    ],
  },
  {
    id: 'slum_5',
    district: 'slums',
    title: 'The Audition',
    brief: 'The VANTA casting van is in the Flats. This is the way out.',
    giver: 'chandran',
    start: lm('castingVan'),
    reward: { cash: 2000, fame: 20 },
    chapterEnd: true,
    unlocks: 'midtown',
    intro: [
      say('deepa', 'I know where you are going. I have known for three days.'),
      N(0.85, 'guilty'),
      say('deepa', 'Everyone who signs that thing comes back different. Or does not come back, which is the same thing, faster.'),
      N(1.05, 'pleading'),
      say('deepa', 'Then go. But read it. Read all of it, Nagesh, even the small part.'),
      say('chandran', 'Nagesh! There he is. The face. I said to my colleague, that is a face with an outstanding balance of potential.'),
      say('chandran', 'Standard Visibility Agreement. We advance you a life. You pay us back in attention.'),
      say('chandran', 'It is the fairest deal in this city because it is the only deal in this city.'),
      N(1.4, 'signing'),
      say('chandran', 'Marvellous. Welcome to Ravi Cross. The gate is already open for you.'),
    ],
    objectives: [
      { type: 'goto', at: lm('castingVan'), label: 'Step onto the casting stage', radius: 6 },
      { type: 'sign', label: 'Sign the Visibility Agreement' },
    ],
    outro: [
      say('chandran', 'One small thing. The advance begins accruing today, not on your first job.'),
      say('chandran', 'Nobody reads that part. You did not read that part either.'),
      N(0.7, 'a beat too late'),
    ],
  },

  // =======================================================  RAVI CROSS  =====
  {
    id: 'mid_1',
    district: 'midtown',
    title: 'Brand Ambassador',
    brief: 'Drive the branded route. Hit every marker before the campaign window closes.',
    giver: 'salim',
    start: lm('studio9'),
    reward: { cash: 1200, fame: 10 },
    intro: [
      say('salim', 'New face. Good. New faces drive better because they still think the car is the reward.'),
      N(1.15, 'eager'),
      say('salim', 'VANTA bought forty seconds of this district. Your job is to be seen in it. Hit every marker.'),
      say('salim', 'The car has cameras in the wheel arches. Smile with your driving.'),
      N(1.45, 'delighted'),
    ],
    objectives: [
      {
        type: 'rings', at: scatter(8, 30, 110), time: 130, label: 'Drive the branded route',
        requireVehicle: true, spawn: { type: 'sports', at: lm('studio9'), offset: [7, 7], color: 0xb5203f },
      },
    ],
    outro: [
      say('salim', 'Eleven thousand impressions. Against your balance that is... you know what, do not ask.'),
      N(1.0, 'asking anyway'),
      say('salim', 'I said do not ask.'),
    ],
  },
  {
    id: 'mid_2',
    district: 'midtown',
    title: 'The Loop',
    brief: 'Stand on the plinths at The Loop and be photographed. Hold each pose.',
    giver: 'salim',
    start: lm('loop'),
    reward: { cash: 1500, fame: 14 },
    intro: [
      say('salim', 'The Loop. Eight plinths, eight angles, one very tired photographer.'),
      say('salim', 'Stand still. Hold it. The meter fills when you are being looked at.'),
      N(1.2, 'posing already'),
      say('salim', 'You are a natural. That is not a compliment in this district, it is a credit rating.'),
    ],
    objectives: [
      { type: 'pose', at: scatter(5, 20, 95), hold: 3.2, label: 'Pose for the cameras', nearLm: 'loop' },
    ],
    outro: [
      say('crowd', 'Hey. Hey, you are the new one, from the Flats.'),
      N(1.35, 'flattered'),
      say('crowd', 'Do not get comfortable. I was the new one eleven months ago.'),
      say('crowd', 'Look at your balance tonight. Look at it properly.'),
      N(0.88, 'unsettled'),
    ],
  },
  {
    id: 'mid_3',
    district: 'midtown',
    title: 'Follow the Money',
    brief: 'A collections van is doing its rounds. Stay with it. Do not get close.',
    giver: 'vashti',
    start: lm('depot'),
    reward: { cash: 1800, fame: 8 },
    intro: [
      say('vashti', 'You are contracted talent, not staff, so this is technically a promotional appearance.'),
      N(0.95, 'confused'),
      say('vashti', 'Follow the van. Observe the round. Learn what the other end of your agreement looks like.'),
      say('vashti', 'Between twelve and forty metres. Closer and they will see you. Further and you will lose it.'),
    ],
    objectives: [
      {
        type: 'tail', time: 95, min: 12, max: 46, label: 'Tail the collections van',
        requireVehicle: true, spawn: { type: 'sedan', at: lm('depot'), offset: [9, 6] },
      },
    ],
    outro: [
      say('vashti', 'You watched them take a woman\'s furniture, her car, and then her face.'),
      N(0.72, 'horrified'),
      say('vashti', 'Her contract was in arrears. Arrears means the visibility reverts to us.'),
      say('vashti', 'She will be on a hoarding by Thursday. She will not be paid for it.'),
      N(0.6, 'very quietly'),
    ],
  },
  {
    id: 'mid_4',
    district: 'midtown',
    title: 'Notices',
    brief: 'Deliver four repossession notices. Read the addresses. Do it anyway.',
    giver: 'vashti',
    start: lm('depot'),
    reward: { cash: 2200, fame: 6 },
    intro: [
      say('vashti', 'Four notices. Four doors. You do not have to speak to anyone.'),
      N(0.8, 'reluctant'),
      say('vashti', 'Your own balance went up nine percent this week purely on interest.'),
      say('vashti', 'Delivering these brings it down. That is not a threat, it is arithmetic.'),
      N(0.9, 'defeated'),
    ],
    objectives: [
      { type: 'multiDeliver', at: scatter(4, 35, 110), label: 'Deliver notices', kind: 'crate', glow: 0xff6a4a },
    ],
    outro: [
      say('crowd', 'You are the boy from the Flats. I saw your face on the van.'),
      N(0.66, 'ashamed'),
      say('crowd', 'It is alright. Somebody delivered mine too. He looked exactly like you look now.'),
    ],
  },
  {
    id: 'mid_5',
    district: 'midtown',
    title: 'Sign Here',
    brief: 'VANTA Midtown has an upgraded agreement waiting. The Heights are on the other side of it.',
    giver: 'chandran',
    start: lm('vantaOffice'),
    reward: { cash: 5000, fame: 30 },
    chapterEnd: true,
    unlocks: 'heights',
    intro: [
      say('chandran', 'Nagesh! Look at you. Ravi Cross has been very good to your profile.'),
      N(1.3, 'proud'),
      say('chandran', 'Tier Two. A residence in Aurum Heights. A car with a name instead of a number.'),
      say('chandran', 'Your balance does grow, yes. But so does your visibility. One outruns the other. Usually.'),
      N(1.05, 'catching the word "usually"'),
      say('chandran', 'Sign, Nagesh. Everyone up there signed. Every single one of them.'),
    ],
    objectives: [
      { type: 'goto', at: lm('vantaOffice'), label: 'Enter VANTA Midtown', radius: 7 },
      { type: 'sign', label: 'Sign the Tier Two agreement' },
    ],
    outro: [
      say('vashti', 'Congratulations. Your account has been moved to the Aurum ledger.'),
      say('vashti', 'A note, for the record: no Tier Two account has ever been closed.'),
      N(0.85, 'hearing it properly this time'),
      say('vashti', 'Not settled. Not defaulted. Closed. There is no procedure for it.'),
    ],
  },

  // =====================================================  AURUM HEIGHTS  ====
  {
    id: 'hi_1',
    district: 'heights',
    title: 'Housewarming',
    brief: 'Meet your neighbour. Everyone up here is very pleased to see you.',
    giver: 'priya',
    start: lm('villa'),
    reward: { cash: 1000, fame: 12 },
    intro: [
      say('priya', 'You are the new one. They told us on Tuesday. We were all so pleased.'),
      N(1.4, 'thrilled'),
      say('priya', 'I am Priya Vale. You have seen my face nine thousand times. I have a certificate about it.'),
      say('priya', 'Do you like the house? It is beautiful. I am contractually required to think it is beautiful.'),
      N(1.0, 'unsure if that was a joke'),
      say('priya', 'It was not a joke. Come. I will show you the view. We are photographed at six.'),
    ],
    objectives: [
      { type: 'goto', at: lm('villa'), label: 'Meet Priya at the Vale Residence', radius: 8 },
      { type: 'goto', at: lm('pavilion'), label: 'Walk with Priya to the Pavilion', radius: 8, escort: 'priya' },
    ],
    outro: [
      say('priya', 'Look at it. Every lawn cut on the same morning. Every window facing the same way.'),
      say('priya', 'Do you know what I did before this? I fixed refrigerators. I was very good at it.'),
      N(0.95, 'not knowing what to say'),
      say('priya', 'Nobody has asked me about refrigerators in six years. Six years, Nagesh.'),
    ],
  },
  {
    id: 'hi_2',
    district: 'heights',
    title: 'Ratings Night',
    brief: 'The swarm is out. Give them a chase worth watching, and survive it.',
    giver: 'salim',
    start: lm('pavilion'),
    reward: { cash: 3000, fame: 25 },
    intro: [
      say('salim', 'Ratings night. Whole district gets a swarm. Twelve drones, one story, and you are it.'),
      N(1.2, 'game for it'),
      say('salim', 'They are meant to chase. You are meant to run. That is the show.'),
      say('salim', 'Do not stop moving. When the numbers dip they fly closer. They fly a lot closer.'),
    ],
    objectives: [
      {
        type: 'survive', time: 100, drones: 9, label: 'Survive the ratings swarm',
        damage: true, requireVehicle: true, aggressive: true,
        spawn: { type: 'sports', at: lm('pavilion'), offset: [8, 8], color: 0xd8c840 },
      },
    ],
    outro: [
      say('salim', 'Peak audience four hundred thousand. Your best night yet.'),
      N(1.7, 'elated'),
      say('salim', 'And your balance went up. Ratings nights cost more to produce than they earn.'),
      say('salim', 'You are billed for the drones, Nagesh. You are billed for being chased.'),
      N(0.75, 'the elation draining out'),
    ],
  },
  {
    id: 'hi_3',
    district: 'heights',
    title: 'The Empty House',
    brief: 'The villa on the east side has been empty for a year. Priya wants what is inside it.',
    giver: 'priya',
    start: lm('villa'),
    reward: { cash: 2500, fame: 5 },
    intro: [
      say('priya', 'There is a house on the east side. Nobody talks about who lived there.'),
      say('priya', 'His name was Arun. He was on more hoardings than me. He tried to stop.'),
      N(0.9, 'listening hard'),
      say('priya', 'He kept a slate. Three pieces of it, hidden, because he knew they would come for it.'),
      say('priya', 'Bring me the pieces. I have wanted to read it for eleven months and I have never once been brave enough to go.'),
    ],
    objectives: [
      { type: 'collect', at: scatter(3, 12, 30), kind: 'slate', glow: 0x53d0ff, label: 'Recover the slate fragments', nearLm: 'emptyHouse' },
      { type: 'deliver', at: lm('villa'), label: 'Take the fragments to Priya' },
    ],
    outro: [
      say('priya', 'It is his account statement. Six years of it.'),
      say('priya', 'Every appearance earned him money. Every appearance also cost him a production fee, a wardrobe fee, a residence fee.'),
      say('priya', 'He earned eleven million. He owed nineteen. On the day he stopped, he owed twenty-six.'),
      N(0.62, 'understanding'),
      say('priya', 'We are not paid to be famous, Nagesh. We are famous because we are being collected from.'),
    ],
  },
  {
    id: 'hi_4',
    district: 'heights',
    title: 'Drive Her to the Gate',
    brief: 'Priya wants to leave. Take her to the north gate and find out what that means.',
    giver: 'priya',
    start: lm('villa'),
    reward: { cash: 0, fame: -10 },
    intro: [
      say('priya', 'Drive me to the gate.'),
      N(0.85, 'hesitant'),
      say('priya', 'I have not tried in four years. I want to try with somebody watching, so that it happened.'),
      N(1.05, 'agreeing'),
    ],
    objectives: [
      {
        type: 'goto', at: { x: 0, z: -118 }, label: 'Drive Priya to the north gate', radius: 12,
        escort: 'priya', requireVehicle: true,
        spawn: { type: 'limo', at: lm('villa'), offset: [8, 8] },
      },
    ],
    outro: [
      say('priya', 'There. You see? It does not open for me. It has never opened for me.'),
      say('priya', 'It opened for you on the way up. It opens one way. That is the entire design.'),
      N(0.55, 'devastated'),
      say('priya', 'Go to the Spire. There is a service lift on the east corner nobody locks, because nobody wants to go down.'),
      say('priya', 'Read the ledger yourself. Do not take my word. I am very good at being told what to say.'),
    ],
  },
  {
    id: 'hi_5',
    district: 'heights',
    title: 'Sub-Level Nine',
    brief: 'The service lift at the VANTA Spire goes down further than the building goes up.',
    giver: 'priya',
    start: lm('spire'),
    reward: { cash: 0, fame: 0 },
    chapterEnd: true,
    unlocks: 'vault',
    intro: [
      say('priya', 'The lift is behind the east corner. It takes about forty seconds.'),
      say('priya', 'Whatever you find - you will still have to come back up and live here.'),
      N(0.8, 'steady'),
      say('priya', 'Yes. I suppose that is the brave version.'),
    ],
    objectives: [
      { type: 'goto', at: lm('spire'), label: 'Find the service lift at the Spire', radius: 7, onFoot: true },
      { type: 'descend', label: 'Take the lift down' },
    ],
    outro: [],
  },

  // =======================================================  SUB-LEVEL 9  ====
  {
    id: 'vault_1',
    district: 'vault',
    title: 'The Ledger',
    brief: 'Sub-Level 9. Walk to the terminal.',
    giver: 'ledger',
    start: lm('terminal'),
    reward: { cash: 0, fame: 0 },
    autoStart: true,
    intro: [
      say('ledger', 'Welcome, account AH-2211. Nagesh. Tier Two. Aurum Heights.'),
      N(0.7, 'braced'),
      say('ledger', 'You are here to view your balance. Very few accounts request this. It is permitted.'),
    ],
    objectives: [
      { type: 'goto', at: lm('terminal'), label: 'Reach the ledger terminal', radius: 5, onFoot: true },
      { type: 'read', label: 'Read the ledger' },
    ],
    outro: [
      say('ledger', 'Eleven thousand four hundred and two active accounts.'),
      say('ledger', 'Aggregate earnings: forty-one billion. Aggregate balance owed: ninety-eight billion.'),
      N(0.6, 'doing the arithmetic'),
      say('ledger', 'Correct. No account has ever reached zero. The model does not permit it.'),
      say('ledger', 'Fame is not the reward for the debt. Fame is the collection method.'),
      say('ledger', 'A visible person generates attention. Attention is the asset. You are not the borrower, Nagesh.'),
      say('ledger', 'You are the security. The Heights are not a prize. They are a holding facility with good lawns.'),
      N(0.46, 'the bottom falling out'),
      say('ledger', 'The Flats are the intake. Ravi Cross is the assessment. Aurum Heights is where the asset is kept visible until it stops performing.'),
      say('ledger', 'Deepa was right, incidentally. She is in the file. Everyone who warned somebody is in the file.'),
    ],
  },
  {
    id: 'vault_2',
    district: 'vault',
    title: 'Broadcast',
    brief: 'The terminal can push to every hoarding in the city. Or you can sign the Tier Three renewal.',
    giver: 'ledger',
    start: lm('terminal'),
    reward: { cash: 0, fame: 0 },
    autoStart: true,
    final: true,
    intro: [
      say('ledger', 'Two options are available to your account.'),
      say('ledger', 'One: Tier Three renewal. Your balance is frozen. You become the face of intake. The Flats will see you and want this.'),
      say('ledger', 'Two: broadcast. Every hoarding in Nagesh City shows this ledger for as long as the transmitter lasts.'),
      say('ledger', 'Option two terminates your account. There is no procedure for what happens to you after that.'),
      N(0.9, 'deciding'),
    ],
    objectives: [
      {
        type: 'choice', label: 'Make your choice',
        options: [
          { id: 'broadcast', text: 'BROADCAST THE LEDGER', hint: 'Everyone sees. Nothing protects you.' },
          { id: 'sign', text: 'SIGN TIER THREE', hint: 'Your balance freezes. You become the poster.' },
        ],
      },
    ],
    outro: [],
  },
];

// ---------------------------------------------------------------- endings ---

export const ENDINGS = {
  broadcast: {
    title: 'BROADCAST',
    voice: [1.9, 1.5, 1.2, 0.9],
    lines: [
      'Every hoarding in Nagesh City goes dark at 04:11.',
      'Then, on all of them at once, a column of numbers. Eleven thousand four hundred and two names, and beside each one a balance that has never gone down.',
      'In Aurum Heights, a woman who used to fix refrigerators stands in her drive and reads her own name for four hours without moving.',
      'In Ravi Cross, a collections van pulls over and does not start again.',
      'In Kaduva Flats, Deepa looks up from the scrap and says nothing at all, and Bittu asks her why she is crying, and she says it is the dust.',
      'The transmitter lasts eleven minutes.',
      'Nobody has seen Nagesh since. His face is still on nine hundred hoardings across the city, and every single one of them is now showing somebody else\'s debt instead.',
    ],
    epilogue: 'You cleared nothing. You closed nothing. You just made the arithmetic public, which is the one thing the model does not permit.',
  },
  sign: {
    title: 'TIER THREE',
    voice: [1.6, 1.6, 1.6, 1.6],
    lines: [
      'The balance freezes at forty-one million, and the freezing is the only mercy in the contract.',
      'Nagesh becomes the face of intake. He is very good at it. He was always going to be very good at it.',
      'In Kaduva Flats a new hoarding goes up on the road out of the yard, four metres of him, smiling.',
      'YOU COULD BE SOMEBODY, it says. Bittu stands under it for a long time.',
      'Deepa paints over the bottom corner one night. Just the small print. Just the part nobody reads.',
      'By Friday it has been repaired.',
      'Priya Vale sends a note to the Spire. It says: I hope they let you keep your name. She does not get a reply, because replies are not in the contract.',
    ],
    epilogue: 'The model permits this outcome. The model was designed around it.',
  },
};

// ------------------------------------------------------------ chapter cards ---

export const CHAPTERS = {
  slums: { num: 'CHAPTER ONE', name: 'KADUVA FLATS', line: 'Nothing here is owned. Everything here is owed.' },
  midtown: { num: 'CHAPTER TWO', name: 'RAVI CROSS', line: 'The lights are brighter because somebody is being billed for them.' },
  heights: { num: 'CHAPTER THREE', name: 'AURUM HEIGHTS', line: 'Every lawn is cut. Nobody is happy. Ask why.' },
  vault: { num: 'CHAPTER FOUR', name: 'SUB-LEVEL NINE', line: 'The arithmetic, at last, in full.' },
};

// Ambient one-liners from pedestrians, per district. Colour, not plot - but the
// colour is what makes the plot land.
export const CHATTER = {
  slums: [
    'They filmed my sister at the standpipe. She got a letter.',
    'The pipe is dry again. It is always dry on the days they film.',
    'My brother went for the audition. That was in March.',
    'I do not look up at the boards any more. It is easier.',
    'Deepa pays cash. Nobody else in the Flats pays cash.',
  ],
  midtown: [
    'Three jobs and my balance went up. Explain that to me.',
    'Do not take the visibility loan. Do not.',
    'I was on a hoarding for a week. I never saw a rupee of it.',
    'They repossessed the flat above mine. Took the face off the door.',
    'Everybody up in the Heights looks so tired in person.',
  ],
  heights: [
    'We are photographed at six. We are always photographed at six.',
    'I have not chosen my own clothes since 2019.',
    'The gate only opens downward. Ask anybody. Nobody will answer.',
    'I earned four million last year. I owe eleven.',
    'Smile. They can bill you for a neutral expression.',
  ],
  vault: [],
};
