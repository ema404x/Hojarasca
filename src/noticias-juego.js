// 3.7.5 (noticias): las noticias en el juego (sólo en el Relax). Junta lo que pasa en el valle y en la aldea en renglones
// y se los da a noticias.js (la radio por horarios, el diario de la aldea, las cartas de lejos) y a calendario.js (lo que
// se suma al calendario del cuaderno y su aviso del día antes). Además:
//   · el club de lectura en la biblioteca y la noche de estrellas abierta con Valentina en la plaza: a esa hora, la que
//     lo lleva y unos cuantos vecinos van (`destino`, como el amor y el asado en aldea-gente.js) y, si le hablás, te
//     cuenta (`hablar`, como el amor en main.js);
//   · las cartas de lejos te las da Benigno en la estafeta (o Ercilia, mientras Benigno no haya llegado);
//   · la página «Noticias» del cuaderno.
// `ctx`: { progreso(), ajustes(), desafio(), nota(t, sub, nueva), guardar(), registrar(id), pronostico() (los días de
// meteo.js), cartaVieja() (si Ercilia tiene una carta del correo de siempre: va primero), concursos() (concursos-juego.js) }.
import { armarPrograma, RADIO_ALDEA, PROGRAMAS_RADIO, DIARIO_ALDEA, tocaDiario, sacarDiario, repartirCarta, cartasPorLeer, cartasLeidas, leerCartaLejana, partesDeCartaLejana, sanearNoticias, CARTAS_LEJANAS, remitente } from './noticias.js';
import { extrasDelDia, extrasDelAnio, avisoMananaExtra, clubAhora, estrellasAhora, libroDeLaSemana, asistentes, CLUB_LECTURA, NOCHE_ESTRELLAS, hayClub, hayEstrellas, nombreDiaSemana } from './calendario.js';
import { fechaDe as fechaDelCalendario } from './fiestas.js';
import { eventosDelDia, nombreCortoDe, FIESTAS_ALDEA } from './aldea-vida.js';
import { obraEnCurso, etapaDe, EDIFICIOS_ALDEA, esVecinoAldea, ORDEN_PERSONAS_ALDEA, POBLADORES_ALDEA } from './aldea.js';
import { noticiasDeAmor } from './amor.js';
import { VOCES_SOCIAL } from './vecindad-social-voces.js';
import { hashTexto, generador } from './semilla.js';
// (la fecha de fiestas.js, sin tu cumpleaños: sin el estado, fechaDe lo pone siempre el día 3, y la fiesta es sorpresa;
// las noticias no lo anuncian ni suspenden el club por eso)
const fechaDeFiesta = (dia) => { const f = fechaDelCalendario(dia); return f && f.tipo !== 'cumple-jugador' ? f : null; };

const minus = (s) => (typeof s === 'string' && s ? s.charAt(0).toLowerCase() + s.slice(1) : '');
const unir = (l) => (l.length < 2 ? l[0] || '' : `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}`);
const CIELO = ['cruz-del-sur', 'tres-marias', 'magallanes', 'escorpio'];
const NOMBRE_CIELO = { 'cruz-del-sur': 'la Cruz del Sur', 'tres-marias': 'las Tres Marías', magallanes: 'las Nubes de Magallanes', escorpio: 'Escorpio, con su estrella roja' };

// ---------------------------------------------------------------- lo que pasa, en renglones (sin DOM: se prueba en Node)
export const presenteEn = (aldea) => (k) => esVecinoAldea(k) || (Array.isArray(aldea?.pobladores) && aldea.pobladores.some((p) => p?.clave === k));
// Las fechas de fiestas.js que no estén ya en FIESTAS_ALDEA (para el calendario de aldea-vida.js)
export const opcionesCalendario = (aldea) => ({ aldea, fechas: fechaDeFiesta, ya: FIESTAS_ALDEA.map((f) => f?.id).filter(Boolean) });
// Las novedades del valle (para la radio de la mañana y la tapa del diario)
export function novedadesDelValle(p, dia, extra = {}) {
  const a = p?.aldea || {};
  const lista = [];
  if (a.llegando?.clave) lista.push(`Bajó del tren ${POBLADORES_ALDEA[a.llegando.clave]?.nombre || 'alguien nuevo'} y espera en el andén a que alguien le diga que se quede.`);
  const obra = obraEnCurso(a);
  if (obra) { const et = etapaDe(a, obra); lista.push(`La obra de ${minus(EDIFICIOS_ALDEA[obra].nombre)} va por la etapa ${et.hechas + 1} de ${et.total}${et.lista ? ': los vecinos ya están trabajando' : ': falta material, por si alguien tiene'}.`); }
  // (el local que abrió hace menos: uno solo, que la radio no es una guía comercial)
  const abiertos = Object.entries(a.locales && typeof a.locales === 'object' ? a.locales : {}).filter(([lote, desde]) => EDIFICIOS_ALDEA[lote] && dia - Math.floor(Number(desde) || 0) <= 3);
  if (abiertos.length) { const [lote] = abiertos.reduce((m, x) => (Number(x[1]) > Number(m[1]) ? x : m)); lista.push(`Abrió ${minus(EDIFICIOS_ALDEA[lote].nombre)}. Ya hay cola en la puerta.`); }
  const cumples = eventosDelDia(dia, { aldea: a }).filter((e) => e.tipo === 'cumple');
  if (cumples.length) lista.push(`Hoy ${cumples.length === 1 ? 'cumple' : 'cumplen'} años ${unir(cumples.map((e) => nombreCortoDe(e.clave)))}. Desde esta radio, el saludo de todo el valle.`);
  const f = fechaDeFiesta(dia);
  if (f && a.descubierta) lista.unshift(`Hoy es ${minus(f.nombre)}: todos a la plaza.`);   // (la fiesta, primero: es la tapa)
  const v = p?.vidaAldea;
  if (v?.visitante?.dia === dia) lista.push('Bajó del tren un visitante que pregunta por los lugares del valle. Si lo ven perdido, denle una mano.');
  if (v?.mascota?.estado === 'cachorros') lista.push('La Chola tuvo cachorros en la boletería: Ernesto anda buscándoles casa.');
  if (typeof extra.concurso === 'string' && extra.concurso) lista.push(extra.concurso);
  return lista;
}
// El tiempo: lo de hoy y lo de mañana del pronóstico (meteo.js)
export function tiempoDelValle(pronostico) {
  const dias = Array.isArray(pronostico) ? pronostico : [];
  const hoy = dias.find((d) => d.cuando === 'Hoy'), man = dias.find((d) => d.cuando === 'Mañana');
  const l = [];
  if (hoy?.texto) l.push(`Para hoy, ${minus(hoy.texto)}.`.replace(/\.\.$/, '.'));
  if (man?.texto) l.push(`Para mañana, ${minus(man.texto)}.`.replace(/\.\.$/, '.'));
  return l;
}
// Los chismes: los del amor (amor.js, con humor) y los que cuentan los vecinos (vecindad-social-voces.js). Sólo de los
// que viven en la aldea y sin nombrar a los que todavía no llegaron.
export function chismesDelValle(p, dia, romance = true) {
  const a = p?.aldea || {};
  const esta = presenteEn(a);
  const ausentes = ORDEN_PERSONAS_ALDEA.filter((k) => !esta(k)).map((k) => nombreCortoDe(k)).filter((n) => typeof n === 'string' && n.length > 2);
  const l = [];
  for (const n of noticiasDeAmor(p, { dia, desde: dia - 3, romance })) l.push(n.texto);
  for (const k of ORDEN_PERSONAS_ALDEA) {
    if (!esta(k) || !Object.hasOwn(VOCES_SOCIAL, k)) continue;
    const t = VOCES_SOCIAL[k]?.viene?.chisme;
    if (typeof t !== 'string' || ausentes.some((n) => t.includes(n))) continue;
    l.push(`Nos cuentan desde la aldea: «${t}»`);
  }
  return l;
}
// Los avisos (lo que viene): la fecha o el concurso de los próximos días, el club, las estrellas, los cumpleaños de mañana
export function avisosDelValle(p, dia) {
  const a = p?.aldea || {};
  const op = opcionesCalendario(a);
  const l = [];
  for (let k = 1; k <= 3; k++) {
    for (const e of extrasDelDia(dia + k, op)) {
      if (e.tipo === 'club' || e.tipo === 'estrellas') continue;
      l.push(`${k === 1 ? 'Mañana' : k === 2 ? 'Pasado mañana' : `El ${nombreDiaSemana(dia + k)}`}: ${minus(e.nombre)}. ${e.texto}`);
    }
  }
  const man = eventosDelDia(dia + 1, { aldea: a }).filter((e) => e.tipo === 'cumple');
  if (man.length) l.push(`Mañana ${man.length === 1 ? 'cumple' : 'cumplen'} años ${unir(man.map((e) => nombreCortoDe(e.clave)))}: si ${man.length === 1 ? 'lo cruzan' : 'los cruzan'}, un saludo.`);
  for (let k = 0; k <= 6; k++) {
    if (hayClub(dia + k, a, fechaDeFiesta)) { const lb = libroDeLaSemana(dia + k); l.push(`Club de lectura el ${k === 0 ? 'día de hoy' : nombreDiaSemana(dia + k)} a las ${CLUB_LECTURA.desde} en la biblioteca: «${lb.titulo}», de ${lb.autor}. Lo lleva la abuela Herminia.`); break; }
  }
  for (let k = 0; k <= 6; k++) {
    if (hayEstrellas(dia + k, a, fechaDeFiesta)) { l.push(`Noche de estrellas abierta el ${k === 0 ? 'día de hoy' : nombreDiaSemana(dia + k)} a las ${NOCHE_ESTRELLAS.desde}, en la plaza: Valentina baja el telescopio. Abríguense.`); break; }
  }
  return l;
}

export function crearNoticiasJuego(ctx) {
  const progreso = () => ctx.progreso();
  const dia = () => Math.max(1, Math.floor(Number(progreso()?.dia) || 1));
  const hora = () => Number(progreso()?.horas) || 0;
  const ritmo = () => ctx.ajustes?.()?.ritmoAldea || 'normal';
  const romance = () => ctx.ajustes?.()?.romance !== false;
  const activo = () => !ctx.desafio?.() && !!progreso() && !!progreso().aldea;
  const aldea = () => progreso()?.aldea || {};
  const conoce = () => Math.floor(Number(aldea().descubierta) || 0) > 0;
  const estado = () => {
    const p = progreso();
    if (!p.noticias || typeof p.noticias !== 'object') p.noticias = sanearNoticias(p.noticias, p.dia);
    return p.noticias;
  };
  const claveDe = (npc) => npc?.claveAldea || npc?.clave || null;
  const benignoEsta = () => presenteEn(aldea())('telegrafista');
  const resultado = () => ctx.concursos?.()?.noticiaReciente?.(dia()) || null;

  // ---------------------------------------------------------------- la radio
  // Lo que se oye ahora en la radio comunitaria ({ programa, nombre, quien, texto }) o null (fuera de la grilla, sin
  // conocer la aldea o en el Desafío: la radio de siempre).
  function radio() {
    if (!activo() || !conoce()) return null;
    const p = progreso(), d = dia();
    const prog = armarPrograma({ dia: d, hora: hora(), ritmo: ritmo(), tiempo: tiempoDelValle(ctx.pronostico?.()), novedades: novedadesDelValle(p, d, { concurso: resultado() }), chismes: chismesDelValle(p, d, romance()), avisos: avisosDelValle(p, d) });
    if (!prog) return null;
    estado().oidos[prog.programa] = d;
    return { programa: prog.programa, nombre: prog.nombre, quien: `${RADIO_ALDEA.nombre}, ${RADIO_ALDEA.dial}`, texto: `${prog.locutora}: «${prog.texto}»` };
  }

  // ---------------------------------------------------------------- cada medio segundo: el diario, las cartas, el aviso
  let acum = 0;
  function actualizar(dt) {
    acum += dt;
    if (acum < 0.5) return;
    acum = 0;
    if (!activo()) return;
    const p = progreso(), n = estado(), d = dia(), h = hora();
    let cambio = false;
    // el aviso del día antes (lo que no avisa aldea-vida.js: las fechas, el aniversario, el concurso, las estrellas)
    if (n.avisado < d) {
      n.avisado = d; cambio = true;
      const av = avisoMananaExtra(d, conoce() ? opcionesCalendario(aldea()) : { aldea: null, fechas: [] });
      if (av) ctx.nota(av.titulo, av.texto, true);
    }
    if (conoce()) {
      // el diario de la aldea
      if (h >= DIARIO_ALDEA.hora && tocaDiario(n, d, ritmo())) {
        const ed = sacarDiario(n, d, { novedades: novedadesDelValle(p, d, { concurso: resultado() }), chismes: chismesDelValle(p, d, romance()), avisos: avisosDelValle(p, d), tiempo: tiempoDelValle(ctx.pronostico?.()), concurso: resultado(), club: clubDelDiario(d), presentes: presenteEn(aldea()) });
        if (ed) { cambio = true; ctx.nota(`Salió «${DIARIO_ALDEA.nombre}» n.º ${ed.n}`, `«${ed.titulo}» — está en el cuaderno, en «Noticias»`, true); }
      }
      // una carta de lejos (con el tren de la mañana)
      if (h >= 10) {
        const c = repartirCarta(n, p, d, ritmo());
        if (c) { cambio = true; ctx.nota(`Llegó carta de ${remitente(c)}`, benignoEsta() ? 'Te la guarda Benigno en la estafeta' : 'Te la guarda Ercilia en el almacén', true); }
      }
    }
    if (cambio) ctx.guardar();
  }
  function clubDelDiario(d) {
    for (let k = 0; k <= 6; k++) if (hayClub(d + k, aldea(), fechaDeFiesta)) { const l = libroDeLaSemana(d + k); return `Este ${nombreDiaSemana(d + k)} el club de lectura sigue con «${l.titulo}». ${l.dicen[0]}`; }
    return '';
  }

  // ---------------------------------------------------------------- hablar: la carta, el club, las estrellas
  // Devuelve { id, partes, alTerminar } (como el amor) o null.
  function hablar(npc) {
    if (!activo()) return null;
    const k = claveDe(npc), d = dia(), h = hora(), n = estado();
    // la carta de lejos: Benigno, o Ercilia mientras no esté Benigno (y si no tiene una carta del correo de siempre)
    const pendiente = cartasPorLeer(n)[0];
    if (pendiente && (k === 'telegrafista' || (k === 'ercilia' && !benignoEsta() && !ctx.cartaVieja?.()))) {
      return { id: `carta-${pendiente.id}`, partes: partesDeCartaLejana(pendiente, k), alTerminar: () => { leerCartaLejana(n, pendiente.id, d); ctx.guardar(); ctx.redibujar?.(); } };
    }
    // el club de lectura (una vez por día)
    if (k === CLUB_LECTURA.quien && clubAhora(d, h, aldea(), fechaDeFiesta) && !n.club.includes(d)) {
      const l = libroDeLaSemana(d);
      const van = asistentes('club', d, aldea()).map((x) => nombreCortoDe(x)).filter(Boolean);
      return { id: 'club-lectura', partes: [
        `Llegaste justo, que recién empezamos. Esta semana leemos «${l.titulo}», de ${l.autor}. Sentate donde haya lugar.`,
        `${van.length ? `Están ${unir(van.slice(0, 4))}. ` : ''}${l.dicen[0]}`,
        `${l.dicen[1]} Después hay mate y, si Ceinwen se acordó, torta. La semana que viene, otro libro.`,
      ], alTerminar: () => { if (!n.club.includes(d)) n.club.push(d); ctx.guardar(); ctx.redibujar?.(); } };
    }
    // la noche de estrellas (una vez por día)
    if (k === NOCHE_ESTRELLAS.quien && estrellasAhora(d, h, aldea(), fechaDeFiesta) && !n.estrellas.includes(d)) {
      const ya = progreso().entradas || {};
      const pend = CIELO.find((id) => !Object.hasOwn(ya, id));
      const r = generador(hashTexto(`estrellas-${d}`));
      const cielo = pend || CIELO[Math.floor(r() * CIELO.length) % CIELO.length];
      return { id: 'noche-estrellas', partes: [
        '¡Viniste! Bajé el telescopio a la plaza: esta noche el cielo es de todos, no sólo mío.',
        `Acercá el ojo, despacio. Eso es ${NOMBRE_CIELO[cielo]}.${pend ? ' Anotalo, que esta noche es tuya.' : ' Ya lo tenés anotado, pero mirá lo nítido que está.'}`,
        'Los chicos encontraron la Cruz del Sur solos. Ernesto jura que vio un plato volador: era el farol de la estación.',
      ], alTerminar: () => { if (!n.estrellas.includes(d)) n.estrellas.push(d); if (pend) ctx.registrar?.(pend); ctx.guardar(); ctx.redibujar?.(); } };
    }
    return null;
  }

  // ---------------------------------------------------------------- dónde van (para aldea-gente.js)
  const cache = { t: -1, mapa: new Map() };
  function destino(k) {
    if (!activo()) return null;
    const t = Math.floor(hora() * 12) + dia() * 1000;
    if (cache.t !== t) { cache.t = t; cache.mapa = destinos(); }
    return cache.mapa.get(k) || null;
  }
  function destinos() {
    // (el concurso de la fiesta, en la plaza: lo dice concursos-juego.js)
    const m = new Map(ctx.concursos?.()?.destinos?.() || []), d = dia(), h = hora(), a = aldea();
    if (m.size) return m;
    if (clubAhora(d, h, a, fechaDeFiesta)) {
      m.set(CLUB_LECTURA.quien, { lugar: 'club', edificio: 'biblioteca', punto: 'cuentos' });
      asistentes('club', d, a).forEach((k, i) => m.set(k, { lugar: 'club', edificio: 'biblioteca', punto: `lectura-${i + 1}` }));
    } else if (estrellasAhora(d, h, a, fechaDeFiesta)) {
      m.set(NOCHE_ESTRELLAS.quien, { lugar: 'estrellas', edificio: 'plaza', punto: 'estar-1' });
      asistentes('estrellas', d, a).forEach((k, i) => m.set(k, { lugar: 'estrellas', edificio: 'plaza', punto: `estar-${i + 2}` }));
    }
    return m;
  }

  // ---------------------------------------------------------------- el calendario (extras para aldea-gente.js)
  const extrasCalendario = (d) => (activo() ? extrasDelAnio(d, conoce() ? opcionesCalendario(aldea()) : { aldea: null, fechas: [] }) : []);

  // ---------------------------------------------------------------- la página «Noticias» del cuaderno
  function dibujarCuaderno(ficha, el) {
    const n = estado(), d = dia();
    ficha.appendChild(el('h2', '', 'Noticias del valle'));
    // la radio
    ficha.appendChild(el('h3', '', `La radio: ${RADIO_ALDEA.nombre} (${RADIO_ALDEA.dial})`));
    if (!conoce()) ficha.appendChild(el('p', 'pista', 'Se transmite desde la estafeta de la aldea del sur: todavía no la conocés.'));
    const ul = el('ul', 'lista');
    for (const p of PROGRAMAS_RADIO) ul.appendChild(el('li', n.oidos[p.id] === d ? 'tiene' : '', `De ${p.desde} a ${p.hasta}: ${p.nombre}${n.oidos[p.id] ? ` (lo escuchaste el día ${n.oidos[p.id]})` : ''}`));
    ul.appendChild(el('li', '', `De ${PROGRAMAS_RADIO[PROGRAMAS_RADIO.length - 1].hasta} a ${PROGRAMAS_RADIO[0].desde}: los refugios lejanos, como siempre`));
    ficha.appendChild(ul);
    ficha.appendChild(el('p', 'texto', `La conduce ${RADIO_ALDEA.locutora} desde ${RADIO_ALDEA.desde}. Se oye con la radio del refugio o en la estación meteorológica.`));
    // el diario
    ficha.appendChild(el('h3', '', `«${DIARIO_ALDEA.nombre}»`));
    const eds = [...(n.diarios || [])].reverse();
    if (!eds.length) ficha.appendChild(el('p', 'pista', `${DIARIO_ALDEA.hacen}. Sale cada ${DIARIO_ALDEA.cada[ritmo()]} días${conoce() ? '' : ', desde que conocés la aldea'}.`));
    else {
      const e = eds[0];
      ficha.appendChild(el('p', 'anotado', `N.º ${e.n}, día ${e.dia}: ${e.titulo}`));
      for (const x of e.notas) ficha.appendChild(el('p', 'texto', `${x.seccion}: ${x.texto}`));
      if (eds.length > 1) ficha.appendChild(el('p', 'texto', `Ediciones anteriores: ${eds.slice(1).map((x) => `n.º ${x.n} («${x.titulo}»)`).join(' · ')}`));
    }
    // las cartas de lejos
    ficha.appendChild(el('h3', '', 'Cartas de lejos'));
    const por = cartasPorLeer(n);
    if (por.length) ficha.appendChild(el('p', 'pista', `Te ${por.length === 1 ? 'espera una carta' : `esperan ${por.length} cartas`} ${benignoEsta() ? 'en la estafeta: Benigno las guarda' : 'en el almacén: Ercilia las guarda'}.`));
    const leidas = cartasLeidas(n).sort((x, y) => n.cartas[y.id].dia - n.cartas[x.id].dia);
    for (const c of leidas) {
      ficha.appendChild(el('p', 'anotado', `Día ${n.cartas[c.id].dia}, de ${remitente(c)}:`));
      ficha.appendChild(el('p', 'texto', c.texto.join(' ')));
    }
    if (!por.length && !leidas.length) ficha.appendChild(el('p', 'texto', `Las cartas de tu familia y de los que vivieron antes en el valle llegan con el tren${conoce() ? '' : ', a la estafeta de la aldea'}.`));
    ficha.appendChild(el('p', 'texto', `${leidas.length} de ${CARTAS_LEJANAS.length} cartas leídas.`));
    // los concursos
    ctx.concursos?.()?.dibujarCuaderno?.(ficha, el);
    // el club y las estrellas
    ficha.appendChild(el('h3', '', 'Club de lectura y noche de estrellas'));
    const l = libroDeLaSemana(d);
    ficha.appendChild(el('p', 'texto', `El club se junta los ${['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos'][CLUB_LECTURA.diaSemana]} a las ${CLUB_LECTURA.desde} en la biblioteca; esta semana, «${l.titulo}», de ${l.autor}. Fuiste ${n.club.length} ${n.club.length === 1 ? 'vez' : 'veces'}.`));
    ficha.appendChild(el('p', 'texto', `La noche de estrellas es los ${['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos'][NOCHE_ESTRELLAS.diaSemana]} a las ${NOCHE_ESTRELLAS.desde}, en la plaza, cuando el observatorio de Valentina está abierto. Fuiste ${n.estrellas.length} ${n.estrellas.length === 1 ? 'vez' : 'veces'}.`));
  }

  return {
    activo, radio, actualizar, hablar, destino, extrasCalendario, dibujarCuaderno,
    estado: () => estado(),
    // (para las pruebas)
    __novedades: () => novedadesDelValle(progreso(), dia(), { concurso: resultado() }), __chismes: () => chismesDelValle(progreso(), dia(), romance()), __avisos: () => avisosDelValle(progreso(), dia()),
  };
}
