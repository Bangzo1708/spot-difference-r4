// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game moves
// between six screens: title, map, play, paused, scene clear / win, time up.
//
// ?shot=cover|map|hint|win (with &seed=N ignored, the scenes are fixed)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, STARS_KEY, STEP } from './config.js';
import { createWorld, EVENT_CLEAR, EVENT_FIND, EVENT_GOLDEN, EVENT_MISS, EVENT_OVER, SCREEN_CLEAR, SCREEN_MAP, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './world.js';
import { ACTION_CONFIRM, ACTION_HINT, ACTION_MENU, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, hitButton } from './render.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas);
const audio = createAudio();

function readNumber(key) {
  try {
    return Number.parseInt(window.localStorage.getItem(key) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function readStars() {
  try {
    const raw = window.localStorage.getItem(STARS_KEY);
    if (!raw) return [0, 0, 0, 0];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 4) return [0, 0, 0, 0];
    return parsed.map((v) => (Number.isInteger(v) && v >= 0 && v <= 3 ? v : 0));
  } catch {
    return [0, 0, 0, 0];
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit.
  }
}

function saveStars(stars) {
  try {
    window.localStorage.setItem(STARS_KEY, JSON.stringify(stars));
  } catch {
    // As above.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readNumber(BEST_KEY);
  world.state.stars = readStars();
  world.state.best = best;
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    audio.playClick();
    world.startGame();
    world.state.stars = readStars();
    screen = SCREEN_PLAY;
    announce('Playing Lantern Alley. Find 6 differences.');
  }

  function finishGame() {
    if (world.state.score > best) {
      best = world.state.score;
      world.state.best = best;
      saveBest(best);
    }
    saveStars(world.state.stars);
  }

  function handleClick(logicalX, logicalY) {
    const button = hitButton(screen, logicalX, logicalY, world.state);
    if (button === 'start') {
      world.toMap();
      screen = SCREEN_MAP;
      audio.playClick();
      announce('Choose a scene.');
      return;
    }
    if (button !== null && button.startsWith('scene:')) {
      const index = Number.parseInt(button.slice(6), 10);
      world.startScene(index);
      screen = SCREEN_PLAY;
      audio.playClick();
      announce(`Playing. Find the differences.`);
      return;
    }
    if (button === 'hint') {
      if (world.useHint()) audio.playHint();
      return;
    }
    if (button === 'pause') {
      screen = SCREEN_PAUSED;
      announce('Paused.');
      return;
    }
    if (button === 'sound') {
      world.state.muted = audio.toggleMute();
      return;
    }
    if (button === 'map') {
      world.toMap();
      screen = SCREEN_MAP;
      audio.playClick();
      return;
    }
    if (button === 'resume') {
      screen = SCREEN_PLAY;
      announce('Playing.');
      return;
    }
    if (button === 'next') {
      const next = world.nextSceneIndex();
      if (next === -1) {
        screen = SCREEN_WIN;
        finishGame();
        audio.playClear();
      } else {
        world.startScene(next);
        screen = SCREEN_PLAY;
        audio.playClick();
      }
      return;
    }
    if (button === 'again') {
      if (screen === SCREEN_WIN) {
        startGame();
      } else {
        world.startScene(world.state.sceneIndex);
        screen = SCREEN_PLAY;
        audio.playClick();
      }
      return;
    }
    if (screen === SCREEN_PLAY) {
      const events = world.click(logicalX, logicalY);
      if (events & EVENT_GOLDEN) audio.playGolden();
      else if (events & EVENT_FIND) audio.playFind();
      else if (events & EVENT_MISS) audio.playMiss();
      if (events & EVENT_CLEAR) {
        screen = SCREEN_CLEAR;
        audio.playClear();
        saveStars(world.state.stars);
        announce('Scene clear!');
        if (world.nextSceneIndex() === -1) {
          // Last scene cleared: the win screen follows from the overlay.
        }
      } else if (events & EVENT_OVER) {
        screen = SCREEN_OVER;
        audio.playOver();
        finishGame();
        announce('Time up.');
      }
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      world.state.muted = audio.toggleMute();
    }
    if (actions & ACTION_MENU) {
      if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
        world.toMap();
        screen = SCREEN_MAP;
      }
      return;
    }
    if (actions & ACTION_HINT) {
      if (screen === SCREEN_PLAY && world.useHint()) audio.playHint();
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE) {
        world.toMap();
        screen = SCREEN_MAP;
        audio.playClick();
      } else if (screen === SCREEN_MAP) {
        const next = world.state.stars.findIndex((s, i) => s === 0 && (i === 0 || world.state.stars[i - 1] > 0));
        world.startScene(next === -1 ? 0 : next);
        screen = SCREEN_PLAY;
        audio.playClick();
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
      } else if (screen === SCREEN_CLEAR) {
        handleClick(0, -1000);
      } else if (screen === SCREEN_WIN || screen === SCREEN_OVER) {
        handleClick(0, -1000);
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    // Convert canvas pixel clicks to logical 1280x720 coordinates, undoing
    // the renderer's letterbox: scale to fit, then remove the centring offset.
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / 1280, rect.height / 720);
    const offsetX = (rect.width - 1280 * scale) / 2;
    const offsetY = (rect.height - 720 * scale) / 2;
    const clicks = input.takeClicks();
    for (let i = 0; i < clicks.length; i += 1) {
      handleClick((clicks[i].x - offsetX) / scale, (clicks[i].y - offsetY) / scale);
    }
    if (screen === SCREEN_TITLE || screen === SCREEN_MAP) {
      world.state.animTime += Math.min(accumulator, MAX_FRAME);
      accumulator = 0;
    } else if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        const events = world.step(STEP);
        accumulator -= STEP;
        if (events & EVENT_OVER) {
          screen = SCREEN_OVER;
          audio.playOver();
          finishGame();
          announce('Time up.');
          break;
        }
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Lantern Night Market. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
