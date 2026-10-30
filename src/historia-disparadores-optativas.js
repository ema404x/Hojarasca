// 4.18.0 (A): cuándo y dónde se disparan las escenas de las subtramas optativas que no tenían disparador (las nuevas de B y las que quedaron
// sin conectar en el acto III), qué cambia en la partida cuando se ven y los objetos del mundo que piden. Módulo PURO (sin three ni DOM; se
// prueba en Node). Mismo formato que historia-disparadores-acto2.js y -acto3.js (ver el encabezado de historia-disparadores.js).
// La ventana de capítulos de cada optativa la pone el registro (historia-optativas.js): el `cap` de acá es el primero, el resto lo abre el registro.
//
// `repetible: true` en un disparador: la escena se puede volver a disparar aunque ya esté vista (las de la costumbre y la broma del galpón).
import { marcarTema, marcarEntrega, marcarObjeto, capituloActual } from './historia.js';
import { TABLAS_TITO, PRECIO_TABLAS_TITO, vueltasDe, tieneFrasco } from './historia-optativas.js';

const en = (nombre, radio) => [nombre, radio];
const enCap = (h, ...ids) => ids.includes(capituloActual(h).id);
const deNoche = (s) => s.horas >= 19 || s.horas < 6;

// Los lugares nuevos de los que el juego pasa la distancia (main.js, puntosDeHistoria): la casa (o la plaza) del cumpleaños de hoy y tu gallinero
export const LUGARES_OPTATIVAS = ['cumple', 'gallinero'];

export const DISPARADORES_OPTATIVAS = {
  // ---- acto I
  // el frasco de masa madre de la repisa: la E en el refugio lo pone en la mochila (escena de B) y la E sobre Rosa, en la panadería, se lo da
  'frasco-repisa': { cap: 'llave', modo: 'interaccion', clave: 'frasco-repisa', requiere: ['nota-eusebio'], cond: (s) => !tieneFrasco(s) },
  'frasco-rosa': { cap: 'llave', modo: 'hablar', clave: 'panadera', cond: (s) => tieneFrasco(s) && s.pobladores.has('panadera') },
  // la oveja escapada de Ramón, arreada hasta el Puesto Alto (la marca `arreo:oveja-ramon` la deja el arreo del mundo); si mandaste al perro,
  // la oveja volvió sola y la escena (su variante del perro) sale al pasar por el puesto
  'oveja-ramon': { cap: 'bolsa', modo: 'auto', lugar: en('puesto', 30), cond: (s) => s.temas.has('arreo:oveja-ramon') || (s.eventosOpcion?.oveja === 'perro' && (Number(s.eventosDia?.oveja) || 0) >= (Number(s.ofrecidas?.oveja) || 1) && s.ofrecidas?.oveja !== undefined) },
  // pan o harina para Fermín, en el galpón de esquila (la escena de B gasta lo que le diste)
  'pan-fermin': { cap: 'mesa', modo: 'hablar', clave: 'fermin', requiere: ['fermin-galpon'], cond: (s) => s.pan >= 1 || s.harina >= 1 },
  // los lugares lindos de la vuelta con Graciela (la casa de té es te-graciela, del acto I): el mirador del pehuén y el faro
  'vuelta-mirador': { cap: 'ramal', modo: 'auto', requiere: ['anden-graciela'], lugar: en('mirador', 16), cond: (s) => s.acompanante === 'graciela' },
  'vuelta-faro': { cap: 'ramal', modo: 'auto', requiere: ['anden-graciela'], lugar: en('faro', 30), cond: (s) => s.acompanante === 'graciela' },
  // ---- acto III
  // las ovejas desparramadas, de vuelta en el corral (la marca `arreo:corral-ramon` la deja el arreo del mundo)
  'juntar-ovejas': { cap: 'frios', modo: 'auto', lugar: en('puesto', 40), cond: (s) => s.temas.has('arreo:corral-ramon') },
  // el cumpleaños de la aldea de hoy (en la casa del que cumple o en la plaza), aunque venga la nevada
  'cumple-nevada': { cap: 'arco', modo: 'auto', no: ['noche-espera'], lugar: en('cumple', 18), hora: [15, 21], cond: (s) => !!s.cumple },
  // las seis plumas del gallinero (no es optativa: es una de las tres maneras de juntar las plumas del arco)
  'plumas-gallinero': { cap: 'arco', modo: 'auto', lugar: en('gallinero', 10), cond: (s) => s.plumas >= 6 && s.terminadas.has('gallinero') && !s.escenas.has('plumas-bosque') && !s.escenas.has('plumas-josefina') },
  // abrir el galpón sin golpear (capítulo 10, de noche, antes de golpear): una broma de ellos, sin castigo; se repite
  'galpon-sin-golpear': { cap: 'golpea', modo: 'interaccion', clave: 'puerta-galpon-abrir', no: ['galpon-golpe'], repetible: true },
};

// Lo que cambia al ver cada una (una sola vez; ver aplicarVistas). `ctx`: { gastar(cosa, n), cobrar(premio) } los pone el juego.
const T = (quien, tema) => (h, dia) => marcarTema(h, quien, tema, dia);
export const EFECTOS_ESCENA_OPTATIVAS = {
  'frasco-repisa': (h, dia) => { marcarObjeto(h, 'frasco-masa-madre', dia); },   // (la escena de B lo marca con `objeto:`; esto vale si falta)
  'frasco-rosa': (h, dia) => { marcarEntrega(h, 'panadera', 'frasco', dia); T('rosa', 'frasco')(h, dia); },
  'oveja-ramon': T('ramon', 'oveja'),
  // un pan casero o, si no hay, una medida de harina: lo gasta la escena de B (`quitar:`); si la escena no corrió su `quitar`, lo gasta esto
  'pan-fermin': (h, dia, ctx) => {
    marcarEntrega(h, 'fermin', 'pan', dia);
    const ap = h.aplicadas || {};
    if (Object.hasOwn(ap, 'e:pan-fermin:quitar:pan-casero:1') || Object.hasOwn(ap, 'e:pan-fermin:quitar:harina:1')) return;
    const pan = (Number(ctx?.cuanto?.('pan-casero')) || 0) >= 1; ctx?.gastar?.(pan ? 'pan-casero' : 'harina', 1);
  },
  'vuelta-mirador': T('vuelta', 'mirador'),
  'vuelta-faro': T('vuelta', 'faro'),
  'juntar-ovejas': T('ramon', 'ovejas'),
  'cumple-nevada': T('ercilia', 'cumple'),
  // 4.18.0: las seis tablas de coihue que le vendés a Tito (la escena es de la 4.16.0 y no cobraba nada)
  'tablas-tito': (h, dia, ctx) => { marcarEntrega(h, 'tito', 'tablas-coihue', dia); ctx?.gastar?.((Number(ctx?.cuanto?.('tabla-coihue')) || 0) >= TABLAS_TITO ? 'tabla-coihue' : 'tabla', TABLAS_TITO); ctx?.cobrar?.({ pesos: PRECIO_TABLAS_TITO, texto: `Tito te pagó $${PRECIO_TABLAS_TITO} por las seis tablas de coihue` }); },
};
// Avisos en pantalla de lo que cambia la mecánica sola (por si la escena no está escrita o se saltó)
export const NOTAS_ESCENA_OPTATIVAS = {
  'frasco-rosa': ['Le llevaste el frasco a Rosa', 'Masa de 1987. Te va a dejar pan tres mañanas'],
  'oveja-ramon': ['La oveja volvió al Puesto Alto', 'Ramón la cuenta con la mirada y no dice nada'],
  'pan-fermin': ['Le llevaste algo a Fermín', 'Lo guardó sin decir gracias, que en él es decir mucho'],
  'juntar-ovejas': ['Las ovejas volvieron al corral', 'La tranquera quedó atada con alambre, por las dudas'],
  'tablas-tito': ['Le vendiste las tablas a Tito', `Seis tablas de coihue, $${PRECIO_TABLAS_TITO}`],
};

// Los objetos del mundo que piden (mismo formato que OBJETOS en historia-disparadores.js)
export const OBJETOS_OPTATIVAS = {
  // el frasco de masa madre de la repisa del refugio: se levanta con la E (capítulos 1 a 4, con la optativa ofrecida)
  // (la malla `frasco` es de C: la estantería del fondo del refugio, la tabla de arriba)
  'frasco-repisa': { forma: 'frasco', lx: -0.08, lz: -2.55, y: 1.44, visible: (s, h) => enCap(h, 'llave', 'bolsa', 'mesa', 'ramal') && s.escenas.has('nota-eusebio') && !tieneFrasco(s) && !s.escenas.has('frasco-rosa'),
    aviso: 'Llevarte el frasco de masa madre', escena: 'frasco-repisa' },
  // la puerta del galpón, del otro lado: abrir sin golpear (al lado de la de golpear; ver OBJETOS_ACTO3['puerta-galpon'])
  'puerta-galpon-abrir': { forma: null, punto: 'galpon-noche', dx: 3.0, dz: 0, /* (a 3 m de la de golpear: con las dos a 1,8 m la E elegía siempre «Golpear») */ visible: (s, h) => enCap(h, 'golpea') && !s.escenas.has('galpon-golpe') && deNoche(s),
    aviso: 'Abrir la puerta del galpón sin golpear', escena: 'galpon-sin-golpear' },
};
export { vueltasDe, tieneFrasco };
