/* ============================================================
   Minki — Flutist Portfolio
   GSAP scene logic
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

/* ---------- Inject SVG templates ---------- */
function cloneTemplate(name) {
  const tpl = document.querySelector(`#svg-templates [data-tpl="${name}"]`);
  return tpl ? tpl.cloneNode(true) : null;
}

document.querySelectorAll("[data-girl]").forEach((host) => {
  const svg = cloneTemplate(host.dataset.girl === "playing" ? "girl-playing" : "girl-standing");
  if (svg) { svg.classList.remove("tpl"); host.appendChild(svg); }
});

document.querySelectorAll("[data-instr]").forEach((host) => {
  const svg = cloneTemplate(host.dataset.instr);
  if (!svg) return;
  svg.classList.remove("tpl");
  host.appendChild(svg);
  const gk = host.dataset.glowKey;        // pre-glow a key (Screen 3 flute)
  if (gk) {
    const key = svg.querySelector(`.fkey[data-key="${gk}"]`);
    if (key) key.classList.add("fkey--glow");
  }
});

/* ---------- Element refs ---------- */
const stageScaler = document.getElementById("stageScaler");
const standingLayer = stageScaler.querySelector(".girl-layer--standing");
const playingLayer = stageScaler.querySelector(".girl-layer--playing");
const heldFlute = playingLayer.querySelector("[data-held-flute]");
const firstKey = playingLayer.querySelector('.fkey[data-key="1"]');
const floaters = document.getElementById("floaters");
const ctaPick = document.getElementById("ctaPick");
const capScroll = document.getElementById("capScroll");
const capKey = document.getElementById("capKey");
const stageCue = document.getElementById("stageScrollCue");
const descSection = document.getElementById("descriptions");

const railDot = (n) => document.querySelector(`.rail-dot[data-scene="${n}"]`);
function setRail(n) {
  document.querySelectorAll(".rail-dot").forEach((d) => d.classList.remove("is-active"));
  const dot = railDot(n);
  if (dot) dot.classList.add("is-active");
}

let descRevealed = false;

/* ============================================================
   Intro entrance
   ============================================================ */
gsap.timeline({ defaults: { ease: "power3.out" } })
  .from(".stage-scaler", { x: -70, opacity: 0, duration: 1.1 })
  .from(".cta-pick", { y: -20, opacity: 0, duration: 0.7 }, "-=0.7")
  .from(".instrument--flute", { x: 80, opacity: 0, duration: 0.9 }, "-=0.5")
  .from(".instrument--piccolo", { x: 80, opacity: 0, duration: 0.9 }, "-=0.6")
  .from(".scroll-cue--stage", { opacity: 0, duration: 0.6 }, "-=0.3");

gsap.to(".instrument--flute .instr-art", { y: 14, duration: 3, ease: "sine.inOut", repeat: -1, yoyo: true });
gsap.to(".instrument--piccolo .instr-art", { y: -12, duration: 3.4, ease: "sine.inOut", repeat: -1, yoyo: true });

/* ============================================================
   SCREEN 1 -> 2  (pinned, scroll-zoom into "ready")
   Scrolling cannot pass this section because #descriptions is
   hidden until the video pop-up has been opened.
   ============================================================ */
gsap.set(playingLayer, { opacity: 0 });
gsap.set(heldFlute, { rotation: -32, svgOrigin: "180 230" }); // start: flute lowered

const stageTl = gsap.timeline({
  scrollTrigger: {
    trigger: "#stage",
    start: "top top",
    end: "+=175%",
    scrub: 1,
    pin: true,
    onUpdate: (self) => {
      const glowing = self.progress >= 0.9;
      firstKey.classList.toggle("fkey--glow", glowing);
      capKey.style.opacity = glowing ? 1 : 0;
      if (stageCue) stageCue.style.opacity = glowing ? 0 : 1;
    },
  },
});

stageTl
  .to(ctaPick, { opacity: 0, duration: 0.12 }, 0)
  .to(floaters, { opacity: 0, duration: 0.16 }, 0)
  .to(capScroll, { opacity: 0, duration: 0.15 }, 0.18)
  .to(standingLayer, { opacity: 0, duration: 0.18 }, 0.06)
  .to(playingLayer, { opacity: 1, duration: 0.18 }, 0.06)
  // raise the flute to her lips
  .to(heldFlute, { rotation: 0, ease: "none", duration: 0.7 }, 0.12)
  // gradual zoom toward her face/lips, then hold
  .to(stageScaler, { scale: 1.85, ease: "none", duration: 0.85 }, 0)
  .to({}, { duration: 0.15 }); // tail so the "ready" state holds at the end

/* ---------- glowing key -> open video pop-up ---------- */
firstKey.style.cursor = "pointer";
firstKey.setAttribute("role", "button");
firstKey.addEventListener("click", () => {
  if (firstKey.classList.contains("fkey--glow")) openModal();
});

/* ============================================================
   VIDEO MODAL (pop-up)
   ============================================================ */
const modal = document.getElementById("videoModal");
const playBtn = document.getElementById("playBtn");

function openModal() {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setRail(2);
}
function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  revealDescriptions();
}

document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modalBackdrop").addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
});

playBtn.addEventListener("click", () => {
  playBtn.classList.toggle("is-playing");
  const poster = modal.querySelector(".video-poster");
  gsap.to(poster, { opacity: playBtn.classList.contains("is-playing") ? 0.3 : 1, duration: 0.5 });
});

/* ============================================================
   SCREEN 3 — DESCRIPTIONS (revealed only after the video pop-up)
   ============================================================ */
function revealDescriptions() {
  if (descRevealed) return;
  descRevealed = true;
  descSection.hidden = false;
  ScrollTrigger.refresh();

  // flute rises up as the descriptions come into view
  gsap.from("#descFlute", {
    scrollTrigger: { trigger: "#descriptions", start: "top 78%", end: "top 28%", scrub: 1 },
    y: 170, opacity: 0, ease: "none",
  });
  gsap.from("#descriptions .desc-head", {
    scrollTrigger: { trigger: "#descriptions .desc-head", start: "top 82%" },
    y: 40, opacity: 0, duration: 0.9, ease: "power3.out",
  });
  gsap.from("#descriptions .photo", {
    scrollTrigger: { trigger: "#descriptions .desc-grid", start: "top 80%" },
    y: 50, opacity: 0, duration: 0.9, stagger: 0.18, ease: "power3.out",
  });
  gsap.from("#descriptions .desc-text p", {
    scrollTrigger: { trigger: "#descriptions .desc-grid", start: "top 72%" },
    y: 30, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power2.out",
  });

  ScrollTrigger.create({
    trigger: "#descriptions",
    start: "top center",
    end: "bottom center",
    onToggle: (self) => { if (self.isActive) setRail(3); },
  });

  // gentle nudge so the new section is noticed
  gsap.delayedCall(0.25, () => window.scrollBy({ top: window.innerHeight * 0.5, behavior: "smooth" }));
}

/* ============================================================
   Navigation buttons (Screen 1)
   ============================================================ */
function scrollThroughZoom() {
  const st = stageTl.scrollTrigger;
  const target = st.start + (st.end - st.start) * 0.96;
  window.scrollTo({ top: target, behavior: "smooth" });
}
ctaPick.addEventListener("click", scrollThroughZoom);
document.getElementById("pickFlute").addEventListener("click", scrollThroughZoom);
document.getElementById("pickPiccolo").addEventListener("click", () => {
  const piccolo = document.querySelector(".instrument--piccolo .instr-art");
  gsap.fromTo(piccolo, { rotation: -3 }, {
    rotation: 3, duration: 0.1, repeat: 5, yoyo: true, transformOrigin: "center",
    onComplete: scrollThroughZoom,
  });
});

/* rail: stage active by default */
ScrollTrigger.create({
  trigger: "#stage", start: "top center", end: "bottom center",
  onToggle: (self) => { if (self.isActive && !modal.classList.contains("is-open")) setRail(1); },
});

window.addEventListener("load", () => ScrollTrigger.refresh());
