// Languages. English is the source: every piece of copy in the code is written in English and passed through t().
// A language file (see zh.js) maps each English line to its translation. A line with no translation shows in English.
// To add a language: copy zh.js, translate the right-hand sides, and add it to PACKS and LANGS below.
import { ZH } from './zh.js';

const KEY = 'little-atoll.lang';
const PACKS = { zh: ZH };
export const LANGS = [
  { id: 'en', label: 'EN', name: 'English', html: 'en', locale: 'en-US' },
  { id: 'zh', label: '中文', name: '中文', html: 'zh-CN', locale: 'zh-CN' },
];

function first() {
  try { const saved = localStorage.getItem(KEY); if (LANGS.some((l) => l.id === saved)) return saved; } catch {}
  return (navigator.language || 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

let lang = first();
const info = () => LANGS.find((l) => l.id === lang);
const apply = () => { document.documentElement.lang = info().html; };
apply();

export const getLang = () => lang;
export const locale = () => info().locale;
export function setLang(id) {
  if (!LANGS.some((l) => l.id === id)) return;
  lang = id;
  try { localStorage.setItem(KEY, id); } catch {}
  apply();
}

// t('Hello {name}', { name: 'June' }). Values are dropped in after the line is translated.
export function t(text, vars) {
  const pack = PACKS[lang];
  let out = pack && pack[text] !== undefined ? pack[text] : text;
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
  return out;
}
