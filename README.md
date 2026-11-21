[![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Bangzo1708/spot-difference-r4/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Bangzo1708/spot-difference-r4/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

# Lantern Night Market — Spot the Difference

A complete spot-the-difference game that runs offline in desktop Chrome from
static files. Two near-identical pictures of a festival night market sit side
by side; find every difference before the lanterns burn down.

## How to play

- Click a difference on either panel (or press the matching key). Found
  differences get a gold ring on both panels.
- **Golden Difference**: one difference per scene glows gold — find it for
  bonus points and +10 seconds.
- **Combo**: consecutive finds without a miss multiply your points. A wrong
  click breaks the combo and costs 5 seconds.
- **Hint (H)**: 3 per scene; a hint rings an unfound difference but costs
  10 seconds.
- Four scenes, 6 → 7 → 8 → 9 differences, 150s → 135s → 120s → 105s.
  Clear a scene to unlock the next; earn up to 3 stars per scene.
- **P** pauses, **M** mutes, **Esc** pauses, **Enter/Space** confirms.

## Run it

Serve `game/` with any static server and open `index.html`, for example:

```
cd game && python3 -m http.server 8080
```

No network request is made; all art is drawn in code (canvas), all sounds
are synthesized with WebAudio. No external assets.

## Files

- `game/index.html` — page shell and canvas
- `game/src/config.js` — tuning, palette, scene list
- `game/src/scenes.js` — the four hand-drawn market scenes and their
  differences (all art is code)
- `game/src/world.js` — game state: scenes, timer, combo, hints, scoring
- `game/src/render.js` — canvas drawing: panels, HUD, markers, panels
- `game/src/audio.js` — WebAudio chimes (find, golden, miss, win)
- `game/src/input.js` — mouse + keyboard input
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=...`)
- `game/src/main.js` — boot and frame loop
- `main.ts` — hands the game in (copies `game/` + `screenshots/`, writes
  `dossier.json` with `buildDossier`)

## License

MIT — see `LICENSE`.

[Entered on make.fun](https://make.fun/?ref=dkj7ja9h&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards
