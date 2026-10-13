// 3.9.1 · LA PEÑA DE LOS SÁBADOS, las reglas (módulo puro, se prueba en Node). Lo que se ve y se hace en el juego está en pena-juego.js (los parroquianos, el
// truco, el que se arrima a tu mesa, el baile con Dalia) y lo que suena y se toca en pena-mundo.js (la guitarra y el bombo, sintetizados).
//
// Acá: cuándo es la peña y qué baila Dalia (aldea.js), los dos bailes que te ofrece, cuánto rinde bailar (con lo aprendido en las clases de Pocha), los
// chistes de doble sentido de Lucrecia y de Dalia (con confianza o con amor se animan más, y una rotación con memoria para que no repitan seguido) y la
// borrachera (cuánto sube cada trago, cuánto baja con el tiempo y qué hace en la pantalla; leve, sin consecuencias duras).
import { nivelDe } from './vecindad.js';
import { etapaAmor } from './amor.js';
import { CHISTES, BORRACHERA_MOZA, ARRIMA, TRUCO_CANTINA } from './pena-voces.js';


const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const acotar = (x, a, b) => Math.max(a, Math.min(b, x));

// ---------------------------------------------------------------- los bailes de la peña
// `skill`: sale de lo aprendido con Pocha (los niveles de chamamé y de chacarera de las fiestas: fiestas.js `baile`). `dura`: segundos de baile con vos.
export const BAILES_PENA = {
  tango: { id: 'tango', nombre: 'tango', pose: 'tango', musica: 'tango', dura: 20, texto: 'Un tango: bien pegaditos' },
  chamame: { id: 'chamame', nombre: 'chamamé', pose: 'chamame', musica: 'chamame', dura: 18, texto: 'Un chamamé: con un poco más de aire' },
};
export const IDS_BAILES_PENA = Object.keys(BAILES_PENA);
// Lo que sabés bailar (0 a 3): el mejor de tus niveles de las clases de Pocha (chamamé y chacarera), y para el tango, uno menos que eso (se aprende en otra parte)
export function nivelDeBaile(fiestas, baile) {
  const b = fiestas && typeof fiestas.baile === 'object' && fiestas.baile ? fiestas.baile : {};
  const mejor = Math.max(0, Math.min(3, Math.floor(num(b.chamame))), Math.min(3, Math.floor(num(b.chacarera))));
  return baile === 'tango' ? Math.max(0, mejor - 1) : mejor;
}
// Cuánto descansado te deja un baile (como el de la pista de la fiesta: 1 hora y media más por nivel) y cuánta amistad le suma a tu pareja
export const descansoDeBaile = (nivel) => 1 + 0.5 * acotar(Math.floor(num(nivel)), 0, 3);
export const amistadDeBaile = (nivel) => 2 + acotar(Math.floor(num(nivel)), 0, 3);

// Cuándo te saca a bailar: cada tanto, pasada la mitad de una tanda (en segundos reales; cuanto más rato lleve la noche, más seguido)
export const INVITACION = { primera: 25, entre: [95, 150], rechazo: 210, cerca: 9, pega: 0.75 };
export const proximaInvitacion = (semilla = 0, rechazo = false) => (rechazo ? INVITACION.rechazo : INVITACION.entre[0] + (INVITACION.entre[1] - INVITACION.entre[0]) * ((Math.abs(Math.floor(semilla) * 2654435761) % 1000) / 1000));

// ---------------------------------------------------------------- la confianza (para los chistes)
// 0 = recién conocida; 1 = amigos; 2 = compadres o coqueteo; 3 = romance (saliendo en adelante)
const ETAPAS_DE_AMOR = ['saliendo', 'novios', 'comprometidos', 'casados'];
export function confianzaDe(p, clave) {
  let n = 0;
  try { n = Math.max(0, ['conocido', 'amigo', 'compadre'].indexOf(nivelDe(clave, p))); } catch { n = 0; }
  let e = 'conocidos';
  try { e = etapaAmor(clave, p); } catch { e = 'conocidos'; }
  if (ETAPAS_DE_AMOR.includes(e)) return 3;
  if (e === 'coqueteo') return Math.max(2, n);
  return n;
}

// ---------------------------------------------------------------- los chistes
// Cuánto salen (0 a 1) en cada situación y cuánto suben con la confianza
export const PROB_CHISTE = {
  sentarse: 0.55, pedir: 0.7, cuenta: 0.85, tomar: 0.3, despedida: 0.5, invitar: 1, elegir: 1, paso: 0.55, pies: 0.35, calor: 0.5, bailando: 0.6, pena: 0.5,
};
const MEMORIA = 3;
// Un hash chico de un texto o número (determinista)
const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
const azarDe = (s) => (hash(s) % 10007) / 10007;
// Los bancos que valen para esa situación con esa confianza: primero el de la situación y, según cuánta confianza haya, los más atrevidos
export function bancosDe(clave, situacion, sub, confianza) {
  const B = CHISTES[clave];
  if (!B) return [];
  const base = situacion === 'pedir' ? (sub && Array.isArray(B.pedir?.[sub]) ? B.pedir[sub] : []) : Array.isArray(B[situacion]) ? B[situacion] : [];
  const lista = [{ banco: `${clave}.${situacion}${sub ? '.' + sub : ''}`, textos: base, peso: 3 }];
  if (confianza >= 1 && Array.isArray(B.confianza)) lista.push({ banco: `${clave}.confianza`, textos: B.confianza, peso: confianza >= 2 ? 1.5 : 0.8 });
  if (confianza >= 3 && Array.isArray(B.amor)) lista.push({ banco: `${clave}.amor`, textos: B.amor, peso: 2 });
  // (los guiños con las cosas de la cantina, de Lucrecia: sólo con mucha confianza o con amor, nunca la primera visita)
  if (clave === 'moza' && confianza >= 2 && Array.isArray(B.mesa)) lista.push({ banco: 'moza.mesa', textos: B.mesa, peso: confianza >= 3 ? 1.2 : 0.5 });
  return lista.filter((x) => x.textos.length);
}
// Elige un chiste (o null) y deja anotado cuál salió en `memoria` (un objeto { banco: [índices] } que se guarda en la partida): no repite ninguno de los
// últimos que salieron de ese banco. `semilla`: lo que hace distinto cada vez (el día, las veces, el contador).
export function elegirChiste(clave, situacion, sub, memoria, { confianza = 0, semilla = 0, siempre = false } = {}) {
  const p = (PROB_CHISTE[situacion] ?? 0.5) + 0.07 * confianza;
  if (!siempre && azarDe(`${clave}|${situacion}|${sub || ''}|${semilla}|p`) >= Math.min(0.95, p)) return null;
  const bancos = bancosDe(clave, situacion, sub, confianza);
  if (!bancos.length) return null;
  // cuál banco: por peso
  const total = bancos.reduce((s, b) => s + b.peso, 0);
  let r = azarDe(`${clave}|${situacion}|${sub || ''}|${semilla}|b`) * total, banco = bancos[0];
  for (const b of bancos) { r -= b.peso; if (r < 0) { banco = b; break; } }
  const mem = memoria && typeof memoria === 'object' ? memoria : {};
  const vistos = Array.isArray(mem[banco.banco]) ? mem[banco.banco] : [];
  const libres = banco.textos.map((_t, i) => i).filter((i) => !vistos.includes(i));
  const pool = libres.length ? libres : banco.textos.map((_t, i) => i).filter((i) => i !== vistos[vistos.length - 1]);
  const i = (pool.length ? pool : [0])[Math.floor(azarDe(`${clave}|${situacion}|${sub || ''}|${semilla}|i`) * (pool.length || 1)) % (pool.length || 1)];
  mem[banco.banco] = [...vistos, i].slice(-Math.max(1, Math.min(MEMORIA, banco.textos.length - 1)));
  return banco.textos[i];
}
// La memoria de chistes, saneada para guardar (sólo claves y números chicos)
export function sanearMemoriaChistes(v) {
  const r = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return r;
  for (const [k, l] of Object.entries(v).slice(0, 60)) {
    if (!/^[a-z0-9.\-]{1,40}$/.test(k) || !Array.isArray(l)) continue;
    const xs = l.map((x) => Math.floor(num(x, -1))).filter((x) => x >= 0 && x < 100).slice(-MEMORIA);
    if (xs.length) r[k] = xs;
  }
  return r;
}

// ---------------------------------------------------------------- la borrachera
// Cada sorbo de un trago fuerte sube el nivel, cada hora de juego lo baja, y un mate cocido lo baja de golpe. Es leve (no marea de verdad), gracioso, sin
// consecuencias duras: se te mueve un poquito la imagen y caminás torcido un rato. En los ajustes se puede suavizar o apagar.
export const EBRIO = { fuerte: 0.34, cerveza: 0.08, mate: -0.5, pierdePorHora: 0.6, tope: 3, achispado: 0.35, alegre: 1.1, torcido: 2.0 };
export const FASES_EBRIO = ['sobrio', 'achispado', 'alegre', 'torcido'];
export function ebrioNuevo() { return { n: 0, t: 0 }; }
// El nivel ahora (`ahora`: horas absolutas del juego, día × 24 + hora)
export function nivelEbrio(e, ahora) {
  if (!e || typeof e !== 'object') return 0;
  return Math.max(0, num(e.n) - EBRIO.pierdePorHora * Math.max(0, num(ahora) - num(e.t)));
}
export function faseEbrio(nivel) {
  const n = num(nivel);
  return n < EBRIO.achispado ? 'sobrio' : n < EBRIO.alegre ? 'achispado' : n < EBRIO.torcido ? 'alegre' : 'torcido';
}
// Un sorbo de `item` de la carta: devuelve el estado nuevo (no toca el viejo)
export function sorberConAlcohol(e, item, ahora) {
  const base = nivelEbrio(e, ahora);
  const mas = item?.fuerte ? EBRIO.fuerte : /^cerveza/.test(item?.id || '') || item?.alcohol === 'suave' ? EBRIO.cerveza : /mate-cocido/.test(item?.id || '') ? EBRIO.mate : 0;
  return { n: acotar(Math.round((base + mas) * 1000) / 1000, 0, EBRIO.tope), t: num(ahora) };
}
export function sanearEbrio(v, ahora = 1e6) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return ebrioNuevo();
  return { n: acotar(num(v.n), 0, EBRIO.tope), t: acotar(num(v.t), 0, Math.max(0, num(ahora))) };
}
// El efecto en la pantalla para ese nivel y ese instante `t` (segundos): un balanceo muy leve de la cámara y, al caminar, una deriva del rumbo. `mult`: el ajuste
// (1 normal, 0,5 suave, 0 apagado). Con el nivel bajo, nada.
export function efectoEbrio(nivel, t, mult = 1) {
  const k = acotar(num(mult), 0, 1);
  if (!(num(nivel) > EBRIO.achispado - 0.05) || k <= 0) return null;
  const a = acotar((num(nivel) - 0.3) / 2.2, 0, 1) * k;
  return { roll: Math.sin(t * 0.9) * 0.026 * a, yaw: Math.sin(t * 0.55 + 1) * 0.014 * a, pitch: Math.sin(t * 0.7 + 2) * 0.009 * a, deriva: Math.sin(t * 0.43) * 0.26 * a, amplitud: a };
}
export const MULT_BORRACHERA = { normal: 1, suave: 0.5, apagado: 0 };
export const AJUSTES_BORRACHERA = ['normal', 'suave', 'apagado'];
export const sanearAjusteBorrachera = (v) => (AJUSTES_BORRACHERA.includes(v) ? v : 'normal');

// ---------------------------------------------------------------- los que se arriman y el truco
// Cuántos segundos sentado (con la moza libre) antes de que alguien venga a hacerte compañía, y cuánto se queda
export const ARRIMA_TIEMPO = { espera: [22, 40], se_queda: [16, 26], entre: 120 };
// Qué dice `clave` al arrimarse (una frase suya si la tiene, o una genérica)
export function frasesDeArrima(clave, semilla = 0) {
  const propias = ARRIMA.por?.[clave];
  const l = Array.isArray(propias) && propias.length ? propias : ARRIMA.general;
  return [l[Math.abs(Math.floor(semilla)) % l.length], ARRIMA.general[Math.abs(Math.floor(semilla) + 3) % ARRIMA.general.length]];
}
export const cantarTruco = (semilla = 0) => TRUCO_CANTINA.cantan[Math.abs(Math.floor(semilla)) % TRUCO_CANTINA.cantan.length];
export const invitarAlTruco = (semilla = 0) => TRUCO_CANTINA.invitan[Math.abs(Math.floor(semilla)) % TRUCO_CANTINA.invitan.length];

// ---------------------------------------------------------------- todo lo que lee el jugador (para la prueba de textos)
export function textosPena() {
  const t = [];
  const rec = (x) => { if (typeof x === 'string') t.push(x); else if (Array.isArray(x)) x.forEach(rec); else if (x && typeof x === 'object') Object.values(x).forEach(rec); };
  rec(CHISTES); rec(BORRACHERA_MOZA); rec(ARRIMA); rec(TRUCO_CANTINA);
  for (const b of Object.values(BAILES_PENA)) t.push(b.texto);
  return t;
}
