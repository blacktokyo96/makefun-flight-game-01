export function createInput() {
  const keys=new Set();const mouse={x:0,y:0,active:false};
  addEventListener('keydown',e=>{keys.add(e.code);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();});
  addEventListener('keyup',e=>keys.delete(e.code));
  addEventListener('blur',()=>keys.clear());
  addEventListener('pointermove',e=>{mouse.x=(e.clientX/innerWidth-.5)*2;mouse.y=(e.clientY/innerHeight-.5)*2;mouse.active=true;});
  return {keys, axes:()=>({roll:Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA'))+(mouse.active?mouse.x*.24:0),pitch:Number(keys.has('ArrowDown')||keys.has('KeyS'))-Number(keys.has('ArrowUp')||keys.has('KeyW'))+(mouse.active?mouse.y*.15:0),throttle:Number(keys.has('ShiftLeft')||keys.has('ShiftRight'))-Number(keys.has('ControlLeft')||keys.has('ControlRight'))})};
}
