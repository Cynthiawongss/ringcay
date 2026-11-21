// Island pieces, built from simple soft shapes so nothing needs downloading.
// Every builder returns a Group standing on y = 0 with its "front" facing +Z.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { t } from './i18n.js';

const mats = new Map();
export function clay(color, extra) {
  const key = color + (extra ? JSON.stringify(extra) : '');
  if (!mats.has(key)) {
    mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, envMapIntensity: 0.45, ...extra }));
  }
  return mats.get(key);
}

// Shared glowing materials, so the world can turn every window up at night in one place.
export const glow = {
  window: new THREE.MeshStandardMaterial({ color: '#FFE9B8', emissive: '#FFC766', emissiveIntensity: 0.25, roughness: 0.5 }),
  lamp: new THREE.MeshStandardMaterial({ color: '#FFF1C9', emissive: '#FFD27A', emissiveIntensity: 0.6, roughness: 0.4 }),
  flame: new THREE.MeshStandardMaterial({ color: '#FFB347', emissive: '#FF8A3D', emissiveIntensity: 1.4, roughness: 0.6 }),
  flameCore: new THREE.MeshStandardMaterial({ color: '#FFE08A', emissive: '#FFD35C', emissiveIntensity: 1.8, roughness: 0.6 }),
};
export function setGlow(level) {
  glow.window.emissiveIntensity = 0.2 + level * 2.2;
  glow.lamp.emissiveIntensity = 0.5 + level * 2.6;
}

const C = {
  wood: '#C4946A', woodDark: '#94694A', cream: '#F7EEDF', white: '#FCF9F3', stone: '#D6CEC2', stoneDark: '#B9B0A3',
  roof: '#E0785A', roofRose: '#D98F92', red: '#E05A47', leaf: '#93BE86', leaf2: '#ABCB93', leaf3: '#7DAF86',
  pine: '#5F9A82', pine2: '#6FAA8E', pink: '#F6B9C8', pink2: '#FBD6DE', butter: '#F4D98A', blue: '#A9CDEB',
  navy: '#3B4A6B', brass: '#D9A441', tabby: '#E9A562', tabbyDark: '#C9813F', ink: '#3A2A2E', jade: '#AEB8A0', persimmon: '#FF6B45',
};

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
const box = (w, h, d, r = 0.03) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
const cyl = (rt, rb, h, seg = 20) => new THREE.CylinderGeometry(rt, rb, h, seg);
const ball = (r, d = 2) => new THREE.IcosahedronGeometry(r, d);
const cone = (r, h, seg = 20) => new THREE.ConeGeometry(r, h, seg);

function blob(g, color, r, x, y, z, sx = 1, sy = 0.86, sz = 1) {
  const m = mesh(ball(r, 3), clay(color), x, y, z);
  m.scale.set(sx, sy, sz);
  g.add(m);
  return m;
}

function cottage() {
  const g = new THREE.Group();
  g.add(mesh(box(0.66, 0.42, 0.52, 0.06), clay(C.cream), 0, 0.21, 0));
  const roof = mesh(cone(0.56, 0.36, 4), clay(C.roof), 0, 0.58, 0);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1, 1, 0.84);
  g.add(roof);
  g.add(mesh(box(0.13, 0.22, 0.04, 0.02), clay(C.woodDark), 0, 0.11, 0.262));
  g.add(mesh(box(0.11, 0.11, 0.03, 0.02), glow.window, -0.2, 0.25, 0.262));
  g.add(mesh(box(0.11, 0.11, 0.03, 0.02), glow.window, 0.2, 0.25, 0.262));
  g.add(mesh(box(0.03, 0.11, 0.11, 0.012), glow.window, 0.332, 0.25, 0));
  g.add(mesh(box(0.1, 0.24, 0.1, 0.02), clay(C.stone), 0.2, 0.62, -0.08));
  g.add(mesh(box(0.2, 0.04, 0.1, 0.015), clay(C.stone), 0, 0.02, 0.31));
  return g;
}

function lighthouse() {
  const g = new THREE.Group();
  g.add(mesh(cyl(0.3, 0.33, 0.12, 24), clay(C.stone), 0, 0.06, 0));
  const H = 1.05, rb = 0.24, rt = 0.15;
  g.add(mesh(cyl(rt, rb, H, 28), clay(C.white), 0, 0.12 + H / 2, 0));
  for (const t of [0.22, 0.62]) {
    const h = 0.2, y0 = t * H, r0 = rb + (rt - rb) * (y0 / H), r1 = rb + (rt - rb) * ((y0 + h) / H);
    g.add(mesh(cyl(r1 + 0.004, r0 + 0.004, h, 28), clay(C.red), 0, 0.12 + y0 + h / 2, 0));
  }
  g.add(mesh(cyl(0.22, 0.2, 0.05, 24), clay(C.navy), 0, 1.2, 0));
  g.add(mesh(cyl(0.115, 0.115, 0.18, 16), glow.lamp, 0, 1.31, 0));
  g.add(mesh(cone(0.17, 0.17, 20), clay(C.red), 0, 1.485, 0));
  g.add(mesh(ball(0.03, 1), clay(C.brass, { metalness: 0.6, roughness: 0.35 }), 0, 1.58, 0));
  g.add(mesh(box(0.1, 0.17, 0.04, 0.02), clay(C.woodDark), 0, 0.2, 0.232));
  return g;
}

function trunk(g, h = 0.34, r = 0.055) {
  g.add(mesh(cyl(r * 0.8, r * 1.3, h, 10), clay(C.woodDark), 0, h / 2, 0));
}

function oak() {
  const g = new THREE.Group();
  trunk(g, 0.4, 0.06);
  blob(g, C.leaf, 0.3, 0, 0.6, 0);
  blob(g, C.leaf2, 0.22, 0.2, 0.52, 0.08);
  blob(g, C.leaf3, 0.21, -0.19, 0.5, -0.05);
  blob(g, C.leaf2, 0.18, 0.02, 0.8, -0.04);
  return g;
}

function pine() {
  const g = new THREE.Group();
  trunk(g, 0.22, 0.045);
  g.add(mesh(cone(0.27, 0.36, 14), clay(C.pine), 0, 0.36, 0));
  g.add(mesh(cone(0.215, 0.32, 14), clay(C.pine2), 0, 0.58, 0));
  g.add(mesh(cone(0.15, 0.28, 14), clay(C.pine), 0, 0.79, 0));
  return g;
}

function blossom() {
  const g = new THREE.Group();
  trunk(g, 0.42, 0.055);
  const b = mesh(cyl(0.025, 0.035, 0.26, 8), clay(C.woodDark), 0.1, 0.42, 0);
  b.rotation.z = -0.8;
  g.add(b);
  blob(g, C.pink, 0.28, -0.02, 0.66, 0);
  blob(g, C.pink2, 0.2, 0.24, 0.56, 0.04);
  blob(g, C.pink2, 0.19, -0.2, 0.55, 0.1);
  blob(g, C.pink, 0.17, 0.05, 0.86, -0.03);
  for (const [x, z] of [[0.3, 0.2], [-0.25, 0.28], [0.12, -0.3], [-0.32, -0.12]]) {
    const p = mesh(cyl(0.035, 0.035, 0.006, 8), clay(C.pink2), x, 0.006, z);
    p.castShadow = false;
    g.add(p);
  }
  return g;
}

// Front (+Z) is the land end; the planks run out over the lagoon toward -Z.
function dock() {
  const g = new THREE.Group();
  const top = -0.05;
  for (let i = 0; i < 7; i++) g.add(mesh(box(0.3, 0.035, 0.115, 0.012), clay(i % 2 ? C.wood : '#CFA27A'), 0, top, 0.14 - i * 0.13));
  for (const z of [-0.1, -0.62]) for (const x of [-0.14, 0.14]) g.add(mesh(cyl(0.028, 0.028, 0.34, 8), clay(C.woodDark), x, top - 0.08, z));
  g.add(mesh(ball(0.035, 1), clay(C.persimmon), 0.14, top + 0.12, -0.62));
  g.add(mesh(cyl(0.012, 0.012, 0.1, 6), clay(C.woodDark), 0.14, top + 0.07, -0.62));
  return g;
}

function mailbox() {
  const g = new THREE.Group();
  g.add(mesh(cyl(0.022, 0.026, 0.3, 8), clay(C.woodDark), 0, 0.15, 0));
  const body = mesh(new THREE.CapsuleGeometry(0.075, 0.13, 6, 14), clay(C.blue), 0, 0.36, 0);
  body.rotation.x = Math.PI / 2;
  body.scale.set(1, 1, 0.92);
  g.add(body);
  g.add(mesh(box(0.012, 0.09, 0.05, 0.004), clay(C.red), 0.082, 0.42, 0.02));
  g.add(mesh(cyl(0.05, 0.05, 0.008, 14).rotateX(Math.PI / 2), clay(C.white), 0, 0.36, 0.142));
  return g;
}

function bench() {
  const g = new THREE.Group();
  g.add(mesh(box(0.44, 0.035, 0.16, 0.012), clay(C.wood), 0, 0.15, 0));
  const back = mesh(box(0.44, 0.13, 0.03, 0.012), clay(C.wood), 0, 0.27, -0.085);
  back.rotation.x = -0.14;
  g.add(back);
  for (const x of [-0.18, 0.18]) for (const z of [-0.06, 0.06]) g.add(mesh(box(0.035, 0.15, 0.035, 0.008), clay(C.woodDark), x, 0.075, z));
  return g;
}

function campfire() {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const s = mesh(ball(0.05, 1), clay(i % 2 ? C.stone : C.stoneDark), Math.cos(a) * 0.17, 0.03, Math.sin(a) * 0.17);
    s.scale.y = 0.7;
    g.add(s);
  }
  for (const r of [0.5, -0.6, 2.1]) {
    const l = mesh(cyl(0.025, 0.025, 0.24, 8), clay(C.woodDark), 0, 0.05, 0);
    l.rotation.set(Math.PI / 2 - 0.25, r, 0);
    g.add(l);
  }
  const f = new THREE.Group();
  const outer = mesh(cone(0.075, 0.22, 10), glow.flame, 0, 0.17, 0);
  const core = mesh(cone(0.04, 0.13, 8), glow.flameCore, 0, 0.14, 0);
  outer.castShadow = core.castShadow = false;
  f.add(outer, core);
  f.userData.anim = 'flicker';
  g.add(f);
  return g;
}

function flowers() {
  const g = new THREE.Group();
  const heads = [C.pink, C.butter, C.persimmon, C.white, '#C9B6E8', C.pink2];
  const spots = [[0, 0], [0.13, 0.08], [-0.12, 0.1], [0.06, -0.13], [-0.1, -0.09], [0.18, -0.06], [-0.2, -0.01]];
  spots.forEach(([x, z], i) => {
    const h = 0.1 + ((i * 37) % 5) * 0.018;
    g.add(mesh(cyl(0.008, 0.008, h, 5), clay(C.leaf3), x, h / 2, z));
    g.add(mesh(ball(0.035, 1), clay(heads[i % heads.length]), x, h + 0.02, z));
  });
  const tuft = blob(g, C.leaf, 0.09, 0.02, 0.02, 0.02, 2.2, 0.35, 2.0);
  tuft.castShadow = false;
  return g;
}

function tent() {
  const g = new THREE.Group();
  const tri = (w, h) => {
    const s = new THREE.Shape();
    s.moveTo(-w, 0); s.lineTo(w, 0); s.lineTo(0, h); s.closePath();
    return s;
  };
  const body = new THREE.ExtrudeGeometry(tri(0.3, 0.36), { depth: 0.5, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
  body.translate(0, 0, -0.25);
  g.add(mesh(body, clay(C.butter)));
  const door = new THREE.ShapeGeometry(tri(0.13, 0.24));
  const d = mesh(door, clay(C.ink), 0, 0.005, 0.273);
  d.castShadow = false;
  g.add(d);
  const flag = mesh(cone(0.03, 0.07, 3), clay(C.persimmon), 0, 0.43, 0.25);
  g.add(mesh(cyl(0.006, 0.006, 0.12, 5), clay(C.woodDark), 0, 0.4, 0.25), flag);
  return g;
}

function observatory() {
  const g = new THREE.Group();
  g.add(mesh(cyl(0.29, 0.31, 0.24, 28), clay(C.cream), 0, 0.12, 0));
  g.add(mesh(cyl(0.31, 0.31, 0.03, 28), clay(C.stone), 0, 0.25, 0));
  const dome = mesh(new THREE.SphereGeometry(0.285, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), clay(C.blue), 0, 0.26, 0);
  g.add(dome);
  const slit = mesh(box(0.09, 0.3, 0.2, 0.02), clay(C.navy), 0, 0.42, 0.17);
  slit.rotation.x = 0.75;
  g.add(slit);
  const scope = mesh(cyl(0.035, 0.028, 0.3, 12), clay(C.brass, { metalness: 0.7, roughness: 0.3 }), 0, 0.5, 0.2);
  scope.rotation.x = 0.85;
  g.add(scope);
  g.add(mesh(box(0.1, 0.15, 0.03, 0.02), clay(C.woodDark), 0.0, 0.085, 0.3));
  g.add(mesh(box(0.08, 0.08, 0.03, 0.02), glow.window, -0.19, 0.14, 0.235));
  return g;
}

// The plank carries whatever is engraved on the ring.
export function signTexture(text) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 224;
  const x = c.getContext('2d');
  x.fillStyle = '#E9CFA6'; x.fillRect(0, 0, 512, 224);
  x.strokeStyle = 'rgba(120,80,50,.2)'; x.lineWidth = 2;
  for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(0, 20 + i * 26 + (i % 2) * 5); x.bezierCurveTo(160, 10 + i * 26, 340, 34 + i * 26, 512, 18 + i * 26); x.stroke(); }
  x.fillStyle = '#4A2F2A'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const label = (text || t('our island')).trim();
  let lines = [label];
  const wide = /[\u3000-\u9fff]/.test(label);
  if (wide && label.length > 5 && !label.includes(' ')) {
    const cut = Math.ceil(label.length / 2);
    lines = [label.slice(0, cut), label.slice(cut)];
  } else if (label.length > 11 && label.includes(' ')) {
    const mid = label.length / 2;
    const cut = [...label].map((ch, k) => (ch === ' ' ? k : -1)).filter((k) => k > 0).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
    lines = [label.slice(0, cut), label.slice(cut + 1)];
  }
  let size = lines.length === 2 ? 112 : 150;
  const font = (px) => `${px}px "Nanum Pen Script", "Kaiti SC", "STKaiti", "KaiTi", "Bradley Hand", cursive`;
  x.font = font(size);
  while (Math.max(...lines.map((l) => x.measureText(l).width)) > 468 && size > 30) { size -= 4; x.font = font(size); }
  lines.forEach((l, k) => x.fillText(l, 256, lines.length === 2 ? 66 + k * 96 : 116));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function signpost(opts) {
  const g = new THREE.Group();
  g.add(mesh(cyl(0.025, 0.03, 0.56, 8), clay(C.woodDark), 0, 0.28, 0));
  const side = clay('#DDBF95');
  const face = new THREE.MeshStandardMaterial({ map: signTexture(opts && opts.text), roughness: 0.85 });
  const plank = mesh(new THREE.BoxGeometry(0.72, 0.315, 0.035), [side, side, side, side, face, side], 0, 0.44, 0.03);
  plank.rotation.z = -0.04;
  g.add(plank);
  g.userData.dispose = () => { face.map.dispose(); face.dispose(); };
  return g;
}

function cat() {
  const g = new THREE.Group();
  const body = mesh(new THREE.CapsuleGeometry(0.07, 0.1, 6, 12), clay(C.tabby), 0, 0.1, -0.02);
  body.rotation.x = 1.15;
  g.add(body);
  g.add(mesh(ball(0.068, 2), clay(C.tabby), 0, 0.2, 0.07));
  for (const x of [-0.04, 0.04]) g.add(mesh(cone(0.026, 0.05, 4), clay(C.tabbyDark), x, 0.268, 0.065));
  const tail = mesh(new THREE.CapsuleGeometry(0.018, 0.14, 4, 8), clay(C.tabbyDark), 0.07, 0.11, -0.12);
  tail.rotation.set(0.5, 0, -0.7);
  g.add(tail);
  for (const x of [-0.024, 0.024]) g.add(mesh(ball(0.009, 1), clay(C.ink), x, 0.21, 0.133));
  g.add(mesh(ball(0.008, 1), clay(C.pink), 0, 0.192, 0.138));
  for (const x of [-0.035, 0.035]) g.add(mesh(ball(0.022, 1), clay(C.white), x, 0.022, 0.07));
  return g;
}

function swing() {
  const g = new THREE.Group();
  for (const x of [-0.26, 0.26]) for (const s of [-1, 1]) {
    const leg = mesh(cyl(0.02, 0.022, 0.66, 8), clay(C.wood), x, 0.31, s * 0.1);
    leg.rotation.x = s * 0.3;
    g.add(leg);
  }
  g.add(mesh(cyl(0.022, 0.022, 0.6, 8).rotateZ(Math.PI / 2), clay(C.woodDark), 0, 0.62, 0));
  const seat = new THREE.Group();
  seat.position.y = 0.62;
  for (const x of [-0.09, 0.09]) seat.add(mesh(cyl(0.006, 0.006, 0.42, 5), clay(C.cream), x, -0.21, 0));
  seat.add(mesh(box(0.24, 0.025, 0.09, 0.01), clay(C.persimmon), 0, -0.42, 0));
  seat.userData.anim = 'sway';
  g.add(seat);
  return g;
}

function sailboat() {
  const g = new THREE.Group();
  const boat = new THREE.Group();
  const hull = mesh(new THREE.SphereGeometry(0.2, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), clay(C.white), 0, 0.09, 0);
  hull.scale.set(0.62, 0.6, 1.25);
  boat.add(hull);
  const deck = mesh(cyl(0.2, 0.2, 0.015, 20), clay(C.wood), 0, 0.092, 0);
  deck.scale.set(0.6, 1, 1.22);
  boat.add(deck);
  boat.add(mesh(cyl(0.011, 0.011, 0.5, 6), clay(C.woodDark), 0, 0.34, 0.02));
  const sail = (pts, color, x) => {
    const s = new THREE.Shape();
    s.moveTo(pts[0], pts[1]); s.lineTo(pts[2], pts[3]); s.lineTo(pts[4], pts[5]); s.closePath();
    const m = mesh(new THREE.ShapeGeometry(s), clay(color, { side: THREE.DoubleSide }), x, 0, 0.02);
    m.rotation.y = Math.PI / 2;
    return m;
  };
  boat.add(sail([0.02, 0.14, 0.02, 0.58, -0.26, 0.14], C.cream, 0.001));
  boat.add(sail([-0.02, 0.16, -0.02, 0.5, 0.16, 0.16], C.persimmon, -0.001));
  boat.userData.anim = 'bob';
  g.add(boat);
  return g;
}

function greenhouse() {
  const g = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({ color: '#DFF3EC', roughness: 0.12, metalness: 0, transparent: true, opacity: 0.42, envMapIntensity: 1.2 });
  g.add(mesh(box(0.6, 0.06, 0.46, 0.015), clay(C.stone), 0, 0.03, 0));
  const walls = mesh(new THREE.BoxGeometry(0.54, 0.3, 0.4), glass, 0, 0.21, 0);
  walls.castShadow = false;
  g.add(walls);
  const s = new THREE.Shape();
  s.moveTo(-0.29, 0); s.lineTo(0.29, 0); s.lineTo(0, 0.2); s.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(s, { depth: 0.42, bevelEnabled: false });
  roofGeo.translate(0, 0.36, -0.21);
  const roof = mesh(roofGeo, glass);
  roof.castShadow = false;
  g.add(roof);
  const frame = clay(C.white);
  for (const x of [-0.27, 0, 0.27]) for (const z of [-0.2, 0.2]) g.add(mesh(box(0.022, 0.3, 0.022, 0.006), frame, x, 0.21, z));
  for (const z of [-0.2, 0.2]) g.add(mesh(box(0.56, 0.022, 0.022, 0.006), frame, 0, 0.36, z));
  g.add(mesh(box(0.022, 0.022, 0.44, 0.006), frame, 0, 0.555, 0));
  blob(g, C.leaf, 0.09, -0.12, 0.13, 0.02).castShadow = false;
  blob(g, C.leaf3, 0.075, 0.1, 0.12, -0.05).castShadow = false;
  blob(g, C.pink, 0.04, 0.12, 0.2, 0.02).castShadow = false;
  g.add(mesh(cyl(0.05, 0.04, 0.07, 10), clay(C.roof), -0.12, 0.09, 0.02));
  return g;
}

function picnic() {
  const g = new THREE.Group();
  const blanket = mesh(box(0.56, 0.014, 0.44, 0.006), clay('#F3E6D2'), 0, 0.008, 0);
  blanket.castShadow = false;
  blanket.rotation.y = 0.2;
  g.add(blanket);
  for (let i = -2; i <= 2; i++) {
    const a = mesh(box(0.035, 0.016, 0.44, 0.004), clay(C.red), i * 0.11, 0.009, 0);
    const b = mesh(box(0.56, 0.016, 0.03, 0.004), clay(C.red), 0, 0.0095, i * 0.088);
    a.castShadow = b.castShadow = false;
    a.rotation.y = b.rotation.y = 0.2;
    a.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.2);
    b.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.2);
    g.add(a, b);
  }
  g.add(mesh(cyl(0.085, 0.07, 0.1, 14), clay(C.wood), -0.1, 0.066, 0.02));
  const handle = mesh(new THREE.TorusGeometry(0.07, 0.01, 6, 16, Math.PI), clay(C.woodDark), -0.1, 0.11, 0.02);
  g.add(handle);
  g.add(mesh(cyl(0.02, 0.026, 0.11, 10), clay(C.jade), 0.13, 0.07, -0.06));
  g.add(mesh(cyl(0.009, 0.012, 0.05, 8), clay(C.jade), 0.13, 0.148, -0.06));
  g.add(mesh(ball(0.032, 1), clay(C.red), 0.1, 0.045, 0.1));
  g.add(mesh(ball(0.03, 1), clay(C.butter), 0.17, 0.043, 0.07));
  return g;
}

function balloon() {
  const g = new THREE.Group();
  const f = new THREE.Group();
  f.position.y = 1.15;
  const env = mesh(new THREE.SphereGeometry(0.3, 24, 18), clay(C.cream), 0, 0.42, 0);
  env.scale.set(1, 1.14, 1);
  f.add(env);
  const stripe = (color, rot) => {
    const s = mesh(new THREE.SphereGeometry(0.303, 6, 18, 0, Math.PI / 4), clay(color), 0, 0.42, 0);
    s.scale.set(1, 1.14, 1);
    s.rotation.y = rot;
    s.castShadow = false;
    f.add(s);
  };
  [C.persimmon, C.butter, C.blue, C.pink].forEach((c, i) => stripe(c, i * (Math.PI / 2)));
  f.add(mesh(cyl(0.12, 0.085, 0.14, 16), clay(C.cream), 0, 0.08, 0));
  for (const [x, z] of [[-0.06, -0.06], [0.06, -0.06], [-0.06, 0.06], [0.06, 0.06]]) f.add(mesh(cyl(0.004, 0.004, 0.2, 4), clay(C.woodDark), x, -0.08, z));
  f.add(mesh(box(0.15, 0.1, 0.15, 0.02), clay(C.wood), 0, -0.22, 0));
  f.userData.anim = 'float';
  g.add(f);
  return g;
}

const BUILDERS = { cottage, lighthouse, oak, pine, blossom, dock, mailbox, bench, campfire, flowers, tent, observatory, signpost, cat, swing, sailboat, greenhouse, picnic, balloon };

export function buildPiece(type, opts) {
  const make = BUILDERS[type] || BUILDERS.oak;
  const g = make(opts);
  g.userData.type = type;
  return g;
}

// Small idle motions. t is seconds; phase keeps neighbours out of sync.
export function animatePiece(root, t, phase) {
  root.traverse((o) => {
    const a = o.userData.anim;
    if (!a) return;
    if (a === 'flicker') { const s = 1 + Math.sin(t * 11 + phase) * 0.09 + Math.sin(t * 17.3) * 0.06; o.scale.set(1 + (s - 1) * 0.5, s, 1 + (s - 1) * 0.5); }
    else if (a === 'sway') o.rotation.x = Math.sin(t * 1.7 + phase) * 0.32;
    else if (a === 'bob') { o.position.y = Math.sin(t * 1.3 + phase) * 0.012; o.rotation.z = Math.sin(t * 0.9 + phase) * 0.05; }
    else if (a === 'float') { o.position.y = 1.15 + Math.sin(t * 0.7 + phase) * 0.07; o.rotation.y = t * 0.12 + phase; }
  });
}
