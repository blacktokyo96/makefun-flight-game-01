// Held keys + one-shot press queue + mouse; axes(): roll, pitch, yaw, throttle, brake.
import { clamp } from './math-utils.js';

export class Input {
  constructor() {
    this.held = new Set();
    this.pressed = [];
    this.mouse = { active: false, dx: 0, dy: 0 };
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (!e.repeat) {
        this.held.add(e.code);
        this.pressed.push(e.code);
      }
    });
    window.addEventListener('keyup', (e) => this.held.delete(e.code));
    window.addEventListener('blur', () => this.held.clear());
    window.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        this.mouse.active = !this.mouse.active;
        this.mouse.dx = 0;
        this.mouse.dy = 0;
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (!this.mouse.active) return;
      this.mouse.dx = clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1);
      this.mouse.dy = clamp((e.clientY / window.innerHeight) * 2 - 1, -1, 1);
    });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  axes() {
    const h = this.held;
    let roll = (h.has('KeyD') ? 1 : 0) - (h.has('KeyA') ? 1 : 0);
    let pitch = (h.has('KeyS') ? 1 : 0) - (h.has('KeyW') ? 1 : 0);
    if (this.mouse.active) {
      roll += this.mouse.dx;
      pitch += -this.mouse.dy;
    }
    return {
      roll: clamp(roll, -1, 1),
      pitch: clamp(pitch, -1, 1),
      yaw: (h.has('KeyE') ? 1 : 0) - (h.has('KeyQ') ? 1 : 0),
      throttleAxis: (h.has('ShiftLeft') || h.has('ShiftRight') ? 1 : 0) - (h.has('ControlLeft') || h.has('ControlRight') ? 1 : 0),
      brake: h.has('Space'),
    };
  }

  consume(code) {
    const i = this.pressed.indexOf(code);
    if (i === -1) return false;
    this.pressed.splice(i, 1);
    return true;
  }

  endFrame() {
    this.pressed.length = 0;
  }
}
