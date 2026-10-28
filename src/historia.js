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

// 4.15.0: Fermín (el galpón de esquila) se suma a los que se conocen
export const VECINOS_HISTORIA = ['ramon', 'nicanor', 'ema', 'ercilia', 'fermin'];
const NOMBRES = { ramon: 'Don Ramón', nicanor: 'Nicanor', ema: 'Josefina', ercilia: 'Ercilia', fermin: 'Fermín', guarda: 'Elsa', graciela: 'Graciela' };

// La versión de la historia que se guarda con la partida: 2 es «El trato del molino». Una historia de antes no la trae (ver historia-reinicio.js).
export const VERSION_HISTORIA = 2;

// Los que tienen un lazo con vos (−2 frío … +3 de la casa)
export const PERSONAS_LAZO = ['ramon', 'ema', 'ercilia', 'guarda', 'fermin', 'graciela'];
export const LAZO_MIN = -2, LAZO_MAX = 3;
export const DECISIONES = ['bolsa', 'coihue', 'molienda', 'cuaderno', 'majada'];
export const PRESTADOS = ['herrero', 'apicultor', 'maquinista', 'guarda', 'tobias'];
export const RAMAL_SALVADO = 10, RAMAL_A_PRUEBA = 6, RAMAL_MAX_FLETES = 8, RAMAL_BARRA = 10;
const TOPE_RARO = 60, TOPE_MARCAS = 200;

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
    lazos: Object.fromEntries(PERSONAS_LAZO.map((k) => [k, lazoDe(hh, k)])),
    pobladores: new Set((Array.isArray(p?.aldea?.pobladores) ? p.aldea.pobladores : []).map((x) => x?.clave).filter((x) => typeof x === 'string')),
  };
}

// Lo que se cuenta desde que empieza cada capítulo.
export const CONTADORES_HISTORIA = ['anotaciones', 'dia', 'talados', 'peces', 'aceptados', 'encargosHechos', 'entregas', 'cosechas', 'visitas', 'cuentos'];
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
export const escena = (id) => (s) => s.escenas.has(id);
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

const ent = (v, max = 1e6) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
const idSeguro = (k) => typeof k === 'string' && /^[a-z0-9][a-z0-9_.:-]{0,63}$/i.test(k) && !(k in Object.prototype);

// ---------------------------------------------------------------- los capítulos
const CONTINUARA = 'Esta parte de la historia todavía se está escribiendo. Mientras tanto el valle sigue abierto: dormí una noche y seguí.';
const continuara = {
  id: 'continuara', tecla: '·', texto: 'Seguí con tu vida en el valle: esta parte de la historia continuará (se completa al pasar una noche)',
  hecho: (s, b) => s.dia > (b?.dia || 1),
};
const PREMIO_CONTINUARA = { ramitas: 4, texto: 'Unas ramitas secas para el fuego' };

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
    premio: { ramitas: 6, materiales: { tronco: 2 }, texto: 'Seis ramitas secas, dos troncos y el canto blanco, que queda en la repisa' },
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
    premio: { materiales: { tabla: 6, piedra: 4 }, texto: 'Seis tablas y cuatro piedras del galpón de Ramón' },
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
    premio: { cuenta: { yerba: 4 }, texto: 'Medio kilo de yerba de los vecinos' },
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
    premio: { cuenta: { yerba: 8 }, materiales: { tabla: 4 }, texto: 'Yerba y cuatro tablas de durmiente; desde ahora manejás la trochita sin pedir permiso' },
  },

  // ---------------------------------------------------------------- ACTO II · OTOÑO: EL MOLINO (continuará)
  {
    id: 'rueda', titulo: 'La rueda', acto: 2,
    intro: [
      'Una mañana las lengas amanecieron coloradas. Josefina golpeó tu puerta temprano, sin el sombrero y con la tablilla abajo del brazo. «Vení», dijo. «Te quiero mostrar algo. Traé el hacha, pero no la uses.»',
      CONTINUARA,
    ],
    objetivos: [continuara],
    outro: ['La rueda agarró el ritmo del arroyo. Adentro, la muela hace un ruido hondo que se siente en los pies.'],
    premio: PREMIO_CONTINUARA,
  },
  {
    id: 'perdido', titulo: 'Lo que se pierde, aparece', acto: 2,
    intro: [
      'Desde que el molino muele, en el valle se pierden cosas. No muchas: un dedal de Ercilia, la pipa de Belisario, la cuchara de palo de Rosa. Y aparecen, días después, en lugares imposibles: arriba de un poste, adentro de una bota, en el medio de la vía.',
      'Nicanor dice que de noche hay luces sobre el lago. Nadie le cree. Vos sí.',
      CONTINUARA,
    ],
    objetivos: [continuara],
    outro: [
      'Ramón no te dijo nada y vos no le preguntaste. Hay cosas que en el valle se saben de costado.',
      'Las cosas perdidas volvieron a sus dueños. Ercilia guardó el dedal en el bolsillo del delantal y dijo «gracias» mirando para el lado del bosque. No a vos: para el bosque.',
    ],
    premio: PREMIO_CONTINUARA,
  },
  {
    id: 'cosecha', titulo: 'La cosecha', acto: 2,
    intro: [
      'Las habas están gordas, la muela está caliente y en la aldea se habla de la Fiesta de la Cosecha y de la minga. Graciela volvió en el tren de la mañana, con el portafolios y botas nuevas: alguien le avisó del barro.',
      '«Vengo a contar», dijo. Elsa le contestó: «Cuente, cuente. Hoy hay mucho».',
      CONTINUARA,
    ],
    objetivos: [continuara],
    outro: [
      'No faltaba nada. Ni una medida. Estaba todo en el piso, en ronda, como si alguien hubiera querido mostrarte cuánto era.',
      'Y abajo, enterrado, el cuaderno del molinero. Alguien sabía que estaba ahí. Alguien quiso que lo tuvieras.',
      'Cerraste el galpón. Después lo volviste a abrir y dejaste la puerta entornada. No sabés bien por qué.',
    ],
    premio: PREMIO_CONTINUARA,
  },
  {
    id: 'cuaderno', titulo: 'El cuaderno de Eusebio', acto: 2,
    intro: [
      'El cuaderno tiene cuarenta años de cuentas: bolsas, maquilas, nombres de vecinos que ya no están. Y entre las cuentas, otras cosas. Dibujos de puertitas. Una lista que dice «lo que dejaron»: un canto blanco, piñones, una pluma de cóndor, «la llave que perdí en el 79». Y una frase subrayada dos veces:',
      '«Cuando la nieve tapa el paso, los del cerro bajan. Los de abajo les tienen más miedo que nosotros.»',
      CONTINUARA,
    ],
    objetivos: [continuara],
    outro: [
      'Esa noche, de vuelta del fogón, el valle estaba lleno de ruidos chiquitos: hojas, agua, algo que corría. Ya no te dieron miedo. Te dieron otra cosa, más difícil de nombrar: la sensación de que el valle te estaba mirando para ver qué hacías.',
      'En la cordillera, arriba de todo, cayó la primera nieve.',
    ],
    premio: PREMIO_CONTINUARA,
  },

  // ---------------------------------------------------------------- ACTO III · INVIERNO: LA NOCHE (continuará)
  {
    id: 'frios', titulo: 'Los primeros fríos', acto: 3,
    intro: [
      'El balde amaneció con una tela de hielo y el aliento se ve. En la aldea dicen que Ramón no bajó con la majada.',
      'Ramón baja siempre. Ramón bajó el día que se le murió el perro.',
      CONTINUARA,
    ],
    objetivos: [continuara],
    outro: [
      'Esa noche nevó finito. Volviendo al refugio con el farol, viste que por la rendija de tu galpón salía luz. Una luz amarilla, temblona, como de muchas velitas. Y risas. Muchas risas, bajitas, como de gente que se tapa la boca.',
      'Dejaste el farol en el suelo. Te sacaste los guantes. Y fuiste.',
    ],
    premio: PREMIO_CONTINUARA,
  },
  {
    id: 'golpea', titulo: 'Golpeá antes de abrir', acto: 3,
    intro: [
      'La placa de la plaza lo dice clarito: «Golpeá antes de abrir».',
      'Tu galpón tiene luz adentro, risas bajitas y olor a harina. Es tu galpón. Pero esta noche no está tan claro de quién es.',
      CONTINUARA,
    ],
    objetivos: [continuara],
    outro: ['Afuera nevaba despacio. En la nieve nueva había huellas chiquitas que salían del galpón y se perdían en la noche.'],
    outroVar: [{ trato: true, lineas: {
      trato: 'Las huellas salían del galpón en fila y se perdían en la raíz del coihue. Ninguna volvía. Todas estaban tranquilas, si es que las huellas pueden estar tranquilas.',
      pelea: 'Las huellas salían corriendo para todos lados. Una sola fila iba despacio, derecho al cerro: la del grande. Era la única que no tenía miedo.',
    } }],
    premio: PREMIO_CONTINUARA,
  },
  {
    id: 'arco', titulo: 'El arco y la honda', acto: 3,
    intro: [
      'Nadie en el valle tiene armas. Hay hachas, palas, cañas, un rifle viejo de Belisario que no tira desde 1970. Pero Josefina tira con arco desde los quince, Fermín le pega a una lata a treinta metros con la honda, y en la aldea cada uno tiene algo para prestar. Hay dos días hasta la nevada grande. Alcanza, si se empieza ya.',
      CONTINUARA,
    ],
    objetivos: [continuara],
    outro: [
      'La radio del Cerro Negro lo dijo tres veces: nevada grande en la cordillera, baja al valle esta noche. Ercilia cerró temprano. Los chicos de los Jones pegaron la nariz al vidrio. Ramón pidió que lo llevaran al refugio «para mirar, nomás». Josefina se trajo el sombrero.',
      'Afuera empezó a nevar. Grueso, esta vez.',
    ],
    premio: PREMIO_CONTINUARA,
  },
  {
    id: 'nevada', titulo: 'La noche de la nevada', acto: 3,
    intro: [
      'Nieva como si el cielo se estuviera vaciando. En el valle, las luces de las casas se apagan una por una: la gente se junta en la estación, cerca de la salamandra, como en las noches bravas de antes.',
      'En tu galpón está la harina del invierno. Detrás, el arroyo, negro, haciendo ruido entre la nieve.',
      CONTINUARA,
    ],
    objetivos: [continuara],
    outro: [
      'Ganes o pierdas, la noche pasó. Siempre pasan.',
      'Quedó la nieve, quedaron las huellas y quedó un valle que se quedó despierto con vos.',
    ],
    premio: PREMIO_CONTINUARA,
  },
  {
    id: 'deshielo', titulo: 'El deshielo', acto: 3,
    intro: [
      'Pasó una semana del valle. La nieve se puso dura y brillante, y en la aldea preparan la Fiesta de la Nieve.',
      'Graciela llegó en el tren de la mañana. No trae el portafolios: trae una carpeta celeste, cerrada con elástico.',
      CONTINUARA,
    ],
    objetivos: [continuara],
    outro: [
      'La historia termina acá, pero el valle no. Queda todo por andar. Tomate tu tiempo: acá nadie tiene apuro, y el que tiene, se le pasa.',
    ],
    premio: PREMIO_CONTINUARA,
  },
];
export const CAPITULO = Object.fromEntries(CAPITULOS.map((c) => [c.id, c]));

// Los capítulos del acto I están completos; el resto es el «continuará»
export const CAPITULOS_COMPLETOS = 4;
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
      { id: 'b', texto: 'Llevarla a Rosa, la panadera', detalle: 'Pan para toda la aldea. Ercilia va a estar contenta.', lazos: { ercilia: 2 }, requiere: (s) => s.pobladores.has('panadera'), sinRequisito: 'Rosa todavía no llegó a la aldea', diario: 'Elegí llevar la bolsa de Eusebio a la panadería, para hacer pan para la aldea.' },
      { id: 'c', texto: 'Llevársela a Josefina', detalle: 'Ella reconoce la letra de la nota.', lazos: { ema: 2 }, diario: 'Elegí llevarle la bolsa de Eusebio a Josefina, que reconoció la letra.' },
    ],
  },
};

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
// Tomar una decisión: la guarda y mueve los lazos. Devuelve la opción o null.
export function tomarDecision(h, id, opcion, s = null) {
  if (!Object.hasOwn(DEFINICION_DECISIONES, id) || !DECISIONES.includes(id)) return null;
  const o = DEFINICION_DECISIONES[id].opciones.find((x) => x.id === opcion);
  if (!o) return null;
  if (o.requiere && s && !o.requiere(s)) return null;
  const d = decisionesDe(h);
  if (d[id] != null) return null;   // una sola vez
  d[id] = o.id;
  for (const [q, n] of Object.entries(o.lazos || {})) cambiarLazo(h, q, n);
  return o;
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
  d.vistos = Math.max(0, Math.min(999, Math.floor(Number(v.vistos) || 0)));
  d.regalos = Math.max(0, Math.min(REGALOS_TOPE, Math.floor(Number(v.regalos) || 0)));
  const a = v.armas && typeof v.armas === 'object' && !Array.isArray(v.armas) ? v.armas : {};
  d.armas.arco = a.arco === true; d.armas.honda = a.honda === true;
  d.noche = NOCHES_DUENDES.includes(v.noche) ? v.noche : 'ninguna';
  d.final = v.final === 'trato' || v.final === 'pelea' ? v.final : null;
  d.intentos = Math.max(0, Math.min(99, Math.floor(Number(v.intentos) || 0)));
  d.deuda = Math.max(0, Math.min(99, Math.floor(Number(v.deuda) || 0)));
  d.perdon = v.perdon === true;
  d.convidado = Math.max(0, Math.min(99, Math.floor(Number(v.convidado) || 0)));
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
  return PERSONAS_LAZO.includes(quien) ? Math.max(LAZO_MIN, Math.min(LAZO_MAX, Math.trunc(Number(v) || 0))) : 0;
}
export function cambiarLazo(h, quien, n) {
  if (!PERSONAS_LAZO.includes(quien)) return 0;
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
export const lazosNuevos = () => Object.fromEntries(PERSONAS_LAZO.map((k) => [k, 0]));
export const decisionesNuevas = () => Object.fromEntries(DECISIONES.map((d) => [d, null]));
export const prestadosNuevos = () => Object.fromEntries(PRESTADOS.map((k) => [k, false]));
export function decisionesDe(h) {
  if (!h.decisiones || typeof h.decisiones !== 'object' || Array.isArray(h.decisiones)) h.decisiones = decisionesNuevas();
  return h.decisiones;
}
// el cuaderno de lo raro: indicios con fecha. Cada uno se anota una vez.
export const RAROS = Object.fromEntries(Object.entries(TEXTO_ACTO1.raro).map(([k, v]) => [k, v.texto]));   // (los 12 indicios del acto I, con el texto que escribió B: historia-texto-acto1.js)
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
  let nuevos = Math.max(0, total - ent(h.entregasVistas, 1e6));
  h.entregasVistas = total;
  const cabe = Math.max(0, RAMAL_MAX_FLETES - ent(h.fletes, 99));
  nuevos = Math.min(nuevos, cabe);
  if (nuevos) { h.fletes = ent(h.fletes, 99) + nuevos; sumarRamal(h, nuevos); }
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
    version: VERSION_HISTORIA, lazos: lazosNuevos(), decisiones: decisionesNuevas(), ramal: 0, fletes: 0, entregasVistas: null, molido: 0,
    prestado: prestadosNuevos(), raro: [], temas: {}, objetos: {}, entregados: {}, reparaciones: {}, acompanante: null, aplicadas: {}, avisoReinicio: false, copiaPrevia: '',
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
  for (const k of PERSONAS_LAZO) h.lazos[k] = Math.max(LAZO_MIN, Math.min(LAZO_MAX, Math.trunc(Number(obj(v.lazos)[k]) || 0)));
  for (const d of DECISIONES) { const x = obj(v.decisiones)[d]; h.decisiones[d] = x === 'a' || x === 'b' || x === 'c' ? x : null; }
  h.ramal = ent(v.ramal, 99);
  h.fletes = ent(v.fletes, RAMAL_MAX_FLETES);
  h.entregasVistas = v.entregasVistas === null || v.entregasVistas === undefined ? null : ent(v.entregasVistas, 1e6);
  h.molido = ent(v.molido, 9999);
  for (const k of PRESTADOS) h.prestado[k] = obj(v.prestado)[k] === true;
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
  h.acompanante = typeof v.acompanante === 'string' && PERSONAS_LAZO.includes(v.acompanante) ? v.acompanante : null;
  h.avisoReinicio = v.avisoReinicio === true;
  h.copiaPrevia = typeof v.copiaPrevia === 'string' && /^[a-z0-9][a-z0-9._-]{0,90}$/i.test(v.copiaPrevia) ? v.copiaPrevia : '';
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

// Empezar (o retomar) la historia. Desde una partida ya empezada no se borra nada: se
// sigue desde el capítulo donde estaba, o desde el primero.
export function empezarHistoria(h, dia) {
  const nueva = !h.empezada;
  h.activa = true;
  if (nueva) { h.empezada = Math.max(1, ent(dia)); h.capitulo = 0; h.fase = 'intro'; h.version = VERSION_HISTORIA; }
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
  if (h.capitulo >= CAPITULOS.length - 1) { h.fase = 'fin'; h.terminada = Math.max(1, ent(dia)); return { capitulo: c, premio: c.premio, fin: true }; }
  h.capitulo += 1;
  h.fase = 'intro';
  h.base = {};
  return { capitulo: c, premio: c.premio, fin: false, siguiente: capituloActual(h) };
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

// Los lazos en palabras, para la guía: sólo los que ya conocés
export function lazosEnPalabras(h) {
  const salida = [];
  for (const k of PERSONAS_LAZO) {
    const conocido = obj(h?.hablados)[k] === true || lazoDe(h, k) !== 0 || (k === 'guarda' && !!obj(h?.escenas?.vistas)['trochita-boleto']) || (k === 'graciela' && !!obj(h?.escenas?.vistas)['anden-graciela']);
    if (conocido) salida.push({ quien: k, nombre: NOMBRES[k], palabra: palabraLazo(lazoDe(h, k)) });
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
