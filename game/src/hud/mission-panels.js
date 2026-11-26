// Sortie card, systems block, warnings, mission board, briefing and debrief panels.
import { txt, rr } from './gauge-dials.js';
import { formatTime, clamp } from '../core/math-utils.js';
import { KEYS_HELP } from '../core/config.js';

export function drawSortieCard(ctx, x, y, vm) {
  const run = vm.run;
  const m = vm.mission;
  ctx.save();
  ctx.fillStyle = 'rgba(8,16,24,0.78)';
  ctx.strokeStyle = '#3d5a70';
  ctx.lineWidth = 1.5;
  const rows = m.objectives.length;
  const h = 78 + rows * 20 + (run.crates !== undefined ? 20 : 0) + (run.sensor !== undefined ? 20 : 0);
  rr(ctx, x, y, 252, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = '#e86a17';
  rr(ctx, x + 10, y + 10, 62, 20, 3);
  ctx.fill();
  ctx.restore();
  txt(ctx, m.tag, x + 41, y + 20, 11, '#ffffff', 'center', '800');
  txt(ctx, m.title, x + 82, y + 20, 15, '#ffffff', 'left', '700');
  txt(ctx, formatTime(run.time) + (m.par ? ' / ' + formatTime(m.par) : ''), x + 242, y + 20, 12, '#cfe3f0', 'right', '600');
  txt(ctx, 'SCORE ' + run.score, x + 10, y + 44, 13, '#ffd21f', 'left', '700');
  txt(ctx, 'FUEL ' + run.fuel.toFixed(1) + ' L', x + 242, y + 44, 12, run.fuel < 5 ? '#ff4040' : '#cfe3f0', 'right', '600');
  let yy = y + 66;
  m.objectives.forEach((o, i) => {
    const st = run.states[i];
    const mark = st === 'done' ? '✓' : st === 'active' ? '▶' : '○';
    const col = st === 'done' ? '#37d67a' : st === 'active' ? '#ffd21f' : '#8fb4c9';
    txt(ctx, mark, x + 18, yy, 13, col, 'center', '700');
    txt(ctx, o.label + (st === 'done' && run.results[i] ? ' — ' + run.results[i] : ''), x + 30, yy, 12, st === 'done' ? '#9fb8c8' : '#ffffff', 'left', '600');
    yy += 20;
  });
  if (run.crates !== undefined) {
    txt(ctx, 'CRATES ABOARD ' + run.cratesLeft + '/3  [B] DROP', x + 10, yy + 4, 12, '#ffd21f', 'left', '700');
    yy += 20;
  }
  if (run.sensor !== undefined) {
    txt(ctx, 'SENSOR LOCK ' + run.sensor.toFixed(1) + ' / 3.0 s', x + 10, yy + 4, 12, '#00e5ff', 'left', '700');
  }
}

export function drawSystemsBlock(ctx, x, y, w, st, sys) {
  const bars = [
    ['THROTTLE', st.throttle, '#37d67a'],
    ['FUEL', clamp(sys.fuel / 60, 0, 1), sys.fuel < 5 ? '#ff4040' : '#37d67a'],
    ['DAMAGE', sys.damage / 100, sys.damage > 60 ? '#ff4040' : '#ffb020'],
  ];
  let yy = y;
  for (const [label, v, col] of bars) {
    txt(ctx, label, x, yy + 7, 10, '#8fb4c9', 'left', '700');
    ctx.save();
    ctx.fillStyle = '#16222c';
    rr(ctx, x + 78, yy, w - 78, 13, 3);
    ctx.fill();
    ctx.fillStyle = col;
    if (v > 0.01) {
      rr(ctx, x + 78, yy, Math.max(4, (w - 78) * clamp(v, 0, 1)), 13, 3);
      ctx.fill();
    }
    ctx.restore();
    yy += 19;
  }
  const lamps = [
    ['GEAR', st.gear, '#37d67a'],
    ['FLAP ' + st.flaps, st.flaps > 0, '#37d67a'],
    ['BRAKE', st.brake, '#ffb020'],
    ['G ' + st.g.toFixed(1), st.g > 4.6, st.g > 4.6 ? '#ff4040' : '#37d67a'],
  ];
  let lx = x;
  for (const [label, on, col] of lamps) {
    ctx.save();
    ctx.fillStyle = on ? col : '#16222c';
    ctx.strokeStyle = '#3d5a70';
    rr(ctx, lx, yy + 2, 44, 18, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    txt(ctx, label, lx + 22, yy + 11, 10, on ? '#081018' : '#8fb4c9', 'center', '800');
    lx += 48;
  }
}

export function drawWarnings(ctx, cx, y, warnings, time) {
  if (!warnings.length) return;
  const flash = Math.floor(time * 2.4) % 2 === 0;
  let yy = y;
  for (const w of warnings) {
    const col = w.level === 'red' ? '#ff4040' : '#ffb020';
    ctx.save();
    ctx.globalAlpha = w.level === 'red' && !flash ? 0.45 : 1;
    ctx.fillStyle = 'rgba(8,16,24,0.85)';
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    const tw = ctx.measureText(w.text).width;
    rr(ctx, cx - tw / 2 - 32, yy, tw + 64, 26, 4);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    txt(ctx, '⚠ ' + w.text, cx, yy + 13, 14, col, 'center', '800');
    yy += 32;
  }
}

export function drawMissionBoard(ctx, x, y, w, missions, selected, bestStars) {
  ctx.save();
  ctx.fillStyle = 'rgba(8,16,24,0.82)';
  ctx.strokeStyle = '#3d5a70';
  ctx.lineWidth = 1.5;
  rr(ctx, x, y, w, 56 + missions.length * 62, 8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  txt(ctx, 'MISSION BOARD', x + 16, y + 22, 15, '#ffffff', 'left', '800');
  txt(ctx, '↑↓ or 1–5 · ENTER to fly', x + w - 16, y + 22, 11, '#8fb4c9', 'right', '600');
  let yy = y + 44;
  missions.forEach((m, i) => {
    const sel = i === selected;
    ctx.save();
    ctx.fillStyle = sel ? 'rgba(232,106,23,0.25)' : 'rgba(22,34,44,0.9)';
    ctx.strokeStyle = sel ? '#e86a17' : '#2c4254';
    ctx.lineWidth = sel ? 2 : 1;
    rr(ctx, x + 10, yy, w - 20, 54, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = '#e86a17';
    rr(ctx, x + 20, yy + 9, 58, 18, 3);
    ctx.fill();
    ctx.restore();
    txt(ctx, m.tag, x + 49, yy + 18, 10, '#ffffff', 'center', '800');
    txt(ctx, m.title, x + 88, yy + 18, 15, '#ffffff', 'left', '700');
    txt(ctx, m.fuel + ' L · PAR ' + (m.par ? formatTime(m.par) : '—') + ' · ' + m.objectives.length + ' objectives', x + 88, yy + 38, 11, '#cfe3f0', 'left', '600');
    const stars = bestStars[m.id] || 0;
    txt(ctx, '★'.repeat(stars) + '☆'.repeat(3 - stars), x + w - 24, yy + 18, 14, '#ffd21f', 'right', '700');
    yy += 62;
  });
}

export function drawBriefing(ctx, x, y, w, mission) {
  ctx.save();
  ctx.fillStyle = 'rgba(8,16,24,0.82)';
  ctx.strokeStyle = '#3d5a70';
  ctx.lineWidth = 1.5;
  rr(ctx, x, y, w, 108, 8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  txt(ctx, 'BRIEFING — ' + mission.title.toUpperCase(), x + 14, y + 18, 13, '#ffd21f', 'left', '800');
  const words = mission.brief.split(' ');
  let line = '';
  let yy = y + 42;
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (const word of words) {
    if (ctx.measureText(line + ' ' + word).width > w - 28) {
      ctx.fillText(line.trim(), x + 14, yy);
      line = word;
      yy += 18;
    } else {
      line += ' ' + word;
    }
  }
  ctx.fillText(line.trim(), x + 14, yy);
}

export function drawControlsHelp(ctx, x, y, w) {
  const half = Math.ceil(KEYS_HELP.length / 2);
  ctx.save();
  ctx.fillStyle = 'rgba(8,16,24,0.7)';
  rr(ctx, x, y, w, 30 + half * 15, 6);
  ctx.fill();
  ctx.restore();
  txt(ctx, 'CONTROLS', x + 12, y + 15, 12, '#ffd21f', 'left', '800');
  for (let col = 0; col < 2; col++) {
    const cx = x + 12 + col * 180;
    for (let i = 0; i < half; i++) {
      const item = KEYS_HELP[col * half + i];
      if (!item) continue;
      const yy = y + 34 + i * 15;
      txt(ctx, item[0], cx, yy, 10, '#ffffff', 'left', '700');
      txt(ctx, item[1], cx + 92, yy, 10, '#cfe3f0', 'left', '600');
    }
  }
}

export function drawDebrief(ctx, x, y, w, d) {
  ctx.save();
  ctx.fillStyle = 'rgba(8,16,24,0.88)';
  ctx.strokeStyle = d.lost ? '#ff4040' : '#37d67a';
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, 320, 8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  txt(ctx, d.lost ? 'AIRCRAFT LOST' : d.grade + ' LANDING', x + w / 2, y + 26, 22, d.lost ? '#ff4040' : '#37d67a', 'center', '800');
  if (d.lost) txt(ctx, d.reason, x + w / 2, y + 50, 13, '#ffffff', 'center', '600');
  else txt(ctx, 'Touchdown ' + d.touchdown.sink.toFixed(1) + ' m/s sink · ' + d.touchdown.offset.toFixed(1) + ' m off centreline', x + w / 2, y + 50, 12, '#cfe3f0', 'center', '600');
  const rows = [
    ['Objectives', d.objectivePoints],
    ['Landing', d.landingPoints],
    ['Time bonus', d.timeBonus],
    ['Fuel bonus', d.fuelBonus],
    ['Damage', -d.damagePenalty],
  ];
  let yy = y + 82;
  for (const [label, pts] of rows) {
    txt(ctx, label, x + 20, yy, 14, '#ffffff', 'left', '600');
    txt(ctx, (pts >= 0 ? '+' : '') + pts, x + w - 20, yy, 14, '#ffffff', 'right', '700');
    yy += 26;
  }
  ctx.save();
  ctx.strokeStyle = '#3d5a70';
  ctx.beginPath();
  ctx.moveTo(x + 20, yy);
  ctx.lineTo(x + w - 20, yy);
  ctx.stroke();
  ctx.restore();
  yy += 26;
  txt(ctx, 'TOTAL', x + 20, yy, 16, '#ffd21f', 'left', '800');
  txt(ctx, String(d.total), x + w - 20, yy, 18, '#ffd21f', 'right', '800');
  yy += 34;
  txt(ctx, '★'.repeat(d.stars) + '☆'.repeat(3 - d.stars), x + w / 2, yy, 24, '#ffd21f', 'center', '700');
  txt(ctx, 'R retry · ESC mission board', x + w / 2, yy + 34, 12, '#8fb4c9', 'center', '600');
}

export function drawToast(ctx, cx, y, text) {
  ctx.save();
  ctx.fillStyle = 'rgba(8,16,24,0.85)';
  ctx.strokeStyle = '#ffd21f';
  ctx.lineWidth = 1.5;
  const tw = ctx.measureText(text).width;
  rr(ctx, cx - tw / 2 - 40, y, tw + 80, 30, 6);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  txt(ctx, text, cx, y + 15, 14, '#ffd21f', 'center', '700');
}
