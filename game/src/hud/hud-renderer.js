// Lays everything out on the HUD canvas in logical 640-px-high units; chase vs cockpit layout.
import { txt, rr } from './gauge-dials.js';
import {
  drawAirspeed,
  drawAttitude,
  drawAltimeter,
  drawHeading,
  drawVerticalSpeed,
  drawEngine,
} from './gauge-dials.js';
import { drawHeadingTape, drawSpeedTape, drawAltitudeTape, drawFlightPathMarker, drawTargetCue } from './hud-tapes.js';
import {
  drawSortieCard,
  drawSystemsBlock,
  drawWarnings,
  drawMissionBoard,
  drawBriefing,
  drawControlsHelp,
  drawDebrief,
  drawToast,
} from './mission-panels.js';
import { Minimap } from './minimap.js';
import { headingDeg } from '../core/math-utils.js';
import { UNITS } from '../core/config.js';
import { terrainHeight } from '../world/terrain-height.js';

export class HudRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.minimap = new Minimap();
    this.lastMission = null;
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  draw(vm) {
    const ctx = this.ctx;
    const Wpx = this.canvas.width;
    const Hpx = this.canvas.height;
    const s = Hpx / 640;
    const W = Wpx / s;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.clearRect(0, 0, W, 640);
    vm.W = W;
    vm.H = 640;
    if (vm.mission !== this.lastMission) {
      this.minimap.paint(vm.mission);
      this.lastMission = vm.mission;
    }
    if (vm.mode === 'menu') {
      this.drawMenu(ctx, vm, W);
      return;
    }
    this.drawFlight(ctx, vm, W);
    if (vm.mode === 'debrief' && vm.debrief) {
      drawDebrief(ctx, W - 364, 130, 344, vm.debrief);
    }
    if (vm.mode === 'paused') {
      ctx.save();
      ctx.fillStyle = 'rgba(8,16,24,0.55)';
      ctx.fillRect(0, 0, W, 640);
      ctx.restore();
      txt(ctx, 'PAUSED', W / 2, 300, 42, '#ffffff', 'center', '800');
      txt(ctx, 'P to resume · R to retry · ESC for the mission board', W / 2, 340, 14, '#cfe3f0', 'center', '600');
    }
  }

  drawMenu(ctx, vm, W) {
    ctx.save();
    ctx.fillStyle = 'rgba(8,16,24,0.72)';
    ctx.strokeStyle = '#e86a17';
    ctx.lineWidth = 2;
    rr(ctx, W / 2 - 260, 22, 520, 66, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    txt(ctx, 'MERAPI SKY PATROL', W / 2, 48, 34, '#ffffff', 'center', '800');
    txt(ctx, 'CENTRAL JAVA · 06:40 · WIND 040/08', W / 2, 74, 12, '#ffd21f', 'center', '700');
    drawMissionBoard(ctx, W - 436, 108, 420, vm.menu.missions, vm.menu.selected, vm.menu.bestStars);
    drawBriefing(ctx, 16, 500, 380, vm.menu.missions[vm.menu.selected]);
    drawControlsHelp(ctx, 412, 500, 372);
  }

  drawFlight(ctx, vm, W) {
    const st = vm.flight;
    const sys = vm.sys;
    const cx = W / 2;
    const hdg = headingDeg(st.heading);
    const bug = vm.next ? vm.next.bearing : null;
    if (vm.view === 'cockpit') this.drawStruts(ctx, W);
    drawHeadingTape(ctx, cx, 8, 460, hdg, bug);
    if (vm.mode !== 'debrief') {
      drawSpeedTape(ctx, cx - 205, 150, 220, st.speed * UNITS.MS_TO_KT);
      drawAltitudeTape(ctx, cx + 205, 150, 220, st.pos.y);
    }
    const f = vm.forward;
    if (f) {
      const fp = vm.project({ x: st.pos.x + f.x * 150, y: st.pos.y + f.y * 150, z: st.pos.z + f.z * 150 });
      drawFlightPathMarker(ctx, fp, st.roll);
    }
    drawTargetCue(ctx, vm);
    drawSortieCard(ctx, 16, 16, vm);
    if (vm.mode !== 'debrief') this.minimap.draw(ctx, W - 188, 40, st, vm.run);
    drawWarnings(ctx, cx, 104, sys.warnings, vm.time);
    if (vm.final) {
      const fin = vm.final;
      const state = fin.state;
      const label = 'FINAL · ' + fin.runway + ' · ' + fin.distKm.toFixed(1) + ' KM / GLIDE ' + fin.glideDeg.toFixed(1) + '° ' + state;
      const panelH = vm.view === 'cockpit' ? 170 : 132;
      const fy = 640 - panelH - 40;
      ctx.save();
      ctx.fillStyle = 'rgba(8,16,24,0.85)';
      ctx.strokeStyle = state === 'ON SLOPE' ? '#37d67a' : '#ffb020';
      ctx.lineWidth = 1.5;
      const tw = ctx.measureText(label).width;
      rr(ctx, cx - tw / 2 - 40, fy, tw + 80, 28, 5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      txt(ctx, label, cx, fy + 14, 14, state === 'ON SLOPE' ? '#37d67a' : '#ffb020', 'center', '700');
    }
    if (vm.toast) drawToast(ctx, cx, 175, vm.toast.text);
    this.drawPanel(ctx, vm, W);
  }

  drawStruts(ctx, W) {
    ctx.save();
    ctx.strokeStyle = 'rgba(12,18,24,0.92)';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(118, 474);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W - 6, 0);
    ctx.lineTo(W - 118, 474);
    ctx.stroke();
    ctx.restore();
  }

  drawPanel(ctx, vm, W) {
    const st = vm.flight;
    const sys = vm.sys;
    const cockpit = vm.view === 'cockpit';
    const ph = cockpit ? 170 : 132;
    const y0 = 640 - ph;
    ctx.save();
    const grad = ctx.createLinearGradient(0, y0, 0, 640);
    grad.addColorStop(0, 'rgba(10,18,26,0.92)');
    grad.addColorStop(1, 'rgba(6,12,18,0.96)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y0, W, ph);
    ctx.strokeStyle = '#3d5a70';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.lineTo(W, y0);
    ctx.stroke();
    ctx.restore();
    if (cockpit) {
      ctx.save();
      ctx.fillStyle = 'rgba(4,8,12,0.9)';
      ctx.fillRect(0, y0, W, 22);
      ctx.restore();
    }
    const r = cockpit ? 50 : 42;
    const cy = y0 + ph / 2 + (cockpit ? 8 : 4);
    const cx = W / 2;
    const kt = st.speed * UNITS.MS_TO_KT;
    const agl = Math.max(0, st.pos.y - terrainHeight(st.pos.x, st.pos.z) - 1.4);
    drawAirspeed(ctx, cx - 240, cy, r, kt);
    drawAttitude(ctx, cx - 144, cy, r, (st.pitch * 180) / Math.PI, st.roll);
    drawAltimeter(ctx, cx - 48, cy, r, st.pos.y);
    drawHeading(ctx, cx + 48, cy, r, headingDeg(st.heading), vm.next ? vm.next.bearing : null);
    drawVerticalSpeed(ctx, cx + 144, cy, r, st.verticalSpeed);
    drawEngine(ctx, cx + 240, cy, r, Math.min(1, sys.fuel / 60), st.throttle);
    drawSystemsBlock(ctx, 16, y0 + (cockpit ? 44 : 30), 190, st, sys);
    txt(ctx, 'AGL ' + Math.round(agl) + ' M', W - 220, y0 + 34, 15, '#ffffff', 'left', '700');
    txt(ctx, 'PK-MRP · KESTREL K-2', W - 220, y0 + 56, 12, '#cfe3f0', 'left', '600');
    txt(ctx, 'VIEW: ' + (cockpit ? 'COCKPIT' : 'CHASE') + ' [C]', W - 220, y0 + 76, 12, '#cfe3f0', 'left', '600');
  }
}
