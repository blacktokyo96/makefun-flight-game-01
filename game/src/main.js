import * as THREE from 'three';
import { FLIGHT,RINGS } from './config.js';
import { createTerrain,terrainHeight } from './terrain.js';
import { createPlane } from './plane.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { updateHUD,showPanel } from './hud.js';
import { readShot,stageShot } from './shots.js';
const shot=readShot(),scene=new THREE.Scene();
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;document.getElementById('canvas').appendChild(renderer.domElement);
const camera=new THREE.PerspectiveCamera(57,innerWidth/innerHeight,1,18000);
const world=createTerrain(scene,shot.seed),aircraft=createPlane();scene.add(aircraft.mesh);
const input=createInput(),audio=createAudio();
let staged=Boolean(shot.mode);
const s={state:'title',position:new THREE.Vector3(0,11,550),heading:0,pitch:0,roll:0,speed:0,throttle:.72,fuel:100,health:100,ring:0,score:0,time:0,message:'MERAPI FIELD • DEPARTURE RUNWAY 36'};
const rings=RINGS.map((p,i)=>{const group=new THREE.Group();group.position.set(...p);const material=new THREE.MeshStandardMaterial({color:0xffbc41,emissive:0xffa020,emissiveIntensity:.65,metalness:.5,roughness:.3});const torus=new THREE.Mesh(new THREE.TorusGeometry(FLIGHT.ringRadius,1.8,10,64),material);group.add(torus);for(let j=0;j<12;j++){const a=j*Math.PI/6;const bar=new THREE.Mesh(new THREE.BoxGeometry(3,8,2),new THREE.MeshBasicMaterial({color:0xffedb0}));bar.position.set(Math.cos(a)*40,Math.sin(a)*40,0);bar.rotation.z=a-Math.PI/2;group.add(bar);}const next=i<5?new THREE.Vector3(...RINGS[i+1]):new THREE.Vector3(0,30,300);const prev=i?new THREE.Vector3(...RINGS[i-1]):new THREE.Vector3(0,80,100);const direction=next.sub(prev).normalize();group.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),direction);scene.add(group);return group;});
stageShot(s,shot.mode);showPanel(s.state,s.score);
function launch(){staged=false;Object.assign(s,{state:'flying',heading:0,pitch:.04,roll:0,speed:48,throttle:.8,fuel:100,health:100,ring:0,score:0,time:0,message:'FOLLOW THE GOLDEN GATES • SIX TO CLEAR'});s.position.set(0,65,100);audio.start();showPanel('flying');}
document.getElementById('panel').addEventListener('click',e=>{if(e.target.closest('button'))launch();});
addEventListener('keydown',e=>{if(e.code==='KeyR'||(e.code==='Enter'&&s.state!=='flying'))launch();});
function finish(state){s.state=state;if(state==='landed'){s.score+=2500+Math.max(0,Math.round(1800-s.time*3));s.message='ALL GATES CLEARED • SAFE ARRIVAL';audio.land();}else{audio.crash();s.message=state==='crashed'?'AIRFRAME LOST • R TO RESTART':'NO FUEL • R TO RESTART';}showPanel(state,s.score);}
const forward=new THREE.Vector3(),desiredCamera=new THREE.Vector3(),look=new THREE.Vector3();
function updateFlight(dt){
  const a=input.axes();s.time+=dt;s.throttle=THREE.MathUtils.clamp(s.throttle+a.throttle*dt*.3,0,1);s.fuel=Math.max(0,s.fuel-dt*(.08+s.throttle*FLIGHT.fuelDrain));
  s.roll=THREE.MathUtils.clamp(s.roll-a.roll*dt*1.2-s.roll*dt*.65,-1.05,1.05);s.pitch=THREE.MathUtils.clamp(s.pitch-a.pitch*dt*.42-s.pitch*dt*.12,-.5,.45);
  s.heading+=s.roll*dt*.45;s.speed+=((FLIGHT.minSpeed+s.throttle*(FLIGHT.maxSpeed-FLIGHT.minSpeed))-s.speed)*dt*.25-s.pitch*dt*8;
  const stall=Math.max(0,FLIGHT.stallSpeed-s.speed);forward.set(-Math.sin(s.heading)*Math.cos(s.pitch),Math.sin(s.pitch),-Math.cos(s.heading)*Math.cos(s.pitch));s.position.addScaledVector(forward,s.speed*dt);s.position.y+=(Math.min(3,(s.speed-45)*.12)-stall*1.7)*dt;
  s.message=stall>0?'STALL WARNING • LOWER NOSE / ADD THROTTLE':s.ring<6?'FOLLOW THE GOLDEN GATES • BANK TO TURN':'ALL GATES CLEARED • LAND RUNWAY 18 / 36';
  if(s.ring<6&&s.position.distanceTo(rings[s.ring].position)<FLIGHT.ringRadius){s.ring++;s.score+=1000;audio.ring();}
  const ground=terrainHeight(s.position.x,s.position.z);const runway=Math.abs(s.position.x)<23&&s.position.z>-240&&s.position.z<850;
  const floor=runway?9:ground;
  if(s.position.y<floor+2){const descent=Math.abs(Math.sin(s.pitch)*s.speed-stall*1.7);if(runway&&s.ring===6&&s.speed<59&&descent<9&&Math.abs(s.roll)<.25){s.position.y=11;finish('landed');}else{s.health-=Math.max(25,descent*8+s.speed*.6);s.position.y=floor+4;s.pitch=.15;s.speed*=.65;if(s.health<=0)finish('crashed');else s.message='HARD IMPACT • AIRFRAME DAMAGED';}}
  if(s.fuel<=0&&s.state==='flying')finish('outOfFuel');
}
let previous=performance.now();let cameraReady=false;
function frame(now){const dt=Math.min(.035,(now-previous)/1000);previous=now;if(s.state==='flying'&&!staged)updateFlight(dt);
  aircraft.mesh.position.copy(s.position);aircraft.mesh.rotation.set(s.pitch,s.heading,s.roll,'YXZ');aircraft.propeller.rotation.z=staged?1.2:aircraft.propeller.rotation.z+dt*(s.state==='flying'?65:12);
  const behind=new THREE.Vector3(Math.sin(s.heading)*43,17,Math.cos(s.heading)*43);desiredCamera.copy(s.position).add(behind);if(staged&&shot.mode==='play'&&s.shotFraming)desiredCamera.copy(s.position).add(new THREE.Vector3(...s.shotFraming.cameraOffset));if(s.state==='title'){desiredCamera.set(-30,26,607);}if(s.state==='landed'){desiredCamera.set(-30,25,307);}
  if(!cameraReady){camera.position.copy(desiredCamera);cameraReady=true;}else camera.position.lerp(desiredCamera,1-Math.exp(-dt*4));look.copy(s.position).add(new THREE.Vector3(-Math.sin(s.heading)*100,9,-Math.cos(s.heading)*100));if(s.state==='title'||s.state==='landed')look.set(0,35,-400);if(staged&&shot.mode==='play'&&s.shotFraming)look.copy(s.position).add(new THREE.Vector3(...s.shotFraming.lookOffset));camera.lookAt(look);
  rings.forEach((r,i)=>{r.visible=i>=s.ring;r.children[0].material.emissiveIntensity=i===s.ring?1.2:.12;r.scale.setScalar(i===s.ring?1: .9);});
  world.smoke.forEach((m,i)=>{m.rotation.y=staged?i*.3:m.rotation.y+dt*.025;m.rotation.z=Math.sin((staged?1000:now)*.00015+i)*.08;});
  const target=s.ring<6?rings[s.ring].position:new THREE.Vector3(0,10,300);
  s.targetBearing=Math.atan2(-(target.x-s.position.x),-(target.z-s.position.z))-s.heading;
  const distance=s.ring<6?s.position.distanceTo(rings[s.ring].position):s.position.distanceTo(new THREE.Vector3(0,10,300));updateHUD(s,terrainHeight(s.position.x,s.position.z),distance);audio.update(s.throttle,s.speed,s.state==='flying');renderer.render(scene,camera);requestAnimationFrame(frame);
}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});requestAnimationFrame(frame);
