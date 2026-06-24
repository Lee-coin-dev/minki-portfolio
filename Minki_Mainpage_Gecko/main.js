import * as THREE from "three";

/* ============================================================
   The Journey — an unbroken, scroll-driven gecko adventure.
   One continuous Three.js world. GSAP ScrollTrigger scrubs a
   single 0..1 "journey" value; everything is derived from it,
   so screens melt into one another with no hard transitions.
   ============================================================ */

/* ---------- tiny math helpers ---------- */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
// progress of `x` inside the window [a,b], clamped 0..1, eased
const seg = (x, a, b) => smooth(clamp((x - a) / (b - a)));
// linear (un-eased) segment
const segL = (x, a, b) => clamp((x - a) / (b - a));

/* ---------- renderer / scene / camera ---------- */
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const SUNNY_FOG = new THREE.Color(0xbfe6c4);
const MURK_FOG = new THREE.Color(0x59636b);
scene.fog = new THREE.Fog(SUNNY_FOG.clone(), 22, 95);
scene.background = SUNNY_FOG.clone();

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  400
);

/* ---------- lights ---------- */
const hemi = new THREE.HemisphereLight(0xcfeecd, 0x24401f, 0.9);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff2cf, 1.25);
sun.position.set(18, 30, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 120;
sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50;
sun.shadow.camera.bottom = -50;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x88aaff, 0.25);
fill.position.set(-15, 12, -10);
scene.add(fill);

/* ============================================================
   THE RIVER PATH — a single curvy spline the whole story rides.
   Defined in the XZ plane. The gecko, the arrow and the camera
   all reference this curve so the journey feels purposeful.
   z = +large is the bottom of the screen (where "X" is),
   z = -large is the far top the gecko runs toward.
   ============================================================ */
const pathPoints = [
  new THREE.Vector3(-7.5, 0, 22),
  new THREE.Vector3(-3.0, 0, 15),
  new THREE.Vector3(3.5, 0, 9),
  new THREE.Vector3(-0.5, 0, 2),
  new THREE.Vector3(4.0, 0, -5),
  new THREE.Vector3(-3.5, 0, -12),
  new THREE.Vector3(1.0, 0, -19),
  new THREE.Vector3(-1.0, 0, -27),
];
const path = new THREE.CatmullRomCurve3(pathPoints, false, "catmullrom", 0.5);
const pathSamples = path.getSpacedPoints(240);

/* helper: point + flat heading along the path at t (0..1) */
function pathAt(t) {
  t = clamp(t, 0, 1);
  const p = path.getPointAt(t);
  const tan = path.getTangentAt(t);
  const heading = Math.atan2(tan.x, tan.z); // for objects built facing +Z
  return { p, tan, heading };
}

/* ============================================================
   GROUND
   ============================================================ */
const groundGeo = new THREE.PlaneGeometry(220, 220, 64, 64);
groundGeo.rotateX(-Math.PI / 2);
// gentle rolling hills so it isn't a flat board
const gpos = groundGeo.attributes.position;
for (let i = 0; i < gpos.count; i++) {
  const x = gpos.getX(i);
  const z = gpos.getZ(i);
  const h = Math.sin(x * 0.08) * 0.8 + Math.cos(z * 0.07) * 0.8;
  gpos.setY(i, h - 0.2);
}
groundGeo.computeVertexNormals();
const ground = new THREE.Mesh(
  groundGeo,
  new THREE.MeshStandardMaterial({ color: 0x2f5d33, roughness: 1 })
);
ground.receiveShadow = true;
scene.add(ground);

/* ============================================================
   RIVER — a flat ribbon that follows the path, sitting in a
   carved channel so it reads as water from above.
   ============================================================ */
function buildRiver(curve, width) {
  const N = 220;
  const pts = curve.getSpacedPoints(N);
  const verts = [];
  const uvs = [];
  const idx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const nx = -tan.z, nz = tan.x; // perpendicular in XZ
    const len = Math.hypot(nx, nz) || 1;
    const half = width / 2;
    verts.push(
      p.x + (nx / len) * half, 0.05, p.z + (nz / len) * half,
      p.x - (nx / len) * half, 0.05, p.z - (nz / len) * half
    );
    uvs.push(0, t * 20, 1, t * 20);
  }
  for (let i = 0; i < N; i++) {
    const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const riverMat = new THREE.MeshStandardMaterial({
  color: 0x2f86c6,
  roughness: 0.18,
  metalness: 0.2,
  transparent: true,
  opacity: 0.92,
});
const river = new THREE.Mesh(buildRiver(path, 3.4), riverMat);
river.receiveShadow = true;
scene.add(river);
// darker damp banks underneath for depth
const bank = new THREE.Mesh(
  buildRiver(path, 4.6),
  new THREE.MeshStandardMaterial({ color: 0x274d2c, roughness: 1 })
);
bank.position.y = -0.02;
scene.add(bank);

/* ============================================================
   THE PATH ARROW — a long golden arrow that traces the river
   and points "up" the journey, hinting the X wants to travel.
   ============================================================ */
const arrowMat = new THREE.MeshStandardMaterial({
  color: 0xffc83a,
  emissive: 0xffaa00,
  emissiveIntensity: 0.5,
  roughness: 0.4,
});
const arrowGroup = new THREE.Group();
// shaft: dashed-looking chevrons along the path
const chevronShape = new THREE.Shape();
chevronShape.moveTo(0, 0.9);
chevronShape.lineTo(0.95, -0.4);
chevronShape.lineTo(0.45, -0.4);
chevronShape.lineTo(0, 0.35);
chevronShape.lineTo(-0.45, -0.4);
chevronShape.lineTo(-0.95, -0.4);
chevronShape.lineTo(0, 0.9);
const chevronGeo = new THREE.ShapeGeometry(chevronShape);
chevronGeo.rotateX(-Math.PI / 2);
const CHEVRONS = 16;
for (let i = 0; i < CHEVRONS; i++) {
  const t = 0.04 + (i / CHEVRONS) * 0.62; // lower 2/3 of path, near the X
  const { p, heading } = pathAt(t);
  const m = new THREE.Mesh(chevronGeo, arrowMat);
  m.position.set(p.x, 0.18, p.z);
  m.rotation.y = heading;
  const s = 0.75;
  m.scale.set(s, s, s);
  arrowGroup.add(m);
}
scene.add(arrowGroup);

/* ============================================================
   THE "X" — marks where something waits, lower-left by the river
   ============================================================ */
const xMark = new THREE.Group();
const xMat = new THREE.MeshStandardMaterial({
  color: 0xe4453b,
  emissive: 0x611411,
  emissiveIntensity: 0.4,
  roughness: 0.6,
});
const barGeo = new THREE.BoxGeometry(2.6, 0.18, 0.5);
const barA = new THREE.Mesh(barGeo, xMat);
const barB = new THREE.Mesh(barGeo, xMat);
barA.rotation.y = Math.PI / 4;
barB.rotation.y = -Math.PI / 4;
xMark.add(barA, barB);
{
  const start = pathAt(0.0);
  xMark.position.set(start.p.x - 1.6, 0.16, start.p.z + 0.4);
}
scene.add(xMark);

/* ============================================================
   TREES — a dense rainforest on both banks (kept off the river)
   ============================================================ */
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 1 });
const leafMats = [
  new THREE.MeshStandardMaterial({ color: 0x2c7a3a, roughness: 1 }),
  new THREE.MeshStandardMaterial({ color: 0x3a9b48, roughness: 1 }),
  new THREE.MeshStandardMaterial({ color: 0x1f5e2b, roughness: 1 }),
  new THREE.MeshStandardMaterial({ color: 0x46b14f, roughness: 1 }),
];
const trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 3, 7);
const foliageGeo = new THREE.ConeGeometry(1.6, 3.2, 8);

function makeTree(scale) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.5;
  trunk.castShadow = true;
  g.add(trunk);
  const tiers = 3;
  for (let i = 0; i < tiers; i++) {
    const f = new THREE.Mesh(foliageGeo, leafMats[(Math.random() * leafMats.length) | 0]);
    f.position.y = 3 + i * 1.4;
    const s = 1 - i * 0.22;
    f.scale.set(s, s, s);
    f.castShadow = true;
    g.add(f);
  }
  g.scale.setScalar(scale);
  return g;
}

// minimum distance from a point to the river path (sampled)
function distToPath(x, z) {
  let min = Infinity;
  for (let i = 0; i < pathSamples.length; i += 2) {
    const s = pathSamples[i];
    const d = (s.x - x) ** 2 + (s.z - z) ** 2;
    if (d < min) min = d;
  }
  return Math.sqrt(min);
}

const forest = new THREE.Group();
for (let i = 0; i < 240; i++) {
  const x = (Math.random() - 0.5) * 90;
  const z = (Math.random() - 0.5) * 90;
  if (distToPath(x, z) < 3.4) continue; // keep banks of the river clear
  const t = makeTree(0.7 + Math.random() * 1.1);
  t.position.set(x, 0, z);
  t.rotation.y = Math.random() * Math.PI * 2;
  forest.add(t);
}
scene.add(forest);

/* The "home" tree the gecko is discovered on (right by the X) */
const homeTree = makeTree(1.5);
{
  const start = pathAt(0.0);
  homeTree.position.set(start.p.x - 2.4, 0, start.p.z + 1.2);
}
scene.add(homeTree);

/* ============================================================
   THE GECKO — built from primitives, faces +Z, with a tail that
   can be severed and regrown. Legs animate as it walks/sprints.
   ============================================================ */
const gecko = new THREE.Group();
const geckoSkin = new THREE.MeshStandardMaterial({ color: 0x57c24a, roughness: 0.5 });
const geckoBelly = new THREE.MeshStandardMaterial({ color: 0xcfeebf, roughness: 0.6 });

const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.95, 6, 12), geckoSkin);
body.rotation.x = Math.PI / 2; // lie along Z
body.position.y = 0.32;
body.castShadow = true;
gecko.add(body);

const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.9, 6, 10), geckoBelly);
belly.rotation.x = Math.PI / 2;
belly.position.set(0, 0.2, 0);
gecko.add(belly);

const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 14), geckoSkin);
head.scale.set(1, 0.8, 1.25);
head.position.set(0, 0.36, 0.85);
head.castShadow = true;
gecko.add(head);

// eyes
const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });
const eyeBlack = new THREE.MeshStandardMaterial({ color: 0x111111 });
for (const sx of [-1, 1]) {
  const e = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), eyeWhite);
  e.position.set(0.22 * sx, 0.52, 0.92);
  gecko.add(e);
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), eyeBlack);
  p.position.set(0.25 * sx, 0.53, 1.0);
  gecko.add(p);
}

// legs (store refs to animate the gait)
const legGeo = new THREE.CapsuleGeometry(0.07, 0.42, 4, 8);
const legs = [];
const legDefs = [
  { x: 0.34, z: 0.55, p: 0 },
  { x: -0.34, z: 0.55, p: Math.PI },
  { x: 0.34, z: -0.45, p: Math.PI },
  { x: -0.34, z: -0.45, p: 0 },
];
for (const d of legDefs) {
  const pivot = new THREE.Group();
  pivot.position.set(d.x, 0.28, d.z);
  const leg = new THREE.Mesh(legGeo, geckoSkin);
  leg.position.y = -0.18;
  leg.castShadow = true;
  pivot.add(leg);
  pivot.userData.phase = d.p;
  pivot.userData.outward = d.x > 0 ? 1 : -1;
  gecko.add(pivot);
  legs.push(pivot);
}

// tail — a pivot at the base so it can wag, scale to 0 (cut) and regrow
const tailPivot = new THREE.Group();
tailPivot.position.set(0, 0.3, -0.55);
const tail = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.3, 12), geckoSkin);
tail.rotation.x = -Math.PI / 2; // point toward -Z
tail.position.z = -0.65;
tail.castShadow = true;
tailPivot.add(tail);
gecko.add(tailPivot);

gecko.scale.setScalar(0.9);
scene.add(gecko);

// the severed tail piece that drops on the ground after the parrot strikes
const severedTail = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.3, 12), geckoSkin.clone());
severedTail.material.transparent = true;
severedTail.rotation.x = -Math.PI / 2;
severedTail.visible = false;
scene.add(severedTail);
let tailDropped = false;
const tailDropPos = new THREE.Vector3();

/* ============================================================
   THE PARROT — vivid and furious; swoops in to clip the tail.
   ============================================================ */
const parrot = new THREE.Group();
const parrotBody = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.42, 0.7, 6, 12),
  new THREE.MeshStandardMaterial({ color: 0xe23b2e, roughness: 0.5 })
);
parrotBody.rotation.x = Math.PI / 2;
parrotBody.castShadow = true;
parrot.add(parrotBody);

const parrotHead = new THREE.Mesh(
  new THREE.SphereGeometry(0.36, 16, 14),
  new THREE.MeshStandardMaterial({ color: 0xf5d020, roughness: 0.5 })
);
parrotHead.position.set(0, 0.18, 0.62);
parrot.add(parrotHead);

const beak = new THREE.Mesh(
  new THREE.ConeGeometry(0.16, 0.4, 8),
  new THREE.MeshStandardMaterial({ color: 0xff8a1e, roughness: 0.5 })
);
beak.rotation.x = Math.PI / 2;
beak.position.set(0, 0.12, 0.98);
parrot.add(beak);

// angry eyes
for (const sx of [-1, 1]) {
  const e = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  e.position.set(0.16 * sx, 0.28, 0.82);
  parrot.add(e);
}

// wings (animated flap)
const wingGeo = new THREE.BoxGeometry(1.5, 0.08, 0.7);
const wingMat = new THREE.MeshStandardMaterial({ color: 0x1f7be0, roughness: 0.5 });
const wingMatTip = new THREE.MeshStandardMaterial({ color: 0xf5d020, roughness: 0.5 });
const wings = [];
for (const sx of [-1, 1]) {
  const pivot = new THREE.Group();
  pivot.position.set(0.2 * sx, 0.15, 0);
  const w = new THREE.Mesh(wingGeo, wingMat);
  w.position.x = 0.75 * sx;
  pivot.add(w);
  const tip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.6), wingMatTip);
  tip.position.x = 1.5 * sx;
  pivot.add(tip);
  pivot.userData.side = sx;
  parrot.add(pivot);
  wings.push(pivot);
}

// long colorful tail feathers
for (let i = 0; i < 3; i++) {
  const f = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.05, 1.1),
    new THREE.MeshStandardMaterial({ color: [0x1f7be0, 0xf5d020, 0x2cae4a][i] })
  );
  f.position.set((i - 1) * 0.18, 0.05, -0.85);
  parrot.add(f);
}
parrot.visible = false;
parrot.scale.setScalar(0.9);
scene.add(parrot);

/* ============================================================
   THE END BUTTONS — three tiles on the land. Clicking one makes
   the gecko hop on top. Labels drawn with a canvas texture.
   ============================================================ */
function labelTexture(text, bg) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 498, 242);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 68px Trebuchet MS, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 134);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return tex;
}

const buttonDefs = [
  { label: "Flute", color: "#7b4fb0", offset: -3.0 },
  { label: "Marine Biology", color: "#1f6fa8", offset: 0.0 },
  { label: "Tennis", color: "#2f9e4f", offset: 3.0 },
];
const buttons = [];
const buttonGroup = new THREE.Group();
const END_T = 0.985;
{
  const end = pathAt(END_T);
  const aheadDir = end.tan.clone().setY(0).normalize();
  const sideDir = new THREE.Vector3(-aheadDir.z, 0, aheadDir.x); // perpendicular

  for (const def of buttonDefs) {
    const tile = new THREE.Group();
    const base = end.p.clone()
      .add(aheadDir.clone().multiplyScalar(3.6))
      .add(sideDir.clone().multiplyScalar(def.offset));

    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.0, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.9 })
    );
    pedestal.position.set(base.x, 0.5, base.z);
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    tile.add(pedestal);

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.12, 2.0),
      new THREE.MeshStandardMaterial({ map: labelTexture(def.label, def.color) })
    );
    top.position.set(base.x, 1.07, base.z);
    top.rotation.y = -end.heading; // face the camera/gecko
    tile.add(top);

    tile.userData = {
      label: def.label,
      topY: 1.13 + 0.45,
      pos: base.clone(),
      hit: pedestal,
      lift: 0,
    };
    buttons.push(tile);
    buttonGroup.add(tile);
  }
}
buttonGroup.visible = false;
scene.add(buttonGroup);

/* ============================================================
   CAMERA RIGS
   ============================================================ */
const camTopPos = new THREE.Vector3(2, 38, 14);
const camTopLook = new THREE.Vector3(-1, 0, 6);
const UP_TOP = new THREE.Vector3(0, 0, -1); // top-down: north is up on screen
const UP_FOLLOW = new THREE.Vector3(0, 1, 0);
const _camPos = new THREE.Vector3();
const _camLook = new THREE.Vector3();
const _up = new THREE.Vector3();

/* ============================================================
   STATE — the single value the scroll drives
   ============================================================ */
const state = { j: 0 };
const clock = new THREE.Clock();

/* captions per phase (subtle floating narration) */
const intro = document.getElementById("intro");
const captionEl = document.getElementById("caption");
const endingEl = document.getElementById("ending");

const captions = [
  { a: 0.16, b: 0.34, text: "Something stirs where the X waits…" },
  { a: 0.30, b: 0.46, text: "A gecko slips down and hurries along the path." },
  { a: 0.48, b: 0.62, text: "A furious parrot dives — and snaps the tail away!" },
  { a: 0.62, b: 0.80, text: "Skies darken… yet the gecko presses on." },
  { a: 0.78, b: 0.90, text: "Sunlight returns, and a new tail grows." },
];

/* ============================================================
   THE STORY FUNCTION — maps j (0..1) to the whole world
   ============================================================ */
let geckoOverride = false; // true once a button is clicked at the end

function updateStory(j, time) {
  /* ---- weather: sunny -> murky -> sunny (screen 4) ---- */
  const murk = clamp(seg(j, 0.6, 0.7) - seg(j, 0.74, 0.9));
  scene.fog.color.copy(SUNNY_FOG).lerp(MURK_FOG, murk);
  scene.background.copy(scene.fog.color);
  scene.fog.near = lerp(22, 8, murk);
  scene.fog.far = lerp(95, 48, murk);
  sun.intensity = lerp(1.25, 0.22, murk);
  hemi.intensity = lerp(0.9, 0.4, murk);
  hemi.color.copy(new THREE.Color(0xcfeecd)).lerp(new THREE.Color(0x8a96a0), murk);

  /* ---- gecko progress along the path ----
     crawl down the tree (0.16-0.28), then travel the river.    */
  const crawl = seg(j, 0.16, 0.28);
  const travel = seg(j, 0.28, END_T); // 0..1 along path
  const t = travel;

  // speed factor for gait/animation (sprint during screens 3-4)
  const sprint = 0.6 + seg(j, 0.42, 0.5) * 1.6 + Math.sin(time * 2) * 0.05;

  if (!geckoOverride) {
    const here = pathAt(t);
    const treeTopY = 3.4;
    const onTreeY = lerp(treeTopY, 0.0, crawl);
    const bob = Math.sin(time * 9 * sprint) * 0.05 * (0.3 + travel);

    // climb down the home-tree trunk, then walk over to the river start —
    // a single blended motion so there is never a visible jump.
    const approach = seg(j, 0.27, 0.34);
    const climbX = homeTree.position.x + 0.7;
    const climbZ = homeTree.position.z;
    const baseX = lerp(climbX, here.p.x, approach);
    const baseZ = lerp(climbZ, here.p.z, approach);

    gecko.position.set(baseX, onTreeY + bob, baseZ);
    // tip head-down while on the trunk, level out as it reaches the ground/path
    gecko.rotation.set(lerp(-Math.PI / 2.4, 0, crawl), here.heading, 0);
  }

  // gecko leg gait
  for (const lp of legs) {
    const swing = Math.sin(time * 7 * sprint + lp.userData.phase);
    lp.rotation.x = swing * 0.6 * (0.4 + travel);
    lp.rotation.z = lp.userData.outward * 0.25;
  }
  // tail wag
  tailPivot.rotation.y = Math.sin(time * 6 * sprint) * 0.25;

  /* ---- the parrot strike & tail cut (screen 3) ---- */
  const cutAt = 0.515;
  const parrotIn = seg(j, 0.45, cutAt); // dive in
  const parrotOut = seg(j, cutAt, 0.6); // peel away
  const parrotActive = j > 0.43 && j < 0.62;
  parrot.visible = parrotActive;

  if (parrotActive) {
    const gp = gecko.position;
    const gHead = pathAt(clamp(t, 0, 1));
    // dive from upper-right toward the gecko, then veer up-left
    const start = new THREE.Vector3(gp.x + 12, 12, gp.z + 14);
    const strike = new THREE.Vector3(gp.x + 0.2, gp.y + 0.6, gp.z - 0.8);
    const exit = new THREE.Vector3(gp.x - 12, 11, gp.z - 16);
    if (j <= cutAt) {
      parrot.position.lerpVectors(start, strike, parrotIn);
    } else {
      parrot.position.lerpVectors(strike, exit, parrotOut);
    }
    // face direction of travel + flap
    const dir = (j <= cutAt ? strike.clone().sub(start) : exit.clone().sub(strike));
    parrot.rotation.y = Math.atan2(dir.x, dir.z);
    for (const w of wings) {
      w.rotation.z = w.userData.side * (Math.sin(time * 22) * 0.6 + 0.3);
    }
  }

  /* ---- tail state: full -> severed -> regrown ---- */
  let tailScale;
  if (j < cutAt) {
    tailScale = 1;
  } else {
    const regrow = seg(j, 0.78, 0.9);
    tailScale = regrow; // 0 right after cut, back to 1 once sunny
  }
  tailPivot.scale.setScalar(clamp(tailScale, 0.0001, 1));

  // drop the severed tail on the ground at the cut moment
  if (j >= cutAt && !tailDropped) {
    tailDropped = true;
    tailDropPos.copy(gecko.position);
    severedTail.visible = true;
  }
  if (j < cutAt && tailDropped) {
    // scrubbing backwards — reset
    tailDropped = false;
    severedTail.visible = false;
  }
  if (severedTail.visible) {
    severedTail.position.set(
      tailDropPos.x + 0.6,
      0.18,
      tailDropPos.z - 0.4
    );
    severedTail.rotation.z = 0.4 + Math.sin(time * 3) * 0.02;
    // fade away as the new tail grows
    const fade = 1 - seg(j, 0.74, 0.88);
    severedTail.material.opacity = fade;
    if (fade <= 0.01) severedTail.visible = false;
  }

  /* ---- end buttons reveal (screen 5) ---- */
  const reveal = seg(j, 0.9, 1.0);
  buttonGroup.visible = reveal > 0.001;
  buttonGroup.children.forEach((tile, i) => {
    const r = clamp(reveal * 1.2 - i * 0.12);
    tile.scale.setScalar(0.001 + r);
    tile.position.y = lerp(-1.2, 0, smooth(r)) + tile.userData.lift;
  });

  /* ---- arrow shimmer; fade out once the gecko is travelling ---- */
  arrowMat.emissiveIntensity = 0.35 + Math.sin(time * 3) * 0.15;
  const arrowFade = 1 - seg(j, 0.34, 0.46);
  arrowGroup.children.forEach((c) => {
    c.visible = arrowFade > 0.02;
    c.scale.setScalar(0.75 * (0.4 + arrowFade));
  });
  xMark.visible = j < 0.34;
  xMark.children.forEach((b) => (b.scale.y = 1 + Math.sin(time * 4) * 0.15));

  /* ============================================================
     CAMERA — one continuous move: top-down overview that
     descends into a chase cam, then eases to the finish framing.
     ============================================================ */
  const toFollow = seg(j, 0.12, 0.32); // overview -> follow
  const follow = pathAt(clamp(t, 0, 1));
  const back = follow.tan.clone().setY(0).normalize().multiplyScalar(-6.5);

  // a touch more height/standoff at the very end to show the tiles
  const endPull = seg(j, 0.9, 1.0);

  const followPos = new THREE.Vector3(
    gecko.position.x + back.x - 1.5,
    gecko.position.y + lerp(4.2, 6.0, endPull),
    gecko.position.z + back.z
  );
  const followLook = new THREE.Vector3(
    gecko.position.x + follow.tan.x * 3,
    gecko.position.y + 0.6,
    gecko.position.z + follow.tan.z * 3
  );

  _camPos.copy(camTopPos).lerp(followPos, toFollow);
  _camLook.copy(camTopLook).lerp(followLook, toFollow);
  _up.copy(UP_TOP).lerp(UP_FOLLOW, smooth(toFollow)).normalize();

  camera.position.copy(_camPos);
  camera.up.copy(_up);
  camera.lookAt(_camLook);

  /* ---- HTML overlays ---- */
  intro.style.opacity = (1 - seg(j, 0.04, 0.12)).toFixed(3);
  let activeCap = "";
  let capOpacity = 0;
  for (const c of captions) {
    const vis = seg(j, c.a, c.a + 0.04) * (1 - seg(j, c.b - 0.04, c.b));
    if (vis > capOpacity) {
      capOpacity = vis;
      activeCap = c.text;
    }
  }
  if (activeCap) captionEl.textContent = activeCap;
  captionEl.style.opacity = capOpacity.toFixed(3);
  endingEl.style.opacity = seg(j, 0.93, 1.0).toFixed(3);
}

/* ============================================================
   RENDER LOOP
   ============================================================ */
function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();
  updateStory(state.j, time);
  // gentle river flow shimmer
  riverMat.emissiveIntensity = 0;
  renderer.render(scene, camera);
}
animate();

/* ============================================================
   SCROLL → STORY (GSAP ScrollTrigger, scrubbed = no jump cuts)
   ============================================================ */
gsap.registerPlugin(ScrollTrigger);
gsap.to(state, {
  j: 1,
  ease: "none",
  scrollTrigger: {
    trigger: "#scroller",
    start: "top top",
    end: "bottom bottom",
    scrub: 0.6,
  },
});

/* ============================================================
   CLICK THE END BUTTONS → gecko hops on top
   ============================================================ */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const toast = document.createElement("div");
toast.id = "toast";
document.body.appendChild(toast);
let toastTimer = null;

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

window.addEventListener("pointerdown", (e) => {
  if (!buttonGroup.visible || state.j < 0.9) return;
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const targets = buttons.map((b) => b.userData.hit);
  const hits = raycaster.intersectObjects(targets, false);
  if (!hits.length) return;
  const tile = buttons.find((b) => b.userData.hit === hits[0].object);
  if (!tile) return;
  hopGeckoTo(tile);
});

function hopGeckoTo(tile) {
  geckoOverride = true;
  const dest = tile.userData.pos.clone();
  const facing = Math.atan2(
    dest.x - gecko.position.x,
    dest.z - gecko.position.z
  );
  // reset any previously chosen tile lift
  buttons.forEach((b) => {
    if (b !== tile) gsap.to(b.userData, { lift: 0, duration: 0.4 });
  });

  const tl = gsap.timeline();
  tl.to(gecko.rotation, { y: facing, duration: 0.35, ease: "power2.out" });
  // arc up and onto the tile top
  tl.to(gecko.position, {
    x: dest.x,
    z: dest.z,
    duration: 0.7,
    ease: "power1.inOut",
  }, "<");
  tl.to(gecko.position, {
    y: tile.userData.topY,
    duration: 0.35,
    ease: "power2.out",
  }, "<");
  tl.to(gecko.position, {
    y: tile.userData.topY,
    duration: 0.0,
  });
  showToast(`The gecko chooses “${tile.userData.label}”!`);
}

/* ============================================================
   RESIZE
   ============================================================ */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  ScrollTrigger.refresh();
});

/* ============================================================
   HIDE LOADER once the first frame is up
   ============================================================ */
requestAnimationFrame(() => {
  setTimeout(() => {
    document.getElementById("loader").classList.add("hidden");
    ScrollTrigger.refresh();
  }, 400);
});
