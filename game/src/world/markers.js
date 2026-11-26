// Gate rings, survey beacons, drop targets and supply crates.
import * as THREE from 'three';

export function gateMesh() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(30, 2.4, 10, 40),
    new THREE.MeshStandardMaterial({ color: 0xd8a400, emissive: 0xaa7700, emissiveIntensity: 0.7, roughness: 0.4, metalness: 0.4 }),
  );
  g.add(ring);
  const blocks = [];
  const blockGeo = new THREE.BoxGeometry(3.4, 3.4, 3.4);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const mat = new THREE.MeshStandardMaterial({ color: 0x554400, emissive: 0xffcc00, emissiveIntensity: 0.4 });
    const b = new THREE.Mesh(blockGeo, mat);
    b.position.set(Math.cos(a) * 30, Math.sin(a) * 30, 0);
    g.add(b);
    blocks.push(mat);
  }
  return { group: g, ring, blocks };
}

export function beaconMesh() {
  const g = new THREE.Group();
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 128;
  const ctx = c.getContext('2d');
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#ffffff' : '#d21f1f';
    ctx.fillRect(0, i * 16, 32, 16);
  }
  const stripe = new THREE.CanvasTexture(c);
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.9, 26, 8),
    new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.7 }),
  );
  mast.position.y = 13;
  g.add(mast);
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 2 }),
  );
  lamp.position.y = 27;
  g.add(lamp);
  const zone = new THREE.Mesh(
    new THREE.CylinderGeometry(260, 260, 700, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }),
  );
  zone.position.y = 350;
  g.add(zone);
  return { group: g, lamp: lamp.material };
}

export function targetMesh() {
  const g = new THREE.Group();
  const rings = [
    { r: 42, col: 0xffffff },
    { r: 30, col: 0xd21f1f },
    { r: 18, col: 0xffffff },
    { r: 8, col: 0xd21f1f },
  ];
  for (const ring of rings) {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(ring.r - 3, ring.r, 32),
      new THREE.MeshBasicMaterial({ color: ring.col, side: THREE.DoubleSide }),
    );
    m.geometry.rotateX(-Math.PI / 2);
    m.position.y = 0.4;
    g.add(m);
  }
  for (const s of [-1, 1]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 9, 5), new THREE.MeshStandardMaterial({ color: 0x888888 }));
    pole.position.set(s * 44, 4.5, 0);
    g.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.2), new THREE.MeshBasicMaterial({ color: 0xffd21f, side: THREE.DoubleSide }));
    flag.position.set(s * 44 + s * 2.5, 7.4, 0);
    g.add(flag);
  }
  return { group: g };
}

export function crateMesh() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.6, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x8a6b3a, roughness: 0.9 }),
  );
  g.add(box);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 0.4), new THREE.MeshStandardMaterial({ color: 0x333333 }));
  g.add(strap);
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(4.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xff5a1f, transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
  );
  canopy.position.y = 5.4;
  canopy.visible = false;
  g.add(canopy);
  const lines = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 5.6, 4), new THREE.MeshBasicMaterial({ color: 0x222222 }));
    line.position.set(Math.cos(a) * 1.1, 2.9, Math.sin(a) * 1.1);
    line.rotation.z = Math.cos(a) * 0.45;
    line.rotation.x = -Math.sin(a) * 0.45;
    line.visible = false;
    g.add(line);
    lines.push(line);
  }
  return {
    group: g,
    setChute(open) {
      canopy.visible = open;
      for (const l of lines) l.visible = open;
    },
  };
}
