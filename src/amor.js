// 3.7.1: el amor en la aldea (PLAN_3_7.md, «3.7.1 — Amor en la aldea» y «Detalles y extras elegidos»). Todo lo
// decidió el usuario:
//   · romance SÓLO con pobladoras adultas y solteras (el jugador es hombre): nunca con chicos (en ninguna
//     etapa), nunca con casados (los Jones), nunca con Pocha (pareja fija de Anselmo). Lo garantizan las
//     reglas (`esCandidata`, `puedeRomance`) y el saneo del guardado, no sólo el diálogo;
//   · coquetear y declararse (ella puede decir que no), citas; se puede salir con más de una, pero el chisme
//     corre y se enojan;
//   · «ñiki ñiki» estilo Sims, sin mostrar nada (un fundido): da descanso y buen ánimo, sólo con los hijos (si
//     hay) dormidos en su cuarto;
//   · el anillo lo hace Anselmo con un canto rodado; casamiento civil (el juez de paz, nada religioso);
//   · vivir juntos en el refugio o en la casa de ella; habilidades según con quién te casás (3 niveles, uno por
//     estación); hasta 2 hijos; separación si la descuidás mucho (los hijos viven con ella y te visitan), y se
//     puede reconquistar;
//   · un ajuste para apagar todo (Ajustes → Romance): apagado, nada de esto aparece (lo que ya pasó queda
//     guardado tal cual, quieto, y vuelve si lo prendés).
// Extras elegidos: el lugar favorito de cada una (para declararse y proponer), ramos de flores y cartas de amor
// por el correo, en público se nota la pareja, el chisme con humor (los vecinos, y un gancho para la radio y
// el diario de la 3.7.4).
//
// Módulo puro (como aldea.js y vecindad.js): sin three ni DOM, determinista (todo el azar sale de semillas).
// Los textos están en amor-voces.js. Lo conecta al juego amor-juego.js (el menú de la charla, las citas, el
// correo, el anillo, el casamiento, el fundido) y se guarda en `progreso.amor` (`amorNuevo`, `sanearAmor`).
//
// ================================================================ API PARA EL EQUIPO DEL MUNDO
// Todo sale de `mundoAmor(progreso, { dia, hora, aldea, romance })` (un resumen por consulta, sin estado
// propio) y de las rutinas `rutinaPareja` y `rutinaHijo`. Con el ajuste apagado (`romance: false`) o en el
// Desafío devuelve `{ activo: false }` y el mundo no muestra NADA de esto.
//   · cita:      { clave, lugar, nombre, aldea: { edificio, suyo, tuyo } | null, valle: id | null, dia, desde,
//                  hasta, estado: 'acordada'|'en-curso', publico, ahora }. `ahora`: ella ya tiene que estar
//                  esperando en el lugar (de `desde − 0,25 h` a `hasta`). Lugares en LUGARES_CITA: los de la
//                  aldea por edificio y punto (puntosDe de aldea.js), los del valle por `T.lugares[valle]`.
//                  Mientras el mundo no la muestre caminando, amor-juego.js la lleva al lugar (como al
//                  invitado de la mesa de la 3.6) y la devuelve al terminar: `ctx.mundo.cita(...)` lo reemplaza.
//   · parejas:   [{ clave, etapa, gesto: 'cerca'|'mano'|'brazo', publico }]: en público se nota la pareja.
//                  saliendo: caminan cerca; novios y comprometidos: de la mano; casados: del brazo. Cuando
//                  caminan juntos (una cita, la salida de la boda) el mundo usa el gesto.
//   · boda:      { con, dia, hora: 11, lugar: 'biblioteca', ella: 'cuentos', vos: 'cliente', juez: true, hoy,
//                  invitados: [claves], familia: ['mama'|'hermano'] }: la escena del casamiento civil (el juez
//                  de paz llega en el tren de la mañana; testigos Ernesto y Pocha; después, baile en el salón
//                  si está abierto, o en la plaza). Hoy, ella espera en la biblioteca de 10:30 a 14.
//   · convivencia: { con, donde: 'refugio'|'suya', edificio: 'refugio' | edificio de la aldea, desde } (la
//                  mudanza: el día `desde`, sus cosas van al refugio, o las tuyas a su casa).
//   · hijos:     [{ id, nombre, sexo: 'nene'|'nena', etapa: 'bebe'|'chico'|'adolescente'|'joven', madre,
//                  nacio, rutina: { lugar, edificio, punto } }]. Crecen una etapa por año (12 días), como los
//                  chicos de la aldea. `rutinaHijo` dice dónde está cada uno: el bebé con la mamá (y de noche
//                  en la cuna), la escuela, la plaza, su cuarto; separados, viven con ella y te visitan en el
//                  refugio los miércoles y los domingos.
//   · cuarto:    { edificio, puntos: ['cuna'|'cama-hijo-1'|'cama-hijo-2'] }: la casa suma un cuarto cuando nace
//                  alguien (PLAN_3_7, 3.7.0). Los puntos `cuna` y `cama-hijo-N` los pone el mundo en ese cuarto.
//   · anillo:    { estado: 'haciendo'|'listo'|'tuyo'|'dado', listo: dia, para } (el anillo en el yunque de
//                  Anselmo cuando está listo; en la mano de ella cuando está dado).
//   · embarazo:  { madre, nace } (sólo para que el mundo no la mande a la obra, si quiere).
//   · fundido:   el «ñiki ñiki» lo funde main.js con el `#fundido` de siempre (el de dormir): pantalla a negro,
//                  sin nada más. Si el mundo quiere algo propio (la luz del cuarto que se apaga), lo engancha
//                  en `ctx.mundo.fundido` de amor-juego.js.
//   · rutinaPareja(progreso, clave, hora, diaSemana, dia, aldea): la de rutinaAldea con lo del amor encima (la
//                  cita, la boda, y si viven en el refugio, de 19 a 8 está en el refugio).
//   · noticiasDeAmor(progreso, { dia, desde }): las novedades con humor para la radio y el diario (3.7.4).
// ================================================================
import { VECINOS_ALDEA, esVecinoAldea, esPobladorAldea, personaAldea, sinRomance, LOTE_DE, localAbierto, rutinaAldea, diaSemanaDe, DIAS_ANIO, ETAPAS_CHICOS, CHICOS_ALDEA, num, azar, aldeaNueva } from './aldea.js';
import { estaLibre, nivelDe, esPersonaVecindad, nombreCorto, PERSONAS_VECINDAD, PERFILES_VECINOS } from './vecindad.js';
import { VOCES_AMOR, FRASES_AMOR } from './amor-voces.js';

// ---------------------------------------------------------------- utilidades
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const entero = (v, d = 0) => (Number.isFinite(num(v)) ? Math.floor(num(v)) : d);
const TOPE_DIA = 1e6;
const diaValido = (v, d = 1) => Math.max(1, Math.min(TOPE_DIA, entero(v, d)));
const diaOCero = (v, tope = TOPE_DIA) => Math.max(0, Math.min(tope, entero(v, 0)));
const acotar = (x, a, b) => Math.max(a, Math.min(b, x));
const horaNorm = (h) => ((((Number.isFinite(num(h)) ? num(h) : 12) % 24) + 24) % 24);
const tieneDe = (o, k) => objeto(o) && Object.hasOwn(o, k);
function hashTexto(s) {
  let h = 2166136261;
  for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
const sorteo = (s) => azar(hashTexto(s));
const elegir = (lista, s) => (Array.isArray(lista) ? lista[hashTexto(s) % lista.length] : lista);
// Reemplaza {x} con `datos` (lo que falta queda vacío).
export function llenarAmor(texto, datos = {}) {
  if (typeof texto !== 'string') return '';
  return texto.replace(/\{(\w+)\}/g, (_t, k) => (tieneDe(datos, k) && datos[k] !== null && datos[k] !== undefined ? String(datos[k]) : ''));
}
const textoSano = (s, tope = 40) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f<>{}]/g, '').slice(0, tope) : null);
export const horaTextoAmor = (h) => { const x = horaNorm(h), hh = Math.floor(x), mm = Math.round((x - hh) * 60); return mm ? `${hh}:${String(mm).padStart(2, '0')}` : `${hh}`; };

// ---------------------------------------------------------------- las candidatas
// La lista cerrada: las ocho pobladoras de la 3.7.0 (edad en aldea.js) y cuatro de la 3.6 que son adultas y
// solteras según sus historias (decisión de este equipo, para confirmar con el usuario: Nélida, la ayudante del
// almacén; Ceinwen, la de la casa de té; Marta, la enfermera; y Julia, la guardaparque). No están: la abuela,
// Ercilia, Rosa, Delia y Elvira (mayores), Gladys (casada con Mario), Pocha (pareja de Anselmo), los chicos, y
// Josefina y Elsa (no viven en la aldea). `favorito`: su lugar preferido (de LUGARES_CITA): ahí conviene
// declararse y proponer. `civil`: el estado civil (sólo 'soltera' puede).
export const EDAD_ADULTA = 18;
export const CANDIDATAS = {
  veterinaria: { edad: 29, civil: 'soltera', favorito: 'mallin' },
  fotografa: { edad: 31, civil: 'soltera', favorito: 'mirador' },
  andinista: { edad: 33, civil: 'soltera', favorito: 'torre' },
  herbolaria: { edad: 35, civil: 'soltera', favorito: 'arrayanes' },
  pintora: { edad: 27, civil: 'soltera', favorito: 'cueva' },
  ceramista: { edad: 30, civil: 'soltera', favorito: 'puente' },
  botera: { edad: 28, civil: 'soltera', favorito: 'muelle' },
  astronoma: { edad: 32, civil: 'soltera', favorito: 'observatorio' },
  // de la 3.6
  guardaparque: { edad: 34, civil: 'soltera', favorito: 'faro' },
  enfermera: { edad: 41, civil: 'soltera', favorito: 'plaza' },
  galesa: { edad: 36, civil: 'soltera', favorito: 'casa-te' },
  nelida: { edad: 26, civil: 'soltera', favorito: 'estacion' },
};
export const ORDEN_CANDIDATAS = Object.keys(CANDIDATAS);
const edadDe = (clave) => { const p = personaAldea(clave); return Number.isFinite(p?.edad) ? p.edad : CANDIDATAS[clave]?.edad; };
// ¿Puede haber romance con ella, por lo que ella ES? (adulta, soltera, ni chica ni casada ni Pocha). No mira
// la partida: para eso, `puedeRomance`.
export function esCandidata(clave) {
  if (typeof clave !== 'string' || !Object.hasOwn(CANDIDATAS, clave)) return false;
  if (sinRomance(clave) || CHICOS_ALDEA.includes(clave)) return false;
  const p = personaAldea(clave);
  if (!p || p.chico || p.pareja || p.romance === false) return false;
  if (!(edadDe(clave) >= EDAD_ADULTA)) return false;
  return CANDIDATAS[clave].civil === 'soltera';
}
// El ajuste: `opciones` son los ajustes ({ romance }), o un booleano. De fábrica, encendido.
export const romanceActivo = (opciones) => (typeof opciones === 'boolean' ? opciones : opciones?.romance !== false);
export const sanearAjusteRomance = (v) => v !== false;

// ---------------------------------------------------------------- los lugares de las citas
// `aldea`: edificio y puntos (el de ella y el tuyo, de puntosDe); `valle`: un lugar de T.lugares. `horas`:
// cuándo se puede (la cita dura una hora y media). `publico`: se ve desde la aldea (corre el chisme).
// `rutina`: vale aunque ella esté "en lo suyo" si su horario ya la tiene ahí (la astrónoma en el observatorio,
// todos en el baile del sábado). `local`: el local que tiene que estar abierto. `dias`: qué días (5 = sábado).
export const LUGARES_CITA = {
  plaza: { nombre: 'la plaza', cita: 'un paseo por la plaza', aldea: { edificio: 'plaza', suyo: 'estar-3', tuyo: 'estar-4' }, horas: [10, 21], publico: true },
  'casa-te': { nombre: 'la casa de té', cita: 'un té en la casa de té', aldea: { edificio: 'casa-te', suyo: 'mesa-4', tuyo: 'mesa-3' }, horas: [15, 20], publico: true, abierta: 'casa-te' },
  estacion: { nombre: 'el andén', cita: 'ver llegar el tren de la tarde', aldea: { edificio: 'estacion-aldea', suyo: 'espera', tuyo: 'anden' }, horas: [17, 21], publico: true },
  baile: { nombre: 'el salón', cita: 'el baile del sábado', aldea: { edificio: 'salon', suyo: 'baile-7', tuyo: 'baile-8' }, horas: [17, 19.5], dias: [5], local: 'salon', rutina: 'salon', publico: true },
  observatorio: { nombre: 'el observatorio', cita: 'mirar las estrellas en el observatorio', aldea: { edificio: 'observatorio', suyo: 'adentro', tuyo: 'cliente' }, horas: [20.5, 23.5], local: 'observatorio', noche: true },
  mirador: { nombre: 'el mirador', cita: 'subir al mirador', valle: 'mirador', horas: [9, 20] },
  muelle: { nombre: 'el muelle', cita: 'una tarde en el muelle', valle: 'muelle', horas: [9, 21] },
  arrayanes: { nombre: 'el bosque de arrayanes', cita: 'caminar entre los arrayanes', valle: 'arrayanes', horas: [9, 19.5] },
  puente: { nombre: 'el puente del arroyo', cita: 'una caminata hasta el puente', valle: 'puente', horas: [9, 20] },
  mallin: { nombre: 'el mallín', cita: 'ver bajar los caballos al mallín', valle: 'mallin', horas: [9, 20.5] },
  faro: { nombre: 'el faro', cita: 'subir al faro', valle: 'faro', horas: [10, 21] },
  torre: { nombre: 'la torre', cita: 'subir a la torre', valle: 'torre', horas: [9, 20] },
  cueva: { nombre: 'el alero de las pinturas', cita: 'ver las pinturas del alero', valle: 'cueva', horas: [10, 18.5] },
};
export const esLugarCita = (id) => typeof id === 'string' && Object.hasOwn(LUGARES_CITA, id);
// Las ventanas propias de cada una (la galesa atiende la casa de té hasta las 20: su cita ahí es al cerrar).
const HORAS_PROPIAS = { galesa: { 'casa-te': [20, 21.75] } };
const horasDe = (clave, id) => (HORAS_PROPIAS[clave]?.[id] || LUGARES_CITA[id].horas);
// Los lugares que se le pueden ofrecer: su favorito primero; el observatorio sólo si está abierto.
export function lugaresDeCita(clave, aldea = null) {
  if (!esCandidata(clave)) return [];
  const fav = CANDIDATAS[clave].favorito;
  const a = aldea || aldeaNueva();
  return [fav, ...Object.keys(LUGARES_CITA).filter((k) => k !== fav)].filter((k) => !LUGARES_CITA[k].local || localAbierto(a, LUGARES_CITA[k].local));
}

// ---------------------------------------------------------------- los números
// Afecto de 0 a 100, interno (como la amistad: nunca se muestra con números). Elegidos para que un recorrido
// tranquilo (charlar, un piropo y un regalo por día, una cita cada dos o tres días) llegue a novios en una
// semana o diez días de juego, a casarse en otra semana, y que descuidarla se note en menos de una semana.
export const ETAPAS_AMOR = ['conocidos', 'coqueteo', 'saliendo', 'novios', 'comprometidos', 'casados', 'separados'];
const idx = (e) => ETAPAS_AMOR.indexOf(e);
export const AMOR = {
  tope: 100,
  charla: 1,                                      // verla y charlar, una vez por día (desde el coqueteo)
  piropo: { umbral: 15, gusto: 6, rie: 3, no: -2 },   // el coqueteo empieza con 15 de afecto
  flores: 6, carta: 4, ramo: 5,                   // en mano (no en invierno) / por el correo (llega al otro día)
  cita: { hecha: 8, favorito: 5, plantada: -10, duracion: 1.5, antes: 0.25 },
  declararse: { citas: 3, minimo: 30, amistad: 'amigo' },   // saliendo, con tres citas, algo de afecto y ya amigos
  proponer: { minimo: 60, diasNovios: 4 },        // novios hace cuatro días, con el anillo
  anillo: { dias: 3, cantos: 1 },
  boda: { enDias: 3, hora: 11, desde: 10.5, hasta: 14, plantada: -12 },
  convivir: { minimo: 55 },
  niki: { descanso: 4, afecto: 3, desde: 21, hasta: 5 },
  hijos: { max: 2, chance: 0.4, embarazo: 8, entre: 6, buscar: 60 },
  // [días de gracia sin verla, cuánto baja por día después] y el piso: por debajo se corta (o se separan)
  descuido: { coqueteo: [7, 1], saliendo: [6, 2], novios: [4, 3], comprometidos: [4, 3], casados: [5, 3], separados: [3, 1] },
  corte: { saliendo: 8, novios: 25, comprometidos: 25, casados: 20 },
  celos: { dias: 3, baja: 15, entre: 4, chance: { tranquilo: 0.25, normal: 0.45, animado: 0.65 }, publico: 0.25 },
  enojo: { corte: 3, separacion: 4, plantada: 1, rechazo: 2 },
  reconquista: { minimo: 55, citas: 1 },
};
const sumarAfecto = (f, n) => { f.afecto = acotar(Math.round((f.afecto + n) * 10) / 10, 0, AMOR.tope); };

// ---------------------------------------------------------------- las habilidades (lo que te enseña tu esposa)
// Tres niveles, uno por estación de casados (el primero, a la mañana siguiente del casamiento). Pedido del usuario:
// «las dos cosas». Cada oficio da lo que RINDE cada mañana (`efectos`, los de siempre: material, cosa, entrada,
// el jugador descansado, el zaino herrado o el kayak calafateado de aldea.js) y, en el segundo nivel, una MEJORA
// PERMANENTE del jugador que cambia cómo se juega (`bono`, ver BONOS). Los niveles se suman. Lo aprendido no se
// olvida aunque se separen, pero sólo se aprende casados y sin separarse. `hoy` en un valor: el día de la partida.
// 3.7.1: las mejoras permanentes que entiende el juego (main.js, jugador.js y fauna.js las aplican; con el ajuste
// apagado no corren). `paso`: caminar más rápido (factor); `huida`: los animales se espantan desde más cerca
// (factor del radio de huida: menos de 1 = más mansos); `remo`: el kayak más rápido (factor); `lente`: el lente
// de Sofía para siempre (fotos de más lejos); `cielo`: las estrellas y la luna se anotan más rápido (factor);
// `frutos`: uno más al juntar frutillas, calafate o piñones; `regalos`: amistad de más cuando le regalás algo que
// le gusta o le encanta; `dormir`: horas descansado de más al despertar de noche; `oficios`: niveles de más en un
// oficio del jugador (oficios.js: obrero = las obras piden menos; huertero = más cosecha; cazador = las huellas
// de más lejos).
export const BONOS = { paso: 1, huida: 1, remo: 1, lente: false, cielo: 1, frutos: 0, regalos: 0, dormir: 0, oficios: {} };
const N = (nombre, texto, efectos, bono = null) => (bono ? { nombre, texto, efectos, bono } : { nombre, texto, efectos });
export const HABILIDADES = {
  veterinaria: { id: 'animales', nombre: 'Mano con los animales', niveles: [
    N('Gallinas sanas', 'Vitaminás a las gallinas como Ayelén: cada mañana, un par de huevos más.', [{ tipo: 'entrada', k: 'huevo', n: 2 }]),
    N('Paso manso', 'Te movés como Ayelén entre los animales: el monte se espanta mucho menos cuando te acercás.', [], { huida: 0.7 }),
    N('Herrar al zaino', 'Le revisás las herraduras al zaino vos solo: anda más liviano todo el día.', [{ tipo: 'aldea', campo: 'herrado', valor: 'hoy' }])] },
  fotografa: { id: 'luz', nombre: 'Ojo de fotógrafa', niveles: [
    N('Acercarse sin espantar', 'Caminás despacio como Sofía: los pájaros no se espantan y encontrás plumas.', [{ tipo: 'entrada', k: 'pluma', n: 1 }]),
    N('El lente del abuelo Jalil', 'Sofía te deja el lente para siempre: las fotos te salen de más lejos.', [], { lente: true }),
    N('Retratos de la aldea', 'Los vecinos te piden retratos y te lo agradecen con algo rico.', [{ tipo: 'entrada', k: 'pan-casero', n: 1 }])] },
  andinista: { id: 'montana', nombre: 'Piernas de montaña', niveles: [
    N('Frutos de altura', 'Sabés dónde maduran los calafates de las laderas: un puñado seco por día.', [{ tipo: 'entrada', k: 'calafate-seco', n: 1 }]),
    N('Paso de montaña', 'Caminás con el paso de Rocío: andás más rápido por el monte, sin cansarte.', [], { paso: 1.07 }),
    N('Leer el filo', 'Subís hasta las araucarias del filo y bajás con piñones.', [{ tipo: 'entrada', k: 'pinon', n: 3 }])] },
  herbolaria: { id: 'yuyos', nombre: 'Los yuyos del monte', niveles: [
    N('Pedir permiso', 'Juntás con permiso, como Inés: cada mañana, un puñado de calafate.', [{ tipo: 'entrada', k: 'calafate', n: 3 }]),
    N('Ojo para los frutos', 'Ves los frutos que antes se te pasaban: cada vez que juntás frutillas, calafate o piñones, uno más.', [], { frutos: 1 }),
    N('Té de canelo', 'Un té de canelo a la mañana: ni frío ni cansancio.', [{ tipo: 'jugador', campo: 'entumecido', valor: 0 }, { tipo: 'jugador', campo: 'descansado', valor: 2 }])] },
  pintora: { id: 'color', nombre: 'Ojo de pintor', niveles: [
    N('Mirar las sombras', 'Mirás el valle como Abril: salís a caminar más liviano.', [{ tipo: 'jugador', campo: 'descansado', valor: 1 }]),
    N('El dibujito de regalo', 'Acompañás cada regalo con un dibujito, como Abril: lo que regalás y gusta suma más amistad.', [], { regalos: 3 }),
    N('Cartelitos pintados', 'Pintás los cartelitos de los vecinos y te lo agradecen con empanadas.', [{ tipo: 'entrada', k: 'empanadas', n: 2 }])] },
  ceramista: { id: 'barro', nombre: 'Manos de barro', niveles: [
    N('Elegir las piedras', 'Sabés qué piedras sirven para moler el esmalte: dos por día.', [{ tipo: 'material', k: 'piedra', n: 2 }]),
    N('Paciencia de horno', 'Con Malena aprendiste a no desperdiciar: el oficio de obrero sube un escalón (las obras piden menos material).', [], { oficios: { obrero: 1 } }),
    N('Jarros para el mate', 'Los jarros que hacés con Malena se cambian en el almacén por yerba.', [{ tipo: 'cosa', k: 'yerba', n: 1 }])] },
  botera: { id: 'agua', nombre: 'Mano de varadero', niveles: [
    N('Calafatear', 'Calafateás el kayak vos solo cada mañana: remás más rápido todo el día.', [{ tipo: 'aldea', campo: 'calafateado', valor: 'hoy' }]),
    N('Remar como Martina', 'Martina te corrigió la remada: el kayak anda más rápido para siempre.', [], { remo: 1.12 }),
    N('Madera de deriva', 'Juntás la madera que trae el lago: dos tablas por día.', [{ tipo: 'material', k: 'tabla', n: 2 }])] },
  astronoma: { id: 'cielo', nombre: 'Leer el cielo', niveles: [
    N('Dormir poco y bien', 'Dormís como Valentina: poco, pero de verdad.', [{ tipo: 'jugador', campo: 'descansado', valor: 2 }]),
    N('Ojos de noche', 'Valentina te enseñó a mirar el cielo: las estrellas y la luna se te anotan el doble de rápido.', [], { cielo: 2 }),
    N('Miel para el desvelo', 'Una cucharada de miel en el té de la noche: te la traen de la sala de miel.', [{ tipo: 'entrada', k: 'miel', n: 1 }])] },
  guardaparque: { id: 'monte', nombre: 'Ojo de guardaparque', niveles: [
    N('La recorrida', 'Caminás el monte como Julia y volvés con piñones.', [{ tipo: 'entrada', k: 'pinon', n: 2 }]),
    N('Leer las huellas', 'Julia te enseñó a leer el suelo: el oficio de rastreador sube un escalón (las huellas, de más lejos).', [], { oficios: { cazador: 1 } }),
    N('Poda de senderos', 'La leña de la poda de los senderos es tuya: dos troncos por día.', [{ tipo: 'material', k: 'tronco', n: 2 }])] },
  enfermera: { id: 'cuidar', nombre: 'Cuidar antes', niveles: [
    N('Abrigar los pies', 'Marta te enseñó a abrigarte bien: no te levantás entumecido.', [{ tipo: 'jugador', campo: 'entumecido', valor: 0 }]),
    N('Dormir bien', 'Con Marta aprendiste a dormir: cada noche te levantás descansado unas horas más.', [], { dormir: 3 }),
    N('El botiquín', 'Los vecinos que atendés te dejan miel.', [{ tipo: 'entrada', k: 'miel', n: 1 }])] },
  galesa: { id: 'te', nombre: 'La pava siempre puesta', niveles: [
    N('Torta negra', 'Aprendiste la torta negra de Ceinwen: cada mañana, un pan casero de regalo.', [{ tipo: 'entrada', k: 'pan-casero', n: 1 }]),
    N('La chacra de Trevelin', 'Ceinwen te enseñó la huerta de su familia: el oficio de huertero sube un escalón (más cosecha).', [], { oficios: { huertero: 1 } }),
    N('La tetera del Mimosa', 'Un té en la tetera de la familia: arrancás el día descansado.', [{ tipo: 'jugador', campo: 'descansado', valor: 3 }])] },
  nelida: { id: 'sumar', nombre: 'Saber sumar', niveles: [
    N('El cuaderno del almacén', 'Nélida te enseñó a no desperdiciar nada: yerba de lo que sobra.', [{ tipo: 'cosa', k: 'yerba', n: 1 }]),
    N('Las cuentas de la obra', 'Sabés sumar como Nélida: el oficio de obrero sube un escalón (las obras piden menos material).', [], { oficios: { obrero: 1 } }),
    N('Dulce del estante', 'Lo que se guarda bien, rinde: un frasco de dulce de frutilla.', [{ tipo: 'entrada', k: 'frasco-frutilla', n: 1 }])] },
};
// Las mejoras permanentes que aprendiste, todas juntas (los factores se multiplican y lo demás se suma). Con el
// ajuste apagado, las de fábrica (sin nada).
export function bonosDeHabilidades(estado, opciones = {}) {
  const b = { ...BONOS, oficios: {} };
  const a = partes(estado).amor;
  if (!a || !romanceActivo(opciones)) return b;
  for (const [k, x] of Object.entries(a.habilidades)) {
    if (!Object.hasOwn(HABILIDADES, k)) continue;
    for (const n of HABILIDADES[k].niveles.slice(0, Math.min(3, x.nivel))) {
      const o = n.bono;
      if (!o) continue;
      for (const c of ['paso', 'huida', 'remo', 'cielo']) if (Object.hasOwn(o, c)) b[c] *= o[c];
      for (const c of ['frutos', 'regalos', 'dormir']) if (Object.hasOwn(o, c)) b[c] += o[c];
      if (o.lente) b.lente = true;
      for (const [of, m] of Object.entries(o.oficios || {})) b.oficios[of] = (b.oficios[of] || 0) + m;
    }
  }
  return b;
}
export const NIVELES_HABILIDAD = 3;
const estacionAbs = (dia) => Math.floor((diaValido(dia, 1) - 1) / 4);   // la estación del año de 12 días (cuatro días cada una)

// ---------------------------------------------------------------- el estado (progreso.amor)
const TOPE_NOTICIAS = 16, TOPE_CORREO = 24, TOPE_COMENTADOS = 12, VIDA_NOTICIA = 10;
export function amorNuevo() {
  return {
    personas: {},            // clave → ficha (sólo las que conociste)
    cita: null,              // la cita pendiente: { clave, lugar, dia, desde, hasta, estado }
    anillo: null,            // { pedido, listo, retirado, para }
    boda: null,              // { con, dia, hora }
    conyuge: null,           // con quién te casaste
    convivencia: null,       // { con, donde: 'refugio'|'suya', desde }
    hijos: [],               // [{ id, nombre, sexo, nacio, madre, guia }]
    embarazo: null,          // { madre, desde, nace, contado }
    buscan: false,           // buscan un hijo
    habilidades: {},         // clave → { nivel, estacion }
    niki: 0, animo: 0,       // la última noche del ñiki ñiki y el día de buen ánimo
    correo: [],              // [{ tipo: 'carta'|'ramo', para, dia, entrega }]
    noticias: [],            // [{ id, tipo, dia, con, otra?, lugar?, hijo? }] (para los vecinos y la radio)
    comentados: {},          // persona → ids de noticias que ya comentó
    chisme: 0,               // el último día en que corrió el chisme de que salís con dos
    rinde: 0,                // el último día en que rindieron las habilidades
    dia: 0,
  };
}
function fichaNueva() {
  return { etapa: 'conocidos', afecto: 0, desde: 0, contacto: 0, charla: 0, piropo: 0, flores: 0, carta: 0, leyo: null, citas: 0, ultimaCita: 0, enojo: 0, motivo: null, rechazo: 0, reconquista: 0, chicos: 0 };
}
const esAmor = (x) => objeto(x) && objeto(x.personas) && Array.isArray(x.hijos);
// De `estado` saca el amor, la aldea y la partida (como en vecindad.js). `crear`: si falta, lo arma.
function partes(estado, crear = false) {
  const e = objeto(estado) ? estado : null;
  let a = null, aldea = null, progreso = null;
  if (e && esAmor(e)) a = e;
  else if (e) {
    progreso = e;
    if (esAmor(e.amor)) a = e.amor;
    else if (crear) { e.amor = amorNuevo(); a = e.amor; }
    if (objeto(e.aldea)) aldea = e.aldea;
  }
  if (!a && crear) a = amorNuevo();
  return { amor: a, aldea: aldea || aldeaNueva(), progreso };
}
const fichaSi = (a, k) => (a && tieneDe(a.personas, k) ? a.personas[k] : null);
function ficha(a, k) {
  if (!tieneDe(a.personas, k)) a.personas[k] = fichaNueva();
  return a.personas[k];
}
const enojada = (f, d) => !!f && f.enojo >= d;
const diaDe = (progreso, ctx) => diaValido(ctx?.dia ?? progreso?.dia, 1);
const horaDe = (progreso, ctx) => horaNorm(ctx?.hora ?? progreso?.horas);
const nombreDe = (k) => nombreCorto(k) || k;
const cambiarEtapa = (f, etapa, d) => { f.etapa = etapa; f.desde = d; };
const contacto = (f, d) => { f.contacto = Math.max(f.contacto, d); };
function noticia(a, tipo, d, datos = {}) {
  const id = `${tipo}:${d}:${datos.con || ''}${datos.otra ? ':' + datos.otra : ''}${datos.hijo ? ':' + datos.hijo : ''}`;
  if (a.noticias.some((n) => n.id === id)) return;
  a.noticias.push({ id, tipo, dia: d, ...datos });
  a.noticias = a.noticias.filter((n) => d - n.dia <= VIDA_NOTICIA).slice(-TOPE_NOTICIAS);
}

// ¿Con ella? { ok, motivo }: 'apagado' (el ajuste), 'no-candidata' (chicos, casados, Pocha, los que no son
// solteras adultas), 'no-llego' (todavía no vive en la aldea), 'tenes-pareja' (estás comprometido o casado
// con otra: entonces, nada con nadie más).
export function puedeRomance(clave, estado, opciones = {}) {
  if (!romanceActivo(opciones)) return { ok: false, motivo: 'apagado' };
  if (!esCandidata(clave)) return { ok: false, motivo: 'no-candidata' };
  const { amor, aldea } = partes(estado);
  if (!esVecinoAldea(clave) && !(aldea.pobladores || []).some((p) => p?.clave === clave)) return { ok: false, motivo: 'no-llego' };
  if (amor && Object.entries(amor.personas).some(([k, f]) => k !== clave && idx(f.etapa) >= idx('comprometidos'))) return { ok: false, motivo: 'tenes-pareja' };
  return { ok: true, motivo: null };
}
export function etapaAmor(clave, estado) { return fichaSi(partes(estado).amor, clave)?.etapa || 'conocidos'; }
// La pareja "de verdad" (comprometida, casada o separada): una sola.
export function parejaActual(estado) {
  const { amor } = partes(estado);
  if (!amor) return null;
  const k = Object.keys(amor.personas).find((x) => idx(amor.personas[x].etapa) >= idx('comprometidos'));
  return k || null;
}
// Las que están saliendo con vos o son tus novias.
const activas = (a) => Object.keys(a.personas).filter((k) => ['saliendo', 'novios'].includes(a.personas[k].etapa));
const amistadIdx = (clave, progreso, ctx) => {
  const n = typeof ctx?.amistad === 'string' ? ctx.amistad : progreso ? nivelDe(clave, progreso) : 'conocido';
  return Math.max(0, ['conocido', 'amigo', 'compadre'].indexOf(n));
};
const esFavorito = (clave, lugar) => !!lugar && CANDIDATAS[clave]?.favorito === lugar;
const conElla = (clave) => ({ ella: nombreDe(clave) });

// ---------------------------------------------------------------- charlar (verla)
// Cada charla con una que ya te interesa cuenta como verla (el descuido se cuenta desde acá) y suma un poquito
// una vez por día. Devuelve lo que ella tiene para decirte primero (la carta que le llegó, el bebé que viene,
// el enojo) o null.
export function verla(estado, clave, ctx = {}) {
  if (!esCandidata(clave) || !romanceActivo(ctx)) return null;
  if (etapaAmor(clave, estado) === 'conocidos' && !puedeRomance(clave, estado, ctx).ok) return null;
  const { amor, progreso } = partes(estado, true);
  const d = diaDe(progreso, ctx);
  const f = ficha(amor, clave);
  const voz = VOCES_AMOR[clave];
  let dice = null;
  if (amor.embarazo?.madre === clave && !amor.embarazo.contado) {
    amor.embarazo.contado = true;
    dice = llenarAmor(FRASES_AMOR.embarazo, { ella: nombreDe(clave), dias: Math.max(1, amor.embarazo.nace - d) });
  } else if (enojada(f, d)) dice = elegir(FRASES_AMOR.enojada, `${clave}${d}`);
  else if (f.leyo) { dice = f.leyo === 'ramo' ? voz.flores : voz.carta; f.leyo = null; }
  if (idx(f.etapa) >= idx('coqueteo')) {
    if (f.charla !== d && !enojada(f, d)) sumarAfecto(f, AMOR.charla);
    f.charla = d;
    contacto(f, d);
  }
  return dice;
}

// ---------------------------------------------------------------- coquetear
// Un piropo por día. La chance de que le guste sube con la amistad (vecindad.js), el afecto y si están en su
// lugar favorito; con novios o más, siempre le gusta. Con 15 de afecto empieza el coqueteo.
export function chancePiropo(f, clave, ctx = {}, progreso = null) {
  const p = 0.3 + 0.12 * amistadIdx(clave, progreso, ctx) + (f?.afecto || 0) / 250 + (esFavorito(clave, ctx.lugar) ? 0.15 : 0);
  return acotar(p, 0.1, 0.92);
}
export function coquetear(estado, clave, ctx = {}) {
  const r0 = puedeRomance(clave, estado, ctx);
  if (!r0.ok) return { ok: false, motivo: r0.motivo, renglones: [] };
  const { amor, progreso } = partes(estado, true);
  const d = diaDe(progreso, ctx);
  const f = ficha(amor, clave);
  if (enojada(f, d)) return { ok: false, motivo: 'enojada', renglones: [elegir(FRASES_AMOR.enojada, `${clave}${d}`)] };
  if (f.piropo === d) return { ok: false, motivo: 'ya-hoy', renglones: [FRASES_AMOR.yaHoyPiropo] };
  f.piropo = d;
  contacto(f, d);
  const pareja = ['novios', 'comprometidos', 'casados'].includes(f.etapa);
  const p = chancePiropo(f, clave, ctx, progreso);
  const r = sorteo(`${clave}:piropo:${d}:${Math.round(f.afecto)}:${entero(ctx.semilla)}`);
  const resultado = pareja || r < p ? 'gusto' : r < p + (1 - p) * 0.6 ? 'rie' : 'no';
  const cambio = AMOR.piropo[resultado] * (f.etapa === 'separados' ? 0.5 : 1);
  sumarAfecto(f, cambio);
  let subio = null;
  if (f.etapa === 'conocidos' && f.afecto >= AMOR.piropo.umbral) { cambiarEtapa(f, 'coqueteo', d); subio = 'coqueteo'; }
  return { ok: true, resultado, renglones: [elegir(VOCES_AMOR[clave].piropo[resultado], `${clave}${d}${resultado}`)], subio, cambio };
}

// 3.7.4: lo que suma o resta la rueda de la vida social (vecindad-social.js): tomarse de la mano, un abrazo largo,
// un beso que salió bien (o la cachetada suave de mentira). Sólo con una candidata con la que puede haber romance;
// como con el piropo, con 15 de afecto empieza el coqueteo. Devuelve { cambio, afecto, etapa, subio } o null.
export function sumarAfectoDe(estado, clave, n, ctx = {}) {
  if (!puedeRomance(clave, estado, ctx).ok) return null;
  const { amor, progreso } = partes(estado, true);
  const d = diaDe(progreso, ctx);
  const f = ficha(amor, clave);
  const cambio = acotar(Number.isFinite(num(n)) ? num(n) : 0, -10, 10);
  sumarAfecto(f, cambio);
  contacto(f, d);
  let subio = null;
  if (f.etapa === 'conocidos' && f.afecto >= AMOR.piropo.umbral) { cambiarEtapa(f, 'coqueteo', d); subio = 'coqueteo'; }
  return { cambio, afecto: f.afecto, etapa: f.etapa, subio };
}

// ---------------------------------------------------------------- las flores (en mano)
// Un ramo por día; en invierno no hay flores (las del monte se cierran: ver pasto.js). Suma afecto.
export function regalarFlores(estado, clave, ctx = {}) {
  const r0 = puedeRomance(clave, estado, ctx);
  if (!r0.ok) return { ok: false, motivo: r0.motivo, renglones: [] };
  const { amor, progreso } = partes(estado, true);
  const d = diaDe(progreso, ctx);
  const f = ficha(amor, clave);
  if (ctx.invierno) return { ok: false, motivo: 'invierno', renglones: [FRASES_AMOR.sinFlores] };
  if (f.flores === d) return { ok: false, motivo: 'ya-hoy', renglones: [FRASES_AMOR.yaFlores] };
  if (enojada(f, d)) return { ok: false, motivo: 'enojada', renglones: [elegir(FRASES_AMOR.enojada, `${clave}${d}`)] };
  f.flores = d;
  contacto(f, d);
  sumarAfecto(f, AMOR.flores);
  let subio = null;
  if (f.etapa === 'conocidos' && f.afecto >= AMOR.piropo.umbral) { cambiarEtapa(f, 'coqueteo', d); subio = 'coqueteo'; }
  return { ok: true, renglones: [VOCES_AMOR[clave].flores], subio, cambio: AMOR.flores };
}

// ---------------------------------------------------------------- el correo (cartas y ramos por el tren)
// En la estafeta (Benigno) o en el almacén (Ercilia): una cosa por día para cada una, desde el coqueteo. Llega
// con el tren de la mañana siguiente (`pasarDiaAmor` la entrega) y ella te lo comenta cuando la ves.
export function puedeEscribirle(clave, estado, ctx = {}) {
  const ok = puedeRomance(clave, estado, ctx).ok;
  return ok && idx(etapaAmor(clave, estado)) >= idx('coqueteo');
}
export function mandarCorreo(estado, tipo, clave, ctx = {}) {
  if (tipo !== 'carta' && tipo !== 'ramo') return { ok: false, motivo: 'no-se', renglones: [] };
  if (!puedeEscribirle(clave, estado, ctx)) return { ok: false, motivo: 'no-candidata', renglones: [] };
  const { amor, progreso } = partes(estado, true);
  const d = diaDe(progreso, ctx);
  const datos = conElla(clave);
  if (tipo === 'ramo' && ctx.invierno) return { ok: false, motivo: 'invierno', renglones: [FRASES_AMOR.correo.sinFlores] };
  if (amor.correo.some((c) => c.para === clave && c.dia === d)) return { ok: false, motivo: 'ya-hoy', renglones: [llenarAmor(FRASES_AMOR.correo.yaHoy, datos)] };
  amor.correo.push({ tipo, para: clave, dia: d, entrega: d + 1 });
  amor.correo = amor.correo.slice(-TOPE_CORREO);
  return { ok: true, renglones: [llenarAmor(FRASES_AMOR.correo[tipo], datos)] };
}

// ---------------------------------------------------------------- las citas
// Dónde y cuándo según los horarios: el primer rato libre de ella (hoy, desde dentro de tres cuartos de hora,
// o mañana) en que el lugar se puede (horas, días, local abierto, la casa de té atendiendo) y ella está libre
// toda la hora y media (`estaLibre` de vecindad.js), o su horario ya la tiene ahí (`rutina`).
export function huecoDeCita(estado, clave, lugar, ctx = {}) {
  if (!esLugarCita(lugar) || !esCandidata(clave)) return null;
  const { progreso, aldea } = partes(estado);
  const d = diaDe(progreso, ctx), h = horaDe(progreso, ctx);
  const L = LUGARES_CITA[lugar];
  const [h0, h1] = horasDe(clave, lugar);
  const est = progreso || { aldea, dia: d };
  for (const dia of [d, d + 1]) {
    const ds = diaSemanaDe(dia);
    if (L.dias && !L.dias.includes(ds)) continue;
    if (L.local && !localAbierto(aldea, L.local)) continue;
    const desde = dia === d ? Math.max(h0, Math.ceil((h + 0.75) * 2) / 2) : h0;
    for (let s = desde; s + AMOR.cita.duracion <= h1 + 1e-9; s += 0.5) {
      // (el baile: toda la aldea está en el baile, en el salón o en la plaza; la astrónoma, en su observatorio)
      const enSuLugar = (t) => (lugar === 'baile' ? ['salon', 'plaza'].includes(rutinaAldea(clave, t, ds, aldea, dia).lugar)
        : clave === 'astronoma' && lugar === 'observatorio' && rutinaAldea(clave, t, ds, aldea, dia).edificio === 'observatorio');
      const libre = (t) => enSuLugar(t) || estaLibre(clave, t, ds, est);
      const marcas = L.rutina ? [s + 0.1, s + 0.75] : [s, s + 0.75, s + AMOR.cita.duracion - 0.1];
      if (!marcas.every((t) => libre(t))) continue;
      if (L.abierta && clave !== 'galesa') {
        const g = rutinaAldea('galesa', s, ds, aldea, dia);
        if (!(g.edificio === 'casa-te' && g.punto === 'adentro')) continue;
      }
      return { dia, desde: s, hasta: s + AMOR.cita.duracion };
    }
  }
  return null;
}
// La invitás. Desde el coqueteo (también separados: es la reconquista). Puede decir que no (lo dice), o que no
// tiene un rato libre. Si acepta, queda la cita (una por vez).
export function chanceCita(f, clave, lugar, ctx = {}, progreso = null) {
  let p = 0.45 + (f?.afecto || 0) / 120 + 0.08 * amistadIdx(clave, progreso, ctx) + (esFavorito(clave, lugar) ? 0.2 : 0);
  if (f && idx(f.etapa) >= idx('saliendo') && f.etapa !== 'separados') p += 0.2;
  return acotar(p, 0.15, 0.97);
}
export function invitarACita(estado, clave, lugar, ctx = {}) {
  const r0 = puedeRomance(clave, estado, ctx);
  if (!r0.ok) return { ok: false, motivo: r0.motivo, renglones: [] };
  const { amor, progreso } = partes(estado, true);
  const d = diaDe(progreso, ctx);
  const f = ficha(amor, clave);
  if (idx(f.etapa) < idx('coqueteo')) return { ok: false, motivo: 'pronto', renglones: [FRASES_AMOR.noTodavia] };
  if (enojada(f, d)) return { ok: false, motivo: 'enojada', renglones: [elegir(FRASES_AMOR.enojada, `${clave}${d}`)] };
  if (amor.cita) return { ok: false, motivo: 'ya-hay', renglones: [FRASES_AMOR.noPuedeCita] };
  if (!esLugarCita(lugar)) return { ok: false, motivo: 'no-se', renglones: [] };
  const hueco = huecoDeCita(estado, clave, lugar, ctx);
  if (!hueco) return { ok: false, motivo: 'sin-hueco', renglones: [FRASES_AMOR.sinHueco] };
  contacto(f, d);
  const p = chanceCita(f, clave, lugar, ctx, progreso);
  if (sorteo(`${clave}:cita:${d}:${lugar}:${f.citas}:${entero(ctx.semilla)}`) >= p) {
    f.rechazo = d;
    return { ok: false, motivo: 'no', renglones: [VOCES_AMOR[clave].cita.no] };
  }
  amor.cita = { clave, lugar, dia: hueco.dia, desde: hueco.desde, hasta: hueco.hasta, estado: 'acordada' };
  const L = LUGARES_CITA[lugar];
  const cuando = hueco.dia === d ? FRASES_AMOR.citaHoy : hueco.dia === d + 1 ? FRASES_AMOR.citaManiana : FRASES_AMOR.citaAcordada;
  return { ok: true, cita: { ...amor.cita }, renglones: [VOCES_AMOR[clave].cita.si, llenarAmor(cuando, { cita: L.cita, dia: hueco.dia, hora: horaTextoAmor(hueco.desde) })] };
}
// ¿Ella ya tiene que estar esperando en el lugar? (de un cuarto de hora antes hasta que se va)
export function citaAhora(estado, ctx = {}) {
  const { amor, progreso } = partes(estado);
  const c = amor?.cita;
  if (!c) return null;
  const d = diaDe(progreso, ctx), h = horaDe(progreso, ctx);
  if (c.estado === 'en-curso') return c;
  return c.dia === d && h >= c.desde - AMOR.cita.antes && h <= c.hasta ? c : null;
}
// Llegaste y le hablaste: empieza (devuelve lo que te dice al verte).
export function empezarCita(estado, ctx = {}) {
  const { amor, progreso } = partes(estado);
  const c = amor?.cita;
  if (!c || c.estado !== 'acordada' || !citaAhora(estado, ctx)) return null;
  c.estado = 'en-curso';
  const d = diaDe(progreso, ctx);
  const voz = VOCES_AMOR[c.clave];
  const renglones = [elegir(FRASES_AMOR.citaEmpieza, `${c.clave}${d}`), ...voz.cita.charla];
  if (esFavorito(c.clave, c.lugar)) renglones.push(voz.favorito);
  return { clave: c.clave, lugar: c.lugar, renglones };
}
// Terminó la charla de la cita (o te fuiste a la mitad: igual cuenta). Suma afecto (más en su favorito); la
// primera cita pasa del coqueteo a "saliendo". Si fue en público, la aldea se entera.
export function terminarCita(estado, ctx = {}) {
  const { amor, progreso } = partes(estado);
  const c = amor?.cita;
  if (!c || c.estado !== 'en-curso') return null;
  const d = diaDe(progreso, ctx);
  const f = ficha(amor, c.clave);
  amor.cita = null;
  const fav = esFavorito(c.clave, c.lugar);
  sumarAfecto(f, AMOR.cita.hecha + (fav ? AMOR.cita.favorito : 0));
  f.citas = Math.min(TOPE_DIA, f.citas + 1);
  f.ultimaCita = d;
  contacto(f, d);
  if (f.etapa === 'separados') f.reconquista = Math.min(99, f.reconquista + 1);
  let subio = null;
  if (f.etapa === 'coqueteo') { cambiarEtapa(f, 'saliendo', d); subio = 'saliendo'; }
  if (LUGARES_CITA[c.lugar].publico) noticia(amor, 'cita', d, { con: c.clave, lugar: c.lugar });
  return { clave: c.clave, lugar: c.lugar, favorito: fav, subio, renglones: [elegir(FRASES_AMOR.citaFin, `${c.clave}${d}fin`)] };
}
// La cita que pasó sin que vinieras: te esperó y se fue. Llamarla seguido (amor-juego.js) y al pasar el día.
export function vencerCita(estado, ctx = {}) {
  const { amor, progreso } = partes(estado);
  const c = amor?.cita;
  if (!c || c.estado !== 'acordada') return null;
  const d = diaDe(progreso, ctx), h = horaDe(progreso, ctx);
  if (d < c.dia || (d === c.dia && h <= c.hasta)) return null;
  amor.cita = null;
  const f = ficha(amor, c.clave);
  sumarAfecto(f, AMOR.cita.plantada);
  f.enojo = Math.max(f.enojo, d + AMOR.enojo.plantada - 1);
  f.motivo = 'plantada';
  return { tipo: 'plantada', clave: c.clave, texto: `${nombreDe(c.clave)} te esperó en ${LUGARES_CITA[c.lugar].nombre}`, sub: FRASES_AMOR.plantada };
}

// ---------------------------------------------------------------- declararse
// «¿Querés ser mi novia?»: saliendo, con tres citas y ya amigos (la amistad de vecindad.js). La chance sube con el afecto y en su lugar favorito (y un
// poco con flores de hoy o una carta reciente). Si dice que no, hay que esperar dos días.
export function chanceDeclararse(f, clave, ctx = {}, d = 1) {
  if (!f || f.afecto < AMOR.declararse.minimo) return 0;
  return acotar((f.afecto - 20) / 60 + (esFavorito(clave, ctx.lugar) ? 0.25 : 0) + (f.flores === d ? 0.1 : 0) + (f.carta && d - f.carta <= 2 ? 0.05 : 0), 0.05, 0.97);
}
export function declararse(estado, clave, ctx = {}) {
  const r0 = puedeRomance(clave, estado, ctx);
  if (!r0.ok) return { ok: false, motivo: r0.motivo, renglones: [] };
  const { amor, progreso } = partes(estado, true);
  const d = diaDe(progreso, ctx);
  const f = ficha(amor, clave);
  const voz = VOCES_AMOR[clave];
  if (enojada(f, d)) return { ok: false, motivo: 'enojada', renglones: [elegir(FRASES_AMOR.enojada, `${clave}${d}`)] };
  if (f.etapa !== 'saliendo' || f.citas < AMOR.declararse.citas || amistadIdx(clave, progreso, ctx) < 1) return { ok: false, motivo: 'pronto', renglones: [FRASES_AMOR.noTodavia] };
  if (f.rechazo && d - f.rechazo < AMOR.enojo.rechazo) return { ok: false, motivo: 'espera', renglones: [voz.declaracion.no] };
  contacto(f, d);
  const p = chanceDeclararse(f, clave, ctx, d);
  if (sorteo(`${clave}:declara:${d}:${Math.round(f.afecto)}:${entero(ctx.semilla)}`) >= p) {
    f.rechazo = d; sumarAfecto(f, -3);
    return { ok: true, si: false, renglones: [voz.declaracion.no] };
  }
  cambiarEtapa(f, 'novios', d);
  sumarAfecto(f, 10);
  noticia(amor, 'novios', d, { con: clave });
  return { ok: true, si: true, renglones: [...voz.declaracion.si] };
}

// ---------------------------------------------------------------- el anillo (Anselmo, con un canto rodado)
// Con novia y un canto rodado; Anselmo tiene que tener la herrería abierta. Tarda tres días; después se
// retira en la herrería. Devuelve los efectos (el canto que se le da).
export function encargarAnillo(estado, ctx = {}) {
  const { amor, progreso, aldea } = partes(estado, true);
  const d = diaDe(progreso, ctx);
  if (!romanceActivo(ctx)) return { ok: false, motivo: 'apagado', renglones: [] };
  if (!localAbierto(aldea, LOTE_DE.herrero)) return { ok: false, motivo: 'sin-herrero', renglones: [] };
  if (amor.anillo && !amor.anillo.para) return { ok: false, motivo: 'ya', renglones: [amor.anillo.retirado ? FRASES_AMOR.anillo.yaTenes : FRASES_AMOR.anillo.haciendo] };
  if (!Object.values(amor.personas).some((f) => f.etapa === 'novios')) return { ok: false, motivo: 'sin-novia', renglones: [FRASES_AMOR.anillo.sinNovia] };
  const cantos = Number.isFinite(num(ctx.cantos)) ? num(ctx.cantos) : entero(progreso?.entradas?.canto?.cantidad);
  if (cantos < AMOR.anillo.cantos) return { ok: false, motivo: 'sin-canto', renglones: [FRASES_AMOR.anillo.sinCanto] };
  amor.anillo = { pedido: d, listo: d + AMOR.anillo.dias, retirado: false, para: null };
  return { ok: true, renglones: [FRASES_AMOR.anillo.pide], efectos: [{ tipo: 'entrada', k: 'canto', n: -AMOR.anillo.cantos }] };
}
export const anilloListo = (estado, dia) => { const a = partes(estado).amor?.anillo; return !!a && !a.retirado && diaValido(dia, 1) >= a.listo; };
export function retirarAnillo(estado, ctx = {}) {
  const { amor, progreso } = partes(estado);
  const d = diaDe(progreso, ctx);
  const a = amor?.anillo;
  if (!a || a.retirado) return { ok: false, renglones: [a ? FRASES_AMOR.anillo.yaTenes : FRASES_AMOR.anillo.sinCanto] };
  if (d < a.listo) return { ok: false, renglones: [FRASES_AMOR.anillo.haciendo] };
  a.retirado = true;
  return { ok: true, renglones: [FRASES_AMOR.anillo.listo] };
}
export const tenesAnillo = (estado) => { const a = partes(estado).amor?.anillo; return !!a && a.retirado && !a.para; };

// ---------------------------------------------------------------- proponer
// Novios hace cuatro días, con el anillo en el bolsillo y bastante afecto. Si dice que sí: comprometidos, el
// casamiento queda para dentro de tres días a las once, y las otras con las que salías se enteran (y cortan).
export function chanceProponer(f, clave, ctx = {}) {
  if (!f || f.afecto < AMOR.proponer.minimo) return 0;
  return acotar((f.afecto - 50) / 40 + (esFavorito(clave, ctx.lugar) ? 0.25 : 0), 0.05, 0.98);
}
export function proponer(estado, clave, ctx = {}) {
  const r0 = puedeRomance(clave, estado, ctx);
  if (!r0.ok) return { ok: false, motivo: r0.motivo, renglones: [] };
  const { amor, progreso } = partes(estado, true);
  const d = diaDe(progreso, ctx);
  const f = ficha(amor, clave);
  const voz = VOCES_AMOR[clave];
  if (enojada(f, d)) return { ok: false, motivo: 'enojada', renglones: [elegir(FRASES_AMOR.enojada, `${clave}${d}`)] };
  if (f.etapa !== 'novios' || d - f.desde < AMOR.proponer.diasNovios) return { ok: false, motivo: 'pronto', renglones: [FRASES_AMOR.noTodavia] };
  if (!tenesAnillo(estado)) return { ok: false, motivo: 'sin-anillo', renglones: [FRASES_AMOR.sinAnillo] };
  if (f.rechazo && d - f.rechazo < AMOR.enojo.rechazo) return { ok: false, motivo: 'espera', renglones: [voz.propuesta.no] };
  contacto(f, d);
  if (sorteo(`${clave}:propone:${d}:${Math.round(f.afecto)}:${entero(ctx.semilla)}`) >= chanceProponer(f, clave, ctx)) {
    f.rechazo = d; sumarAfecto(f, -3);
    return { ok: true, si: false, renglones: [voz.propuesta.no] };
  }
  cambiarEtapa(f, 'comprometidos', d);
  sumarAfecto(f, 10);
  amor.anillo.para = clave;
  amor.boda = { con: clave, dia: d + AMOR.boda.enDias, hora: AMOR.boda.hora };
  const cortaron = [];
  for (const [k, g] of Object.entries(amor.personas)) {
    if (k === clave || !['coqueteo', 'saliendo', 'novios'].includes(g.etapa)) continue;
    cambiarEtapa(g, 'conocidos', d);
    g.afecto = Math.min(g.afecto, 10);
    g.enojo = Math.max(g.enojo, d + AMOR.enojo.corte - 1); g.motivo = 'celos';
    cortaron.push(k);
  }
  if (amor.cita && amor.cita.clave !== clave) amor.cita = null;
  noticia(amor, 'comprometidos', d, { con: clave });
  return { ok: true, si: true, cortaron, boda: { ...amor.boda }, renglones: [...voz.propuesta.si, llenarAmor(FRASES_AMOR.boda.fecha, { dia: amor.boda.dia })] };
}

// ---------------------------------------------------------------- el casamiento civil
// En la biblioteca popular (nada religioso), con el juez de paz que llega en el tren de la mañana. Ella espera
// de 10:30 a 14 del día; si no vas, pasa para el día siguiente (y se enoja un día).
export function bodaHoy(estado, ctx = {}) {
  const { amor, progreso } = partes(estado);
  const b = amor?.boda;
  if (!b) return null;
  const d = diaDe(progreso, ctx), h = horaDe(progreso, ctx);
  return b.dia === d && h >= AMOR.boda.desde && h < AMOR.boda.hasta ? b : null;
}
// Quiénes vienen: los testigos (Ernesto y Pocha), Anselmo (hizo el anillo), los amigos de ella, tus amigos y
// compadres de la aldea, y tu familia (mamá o hermano).
export function invitadosBoda(estado, ctx = {}) {
  const { amor, progreso, aldea } = partes(estado);
  const b = amor?.boda;
  const con = b?.con || amor?.conyuge;
  if (!con) return { invitados: [], familia: [] };
  const vive = (k) => esVecinoAldea(k) || (aldea.pobladores || []).some((p) => p?.clave === k);
  const lista = ['jefe', 'modista', 'herrero', ...(PERFILES_VECINOS[con]?.amigos || [])];
  if (progreso) for (const k of PERSONAS_VECINDAD) if (['amigo', 'compadre'].includes(nivelDe(k, progreso))) lista.push(k);
  const invitados = [...new Set(lista)].filter((k) => k !== con && esPersonaVecindad(k) && (!esPobladorAldea(k) || vive(k)));
  const quien = progreso?.vidaAldea?.familia?.quien;
  return { invitados: [...new Set(invitados)], familia: [quien === 'hermano' ? 'hermano' : 'mama'] };
}
export function casarse(estado, ctx = {}) {
  const { amor, progreso } = partes(estado);
  const b = bodaHoy(estado, ctx);
  if (!b || !romanceActivo(ctx)) return { ok: false, renglones: [] };
  const d = diaDe(progreso, ctx);
  const f = ficha(amor, b.con);
  cambiarEtapa(f, 'casados', d);
  sumarAfecto(f, 10);
  contacto(f, d);
  amor.conyuge = b.con;
  amor.boda = null;
  if (!tieneDe(amor.habilidades, b.con)) amor.habilidades[b.con] = { nivel: 0, estacion: -1 };
  noticia(amor, 'casados', d, { con: b.con });
  return { ok: true, con: b.con, renglones: [...FRASES_AMOR.boda.escena, VOCES_AMOR[b.con].boda, FRASES_AMOR.boda.si, FRASES_AMOR.boda.firma] };
}

// ---------------------------------------------------------------- vivir juntos
// En el refugio o en la casa de ella (su local, con el cuarto de atrás; la galesa y Nélida, su casa). Novios y
// comprometidos se lo proponen (puede decir que todavía no); casados, sólo eligen dónde.
export const casaDeElla = (clave) => (Object.hasOwn(VECINOS_ALDEA, clave) ? VECINOS_ALDEA[clave].casa : LOTE_DE[clave] || null);
export function convivir(estado, clave, donde, ctx = {}) {
  const r0 = puedeRomance(clave, estado, ctx);
  if (!r0.ok) return { ok: false, motivo: r0.motivo, renglones: [] };
  if (donde !== 'refugio' && donde !== 'suya') return { ok: false, motivo: 'no-se', renglones: [] };
  const { amor, progreso } = partes(estado, true);
  const d = diaDe(progreso, ctx);
  const f = ficha(amor, clave);
  if (!['novios', 'comprometidos', 'casados'].includes(f.etapa)) return { ok: false, motivo: 'pronto', renglones: [FRASES_AMOR.noTodavia] };
  if (enojada(f, d)) return { ok: false, motivo: 'enojada', renglones: [elegir(FRASES_AMOR.enojada, `${clave}${d}`)] };
  if (f.etapa !== 'casados') {
    if (f.rechazo && d - f.rechazo < AMOR.enojo.rechazo) return { ok: true, si: false, renglones: [FRASES_AMOR.convivirNo] };
    const p = f.afecto < AMOR.convivir.minimo ? 0 : acotar((f.afecto - 40) / 40, 0.05, 0.97);
    if (sorteo(`${clave}:convivir:${d}:${Math.round(f.afecto)}:${entero(ctx.semilla)}`) >= p) { f.rechazo = d; return { ok: true, si: false, renglones: [FRASES_AMOR.convivirNo] }; }
  }
  contacto(f, d);
  amor.convivencia = { con: clave, donde, desde: d };
  return { ok: true, si: true, renglones: [f.etapa === 'casados' ? FRASES_AMOR.casaElegida[donde] : FRASES_AMOR.convivirSi, ...(f.etapa === 'casados' ? [] : [FRASES_AMOR.casaElegida[donde]])] };
}
export function dondeViven(estado) {
  const c = partes(estado).amor?.convivencia;
  if (!c) return null;
  return { con: c.con, donde: c.donde, edificio: c.donde === 'refugio' ? 'refugio' : casaDeElla(c.con), desde: c.desde };
}

// ---------------------------------------------------------------- los hijos
export const etapaHijo = (h, dia) => Math.max(0, Math.min(ETAPAS_CHICOS.length - 1, Math.floor((diaValido(dia, 1) - diaValido(h?.nacio, 1)) / DIAS_ANIO)));
export function hijosDe(estado, dia) {
  const a = partes(estado).amor;
  if (!a) return [];
  return a.hijos.map((h) => ({ ...h, etapa: ETAPAS_CHICOS[etapaHijo(h, dia)] }));
}
// La casa de los chicos: la de los dos si conviven; si no (separados, o casados que todavía no eligieron), la
// de la mamá.
function casaDeLosChicos(a, madre) {
  if (a.convivencia && a.convivencia.con === madre && a.personas[madre]?.etapa !== 'separados') return a.convivencia.donde === 'refugio' ? 'refugio' : casaDeElla(madre);
  return casaDeElla(madre);
}
const HORA_CAMA = [19.5, 21, 22, 23];
// Dónde está cada hijo: { lugar, edificio, punto } ('refugio' no es de la aldea: el mundo lo ubica). El bebé,
// con la mamá (de noche, en la cuna); los chicos, a la escuela (si está abierta), a la plaza, a su cuarto; el
// joven, al oficio (el que guiaste, o el de la mamá). Separados, te visitan los miércoles y domingos de 10 a 18.
export function rutinaHijo(estado, i, hora, diaSemana, dia, aldea = null) {
  const { amor, aldea: al } = partes(estado);
  const h = amor?.hijos?.[i];
  if (!h) return null;
  const a = aldea || al;
  const t = horaNorm(hora), ds = ((entero(diaSemana) % 7) + 7) % 7, d = diaValido(dia, 1);
  if (d < h.nacio) return null;
  const etapa = etapaHijo(h, d);
  const casa = casaDeLosChicos(amor, h.madre);
  const cama = { lugar: 'casa', edificio: casa, punto: etapa === 0 ? 'cuna' : `cama-hijo-${i + 1}` };
  if (t >= HORA_CAMA[etapa] || t < (etapa === 3 ? 7 : 7.5)) return cama;
  const separados = amor.personas[h.madre]?.etapa === 'separados';
  if (etapa === 0) { const m = rutinaPareja(estado, h.madre, t, ds, d, a); return { lugar: 'con-mama', edificio: m.edificio || casa, punto: m.punto || 'adentro' }; }
  if (separados && (ds === 2 || ds === 6) && t >= 10 && t < 18) return { lugar: 'visita', edificio: 'refugio', punto: 'adentro' };
  const habil = ds < 5;
  if (etapa === 3) {
    const oficio = h.guia && esPobladorAldea(h.guia) && localAbierto(a, LOTE_DE[h.guia]) ? LOTE_DE[h.guia] : casaDeElla(h.madre);
    if (habil && ((t >= 8.5 && t < 12.5) || (t >= 13.5 && t < 17.5))) return { lugar: 'trabajo', edificio: oficio, punto: 'cliente' };
    return { lugar: 'casa', edificio: casa, punto: 'adentro' };
  }
  if (habil && localAbierto(a, 'escuela') && t >= 8.5 && t < 12.5) return { lugar: 'escuela', edificio: 'escuela', punto: `pupitre-${3 + i}` };
  if (etapa === 2 && habil && t >= 14 && t < 17) return { lugar: 'trabajo', edificio: casaDeElla(h.madre), punto: 'cliente' };
  if ((t >= 14 && t < 18) || (!habil && t >= 10 && t < 12.5)) return { lugar: 'plaza', edificio: 'plaza', punto: `juego-${3 + (i % 2)}` };
  return { lugar: 'casa', edificio: casa, punto: 'adentro' };
}
// ¿Están todos los hijos que viven en la casa dormidos en su cuarto? (sin hijos: sí)
export function hijosDormidos(estado, hora, diaSemana, dia, aldea = null) {
  const { amor } = partes(estado);
  if (!amor?.hijos.length) return true;
  return amor.hijos.every((h, i) => {
    if (diaValido(dia, 1) < h.nacio) return true;
    const r = rutinaHijo(estado, i, hora, diaSemana, dia, aldea);
    return !r || r.punto === 'cuna' || /^cama-hijo-/.test(r.punto);
  });
}
// El hijo grande que guiás hacia un oficio (el de un poblador con local abierto) o null (el de la mamá).
export function guiarHijo(estado, i, oficio) {
  const h = partes(estado).amor?.hijos?.[i];
  if (!h) return false;
  h.guia = esPobladorAldea(oficio) ? oficio : null;
  return true;
}
function nacer(a, d) {
  const e = a.embarazo;
  a.embarazo = null;
  a.buscan = false;
  if (!e || a.hijos.length >= AMOR.hijos.max) return null;
  const sexo = sorteo(`sexo:${e.madre}:${e.desde}:${a.hijos.length}`) < 0.5 ? 'nene' : 'nena';
  const usados = new Set(a.hijos.map((h) => h.nombre));
  const lista = FRASES_AMOR.hijos.nombres[sexo].filter((n) => !usados.has(n));
  const nombre = lista[hashTexto(`${e.madre}:${e.desde}`) % lista.length];
  const h = { id: `hijo-${a.hijos.length + 1}`, nombre, sexo, nacio: d, madre: e.madre, guia: null };
  a.hijos.push(h);
  noticia(a, 'nacio', d, { con: e.madre, hijo: nombre });
  return h;
}
// «Hablar de los chicos»: con hijos, cómo andan; esperando, cuánto falta; sin hijos, si se puede, ofrece
// buscar uno (`buscarHijo`). Una vez por día.
export function hablarDeLosChicos(estado, clave, ctx = {}) {
  const r0 = puedeRomance(clave, estado, ctx);
  if (!r0.ok) return { ok: false, motivo: r0.motivo, renglones: [] };
  const { amor, progreso } = partes(estado, true);
  const d = diaDe(progreso, ctx);
  const f = ficha(amor, clave);
  if (f.chicos === d) return { ok: false, motivo: 'ya-hoy', renglones: [FRASES_AMOR.chicosHoy] };
  f.chicos = d;
  contacto(f, d);
  if (amor.embarazo?.madre === clave) return { ok: true, renglones: [llenarAmor(FRASES_AMOR.esperando, { dias: Math.max(1, amor.embarazo.nace - d) })] };
  const suyos = amor.hijos.filter((h) => h.madre === clave);
  if (suyos.length) {
    const h = suyos[hashTexto(`${clave}${d}`) % suyos.length];
    const etapa = ETAPAS_CHICOS[etapaHijo(h, d)];
    sumarAfecto(f, 1);
    return { ok: true, renglones: [llenarAmor(elegir(FRASES_AMOR.hijos.charla[etapa], `${h.nombre}${d}`), { hijo: h.nombre })] };
  }
  return { ok: true, renglones: [VOCES_AMOR[clave].chicos], ofrece: puedeBuscarHijo(estado, clave) };
}
export function puedeBuscarHijo(estado, clave) {
  const a = partes(estado).amor;
  return !!a && a.conyuge === clave && a.personas[clave]?.etapa === 'casados' && !a.buscan && !a.embarazo && a.hijos.length < AMOR.hijos.max;
}
export function buscarHijo(estado, clave, ctx = {}) {
  const { amor, progreso } = partes(estado, true);
  const d = diaDe(progreso, ctx);
  const f = fichaSi(amor, clave);
  if (!romanceActivo(ctx) || !f) return { ok: false, renglones: [] };
  if (amor.hijos.length >= AMOR.hijos.max) return { ok: true, si: false, renglones: [FRASES_AMOR.maximoHijos] };
  if (amor.buscan || amor.embarazo) return { ok: true, si: false, renglones: [FRASES_AMOR.buscarYa] };
  if (!puedeBuscarHijo(estado, clave) || f.afecto < AMOR.hijos.buscar || enojada(f, d)) return { ok: true, si: false, renglones: [FRASES_AMOR.buscarNo] };
  amor.buscan = true;
  return { ok: true, si: true, renglones: [FRASES_AMOR.buscarSi] };
}

// ---------------------------------------------------------------- el ñiki ñiki
// Estilo Sims: un fundido a negro, sin mostrar ni describir nada. Casados o novios que conviven, de noche, en
// la casa de los dos, sin enojo y con los hijos (si hay) dormidos en su cuarto. Una vez por noche. Da descanso
// (como una buena noche), saca el entumecido y deja el día de buen ánimo. Si buscan un hijo, puede venir uno.
export function puedeNikiNiki(estado, clave, ctx = {}) {
  if (!puedeRomance(clave, estado, ctx).ok) return { ok: false, motivo: 'no' };
  const { amor, progreso, aldea } = partes(estado);
  const f = fichaSi(amor, clave);
  const conv = amor?.convivencia;
  if (!f || !conv || conv.con !== clave || !['novios', 'comprometidos', 'casados'].includes(f.etapa)) return { ok: false, motivo: 'no' };
  const d = diaDe(progreso, ctx), h = horaDe(progreso, ctx);
  if (!(h >= AMOR.niki.desde || h < AMOR.niki.hasta)) return { ok: false, motivo: 'dia' };
  if (enojada(f, d)) return { ok: false, motivo: 'enojada' };
  const noche = h < AMOR.niki.hasta ? d - 1 : d;
  if (amor.niki === noche) return { ok: false, motivo: 'hoy' };
  if (ctx.enCasa === false) return { ok: false, motivo: 'casa' };
  const dormidos = typeof ctx.hijosDormidos === 'boolean' ? ctx.hijosDormidos : hijosDormidos(estado, h, diaSemanaDe(d), d, aldea);
  if (!dormidos) return { ok: false, motivo: 'chicos' };
  return { ok: true, motivo: null };
}
export function nikiNiki(estado, clave, ctx = {}) {
  const r = puedeNikiNiki(estado, clave, ctx);
  if (!r.ok) return { ok: false, motivo: r.motivo, renglones: FRASES_AMOR.nikiNo[r.motivo] ? [FRASES_AMOR.nikiNo[r.motivo]] : [] };
  const { amor, progreso } = partes(estado);
  const d = diaDe(progreso, ctx), h = horaDe(progreso, ctx);
  const f = ficha(amor, clave);
  amor.niki = h < AMOR.niki.hasta ? d - 1 : d;
  amor.animo = d;
  sumarAfecto(f, AMOR.niki.afecto);
  contacto(f, d);
  let embarazo = false;
  const ultimo = amor.hijos.reduce((m, x) => Math.max(m, x.nacio), -99);
  if (amor.buscan && !amor.embarazo && amor.conyuge === clave && amor.hijos.length < AMOR.hijos.max && d - ultimo >= AMOR.hijos.entre
    && sorteo(`${clave}:bebe:${d}:${amor.hijos.length}:${entero(ctx.semilla)}`) < AMOR.hijos.chance) {
    amor.embarazo = { madre: clave, desde: d, nace: d + AMOR.hijos.embarazo, contado: false };
    embarazo = true;
  }
  const antes = amor.hijos.length ? FRASES_AMOR.nikiAntes : FRASES_AMOR.nikiSinChicos;
  return {
    ok: true, fundido: true, embarazo,
    renglones: [elegir(antes, `${clave}${d}`)],
    despues: FRASES_AMOR.nikiDespues,
    efectos: [{ tipo: 'jugador', campo: 'descansado', valor: AMOR.niki.descanso }, { tipo: 'jugador', campo: 'entumecido', valor: 0 }],
  };
}
export const deBuenAnimo = (estado, dia) => partes(estado).amor?.animo === diaValido(dia, 1);

// ---------------------------------------------------------------- reconquistar
export function reconquistar(estado, clave, ctx = {}) {
  if (!romanceActivo(ctx) || !esCandidata(clave)) return { ok: false, renglones: [] };
  const { amor, progreso } = partes(estado, true);
  const d = diaDe(progreso, ctx);
  const f = fichaSi(amor, clave);
  if (!f || f.etapa !== 'separados') return { ok: false, renglones: [] };
  if (enojada(f, d)) return { ok: false, motivo: 'enojada', renglones: [elegir(FRASES_AMOR.enojada, `${clave}${d}`)] };
  if (f.reconquista < AMOR.reconquista.citas || f.afecto < AMOR.reconquista.minimo) return { ok: true, si: false, renglones: [FRASES_AMOR.reconquistaTodavia] };
  if (f.rechazo && d - f.rechazo < AMOR.enojo.rechazo) return { ok: true, si: false, renglones: [FRASES_AMOR.reconquistaNo] };
  contacto(f, d);
  const p = acotar((f.afecto - 40) / 40 + (esFavorito(clave, ctx.lugar) ? 0.2 : 0), 0.05, 0.97);
  if (sorteo(`${clave}:vuelve:${d}:${Math.round(f.afecto)}:${entero(ctx.semilla)}`) >= p) { f.rechazo = d; return { ok: true, si: false, renglones: [FRASES_AMOR.reconquistaNo] }; }
  cambiarEtapa(f, 'casados', d);
  f.reconquista = 0;
  noticia(amor, 'volvieron', d, { con: clave });
  return { ok: true, si: true, renglones: [FRASES_AMOR.reconquistaSi] };
}

// ---------------------------------------------------------------- las habilidades
export function habilidadesDe(estado) {
  const a = partes(estado).amor;
  if (!a) return [];
  return Object.entries(a.habilidades).filter(([k, x]) => Object.hasOwn(HABILIDADES, k) && x.nivel > 0).map(([k, x]) => ({
    de: k, id: HABILIDADES[k].id, nombre: HABILIDADES[k].nombre, nivel: x.nivel, niveles: HABILIDADES[k].niveles.slice(0, x.nivel).map((n) => n.nombre),
  }));
}
// Lo que rinden hoy todas las habilidades juntas (los niveles se suman; el descanso, el mayor).
export function efectosDeHabilidades(estado, dia) {
  const a = partes(estado).amor;
  if (!a) return [];
  const d = diaValido(dia, 1);
  const suma = new Map(), jugador = new Map(), aldea = new Map();
  for (const [k, x] of Object.entries(a.habilidades)) {
    if (!Object.hasOwn(HABILIDADES, k)) continue;
    for (const nivel of HABILIDADES[k].niveles.slice(0, Math.min(NIVELES_HABILIDAD, x.nivel))) {
      for (const e of nivel.efectos) {
        if (e.tipo === 'jugador') jugador.set(e.campo, e.campo === 'entumecido' ? 0 : Math.max(jugador.get(e.campo) || 0, e.valor));
        else if (e.tipo === 'aldea') aldea.set(e.campo, e.valor === 'hoy' ? d : e.valor);
        else { const c = `${e.tipo}:${e.k}`; suma.set(c, (suma.get(c) || 0) + e.n); }
      }
    }
  }
  return [
    ...[...suma].map(([c, n]) => { const [tipo, k] = c.split(':'); return { tipo, k, n }; }),
    ...[...jugador].map(([campo, valor]) => ({ tipo: 'jugador', campo, valor })),
    ...[...aldea].map(([campo, valor]) => ({ tipo: 'aldea', campo, valor })),
  ];
}

// ---------------------------------------------------------------- el paso de los días
// Con el ajuste apagado el amor queda quieto: los días que pasan no cuentan (todas las fechas se corren), así al
// prenderlo no hay descuido acumulado, ni boda perdida, ni chicos que crecieron sin que se vea.
function congelar(a, n) {
  const mas = (v) => (v ? Math.min(TOPE_DIA, v + n) : v);
  for (const f of Object.values(a.personas)) for (const c of ['contacto', 'enojo', 'desde', 'rechazo', 'ultimaCita', 'carta']) f[c] = mas(f[c]);
  if (a.boda) a.boda.dia = mas(a.boda.dia);
  if (a.embarazo) { a.embarazo.desde = mas(a.embarazo.desde); a.embarazo.nace = mas(a.embarazo.nace); }
  if (a.anillo) { a.anillo.pedido = mas(a.anillo.pedido); a.anillo.listo = mas(a.anillo.listo); }
  for (const c of a.correo) { c.dia = mas(c.dia); c.entrega = mas(c.entrega); }
  for (const h of a.hijos) h.nacio = mas(h.nacio);
  if (a.cita) a.cita.dia = mas(a.cita.dia);
  for (const hb of Object.values(a.habilidades)) if (hb.estacion >= 0) hb.estacion += Math.floor(n / 4);
  a.chisme = mas(a.chisme);
}
// Llamarla al empezar cada día (amor-juego.js, con la vecindad). Entrega el correo, avisa el anillo listo,
// posterga la boda que no se hizo, hace nacer al bebé, enseña la habilidad de la estación, cuenta el descuido
// (corta, se enfría o se separan), corre el chisme si salís con más de una y vence la cita que no fuiste.
// Devuelve { eventos: [{ tipo, clave?, texto, sub }], efectos } (`efectos`: lo que rinden hoy las habilidades,
// una vez por día). `ctx`: { ritmo } (el ritmo de la aldea: cuánto corre el chisme), { romance }.
export function pasarDiaAmor(estado, dia, ctx = {}) {
  const { amor } = partes(estado, true);
  const d = diaValido(dia, 1);
  const eventos = [];
  if (!romanceActivo(ctx)) { if (amor.dia && d > amor.dia) congelar(amor, d - amor.dia); amor.dia = Math.max(amor.dia, d); return { eventos, efectos: [] }; }   // apagado: quieto
  const desde = Math.max(amor.dia || d - 1, d - 60);
  const ritmo = ['tranquilo', 'normal', 'animado'].includes(ctx.ritmo) ? ctx.ritmo : 'normal';
  for (let x = desde + 1; x <= d; x++) {
    // el correo de ayer llega con el tren de la mañana
    for (const c of amor.correo.filter((y) => y.entrega <= x && !y.llego)) {
      c.llego = true;
      const f = fichaSi(amor, c.para);
      if (!f || !esCandidata(c.para)) continue;
      sumarAfecto(f, c.tipo === 'ramo' ? AMOR.ramo : AMOR.carta);
      f.carta = x; f.leyo = c.tipo;
      contacto(f, x);
      eventos.push({ tipo: 'correo', clave: c.para, texto: llenarAmor(FRASES_AMOR.correo.entregada[c.tipo], conElla(c.para)), sub: FRASES_AMOR.correo.entregadaSub });
    }
    amor.correo = amor.correo.filter((y) => !y.llego);
    if (amor.anillo && !amor.anillo.retirado && !amor.anillo.avisado && x >= amor.anillo.listo) {
      amor.anillo.avisado = true;
      eventos.push({ tipo: 'anillo', texto: FRASES_AMOR.anillo.avisoListo, sub: FRASES_AMOR.anillo.avisoListoSub });
    }
    // la boda a la que no fuiste: pasa para el día siguiente
    if (amor.boda && x > amor.boda.dia) {
      const f = ficha(amor, amor.boda.con);
      amor.boda.dia = x + 1;
      sumarAfecto(f, AMOR.boda.plantada);
      f.enojo = Math.max(f.enojo, x); f.motivo = 'boda';
      eventos.push({ tipo: 'boda-postergada', clave: amor.boda.con, texto: 'El casamiento pasó para mañana', sub: llenarAmor(FRASES_AMOR.boda.postergada, { ella: nombreDe(amor.boda.con), dia: amor.boda.dia }) });
    }
    if (amor.boda && x === amor.boda.dia) eventos.push({ tipo: 'boda', clave: amor.boda.con, texto: llenarAmor(FRASES_AMOR.boda.aviso, conElla(amor.boda.con)), sub: FRASES_AMOR.boda.avisoSub });
    if (amor.embarazo && x >= amor.embarazo.nace) {
      const h = nacer(amor, x);
      if (h) eventos.push({ tipo: 'nacio', clave: h.madre, hijo: h.nombre, texto: llenarAmor(FRASES_AMOR.hijos.nacio, { hijo: h.nombre }), sub: llenarAmor(FRASES_AMOR.hijos.nacioSub, { hijo: h.nombre }) });
    }
    for (const h of amor.hijos) {
      const e = etapaHijo(h, x);
      if (e > 0 && e > etapaHijo(h, x - 1)) eventos.push({ tipo: 'crecio', hijo: h.nombre, etapa: ETAPAS_CHICOS[e], texto: llenarAmor(FRASES_AMOR.hijos.crecio[ETAPAS_CHICOS[e]], { hijo: h.nombre }), sub: '' });
    }
    // la habilidad de la estación (casados y juntos)
    const k = amor.conyuge;
    if (k && amor.personas[k]?.etapa === 'casados' && tieneDe(amor.habilidades, k)) {
      const hb = amor.habilidades[k];
      if (hb.nivel < NIVELES_HABILIDAD && estacionAbs(x) > hb.estacion) {
        hb.nivel++; hb.estacion = estacionAbs(x);
        const n = HABILIDADES[k].niveles[hb.nivel - 1];
        eventos.push({ tipo: 'habilidad', clave: k, nivel: hb.nivel, texto: llenarAmor(FRASES_AMOR.habilidad.aviso, { ella: nombreDe(k), nombre: n.nombre }), sub: n.texto });
      }
    }
    // el descuido
    for (const [c, f] of Object.entries(amor.personas)) {
      const regla = AMOR.descuido[f.etapa];
      if (!regla || !f.contacto) continue;
      const sin = x - f.contacto;
      if (sin <= regla[0]) continue;
      sumarAfecto(f, -regla[1]);
      if (sin === regla[0] + 1 && ['novios', 'comprometidos', 'casados'].includes(f.etapa)) eventos.push({ tipo: 'descuido', clave: c, texto: llenarAmor(FRASES_AMOR.descuido, conElla(c)), sub: '' });
      const piso = AMOR.corte[f.etapa];
      if (piso === undefined || f.afecto >= piso) continue;
      if (f.etapa === 'casados') {
        cambiarEtapa(f, 'separados', x);
        f.enojo = Math.max(f.enojo, x + AMOR.enojo.separacion - 1); f.motivo = 'descuido'; f.reconquista = 0;
        if (amor.convivencia?.con === c) amor.convivencia = null;
        amor.buscan = false;
        if (amor.cita?.clave === c) amor.cita = null;
        noticia(amor, 'separados', x, { con: c });
        eventos.push({ tipo: 'separacion', clave: c, texto: `${nombreDe(c)} y vos se separaron`, sub: llenarAmor(amor.hijos.some((h) => h.madre === c) ? FRASES_AMOR.separacion : FRASES_AMOR.separacionSinChicos, conElla(c)) });
      } else if (f.etapa === 'saliendo') {
        cambiarEtapa(f, 'coqueteo', x);
        eventos.push({ tipo: 'enfrio', clave: c, texto: llenarAmor(FRASES_AMOR.seEnfrio, conElla(c)), sub: '' });
      } else {
        // novios o comprometidos: corta (el anillo vuelve a tu bolsillo y no hay boda)
        cambiarEtapa(f, 'conocidos', x);
        f.afecto = Math.min(f.afecto, 10);
        f.enojo = Math.max(f.enojo, x + AMOR.enojo.corte - 1); f.motivo = 'descuido';
        if (amor.boda?.con === c) amor.boda = null;
        if (amor.anillo?.para === c) amor.anillo.para = null;
        if (amor.convivencia?.con === c) amor.convivencia = null;
        if (amor.cita?.clave === c) amor.cita = null;
        eventos.push({ tipo: 'corto', clave: c, texto: `${nombreDe(c)} cortó con vos`, sub: llenarAmor(FRASES_AMOR.corto, conElla(c)) });
      }
    }
    // el chisme: salís con más de una (saliendo o novios). Corre según el ritmo de la aldea, más si se los
    // vio en público hace poco; cuando corre, todas se enojan unos días.
    const ellas = activas(amor);
    if (ellas.length >= 2 && x - amor.chisme >= AMOR.celos.entre) {
      const publico = amor.noticias.some((n) => n.tipo === 'cita' && x - n.dia <= 2 && ellas.includes(n.con));
      const p = AMOR.celos.chance[ritmo] + (publico ? AMOR.celos.publico : 0);
      if (sorteo(`chisme:${x}:${ellas.join(',')}`) < p) {
        amor.chisme = x;
        for (const c of ellas) {
          const f = amor.personas[c];
          sumarAfecto(f, -AMOR.celos.baja);
          f.enojo = Math.max(f.enojo, x + AMOR.celos.dias - 1); f.motivo = 'celos';
          if (amor.cita?.clave === c) amor.cita = null;
        }
        noticia(amor, 'dos-a-la-vez', x, { con: ellas[0], otra: ellas[1] });
        eventos.push({ tipo: 'chisme', claves: [...ellas], texto: 'Corrió el chisme', sub: `${ellas.map(nombreDe).join(' y ')} se enteraron de que salís con las dos. ${VOCES_AMOR[ellas[0]].celos}` });
      }
    }
    // la cita de un día que ya pasó
    if (amor.cita && amor.cita.estado === 'acordada' && amor.cita.dia < x) { const v = vencerCita(amor, { dia: x, hora: 0 }); if (v) eventos.push(v); }
    if (amor.cita && amor.cita.estado === 'en-curso' && amor.cita.dia < x) amor.cita = null;
  }
  amor.noticias = amor.noticias.filter((n) => d - n.dia <= VIDA_NOTICIA);
  amor.dia = Math.max(amor.dia, d);
  let efectos = [];
  if (amor.rinde !== d) { amor.rinde = d; efectos = efectosDeHabilidades(amor, d); }
  return { eventos, efectos };
}

// ---------------------------------------------------------------- lo que comentan los vecinos (y la radio)
// Un comentario con humor de alguien de la vecindad sobre una novedad reciente (o null). Los chismosos le ponen
// más ganas. Ella no comenta lo suyo (eso lo dice en `verla`). Una vez cada novedad por persona.
export function comentarioDeAmor(estado, persona, ctx = {}) {
  if (!romanceActivo(ctx) || !esPersonaVecindad(persona)) return null;
  const { amor, progreso } = partes(estado);
  if (!amor || !amor.noticias.length) return null;
  const d = diaDe(progreso, ctx);
  const ya = Array.isArray(amor.comentados[persona]) ? amor.comentados[persona] : [];
  const chismoso = !!ctx.chismoso;
  for (const n of [...amor.noticias].reverse()) {
    if (d - n.dia > 3 || ya.includes(n.id) || n.con === persona || n.otra === persona) continue;
    const pool = (chismoso && FRASES_AMOR.chisme[n.tipo]) || FRASES_AMOR.comentario[n.tipo];
    if (!pool) continue;
    amor.comentados[persona] = [...ya, n.id].slice(-TOPE_COMENTADOS);
    return llenarAmor(elegir(pool, `${persona}${n.id}`), { ella: nombreDe(n.con), otra: n.otra ? nombreDe(n.otra) : '', lugar: n.lugar ? LUGARES_CITA[n.lugar]?.nombre : '', hijo: n.hijo || '' });
  }
  return null;
}
// El gancho para la radio y el diario de la aldea (3.7.4): las novedades desde `desde`, con una línea con humor.
export function noticiasDeAmor(estado, ctx = {}) {
  if (!romanceActivo(ctx)) return [];
  const { amor, progreso } = partes(estado);
  if (!amor) return [];
  const desde = entero(ctx.desde, 0), d = diaDe(progreso, ctx);
  return amor.noticias.filter((n) => n.dia >= desde && n.dia <= d && FRASES_AMOR.radio[n.tipo]).map((n) => ({
    id: n.id, tipo: n.tipo, dia: n.dia,
    texto: llenarAmor(FRASES_AMOR.radio[n.tipo], { ella: nombreDe(n.con), otra: n.otra ? nombreDe(n.otra) : '', lugar: n.lugar ? LUGARES_CITA[n.lugar]?.nombre : '', hijo: n.hijo || '' }),
  }));
}

// ---------------------------------------------------------------- para el mundo
// La rutina de la pareja: la de siempre (rutinaAldea) con lo del amor encima.
export function rutinaPareja(estado, clave, hora, diaSemana, dia, aldea = null) {
  const { amor, aldea: al } = partes(estado);
  const a = aldea || al;
  const base = rutinaAldea(clave, hora, diaSemana, a, dia);
  if (!amor || !esCandidata(clave)) return base;
  const t = horaNorm(hora), d = diaValido(dia, 1);
  const c = amor.cita;
  if (c && c.clave === clave && (c.estado === 'en-curso' || (c.dia === d && t >= c.desde - AMOR.cita.antes && t <= c.hasta))) {
    const L = LUGARES_CITA[c.lugar];
    return L.aldea ? { lugar: 'cita', edificio: L.aldea.edificio, punto: L.aldea.suyo } : { lugar: 'cita', edificio: null, punto: null, valle: L.valle };
  }
  if (amor.boda?.con === clave && amor.boda.dia === d && t >= AMOR.boda.desde && t < AMOR.boda.hasta) return { lugar: 'boda', edificio: 'biblioteca', punto: 'cuentos' };
  const conv = amor.convivencia;
  if (conv?.con === clave && conv.donde === 'refugio' && amor.personas[clave]?.etapa !== 'separados' && base.lugar === 'casa' && (t >= 19 || t < 8)) {
    return { lugar: 'casa', edificio: 'refugio', punto: base.punto === 'cama' ? 'cama' : 'adentro' };
  }
  return base;
}
const GESTO = { saliendo: 'cerca', novios: 'mano', comprometidos: 'mano', casados: 'brazo' };
// Todo lo que el mundo tiene que mostrar (ver el encabezado). Sin cambiar nada.
export function mundoAmor(estado, ctx = {}) {
  const { amor, progreso, aldea } = partes(estado);
  if (!romanceActivo(ctx) || !amor || ctx.desafio) return { activo: false };
  const d = diaDe(progreso, ctx), h = horaDe(progreso, ctx), ds = diaSemanaDe(d);
  const a = ctx.aldea || aldea;
  const c = amor.cita;
  const cita = c ? { clave: c.clave, lugar: c.lugar, nombre: LUGARES_CITA[c.lugar].nombre, aldea: LUGARES_CITA[c.lugar].aldea || null, valle: LUGARES_CITA[c.lugar].valle || null, dia: c.dia, desde: c.desde, hasta: c.hasta, estado: c.estado, publico: !!LUGARES_CITA[c.lugar].publico, ahora: !!citaAhora(estado, { dia: d, hora: h }) } : null;
  const parejas = Object.entries(amor.personas).filter(([, f]) => Object.hasOwn(GESTO, f.etapa)).map(([k, f]) => ({ clave: k, etapa: f.etapa, gesto: GESTO[f.etapa], publico: f.etapa !== 'saliendo' || !!(c && c.clave === k) }));
  const b = amor.boda;
  const boda = b ? { con: b.con, dia: b.dia, hora: b.hora, lugar: 'biblioteca', ella: 'cuentos', vos: 'cliente', juez: true, hoy: b.dia === d, ...invitadosBoda(estado, ctx) } : null;
  const conv = dondeViven(amor);
  const hijos = amor.hijos.filter((x) => x.nacio <= d).map((x, i) => ({ id: x.id, nombre: x.nombre, sexo: x.sexo, etapa: ETAPAS_CHICOS[etapaHijo(x, d)], madre: x.madre, nacio: x.nacio, rutina: rutinaHijo(estado, i, h, ds, d, a) }));
  const casa = hijos.length ? casaDeLosChicos(amor, hijos[0].madre) : null;
  const cuarto = casa ? { edificio: casa, puntos: hijos.map((x, i) => (x.etapa === 'bebe' ? 'cuna' : `cama-hijo-${i + 1}`)) } : null;
  const an = amor.anillo;
  const anillo = an ? { estado: an.para ? 'dado' : an.retirado ? 'tuyo' : d >= an.listo ? 'listo' : 'haciendo', listo: an.listo, para: an.para } : null;
  return { activo: true, cita, parejas, boda, convivencia: conv, hijos, cuarto, anillo, embarazo: amor.embarazo ? { madre: amor.embarazo.madre, nace: amor.embarazo.nace } : null, animo: amor.animo === d };
}

// ---------------------------------------------------------------- el guardado
// Todo saneado: un guardado roto o retocado no deja nada imposible. Sólo candidatas (ni chicos, ni casados, ni
// Pocha, aunque el guardado diga otra cosa); una sola pareja comprometida/casada; hasta dos hijos; fechas que no
// pasan de hoy (salvo lo que de verdad está por venir: la boda, el bebé, el correo, el anillo y la cita, con un
// tope); listas cortas. `hoy`: el día de la partida.
export function sanearAmor(x0, hoy = null) {
  const x = objeto(x0) ? x0 : {};
  const tope = Number.isFinite(num(hoy)) ? diaValido(hoy, 1) : TOPE_DIA;
  const fecha = (v, mas = 0) => diaOCero(v, Math.min(TOPE_DIA, tope + mas));
  const base = amorNuevo();
  for (const k of ORDEN_CANDIDATAS) {
    if (!tieneDe(x.personas, k) || !esCandidata(k)) continue;
    const y = objeto(x.personas[k]) ? x.personas[k] : {};
    const f = fichaNueva();
    f.etapa = ETAPAS_AMOR.includes(y.etapa) ? y.etapa : 'conocidos';
    f.afecto = acotar(Number.isFinite(num(y.afecto)) ? Math.round(num(y.afecto) * 10) / 10 : 0, 0, AMOR.tope);
    for (const c of ['desde', 'contacto', 'charla', 'piropo', 'flores', 'carta', 'ultimaCita', 'rechazo', 'chicos']) f[c] = fecha(y[c]);
    f.enojo = fecha(y.enojo, AMOR.celos.dias + 1);
    f.citas = diaOCero(y.citas, 9999);
    f.reconquista = diaOCero(y.reconquista, 99);
    f.motivo = ['celos', 'descuido', 'plantada', 'boda'].includes(y.motivo) ? y.motivo : null;
    f.leyo = y.leyo === 'carta' || y.leyo === 'ramo' ? y.leyo : null;
    base.personas[k] = f;
  }
  const P = base.personas;
  // una sola pareja de verdad: la cónyuge (casada o separada) o, si no hay, la primera comprometida
  let conyuge = esCandidata(x.conyuge) && ['casados', 'separados'].includes(P[x.conyuge]?.etapa) ? x.conyuge : null;
  if (!conyuge) conyuge = ORDEN_CANDIDATAS.find((k) => ['casados', 'separados'].includes(P[k]?.etapa)) || null;
  let comprometida = conyuge ? null : ORDEN_CANDIDATAS.find((k) => P[k]?.etapa === 'comprometidos') || null;
  for (const [k, f] of Object.entries(P)) {
    if (k === conyuge || k === comprometida) continue;
    if (idx(f.etapa) >= idx('comprometidos')) cambiarEtapa(f, (conyuge || comprometida) ? 'conocidos' : 'novios', f.desde);
    else if (conyuge || comprometida) { if (idx(f.etapa) >= idx('coqueteo')) cambiarEtapa(f, 'conocidos', f.desde); }
  }
  base.conyuge = conyuge;
  // la boda: sólo de la comprometida
  if (comprometida && objeto(x.boda) && x.boda.con === comprometida) base.boda = { con: comprometida, dia: Math.max(1, fecha(x.boda.dia, AMOR.boda.enDias + 1)), hora: AMOR.boda.hora };
  else if (comprometida) base.boda = { con: comprometida, dia: Math.min(TOPE_DIA, tope + 1), hora: AMOR.boda.hora };
  // el anillo
  if (objeto(x.anillo)) {
    const pedido = Math.max(1, fecha(x.anillo.pedido));
    const para = comprometida || conyuge;
    base.anillo = { pedido, listo: Math.max(pedido, Math.min(pedido + AMOR.anillo.dias, fecha(x.anillo.listo, AMOR.anillo.dias))), retirado: x.anillo.retirado === true || (!!para && x.anillo.para === para), para: para && x.anillo.para === para ? para : null };
    if (x.anillo.avisado === true) base.anillo.avisado = true;
  }
  if (comprometida && !base.anillo?.para) base.anillo = { pedido: 1, listo: 1, retirado: true, para: comprometida };
  // vivir juntos: con la pareja (no separada) o una novia
  const cv = x.convivencia;
  if (objeto(cv) && esCandidata(cv.con) && ['novios', 'comprometidos', 'casados'].includes(P[cv.con]?.etapa) && (cv.donde === 'refugio' || cv.donde === 'suya')) base.convivencia = { con: cv.con, donde: cv.donde, desde: Math.max(1, fecha(cv.desde)) };
  // los hijos: hasta dos, de una candidata, nacidos hasta hoy
  const nombres = new Set();
  for (const h of Array.isArray(x.hijos) ? x.hijos : []) {
    if (base.hijos.length >= AMOR.hijos.max || !objeto(h) || !esCandidata(h.madre)) continue;
    const sexo = h.sexo === 'nena' ? 'nena' : 'nene';
    let nombre = textoSano(h.nombre, 24);
    if (!nombre || nombres.has(nombre)) nombre = FRASES_AMOR.hijos.nombres[sexo].find((n) => !nombres.has(n));
    nombres.add(nombre);
    base.hijos.push({ id: `hijo-${base.hijos.length + 1}`, nombre, sexo, nacio: Math.max(1, fecha(h.nacio)), madre: h.madre, guia: esPobladorAldea(h.guia) ? h.guia : null });
  }
  const e = x.embarazo;
  if (objeto(e) && conyuge && e.madre === conyuge && P[conyuge].etapa === 'casados' && base.hijos.length < AMOR.hijos.max) {
    const desde = Math.max(1, fecha(e.desde));
    base.embarazo = { madre: conyuge, desde, nace: Math.max(desde + 1, Math.min(desde + AMOR.hijos.embarazo, fecha(e.nace, AMOR.hijos.embarazo))), contado: e.contado === true };
  }
  base.buscan = x.buscan === true && !!conyuge && P[conyuge].etapa === 'casados' && base.hijos.length < AMOR.hijos.max;
  if (objeto(x.habilidades)) for (const k of ORDEN_CANDIDATAS) if (tieneDe(x.habilidades, k) && objeto(x.habilidades[k])) {
    base.habilidades[k] = { nivel: acotar(entero(x.habilidades[k].nivel), 0, NIVELES_HABILIDAD), estacion: Math.max(-1, Math.min(estacionAbs(tope), entero(x.habilidades[k].estacion, -1))) };
  }
  if (conyuge && !tieneDe(base.habilidades, conyuge)) base.habilidades[conyuge] = { nivel: 0, estacion: -1 };
  const c = x.cita;
  if (objeto(c) && esCandidata(c.clave) && esLugarCita(c.lugar) && idx(P[c.clave]?.etapa) >= idx('coqueteo') && Number.isFinite(num(c.desde)) && Number.isFinite(num(c.hasta))) {
    const desde = acotar(num(c.desde), 0, 24), hasta = acotar(num(c.hasta), desde, 26);
    base.cita = { clave: c.clave, lugar: c.lugar, dia: Math.max(1, fecha(c.dia, 1)), desde, hasta, estado: c.estado === 'en-curso' ? 'en-curso' : 'acordada' };
  }
  for (const y of Array.isArray(x.correo) ? x.correo : []) {
    if (!objeto(y) || (y.tipo !== 'carta' && y.tipo !== 'ramo') || !esCandidata(y.para)) continue;
    const dia = Math.max(1, fecha(y.dia));
    base.correo.push({ tipo: y.tipo, para: y.para, dia, entrega: Math.max(dia, Math.min(dia + 1, fecha(y.entrega, 1))) });
  }
  base.correo = base.correo.slice(-TOPE_CORREO);
  const TIPOS = new Set(Object.keys(FRASES_AMOR.radio));
  for (const n of Array.isArray(x.noticias) ? x.noticias : []) {
    if (!objeto(n) || !TIPOS.has(n.tipo) || !esCandidata(n.con) || typeof n.id !== 'string' || n.id.length > 80) continue;
    const z = { id: n.id, tipo: n.tipo, dia: Math.max(1, fecha(n.dia)), con: n.con };
    if (esCandidata(n.otra)) z.otra = n.otra;
    if (esLugarCita(n.lugar)) z.lugar = n.lugar;
    if (textoSano(n.hijo, 24)) z.hijo = textoSano(n.hijo, 24);
    base.noticias.push(z);
  }
  base.noticias = base.noticias.slice(-TOPE_NOTICIAS);
  if (objeto(x.comentados)) for (const k of PERSONAS_VECINDAD) if (Array.isArray(x.comentados[k])) base.comentados[k] = x.comentados[k].filter((s) => typeof s === 'string' && s.length <= 80).slice(-TOPE_COMENTADOS);
  base.niki = fecha(x.niki); base.animo = fecha(x.animo); base.chisme = fecha(x.chisme); base.rinde = fecha(x.rinde); base.dia = fecha(x.dia);
  return base;
}
