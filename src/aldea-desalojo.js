// 3.6.2: lo tuyo que quedó donde ahora está la Aldea de los Duendes. En una partida de antes de la 3.6, las
// obras, los renovales y la carpa que habías puesto cerca de la parada sur quedan encimados sobre las calles o
// adentro de los edificios de la aldea (desde la 3.6.1 ya no se pueden poner nuevos ahí). Al cargar se resuelve
// solo y sin pérdidas: cada cosa se muda al lugar libre más cercano fuera de la aldea (con sus datos) y, si no
// hay ninguno, se desarma y se te devuelve todo lo que costó. Una sola nota lo cuenta. Puro: lo del mundo
// (qué lugar está libre) lo pregunta main.js.
import { ARBOLES_VIVERO } from './vivero.js';

// Cada cuántos metros se prueba un lugar, y hasta dónde se busca.
export const DESALOJO = { paso: 3, hasta: 240, juntas: 0.75 };

// Las obras que van juntas: una casa de piezas (piso, paredes, techo) se muda entera, no pieza por pieza. Un
// grupo es todo lo que se toca (centros más cerca que la suma de los radios) con alguna obra que quedó adentro.
// `lista`: los datos guardados; `radioDe(d)`: el radio de su plano; `adentro(d)`: si quedó en la aldea.
// Devuelve [[índices]] (sólo los grupos con algo adentro).
export function gruposDeObras(lista, radioDe, adentro) {
  const n = lista.length, grupo = new Array(n).fill(-1), salida = [];
  for (let i = 0; i < n; i++) {
    if (grupo[i] >= 0 || !adentro(lista[i])) continue;
    const g = salida.length, pila = [i], miembros = [];
    grupo[i] = g;
    while (pila.length) {
      const a = pila.pop();
      miembros.push(a);
      for (let b = 0; b < n; b++) {
        if (grupo[b] >= 0) continue;
        const da = lista[a], db = lista[b];
        if (Math.hypot(da.x - db.x, da.z - db.z) < radioDe(da) + radioDe(db) + DESALOJO.juntas) { grupo[b] = g; pila.push(b); }
      }
    }
    salida.push(miembros.sort((x, y) => x - y));
  }
  return salida;
}

// El corrimiento (dx, dz) más corto para el que `libre(dx, dz)` dice que sí: se prueba en anillos cada vez más
// grandes (cada `paso` metros, empezando hacia afuera de la aldea si se sabe dónde queda). null si no hay.
export function buscarLugar(libre, { paso = DESALOJO.paso, hasta = DESALOJO.hasta, haciaAfuera = 0 } = {}) {
  for (let r = paso; r <= hasta + 1e-9; r += paso) {
    const n = Math.max(8, Math.round((2 * Math.PI * r) / paso));
    for (let k = 0; k < n; k++) {
      // alternando a uno y otro lado de la dirección de salida: a igual distancia, primero lo de afuera
      const j = k % 2 ? (k + 1) / 2 : -k / 2;
      const a = haciaAfuera + (j * 2 * Math.PI) / n;
      const dx = Math.sin(a) * r, dz = Math.cos(a) * r;
      if (libre(dx, dz)) return { dx, dz, r };
    }
  }
  return null;
}

// Lo que costó una obra hasta donde llegó (las etapas hechas, enteras: no es desmontar, es devolver).
export function materialesDeObra(datos, plano) {
  const total = {};
  const hechas = Math.max(0, Math.min(plano?.etapas?.length || 0, Math.floor(Number(datos?.etapas) || 0)));
  for (let i = 0; i < hechas; i++) {
    for (const [k, n] of Object.entries(plano.etapas[i].pide || {})) total[k] = (total[k] || 0) + n;
  }
  return total;
}
export function sumarMateriales(a, b) {
  for (const [k, n] of Object.entries(b || {})) a[k] = (a[k] || 0) + n;
  return a;
}

// Lo que se devuelve por un renoval que no entra en ningún lado: su plantín (ya crecido a la mitad, como del
// vivero; vale más que la semilla con que se plantó).
export function devolucionDeRenoval(especie) {
  return Object.hasOwn(ARBOLES_VIVERO, especie) ? ARBOLES_VIVERO[especie].plantin : ARBOLES_VIVERO.coihue.plantin;
}

const cuenta = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const NOMBRES = { tronco: ['tronco', 'troncos'], tabla: ['tabla', 'tablas'], piedra: ['piedra', 'piedras'], cristal: ['cristal', 'cristales'], lana: ['vellón de lana', 'vellones de lana'] };
const enumerar = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}`);
const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// La nota (una sola): `r` = { obras: { mudadas, desarmadas }, renovales: { mudados, devueltos }, carpa:
// 'mudada'|'levantada'|null, materiales: { tronco: n, … } }. null si no hubo nada.
export function textoDesalojo(r) {
  const o = r?.obras || {}, v = r?.renovales || {};
  const mudado = [], desarmado = [];   // [texto, cuántos]
  if (o.mudadas > 0) mudado.push([cuenta(o.mudadas, 'obra', 'obras'), o.mudadas]);
  if (v.mudados > 0) mudado.push([cuenta(v.mudados, 'renoval', 'renovales'), v.mudados]);
  if (r?.carpa === 'mudada') mudado.push(['la carpa', 1]);
  if (o.desarmadas > 0) desarmado.push([cuenta(o.desarmadas, 'obra', 'obras'), o.desarmadas]);
  if (v.devueltos > 0) desarmado.push([cuenta(v.devueltos, 'renoval', 'renovales'), v.devueltos]);
  if (r?.carpa === 'levantada') desarmado.push(['la carpa', 1]);
  if (!mudado.length && !desarmado.length) return null;
  const varios = (l) => l.length > 1 || l[0][1] > 1;
  const partes = [];
  if (mudado.length) partes.push(`${mayus(enumerar(mudado.map((x) => x[0])))} se ${varios(mudado) ? 'mudaron' : 'mudó'} afuera del pueblo, a lo más cerca que había`);
  if (desarmado.length) {
    const devuelto = Object.entries(r.materiales || {}).filter(([, n]) => n > 0).map(([k, n]) => cuenta(n, ...(NOMBRES[k] || [k, k])));
    if (v.devueltos > 0) devuelto.push(cuenta(v.devueltos, 'plantín', 'plantines'));
    const que = desarmado.map((x) => x[0]);
    partes.push(`${mayus(enumerar(que))} no ${varios(desarmado) ? 'entraban' : 'entraba'} en ningún lado${r?.carpa === 'levantada' && que.length === 1 ? ': la levantaste' : ''}${devuelto.length ? `: tenés en la mochila ${enumerar(devuelto)}` : ''}`);
  }
  return { titulo: 'La Aldea de los Duendes ocupó tu lugar', sub: partes.join('. ') };
}
