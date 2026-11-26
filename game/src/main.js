// Boot: normal loop (update+draw, dt capped 0.05) or, if ?shot=NAME, stage that scene, draw 4 frames, set window.__shotReady = true.
import { Game } from './core/game.js';
import { stageShot } from './shots/shot-director.js';

const viewport = document.getElementById('viewport');
const hud = document.getElementById('hud');
const game = new Game(viewport, hud);
window.__game = game;

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(game, shot);
  let n = 0;
  const step = () => {
    game.update(1 / 60);
    game.draw();
    n++;
    if (n >= 4) window.__shotReady = true;
    else requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
} else {
  let last = performance.now();
  const loop = (t) => {
    const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
    last = t;
    game.update(dt);
    game.draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
