// Heading, speed and altitude tapes, the flight-path marker and the target cue.
import { txt, rr } from './gauge-dials.js';
import { headingDeg } from '../core/math-utils.js';

function tapeBox(ctx, x, y, w, h, text, sub) {
  ctx.save();
  ctx.fillStyle = 'rgba(8,16,24,0.88)';
  ctx.strokeStyle = '#3d5a70';
  ctx.lineWidth = 1.5;
  rr(ctx, x - w / 2, y - h / 2, w, h, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  txt(ctx, text, x, y - (sub ? 7 : 0), 15, '#ffffff', 'center', '700');
  if (sub) txt(ctx, sub, x, y + 8, 9, '#8fb4c9');
}

export function drawHeadingTape(ctx, cx, y, w, hdgDeg, bugDeg) {
  ctx.save();
  ctx.fillStyle = 'rgba(8,16,24,0.72)';
  rr(ctx, cx - w / 2, y, w, 30, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.rect(cx - w / 2, y, w, 30);
  ctx.clip();
  const pxPerDeg = w / 70;
  for (let d = -35; d <= 35; d += 5) {
    const deg = Math.round(((hdgDeg + d) % 360 + 360) % 360);
    const x = cx + d * pxPerDeg;
    const big = deg % 15 === 0;
    ctx.strokeStyle = '#cfe3f0';
    ctx.lineWidth = big ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 30);
    ctx.lineTo(x, y + 30 - (big ? 12 : 7));
    ctx.stroke();
    if (big) {
      const label = deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'W' : String(deg);
      txt(ctx, label, x, y + 10, 11, '#ffffff', 'center', '700');
    }
  }
  ctx.restore();
  if (bugDeg !== null && bugDeg !== undefined) {
    let rel = ((bugDeg - hdgDeg) % 360 + 540) % 360 - 180;
    rel = Math.max(-33, Math.min(33, rel));
    ctx.save();
    ctx.fillStyle = '#ff3df0';
    ctx.beginPath();
    ctx.moveTo(cx + rel * pxPerDeg, y + 30);
    ctx.lineTo(cx + rel * pxPerDeg - 6, y + 40);
    ctx.lineTo(cx + rel * pxPerDeg + 6, y + 40);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, y + 30);
  ctx.lineTo(cx, y + 40);
  ctx.stroke();
  ctx.restore();
  tapeBox(ctx, cx, y + 54, 64, 24, String(Math.round(hdgDeg)).padStart(3, '0') + '°');
}

export function drawSpeedTape(ctx, x, cy, h, kt) {
  ctx.save();
  ctx.fillStyle = 'rgba(8,16,24,0.72)';
  rr(ctx, x - 34, cy - h / 2, 68, h, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.rect(x - 34, cy - h / 2, 68, h);
  ctx.clip();
  const pxPerKt = h / 90;
  for (let k = -45; k <= 45; k += 5) {
    const v = Math.round(kt + k);
    if (v < 0) continue;
    const y = cy - k * pxPerKt;
    const big = v % 20 === 0;
    ctx.strokeStyle = '#cfe3f0';
    ctx.lineWidth = big ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x + 30, y);
    ctx.lineTo(x + 30 - (big ? 12 : 7), y);
    ctx.stroke();
    if (big) txt(ctx, String(v), x - 2, y, 11, '#ffffff', 'right', '700');
  }
  ctx.restore();
  tapeBox(ctx, x, cy, 66, 26, Math.round(kt) + '', 'KT');
}

export function drawAltitudeTape(ctx, x, cy, h, altM) {
  ctx.save();
  ctx.fillStyle = 'rgba(8,16,24,0.72)';
  rr(ctx, x - 34, cy - h / 2, 68, h, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.rect(x - 34, cy - h / 2, 68, h);
  ctx.clip();
  const pxPerM = h / 700;
  for (let dm = -350; dm <= 350; dm += 25) {
    const v = Math.round((altM + dm) / 25) * 25;
    const y = cy - (v - altM) * pxPerM;
    if (y < cy - h / 2 - 4 || y > cy + h / 2 + 4) continue;
    const big = v % 100 === 0;
    ctx.strokeStyle = '#cfe3f0';
    ctx.lineWidth = big ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x - 30, y);
    ctx.lineTo(x - 30 + (big ? 12 : 7), y);
    ctx.stroke();
    if (big) txt(ctx, String(v), x + 2, y, 11, '#ffffff', 'left', '700');
  }
  ctx.restore();
  tapeBox(ctx, x, cy, 66, 26, Math.round(altM) + '', 'M MSL');
}

export function drawFlightPathMarker(ctx, p, rollRad) {
  if (!p || p.behind) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(rollRad);
  ctx.strokeStyle = '#37e08a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(-11, 0);
  ctx.moveTo(11, 0);
  ctx.lineTo(22, 0);
  ctx.moveTo(0, -11);
  ctx.lineTo(0, -20);
  ctx.stroke();
  ctx.restore();
}

export function drawTargetCue(ctx, vm) {
  const t = vm.next;
  if (!t || !t.projected) return;
  const p = t.projected;
  const W = vm.W;
  const H = vm.H;
  const label = t.label + '  ' + t.distKm.toFixed(1) + ' KM';
  if (!p.behind && p.x > 20 && p.x < W - 20 && p.y > 90 && p.y < H - 170) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = '#ffd21f';
    ctx.lineWidth = 3;
    ctx.strokeRect(-9, -9, 18, 18);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = 'rgba(8,16,24,0.8)';
    const tw = ctx.measureText(label).width;
    rr(ctx, p.x - tw / 2 - 28, p.y - 42, tw + 56, 20, 4);
    ctx.fill();
    ctx.restore();
    txt(ctx, label, p.x, p.y - 32, 12, '#ffd21f', 'center', '700');
    return;
  }
  const cx = W / 2;
  const cy = (H - 170) / 2 + 60;
  const ex = Math.max(30, Math.min(W - 30, p.x));
  const ey = Math.max(100, Math.min(H - 190, p.y));
  const ang = Math.atan2(ey - cy, ex - cx);
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(ang);
  ctx.fillStyle = '#ffd21f';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-8, -9);
  ctx.lineTo(-8, 9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  txt(ctx, label, ex, ey + 20, 11, '#ffd21f', 'center', '700');
}

export function bearingTo(from, to) {
  return headingDeg(Math.atan2(to.x - from.x, -(to.z - from.z)));
}
