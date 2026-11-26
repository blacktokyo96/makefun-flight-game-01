// Runway strips with painted canvas texture, lights, PAPI, windsock, hangars and tower.
import * as THREE from 'three';
import { PAPI_ANGLES } from '../core/config.js';

function runwayTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#3f4247';
  g.fillRect(0, 0, 128, 1024);
  g.fillStyle = '#e8e8e8';
  g.fillRect(5, 0, 4, 1024);
  g.fillRect(119, 0, 4, 1024);
  g.fillRect(62, 0, 4, 1024);
  for (let y = 90; y < 950; y += 64) {
    g.fillRect(62, y, 4, 34);
  }
  for (const y0 of [8, 960]) {
    for (let i = 0; i < 6; i++) g.fillRect(18 + i * 17, y0, 12, 46);
  }
  for (const y0 of [150, 830]) {
    g.fillRect(30, y0, 18, 40);
    g.fillRect(80, y0, 18, 40);
  }
  g.fillStyle = '#ffffff';
  g.font = 'bold 92px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.save();
  g.translate(64, 940);
  g.fillText('36', 0, 0);
  g.restore();
  g.save();
  g.translate(64, 84);
  g.rotate(Math.PI);
  g.fillText('18', 0, 0);
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function buildRunway(rw) {
  const group = new THREE.Group();
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(rw.width, rw.length),
    new THREE.MeshStandardMaterial({ map: runwayTexture(), roughness: 0.9, metalness: 0 }),
  );
  strip.geometry.rotateX(-Math.PI / 2);
  strip.position.set(rw.x, rw.elevation + 0.15, rw.z);
  group.add(strip);

  const edgeCount = Math.floor(rw.length / 60);
  const edgeGeo = new THREE.SphereGeometry(0.55, 6, 5);
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const edges = new THREE.InstancedMesh(edgeGeo, edgeMat, edgeCount * 2 + 10);
  const m = new THREE.Matrix4();
  let ei = 0;
  for (let i = 0; i <= edgeCount; i++) {
    const z = rw.z - rw.length / 2 + (i * rw.length) / edgeCount;
    for (const s of [-1, 1]) {
      m.makeTranslation(rw.x + s * (rw.width / 2 + 2), rw.elevation + 0.6, z);
      edges.setMatrixAt(ei, m);
      edges.setColorAt(ei, new THREE.Color(0xffffff));
      ei++;
    }
  }
  for (let i = 0; i < 5; i++) {
    const x = rw.x - 12 + i * 6;
    m.makeTranslation(x, rw.elevation + 0.6, rw.z + rw.length / 2 - 2);
    edges.setMatrixAt(ei, m);
    edges.setColorAt(ei, new THREE.Color(0x22ff44));
    ei++;
    m.makeTranslation(x, rw.elevation + 0.6, rw.z - rw.length / 2 + 2);
    edges.setMatrixAt(ei, m);
    edges.setColorAt(ei, new THREE.Color(0xff2222));
    ei++;
  }
  edges.count = ei;
  group.add(edges);

  const papi = { lamps: [], x: rw.x - rw.width / 2 - 14, z: rw.z + rw.length / 2 - 260, elev: rw.elevation, threshold: { x: rw.x, z: rw.z + rw.length / 2 } };
  for (let i = 0; i < 4; i++) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff0000, emissiveIntensity: 1.6 });
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.5), mat);
    lamp.position.set(papi.x - i * 9, rw.elevation + 0.7, papi.z);
    lamp.rotation.y = Math.PI;
    group.add(lamp);
    papi.lamps.push(mat);
  }

  const sock = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7, 6), new THREE.MeshStandardMaterial({ color: 0xdddddd }));
  pole.position.y = 3.5;
  sock.add(pole);
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 2.4, 8, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xff7722, side: THREE.DoubleSide }),
  );
  cone.geometry.rotateZ(Math.PI / 2);
  cone.position.set(-1.2, 6.6, 0);
  sock.add(cone);
  sock.position.set(rw.x + rw.width / 2 + 45, rw.elevation, rw.z + rw.length / 2 - 120);
  sock.rotation.y = (220 * Math.PI) / 180;
  group.add(sock);

  if (rw.hangars) {
    const hangarMat = new THREE.MeshStandardMaterial({ color: 0x9aa5ad, roughness: 0.8 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x5a6b76, roughness: 0.8 });
    for (const s of [-1, 1]) {
      const h = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(22, 7, 16), hangarMat);
      box.position.y = 3.5;
      h.add(box);
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 22, 12, 1, false, 0, Math.PI), roofMat);
      roof.geometry.rotateZ(Math.PI / 2);
      roof.geometry.rotateY(Math.PI / 2);
      roof.position.y = 7;
      h.add(roof);
      h.position.set(rw.x + s * (rw.width / 2 + 55), rw.elevation, rw.z - 120);
      group.add(h);
    }
  }
  if (rw.tower) {
    const tower = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3, 17, 10), new THREE.MeshStandardMaterial({ color: 0xd8d3c8 }));
    shaft.position.y = 8.5;
    tower.add(shaft);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 7), new THREE.MeshStandardMaterial({ color: 0x274b63, roughness: 0.2, metalness: 0.6 }));
    cab.position.y = 18.5;
    tower.add(cab);
    tower.position.set(rw.x + rw.width / 2 + 32, rw.elevation, rw.z - 320);
    group.add(tower);
  }
  return { group, papi };
}

export function updatePapi(papi, planePos) {
  const dx = planePos.x - papi.threshold.x;
  const dz = planePos.z - papi.threshold.z;
  const dist = Math.hypot(dx, dz);
  const angle = (Math.atan2(planePos.y - (papi.elev + 1), Math.max(dist, 1)) * 180) / Math.PI;
  let white = 0;
  for (let i = 0; i < 4; i++) {
    const on = angle > PAPI_ANGLES[i];
    if (on) white++;
    papi.lamps[i].emissive.setHex(on ? 0xffffff : 0xff0000);
    papi.lamps[i].color.setHex(on ? 0x666666 : 0x330000);
  }
  return { angle, white, dist };
}
