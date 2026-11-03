// 4.15.0: la Historia nueva, «El trato del molino» (guion en GUION_HISTORIA.md). Trece capítulos en un año del valle
// (verano, otoño, invierno y el epílogo). Reemplaza a los ocho capítulos de la 3.1: cada capítulo tiene una tarjeta de
// entrada, objetivos que se tildan solos mirando lo que de verdad pasa en la partida, una tarjeta de cierre (que puede
// cambiar una línea según lo que se decidió) y un premio.
//
// En esta versión los capítulos 1 a 4 (el acto I) están completos; del 5 al 13 están definidos (título y tarjetas de
// entrada y de cierre del guion) pero con un objetivo de «continuará» que pasa de capítulo sin trabar nada: el acto II
// y el III se hacen en las versiones que siguen.
//
// No traba nada: todo lo del juego libre sigue abierto antes, durante y después. Un objetivo cumplido queda cumplido
// (aunque después gastes las tablas). Lo que se mide "desde ahora" (peces, árboles, fletes) se cuenta desde que empezó
// el capítulo; lo que es "tener" (el banco, la mesa) vale aunque ya lo tuvieras.
//
// Módulo puro (se prueba en Node): recibe un `estado` armado por el juego (ver `estadoHistoria`) y la parte guardada
// (`progreso.historia`).

import { contadores } from './encargos-temporada.js';
import { mesaPuesta, recibidas } from './visitas.js';
import { CUENTOS } from './cuentos.js';
// 4.14.0: las escenas vistas (progreso.historia.escenas)
import { sanearEscenas, escenasNuevas } from './escenas.js';
// 4.13.0 (B): lo que guarda la noche de defensa del final (historia-noche.js)
import { nocheNueva, sanearNoche } from './historia-noche.js';
// 4.15.0: los textos del acto I (el cuaderno de lo raro)
import { TEXTO_ACTO1 } from './historia-texto-acto1.js';
// 4.16.0: y los del acto II (los escribe otro agente; mismo formato)
import { TEXTO_ACTO2 } from './historia-texto-acto2.js';
// 4.17.0: y los del acto III (el cuaderno de lo raro)
import { TEXTO_ACTO3 } from './historia-texto-acto3.js';
// 4.18.0: y los de las subtramas optativas (los escribe B: el cuaderno de lo raro nuevo)
import { TEXTO_OPTATIVAS } from './historia-texto-optativas.js';
// 4.18.2: y los del lazo de los vecinos que no lo tenían (la guía, el final y la charla de después; los escribe B)
import { TEXTO_LAZOS } from './historia-texto-lazos.js';
// 4.18.3: lo que se lleva de regalo (algo rico a Ramón, lo dulce para la torta de Herminia)
import { cuentaDe, regaloDeProgreso } from './historia-regalos.js';

// 4.15.0: Fermín (el galpón de esquila) se suma a los que se conocen
export const VECINOS_HISTORIA = ['ramon', 'nicanor', 'ema', 'ercilia', 'fermin'];
const NOMBRES = { ramon: 'Don Ramón', nicanor: 'Nicanor', ema: 'Josefina', ercilia: 'Ercilia', fermin: 'Fermín', guarda: 'Elsa', graciela: 'Graciela', rosa: 'Rosa', tobias: 'Tobías', tito: 'Tito', belisario: 'Belisario', herminia: 'Herminia', sofia: 'Sofía' };

// La versión de la historia que se guarda con la partida: 2 es «El trato del molino». Una historia de antes no la trae (ver historia-reinicio.js).
export const VERSION_HISTORIA = 2;

// Los que tienen un lazo con vos (−2 frío … +3 de la casa)
// PERSONAS_LAZO son los seis con arco (la noche, los encargos de la mesa, los finales largos): no cambia. Los siete de abajo son vecinos con lazo
// y nada más (4.18.2): entran en `LAZOS_TODOS` (guardado, guía, condición de escena, final y charla de después, encargos y optativas) y NO son
// aliados de la noche ni acompañantes.
export const PERSONAS_LAZO = ['ramon', 'ema', 'ercilia', 'guarda', 'fermin', 'graciela'];
export const PERSONAS_LAZO_VECINOS = ['rosa', 'tobias', 'tito', 'belisario', 'herminia', 'nicanor', 'sofia'];
export const LAZOS_TODOS = [...PERSONAS_LAZO, ...PERSONAS_LAZO_VECINOS];
export const LAZO_MIN = -2, LAZO_MAX = 3;
// 4.16.0: quién puede ir con vos a pie (Graciela desde el capítulo 4; Tobías en el 5)
export const ACOMPANANTES = [...PERSONAS_LAZO, 'tobias'];
// 4.17.0: D5 `majada` (capítulo 9) y D6 `duendes` (capítulo 10: a y b = trato, c = pelea)
export const DECISIONES = ['bolsa', 'coihue', 'molienda', 'cuaderno', 'majada', 'duendes'];
// 4.19.0: en qué capítulo se toma cada decisión (el objetivo `decision(D)` de ese capítulo). Lo usa el truco «historia capitulo N» para tomar por la primera opción las de los capítulos que salta.
export const CAPITULO_DE_DECISION = { bolsa: 'bolsa', coihue: 'rueda', molienda: 'cosecha', cuaderno: 'cuaderno', majada: 'frios', duendes: 'golpea' };
export const PRESTADOS = ['herrero', 'apicultor', 'maquinista', 'guarda', 'tobias', 'zaino'];
// 4.17.0: las defensas que se piden prestadas para la noche (cadena C del capítulo 11) y quién las presta en la aldea (null: siempre está)
export const PRESTADOS_NOCHE = ['herrero', 'apicultor', 'maquinista', 'guarda'];
export const PRESTAMISTA = { herrero: 'herrero', apicultor: 'apicultor', maquinista: null, guarda: null };
export const AMANECERES = ['amanecer-trato-ganada', 'amanecer-trato-perdida', 'amanecer-pelea-ganada', 'amanecer-pelea-perdida'];
export const RAMAL_SALVADO = 10, RAMAL_A_PRUEBA = 6, RAMAL_MAX_FLETES = 8, RAMAL_BARRA = 10;
const TOPE_RARO = 160;   // 4.17.1: lo raro, 160 (hay 108 indicios y cada uno se anota una vez: con 60 el cuaderno dejaba de anotar a mitad del acto III)
// 4.19.0: las marcas (temas, objetos, entregados, aplicadas): 400 (eran 200 y las escenas llegaban a ~190: dos escenas más y se pasaba). Una partida vieja tiene menos de 200: no se rompe nada
export const TOPE_MARCAS = 400;

// Lo que el juego sabe de la partida, en números y banderas. `extra` trae lo que no está en el guardado: el fuego
// prendido, si manejás la trochita o vas en el velero, las obras terminadas ({ id, x, z }), a qué distancia estás de
// cada lugar con nombre (`lugares`), la estación del año y si estás sentado.
export function estadoHistoria(p, extra = {}) {
  const e = p?.entradas || {};
  const c = contadores(p || {});
  const terminadas = Array.isArray(extra.terminadas) ? extra.terminadas : [];
  const ids = new Set(terminadas.map((o) => o.id));
  const encargos = Object.values(p?.encargos || {});
  const cantidad = (k) => Number(e[k]?.cantidad) || 0;
  let lena = 0;
  for (const o of p?.obras || []) if (o?.plano === 'lenera') lena += Math.max(0, Number(o.lenera?.secos) || 0);
  const ev = p?.eventosValle?.hechos || {};
  const hh = obj(p?.historia);
  const marcas = (k) => new Set(Object.keys(obj(hh[k])));
  return {
    dia: Math.max(1, Math.floor(Number(p?.dia) || 1)),
    horas: Number.isFinite(Number(p?.horas)) ? Number(p.horas) : 12,   // 3.8.7: para el fin del temporal (a la mañana)
    anotaciones: Object.keys(e).length,
    refugio: !!e.refugio,
    fuego: !!extra.fuego || !!e.fogata,
    hacha: !!p?.cosas?.hacha,
    talados: c.talados,
    peces: c.peces,
    tablas: (Number(p?.materiales?.tabla) || 0) + (Number(p?.acopio?.tabla) || 0),
    terminadas: ids,
    mesa: !!mesaPuesta(terminadas),
    hablados: Object.keys(hh.hablados || {}).filter((k) => VECINOS_HISTORIA.includes(k)),
    vecinos: extra.vecinos !== false,
    aceptados: encargos.filter((x) => x === 'pedido' || x === 'hecho').length,
    encargosHechos: encargos.filter((x) => x === 'hecho').length,
    viaje: !!e.viaje,
    conduciendo: !!extra.conduciendo,
    entregas: Math.max(0, Math.floor(Number(p?.comercio?.entregas) || 0)),
    enVela: !!extra.enVela,
    sembrados: Object.keys(p?.huerta || {}).length,
    // 3.5.1: lo cosechado en total (no lo que queda: lo que se gasta en el molino o la cocina lo
    // escondía, y la frutilla y el calafate no contaban). Una partida sin la cuenta usa lo de antes.
    cosechas: Number.isFinite(Number(p?.cosechasTotal)) && p?.cosechasTotal != null ? Math.max(0, Math.floor(Number(p.cosechasTotal))) : cantidad('haba') + cantidad('papa') + cantidad('frutilla-huerta'),
    lena,
    abrigo: !!(p?.cosas?.manta || p?.cosas?.poncho),
    visitas: recibidas(p?.visitas),   // 3.8.3: las que vinieron de verdad (no el turno, que también pasa si no pudo venir)
    cuentos: CUENTOS.filter((x) => e[x.id]).length,
    eventos: new Set(Object.keys(ev)),
    // 4.13.0: lo de los duendes (ver `duendesNuevos`): el trato del encuentro y las armas conseguidas
    trato: hh.duendes?.trato === 'trato' || hh.duendes?.trato === 'pelea' ? hh.duendes.trato : null,
    armas: { arco: hh.duendes?.armas?.arco === true, honda: hh.duendes?.armas?.honda === true },
    // 3.8.3: el día en que pasó cada uno (lo último), para lo que tiene que pasar en el capítulo (el temporal)
    eventosDia: Object.fromEntries(Object.entries(ev).map(([k, x]) => [k, Math.max(0, Math.floor(Number(x?.dia) || 0))])),
    // 4.15.0: lo de la Historia nueva
    lugares: obj(extra.lugares),                           // metros hasta cada lugar con nombre (los arma el juego)
    estacion: ['verano', 'otono', 'invierno'].includes(extra.estacion) ? extra.estacion : 'verano',
    sentado: !!extra.sentado,
    apuntaArbolVivo: !!extra.apuntaArbolVivo,   // mirás con el hacha un árbol vivo (la escena «Ese no»)
    visitaActiva: typeof extra.visitaActiva === 'string' ? extra.visitaActiva : null,   // quién está de visita en tu mesa
    escenas: new Set(Object.keys(obj(hh.escenas?.vistas))),
    decisiones: Object.fromEntries(DECISIONES.map((d) => [d, hh.decisiones && ['a', 'b', 'c'].includes(hh.decisiones[d]) ? hh.decisiones[d] : null])),
    temas: marcas('temas'),
    objetos: marcas('objetos'),
    entregados: marcas('entregados'),
    reparaciones: Object.fromEntries(Object.entries(obj(hh.reparaciones)).map(([k, n]) => [k, ent(n, 99)])),
    acompanante: typeof extra.acompanante === 'string' ? extra.acompanante : (typeof hh.acompanante === 'string' ? hh.acompanante : null),
    ramal: ent(hh.ramal, 99),
    molido: ent(hh.molido, 9999),
    fletesHarina: ent(hh.fletesHarina, 9),
    // 4.16.0: el acto II (otoño)
    estacionNatural: ['verano', 'otono', 'invierno'].includes(extra.estacionNatural) ? extra.estacionNatural : (['verano', 'otono', 'invierno'].includes(extra.estacion) ? extra.estacion : 'verano'),
    caballo: !!p?.cosas?.caballo,
    harina: ent(p?.cosas?.harina, 9999),
    piedra: ent(p?.materiales?.piedra, 9999) + ent(p?.acopio?.piedra, 9999),
    cocinadas: Object.values(obj(p?.cocina?.hechas)).reduce((a, n) => a + ent(n, 1e6), 0),
    enKayak: !!extra.enKayak,
    // los aserraderos terminados respecto del coihue grande (`extra.coihue`: { x, z }): alguno a más de 25 m / alguno cerca
    aserradero: aserraderosDe(terminadas, extra.coihue),
    lazos: Object.fromEntries(LAZOS_TODOS.map((k) => [k, lazoDe(hh, k)])),   // (4.18.2: y los siete vecinos)
    pobladores: new Set((Array.isArray(p?.aldea?.pobladores) ? p.aldea.pobladores : []).map((x) => x?.clave).filter((x) => typeof x === 'string')),
    // 4.17.0: el acto III (invierno): lo prestado, la deuda del trato, la noche, los blancos de práctica y lo que se junta para el arco y la honda
    prestado: Object.fromEntries(PRESTADOS.map((k) => [k, obj(hh.prestado)[k] === true])),
    deuda: ent(hh.duendes?.deuda, 99), perdon: hh.duendes?.perdon === true, convidado: ent(hh.duendes?.convidado, 99),
    nocheEstado: ['pendiente', 'ganada', 'perdida'].includes(hh.duendes?.noche) ? hh.duendes.noche : 'ninguna',
    final: hh.duendes?.final === 'trato' || hh.duendes?.final === 'pelea' ? hh.duendes.final : null,
    blancos: { paso: ent(obj(hh.blancos).paso, 99), esquila: ent(obj(hh.blancos).esquila, 99) },
    cuidados: Object.keys(obj(hh.temas)).filter((k) => k.startsWith('majada:dia')).length,
    plumas: cantidad('pluma'), cantos: cantidad('canto'), lana: ent(p?.materiales?.lana, 9999) + ent(p?.acopio?.lana, 9999),
    pesos: ent(p?.economia?.pesos, 99999999),
    puestoFeria: !!p?.negocios?.casas?.puesto,   // 4.21.0: el puesto propio en la feria (propiedad.js), una de las metas con plata
    amor: extra.amor === true, perro: extra.perro === true,
    yerba: ent(p?.cosas?.yerba, 99999), llave79: !!p?.cosas?.['llave-79'],
    prestadoN: prestadosContados(hh.prestado, Array.isArray(p?.aldea?.pobladores) ? p.aldea.pobladores.map((x) => x?.clave) : []),
    // 4.18.0: lo que miran las optativas (historia-optativas.js): los encargos, la opción de cada evento del valle, el día en que se ofreció
    // cada optativa (`optativa:<id>` en los temas), el pan casero, el cumpleaños de hoy en la aldea y la cinta del concurso de dulces
    encargos: { ...obj(p?.encargos) },
    eventosOpcion: Object.fromEntries(Object.entries(ev).map(([k, x]) => [k, typeof x?.opcion === 'string' ? x.opcion : null])),
    ofrecidas: Object.fromEntries(Object.entries(obj(hh.temas)).filter(([k]) => k.startsWith('optativa:')).map(([k, d]) => [k.slice(9), ent(d)])),
    pan: Math.min(9999, cuentaDe(p, 'pan-casero')), tablasCoihue: ent(p?.cosas?.['tabla-coihue'], 9999),
    // 4.18.3: el regalo que llevarías ahora (el id de la mochila, o null): algo rico para Ramón y lo dulce para la torta de Herminia
    regaloRamon: regaloDeProgreso('ramon', p)?.k || null, regaloTorta: regaloDeProgreso('herminia', p)?.k || null,
    cumple: extra.cumple && typeof extra.cumple === 'object' ? extra.cumple : null,
    cintaDulce: (Array.isArray(p?.concursos?.cintas) ? p.concursos.cintas : []).some((x) => x?.id === 'dulce' && Number(x.puesto) >= 1 && Number(x.puesto) <= 3),
  };
}

// 4.17.0: cuántas defensas prestadas cuentan para la noche. Quien presta y todavía no vive en la aldea (el herrero, el apicultor) no traba nada:
// su defensa se da por prestada (la noche la arma igual, con otra mano).
export function prestadosContados(prestado, pobladores = []) {
  const vive = new Set((pobladores || []).filter((x) => typeof x === 'string'));
  let n = 0;
  for (const k of PRESTADOS_NOCHE) if (obj(prestado)[k] === true || (PRESTAMISTA[k] && !vive.has(PRESTAMISTA[k]))) n++;
  return n;
}
// Las defensas que tiene la noche: las prestadas (o las que se dan por prestadas) y la pirca de Tobías si hay (D2 = c)
export function defensasDeNoche(h, pobladores = []) {
  const vive = new Set((pobladores || []).filter((x) => typeof x === 'string'));
  const d = { estacas: false, miel: false, campana: false, empalizada: false, pirca: false };
  const lo = (k) => obj(h?.prestado)[k] === true || (PRESTAMISTA[k] && !vive.has(PRESTAMISTA[k]));
  d.estacas = !!lo('herrero'); d.miel = !!lo('apicultor'); d.campana = !!lo('maquinista'); d.empalizada = !!lo('guarda');
  d.pirca = obj(h?.decisiones).coihue === 'c' || obj(h?.objetos).pirca !== undefined;
  return d;
}
// Cuántos «convites» hubo con los duendes (D1 = a, D3 = c, D2 = a o c): con dos o más, el lazo es de convidado
export function convidadosDe(h) {
  const d = obj(h?.decisiones);
  return (d.bolsa === 'a' ? 1 : 0) + (d.molienda === 'c' ? 1 : 0) + (d.coihue === 'a' || d.coihue === 'c' ? 1 : 0);
}
export const esConvidado = (h) => convidadosDe(h) >= 2;
// Los objetivos del arreo: la marca la deja el juego cuando la majada llega al destino
export const arreo = (destino) => (s) => s.temas.has(`arreo:${destino}`);
// La D5: lo que hay que cumplir según lo elegido
const cumplioMajada = (s) => {
  const d = s.decisiones.majada;
  if (d === 'a') return s.temas.has('arreo:galpon-esquila') && s.escenas.has('majada-fermin');   // (4.17.0: y la escena de B de cuando llega la majada)
  if (d === 'b') return s.cuidados >= 3 && s.escenas.has('majada-vos');
  if (d === 'c') return s.temas.has('arreo:puesto-paso') && s.escenas.has('majada-belisario');
  return false;
};
function textoCumplirMajada(s) {
  const d = s.decisiones.majada;
  if (d === 'a') return 'Ayudá a Fermín a arrear la majada al galpón de esquila: andá delante, a caballo o a pie, y las ovejas te siguen';
  if (d === 'b') return `Cuidá la majada tres mañanas: agua y forraje en el corral del Puesto Alto (${Math.min(3, s.cuidados)}/3, una por día)`;
  if (d === 'c') return 'Llevá la majada al Puesto del Paso, para Belisario: andá delante y las ovejas te siguen';
  return 'Cumplí lo que elegiste con la majada';
}
// Con D5 = c, o con el lazo de Fermín tirante, para pedirle la honda hay que hacer las paces primero
export const necesitaPaces = (s) => s.decisiones.majada === 'c' || (s.lazos?.fermin ?? 0) < 0;


// 4.16.0: dónde quedaron los aserraderos respecto del coihue grande: `lejos` (alguno a más de 25 m) y `cerca` (alguno a 25 m o menos)
export const DISTANCIA_ASERRADERO = 25;
export function aserraderosDe(terminadas, coihue) {
  const r = { hay: false, lejos: false, cerca: false };
  for (const o of Array.isArray(terminadas) ? terminadas : []) {
    if (o?.id !== 'aserradero') continue;
    r.hay = true;
    const d = coihue && Number.isFinite(coihue.x) && Number.isFinite(o.x) ? Math.hypot(o.x - coihue.x, o.z - coihue.z) : Infinity;
    if (d > DISTANCIA_ASERRADERO) r.lejos = true; else r.cerca = true;
  }
  return r;
}

// Lo que se cuenta desde que empieza cada capítulo.
export const CONTADORES_HISTORIA = ['anotaciones', 'dia', 'talados', 'peces', 'aceptados', 'encargosHechos', 'entregas', 'cosechas', 'visitas', 'cuentos', 'molido', 'cocinadas', 'cantos'];
export function baseDe(s) {
  const b = {};
  for (const k of CONTADORES_HISTORIA) b[k] = Math.max(0, Math.floor(Number(s?.[k]) || 0));
  return b;
}
const desde = (s, b, k) => Math.max(0, (Number(s[k]) || 0) - (Number(b?.[k]) || 0));
const tiene = (id) => (s) => s.terminadas.has(id);
// 3.8.7: la noche del temporal termina a la mañana (el tiempo del juego lo fuerza de las 18 a las 7, ver main.js): se
// tildaba a la medianoche y la tarjeta «El temporal pasó de largo a la madrugada… Saliste a mirar» salía en plena tormenta
export const FIN_TEMPORAL = 7;

// ---------------------------------------------------------------- el vocabulario de objetivos (4.15.0)
// Cada uno devuelve la función `hecho(s, b)` de un objetivo. Son puras: miran el estado que arma `estadoHistoria`.
const enHora = (h, a, b) => { const x = ((Number(h) % 24) + 24) % 24; return a <= b ? x >= a && x < b : x >= a || x < b; };
export const horaEntre = enHora;
const ORDEN_ESTACION = { verano: 0, otono: 1, invierno: 2 };
// estar cerca de un lugar con nombre (`s.lugares[lugar]` son los metros que arma el juego)
export const llegar = (lugar, radio = 12) => (s) => Number(s.lugares?.[lugar]) <= radio;
// una charla guionada con un vecino sobre un tema (la marca la escena o la charla: ver `marcarTema`)
export const hablar = (quien, tema) => (s) => s.temas.has(`${quien}:${tema}`);
// darle algo a alguien (la marca la pone la escena o la charla: ver `marcarEntrega`)
export const entregar = (quien, cosa) => (s) => s.entregados.has(`${quien}:${cosa}`);
// la hora está en la ventana [desde, hasta) (cruza la medianoche si desde > hasta)
export const hora = (desde0, hasta) => (s) => enHora(s.horas, desde0, hasta);
// estar en un lugar a cierta hora; sentado el reloj corre más rápido (ver `aceleracionDeEspera`)
export const esperar = (lugar, desde0, hasta, radio = 12) => (s) => llegar(lugar, radio)(s) && enHora(s.horas, desde0, hasta);
// la puerta de una estación; no espera más de `tope` días desde que empezó el capítulo (después la historia trae su propio clima)
export const estacion = (e, tope = 2) => (s, b) => (ORDEN_ESTACION[s.estacion] ?? 0) >= (ORDEN_ESTACION[e] ?? 0) || (Number(b?.dia) > 0 && s.dia - b.dia >= tope);
// llevar a alguien con vos hasta un lugar: el acompañante está anotado y el lugar queda cerca
const acompanantEn = (quien, lugar, radio) => (s) => s.acompanante === quien && Number(s.lugares?.[lugar]) <= radio;
// 4.21.0: la función lleva anotada la escena que la cumple (`f.escena`): de ahí sale la línea de espera del panel (historia-espera.js)
export const escena = (id) => { const f = (s) => s.escenas.has(id); f.escena = id; return f; };
export const decision = (d) => (s) => s.decisiones[d] != null;
export const objeto = (id) => (s) => s.objetos.has(id);
export const acompanante = (quien) => (s) => s.acompanante === quien;
export const reparar = (id, n) => (s) => (s.reparaciones[id] || 0) >= n;
// los contadores de la historia: la cuenta del ramal y los sacos molidos
export const ramalDe = (n) => (s) => s.ramal >= n;
export const molido = (n) => (s) => s.molido >= n;
// Esperar sentado acelera el reloj: sólo si el capítulo en curso tiene algo que espera una hora o un lugar a cierta hora
export const ACELERACION_ESPERA = 8;
export function aceleracionDeEspera(h, s) {
  if (!h?.activa || h.fase !== 'jugando' || !s?.sentado) return 1;
  const c = capituloActual(h);
  const espera = c.objetivos.some((o) => o.espera && h.hechos[`${c.id}:${o.id}`] === undefined && !objetivoCumplido(o, s, h.base));
  return espera ? ACELERACION_ESPERA : 1;
}

// 4.19.0: Number() de algo que viene de un guardado armado a mano: un objeto con "toString": null hace que Number() tire un TypeError (sanearHistoria tiraba)
const aNum = (v) => { try { return Number(v); } catch { return NaN; } };
const ent = (v, max = 1e6) => Math.max(0, Math.min(max, Math.floor(aNum(v) || 0)));
function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
const idSeguro = (k) => typeof k === 'string' && /^[a-z0-9][a-z0-9_.:-]{0,63}$/i.test(k) && !(k in Object.prototype);

// ---------------------------------------------------------------- los capítulos

// ---------------------------------------------------------------- 4.16.0: ayudas de los capítulos del acto II
export const PERDIDAS = ['dedal', 'pipa', 'cuchara'];
// quién recibe cada cosa perdida (clave de la charla) y cómo se llama la entrega: «<quien>:<cosa>»
export const DUENOS_PERDIDAS = { ercilia: 'dedal', belisario: 'pipa', panadera: 'cuchara' };
export const paginasLeidas = (s) => [1, 2, 3].filter((n) => s.temas.has(`cuaderno:${n}`) || s.escenas.has(`cuaderno-${n}`)).length;
// el coihue grande talado (la marca la pone el hachazo número 6: ver main.js)
export const talado = (id) => (s) => s.temas.has(`mundo:${id}-talado`);
// D2: lo que hay que cumplir según lo elegido
const cumplioCoihue = (s) => {
  const d = s.decisiones.coihue, ase = s.terminadas.has('aserradero');
  if (d === 'a') return ase && s.aserradero.lejos;
  if (d === 'b') return ase && s.temas.has('mundo:coihue-talado');
  if (d === 'c') return ase && s.objetos.has('pirca');   // (la pirca la deja marcada la escena de Tobías, o la E en la raíz)
  return false;
};
function textoCumplirCoihue(s) {
  const d = s.decisiones.coihue;
  if (d === 'a') return 'Dejá el coihue en pie: construí el aserradero aguas abajo, a más de 25 metros del árbol (O → Trabajo)';
  if (d === 'b') return !s.temas.has('mundo:coihue-talado') ? 'Talá el coihue grande: seis hachazos (H); después construí el aserradero en lo plano' : 'Construí el aserradero en lo plano, junto al molino (O → Trabajo)';
  if (d === 'c') {
    if (!s.entregados.has('tobias:piedra')) return 'Llevale diez piedras a Tobías, en la cantera (trochita al Puesto de la Cantera)';
    if (!s.objetos.has('pirca')) return 'Volvé con Tobías al coihue grande y levantá la pirca (E en la raíz)';
    return 'Construí el aserradero junto al molino (O → Trabajo)';
  }
  return 'Cumplí lo que elegiste con el coihue';
}
// D3: lo que hay que cumplir con la harina según lo elegido
const cumplioMolienda = (s) => {
  const d = s.decisiones.molienda;
  if (d === 'a') return s.fletesHarina >= 3;
  if (d === 'b') return s.entregados.has('ercilia:harina') || s.escenas.has('molienda-fiado');
  if (d === 'c') return s.fletesHarina >= 2 && s.entregados.has('ercilia:harina-3') && (s.entregados.has('raiz:harina') || s.escenas.has('molienda-partir'));
  return false;
};
function textoCumplirMolienda(s) {
  const d = s.decisiones.molienda;
  if (d === 'a') return `Llevá la harina a Esquel: tres fletes por la trochita desde la Estación del Valle (${Math.min(3, s.fletesHarina)}/3)`;
  if (d === 'b') return 'Llevá seis medidas de harina al almacén de Ercilia, para el fiado de invierno (E sobre ella)';
  if (d === 'c') return `Partí la harina: dos fletes (${Math.min(2, s.fletesHarina)}/2), tres medidas al almacén de Ercilia${s.entregados.has('ercilia:harina-3') ? ' ✓' : ''} y una a la raíz del coihue${s.entregados.has('raiz:harina') ? ' ✓' : ''}`;
  return 'Cumplí lo que elegiste con la harina';
}

export const CAPITULOS = [
  // ---------------------------------------------------------------- ACTO I · VERANO: QUEDARSE
  {
    id: 'llave', titulo: 'La llave del molinero', acto: 1,
    intro: [
      'El aviso salió en el diario de Esquel, en un rincón, entre una cosechadora usada y un perro perdido: «Se cede refugio en el valle a quien lo habite y lo cuide. Preguntar por Ercilia.»',
      'Contestaste sin pensarlo mucho. Una semana después te llegó una llave pesada, atada con un piolín, y un pasaje de trochita. Ahora vas sentado contra la ventanilla, con el valle entrando de a poco por el vidrio.',
    ],
    objetivos: [
      { id: 'refugio', tecla: '·', texto: 'Llegá al Refugio del Arroyo: siga el agua, que queda donde el arroyo llega al lago', hecho: (s) => s.refugio },
      { id: 'puerta', tecla: 'E', texto: 'Abrí la puerta con la llave de Eusebio (E en la puerta)', hecho: escena('nota-eusebio') },
      { id: 'fuego', tecla: 'F', texto: 'Prendé un fuego antes de que oscurezca: tres ramitas del suelo (E) y F en un claro', hecho: (s) => s.fuego },
      { id: 'anotar', tecla: 'E', texto: 'Anotá dos cosas del bosque en el cuaderno', meta: 2, cuenta: (s, b) => desde(s, b, 'anotaciones') },
      { id: 'noche', tecla: 'E', texto: 'Pasá tu primera noche (E junto al fuego o bajo techo, para dormir)', hecho: (s, b) => s.dia > (b?.dia || 1) },
      { id: 'canto', tecla: 'E', texto: 'Mirá lo que hay en el umbral', hecho: objeto('canto-blanco') },
    ],
    outro: [
      'Amaneció. Del lago sube una neblina finita y en el techo canta un chucao.',
      'Alguien estuvo en tu puerta y no se llevó nada. Al contrario.',
      'El refugio tiene goteras, la puerta cierra mal y la leña de adentro es de otro siglo. Hay trabajo.',
    ],
    premio: { ramitas: 6, materiales: { tronco: 2 }, pesos: 1000, texto: 'Seis ramitas secas, dos troncos, $1.000 que Eusebio dejó en una lata de la alacena y el canto blanco, que queda en la repisa' },   // (4.21.0: y los primeros pesos)
  },
  {
    id: 'bolsa', titulo: 'La bolsa del molinero', acto: 1,
    intro: [
      'Don Ramón pasó temprano con la majada y se quedó mirando el techo como quien mira un caballo cansado.',
      '«Eso no aguanta el invierno», dijo, sin maldad. «Pero se arregla. Madera hay; lo que falta es hacha y banco.»',
    ],
    objetivos: [
      { id: 'ramon', tecla: 'E', texto: 'Hablá con Don Ramón: pasa con la majada frente al refugio', vecinos: true, hecho: hablar('ramon', 'alero') },
      { id: 'viaje', tecla: 'E', texto: 'Tomá la trochita a la Aldea de los Duendes', hecho: (s) => s.viaje },
      { id: 'hacha', tecla: 'E', texto: 'Conseguí el hacha en el almacén de Ercilia', hecho: (s) => s.hacha },
      { id: 'talar', tecla: 'H', texto: 'Talá un árbol seco: tres hachazos (al pehuén no se lo toca)', hecho: (s, b) => desde(s, b, 'talados') >= 1 },
      { id: 'banco', tecla: 'O', texto: 'Levantá un banco de carpintero (O → Trabajo)', hecho: tiene('banco-trabajo') },
      { id: 'alero', tecla: 'E', texto: 'Arreglá el alero del refugio: cuatro tablas (E en el alero)', meta: 4, cuenta: (s) => s.reparaciones.alero || 0 },
      { id: 'bolsa', tecla: '·', texto: 'Decidí qué hacer con la bolsa del molinero', hecho: decision('bolsa') },
      { id: 'cumplir', tecla: 'E', visible: (s) => s.decisiones.bolsa != null, texto: (s) => textoCumplirBolsa(s), hecho: (s) => cumplioBolsa(s) },
    ],
    decisiones: [{ id: 'bolsa', tras: 'bolsa-alero' }],
    outro: [
      'El alero ya no gotea. Ramón lo empujó con el palo para ver si bailaba y no bailó. «Ahora sí», dijo.',
    ],
    outroVar: [{ decision: 'bolsa', lineas: {
      a: 'Esa noche, del lado del arroyo, alguien se rió bajito. Una risa contenta, si es que las risas se entienden.',
      b: 'En la aldea, a la tarde, olía a pan en todas las cuadras. Y a la noche, en tu gallinero, alguien abrió la puertita.',
      c: 'Josefina pasó dos veces por tu camino esa tarde, como si fuera casualidad. Las dos veces miró el refugio.',
    } }],
    premio: { materiales: { tabla: 6, piedra: 4 }, pesos: 1000, texto: 'Seis tablas y cuatro piedras del galpón de Ramón, y $1.000 de su caja por la mano con el alero' },
  },
  {
    id: 'mesa', titulo: 'La mesa larga', acto: 1,
    intro: [
      'En el valle hay poca gente y todos se conocen. Se conocen tanto que se saludan de lejos para no tener que hablar.',
      '«Una casa sin mesa es un galpón», te dijo Ercilia. «Poné una mesa con dos sillas y vas a ver cómo la gente se arrima.»',
    ],
    objetivos: [
      { id: 'hablar', tecla: 'E', texto: 'Conocé a los vecinos: Ramón, Nicanor, Josefina, Ercilia y Fermín (en el galpón de esquila)', vecinos: true, meta: 5, cuenta: (s) => s.hablados.length },
      { id: 'placa', tecla: 'E', texto: 'Leé la placa del duende en la plaza de la aldea y hablá con Herminia', vecinos: true, hecho: escena('placa-herminia') },
      { id: 'mesa', tecla: 'O', texto: 'Armá una mesa de campo con dos sillas o bancos alrededor', hecho: (s) => s.mesa },
      { id: 'visita', tecla: '·', texto: 'Recibí una visita en tu mesa (vienen a la tarde)', vecinos: true, hecho: (s, b) => desde(s, b, 'visitas') >= 1 },
      { id: 'nicanor', tecla: '·', delMomento: true, texto: 'Algo pasó en la orilla: ayudá a Nicanor', vecinos: true, hecho: (s) => s.eventos.has('tobillo') },
    ],
    // a la mitad del capítulo, Nicanor se tuerce el tobillo (ver eventos-valle.js)
    momento: { evento: 'tobillo', cuando: 'pronto' },
    outro: [
      'Esa tarde, en la mesa nueva, hubo mate. Nadie habló de risas ni de puertitas: se habló del tiempo, de las truchas y de lo cara que está la yerba. Pero a la hora de irse, todos miraron un segundo para el lado del arroyo.',
      'Nadie lo dijo, pero algo quedó decidido: ya sos del valle. Acá eso no se anuncia: se nota en que te guardan la yerba.',
    ],
    premio: { pesos: 1400, texto: '$1.400 que juntaron los vecinos para la mesa larga, con el mate incluido' },   // (4.21.0: las 4 yerbas, que ya no se venden, pasan a pesos: 4 × $100, y $1.000 más)
  },
  {
    id: 'ramal', titulo: 'La señora del ramal', acto: 1,
    intro: [
      'Elsa te esperó en el andén con los botones de bronce lustrados como para un casamiento.',
      '«Viene una ingeniera de la Administración», dijo. «A contar. Cuando vienen a contar, pasajero, es porque ya contaron.»',
    ],
    objetivos: [
      { id: 'anden', tecla: 'E', texto: 'Recibí a la ingeniera en la Estación del Valle (llegá antes de las 11)', hecho: escena('anden-graciela') },
      { id: 'aldea', tecla: 'E', texto: 'Viajá con Graciela hasta la Aldea de los Duendes (ella viaja con vos)', hecho: acompanantEn('graciela', 'aldea', 45) },
      { id: 'cabina', tecla: 'W', texto: 'Subí a la cabina y manejá un tramo: W regulador, S freno', hecho: (s) => s.conduciendo },
      { id: 'fletes', tecla: 'C', texto: 'Entregá dos fletes manejando, antes del fin del verano', meta: 2, cuenta: (s, b) => desde(s, b, 'entregas') },
      { id: 'derrumbe', tecla: '·', delMomento: true, texto: 'Piedras en la vía: pasá por el derrumbe del ramal', vecinos: true, hecho: (s) => s.eventos.has('derrumbe') },
      { id: 'puertita', tecla: 'E', texto: 'Guardá la puertita en tu repisa', hecho: objeto('puertita') },
    ],
    momento: { evento: 'derrumbe', cuando: 'pronto' },
    outro: [
      'Graciela se quedó en el hospedaje de la aldea. Dice que vuelve en cada estación «a contar».',
      'Elsa la vio irse por la calle de la vía y se quedó mirando la puertita que te dio.',
      '«El tren se maneja con las orejas», repitió, bajito. «Y el valle también, pasajero. Escuche.»',
    ],
    premio: { pesos: 1800, materiales: { tabla: 4 }, texto: '$1.800 de gastos del ramal y cuatro tablas de durmiente; desde ahora manejás la trochita sin pedir permiso' },   // (4.21.0: 8 yerbas = $800, y $1.000 más)
  },

  // ---------------------------------------------------------------- ACTO II · OTOÑO: EL MOLINO (4.16.0)
  {
    id: 'rueda', titulo: 'La rueda', acto: 2,
    // la puerta de estación: arranca en otoño; si es verano todavía espera, pero no más de 2 días (después la historia trae su propio otoño)
    puerta: { estacion: 'otono', tope: 2, titulo: 'Las lengas todavía están verdes', lineas: ['Ramón dice que el molino se arma con el agua del deshielo de otoño: esperá a que se pongan coloradas.', 'Mientras tanto el valle sigue abierto: se puede dormir, pescar, cosechar o ayudar a los vecinos. El capítulo empieza solo en un par de días, o antes si cambia la estación: dormir (E) o esperar sentado (R) lo adelanta.'] },
    intro: [
      'Una mañana las lengas amanecieron coloradas. Josefina golpeó tu puerta temprano, sin el sombrero y con la tablilla abajo del brazo. «Vení», dijo. «Te quiero mostrar algo. Traé el hacha, pero no la uses.»',
    ],
    objetivos: [
      { id: 'piedras', tecla: '·', texto: 'Andá a las piedras del molino viejo, arroyo arriba, junto al coihue grande: Josefina te espera', hecho: escena('piedras-molino') },
      { id: 'zaino', tecla: 'E', texto: 'Pedile el zaino a Don Ramón, en el Puesto Alto (E sobre él)', vecinos: true, hecho: escena('zaino-ramon') },
      { id: 'molino', tecla: 'O', texto: 'Construí un molino de agua sobre el arroyo (O → Trabajo); con el zaino acarreás los troncos y las piedras', hecho: tiene('molino-agua') },
      { id: 'coihue', tecla: '·', texto: 'Decidí qué hacer con el coihue grande de las puertitas', hecho: decision('coihue') },
      { id: 'cumplir', tecla: 'E', visible: (s) => s.decisiones.coihue != null, texto: (s) => textoCumplirCoihue(s), hecho: (s) => cumplioCoihue(s) },
      { id: 'habas', tecla: 'E', texto: 'Sembrá habas en un cantero', hecho: (s) => s.sembrados >= 1 },
      { id: 'puente', tecla: '·', delMomento: true, texto: 'La crecida aflojó el puente del arroyo: decidí qué hacer', vecinos: true, hecho: (s) => s.eventos.has('puente') },
    ],
    decisiones: [{ id: 'coihue', tras: 'tito-coihue' }],
    momento: { evento: 'puente', cuando: 'resto' },
    outro: ['La rueda agarró el ritmo del arroyo. Adentro, la muela hace un ruido hondo que se siente en los pies.'],
    outroVar: [{ decision: 'coihue', lineas: {
      a: 'El coihue quedó en pie, mirando el molino como si lo hubiera estado esperando.',
      b: 'Donde estaba el coihue quedó un tocón ancho como una mesa. Esa noche no se oyeron risas. Se oyó otra cosa.',
      c: 'La pirca de Tobías abraza la raíz del coihue. Josefina pasó la mano por las piedras y no dijo nada, que en ella es mucho.',
    } }],
    premio: { cuenta: { harina: 4, 'semillas-habas': 6 }, pesos: 1500, texto: 'Cuatro medidas de harina, semillas de habas y $1.500 de la primera molienda; el zaino queda prestado («Devolvémelo cuando te devuelva el invierno», dijo Ramón)' },
  },
  {
    id: 'perdido', titulo: 'Lo que se pierde, aparece', acto: 2,
    intro: [
      'Desde que el molino muele, en el valle se pierden cosas. No muchas: un dedal de Ercilia, la pipa de Belisario, la cuchara de palo de Rosa. Y aparecen, días después, en lugares imposibles: arriba de un poste, adentro de una bota, en el medio de la vía.',
      'Nicanor dice que de noche hay luces sobre el lago. Nadie le cree. Vos sí.',
    ],
    objetivos: [
      { id: 'nicanor', tecla: 'E', texto: 'Escuchá a Nicanor: dice que de noche hay luces sobre el lago (E en el muelle)', vecinos: true, hecho: escena('luces-lago-nicanor') },
      { id: 'buscar', tecla: 'E', texto: 'Encontrá las tres cosas perdidas: el dedal, la pipa y la cuchara de palo (E): están en lugares imposibles', meta: 3, cuenta: (s) => PERDIDAS.filter((x) => s.objetos.has(x)).length },
      { id: 'devolver', tecla: 'E', texto: 'Llevale las tres cosas a Ercilia, que sabe de quién es cada una (E sobre ella)', vecinos: true, hecho: escena('perdidas-devueltas') },
      { id: 'faro', tecla: '·', texto: 'Salí al lago de noche, en el kayak o en el velero, y acercate al faro (entre las 23 y la 1)', hecho: (s) => (s.enKayak || s.enVela) && Number(s.lugares?.faro) <= 40 && enHora(s.horas, 23, 1) },
      { id: 'guardia', tecla: 'E', espera: true, texto: 'Hacé guardia en el molino viejo, pasada la medianoche: sentate cerca del coihue (con un banco, O) y esperá; la guardia es entre las 0:30 y las 2:30', hecho: escena('guardia-molino') },
      { id: 'huellas', tecla: '·', texto: 'A la mañana, seguí las huellas chiquitas de la escarcha', hecho: escena('ramon-raiz') },
    ],
    outro: [
      'Ramón no te dijo nada y vos no le preguntaste. Hay cosas que en el valle se saben de costado.',
      'Las cosas perdidas volvieron a sus dueños. Ercilia guardó el dedal en el bolsillo del delantal y dijo «gracias» mirando para el lado del bosque. No a vos: para el bosque.',
    ],
    premio: { cosas: ['farol', 'lampara-eusebio'], pesos: 1900, texto: 'La lámpara de aceite de Eusebio, el farol para las noches y $1.900 de los vecinos por las cosas devueltas' },   // (4.21.0: 4 yerbas = $400, y $1.500 más)
  },
  {
    id: 'cosecha', titulo: 'La cosecha', acto: 2,
    intro: [
      'Las habas están gordas, la muela está caliente y en la aldea se habla de la Fiesta de la Cosecha y de la minga. Graciela volvió en el tren de la mañana, con el portafolios y botas nuevas: alguien le avisó del barro.',
      '«Vengo a contar», dijo. Elsa le contestó: «Cuente, cuente. Hoy hay mucho».',
    ],
    objetivos: [
      { id: 'cosechar', tecla: 'E', texto: 'Cosechá seis veces de la huerta', meta: 6, cuenta: (s, b) => desde(s, b, 'cosechas') },
      { id: 'moler', tecla: 'E', texto: 'Molé diez medidas de harina en tu molino (habas en la muela, E)', meta: 10, cuenta: (s, b) => desde(s, b, 'molido') },
      { id: 'galpon', tecla: 'O', texto: 'Construí un galpón para guardar las bolsas (O → Trabajo → Galpón de herramientas)', hecho: tiene('galponcito') },
      { id: 'molienda', tecla: '·', texto: 'Decidí qué hacer con la primera molienda', hecho: decision('molienda') },
      { id: 'cumplir', tecla: 'E', visible: (s) => s.decisiones.molienda != null, texto: (s) => textoCumplirMolienda(s), hecho: (s) => cumplioMolienda(s) },
      { id: 'minga', tecla: 'E', texto: 'Cociná algo (pan casero, tortas fritas o empanadas) y llevalo a la minga, en la plaza de la aldea (de 9 a 17)', vecinos: true, hecho: escena('minga-aldea') },
      { id: 'ronda', tecla: 'E', texto: 'A la mañana siguiente, entrá a tu galpón', hecho: escena('galpon-ronda') },
      { id: 'cuaderno', tecla: 'E', texto: 'Agarrá el cuaderno que quedó en el pozo del galpón (E)', hecho: (s) => s.objetos.has('cuaderno-eusebio') || s.temas.has('obj:cuaderno-eusebio') },
    ],
    decisiones: [{ id: 'molienda', tras: 'primera-molienda' }],
    outro: [
      'No faltaba nada. Ni una medida. Estaba todo en el piso, en ronda, como si alguien hubiera querido mostrarte cuánto era.',
      'Y abajo, enterrado, el cuaderno del molinero. Alguien sabía que estaba ahí. Alguien quiso que lo tuvieras.',
      'Cerraste el galpón. Después lo volviste a abrir y dejaste la puerta entornada. No sabés bien por qué.',
    ],
    premio: { pesos: 1700, texto: '$1.700 de la minga y el cuaderno de Eusebio, que se lee en la mesa del refugio, página por página' },   // (4.21.0: 2 yerbas = $200, y $1.500 más)
  },
  {
    id: 'cuaderno', titulo: 'El cuaderno de Eusebio', acto: 2,
    intro: [
      'El cuaderno tiene cuarenta años de cuentas: bolsas, maquilas, nombres de vecinos que ya no están. Y entre las cuentas, otras cosas. Dibujos de puertitas. Una lista que dice «lo que dejaron»: un canto blanco, piñones, una pluma de cóndor, «la llave que perdí en el 79». Y una frase subrayada dos veces:',
      '«Cuando la nieve tapa el paso, los del cerro bajan. Los de abajo les tienen más miedo que nosotros.»',
    ],
    objetivos: [
      { id: 'leer', tecla: 'E', texto: 'Leé el cuaderno de Eusebio: tres páginas (E en la mesa del refugio)', meta: 3, cuenta: (s) => paginasLeidas(s) },
      { id: 'ercilia', tecla: 'E', texto: 'Mostrale el cuaderno a Ercilia en el almacén', vecinos: true, hecho: escena('libreta-fiado') },
      { id: 'josefina', tecla: 'E', texto: 'Mostrale el cuaderno a Josefina', vecinos: true, hecho: escena('cuaderno-abuelo') },
      { id: 'belisario', tecla: 'E', texto: 'Andá al Puesto del Paso y preguntale a Belisario por «los del cerro» (trochita o caballo)', vecinos: true, hecho: escena('los-del-cerro') },
      { id: 'ramon', tecla: 'E', escena: 'secreto-ramon', texto: 'Subí al Puesto Alto a ver a Ramón al atardecer (entre las 17 y las 20)', vecinos: true, hecho: (s) => s.escenas.has('secreto-ramon') || (s.lazos.ramon < 0 && enHora(s.horas, 17, 20) && Number(s.lugares?.puesto) <= 30) },
      { id: 'fogon', tecla: '·', escena: 'fogon-leyenda', texto: 'En el fogón de la aldea, de noche (de 20:30 a 23:30): contar lo del cuaderno o callar', hecho: decision('cuaderno') },
    ],
    decisiones: [{ id: 'cuaderno', tras: 'fogon-leyenda' }],
    outro: [
      'Esa noche, de vuelta del fogón, el valle estaba lleno de ruidos chiquitos: hojas, agua, algo que corría. Ya no te dieron miedo. Te dieron otra cosa, más difícil de nombrar: la sensación de que el valle te estaba mirando para ver qué hacías.',
      'En la cordillera, arriba de todo, cayó la primera nieve.',
    ],
    premio: { pesos: 1900, cosas: ['pluma-condor'], texto: '$1.900 del fondo de la aldea y una pluma de cóndor, de las de la lista de Eusebio' },   // (4.21.0: 4 yerbas = $400, y $1.500 más)
    premioVar: { decision: 'cuaderno', opciones: {
      a: { materiales: { tronco: 6 }, texto: 'la aldea te trae leña para el invierno: seis troncos secos' },
      b: { cosas: ['poncho'], texto: 'Ramón te regala su poncho viejo' },
      c: { texto: 'Graciela te consigue un flete de «material de estudio»: suma al ramal' },
    } },
  },

  // ---------------------------------------------------------------- ACTO III · INVIERNO: LA NOCHE (4.17.0)
  {
    id: 'frios', titulo: 'Los primeros fríos', acto: 3,
    // la puerta de estación: arranca en invierno; si todavía es otoño espera, pero no más de 2 días (después la historia trae su propia helada)
    puerta: { estacion: 'invierno', tope: 2, titulo: 'Todavía no hace tanto frío', lineas: ['Esperá la primera helada: el balde todavía no amaneció con hielo.', 'Mientras tanto el valle sigue abierto: se puede dormir, pescar o ayudar a los vecinos. El capítulo empieza solo en un par de días, o antes si cambia la estación: dormir (E) o esperar sentado (R) lo adelanta.'] },
    intro: [
      'El balde amaneció con una tela de hielo y el aliento se ve. En la aldea dicen que Ramón no bajó con la majada.',
      'Ramón baja siempre. Ramón bajó el día que se le murió el perro.',
    ],
    objetivos: [
      { id: 'puesto', tecla: 'E', texto: 'Subí al Puesto Alto: Ramón no bajó con la majada (E sobre él)', vecinos: true, hecho: escena('ramon-cama') },
      { id: 'majada', tecla: '·', texto: 'Decidí qué hacer con la majada de Ramón', hecho: decision('majada') },
      { id: 'cumplir', tecla: 'E', visible: (s) => s.decisiones.majada != null, texto: (s) => textoCumplirMajada(s), hecho: (s) => cumplioMajada(s) },
      { id: 'sanitario', tecla: 'E', texto: 'Llevá a Ramón a la aldea, al puesto sanitario: andá con él a pie, despacio (tiene la cadera mal)', vecinos: true, hecho: escena('ramon-sanitario') },
      { id: 'lena', tecla: 'E', texto: 'Prepará tu invierno: seis troncos secos en la leñera', hecho: (s) => s.lena >= 6 },
      { id: 'estufa', tecla: 'O', texto: 'Armá una estufa a leña (O → Trabajo)', hecho: tiene('estufa-hierro') },
      { id: 'abrigo', tecla: 'E', texto: 'Conseguí abrigo: una manta o un poncho', hecho: (s) => s.abrigo },
    ],
    decisiones: [{ id: 'majada', tras: 'fermin-tranquera' }],   // 4.17.1: la elección está en fermin-tranquera (con ramon-cama la tarjeta de respaldo salía antes y D5 se preguntaba dos veces)
    momento: null,
    outro: [
      'Esa noche nevó finito. Volviendo al refugio con el farol, viste que por la rendija de tu galpón salía luz. Una luz amarilla, temblona, como de muchas velitas. Y risas. Muchas risas, bajitas, como de gente que se tapa la boca.',
      'Dejaste el farol en el suelo. Te sacaste los guantes. Y fuiste.',
    ],
    premio: { materiales: { tronco: 6 }, pesos: 2400, texto: 'Seis troncos secos y $2.400 para pasar el invierno' },   // (4.21.0: 4 yerbas = $400, y $2.000 más)
    premioVar: { decision: 'majada', opciones: {
      a: { materiales: { lana: 4 }, texto: 'Fermín te vende lana a precio de amigo: cuatro vellones de regalo' },
      b: { materiales: { lana: 2 }, texto: 'la majada de Ramón te dio vellones mientras la cuidabas' },
      c: { pesos: 3000, texto: 'los pesos de la venta de la majada a Belisario' },
    } },
  },
  {
    id: 'golpea', titulo: 'Golpeá antes de abrir', acto: 3,
    intro: [
      'La placa de la plaza lo dice clarito: «Golpeá antes de abrir».',
      'Tu galpón tiene luz adentro, risas bajitas y olor a harina. Es tu galpón. Pero esta noche no está tan claro de quién es.',
    ],
    objetivos: [
      { id: 'golpe', tecla: 'E', texto: 'Andá al galpón (tiene luz) y golpeá la puerta antes de abrir (E)', hecho: escena('galpon-golpe') },
      { id: 'duendes', tecla: '·', texto: 'Decidí qué hacés con los que están adentro: ¿trato o pelea?', hecho: decision('duendes') },
      { id: 'cerro', tecla: 'E', texto: 'A la mañana, subí al mirador del pehuén y mirá el cerro (con Josefina o con Belisario)', hecho: escena('cerro-mirador') },
      { id: 'mesa', tecla: 'E', texto: 'Juntá a los vecinos en tu mesa (con la mesa puesta, a partir de las 16)', vecinos: true, hecho: escena('mesa-guerra') },
    ],
    decisiones: [{ id: 'duendes', tras: 'galpon-encuentro' }],
    outro: ['Afuera nevaba despacio. En la nieve nueva había huellas chiquitas que salían del galpón y se perdían en la noche.'],
    outroVar: [{ trato: true, lineas: {
      trato: 'Las huellas salían del galpón en fila y se perdían en la raíz del coihue. Ninguna volvía. Todas estaban tranquilas, si es que las huellas pueden estar tranquilas.',
      pelea: 'Las huellas salían corriendo para todos lados. Una sola fila iba despacio, derecho al cerro: la del grande. Era la única que no tenía miedo.',
    } }],
    premio: { pesos: 2000, texto: 'El plan de la noche: el lado del arroyo queda marcado como el lado de ataque, y $2.000 del fondo de los vecinos para lo que haga falta' },
    premioVar: { trato: true, opciones: {
      trato: { cosas: ['llave-79'], texto: 'la llave del 79, la que Eusebio perdió' },
      pelea: { texto: 'la puertita al revés queda en tu galpón' },
    } },
  },
  {
    id: 'arco', titulo: 'El arco y la honda', acto: 3,
    intro: [
      'Nadie en el valle tiene armas. Hay hachas, palas, cañas, un rifle viejo de Belisario que no tira desde 1970. Pero Josefina tira con arco desde los quince, Fermín le pega a una lata a treinta metros con la honda, y en la aldea cada uno tiene algo para prestar. Hay dos días hasta la nevada grande. Alcanza, si se empieza ya.',
    ],
    objetivos: [
      // cadena A · el arco (Tito, Elvira, Anselmo y Josefina)
      { id: 'lenga', tecla: 'H', texto: 'El arco: talá un árbol seco de la ladera para la madera (o, si talaste el coihue, llevale a Tito dos tablas)', hecho: (s, b) => desde(s, b, 'talados') >= 1 || s.entregados.has('tito:tablas') || (s.decisiones.coihue === 'b' && (s.tablasCoihue >= 2 || s.tablas >= 2)) },   // (4.18.4: «o, si talaste el coihue, llevale a Tito dos tablas»: nada anotaba nunca esa entrega y la alternativa no contaba; la escena de Tito cobra las dos tablas)
      { id: 'tito', tecla: 'E', texto: 'Dejale la madera a Tito en la carpintería y volvé a la mañana (E sobre él)', vecinos: true, hecho: (s) => s.escenas.has('tito-arco') || !s.pobladores.has('carpintero') },
      { id: 'cuerda', tecla: 'E', texto: 'La cuerda: llevale dos vellones a Elvira, la tejedora (esquilá en el corral o pedíselos a Fermín)', vecinos: true, hecho: (s) => s.escenas.has('elvira-cuerda') || !s.pobladores.has('tejedora') },
      { id: 'puntas', tecla: 'E', texto: 'Las puntas: encargale a Anselmo doce puntas de flecha ($400)', vecinos: true, hecho: (s) => s.escenas.has('anselmo-puntas') || !s.pobladores.has('herrero') },
      { id: 'plumas', tecla: 'E', texto: 'Las plumas: juntá seis en el bosque, en tu gallinero (de día) o pedíselas a Josefina (necesitás su confianza)', hecho: (s) => s.escenas.has('plumas-bosque') || s.escenas.has('plumas-gallinero') || s.escenas.has('plumas-josefina') || s.plumas >= 6 },
      { id: 'blancos-paso', tecla: 'E', texto: 'Practicá con el arco: cinco blancos de paja en el Puesto del Paso (mantené el clic para tensar)', meta: 5, cuenta: (s) => s.blancos.paso },
      // cadena B · la honda (Fermín y Tobías)
      { id: 'fermin', tecla: 'E', texto: (s) => (necesitaPaces(s) && !s.escenas.has('fermin-paces') ? 'Hacé las paces con Fermín: llevale un regalo que le guste (harina o yerba)' : 'Pedile a Fermín que te enseñe a tirar con honda (galpón de esquila)'), vecinos: true, hecho: escena('fermin-honda') },
      { id: 'cantos', tecla: 'E', texto: 'Juntá veinte cantos rodados del arroyo para la honda', meta: 20, cuenta: (s, b) => desde(s, b, 'cantos') },
      { id: 'blancos-esquila', tecla: 'E', texto: 'Practicá con la honda: volteá cinco latas de los postes del galpón de esquila', meta: 5, cuenta: (s) => s.blancos.esquila },
      // cadena C · lo prestado
      { id: 'prestado', tecla: 'E', texto: 'Pedí defensas prestadas: Anselmo (estacas), Guido (miel), Martín (la campana) y Elsa (durmientes); alcanzan tres', vecinos: true, meta: 3, cuenta: (s) => s.prestadoN },
      { id: 'deuda', tecla: 'E', visible: (s) => s.deuda > 0, texto: (s) => `Pagá lo que debés del trato: ${loQueSeDebe(s)}, en la raíz del coihue (o el tocón)`, hecho: (s) => s.deuda === 0 || s.escenas.has('recorrer-lado') },
      { id: 'lado', tecla: 'E', texto: 'Recorré el lado del arroyo hasta el galpón, con Ramón o con Josefina (al atardecer)', hecho: escena('recorrer-lado') },
    ],
    outro: [
      'La radio del Cerro Negro lo dijo tres veces: nevada grande en la cordillera, baja al valle esta noche. Ercilia cerró temprano. Los chicos de los Jones pegaron la nariz al vidrio. Ramón pidió que lo llevaran al refugio «para mirar, nomás». Josefina se trajo el sombrero.',
      'Afuera empezó a nevar. Grueso, esta vez.',
    ],
    premio: { cosas: ['arco', 'honda'], pesos: 2000, texto: 'el arco y la honda (quedan en la mochila; después, colgados en la pared del refugio) y $2.000 de los vecinos por lo que prestaron' },
  },
  {
    id: 'nevada', titulo: 'La noche de la nevada', acto: 3,
    intro: [
      'Nieva como si el cielo se estuviera vaciando. En el valle, las luces de las casas se apagan una por una: la gente se junta en la estación, cerca de la salamandra, como en las noches bravas de antes.',
      'En tu galpón está la harina del invierno. Detrás, el arroyo, negro, haciendo ruido entre la nieve.',
    ],
    objetivos: [
      { id: 'comer', tecla: 'E', texto: 'Comé algo caliente: un guiso, un locro o trucha con papas (cocinalo en tu casa)', hecho: (s, b) => desde(s, b, 'cocinadas') >= 1 },
      { id: 'estacion', tecla: 'E', escena: 'herminia-estacion', visible: (s) => s.decisiones.cuaderno !== 'a', texto: 'Pasá por la estación: la aldea se junta ahí esta noche (Herminia y los chicos)', hecho: (s) => s.decisiones.cuaderno === 'a' || s.escenas.has('herminia-estacion') },
      { id: 'espera', tecla: 'E', texto: 'Estate en el galpón a las 22 con el arco y la honda', hecho: escena('noche-espera') },
      { id: 'noche', tecla: '·', texto: 'La noche: defendé el galpón por el lado del arroyo hasta que pare la nevada', hecho: (s) => s.nocheEstado === 'ganada' || s.nocheEstado === 'perdida' },
      { id: 'amanecer', tecla: 'E', texto: 'Mirá el amanecer desde el galpón', hecho: (s) => AMANECERES.some((x) => s.escenas.has(x)) },
    ],
    outro: [
      'Ganes o pierdas, la noche pasó. Siempre pasan.',
      'Quedó la nieve, quedaron las huellas y quedó un valle que se quedó despierto con vos.',
    ],
    premio: { pesos: 2500, texto: 'harina y seis troncos de los vecinos, o la llave del molino viejo y el canto gemelo; y $2.500 del fondo de la estación' },
    premioVar: { noche: true, opciones: {
      'trato:ganada': { cosas: ['llave-molino', 'canto-gemelo'], texto: 'la llave del molino viejo, el canto blanco gemelo y $2.500 del fondo de la estación' },
      'trato:perdida': { materiales: { tronco: 6 }, cuenta: { harina: 2 }, texto: 'seis troncos, harina de los vecinos y $2.500 del fondo de la estación' },
      'pelea:ganada': { materiales: { tronco: 6 }, cuenta: { harina: 2 }, texto: 'seis troncos, harina de los vecinos y $2.500 del fondo de la estación' },
      'pelea:perdida': { materiales: { tronco: 6 }, cuenta: { harina: 4 }, texto: 'seis troncos, harina del fiado de la aldea y $2.500 del fondo de la estación' },
    } },
  },
  {
    id: 'deshielo', titulo: 'El deshielo', acto: 3,
    // pasan unos días (la Fiesta de la Nieve): espera hasta 2 días desde que cerró la noche; después empieza igual
    puerta: { dias: 2, titulo: 'Pasan los días', lineas: ['La nieve se está poniendo dura y brillante. En la aldea ya preparan la Fiesta de la Nieve.', 'Mientras tanto el valle sigue abierto: el capítulo empieza solo en un par de días. Dormir (E) o esperar sentado (R) lo adelanta.'] },
    intro: [
      'Pasó una semana del valle. La nieve se puso dura y brillante, y en la aldea preparan la Fiesta de la Nieve.',
      'Graciela llegó en el tren de la mañana. No trae el portafolios: trae una carpeta celeste, cerrada con elástico.',
    ],
    objetivos: [
      { id: 'carpeta', tecla: 'E', texto: 'Andá al andén de la Estación del Valle a recibir a Graciela (de 9 a 20)', vecinos: true, hecho: escena('carpeta-celeste') },
      { id: 'majada', tecla: 'E', texto: 'Visitá a Ramón y a Fermín (el Puesto Alto o el galpón de esquila)', vecinos: true, hecho: escena('majada-fin') },
      { id: 'fiesta', tecla: '·', escena: 'fiesta-nieve', texto: 'Andá a la Fiesta de la Nieve, en el predio de la aldea (de 17 a 23)', hecho: (s) => s.escenas.has('fiesta-nieve') },
      { id: 'josefina', tecla: 'E', texto: 'Pasá la tarde con Josefina junto al coihue (o el tocón)', vecinos: true, hecho: escena('josefina-fin') },
      { id: 'umbral', tecla: 'E', texto: 'Dormí y despertá en tu refugio, el primer día del año', hecho: escena('umbral-fin') },
    ],
    outro: [
      'La historia termina acá, pero el valle no. Queda todo por andar. Tomate tu tiempo: acá nadie tiene apuro, y el que tiene, se le pasa.',
    ],
    premio: { cosas: ['poncho'], pesos: 2500, texto: 'el poncho del valle, $2.500 de la Fiesta de la Nieve y el título «Del valle»' },
  },
];
export const CAPITULO = Object.fromEntries(CAPITULOS.map((c) => [c.id, c]));

// 4.17.0: los trece capítulos están completos (ya no queda ningún «continuará»)
export const CAPITULOS_COMPLETOS = 13;
export const esContinuara = (c) => c.objetivos.length === 1 && c.objetivos[0].id === 'continuara';

// ---------------------------------------------------------------- la bolsa del molinero (D1, capítulo 2)
export const BOLSA = {
  a: { texto: 'Llevarla a la raíz del coihue grande, junto a las piedras del molino viejo, arroyo arriba', escena: 'bolsa-coihue' },
  b: { texto: 'Llevarla a Rosa, a la panadería de la aldea: pan para todos', escena: 'bolsa-rosa' },
  c: { texto: 'Llevársela a Josefina, a la seccional: reconoce la letra', escena: 'bolsa-josefina' },
};
function textoCumplirBolsa(s) {
  const d = s.decisiones.bolsa;
  return d && BOLSA[d] ? BOLSA[d].texto : 'Cumplí lo que elegiste con la bolsa';
}
const cumplioBolsa = (s) => !!s.decisiones.bolsa && s.escenas.has(BOLSA[s.decisiones.bolsa].escena);

// Las decisiones grandes: sus opciones, y qué lazos mueven. Una decisión se muestra como tarjeta (ver historia-ui.js).
export const DEFINICION_DECISIONES = {
  bolsa: {
    titulo: 'La bolsa del molinero',
    texto: [
      'Entre la chapa y la viga, envuelta en arpillera y atada con un piolín colorado, había una bolsa de harina y una nota: «Para la raíz del coihue grande del molino viejo, antes del primer frío. No te olvides, que ellos no se olvidan. Y gracias. E. M.»',
      '¿Qué hacés con la bolsa del molinero?',
    ],
    opciones: [
      { id: 'a', texto: 'Convidarla a la raíz del coihue grande', detalle: 'Como dice la nota. Don Ramón lo va a entender.', lazos: { ramon: 1 }, diario: 'Elegí hacerle caso a la nota de Eusebio y llevar la bolsa a la raíz del coihue.' },
      { id: 'b', texto: 'Llevarla a Rosa, la panadera', detalle: 'Pan para toda la aldea. Ercilia va a estar contenta.', lazos: { ercilia: 2, rosa: 1 }, requiere: (s) => s.pobladores.has('panadera'), sinRequisito: 'Rosa todavía no llegó a la aldea', diario: 'Elegí llevar la bolsa de Eusebio a la panadería, para hacer pan para la aldea.' },
      { id: 'c', texto: 'Llevársela a Josefina', detalle: 'Ella reconoce la letra de la nota.', lazos: { ema: 2 }, diario: 'Elegí llevarle la bolsa de Eusebio a Josefina, que reconoció la letra.' },
    ],
  },
  // 4.16.0: las del acto II. Las toma la escena (con `decision:<d>:<a|b|c>`); esta tarjeta es el respaldo si la escena no está escrita.
  coihue: {
    titulo: 'El coihue de las puertitas',
    texto: [
      'El mejor lugar para el aserradero, junto al molino, tiene un coihue enorme con las raíces talladas: puertitas chicas, todas cerradas. Tito te pagaría bien la madera. Josefina te mira con los brazos cruzados.',
      '¿Qué hacés con el coihue?',
    ],
    opciones: [
      { id: 'a', texto: 'Dejarlo en pie y armar el aserradero aguas abajo', detalle: 'Caminás más. Josefina lo va a agradecer.', lazos: { ema: 1 }, diario: 'Dejé el coihue de las puertitas en pie y armé el aserradero aguas abajo.' },
      { id: 'b', texto: 'Talarlo: Tito paga y hace tablas finas', detalle: 'Seis hachazos. Josefina no te lo va a perdonar fácil.', lazos: { ema: -2, tito: 2 }, diario: 'Decidí talar el coihue de las puertitas. Tito va a pagar bien las tablas.' },
      { id: 'c', texto: 'Pedirle a Tobías una pirca que proteja la raíz', detalle: 'Diez piedras para Tobías, en la cantera.', lazos: { ema: 1, tobias: 2 }, diario: 'Decidí pedirle a Tobías una pirca para proteger la raíz del coihue.' },
    ],
  },
  molienda: {
    titulo: 'La primera molienda',
    texto: [
      'Diez bolsas de la primera molienda. Ercilia las quiere para el fiado de la aldea, Graciela las cuenta en toneladas y Josefina mira el coihue: «Mi abuelo dejaba una aparte. Siempre una aparte».',
      '¿Adónde va la harina?',
    ],
    opciones: [
      { id: 'a', texto: 'Fletes a Esquel, por la trochita', detalle: 'El ramal gana puntos. A Ercilia no le gusta.', lazos: { guarda: 1, graciela: 2, ercilia: -1 }, ramal: 4, diario: 'Decidí mandar la primera harina a Esquel por la trochita, para sumarle cargas al ramal.' },
      { id: 'b', texto: 'El fiado de invierno de la aldea, en el almacén', detalle: 'El invierno no pasa hambre.', lazos: { ercilia: 2 }, diario: 'Decidí dejar la primera harina en el almacén, para el fiado de invierno de la aldea.' },
      { id: 'c', texto: 'Partirla: un poco de cada cosa y una a la raíz', detalle: 'Más viajes. El valle queda tranquilo.', lazos: {}, ramal: 2, diario: 'Decidí partir la harina: dos fletes, tres medidas al almacén y una a la raíz del coihue.' },
    ],
  },
  cuaderno: {
    titulo: 'Contar o callar',
    texto: [
      'El cuaderno de Eusebio, la cuenta de Ercilia y el cuaderno del abuelo de Josefina dicen lo mismo: hubo un trato. En el fogón de la aldea hay media aldea esperando una leyenda.',
      '¿Qué hacés con lo que sabés?',
    ],
    opciones: [
      { id: 'a', texto: 'Contarlo en el fogón, a toda la aldea', detalle: 'Ercilia y Herminia lo celebran. Josefina se va antes del final.', lazos: { ercilia: 2, ema: -1 }, diario: 'En el fogón leí en voz alta la primera página del cuaderno de Eusebio.' },
      { id: 'b', texto: 'Guardarlo entre los que ya saben', detalle: 'Contás otra leyenda. Ramón te pasa el mate.', lazos: { ema: 2, ramon: 1 }, diario: 'En el fogón conté otra leyenda y me guardé lo del cuaderno entre los que ya saben.' },
      { id: 'c', texto: 'Que Josefina lo mande a la universidad', detalle: 'Un árbol notable, un sitio registrado.', lazos: { ema: 1, graciela: 1 }, diario: 'En el fogón hablamos de registrar el sitio del coihue como árbol notable.' },
    ],
  },
};

// 4.17.0: las del acto III. La D5 la toma la escena (`decision:majada:a|b|c`) y la D6 también (`decision:duendes:a|b|c`: a y b son el trato, c la pelea);
// estas tarjetas son el respaldo si la escena no está escrita.
DEFINICION_DECISIONES.majada = {
  titulo: 'La majada de Ramón',
  texto: [
    'Ramón está en cama y la majada, arriba, sin nadie que la baje antes de la nevada. Fermín se ofreció a llevársela entera. Belisario compraría las ovejas. Y vos podrías cuidarlas.',
    '¿Qué hacés con la majada?',
  ],
  opciones: [
    { id: 'a', texto: 'Que se la lleve Fermín', detalle: 'Lo ayudás a arrearla al galpón de esquila. Ramón dice «no me la devuelvas flaca».', lazos: { fermin: 1 }, palabras: (s) => palabrasMajadaA(s), diario: 'Dejé que Fermín se lleve la majada de Ramón al galpón de esquila.' },
    { id: 'b', texto: 'Cuidarla vos', detalle: 'Tres mañanas con agua y forraje en el corral. Ramón: «Vos». Fermín se va dolido: el día de la nevada no va a estar a tu lado.', lazos: { ramon: 1, fermin: -1 }, diario: 'Decidí cuidar yo la majada de Ramón.' },
    { id: 'c', texto: 'Venderla a Belisario', detalle: 'Se la llevás al Puesto del Paso. Ramón no te mira: «Andá». El día de la nevada, ni Ramón ni Fermín van a estar a tu lado.', lazos: { ramon: -3, fermin: -1 }, diario: 'Decidí venderle la majada de Ramón a Belisario.' },
  ],
};
DEFINICION_DECISIONES.duendes = {
  titulo: 'Golpeá antes de abrir',
  texto: [
    'Diez o doce duendes sentados en ronda alrededor de las bolsas abiertas. Arriba de una, el más grande te mira mucho rato. Señala las bolsas, la ventana, y después a vos. No sabés si te pide, te avisa o te amenaza.',
    '¿Qué hacés?',
  ],
  opciones: [
    { id: 'a', texto: 'Dejar la puerta abierta y sentarte en el umbral', detalle: 'Un trato, sin palabras: les dejás el lugar y nada más.', lazos: {}, diario: 'Me senté en el umbral y dejé que los duendes se llevaran su bolsa.' },
    { id: 'b', texto: 'Poner la bolsa en el umbral', detalle: 'Un trato firme, de los que se devuelven: los duendecitos se acuerdan la noche de la nevada. Sólo si ya convidaste.', lazos: {}, requiere: (s) => s.decisiones.bolsa === 'a' || s.decisiones.molienda === 'c', sinRequisito: 'Todavía no les convidaste nada', diario: 'Puse una bolsa en el umbral para los duendes.' },
    { id: 'c', texto: 'Agarrar la pala y el farol: ¡fuera de acá!', detalle: 'Una pelea. Se van corriendo, menos el grande.', lazos: {}, diario: 'Les grité a los duendes que se fueran de mi galpón.' },
  ],
};

// 4.18.3: lo que la tarjeta dice, en palabras (sin números), de lo que le cuesta a Ramón que se la lleve Fermín; depende de cuánto confíe Fermín en vos ahora
export const PALABRAS_MAJADA_CONFIA = 'Fermín ya confía en vos y Ramón lo va a entender';
export const PALABRAS_MAJADA_NO_CONFIA = 'Fermín todavía te mira con reserva: a Ramón le va a doler, aunque después se le pase';
export const palabrasMajadaA = (s) => ((Number(s?.lazos?.fermin) || 0) >= MAJADA_CONFIA ? PALABRAS_MAJADA_CONFIA : PALABRAS_MAJADA_NO_CONFIA);
// Una decisión pendiente en el capítulo en curso: el objetivo `decision(D)` sin hacer y con su escena de antes vista
export function decisionPendiente(h, s) {
  if (!h?.activa || h.fase !== 'jugando') return null;
  const c = capituloActual(h);
  for (const d of c.decisiones || []) {
    if (s.decisiones[d.id] != null) continue;
    if (d.tras && !s.escenas.has(d.tras)) continue;
    if (!Object.hasOwn(DEFINICION_DECISIONES, d.id)) continue;
    return { id: d.id, ...DEFINICION_DECISIONES[d.id] };
  }
  return null;
}
// 4.18.2: lo que la tarjeta de una decisión dice (en palabras, nunca números) de los vecinos con lazo que la opción mueve: «Tito te va a tener más confianza».
// Los seis con arco no se nombran acá (su detalle ya lo cuenta a mano); sólo los siete vecinos.
export function avisoLazosDe(o) {
  const r = [];
  for (const [q, n] of Object.entries(obj(o?.lazos))) {
    if (!PERSONAS_LAZO_VECINOS.includes(q)) continue;
    const v = Math.trunc(Number(n) || 0);
    if (v > 0) r.push(`${NOMBRES[q]} te va a tener más confianza`);
    else if (v < 0) r.push(`${NOMBRES[q]} se te va a enfriar`);
  }
  return r.join('. ');
}
// 4.18.3: D5 A («que la lleve Fermín») le cuesta a Ramón −1 salvo que Fermín ya confíe en vos: con el lazo de Fermín en +2 o más AL DECIDIR (la optativa «Fermín quiere
// hablar» le suma uno), Ramón lo entiende y la escena de la llegada (`majada-fermin`) no le resta nada. Cuando la decisión pasa a A se anota si Fermín confiaba (el tema
// `fermin:majada-confia`): lo que pase con el lazo de Fermín después (la propia escena le suma tres) no cambia la cuenta; si la decisión cambia (gana la última acción) y
// vuelve a ser A, se mira de nuevo. El cobro de Ramón sigue siendo de la escena de llegada, que sólo corre si la decisión quedó en A.
export const MAJADA_CONFIA = 2;
export const TEMA_MAJADA_CONFIA = 'fermin:majada-confia';
export const ferminConfia = (h) => lazoDe(h, 'fermin') >= MAJADA_CONFIA;
// `antes`: lo que estaba decidido (null si nada); `ahora`: la opción que se toma. Devuelve true si Fermín confiaba.
export function alDecidirMajada(h, antes, ahora, dia = 1) {
  if (!h || ahora !== 'a' || antes === 'a') return false;   // (sólo cuando pasa a A: repetir la escena no vuelve a mirar)
  if (h.temas && typeof h.temas === 'object' && !Array.isArray(h.temas)) delete h.temas[TEMA_MAJADA_CONFIA];
  if (!ferminConfia(h)) return false;
  marcarTema(h, 'fermin', 'majada-confia', dia);
  return true;
}
export const majadaSinCosto = (h) => Object.hasOwn(obj(obj(h).temas), TEMA_MAJADA_CONFIA);
// Tomar una decisión: la guarda y mueve los lazos. Devuelve la opción o null.
export function tomarDecision(h, id, opcion, s = null, dia = 1) {
  if (!Object.hasOwn(DEFINICION_DECISIONES, id) || !DECISIONES.includes(id)) return null;
  const o = DEFINICION_DECISIONES[id].opciones.find((x) => x.id === opcion);
  if (!o) return null;
  if (o.requiere && s && !o.requiere(s)) return null;
  const d = decisionesDe(h);
  if (d[id] != null) return null;   // una sola vez
  if (id === 'majada') alDecidirMajada(h, d[id], o.id, dia);   // (4.18.3: antes de mover ningún lazo)
  d[id] = o.id;
  for (const [q, n] of Object.entries(o.lazos || {})) cambiarLazo(h, q, n);
  if (o.ramal) sumarRamal(h, o.ramal);   // (4.16.0: la molienda a Esquel o partida suma a la cuenta del ramal)
  if (id === 'duendes') alDecidirDuendes(h, o.id);   // (4.17.0: D6 define el trato o la pelea, que define el final)
  return o;
}

// 4.17.0: D6. a y b son el trato (b: con la bolsa en el umbral, un trato fuerte que suma un convite); c es la pelea. La deuda del trato: con D1 = b se le debe
// la bolsa que se llevó Rosa, con D2 = b las seis tablas del tocón; hay que pagarla en la raíz antes de la noche.
export function alDecidirDuendes(h, opcion) {
  const d = duendesDe(h);
  if (opcion === 'c') { d.trato = 'pelea'; d.deuda = 0; return d.trato; }
  d.trato = 'trato';
  if (opcion === 'b') d.convidado = Math.min(99, d.convidado + 1);
  const dec = obj(h.decisiones);
  d.deuda = (dec.bolsa === 'b' ? 1 : 0) + (dec.coihue === 'b' ? 1 : 0) > 0 ? 1 : 0;
  return d.trato;
}
// 4.19.0: lo que dice el objetivo de la deuda. La escena «deuda-pagada» cobra lo que se decidió: D1 = b (la bolsa a Rosa) una bolsa de harina y D2 = b (el coihue talado)
// seis tablas; con las dos decisiones, las dos cosas. Antes el texto decía siempre «harina o tablas». Una deuda anotada a mano (ninguna de las dos) sigue siendo «o».
export function loQueSeDebe(s) {
  const harina = s?.decisiones?.bolsa === 'b', tablas = s?.decisiones?.coihue === 'b';
  if (harina && tablas) return 'una bolsa de harina y seis tablas de coihue (las dos cosas)';
  if (harina) return 'una bolsa de harina';
  if (tablas) return 'seis tablas de coihue';
  return 'una bolsa de harina o seis tablas';
}
// Pagar la deuda del trato (una bolsa de harina o seis tablas, en la raíz): `duendes.deuda = 0`
// 4.17.0: «Que amanezca» (efecto `noche:perdida` de la escena): la noche queda perdida, sin final de noche
export function dejarPerdidaDe(h) { const d = duendesDe(h); d.noche = 'perdida'; d.final = null; if (!h.noche || typeof h.noche !== 'object') h.noche = nocheNueva(); h.noche.estado = 'perdida'; h.noche.horasAntes = null; }
export function pagarDeuda(h) { const d = duendesDe(h); if (d.deuda <= 0) return false; d.deuda = 0; return true; }
// Una práctica de tiro acertada (arco en el Puesto del Paso, honda en el galpón de esquila): sube la cuenta; con cinco, el arma es tuya
export const BLANCOS_PARA_ARMA = 5;
export function sumarBlanco(h, donde) {
  if (donde !== 'paso' && donde !== 'esquila') return 0;
  if (!h.blancos || typeof h.blancos !== 'object' || Array.isArray(h.blancos)) h.blancos = blancosNuevos();
  h.blancos[donde] = Math.min(99, ent(h.blancos[donde], 99) + 1);
  if (h.blancos[donde] >= BLANCOS_PARA_ARMA) ganarArma(h, donde === 'paso' ? 'arco' : 'honda');
  return h.blancos[donde];
}
export const blancosNuevos = () => ({ paso: 0, esquila: 0 });
// Un objetivo recién cumplido puede mover algo más (las plumas del bosque enojan a Josefina). Una sola vez.
export function alCumplirObjetivo(h, capId, objId, s) {
  if (false && capId === 'arco' && objId === 'plumas') {   // (4.17.0: lo hace la escena `plumas-bosque` de B)
    if (!h.aplicadas || typeof h.aplicadas !== 'object' || Array.isArray(h.aplicadas)) h.aplicadas = {};
    if (!Object.hasOwn(h.aplicadas, 'plumas-bosque')) { h.aplicadas['plumas-bosque'] = Math.max(1, ent(s?.dia, 1e6)); cambiarLazo(h, 'ema', -1); return 'plumas-bosque'; }
  }
  // 4.21.0: un indicio antes (la primera noche): al despertar, el cuaderno anota la risa que se oyó del lado del arroyo. Una sola vez; la elección de la charla de Ercilia («¿no oíste nada?») queda con sentido.
  if (capId === 'llave' && objId === 'noche') return anotarRaro(h, 'risa-primera-noche', s?.dia) ? 'risa-primera-noche' : null;
  return null;
}

// ---------------------------------------------------------------- lo guardado
// `fase`: 'intro' (falta mostrar la tarjeta de entrada), 'jugando', 'outro' (falta la de
// salida y el premio) y 'fin' (terminada: se sigue jugando libre).
// 4.13.0: lo de los duendes en la Historia. Esquema (progreso.historia.duendes):
//   trato:    null | 'trato' | 'pelea'   lo que elegiste en el encuentro del galpón (null: todavía no, o partida vieja)
//   vistos:   n                          cuántas veces los viste de lejos (siluetas)
//   regalos:  n                          los regalitos que dejaron (con trato; tope REGALOS_TOPE)
//   armas:    { arco, honda }           las armas ya conseguidas (las misiones del capítulo 7)
//   noche:    'ninguna' | 'pendiente' | 'ganada' | 'perdida'   la noche de defensa: 'pendiente' cuando hubo encuentro y están las dos armas
//   final:    null | 'trato' | 'pelea'   el final que ya se vio (lo escribe la noche)
//   intentos: n                          las veces que se jugó la noche (reintento sin castigo)
// 4.15.0 (guion, sección 7): deuda (lo que falta pagar del trato), perdon (pediste perdón después de la pelea), convidado (lo que dejaste a la raíz)
export const NOCHES_DUENDES = ['ninguna', 'pendiente', 'ganada', 'perdida'];
export const REGALOS_TOPE = 3;
export function duendesNuevos() {
  return { trato: null, vistos: 0, regalos: 0, armas: { arco: false, honda: false }, noche: 'ninguna', final: null, intentos: 0, deuda: 0, perdon: false, convidado: 0 };
}
export function sanearDuendes(v) {
  const d = duendesNuevos();
  if (!v || typeof v !== 'object' || Array.isArray(v)) return d;
  d.trato = v.trato === 'trato' || v.trato === 'pelea' ? v.trato : null;
  d.vistos = Math.max(0, Math.min(999, Math.floor(aNum(v.vistos) || 0)));
  d.regalos = Math.max(0, Math.min(REGALOS_TOPE, Math.floor(aNum(v.regalos) || 0)));
  const a = v.armas && typeof v.armas === 'object' && !Array.isArray(v.armas) ? v.armas : {};
  d.armas.arco = a.arco === true; d.armas.honda = a.honda === true;
  d.noche = NOCHES_DUENDES.includes(v.noche) ? v.noche : 'ninguna';
  d.final = v.final === 'trato' || v.final === 'pelea' ? v.final : null;
  d.intentos = Math.max(0, Math.min(99, Math.floor(aNum(v.intentos) || 0)));
  d.deuda = Math.max(0, Math.min(99, Math.floor(aNum(v.deuda) || 0)));
  d.perdon = v.perdon === true;
  d.convidado = Math.max(0, Math.min(99, Math.floor(aNum(v.convidado) || 0)));
  return d;
}
// La parte de los duendes de una historia (la crea si falta: una partida vieja no la tiene)
export function duendesDe(h) {
  if (!h.duendes || typeof h.duendes !== 'object' || Array.isArray(h.duendes)) h.duendes = duendesNuevos();
  return h.duendes;
}
// El encuentro del galpón: lo elegido queda guardado
export function hacerTrato(h, trato) {
  const d = duendesDe(h);
  if (trato !== 'trato' && trato !== 'pelea') return false;
  d.trato = trato;
  return true;
}
// Una arma conseguida
export function ganarArma(h, arma) {
  const d = duendesDe(h);
  if (arma !== 'arco' && arma !== 'honda') return false;
  d.armas[arma] = true;
  return true;
}
// La noche queda pendiente cuando hubo encuentro y están las dos armas (nunca pisa una noche ya jugada). Devuelve true si cambió.
export function revisarNoche(h) {
  const d = duendesDe(h);
  if (d.noche !== 'ninguna' || !d.trato || !d.armas.arco || !d.armas.honda) return false;
  d.noche = 'pendiente';
  return true;
}
// 4.13.0: si las armas se pierden en el camino (una tarjeta que no salió, o un seguimiento que no llegó), cuál se vuelve a pedir.
// `pendientes`: los ids de seguimiento agendados. Sólo en un capítulo con el objetivo `armas` (en la 4.15.0 todavía ninguno: el arco y la
// honda son del capítulo 11, que viene en una versión que sigue), con el momento ya lanzado. `cap`: el capítulo (para las pruebas).
export function armaPorPedir(h, s, pendientes = [], cap = null) {
  if (!h?.activa || h.fase !== 'jugando') return null;
  const c = cap || capituloActual(h);
  const o = c.objetivos.find((x) => x.id === 'armas');
  if (!o || h.momentos[c.id] !== 'lanzado' || h.hechos[`${c.id}:armas`] !== undefined || s?.vecinos === false) return null;
  if (pendientes.some((id) => ['s-honda-ramon', 's-arco-otra-vez', 's-honda-otra-vez'].includes(id))) return null;
  if (!s.armas.arco) return 'arco-josefina';
  return s.armas.honda ? null : 'honda-ramon';
}
// Los capítulos con duendes de lejos (la escalera de indicios del guion: «se dejan ver», capítulos 6 a 8)
export const CAPITULOS_CON_PRESENCIA = ['perdido', 'cosecha', 'cuaderno'];
export const hayPresencia = (h) => !!h?.activa && h.fase !== 'fin' && CAPITULOS_CON_PRESENCIA.includes(capituloActual(h).id);

// ---------------------------------------------------------------- lazos, decisiones, lo raro (4.15.0)
export function lazoDe(h, quien) {
  const v = obj(obj(h).lazos)[quien];
  return LAZOS_TODOS.includes(quien) ? Math.max(LAZO_MIN, Math.min(LAZO_MAX, Math.trunc(Number(v) || 0))) : 0;
}
export function cambiarLazo(h, quien, n) {
  if (!LAZOS_TODOS.includes(quien)) return 0;
  if (!h.lazos || typeof h.lazos !== 'object' || Array.isArray(h.lazos)) h.lazos = lazosNuevos();
  const antes = lazoDe(h, quien);
  h.lazos[quien] = Math.max(LAZO_MIN, Math.min(LAZO_MAX, antes + Math.trunc(Number(n) || 0)));
  return h.lazos[quien] - antes;
}
// El lazo en palabras (nunca números)
export function palabraLazo(n) {
  const v = Math.trunc(Number(n) || 0);
  return v <= -2 ? 'frío' : v === -1 ? 'tirante' : v === 0 ? 'conocido' : v >= 3 ? 'de la casa' : 'de confianza';
}
export const lazosNuevos = () => Object.fromEntries(LAZOS_TODOS.map((k) => [k, 0]));
export const decisionesNuevas = () => Object.fromEntries(DECISIONES.map((d) => [d, null]));
export const prestadosNuevos = () => Object.fromEntries(PRESTADOS.map((k) => [k, false]));
export function decisionesDe(h) {
  if (!h.decisiones || typeof h.decisiones !== 'object' || Array.isArray(h.decisiones)) h.decisiones = decisionesNuevas();
  return h.decisiones;
}
// el cuaderno de lo raro: indicios con fecha. Cada uno se anota una vez.
export const RAROS = Object.fromEntries([...Object.entries(TEXTO_ACTO1.raro), ...Object.entries(TEXTO_ACTO2.raro || {}), ...Object.entries(TEXTO_ACTO3.raro || {}), ...Object.entries(TEXTO_OPTATIVAS.raro || {}), ...Object.entries(TEXTO_LAZOS.raro || {})].map(([k, v]) => [k, v.texto]));   // (los 12 indicios del acto I, con el texto que escribió B: historia-texto-acto1.js)
export function anotarRaro(h, id, dia = 1) {
  if (!Object.hasOwn(RAROS, id)) return false;
  if (!Array.isArray(h.raro)) h.raro = [];
  if (h.raro.some((x) => x.id === id)) return false;
  if (h.raro.length >= TOPE_RARO) return false;
  h.raro.push({ id, dia: Math.max(1, ent(dia)) });
  return true;
}
export const textoRaro = (id) => (Object.hasOwn(RAROS, id) ? RAROS[id] : '');
// marcas con nombre guardadas con fecha: los temas hablados, los objetos levantados, lo entregado
function marcar(h, grupo, clave, dia) {
  if (!idSeguro(clave)) return false;
  if (!h[grupo] || typeof h[grupo] !== 'object' || Array.isArray(h[grupo])) h[grupo] = {};
  if (Object.hasOwn(h[grupo], clave)) return false;
  if (Object.keys(h[grupo]).length >= TOPE_MARCAS) return false;
  h[grupo][clave] = Math.max(1, ent(dia));
  return true;
}
export const marcarTema = (h, quien, tema, dia = 1) => marcar(h, 'temas', `${quien}:${tema}`, dia);
export const marcarObjeto = (h, id, dia = 1) => marcar(h, 'objetos', id, dia);
export const marcarEntrega = (h, quien, cosa, dia = 1) => marcar(h, 'entregados', `${quien}:${cosa}`, dia);
export function sumarReparacion(h, id, tope = 99) {
  if (!idSeguro(id)) return 0;
  if (!h.reparaciones || typeof h.reparaciones !== 'object' || Array.isArray(h.reparaciones)) h.reparaciones = {};
  h.reparaciones[id] = Math.min(tope, ent(h.reparaciones[id], 99) + 1);
  return h.reparaciones[id];
}
// La cuenta del ramal: cada flete entregado desde el capítulo 4 (+1, hasta 8) y los extras de las decisiones y las optativas
export function sumarRamal(h, n) {
  h.ramal = Math.max(0, Math.min(99, ent(h.ramal, 99) + Math.trunc(Number(n) || 0)));
  return h.ramal;
}
export function sumarFletes(h, s) {
  if (!h?.activa || (h.capitulo || 0) < 3) return 0;   // desde el capítulo 4
  const total = Math.max(0, Math.floor(Number(s?.entregas) || 0));
  if (h.entregasVistas === null || h.entregasVistas === undefined) { h.entregasVistas = total; return 0; }
  const previas = ent(h.entregasVistas, 1e6);
  let nuevos = Math.max(0, total - previas);
  h.entregasVistas = total;
  const cabe = Math.max(0, RAMAL_MAX_FLETES - ent(h.fletes, 99));
  nuevos = Math.min(nuevos, cabe);
  if (nuevos) { h.fletes = ent(h.fletes, 99) + nuevos; sumarRamal(h, nuevos); }
  // 4.16.0: con la primera molienda decidida a Esquel (a) o partida (c), cada flete desde la decisión cuenta también para cumplirla
  // (los que entregaste antes no). `fletesBase` es el total de entregas que había cuando se tomó la decisión.
  const dm = h.decisiones?.molienda;
  if (dm === 'a' || dm === 'c') {
    if (h.fletesBase === null || h.fletesBase === undefined) h.fletesBase = previas;
    h.fletesHarina = Math.max(0, Math.min(9, total - ent(h.fletesBase, 1e6)));
  }
  return nuevos;
}
// Cómo va el ramal, en palabras (no números)
export function estadoRamal(h) {
  const r = ent(h?.ramal, 99);
  return r >= RAMAL_SALVADO ? 'salvado' : r >= RAMAL_A_PRUEBA ? 'a prueba' : 'en duda';
}

export function historiaNueva() {
  return {
    activa: false, capitulo: 0, fase: 'intro', hechos: {}, base: {}, empezada: 0, terminada: 0, hablados: {}, momentos: {}, cerrados: {},
    duendes: duendesNuevos(), noche: nocheNueva(), escenas: escenasNuevas(),
    // 4.15.0
    version: VERSION_HISTORIA, lazos: lazosNuevos(), decisiones: decisionesNuevas(), ramal: 0, fletes: 0, entregasVistas: null, molido: 0, fletesHarina: 0, fletesBase: null,
    prestado: prestadosNuevos(), perfil: '', blancos: blancosNuevos(), raro: [], temas: {}, objetos: {}, entregados: {}, reparaciones: {}, acompanante: null, aplicadas: {}, avisoReinicio: false, copiaPrevia: '',
    // 4.18.0: las optativas hechas ({ id: día }), las líneas de charla de historia ya oídas ({ id: día }), el pan de Rosa ({ quedan, ultimo }),
    // las flechas de más para la noche y los encargos que ya dieron (o no) su +1 de lazo ({ id: día | 0 }; null: todavía sin base)
    optativas: {}, oidas: {}, panRosa: null, flechasExtra: 0, encargosLazo: null,
    // 4.21.0: la Historia empezada desde la 4.21.0 trae su propia estación (no depende de «Que pasen solas») y no muestra «Primeros pasos»; las anteriores quedan como estaban
    arranqueNuevo: false,
  };
}
const FASES = ['intro', 'jugando', 'outro', 'fin'];
export function sanearHistoria(v) {
  const h = historiaNueva();
  if (!v || typeof v !== 'object' || Array.isArray(v)) return h;
  h.activa = v.activa === true;
  h.capitulo = Math.min(CAPITULOS.length - 1, ent(v.capitulo, CAPITULOS.length));
  h.fase = FASES.includes(v.fase) ? v.fase : 'intro';
  const validos = new Set(CAPITULOS.flatMap((c) => c.objetivos.map((o) => `${c.id}:${o.id}`)));
  for (const [k, d] of Object.entries(obj(v.hechos))) if (validos.has(k)) h.hechos[k] = ent(d);
  for (const k of CONTADORES_HISTORIA) if (Object.hasOwn(obj(v.base), k)) h.base[k] = ent(v.base[k]);
  h.empezada = ent(v.empezada);
  h.terminada = ent(v.terminada);
  for (const k of Object.keys(obj(v.hablados))) if (VECINOS_HISTORIA.includes(k)) h.hablados[k] = true;
  for (const [k, x] of Object.entries(obj(v.momentos))) if (Object.hasOwn(CAPITULO, k) && x === 'lanzado') h.momentos[k] = 'lanzado';
  for (const [k, d] of Object.entries(obj(v.cerrados))) if (Object.hasOwn(CAPITULO, k)) h.cerrados[k] = ent(d);
  h.duendes = sanearDuendes(v.duendes);   // 4.13.0
  h.noche = sanearNoche(v.noche);   // 4.13.0 (B)
  h.escenas = sanearEscenas(v.escenas);   // 4.14.0: las escenas vistas y las elecciones (escenas.js)
  // 4.15.0
  // (una historia guardada sin versión es de las de antes de la 4.15.0: versión 1; ver historia-reinicio.js)
  const conRastro = v.activa === true || ent(v.empezada) > 0 || ent(v.terminada) > 0 || Object.keys(obj(v.hechos)).length > 0;
  h.version = Object.hasOwn(v, 'version') ? ent(v.version, 99) || 1 : (conRastro ? 1 : VERSION_HISTORIA);
  for (const k of LAZOS_TODOS) h.lazos[k] = Math.max(LAZO_MIN, Math.min(LAZO_MAX, Math.trunc(aNum(obj(v.lazos)[k]) || 0)));
  for (const d of DECISIONES) { const x = obj(v.decisiones)[d]; h.decisiones[d] = x === 'a' || x === 'b' || x === 'c' ? x : null; }
  h.ramal = ent(v.ramal, 99);
  h.fletes = ent(v.fletes, RAMAL_MAX_FLETES);
  h.entregasVistas = v.entregasVistas === null || v.entregasVistas === undefined ? null : ent(v.entregasVistas, 1e6);
  h.molido = ent(v.molido, 9999);
  h.fletesHarina = ent(v.fletesHarina, 9);
  h.fletesBase = v.fletesBase === null || v.fletesBase === undefined ? null : ent(v.fletesBase, 1e6);
  for (const k of PRESTADOS) h.prestado[k] = obj(v.prestado)[k] === true;
  h.blancos = { paso: ent(obj(v.blancos).paso, 99), esquila: ent(obj(v.blancos).esquila, 99) };   // 4.17.0
  h.perfil = v.perfil === 'del-valle' ? 'del-valle' : '';   // el título de perfil del epílogo
  h.costumbre = (v.costumbre && typeof v.costumbre === 'object' && !Array.isArray(v.costumbre)) ? { bolsa: ['vacia', 'llena'].includes(v.costumbre.bolsa) ? v.costumbre.bolsa : null, cosechas: ent(v.costumbre.cosechas, 9999), regalos: ent(v.costumbre.regalos, 9999), dia: Math.max(1, ent(v.costumbre.dia, 1e6)) } : undefined;
  if (h.costumbre === undefined) delete h.costumbre;
  if (Array.isArray(v.raro)) {
    const vistos = new Set();
    for (const x of v.raro) {
      if (h.raro.length >= TOPE_RARO) break;
      if (!x || typeof x !== 'object' || typeof x.id !== 'string' || !Object.hasOwn(RAROS, x.id) || vistos.has(x.id)) continue;
      vistos.add(x.id);
      h.raro.push({ id: x.id, dia: Math.max(1, ent(x.dia)) });
    }
  }
  for (const g of ['temas', 'objetos', 'entregados', 'aplicadas']) {
    let n = 0;
    for (const [k, d] of Object.entries(obj(v[g]))) { if (n >= TOPE_MARCAS) break; if (idSeguro(k)) { h[g][k] = Math.max(1, ent(d)); n++; } }
  }
  for (const [k, n] of Object.entries(obj(v.reparaciones))) if (idSeguro(k)) h.reparaciones[k] = ent(n, 99);
  h.acompanante = typeof v.acompanante === 'string' && ACOMPANANTES.includes(v.acompanante) ? v.acompanante : null;
  h.avisoReinicio = v.avisoReinicio === true;
  h.copiaPrevia = typeof v.copiaPrevia === 'string' && /^[a-z0-9][a-z0-9._-]{0,90}$/i.test(v.copiaPrevia) ? v.copiaPrevia : '';
  // 4.18.0: las optativas (historia-optativas.js)
  for (const [g, tope] of [['optativas', 64], ['oidas', 400]]) {
    let n = 0;
    for (const [k, d] of Object.entries(obj(v[g]))) { if (n >= tope) break; if (idSeguro(k)) { h[g][k] = Math.max(1, ent(d)); n++; } }
  }
  { const pr = obj(v.panRosa); h.panRosa = v.panRosa && typeof v.panRosa === 'object' && !Array.isArray(v.panRosa) ? { quedan: ent(pr.quedan, 9), ultimo: ent(pr.ultimo) } : null; }
  h.flechasExtra = ent(v.flechasExtra, 99);
  h.arranqueNuevo = v.arranqueNuevo === true;   // 4.21.0
  if (v.encargosLazo && typeof v.encargosLazo === 'object' && !Array.isArray(v.encargosLazo)) {
    h.encargosLazo = {};
    let n = 0;
    for (const [k, d] of Object.entries(v.encargosLazo)) { if (n >= 200) break; if (idSeguro(k)) { h.encargosLazo[k] = ent(d); n++; } }
  }
  // una historia terminada no vuelve atrás
  if (h.terminada) { h.capitulo = CAPITULOS.length - 1; h.fase = 'fin'; }
  return h;
}

export const capituloActual = (h) => CAPITULOS[Math.min(CAPITULOS.length - 1, Math.max(0, h?.capitulo || 0))];
export const numeroCapitulo = (h) => Math.min(CAPITULOS.length, Math.max(0, h?.capitulo || 0) + 1);

// El texto de un objetivo (puede depender del estado)
export const textoObjetivo = (o, s = null) => (typeof o.texto === 'function' ? o.texto(s || estadoVacio) : o.texto);
const estadoVacio = { decisiones: {}, escenas: new Set(), lazos: {}, pobladores: new Set() };

// Las líneas de una tarjeta (entrada o cierre) con las variantes que pida el estado: una línea más según lo decidido
export function lineasCarta(c, h, cual = 'outro') {
  const base = [...(cual === 'intro' ? c.intro : c.outro)];
  const vars = cual === 'intro' ? c.introVar : c.outroVar;
  for (const v of vars || []) {
    let linea = null;
    if (v.decision) { const d = obj(h?.decisiones)[v.decision]; if (d && v.lineas[d]) linea = v.lineas[d]; }
    else if (v.trato) { const t = h?.duendes?.trato; if (t && v.lineas[t]) linea = v.lineas[t]; }
    else if (v.lazo) { const [q, min] = v.lazo; if (lazoDe(h, q) >= min && v.lineas.si) linea = v.lineas.si; else if (v.lineas.no) linea = v.lineas.no; }
    if (linea) base.push(linea);
  }
  return base;
}

// ---------------------------------------------------------------- 4.16.0: la puerta de estación y el clima de la historia
// Cuántos días pasaron desde que terminó el capítulo anterior (el último del acto I para el 5; el 8 para el 9; el 12 para el 13): lo que espera la historia
export function diasEsperados(h, s, desdeCapitulo = 'ramal') {
  const base = ent(h?.cerrados?.[desdeCapitulo]) || ent(h?.empezada);
  return Math.max(0, ent(s?.dia, 1e6) - base);
}
// La tarjeta corta de la puerta de estación mientras falta la estación y no pasaron los 2 días (la historia no espera más: después trae su propia estación). Sólo con la tarjeta de entrada pendiente.
// 4.17.0: la puerta del capítulo 13 espera días (`dias`), no una estación
export function puertaDeEstacion(h, s) {
  if (!h?.activa || h.fase !== 'intro' || !s) return null;
  const c = capituloActual(h);
  if (!c.puerta) return null;
  if (c.puerta.dias) return diasEsperados(h, s, 'nevada') >= c.puerta.dias ? null : c.puerta;
  if ((ORDEN_ESTACION[s.estacionNatural] ?? 0) >= (ORDEN_ESTACION[c.puerta.estacion] ?? 0)) return null;
  if (diasEsperados(h, s, c.acto === 3 ? 'cuaderno' : 'ramal') >= c.puerta.tope) return null;
  return c.puerta;
}
// El clima propio de la historia: si el verano sigue después de los 2 días de espera, el acto II se hace en otoño ('otono'); y los capítulos 9 a 12 son de invierno:
// si el otoño sigue después de los 2 días de espera, la historia trae su helada temprana ('invierno'). 'otono' | 'invierno' | null
export function estacionForzada(h, s) {
  if (!h?.activa || h.fase === 'fin' || !s) return null;
  const c = capituloActual(h);
  if (c.acto === 2) {
    if (s.estacionNatural !== 'verano') return null;
    return diasEsperados(h, s) >= (CAPITULOS[4].puerta?.tope ?? 2) ? 'otono' : null;
  }
  if (c.acto === 3 && c.id !== 'deshielo') {
    if (s.estacionNatural === 'invierno') return null;
    // el capítulo 9 espera hasta 2 días; de ahí en adelante (y todo el invierno de la historia) es invierno
    if (c.id === 'frios' && h.fase === 'intro') return diasEsperados(h, s, 'cuaderno') >= (c.puerta?.tope ?? 2) ? 'invierno' : null;
    return 'invierno';
  }
  if (c.id === 'deshielo') return s.estacionNatural === 'invierno' ? null : 'invierno';
  return null;
}
// La nevada de la historia: del capítulo 12 desde la tarde hasta que se resuelve la noche (si el clima del calendario no la trajo)
export function nevadaForzada(h, s) {
  if (!h?.activa || h.fase !== 'jugando' || !s || capituloActual(h).id !== 'nevada') return false;
  if (s.nocheEstado === 'ganada' || s.nocheEstado === 'perdida') return false;
  return enHora(s.horas, 17, 24) || enHora(s.horas, 0, 7);
}
// El premio de un capítulo con lo que suma lo decidido (el capítulo 8: leña, poncho o flete; el 9: la majada; el 10: la llave; el 12: según cómo terminó la noche)
export function premioDeCapitulo(c, h) {
  const base = c?.premio || null;
  const v = c?.premioVar;
  if (!v || !base) return base;
  let clave = null;
  if (v.decision) clave = obj(h?.decisiones)[v.decision];
  else if (v.trato) clave = h?.duendes?.trato || null;
  else if (v.noche) { const d = h?.duendes; clave = d && (d.trato === 'trato' || d.trato === 'pelea') && (d.noche === 'ganada' || d.noche === 'perdida') ? `${d.trato}:${d.noche}` : null; }
  const x = clave && Object.hasOwn(v.opciones, clave) ? v.opciones[clave] : null;
  if (!x) return base;
  const r = { ...base, materiales: { ...(base.materiales || {}) }, cosas: [...(base.cosas || [])], cuenta: { ...(base.cuenta || {}) } };
  for (const [k, n] of Object.entries(x.materiales || {})) r.materiales[k] = (r.materiales[k] || 0) + n;
  for (const [k, n] of Object.entries(x.cuenta || {})) r.cuenta[k] = (r.cuenta[k] || 0) + n;
  if (x.pesos) r.pesos = (r.pesos || 0) + x.pesos;
  r.cosas.push(...(x.cosas || []));
  r.texto = v.noche ? x.texto : `${base.texto}. Y además: ${x.texto}`;
  return r;
}

// Empezar (o retomar) la historia. Desde una partida ya empezada no se borra nada: se
// sigue desde el capítulo donde estaba, o desde el primero.
export function empezarHistoria(h, dia) {
  const nueva = !h.empezada;
  h.activa = true;
  if (nueva) { h.empezada = Math.max(1, ent(dia)); h.capitulo = 0; h.fase = 'intro'; h.version = VERSION_HISTORIA; h.arranqueNuevo = true; }   // (4.21.0: la estación propia)
  return nueva;
}
export function pausarHistoria(h) { h.activa = false; }

// Se cerró la tarjeta de entrada: desde ahora se cuenta lo hecho en el capítulo.
export function arrancarCapitulo(h, s) {
  if (h.fase !== 'intro') return false;
  h.fase = 'jugando';
  h.base = baseDe(s);
  // desde el capítulo 4 cuentan los fletes: lo entregado hasta acá no suma al ramal
  if ((h.capitulo || 0) >= 3 && (h.entregasVistas === null || h.entregasVistas === undefined)) h.entregasVistas = Math.max(0, Math.floor(Number(s?.entregas) || 0));
  return true;
}

function objetivoCumplido(o, s, b) {
  if (o.vecinos && s.vecinos === false) return true;   // 2.8: una partida sin vecinos no se traba
  if (o.cuenta) return o.cuenta(s, b) >= (o.meta || 1);
  return !!o.hecho(s, b);
}
// Tilda los objetivos cumplidos del capítulo en curso. Devuelve los recién tildados y si
// el capítulo quedó completo (entonces pasa a 'outro').
export function revisarHistoria(h, s) {
  const salida = { nuevos: [], completo: false };
  if (!h?.activa || h.fase !== 'jugando') return salida;
  sumarFletes(h, s);
  const c = capituloActual(h);
  for (const o of c.objetivos) {
    const k = `${c.id}:${o.id}`;
    if (h.hechos[k] !== undefined) continue;
    if (objetivoCumplido(o, s, h.base)) { h.hechos[k] = s.dia; salida.nuevos.push(o); }
  }
  if (c.objetivos.every((o) => h.hechos[`${c.id}:${o.id}`] !== undefined)) { h.fase = 'outro'; salida.completo = true; }
  return salida;
}

// Se cerró la tarjeta de salida: el premio y el capítulo siguiente (o el final).
export function cerrarCapitulo(h, dia) {
  if (h.fase !== 'outro') return null;
  const c = capituloActual(h);
  h.cerrados[c.id] = Math.max(1, ent(dia));
  if (h.capitulo >= CAPITULOS.length - 1) { h.fase = 'fin'; h.terminada = Math.max(1, ent(dia)); return { capitulo: c, premio: premioDeCapitulo(c, h), fin: true }; }
  h.capitulo += 1;
  h.fase = 'intro';
  h.base = {};
  return { capitulo: c, premio: premioDeCapitulo(c, h), fin: false, siguiente: capituloActual(h) };
}

// ¿Toca el momento del capítulo (un evento del valle que es parte de la historia)?
// 'pronto': apenas empieza; 'resto': cuando lo demás del capítulo está hecho.
export function momentoPendiente(h, s) {
  if (!h?.activa || h.fase !== 'jugando') return null;
  const c = capituloActual(h);
  const m = c.momento;
  // 3.8.3: «ya pasó» lo dice el objetivo del momento (el temporal tiene que ser el de este capítulo), no cualquier vez
  if (!m || h.momentos[c.id] === 'lanzado' || momentoPasado(h, s, m) || c.objetivos.some((o) => o.delMomento && (h.hechos[`${c.id}:${o.id}`] !== undefined || objetivoCumplido(o, s, h.base)))) return null;
  // sin vecinos en la partida (2.8), el momento de un vecino no llega: su objetivo ya se dio por hecho
  if (s.vecinos === false && c.objetivos.some((o) => o.delMomento && o.vecinos)) return null;
  if (m.cuando === 'resto' && !c.objetivos.every((o) => o.delMomento || h.hechos[`${c.id}:${o.id}`] !== undefined)) return null;
  return m.evento;
}
export function momentoLanzado(h) { h.momentos[capituloActual(h).id] = 'lanzado'; }

// 3.8.7: el evento del momento ya se decidió en este capítulo (su tarjeta se contestó desde que empezó), aunque su
// objetivo se tilde después: el temporal del capítulo 8 se tilda pasada la noche, y mientras tanto el «lanzado pero
// perdido» lo volvía a pedir cada medio segundo (la misma tarjeta una y otra vez hasta la medianoche, cobrando cada vez);
// y un temporal al azar del mismo capítulo traía otro el mismo día
function momentoPasado(h, s, m) {
  const d = s?.eventosDia && Object.hasOwn(s.eventosDia, m.evento) ? Number(s.eventosDia[m.evento]) || 0 : 0;
  return d > 0 && d >= (Number(h?.base?.dia) || 1);
}
// Lanzado pero perdido (una partida retocada, o la tarjeta que no llegó a salir): hay que volver a pedirlo para que el
// capítulo nunca se trabe. No si ya pasó en el capítulo ni si su objetivo está tildado.
export function momentoPerdido(h, s) {
  if (!h?.activa || h.fase !== 'jugando') return null;
  const c = capituloActual(h);
  const m = c.momento;
  if (!m || h.momentos[c.id] !== 'lanzado' || momentoPasado(h, s, m)) return null;
  if (c.objetivos.some((o) => o.delMomento && h.hechos[`${c.id}:${o.id}`] !== undefined)) return null;
  if (s?.vecinos === false && c.objetivos.some((o) => o.delMomento && o.vecinos)) return null;
  return m.evento;
}

// Anotar que hablaste con un vecino (se anota siempre, haya historia o no).
export function anotarCharla(h, clave) {
  if (!VECINOS_HISTORIA.includes(clave) || h.hablados[clave]) return false;
  h.hablados[clave] = true;
  return true;
}

// Lo que muestra el panel del HUD.
export function panelHistoria(h, s = null) {
  if (!h?.activa || h.fase === 'fin') return null;
  const c = capituloActual(h);
  const visibles = c.objetivos.filter((o) => !o.visible || !s || o.visible(s) || h.hechos[`${c.id}:${o.id}`] !== undefined);
  const panel = {
    titulo: `Capítulo ${numeroCapitulo(h)} · ${c.titulo}`,
    objetivos: visibles.map((o) => {
      const hecho = h.hechos[`${c.id}:${o.id}`] !== undefined;
      let texto = textoObjetivo(o, s);
      if (o.cuenta && !hecho && s) texto += ` (${Math.min(o.meta || 1, o.cuenta(s, h.base))}/${o.meta || 1})`;
      if (o.vecinos && s && s.vecinos === false) texto += ' · sin vecinos en esta partida';
      return { id: o.id, texto, tecla: o.tecla || '·', hecho };
    }),
  };
  // la cuenta del ramal aparece desde el capítulo 4 (una barra con la locomotora): valor sobre RAMAL_BARRA
  if ((h.capitulo || 0) >= 3) panel.ramal = { valor: Math.min(RAMAL_BARRA, ent(h.ramal, 99)), max: RAMAL_BARRA, estado: estadoRamal(h) };
  return panel;
}

// Los lazos en palabras, para la guía: sólo los que ya conocés. Los seis con arco, como siempre; los siete vecinos (4.18.2) se conocen si hablaste con ellos
// (Nicanor), si el lazo ya se movió o si algo pasó entre los dos (un tema o una entrega anotados a su nombre). `oficio` y `frase`: lo que escribió B (TEXTO_LAZOS.guia[quien] = { nombre, rol, frases: { <palabra del lazo>: frase } }).
export function lazosEnPalabras(h) {
  const salida = [];
  const conMarca = (g, k) => Object.keys(obj(obj(h)[g])).some((x) => x.startsWith(`${k}:`));
  for (const k of LAZOS_TODOS) {
    const vecino = PERSONAS_LAZO_VECINOS.includes(k);
    const conocido = obj(h?.hablados)[k] === true || lazoDe(h, k) !== 0 || (k === 'guarda' && !!obj(h?.escenas?.vistas)['trochita-boleto']) || (k === 'graciela' && !!obj(h?.escenas?.vistas)['anden-graciela'])
      || (vecino && (conMarca('temas', k) || conMarca('entregados', k)));
    if (!conocido) continue;
    const g = vecino ? obj(obj(TEXTO_LAZOS.guia)[k]) : {};
    const palabra = palabraLazo(lazoDe(h, k));
    salida.push({ quien: k, nombre: NOMBRES[k], palabra, oficio: typeof g.rol === 'string' ? g.rol : '', frase: typeof obj(g.frases)[palabra] === 'string' ? g.frases[palabra] : '' });
  }
  return salida;
}

// Para la guía: dónde está la historia, en una línea.
export function resumenHistoria(h) {
  if (!h?.empezada) return 'Todavía no empezaste la historia.';
  if (h.terminada) return `Terminaste la historia el día ${h.terminada}. El valle sigue abierto.`;
  const c = capituloActual(h);
  const hechos = c.objetivos.filter((o) => h.hechos[`${c.id}:${o.id}`] !== undefined).length;
  return `${h.activa ? 'En curso' : 'En pausa'}: capítulo ${numeroCapitulo(h)} de ${CAPITULOS.length}, «${c.titulo}» (${hechos} de ${c.objetivos.length}).`;
}
export const nombreVecinoHistoria = (k) => (Object.hasOwn(NOMBRES, k) ? NOMBRES[k] : k);
