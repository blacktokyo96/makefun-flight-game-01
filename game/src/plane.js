import * as THREE from 'three';
export function createPlane() {
  const plane = new THREE.Group();
  const orange = new THREE.MeshStandardMaterial({color:0xf77328,roughness:0.4});
  const white = new THREE.MeshStandardMaterial({color:0xfff3d8,roughness:0.6});
  const dark = new THREE.MeshStandardMaterial({color:0x13343d,metalness:0.4,roughness:0.25});
  function part(geometry, material, x,y,z) { const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;plane.add(m);return m; }
  const body=part(new THREE.SphereGeometry(1,12,8),orange,0,0,0);body.scale.set(1.1,1.05,5.3);
  part(new THREE.BoxGeometry(14,0.24,2.6),white,0,0.15,0.1);
  for(const x of [-6.3,6.3])part(new THREE.BoxGeometry(1.4,0.28,2.64),orange,x,0.17,0.1);
  const glass=part(new THREE.SphereGeometry(1,12,8),dark,0,0.95,-0.3);glass.scale.set(0.85,0.85,1.8);
  part(new THREE.BoxGeometry(5,0.18,1.5),white,0,0.45,3.7);
  const fin=part(new THREE.BoxGeometry(0.16,2.3,1.8),orange,0,1.25,3.7);fin.rotation.x=-0.2;
  part(new THREE.BoxGeometry(0.2,0.3,5),white,0,1.1,2);
  const propeller=new THREE.Group();propeller.position.z=-5.25;plane.add(propeller);
  const blade=new THREE.Mesh(new THREE.BoxGeometry(0.23,5,0.15),dark);propeller.add(blade);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(2.5,32),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.08,side:THREE.DoubleSide}));propeller.add(disc);
  part(new THREE.SphereGeometry(0.45,12,8),white,0,0,-5.4);
  for(const x of [-1,1]){part(new THREE.BoxGeometry(0.16,1.5,0.16),dark,x,-1,0.6);const wheel=part(new THREE.CylinderGeometry(0.48,0.48,0.3,12),dark,x,-1.7,0.6);wheel.rotation.z=Math.PI/2;}
  for(const x of [-7,7]){const light=part(new THREE.SphereGeometry(0.16),new THREE.MeshBasicMaterial({color:x<0?0xff3344:0x66ffbb}),x,0.25,0);light.name='navigation light';}
  return {mesh:plane,propeller};
}
