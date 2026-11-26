// Six back-lit round gauges: airspeed, attitude, altimeter, heading, vertical speed, engine.
export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function txt(ctx, s, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = (weight || '600') + ' ' + size + 'px sans-serif';
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

export function dialFace(ctx, x, y, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#0b1218';
  ctx.fill();
  ctx.shadowColor = '#7fd4ff';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = '#3d5a70';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function needle(ctx, x, y, angle, len, color, width) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(0, -len);
  ctx.stroke();
  ctx.restore();
}

function arc(ctx, x, y, r, a0, a1, color, width) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 5;
  ctx.beginPath();
  ctx.arc(x, y, r, a0, a1);
  ctx.stroke();
  ctx.restore();
}

const A0 = Math.PI * 0.75;
const A1 = Math.PI * 2.25;

export function drawAirspeed(ctx, x, y, r, kt) {
  dialFace(ctx, x, y, r);
  arc(ctx, x, y, r - 7, A0 + ((40 / 200) * (A1 - A0)), A0 + ((85 / 200) * (A1 - A0)), '#ffffff', 5);
  arc(ctx, x, y, r - 7, A0 + ((55 / 200) * (A1 - A0)), A0 + ((140 / 200) * (A1 - A0)), '#37d67a', 5);
  arc(ctx, x, y, r - 7, A0 + ((140 / 200) * (A1 - A0)), A0 + ((170 / 200) * (A1 - A0)), '#ffb020', 5);
  arc(ctx, x, y, r - 7, A0 + ((170 / 200) * (A1 - A0)), A1, '#ff4040', 5);
  for (let v = 0; v <= 200; v += 20) {
    const a = A0 + (v / 200) * (A1 - A0);
    const big = v % 40 === 0;
    ctx.save();
    ctx.strokeStyle = '#cfe3f0';
    ctx.lineWidth = big ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x + Math.sin(a) * (r - 13), y - Math.cos(a) * (r - 13));
    ctx.lineTo(x + Math.sin(a) * (r - (big ? 20 : 17)), y - Math.cos(a) * (r - (big ? 20 : 17)));
    ctx.stroke();
    ctx.restore();
    if (big) txt(ctx, String(v), x + Math.sin(a) * (r - 28), y - Math.cos(a) * (r - 28), 10, '#cfe3f0');
  }
  needle(ctx, x, y, A0 + (Math.min(kt, 200) / 200) * (A1 - A0) - Math.PI, r - 24, '#ffffff', 3);
  txt(ctx, Math.round(kt) + '', x, y + r - 13, 13, '#ffffff', 'center', '700');
  txt(ctx, 'KT', x, y + r - 2, 8, '#8fb4c9');
}

export function drawAttitude(ctx, x, y, r, pitchDeg, rollRad) {
  dialFace(ctx, x, y, r);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r - 3, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(x, y);
  ctx.rotate(-rollRad);
  const py = (pitchDeg / 30) * r * 0.9;
  ctx.fillStyle = '#3f8fd2';
  ctx.fillRect(-r * 2, -r * 2 + py, r * 4, r * 2);
  ctx.fillStyle = '#8a6a45';
  ctx.fillRect(-r * 2, py, r * 4, r * 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 2, py);
  ctx.lineTo(r * 2, py);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  for (const p of [-20, -10, 10, 20]) {
    const ly = py - (p / 30) * r * 0.9;
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, ly);
    ctx.lineTo(r * 0.45, ly);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#ffb020';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, 0);
  ctx.lineTo(-r * 0.14, 0);
  ctx.moveTo(r * 0.14, 0);
  ctx.lineTo(r * 0.55, 0);
  ctx.moveTo(0, -3);
  ctx.lineTo(0, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#ffb020';
  ctx.fill();
  ctx.restore();
}

export function drawAltimeter(ctx, x, y, r, altM) {
  dialFace(ctx, x, y, r);
  for (let v = 0; v < 10; v++) {
    const a = A0 + (v / 10) * (A1 - A0);
    ctx.save();
    ctx.strokeStyle = '#cfe3f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.sin(a) * (r - 12), y - Math.cos(a) * (r - 12));
    ctx.lineTo(x + Math.sin(a) * (r - 19), y - Math.cos(a) * (r - 19));
    ctx.stroke();
    ctx.restore();
    txt(ctx, String(v), x + Math.sin(a) * (r - 27), y - Math.cos(a) * (r - 27), 10, '#cfe3f0');
  }
  needle(ctx, x, y, A0 + (((altM / 1000) % 10) / 10) * (A1 - A0) - Math.PI, r - 24, '#9fb8c8', 2);
  needle(ctx, x, y, A0 + (((altM / 100) % 10) / 10) * (A1 - A0) - Math.PI, r - 24, '#ffffff', 3);
  ctx.save();
  ctx.fillStyle = '#0b1218';
  ctx.strokeStyle = '#3d5a70';
  ctx.lineWidth = 1.5;
  rr(ctx, x - 26, y + r - 26, 52, 18, 3);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  txt(ctx, Math.round(altM) + '', x, y + r - 17, 12, '#ffffff', 'center', '700');
  txt(ctx, 'M', x, y + r - 2, 8, '#8fb4c9');
}

export function drawHeading(ctx, x, y, r, hdgDeg, bugDeg) {
  dialFace(ctx, x, y, r);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r - 3, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(x, y);
  ctx.rotate((-hdgDeg * Math.PI) / 180);
  for (let d = 0; d < 360; d += 5) {
    const a = (d * Math.PI) / 180;
    const big = d % 30 === 0;
    ctx.save();
    ctx.strokeStyle = '#cfe3f0';
    ctx.lineWidth = big ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(Math.sin(a) * (r - 10), -Math.cos(a) * (r - 10));
    ctx.lineTo(Math.sin(a) * (r - (big ? 18 : 14)), -Math.cos(a) * (r - (big ? 18 : 14)));
    ctx.stroke();
    ctx.restore();
    if (big) {
      const label = d === 0 ? 'N' : d === 90 ? 'E' : d === 180 ? 'S' : d === 270 ? 'W' : String(d / 10);
      ctx.save();
      ctx.rotate(a);
      txt(ctx, label, 0, -(r - 28), 11, '#ffffff', 'center', '700');
      ctx.restore();
    }
  }
  if (bugDeg !== null && bugDeg !== undefined) {
    const ba = (bugDeg * Math.PI) / 180;
    ctx.save();
    ctx.rotate(ba);
    ctx.fillStyle = '#ff3df0';
    ctx.beginPath();
    ctx.moveTo(0, -(r - 8));
    ctx.lineTo(-5, -(r - 18));
    ctx.lineTo(5, -(r - 18));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - r + 2);
  ctx.lineTo(x, y - r + 12);
  ctx.stroke();
  ctx.restore();
  txt(ctx, String(Math.round(hdgDeg)).padStart(3, '0'), x, y + r - 12, 13, '#ffffff', 'center', '700');
}

export function drawVerticalSpeed(ctx, x, y, r, vs) {
  dialFace(ctx, x, y, r);
  for (let v = -20; v <= 20; v += 5) {
    const a = A0 + ((v + 20) / 40) * (A1 - A0);
    const big = v % 10 === 0;
    ctx.save();
    ctx.strokeStyle = '#cfe3f0';
    ctx.lineWidth = big ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x + Math.sin(a) * (r - 12), y - Math.cos(a) * (r - 12));
    ctx.lineTo(x + Math.sin(a) * (r - (big ? 19 : 16)), y - Math.cos(a) * (r - (big ? 19 : 16)));
    ctx.stroke();
    ctx.restore();
    if (big && v !== 0) txt(ctx, (v > 0 ? '+' : '') + v, x + Math.sin(a) * (r - 27), y - Math.cos(a) * (r - 27), 10, '#cfe3f0');
  }
  needle(ctx, x, y, A0 + ((Math.max(-20, Math.min(20, vs)) + 20) / 40) * (A1 - A0) - Math.PI, r - 24, '#ffffff', 3);
  txt(ctx, (vs >= 0 ? '+' : '') + vs.toFixed(1), x, y + r - 13, 11, '#ffffff', 'center', '700');
  txt(ctx, 'M/S', x, y + r - 2, 8, '#8fb4c9');
}

export function drawEngine(ctx, x, y, r, fuel01, rpm01) {
  dialFace(ctx, x, y, r);
  arc(ctx, x, y, r - 7, A0, A0 + rpm01 * (A1 - A0), rpm01 > 0.85 ? '#ff4040' : '#37d67a', 6);
  for (let v = 0; v <= 10; v++) {
    const a = A0 + (v / 10) * (A1 - A0);
    ctx.save();
    ctx.strokeStyle = '#cfe3f0';
    ctx.lineWidth = v % 5 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x + Math.sin(a) * (r - 14), y - Math.cos(a) * (r - 14));
    ctx.lineTo(x + Math.sin(a) * (r - 19), y - Math.cos(a) * (r - 19));
    ctx.stroke();
    ctx.restore();
  }
  const fa = A0 + fuel01 * (A1 - A0);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(fa - Math.PI);
  ctx.fillStyle = fuel01 < 0.15 ? '#ff4040' : '#ffb020';
  ctx.beginPath();
  ctx.moveTo(-4, 6);
  ctx.lineTo(0, -(r - 30));
  ctx.lineTo(4, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  txt(ctx, 'E', x - (r - 16), y + r - 24, 10, '#8fb4c9');
  txt(ctx, 'F', x + (r - 16), y + r - 24, 10, '#8fb4c9');
  txt(ctx, 'RPM ' + Math.round(rpm01 * 100) + '%', x, y + r - 12, 10, '#ffffff', 'center', '700');
}
