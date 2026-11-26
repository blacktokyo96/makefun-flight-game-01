// Heightfield terrain mesh with vertex colours, flat shaded, plus the sea plane.
import * as THREE from 'three';
import { WORLD } from '../core/config.js';
import { terrainHeight, terrainColour } from './terrain-height.js';

export function buildTerrain() {
  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(WORLD.size, WORLD.size, WORLD.segments, WORLD.segments);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i) + WORLD.centerZ;
    const h = terrainHeight(x, z);
    pos.setY(i, h);
    pos.setZ(i, z);
    const hx = terrainHeight(x + 30, z) - h;
    const hz = terrainHeight(x, z + 30) - h;
    const slope = Math.hypot(hx, hz) / 30;
    const c = terrainColour(h, slope, x, z);
    colors[i * 3] = c[0];
    colors[i * 3 + 1] = c[1];
    colors[i * 3 + 2] = c[2];
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 });
  group.add(new THREE.Mesh(geo, mat));
  const seaGeo = new THREE.PlaneGeometry(WORLD.size, 7000);
  seaGeo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(
    seaGeo,
    new THREE.MeshStandardMaterial({ color: 0x2e6f9e, transparent: true, opacity: 0.88, roughness: 0.25, metalness: 0.1 }),
  );
  sea.position.set(0, 0.2, 6500);
  group.add(sea);
  return group;
}
