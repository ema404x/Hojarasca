// 3.1: la historia guiada del Relax. Ocho capítulos cortos, cada uno con un principio
// (una tarjeta), dos a cuatro objetivos que se tildan solos mirando lo que de verdad
// pasa en la partida, y un final con su premio. Recorren los sistemas del juego con un
// hilo chico: llegar al refugio, ponerlo en condiciones, conocer a los vecinos, la
// trochita, el lago, el molino, el invierno y la noche del temporal.
//
// No traba nada: todo lo del juego libre sigue abierto antes, durante y después. Un
// objetivo cumplido queda cumplido (aunque después gastes las tablas). Lo que se mide
// "desde ahora" (peces, árboles, fletes) se cuenta desde que empezó el capítulo, como
// los encargos de temporada; lo que es "tener" (el banco, la mesa) vale aunque ya lo
// tuvieras.
//
// Módulo puro (se prueba en Node): recibe un `estado` armado por el juego (ver
// `estadoHistoria`) y la parte guardada (`progreso.historia`).

import { contadores } from './encargos-temporada.js';
import { mesaPuesta } from './visitas.js';
import { CUENTOS } from './cuentos.js';

export const VECINOS_HISTORIA = ['ramon', 'nicanor', 'ema', 'ercilia'];
const NOMBRES = { ramon: 'Don Ramón', nicanor: 'Nicanor', ema: 'Josefina', ercilia: 'Ercilia' };

// Lo que el juego sabe de la partida, en números y banderas. `extra` trae lo que no está
// en el guardado: el fuego prendido, si manejás la trochita o vas en el velero, y las
// obras terminadas ({ id, x, z }).
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
  return {
    dia: Math.max(1, Math.floor(Number(p?.dia) || 1)),
    anotaciones: Object.keys(e).length,
    refugio: !!e.refugio,
    fuego: !!extra.fuego || !!e.fogata,
    hacha: !!p?.cosas?.hacha,
    talados: c.talados,
    peces: c.peces,
    tablas: (Number(p?.materiales?.tabla) || 0) + (Number(p?.acopio?.tabla) || 0),
    terminadas: ids,
    mesa: !!mesaPuesta(terminadas),
    hablados: Object.keys(p?.historia?.hablados || {}).filter((k) => VECINOS_HISTORIA.includes(k)),
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
    visitas: Math.max(0, Math.floor(Number(p?.visitas?.cuenta) || 0)),
    cuentos: CUENTOS.filter((x) => e[x.id]).length,
    eventos: new Set(Object.keys(ev)),
    // 3.8.3: el día en que pasó cada uno (lo último), para lo que tiene que pasar en el capítulo (el temporal)
    eventosDia: Object.fromEntries(Object.entries(ev).map(([k, x]) => [k, Math.max(0, Math.floor(Number(x?.dia) || 0))])),
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

export const CAPITULOS = [
  {
    id: 'llegada', titulo: 'La llegada',
    intro: [
      'Te bajaste de la trochita con una mochila, una carta de tu hermana en el bolsillo y la llave del Refugio del Arroyo, que nadie abría desde hacía años. El guarda te señaló el sendero: «Siga el agua, que el refugio está donde el arroyo llega al lago».',
      'El valle es grande y no tiene apuro. Pero la primera noche llega igual para todos: conviene tener fuego antes de que baje el sol.',
    ],
    objetivos: [
      { id: 'refugio', tecla: '·', texto: 'Llegá al Refugio del Arroyo', hecho: (s) => s.refugio },
      { id: 'fuego', tecla: 'F', texto: 'Prendé un fuego: tres ramitas del suelo (E) y F en un claro', hecho: (s) => s.fuego },
      { id: 'anotar', tecla: 'E', texto: 'Anotá tres cosas del bosque en el cuaderno', meta: 3, cuenta: (s, b) => desde(s, b, 'anotaciones') },
      { id: 'noche', tecla: 'E', texto: 'Pasá tu primera noche en el valle (E junto al fuego o bajo techo, para dormir)', hecho: (s, b) => s.dia > (b?.dia || 1) },
    ],
    outro: [
      'Amaneció. Del lago sube una neblina finita y en el techo del refugio canta un chucao. Dicen que si canta a la derecha, trae suerte; vos no te acordás de qué lado estaba.',
      'Ya no sos alguien que está de paso: dormiste acá. El refugio tiene goteras, la puerta cierra mal y la leña de adentro es de otro siglo. Hay trabajo.',
    ],
    premio: { ramitas: 6, materiales: { tronco: 2 }, texto: 'Seis ramitas secas y dos troncos que había debajo del alero' },
  },
  {
    id: 'manos', titulo: 'Manos a la obra',
    intro: [
      'Don Ramón pasó a la mañana con la majada y se quedó mirando el techo. «Eso no aguanta el invierno», dijo, sin maldad. «Pero se arregla. Madera hay; lo que falta es hacha y banco.»',
      // 3.6: el almacén se mudó a la Aldea de los Duendes: el hacha es el primer viaje en la trochita
      '«El hacha la cambia Ercilia en su almacén, por unas ramitas y un par de cantos rodados. Ahora lo tiene en la Aldea de los Duendes, el pueblito de la parada del sur.»',
      '«Subite a la trochita en la Estación del Valle, acá nomás del refugio, y bajate en la aldea. Conocé la gente, que vale la pena. Y a la vuelta, el banco de carpintero, primero que nada: al lado de él cada tronco rinde el doble.»',
    ],
    objetivos: [
      { id: 'hacha', tecla: 'E', texto: 'Tomá la trochita a la Aldea de los Duendes y conseguite el hacha en el almacén', hecho: (s) => s.hacha },
      { id: 'talar', tecla: 'H', texto: 'Talá un árbol: tres hachazos (al pehuén no se lo toca)', hecho: (s, b) => desde(s, b, 'talados') >= 1 },
      { id: 'banco', tecla: 'O', texto: 'Levantá un banco de carpintero (O → Trabajo)', hecho: tiene('banco-trabajo') },
    ],
    outro: [
      'El banco quedó firme, con las patas bien calzadas en la tierra. Ramón lo empujó con la rodilla para ver si bailaba y no bailó.',
      '«Ahora sí tenés dónde trabajar», dijo. «Lo demás es juntar de a poco, y no cortar más de lo que hace falta. El monte se acuerda.»',
    ],
    premio: { materiales: { tabla: 6, piedra: 4 }, texto: 'Seis tablas y cuatro piedras del galpón de Ramón' },
  },
  {
    id: 'vecinos', titulo: 'Los vecinos',
    intro: [
      'En el valle hay pocos vecinos y todos se conocen. Ramón con sus ovejas en el Puesto Alto, Nicanor en el muelle con la caña, Josefina, la guardaparque, que anda siempre por el bosque, y Ercilia, que atiende el almacén de la Aldea de los Duendes y sabe todo antes que nadie.',
      '«Una casa sin mesa es un galpón», te dijo Ercilia. «Poné una mesa con un par de sillas y vas a ver cómo la gente se arrima.»',
    ],
    objetivos: [
      { id: 'hablar', tecla: 'E', texto: 'Conocé a los cuatro vecinos: hablá con cada uno (a Ercilia, en la aldea)', vecinos: true, meta: 4, cuenta: (s) => s.hablados.length },
      { id: 'encargo', tecla: 'E', texto: 'Aceptá un encargo de algún vecino', vecinos: true, hecho: (s, b) => desde(s, b, 'aceptados') >= 1 || s.aceptados >= 1 },
      { id: 'mesa', tecla: 'O', texto: 'Armá una mesa de campo con dos sillas o bancos alrededor', hecho: (s) => s.mesa },
      { id: 'nicanor', tecla: '·', delMomento: true, texto: 'Algo pasó en la orilla: ayudá a Nicanor', vecinos: true, hecho: (s) => s.eventos.has('tobillo') },
    ],
    // a la mitad del capítulo, Nicanor se tuerce el tobillo (ver eventos-valle.js)
    momento: { evento: 'tobillo', cuando: 'pronto' },
    outro: [
      'Esa tarde, en la mesa nueva, hubo mate. Nicanor con el pie en alto, Ercilia con las novedades que trajo el tren, Ramón que no decía nada y Josefina que llegó tarde con barro hasta las rodillas.',
      'Nadie lo dijo, pero algo quedó decidido: ya sos del valle. Acá eso no se anuncia; se nota en que te guardan la yerba.',
    ],
    premio: { cuenta: { yerba: 8 }, texto: 'Un kilo de yerba de los vecinos' },
  },
  {
    id: 'trochita', titulo: 'La trochita',
    intro: [
      'Elsa, la guarda, te vio mirar la locomotora con cara de chico. «¿Sabe manejarla?», preguntó. «No es difícil: el regulador, el freno y paciencia. Lo difícil es parar justo en el andén.»',
      '«Y si va a andar para allá y para acá, lleve algo. En cada parada hay un puesto de cargas y siempre hay un flete esperando.»',
    ],
    objetivos: [
      { id: 'viaje', tecla: 'E', texto: 'Subite a la trochita en un andén y viajá una vez', hecho: (s) => s.viaje },
      { id: 'cabina', tecla: 'W', texto: 'Subí a la cabina y manejala: W regulador, S freno', hecho: (s) => s.conduciendo },
      { id: 'flete', tecla: 'C', texto: 'Tomá un flete en un puesto de cargas y entregalo manejando', hecho: (s, b) => desde(s, b, 'entregas') >= 1 },
    ],
    outro: [
      'Paraste en el andén con la locomotora echando vapor y el silbato todavía en el aire. Los del puesto descargaron los bultos sin apuro, como se hace acá.',
      'Elsa te dio una palmada en el hombro: «Tiene mano. Mi padre decía que el tren se maneja con las orejas: se escucha cuándo va cansado». Ahora el valle entero queda a un viaje.',
    ],
    premio: { cuenta: { yerba: 8 }, materiales: { tabla: 4 }, texto: 'Yerba y cuatro tablas de durmiente del ramal' },
  },
  {
    id: 'lago', titulo: 'El lago',
    intro: [
      'Nicanor ya camina sin renguear y te espera en el muelle. «El lago no se conoce desde la orilla», dice. «Hay que sacar una trucha y hay que salir al agua, con viento.»',
      '«Un velero se arma en un varadero, con tablas y paciencia. El viento del oeste no para nunca: aprovechalo.»',
    ],
    objetivos: [
      { id: 'pez', tecla: 'Q', texto: 'Pescá una trucha con la caña de mosca (Q) y devolvela al agua', hecho: (s, b) => desde(s, b, 'peces') >= 1 },
      { id: 'varadero', tecla: 'O', texto: 'Construí un varadero con su velero en la orilla (O → Exterior)', hecho: tiene('varadero-velero') },
      { id: 'navegar', tecla: 'E', texto: 'Salí a navegar en el velero', hecho: (s) => s.enVela },
    ],
    outro: [
      'Desde el medio del lago el refugio es una casita de juguete con un hilo de humo. La cordillera se ve entera, y el viento empuja parejo, como si supiera adónde vas.',
      'Nicanor te saludó desde el muelle con la caña en alto. Después te dijo que la vela estaba mal cazada, pero que para ser la primera vez, no estaba mal.',
    ],
    premio: { materiales: { tabla: 8 }, texto: 'Ocho tablas de ciprés que Nicanor tenía para un bote' },
  },
  {
    id: 'molino', titulo: 'El molino',
    intro: [
      'Josefina te llevó hasta el arroyo, donde quedan las piedras de un molino viejo. «Acá se molía el trigo de todo el valle», contó. «Con el agua que baja de la nieve alcanza para mover una muela y una sierra.»',
      '«Si armás el molino, la harina sale de tus habas, y el aserradero te hace las tablas mientras dormís. El arroyo trabaja gratis.»',
    ],
    objetivos: [
      { id: 'molino', tecla: 'O', texto: 'Construí un molino de agua sobre el arroyo (O → Trabajo)', hecho: tiene('molino-agua') },
      { id: 'aserradero', tecla: 'O', texto: 'Construí un aserradero al lado del molino', hecho: tiene('aserradero') },
      { id: 'sembrar', tecla: 'E', texto: 'Sembrá algo en un cantero de huerta (semillas del almacén)', hecho: (s) => s.sembrados >= 1 },
      { id: 'puente', tecla: '·', delMomento: true, texto: 'La crecida aflojó el puente del arroyo: decidí qué hacer', hecho: (s) => s.eventos.has('puente') },
    ],
    momento: { evento: 'puente', cuando: 'pronto' },
    outro: [
      'La rueda empezó a girar con un quejido de madera nueva y después agarró su ritmo, el mismo del arroyo. Adentro, la muela hace un ruido hondo que se siente en los pies.',
      'Josefina se quedó un rato largo mirando. «Mi abuelo traía el trigo en carro desde la estepa», dijo. «Le va a gustar saber que volvió a moler.»',
    ],
    premio: { cuenta: { harina: 4, 'semillas-habas': 3 }, texto: 'Cuatro medidas de harina y semillas de habas' },
  },
  {
    id: 'invierno', titulo: 'Antes del invierno',
    intro: [
      'Una mañana las lengas amanecieron coloradas y el agua del balde tenía una tela de hielo. Ramón lo dijo sin vueltas: «El que no junta leña en otoño la junta en invierno, con la nieve hasta la rodilla».',
      'Hay que llenar la leñera, tener una estufa que tire bien, algo de la huerta guardado y ropa de abrigo. El invierno del sur no avisa dos veces.',
    ],
    objetivos: [
      { id: 'lena', tecla: 'E', texto: 'Guardá seis troncos secos en una leñera techada', meta: 6, cuenta: (s) => s.lena },
      { id: 'estufa', tecla: 'O', texto: 'Instalá una estufa a leña adentro de tu casa (O → Mobiliario)', hecho: tiene('estufa-hierro') },
      { id: 'cosecha', tecla: 'E', texto: 'Cosechá algo de la huerta', hecho: (s, b) => desde(s, b, 'cosechas') >= 1 },
      { id: 'abrigo', tecla: 'I', texto: 'Conseguí abrigo: una manta del almacén o un poncho del telar', hecho: (s) => s.abrigo },
    ],
    outro: [
      'La leñera llena da una tranquilidad que no se compra. De noche la estufa tira parejo y la casa cruje de a ratos, acomodándose al frío.',
      'Desde la ventana se ve el valle entero preparándose: humo en lo de Ramón, humo en el almacén, humo en el muelle. Todos juntando calor para lo que viene.',
    ],
    premio: { materiales: { tronco: 6 }, cuenta: { yerba: 4 }, texto: 'Seis troncos secos y medio kilo de yerba' },
  },
  {
    id: 'temporal', titulo: 'La noche del temporal',
    intro: [
      'La radio del Cerro Negro lo repitió tres veces: viento blanco en la cordillera, baja al valle esta semana. Ercilia cerró temprano el almacén y los vecinos empezaron a hablar de juntarse.',
      '«Las noches bravas se pasan acompañado», dijo Ramón. «Con la mesa puesta y un fuego, que alguien siempre trae un cuento.»',
    ],
    objetivos: [
      { id: 'visita', tecla: '·', texto: 'Recibí una visita en tu mesa (vienen a la tarde)', vecinos: true, hecho: (s, b) => desde(s, b, 'visitas') >= 1 },
      { id: 'cuento', tecla: 'E', texto: 'Con un fuego prendido cerca de la mesa, que la visita se quede y cuente un cuento', vecinos: true, hecho: (s, b) => desde(s, b, 'cuentos') >= 1 || (s.cuentos >= CUENTOS.length && desde(s, b, 'visitas') >= 1) },   // 3.8.3: con los cuatro cuentos ya oídos no queda ninguno por contar: alcanza con la visita (si no, el capítulo no terminaba nunca)
      { id: 'temporal', tecla: '·', delMomento: true, texto: 'Pasá la noche del temporal', hecho: (s, b) => s.eventos.has('temporal') && (s.eventosDia?.temporal ?? Infinity) >= (b?.dia || 1) },   // 3.8.3: el de este capítulo (un temporal al azar de antes tildaba el final sin jugarlo)
    ],
    // el temporal llega cuando lo demás está hecho: es el final
    momento: { evento: 'temporal', cuando: 'resto' },
    outro: [
      'El temporal pasó de largo a la madrugada. Quedaron ramas por todos lados, el lago de un color que no tiene nombre y un silencio enorme, de esos que sólo hay después del viento.',
      'Saliste a mirar. En cada casa del valle había humo. Nadie te llamó para saber cómo estabas, porque ya todos sabían: acá, cuando uno aguanta, aguantan todos.',
      'La historia termina acá, pero el valle no. Queda todo por andar: lo que no anotaste, lo que no pescaste, lo que todavía no construiste. Tomate tu tiempo.',
    ],
    premio: { cuenta: { poncho: 1 }, texto: 'Un poncho tejido por los vecinos, con la guarda del valle' },
  },
];
export const CAPITULO = Object.fromEntries(CAPITULOS.map((c) => [c.id, c]));

// ---------------------------------------------------------------- lo guardado
// `fase`: 'intro' (falta mostrar la tarjeta de entrada), 'jugando', 'outro' (falta la de
// salida y el premio) y 'fin' (terminada: se sigue jugando libre).
export function historiaNueva() {
  return { activa: false, capitulo: 0, fase: 'intro', hechos: {}, base: {}, empezada: 0, terminada: 0, hablados: {}, momentos: {}, cerrados: {} };
}
const FASES = ['intro', 'jugando', 'outro', 'fin'];
const ent = (v, max = 1e6) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
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
  // una historia terminada no vuelve atrás
  if (h.terminada) { h.capitulo = CAPITULOS.length - 1; h.fase = 'fin'; }
  return h;
}

export const capituloActual = (h) => CAPITULOS[Math.min(CAPITULOS.length - 1, Math.max(0, h?.capitulo || 0))];
export const numeroCapitulo = (h) => Math.min(CAPITULOS.length, Math.max(0, h?.capitulo || 0) + 1);

// Empezar (o retomar) la historia. Desde una partida ya empezada no se borra nada: se
// sigue desde el capítulo donde estaba, o desde el primero.
export function empezarHistoria(h, dia) {
  const nueva = !h.empezada;
  h.activa = true;
  if (nueva) { h.empezada = Math.max(1, ent(dia)); h.capitulo = 0; h.fase = 'intro'; }
  return nueva;
}
export function pausarHistoria(h) { h.activa = false; }

// Se cerró la tarjeta de entrada: desde ahora se cuenta lo hecho en el capítulo.
export function arrancarCapitulo(h, s) {
  if (h.fase !== 'intro') return false;
  h.fase = 'jugando';
  h.base = baseDe(s);
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
  if (!m || h.momentos[c.id] === 'lanzado' || c.objetivos.some((o) => o.delMomento && (h.hechos[`${c.id}:${o.id}`] !== undefined || objetivoCumplido(o, s, h.base)))) return null;
  // sin vecinos en la partida (2.8), el momento de un vecino no llega: su objetivo ya se dio por hecho
  if (s.vecinos === false && c.objetivos.some((o) => o.delMomento && o.vecinos)) return null;
  if (m.cuando === 'resto' && !c.objetivos.every((o) => o.delMomento || h.hechos[`${c.id}:${o.id}`] !== undefined)) return null;
  return m.evento;
}
export function momentoLanzado(h) { h.momentos[capituloActual(h).id] = 'lanzado'; }

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
  return {
    titulo: `Capítulo ${numeroCapitulo(h)} · ${c.titulo}`,
    objetivos: c.objetivos.map((o) => {
      const hecho = h.hechos[`${c.id}:${o.id}`] !== undefined;
      let texto = o.texto;
      if (o.cuenta && !hecho && s) texto += ` (${Math.min(o.meta || 1, o.cuenta(s, h.base))}/${o.meta || 1})`;
      if (o.vecinos && s && s.vecinos === false) texto += ' · sin vecinos en esta partida';
      return { id: o.id, texto, tecla: o.tecla || '·', hecho };
    }),
  };
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
