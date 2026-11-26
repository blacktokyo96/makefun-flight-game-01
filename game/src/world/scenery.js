// Instanced trees, kampung villages, drifting clouds and the Merapi ash plume.
import * as THREE from 'three';
import { seededRandom } from '../core/random.js';
import { WORLD, RUNWAYS } from '../core/config.js';
import { terrainHeight } from './terrain-height.js';

export const VILLAGES = [
  { x: -1500, z: -300, name: 'Kampung Sari' },
  { x: -900, z: 900, name: 'Kampung Tirta' },
  { x: 700, z: 1100, name: 'Kampung Jaya' },
  { x: 2500, z: 300, name: 'Kampung Baru' },
  { x: -2500, z: 1800, name: 'Kampung Laut' },
  { x: 1800, z: -2200, name: 'Kampung Lereng' },
];

function nearRunway(x, z) {
  for (const rw of RUNWAYS) {
    if (Math.abs(x - rw.x) < 160 && Math.abs(z - rw.z) < rw.length / 2 + 1100) return true;
  }
  return false;
}

export function buildScenery(scene) {
  const rnd = seededRandom(1337);
  const treeGeo = new THREE.ConeGeometry(4, 13, 6);
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x2a5d23, roughness: 1, flatShading: true });
  const trunkGeo = new THREE.CylinderGeometry(0.5, 0.7, 3.5, 5);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 1 });
  const spots = [];
  let guard = 0;
  while (spots.length < 4000 && guard < 30000) {
    guard++;
    const x = (rnd() * 2 - 1) * 10800;
    const z = -12500 + rnd() * 22000;
    const h = terrainHeight(x, z);
    if (h < 2 || h > 1000 || nearRunway(x, z)) continue;
    spots.push({ x, z, h, s: 0.7 + rnd() * 0.9, r: rnd() * Math.PI * 2 });
  }
  const trees = new THREE.InstancedMesh(treeGeo, treeMat, spots.length);
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, spots.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const sc = new THREE.Vector3();
  spots.forEach((s, i) => {
    e.set(0, s.r, 0);
    q.setFromEuler(e);
    sc.set(s.s, s.s, s.s);
    m.compose(new THREE.Vector3(s.x, s.h + 7.5 * s.s, s.z), q, sc);
    trees.setMatrixAt(i, m);
    m.compose(new THREE.Vector3(s.x, s.h + 1.7 * s.s, s.z), q, sc);
    trunks.setMatrixAt(i, m);
  });
  scene.add(trees);
  scene.add(trunks);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf2e8d5, roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xa33327, roughness: 0.9, flatShading: true });
  const houseGeo = new THREE.BoxGeometry(7, 4.5, 6);
  const roofGeo = new THREE.ConeGeometry(5.4, 3.2, 4);
  for (const v of VILLAGES) {
    const g = new THREE.Group();
    const vrnd = seededRandom(v.x * 7 + v.z * 13 + 5);
    for (let i = 0; i < 10; i++) {
      const hx = v.x + (vrnd() * 2 - 1) * 85;
      const hz = v.z + (vrnd() * 2 - 1) * 85;
      const hy = terrainHeight(hx, hz);
      const house = new THREE.Mesh(houseGeo, wallMat);
      house.position.set(hx, hy + 2.2, hz);
      house.rotation.y = vrnd() * Math.PI;
      g.add(house);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(hx, hy + 6, hz);
      roof.rotation.y = vrnd() * Math.PI + Math.PI / 4;
      g.add(roof);
    }
    scene.add(g);
  }

  const clouds = [];
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, roughness: 1, flatShading: true });
  for (let i = 0; i < 26; i++) {
    const c = new THREE.Group();
    const n = 3 + Math.floor(rnd() * 3);
    for (let j = 0; j < n; j++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(55 + rnd() * 70, 7, 6), cloudMat);
      s.scale.y = 0.42;
      s.position.set((rnd() * 2 - 1) * 130, (rnd() * 2 - 1) * 18, (rnd() * 2 - 1) * 60);
      c.add(s);
    }
    c.position.set((rnd() * 2 - 1) * 9000, 950 + rnd() * 650, -10500 + rnd() * 16000);
    scene.add(c);
    clouds.push(c);
  }

  const puffs = [];
  const puffMat = new THREE.MeshStandardMaterial({ color: 0x8a8a86, transparent: true, opacity: 0.5, roughness: 1, flatShading: true });
  const puffGeo = new THREE.IcosahedronGeometry(1, 0);
  for (let i = 0; i < 34; i++) {
    const t = i / 33;
    const px = WORLD.plume.from.x + (WORLD.plume.to.x - WORLD.plume.from.x) * t + (rnd() * 2 - 1) * WORLD.plume.radius * (0.4 + t * 0.6);
    const py = WORLD.plume.from.y + (WORLD.plume.to.y - WORLD.plume.from.y) * t + (rnd() * 2 - 1) * 120;
    const pz = WORLD.plume.from.z + (WORLD.plume.to.z - WORLD.plume.from.z) * t + (rnd() * 2 - 1) * WORLD.plume.radius * (0.4 + t * 0.6);
    const p = new THREE.Mesh(puffGeo, puffMat);
    const s = 60 + rnd() * 110;
    p.scale.set(s, s * 0.7, s);
    p.position.set(px, py, pz);
    scene.add(p);
    puffs.push({ mesh: p, baseY: py, phase: rnd() * Math.PI * 2, speed: 0.1 + rnd() * 0.25 });
  }
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(90, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xff5a00, transparent: true, opacity: 0.75 }),
  );
  glow.position.set(WORLD.volcano.x, 2040, WORLD.volcano.z);
  scene.add(glow);
  const light = new THREE.PointLight(0xff6a22, 90000, 2600, 1.6);
  light.position.set(WORLD.volcano.x, 2100, WORLD.volcano.z);
  scene.add(light);

  return {
    clouds,
    puffs,
    animate(dt, time) {
      for (const c of clouds) {
        c.position.x += 6 * dt;
        if (c.position.x > 11000) c.position.x = -11000;
      }
      for (const p of puffs) {
        p.mesh.position.y = p.baseY + Math.sin(time * p.speed + p.phase) * 24;
      }
      glow.material.opacity = 0.6 + Math.sin(time * 1.7) * 0.15;
    },
  };
}
