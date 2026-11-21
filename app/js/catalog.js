// Everything a person can pick: ring families and shapes, metals, stone colours, island pieces.
// Names are written in English here and translated where they are shown (see i18n.js).
// Prices are whole US dollars. 0 = free. Checkout is a demo (no real charge) in this prototype.
import { t } from './i18n.js';

export const BRAND = 'ringcay';

// form: how the island grows on that ring.
//   float  a band: the island floats in the hole, the inside of the band stays visible
//   stone  a ring with a top: the island hovers above it, where a stone would sit
//   table  a big flat top: the top is the ground
//   twin   an open ring: one islet on each end, joined by a bridge
// metal / accent are that ring's own defaults. A ring with neither has nothing to recolour.
export const FAMILIES = [
  { id: 'classic', name: 'classic', rings: [
    { id: 'dome', name: 'dome band', form: 'float', metal: 'gold', price: 0 },
    { id: 'cigar', name: 'cigar band', form: 'float', metal: 'satin', price: 0 },
    { id: 'knife', name: 'knife edge', form: 'float', metal: 'gold', price: 0 },
    { id: 'stackers', name: 'birthstone stackers', form: 'float', accent: '#E8438C', price: 0 },
  ] },
  { id: 'clay', name: 'clay & wobble', rings: [
    { id: 'charm', name: 'charm-stone band', form: 'float', metal: 'satin', accent: '#FF4FA3', price: 0 },
    { id: 'doodle', name: 'doodle band', form: 'float', metal: 'satin', price: 0 },
    { id: 'molten', name: 'molten stackers', form: 'float', metal: 'silver', price: 0 },
    { id: 'puffy', name: 'puffy heart', form: 'stone', metal: 'silver', price: 1 },
  ] },
  { id: 'rainbow', name: 'rainbow stones', rings: [
    { id: 'confetti', name: 'confetti band', form: 'float', metal: 'gold', price: 2 },
    { id: 'bezel', name: 'bezel eternity', form: 'float', metal: 'gold', price: 2 },
    { id: 'baguette', name: 'rainbow baguettes', form: 'float', metal: 'gold', price: 2 },
    { id: 'toimoi', name: 'toi et moi', form: 'twin', metal: 'gold', accent: '#FF8FB8', price: 2 },
  ] },
  { id: 'chunky', name: 'chunky', rings: [
    { id: 'bombe', name: 'bombé dome', form: 'stone', metal: 'gold', price: 1 },
    { id: 'wave', name: 'wave band', form: 'float', metal: 'silver', price: 0 },
    { id: 'bubble', name: 'bubble band', form: 'float', metal: 'silver', price: 0 },
    { id: 'flush', name: 'flush solitaire', form: 'float', metal: 'gold', accent: '#8FD3E8', price: 0 },
  ] },
  { id: 'signet', name: 'signets', rings: [
    { id: 'pinky', name: 'pinky signet', form: 'stone', metal: 'gold', price: 0 },
    { id: 'boxy', name: 'box signet', form: 'table', metal: 'oxid', price: 2 },
    { id: 'enamel', name: 'enamel signet', form: 'stone', metal: 'gold', accent: '#2447D6', price: 1 },
    { id: 'inlay', name: 'stone inlay', form: 'stone', metal: 'satin', accent: '#16A36B', price: 1 },
  ] },
  { id: 'candy', name: 'candy', rings: [
    { id: 'vine', name: 'enamel vine', form: 'float', accent: '#FF4FA3', price: 2 },
    { id: 'resin', name: 'resin block', form: 'float', accent: '#FF7A3D', price: 1 },
    { id: 'jellydome', name: 'jelly dome', form: 'stone', metal: 'gold', accent: '#35C9E8', price: 1 },
    { id: 'stripes', name: 'enamel stripes', form: 'float', metal: 'gold', accent: '#2447D6', price: 0 },
  ] },
];
export const RINGS = FAMILIES.flatMap((f) => f.rings.map((r) => ({ ...r, family: f.id })));
export const ringOf = (id) => RINGS.find((r) => r.id === id) || RINGS.find((r) => r.id === 'charm');

export const FORM_LINE = {
  float: 'the island floats in the middle. whatever you engrave inside stays readable.',
  stone: 'the island hovers where a stone would sit.',
  table: 'the flat top is the ground. a big top means a big plaza.',
  twin: 'one islet on each end, and a bridge between you.',
};

export const METALS = [
  { id: 'gold', name: 'Gold', css: 'linear-gradient(135deg,#FBE9B0,#DDB14E 55%,#F5DA95)' },
  { id: 'silver', name: 'Silver', css: 'linear-gradient(135deg,#FFFFFF,#B9BEC6 55%,#ECEEF1)' },
  { id: 'satin', name: 'Matte silver', css: 'linear-gradient(135deg,#F1F2F5,#CFD3DA 55%,#E6E8EC)' },
  { id: 'rose', name: 'Rose gold', css: 'linear-gradient(135deg,#F8D2C2,#D98B73 55%,#F2BBA6)' },
  { id: 'oxid', name: 'Dark silver', css: 'linear-gradient(135deg,#B9BDC4,#6F747C 55%,#A3A7AE)' },
];

// The stone colour also colours the crystal under the island.
export const ACCENTS = [
  { id: '#FF4FA3', name: 'Pink sapphire' }, { id: '#E8438C', name: 'Ruby' }, { id: '#FF8A3D', name: 'Fire opal' }, { id: '#F6D54A', name: 'Citrine' },
  { id: '#3DBE8B', name: 'Emerald' }, { id: '#8FD3E8', name: 'Aquamarine' }, { id: '#4A7BE8', name: 'Sapphire' }, { id: '#8B5BD6', name: 'Amethyst' },
];
export const crystalOf = (ring) => ring.accent || ringOf(ring.id).accent || '#8B5BD6';

export const PIECES = [
  { id: 'house', name: 'House', price: 0, hint: 'a first home, a place you stayed' },
  { id: 'cabin', name: 'Blue cabin', price: 0, hint: 'the trip where it rained' },
  { id: 'tree', name: 'Tree', price: 0, hint: 'something that keeps growing' },
  { id: 'cypress', name: 'Cypress', price: 0, hint: 'a trip, a summer' },
  { id: 'bush', name: 'Pink shrub', price: 0, hint: 'a small, good day' },
  { id: 'sunbush', name: 'Yellow shrub', price: 0, hint: 'the day it finally worked' },
  { id: 'pond', name: 'Pond', price: 0, hint: 'a place you swam' },
  { id: 'bench', name: 'Bench', price: 0, hint: 'a long talk' },
  { id: 'mailbox', name: 'Mailbox', price: 0, hint: 'a letter, for later' },
  { id: 'lamp', name: 'Street lamp', price: 0, hint: 'a night you still bring up' },
  { id: 'arch', name: 'Arch', price: 0, hint: 'a door you walked through together' },
  { id: 'flag', name: 'Flag', price: 0, hint: 'something you finished' },
  { id: 'rock', name: 'Boulder', price: 0, hint: 'the hard year' },
  { id: 'lighthouse', name: 'Lighthouse', price: 1, hint: 'someone who got you through' },
  { id: 'domehouse', name: 'Dome house', price: 1, hint: 'where you want to go next' },
  { id: 'fountain', name: 'Fountain', price: 1, hint: 'a wish you share' },
  { id: 'blossom', name: 'Blossom tree', price: 0, pack: 'garden', hint: 'that one spring' },
  { id: 'picnic', name: 'Picnic set', price: 0, pack: 'garden', hint: 'a slow afternoon' },
  { id: 'umbrella', name: 'Sun umbrella', price: 0, pack: 'garden', hint: 'a someday plan' },
];
export const PACKS = [{ id: 'garden', name: 'Garden party', price: 3, blurb: 'three pieces: blossom tree, picnic set, sun umbrella' }];

export const byId = (list, id) => list.find((x) => x.id === id) || list[0];

// What you need to own to use a thing. Returns { sku, name, price, blurb } or null when it is free.
export function productFor(kind, id) {
  if (kind === 'ring') {
    const r = ringOf(id);
    return r.price ? { sku: 'ring:' + r.id, name: t(r.name), price: r.price, blurb: t('a ring shape') } : null;
  }
  if (kind === 'piece') {
    const p = byId(PIECES, id);
    if (p.pack) { const k = byId(PACKS, p.pack); return { sku: 'pack:' + k.id, name: t('{name} pack', { name: t(k.name) }), price: k.price, blurb: t(k.blurb) }; }
    return p.price ? { sku: 'piece:' + p.id, name: t(p.name), price: p.price, blurb: t('place it as many times as you like') } : null;
  }
  return null;
}
