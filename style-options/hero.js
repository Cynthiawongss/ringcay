// Homepage illustration, day. One ring floating over a sunlit table; inside it, an island where a couple's bench
// and a friends' long table each point to the photo and the story they hold.
// A picture only: the app does not load this file. Open hero.html through server.py; the result is saved to out/.
import * as THREE from 'three';
import { TAU, RI, TOP, bump, band, metal, gem, gemMat, seat, collar, sweep, M, paint, pieces } from './kit.js';

const K = Number(new URLSearchParams(location.search).get('scale')) === 2 ? 2 : 1;   // ?scale=2 exports 3840×2160
const W = 1920, H = 1080, SS = K === 2 ? 1.5 : 2;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.NeutralToneMapping;
function studio() {
  const sc = new THREE.Scene(), geo = new THREE.SphereGeometry(20, 64, 32), col = [], top = new THREE.Color('#FFFFFF'), mid = new THREE.Color('#E6DFD4'), low = new THREE.Color('#4E4A46');
  for (let i = 0; i < geo.attributes.position.count; i++) { const y = geo.attributes.position.getY(i) / 20, c = y > 0 ? mid.clone().lerp(top, Math.min(1, y * 1.6)) : mid.clone().lerp(low, Math.min(1, -y * 2.2)); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  sc.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const box = (w, h, color, pos) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); sc.add(m); };
  box(14, 6, '#FFFFFF', [-9, 12, 6]); box(10, 4, '#FFF6E8', [12, 6, 8]); box(40, 3, '#3F3B38', [0, 0.5, -18]); box(40, 2.2, '#3F3B38', [0, -0.5, 18]); box(4, 12, '#FFFFFF', [-6, 5, 17]); box(4, 12, '#FFFFFF', [7, 5, 16]);
  return new THREE.PMREMGenerator(renderer).fromScene(sc, 0.02).texture;
}
const ENV = studio();

let seedN = 7;
const rnd = () => ((seedN = (seedN * 16807) % 2147483647) / 2147483647);
const reseed = (n) => { seedN = n; };
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ---------- engraving on the inside of the band ----------
function engraving(text, { width, v = 0.8, px = 66 }) {
  const cw = 2048, ch = 256, sq = (cw * width) / (ch * TAU * RI);
  const cm = canvas(cw, ch), cb = canvas(cw, ch), m = cm.getContext('2d'), b = cb.getContext('2d');
  for (const [x, ink] of [[m, 'rgba(52,50,62,.78)'], [b, '#000']]) {
    x.fillStyle = '#fff'; x.fillRect(0, 0, cw, ch);
    const cx = ((0.75 - -Math.PI / 2 / TAU) % 1 + 1) % 1 * cw;
    for (const dx of [-cw, 0, cw]) {
      x.save(); x.translate(cx + dx, ch * (1 - v)); x.scale(-sq, 1);
      x.font = `italic 400 ${px}px "Instrument Serif"`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.letterSpacing = '3px'; x.fillStyle = ink;
      x.fillText(text, 0, 0); x.restore();
    }
  }
  const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { map: tex(cm, true), bumpMap: tex(cb, false), bumpScale: 1.2 };
}

// ---------- the vine engraved round the outside ----------
function vine() {
  const cw = 4096, ch = 256, cm = canvas(cw, ch), cb = canvas(cw, ch), m = cm.getContext('2d'), b = cb.getContext('2d');
  for (const [x, ink] of [[m, 'rgba(70,66,74,.4)'], [b, '#000']]) {
    x.fillStyle = '#fff'; x.fillRect(0, 0, cw, ch); x.strokeStyle = ink; x.fillStyle = ink; x.lineWidth = 3.5; x.lineCap = 'round';
    const yAt = (u) => ch * 0.5 + Math.sin(u * TAU * 26) * ch * 0.1;
    x.beginPath(); for (let i = 0; i <= 1200; i++) { const u = i / 1200; x[i ? 'lineTo' : 'moveTo'](u * cw, yAt(u)); } x.stroke();
    for (let k = 0; k < 104; k++) { const u = (k + 0.5) / 104, px = u * cw, py = yAt(u), up = k % 2 ? 1 : -1; x.save(); x.translate(px, py); x.rotate(up * 0.7 - 0.2); x.beginPath(); x.ellipse(0, up * -15, 5.5, 14, 0, 0, TAU); x.fill(); x.restore(); }
  }
  const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { map: tex(cm, true), bump: tex(cb, false), depth: 0.9 };
}

// ---------- small things, at one consistent miniature scale (a seated person is about 0.2 tall) ----------
const WOOD = '#C89B6D', IRON = '#3A3A42', CLOTH = '#FFFDF8';
const B = (w, h, d, mat, x, y, z) => M(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
const C = (r1, r2, h, mat, x, y, z, seg = 10) => M(new THREE.CylinderGeometry(r1, r2, h, seg), mat, x, y, z);

function person({ shirt, pants = '#3E4C66', hair = '#3B2A22', skin = '#E2B48E', lean = 0, sit = true }) {
  const g = new THREE.Group(), T = paint(shirt, { roughness: 0.9 }), P = paint(pants), S = paint(skin, { roughness: 0.7 }), Hm = paint(hair);
  if (sit) {
    for (const s of [-1, 1]) { const th = M(new THREE.CapsuleGeometry(0.0095, 0.04, 3, 8), P, s * 0.011, 0.088, 0.024); th.rotation.x = Math.PI / 2; const sh = M(new THREE.CapsuleGeometry(0.0085, 0.06, 3, 8), P, s * 0.011, 0.046, 0.05); g.add(th, sh); }
    const up = new THREE.Group(); up.position.y = 0.09; up.rotation.z = lean; g.add(up);
    up.add(M(new THREE.CapsuleGeometry(0.017, 0.042, 4, 12), T, 0, 0.045, -0.004));
    for (const s of [-1, 1]) { const a = M(new THREE.CapsuleGeometry(0.0075, 0.04, 3, 8), T, s * 0.025, 0.04, 0.012); a.rotation.x = -0.7; up.add(a); }
    up.add(M(new THREE.SphereGeometry(0.0165, 18, 14), S, 0, 0.1, 0));
    const hr = M(new THREE.SphereGeometry(0.0174, 18, 14, 0, TAU, 0, Math.PI * 0.6), Hm, 0, 0.102, -0.003); hr.rotation.x = -0.35; up.add(hr);
  } else {
    for (const s of [-1, 1]) g.add(M(new THREE.CapsuleGeometry(0.009, 0.07, 3, 8), P, s * 0.011, 0.045, 0));
    g.add(M(new THREE.CapsuleGeometry(0.02, 0.045, 4, 12), T, 0, 0.125, 0));
    g.add(M(new THREE.SphereGeometry(0.018, 18, 14), S, 0, 0.185, 0));
    const hr = M(new THREE.SphereGeometry(0.0188, 18, 14, 0, TAU, 0, Math.PI * 0.58), Hm, 0, 0.187, -0.003); hr.rotation.x = -0.35; g.add(hr);
  }
  return g;
}
function chair(color) {
  const g = new THREE.Group(), m = paint(color), legs = paint(color, { roughness: 0.7 });
  g.add(B(0.084, 0.01, 0.08, m, 0, 0.074, 0), B(0.084, 0.06, 0.009, m, 0, 0.11, -0.037));
  for (const x of [-0.036, 0.036]) for (const z of [-0.034, 0.034]) g.add(C(0.0045, 0.0045, 0.074, legs, x, 0.037, z, 6));
  return g;
}
// The friends' table: six mismatched chairs, five of them taken, lunch, and a string of lights overhead.
function longTable() {
  const g = new THREE.Group(), wood = paint(WOOD), white = paint(CLOTH, { roughness: 0.6 });
  g.add(B(0.6, 0.014, 0.17, wood, 0, 0.105, 0));
  for (const x of [-0.27, 0.27]) for (const z of [-0.065, 0.065]) g.add(C(0.006, 0.006, 0.1, wood, x, 0.05, z, 6));
  g.add(B(0.54, 0.003, 0.075, paint('#F4F1EA'), 0, 0.1135, 0));
  [-0.2, 0, 0.2].forEach((x, i) => {
    for (const z of [-0.05, 0.05]) g.add(C(0.022, 0.02, 0.004, white, x + (z > 0 ? 0.02 : -0.02), 0.115, z, 18));
    g.add(C(0.006, 0.005, 0.03, paint(i === 1 ? '#3E7A4E' : '#E9F2F4', { roughness: 0.2 }), x + 0.08, 0.13, 0.0, 8));
  });
  g.add(C(0.032, 0.03, 0.012, paint('#E9A23B'), -0.1, 0.12, 0.0, 18), C(0.03, 0.028, 0.012, paint('#D4553F'), 0.11, 0.12, -0.005, 18));
  const vase = C(0.008, 0.01, 0.03, paint('#F3F0E8', { roughness: 0.3 }), 0.0, 0.13, 0.0, 10); g.add(vase);
  [['#F7A6B8', 0, 0], ['#FFFFFF', 0.008, 0.004], ['#F6D365', -0.007, -0.004]].forEach(([c, x, z]) => g.add(M(new THREE.SphereGeometry(0.008, 10, 8), paint(c), x, 0.152, z)));
  const seats = [[-0.2, -0.125, 0, '#9DBF9E'], [0, -0.125, 0, '#F2C94C'], [0.2, -0.125, 0, '#FFFFFF'], [-0.2, 0.125, Math.PI, '#6C9BD2'], [0, 0.125, Math.PI, '#E98FA0'], [0.2, 0.125, Math.PI, '#E9E2D4']];
  const folks = [{ shirt: '#F5F1E8', hair: '#2A211C' }, { shirt: '#5C8FD6', hair: '#8A5A3B', skin: '#C98F67' }, { shirt: '#E7795B', hair: '#1E1A18', skin: '#8D5B3E' }, { shirt: '#F2D16B', hair: '#C9A27A' }, { shirt: '#5E8C61', hair: '#2E221D', skin: '#D9A27D' }];
  seats.forEach(([x, z, r, c], i) => { const ch = chair(c); ch.position.set(x, 0, z); ch.rotation.y = r; if (folks[i]) ch.add(person({ ...folks[i], lean: (i % 2 ? 0.06 : -0.05) })); g.add(ch); });
  const post = paint(IRON), bulb = new THREE.MeshStandardMaterial({ color: '#FFF4D6', emissive: '#FFD98A', emissiveIntensity: 0.5, roughness: 0.4 });
  for (const x of [-0.36, 0.36]) g.add(C(0.0045, 0.006, 0.44, post, x, 0.22, -0.02, 6));
  const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push(new THREE.Vector3(-0.36 + u * 0.72, 0.43 - 0.075 * Math.sin(Math.PI * u), -0.02)); }
  const curve = new THREE.CatmullRomCurve3(pts); g.add(M(new THREE.TubeGeometry(curve, 48, 0.0016, 5), post));
  for (let i = 1; i < 12; i++) { const p = curve.getPoint(i / 12); const b = M(new THREE.SphereGeometry(0.009, 10, 8), bulb, p.x, p.y - 0.012, p.z); b.castShadow = false; g.add(b); }
  return g;
}
// The couple's bench: two people sitting close, two cups, a blanket.
function bench() {
  const g = new THREE.Group(), wood = paint(WOOD), iron = paint(IRON);
  for (const z of [-0.022, 0, 0.022]) g.add(B(0.24, 0.007, 0.018, wood, 0, 0.07, z));
  [0.1, 0.128].forEach((y) => { const s = B(0.24, 0.018, 0.006, wood, 0, y, -0.036); s.rotation.x = -0.18; g.add(s); });
  for (const x of [-0.105, 0.105]) { g.add(B(0.008, 0.07, 0.008, iron, x, 0.035, 0.02), B(0.008, 0.14, 0.008, iron, x, 0.07, -0.032), B(0.008, 0.006, 0.06, iron, x, 0.09, 0)); }
  g.add(C(0.009, 0.008, 0.017, paint('#FFFFFF', { roughness: 0.4 }), 0.09, 0.083, 0.012, 12), C(0.009, 0.008, 0.017, paint('#F2C94C', { roughness: 0.4 }), 0.072, 0.083, -0.006, 12));
  g.add(B(0.05, 0.012, 0.04, paint('#C7824E'), -0.088, 0.08, 0.0));
  g.add(person({ shirt: '#F3EEE4', pants: '#56657F', hair: '#3A2A20', lean: -0.16 }).translateX(-0.03));
  g.add(person({ shirt: '#7FA6D8', pants: '#2F3646', hair: '#1F1915', skin: '#C9926B', lean: 0.13 }).translateX(0.024));
  return g;
}
function tree(size = 1, greens = ['#5E9E4F', '#7DB85A', '#4C8A45', '#9CC56A'], seed = 3) {
  reseed(seed);
  const g = new THREE.Group(), trunk = M(new THREE.CylinderGeometry(0.011, 0.02, 0.3, 7), paint('#7E5A40'), 0.01, 0.15, 0); trunk.rotation.z = -0.08; g.add(trunk);
  for (let i = 0; i < 18; i++) {
    const a = rnd() * TAU, r = Math.sqrt(rnd()) * 0.15, y = 0.36 + (rnd() - 0.3) * 0.16;
    const b = M(new THREE.IcosahedronGeometry(0.045 + rnd() * 0.045, 1), paint(greens[i % greens.length], { flatShading: true }), Math.cos(a) * r, y, Math.sin(a) * r * 0.9);
    b.scale.y = 0.82; b.rotation.set(rnd() * 3, rnd() * 3, 0); g.add(b);
  }
  g.scale.setScalar(size); return g;
}
function cypress(h = 1, color = '#3F7F4A') { const g = new THREE.Group(); g.add(C(0.012, 0.016, 0.08, paint('#7E5A40'), 0, 0.04, 0, 6)); const pts = [[0.001, 0.06], [0.06, 0.16], [0.07, 0.34], [0.052, 0.56], [0.022, 0.74], [0.001, 0.8]].map(([x, y]) => new THREE.Vector2(x, y)); g.add(M(new THREE.LatheGeometry(pts, 14), paint(color))); g.scale.set(1, h, 1); return g; }
function flowers(colors, n = 9, seed = 1) { reseed(seed); const g = new THREE.Group(); for (let i = 0; i < n; i++) { const a = rnd() * TAU, r = rnd() * 0.06; g.add(M(new THREE.SphereGeometry(0.009 + rnd() * 0.006, 8, 6), paint(colors[i % colors.length]), Math.cos(a) * r, 0.018 + rnd() * 0.02, Math.sin(a) * r)); if (i % 2) g.add(M(new THREE.IcosahedronGeometry(0.018, 0), paint('#5E9E4F', { flatShading: true }), Math.cos(a + 1) * r, 0.01, Math.sin(a + 1) * r)); } return g; }
function stones(path) { const g = new THREE.Group(), m = paint('#EFE9DF'); path.forEach(([x, z], i) => { const s = M(new THREE.CylinderGeometry(0.03 + (i % 3) * 0.006, 0.032 + (i % 3) * 0.006, 0.008, 9), m, x, 0.004, z); s.rotation.y = i; g.add(s); }); return g; }
function hedge(len = 1, seed = 0) { reseed(40 + seed); const g = new THREE.Group(); const n = Math.round(9 * len); for (let i = 0; i < n; i++) { const b = M(new THREE.IcosahedronGeometry(0.05 + rnd() * 0.02, 1), paint(['#4F8B47', '#5E9E4F', '#6BA857'][i % 3], { flatShading: true }), (i / (n - 1) - 0.5) * 0.5 * len, 0.05 + rnd() * 0.02, (rnd() - 0.5) * 0.03); b.scale.y = 0.9; g.add(b); } return g; }
function lavender(seed = 0) { reseed(60 + seed); const g = new THREE.Group(); for (let i = 0; i < 7; i++) { const x = (i - 3) * 0.035, s = M(new THREE.ConeGeometry(0.014, 0.07, 5), paint(i % 2 ? '#9B86D6' : '#8A73C9'), x, 0.04 + rnd() * 0.01, (rnd() - 0.5) * 0.02); g.add(s); g.add(M(new THREE.IcosahedronGeometry(0.02, 0), paint('#6E9A5E', { flatShading: true }), x, 0.012, 0)); } return g; }
function mailbox() { const g = new THREE.Group(); g.add(C(0.005, 0.005, 0.1, paint('#FFFDF8'), 0, 0.05, 0, 6), B(0.034, 0.03, 0.05, paint('#4A78C2'), 0, 0.11, 0)); return g; }
function pots() { const g = new THREE.Group(); [[-0.03, 0], [0.03, 0.01]].forEach(([x, z], i) => { g.add(C(0.016, 0.012, 0.028, paint('#D98C64'), x, 0.014, z, 10)); g.add(M(new THREE.IcosahedronGeometry(0.024 - i * 0.004, 1), paint('#5E9E4F', { flatShading: true }), x, 0.045, z)); }); return g; }

// ---------- the ring and its island ----------
function ground({ R, crystal, depth }) {
  const g = new THREE.Group(), g1 = new THREE.Color('#7AA455'), g2 = new THREE.Color('#548545'), e1 = new THREE.Color('#B98560'), e2 = new THREE.Color('#8E6146'), tmp = new THREE.Color();
  const hgt = (a, r) => 0.02 * Math.sin(2 * a + 0.4) * (r / R) + 0.015 * Math.sin(3 * a + r * 2.1) * (r / R) + 0.03 * Math.exp(-Math.pow(r / (R * 0.6), 2));
  const edge = (a) => R * (1 + 0.04 * Math.sin(3 * a + 0.7) + 0.03 * Math.sin(5 * a + 2.1) + 0.015 * Math.sin(9 * a));
  const top = M(sweep(120, (a) => { const E = edge(a); return [[0.001, hgt(a, 0), 'g'], [E * 0.3, hgt(a, E * 0.3), 'g'], [E * 0.6, hgt(a, E * 0.6), 'g'], [E * 0.85, hgt(a, E * 0.85), 'g'], [E * 0.97, hgt(a, E) - 0.01, 'g'], [E, -0.06, 'rim'], [E * 0.98, -0.16, 'e1'], [E * 0.9, -0.3, 'e2']]; },
    { flip: true, color: (tag, a, r) => (tag === 'e1' ? e1 : tag === 'e2' ? e2 : tag === 'rim' ? tmp.copy(g2).multiplyScalar(0.85) : tmp.copy(g1).lerp(g2, 0.5 + 0.5 * Math.sin(5 * a + r * 3.1) * Math.cos(2 * a - r))) }),
  new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97, envMapIntensity: 0.3 }));
  g.add(top);
  const cm = gemMat(crystal, { glow: 0.22 });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(R * 0.86, depth, 9, 1).rotateX(Math.PI), cm); cone.position.y = -0.3 - depth / 2; cone.castShadow = true;
  const girdle = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.86, R * 0.86, 0.08, 9), cm); girdle.position.y = -0.3;
  g.add(cone, girdle);
  g.userData.put = (obj, a, r, { s = 1 } = {}) => { obj.position.set(Math.cos(a) * r, hgt(a, r), Math.sin(a) * r); obj.scale.setScalar(s); g.add(obj); return obj; };
  return g;
}
const ANCHORS = {};
function build() {
  const all = new THREE.Group(), bandW = 0.82;
  // Not a plain band: it swells at the front to hold an aquamarine, carries a small stone for each friend,
  // a hand-engraved olive vine all the way round, and beaded (milgrain) edges.
  const outer = metal('silver', vine(), { roughness: 0.12, envMapIntensity: 1.7 }), inner = metal('silver', null, { roughness: 0.16, envMapIntensity: 1.5, ...engraving('the long way home', { width: bandW }) });
  const R = band({ profile: 'dome', w: (th) => bandW + 0.2 * bump(th, 0.62), t: (th) => 0.27 + 0.1 * bump(th, 0.55), mats: [outer, inner] });
  const ring = new THREE.Group(); ring.add(R.mesh);
  const bead = new THREE.InstancedMesh(new THREE.SphereGeometry(0.021, 10, 8), metal('silver', null, { roughness: 0.18 }), 2 * 300), m4 = new THREE.Matrix4();
  for (let i = 0; i < 300; i++) for (const [k, v] of [[0, 0.035], [1, 0.965]]) { const th = (i / 300) * TAU, r = R.rOut(th, v) + 0.004; m4.makeTranslation(Math.cos(th) * r, R.yAt(th, v), Math.sin(th) * r); bead.setMatrixAt(i * 2 + k, m4); }
  bead.castShadow = true; ring.add(bead);
  const setting = (size, color) => { const g = new THREE.Group(), c = collar(size * 0.9, 'silver', 0.07), s = gem('round', size, color); c.material = metal('silver', null, { roughness: 0.1, envMapIntensity: 2.2 }); s.position.z = 0.025; g.add(c, s); return g; };
  const st = setting(0.2, '#86D3E6');
  seat(ring, R, st, TOP, { lift: 0.0 });
  [['#F7A6B8', 0.36, 0.09], ['#F6D365', 0.62, 0.075], ['#B9A7E8', 0.86, 0.065]].forEach(([c, d, size], i) => {
    for (const sgn of (i === 2 ? [-1] : [-1, 1])) { const col = sgn < 0 ? c : ['#9FD8B0', '#FFB38A', '#F7A6B8'][i]; seat(ring, R, setting(size, col), TOP + sgn * d, { lift: -0.01, v: 0.5 }); }
  });
  all.add(ring);

  const IR = 1.44, isl = ground({ R: IR, crystal: '#86D3E6', depth: 0.8 });
  isl.position.y = 0.06; all.add(isl);
  const put = (obj, x, z, rotY = 0, s = 1) => { isl.userData.put(obj, Math.atan2(z, x), Math.hypot(x, z), { s }); obj.rotation.y = rotY; return obj; };
  const P = pieces(false);

  put(P.house(0.44, 0.3, 0.34, { roof: '#C96F55', door: '#4A78C2', wall: '#FFFDF8' }), -0.78, -0.5, 0.42);
  put(pots(), -0.6, -0.26, 0.4);
  put(mailbox(), -0.36, -0.3, 0.3);
  put(tree(1.25, undefined, 4), 0.78, -0.5);
  put(tree(1.0, ['#6FA855', '#8CC062', '#5A9548', '#A8CC72'], 9), 1.12, 0.12);
  put(cypress(1.0), -1.12, -0.12); put(cypress(0.8), -1.08, -0.5); put(cypress(0.9), 1.18, -0.42);
  const T = put(longTable(), 0.28, -0.12, -0.12, 1.12);
  put(tree(1.1, ['#5E9E4F', '#7DB85A', '#4C8A45', '#9CC56A'], 12), -0.98, 0.3);
  const Bn = put(bench(), -0.62, 0.42, 1.0, 1.12);
  put(P.pond(0.24), 0.5, 0.72);
  const yard = M(new THREE.CircleGeometry(0.5, 40).rotateX(-Math.PI / 2), paint('#ECE2CF', { roughness: 1 })); yard.scale.set(1.25, 1, 0.8); put(yard, 0.28, -0.12).position.y += 0.006;
  [[-0.2, -0.95, 1.0], [0.1, -1.05, 0.9], [1.0, -0.62, 0.8], [-1.25, 0.1, 0.8], [1.25, 0.4, 0.7]].forEach(([x, z, s], i) => put(hedge(s, i), x, z, Math.atan2(x, z)));
  [[0.78, 0.98], [0.95, 0.85], [1.08, 0.7]].forEach(([x, z], i) => put(lavender(i), x, z, 0.6));
  put(tree(0.7, undefined, 23), 0.18, 1.06);
  put(stones([[-0.6, -0.3], [-0.52, -0.16], [-0.42, -0.02], [-0.3, 0.1], [-0.2, 0.2], [-0.04, 0.2], [0.1, 0.24], [-0.42, 0.24]]), 0, 0);
  [[-0.22, -0.6, ['#F7A6B8', '#FFFFFF']], [0.1, -0.62, ['#F6D365', '#FFFFFF']], [-0.3, 0.72, ['#F7A6B8', '#F6D365']], [0.9, 0.42, ['#FFFFFF', '#B9A7E8']], [1.05, -0.3, ['#F7A6B8', '#FFFFFF']], [0.12, 0.62, ['#FFFFFF', '#F6D365']]].forEach(([x, z, c], i) => put(flowers(c, 9, i + 2), x, z));
  for (let k = 0; k < 14; k++) { const a = k * 2.399963 + 0.4, rr = IR * 0.9; put(P.rock('#F1EBE0', k), Math.cos(a) * rr, Math.sin(a) * rr, k, 0.26 + (k % 3) * 0.06); }

  all.rotation.x = 0.09;
  all.updateMatrixWorld(true);
  const wp = (o, dy = 0) => o.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, dy, 0));
  ANCHORS.bench = wp(Bn, 0.16); ANCHORS.table = wp(T, 0.2); ANCHORS.stone = wp(st, 0); ANCHORS.engraving = new THREE.Vector3(0, R.yAt(-Math.PI / 2, 1.04), -RI).applyMatrix4(all.matrixWorld);
  ANCHORS.benchObj = Bn; ANCHORS.tableObj = T;
  return all;
}

function stage() {
  const scene = new THREE.Scene();
  scene.environment = ENV; scene.environmentIntensity = 0.95;
  scene.add(new THREE.HemisphereLight('#EAF3FF', '#EBD9BF', 0.85));
  const sun = new THREE.DirectionalLight('#FFE7C6', 3.4);
  sun.position.set(-7, 11, 3.5).multiplyScalar(1.4);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 50 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 6;
  scene.add(sun, sun.target);
  return scene;
}

function render(scene, cam, w, h, exposure = 1.04, k = 1) {
  renderer.setSize(w * SS * k, h * SS * k, false);
  renderer.toneMappingExposure = exposure;
  renderer.render(scene, cam);
  const out = canvas(w * k, h * k); out.getContext('2d').drawImage(renderer.domElement, 0, 0, w * k, h * k);
  return out;
}
const toScreen = (v, cam, w, h) => { const p = v.clone().project(cam); return [((p.x + 1) / 2) * w, ((1 - p.y) / 2) * h]; };

// ---------- 2D ----------
function type(ctx, str, x, y, font, color, { align = 'left', ls = 0 } = {}) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.letterSpacing = ls + 'px';
  ctx.fillText(str, x, y); const w = ctx.measureText(str).width; ctx.letterSpacing = '0px'; return w;
}
function grain(ctx, w, h, amount) {
  const n = canvas(w / 2, h / 2), x = n.getContext('2d'), d = x.createImageData(n.width, n.height);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = amount * 255; }
  x.putImageData(d, 0, 0); ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(n, 0, 0, w, h); ctx.restore();
}
// Dappled shade from a tree out of frame: the kind of window light that makes a table photo feel like an afternoon.
function leafShade(w, h, clusters, seed = 11) {
  reseed(seed);
  const c = canvas(w, h), x = c.getContext('2d'); x.fillStyle = '#3B4C66'; x.strokeStyle = '#3B4C66'; x.lineCap = 'round';
  for (const [cx, cy, R, n] of clusters) {
    for (let k = 0; k < 3; k++) { x.lineWidth = 6 + rnd() * 6; x.beginPath(); x.moveTo(cx + (rnd() - 0.5) * R * 2.4, cy - R * 1.4); x.quadraticCurveTo(cx + (rnd() - 0.5) * R, cy, cx + (rnd() - 0.5) * R * 2.4, cy + R * 1.4); x.stroke(); }
    for (let i = 0; i < n; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R, s = 12 + rnd() * 22; x.beginPath(); x.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s, s * 0.42, rnd() * TAU, 0, TAU); x.fill(); }
  }
  return c;
}
function photoBack(w, h, warm = 0) {
  const c = canvas(w, h), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#9FD2F2'); g.addColorStop(0.55, '#D7ECF6'); g.addColorStop(1, '#F6EEDC'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  reseed(31 + warm); for (let i = 0; i < 14; i++) { const r = 10 + rnd() * 30, gx = x.createRadialGradient(0, 0, 0, 0, 0, r); gx.addColorStop(0, 'rgba(255,250,235,.55)'); gx.addColorStop(1, 'rgba(255,250,235,0)'); x.save(); x.translate(rnd() * w, rnd() * h * 0.6); x.fillStyle = gx; x.fillRect(-r, -r, r * 2, r * 2); x.restore(); }
  return c;
}
function grade(x, w, h) {
  x.save(); x.globalCompositeOperation = 'soft-light'; x.fillStyle = 'rgba(255,170,90,.22)'; x.fillRect(0, 0, w, h); x.restore();
  const v = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,24,10,.28)'); x.fillStyle = v; x.fillRect(0, 0, w, h);
}
// A close photo of one piece, as if it were the picture stored in it.
function closeUp(scene, obj, offset, lookDy, { w = 560 * K, h = 560 * K, fov = 30, focus = 0.55 } = {}) {
  const t = obj.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, lookDy, 0));
  const cam = new THREE.PerspectiveCamera(fov, w / h, 0.02, 100); cam.position.copy(t).add(offset); cam.lookAt(t);
  const shot = render(scene, cam, w, h, 1.08), c = canvas(w, h), x = c.getContext('2d');
  x.drawImage(photoBack(w, h), 0, 0); x.drawImage(shot, 0, 0);
  const soft = canvas(w, h), sx = soft.getContext('2d'); sx.filter = 'blur(7px)'; sx.drawImage(c, 0, 0); sx.filter = 'none';
  const mask = sx.createLinearGradient(0, 0, 0, h); mask.addColorStop(0, 'rgba(0,0,0,1)'); mask.addColorStop(focus - 0.2, 'rgba(0,0,0,0)'); mask.addColorStop(focus + 0.16, 'rgba(0,0,0,0)'); mask.addColorStop(1, 'rgba(0,0,0,1)');
  sx.globalCompositeOperation = 'destination-in'; sx.fillStyle = mask; sx.fillRect(0, 0, w, h); x.drawImage(soft, 0, 0);
  grade(x, w, h); grain(x, w, h, 0.05);
  return c;
}
function polaroid(ctx, img, x, y, size, rot, lines) {
  const pad = size * 0.06, bottom = size * 0.3, fw = size + pad * 2, fh = size + pad + bottom;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(46,36,24,.22)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 14; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-fw / 2, -fh / 2, fw, fh); ctx.shadowColor = 'transparent';
  ctx.drawImage(img, -size / 2, -fh / 2 + pad, size, size);
  lines.forEach(([str, font, color], i) => type(ctx, str, -size / 2 + 4, -fh / 2 + pad + size + bottom * (i ? 0.78 : 0.44), font, color));
  ctx.restore();
  return { w: fw, h: fh };
}
function callout(ctx, [ax, ay], [bx, by], bend = 0.18) {
  const mx = (ax + bx) / 2 - (by - ay) * bend, my = (ay + by) / 2 + (bx - ax) * bend;
  ctx.save(); ctx.strokeStyle = 'rgba(30,28,40,.72)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, bx, by); ctx.stroke();
  ctx.beginPath(); ctx.arc(ax, ay, 6, 0, TAU); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(ax, ay, 2.2, 0, TAU); ctx.fillStyle = 'rgba(30,28,40,.85)'; ctx.fill(); ctx.restore();
}
function logo(ctx, x, y, s, ink) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 40, s / 40);
  ctx.strokeStyle = ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(20, 23, 15, 9.5, 0, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#FF4FA3'; ctx.fill(new Path2D('M20 18.5c-5.2-4.8-10 1.2 0 7.8 10-6.6 5.2-12.6 0-7.8z')); ctx.restore();
}

async function main() {
  await Promise.all(['800 40px "Bricolage Grotesque"', '600 40px "Bricolage Grotesque"', '400 20px "Hanken Grotesk"', '600 20px "Hanken Grotesk"', 'italic 400 40px "Instrument Serif"', '400 40px "Nanum Pen Script"', '500 20px "Noto Sans SC"', '400 20px "Special Elite"'].map((f) => document.fonts.load(f, 'ringcay 戒指')));
  const scene = stage(), subject = build(); scene.add(subject);
  const bb = new THREE.Box3().setFromObject(subject);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ color: '#3B3226', opacity: 0.16 }));
  floor.position.y = bb.min.y - 0.45; floor.receiveShadow = true; scene.add(floor);

  // the main view
  const RW = 1280, RH = 1040, ox = 560, oy = 70;
  const cam = new THREE.PerspectiveCamera(25, RW / RH, 0.1, 200);
  const c = bb.getCenter(new THREE.Vector3()); c.y -= 0.3;
  const az = 0.2, el = 0.6, dist = 11.4;
  cam.position.set(c.x + dist * Math.cos(el) * Math.sin(az), c.y + dist * Math.sin(el), c.z + dist * Math.cos(el) * Math.cos(az)); cam.lookAt(c);
  const main3d = render(scene, cam, RW, RH, 1.04, K);
  const at = (k) => { const [x, y] = toScreen(ANCHORS[k], cam, RW, RH); return [x + ox, y + oy]; };

  // the photos the pieces hold
  const benchPic = closeUp(scene, ANCHORS.benchObj, new THREE.Vector3(0.95, 0.62, 1.1), 0.05, { fov: 24, focus: 0.58 });
  const tablePic = closeUp(scene, ANCHORS.tableObj, new THREE.Vector3(-0.55, 0.85, 1.3), 0.08, { fov: 24, focus: 0.56 });

  const out = canvas(W * K, H * K), ctx = out.getContext('2d'); ctx.scale(K, K);
  const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#FFFCF6'); bg.addColorStop(1, '#F6F1E8'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(main3d, ox, oy, RW, RH);
  const shade = leafShade(W, H, [[1760, 120, 170, 70], [1560, 40, 120, 40], [120, 980, 150, 50], [1880, 640, 110, 34]]);
  ctx.save(); ctx.filter = 'blur(10px)'; ctx.globalAlpha = 0.16; ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(shade, 0, 0); ctx.restore();
  const sunWash = ctx.createRadialGradient(300, 120, 0, 300, 120, 900); sunWash.addColorStop(0, 'rgba(255,236,200,.35)'); sunWash.addColorStop(1, 'rgba(255,236,200,0)'); ctx.fillStyle = sunWash; ctx.fillRect(0, 0, W, H);

  const INK = '#1C1830', SUB = 'rgba(28,24,48,.62)', HAND = '400 40px "Nanum Pen Script"', HAND_S = '400 32px "Nanum Pen Script"', TYPER = '400 15px "Special Elite"';

  // the couple's bench → their photo
  const bp = [400, 832], bs = polaroid(ctx, benchPic, bp[0], bp[1], 300, -0.05, [['the night we missed the bus', HAND_S, INK], ['THE BENCH  ·  YOU & ME', TYPER, SUB]]);
  callout(ctx, at('bench'), [bp[0] + bs.w / 2 - 8, bp[1] - 90], -0.14);
  // the friends' table → their photo
  const tp = [1716, 300], ts = polaroid(ctx, tablePic, tp[0], tp[1], 300, 0.045, [['sundays at noor’s', HAND, INK], ['THE LONG TABLE  ·  THE FIVE OF US', TYPER, SUB]]);
  callout(ctx, at('table'), [tp[0] - ts.w / 2 + 12, tp[1] + 90], 0.12);
  // the engraving
  const ep = [880, 104];
  type(ctx, 'ENGRAVED INSIDE', ep[0], ep[1], '600 13px "Hanken Grotesk"', SUB, { ls: 2.4 });
  type(ctx, '“the long way home”', ep[0], ep[1] + 46, 'italic 400 40px "Instrument Serif"', INK);
  type(ctx, 'what you said on the walk back.', ep[0], ep[1] + 84, HAND_S, SUB);
  callout(ctx, at('engraving'), [ep[0] + 150, ep[1] + 100], -0.12);
  // the stone
  const sp = [1420, 900];
  type(ctx, 'THE STONES', sp[0], sp[1], '600 13px "Hanken Grotesk"', SUB, { ls: 2.4 });
  type(ctx, 'aquamarine, for the two of us.', sp[0], sp[1] + 44, HAND, INK);
  type(ctx, 'and a little one for each friend.', sp[0], sp[1] + 80, HAND_S, SUB);
  { const [x, y] = at('stone'); callout(ctx, [x + 44, y + 22], [sp[0] - 14, sp[1] + 30], 0.2); }

  grain(ctx, W, H, 0.045);

  // words
  logo(ctx, 92, 70, 38, INK); type(ctx, 'ringcay', 138, 101, '800 34px "Bricolage Grotesque"', INK, { ls: -1.4 });
  ['every part of', 'our ring has', 'a reason.'].forEach((l, i) => type(ctx, l, 90, 240 + i * 76, '800 74px "Bricolage Grotesque"', INK, { ls: -3 }));
  type(ctx, '戒指上的每一处，都有我们的故事。', 94, 452, '500 26px "Noto Sans SC"', INK, { ls: 1 });
  type(ctx, 'make a ring together. it grows a little island,', 94, 506, '400 20px "Hanken Grotesk"', SUB);
  type(ctx, 'and every piece keeps a photo and the story behind it.', 94, 534, '400 20px "Hanken Grotesk"', SUB);
  type(ctx, 'FOR THE TWO OF YOU  ·  FOR YOUR PEOPLE', 94, 580, '600 13px "Hanken Grotesk"', SUB, { ls: 2.4 });

  const img = new Image(); img.src = out.toDataURL('image/png'); document.getElementById('out').appendChild(img);
  const blob = await new Promise((r) => out.toBlob(r, 'image/png'));
  await fetch(K === 2 ? '/save/hero-01-day-2x.png' : '/save/hero-01-day.png', { method: 'POST', body: blob });
  document.getElementById('status').textContent = 'done';
  window.heroDone = true;
}
main().catch((e) => { document.getElementById('status').textContent = 'error: ' + e.message; console.error(e); window.heroError = String(e.stack || e); });
