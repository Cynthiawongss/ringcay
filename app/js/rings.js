// The 24 rings. Each builder returns { g, pose, form, ... }:
//   pose  'lying'   stones run round the band, so the ring is shown flat
//         'upright' the ring has a top, so it stands
//   form  how its island grows: 'float' in the hole, 'stone' above the top, 'table' on a flat top, 'twin' on two ends
// Options: { metal, accent, text }. metal and accent fall back to the ring's own; text is engraved inside the band.
import * as THREE from 'three';
import { TAU, RI, TOP, bump, noise, band, strip, metal, gem, seat, collar, RAINBOW, box, M } from './kit.js';

const CANDY = ['#E8438C', '#FF8A3D', '#F6D54A', '#3DBE8B', '#4A7BE8', '#8B5BD6', '#8FD3E8', '#FF8FB8'];
const taper = (base, more, s = 0.7) => (th) => base + more * bump(th, s);
const inner = (text) => strip({ mirror: true, text: (text || '').toUpperCase(), textAt: -Math.PI / 2, ink: 'rgba(40,38,54,.7)', depth: 1.1 });
const gloss = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.16, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.3, ...o });
const jelly = (color) => new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: 0.3, roughness: 0.1, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.9, envMapIntensity: 2.2, sheen: 1, sheenColor: '#ffffff', sheenRoughness: 0.3 });
let seed = 5;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function faceTex(draw, colour = false) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  if (!colour) { x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(40,30,10,.75)'; x.lineJoin = 'round'; }
  draw(x);
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace;
  return { map, bump: colour ? null : new THREE.CanvasTexture(c), depth: 1.2 };
}
function star5(c, x, y, r) { c.beginPath(); for (let i = 0; i < 11; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * 0.45 : r; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * q, y + Math.sin(a) * q); } c.stroke(); }

const BUILD = {
  // ---------- classic ----------
  dome: (o) => { const k = o.metal || 'gold', g = new THREE.Group(), B = band({ profile: 'dome', w: 1.0, t: 0.36, mats: [metal(k, strip({ hammer: 0.05 }), { roughness: 0.2 }), metal(k, inner(o.text))] }); g.add(B.mesh); return { g, pose: 'lying', form: 'float' }; },
  cigar: (o) => { const k = o.metal || 'satin', g = new THREE.Group(), B = band({ profile: 'flat', w: 1.7, t: 0.3, mats: [metal(k, strip({ width: 1.7, hammer: 0.07 })), metal(k, inner(o.text))] }); g.add(B.mesh); for (let i = -2; i <= 2; i++) seat(g, B, gem('round', 0.1, o.accent || '#F7FBFF', { clear: !o.accent }), TOP + i * 0.2, { lift: -0.05 }); return { g, pose: 'lying', form: 'float' }; },
  knife: (o) => { const k = o.metal || 'gold', g = new THREE.Group(), B = band({ profile: 'knife', w: 0.86, t: 0.42, mats: [metal(k), metal(k, inner(o.text))] }); g.add(B.mesh); return { g, pose: 'lying', form: 'float' }; },
  stackers: (o) => { const g = new THREE.Group(); [['gold', o.accent || '#E8438C', -0.44], ['silver', '#8FD3E8', 0], ['rose', '#C8E04A', 0.44]].forEach(([k, c, y], i) => { const B = band({ profile: 'round', w: 0.3, t: 0.27, yoff: y, mats: [metal(k), metal(k, i === 1 ? inner(o.text) : null)] }); g.add(B.mesh); const s = new THREE.Group(); s.add(collar(0.15, k, 0.2), gem('round', 0.15, c)); seat(g, B, s, TOP + (i - 1) * 0.5, { lift: 0.02 }); }); return { g, pose: 'lying', form: 'float' }; },

  // ---------- clay and wobble ----------
  charm: (o) => {
    const k = o.metal || 'satin', n1 = noise(1.3), n2 = noise(4.1), n3 = noise(7.7), n4 = noise(2.9), g = new THREE.Group();
    const doodles = [['sparkle', TOP + 0.34, 0.5, 30], ['sparkle', TOP - 0.34, 0.52, 28, 0.3], ['moon', TOP + 1.5, 0.5, 34, 0.4], ['star', TOP - 1.5, 0.5, 30], ['sparkle', TOP + 1.95, 0.45, 26], ['heart', TOP - 2.0, 0.5, 26], ['sparkle', TOP + 2.6, 0.55, 24], ['cat', TOP - 2.6, 0.5, 34]];
    const B = band({ profile: 'round', w: (th) => 1.1 + 0.16 * n1(th) + 0.1 * bump(th, 1.2), t: (th) => 0.46 + 0.1 * n2(th), wob: (th) => 0.05 * n3(th), yoff: (th) => 0.05 * n4(th), mats: [metal(k, strip({ width: 1.1, hammer: 0.2, doodles })), metal(k, inner(o.text))] });
    g.add(B.mesh);
    seat(g, B, gem('heart', 0.3, o.accent || '#FF4FA3'), TOP, { lift: -0.1 });
    for (const s of [-1, 1]) { seat(g, B, gem('round', 0.1, '#8FD3E8'), TOP + s * 0.68, { lift: -0.05 }); seat(g, B, gem('star', 0.16, '#F6D54A'), TOP + s * 1.08, { lift: -0.07, tilt: s * 0.2 }); }
    return { g, pose: 'lying', form: 'float' };
  },
  doodle: (o) => { const k = o.metal || 'satin', n1 = noise(3.3), g = new THREE.Group(); const doodles = [['cat', TOP, 0.5, 52], ['heart', TOP + 0.62, 0.5, 34], ['heart', TOP - 0.62, 0.5, 34], ['star', TOP + 1.2, 0.5, 34], ['sparkle', TOP - 1.2, 0.5, 34], ['moon', TOP + 1.8, 0.5, 34], ['sparkle', TOP - 1.8, 0.5, 30]]; const B = band({ profile: 'dome', w: (th) => 1.3 + 0.1 * n1(th), t: 0.36, wob: (th) => 0.03 * n1(th + 1), mats: [metal(k, strip({ width: 1.3, hammer: 0.16, doodles })), metal(k, inner(o.text))] }); g.add(B.mesh); return { g, pose: 'lying', form: 'float' }; },
  molten: (o) => { const k = o.metal || 'silver', g = new THREE.Group(); [[1.1, -0.3], [5.2, 0.3]].forEach(([s, y], i) => { const a = noise(s), b = noise(s * 2); const B = band({ profile: 'round', w: (th) => 0.42 + 0.4 * Math.pow(Math.max(0, a(th)), 2), t: (th) => 0.36 + 0.14 * b(th), yoff: (th) => y + 0.07 * a(th + 2), mats: [metal(k), metal(k, i ? inner(o.text) : null)] }); g.add(B.mesh); }); return { g, pose: 'lying', form: 'float' }; },
  puffy: (o) => { const k = o.metal || 'silver', g = new THREE.Group(), B = band({ profile: 'round', w: taper(0.34, 0.3), t: taper(0.28, 0.1), mats: [metal(k), metal(k, inner(o.text))] }); g.add(B.mesh); const s = new THREE.Shape(); s.moveTo(0, -0.7); s.bezierCurveTo(-1.2, 0.05, -0.7, 0.9, 0, 0.36); s.bezierCurveTo(0.7, 0.9, 1.2, 0.05, 0, -0.7); const h = M(new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 10, curveSegments: 28 }), metal(k)); seat(g, B, h, TOP, { lift: 0.12 }); return { g, pose: 'upright', form: 'stone' }; },

  // ---------- rainbow stones ----------
  confetti: (o) => { seed = 21; const k = o.metal || 'gold', g = new THREE.Group(), B = band({ profile: 'dome', w: 1.16, t: 0.44, mats: [metal(k, strip({ width: 1.16, hammer: 0.26 }), { roughness: 0.3 }), metal(k, inner(o.text))] }); g.add(B.mesh); for (let i = 0; i < 58; i++) { const kind = rnd() < 0.7 ? 'round' : rnd() < 0.5 ? 'baguette' : 'emerald'; seat(g, B, gem(kind, 0.065 + rnd() * 0.095, CANDY[i % CANDY.length]), TOP + (rnd() - 0.5) * 5.6, { v: 0.14 + rnd() * 0.72, lift: -0.035, tilt: rnd() * 3 }); } return { g, pose: 'lying', form: 'float' }; },
  bezel: (o) => { const k = o.metal || 'gold', g = new THREE.Group(), B = band({ profile: 'round', w: 0.36, t: 0.24, mats: [metal(k), metal(k, inner(o.text))] }); g.add(B.mesh); const n = 16; for (let i = 0; i < n; i++) { const s = i % 2 ? 0.17 : 0.23, st = new THREE.Group(); st.add(collar(s * 0.92, k, 0.16), gem(['round', 'oval', 'round', 'emerald'][i % 4], s, RAINBOW[i % RAINBOW.length])); seat(g, B, st, (i / n) * TAU + 0.2, { lift: 0.06 }); } return { g, pose: 'lying', form: 'float' }; },
  baguette: (o) => { const k = o.metal || 'gold', g = new THREE.Group(), B = band({ profile: 'flat', w: 0.98, t: 0.34, mats: [metal(k), metal(k, inner(o.text))] }); g.add(B.mesh); const n = 40, c = new THREE.Color(); for (let i = 0; i < n; i++) seat(g, B, gem('baguette', 0.27, '#' + c.setHSL((i / n + 0.92) % 1, 0.86, 0.56).getHexString()), (i / n) * TAU, { lift: -0.05 }); return { g, pose: 'lying', form: 'float' }; },
  toimoi: (o) => { const k = o.metal || 'gold', g = new THREE.Group(), gap = 0.4, B = band({ profile: 'round', w: 0.32, t: 0.28, th0: TOP + gap, th1: TOP - gap + TAU, mats: [metal(k), metal(k, inner(o.text))] }); g.add(B.mesh); const stones = new THREE.Group(); [['pear', o.accent || '#FF8FB8', 1, 0.44], ['emerald', '#3DBE8B', -1, 0.4]].forEach(([kind, c, s, sz]) => { const st = new THREE.Group(); st.add(collar(sz * 0.9, k, 0.26), gem(kind, sz, c)); seat(stones, B, st, TOP + s * (gap + 0.02), { lift: 0.08, tilt: s * 0.5 }); }); g.add(stones); return { g, pose: 'upright', form: 'twin', ends: [TOP + gap, TOP - gap], stones }; },

  // ---------- chunky ----------
  bombe: (o) => { seed = 9; const k = o.metal || 'gold', g = new THREE.Group(), B = band({ profile: 'round', w: taper(0.5, 1.0, 1.0), t: taper(0.3, 0.82, 0.95), mats: [metal(k, strip({ hammer: 0.08 }), { roughness: 0.18 }), metal(k, inner(o.text))] }); g.add(B.mesh); for (let i = 0; i < 11; i++) seat(g, B, gem(i % 3 ? 'round' : 'star', 0.07 + rnd() * 0.07, CANDY[i % CANDY.length]), TOP + (rnd() - 0.5) * 1.5, { v: 0.22 + rnd() * 0.56, lift: -0.04, tilt: rnd() * 3 }); return { g, pose: 'upright', form: 'stone' }; },
  wave: (o) => { const k = o.metal || 'silver', g = new THREE.Group(), B = band({ profile: 'round', w: 0.46, t: 0.38, yoff: (th) => 0.3 * Math.sin(4 * th), mats: [metal(k), metal(k, inner(o.text))] }); g.add(B.mesh); return { g, pose: 'lying', form: 'float' }; },
  bubble: (o) => { const k = o.metal || 'silver', f = (th) => Math.pow(Math.abs(Math.sin(4 * th)), 1.4), g = new THREE.Group(), B = band({ profile: 'round', w: (th) => 0.46 + 0.56 * f(th), t: (th) => 0.26 + 0.36 * f(th), mats: [metal(k), metal(k, inner(o.text))] }); g.add(B.mesh); return { g, pose: 'lying', form: 'float' }; },
  flush: (o) => { const k = o.metal || 'gold', g = new THREE.Group(), B = band({ profile: 'dome', w: 1.3, t: 0.54, mats: [metal(k, strip({ width: 1.3, hammer: 0.1 }), { roughness: 0.2 }), metal(k, inner(o.text))] }); g.add(B.mesh); seat(g, B, gem('round', 0.3, o.accent || '#8FD3E8'), TOP, { lift: -0.12 }); return { g, pose: 'lying', form: 'float' }; },

  // ---------- signets ----------
  pinky: (o) => { const k = o.metal || 'gold', g = new THREE.Group(), B = band({ profile: 'dome', w: taper(0.42, 0.75), t: taper(0.28, 0.22), mats: [metal(k), metal(k, inner(o.text))] }); g.add(B.mesh); const top = new THREE.Group(), p = M(new THREE.CylinderGeometry(1, 0.94, 0.26, 48).rotateX(Math.PI / 2), metal(k)); p.scale.set(0.76, 0.98, 1); const face = M(new THREE.CircleGeometry(1, 48), metal(k, faceTex((c) => { c.lineWidth = 9; star5(c, 128, 128, 62); }), { roughness: 0.3 }), 0, 0, 0.134); face.scale.set(0.7, 0.92, 1); top.add(p, face); seat(g, B, top, TOP, { lift: 0.06 }); return { g, pose: 'upright', form: 'stone' }; },
  boxy: (o) => {
    const k = o.metal || 'oxid', g = new THREE.Group(), B = band({ profile: 'flat', w: 1.5, t: 0.36, mats: [metal(k, strip({ width: 1.5, hammer: 0.2 })), metal(k, inner(o.text))] }); g.add(B.mesh);
    const top = new THREE.Group(), m = metal(k, null, { roughness: 0.5 }), stud = metal(k === 'oxid' ? 'silver' : k);
    top.add(M(box(2.3, 1.62, 0.56, 0.06), m));
    for (const y of [-0.62, 0.62]) top.add(M(box(2.3, 0.2, 0.1, 0.03), m, 0, y, 0.31));
    for (const x of [-1.0, 1.0]) for (const y of [-0.62, 0.62]) top.add(M(new THREE.SphereGeometry(0.075, 16, 10), stud, x, y, 0.4));
    for (const x of [-1.17, 1.17]) for (const y of [-0.5, 0.5]) top.add(M(new THREE.SphereGeometry(0.07, 16, 10), stud, x, y, 0.05));
    seat(g, B, top, TOP, { lift: 0.2 });
    return { g, pose: 'upright', form: 'table', table: { y: RI + 0.36 + 0.2 + 0.28, w: 2.14, d: 1.06 } };
  },
  enamel: (o) => { const k = o.metal || 'gold', g = new THREE.Group(), B = band({ profile: 'dome', w: taper(0.44, 0.9), t: taper(0.28, 0.22), mats: [metal(k), metal(k, inner(o.text))] }); g.add(B.mesh); const top = new THREE.Group(); top.add(M(box(1.5, 1.5, 0.3, 0.14), metal(k)), M(box(1.26, 1.26, 0.1, 0.1), gloss(o.accent || '#2447D6'), 0, 0, 0.12)); const s = gem('star', 0.2, '#FFE27A'); s.position.z = 0.15; top.add(s); seat(g, B, top, TOP, { lift: 0.08 }); return { g, pose: 'upright', form: 'stone' }; },
  inlay: (o) => { const k = o.metal || 'satin', g = new THREE.Group(), B = band({ profile: 'dome', w: taper(0.44, 0.86), t: taper(0.28, 0.2), mats: [metal(k), metal(k, inner(o.text))] }); g.add(B.mesh); const top = new THREE.Group(), p = M(new THREE.CylinderGeometry(1, 0.94, 0.28, 48).rotateX(Math.PI / 2), metal(k)); p.scale.set(0.82, 1.06, 1); const base = new THREE.Color(o.accent || '#16A36B'), dark = '#' + base.clone().multiplyScalar(0.55).getHexString(), light = '#' + base.clone().lerp(new THREE.Color('#fff'), 0.45).getHexString(); const face = M(new THREE.CircleGeometry(1, 48), new THREE.MeshPhysicalMaterial({ map: faceTex((c) => { c.fillStyle = '#' + base.getHexString(); c.fillRect(0, 0, 256, 256); for (let i = 0; i < 9; i++) { c.strokeStyle = i % 2 ? dark : light; c.lineWidth = 8 + (i % 3) * 5; c.beginPath(); c.ellipse(60, 250, 30 + i * 30, 22 + i * 26, 0.3, 0, TAU); c.stroke(); } }, true).map, roughness: 0.12, clearcoat: 1 }), 0, 0, 0.145); face.scale.set(0.7, 0.94, 1); top.add(p, face); seat(g, B, top, TOP, { lift: 0.06 }); return { g, pose: 'upright', form: 'stone' }; },

  // ---------- candy ----------
  vine: (o) => { const col = o.accent || '#FF4FA3', g = new THREE.Group(), pts = []; for (let i = 0; i <= 120; i++) { const u = i / 120, th = TOP - 0.55 + u * TAU * 1.5, r = RI + 0.16; pts.push(new THREE.Vector3(Math.cos(th) * r, -0.5 + u * 1.0, Math.sin(th) * r)); } g.add(M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 260, 0.135, 14), gloss(col))); const st = new THREE.Group(); st.add(collar(0.3, o.metal || 'gold', 0.24), gem('pear', 0.32, '#C8E04A')); seat(g, { rOut: () => RI + 0.3, yAt: () => -0.5 }, st, TOP - 0.62, { tilt: -1.2 }); const a = TOP - 0.55 + TAU * 1.5, end = M(new THREE.SphereGeometry(0.19, 16, 12), gloss(col), Math.cos(a) * (RI + 0.16), 0.5, Math.sin(a) * (RI + 0.16)); g.add(end); return { g, pose: 'lying', form: 'float' }; },
  resin: (o) => { const sq = (th) => Math.pow(1 / Math.max(Math.abs(Math.cos(th)), Math.abs(Math.sin(th))), 0.6) - 1, m = jelly(o.accent || '#FF7A3D'), g = new THREE.Group(), B = band({ profile: 'flat', w: 1.36, t: 0.5, extra: (th) => 3.1 * sq(th), mats: [m, m] }); g.add(B.mesh); return { g, pose: 'lying', form: 'float' }; },
  jellydome: (o) => { const k = o.metal || 'gold', g = new THREE.Group(), B = band({ profile: 'round', w: taper(0.36, 0.5), t: taper(0.28, 0.14), mats: [metal(k), metal(k, inner(o.text))] }); g.add(B.mesh); const top = new THREE.Group(), c = M(new THREE.SphereGeometry(1, 40, 20, 0, TAU, 0, Math.PI / 2).rotateX(Math.PI / 2), jelly(o.accent || '#35C9E8')); c.scale.set(0.86, 1.08, 0.78); const col = collar(0.8, k, 0.28); col.scale.set(1.0, 1.25, 1); top.add(col, c); seat(g, B, top, TOP, { lift: 0.1 }); return { g, pose: 'upright', form: 'stone' }; },
  stripes: (o) => { const k = o.metal || 'gold', g = new THREE.Group(); [[o.accent || '#2447D6', -0.42], ['#F0452E', 0], ['#2FA35A', 0.42]].forEach(([c, y], i) => { const B = band({ profile: 'flat', w: 0.34, t: 0.28, yoff: y, mats: [metal(k), metal(k, i === 1 ? inner(o.text) : null)] }); const m = gloss(c), E = band({ profile: 'flat', w: 0.17, t: 0.3, yoff: y, mats: [m, m] }); g.add(B.mesh, E.mesh); }); return { g, pose: 'lying', form: 'float' }; },
};

export function buildRing(id, opts = {}) {
  return (BUILD[id] || BUILD.charm)({ metal: opts.metal || null, accent: opts.accent || null, text: opts.text || '' });
}
