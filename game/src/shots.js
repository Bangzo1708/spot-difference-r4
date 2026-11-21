// The screenshot scenes behind ?shot=cover|map|hint|win. Each one stages a
// real game state (found differences, timer, combo, hint) with a fixed
// animation clock, so the same URL always paints the same frame. Nothing
// here is a mock: the cover is mid-play in scene 1 with three differences
// found and three still hiding, exactly what a player sees.

import { HINTS_PER_SCENE } from './config.js';
import { sceneDiffs } from './scenes.js';
import {
  SCREEN_MAP,
  SCREEN_PLAY,
  SCREEN_WIN,
} from './world.js';

/** Fixed animation clock for every shot, so lantern glow never moves. */
export const SHOT_TIME = 3.7;

/** Stage the named shot on `world` and return the screen to draw. */
export function stageShot(name, world) {
  const state = world.state;
  if (name === 'map') {
    world.startGame();
    state.stars = [3, 2, 0, 0];
    state.sceneIndex = 2;
    state.score = 1840;
    state.screen = SCREEN_MAP;
    state.animTime = SHOT_TIME;
    return { screen: SCREEN_MAP, best: 1840 };
  }
  if (name === 'hint') {
    world.startGame();
    world.startScene(1);
    state.found = [0, 3];
    state.combo = 2;
    state.score = 420;
    state.sceneScore = 420;
    state.timeLeft = 88;
    state.hintsLeft = 2;
    state.hint = 4;
    state.hintTime = 2.2;
    state.message = 'Hint: look inside the glowing ring!';
    state.messageTime = 2;
    state.screen = SCREEN_PLAY;
    state.animTime = SHOT_TIME;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'win') {
    world.startGame();
    world.startScene(3);
    const diffs = sceneDiffs(3);
    state.found = diffs.map((d, i) => i);
    state.timeLeft = 41;
    state.score = 4860;
    state.sceneScore = 1420;
    state.timeBonus = 205;
    state.sceneStars = 3;
    state.stars = [3, 3, 2, 3];
    state.bestCombo = 6;
    state.screen = SCREEN_WIN;
    state.animTime = SHOT_TIME;
    return { screen: SCREEN_WIN, best: 4860 };
  }
  // cover (and any unknown name): scene 1 mid-play, 3 found, 3 hiding.
  world.startGame();
  world.startScene(0);
  state.found = [0, 2, 4];
  state.combo = 3;
  state.score = 650;
  state.sceneScore = 650;
  state.timeLeft = 96;
  state.hintsLeft = HINTS_PER_SCENE;
  state.message = 'the cat vanished';
  state.messageTime = 2;
  state.screen = SCREEN_PLAY;
  state.animTime = SHOT_TIME;
  return { screen: SCREEN_PLAY, best: 0 };
}
