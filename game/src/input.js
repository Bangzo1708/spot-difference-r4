// Input only: mouse clicks on the canvas (converted to logical 1280x720
// coordinates by the caller) and the keyboard. Actions are queued as a
// bitmask the main loop drains once per frame; clicks are queued as points.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_HINT = 4;
export const ACTION_MUTE = 8;
export const ACTION_MENU = 16;

export function createInput(canvas) {
  let actions = 0;
  const clicks = [];

  function queueAction(bit) {
    actions |= bit;
  }

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    clicks.push({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      queueAction(ACTION_CONFIRM);
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      queueAction(ACTION_PAUSE);
    } else if (event.code === 'KeyH') {
      queueAction(ACTION_HINT);
    } else if (event.code === 'KeyM') {
      queueAction(ACTION_MUTE);
    } else if (event.code === 'KeyQ') {
      queueAction(ACTION_MENU);
    }
  });

  /** Drain the queued actions (and clear them). */
  function takeActions() {
    const out = actions;
    actions = 0;
    return out;
  }

  /** Drain the queued clicks (and clear them). */
  function takeClicks() {
    return clicks.splice(0, clicks.length);
  }

  return { takeActions, takeClicks };
}
