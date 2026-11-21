// Saving, photos, and the public snapshot.
// PROTOTYPE: everything lives in this browser (localStorage + IndexedDB). There is no server and no account.
import { productFor, ringOf } from './catalog.js';
import { t } from './i18n.js';

const KEY = 'ringcay.v2';

export const uid = () => Math.random().toString(36).slice(2, 9);

export function fresh() {
  return {
    v: 2, step: 'ring', grown: false, title: '', people: '',
    ring: { id: 'charm', metal: null, accent: null, text: '', note: '', notePhoto: null },   // metal / accent null = the ring's own
    items: [], share: { names: true, engraving: true }, owned: [], touched: false,
  };
}

export function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return s && s.v === 2 ? { ...fresh(), ...s } : null;
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
      const rq = indexedDB.open('ringcay', 1);
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

// ---------- ring -> island ----------
// A piece stands on surface `s` of the island (see world.js) at x, z.
export function newItem(type, spot, extra = {}) {
  return { id: 'i' + uid(), type, s: spot.s || 0, x: spot.x, z: spot.z, rot: 0, label: '', memory: null, ...extra };
}

// First time the ring grows, the island is not empty: a house, something green, a light.
// What you wrote about the ring becomes the first memory, inside the house.
const STARTERS = {
  float: [['house', 0, -0.3, -0.45, 0.5], ['tree', 0, 0.62, -0.35], ['cypress', 0, -0.85, -0.05], ['bush', 0, 0.3, 0.62], ['lamp', 0, -0.35, 0.55]],
  stone: [['house', 0, -0.25, -0.4, 0.5], ['tree', 0, 0.58, -0.3], ['cypress', 0, -0.78, 0.0], ['bush', 0, 0.3, 0.55], ['lamp', 0, -0.3, 0.5]],
  table: [['house', 0, -0.5, -0.1, 0.25], ['tree', 0, 0.35, -0.12], ['cypress', 0, -0.9, 0.1], ['bush', 0, 0.75, 0.25], ['lamp', 0, 0.05, 0.32]],
  twin: [['house', 0, -0.1, -0.2, 0.6], ['tree', 0, 0.4, 0.25], ['cabin', 1, 0.1, -0.2, -0.6], ['cypress', 1, -0.4, 0.25], ['lamp', 1, 0.35, 0.4]],
};
export function seedIsland(state) {
  if (state.items.length) return;
  STARTERS[ringOf(state.ring.id).form].forEach(([type, s, x, z, rot = 0], n) => {
    const it = newItem(type, { s, x, z }, { rot });
    if (!n && (state.ring.note.trim() || state.ring.notePhoto)) { it.from = 'ring'; it.memory = { title: t('why this ring'), date: '', story: state.ring.note.trim(), photo: state.ring.notePhoto, public: false }; }
    state.items.push(it);
  });
}
// A different ring can mean a different island shape. Pieces keep their memories and are set down again in a tidy ring.
export function refit(state, formBefore) {
  const form = ringOf(state.ring.id).form;
  if (form === formBefore || !state.items.length) return;
  const two = form === 'twin', n = state.items.length;
  state.items.forEach((it, i) => { const a = (i / n) * Math.PI * 2 + 0.6, r = form === 'table' ? 0.34 : two ? 0.42 : 0.72; it.s = two ? i % 2 : 0; it.x = Math.cos(a) * r * (form === 'table' ? 2.2 : 1); it.z = Math.sin(a) * r; });
}

// ---------- what you are trying but do not own ----------
export function trials(state) {
  const out = new Map();
  const add = (p) => { if (p && !state.owned.includes(p.sku)) out.set(p.sku, p); };
  add(productFor('ring', state.ring.id));
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
    const out = { id: i.id, type: i.type, s: i.s || 0, x: +i.x.toFixed(3), z: +i.z.toFixed(3), rot: +(i.rot || 0).toFixed(3) };
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
    v: 2, title: state.title || '', people: state.share.names ? state.people || '' : '',
    ring: { id: r.id, metal: r.metal, accent: r.accent, text: state.share.engraving ? r.text : '' },
    items,
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
  if (!snap || snap.v !== 2 || !snap.ring || !Array.isArray(snap.items)) throw new Error('bad link');
  return snap;
}
