// Ring and island building blocks: how a band is swept, how stones are cut and set, and the pieces that stand on an island.
// Rings are built "lying": the finger hole runs along Y, and the top of the ring (where a stone sits) points to +Z.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const TAU = Math.PI * 2;
export const RI = 1.72;                      // inner radius: the finger hole never changes
export const TOP = Math.PI / 2;              // angle of the ring's "top"
const angDist = (a, b) => Math.abs((((a - b + Math.PI) % TAU) + TAU) % TAU - Math.PI);
export const bump = (th, s = 0.8, c = TOP) => Math.exp(-Math.pow(angDist(th, c) / s, 2));
export const noise = (seed) => (th) => 0.5 * Math.sin(2 * th + seed) + 0.3 * Math.sin(3 * th + seed * 2.1) + 0.2 * Math.sin(5 * th + seed * 3.7);
const fn = (v) => (typeof v === 'function' ? v : () => v);

// ---------- sweep: a cross-section carried around the Y axis ----------
export function sweep(N, nodes, { closed = false, color = null, flip = false, th0 = 0, th1 = TAU, groupTag = null } = {}) {
  const sample = nodes(th0), M = sample.length, cols = N + 1, full = Math.abs(th1 - th0 - TAU) < 1e-6;
  const pos = new Float32Array(cols * M * 3), uv = new Float32Array(cols * M * 2), col = color ? new Float32Array(cols * M * 3) : null;
  for (let i = 0; i < cols; i++) {
    const th = th0 + (i / N) * (th1 - th0), pts = nodes(th);
    for (let j = 0; j < M; j++) {
      const [r, y, tag, v] = pts[j], k = i * M + j;
      pos[k * 3] = Math.cos(th) * r; pos[k * 3 + 1] = y; pos[k * 3 + 2] = Math.sin(th) * r;
      uv[k * 2] = 0.75 - th / TAU; uv[k * 2 + 1] = v ?? 0;
      if (col) { const c = color(tag, th, r); col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b; }
    }
  }
  const a0 = [], a1 = [], J = closed ? M : M - 1;
  for (let i = 0; i < N; i++) for (let j = 0; j < J; j++) {
    const j2 = (j + 1) % M, a = i * M + j, b = (i + 1) * M + j, c = (i + 1) * M + j2, d = i * M + j2;
    const into = groupTag && sample[j][2] === groupTag && sample[j2][2] === groupTag ? a1 : a0;
    if (flip) into.push(a, b, d, b, c, d); else into.push(a, d, b, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (col) geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(a0.concat(a1));
  if (groupTag) { geo.addGroup(0, a0.length, 0); geo.addGroup(a0.length, a1.length, 1); }
  geo.computeVertexNormals();
  if (full) {
    const n = geo.attributes.normal;
    for (let j = 0; j < M; j++) {
      const a = j, b = N * M + j, x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1;
      n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
    }
  }
  return geo;
}

// ---------- surfaces: metal, enamel, engraving ----------
const METALS = {
  gold: ['#EFC96C', 0.15], rose: ['#F0AC92', 0.12], silver: ['#ECEDF1', 0.08], satin: ['#E3E5EA', 0.4], oxid: ['#9A9EA6', 0.46], chrome: ['#F4F6FA', 0.03],
};
export function metal(kind = 'gold', tex = null, extra = {}) {
  const [color, roughness] = METALS[kind];
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 1, envMapIntensity: 1.25, ...(tex ? { map: tex.map, bumpMap: tex.bump, bumpScale: tex.depth ?? 1.6 } : {}), ...extra });
}

const DOODLE = {
  sparkle: (c, s) => { for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 4, l = i % 2 ? s * 0.55 : s; c.beginPath(); c.moveTo(-Math.cos(a) * l, -Math.sin(a) * l); c.lineTo(Math.cos(a) * l, Math.sin(a) * l); c.stroke(); } },
  star: (c, s) => { c.beginPath(); for (let i = 0; i < 11; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? s * 0.45 : s; c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } c.stroke(); },
  heart: (c, s) => { c.beginPath(); c.moveTo(0, s * 0.85); c.bezierCurveTo(-s * 1.5, -s * 0.1, -s * 0.8, -s * 1.1, 0, -s * 0.4); c.bezierCurveTo(s * 0.8, -s * 1.1, s * 1.5, -s * 0.1, 0, s * 0.85); c.stroke(); },
  moon: (c, s) => { c.beginPath(); c.arc(0, 0, s, 0.9, TAU - 0.9); c.quadraticCurveTo(-s * 0.15, 0, Math.cos(0.9) * s, Math.sin(0.9) * s); c.stroke(); },
  cat: (c, s) => { c.beginPath(); c.moveTo(-s, -s * 0.2); c.lineTo(-s * 0.85, -s * 1.1); c.lineTo(-s * 0.3, -s * 0.75); c.lineTo(s * 0.3, -s * 0.75); c.lineTo(s * 0.85, -s * 1.1); c.lineTo(s, -s * 0.2); c.quadraticCurveTo(s * 1.05, s * 0.9, 0, s * 0.9); c.quadraticCurveTo(-s * 1.05, s * 0.9, -s, -s * 0.2); c.stroke(); for (const x of [-0.38, 0.38]) { c.beginPath(); c.arc(x * s, 0, s * 0.07, 0, TAU); c.stroke(); } c.beginPath(); c.moveTo(-s * 0.12, s * 0.35); c.lineTo(0, s * 0.45); c.lineTo(s * 0.12, s * 0.35); c.stroke(); },
};

// A strip that wraps the band. Engraved lines darken the metal and dent it; enamel is flat colour.
export function strip({ width = 1.1, doodles = [], text = null, textAt = TOP, mirror = false, hammer = 0, enamel = null, ink = 'rgba(38,36,52,.82)', depth = 1.6 } = {}) {
  const cw = 2048, ch = 256, sq = (cw / (TAU * (RI + 0.4))) / (ch / width);
  const mk = () => { const c = document.createElement('canvas'); c.width = cw; c.height = ch; return c; };
  const cm = mk(), cb = mk(), m = cm.getContext('2d'), b = cb.getContext('2d');
  m.fillStyle = '#fff'; m.fillRect(0, 0, cw, ch); b.fillStyle = '#fff'; b.fillRect(0, 0, cw, ch);
  if (enamel) enamel(m, cw, ch);
  if (hammer) {
    let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 700; i++) { const x = rnd() * cw, y = rnd() * ch, r = 16 + rnd() * 26, g = b.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(0,0,0,${hammer})`); g.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = g; for (const dx of [-cw, 0, cw]) b.fillRect(x + dx - r, y - r, r * 2, r * 2); }
  }
  const xAt = (th) => ((((0.75 - th / TAU) % 1) + 1) % 1) * cw;
  for (const [ctx, stroke] of [[m, ink], [b, '#000']]) {
    ctx.strokeStyle = stroke; ctx.fillStyle = stroke; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const at = (th, y, f) => { for (const dx of [-cw, 0, cw]) { ctx.save(); ctx.translate(xAt(th) + dx, ch * (1 - y)); ctx.scale(mirror ? -sq : sq, 1); f(); ctx.restore(); } };
    doodles.forEach(([kind, th, y = 0.5, s = 34, rot = 0]) => at(th, y, () => { ctx.rotate(rot); DOODLE[kind](ctx, s); }));
    if (text) at(textAt, 0.5, () => { ctx.font = '600 70px "Hanken Grotesk", "Noto Sans SC", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '16px'; ctx.fillText(text, 0, 4); });
  }
  const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { map: tex(cm, true), bump: tex(cb, false), depth };
}

// ---------- the band ----------
const PROFILE = {
  dome: (v) => 0.38 + 0.62 * Math.sin(Math.PI * v),
  round: (v) => 0.2 + 0.8 * Math.sqrt(Math.max(0, 1 - Math.pow(2 * v - 1, 2))),
  flat: (v) => (v < 0.07 || v > 0.93 ? 0.8 : 1),
  knife: (v) => 0.3 + 0.7 * (1 - Math.abs(2 * v - 1)),
};
export function band({ profile = 'dome', w = 1.1, t = 0.38, wob = 0, yoff = 0, extra = null, th0 = 0, th1 = TAU, N = 240, K = 12, mats }) {
  const W = fn(w), T = fn(t), WOB = fn(wob), Y = fn(yoff), P = PROFILE[profile];
  const rOut = (th, v = 0.5) => RI + T(th) * P(v) + WOB(th) + (extra ? extra(th, v) : 0);
  const yAt = (th, v = 0.5) => Y(th) + W(th) * (v - 0.5);
  const geo = sweep(N, (th) => {
    const pts = [], y0 = yAt(th, 0), y1 = yAt(th, 1);
    for (let k = 0; k <= K; k++) { const v = k / K; pts.push([rOut(th, v), yAt(th, v), 'out', v]); }
    pts.push([RI + 0.04, y1, 'edge', 1], [RI, y1 - 0.05, 'in', 0.96], [RI, y0 + 0.05, 'in', 0.04], [RI + 0.04, y0, 'edge', 0]);
    return pts;
  }, { closed: true, groupTag: 'in', th0, th1 });
  const mesh = new THREE.Mesh(geo, mats);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return { mesh, rOut, yAt, W, T };
}

// ---------- stones ----------
export function gemMat(color, { glow = 0.16, smooth = false, clear = false } = {}) {
  return new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: clear ? 0.02 : glow, roughness: 0.03, metalness: 0, flatShading: !smooth, envMapIntensity: clear ? 4.2 : 3, clearcoat: 1, ior: 2.1, reflectivity: 1, iridescence: clear ? 0.9 : 0.25, iridescenceIOR: 1.6 });
}
const shapeOf = (kind, s) => {
  const p = new THREE.Shape();
  if (kind === 'heart') { p.moveTo(0, -0.95 * s); p.bezierCurveTo(-1.55 * s, 0.05 * s, -0.9 * s, 1.15 * s, 0, 0.45 * s); p.bezierCurveTo(0.9 * s, 1.15 * s, 1.55 * s, 0.05 * s, 0, -0.95 * s); }
  else if (kind === 'star') { for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? s * 0.5 : s * 1.08; p[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } p.closePath(); }
  else if (kind === 'pear') { p.moveTo(0, 1.25 * s); p.bezierCurveTo(-0.5 * s, 0.4 * s, -0.95 * s, -0.1 * s, -0.78 * s, -0.62 * s); p.bezierCurveTo(-0.55 * s, -1.2 * s, 0.55 * s, -1.2 * s, 0.78 * s, -0.62 * s); p.bezierCurveTo(0.95 * s, -0.1 * s, 0.5 * s, 0.4 * s, 0, 1.25 * s); }
  return p;
};
// Every stone is built facing +Z (out of the ring), with its "up" along +Y.
export function gem(kind, s, color, o = {}) {
  const g = new THREE.Group(), m = gemMat(color, o);
  const add = (geo, mat = m, z = 0) => { const x = new THREE.Mesh(geo, mat); x.position.z = z; x.castShadow = true; g.add(x); return x; };
  if (kind === 'round') { add(new THREE.CylinderGeometry(0.56 * s, s, 0.46 * s, 8).rotateX(Math.PI / 2), m, 0.3 * s).rotation.z = Math.PI / 8; add(new THREE.CylinderGeometry(s, 0.8 * s, 0.14 * s, 8).rotateX(Math.PI / 2), m, 0.0).rotation.z = Math.PI / 8; }
  else if (kind === 'baguette' || kind === 'emerald') { const k = kind === 'emerald' ? [0.82, 1.08] : [0.5, 1.15]; const c = add(new THREE.CylinderGeometry(0.62, 1, 0.5 * s, 4).rotateY(Math.PI / 4).rotateX(Math.PI / 2), m, 0.25 * s); c.scale.set(k[0] * s * 1.25, k[1] * s * 1.25, 1); }
  else if (kind === 'oval') { const c = add(new THREE.SphereGeometry(1, 28, 14, 0, TAU, 0, Math.PI / 2).rotateX(Math.PI / 2), gemMat(color, { ...o, smooth: true }), 0); c.scale.set(s * 0.82, s * 1.12, s * 0.62); }
  else { const geo = new THREE.ExtrudeGeometry(shapeOf(kind, s), { depth: 0.16 * s, bevelEnabled: true, bevelThickness: 0.26 * s, bevelSize: 0.22 * s, bevelSegments: 1, curveSegments: 9 }); add(geo, m, 0.1 * s); }
  return g;
}
// Sits a thing on the band's outer surface at angle th, turned to face outward.
export function seat(parent, B, obj, th, { v = 0.5, lift = 0, tilt = 0 } = {}) {
  const r = B.rOut(th, v) + lift;
  obj.position.set(Math.cos(th) * r, B.yAt(th, v), Math.sin(th) * r);
  obj.rotation.y = Math.PI / 2 - th;
  if (tilt) obj.rotateZ(tilt);
  parent.add(obj);
  return obj;
}
export function collar(s, kind = 'gold', h = 0.24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(s * 1.2, s * 1.08, h, 28).rotateX(Math.PI / 2), metal(kind));
  m.castShadow = true;
  return m;
}
export const RAINBOW = ['#FF4D6D', '#FF8A3D', '#FFD23F', '#7BD957', '#2EC4B6', '#3D8BFF', '#8A5CF6', '#FF5CC8'];
export const box = (w, h, d, r = 0.05, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, r);
export const M = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };

// ---------- island parts ----------
const flatCache = new Map();
export function paint(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (!flatCache.has(k)) flatCache.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, envMapIntensity: 0.45, ...o }));
  return flatCache.get(k);
}
export function lit(color, night, power = 3) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: night ? power : 0.12, roughness: 0.5 });
}

// Pieces, in clear saturated colours. `night` switches the windows and lamps on.
export function pieces(night) {
  const win = lit('#FFD27A', night, 3.2);
  return {
    cypress: (color = '#1FA463') => { const g = new THREE.Group(); g.add(M(new THREE.CylinderGeometry(0.018, 0.026, 0.14, 6), paint('#8A5A3C'), 0, 0.07, 0)); const pts = [[0.001, 0.1], [0.085, 0.2], [0.1, 0.42], [0.078, 0.72], [0.034, 0.96], [0.001, 1.04]].map(([x, y]) => new THREE.Vector2(x, y)); g.add(M(new THREE.LatheGeometry(pts, 12), paint(color))); return g; },
    tree: (c1 = '#35C46A', c2 = '#58D676') => { const g = new THREE.Group(); const t = M(new THREE.CylinderGeometry(0.022, 0.04, 0.3, 6), paint('#8A5A3C'), 0.02, 0.15, 0); t.rotation.z = -0.14; g.add(t); [[0, 0.44, 0, 0.21], [0.17, 0.39, 0.05, 0.15], [-0.15, 0.37, -0.04, 0.16], [0.04, 0.55, -0.06, 0.13], [-0.03, 0.35, 0.14, 0.13]].forEach(([x, y, z, r], i) => { const b = M(new THREE.IcosahedronGeometry(r, 1), paint(i % 2 ? c2 : c1, { flatShading: true }), x, y, z); b.scale.y = 0.78; b.rotation.set(i, i * 2, 0); g.add(b); }); return g; },
    house: (w, h, d, o = {}) => {
      const g = new THREE.Group(), wall = paint(o.wall || '#FFFDF7');
      g.add(M(new THREE.BoxGeometry(w, h, d), wall, 0, h / 2, 0), M(new THREE.BoxGeometry(0.085, 0.17, 0.012), paint(o.door || '#2B50F0'), -w * 0.18, 0.085, d / 2 + 0.006));
      g.add(M(new THREE.BoxGeometry(0.075, 0.09, 0.012), win, w * 0.2, h * 0.58, d / 2 + 0.006), M(new THREE.BoxGeometry(0.012, 0.09, 0.075), win, w / 2 + 0.006, h * 0.58, 0));
      if (o.roof) { const s = new THREE.Shape(); s.moveTo(-w / 2 - 0.04, 0); s.lineTo(w / 2 + 0.04, 0); s.lineTo(0, 0.18); s.closePath(); const r = new THREE.ExtrudeGeometry(s, { depth: d + 0.08, bevelEnabled: false }); r.translate(0, h, -d / 2 - 0.04); g.add(M(r, paint(o.roof))); }
      else g.add(M(new THREE.BoxGeometry(w + 0.03, 0.025, d + 0.03), wall, 0, h + 0.012, 0));
      if (o.dome) g.add(M(new THREE.SphereGeometry(Math.min(w, d) * 0.4, 24, 12, 0, TAU, 0, Math.PI / 2), paint(o.dome, { roughness: 0.5 }), 0, h + 0.02, 0));
      return g;
    },
    lighthouse: () => { const g = new THREE.Group(); g.add(M(new THREE.CylinderGeometry(0.07, 0.115, 0.92, 24), paint('#FFFDF7'), 0, 0.46, 0)); for (const y of [0.2, 0.56]) g.add(M(new THREE.CylinderGeometry(0.094 - y * 0.05, 0.103 - y * 0.05, 0.16, 24), paint('#FF4D5E'), 0, y + 0.08, 0)); g.add(M(new THREE.CylinderGeometry(0.105, 0.1, 0.03, 20), paint('#2B2A3A'), 0, 0.935, 0)); const l = M(new THREE.CylinderGeometry(0.052, 0.052, 0.1, 14), lit('#FFE08A', night, 5), 0, 1.0, 0); l.castShadow = false; g.add(l, M(new THREE.ConeGeometry(0.075, 0.09, 16), paint('#FF4D5E'), 0, 1.095, 0)); return g; },
    bush: (color = '#FF5CC8', n = 4) => { const g = new THREE.Group(); for (let i = 0; i < n; i++) { const b = M(new THREE.IcosahedronGeometry(0.075 + (i % 2) * 0.025, 1), paint(color, { flatShading: true }), Math.cos(i * 2.2) * 0.08, 0.07 + (i % 3) * 0.03, Math.sin(i * 2.2) * 0.08); b.rotation.set(i, i, i); g.add(b); } return g; },
    rock: (color = '#F3EBDD', k = 0) => { const g = new THREE.Group(); const r = M(new THREE.DodecahedronGeometry(0.15, 0), paint(color, { flatShading: true }), 0, 0.06, 0); r.scale.set(1.3, 0.72, 1); r.rotation.set(k, k * 2.1, k * 0.7); g.add(r); return g; },
    lamp: () => { const g = new THREE.Group(); g.add(M(new THREE.CylinderGeometry(0.008, 0.01, 0.32, 6), paint('#2B2A3A'), 0, 0.16, 0)); const b = M(new THREE.SphereGeometry(0.034, 12, 10), lit('#FFE08A', night, 5), 0, 0.34, 0); b.castShadow = false; g.add(b); return g; },
    arch: (color = '#FFFDF7') => { const s = new THREE.Shape(); s.moveTo(-0.27, 0); s.lineTo(0.27, 0); s.lineTo(0.27, 0.6); s.lineTo(-0.27, 0.6); s.closePath(); const hole = new THREE.Path(); hole.moveTo(-0.14, 0); hole.lineTo(-0.14, 0.3); hole.absarc(0, 0.3, 0.14, Math.PI, 0, true); hole.lineTo(0.14, 0); hole.closePath(); s.holes.push(hole); const geo = new THREE.ExtrudeGeometry(s, { depth: 0.13, bevelEnabled: false, curveSegments: 20 }); geo.translate(0, 0, -0.065); const g = new THREE.Group(); g.add(M(geo, paint(color))); return g; },
    umbrella: (color = '#FFD23F') => { const g = new THREE.Group(); g.add(M(new THREE.CylinderGeometry(0.008, 0.008, 0.42, 6), paint('#FFFDF7'), 0, 0.21, 0), M(new THREE.ConeGeometry(0.27, 0.1, 10), paint(color, { flatShading: true }), 0, 0.44, 0)); return g; },
    flag: (color = '#FF4FA3') => { const g = new THREE.Group(); g.add(M(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 6), paint('#FFFDF7'), 0, 0.25, 0)); const s = new THREE.Shape(); s.moveTo(0, 0.5); s.lineTo(0.2, 0.44); s.lineTo(0, 0.38); s.closePath(); g.add(M(new THREE.ShapeGeometry(s), paint(color, { side: THREE.DoubleSide }))); return g; },
    pond: (r = 0.36) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: night ? '#2A6FD6' : '#35C9E8', roughness: 0.06, envMapIntensity: 1.6 })); m.position.y = 0.012; m.receiveShadow = true; const g = new THREE.Group(); g.add(m); return g; },
    bench: () => { const g = new THREE.Group(), w = paint('#E9B872'); g.add(M(new THREE.BoxGeometry(0.44, 0.03, 0.15), w, 0, 0.14, 0)); const b = M(new THREE.BoxGeometry(0.44, 0.12, 0.025), w, 0, 0.25, -0.075); b.rotation.x = -0.14; g.add(b); for (const x of [-0.18, 0.18]) for (const z of [-0.05, 0.05]) g.add(M(new THREE.BoxGeometry(0.03, 0.14, 0.03), paint('#8A5A3C'), x, 0.07, z)); return g; },
    mailbox: () => { const g = new THREE.Group(); g.add(M(new THREE.CylinderGeometry(0.02, 0.024, 0.3, 8), paint('#8A5A3C'), 0, 0.15, 0)); const b = M(new THREE.CapsuleGeometry(0.075, 0.13, 6, 14), paint('#2447D6'), 0, 0.36, 0); b.rotation.x = Math.PI / 2; g.add(b, M(new THREE.BoxGeometry(0.012, 0.09, 0.05), paint('#FF4D5E'), 0.082, 0.42, 0.02)); return g; },
    picnic: () => { const g = new THREE.Group(); const c = M(new THREE.BoxGeometry(0.56, 0.014, 0.44), paint('#FFFDF7'), 0, 0.008, 0); c.castShadow = false; g.add(c); for (let i = -2; i <= 2; i++) { const a = M(new THREE.BoxGeometry(0.04, 0.016, 0.44), paint('#FF4D5E'), i * 0.11, 0.009, 0), b = M(new THREE.BoxGeometry(0.56, 0.016, 0.034), paint('#FF4D5E'), 0, 0.0095, i * 0.088); a.castShadow = b.castShadow = false; g.add(a, b); } g.add(M(new THREE.CylinderGeometry(0.085, 0.07, 0.1, 14), paint('#E9B872'), -0.1, 0.066, 0.02), M(new THREE.SphereGeometry(0.035, 12, 10), paint('#FFD23F'), 0.14, 0.045, 0.08), M(new THREE.SphereGeometry(0.033, 12, 10), paint('#FF4FA3'), 0.08, 0.043, -0.1)); return g; },
    fountain: () => { const g = new THREE.Group(), st = paint('#FFFDF7'), wt = new THREE.MeshStandardMaterial({ color: night ? '#2A6FD6' : '#35C9E8', roughness: 0.06, envMapIntensity: 1.6 }); g.add(M(new THREE.CylinderGeometry(0.3, 0.32, 0.09, 28), st, 0, 0.045, 0), M(new THREE.CylinderGeometry(0.26, 0.26, 0.02, 28), wt, 0, 0.092, 0), M(new THREE.CylinderGeometry(0.035, 0.05, 0.26, 12), st, 0, 0.2, 0), M(new THREE.CylinderGeometry(0.15, 0.06, 0.05, 20), st, 0, 0.33, 0), M(new THREE.CylinderGeometry(0.13, 0.13, 0.015, 20), wt, 0, 0.358, 0), M(new THREE.SphereGeometry(0.04, 12, 10), wt, 0, 0.4, 0)); return g; },
    tuft: (color = '#2FAE5C') => { const g = new THREE.Group(); for (let i = 0; i < 4; i++) { const t = M(new THREE.ConeGeometry(0.012, 0.1 + i * 0.015, 4), paint(color), (i - 1.5) * 0.022, 0.05, (i % 2) * 0.02); t.rotation.z = (i - 1.5) * 0.18; t.castShadow = false; g.add(t); } return g; },
  };
}

// A floating islet: grass on top, a band of earth, and a cut crystal underneath in the colour of your stone.
export function islet({ R = 1.9, crystal = '#FF4FA3', depth = 1.5, night = false, grass = ['#7ADB6A', '#5BCB6B'], facets = 9, squash = 1 }) {
  const g = new THREE.Group(), c = (h) => new THREE.Color(h), g1 = c(grass[0]), g2 = c(grass[1]), e1 = c('#C98A5E'), e2 = c('#9C6645'), tmp = new THREE.Color();
  const hgt = (a, r) => 0.05 * Math.sin(2 * a + 0.4) * (r / R) + 0.04 * Math.sin(3 * a + r * 2.1) * (r / R) + 0.12 * Math.exp(-Math.pow(r / (R * 0.5), 2));
  const edge = (a) => R * (1 + 0.05 * Math.sin(3 * a + 0.7) + 0.035 * Math.sin(5 * a + 2.1) + 0.02 * Math.sin(9 * a));
  const top = M(sweep(96, (a) => { const E = edge(a); return [[0.001, hgt(a, 0), 'g'], [E * 0.3, hgt(a, E * 0.3), 'g'], [E * 0.6, hgt(a, E * 0.6), 'g'], [E * 0.85, hgt(a, E * 0.85), 'g'], [E * 0.97, hgt(a, E) - 0.02, 'g'], [E, -0.08, 'rim'], [E * 0.97, -0.2, 'e1'], [E * 0.84, -0.4, 'e2']]; },
    { flip: true, color: (tag, a, r) => (tag === 'e1' ? e1 : tag === 'e2' ? e2 : tag === 'rim' ? tmp.copy(g2).multiplyScalar(0.9) : tmp.copy(g1).lerp(g2, 0.5 + 0.5 * Math.sin(4 * a + r * 2.6))) }),
  new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, envMapIntensity: 0.35 }));
  g.add(top);
  const cm = gemMat(crystal, { glow: night ? 1.1 : 0.28 });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(R * 0.86, depth, facets, 1).rotateX(Math.PI), cm); cone.position.y = -0.38 - depth / 2; cone.castShadow = true;
  const girdle = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.86, R * 0.86, 0.1, facets), cm); girdle.position.y = -0.38;
  g.add(cone, girdle);
  g.scale.z = squash;
  g.userData.height = (x, z) => hgt(Math.atan2(z, x), Math.hypot(x, z));
  g.userData.R = R;
  return g;
}

// One set of piece builders per time of day, so the lit windows are shared.
const sets = {};
const pieceSet = (night) => (sets[night ? 1 : 0] ||= pieces(night));
const RECIPES = {
  house: (P) => P.house(0.5, 0.33, 0.4, { roof: '#FF5C34' }),
  cabin: (P) => P.house(0.44, 0.3, 0.36, { roof: '#2447D6', door: '#FF4FA3' }),
  domehouse: (P) => P.house(0.42, 0.3, 0.38, { dome: '#2447D6' }),
  lighthouse: (P) => P.lighthouse(), cypress: (P) => P.cypress(), tree: (P) => P.tree(),
  blossom: (P) => P.tree('#FF8FB8', '#FFB3CF'), bush: (P) => P.bush('#FF5CC8'), sunbush: (P) => P.bush('#FFD23F'),
  pond: (P) => P.pond(0.3), arch: (P) => P.arch(), lamp: (P) => P.lamp(), flag: (P) => P.flag(), umbrella: (P) => P.umbrella(),
  rock: (P) => { const g = P.rock('#FFF3DE', 1); g.scale.setScalar(1.5); const w = new THREE.Group(); w.add(g); return w; },
  bench: (P) => P.bench(), mailbox: (P) => P.mailbox(), picnic: (P) => P.picnic(), fountain: (P) => P.fountain(),
};
export function makePiece(type, night) {
  const g = (RECIPES[type] || RECIPES.tree)(pieceSet(night));
  g.userData.type = type;
  return g;
}
