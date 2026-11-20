// The hero scene: a blueprint city whose buildings re-arrange into a 3D bar chart on scroll.
// One instanced box, all layout and colour in shaders. Three.js r170.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const N = 24;               // 24 x 24 = 576 buildings
const CELL = 0.9, GAP = 0.6; // block = 4 cells, streets between blocks

function rng(seed) {        // small deterministic PRNG so the skyline is the same every visit
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const cellPos = (i) => (i - N / 2 + 0.5) * CELL + (Math.floor(i / 4) - 2.5) * GAP;

const buildingVert = /* glsl */`
  attribute vec4 aCity;   // x, z, height, width
  attribute vec4 aChart;
  attribute float aSeed;
  attribute float aIdx;
  attribute float aLand;
  uniform float uMorph, uTime, uIntro, uHover, uPick;
  varying vec3 vLocal, vScale, vWorld, vN;
  varying float vM, vSeed, vHi, vLand;
  void main() {
    vHi = max(1.0 - step(0.5, abs(aIdx - uHover)), (1.0 - step(0.5, abs(aIdx - uPick))) * 1.6);
    vLand = aLand;
    float m = clamp(uMorph * 1.75 - aSeed * 0.75, 0.0, 1.0);
    m = m * m * (3.0 - 2.0 * m);
    vec4 a = mix(aCity, aChart, m);
    // a little lift in the middle of the move, like a crane picking it up
    float lift = sin(m * 3.14159) * (0.6 + aSeed * 1.6) + vHi * 0.25;
    float h = a.z * (1.0 + 0.07 * m * sin(uTime * 1.5 + a.x * 0.8 + a.y * 0.55));
    float intro = clamp(uIntro * 1.9 - aSeed * 0.9, 0.0, 1.0);
    intro = 1.0 - pow(1.0 - intro, 3.0);
    h = max(h * intro, 0.002);
    vec3 s = vec3(a.w, h, a.w);
    vec3 p = position * s + vec3(a.x, lift, a.y);
    vLocal = position; vScale = s; vM = m; vSeed = aSeed; vN = normal;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWorld = wp.xyz; vWorld.y -= lift;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;

const buildingFrag = /* glsl */`
  uniform float uTime, uDay;
  uniform vec3 uBg;
  varying vec3 vLocal, vScale, vWorld, vN;
  varying float vM, vSeed, vHi, vLand;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec3 q = vLocal - vec3(0.0, 0.5, 0.0);
    vec3 d = (0.5 - abs(q)) * vScale;                 // distance to each face, world units
    float mn = min(d.x, min(d.y, d.z));
    float mx = max(d.x, max(d.y, d.z));
    float mid = d.x + d.y + d.z - mn - mx;            // distance to the nearest edge
    float aa = fwidth(mid) * 1.3 + 1e-4;
    float edge = 1.0 - smoothstep(0.010, 0.010 + aa, mid);
    float halo = 1.0 - smoothstep(0.0, 0.10, mid);
    vec3 n = normalize(vN);
    float diff = 0.35 + 0.65 * max(dot(n, normalize(vec3(0.45, 0.9, 0.3))), 0.0);
    float hn = clamp(vWorld.y / 6.5, 0.0, 1.0);

    // blueprint city at night
    vec3 base = vec3(0.030, 0.045, 0.065) * diff * (0.7 + hn);
    vec3 eC = vec3(0.32, 0.58, 1.0);
    float side = 1.0 - step(0.5, abs(n.y));
    float horiz = abs(n.x) > 0.5 ? vWorld.z : vWorld.x;
    vec2 cell = vec2(horiz / 0.15, vWorld.y / 0.21);
    vec2 f = fract(cell);
    float win = step(0.26, f.x) * step(f.x, 0.74) * step(0.30, f.y) * step(f.y, 0.74) * side;
    win *= smoothstep(0.03, 0.07, mid) * step(0.25, vWorld.y);
    float lit = step(0.62 + uDay * 0.26, hash(floor(cell) + vSeed * 31.7));
    float flick = 0.7 + 0.3 * sin(uTime * 1.7 + hash(floor(cell) + 3.1) * 40.0);
    vec3 winC = mix(vec3(1.0, 0.70, 0.34), vec3(0.75, 0.88, 1.0), step(0.86, hash(floor(cell) + 9.0)));
    vec3 city = base + winC * win * lit * flick * 1.25 + eC * (edge * 0.95 + halo * 0.06);

    // the same boxes as a data model: a height ramp, lit tops, bright edges
    vec3 ramp = mix(vec3(0.12, 0.42, 0.95), vec3(0.30, 0.95, 0.78), smoothstep(0.0, 0.45, hn));
    ramp = mix(ramp, vec3(1.0, 0.74, 0.33), smoothstep(0.55, 1.0, hn));
    float top = step(0.5, n.y);
    vec3 chart = ramp * (0.05 + 0.16 * diff) + ramp * top * (0.06 + 0.30 * hn) + ramp * (edge * (0.75 + 0.5 * hn) + halo * 0.05);

    if (vLand > 0.5) {
      vec3 lmC = vec3(0.30, 0.95, 0.78);
      float beacon = smoothstep(0.88, 1.0, vLocal.y) * (0.55 + 0.45 * sin(uTime * 3.0 + vLand * 1.7));
      city = base * 1.4 + lmC * (edge * 1.7 + halo * 0.25) + mix(winC, vec3(0.75, 1.0, 0.92), 0.7) * win * flick * 1.15 + lmC * beacon;
    }
    vec3 col = mix(city, chart, vM);
    vec3 hiC = vec3(0.30, 0.95, 0.78);
    col = mix(col, col * 0.5 + hiC * (0.18 + edge * 1.4 + halo * 0.3), clamp(vHi, 0.0, 1.0));
    float fog = smoothstep(16.0, 44.0, length(vWorld - cameraPosition));
    gl_FragColor = vec4(mix(col, uBg, fog), 1.0);
  }`;

const groundFrag = /* glsl */`
  uniform float uMorph;
  uniform vec3 uBg;
  varying vec3 vW;
  float gridLine(vec2 p, float s) {
    vec2 g = abs(fract(p / s - 0.5) - 0.5) / fwidth(p / s);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }
  void main() {
    float r = length(vW.xz);
    float minor = gridLine(vW.xz, 0.9) * 0.35;
    float major = gridLine(vW.xz, 4.5);
    vec3 cB = vec3(0.20, 0.38, 0.75), cT = vec3(0.22, 0.75, 0.62);
    vec3 c = mix(cB, cT, uMorph);
    float fade = 1.0 - smoothstep(6.0, 26.0, r);
    vec3 glow = c * 0.10 * (1.0 - smoothstep(0.0, 16.0, r));
    vec3 col = uBg + glow + c * (minor + major * 0.7) * 0.32 * fade;
    gl_FragColor = vec4(col, 1.0);
  }`;

const groundVert = /* glsl */`
  varying vec3 vW;
  void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

const dotVert = /* glsl */`
  attribute vec3 aStart; attribute vec3 aAlt; attribute vec4 aMove; // dirX, dirZ, speed, offset
  uniform float uTime, uMorph, uPx;
  varying float vA, vM;
  void main() {
    float t = fract(aMove.w + uTime * aMove.z);
    vec3 street = aStart + vec3(aMove.x, 0.0, aMove.y) * (t - 0.5) * 26.0;
    vec3 rise = aAlt + vec3(0.0, t * 8.5, 0.0);
    vec3 p = mix(street, rise, smoothstep(0.15, 0.85, uMorph));
    vM = uMorph;
    vA = sin(t * 3.14159);
    vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
    gl_PointSize = uPx * (1.0 + uMorph * 0.6) * (12.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;

const dotFrag = /* glsl */`
  varying float vA, vM;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float a = smoothstep(0.5, 0.0, length(c));
    vec3 col = mix(vec3(1.0, 0.82, 0.55), vec3(0.45, 1.0, 0.85), vM);
    gl_FragColor = vec4(col * a * vA, a * vA);
  }`;

export function createCity(canvas, { reduced = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  const BG = new THREE.Color(0x05070a);
  renderer.setClearColor(BG, 1);
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);

  // buildings
  const rand = rng(20160616);
  const count = N * N;
  const aCity = new Float32Array(count * 4), aChart = new Float32Array(count * 4), aSeed = new Float32Array(count), aIdx = new Float32Array(count), aLand = new Float32Array(count);
  for (let i = 0, k = 0; i < N; i++) for (let j = 0; j < N; j++, k++) {
    const x = cellPos(i), z = cellPos(j), d2 = x * x + z * z;
    const r = rand();
    let h = 0.22 + Math.pow(r, 2.4) * 5.6 * Math.exp(-d2 / 75) + 0.7 * Math.exp(-d2 / 28) + rand() * 0.25;
    if (rand() < 0.05) h += 2.6 * Math.exp(-d2 / 140);
    const w = CELL * (0.6 + rand() * 0.24);
    aCity.set([x, z, h, w], k * 4);
    const cx = (i - N / 2 + 0.5) * 0.5, cz = (j - N / 2 + 0.5) * 0.5;
    const g = (ax, az, s) => Math.exp(-((cx - ax) ** 2 + (cz - az) ** 2) / s);
    const ch = 0.1 + 5.4 * g(1.3, -0.9, 5.5) + 3.1 * g(-2.5, 2.1, 3.4) + 1.4 * g(-1.4, -3.4, 2.2) + 0.9 * g(3.6, 3.2, 1.6);
    aChart.set([cx, cz, ch, 0.42], k * 4);
    aIdx[k] = k;
    aSeed[k] = 0.72 * ((i + j) / (2 * N - 2)) + 0.28 * rand();
  }
  // seven landmark towers, one per project
  const LAND_CELLS = [[6, 6], [6, 17], [10, 1], [13, 12], [17, 5], [18, 18], [22, 10]];
  const landmarks = LAND_CELLS.map(([i, j], n) => {
    const k = i * N + j;
    aCity[k * 4 + 2] = 3.6 + (n % 3) * 0.7;
    aCity[k * 4 + 3] = CELL * 0.84;
    aLand[k] = n + 1;
    return { n, k, x: aCity[k * 4], z: aCity[k * 4 + 1], h: aCity[k * 4 + 2] };
  });
  const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = box.index;
  geo.setAttribute('position', box.getAttribute('position'));
  geo.setAttribute('normal', box.getAttribute('normal'));
  geo.setAttribute('aCity', new THREE.InstancedBufferAttribute(aCity, 4));
  geo.setAttribute('aChart', new THREE.InstancedBufferAttribute(aChart, 4));
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
  geo.setAttribute('aIdx', new THREE.InstancedBufferAttribute(aIdx, 1));
  geo.setAttribute('aLand', new THREE.InstancedBufferAttribute(aLand, 1));
  geo.instanceCount = count;
  const uniforms = { uMorph: { value: 0 }, uTime: { value: 0 }, uIntro: { value: reduced ? 1 : 0 }, uHover: { value: -1 }, uPick: { value: -1 }, uDay: { value: 0 }, uBg: { value: BG }, uPx: { value: 2.2 * dpr } };
  const buildings = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: buildingVert, fragmentShader: buildingFrag, uniforms }));
  buildings.frustumCulled = false;
  scene.add(buildings);

  // sky: a dark dome so the horizon matches the page
  const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 uBg; uniform float uMorph, uDay; varying vec3 vP; void main(){ float h = clamp(vP.y / 90.0, 0.0, 1.0); vec3 band = mix(vec3(0.02, 0.05, 0.12), vec3(0.02, 0.09, 0.08), uMorph); gl_FragColor = vec4(uBg + band * (1.0 - smoothstep(0.0, 0.35, h)) * (0.55 + uDay * 0.9), 1.0); }',
  }));
  scene.add(sky);

  // ground grid
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.ShaderMaterial({ vertexShader: groundVert, fragmentShader: groundFrag, uniforms }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // traffic on the streets, then data points rising out of the chart
  const streets = [];
  for (let b = 1; b < N / 4; b++) streets.push((cellPos(b * 4 - 1) + cellPos(b * 4)) / 2);
  const DOTS = 700;
  const aStart = new Float32Array(DOTS * 3), aAlt = new Float32Array(DOTS * 3), aMove = new Float32Array(DOTS * 4);
  for (let i = 0; i < DOTS; i++) {
    const s = streets[Math.floor(rand() * streets.length)] + (rand() - 0.5) * 0.18;
    const alongX = rand() < 0.5;
    aStart.set(alongX ? [0, 0.06, s] : [s, 0.06, 0], i * 3);
    aAlt.set([(rand() - 0.5) * 12, 0.3, (rand() - 0.5) * 12], i * 3);
    const dir = rand() < 0.5 ? 1 : -1;
    aMove.set([alongX ? dir : 0, alongX ? 0 : dir, 0.012 + rand() * 0.03, rand()], i * 4);
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DOTS * 3), 3));
  dg.setAttribute('aStart', new THREE.BufferAttribute(aStart, 3));
  dg.setAttribute('aAlt', new THREE.BufferAttribute(aAlt, 3));
  dg.setAttribute('aMove', new THREE.BufferAttribute(aMove, 4));
  const dots = new THREE.Points(dg, new THREE.ShaderMaterial({
    vertexShader: dotVert, fragmentShader: dotFrag, uniforms,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  dots.frustumCulled = false;
  scene.add(dots);

  // beacons over the landmarks
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x4cf0c8, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false });
  const beams = landmarks.map((l) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.12, 14, 8, 1, true), beamMat);
    m.position.set(l.x, l.h + 7, l.z); scene.add(m); return m;
  });

  // the survey rover: a body, a spinning scanner and a scan ring on the ground
  const rover = new THREE.Group();
  const roverBody = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.5), new THREE.MeshBasicMaterial({ color: 0x0d1a22 }));
  roverBody.position.y = 0.12;
  const roverEdges = new THREE.LineSegments(new THREE.EdgesGeometry(roverBody.geometry), new THREE.LineBasicMaterial({ color: 0x4cf0c8 }));
  roverEdges.position.copy(roverBody.position);
  const scanner = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.12, 12), new THREE.MeshBasicMaterial({ color: 0x4cf0c8 }));
  scanner.position.set(0, 0.26, -0.06);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: 0xffb84d }));
  nose.position.set(0, 0.14, 0.26);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.56, 48), new THREE.MeshBasicMaterial({ color: 0x4cf0c8, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02;
  rover.add(roverBody, roverEdges, scanner, nose, ring);
  rover.visible = false;
  scene.add(rover);

  // glow
  const small = () => window.innerWidth < 760;
  let composer = null, bloom = null;
  function setupBloom() {
    if (small() || composer) return;
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.55, 0.12);
    composer.addPass(bloom);
  }

  // camera
  const state = { morph: 0, target: 0, mx: 0, my: 0, tmx: 0, tmy: 0, t: 0, w: 1, h: 1, rot: 0, vel: 0, tilt: 0, dragging: false, explore: false };
  const drive = { x: 0, z: 0, h: 0, v: 0, throttle: 0, steer: 0 };
  const look = new THREE.Vector3();
  function placeCamera() {
    const m = state.morph, e = m * m * (3 - 2 * m);
    const aspect = state.w / state.h;
    const fit = aspect < 1 ? 1 + (1 - aspect) * 0.9 : 1;
    const theta = 0.78 + state.t * 0.028 + state.mx * 0.14 + e * 0.55 + state.rot;
    const radius = (24 - 7.5 * e) * fit;
    const height = 10.5 + 3 * e - state.my * 1.4 + state.tilt;
    camera.position.set(Math.sin(theta) * radius, height, Math.cos(theta) * radius);
    look.set(0, 1.0 + e * 0.8, 0);
    camera.lookAt(look);
  }

  function setClock() {
    const d = new Date(), hr = d.getHours() + d.getMinutes() / 60;
    uniforms.uDay.value = 0.5 + 0.5 * Math.cos(((hr - 13) / 24) * Math.PI * 2);
  }
  setClock(); setInterval(setClock, 60000);

  // collision against the city blocks (explore mode keeps the city layout)
  function blocked(x, z, rad) {
    if (Math.abs(x) > 13.2 || Math.abs(z) > 13.2) return true;
    for (let k = 0; k < count; k++) {
      const o = k * 4, hw = aCity[o + 3] / 2 + rad;
      if (Math.abs(x - aCity[o]) < hw && Math.abs(z - aCity[o + 1]) < hw) return true;
    }
    return false;
  }
  const fwd = new THREE.Vector3(), camGoal = new THREE.Vector3(), lookGoal = new THREE.Vector3(), lookNow = new THREE.Vector3();
  function stepDrive(dt) {
    const accel = 7, maxV = 5.2;
    drive.v += drive.throttle * accel * dt;
    drive.v *= Math.pow(drive.throttle ? 0.6 : 0.06, dt);
    drive.v = Math.max(-maxV * 0.5, Math.min(maxV, drive.v));
    const turn = drive.steer * 2.4 * dt * (0.35 + Math.min(1, Math.abs(drive.v) / 2)) * (drive.v < -0.05 ? -1 : 1);
    drive.h -= turn;
    const nx = drive.x + Math.sin(drive.h) * drive.v * dt, nz = drive.z + Math.cos(drive.h) * drive.v * dt;
    if (!blocked(nx, nz, 0.2)) { drive.x = nx; drive.z = nz; }
    else if (!blocked(nx, drive.z, 0.2)) { drive.x = nx; drive.v *= 0.7; }
    else if (!blocked(drive.x, nz, 0.2)) { drive.z = nz; drive.v *= 0.7; }
    else drive.v *= -0.25;
    rover.position.set(drive.x, 0, drive.z);
    rover.rotation.y = drive.h;
    scanner.rotation.y += dt * 6;
    ring.scale.setScalar(1 + 0.15 * Math.sin(state.t * 4));
    fwd.set(Math.sin(drive.h), 0, Math.cos(drive.h));
    camGoal.set(drive.x - fwd.x * 4.4, 2.7, drive.z - fwd.z * 4.4);
    lookGoal.set(drive.x + fwd.x * 1.6, 0.5, drive.z + fwd.z * 1.6);
    const a = 1 - Math.exp(-dt * 4.5);
    camera.position.lerp(camGoal, a); lookNow.lerp(lookGoal, a);
    camera.lookAt(lookNow);
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    state.w = Math.max(1, r.width); state.h = Math.max(1, r.height);
    renderer.setSize(state.w, state.h, false);
    camera.aspect = state.w / state.h;
    camera.updateProjectionMatrix();
    setupBloom();
    if (composer) { composer.setSize(state.w, state.h); }
    if (reduced) frame(0);
  }

  let last = performance.now(), running = false, raf = 0, visible = true;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (!reduced) state.t += dt;
    state.morph += (state.target - state.morph) * (reduced ? 1 : Math.min(1, dt * 5));
    state.mx += (state.tmx - state.mx) * Math.min(1, dt * 3);
    state.my += (state.tmy - state.my) * Math.min(1, dt * 3);
    if (!state.dragging) { state.rot += state.vel; state.vel *= Math.pow(0.04, dt); }
    uniforms.uMorph.value = state.morph;
    uniforms.uTime.value = state.t;
    if (state.explore) stepDrive(dt); else placeCamera();
    beamMat.opacity = (state.explore ? 0.28 : 0.14) * (1 - state.morph) * (0.8 + 0.2 * Math.sin(state.t * 3));
    if (bloom) bloom.strength = state.explore ? 0.38 : 0.85 - 0.5 * state.morph;
    if (composer && !small()) composer.render(); else renderer.render(scene, camera);
  }
  function loop(now) { if (!running) return; frame(now); raf = requestAnimationFrame(loop); }
  function play() { if (running || (reduced && !state.explore) || !visible) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
  function pause() { running = false; cancelAnimationFrame(raf); }

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? play() : pause(); }).observe(canvas);
  window.addEventListener('resize', resize);
  if (!reduced && matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', (e) => {
      state.tmx = (e.clientX / window.innerWidth - 0.5) * 2;
      state.tmy = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }
  resize();

  // CPU copy of the shader's layout, for picking
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), bx = new THREE.Box3(), hit = new THREE.Vector3();
  function boxOf(k) {
    let m = Math.min(1, Math.max(0, state.morph * 1.75 - aSeed[k] * 0.75)); m = m * m * (3 - 2 * m);
    const o = k * 4, mix = (a, b) => a + (b - a) * m;
    const x = mix(aCity[o], aChart[o]), z = mix(aCity[o + 1], aChart[o + 1]), h = mix(aCity[o + 2], aChart[o + 2]), w = mix(aCity[o + 3], aChart[o + 3]);
    const lift = Math.sin(m * Math.PI) * (0.6 + aSeed[k] * 1.6);
    bx.min.set(x - w / 2, lift, z - w / 2); bx.max.set(x + w / 2, lift + h, z + w / 2);
    return { x, z, h, m };
  }
  function pick(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    let best = -1, bd = Infinity, info = null;
    for (let k = 0; k < count; k++) {
      const b = boxOf(k);
      if (ray.ray.intersectBox(bx, hit)) { const d = hit.distanceTo(camera.position); if (d < bd) { bd = d; best = k; info = b; } }
    }
    if (best < 0) return null;
    const i = Math.floor(best / N), j = best % N;
    const ch = aChart[best * 4 + 2], hc = aCity[best * 4 + 2];
    const floors = Math.max(1, Math.round(hc / 0.21));
    return { k: best, i, j, chart: info.m > 0.5, floors, metres: (floors * 3.2).toFixed(1), value: ch.toFixed(2) };
  }
  const redraw = () => { if (!running) frame(performance.now()); };

  return {
    pick,
    hover(k) { uniforms.uHover.value = k == null ? -1 : k; redraw(); },
    select(k) { uniforms.uPick.value = k == null ? -1 : k; redraw(); },
    drag(dx, dy) { state.rot += dx * 0.006; state.vel = dx * 0.006 * 0.6; state.tilt = Math.max(-6, Math.min(8, state.tilt - dy * 0.03)); redraw(); },
    setDragging(v) { state.dragging = v; },
    landmarks,
    get drive() { return drive; },
    get day() { return uniforms.uDay.value; },
    setInput(throttle, steer) { drive.throttle = throttle; drive.steer = steer; },
    toScreen(x, y, z) {
      const v = new THREE.Vector3(x, y, z).project(camera);
      return { x: (v.x + 1) / 2 * state.w, y: (1 - v.y) / 2 * state.h, on: v.z < 1 && v.z > -1 };
    },
    setExplore(on) {
      state.explore = on; rover.visible = on;
      if (on) {
        state.target = 0; state.morph = 0; uniforms.uIntro.value = 1;
        uniforms.uHover.value = -1; uniforms.uPick.value = -1;
        Object.assign(drive, { x: (cellPos(11) + cellPos(12)) / 2, z: (cellPos(3) + cellPos(4)) / 2, h: 0, v: 0, throttle: 0, steer: 0 });
        lookNow.set(drive.x, 0.5, drive.z + 2);
        camera.position.set(drive.x, 6, drive.z - 7);
      }
      if (!on && reduced) { pause(); frame(performance.now()); } else play();
    },
    start() {
      if (reduced) { frame(performance.now()); return; }
      const t0 = performance.now();
      const intro = (now) => { const p = Math.min(1, (now - t0) / 2600); uniforms.uIntro.value = p; if (p < 1) requestAnimationFrame(intro); };
      requestAnimationFrame(intro);
      play();
    },
    setMorph(v) { state.target = v; if (reduced) frame(performance.now()); },
    get morph() { return state.morph; },
  };
}
