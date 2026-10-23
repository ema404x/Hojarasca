// 4.10 base: los trofeos en la base (reglas puras, se prueban en Node).
//
// Lo que le ganás a cada jefe queda colgado en la base, en un tablero de trofeos (una pieza barata de madera), y da un efecto
// chico mientras el tablero esté en pie. Son siete: los cuatro mandamases (noches 5, 10, 15 y 20), el Coihue Viejo, el Rey
// Duende y la cueva del nido. Cada uno suma un bono de los que reparte `desafio-bonos` (claves saludMax, correr, recarga, dano,
// reparar, alcance) con el origen 'trofeo'. El bono vale mientras el tablero esté en pie; si el tablero cae a golpes, los
// trofeos se pierden con él; si lo desarmás vos, quedan guardados hasta que armes otro.
import { varianteJefe } from './desafio-valle.js';

export const ORIGEN_TROFEO = 'trofeo';

// `bono.valor` es una fracción (0,05 = 5 %). El orden de la lista es el orden en el tablero (de izquierda a derecha, de arriba abajo).
export const TROFEOS = [
  { id: 'casco', nombre: 'Casco de corteza', de: 'el mandamás', hito: 'la noche 5', bono: { clave: 'saludMax', valor: 0.05 },
    texto: 'El casco de corteza del primer mandamás: aguantás un poco más' },
  { id: 'hongo', nombre: 'Hongo grande', de: 'el mandamás que llama', hito: 'la noche 10', bono: { clave: 'recarga', valor: 0.06 },
    texto: 'Uno de los hongos de su espalda: recargás un poco más rápido' },
  { id: 'ojo', nombre: 'Ojo de sombra', de: 'el mandamás sombra', hito: 'la noche 15', bono: { clave: 'alcance', valor: 0.06 },
    texto: 'La piedra oscura de la sombra, con un punto de ámbar: tus tiros llegan un poco más lejos' },
  { id: 'piedra', nombre: 'Piedra de ámbar', de: 'el mandamás que tira piedras', hito: 'la noche 20', bono: { clave: 'dano', valor: 0.05 },
    texto: 'Una de sus piedras, partida por el medio: pegás un poco más fuerte' },
  { id: 'pina', nombre: 'Piña del Coihue', de: 'el Coihue Viejo', hito: 'cuando se abre la puertita del Coihue', bono: { clave: 'reparar', valor: 0.15 },
    texto: 'Una piña del Coihue Viejo: arreglás las defensas más rápido' },
  { id: 'corona', nombre: 'Corona del Rey Duende', de: 'el Rey Duende', hito: 'cuando cae el Rey Duende', bono: { clave: 'correr', valor: 0.04 },
    texto: 'La corona de raíces del Rey Duende: corrés un poco más rápido' },
  { id: 'raiz', nombre: 'Raíz del nido', de: 'la cueva del nido', hito: 'cuando se derrumba la cueva', bono: { clave: 'saludMax', valor: 0.05 },
    texto: 'Una raíz retorcida de la cueva de donde salían: aguantás un poco más' },
];
export const POR_ID = Object.fromEntries(TROFEOS.map((t) => [t.id, t]));
export const IDS_TROFEOS = TROFEOS.map((t) => t.id);
const hay = (id) => typeof id === 'string' && Object.hasOwn(POR_ID, id);

// Qué trofeo da cada mandamás (el de la noche 25 vuelve a ser el clásico: ya lo tenés).
export const TROFEO_DE_JEFE = { clasico: 'casco', llamador: 'hongo', sombra: 'ojo', artillero: 'piedra' };
export function trofeoDeJefe(noche) {
  const n = Math.floor(Number(noche));
  if (!(n >= 1)) return null;
  return TROFEO_DE_JEFE[varianteJefe(n)] || null;
}

// Los trofeos ganados: { id: noche en que se ganó }. Una partida vieja no los trae.
export function sanearTrofeos(v) {
  const salida = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return salida;
  for (const id of IDS_TROFEOS) {
    if (!Object.hasOwn(v, id)) continue;
    const n = Number(v[id]);
    if (v[id] === null || v[id] === '' || typeof v[id] === 'boolean' || !Number.isFinite(n)) continue;
    salida[id] = Math.max(0, Math.min(1e6, Math.floor(n)));
  }
  return salida;
}
// Gana un trofeo. Devuelve verdadero si es nuevo.
export function ganarTrofeo(trofeos, id, noche = 0) {
  if (!hay(id) || Object.hasOwn(trofeos, id)) return false;
  trofeos[id] = Math.max(0, Math.floor(Number(noche)) || 0);
  return true;
}
// Los ids ganados, en el orden del tablero.
export const ganados = (trofeos) => IDS_TROFEOS.filter((id) => Object.hasOwn(trofeos || {}, id));

// Lo que hay que ganar según cómo está la partida: los mandamases (`jefeCaido` es la noche del último que cayó), el Coihue (la
// puertita abierta), el Rey Duende (`victoria`) y el nido (`nido.caido`). Devuelve los ids que corresponden ahora.
export function trofeosQueCorresponden({ jefeCaido = -1, puertitaAbierta = false, victoria = false, nidoCaido = false } = {}) {
  const ids = [];
  const j = trofeoDeJefe(jefeCaido);
  if (j) ids.push(j);
  if (puertitaAbierta || victoria) ids.push('pina');
  if (victoria) ids.push('corona');
  if (nidoCaido) ids.push('raiz');
  return ids;
}

// Los bonos que dan los trofeos ganados, sumados por clave: { saludMax: 0.1, ... }.
export function bonosDeTrofeos(trofeos) {
  const suma = {};
  for (const id of ganados(trofeos)) { const b = POR_ID[id].bono; suma[b.clave] = (suma[b.clave] || 0) + b.valor; }
  return suma;
}
// «+5 % salud máxima»
const NOMBRE_BONO = { saludMax: 'salud máxima', correr: 'velocidad al correr', recarga: 'velocidad de recarga', dano: 'daño', reparar: 'velocidad al reparar', alcance: 'alcance' };
export const nombreBono = (clave) => (Object.hasOwn(NOMBRE_BONO, clave) ? NOMBRE_BONO[clave] : clave);
export const textoBono = (b) => `+${Math.round(b.valor * 100)} % ${nombreBono(b.clave)}`;

// Los textos del tablero.
export function textoGanado(id) {
  const t = POR_ID[id];
  return t ? { titulo: `Trofeo: ${t.nombre}`, texto: `De ${t.de} · ${textoBono(t.bono)}` } : null;
}
export function textoTablero(trofeos, colgado = true) {
  const g = ganados(trofeos);
  if (!g.length) return { titulo: 'Tablero de trofeos', texto: 'Todavía no colgaste ninguno. Los dan los mandamases, el Coihue Viejo, el Rey Duende y la cueva del nido' };
  const lista = g.map((id) => `${POR_ID[id].nombre} (${textoBono(POR_ID[id].bono)})`).join(' · ');
  return { titulo: `Tablero de trofeos · ${g.length} de ${TROFEOS.length}${colgado ? '' : ' (guardados)'}`, texto: lista };
}

// El lugar de cada trofeo en el tablero (en el sistema de la obra, x a lo ancho, y arriba): dos filas, cuatro y tres.
export const TABLERO = { ancho: 3.0, alto: 1.7, fondo: 0.16, patas: 2.1 };
export function sitioDeTrofeo(indice) {
  const i = Math.max(0, Math.min(TROFEOS.length - 1, Math.floor(Number(indice)) || 0));
  const arriba = i < 4, col = arriba ? i : i - 4, n = arriba ? 4 : 3;
  const paso = TABLERO.ancho / 4.3;
  return { x: (col - (n - 1) / 2) * paso, y: arriba ? 1.95 : 1.12 };
}
