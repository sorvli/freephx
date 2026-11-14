import * as THREE from "./three.js";

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020208, 0.0018);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  2000,
);
camera.position.set(0, 30, 320);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x020208);
document.body.appendChild(renderer.domElement);

// ===================== CORE =====================
const coreGroup = new THREE.Group();
scene.add(coreGroup);

// لایه اصلی هسته
const coreGeo = new THREE.IcosahedronGeometry(38, 2);
const coreMat = new THREE.MeshBasicMaterial({
  color: 0x00f5ff,
  wireframe: true,
  transparent: true,
  opacity: 0.15,
});
const core = new THREE.Mesh(coreGeo, coreMat);
coreGroup.add(core);

// لایه داخلی درخشان
const innerGeo = new THREE.IcosahedronGeometry(22, 1);
const innerMat = new THREE.MeshBasicMaterial({
  color: 0x00ffcc,
  wireframe: true,
  transparent: true,
  opacity: 0.35,
});
const inner = new THREE.Mesh(innerGeo, innerMat);
coreGroup.add(inner);

// هسته مرکزی خیلی روشن
const heartGeo = new THREE.SphereGeometry(8, 16, 16);
const heartMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.9,
});
const heart = new THREE.Mesh(heartGeo, heartMat);
coreGroup.add(heart);

// ===================== CHAOTIC PARTICLES (ورودی) =====================
const CHAOS_COUNT = 900;
const chaosGeo = new THREE.BufferGeometry();
const chaosPos = new Float32Array(CHAOS_COUNT * 3);
const chaosVel = [];

for (let i = 0; i < CHAOS_COUNT; i++) {
  const r = 140 + Math.random() * 180;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  chaosPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  chaosPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
  chaosPos[i * 3 + 2] = r * Math.cos(phi);

  chaosVel.push(
    new THREE.Vector3(
      (Math.random() - 0.5) * 0.4,
      (Math.random() - 0.5) * 0.4,
      (Math.random() - 0.5) * 0.4,
    ),
  );
}
chaosGeo.setAttribute("position", new THREE.BufferAttribute(chaosPos, 3));
const chaosMat = new THREE.PointsMaterial({
  color: 0x4a6fa5,
  size: 1.3,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
});
const chaos = new THREE.Points(chaosGeo, chaosMat);
scene.add(chaos);

// ===================== FAST BEAMS (خروجی بهینه‌شده) =====================
const BEAM_COUNT = 28;
const beams = [];

for (let i = 0; i < BEAM_COUNT; i++) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(6); // start + end
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.LineBasicMaterial({
    color: new THREE.Color().setHSL(0.48 + Math.random() * 0.08, 1, 0.65),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });

  const line = new THREE.Line(geo, mat);
  scene.add(line);

  beams.push({
    line,
    life: 0,
    maxLife: 0,
    dir: new THREE.Vector3(),
    speed: 0,
    active: false,
  });
}

function fireBeam() {
  const b = beams.find((x) => !x.active);
  if (!b) return;

  // از سطح هسته شلیک می‌شه
  const dir = new THREE.Vector3(
    Math.random() - 0.5,
    (Math.random() - 0.5) * 0.6,
    Math.random() - 0.5,
  ).normalize();

  b.dir.copy(dir);
  b.speed = 9 + Math.random() * 7;
  b.life = 0;
  b.maxLife = 35 + Math.random() * 25;
  b.active = true;
  b.line.material.opacity = 0.9;
}

// هر چند لحظه یک پرتو شلیک کن
setInterval(fireBeam, 140);

// ===================== AMBIENT DUST =====================
const dustCount = 400;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount * 3; i++) {
  dustPos[i] = (Math.random() - 0.5) * 700;
}
dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(
  dustGeo,
  new THREE.PointsMaterial({
    color: 0x1a2a40,
    size: 0.7,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  }),
);
scene.add(dust);

// ===================== ANIMATION =====================
let time = 0;

function animate() {
  requestAnimationFrame(animate);
  time += 0.012;

  // چرخش هسته
  core.rotation.x = time * 0.18;
  core.rotation.y = time * 0.25;
  inner.rotation.x = -time * 0.35;
  inner.rotation.y = -time * 0.28;

  // نفس کشیدن هسته
  const breath = 1 + Math.sin(time * 2.2) * 0.04;
  core.scale.setScalar(breath);
  inner.scale.setScalar(1 + Math.sin(time * 2.8) * 0.06);
  heart.scale.setScalar(1 + Math.sin(time * 4) * 0.12);
  heart.material.opacity = 0.7 + Math.sin(time * 5) * 0.25;

  // حرکت ذرات آشفته به سمت هسته
  const positions = chaos.geometry.attributes.position.array;
  for (let i = 0; i < CHAOS_COUNT; i++) {
    const ix = i * 3;
    const pos = new THREE.Vector3(
      positions[ix],
      positions[ix + 1],
      positions[ix + 2],
    );
    const dist = pos.length();

    // جذب به سمت مرکز
    const pull = pos.clone().normalize().multiplyScalar(-0.1);
    chaosVel[i].add(pull);
    chaosVel[i].multiplyScalar(0.97); // کمی damping

    pos.add(chaosVel[i]);

    // اگر خیلی نزدیک شد، دوباره به بیرون پرتابش کن (چرخه)
    if (dist < 45) {
      const newR = 160 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos.set(
        newR * Math.sin(phi) * Math.cos(theta),
        newR * Math.sin(phi) * Math.sin(theta) * 0.7,
        newR * Math.cos(phi),
      );
      chaosVel[i].set(0, 0, 0);
    }

    positions[ix] = pos.x;
    positions[ix + 1] = pos.y;
    positions[ix + 2] = pos.z;
  }
  chaos.geometry.attributes.position.needsUpdate = true;

  // آپدیت پرتوها
  beams.forEach((b) => {
    if (!b.active) return;

    b.life++;
    const t = b.life / b.maxLife;

    const start = b.dir.clone().multiplyScalar(40);
    const end = b.dir.clone().multiplyScalar(40 + b.life * b.speed);

    const arr = b.line.geometry.attributes.position.array;
    arr[0] = start.x;
    arr[1] = start.y;
    arr[2] = start.z;
    arr[3] = end.x;
    arr[4] = end.y;
    arr[5] = end.z;
    b.line.geometry.attributes.position.needsUpdate = true;

    b.line.material.opacity = Math.max(0, 1 - t * 1.1);

    if (b.life >= b.maxLife) {
      b.active = false;
      b.line.material.opacity = 0;
    }
  });

  // چرخش خیلی ملایم کل صحنه
  scene.rotation.y = time * 0.06;

  // دوربین کمی شناور
  camera.position.x = Math.sin(time * 0.15) * 25;
  camera.position.y = 30 + Math.sin(time * 0.2) * 12;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
