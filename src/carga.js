// 4.7 carga: el límite de la mochila, con casillas. Módulo puro (sin three ni DOM; se prueba en Node).
//
// La mochila tiene 24 casillas. Los materiales y la comida ocupan casillas (cada una guarda una pila de un
// solo tipo, con un máximo por pila); las herramientas NO (siguen en la barra de 1 a 8). El caballo con
// alforjas suma 12 casillas mientras vas montado. 4.11.5: el carro (se hace en tu carpintería: carro.js) suma 16 más, sólo montado y
// con el carro enganchado.
// Sólo rige en el Relax: el Desafío («La noche de los duendes») no tiene límite.
//
// Las partidas viejas no pierden nada: lo que pase del límite queda en la mochila como SOBRECARGA (no se junta
// más hasta bajar del límite, gastando o guardando en un depósito). Nunca se recorta ni se borra.
//
// Los ítems viven en tres lugares, y acá se cuentan juntos por clave:
//   · progreso.materiales[k]            (troncos, tablas, piedra, lana, juncos, cuero…)
//   · progreso.entradas[k].cantidad     (comida y lo juntado: piñones, huevos, truchas, frutas…)
//   · progreso.cosas[k]                 (sólo los contadores de COSAS_CONTABLES: yerba, harina, ponchos…)
import { INGREDIENTES } from './cocina-pasos.js';

// (cada una en su `export const`: armar.mjs sólo exporta el primer nombre de una declaración con comas, y las alforjas llegaban como `undefined` a main.js)
export const CASILLAS_BASE = 24;
export const CASILLAS_ALFORJAS = 12;
export const CASILLAS_CARRO = 16;

// ---------------------------------------------------------------- el tamaño de pila de cada cosa
export const PILA_DEFECTO = 30;
export const PILAS = {
  // lo pesado y grande
  tronco: 10, piedra: 10, 'piedra-cantera': 10,
  // lo trabajado
  tabla: 20, arcilla: 20, cuero: 20, poncho: 20, fardo: 20, cristal: 20,
  // lo liviano de monte y de mallín
  junco: 30, hierbas: 30, lana: 30, canto: 30, pluma: 50,
  // lo que se recoge del bosque y de la huerta
  pinon: 50, calafate: 50, frutilla: 50, haba: 50, papa: 50, llaollao: 30,
  // semillas, plantines y yerba
  'semillas-habas': 50, 'semillas-papa': 50, yerba: 50,
  // el almacén
  harina: 50, azucar: 50, sal: 50, maiz: 50, porotos: 50, cacao: 30,
  // comida de la granja, conservas y cocina: lo desconocido es PILA_DEFECTO (30)
  huevo: 30, miel: 30, leche: 30, 'trucha-fresca': 30, 'trucha-ahumada': 30, 'pan-casero': 30, empanadas: 30,
  'frasco-frutilla': 30, 'calafate-seco': 50, 'hongos-secos': 30, zapallo: 30, mariscos: 30,
  manzana: 50, pera: 50, ciruela: 50, cereza: 50, frambuesa: 50, grosella: 50,
};

// Las `cosas` que son contadores (el resto de `cosas` son herramientas y objetos únicos: no ocupan casillas)
export const COSAS_CONTABLES = ['yerba', 'harina', 'poncho', 'semillas-habas', 'semillas-papa', ...Object.keys(INGREDIENTES)];
const COSA_CONTABLE = new Set(COSAS_CONTABLES);

// Lo que NO ocupa casillas aunque tenga una cuenta (hoy: nada; las ramitas viven aparte en `progreso.ramitas`, con su tope de 12)
const NO_CARGABLES = new Set(['ramita']);

const esTexto = (k) => typeof k === 'string' && k.length > 0;
const entero = (v) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0; };

// ¿Ocupa casillas? Falso para las herramientas y lo que no se cuenta (también para lo que no es un nombre).
export function esCargable(k) {
  if (!esTexto(k) || NO_CARGABLES.has(k)) return false;
  return true;
}

// Tamaño de pila de ese ítem
export function pilaMax(k) {
  return esTexto(k) && Object.hasOwn(PILAS, k) ? PILAS[k] : PILA_DEFECTO;
}

const sinLimite = (progreso) => progreso?.modo === 'desafio';

// Las casillas que tenés. ctx.montado: ¿vas a caballo? (las alforjas sólo sirven montado, y sólo si las elegiste; el carro, montado, fabricado y enganchado)
export function capacidad(progreso, ctx = {}) {
  if (sinLimite(progreso)) return { base: Infinity, alforjas: 0, carro: 0, total: Infinity };
  const base = CASILLAS_BASE;
  const alforjas = ctx && ctx.montado && progreso?.personal?.caballo?.conAlforjas === true ? CASILLAS_ALFORJAS : 0;
  const cab = progreso?.personal?.caballo;
  const carro = ctx && ctx.montado && cab?.carro === true && cab?.enganchado === true ? CASILLAS_CARRO : 0;   // 4.11.5: el carro enganchado al caballo
  return { base, alforjas, carro, total: base + alforjas + carro };
}

// Todo lo que lleva, por clave: { k: n } (suma los tres lugares). Orden estable: materiales, entradas, cosas.
export function conteos(progreso) {
  const c = new Map();
  const sumar = (k, v) => { const n = entero(v); if (n > 0 && esCargable(k)) c.set(k, (c.get(k) || 0) + n); };
  const M = progreso?.materiales;
  if (M && typeof M === 'object') for (const k of Object.keys(M)) sumar(k, M[k]);
  const E = progreso?.entradas;
  if (E && typeof E === 'object') for (const k of Object.keys(E)) sumar(k, E[k]?.cantidad);
  const C = progreso?.cosas;
  if (C && typeof C === 'object') for (const k of Object.keys(C)) if (COSA_CONTABLE.has(k)) sumar(k, C[k]);
  return c;
}

const pilasDe = (k, n) => Math.ceil(n / pilaMax(k));

// Lo que ocupa un mapa de conteos: { casillas, usadas }
function casillasDe(c) {
  const casillas = [];
  let usadas = 0;
  for (const [k, n] of c) {
    const max = pilaMax(k), pilas = Math.ceil(n / max);
    casillas.push({ k, n, pilas, max });
    usadas += pilas;
  }
  return { casillas, usadas };
}

// Qué ocupa la mochila. sobrecarga: { k: n } las unidades que pasan del límite. Se le cargan a las pilas más
// grandes (una casilla por vez, la última de cada ítem primero), así 989 troncos con 3 manzanas muestran los
// troncos sobrando y no las manzanas.
export function ocupacion(progreso, ctx = {}) {
  const cap = capacidad(progreso, ctx);
  const { casillas, usadas } = casillasDe(conteos(progreso));
  const sobrecarga = {};
  if (usadas > cap.total) {
    const sobra = new Map(casillas.map((x) => [x.k, 0]));
    let exceso = usadas - cap.total;
    while (exceso > 0) {
      let mejor = null, mejorPilas = 0;
      for (const x of casillas) { const p = x.pilas - sobra.get(x.k); if (p > mejorPilas) { mejorPilas = p; mejor = x; } }
      if (!mejor) break;
      sobra.set(mejor.k, sobra.get(mejor.k) + 1);
      exceso--;
    }
    for (const x of casillas) {
      const o = sobra.get(x.k);
      if (o > 0) sobrecarga[x.k] = x.n - (x.pilas - o) * x.max;
    }
  }
  return { casillas, usadas, libres: Math.max(0, cap.total - usadas), total: cap.total, sobrecarga };
}

// Cuántas unidades MÁS de k entran (0..n). En el Desafío, y para lo que no ocupa casillas: siempre n.
// Con sobrecarga (o justo al límite sin hueco en la pila) no entra nada.
export function lugarPara(progreso, k, n, ctx = {}) {
  const pedido = entero(n);
  if (sinLimite(progreso) || !esCargable(k)) return pedido;
  if (pedido === 0) return 0;
  const cap = capacidad(progreso, ctx);
  const c = conteos(progreso);
  const { usadas } = casillasDe(c);
  if (usadas > cap.total) return 0;
  const max = pilaMax(k), hay = c.get(k) || 0;
  const enPila = hay > 0 ? pilasDe(k, hay) * max - hay : 0;   // el hueco de la última pila a medias
  return Math.min(pedido, enPila + (cap.total - usadas) * max);
}

// Un trato entero (comprar, cobrar, recibir una recompensa): ¿entra todo junto, descontando lo que sale?
// da / quita: { k: n }. Entra si después no pasa del límite o si ocupa menos casillas que antes (así se baja de a poco
// estando en sobrecarga, pero nunca se suma). Devuelve { ok, faltan }: casillas que faltan.
export function tratoCabe(progreso, da = {}, quita = {}, ctx = {}) {
  if (sinLimite(progreso)) return { ok: true, faltan: 0 };
  const cap = capacidad(progreso, ctx);
  const c = conteos(progreso);
  const antes = casillasDe(c).usadas;
  for (const k of Object.keys(da || {})) if (esCargable(k)) c.set(k, (c.get(k) || 0) + entero(da[k]));
  for (const k of Object.keys(quita || {})) if (esCargable(k)) c.set(k, Math.max(0, (c.get(k) || 0) - entero(quita[k])));
  for (const [k, n] of [...c]) if (n <= 0) c.delete(k);
  const despues = casillasDe(c).usadas;
  const ok = despues <= cap.total || despues < antes;
  return { ok, faltan: ok ? 0 : despues - cap.total };
}

// «5 lugares»: para los avisos
export const textoLugares = (n) => `${n} ${n === 1 ? 'lugar' : 'lugares'}`;

// De una lista de efectos de un trato [{ tipo: 'material' | 'entrada' | 'cosa', k, n }] (n negativo: lo que sale de la mochila)
// a { da, quita } = { k: n } lo que entra y lo que sale, para tratoCabe.
export function tratoDeEfectos(efectos) {
  const da = {}, quita = {};
  for (const e of efectos || []) {
    if (!e || (e.tipo !== 'material' && e.tipo !== 'entrada' && e.tipo !== 'cosa') || !esTexto(e.k) || (e.tipo === 'cosa' && !COSA_CONTABLE.has(e.k))) continue;   // (una cosa que no es un contador —una herramienta— no ocupa casillas)
    const n = Math.floor(Number(e.n)) || 0;
    if (n > 0) da[e.k] = (da[e.k] || 0) + n; else if (n < 0) quita[e.k] = (quita[e.k] || 0) - n;
  }
  return { da, quita };
}
