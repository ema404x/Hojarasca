// 3.7.4: las voces tipo Los Sims: un balbuceo inventado (sílabas sin sentido) con la voz de cada uno. Esto es lo que
// piensa (sin audio, se prueba en Node): la voz de cada persona (el tono, la velocidad y el timbre; los chicos más
// agudos, los mayores más graves y un poco más lentos, cada uno con lo suyo, siempre igual) y el plan de las sílabas de
// un renglón (cuántas, con qué vocal, con qué consonante y con qué entonación: la pregunta sube al final, el ¡! va más
// arriba). Lo sintetiza `Sonido.balbuceo` (sonido.js), en el bus de los efectos.
// 3.8.4: ya no balbucean: murmuran. El usuario: «las voces de los vecinos dan miedo»; quiere un murmullo humano cálido,
// suave y corto («mm», «ah», una risita) que nunca dé miedo. La 3.8.0 no lo empeoró (sólo tocó la voz de los duendes,
// voz-alien.js, que sigue igual): ya era así desde la 3.7.4. Ver `planBalbuceo` y `Sonido.balbuceo`.
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
  // 3.8.4: sin temblor. El vaivén de 5,5 Hz de los mayores de 70 hacía temblar la voz como la de un fantasma (la abuela
  // Herminia y Martín daban miedo); un mayor se nota en lo grave, lo lento y el aire, no en un vibrato.
  const temblor = 0;
  // 3.8.4: el aire que sale con la voz (lo que la hace humana y suave): un poco más en las mujeres y los mayores
  const aliento = +Math.min(0.42, 0.14 + (mujer ? 0.06 : 0) + (chico ? 0.04 : 0) + Math.max(0, edad - 55) / 160 + h2 * 0.05).toFixed(3);
  // cada uno tiene sus sílabas favoritas (así no suenan todos igual)
  const r = azar(h * 0.77 + 0.11);
  const vocales = [...LETRAS_VOCAL].sort(() => r() - 0.5).slice(0, 3);
  const consonantes = [...LETRAS_CONS].sort(() => r() - 0.5).slice(0, 4);
  return { clave: String(clave || ''), f0: Math.round(f0), velocidad: +velocidad.toFixed(2), timbre: +timbre.toFixed(3), aspereza: +aspereza.toFixed(3), temblor, aliento, vocales, consonantes, chico, mujer, edad };
}

// El plan de un renglón: { dur, gesto, silabas: [{ t, dur, f0, f0b, f1, f2, vol, cons, vocal }] } (t y dur en segundos).
// 3.8.4: ya no es un balbuceo de sílabas inventadas (el usuario: «las voces de los vecinos dan miedo»). Dieciséis sílabas
// de zumbido con ruido de «s» y «ch» sonaban a susurro, y con los pulsos de una glotis pasados por dos filtros angostos
// (sin la fundamental) quedaban huecas, como de otro mundo. Ahora es un murmullo humano corto y cálido, lo que uno dice
// sin decir nada: «mm-hm», «a-há», «mmm…», «¿eh?», «¡oh!» o una risita, según el renglón. Dos o tres sílabas, menos de
// un segundo; `f0` es el tono con que arranca la sílaba y `f0b` con el que termina. `cons`: 'm' (con la boca cerrada,
// un zumbido de nariz), 'h' (el aire antes de la vocal) o null.
export const BALBUCEO = { minSilabas: 2, maxSilabas: 5, letrasPorSilaba: 4.2, maxDur: 1.6 };
// Los gestos: [vocal ('m' es la boca cerrada), aire antes, largo (en sílabas de esa voz), tono al arrancar, tono al
// terminar, volumen, pausa después]. Las risitas se arman aparte (`risita`).
export const GESTOS = {
  'mm-hm': [['m', 0, 1.3, 1.0, 0.97, 0.8, 0.35], ['m', 1, 1.6, 1.05, 1.13, 0.9, 0]],          // sí, claro
  'a-ha': [['a', 0, 1.0, 1.0, 1.03, 0.8, 0.15], ['a', 1, 1.6, 1.12, 0.97, 0.9, 0]],           // a-há
  'mmm': [['m', 0, 1.2, 1.04, 1.0, 0.7, 0.05], ['m', 0, 2.1, 1.0, 0.9, 0.75, 0]],             // pensando
  'ah': [['a', 0, 1.1, 1.08, 1.14, 0.85, 0], ['a', 0, 1.6, 1.14, 0.95, 0.75, 0]],             // ah, mirá
  'eh': [['m', 0, 0.8, 1.0, 1.0, 0.65, 0.2], ['e', 1, 0.9, 1.0, 1.1, 0.85, 0], ['e', 0, 1.1, 1.14, 1.34, 0.9, 0]],   // ¿eh?
  'mm?': [['m', 0, 1.0, 0.98, 1.0, 0.7, 0.05], ['m', 0, 0.8, 1.0, 1.06, 0.75, 0], ['m', 0, 1.1, 1.1, 1.3, 0.8, 0]],  // ¿mm?
  'oh': [['o', 1, 1.0, 1.18, 1.3, 0.9, 0], ['o', 0, 1.5, 1.28, 1.0, 0.8, 0]],                 // ¡oh!
};
const DE_DECIR = ['mm-hm', 'a-ha', 'mmm', 'ah'];
const DE_PREGUNTAR = ['eh', 'mm?'];
const DE_EXCLAMAR = ['oh', 'ah'];
// Lo que da risa (risas escritas, chistes) y la chance de reírse con un «¡…!».
const DA_RISA = /(?:j[aeiou]){2,}|\bjaj|\bjej|\bjij|\bri[sé]|\breí|chiste|gracios|carcajada/i;
export const CHANCE_RISA = 0.35;
export const esRisa = (texto, semilla = 0) => DA_RISA.test(String(texto || '')) || (/!/.test(String(texto || '')) && hash(`risa:${texto}:${semilla}`) < CHANCE_RISA);
// Qué gesto le toca a un renglón (siempre el mismo para el mismo renglón y la misma semilla).
export function gestoDe(texto, semilla = 0) {
  const t = String(texto || '').trim();
  const h = hash(`gesto:${t}:${semilla}`);
  if (esRisa(t, semilla)) return 'risa';
  if (/\?\s*$/.test(t) || /^¿/.test(t)) return DE_PREGUNTAR[Math.floor(h * DE_PREGUNTAR.length)];
  if (/!/.test(t)) return DE_EXCLAMAR[Math.floor(h * DE_EXCLAMAR.length)];
  return DE_DECIR[Math.floor(h * DE_DECIR.length)];
}
// La risita: tres sílabas con aire («je-je-je»; los chicos, cuatro y en «i»), cada una más baja y más suave. Abierta y
// tibia: no es la de los duendes (ésa es aguda, nasal y pareja; ver voz-alien.js).
function risita(v, r) {
  const n = v.chico ? 4 : 3;
  const vocal = v.chico ? 'i' : v.mujer ? 'e' : 'a';
  const lista = [];
  for (let i = 0; i < n; i++) lista.push([vocal, 1, 0.62 + r() * 0.12, 1.24 - i * 0.07, 1.18 - i * 0.08, 0.85 - i * 0.14, i < n - 1 ? 0.32 : 0]);
  return lista;
}
export function planBalbuceo(texto, voz, semilla = 0) {
  const t = String(texto || '').trim();
  const v = voz && typeof voz === 'object' ? voz : vozDe('');
  const r = azar(hash(`${t}:${semilla}:${v.clave}`) * 0.9 + 0.05);
  const gesto = gestoDe(t, semilla);
  let partes = gesto === 'risa' ? risita(v, r) : GESTOS[gesto];
  // un renglón largo arranca con un «mm» corto, como quien toma aire para contar
  if (gesto !== 'risa' && t.length > 90 && partes.length < 3) partes = [['m', 0, 0.8, 1.02, 1.0, 0.6, 0.45], ...partes];
  partes = partes.slice(0, BALBUCEO.maxSilabas);
  const paso = 1 / Math.max(3, v.velocidad);
  const silabas = [];
  let tt = 0;
  for (const [vocal, aire, largo, p0, p1, vol, pausa] of partes) {
    const dur = paso * largo * (0.92 + r() * 0.16);
    // la vocal: los dos primeros formantes (la «m» es la boca cerrada: un formante bajo y nada arriba)
    const [f1, f2] = vocal === 'm' ? [270, 1100] : VOCALES[vocal];
    const varia = 1 + (r() - 0.5) * 0.03;   // nadie dice dos veces la misma nota
    silabas.push({ t: +tt.toFixed(3), dur: +dur.toFixed(3), f0: Math.round(v.f0 * p0 * varia), f0b: Math.round(v.f0 * p1 * varia), f1: Math.round(f1 * v.timbre), f2: Math.round(f2 * v.timbre),
      vol: +(vol * (0.92 + r() * 0.08)).toFixed(3), cons: aire ? 'h' : vocal === 'm' ? 'm' : null, vocal });
    tt += dur + paso * pausa;
    if (tt > BALBUCEO.maxDur) break;
  }
  return { dur: +tt.toFixed(3), gesto, silabas, voz: v };
}
