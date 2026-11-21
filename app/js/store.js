// Saving, photos, and the public snapshot.
// PROTOTYPE: everything lives in this browser (localStorage + IndexedDB). There is no server and no account.
import { MOTIFS, PIECES, byId, productFor } from './catalog.js';
import { ZONES } from './world.js';
import { t } from './i18n.js';

const KEY = 'little-atoll.v1';

export const uid = () => Math.random().toString(36).slice(2, 9);

export function fresh() {
  return {
    v: 1, step: 'ring', grown: false, title: '', people: '',
    ring: { style: 'classic', metal: 'gold', finish: 'polished', stone: 'none', motif: 'star', text: '', note: '', notePhoto: null },
    scene: 'day', items: [], share: { names: true, engraving: true }, owned: [], touched: false,
  };
}

export function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return s && s.v === 1 ? { ...fresh(), ...s } : null;
  } catch { return null; }
}

let timer = null;
export function save(state) {
  clearTimeout(timer);
  timer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('could not save', e); } }, 200);
}
export function wipe() { clearTimeout(timer); try { localStorage.removeItem(KEY); } catch {} }

// ---------- photos (IndexedDB, with an in-memory fallback) ----------
const mem = new Map();
let dbp = null;
function db() {
  if (!dbp) dbp = new Promise((res) => {
    try {
      const rq = indexedDB.open('little-atoll', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('photos');
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => res(null);
    } catch { res(null); }
  });
  return dbp;
}
const tx = async (mode, fn) => {
  const d = await db();
  if (!d) return undefined;
  return new Promise((res) => { const rq = fn(d.transaction('photos', mode).objectStore('photos')); rq.onsuccess = () => res(rq.result); rq.onerror = () => res(undefined); });
};
export const photos = {
  async put(dataUrl) { const id = 'p' + uid(); mem.set(id, dataUrl); await tx('readwrite', (s) => s.put(dataUrl, id)); return id; },
  async get(id) { if (!id) return null; if (mem.has(id)) return mem.get(id); const v = await tx('readonly', (s) => s.get(id)); if (v) mem.set(id, v); return v || null; },
  peek(id) { return mem.get(id) || null; },
  async del(id) { if (!id) return; mem.delete(id); await tx('readwrite', (s) => s.delete(id)); },
};

// Re-drawing through a canvas shrinks the photo and drops its EXIF data (location, device).
export function shrink(src, max = 1400, q = 0.85) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', q));
    };
    img.onerror = () => rej(new Error(t('That file did not open as a picture.')));
    img.src = src;
  });
}
export const readFile = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(file); });

// ---------- ring -> island continuity ----------
export function newItem(type, spot, extra = {}) {
  return { id: 'i' + uid(), type, a: spot.a, r: spot.r, rot: 0, label: '', memory: null, ...extra };
}

// First time the ring grows: the engraved symbol becomes a landmark, the engraved words become a signpost.
export function seedIsland(state) {
  if (state.items.length) return;
  const m = byId(MOTIFS, state.ring.motif), zone = byId(PIECES, m.grows).zone;
  const land = newItem(m.grows, { a: Math.PI / 2 + 0.72, r: zone === 'shore' ? ZONES.shore[0] : 2.55 }, { from: 'motif' });
  if (state.ring.note.trim() || state.ring.notePhoto) {
    land.memory = { title: t('why this ring'), date: '', story: state.ring.note.trim(), photo: state.ring.notePhoto, public: false };
  }
  state.items.push(land);
  if (state.ring.text.trim()) state.items.push(newItem('signpost', { a: Math.PI / 2 - 0.42, r: 2.9 }, { from: 'text' }));
  state.items.push(newItem('oak', { a: Math.PI / 2 + 2.3, r: 2.5 }), newItem('pine', { a: -0.85, r: 2.75 }), newItem('flowers', { a: Math.PI / 2 - 1.35, r: 2.35 }));
}

// Changing the symbol later swaps the landmark it grew, and keeps the memory inside it.
export function followRing(state) {
  const m = byId(MOTIFS, state.ring.motif);
  const it = state.items.find((i) => i.from === 'motif');
  if (it && it.type !== m.grows) {
    it.type = m.grows;
    const [r0, r1] = ZONES[byId(PIECES, m.grows).zone];
    it.r = Math.min(r1, Math.max(r0, r0 === r1 ? r0 : 2.55));
  }
}

// ---------- what you are trying but do not own ----------
export function trials(state) {
  const out = new Map();
  const add = (p) => { if (p && !state.owned.includes(p.sku)) out.set(p.sku, p); };
  add(productFor('ring', state.ring.style));
  add(productFor('scene', state.scene));
  state.items.forEach((i) => add(productFor('piece', i.type)));
  return [...out.values()];
}
export const owns = (state, product) => !product || state.owned.includes(product.sku);

// ---------- the public snapshot ----------
// This is the ONLY thing a visitor's page ever receives. Private memories, private labels, the ring note,
// and (optionally) names and engraving are left out here, not hidden later.
export async function snapshot(state) {
  const items = [];
  for (const i of state.items) {
    const out = { id: i.id, type: i.type, a: +i.a.toFixed(3), r: +i.r.toFixed(3), rot: +(i.rot || 0).toFixed(3) };
    const m = i.memory;
    if (m && m.public && (m.title || m.story || m.photo)) {
      out.label = i.label || '';
      out.memory = { title: m.title || '', date: m.date || '', story: m.story || '', public: true };
      const full = await photos.get(m.photo);
      if (full) out.memory.photoData = await shrink(full, 420, 0.6);
    }
    items.push(out);
  }
  const r = state.ring;
  return {
    v: 1, title: state.title || '', people: state.share.names ? state.people || '' : '',
    ring: { style: r.style, metal: r.metal, finish: r.finish, stone: r.stone, motif: r.motif, text: state.share.engraving ? r.text : '' },
    scene: state.scene, items,
  };
}

const b64 = {
  to(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  from(str) { const s = atob(str.replace(/-/g, '+').replace(/_/g, '/')); const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; },
};
async function pipe(bytes, stream) {
  const w = stream.writable.getWriter(); w.write(bytes); w.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}
export async function encode(snap) {
  const raw = new TextEncoder().encode(JSON.stringify(snap));
  if (typeof CompressionStream === 'undefined') return 'j' + b64.to(raw);
  return 'z' + b64.to(await pipe(raw, new CompressionStream('deflate-raw')));
}
export async function decode(str) {
  const bytes = b64.from(str.slice(1));
  const raw = str[0] === 'z' ? await pipe(bytes, new DecompressionStream('deflate-raw')) : bytes;
  const snap = JSON.parse(new TextDecoder().decode(raw));
  if (!snap || snap.v !== 1 || !snap.ring || !Array.isArray(snap.items)) throw new Error('bad link');
  return snap;
}
