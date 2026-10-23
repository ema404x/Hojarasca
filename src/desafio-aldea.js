// 4.9 dias: la aldea de día (módulo puro: sin THREE ni DOM; se prueba en Node).
//
// Los vecinos aliados del Desafío piden cosas durante el día; cumplirles sube su nivel de ayuda (0, 1 o 2) y
// ese nivel es lo que lee el agente de los aliados para decidir cuánto ayuda cada uno en las noches grandes.
//
// CONTRATO (lo usa `desafio-aliados.js` y todo lo que quiera saber cuánto ayuda un vecino):
//   · `D().aldea = { ayuda: { anselmo, herminia, martin, chicos }, pedidos: {...}, ... }`
//   · `VECINOS_AYUDA`: las cuatro claves.
//   · `nivelAyuda(d, clave)`: 0, 1 o 2 (0 si el vecino no existe, si no hay `aldea` o si el dato es raro).
//   · `aldeaNueva()` y `sanearAldea(v)`: el estado de una partida nueva y el de una guardada (una partida
//     vieja, sin `aldea`, carga con todos en 0).
//
// Cómo funcionan los pedidos:
//   · Cada día, desde que sale el sol hasta una hora antes de la noche, cada vecino que todavía no ayuda a pleno
//     (nivel menor a 2) y ya está en la aldea (pasaron las noches de `DESDE_NOCHE`) pide algo. Uno por vecino
//     a la vez, y como mucho uno por día.
//   · Vale hasta que salen los duendes (`LIMITE_HORA`) de ese mismo día: «hasta la noche». Si no llegás, se pierde
//     sin castigo; mañana pide otra cosa.
//   · Entregarlo cuesta lo pedido (cosas que también servirían para defender): crece con el número de noche. El
//     regalito es siempre bastante menos de lo que costó (`MAX_REGALO`), así nunca es un negocio.
//   · Cumplirlo sube la ayuda de ese vecino un nivel. El primer pedido (nivel 0 → 1) es más liviano que el segundo.
//   · Todo sale de la semilla de la partida y del día con su propio generador (no toca el azar de las noches).
import { hashTexto, generador } from './semilla.js';

export const VECINOS_AYUDA = ['anselmo', 'herminia', 'martin', 'chicos'];
export const NIVEL_MAX = 2;
// (la misma hora en que salen los duendes: `HORA_ATAQUE` de desafio-reglas.js; una prueba lo comprueba. Este archivo
// no importa desafio-reglas.js porque desafio-reglas.js lo importa a él)
export const LIMITE_HORA = 20.5;
export const AMANECER_HORA = 6;
export const CIERRE_HORAS = 1;                       // la última hora antes de la noche ya no se piden cosas nuevas

const ent = (v, def, min, max) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && v !== null && v !== '' && typeof v !== 'boolean' ? Math.max(min, Math.min(max, n)) : def;
};

// Cuánto ayuda `clave` según lo que cumpliste: 0 (nada), 1 (ayuda) o 2 (ayuda a pleno).
export function nivelAyuda(d, clave) {
  if (typeof clave !== 'string' || !VECINOS_AYUDA.includes(clave)) return 0;
  const a = d?.aldea?.ayuda;
  if (!a || typeof a !== 'object' || !Object.hasOwn(a, clave)) return 0;
  return ent(a[clave], 0, 0, NIVEL_MAX);
}

// ---------------------------------------------------------------- los vecinos y lo que piden
export const VECINOS = {
  anselmo: { nombre: 'Anselmo', quien: 'el carpintero', hace: 'arregla las defensas rotas', desde: 1 },
  herminia: { nombre: 'La abuela Herminia', quien: 'la abuela', hace: 'prende faroles y fogones que espantan a los viejos', desde: 2 },
  chicos: { nombre: 'Los chicos', quien: 'los chicos de la aldea', hace: 'tiran piedras con la honda desde la empalizada', desde: 2 },
  martin: { nombre: 'Martín', quien: 'el de la trochita', hace: 'pasa con la trochita tocando el silbato', desde: 3 },
};
// Desde cuántas noches resistidas (`d.oleadas`) cada vecino empieza a pedir.
export const DESDE_NOCHE = Object.fromEntries(VECINOS_AYUDA.map((k) => [k, VECINOS[k].desde]));

// Lo que vale cada cosa, para que el regalito nunca sea más que una parte de lo que cuesta (las recetas del taller: 8 flechas
// salen de una tabla y una piedra; un emplasto, de 2 frutas y una ramita; 3 boleadoras, de 3 piedras y una tabla).
export const VALOR = { tronco: 1, tabla: 0.7, piedra: 1, ramita: 0.1, fruta: 0.5, cristal: 6, flechas: 0.2, emplastos: 1.1, boleadoras: 1.2 };
export const MAX_REGALO = 0.45;                      // el regalo vale, como mucho, el 45% de lo que se entregó
export const COSAS_PEDIDAS = ['tronco', 'tabla', 'piedra', 'ramita', 'fruta', 'cristal'];
export const COSAS_REGALO = ['tronco', 'tabla', 'piedra', 'cristal', 'flechas', 'emplastos'];
const NOMBRE_COSA = {
  tronco: ['tronco', 'troncos'], tabla: ['tabla', 'tablas'], piedra: ['piedra', 'piedras'], ramita: ['ramita', 'ramitas'],
  fruta: ['fruta del bosque', 'frutas del bosque'], cristal: ['semilla dorada', 'semillas doradas'],
  flechas: ['flecha', 'flechas'], emplastos: ['emplasto', 'emplastos'], boleadoras: ['boleadora', 'boleadoras'],
};
export const nombreCosa = (k, n) => (NOMBRE_COSA[k] ? NOMBRE_COSA[k][n === 1 ? 0 : 1] : k);
export function textoCosas(cosas) {
  const partes = Object.entries(cosas || {}).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${nombreCosa(k, n)}`);
  return partes.length <= 1 ? (partes[0] || '') : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}
export function valorDe(cosas) {
  let v = 0;
  for (const [k, n] of Object.entries(cosas || {})) v += (VALOR[k] ?? 0) * (Number(n) || 0);
  return v;
}

// `nivel`: la ayuda que tiene el vecino cuando pide (0: el primero, liviano; 1: el segundo, más caro).
// `pide`: las cantidades de la noche 1 (después crecen con `escala`). `regalo`: tal cual, o null.
export const PEDIDOS = {
  anselmo: [
    { id: 'tablas', nivel: 0, pide: { tabla: 4 }, regalo: null,
      texto: 'Se me acabaron las tablas para remendar. Si me traés unas cuantas, me ando por las defensas.' },
    { id: 'troncos', nivel: 0, pide: { tronco: 3 }, regalo: { piedra: 1 },
      texto: 'Necesito madera buena para los mangos y las cuñas. Troncos, si podés.' },
    { id: 'piedras', nivel: 0, pide: { piedra: 4 }, regalo: null,
      texto: 'Para calzar los postes me hacen falta piedras. No te pido una carreta, unas pocas.' },
    { id: 'porton', nivel: 1, pide: { tabla: 6, piedra: 3 }, regalo: { tabla: 1 },
      texto: 'Ese portón está pidiendo a gritos un buen refuerzo. Con tablas y piedras lo dejo firme y, de ahí en más, cuento conmigo para las roturas.' },
    { id: 'taller', nivel: 1, pide: { tronco: 4, tabla: 4 }, regalo: { flechas: 4 },
      texto: 'Quiero armar un banquito de trabajo atrás de la empalizada. Tronco y tabla, y trabajo más ligero toda la noche.' },
  ],
  herminia: [
    { id: 'ramitas', nivel: 0, pide: { ramita: 16 }, regalo: null,
      texto: 'Se me terminó la yesca para los fogones, m\'hijo. Ramitas secas, las que encuentres.' },
    { id: 'frutas', nivel: 0, pide: { fruta: 5 }, regalo: { emplastos: 1 },
      texto: 'Con unas frutas del bosque te hago dulce para el invierno. Las frambuesas, las que sean.' },
    { id: 'faroles', nivel: 1, pide: { ramita: 20, tronco: 3 }, regalo: { emplastos: 1 },
      texto: 'Para dejar los faroles prendidos toda la noche necesito leña fina y un par de troncos. Los viejos le tienen miedo a la luz.' },
    { id: 'dulce', nivel: 1, pide: { fruta: 9, ramita: 6 }, regalo: { emplastos: 1 },
      texto: 'Si me alcanzás frutas y ramitas, hago un fogón que no se apaga. Una mano lava la otra.' },
  ],
  martin: [
    { id: 'lena', nivel: 0, pide: { tronco: 4 }, regalo: null,
      texto: 'La caldera de la trochita se come la leña como si nada. Troncos, que ando justo.' },
    { id: 'durmientes', nivel: 0, pide: { tabla: 5 }, regalo: { piedra: 1 },
      texto: 'Un par de durmientes se me están pudriendo. Con unas tablas lo arreglo y puedo pasar de noche.' },
    { id: 'silbato', nivel: 1, pide: { tronco: 5, piedra: 3 }, regalo: { flechas: 6 },
      texto: 'Quiero reforzar el cabezal y afinar el silbato. Con eso paso con la trochita por el camino, y los traviesos se dispersan.' },
    { id: 'tope', nivel: 1, pide: { tronco: 6, tabla: 3 }, regalo: { piedra: 2 },
      texto: 'Con troncos y tablas armo el tope del vagón. Cuando esté, ando de noche sin miedo.' },
  ],
  chicos: [
    { id: 'lisas', nivel: 0, pide: { piedra: 6 }, regalo: null,
      texto: '¡Piedras para las hondas! Las lisitas y redondas, no las filosas, que no vuelan bien.' },
    { id: 'horquillas', nivel: 0, pide: { ramita: 12 }, regalo: { flechas: 3 },
      texto: 'Estamos haciendo horquillas para las hondas. ¿Nos traés ramitas bien parejas?' },
    { id: 'parapeto', nivel: 1, pide: { piedra: 10, tabla: 2 }, regalo: { piedra: 2 },
      texto: '¡Armamos un parapeto en la empalizada y desde ahí tiramos! Falta piedra y un par de tablas. ¡Dale, dale!' },
    { id: 'municion', nivel: 1, pide: { piedra: 8, ramita: 10 }, regalo: { flechas: 5 },
      texto: 'Nos quedamos sin municiones. Con piedras y ramitas hacemos cientos de hondas. ¡Vas a ver cómo les pegamos!' },
  ],
};
// Lo que dicen al recibirlo y cuánto ayudan en cada nivel (`AYUDA_NIVEL[clave][nivel]`)
export const GRACIAS = {
  anselmo: ['Eso, con esto trabajo tranquilo. Gracias, vecino.', 'Ahora sí. Cuando se rompa algo, ya sabés a quién llamar.'],
  herminia: ['Qué bien, m\'hijo. Con esto me arreglo toda la semana.', 'Te lo agradezco con un guiso, y esta noche cuenta conmigo.'],
  martin: ['Gracias, che. La trochita no se mueve sin esto.', 'Perfecto. Esta noche paso con el silbato.'],
  chicos: ['¡Gracias! ¡Les vamos a dar una lección!', '¡Los vamos a dejar helados! Desde la empalizada no nos para nadie.'],
};
export const AYUDA_NIVEL = Object.fromEntries(VECINOS_AYUDA.map((k) => [k, [
  `${VECINOS[k].nombre} todavía no te debe nada: no ayuda en las noches grandes`,
  `${VECINOS[k].nombre} ${VECINOS[k].hace}, a su ritmo`,
  `${VECINOS[k].nombre} ${VECINOS[k].hace}, a pleno`,
]]));

// ---------------------------------------------------------------- el estado
export function aldeaNueva() {
  return {
    ayuda: Object.fromEntries(VECINOS_AYUDA.map((k) => [k, 0])),
    pedidos: Object.fromEntries(VECINOS_AYUDA.map((k) => [k, null])),
    pidioDia: Object.fromEntries(VECINOS_AYUDA.map((k) => [k, -1])),   // el último día en que cada uno pidió
    ultimo: {},                                                         // el último pedido de cada uno (para no repetir seguido)
    cumplidos: 0, vencidos: 0,
  };
}
const cosas = (v, validas, tope = 99) => {
  const r = {};
  if (v && typeof v === 'object' && !Array.isArray(v)) for (const k of validas) if (Object.hasOwn(v, k)) { const n = ent(v[k], 0, 0, tope); if (n > 0) r[k] = n; }
  return r;
};
function sanearPedido(clave, p) {
  if (!p || typeof p !== 'object') return null;
  const base = PEDIDOS[clave].find((e) => e.id === p.id);
  if (!base) return null;
  const pide = cosas(p.pide, COSAS_PEDIDAS);
  if (!Object.keys(pide).length) return null;
  const regalo = base.regalo ? cosas(p.regalo, COSAS_REGALO, 20) : {};
  return { id: base.id, nivel: ent(p.nivel, base.nivel, 0, 1), pide, regalo: Object.keys(regalo).length ? regalo : null, desde: ent(p.desde, 1, 0, 1e6), hasta: ent(p.hasta, 1, 0, 1e6) };
}
export function sanearAldea(v) {
  const x = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const n = aldeaNueva();
  for (const k of VECINOS_AYUDA) {
    n.ayuda[k] = Object.hasOwn(x.ayuda ?? {}, k) ? ent(x.ayuda[k], 0, 0, NIVEL_MAX) : 0;
    n.pedidos[k] = n.ayuda[k] < NIVEL_MAX && Object.hasOwn(x.pedidos ?? {}, k) ? sanearPedido(k, x.pedidos[k]) : null;
    n.pidioDia[k] = Object.hasOwn(x.pidioDia ?? {}, k) ? ent(x.pidioDia[k], -1, -1, 1e6) : -1;
  }
  for (const k of VECINOS_AYUDA) { const u = Object.hasOwn(x.ultimo ?? {}, k) ? x.ultimo[k] : null; if (typeof u === 'string' && PEDIDOS[k].some((e) => e.id === u)) n.ultimo[k] = u; }
  n.cumplidos = ent(x.cumplidos, 0, 0, 9999);
  n.vencidos = ent(x.vencidos, 0, 0, 9999);
  return n;
}

// ---------------------------------------------------------------- los pedidos
// Cuánto más cuesta cada noche: la primera es la base; llega a algo más del doble hacia la noche 20.
export const escala = (noche) => 1 + Math.min(1.2, 0.06 * (Math.max(1, Math.floor(Number(noche) || 1)) - 1));
export function pideEnLaNoche(base, noche) {
  const f = escala(noche), r = {};
  for (const [k, n] of Object.entries(base)) r[k] = Math.max(1, Math.round(n * f));
  return r;
}
// El regalo de una entrega: nunca más del `MAX_REGALO` de lo que costó (si se pasa, se recorta hasta que entre).
export function regaloEnLaNoche(base, pide) {
  if (!base) return null;
  const r = { ...base }, tope = valorDe(pide) * MAX_REGALO;
  while (valorDe(r) > tope + 1e-9) {
    const k = Object.keys(r).sort((a, b) => (VALOR[b] || 0) - (VALOR[a] || 0))[0];
    if (!k) break;
    r[k] -= 1;
    if (r[k] <= 0) delete r[k];
  }
  return Object.keys(r).length ? r : null;
}
// ¿Ya pasó el plazo? Vale hasta `LIMITE_HORA` del día `hasta`.
export const vencido = (p, dia, horas) => !!p && (dia > p.hasta || (dia === p.hasta && horas >= LIMITE_HORA));
export const quedaHoras = (p, dia, horas) => (p && !vencido(p, dia, horas) ? Math.max(0, (p.hasta - dia) * 24 + LIMITE_HORA - horas) : 0);

// Arma el pedido de `clave` para el día `dia` (null si no corresponde). Sólo depende de la semilla, el día y el estado.
export function pedidoDelDia(aldea, clave, { dia, noche, semilla }) {
  const nivel = ent(aldea?.ayuda?.[clave], 0, 0, NIVEL_MAX);
  if (nivel >= NIVEL_MAX) return null;
  const opciones = PEDIDOS[clave].filter((e) => e.nivel === nivel);
  if (!opciones.length) return null;
  const ultimo = aldea?.ultimo?.[clave];
  const azar = generador(hashTexto(`${semilla || 'HOJARASCA-DE-SIEMPRE'}|aldea|${clave}|${dia}`));
  let i = Math.min(opciones.length - 1, Math.floor(azar() * opciones.length));
  if (opciones.length > 1 && opciones[i].id === ultimo) i = (i + 1) % opciones.length;
  const e = opciones[i];
  const pide = pideEnLaNoche(e.pide, noche);
  return { id: e.id, nivel, pide, regalo: regaloEnLaNoche(e.regalo, pide), desde: dia, hasta: dia };
}

// Se llama de a ratos (una vez por segundo alcanza): vence lo que pasó de plazo y reparte lo nuevo. Devuelve los
// sucesos para avisarlos: [{ tipo: 'nuevo' | 'vencio', clave, pedido }].
// `c`: { dia, horas, oleadas (noches resistidas), semilla, activo (si siguen las noches y no ganaste) }
export function revisarPedidos(aldea, c) {
  const eventos = [];
  if (!aldea) return eventos;
  for (const k of VECINOS_AYUDA) {
    const p = aldea.pedidos[k];
    if (p && vencido(p, c.dia, c.horas)) {
      aldea.pedidos[k] = null; aldea.vencidos++;
      (aldea.ultimo ||= {})[k] = p.id;
      eventos.push({ tipo: 'vencio', clave: k, pedido: p });
    }
  }
  if (!c.activo || c.horas < AMANECER_HORA || c.horas >= LIMITE_HORA - CIERRE_HORAS) return eventos;
  for (const k of VECINOS_AYUDA) {
    if (aldea.pedidos[k] || aldea.pidioDia[k] === c.dia || aldea.ayuda[k] >= NIVEL_MAX || c.oleadas < DESDE_NOCHE[k]) continue;
    const p = pedidoDelDia(aldea, k, { dia: c.dia, noche: c.oleadas + 1, semilla: c.semilla });
    if (!p) continue;
    aldea.pedidos[k] = p; aldea.pidioDia[k] = c.dia;
    eventos.push({ tipo: 'nuevo', clave: k, pedido: p });
  }
  return eventos;
}

// ¿Se puede entregar ahora? `tengo(k)` da lo que hay de cada cosa.
export function puedeEntregar(aldea, clave, tengo, dia, horas) {
  const p = aldea?.pedidos?.[clave];
  if (!p) return { ok: false, razon: 'sin-pedido', falta: {} };
  if (vencido(p, dia, horas)) return { ok: false, razon: 'vencido', falta: {} };
  const falta = {};
  for (const [k, n] of Object.entries(p.pide)) { const h = Math.max(0, Math.floor(Number(tengo(k)) || 0)); if (h < n) falta[k] = n - h; }
  return Object.keys(falta).length ? { ok: false, razon: 'falta', falta } : { ok: true, razon: null, falta };
}
// Entrega: si se puede, saca el pedido, sube un nivel la ayuda y devuelve lo que hay que cobrar y regalar. Quien la
// llama cobra `gasta` y suma `regalo`.
export function entregar(aldea, clave, tengo, dia, horas) {
  const r = puedeEntregar(aldea, clave, tengo, dia, horas);
  if (!r.ok) return { ...r, gasta: null, regalo: null, nivel: nivelDe(aldea, clave) };
  const p = aldea.pedidos[clave];
  aldea.pedidos[clave] = null;
  aldea.ayuda[clave] = Math.min(NIVEL_MAX, aldea.ayuda[clave] + 1);
  aldea.cumplidos++;
  (aldea.ultimo ||= {})[clave] = p.id;
  return { ok: true, razon: null, falta: {}, gasta: { ...p.pide }, regalo: p.regalo ? { ...p.regalo } : null, nivel: aldea.ayuda[clave], subio: true };
}
const nivelDe = (aldea, clave) => ent(aldea?.ayuda?.[clave], 0, 0, NIVEL_MAX);

// Los pedidos de hoy en el orden en que se muestran (los que vencen primero, primero), para el tablón.
export function pedidosActivos(aldea, dia, horas) {
  const lista = [];
  for (const k of VECINOS_AYUDA) { const p = aldea?.pedidos?.[k]; if (p && !vencido(p, dia, horas)) lista.push({ clave: k, pedido: p }); }
  return lista;
}
// El texto de un pedido: «Anselmo, el carpintero: “…” — Pide 4 tablas».
export function textoPedido(clave, p) {
  const e = PEDIDOS[clave].find((x) => x.id === p.id);
  return e ? e.texto : '';
}

// Entrega de verdad: entrega, cobra lo pedido (gastar) y reparte el regalito (materiales al morral; flechas y emplastos al
// estado del Desafío `d`). `io`: { dia, horas, cuanto(k), gastar(k, n), sumarMaterial(k, n) }. Devuelve lo de `entregar`.
export const MATERIALES_DE_REGALO = ['tronco', 'tabla', 'piedra', 'cristal'];
export function entregarYCobrar(d, clave, io) {
  const r = entregar(d.aldea, clave, io.cuanto, io.dia, io.horas);
  if (!r.ok) return r;
  for (const [k, n] of Object.entries(r.gasta)) io.gastar(k, n);
  for (const [k, n] of Object.entries(r.regalo || {})) {
    if (MATERIALES_DE_REGALO.includes(k)) io.sumarMaterial(k, n);
    else d[k] = Math.min(999, (Number(d[k]) || 0) + n);
  }
  return r;
}
