/* =======================================================================
   HESPERORNIS: A CRETACEOUS CHASE
   One continuous, hand-animated swimming adventure across five "screens":
     1. Shore / Game Start        2. Dodge the floating rocks
     3. The Mosasaur chase        4. Murky waters
     5. Journey complete - pick your fish
   Everything is drawn procedurally on a single canvas so the five scenes
   flow together as ONE smooth game.
   ===================================================================== */

(() => {
  "use strict";

  // ---------------------------------------------------------------------
  //  Canvas setup
  // ---------------------------------------------------------------------
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;   // 1280
  const H = canvas.height;  // 720
  const returnBtn = document.getElementById("returnBtn");
  const skipBtn = document.getElementById("skipBtn");
  const hintEl = document.getElementById("hint");

  // ---------------------------------------------------------------------
  //  Palette (Cretaceous, painterly - deliberately NOT modern/flat)
  // ---------------------------------------------------------------------
  const COL = {
    // Hesperornis
    birdBack:   "#333f4c",
    birdBackHi: "#48586a",
    birdBelly:  "#dfe4e6",
    birdBellyLo:"#b7c0c4",
    beak:       "#3b4954",
    beakTip:    "#7d5a3a",
    foot:       "#8a3b2e",
    footHi:     "#a8503f",
    eyeRing:    "#d9b038",
    // Mosasaur
    mosaBack:   "#4c5b4e",
    mosaBackHi: "#657561",
    mosaBelly:  "#9fab9b",
    mouth:      "#6e2b2b",
    tooth:      "#f2eede",
    // Fish
    fishBody:   "#cf5a30",
    fishBelly:  "#e9a05f",
    fishFin:    "#a83d1f",
  };

  // ---------------------------------------------------------------------
  //  Input
  // ---------------------------------------------------------------------
  const input = { flapQueued: false, pointer: null };

  function queueFlap() { input.flapQueued = true; }

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      onPrimaryAction();
    }
  });

  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    input.pointer = { x, y };
    onPrimaryAction(x, y);
  });

  returnBtn.addEventListener("click", () => resetGame());
  skipBtn.addEventListener("click", () => beginEnding());

  // Primary action: start the game, flap while swimming, or pick a fish.
  function onPrimaryAction(px, py) {
    if (game.phase === "INTRO") {
      startDive();
    } else if (game.phase === "SWIM") {
      queueFlap();
    } else if (game.phase === "ENDING") {
      if (px != null) tryPickFish(px, py);
    }
  }

  // ---------------------------------------------------------------------
  //  Small helpers
  // ---------------------------------------------------------------------
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // ---------------------------------------------------------------------
  //  Game state
  // ---------------------------------------------------------------------
  const game = {
    phase: "INTRO",       // INTRO | DIVING | SWIM | DEAD | ENDING
    time: 0,              // seconds since load
    worldX: 0,            // distance travelled (px)
    scrollSpeed: 350,     // 40% faster than the original 250
    narration: "Game Start",
    subNarration: "Press SPACE to Start Playing!",
    narrShownAt: 0,
    // hesperornis vertical physics
    birdY: 300,
    birdVY: 0,
    birdAngle: 0,
    chomp: 0,             // 0..1 beak open amount
    diveT: 0,
    // world contents
    rocks: [],
    fishes: [],           // background fish
    chaseFish: null,      // the fish being hunted
    bubbles: [],
    seaweed: [],
    particles: [],
    // event system
    events: [],
    // mosasaur
    mosa: null,
    // murky
    murk: 0,              // 0..1 darkness
    murkTimer: 0,
    // ending
    choiceFish: [],
    chosen: null,
    endGlow: 0,
    // shake
    shake: 0,
  };

  const GRAVITY = 1050;
  const FLAP = -370;
  const MAX_FALL = 560;
  const BIRD_X = 380;       // fixed screen x of the bird
  const WATER_TOP = 92;     // below the narration band
  const WATER_BOT = 690;

  // ---------------------------------------------------------------------
  //  World seeding
  // ---------------------------------------------------------------------
  function seedWorld() {
    game.rocks = [];
    game.fishes = [];
    game.bubbles = [];
    game.seaweed = [];
    game.particles = [];
    game.mosa = null;
    game.murk = 0;
    game.choiceFish = [];
    game.chosen = null;
    game.endGlow = 0;

    // background fish shoal
    for (let i = 0; i < 14; i++) {
      game.fishes.push({
        x: rand(0, 3000),
        y: rand(WATER_TOP + 40, WATER_BOT - 40),
        depth: rand(0.35, 0.9),   // parallax + size
        speed: rand(20, 55),
        phase: rand(0, Math.PI * 2),
        col: Math.random() < 0.5 ? "#8fb0b8" : "#b98a6a",
      });
    }

    // rising bubbles
    for (let i = 0; i < 40; i++) {
      game.bubbles.push({
        x: rand(0, W), y: rand(0, H),
        r: rand(1.5, 5), spd: rand(18, 46), ph: rand(0, 6.28),
      });
    }

    // seaweed anchored along the floor
    for (let i = 0; i < 26; i++) {
      game.seaweed.push({
        x: rand(0, 4000), h: rand(60, 160),
        sway: rand(0, 6.28), col: Math.random() < 0.5 ? "#2f5136" : "#3c6b45",
      });
    }

    buildTimeline();
    game.chaseFish = {
      x: 980, y: 300, bob: 0, alive: true,
    };
  }

  // Distance-triggered script so the five "screens" flow as one game.
  function buildTimeline() {
    game.events = [
      { at: 40,   done: false, fn: () => setNarr("There! A fish - give chase!", "Tap SPACE to swim upward") },
      { at: 850,  done: false, fn: () => { setNarr("No Pause, Only Survival.", "Rise over the drifting rocks!"); spawnRockField(900, 2500, 470); } },
      { at: 2850, done: false, fn: () => { setNarr("MOSASAUR APPROACHING!", "Burst of speed - outrun it!"); spawnMosasaur(); } },
      { at: 6200, done: false, fn: () => { setNarr("Everyone slows... Except you.", ""); startMurk(); } },
      { at: 7600, done: false, fn: () => { beginEnding(); } },
    ];
  }

  function setNarr(main, sub) {
    game.narration = main;
    game.subNarration = sub || "";
    game.narrShownAt = game.time;
  }

  function spawnRockField(startX, endX, gap) {
    for (let x = startX; x < endX; x += gap) {
      const r = rand(46, 74);
      game.rocks.push({
        x: x + rand(-40, 40),
        y: rand(WATER_TOP + r + 60, WATER_BOT - r - 20),
        r,
        seed: rand(0, 100),
        spin: rand(-0.2, 0.2),
        ang: rand(0, 6.28),
        hit: false,
      });
    }
  }

  function spawnMosasaur() {
    game.mosa = {
      x: -560,          // enters from behind, off the left edge
      y: WATER_BOT - 150,
      vx: 0,
      state: "enter",   // enter -> loom -> giveup
      t: 0,
      loomT: 0,
      jaw: 0,
    };
  }

  function startMurk() {
    game.murkTimer = 4;   // seconds of darkness, then clears
  }

  function beginEnding() {
    game.phase = "ENDING";
    game.murk = 0;
    game.murkTimer = 0;
    skipBtn.classList.add("hidden");
    setNarr("Journey Complete.", "Click a fish to catch it!");
    const labels = ["Flute", "MB", "Tennis"];
    const ys = [H * 0.30, H * 0.50, H * 0.70];
    game.choiceFish = labels.map((label, i) => ({
      label,
      x: W - 250,
      y: ys[i],
      baseY: ys[i],
      bob: rand(0, 6.28),
      eaten: false,
      scale: 1,
    }));
    game.chaseFish = null;
  }

  // ---------------------------------------------------------------------
  //  Flow control
  // ---------------------------------------------------------------------
  function startDive() {
    if (game.phase !== "INTRO") return;
    game.phase = "DIVING";
    game.diveT = 0;
  }

  function resetGame() {
    returnBtn.classList.add("hidden");
    skipBtn.classList.remove("hidden");
    game.phase = "INTRO";
    game.time = game.time; // keep clock
    game.worldX = 0;
    game.scrollSpeed = 350;
    game.birdY = 300;
    game.birdVY = 0;
    game.birdAngle = 0;
    game.chomp = 0;
    game.diveT = 0;
    game.murkTimer = 0;
    game.shake = 0;
    setNarr("Game Start", "Press SPACE to Start Playing!");
    seedWorld();
  }

  function die() {
    if (game.phase === "DEAD") return;
    game.phase = "DEAD";
    game.shake = 1;
    setNarr("Caught by the rocks!", "");
    // burst of particles
    for (let i = 0; i < 26; i++) {
      game.particles.push({
        x: BIRD_X, y: game.birdY,
        vx: rand(-260, 260), vy: rand(-320, 120),
        life: rand(0.5, 1.1), r: rand(2, 6),
        col: Math.random() < 0.5 ? "#cdd6da" : "#8a3b2e",
      });
    }
    setTimeout(() => returnBtn.classList.remove("hidden"), 500);
  }

  // ---------------------------------------------------------------------
  //  Ending fish selection
  // ---------------------------------------------------------------------
  const SUBPAGE_URLS = {
    Flute: "../Minki_1st_Subpage_Flute/",
    MB: "../Minki_2nd_Subpage_Marine_Biology/",
    Tennis: "../Minki_3rd_Subpage_Tennis/",
  };

  function tryPickFish(px, py) {
    if (game.chosen) return;
    for (const f of game.choiceFish) {
      if (f.eaten) continue;
      if (Math.hypot(px - f.x, py - f.y) < 90) {
        game.chosen = f;
        setNarr(`Delicious - the "${f.label}" fish!`, "Journey Complete.");
        const nextUrl = SUBPAGE_URLS[f.label];
        if (nextUrl) {
          setTimeout(() => { window.location.href = nextUrl; }, 900);
        }
        break;
      }
    }
  }

  // =====================================================================
  //  UPDATE
  // =====================================================================
  function update(dt) {
    game.time += dt;

    // ambient bubbles always rise
    for (const b of game.bubbles) {
      b.y -= b.spd * dt;
      b.x += Math.sin(game.time * 1.5 + b.ph) * 8 * dt;
      if (b.y < -10) { b.y = H + 10; b.x = rand(0, W); }
    }

    if (game.phase === "INTRO") {
      updateIntro(dt);
    } else if (game.phase === "DIVING") {
      updateDiving(dt);
    } else if (game.phase === "SWIM") {
      updateSwim(dt);
    } else if (game.phase === "DEAD") {
      updateParticles(dt);
    } else if (game.phase === "ENDING") {
      updateEnding(dt);
    }

    game.shake = Math.max(0, game.shake - dt * 2.2);
  }

  function updateIntro(dt) {
    // gentle idle breathing handled in draw; nothing physics-wise
  }

  function updateDiving(dt) {
    game.diveT += dt;
    // arc from the rock into the water, then hand off to SWIM
    if (game.diveT > 1.0) {
      game.phase = "SWIM";
      game.birdY = WATER_TOP + 150;
      game.birdVY = 120;
    }
  }

  function updateSwim(dt) {
    // Cruise speed, with a big burst whenever the Mosasaur is on-screen so the
    // nimble Hesperornis always outruns it, then eases back down once it's gone.
    const CRUISE = 504;      // 40% faster than the original 360
    const BOOST = 780;       // escape burst - far quicker than the Mosasaur
    // Only burst away once the Mosasaur actually lunges, so the user gets to
    // SEE it swim in and loom first, then watch the Hesperornis dart away.
    const escaping = game.mosa && game.mosa.state === "giveup";
    const target = escaping ? BOOST : CRUISE;
    const rate = escaping ? 2.4 : 0.7;     // snap up fast, ease back gently
    game.scrollSpeed = lerp(game.scrollSpeed, target, dt * rate);
    game.worldX += game.scrollSpeed * dt;

    // fire distance events
    for (const ev of game.events) {
      if (!ev.done && game.worldX >= ev.at) { ev.done = true; ev.fn(); }
    }

    // flap physics
    if (input.flapQueued) {
      game.birdVY = FLAP;
      game.chomp = Math.min(1, game.chomp + 0.4);
      input.flapQueued = false;
      // little splash of bubbles behind the feet
      for (let i = 0; i < 4; i++) {
        game.bubbles.push({ x: BIRD_X - 120 + rand(-10, 10), y: game.birdY + rand(-10, 20), r: rand(2, 4), spd: rand(30, 60), ph: rand(0, 6.28) });
        if (game.bubbles.length > 90) game.bubbles.shift();
      }
    }
    game.birdVY = clamp(game.birdVY + GRAVITY * dt, -600, MAX_FALL);
    game.birdY += game.birdVY * dt;

    // keep within water; touching either bound is a soft bump
    if (game.birdY < WATER_TOP + 34) { game.birdY = WATER_TOP + 34; game.birdVY = Math.max(0, game.birdVY); }
    if (game.birdY > WATER_BOT - 34) { game.birdY = WATER_BOT - 34; game.birdVY = 0; }

    game.birdAngle = clamp(game.birdVY / 900, -0.5, 0.6);
    game.chomp = Math.max(0, game.chomp - dt * 2.2);

    // background fish drift
    for (const f of game.fishes) {
      f.x -= (game.scrollSpeed * f.depth * 0.7 + f.speed) * dt;
      if (f.x < -80) { f.x = W + rand(60, 500); f.y = rand(WATER_TOP + 40, WATER_BOT - 40); }
    }

    // chase fish stays ahead of the bird, bobbing playfully
    if (game.chaseFish) {
      const cf = game.chaseFish;
      cf.bob += dt;
      cf.y = clamp(game.birdY + Math.sin(cf.bob * 2) * 60 - 30, WATER_TOP + 40, WATER_BOT - 40);
      cf.x = 980 + Math.sin(cf.bob * 1.3) * 30;
    }

    // rocks scroll & collide
    for (const rk of game.rocks) {
      rk.ang += rk.spin * dt;
    }
    const bx = BIRD_X, by = game.birdY;
    for (const rk of game.rocks) {
      const sx = rk.x - game.worldX + 700; // convert to screen space
      rk.sx = sx;
      if (sx < -120 || sx > W + 200) continue;
      const d = Math.hypot(sx - bx, rk.y - by);
      if (d < rk.r * 0.82 + 26) { die(); }
    }

    // mosasaur behaviour
    if (game.mosa) updateMosasaur(dt);

    // murky timer
    if (game.murkTimer > 0) {
      game.murkTimer -= dt;
      // ramp darkness up then down over the 4s window
      const p = game.murkTimer;
      game.murk = clamp(Math.sin((1 - p / 4) * Math.PI), 0, 1);
      if (game.murkTimer <= 0) game.murk = 0;
    }

    updateParticles(dt);
  }

  function updateMosasaur(dt) {
    const m = game.mosa;
    m.t += dt;
    m.jaw = (Math.sin(game.time * 7) * 0.5 + 0.5);

    // The jaw tip sits at roughly m.x + 268 in screen space. We NEVER let it get
    // within CLOSEST of the bird, so the Mosasaur can never actually touch it,
    // but it comes far enough in that its huge head and jaws are clearly seen.
    const CLOSEST = -78;

    if (m.state === "enter") {
      // Swim into view from behind so the user clearly sees the beast.
      m.vx = lerp(m.vx, 320, dt * 2);
      m.x += m.vx * dt;
      m.y = lerp(m.y, game.birdY + 70, dt * 1.6);
      if (m.x >= CLOSEST) { m.x = CLOSEST; m.state = "loom"; m.loomT = 0; }
    } else if (m.state === "loom") {
      // Hold a tense, jaws-snapping stand-off right behind the Hesperornis.
      m.x = lerp(m.x, CLOSEST, dt * 5);
      m.y = lerp(m.y, game.birdY + 55, dt * 2.5);
      m.loomT += dt;
      if (m.loomT > 1.4) m.state = "giveup";
    } else {
      // The Hesperornis bursts ahead and the Mosasaur can't keep up,
      // sliding backwards off the screen. Nimbleness wins.
      m.vx = lerp(m.vx, -540, dt * 1.5);
      m.x += m.vx * dt;
      m.y = lerp(m.y, WATER_BOT - 130, dt);
      if (m.x < -1100) {
        game.mosa = null;
        setNarr("Too slow, Mosasaur!", "The Hesperornis darts away.");
      }
    }
  }

  function updateParticles(dt) {
    for (const p of game.particles) {
      p.vy += 500 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    game.particles = game.particles.filter((p) => p.life > 0);
  }

  function updateEnding(dt) {
    game.endGlow = Math.min(1, game.endGlow + dt * 0.5);
    for (const f of game.choiceFish) {
      f.bob += dt;
      if (!f.eaten) f.y = f.baseY + Math.sin(f.bob * 1.6) * 12;
    }
    if (game.chosen) {
      const f = game.chosen;
      // bird swims toward the chosen fish and eats it
      game.birdY = lerp(game.birdY, f.y, dt * 3);
      f.x = lerp(f.x, BIRD_X + 40, dt * 3);
      game.chomp = Math.min(1, game.chomp + dt * 3);
      if (Math.abs(f.x - (BIRD_X + 40)) < 20 && !f.eaten) {
        f.eaten = true;
        for (let i = 0; i < 14; i++) {
          game.bubbles.push({ x: BIRD_X + 30, y: game.birdY, r: rand(2, 5), spd: rand(30, 70), ph: rand(0, 6.28) });
        }
      }
    }
  }

  // =====================================================================
  //  RENDER
  // =====================================================================
  function render() {
    ctx.save();
    if (game.shake > 0) {
      ctx.translate(rand(-1, 1) * 10 * game.shake, rand(-1, 1) * 10 * game.shake);
    }

    if (game.phase === "INTRO" || game.phase === "DIVING") {
      drawShoreScene();
    } else {
      drawOceanScene();
    }

    drawNarrationBar();
    ctx.restore();
  }

  // ---------- SHORE (Screen 1 start) ----------
  function drawShoreScene() {
    // warm sunny sky
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.62);
    sky.addColorStop(0, "#bfe3f4");
    sky.addColorStop(0.6, "#eaf6ff");
    sky.addColorStop(1, "#fdf3d6");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // bright sun with glow
    const sunX = W * 0.24, sunY = H * 0.22;
    const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 240);
    glow.addColorStop(0, "rgba(255,247,210,0.95)");
    glow.addColorStop(0.4, "rgba(255,240,180,0.5)");
    glow.addColorStop(1, "rgba(255,240,180,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff6c8";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 58, 0, 6.2832);
    ctx.fill();

    // drifting clouds
    drawCloud(W * 0.55 + Math.sin(game.time * 0.1) * 20, H * 0.16, 1.1);
    drawCloud(W * 0.8 + Math.sin(game.time * 0.08) * 15, H * 0.28, 0.8);
    drawCloud(W * 0.38 + Math.sin(game.time * 0.12) * 18, H * 0.30, 0.6);

    // sea (right / lower area)
    const seaTop = H * 0.60;
    const sea = ctx.createLinearGradient(0, seaTop, 0, H);
    sea.addColorStop(0, "#3f8fb0");
    sea.addColorStop(1, "#1c4f6b");
    ctx.fillStyle = sea;
    ctx.fillRect(0, seaTop, W, H - seaTop);
    // wavy highlights
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const yy = seaTop + 24 + i * 26;
      for (let x = 0; x <= W; x += 20) {
        const y = yy + Math.sin(x * 0.03 + game.time * 1.5 + i) * 4;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // a little fish "swimming away" in the sea (from the sketch)
    const fx = W * 0.72 + Math.sin(game.time) * 10;
    const fy = seaTop + 70 + Math.sin(game.time * 2) * 6;
    drawFish(fx, fy, 0.7, COL.fishBody, Math.PI); // facing away/right

    // rocky shore on the left
    drawShoreRocks(seaTop);

    // Hesperornis standing/diving on the rock
    const bob = Math.sin(game.time * 2) * 3;
    let bx = W * 0.20, by = seaTop - 84 + bob;
    let lean = 0;
    if (game.phase === "DIVING") {
      const t = clamp(game.diveT / 1.0, 0, 1);
      // leap arc off the rock toward the water
      bx = lerp(W * 0.20, W * 0.42, t);
      by = lerp(seaTop - 84, seaTop + 30, t) - Math.sin(t * Math.PI) * 120;
      lean = lerp(0, Math.PI * 0.55, t);
    }
    drawHesperornisDiving(bx, by, lean);
  }

  function drawCloud(x, y, s) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.ellipse(x, y, 46 * s, 28 * s, 0, 0, 6.28);
    ctx.ellipse(x + 40 * s, y + 6 * s, 36 * s, 22 * s, 0, 0, 6.28);
    ctx.ellipse(x - 40 * s, y + 8 * s, 34 * s, 20 * s, 0, 0, 6.28);
    ctx.ellipse(x, y - 14 * s, 30 * s, 22 * s, 0, 0, 6.28);
    ctx.fill();
  }

  function drawShoreRocks(seaTop) {
    ctx.fillStyle = "#6b5a48";
    ctx.beginPath();
    ctx.moveTo(0, seaTop + 40);
    ctx.lineTo(0, H);
    ctx.lineTo(W * 0.34, H);
    ctx.quadraticCurveTo(W * 0.30, seaTop + 30, W * 0.22, seaTop + 8);
    ctx.quadraticCurveTo(W * 0.14, seaTop - 6, W * 0.05, seaTop + 26);
    ctx.closePath();
    ctx.fill();
    // rock shading
    ctx.fillStyle = "#5a4b3c";
    ctx.beginPath();
    ctx.moveTo(0, seaTop + 60);
    ctx.quadraticCurveTo(W * 0.16, seaTop + 34, W * 0.24, seaTop + 40);
    ctx.quadraticCurveTo(W * 0.30, seaTop + 60, W * 0.34, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    // highlights
    ctx.strokeStyle = "rgba(255,240,200,0.25)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W * 0.06, seaTop + 24);
    ctx.quadraticCurveTo(W * 0.16, seaTop - 2, W * 0.22, seaTop + 6);
    ctx.stroke();
  }

  // ---------- OCEAN (Screens 2-5) ----------
  function drawOceanScene() {
    // depth gradient, darkened during murky phase
    const g = ctx.createLinearGradient(0, 0, 0, H);
    if (game.murk > 0) {
      g.addColorStop(0, mix("#2c6f86", "#0a2230", game.murk));
      g.addColorStop(0.5, mix("#1c5570", "#06161f", game.murk));
      g.addColorStop(1, mix("#0c2f42", "#020a10", game.murk));
    } else {
      g.addColorStop(0, "#2f7d97");
      g.addColorStop(0.5, "#1c5570");
      g.addColorStop(1, "#0c2f42");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // god rays from the surface
    drawSunRays();

    // seaweed (parallax floor plants)
    drawSeaweed();

    // background shoal (they swim left, so they face left)
    for (const f of game.fishes) {
      drawFish(f.x, f.y, f.depth * 0.7, f.col, Math.PI, game.time * 4 + f.phase);
    }

    // rocks (obstacles)
    for (const rk of game.rocks) {
      const sx = rk.x - game.worldX + 700;
      if (sx < -140 || sx > W + 200) continue;
      drawRock(sx, rk.y, rk.r, rk.seed, rk.ang);
    }

    // mosasaur (behind bird, so draw before the bird)
    if (game.mosa) drawMosasaur(game.mosa.x, game.mosa.y, game.mosa.jaw, game.time);

    // chase fish (fleeing to the right, so it faces right)
    if (game.chaseFish) drawFish(game.chaseFish.x, game.chaseFish.y, 0.85, COL.fishBody, 0, game.time * 8);

    // ending choice fish + speech bubbles
    if (game.phase === "ENDING") drawChoiceFish();

    // Hesperornis (hero) - draw on top
    if (game.phase !== "DEAD" || game.time % 0.2 < 0.14) {
      drawHesperornisSwimming(BIRD_X, game.birdY, game.birdAngle, game.time, game.chomp);
    }

    // rising bubbles (foreground)
    ctx.fillStyle = "rgba(220,240,250,0.5)";
    for (const b of game.bubbles) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 6.28);
      ctx.fill();
    }

    // particles (death splash)
    for (const p of game.particles) {
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.28);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // murky vignette
    if (game.murk > 0) {
      const v = ctx.createRadialGradient(BIRD_X, game.birdY, 60, BIRD_X, game.birdY, 620);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, `rgba(0,0,0,${0.6 * game.murk})`);
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
    }

    // ending warm glow
    if (game.phase === "ENDING") {
      ctx.fillStyle = `rgba(255,225,150,${0.14 * game.endGlow})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawSunRays() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 6; i++) {
      const x = ((i * 260 + game.time * 20) % (W + 400)) - 200;
      ctx.fillStyle = `rgba(180,225,235,${0.05 + 0.02 * Math.sin(game.time + i)})`;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 120, 0);
      ctx.lineTo(x + 260, H);
      ctx.lineTo(x + 60, H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSeaweed() {
    for (const s of game.seaweed) {
      const sx = s.x - game.worldX * 0.6 + 700;
      const wrapped = ((sx % 4200) + 4200) % 4200;
      const x = wrapped - 100;
      if (x < -60 || x > W + 60) continue;
      ctx.strokeStyle = s.col;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, H);
      for (let seg = 1; seg <= 5; seg++) {
        const yy = H - (s.h / 5) * seg;
        const xx = x + Math.sin(game.time * 1.2 + s.sway + seg * 0.6) * seg * 4;
        ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    }
  }

  // ---------------------------------------------------------------------
  //  CHARACTER: Hesperornis (swimming, faces right)
  // ---------------------------------------------------------------------
  function drawHesperornisSwimming(x, y, angle, t, chomp) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const und = Math.sin(t * 8) * 0.06;   // body undulation
    ctx.rotate(und);

    // ---- webbed feet trailing behind (paddling) ----
    const paddle = Math.sin(t * 9);
    drawFoot(-70, 18, paddle);
    drawFoot(-82, 30, -paddle * 0.8);

    // ---- body (elongated teardrop) ----
    ctx.beginPath();
    ctx.moveTo(60, 2);                                   // toward neck base (front)
    ctx.bezierCurveTo(40, -34, -30, -40, -95, -12);     // back top
    ctx.bezierCurveTo(-120, -2, -120, 12, -95, 20);     // tail tip
    ctx.bezierCurveTo(-40, 40, 30, 36, 60, 12);         // belly
    ctx.closePath();
    const bodyGrad = ctx.createLinearGradient(0, -40, 0, 36);
    bodyGrad.addColorStop(0, COL.birdBackHi);
    bodyGrad.addColorStop(0.5, COL.birdBack);
    bodyGrad.addColorStop(0.55, COL.birdBelly);
    bodyGrad.addColorStop(1, COL.birdBellyLo);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    // back shading line (countershading)
    ctx.strokeStyle = "rgba(20,30,40,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(45, 0);
    ctx.bezierCurveTo(0, -6, -60, -4, -100, 6);
    ctx.stroke();

    // ---- long neck curving up & forward ----
    const neckBob = Math.sin(t * 4) * 4;
    ctx.beginPath();
    ctx.moveTo(48, -6);
    ctx.bezierCurveTo(84, -20, 96, -46 + neckBob, 120, -58 + neckBob);
    ctx.lineTo(132, -46 + neckBob);
    ctx.bezierCurveTo(104, -34 + neckBob, 84, -6, 60, 8);
    ctx.closePath();
    ctx.fillStyle = COL.birdBack;
    ctx.fill();

    // ---- head ----
    const hx = 128, hy = -54 + neckBob;
    ctx.beginPath();
    ctx.ellipse(hx, hy, 18, 15, -0.3, 0, 6.28);
    ctx.fillStyle = COL.birdBackHi;
    ctx.fill();

    // ---- long toothed beak (opens with chomp) ----
    const open = chomp * 0.32;
    ctx.save();
    ctx.translate(hx + 6, hy - 2);
    ctx.rotate(-0.25);
    // upper beak
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(66, -8 - open * 6);
    ctx.lineTo(66, -2 - open * 6);
    ctx.lineTo(4, 2);
    ctx.closePath();
    ctx.fillStyle = COL.beak;
    ctx.fill();
    // lower beak
    ctx.beginPath();
    ctx.moveTo(2, 4);
    ctx.lineTo(60, 6 + open * 10);
    ctx.lineTo(60, 12 + open * 10);
    ctx.lineTo(6, 12);
    ctx.closePath();
    ctx.fillStyle = "#2f3a43";
    ctx.fill();
    // tiny teeth
    ctx.fillStyle = "#f2eede";
    for (let i = 0; i < 7; i++) {
      const tx = 12 + i * 8;
      ctx.beginPath();
      ctx.moveTo(tx, -2 - open * 6);
      ctx.lineTo(tx + 2, 2 - open * 6);
      ctx.lineTo(tx + 4, -2 - open * 6);
      ctx.fill();
    }
    // beak tip
    ctx.fillStyle = COL.beakTip;
    ctx.beginPath();
    ctx.moveTo(60, -6 - open * 6);
    ctx.lineTo(70, -3 - open * 3);
    ctx.lineTo(60, 0 - open * 6);
    ctx.fill();
    ctx.restore();

    // ---- eye ----
    ctx.fillStyle = COL.eyeRing;
    ctx.beginPath();
    ctx.arc(hx + 6, hy - 4, 5, 0, 6.28);
    ctx.fill();
    ctx.fillStyle = "#12181c";
    ctx.beginPath();
    ctx.arc(hx + 7, hy - 4, 2.6, 0, 6.28);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(hx + 8, hy - 5, 1, 0, 6.28);
    ctx.fill();

    ctx.restore();
  }

  function drawFoot(x, y, paddle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(paddle * 0.5);
    // leg
    ctx.strokeStyle = COL.foot;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(6, -6);
    ctx.lineTo(-16, 10);
    ctx.stroke();
    // webbed foot
    ctx.fillStyle = COL.footHi;
    ctx.beginPath();
    ctx.moveTo(-16, 8);
    ctx.lineTo(-34, 2 + paddle * 6);
    ctx.lineTo(-36, 14);
    ctx.lineTo(-34, 24 - paddle * 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------------
  //  CHARACTER: Hesperornis (diving / upright on rock, faces right)
  // ---------------------------------------------------------------------
  function drawHesperornisDiving(x, y, lean) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);

    // legs down to the rock (only when upright)
    if (lean < 0.2) {
      ctx.strokeStyle = COL.foot;
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-4, 60); ctx.lineTo(-10, 100); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, 60); ctx.lineTo(14, 100); ctx.stroke();
      // clawed webbed feet
      ctx.fillStyle = COL.footHi;
      for (const fx of [-14, 12]) {
        ctx.beginPath();
        ctx.moveTo(fx, 100);
        ctx.lineTo(fx - 14, 108);
        ctx.lineTo(fx - 2, 110);
        ctx.lineTo(fx + 12, 108);
        ctx.closePath();
        ctx.fill();
      }
    }

    // upright body (egg shaped, belly forward)
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.bezierCurveTo(34, -20, 40, 40, 18, 64);
    ctx.bezierCurveTo(2, 78, -22, 70, -28, 40);
    ctx.bezierCurveTo(-34, 6, -26, -22, 0, -30);
    ctx.closePath();
    const bg = ctx.createLinearGradient(-30, 0, 30, 0);
    bg.addColorStop(0, COL.birdBack);
    bg.addColorStop(0.6, COL.birdBack);
    bg.addColorStop(0.62, COL.birdBelly);
    bg.addColorStop(1, COL.birdBellyLo);
    ctx.fillStyle = bg;
    ctx.fill();

    // long neck up
    ctx.beginPath();
    ctx.moveTo(6, -24);
    ctx.bezierCurveTo(18, -60, 20, -100, 34, -128);
    ctx.lineTo(48, -122);
    ctx.bezierCurveTo(36, -96, 30, -58, 24, -22);
    ctx.closePath();
    ctx.fillStyle = COL.birdBack;
    ctx.fill();

    // head
    const hx = 42, hy = -128;
    ctx.beginPath();
    ctx.ellipse(hx, hy, 15, 13, 0.3, 0, 6.28);
    ctx.fillStyle = COL.birdBackHi;
    ctx.fill();

    // long beak (slightly open, pointing up-forward)
    ctx.save();
    ctx.translate(hx + 4, hy - 4);
    ctx.rotate(-0.5);
    ctx.fillStyle = COL.beak;
    ctx.beginPath();
    ctx.moveTo(0, -3); ctx.lineTo(58, -8); ctx.lineTo(58, -2); ctx.lineTo(2, 2); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#2f3a43";
    ctx.beginPath();
    ctx.moveTo(2, 4); ctx.lineTo(52, 8); ctx.lineTo(52, 14); ctx.lineTo(4, 10); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f2eede";
    for (let i = 0; i < 6; i++) {
      const tx = 12 + i * 8;
      ctx.beginPath(); ctx.moveTo(tx, -2); ctx.lineTo(tx + 2, 2); ctx.lineTo(tx + 4, -2); ctx.fill();
    }
    ctx.fillStyle = COL.beakTip;
    ctx.beginPath(); ctx.moveTo(54, -6); ctx.lineTo(64, -3); ctx.lineTo(54, 0); ctx.fill();
    ctx.restore();

    // eye
    ctx.fillStyle = COL.eyeRing;
    ctx.beginPath(); ctx.arc(hx + 4, hy - 3, 4.5, 0, 6.28); ctx.fill();
    ctx.fillStyle = "#12181c";
    ctx.beginPath(); ctx.arc(hx + 5, hy - 3, 2.4, 0, 6.28); ctx.fill();

    ctx.restore();
  }

  // ---------------------------------------------------------------------
  //  CHARACTER: Mosasaur (whale/shark hybrid, very long tail, faces right)
  // ---------------------------------------------------------------------
  function drawMosasaur(x, y, jaw, t) {
    ctx.save();
    ctx.translate(x, y);
    const swim = Math.sin(t * 3) * 0.05;
    ctx.rotate(swim);
    const S = 1.0;
    ctx.scale(S, S);

    // ---- very long tail (undulating), drawn from behind the body ----
    ctx.beginPath();
    ctx.moveTo(-40, -26);
    const tailWave = Math.sin(t * 4);
    ctx.bezierCurveTo(-160, -30 + tailWave * 10, -320, -20 + tailWave * 26, -430, 6 + tailWave * 40);
    ctx.bezierCurveTo(-330, 20 + tailWave * 30, -160, 30 + tailWave * 10, -40, 30);
    ctx.closePath();
    const tg = ctx.createLinearGradient(0, -30, 0, 30);
    tg.addColorStop(0, COL.mosaBack);
    tg.addColorStop(1, COL.mosaBelly);
    ctx.fillStyle = tg;
    ctx.fill();
    // tail fluke
    ctx.fillStyle = COL.mosaBack;
    ctx.beginPath();
    ctx.moveTo(-430, 6 + tailWave * 40);
    ctx.lineTo(-478, -34 + tailWave * 40);
    ctx.lineTo(-452, 6 + tailWave * 40);
    ctx.lineTo(-478, 52 + tailWave * 40);
    ctx.closePath();
    ctx.fill();

    // ---- main body ----
    ctx.beginPath();
    ctx.moveTo(150, -30);                       // near the head
    ctx.bezierCurveTo(120, -70, -20, -66, -60, -30);
    ctx.bezierCurveTo(-90, -6, -90, 30, -40, 40);
    ctx.bezierCurveTo(40, 56, 130, 40, 165, 8);
    ctx.closePath();
    const bg = ctx.createLinearGradient(0, -66, 0, 56);
    bg.addColorStop(0, COL.mosaBackHi);
    bg.addColorStop(0.5, COL.mosaBack);
    bg.addColorStop(0.55, COL.mosaBelly);
    bg.addColorStop(1, "#889a86");
    ctx.fillStyle = bg;
    ctx.fill();

    // dorsal ridge
    ctx.strokeStyle = "rgba(20,30,20,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(120, -52);
    ctx.bezierCurveTo(40, -64, -30, -60, -70, -28);
    ctx.stroke();
    // gill/rib strokes
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(70 - i * 22, -40);
      ctx.quadraticCurveTo(64 - i * 22, -10, 74 - i * 22, 20);
      ctx.stroke();
    }

    // ---- front flippers ----
    ctx.fillStyle = COL.mosaBack;
    ctx.beginPath();
    ctx.moveTo(70, 30);
    ctx.quadraticCurveTo(60, 78, 110, 74);
    ctx.quadraticCurveTo(96, 44, 96, 28);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(20, 34);
    ctx.quadraticCurveTo(6, 74, 46, 72);
    ctx.quadraticCurveTo(40, 46, 44, 30);
    ctx.closePath();
    ctx.fill();

    // ---- head + gaping jaw ----
    const j = jaw * 26;
    // upper jaw
    ctx.beginPath();
    ctx.moveTo(150, -30);
    ctx.bezierCurveTo(210, -44, 250, -34, 268, -20);
    ctx.lineTo(262, -6);
    ctx.bezierCurveTo(240, -12, 200, -12, 156, -6);
    ctx.closePath();
    ctx.fillStyle = COL.mosaBackHi;
    ctx.fill();
    // mouth interior
    ctx.beginPath();
    ctx.moveTo(158, -4);
    ctx.lineTo(262, -4);
    ctx.lineTo(256, 8 + j);
    ctx.lineTo(160, 12 + j);
    ctx.closePath();
    ctx.fillStyle = COL.mouth;
    ctx.fill();
    // lower jaw
    ctx.beginPath();
    ctx.moveTo(156, 12 + j);
    ctx.bezierCurveTo(200, 20 + j, 240, 18 + j, 258, 10 + j);
    ctx.lineTo(252, 24 + j);
    ctx.bezierCurveTo(220, 36 + j, 180, 36 + j, 156, 28 + j);
    ctx.closePath();
    ctx.fillStyle = COL.mosaBelly;
    ctx.fill();
    // teeth (upper + lower)
    ctx.fillStyle = COL.tooth;
    for (let i = 0; i < 9; i++) {
      const tx = 168 + i * 10;
      ctx.beginPath();
      ctx.moveTo(tx, -4); ctx.lineTo(tx + 3, 6); ctx.lineTo(tx + 6, -4); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(tx, 12 + j); ctx.lineTo(tx + 3, 4 + j); ctx.lineTo(tx + 6, 12 + j); ctx.fill();
    }

    // eye
    ctx.fillStyle = "#0d130d";
    ctx.beginPath(); ctx.arc(196, -30, 6, 0, 6.28); ctx.fill();
    ctx.fillStyle = "#c9d86a";
    ctx.beginPath(); ctx.arc(197, -31, 2.4, 0, 6.28); ctx.fill();

    ctx.restore();
  }

  // ---------------------------------------------------------------------
  //  Small fish
  // ---------------------------------------------------------------------
  function drawFish(x, y, s, col, dir, wag) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (dir) ctx.scale(-1, 1);          // face right by default flip
    const tw = Math.sin((wag || 0)) * 6;
    // body
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.quadraticCurveTo(4, -14, -20, 0);
    ctx.quadraticCurveTo(4, 14, 26, 0);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
    // belly highlight
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.moveTo(20, 2);
    ctx.quadraticCurveTo(2, 10, -14, 2);
    ctx.quadraticCurveTo(4, 8, 20, 2);
    ctx.fill();
    // tail
    ctx.fillStyle = COL.fishFin;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-34, -10 + tw);
    ctx.lineTo(-30, 0);
    ctx.lineTo(-34, 10 + tw);
    ctx.closePath();
    ctx.fill();
    // eye
    ctx.fillStyle = "#12181c";
    ctx.beginPath();
    ctx.arc(16, -2, 2.2, 0, 6.28);
    ctx.fill();
    ctx.restore();
  }

  function drawChoiceFish() {
    for (const f of game.choiceFish) {
      if (f.eaten) continue;
      // fish faces LEFT toward the bird
      drawFish(f.x, f.y, 1.15, COL.fishBody, 1, game.time * 8);
      // speech bubble with the label
      drawSpeechBubble(f.x + 46, f.y - 4, f.label);
    }
  }

  function drawSpeechBubble(x, y, text) {
    ctx.font = '700 26px "Cinzel", Georgia, serif';
    const w = ctx.measureText(text).width + 34;
    const h = 44;
    ctx.fillStyle = "rgba(255,250,235,0.95)";
    ctx.strokeStyle = "#8a3b2e";
    ctx.lineWidth = 3;
    roundRect(ctx, x, y - h / 2, w, h, 12);
    ctx.fill();
    ctx.stroke();
    // little tail toward the fish
    ctx.beginPath();
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x - 14, y + 2);
    ctx.lineTo(x + 6, y - 8);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,250,235,0.95)";
    ctx.fill();
    // text
    ctx.fillStyle = "#7a2e1f";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + 17, y + 1);
  }

  // ---------------------------------------------------------------------
  //  ROCK obstacle
  // ---------------------------------------------------------------------
  function drawRock(x, y, r, seed, ang) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    const pts = 9;
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const rr = r * (0.78 + 0.22 * Math.sin(seed + i * 1.7));
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr * 0.9;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    const rg = ctx.createLinearGradient(-r, -r, r, r);
    rg.addColorStop(0, "#6f6252");
    rg.addColorStop(1, "#413a30");
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 3;
    ctx.stroke();
    // cracks / texture
    ctx.strokeStyle = "rgba(255,240,210,0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.4);
    ctx.lineTo(r * 0.1, 0);
    ctx.lineTo(-r * 0.2, r * 0.4);
    ctx.stroke();
    // a bit of clinging moss
    ctx.fillStyle = "rgba(60,107,69,0.5)";
    ctx.beginPath();
    ctx.ellipse(-r * 0.2, -r * 0.5, r * 0.4, r * 0.18, -0.4, 0, 6.28);
    ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------------
  //  Narration bar (parchment band, top of screen)
  // ---------------------------------------------------------------------
  function drawNarrationBar() {
    const bw = 720, bh = 66;
    const bx = (W - bw) / 2, by = 14;
    // band
    const grad = ctx.createLinearGradient(0, by, 0, by + bh);
    grad.addColorStop(0, "rgba(31,22,12,0.86)");
    grad.addColorStop(1, "rgba(20,14,8,0.9)");
    roundRect(ctx, bx, by, bw, bh, 12);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "rgba(220,180,120,0.85)";
    ctx.lineWidth = 3;
    ctx.stroke();
    // inner keyline
    roundRect(ctx, bx + 6, by + 6, bw - 12, bh - 12, 8);
    ctx.strokeStyle = "rgba(220,180,120,0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // pop-in animation
    const age = game.time - game.narrShownAt;
    const pop = clamp(age / 0.3, 0, 1);
    ctx.save();
    ctx.globalAlpha = pop;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f6e2b6";
    ctx.font = '700 30px "Cinzel", Georgia, serif';
    const hasSub = game.subNarration && game.subNarration.length;
    ctx.fillText(game.narration, W / 2, by + (hasSub ? 24 : bh / 2));

    if (hasSub) {
      ctx.fillStyle = "#e8c88a";
      ctx.font = '600 20px "Caveat", cursive';
      ctx.fillText(game.subNarration, W / 2, by + 48);
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------
  //  Colour mixing utility
  // ---------------------------------------------------------------------
  function mix(a, b, t) {
    const pa = hex(a), pb = hex(b);
    const r = Math.round(lerp(pa[0], pb[0], t));
    const g = Math.round(lerp(pa[1], pb[1], t));
    const bl = Math.round(lerp(pa[2], pb[2], t));
    return `rgb(${r},${g},${bl})`;
  }
  function hex(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // ---------------------------------------------------------------------
  //  Main loop
  // ---------------------------------------------------------------------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  // Wait for fonts so the parchment text renders correctly, then go.
  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    seedWorld();
    hintEl.classList.add("hidden");
    last = performance.now();
    requestAnimationFrame(loop);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(boot);
    // safety fallback in case fonts hang
    setTimeout(boot, 1500);
  } else {
    boot();
  }
})();
