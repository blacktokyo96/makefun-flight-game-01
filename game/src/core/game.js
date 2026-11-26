// Scene setup, state machine menu → flying → debrief, key handling, approach info, draw.
import * as THREE from 'three';
import { RUNWAYS, WORLD } from '../core/config.js';
import { headingDeg, clamp } from '../core/math-utils.js';
import { buildTerrain } from '../world/terrain-mesh.js';
import { buildRunway, updatePapi } from '../world/runway.js';
import { buildScenery } from '../world/scenery.js';
import { buildSky } from '../world/sky.js';
import { gateMesh, beaconMesh, targetMesh, crateMesh } from '../world/markers.js';
import { buildAircraft } from '../flight/aircraft-model.js';
import { createFlightState, stepFlight, forwardVector } from '../flight/flight-model.js';
import { createSystems, stepSystems, touchdownDamage } from '../flight/aircraft-systems.js';
import { MISSIONS, missionById } from '../missions/mission-catalog.js';
import { createRun, updateRun, dropCrate, objectiveWorldPos } from '../missions/mission-runner.js';
import { createCameraRig } from '../camera/camera-rig.js';
import { HudRenderer } from '../hud/hud-renderer.js';
import { Input } from '../core/input.js';
import { EngineAudio } from '../audio/engine-audio.js';
import { terrainHeight, runwayById } from '../world/terrain-height.js';

const STARS_KEY = 'merapi-sky-patrol-stars';

function loadBest() {
  try {
    return JSON.parse(localStorage.getItem(STARS_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

export class Game {
  constructor(viewportEl, hudCanvas) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    viewportEl.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.5, 60000);
    buildSky(this.scene);
    this.scene.add(buildTerrain());
    this.runwayObjs = RUNWAYS.map((rw) => buildRunway(rw));
    for (const r of this.runwayObjs) this.scene.add(r.group);
    this.scenery = buildScenery(this.scene);
    this.aircraft = buildAircraft();
    this.scene.add(this.aircraft.group);
    this.rig = createCameraRig(this.camera);
    this.hud = new HudRenderer(hudCanvas);
    this.input = new Input();
    this.audio = new EngineAudio();
    this.mode = 'menu';
    this.view = 'chase';
    this.selected = 0;
    this.bestStars = loadBest();
    this.time = 0;
    this.toast = null;
    this.markerGroup = null;
    this.gateMeshes = [];
    this.beaconMeshes = [];
    this.crateMeshes = new Map();
    this.loadMission(MISSIONS[0]);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.hud.resize(w, h);
  }

  loadMission(mission) {
    this.mission = mission;
    this.flight = createFlightState(mission.start);
    this.sys = createSystems(mission.fuel);
    this.run = createRun(mission);
    this.buildMarkers();
    this.syncAircraft();
    this.rig.override = null;
    this.rig.pos.set(this.flight.pos.x, this.flight.pos.y + 8, this.flight.pos.z + 34);
  }

  selectMission(i) {
    this.selected = ((i % MISSIONS.length) + MISSIONS.length) % MISSIONS.length;
    this.loadMission(MISSIONS[this.selected]);
  }

  startMission() {
    this.audio.ensure();
    this.mode = 'flying';
    this.toast = null;
  }

  retryMission() {
    this.loadMission(this.mission);
    this.mode = 'flying';
  }

  toMenu() {
    this.mode = 'menu';
    this.selectMission(this.selected);
  }

  buildMarkers() {
    if (this.markerGroup) {
      this.scene.remove(this.markerGroup);
      this.markerGroup.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
      });
    }
    this.markerGroup = new THREE.Group();
    this.gateMeshes = [];
    this.beaconMeshes = [];
    this.crateMeshes = new Map();
    const objs = this.mission.objectives;
    objs.forEach((o, i) => {
      if (o.kind === 'gate') {
        const gm = gateMesh();
        const p = objectiveWorldPos(o);
        gm.group.position.set(p.x, p.y, p.z);
        const next = objs[i + 1];
        const tx = next && next.x !== undefined ? next.x : 0;
        const tz = next && next.z !== undefined ? next.z : 0;
        gm.group.rotation.y = Math.atan2(tx - o.x, tz - o.z);
        this.markerGroup.add(gm.group);
        this.gateMeshes.push(gm);
      } else if (o.kind === 'beacon') {
        const bm = beaconMesh();
        bm.group.position.set(o.x, terrainHeight(o.x, o.z), o.z);
        this.markerGroup.add(bm.group);
        this.beaconMeshes.push(bm);
      } else if (o.kind === 'drop') {
        const tm = targetMesh();
        tm.group.position.set(o.x, terrainHeight(o.x, o.z), o.z);
        this.markerGroup.add(tm.group);
      }
    });
    this.scene.add(this.markerGroup);
    this.setGateActive(0);
  }

  setGateActive(activeIdx) {
    this.gateMeshes.forEach((gm, j) => {
      const active = j === activeIdx;
      const done = j < activeIdx;
      gm.ring.material.emissive.setHex(done ? 0x2fae4e : active ? 0xffcc00 : 0xaa7700);
      gm.ring.material.emissiveIntensity = active ? 1.5 : done ? 0.7 : 0.4;
      for (const b of gm.blocks) b.emissiveIntensity = active ? 1.4 : done ? 0.25 : 0.3;
    });
  }

  worldHandles() {
    return {
      setGateActive: (i) => this.setGateActive(i),
      setBeaconLock: (i, frac) => {
        const bm = this.beaconMeshes[i];
        if (bm) bm.lamp.emissiveIntensity = 1 + frac * 3;
      },
      setCrateLanded: (crate) => {
        const m = this.crateMeshes.get(crate);
        if (m) m.setChute(false);
      },
    };
  }

  syncAircraft() {
    const st = this.flight;
    this.aircraft.group.position.set(st.pos.x, st.pos.y, st.pos.z);
    this.aircraft.group.quaternion.setFromEuler(new THREE.Euler(st.pitch, -st.heading, -st.roll, 'YXZ'));
    this.aircraft.setGear(st.gear);
  }

  setToast(text) {
    this.toast = { text, until: this.time + 3.5 };
  }

  update(dt) {
    this.time += dt;
    const inp = this.input;
    if (this.mode === 'menu') {
      if (inp.consume('ArrowUp')) this.selectMission(this.selected - 1);
      if (inp.consume('ArrowDown')) this.selectMission(this.selected + 1);
      for (let i = 0; i < 5; i++) if (inp.consume('Digit' + (i + 1))) this.selectMission(i);
      if (inp.consume('Enter')) this.startMission();
      const a = this.time * 0.1;
      const p = this.flight.pos;
      this.camera.position.set(p.x + Math.sin(a) * 30, p.y + 8, p.z + Math.cos(a) * 30);
      this.camera.lookAt(p.x, p.y + 2, p.z);
      this.scenery.animate(dt, this.time);
      inp.endFrame();
      return;
    }
    if (this.mode === 'paused') {
      if (inp.consume('KeyP')) this.mode = 'flying';
      if (inp.consume('Escape')) this.toMenu();
      if (inp.consume('KeyR')) this.retryMission();
      inp.endFrame();
      return;
    }
    if (this.mode === 'debrief') {
      if (inp.consume('KeyR')) this.retryMission();
      if (inp.consume('Escape')) this.toMenu();
      this.scenery.animate(dt, this.time);
      this.rig.update(dt, this.flight, this.view);
      inp.endFrame();
      return;
    }
    const st = this.flight;
    const sys = this.sys;
    const axes = inp.axes();
    const engine = stepSystems(sys, st, dt);
    if (sys.damage >= 100 && !st.crashed) {
      st.crashed = true;
      st.crashReason = 'Airframe failure';
    }
    const ev = stepFlight(st, axes, dt, engine);
    if (ev.touchedDown) {
      touchdownDamage(sys, ev.touchedDown.sink);
      if (ev.roughField) {
        sys.damage += 12;
        this.setToast('ROUGH FIELD LANDING +12 DAMAGE');
      }
    }
    if (inp.consume('KeyG')) {
      st.gear = !st.gear;
      this.aircraft.setGear(st.gear);
      this.setToast(st.gear ? 'GEAR DOWN' : 'GEAR UP');
    }
    if (inp.consume('KeyF')) {
      st.flaps = (st.flaps + 1) % 3;
      this.setToast('FLAPS ' + st.flaps);
    }
    if (inp.consume('KeyB')) {
      const crate = dropCrate(this.run, st);
      if (crate) {
        const cm = crateMesh();
        cm.group.position.copy(crate.pos);
        this.scene.add(cm.group);
        this.crateMeshes.set(crate, cm);
        this.setToast('Crate away — ' + this.run.cratesLeft + ' left');
      } else if (this.run.cratesLeft !== undefined) {
        this.setToast('NO CRATES LEFT');
      }
    }
    if (inp.consume('KeyC')) {
      this.view = this.view === 'chase' ? 'cockpit' : 'chase';
    }
    if (inp.consume('KeyP')) this.mode = 'paused';
    if (inp.consume('KeyR')) this.retryMission();
    if (inp.consume('Escape')) this.toMenu();
    const rev = updateRun(this.run, st, sys, dt, this.worldHandles());
    if (rev.cleared) {
      this.setToast(rev.cleared.toUpperCase() + ' CLEAR');
      this.audio.chime();
    }
    if (rev.crateScored) this.setToast('Crate ' + rev.crateScored.label + '  +' + rev.crateScored.pts);
    if (rev.landed) this.audio.chime();
    for (const c of this.run.crateList) {
      const m = this.crateMeshes.get(c);
      if (m) {
        m.group.position.set(c.pos.x, c.pos.y, c.pos.z);
        m.setChute(c.chute && !c.landed);
      }
    }
    if (this.run.finished && this.mode === 'flying') {
      this.mode = 'debrief';
      const res = this.run.result;
      if (res && res.stars > (this.bestStars[this.mission.id] || 0)) {
        this.bestStars[this.mission.id] = res.stars;
        try {
          localStorage.setItem(STARS_KEY, JSON.stringify(this.bestStars));
        } catch (e) {}
      }
    }
    this.syncAircraft();
    this.aircraft.animate(axes, dt, this.time, st.throttle);
    for (const r of this.runwayObjs) updatePapi(r.papi, st.pos);
    this.scenery.animate(dt, this.time);
    this.rig.update(dt, st, this.view);
    this.audio.setState({ throttle: st.throttle, speed: st.speed });
    inp.endFrame();
  }

  project(p) {
    const v = new THREE.Vector3(p.x, p.y, p.z).project(this.camera);
    const s = this.hud.canvas.height / 640;
    const W = this.hud.canvas.width / s;
    return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * 640, behind: v.z > 1 };
  }

  computeNext() {
    const run = this.run;
    const o = this.mission.objectives[run.index];
    if (!o) return null;
    let pos;
    let label;
    if (o.kind === 'land') {
      if (o.runway === 'ANY') {
        let best = null;
        let bestD = Infinity;
        for (const rw of RUNWAYS) {
          const d = Math.hypot(this.flight.pos.x - rw.x, this.flight.pos.z - rw.z);
          if (d < bestD) {
            bestD = d;
            best = rw;
          }
        }
        pos = { x: best.x, z: best.z, y: best.elevation + 5 };
        label = best.name;
      } else {
        const rw = runwayById(o.runway);
        pos = { x: rw.x, z: rw.z, y: rw.elevation + 5 };
        label = rw.name;
      }
    } else {
      pos = objectiveWorldPos(o);
      label = o.kind === 'gate' ? o.label.toUpperCase() : o.kind === 'beacon' ? o.label.toUpperCase().split(' — ')[0] : o.name.toUpperCase();
    }
    const dx = pos.x - this.flight.pos.x;
    const dy = pos.y - this.flight.pos.y;
    const dz = pos.z - this.flight.pos.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return {
      label,
      distKm: dist / 1000,
      bearing: headingDeg(Math.atan2(dx, -dz)),
      pos,
      projected: this.project(pos),
    };
  }

  computeFinal() {
    const run = this.run;
    const o = this.mission.objectives[run.index];
    if (!o || o.kind !== 'land') return null;
    let rw = null;
    if (o.runway === 'ANY') {
      let bestD = Infinity;
      for (const r of RUNWAYS) {
        const d = Math.hypot(this.flight.pos.x - r.x, this.flight.pos.z - r.z);
        if (d < bestD) {
          bestD = d;
          rw = r;
        }
      }
    } else {
      rw = runwayById(o.runway);
    }
    const tx = rw.x;
    const tz = rw.z + rw.length / 2;
    const dist = Math.hypot(this.flight.pos.x - tx, this.flight.pos.z - tz);
    if (dist > 6000 || this.flight.pos.z < tz - 1000) return null;
    const glideDeg = (Math.atan2(this.flight.pos.y - (rw.elevation + 1), Math.max(dist, 1)) * 180) / Math.PI;
    const state = glideDeg >= 2.8 && glideDeg <= 3.3 ? 'ON SLOPE' : glideDeg > 3.3 ? 'HIGH ▼' : 'LOW ▲';
    return { runway: rw.name, distKm: dist / 1000, glideDeg, state };
  }

  buildVm() {
    const st = this.flight;
    const f = forwardVector(st.heading, st.pitch);
    const next = this.mode === 'flying' ? this.computeNext() : null;
    return {
      mode: this.mode,
      view: this.view,
      mission: this.mission,
      run: this.run,
      flight: st,
      sys: this.sys,
      time: this.time,
      next,
      forward: f,
      project: (p) => this.project(p),
      final: this.mode === 'flying' ? this.computeFinal() : null,
      toast: this.toast && this.time < this.toast.until ? this.toast : null,
      menu: { missions: MISSIONS, selected: this.selected, bestStars: this.bestStars },
      debrief: this.mode === 'debrief' ? this.run.result : null,
    };
  }

  draw() {
    this.renderer.render(this.scene, this.camera);
    this.hud.draw(this.buildVm());
  }
}
