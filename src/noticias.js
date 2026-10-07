// 3.7.5 (noticias): las noticias del valle (PLAN_3_7.md, 3.7.5): la radio por horarios, el diario de la aldea y las
// cartas de tus familiares y de los que vivieron antes en el valle.
//
//   · La radio comunitaria de la aldea transmite desde la estafeta, de día, con programas a ciertas horas (el tiempo,
//     las noticias del valle, la música del sur, el chisme con humor, los avisos de fiestas y concursos). De noche
//     sigue la radio de siempre (radio.js: los refugios lejanos, los rumores y los pedidos). Se oye desde que conocés
//     la aldea (antes, nadie te contó que existe).
//   · El diario de la aldea sale cada tantos días (según el ritmo de la aldea): lo arman la maestra y los chicos de la
//     escuela y lo imprime Benigno en la estafeta. Queda en el cuaderno (las últimas ediciones).
//   · Las cartas de lejos (tu mamá, tu hermano, tu tía, tu abuelo; el puestero que vivió en tu refugio, la primera
//     maestra de la aldea, el viejo farero…) llegan con el tren y te las da Benigno en la estafeta (o Ercilia en el
//     almacén). Una cada tantos días, según el ritmo. Las cartas de la aldea si no vas ya estaban (aldea-vida.js).
//
// Todo lo que el plan no dice (las horas de cada programa, cada cuánto sale el diario, cada cuánto llega una carta,
// quién hace la radio) está en constantes acá arriba, para cambiarlo fácil. Sin economía nueva, nada religioso.
// Módulo puro: recibe lo que pasa ya armado en renglones (lo junta noticias-juego.js).
import { hashTexto, generador } from './semilla.js';

const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const entero = (v, d = 0) => Math.floor(num(v, d));
const TOPE_DIA = 1e6;
const diaValido = (v, d = 1) => Math.max(1, Math.min(TOPE_DIA, entero(v, d)));
const diaOCero = (v, tope = TOPE_DIA) => Math.max(0, Math.min(tope, entero(v, 0)));
const textoSano = (s, tope = 400) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f<>]/g, '').slice(0, tope) : '');
const ritmoSano = (r) => (['tranquilo', 'normal', 'animado'].includes(r) ? r : 'normal');
const horaTexto = (h) => { const m = Math.floor((((num(h) % 24) + 24) % 24) * 60 + 1e-6) % 1440; return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };

// ---------------------------------------------------------------- la radio comunitaria (las constantes)
export const RADIO_ALDEA = { nombre: 'Radio Comunitaria del Valle', dial: 'FM 89.5', locutora: 'Chiche', desde: 'la estafeta de la aldea' };
// La grilla: [desde, hasta) en horas del juego. Fuera de la grilla (de 20 a 7), la radio de siempre (radio.js).
export const PROGRAMAS_RADIO = [
  { id: 'tiempo', desde: 7, hasta: 9, nombre: 'El tiempo con mate' },
  { id: 'noticias', desde: 9, hasta: 12, nombre: 'Noticias del valle' },
  { id: 'musica', desde: 12, hasta: 14, nombre: 'Música del sur' },
  { id: 'chisme', desde: 14, hasta: 17, nombre: 'La tarde del chisme' },
  { id: 'avisos', desde: 17, hasta: 20, nombre: 'Avisos de la comunidad' },
];
export const PROGRAMA_RADIO = Object.fromEntries(PROGRAMAS_RADIO.map((p) => [p.id, p]));
// Cuántos chismes por programa, según el ritmo de la aldea
export const CHISMES_POR_RITMO = { tranquilo: 1, normal: 2, animado: 3 };
// La música (la de cada fiesta y la de todos los días): lo que se dice antes del tema
export const MUSICA_RADIO = [
  'Ahora, un chamamé para los que están cebando el primer mate de la tarde. Sube el acordeón y baja el viento.',
  'Va un loncomeo, con el kultrún bien al frente. Para los que están en el campo: suban el volumen.',
  'Una chacarera del sur, de esas que se bailan con poncho. Si están solos en la cocina, también vale.',
  'Una milonga sureña, lenta, para la siesta. Guitarra sola y una voz que parece de otro siglo.',
  'Un vals de los galeses del Chubut, que nos mandaron grabado desde Gaiman. Ceinwen dice que es de su abuela.',
  'Una cueca cordillerana, de las que cruzan la frontera sin pasaporte. Pañuelo en mano, aunque sea en la cocina.',
];
export const programaDeHora = (h) => { const x = ((num(h, 12) % 24) + 24) % 24; return PROGRAMAS_RADIO.find((p) => x >= p.desde && x < p.hasta) || null; };

// Lo que se oye. `datos`: { dia, hora, ritmo, tiempo: [renglones], novedades: [], chismes: [], avisos: [] } (ya armados).
// Devuelve { programa, nombre, locutora, texto } o null (fuera de la grilla: la radio de siempre).
export function armarPrograma(datos = {}) {
  const p = programaDeHora(datos.hora);
  if (!p) return null;
  const dia = diaValido(datos.dia, 1);
  const r = generador(hashTexto(`radio-${p.id}-${dia}`));
  const L = (a) => (Array.isArray(a) ? a.filter((s) => typeof s === 'string' && s) : []);
  const saludo = `Son las ${horaTexto(datos.hora)} en la ${RADIO_ALDEA.nombre}, ${RADIO_ALDEA.dial}.`;
  let texto = '';
  if (p.id === 'tiempo') {
    const t = L(datos.tiempo);
    texto = `Buen día, valle. ${saludo} El tiempo: ${t.length ? t.slice(0, 2).join(' ') : 'cielo tranquilo, el barómetro quieto y ninguna novedad en la cordillera.'} Pongan la pava, que ya arrancamos.`;
  } else if (p.id === 'noticias') {
    const n = L(datos.novedades).slice(0, 3);
    texto = `${saludo} Las noticias del valle. ${n.length ? n.join(' ') : 'Sin novedades: la aldea anda a su paso, que no es poco.'}`;
  } else if (p.id === 'musica') {
    texto = `${saludo} ${MUSICA_RADIO[Math.floor(r() * MUSICA_RADIO.length) % MUSICA_RADIO.length]}`;
  } else if (p.id === 'chisme') {
    const lista = L(datos.chismes);
    const cuantos = CHISMES_POR_RITMO[ritmoSano(datos.ritmo)];
    const elegidos = [];
    while (lista.length && elegidos.length < cuantos) elegidos.push(lista.splice(Math.floor(r() * lista.length) % lista.length, 1)[0]);
    texto = `${saludo} La tarde del chisme, y que conste que acá no se inventa nada. ${elegidos.length ? elegidos.join(' ') : 'Hoy nadie hizo nada digno de contar. Sospechoso.'}`;
  } else {
    const a = L(datos.avisos).slice(0, 4);
    texto = `${saludo} Los avisos de la comunidad. ${a.length ? a.join(' ') : 'No hay avisos: si tienen algo para contar, pasen por la estafeta.'}`;
  }
  return { programa: p.id, nombre: p.nombre, locutora: RADIO_ALDEA.locutora, texto };
}

// ---------------------------------------------------------------- el diario de la aldea
// Cada cuántos días sale (según el ritmo de la aldea), a qué hora y cuántas ediciones se guardan.
export const DIARIO_ALDEA = { nombre: 'La Hoja de los Duendes', cada: { tranquilo: 4, normal: 3, animado: 2 }, hora: 8, tope: 6, hacen: 'La hacen la maestra y los chicos de la escuela; la imprime Benigno en la estafeta' };
// Los clasificados (trueque y servicios: nada se vende). `quien`: el que lo pone (si vive en la aldea).
export const CLASIFICADOS = [
  { quien: 'apicultor', texto: 'Cambio un frasco de miel por dos tablas de lenga. Preguntar en el colmenar.' },
  { quien: 'carpintero', texto: 'Se arreglan sillas cojas y mesas que bailan. Traer la silla y un mate.' },
  { quien: 'herrero', texto: 'Se afilan hachas y cuchillos los martes. El que trae leña, primero.' },
  { quien: 'modista', texto: 'Se hacen ruedos y se pegan botones. A cambio, lana o una docena de huevos.' },
  { quien: 'panadera', texto: 'Cambio pan casero por frutillas de la huerta, mientras dure la temporada.' },
  { quien: 'nelida', texto: 'Se recibe yerba para el mate del club de lectura. Se devuelve en charla.' },
  { quien: 'madre', texto: 'Gladys cambia frascos vacíos por dulce lleno. Sí, leyó bien.' },
  { quien: 'veterinaria', texto: 'Se revisan perros, gatos y ovejas los jueves. Sin turno: con paciencia.' },
  { quien: 'jefe', texto: 'Se busca quien barra la escarcha del andén a las siete. Se paga con mate y conversación.' },
  { quien: 'tejedora', texto: 'Se enseña a tejer en telar. Traer lana propia y ganas de equivocarse.' },
];
export const tocaDiario = (estado, dia, ritmo = 'normal') => objeto(estado) && diaValido(dia, 1) - entero(estado.ultimoDiario, 0) >= DIARIO_ALDEA.cada[ritmoSano(ritmo)];
// Arma la edición del día y la guarda. `datos`: { novedades, chismes, avisos, tiempo, concurso, club, presentes(k) }.
// Devuelve la edición: { n, dia, titulo, notas: [{ seccion, texto }] }.
export function sacarDiario(estado, dia, datos = {}) {
  if (!objeto(estado)) return null;
  const d = diaValido(dia, 1);
  const r = generador(hashTexto(`diario-${d}`));
  const L = (a) => (Array.isArray(a) ? a.filter((s) => typeof s === 'string' && s) : []);
  const nov = L(datos.novedades), chi = L(datos.chismes), avi = L(datos.avisos), tie = L(datos.tiempo);
  const n = Math.max(0, entero(estado.numero, 0)) + 1;
  const notas = [];
  const titulo = nov[0] || (typeof datos.concurso === 'string' && datos.concurso) || 'Todo tranquilo en la aldea';
  for (const x of nov.slice(1, 4)) notas.push({ seccion: 'La aldea', texto: x });
  if (typeof datos.concurso === 'string' && datos.concurso && datos.concurso !== titulo) notas.push({ seccion: 'Concursos', texto: datos.concurso });
  if (tie.length) notas.push({ seccion: 'El tiempo', texto: tie.slice(0, 2).join(' ') });
  if (chi.length) notas.push({ seccion: 'Sociales', texto: chi[Math.floor(r() * chi.length) % chi.length] });
  if (typeof datos.club === 'string' && datos.club) notas.push({ seccion: 'Club de lectura', texto: datos.club });
  for (const x of avi.slice(0, 3)) notas.push({ seccion: 'Agenda', texto: x });
  const presentes = typeof datos.presentes === 'function' ? datos.presentes : () => true;
  const clas = CLASIFICADOS.filter((c) => presentes(c.quien));
  if (clas.length) notas.push({ seccion: 'Clasificados de trueque', texto: clas[Math.floor(r() * clas.length) % clas.length].texto });
  const ed = { n, dia: d, titulo: textoSano(titulo, 200), notas: notas.map((x) => ({ seccion: x.seccion, texto: textoSano(x.texto, 400) })) };
  estado.diarios = [...(Array.isArray(estado.diarios) ? estado.diarios : []), ed].slice(-DIARIO_ALDEA.tope);
  estado.ultimoDiario = d;
  estado.numero = n;
  return ed;
}

// ---------------------------------------------------------------- las cartas de lejos
// Cada cuántos días puede llegar una (según el ritmo). `desde`: el primer día; `llega(p)`: si ya tiene sentido.
export const CARTAS_CADA = { tranquilo: 6, normal: 4, animado: 3 };
const conoceAldea = (p) => entero(p?.aldea?.descubierta, 0) > 0;
export const CARTAS_LEJANAS = [
  {
    id: 'l-mama', de: 'Tu mamá, Susana', tipo: 'familia', desde: 3, llega: (p) => conoceAldea(p),
    texto: [
      'Hijo: te escribo a la estafeta de ese pueblito, que el señor del telégrafo me dijo que ahí se reciben las cartas. Acá todo igual: el vecino sigue con la radio fuerte y el gato sigue durmiendo en tu cama.',
      'Comé. Abrigate. Y si te enamorás de alguien de allá, avisame antes que a tu hermano, que él no sabe guardar nada. Un beso grande, mamá.',
    ],
  },
  {
    id: 'a-puestero', de: 'Don Feliciano Painemil, que vivió en tu refugio', tipo: 'antiguo', desde: 5, llega: (p) => conoceAldea(p),
    texto: [
      'Estimado: me contaron en Jacobacci que alguien vive otra vez en el refugio del arroyo. Yo fui puestero ahí veinte inviernos, cuando el valle era de ovejas y de nadie más.',
      'Si la puerta todavía se traba con la helada, levántela un poquito antes de empujar: no hay que pelearla, hay que convencerla. Y a la tardecita, siéntese afuera a mirar cómo baja la niebla por el arroyo. Que el valle lo trate bien, como me trató a mí.',
    ],
  },
  {
    id: 'l-tia', de: 'Tu tía Nora, desde Rosario', tipo: 'familia', desde: 8, llega: (p) => conoceAldea(p),
    texto: [
      'Querido sobrino: tu mamá anda contando a todo el barrio que vivís en un bosque con duendes. Yo le dije que seguro es una forma de decir. ¿Es una forma de decir?',
      'Te mando la receta de los pastelitos de la abuela, por si allá hay harina: masa fina, dulce de membrillo y mucha paciencia con el aceite. Escribime, que las cartas largas son lo único que me gusta del correo.',
    ],
  },
  {
    id: 'a-maestra', de: 'Clotilde Cárdenas, la primera maestra de la aldea, desde Trelew', tipo: 'antiguo', desde: 10, llega: (p) => conoceAldea(p) && (p?.aldea?.pobladores || []).length >= 1,
    texto: [
      'Señor: me dicen que la aldea vuelve a tener gente nueva y que la escuela tiene otra vez chicos con guardapolvo. Yo di clase ahí cuando la escuela era una pieza con una salamandra y un pizarrón traído en el tren.',
      'Las composiciones de mis alumnos de aquel año las tengo todavía, atadas con un piolín. Hablan del viento, del tren y del duende de la plaza, y dicen más de la aldea que cualquier libro. Cuide a esos chicos nuevos, que ellos también la van a escribir.',
    ],
  },
  {
    id: 'l-abuelo', de: 'Tu abuelo Aníbal, desde Bahía Blanca', tipo: 'familia', desde: 12, llega: (p) => conoceAldea(p),
    texto: [
      'Querido nieto: con noventa y un años uno ya no viaja, pero lee. Tu madre me leyó tus cartas y me acordé de cuando trabajé en el ferrocarril, de joven, en la línea del sur.',
      'Si alguna vez ves pasar La Trochita echando humo, sacate el sombrero de mi parte. Ese tren llevó gente que nunca tuvo otro modo de ir a ninguna parte. Te abraza, tu abuelo.',
    ],
  },
  {
    id: 'a-farero', de: 'Don Ezequiel, el viejo farero del lago', tipo: 'antiguo', desde: 9, llega: (p) => conoceAldea(p) && !!p?.entradas?.bitacora,
    texto: [
      'Estimado: Josefina, la guardaparque, me contó que alguien leyó mi bitácora en la sala de la linterna. Me alegra. Hace años que nadie sube los cuarenta y dos peldaños más que para mirar.',
      'Una cosa que no anoté nunca: las noches de nevada la luz del faro se ve verde desde la orilla de los arrayanes. No sé por qué. Si un día la ve, sepa que no fue el único.',
    ],
  },
  {
    id: 'l-hermano', de: 'Tu hermano Facundo', tipo: 'familia', desde: 14, llega: (p) => conoceAldea(p) && entero(p?.vidaAldea?.familia?.cuenta, 0) >= 1,
    texto: [
      'Hermano: volví de visitarte y no paro de contarle a todo el mundo del valle. En el trabajo ya me dicen «el del bosque». No me molesta.',
      'Mamá dice que el año que viene va a quedarse una semana entera. Prepará la otra cama, comprá más yerba y escondé lo que no quieras que ordene. Abrazo.',
    ],
  },
  {
    id: 'a-jefe', de: 'Osvaldo Llancafil, hijo del primer jefe de estación', tipo: 'antiguo', desde: 16, llega: (p) => conoceAldea(p),
    texto: [
      'Señor: soy el hijo del que talló el duende de la plaza. Mi padre lo hizo del ciprés que tiró la nevada grande, en las noches de invierno, con una gubia y una vela.',
      'Decía que el duende cuida el andén, y que mientras alguien le pase la mano por la cabeza al bajar del tren, la aldea no se termina. Mi primo Ernesto me dice que usted lo hace. Gracias.',
    ],
  },
];
// Quién la manda, para decirlo a mitad de frase: «de tu mamá», «de don Feliciano», pero «de Clotilde» y «de Osvaldo»
export const remitente = (c) => (typeof c?.de === 'string' ? (/^(Tu|La|El|Un|Una|Don|Doña)\s/.test(c.de) ? `${c.de.charAt(0).toLowerCase()}${c.de.slice(1)}` : c.de) : '');
export const CARTA_LEJANA = Object.fromEntries(CARTAS_LEJANAS.map((c) => [c.id, c]));
// ¿Llega una hoy? (con el tren, a la estafeta). Devuelve la carta (y la anota) o null. Una cada tantos días.
export function repartirCarta(estado, p, dia, ritmo = 'normal') {
  if (!objeto(estado)) return null;
  const d = diaValido(dia, 1);
  if (d - entero(estado.ultimaCarta, 0) < CARTAS_CADA[ritmoSano(ritmo)]) return null;
  if (!objeto(estado.cartas)) estado.cartas = {};
  for (const c of CARTAS_LEJANAS) {
    if (Object.hasOwn(estado.cartas, c.id) || d < c.desde || !c.llega(p || {})) continue;
    estado.cartas[c.id] = { dia: d, leida: 0 };
    estado.ultimaCarta = d;
    return c;
  }
  return null;
}
export const cartasPorLeer = (estado) => CARTAS_LEJANAS.filter((c) => objeto(estado?.cartas) && Object.hasOwn(estado.cartas, c.id) && !estado.cartas[c.id].leida);
export const cartasLeidas = (estado) => CARTAS_LEJANAS.filter((c) => objeto(estado?.cartas) && Object.hasOwn(estado.cartas, c.id) && estado.cartas[c.id].leida);
export function leerCartaLejana(estado, id, dia) {
  const x = objeto(estado?.cartas) && Object.hasOwn(estado.cartas, id) ? estado.cartas[id] : null;
  if (!x || x.leida) return false;
  x.leida = diaValido(dia, 1);
  return true;
}
// Cómo te la da el que la tiene (Benigno en la estafeta, Ercilia en el almacén): primero él, después la carta.
export function partesDeCartaLejana(c, quien = 'telegrafista') {
  const de = remitente(c);
  const intro = quien === 'telegrafista' ? `Llegó carta para vos en la saca del tren. Es de ${de}. Sellada y todo: tomá.` : `Me la dejaron para vos en el almacén. Es de ${de}. Leela tranquilo.`;
  return [intro, ...c.texto];
}

// ---------------------------------------------------------------- el estado (progreso.noticias)
// { diarios: [ediciones], numero, ultimoDiario, cartas: { id: { dia, leida } }, ultimaCarta, avisado (el último día en
// que se avisó lo de mañana del calendario), club: [días], estrellas: [días], oidos: { programa: día } }
export const TOPE_ASISTENCIAS = 60;
export function noticiasNuevas() { return { diarios: [], numero: 0, ultimoDiario: 0, cartas: {}, ultimaCarta: 0, avisado: 0, club: [], estrellas: [], oidos: {} }; }
export function sanearNoticias(x0, hoy = null) {
  const tope = Number.isFinite(Number(hoy)) ? diaValido(hoy, 1) : TOPE_DIA;
  const x = objeto(x0) ? x0 : {};
  const base = noticiasNuevas();
  for (const e of Array.isArray(x.diarios) ? x.diarios : []) {
    if (!objeto(e) || typeof e.titulo !== 'string') continue;
    const d = diaValido(e.dia, 1);
    if (d > tope) continue;
    const notas = (Array.isArray(e.notas) ? e.notas : []).filter((q) => objeto(q) && typeof q.texto === 'string').slice(0, 12).map((q) => ({ seccion: textoSano(q.seccion, 40), texto: textoSano(q.texto, 400) }));
    base.diarios.push({ n: Math.max(1, entero(e.n, 1)), dia: d, titulo: textoSano(e.titulo, 200), notas });
  }
  base.diarios = base.diarios.slice(-DIARIO_ALDEA.tope);
  base.numero = Math.max(base.diarios.reduce((m, e) => Math.max(m, e.n), 0), diaOCero(x.numero));
  base.ultimoDiario = diaOCero(x.ultimoDiario, tope);
  for (const [id, c] of Object.entries(objeto(x.cartas) ? x.cartas : {})) {
    if (!Object.hasOwn(CARTA_LEJANA, id) || !objeto(c)) continue;
    const d = diaValido(c.dia, 1);
    if (d > tope) continue;
    const leida = diaOCero(c.leida, tope);
    base.cartas[id] = { dia: d, leida: leida && leida >= d ? leida : 0 };
  }
  base.ultimaCarta = diaOCero(x.ultimaCarta, tope);
  base.avisado = diaOCero(x.avisado, tope);
  const dias = (v) => [...new Set((Array.isArray(v) ? v : []).map((d) => entero(d, 0)).filter((d) => d >= 1 && d <= tope))].sort((a, b) => a - b).slice(-TOPE_ASISTENCIAS);
  base.club = dias(x.club);
  base.estrellas = dias(x.estrellas);
  for (const [k, d] of Object.entries(objeto(x.oidos) ? x.oidos : {})) if (Object.hasOwn(PROGRAMA_RADIO, k)) base.oidos[k] = diaOCero(d, tope);
  return base;
}
