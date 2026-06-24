/* =========================================================
   Irene Suh — 2026 South Korea Open Final
   Game flow controller + GSAP animations
   ========================================================= */
const SVGNS = "http://www.w3.org/2000/svg";

/* ---------- tiny helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

/* ---------- screen manager ---------- */
const screens = {
  start:   $("#screen-start"),
  game:    $("#screen-game"),
  video:   $("#screen-video"),
  history: $("#screen-history"),
  reasons: $("#screen-reasons"),
  podium:  $("#screen-podium"),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => {
    s.classList.remove("is-active");
    gsap.set(s, { opacity: 0, display: "none" });
  });
  const el = screens[name];
  el.classList.add("is-active");
  gsap.set(el, { display: "flex" });
  gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" });
}

/* white flash used when the ball bounces and we jump screens */
function flashTo(name, after) {
  const flash = $("#flash");
  gsap.timeline()
    .to(flash, { opacity: 1, duration: 0.18, ease: "power2.in" })
    .add(() => {
      showScreen(name);
      after && after();
    })
    .to(flash, { opacity: 0, duration: 0.45, ease: "power2.out" });
}

/* =========================================================
   SCREEN 1 — floating balls + court animation
   ========================================================= */
function buildFloatingBalls() {
  const wrap = $("#floatingBalls");
  for (let i = 0; i < 10; i++) {
    const b = document.createElement("div");
    b.className = "fball";
    b.style.left = rand(2, 94) + "%";
    b.style.top = rand(8, 90) + "%";
    const s = rand(60, 130) / 100;
    b.style.transform = `scale(${s})`;
    wrap.appendChild(b);
    gsap.to(b, {
      y: rand(-40, -90),
      x: rand(-30, 30),
      rotation: rand(-180, 180),
      duration: rand(30, 55) / 10,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: rand(0, 20) / 10,
    });
  }
}

/* =========================================================
   SCREEN 2 — crowd, signs, clouds, ball idle
   ========================================================= */
const SHIRTS = ["#ff6b6b", "#ffd166", "#06d6a0", "#4d96ff", "#f78fb3", "#c792ea", "#ff924c", "#4ecdc4"];

function buildCrowd() {
  const crowd = $("#crowd");
  const rows = [262, 297, 332];
  rows.forEach((y, ri) => {
    for (let x = 24; x < 1190; x += 40) {
      const jitter = rand(-3, 3);
      const g = document.createElementNS(SVGNS, "g");
      g.setAttribute("transform", `translate(${x + jitter},${y})`);

      const body = document.createElementNS(SVGNS, "path");
      body.setAttribute("d", "M -10 18 Q 0 6 10 18 L 10 24 L -10 24 Z");
      body.setAttribute("fill", SHIRTS[rand(0, SHIRTS.length - 1)]);

      const head = document.createElementNS(SVGNS, "circle");
      head.setAttribute("cx", 0);
      head.setAttribute("cy", 4);
      head.setAttribute("r", 7);
      const skins = ["#f6cfa0", "#e8b98a", "#d49a6a", "#c98a5a"];
      head.setAttribute("fill", skins[rand(0, skins.length - 1)]);

      g.appendChild(body);
      g.appendChild(head);
      crowd.appendChild(g);

      // gentle crowd sway / cheer
      gsap.to(g, {
        y: "-=4",
        duration: rand(8, 16) / 10,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: rand(0, 20) / 10,
      });
    }
  });
}

function buildSigns() {
  const signs = $("#signs");
  const positions = [
    { x: 120, y: 232 }, { x: 430, y: 226 }, { x: 700, y: 230 }, { x: 980, y: 228 },
  ];
  const labels = ["ACE!", "GO IRENE!", "ACE!", "ACE!"];
  positions.forEach((p, i) => {
    const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("transform", `translate(${p.x},${p.y})`);

    const board = document.createElementNS(SVGNS, "rect");
    board.setAttribute("x", -34); board.setAttribute("y", -20);
    board.setAttribute("width", 68); board.setAttribute("height", 26);
    board.setAttribute("rx", 5);
    board.setAttribute("fill", i === 1 ? "#ff5d8f" : "#fff");
    board.setAttribute("stroke", "#1f2440");
    board.setAttribute("stroke-width", 2);

    const txt = document.createElementNS(SVGNS, "text");
    txt.setAttribute("x", 0); txt.setAttribute("y", -1);
    txt.setAttribute("text-anchor", "middle");
    txt.setAttribute("font-family", "Bungee, sans-serif");
    txt.setAttribute("font-size", i === 1 ? 11 : 14);
    txt.setAttribute("fill", i === 1 ? "#fff" : "#d61e5c");
    txt.textContent = labels[i];

    const stick = document.createElementNS(SVGNS, "rect");
    stick.setAttribute("x", -2); stick.setAttribute("y", 6);
    stick.setAttribute("width", 4); stick.setAttribute("height", 18);
    stick.setAttribute("fill", "#9a6b3f");

    g.appendChild(stick); g.appendChild(board); g.appendChild(txt);
    signs.appendChild(g);

    gsap.to(g, {
      rotation: rand(-6, 6),
      transformOrigin: "50% 100%",
      duration: rand(10, 18) / 10,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: rand(0, 15) / 10,
    });
  });
}

function animateClouds() {
  $$(".cloud").forEach((c) => {
    const speed = parseFloat(c.dataset.speed);
    gsap.fromTo(c, { x: -200 }, { x: 1400, duration: speed, repeat: -1, ease: "none", delay: rand(0, 60) / 10 });
  });
}

let ballPulseTween;
function startBallPulse() {
  const p = $(".ball-pulse circle");
  gsap.set(p, { transformOrigin: "center", scale: 0.6, opacity: 0.8 });
  ballPulseTween = gsap.to(p, {
    scale: 1.6, opacity: 0, duration: 1.1, repeat: -1, ease: "power1.out",
  });
}

/* =========================================================
   GAME STATE MACHINE
   ========================================================= */
let rally = 0;              // 0,1,2 -> three rallies, each leads to a content page
let ballBusy = false;

// ball anchor positions (matches the SVG transforms)
const POS = {
  leftHand:  { x: 305, y: 455 },
  rightHand: { x: 895, y: 455 },
  rightGround:{ x: 860, y: 585 },
  leftGround: { x: 320, y: 585 },
};

function setBall(p) { gsap.set("#ball", { x: p.x, y: p.y }); }

function setPrompt(txt) {
  const el = $("#gamePrompt");
  el.textContent = txt;
  gsap.fromTo(el, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4 });
}

/* configure the scene for the current rally */
function setupRally() {
  ballBusy = false;
  if (rally === 0 || rally === 2) {
    // Irene (left) is hitting -> ball at her racquet
    setBall(POS.leftHand);
    setPrompt("Click the tennis ball — Irene serves! 🎾");
  } else {
    // Player 1 (right) is hitting -> ball at her racquet
    setBall(POS.rightHand);
    setPrompt("Click the ball — Player 1 returns! 🎾");
  }
}

/* swing an arm for feedback */
function swingArm(side) {
  const arm = side === "left" ? "#ireneArm" : "#oppArm";
  const base = side === "left" ? -18 : 18;
  gsap.timeline()
    .to(arm, { rotation: base - (side === "left" ? 50 : -50), transformOrigin: "0% 0%", duration: 0.16, ease: "power2.in" })
    .to(arm, { rotation: base, duration: 0.4, ease: "elastic.out(1,0.5)" });
}

/* the main ball-hit + bounce + screen transition */
function hitBall() {
  if (ballBusy) return;
  ballBusy = true;
  ballPulseTween && ballPulseTween.pause();
  gsap.set(".ball-pulse circle", { opacity: 0 });

  const leftHits = rally === 0 || rally === 2;
  const from = leftHits ? POS.leftHand : POS.rightHand;
  const to   = leftHits ? POS.rightGround : POS.leftGround;
  const apexY = 250;
  const target = rally === 0 ? "video" : rally === 1 ? "history" : "reasons";

  swingArm(leftHits ? "left" : "right");
  $("#gamePrompt").textContent = "";

  const tl = gsap.timeline({
    onComplete: () => {
      flashTo(target, () => {
        if (target === "video") tryPlayVideo();
      });
    },
  });

  // horizontal travel
  tl.to("#ball", { x: to.x, duration: 1.0, ease: "none" }, 0);
  // spin
  tl.to("#ball", { rotation: leftHits ? 720 : -720, transformOrigin: "center", duration: 1.0, ease: "none" }, 0);
  // up
  tl.to("#ball", { y: apexY, duration: 0.5, ease: "power2.out" }, 0);
  // down to ground
  tl.to("#ball", { y: to.y, duration: 0.5, ease: "power2.in" }, 0.5);
  // squash on bounce
  tl.to("#ball", { scaleY: 0.6, scaleX: 1.3, transformOrigin: "center bottom", duration: 0.08, yoyo: true, repeat: 1 }, 1.0);
}

/* =========================================================
   SCOREBOARD updates
   ========================================================= */
function setCell(rowSel, setIndex, value) {
  const cell = $(`${rowSel} td[data-set="${setIndex}"]`);
  cell.textContent = value;
  cell.classList.remove("score-pop");
  void cell.offsetWidth; // reflow to restart animation
  cell.classList.add("score-pop");
}

function applySet1Score() {
  // Irene wins set 1: 6 - (something below 6)
  setCell(".sb-irene", 0, 6);
  setCell(".sb-opp", 0, rand(0, 4));
}

function applyAllSetsScore() {
  // Irene wins all three sets
  setCell(".sb-irene", 0, 6);
  setCell(".sb-irene", 1, 6);
  setCell(".sb-irene", 2, 6);
  setCell(".sb-opp", 0, rand(0, 4));
  setCell(".sb-opp", 1, rand(0, 4));
  setCell(".sb-opp", 2, rand(0, 4));
}

/* =========================================================
   VIDEO fallback handling
   ========================================================= */
function tryPlayVideo() {
  const v = $("#ireneVideo");
  const fb = $("#videoFallback");
  // If the source can't load, keep showing the animated fallback.
  v.addEventListener("error", () => { fb.style.display = "flex"; }, { once: true });
  v.addEventListener("loadeddata", () => {
    fb.style.display = "none";
    v.play().catch(() => {});
  }, { once: true });
  // kick the load
  try { v.load(); } catch (e) {}
}

/* =========================================================
   PODIUM — confetti + happy face
   ========================================================= */
function buildHappyFaces() {
  // add a smile to the champion face
  $$(".winner-face").forEach((f) => {
    const smile = document.createElement("div");
    smile.style.cssText =
      "position:absolute;left:50%;top:38px;transform:translateX(-50%);width:24px;height:12px;border-bottom:3px solid #b5564f;border-radius:0 0 14px 14px;";
    if (f.classList.contains("neutral")) {
      smile.style.cssText =
        "position:absolute;left:50%;top:44px;transform:translateX(-50%);width:18px;height:3px;background:#8a5a4f;border-radius:2px;";
    }
    f.appendChild(smile);
  });
}

function launchConfetti() {
  const wrap = $("#confetti");
  wrap.innerHTML = "";
  const colors = ["#ffd166", "#ff5d8f", "#06d6a0", "#4d96ff", "#c792ea", "#ffffff"];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement("span");
    c.className = "cf";
    c.style.left = rand(0, 100) + "%";
    c.style.background = colors[rand(0, colors.length - 1)];
    wrap.appendChild(c);
    gsap.fromTo(c,
      { y: -20, opacity: 1, rotation: 0 },
      {
        y: rand(220, 420),
        x: rand(-120, 120),
        rotation: rand(180, 720),
        opacity: 0,
        duration: rand(15, 30) / 10,
        ease: "power1.in",
        delay: rand(0, 20) / 10,
        repeat: -1,
      });
  }
}

/* =========================================================
   WIRING / EVENTS
   ========================================================= */
function goToGame() {
  showScreen("game");
  rally = 0;
  // reset scoreboard
  $$('.scoreboard td[data-set]').forEach((c) => (c.textContent = "0"));
  setupRally();
  ballPulseTween && ballPulseTween.resume();
}

function backToGame() {
  if (rally === 0) {
    // finished set 1 -> now player 1 returns (rally 1)
    rally = 1;
    showScreen("game");
    applySet1Score();
    setupRally();
    ballPulseTween && ballPulseTween.resume();
  } else if (rally === 1) {
    // finished set 2 -> Irene has now won all three sets, final rally
    rally = 2;
    showScreen("game");
    applyAllSetsScore();
    setupRally();
    ballPulseTween && ballPulseTween.resume();
  }
}

function init() {
  buildFloatingBalls();
  buildCrowd();
  buildSigns();
  animateClouds();
  startBallPulse();
  buildHappyFaces();

  setBall(POS.leftHand);

  $("#btnGameStart").addEventListener("click", goToGame);
  $("#ball").addEventListener("click", hitBall);
  $$("[data-back]").forEach((b) => b.addEventListener("click", backToGame));

  $("#btnLookResults").addEventListener("click", () => {
    showScreen("podium");
    launchConfetti();
  });

  $("#btnRestart").addEventListener("click", () => {
    showScreen("start");
  });
}

window.addEventListener("DOMContentLoaded", init);
