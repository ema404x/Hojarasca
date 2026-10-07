// 3.7.5 (fiestas): el truco, de verdad (PLAN_3_7.md, «3.7.5 — Tradiciones»: truco). Módulo puro (sin three ni DOM: se
// prueba en Node); lo juega fiestas-juego.js con un panel (los números, el clic, Enter y el mando).
//
// Truco argentino a dos (mano a mano), con el mazo español de 40 cartas, sin flor (TRUCO.flor), a 15 puntos
// (TRUCO.aPuntos; 30 si se quiere el partido largo, con malas y buenas):
//   · la jerarquía de siempre: 1 de espada, 1 de basto, 7 de espada, 7 de oro, los 3, los 2, los 1 falsos (copa y oro),
//     los 12, los 11, los 10, los 7 falsos (copa y basto), los 6, los 5 y los 4;
//   · tres bazas: gana la mano el que gana dos; parda en la primera, define la segunda (y si también, la tercera; si
//     son todas pardas, gana el mano); ganada la primera y parda la segunda, gana el de la primera;
//   · el envido, sólo en la primera baza y antes de que el que canta tire su primera carta: envido (2), envido envido,
//     real envido (3) y falta envido (lo que le falta al que va ganando); dos cartas del mismo palo: 20 más las dos
//     (las figuras valen 0); si no, la más alta. Empate: gana el mano. «El envido está primero»: si te cantan truco en
//     la primera, podés contestar con el envido;
//   · el truco (2), retruco (3) y vale cuatro (4): sólo sube el que tiene el quiero; no querido, el que cantó se lleva
//     lo de antes (1, 2 o 3);
//   · irse al mazo: el otro se lleva lo que valga la mano (y uno más si todavía no se cantó el envido en la primera).
// El rival (`decidirIA`) juega limpio: sólo mira sus cartas y lo que está en la mesa, y miente según su forma de ser.
import { azar } from './aldea.js';

export const TRUCO = { aPuntos: 15, flor: false, mazoSinEnvido: 1 };
export const PALOS = ['espada', 'basto', 'oro', 'copa'];
export const NUMEROS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
export const NOMBRE_NUMERO = { 1: 'ancho', 10: 'sota', 11: 'caballo', 12: 'rey' };
export const mazoEspanol = () => PALOS.flatMap((palo) => NUMEROS.map((n) => ({ n, palo })));
// La jerarquía (más alto gana la baza)
export function valorTruco(c) {
  if (!c) return 0;
  const { n, palo } = c;
  if (n === 1 && palo === 'espada') return 14;
  if (n === 1 && palo === 'basto') return 13;
  if (n === 7 && palo === 'espada') return 12;
  if (n === 7 && palo === 'oro') return 11;
  if (n === 3) return 10;
  if (n === 2) return 9;
  if (n === 1) return 8;
  if (n === 12) return 7;
  if (n === 11) return 6;
  if (n === 10) return 5;
  if (n === 7) return 4;
  return n - 3;   // 6 → 3, 5 → 2, 4 → 1
}
export const valorEnvido = (c) => (c && c.n <= 7 ? c.n : 0);
export function envidoDe(cartas) {
  let mejor = 0;
  for (let i = 0; i < cartas.length; i++) {
    mejor = Math.max(mejor, valorEnvido(cartas[i]));
    for (let j = i + 1; j < cartas.length; j++) if (cartas[i].palo === cartas[j].palo) mejor = Math.max(mejor, 20 + valorEnvido(cartas[i]) + valorEnvido(cartas[j]));
  }
  return mejor;
}
export const nombreCarta = (c) => (c ? `${c.n} de ${c.palo}` : '');
export const mismaCarta = (a, b) => !!a && !!b && a.n === b.n && a.palo === b.palo;

// ---------------------------------------------------------------- el partido
const otro = (j) => 1 - j;
function barajar(semilla) {
  const m = mazoEspanol();
  for (let i = m.length - 1; i > 0; i--) { const k = Math.floor(azar(semilla * 7331 + i * 977) * (i + 1)) % (i + 1); [m[i], m[k]] = [m[k], m[i]]; }
  return m;
}
// `empieza`: quién es mano en la primera (0: vos, 1: el rival). `semilla`: el reparto.
export function partidoNuevo({ aPuntos = TRUCO.aPuntos, semilla = 1, empieza = 0 } = {}) {
  const p = { aPuntos: Math.max(1, Math.floor(aPuntos)), puntos: [0, 0], semilla: Math.floor(semilla) || 1, manos: 0, mano: empieza ? 1 : 0, terminado: null, ronda: null, log: [] };
  repartir(p);
  return p;
}
function repartir(p) {
  p.manos++;
  const m = barajar(p.semilla * 31 + p.manos * 101);
  const quien = p.mano, pie = otro(quien);
  const cartas = [[], []];
  // (de a una, empezando por el que es pie, como se reparte de verdad)
  for (let i = 0; i < 3; i++) { cartas[pie].push(m[i * 2]); cartas[quien].push(m[i * 2 + 1]); }
  p.ronda = {
    cartas, mesa: [[], []], bazas: [], turno: quien, mano: quien,
    envido: { estado: 'libre', cadena: [], quien: null, pendiente: false, ganador: null, tantos: null, puntos: 0 },
    truco: { nivel: 0, puede: null, pendiente: null },
    terminada: false, ganador: null, puntosMano: 0, razon: null,
  };
}
const ronda = (p) => p.ronda;
const bazaActual = (r) => r.bazas.length;
const jugoEnBaza = (r, j, b = bazaActual(r)) => r.mesa[j].length > b;

// Quién tiene que hacer algo ahora (0, 1 o null si terminó)
export function turnoDe(p) {
  if (!p || p.terminado !== null) return null;
  const r = ronda(p);
  if (r.terminada) return 0;   // (el «seguir»: lo aprieta el jugador)
  if (r.envido.pendiente) return otro(r.envido.quien);
  if (r.truco.pendiente) return otro(r.truco.pendiente.quien);
  return r.turno;
}
// ¿Puede cantar el envido ahora el jugador j?
function puedeEnvido(p, j) {
  const r = ronda(p);
  if (r.envido.estado !== 'libre' || bazaActual(r) > 0 || jugoEnBaza(r, j, 0)) return false;
  // (con el truco ya querido, el envido se cerró)
  if (r.truco.nivel > 0 && !r.truco.pendiente) return false;
  // (el truco cantado y sin contestar: sólo el que lo tiene que contestar puede «contestar con el envido»)
  if (r.truco.pendiente) return r.truco.pendiente.nivel === 1 && r.truco.pendiente.quien !== j;
  return true;
}
const SUBE_ENVIDO = { '': ['envido', 'real', 'falta'], envido: ['envido', 'real', 'falta'], 'envido,envido': ['real', 'falta'], real: ['falta'], 'envido,real': ['falta'], 'envido,envido,real': ['falta'], falta: [] };
function subidasEnvido(r) {
  const k = r.envido.cadena.join(',');
  const l = Object.hasOwn(SUBE_ENVIDO, k) ? SUBE_ENVIDO[k] : [];
  // (envido envido sólo una vez)
  return l.filter((x) => !(x === 'envido' && r.envido.cadena.filter((y) => y === 'envido').length >= 2));
}
const NIVELES_TRUCO = ['', 'truco', 'retruco', 'vale4'];
export const NOMBRES_CANTO = { envido: 'envido', real: 'real envido', falta: 'falta envido', truco: 'truco', retruco: 'quiero retruco', vale4: 'quiero vale cuatro', quiero: 'quiero', noquiero: 'no quiero', mazo: 'me voy al mazo' };
// Lo que puede hacer el jugador j ahora: ['carta:0', 'envido', 'truco', 'quiero', 'noquiero', 'mazo', 'seguir', …]
export function accionesDe(p, j) {
  if (!p || p.terminado !== null) return [];
  const r = ronda(p);
  if (r.terminada) return j === 0 ? ['seguir'] : [];
  if (turnoDe(p) !== j) return [];
  const l = [];
  if (r.envido.pendiente) {
    l.push('quiero', 'noquiero', ...subidasEnvido(r));
    return l;
  }
  if (r.truco.pendiente) {
    l.push('quiero', 'noquiero');
    if (r.truco.pendiente.nivel < 3) l.push(NIVELES_TRUCO[r.truco.pendiente.nivel + 1]);
    if (puedeEnvido(p, j)) l.push('envido', 'real', 'falta');
    l.push('mazo');
    return l;
  }
  r.cartas[j].forEach((c, i) => { if (c) l.push(`carta:${i}`); });
  if (puedeEnvido(p, j)) l.push('envido', 'real', 'falta');
  if (r.truco.nivel < 3 && (r.truco.puede === null || r.truco.puede === j)) l.push(NIVELES_TRUCO[r.truco.nivel + 1]);
  l.push('mazo');
  return l;
}
// Lo que vale la falta envido: lo que le falta al que va ganando
export const valorFalta = (p) => Math.max(1, p.aPuntos - Math.max(p.puntos[0], p.puntos[1]));
function puntosEnvido(p, cadena, querido) {
  if (querido) {
    if (cadena.includes('falta')) return valorFalta(p);
    return cadena.reduce((s, c) => s + (c === 'real' ? 3 : 2), 0);
  }
  const antes = cadena.slice(0, -1);
  if (!antes.length) return 1;
  if (antes.includes('falta')) return valorFalta(p);
  return antes.reduce((s, c) => s + (c === 'real' ? 3 : 2), 0);
}
function sumar(p, j, n, eventos) {
  if (p.terminado !== null) return;
  p.puntos[j] = Math.min(p.aPuntos, p.puntos[j] + n);
  if (p.puntos[j] >= p.aPuntos) { p.terminado = j; eventos.push({ tipo: 'partido', gana: j, puntos: [...p.puntos] }); }
}
// Hace la acción `a` del jugador j. { ok, eventos: [...], motivo }
export function actuar(p, j, a) {
  const eventos = [];
  if (!p || p.terminado !== null) return { ok: false, motivo: 'terminado', eventos };
  const r = ronda(p);
  if (a === 'seguir') {
    if (!r.terminada) return { ok: false, motivo: 'no', eventos };
    p.mano = otro(p.mano);
    repartir(p);
    eventos.push({ tipo: 'reparte', mano: p.mano });
    return { ok: true, eventos };
  }
  if (!accionesDe(p, j).includes(a)) return { ok: false, motivo: 'no-puede', eventos };
  const log = (e) => { eventos.push(e); p.log.push(e); if (p.log.length > 40) p.log.shift(); };
  // las respuestas
  if (a === 'quiero' || a === 'noquiero') {
    if (r.envido.pendiente) {
      const querido = a === 'quiero';
      r.envido.pendiente = false; r.envido.estado = 'cerrado';
      log({ tipo: 'responde', quien: j, que: a, a: 'envido' });
      const pts = puntosEnvido(p, r.envido.cadena, querido);
      r.envido.puntos = pts;
      if (querido) {
        const t = [envidoDe(r.cartas[0].concat(r.mesa[0]).filter(Boolean)), envidoDe(r.cartas[1].concat(r.mesa[1]).filter(Boolean))];
        const gana = t[0] > t[1] ? 0 : t[1] > t[0] ? 1 : r.mano;
        r.envido.ganador = gana; r.envido.tantos = t;
        log({ tipo: 'envido', tantos: t, gana, puntos: pts });
        sumar(p, gana, pts, eventos);
      } else {
        r.envido.ganador = r.envido.quien;
        log({ tipo: 'envido', tantos: null, gana: r.envido.quien, puntos: pts });
        sumar(p, r.envido.quien, pts, eventos);
      }
      return { ok: true, eventos };
    }
    if (r.truco.pendiente) {
      const q = r.truco.pendiente;
      r.truco.pendiente = null;
      log({ tipo: 'responde', quien: j, que: a, a: NIVELES_TRUCO[q.nivel] });
      if (a === 'quiero') { r.truco.nivel = q.nivel; r.truco.puede = j; return { ok: true, eventos }; }
      cerrarRonda(p, q.quien, 0, 'no-quiso', eventos, q.nivel);
      return { ok: true, eventos };
    }
  }
  if (a === 'envido' || a === 'real' || a === 'falta') {
    r.envido.cadena.push(a); r.envido.quien = j; r.envido.pendiente = true; r.envido.estado = 'cantado';
    log({ tipo: 'canta', quien: j, que: a });
    return { ok: true, eventos };
  }
  if (a === 'truco' || a === 'retruco' || a === 'vale4') {
    const nivel = NIVELES_TRUCO.indexOf(a);
    // (subir el truco que te cantaron es aceptarlo y cantar el siguiente)
    if (r.truco.pendiente) { r.truco.nivel = r.truco.pendiente.nivel; r.truco.pendiente = null; }
    r.truco.pendiente = { quien: j, nivel };
    log({ tipo: 'canta', quien: j, que: a });
    return { ok: true, eventos };
  }
  if (a === 'mazo') {
    log({ tipo: 'mazo', quien: j });
    const q = r.truco.pendiente;
    let pts = q ? Math.max(1, q.nivel) : Math.max(1, r.truco.nivel === 0 ? 1 : r.truco.nivel + 1);
    // (irse al mazo en la primera, sin tirar y sin que se haya cantado el envido: uno más para el otro)
    if (r.envido.estado === 'libre' && bazaActual(r) === 0 && !jugoEnBaza(r, j, 0)) pts += TRUCO.mazoSinEnvido;
    cerrarRonda(p, otro(j), 0, 'mazo', eventos, pts);
    return { ok: true, eventos };
  }
  const m = /^carta:([0-2])$/.exec(a);
  if (m) {
    const i = Number(m[1]), c = r.cartas[j][i];
    r.cartas[j][i] = null;
    r.mesa[j].push(c);
    log({ tipo: 'carta', quien: j, carta: c });
    const b = bazaActual(r);
    if (jugoEnBaza(r, otro(j), b)) {
      // la baza se definió
      const v0 = valorTruco(r.mesa[0][b]), v1 = valorTruco(r.mesa[1][b]);
      const gana = v0 > v1 ? 0 : v1 > v0 ? 1 : 'parda';
      r.bazas.push(gana);
      log({ tipo: 'baza', gana, n: b + 1 });
      const g = ganadorDeRonda(r);
      if (g !== null) { cerrarRonda(p, g, r.truco.nivel, 'bazas', eventos); return { ok: true, eventos }; }
      r.turno = gana === 'parda' ? r.mano : gana;
    } else r.turno = otro(j);
    return { ok: true, eventos };
  }
  return { ok: false, motivo: 'no', eventos };
}
// ¿Quién ganó la ronda, con las bazas que hay? (null: todavía no se sabe)
export function ganadorDeRonda(r) {
  const b = r.bazas, mano = r.mano;
  const ganadas = [0, 1].map((j) => b.filter((x) => x === j).length);
  if (ganadas[0] >= 2) return 0;
  if (ganadas[1] >= 2) return 1;
  if (b.length >= 2) {
    if (b[0] === 'parda' && b[1] !== 'parda') return b[1];
    if (b[0] !== 'parda' && b[1] === 'parda') return b[0];
  }
  if (b.length === 3) {
    if (b[2] !== 'parda') return b[2];
    // tercera parda: el de la primera; todas pardas: el mano
    return b[0] !== 'parda' ? b[0] : mano;
  }
  return null;
}
function cerrarRonda(p, gana, nivel, razon, eventos, puntos = null) {
  const r = ronda(p);
  const pts = puntos !== null ? puntos : Math.max(1, nivel === 0 ? 1 : nivel + 1);
  r.terminada = true; r.ganador = gana; r.puntosMano = pts; r.razon = razon;
  const e = { tipo: 'mano', gana, puntos: pts, razon };
  eventos.push(e); p.log.push(e);
  sumar(p, gana, pts, eventos);
}

// ---------------------------------------------------------------- el rival
// `perfil`: { miente: 0..1 (cuánto canta sin tener), corazon: 0..1 (cuánto se la juega al contestar) }. `semilla`: para
// que las decisiones no sean siempre iguales (y se puedan repetir en las pruebas).
export const PERFIL_TRUCO = { miente: 0.25, corazon: 0.5 };
function fuerzaMano(cartas) {
  const v = cartas.filter(Boolean).map(valorTruco).sort((a, b) => b - a);
  return v.reduce((s, x, i) => s + x * (i === 0 ? 1 : i === 1 ? 0.6 : 0.3), 0);
}
export function decidirIA(p, j, perfil = PERFIL_TRUCO, semilla = 1) {
  const acc = accionesDe(p, j);
  if (!acc.length) return null;
  const r = ronda(p);
  const pf = { ...PERFIL_TRUCO, ...(perfil || {}) };
  const dado = (k) => azar(Math.floor(semilla) * 131 + p.manos * 977 + r.mesa[0].length * 31 + r.mesa[1].length * 7 + k);
  const mias = r.cartas[j].filter(Boolean);
  const tanto = envidoDe(r.cartas[j].filter(Boolean).concat(r.mesa[j]));
  const fuerza = fuerzaMano(mias);
  const b = bazaActual(r);
  const ganeAlguna = r.bazas.includes(j);
  const perdiAlguna = r.bazas.includes(otro(j));
  // contestar el envido
  if (r.envido.pendiente) {
    const cad = r.envido.cadena, falta = cad.includes('falta');
    const necesito = falta ? 30 : cad.includes('real') ? 28 : cad.length > 1 ? 27 : 25;
    const coraje = (pf.corazon - 0.5) * 4;
    if (tanto >= 31 && acc.includes('falta') && !falta && dado(1) < 0.5) return 'falta';
    if (tanto >= 29 && acc.includes('real') && dado(2) < 0.5) return 'real';
    return tanto + coraje >= necesito ? 'quiero' : 'noquiero';
  }
  // contestar el truco
  if (r.truco.pendiente) {
    const nivel = r.truco.pendiente.nivel;
    // (el envido está primero)
    if (acc.includes('envido') && tanto >= 27 && dado(3) < 0.8) return tanto >= 30 && dado(4) < 0.5 ? 'real' : 'envido';
    let chance = fuerza / 22 + (ganeAlguna ? 0.3 : 0) - (perdiAlguna ? 0.3 : 0) + (pf.corazon - 0.5) * 0.3 - (nivel - 1) * 0.12;
    if (b === 2 && mias.length) {
      const yo = valorTruco(mias[0]), el = r.mesa[otro(j)][2];
      if (el) chance = valorTruco(el) < yo ? 1 : valorTruco(el) === yo ? (ganeAlguna ? 1 : 0.4) : 0;
      else chance = yo >= 10 ? 0.85 : yo >= 7 ? 0.5 : 0.2;
    }
    if (chance > 0.85 && acc.includes(NIVELES_TRUCO[nivel + 1]) && dado(5) < 0.6) return NIVELES_TRUCO[nivel + 1];
    if (chance > 0.45) return 'quiero';
    if (chance > 0.3 && dado(6) < pf.corazon * 0.5) return 'quiero';
    return 'noquiero';
  }
  // mi turno de jugar
  if (acc.includes('envido')) {
    if (tanto >= 30 && dado(7) < 0.4) return dado(8) < 0.5 ? 'real' : 'envido';
    if (tanto >= 27) return 'envido';
    if (tanto <= 22 && dado(9) < pf.miente * 0.35) return 'envido';
  }
  const canto = acc.find((x) => x === 'truco' || x === 'retruco' || x === 'vale4');
  if (canto) {
    const nivel = r.truco.nivel + 1;
    const fuerte = fuerza >= 17 || (ganeAlguna && mias.some((c) => valorTruco(c) >= 10)) || (b === 2 && mias[0] && valorTruco(mias[0]) >= 11);
    if (fuerte && dado(10) < 0.75 - (nivel - 1) * 0.15) return canto;
    if (!fuerte && dado(11) < pf.miente * 0.25 / nivel) return canto;
  }
  // tirar una carta
  const cartas = acc.filter((x) => x.startsWith('carta:')).map((x) => ({ x, c: r.cartas[j][Number(x.slice(6))] })).sort((a, c) => valorTruco(a.c) - valorTruco(c.c));
  if (!cartas.length) return acc.includes('mazo') ? 'mazo' : acc[0];
  const suya = r.mesa[otro(j)][b];
  if (suya) {
    // la más baja que le gane; si no hay, la más baja (o parda si conviene)
    const v = valorTruco(suya);
    const gana = cartas.find((k) => valorTruco(k.c) > v);
    if (gana) return gana.x;
    const empata = cartas.find((k) => valorTruco(k.c) === v);
    if (empata && (b > 0 && r.bazas[0] === j)) return empata.x;
    return cartas[0].x;
  }
  // abro la baza: en la primera, la del medio; después de ganar, la más baja; si perdí, la más alta
  if (b === 0) return cartas[Math.min(1, cartas.length - 1)].x;
  if (r.bazas[b - 1] === j) return cartas[0].x;
  return cartas[cartas.length - 1].x;
}
// Cómo juega cada vecino (los que hablan del truco en vecindad-social-voces.js)
export const PERFILES_TRUCO = {
  jefe: { miente: 0.35, corazon: 0.6 }, herrero: { miente: 0.05, corazon: 0.4 }, ercilia: { miente: 0.45, corazon: 0.7 },
  padre: { miente: 0.3, corazon: 0.55 }, madre: { miente: 0.2, corazon: 0.6 }, martin: { miente: 0.4, corazon: 0.5 },
  carpintero: { miente: 0.6, corazon: 0.5 }, musico: { miente: 0.5, corazon: 0.65 }, abuela: { miente: 0.15, corazon: 0.35 },
  'inv-domador': { miente: 0.3, corazon: 0.7 }, 'inv-pescador': { miente: 0.4, corazon: 0.5 },
};
export const perfilTruco = (clave) => (typeof clave === 'string' && Object.hasOwn(PERFILES_TRUCO, clave) ? PERFILES_TRUCO[clave] : PERFIL_TRUCO);
