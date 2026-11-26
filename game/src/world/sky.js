// Gradient sky dome, hemisphere + sun light, and fog.
import * as THREE from 'three';

export function buildSky(scene) {
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(28000, 24, 14),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(0x6ea8dd) },
        mid: { value: new THREE.Color(0xcfdfef) },
        low: { value: new THREE.Color(0xf6d9a8) },
        sunDir: { value: new THREE.Vector3(0.85, 0.28, 0.25).normalize() },
        sunCol: { value: new THREE.Color(0xffe9b8) },
      },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: [
        'varying vec3 vDir; uniform vec3 top; uniform vec3 mid; uniform vec3 low; uniform vec3 sunDir; uniform vec3 sunCol;',
        'void main(){',
        ' float h = clamp(vDir.y, -0.08, 1.0);',
        ' vec3 c = h > 0.22 ? mix(mid, top, smoothstep(0.22, 0.75, h)) : mix(low, mid, smoothstep(-0.08, 0.22, h));',
        ' float s = pow(max(dot(normalize(vDir), normalize(sunDir)), 0.0), 90.0);',
        ' c += sunCol * s * 0.9;',
        ' float halo = pow(max(dot(normalize(vDir), normalize(sunDir)), 0.0), 7.0);',
        ' c += sunCol * halo * 0.18;',
        ' gl_FragColor = vec4(c, 1.0);',
        '}',
      ].join('\n'),
    }),
  );
  scene.add(dome);
  const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x8a7a5a, 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe2b0, 1.7);
  sun.position.set(9000, 3200, 2800);
  scene.add(sun);
  scene.fog = new THREE.Fog(0xdfe9f2, 6000, 24000);
  return { sun };
}
