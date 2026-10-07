// 3.7.0: la ropa y el aspecto de cada persona del juego, por clave (la misma clave con que la arma
// gente.js: 'ramon', 'aldea-jefe', 'poblador-panadera', ...). Módulo de datos puro (sin three ni el
// DOM): lo usan gente-cuerpo.js para armar la figura y el núcleo para saber quién es quién.
//
// Cada persona tiene:
//   · edad, mujer, chico;
//   · cuerpo: la contextura (ancho y fondo del torso, panza, brazos, piernas, alto, encorvada);
//   · cara: la forma (ancho, largo, nariz, ojos, boca, mandíbula, mentón, pómulos, el arco de las
//     cejas, los ojos rasgados, los labios), el gesto en
//     reposo (sonrisa, párpado), las marcas (pecas, arrugas 'risa' o 'mayor', cicatriz, ojeras) y
//     los ojos (iris);
//   · colores: piel, pelo, barba y la ropa de diario (ropa = camisa o blusa, abrigo = chaleco,
//     campera o pulóver, gorro, bufanda, poncho), con la paleta de tierra: ocres, verde oliva,
//     marrones, rojos y azules apagados, crudo;
//   · R: las prendas (pollera, delantal, chaleco, bombacha, botas...) y el peinado (corto, rodete,
//     trenza, dosTrenzas, coleta, melena, canas), y las marcas del oficio (barro, brea, pintura);
//   · guardas: dónde van las guardas patagónicas ([tipo, ancho en metros, desde]); los tipos son los
//     del atlas (gente-atlas.js): 1 ribete tejido, 2 escalonado de telar, 3 lukutuwe, 4 trarüwe,
//     5 bordado de amancay, 6 bordado de lupino, 7 cuero repujado, 8 salpicado de pintura, 9 barro,
//     10 ribete del uniforme, 11 greca de telar, 12 bordado de rosa mosqueta, 13 estrellas bordadas,
//     14 brea;
//   · poses: las de quietud que hace cuando está parada sin nada que hacer;
//   · abrigo: lo que cambia en invierno (poncho, gorro de lana y bufanda; ver aspectoGente).
// Las nueve pobladoras nuevas de la 3.7.0 ya vienen acá, listas para cuando el núcleo las dé de alta.

// los colores de la tierra (para los que no tienen ropa propia: ver aTierra en gente-cuerpo.js)
export const PALETA_TIERRA = {
  crudo: '#e2d6bd', lino: '#d8c8a4', arena: '#c8b088', ocre: '#b0803e', mostaza: '#b8963e',
  oliva: '#66673a', musgo: '#5f6b3e', verdeOscuro: '#3e4a2e', pardo: '#6b4a3a', marron: '#4e3420',
  cuero: '#7a5434', ladrillo: '#9a4a34', granate: '#7a2e2e', rojoApagado: '#9a3c2a',
  azulNoche: '#2c3446', indigo: '#3b3f63', pizarra: '#4a5560', grisOveja: '#8d8a82', negro: '#2a2420',
};

// La lana del invierno de cada uno (si no dice otra cosa): poncho de oveja, gorro y bufanda
const ABRIGO_BASE = { poncho: '#7a6a58', gorro: '#a8562e', bufanda: '#c8a464' };

export const ASPECTO = {
  // ------------------------------------------------------------ los del valle
  // Don Ramón, el puestero: cuarenta inviernos arriba. Poncho gris de oveja con la guarda de telar,
  // boina, bombacha con faja, botas de potro y el mate siempre en la mano.
  ramon: {
    edad: 68, mujer: false,
    cuerpo: { ancho: 0.97, fondo: 0.98, alto: 0.98, encorvada: 0.05 },
    cara: { ancho: 0.98, largo: 1.04, nariz: 1.25, ojos: 0.92, mand: 0.36, pomulos: 1.2, sonrisa: 0.3, parpado: 0.12, arrugas: 'mayor', iris: '#5c3b22' },
    colores: { piel: '#b98d66', pelo: '#b9b4ab', barba: '#c8c4bc', ropa: '#c9b48c', abrigo: '#6b5a48', gorro: 'boina', gorroColor: '#2e2a26', poncho: '#7d7466' },
    R: { bombacha: true, botas: 'altas', botaCol: '#4a3426', pantalon: '#6d6252', faja: '#8a3c2a', chaleco: true, canas: 1 },
    guardas: { poncho: [2, 0.07], faja: [4, 0], cuello: [1, 0, 'todo'] },
    poses: ['atras', 'barba', 'cruzados'],
    abrigo: { colores: { bufanda: '#8a3c2a', gorro: 'boina' } },
  },
  // Nicanor, el pescador: campera encerada larga, gorro con visera, barba gris, botas de goma
  nicanor: {
    edad: 63, mujer: false,
    cuerpo: { ancho: 1.04, fondo: 1.06, panza: 0.06, alto: 1.0 },
    cara: { ancho: 1.05, largo: 0.98, nariz: 1.1, ojos: 0.9, mand: 0.3, menton: 0.9, sonrisa: 0.4, arrugas: 'mayor', iris: '#4c6c8a' },
    colores: { piel: '#c0916a', pelo: '#8a8378', barba: '#9a948a', ropa: '#7a6a4e', abrigo: '#4a5236', gorro: 'gorro', gorroColor: '#3a4a52' },
    R: { botas: 'goma', campera: 'larga', abierta: true, pantalon: '#3d4652', canas: 0.6 },
    guardas: { cuello: [11, 0, 'todo'] },
    poses: ['atras', 'cruzados', 'barba'],
    abrigo: { colores: { bufanda: '#5a6a72', gorro: 'gorroPunto', gorroColor: '#3a4a52' } },
  },
  // Josefina (la clave sigue siendo 'ema'), guardaparque: camisa caqui con bolsillos, sombrero,
  // pañuelo verde al cuello, la trenza y las botas de caminar
  ema: {
    edad: 34, mujer: true,
    cuerpo: { ancho: 0.97, fondo: 0.96, alto: 1.01 },
    cara: { ancho: 0.98, largo: 1.03, nariz: 1.05, ojos: 1.0, mand: 0.28, pomulos: 1.1, sonrisa: 0.3, iris: '#6a5a36' },
    colores: { piel: '#c99a72', pelo: '#3a2a1e', ropa: '#9a8a5c', abrigo: '#5a6236', gorro: 'sombrero' },
    R: { mujer: true, trenza: true, bolsillos: true, botas: 'trekking', pantalon: '#5c5a44', panuelo: '#4e6a34', arremangado: true },
    guardas: { puno: [1, 0, 'todo'] },
    poses: ['cintura', 'atras', 'cruzados'],
    abrigo: { colores: { poncho: '#5a6236', bufanda: '#4e6a34', gorro: 'sombrero' } },
  },
  // Ercilia, la del almacén: pollera, delantal de lienzo, chaleco tejido, rodete con canas
  ercilia: {
    edad: 61, mujer: true,
    cuerpo: { ancho: 1.05, fondo: 1.06, panza: 0.05, alto: 0.95 },
    cara: { ancho: 1.04, largo: 0.97, nariz: 1.1, ojos: 0.95, sonrisa: 0.45, arrugas: 'mayor', iris: '#5c3b22' },
    colores: { piel: '#d0a582', pelo: '#6a5a4c', ropa: '#d8c8a4', abrigo: '#7a5040', gorro: null, bufanda: null, anteojos: true },
    R: { mujer: true, pollera: true, colPollera: '#5a4232', delantal: '#cfc0a0', telaDelantal: 'lienzo', rodete: true, chaleco: true, telaChaleco: 'punto', canas: 0.55, arremangado: true },
    guardas: { pollera: [3, 0.05], delantal: [12, 0.035], chaleco: [1, 0.025, 'arriba'] },
    poses: ['delantal', 'cintura', 'cruzados'],
    abrigo: { colores: { poncho: '#6b4a3a', bufanda: '#a88a63' } },
  },
  // Elsa, la guarda del tren: el uniforme azul ferroviario con los botones de bronce y la gorra
  guarda: {
    edad: 46, mujer: true,
    cuerpo: { ancho: 1.0, fondo: 1.0, alto: 1.0 },
    cara: { ancho: 1.0, largo: 1.02, nariz: 1.0, ojos: 0.97, boca: 0.95, sonrisa: 0.3, arrugas: 'risa', iris: '#4c6c8a' },
    colores: { piel: '#c99c76', pelo: '#2e2622', ropa: '#d8d0bc', abrigo: '#2c3446', gorro: 'gorro', gorroColor: '#2c3446' },
    R: { mujer: true, rodete: true, campera: 'larga', botones: '#c9a64a', pantalon: '#262c3a' },
    guardas: { cuello: [10, 0, 'todo'], puno: [10, 0, 'todo'] },
    poses: ['atras', 'cruzados', 'gorro'],
    abrigo: { colores: { bufanda: '#7a2e2e', gorro: 'gorro' } },
  },

  // ------------------------------------------------------------ los vecinos de la aldea
  // Ernesto Llancafil, el jefe de estación: uniforme, gorra, barba gris prolija
  'aldea-jefe': {
    edad: 58, mujer: false,
    cuerpo: { ancho: 1.03, fondo: 1.05, panza: 0.08, alto: 1.01 },
    cara: { ancho: 1.02, largo: 1.05, nariz: 1.2, ojos: 0.9, mand: 0.34, sonrisa: 0.35, arrugas: 'mayor', iris: '#4a2e1c' },
    colores: { piel: '#b88a62', pelo: '#6a6058', barba: '#8a8378', ropa: '#d8d0bc', abrigo: '#2a3240', gorro: 'gorro', gorroColor: '#2a3240' },
    R: { campera: 'larga', botones: '#c9a64a', pantalon: '#2a3240', canas: 0.7 },
    guardas: { cuello: [10, 0, 'todo'], puno: [10, 0, 'todo'] },
    poses: ['atras', 'cintura', 'barba'],
    abrigo: { colores: { bufanda: '#7a2e2e', gorro: 'gorro' } },
  },
  // Nélida Ojeda, la ayudante del almacén: pulóver bordó, pollera, delantal, el mate
  'aldea-nelida': {
    edad: 41, mujer: true,
    cuerpo: { ancho: 1.04, fondo: 1.04, panza: 0.04, alto: 0.97 },
    cara: { ancho: 1.04, largo: 0.98, nariz: 0.95, ojos: 1.02, boca: 1.05, sonrisa: 0.5, arrugas: 'risa', iris: '#6b4526' },
    colores: { piel: '#d0a27e', pelo: '#3a2a22', ropa: '#9a6b5a', abrigo: '#6b4538', gorro: null, bufanda: '#d9c7a8' },
    R: { mujer: true, pollera: true, colPollera: '#4e3a2e', delantal: '#d9c7a8', abierta: true, rodete: true },
    guardas: { pollera: [1, 0.03], delantal: [6, 0.04], puno: [1, 0, 'todo'] },
    poses: ['delantal', 'cintura', 'cruzados'],
    abrigo: { colores: { poncho: '#6b4538', gorro: 'gorroPunto', gorroColor: '#c8a464', bufanda: '#d9c7a8' } },
  },
  // Herminia Huenchul, la abuela (89): manta sobre los hombros, dos trenzas blancas, pollera larga
  'aldea-abuela': {
    edad: 89, mujer: true,
    cuerpo: { ancho: 0.95, fondo: 1.0, panza: 0.05, alto: 0.92, encorvada: 0.16 },
    cara: { ancho: 0.98, largo: 0.97, nariz: 1.15, ojos: 0.88, abre: 0.9, mand: 0.26, sonrisa: 0.55, parpado: 0.18, arrugas: 'mayor', iris: '#4a2e1c' },
    colores: { piel: '#b88a66', pelo: '#e0dcd4', ropa: '#5e4a52', abrigo: '#3f3138', gorro: null, bufanda: null, poncho: '#6a3a3a' },
    R: { mujer: true, pollera: true, chamal: true, colPollera: '#2e2830', dosTrenzas: true, trenza: true, delantal: '#7a6a5a' },
    guardas: { poncho: [11, 0.08], pollera: [3, 0.05], delantal: [1, 0.025] },
    poses: ['atras', 'delantal'],
    abrigo: { colores: { poncho: '#5a2e30', bufanda: '#b89a7a', gorro: 'gorroPunto', gorroColor: '#8a7a6a' } },
  },
  // Mario Jones, hachero y peón de obra: boina, barba castaña, camisa arremangada, chaleco de
  // cuero, bombacha con faja; ancho de hombros
  'aldea-padre': {
    edad: 38, mujer: false,
    cuerpo: { ancho: 1.08, fondo: 1.06, brazos: 1.1, piernas: 1.04, alto: 1.03 },
    cara: { ancho: 1.04, largo: 1.03, nariz: 1.15, ojos: 0.95, mand: 0.38, menton: 1.15, sonrisa: 0.25, iris: '#4c6c8a' },
    colores: { piel: '#d4a882', pelo: '#6b4a32', barba: '#6b4a32', ropa: '#b06a4a', abrigo: '#5a3c26', gorro: 'boina', gorroColor: '#3a3430' },
    R: { bombacha: true, chaleco: true, telaChaleco: 'cuero', faja: '#4e5a3c', botas: 'altas', botaCol: '#4a3426', pantalon: '#5a5040', arremangado: true },
    guardas: { chaleco: [7, 0.03], faja: [11, 0] },
    poses: ['cintura', 'cruzados', 'barba'],
    abrigo: { colores: { poncho: '#5a5040', gorro: 'boina', bufanda: '#9a3c2a' } },
  },
  // Gladys Calfuqueo, la de los dulces: pulóver ciruela, pollera con lukutuwe, delantal con rosas
  // mosqueta bordadas, una trenza
  'aldea-madre': {
    edad: 36, mujer: true,
    cuerpo: { ancho: 1.0, fondo: 1.02, alto: 0.98 },
    cara: { ancho: 1.02, largo: 1.0, nariz: 1.0, ojos: 1.02, boca: 1.04, pomulos: 1.15, sonrisa: 0.45, iris: '#5c3b22' },
    colores: { piel: '#b98a62', pelo: '#2a2220', ropa: '#7d5a6e', abrigo: '#5a4058', gorro: null, bufanda: '#c8b48e' },
    R: { mujer: true, pollera: true, colPollera: '#4a3a46', trenza: true, abierta: true, delantal: '#e2d6bd' },
    guardas: { pollera: [3, 0.06], delantal: [12, 0.05], puno: [12, 0, 'todo'] },
    poses: ['delantal', 'cintura', 'atras'],
    abrigo: { colores: { poncho: '#5a4058', gorro: 'gorroPunto', gorroColor: '#9a3c2a', bufanda: '#c8b48e' } },
  },
  // Nahuel (6): gorro de lana, campera azul, botas de goma
  'aldea-nene': {
    edad: 6, mujer: false, chico: true,
    cuerpo: { ancho: 0.86, fondo: 0.9, brazos: 0.85, piernas: 0.86 },
    cara: { ancho: 1.0, largo: 0.98, nariz: 0.95, ojos: 1.04, sonrisa: 0.55, pecas: false, iris: '#5c3b22' },
    colores: { piel: '#c99a72', pelo: '#2a2220', ropa: '#c8b088', abrigo: '#3e5a72', gorro: 'gorroPunto', gorroColor: '#b8963e', bufanda: null },
    R: { botas: 'goma', botaCol: '#3a4a3a', pantalon: '#4a4236', bolsillos: true, flequillo: true },
    guardas: { puno: [1, 0, 'todo'] },
    poses: ['atras', 'cruzados'],
    abrigo: { colores: { poncho: false, bufanda: '#b8963e' } },
  },
  // Lucía (9): gorro de punto, chaleco tejido, pollera colorada, pecas y dos trenzas con moño
  'aldea-nena': {
    edad: 9, mujer: true, chico: true,
    cuerpo: { ancho: 0.84, fondo: 0.86, brazos: 0.84, piernas: 0.84 },
    cara: { ancho: 1.0, largo: 1.0, nariz: 1.0, ojos: 1.0, sonrisa: 0.45, pecas: true, iris: '#6a5a36' },
    colores: { piel: '#c49470', pelo: '#4a2e1e', ropa: '#d4c29c', abrigo: '#6c6e3e', gorro: 'gorroPunto', gorroColor: '#a8562e', bufanda: '#c8a464', aros: 'chicos' },
    R: { mujer: true, pollera: true, colPollera: '#94443a', trenza: true, chaleco: true, telaChaleco: 'punto', botas: 'altas', botaCol: '#5c3e2a' },
    guardas: { pollera: [3, 0.06], chaleco: [2, 0.035] },
    poses: ['atras', 'cruzados', 'gorro'],
    abrigo: { colores: { poncho: false, bufanda: '#c8a464' } },
  },
  // Ceinwen Evans, la galesa de la casa de té: blusa con cuello, chaleco gris azulado, pollera,
  // delantal blanco con puntilla, rodete rubio ceniza
  'aldea-galesa': {
    edad: 52, mujer: true,
    cuerpo: { ancho: 0.95, fondo: 0.96, alto: 1.02 },
    cara: { ancho: 0.96, largo: 1.05, nariz: 1.05, ojos: 1.0, boca: 0.92, mand: 0.3, sonrisa: 0.4, arrugas: 'risa', iris: '#4c6c8a' },
    colores: { piel: '#e2b898', pelo: '#c8b89a', ropa: '#e8e0d0', abrigo: '#4e5a68', gorro: null, bufanda: null },
    R: { mujer: true, pollera: true, colPollera: '#3e4a5a', delantal: '#f0ece0', chaleco: true, rodete: true, canas: 0.35 },
    guardas: { delantal: [1, 0.02], pollera: [10, 0.03], cuello: [10, 0, 'todo'] },
    poses: ['delantal', 'atras', 'cruzados'],
    abrigo: { colores: { poncho: '#4e5a68', gorro: 'gorroPunto', gorroColor: '#e2d6bd', bufanda: '#9a3c2a' } },
  },
  // 3.7.3: Martín Sepúlveda (71), maquinista retirado de La Trochita (el diseño del prototipo de la rama proto-tren,
  // aprobado por el usuario): mameluco azul de maquinista (pechera y pantalón), camisa cruda arremangada, gorra de
  // maquinista azul oscura, pañuelo colorado al cuello, canas y bigote blanco (sin barba: R.bigote), las manos con
  // grasa. En invierno, el poncho gris pizarra, la bufanda colorada y la gorra de siempre.
  'aldea-martin': {
    edad: 71, mujer: false,
    cuerpo: { ancho: 1.0, fondo: 1.02, panza: 0.1, alto: 0.98, encorvada: 0.06 },
    cara: { ancho: 1.04, largo: 1.0, nariz: 1.25, ojos: 0.85, mand: 0.3, sonrisa: 0.45, parpado: 0.14, arrugas: 'mayor', iris: '#3a4a5a' },
    colores: { piel: '#c49470', pelo: '#d8d4cc', barba: '#e0dcd4', ropa: '#c8c0a8', abrigo: '#3b4a5e', gorro: 'gorro', gorroColor: '#2e3a4c' },
    R: { pechera: '#3b4a5e', pantalon: '#3b4a5e', panuelo: '#a83a2a', botas: 'altas', botaCol: '#3a2a1e', arremangado: true, canas: 1, brea: true, bigote: true },
    guardas: { cuello: [1, 0, 'todo'] },
    poses: ['cintura', 'atras', 'cruzados', 'barba'],
    abrigo: { colores: { poncho: '#4a5560', bufanda: '#a83a2a', gorro: 'gorro' } },
  },

  // ------------------------------------------------------------ los once pobladores
  // Tito Arrieta, carpintero: boina, barba, chaleco, delantal de lona, pañuelo colorado al cuello
  'poblador-carpintero': {
    edad: 47, mujer: false,
    cuerpo: { ancho: 1.02, fondo: 1.02, brazos: 1.05, alto: 0.99 },
    cara: { ancho: 1.02, largo: 1.02, nariz: 1.25, ojos: 0.92, mand: 0.32, sonrisa: 0.35, arrugas: 'risa', iris: '#6b4526' },
    colores: { piel: '#c0906a', pelo: '#4a3a2c', barba: '#6b5a48', ropa: '#d8c8a4', abrigo: '#6b5a36', gorro: 'boina', gorroColor: '#4a3a2c' },
    R: { bombacha: true, chaleco: true, panuelo: '#9a3c2a', botas: 'altas', pantalon: '#7a6c58', faja: '#7a2e26', delantal: '#a8906a', telaDelantal: 'lienzo', arremangado: true },
    guardas: { faja: [2, 0], delantal: [1, 0.025] },
    poses: ['cintura', 'barba', 'cruzados'],
    abrigo: { colores: { poncho: '#8a6d4b', gorro: 'boina', bufanda: '#7a2e26' } },
  },
  // Rosa Quilodrán, panadera: pañuelo atado a la cabeza, chaleco oliva, pollera ocre, delantal con
  // harina, el mate
  'poblador-panadera': {
    edad: 40, mujer: true,
    cuerpo: { ancho: 1.02, fondo: 1.03, panza: 0.03, alto: 0.98 },
    cara: { ancho: 1.02, largo: 0.99, nariz: 1.0, ojos: 1.0, boca: 1.02, sonrisa: 0.4, arrugas: 'risa', iris: '#4c6c8a' },
    colores: { piel: '#c99a72', pelo: '#3a2a22', ropa: '#d8c8a4', abrigo: '#66673a', gorro: 'panuelo', gorroColor: '#b05c38', bufanda: null, aros: 'chicos' },
    R: { mujer: true, pollera: true, colPollera: '#9c7440', rodete: true, chaleco: true, delantal: '#e2d8c0', telaDelantal: 'harina', botaCol: '#6a4a30', arremangado: true },
    guardas: { pollera: [2, 0.05], delantal: [1, 0.03], chaleco: [11, 0.02, 'arriba'] },
    poses: ['cintura', 'gorro', 'delantal'],
    abrigo: { colores: { poncho: '#7a4f3e', bufanda: '#d8cdb8', gorro: 'panuelo' } },
  },
  // Anselmo Ruiz, herrero: robusto, gorro, barba, delantal de cuero repujado, camisa arremangada
  'poblador-herrero': {
    edad: 52, mujer: false,
    cuerpo: { ancho: 1.09, fondo: 1.13, panza: 0.13, brazos: 1.13, piernas: 1.08, alto: 1.0, robusto: true },
    cara: { ancho: 1.06, largo: 1.0, nariz: 1.2, ojos: 0.92, mand: 0.36, sonrisa: 0.35, arrugas: 'risa', iris: '#5c3b22' },
    colores: { piel: '#a87a56', pelo: '#3a2a1e', barba: '#4a3626', ropa: '#b39466', abrigo: '#6b5a36', gorro: 'gorro', gorroColor: '#5c4a32' },
    R: { pantalon: '#5e4c36', delantal: '#6c4a2c', telaDelantal: 'cuero', faja: '#8a3c2a', botaCol: '#5a3c26', arremangado: true, canas: 0.25 },
    guardas: { delantal: [7, 0.06] },
    poses: ['cintura', 'cruzados', 'barba'],
    abrigo: { colores: { poncho: '#4c4640', gorro: 'gorroPunto', gorroColor: '#5c4a32', bufanda: '#8a3c2a' } },
  },
  // Aurelio Nahuel, pescador de red: sombrero, campera encerada, barba gris, botas de goma
  'poblador-pescador': {
    edad: 55, mujer: false,
    cuerpo: { ancho: 0.98, fondo: 1.0, alto: 1.02 },
    cara: { ancho: 0.97, largo: 1.06, nariz: 1.2, ojos: 0.9, mand: 0.32, pomulos: 1.2, sonrisa: 0.3, arrugas: 'mayor', iris: '#4a2e1c' },
    colores: { piel: '#b07d55', pelo: '#2e2622', barba: '#7a746a', ropa: '#9aa098', abrigo: '#3e5248', gorro: 'sombrero' },
    R: { botas: 'goma', panuelo: '#c9b27a', abierta: true, campera: 'larga', pantalon: '#3e4650', canas: 0.4 },
    guardas: { cuello: [11, 0, 'todo'] },
    poses: ['atras', 'cruzados', 'barba'],
    abrigo: { colores: { poncho: '#56707e', gorro: 'gorroPunto', gorroColor: '#4a5560', bufanda: '#c9b27a' } },
  },
  // Delia Ferreyra, maestra rural: el guardapolvo blanco, el pelo recogido, los anteojos
  'poblador-maestra': {
    edad: 42, mujer: true,
    cuerpo: { ancho: 0.96, fondo: 0.95, alto: 1.03 },
    cara: { ancho: 0.97, largo: 1.04, nariz: 1.05, ojos: 1.0, boca: 0.95, mand: 0.3, sonrisa: 0.4, iris: '#6a5a36' },
    colores: { piel: '#d6ad8a', pelo: '#5a4232', ropa: '#7c6a8a', abrigo: '#ece6d8', gorro: null, bufanda: '#c9b89a', anteojos: true },
    R: { mujer: true, campera: 'larga', botones: '#e8e0d0', pantalon: '#4e4260', rodete: true, telaCampera: 'lienzo', rayaCostado: true },
    guardas: { cuello: [1, 0, 'todo'] },
    poses: ['atras', 'cruzados', 'cintura'],
    abrigo: { colores: { poncho: '#4e4260', gorro: 'gorroPunto', gorroColor: '#7c6a8a', bufanda: '#c9b89a' } },
  },
  // Marta Williams, enfermera: chaquetilla celeste, delantal blanco, rodete, nieta de galeses
  'poblador-enfermera': {
    edad: 45, mujer: true,
    cuerpo: { ancho: 1.0, fondo: 1.0, alto: 1.0 },
    cara: { ancho: 1.0, largo: 1.0, nariz: 0.95, ojos: 1.02, boca: 1.0, sonrisa: 0.45, arrugas: 'risa', pecas: true, iris: '#4e6a3c' },
    colores: { piel: '#e0b898', pelo: '#7a5a3a', ropa: '#e2e0d8', abrigo: '#6a8aa0', gorro: null, bufanda: null },
    R: { mujer: true, pollera: true, colPollera: '#3e5a72', delantal: '#f0ece2', rodete: true, abierta: true },
    guardas: { delantal: [10, 0.02], puno: [10, 0, 'todo'] },
    poses: ['delantal', 'cruzados', 'atras'],
    abrigo: { colores: { poncho: '#3e5a72', gorro: 'gorroPunto', gorroColor: '#e2d6bd', bufanda: '#9ab0c0' } },
  },
  // Benigno Saavedra, telegrafista: chaleco, camisa clara, gorra, anteojos, barba negra prolija
  'poblador-telegrafista': {
    edad: 51, mujer: false,
    cuerpo: { ancho: 0.94, fondo: 0.94, alto: 0.99 },
    cara: { ancho: 0.95, largo: 1.07, nariz: 1.15, ojos: 0.92, mand: 0.28, menton: 0.95, sonrisa: 0.2, arrugas: 'risa', iris: '#4a2e1c' },
    colores: { piel: '#c49a74', pelo: '#1e1a18', barba: '#2e2622', ropa: '#d8d0bc', abrigo: '#3a3a44', gorro: 'gorro', gorroColor: '#2e2e36', anteojos: true },
    R: { chaleco: true, botones: '#b89a4a', pantalon: '#2e2e36', canas: 0.3 },
    guardas: { chaleco: [10, 0.02, 'arriba'], puno: [10, 0, 'todo'] },
    poses: ['atras', 'cruzados', 'barba'],
    abrigo: { colores: { poncho: '#3a3a44', gorro: 'gorro', bufanda: '#6a5a4a' } },
  },
  // Elvira Ñancucheo, tejedora: la manta tejida con la guarda de su abuela, la faja, dos trenzas
  'poblador-tejedora': {
    edad: 60, mujer: true,
    cuerpo: { ancho: 1.0, fondo: 1.02, panza: 0.04, alto: 0.95 },
    cara: { ancho: 1.03, largo: 0.98, nariz: 1.1, ojos: 0.92, mand: 0.3, pomulos: 1.25, sonrisa: 0.4, arrugas: 'mayor', iris: '#4a2e1c' },
    colores: { piel: '#b07d55', pelo: '#2a2220', ropa: '#8a4a3a', abrigo: '#5a3a4a', gorro: null, bufanda: null, poncho: '#7a3a2e', aros: 'chicos' },
    R: { mujer: true, pollera: true, chamal: true, colPollera: '#2c2834', dosTrenzas: true, trenza: true, faja: '#9a2c24', canas: 0.35 },
    guardas: { poncho: [2, 0.09], pollera: [11, 0.05] },
    poses: ['atras', 'cruzados', 'delantal'],
    abrigo: { colores: { poncho: '#5a2e2a', gorro: 'gorroPunto', gorroColor: '#c89a48', bufanda: '#d8b878' } },
  },
  // Guido Rossetti, apicultor: sombrero, camisa clara, chaleco de lona con bolsillos, barba
  'poblador-apicultor': {
    edad: 48, mujer: false,
    cuerpo: { ancho: 1.02, fondo: 1.06, panza: 0.08, alto: 1.0 },
    cara: { ancho: 1.04, largo: 0.98, nariz: 1.25, ojos: 0.95, mand: 0.3, sonrisa: 0.5, arrugas: 'risa', iris: '#6a5a36' },
    colores: { piel: '#d6a882', pelo: '#5a4a3a', barba: '#8a7a6a', ropa: '#e2d6bd', abrigo: '#b8963e', gorro: 'sombrero' },
    R: { chaleco: true, telaChaleco: 'lienzo', bolsillos: true, botas: 'altas', pantalon: '#6a6048', arremangado: true },
    guardas: { chaleco: [6, 0.03, 'arriba'] },
    poses: ['cintura', 'barba', 'atras'],
    abrigo: { colores: { poncho: '#8a7a50', gorro: 'sombrero', bufanda: '#b8963e' } },
  },
  // Julia Antiñir, guardaparque de la seccional: camisa verde con bolsillos, sombrero, la trenza
  'poblador-guardaparque': {
    edad: 30, mujer: true,
    cuerpo: { ancho: 0.98, fondo: 0.96, brazos: 1.02, alto: 1.0 },
    cara: { ancho: 1.02, largo: 0.98, nariz: 1.0, ojos: 1.02, boca: 1.0, pomulos: 1.2, sonrisa: 0.35, iris: '#4a2e1c' },
    colores: { piel: '#b98a62', pelo: '#2a2220', ropa: '#6a7a46', abrigo: '#4a5630', gorro: 'sombrero' },
    R: { mujer: true, bolsillos: true, trenza: true, botas: 'trekking', pantalon: '#4c5236', arremangado: true },
    guardas: { puno: [3, 0, 'todo'] },
    poses: ['cintura', 'atras', 'cruzados'],
    abrigo: { colores: { poncho: '#4a5630', gorro: 'sombrero', bufanda: '#9a3c2a' } },
  },
  // Cholo Barrientos, músico: boina, pañuelo al cuello, camisa granate, chaleco negro, bombacha
  'poblador-musico': {
    edad: 41, mujer: false,
    cuerpo: { ancho: 0.98, fondo: 0.98, alto: 1.0 },
    cara: { ancho: 0.98, largo: 1.03, nariz: 1.15, ojos: 0.98, mand: 0.3, sonrisa: 0.6, arrugas: 'risa', iris: '#4a2e1c' },
    colores: { piel: '#b5865e', pelo: '#1e1a18', barba: '#3a2e28', ropa: '#7a2e2e', abrigo: '#2e2622', gorro: 'boina', gorroColor: '#2a2420', bufanda: null },
    R: { chaleco: true, panuelo: '#d8c8a0', bombacha: true, faja: '#9a2c24', botas: 'altas', pantalon: '#2a2420' },
    guardas: { faja: [4, 0], chaleco: [5, 0.03, 'arriba'] },
    poses: ['cintura', 'cruzados', 'barba'],
    abrigo: { colores: { poncho: '#3a2a2a', gorro: 'boina', bufanda: '#d8c8a0' } },
  },

  // ------------------------------------------------------------ las pobladoras de la 3.7.0
  // Ayelén Catriel (29), veterinaria: el pelo atado, camisa arremangada, chaleco con bolsillos,
  // pantalón de trabajo y las botas embarradas
  'poblador-veterinaria': {
    edad: 29, mujer: true,
    cuerpo: { ancho: 0.95, fondo: 0.93, brazos: 0.98, piernas: 0.97, alto: 1.0 },
    cara: { ancho: 0.98, largo: 1.02, nariz: 0.95, ojos: 1.04, boca: 1.0, pomulos: 1.25, sonrisa: 0.4, rasgado: 0.05, arco: 0.7, iris: '#4a2e1c' },
    colores: { piel: '#b07d55', pelo: '#1e1a18', ropa: '#b8a888', abrigo: '#4e5a3c', gorro: null },
    R: { mujer: true, coleta: true, rayaCostado: true, chaleco: true, telaChaleco: 'lienzo', bolsillos: true, botas: 'altas', botaCol: '#3e2e22', pantalon: '#5a4e3a', arremangado: true, barroBotas: true },
    guardas: { chaleco: [3, 0.025, 'arriba'], bota: [9, 0.2] },
    poses: ['cintura', 'atras', 'cruzados'],
    abrigo: { colores: { poncho: '#4e5a3c', gorro: 'gorroPunto', gorroColor: '#b0803e', bufanda: '#c8b088' } },
  },
  // Sofía Haddad (31), fotógrafa, de familia libanesa: melena oscura, cejas marcadas, chaleco de
  // muchos bolsillos, pañuelo al cuello y la cámara colgada
  'poblador-fotografa': {
    edad: 31, mujer: true,
    cuerpo: { ancho: 0.97, fondo: 0.98, alto: 1.0 },
    cara: { ancho: 0.95, largo: 1.06, nariz: 1.2, ojos: 1.08, boca: 1.06, mand: 0.28, cejas: 1.4, arco: 1.4, labios: 1.25, sonrisa: 0.4, iris: '#3c2618' },
    colores: { piel: '#c9996c', pelo: '#1c1410', ropa: '#d8c8a4', abrigo: '#6b5a3a', gorro: null },
    R: { mujer: true, melena: true, chaleco: true, telaChaleco: 'lienzo', bolsillos: true, panuelo: '#8a3c4a', botas: 'trekking', pantalon: '#4a4236', camara: true },
    guardas: { chaleco: [11, 0.025, 'arriba'], puno: [5, 0, 'todo'] },
    poses: ['cintura', 'atras', 'cruzados'],
    abrigo: { colores: { poncho: '#6b5a3a', gorro: 'gorroPunto', gorroColor: '#8a3c4a', bufanda: '#c8b088' } },
  },
  // Rocío Lagos (33), guía de montaña: fuerte, de hombros anchos, una cicatriz en la ceja, la
  // coleta, la campera de lona colorada y la soga al hombro
  'poblador-andinista': {
    edad: 33, mujer: true,
    cuerpo: { ancho: 1.06, fondo: 1.02, brazos: 1.1, piernas: 1.06, alto: 1.02 },
    cara: { ancho: 1.05, largo: 0.98, nariz: 1.05, ojos: 0.94, boca: 1.0, mand: 0.36, menton: 1.15, sonrisa: 0.3, arco: 0.55, labios: 0.85, cicatriz: true, iris: '#4e6a3c' },
    colores: { piel: '#c49a74', pelo: '#5a3a24', ropa: '#c8b088', abrigo: '#9a3c2a', gorro: null },
    R: { mujer: true, coleta: true, botas: 'trekking', pantalon: '#4a4a3e', abierta: true, soga: true },
    guardas: { cuello: [1, 0, 'todo'], puno: [2, 0, 'todo'] },
    poses: ['cintura', 'cruzados', 'atras'],
    abrigo: { colores: { poncho: '#9a3c2a', gorro: 'gorroPunto', gorroColor: '#4a5560', bufanda: '#c8b088' } },
  },
  // Inés Ancalao (35), herbolaria: de diario, pollera oscura, delantal de lienzo con bolsillos (los
  // yuyos), chaleco tejido con el bordado de lupino, las dos trenzas finas; de fiesta, la ropa del
  // prototipo (chamal, faja, trarilonko y trapelacucha: ver `fiesta`)
  'poblador-herbolaria': {
    edad: 35, mujer: true,
    cuerpo: { ancho: 0.97, fondo: 0.98, alto: 0.99 },
    cara: { ancho: 1.03, largo: 0.99, nariz: 1.02, ojos: 0.98, boca: 1.0, pomulos: 1.3, sonrisa: 0.4, parpado: 0.12, rasgado: 0.07, labios: 1.1, iris: '#5c3b22' },
    colores: { piel: '#b98a62', pelo: '#1c1410', ropa: '#e6dcc4', abrigo: '#4e5a3c', gorro: null, bufanda: null, aros: 'chicos' },
    R: { mujer: true, pollera: true, colPollera: '#3a3236', dosTrenzas: true, trenza: true, chaleco: true, telaChaleco: 'punto', delantal: '#c8b88e', telaDelantal: 'lienzo', botaCol: '#3a2a1e', arremangado: true },
    guardas: { pollera: [6, 0.06], chaleco: [6, 0.03, 'arriba'], delantal: [1, 0.02] },
    poses: ['delantal', 'cintura', 'atras'],
    abrigo: { colores: { poncho: '#2c2834', gorro: 'gorroPunto', gorroColor: '#6a3e5c', bufanda: '#c8b88e' } },
    fiesta: {
      colores: { ropa: '#e6dcc4', abrigo: '#2c2834', pelo: '#1c1410', gorro: null, bufanda: null, trarilonko: true, aros: 'chawai' },
      R: { pollera: true, chaleco: true, chamal: true, fiesta: true, dosTrenzas: true, trenza: true, colPollera: '#2c2834', telaChaleco: 'fiesta', delantal: null, arremangado: false },
      guardas: { pollera: [5, 0.1], manga: [6, 0.075], faja: [4, 0], chaleco: [1, 0.028, 'arriba'] },
    },
  },
  // Abril Moretti (27), pintora porteña: boina, melena corta, guardapolvo salpicado de pintura,
  // pañuelo al cuello y pintura en las manos
  'poblador-pintora': {
    edad: 27, mujer: true,
    cuerpo: { ancho: 0.92, fondo: 0.9, brazos: 0.94, piernas: 0.95, alto: 1.01 },
    cara: { ancho: 0.94, largo: 1.04, nariz: 0.88, ojos: 1.08, boca: 1.05, mand: 0.26, sonrisa: 0.5, arco: 1.3, rasgado: -0.03, pecas: true, iris: '#4e6a3c' },
    colores: { piel: '#e2b898', pelo: '#8e4524', ropa: '#3b3f63', abrigo: '#e2d6bd', gorro: 'boina', gorroColor: '#7a2e2e' },
    R: { mujer: true, melena: true, flequillo: true, campera: 'larga', telaCampera: 'lienzo', abierta: true, pantalon: '#3a3a44', panuelo: '#b8963e', pintura: true },
    guardas: { campera: [8, 0, 'todo'] },
    poses: ['cintura', 'cruzados', 'barba'],
    abrigo: { colores: { poncho: '#3b3f63', gorro: 'boina', bufanda: '#b8963e' } },
  },
  // Malena Jones (30), ceramista, prima de Mario: callada, el pelo recogido con un pañuelo, la
  // camisa arremangada y el delantal de barro
  'poblador-ceramista': {
    edad: 30, mujer: true,
    cuerpo: { ancho: 1.02, fondo: 1.0, brazos: 1.04, alto: 0.98 },
    cara: { ancho: 1.02, largo: 1.01, nariz: 1.08, ojos: 0.95, boca: 0.92, mand: 0.3, sonrisa: 0.06, parpado: 0.14, arco: 0.75, labios: 0.9, iris: '#4c6c8a' },
    colores: { piel: '#dcb090', pelo: '#6b4a32', ropa: '#a8b0a0', abrigo: '#5a6a5a', gorro: 'panuelo', gorroColor: '#5a6a72' },
    R: { mujer: true, rodete: true, pollera: true, colPollera: '#5a4a3a', delantal: '#b8a88a', telaDelantal: 'lienzo', arremangado: true, barroDelantal: true },
    guardas: { delantal: [9, 0, 'todo'], pollera: [1, 0.03] },
    poses: ['delantal', 'cruzados', 'atras'],
    abrigo: { colores: { poncho: '#5a6a5a', bufanda: '#b8a88a', gorro: 'panuelo' } },
  },
  // Martina Roldán (28), la del varadero: ruidosa, la remera a rayas, el pantalón con pechera, el
  // gorro de lana marinero, la coleta y brea en las manos
  'poblador-botera': {
    edad: 28, mujer: true,
    cuerpo: { ancho: 1.02, fondo: 1.0, brazos: 1.05, piernas: 1.02, alto: 0.99 },
    cara: { ancho: 1.04, largo: 0.97, nariz: 0.94, ojos: 1.02, boca: 1.14, mand: 0.28, sonrisa: 0.8, arco: 1.2, labios: 1.15, pecas: true, iris: '#6b4526' },
    colores: { piel: '#cfa07a', pelo: '#4a2e1e', ropa: '#e2d6bd', abrigo: '#e2d6bd', gorro: 'gorroPunto', gorroColor: '#2c3446' },
    R: { mujer: true, coleta: true, pechera: '#3b4a5e', botas: 'goma', botaCol: '#2a2d2c', pantalon: '#3b4a5e', arremangado: true, brea: true, telaCampera: 'punto' },
    guardas: { pechera: [14, 0, 'todo'], campera: [15, 0, 'todo'], manga: [15, 0.7] },
    poses: ['cintura', 'cruzados', 'gorro'],
    abrigo: { colores: { poncho: '#2c3446', bufanda: '#9a3c2a', gorro: 'gorroPunto', gorroColor: '#9a3c2a' } },
  },
  // Valentina Ruiz Díaz (32), astrónoma: dormilona, los párpados a media asta, el pelo suelto y
  // despeinado, los anteojos, el pulóver azul noche con estrellas bordadas
  'poblador-astronoma': {
    edad: 32, mujer: true,
    cuerpo: { ancho: 0.93, fondo: 0.92, alto: 1.04 },
    cara: { ancho: 0.95, largo: 1.06, nariz: 1.02, ojos: 1.0, boca: 0.98, mand: 0.26, sonrisa: 0.2, parpado: 0.32, ojeras: true, arco: 0.9, rasgado: -0.04, iris: '#3c2618' },
    colores: { piel: '#d8b090', pelo: '#3a2a22', ropa: '#c8b088', abrigo: '#2c3446', gorro: null, bufanda: '#b8963e', anteojos: true },
    R: { mujer: true, melena: true, despeinada: true, flequillo: true, pantalon: '#3a3a44', botas: 'trekking', telaCampera: 'punto' },
    guardas: { campera: [13, 0, 'todo'], puno: [13, 0, 'todo'] },
    poses: ['cruzados', 'atras', 'barba'],
    abrigo: { colores: { poncho: '#2c3446', gorro: 'gorroPunto', gorroColor: '#b8963e', bufanda: '#b8963e' } },
  },
  // Pocha Benítez (58), modista, viuda y charlatana: rodete canoso, anteojos, el centímetro al
  // cuello, blusa, chaleco tejido y pollera, petisa y de buen comer
  'poblador-modista': {
    edad: 58, mujer: true,
    cuerpo: { ancho: 1.08, fondo: 1.1, panza: 0.1, alto: 0.94 },
    cara: { ancho: 1.07, largo: 0.95, nariz: 1.05, ojos: 1.0, boca: 1.08, sonrisa: 0.7, arco: 1.3, labios: 1.1, arrugas: 'mayor', iris: '#6b4526' },
    colores: { piel: '#d6ad8a', pelo: '#8a7a6e', ropa: '#c8a4a0', abrigo: '#6a3e5c', gorro: null, bufanda: null, anteojos: true, aros: 'chicos' },
    R: { mujer: true, pollera: true, colPollera: '#4e3a46', rodete: true, chaleco: true, telaChaleco: 'punto', centimetro: true, canas: 0.75 },
    guardas: { pollera: [5, 0.05], chaleco: [12, 0.03, 'arriba'], puno: [1, 0, 'todo'] },
    poses: ['cintura', 'delantal', 'cruzados'],
    abrigo: { colores: { poncho: '#6a3e5c', gorro: 'gorroPunto', gorroColor: '#c8a4a0', bufanda: '#e2d6bd' } },
  },
};

// Los que están en la lista de la 3.7.0 (las nueve nuevas, para el núcleo y las pruebas)
export const NUEVAS_3_7_0 = ['veterinaria', 'fotografa', 'andinista', 'herbolaria', 'pintora', 'ceramista', 'botera', 'astronoma', 'modista'];

const copia = (o) => (o && typeof o === 'object' ? { ...o } : {});
// La ropa y el aspecto de una persona. `colores` y `R` son los que trae quien la arma (aldea.js,
// gente.js): con una clave conocida valen sólo los de acá; con una desconocida quedan los que vienen
// (y gente-cuerpo.js les corre el color hacia la tierra). `invierno`: la ropa de abrigo (poncho,
// gorro de lana y bufanda, con lo que cada uno diga en `abrigo`); `fiesta`: la de fiesta, si tiene.
// 3.7.5 (rincones): `estacion` ('verano' u 'otono'), la ropa de las otras dos estaciones (ver ROPA_ESTACION).
export function aspectoGente(clave, colores = {}, R = {}, { invierno = false, fiesta = false, estacion = null } = {}) {
  const def = typeof clave === 'string' && Object.hasOwn(ASPECTO, clave) ? ASPECTO[clave] : null;
  if (!def) return { conocido: false, colores: copia(colores), R: copia(R), guardas: {}, poses: null, cuerpo: {}, cara: {}, edad: null };
  const out = {
    conocido: true, edad: def.edad, colores: { ...def.colores }, R: { ...def.R },
    guardas: { ...def.guardas }, poses: def.poses ? [...def.poses] : null, cuerpo: { ...def.cuerpo }, cara: { ...def.cara },
  };
  if (def.mujer) out.R.mujer = true;
  if (def.chico) out.R.chico = true;
  if (fiesta && def.fiesta) {
    Object.assign(out.colores, def.fiesta.colores || {});
    Object.assign(out.R, def.fiesta.R || {});
    out.guardas = { ...(def.fiesta.guardas || out.guardas) };
    out.fiesta = true;
  } else if (invierno) {
    const a = def.abrigo || {};
    const ac = a.colores || {};
    // el poncho (si ya lo tenía, el suyo; si no, el de lana), el gorro de lana y la bufanda
    const poncho = ac.poncho === false ? null : ac.poncho || out.colores.poncho || ABRIGO_BASE.poncho;   // (los chicos, sin poncho)
    const gorro = ac.gorro !== undefined ? ac.gorro : 'gorroPunto';
    out.colores.poncho = poncho;
    out.colores.bufanda = ac.bufanda || out.colores.bufanda || ABRIGO_BASE.bufanda;
    if (gorro === 'gorroPunto' && out.colores.gorro !== 'gorroPunto') out.colores.gorroColor = ac.gorroColor || ABRIGO_BASE.gorro;
    else if (ac.gorroColor) out.colores.gorroColor = ac.gorroColor;
    out.colores.gorro = gorro;
    Object.assign(out.R, a.R || {});
    // la guarda del poncho: la que ya tenía o una de telar
    if (poncho && !out.guardas.poncho) out.guardas.poncho = [def.mujer ? 11 : 2, 0.07];
    out.invierno = true;
  } else if (estacion === 'verano') {
    // 3.7.5 (rincones): en verano, en mangas de camisa: la campera, el poncho, la bufanda y el gorro de lana quedan en
    // casa (el chaleco, el que lo usa, se queda; la boina y el sombrero también)
    if (out.R.campera) { delete out.R.campera; delete out.R.abierta; out.R.chaleco = true; }
    if (out.colores.poncho && !ROPA_ESTACION.ponchoEnVerano.includes(clave)) { delete out.colores.poncho; delete out.guardas.poncho; }
    delete out.colores.bufanda;
    if (out.colores.gorro === 'gorroPunto') delete out.colores.gorro;
    out.estacion = 'verano';
  } else if (estacion === 'otono') {
    // 3.7.5 (rincones): en otoño, la ropa de siempre con una bufanda liviana (la del invierno de cada uno)
    out.colores.bufanda = def.abrigo?.colores?.bufanda || out.colores.bufanda || ABRIGO_BASE.bufanda;
    out.estacion = 'otono';
  }
  return out;
}
// 3.7.5 (rincones): la ropa por estación (PLAN_3_7.md). En invierno, la de abrigo de la 3.7.0; en verano, en mangas de
// camisa; en otoño, con bufanda. `ponchoEnVerano`: los que no se lo sacan ni en enero (Don Ramón, que dice que el
// poncho también es para el sol).
export const ROPA_ESTACION = { estaciones: ['verano', 'otono', 'invierno'], ponchoEnVerano: ['ramon'] };

// Para las pruebas: las claves con ropa propia
export const clavesConAspecto = () => Object.keys(ASPECTO);
