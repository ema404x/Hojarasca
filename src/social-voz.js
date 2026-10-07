// 3.7.4: las voces tipo Los Sims: un balbuceo inventado (sílabas sin sentido) con la voz de cada uno. Esto es lo que
// piensa (sin audio, se prueba en Node): la voz de cada persona (el tono, la velocidad y el timbre; los chicos más
// agudos, los mayores más graves y un poco más lentos, cada uno con lo suyo, siempre igual) y el plan de las sílabas de
// un renglón (cuántas, con qué vocal, con qué consonante y con qué entonación: la pregunta sube al final, el ¡! va más
// arriba). Lo sintetiza `Sonido.balbuceo` (sonido.js), en el bus de los efectos.
import { aspectoGente } from './gente-ropa.js';

function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
function azar(semilla) { let s = (Math.floor(Number(semilla) * 4294967296) >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// Las vocales (los dos primeros formantes, en Hz, de una voz de hombre adulto)
export const VOCALES = { a: [780, 1240], e: [480, 1820], i: [310, 2250], o: [520, 900], u: [340, 790] };
const LETRAS_VOCAL = Object.keys(VOCALES);
// Las consonantes: cómo suena el ruido del ataque (la banda y el largo) y si corta la voz antes
export const CONSONANTES = {
  p: { frec: 900, q: 0.8, dur: 0.018, corta: true }, t: { frec: 3200, q: 1.2, dur: 0.02, corta: true }, k: { frec: 2100, q: 1, dur: 0.024, corta: true },
  s: { frec: 5200, q: 1.6, dur: 0.07, corta: false }, f: { frec: 3800, q: 0.7, dur: 0.05, corta: false }, ch: { frec: 3600, q: 1.4, dur: 0.06, corta: true },
  m: { nasal: true }, n: { nasal: true }, l: { liquida: true }, b: { frec: 600, q: 0.7, dur: 0.012, corta: true },
};
const LETRAS_CONS = Object.keys(CONSONANTES);

// La voz de alguien: por su clave (la de la figura: 'ramon', 'aldea-jefe'…; o la de la vecindad) y lo que se sepa de él.
// { f0 (Hz), velocidad (sílabas por segundo), timbre (corre los formantes), aspereza, temblor (Hz), vocales, consonantes }
export function vozDe(clave, extra = {}) {
  // (la clave de la figura, o la de la vecindad: 'carpintero' es 'poblador-carpintero'; 'jefe', 'aldea-jefe')
  const base = String(clave || '').replace(/^(aldea|poblador)-/, '');
  const a = [clave, `aldea-${base}`, `poblador-${base}`].map((k) => aspectoGente(k)).find((x) => x?.conocido) || {};
  const edad = Number.isFinite(extra.edad) ? extra.edad : Number.isFinite(a.edad) ? a.edad : 38;
  const mujer = extra.mujer !== undefined ? !!extra.mujer : !!a.R?.mujer;
  const chico = extra.chico !== undefined ? !!extra.chico : !!a.R?.chico || edad < 13 || (Number(extra.talla) > 0.3 && Number(extra.talla) < 0.8);
  const h = hash(`voz:${clave}`), h2 = hash(`timbre:${clave}`), h3 = hash(`ritmo:${clave}`);
  let f0 = chico ? 285 + h * 50 : mujer ? 196 + h * 34 : 112 + h * 24;
  if (!chico && edad > 60) f0 *= mujer ? 0.9 : 0.88;   // los mayores, más graves
  const timbre = (chico ? 1.24 : mujer ? 1.13 : 1) * (0.95 + h2 * 0.1);
  let velocidad = 6.6 + (h3 - 0.5) * 2;
  if (chico) velocidad += 1.4;
  if (edad > 60) velocidad -= 1.2;
  const aspereza = Math.min(0.6, 0.12 + Math.max(0, edad - 45) / 90 + h2 * 0.08);
  const temblor = edad > 70 ? 5.5 : 0;
  // cada uno tiene sus sílabas favoritas (así no suenan todos igual)
  const r = azar(h * 0.77 + 0.11);
  const vocales = [...LETRAS_VOCAL].sort(() => r() - 0.5).slice(0, 3);
  const consonantes = [...LETRAS_CONS].sort(() => r() - 0.5).slice(0, 4);
  return { clave: String(clave || ''), f0: Math.round(f0), velocidad: +velocidad.toFixed(2), timbre: +timbre.toFixed(3), aspereza: +aspereza.toFixed(3), temblor, vocales, consonantes, chico, mujer, edad };
}

// El plan de un renglón: { dur, silabas: [{ t, dur, f0, f1, f2, vol, cons }] } (t y dur en segundos). Corto: a lo sumo
// unos tres segundos (lo que tarda en aparecer el renglón), aunque el texto sea largo.
export const BALBUCEO = { minSilabas: 2, maxSilabas: 16, letrasPorSilaba: 4.2, maxDur: 3 };
export function planBalbuceo(texto, voz, semilla = 0) {
  const t = String(texto || '').trim();
  const v = voz && typeof voz === 'object' ? voz : vozDe('');
  const r = azar(hash(`${t}:${semilla}:${v.clave}`) * 0.9 + 0.05);
  let n = Math.round(t.length / BALBUCEO.letrasPorSilaba);
  n = Math.max(BALBUCEO.minSilabas, Math.min(BALBUCEO.maxSilabas, n));
  const paso = 1 / Math.max(3, v.velocidad);
  n = Math.min(n, Math.floor(BALBUCEO.maxDur / paso));
  const pregunta = /\?\s*$/.test(t) || /^¿/.test(t), exclama = /!/.test(t);
  const silabas = [];
  let tt = 0;
  for (let i = 0; i < n; i++) {
    const k = n > 1 ? i / (n - 1) : 0;
    // la entonación: arranca arriba y baja de a poco; la pregunta sube al final; el ¡! va más alto
    let ent = 1.08 - 0.16 * k + (r() - 0.5) * 0.1;
    if (pregunta && k > 0.7) ent += (k - 0.7) * 1.1;
    if (exclama) ent += 0.12;
    const vocal = r() < 0.75 ? v.vocales[Math.floor(r() * v.vocales.length)] : LETRAS_VOCAL[Math.floor(r() * LETRAS_VOCAL.length)];
    const cons = r() < 0.8 ? v.consonantes[Math.floor(r() * v.consonantes.length)] : null;
    const [f1, f2] = VOCALES[vocal];
    const dur = paso * (0.75 + r() * 0.5) * (i === n - 1 ? 1.4 : 1);
    silabas.push({ t: +tt.toFixed(3), dur: +dur.toFixed(3), f0: Math.round(v.f0 * ent), f1: Math.round(f1 * v.timbre), f2: Math.round(f2 * v.timbre), vol: +(0.75 + r() * 0.25 + (exclama ? 0.1 : 0)).toFixed(3), cons, vocal });
    // una pausa corta de vez en cuando (las comas)
    tt += dur + (r() < 0.12 ? paso * 0.8 : paso * 0.05);
  }
  return { dur: +tt.toFixed(3), silabas, voz: v };
}
