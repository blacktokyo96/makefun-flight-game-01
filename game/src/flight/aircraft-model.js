// The Kestrel K-2: lathe fuselage, glass canopy, high wings, control surfaces, prop and lights.
import * as THREE from 'three';

function liveryTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#f4f6f7';
  g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#e86a17';
  g.fillRect(0, 26, 256, 9);
  g.fillStyle = '#1d3557';
  g.fillRect(0, 37, 256, 3);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function regTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 64);
  g.fillStyle = '#1d3557';
  g.font = 'bold 44px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('PK-MRP', 128, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildAircraft() {
  const group = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f6f7, roughness: 0.5, metalness: 0.15 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xe86a17, roughness: 0.5, metalness: 0.15 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x22282e, roughness: 0.6, metalness: 0.3 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x274b63, roughness: 0.12, metalness: 0.85, transparent: true, opacity: 0.9 });

  const profile = [
    [0.02, -3.2], [0.3, -3.05], [0.52, -2.3], [0.6, -1.2], [0.62, 0], [0.55, 1.1], [0.4, 2.1], [0.18, 2.8], [0.02, 3.05],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const fus = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 14),
    new THREE.MeshStandardMaterial({ map: liveryTexture(), roughness: 0.5, metalness: 0.15 }),
  );
  fus.geometry.rotateX(-Math.PI / 2);
  group.add(fus);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), glass);
  canopy.scale.set(0.9, 0.72, 1.7);
  canopy.position.set(0, 0.52, -0.7);
  group.add(canopy);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.12, 1.5), white);
  wing.position.set(0, 0.78, -0.2);
  group.add(wing);
  for (const s of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.13, 1.5), orange);
    tip.position.set(s * 3.55, 0.78, -0.2);
    group.add(tip);
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6), dark);
    strut.position.set(s * 1.1, 0.1, -0.1);
    strut.rotation.z = s * 0.6;
    group.add(strut);
  }

  const tail = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 0.9), white);
  tail.position.set(0, 0.28, 2.75);
  group.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.15, 1.05), white);
  fin.position.set(0, 0.75, 2.8);
  group.add(fin);
  const finTip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.22, 1.05), orange);
  finTip.position.set(0, 1.28, 2.8);
  group.add(finTip);

  const ailGeo = new THREE.BoxGeometry(1.5, 0.07, 0.55);
  const ailL = new THREE.Group();
  ailL.position.set(-2.6, 0.78, 0.55);
  const ailLm = new THREE.Mesh(ailGeo, white);
  ailLm.position.set(0, 0, 0.28);
  ailL.add(ailLm);
  group.add(ailL);
  const ailR = new THREE.Group();
  ailR.position.set(2.6, 0.78, 0.55);
  const ailRm = new THREE.Mesh(ailGeo, white);
  ailRm.position.set(0, 0, 0.28);
  ailR.add(ailRm);
  group.add(ailR);
  const elev = new THREE.Group();
  elev.position.set(0, 0.28, 3.2);
  const elevM = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.07, 0.5), white);
  elevM.position.set(0, 0, 0.25);
  elev.add(elevM);
  group.add(elev);
  const rudder = new THREE.Group();
  rudder.position.set(0, 0.75, 3.32);
  const rudM = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.1, 0.45), orange);
  rudM.position.set(0, 0, 0.22);
  rudder.add(rudM);
  group.add(rudder);

  const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 10), orange);
  spinner.geometry.rotateX(-Math.PI / 2);
  spinner.position.set(0, 0, -3.35);
  group.add(spinner);
  const prop = new THREE.Group();
  prop.position.set(0, 0, -3.3);
  const bladeGeo = new THREE.BoxGeometry(0.16, 1.5, 0.05);
  for (const a of [0, Math.PI]) {
    const b = new THREE.Mesh(bladeGeo, dark);
    b.rotation.z = a;
    prop.add(b);
  }
  group.add(prop);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.55, 24),
    new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.1, side: THREE.DoubleSide }),
  );
  disc.position.set(0, 0, -3.32);
  group.add(disc);

  const gear = new THREE.Group();
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.95, 6), dark);
    leg.position.set(s * 0.72, -0.85, -0.6);
    gear.add(leg);
    const pant = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), orange);
    pant.scale.set(0.7, 1, 1.5);
    pant.position.set(s * 0.72, -1.32, -0.6);
    gear.add(pant);
  }
  const noseLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), dark);
  noseLeg.position.set(0, -0.85, -2.2);
  gear.add(noseLeg);
  const noseWheel = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), dark);
  noseWheel.scale.set(0.8, 1, 1.2);
  noseWheel.position.set(0, -1.3, -2.2);
  gear.add(noseWheel);
  group.add(gear);

  const navL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
  navL.position.set(-3.82, 0.78, -0.2);
  group.add(navL);
  const navR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0x22ff44 }));
  navR.position.set(3.82, 0.78, -0.2);
  group.add(navR);
  const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  strobe.position.set(0, 1.42, 2.8);
  group.add(strobe);

  const reg = regTexture();
  for (const s of [-1, 1]) {
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 0.42),
      new THREE.MeshBasicMaterial({ map: reg, transparent: true }),
    );
    decal.position.set(s * 0.64, 0.08, 0.7);
    decal.rotation.y = s * Math.PI / 2;
    group.add(decal);
  }

  return {
    group,
    animate(controls, dt, time, rpm) {
      ailL.rotation.x = controls.roll * 0.45;
      ailR.rotation.x = -controls.roll * 0.45;
      elev.rotation.x = -controls.pitch * 0.4;
      rudder.rotation.y = controls.yaw * 0.5;
      prop.rotation.z += (4 + rpm * 26) * dt;
      disc.material.opacity = 0.05 + Math.min(0.12, rpm * 0.12);
      strobe.visible = time % 1.2 < 0.09;
    },
    setGear(down) {
      gear.visible = down;
    },
  };
}
