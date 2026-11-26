// Landing grades and sortie scoring.
export function gradeLanding(sink) {
  if (sink < 1.2) return { grade: 'BUTTER', points: 600 };
  if (sink < 2.0) return { grade: 'SMOOTH', points: 450 };
  if (sink < 3.0) return { grade: 'FIRM', points: 250 };
  return { grade: 'HARD', points: 80 };
}

export function centrelinePoints(offset) {
  return Math.max(0, Math.round(150 - offset * 3));
}

export function scoreSortie(o) {
  const timeBonus = o.parSec ? Math.max(0, Math.round((o.parSec - o.timeSec) * 4)) : 0;
  const fuelBonus = Math.round(o.fuelLeft * 12);
  const damagePenalty = Math.round(o.damage * 9);
  const total = o.objectivePoints + timeBonus + fuelBonus + o.landingPoints - damagePenalty;
  const stars = total > 2600 ? 3 : total > 1600 ? 2 : total > 600 ? 1 : 0;
  return { total, timeBonus, fuelBonus, damagePenalty, stars };
}
