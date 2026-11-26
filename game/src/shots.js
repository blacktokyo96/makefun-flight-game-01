import * as THREE from 'three';
export function readShot(){const q=new URLSearchParams(location.search);return {mode:['start','play','end'].includes(q.get('shot'))?q.get('shot'):null,seed:Number(q.get('seed')||1)};}
export function stageShot(s,mode){
  if(mode==='play'){s.state='flying';s.position.set(0,123,-560);s.speed=70;s.throttle=.78;s.fuel=83;s.time=43;s.roll=-.09;s.pitch=.025;s.message='GATE 01 • HOLD YOUR LINE';s.shotFraming={cameraOffset:[0,12,52],lookOffset:[0,-10,-100]};}
  else if(mode==='end'){s.state='landed';s.position.set(0,11,250);s.ring=6;s.score=9720;s.time=196;s.fuel=31;s.speed=0;s.message='MERAPI FIELD • SAFE LANDING';}
  else{s.position.copy(new THREE.Vector3(0,11,550));}
}
