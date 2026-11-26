// Stages ?shot=cover|cockpit|drop|debrief with the real game objects, then freezes.
import { missionById } from '../missions/mission-catalog.js';
import { terrainHeight } from '../world/terrain-height.js';
import { forwardVector } from '../flight/flight-model.js';
import { stageFinishedRun } from '../missions/mission-runner.js';
import { crateMesh } from '../world/markers.js';

export function stageShot(game, name) {
  if (name === 'cover') {
    game.loadMission(missionById('ridge'));
    const st = game.flight;
    const gateY = terrainHeight(0, -1700) + 100;
    st.pos = { x: -120 + 0.66 * 120, y: gateY, z: -700 + 0.66 * -1000 };
    st.heading = Math.atan2(40.8, 340);
    st.pitch = 0.05;
    st.roll = 0.26;
    st.speed = 56;
    st.throttle = 0.82;
    st.gear = false;
    st.flaps = 0;
    st.onGround = false;
    game.sys.fuel = 32.9;
    game.run.time = 41;
    const f = forwardVector(st.heading, st.pitch);
    game.rig.override = {
      position: { x: st.pos.x - f.x * 20, y: st.pos.y - f.y * 20 + 4, z: st.pos.z - f.z * 20 },
      look: { x: st.pos.x + f.x * 300, y: st.pos.y + f.y * 300 + 52, z: st.pos.z + f.z * 300 },
      fov: 74,
    };
    game.view = 'chase';
    game.mode = 'flying';
    game.syncAircraft();
    game.aircraft.setGear(false);
    return;
  }
  if (name === 'cockpit') {
    game.loadMission(missionById('dieng'));
    const st = game.flight;
    const slope = (3.05 * Math.PI) / 180;
    st.pos = { x: -2700, y: 560 + 1 + 260 * Math.tan(slope), z: -1060 };
    st.heading = 0;
    st.pitch = -0.05;
    st.roll = 0;
    st.speed = 33;
    st.throttle = 0.5;
    st.gear = true;
    st.flaps = 1;
    st.onGround = false;
    game.sys.fuel = 8.2;
    game.run.time = 65;
    game.rig.override = null;
    game.view = 'cockpit';
    game.mode = 'flying';
    game.syncAircraft();
    return;
  }
  if (name === 'drop') {
    game.loadMission(missionById('rice'));
    const st = game.flight;
    const ground = terrainHeight(-900, 650);
    st.pos = { x: -900, y: ground + 78, z: 650 };
    st.heading = Math.PI;
    st.pitch = 0;
    st.roll = 0;
    st.speed = 45;
    st.throttle = 0.6;
    st.gear = false;
    st.flaps = 0;
    st.onGround = false;
    const run = game.run;
    run.states[0] = 'done';
    run.results[0] = '14 m';
    run.objectivePoints = 400;
    run.score = 400;
    run.index = 1;
    run.states[1] = 'active';
    run.cratesLeft = 1;
    run.cratesUsed = 2;
    run.time = 95;
    game.sys.fuel = 22.4;
    const f = forwardVector(st.heading, st.pitch);
    const crate = {
      pos: { x: -900, y: st.pos.y - 15, z: 720 },
      vel: { x: f.x * 45, y: -2, z: f.z * 45 },
      t: 1.6,
      chute: true,
      target: run.mission.objectives[1],
      targetIndex: 1,
      landed: false,
    };
    run.crateList.push(crate);
    const cm = crateMesh();
    cm.group.position.set(crate.pos.x, crate.pos.y, crate.pos.z);
    cm.setChute(true);
    game.scene.add(cm.group);
    game.crateMeshes.set(crate, cm);
    game.rig.override = {
      position: { x: st.pos.x - f.x * 30, y: st.pos.y - f.y * 30 + 9, z: st.pos.z - f.z * 30 },
      look: { x: st.pos.x + f.x * 220, y: st.pos.y + f.y * 220 - 40, z: st.pos.z + f.z * 220 },
      fov: 60,
    };
    game.toast = { text: 'Crate away — 1 left', until: 1e9 };
    game.view = 'chase';
    game.mode = 'flying';
    game.syncAircraft();
    game.aircraft.setGear(false);
    return;
  }
  if (name === 'debrief') {
    game.loadMission(missionById('ridge'));
    const st = game.flight;
    stageFinishedRun(game.run, st, game.sys, {
      objectivePoints: 2100,
      landingPoints: 746,
      time: 238,
      fuelLeft: 20.4,
      touchdownSink: 0.9,
      touchdownOffset: 1.2,
    });
    st.pos = { x: 0, y: 41.4, z: 100 };
    st.heading = 0;
    st.pitch = 0;
    st.roll = 0;
    st.speed = 0;
    st.throttle = 0;
    st.gear = true;
    st.flaps = 0;
    st.onGround = false;
    game.setGateActive(9);
    game.rig.override = {
      position: { x: 0, y: 43.5, z: 125 },
      look: { x: 0, y: 90, z: -3900 },
      fov: 60,
    };
    game.view = 'chase';
    game.mode = 'debrief';
    game.syncAircraft();
    return;
  }
  throw new Error('unknown shot: ' + name);
}
