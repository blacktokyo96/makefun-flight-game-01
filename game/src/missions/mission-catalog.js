// The 5 sorties: ids, fuel, par, start states and ordered objectives.
export const GATE_POINTS = 200;
export const BEACON_POINTS = 250;
export const LAND_POINTS = 300;

export const MISSIONS = [
  {
    id: 'ridge',
    title: 'Ridge Run',
    tag: 'GATES',
    fuel: 34,
    par: 260,
    brief: 'Thread 9 gold gates around Merapi, then land back at Merapi Field. Keep it smooth — fuel and airframe are the real limits.',
    start: { pos: { x: 0, y: 41.4, z: 640 }, heading: 0, pitch: 0, roll: 0, speed: 0, throttle: 0, gear: true, flaps: 0, onGround: true },
    objectives: [
      { kind: 'gate', label: 'Gate 1', x: 0, z: -1700, agl: 100 },
      { kind: 'gate', label: 'Gate 2', x: 350, z: -2550, agl: 150 },
      { kind: 'gate', label: 'Gate 3', x: -500, z: -3300, agl: 170 },
      { kind: 'gate', label: 'Gate 4', x: -300, z: -4700, agl: 220 },
      { kind: 'gate', label: 'Gate 5', x: 900, z: -5300, agl: 240 },
      { kind: 'gate', label: 'Gate 6', x: 2100, z: -4600, agl: 220 },
      { kind: 'gate', label: 'Gate 7', x: 2300, z: -2900, agl: 160 },
      { kind: 'gate', label: 'Gate 8', x: 1300, z: -1500, agl: 120 },
      { kind: 'gate', label: 'Gate 9', x: 250, z: 1700, agl: 90 },
      { kind: 'land', label: 'Land at Merapi Field', runway: 'MERAPI' },
    ],
  },
  {
    id: 'ash',
    title: 'Ash Survey',
    tag: 'RECON',
    fuel: 28,
    par: 300,
    brief: 'Hold station on 3 rim beacons for 3 seconds each — stay inside 260 m and below 700 m above the ground. The last beacon sits on the plume side: mind the ash.',
    start: { pos: { x: 0, y: 420, z: -900 }, heading: 0, pitch: 0, roll: 0, speed: 50, throttle: 0.7, gear: true, flaps: 0, onGround: false },
    objectives: [
      { kind: 'beacon', label: 'Beacon 1 — south rim', x: 0, z: -3650 },
      { kind: 'beacon', label: 'Beacon 2 — west rim', x: 1150, z: -4800 },
      { kind: 'beacon', label: 'Beacon 3 — plume side', x: 1800, z: -3850 },
      { kind: 'land', label: 'Land at Merapi Field', runway: 'MERAPI' },
    ],
  },
  {
    id: 'rice',
    title: 'Rice Drop',
    tag: 'CARGO',
    fuel: 26,
    par: 240,
    brief: 'Three villages need rice. Press B over each red-and-white target — the crate floats down on its parachute. Closer to the centre, more points.',
    start: { pos: { x: 0, y: 600, z: -2600 }, heading: Math.PI, pitch: 0, roll: 0, speed: 50, throttle: 0.7, gear: true, flaps: 0, onGround: false },
    objectives: [
      { kind: 'drop', label: 'Drop — Kampung Sari', x: -1500, z: -300, name: 'Kampung Sari' },
      { kind: 'drop', label: 'Drop — Kampung Tirta', x: -900, z: 900, name: 'Kampung Tirta' },
      { kind: 'drop', label: 'Drop — Kampung Jaya', x: 700, z: 1100, name: 'Kampung Jaya' },
      { kind: 'land', label: 'Land at Merapi Field', runway: 'MERAPI' },
    ],
  },
  {
    id: 'dieng',
    title: 'Dieng Strip',
    tag: 'LANDING',
    fuel: 9,
    par: 150,
    brief: 'Short fuel, high plateau. You are 3.3 km south of the Dieng strip, gear down, flaps 1. Fly the 3-degree slope and stop on the strip.',
    start: { pos: { x: -2700, y: 750, z: 1600 }, heading: 0, pitch: -0.03, roll: 0, speed: 40, throttle: 0.55, gear: true, flaps: 1, onGround: false },
    objectives: [{ kind: 'land', label: 'Stop on the Dieng strip', runway: 'DIENG' }],
  },
  {
    id: 'free',
    title: 'Free Flight',
    tag: 'EXPLORE',
    fuel: 60,
    par: 0,
    brief: 'Sixty litres and the whole valley. Explore Merapi, the coast and the plateau — then put her down on any runway.',
    start: { pos: { x: 0, y: 41.4, z: 640 }, heading: 0, pitch: 0, roll: 0, speed: 0, throttle: 0, gear: true, flaps: 0, onGround: true },
    objectives: [{ kind: 'land', label: 'Land on any runway', runway: 'ANY' }],
  },
];

export function missionById(id) {
  return MISSIONS.find((m) => m.id === id) || MISSIONS[0];
}
