// ringcay: the pages, the panels, and the wiring between them and the 3D stage.
import { World, Darkroom, isNight } from './world.js';
import { FAMILIES, RINGS, ringOf, FORM_LINE, METALS, ACCENTS, PIECES, PACKS, byId, productFor } from './catalog.js';
import * as store from './store.js';
import { SAMPLES, IDEAS } from './samples.js';
import { t, getLang, setLang, locale, LANGS } from './i18n.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

const app = { state: store.load() || store.fresh(), view: null, sel: null, look: null, preview: null, icons: {}, thumbs: {}, ringThumbs: {}, fam: null, night: false };

// Day or night follows the visitor's clock. There is no switch on the page. (?theme=day or ?theme=night is for looking at both.)
const forced = new URLSearchParams(location.search).get('theme');
const nightNow = () => (forced ? forced === 'night' : isNight());
let world = null, dark = null;

const icon = {
  arrow: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  back: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M16 10H5M9 5l-5 5 5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><rect x="4" y="9" width="12" height="8" rx="2.5" fill="currentColor"/><path d="M7 9V7a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  eye: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="10" r="2.4" fill="currentColor"/></svg>',
  turn: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M15.5 10a5.5 5.5 0 1 1-1.8-4.1M15 3v3.5h-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bin: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M10 4v12M4 10h12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  x: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
};

// ---------- small helpers ----------
const S = () => app.state;
const persist = () => { S().touched = true; store.save(S()); const cta = $('#nav-cta'); if (cta) cta.textContent = t('keep building'); };
const item = (id) => S().items.find((i) => i.id === id);
const hasMemory = (m) => !!(m && (m.title || m.story || m.photo || m.photoData));
const pieceName = (i) => i.label || t(byId(PIECES, i.type).name);
const niceDate = (d) => { if (!d) return ''; const x = new Date(d + 'T00:00'); return isNaN(x) ? '' : x.toLocaleDateString(locale(), { month: 'short', day: 'numeric', year: 'numeric' }); };
const forWorld = (items) => items.map((i) => ({ id: i.id, type: i.type, s: i.s || 0, x: i.x, z: i.z, rot: i.rot || 0, memory: hasMemory(i.memory) ? { public: !!i.memory.public } : null }));
const priceTag = (p) => (!p ? '' : store.owns(S(), p) ? `<span class="tag owned">${t('yours')}</span>` : `<span class="tag">$${p.price}</span>`);

let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg; el.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 2600);
}

function ensureDark() { if (!dark) dark = new Darkroom(); return dark; }
function pieceIcon(type) { if (!app.icons[type]) app.icons[type] = ensureDark().icon(type); return app.icons[type]; }
function ringThumb(id, ring = {}) {
  const k = id + '|' + (ring.metal || '') + '|' + (ring.accent || '');
  if (!app.ringThumbs[k]) app.ringThumbs[k] = ensureDark().ring({ id, metal: ring.metal || null, accent: ring.accent || null, text: '' });
  return app.ringThumbs[k];
}
function applyTheme() {
  const n = nightNow();
  if (document.documentElement.dataset.theme && n === app.night) return false;
  app.night = n;
  document.documentElement.dataset.theme = n ? 'night' : 'day';
  const meta = $('meta[name="theme-color"]'); if (meta) meta.content = n ? '#15122E' : '#F7F2E7';
  if (world) world.setNight(n);
  return true;
}

// Sample islands, in the reader's language.
const localSample = (s) => ({
  ...s, title: t(s.title), people: t(s.people), ring: { ...s.ring, text: t(s.ring.text) },
  items: s.items.map((i) => (i.memory ? { ...i, label: t(i.label || ''), memory: { ...i.memory, title: t(i.memory.title), story: t(i.memory.story) } } : i)),
});
const samples = () => SAMPLES.map(localSample);

function renderNav() {
  $$('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
  $('.nav-links').setAttribute('aria-label', t('Main'));
  const box = $('#lang');
  box.setAttribute('aria-label', t('Language'));
  box.innerHTML = LANGS.map((l) => `<button class="${l.id === getLang() ? 'on' : ''}" data-act="lang" data-v="${l.id}" lang="${l.html}" aria-pressed="${l.id === getLang()}" title="${l.name}">${l.label}</button>`).join('');
  $('#nav-cta').textContent = t(S().touched ? 'keep building' : 'start our ring');
}

// ---------- the stage ----------
const stage = document.createElement('div');
stage.className = 'stage';
stage.innerHTML = '<i class="sky"></i><canvas></canvas><div class="stage-ui"></div>';
const holder = document.createDocumentFragment();

function mountStage(slot) {
  if (!world) {
    holder.appendChild(stage);
    slot.appendChild(stage);
    world = new World($('canvas', stage));
    world.setNight(app.night);
    world.on('select', onSelect);
    world.on('move', (id, s, x, z) => { const i = item(id); if (i && app.view.name === 'make') { i.s = s; i.x = x; i.z = z; } });
    world.on('moveEnd', () => persist());
    world.on('grown', () => { if (app.view.name === 'home') stageUI(); });
  } else slot.appendChild(stage);
  world.resize();
}

function showLook(look, { mode = 'island', readOnly = false, autoRotate = false, animate = false, zoom = true } = {}) {
  app.look = look;
  world.canvas.setAttribute('aria-label', t('3D view of the ring and its island'));
  // On the home page the stage sits inside a scrolling page, so the wheel and vertical swipes must scroll, not zoom.
  world.controls.enableZoom = zoom;
  world.canvas.style.touchAction = zoom ? 'none' : 'pan-y';
  stage.style.touchAction = zoom ? 'none' : 'pan-y';
  world.autoRotate = autoRotate && !calm;
  world.setLook({ ring: look.ring, items: look.items });
  world.setReadOnly(readOnly);
  world.setMode(mode, { animate: animate && !calm });
}
const ownLook = () => ({ ring: S().ring, items: forWorld(S().items) });
const refreshOwn = () => world.setLook(ownLook());
function stageUI(html) {
  const ui = $('.stage-ui', stage);
  if (app.view.name === 'home') {
    const isIsland = world.mode === 'island';
    ui.innerHTML = `<button class="pill" data-act="hero-toggle">${t(isIsland ? 'show me the ring' : 'grow the island')}</button>`;
  } else ui.innerHTML = html || '';
}

// ---------- routing ----------
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [name, arg] = h.split('/');
  closeModal();
  if (name === 'make') return openMake();
  if (name === 's') { const s = samples().find((x) => x.id === arg); if (s) return openViewer(s, { kind: 'sample' }); }
  if (name === 'v' && arg) return store.decode(arg).then((snap) => openViewer(snap, { kind: 'link' })).catch(() => { toast(t('That link is broken or cut short.')); location.hash = '#/'; });
  if (name === 'preview' && app.preview) return openViewer(app.preview, { kind: 'preview' });
  openHome(name === 'explore');
}
function setView(name, html) {
  holder.appendChild(stage);
  app.view = { name };
  app.sel = null;
  document.body.dataset.view = name;
  $('#view').innerHTML = html;
  $$('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === name));
  renderNav();
  window.scrollTo(0, 0);
}

// ---------- home ----------
function openHome(toExplore) {
  const mine = S().touched, list = samples(), quiet = app.quiet;
  const time = new Date().toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' });
  setView('home', `
  <section class="hero">
    <div class="hero-copy">
      <h1>${t('a ring that grows into')} <mark>${t('a place.')}</mark></h1>
      <p class="typer lede">${t('pick a ring. it grows an island. tuck your memories in.')}</p>
      <div class="row">
        <a class="btn primary big" href="#/make">${t(mine ? 'keep building' : 'start our ring')} ${icon.arrow}</a>
        <a class="btn ghost big" href="#/explore">${t('look around first')}</a>
      </div>
      <p class="fine">${t('Free to make. Your photos and stories stay private unless you open them, one by one.')}</p>
      <div class="strip">
        <p class="typer">${t('24 rings to start from')}</p>
        <div class="strip-row">${['confetti', 'boxy', 'vine', 'bombe', 'bezel'].map((id, i) => `<button class="sticker" style="--r:${(i - 2) * 2.4}deg" data-act="start-with" data-v="${id}" title="${esc(t(ringOf(id).name))}"><img alt="${esc(t(ringOf(id).name))}" data-ring="${id}"></button>`).join('')}</div>
      </div>
    </div>
    <div class="hero-photo">
      <figure class="snap big"><i class="tape"></i><div class="snap-img"><div class="stage-slot"></div></div><figcaption class="hand">${t(app.night ? 'still up · {time}' : 'our island · {time}', { time })}</figcaption></figure>
      <span class="stamp"><b>${t('free')}</b>${t('to make')}</span>
    </div>
  </section>
  <section class="notes" aria-label="${t('How it works')}">
    <div class="note lemon"><b>${t('pick a ring')}</b><span>${t('six families, twenty-four shapes. chunky silver, rainbow stones, signets, candy.')}</span></div>
    <div class="note sky"><b>${t('it grows an island')}</b><span>${t('the island takes its shape from the ring. your stone colours the crystal underneath.')}</span></div>
    <div class="note pink"><b>${t('tuck memories in')}</b><span>${t('every piece can hold a photo and a story.')}</span></div>
    <div class="note mint"><b>${t("share it, or don't")}</b><span>${t('show the island, keep the stories. your call, every time.')}</span></div>
  </section>
  <section class="explore" id="explore">
    <div class="explore-head">
      <h2>${t('islands to wander')}</h2>
      <p class="typer">${t('These six are samples we made. A real community comes later, and only from islands people choose to share.')}</p>
    </div>
    <div class="masonry">
      ${mine ? `<a class="pin snap" style="--r:-1.2deg" href="#/make"><i class="tape"></i><div class="snap-img sky-bg" style="aspect-ratio:1/1"><img alt="" data-thumb="mine"></div><figcaption><b>${esc(S().title || t('your island, so far'))}</b><span>${t('saved on this device')}</span></figcaption></a>` : ''}
      ${list.map((s, n) => `
        <a class="pin snap" style="--r:${((n * 37) % 5 - 2) * 0.6}deg" href="#/s/${s.id}">
          <i class="tape t${n % 4}"></i>
          <div class="snap-img sky-bg" style="aspect-ratio:${s.ratio}"><img alt="${esc(t('{title}, a sample island', { title: s.title }))}" data-thumb="${s.id}"><span class="pill open">${t('visit')}</span></div>
          <figcaption><b>${esc(s.title)}</b><span>${esc(s.people)} · ${t('sample')}</span></figcaption>
        </a>
        ${IDEAS[n / 2] && n % 2 === 0 ? `<div class="pin idea ${IDEAS[n / 2].tone}"><p class="hand">${t(IDEAS[n / 2].hand)}</p><span>${t(IDEAS[n / 2].small)}</span></div>` : ''}`).join('')}
    </div>
  </section>
  <footer class="foot">
    <p><b>${t('Preview build.')}</b> ${t('Everything you make is saved in this browser only. There are no accounts yet, checkout is a demo that charges nothing, and the islands above are samples.')}</p>
    ${mine ? `<button class="btn small ghost" data-act="reset">${t('erase my island and start over')}</button>` : ''}
  </footer>`);
  mountStage($('.stage-slot'));
  const hero = list[0];
  showLook({ ring: hero.ring, items: forWorld(hero.items), src: hero }, { mode: toExplore || calm || quiet ? 'island' : 'ring', readOnly: true, autoRotate: true, zoom: false });
  stageUI();
  if (toExplore) $('#explore').scrollIntoView();
  else if (!calm && !quiet) setTimeout(() => { if (app.view.name === 'home' && world.mode === 'ring') { world.setMode('island'); stageUI(); } }, 1300);
  paintThumbs();
}

async function paintThumbs() {
  const frame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 30)));
  await frame();
  for (const img of $$('[data-ring]')) { if (app.view.name !== 'home') return; img.src = ringThumb(img.dataset.ring); img.classList.add('in'); await frame(); }
  for (const img of $$('[data-thumb]')) {
    if (app.view.name !== 'home') return;
    const id = img.dataset.thumb;
    if (id === 'mine') img.src = ensureDark().shot(ownLook(), 300, 300, { mode: S().grown ? 'island' : 'ring', night: app.night });
    else {
      const key = getLang() + (app.night ? 'n' : 'd') + id;
      if (!app.thumbs[key]) { const s = samples().find((x) => x.id === id), [w, h] = s.ratio.split('/').map(Number); app.thumbs[key] = ensureDark().shot({ ring: s.ring, items: forWorld(s.items) }, 300, Math.round((300 * h) / w), { night: app.night }); }
      img.src = app.thumbs[key];
    }
    img.classList.add('in');
    await frame();
  }
}

// ---------- make ----------
function openMake() {
  const st = S();
  if (st.step !== 'ring' && !st.grown) st.step = 'ring';
  setView('make', `<section class="studio"><div class="studio-stage"><div class="stage-slot"></div></div><aside class="panel" id="panel"></aside></section>`);
  mountStage($('.stage-slot'));
  app.fam = ringOf(st.ring.id).family;
  showLook(ownLook(), { mode: st.step === 'ring' ? 'ring' : 'island', readOnly: st.step !== 'island' });
  stageUI();
  renderPanel();
}

function goStep(step) {
  const st = S();
  if (step === st.step) return;
  if (step !== 'ring' && !st.grown) { store.seedIsland(st); st.grown = true; world.syncItems(forWorld(st.items)); }
  st.step = step; app.sel = null;
  world.setReadOnly(step !== 'island');
  world.select(null, true);
  const mode = step === 'ring' ? 'ring' : 'island';
  if (world.mode !== mode) world.setMode(mode, { animate: !calm });
  persist();
  renderPanel();
  $('#panel').scrollTop = 0;
}

function renderPanel() {
  const p = $('#panel');
  if (!p) return;
  const st = S(), keep = p.scrollTop;
  const tabs = `<nav class="steps" aria-label="${t('Steps')}">${['ring', 'island', 'share'].map((id, n) => `<button class="${st.step === id ? 'on' : ''}" data-act="step" data-v="${id}"><i>${n + 1}</i>${t(id)}</button>`).join('')}</nav>`;
  p.innerHTML = tabs + (st.step === 'ring' ? ringPanel() : st.step === 'island' ? (app.sel && item(app.sel) ? memoryPanel(item(app.sel)) : islandPanel()) : sharePanel());
  p.scrollTop = keep;
  $$('img[data-photo]', p).forEach((img) => store.photos.get(img.dataset.photo).then((src) => { if (src) img.src = src; }));
}

function trialNote(product) {
  if (!product || store.owns(S(), product)) return '';
  return `<div class="trial"><span>${t("You're trying {name}. Keep it for {price}, or swap back any time.", { name: `<b>${esc(product.name)}</b>`, price: '$' + product.price })}</span><button class="btn small ink" data-act="buy" data-sku="${product.sku}">${t('get it · {price}', { price: '$' + product.price })}</button></div>`;
}

function ringPanel() {
  const r = S().ring, def = ringOf(r.id), fam = byId(FAMILIES, app.fam || def.family);
  return `
  <div class="panel-body">
    <h2>${t('pick your ring')}</h2>
    <p class="sub">${t('Six families. The island takes its shape from the ring you pick.')}</p>

    <div class="fams" role="tablist" aria-label="${t('Ring families')}">${FAMILIES.map((f) => `<button role="tab" aria-selected="${f.id === fam.id}" class="chip ${f.id === fam.id ? 'on' : ''}" data-act="fam" data-v="${f.id}">${t(f.name)}</button>`).join('')}</div>
    <div class="tiles two">${fam.rings.map((x) => `<button class="tile ring ${r.id === x.id ? 'on' : ''}" data-act="ring-pick" data-v="${x.id}"><img alt="" src="${ringThumb(x.id)}"><span>${t(x.name)}</span>${priceTag(productFor('ring', x.id))}</button>`).join('')}</div>
    <p class="typer formline">${t(FORM_LINE[def.form])}</p>
    ${trialNote(productFor('ring', r.id))}

    ${def.metal ? `<fieldset><legend>${t('metal')}</legend>
      <div class="swatches wrap">${METALS.map((m) => `<button class="swatch ${(r.metal || def.metal) === m.id ? 'on' : ''}" data-act="ring-set" data-k="metal" data-v="${m.id}"><i style="background:${m.css}"></i><span>${t(m.name)}</span></button>`).join('')}</div>
    </fieldset>` : ''}

    ${def.accent ? `<fieldset><legend>${t('stone colour')}</legend>
      <div class="dots">${[{ id: def.accent, name: 'As designed' }, ...ACCENTS.filter((a) => a.id !== def.accent)].slice(0, 9).map((a) => `<button class="dot-btn ${(r.accent || def.accent) === a.id ? 'on' : ''}" style="--c:${a.id}" data-act="ring-set" data-k="accent" data-v="${a.id}" title="${esc(t(a.name))}" aria-label="${esc(t(a.name))}"></button>`).join('')}</div>
      <p class="typer">${t('it also colours the crystal under your island.')}</p>
    </fieldset>` : ''}

    <fieldset><legend>${t('inside the band')}</legend>
      <label class="field"><span>${t('a few words, hidden inside')}</span><input id="ring-text" type="text" maxlength="20" placeholder="${t('you + me · 06.14')}" value="${esc(r.text)}" data-bind="ring.text" autocomplete="off"></label>
    </fieldset>

    <fieldset><legend>${t('why this one?')} <em>${t('optional')}</em></legend>
      <label class="field"><span class="sr">${t('The story behind this ring')}</span><textarea id="ring-note" rows="3" maxlength="600" placeholder="${t('We picked hearts because of that night on the roof…')}" data-bind="ring.note">${esc(r.note)}</textarea></label>
      ${photoPicker(r.notePhoto, 'ring')}
      <p class="fine">${icon.lock} ${t('This becomes the first memory on your island. Private until you say otherwise.')}</p>
    </fieldset>
  </div>
  <div class="panel-foot"><button class="btn primary big wide" data-act="step" data-v="island">${t(S().grown ? 'back to the island' : 'grow the island')} ${icon.arrow}</button></div>`;
}

function photoPicker(id, where) {
  return id
    ? `<div class="photo-row"><img alt="${t('Your photo')}" data-photo="${id}"><button class="btn small quiet" data-act="photo-remove" data-where="${where}">${t('remove photo')}</button></div>`
    : `<label class="btn small quiet file">${icon.plus} ${t('add a photo')}<input type="file" accept="image/*" data-file="${where}" hidden></label>`;
}

function islandPanel() {
  const st = S();
  const pieceTile = (p) => `<button class="tile piece" data-act="add" data-v="${p.id}" title="${esc(t(p.hint))}"><img alt="" src="${pieceIcon(p.id)}"><span>${t(p.name)}</span>${priceTag(productFor('piece', p.id))}</button>`;
  const free = PIECES.filter((p) => !p.price && !p.pack), paid = PIECES.filter((p) => p.price), packs = PACKS.map((k) => ({ k, list: PIECES.filter((p) => p.pack === k.id) }));
  return `
  <div class="panel-body">
    <h2>${t('build your island')}</h2>
    <p class="typer lead">${t('tap a piece to place it. drag it where it belongs. tap it again to tuck a memory inside.')}</p>

    <fieldset><legend>${t('pieces')}</legend>
      <div class="tiles three">${free.map(pieceTile).join('')}</div>
    </fieldset>
    <fieldset><legend>${t('little extras')} <em>${t('$1 each, place them as often as you like')}</em></legend>
      <div class="tiles three">${paid.map(pieceTile).join('')}</div>
    </fieldset>
    ${packs.map(({ k, list }) => `<fieldset><legend>${t(k.name)} <em>${t('3 pieces · {price}', { price: '$' + k.price })}</em></legend><div class="tiles three">${list.map(pieceTile).join('')}</div></fieldset>`).join('')}

    <fieldset><legend>${t('name it')} <em>${t('optional')}</em></legend>
      <label class="field"><span>${t('whose island is this?')}</span><input id="people" type="text" maxlength="40" placeholder="${t('maya + june')}" value="${esc(st.people)}" data-bind="people" autocomplete="off"></label>
      <label class="field"><span>${t('what do you call it?')}</span><input id="title" type="text" maxlength="48" placeholder="${t('the lake house year')}" value="${esc(st.title)}" data-bind="title" autocomplete="off"></label>
    </fieldset>
  </div>
  <div class="panel-foot two"><button class="btn quiet big" data-act="step" data-v="ring">${icon.back} ${t('ring')}</button><button class="btn primary big" data-act="step" data-v="share">${t('share')} ${icon.arrow}</button></div>`;
}

function memoryPanel(i) {
  const def = byId(PIECES, i.type), m = i.memory || {}, pub = !!m.public;
  const from = i.from === 'ring' ? t('holds what you wrote about the ring') : '';
  return `
  <div class="panel-body">
    <button class="btn small quiet" data-act="sel-back">${icon.back} ${t('all pieces')}</button>
    <div class="piece-head"><img alt="" src="${pieceIcon(i.type)}"><label class="field grow"><span>${t('what is this, to you?')}</span><input id="lbl" type="text" maxlength="36" placeholder="${esc(t(def.name))}" value="${esc(i.label)}" data-bind="sel.label" autocomplete="off"></label></div>
    ${from ? `<p class="from">${from}</p>` : `<p class="typer">${esc(t(def.hint))}${t('.')}</p>`}
    ${trialNote(productFor('piece', i.type))}

    <div class="snap edit">
      <i class="tape"></i>
      ${m.photo ? `<img alt="${t('Memory photo')}" data-photo="${m.photo}"><button class="btn small quiet over" data-act="photo-remove" data-where="mem">${t('remove')}</button>` : `<label class="drop file">${icon.plus}<b>${t('add a photo')}</b><small>${t('it stays on this device')}</small><input type="file" accept="image/*" data-file="mem" hidden></label>`}
      <input id="mem-title" class="caption" type="text" maxlength="60" placeholder="${t('give it a name')}" value="${esc(m.title || '')}" data-bind="mem.title" aria-label="${t('Memory title')}" autocomplete="off">
    </div>
    <label class="field"><span>${t('when')}</span><input id="mem-date" type="date" value="${esc(m.date || '')}" data-bind="mem.date"></label>
    <label class="field"><span>${t('the story')}</span><textarea id="mem-story" rows="5" maxlength="1200" placeholder="${t('What happened, in your own words.')}" data-bind="mem.story">${esc(m.story || '')}</textarea></label>

    <fieldset class="tight"><legend>${t('who can open this memory?')}</legend>
      <div class="seg"><button class="${pub ? '' : 'on'}" data-act="mem-vis" data-v="0">${icon.lock} ${t('just us')}</button><button class="${pub ? 'on' : ''}" data-act="mem-vis" data-v="1">${icon.eye} ${t('anyone with the link')}</button></div>
      <p class="fine">${t(pub ? 'Visitors can open this photo and story.' : 'Visitors see the piece on your island, never what is inside it.')}</p>
    </fieldset>
    <div class="row"><button class="btn small quiet" data-act="sel-turn">${icon.turn} ${t('turn')}</button><button class="btn small quiet danger" data-act="sel-del">${icon.bin} ${t('remove piece')}</button></div>
  </div>
  <div class="panel-foot"><button class="btn ink big wide" data-act="sel-back">${t('done')}</button></div>`;
}

function sharePanel() {
  const st = S(), mems = st.items.filter((i) => hasMemory(i.memory)), tr = store.trials(st), open = mems.filter((i) => i.memory.public).length;
  return `
  <div class="panel-body">
    <h2>${t("share it, or don't.")}</h2>
    <p class="sub">${t("The look of your island can travel. What's inside each piece stays with you unless you open it here.")}</p>

    <fieldset><legend>${t('on the outside')}</legend>
      <label class="switch"><input type="checkbox" id="sh-names" data-act-change="share" data-k="names" ${st.share.names ? 'checked' : ''}><i></i><span>${t('show our names')}${st.people ? ` <em>(${esc(st.people)})</em>` : ''}</span></label>
      <label class="switch"><input type="checkbox" id="sh-eng" data-act-change="share" data-k="engraving" ${st.share.engraving ? 'checked' : ''}><i></i><span>${t('show the engraving')}${st.ring.text ? ` <em>(${esc(st.ring.text)})</em>` : ''}</span></label>
    </fieldset>

    <fieldset><legend>${t('memories')} <em>${t('{n} of {m} open to visitors', { n: open, m: mems.length })}</em></legend>
      ${mems.length ? mems.map((i) => `<div class="mem-row"><img alt="" src="${pieceIcon(i.type)}"><div><b>${esc(i.memory.title || pieceName(i))}</b><span>${esc(pieceName(i))}</span></div><div class="seg mini"><button class="${i.memory.public ? '' : 'on'}" data-act="row-vis" data-id="${i.id}" data-v="0" aria-label="${t('Just us')}">${icon.lock}</button><button class="${i.memory.public ? 'on' : ''}" data-act="row-vis" data-id="${i.id}" data-v="1" aria-label="${t('Anyone with the link')}">${icon.eye}</button></div></div>`).join('') : `<p class="empty">${t('No memories yet. Go back to the island, tap a piece, and add a photo or a few lines.')}</p>`}
    </fieldset>

    ${tr.length ? `<fieldset><legend>${t('still trying')}</legend>${tr.map((p) => `<div class="trial"><span><b>${esc(p.name)}</b> · ${esc(p.blurb)}</span><button class="btn small ink" data-act="buy" data-sku="${p.sku}">${t('get it · {price}', { price: '$' + p.price })}</button></div>`).join('')}<p class="fine">${t("Trial pieces are left out of a shared island until they're yours.")}</p></fieldset>` : ''}

    <button class="btn quiet big wide" data-act="preview">${icon.eye} ${t('see it as a stranger would')}</button>
    <div id="link-box"></div>
    <p class="fine"><span><b>${t('Preview build.')}</b> ${t('There is no server yet, so the link itself carries the public parts of your island. Private memories are not in it at all.')}</span></p>
  </div>
  <div class="panel-foot two"><button class="btn quiet big" data-act="step" data-v="island">${icon.back} ${t('island')}</button><button class="btn primary big" data-act="link">${t('copy a link')}</button></div>`;
}

// What leaves the device: no trial pieces, and only what store.snapshot lets through.
async function publicSnapshot() {
  const st = S(), unowned = new Set(store.trials(st).map((p) => p.sku));
  const clean = { ...st, items: st.items.filter((i) => { const p = productFor('piece', i.type); return !p || !unowned.has(p.sku); }) };
  if (unowned.has('ring:' + st.ring.id)) clean.ring = { ...st.ring, id: 'charm', metal: null };
  return store.snapshot(clean);
}

// ---------- viewer ----------
function openViewer(snap, { kind }) {
  const used = [...new Set(snap.items.map((i) => i.type))];
  const ringDef = ringOf(snap.ring.id);
  const chip = (p) => (p ? `<span class="tag">$${p.price}</span>` : `<span class="tag free">${t('free')}</span>`);
  const open = snap.items.filter((i) => hasMemory(i.memory));
  setView('viewer', `
  <section class="studio viewer">
    <div class="studio-stage"><div class="stage-slot"></div></div>
    <aside class="panel">
      <div class="panel-body">
        ${kind === 'preview' ? `<div class="banner">${icon.eye}<span>${t('This is exactly what a stranger with your link sees.')}</span></div>` : ''}
        ${kind === 'sample' ? `<p class="from">${t('a sample island, made by us')}</p>` : ''}
        <h2>${esc(snap.title || t('an island'))}</h2>
        ${snap.people ? `<p class="sub">${esc(snap.people)}</p>` : ''}
        <p class="typer lead">${open.length === 1 ? t('tap a pin to open the memory they chose to share.') : open.length ? t('tap a pin to open one of {n} memories they chose to share.', { n: open.length }) : t('they kept their memories private. the island is still nice to look at.')}</p>
        <fieldset><legend>${t("what's on this island")}</legend>
          <div class="used"><div class="used-row"><img alt="" src="${ringThumb(ringDef.id, snap.ring)}"><span>${t(ringDef.name)}</span>${chip(productFor('ring', ringDef.id))}</div>
          ${used.map((type) => `<div class="used-row"><img alt="" src="${pieceIcon(type)}"><span>${t(byId(PIECES, type).name)}</span>${chip(productFor('piece', type))}</div>`).join('')}</div>
        </fieldset>
      </div>
      <div class="panel-foot ${kind === 'preview' ? '' : 'two'}">
        ${kind === 'preview' ? `<button class="btn ink big wide" data-act="go" data-v="#/make">${icon.back} ${t('back to editing')}</button>` : `<a class="btn quiet big" href="#/explore">${icon.back} ${t('explore')}</a><button class="btn primary big" data-act="borrow">${t('start with this look')}</button>`}
      </div>
    </aside>
  </section>`);
  app.view.snap = snap; app.view.kind = kind;
  mountStage($('.stage-slot'));
  showLook({ ring: snap.ring, items: forWorld(snap.items), src: snap }, { mode: 'island', readOnly: true, autoRotate: true });
  stageUI();
}

function memoryCard(i) {
  const m = i.memory;
  openModal(`
    <figure class="snap big"><i class="tape"></i>
      ${m.photoData ? `<img alt="${esc(m.title || t('Shared photo'))}" src="${m.photoData}">` : `<div class="stand-in sky-bg"><img alt="" src="${pieceIcon(i.type)}"></div>`}
      <figcaption class="hand">${esc(m.title || pieceName(i))}</figcaption>
    </figure>
    <div class="card-text">${niceDate(m.date) ? `<p class="when">${niceDate(m.date)} · ${esc(pieceName(i))}</p>` : `<p class="when">${esc(pieceName(i))}</p>`}<p class="story">${esc(m.story || '')}</p></div>`, 'memory');
}

function onSelect(id) {
  if (app.view.name === 'make') {
    if (S().step !== 'island') return;
    const changed = app.sel !== id;
    app.sel = id; renderPanel();
    if (changed) { $('#panel').scrollTop = 0; if (id && matchMedia('(max-width: 900px)').matches) window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' }); }
    return;
  }
  if (!id) return;
  const src = app.look && app.look.src, i = src && src.items.find((x) => x.id === id);
  if (!i) return;
  if (hasMemory(i.memory)) memoryCard(i); else toast(t(byId(PIECES, i.type).name));
  world.select(null, true);
}

// ---------- modals ----------
function openModal(html, cls = '') {
  $('#modal-root').innerHTML = `<div class="scrim" data-act="modal-close"><div class="modal ${cls}" role="dialog" aria-modal="true"><button class="x" data-act="modal-close" aria-label="${t('Close')}">${icon.x}</button>${html}</div></div>`;
  document.body.classList.add('modal-open');
}
function closeModal() { $('#modal-root').innerHTML = ''; document.body.classList.remove('modal-open'); }

function checkout(sku) {
  const all = [...RINGS.map((s) => productFor('ring', s.id)), ...PIECES.map((p) => productFor('piece', p.id))].filter(Boolean);
  const p = all.find((x) => x.sku === sku);
  if (!p) return;
  const kind = sku.split(':')[0], id = sku.split(':')[1];
  const art = kind === 'piece' ? `<img alt="" src="${pieceIcon(id)}">` : kind === 'pack' ? PIECES.filter((x) => x.pack === id).map((x) => `<img alt="" src="${pieceIcon(x.id)}">`).join('') : `<img alt="" src="${ringThumb(id)}">`;
  openModal(`
    <div class="buy-art ${kind}">${art}</div>
    <h3>${esc(p.name)}</h3>
    <p class="sub">${t('{blurb}. Yours to keep, on every island you make.', { blurb: esc(p.blurb) })}</p>
    <div class="demo-note"><b>${t('Demo checkout.')}</b> ${t('Nothing is charged and no card is asked for. In the real thing this is a one-time {price}, no subscription.', { price: '$' + p.price })}</div>
    <button class="btn primary big wide" data-act="buy-yes" data-sku="${p.sku}">${t('get it · {price}', { price: '$' + p.price })} <small>${t('(demo)')}</small></button>
    <button class="btn quiet wide" data-act="modal-close">${t('not now')}</button>`, 'buy');
}

// ---------- actions ----------
const actions = {
  go: (el) => { location.hash = el.dataset.v; },
  'hero-toggle': () => { world.setMode(world.mode === 'island' ? 'ring' : 'island', { animate: !calm }); stageUI(); },
  step: (el) => goStep(el.dataset.v),
  fam: (el) => { app.fam = el.dataset.v; renderPanel(); },
  'ring-pick': (el) => {
    const st = S(), before = ringOf(st.ring.id).form;
    if (st.ring.id === el.dataset.v) return;
    st.ring = { ...st.ring, id: el.dataset.v, metal: null, accent: null };
    store.refit(st, before);
    refreshOwn(); persist(); renderPanel();
  },
  'ring-set': (el) => { const st = S(), def = ringOf(st.ring.id); st.ring[el.dataset.k] = el.dataset.v === def[el.dataset.k] ? null : el.dataset.v; world.setRing(st.ring); persist(); renderPanel(); },
  'start-with': (el) => { const st = S(); if (!st.touched) { st.ring = { ...st.ring, id: el.dataset.v, metal: null, accent: null }; st.step = 'ring'; persist(); } location.hash = '#/make'; },
  add: (el) => {
    const st = S(), def = byId(PIECES, el.dataset.v);
    if (st.items.length >= 28) return toast(t('That is a full island. Remove a piece to add another.'));
    const it = store.newItem(def.id, world.freeSpot());
    st.items.push(it);
    world.syncItems(forWorld(st.items)); world.pop(it.id);
    persist();
    const p = productFor('piece', def.id);
    toast(p && !store.owns(st, p) ? t("{name} placed. You're trying it, {price} to keep.", { name: t(def.name), price: '$' + p.price }) : t('{name} placed. Drag it where it belongs.', { name: t(def.name) }));
    if (matchMedia('(max-width: 900px)').matches) window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
  },
  'sel-back': () => { app.sel = null; world.select(null, true); renderPanel(); },
  'sel-turn': () => { const i = item(app.sel); if (!i) return; i.rot = ((i.rot || 0) + Math.PI / 4) % (Math.PI * 2); world.syncItems(forWorld(S().items)); persist(); },
  'sel-del': () => {
    const st = S(), i = item(app.sel); if (!i) return;
    if (hasMemory(i.memory) && !confirm(t('Remove this piece and the memory inside it? This cannot be undone.'))) return;
    if (i.memory && i.memory.photo) store.photos.del(i.memory.photo);
    st.items = st.items.filter((x) => x.id !== i.id); app.sel = null;
    world.syncItems(forWorld(st.items)); persist(); renderPanel();
  },
  'mem-vis': (el) => { const i = item(app.sel); if (!i) return; i.memory = { title: '', date: '', story: '', photo: null, ...i.memory, public: el.dataset.v === '1' }; world.syncItems(forWorld(S().items)); persist(); renderPanel(); },
  'row-vis': (el) => { const i = item(el.dataset.id); if (!i) return; i.memory.public = el.dataset.v === '1'; world.syncItems(forWorld(S().items)); persist(); renderPanel(); },
  'photo-remove': (el) => {
    const st = S();
    if (el.dataset.where === 'ring') { store.photos.del(st.ring.notePhoto); st.ring.notePhoto = null; }
    else { const i = item(app.sel); if (i && i.memory) { store.photos.del(i.memory.photo); i.memory.photo = null; } }
    world.syncItems(forWorld(st.items)); persist(); renderPanel();
  },
  buy: (el) => checkout(el.dataset.sku),
  'buy-yes': (el) => { const st = S(); if (!st.owned.includes(el.dataset.sku)) st.owned.push(el.dataset.sku); persist(); closeModal(); renderPanel(); toast(t('Yours now. (Demo: nothing was charged.)')); },
  'modal-close': (el, e) => { if (e.target.closest('.modal') && !e.target.closest('[data-act="modal-close"]')) return; closeModal(); },
  preview: async () => { app.preview = await publicSnapshot(); location.hash = '#/preview'; },
  link: async () => {
    const snap = await publicSnapshot(), url = location.origin + location.pathname + '#/v/' + (await store.encode(snap));
    const box = $('#link-box'), openCount = snap.items.filter((i) => i.memory).length;
    box.innerHTML = `<label class="field"><span>${t(openCount === 1 ? 'your link · {kb} KB · 1 open memory inside' : 'your link · {kb} KB · {n} open memories inside', { kb: Math.ceil(url.length / 1024), n: openCount })}</span><input id="share-link" type="text" readonly value="${esc(url)}"></label>`;
    try { await navigator.clipboard.writeText(url); toast(t('Link copied.')); } catch { $('#share-link').select(); toast(t('Select the link and copy it.')); }
    box.scrollIntoView({ block: 'nearest' });
  },
  reset: () => {
    if (!confirm(t('Erase the island saved on this device, including its photos and stories? This cannot be undone.'))) return;
    const st = S();
    [st.ring.notePhoto, ...st.items.map((i) => i.memory && i.memory.photo)].filter(Boolean).forEach((id) => store.photos.del(id));
    store.wipe(); app.state = store.fresh();
    openHome(false); toast(t('Erased. A fresh ring is waiting.'));
  },
  // Switching language redraws the current page in place. Icons are repainted because the signpost carries text.
  lang: (el) => {
    if (el.dataset.v === getLang()) return;
    setLang(el.dataset.v);
    app.quiet = true;
    try { route(); } finally { app.quiet = false; }
  },
  borrow: () => {
    const st = S(), src = app.view.snap; if (!src) return;
    const before = ringOf(st.ring.id).form;
    st.ring = { ...st.ring, id: src.ring.id, metal: src.ring.metal || null, accent: src.ring.accent || null };
    store.refit(st, before); st.step = 'ring'; persist();
    location.hash = '#/make';
    toast(t('Look borrowed. Now make it yours.'));
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = actions[el.dataset.act];
  if (fn) { if (el.tagName === 'BUTTON') e.preventDefault(); fn(el, e); }
});

let ringTimer = null;
document.addEventListener('input', (e) => {
  const el = e.target, path = el.dataset && el.dataset.bind;
  if (!path) return;
  const st = S(), [scope, key] = path.includes('.') ? path.split('.') : ['', path];
  if (scope === 'ring') { st.ring[key] = el.value; if (key === 'text') { clearTimeout(ringTimer); ringTimer = setTimeout(() => world.setRing(st.ring), 160); } }
  else if (scope === 'sel') { const i = item(app.sel); if (i) i[key] = el.value; }
  else if (scope === 'mem') {
    const i = item(app.sel); if (!i) return;
    const had = hasMemory(i.memory);
    i.memory = { title: '', date: '', story: '', photo: null, public: false, ...i.memory, [key]: el.value };
    if (had !== hasMemory(i.memory)) world.syncItems(forWorld(st.items));
  } else st[key] = el.value;
  persist();
});

document.addEventListener('change', async (e) => {
  const el = e.target;
  if (el.dataset.actChange === 'share') { S().share[el.dataset.k] = el.checked; persist(); return; }
  if (!el.dataset.file || !el.files || !el.files[0]) return;
  try {
    const id = await store.photos.put(await store.shrink(await store.readFile(el.files[0])));
    const st = S();
    if (el.dataset.file === 'ring') st.ring.notePhoto = id;
    else { const i = item(app.sel); if (!i) return; i.memory = { title: '', date: '', story: '', public: false, ...i.memory, photo: id }; }
    world.syncItems(forWorld(st.items)); persist(); renderPanel();
  } catch (err) { toast(err.message || t('That photo did not load. Try another one.')); }
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
window.addEventListener('hashchange', route);
applyTheme();
renderNav();
setInterval(() => { if (applyTheme()) { app.quiet = true; try { route(); } finally { app.quiet = false; } } }, 60000);
window.ringcay = { app, get world() { return world; } }; // handy in the console
window.addEventListener('error', (e) => { (window.ringcay.errors ||= []).push(String(e.message)); });

(document.fonts ? document.fonts.load('40px "Nanum Pen Script"').catch(() => {}) : Promise.resolve()).then(() => {
  try { route(); } catch (err) {
    console.error(err);
    $('#view').innerHTML = '<section class="hero"><div class="hero-copy"><h1>' + t('this browser could not draw the island.') + '</h1><p class="lede">' + t('ringcay needs WebGL. Try a current version of Chrome, Safari, Edge or Firefox.') + '</p></div></section>';
  }
});
