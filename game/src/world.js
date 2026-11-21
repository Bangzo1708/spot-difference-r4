// Game state only: scenes, timer, combo, hints, scoring and the rules for
// a click. No drawing here — the renderer reads this state and paints it.

import {
  CLICK_SLOP,
  COMBO_CAP,
  COMBO_STEP,
  FIND_POINTS,
  GOLDEN_POINTS,
  GOLDEN_SECONDS,
  HINTS_PER_SCENE,
  HINT_COST,
  MISS_COST,
  PANEL,
  SCENES,
  STAR_2_TIME,
  STAR_3_TIME,
  TIME_BONUS,
} from './config.js';
import { sceneDiffs } from './scenes.js';

export const EVENT_NONE = 0;
export const EVENT_FIND = 1;
export const EVENT_GOLDEN = 2;
export const EVENT_MISS = 4;
export const EVENT_CLEAR = 8;
export const EVENT_OVER = 16;

export const SCREEN_TITLE = 'title';
export const SCREEN_MAP = 'map';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

/** Stars earned per scene, kept as an array of 0-3. */
function freshStars() {
  return SCENES.map(() => 0);
}

export function createWorld() {
  const state = {
    screen: SCREEN_TITLE,
    sceneIndex: 0,
    sceneSeconds: SCENES[0].seconds,
    timeLeft: SCENES[0].seconds,
    found: [],
    hintsLeft: HINTS_PER_SCENE,
    hint: null,
    hintTime: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    misses: 0,
    stars: freshStars(),
    sceneScore: 0,
    sceneStars: 0,
    timeBonus: 0,
    particles: [],
    floats: [],
    missesMarks: [],
    animTime: 0,
    message: '',
    messageTime: 0,
    muted: false,
    best: 0,
  };

  function startScene(index) {
    state.sceneIndex = index;
    state.sceneSeconds = SCENES[index].seconds;
    state.timeLeft = SCENES[index].seconds;
    state.found = [];
    state.hintsLeft = HINTS_PER_SCENE;
    state.hint = null;
    state.hintTime = 0;
    state.combo = 0;
    state.misses = 0;
    state.sceneScore = 0;
    state.particles = [];
    state.floats = [];
    state.missesMarks = [];
    state.screen = SCREEN_PLAY;
    state.message = `Find ${sceneDiffs(index).length} differences!`;
    state.messageTime = 2.5;
  }

  function startGame() {
    state.score = 0;
    state.bestCombo = 0;
    state.stars = freshStars();
    startScene(0);
  }

  function toMap() {
    state.screen = SCREEN_MAP;
    state.message = '';
  }

  /** Stars for the scene just cleared: time left and a clean sheet. */
  function starsFor() {
    const share = state.timeLeft / state.sceneSeconds;
    if (share >= STAR_3_TIME && state.misses === 0) return 3;
    if (share >= STAR_2_TIME) return 2;
    return 1;
  }

  function clearScene() {
    state.timeBonus = Math.round(state.timeLeft) * TIME_BONUS;
    state.score += state.timeBonus;
    state.sceneStars = starsFor();
    if (state.sceneStars > state.stars[state.sceneIndex]) {
      state.stars[state.sceneIndex] = state.sceneStars;
    }
    state.screen = SCREEN_CLEAR;
    return EVENT_CLEAR;
  }

  function failScene() {
    state.screen = SCREEN_OVER;
    return EVENT_OVER;
  }

  /** The next scene, or -1 when the last one is done. */
  function nextSceneIndex() {
    return state.sceneIndex + 1 < SCENES.length ? state.sceneIndex + 1 : -1;
  }

  /** A scene is unlocked when it is the first, or the one before it earned a star. */
  function sceneUnlocked(index) {
    if (index === 0) return true;
    return state.stars[index - 1] > 0;
  }

  function burst(x, y, golden) {
    for (let i = 0; i < (golden ? 26 : 14); i += 1) {
      const angle = (i / (golden ? 26 : 14)) * Math.PI * 2;
      const speed = 60 + (i % 5) * 26;
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 0.7,
        max: 0.7,
        golden,
      });
    }
  }

  function floatText(x, y, text, color) {
    state.floats.push({ x, y, text, color, life: 1.1, max: 1.1 });
  }

  /**
   * A click in logical coordinates. Returns an event bitmask. Clicks on a
   * panel test both panels (a difference counts wherever it is found);
   * clicks elsewhere are ignored here and handled by the screen logic.
   */
  function click(x, y) {
    if (state.screen !== SCREEN_PLAY) return EVENT_NONE;
    const inLeft = x >= PANEL.leftX && x < PANEL.leftX + PANEL.width && y >= PANEL.y && y < PANEL.y + PANEL.height;
    const inRight = x >= PANEL.rightX && x < PANEL.rightX + PANEL.width && y >= PANEL.y && y < PANEL.y + PANEL.height;
    if (!inLeft && !inRight) return EVENT_NONE;
    const px = inLeft ? x - PANEL.leftX : x - PANEL.rightX;
    const py = y - PANEL.y;
    const diffs = sceneDiffs(state.sceneIndex);
    // Clicking a difference already found is free: it is not a miss.
    for (let i = 0; i < diffs.length; i += 1) {
      if (!state.found.includes(i)) continue;
      const d = diffs[i];
      const dx = px - d.x;
      const dy = py - d.y;
      const reach = d.r + CLICK_SLOP;
      if (dx * dx + dy * dy <= reach * reach) return EVENT_NONE;
    }
    for (let i = 0; i < diffs.length; i += 1) {
      if (state.found.includes(i)) continue;
      const d = diffs[i];
      const dx = px - d.x;
      const dy = py - d.y;
      const reach = d.r + CLICK_SLOP;
      if (dx * dx + dy * dy <= reach * reach) {
        state.found.push(i);
        state.combo += 1;
        if (state.combo > state.bestCombo) state.bestCombo = state.combo;
        const mult = 1 + COMBO_STEP * (state.combo - 1);
        const capped = Math.min(mult, COMBO_CAP);
        let gained = Math.round(FIND_POINTS * capped);
        let golden = false;
        if (d.golden) {
          gained += GOLDEN_POINTS;
          state.timeLeft = Math.min(state.sceneSeconds, state.timeLeft + GOLDEN_SECONDS);
          golden = true;
        }
        state.score += gained;
        state.sceneScore += gained;
        burst(px, py, golden);
        floatText(px, py - d.r - 8, `+${gained}`, golden ? '#f2c94c' : '#f6ead2');
        if (golden) floatText(px, py + d.r + 18, 'GOLDEN! +10s', '#f2c94c');
        state.message = d.label;
        state.messageTime = 1.6;
        if (state.found.length === diffs.length) return clearScene() | (golden ? EVENT_GOLDEN : EVENT_FIND);
        return golden ? EVENT_GOLDEN : EVENT_FIND;
      }
    }
    // A miss: time lost, combo broken, a red mark where the player clicked.
    state.combo = 0;
    state.misses += 1;
    state.timeLeft = Math.max(0, state.timeLeft - MISS_COST);
    state.missesMarks.push({ x: px, y: py, life: 0.9, max: 0.9 });
    floatText(px, py - 18, `-${MISS_COST}s`, '#e5534b');
    if (state.timeLeft <= 0) return failScene() | EVENT_MISS;
    return EVENT_MISS;
  }

  /** Spend a hint: ring a random unfound difference for a couple of seconds. */
  function useHint() {
    if (state.screen !== SCREEN_PLAY) return false;
    if (state.hintsLeft <= 0) return false;
    const diffs = sceneDiffs(state.sceneIndex);
    const open = [];
    for (let i = 0; i < diffs.length; i += 1) {
      if (!state.found.includes(i)) open.push(i);
    }
    if (open.length === 0) return false;
    state.hint = open[Math.floor(Math.random() * open.length)];
    state.hintTime = 2.2;
    state.hintsLeft -= 1;
    state.timeLeft = Math.max(0, state.timeLeft - HINT_COST);
    state.message = 'Hint: look inside the glowing ring!';
    state.messageTime = 2;
    if (state.timeLeft <= 0) failScene();
    return true;
  }

  /** Advance the clock and the effects by `dt` seconds. */
  function step(dt) {
    state.animTime += dt;
    if (state.messageTime > 0) state.messageTime -= dt;
    if (state.hintTime > 0) {
      state.hintTime -= dt;
      if (state.hintTime <= 0) state.hint = null;
    }
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 160 * dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.floats.length - 1; i >= 0; i -= 1) {
      const f = state.floats[i];
      f.life -= dt;
      f.y -= 34 * dt;
      if (f.life <= 0) state.floats.splice(i, 1);
    }
    for (let i = state.missesMarks.length - 1; i >= 0; i -= 1) {
      const m = state.missesMarks[i];
      m.life -= dt;
      if (m.life <= 0) state.missesMarks.splice(i, 1);
    }
    if (state.screen !== SCREEN_PLAY) return EVENT_NONE;
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      return failScene();
    }
    return EVENT_NONE;
  }

  return {
    state,
    startGame,
    startScene,
    toMap,
    nextSceneIndex,
    sceneUnlocked,
    click,
    useHint,
    step,
  };
}
