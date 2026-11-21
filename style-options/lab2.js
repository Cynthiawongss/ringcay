// Round 2 boards: a brighter scrapbook cover (day and night), a ring catalogue in six families,
// and four ways an island can sit on a ring. Pictures only; the app does not load this file.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TAU, RI, TOP, bump, noise, band, strip, metal, gem, gemMat, seat, collar, RAINBOW, box, M, paint, pieces, islet } from './kit.js';

const W = 1600, HH = 1000, SS = 2;
const only = new URLSearchParams(location.search).get('only');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.NeutralToneMapping;
const pm = new THREE.PMREMGenerator(renderer);
const ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture;

let seedN = 5;
const rnd = () => ((seedN = (seedN * 16807) % 2147483647) / 2147483647);
const reseed = (n) => { seedN = n; };
const CANDY = ['#E8438C', '#FF8A3D', '#F6D54A', '#3DBE8B', '#4A7BE8', '#8B5BD6', '#8FD3E8', '#FF8FB8'];
const inner = (text = 'OURS · 06.14') => strip({ mirror: true, text, textAt: -Math.PI / 2, ink: 'rgba(40,38,54,.7)', depth: 1.1 });
const mats = (kind, outerTex, o = {}, innerText) => [metal(kind, outerTex, o), metal(kind, inner(innerText), o)];
const gloss = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.16, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.3, ...o });
const jelly = (color) => new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: 0.3, roughness: 0.1, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.9, envMapIntensity: 2.2, sheen: 1, sheenColor: '#ffffff', sheenRoughness: 0.3 });

// ---------- 24 rings in 6 families ----------
// Each returns { g, pose } where pose is 'lying' (stones run round the band) or 'upright' (there is a top to look at).
const taper = (base, more, s = 0.7) => (th) => base + more * bump(th, s);
const RINGS = {
  // classic
  dome: () => { const g = new THREE.Group(), B = band({ profile: 'dome', w: 1.0, t: 0.36, mats: mats('gold', strip({ hammer: 0.05 }), { roughness: 0.2 }) }); g.add(B.mesh); return { g, pose: 'lying' }; },
  cigar: () => { const g = new THREE.Group(), B = band({ profile: 'flat', w: 1.7, t: 0.3, mats: mats('satin', strip({ width: 1.7, hammer: 0.07 })) }); g.add(B.mesh); for (let i = -2; i <= 2; i++) seat(g, B, gem('round', 0.1, '#F7FBFF', { clear: true }), TOP + i * 0.2, { lift: -0.05 }); return { g, pose: 'lying' }; },
  knife: () => { const g = new THREE.Group(), B = band({ profile: 'knife', w: 0.86, t: 0.42, mats: mats('gold') }); g.add(B.mesh); return { g, pose: 'lying' }; },
  stackers: () => { const g = new THREE.Group(); [['gold', '#E8438C', -0.44], ['silver', '#8FD3E8', 0], ['rose', '#C8E04A', 0.44]].forEach(([k, c, y], i) => { const B = band({ profile: 'round', w: 0.3, t: 0.27, yoff: y, mats: mats(k) }); g.add(B.mesh); const th = TOP + (i - 1) * 0.5; const s = new THREE.Group(); s.add(collar(0.15, k, 0.2), gem('round', 0.15, c)); seat(g, B, s, th, { lift: 0.02 }); }); return { g, pose: 'lying' }; },

  // clay and wobble
  charm: (colors = ['#8B5BD6', '#FF8FB8', '#F6D54A']) => {
    const n1 = noise(1.3), n2 = noise(4.1), n3 = noise(7.7), n4 = noise(2.9), g = new THREE.Group();
    const doodles = [['sparkle', TOP + 0.34, 0.5, 30], ['sparkle', TOP - 0.34, 0.52, 28, 0.3], ['moon', TOP + 1.5, 0.5, 34, 0.4], ['star', TOP - 1.5, 0.5, 30], ['sparkle', TOP + 1.95, 0.45, 26], ['heart', TOP - 2.0, 0.5, 26], ['sparkle', TOP + 2.6, 0.55, 24], ['cat', TOP - 2.6, 0.5, 34]];
    const B = band({ profile: 'round', w: (th) => 1.1 + 0.16 * n1(th) + 0.1 * bump(th, 1.2), t: (th) => 0.46 + 0.1 * n2(th), wob: (th) => 0.05 * n3(th), yoff: (th) => 0.05 * n4(th), mats: mats('satin', strip({ width: 1.1, hammer: 0.2, doodles }), {}, 'YOU + ME · 06.14') });
    g.add(B.mesh);
    seat(g, B, gem('heart', 0.3, colors[0]), TOP, { lift: -0.1 });
    for (const s of [-1, 1]) { seat(g, B, gem('round', 0.1, colors[1]), TOP + s * 0.68, { lift: -0.05 }); seat(g, B, gem('star', 0.16, colors[2]), TOP + s * 1.08, { lift: -0.07, tilt: s * 0.2 }); }
    return { g, pose: 'lying' };
  },
  doodle: () => { const n1 = noise(3.3), g = new THREE.Group(); const doodles = [['cat', TOP, 0.5, 52], ['heart', TOP + 0.62, 0.5, 34], ['heart', TOP - 0.62, 0.5, 34], ['star', TOP + 1.2, 0.5, 34], ['sparkle', TOP - 1.2, 0.5, 34], ['moon', TOP + 1.8, 0.5, 34], ['sparkle', TOP - 1.8, 0.5, 30]]; const B = band({ profile: 'dome', w: (th) => 1.3 + 0.1 * n1(th), t: 0.36, wob: (th) => 0.03 * n1(th + 1), mats: mats('satin', strip({ width: 1.3, hammer: 0.16, doodles })) }); g.add(B.mesh); return { g, pose: 'lying' }; },
  molten: () => { const g = new THREE.Group(); [[1.1, -0.26], [5.2, 0.26]].forEach(([s, y]) => { const a = noise(s), b = noise(s * 2); const B = band({ profile: 'round', w: (th) => 0.42 + 0.4 * Math.pow(Math.max(0, a(th)), 2), t: (th) => 0.36 + 0.14 * b(th), yoff: (th) => y * 1.2 + 0.07 * a(th + 2), mats: mats('silver') }); g.add(B.mesh); }); return { g, pose: 'lying' }; },
  puffy: () => { const g = new THREE.Group(), B = band({ profile: 'round', w: taper(0.34, 0.3), t: taper(0.28, 0.1), mats: mats('silver') }); g.add(B.mesh); const s = new THREE.Shape(); s.moveTo(0, -0.7); s.bezierCurveTo(-1.2, 0.05, -0.7, 0.9, 0, 0.36); s.bezierCurveTo(0.7, 0.9, 1.2, 0.05, 0, -0.7); const geo = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 10, curveSegments: 28 }); const h = M(geo, metal('silver')); seat(g, B, h, TOP, { lift: 0.12 }); return { g, pose: 'upright' }; },

  // rainbow stones
  confetti: () => { reseed(21); const g = new THREE.Group(), B = band({ profile: 'dome', w: 1.16, t: 0.44, mats: mats('gold', strip({ width: 1.16, hammer: 0.26 }), { roughness: 0.3 }) }); g.add(B.mesh); for (let i = 0; i < 58; i++) { const kind = rnd() < 0.7 ? 'round' : rnd() < 0.5 ? 'baguette' : 'emerald'; seat(g, B, gem(kind, 0.065 + rnd() * 0.095, CANDY[i % CANDY.length]), TOP + (rnd() - 0.5) * 5.6, { v: 0.14 + rnd() * 0.72, lift: -0.035, tilt: rnd() * 3 }); } return { g, pose: 'lying' }; },
  bezel: () => { const g = new THREE.Group(), B = band({ profile: 'round', w: 0.36, t: 0.24, mats: mats('gold') }); g.add(B.mesh); const n = 16; for (let i = 0; i < n; i++) { const s = i % 2 ? 0.17 : 0.23, kind = ['round', 'oval', 'round', 'emerald'][i % 4], st = new THREE.Group(); st.add(collar(s * 0.92, 'gold', 0.16), gem(kind, s, RAINBOW[i % RAINBOW.length])); seat(g, B, st, (i / n) * TAU + 0.2, { lift: 0.06 }); } return { g, pose: 'lying' }; },
  baguette: () => { const g = new THREE.Group(), B = band({ profile: 'flat', w: 0.98, t: 0.34, mats: mats('gold') }); g.add(B.mesh); const n = 40, c = new THREE.Color(); for (let i = 0; i < n; i++) seat(g, B, gem('baguette', 0.27, '#' + c.setHSL((i / n + 0.92) % 1, 0.86, 0.56).getHexString()), (i / n) * TAU, { lift: -0.05 }); return { g, pose: 'lying' }; },
  toimoi: () => { const g = new THREE.Group(), gap = 0.4, B = band({ profile: 'round', w: 0.32, t: 0.28, th0: TOP + gap, th1: TOP - gap + TAU, mats: mats('gold') }); g.add(B.mesh); [['pear', '#FF8FB8', 1, 0.44], ['emerald', '#3DBE8B', -1, 0.4]].forEach(([k, c, s, sz]) => { const st = new THREE.Group(); st.add(collar(sz * 0.9, 'gold', 0.26), gem(k, sz, c)); seat(g, B, st, TOP + s * (gap + 0.02), { lift: 0.08, tilt: s * 0.5 }); }); return { g, pose: 'upright', ends: [TOP + gap, TOP - gap] }; },

  // chunky and sculptural
  bombe: () => { reseed(9); const g = new THREE.Group(), B = band({ profile: 'round', w: taper(0.5, 1.0, 1.0), t: taper(0.3, 0.82, 0.95), mats: mats('gold', strip({ hammer: 0.08 }), { roughness: 0.18 }) }); g.add(B.mesh); for (let i = 0; i < 11; i++) seat(g, B, gem(i % 3 ? 'round' : 'star', 0.07 + rnd() * 0.07, CANDY[i % CANDY.length]), TOP + (rnd() - 0.5) * 1.5, { v: 0.22 + rnd() * 0.56, lift: -0.04, tilt: rnd() * 3 }); return { g, pose: 'upright' }; },
  wave: () => { const g = new THREE.Group(), B = band({ profile: 'round', w: 0.46, t: 0.38, yoff: (th) => 0.3 * Math.sin(4 * th), mats: mats('silver') }); g.add(B.mesh); return { g, pose: 'lying' }; },
  bubble: () => { const k = (th) => Math.pow(Math.abs(Math.sin(4 * th)), 1.4), g = new THREE.Group(), B = band({ profile: 'round', w: (th) => 0.46 + 0.56 * k(th), t: (th) => 0.26 + 0.36 * k(th), mats: mats('silver') }); g.add(B.mesh); return { g, pose: 'lying' }; },
  flush: () => { const g = new THREE.Group(), B = band({ profile: 'dome', w: 1.3, t: 0.54, mats: mats('gold', strip({ width: 1.3, hammer: 0.1 }), { roughness: 0.2 }) }); g.add(B.mesh); seat(g, B, gem('round', 0.3, '#8FD3E8'), TOP, { lift: -0.12 }); return { g, pose: 'lying' }; },

  // signets
  pinky: () => { const g = new THREE.Group(), B = band({ profile: 'dome', w: taper(0.42, 0.75), t: taper(0.28, 0.22), mats: mats('gold') }); g.add(B.mesh); const top = new THREE.Group(), p = M(new THREE.CylinderGeometry(1, 0.94, 0.26, 48).rotateX(Math.PI / 2), metal('gold')); p.scale.set(0.76, 0.98, 1); const face = M(new THREE.CircleGeometry(1, 48), metal('gold', faceTex((c) => { c.lineWidth = 9; star5(c, 128, 128, 62); }), { roughness: 0.3 }), 0, 0, 0.134); face.scale.set(0.7, 0.92, 1); top.add(p, face); seat(g, B, top, TOP, { lift: 0.06 }); return { g, pose: 'upright' }; },
  boxy: () => {
    const g = new THREE.Group(), B = band({ profile: 'flat', w: 1.5, t: 0.36, mats: mats('oxid', strip({ width: 1.5, hammer: 0.2 })) }); g.add(B.mesh);
    const top = new THREE.Group(), m = metal('oxid', null, { roughness: 0.5 });
    top.add(M(box(2.3, 1.62, 0.56, 0.06), m, 0, 0, 0));
    for (const y of [-0.62, 0.62]) top.add(M(box(2.3, 0.2, 0.1, 0.03), m, 0, y, 0.31));
    for (const x of [-1.0, 1.0]) for (const y of [-0.62, 0.62]) top.add(M(new THREE.SphereGeometry(0.075, 16, 10), metal('silver'), x, y, 0.4));
    for (const x of [-1.17, 1.17]) for (const y of [-0.5, 0.5]) top.add(M(new THREE.SphereGeometry(0.07, 16, 10), metal('silver'), x, y, 0.05));
    seat(g, B, top, TOP, { lift: 0.2 });
    return { g, pose: 'upright', table: { y: RI + 0.36 + 0.2 + 0.28, w: 2.1, d: 1.0 } };
  },
  enamel: () => { const g = new THREE.Group(), B = band({ profile: 'dome', w: taper(0.44, 0.9), t: taper(0.28, 0.22), mats: mats('gold') }); g.add(B.mesh); const top = new THREE.Group(); top.add(M(box(1.5, 1.5, 0.3, 0.14), metal('gold')), M(box(1.26, 1.26, 0.1, 0.1), gloss('#2447D6'), 0, 0, 0.12)); const s = gem('star', 0.2, '#FFE27A'); s.position.z = 0.15; top.add(s); seat(g, B, top, TOP, { lift: 0.08 }); return { g, pose: 'upright' }; },
  inlay: () => { const g = new THREE.Group(), B = band({ profile: 'dome', w: taper(0.44, 0.86), t: taper(0.28, 0.2), mats: mats('satin') }); g.add(B.mesh); const top = new THREE.Group(), p = M(new THREE.CylinderGeometry(1, 0.94, 0.28, 48).rotateX(Math.PI / 2), metal('satin')); p.scale.set(0.82, 1.06, 1); const face = M(new THREE.CircleGeometry(1, 48), new THREE.MeshPhysicalMaterial({ map: faceTex((c) => { c.fillStyle = '#16A36B'; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 9; i++) { c.strokeStyle = i % 2 ? '#0B6B46' : '#5BD9A0'; c.lineWidth = 8 + (i % 3) * 5; c.beginPath(); c.ellipse(60, 250, 30 + i * 30, 22 + i * 26, 0.3, 0, TAU); c.stroke(); } }, true).map, roughness: 0.12, clearcoat: 1 }), 0, 0, 0.145); face.scale.set(0.7, 0.94, 1); top.add(p, face); seat(g, B, top, TOP, { lift: 0.06 }); return { g, pose: 'upright' }; },

  // candy: enamel, resin, jelly
  vine: () => { const g = new THREE.Group(), pts = []; for (let i = 0; i <= 120; i++) { const u = i / 120, th = TOP - 0.55 + u * TAU * 1.5, r = RI + 0.16; pts.push(new THREE.Vector3(Math.cos(th) * r, -0.5 + u * 1.0, Math.sin(th) * r)); } const tube = M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 260, 0.135, 14), gloss('#FF4FA3')); g.add(tube); const fake = { rOut: () => RI + 0.3, yAt: () => -0.5 }; const st = new THREE.Group(); st.add(collar(0.3, 'gold', 0.24), gem('pear', 0.32, '#C8E04A')); seat(g, fake, st, TOP - 0.62, { tilt: -1.2 }); const end = M(new THREE.SphereGeometry(0.19, 16, 12), gloss('#FF4FA3')); const a = TOP - 0.55 + TAU * 1.5; end.position.set(Math.cos(a) * (RI + 0.16), 0.5, Math.sin(a) * (RI + 0.16)); g.add(end); return { g, pose: 'lying' }; },
  resin: () => { const sq = (th) => Math.pow(1 / Math.max(Math.abs(Math.cos(th)), Math.abs(Math.sin(th))), 0.6) - 1, m = jelly('#FF7A3D'), g = new THREE.Group(), B = band({ profile: 'flat', w: 1.36, t: 0.5, extra: (th) => 3.1 * sq(th), mats: [m, m] }); g.add(B.mesh); return { g, pose: 'lying' }; },
  jellydome: () => { const g = new THREE.Group(), B = band({ profile: 'round', w: taper(0.36, 0.5), t: taper(0.28, 0.14), mats: mats('gold') }); g.add(B.mesh); const top = new THREE.Group(), c = M(new THREE.SphereGeometry(1, 40, 20, 0, TAU, 0, Math.PI / 2).rotateX(Math.PI / 2), jelly('#35C9E8')); c.scale.set(0.86, 1.08, 0.78); top.add(collar(0.8, 'gold', 0.28), c); top.children[0].scale.set(1.0, 1.25, 1); seat(g, B, top, TOP, { lift: 0.1 }); return { g, pose: 'upright' }; },
  stripes: () => { const g = new THREE.Group(); [['#2447D6', -0.42], ['#F0452E', 0], ['#2FA35A', 0.42]].forEach(([c, y]) => { const B = band({ profile: 'flat', w: 0.34, t: 0.28, yoff: y, mats: mats('gold') }); const m = gloss(c), E = band({ profile: 'flat', w: 0.17, t: 0.3, yoff: y, mats: [m, m] }); g.add(B.mesh, E.mesh); }); return { g, pose: 'lying' }; },
};

function faceTex(drawFn, colour = false) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  if (!colour) { x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(40,30,10,.75)'; x.lineJoin = 'round'; }
  drawFn(x);
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace;
  return { map, bump: colour ? null : new THREE.CanvasTexture(c), depth: 1.2 };
}
function star5(c, x, y, r) { c.beginPath(); for (let i = 0; i < 11; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * 0.45 : r; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * q, y + Math.sin(a) * q); } c.stroke(); }

// ---------- light ----------
function stage(night) {
  const scene = new THREE.Scene();
  scene.environment = ENV;
  scene.environmentIntensity = night ? 0.42 : 1.0;
  scene.add(new THREE.HemisphereLight(night ? '#7482D8' : '#FFFFFF', night ? '#1B1438' : '#CFE9FF', night ? 0.5 : 1.0));
  const sun = new THREE.DirectionalLight(night ? '#BFCBFF' : '#FFF6E6', night ? 1.25 : 3.0);
  sun.position.set(...(night ? [-6, 9, 4] : [6, 10, 7])).multiplyScalar(1.6);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 60 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 5;
  scene.add(sun, sun.target);
  if (night) { const f = new THREE.DirectionalLight('#FF9E7A', 0.45); f.position.set(5, 2, 8); scene.add(f); }
  return scene;
}
// `show` leans an upright ring toward the camera so its face reads, the way a ring is photographed.
// Islands need the ring level, so they pass show = false.
function posed(ring, show = false) {
  const outer = new THREE.Group(), mid = new THREE.Group(), innerG = new THREE.Group();
  innerG.add(ring.g); mid.add(innerG); outer.add(mid);
  if (ring.pose === 'upright') { innerG.rotation.x = -Math.PI / 2; mid.rotation.y = -0.55; if (show) { outer.rotation.x = 0.62; outer.rotation.z = 0.05; } }
  else outer.rotation.x = show ? 0.06 : 0.1;
  return outer;
}
function shoot(scene, subject, { w, h, az = 0.22, el = 0.4, fov = 24, pad = 1.16, catcher = false, shadow = 0.22, lift = 0, night = false, zoom = 1 } = {}) {
  subject.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(subject), c = bb.getCenter(new THREE.Vector3()), size = bb.getSize(new THREE.Vector3());
  if (catcher) { const p = new THREE.Mesh(new THREE.PlaneGeometry(80, 80).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ color: '#2A2440', opacity: shadow })); p.position.y = bb.min.y - 0.02; p.receiveShadow = true; scene.add(p); }
  renderer.setSize(w * SS, h * SS, false);
  renderer.toneMappingExposure = night ? 1.12 : 1.04;
  const cam = new THREE.PerspectiveCamera(fov, w / h, 0.1, 300);
  const rad = size.length() / 2, vf = (fov * Math.PI) / 360, hf = Math.atan(Math.tan(vf) * (w / h));
  const dist = ((rad * pad) / Math.sin(Math.min(vf, hf))) / zoom;
  c.y += lift;
  cam.position.set(c.x + dist * Math.cos(el) * Math.sin(az), c.y + dist * Math.sin(el), c.z + dist * Math.cos(el) * Math.cos(az));
  cam.lookAt(c);
  renderer.render(scene, cam);
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  out.getContext('2d').drawImage(renderer.domElement, 0, 0, w, h);
  return out;
}
const ringShot = (id, w, h, o = {}) => { const scene = stage(false), r = RINGS[id](), s = posed(r, true); scene.add(s); return shoot(scene, s, { w, h, az: r.pose === 'upright' ? 0.0 : 0.12, el: r.pose === 'upright' ? 0.34 : 0.5, ...o }); };

// ---------- islands ----------
function dress(isl, night, R, mood = 0) {
  const P = pieces(night), put = isl.userData.put;
  put(P.pond(R * 0.2), 0.7, R * 0.42);
  put(P.house(0.5, 0.33, 0.4, { roof: mood ? '#2447D6' : '#FF5C34', door: mood ? '#FF4FA3' : '#2447D6' }), 4.2, R * 0.42, { s: R * 0.62, rot: Math.PI + 0.9 });
  put(P.lighthouse(), 5.5, R * 0.62, { s: R * 0.62 });
  [[3.5, 0.72, 1.0], [3.75, 0.5, 0.8], [2.9, 0.78, 0.72]].forEach(([a, r, s]) => put(P.cypress(), a, R * r, { s: s * R * 0.62 }));
  [[2.2, 0.62, 0.95, '#35C46A', '#58D676'], [1.35, 0.78, 0.8, '#FF8FB8', '#FFB3CF'], [0.1, 0.7, 0.85, '#35C46A', '#7BE08A']].forEach(([a, r, s, c1, c2]) => put(P.tree(c1, c2), a, R * r, { s: s * R * 0.62 }));
  [[1.9, 0.86, '#FFD23F'], [4.9, 0.84, '#FF5CC8'], [0.5, 0.86, '#8A5CF6']].forEach(([a, r, c]) => put(P.bush(c, 4), a, R * r, { s: R * 0.55 }));
  put(P.arch(), 1.05, R * 0.3, { s: R * 0.5, rot: 0.6 });
  put(P.flag(), 4.55, R * 0.74, { s: R * 0.6 });
  [[0.95, 0.62], [2.6, 0.45], [5.0, 0.4]].forEach(([a, r]) => put(P.lamp(), a, R * r, { s: R * 0.6 }));
  for (let k = 0; k < 16; k++) { const a = k * 2.399963 + 0.3; if (k % 2) put(P.tuft(), a, R * (0.86 + (k % 3) * 0.03)); else put(P.rock('#FFF3DE', k), a, R * 0.9, { s: 0.3 + (k % 3) * 0.08 }); }
  if (night) [[4.2, 0.4, '#FFB05A', 6], [5.5, 0.62, '#FFD08A', 5], [1.5, 0.5, '#FFB05A', 3]].forEach(([a, r, c, p]) => { const l = new THREE.PointLight(c, p, 4, 2); l.position.set(Math.cos(a) * R * r, 0.7, Math.sin(a) * R * r); isl.add(l); });
  return isl;
}

// 1. a band: the island floats level in the hole, so the engraving inside the ring stays readable
function formFloat(night, colors) {
  const all = new THREE.Group(), ring = posed(RINGS.charm(colors)); ring.rotation.x = 0.16;
  const isl = dress(islet({ R: 1.3, crystal: colors ? colors[0] : '#8B5BD6', depth: 1.2, night, grass: night ? ['#3E9E78', '#2E8A72'] : undefined }), night, 1.3);
  isl.position.y = 0.2;
  all.add(ring, isl);
  return all;
}
// 2. a flat-topped signet: the top is the ground
function formTable(night) {
  const r = RINGS.boxy(), all = posed(r), P = pieces(night), t = new THREE.Group();
  const lawn = M(box(2.14, 0.1, 1.06, 0.05), paint('#6FD36A')); lawn.position.y = 0.05; t.add(lawn);
  const put = (o, x, z, s = 1, rot = 0) => { o.position.set(x, 0.1, z); o.scale.setScalar(s); o.rotation.y = rot; t.add(o); };
  put(P.house(0.5, 0.33, 0.4, { roof: '#FF5C34' }), -0.5, -0.12, 1.0, 0.25); put(P.lighthouse(), 0.8, -0.22, 0.95); put(P.cypress(), -0.9, 0.12, 0.85); put(P.cypress(), -0.2, -0.3, 0.7);
  put(P.tree('#FF8FB8', '#FFB3CF'), 0.3, 0.14, 0.8); put(P.bush('#FFD23F'), 0.62, 0.3, 0.9); put(P.bush('#8A5CF6'), -0.85, -0.3, 0.8); put(P.lamp(), 0.0, 0.34, 0.9); put(P.pond(0.18), 0.85, 0.24);
  t.position.y = r.table.y;
  all.add(t);                                  // sits on the posed group, so it turns with the ring but stays upright
  if (night) { const l = new THREE.PointLight('#FFB05A', 5, 4, 2); l.position.set(-0.4, r.table.y + 0.6, 0.3); all.add(l); }
  return all;
}
// 3. a solitaire: the island is the stone, held by the prongs
function formStone(night) {
  const g = new THREE.Group(), B = band({ profile: 'round', w: 0.42, t: 0.32, mats: mats('silver') }); g.add(B.mesh);
  const all = posed({ g, pose: 'upright' }), R = 1.3, depth = 1.15, yTop = RI + 0.32 + depth + 0.34;
  const isl = dress(islet({ R, crystal: '#35C9E8', depth, night, facets: 8 }), night, R, 1); isl.position.y = yTop;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.26, p = M(new THREE.CylinderGeometry(0.05, 0.065, 1.74, 10), metal('silver')); p.position.set(Math.cos(a) * R * 0.66, yTop - 0.82, Math.sin(a) * R * 0.66); p.rotation.set(Math.sin(a) * 0.62, 0, -Math.cos(a) * 0.62); const tip = M(new THREE.SphereGeometry(0.085, 12, 10), metal('silver'), Math.cos(a) * R * 0.99, yTop - 0.02, Math.sin(a) * R * 0.99); all.add(p, tip); }
  all.add(isl);
  return all;
}
// 4. an open ring: one islet on each end, and a bridge between the two of you
function formTwin(night) {
  const r = RINGS.toimoi(); r.g.children.slice(1).forEach((c) => r.g.remove(c));
  const all = posed(r), P = pieces(night), rr = RI + 0.75;
  [[r.ends[0], '#FF4FA3', 0], [r.ends[1], '#3DBE8B', 1]].forEach(([th, col, k]) => {
    const R = 0.86, isl = islet({ R, crystal: col, depth: 0.9, night, facets: 7 }), put = isl.userData.put;
    put(k ? P.house(0.5, 0.33, 0.4, { roof: '#2447D6', door: '#FF4FA3' }) : P.house(0.5, 0.33, 0.4, { roof: '#FF5C34' }), 4.4, 0.3, { s: 0.62, rot: Math.PI + 0.9 });
    put(k ? P.cypress() : P.tree('#FF8FB8', '#FFB3CF'), 2.4, 0.5, { s: 0.62 }); put(P.bush(k ? '#FFD23F' : '#8A5CF6'), 0.6, 0.6, { s: 0.6 }); put(P.lamp(), k ? 2.9 : 0.3, 0.72, { s: 0.6 });
    isl.position.set(k ? 1.28 : -1.28, Math.sin(th) * rr + 0.86, 0);
    all.add(isl);
    if (night) { const l = new THREE.PointLight('#FFB05A', 3, 3, 2); l.position.copy(isl.position).add(new THREE.Vector3(0, 0.6, 0.2)); all.add(l); }
  });
  const x1 = 0.56, y = Math.sin(r.ends[0]) * rr + 0.84;
  for (let i = 0; i <= 12; i++) { const u = i / 12, x = -x1 + u * (x1 * 2), sag = -0.2 * Math.sin(Math.PI * u), pl = M(new THREE.BoxGeometry(0.1, 0.02, 0.24), paint('#E9B872'), x, y + sag, 0); pl.rotation.z = -0.2 * Math.PI * Math.cos(Math.PI * u) * 0.5; all.add(pl); }
  return all;
}

// ---------- 2D ----------
function type(ctx, str, x, y, font, color, { align = 'left', ls = 0 } = {}) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.letterSpacing = ls + 'px';
  ctx.fillText(str, x, y); ctx.letterSpacing = '0px';
  return ctx.measureText(str).width;
}
function grain(ctx, w, h, amount) {
  const n = document.createElement('canvas'); n.width = w / 2; n.height = h / 2;
  const x = n.getContext('2d'), d = x.createImageData(n.width, n.height);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = amount * 255; }
  x.putImageData(d, 0, 0);
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(n, 0, 0, w, h); ctx.restore();
}
function pill(ctx, x, y, w, h, r, fill, stroke) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); } }
function paper(ctx, bg, line) {
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, HH); ctx.strokeStyle = line; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HH); ctx.stroke(); }
  for (let y = 0; y < HH; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}
function cutout(ctx, img, x, y, size, rot = 0, edge = 5) {
  const s = document.createElement('canvas'); s.width = img.width; s.height = img.height; const sx = s.getContext('2d'); sx.drawImage(img, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#fff'; sx.fillRect(0, 0, s.width, s.height);
  const k = size / img.width, hh = img.height * k;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.shadowColor = 'rgba(30,20,50,.22)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
  for (let i = 0; i < 16; i++) ctx.drawImage(s, -size / 2 + Math.cos((i / 16) * TAU) * edge, -hh / 2 + Math.sin((i / 16) * TAU) * edge, size, hh);
  ctx.shadowColor = 'transparent'; ctx.drawImage(img, -size / 2, -hh / 2, size, hh); ctx.restore();
}
function sky(ctx, x, y, w, h, night) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  if (night) { g.addColorStop(0, '#16113A'); g.addColorStop(0.6, '#3A2578'); g.addColorStop(1, '#7A3E9B'); } else { g.addColorStop(0, '#4FB5FF'); g.addColorStop(0.65, '#A9DEFF'); g.addColorStop(1, '#E3F5FF'); }
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (night) {
    reseed(77); for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(255,244,214,${0.35 + rnd() * 0.65})`; ctx.beginPath(); ctx.arc(x + rnd() * w, y + rnd() * h * 0.8, 0.8 + rnd() * 1.8, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#FFF1B8'; ctx.beginPath(); ctx.arc(x + w * 0.16, y + h * 0.18, 34, 0, TAU); ctx.fill(); ctx.fillStyle = '#1D1548'; ctx.beginPath(); ctx.arc(x + w * 0.16 + 15, y + h * 0.18 - 9, 30, 0, TAU); ctx.fill();
  } else {
    ctx.fillStyle = '#FFE14D'; ctx.beginPath(); ctx.arc(x + w * 0.15, y + h * 0.17, 40, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.95)'; [[0.74, 0.16, 1], [0.3, 0.3, 0.7], [0.9, 0.52, 0.6]].forEach(([cx, cy, s]) => { for (const [dx, dy, r] of [[0, 0, 26], [28, 6, 20], [-28, 8, 18], [8, -14, 18]]) { ctx.beginPath(); ctx.arc(x + w * cx + dx * s, y + h * cy + dy * s, r * s, 0, TAU); ctx.fill(); } });
  }
  ctx.restore();
}
const board = (id, fn) => { const c = document.createElement('canvas'); c.width = W; c.height = HH; fn(c.getContext('2d')); return { id, canvas: c }; };
const EN = ['a ring that', 'grows into', 'a place.'], ZH = '一枚戒指，长成一座岛。';

function cover(night) {
  return board(night ? 'cover-night' : 'cover-day', (ctx) => {
    const C = night ? { bg: '#15122E', line: 'rgba(255,255,255,.045)', ink: '#F7F2E7', sub: 'rgba(247,242,231,.66)', mark: '#8A5CF6', btn: '#FFE14D', btnInk: '#15122E', frame: '#FBF9F3', tape: 'rgba(255,225,77,.9)', dot: '#FF4FA3', dotInk: '#15122E' }
      : { bg: '#F7F2E7', line: 'rgba(40,34,60,.05)', ink: '#1C1830', sub: 'rgba(28,24,48,.64)', mark: '#FFE14D', btn: '#1C1830', btnInk: '#F7F2E7', frame: '#FFFFFF', tape: 'rgba(255,79,163,.86)', dot: '#2447D6', dotInk: '#FFE14D' };
    paper(ctx, C.bg, C.line);
    const scene = stage(night), subject = formFloat(night, ['#FF4FA3', '#8FD3E8', '#F6D54A']); scene.add(subject);
    const photo = shoot(scene, subject, { w: 700, h: 640, az: 0.2, el: 0.46, pad: 0.74, night, lift: 0.18 });
    ctx.save(); ctx.translate(1130, 500); ctx.rotate(-0.04);
    ctx.shadowColor = night ? 'rgba(0,0,0,.5)' : 'rgba(40,30,60,.2)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 18; ctx.fillStyle = C.frame; ctx.fillRect(-380, -400, 760, 830); ctx.shadowColor = 'transparent';
    sky(ctx, -350, -370, 700, 640, night);
    ctx.drawImage(photo, -350, -370);
    type(ctx, night ? 'still up  ·  11:48 pm' : 'our island  ·  day 142', 0, 372, '400 52px "Nanum Pen Script"', '#1C1830', { align: 'center' });
    ctx.fillStyle = C.tape; ctx.save(); ctx.translate(-30, -400); ctx.rotate(-0.07); ctx.fillRect(-92, -22, 184, 44); ctx.restore();
    ctx.restore();
    ctx.save(); ctx.translate(1492, 148); ctx.rotate(0.2); ctx.beginPath(); ctx.arc(0, 0, 66, 0, TAU); ctx.fillStyle = C.dot; ctx.fill(); type(ctx, 'free', 0, -4, '800 30px "Bricolage Grotesque"', C.dotInk, { align: 'center' }); type(ctx, 'to make', 0, 24, '800 22px "Bricolage Grotesque"', C.dotInk, { align: 'center' }); ctx.restore();
    grain(ctx, W, HH, 0.06);
    type(ctx, 'ringcay', 88, 104, '800 36px "Bricolage Grotesque"', C.ink, { ls: -1.5 });
    type(ctx, 'explore      my island      en / 中文', 660, 100, '400 16px "Special Elite"', C.ink, { align: 'right' });
    ctx.fillStyle = C.mark; ctx.save(); ctx.translate(86, 418); ctx.rotate(-0.012); ctx.fillRect(-6, 0, 392, 84); ctx.restore();
    EN.forEach((l, i) => type(ctx, l, 84, 286 + i * 100, '800 100px "Bricolage Grotesque"', C.ink, { ls: -4 }));
    type(ctx, ZH, 88, 596, '900 44px "Noto Sans SC"', C.ink, { ls: 0.5 });
    type(ctx, 'pick a ring. it grows an island. tuck your memories in.', 88, 652, '400 19px "Special Elite"', C.sub);
    type(ctx, '选一枚戒指，它会长出一座岛，把回忆放进去。', 88, 686, '500 17px "Noto Sans SC"', C.sub, { ls: 0.5 });
    pill(ctx, 88, 724, 216, 58, 29, C.btn); type(ctx, 'start our ring', 196, 760, '800 18px "Bricolage Grotesque"', C.btnInk, { align: 'center', ls: -0.3 });
    pill(ctx, 318, 724, 170, 58, 29, null, C.ink); type(ctx, '开始做戒指', 403, 760, '900 16px "Noto Sans SC"', C.ink, { align: 'center', ls: 1 });
    type(ctx, '24 rings to start from', 88, 838, '400 16px "Special Elite"', C.sub);
    ['confetti', 'boxy', 'vine', 'bombe', 'bezel'].forEach((id, i) => cutout(ctx, ringShot(id, 240, 200, { pad: 0.74 }), 146 + i * 122, 908, 124, (i - 2) * 0.05, 4));
    type(ctx, night ? 'NIGHT · follows your clock · 夜间（跟随系统时间）' : 'DAY · follows your clock · 白天（跟随系统时间）', W - 60, HH - 36, '600 13px "Hanken Grotesk"', C.sub, { align: 'right', ls: 1.6 });
  });
}

const FAMILIES = [
  ['classic', '经典素圈', '#FFF3C4', [['dome', 'dome band'], ['cigar', 'cigar band'], ['knife', 'knife edge'], ['stackers', 'birthstone stackers']]],
  ['clay & wobble', '手捏银戒', '#FFE3EF', [['charm', 'charm-stone band'], ['doodle', 'doodle band'], ['molten', 'molten stackers'], ['puffy', 'puffy heart']]],
  ['rainbow stones', '彩虹宝石', '#E2EEFF', [['confetti', 'confetti band'], ['bezel', 'bezel eternity'], ['baguette', 'rainbow baguettes'], ['toimoi', 'toi et moi']]],
  ['chunky', '雕塑粗戒', '#E4F8E9', [['bombe', 'bombé dome'], ['wave', 'wave band'], ['bubble', 'bubble band'], ['flush', 'flush solitaire']]],
  ['signets', '印章戒', '#EDE6FF', [['pinky', 'pinky signet'], ['boxy', 'box signet'], ['enamel', 'enamel signet'], ['inlay', 'stone inlay']]],
  ['candy', '珐琅果冻', '#FFE6DA', [['vine', 'enamel vine'], ['resin', 'resin block'], ['jellydome', 'jelly dome'], ['stripes', 'enamel stripes']]],
];
function catalogue() {
  return board('ring-catalogue', (ctx) => {
    paper(ctx, '#F7F2E7', 'rgba(40,34,60,.05)');
    const ink = '#1C1830', sub = 'rgba(28,24,48,.62)';
    type(ctx, 'pick your ring', 80, 96, '800 58px "Bricolage Grotesque"', ink, { ls: -2.5 });
    type(ctx, '选一枚戒指', 524, 92, '900 34px "Noto Sans SC"', ink);
    type(ctx, 'six families, twenty-four shapes to start. every one is a real 3D model, not a picture.', W - 80, 76, '400 16px "Special Elite"', sub, { align: 'right' });
    type(ctx, '先做六大类 24 款，都是可以转着看的 3D 模型，之后每类还能继续加。', W - 80, 104, '500 15px "Noto Sans SC"', sub, { align: 'right' });
    FAMILIES.forEach(([en, zh, tint, list], col) => {
      const x = 80 + col * 244;
      type(ctx, en, x + 4, 170, '800 24px "Bricolage Grotesque"', ink, { ls: -0.6 });
      type(ctx, zh, x + 4, 194, '500 14px "Noto Sans SC"', sub, { ls: 1 });
      list.forEach(([id, name], row) => {
        const y = 212 + row * 188;
        pill(ctx, x, y, 236, 180, 18, tint);
        const img = ringShot(id, 236, 150, { catcher: true, shadow: 0.2, pad: 0.74 });
        ctx.drawImage(img, x, y + 2);
        type(ctx, name, x + 14, y + 166, '400 14px "Special Elite"', ink);
      });
    });
    grain(ctx, W, HH, 0.05);
  });
}

function forms() {
  return board('island-forms', (ctx) => {
    paper(ctx, '#F7F2E7', 'rgba(40,34,60,.05)');
    const ink = '#1C1830', sub = 'rgba(28,24,48,.64)';
    type(ctx, 'the island follows the ring', 80, 96, '800 58px "Bricolage Grotesque"', ink, { ls: -2.5 });
    type(ctx, '小岛跟着戒指的形状长', 80, 136, '900 26px "Noto Sans SC"', ink, { ls: 1 });
    const cells = [
      ['bands', '素圈 / 手捏 / 宝石圈', 'the island floats in the middle. the engraving inside stays readable.', '小岛悬浮在戒圈中间，不封口，圈内刻的字看得见。', () => formFloat(false), { az: 0.2, el: 0.46, pad: 0.76, lift: 0.15 }, '#D9EEFF'],
      ['flat tops', '印章戒 / 方戒', 'the flat top is the ground. a big top means a big plaza.', '平的戒面就是地面，戒面越大，地盘越大。', () => formTable(false), { az: 0.1, el: 0.3, pad: 0.86, catcher: true }, '#EDE6FF'],
      ['solitaires', '单颗主石', 'the island is the stone. the prongs hold it.', '小岛就是那颗宝石，被爪镶托着。', () => formStone(false), { az: 0.1, el: 0.26, pad: 0.86, catcher: true }, '#FFE3EF'],
      ['open rings', '开口戒 / 双主石', 'one islet on each end, and a bridge between you.', '两头各一座小岛，中间一座桥。', () => formTwin(false), { az: 0.0, el: 0.24, pad: 0.86, catcher: true }, '#FFF3C4'],
    ];
    cells.forEach(([en, zh, line, lineZh, make, cam, tint], i) => {
      const x = 80 + (i % 2) * 728, y = 168 + Math.floor(i / 2) * 404;
      pill(ctx, x, y, 712, 388, 22, tint);
      const scene = stage(false), s = make(); scene.add(s);
      ctx.drawImage(shoot(scene, s, { w: 440, h: 388, ...cam }), x + 272, y);
      type(ctx, en, x + 26, y + 62, '800 36px "Bricolage Grotesque"', ink, { ls: -1.2 });
      type(ctx, zh, x + 26, y + 92, '500 15px "Noto Sans SC"', sub, { ls: 1 });
      const wrap = (str, font, yy, lh, max) => { ctx.font = font; let cur = '', n = 0; const parts = /[一-鿿]/.test(str) ? [...str] : str.split(' '), join = /[一-鿿]/.test(str) ? '' : ' '; for (const p of parts) { const t = cur ? cur + join + p : p; if (ctx.measureText(t).width > max) { type(ctx, cur, x + 26, yy + n * lh, font, ink); cur = p; n++; } else cur = t; } type(ctx, cur, x + 26, yy + n * lh, font, ink); return n + 1; };
      const n = wrap(line, '400 17px "Special Elite"', y + 250, 25, 250);
      wrap(lineZh, '500 15px "Noto Sans SC"', y + 250 + n * 25 + 14, 24, 240);
    });
    grain(ctx, W, HH, 0.05);
  });
}

const BOARDS = { day: () => cover(false), night: () => cover(true), rings: catalogue, forms };

async function main() {
  const status = document.getElementById('status'), host = document.getElementById('boards');
  const zh = ZH + '选一枚戒指，它会长出一座岛，把回忆放进去。开始做戒指中文夜间白天（跟随系统时间）先做六大类款都是可以转着看的模型之后每类还能继续加经典素圈手捏银戒彩虹宝石雕塑粗印章珐琅果冻小岛跟着形状长悬浮在戒圈中间不封口内刻字得见平面就地越大盘那颗被爪镶托两头各座桥单主石开口双/方';
  await Promise.all([...['800 100px "Bricolage Grotesque"', '400 19px "Special Elite"', '400 52px "Nanum Pen Script"', '600 13px "Hanken Grotesk"'].map((s) => document.fonts.load(s, 'a ring RINGCAY 0614')), ...['900 44px "Noto Sans SC"', '500 16px "Noto Sans SC"'].map((s) => document.fonts.load(s, zh))]).catch(() => {});
  const saved = [];
  for (const key of Object.keys(BOARDS)) {
    if (only && only !== key) continue;
    status.textContent = 'rendering ' + key + '…';
    await new Promise((r) => setTimeout(r, 30));
    const b = BOARDS[key]();
    const img = new Image(); img.src = b.canvas.toDataURL('image/jpeg', 0.93); img.alt = b.id; host.appendChild(img);
    const blob = await new Promise((r) => b.canvas.toBlob(r, 'image/jpeg', 0.93));
    try { const res = await fetch('/save/v2-' + b.id + '.jpg', { method: 'POST', body: blob }); saved.push(b.id + ':' + res.status); } catch (e) { saved.push(b.id + ':failed'); }
  }
  status.textContent = 'done · ' + saved.join(' · ');
  window.labDone = saved;
}
main().catch((e) => { document.getElementById('status').textContent = 'error: ' + e.message; window.labError = String(e.stack || e); console.error(e); });
