// 3.7.5 (fiestas): los otros juegos de la fiesta (PLAN_3_7.md, «chinchón, damas y taba»). Módulo puro (sin three ni DOM:
// se prueba en Node); los juega fiestas-juego.js en el mismo panel que el truco.
//
//   · Chinchón, con el mazo español de 50 cartas (del 1 al 12, más dos comodines), a dos: 7 cartas cada uno; en tu
//     turno levantás del mazo o del pozo y tirás una. Se juntan escaleras (3 o más del mismo palo, seguidas) y piernas
//     (3 o 4 del mismo número); el comodín reemplaza a cualquiera. Se corta cuando lo que queda suelto suma 5 o menos:
//     cada uno se anota lo suyo suelto (todo ligado, −10; chinchón —siete seguidas del mismo palo, sin comodín— gana el
//     partido). Pierde el que pasa de CHINCHON.aPuntos (50; el de verdad es a 100).
//   · Damas, como se juegan acá: 8×8, las fichas van y comen para adelante, comer es obligatorio (y hay que comer la
//     mayor cantidad posible), la que llega al fondo es dama y vuela (corre y come a cualquier distancia). Pierde el
//     que no puede mover. Tablas a los 60 movimientos sin comer.
//   · La taba: se tira con fuerza justa (que pase la raya y no se vaya lejos); cae de suerte (gana), de culo
//     (pierde) o de costado (se vuelve a tirar). Se tira de a uno, por turnos.
import { azar } from './aldea.js';

const PALOS = ['espada', 'basto', 'oro', 'copa'];

// ---------------------------------------------------------------- chinchón
export const CHINCHON = { aPuntos: 50, cartas: 7, cortaCon: 5, comodinSuelto: 25, todoLigado: -10 };
export const esComodin = (c) => !!c && c.palo === 'comodin';
export const mazoChinchon = () => [...PALOS.flatMap((palo) => Array.from({ length: 12 }, (_, i) => ({ n: i + 1, palo }))), { n: 0, palo: 'comodin' }, { n: 0, palo: 'comodin' }];
export const valorChinchon = (c) => (esComodin(c) ? CHINCHON.comodinSuelto : c ? c.n : 0);
export const nombreCartaChinchon = (c) => (esComodin(c) ? 'comodín' : c ? `${c.n} de ${c.palo}` : '');
// ¿Las cartas forman un juego (escalera o pierna)?
export function esJuego(cartas) {
  if (cartas.length < 3) return false;
  const com = cartas.filter(esComodin).length, nat = cartas.filter((c) => !esComodin(c));
  if (!nat.length) return false;
  // pierna: el mismo número (3 o 4 cartas)
  if (cartas.length <= 4 && nat.every((c) => c.n === nat[0].n)) return true;
  // escalera: el mismo palo, sin repetidos, y lo que falta en el medio (y en las puntas) lo cubren los comodines
  if (!nat.every((c) => c.palo === nat[0].palo)) return false;
  const ns = nat.map((c) => c.n).sort((a, b) => a - b);
  for (let i = 1; i < ns.length; i++) if (ns[i] === ns[i - 1]) return false;
  const huecos = ns[ns.length - 1] - ns[0] + 1 - ns.length;
  if (huecos > com) return false;
  // (el largo total no puede salirse del 1 al 12)
  return cartas.length <= 12;
}
// La mejor forma de ligar una mano: { juegos: [[índices]], sueltas: [índices], resto (lo que suman las sueltas) }
export function mejorLigado(cartas) {
  const n = cartas.length;
  const posibles = [];
  for (let m = 1; m < (1 << n); m++) {
    let k = 0; for (let i = 0; i < n; i++) if (m & (1 << i)) k++;
    if (k < 3) continue;
    const sub = []; for (let i = 0; i < n; i++) if (m & (1 << i)) sub.push(cartas[i]);
    if (esJuego(sub)) posibles.push(m);
  }
  const memo = new Map();
  const valorSuelto = (m) => { let s = 0; for (let i = 0; i < n; i++) if (m & (1 << i)) s += valorChinchon(cartas[i]); return s; };
  // lo mejor para el conjunto `libre` de cartas: el resto mínimo
  function mejor(libre) {
    if (memo.has(libre)) return memo.get(libre);
    let r = { resto: valorSuelto(libre), juegos: [] };
    // (la carta más baja de `libre` o queda suelta o va en un juego que la tenga)
    let i0 = 0; while (i0 < n && !(libre & (1 << i0))) i0++;
    if (i0 < n) {
      const sinElla = mejor(libre & ~(1 << i0));
      const suelta = { resto: sinElla.resto + valorChinchon(cartas[i0]), juegos: sinElla.juegos };
      r = suelta;
      for (const m of posibles) {
        if ((m & libre) !== m || !(m & (1 << i0))) continue;
        const x = mejor(libre & ~m);
        if (x.resto < r.resto || (x.resto === r.resto && x.juegos.length + 1 < r.juegos.length)) r = { resto: x.resto, juegos: [m, ...x.juegos] };
      }
    }
    memo.set(libre, r);
    return r;
  }
  const todo = (1 << n) - 1;
  const r = mejor(todo);
  const usadas = r.juegos.reduce((s, m) => s | m, 0);
  const idx = (m) => { const l = []; for (let i = 0; i < n; i++) if (m & (1 << i)) l.push(i); return l; };
  return { juegos: r.juegos.map(idx), sueltas: idx(todo & ~usadas), resto: r.resto };
}
// ¿Es chinchón? (siete del mismo palo, seguidas, sin comodín)
export function esChinchon(cartas) {
  if (cartas.length !== 7 || cartas.some(esComodin)) return false;
  return esJuego(cartas) && cartas.every((c) => c.palo === cartas[0].palo);
}
function barajarCon(m, semilla) {
  for (let i = m.length - 1; i > 0; i--) { const k = Math.floor(azar(semilla * 7919 + i * 131) * (i + 1)) % (i + 1); [m[i], m[k]] = [m[k], m[i]]; }
  return m;
}
export function chinchonNuevo({ semilla = 1, empieza = 0, aPuntos = CHINCHON.aPuntos } = {}) {
  const p = { juego: 'chinchon', semilla: Math.floor(semilla) || 1, puntos: [0, 0], aPuntos, mano: empieza ? 1 : 0, manos: 0, terminado: null, ronda: null };
  repartirChinchon(p);
  return p;
}
function repartirChinchon(p) {
  p.manos++;
  const m = barajarCon(mazoChinchon(), p.semilla * 17 + p.manos * 53);
  const cartas = [m.splice(0, CHINCHON.cartas), m.splice(0, CHINCHON.cartas)];
  p.ronda = { cartas, mazo: m, pozo: [m.pop()], turno: p.mano, fase: 'robar', terminada: false, corto: null, resultado: null };
}
export const turnoChinchon = (p) => (!p || p.terminado !== null ? null : p.ronda.terminada ? 0 : p.ronda.turno);
// Lo que puede hacer j: ['mazo', 'pozo'] (robar) · ['tirar:i', 'cortar:i'] (con 8 cartas) · ['seguir']
export function accionesChinchon(p, j) {
  if (!p || p.terminado !== null) return [];
  const r = p.ronda;
  if (r.terminada) return j === 0 ? ['seguir'] : [];
  if (r.turno !== j) return [];
  if (r.fase === 'robar') return [...(r.mazo.length || r.pozo.length > 1 ? ['mazo'] : []), ...(r.pozo.length ? ['pozo'] : [])];
  const l = r.cartas[j].map((_, i) => `tirar:${i}`);
  r.cartas[j].forEach((_, i) => { if (puedeCortar(r.cartas[j], i)) l.push(`cortar:${i}`); });
  return l;
}
// ¿Puede cortar tirando la carta i? (lo que queda suelto suma 5 o menos)
export function puedeCortar(mano, i) {
  const resto = mano.filter((_, k) => k !== i);
  return mejorLigado(resto).resto <= CHINCHON.cortaCon || esChinchon(resto);
}
export function actuarChinchon(p, j, a) {
  const eventos = [];
  if (!p || p.terminado !== null) return { ok: false, eventos };
  const r = p.ronda;
  if (a === 'seguir') {
    if (!r.terminada) return { ok: false, eventos };
    p.mano = 1 - p.mano; repartirChinchon(p);
    return { ok: true, eventos: [{ tipo: 'reparte' }] };
  }
  if (!accionesChinchon(p, j).includes(a)) return { ok: false, motivo: 'no-puede', eventos };
  if (a === 'mazo') {
    if (!r.mazo.length) { const arriba = r.pozo.pop(); r.mazo = barajarCon(r.pozo, p.semilla + p.manos * 7 + r.cartas[0].length); r.pozo = [arriba]; eventos.push({ tipo: 'baraja' }); }
    r.cartas[j].push(r.mazo.pop()); r.fase = 'tirar';
    eventos.push({ tipo: 'roba', quien: j, de: 'mazo' });
    return { ok: true, eventos };
  }
  if (a === 'pozo') {
    const c = r.pozo.pop(); r.cartas[j].push(c); r.fase = 'tirar';
    eventos.push({ tipo: 'roba', quien: j, de: 'pozo', carta: c });
    return { ok: true, eventos };
  }
  const m = /^(tirar|cortar):(\d)$/.exec(a);
  if (!m) return { ok: false, eventos };
  const i = Number(m[2]);
  const c = r.cartas[j].splice(i, 1)[0];
  r.pozo.push(c);
  eventos.push({ tipo: m[1] === 'cortar' ? 'corta' : 'tira', quien: j, carta: c });
  if (m[1] === 'tirar') { r.turno = 1 - j; r.fase = 'robar'; return { ok: true, eventos }; }
  // cortó: cada uno se anota lo suyo
  r.terminada = true; r.corto = j;
  const res = [0, 1].map((k) => ({ ...mejorLigado(r.cartas[k]), chinchon: esChinchon(r.cartas[k]) }));
  const pts = res.map((x, k) => (k === j && x.resto === 0 ? CHINCHON.todoLigado : x.resto));
  r.resultado = { res, pts };
  if (res[j].chinchon) { p.terminado = j; eventos.push({ tipo: 'chinchon', quien: j }, { tipo: 'partido', gana: j }); return { ok: true, eventos }; }
  for (const k of [0, 1]) p.puntos[k] += pts[k];
  eventos.push({ tipo: 'mano', corto: j, pts });
  const pasados = [0, 1].filter((k) => p.puntos[k] > p.aPuntos);
  if (pasados.length) {
    p.terminado = pasados.length === 2 ? (p.puntos[0] <= p.puntos[1] ? 0 : 1) : 1 - pasados[0];
    eventos.push({ tipo: 'partido', gana: p.terminado });
  }
  return { ok: true, eventos };
}
// El rival del chinchón: levanta del pozo si le sirve, tira lo que más le estorba y corta en cuanto puede.
export function decidirChinchon(p, j) {
  const acc = accionesChinchon(p, j);
  if (!acc.length) return null;
  const r = p.ronda, mano = r.cartas[j];
  if (r.fase === 'robar') {
    const arriba = r.pozo[r.pozo.length - 1];
    if (arriba && acc.includes('pozo')) {
      const con = mejorTiro(mano.concat([arriba])).resto, sin = mejorLigado(mano).resto;
      if (con < sin - 2 || esComodin(arriba)) return 'pozo';
    }
    return acc.includes('mazo') ? 'mazo' : 'pozo';
  }
  const t = mejorTiro(mano);
  return acc.includes(`cortar:${t.i}`) ? `cortar:${t.i}` : `tirar:${t.i}`;
}
// La carta que conviene tirar (la que deja el menor resto; nunca un comodín)
function mejorTiro(mano) {
  let mejor = { i: 0, resto: Infinity };
  mano.forEach((c, i) => {
    if (esComodin(c)) return;
    const resto = mejorLigado(mano.filter((_, k) => k !== i)).resto - c.n * 0.01;
    if (resto < mejor.resto) mejor = { i, resto };
  });
  return mejor;
}

// ---------------------------------------------------------------- damas
// El tablero: 8×8, fila 0 arriba (el rival) y fila 7 abajo (vos). Las fichas, en las casillas oscuras ((f + c) impar).
// Cada casilla: null, { de: 0|1, dama: bool }. El jugador 0 sube (fila que baja), el 1 baja.
export const DAMAS = { tablas: 60, profundidad: 3 };
export function damasNuevas({ empieza = 0 } = {}) {
  const t = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let f = 0; f < 8; f++) for (let c = 0; c < 8; c++) {
    if ((f + c) % 2 === 0) continue;
    if (f <= 2) t[f][c] = { de: 1, dama: false };
    else if (f >= 5) t[f][c] = { de: 0, dama: false };
  }
  return { juego: 'damas', tablero: t, turno: empieza ? 1 : 0, sinComer: 0, terminado: null, movidas: 0, ultimo: null };
}
const dentro = (f, c) => f >= 0 && f < 8 && c >= 0 && c < 8;
const adelante = (de) => (de === 0 ? -1 : 1);
// Las capturas desde (f, c) con la ficha `p` en el tablero t (sin tocarlo): listas de { camino: [[f,c]...], comidas: [[f,c]...] }
function capturasDesde(t, f, c, p, comidas = []) {
  const res = [];
  const dirs = p.dama ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : [[adelante(p.de), -1], [adelante(p.de), 1]];
  for (const [df, dc] of dirs) {
    if (p.dama) {
      // vuela hasta la primera ficha; si es del otro y atrás hay lugar, come y puede caer en cualquier casilla libre
      let ff = f + df, cc = c + dc;
      while (dentro(ff, cc) && !t[ff][cc]) { ff += df; cc += dc; }
      if (!dentro(ff, cc) || !t[ff][cc] || t[ff][cc].de === p.de || comidas.some(([a, b]) => a === ff && b === cc)) continue;
      let lf = ff + df, lc = cc + dc;
      while (dentro(lf, lc) && !t[lf][lc]) {
        const nuevas = [...comidas, [ff, cc]];
        const t2 = t.map((fila) => fila.slice()); t2[f][c] = null; t2[lf][lc] = p;
        // (lo comido queda en el tablero hasta el final, pero no se puede saltar dos veces)
        const sigue = capturasDesde(t2, lf, lc, p, nuevas);
        if (sigue.length) for (const s of sigue) res.push({ camino: [[f, c], ...s.camino], comidas: s.comidas });
        else res.push({ camino: [[f, c], [lf, lc]], comidas: nuevas });
        lf += df; lc += dc;
      }
    } else {
      const mf = f + df, mc = c + dc, lf = f + 2 * df, lc = c + 2 * dc;
      if (!dentro(lf, lc) || !t[mf][mc] || t[mf][mc].de === p.de || t[lf][lc] || comidas.some(([a, b]) => a === mf && b === mc)) continue;
      const nuevas = [...comidas, [mf, mc]];
      const t2 = t.map((fila) => fila.slice()); t2[f][c] = null; t2[lf][lc] = p;
      // (la ficha que llega al fondo comiendo se corona al terminar: acá sigue comiendo como ficha)
      const sigue = capturasDesde(t2, lf, lc, p, nuevas);
      if (sigue.length) for (const s of sigue) res.push({ camino: [[f, c], ...s.camino], comidas: s.comidas });
      else res.push({ camino: [[f, c], [lf, lc]], comidas: nuevas });
    }
  }
  return res;
}
// Las jugadas legales del que mueve: [{ camino, comidas }] (si se puede comer, sólo las que comen más)
export function jugadasDamas(e, de = e.turno) {
  const t = e.tablero, capt = [], simples = [];
  for (let f = 0; f < 8; f++) for (let c = 0; c < 8; c++) {
    const p = t[f][c];
    if (!p || p.de !== de) continue;
    capt.push(...capturasDesde(t, f, c, p));
    const dirs = p.dama ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : [[adelante(de), -1], [adelante(de), 1]];
    for (const [df, dc] of dirs) {
      let ff = f + df, cc = c + dc;
      while (dentro(ff, cc) && !t[ff][cc]) { simples.push({ camino: [[f, c], [ff, cc]], comidas: [] }); if (!p.dama) break; ff += df; cc += dc; }
    }
  }
  if (capt.length) { const max = Math.max(...capt.map((x) => x.comidas.length)); return capt.filter((x) => x.comidas.length === max); }
  return simples;
}
export function moverDamas(e, jugada) {
  if (!e || e.terminado !== null || !jugada) return { ok: false };
  const legal = jugadasDamas(e).find((j) => JSON.stringify(j.camino) === JSON.stringify(jugada.camino));
  if (!legal) return { ok: false, motivo: 'no-puede' };
  aplicarJugada(e, legal);
  return { ok: true, jugada: legal };
}
function aplicarJugada(e, j) {
  const t = e.tablero, [f0, c0] = j.camino[0], [f1, c1] = j.camino[j.camino.length - 1];
  const p = t[f0][c0];
  t[f0][c0] = null;
  for (const [a, b] of j.comidas) t[a][b] = null;
  const corona = !p.dama && ((p.de === 0 && f1 === 0) || (p.de === 1 && f1 === 7));
  t[f1][c1] = { de: p.de, dama: p.dama || corona };
  e.sinComer = j.comidas.length ? 0 : e.sinComer + 1;
  e.movidas++; e.ultimo = j;
  e.turno = 1 - e.turno;
  if (!jugadasDamas(e).length) e.terminado = 1 - e.turno;
  else if (e.sinComer >= DAMAS.tablas) e.terminado = 'tablas';
}
const copiaDamas = (e) => ({ ...e, tablero: e.tablero.map((f) => f.map((x) => (x ? { ...x } : null))) });
function evaluarDamas(e, de) {
  if (e.terminado === de) return 1000;
  if (e.terminado === 1 - de) return -1000;
  if (e.terminado === 'tablas') return 0;
  let s = 0;
  for (let f = 0; f < 8; f++) for (let c = 0; c < 8; c++) {
    const p = e.tablero[f][c];
    if (!p) continue;
    const v = p.dama ? 3 : 1 + (p.de === 0 ? (7 - f) : f) * 0.05 + (c > 1 && c < 6 ? 0.03 : 0);
    s += p.de === de ? v : -v;
  }
  return s;
}
function alfabeta(e, prof, a, b, de) {
  if (prof === 0 || e.terminado !== null) return evaluarDamas(e, de);
  const js = jugadasDamas(e);
  const max = e.turno === de;
  let mejor = max ? -Infinity : Infinity;
  for (const j of js) {
    const x = copiaDamas(e); aplicarJugada(x, j);
    const v = alfabeta(x, prof - 1, a, b, de);
    if (max) { mejor = Math.max(mejor, v); a = Math.max(a, v); } else { mejor = Math.min(mejor, v); b = Math.min(b, v); }
    if (b <= a) break;
  }
  return mejor;
}
// La jugada del rival (alfa-beta corto; `semilla` desempata para que no juegue siempre igual)
export function decidirDamas(e, semilla = 1, profundidad = DAMAS.profundidad) {
  const js = jugadasDamas(e);
  if (!js.length) return null;
  const de = e.turno;
  let mejor = null, mv = -Infinity;
  js.forEach((j, i) => {
    const x = copiaDamas(e); aplicarJugada(x, j);
    const v = alfabeta(x, profundidad - 1, -Infinity, Infinity, de) + azar(semilla * 31 + e.movidas * 7 + i) * 0.04;
    if (v > mv) { mv = v; mejor = j; }
  });
  return mejor;
}
export const casillaTexto = ([f, c]) => `${'abcdefgh'[c]}${8 - f}`;
export const textoJugada = (j) => (j ? j.camino.map(casillaTexto).join(j.comidas.length ? '×' : '–') : '');

// ---------------------------------------------------------------- la taba
// `fuerza` de 0 a 1 (la barra que va y viene: la justa está en el medio). { resultado: 'suerte'|'culo'|'costado'|
// 'corta'|'pasada', gana: bool|null } (null: se vuelve a tirar)
export const TABA = { raya: 0.3, lejos: 0.95, justa: [0.5, 0.78] };
export function tirarTaba(semilla = 1, fuerza = 0.6) {
  const f = Math.max(0, Math.min(1, Number(fuerza) || 0));
  if (f < TABA.raya) return { resultado: 'corta', gana: null };
  if (f > TABA.lejos) return { resultado: 'pasada', gana: null };
  const justa = f >= TABA.justa[0] && f <= TABA.justa[1];
  const r = azar(Math.floor(semilla) * 613 + Math.round(f * 1000));
  const suerte = justa ? 0.5 : 0.35, culo = justa ? 0.3 : 0.4;
  if (r < suerte) return { resultado: 'suerte', gana: true };
  if (r < suerte + culo) return { resultado: 'culo', gana: false };
  return { resultado: 'costado', gana: null };
}
export const TEXTO_TABA = { suerte: '¡Suerte!', culo: 'Culo', costado: 'De costado: se tira de nuevo', corta: 'Corta: no pasó la raya', pasada: 'Se pasó: se tira de nuevo' };
