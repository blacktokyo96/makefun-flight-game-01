// Pure terrain functions: height, runway lookup and colour. No DOM, no three.js.
import { WORLD, RUNWAYS } from '../core/config.js';
import { clamp, smoothstep } from '../core/math-utils.js';
import { hash2 } from '../core/random.js';

function ridgeDistance(x, z) {
  const r = WORLD.ridge;
  const dx = r.bx - r.ax;
  const dz = r.bz - r.az;
  const len2 = dx * dx + dz * dz;
  let t = len2 === 0 ? 0 : ((x - r.ax) * dx + (z - r.az) * dz) / len2;
  t = clamp(t, 0, 1);
  const px = r.ax + dx * t;
  const pz = r.az + dz * t;
  const d = Math.hypot(x - px, z - pz);
  const ends = smoothstep(0, 0.12, t) * smoothstep(1, 0.88, t);
  return { d, ends };
}

export function terrainHeight(x, z) {
  let h = 55 + 30 * Math.sin(x * 0.0011) * Math.cos(z * 0.0013) + 18 * Math.sin(x * 0.0031 + z * 0.0023);
  const vx = x - WORLD.volcano.x;
  const vz = z - WORLD.volcano.z;
  const vr = Math.hypot(vx, vz);
  h += WORLD.volcano.height * Math.pow(Math.max(0, 1 - vr / WORLD.volcano.radius), 1.7);
  h -= WORLD.volcano.craterDip * Math.exp(-((vr / WORLD.volcano.craterR) * (vr / WORLD.volcano.craterR)));
  const ridge = ridgeDistance(x, z);
  h += WORLD.ridge.height * Math.exp(-((ridge.d / WORLD.ridge.width) * (ridge.d / WORLD.ridge.width))) * ridge.ends;
  const dd = Math.hypot(x - WORLD.dieng.x, z - WORLD.dieng.z);
  const plateau = (WORLD.dieng.elev - 30) * Math.exp(-Math.pow(dd / 1700, 8)) + 0.15 * h;
  h = Math.max(h, plateau);
  const coast = smoothstep(WORLD.coastZ, WORLD.coastZ + 700, z);
  h = h * (1 - coast) + -10 * coast;
  for (const rw of RUNWAYS) {
    const ax = Math.abs(x - rw.x);
    const az = Math.abs(z - rw.z);
    const wx = 1 - smoothstep(rw.width / 2 + 30, rw.width / 2 + 170, ax);
    const wz = 1 - smoothstep(rw.length / 2 + 50, rw.length / 2 + 240, az);
    const w = wx * wz;
    if (w > 0) h = h * (1 - w) + rw.elevation * w;
  }
  return h;
}

export function runwayAt(x, z) {
  for (const rw of RUNWAYS) {
    const dx = x - rw.x;
    const dz = z - rw.z;
    if (Math.abs(dx) <= rw.width / 2 && Math.abs(dz) <= rw.length / 2) {
      return { runway: rw, dx, dz, across: dx, along: dz };
    }
  }
  return null;
}

export function runwayById(id) {
  return RUNWAYS.find((r) => r.id === id) || null;
}

const RICE = [
  [0.32, 0.52, 0.22],
  [0.42, 0.6, 0.26],
  [0.72, 0.66, 0.3],
  [0.32, 0.52, 0.44],
];

export function terrainColour(h, slope, x, z) {
  if (h < 2) return [0.5, 0.55, 0.42];
  if (z > 2550 && h < 8) return [0.76, 0.7, 0.55];
  if (h < 140) {
    const cell = hash2(Math.floor(x / 180), Math.floor(z / 180));
    const tone = RICE[Math.floor(cell * 4) % 4];
    const v = 0.92 + hash2(Math.floor(x / 180) + 31, Math.floor(z / 180) + 17) * 0.16;
    return [tone[0] * v, tone[1] * v, tone[2] * v];
  }
  if (h < 1100) {
    const v = 0.85 + hash2(Math.floor(x / 90), Math.floor(z / 90)) * 0.3;
    const g = slope > 0.5 ? [0.4, 0.35, 0.28] : [0.16, 0.36, 0.15];
    return [g[0] * v, g[1] * v, g[2] * v];
  }
  if (h < 1600) return [0.42, 0.36, 0.3];
  if (h < 1900) return [0.25, 0.24, 0.23];
  return [0.15, 0.14, 0.14];
}
