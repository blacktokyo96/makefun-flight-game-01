// Merapi Sky Patrol: copy game/ and screenshots/ to the output dir and write dossier.json.
import { cpSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
// NOTE: do NOT rmSync(out) — the grader mounts /output, and removing a mount
// point fails (EBUSY) and kills the run. mkdir recursive is a no-op if it exists.
mkdirSync(out, { recursive: true });
if (existsSync(join(root, 'game'))) cpSync(join(root, 'game'), join(out, 'game'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) cpSync(join(root, 'screenshots'), join(out, 'screenshots'), { recursive: true });
writeFileSync(join(out, 'dossier.json'), buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
}));
