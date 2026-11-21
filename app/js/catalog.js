// Everything a person can pick: ring bands, metals, stones, symbols, island pieces, skies.
// Prices are whole US dollars. 0 = free. Checkout is a demo (no real charge) in this prototype.

import { t } from './i18n.js';

export const BRAND = 'little atoll';

export const RING_STYLES = [
  { id: 'classic', name: 'Classic dome', blurb: 'soft and rounded', price: 0 },
  { id: 'flat', name: 'Flat band', blurb: 'clean, modern edge', price: 0 },
  { id: 'slim', name: 'Slim stacker', blurb: 'barely-there', price: 0 },
  { id: 'twist', name: 'Twist', blurb: 'two strands, wound together', price: 1 },
  { id: 'scallop', name: 'Scallop', blurb: 'petal-edged', price: 2 },
];

export const METALS = [
  { id: 'gold', name: 'Gold', color: '#F0C063', css: 'linear-gradient(135deg,#F9E2A0,#D9A441 55%,#F3D386)' },
  { id: 'rose', name: 'Rose gold', color: '#E8A58C', css: 'linear-gradient(135deg,#F8D2C2,#D98B73 55%,#F2BBA6)' },
  { id: 'silver', name: 'Silver', color: '#D9DCE0', css: 'linear-gradient(135deg,#FFFFFF,#B9BEC6 55%,#ECEEF1)' },
];

export const FINISHES = [
  { id: 'polished', name: 'Polished' },
  { id: 'brushed', name: 'Brushed' },
  { id: 'hammered', name: 'Hammered' },
];

// A stone also tints the lagoon once the ring becomes an island.
export const STONES = [
  { id: 'none', name: 'No stone', color: null, water: '#8FD3CF' },
  { id: 'diamond', name: 'Diamond', color: '#F4FBFF', water: '#A9DDEB' },
  { id: 'sapphire', name: 'Sapphire', color: '#3F6FD8', water: '#7FB4E8' },
  { id: 'emerald', name: 'Emerald', color: '#2FA36B', water: '#7CCFAE' },
  { id: 'rose', name: 'Rose quartz', color: '#F2A7B8', water: '#F3BFCB' },
  { id: 'citrine', name: 'Citrine', color: '#F2B740', water: '#9ED8C4' },
];

// The engraved symbol decides which landmark grows first.
export const MOTIFS = [
  { id: 'star', name: 'Star', glyph: '★', grows: 'observatory', line: 'grows a stargazing dome' },
  { id: 'heart', name: 'Heart', glyph: '♥', grows: 'cottage', line: 'grows a little cottage' },
  { id: 'sun', name: 'Sun', glyph: '✹', grows: 'lighthouse', line: 'grows a lighthouse' },
  { id: 'wave', name: 'Wave', glyph: '≈', grows: 'dock', line: 'grows a dock on the lagoon' },
  { id: 'leaf', name: 'Leaf', glyph: '❧', grows: 'oak', line: 'grows an old oak' },
  { id: 'moon', name: 'Moon', glyph: '☾', grows: 'campfire', line: 'grows a campfire' },
];

// zone: land = on the ring of grass, shore = snaps to the lagoon edge, water = floats in the lagoon
export const PIECES = [
  { id: 'cottage', name: 'Cottage', zone: 'land', price: 0, hint: 'a first home, a place you stayed' },
  { id: 'lighthouse', name: 'Lighthouse', zone: 'land', price: 0, hint: 'someone who got you through' },
  { id: 'oak', name: 'Old oak', zone: 'land', price: 0, hint: 'something that keeps growing' },
  { id: 'pine', name: 'Pine', zone: 'land', price: 0, hint: 'a trip, a winter' },
  { id: 'dock', name: 'Dock', zone: 'shore', price: 0, hint: 'a trip you took together' },
  { id: 'mailbox', name: 'Mailbox', zone: 'land', price: 0, hint: 'a letter, for later' },
  { id: 'bench', name: 'Bench', zone: 'land', price: 0, hint: 'a long talk' },
  { id: 'campfire', name: 'Campfire', zone: 'land', price: 0, hint: 'a night you still bring up' },
  { id: 'flowers', name: 'Wildflowers', zone: 'land', price: 0, hint: 'a small, good day' },
  { id: 'tent', name: 'Tent', zone: 'land', price: 0, hint: 'the trip where it rained' },
  { id: 'observatory', name: 'Stargazing dome', zone: 'land', price: 0, hint: 'a wish you share' },
  { id: 'signpost', name: 'Signpost', zone: 'land', price: 0, hint: 'carries your engraving' },
  { id: 'cat', name: 'Tabby cat', zone: 'land', price: 1, hint: 'the third roommate' },
  { id: 'swing', name: 'Tree swing', zone: 'land', price: 1, hint: 'being a kid again' },
  { id: 'sailboat', name: 'Little sailboat', zone: 'water', price: 1, hint: 'where you want to go next' },
  { id: 'greenhouse', name: 'Glass greenhouse', zone: 'land', price: 1, hint: 'something you are growing' },
  { id: 'blossom', name: 'Blossom tree', zone: 'land', price: 0, pack: 'picnic', hint: 'that one spring' },
  { id: 'picnic', name: 'Picnic set', zone: 'land', price: 0, pack: 'picnic', hint: 'a slow afternoon' },
  { id: 'balloon', name: 'Hot-air balloon', zone: 'land', price: 0, pack: 'picnic', hint: 'a someday plan' },
];

export const PACKS = [
  { id: 'picnic', name: 'Blossom picnic', price: 3, blurb: 'three pieces: blossom tree, picnic set, hot-air balloon' },
];

export const SCENES = [
  { id: 'day', name: 'Soft daylight', price: 0 },
  { id: 'golden', name: 'Golden hour', price: 0 },
  { id: 'night', name: 'Starry night', price: 3 },
  { id: 'snow', name: 'First snow', price: 3 },
];

export const byId = (list, id) => list.find((x) => x.id === id) || list[0];

// Names and blurbs are written in English here and translated where they are shown (see i18n.js).
// What you need to own to use a thing. Returns a product { sku, name, price, blurb } or null when free.
export function productFor(kind, id) {
  if (kind === 'ring') {
    const s = byId(RING_STYLES, id);
    return s.price ? { sku: 'ring:' + s.id, name: t('{name} band', { name: t(s.name) }), price: s.price, blurb: t('a ring style, {blurb}', { blurb: t(s.blurb) }) } : null;
  }
  if (kind === 'scene') {
    const s = byId(SCENES, id);
    return s.price ? { sku: 'scene:' + s.id, name: t(s.name), price: s.price, blurb: t('a sky for your whole island') } : null;
  }
  if (kind === 'piece') {
    const p = byId(PIECES, id);
    if (p.pack) {
      const k = byId(PACKS, p.pack);
      return { sku: 'pack:' + k.id, name: t('{name} pack', { name: t(k.name) }), price: k.price, blurb: t(k.blurb) };
    }
    return p.price ? { sku: 'piece:' + p.id, name: t(p.name), price: p.price, blurb: t('place it as many times as you like') } : null;
  }
  return null;
}
