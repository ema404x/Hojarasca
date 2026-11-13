// 4.27.0: los panales silvestres. Ocho panales de abejas colgados de una rama baja de los árboles
// grandes del bosque, siempre en los mismos lugares para una misma partida. Con E se saca un frasco
// de miel (el mismo de la colmena); el panal se recarga con cinco días de sol, fuera del invierno.
// Sacar miel de un panal por primera vez es lo que da, en la Historia, las abejas para tu colmena.
// Todo puro, sin THREE, para poder probarlo en Node. Lo visual está en bichos.js (el panal va
// fundido en la malla del panal de siempre) y el enganche con el juego, en main.js.
import { rng } from './ruido.js';
import { SEMILLA, LIMITE } from './config.js';
import { ritmo } from './colmena.js';

export const PANALES = {
  cantidad: 8,          // panales en todo el valle
  separacion: 150,      // metros mínimos entre dos panales
  caminoMin: 40,        // metros mínimos al sendero y a la vía
  aldeaMin: 30,         // y a la aldea
  celda: 234,           // el valle se parte en 4 x 4 celdas y cada una puede tener su panal (el id de guardado es la celda)
  alcanceBusqueda: 40,  // hasta dónde, desde el centro de su celda, se busca el árbol
  escMin: 1.0,          // «árbol grande»: la escala del árbol
  especies: ['coihue', 'lenga', 'cipres'],
  alturaMin: 2.2,       // altura del panal sobre el suelo (alcanzable)
  alturaMax: 3.0,
  horasRecarga: 55,     // cinco días de sol de ~11 h de trabajo
  frascos: 1,           // lo que guarda como mucho
  alcance: 2.5,         // metros, de la vista al panal, para sacar miel
  mira: 0.86,           // cuánto hay que mirarlo (coseno)
  alboroto: 3.2,        // pasar corriendo a menos de esto los alborota
  vista: 70,            // desde acá se dibuja el panal
  abejas: { radio: 25, dia: 0.4, lluvia: 0.3, invierno: 0.5 },   // la nube de abejas: de día, con sol y fuera del invierno
};

// Un número 0..1 que depende sólo de la semilla del mundo y de una clave entera (el mismo en cada partida)
function azarFijo(clave) {
  let h = (SEMILLA ^ Math.imul(clave + 1, 0x9E3779B1)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85EBCA6B) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ¿Este árbol puede llevar un panal? Grande, del bosque, en pie, lejos de caminos, del agua y de la aldea.
export function sirveParaPanal(a, sitio) {
  if (!a || a.sacado || a.caido) return false;
  if (!PANALES.especies.includes(a.especie) || !(a.esc >= PANALES.escMin)) return false;
  if (sitio.agua?.(a.x, a.z)) return false;
  if ((sitio.camino?.(a.x, a.z) ?? 999) < PANALES.caminoMin) return false;
  if ((sitio.aldea?.(a.x, a.z) ?? 999) < PANALES.aldeaMin) return false;
  return true;
}

// Dónde queda el panal en el árbol: la rama sale del tronco y el panal cuelga de su punta, a 2,2 a 3 m del suelo que tiene
// debajo (alcanzable parado). En una ladera la rama sale del lado donde el suelo cambia menos: del lado de abajo el panal
// quedaría muy alto sobre quien lo mira. `altura(x, z)`: el suelo (si no se da, se toma el pie del árbol).
function ubicar(a, id, altura) {
  const h = PANALES.alturaMin + azarFijo(200 + id) * (PANALES.alturaMax - PANALES.alturaMin);
  const r0 = Math.max(0.2, a.r - 0.05), alcance = r0 + 0.72;
  const ini = azarFijo(100 + id) * Math.PI * 2;
  let mejor = null;
  for (let k = 0; k < 8; k++) {
    const ang = ini + (k * Math.PI) / 4, suelo = altura ? altura(a.x + Math.cos(ang) * alcance, a.z + Math.sin(ang) * alcance) : a.y;
    const cambio = Math.abs(suelo - a.y);
    if (!mejor || cambio < mejor.cambio - 0.25) mejor = { ang, suelo, cambio };
  }
  const { ang, suelo } = mejor, c = Math.cos(ang), s = Math.sin(ang);
  const pos = { x: a.x + c * alcance, y: suelo + h, z: a.z + s * alcance };   // el centro del panal
  const base = { x: a.x + c * r0, y: pos.y + 0.75, z: a.z + s * r0 };   // donde la rama sale del tronco
  return { ang, h, base, pos };
}

// El centro de una celda del valle (el id de guardado de su panal), un poco corrido para que no sea una grilla perfecta
export const CELDAS_POR_LADO = Math.max(1, Math.round((2 * LIMITE) / PANALES.celda));
export function centroDeCelda(id) {
  const n = CELDAS_POR_LADO, ancho = (2 * LIMITE) / n;
  return { x: -LIMITE + ((id % n) + 0.5) * ancho + (azarFijo(id) - 0.5) * 40, z: -LIMITE + (Math.floor(id / n) + 0.5) * ancho + (azarFijo(50 + id) - 0.5) * 40 };
}

// Elige los panales de una partida. `arboles`: la lista del bosque (se usa el orden y la escala de cada uno);
// `sitio`: { camino(x, z), aldea(x, z), agua(x, z), altura(x, z) } (metros al camino y a la aldea; el agua, verdadero o no; el suelo).
// Cada celda del valle tiene un número fijo (su id): en el orden que sale de la semilla, la primera celda con un
// árbol que sirva (el más grande de los cercanos a su centro) se queda con un panal, hasta juntar ocho.
export function elegirPanales(arboles, sitio = {}) {
  const lista = Array.isArray(arboles) ? arboles : [];
  const orden = Array.from({ length: CELDAS_POR_LADO * CELDAS_POR_LADO }, (_, i) => i);
  const azar = rng((SEMILLA ^ 0x5A17) >>> 0);
  for (let i = orden.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [orden[i], orden[j]] = [orden[j], orden[i]]; }
  const elegidos = [];
  for (const id of orden) {
    if (elegidos.length >= PANALES.cantidad) break;
    const { x: cx, z: cz } = centroDeCelda(id);
    let mejor = null, mejorEsc = -1;
    for (let i = 0; i < lista.length; i++) {
      const a = lista[i];
      if (Math.abs(a.x - cx) > PANALES.alcanceBusqueda || Math.abs(a.z - cz) > PANALES.alcanceBusqueda) continue;
      if (Math.hypot(a.x - cx, a.z - cz) > PANALES.alcanceBusqueda || !sirveParaPanal(a, sitio)) continue;
      if (a.esc > mejorEsc) { mejorEsc = a.esc; mejor = { a, i }; }
    }
    if (!mejor) continue;
    if (elegidos.some((e) => Math.hypot(e.arbol.x - mejor.a.x, e.arbol.z - mejor.a.z) < PANALES.separacion)) continue;
    elegidos.push({ id, i: mejor.i, arbol: mejor.a, ...ubicar(mejor.a, id, sitio.altura) });
  }
  return elegidos.sort((p, q) => p.id - q.id);
}

// ---------------------------------------------------------------- lo que se guarda
// `progreso.panales`: { [id]: horas de recarga que lleva }, sólo de los panales de los que ya sacaste miel.
// Un panal que no figura tiene su frasco. Una partida vieja no trae nada: ningún panal sacado.
export function sanearPanales(p) {
  const sal = {};
  if (!p || typeof p !== 'object' || Array.isArray(p)) return sal;
  for (const k of Object.keys(p)) {
    const id = Number(k);
    if (!Number.isInteger(id) || id < 0 || id > 63) continue;
    const h = p[k];
    if (typeof h !== 'number' || !Number.isFinite(h)) continue;
    sal[id] = Math.max(0, Math.min(PANALES.horasRecarga - 0.001, h));
  }
  return sal;
}
export const panalConMiel = (panales, id) => !Object.hasOwn(panales || {}, id);

// Avanza la recarga `horas` de juego con el clima de ahora (el mismo ritmo de las abejas de la colmena:
// nada de noche ni en invierno, poco con lluvia). Devuelve cuántos panales volvieron a tener miel.
export function avanzarPanales(panales, horas, estado = {}) {
  if (!panales || !(horas > 0)) return 0;
  const r = ritmo({ noche: estado.noche, invierno: estado.invierno, lluvia: estado.lluvia });
  if (!(r > 0)) return 0;
  let listos = 0;
  for (const k of Object.keys(panales)) {
    panales[k] = (Number(panales[k]) || 0) + horas * r;
    if (panales[k] >= PANALES.horasRecarga) { delete panales[k]; listos++; }
  }
  return listos;
}

// E junto al panal: saca el frasco o dice que está vacío.
export function usarPanal(panales, id) {
  if (!panales) return { accion: 'nada' };
  if (panalConMiel(panales, id)) { panales[id] = 0; return { accion: 'sacar', frascos: PANALES.frascos }; }
  return { accion: 'vacio' };
}
export const TEXTO_PANAL = {
  aviso: 'Sacar miel del panal',
  avisoVacio: 'Mirar el panal',
  vacio: ['El panal está vacío.', 'Las abejas necesitan unos días de sol.'],
  alboroto: ['Las abejas se alborotan', 'Pasá despacio al lado del panal'],
  abejas: ['Te llevás un puñado de abejas.', 'Ya podés armar una colmena (O → Trabajo).'],
};

// ---------------------------------------------------------------- mirar el panal
// El panal que tenés a mano: a menos de `alcance` metros de la vista (3D) y mirándolo. `vista`: {x, y, z};
// `adelante`: {x, y, z} unitario. Devuelve { sitio, d } o null.
export function panalAlAlcance(sitios, vista, adelante) {
  let mejor = null, dMin = PANALES.alcance;
  for (const s of sitios || []) {
    if (s.arbol?.sacado) continue;
    const dx = s.pos.x - vista.x, dy = s.pos.y - vista.y, dz = s.pos.z - vista.z;
    const d = Math.hypot(dx, dy, dz);
    if (d > dMin) continue;
    const coseno = d < 1e-6 ? 1 : (dx * adelante.x + dy * adelante.y + dz * adelante.z) / d;
    if (coseno < PANALES.mira) continue;
    dMin = d; mejor = { sitio: s, d };
  }
  return mejor;
}

// ---------------------------------------------------------------- las abejas
// De día, con sol y fuera del invierno. `m`: { dia (0..1), lluvia, invierno }
export function hayAbejasPanal(m = {}) {
  const A = PANALES.abejas;
  return (m.dia ?? 0) > A.dia && (m.lluvia ?? 0) < A.lluvia && (m.invierno ?? 0) < A.invierno;
}

// ---------------------------------------------------------------- tu colmena en la Historia
// En el Relax la colmena está siempre; el Desafío no la tiene; en la Historia aparece cuando sacaste miel de un panal silvestre.
export function colmenaDisponible({ desafio = false, historia = false, sacoMiel = false } = {}) {
  if (desafio) return false;
  return historia ? !!sacoMiel : true;
}
