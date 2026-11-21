// Drawing only: the world's state and the current screen in, pixels out.
// The 1280x720 playfield is scaled to fit the window and centred. Found
// differences get a gold ring on both panels; the golden one gets a star.
// Everything the player can click is laid out here and hit-tested by
// hitButton, so art and buttons can never drift apart.

import { FIELD, FONT, PALETTE, PANEL, SCENES } from './config.js';
import { drawScene, sceneDiffs } from './scenes.js';
import {
  SCREEN_CLEAR,
  SCREEN_MAP,
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
} from './world.js';

const HUD_H = 80;
const BOTTOM_Y = 566;

/** Bottom-bar buttons: label, key hint, x, width. */
const BUTTONS = [
  { id: 'hint', label: 'HINT', key: 'H', x: 32, w: 190 },
  { id: 'pause', label: 'PAUSE', key: 'P', x: 238, w: 150 },
  { id: 'sound', label: 'SOUND', key: 'M', x: 404, w: 170 },
  { id: 'map', label: 'MAP', key: 'Q', x: 590, w: 150 },
];

/** Map cards: one per scene, laid out in a row. */
const MAP_CARD = { w: 272, h: 330, y: 170, gap: 24, x0: 44 };

function mapCardRect(index) {
  return {
    x: MAP_CARD.x0 + index * (MAP_CARD.w + MAP_CARD.gap),
    y: MAP_CARD.y,
    w: MAP_CARD.w,
    h: MAP_CARD.h,
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align, weight) {
    const key = `${weight || ''}${size}`;
    if (!fonts.has(key)) fonts.set(key, `${weight || ''}${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align || 'left';
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function roundRect(x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function drawTimer(state) {
    const x = 430;
    const w = 420;
    const y = 26;
    const share = Math.max(0, state.timeLeft / state.sceneSeconds);
    const low = state.timeLeft <= 30;
    context.fillStyle = '#241a3d';
    roundRect(x, y, w, 18, 9);
    context.fill();
    context.fillStyle = low ? PALETTE.timerLow : PALETTE.timerGood;
    roundRect(x, y, Math.max(18, w * share), 18, 9);
    context.fill();
    context.strokeStyle = PALETTE.panelEdge;
    context.lineWidth = 1.5;
    roundRect(x, y, w, 18, 9);
    context.stroke();
    text(formatTime(state.timeLeft), x + w + 14, y + 15, 22, low ? PALETTE.timerLow : PALETTE.text, 'left', 'bold ');
    if (low) {
      const pulse = 0.55 + 0.45 * Math.sin(state.animTime * 6);
      context.fillStyle = `rgba(229, 83, 75, ${pulse.toFixed(2)})`;
      context.font = 'bold 15px ' + FONT;
      context.textAlign = 'left';
      context.fillText('HURRY!', x, y + 38);
    }
  }

  function drawHud(state) {
    text('LANTERN NIGHT MARKET', 32, 34, 24, PALETTE.gold, 'left', 'bold ');
    text(SCENES[state.sceneIndex].name, 32, 60, 17, PALETTE.muted, 'left');
    text(`SCORE ${state.score}`, 430, 60, 17, PALETTE.text, 'left', 'bold ');
    if (state.combo >= 2) {
      const mult = (1 + 0.25 * (state.combo - 1)).toFixed(2).replace(/\.?0+$/, '');
      text(`COMBO x${state.combo}  (${mult}x)`, 640, 60, 17, PALETTE.gold, 'left', 'bold ');
    }
    drawTimer(state);
    const diffs = sceneDiffs(state.sceneIndex);
    const left = diffs.length - state.found.length;
    text(`FOUND ${state.found.length}/${diffs.length}`, 1080, 34, 24, PALETTE.text, 'left', 'bold ');
    text(left === 0 ? 'ALL FOUND!' : `${left} still hiding`, 1080, 60, 17, left === 0 ? PALETTE.gold : PALETTE.muted, 'left');
  }

  function drawMarker(x, y, r, golden, t) {
    const pulse = 1 + 0.08 * Math.sin(t * 4);
    context.strokeStyle = golden ? '#ffd94d' : PALETTE.gold;
    context.lineWidth = golden ? 5 : 4;
    context.beginPath();
    context.arc(x, y, r * pulse, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = 'rgba(13, 10, 30, 0.85)';
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(x, y, r * pulse + 3, 0, Math.PI * 2);
    context.stroke();
    // Check mark.
    context.strokeStyle = golden ? '#ffd94d' : PALETTE.gold;
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(x - r * 0.45, y);
    context.lineTo(x - r * 0.1, y + r * 0.35);
    context.lineTo(x + r * 0.5, y - r * 0.35);
    context.stroke();
    if (golden) {
      context.fillStyle = '#ffd94d';
      context.beginPath();
      context.arc(x, y - r - 10, 4, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawHintRing(x, y, r, t) {
    const pulse = 1 + 0.25 * Math.sin(t * 5);
    context.strokeStyle = PALETTE.hint;
    context.lineWidth = 4;
    context.beginPath();
    context.arc(x, y, (r + 8) * pulse, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = PALETTE.hint;
    context.font = 'bold 15px ' + FONT;
    context.textAlign = 'center';
    context.fillText('LOOK HERE', x, y - r - 16);
  }

  function drawPanels(state) {
    const diffs = sceneDiffs(state.sceneIndex);
    const t = state.animTime;
    for (let side = 0; side < 2; side += 1) {
      const ox = side === 0 ? PANEL.leftX : PANEL.rightX;
      context.strokeStyle = PALETTE.panelFrame;
      context.lineWidth = 6;
      context.strokeRect(ox - 3, PANEL.y - 3, PANEL.width + 6, PANEL.height + 6);
      drawScene(context, state.sceneIndex, side, ox, PANEL.y, t);
      // Found markers and the hint ring on both panels.
      for (let i = 0; i < diffs.length; i += 1) {
        const d = diffs[i];
        if (state.found.includes(i)) drawMarker(ox + d.x, PANEL.y + d.y, d.r, d.golden, t);
      }
      if (state.hint !== null) {
        const d = diffs[state.hint];
        drawHintRing(ox + d.x, PANEL.y + d.y, d.r, t);
      }
      // Miss marks (red X) where the player clicked wrong.
      for (let i = 0; i < state.missesMarks.length; i += 1) {
        const m = state.missesMarks[i];
        const alpha = Math.max(0, m.life / m.max);
        context.strokeStyle = `rgba(229, 83, 75, ${alpha.toFixed(2)})`;
        context.lineWidth = 4;
        const mx = ox + m.x;
        const my = PANEL.y + m.y;
        context.beginPath();
        context.moveTo(mx - 12, my - 12);
        context.lineTo(mx + 12, my + 12);
        context.moveTo(mx + 12, my - 12);
        context.lineTo(mx - 12, my + 12);
        context.stroke();
      }
      // Sparkle particles and floating score text, mirrored on both panels.
      for (let i = 0; i < state.particles.length; i += 1) {
        const p = state.particles[i];
        const alpha = Math.max(0, p.life / p.max);
        context.fillStyle = p.golden ? `rgba(255, 217, 77, ${alpha.toFixed(2)})` : `rgba(246, 234, 210, ${alpha.toFixed(2)})`;
        context.beginPath();
        context.arc(ox + p.x, PANEL.y + p.y, p.golden ? 4 : 3, 0, Math.PI * 2);
        context.fill();
      }
      for (let i = 0; i < state.floats.length; i += 1) {
        const f = state.floats[i];
        const alpha = Math.max(0, f.life / f.max);
        context.fillStyle = f.color;
        context.globalAlpha = alpha;
        context.font = 'bold 20px ' + FONT;
        context.textAlign = 'center';
        context.fillText(f.text, ox + f.x, PANEL.y + f.y);
        context.globalAlpha = 1;
      }
      // Panel tag.
      context.fillStyle = 'rgba(13, 10, 30, 0.75)';
      context.fillRect(ox + 8, PANEL.y + 8, 62, 26);
      context.fillStyle = PALETTE.gold;
      context.font = 'bold 14px ' + FONT;
      context.textAlign = 'left';
      context.fillText(side === 0 ? 'LEFT' : 'RIGHT', ox + 18, PANEL.y + 26);
    }
  }

  function drawBottomBar(state) {
    for (let i = 0; i < BUTTONS.length; i += 1) {
      const b = BUTTONS[i];
      const label = b.id === 'hint' ? `HINT (${b.key}) x${state.hintsLeft}` : b.id === 'sound' ? `SOUND: ${state.muted ? 'OFF' : 'ON'} (${b.key})` : `${b.label} (${b.key})`;
      context.fillStyle = '#241a3d';
      roundRect(b.x, BOTTOM_Y + 46, b.w, 44, 10);
      context.fill();
      context.strokeStyle = b.id === 'hint' && state.hintsLeft === 0 ? PALETTE.dim : PALETTE.panelEdge;
      context.lineWidth = 1.5;
      roundRect(b.x, BOTTOM_Y + 46, b.w, 44, 10);
      context.stroke();
      text(label, b.x + b.w / 2, BOTTOM_Y + 74, 16, b.id === 'hint' && state.hintsLeft === 0 ? PALETTE.dim : PALETTE.text, 'center', 'bold ');
    }
    text(`Scene ${state.sceneIndex + 1} of ${SCENES.length}`, 800, BOTTOM_Y + 74, 17, PALETTE.muted, 'left');
    for (let i = 0; i < SCENES.length; i += 1) {
      context.fillStyle = i < state.sceneIndex ? PALETTE.gold : i === state.sceneIndex ? PALETTE.text : PALETTE.dim;
      context.beginPath();
      context.arc(1030 + i * 26, BOTTOM_Y + 68, 7, 0, Math.PI * 2);
      context.fill();
    }
    if (state.messageTime > 0 && state.message) {
      context.fillStyle = '#241a3d';
      const w = context.measureText(state.message).width + 36;
      roundRect((FIELD.width - w) / 2, BOTTOM_Y + 2, w, 34, 17);
      context.fill();
      text(state.message, FIELD.width / 2, BOTTOM_Y + 25, 17, PALETTE.gold, 'center');
    }
  }

  function drawPanelOverlay(title, lines, prompt, accent) {
    context.fillStyle = 'rgba(13, 10, 30, 0.72)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    const w = 640;
    const h = 150 + lines.length * 34 + 70;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;
    context.fillStyle = PALETTE.panel;
    roundRect(x, y, w, h, 16);
    context.fill();
    context.strokeStyle = accent || PALETTE.panelEdge;
    context.lineWidth = 2;
    roundRect(x, y, w, h, 16);
    context.stroke();
    text(title, FIELD.width / 2, y + 72, 44, PALETTE.text, 'center', 'bold ');
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], FIELD.width / 2, y + 122 + i * 34, 20, PALETTE.muted, 'center');
    }
    if (prompt) text(prompt, FIELD.width / 2, y + h - 30, 20, PALETTE.gold, 'center');
  }

  function drawStars(cx, y, count, size) {
    for (let i = 0; i < 3; i += 1) {
      const x = cx + (i - 1) * (size * 2 + 10);
      context.fillStyle = i < count ? PALETTE.gold : '#3a2f55';
      context.beginPath();
      for (let k = 0; k < 5; k += 1) {
        const a = -Math.PI / 2 + (k * Math.PI * 2) / 5;
        const a2 = a + Math.PI / 5;
        const px = x + Math.cos(a) * size;
        const py = y + Math.sin(a) * size;
        const qx = x + Math.cos(a2) * size * 0.45;
        const qy = y + Math.sin(a2) * size * 0.45;
        if (k === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
        context.lineTo(qx, qy);
      }
      context.closePath();
      context.fill();
    }
  }

  function drawTitle(state, best) {
    // A living preview of the first scene behind the title card.
    context.save();
    context.globalAlpha = 0.5;
    context.translate(80, 470);
    context.scale(0.42, 0.42);
    drawScene(context, 0, 0, 0, 0, state.animTime);
    context.restore();
    context.save();
    context.globalAlpha = 0.5;
    context.translate(760, 470);
    context.scale(0.42, 0.42);
    drawScene(context, 0, 1, 0, 0, state.animTime);
    context.restore();
    context.fillStyle = 'rgba(13, 10, 30, 0.55)';
    context.fillRect(0, 440, FIELD.width, 280);
    text('LANTERN NIGHT MARKET', FIELD.width / 2, 150, 62, PALETTE.gold, 'center', 'bold ');
    text('S P O T   T H E   D I F F E R E N C E', FIELD.width / 2, 196, 24, PALETTE.text, 'center');
    text('Two pictures of the same festival street. One of them is lying.', FIELD.width / 2, 260, 21, PALETTE.muted, 'center');
    text('Click every difference on either panel before the lanterns burn down.', FIELD.width / 2, 292, 21, PALETTE.muted, 'center');
    text('Golden difference = bonus points + 10 seconds  •  Wrong click = -5 seconds', FIELD.width / 2, 324, 21, PALETTE.gold, 'center');
    text('H hint (-10s)  •  P pause  •  M mute  •  4 scenes, 30 differences to find', FIELD.width / 2, 356, 18, PALETTE.dim, 'center');
    const prompt = `Press Space or click to start${best > 0 ? `   •   Best score ${best}` : ''}`;
    const pulse = 0.7 + 0.3 * Math.sin(state.animTime * 3);
    context.globalAlpha = pulse;
    text(prompt, FIELD.width / 2, 420, 22, PALETTE.text, 'center', 'bold ');
    context.globalAlpha = 1;
  }

  function drawMap(state) {
    text('CHOOSE A SCENE', FIELD.width / 2, 90, 40, PALETTE.gold, 'center', 'bold ');
    text('Clear a scene to unlock the next one. Replay any unlocked scene to earn more stars.', FIELD.width / 2, 126, 19, PALETTE.muted, 'center');
    for (let i = 0; i < SCENES.length; i += 1) {
      const r = mapCardRect(i);
      const unlocked = i === 0 || state.stars[i - 1] > 0;
      const isCurrent = i === state.sceneIndex;
      context.fillStyle = isCurrent ? '#2c2145' : PALETTE.panel;
      roundRect(r.x, r.y, r.w, r.h, 14);
      context.fill();
      context.strokeStyle = isCurrent ? PALETTE.gold : '#3a2f55';
      context.lineWidth = isCurrent ? 3 : 1.5;
      roundRect(r.x, r.y, r.w, r.h, 14);
      context.stroke();
      // Mini preview of the scene.
      context.save();
      context.beginPath();
      context.rect(r.x + 12, r.y + 12, r.w - 24, 150);
      context.clip();
      context.translate(r.x + 12, r.y + 12);
      context.scale((r.w - 24) / 560, 150 / 452);
      drawScene(context, i, 0, 0, 0, 1.3);
      context.restore();
      text(`${i + 1}. ${SCENES[i].name}`, r.x + r.w / 2, r.y + 196, 19, PALETTE.text, 'center', 'bold ');
      text(`${SCENES[i].diffs} differences  •  ${SCENES[i].seconds}s`, r.x + r.w / 2, r.y + 224, 16, PALETTE.muted, 'center');
      drawStars(r.x + r.w / 2, r.y + 262, state.stars[i], 14);
      if (!unlocked) {
        context.fillStyle = 'rgba(13, 10, 30, 0.72)';
        roundRect(r.x, r.y, r.w, r.h, 14);
        context.fill();
        text('LOCKED', r.x + r.w / 2, r.y + 258, 26, PALETTE.muted, 'center', 'bold ');
        text('Clear the scene before it', r.x + r.w / 2, r.y + 288, 15, PALETTE.dim, 'center');
      } else {
        text('Click to play', r.x + r.w / 2, r.y + 306, 15, PALETTE.gold, 'center');
      }
    }
    text(`Total score ${state.score}   •   Press Q or click MAP to go back`, FIELD.width / 2, 560, 18, PALETTE.muted, 'center');
    text('Press Space to play the next unlocked scene', FIELD.width / 2, 592, 18, PALETTE.text, 'center');
  }

  function drawClear(state) {
    drawPanels(state);
    const lines = [
      `${SCENES[state.sceneIndex].name} cleared!`,
      `Scene score ${state.sceneScore}  •  Time bonus +${state.timeBonus}`,
      `Total score ${state.score}`,
    ];
    drawPanelOverlay('SCENE CLEAR!', lines, state.sceneIndex + 1 < SCENES.length ? 'Press Space for the next scene' : 'Press Space for the final lanterns', PALETTE.gold);
    drawStars(FIELD.width / 2, (FIELD.height - (150 + lines.length * 34 + 70)) / 2 + 240, state.sceneStars, 18);
  }

  function drawWin(state, best) {
    drawPanels(state);
    const total = state.stars.reduce((a, b) => a + b, 0);
    const lines = [
      `All 30 differences found across 4 scenes!`,
      `Final score ${state.score}   •   Best combo x${state.bestCombo}`,
      `Stars ${total} / 12${best > 0 ? `   •   Best score ${best}` : ''}`,
    ];
    drawPanelOverlay('THE MARKET IS YOURS!', lines, 'Press Space to play again', PALETTE.gold);
    drawStars(FIELD.width / 2, (FIELD.height - (150 + lines.length * 34 + 70)) / 2 + 240, 3, 18);
  }

  function drawOver(state) {
    drawPanels(state);
    const found = state.found.length;
    const total = sceneDiffs(state.sceneIndex).length;
    const lines = [
      `The lanterns burned out on ${SCENES[state.sceneIndex].name}.`,
      `You found ${found} of ${total} differences. Score ${state.score}.`,
    ];
    drawPanelOverlay('TIME UP!', lines, 'Press Space to try the scene again', PALETTE.red);
  }

  function drawPaused(state) {
    drawPanels(state);
    drawPanelOverlay('PAUSED', ['The market waits for you.'], 'Press P or Space to keep hunting', PALETTE.panelEdge);
  }

  /** Paint one frame. */
  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    if (screen === SCREEN_TITLE) {
      drawTitle(state, best);
      return;
    }
    if (screen === SCREEN_MAP) {
      drawMap(state);
      return;
    }
    drawHud(state);
    if (screen === SCREEN_PLAY) {
      drawPanels(state);
      drawBottomBar(state);
    } else if (screen === SCREEN_PAUSED) drawPaused(state);
    else if (screen === SCREEN_CLEAR) drawClear(state);
    else if (screen === SCREEN_WIN) drawWin(state, best);
    else if (screen === SCREEN_OVER) drawOver(state);
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}

/**
 * Which clickable thing, if any, sits at logical (x, y) on `screen`:
 * a bottom-bar button id, 'start' on the title, 'scene:<n>' on a map card,
 * 'next' / 'again' on the clear / win / over overlays, or null.
 */
export function hitButton(screen, x, y, state) {
  if (screen === SCREEN_TITLE) return 'start';
  if (screen === SCREEN_MAP) {
    for (let i = 0; i < SCENES.length; i += 1) {
      const r = mapCardRect(i);
      const unlocked = i === 0 || state.stars[i - 1] > 0;
      if (unlocked && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return `scene:${i}`;
    }
    return null;
  }
  if (screen === SCREEN_PLAY) {
    for (let i = 0; i < BUTTONS.length; i += 1) {
      const b = BUTTONS[i];
      if (x >= b.x && x <= b.x + b.w && y >= BOTTOM_Y + 46 && y <= BOTTOM_Y + 90) return b.id;
    }
    return null;
  }
  if (screen === SCREEN_CLEAR) return 'next';
  if (screen === SCREEN_WIN) return 'again';
  if (screen === SCREEN_OVER) return 'again';
  if (screen === SCREEN_PAUSED) return 'resume';
  return null;
}
