import * as THREE from 'three';
import { seededRandom } from './random.js';
export function terrainHeight(x,z) {
  const valley=Math.min(1,Math.abs(x)/600);
  const hills=(100+85*Math.sin(x*.003+z*.002)+55*Math.cos(z*.005-x*.002))*valley;
  const cone= Math.max(0,1-Math.hypot(x-650,z+2350)/1050)*880;
  return Math.max(5,hills,cone);
}
export function createTerrain(scene,seed) {
  const rng=seededRandom(seed);scene.background=new THREE.Color(0xafdbe1);scene.fog=new THREE.FogExp2(0xb6d6d2,0.00018);
  const sky=new THREE.Mesh(new THREE.SphereGeometry(14000,32,20),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 v; void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;void main(){float h=normalize(v).y;gl_FragColor=vec4(mix(vec3(.93,.85,.65),vec3(.24,.61,.77),smoothstep(-.1,.8,h)),1.);}'}));scene.add(sky);
  scene.add(new THREE.HemisphereLight(0xe5f6ef,0x4e5c39,2.4));
  const sun=new THREE.DirectionalLight(0xffdfa7,3);sun.position.set(-1800,2600,-1900);scene.add(sun);
  const solar=new THREE.Mesh(new THREE.SphereGeometry(180,24,16),new THREE.MeshBasicMaterial({color:0xffebbc,fog:false}));solar.position.set(-3400,2800,-6500);scene.add(solar);
  const geo=new THREE.PlaneGeometry(11000,11000,150,150);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;const colors=[];const c=new THREE.Color();
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=terrainHeight(x,z);p.setY(i,y);c.setHex(y>590?0x625d54:y>360?0x718057:y>130?0x668748:0x80a856);c.multiplyScalar(.84+rng()*.28);colors.push(c.r,c.g,c.b);}
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();scene.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1})));
  function box(w,h,d,color,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.9}));m.position.set(x,y,z);scene.add(m);return m;}
  box(115,2,1280,0x637b4a,0,6,280);box(48,1,1100,0x34464a,0,8,300);
  for(let z=-210;z<840;z+=85)box(2,.1,38,0xffefc9,0,8.6,z);
  for(const x of [-19,19]){box(1,.1,1060,0xdce0c6,x,8.6,300);for(let z=-230;z<850;z+=65){const lamp=new THREE.Mesh(new THREE.SphereGeometry(.9,6,4),new THREE.MeshBasicMaterial({color:0xffd895}));lamp.position.set(x*1.35,10,z);scene.add(lamp);}}
  for(const z of [-195,780])for(let x=-16;x<=16;x+=6)box(3,.15,32,0xfff1d4,x,8.6,z);
  box(42,18,48,0xc3bba0,90,15,580);const roof=box(46,4,54,0x52676a,90,26,580);roof.rotation.z=.06;box(9,40,9,0xa4aa94,70,26,490);box(20,8,18,0x32535b,70,48,490);
  for(let i=0;i<450;i++){const x=(rng()-.5)*6500,z=(rng()-.5)*6500;if(Math.abs(x)<90||terrainHeight(x,z)>580)continue;const h=8+rng()*18;const tree=new THREE.Mesh(new THREE.ConeGeometry(h*.45,h,5),new THREE.MeshStandardMaterial({color:rng()>.5?0x385d3f:0x486f43,flatShading:true}));tree.position.set(x,terrainHeight(x,z)+h/2,z);scene.add(tree);}
  const smoke=[];for(let i=0;i<18;i++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(50+i*5,1),new THREE.MeshStandardMaterial({color:0x929a92,transparent:true,opacity:.5-i*.019,flatShading:true,depthWrite:false}));m.position.set(650+i*13,885+i*37,-2350+i*8);m.scale.set(1,1.2,.9);scene.add(m);smoke.push(m);}
  const crater=new THREE.Mesh(new THREE.TorusGeometry(48,10,6,24),new THREE.MeshStandardMaterial({color:0x443e37}));crater.rotation.x=Math.PI/2;crater.position.set(650,879,-2350);scene.add(crater);
  for(let i=0;i<30;i++){const group=new THREE.Group();group.position.set((rng()-.5)*8000,700+rng()*900,(rng()-.5)*8000);for(let j=0;j<5;j++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(70+rng()*90,1),new THREE.MeshStandardMaterial({color:0xfaf2dd,flatShading:true,transparent:true,opacity:.83}));m.position.set(j*85,rng()*30,0);m.scale.y=.4;group.add(m);}scene.add(group);}
  return {smoke};
}
