// 4.16.0: cuándo y dónde se dispara cada escena del ACTO II de la Historia (capítulos 5 a 8), qué cambia en la partida cuando se ve y los objetos
// de historia del mundo del acto II (y los props del acto I que antes sólo dejaban una marca). Módulo PURO (sin three ni DOM; se prueba en Node).
// Mismo formato que `historia-disparadores.js` (que junta estas tablas con las del acto I): ver el encabezado de ese archivo.
//
// Regla de siempre: una escena que es objetivo se alcanza con la E sobre el vecino o el objeto, o llegando al lugar; ninguna traba un capítulo.
import { marcarTema, marcarEntrega, marcarObjeto, cambiarLazo, duendesDe, capituloActual } from './historia.js';

const en = (nombre, radio) => [nombre, radio];
const diaVista = (h, id) => Math.max(0, Math.floor(Number(h?.escenas?.vistas && Object.hasOwn(h.escenas.vistas, id) ? h.escenas.vistas[id] : 0) || 0));
// cuánto se cuenta desde que empezó el capítulo en curso
const desde = (s, h, k) => Math.max(0, (Number(s[k]) || 0) - (Number(h?.base?.[k]) || 0));
const enCap = (h, ...ids) => ids.includes(capituloActual(h).id);

// Los lugares nuevos de los que el juego pasa la distancia (los arma `puntosDeHistoria` de main.js)
export const LUGARES_ACTO2 = ['molino-propio', 'galpon-propio', 'aserradero-propio', 'raiz-ramon', 'coihue',
  // 4.17.0 (C): los que nombran las escenas y los objetivos (main.js los arma en puntosDeHistoria)
  'cantera', 'puesto-paso', 'puesto-alto', 'seccional', 'panaderia', 'carpinteria', 'casa-herminia', 'estudio-fotos', 'predio', 'molino-historia', 'mallin', 'muelle', 'rueda-molino', 'puerta-molino'];
export const PERDIDAS_ACTO2 = ['dedal', 'pipa', 'cuchara'];

// Cuánta harina cuesta cada entrega de la primera molienda (D3): 6 en b, 3 en c
export const HARINA_DE_ENTREGA = { b: 6, c: 3 };

export const DISPARADORES_ACTO2 = {
  // ---- capítulo 5 · La rueda
  'piedras-molino': { cap: 'rueda', modo: 'auto', lugar: en('molino-viejo', 14), hora: [7, 20] },
  'zaino-ramon': { cap: 'rueda', modo: 'auto', requiere: ['piedras-molino'], lugar: en('puesto', 14), hora: [7, 20] },
  'zaino-ramon:hablar': { escena: 'zaino-ramon', cap: 'rueda', modo: 'hablar', clave: 'ramon', requiere: ['piedras-molino'] },
  'tito-coihue': { cap: 'rueda', modo: 'auto', requiere: ['piedras-molino'], lugar: en('molino-viejo', 30), hora: [7, 20], cond: (s) => s.terminadas.has('molino-agua') },
  'tobias-pirca': { cap: 'rueda', modo: 'hablar', clave: 'tobias', cond: (s) => s.decisiones.coihue === 'c' && s.piedra >= 10 && !s.entregados.has('tobias:piedra') },
  'rueda-gira': { cap: 'rueda', modo: 'auto', requiere: ['tito-coihue'], lugar: en('molino-propio', 30), hora: [7, 20], cond: (s) => s.terminadas.has('molino-agua') && s.decisiones.coihue != null && s.terminadas.has('aserradero') },
  'coihue-en-pie': { cap: 'rueda', modo: 'auto', requiere: ['tito-coihue'], lugar: en('aserradero-propio', 14), hora: [7, 20], cond: (s) => s.decisiones.coihue === 'a' && s.aserradero.lejos },
  'coihue-talado': { cap: 'rueda', modo: 'auto', requiere: ['tito-coihue'], lugar: en('coihue', 12), hora: [7, 20], cond: (s) => s.decisiones.coihue === 'b' && s.temas.has('mundo:coihue-talado') },
  'trigo-abuelo': { cap: 'rueda', modo: 'hablar', clave: 'ema', requiere: ['piedras-molino'], cond: (s) => s.decisiones.bolsa === 'c' },
  'truchas-nicanor': { cap: 'rueda', modo: 'hablar', clave: 'nicanor', requiere: ['piedras-molino'] },
  // 4.17.0 (C): Tito (el carpintero) no es un vecino al que se le hable siempre: si está en la aldea, la E lo trae; y si pasás por su carpintería de día, sale solo
  // (la escena lo hace aparecer ahí). Sólo si D2 = talarlo y con tabla de coihue en la mano
  'tablas-tito': { cap: 'rueda', modo: 'auto', requiere: ['piedras-molino'], lugar: en('carpinteria', 12), hora: [8, 19], cond: (s) => s.decisiones.coihue === 'b' },
  'tablas-tito:hablar': { escena: 'tablas-tito', cap: 'rueda', modo: 'hablar', clave: 'carpintero', requiere: ['piedras-molino'], cond: (s) => s.decisiones.coihue === 'b' },
  // ---- capítulo 6 · Lo que se pierde, aparece
  'luces-lago-nicanor': { cap: 'perdido', modo: 'hablar', clave: 'nicanor' },
  'perdidas-devueltas': { cap: 'perdido', modo: 'hablar', clave: 'ercilia', cond: (s) => PERDIDAS_ACTO2.every((x) => s.objetos.has(x)) },
  'el-que-vuela': { cap: 'perdido', modo: 'auto', lugar: en('faro', 60), hora: [23, 1] },
  'guardia-molino': { cap: 'perdido', modo: 'auto', lugar: en('molino-viejo', 22), hora: [0.5, 2.5], cond: (s) => s.sentado },
  'huellas-escarcha': { cap: 'perdido', modo: 'auto', requiere: ['guardia-molino'], no: ['ramon-raiz'], lugar: en('molino-viejo', 25), hora: [6, 8.5] },
  'ramon-raiz': { cap: 'perdido', modo: 'auto', requiere: ['guardia-molino'], lugar: en('raiz-ramon', 10), hora: [5.5, 10] },
  'masa-crece': { cap: 'perdido', modo: 'hablar', clave: 'panadera', cond: (s) => s.decisiones.bolsa === 'b' },
  // 4.17.0 (C): la foto movida (sólo si la sacaste) se le lleva a Sofía al estudio de fotos, a la hora en que está abierto; igual que Tito, o la E sobre ella
  'foto-sofia': { cap: ['perdido', 'cosecha', 'cuaderno'], modo: 'auto', lugar: en('estudio-fotos', 12), hora: [9, 19], cond: (s) => s.temas.has('obj:foto-movida') },
  'foto-sofia:hablar': { escena: 'foto-sofia', cap: ['perdido', 'cosecha', 'cuaderno'], modo: 'hablar', clave: 'fotografa', cond: (s) => s.temas.has('obj:foto-movida') },
  // ---- capítulo 7 · La cosecha
  'primera-molienda': { cap: 'cosecha', modo: 'auto', lugar: en('molino-propio', 25), hora: [6, 20], cond: (s, h) => desde(s, h, 'molido') >= 10 },
  'molienda-fletes': { cap: 'cosecha', modo: 'auto', lugar: en('estacion', 30), cond: (s) => s.decisiones.molienda === 'a' && s.fletesHarina >= 3 },
  'molienda-fiado': { cap: 'cosecha', modo: 'hablar', clave: 'ercilia', cond: (s) => s.decisiones.molienda === 'b' && s.harina >= HARINA_DE_ENTREGA.b && !s.entregados.has('ercilia:harina') },
  'harina-ercilia-c': { cap: 'cosecha', modo: 'hablar', clave: 'ercilia', cond: (s) => s.decisiones.molienda === 'c' && s.harina >= HARINA_DE_ENTREGA.c && !s.entregados.has('ercilia:harina-3') },
  'molienda-partir': { cap: 'cosecha', modo: 'interaccion', clave: 'raiz-molienda', cond: (s) => s.decisiones.molienda === 'c' && s.harina >= 1 && s.fletesHarina >= 2 && s.entregados.has('ercilia:harina-3') && !s.entregados.has('raiz:harina') },
  'minga-aldea': { cap: 'cosecha', modo: 'auto', lugar: en('plaza', 25), hora: [9, 17], cond: (s, h) => desde(s, h, 'cocinadas') >= 1 },
  'fermin-mulas': { cap: 'cosecha', modo: 'hablar', clave: 'fermin', requiere: ['minga-aldea'] },
  'galpon-ronda': { cap: 'cosecha', modo: 'auto', requiere: ['minga-aldea'], lugar: en('galpon-propio', 16), hora: [5.5, 11], cond: (s, h) => s.dia > diaVista(h, 'minga-aldea') },
  // ---- capítulo 8 · El cuaderno de Eusebio (las tres partes del cuaderno salen de la mesa del refugio: ver OBJETOS_ACTO2)
  'libreta-fiado': { cap: 'cuaderno', modo: 'hablar', clave: 'ercilia' },
  'cuaderno-abuelo': { cap: 'cuaderno', modo: 'hablar', clave: 'ema' },
  'los-del-cerro': { cap: 'cuaderno', modo: 'hablar', clave: 'belisario' },
  'secreto-ramon': { cap: 'cuaderno', modo: 'hablar', clave: 'ramon', hora: [17, 20], cond: (s) => s.lazos.ramon >= 0 },
  'fogon-leyenda': { cap: 'cuaderno', modo: 'auto', requiere: ['libreta-fiado', 'cuaderno-abuelo'], lugar: en('plaza', 25), hora: [20.5, 23.5] },
  'pluma-umbral': { cap: 'cuaderno', modo: 'auto', requiere: ['fogon-leyenda'], lugar: en('refugio-puerta', 14), hora: [20, 6] },
  'veta-vuelve': { cap: 'cuaderno', modo: 'hablar', clave: 'tobias', hora: [20, 5], cond: (s) => s.decisiones.coihue === 'c' },
  'herminia-noventa': { cap: 'cuaderno', modo: 'hablar', clave: 'abuela' },
  // 4.17.0 (C): las mulas de Belisario: la E sobre él, ya contado lo de los del cerro (la escena te pone en el zaino, sin hacerte montar de verdad)
  'mulas-belisario': { cap: 'cuaderno', modo: 'hablar', clave: 'belisario', requiere: ['los-del-cerro'] },
};
// escenas que arrancan con el jugador sentado (la guardia): el juego lo levanta antes, porque una escena no empieza sentado
export const ESCENAS_DESDE_SENTADO = ['guardia-molino'];
// Los ids que dispara el juego: los de las escenas de B (historia-escenas-acto2.js) y las mecánicas sin escena (ESCENAS_SIN_GUION)
export const ESCENAS_ACTO2_IDS = Object.keys(DISPARADORES_ACTO2).map((k) => DISPARADORES_ACTO2[k].escena || k).filter((x, i, l) => l.indexOf(x) === i);
// las que no tienen escena escrita: se dan por vistas y sólo cambia la mecánica (con su aviso en pantalla)
export const ESCENAS_SIN_GUION = ['harina-ercilia-c'];
// escenas que pueden empezar con el jugador en el kayak o el velero (el faro de noche)
export const ESCENAS_DESDE_VEHICULO = ['el-que-vuela'];

// ---------------------------------------------------------------- lo que cambia al ver una escena
// `ctx` (opcional): { dar(cosa, n), tieneCaballo(), gastar(cosa, n) } los pone el juego; sin ellos sólo cambia la partida guardada.
const T = (quien, tema) => (h, dia) => marcarTema(h, quien, tema, dia);
const juntar = (...fs) => (h, dia, ctx) => { for (const f of fs) f(h, dia, ctx); };
const entrega = (quien, cosa) => (h, dia) => marcarEntrega(h, quien, cosa, dia);
export const EFECTOS_ESCENA_ACTO2 = {
  'piedras-molino': T('ema', 'piedras'),
  'zaino-ramon': juntar(T('ramon', 'zaino'), (h, dia, ctx) => { if (h.prestado) h.prestado.zaino = true; if (!ctx?.tieneCaballo?.()) ctx?.dar?.('caballo', 1); }),
  'tito-coihue': T('tito', 'coihue'),
  // las diez piedras para Tobías; la pirca la levanta la escena (mundo:pirca-coihue) y queda marcada como objeto
  'tobias-pirca': juntar(entrega('tobias', 'piedra'), T('tobias', 'pirca'), (h, dia, ctx) => { marcarObjeto(h, 'pirca', dia); ctx?.gastar?.('piedra', 10); }),
  'rueda-gira': T('ema', 'rueda'),
  'luces-lago-nicanor': T('nicanor', 'luces'),
  'perdidas-devueltas': juntar(entrega('ercilia', 'dedal'), entrega('belisario', 'pipa'), entrega('panadera', 'cuchara')),
  'molienda-fiado': (h, dia, ctx) => { entrega('ercilia', 'harina')(h, dia); ctx?.gastar?.('harina', HARINA_DE_ENTREGA.b); },
  'harina-ercilia-c': (h, dia, ctx) => { entrega('ercilia', 'harina-3')(h, dia); ctx?.gastar?.('harina', HARINA_DE_ENTREGA.c); },
  'molienda-partir': juntar(entrega('raiz', 'harina'), (h, dia, ctx) => { ctx?.gastar?.('harina', 1); const d = duendesDe(h); d.convidado = Math.min(99, d.convidado + 1); }),
  'libreta-fiado': T('ercilia', 'cuaderno'),
  'cuaderno-abuelo': T('ema', 'cuaderno'),
  'los-del-cerro': T('belisario', 'cerro'),
  'secreto-ramon': T('ramon', 'ceniza'),
};
// Avisos en pantalla de lo que cambia la mecánica sola (por si la escena no está escrita o se saltó): [título, detalle]
export const NOTAS_ESCENA_ACTO2 = {
  'zaino-ramon': ['Ramón te prestó el zaino', 'Montá con la izquierda, que si no, se ofende. Es manso'],
  'tobias-pirca': ['Le diste las diez piedras a Tobías', 'La pirca quedó levantada alrededor de la raíz del coihue'],
  'perdidas-devueltas': ['Devolviste las tres cosas perdidas', 'El dedal, la pipa y la cuchara volvieron a sus dueños'],
  'molienda-fiado': ['Dejaste la harina en el almacén', 'Ercilia la anotó en la libreta, con su letra redonda'],
  'harina-ercilia-c': ['Dejaste tres medidas en el almacén', 'Ercilia las anotó en la libreta, con su letra redonda'],
  'molienda-partir': ['Dejaste una medida a la raíz', 'La dejaste entre las raíces, sin saber a quién. Ya sabés que no se la lleva nadie'],
};

// ---------------------------------------------------------------- el cuaderno de Eusebio: tres páginas que se leen en la mesa del refugio
export const PAGINAS_CUADERNO = [
  ['El cuaderno de Eusebio (1 de 3)', 'Al que tenga la llave. Si estás leyendo esto, ellos te lo dieron, y yo no estoy. No les tengas miedo, pero tampoco les tengas confianza: tené trato. El trato es así: el molino muele para todos los del valle. Para todos. Y gracias.'],
  ['El cuaderno de Eusebio (2 de 3)', 'Cuentas, bolsas, maquilas, nombres. Entre las cuentas, dibujos de puertitas en las raíces, con la medida de cada una. Y una lista: «lo que dejaron». Un canto blanco. Piñones. Una pluma de cóndor. La llave que perdí en el 79.'],
  ['El cuaderno de Eusebio (3 de 3)', 'Cuando la nieve tapa el paso, los del cerro bajan. Los de abajo les tienen más miedo que nosotros. El molino los tiene lejos; no sé si por la harina o por el ruido. Dejá una bolsa aparte, siempre una aparte. Y gracias.'],
];
// el cuaderno se lee en la mesa mientras el capítulo 8 lo pide y falta alguna página
export const paginaLeida = (s, n) => s.temas.has(`cuaderno:${n}`) || s.escenas.has(`cuaderno-${n}`);
export const cuadernoVisible = (h, s) => enCap(h, 'cuaderno') && [1, 2, 3].some((n) => !paginaLeida(s, n));

// ---------------------------------------------------------------- los objetos de historia en el mundo del acto II
// `punto`: un punto con nombre del que el juego da la posición (+ `dx`, `dz`); `lugar`: 'molino-viejo' (la raíz del coihue grande) o 'coihue' (el centro del
// árbol). Los demás campos son los de OBJETOS en historia-disparadores.js. `forma`: la malla (historia-objetos.js).
const rondaVisible = (s, h) => cosecha7(h) && s.escenas.has('minga-aldea') && (s.dia > diaVista(h, 'minga-aldea') || s.escenas.has('galpon-ronda'));
const huellasVisibles = (s, h) => enCap(h, 'perdido') && s.escenas.has('guardia-molino') && !s.escenas.has('ramon-raiz') && s.horas >= 5 && s.horas < 11;
const deNoche = (s) => s.horas >= 19.5 || s.horas < 7;
const cosecha7 = (h) => enCap(h, 'cosecha');
export const OBJETOS_ACTO2 = {
  // el coihue grande: las puertitas talladas en las raíces (decoración) y la pirca de Tobías
  'puertitas-raiz': { forma: 'puertitas', lugar: 'coihue', visible: () => true },
  'pirca': { forma: 'pirca', lugar: 'coihue', visible: (s) => s.objetos.has('pirca') },
  'raiz-pirca': { forma: null, lugar: 'molino-viejo', visible: (s, h) => enCap(h, 'rueda') && s.decisiones.coihue === 'c' && s.entregados.has('tobias:piedra') && !s.objetos.has('pirca'),
    aviso: 'Levantar la pirca en la raíz del coihue', marca: 'pirca', limpiaAcompanante: true, nota: ['La pirca está levantada', 'Las piedras redondas abajo, para que la raíz respire. Josefina va a pasar la mano por encima, sin decir nada'] },
  // las muelas rotas del molino viejo (capítulo 5), las diez bolsas de la primera molienda y la pluma que queda en el umbral
  'muelas-rotas': { forma: 'muelas', lugar: 'molino-viejo', dx: 2.6, dz: 1.2, visible: (s, h) => enCap(h, 'rueda') },
  'diez-bolsas': { forma: 'diez-bolsas', punto: 'molino-propio', dx: 2.4, dz: 0, visible: (s, h) => cosecha7(h) && desde(s, h, 'molido') >= 10 && s.decisiones.molienda == null },
  'pluma-umbral': { forma: 'pluma', lx: 0.7, lz: 3.45, visible: (s, h) => enCap(h, 'cuaderno') && s.escenas.has('fogon-leyenda') && deNoche(s) && !s.objetos.has('pluma-condor'),
    aviso: 'Levantar la pluma de cóndor', marca: 'pluma-condor', nota: ['Una pluma de cóndor', 'Larga, negra, con la punta blanca. Estaba apoyada contra tu puerta, de las que figuran en la lista de Eusebio'] },
  // capítulo 6: las tres cosas perdidas, en lugares imposibles
  'dedal': { forma: 'dedal-poste', punto: 'estacion', dx: 3.4, dz: 1.6, visible: (s, h) => enCap(h, 'perdido') && !s.objetos.has('dedal'),
    aviso: 'Bajar el dedal del poste', marca: 'dedal', nota: ['Un dedal de plata', 'Es de Ercilia. ¿Cómo llegó hasta arriba de un poste?'] },
  'pipa': { forma: 'pipa', punto: 'faro', dx: 4.5, dz: 2.5, visible: (s, h) => enCap(h, 'perdido') && !s.objetos.has('pipa'),
    aviso: 'Levantar la pipa', marca: 'pipa', nota: ['Una pipa de madera', 'Es de Belisario. Estaba en el medio del camino, apoyada como si la hubieran puesto ahí'] },
  'cuchara': { forma: 'bota-cuchara', punto: 'plaza', dx: 6, dz: 4, visible: (s, h) => enCap(h, 'perdido') && !s.objetos.has('cuchara'),
    aviso: 'Sacar la cuchara de la bota', marca: 'cuchara', nota: ['Una cuchara de palo', 'Es de Rosa. Estaba adentro de una bota, al lado de un tendal'] },
  // el rastro de huellas en la escarcha, de la raíz del coihue a la raíz de la ladera de Ramón, y el puñado de yerba que dejó
  'huellas': { forma: 'huellas', lugar: 'molino-viejo', hasta: 'raiz-ramon', visible: huellasVisibles },
  'yerba-raiz': { forma: 'yerba', punto: 'raiz-ramon', dx: 0, dz: 0, visible: (s, h) => enCap(h, 'perdido') && s.escenas.has('guardia-molino') && !s.escenas.has('ramon-raiz') },
  // capítulo 7: la harina para la raíz (D3 = c), el galpón en ronda y el cuaderno en el pozo
  'raiz-molienda': { forma: null, lugar: 'molino-viejo', visible: (s, h) => cosecha7(h) && s.decisiones.molienda === 'c' && !s.entregados.has('raiz:harina'),
    aviso: 'Dejar una medida de harina a la raíz', escena: 'molienda-partir' },
  'ronda-harina': { forma: 'ronda-harina', punto: 'galpon-propio', dx: 0, dz: 0, visible: rondaVisible },
  'cuaderno-pozo': { forma: 'cuaderno-hule', punto: 'galpon-propio', dx: 0, dz: 0, visible: (s, h) => rondaVisible(s, h) && !s.objetos.has('cuaderno-eusebio') && !s.temas.has('obj:cuaderno-eusebio'),
    aviso: 'Agarrar el cuaderno del pozo', marca: 'cuaderno-eusebio', nota: ['El cuaderno de Eusebio', 'Molino del Arroyo. E. Millán. Cuentas y tratos. Envuelto en hule, seco, como si lo hubieran guardado ayer'] },
  // capítulo 8: el cuaderno, en la mesa del refugio
  'cuaderno-mesa': { forma: null, lx: 1.1, lz: -0.6, visible: (s, h) => cuadernoVisible(h, s),
    pagina: true, aviso: 'Leer el cuaderno de Eusebio' },
  // 4.17.0 (C): lo que faltaba dibujar. La foto movida del lago y la llavecita de Herminia quedan sobre la mesa del refugio (se miran con E); los diez cantos
  // blancos son el montoncito de la veta de la cantera (aparece cuando la escena de Tobías lo muestra); la tropa de mulas de Belisario está atada junto al
  // puesto del paso y, después de acompañarla, en el mallín.
  'foto-movida': { forma: 'foto-movida', lx: 1.3, lz: 3.55, y: 0.05,   // (con las otras cosas del umbral —el canto, la puertita, la pluma—: sobre la mesa el tocadiscos le ganaba la E, que le gana a todo lo que estés mirando)
     visible: (s) => s.temas.has('obj:foto-movida'),
    aviso: 'Mirar la foto movida', nota: ['La foto movida', 'Tres manchas doradas sobre un fondo negro, y algo que parece, si uno quiere, la punta de un ala. Salió como sale todo lo que importa: movida'] },
  'llavecita': { forma: 'llavecita', lx: 1.65, lz: 3.55, y: 0.05,
     visible: (s) => s.temas.has('obj:llavecita'),
    aviso: 'Mirar la llavecita de Herminia', nota: ['La llavecita', 'De bronce, con el ojo en forma de hoja. Herminia la encontró de nena en una raíz. No se sabe a qué puerta abre'] },
  'cantos-veta': { forma: 'cantos-veta', punto: 'cantera', dx: 0, dz: 0, visible: (s) => s.temas.has('mundo:cantos-veta'),
    aviso: 'Mirar los cantos blancos de la veta', nota: ['Cantos blancos', 'Redondos, lisos como huevos, acomodados de a uno. Los mismos que el de tu umbral. Quien los puso no dejó ni una huella'] },
  // el fogón de la Noche de la Leyenda (el efecto mundo:fogon-leyenda de la escena): se ve de noche en el predio, al costado de la plaza
  'fogon-leyenda': { forma: 'fogon', punto: 'predio', dx: 3.4, dz: 0.8, visible: (s, h) => enCap(h, 'cuaderno') && s.temas.has('mundo:fogon-leyenda') && deNoche(s) },
  'mulas-paso': { forma: 'mulas', punto: 'puesto-paso', dx: -7, dz: 6, visible: (s, h) => enCap(h, 'cuaderno') && !s.temas.has('mundo:tropa-mulas') },
  'mulas-mallin': { forma: 'mulas', punto: 'mallin', dx: -3, dz: 2, visible: (s) => s.temas.has('mundo:tropa-mulas') },
  // los props del acto I que antes sólo dejaban una marca
  'pinones': { forma: 'pinones', lx: -5.2, lz: 6.0, visible: (s, h) => s.temas.has('mundo:pinones-en-tocon') && enCap(h, 'mesa') && !s.objetos.has('pinones'),
    aviso: 'Juntar los piñones del tocón', marca: 'pinones', nota: ['Un puñado de piñones', 'Alguien los dejó en el tocón. Los guardás: son de los que nadie sabe quién trae'] },
  'cuchara-techo': { forma: 'cuchara-techo', lx: 0.4, lz: 1.0, visible: (s, h) => s.temas.has('mundo:cuchara-en-techo') && enCap(h, 'mesa', 'ramal') },
  'puertita-noche': { forma: 'puertita-noche', lx: 0.55, lz: 3.45, visible: (s, h) => s.temas.has('mundo:puertita-a-la-noche') && enCap(h, 'ramal', 'rueda') && deNoche(s) && !s.objetos.has('puertita-noche'),
    aviso: 'Levantar la puertita de la puerta', marca: 'puertita-noche', raro: 'puertita-noche', nota: ['Una puertita apoyada en tu puerta', 'Alguien la dejó al revés, con la bisagra para arriba. No hay huellas'] },
};

// Lo que pasa cuando se tala el coihue grande (hachazo 6): la marca, y si no lo habías decidido así, la decisión pasa a «talarlo» y Josefina lo toma mal.
export function alTalarCoihue(h, dia = 1) {
  marcarTema(h, 'mundo', 'coihue-talado', dia);
  if (!h.aplicadas || typeof h.aplicadas !== 'object' || Array.isArray(h.aplicadas)) h.aplicadas = {};
  if (h.decisiones && h.decisiones.coihue !== 'b') {
    h.decisiones.coihue = 'b';
    if (!Object.hasOwn(h.aplicadas, 'lazo-coihue-talado')) { h.aplicadas['lazo-coihue-talado'] = Math.max(1, Math.floor(Number(dia) || 1)); cambiarLazo(h, 'ema', -2); }
  }
  return true;
}
export const proximaPagina = (s) => [1, 2, 3].find((n) => !paginaLeida(s, n)) || 0;
// Leer la próxima página del cuaderno (1 a 3). Devuelve [título, texto] o null si ya leíste las tres
export function leerPagina(h, s, dia = 1) {
  const n = proximaPagina(s);
  if (!n) return null;
  marcarTema(h, 'cuaderno', String(n), dia);
  return PAGINAS_CUADERNO[n - 1];
}
