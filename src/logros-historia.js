// 4.23.0 (B): los logros de la Historia («El trato del molino»). Hasta la 4.22.0 el modo que más se juega no tenía ni uno (los de Steam eran 16 del Relax y 18 del
// Desafío). Son logros del Relax, como los de `logros-relax.js`: entran por esa misma lista (LOGROS_RELAX los suma al final), se revisan sobre la partida cada tanto,
// se anuncian igual y, cuando se haga el trabajo de Steam, salen solos por `logrosParaSteam()` (el nombre de API es RELAX_HISTORIA_*). Acá no hay nada de Steam.
//
// Cada uno mira datos que la Historia YA guarda en `progreso.historia` (capítulos cerrados, decisiones, lazos, lo raro, las optativas, la noche); no hay clave nueva de
// guardado. Reglas de cuidado:
//   · Nada se dispara en la primera hora: el primero es el cierre del acto I (capítulo 4), no el del capítulo 1 (que son cinco minutos).
//   · Sólo lo que se puede cumplir. «Todos los vecinos de la casa» es imposible: Tobías sólo llega a ser de la casa con D2 = C (la pirca) y Tito sólo con D2 = B (talar),
//     y las dos decisiones se excluyen; en una misma partida entran, como mucho, 12 de los 13 (MAXIMO_CASA). Las optativas: 34, pero 29 como mucho en una misma partida.
//     Por eso las metas de vecinos son 1, 5 y 8, y las de lo de paso 10 y 20.
//   · Lo que adelantaría la historia (el trato o la pelea, la noche, la deuda, las armas, las decisiones grandes) va OCULTO: en el panel dice «???» hasta ganarlo.
//   · Una historia de antes de la 4.15.0 (versión 1, la de ocho capítulos) no cuenta, y lo que se saltó con el código `historia capitulo N` o `historia completar` tampoco
//     (la marca `trucos.historia`, ver `vistaParaLogros`: igual que las anotaciones del cuaderno que puso la consola).
// Módulo puro (se prueba en Node).
import { CAPITULOS, LAZOS_TODOS, PRESTADOS_NOCHE, VERSION_HISTORIA, estadoRamal, esConvidado, lazoDe } from './historia.js';

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
// La historia de «El trato del molino» de esta partida, o null (sin historia, o una de antes de la versión 2)
const historiaDe = (p) => { const h = obj(p?.historia); return Object.keys(h).length && Number(h.version) >= VERSION_HISTORIA ? h : null; };
const con = (f) => (p) => { const h = historiaDe(p); return !!h && !!f(h); };
const terminada = (h) => Number(h.terminada) > 0;
const cerrado = (id) => (h) => Number(obj(h.cerrados)[id]) > 0;
// desde qué capítulo vale (el arco y la honda son del capítulo 11: antes, una práctica suelta no cuenta como logro)
const desde = (id) => (h) => (Number(h.capitulo) || 0) >= CAPITULOS.findIndex((c) => c.id === id) || terminada(h);
const cuantosDeLaCasa = (h) => LAZOS_TODOS.filter((q) => lazoDe(h, q) >= 3).length;
const cuantosRaros = (h) => (Array.isArray(h.raro) ? h.raro.length : 0);
const cuantasOptativas = (h) => Object.keys(obj(h.optativas)).length;
// los intentos de la noche: la cuenta de la noche y su espejo en los duendes (manda el mayor)
const intentosDeNoche = (h) => Math.max(Number(obj(h.noche).intentos) || 0, Number(obj(h.duendes).intentos) || 0);

// Los vecinos que pueden ser «de la casa» en una misma partida: los 13 menos uno (Tobías o Tito: se excluyen por la D2)
export const MAXIMO_CASA = LAZOS_TODOS.length - 1;
export const GRUPO_HISTORIA = 'La historia del valle';

// Los de la historia, en el orden en que se muestran: primero lo que se ve venir, después lo oculto.
export const LOGROS_HISTORIA = [
  { id: 'historia-verano', nombre: 'Ya sos del valle', texto: 'Terminá el primer acto de la historia del valle: el verano.', cumple: con(cerrado('ramal')) },
  { id: 'historia-otono', nombre: 'El molino muele', texto: 'Terminá el segundo acto de la historia del valle: el otoño.', cumple: con(cerrado('cuaderno')) },
  { id: 'historia-del-valle', nombre: 'Del valle', texto: 'Terminá la historia del valle.', cumple: con(terminada) },
  { id: 'historia-casa-1', nombre: 'De la casa', texto: 'Ganate a un vecino hasta que te cuente entre los de su casa.', cumple: con((h) => cuantosDeLaCasa(h) >= 1) },
  { id: 'historia-casa-5', nombre: 'La mesa larga', texto: 'Que cinco vecinos te cuenten entre los de su casa.', cumple: con((h) => cuantosDeLaCasa(h) >= 5) },
  { id: 'historia-casa-8', nombre: 'Todo el valle en tu mesa', texto: 'Que ocho vecinos te cuenten entre los de su casa. Todos juntos no entran: hay decisiones que se excluyen.', cumple: con((h) => cuantosDeLaCasa(h) >= 8) },
  { id: 'historia-raro-25', nombre: 'Un zorro con gorro', texto: 'Anotá 25 cosas en el cuaderno de lo raro.', cumple: con((h) => cuantosRaros(h) >= 25) },
  { id: 'historia-raro-60', nombre: 'Cuaderno de lo raro', texto: 'Anotá 60 cosas en el cuaderno de lo raro.', cumple: con((h) => cuantosRaros(h) >= 60) },
  { id: 'historia-opt-10', nombre: 'De paso', texto: 'Hacé diez cosas de paso, de las que nadie te pidió.', cumple: con((h) => cuantasOptativas(h) >= 10) },
  { id: 'historia-opt-20', nombre: 'Lo que hiciste de paso', texto: 'Hacé veinte cosas de paso. Algunas se excluyen entre sí: nadie las hace todas.', cumple: con((h) => cuantasOptativas(h) >= 20) },
  // ---- lo oculto (adelantaría la historia)
  { id: 'historia-nevada', nombre: 'Lo que dice el cuaderno', texto: 'Llegá hasta el amanecer de la noche de la nevada.', oculto: true, cumple: con(cerrado('nevada')) },
  { id: 'historia-trato', nombre: 'Hay que tener trato', texto: 'Terminá la historia con el trato en pie.', oculto: true, cumple: con((h) => terminada(h) && obj(h.duendes).trato === 'trato') },
  { id: 'historia-pelea', nombre: 'La puerta entornada', texto: 'Terminá la historia después de la pelea.', oculto: true, cumple: con((h) => terminada(h) && obj(h.duendes).trato === 'pelea') },
  { id: 'historia-convidado', nombre: 'Convidado', texto: 'Que el valle te cuente entre los convidados: dos de tus decisiones fueron un convite.', oculto: true, cumple: con(esConvidado) },
  { id: 'historia-ramal', nombre: 'El silbato largo', texto: 'Terminá la historia con el ramal salvado.', oculto: true, cumple: con((h) => terminada(h) && estadoRamal(h) === 'salvado') },
  { id: 'historia-noche-una', nombre: 'Nevó y no cedió', texto: 'Ganá la noche de la nevada al primer intento.', oculto: true, cumple: con((h) => obj(h.duendes).noche === 'ganada' && intentosDeNoche(h) <= 1) },
  { id: 'historia-noche-otra', nombre: 'Otra vez', texto: 'Perdé la noche de la nevada y ganala en el segundo intento o después.', oculto: true, cumple: con((h) => obj(h.duendes).noche === 'ganada' && intentosDeNoche(h) >= 2) },
  { id: 'historia-deuda', nombre: 'Palabra de molinero', texto: 'Pagá lo que se debía del trato, en la raíz.', oculto: true, cumple: con((h) => obj(h.duendes).trato === 'trato' && (obj(h.decisiones).bolsa === 'b' || obj(h.decisiones).coihue === 'b') && obj(h.duendes).deuda === 0 && !!obj(obj(h.escenas).vistas)['deuda-pagada']) },
  { id: 'historia-perdon', nombre: 'Pedir perdón', texto: 'Pedí perdón después de la pelea.', oculto: true, cumple: con((h) => obj(h.duendes).trato === 'pelea' && obj(h.duendes).perdon === true) },
  { id: 'historia-armas', nombre: 'Arco y honda', texto: 'Ganate el arco y la honda con tu propia puntería.', oculto: true, cumple: con((h) => desde('arco')(h) && obj(obj(h.duendes).armas).arco === true && obj(obj(h.duendes).armas).honda === true) },
  { id: 'historia-prestado', nombre: 'Todo el valle prestó algo', texto: 'Que los cuatro vecinos te presten sus defensas para la noche.', oculto: true, cumple: con((h) => PRESTADOS_NOCHE.every((k) => obj(h.prestado)[k] === true)) },
  { id: 'historia-majada-fermin', nombre: 'No me la devuelvas flaca', texto: 'Dejá que Fermín se lleve la majada de Ramón, y terminá la historia.', oculto: true, cumple: con((h) => obj(h.decisiones).majada === 'a' && terminada(h)) },
  { id: 'historia-majada-vendida', nombre: 'Andá', texto: 'Vendé la majada de Ramón, y terminá la historia.', oculto: true, cumple: con((h) => obj(h.decisiones).majada === 'c' && terminada(h)) },
  { id: 'historia-arbol-notable', nombre: 'Árbol notable', texto: 'Que el coihue quede registrado como árbol notable, y terminá la historia.', oculto: true, cumple: con((h) => obj(h.decisiones).cuaderno === 'c' && terminada(h)) },
  { id: 'historia-talado', nombre: 'Seis hachazos', texto: 'Talá el coihue de las puertitas, y terminá la historia.', oculto: true, cumple: con((h) => obj(h.decisiones).coihue === 'b' && terminada(h)) },
].map((l) => ({ ...l, grupo: GRUPO_HISTORIA, historia: true }));
