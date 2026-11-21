// Lantern Night Market — the hand-in program (Node 22, standard library only).
//
// The game is plain static files under game/ (game/index.html plus its ES
// modules, no library, no network request). This program copies game/ and
// screenshots/ from beside this file into the output directory and writes
// dossier.json there, the summary the judge reads, using the vendored
// make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for
// /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The two runs the grader performs must write identical bytes, so this
// program does nothing time- or randomness-dependent: it copies files and
// lets buildDossier do the summarising.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameDir = join(outDir, 'game');
const shotsDir = join(outDir, 'screenshots');

// Start from a clean output tree so a stale file from an earlier run can
// never survive into the entry.
rmSync(gameDir, { recursive: true, force: true });
rmSync(shotsDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'game'), gameDir, { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), shotsDir, { recursive: true });
} else {
  mkdirSync(shotsDir, { recursive: true });
}

// The gate refuses fewer than 3 or more than 4 screenshots: fail loudly
// here, at build time, rather than shipping an entry the scorer rejects.
const shotFiles = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shotFiles.length}`);
}

// The gate's caps, as the kit states them: at most 4 screenshots of at most
// 256 KiB each, at most 993 files and 48 MiB under game/, no game path over
// 1000 bytes, and the dossier text capped at 160 KiB.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
