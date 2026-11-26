// Step the Kestrel's flight: thrust, drag, turns, stall, takeoff and touchdown.
import { AIRCRAFT } from '../core/config.js';
import { clamp } from '../core/math-utils.js';
import { terrainHeight, runwayAt } from '../world/terrain-height.js';

export function createFlightState(start) {
  return {
    pos: { x: start.pos.x, y: start.pos.y, z: start.pos.z },
    heading: start.heading || 0,
    pitch: start.pitch || 0,
    roll: start.roll || 0,
    speed: start.speed || 0,
    throttle: start.throttle || 0,
    gear: start.gear !== undefined ? start.gear : true,
    flaps: start.flaps || 0,
    onGround: start.onGround !== undefined ? start.onGround : true,
    g: 1,
    verticalSpeed: 0,
    crashed: false,
    crashReason: '',
    touchdown: null,
  };
}

export function forwardVector(heading, pitch) {
  const cp = Math.cos(pitch);
  return { x: Math.sin(heading) * cp, y: Math.sin(pitch), z: -Math.cos(heading) * cp };
}

export function stallSpeed(flaps) {
  return flaps > 0 ? AIRCRAFT.stallFlaps : AIRCRAFT.stallClean;
}

function crash(st, reason, events) {
  st.crashed = true;
  st.crashReason = reason;
  events.crashed = reason;
  return events;
}

export function stepFlight(st, inp, dt, engine) {
  const events = {};
  if (st.crashed) return events;
  const g = 9.81;
  st.throttle = clamp(st.throttle + inp.throttleAxis * AIRCRAFT.throttleRate * dt, 0, 1);
  const effThrottle = Math.min(st.throttle, engine.throttleCap);
  const thrust = AIRCRAFT.maxThrust * effThrottle * engine.thrustFactor;
  const dragK = AIRCRAFT.dragBase + (st.gear ? AIRCRAFT.dragGear : 0) + AIRCRAFT.dragFlap * st.flaps;
  const drag = dragK * st.speed * st.speed;
  let accel = (thrust - drag) / AIRCRAFT.mass - g * Math.sin(st.pitch);
  if (st.onGround) accel -= inp.brake ? 4.5 : 0.35;
  st.speed = Math.max(0, st.speed + accel * dt);
  const vs = stallSpeed(st.flaps);

  if (st.onGround) {
    const steer = clamp(st.speed / 8, 0, 1);
    st.heading += (inp.yaw * 0.55 + inp.roll * 0.35) * steer * dt;
    if (st.speed > AIRCRAFT.rotateSpeed && inp.pitch > 0) {
      st.pitch = Math.min(0.18, st.pitch + 0.6 * dt);
      if (st.pitch >= 0.15) {
        st.onGround = false;
        events.tookOff = true;
      }
    } else {
      st.pitch = 0;
    }
    const f = forwardVector(st.heading, 0);
    st.pos.x += f.x * st.speed * dt;
    st.pos.z += f.z * st.speed * dt;
    st.pos.y = terrainHeight(st.pos.x, st.pos.z) + AIRCRAFT.gearHeight;
    st.verticalSpeed = 0;
    return events;
  }

  const stalled = st.speed < vs;
  const rollRate = AIRCRAFT.rollRate * clamp(st.speed / 45, 0.35, 1);
  if (inp.roll !== 0) st.roll += inp.roll * rollRate * dt;
  else st.roll += clamp(-st.roll, -0.5 * dt, 0.5 * dt);
  st.roll = clamp(st.roll, -AIRCRAFT.rollMax, AIRCRAFT.rollMax);
  const authority = clamp(st.speed / 40, 0.25, 1.05);
  const pitchRate = AIRCRAFT.pitchRate * authority;
  st.pitch += inp.pitch * pitchRate * dt;
  if (stalled) st.pitch -= 0.45 * dt * clamp((vs - st.speed) / 10, 0, 1);
  st.pitch = clamp(st.pitch, -0.5, 0.6);
  const liftFactor = clamp(st.speed / vs, 0.4, 1);
  st.heading += ((g * Math.tan(st.roll)) / Math.max(st.speed, 5)) * liftFactor * dt + inp.yaw * AIRCRAFT.yawRate * dt;
  st.g = (1 / Math.cos(st.roll)) * liftFactor + inp.pitch * pitchRate * (st.speed / g);
  const f = forwardVector(st.heading, st.pitch);
  let vy = st.speed * f.y;
  if (stalled) vy -= (vs - st.speed) * 0.6;
  st.pos.x += f.x * st.speed * dt;
  st.pos.y += vy * dt;
  st.pos.z += f.z * st.speed * dt;
  st.verticalSpeed = vy;
  const groundY = terrainHeight(st.pos.x, st.pos.z) + AIRCRAFT.gearHeight;
  if (st.pos.y <= groundY) {
    st.pos.y = groundY;
    const sink = Math.max(0, -vy);
    const kt = Math.round(st.speed * 1.94384);
    if (!st.gear) return crash(st, 'Belly landing', events);
    const ground = terrainHeight(st.pos.x, st.pos.z);
    if (ground < 0) return crash(st, 'Ditched in the sea', events);
    const hit = runwayAt(st.pos.x, st.pos.z);
    if (hit && sink < 4.5 && Math.abs(st.roll) < 0.22 && st.pitch > -0.1 && st.speed < 52) {
      st.onGround = true;
      st.pitch = 0;
      st.roll = 0;
      st.touchdown = { sink, speed: st.speed, runway: hit.runway.id, offset: Math.abs(hit.dx) };
      events.touchedDown = st.touchdown;
    } else if (!hit && st.speed < 25 && sink < 3) {
      st.onGround = true;
      st.pitch = 0;
      st.roll = 0;
      st.touchdown = { sink, speed: st.speed, runway: null, offset: 0 };
      events.touchedDown = st.touchdown;
      events.roughField = true;
    } else {
      let reason;
      if (sink >= 4.5) reason = 'Hard landing: ' + sink.toFixed(1) + ' m/s sink';
      else if (hit && st.speed >= 52) reason = 'Too fast to land: ' + kt + ' kt';
      else if (Math.abs(st.roll) >= 0.22) reason = 'Wingtip strike on landing';
      else reason = 'Struck terrain at ' + kt + ' kt';
      return crash(st, reason, events);
    }
  }
  return events;
}
