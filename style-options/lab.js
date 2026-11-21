// Style boards for ringcay. Each board is a real render from the same kind of scene the app draws
// (a ring lying flat with an island grown on it), re-dressed in a different art direction.
// Nothing here is used by the app. It only paints pictures.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const TAU = Math.PI * 2, RI = 2.62, RO = 3.0, H = 1.2, WATER = 1.2, LAND = 1.34;
const W = 1600, HH = 1000, SS = 2;
const only = new URLSearchParams(location.search).get('only');

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);
const pm = new THREE.PMREMGenerator(renderer);
const ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture;

// ---------- geometry ----------
function sweep(N, nodes, { closed = false, color = null, flip = false } = {}) {
  const M = nodes(0).length, cols = N + 1;
  const pos = new Float32Array(cols * M * 3), uv = new Float32Array(cols * M * 2), col = color ? new Float32Array(cols * M * 3) : null;
  for (let i = 0; i < cols; i++) {
    const th = (i / N) * TAU, pts = nodes(th);
    for (let j = 0; j < M; j++) {
      const [r, y, tag] = pts[j], k = i * M + j;
      pos[k * 3] = Math.cos(th) * r; pos[k * 3 + 1] = y; pos[k * 3 + 2] = Math.sin(th) * r;
      uv[k * 2] = 0.75 - i / N; uv[k * 2 + 1] = y / H;
      if (col) { const c = color(tag, th, r); col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b; }
    }
  }
  const idx = [], J = closed ? M : M - 1;
  for (let i = 0; i < N; i++) for (let j = 0; j < J; j++) {
    const j2 = (j + 1) % M, a = i * M + j, b = (i + 1) * M + j, c = (i + 1) * M + j2, d = i * M + j2;
    if (flip) idx.push(a, b, d, b, c, d); else idx.push(a, d, b, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (col) geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const n = geo.attributes.normal;
  for (let j = 0; j < M; j++) {
    const a = j, b = N * M + j, x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
  }
  return geo;
}

function bandGeo() {
  const K = 10;
  return sweep(200, () => {
    const pts = [];
    for (let k = 0; k <= K; k++) { const t = k / K; pts.push([RO - 0.06 + 0.1 * Math.sin(Math.PI * t), H * t, 'out']); }
    pts.push([RI + 0.05, H, 'in'], [RI, H - 0.05, 'in'], [RI, 0.05, 'in'], [RI + 0.05, 0, 'in']);
    return pts;
  }, { closed: true });
}

function engraving(text, color) {
  const cw = 2048, ch = 256, squash = 0.51;
  const mk = () => { const c = document.createElement('canvas'); c.width = cw; c.height = ch; return c; };
  const cm = mk(), cb = mk(), m = cm.getContext('2d'), b = cb.getContext('2d');
  for (const [ctx, fill] of [[m, color], [b, '#000']]) {
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = fill; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const at = (x, fn) => { for (const dx of [-cw, 0, cw]) { ctx.save(); ctx.translate(x + dx, ch * 0.52); ctx.scale(squash, 1); fn(); ctx.restore(); } };
    const cx = (0.75 - (Math.PI / 2 - 0.42) / TAU) * cw;
    ctx.font = 'italic 600 92px Georgia, "Times New Roman", serif';
    const half = (ctx.measureText(text).width * squash) / 2;
    at(cx, () => { ctx.font = 'italic 600 92px Georgia, "Times New Roman", serif'; ctx.fillText(text, 0, 0); });
    for (let i = 0; i < 14; i++) {
      const x = cx + (i / 14) * cw, d = Math.min(i / 14, 1 - i / 14) * cw;
      if (d < half + 70) continue;
      at(x, () => { ctx.beginPath(); ctx.arc(0, 0, i % 2 ? 7 : 12, 0, TAU); ctx.fill(); });
    }
  }
  const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { map: tex(cm, true), bump: tex(cb, false) };
}

// ---------- one scene per art direction ----------
function build(S, { ringOnly = false } = {}) {
  const scene = new THREE.Scene();
  scene.environment = ENV;
  scene.environmentIntensity = S.env;
  const mats = new Map();
  const mat = (color, o = {}) => {
    const k = color + JSON.stringify(o);
    if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, envMapIntensity: 0.4, ...o }));
    return mats.get(k);
  };
  const mesh = (geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; };
  const angDist = (a, b) => Math.abs((((a - b + Math.PI) % TAU) + TAU) % TAU - Math.PI);
  const hill = (a, r) => {
    const base = 0.04 * Math.sin(2 * a + 0.4) + 0.025 * Math.sin(5 * a + r * 1.7);
    const rf = Math.max(0, Math.sin((Math.PI * (r - 1.75)) / 1.6));
    return base + S.hill * Math.exp(-Math.pow(angDist(a, 3.9) / 0.75, 2)) * rf;
  };
  const ground = (a, r) => LAND + hill(a, r);

  // ring
  const e = engraving(S.engrave || 'since 06.14', S.engraveInk || 'rgba(74,40,16,.6)');
  const metal = new THREE.MeshStandardMaterial({ color: S.metal, metalness: 1, roughness: S.metalRough ?? 0.17, envMapIntensity: S.metalEnv ?? 1.25, map: e.map, bumpMap: e.bump, bumpScale: 1.6 });
  const band = mesh(bandGeo(), metal);
  const root = new THREE.Group();
  root.add(band);
  scene.add(root);

  if (!ringOnly) {
    const c = (h) => new THREE.Color(h), top1 = c(S.top[0]), top2 = c(S.top[1]), sand = c(S.sand), cl1 = c(S.cliff[0]), cl2 = c(S.cliff[1]), tmp = new THREE.Color();
    const terrain = mesh(sweep(180, (th) => {
      const ed = 0.09 * Math.sin(3 * th + 0.7) + 0.055 * Math.sin(7 * th + 2.1) + 0.03 * Math.sin(11 * th);
      const ei = 0.05 * Math.sin(4 * th + 1.3) + 0.03 * Math.sin(9 * th);
      const g = (r) => [r, ground(th, r), 'top'];
      return [[1.38 + ei, WATER - 0.2, 'sand'], [1.52 + ei, WATER - 0.01, 'sand'], [1.66 + ei, WATER + 0.08, 'sand'], [1.82 + ei * 0.5, LAND - 0.02 + hill(th, 1.82), 'top'],
        g(2.05), g(2.3), g(2.55), g(2.8), g(3.05), [3.27 + ed, LAND + hill(th, 3.2) * 0.6, 'top'], [3.4 + ed, LAND - 0.07 + hill(th, 3.3) * 0.3, 'rim'],
        [3.39 + ed, LAND - 0.18, 'cl1'], [3.2 + ed * 0.5, WATER - 0.06, 'cl2'], [3.035, WATER - 0.15, 'cl2']];
    }, { flip: true, color: (tag, th, r) => (tag === 'sand' ? sand : tag === 'cl1' ? cl1 : tag === 'cl2' ? cl2 : tag === 'rim' ? tmp.copy(top2).multiplyScalar(0.92) : tmp.copy(top1).lerp(top2, 0.5 + 0.5 * Math.sin(5 * th + r * 3.1))) }),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, envMapIntensity: 0.3 }));
    root.add(terrain);
    const floor = mesh(new THREE.CircleGeometry(1.6, 48).rotateX(-Math.PI / 2), mat(S.sand), 0, WATER - 0.2, 0);
    const water = mesh(new THREE.CircleGeometry(1.7, 72).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: S.water, roughness: S.waterRough ?? 0.08, transparent: true, opacity: S.waterOpacity ?? 0.86, envMapIntensity: S.waterEnv ?? 1.4 }), 0, WATER, 0);
    water.castShadow = false;
    root.add(floor, water);

    // ---------- pieces (deliberately slimmer and plainer than the app's toy set) ----------
    const P = {
      cypress: (color) => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.14, 6), mat(S.wood), 0, 0.07, 0)); const pts = [[0.001, 0.1], [0.085, 0.2], [0.1, 0.42], [0.078, 0.72], [0.034, 0.96], [0.001, 1.04]].map(([x, y]) => new THREE.Vector2(x, y)); g.add(mesh(new THREE.LatheGeometry(pts, 12), mat(color))); return g; },
      olive: (c1, c2) => { const g = new THREE.Group(); const t = mesh(new THREE.CylinderGeometry(0.022, 0.04, 0.3, 6), mat(S.wood), 0.02, 0.15, 0); t.rotation.z = -0.16; g.add(t); [[0, 0.42, 0, 0.2], [0.17, 0.38, 0.05, 0.15], [-0.15, 0.36, -0.04, 0.16], [0.04, 0.52, -0.06, 0.13], [-0.03, 0.34, 0.14, 0.13]].forEach(([x, y, z, r], i) => { const b = mesh(new THREE.IcosahedronGeometry(r, 1), mat(i % 2 ? c2 : c1, { flatShading: true }), x, y, z); b.scale.y = 0.72; b.rotation.set(i, i * 2, 0); g.add(b); }); return g; },
      modelTree: (color) => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), mat(color), 0, 0.15, 0)); g.add(mesh(new THREE.SphereGeometry(0.15, 20, 14), mat(color), 0, 0.4, 0)); return g; },
      house: (w, h, d, o = {}) => {
        const g = new THREE.Group(), wall = mat(o.wall || S.wall), win = o.glow ? new THREE.MeshStandardMaterial({ color: '#FFD9A0', emissive: '#FFB354', emissiveIntensity: 2.6 }) : mat(o.win || S.door);
        g.add(mesh(new THREE.BoxGeometry(w, h, d), wall, 0, h / 2, 0));
        g.add(mesh(new THREE.BoxGeometry(0.085, 0.17, 0.012), mat(o.door || S.door), -w * 0.18, 0.085, d / 2 + 0.006));
        g.add(mesh(new THREE.BoxGeometry(0.07, 0.085, 0.012), win, w * 0.2, h * 0.58, d / 2 + 0.006));
        g.add(mesh(new THREE.BoxGeometry(0.012, 0.085, 0.07), win, w / 2 + 0.006, h * 0.58, 0));
        if (o.roof) { const s = new THREE.Shape(); s.moveTo(-w / 2 - 0.04, 0); s.lineTo(w / 2 + 0.04, 0); s.lineTo(0, 0.17); s.closePath(); const r = new THREE.ExtrudeGeometry(s, { depth: d + 0.08, bevelEnabled: false }); r.translate(0, h, -d / 2 - 0.04); g.add(mesh(r, mat(o.roof))); }
        else g.add(mesh(new THREE.BoxGeometry(w + 0.03, 0.025, d + 0.03), wall, 0, h + 0.012, 0));
        if (o.dome) g.add(mesh(new THREE.SphereGeometry(Math.min(w, d) * 0.4, 24, 12, 0, TAU, 0, Math.PI / 2), mat(o.dome, { roughness: 0.6 }), 0, h + 0.02, 0));
        return g;
      },
      arch: (color) => { const s = new THREE.Shape(); s.moveTo(-0.27, 0); s.lineTo(0.27, 0); s.lineTo(0.27, 0.6); s.lineTo(-0.27, 0.6); s.closePath(); const hole = new THREE.Path(); hole.moveTo(-0.14, 0); hole.lineTo(-0.14, 0.3); hole.absarc(0, 0.3, 0.14, Math.PI, 0, true); hole.lineTo(0.14, 0); hole.closePath(); s.holes.push(hole); const geo = new THREE.ExtrudeGeometry(s, { depth: 0.13, bevelEnabled: false, curveSegments: 20 }); geo.translate(0, 0, -0.065); const g = new THREE.Group(); g.add(mesh(geo, mat(color))); return g; },
      steps: (color) => { const g = new THREE.Group(); for (let i = 0; i < 5; i++) g.add(mesh(new THREE.BoxGeometry(0.32, 0.045 * (i + 1), 0.085), mat(color), 0, 0.0225 * (i + 1), 0.17 - i * 0.085)); return g; },
      rock: (color, k = 0) => { const g = new THREE.Group(); const r = mesh(new THREE.DodecahedronGeometry(0.15, 0), mat(color, { flatShading: true }), 0, 0.06, 0); r.scale.set(1.3, 0.72, 1); r.rotation.set(k, k * 2.1, k * 0.7); g.add(r); return g; },
      pavilion: (color) => { const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(0.66, 0.03, 0.48), mat(color), 0, 0.015, 0), mesh(new THREE.BoxGeometry(0.7, 0.035, 0.52), mat(color), 0, 0.46, 0)); for (const x of [-0.29, 0.29]) for (const z of [-0.2, 0.2]) g.add(mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.43, 10), mat(color), x, 0.23, z)); return g; },
      pier: (color) => { const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(0.15, 0.025, 1.0), mat(color), 0, -0.04, -0.36)); for (const z of [-0.2, -0.82]) for (const x of [-0.06, 0.06]) g.add(mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.3, 6), mat(color), x, -0.12, z)); return g; },
      boat: (hull, trim, sail) => { const g = new THREE.Group(); const h = mesh(new THREE.SphereGeometry(0.2, 20, 10, 0, TAU, Math.PI / 2, Math.PI / 2), mat(hull, { roughness: 0.6 }), 0, 0.075, 0); h.scale.set(0.42, 0.42, 1.25); g.add(h); const deck = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.012, 20), mat(trim), 0, 0.076, 0); deck.scale.set(0.4, 1, 1.22); g.add(deck); if (sail) { g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.46, 6), mat(trim), 0, 0.3, 0.02)); const s = new THREE.Shape(); s.moveTo(0.02, 0.12); s.lineTo(0.02, 0.52); s.lineTo(-0.22, 0.12); s.closePath(); const m = mesh(new THREE.ShapeGeometry(s), mat(sail, { side: THREE.DoubleSide }), 0, 0, 0.02); m.rotation.y = Math.PI / 2; g.add(m); } return g; },
      lamp: () => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.32, 6), mat('#2A2420'), 0, 0.16, 0)); const b = mesh(new THREE.SphereGeometry(0.032, 12, 10), new THREE.MeshStandardMaterial({ color: '#FFE3B0', emissive: '#FFB85C', emissiveIntensity: 4 }), 0, 0.34, 0); b.castShadow = false; g.add(b); return g; },
      lighthouse: (white, dark, glow) => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.07, 0.115, 0.92, 24), mat(white), 0, 0.46, 0), mesh(new THREE.CylinderGeometry(0.105, 0.1, 0.03, 20), mat(dark), 0, 0.935, 0)); const l = mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.1, 14), glow ? new THREE.MeshStandardMaterial({ color: '#FFE8BC', emissive: '#FFC56B', emissiveIntensity: 5 }) : mat('#F3E7C8', { roughness: 0.3 }), 0, 1.0, 0); l.castShadow = false; g.add(l, mesh(new THREE.ConeGeometry(0.075, 0.09, 16), mat(dark), 0, 1.095, 0)); return g; },
      bush: (color, n = 4) => { const g = new THREE.Group(); for (let i = 0; i < n; i++) { const b = mesh(new THREE.IcosahedronGeometry(0.075 + (i % 2) * 0.025, 1), mat(color, { flatShading: true }), Math.cos(i * 2.2) * 0.08, 0.07 + (i % 3) * 0.03, Math.sin(i * 2.2) * 0.08); b.rotation.set(i, i, i); g.add(b); } return g; },
      umbrella: (color, pole) => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.42, 6), mat(pole), 0, 0.21, 0)); const c = mesh(new THREE.ConeGeometry(0.27, 0.1, 10), mat(color, { flatShading: true }), 0, 0.44, 0); g.add(c); for (const x of [-0.12, 0.14]) g.add(mesh(new THREE.BoxGeometry(0.09, 0.02, 0.26), mat(pole), x, 0.04, 0.1)); return g; },
      tuft: (color) => { const g = new THREE.Group(); for (let i = 0; i < 4; i++) { const t = mesh(new THREE.ConeGeometry(0.012, 0.1 + i * 0.015, 4), mat(color), (i - 1.5) * 0.022, 0.05, (i % 2) * 0.02); t.rotation.z = (i - 1.5) * 0.18; t.castShadow = false; g.add(t); } return g; },
    };
    const put = (g, a, r, { s = 1, rot = 0, zone = 'land' } = {}) => {
      g.position.set(Math.cos(a) * r, zone === 'water' ? WATER : zone === 'shore' ? WATER + 0.09 : ground(a, r), Math.sin(a) * r);
      g.rotation.y = Math.PI / 2 - a + rot; g.scale.setScalar(s); root.add(g); return g;
    };
    S.place(P, put);
    for (let k = 0; k < 34; k++) {
      const a = k * 2.399963 + 0.3, r = k % 3 === 0 ? 1.95 + (k % 5) * 0.03 : 3.06 + ((k * 7) % 5) * 0.04;
      if (k % 2) put(P.tuft(S.tuft), a, r); else put(P.rock(S.rock, k), a, r, { s: 0.3 + (k % 4) * 0.09 });
    }
    (S.lights || []).forEach(([a, r, y, color, power]) => { const l = new THREE.PointLight(color, power, 5, 2); l.position.set(Math.cos(a) * r, ground(a, r) + y, Math.sin(a) * r); scene.add(l); });
  }

  scene.add(new THREE.HemisphereLight(S.hemi[0], S.hemi[1], S.hemi[2]));
  const sun = new THREE.DirectionalLight(S.sun[0], S.sun[1]);
  sun.position.set(...S.sun[2]).multiplyScalar(1.7);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 50 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = S.shadowSoft ?? 5;
  scene.add(sun, sun.target);
  if (S.fill) { const f = new THREE.DirectionalLight(S.fill[0], S.fill[1]); f.position.set(...S.fill[2]); scene.add(f); }
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(80, 80).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ color: S.shadow[0], opacity: S.shadow[1] }));
  catcher.position.y = -0.02; catcher.receiveShadow = true;
  if (!ringOnly) scene.add(catcher);
  return { scene, root };
}

function shoot(S, { w = W, h = HH, az = 0.5, el = 0.4, dist = 21, shift = 3.1, lift = 0.2, fov = 24, ringOnly = false, tilt = 0 } = {}) {
  const { scene, root } = build(S, { ringOnly });
  if (tilt) { root.rotation.x = tilt; root.rotation.z = -0.25; root.position.y = 1.4; }
  renderer.setSize(w * SS, h * SS, false);
  renderer.toneMapping = S.tone === 'aces' ? THREE.ACESFilmicToneMapping : THREE.NeutralToneMapping;
  renderer.toneMappingExposure = S.exposure ?? 1;
  const cam = new THREE.PerspectiveCamera(fov, w / h, 0.1, 200);
  const t = new THREE.Vector3(0, 1.0 + lift, 0);
  cam.position.set(dist * Math.cos(el) * Math.sin(az), t.y + dist * Math.sin(el), dist * Math.cos(el) * Math.cos(az));
  cam.lookAt(t);
  cam.updateMatrixWorld(true);
  const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
  cam.position.addScaledVector(right, -shift); t.addScaledVector(right, -shift); cam.lookAt(t);
  renderer.render(scene, cam);
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  out.getContext('2d').drawImage(renderer.domElement, 0, 0, w, h);
  scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  return out;
}

// ---------- the five directions ----------
const DIRS = {
  a: {
    metal: '#E7BC68', env: 0.55, tone: 'aces', exposure: 1.0, hill: 0.34,
    top: ['#D4C4A5', '#C4B391'], sand: '#EBE0CB', cliff: ['#BCA689', '#9F896C'], water: '#7FA5A1', wood: '#5E4B3C', wall: '#F3EDE2', door: '#4B3B2F', rock: '#B9AD9A', tuft: '#A49B6E',
    hemi: ['#FFF4E6', '#CDB899', 0.62], sun: ['#FFDDB2', 3.5, [7.5, 5.2, 4.5]], fill: ['#EEDFCB', 0.35, [-6, 3, -4]], shadow: ['#5A4634', 0.3], shadowSoft: 6,
    place: (P, put) => {
      put(P.house(0.52, 0.34, 0.4), 3.9, 2.6, { s: 1.25, rot: Math.PI + 0.5 }); put(P.house(0.3, 0.24, 0.3), 3.52, 2.78, { s: 1.2, rot: Math.PI + 0.2 }); put(P.steps('#E8E0D2'), 3.28, 2.42, { s: 1.2, rot: Math.PI });
      [[4.3, 2.88, 1.35], [4.44, 2.6, 1.05], [4.6, 2.92, 0.92], [5.62, 2.72, 1.25], [5.8, 2.95, 0.95], [3.05, 2.98, 1.1]].forEach(([a, r, s]) => put(P.cypress('#55614A'), a, r, { s }));
      [[0.22, 2.62, 1.25], [0.55, 2.9, 1.0], [2.7, 2.72, 1.15]].forEach(([a, r, s]) => put(P.olive('#8D9978', '#7C8A6A'), a, r, { s }));
      put(P.arch('#E4DACA'), 1.5, 2.72, { s: 1.25, rot: 0.25 }); put(P.pavilion('#EFE8DC'), 2.15, 2.62, { s: 1.05, rot: 0.3 });
      put(P.pier('#6B5646'), 0.85, 1.62, { zone: 'shore' }); put(P.boat('#F1EADC', '#6B5646'), 2.3, 0.62, { zone: 'water', rot: 0.8 });
    },
  },
  b: {
    metal: '#EDC063', env: 0.8, exposure: 1.0, hill: 0.5,
    top: ['#EFE7CF', '#E2DBB8'], sand: '#F8EFD8', cliff: ['#CF8F66', '#AD6E4C'], water: '#1F7FCB', waterOpacity: 0.92, wood: '#7A5A40', wall: '#FCF9F2', door: '#2147B8', rock: '#E2D6C2', tuft: '#9FA35C',
    hemi: ['#E3EEFF', '#E9D3A8', 0.95], sun: ['#FFF6E2', 3.5, [5, 9, 5.5]], shadow: ['#27407A', 0.26], shadowSoft: 3,
    place: (P, put) => {
      put(P.house(0.48, 0.34, 0.4), 3.78, 2.5, { s: 1.25, rot: Math.PI + 0.45 }); put(P.house(0.36, 0.3, 0.34, { dome: '#2147B8' }), 4.08, 2.86, { s: 1.25, rot: Math.PI + 0.6 });
      put(P.house(0.4, 0.26, 0.36, { roof: '#C9643F' }), 3.45, 2.82, { s: 1.2, rot: Math.PI + 0.2 }); put(P.house(0.28, 0.42, 0.28), 4.32, 2.42, { s: 1.2, rot: Math.PI + 0.8 }); put(P.steps('#FCF9F2'), 3.05, 2.42, { s: 1.2, rot: Math.PI });
      [[3.62, 2.2], [4.22, 3.08], [1.25, 2.95], [2.5, 3.0]].forEach(([a, r]) => put(P.bush('#D4357B', 4), a, r, { s: 0.95 }));
      [[4.72, 2.82, 1.25], [4.9, 2.55, 1.0], [3.08, 3.02, 1.05]].forEach(([a, r, s]) => put(P.cypress('#3F6B4A'), a, r, { s }));
      [[0.3, 2.62, 1.15], [5.9, 2.8, 1.05], [2.15, 2.6, 1.1]].forEach(([a, r, s]) => put(P.olive('#5E9352', '#4E8046'), a, r, { s }));
      put(P.umbrella('#2147B8', '#FCF9F2'), 1.2, 2.5, { s: 1.3 }); put(P.pier('#FCF9F2'), 0.8, 1.62, { zone: 'shore' }); put(P.boat('#FCF9F2', '#2147B8', '#FCF9F2'), 2.4, 0.6, { zone: 'water', rot: 1.0 });
    },
  },
  c: {
    metal: '#E9C877', env: 0.45, tone: 'aces', exposure: 1.0, hill: 0.34, metalRough: 0.2,
    top: ['#EFEDE7', '#E8E5DE'], sand: '#F4F2ED', cliff: ['#DEDAD1', '#CFCAC0'], water: '#B9CAD2', waterRough: 0.04, waterEnv: 1.8, wood: '#F4F2EC', wall: '#F8F6F1', door: '#DDD9D0', rock: '#EDEAE3', tuft: '#E9E6DE',
    hemi: ['#FFFFFF', '#CFCBC3', 0.5], sun: ['#FFFDF8', 3.6, [8, 5.5, 3.5]], shadow: ['#3C3A36', 0.3], shadowSoft: 7,
    place: (P, put) => {
      put(P.house(0.52, 0.34, 0.4), 3.9, 2.6, { s: 1.25, rot: Math.PI + 0.5 }); put(P.house(0.3, 0.5, 0.3), 4.25, 2.8, { s: 1.15, rot: Math.PI + 0.7 }); put(P.steps('#F8F6F1'), 3.28, 2.42, { s: 1.2, rot: Math.PI });
      [[4.6, 2.9, 1.3], [4.8, 2.6, 1.0], [5.6, 2.75, 1.2], [0.25, 2.65, 1.25], [0.55, 2.92, 0.95], [2.72, 2.75, 1.15], [3.05, 3.0, 0.9]].forEach(([a, r, s]) => put(P.modelTree('#F8F6F1'), a, r, { s }));
      put(P.arch('#F8F6F1'), 1.5, 2.72, { s: 1.25, rot: 0.25 }); put(P.pavilion('#F8F6F1'), 2.15, 2.62, { s: 1.05, rot: 0.3 });
      put(P.pier('#F8F6F1'), 0.85, 1.62, { zone: 'shore' }); put(P.boat('#F8F6F1', '#F8F6F1'), 2.3, 0.62, { zone: 'water', rot: 0.8 });
    },
  },
  d: {
    metal: '#E3B55C', env: 0.5, tone: 'aces', exposure: 1.25, hill: 0.36, metalEnv: 1.6, engraveInk: 'rgba(40,20,6,.7)',
    top: ['#434F38', '#384332'], sand: '#75634E', cliff: ['#40352D', '#2B231F'], water: '#17373C', waterOpacity: 0.94, waterEnv: 2.2, wood: '#2C241F', wall: '#6A5B4D', door: '#231C18', rock: '#51463D', tuft: '#57613F',
    hemi: ['#5E6F96', '#1C1614', 0.65], sun: ['#B5C6EA', 1.5, [-6, 7, -3]], fill: ['#FFC98A', 0.5, [6, 3, 7]], shadow: ['#000000', 0.5], shadowSoft: 7,
    lights: [[3.75, 2.25, 0.35, '#FFB05A', 9], [1.5, 2.5, 0.5, '#FFB05A', 5], [5.35, 2.75, 1.45, '#FFD08A', 8], [0.85, 1.2, 0.35, '#FFB05A', 4]],
    place: (P, put) => {
      put(P.house(0.52, 0.34, 0.4, { glow: true, roof: '#3A2E28' }), 3.9, 2.6, { s: 1.25, rot: Math.PI + 0.5 }); put(P.house(0.3, 0.24, 0.3, { glow: true }), 3.52, 2.78, { s: 1.2, rot: Math.PI + 0.2 }); put(P.steps('#6A5B4D'), 3.28, 2.42, { s: 1.2, rot: Math.PI });
      [[4.3, 2.88, 1.4], [4.44, 2.6, 1.1], [4.62, 2.92, 0.95], [5.75, 2.9, 1.05], [3.05, 2.98, 1.15], [0.2, 2.7, 1.3], [0.5, 2.95, 1.0], [2.7, 2.8, 1.2]].forEach(([a, r, s]) => put(P.cypress('#24322A'), a, r, { s }));
      put(P.lighthouse('#D8CFC0', '#231C18', true), 5.35, 2.75, { s: 1.3 });
      [[1.1, 2.55], [1.5, 2.72], [1.95, 2.55], [2.4, 2.62]].forEach(([a, r]) => put(P.lamp(), a, r, { s: 1.15 }));
      put(P.pier('#2C241F'), 0.85, 1.62, { zone: 'shore' }); put(P.lamp(), 0.85, 1.02, { zone: 'water', s: 0.9 }); put(P.boat('#3A2E28', '#231C18'), 2.3, 0.62, { zone: 'water', rot: 0.8 });
    },
  },
  e: {
    metal: '#E2B865', env: 0.6, tone: 'aces', exposure: 1.1, hill: 0.4,
    top: ['#A8AF88', '#959F79'], sand: '#E3D6BB', cliff: ['#93826C', '#776855'], water: '#6B98A1', wood: '#5B4838', wall: '#E9E0D0', door: '#4A3A2E', rock: '#A89C8A', tuft: '#8A8F5C',
    hemi: ['#F4EEE2', '#B7A88E', 0.7], sun: ['#FFE3BF', 3.2, [7, 6, 5]], shadow: ['#3B3024', 0.28], shadowSoft: 5,
    place: (P, put) => {
      put(P.house(0.52, 0.32, 0.4, { roof: '#B8613F' }), 3.9, 2.6, { s: 1.3, rot: Math.PI + 0.5 }); put(P.steps('#D9CFBE'), 3.28, 2.42, { s: 1.2, rot: Math.PI });
      [[4.35, 2.88, 1.35], [4.5, 2.6, 1.05], [5.62, 2.72, 1.2], [3.05, 2.98, 1.1]].forEach(([a, r, s]) => put(P.cypress('#4D5C45'), a, r, { s }));
      [[0.22, 2.62, 1.3], [0.55, 2.9, 1.05], [2.7, 2.72, 1.2], [1.9, 2.85, 1.0]].forEach(([a, r, s]) => put(P.olive('#8A9872', '#788763'), a, r, { s }));
      [[1.3, 2.9], [5.1, 2.6]].forEach(([a, r]) => put(P.bush('#C9A6A0', 4), a, r, { s: 1.1 }));
      put(P.pier('#6B5646'), 0.85, 1.62, { zone: 'shore' }); put(P.boat('#EFE7D8', '#6B5646', '#EFE7D8'), 2.3, 0.62, { zone: 'water', rot: 0.8 });
    },
  },
};

// ---------- boards ----------
const EN = ['a ring that', 'grows into', 'a place.'];
const ZH = '一枚戒指，长成一座岛。';
const BODY = ['Design a ring together. Watch it become an island', 'that keeps your photos and stories.'];
const BODY_ZH = '一起设计一枚戒指，看它长成一座装着照片和故事的小岛。';

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
function pill(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}
function caption(ctx, B) {
  type(ctx, B.label, 88, HH - 64, '600 15px "Hanken Grotesk"', B.sub, { ls: 2.4 });
  B.palette.forEach((c, i) => { ctx.beginPath(); ctx.arc(100 + i * 44, HH - 112, 15, 0, TAU); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = B.swatchLine; ctx.lineWidth = 1; ctx.stroke(); });
  type(ctx, B.fonts, 88 + B.palette.length * 44 + 14, HH - 106, '400 14px "Hanken Grotesk"', B.sub);
}
function board(id, paint) {
  const c = document.createElement('canvas'); c.width = W; c.height = HH;
  paint(c.getContext('2d'));
  return { id, canvas: c };
}

const BOARDS = {
  a: () => board('a-quiet-luxury', (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, HH); g.addColorStop(0, '#EFE8DC'); g.addColorStop(1, '#DFD4C3'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
    ctx.drawImage(shoot(DIRS.a), 0, 0);
    grain(ctx, W, HH, 0.07);
    const ink = '#2B211B', sub = 'rgba(43,33,27,.62)';
    type(ctx, 'ringcay', 88, 104, '500 36px "Bodoni Moda"', ink, { ls: 0.5 });
    type(ctx, 'EXPLORE        MY ISLAND        EN · 中文', W - 88, 100, '600 13px "Hanken Grotesk"', ink, { align: 'right', ls: 2.6 });
    EN.forEach((l, i) => type(ctx, l, 84, 330 + i * 98, 'italic 500 98px "Bodoni Moda"', ink, { ls: -1.5 }));
    type(ctx, ZH, 88, 640, '700 42px "Noto Serif SC"', ink, { ls: 3 });
    BODY.forEach((l, i) => type(ctx, l, 88, 706 + i * 28, '400 18px "Hanken Grotesk"', sub));
    pill(ctx, 88, 786, 232, 58, 0, ink); type(ctx, 'START OUR RING', 204, 821, '600 13px "Hanken Grotesk"', '#EFE8DC', { align: 'center', ls: 2.8 });
    const w = type(ctx, '开始做戒指', 352, 822, '500 18px "Noto Serif SC"', ink, { ls: 2 }); ctx.fillStyle = ink; ctx.fillRect(352, 830, w, 1.2);
    caption(ctx, { label: 'A  —  QUIET LUXURY  ·  静奢', sub, palette: ['#EFE8DC', '#DBCDB2', '#55614A', '#C9A14E', '#2B211B'], swatchLine: 'rgba(43,33,27,.18)', fonts: 'Bodoni Moda italic  ·  思源宋体  ·  Hanken Grotesk' });
  }),
  b: () => board('b-europe-summer', (ctx) => {
    ctx.fillStyle = '#F8F2E4'; ctx.fillRect(0, 0, W, HH);
    ctx.beginPath(); ctx.arc(1130, 400, 330, 0, TAU); ctx.fillStyle = '#F2C230'; ctx.fill();
    ctx.drawImage(shoot(DIRS.b), 0, 0);
    const ink = '#1D3CA3', sub = 'rgba(29,60,163,.72)';
    type(ctx, 'RINGCAY', 88, 106, '400 38px "Anton"', ink, { ls: 2 });
    type(ctx, 'EXPLORE        MY ISLAND        EN · 中文', W - 88, 100, '600 13px "Hanken Grotesk"', ink, { align: 'right', ls: 2.6 });
    ['A RING THAT', 'GROWS INTO', 'A PLACE.'].forEach((l, i) => type(ctx, l, 84, 336 + i * 112, '400 116px "Anton"', ink, { ls: 0.5 }));
    type(ctx, ZH, 88, 670, '900 46px "Noto Sans SC"', ink, { ls: 1 });
    BODY.forEach((l, i) => type(ctx, l, 88, 730 + i * 28, '400 18px "Hanken Grotesk"', sub));
    pill(ctx, 88, 806, 226, 60, 30, ink); type(ctx, 'START OUR RING', 201, 843, '400 19px "Anton"', '#F8F2E4', { align: 'center', ls: 1.6 });
    pill(ctx, 330, 806, 176, 60, 30, '#F2C230'); type(ctx, '开始做戒指', 418, 843, '900 18px "Noto Sans SC"', ink, { align: 'center', ls: 1 });
    caption(ctx, { label: 'B  —  EUROPE SUMMER  ·  欧洲夏日', sub, palette: ['#F8F2E4', '#1D3CA3', '#F2C230', '#C9643F', '#D4357B'], swatchLine: 'rgba(29,60,163,.2)', fonts: 'Anton  ·  思源黑体 Black  ·  Hanken Grotesk' });
  }),
  c: () => board('c-soft-minimal', (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, HH); g.addColorStop(0, '#F3F2EE'); g.addColorStop(1, '#E7E5DF'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
    ctx.drawImage(shoot(DIRS.c), 0, 0);
    const ink = '#1E1E1C', sub = 'rgba(30,30,28,.55)';
    type(ctx, 'ringcay', 88, 104, '600 30px "Hanken Grotesk"', ink, { ls: -1 });
    ctx.beginPath(); ctx.arc(88 + 108, 96, 5, 0, TAU); ctx.fillStyle = '#E5482D'; ctx.fill();
    type(ctx, 'explore        my island        en / 中文', W - 88, 100, '400 15px "Hanken Grotesk"', ink, { align: 'right' });
    EN.forEach((l, i) => type(ctx, l, 84, 336 + i * 92, '300 90px "Hanken Grotesk"', ink, { ls: -3.5 }));
    type(ctx, ZH, 88, 634, '300 42px "Noto Sans SC"', ink, { ls: 2 });
    BODY.forEach((l, i) => type(ctx, l, 88, 700 + i * 28, '400 18px "Hanken Grotesk"', sub));
    pill(ctx, 88, 780, 208, 56, 28, ink); type(ctx, 'start our ring', 192, 814, '400 17px "Hanken Grotesk"', '#F3F2EE', { align: 'center' });
    pill(ctx, 310, 780, 168, 56, 28, null, ink); type(ctx, '开始做戒指', 394, 815, '500 16px "Noto Sans SC"', ink, { align: 'center', ls: 1 });
    caption(ctx, { label: 'C  —  SOFT MINIMAL  ·  白模极简', sub, palette: ['#F3F2EE', '#E7E5DF', '#C5D3D9', '#E9C877', '#1E1E1C'], swatchLine: 'rgba(30,30,28,.16)', fonts: 'Hanken Grotesk Light  ·  思源黑体 Light' });
  }),
  d: () => board('d-after-dark', (ctx) => {
    const g = ctx.createRadialGradient(1120, 520, 80, 1000, 520, 1100); g.addColorStop(0, '#3A2A22'); g.addColorStop(0.55, '#1D1512'); g.addColorStop(1, '#0E0A09'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HH);
    ctx.drawImage(shoot(DIRS.d), 0, 0);
    grain(ctx, W, HH, 0.09);
    const ink = '#F2E7D3', sub = 'rgba(242,231,211,.6)', gold = '#D9B25C';
    type(ctx, 'ringcay', 88, 104, 'italic 400 40px "Instrument Serif"', ink);
    type(ctx, 'EXPLORE        MY ISLAND        EN · 中文', W - 88, 100, '600 13px "Hanken Grotesk"', ink, { align: 'right', ls: 2.6 });
    EN.forEach((l, i) => type(ctx, l, 84, 336 + i * 100, (i === 2 ? 'italic ' : '') + '400 108px "Instrument Serif"', i === 2 ? gold : ink, { ls: -2 }));
    type(ctx, ZH, 88, 650, '500 42px "Noto Serif SC"', ink, { ls: 3 });
    BODY.forEach((l, i) => type(ctx, l, 88, 716 + i * 28, '400 18px "Hanken Grotesk"', sub));
    pill(ctx, 88, 794, 222, 58, 29, gold); type(ctx, 'start our ring', 199, 830, '600 17px "Hanken Grotesk"', '#1D1512', { align: 'center' });
    pill(ctx, 324, 794, 172, 58, 29, null, 'rgba(242,231,211,.5)'); type(ctx, '开始做戒指', 410, 830, '500 16px "Noto Serif SC"', ink, { align: 'center', ls: 1.5 });
    caption(ctx, { label: 'D  —  AFTER DARK  ·  夜色', sub, palette: ['#1D1512', '#434F38', '#17373C', '#D9B25C', '#F2E7D3'], swatchLine: 'rgba(242,231,211,.25)', fonts: 'Instrument Serif  ·  思源宋体  ·  Hanken Grotesk' });
  }),
  e: () => board('e-film-scrapbook', (ctx) => {
    ctx.fillStyle = '#F2EEE4'; ctx.fillRect(0, 0, W, HH);
    ctx.strokeStyle = 'rgba(40,34,28,.05)'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HH); ctx.stroke(); }
    for (let y = 0; y < HH; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const ink = '#1F1A16', sub = 'rgba(31,26,22,.62)';
    // the photo
    const photo = shoot(DIRS.e, { w: 700, h: 640, shift: 0, dist: 17.5, el: 0.42, lift: 0.1 });
    ctx.save(); ctx.translate(1130, 500); ctx.rotate(-0.045);
    ctx.shadowColor = 'rgba(40,30,20,.22)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18; ctx.fillStyle = '#FDFCF8'; ctx.fillRect(-380, -400, 760, 830); ctx.shadowColor = 'transparent';
    const sky = ctx.createLinearGradient(0, -370, 0, 270); sky.addColorStop(0, '#D7E0DC'); sky.addColorStop(1, '#EAD9BF'); ctx.fillStyle = sky; ctx.fillRect(-350, -370, 700, 640);
    ctx.drawImage(photo, -350, -370);
    ctx.fillStyle = 'rgba(255,196,140,.13)'; ctx.fillRect(-350, -370, 700, 640);
    const v = ctx.createRadialGradient(0, -50, 200, 0, -50, 520); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,20,0,.28)'); ctx.fillStyle = v; ctx.fillRect(-350, -370, 700, 640);
    type(ctx, 'the lake house year  ·  06.14', 70, 372, '400 52px "Nanum Pen Script"', ink, { align: 'center' });
    ctx.fillStyle = 'rgba(243,226,85,.82)'; ctx.save(); ctx.translate(-40, -400); ctx.rotate(-0.06); ctx.fillRect(-90, -22, 180, 44); ctx.restore();
    ctx.restore();
    // a cut-out sticker of the ring
    const ring = shoot(DIRS.a, { w: 420, h: 420, ringOnly: true, shift: 0, dist: 14, el: 0.5, lift: 0.9, tilt: 0.55 });
    const sil = document.createElement('canvas'); sil.width = sil.height = 420; const sx = sil.getContext('2d'); sx.drawImage(ring, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#fff'; sx.fillRect(0, 0, 420, 420);
    ctx.save(); ctx.translate(772, 884); ctx.rotate(0.2); ctx.scale(0.8, 0.8);
    ctx.shadowColor = 'rgba(40,30,20,.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
    for (let i = 0; i < 20; i++) ctx.drawImage(sil, -210 + Math.cos((i / 20) * TAU) * 9, -210 + Math.sin((i / 20) * TAU) * 9);
    ctx.shadowColor = 'transparent'; ctx.drawImage(ring, -210, -210); ctx.restore();
    // a round sticker
    ctx.save(); ctx.translate(1490, 150); ctx.rotate(0.22); ctx.beginPath(); ctx.arc(0, 0, 66, 0, TAU); ctx.fillStyle = '#FF5C34'; ctx.fill();
    type(ctx, 'free', 0, -4, '800 30px "Bricolage Grotesque"', ink, { align: 'center' }); type(ctx, 'to make', 0, 24, '800 22px "Bricolage Grotesque"', ink, { align: 'center' }); ctx.restore();
    grain(ctx, W, HH, 0.1);
    type(ctx, 'ringcay', 88, 104, '800 36px "Bricolage Grotesque"', ink, { ls: -1.5 });
    type(ctx, 'explore      my island      en / 中文', 660, 100, '400 16px "Special Elite"', ink, { align: 'right' });
    ctx.fillStyle = '#F3E255'; ctx.save(); ctx.translate(86, 468); ctx.rotate(-0.012); ctx.fillRect(-6, 0, 388, 84); ctx.restore();
    EN.forEach((l, i) => type(ctx, l, 84, 336 + i * 100, '800 100px "Bricolage Grotesque"', ink, { ls: -4 }));
    type(ctx, ZH, 88, 650, '900 44px "Noto Sans SC"', ink, { ls: 0.5 });
    type(ctx, 'no. 014 — keep the stories, share the island.', 88, 708, '400 19px "Special Elite"', sub);
    type(ctx, BODY_ZH, 88, 742, '500 17px "Noto Sans SC"', sub, { ls: 0.5 });
    pill(ctx, 88, 786, 216, 58, 29, ink); type(ctx, 'start our ring', 196, 822, '800 18px "Bricolage Grotesque"', '#F2EEE4', { align: 'center', ls: -0.3 });
    pill(ctx, 318, 786, 170, 58, 29, null, ink); type(ctx, '开始做戒指', 403, 822, '900 16px "Noto Sans SC"', ink, { align: 'center', ls: 1 });
    caption(ctx, { label: 'E  —  FILM SCRAPBOOK  ·  胶片手账', sub, palette: ['#F2EEE4', '#A8AF88', '#F3E255', '#FF5C34', '#1F1A16'], swatchLine: 'rgba(31,26,22,.18)', fonts: 'Bricolage Grotesque  ·  Special Elite  ·  思源黑体 Black' });
  }),
};

async function main() {
  const status = document.getElementById('status'), host = document.getElementById('boards');
  const specs = ['italic 500 98px "Bodoni Moda"', '500 36px "Bodoni Moda"', '400 100px "Anton"', '300 90px "Hanken Grotesk"', '400 18px "Hanken Grotesk"', '600 13px "Hanken Grotesk"', '400 100px "Instrument Serif"', 'italic 400 100px "Instrument Serif"', '800 100px "Bricolage Grotesque"', '400 19px "Special Elite"', '400 52px "Nanum Pen Script"'];
  const zh = ZH + BODY_ZH + '开始做戒指中文静奢欧洲夏日白模极简夜色胶片手账思源宋体黑';
  await Promise.all([...specs.map((s) => document.fonts.load(s, 'a ring RINGCAY 0614')), ...['700 42px "Noto Serif SC"', '500 42px "Noto Serif SC"', '900 46px "Noto Sans SC"', '300 42px "Noto Sans SC"', '500 16px "Noto Sans SC"'].map((s) => document.fonts.load(s, zh))]).catch(() => {});
  const saved = [];
  for (const key of Object.keys(BOARDS)) {
    if (only && only !== key) continue;
    status.textContent = 'rendering ' + key + '…';
    await new Promise((r) => setTimeout(r, 30));
    const b = BOARDS[key]();
    const img = new Image(); img.src = b.canvas.toDataURL('image/jpeg', 0.93); img.alt = b.id; host.appendChild(img);
    const blob = await new Promise((r) => b.canvas.toBlob(r, 'image/jpeg', 0.93));
    try { const res = await fetch('/save/' + b.id + '.jpg', { method: 'POST', body: blob }); saved.push(b.id + ':' + res.status); } catch (e) { saved.push(b.id + ':failed'); }
  }
  status.textContent = 'done · ' + saved.join(' · ');
  window.labDone = saved;
}
main().catch((e) => { document.getElementById('status').textContent = 'error: ' + e.message; window.labError = String(e.stack || e); });
