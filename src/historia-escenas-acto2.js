// 4.16.0 (B): las escenas del ACTO II de la Historia («El trato del molino», GUION_HISTORIA.md, capítulos 5 a 8) como DATOS, con el formato del
// motor de escenas (escenas.js) y la misma estructura que el acto I (historia-escenas-acto1.js):
//   · ESCENAS_ACTO2   id → escena (37), armadas en historia-escenas-acto2-c5.js … -c8.js (una por capítulo);
//   · IDS_ACTO2       los ids, en orden de capítulo;
//   · EFECTOS_ACTO2   todos los nombres de efecto que usan, para registrarlos uno por uno (convención de historia-escenas-util.js);
//   · DISPARO_ACTO2   por escena: capítulo, dónde tiene que estar parado el jugador, cuándo y qué objetivo (id de TEXTO_ACTO2) la cuenta;
//   · POR_DEFECTO_ACTO2  la opción que vale si se saltea la escena de cada decisión grande.
// Los textos de las tarjetas, notas, cuaderno de lo raro y charla de los vecinos están en historia-texto-acto2.js.
import { ESCENAS_C5 } from './historia-escenas-acto2-c5.js';
import { ESCENAS_C6 } from './historia-escenas-acto2-c6.js';
import { ESCENAS_C7 } from './historia-escenas-acto2-c7.js';
import { ESCENAS_C8 } from './historia-escenas-acto2-c8.js';
import { efectosDe } from './historia-escenas-util.js';

export const ESCENAS_ACTO2 = { ...ESCENAS_C5, ...ESCENAS_C6, ...ESCENAS_C7, ...ESCENAS_C8 };
export const IDS_ACTO2 = Object.keys(ESCENAS_ACTO2);

// Todos los efectos que usan juntas (para registrar uno por uno en el aplicador de la historia)
export const EFECTOS_ACTO2 = [...new Set(Object.values(ESCENAS_ACTO2).flatMap((e) => efectosDe(e)))].sort();

// Qué vale si el jugador saltea la escena de una decisión: la opción más prudente (D2: dejar el coihue en pie; D3: el fiado de la aldea;
// D4: guardarlo entre los que ya saben). El aplicador la usa también para cumplir la decisión si el jugador nunca llega a la escena.
export const POR_DEFECTO_ACTO2 = { coihue: 'a', molienda: 'b', cuaderno: 'b' };

// Dónde y cuándo se dispara cada una. `jugadorEn`: dónde tiene que estar parado el jugador (los planos se anclan a él). `objetivo`: el id del
// objetivo de capítulo (TEXTO_ACTO2.capitulos[n].objetivos[].id) o de la optativa que la cuenta como hecha; null si no cuenta para ninguno.
export const DISPARO_ACTO2 = {
  // capítulo 5 · La rueda
  'piedras-molino': { cap: 5, jugadorEn: 'junto a las muelas rotas del molino viejo, con Josefina al lado', cuando: 'mañana (9:00) del día en que arranca el capítulo, al llegar con ella a molino-viejo', objetivo: 'piedras' },
  'zaino-ramon': { cap: 5, jugadorEn: 'frente a Ramón, en el Puesto Alto', cuando: 'primera charla con Ramón en el capítulo 5 (pedirle el zaino)', objetivo: 'zaino' },
  'tito-coihue': { cap: 5, jugadorEn: 'al pie del coihue grande, donde se elige el lugar del aserradero', cuando: 'al marcar el sitio del aserradero cerca del coihue, o al pasar a menos de 8 m del coihue con el molino hecho', objetivo: 'coihue' },
  'coihue-en-pie': { cap: 5, jugadorEn: 'a unos metros del aserradero terminado, más de 25 m aguas abajo del coihue', cuando: 'terminar el aserradero si D2 = a', objetivo: 'coihue' },
  'coihue-talado': { cap: 5, jugadorEn: 'a 5 m del tocón del coihue grande', cuando: 'después del sexto hachazo, si D2 = b', objetivo: 'coihue' },
  'tobias-pirca': { cap: 5, jugadorEn: 'frente a Tobías, en la cantera; la segunda mitad pasa sola en el coihue (fundido cruzado)', cuando: 'entregar las 10 piedras a Tobías si D2 = c', objetivo: 'coihue' },
  'rueda-gira': { cap: 5, jugadorEn: 'a 2,5 m de la rueda del molino de agua terminado', cuando: 'la primera vez que el molino de la historia gira', objetivo: 'molino' },
  'trigo-abuelo': { cap: 5, jugadorEn: 'frente a Josefina, en la seccional', cuando: 'optativa «El trigo del abuelo», solo si D1 = c', objetivo: 'trigo-abuelo' },
  'tablas-tito': { cap: 5, jugadorEn: 'frente a Tito, en la carpintería', cuando: 'optativa «Las tablas de Tito», solo si D2 = b', objetivo: 'tablas-tito' },
  'truchas-nicanor': { cap: 5, jugadorEn: 'en el muelle, con la caña', cuando: 'optativa «Primeras truchas del otoño»', objetivo: 'truchas' },
  // capítulo 6 · Lo que se pierde, aparece
  'luces-lago-nicanor': { cap: 6, jugadorEn: 'en el muelle', cuando: '20:30, primera charla de historia con Nicanor del capítulo 6', objetivo: null },
  'el-que-vuela': { cap: 6, jugadorEn: 'en el kayak o el velero, a menos de 40 m del faro', cuando: 'entre las 23 y la 1, la primera vez que se llega al faro de noche en el capítulo 6', objetivo: 'lago' },
  'guardia-molino': { cap: 6, jugadorEn: 'sentado en el banco junto al molino de la historia', cuando: 'sentarse (E) entre las 22 y las 2; la escena adelanta la hora hasta ~1 de la mañana', objetivo: 'guardia' },
  'huellas-escarcha': { cap: 6, jugadorEn: 'junto al molino, a la mañana siguiente a la guardia', cuando: 'al salir del molino entre las 6 y las 8:30, después de guardia-molino', objetivo: 'huellas' },
  'ramon-raiz': { cap: 6, jugadorEn: 'escondido detrás de un árbol a 15 m de la raíz de la ladera del Puesto Alto, al final de las huellas', cuando: '7:30, al llegar a la raíz siguiendo las huellas', objetivo: 'huellas' },
  'perdidas-devueltas': { cap: 6, jugadorEn: 'frente a Ercilia, en el almacén', cuando: 'entregar las tres cosas perdidas', objetivo: 'perdidas' },
  'masa-crece': { cap: 6, jugadorEn: 'frente a Rosa, en la panadería', cuando: 'optativa «La masa que crece sola», solo si D1 = b; pasa la noche en la panadería', objetivo: 'masa-crece' },
  'foto-sofia': { cap: 6, jugadorEn: 'frente a Sofía, en el estudio de fotos', cuando: 'optativa «Foto para Sofía», solo si sacaste la foto movida (objeto foto-movida)', objetivo: 'foto-sofia' },
  // capítulo 7 · La cosecha
  'primera-molienda': { cap: 7, jugadorEn: 'junto a la puerta del molino, con las diez bolsas en el piso', cuando: 'mañana, cuando el molino juntó diez medidas de harina', objetivo: 'molienda' },
  'molienda-fletes': { cap: 7, jugadorEn: 'en el andén de la Estación del Valle', cuando: 'entregar el tercer flete de harina si D3 = a', objetivo: 'molienda' },
  'molienda-fiado': { cap: 7, jugadorEn: 'frente a Ercilia, en el almacén', cuando: 'entregar las seis bolsas si D3 = b', objetivo: 'molienda' },
  'molienda-partir': { cap: 7, jugadorEn: 'al pie del coihue grande (o del tocón), con la bolsa a la raíz', cuando: 'dejar la bolsa de la raíz si D3 = c, ya hechos los dos fletes y las tres bolsas al almacén', objetivo: 'molienda' },
  'minga-aldea': { cap: 7, jugadorEn: 'en el camino del refugio a la aldea, donde se arma la minga', cuando: 'llegar con algo cocinado a la minga (día de la minga o la tarde siguiente)', objetivo: 'minga' },
  'fermin-mulas': { cap: 7, jugadorEn: 'frente a Fermín, en el galpón de esquila', cuando: 'optativa «Fermín quiere hablar», después de la minga', objetivo: 'fermin-habla' },
  'galpon-ronda': { cap: 7, jugadorEn: 'en la puerta del galpón construido por el jugador', cuando: 'al amanecer siguiente a la minga, al abrir el galpón (PUNTO MEDIO)', objetivo: 'galpon' },
  // capítulo 8 · El cuaderno de Eusebio
  'cuaderno-1': { cap: 8, jugadorEn: 'donde sea (se lee desde el diario: la página 1 del cuaderno)', cuando: 'abrir el cuaderno de Eusebio en el diario, primera parte', objetivo: 'leer' },
  'cuaderno-2': { cap: 8, jugadorEn: 'donde sea (diario)', cuando: 'abrir la segunda parte, después de la primera', objetivo: 'leer' },
  'cuaderno-3': { cap: 8, jugadorEn: 'donde sea (diario)', cuando: 'abrir la tercera parte, después de la segunda', objetivo: 'leer' },
  'libreta-fiado': { cap: 8, jugadorEn: 'frente a Ercilia, en el almacén', cuando: 'mostrarle el cuaderno a Ercilia (hablar ercilia/cuaderno)', objetivo: 'ercilia' },
  'cuaderno-abuelo': { cap: 8, jugadorEn: 'frente a Josefina, en la seccional', cuando: 'mostrarle el cuaderno a Josefina (hablar ema/cuaderno), a la tarde', objetivo: 'josefina' },
  'los-del-cerro': { cap: 8, jugadorEn: 'frente a Belisario, junto al fogón del Puesto del Paso', cuando: 'hablar con Belisario sobre los del cerro', objetivo: 'belisario' },
  'secreto-ramon': { cap: 8, jugadorEn: 'junto al banco de la puerta del Puesto Alto', cuando: 'entre las 17 y las 20 hablando con Ramón; con lazo de Ramón < 0 lo ves de lejos', objetivo: 'ramon' },
  'fogon-leyenda': { cap: 8, jugadorEn: 'junto al fogón del predio de la aldea', cuando: '21:00 de la Noche de la Leyenda (día 9) o fogón guionado antes', objetivo: 'fogon' },
  'pluma-umbral': { cap: 8, jugadorEn: 'en el umbral del refugio, de vuelta del fogón', cuando: 'esa noche, al llegar al refugio después del fogón', objetivo: null },
  'veta-vuelve': { cap: 8, jugadorEn: 'frente a Tobías, en la cantera, de noche', cuando: 'optativa «La veta que vuelve», solo si D2 = c', objetivo: 'veta-vuelve' },
  'mulas-belisario': { cap: 8, jugadorEn: 'a caballo, junto a la tropa de mulas de Belisario', cuando: 'optativa «Las mulas de Belisario»', objetivo: 'mulas' },
  'herminia-noventa': { cap: 8, jugadorEn: 'frente a Herminia, en la casa de la abuela', cuando: 'optativa «Herminia y los noventa», con la torta', objetivo: 'noventa' },
};
