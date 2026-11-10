// 4.25.2: tirar cosas de la mochila (V) y volver a juntarlas (E). Módulo puro (sin three ni DOM; se prueba en Node).
//
// Lo juntado del suelo (ramita, piñón, calafate, frutilla, pluma, canto) se sigue soltando de a uno con su forma de
// siempre (objetos.js, `progreso.soltados`). Todo lo demás de la barra cae en un BULTO (`progreso.bultos`): un atado
// en el suelo que guarda exactamente lo que salió de la mochila (cuánto y de dónde) y lo devuelve igual con E.
//
// Qué NO se tira:
//   · lo de la Historia (la llave del molino, el canto gemelo, la lámpara de Eusebio, la pluma de cóndor): un capítulo
//     no se puede trabar por haberlo dejado tirado;
//   · la cámara: es la herramienta de las fotos del juego (P, el modo foto, el álbum, los concursos), no un objeto del valle;
//   · la carpa armada (primero se desarma);
//   · lo que no es una cosa: los pesos, el cuaderno, los planos, las grabaciones (no están en la barra);
//   · en la noche de los duendes (Desafío), lo que no sea del suelo: allá hay munición, derrota y cofre del alba, y
//     tirar materiales para salvarlos de la derrota rompería las reglas de la noche.
//
// Dónde vive cada cosa (las mismas tres casas que cuenta carga.js, más las herramientas):
//   · `ramitas`  → progreso.ramitas (tope de doce)
//   · `material` → progreso.materiales[k]
//   · `entrada`  → progreso.entradas[k].cantidad (la entrada del cuaderno NUNCA se borra: sólo baja la cantidad)
//   · `cosa`     → progreso.cosas[k], los contadores de COSAS_CONTABLES (yerba, harina, ponchos, ingredientes…)
//   · `unica`    → progreso.cosas[k] de una herramienta u objeto único (hacha, pico, farol, manta, tijera…): se guarda su valor tal cual
//   · `base`     → la caña y la linterna, que no tienen casilla en `cosas`: tirarlas las anota en `progreso.dejadas`
// Ninguna herramienta tiene desgaste hoy: si un día lo tiene, viaja en `valor` (o en un campo nuevo de la carga).
import { COSAS_CONTABLES } from './carga.js';
import { COSAS_HISTORIA_MOCHILA } from './mochila.js';

export const TOPE_BULTOS = 48;          // bultos en todo el valle (cada uno es una instancia: el dibujo no crece)
export const RADIO_FUSION = 1.6;        // un bulto igual a menos de esto se suma al que ya está
export const MAX_POR_PARTE = 99999;
// Lo que sale de a uno con su forma (objetos.js) y cómo se llama en `progreso`
export const SUELTOS = { ramita: 'ramitas', pinon: 'pinon', calafate: 'calafate', frutilla: 'frutilla', pluma: 'pluma', canto: 'canto' };
// Lo que siempre está en la mochila y no tiene casilla en `cosas`
export const BASE = ['cana', 'linterna'];
// La casilla de la barra que se llama distinto que la cosa guardada
const CLAVE_DE = { carpa: 'manta' };
const CONTABLE = new Set(COSAS_CONTABLES);
const HISTORIA = new Set(COSAS_HISTORIA_MOCHILA.map((c) => c.id));
const ORDEN_PARTES = ['ramitas', 'material', 'entrada', 'cosa'];

const esId = (k) => typeof k === 'string' && k.length > 0 && k.length <= 60 && k !== '__proto__' && k !== 'constructor' && k !== 'prototype';
const entero = (v) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0; };
const tiene = (o, k) => !!o && typeof o === 'object' && Object.hasOwn(o, k);

// ¿Le falta a la mochila esa cosa de base (la tiró)? Para las teclas que la usan sin pasar por la barra (Q, L)
export function dejada(progreso, id) { return tiene(progreso?.dejadas, id) && progreso.dejadas[id] === true; }

// Cuánto hay de `id` en cada casa contable: { ramitas, material, entrada, cosa } (sólo las que tienen algo)
function cuentas(progreso, id) {
  const c = {};
  if (id === 'ramita') { const n = entero(progreso?.ramitas); if (n) c.ramitas = n; return c; }
  const m = tiene(progreso?.materiales, id) ? entero(progreso.materiales[id]) : 0;
  if (m) c.material = m;
  const e = tiene(progreso?.entradas, id) ? entero(progreso.entradas[id]?.cantidad) : 0;
  if (e) c.entrada = e;
  const k = CONTABLE.has(id) && tiene(progreso?.cosas, id) ? entero(progreso.cosas[id]) : 0;
  if (k) c.cosa = k;
  return c;
}
const suma = (partes) => ORDEN_PARTES.reduce((s, k) => s + (partes[k] || 0), 0);

// ¿Por qué no se puede tirar? null si se puede. { titulo, texto } para la nota.
export function motivoParaNoTirar(progreso, id) {
  if (!esId(id)) return { titulo: 'Eso no se suelta', texto: 'No es algo que se pueda dejar en el suelo' };
  if (HISTORIA.has(id)) return { titulo: 'Eso no se suelta', texto: 'Es de la Historia: lo vas a necesitar más adelante' };
  if (progreso?.modo === 'desafio') return Object.hasOwn(SUELTOS, id) ? null : { titulo: 'Eso no se suelta', texto: 'Solo lo que juntaste del suelo' };
  if (id === 'camara') return { titulo: 'La cámara no se suelta', texto: 'Es la de tus fotos (P)' };
  if (id === 'carpa' && progreso?.carpa) return { titulo: 'La carpa está armada', texto: 'Desarmala primero (T)' };
  if (BASE.includes(id)) return dejada(progreso, id) ? { titulo: 'Eso no se suelta', texto: 'No la tenés encima' } : null;
  if (suma(cuentas(progreso, id)) > 0) return null;
  const clave = Object.hasOwn(CLAVE_DE, id) ? CLAVE_DE[id] : id;
  const v = tiene(progreso?.cosas, clave) ? progreso.cosas[clave] : undefined;
  if (!CONTABLE.has(clave) && (v === true || entero(v) > 0)) return null;
  return { titulo: 'Eso no se suelta', texto: 'No es algo que se pueda dejar en el suelo' };
}

// Saca de la mochila una unidad (o todo, con `todo`) de `id`. Devuelve { ok, carga } o { ok: false, titulo, texto }.
// La carga es lo que va al bulto: { id, nombre, n, partes } para lo que se cuenta, { id, nombre, n: 1, clave, valor } para una
// herramienta única y { id, nombre, n: 1, base: true } para la caña o la linterna.
export function sacarDeMochila(progreso, id, { todo = false, nombre = '' } = {}) {
  const no = motivoParaNoTirar(progreso, id);
  if (no) return { ok: false, ...no };
  const nom = typeof nombre === 'string' && nombre ? nombre.slice(0, 60) : id;
  if (BASE.includes(id)) {
    if (!progreso.dejadas || typeof progreso.dejadas !== 'object') progreso.dejadas = {};
    progreso.dejadas[id] = true;
    return { ok: true, carga: { id, nombre: nom, n: 1, base: true } };
  }
  const hay = cuentas(progreso, id);
  const total = suma(hay);
  if (total > 0) {
    let falta = todo ? total : 1;
    const partes = {};
    // de a una por casa, en un orden fijo (lo mismo que se devuelve después)
    for (const k of ORDEN_PARTES) {
      if (falta <= 0 || !hay[k]) continue;
      const q = Math.min(falta, hay[k]);
      if (k === 'ramitas') progreso.ramitas = hay[k] - q;
      else if (k === 'material') progreso.materiales[id] = hay[k] - q;
      else if (k === 'entrada') progreso.entradas[id].cantidad = hay[k] - q;
      else { progreso.cosas[id] = hay[k] - q; if (progreso.cosas[id] <= 0) delete progreso.cosas[id]; }
      partes[k] = q;
      falta -= q;
    }
    return { ok: true, carga: { id, nombre: nom, n: suma(partes), partes } };
  }
  const clave = Object.hasOwn(CLAVE_DE, id) ? CLAVE_DE[id] : id;
  const valor = progreso.cosas[clave];
  delete progreso.cosas[clave];
  return { ok: true, carga: { id, nombre: nom, n: 1, clave, valor } };
}

// Devuelve a la mochila lo de una carga. `lugar(k, n)`: cuántas unidades más de k entran (el límite de carga.js);
// sin `lugar`, entra todo. Devuelve { ok, juntados, resto, titulo?, texto? }: `resto` es la carga que queda en el suelo
// (null si se juntó entera). Nunca suma más de lo que hay en la carga ni pierde nada: lo que no entra queda en `resto`.
export function devolverAMochila(progreso, carga, lugar = null) {
  if (!carga || !esId(carga.id)) return { ok: false, juntados: 0, resto: carga || null, titulo: 'No se pudo juntar', texto: 'Eso ya no está' };
  if (carga.base) {
    if (!dejada(progreso, carga.id)) return { ok: false, juntados: 0, resto: carga, titulo: `Ya tenés ${carga.id === 'cana' ? 'una caña' : 'una linterna'}`, texto: 'Queda en el suelo' };
    delete progreso.dejadas[carga.id];
    return { ok: true, juntados: 1, resto: null };
  }
  if (carga.clave !== undefined) {
    if (!esId(carga.clave)) return { ok: false, juntados: 0, resto: carga, titulo: 'No se pudo juntar', texto: 'Eso ya no está' };
    if (!progreso.cosas || typeof progreso.cosas !== 'object') progreso.cosas = {};
    const ya = progreso.cosas[carga.clave];
    if (ya === true || entero(ya) > 0) return { ok: false, juntados: 0, resto: carga, titulo: 'Ya tenés uno igual', texto: 'Queda en el suelo' };
    progreso.cosas[carga.clave] = carga.valor;
    return { ok: true, juntados: 1, resto: null };
  }
  const partes = carga.partes || {};
  const total = suma(partes);
  // (las ramitas sólo viajan en un bulto de ramitas: tope de doce; lo demás, el lugar de la mochila)
  let entra = total;
  if (carga.id === 'ramita') entra = Math.min(total, Math.max(0, 12 - entero(progreso.ramitas)));
  else if (typeof lugar === 'function') entra = Math.min(total, entero(lugar(carga.id, total)));
  if (entra <= 0) return { ok: false, juntados: 0, resto: carga, titulo: carga.id === 'ramita' ? 'No te entran más ramitas' : 'Mochila llena', texto: 'Queda en el suelo' };
  let falta = entra;
  const quedan = {};
  for (const k of ORDEN_PARTES) {
    const n = partes[k] || 0;
    if (!n) continue;
    let q = Math.min(falta, n);
    if (k === 'ramitas') q = Math.min(q, Math.max(0, 12 - entero(progreso.ramitas)));
    if (q > 0) {
      if (k === 'ramitas') progreso.ramitas = entero(progreso.ramitas) + q;
      else if (k === 'material') { if (!progreso.materiales || typeof progreso.materiales !== 'object') progreso.materiales = {}; progreso.materiales[carga.id] = entero(progreso.materiales[carga.id]) + q; }
      else if (k === 'entrada') {
        if (!progreso.entradas || typeof progreso.entradas !== 'object') progreso.entradas = {};
        const e = tiene(progreso.entradas, carga.id) && progreso.entradas[carga.id] ? progreso.entradas[carga.id] : (progreso.entradas[carga.id] = { dia: progreso.dia, hora: progreso.horas, cantidad: 0 });
        e.cantidad = entero(e.cantidad) + q;
      } else { if (!progreso.cosas || typeof progreso.cosas !== 'object') progreso.cosas = {}; progreso.cosas[carga.id] = entero(progreso.cosas[carga.id]) + q; }
      falta -= q;
    }
    if (n - q > 0) quedan[k] = n - q;
  }
  const juntados = entra - falta;
  const resto = suma(quedan) > 0 ? { ...carga, n: suma(quedan), partes: quedan } : null;
  return juntados > 0 ? { ok: true, juntados, resto } : { ok: false, juntados: 0, resto: carga, titulo: 'Mochila llena', texto: 'Queda en el suelo' };
}

// Pone una carga en el suelo, en la lista de bultos: si hay uno igual (lo mismo, que se cuente) a menos de RADIO_FUSION,
// se suma a ése. Con TOPE_BULTOS ya en el valle, no entra uno nuevo. Devuelve { ok, bulto, fusionado } o { ok: false, titulo, texto }.
export function ponerBulto(bultos, carga, x, y, z, rot = 0) {
  if (!Array.isArray(bultos) || !carga) return { ok: false, titulo: 'No se pudo dejar', texto: 'Probá en un lugar más despejado' };
  if (carga.partes) {
    let mejor = null, dMejor = RADIO_FUSION;
    for (const b of bultos) {
      if (!b?.carga?.partes || b.carga.id !== carga.id) continue;
      const d = Math.hypot(b.x - x, b.z - z);
      if (d <= dMejor) { dMejor = d; mejor = b; }
    }
    if (mejor) {
      const p = mejor.carga.partes;
      for (const k of ORDEN_PARTES) if (carga.partes[k]) p[k] = Math.min(MAX_POR_PARTE, (p[k] || 0) + carga.partes[k]);
      mejor.carga.n = suma(p);
      return { ok: true, bulto: mejor, fusionado: true };
    }
  }
  if (bultos.length >= TOPE_BULTOS) return { ok: false, titulo: 'Ya hay muchas cosas tiradas', texto: 'Juntá alguna antes de dejar otra' };
  const bulto = { x, y, z, rot, carga };
  bultos.push(bulto);
  return { ok: true, bulto, fusionado: false };
}

// «Juntar troncos (3)», «Juntar hacha de mano»: el aviso de la E
export function textoBulto(b) {
  const c = b?.carga;
  if (!c) return 'Juntar';
  const nom = String(c.nombre || c.id);
  const minus = nom.charAt(0).toLowerCase() + nom.slice(1);
  return c.n > 1 ? `Juntar ${minus} (${c.n})` : `Juntar ${minus}`;
}

// Qué forma tiene en el suelo: la del objeto cuando hay una que se le parece, si no un atado
const MODELO = { tronco: 'tronco', tabla: 'tabla', piedra: 'piedra', 'piedra-cantera': 'piedra', canto: 'piedra', ramita: 'leña' };
export function modeloDe(carga) {
  if (!carga) return 'atado';
  if (Object.hasOwn(MODELO, carga.id)) return MODELO[carga.id];
  if (carga.base || carga.clave !== undefined) return 'herramienta';
  return 'atado';
}

// ---------------------------------------------------------------- al cargar una partida
function sanearCarga(c) {
  if (!c || typeof c !== 'object' || !esId(c.id)) return null;
  const nombre = typeof c.nombre === 'string' && c.nombre ? c.nombre.slice(0, 60) : c.id;
  if (c.base === true) return BASE.includes(c.id) ? { id: c.id, nombre, n: 1, base: true } : null;
  if (c.clave !== undefined) {
    if (!esId(c.clave) || CONTABLE.has(c.clave) || HISTORIA.has(c.clave)) return null;
    const valor = c.valor === true ? true : entero(c.valor) > 0 ? Math.min(entero(c.valor), 99) : null;
    return valor === null ? null : { id: c.id, nombre, n: 1, clave: c.clave, valor };
  }
  if (!c.partes || typeof c.partes !== 'object') return null;
  const partes = {};
  for (const k of ORDEN_PARTES) { const n = Math.min(MAX_POR_PARTE, entero(c.partes[k])); if (n) partes[k] = n; }
  if (partes.ramitas && c.id !== 'ramita') delete partes.ramitas;
  if (partes.ramitas) partes.ramitas = Math.min(partes.ramitas, 12);
  if (partes.cosa && !CONTABLE.has(c.id)) delete partes.cosa;
  if (!suma(partes) || HISTORIA.has(c.id)) return null;
  return { id: c.id, nombre, n: suma(partes), partes };
}
// Una partida vieja no trae `bultos`: sale []. Lo roto se descarta; lo fuera del valle (o de más), también.
export function sanearBultos(v, limite = 468) {
  if (!Array.isArray(v)) return [];
  const r = [];
  for (const b of v) {
    if (r.length >= TOPE_BULTOS) break;
    if (!b || typeof b !== 'object') continue;
    const x = Number(b.x), z = Number(b.z), y = Number(b.y);
    if (!Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > limite || Math.abs(z) > limite) continue;
    const carga = sanearCarga(b.carga);
    if (!carga) continue;
    r.push({ x, y: Number.isFinite(y) ? y : null, z, rot: Number.isFinite(Number(b.rot)) ? Number(b.rot) : 0, carga });
  }
  return r;
}
export function sanearDejadas(v) {
  const r = {};
  if (v && typeof v === 'object') for (const id of BASE) if (Object.hasOwn(v, id) && v[id] === true) r[id] = true;
  return r;
}
