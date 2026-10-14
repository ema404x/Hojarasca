// 4.1 (borrador, F1): el catálogo del creador de Bruno Castellanos. Datos puros (sin three ni DOM): se prueban en Node.
//
// Son las DIEZ personalizaciones del plan (PLAN_CREADOR_BRUNO.md): cinco de aspecto y cinco de carácter. Los textos que ve el jugador
// (frases, pros y contras escritos) NO están acá: los escribe quien los escribe y entran en la F4. Acá van los ids, los nombres y qué hace cada opción.
//
// Efectos: cuatro sistemas (abrigo, afecto, pesca y cuaderno), medidos en PASOS (1 paso ≈ 5 %). El abrigo se mide en puntos de abrigo del juego
// (1 punto = 2 pasos). Un efecto es { sistema, pasos }; `null` quiere decir «de sabor»: se ve en la ficha y en los diálogos pero no cambia ningún número.
// Los efectos sólo valen en el Relax.

export const SISTEMAS = ['abrigo', 'afecto', 'pesca', 'cuaderno'];
export const PASO_PORCENTAJE = 5;
// El tope de lo que suman todos los rasgos sobre un mismo sistema (en pasos): ±4 pasos (±20 %). El abrigo, ±1 punto (2 pasos): excepción a revisar en la F3.
export const TOPES = { abrigo: 2, afecto: 4, pesca: 4, cuaderno: 4 };

const e = (sistema, pasos) => ({ sistema, pasos });

// ---------------------------------------------------------------- aspecto
export const PIELES = [
  { id: 'clara', nombre: 'Clara', color: '#f0d0b4' }, { id: 'rosada', nombre: 'Rosada', color: '#e2b595' },
  { id: 'trigena', nombre: 'Trigueña', color: '#c49a70' }, { id: 'morena', nombre: 'Morena', color: '#9c6b47' },
  { id: 'oscura', nombre: 'Oscura', color: '#6e4a31' }, { id: 'muyoscura', nombre: 'Muy oscura', color: '#4a3122' },
];
// Las caras base: medidas de `cara` del motor (gente-ropa.js). Cada una es un molde de cráneo en memoria: son pocas a propósito.
export const CARAS = [
  { id: 'suave', nombre: 'Suave', cara: { ancho: 1.0, largo: 1.0, nariz: 0.95, ojos: 1.04, pomulos: 1.05, mand: 0.2, sonrisa: 0.5 } },
  { id: 'angulosa', nombre: 'Angulosa', cara: { ancho: 0.95, largo: 1.06, nariz: 1.15, ojos: 0.98, pomulos: 1.3, mand: 0.4, arco: 1.15, sonrisa: 0.35 } },
  { id: 'redonda', nombre: 'Redonda', cara: { ancho: 1.08, largo: 0.95, nariz: 0.9, ojos: 1.1, pomulos: 1.15, mand: 0.15, sonrisa: 0.65 } },
  { id: 'fuerte', nombre: 'Fuerte', cara: { ancho: 1.05, largo: 1.03, nariz: 1.3, ojos: 0.9, pomulos: 1.0, mand: 0.42, menton: 1.1, sonrisa: 0.25 } },
];
export const OJOS = [
  { id: 'marrones', nombre: 'Marrones', color: '#5c3b22' }, { id: 'miel', nombre: 'Miel', color: '#7a5a2c' },
  { id: 'verdes', nombre: 'Verdes', color: '#4e6a3c' }, { id: 'celestes', nombre: 'Celestes', color: '#5c7fa6' },
  { id: 'grises', nombre: 'Grises', color: '#6a7480' },
];
export const PELOS = [
  { id: 'negro', nombre: 'Negro', color: '#1f1a17' }, { id: 'castano', nombre: 'Castaño', color: '#3a2a1e' },
  { id: 'claro', nombre: 'Castaño claro', color: '#6b4e33' }, { id: 'rubio', nombre: 'Rubio', color: '#d6bd68' },
  { id: 'colorado', nombre: 'Colorado', color: '#8e4524' }, { id: 'canoso', nombre: 'Canoso', color: '#b9b4ab' },
];
// Los peinados son banderas de `R` del motor (ver gente-cuerpo.js).
export const PEINADOS = [
  { id: 'corto', nombre: 'Corto', R: {} },
  { id: 'flequillo', nombre: 'Corto con flequillo', R: { flequillo: true } },
  { id: 'coleta', nombre: 'Coleta', R: { coleta: true } },
  { id: 'melena', nombre: 'Melena suelta', R: { melena: true } },
  { id: 'rodete', nombre: 'Rodete', R: { rodete: true } },
];
export const BARBAS = [{ id: 'ninguna', nombre: 'Afeitado' }, { id: 'bigote', nombre: 'Bigote' }, { id: 'barba', nombre: 'Barba' }];
export const CONTEXTURAS = [
  { id: 'delgada', nombre: 'Delgada', ancho: 0.9, fondo: 0.92 },
  { id: 'media', nombre: 'Mediana', ancho: 1, fondo: 1 },
  { id: 'robusta', nombre: 'Robusta', ancho: 1.12, fondo: 1.1, panza: 0.05 },
];
export const ESTATURAS = [{ id: 'baja', nombre: 'Baja', alto: 0.95 }, { id: 'media', nombre: 'Media', alto: 1 }, { id: 'alta', nombre: 'Alta', alto: 1.05 }];
// Los colores de la lana, con los mismos ids que «Tu personaje» (personal-personaje.js), así lo ya elegido pasa tal cual.
// `pide`: la anotación del cuaderno que lo desbloquea. Al crear a Bruno sólo están los que no piden nada; el resto se consigue jugando (guardarropa).
export const LANAS = [
  { id: 'crudo', nombre: 'Lana cruda', color: '#e2d6bd' }, { id: 'gris', nombre: 'Gris de oveja', color: '#8d8a82' },
  { id: 'marron', nombre: 'Marrón', color: '#6b4a3a' }, { id: 'negro', nombre: 'Negro', color: '#2e2a26' },
  { id: 'ocre', nombre: 'Ocre', color: '#b0773a' }, { id: 'musgo', nombre: 'Verde musgo', color: '#5f6b3e' },
  { id: 'notro', nombre: 'Rojo notro', color: '#b8432f', pide: 'notro' },
  { id: 'calafate', nombre: 'Violeta calafate', color: '#6b4a78', pide: 'calafate' },
  { id: 'maqui', nombre: 'Azul maqui', color: '#3b3f63', pide: 'maqui' },
];
export const ACCESORIOS = [
  { id: 'ninguno', nombre: 'Nada' }, { id: 'gorro', nombre: 'Gorro de lana' },
  { id: 'bufanda', nombre: 'Bufanda' }, { id: 'anteojos', nombre: 'Anteojos' },
];

// ---------------------------------------------------------------- carácter
// `pro` y `contra`: un efecto o null (sabor). En personalidad, oficio y hobby los dos pesan lo mismo y caen en sistemas distintos.
export const PERSONALIDADES = [
  { id: 'tranquilo', nombre: 'Tranquilo', pro: e('pesca', 2), contra: e('afecto', -2) },
  { id: 'curioso', nombre: 'Curioso', pro: e('cuaderno', 2), contra: e('abrigo', -2) },
  { id: 'sociable', nombre: 'Sociable', pro: e('afecto', 2), contra: e('cuaderno', -2) },
  { id: 'metodico', nombre: 'Metódico', pro: e('abrigo', 2), contra: e('pesca', -2) },
  { id: 'reservado', nombre: 'Reservado', pro: e('abrigo', 2), contra: e('afecto', -2) },
];
export const OFICIOS = [
  { id: 'programador', nombre: 'Programador', pro: e('cuaderno', 2), contra: e('abrigo', -2) },
  { id: 'cocinero', nombre: 'Cocinero', pro: e('afecto', 2), contra: e('cuaderno', -2) },
  { id: 'contador', nombre: 'Contador', pro: null, contra: null },
  { id: 'tecnico-sonido', nombre: 'Técnico de sonido', pro: e('cuaderno', 2), contra: e('afecto', -2) },
  { id: 'mensajero', nombre: 'Mensajero en bicicleta', pro: e('abrigo', 2), contra: e('pesca', -2) },
  { id: 'docente', nombre: 'Docente de plástica', pro: e('afecto', 2), contra: e('pesca', -2) },
];
// Gustos (se eligen dos): el pro es la afinidad con los vecinos que lo comparten (en pasos de afecto, sólo con ellos); el contra, sabor o un efecto.
// El mate lo comparte casi todo el pueblo (31 de 36 vecinos): vale la mitad.
export const GUSTOS = [
  { id: 'mate', nombre: 'Mate', afinidad: 0.5, contra: null },
  { id: 'folklore', nombre: 'Folklore', afinidad: 1, contra: null },
  { id: 'lluvia', nombre: 'Lluvia', afinidad: 1, contra: e('abrigo', -2) },
  { id: 'trenes', nombre: 'Trenes', afinidad: 1, contra: null },
  { id: 'asado', nombre: 'Asado', afinidad: 1, contra: null },
  { id: 'libros', nombre: 'Libros', afinidad: 1, contra: null },
];
export const HOBBIES = [
  { id: 'fotografia', nombre: 'Fotografía', pro: null, contra: null },
  { id: 'pesca', nombre: 'Pesca', pro: e('pesca', 2), contra: e('cuaderno', -2) },
  { id: 'guitarra', nombre: 'Guitarra', pro: null, contra: null },
  { id: 'carpinteria', nombre: 'Carpintería', pro: null, contra: null },
  { id: 'aves', nombre: 'Observar aves', pro: e('cuaderno', 2), contra: e('abrigo', -2) },
];
// Virtud: sólo pro. Defecto: sólo contra. Se elige una de cada una, y todas llevan efecto: así ninguna combinación regala un pro sin su contra.
export const VIRTUDES = [
  { id: 'resistente', nombre: 'Resistente', pro: e('abrigo', 2) },
  { id: 'paciente', nombre: 'Paciente', pro: e('pesca', 2) },
  { id: 'simpatico', nombre: 'Simpático', pro: e('afecto', 2) },
  { id: 'madrugador', nombre: 'Madrugador', pro: e('pesca', 2) },
  { id: 'ahorrativo', nombre: 'Ahorrativo', pro: e('abrigo', 2) },
];
export const DEFECTOS = [
  { id: 'friolero', nombre: 'Friolero', contra: e('abrigo', -2) },
  { id: 'impaciente', nombre: 'Impaciente', contra: e('pesca', -2) },
  { id: 'grunon', nombre: 'Gruñón', contra: e('afecto', -2) },
  { id: 'distraido', nombre: 'Distraído', contra: e('cuaderno', -2) },
  { id: 'dormilon', nombre: 'Dormilón', contra: e('cuaderno', -2) },
];

// Las diez personalizaciones, en el orden de las pantallas. `campos`: las elecciones de cada una (el campo del genoma y su lista).
// `cuantos`: cuántas opciones se eligen en el campo (los gustos son dos).
export const PERSONALIZACIONES = [
  { id: 'rostro', nombre: 'Rostro', pantalla: 'aspecto', campos: [{ campo: 'cara', lista: CARAS }, { campo: 'ojos', lista: OJOS }] },
  { id: 'piel', nombre: 'Piel', pantalla: 'aspecto', campos: [{ campo: 'piel', lista: PIELES }] },
  { id: 'pelo', nombre: 'Pelo', pantalla: 'aspecto', campos: [{ campo: 'pelo', lista: PELOS }, { campo: 'peinado', lista: PEINADOS }, { campo: 'barba', lista: BARBAS }] },
  { id: 'fisico', nombre: 'Físico', pantalla: 'aspecto', campos: [{ campo: 'contextura', lista: CONTEXTURAS }, { campo: 'estatura', lista: ESTATURAS }] },
  { id: 'ropa', nombre: 'Ropa', pantalla: 'aspecto', campos: [{ campo: 'campera', lista: LANAS }, { campo: 'accesorio', lista: ACCESORIOS }] },
  { id: 'personalidad', nombre: 'Personalidad', pantalla: 'historia', campos: [{ campo: 'personalidad', lista: PERSONALIDADES }] },
  { id: 'oficio', nombre: 'Oficio de antes', pantalla: 'historia', campos: [{ campo: 'oficio', lista: OFICIOS }] },
  { id: 'gustos', nombre: 'Gustos', pantalla: 'historia', campos: [{ campo: 'gustos', lista: GUSTOS, cuantos: 2 }] },
  { id: 'hobby', nombre: 'Hobby', pantalla: 'historia', campos: [{ campo: 'hobby', lista: HOBBIES }] },
  { id: 'virtud-defecto', nombre: 'Virtud y defecto', pantalla: 'historia', campos: [{ campo: 'virtud', lista: VIRTUDES }, { campo: 'defecto', lista: DEFECTOS }] },
];

// Qué le gusta a cada vecino (a corregir: ver GUSTOS_VECINOS_BRUNO.md; sale de lo que dicen sus voces y de su oficio). Las claves son las de la aldea.
export const GUSTOS_DE_VECINOS = {
  jefe: ['trenes', 'asado'], nelida: ['trenes', 'libros'], abuela: ['mate', 'lluvia'], padre: ['asado', 'folklore'], madre: ['libros', 'lluvia'],
  nene: ['trenes', 'lluvia'], nena: ['libros', 'lluvia'], galesa: ['mate', 'libros'], ercilia: ['trenes', 'folklore'], carpintero: ['asado', 'folklore'],
  panadera: ['mate', 'lluvia'], herrero: ['asado', 'trenes'], pescador: ['mate', 'lluvia'], maestra: ['libros', 'mate'], enfermera: ['libros', 'lluvia'],
  telegrafista: ['trenes', 'lluvia'], tejedora: ['mate', 'folklore'], apicultor: ['lluvia', 'libros'], guardaparque: ['lluvia', 'mate'], musico: ['folklore', 'mate'],
  veterinaria: ['asado', 'mate'], fotografa: ['lluvia', 'trenes'], andinista: ['mate', 'asado'], herbolaria: ['lluvia', 'libros'], pintora: ['lluvia', 'libros'],
  ceramista: ['mate', 'asado'], botera: ['lluvia', 'mate'], astronoma: ['libros', 'lluvia'], modista: ['folklore', 'libros'], martin: ['trenes', 'asado'],
  gerente: ['libros', 'mate'], moza: ['folklore', 'mate'], bailarina: ['folklore'], ramon: ['mate', 'lluvia'], nicanor: ['mate', 'lluvia'],
  ema: ['lluvia', 'mate'], guarda: ['trenes', 'mate'],
};
