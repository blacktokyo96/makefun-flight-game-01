// North-up minimap, painted once from the terrain, with runways, plume and objectives.
import { terrainHeight, terrainColour } from '../world/terrain-height.js';
import { RUNWAYS, WORLD } from '../core/config.js';
import { headingDeg } from '../core/math-utils.js';
import { txt } from './gauge-dials.js';

const MAP = { x0: -4500, x1: 4500, z0: -6500, z1: 2500, size: 172 };

export class Minimap {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = MAP.size;
    this.canvas.height = MAP.size;
    this.paint(null);
  }

  paint(mission) {
    const g = this.canvas.getContext('2d');
    const img = g.createImageData(MAP.size, MAP.size);
    const steps = 86;
    for (let py = 0; py < steps; py++) {
      for (let px = 0; px < steps; px++) {
        const wx = MAP.x0 + ((px + 0.5) / steps) * (MAP.x1 - MAP.x0);
        const wz = MAP.z0 + ((py + 0.5) / steps) * (MAP.z1 - MAP.z0);
        const h = terrainHeight(wx, wz);
        const c = terrainColour(h, 0, wx, wz);
        for (let oy = 0; oy < 2; oy++) {
          for (let ox = 0; ox < 2; ox++) {
            const idx = ((py * 2 + oy) * MAP.size + px * 2 + ox) * 4;
            img.data[idx] = Math.round(c[0] * 255);
            img.data[idx + 1] = Math.round(c[1] * 255);
            img.data[idx + 2] = Math.round(c[2] * 255);
            img.data[idx + 3] = 255;
          }
        }
      }
    }
    g.putImageData(img, 0, 0);
    const toMap = (x, z) => [
      ((x - MAP.x0) / (MAP.x1 - MAP.x0)) * MAP.size,
      ((z - MAP.z0) / (MAP.z1 - MAP.z0)) * MAP.size,
    ];
    for (const rw of RUNWAYS) {
      const [mx, my] = toMap(rw.x, rw.z);
      g.save();
      g.translate(mx, my);
      g.fillStyle = '#3a3f45';
      g.fillRect(-2, (-rw.length / 2 / (MAP.z1 - MAP.z0)) * MAP.size, 4, (rw.length / (MAP.z1 - MAP.z0)) * MAP.size);
      g.restore();
    }
    const [px, py] = toMap(WORLD.plume.from.x, WORLD.plume.from.z);
    g.fillStyle = 'rgba(140,140,135,0.85)';
    g.beginPath();
    g.arc(px, py, 7, 0, Math.PI * 2);
    g.fill();
    if (mission) {
      for (const o of mission.objectives) {
        if (o.x === undefined) continue;
        const [ox, oy] = toMap(o.x, o.z);
        g.fillStyle = o.kind === 'gate' ? '#ffd21f' : o.kind === 'beacon' ? '#00e5ff' : '#ff4040';
        g.beginPath();
        g.arc(ox, oy, 3, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  draw(ctx, x, y, st, run) {
    ctx.save();
    ctx.fillStyle = 'rgba(8,16,24,0.85)';
    ctx.strokeStyle = '#3d5a70';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(x - 4, y - 22, MAP.size + 8, MAP.size + 26);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.drawImage(this.canvas, x, y, MAP.size, MAP.size);
    txt(ctx, 'MAP · N↑ · MERAPI VALLEY', x + MAP.size / 2, y - 11, 10, '#cfe3f0', 'center', '700');
    const toMap = (wx, wz) => [
      x + ((wx - MAP.x0) / (MAP.x1 - MAP.x0)) * MAP.size,
      y + ((wz - MAP.z0) / (MAP.z1 - MAP.z0)) * MAP.size,
    ];
    if (run && run.nextObjective) {
      const [ox, oy] = toMap(run.nextObjective.x, run.nextObjective.z);
      ctx.save();
      ctx.strokeStyle = '#ff3df0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ox, oy, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    const [ax, ay] = toMap(st.pos.x, st.pos.z);
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate((headingDeg(st.heading) * Math.PI) / 180);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#081018';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
