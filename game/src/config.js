// Every tuning number and colour in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule
// below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The two picture panels: same size, side by side under the HUD. */
export const PANEL = { width: 560, height: 452, y: 92, leftX: 32, rightX: 688 };

/** The simulation's fixed step, in seconds. */
export const STEP = 1 / 60;

/** Click tolerance added to a difference's own radius. */
export const CLICK_SLOP = 12;

/** Wrong click: seconds lost and combo reset. */
export const MISS_COST = 5;

/** Hint: seconds lost per hint, hints per scene. */
export const HINT_COST = 10;
export const HINTS_PER_SCENE = 3;

/** Golden difference: bonus points and seconds gained. */
export const GOLDEN_POINTS = 150;
export const GOLDEN_SECONDS = 10;

/** Points per find, and the combo multiplier step (capped). */
export const FIND_POINTS = 100;
export const COMBO_STEP = 0.25;
export const COMBO_CAP = 3;

/** Scene-clear bonus per second left on the clock. */
export const TIME_BONUS = 5;

/** Stars: 3 when at least this share of the clock is left and no miss. */
export const STAR_3_TIME = 0.45;
export const STAR_2_TIME = 0.2;

/** The four scenes: name, differences, seconds on the clock. */
export const SCENES = [
  { id: 'alley', name: 'Lantern Alley', diffs: 6, seconds: 150 },
  { id: 'noodle', name: 'Noodle Stall', diffs: 7, seconds: 135 },
  { id: 'kite', name: 'Kite & Toy Stall', diffs: 8, seconds: 120 },
  { id: 'river', name: 'River of Lanterns', diffs: 9, seconds: 105 },
];

export const PALETTE = {
  backdrop: '#0d0a1e',
  skyTop: '#1a1440',
  skyBottom: '#3a1f4d',
  panelFrame: '#5b3a1e',
  panelInner: '#241a3d',
  gold: '#f2c94c',
  goldDeep: '#c98f1b',
  red: '#e5534b',
  redDeep: '#a8322c',
  green: '#58b368',
  cream: '#f6ead2',
  text: '#f6ead2',
  muted: '#b9a8d6',
  dim: '#7d6ba3',
  timerGood: '#58b368',
  timerLow: '#e5534b',
  miss: '#e5534b',
  hint: '#7fd4ff',
  panel: '#1d1533',
  panelEdge: '#f2c94c',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score and earned stars are kept between visits. */
export const BEST_KEY = 'lantern-night-market.best';
export const STARS_KEY = 'lantern-night-market.stars';
