// 4.16.0: cuándo y dónde se dispara cada escena del ACTO II de la Historia (capítulos 5 a 8), qué cambia en la partida cuando se ve y los objetos
// de historia del mundo del acto II (y los props del acto I que antes sólo dejaban una marca). Módulo PURO (sin three ni DOM; se prueba en Node).
// Mismo formato que `historia-disparadores.js` (que junta estas tablas con las del acto I): ver el encabezado de ese archivo.
//
// Regla de siempre: una escena que es objetivo se alcanza con la E sobre el vecino o el objeto, o llegando al lugar; ninguna traba un capítulo.
import { marcarTema, marcarEntrega, cambiarLazo, duendesDe, capituloActual } from './historia.js';

const en = (nombre, radio) => [nombre, radio];
const diaVista = (h, id) => Math.max(0, Math.floor(Number(h?.escenas?.vistas && Object.hasOwn(h.escenas.vistas, id) ? h.escenas.vistas[id] : 0) || 0));
// cuánto se cuenta desde que empezó el capítulo en curso
const desde = (s, h, k) => Math.max(0, (Number(s[k]) || 0) - (Number(h?.base?.[k]) || 0));
const enCap = (h, ...ids) => ids.includes(capituloActual(h).id);

// Los lugares nuevos de los que el juego pasa la distancia (los arma `puntosDeHistoria` de main.js)
export const LUGARES_ACTO2 = ['molino-propio', 'galpon-propio', 'raiz-ramon', 'coihue'];

// Cuánta harina cuesta cada entrega de la primera molienda (D3): 6 en b, 3 en c
export const HARINA_DE_ENTREGA = { b: 6, c: 3 };

export const DISPARADORES_ACTO2 = {
  // ---- capítulo 5 · La rueda
  'piedras-molino': { cap: 'rueda', modo: 'auto', lugar: en('molino-viejo', 14), hora: [7, 20] },
  'zaino-ramon': { cap: 'rueda', modo: 'auto', requiere: ['piedras-molino'], lugar: en('puesto', 14), hora: [7, 20] },
  'zaino-ramon:hablar': { escena: 'zaino-ramon', cap: 'rueda', modo: 'hablar', clave: 'ramon', requiere: ['piedras-molino'] },
  'tito-coihue': { cap: 'rueda', modo: 'auto', requiere: ['piedras-molino'], lugar: en('molino-viejo', 30), hora: [7, 20], cond: (s) => s.terminadas.has('molino-agua') },
  'tobias-cantera': { cap: 'rueda', modo: 'hablar', clave: 'tobias', cond: (s) => s.decisiones.coihue === 'c' && s.piedra >= 10 && !s.entregados.has('tobias:piedra') },
  'rueda-gira': { cap: 'rueda', modo: 'auto', requiere: ['tito-coihue'], lugar: en('molino-propio', 30), hora: [7, 20], cond: (s) => s.terminadas.has('molino-agua') && s.decisiones.coihue != null && s.terminadas.has('aserradero') },
  // ---- capítulo 6 · Lo que se pierde, aparece
  'perdidas-ercilia': { cap: 'perdido', modo: 'hablar', clave: 'ercilia' },
  'perdidas-rosa': { cap: 'perdido', modo: 'hablar', clave: 'panadera' },
  'devuelve-dedal': { cap: 'perdido', modo: 'hablar', clave: 'ercilia', cond: (s) => s.objetos.has('dedal') && !s.entregados.has('ercilia:dedal') },
  'devuelve-cuchara': { cap: 'perdido', modo: 'hablar', clave: 'panadera', cond: (s) => s.objetos.has('cuchara') && !s.entregados.has('panadera:cuchara') },
  'devuelve-pipa': { cap: 'perdido', modo: 'hablar', clave: 'belisario', cond: (s) => s.objetos.has('pipa') && !s.entregados.has('belisario:pipa') },
  'luces-lago': { cap: 'perdido', modo: 'hablar', clave: 'nicanor' },
  'el-que-vuela': { cap: 'perdido', modo: 'auto', lugar: en('faro', 60), hora: [23, 1], requiere: ['luces-lago'] },
  'guardia-molino': { cap: 'perdido', modo: 'auto', lugar: en('molino-viejo', 22), hora: [0.5, 2.5], cond: (s) => s.sentado },
  'raiz-ramon': { cap: 'perdido', modo: 'auto', requiere: ['guardia-molino'], lugar: en('raiz-ramon', 10), hora: [5.5, 10] },
  // ---- capítulo 7 · La cosecha
  'primera-molienda': { cap: 'cosecha', modo: 'auto', lugar: en('molino-propio', 25), hora: [6, 20], cond: (s, h) => desde(s, h, 'molido') >= 10 },
  'minga-vecinos': { cap: 'cosecha', modo: 'auto', lugar: en('plaza', 25), hora: [9, 17], cond: (s, h) => desde(s, h, 'cocinadas') >= 1 },
  'galpon-ronda': { cap: 'cosecha', modo: 'auto', requiere: ['minga-vecinos'], lugar: en('galpon-propio', 16), hora: [5.5, 11], cond: (s, h) => s.dia > diaVista(h, 'minga-vecinos') },
  'fiado-ercilia': { cap: 'cosecha', modo: 'hablar', clave: 'ercilia', cond: (s) => (s.decisiones.molienda === 'b' && s.harina >= HARINA_DE_ENTREGA.b && !s.entregados.has('ercilia:harina')) || (s.decisiones.molienda === 'c' && s.harina >= HARINA_DE_ENTREGA.c && !s.entregados.has('ercilia:harina-3')) },
  'harina-raiz': { cap: 'cosecha', modo: 'interaccion', clave: 'raiz-molienda', cond: (s) => s.decisiones.molienda === 'c' && s.harina >= 1 && !s.entregados.has('raiz:harina') },
  // ---- capítulo 8 · El cuaderno de Eusebio
  'libreta-ercilia': { cap: 'cuaderno', modo: 'hablar', clave: 'ercilia' },
  'cuaderno-josefina': { cap: 'cuaderno', modo: 'hablar', clave: 'ema' },
  'los-del-cerro': { cap: 'cuaderno', modo: 'hablar', clave: 'belisario' },
  'secreto-ramon': { cap: 'cuaderno', modo: 'hablar', clave: 'ramon', hora: [17, 20], cond: (s) => s.lazos.ramon >= 0 },
  'fogon-leyenda': { cap: 'cuaderno', modo: 'auto', requiere: ['libreta-ercilia', 'cuaderno-josefina'], lugar: en('plaza', 25), hora: [20.5, 23.5] },
};
export const ESCENAS_ACTO2_IDS = ['piedras-molino', 'zaino-ramon', 'tito-coihue', 'tobias-cantera', 'rueda-gira', 'perdidas-ercilia', 'perdidas-rosa', 'devuelve-dedal', 'devuelve-pipa', 'devuelve-cuchara', 'luces-lago', 'el-que-vuela', 'guardia-molino', 'raiz-ramon', 'primera-molienda', 'minga-vecinos', 'galpon-ronda', 'fiado-ercilia', 'harina-raiz', 'libreta-ercilia', 'cuaderno-josefina', 'los-del-cerro', 'secreto-ramon', 'fogon-leyenda'];

// ---------------------------------------------------------------- lo que cambia al ver una escena
// `ctx` (opcional): { dar(cosa, n), tieneCaballo(), gastar(cosa, n) } los pone el juego; sin ellos sólo cambia la partida guardada.
const T = (quien, tema) => (h, dia) => marcarTema(h, quien, tema, dia);
const juntar = (...fs) => (h, dia, ctx) => { for (const f of fs) f(h, dia, ctx); };
const entrega = (quien, cosa) => (h, dia) => marcarEntrega(h, quien, cosa, dia);
export const EFECTOS_ESCENA_ACTO2 = {
  'piedras-molino': T('ema', 'piedras'),
  'zaino-ramon': juntar(T('ramon', 'zaino'), (h, dia, ctx) => { if (h.prestado) h.prestado.zaino = true; if (!ctx?.tieneCaballo?.()) ctx?.dar?.('caballo', 1); }),
  'tito-coihue': T('tito', 'coihue'),
  'tobias-cantera': juntar(entrega('tobias', 'piedra'), T('tobias', 'pirca'), (h, dia, ctx) => { h.acompanante = 'tobias'; ctx?.gastar?.('piedra', 10); }),
  'rueda-gira': T('ema', 'rueda'),
  'perdidas-ercilia': T('ercilia', 'perdidas'),
  'perdidas-rosa': T('panadera', 'perdidas'),
  'devuelve-dedal': entrega('ercilia', 'dedal'),
  'devuelve-cuchara': entrega('panadera', 'cuchara'),
  'devuelve-pipa': entrega('belisario', 'pipa'),
  'luces-lago': T('nicanor', 'luces'),
  'fiado-ercilia': juntar((h, dia, ctx) => {
    const d = h.decisiones?.molienda === 'c' ? 'c' : 'b';
    entrega('ercilia', d === 'c' ? 'harina-3' : 'harina')(h, dia);
    ctx?.gastar?.('harina', HARINA_DE_ENTREGA[d]);
  }),
  'harina-raiz': juntar(entrega('raiz', 'harina'), (h, dia, ctx) => { ctx?.gastar?.('harina', 1); const d = duendesDe(h); d.convidado = Math.min(99, d.convidado + 1); }),
  'libreta-ercilia': T('ercilia', 'cuaderno'),
  'cuaderno-josefina': T('ema', 'cuaderno'),
  'los-del-cerro': T('belisario', 'cerro'),
  'secreto-ramon': T('ramon', 'ceniza'),
};
// Avisos en pantalla de lo que cambia la mecánica sola (por si la escena no está escrita o se saltó): [título, detalle]
export const NOTAS_ESCENA_ACTO2 = {
  'zaino-ramon': ['Ramón te prestó el zaino', 'Montá con la izquierda, que si no, se ofende. Es manso'],
  'tobias-cantera': ['Tobías va con vos', 'Le dejaste las diez piedras. Caminá hasta el coihue grande y él te sigue'],
  'devuelve-dedal': ['Le devolviste el dedal a Ercilia', 'Lo guardó en el bolsillo del delantal sin decir cómo había llegado ahí'],
  'devuelve-cuchara': ['Le devolviste la cuchara a Rosa', 'Dice que la buscaba desde el martes'],
  'devuelve-pipa': ['Le devolviste la pipa a Belisario', 'La miró, la olió y se la guardó. «Ya me parecía que andaba cerca»'],
  'fiado-ercilia': ['Dejaste la harina en el almacén', 'Ercilia la anotó en la libreta, con su letra redonda'],
  'harina-raiz': ['Dejaste una medida a la raíz', 'La dejaste entre las raíces, sin saber a quién. Ya sabés que no se la lleva nadie'],
};

// ---------------------------------------------------------------- el cuaderno de Eusebio: tres páginas que se leen en la mesa del refugio
export const PAGINAS_CUADERNO = [
  ['El cuaderno de Eusebio (1 de 3)', 'Al que tenga la llave. Si estás leyendo esto, ellos te lo dieron, y yo no estoy. No les tengas miedo, pero tampoco les tengas confianza: tené trato. El trato es así: el molino muele para todos los del valle. Para todos. Y gracias.'],
  ['El cuaderno de Eusebio (2 de 3)', 'Cuentas, bolsas, maquilas, nombres. Entre las cuentas, dibujos de puertitas en las raíces, con la medida de cada una. Y una lista: «lo que dejaron». Un canto blanco. Piñones. Una pluma de cóndor. La llave que perdí en el 79.'],
  ['El cuaderno de Eusebio (3 de 3)', 'Cuando la nieve tapa el paso, los del cerro bajan. Los de abajo les tienen más miedo que nosotros. El molino los tiene lejos; no sé si por la harina o por el ruido. Dejá una bolsa aparte, siempre una aparte. Y gracias.'],
];
// el cuaderno se lee en la mesa mientras el capítulo 8 lo pide y falta alguna página
export const cuadernoVisible = (h, s) => enCap(h, 'cuaderno') && [1, 2, 3].some((n) => !s.temas.has(`cuaderno:${n}`));

// ---------------------------------------------------------------- los objetos de historia en el mundo del acto II
// `punto`: un punto con nombre del que el juego da la posición (+ `dx`, `dz`); `lugar`: 'molino-viejo' (la raíz del coihue grande) o 'coihue' (el centro del
// árbol). Los demás campos son los de OBJETOS en historia-disparadores.js. `forma`: la malla (historia-objetos.js).
const cosecha7 = (h) => enCap(h, 'cosecha');
const rondaVisible = (s, h) => cosecha7(h) && s.escenas.has('minga-vecinos') && (s.dia > diaVista(h, 'minga-vecinos') || s.escenas.has('galpon-ronda'));
const huellasVisibles = (s, h) => enCap(h, 'perdido') && s.escenas.has('guardia-molino') && !s.escenas.has('raiz-ramon') && s.horas >= 5 && s.horas < 11;
const deNoche = (s) => s.horas >= 19.5 || s.horas < 7;
export const OBJETOS_ACTO2 = {
  // el coihue grande: las puertitas talladas en las raíces (decoración) y la pirca de Tobías
  'puertitas-raiz': { forma: 'puertitas', lugar: 'coihue', visible: () => true },
  'pirca': { forma: 'pirca', lugar: 'coihue', visible: (s) => s.objetos.has('pirca') },
  'raiz-pirca': { forma: null, lugar: 'molino-viejo', visible: (s, h) => enCap(h, 'rueda') && s.decisiones.coihue === 'c' && s.entregados.has('tobias:piedra') && !s.objetos.has('pirca'),
    aviso: 'Levantar la pirca en la raíz del coihue', marca: 'pirca', limpiaAcompanante: true, nota: ['La pirca está levantada', 'Las piedras redondas abajo, para que la raíz respire. Josefina va a pasar la mano por encima, sin decir nada'] },
  // capítulo 6: las tres cosas perdidas, en lugares imposibles
  'dedal': { forma: 'dedal-poste', punto: 'estacion', dx: 3.4, dz: 1.6, visible: (s, h) => enCap(h, 'perdido') && !s.objetos.has('dedal'),
    aviso: 'Bajar el dedal del poste', marca: 'dedal', nota: ['Un dedal de plata', 'Es de Ercilia. ¿Cómo llegó hasta arriba de un poste?'] },
  'pipa': { forma: 'pipa', punto: 'faro', dx: 4.5, dz: 2.5, visible: (s, h) => enCap(h, 'perdido') && !s.objetos.has('pipa'),
    aviso: 'Levantar la pipa', marca: 'pipa', nota: ['Una pipa de madera', 'Es de Belisario. Estaba en el medio del camino, apoyada como si la hubieran puesto ahí'] },
  'cuchara': { forma: 'bota-cuchara', punto: 'plaza', dx: 6, dz: 4, visible: (s, h) => enCap(h, 'perdido') && !s.objetos.has('cuchara'),
    aviso: 'Sacar la cuchara de la bota', marca: 'cuchara', nota: ['Una cuchara de palo', 'Es de Rosa. Estaba adentro de una bota, al lado de un tendal'] },
  // el rastro de huellas en la escarcha, de la raíz del coihue a la raíz de la ladera de Ramón, y el puñado de yerba que dejó
  'huellas': { forma: 'huellas', lugar: 'molino-viejo', hasta: 'raiz-ramon', visible: huellasVisibles },
  'yerba-raiz': { forma: 'yerba', punto: 'raiz-ramon', dx: 0, dz: 0, visible: (s, h) => enCap(h, 'perdido') && s.escenas.has('guardia-molino') && !s.escenas.has('raiz-ramon') },
  // capítulo 7: la harina para la raíz (D3 = c), el galpón en ronda y el cuaderno en el pozo
  'raiz-molienda': { forma: null, lugar: 'molino-viejo', visible: (s, h) => cosecha7(h) && s.decisiones.molienda === 'c' && !s.entregados.has('raiz:harina'),
    aviso: 'Dejar una medida de harina a la raíz', escena: 'harina-raiz' },
  'ronda-harina': { forma: 'ronda-harina', punto: 'galpon-propio', dx: 0, dz: 0, visible: rondaVisible },
  'cuaderno-pozo': { forma: 'cuaderno-hule', punto: 'galpon-propio', dx: 0, dz: 0, visible: (s, h) => rondaVisible(s, h) && !s.objetos.has('cuaderno-eusebio'),
    aviso: 'Agarrar el cuaderno del pozo', marca: 'cuaderno-eusebio', nota: ['El cuaderno de Eusebio', 'Molino del Arroyo. E. Millán. Cuentas y tratos. Envuelto en hule, seco, como si lo hubieran guardado ayer'] },
  // capítulo 8: el cuaderno, en la mesa del refugio
  'cuaderno-mesa': { forma: null, lx: -0.9, lz: 1.4, visible: (s, h) => cuadernoVisible(h, s),
    pagina: true, aviso: 'Leer el cuaderno de Eusebio' },
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
    if (!Object.hasOwn(h.aplicadas, 'coihue-talado')) { h.aplicadas['coihue-talado'] = Math.max(1, Math.floor(Number(dia) || 1)); cambiarLazo(h, 'ema', -2); }
  }
  return true;
}
// Leer la próxima página del cuaderno (1 a 3). Devuelve [título, texto] o null si ya leíste las tres
export function leerPagina(h, s, dia = 1) {
  for (let n = 1; n <= 3; n++) if (!s.temas.has(`cuaderno:${n}`)) { marcarTema(h, 'cuaderno', String(n), dia); return PAGINAS_CUADERNO[n - 1]; }
  return null;
}
