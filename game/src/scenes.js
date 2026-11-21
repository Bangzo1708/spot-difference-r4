// The four market scenes, drawn entirely in code. Each scene is one painter
// that draws the same picture on both panels, then applies its differences
// on the right panel only (side 1): a colour change, an added object, or an
// object painted over with the local background so it vanishes. A difference
// is { x, y, r, golden, label } in panel coordinates (560 x 452); the world
// uses the same table for hit-testing, so art and rules can never drift.
//
// Panel-local helpers keep every scene in the same 560x452 box.

export const PANEL_W = 560;
export const PANEL_H = 452;

function sky(ctx, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, PANEL_H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PANEL_W, PANEL_H);
}

function ground(ctx, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, y, PANEL_W, PANEL_H - y);
}

function star(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

function starField(ctx, spots) {
  for (let i = 0; i < spots.length; i += 1) {
    star(ctx, spots[i][0], spots[i][1], spots[i][2], '#f6ead2');
  }
}

/** A paper lantern: glowing body, ribs, caps and a tassel. */
function lantern(ctx, x, y, r, color, glow) {
  if (glow) {
    const g = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 2.4);
    g.addColorStop(0, 'rgba(242, 201, 76, 0.35)');
    g.addColorStop(1, 'rgba(242, 201, 76, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#f6ead2';
  ctx.fillRect(x - r * 0.28, y - r - 5, r * 0.56, 6);
  ctx.fillRect(x - r * 0.28, y + r - 1, r * 0.56, 6);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.82, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 40, 20, 0.55)';
  ctx.lineWidth = 2;
  for (let k = -1; k <= 1; k += 1) {
    ctx.beginPath();
    ctx.ellipse(x, y, r * Math.abs(k) * 0.55 + r * 0.12, r * 0.82, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = '#c98f1b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + r + 5);
  ctx.lineTo(x, y + r + 16);
  ctx.stroke();
  ctx.fillStyle = '#c98f1b';
  ctx.fillRect(x - 3, y + r + 16, 6, 8);
}

function awning(ctx, x, y, w, h, colors) {
  for (let i = 0; i < 6; i += 1) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(x + (w / 6) * i, y, w / 6 + 1, h);
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(x, y + h - 6, w, 6);
}

function shopWindow(ctx, x, y, w, h, glowColor) {
  ctx.fillStyle = '#241a3d';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = glowColor;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#241a3d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
}

function signBoard(ctx, x, y, w, h, text, bg, fg) {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#f2c94c';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  ctx.fillStyle = fg;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
}

function steam(ctx, x, y, t) {
  ctx.fillStyle = 'rgba(246, 234, 210, 0.35)';
  for (let i = 0; i < 3; i += 1) {
    const yy = y - i * 18 - ((t * 12 + i * 30) % 18);
    const xx = x + Math.sin((t + i) * 2.1) * 6;
    ctx.beginPath();
    ctx.arc(xx, yy, 13 - i * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function cat(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 22, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 16, y - 12, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 9, y - 19);
  ctx.lineTo(x + 12, y - 29);
  ctx.lineTo(x + 16, y - 20);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 18, y - 21);
  ctx.lineTo(x + 22, y - 30);
  ctx.lineTo(x + 25, y - 20);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 20, y - 2);
  ctx.quadraticCurveTo(x - 34, y - 12, x - 30, y - 26);
  ctx.quadraticCurveTo(x - 26, y - 12, x - 16, y - 4);
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Scene 1 — Lantern Alley
// ---------------------------------------------------------------------------

const ALLEY_DIFFS = [
  { x: 480, y: 58, r: 30, golden: true, label: 'the moon turned full' },
  { x: 260, y: 72, r: 22, golden: false, label: 'a lantern changed colour' },
  { x: 330, y: 290, r: 20, golden: false, label: 'the cat vanished' },
  { x: 280, y: 215, r: 24, golden: false, label: 'the umbrella gained a stripe' },
  { x: 85, y: 165, r: 26, golden: false, label: 'the shop sign changed' },
  { x: 475, y: 385, r: 22, golden: false, label: 'a lantern appeared on the street' },
];

function drawAlley(ctx, side, t) {
  sky(ctx, '#1a1440', '#3a1f4d');
  starField(ctx, [[40, 30, 4], [120, 55, 3], [200, 25, 4], [330, 40, 3], [420, 28, 4], [520, 90, 3], [30, 110, 3], [540, 130, 3]]);
  // Moon: crescent on the left, full on the right.
  ctx.fillStyle = '#f6ead2';
  ctx.beginPath();
  ctx.arc(480, 58, 26, 0, Math.PI * 2);
  ctx.fill();
  if (side === 0) {
    ctx.fillStyle = '#2a2352';
    ctx.beginPath();
    ctx.arc(498, 54, 20, 0, Math.PI * 2);
    ctx.fill();
  }
  // Left shop: BAO house with a red awning.
  ctx.fillStyle = '#7a3b2e';
  ctx.fillRect(0, 120, 170, 210);
  ctx.fillStyle = '#5d2b21';
  ctx.fillRect(0, 120, 170, 14);
  awning(ctx, 0, 134, 170, 26, ['#e5534b', '#f6ead2']);
  shopWindow(ctx, 24, 185, 58, 64, '#f2c94c');
  shopWindow(ctx, 96, 185, 58, 64, '#7fd4ff');
  signBoard(ctx, 35, 152, 100, 34, side === 0 ? 'BAO' : 'BOA', '#241a3d', '#f2c94c');
  ctx.fillStyle = '#3a2430';
  ctx.fillRect(60, 265, 50, 65);
  // Right shop: TEA house with a teal awning.
  ctx.fillStyle = '#2e5d52';
  ctx.fillRect(390, 100, 170, 230);
  ctx.fillStyle = '#1e423a';
  ctx.fillRect(390, 100, 170, 14);
  awning(ctx, 390, 114, 170, 26, ['#58b368', '#f6ead2']);
  shopWindow(ctx, 414, 160, 58, 64, '#f2c94c');
  shopWindow(ctx, 486, 160, 58, 64, '#e5534b');
  signBoard(ctx, 425, 235, 100, 34, 'TEA', '#241a3d', '#7fd4ff');
  ctx.fillStyle = '#24303a';
  ctx.fillRect(452, 265, 50, 65);
  // Lantern string across the street.
  ctx.strokeStyle = '#241a3d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.quadraticCurveTo(280, 86, 560, 42);
  ctx.stroke();
  const lanternXs = [60, 160, 260, 360, 460];
  const lanternColors = ['#e5534b', '#f2c94c', '#e5534b', '#f2c94c', '#e5534b'];
  for (let i = 0; i < lanternXs.length; i += 1) {
    const color = side === 1 && i === 2 ? '#58b368' : lanternColors[i];
    lantern(ctx, lanternXs[i], 72 + Math.sin(t * 1.4 + i) * 2, 17, color, true);
  }
  // Street.
  ground(ctx, 330, '#2a2138');
  ctx.fillStyle = '#332a44';
  ctx.fillRect(0, 330, 560, 10);
  // Food cart with a striped umbrella and a vendor.
  ctx.fillStyle = '#f6ead2';
  ctx.beginPath();
  ctx.arc(280, 235, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a6b4f';
  ctx.fillRect(264, 250, 32, 46);
  ctx.fillStyle = '#2a2138';
  ctx.fillRect(272, 250, 16, 10);
  ctx.strokeStyle = '#5b3a1e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(280, 200);
  ctx.lineTo(280, 250);
  ctx.stroke();
  ctx.fillStyle = '#e5534b';
  ctx.beginPath();
  ctx.moveTo(190, 205);
  ctx.quadraticCurveTo(280, 165, 370, 205);
  ctx.lineTo(370, 212);
  ctx.quadraticCurveTo(280, 178, 190, 212);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f6ead2';
  ctx.beginPath();
  ctx.moveTo(232, 196);
  ctx.quadraticCurveTo(280, 172, 328, 196);
  ctx.lineTo(328, 203);
  ctx.quadraticCurveTo(280, 183, 232, 203);
  ctx.closePath();
  ctx.fill();
  if (side === 1) {
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.moveTo(262, 188);
    ctx.quadraticCurveTo(280, 178, 298, 188);
    ctx.lineTo(298, 195);
    ctx.quadraticCurveTo(280, 186, 262, 195);
    ctx.closePath();
    ctx.fill();
  }
  // Cart body, wheels and pots.
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(205, 296, 150, 66);
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(205, 296, 150, 10);
  ctx.fillStyle = '#241a3d';
  ctx.beginPath();
  ctx.arc(235, 372, 16, 0, Math.PI * 2);
  ctx.arc(325, 372, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2c94c';
  ctx.beginPath();
  ctx.arc(235, 372, 7, 0, Math.PI * 2);
  ctx.arc(325, 372, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3d3d5c';
  ctx.fillRect(225, 276, 34, 20);
  ctx.fillRect(300, 276, 34, 20);
  steam(ctx, 242, 268, t);
  steam(ctx, 317, 268, t + 2);
  // The cat on the cart (missing on the right).
  if (side === 0) cat(ctx, 330, 290, '#2b2b3a');
  // Paper lanterns resting on the street; one extra on the right.
  lantern(ctx, 430, 400, 15, '#e5534b', false);
  lantern(ctx, 90, 405, 15, '#f2c94c', false);
  if (side === 1) lantern(ctx, 475, 385, 15, '#58b368', true);
  // Puddle reflections.
  ctx.fillStyle = 'rgba(127, 212, 255, 0.18)';
  ctx.beginPath();
  ctx.ellipse(140, 420, 60, 8, 0, 0, Math.PI * 2);
  ctx.ellipse(420, 428, 70, 8, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Scene 2 — Noodle Stall
// ---------------------------------------------------------------------------

const NOODLE_DIFFS = [
  { x: 270, y: 185, r: 22, golden: false, label: 'a steam puff vanished' },
  { x: 380, y: 320, r: 20, golden: false, label: 'a bowl went missing' },
  { x: 450, y: 300, r: 22, golden: false, label: 'the chopsticks uncrossed' },
  { x: 120, y: 140, r: 24, golden: false, label: 'the menu price changed' },
  { x: 300, y: 95, r: 20, golden: true, label: 'a hanging lantern turned gold' },
  { x: 150, y: 415, r: 20, golden: false, label: 'a stool changed colour' },
  { x: 500, y: 300, r: 18, golden: false, label: 'a chilli bottle appeared' },
];

function drawNoodle(ctx, side, t) {
  sky(ctx, '#160f38', '#47264d');
  starField(ctx, [[50, 40, 3], [150, 28, 4], [250, 48, 3], [400, 30, 4], [500, 55, 3], [540, 120, 3]]);
  // Stall roof and hanging lanterns.
  ctx.fillStyle = '#5d2b21';
  ctx.fillRect(40, 60, 480, 26);
  awning(ctx, 40, 86, 480, 24, ['#e5534b', '#f6ead2', '#58b368']);
  lantern(ctx, 140, 128, 16, '#e5534b', true);
  lantern(ctx, 300, 128, 16, side === 1 ? '#f2c94c' : '#e5534b', true);
  lantern(ctx, 430, 128, 16, '#f2c94c', true);
  // Menu board (price 5 on the left, 8 on the right).
  ctx.fillStyle = '#241a3d';
  ctx.fillRect(70, 118, 100, 72);
  ctx.strokeStyle = '#f2c94c';
  ctx.lineWidth = 2;
  ctx.strokeRect(74, 122, 92, 64);
  ctx.fillStyle = '#f6ead2';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NOODLE', 120, 138);
  ctx.fillStyle = '#f2c94c';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(side === 0 ? '$5' : '$8', 120, 168);
  // Counter, pots and steam.
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(60, 300, 440, 110);
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(60, 300, 440, 10);
  ctx.fillStyle = '#3d3d5c';
  ctx.fillRect(230, 268, 80, 34);
  ctx.fillStyle = '#565678';
  ctx.fillRect(230, 268, 80, 8);
  ctx.fillStyle = '#e8b64c';
  ctx.beginPath();
  ctx.ellipse(270, 272, 30, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (side === 0) steam(ctx, 270, 258, t);
  steam(ctx, 300, 258, t + 3);
  // Bowls on the counter: three on the left, two on the right.
  const bowls = [340, 380, 420];
  for (let i = 0; i < bowls.length; i += 1) {
    if (side === 1 && i === 1) continue;
    const bx = bowls[i];
    ctx.fillStyle = '#f6ead2';
    ctx.beginPath();
    ctx.ellipse(bx, 322, 18, 10, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillRect(bx - 18, 318, 36, 6);
    ctx.fillStyle = '#e5534b';
    ctx.beginPath();
    ctx.arc(bx, 316, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Chopsticks: crossed on the left, parallel on the right.
  ctx.strokeStyle = '#c98f1b';
  ctx.lineWidth = 4;
  if (side === 0) {
    ctx.beginPath();
    ctx.moveTo(436, 288);
    ctx.lineTo(464, 316);
    ctx.moveTo(464, 288);
    ctx.lineTo(436, 316);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(440, 288);
    ctx.lineTo(440, 316);
    ctx.moveTo(452, 288);
    ctx.lineTo(452, 316);
    ctx.stroke();
  }
  // Chilli bottle: only on the right.
  if (side === 1) {
    ctx.fillStyle = '#e5534b';
    ctx.fillRect(494, 282, 14, 26);
    ctx.fillStyle = '#f6ead2';
    ctx.fillRect(497, 276, 8, 8);
    ctx.fillStyle = '#241a3d';
    ctx.fillRect(494, 292, 14, 8);
  }
  // Vendor behind the counter.
  ctx.fillStyle = '#f6ead2';
  ctx.beginPath();
  ctx.arc(180, 240, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7fd4ff';
  ctx.fillRect(164, 255, 32, 46);
  ctx.fillStyle = '#e5534b';
  ctx.fillRect(168, 232, 24, 8);
  // Stools in front: the first is red on the left, green on the right.
  const stools = [150, 260, 370];
  for (let i = 0; i < stools.length; i += 1) {
    const sx = stools[i];
    ctx.fillStyle = i === 0 && side === 1 ? '#58b368' : '#e5534b';
    ctx.fillRect(sx - 22, 408, 44, 12);
    ctx.fillStyle = '#5b3a1e';
    ctx.fillRect(sx - 3, 420, 6, 22);
    ctx.fillRect(sx - 18, 420, 6, 22);
    ctx.fillRect(sx + 12, 420, 6, 22);
  }
  ground(ctx, 442, '#241a30');
}

// ---------------------------------------------------------------------------
// Scene 3 — Kite & Toy Stall
// ---------------------------------------------------------------------------

const KITE_DIFFS = [
  { x: 140, y: 150, r: 24, golden: false, label: 'a pinwheel lost a blade' },
  { x: 420, y: 110, r: 22, golden: false, label: 'a balloon changed colour' },
  { x: 300, y: 200, r: 24, golden: false, label: 'the kite tail got shorter' },
  { x: 250, y: 60, r: 16, golden: false, label: 'a bunting flag vanished' },
  { x: 480, y: 330, r: 22, golden: true, label: 'the duck turned into a frog' },
  { x: 80, y: 300, r: 16, golden: false, label: 'a star appeared' },
  { x: 200, y: 330, r: 18, golden: false, label: 'the bear lost its bow' },
  { x: 520, y: 400, r: 20, golden: false, label: 'the string spool vanished' },
];

function pinwheel(ctx, x, y, r, blades, colors) {
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(x - 2, y, 4, 90);
  for (let i = 0; i < blades; i += 1) {
    const a = (i / blades) * Math.PI * 2 + 0.4;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a + 0.9) * r, y + Math.sin(a + 0.9) * r);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#f2c94c';
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
}

function balloon(ctx, x, y, r, color) {
  ctx.strokeStyle = 'rgba(246, 234, 210, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  ctx.quadraticCurveTo(x + 8, y + r + 30, x - 2, y + r + 55);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.22, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawKite(ctx, side, t) {
  sky(ctx, '#141038', '#3d2350');
  starField(ctx, [[40, 35, 3], [180, 25, 4], [330, 30, 3], [500, 40, 4], [540, 90, 3]]);
  // Bunting flags: one missing in the middle on the right.
  const flagColors = ['#e5534b', '#f2c94c', '#58b368', '#7fd4ff', '#e5534b', '#f2c94c', '#58b368', '#7fd4ff'];
  ctx.strokeStyle = '#241a3d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 46);
  ctx.quadraticCurveTo(280, 82, 560, 46);
  ctx.stroke();
  for (let i = 0; i < 8; i += 1) {
    if (side === 1 && i === 3) continue;
    const fx = 40 + i * 64;
    const fy = 52 + Math.sin((fx / 560) * Math.PI) * 18;
    ctx.fillStyle = flagColors[i];
    ctx.beginPath();
    ctx.moveTo(fx - 12, fy);
    ctx.lineTo(fx + 12, fy);
    ctx.lineTo(fx, fy + 22);
    ctx.closePath();
    ctx.fill();
  }
  // Balloons.
  balloon(ctx, 420, 110, 24, side === 1 ? '#7fd4ff' : '#e5534b');
  balloon(ctx, 500, 150, 20, '#f2c94c');
  balloon(ctx, 60, 130, 18, '#58b368');
  // Diamond kite with a tail (shorter on the right).
  ctx.fillStyle = '#e5534b';
  ctx.beginPath();
  ctx.moveTo(300, 150);
  ctx.lineTo(340, 200);
  ctx.lineTo(300, 250);
  ctx.lineTo(260, 200);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2c94c';
  ctx.beginPath();
  ctx.moveTo(300, 150);
  ctx.lineTo(320, 200);
  ctx.lineTo(300, 250);
  ctx.lineTo(280, 200);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f6ead2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, 250);
  ctx.lineTo(300, 250 + (side === 0 ? 70 : 28));
  ctx.stroke();
  const bows = side === 0 ? [268, 292, 316] : [268];
  for (let i = 0; i < bows.length; i += 1) {
    ctx.fillStyle = '#7fd4ff';
    ctx.beginPath();
    ctx.arc(300, bows[i], 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Pinwheel: four blades on the left, three on the right.
  pinwheel(ctx, 140, 150, 30, side === 0 ? 4 : 3, ['#e5534b', '#f2c94c', '#58b368', '#7fd4ff']);
  // Toy shelf with a bear and a duck (a frog on the right).
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(150, 350, 380, 14);
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(150, 364, 380, 8);
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(170, 372, 10, 60);
  ctx.fillRect(500, 372, 10, 60);
  // Bear with a bow (bow missing on the right).
  ctx.fillStyle = '#a8763e';
  ctx.beginPath();
  ctx.arc(200, 322, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(186, 302, 8, 0, Math.PI * 2);
  ctx.arc(214, 302, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#241a3d';
  ctx.beginPath();
  ctx.arc(193, 318, 3, 0, Math.PI * 2);
  ctx.arc(207, 318, 3, 0, Math.PI * 2);
  ctx.fill();
  if (side === 0) {
    ctx.fillStyle = '#e5534b';
    ctx.beginPath();
    ctx.moveTo(200, 340);
    ctx.lineTo(188, 332);
    ctx.lineTo(188, 346);
    ctx.closePath();
    ctx.moveTo(200, 340);
    ctx.lineTo(212, 332);
    ctx.lineTo(212, 346);
    ctx.closePath();
    ctx.fill();
  }
  // Duck on the left, frog on the right.
  if (side === 0) {
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.ellipse(480, 330, 20, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(496, 318, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e5534b';
    ctx.beginPath();
    ctx.moveTo(506, 318);
    ctx.lineTo(516, 321);
    ctx.lineTo(506, 324);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = '#58b368';
    ctx.beginPath();
    ctx.ellipse(480, 330, 20, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(466, 312, 8, 0, Math.PI * 2);
    ctx.arc(494, 312, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f6ead2';
    ctx.beginPath();
    ctx.arc(466, 311, 4, 0, Math.PI * 2);
    ctx.arc(494, 311, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Extra star on the right, low on the left wall.
  if (side === 1) star(ctx, 80, 300, 8, '#f2c94c');
  // String spool on the floor (missing on the right).
  if (side === 0) {
    ctx.fillStyle = '#c98f1b';
    ctx.fillRect(508, 392, 24, 18);
    ctx.fillStyle = '#f6ead2';
    ctx.fillRect(508, 392, 24, 5);
    ctx.fillRect(508, 405, 24, 5);
  }
  ground(ctx, 432, '#241a30');
}

// ---------------------------------------------------------------------------
// Scene 4 — River of Lanterns
// ---------------------------------------------------------------------------

const RIVER_DIFFS = [
  { x: 350, y: 380, r: 20, golden: false, label: 'a floating lantern vanished' },
  { x: 280, y: 250, r: 20, golden: false, label: 'a bridge plank went missing' },
  { x: 90, y: 120, r: 24, golden: false, label: 'a willow branch grew longer' },
  { x: 450, y: 300, r: 22, golden: false, label: 'the jumping fish vanished' },
  { x: 480, y: 380, r: 20, golden: true, label: 'the moon reflection vanished' },
  { x: 200, y: 50, r: 14, golden: false, label: 'a star appeared' },
  { x: 150, y: 380, r: 18, golden: false, label: 'a lantern changed colour' },
  { x: 280, y: 190, r: 18, golden: false, label: 'a bridge lantern vanished' },
  { x: 520, y: 420, r: 18, golden: false, label: 'reeds appeared on the bank' },
];

function drawRiver(ctx, side, t) {
  sky(ctx, '#120e33', '#2c1f4d');
  starField(ctx, [[60, 40, 3], [140, 28, 4], [260, 45, 3], [360, 30, 4], [440, 55, 3], [520, 35, 3]]);
  if (side === 1) star(ctx, 200, 50, 6, '#f2c94c');
  // Moon and its reflection (reflection missing on the right).
  ctx.fillStyle = '#f6ead2';
  ctx.beginPath();
  ctx.arc(480, 70, 24, 0, Math.PI * 2);
  ctx.fill();
  if (side === 0) {
    ctx.fillStyle = 'rgba(246, 234, 210, 0.35)';
    ctx.beginPath();
    ctx.ellipse(480, 380, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Willow on the left bank.
  ctx.fillStyle = '#4a2f1d';
  ctx.fillRect(52, 130, 16, 150);
  ctx.strokeStyle = '#58b368';
  ctx.lineWidth = 5;
  const branchLen = side === 1 ? 60 : 34;
  for (let i = 0; i < 5; i += 1) {
    const bx = 40 + i * 16;
    ctx.beginPath();
    ctx.moveTo(bx + 8, 140 + i * 6);
    ctx.quadraticCurveTo(bx + 2, 190, bx + 6, 190 + branchLen + i * 8);
    ctx.stroke();
  }
  // Far bank and river.
  ground(ctx, 280, '#1c2f22');
  const rg = ctx.createLinearGradient(0, 280, 0, PANEL_H);
  rg.addColorStop(0, '#2a3d5c');
  rg.addColorStop(1, '#16233a');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 300, PANEL_W, PANEL_H - 300);
  ctx.fillStyle = 'rgba(246, 234, 210, 0.12)';
  for (let i = 0; i < 4; i += 1) {
    ctx.fillRect(40 + i * 130, 322 + i * 26, 90, 3);
  }
  // Arched bridge.
  ctx.fillStyle = '#7a3b2e';
  ctx.beginPath();
  ctx.moveTo(180, 300);
  ctx.quadraticCurveTo(280, 190, 380, 300);
  ctx.lineTo(380, 318);
  ctx.quadraticCurveTo(280, 214, 180, 318);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5d2b21';
  for (let i = 0; i < 5; i += 1) {
    const px = 205 + i * 34;
    const py = 262 - Math.abs(i - 2) * 14;
    if (side === 1 && i === 2) continue;
    ctx.fillRect(px, py, 20, 8);
  }
  // Bridge lantern (missing on the right).
  if (side === 0) lantern(ctx, 280, 190, 14, '#e5534b', true);
  // Floating lanterns on the water: five on the left, four on the right.
  const floats = [[90, 360, '#e5534b'], [150, 380, '#e5534b'], [250, 365, '#f2c94c'], [350, 380, '#e5534b'], [440, 360, '#f2c94c']];
  for (let i = 0; i < floats.length; i += 1) {
    if (side === 1 && i === 3) continue;
    const f = floats[i];
    const color = side === 1 && i === 1 ? '#58b368' : f[2];
    const bob = Math.sin(t * 1.2 + i * 1.7) * 2;
    lantern(ctx, f[0], f[1] + bob, 13, color, true);
    ctx.fillStyle = 'rgba(242, 201, 76, 0.25)';
    ctx.beginPath();
    ctx.ellipse(f[0], f[1] + 22, 18, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Jumping fish (missing on the right).
  if (side === 0) {
    ctx.fillStyle = '#7fd4ff';
    ctx.beginPath();
    ctx.ellipse(450, 300, 16, 7, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(462, 296);
    ctx.lineTo(474, 288);
    ctx.lineTo(472, 302);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(246, 234, 210, 0.4)';
    ctx.beginPath();
    ctx.arc(438, 316, 6, 0, Math.PI * 2);
    ctx.arc(452, 320, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Reeds on the right bank (only on the right).
  if (side === 1) {
    ctx.strokeStyle = '#58b368';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i += 1) {
      const rx = 505 + i * 12;
      ctx.beginPath();
      ctx.moveTo(rx, 440);
      ctx.lineTo(rx + 3, 408 - i * 4);
      ctx.stroke();
    }
  }
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const SCENE_PAINT = [drawAlley, drawNoodle, drawKite, drawRiver];
const SCENE_DIFFS = [ALLEY_DIFFS, NOODLE_DIFFS, KITE_DIFFS, RIVER_DIFFS];

/** The differences of scene `index` (0-based). */
export function sceneDiffs(index) {
  return SCENE_DIFFS[index];
}

/**
 * Draw scene `index` for `side` (0 left, 1 right) into the panel at
 * (ox, oy). `t` is the animation clock in seconds; shots pass a fixed `t`.
 */
export function drawScene(ctx, index, side, ox, oy, t) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(ox, oy, PANEL_W, PANEL_H);
  ctx.clip();
  ctx.translate(ox, oy);
  SCENE_PAINT[index](ctx, side, t);
  ctx.restore();
}
