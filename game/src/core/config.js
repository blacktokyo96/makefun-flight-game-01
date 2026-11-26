// Constants: aircraft numbers, world shape, runways, units and the controls help.
export const AIRCRAFT = {
  name: 'Kestrel K-2',
  reg: 'PK-MRP',
  mass: 1100,
  maxThrust: 4300,
  stallClean: 26,
  stallFlaps: 21,
  gearHeight: 1.4,
  dragBase: 0.74,
  dragGear: 0.22,
  dragFlap: 0.34,
  throttleRate: 0.5,
  rollRate: 1.7,
  rollMax: 1.25,
  pitchRate: 0.95,
  yawRate: 0.28,
  rotateSpeed: 29,
  fuelBurnBase: 0.008,
  fuelBurnThrottle: 0.07,
};

export const WORLD = {
  size: 22000,
  segments: 280,
  centerZ: -1500,
  seaLevel: 0,
  coastZ: 2700,
  volcano: { x: 900, z: -3900, height: 2200, radius: 2400, craterDip: 190, craterR: 170 },
  ridge: { ax: 2600, az: -2600, bx: 6200, bz: -6800, height: 420, width: 1400 },
  dieng: { x: -2700, z: -1700, elev: 560 },
  plume: { from: { x: 900, y: 2080, z: -3900 }, to: { x: 1900, y: 3300, z: -3500 }, radius: 240 },
  wind: { fromDeg: 40, kt: 8 },
};

export const RUNWAYS = [
  { id: 'MERAPI', name: 'MERAPI FIELD', x: 0, z: 0, length: 1300, width: 34, elevation: 40, hangars: true, tower: true },
  { id: 'DIENG', name: 'DIENG PLATEAU STRIP', x: -2700, z: -1700, length: 760, width: 26, elevation: 560, hangars: false, tower: false },
];

export const PAPI_ANGLES = [2.5, 2.83, 3.17, 3.5];

export const UNITS = { MS_TO_KT: 1.94384, M_TO_FT: 3.28084 };

export const KEYS_HELP = [
  ['W / S', 'pitch (S pulls up)'],
  ['A / D', 'roll'],
  ['Q / E', 'rudder'],
  ['SHIFT / CTRL', 'throttle'],
  ['G', 'gear'],
  ['F', 'flaps 0-1-2'],
  ['B', 'drop crate'],
  ['C', 'chase / cockpit'],
  ['SPACE', 'brakes'],
  ['P', 'pause'],
  ['R', 'retry'],
  ['ESC', 'mission board'],
];
