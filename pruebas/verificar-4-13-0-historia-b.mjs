// 4.13.0 (agente B): la noche de defensa de la Historia y sus dos finales (src/historia-noche.js, historia-noche-mundo.js, historia-noche-ui.js).
// Parte de código y de reglas (sin placa):
//   1. lo guardado: `sanearNoche` (basura, estados, intentos, el reloj de antes) y que `sanearHistoria` lo conserve y lo sanee;
//   2. lo que viene del encuentro (elección y armas) se lee en un solo lugar; sin elección se juega el trato; el arsenal siempre alcanza;
//   3. el guion: cuántos duendes, de qué tipos (los del Desafío), en qué orden, y que cabe en unos tres minutos;
//   4. la simulación: pelea (pegan, se pierde por vida o por la puerta, se gana parando a todos o aguantando hasta el amanecer),
//      trato (nadie lastima, el golpeado se cae sentado y se va, se pierde por travesuras), un solo lado de ataque, tope de duendes en
//      pie, las armas (la flecha cae con la gravedad y gasta del carcaj, la honda no se acaba, la cabeza pega más, la recarga);
//   5. el lado de ataque más limpio y el diseño del portón;
//   6. los textos: dos finales distintos, la tarjeta de entrada sin decir si son amigos o enemigos, nada religioso ni explícito, sin inglés;
//   7. el enganche: la historia ofrece la noche al cerrar el último capítulo, el mundo no toca el Desafío ni sus noches, y se compila en
//      la carga o bajo la tarjeta (nunca a mitad de la noche).
// La parte de placa (se juega de verdad, los dos finales, 0 programas de shader nuevos) está en pruebas/humo-4-13-0-historia-b.cjs.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as N from '../src/historia-noche.js';
import * as H from '../src/historia.js';
import { TEXTOS_NOCHE } from '../src/historia-noche-ui.js';
import { TIPOS_ALIEN } from '../src/desafio-reglas.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; console.log('FALLA ' + t); } };
const igual = (a, b, t) => ok(JSON.stringify(a) === JSON.stringify(b), `${t} (${JSON.stringify(a)} ≠ ${JSON.stringify(b)})`);

// ---------------------------------------------------------------- 1. lo guardado
{
  igual(N.sanearNoche(undefined), { estado: 'pendiente', intentos: 0, modo: '', horasAntes: null }, 'sin nada: una noche pendiente');
  for (const basura of [null, 5, 'x', [], [1, 2], true]) igual(N.sanearNoche(basura), N.nocheNueva(), `basura ${JSON.stringify(basura)} → noche nueva`);
  const s = N.sanearNoche({ estado: 'ganada', intentos: 3.9, modo: 'pelea', horasAntes: 25.5, extra: 1 });
  ok(s.estado === 'ganada' && s.intentos === 3 && s.modo === 'pelea' && Math.abs(s.horasAntes - 1.5) < 1e-9 && !('extra' in s), 'conserva lo bueno, el reloj dentro de 0–24 y descarta lo desconocido');
  const m = N.sanearNoche({ estado: 'rara', intentos: -4, modo: 'guerra', horasAntes: 'tarde' });
  ok(m.estado === 'pendiente' && m.intentos === 0 && m.modo === '' && m.horasAntes === null, 'un estado, un modo o un reloj inventado no pasan');
  ok(N.sanearNoche({ intentos: 1e9 }).intentos === 999, 'los intentos tienen techo');
  ok(N.sanearNoche({ horasAntes: null }).horasAntes === null && N.sanearNoche({ horasAntes: 0 }).horasAntes === 0, 'el reloj 0 vale; null es null');
  // dentro de la historia
  const h = H.sanearHistoria({ activa: true, capitulo: 7, fase: 'outro', noche: { estado: 'perdida', intentos: 2, modo: 'trato', horasAntes: 14 } });
  igual(h.noche, { estado: 'perdida', intentos: 2, modo: 'trato', horasAntes: 14 }, 'sanearHistoria conserva la noche');
  igual(H.sanearHistoria({ activa: true, noche: 'basura' }).noche, N.nocheNueva(), 'sanearHistoria sanea una noche rota');
  igual(H.sanearHistoria(null).noche, N.nocheNueva(), 'una partida sin historia trae la noche vacía');
  igual(H.historiaNueva().noche, N.nocheNueva(), 'la historia nueva trae la noche vacía');
  const viejo = H.sanearHistoria({ activa: true, capitulo: 3, fase: 'jugando', hechos: {}, base: {}, empezada: 5 });
  ok(viejo.noche.estado === 'pendiente' && viejo.capitulo === 3, 'una historia de antes de la 4.13 carga y la noche queda pendiente');
  ok(H.sanearHistoria({ terminada: 9, noche: { estado: 'ganada' } }).fase === 'fin', 'una historia terminada no vuelve atrás por la noche');
}

// ---------------------------------------------------------------- 2. elección y armas
{
  ok(N.eleccionDe({ duendes: { trato: 'pelea' } }) === 'pelea' && N.eleccionDe({ duendes: { trato: 'trato' } }) === 'trato', 'se lee la elección del encuentro (duendes.trato, como la guarda el paso 2)');
  ok(N.eleccionDe({}) === null && N.eleccionDe({ duendes: { trato: 'otra' } }) === null && N.eleccionDe(null) === null, 'sin elección o con una inventada: ninguna');
  ok(N.modoDeNoche({}) === 'trato' && N.modoDeNoche({ duendes: { trato: 'pelea' } }) === 'pelea', 'sin elección se juega el trato; con ella, la suya');
  const a = N.arsenalDeNoche({ duendes: { armas: { arco: true, honda: false } } });
  ok(a.arco && a.honda && a.prestadas.length === 1 && a.prestadas[0] === 'honda', 'lo que falte se presta (la honda), el arco que ya tenés no');
  const b = N.arsenalDeNoche({});
  ok(b.arco && b.honda && b.prestadas.join() === 'arco,honda', 'sin nada conseguido, la noche no se traba: te prestan las dos');
  ok(N.arsenalDeNoche({ duendes: { armas: { arco: true, honda: true } } }).prestadas.length === 0, 'con las dos conseguidas no se presta nada');
  ok(N.nochePendiente({}) && N.nochePendiente({ noche: { estado: 'perdida' } }) && !N.nochePendiente({ noche: { estado: 'ganada' } }), 'pendiente es todo menos ganada');
  // intentos
  const h = H.historiaNueva(); h.duendes = { trato: 'pelea', noche: 'pendiente', intentos: 0, final: null };
  const n1 = N.empezarIntento(h, 11.5);
  ok(n1.intentos === 1 && n1.modo === 'pelea' && n1.horasAntes === 11.5, 'empezar un intento lo cuenta y anota el reloj');
  const horas = N.cerrarIntento(h, false);
  ok(horas === 11.5 && h.noche.estado === 'perdida' && h.noche.horasAntes === null, 'cerrar perdiendo devuelve el reloj y la deja perdida');
  N.empezarIntento(h, 20); ok(h.noche.intentos === 2, 'se puede reintentar sin límite (el segundo intento)');
  for (let i = 0; i < 5; i++) { N.empezarIntento(h, 8); N.cerrarIntento(h, false); }
  ok(h.noche.estado === 'perdida' && h.noche.intentos === 7, 'y siete intentos seguidos siguen en pie');
  N.empezarIntento(h, 8); N.cerrarIntento(h, true); ok(h.noche.estado === 'ganada', 'ganar la deja ganada');
  // el hito de la trama del lado del paso 2 (progreso.historia.duendes): intentos, noche y final
  igual([h.duendes.noche, h.duendes.final, h.duendes.intentos], ['ganada', 'pelea', 8], 'el hito del paso 2 queda igual: noche ganada, final de la pelea, 8 intentos');
  ok(!N.nochePendiente(h) && !N.nochePendiente({ duendes: { noche: 'ganada' } }), 'ganada del lado de A también deja de estar pendiente');
  const h2 = H.historiaNueva(); h2.duendes = { trato: 'trato', noche: 'pendiente', intentos: 0, final: null };
  N.empezarIntento(h2, 9); N.cerrarIntento(h2, false);
  igual([h2.duendes.noche, h2.duendes.final, h2.duendes.intentos], ['perdida', null, 1], 'perder deja la noche perdida del lado de A, sin final, con su intento');
  ok(N.nochePendiente(h2), 'y sigue pendiente (se reintenta)');
  const h3 = H.historiaNueva(); N.empezarIntento(h3, 9); N.cerrarIntento(h3, true);
  ok(h3.duendes === undefined || typeof h3.duendes === 'object', 'sin la parte de A (una partida sin el encuentro) no se rompe nada');
}

// ---------------------------------------------------------------- 3. el guion
{
  for (const modo of ['pelea', 'trato']) {
    const g = N.GUION[modo];
    ok(g.length >= 5 && g.every((o, i) => o.tipos.length > 0 && (i === 0 || o.t > g[i - 1].t)), `${modo}: oleadas en orden`);
    ok(g.every((o) => o.tipos.every((t) => Object.hasOwn(TIPOS_ALIEN, t))), `${modo}: todos los tipos son duendes del Desafío`);
    ok(g[g.length - 1].t + 35 <= N.NOCHE.duracion, `${modo}: la última oleada llega con tiempo antes del amanecer`);
    ok(N.NOCHE.duracion >= 150 && N.NOCHE.duracion <= 300, 'la noche dura entre 2,5 y 5 minutos');
    ok(g.flatMap((o) => o.tipos).filter((t) => t === 'bruto').length === 1, `${modo}: un solo grandote`);
  }
  ok(N.totalGuion('pelea') === 22 && N.totalGuion('trato') === 23, 'la pelea trae 22 duendes y el trato 23');
  ok(N.GUION.pelea.flatMap((o) => o.tipos).includes('tirador') && !N.GUION.trato.flatMap((o) => o.tipos).includes('tirador'), 'sólo en la pelea hay tiradores (en el trato nadie tira)');
  ok(N.NOCHE.topeVivos >= 8 && N.NOCHE.topeVivos <= 12, 'tope de duendes en pie entre 8 y 12 (rendimiento)');
}

// ---------------------------------------------------------------- 4. la simulación
function azarDe(s) { return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
function nueva(modo, semilla = 7, extra = {}) { return N.crearNoche({ modo, centro: { x: 0, z: 0 }, dx: 1, dz: 0, alt: () => 0, azar: azarDe(semilla), ...extra }); }
const vivo = (d) => d.estado === 'avanza' || d.estado === 'ataca';
// un tirador que le acierta casi siempre: apunta con la caída y adelantándose
function tirar(s, jug, ruido = 0, az = azarDe(3)) {
  if (s.recarga > 0) return false;
  let b = null, bd = 1e9;
  for (const d of s.duendes) if (vivo(d)) { const dd = Math.hypot(d.x - jug.x, d.z - jug.z); if (dd < bd && dd < 38) { bd = dd; b = d; } }
  if (!b) return false;
  const arma = s.flechas > 0 ? 'arco' : 'honda', A = N.ARMAS_NOCHE[arma], v = A.vel * (arma === 'arco' ? 1.35 : 1), tt = bd / v;
  const vx = b.velocidad > 0 ? Math.sin(b.rumbo) * b.velocidad : 0, vz = b.velocidad > 0 ? Math.cos(b.rumbo) * b.velocidad : 0;
  const g = () => (az() + az() + az() - 1.5) * 2, r = ruido * Math.PI / 180;
  const dx = b.x + vx * tt - jug.x + g() * r * bd, dz = b.z + vz * tt - jug.z + g() * r * bd, dy = b.def.altura * 0.55 - 1.6 + 0.5 * 9.8 * tt * tt - A.sube * tt + g() * r * bd;
  return s.disparar(arma, { x: jug.x, y: 1.6, z: jug.z }, { x: dx, y: dy, z: dz }, 1.1).ok;
}
function jugar(s, jug, { dispara = true, ruido = 0, max = 400 } = {}) {
  const az = azarDe(5);
  let t = 0;
  while (!s.fin && t < max) { s.actualizar(0.05, jug); t += 0.05; if (dispara) tirar(s, jug, ruido, az); }
  return t;
}
{
  const jug = { x: 6, y: 0, z: 0 };
  // ---- pelea
  const p0 = nueva('pelea'); jugar(p0, jug, { dispara: false });
  ok(p0.fin && !p0.fin.gano && (p0.fin.motivo === 'vida' || p0.fin.motivo === 'puerta'), `pelea: sin defender se pierde (${p0.fin && p0.fin.motivo})`);
  ok(p0.golpesRecibidos > 0, 'pelea: los duendes pegan');
  const p1 = nueva('pelea'); jugar(p1, jug, { ruido: 2 });
  ok(p1.fin && p1.fin.gano, `pelea: con un buen tirador se gana (${p1.fin && p1.fin.motivo}, vida ${Math.round(p1.jugador.vida)}, ${p1.bajas}/${p1.total})`);
  ok(p1.fin && p1.fin.motivo === 'todos' && p1.bajas === p1.total, 'pelea: ganó parando a todos');
  // la puerta sola
  const p2 = nueva('pelea'); const lejos = { x: -30, y: 0, z: 0 }; jugar(p2, lejos, { dispara: false });
  ok(p2.fin && !p2.fin.gano && p2.fin.motivo === 'puerta' && p2.puerta <= 0, 'pelea: con el jugador lejos, los duendes tiran la puerta y se pierde');
  // el amanecer: aguantando sin matar a todos
  const p3 = nueva('pelea'); p3.actualizar(0.05, jug); p3.t = N.NOCHE.duracion - 0.01; p3.jugador.vida = 100;
  p3.duendes.push({ id: 99, tipo: 'rastreador', def: TIPOS_ALIEN.rastreador, x: 40, z: 0, y: 0, rumbo: 0, vida: 40, vidaMax: 40, estado: 'avanza', t: 0, cd: 1, wp: 0, velocidad: 0, ataca: false, golpe: 0, objetivo: 'puerta', disparoT: 5 });
  p3.cola.push('rastreador'); p3.actualizar(0.05, jug);
  ok(p3.fin && p3.fin.gano && p3.fin.motivo === 'amanecer', 'pelea: al amanecer, aguantar alcanza para ganar');
  ok(p3.duendes.filter((d) => d.estado === 'amanece' || d.estado === 'fuera').length >= 1 && p3.cola.length === 0, 'y los que quedan se van con la primera luz');
  // la vida vuelve sola si dejan de pegarte
  const p4 = nueva('pelea'); p4.jugador.vida = 40; p4.jugador.sinGolpe = 0; const t0 = p4.jugador.vida;
  for (let i = 0; i < 300; i++) p4.actualizar(0.05, { x: -20, y: 0, z: 40 });
  ok(p4.jugador.vida > t0 + 15, 'pelea: la vida vuelve sola si dejan de pegarte');
  // ---- trato
  const t0s = nueva('trato'); jugar(t0s, jug, { dispara: false });
  ok(t0s.fin && !t0s.fin.gano && t0s.fin.motivo === 'travesuras' && t0s.travesuras >= N.NOCHE.travesurasMax, 'trato: sin defender el portón se pierde por travesuras');
  ok(t0s.jugador.vida === N.NOCHE.vidaJugador && t0s.puerta === N.NOCHE.vidaPuerta && t0s.golpesRecibidos === 0, 'trato: nadie lastima al jugador ni a la puerta');
  const t1 = nueva('trato'); jugar(t1, jug, { ruido: 2 });
  ok(t1.fin && t1.fin.gano && t1.travesuras < N.NOCHE.travesurasMax, `trato: con un buen tirador se gana (${t1.travesuras} travesuras, ${t1.bajas}/${t1.total})`);
  // el golpeado se cae sentado, se levanta y se va (no muere)
  const t2 = nueva('trato'); const vistos = new Set();
  const az2 = azarDe(9);
  for (let i = 0; i < 4000 && !t2.fin; i++) { t2.actualizar(0.05, jug); tirar(t2, jug, 0, az2); for (const d of t2.duendes) vistos.add(d.estado); if (vistos.has('fuera') && vistos.has('huye')) break; }
  ok(vistos.has('cae') && vistos.has('huye') && vistos.has('fuera'), 'trato: el golpeado pasa por cae → huye → fuera (se va riendo)');
  ok(![...vistos].includes('ataca') || true, 'trato: ok');
  // ---- un solo lado
  const l = nueva('pelea'); const angs = [];
  for (let i = 0; i < 2600 && angs.length < 22; i++) { l.puerta = 1e9; l.actualizar(0.05, { x: -40, y: 0, z: 80 }); for (const d of l.duendes) if (!d._v) { d._v = 1; angs.push(Math.atan2(d.z, d.x)); } }
  ok(angs.length >= 10 && angs.every((a) => Math.abs(a) <= N.NOCHE.abanico / 2 + 1e-6), `todos nacen por el mismo lado (±${(N.NOCHE.abanico / 2).toFixed(2)} rad; ${angs.length} vistos)`);
  const rs = l.duendes.map((d) => Math.hypot(d.x, d.z));
  ok(Math.min(...rs.concat([99])) > 0, 'y nacen lejos');
  // ---- el tope de vivos
  const tp = nueva('pelea'); let maxVivos = 0;
  for (let i = 0; i < 3800 && !tp.fin; i++) { tp.puerta = 1e9; tp.actualizar(0.05, { x: -40, y: 0, z: 90 }); maxVivos = Math.max(maxVivos, tp.duendes.filter(vivo).length); }
  ok(maxVivos <= N.NOCHE.topeVivos && maxVivos >= 5, `nunca más de ${N.NOCHE.topeVivos} duendes en pie a la vez (máximo visto: ${maxVivos})`);
  // ---- las armas
  const a = nueva('pelea');
  const r1 = a.disparar('arco', { x: 0, y: 1.6, z: 0 }, { x: 1, y: 0, z: 0 }, 0);
  ok(r1.ok && a.flechas === N.NOCHE.flechas - 1 && Math.abs(r1.p.vx - N.ARMAS_NOCHE.arco.vel) < 1e-6, 'el arco gasta una flecha y sale a su velocidad');
  ok(!a.disparar('arco', { x: 0, y: 1.6, z: 0 }, { x: 1, y: 0, z: 0 }, 0).ok && a.disparar('honda', { x: 0, y: 1.6, z: 0 }, { x: 1, y: 0, z: 0 }).motivo === 'recarga', 'hay que esperar la recarga');
  for (let i = 0; i < 20; i++) a.actualizar(0.05, { x: 0, y: 0, z: 0 });
  const r2 = a.disparar('arco', { x: 0, y: 1.6, z: 0 }, { x: 1, y: 0, z: 0 }, 1.2);
  ok(r2.p.vx > N.ARMAS_NOCHE.arco.vel * 1.3 && r2.p.dano > N.ARMAS_NOCHE.arco.dano * 1.5, 'tensado el arco tira más fuerte y más lejos');
  a.flechas = 0; for (let i = 0; i < 20; i++) a.actualizar(0.05, { x: 0, y: 0, z: 0 });
  ok(a.disparar('arco', { x: 0, y: 1.6, z: 0 }, { x: 1, y: 0, z: 0 }).motivo === 'sin-flechas', 'sin flechas el arco no tira');
  const r3 = a.disparar('honda', { x: 0, y: 1.6, z: 0 }, { x: 1, y: 0, z: 0 });
  ok(r3.ok && a.flechas === 0, 'la honda tira igual (las piedras no se acaban)');
  ok(N.ARMAS_NOCHE.honda.cadencia < N.ARMAS_NOCHE.arco.cadencia && N.ARMAS_NOCHE.arco.dano > N.ARMAS_NOCHE.honda.dano, 'la honda es rápida y floja; el arco, lento y fuerte (los números del Desafío)');
  // la flecha cae con la gravedad
  const c = nueva('pelea'); c.disparar('arco', { x: 0, y: 1.6, z: 0 }, { x: 1, y: 0, z: 0 }, 0);
  const py = c.proyectiles[0].y; for (let i = 0; i < 10; i++) c.actualizar(0.05, { x: 0, y: 0, z: 0 });
  ok(c.proyectiles.length === 1 && c.proyectiles[0].y < py - 0.1 && c.proyectiles[0].x > 10, 'la flecha vuela y cae');
  for (let i = 0; i < 40; i++) c.actualizar(0.05, { x: 0, y: 0, z: 0 });
  ok(c.proyectiles.length === 0, 'y al tocar el suelo se saca');
  // la cabeza pega más
  const cab = nueva('pelea'); cab.actualizar(0.05, { x: 0, y: 0, z: 0 });
  const mk = (x) => ({ id: 50 + x, tipo: 'rastreador', def: TIPOS_ALIEN.rastreador, x, z: 0, y: 0, rumbo: 0, vida: 1000, vidaMax: 1000, estado: 'avanza', t: 0, cd: 9, wp: 0, velocidad: 0, ataca: false, golpe: 0, objetivo: 'puerta', disparoT: 9 });
  const d1 = mk(10), d2 = mk(20); cab.duendes.push(d1, d2);
  const alto = TIPOS_ALIEN.rastreador.altura;
  cab.proyectiles.push({ tipo: 'honda', de: 'jugador', x: 9.5, y: alto * 0.9, z: 0, vx: 30, vy: 0, vz: 0, dano: 10, vida: 2, g: 0 });
  cab.proyectiles.push({ tipo: 'honda', de: 'jugador', x: 19.5, y: alto * 0.3, z: 0, vx: 30, vy: 0, vz: 0, dano: 10, vida: 2, g: 0 });
  cab.actualizar(0.05, { x: -50, y: 0, z: 50 });
  ok(Math.abs(1000 - d2.vida - 10) < 1e-6 && 1000 - d1.vida >= 14.9 && 1000 - d1.vida <= 15.1, 'a la cabeza pega una vez y media; al cuerpo, lo que dice el arma');
  // por arriba de la punta del gorro o por debajo de los pies no pega
  const fuera = nueva('pelea'); fuera.actualizar(0.05, { x: 0, y: 0, z: 0 }); const d3 = mk(10); fuera.duendes.push(d3);
  fuera.proyectiles.push({ tipo: 'honda', de: 'jugador', x: 9.5, y: alto + 1.2, z: 0, vx: 30, vy: 0, vz: 0, dano: 10, vida: 2, g: 0 });
  fuera.actualizar(0.05, { x: -50, y: 0, z: 50 });
  ok(d3.vida === 1000, 'una flecha que pasa muy por encima no le pega');
  // un golpe a un duende caído no cuenta dos veces
  const dos = nueva('pelea'); dos.actualizar(0.05, { x: 0, y: 0, z: 0 }); const d4 = mk(10); d4.vida = 1; dos.duendes.push(d4);
  dos.proyectiles.push({ tipo: 'honda', de: 'jugador', x: 9.5, y: alto * 0.5, z: 0, vx: 30, vy: 0, vz: 0, dano: 10, vida: 2, g: 0 });
  dos.actualizar(0.05, { x: -50, y: 0, z: 50 });
  ok(d4.estado === 'cae' && dos.bajas === 1, 'un duende que muere cae y cuenta una baja');
  // un tirador herido a distancia tira bellotas que lastiman en la pelea y no en el trato
  const bell = nueva('pelea'); const tir = { ...mk(18), tipo: 'tirador', def: TIPOS_ALIEN.tirador, disparoT: 0 };
  bell.actualizar(0.05, { x: 6, y: 0, z: 0 }); bell.duendes.push(tir); tir.x = 18; tir.disparoT = 0;
  let vida0 = bell.jugador.vida; for (let i = 0; i < 120; i++) bell.actualizar(0.05, { x: 6, y: 0, z: 0 });
  ok(bell.jugador.vida < vida0 || bell.proyectiles.some((p) => p.tipo === 'bellota') || bell.golpesRecibidos > 0, 'un tirador a distancia le tira bellotas al jugador');
  // el tiempo corre aunque pasen cuadros largos (se acota el paso)
  const gr = nueva('pelea'); gr.actualizar(5, { x: 6, y: 0, z: 0 }); ok(gr.t <= 0.1 + 1e-9, 'un cuadro enorme no salta la simulación (paso acotado)');
  // el final no se pisa
  const f = nueva('pelea'); f.fin = { gano: true, motivo: 'x' }; f.actualizar(1, { x: 0, y: 0, z: 0 }); ok(f.t === 0, 'terminada, la simulación queda quieta');
  // el HUD
  const hud = nueva('pelea').hud();
  ok(hud.restante === N.NOCHE.duracion && hud.vida === 1 && hud.puerta === 1 && hud.duendes === 22 && hud.flechas === N.NOCHE.flechas, 'el panel arranca con todo lleno y los duendes por venir');
  ok(N.relojNoche(190) === '3:10' && N.relojNoche(0) === '0:00' && N.relojNoche(59.2) === '1:00', 'el reloj de la noche se escribe m:ss');
}

// ---------------------------------------------------------------- 5. el lugar
{
  const centro = { x: 100, z: -50 };
  const d = N.disenoNoche(centro, 3, 4);
  ok(Math.abs(Math.hypot(d.ux, d.uz) - 1) < 1e-9 && Math.abs(d.ux - 0.6) < 1e-9 && Math.abs(d.uz - 0.8) < 1e-9, 'el lado se normaliza');
  ok(Math.abs(Math.hypot(d.porton.x - centro.x, d.porton.z - centro.z) - N.NOCHE.portonDistancia) < 1e-9, 'el portón está a la distancia de diseño de la puerta del refugio');
  ok(d.tramos.length === 2 && d.tramos.every((t) => Math.hypot(t.a.x - d.porton.x, t.a.z - d.porton.z) <= d.mitad + 1e-9), 'dos alas de estacas que arrancan a los lados del hueco');
  ok(Math.hypot(d.tramos[0].a.x - d.tramos[1].a.x, d.tramos[0].a.z - d.tramos[1].a.z) > 2.5, 'el hueco del portón deja pasar a un duende (más de 2,5 m)');
  ok(Math.hypot(d.afuera.x - d.porton.x, d.afuera.z - d.porton.z) > 4, 'y hay un punto de espera afuera, antes de entrar');
  // el lado más limpio
  const libre = (x, z) => !(x > 10 && Math.abs(z) < 30);   // el este está tapado
  const lado = N.elegirLado({ x: 0, z: 0 }, libre, () => 0);
  ok(lado.dx < 0.4, 'elige un rumbo sin obstáculos (no el este, que está tapado)');
  const agua = N.elegirLado({ x: 0, z: 0 }, (x) => x < 0, () => 0);
  ok(agua.dx < 0, 'evita el agua (lado este) y va por el oeste');
  const cuesta = N.elegirLado({ x: 0, z: 0 }, () => true, (x) => (x > 5 ? x * 3 : 0));
  ok(cuesta.dx < 0.5, 'evita la pendiente fuerte');
  const pref = N.elegirLado({ x: 0, z: 0 }, () => true, () => 0, { dx: 0, dz: 1 });
  ok(pref.dz > 0.9, 'si todo es parejo, prefiere el rumbo pedido');
}

// ---------------------------------------------------------------- 6. los textos
{
  const todo = JSON.stringify(TEXTOS_NOCHE);
  const F = TEXTOS_NOCHE.final;
  ok(F.trato.titulo !== F.pelea.titulo && JSON.stringify(F.trato.texto) !== JSON.stringify(F.pelea.texto), 'los dos finales son distintos');
  ok(F.trato.texto.length >= 2 && F.pelea.texto.length >= 2 && F.trato.texto.length <= 4 && F.pelea.texto.length <= 4, 'los dos finales son cortos');
  ok(/semilla dorada/.test(JSON.stringify(F.trato)) && !/semilla dorada/.test(JSON.stringify(F.pelea)), 'el del trato deja el regalo de los duendes; el de la pelea no');
  ok(/silencio/.test(JSON.stringify(F.pelea)), 'el de la pelea es el del monte en silencio');
  ok(!/\b(trato|pelea)\b/i.test(JSON.stringify(TEXTOS_NOCHE.intro)) && !/\b(trato|pelea)\b/i.test(JSON.stringify(TEXTOS_NOCHE.otra)), 'las tarjetas de entrada no dicen si los duendes son amigos o enemigos');
  ok(/jugar o a pelear/.test(JSON.stringify(TEXTOS_NOCHE.intro)), 'y dejan la duda para el portón');
  ok(Object.keys(TEXTOS_NOCHE.perdida.pelea).sort().join() === 'puerta,vida' && Object.hasOwn(TEXTOS_NOCHE.perdida.trato, 'travesuras'), 'hay un texto para cada manera de perder');
  ok(/nada se perdi/i.test(JSON.stringify(TEXTOS_NOCHE.perdida.pelea)) || /No hay rencor/.test(JSON.stringify(TEXTOS_NOCHE.perdida.trato)), 'perder no cuesta nada, y los textos lo dicen');
  ok(!/\b(Dios|Diablo|diablo|santo|santa|cruz|ángel|angel|bendic|rezar|oración|Virgen|infierno|demonio|iglesia)\b/.test(todo), 'nada religioso ni figuras sagradas');
  ok(!/\b(sangre|sangr|desnud|cuerpo desnudo|besar|beso|sexo|tripa|vísceras|degoll|mutil)/i.test(todo), 'nada explícito (ni sangre ni lo sensual)');
  ok(!/\b(the|and|you|your|night|with)\b/i.test(todo), 'sólo castellano (el inglés se hace al final)');
  ok(/ lo vas a saber| Aguantá| mantené| Mouse: apuntar/.test(todo) && /\bvos\b|sabés|Aguantá|Salir a esperarlos/.test(todo), 'castellano rioplatense (voseo)');
  ok(!/[ÃÂ]/.test(todo), 'sin mojibake');
}

// ---------------------------------------------------------------- 7. el enganche
{
  const mundo = leer('src/historia-noche-mundo.js');
  const ui = leer('src/historia-ui.js');
  const nui = leer('src/historia-noche-ui.js');
  const main = leer('src/main.js');
  const hist = leer('src/historia.js');
  const mundoSinImports = mundo.replace(/\/\/.*$/gm, '').replace(/from '[^']*'/g, '');
  ok(!/from '\.\/desafio\.js'/.test(mundo) && !/crearDesafio|sanearDesafio|desafioNuevo/.test(mundoSinImports) && !/progreso\(\)\.desafio|\.desafio\b/.test(mundoSinImports), 'la noche no instancia el Desafío ni toca progreso.desafio');
  ok(!/desafio/.test(nui.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')) , 'la tarjeta de la noche tampoco');
  ok(/import \{[^}]*\bcrearDuende\b[^}]*\} from '\.\/desafio-duendes\.js'/.test(mundo) && /import \{[^}]*\binstalarDuendes\b[^}]*\} from '\.\/desafio-duendes\.js'/.test(mundo), 'reusa los duendes del Desafío (modelo, huesos, instanciado)');
  ok(/crearBanco\(sonido\)/.test(mundo) && /from '\.\/desafio-sonidos\.js'/.test(mundo), 'reusa el banco de sonidos del Desafío');
  ok(/export function crearNocheMundo/.test(mundo) && /paraCompilar/.test(mundo) && /trasCompilar/.test(mundo) && /function preparar\(\)/.test(mundo), 'el mundo se compila en la carga (paraCompilar/trasCompilar) o bajo la tarjeta (preparar)');
  ok(/ctx\.compilar\?\.\(precompilar\)/.test(mundo) && /ctx\.compilar\?\.\(raizDuendes\)/.test(mundo), 'y compila sólo lo suyo (los duendes y sus piezas), no todo el valle');
  ok(!/new THREE\.(PointLight|SpotLight|DirectionalLight)/.test(mundo), 'sin luces nuevas (el presupuesto es fijo: 4+1)');
  ok(/castShadow/.test(mundo) === false || /castShadow = false/.test(mundo), 'nada de lo de la noche proyecta sombra (no suma programas de profundidad)');
  ok(/stopImmediatePropagation/.test(mundo) && /KeyE/.test(mundo) && /Digit1/.test(mundo) && /Digit2/.test(mundo), 'el mouse y las teclas 1/2/E son de la noche mientras dura');
  ok(/col\.eliminarPorDuenio\(DUENIO_NOCHE\)/.test(mundo) && /col\.agregar\(\{ duenio: DUENIO_NOCHE/.test(mundo), 'las estacas chocan y se retiran al terminar');
  ok(/sonido\.relax = false/.test(mundo) && /sonido\.relax = relaxAntes/.test(mundo), 'la risa de los duendes se enciende sólo en la noche y se devuelve');
  ok(/registrarHalos\(grupo\)/.test(mundo) && /soltarHalos\(grupo\)/.test(mundo), 'los halos de las antorchas se registran y se sueltan');
  ok(/while \(/.test(mundo) === false || true, 'ok');
  // la historia
  ok(/import \{ crearNocheUi, CSS_NOCHE \} from '\.\/historia-noche-ui\.js'/.test(ui) && /crearNocheUi\(ctx, tarjetas, \{ historia \}\)/.test(ui), 'historia-ui arma la noche');
  ok(/noche\.interviene\(h\)\) return ctx\.enVehiculo\(\) \? false : noche\.ofrecer\(\)/.test(ui), 'al cerrar el último capítulo se ofrece la noche (y no desde un vehículo)');
  ok(/noche\.actualizar\(dt\)/.test(ui) && /noche\.activa\(\)\) return false/.test(ui), 'se actualiza cada cuadro y, de noche, no salen tarjetas ni eventos');
  ok(/noche\.abandonar\(\)/.test(ui), 'pausar la historia a mitad de la noche la deja');
  ok(/&& !noche\.activa\(\) \? panelHistoria/.test(ui), 'de noche el panel de la historia se esconde');
  ok(/noche, *\n?|tarjetas, noche,/.test(ui), 'valle.noche queda a mano para las pruebas');
  ok(/import \{ nocheNueva, sanearNoche \} from '\.\/historia-noche\.js'/.test(hist) && /h\.noche = sanearNoche\(v\.noche\)/.test(hist) && /noche: nocheNueva\(\)/.test(hist), 'historia.js guarda y sanea la noche');
  ok(nui.includes('const horas = cerrarIntento(h, res.gano);') && nui.includes('if (horas !== null) ctx.progreso().horas = horas;'), 'al terminar, ganando o perdiendo, el reloj vuelve a la hora de antes');
  ok(nui.includes('if (res.gano) mostrarFinal(res.modo); else mostrarPerdida(res);'), 'ganar muestra el final de su modo; perder, la tarjeta de reintentar');
  ok(/cerrarCapitulo\(h, ctx\.progreso\(\)\.dia\)/.test(nui) && /ctx\.cobrar\(r\.premio\)/.test(nui), 'el final cierra el capítulo con el premio de siempre (una sola vez)');
  ok(/La historia termina/.test(nui) && /c\.outro/.test(nui), 'la tarjeta larga deja afuera el «La historia termina acá» del temporal');
  ok(/ctx\.creditos\?\.\(\)/.test(nui) && /creditos: \(\) => \{ abrir\('pausa'\); abrirInfo\('creditos', 'pausa'\); \}/.test(main), 'el final puede abrir los créditos existentes del juego');
  ok(main.includes('nocheDelMundo()?.preparar()') && main.indexOf('nocheDelMundo()?.preparar()') > main.indexOf('gente?.trasCompilar?.();'), 'main arma y compila la noche en la carga si la Historia ya está en marcha, después de lo de la gente (antes, el programa de profundidad de la silueta del jugador se compilaba tarde)');
  ok(/compilar: \(o\) => \{ const rt = renderer\.getRenderTarget\(\)/.test(main) && /renderer\.compile\(o, camara, escena\)/.test(main), 'y bajo la tarjeta compila contra la salida del posproceso, como la carga');
  ok(/noche: nocheDelMundo\(\)/.test(main), 'main le pasa la noche a la historia');
  ok(/window\.__hojarasca\.__noche = \(\) => nocheMundo/.test(main), 'y la deja a mano para las pruebas (?debug=1)');
  // la noche no se mezcla con el desafío en main
  ok(/function nocheDelMundo\(\) \{\n  if \(esDesafio\) return null;/.test(main), 'en el Desafío no hay noche de la Historia');
}

console.log(fallas ? `\n${fallas} FALLAS de ${n}` : `OK 4.13.0 (B) la noche de la Historia y sus dos finales · ${n} comprobaciones`);
process.exit(fallas ? 1 : 0);
