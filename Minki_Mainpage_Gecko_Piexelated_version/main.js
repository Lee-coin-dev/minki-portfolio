/* ============================================================
   THE JOURNEY — Pixel Edition
   320×180 virtual canvas, CSS pixel-scaled to fill viewport.
   GSAP ScrollTrigger drives a single 0→1 "j" value;
   everything is derived from j + elapsed time.

   Storyline (matches 3D original):
     0.00-0.10  INTRO     — title card, jungle silhouette
     0.10-0.28  DISCOVER  — gecko on home tree, X mark
     0.26-0.45  RUN       — side-scroll begins, gecko sprints
     0.43-0.62  PARROT    — parrot attack, tail cut
     0.60-0.80  STORM     — dark sky, pixel rain, stub tail
     0.78-0.92  RECOVER   — sun returns, tail regrows
     0.90-1.00  ARRIVE    — three pixel-sign platforms appear
   ============================================================ */

'use strict';

/* ── canvas ───────────────────────────────────────────────── */
const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

/* ── tiny math ────────────────────────────────────────────── */
const clamp  = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp   = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const seg    = (x, a, b) => smooth(clamp((x - a) / (b - a)));

/* ── scroll state (GSAP writes to this) ───────────────────── */
const state = { j: 0 };

/* ── deterministic pseudo-random (for stable world layout) ── */
let _seed = 7;
function rand() {
  _seed = (_seed * 1664525 + 1013904223) & 0x7fffffff;
  return (_seed & 0x7fffffff) / 0x7fffffff;
}

/* ============================================================
   COLOR PALETTE  (NES / Game Boy Color inspired)
   ============================================================ */
const C = {
  skyDay:    '#5c94fc',
  skyHoriz:  '#88baff',
  skyStorm:  '#1c2840',
  stormHoriz:'#38486a',
  cloud:     '#e8f4ff',
  cloudDark: '#5a6a88',
  sun:       '#f8e040',
  sunRay:    '#f4c820',
  farTree:   '#1a3a1a',
  farLeaf1:  '#0a200a',
  farLeaf2:  '#1a3a1a',
  midLeaf1:  '#1a4a1a',
  midLeaf2:  '#2a6a2a',
  nearLeaf1: '#2a6a2a',
  nearLeaf2: '#3a8a3a',
  trunk:     '#6a3a1a',
  trunkDark: '#4a2a10',
  grass:     '#3a8a1a',
  grassHi:   '#5ab02a',
  dirt:      '#5a3a1a',
  dirtDark:  '#3a2008',
  geckoG:    '#42c542',
  geckoDk:   '#1a6e1a',
  geckoB:    '#92de92',
  geckoHead: '#3ab83a',
  geckoSnout:'#4aca4a',
  geckoEye:  '#ffff88',
  geckoIris: '#111111',
  parrotRed: '#d43a2a',
  parrotRedDk:'#8a1a1a',
  parrotYel: '#f4ca00',
  parrotBlue:'#1a5aba',
  parrotBlueDk:'#0a3080',
  parrotOrg: '#e07820',
  rain:      '#8ab4cc',
  rainDk:    '#5a84aa',
  signWood:  '#8B5E3C',
  signWoodLt:'#b8844e',
  signBoard: '#e8d8a0',
  fluteClr:  '#9060d0',
  marineClr: '#1860c0',
  tennisClr: '#1a8030',
  white:     '#ffffff',
  black:     '#000000',
  neonGreen: '#74e08a',
  yellow:    '#f8e040',
  uiBg:      'rgba(0,8,0,0.72)',
};

/* ============================================================
   WORLD LAYOUT
   Virtual canvas: 320 wide × 180 tall
   Ground:  grass at y=146, dirt y=150-179
   Horizon: y=110
   Gecko runs at bottom-y = 146 (feet on grass)
   ============================================================ */
const GROUND_Y = 146;
const HORIZON_Y = 110;
const HOME_TREE_WX = 72;  // world x of the starting tree

/* ── parallax world scroll ────────────────────────────────── */
const SCROLL_START = 0.26;
const SCROLL_END   = 0.94;
const MAX_WORLD_PX = 560;

function worldScroll(j) {
  return MAX_WORLD_PX * seg(j, SCROLL_START, SCROLL_END);
}
function w2s(worldX, layer) {
  // layer 0=far(slow), 1=mid, 2=near(fast)
  const speed = [0.12, 0.40, 0.88][layer];
  return worldX - worldScroll(state.j) * speed;
}

/* ── generate stable world geometry ──────────────────────── */
const TREES = [];
for (let layer = 0; layer < 3; layer++) {
  for (let i = 0; i < 28; i++) {
    TREES.push({
      wx:  rand() * 900 - 60,
      layer,
      h:   18 + rand() * 28,
      w:   5  + rand() * 7,
    });
  }
}
TREES.sort((a, b) => a.layer - b.layer);

const CLOUDS = [];
for (let i = 0; i < 9; i++) {
  CLOUDS.push({
    wx:    rand() * 700 - 50,
    y:     8 + rand() * 38,
    w:     22 + rand() * 28,
    drift: 0.15 + rand() * 0.25,
  });
}

const RAIN = [];
for (let i = 0; i < 90; i++) {
  RAIN.push({ x: rand() * 320, y: rand() * 180, sp: 2.8 + rand() * 2 });
}

/* ── severed tail state ───────────────────────────────────── */
let sevDropped = false;
let sevX = 0, sevY = GROUND_Y;

/* ── end button DOM refs ──────────────────────────────────── */
const endBtns = document.querySelectorAll('.end-btn');
let chosenBtn = -1;

/* ============================================================
   PIXEL DRAWING HELPERS
   ============================================================ */
function px(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
}

/* ============================================================
   BACKGROUND LAYERS
   ============================================================ */
function drawSky(j, t) {
  const storm = clamp(seg(j, 0.58, 0.70) - seg(j, 0.74, 0.90));

  // Sky fill (2 bands for fake gradient)
  const skyTop  = storm > 0 ? C.skyStorm  : C.skyDay;
  const skyHorz = storm > 0 ? C.stormHoriz : C.skyHoriz;
  px(0, 0, 320, HORIZON_Y, skyTop);
  px(0, HORIZON_Y, 320, 36, skyHorz);

  // SUN
  if (storm < 0.85) {
    const sunOp = 1 - storm;
    ctx.globalAlpha = sunOp;
    const sx = 274, sy = 18;
    px(sx, sy,      10, 10, C.sun);
    px(sx+2, sy+2,   6,  6, '#ffffc8');
    // rays (pixel sticks)
    px(sx+4, sy-5,  2, 4, C.sunRay);
    px(sx+4, sy+11, 2, 4, C.sunRay);
    px(sx-5, sy+4,  4, 2, C.sunRay);
    px(sx+11,sy+4,  4, 2, C.sunRay);
    ctx.globalAlpha = 1;
  }

  // LIGHTNING flash during storm
  if (storm > 0.35 && Math.sin(t * 7.3) > 0.93) {
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(0, 0, 320, 180);
  }
}

function drawClouds(j, t) {
  const storm = clamp(seg(j, 0.58, 0.70) - seg(j, 0.74, 0.90));
  const clrF = storm > 0 ? C.cloudDark : C.cloud;
  ctx.globalAlpha = 0.88 - storm * 0.35;
  ctx.fillStyle = clrF;

  for (const c of CLOUDS) {
    const drift = (t * c.drift * (1 + storm * 2.4)) % (370 + c.w);
    const sx = (c.wx - drift + 370 + c.w) % (370 + c.w) - c.w;
    if (sx > 330 || sx + c.w < -10) continue;
    const cw = Math.floor(c.w), ch = Math.floor(c.w * 0.38);
    ctx.fillRect(Math.floor(sx), c.y, cw, ch);
    ctx.fillRect(Math.floor(sx + cw * 0.18), c.y - Math.floor(ch * 0.55),
                 Math.floor(cw * 0.62), Math.floor(ch * 0.75));
  }
  ctx.globalAlpha = 1;
}

function drawTree(sx, layer, h, w) {
  if (sx > 340 || sx < -50) return;
  const lc = [[C.farLeaf1,C.farLeaf2],[C.midLeaf1,C.midLeaf2],[C.nearLeaf1,C.nearLeaf2]];
  const [l1, l2] = lc[layer];
  const gY  = [150, 148, 146][layer];
  const ty  = gY - Math.floor(h);
  const fw  = Math.floor(w + h * 0.55);
  const tx  = Math.floor(sx - w / 2);
  // trunk
  px(tx, ty + Math.floor(h * 0.55), Math.ceil(w), Math.floor(h * 0.45), C.trunkDark);
  px(tx+1, ty + Math.floor(h * 0.55), Math.ceil(w)-1, Math.floor(h * 0.45)-1, C.trunk);
  // foliage
  px(Math.floor(sx - fw/2), ty, fw, Math.floor(h * 0.6), l1);
  px(Math.floor(sx - fw/3), ty+2, Math.floor(fw * 0.66), Math.floor(h * 0.32), l2);
}

function drawTrees() {
  for (const t of TREES) {
    drawTree(w2s(t.wx, t.layer), t.layer, t.h, t.w);
  }
}

function drawGround() {
  // Grass blade detail row
  ctx.fillStyle = C.grassHi;
  for (let gx = 0; gx < 320; gx += 4) {
    ctx.fillRect(gx, GROUND_Y - 3, 1, 3);
    ctx.fillRect(gx+2, GROUND_Y - 4, 1, 4);
  }
  px(0, GROUND_Y - 1, 320, 5, C.grass);
  px(0, GROUND_Y + 4, 320, 26, C.dirt);
  px(0, 176, 320, 4, C.dirtDark);
}

/* ============================================================
   SPRITES
   ============================================================ */

/* ── Gecko ────────────────────────────────────────────────── */
function drawGecko(cx, cy, frame, tailPx, op) {
  // cx=screen x center, cy=feet y, tailPx=0..8, op=opacity
  if (op < 0.01) return;
  ctx.globalAlpha = clamp(op);

  const bx = Math.floor(cx) - 9;  // body left
  const by = Math.floor(cy) - 10; // body top

  // TAIL (tapers left, length = tailPx pixels)
  for (let i = 0; i < tailPx; i++) {
    const h = Math.max(1, Math.round(lerp(3, 1, i / Math.max(1, tailPx))));
    const yo = Math.floor((3 - h) / 2);
    ctx.fillStyle = i < tailPx / 2 ? C.geckoDk : C.geckoG;
    ctx.fillRect(bx - i - 1, by + 3 + yo, 1, h);
  }

  // BODY outline
  px(bx, by+2, 14, 1, C.geckoDk);   // top edge
  px(bx, by+8, 14, 1, C.geckoDk);   // bottom edge
  px(bx, by+2,  1, 7, C.geckoDk);   // left edge

  // BODY fill
  px(bx+1, by+3, 12, 5, C.geckoG);
  // Belly stripe
  px(bx+2, by+4,  9, 3, C.geckoB);

  // HEAD
  px(bx+13, by+1, 1, 8, C.geckoDk); // neck separator
  px(bx+14, by+2, 5, 6, C.geckoHead);
  px(bx+18, by+3, 2, 3, C.geckoSnout);
  px(bx+20, by+3, 1, 1, C.geckoDk); // nostril
  // Eye
  px(bx+15, by+2, 2, 2, C.geckoEye);
  px(bx+15, by+2, 1, 1, C.geckoIris);

  // LEGS — 2-frame walk cycle
  const lb = by + 8;
  if (frame === 0) {
    px(bx+3, lb,   1, 4, C.geckoDk); px(bx+2, lb+4, 3, 1, C.geckoDk);
    px(bx+9, lb,   1, 2, C.geckoDk); px(bx+8, lb+2, 3, 1, C.geckoDk);
  } else {
    px(bx+3, lb,   1, 2, C.geckoDk); px(bx+2, lb+2, 3, 1, C.geckoDk);
    px(bx+9, lb,   1, 4, C.geckoDk); px(bx+8, lb+4, 3, 1, C.geckoDk);
  }

  ctx.globalAlpha = 1;
}

/* ── Parrot ───────────────────────────────────────────────── */
function drawParrot(cx, cy, frame) {
  const bx = Math.floor(cx) - 7;
  const by = Math.floor(cy) - 6;

  // BODY
  px(bx+2, by+4, 8, 1, C.parrotRedDk);
  px(bx+2, by+9, 8, 1, C.parrotRedDk);
  px(bx+2, by+2, 1, 8, C.parrotRedDk);
  px(bx+9, by+2, 1, 8, C.parrotRedDk);
  px(bx+3, by+5, 6, 4, C.parrotRed);

  // HEAD (yellow)
  px(bx+7, by+1, 5, 5, C.parrotYel);
  // Beak
  px(bx+11, by+3, 3, 2, C.parrotOrg);
  px(bx+11, by+4, 3, 2, C.parrotOrg);
  // Angry eye + brow
  px(bx+8,  by+1, 4, 1, C.parrotRed);  // brow (angry slash)
  px(bx+8,  by+2, 2, 2, C.black);      // eye
  px(bx+9,  by+2, 1, 1, '#ff2222');    // red iris

  // WINGS — flap up/down
  const wy = frame === 0 ? by + 3 : by + 7;
  px(bx,    wy, 12, 1, C.parrotBlueDk);
  px(bx+1,  wy+1, 3, 3, C.parrotBlue);
  px(bx+8,  wy+1, 3, 3, C.parrotBlue);
  px(bx+3,  wy+1, 4, 2, C.parrotRed);

  // TAIL FEATHERS
  px(bx+2, by+9,  2, 4, C.parrotBlue);
  px(bx+4, by+9,  2, 4, C.parrotYel);
  px(bx+6, by+9,  2, 4, '#2aaa2a');
}

/* ── X mark ───────────────────────────────────────────────── */
function drawXMark(j, t) {
  const op = 1 - seg(j, 0.22, 0.32);
  if (op < 0.01) return;
  const sx = Math.floor(w2s(HOME_TREE_WX - 8, 2));
  const sy = GROUND_Y - 6;
  ctx.globalAlpha = op * (0.75 + Math.sin(t * 4) * 0.25);
  // X shape: 5x5 px
  px(sx-3, sy-3, 2, 2, C.yellow);
  px(sx+1, sy-3, 2, 2, C.yellow);
  px(sx-1, sy-1, 2, 2, C.yellow);
  px(sx-3, sy+1, 2, 2, C.yellow);
  px(sx+1, sy+1, 2, 2, C.yellow);
  // Tiny arrow pointing up from X
  const ay = sy - 10 - Math.floor(Math.sin(t * 3) * 2);
  px(sx, ay,     2, 6, C.yellow);
  px(sx-2, ay+2, 2, 2, C.yellow);
  px(sx+2, ay+2, 2, 2, C.yellow);
  ctx.globalAlpha = 1;
}

/* ── Severed tail on ground ───────────────────────────────── */
function drawSevTail(j, t) {
  if (!sevDropped) return;
  const fade = 1 - seg(j, 0.74, 0.90);
  if (fade < 0.01) return;
  ctx.globalAlpha = fade;
  // Small curved tail piece
  for (let i = 0; i < 5; i++) {
    const yo = Math.abs(i - 2);
    px(sevX + i, sevY - yo - 1, 1, yo + 1, C.geckoG);
  }
  ctx.globalAlpha = 1;
}

/* ── Home tree (fixed world position) ────────────────────── */
function drawHomeTree(j) {
  const sx = w2s(HOME_TREE_WX, 2);
  // Tall palm-style tree
  const h = 52, w = 7, gY = GROUND_Y;
  const tx = Math.floor(sx - w / 2);
  const ty = gY - h;
  px(tx,   ty + Math.floor(h*0.55), w,   Math.floor(h*0.45), C.trunkDark);
  px(tx+1, ty + Math.floor(h*0.57), w-1, Math.floor(h*0.43), C.trunk);
  // Wider leafy top
  const fw = 38;
  px(Math.floor(sx-fw/2), ty,    fw, Math.floor(h*0.5),  C.nearLeaf1);
  px(Math.floor(sx-fw/3), ty+3,  Math.floor(fw*0.66), Math.floor(h*0.3), C.nearLeaf2);
  // Branch tips
  px(Math.floor(sx-fw/2)-4, ty+6, 8, 3, C.nearLeaf2);
  px(Math.floor(sx+fw/2)-4, ty+6, 8, 3, C.nearLeaf2);
}

/* ── 3 Destination signs ──────────────────────────────────── */
const SIGN_XS = [72, 160, 248]; // canvas x positions
const SIGN_COLORS = [C.fluteClr, C.marineClr, C.tennisClr];
const SIGN_LABELS = ['FLUTE', 'MARINE', 'TENNIS'];
const SIGN_LABELS2 = ['', 'BIO', ''];

function drawSigns(j) {
  const reveal = seg(j, 0.90, 1.0);
  if (reveal < 0.01) return;

  for (let i = 0; i < 3; i++) {
    const delay = Math.max(0, reveal * 1.5 - i * 0.25);
    const op = clamp(delay);
    if (op < 0.01) continue;
    ctx.globalAlpha = op;

    const sx = SIGN_XS[i];
    const baseY = GROUND_Y - 1;
    const col = SIGN_COLORS[i];

    // Pedestal posts
    px(sx-14, baseY-24, 4, 24, C.signWood);
    px(sx+10, baseY-24, 4, 24, C.signWood);
    // Crossbar
    px(sx-14, baseY-24, 28, 4, C.signWoodLt);
    // Sign board
    px(sx-13, baseY-22, 26, 18, C.signBoard);
    px(sx-12, baseY-21, 24, 16, col);

    // Highlight/shine on sign
    px(sx-11, baseY-20, 22, 2, '#ffffff22' === undefined ? col : col);
    ctx.globalAlpha = op * 0.3;
    px(sx-11, baseY-20, 22, 2, C.white);
    ctx.globalAlpha = op;

    // Gecko indicator (small arrow if chosen)
    if (chosenBtn === i) {
      px(sx-1, baseY-28, 2, 4, C.yellow);
      px(sx-2, baseY-27, 1, 1, C.yellow);
      px(sx+1, baseY-27, 1, 1, C.yellow);
    }
  }
  ctx.globalAlpha = 1;
}

/* ── Rain ─────────────────────────────────────────────────── */
function drawRain(j, t) {
  const intensity = clamp(seg(j, 0.58, 0.70) - seg(j, 0.76, 0.88));
  if (intensity < 0.01) return;
  ctx.globalAlpha = intensity * 0.65;
  ctx.fillStyle = C.rain;
  for (const d of RAIN) {
    const dy = (d.y + t * d.sp * 55) % 185;
    const dx = d.x - t * d.sp * 4; // slight diagonal
    ctx.fillRect(Math.floor(((dx % 320) + 320) % 320), Math.floor(dy), 1, 3);
  }
  ctx.globalAlpha = 1;
}

/* ============================================================
   UI OVERLAYS
   ============================================================ */
function drawText(text, x, y, size, color, align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
}

function drawUIBox(x, y, w, h) {
  ctx.fillStyle = C.uiBg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(116,224,138,0.2)';
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y+h-1, w, 1);
}

/* ── Intro title card ─────────────────────────────────────── */
function drawIntro(j, t) {
  const vis = 1 - seg(j, 0.07, 0.14);
  if (vis < 0.01) return;
  ctx.globalAlpha = vis;
  drawUIBox(20, 52, 280, 54);
  drawText('THE JOURNEY',    160, 58, 8, C.neonGreen);
  drawText('STARTS',         160, 70, 8, C.neonGreen);
  // Blinking scroll cue
  if (Math.floor(t * 2) % 2 === 0) {
    drawText('SCROLL TO BEGIN', 160, 88, 5, C.white);
  }
  ctx.globalAlpha = 1;
}

/* ── Story captions ───────────────────────────────────────── */
const CAPTIONS = [
  { a: 0.10, b: 0.26, l1: 'Something stirs',  l2: 'where the X waits...' },
  { a: 0.27, b: 0.44, l1: 'A gecko hurries',  l2: 'along the path.'      },
  { a: 0.45, b: 0.62, l1: 'A furious parrot', l2: 'snaps the tail away!' },
  { a: 0.62, b: 0.80, l1: 'Skies darken...', l2: 'yet it presses on.'   },
  { a: 0.79, b: 0.91, l1: 'Sunlight returns.', l2: 'A new tail grows.'   },
];

function drawCaption(j) {
  for (const c of CAPTIONS) {
    const vis = seg(j, c.a, c.a + 0.025) * (1 - seg(j, c.b - 0.025, c.b));
    if (vis < 0.01) continue;
    ctx.globalAlpha = vis;
    drawUIBox(8, 6, 304, 22);
    drawText(c.l1, 160, 8,  5, C.white);
    drawText(c.l2, 160, 16, 5, C.white);
    ctx.globalAlpha = 1;
    break;
  }
}

/* ── Journey Complete banner ──────────────────────────────── */
function drawEnding(j) {
  const vis = seg(j, 0.89, 0.97);
  if (vis < 0.01) return;
  ctx.globalAlpha = vis;
  drawUIBox(0, 0, 320, 26);
  drawText('JOURNEY COMPLETE', 160, 3,  6, C.neonGreen);
  drawText('PICK A PATH',      160, 14, 5, C.white);
  ctx.globalAlpha = 1;
}

/* ── End-button HTML sync ─────────────────────────────────── */
function syncEndButtons(j) {
  const show = j >= 0.88;
  endBtns.forEach((btn, i) => {
    if (show) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });
}

/* ── Scanline intensity ───────────────────────────────────── */
function drawScanlines() {
  ctx.fillStyle = 'rgba(0,0,0,0.055)';
  for (let y = 0; y < 180; y += 2) {
    ctx.fillRect(0, y, 320, 1);
  }
}

/* ============================================================
   MAIN RENDER
   ============================================================ */
function render(t) {
  const j = state.j;
  const CUT_AT = 0.515;

  ctx.clearRect(0, 0, 320, 180);

  /* ── Background ── */
  drawSky(j, t);
  drawClouds(j, t);
  drawTrees();
  drawHomeTree(j);
  drawGround();

  /* ── X mark (early phases) ── */
  drawXMark(j, t);

  /* ── Rain ── */
  drawRain(j, t);

  /* ── Gecko state ── */
  const sprint  = 0.55 + seg(j, 0.40, 0.52) * 1.6 + Math.sin(t * 1.8) * 0.05;
  const wFrame  = Math.floor(t * 6 * sprint) % 2;
  const tailLen = j < CUT_AT ? 8 : Math.round(seg(j, 0.78, 0.91) * 8);
  const geckoOp = j < CUT_AT ? 1 : clamp(0.30 + seg(j, CUT_AT, 0.92) * 0.70);

  // Gecko screen position
  const GECKO_SCR_X = 76;
  const bob = Math.sin(t * 11 * sprint) * 1.4 * clamp(seg(j, 0.26, 0.35));
  const geckoFeetY  = GROUND_Y + Math.round(bob);

  // Track severed tail drop
  if (j >= CUT_AT && !sevDropped) {
    sevDropped = true;
    sevX = GECKO_SCR_X - 12;
    sevY  = GROUND_Y;
  }
  if (j < CUT_AT && sevDropped) {
    sevDropped = false;
  }

  /* ── PHASE: Crawl (gecko on tree trunk) ── */
  if (j < 0.28) {
    const crawl = seg(j, 0.10, 0.26);
    const treeSx = w2s(HOME_TREE_WX, 2);
    const climbX = treeSx + 3;
    const climbY = lerp(GROUND_Y - 46, GROUND_Y, crawl);
    // Tilt: head-down on trunk → level at ground
    const tilt = lerp(-Math.PI / 2.2, 0, crawl);
    ctx.save();
    ctx.translate(Math.floor(climbX), Math.floor(climbY));
    ctx.rotate(tilt);
    drawGecko(0, 0, wFrame, 8, 1.0);
    ctx.restore();
  }

  /* ── PHASE: Run (gecko on ground) ── */
  if (j >= 0.24) {
    const runOp = seg(j, 0.24, 0.30) * geckoOp;
    drawGecko(GECKO_SCR_X, geckoFeetY, wFrame, tailLen, runOp);
  }

  /* ── PHASE: Parrot attack ── */
  const parrotActive = j > 0.43 && j < 0.63;
  if (parrotActive) {
    const pIn  = seg(j, 0.43, CUT_AT);
    const pOut = seg(j, CUT_AT, 0.63);
    const pFrame = Math.floor(t * 16) % 2;

    const startX = 290, startY = 14;
    const strikeX = GECKO_SCR_X + 4, strikeY = geckoFeetY - 7;
    const exitX = -30, exitY = 10;

    let px_, py_;
    if (j <= CUT_AT) {
      px_ = lerp(startX, strikeX, pIn);
      py_ = lerp(startY,  strikeY, pIn);
    } else {
      px_ = lerp(strikeX, exitX, pOut);
      py_ = lerp(strikeY,  exitY, pOut);
    }
    drawParrot(Math.round(px_), Math.round(py_), pFrame);
  }

  /* ── Severed tail on ground ── */
  drawSevTail(j, t);

  /* ── 3 Destination signs ── */
  drawSigns(j);

  /* ── UI ── */
  drawIntro(j, t);
  drawCaption(j);
  drawEnding(j);
  drawScanlines();

  /* ── Sync HTML end buttons ── */
  syncEndButtons(j);
}

/* ============================================================
   ANIMATION LOOP
   ============================================================ */
let _t0 = null;
function loop(ts) {
  if (!_t0) _t0 = ts;
  render((ts - _t0) / 1000);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ============================================================
   GSAP SCROLL → j
   ============================================================ */
gsap.registerPlugin(ScrollTrigger);
gsap.to(state, {
  j: 1,
  ease: 'none',
  scrollTrigger: {
    trigger: '#scroller',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.5,
  },
});

/* ============================================================
   END BUTTON INTERACTION
   ============================================================ */
endBtns.forEach((btn, i) => {
  btn.addEventListener('click', () => {
    chosenBtn = i;
    const url = btn.dataset.url;
    // Brief pause so the gecko jump arrow renders, then navigate
    setTimeout(() => { window.location.href = url; }, 700);
  });
});
