/* =========================================================
   Into the Deep — interaction & scroll choreography
   ========================================================= */
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const body = document.body;
const castBtn = document.getElementById("cast-btn");
const hero = document.getElementById("hero");
const rod = document.getElementById("rod-group");
const castBait = document.getElementById("cast-bait");
const scrollCue = document.getElementById("scroll-cue");
const sinkingBait = document.getElementById("sinking-bait");
const surfaceRod = document.getElementById("surface-rod");
const rig = [sinkingBait, surfaceRod]; // bait + line + rod move/fade together
const depthGauge = document.getElementById("depth-gauge");
const depthFill = document.querySelector(".depth-fill");
const depthValue = document.querySelector(".depth-value");

let hasCast = false;

/* lock scrolling until the line is cast */
body.classList.add("no-scroll");
window.scrollTo(0, 0);

/* ----------------------------------------------------------
   SCREEN 1 — click to cast the rod, bait flies into the sea
   ---------------------------------------------------------- */
function castLine() {
  if (hasCast) return;
  hasCast = true;
  castBtn.style.pointerEvents = "none";

  const tl = gsap.timeline({
    onComplete: () => {
      body.classList.remove("no-scroll");
      gsap.to(scrollCue, { opacity: 1, duration: 0.6 });
      gsap.to(depthGauge, { opacity: 1, duration: 0.6 });
      gsap.to(rig, { opacity: 1, duration: 0.8 });
    },
  });

  // wind up, then whip the rod forward
  tl.to(castBtn, { opacity: 0, y: 12, duration: 0.3 })
    .to(rod, { rotation: -42, duration: 0.45, ease: "power2.out", transformOrigin: "252px 250px" })
    .to(rod, { rotation: 38, duration: 0.32, ease: "power3.in", transformOrigin: "252px 250px" });

  // release the bait: arc up into the sky then splash into the sea
  tl.set(castBait, { opacity: 1 }, "-=0.12")
    .to(
      castBait,
      {
        duration: 1.15,
        ease: "power1.inOut",
        motionPath: {
          path: [
            { x: 60, y: -120 },
            { x: 230, y: -180 },
            { x: 430, y: -40 },
            { x: 540, y: 230 },
          ],
          curviness: 1.3,
        },
      },
      "-=0.05"
    )
    .add(makeSplash, "-=0.05")
    .to(castBait, { opacity: 0, duration: 0.2 });

  // gentle camera pan toward the water as the bait drops
  tl.to(hero, { backgroundPosition: "0 30%", duration: 1.1 }, "-=1.0");
}

function makeSplash() {
  const rect = castBait.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < 10; i++) {
    const drop = document.createElement("div");
    drop.className = "splash";
    drop.style.left = cx + "px";
    drop.style.top = cy + "px";
    document.body.appendChild(drop);
    gsap.to(drop, {
      x: gsap.utils.random(-70, 70),
      y: gsap.utils.random(-90, -20),
      opacity: 0,
      scale: gsap.utils.random(0.4, 1.2),
      duration: gsap.utils.random(0.5, 0.9),
      ease: "power2.out",
      onComplete: () => drop.remove(),
    });
  }
}

castBtn.addEventListener("click", castLine);
hero.addEventListener("click", (e) => {
  if (e.target === castBtn) return;
  castLine();
});

/* ----------------------------------------------------------
   Hide the fixed bait once we leave the hero, show on zones
   ---------------------------------------------------------- */
ScrollTrigger.create({
  trigger: "#sunlight",
  start: "top 85%",
  onEnter: () => gsap.to(rig, { opacity: 1, duration: 0.5 }),
  onLeaveBack: () => gsap.to(rig, { opacity: hasCast ? 1 : 0, duration: 0.5 }),
});

/* the bait rests on the seafloor at the very end */
ScrollTrigger.create({
  trigger: "#abyss",
  start: "bottom bottom",
  onEnter: () => gsap.to(rig, { opacity: 0, duration: 0.6 }),
  onLeaveBack: () => gsap.to(rig, { opacity: 1, duration: 0.6 }),
});

/* subtle parallax bob on the lure as you scroll through zones */
gsap.to(sinkingBait, {
  y: 24,
  ease: "none",
  scrollTrigger: {
    trigger: "#sunlight",
    start: "top top",
    endTrigger: "#abyss",
    end: "bottom bottom",
    scrub: 1,
  },
});

/* ----------------------------------------------------------
   Reveal creatures / cards as each zone scrolls into view
   ---------------------------------------------------------- */
gsap.utils.toArray(".reveal").forEach((el) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.9,
    ease: "power2.out",
    scrollTrigger: { trigger: el, start: "top 82%" },
  });
});

/* ----------------------------------------------------------
   Depth gauge tied to overall scroll progress
   ---------------------------------------------------------- */
const MAX_DEPTH = 6000; // metres at the abyssal floor
ScrollTrigger.create({
  trigger: "#sunlight",
  start: "top top",
  endTrigger: "#abyss",
  end: "bottom bottom",
  scrub: true,
  onUpdate: (self) => {
    const depth = Math.round(self.progress * MAX_DEPTH);
    depthFill.style.height = (self.progress * 100).toFixed(1) + "%";
    depthValue.textContent = depth.toLocaleString() + " m";
  },
});

/* ----------------------------------------------------------
   Water FX — light rays, drifting bubbles & a wavy surface
   injected into every zone so the water actually feels wet
   ---------------------------------------------------------- */
const BUBBLES_PER_ZONE = 26;
gsap.utils.toArray(".zone").forEach((zone) => {
  const fx = document.createElement("div");
  fx.className = "water-fx";

  const rays = document.createElement("div");
  rays.className = "light-rays";
  fx.appendChild(rays);

  for (let i = 0; i < BUBBLES_PER_ZONE; i++) {
    const b = document.createElement("span");
    b.className = "bubble";
    const size = gsap.utils.random(4, 16);
    b.style.width = size + "px";
    b.style.height = size + "px";
    b.style.left = gsap.utils.random(0, 100) + "%";
    b.style.animationDuration = gsap.utils.random(7, 16) + "s";
    b.style.animationDelay = gsap.utils.random(0, 10) + "s";
    b.style.opacity = gsap.utils.random(0.3, 0.8).toFixed(2);
    fx.appendChild(b);
  }

  const wave = document.createElement("div");
  wave.className = "wave-top";
  zone.appendChild(wave);

  zone.appendChild(fx);
});

/* keep ScrollTrigger honest after images load */
window.addEventListener("load", () => ScrollTrigger.refresh());
