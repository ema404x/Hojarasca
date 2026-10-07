// 3.7.5 (rincones): el enganche de los rincones con el juego (sólo en el Relax). Las reglas, en rincones.js, futbol.js,
// sulky.js y casa-propia.js; lo que se ve, en rincones-mundo.js. Acá:
//   · lo que hace E y lo que dice el aviso (la misma función, `accion(js)`, como granja-juego.js; y `urgente(js)`, lo
//     que gana hasta a hablar con alguien: bajar del sulky y patear la pelota en un partido);
//   · el partido en el potrero: los chicos y los vecinos que juegan (los toma como `conVos`, como amor-mundo.js, y los
//     suelta al terminar), la pelota, los goles;
//   · el sulky: subir, andar solo por el camino (W al trote, Shift al galope, S al paso), bajar; el zaino atado;
//   · la función de títeres (los chicos se juntan adelante del retablo), las huertas, el fuerte, el campamento, el
//     atril, los duendes, la casa y el taller;
//   · la charla: lo que te enseñan los amigos, el sulky que te hace Tito y la pista de los duendes de la abuela
//     (`opciones` y `elegir`, como la granja);
//   · `destino(k)`: a dónde va cada vecino cuando un rincón lo llama (los chicos, a la función de títeres).
// `ctx`: { progreso(), ajustes(), desafio(), mundo (rincones-mundo.js), jugador() → el jugador (con `estado`),
//   aldeaGente() → aldea-gente.js, nota(t, sub, nueva), guardar(), refrescarBarra(), registrar(id), sumarEntrada(k, n),
//   sumarMaterial(k, n), sumarCosa(k, n), cantidad(tipo, k), amistades() → { clave: nivel }, nivel(clave), hijos() →
//   [{ nombre, etapa }], dormir(), refrescarHuerta(), anotaciones() (las del cuaderno), noche() (0..1), tieneCaballo(),
//   caballo() → { x, z, yaw } (donde espera), dejarCaballo(x, z, yaw), sonido, fundido(fn) }
import { RINCONES, LUGARES_RINCONES, lugarEnMundo, sanearRincones, encontrarDuende, encontrado, textoDuende, duendesEncontrados, pistaDuende, tallaEnLaPlaza, textoAtril, dejarCuaderno, leyeronCuaderno, MANUALIDADES, MAESTROS, puedeAprender, aprender, tallerArmado, manualidadesDeHoy, hacerManualidad, adornosDelEstante, estadoCantero, textoCanteroRincon, trabajarCantero, sembrarVecinos, horaDeHuerta, horaDeTiteres, funcionHoy, darFuncion, textoFuerte, trabajarFuerte, fuerteTerminado, hijosParaAcampar, puedeAcampar, acampar, anotarGol, empezarPartido, horaDePartido, elegirJugadores, JUGADORES_POTRERO } from './rincones.js';
import { CANCHA, PATADA, pelotaNueva, sacar, patear, pasoPelota, pensarJugador, patadaDe, alAlcance, saqueDespues } from './futbol.js';
import { SULKY, tieneSulky, pedirSulky, caminoArreglado, hacerMinga, velocidadSulky, andarSulky, enCamino, masCercano } from './sulky.js';
import { CASA_PROPIA, etapaCasa, casaTerminada, pedirLote, aportarCasa, textoCasa, adentroDeCasa, loteEnMundo } from './casa-propia.js';
import { DUENDES } from './rincones-cuaderno.js';
import { SERVICIO, esVecinoAldea, esPobladorAldea } from './aldea.js';
import { sumarAmistadDe, amistades, nivelDe } from './vecindad.js';
import { hijosDe } from './amor.js';
import { cumplirDeseo } from './vecindad-social.js';

const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const NOMBRE_DE = { nene: 'Nahuel', nena: 'Lucía', andinista: 'Rocío', padre: 'Mario', carpintero: 'Tito', pescador: 'Aurelio', fotografa: 'Sofía', botera: 'Martina', maestra: 'Delia', madre: 'Gladys', abuela: 'Herminia' };
const MATERIAL = { tabla: 'tablas', tronco: 'troncos', piedra: 'piedras', lana: 'vellones' };

export function crearRinconesJuego(ctx) {
  const progreso = () => ctx.progreso();
  const activo = () => !ctx.desafio?.();
  const dia = () => Math.max(1, Math.floor(Number(progreso().dia) || 1));
  const horas = () => Number(progreso().horas) || 0;
  function r() {
    const p = progreso();
    if (!p.rincones || typeof p.rincones !== 'object' || !p.rincones.duendes) p.rincones = sanearRincones(p.rincones, p.dia);
    return p.rincones;
  }
  const tengo = (tipo, k) => Number(ctx.cantidad?.(tipo, k)) || 0;
  const aplicar = (efectos) => {
    for (const e of efectos || []) {
      if (e.tipo === 'material') ctx.sumarMaterial?.(e.k, e.n);
      else if (e.tipo === 'entrada') ctx.sumarEntrada?.(e.k, e.n);
      else if (e.tipo === 'cosa') ctx.sumarCosa?.(e.k, e.n);
      else if (e.tipo === 'filo') { const a = progreso().aldea; if (a) a.afilado = SERVICIO.filo; }
    }
    ctx.refrescarBarra?.();
  };
  const amistad = (k, n) => { try { sumarAmistadDe(progreso(), k, n, dia()); } catch (e) { /* (un vecino que no está en esta partida) */ } };
  const amistadesYa = () => { try { return amistades(progreso()) || {}; } catch (e) { return {}; } };
  const nivelYa = (k) => { try { return nivelDe(k, progreso()); } catch (e) { return 'conocido'; } };
  const hijosYa = () => { try { return hijosDe(progreso(), dia()) || []; } catch (e) { return []; } };
  const npcDe = (k) => { const ag = ctx.aldeaGente?.(); return ag?.personas?.get(k)?.npc || null; };
  const amigosEnLaAldea = () => Object.entries(amistadesYa() || {}).filter(([k, n]) => (n === 'amigo' || n === 'compadre') && (esVecinoAldea(k) || esPobladorAldea(k))).length;

  // ================================================================ el partido
  let partido = null;   // { pelota, jugadores: [{ clave, npc, equipo, rol, chico, enfria }], goles: [0, 0], desde, mundoPot, quieta }
  const potrero = () => ctx.mundo?.potrero?.();
  function enLaCancha(pos, margen = 3) {
    const P = potrero();
    if (!P?.aCancha) return false;
    const c = P.aCancha(pos.x, pos.z);
    return Math.abs(c.u) < CANCHA.ancho / 2 + margen && Math.abs(c.v) < CANCHA.largo / 2 + margen;
  }
  function empezar() {
    const P = potrero(); if (!P) return false;
    const ag = ctx.aldeaGente?.();
    const presentes = ag ? [...ag.personas.keys()].filter((k) => JUGADORES_POTRERO.includes(k)) : [];
    // los que pueden: los que no están con vos en otra cosa (de visita, en una cita, durmiendo)
    const libres = presentes.filter((k) => { const n = ag.figura?.(k) || npcDe(k); return n && !n.deVisita && !n.conVos && !n.enCita && !(horas() >= 21 || horas() < 7); });
    const elegidos = elegirJugadores(libres, 3);
    if (!elegidos.length) { ctx.nota?.('No hay con quién jugar', 'Los chicos están en la escuela o en sus casas. Probá a la tarde'); return false; }
    const jugadores = [];
    elegidos.forEach((k, i) => {
      const n = ag.figura?.(k) || npcDe(k);
      if (!n) return;
      // los equipos: los chicos uno en cada lado; vos con el primero
      const equipo = i === 0 ? 0 : i === 1 ? 1 : 1;
      const rol = i === 2 ? 'arquero' : 'campo';
      n.conVos = true; n.enCita = true; n.pose = null; n.asiento = undefined; n.soloCerca = 0; n.dormido = false; n.charlaVecinos = false;
      // el que está lejos de la cancha llega corriendo desde el borde (si estás mirando) o ya está
      const lado = (equipo === 0 ? -1 : 1) * (3 + i), w = P.aMundo(CANCHA.ancho / 2 + 1.5, lado);
      if (Math.hypot(n.pos.x - w.x, n.pos.z - w.z) > 35) { n.pos.x = w.x; n.pos.z = w.z; n.pos.y = P.centro.y + P.piso(CANCHA.ancho / 2 + 1.5, lado); }
      jugadores.push({ clave: k, npc: n, equipo, rol, chico: k === 'nene' || k === 'nena', enfria: 0 });
    });
    partido = { pelota: pelotaNueva(0, 0), jugadores, goles: [0, 0], desde: performance.now(), t: 0, ultimoToque: null };
    empezarPartido(r(), dia());
    ctx.registrar?.('potrero');
    const nombres = jugadores.map((j) => NOMBRE_DE[j.clave] || j.clave);
    ctx.nota?.('¡Picado en el potrero!', `Juegan ${nombres.join(', ')}. Vos atacás al arco del fondo: E patea fuerte, caminando la llevás. A dos goles`, true);
    ctx.guardar?.();
    return true;
  }
  function terminar(motivo = '') {
    if (!partido) return;
    for (const j of partido.jugadores) {
      const n = j.npc;
      n.conVos = false; n.enCita = false; n.camino = []; n.velocidad = 0.85; n.pose = null;
      amistad(j.clave, 3);
      // ¿era su deseo jugar a la pelota?
      try { const c = cumplirDeseo(j.clave, progreso(), { tipo: 'interaccion', id: 'pelota' }, dia()); if (c?.ok) ctx.nota?.(`${NOMBRE_DE[j.clave] || j.clave} quería jugar a la pelota`, c.renglon || '', false); } catch (e) { /* nada */ }
    }
    const [a, b] = partido.goles;
    if (motivo !== 'silencio') ctx.nota?.(a > b ? 'Ganaron ustedes' : a < b ? 'Perdieron, pero se rieron' : 'Empate', `${a} a ${b}${motivo ? ` · ${motivo}` : ''}`, true);
    partido = null;
    ctx.guardar?.();
  }
  function patearPelota(js, fuerte) {
    if (!partido) return false;
    const P = potrero(), c = P.aCancha(js.pos.x, js.pos.z), p = partido.pelota;
    if (!alAlcance(c, p, fuerte ? PATADA.alcance + 0.35 : PATADA.toque + 0.15)) return false;
    // hacia donde mirás (la cámara), llevado al marco de la cancha
    const fx = -Math.sin(js.yaw || 0), fz = -Math.cos(js.yaw || 0);
    const a = P.aCancha(js.pos.x + fx, js.pos.z + fz), dir = { u: a.u - c.u, v: a.v - c.v };
    patear(p, dir, fuerte ? PATADA.fuerte : PATADA.suave * 0.55, fuerte ? Math.max(0, -(js.pitch || 0)) * 0.6 + 0.08 : 0);
    partido.ultimoToque = 'vos';
    if (fuerte) ctx.sonido?.paso?.('madera', 0.6);
    return true;
  }
  function actualizarPartido(dt) {
    if (!partido) return;
    const P = potrero(), js = ctx.jugador?.()?.estado;
    if (!P || !js) { terminar('silencio'); return; }
    if (!enLaCancha(js.pos, 14) || horas() >= 21) { terminar('se terminó el picado'); return; }
    partido.t += dt;
    const p = partido.pelota;
    // vos: si la tocás caminando, la llevás
    const c = P.aCancha(js.pos.x, js.pos.z);
    if ((js.velocidadActual || 0) > 0.8 && alAlcance(c, p, PATADA.toque) && p.y < 0.3) {
      const yaw = js.yaw || 0, a = P.aCancha(js.pos.x - Math.sin(yaw), js.pos.z - Math.cos(yaw));
      patear(p, { u: a.u - c.u, v: a.v - c.v }, Math.min(PATADA.suave, (js.velocidadActual || 0) * 1.25 + 1.2), 0);
      partido.ultimoToque = 'vos';
    }
    // los que juegan
    const azar = Math.random;
    for (const j of partido.jugadores) {
      const n = j.npc;
      if (!n) continue;
      const pos = P.aCancha(n.pos.x, n.pos.z);
      j.u = pos.u; j.v = pos.v;
      const plan = pensarJugador(j, p, azar);
      j.enfria = Math.max(0, j.enfria - dt);
      if (plan.patear && j.enfria <= 0 && p.enJuego) {
        const k = patadaDe(j, p, azar);
        patear(p, k.dir, k.fuerza, k.alto);
        j.enfria = 0.9 + azar() * 0.6;
        partido.ultimoToque = j.clave;
        n.gesto = 'patear';
      }
      const w = P.aMundo(plan.u, plan.v), d = Math.hypot(w.x - n.pos.x, w.z - n.pos.z);
      n.camino = d > 0.25 ? [{ x: w.x, z: w.z, cerca: 0.2 }] : [];
      n.velocidad = Math.min(plan.velocidad, 0.6 + d * 1.6);
      n.miraFinal = Math.atan2(P.aMundo(p.u, p.v).x - n.pos.x, P.aMundo(p.u, p.v).z - n.pos.z);
      n.dormido = false; n.conVos = true; n.enCita = true; n.pose = null;
    }
    const res = pasoPelota(p, dt, (u, v) => P.piso(u, v));
    if (res.pique > 2) ctx.sonido?.paso?.('tierra', Math.min(0.5, res.pique / 12));
    if (res.gol !== null) {
      // el arco 1 es el de ustedes al atacar (tu equipo es el 0)
      const nuestro = res.gol === 1;
      partido.goles[nuestro ? 0 : 1]++;
      anotarGol(r(), dia(), nuestro);
      if (nuestro && partido.ultimoToque === 'vos') {
        if (!progreso().entradas?.['gol-potrero']) ctx.registrar?.('gol-potrero');
        ctx.nota?.('¡Gooool!', `Lo metiste vos. Van ${partido.goles[0]} a ${partido.goles[1]}`, true);
      } else ctx.nota?.(nuestro ? '¡Gol de ustedes!' : 'Gol de ellos', `Van ${partido.goles[0]} a ${partido.goles[1]}`, false);
      ctx.sonido?.campana?.();
      if (Math.max(...partido.goles) >= 2) { terminar(); return; }
      setTimeout(() => { if (partido) saqueDespues(partido.pelota, 'gol'); }, 1200);
    } else if (res.afuera) {
      setTimeout(() => { if (partido) saqueDespues(partido.pelota, 'afuera'); }, 700);
    }
  }

  // ================================================================ la función de títeres
  let funcion = null;   // { hasta, obra, i, proximo, chicos: [npc] }
  function empezarFuncion() {
    const res = darFuncion(r(), dia(), horas());
    if (!res.ok) return false;
    const L = lugarEnMundo('retablo');
    const ag = ctx.aldeaGente?.();
    const chicos = [];
    for (const k of ['nene', 'nena']) {
      const n = ag?.figura?.(k) || npcDe(k);
      if (!n || n.deVisita || n.conVos) continue;
      // adelante del retablo, mirándolo
      const fx = Math.sin(L.rotMundo), fz = Math.cos(L.rotMundo), sx = Math.cos(L.rotMundo), sz = -Math.sin(L.rotMundo), lado = k === 'nene' ? -0.6 : 0.6;
      const x = L.x + fx * 2.6 + sx * lado, z = L.z + fz * 2.6 + sz * lado;
      if (Math.hypot(n.pos.x - x, n.pos.z - z) > 40) { n.pos.x = x; n.pos.z = z; n.pos.y = ctx.altura?.(x, z) ?? n.pos.y; }
      n.conVos = true; n.enCita = true; n.pose = null; n.dormido = false; n.charlaVecinos = false;
      n.camino = [{ x, z, cerca: 0.15 }]; n.velocidad = 1.6; n.miraFinal = Math.atan2(L.x - x, L.z - z);
      chicos.push({ k, n });
    }
    funcion = { hasta: performance.now() + 26000, obra: res.obra, i: 0, proximo: 0, chicos };
    ctx.nota?.(`Función de títeres: «${res.obra.titulo}»`, chicos.length ? 'Los chicos se sientan adelante del retablo' : 'Para los que pasan por la plaza', true);
    ctx.registrar?.('titeres');
    ctx.guardar?.();
    return true;
  }
  function actualizarFuncion() {
    if (!funcion) return;
    const ahora = performance.now();
    if (ahora >= funcion.proximo && funcion.i < funcion.obra.renglones.length) {
      ctx.nota?.(funcion.obra.renglones[funcion.i], '', false);
      funcion.i++; funcion.proximo = ahora + 7000;
    }
    for (const c of funcion.chicos) { c.n.conVos = true; c.n.enCita = true; if (!c.n.camino?.length) c.n.gesto = Math.sin(ahora / 300 + (c.k === 'nene' ? 0 : 1)) > 0.6 ? 'risa' : null; }
    if (ahora >= funcion.hasta) {
      for (const c of funcion.chicos) { c.n.conVos = false; c.n.enCita = false; c.n.camino = []; c.n.gesto = null; amistad(c.k, 4); }
      amistad('maestra', 2);
      ctx.nota?.('Aplausos en la plaza', 'Los chicos piden otra para mañana', false);
      funcion = null;
    }
  }

  // ================================================================ el sulky
  let viaje = null;   // { s, v, sentido }
  const camino = () => ctx.mundo?.camino?.() || null;
  const sk = () => r().sulky;
  const tiene = () => activo() && tieneSulky(sk(), dia(), horas());
  // la `s` del sulky estacionado (0 en el refugio, largo en la aldea, o donde lo dejaste)
  function sEstacionado() {
    const C = camino(); if (!C) return 0;
    const s = sk();
    if (Number.isFinite(s.s)) return Math.max(0, Math.min(C.largo, s.s));
    return s.donde === 'aldea' ? C.largo : 0;
  }
  // la pose del sulky (y su sentido: mira para el lado al que va a ir)
  function poseSulky() {
    const C = camino(); if (!C || !tiene()) return null;
    const s = viaje ? viaje.s : sEstacionado();
    const sentido = viaje ? viaje.sentido : s > C.largo / 2 ? -1 : 1;
    const p = enCamino(C, s);
    return { x: p.x, z: p.z, rumbo: sentido > 0 ? p.rumbo : p.rumbo + Math.PI, v: viaje ? viaje.v : 0, s, sentido };
  }
  // el zaino atado: delante del sulky, entre las varas
  function caballoAtado() {
    if (!tiene() || !sk().atado) return null;
    const js = ctx.jugador?.()?.estado;
    if (js?.montado) return null;
    const p = poseSulky(); if (!p) return null;
    return { x: p.x + Math.sin(p.rumbo) * 3.25, z: p.z + Math.cos(p.rumbo) * 3.25, yaw: p.rumbo };
  }
  function asiento(p) { return { x: p.x - Math.sin(p.rumbo) * 0.05, z: p.z - Math.cos(p.rumbo) * 0.05 }; }
  function subirSulky() {
    const js = ctx.jugador?.()?.estado, C = camino();
    if (!js || !C) return false;
    const p = poseSulky();
    if (!sk().atado) {
      // el zaino tiene que estar cerca para atarlo
      const c = ctx.caballo?.();
      if (!ctx.tieneCaballo?.() || !c || Math.hypot(c.x - p.x, c.z - p.z) > 30) { ctx.nota?.('Falta el zaino', 'Traelo hasta el sulky (o dejalo cerca) para atarlo a las varas'); return false; }
      sk().atado = true;
    }
    viaje = { s: p.s, v: 0, sentido: p.sentido };
    js.enSulky = true; js.sentado = false; js.agachado = false;
    const a = asiento(p);
    js.pos.x = a.x; js.pos.z = a.z;
    js.yaw = p.rumbo + Math.PI;   // (el jugador mira hacia −Z: mirando para adelante)
    ctx.registrar?.('sulky'); ctx.registrar?.('camino-aldea');
    ctx.nota?.('Arriba del sulky', `El zaino conoce el camino${p.sentido > 0 ? ' a la aldea' : ' al refugio'}. W al trote, Shift al galope, S despacio. E para bajarte`, true);
    return true;
  }
  function bajarSulky(llegada = false) {
    const js = ctx.jugador?.()?.estado;
    if (!js?.enSulky) return false;
    const C = camino(), p = poseSulky();
    js.enSulky = false;
    // se baja por el costado izquierdo
    const sx = Math.cos(p.rumbo), sz = -Math.sin(p.rumbo);
    js.pos.x = p.x - sx * 1.25; js.pos.z = p.z - sz * 1.25;
    js.velocidadActual = 0;
    const s = sk();
    if (llegada || p.s <= 0.5 || p.s >= C.largo - 0.5) { s.donde = p.s > C.largo / 2 ? 'aldea' : 'refugio'; delete s.s; }
    else { s.s = p.s; s.donde = 'camino'; }
    const c = caballoAtado();
    if (c) ctx.dejarCaballo?.(c.x, c.z, c.yaw);
    viaje = null;
    if (llegada) ctx.nota?.(s.donde === 'aldea' ? 'Llegaste a la aldea' : 'Llegaste al refugio', 'El zaino queda atado al sulky', true);
    else ctx.nota?.('Bajaste del sulky', 'Queda acá, con el zaino atado', false);
    ctx.guardar?.();
    return true;
  }
  // lo llama jugador.js cada cuadro, arriba del sulky (`tecla(code)`: lo que está apretado)
  function alSulky(dt, tecla) {
    const js = ctx.jugador?.()?.estado, C = camino();
    if (!js || !C || !viaje) { if (js) js.enSulky = false; viaje = null; return; }
    const marcha = tecla?.('KeyS') ? 'paso' : tecla?.('ShiftLeft') || tecla?.('ShiftRight') ? 'galope' : 'trote';
    const parar = tecla?.('KeyS') && viaje.v < 0.6;
    const objetivo = parar ? 0 : velocidadSulky(marcha, caminoArreglado(r().camino));
    const res = andarSulky(viaje, dt, objetivo, C.largo);
    const p = poseSulky(), a = asiento(p);
    const enPuente = (ctx.mundo?.puentes?.() || []).find((b) => Math.hypot(p.x - b.x, p.z - b.z) < b.largo / 2 + 0.3);
    const y = Math.max(ctx.altura(a.x, a.z), enPuente ? enPuente.alto : -Infinity);
    js.pos.set(a.x, y + 0.42, a.z);
    js.velocidadActual = res.v;
    if (res.llego) bajarSulky(true);
  }

  // ================================================================ lo de todos los días
  let relojDia = 0;
  // (cada cosa, una vez por día y a su hora: lo que se vio antes de la hora se vuelve a mirar)
  const vistoHoy = new Map();
  const unaVez = (k, d) => { if (vistoHoy.get(k) === d) return false; vistoHoy.set(k, d); return true; };
  function alDia() {
    const d = dia(), h = horas(), R = r();
    // los vecinos siembran la huerta de todos (un cantero por mañana)
    if (h >= 7 && unaVez('siembra', d) && sembrarVecinos(R, d)) refrescarMatas();
    // la talla, el día que la pone Tito
    if (R.talla && tallaEnLaPlaza(R, d, h) && !progreso().entradas?.['talla-propia'] && unaVez('talla', d)) ctx.nota?.('Tito terminó tu talla', 'Está en la plaza, al lado del duende viejo', true);
    // la copia del cuaderno: cada día alguno la lee
    if (R.cuaderno) R.lecturas = leyeronCuaderno(R, d);
    // la casa: a la mañana del día en que está
    const c = R.casa;
    if (c?.estado === 'lista' && casaTerminada(c, d, h) && !progreso().entradas?.['casa-propia'] && unaVez('casa', d)) ctx.nota?.('Tu casa está terminada', 'En la calle de la Loma. Los vecinos te dejaron la estufa prendida', true);
    // el sulky, la mañana que Tito lo trae
    const s = R.sulky;
    if (s?.listo && tieneSulky(s, d, h) && !s.avisado) { s.avisado = true; s.atado = false; ctx.nota?.('Tito te trajo el sulky', 'Está al lado del palenque del refugio. Atale el zaino y subí con E', true); }
  }

  // ================================================================ E y el aviso
  const radio = { duende: RINCONES.radioDuende, cantero: 1.7, retablo: 2.6, atril: 1.4, fuerte: 3.2, campamento: 2.6, casa: 5.8, taller: 1.6, sulky: SULKY.radioSubir };
  // Lo urgente (antes que hablar con alguien): bajar del sulky, patear en el partido
  function urgente(js) {
    if (!activo() || !js) return null;
    if (js.enSulky) return { tipo: 'sulky', texto: 'Bajar del sulky', hacer: () => bajarSulky(false) };
    if (partido && !js.montado) {
      const P = potrero(), p = partido.pelota;
      if (P && alAlcance(P.aCancha(js.pos.x, js.pos.z), p, PATADA.alcance + 0.35)) return { tipo: 'patear', texto: 'Patear la pelota', hacer: () => patearPelota(js, true) };
    }
    return null;
  }
  // Un duende tallado (el más cercano, a menos de 1,8 m). Va al último en la E y en el aviso (main.js): una obra tuya,
  // una puerta o el perro le ganan
  function accionDuende(js) {
    if (!activo() || !js || js.enSulky || js.montado || js.enTren || js.enKayak || !ctx.mundo) return null;
    const R = r(), pos = js.pos;
    for (const q of ctx.mundo.duendes()) {
      if (Math.abs(q.y - pos.y) > 2.2 || dist(q, pos) > radio.duende) continue;
      if (encontrado(R, q.id)) return { tipo: 'duende', texto: textoDuende(R, q.id), hacer: () => ctx.nota?.(DUENDES.find((x) => x.id === q.id)?.nombre || 'Un duende', `Ya lo anotaste. Llevás ${duendesEncontrados(R)} de 12`) };
      return { tipo: 'duende', texto: textoDuende(R, q.id), hacer: () => anotarDuende(q.id) };
    }
    return null;
  }
  function accion(js) {
    if (!activo() || !js || js.enSulky || js.montado || js.enTren || js.enKayak) return null;
    const R = r(), d = dia(), h = horas(), pos = js.pos;
    const M = ctx.mundo;
    if (!M) return null;
    // el sulky (estacionado, para subir)
    if (tiene() && !partido) {
      const p = poseSulky();
      if (p && dist(asiento(p), pos) < radio.sulky) return { tipo: 'sulky', texto: sk().atado || ctx.tieneCaballo?.() ? (p.sentido > 0 ? 'Subir al sulky (a la aldea)' : 'Subir al sulky (al refugio)') : 'El sulky (falta el zaino)', hacer: () => subirSulky() };
    }
    // el potrero: armar un picado
    if (!partido && enLaCancha(pos, 1.5) && horaDePartido(h)) return { tipo: 'potrero', texto: 'Armar un picado con los chicos', hacer: () => empezar() };
    // las huertas
    const H = M.huertas();
    for (const [tipo, lista] of [['huerta', H.comunitaria], ['chicos', H.chicos]]) for (const k of lista) {
      if (dist(k, pos) > radio.cantero) continue;
      if (!horaDeHuerta(tipo === 'chicos' ? 'chicos' : 'huerta', h)) return { tipo: 'cantero', texto: tipo === 'chicos' ? 'La huerta de los chicos (la trabajan a la tarde, después de la escuela)' : 'La huerta de todos (se trabaja de día)', hacer: () => {} };
      const e = estadoCantero(R, tipo, k.i, d);
      return { tipo: 'cantero', texto: textoCanteroRincon(R, tipo, k.i, d), hacer: () => (e.estado !== 'vacio' && e.estado !== 'listo' && e.trabajadoHoy ? null : trabajarHuerta(tipo, k.i)) };
    }
    // el retablo
    const ret = M.lugar('retablo');
    if (ret && dist(ret, pos) < radio.retablo) {
      if (funcion) return { tipo: 'titeres', texto: 'La función está en curso', hacer: () => {} };
      if (funcionHoy(R, d)) return { tipo: 'titeres', texto: 'El retablo (hoy ya diste la función)', hacer: () => {} };
      if (horaDeTiteres(h)) return { tipo: 'titeres', texto: 'Dar una función de títeres', hacer: () => empezarFuncion() };
      return { tipo: 'titeres', texto: 'El retablo de títeres (las funciones, a la tardecita)', hacer: () => {} };
    }
    // el atril de la biblioteca
    const atril = M.lugar('atril');
    if (atril && dist(atril, pos) < radio.atril && Math.abs(atril.y - pos.y) < 1.5) {
      const t = textoAtril(R, ctx.anotaciones?.() || 0, d);
      if (t) return { tipo: 'atril', texto: t, hacer: () => usarAtril() };
    }
    // el fuerte y el campamento
    const fu = M.lugar('fuerte');
    if (fu && dist(fu, pos) < radio.fuerte) {
      const t = textoFuerte(R, d, h, tengo);
      if (t) return { tipo: 'fuerte', texto: t, hacer: () => trabajarElFuerte() };
    }
    const ca = M.lugar('campamento');
    if (ca && dist(ca, pos) < radio.campamento && fuerteTerminado(R) && puedeAcampar(R, hijosYa() || [], d, h)) {
      return { tipo: 'campamento', texto: `Acampar con ${hijosParaAcampar(hijosYa() || []).map((x) => x.nombre).join(' y ')}`, hacer: () => acamparYa() };
    }
    // tu casa: el lote, la obra, dormir adentro
    const L = loteEnMundo();
    if (dist(L, pos) < radio.casa) {
      const c = R.casa;
      if (casaTerminada(c, d, h)) {
        if (adentroDeCasa(pos.x, pos.z) && (h >= 20 || h < 6)) return { tipo: 'casa', texto: 'Dormir en tu casa', hacer: () => ctx.dormir?.() };
      } else {
        const t = textoCasa(c, d, h, amigosEnLaAldea());
        if (t) return { tipo: 'casa', texto: t, hacer: () => usarLote() };
      }
    }
    // el taller del refugio
    const ts = M.taller();
    if (ts && tallerArmado(R) && dist(ts, pos) < radio.taller && Math.abs(ts.y - pos.y) < 1.6) {
      const lista = manualidadesDeHoy(R, tengo, d), sig = lista.find((m) => m.puede);
      if (sig) return { tipo: 'taller', texto: `${sig.titulo} en tu taller`, hacer: () => trabajarEnTaller(sig.id) };
      const falta = lista.find((m) => !m.hecha && m.falta);
      return { tipo: 'taller', texto: falta ? `${falta.titulo}: falta${falta.falta.n > 1 ? 'n' : ''} ${falta.falta.n} ${MATERIAL[falta.falta.k] || falta.falta.k.replace('-', ' ')}` : 'El taller: por hoy hiciste todo', hacer: () => {} };
    }
    return null;
  }

  // ---------------------------------------------------------------- lo que hace cada cosa
  function anotarDuende(id) {
    const R = r(), res = encontrarDuende(R, id, dia());
    if (!res.ok) return;
    ctx.registrar?.(id);
    const d = DUENDES.find((q) => q.id === id);
    if (res.todos) {
      ctx.registrar?.('duendes-todos');
      ctx.nota?.('¡Los doce duendes!', 'La abuela dice que quedaste en la leyenda. Tito va a tallar tu figura para la plaza', true);
    } else ctx.nota?.(`Encontraste ${d.nombre.charAt(0).toLowerCase()}${d.nombre.slice(1)}`, `Llevás ${res.cuantos} de 12. Está en el cuaderno`, true);
    ctx.guardar?.();
  }
  function trabajarHuerta(tipo, i) {
    const res = trabajarCantero(r(), tipo, i, dia());
    if (!res.ok) { if (res.motivo === 'hoy ya') ctx.nota?.('Hoy ya la trabajaste', 'Mañana otra vez'); return; }
    aplicar(res.da);
    ctx.registrar?.(tipo === 'chicos' ? 'huerta-chicos' : 'huerta-comunitaria');
    if (tipo === 'chicos') { amistad('nene', 2); amistad('nena', 2); } else amistad('madre', 2);
    ctx.nota?.(res.texto, res.da.length ? `${res.da.map((x) => `+${x.n}`).join(', ')} en la mochila` : '', res.que === 'cosechar');
    refrescarMatas();
    ctx.guardar?.();
  }
  function usarAtril() {
    const R = r();
    if (R.cuaderno) {
      const n = leyeronCuaderno(R, dia());
      ctx.nota?.('Tu cuaderno, en el atril', n ? `Lo leyeron ${n === 1 ? 'un vecino' : `${n} vecinos`}. Alguien dejó una flor seca entre las páginas` : 'Todavía nadie lo leyó: la abuela dice que los domingos se va a leer en voz alta');
      return;
    }
    const res = dejarCuaderno(R, ctx.anotaciones?.() || 0, dia());
    if (!res.ok) return;
    ctx.registrar?.('cuaderno-biblioteca');
    ctx.nota?.('Dejaste una copia de tu cuaderno', 'La abuela y los chicos la pasaron en limpio. Queda en el atril de la biblioteca, para todos', true);
    amistad('abuela', 5);
    ctx.guardar?.();
  }
  function trabajarElFuerte() {
    const res = trabajarFuerte(r(), dia(), horas(), tengo);
    if (!res.ok) {
      if (res.motivo === 'falta') ctx.nota?.('Faltan troncos', `Para el fuerte hacen falta ${res.falta.n} troncos`);
      return;
    }
    aplicar(res.efectos);
    amistad('nene', 3); amistad('nena', 3);
    if (res.terminado) ctx.registrar?.('fuerte-bosque');
    ctx.nota?.(res.texto, res.terminado ? 'Los chicos ya tienen su fuerte' : 'Mañana otra etapa (los chicos te esperan)', true);
    ctx.guardar?.();
  }
  function acamparYa() {
    const res = acampar(r(), hijosYa() || [], dia(), horas());
    if (!res.ok) return;
    ctx.registrar?.('campamento');
    ctx.nota?.(res.texto, 'Fogón, carpa y estrellas entre las copas', true);
    ctx.guardar?.();
    ctx.dormir?.({ campamento: true });
  }
  function usarLote() {
    const c = r().casa;
    if (c.estado === 'libre') {
      const res = pedirLote(c, amigosEnLaAldea(), dia());
      if (!res.ok) { ctx.nota?.('El lote todavía no', `Con ${CASA_PROPIA.amigos} amigos en la aldea, la aldea te lo da (te faltan ${res.faltan || 0})`); return; }
      ctx.nota?.('El lote es tuyo', `Para la casa hacen falta ${CASA_PROPIA.pide.tabla} tablas, ${CASA_PROPIA.pide.tronco} troncos y ${CASA_PROPIA.pide.piedra} piedras. Traé lo que tengas`, true);
      ctx.guardar?.();
      return;
    }
    if (c.estado === 'obra') {
      const res = aportarCasa(c, (k) => tengo('material', k), dia());
      if (!res.ok) { ctx.nota?.('No tenés material', 'Hacen falta tablas, troncos y piedras'); return; }
      aplicar(res.efectos);
      const puso = Object.entries(res.puso).map(([k, n]) => `${n} ${MATERIAL[k] || k}`).join(', ');
      ctx.nota?.(res.completa ? 'Está todo el material' : 'Dejaste material en el lote', res.completa ? 'Los vecinos la levantan: mañana a la mañana está tu casa' : `Pusiste ${puso}`, true);
      ctx.guardar?.();
    }
  }
  function trabajarEnTaller(id) {
    const res = hacerManualidad(r(), id, tengo, dia());
    if (!res.ok) return;
    aplicar(res.efectos.filter((e) => e.tipo !== 'adorno'));
    const m = MANUALIDADES[id];
    ctx.nota?.(res.texto, `Lo que te enseñó ${NOMBRE_DE[m.maestro] || ({ panadera: 'Rosa', herrero: 'Anselmo', tejedora: 'Elvira', herbolaria: 'Inés', ceramista: 'Malena', pintora: 'Abril' })[m.maestro] || 'un amigo'}`, true);
    ctx.sonido?.paso?.('madera', 0.5);
    ctx.guardar?.();
  }

  // ================================================================ la charla (lo que te enseñan, el sulky, la pista)
  const QUIEN = { panadera: 'Rosa', madre: 'Gladys', herrero: 'Anselmo', tejedora: 'Elvira', carpintero: 'Tito', herbolaria: 'Inés', ceramista: 'Malena', pintora: 'Abril' };
  function opciones(clave) {
    if (!activo()) return [];
    const R = r(), lista = [];
    const id = puedeAprender(R, clave, nivelYa(clave));
    if (id) lista.push({ id: `rincones:aprender:${id}`, titulo: MANUALIDADES[id].pedir });
    if (clave === 'carpintero' && !R.sulky.pedido && ctx.tieneCaballo?.()) lista.push({ id: 'rincones:sulky', titulo: `Pedirle un sulky (${SULKY.pide.tabla} tablas y ${SULKY.pide.tronco} troncos)` });
    if (clave === 'abuela' && duendesEncontrados(R) < 12) lista.push({ id: 'rincones:pista', titulo: 'Preguntarle por los duendes tallados' });
    return lista;
  }
  function elegir(s, id) {
    if (!activo()) return { tipo: 'menu' };
    const R = r();
    if (id.startsWith('rincones:aprender:')) {
      const m = id.slice('rincones:aprender:'.length);
      if (!MANUALIDADES[m] || MAESTROS[s.clave] !== m) return { tipo: 'menu' };
      const res = aprender(R, m, dia());
      if (!res.ok) return { tipo: 'menu' };
      ctx.nota?.(`${QUIEN[s.clave] || 'Tu amigo'} te enseñó: ${MANUALIDADES[m].titulo.toLowerCase()}`, res.primera ? 'Te armaste un banco de trabajo al lado del refugio: ahí lo hacés' : 'Lo hacés en tu taller del refugio, una vez por día', true);
      if (res.primera) ctx.registrar?.('taller-refugio');
      amistad(s.clave, 4);
      ctx.guardar?.();
      return { tipo: 'renglones', renglones: res.renglones };
    }
    if (id === 'rincones:sulky') {
      const res = pedirSulky(R.sulky, tengo, dia(), ctx.tieneCaballo?.());
      if (!res.ok) {
        if (res.motivo === 'falta') return { tipo: 'renglones', renglones: [`Te lo hago con gusto, pero traeme ${SULKY.pide.tabla} tablas y ${SULKY.pide.tronco} troncos. Las ruedas las saco de lo mío.`] };
        if (res.motivo === 'caballo') return { tipo: 'renglones', renglones: ['¿Y quién lo va a tirar? Primero conseguite un caballo.'] };
        return { tipo: 'menu' };
      }
      aplicar(res.efectos);
      ctx.guardar?.();
      return { tipo: 'renglones', renglones: ['Un sulky de dos ruedas, con el asiento de lenga y las varas de coihue. Mañana a la mañana te lo llevo al refugio.', 'El zaino lo va a tirar sin problema: ese caballo conoce el camino mejor que vos.'] };
    }
    if (id === 'rincones:pista') {
      const p = pistaDuende(R), n = duendesEncontrados(R);
      return { tipo: 'renglones', renglones: [n ? `Llevás ${n}, tesoro. Eran doce: los tallaron los peones de la vía, uno por rincón.` : 'Eran doce, tesoro: los tallaron los peones de la vía, uno por rincón, para que el valle no los olvidara.', p ? `Me acuerdo de uno: ${p.charAt(0).toLowerCase()}${p.slice(1)}` : ''].filter(Boolean) };
    }
    return { tipo: 'menu' };
  }

  // ================================================================ a dónde va cada uno (aldea-gente.js)
  // (los del partido y los de la función los maneja este módulo con `conVos`: no hace falta otro destino)
  function destino() { return null; }

  // ================================================================ cada cuadro
  let tiempo = 0;
  function actualizar(dt) {
    if (!activo()) return;
    tiempo += dt;
    relojDia -= dt;
    if (relojDia <= 0) { relojDia = 1; alDia(); }
    actualizarPartido(dt);
    actualizarFuncion();
    const js = ctx.jugador?.()?.estado, R = r(), d = dia(), h = horas();
    if (!js || !ctx.mundo) return;
    if (matasDia !== d) refrescarMatas();   // (al cargar y cuando cambia el día: crecen)
    // descubrir lugares (llegar): el potrero y la huerta de todos
    if (enLaCancha(js.pos, 0) && !progreso().entradas?.potrero) ctx.registrar?.('potrero');
    const H = ctx.mundo.huertas();
    if (H.comunitaria[0] && dist(H.comunitaria[0], js.pos) < 6 && !progreso().entradas?.['huerta-comunitaria']) ctx.registrar?.('huerta-comunitaria');
    // la talla: cuando la ves
    if (tallaEnLaPlaza(R, d, h) && !progreso().entradas?.['talla-propia']) { const t = ctx.mundo.lugar('talla'); if (t && dist(t, js.pos) < 12) ctx.registrar?.('talla-propia'); }
    // la casa terminada: cuando entrás
    if (casaTerminada(R.casa, d, h) && !progreso().entradas?.['casa-propia'] && adentroDeCasa(js.pos.x, js.pos.z)) ctx.registrar?.('casa-propia');
    const noche = ctx.noche?.() || 0;
    const campamento = !!R.campamento?.ultimo && ((R.campamento.ultimo === d && h >= RINCONES.campamento.desde) || (R.campamento.ultimo === d - 1 && h < 9));
    ctx.mundo.actualizar(dt, {
      pos: js.pos, noche, tiempo, minga: caminoArreglado(R.camino), etapaFuerte: R.fuerte?.etapa || 0, fuerteHecho: fuerteTerminado(R), campamento,
      talla: tallaEnLaPlaza(R, d, h), cuaderno: !!R.cuaderno, titeres: !!funcion, adornos: adornosDelEstante(R), tallerArmado: tallerArmado(R),
      etapaCasa: etapaCasa(R.casa, d, h), pelota: partido ? partido.pelota : null, sulky: tiene() ? poseSulky() : null,
    });
  }

  // ================================================================ las matas de las huertas (huerta-malla.js, las del mundo de los rincones)
  let matasDia = 0;
  function refrescarMatas() { if (ctx.mundo?.sincronizarMatas) { matasDia = dia(); ctx.mundo.sincronizarMatas(canterosParaMatas(), dia()); } }
  function canterosParaMatas() {
    if (!activo() || !ctx.mundo) return [];
    const R = r(), H = ctx.mundo.huertas(), salida = [];
    for (const [tipo, lista] of [['huerta', H.comunitaria], ['chicos', H.chicos]]) for (const k of lista) {
      const p = tipo === 'chicos' ? R.chicos?.[`c${k.i}`] : R.huerta?.[`c${k.i}`];
      salida.push({ x: k.x, z: k.z, rot: k.rot, y: k.y, parcela: p || null });
    }
    return salida;
  }

  return {
    actualizar, accion, accionDuende, urgente, opciones, elegir, destino, canterosParaMatas, refrescarMatas,
    alSulky, subirSulky, bajarSulky, caballoAtado, enSulky: () => !!viaje, poseSulky, tieneSulky: tiene,
    desatar: () => { if (sk()) sk().atado = false; },
    // la minga del camino (la llama el equipo de las fiestas el día que se hace): { ok, nueva }
    mingaDelCamino: () => { const res = hacerMinga(r().camino, dia()); if (res.nueva) { ctx.nota?.('La minga del camino', 'Entre todos emparejaron la huella, le echaron ripio y plantaron faroles', true); ctx.guardar?.(); } return res; },
    // para las pruebas
    partido: () => partido, empezarPartido: empezar, terminarPartido: terminar, patear: (js, f = true) => patearPelota(js, f), funcion: () => funcion, rincones: r,
    lugares: () => LUGARES_RINCONES, viaje: () => viaje, masCercano: (x, z) => (camino() ? masCercano(camino(), x, z) : null),
  };
}
