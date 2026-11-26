// Objectives in order, crate physics, screenshot staging and results.
import { terrainHeight } from '../world/terrain-height.js';
import { GATE_POINTS, BEACON_POINTS, LAND_POINTS } from './mission-catalog.js';
import { gradeLanding, centrelinePoints, scoreSortie } from './scoring.js';
import { forwardVector } from '../flight/flight-model.js';

export function createRun(mission) {
  return {
    mission,
    time: 0,
    score: 0,
    fuel: mission.fuel,
    states: mission.objectives.map((o, i) => (i === 0 ? 'active' : 'pending')),
    results: mission.objectives.map(() => ''),
    objectivePoints: 0,
    landingPoints: 0,
    landingGrade: '',
    index: 0,
    crates: mission.id === 'rice' ? 3 : undefined,
    cratesLeft: mission.id === 'rice' ? 3 : undefined,
    cratesUsed: 0,
    sensor: mission.id === 'ash' ? 0 : undefined,
    crateList: [],
    finished: false,
    lost: false,
    result: null,
    nextObjective: null,
  };
}

export function objectiveWorldPos(o) {
  if (o.kind === 'gate') return { x: o.x, z: o.z, y: terrainHeight(o.x, o.z) + o.agl };
  if (o.kind === 'beacon') return { x: o.x, z: o.z, y: terrainHeight(o.x, o.z) + 120 };
  if (o.kind === 'drop') return { x: o.x, z: o.z, y: terrainHeight(o.x, o.z) + 6 };
  return null;
}

function completeObjective(run, resultText, points) {
  run.states[run.index] = 'done';
  run.results[run.index] = resultText;
  run.objectivePoints += points;
  run.score += points;
  run.index++;
  if (run.index < run.mission.objectives.length) run.states[run.index] = 'active';
}

export function dropCrate(run, st) {
  if (run.cratesLeft === undefined || run.cratesLeft <= 0) return null;
  const o = run.mission.objectives[run.index];
  if (!o || o.kind !== 'drop') return null;
  const f = forwardVector(st.heading, st.pitch);
  const crate = {
    pos: { x: st.pos.x, y: st.pos.y - 1, z: st.pos.z },
    vel: { x: f.x * st.speed, y: f.y * st.speed, z: f.z * st.speed },
    t: 0,
    chute: false,
    target: o,
    targetIndex: run.index,
    landed: false,
  };
  run.crateList.push(crate);
  run.cratesLeft--;
  run.cratesUsed++;
  return crate;
}

export function updateRun(run, st, sys, dt, world) {
  const events = {};
  if (run.finished) return events;
  run.time += dt;
  run.fuel = sys.fuel;
  const o = run.mission.objectives[run.index];
  if (o) {
    if (o.kind === 'gate') {
      const gp = objectiveWorldPos(o);
      const dx = st.pos.x - gp.x;
      const dy = st.pos.y - gp.y;
      const dz = st.pos.z - gp.z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 32) {
        completeObjective(run, '+' + GATE_POINTS, GATE_POINTS);
        events.cleared = o.label;
        if (world.setGateActive) world.setGateActive(run.index);
      }
    } else if (o.kind === 'beacon') {
      const bp = objectiveWorldPos(o);
      const horiz = Math.hypot(st.pos.x - bp.x, st.pos.z - bp.z);
      const agl = st.pos.y - terrainHeight(st.pos.x, st.pos.z);
      if (horiz < 260 && agl < 700) {
        run.sensor += dt;
        if (world.setBeaconLock) world.setBeaconLock(run.index, Math.min(1, run.sensor / 3));
        if (run.sensor >= 3) {
          completeObjective(run, '+' + BEACON_POINTS, BEACON_POINTS);
          events.cleared = o.label;
          run.sensor = 0;
        }
      } else {
        run.sensor = Math.max(0, run.sensor - 2 * dt);
      }
    } else if (o.kind === 'land') {
      if (st.onGround && st.touchdown && st.speed < 1.5) {
        const td = st.touchdown;
        const ok = o.runway === 'ANY' ? td.runway !== null : td.runway === o.runway;
        if (ok) {
          const g = gradeLanding(td.sink);
          const cp = centrelinePoints(td.offset);
          run.landingPoints = g.points + cp;
          run.landingGrade = g.grade;
          completeObjective(run, g.grade + ' +' + run.landingPoints, LAND_POINTS);
          run.score += run.landingPoints - LAND_POINTS;
          events.landed = g.grade;
          finishRun(run, st, sys);
        }
      }
    }
  }
  for (const c of run.crateList) {
    if (c.landed) continue;
    c.t += dt;
    if (c.t > 1.2) c.chute = true;
    c.vel.y -= 9.81 * dt;
    if (c.chute) {
      c.vel.y = Math.max(c.vel.y, -7);
      c.vel.x *= Math.exp(-0.25 * dt);
      c.vel.z *= Math.exp(-0.25 * dt);
    }
    c.pos.x += c.vel.x * dt;
    c.pos.y += c.vel.y * dt;
    c.pos.z += c.vel.z * dt;
    const ground = terrainHeight(c.pos.x, c.pos.z) + 0.8;
    if (c.pos.y <= ground) {
      c.pos.y = ground;
      c.landed = true;
      const d = Math.hypot(c.pos.x - c.target.x, c.pos.z - c.target.z);
      const pts = d < 20 ? 400 : d < 40 ? 250 : d < 60 ? 120 : 0;
      const label = pts > 0 ? Math.round(d) + ' m' : 'MISS';
      if (c.targetIndex === run.index) {
        completeObjective(run, label, pts);
        events.crateScored = { label, pts };
      }
      if (world.setCrateLanded) world.setCrateLanded(c);
    }
  }
  const cur = run.mission.objectives[run.index];
  run.nextObjective = cur ? { ...cur, pos: objectiveWorldPos(cur) } : null;
  if (st.crashed && !run.finished) {
    run.lost = true;
    finishRun(run, st, sys);
    events.crashed = st.crashReason;
  }
  return events;
}

function finishRun(run, st, sys) {
  run.finished = true;
  const scored = scoreSortie({
    objectivePoints: run.objectivePoints,
    timeSec: run.time,
    parSec: run.mission.par,
    fuelLeft: sys.fuel,
    landingPoints: run.landingPoints,
    damage: sys.damage,
  });
  run.result = {
    lost: run.lost,
    reason: st.crashReason,
    grade: run.landingGrade,
    touchdown: st.touchdown,
    objectivePoints: run.objectivePoints,
    landingPoints: run.landingPoints,
    timeBonus: scored.timeBonus,
    fuelBonus: scored.fuelBonus,
    damagePenalty: scored.damagePenalty,
    total: scored.total,
    stars: scored.stars,
  };
}

export function computeResult(run, st, sys) {
  if (!run.result) finishRun(run, st, sys);
  return run.result;
}

// Stage a finished run for a screenshot: all objectives done, fixed numbers.
export function stageFinishedRun(run, st, sys, o) {
  run.states = run.mission.objectives.map(() => 'done');
  run.results = run.mission.objectives.map((obj) => (obj.kind === 'land' ? 'BUTTER' : '+200'));
  run.objectivePoints = o.objectivePoints;
  run.landingPoints = o.landingPoints;
  run.landingGrade = 'BUTTER';
  run.time = o.time;
  run.score = o.objectivePoints + o.landingPoints;
  run.fuel = o.fuelLeft;
  run.index = run.mission.objectives.length;
  run.nextObjective = null;
  st.touchdown = { sink: o.touchdownSink, speed: 0, runway: 'MERAPI', offset: o.touchdownOffset };
  sys.fuel = o.fuelLeft;
  sys.damage = 0;
  finishRun(run, st, sys);
}
