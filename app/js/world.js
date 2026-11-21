// The 3D stage: one ring, and the island that grows on it.
// The island takes its shape from the ring (see `form` in catalog.js). Growth g runs 0 (just the ring) to 1 (ring + island).
// Pieces stand on "surfaces": round islets or one flat lawn. A piece is stored as { s: which surface, x, z } on it.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TAU, RI, M, box, paint, islet, makePiece } from './kit.js';
import { buildRing } from './rings.js';
import { crystalOf } from './catalog.js';

// Night runs from 18:30 to 06:30 on the visitor's own clock.
export function isNight(d = new Date()) { const h = d.getHours() + d.getMinutes() / 60; return h < 6.5 || h >= 18.5; }

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const seg = (g, a, b) => clamp((g - a) / (b - a), 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeBack = (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const NIGHT_GRASS = ['#3E9E78', '#2E8A72'];

function markerTexture(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.beginPath(); x.arc(64, 56, 44, 0, TAU); x.fillStyle = '#fff'; x.fill();
  x.beginPath(); x.moveTo(46, 92); x.lineTo(64, 122); x.lineTo(82, 92); x.closePath(); x.fill();
  if (kind === 'open') { x.fillStyle = '#FF4FA3'; x.beginPath(); x.moveTo(64, 80); x.bezierCurveTo(22, 52, 44, 22, 64, 44); x.bezierCurveTo(84, 22, 106, 52, 64, 80); x.fill(); }
  else { x.fillStyle = x.strokeStyle = '#1C1830'; x.lineWidth = 7; x.beginPath(); x.arc(64, 48, 13, Math.PI, 0); x.stroke(); x.beginPath(); x.roundRect(44, 48, 40, 30, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let assets = null;
const shared = () => (assets ||= { open: markerTexture('open'), locked: markerTexture('locked') });

export class World {
  constructor(canvas, { still = false } = {}) {
    this.canvas = canvas; this.still = still; this.listeners = {};
    this.items = new Map(); this.surfaces = [];
    this.g = 0; this.gFrom = 0; this.gTo = 0; this.gT = 1; this.gDur = 1; this.mode = 'ring';
    this.night = false; this.readOnly = false; this.autoRotate = false; this.selected = null; this.lastDist = 1;
    this.clock = new THREE.Clock();
    this.look = { ring: { id: 'charm' }, items: [] };

    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: still }));
    r.setPixelRatio(still ? 2 : Math.min(window.devicePixelRatio || 1, 2));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.NeutralToneMapping; r.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(r);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    this.camera = new THREE.PerspectiveCamera(26, 1, 0.1, 200);
    this.lightsG = new THREE.Group(); this.rig = new THREE.Group();
    this.scene.add(this.lightsG, this.rig);
    this.selRing = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.46, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#FF4FA3', transparent: true, opacity: 0.95, depthTest: false }));
    this.selRing.renderOrder = 5; this.selRing.visible = false;

    if (!still) {
      this.controls = new OrbitControls(this.camera, canvas);
      Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minPolarAngle: 0.3, maxPolarAngle: 1.5, rotateSpeed: 0.7, zoomSpeed: 0.7 });
      this._bindPointer();
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(canvas.parentElement);
      this._loop = this._loop.bind(this);
      this._raf = requestAnimationFrame(this._loop);
    }
    this._lights();
    this._build();
  }

  on(name, fn) { this.listeners[name] = fn; }
  _emit(name, ...a) { if (this.listeners[name]) this.listeners[name](...a); }

  // ---------- light: day or night ----------
  _lights() {
    const n = this.night, L = this.lightsG;
    L.clear();
    this.scene.environmentIntensity = n ? 0.42 : 1.0;
    this.renderer.toneMappingExposure = n ? 1.12 : 1.04;
    L.add(new THREE.HemisphereLight(n ? '#7482D8' : '#FFFFFF', n ? '#1B1438' : '#CFE9FF', n ? 0.5 : 1.0));
    const sun = new THREE.DirectionalLight(n ? '#BFCBFF' : '#FFF6E6', n ? 1.25 : 3.0);
    sun.position.set(...(n ? [-6, 9, 4] : [6, 10, 7])).multiplyScalar(1.6);
    sun.castShadow = true; sun.shadow.mapSize.set(this.still ? 1024 : 2048, this.still ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 50 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 5;
    L.add(sun, sun.target);
    if (n) { const f = new THREE.DirectionalLight('#FF9E7A', 0.45); f.position.set(5, 2, 8); L.add(f); }
  }
  setNight(night) { if (night === this.night) return; this.night = night; this._lights(); this._build(); }

  // ---------- ring + the land that grows on it ----------
  setLook(look) { this.look = { ring: { ...look.ring }, items: look.items || [] }; this._build(); }
  setRing(ring) { this.look.ring = { ...ring }; this._build(); }

  _build() {
    this.selRing.removeFromParent(); this.selRing.visible = false;
    this.rig.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    this.rig.clear();
    const pops = new Map([...this.items].map(([id, it]) => [id, it.pop]));
    this.items.clear();
    const ring = this.look.ring, r = buildRing(ring.id, ring), night = this.night;
    this.upright = r.pose === 'upright'; this.form = r.form; this.ringStones = r.stones || null; this.bridge = null;
    const tilt = (this.tilt = new THREE.Group()), inner = new THREE.Group();
    inner.add(r.g); if (this.upright) inner.rotation.x = -Math.PI / 2;
    tilt.add(inner); this.rig.add(tilt);
    this.baseYaw = this.upright ? -0.55 : 0; this.showTilt = this.upright ? 0.62 : 0.06; this.levelTilt = r.form === 'float' ? 0.16 : 0;
    this.rig.rotation.set(0, 0, 0); tilt.rotation.x = 0; this.rig.updateMatrixWorld(true);
    const top = new THREE.Box3().setFromObject(tilt).max.y;

    const land = (this.land = new THREE.Group()); this.rig.add(land);
    const grass = night ? NIGHT_GRASS : undefined;
    const circle = (R, depth, x, y, z, crystal, facets = 9) => { const g = islet({ R, crystal, depth, night, grass, facets }); g.position.set(x, y, z); land.add(g); return { g, kind: 'circle', R, s: R * 0.62, base: new THREE.Vector3(x, y, z), height: g.userData.height }; };
    const col = crystalOf(ring);
    if (r.form === 'float') this.surfaces = [circle(1.3, 1.2, 0, 0.2, 0, col)];
    else if (r.form === 'stone') this.surfaces = [circle(1.2, 1.05, 0, top + 0.2 + 1.05 + 0.38, 0, col, 8)];
    else if (r.form === 'table') {
      const g = new THREE.Group(), y = r.table.y; g.position.y = y;
      const lawn = M(box(r.table.w, 0.1, r.table.d, 0.05), paint(night ? NIGHT_GRASS[0] : '#6FD36A')); lawn.position.y = 0.05; g.add(lawn); land.add(g);
      this.surfaces = [{ g, kind: 'rect', w: r.table.w, d: r.table.d, s: 0.95, base: new THREE.Vector3(0, y, 0), height: () => 0.1 }];
    } else {
      const rr = RI + 0.75, y = Math.sin(r.ends[0]) * rr + 0.86;
      this.surfaces = [circle(0.86, 0.9, -1.28, y, 0, col, 7), circle(0.86, 0.9, 1.28, y, 0, '#3DBE8B', 7)];
      const b = (this.bridge = new THREE.Group());
      for (let i = 0; i <= 12; i++) { const u = i / 12, pl = M(new THREE.BoxGeometry(0.1, 0.02, 0.24), paint('#E9B872'), -0.56 + u * 1.12, y - 0.02 - 0.2 * Math.sin(Math.PI * u), 0); pl.rotation.z = -0.3 * Math.cos(Math.PI * u); b.add(pl); }
      land.add(b);
    }
    if (night) this.surfaces.forEach((sf) => { const l = new THREE.PointLight('#FFB05A', sf.kind === 'rect' ? 5 : 5 * sf.R, 4, 2); l.position.set(0.2, 0.75, 0.3); sf.g.add(l); });

    // how far the camera must stand for "just the ring" and for "ring + island"
    this.rig.rotation.y = this.baseYaw;
    const sphere = (box3) => ({ c: box3.getCenter(new THREE.Vector3()), r: box3.getSize(new THREE.Vector3()).length() / 2 });
    tilt.rotation.x = this.showTilt; this.rig.updateMatrixWorld(true);
    const f0 = sphere(new THREE.Box3().setFromObject(tilt));
    tilt.rotation.x = this.levelTilt; this.rig.updateMatrixWorld(true);
    const b1 = new THREE.Box3().setFromObject(this.rig); b1.max.y += 0.7;
    const bl = new THREE.Box3().setFromObject(land); bl.max.y += 0.7;
    // With the island grown, lean the view toward the land so a small island on a big ring is still workable.
    const all = sphere(b1), isle = sphere(bl);
    this.fits = [f0, { c: all.c.clone().lerp(isle.c, 0.65), r: Math.min(all.r, isle.r * 1.9) }];

    this.syncItems(this.look.items);
    for (const [id, it] of this.items) if (pops.has(id)) it.pop = pops.get(id);
    this._applyGrowth();
    if (this.gT >= 1) this._pose(this.g, true);
  }

  // ---------- pieces ----------
  _surface(d) { return this.surfaces[clamp(d.s || 0, 0, this.surfaces.length - 1)]; }
  _fitTo(sf, x, z) {
    if (sf.kind === 'rect') return [clamp(x, -sf.w / 2 + 0.14, sf.w / 2 - 0.14), clamp(z, -sf.d / 2 + 0.12, sf.d / 2 - 0.12)];
    const r = Math.hypot(x, z), max = sf.R - 0.16;
    return r > max ? [(x / r) * max, (z / r) * max] : [x, z];
  }
  _inside(sf, x, z) { return sf.kind === 'rect' ? Math.abs(x) <= sf.w / 2 && Math.abs(z) <= sf.d / 2 : Math.hypot(x, z) <= sf.R; }
  _place(it) {
    const sf = this._surface(it.data), [x, z] = this._fitTo(sf, it.data.x || 0, it.data.z || 0);
    it.data.x = x; it.data.z = z; it.sf = sf;
    if (it.root.parent !== sf.g) sf.g.add(it.root);
    it.root.position.set(x, sf.height(x, z), z);
    it.root.rotation.y = it.data.rot || 0;
  }
  _rebuildItem(data) {
    const old = this.items.get(data.id);
    if (old) old.root.removeFromParent();
    const root = new THREE.Group(), model = makePiece(data.type, this.night);
    root.add(model);
    const h = new THREE.Box3().setFromObject(model).max.y;
    const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: shared().open, depthTest: false, transparent: true }));
    marker.scale.setScalar(0.36); marker.position.y = h + 0.32; marker.renderOrder = 10; marker.visible = false;
    root.add(marker);
    root.userData.itemId = data.id;
    const it = { data: { ...data }, root, model, marker, h, pop: old ? old.pop : 1, phase: (this.items.size * 1.7) % TAU, order: old ? old.order : this.items.size };
    this.items.set(data.id, it);
    this._place(it); this._mark(it);
    return it;
  }
  _mark(it) {
    const m = it.data.memory;
    it.marker.visible = !!m;
    if (m) it.marker.material.map = m.public || this.readOnly ? shared().open : shared().locked;
  }
  // list: [{ id, type, s, x, z, rot, memory }]. Adds, removes and moves pieces to match.
  syncItems(list) {
    this.look.items = list;
    const seen = new Set();
    for (const d of list) {
      seen.add(d.id);
      const it = this.items.get(d.id);
      if (!it || it.data.type !== d.type) this._rebuildItem(d);
      else { it.data = { ...d }; this._place(it); this._mark(it); }
    }
    for (const [id, it] of this.items) if (!seen.has(id)) { it.root.removeFromParent(); this.items.delete(id); }
    let k = 0;
    for (const it of this.items.values()) it.order = k++;
    if (this.selected && !this.items.has(this.selected)) this.select(null, true);
    this._applyGrowth();
  }
  pop(id) { const it = this.items.get(id); if (it) it.pop = 0; }
  setReadOnly(v) { this.readOnly = v; for (const it of this.items.values()) this._mark(it); if (v) this.selRing.visible = false; }
  select(id, silent) {
    this.selected = id && this.items.has(id) ? id : null;
    if (!this.selected) this.selRing.visible = false;
    if (!silent) this._emit('select', this.selected);
  }
  // An empty-ish place for a new piece: the least crowded surface, then the point farthest from its neighbours.
  freeSpot() {
    const count = this.surfaces.map((_, i) => [...this.items.values()].filter((it) => this._surface(it.data) === this.surfaces[i]).length);
    const s = count.indexOf(Math.min(...count)), sf = this.surfaces[s], taken = [...this.items.values()].filter((it) => it.sf === sf).map((it) => [it.data.x, it.data.z]);
    let best = [0, 0], far = -1;
    for (let k = 0; k < 40; k++) {
      const u = (k + 0.5) / 40, a = k * 2.399963;
      const p = sf.kind === 'rect' ? [(((k * 0.618) % 1) - 0.5) * (sf.w - 0.4), (((k * 0.381) % 1) - 0.5) * (sf.d - 0.3)] : [Math.cos(a) * Math.sqrt(u) * (sf.R - 0.25), Math.sin(a) * Math.sqrt(u) * (sf.R - 0.25)];
      let d = 9; for (const [x, z] of taken) d = Math.min(d, Math.hypot(p[0] - x, p[1] - z));
      d += p[1] * 0.12;                          // slightly prefer the side facing the camera
      if (d > far) { far = d; best = p; }
    }
    return { s, x: best[0], z: best[1] };
  }

  // ---------- ring <-> island ----------
  setMode(mode, { animate = true } = {}) {
    this.mode = mode;
    const to = mode === 'island' ? 1 : 0;
    if (!animate || this.still) { this.g = this.gTo = this.gFrom = to; this.gT = 1; this.rig.rotation.y = this.baseYaw; this._applyGrowth(); this._pose(to, true); return; }
    this.gFrom = this.g; this.gTo = to; this.gT = 0;
    this.gDur = Math.max(0.6, Math.abs(to - this.g) * (to ? 3.0 : 2.0));
    this.spinFrom = this.rig.rotation.y;
    this.spinTo = this.baseYaw + TAU * Math.round((this.spinFrom - this.baseYaw) / TAU);
    this.camFrom = { pos: this.camera.position.clone(), target: this.controls.target.clone() };
    this.controls.enabled = false;
    this.select(null);
  }
  _poseFor(g) {
    const e = easeInOut(seg(g, 0, 0.75)), [f0, f1] = this.fits;
    const c = f0.c.clone().lerp(f1.c, e), rad = lerp(f0.r, f1.r, e);
    const a0 = this.upright ? [0, 0.34] : [0.12, 0.5], a1 = this.form === 'float' ? [0.22, 0.46] : [0.1, 0.3];
    const az = lerp(a0[0], a1[0], e), el = lerp(a0[1], a1[1], e);
    const vf = (this.camera.fov * Math.PI) / 360, hf = Math.atan(Math.tan(vf) * this.camera.aspect);
    const dist = (rad * lerp(0.82, 0.86, e)) / Math.sin(Math.min(vf, hf));
    return { pos: new THREE.Vector3(c.x + dist * Math.cos(el) * Math.sin(az), c.y + dist * Math.sin(el), c.z + dist * Math.cos(el) * Math.cos(az)), target: c, dist };
  }
  _pose(g, snap) {
    const p = this._poseFor(g);
    if (snap) {
      this.camera.position.copy(p.pos); this.lastDist = p.dist;
      if (this.controls) { this.controls.target.copy(p.target); this.controls.minDistance = p.dist * 0.45; this.controls.maxDistance = p.dist * 1.7; this.controls.update(); }
      else this.camera.lookAt(p.target);
    }
    return p;
  }
  _applyGrowth() {
    const g = this.g;
    this.tilt.rotation.x = lerp(this.showTilt, this.levelTilt, easeInOut(seg(g, 0, 0.4)));
    const k = easeBack(seg(g, 0.25, 0.7)), grow = Math.max(0.001, k);
    this.surfaces.forEach((sf) => { sf.g.visible = k > 0.001; sf.g.scale.setScalar(grow); sf.g.position.copy(sf.base); sf.g.position.y -= (1 - Math.min(1, k)) * 0.6; });
    if (this.bridge) { const b = seg(g, 0.6, 0.9); this.bridge.visible = b > 0.001; this.bridge.scale.set(Math.max(0.001, b), 1, 1); }
    if (this.ringStones) this.ringStones.visible = g < 0.3;
    const n = Math.max(1, this.items.size);
    for (const it of this.items.values()) {
      const a = 0.62 + (it.order / n) * 0.22, s = easeBack(seg(g, a, a + 0.14)) * easeBack(clamp(it.pop, 0, 1));
      it.root.visible = s > 0.001;
      it.root.scale.setScalar(Math.max(0.001, s) * it.sf.s);
    }
    if (g < 0.95) this.selRing.visible = false;
  }

  // ---------- frame ----------
  resize() {
    const p = this.canvas.parentElement, w = Math.max(2, p.clientWidth), h = Math.max(2, p.clientHeight);
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    const want = this._poseFor(this.g).dist;
    if (Math.abs(want - this.lastDist) > 0.01) {
      const off = this.camera.position.clone().sub(this.controls.target).multiplyScalar(want / this.lastDist);
      this.camera.position.copy(this.controls.target).add(off);
      this.lastDist = want; this.controls.minDistance = want * 0.45; this.controls.maxDistance = want * 1.7;
    }
  }
  _tick(dt, time) {
    if (this.gT < 1) {
      this.gT = Math.min(1, this.gT + dt / this.gDur);
      this.g = this.gFrom + (this.gTo - this.gFrom) * this.gT;
      this.rig.rotation.y = lerp(this.spinFrom, this.spinTo, easeInOut(seg(this.gT, 0, 0.5)));
      const p = this._poseFor(this.g), c = easeInOut(seg(this.gT, 0, 0.85));
      this.camera.position.lerpVectors(this.camFrom.pos, p.pos, c);
      this.controls.target.lerpVectors(this.camFrom.target, p.target, c);
      this.camera.lookAt(this.controls.target);
      if (this.gT >= 1) { this.lastDist = p.dist; this.controls.minDistance = p.dist * 0.45; this.controls.maxDistance = p.dist * 1.7; this.controls.enabled = true; this._emit('grown', this.mode); }
      this._applyGrowth();
    } else if (this.mode === 'ring' && !this._userDown && !this.still) {
      this.rig.rotation.y += dt * 0.35;         // a slow turntable while it is just a ring
    }
    let popping = false;
    for (const it of this.items.values()) {
      if (it.pop < 1) { it.pop = Math.min(1, it.pop + dt / 0.45); popping = true; }
      if (it.marker.visible) it.marker.position.y = it.h + 0.32 + Math.sin(time * 2 + it.phase) * 0.035;
    }
    if (popping) this._applyGrowth();
    const sel = this.selected && this.items.get(this.selected);
    if (sel && !this.readOnly && this.g > 0.95) {
      if (this.selRing.parent !== sel.sf.g) sel.sf.g.add(this.selRing);
      this.selRing.visible = true;
      this.selRing.position.copy(sel.root.position); this.selRing.position.y += 0.03;
      this.selRing.scale.setScalar(sel.sf.s * (1 + Math.sin(time * 4) * 0.05));
    }
    if (this.controls) {
      this.controls.autoRotate = this.autoRotate && this.mode === 'island' && this.gT >= 1 && !this.dragging;
      this.controls.autoRotateSpeed = 0.5;
      if (this.gT >= 1) this.controls.update();
    }
  }
  render() { this.renderer.render(this.scene, this.camera); }
  _loop() {
    this._raf = requestAnimationFrame(this._loop);
    if (document.hidden || this.paused) return;
    this._tick(Math.min(0.05, this.clock.getDelta()), this.clock.elapsedTime);
    this.render();
  }

  // ---------- pointer: tap to select, drag a piece to move it ----------
  _bindPointer() {
    const ray = new THREE.Raycaster(), v = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3(), wp = new THREE.Vector3();
    const aim = (x, y) => { const b = this.canvas.getBoundingClientRect(); v.set(((x - b.left) / b.width) * 2 - 1, -((y - b.top) / b.height) * 2 + 1); ray.setFromCamera(v, this.camera); };
    const pick = (e) => {
      aim(e.clientX, e.clientY);
      for (const h of ray.intersectObjects(this.land.children, true)) { let o = h.object; if (o.isSprite && !o.visible) continue; while (o && !o.userData.itemId) o = o.parent; if (o && o.visible) return o.userData.itemId; }
      return null;
    };
    // where the pointer meets a surface's ground, in that surface's own coordinates
    const onSurface = (sf, x, y) => { aim(x, y); plane.constant = -(sf.g.getWorldPosition(wp).y + 0.05); return ray.ray.intersectPlane(plane, hit) ? sf.g.worldToLocal(hit.clone()) : null; };
    let down = null;
    this.canvas.addEventListener('pointerdown', (e) => {
      this._userDown = true;
      if (this.mode !== 'island' || this.gT < 1) return;
      const id = pick(e);
      down = { x: e.clientX, y: e.clientY, id, moved: false, ox: 0, oz: 0 };
      if (id && !this.readOnly) { this.controls.enabled = false; this.canvas.setPointerCapture(e.pointerId); }
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!down) { if (this.mode === 'island' && e.pointerType === 'mouse') this.canvas.style.cursor = pick(e) ? 'pointer' : 'grab'; return; }
      if (!down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) {
        down.moved = true;
        if (down.id && !this.readOnly) {
          this.dragging = true;
          if (this.selected !== down.id) this.select(down.id);
          const it = this.items.get(down.id), p = onSurface(it.sf, down.x, down.y);   // grab offset, so it does not jump
          if (p && Math.hypot(it.data.x - p.x, it.data.z - p.z) < 0.9) { down.ox = it.data.x - p.x; down.oz = it.data.z - p.z; }
        }
      }
      if (!this.dragging || !down.id) return;
      const it = this.items.get(down.id);
      let p = onSurface(it.sf, e.clientX, e.clientY);
      if (!p) return;
      let x = p.x + down.ox, z = p.z + down.oz;
      if (!this._inside(it.sf, x, z)) for (let i = 0; i < this.surfaces.length; i++) {       // carried over to the other islet
        const other = this.surfaces[i], q = other !== it.sf && onSurface(other, e.clientX, e.clientY);
        if (q && this._inside(other, q.x, q.z)) { it.data.s = i; x = q.x; z = q.z; down.ox = down.oz = 0; break; }
      }
      it.data.x = x; it.data.z = z;
      this._place(it); this._applyGrowth();
      this._emit('move', down.id, it.data.s || 0, it.data.x, it.data.z);
    });
    const up = () => {
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

  dispose() { cancelAnimationFrame(this._raf); if (this._ro) this._ro.disconnect(); if (this.controls) this.controls.dispose(); this.renderer.dispose(); }
}

// One hidden renderer that paints stills: island cards, ring thumbnails and piece icons.
export class Darkroom {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.world = new World(this.canvas, { still: true });
    this.world.readOnly = true;
    this.iconScene = new THREE.Scene();
    this.iconScene.environment = this.world.scene.environment;
    const sun = new THREE.DirectionalLight('#FFF6E6', 2.6); sun.position.set(3, 6, 5);
    this.iconScene.add(new THREE.HemisphereLight('#fff', '#CFE9FF', 1.2), sun);
    this.iconCam = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  }
  shot(look, w, h, { mode = 'island', night = false } = {}) {
    const W = this.world;
    W.renderer.setSize(w, h, false);
    W.camera.aspect = w / h; W.camera.updateProjectionMatrix();
    W.night = night; W._lights();
    W.setLook(look);
    W.setMode(mode, { animate: false });
    W._tick(0, 1.3);
    W.render();
    return this.canvas.toDataURL('image/png');
  }
  ring(ring, w = 220, h = 170) { return this.shot({ ring, items: [] }, w, h, { mode: 'ring' }); }
  icon(type, size = 168) {
    const W = this.world;
    W.renderer.setSize(size, size, false);
    W.renderer.toneMappingExposure = 1.04;
    const model = makePiece(type, false), bb = new THREE.Box3().setFromObject(model), c = bb.getCenter(new THREE.Vector3()), R = Math.max(0.16, bb.getSize(new THREE.Vector3()).length() / 2);
    this.iconScene.add(model);
    const d = (R / Math.sin((26 * Math.PI) / 360)) * 1.04, az = 0.6, el = type === 'pond' || type === 'picnic' ? 0.75 : 0.4;
    this.iconCam.position.set(c.x + d * Math.cos(el) * Math.sin(az), c.y + d * Math.sin(el), c.z + d * Math.cos(el) * Math.cos(az));
    this.iconCam.lookAt(c);
    W.renderer.render(this.iconScene, this.iconCam);
    this.iconScene.remove(model);
    return this.canvas.toDataURL('image/png');
  }
}
