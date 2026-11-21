// The 3D stage: one ring, and the island that grows on it.
// The ring is always the base of the island. Growth g runs 0 (just the ring) to 1 (the full island).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildPiece, animatePiece, clay, setGlow } from './props.js';
import { METALS, STONES, MOTIFS, PIECES, byId } from './catalog.js';
import { t } from './i18n.js';

export const DIM = { RI: 2.62, RO: 3.0, H: 1.2, WATER: 1.2, LAND: 1.34 };
export const ZONES = { land: [2.02, 3.02], shore: [1.62, 1.62], water: [0, 0.95] };
const PROP_SCALE = 1.42;
const TAU = Math.PI * 2;

export const SKIES = {
  day: { css: 'linear-gradient(180deg,#CFEBFF 0%,#E6F5FF 100%)', ink: 'dark', hemi: ['#FFFFFF', '#BFD9C6', 0.92], sun: ['#FFF1D6', 2.9, [5.5, 8, 6]], grass: ['#ABD48E', '#90C47D'], sand: '#F5E7C6', earth: ['#CDA47F', '#A98060'], glow: 0, env: 0.9, exposure: 1.02, shadow: '48,84,128', stars: false, snow: false },
  golden: { css: 'linear-gradient(180deg,#FFC9A3 0%,#FFE3BD 100%)', ink: 'dark', hemi: ['#FFE9D2', '#E8BE95', 0.85], sun: ['#FFBE7D', 3.2, [8.5, 4.6, 3]], grass: ['#CBD68B', '#B4C57A'], sand: '#F7DDB0', earth: ['#C99670', '#A47452'], glow: 0.3, env: 0.75, exposure: 1.0, shadow: '150,70,40', stars: false, snow: false },
  night: { css: 'linear-gradient(180deg,#2A1722 0%,#4B2A47 100%)', ink: 'light', hemi: ['#93A6E0', '#3B2A48', 0.95], sun: ['#C4D2FF', 1.25, [-5, 8, 4]], grass: ['#7FA892', '#6B9682'], sand: '#C9C2B4', earth: ['#8E7468', '#6E5A55'], glow: 1, env: 0.35, exposure: 0.95, shadow: '10,4,12', stars: true, snow: false },
  snow: { css: 'linear-gradient(180deg,#E3EEF5 0%,#F8FBFD 100%)', ink: 'dark', hemi: ['#FFFFFF', '#D3E0EC', 1.05], sun: ['#FFF4E4', 2.4, [5.5, 8, 6]], grass: ['#FAFCFE', '#E8F0F6'], sand: '#EEF1F4', earth: ['#C3B3A6', '#A19184'], glow: 0.45, env: 1.0, exposure: 1.0, shadow: '70,100,130', stars: false, snow: true },
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const seg = (g, a, b) => clamp((g - a) / (b - a), 0, 1);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

const hill = (a, r) => 0.05 * Math.sin(2 * a + 0.4) + 0.03 * Math.sin(5 * a + r * 1.7);
export function heightAt(zone, a, r) {
  if (zone === 'water') return DIM.WATER;
  if (zone === 'shore') return DIM.WATER + 0.09;
  return DIM.LAND + hill(a, r);
}

// A grid swept around the Y axis. nodes(theta) returns [r, y, tag] points along the cross-section.
function sweep(N, nodes, { closed = false, color = null, outerTag = null, flip = false } = {}) {
  const sample = nodes(0);
  const M = sample.length;
  const cols = N + 1;
  const pos = new Float32Array(cols * M * 3);
  const uv = new Float32Array(cols * M * 2);
  const col = color ? new Float32Array(cols * M * 3) : null;
  let yMin = Infinity, yMax = -Infinity;
  for (let i = 0; i < cols; i++) {
    const th = (i / N) * TAU;
    const pts = nodes(th);
    for (let j = 0; j < M; j++) {
      const [r, y, tag] = pts[j];
      const k = i * M + j;
      pos[k * 3] = Math.cos(th) * r; pos[k * 3 + 1] = y; pos[k * 3 + 2] = Math.sin(th) * r;
      uv[k * 2] = 0.75 - i / N; uv[k * 2 + 1] = y / DIM.H;
      if (col) { const c = color(tag, th, r); col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b; }
      yMin = Math.min(yMin, y); yMax = Math.max(yMax, y);
    }
  }
  const outer = [], rest = [];
  const J = closed ? M : M - 1;
  for (let i = 0; i < N; i++) for (let j = 0; j < J; j++) {
    const j2 = (j + 1) % M;
    const a = i * M + j, b = (i + 1) * M + j, c = (i + 1) * M + j2, d = i * M + j2;
    const isOuter = outerTag && sample[j][2] === outerTag && sample[j2][2] === outerTag;
    if (flip) (isOuter ? outer : rest).push(a, b, d, b, c, d);
    else (isOuter ? outer : rest).push(a, d, b, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (col) geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(outer.concat(rest));
  if (outerTag) { geo.addGroup(0, outer.length, 0); geo.addGroup(outer.length, rest.length, 1); }
  geo.computeVertexNormals();
  const n = geo.attributes.normal;
  for (let j = 0; j < M; j++) {
    const a = j, b = N * M + j;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b);
    const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
  }
  geo.userData = { yMin, yMax };
  return geo;
}

function bandGeometry(style) {
  const { RI, RO, H } = DIM;
  const K = 10;
  const N = style === 'twist' ? 240 : 180;
  return sweep(N, (th) => {
    let y0 = 0, y1 = H, ro = RO, bulge = 0.1, inset = 0.06;
    if (style === 'flat') { bulge = 0.012; inset = 0.012; }
    if (style === 'slim') { y0 = H * 0.46; ro = RO - 0.05; bulge = 0.07; inset = 0.05; }
    if (style === 'scallop') { const w = 0.085 * Math.abs(Math.cos(7 * th)); y0 = 0.1 - w; y1 = H - 0.1 + w; }
    const pts = [];
    for (let k = 0; k <= K; k++) {
      const t = k / K, y = y0 + (y1 - y0) * t;
      let r = ro - inset + bulge * Math.sin(Math.PI * t);
      if (style === 'flat') r = ro - (t < 0.06 || t > 0.94 ? 0.03 : 0);
      if (style === 'twist') r += 0.055 * Math.cos(11 * th + 5.2 * y) * Math.sin(Math.PI * t);
      pts.push([r, y, 'out']);
    }
    pts.push([RI + 0.05, y1, 'in'], [RI, y1 - 0.05, 'in'], [RI, y0 + 0.05, 'in'], [RI + 0.05, y0, 'in']);
    return pts;
  }, { closed: true, outerTag: 'out' });
}

function terrainGeometry(sky) {
  const { WATER: W, LAND: L } = DIM;
  const cg1 = new THREE.Color(sky.grass[0]), cg2 = new THREE.Color(sky.grass[1]), cs = new THREE.Color(sky.sand);
  const ce1 = new THREE.Color(sky.earth[0]), ce2 = new THREE.Color(sky.earth[1]), tmp = new THREE.Color();
  return sweep(144, (th) => {
    const e = 0.09 * Math.sin(3 * th + 0.7) + 0.055 * Math.sin(7 * th + 2.1) + 0.03 * Math.sin(11 * th);
    const ei = 0.05 * Math.sin(4 * th + 1.3) + 0.03 * Math.sin(9 * th);
    const g = (r) => [r, L + hill(th, r), 'grass'];
    return [
      [1.38 + ei, W - 0.2, 'sand'], [1.52 + ei, W - 0.01, 'sand'], [1.66 + ei, W + 0.08, 'sand'],
      [1.82 + ei * 0.5, L - 0.02 + hill(th, 1.82), 'grass'],
      g(2.1), g(2.45), g(2.8), g(3.05),
      [3.27 + e, L + hill(th, 3.3) * 0.5 - 0.005, 'grass'],
      [3.4 + e, L - 0.07, 'rim'],
      [3.39 + e, L - 0.16, 'earth'],
      [3.2 + e * 0.5, W - 0.06, 'earth2'],
      [3.035, W - 0.15, 'earth2'],
    ];
  }, {
    flip: true,
    color: (tag, th, r) => {
      if (tag === 'sand') return cs;
      if (tag === 'earth') return ce1;
      if (tag === 'earth2') return ce2;
      if (tag === 'rim') return tmp.copy(cg2).multiplyScalar(0.9);
      return tmp.copy(cg1).lerp(cg2, 0.5 + 0.5 * Math.sin(5 * th + r * 3.1));
    },
  });
}

function engraving(ring) {
  const W = 2048, Hh = 256, squash = 0.51;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = Hh; return c; };
  const cm = mk(), cb = mk();
  const m = cm.getContext('2d'), b = cb.getContext('2d');
  m.fillStyle = '#fff'; m.fillRect(0, 0, W, Hh);
  b.fillStyle = '#fff'; b.fillRect(0, 0, W, Hh);
  if (ring.finish === 'hammered') {
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 520; i++) {
      const x = rnd() * W, y = rnd() * Hh, r = 14 + rnd() * 16;
      const gr = b.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(0,0,0,.34)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      b.fillStyle = gr; b.fillRect(x - r, y - r, r * 2, r * 2);
      if (x < 40) { b.fillRect(x + W - r, y - r, r * 2, r * 2); }
    }
  }
  if (ring.finish === 'brushed') {
    b.globalAlpha = 0.16;
    for (let y = 0; y < Hh; y += 2) { b.fillStyle = y % 4 ? '#000' : '#888'; b.fillRect(0, y + ((y * 7) % 3) - 1, W, 1); }
    b.globalAlpha = 1;
  }
  const glyph = byId(MOTIFS, ring.motif).glyph + '︎';
  const text = (ring.text || '').trim();
  const centerTheta = ring.stone && ring.stone !== 'none' ? Math.PI / 2 - 1.0 : Math.PI / 2;
  const cx = (0.75 - centerTheta / TAU) * W;
  const draw = (ctx, fill) => {
    ctx.fillStyle = fill; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const at = (x, fn) => { for (const dx of [-W, 0, W]) { ctx.save(); ctx.translate(x + dx, Hh * 0.52); ctx.scale(squash, 1); fn(); ctx.restore(); } };
    let half = 0;
    if (text) {
      ctx.font = 'italic 600 96px Georgia, "Times New Roman", "Songti SC", "SimSun", serif';
      half = (ctx.measureText(text).width * squash) / 2;
      at(cx, () => { ctx.font = 'italic 600 96px Georgia, "Times New Roman", "Songti SC", "SimSun", serif'; ctx.fillText(text, 0, 0); });
    }
    const gap = text ? half + 56 : 0;
    const sym = () => { ctx.font = '84px "Apple Symbols","Segoe UI Symbol","Noto Sans Symbols 2",serif'; ctx.fillText(glyph, 0, 4); };
    if (text) { at(cx - gap, sym); at(cx + gap, sym); } else at(cx, sym);
    for (let i = 1; i < 12; i++) {
      const x = cx + (i / 12) * W;
      const d = Math.min(Math.abs(((x - cx) % W + W) % W), W - (((x - cx) % W + W) % W));
      if (d < gap + 90) continue;
      at(x, () => { ctx.beginPath(); ctx.arc(0, 0, i % 3 === 0 ? 15 : 8, 0, TAU); ctx.fill(); });
    }
  };
  draw(m, 'rgba(74,40,16,.6)');
  draw(b, '#000');
  const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { map: tex(cm, true), bump: tex(cb, false) };
}

function blobShadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 20, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function markerTexture(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.beginPath(); x.arc(64, 56, 44, 0, TAU); x.fillStyle = '#fff'; x.fill();
  x.beginPath(); x.moveTo(46, 92); x.lineTo(64, 122); x.lineTo(82, 92); x.closePath(); x.fill();
  x.fillStyle = kind === 'open' ? '#FF5C34' : '#351E28';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  if (kind === 'open') {
    x.beginPath();
    x.moveTo(64, 80); x.bezierCurveTo(22, 52, 44, 22, 64, 44); x.bezierCurveTo(84, 22, 106, 52, 64, 80); x.fill();
  } else {
    x.lineWidth = 7; x.strokeStyle = '#351E28';
    x.beginPath(); x.arc(64, 48, 13, Math.PI, 0); x.stroke();
    x.beginPath(); x.roundRect(44, 48, 40, 30, 7); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let shared = null;
function sharedAssets() {
  if (!shared) shared = { shadow: blobShadowTexture(), open: markerTexture('open'), locked: markerTexture('locked') };
  return shared;
}

export class World {
  constructor(canvas, { still = false } = {}) {
    this.canvas = canvas;
    this.still = still;
    this.listeners = {};
    this.items = new Map();
    this.g = 0; this.gFrom = 0; this.gTo = 0; this.gT = 1; this.gDur = 1;
    this.mode = 'ring';
    this.spinFrom = 0;
    this.autoRotate = false;
    this.readOnly = false;
    this.fit = 1;
    this.selected = null;
    this.clock = new THREE.Clock();

    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: still }));
    r.setPixelRatio(still ? 2 : Math.min(window.devicePixelRatio || 1, 2));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.NeutralToneMapping;
    r.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(r);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();

    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);
    this.target = new THREE.Vector3(0, 0.8, 0);

    this.hemi = new THREE.HemisphereLight('#fff', '#ccc', 1);
    this.sun = new THREE.DirectionalLight('#fff', 2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(still ? 1024 : 2048, still ? 1024 : 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -5.5; sc.right = 5.5; sc.top = 5.5; sc.bottom = -5.5; sc.near = 1; sc.far = 34;
    this.sun.shadow.bias = -0.0005; this.sun.shadow.normalBias = 0.03; this.sun.shadow.radius = 5;
    this.fill = new THREE.DirectionalLight('#fff', 0.35);
    this.fill.position.set(-6, 3, -5);
    this.scene.add(this.hemi, this.sun, this.sun.target, this.fill);

    const A = sharedAssets();
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(11, 11).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: A.shadow, transparent: true, depthWrite: false, opacity: 0.3 }));
    this.blob.position.y = -0.04;
    this.scene.add(this.blob);

    this.ringRoot = new THREE.Group();   // tilts while it is "just a ring"
    this.spinner = new THREE.Group();    // spins about the ring's own axis
    this.island = new THREE.Group();     // everything that grows
    this.pieces = new THREE.Group();
    this.ringRoot.add(this.spinner);
    this.spinner.add(this.island);
    this.island.add(this.pieces);
    this.scene.add(this.ringRoot);

    this.metal = new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.2, envMapIntensity: 1.2 });
    this.metalPlain = new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.2, envMapIntensity: 1.2 });
    this.terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, envMapIntensity: 0.35 });
    this.waterMat = new THREE.MeshStandardMaterial({ color: '#8FD3CF', roughness: 0.1, metalness: 0, transparent: true, opacity: 0.8, envMapIntensity: 1.5 });

    const floor = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48).rotateX(-Math.PI / 2), clay('#F1E6CC'));
    floor.position.y = DIM.WATER - 0.2;
    this.water = new THREE.Mesh(new THREE.CircleGeometry(1.7, 64).rotateX(-Math.PI / 2), this.waterMat);
    this.water.position.y = DIM.WATER;
    this.water.receiveShadow = true;
    this.lagoon = new THREE.Group();
    this.lagoon.add(floor, this.water);
    this.ripples = [];
    for (let i = 0; i < 3; i++) {
      const rp = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.225, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0, depthWrite: false }));
      rp.position.set(Math.cos(i * 2.3 + 0.4) * 0.75, DIM.WATER + 0.004, Math.sin(i * 2.3 + 0.4) * 0.75);
      this.ripples.push(rp); this.lagoon.add(rp);
    }
    for (const [a, rr, s] of [[0.7, 1.1, 0.1], [0.95, 1.22, 0.07], [3.6, 1.05, 0.085]]) {
      const pad = new THREE.Mesh(new THREE.CircleGeometry(s, 16, 0.5, TAU - 0.9).rotateX(-Math.PI / 2), clay('#8FBF8A'));
      pad.position.set(Math.cos(a) * rr, DIM.WATER + 0.006, Math.sin(a) * rr);
      pad.rotation.y = a * 3;
      this.lagoon.add(pad);
    }
    this.island.add(this.lagoon);

    this.selRing = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.56, 56).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#FF5C34', transparent: true, opacity: 0.9, depthTest: false }));
    this.selRing.renderOrder = 5; this.selRing.visible = false;
    this.island.add(this.selRing);

    this.stars = null; this.snow = null;
    this.ringCfg = null; this.sceneId = 'day'; this.sky = SKIES.day;

    if (!still) {
      this.controls = new OrbitControls(this.camera, canvas);
      Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minPolarAngle: 0.35, maxPolarAngle: 1.42, rotateSpeed: 0.7, zoomSpeed: 0.7 });
      this.controls.target.copy(this.target);
      this._bindPointer();
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(canvas.parentElement);
      this._loop = this._loop.bind(this);
      this._raf = requestAnimationFrame(this._loop);
    }
    this.setScene('day');
    this._pose(0, true);
  }

  on(name, fn) { this.listeners[name] = fn; }
  _emit(name, ...a) { if (this.listeners[name]) this.listeners[name](...a); }

  // ---------- ring ----------
  setRing(ring) {
    const prev = this.ringCfg || {};
    this.ringCfg = { ...ring };
    if (prev.style !== ring.style || !this.band) {
      if (this.band) { this.spinner.remove(this.band); this.band.geometry.dispose(); }
      this.band = new THREE.Mesh(bandGeometry(ring.style), [this.metal, this.metalPlain]);
      this.band.castShadow = true; this.band.receiveShadow = true;
      this.spinner.add(this.band);
    }
    const metal = byId(METALS, ring.metal);
    const rough = { polished: 0.16, brushed: 0.42, hammered: 0.26 }[ring.finish] ?? 0.2;
    for (const m of [this.metal, this.metalPlain]) { m.color.set(metal.color); m.roughness = rough; }
    if (this.metal.map) { this.metal.map.dispose(); this.metal.bumpMap.dispose(); }
    const e = engraving(ring);
    this.metal.map = e.map; this.metal.bumpMap = e.bump; this.metal.bumpScale = ring.finish === 'hammered' ? 2.2 : 1.6;
    this.metal.needsUpdate = true;

    if (this.gem) { this.spinner.remove(this.gem); this.gem = null; }
    const stone = byId(STONES, ring.stone);
    if (stone.color) {
      const g = new THREE.Group();
      const { yMin, yMax } = this.band.geometry.userData;
      const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.13, 28).rotateX(Math.PI / 2), this.metalPlain);
      const gemMat = new THREE.MeshPhysicalMaterial({ color: stone.color, emissive: stone.color, emissiveIntensity: 0.22, roughness: 0.02, metalness: 0, flatShading: true, envMapIntensity: 3.4, clearcoat: 1, ior: 2.2, reflectivity: 1 });
      const gem = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.158, 0.085, 8).rotateX(Math.PI / 2), gemMat);
      const girdle = new THREE.Mesh(new THREE.CylinderGeometry(0.158, 0.12, 0.03, 8).rotateX(Math.PI / 2), gemMat);
      gem.position.z = 0.105; girdle.position.z = 0.05; gem.rotation.z = girdle.rotation.z = Math.PI / 8;
      bezel.castShadow = gem.castShadow = true;
      g.add(bezel, girdle, gem);
      g.position.set(0, (yMin + yMax) / 2, DIM.RO + 0.03);
      this.gem = g;
      this.spinner.add(g);
    }
    this.waterMat.color.set(stone.water);
    this._bandBase = this.band.geometry.userData.yMin;
    this._signs().forEach((it) => this._rebuildItem(it.data));
  }

  // ---------- sky ----------
  setScene(id) {
    this.sceneId = SKIES[id] ? id : 'day';
    const s = (this.sky = SKIES[this.sceneId]);
    this.hemi.color.set(s.hemi[0]); this.hemi.groundColor.set(s.hemi[1]); this.hemi.intensity = s.hemi[2];
    this.sun.color.set(s.sun[0]); this.sun.intensity = s.sun[1]; this.sun.position.set(...s.sun[2]).multiplyScalar(1.6);
    this.fill.color.set(s.hemi[0]); this.fill.intensity = s.stars ? 0.5 : 0.3;
    this.scene.environmentIntensity = s.env;
    this.renderer.toneMappingExposure = s.exposure;
    this.blob.material.color.set(`rgb(${s.shadow})`);
    if (this.terrain) { this.island.remove(this.terrain); this.terrain.geometry.dispose(); }
    this.terrain = new THREE.Mesh(terrainGeometry(s), this.terrainMat);
    this.terrain.castShadow = true; this.terrain.receiveShadow = true;
    this.island.add(this.terrain);
    this._scatter(s);

    if (this.stars) { this.scene.remove(this.stars); this.stars.geometry.dispose(); this.stars = null; }
    if (s.stars) {
      const n = 420, p = new Float32Array(n * 3);
      let seed = 20261120;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < n; i++) {
        const a = rnd() * TAU, h = -0.8 + rnd() * 1.75, R = 40;
        p[i * 3] = Math.cos(a) * Math.sqrt(1 - h * h) * R; p[i * 3 + 1] = h * R; p[i * 3 + 2] = Math.sin(a) * Math.sqrt(1 - h * h) * R;
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
      this.stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#FFF3CF', size: 0.46, sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false }));
      this.scene.add(this.stars);
    }
    if (this.snow) { this.scene.remove(this.snow); this.snow.geometry.dispose(); this.snow = null; }
    if (s.snow) {
      const n = 300, p = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const a = (i * 2.399963) % TAU, rr = 0.5 + ((i * 0.754877) % 1) * 5.5; p[i * 3] = Math.cos(a) * rr; p[i * 3 + 1] = ((i * 0.569840) % 1) * 7; p[i * 3 + 2] = Math.sin(a) * rr; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
      this.snow = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#fff', size: 0.075, transparent: true, opacity: 0.95, depthWrite: false }));
      this.scene.add(this.snow);
    }
    this._applyGrowth();
  }

  // Small things the island grows by itself, so it never looks bare: tufts, pebbles, shrubs, two clouds.
  _scatter(s) {
    if (this.decor) { this.island.remove(this.decor); this.scene.remove(this.clouds); }
    const d = (this.decor = new THREE.Group());
    const tuft = new THREE.ConeGeometry(0.035, 0.13, 5), peb = new THREE.IcosahedronGeometry(0.07, 1), shrub = new THREE.IcosahedronGeometry(0.13, 2), bud = new THREE.IcosahedronGeometry(0.028, 1);
    const g1 = clay(s.snow ? '#DDE9E4' : s.stars ? '#5E8F78' : '#86BC78'), g2 = clay(s.snow ? '#C9DBD3' : s.stars ? '#547F6E' : '#74AD72');
    const rock = clay(s.snow ? '#E3E6EA' : '#D5CEC3'), petal = [clay('#FFFFFF'), clay('#F8E9A8'), clay('#F6B9C8')];
    const put = (m, a, r, y = 0) => { m.position.set(Math.cos(a) * r, heightAt('land', a, r) + y, Math.sin(a) * r); m.castShadow = true; m.receiveShadow = true; d.add(m); return m; };
    for (let k = 0; k < 40; k++) {
      const a = k * 2.399963 + 0.3, edge = k % 3 === 0 ? 1.92 + (k % 5) * 0.03 : 3.1 + ((k * 7) % 5) * 0.035, kind = k % 4;
      if (kind === 0) { const m = put(new THREE.Mesh(peb, rock), a, edge, 0.02); m.scale.set(1 + (k % 3) * 0.3, 0.6, 0.9); m.rotation.y = k; }
      else if (kind === 1) for (let j = 0; j < 3; j++) { const m = put(new THREE.Mesh(tuft, j % 2 ? g1 : g2), a + (j - 1) * 0.022, edge + (j % 2) * 0.04, 0.06); m.rotation.z = (j - 1) * 0.28; }
      else if (kind === 2) { const m = put(new THREE.Mesh(shrub, k % 8 < 4 ? g1 : g2), a, edge + 0.02, 0.06); m.scale.set(1.15, 0.8, 1); if (!s.snow) put(new THREE.Mesh(bud, petal[k % 3]), a + 0.02, edge + 0.03, 0.17); }
      else for (let j = 0; j < 2; j++) put(new THREE.Mesh(bud, petal[(k + j) % 3]), a + j * 0.05, edge - 0.05 * j, 0.03).castShadow = false;
    }
    this.island.add(d);
    const cl = (this.clouds = new THREE.Group());
    const puff = new THREE.IcosahedronGeometry(1, 3), white = new THREE.MeshStandardMaterial({ color: s.stars ? '#8E86A8' : '#FFFFFF', roughness: 1, envMapIntensity: 0.2, transparent: true, opacity: s.stars ? 0.55 : 0.96 });
    for (const [off, r, y, sc] of [[-0.62, 5.4, 2.7, 0.36], [0.6, 5.7, 3.3, 0.27], [0.04, 6.2, 4.1, 0.2]]) {
      const a = 4.712 + off;
      const c = new THREE.Group();
      for (const [x, yy, z, q] of [[0, 0, 0, 1], [0.95, -0.12, 0.1, 0.72], [-0.9, -0.16, -0.05, 0.66], [0.2, 0.42, -0.1, 0.62]]) { const m = new THREE.Mesh(puff, white); m.position.set(x, yy, z); m.scale.set(q, q * 0.72, q * 0.8); c.add(m); }
      c.position.set(Math.cos(a) * r, y, Math.sin(a) * r); c.scale.setScalar(sc); c.userData = { off, r, y, sc };
      cl.add(c);
    }
    this.scene.add(cl);
  }

  // ---------- pieces ----------
  _signs() { return [...this.items.values()].filter((it) => it.data.type === 'signpost'); }

  _place(it) {
    const d = it.data, def = byId(PIECES, d.type);
    it.root.position.set(Math.cos(d.a) * d.r, heightAt(def.zone, d.a, d.r), Math.sin(d.a) * d.r);
    it.root.rotation.y = Math.PI / 2 - d.a + (d.rot || 0);
  }

  _rebuildItem(data) {
    const old = this.items.get(data.id);
    if (old) { this.pieces.remove(old.root); if (old.model.userData.dispose) old.model.userData.dispose(); }
    const root = new THREE.Group();
    const model = buildPiece(data.type, { text: this.ringCfg && this.ringCfg.text });
    root.add(model);
    const h = new THREE.Box3().setFromObject(model).max.y;
    const A = sharedAssets();
    const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: A.open, depthTest: false, transparent: true }));
    marker.scale.setScalar(0.34); marker.position.y = h + 0.3; marker.renderOrder = 10; marker.visible = false;
    root.add(marker);
    root.userData.itemId = data.id;
    const it = { data: { ...data }, root, model, marker, h, pop: old ? old.pop : 1, phase: (this.items.size * 1.7) % TAU, order: old ? old.order : this.items.size };
    this.items.set(data.id, it);
    this.pieces.add(root);
    this._place(it);
    this._mark(it);
    return it;
  }

  _mark(it) {
    const m = it.data.memory;
    const has = m && (m.title || m.story || m.photo || m.hasPhoto);
    it.marker.visible = !!has;
    if (has) it.marker.material.map = m.public || this.readOnly ? sharedAssets().open : sharedAssets().locked;
  }

  // items: [{ id, type, a, r, rot, memory }]. Adds, removes and moves to match.
  syncItems(list) {
    const seen = new Set();
    for (const d of list) {
      seen.add(d.id);
      const it = this.items.get(d.id);
      if (!it || it.data.type !== d.type) this._rebuildItem(d);
      else { it.data = { ...d }; this._place(it); this._mark(it); }
    }
    for (const [id, it] of this.items) if (!seen.has(id)) {
      this.pieces.remove(it.root);
      if (it.model.userData.dispose) it.model.userData.dispose();
      this.items.delete(id);
    }
    let k = 0;
    for (const it of this.items.values()) it.order = k++;
    if (this.selected && !this.items.has(this.selected)) this.select(null, true);
    this._applyGrowth();
  }

  pop(id) { const it = this.items.get(id); if (it) it.pop = 0; }

  select(id, silent) {
    this.selected = id && this.items.has(id) ? id : null;
    this.selRing.visible = !!this.selected && !this.readOnly;
    if (!silent) this._emit('select', this.selected);
  }

  freeSpot(zone) {
    if (zone === 'water') { const n = [...this.items.values()].filter((i) => byId(PIECES, i.data.type).zone === 'water').length; return { a: 1.2 + n * 2.1, r: 0.55 }; }
    const taken = [...this.items.values()].filter((i) => byId(PIECES, i.data.type).zone === zone).map((i) => i.data.a);
    let best = Math.PI / 2 + 0.5, gap = -1;
    for (let k = 0; k < 48; k++) {
      const a = (k / 48) * TAU;
      let d = Math.PI;
      for (const t of taken) { const x = Math.abs(((a - t + Math.PI) % TAU + TAU) % TAU - Math.PI); d = Math.min(d, x); }
      const front = 0.25 * Math.cos(a - Math.PI / 2 - 0.3);
      if (d + front > gap) { gap = d + front; best = a; }
    }
    return { a: best, r: zone === 'shore' ? ZONES.shore[0] : taken.length % 2 ? 2.85 : 2.4 };
  }

  // ---------- ring <-> island ----------
  setMode(mode, { animate = true } = {}) {
    this.mode = mode;
    const to = mode === 'island' ? 1 : 0;
    if (!animate || this.still) { this.g = this.gTo = this.gFrom = to; this.gT = 1; this.spinner.rotation.y = 0; this._applyGrowth(); this._pose(to, true); return; }
    this.gFrom = this.g; this.gTo = to; this.gT = 0;
    this.gDur = Math.max(0.6, Math.abs(to - this.g) * (to ? 3.6 : 2.2));
    this.spinFrom = this.spinner.rotation.y;
    this.camFrom = { pos: this.camera.position.clone(), target: this.controls.target.clone() };
    this.controls.enabled = false;
    this.select(null);
  }

  _poseFor(g) {
    const e = easeInOut(seg(g, 0, 0.75));
    const az = 0.42 + 0.2 * e, el = 0.34 + 0.19 * e, dist = (14.8 + 1.8 * e) * this.fit, ty = 1.45 - 0.25 * e;
    return { pos: new THREE.Vector3(dist * Math.cos(el) * Math.sin(az), ty + dist * Math.sin(el), dist * Math.cos(el) * Math.cos(az)), target: new THREE.Vector3(0, ty, 0) };
  }

  _pose(g, snap) {
    const p = this._poseFor(g);
    if (snap) { this.camera.position.copy(p.pos); this.target.copy(p.target); if (this.controls) { this.controls.target.copy(p.target); this.controls.update(); } else this.camera.lookAt(p.target); }
    return p;
  }

  _applyGrowth() {
    const g = this.g;
    const tilt = 1 - easeInOut(seg(g, 0, 0.42));
    this.ringRoot.rotation.x = 0.6 * tilt;
    this.ringRoot.rotation.z = -0.2 * tilt;
    this.ringRoot.position.y = 0.95 * tilt - (this._bandBase || 0);
    const w = easeOut(seg(g, 0.3, 0.58));
    this.lagoon.visible = w > 0.001; this.lagoon.scale.set(w, 1, w);
    const t = seg(g, 0.44, 0.8);
    if (this.terrain) { this.terrain.visible = t > 0.001; const s = 0.9 + 0.1 * easeOut(t); this.terrain.scale.set(s, Math.max(0.001, easeBack(t)), s); this.terrain.position.y = (DIM.H - 0.15) * (1 - Math.max(0.001, easeBack(t))); }
    if (this.decor) { const ds = easeBack(seg(g, 0.6, 0.86)); this.decor.visible = ds > 0.001; this.decor.scale.set(1, Math.max(0.001, ds), 1); this.decor.position.y = DIM.LAND * (1 - Math.max(0.001, ds)); }
    if (this.clouds) { const cs = easeOut(seg(g, 0.7, 1)); this.clouds.visible = cs > 0.001; this.clouds.children.forEach((c) => c.scale.setScalar(c.userData.sc * cs)); this.clouds.position.y = -(this._bandBase || 0); }
    const n = Math.max(1, this.items.size);
    for (const it of this.items.values()) {
      const a = 0.66 + (it.order / n) * 0.2;
      const s = easeBack(seg(g, a, a + 0.14)) * easeBack(clamp(it.pop, 0, 1));
      it.root.visible = s > 0.001;
      it.root.scale.setScalar(Math.max(0.001, s) * PROP_SCALE);
    }
    this.blob.material.opacity = 0.2 + 0.14 * easeOut(seg(g, 0, 0.6));
    const bs = 0.72 + 0.28 * easeOut(seg(g, 0.2, 0.8));
    this.blob.scale.set(bs, 1, bs);
    this.blob.position.y = -0.04 - (this._bandBase || 0);
    this.selRing.visible = this.selRing.visible && g > 0.95;
  }

  // ---------- frame ----------
  resize() {
    const p = this.canvas.parentElement;
    const w = Math.max(2, p.clientWidth), h = Math.max(2, p.clientHeight);
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
    this.camera.aspect = w / h;
    const fit = clamp(0.98 / this.camera.aspect, 1, 2.2);
    if (Math.abs(fit - this.fit) > 0.001) {
      const off = this.camera.position.clone().sub(this.controls.target).multiplyScalar(fit / this.fit);
      this.camera.position.copy(this.controls.target).add(off);
      this.fit = fit;
    }
    this.controls.minDistance = 6 * this.fit; this.controls.maxDistance = 24 * this.fit;
    this.camera.updateProjectionMatrix();
  }

  _tick(dt, time) {
    if (this.gT < 1) {
      this.gT = Math.min(1, this.gT + dt / this.gDur);
      this.g = this.gFrom + (this.gTo - this.gFrom) * this.gT;
      const k = easeInOut(seg(this.gT, 0, 0.45));
      const near = Math.round(this.spinFrom / TAU) * TAU;
      this.spinner.rotation.y = this.gTo ? this.spinFrom + (near - this.spinFrom) * k : this.spinner.rotation.y;
      const p = this._poseFor(this.g), c = easeInOut(seg(this.gT, 0, 0.8));
      this.camera.position.lerpVectors(this.camFrom.pos, p.pos, c);
      this.controls.target.lerpVectors(this.camFrom.target, p.target, c);
      this.camera.lookAt(this.controls.target);
      if (this.gT >= 1) { this.controls.enabled = true; this._emit('grown', this.mode); }
      this._applyGrowth();
    } else if (this.mode === 'ring' && !this._userDown) {
      this.spinner.rotation.y += dt * 0.32;
    }
    let popping = false;
    for (const it of this.items.values()) {
      if (it.pop < 1) { it.pop = Math.min(1, it.pop + dt / 0.5); popping = true; }
      animatePiece(it.model, time, it.phase);
      if (it.marker.visible) it.marker.position.y = it.h + 0.3 + Math.sin(time * 2 + it.phase) * 0.035;
    }
    if (popping) this._applyGrowth();
    this.ripples.forEach((rp, i) => { const u = (time * 0.28 + i / 3) % 1; rp.scale.setScalar(0.5 + u * 2.4); rp.material.opacity = 0.5 * (1 - u) * Math.min(1, u * 6); });
    if (this.selected && this.items.has(this.selected) && !this.readOnly) {
      const it = this.items.get(this.selected);
      this.selRing.visible = this.g > 0.95;
      this.selRing.position.copy(it.root.position); this.selRing.position.y += 0.03;
      const s = 1 + Math.sin(time * 4) * 0.04;
      this.selRing.scale.set(s, 1, s);
    }
    if (this.clouds) {
      // Clouds sit on the far side of the island from wherever the camera is, so they never cover it.
      const back = Math.atan2(this.camera.position.z, this.camera.position.x) + Math.PI;
      this.clouds.children.forEach((c, i) => { const a = back + c.userData.off + Math.sin(time * 0.07 + i * 2) * 0.16; c.position.set(Math.cos(a) * c.userData.r, c.userData.y + Math.sin(time * 0.4 + i) * 0.06, Math.sin(a) * c.userData.r); c.rotation.y = -a; });
    }
    if (this.snow) {
      const p = this.snow.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) { let y = p.getY(i) - dt * (0.45 + (i % 5) * 0.06); if (y < -0.2) y = 7; p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(time + i) * 0.0015); }
      p.needsUpdate = true;
    }
    if (this.controls) {
      this.controls.autoRotate = this.autoRotate && this.mode === 'island' && this.gT >= 1 && !this.dragging;
      this.controls.autoRotateSpeed = 0.55;
      if (this.gT >= 1) this.controls.update();
    }
  }

  render() { setGlow(this.sky.glow); this.renderer.render(this.scene, this.camera); }

  _loop() {
    this._raf = requestAnimationFrame(this._loop);
    if (document.hidden || this.paused) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    this._tick(dt, this.clock.elapsedTime);
    this.render();
  }

  // ---------- pointer: tap to select, drag a piece to move it ----------
  _bindPointer() {
    const ray = new THREE.Raycaster(), v = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -DIM.LAND), hit = new THREE.Vector3();
    const ndc = (e) => { const b = this.canvas.getBoundingClientRect(); v.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); ray.setFromCamera(v, this.camera); };
    const pick = (e) => {
      ndc(e);
      const hits = ray.intersectObjects(this.pieces.children, true);
      for (const h of hits) { let o = h.object; if (o.isSprite && !o.visible) continue; while (o && !o.userData.itemId) o = o.parent; if (o && o.visible) return o.userData.itemId; }
      return null;
    };
    let down = null;
    this.canvas.addEventListener('pointerdown', (e) => {
      this._userDown = true;
      if (this.mode !== 'island' || this.gT < 1) return;
      const id = pick(e);
      down = { x: e.clientX, y: e.clientY, id, moved: false };
      if (id && !this.readOnly) { this.controls.enabled = false; this.canvas.setPointerCapture(e.pointerId); }
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!down) { if (this.mode === 'island' && e.pointerType === 'mouse') this.canvas.style.cursor = pick(e) ? 'pointer' : 'grab'; return; }
      if (!down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) {
        down.moved = true;
        if (down.id && !this.readOnly) {
          this.dragging = true;
          if (this.selected !== down.id) this.select(down.id);
          // Remember where on the piece it was grabbed, so it does not jump under the finger.
          const p0 = this.items.get(down.id).root.position;
          ndc({ clientX: down.x, clientY: down.y });
          down.off = ray.ray.intersectPlane(plane, hit) ? { x: p0.x - hit.x, z: p0.z - hit.z } : { x: 0, z: 0 };
          if (Math.hypot(down.off.x, down.off.z) > 1.2) down.off = { x: 0, z: 0 };
        }
      }
      if (this.dragging && down.id) {
        ndc(e);
        if (ray.ray.intersectPlane(plane, hit)) {
          const it = this.items.get(down.id), zone = byId(PIECES, it.data.type).zone, [r0, r1] = ZONES[zone];
          const hx = hit.x + down.off.x, hz = hit.z + down.off.z;
          it.data.a = Math.atan2(hz, hx);
          it.data.r = clamp(Math.hypot(hx, hz), r0, r1);
          this._place(it);
          this._emit('move', down.id, it.data.a, it.data.r);
        }
      }
    });
    const up = (e) => {
      this._userDown = false;
      if (!down) return;
      if (this.dragging) { this.dragging = false; this._emit('moveEnd', down.id); }
      else if (!down.moved) this.select(down.id);
      if (this.gT >= 1) this.controls.enabled = true;
      down = null;
    };
    this.canvas.addEventListener('pointerup', up);
    this.canvas.addEventListener('pointercancel', up);
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    if (this._ro) this._ro.disconnect();
    if (this.controls) this.controls.dispose();
    this.renderer.dispose();
  }
}

// One hidden renderer that paints stills: island cards for Explore, and little icons for each piece.
export class Darkroom {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.world = new World(this.canvas, { still: true });
    this.world.readOnly = true;
    this.iconScene = new THREE.Scene();
    this.iconScene.environment = this.world.scene.environment;
    this.iconScene.environmentIntensity = 0.8;
    const sun = new THREE.DirectionalLight('#FFF3DD', 2.4); sun.position.set(3, 6, 5);
    this.iconScene.add(new THREE.HemisphereLight('#fff', '#CFE0D4', 1.3), sun);
    this.iconCam = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  }

  island(look, w, h, { mode = 'island', az = 0.62, el = 0.52, zoom = 1 } = {}) {
    const W = this.world;
    W.renderer.setSize(w, h, false);
    W.camera.aspect = w / h;
    W.fit = clamp(0.98 / W.camera.aspect, 1, 2.2);
    W.setScene(look.scene || 'day');
    W.setRing(look.ring);
    W.syncItems(mode === 'island' ? look.items || [] : []);
    W.setMode(mode, { animate: false });
    const g = mode === 'island' ? 1 : 0;
    const ty = g ? 1.2 : 1.45, dist = ((g ? 16.6 : 14.8) * W.fit) / zoom;
    if (!g) { az = 0.42; el = 0.34; }
    W.camera.position.set(dist * Math.cos(el) * Math.sin(az), ty + dist * Math.sin(el), dist * Math.cos(el) * Math.cos(az));
    W.camera.lookAt(0, ty, 0);
    W.camera.updateProjectionMatrix();
    W._tick(0, 1.3);
    W.render();
    return this.canvas.toDataURL('image/png');
  }

  icon(type, size = 168) {
    const W = this.world;
    W.renderer.setSize(size, size, false);
    const model = buildPiece(type, { text: t('hello') });
    const box = new THREE.Box3().setFromObject(model);
    const c = box.getCenter(new THREE.Vector3()), R = box.getSize(new THREE.Vector3()).length() / 2;
    this.iconScene.add(model);
    const d = (R / Math.sin((26 * Math.PI) / 360)) * 1.04, az = type === 'dock' ? 2.5 : 0.6, el = 0.4;
    this.iconCam.position.set(c.x + d * Math.cos(el) * Math.sin(az), c.y + d * Math.sin(el), c.z + d * Math.cos(el) * Math.cos(az));
    this.iconCam.lookAt(c);
    setGlow(0.15);
    W.renderer.render(this.iconScene, this.iconCam);
    this.iconScene.remove(model);
    if (model.userData.dispose) model.userData.dispose();
    return this.canvas.toDataURL('image/png');
  }
}
