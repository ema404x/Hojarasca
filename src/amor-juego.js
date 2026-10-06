// 3.7.1: el amor en el juego (las reglas están en amor.js y las voces en amor-voces.js). Sólo en el Relax y
// con el ajuste «Romance» encendido: apagado, nada de esto aparece (ni opciones, ni comentarios, ni avisos,
// ni citas) y lo que ya pasó queda quieto (no corre el descuido, los chicos no crecen) hasta que se prenda.
//
// Lo que hace:
//   · el menú de la charla (vecindad-juego.js lo pide por `ctx.amor`): con una candidata, «Coquetear…» o
//     «Lo nuestro…» (el piropo, invitarla a salir, el ramo de flores, declararse, proponer con el anillo, vivir
//     juntos, hablar de los chicos, el ñiki ñiki, pedirle volver); con Anselmo, el anillo; con Benigno o
//     Ercilia, el correo (cartas de amor y ramos por el tren);
//   · lo que te dice ella al verte (la carta que le llegó, el bebé que viene) y el chisme con humor de los
//     vecinos cuando se enteran;
//   · las citas y el casamiento: cuando llega la hora, ella te espera en el lugar (3.7.1 (mundo): va caminando, la lleva
//     amor-mundo.js con `ctx.mundo().llevar`; sin mundo, se la lleva como al invitado de la mesa de la 3.6) y al hablarle
//     empieza la cita (o el casamiento civil, en la biblioteca, con el juez de paz);
//   · el día: entrega el correo, el anillo listo, el bebé, la habilidad de la estación (y lo que rinde cada
//     mañana), el descuido, el chisme: todo con notas, de a una.
// El ñiki ñiki lo funde main.js (`ctx.fundido`), sin mostrar nada.
//
// Sin three ni DOM (se prueba en Node): las figuras y la pantalla llegan por `ctx`.
import { bonosDeHabilidades, BONOS, esCandidata, puedeRomance, romanceActivo, etapaAmor, ETAPAS_AMOR, LUGARES_CITA, lugaresDeCita, coquetear, regalarFlores, invitarACita, citaAhora, empezarCita, terminarCita, vencerCita, declararse, encargarAnillo, retirarAnillo, tenesAnillo, anilloListo, proponer, bodaHoy, casarse, convivir, hablarDeLosChicos, buscarHijo, puedeBuscarHijo, puedeNikiNiki, nikiNiki, reconquistar, verla, comentarioDeAmor, pasarDiaAmor, puedeEscribirle, mandarCorreo, mundoAmor, ORDEN_CANDIDATAS, casaDeElla, horaTextoAmor, AMOR, llenarAmor } from './amor.js';
import { FRASES_AMOR } from './amor-voces.js';
import { nombreCorto, sumarAmistadDe } from './vecindad.js';
import { CHISMOSOS } from './vecindad-voces.js';
import { claveVecindad, aplicarEfectos, textoEfectos } from './vecindad-juego.js';
import { puntosMundo, aplicarAlAldea, localAbierto, LOTE_DE } from './aldea.js';

const idx = (e) => ETAPAS_AMOR.indexOf(e);
const distancia = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const FR = FRASES_AMOR;
const nombre = (k) => nombreCorto(k) || k;

// cuánto se queda ella en el lugar después de la cita (horas), y a qué distancia del lugar se cuenta "estás ahí"
export const CITA_JUEGO = { sobremesa: 0.5, cercaAldea: 12, cercaValle: 30, caminar: 60, jugadorLejos: 40 };

// `ctx`: progreso(), ajustes() ({ romance, ritmoAldea }), desafio(), nota(t, sub, nueva), guardar(),
// refrescarBarra(), jugador() (su posición), npcDe(clave), alturaDePie(x, z, y), lugarValle(id) ({ x, z } de
// T.lugares, o null), invierno() (booleano), enCasa(pos, edificio) (¿estás adentro de esa casa? 'refugio' o un
// edificio de la aldea), sumarMaterial(k, n), sumarEntrada(k, n), alJugador(campo, valor), fundido(r) (el
// ñiki ñiki), y `mundo()` (opcional, del equipo del mundo: { llevar(clave, destino) → true si la lleva él,
// soltar(clave) }).
export function crearAmorJuego(ctx) {
  const progreso = () => ctx.progreso();
  const dia = () => Math.max(1, Math.floor(Number(progreso().dia) || 1));
  const horas = () => Number(progreso().horas) || 0;
  const ajustes = () => ({ romance: ctx.ajustes?.()?.romance !== false });
  const activo = () => !ctx.desafio?.() && romanceActivo(ajustes());
  const contexto = (extra = {}) => ({ dia: dia(), hora: horas(), romance: ajustes().romance, lugar: lugarActual(), invierno: !!ctx.invierno?.(), ...extra });
  const notas = [];
  // (las notas salen de a una; si se juntan muchas, por ejemplo después de dormir varios días, se pierden primero las
  // menos importantes, para que lo nuevo no quede esperando atrás de lo viejo)
  const avisar = (texto, sub, nueva = true) => {
    if (!texto) return;
    notas.push([texto, sub || '', nueva]);
    while (notas.length > 5) { const i = notas.findIndex((x) => !x[2]); notas.splice(i >= 0 ? i : 0, 1); }
  };

  // ---------------------------------------------------------------- los lugares
  // Dónde queda un lugar de cita en el mundo: el punto de ella (`suyo`) o el tuyo.
  function posLugar(id, quien = 'suyo') {
    const L = LUGARES_CITA[id];
    if (!L) return null;
    if (L.aldea) {
      const p = puntosMundo(L.aldea.edificio)[L.aldea[quien]];
      return p ? { x: p.x, z: p.z, mira: p.rot } : null;
    }
    const v = ctx.lugarValle?.(L.valle);
    if (!v || !Number.isFinite(v.x)) return null;
    return quien === 'suyo' ? { x: v.x + 1.2, z: v.z + 1.2, mira: Math.PI * 1.25 } : { x: v.x - 0.4, z: v.z - 0.4, mira: Math.PI * 0.25 };
  }
  // El lugar donde estás parado (para el favorito de cada una), o el de la cita en curso.
  function lugarActual() {
    const c = progreso().amor?.cita;
    if (c?.estado === 'en-curso') return c.lugar;
    const j = ctx.jugador?.();
    if (!j) return null;
    for (const id of Object.keys(LUGARES_CITA)) {
      const p = posLugar(id);
      if (p && distancia(j, p) < (LUGARES_CITA[id].valle ? CITA_JUEGO.cercaValle : CITA_JUEGO.cercaAldea)) return id;
    }
    return null;
  }

  // ---------------------------------------------------------------- el menú de la charla
  // Lo que se suma al menú principal de la charla con `clave` (antes de «Nada más, chau»).
  function opciones(clave) {
    if (!activo()) return [];
    const p = progreso();
    const lista = [];
    if (esCandidata(clave) && puedeRomance(clave, p, ajustes()).ok) {
      const et = etapaAmor(clave, p);
      lista.push({ id: 'amor', titulo: idx(et) >= idx('novios') ? FR.titulo.nuestro : FR.titulo.coquetear });
    }
    if (clave === 'herrero' && localAbierto(p.aldea, LOTE_DE.herrero)) {
      const a = p.amor?.anillo;
      if (a && !a.retirado && anilloListo(p, dia())) lista.push({ id: 'amor:retirar', titulo: FR.opcion.retirar });
      else if (!a && Object.values(p.amor?.personas || {}).some((f) => f.etapa === 'novios')) lista.push({ id: 'amor:anillo', titulo: FR.opcion.anillo });
    }
    if ((clave === 'telegrafista' || clave === 'ercilia') && ORDEN_CANDIDATAS.some((k) => puedeEscribirle(k, p, ajustes()))) lista.push({ id: 'amor-correo', titulo: 'Mandar una carta de amor…' });
    return lista;
  }
  const volver = { id: 'volver', titulo: FR.opcion.volver };
  // Un submenú: { tipo, texto, opciones, i }.
  function submenu(clave, tipo) {
    const p = progreso(), d = dia(), h = horas();
    const f = p.amor?.personas?.[clave] || null;
    const et = f?.etapa || 'conocidos';
    const opc = [];
    if (tipo === 'amor') {
      const pareja = ['novios', 'comprometidos', 'casados'].includes(et);
      if (f?.piropo !== d) opc.push({ id: 'amor:piropo', titulo: pareja ? FR.opcion.mimo : FR.opcion.piropo });
      if (idx(et) >= idx('coqueteo') && !p.amor?.cita) opc.push({ id: 'amor-cita', titulo: FR.opcion.cita });
      if (!ctx.invierno?.() && f?.flores !== d) opc.push({ id: 'amor:flores', titulo: FR.opcion.flores });
      if (et === 'saliendo') opc.push({ id: 'amor:declararse', titulo: FR.opcion.declararse });
      if (et === 'novios' && tenesAnillo(p)) opc.push({ id: 'amor:proponer', titulo: FR.opcion.proponer });
      const conv = p.amor?.convivencia;
      if (pareja && conv?.con !== clave) opc.push({ id: 'amor-casa', titulo: et === 'casados' ? FR.opcion.casa : FR.opcion.convivir });
      // (separados, los chicos viven con ella: se puede hablar de ellos igual)
      if (et === 'casados' || (et === 'separados' && (p.amor?.hijos || []).some((x) => x.madre === clave))) opc.push({ id: 'amor:chicos', titulo: FR.opcion.chicos });
      if (puedeBuscarHijo(p, clave)) opc.push({ id: 'amor:buscar', titulo: FR.opcion.buscar });
      if (pareja && conv?.con === clave && (h >= AMOR.niki.desde || h < AMOR.niki.hasta)) opc.push({ id: 'amor:niki', titulo: FR.opcion.niki });
      if (et === 'separados') opc.push({ id: 'amor:reconquistar', titulo: FR.opcion.reconquistar });
      // 3.7.1 (mundo): salir a caminar juntos (en público se nota la pareja), o terminar el paseo
      const caminar = ctx.mundo?.()?.opcionCaminar?.(clave);
      if (caminar) opc.push(caminar);
    } else if (tipo === 'amor-cita') {
      for (const id of lugaresDeCita(clave, p.aldea)) if (posLugar(id)) opc.push({ id: `amor:cita:${id}`, titulo: `${LUGARES_CITA[id].cita.charAt(0).toUpperCase()}${LUGARES_CITA[id].cita.slice(1)}` });
      opc.splice(8);
    } else if (tipo === 'amor-casa') {
      opc.push({ id: 'amor:convivir:refugio', titulo: FR.opcion.refugio });
      if (casaDeElla(clave)) opc.push({ id: 'amor:convivir:suya', titulo: FR.opcion.suya });
    } else if (tipo === 'amor-correo') {
      for (const k of ORDEN_CANDIDATAS) {
        if (!puedeEscribirle(k, p, ajustes())) continue;
        opc.push({ id: `amor:carta:${k}`, titulo: llenarAmor(FR.opcion.carta, { ella: nombre(k) }) });
        if (!ctx.invierno?.()) opc.push({ id: `amor:ramo:${k}`, titulo: llenarAmor(FR.opcion.ramo, { ella: nombre(k) }) });
      }
      opc.splice(8);
    }
    opc.push(volver);
    const textos = { amor: FR.sub.amor, 'amor-cita': FR.sub.cita, 'amor-casa': FR.sub.casa, 'amor-correo': FR.sub.correo };
    return { tipo, texto: textos[tipo] || FR.sub.amor, opciones: opc, i: 0 };
  }
  const renglones = (r) => ({ tipo: 'renglones', renglones: r?.renglones?.length ? r.renglones : [FR.noTodavia] });
  // Elegir una opción del amor. Devuelve lo mismo que `elegir` de vecindad-juego.js ({ tipo: 'menu', sub } para
  // un submenú; { tipo: 'renglones', renglones }; o { tipo: 'fundido', renglones, efectos, despues }).
  function elegir(s, id) {
    if (!activo()) return { tipo: 'menu' };
    const p = progreso(), clave = s.clave, d = dia();
    if (id === 'amor' || id === 'amor-cita' || id === 'amor-casa' || id === 'amor-correo') return { tipo: 'menu', sub: submenu(clave, id) };
    const [, que, k] = String(id).split(':');
    const c = contexto();
    let r = null;
    if (que === 'piropo') {
      r = coquetear(p, clave, c);
      if (r.subio === 'coqueteo') avisar(`Hay onda con ${nombre(clave)}`, 'Ya la podés invitar a salir');
    } else if (que === 'flores') {
      r = regalarFlores(p, clave, c);
      if (r.subio === 'coqueteo') avisar(`Hay onda con ${nombre(clave)}`, 'Ya la podés invitar a salir');
    } else if (que === 'cita') {
      r = invitarACita(p, clave, k, c);
      if (r.ok) { avisar(`Cita con ${nombre(clave)}`, `${LUGARES_CITA[k].cita}, ${r.cita.dia === d ? 'hoy' : 'mañana'} a las ${horaTextoAmor(r.cita.desde)}`); sumarAmistadDe(p, clave, 2, d); }
    } else if (que === 'declararse') {
      r = declararse(p, clave, c);
      if (r.si) avisar(`${nombre(clave)} y vos son novios`, 'En la aldea se va a notar');
    } else if (que === 'proponer') {
      r = proponer(p, clave, c);
      if (r.si) avisar(`¡${nombre(clave)} dijo que sí!`, `Se casan el día ${r.boda.dia}, a las once, en la biblioteca popular`);
      for (const o of r.cortaron || []) avisar(`${nombre(o)} se enteró`, 'Ya no salen más');
    } else if (que === 'convivir') {
      r = convivir(p, clave, k, c);
      if (r.si) avisar(k === 'refugio' ? `${nombre(clave)} se muda al refugio` : `Te mudás a lo de ${nombre(clave)}`, 'Viven juntos');
    } else if (que === 'chicos') r = hablarDeLosChicos(p, clave, c);
    else if (que === 'buscar') r = buscarHijo(p, clave, c);
    else if (que === 'reconquistar') {
      r = reconquistar(p, clave, c);
      if (r.si) avisar(llenarAmor(FR.vuelven, { ella: nombre(clave) }), 'Ahora decidan dónde viven');
    } else if (que === 'niki') {
      const casa = p.amor?.convivencia;
      const enCasa = ctx.enCasa ? !!ctx.enCasa(ctx.jugador?.(), casa?.donde === 'refugio' ? 'refugio' : casaDeElla(clave)) : true;
      r = nikiNiki(p, clave, { ...c, enCasa });
      if (r.ok) { ctx.guardar?.(); return { tipo: 'fundido', renglones: r.renglones, efectos: r.efectos, despues: r.despues, embarazo: r.embarazo }; }
    } else if (que === 'anillo') {
      r = encargarAnillo(p, c);
      if (r.ok) { aplicarEfectos(p, r.efectos, ctx); ctx.refrescarBarra?.(); avisar('Anselmo hace el anillo', `Pasá a buscarlo en ${AMOR.anillo.dias} días`); }
    } else if (que === 'retirar') {
      r = retirarAnillo(p, c);
      if (r.ok) avisar('Tenés el anillo', 'Ahora falta animarse');
    } else if (que === 'caminar') r = ctx.mundo?.()?.caminar?.(clave) || null;   // 3.7.1 (mundo): ver amor-mundo.js
    else if (que === 'soltar') r = ctx.mundo?.()?.soltarJuntos?.(clave) || null;
    else if (que === 'carta' || que === 'ramo') {
      r = mandarCorreo(p, que, k, c);
      if (r.ok) avisar(que === 'carta' ? `Carta para ${nombre(k)}` : `Ramo para ${nombre(k)}`, 'Sale con el tren de mañana');
    }
    if (!r) return { tipo: 'menu' };
    ctx.guardar?.();
    return renglones(r);
  }
  // Al abrir la charla: lo que ella tiene para decirte (va primero) o el chisme de un vecino (después de lo
  // que comenta la vecindad). { primero, despues }.
  function alAbrir(clave) {
    if (!activo()) return null;
    const p = progreso();
    if (esCandidata(clave)) {
      const dice = verla(p, clave, contexto());
      if (dice) return { primero: dice, despues: null };
    }
    return { primero: null, despues: comentarioDeAmor(p, clave, contexto({ chismoso: CHISMOSOS.includes(clave) })) };
  }

  // ---------------------------------------------------------------- la cita y el casamiento, en el lugar
  let puesta = null;   // { clave, npc, antes, por: 'cita'|'boda', hasta, lugar }
  function llevar(npc, lugar) {
    const antes = { ruta: npc.ruta, etapa: npc.etapa, espera: npc.espera, velocidad: npc.velocidad, x: npc.pos.x, z: npc.pos.z, camino: npc.camino, soloCerca: npc.soloCerca };
    npc.deVisita = true; npc.camino = null; npc.soloCerca = 0; npc.pose = null; npc.dormido = false; npc.asiento = undefined;
    if (distancia(npc.pos, lugar) > CITA_JUEGO.caminar) {
      const j = ctx.jugador?.() || null;
      let desde = lugar;
      if (j && distancia(j, lugar) <= CITA_JUEGO.jugadorLejos) {
        let dx = lugar.x - j.x, dz = lugar.z - j.z;
        const m = Math.hypot(dx, dz) || 1; dx /= m; dz /= m;
        desde = { x: lugar.x + dx * 30, z: lugar.z + dz * 30 };
      }
      npc.pos.set(desde.x, ctx.alturaDePie ? ctx.alturaDePie(desde.x, desde.z, npc.pos.y) : npc.pos.y, desde.z);
    }
    npc.ruta = [{ x: lugar.x, z: lugar.z, quieto: 99999, mirar: { x: lugar.x + Math.sin(lugar.mira || 0) * 3, z: lugar.z + Math.cos(lugar.mira || 0) * 3 } }];
    npc.etapa = 0; npc.espera = 0; npc.velocidad = 1.1;
    npc.enCita = true;
    return antes;
  }
  function soltar() {
    const x = puesta;
    puesta = null;
    if (!x) return;
    if (x.porMundo) { ctx.mundo?.()?.soltar?.(x.clave); return; }
    const npc = x.npc, a = x.antes;
    if (!npc || !a) return;
    Object.assign(npc, { ruta: a.ruta, etapa: a.etapa, espera: a.espera, velocidad: a.velocidad, camino: a.camino, soloCerca: a.soloCerca, deVisita: false, pose: null, enCita: false });
    npc.pos.set(a.x, ctx.alturaDePie ? ctx.alturaDePie(a.x, a.z, npc.pos.y) : npc.pos.y, a.z);
  }
  function poner(clave, por, lugarId, punto) {
    const npc = ctx.npcDe?.(clave);
    if (!npc || !npc.pos || (npc.enCita && !(puesta && puesta.npc === npc))) return false;   // (con otra invitación de la vecindad, no)
    const destino = punto || posLugar(lugarId);
    if (!destino) return false;
    if (ctx.mundo?.()?.llevar?.(clave, { lugar: lugarId, ...destino, por })) { puesta = { clave, npc, por, lugar: lugarId, porMundo: true }; return true; }
    puesta = { clave, npc, por, lugar: lugarId, antes: llevar(npc, destino) };
    return true;
  }
  // ¿Hablarle a ella empieza la cita o el casamiento? Devuelve { id, partes, alTerminar } o null.
  function hablar(npc) {
    if (!activo() || !npc) return null;
    const clave = claveVecindad(npc);
    if (!clave || !puesta || puesta.clave !== clave || puesta.npc !== npc) return null;
    const p = progreso(), c = contexto();
    if (puesta.por === 'boda') {
      const r = casarse(p, c);
      if (!r.ok) return null;
      puesta.hasta = dia() * 24 + horas() + 1;
      avisar(llenarAmor(FR.boda.avisoCasados, { ella: nombre(clave) }), FR.boda.avisoCasadosSub);
      ctx.guardar?.();
      return { id: 'amor-boda', partes: r.renglones };
    }
    const cita = citaAhora(p, c);
    if (!cita || cita.clave !== clave || cita.estado !== 'acordada') return null;
    const e = empezarCita(p, c);
    if (!e) return null;
    ctx.guardar?.();
    return { id: 'amor-cita', partes: e.renglones, alTerminar: () => alCerrar() };
  }
  // Terminó (o se cortó) la charla de la cita: cuenta igual.
  function alCerrar() {
    const p = progreso();
    if (p.amor?.cita?.estado !== 'en-curso') return;
    const r = terminarCita(p, contexto());
    if (!r) return;
    sumarAmistadDe(p, r.clave, 4, dia());
    if (puesta && puesta.clave === r.clave) puesta.hasta = dia() * 24 + horas() + CITA_JUEGO.sobremesa;
    avisar(r.subio === 'saliendo' ? `Ahora salís con ${nombre(r.clave)}` : `Qué linda cita con ${nombre(r.clave)}`, r.favorito ? 'Era su lugar preferido' : 'Esas cosas se recuerdan');
    ctx.guardar?.();
  }
  function textoAviso(npc) {
    if (!activo() || !npc || !puesta || puesta.npc !== npc) return null;
    if (puesta.por === 'boda' && !puesta.hasta) return `Casarte con ${nombre(puesta.clave)}`;
    const c = progreso().amor?.cita;
    return c && c.clave === puesta.clave && c.estado === 'acordada' ? `Empezar la cita con ${nombre(puesta.clave)}` : null;
  }
  function actualizarLugar() {
    const p = progreso(), c = contexto();
    const ahora = dia() * 24 + horas();
    const v = vencerCita(p, c);
    if (v) { avisar(v.texto, v.sub); ctx.guardar?.(); }
    const cita = citaAhora(p, c), boda = bodaHoy(p, c);
    const quiere = boda ? { clave: boda.con, por: 'boda', lugar: 'biblioteca' } : cita ? { clave: cita.clave, por: 'cita', lugar: cita.lugar } : null;
    if (puesta) {
      const sigue = quiere && quiere.clave === puesta.clave && quiere.por === puesta.por;
      if (!sigue && !(puesta.hasta && ahora < puesta.hasta)) soltar();
      else if (puesta.hasta && ahora >= puesta.hasta) soltar();
      return;
    }
    if (!quiere) return;
    const punto = quiere.por === 'boda' ? (() => { const q = puntosMundo('biblioteca').cuentos; return q ? { x: q.x, z: q.z, mira: q.rot } : null; })() : null;
    if (poner(quiere.clave, quiere.por, quiere.lugar, punto)) {
      const L = LUGARES_CITA[quiere.lugar];
      if (quiere.por === 'cita') avisar(`${nombre(quiere.clave)} te espera`, `En ${L.nombre}, hasta las ${horaTextoAmor(cita.hasta)}`);
      else avisar(`${nombre(quiere.clave)} te espera en la biblioteca`, 'El juez de paz ya llegó');
    }
  }

  // ---------------------------------------------------------------- el día
  // Al empezar cada día (lo mira cada medio segundo): lo de amor.js, con notas, y lo que rinde lo aprendido.
  function revisarDia() {
    const p = progreso();
    if (ctx.desafio?.()) return null;
    if (p.amor && Number(p.amor.dia) >= dia()) return null;
    const r = pasarDiaAmor(p, dia(), { romance: ajustes().romance, ritmo: ctx.ajustes?.()?.ritmoAldea || 'normal' });
    for (const e of r.eventos) avisar(e.texto, e.sub);
    if (r.efectos.length) {
      const items = r.efectos.filter((e) => e.tipo === 'material' || e.tipo === 'cosa' || e.tipo === 'entrada');
      aplicarEfectos(p, items, ctx);
      for (const e of r.efectos) if (e.tipo === 'jugador') ctx.alJugador?.(e.campo, e.valor);
      if (p.aldea) aplicarAlAldea(p.aldea, r.efectos, dia());
      const da = textoEfectos(items);
      if (da) avisar('Lo que aprendiste rinde', `Esta mañana: ${da}`, false);
      ctx.refrescarBarra?.();
    }
    ctx.guardar?.();
    return r;
  }
  // ---------------------------------------------------------------- lo que te enseñó tu esposa y vale siempre
  // Las mejoras permanentes (amor.js, BONOS): se recalculan cada medio segundo (main.js las lee cada cuadro) y van
  // al jugador por `ctx.alBonos`. En el Desafío o con el ajuste apagado, las de fábrica.
  const BASE = { ...BONOS, oficios: {} };
  let bonosHoy = BASE;
  function rearmarBonos() {
    bonosHoy = ctx.desafio?.() ? BASE : bonosDeHabilidades(progreso(), ajustes());
    ctx.alBonos?.(bonosHoy);
  }
  const FRUTOS = { frutillas: 'frutilla', 'frutos de calafate': 'calafate', 'piñones': 'pinon' };
  function alJuntar(etiqueta) {
    const k = Object.hasOwn(FRUTOS, etiqueta) ? FRUTOS[etiqueta] : null;
    if (!k || !activo() || !(bonosHoy.frutos > 0)) return 0;
    if (ctx.sumarEntrada) ctx.sumarEntrada(k, bonosHoy.frutos); else aplicarEfectos(progreso(), [{ tipo: 'entrada', k, n: bonosHoy.frutos }], ctx);
    return bonosHoy.frutos;
  }
  function alRegalar(clave, reaccion) {
    if (!activo() || !(bonosHoy.regalos > 0) || (reaccion !== 'encanta' && reaccion !== 'gusta')) return 0;
    sumarAmistadDe(progreso(), clave, bonosHoy.regalos, dia());
    return bonosHoy.regalos;
  }
  let acum = 0, acumNota = 99;
  function actualizar(dt) {
    if (ctx.desafio?.()) return;
    acum += dt; acumNota += dt;
    if (acumNota >= 2.5 && notas.length) { acumNota = 0; const [t, s, n] = notas.shift(); ctx.nota?.(t, s, n); }
    if (acum < 0.5) return;
    acum = 0;
    revisarDia();
    rearmarBonos();
    if (!activo()) { if (puesta) soltar(); return; }
    actualizarLugar();
  }

  return {
    activo, opciones, submenu, elegir, alAbrir, hablar, alCerrar, textoAviso, actualizar, revisarDia,
    bonos: () => bonosHoy, alJuntar, alRegalar,   // lo que te enseñó tu esposa y vale siempre
    // para el mundo y las pruebas
    mundo: () => mundoAmor(progreso(), { dia: dia(), hora: horas(), romance: ajustes().romance, desafio: !!ctx.desafio?.(), aldea: progreso().aldea }),
    puesta: () => (puesta ? { clave: puesta.clave, por: puesta.por, lugar: puesta.lugar } : null),
    lugarActual, posLugar, notasPendientes: () => notas.length,
    puedeNiki: (clave) => puedeNikiNiki(progreso(), clave, contexto()),
  };
}
