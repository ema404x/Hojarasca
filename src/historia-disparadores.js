// 4.15.0: cuándo y dónde se dispara cada escena del acto I de la Historia, y qué cambia en la partida cuando se ve. Módulo PURO (sin three
// ni DOM; se prueba en Node). Las escenas en sí (cámara, diálogos) son datos que escribe `historia-escenas-acto1.js` con el formato de
// `escenas.js`; acá sólo está el «cuándo» y el «qué cambia».
//
// Un disparador dice, para una escena:
//   cap:        id del capítulo en que vale (o una lista)
//   modo:       'auto' (sale sola cuando se cumplen las condiciones) | 'hablar' (al apretar E sobre el vecino `clave`) | 'interaccion' (al apretar E en
//               el objeto del mundo `clave`, ver OBJETOS)
//   clave:      el vecino o el objeto de los modos 'hablar' e 'interaccion'
//   requiere:   escenas que tienen que estar vistas
//   no:         escenas que NO tienen que estar vistas (por ejemplo, la escena hermana de otra decisión)
//   lugar:      [nombre, radio] estar a menos de `radio` metros del lugar (los arma el juego: ver LUGARES_HISTORIA)
//   hora:       [desde, hasta) la hora del juego (cruza la medianoche si desde > hasta)
//   despues:    true: sólo después del día en que empezó el capítulo (por ejemplo «al despertar»)
//   cond:       (s, h, ctx) => bool, el resto de las condiciones
// Que una escena nunca trabe un capítulo: las que son objetivo tienen un disparo que se alcanza siempre (la tecla E sobre el vecino o el objeto).

import { capituloActual, marcarTema, marcarObjeto, marcarEntrega, anotarRaro, cambiarLazo, sumarRamal, duendesDe, horaEntre, lazoDe } from './historia.js';
// 4.16.0: el acto II (capítulos 5 a 8)
import { DISPARADORES_ACTO2, EFECTOS_ESCENA_ACTO2, OBJETOS_ACTO2, LUGARES_ACTO2, cuadernoVisible } from './historia-disparadores-acto2.js';
// 4.17.0 (C): dónde se pone al jugador antes de las escenas de los actos I y II (historia-colocacion.js)
import { COLOCACION_PULIDO } from './historia-colocacion.js';

// Los lugares con nombre de los que el juego pasa la distancia (los arma `distanciasHistoria` de main.js): los del mundo, los de la aldea y
// los propios de la historia
export const LUGARES_HISTORIA = ['refugio', 'refugio-puerta', 'tocon-hacha', 'estacion', 'sendero', 'aldea', 'plaza', 'ramos', 'casa-te', 'molino', 'molino-viejo', 'galpon', 'faro', 'mirador', 'puesto', ...LUGARES_ACTO2];

const en = (nombre, radio) => [nombre, radio];

export const DISPARADORES = {
  // ---- capítulo 1 · La llave del molinero
  'trochita-boleto': { cap: 'llave', modo: 'auto' },
  'estacion-llegada': { cap: 'llave', modo: 'auto', requiere: ['trochita-boleto'] },
  'algo-cruza': { cap: 'llave', modo: 'auto', requiere: ['estacion-llegada'], lugar: en('sendero', 14), hora: [16, 22] },
  'nota-eusebio': { cap: 'llave', modo: 'interaccion', clave: 'puerta-refugio', requiere: ['estacion-llegada'] },
  'ronda-umbral': { cap: 'llave', modo: 'auto', requiere: ['nota-eusebio'], despues: true, lugar: en('refugio-puerta', 14), hora: [5.5, 12] },   // (4.16.0: cerca de la puerta, donde está la ronda: la escena se pone ahí)
  // ---- capítulo 2 · La bolsa del molinero
  'ramon-tranquera': { cap: 'bolsa', modo: 'auto', lugar: en('refugio', 30), hora: [7.5, 13] },
  'ramon-tranquera:hablar': { escena: 'ramon-tranquera', cap: 'bolsa', modo: 'hablar', clave: 'ramon' },
  'almacen-ercilia': { cap: 'bolsa', modo: 'auto', lugar: en('ramos', 9), requiere: ['ramon-tranquera'] },
  'almacen-ercilia:hablar': { escena: 'almacen-ercilia', cap: 'bolsa', modo: 'hablar', clave: 'ercilia', requiere: ['ramon-tranquera'] },
  'ese-no-josefina': { cap: 'bolsa', modo: 'auto', requiere: ['ramon-tranquera'], cond: (s, h, ctx) => !!s.hacha && !!ctx?.apuntaArbolVivo },
  'bolsa-alero': { cap: 'bolsa', modo: 'auto', lugar: en('refugio', 40), cond: (s) => (s.reparaciones.alero || 0) >= 4 },
  'bolsa-coihue': { cap: 'bolsa', modo: 'interaccion', clave: 'raiz-coihue', requiere: ['bolsa-alero'], cond: (s) => s.decisiones.bolsa === 'a' },
  'bolsa-rosa': { cap: 'bolsa', modo: 'hablar', clave: 'panadera', requiere: ['bolsa-alero'], cond: (s) => s.decisiones.bolsa === 'b' },
  'bolsa-josefina': { cap: 'bolsa', modo: 'hablar', clave: 'ema', requiere: ['bolsa-alero'], cond: (s) => s.decisiones.bolsa === 'c' },
  // ---- capítulo 3 · La mesa larga
  'hacha-tocon': { cap: 'mesa', modo: 'auto', lugar: en('tocon-hacha', 14), hora: [6, 13] },   // (4.16.0: al acercarte al tocón, donde está el hacha)
  'placa-herminia': { cap: 'mesa', modo: 'auto', lugar: en('plaza', 14), hora: [8, 20] },
  'mesa-visita-nicanor': { cap: 'mesa', modo: 'auto', hora: [15.5, 20], cond: (s, h, ctx) => ctx?.visitaActiva === 'nicanor' },
  'mesa-visita-ramon': { cap: 'mesa', modo: 'auto', hora: [15.5, 20], cond: (s, h, ctx) => ctx?.visitaActiva === 'ramon' },
  'fermin-galpon': { cap: 'mesa', modo: 'hablar', clave: 'fermin' },
  // ---- capítulo 4 · La señora del ramal
  'anden-graciela': { cap: 'ramal', modo: 'auto', lugar: en('estacion', 30), hora: [9, 23] },
  'cabina-elsa': { cap: 'ramal', modo: 'auto', requiere: ['anden-graciela'], cond: (s) => s.conduciendo },
  'derrumbe-puertita': { cap: 'ramal', modo: 'auto', requiere: ['anden-graciela'], cond: (s) => s.eventos.has('derrumbe') },
  'te-graciela': { cap: 'ramal', modo: 'auto', requiere: ['anden-graciela'], lugar: en('casa-te', 14), cond: (s) => s.acompanante === 'graciela' },
  // ---- capítulos 5 a 8 (el acto II: historia-disparadores-acto2.js)
  ...DISPARADORES_ACTO2,
};
// La lista de los 21 ids de escena que escribe el otro agente (historia-escenas-acto1.js)
export const ESCENAS_ACTO1_IDS = ['trochita-boleto', 'estacion-llegada', 'algo-cruza', 'nota-eusebio', 'ronda-umbral', 'ramon-tranquera', 'almacen-ercilia', 'ese-no-josefina', 'bolsa-alero', 'bolsa-coihue', 'bolsa-rosa', 'bolsa-josefina', 'hacha-tocon', 'placa-herminia', 'mesa-visita-nicanor', 'mesa-visita-ramon', 'fermin-galpon', 'anden-graciela', 'cabina-elsa', 'derrumbe-puertita', 'te-graciela'];
const escenaDe = (clave, d) => d.escena || clave;

// ¿Qué escena toca ahora? `ctx`: { modo: 'auto' | 'hablar' | 'interaccion', clave, apuntaArbolVivo, visitaActiva }. Devuelve el id o null.
export function escenaPendiente(h, s, ctx = {}) {
  if (!h?.activa || h.fase !== 'jugando' || !s) return null;
  const cap = capituloActual(h).id;
  const modo = ctx.modo || 'auto';
  for (const [k, d] of Object.entries(DISPARADORES)) {
    const id = escenaDe(k, d);
    if (d.modo !== modo) continue;
    if (!(Array.isArray(d.cap) ? d.cap.includes(cap) : d.cap === cap)) continue;
    if ((modo === 'hablar' || modo === 'interaccion') && d.clave !== ctx.clave) continue;
    if (s.escenas.has(id)) continue;
    if (d.requiere && !d.requiere.every((x) => s.escenas.has(x))) continue;
    if (d.no && d.no.some((x) => s.escenas.has(x))) continue;
    if (d.lugar && !(Number(s.lugares?.[d.lugar[0]]) <= d.lugar[1])) continue;
    if (d.hora && !horaEntre(s.horas, d.hora[0], d.hora[1])) continue;
    if (d.despues && !(s.dia > (Number(h.base?.dia) || 1))) continue;
    if (d.cond && !d.cond(s, h, ctx)) continue;
    return id;
  }
  return null;
}
// ¿Hay alguna escena con este vecino (o este objeto) que se pueda disparar ahora? (para el aviso)
export const escenaConClave = (h, s, modo, clave, ctx = {}) => escenaPendiente(h, s, { ...ctx, modo, clave });

// ---------------------------------------------------------------- lo que cambia al ver una escena
// Cada efecto corre UNA vez (se anota en `h.aplicadas`), cuando la escena aparece como vista: así vale igual si se la salteó, y si se cerró
// el juego justo al terminar se aplica al volver. `ctx`: { eventos (progreso.eventosValle.hechos) }.
const T = (quien, tema) => (h, dia) => marcarTema(h, quien, tema, dia);
const juntar = (...fs) => (h, dia, ctx) => { for (const f of fs) f(h, dia, ctx); };
const raro = (id) => (h, dia) => anotarRaro(h, id, dia);
const lazo = (q, n) => (h) => cambiarLazo(h, q, n);
export const EFECTOS_ESCENA = {
  'nota-eusebio': (h, dia) => marcarObjeto(h, 'nota', dia),
  'ramon-tranquera': T('ramon', 'alero'),
  'almacen-ercilia': T('ercilia', 'hacha'),
  'ese-no-josefina': T('ema', 'ese-no'),
  'bolsa-alero': (h, dia) => marcarObjeto(h, 'bolsa-eusebio', dia),
  'bolsa-coihue': juntar((h, dia) => marcarEntrega(h, 'raiz', 'bolsa-eusebio', dia), (h) => { duendesDe(h).convidado = Math.min(99, duendesDe(h).convidado + 1); }),
  'bolsa-rosa': (h, dia) => marcarEntrega(h, 'panadera', 'bolsa-eusebio', dia),
  'bolsa-josefina': juntar((h, dia) => marcarEntrega(h, 'ema', 'bolsa-eusebio', dia), T('ema', 'abuelo')),
  'placa-herminia': T('herminia', 'placa'),
  'mesa-visita-nicanor': T('nicanor', 'mesa'),
  'mesa-visita-ramon': T('ramon', 'mesa'),
  'fermin-galpon': T('fermin', 'galpon'),
  'anden-graciela': (h) => { h.acompanante = 'graciela'; },
  'cabina-elsa': T('guarda', 'cabina'),
  'te-graciela': T('graciela', 'abuelo'),
  // 4.16.0: el acto II
  ...EFECTOS_ESCENA_ACTO2,
};

// Los lazos que mueven las respuestas del jugador en una escena. La respuesta se guarda como `elecciones[escena][eleccion] = opcion`; acá se
// busca por el id de la elección y de la opción. Lo que no está en la tabla no mueve nada. (Los ids son el acuerdo con quien escribe las
// escenas: ver CAMBIOS_4_15_0_A.md.)
export const LAZOS_POR_ELECCION = {};   // (4.15.0: con las escenas de B, los lazos los dan los efectos `lazo:<quien>:<n>` de cada opción)

// Aplica lo que falte de las escenas vistas. Devuelve los ids aplicados.
export function aplicarVistas(h, dia = 1, ctx = {}) {
  const aplicados = [];
  if (!h?.escenas?.vistas) return aplicados;
  if (!h.aplicadas || typeof h.aplicadas !== 'object' || Array.isArray(h.aplicadas)) h.aplicadas = {};
  for (const id of Object.keys(h.escenas.vistas)) {
    if (Object.hasOwn(h.aplicadas, id)) continue;
    const f = Object.hasOwn(EFECTOS_ESCENA, id) ? EFECTOS_ESCENA[id] : null;
    const tabla = Object.hasOwn(LAZOS_POR_ELECCION, id) ? LAZOS_POR_ELECCION[id] : null;
    if (!f && !tabla) continue;
    h.aplicadas[id] = Math.max(1, Math.floor(Number(dia) || 1));
    try { f?.(h, dia, ctx); } catch { /* una escena rota no traba lo demás */ }
    if (tabla) {
      const el = h.escenas.elecciones && Object.hasOwn(h.escenas.elecciones, id) ? h.escenas.elecciones[id] : {};
      for (const [eleccion, opciones] of Object.entries(tabla)) {
        const op = Object.hasOwn(el, eleccion) ? el[eleccion] : null;
        const lz = op && Object.hasOwn(opciones, op) ? opciones[op] : null;
        if (lz) for (const [q, n] of Object.entries(lz)) if (n) cambiarLazo(h, q, n);
      }
    }
    aplicados.push(id);
  }
  return aplicados;
}

// Lo que se anota en el cuaderno de lo raro al cerrar un capítulo, según lo decidido (la tarjeta de cierre del capítulo 2)
export function alCerrarCapitulo(h, capId, dia = 1) {

  // la ingeniera sigue su camino: se queda en el hospedaje de la aldea
  if (capId === 'ramal') h.acompanante = null;
  // Graciela con muy buen lazo suma a la cuenta del ramal (se cuenta una sola vez)
  if (capId === 'ramal' && lazoDe(h, 'graciela') >= 2 && !h.aplicadas?.['ramal:graciela']) {
    if (!h.aplicadas || typeof h.aplicadas !== 'object') h.aplicadas = {};
    h.aplicadas['ramal:graciela'] = Math.max(1, Math.floor(Number(dia) || 1));
    sumarRamal(h, 2);
  }
}

// ---------------------------------------------------------------- los objetos de historia en el mundo
// Cada uno: dónde (en coordenadas locales del refugio: x a la derecha, z hacia donde mira la puerta), cuándo se ve, y qué hace la E.
// `clave` es el id del objeto en `interaccion` de los disparadores y en `h.objetos` (lo levantado).
export const OBJETOS = {
  'ronda': { forma: 'ronda', lx: 0.1, lz: 3.7, visible: (s) => (s.escenas.has('ronda-umbral') || s.temas.has('mundo:ronda-ramitas')) && !s.objetos.has('canto-blanco') },   // (4.17.0: también mientras corre la escena, que la pone con un efecto)
  'canto-blanco': { forma: 'canto', lx: 0.1, lz: 3.7, visible: (s) => (s.escenas.has('ronda-umbral') || s.temas.has('mundo:ronda-ramitas')) && !s.objetos.has('canto-blanco'),
    aviso: 'Mirar el canto blanco del umbral', marca: 'canto-blanco', nota: ['Un canto blanco', 'Liso como un huevo. Lo dejás en la repisa, al lado de la ventana'] },
  'nota-mesa': { forma: 'nota', lx: 1.1, lz: -0.6, visible: (s, h) => s.escenas.has('nota-eusebio') && !cuadernoVisible(h, s),
    aviso: 'Releer la nota de Eusebio', nota: ['La nota de Eusebio', 'No toques el frasco de la repisa, que es masa madre de 1987. Y gracias. E. M.'] },
  'bolsa-eusebio': { forma: 'bolsa', lx: 2.6, lz: 3.3, visible: (s) => s.escenas.has('bolsa-alero') && s.decisiones.bolsa == null,
    aviso: 'Releer la nota de la bolsa', nota: ['La nota de la bolsa', 'Para la raíz del coihue grande del molino viejo, antes del primer frío. No te olvides, que ellos no se olvidan. Y gracias. E. M.'] },
  'alero': { forma: 'alero', lx: 2.6, lz: 3.3, visible: (s) => (s.reparaciones.alero || 0) < 4,
    aviso: 'Cambiar una tabla del alero', reparacion: { id: 'alero', n: 4 } },
  'puertita': { forma: 'puertita', lx: -0.5, lz: 3.5, visible: (s) => s.escenas.has('derrumbe-puertita') && !s.objetos.has('puertita'),
    aviso: 'Guardar la puertita en la repisa', marca: 'puertita', nota: ['La puertita', 'De coihue, del tamaño de una mano, con bisagra de cuero. Queda en la repisa, mirando al arroyo'] },
  'hacha-tocon': { forma: 'hacha-tocon', lx: -5.5, lz: 6.0, visible: (s, h) => capituloActual(h).id === 'mesa' },
  // la raíz del coihue grande: el lugar lo elige el juego (el coihue más grande cerca del molino viejo)
  'raiz-coihue': { forma: 'raiz', lugar: 'molino-viejo', visible: (s) => s.decisiones.bolsa === 'a' && !s.escenas.has('bolsa-coihue'),
    aviso: 'Dejar la bolsa de Eusebio en la raíz del coihue', escena: 'bolsa-coihue' },
  // 4.16.0: los del acto II y los props del acto I que antes sólo dejaban una marca
  ...OBJETOS_ACTO2,
};
export const RADIO_OBJETO = 2.4;

// 4.16.0: dónde se pone al jugador antes de empezar una escena anclada a algo del refugio (la nota adentro, la ronda de ramitas en el umbral, el hacha
// en el tocón, el alero), en coordenadas locales del refugio (x a la derecha, z hacia donde mira la puerta); `mira`: hacia qué punto local mira. Las escenas
// anclan sus planos al jugador (`FRENTE(…)`): si empezaban con vos mirando para cualquier lado, la cámara miraba el pasto.
export const COLOCACION_ESCENA = {
  'nota-eusebio': { lx: 0.1, lz: 0.5, mira: [1.1, -0.98] },   // (la mesa del refugio está en (1,1; −0,98) de su estructura)
  'ronda-umbral': { lx: 0.1, lz: 5.4, mira: [0.1, 3.7] },
  'hacha-tocon': { lx: -2.2, lz: 9.0, mira: [-5.5, 6.0] },
  'bolsa-alero': { lx: 2.6, lz: 5.6, mira: [2.6, 3.3] },
  ...COLOCACION_PULIDO,   // (4.17.0: las de un lugar o una persona, no del refugio)
};

// Los objetos que se ven ahora
export function objetosVisibles(h, s) {
  if (!h?.activa || !s) return [];
  const salida = [];
  for (const [id, o] of Object.entries(OBJETOS)) { try { if (o.visible(s, h)) salida.push(id); } catch { /* ya */ } }
  return salida;
}
// Qué hace la E sobre un objeto (cuando está cerca): { tipo: 'marca' | 'nota' | 'reparar' | 'escena', ... } o null
export function accionDeObjeto(id, h, s) {
  if (!Object.hasOwn(OBJETOS, id)) return null;
  const o = OBJETOS[id];
  if (!o.visible(s, h)) return null;
  if (o.reparacion) return { tipo: 'reparar', id: o.reparacion.id, n: o.reparacion.n, aviso: `${o.aviso} (${Math.min(o.reparacion.n, s.reparaciones[o.reparacion.id] || 0) + 1} de ${o.reparacion.n}) · 1 tabla` };
  if (o.escena) return { tipo: 'escena', escena: o.escena, aviso: o.aviso };
  if (o.pagina) return { tipo: 'pagina', aviso: `${o.aviso} (página ${Math.min(3, [1, 2, 3].filter((n) => s.temas.has(`cuaderno:${n}`)).length + 1)} de 3)` };
  if (o.marca) return { tipo: 'marca', marca: o.marca, nota: o.nota, aviso: o.aviso, raro: o.raro || null, limpiaAcompanante: !!o.limpiaAcompanante };
  if (o.nota) return { tipo: 'nota', nota: o.nota, aviso: o.aviso };
  return null;
}

// La E sobre la puerta del refugio (la llave de Eusebio): sólo mientras la escena de la nota espera
export function avisoPuerta(h, s) {
  const id = escenaConClave(h, s, 'interaccion', 'puerta-refugio');
  return id ? 'Abrir con la llave de Eusebio' : null;
}

// ---------------------------------------------------------------- el comienzo de una Historia nueva
// Una Historia nueva arranca en la Estación del Valle al caer la tarde del primer día (el tren que te trae). Se aplica una sola vez.
export const COMIENZO = { horas: 18.25 };
