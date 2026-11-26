// Spring chase camera, cockpit camera, and shot overrides.
import * as THREE from 'three';
import { forwardVector } from '../flight/flight-model.js';

export function createCameraRig(camera) {
  const rig = {
    pos: new THREE.Vector3(0, 60, 700),
    look: new THREE.Vector3(0, 40, 0),
    override: null,
    update(dt, st, view) {
      if (rig.override) {
        camera.position.set(rig.override.position.x, rig.override.position.y, rig.override.position.z);
        camera.lookAt(rig.override.look.x, rig.override.look.y, rig.override.look.z);
        if (rig.override.fov && camera.fov !== rig.override.fov) {
          camera.fov = rig.override.fov;
          camera.updateProjectionMatrix();
        }
        return;
      }
      if (camera.fov !== 60) {
        camera.fov = 60;
        camera.updateProjectionMatrix();
      }
      const f = forwardVector(st.heading, st.pitch);
      if (view === 'cockpit') {
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(st.pitch, -st.heading, -st.roll, 'YXZ'));
        const seat = new THREE.Vector3(0, 1.25, -1.4).applyQuaternion(q);
        camera.position.set(st.pos.x + seat.x, st.pos.y + seat.y, st.pos.z + seat.z);
        const look = new THREE.Vector3(f.x, f.y - 0.07, f.z);
        camera.lookAt(st.pos.x + look.x * 100, st.pos.y + look.y * 100, st.pos.z + look.z * 100);
        camera.rotateZ(-st.roll * 0.35);
        return;
      }
      const desired = new THREE.Vector3(st.pos.x - f.x * 30, st.pos.y - f.y * 30 + 6.5, st.pos.z - f.z * 30);
      const k = 1 - Math.exp(-dt * 4.5);
      rig.pos.lerp(desired, k);
      const lookTarget = new THREE.Vector3(st.pos.x + f.x * 42, st.pos.y + f.y * 42 + 1, st.pos.z + f.z * 42);
      rig.look.lerp(lookTarget, 1 - Math.exp(-dt * 7));
      camera.position.copy(rig.pos);
      camera.lookAt(rig.look);
    },
  };
  return rig;
}
