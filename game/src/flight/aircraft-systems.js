// Fuel, damage, engine health, ash plume and warnings for the Kestrel.
import { AIRCRAFT, WORLD } from '../core/config.js';
import { terrainHeight } from '../world/terrain-height.js';
import { distToSegment } from '../core/math-utils.js';
import { stallSpeed } from './flight-model.js';

export function createSystems(fuelLitres) {
  return { fuel: fuelLitres, damage: 0, engineHealth: 100, engineOut: false, warnings: [], inAsh: false };
}

export function plumeDistance(pos) {
  return distToSegment(pos, WORLD.plume.from, WORLD.plume.to);
}

export function stepSystems(sys, st, dt) {
  sys.fuel = Math.max(0, sys.fuel - (AIRCRAFT.fuelBurnBase + AIRCRAFT.fuelBurnThrottle * st.throttle) * dt);
  if (sys.fuel <= 0) sys.engineOut = true;
  sys.inAsh = plumeDistance(st.pos) < WORLD.plume.radius;
  if (sys.inAsh) {
    sys.damage += 7 * dt;
    sys.engineHealth = Math.max(0, sys.engineHealth - 9 * dt);
  }
  if (st.g > 4.6) sys.damage += (st.g - 4.6) * 10 * dt;
  if (sys.damage >= 100) sys.damage = 100;
  const agl = Math.max(0, st.pos.y - terrainHeight(st.pos.x, st.pos.z) - 1.4);
  const vs = stallSpeed(st.flaps);
  const w = [];
  if (!st.onGround && st.speed < vs + 2) w.push({ text: 'STALL', level: 'red' });
  if (!st.onGround && agl < 120 && st.verticalSpeed < -8) w.push({ text: 'PULL UP', level: 'red' });
  if (!st.onGround && agl < 60 && st.verticalSpeed < -1 && !st.gear) w.push({ text: 'GEAR UP', level: 'amber' });
  if (sys.inAsh) w.push({ text: 'ASH — EXIT PLUME', level: 'red' });
  if (st.g > 4.6) w.push({ text: 'OVER-G', level: 'amber' });
  if (sys.engineOut) w.push({ text: 'ENGINE OUT — GLIDE', level: 'red' });
  else if (sys.fuel < 5) w.push({ text: 'LOW FUEL', level: 'amber' });
  if (sys.damage > 60) w.push({ text: 'AIRFRAME DAMAGE', level: 'red' });
  sys.warnings = w;
  return { thrustFactor: sys.engineOut ? 0 : 1, throttleCap: sys.engineHealth < 35 ? 0.45 : 1 };
}

export function touchdownDamage(sys, sink) {
  if (sink > 2.6) sys.damage += (sink - 2.6) * 14;
}
