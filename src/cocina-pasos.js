// 3.7.2: la cocina en pasos (PLAN_3_7.md, «3.7.2 — La cocina»; todo lo decidió el usuario). Lo de antes
// (cocina.js: las recetas al fuego, de una) sigue igual. Acá se cocina con tiempo, en una estación:
//   · la parrilla con cruz (el asador criollo): asado y cordero al asador. Es de afuera: con lluvia hace
//     falta un techito (el techito de la parrilla, la galería o cualquier techo tuyo encima);
//   · el horno de barro (el de la 2.4): pan casero y empanadas, ahora en pasos;
//   · la cocina a leña (adentro, o donde la armes): mermeladas, dulce de leche, locro, chocolate y curanto.
// Cada receta va en pasos: prender el fuego (con leña), preparar, cocinar, dar vuelta o revolver, sacar. Entre
// paso y paso corre el tiempo del juego (también si te vas o dormís). Lo que sale va a la alacena: son
// entradas como el pan de siempre (`progreso.entradas[id].cantidad`), así la feria, los regalos y la mochila
// los ven igual. **Nada se pudre**: lo cocinado dura lo que haga falta.
//
// Ingredientes de dos fuentes (sin economía nueva: trueque y servicios):
//   · los que produce el jugador en la granja (otro equipo, mismos ids): leche, carne-vaca, carne-cordero,
//     carne-cerdo, chorizo, manzana, pera, ciruela, cereza, frambuesa;
//   · por trueque: el almacén de Ercilia (azúcar, sal, cacao, maíz pisado, porotos; trueque.js) y los vecinos
//     (una vez por día cada uno, desde la charla: la carne, la leche, la fruta, el zapallo, los mariscos).
// Se cuentan tanto en lo juntado (`entradas`) como en las cosas (`cosas`): la granja puede guardarlos donde
// quiera y acá se ven igual (se gasta primero de lo juntado).
//
// El recetario: una receta se sabe de entrada (el asado, el pan, las empanadas), te la enseña un vecino o se
// aprende haciéndola «a ojo» la primera vez (si tenés todo). Queda en el cuaderno (pestaña «Recetario»).
//
// Estaciones móviles (para la 3.7.3, el vagón comedor): `estacionMovil({ id, tipo, techo })` arma la estación;
// las reglas (empezar, hacer el paso, avanzar, avisos) son las mismas y el estado de la cocción lo guarda quien
// la tenga (las obras en `datos.coccion`; las móviles en `progreso.cocina.moviles[id]`).
//
// Módulo puro (se prueba en Node).

// ---------------------------------------------------------------- números
export const COCINA = {
  lluvia: 0.35,         // con más lluvia que esto, el asado de afuera necesita techito
  invitados: 3,         // cuántos vecinos se acercan por el olor del asado
  horaInvitados: [10, 21.5],   // a qué hora se acercan (de noche cada uno en su casa)
  sobremesa: 1.2,       // horas que se quedan después de comer
  amistad: 3,           // lo que suma compartir el asado con alguien
  robo: 1,              // el chorizo que se lleva el perro (una porción menos)
  tope: 99,             // lo más que se guarda de cada cosa en la cuenta de la cocina
};

// ---------------------------------------------------------------- estaciones
// `plano`: el de construccion.js (planos-cocina.js); `afuera`: la lluvia la frena si no tiene techo;
// `lena`: troncos que pide prender el fuego.
export const ESTACIONES = {
  parrilla: { id: 'parrilla', nombre: 'La parrilla con cruz', la: 'la parrilla', verbo: 'Asar', afuera: true, lena: 2, plano: 'parrilla' },
  horno: { id: 'horno', nombre: 'El horno de barro', la: 'el horno de barro', verbo: 'Hornear', afuera: false, lena: 1, plano: 'horno' },
  'cocina-lena': { id: 'cocina-lena', nombre: 'La cocina a leña', la: 'la cocina a leña', verbo: 'Cocinar', afuera: false, lena: 1, plano: 'cocina-lena' },
};
export const TIPOS_ESTACION = Object.keys(ESTACIONES);
export const esTipoEstacion = (t) => typeof t === 'string' && Object.hasOwn(ESTACIONES, t);
// Los planos que son estación (y la alacena, que se mira con E)
export const PLANOS_ESTACION = { parrilla: 'parrilla', horno: 'horno', 'cocina-lena': 'cocina-lena' };
export const PLANOS_COCINA_E = ['parrilla', 'cocina-lena', 'alacena'];
// Una estación que no es una obra (la 3.7.3: la cocina del vagón comedor). `techo`: si tiene techo arriba.
export function estacionMovil({ id, tipo = 'cocina-lena', techo = true, nombre = null } = {}) {
  if (!esTipoEstacion(tipo) || typeof id !== 'string' || !id) return null;
  return { ...ESTACIONES[tipo], tipo, clave: `movil:${id}`, movil: true, techo: !!techo, nombre: nombre || ESTACIONES[tipo].nombre };
}
// La de una obra (parrilla, horno o cocina a leña)
export function estacionDeObra(planoId, techo = false) {
  const tipo = PLANOS_ESTACION[planoId];
  return tipo ? { ...ESTACIONES[tipo], tipo, movil: false, techo: !!techo } : null;
}

// ---------------------------------------------------------------- ingredientes
// `de`: dónde se consigue (para el recetario y para cuando falta). `granja`: lo produce la granja (sus ids).
export const INGREDIENTES = {
  'carne-vaca': { nombre: 'kilos de carne de vaca', uno: 'kilo de carne de vaca', corto: 'carne de vaca', granja: true, de: 'tu vaca, o Mario Jones en la aldea (por troncos)' },
  'carne-cordero': { nombre: 'kilos de cordero', uno: 'kilo de cordero', corto: 'cordero', granja: true, de: 'tus corderos, o Don Ramón en su puesto (por tablas)' },
  'carne-cerdo': { nombre: 'kilos de carne de cerdo', uno: 'kilo de carne de cerdo', corto: 'carne de cerdo', granja: true, de: 'tus chanchos, o Gladys en la aldea (por piñones)' },
  chorizo: { nombre: 'chorizos', uno: 'chorizo', corto: 'chorizos', granja: true, de: 'tus chanchos, o Mario Jones en la aldea (por troncos)' },
  leche: { nombre: 'litros de leche', uno: 'litro de leche', corto: 'leche', granja: true, de: 'tu vaca lechera, o la abuela Herminia (por yerba)' },
  manzana: { nombre: 'manzanas', uno: 'manzana', corto: 'manzanas', granja: true, fruta: true, de: 'tus frutales, o Nélida en el almacén (por un canto rodado)' },
  pera: { nombre: 'peras', uno: 'pera', corto: 'peras', granja: true, fruta: true, de: 'tus frutales, o Nélida en el almacén (por un canto rodado)' },
  ciruela: { nombre: 'ciruelas', uno: 'ciruela', corto: 'ciruelas', granja: true, fruta: true, de: 'tus frutales, o Ceinwen en la casa de té (por yerba)' },
  cereza: { nombre: 'cerezas', uno: 'cereza', corto: 'cerezas', granja: true, fruta: true, de: 'tus frutales, o Ceinwen en la casa de té (por yerba)' },
  frambuesa: { nombre: 'frambuesas', uno: 'frambuesa', corto: 'frambuesas', granja: true, fruta: true, de: 'tus frutales, o Inés, la herbolaria (por yerba)' },
  grosella: { nombre: 'grosellas', uno: 'grosella', corto: 'grosellas', granja: true, fruta: true, de: 'tus frutales, o Inés, la herbolaria (por yerba)' },
  frutilla: { nombre: 'frutillas', uno: 'frutilla', corto: 'frutillas', fruta: true, de: 'el bosque (E), o tu cantero' },
  azucar: { nombre: 'medidas de azúcar', uno: 'medida de azúcar', corto: 'azúcar', de: 'el almacén de Ercilia' },
  sal: { nombre: 'medidas de sal gruesa', uno: 'medida de sal gruesa', corto: 'sal', de: 'el almacén de Ercilia' },
  cacao: { nombre: 'medidas de cacao', uno: 'medida de cacao', corto: 'cacao', de: 'el almacén de Ercilia' },
  maiz: { nombre: 'medidas de maíz pisado', uno: 'medida de maíz pisado', corto: 'maíz pisado', de: 'el almacén de Ercilia' },
  porotos: { nombre: 'medidas de porotos', uno: 'medida de porotos', corto: 'porotos', de: 'el almacén de Ercilia' },
  zapallo: { nombre: 'zapallos', uno: 'zapallo', corto: 'zapallo', de: 'Gladys en la aldea (por papas)' },
  mariscos: { nombre: 'bolsas de mariscos', uno: 'bolsa de mariscos', corto: 'mariscos', de: 'Ernesto, el jefe de estación: suben con el tren de la costa (por troncos)' },
  harina: { nombre: 'medidas de harina', uno: 'medida de harina', corto: 'harina', de: 'el almacén de Ercilia' },
  huevo: { nombre: 'huevos', uno: 'huevo', corto: 'huevos', de: 'tu gallinero' },
  papa: { nombre: 'papas', uno: 'papa', corto: 'papas', de: 'tu cantero' },
  'pan-casero': { nombre: 'panes caseros', uno: 'pan casero', corto: 'pan', de: 'el horno de barro' },
};
export const esIngrediente = (k) => typeof k === 'string' && Object.hasOwn(INGREDIENTES, k);
// Los de la granja (los ids que comparte con el otro equipo)
export const DE_LA_GRANJA = Object.keys(INGREDIENTES).filter((k) => INGREDIENTES[k].granja);
// Las frutas de la mermelada, en el orden en que se eligen si hay de varias
export const FRUTAS = ['frambuesa', 'cereza', 'ciruela', 'manzana', 'pera', 'grosella', 'frutilla'];
// Lo del almacén (trueque.js: los cambios de Ercilia, que van a `cosas`)
export const DEL_ALMACEN = ['azucar', 'sal', 'cacao', 'maiz', 'porotos'];

// Cuánto hay de algo: lo juntado más las cosas. `p`: el progreso.
export function cuantoHay(p, k) {
  const e = Number(p?.entradas?.[k]?.cantidad) || 0, c = Number(p?.cosas?.[k]) || 0;
  return Math.max(0, Math.floor(e)) + Math.max(0, Math.floor(c));
}
// Gasta `n` de algo: primero de lo juntado, después de las cosas. Devuelve lo que se gastó.
export function gastar(p, k, n) {
  let falta = Math.max(0, Math.floor(Number(n) || 0));
  const e = p?.entradas?.[k];
  if (e && falta > 0) { const q = Math.min(falta, Math.max(0, Math.floor(Number(e.cantidad) || 0))); e.cantidad = Math.max(0, (Number(e.cantidad) || 0) - q); falta -= q; }
  if (p?.cosas && falta > 0 && Number(p.cosas[k]) > 0) { const q = Math.min(falta, Math.floor(Number(p.cosas[k]))); p.cosas[k] -= q; if (p.cosas[k] <= 0) delete p.cosas[k]; falta -= q; }
  return Math.max(0, Math.floor(Number(n) || 0)) - falta;
}

// ---------------------------------------------------------------- recetas
// `pide`: [{ k, n }]; k 'fruta' es cualquiera de FRUTAS (la que más haya, ver `varianteDe`).
// `pasos`: el primero prende el fuego (gasta la leña de la estación y deja todo preparado: los ingredientes
// se gastan ahí, así nada falta a mitad de camino); después, cada uno es lo que hacés con E. `espera`: horas
// del juego hasta que se puede hacer el paso siguiente; `mientras`: qué pasa entretanto (el aviso).
// `da`: { id, n } (lo que va a la alacena). `olor`: 'asado' trae vecinos y al perro; `chorizos`: el perro roba.
// `enCruz`: desde qué paso la carne está en la cruz (lo visual). `ensena`: el vecino que la sabe y te la enseña.
// `deEntrada`: se sabe desde el principio.
export const RECETAS_PASOS = [
  {
    id: 'asado', nombre: 'Asado a la cruz', estacion: 'parrilla', deEntrada: true, olor: 'asado', chorizos: true, enCruz: 2,
    pide: [{ k: 'carne-vaca', n: 2 }, { k: 'chorizo', n: 2 }, { k: 'sal', n: 1 }],
    da: { id: 'asado', n: 6 },
    pasos: [
      { id: 'fuego', accion: 'Prender el fuego del asador', hecho: 'Prendiste el fuego', sub: 'Leña de ñire, que hace buena brasa', espera: 0.75, mientras: 'Se están haciendo las brasas' },
      { id: 'poner', accion: 'Poner la carne en la cruz', hecho: 'La carne ya está en la cruz', sub: 'Del lado del hueso primero, y los chorizos en la parrilla', espera: 1.5, mientras: 'Se hace del lado del hueso' },
      { id: 'vuelta', accion: 'Dar vuelta la cruz', hecho: 'Diste vuelta la cruz', sub: 'Ahora del lado de la grasa, que dore', espera: 1, mientras: 'Se dora del lado de la grasa' },
      { id: 'sacar', accion: 'Sacar el asado', hecho: '¡El asado está a punto!', fin: true },
    ],
    texto: 'Costillar entero clavado en la cruz, inclinado sobre las brasas, con sal gruesa y nada más. Se hace despacio: primero del lado del hueso, después se da vuelta para que la grasa dore. Mientras tanto, los chorizos en la parrilla, para picar. El humo avisa a todo el vecindario.',
    efecto: 'Te llena y te calienta: tres horas de buen paso, y se va el frío.',
  },
  {
    id: 'cordero-asador', nombre: 'Cordero al asador', estacion: 'parrilla', olor: 'asado', enCruz: 2, ensena: 'ramon',
    pide: [{ k: 'carne-cordero', n: 3 }, { k: 'sal', n: 1 }],
    da: { id: 'cordero-asado', n: 8 },
    pasos: [
      { id: 'fuego', accion: 'Prender el fuego del asador', hecho: 'Prendiste el fuego', sub: 'Mucha leña: el cordero pide brasa pareja', espera: 1, mientras: 'Se están haciendo las brasas' },
      { id: 'poner', accion: 'Clavar el cordero en la cruz', hecho: 'El cordero ya está en la cruz', sub: 'Abierto, del lado de adentro hacia el fuego', espera: 2, mientras: 'Se hace del lado de adentro' },
      { id: 'vuelta', accion: 'Dar vuelta el cordero', hecho: 'Diste vuelta el cordero', sub: 'Ahora el cuero, que quede crocante', espera: 1.5, mientras: 'Se dora el cuero' },
      { id: 'sacar', accion: 'Sacar el cordero', hecho: '¡El cordero está a punto!', fin: true },
    ],
    texto: 'El cordero patagónico entero, abierto en cruz y atado con alambre, a un metro de las brasas. Cuatro o cinco horas, salmuera con un ramito de romero, y la paciencia de no apurarlo. Es la comida de las fiestas del sur.',
    efecto: 'Te llena y te calienta: tres horas de buen paso, y se va el frío.',
  },
  {
    id: 'pan-casero', nombre: 'Pan casero', estacion: 'horno', deEntrada: true, olor: 'pan',
    pide: [{ k: 'harina', n: 2 }],
    da: { id: 'pan-casero', n: 3 },
    pasos: [
      { id: 'fuego', accion: 'Prender el horno', hecho: 'Prendiste el horno', sub: 'Hasta que la cúpula quede blanca', espera: 1, mientras: 'El barro toma temperatura' },
      { id: 'poner', accion: 'Barrer las brasas y meter el pan', hecho: 'El pan ya está adentro', sub: 'Con la pala de madera, y la boca tapada', espera: 1, mientras: 'Se está horneando' },
      { id: 'sacar', accion: 'Sacar el pan', hecho: 'Sacaste el pan', fin: true },
    ],
    texto: 'El horno se calienta con leña hasta que la cúpula queda blanca; después se barren las brasas y entra el pan. Sale con la corteza dura y adentro tibio, y dura días envuelto en un trapo.',
    efecto: 'Un pedazo en el camino saca el frío.',
  },
  {
    id: 'empanadas', nombre: 'Empanadas', estacion: 'horno', deEntrada: true, olor: 'pan',
    pide: [{ k: 'harina', n: 1 }, { k: 'huevo', n: 1 }, { k: 'papa', n: 1 }],
    da: { id: 'empanadas', n: 4 },
    pasos: [
      { id: 'fuego', accion: 'Prender el horno', hecho: 'Prendiste el horno', sub: 'Mientras, se arma el repulgue', espera: 1, mientras: 'El barro toma temperatura' },
      { id: 'poner', accion: 'Meter las empanadas', hecho: 'Las empanadas ya están adentro', sub: 'En la chapa, bien juntitas', espera: 0.75, mientras: 'Se están dorando' },
      { id: 'sacar', accion: 'Sacar las empanadas', hecho: 'Sacaste las empanadas', fin: true },
    ],
    texto: 'Masa de harina y grasa, rellena de lo que haya: acá, papa y huevo. En el horno de barro se doran parejas. Se llevan envueltas para el trabajo, y la cuadrilla de la vía las cambia por lo que sea.',
    efecto: 'Una en el camino saca el frío.',
  },
  {
    id: 'mermeladas', nombre: 'Mermelada', estacion: 'cocina-lena', olor: 'dulce', ensena: 'madre',
    pide: [{ k: 'fruta', n: 4 }, { k: 'azucar', n: 1 }],
    da: { id: 'mermelada', n: 3 },
    pasos: [
      { id: 'fuego', accion: 'Prender la cocina', hecho: 'Prendiste la cocina', sub: 'La plancha tarda en calentar', espera: 0.5, mientras: 'La plancha se calienta' },
      { id: 'poner', accion: 'Poner la fruta con el azúcar en la olla', hecho: 'La fruta ya está en la olla', sub: 'Fuego bajo y la cuchara de madera', espera: 1.5, mientras: 'Hierve despacito' },
      { id: 'revolver', accion: 'Revolver la olla', hecho: 'Revolviste', sub: 'Que no se pegue en el fondo', espera: 1, mientras: 'Va tomando punto' },
      { id: 'sacar', accion: 'Envasar la mermelada', hecho: 'Envasaste la mermelada', fin: true },
    ],
    texto: 'Fruta y azúcar, mitad y mitad, a fuego bajo hasta que una gota en un plato frío no se corre. Se envasa caliente en frascos hervidos y se tapa enseguida. Con la fruta de cada estación: frambuesas, cerezas, ciruelas, manzanas, peras, grosellas o frutillas.',
    efecto: 'Untada en pan, una hora de buen paso.',
  },
  {
    id: 'dulce-leche', nombre: 'Dulce de leche', estacion: 'cocina-lena', olor: 'dulce', ensena: 'nelida',
    pide: [{ k: 'leche', n: 4 }, { k: 'azucar', n: 1 }],
    da: { id: 'dulce-leche', n: 2 },
    pasos: [
      { id: 'fuego', accion: 'Prender la cocina', hecho: 'Prendiste la cocina', sub: 'La plancha tarda en calentar', espera: 0.5, mientras: 'La plancha se calienta' },
      { id: 'poner', accion: 'Poner la leche con el azúcar', hecho: 'La leche ya está en la olla', sub: 'Con una pizca de bicarbonato, como hacía la abuela', espera: 1.5, mientras: 'Hierve, y no hay que dejarla sola' },
      { id: 'revolver', accion: 'Revolver con la cuchara de madera', hecho: 'Revolviste', sub: 'Toma color de a poco', espera: 1.5, mientras: 'Toma color y espesa' },
      { id: 'sacar', accion: 'Envasar el dulce de leche', hecho: 'Envasaste el dulce de leche', fin: true },
    ],
    texto: 'Leche y azúcar, horas revolviendo en la olla hasta que toma color de caramelo y la cuchara deja un surco. El de campo es más oscuro y más espeso que el de la ciudad. No hay casa sin un frasco.',
    efecto: 'Una cucharada y una hora de buen paso.',
  },
  {
    id: 'locro', nombre: 'Locro', estacion: 'cocina-lena', olor: 'guiso', ensena: 'abuela',
    pide: [{ k: 'maiz', n: 2 }, { k: 'porotos', n: 1 }, { k: 'zapallo', n: 1 }, { k: 'carne-cerdo', n: 1 }, { k: 'chorizo', n: 1 }],
    da: { id: 'locro', n: 6 },
    pasos: [
      { id: 'fuego', accion: 'Prender la cocina', hecho: 'Prendiste la cocina', sub: 'El maíz y los porotos, remojados desde anoche', espera: 0.5, mientras: 'La plancha se calienta' },
      { id: 'poner', accion: 'Poner el maíz y los porotos', hecho: 'El maíz y los porotos ya hierven', sub: 'Mucha agua, la olla grande', espera: 1.5, mientras: 'Hierve despacio' },
      { id: 'sumar', accion: 'Sumar el zapallo, la carne y el chorizo', hecho: 'Sumaste el zapallo y la carne', sub: 'El zapallo se deshace y lo espesa', espera: 1.5, mientras: 'Se espesa' },
      { id: 'sacar', accion: 'Servir el locro', hecho: 'El locro está listo', fin: true },
    ],
    texto: 'Maíz blanco pisado, porotos, zapallo y carne de cerdo con chorizo, horas en la olla hasta que el zapallo se deshace y todo espesa. Es la comida de los días patrios y de los inviernos largos: se hace de a mucho, para convidar.',
    efecto: 'Te llena y te calienta: tres horas de buen paso, y se va el frío.',
  },
  {
    id: 'chocolate-caliente', nombre: 'Chocolate caliente', estacion: 'cocina-lena', olor: 'dulce', ensena: 'galesa',
    pide: [{ k: 'leche', n: 2 }, { k: 'cacao', n: 1 }, { k: 'azucar', n: 1 }],
    da: { id: 'chocolate-caliente', n: 4 },
    pasos: [
      { id: 'fuego', accion: 'Prender la cocina', hecho: 'Prendiste la cocina', sub: 'La plancha tarda en calentar', espera: 0.5, mientras: 'La plancha se calienta' },
      { id: 'poner', accion: 'Poner la leche con el cacao', hecho: 'La leche ya está en la olla', sub: 'Que no hierva: apenas que humee', espera: 0.5, mientras: 'Se va espesando' },
      { id: 'sacar', accion: 'Servir el chocolate', hecho: 'El chocolate está listo', fin: true },
    ],
    texto: 'Leche con cacao amargo y azúcar, batida en la olla sin que llegue a hervir. Espeso, de los que se toman con cuchara. Los días de nieve en el sur se toma así, mirando por la ventana.',
    efecto: 'Te calienta por dentro: se va el frío, y en invierno, dos horas de buen paso.',
  },
  {
    id: 'curanto', nombre: 'Curanto en olla', estacion: 'cocina-lena', olor: 'guiso', ensena: 'jefe',
    pide: [{ k: 'mariscos', n: 2 }, { k: 'carne-cerdo', n: 1 }, { k: 'chorizo', n: 1 }, { k: 'papa', n: 2 }],
    da: { id: 'curanto', n: 6 },
    pasos: [
      { id: 'fuego', accion: 'Prender la cocina', hecho: 'Prendiste la cocina', sub: 'La olla más grande que haya', espera: 0.5, mientras: 'La plancha se calienta' },
      { id: 'poner', accion: 'Armar las capas en la olla', hecho: 'El curanto ya está tapado', sub: 'Mariscos abajo, la carne, las papas, y hojas de nalca encima', espera: 2, mientras: 'Se cocina al vapor, tapado' },
      { id: 'sacar', accion: 'Destapar el curanto', hecho: '¡Curanto!', fin: true },
    ],
    texto: 'El de Chiloé se hace en un pozo con piedras calientes; en la olla sale igual de bueno: cholgas y almejas abajo, carne de cerdo y chorizo, papas, y todo tapado con hojas de nalca para que se cocine con su propio vapor. Se destapa con todos alrededor.',
    efecto: 'Te llena y te calienta: tres horas de buen paso, y se va el frío.',
  },
];
export const RECETA_PASOS = Object.fromEntries(RECETAS_PASOS.map((r) => [r.id, r]));
export const esRecetaPasos = (id) => typeof id === 'string' && Object.hasOwn(RECETA_PASOS, id);
export const recetasDe = (tipo) => RECETAS_PASOS.filter((r) => r.estacion === tipo);

// La mermelada sale de la fruta que más haya (de las que alcancen); `p`: el progreso.
export function varianteDe(rc, p) {
  if (!rc?.pide?.some((x) => x.k === 'fruta')) return null;
  const n = rc.pide.find((x) => x.k === 'fruta').n;
  let mejor = null, m = n - 1;
  for (const f of FRUTAS) { const c = cuantoHay(p, f); if (c > m) { m = c; mejor = f; } }
  return mejor;
}
// Lo que pide, con la fruta ya elegida
export function pideCon(rc, variante) {
  return rc.pide.map((x) => (x.k === 'fruta' ? { k: variante || 'fruta', n: x.n } : x));
}
// Lo que sale: la mermelada de frutilla es el frasco de dulce de siempre (conservas.js)
export function daDe(rc, variante) {
  if (rc.da.id !== 'mermelada') return { ...rc.da };
  const f = FRUTAS.includes(variante) ? variante : 'frambuesa';
  return { id: f === 'frutilla' ? 'frasco-frutilla' : `mermelada-${f}`, n: rc.da.n };
}
export function nombreCon(rc, variante) {
  if (rc.da.id === 'mermelada' && FRUTAS.includes(variante)) return `Mermelada de ${INGREDIENTES[variante].corto.replace(/s$/, '')}`;
  return rc.nombre;
}

// ---------------------------------------------------------------- lo que sale (la alacena)
// `forma`: cómo se ve en la alacena (cocina-mundo.js). `efecto`: al comerlo (main.js ya los sabe aplicar:
// `descanso` horas de buen paso, `calor` saca el entumecido; `invierno`: más descanso en invierno).
export const COMIDAS = {
  asado: { nombre: 'Asado', porcion: 'una porción de asado', forma: 'fuente', color: '#8a4a2a', efecto: { descanso: 3, calor: true }, sub: 'Con pan, de parado, como se come el asado' },
  'cordero-asado': { nombre: 'Cordero al asador', porcion: 'una porción de cordero', forma: 'fuente', color: '#9a5a32', efecto: { descanso: 3, calor: true }, sub: 'Crocante el cuero, tierna la carne' },
  locro: { nombre: 'Locro', porcion: 'un plato de locro', forma: 'olla', color: '#c8902a', efecto: { descanso: 3, calor: true }, sub: 'Calentito, de los que llenan' },
  curanto: { nombre: 'Curanto', porcion: 'un plato de curanto', forma: 'olla', color: '#8a7a5a', efecto: { descanso: 3, calor: true }, sub: 'Con el caldito del fondo de la olla' },
  'chocolate-caliente': { nombre: 'Chocolate caliente', porcion: 'una taza de chocolate', forma: 'jarra', color: '#5a3424', efecto: { descanso: 1, calor: true, invierno: 2 }, sub: 'Espeso, de los que se toman con cuchara' },
  'dulce-leche': { nombre: 'Dulce de leche', porcion: 'una cucharada de dulce de leche', forma: 'frasco', color: '#8a5228', efecto: { descanso: 1 }, sub: 'Del frasco, con la cuchara: no lo ve nadie' },
  'mermelada-frambuesa': { nombre: 'Mermelada de frambuesa', porcion: 'pan con mermelada de frambuesa', forma: 'frasco', color: '#8a1e3a', efecto: { descanso: 1 }, sub: 'Untada en pan' },
  'mermelada-cereza': { nombre: 'Mermelada de cereza', porcion: 'pan con mermelada de cereza', forma: 'frasco', color: '#6a1420', efecto: { descanso: 1 }, sub: 'Untada en pan' },
  'mermelada-ciruela': { nombre: 'Mermelada de ciruela', porcion: 'pan con mermelada de ciruela', forma: 'frasco', color: '#4a1a3a', efecto: { descanso: 1 }, sub: 'Untada en pan' },
  'mermelada-manzana': { nombre: 'Mermelada de manzana', porcion: 'pan con mermelada de manzana', forma: 'frasco', color: '#c8923a', efecto: { descanso: 1 }, sub: 'Untada en pan' },
  'mermelada-pera': { nombre: 'Mermelada de pera', porcion: 'pan con mermelada de pera', forma: 'frasco', color: '#c8b05a', efecto: { descanso: 1 }, sub: 'Untada en pan' },
  'mermelada-grosella': { nombre: 'Mermelada de grosella', porcion: 'pan con mermelada de grosella', forma: 'frasco', color: '#a8202a', efecto: { descanso: 1 }, sub: 'Untada en pan, ácida y rica' },
};
export const esComida = (id) => typeof id === 'string' && Object.hasOwn(COMIDAS, id);
// Lo que se ve en la alacena (además de las comidas): lo de siempre que se guarda ahí
export const ALACENA_EXTRA = {
  'pan-casero': { nombre: 'Pan casero', forma: 'pan', color: '#b07a3a' },
  empanadas: { nombre: 'Empanadas', forma: 'empanada', color: '#c8924a' },
  'frasco-frutilla': { nombre: 'Dulce de frutilla', forma: 'frasco', color: '#a8322b' },
  miel: { nombre: 'Miel', forma: 'frasco', color: '#d8a030' },
  harina: { nombre: 'Harina', forma: 'paquete', color: '#e8e2d2', cosa: true },
  yerba: { nombre: 'Yerba', forma: 'paquete', color: '#7a8a4a', cosa: true },
  azucar: { nombre: 'Azúcar', forma: 'paquete', color: '#f2eee6', cosa: true },
  sal: { nombre: 'Sal gruesa', forma: 'paquete', color: '#d8d8d0', cosa: true },
  cacao: { nombre: 'Cacao', forma: 'paquete', color: '#5a3a2a', cosa: true },
  maiz: { nombre: 'Maíz pisado', forma: 'paquete', color: '#e8c860', cosa: true },
  porotos: { nombre: 'Porotos', forma: 'paquete', color: '#8a3a2a', cosa: true },
};
// La alacena: lo que hay, en el orden en que se acomoda (frascos arriba, fuentes y ollas abajo, paquetes al medio).
// Devuelve [{ id, nombre, forma, color, n }] con lo que tenga algo.
const ORDEN_FORMA = { frasco: 0, jarra: 1, paquete: 2, pan: 3, empanada: 3, fuente: 4, olla: 4 };
export function alacenaDe(p) {
  const lista = [];
  for (const [id, c] of [...Object.entries(COMIDAS), ...Object.entries(ALACENA_EXTRA)]) {
    const n = cuantoHay(p, id);
    if (n > 0) lista.push({ id, nombre: c.nombre, forma: c.forma, color: c.color, n });
  }
  return lista.sort((a, b) => ORDEN_FORMA[a.forma] - ORDEN_FORMA[b.forma]);
}
// Cuántas cosas distintas hay (para la alacena «llena»)
export const variedadAlacena = (p) => alacenaDe(p).length;

// Lo que pasa al comer `id` (o null si no es de la cocina). `invierno`: si es invierno.
export function efectoDeComer(id, invierno = false) {
  const c = COMIDAS[id];
  if (!c) return null;
  const e = c.efecto || {};
  return { descanso: (e.descanso || 0) + (invierno && e.invierno ? e.invierno - (e.descanso || 0) : 0), calor: !!e.calor, nombre: c.nombre, porcion: c.porcion, sub: c.sub };
}

// ---------------------------------------------------------------- el estado guardado
// progreso.cocina: { sabe: { receta: { dia, de } }, cambios: { vecino: dia }, hechas: { receta: n }, moviles: { id: coccion },
//   perro: dia (el último chorizo robado), sobremesa: { x, z, hasta, claves } | null }
export function cocinaNueva() { return { sabe: {}, cambios: {}, hechas: {}, moviles: {}, perro: 0, sobremesa: null }; }
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const entero = (v, d = 0) => Math.floor(num(v, d));
const TOPE_DIA = 1e6;
const diaValido = (v, d = 1) => Math.max(1, Math.min(TOPE_DIA, entero(v, d)));
const claveSana = (k) => typeof k === 'string' && /^[a-z0-9_-]{1,40}$/i.test(k);
export function sanearCocina(x0, hoy = TOPE_DIA) {
  const x = objeto(x0) ? x0 : {};
  const base = cocinaNueva();
  const tope = Math.max(1, Math.min(TOPE_DIA, entero(hoy, TOPE_DIA)));
  if (objeto(x.sabe)) for (const [id, v] of Object.entries(x.sabe)) {
    if (!esRecetaPasos(id)) continue;
    const de = objeto(v) && claveSana(v.de) ? v.de : 'hecha';
    base.sabe[id] = { dia: Math.min(tope, diaValido(objeto(v) ? v.dia : 1)), de };
  }
  if (objeto(x.cambios)) for (const [k, d] of Object.entries(x.cambios)) if (claveSana(k) && Object.hasOwn(CAMBIOS_VECINOS, k)) base.cambios[k] = Math.min(tope, diaValido(d));
  if (objeto(x.hechas)) for (const [id, n] of Object.entries(x.hechas)) if (esRecetaPasos(id)) base.hechas[id] = Math.max(0, Math.min(1e6, entero(n)));
  if (objeto(x.moviles)) for (const [id, c] of Object.entries(x.moviles)) { if (!claveSana(id)) continue; const s = sanearCoccion(c, tope); if (s) base.moviles[id] = s; }
  base.perro = Math.max(0, Math.min(tope, entero(x.perro)));
  const s = x.sobremesa;
  if (objeto(s) && Number.isFinite(Number(s.x)) && Number.isFinite(Number(s.z)) && Math.abs(Number(s.x)) < 1e4 && Math.abs(Number(s.z)) < 1e4) {
    const claves = (Array.isArray(s.claves) ? s.claves : []).filter(claveSana).slice(0, COCINA.invitados);
    const hasta = num(s.hasta, 0);
    if (claves.length && hasta > 0 && hasta < (tope + 2) * 24) base.sobremesa = { x: Number(s.x), z: Number(s.z), hasta, claves };
  }
  return base;
}

// La cocción en curso de una estación (o null). paso: el próximo a hacer (1…); falta: horas hasta poder hacerlo.
export function sanearCoccion(c0, hoy = TOPE_DIA) {
  if (!objeto(c0) || !esRecetaPasos(c0.receta)) return null;
  const rc = RECETA_PASOS[c0.receta];
  const paso = Math.max(1, Math.min(rc.pasos.length - 1, entero(c0.paso, 1)));
  const espera = rc.pasos[paso - 1].espera || 0;
  const falta = Math.max(0, Math.min(espera, num(c0.falta, espera)));
  const variante = rc.pide.some((x) => x.k === 'fruta') ? (FRUTAS.includes(c0.variante) ? c0.variante : 'frambuesa') : null;
  const invitados = (Array.isArray(c0.invitados) ? c0.invitados : []).filter(claveSana).slice(0, COCINA.invitados);
  return {
    receta: rc.id, paso, falta, variante,
    desde: Math.min(Math.max(1, Math.min(TOPE_DIA, entero(hoy, TOPE_DIA))), diaValido(c0.desde)),
    pausa: !!c0.pausa, robado: !!c0.robado, invitados, aOjo: !!c0.aOjo,
  };
}

// ---------------------------------------------------------------- el recetario
// ¿La sabés? (de entrada, o te la enseñaron, o ya la hiciste)
export function sabe(cocina, id) {
  const rc = RECETA_PASOS[id];
  return !!rc && (!!rc.deEntrada || !!cocina?.sabe?.[id]);
}
export function aprender(cocina, id, de, dia) {
  if (!esRecetaPasos(id) || !cocina) return false;
  if (cocina.sabe[id]) return false;
  cocina.sabe[id] = { dia: diaValido(dia), de: claveSana(de) ? de : 'hecha' };
  return true;
}
// Quién te la puede enseñar (texto de la pista)
export const QUIEN_ENSENA = {
  madre: 'Gladys, la vecina de los dulces', nelida: 'Nélida, la del almacén', abuela: 'la abuela Herminia', galesa: 'Ceinwen, la de la casa de té',
  jefe: 'Ernesto, el jefe de estación', ramon: 'Don Ramón, el puestero',
};
// Lo que dice cada vecino al enseñar
export const AL_ENSENAR = {
  madre: ['¿Mermelada? Es lo más fácil del mundo, y lo más lindo.', 'Fruta y azúcar, mitad y mitad. Fuego bajo y la cuchara de madera: que no se pegue.', 'Sabés que está cuando una gota en un plato frío no se corre. Frascos hervidos, y a tapar en caliente.'],
  nelida: ['El dulce de leche de mi abuela… a ver si me acuerdo bien.', 'Leche y azúcar, y una pizca de bicarbonato. Después, revolver. Mucho. Horas.', 'Cuando la cuchara deja un surco en el fondo, está. No lo dejes solo, que se quema en un segundo.'],
  abuela: ['El locro, m\'hijo, se hace de a mucho, porque se convida.', 'El maíz y los porotos en remojo desde la noche antes. Hierven primero; después va el zapallo, que se deshace y lo espesa, y la carne de chancho con el chorizo.', 'Y no se apura. Un locro apurado no es locro.'],
  galesa: ['El chocolate de los días de nieve. En la casa de té lo hacemos así.', 'Leche entera, cacao amargo y azúcar. Se bate en la olla sin que llegue a hervir: apenas que humee.', 'Espeso, de los que se toman con cuchara. Con una porción de torta negra, ni te cuento.'],
  jefe: ['¿Curanto? Mi viejo era de Chiloé. Allá se hace en un pozo, con piedras calientes.', 'Acá lo hacemos en olla: los mariscos abajo, la carne de cerdo y el chorizo, las papas, y todo tapado con hojas de nalca.', 'Que se cocine con su vapor, dos horas. Y se destapa con todos alrededor, que es lo mejor.'],
  ramon: ['El cordero al asador no tiene secreto: tiene paciencia.', 'Abierto en la cruz, atado con alambre, a un metro de las brasas. Primero del lado de adentro, un par de horas largas.', 'Después se da vuelta para que el cuero quede crocante. Salmuera con romero, si tenés. Y nada de apurarlo.'],
};
// Los vecinos que enseñan: clave → receta
export const ENSENAN = Object.fromEntries(RECETAS_PASOS.filter((r) => r.ensena).map((r) => [r.ensena, r.id]));
// La pista del recetario de una receta que no sabés
export function pistaReceta(rc) {
  if (rc.ensena) return `Te la puede enseñar ${QUIEN_ENSENA[rc.ensena] || rc.ensena}. También se aprende haciéndola a ojo, si tenés todo.`;
  return 'Se aprende haciéndola.';
}

// ---------------------------------------------------------------- el trueque con los vecinos
// Una vez por día cada uno, desde la charla («Cambiar algo para la cocina»). `da`: [id, n] (a lo juntado);
// `pide`: { tipo: 'material' | 'cosa' | 'entrada', k, n } (lo de siempre: troncos, tablas, papas, yerba, cantos…).
export const CAMBIOS_VECINOS = {
  padre: [{ da: ['carne-vaca', 2], pide: { tipo: 'material', k: 'tronco', n: 3 } }, { da: ['chorizo', 4], pide: { tipo: 'material', k: 'tronco', n: 2 } }],
  madre: [{ da: ['zapallo', 1], pide: { tipo: 'entrada', k: 'papa', n: 2 } }, { da: ['carne-cerdo', 2], pide: { tipo: 'entrada', k: 'pinon', n: 4 } }],
  abuela: [{ da: ['leche', 4], pide: { tipo: 'cosa', k: 'yerba', n: 1 } }],
  nelida: [{ da: ['manzana', 4], pide: { tipo: 'entrada', k: 'canto', n: 1 } }, { da: ['pera', 4], pide: { tipo: 'entrada', k: 'canto', n: 1 } }],
  galesa: [{ da: ['cereza', 4], pide: { tipo: 'cosa', k: 'yerba', n: 1 } }, { da: ['ciruela', 4], pide: { tipo: 'cosa', k: 'yerba', n: 1 } }],
  jefe: [{ da: ['mariscos', 2], pide: { tipo: 'material', k: 'tronco', n: 2 } }],
  herbolaria: [{ da: ['frambuesa', 4], pide: { tipo: 'cosa', k: 'yerba', n: 1 } }, { da: ['grosella', 4], pide: { tipo: 'cosa', k: 'yerba', n: 1 } }],
  ramon: [{ da: ['carne-cordero', 3], pide: { tipo: 'material', k: 'tabla', n: 3 } }],
};
// Cómo se nombra lo que piden
export const NOMBRE_PAGO = {
  tronco: ['troncos', 'tronco'], tabla: ['tablas', 'tabla'], papa: ['papas', 'papa'], pinon: ['piñones', 'piñón'],
  yerba: ['de yerba', 'de yerba'], canto: ['cantos rodados', 'canto rodado'],
};
export function textoCantidad(k, n) {
  if (Object.hasOwn(INGREDIENTES, k)) return `${n} ${n === 1 ? INGREDIENTES[k].uno : INGREDIENTES[k].nombre}`;
  if (Object.hasOwn(NOMBRE_PAGO, k)) return `${n} ${n === 1 ? NOMBRE_PAGO[k][1] : NOMBRE_PAGO[k][0]}`;
  return `${n} ${k}`;
}
// ¿Ya cambió hoy con este vecino?
export const cambioHoy = (cocina, clave, dia) => (cocina?.cambios?.[clave] || 0) === diaValido(dia);
// Cuánto tenés de lo que piden: `cuanto(tipo, k)` lo dice main.js
export function cambiosDe(clave, cocina, dia, cuanto) {
  if (!Object.hasOwn(CAMBIOS_VECINOS, clave)) return [];
  const hoy = cambioHoy(cocina, clave, dia);
  return CAMBIOS_VECINOS[clave].map((c, i) => {
    const tenes = Math.max(0, Math.floor(Number(cuanto?.(c.pide.tipo, c.pide.k)) || 0));
    return { i, da: c.da, pide: c.pide, tenes, alcanza: tenes >= c.pide.n, hoy,
      titulo: `${textoCantidad(c.da[0], c.da[1])} por ${textoCantidad(c.pide.k, c.pide.n)} (tenés ${tenes})` };
  });
}
// Hacer el cambio i: devuelve { ok, efectos: [{ tipo, k, n }], renglones } (los efectos los aplica main.js)
export const FRASES_CAMBIO = {
  hecho: '¡Trato hecho! Que salga rico.',
  yaHoy: 'Por hoy ya cambiamos. Mañana vemos, ¿dale?',
  falta: 'Me parece que no te alcanza. Volvé cuando tengas.',
  abre: '¿Qué precisás para la cocina?',
};
export function cambiar(clave, i, cocina, dia, cuanto) {
  const lista = cambiosDe(clave, cocina, dia, cuanto);
  const c = lista[i];
  if (!c) return { ok: false, renglones: [FRASES_CAMBIO.falta] };
  if (c.hoy) return { ok: false, renglones: [FRASES_CAMBIO.yaHoy] };
  if (!c.alcanza) return { ok: false, renglones: [FRASES_CAMBIO.falta] };
  cocina.cambios[clave] = diaValido(dia);
  return {
    ok: true,
    efectos: [{ tipo: c.pide.tipo, k: c.pide.k, n: -c.pide.n }, { tipo: 'entrada', k: c.da[0], n: c.da[1] }],
    renglones: [FRASES_CAMBIO.hecho],
    titulo: `${textoCantidad(c.da[0], c.da[1])}`,
  };
}

// ---------------------------------------------------------------- qué hace falta, y textos
export function textoPide(pide) {
  const partes = pide.map((x) => (x.k === 'fruta' ? `${x.n} frutas (de una sola clase)` : textoCantidad(x.k, x.n)));
  return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}` : partes[0] || '';
}
// Lo que falta para empezar (null si está todo). `troncos`: los que tenés a mano.
export function faltaPara(rc, p, est, troncos) {
  const variante = varianteDe(rc, p);
  const falta = [];
  for (const x of rc.pide) {
    if (x.k === 'fruta') { if (!variante) falta.push(`${x.n} frutas de una misma clase`); continue; }
    const hay = cuantoHay(p, x.k);
    if (hay < x.n) falta.push(textoCantidad(x.k, x.n - hay));
  }
  const lena = est?.lena || 0;
  if ((Number(troncos) || 0) < lena) falta.push(`${lena - (Number(troncos) || 0)} ${lena - (Number(troncos) || 0) === 1 ? 'tronco' : 'troncos'} de leña`);
  return falta.length ? falta : null;
}
// ¿Llueve sobre la estación? (sólo la de afuera sin techo)
export const sinTechoConLluvia = (est, lluvia) => !!est?.afuera && !est.techo && (Number(lluvia) || 0) > COCINA.lluvia;
// Las recetas de una estación para el panel: [{ rc, sabe, aOjo, puede, falta, texto }]
export function opcionesEstacion(est, p, troncos) {
  const cocina = p?.cocina || cocinaNueva();
  return recetasDe(est.tipo || est.id).map((rc) => {
    const sabida = sabe(cocina, rc.id);
    const falta = faltaPara(rc, p, est, troncos);
    const variante = varianteDe(rc, p);
    return { rc, sabe: sabida, aOjo: !sabida && !falta, puede: !falta, falta, variante, nombre: nombreCon(rc, variante) };
  });
}

// ---------------------------------------------------------------- la cocción
// Empezar: prender el fuego (gasta la leña) y dejar todo preparado (gasta los ingredientes). Devuelve
// { ok, coccion, gasta: { lena, ingredientes: [{ k, n }] }, motivo }. No toca el progreso: lo gasta main.js con
// `gastarIngredientes` (así una prueba lo puede mirar antes).
export function empezar(rc0, est, p, troncos, { lluvia = 0, dia = 1 } = {}) {
  const rc = typeof rc0 === 'string' ? RECETA_PASOS[rc0] : rc0;
  if (!rc || !est || rc.estacion !== (est.tipo || est.id)) return { ok: false, motivo: 'Eso no se hace acá' };
  if (sinTechoConLluvia(est, lluvia)) return { ok: false, motivo: 'lluvia' };
  const falta = faltaPara(rc, p, est, troncos);
  if (falta) return { ok: false, motivo: 'falta', falta };
  const variante = varianteDe(rc, p);
  const aOjo = !sabe(p?.cocina, rc.id);
  return {
    ok: true,
    coccion: { receta: rc.id, paso: 1, falta: rc.pasos[0].espera || 0, variante, desde: diaValido(dia), pausa: false, robado: false, invitados: [], aOjo },
    gasta: { lena: est.lena || 0, ingredientes: pideCon(rc, variante) },
  };
}
export function gastarIngredientes(p, lista) {
  for (const x of lista || []) gastar(p, x.k, x.n);
}
// El paso que sigue (el objeto del paso) y si ya se puede hacer
export function pasoActual(c) {
  const rc = c && RECETA_PASOS[c.receta];
  if (!rc) return null;
  const paso = rc.pasos[c.paso];
  return paso ? { rc, paso, listo: !(c.falta > 0) && !c.pausa, anterior: rc.pasos[c.paso - 1] } : null;
}
// Pasa el tiempo (horas del juego). Con lluvia sobre una estación de afuera sin techo, las brasas se ahogan y
// no corre (`pausa`). Devuelve true si el paso que sigue acaba de quedar listo.
export function avanzarCoccion(c, horas, est, lluvia = 0) {
  if (!c || !(horas > 0)) return false;
  const pausa = sinTechoConLluvia(est, lluvia);
  c.pausa = pausa;
  if (pausa || !(c.falta > 0)) return false;
  c.falta = Math.max(0, c.falta - horas);
  return c.falta === 0;
}
// E en la estación con algo al fuego: hace el paso que sigue (si está listo). Devuelve
// { accion: 'paso' | 'fin' | 'espera' | 'lluvia', paso, faltan (minutos), da (al final), nombre }.
// Al final la cocción queda terminada: quien la guarda la borra.
export function hacerPaso(c) {
  const a = pasoActual(c);
  if (!a) return { accion: 'nada' };
  if (c.pausa) return { accion: 'lluvia', paso: a.paso, mientras: a.anterior?.mientras };
  if (c.falta > 0) return { accion: 'espera', paso: a.paso, mientras: a.anterior?.mientras, faltan: minutos(c.falta) };
  if (a.paso.fin) {
    const da = daDe(a.rc, c.variante);
    if (a.rc.chorizos && c.robado) da.n = Math.max(1, da.n - COCINA.robo);
    c.terminada = true;
    return { accion: 'fin', paso: a.paso, da, nombre: nombreCon(a.rc, c.variante), rc: a.rc };
  }
  c.paso += 1;
  c.falta = a.paso.espera || 0;
  return { accion: 'paso', paso: a.paso, rc: a.rc };
}
// Los minutos (de a diez, y al menos diez) que faltan
export const minutos = (horas) => Math.max(10, Math.ceil((Number(horas) || 0) * 6) * 10);
export function textoFaltan(horas) {
  const m = minutos(horas);
  if (m < 60) return `unos ${m} minutos`;
  const h = Math.floor(m / 60), r = m % 60;
  if (!r) return h === 1 ? 'una hora' : `${h} horas`;
  return h === 1 ? `una hora y ${r} minutos` : `${h} horas y ${r} minutos`;
}

// El aviso de la estación (lo mismo que hace E). `opciones`: las de opcionesEstacion (si no hay nada al fuego).
export function avisoEstacion(est, c, opciones = [], lluvia = 0) {
  if (c) {
    const a = pasoActual(c);
    if (!a) return est.nombre;
    if (c.pausa) return `${nombreCon(a.rc, c.variante)}: la lluvia ahogó las brasas (hace falta un techito)`;
    if (c.falta > 0) return `${nombreCon(a.rc, c.variante)}: ${a.anterior?.mientras?.toLowerCase() || 'al fuego'} (${textoFaltan(c.falta)})`;
    return a.paso.accion;
  }
  if (sinTechoConLluvia(est, lluvia)) return `${est.nombre}: con lluvia hace falta un techito`;
  const se = opciones.filter((o) => o.puede);
  if (!se.length) return `${est.nombre}: ver las recetas`;
  if (se.length === 1) return `${est.verbo} ${se[0].nombre.charAt(0).toLowerCase()}${se[0].nombre.slice(1)}`;
  return `${est.verbo}: ${se.map((o) => o.nombre.charAt(0).toLowerCase() + o.nombre.slice(1)).join(' o ')}`;
}

// ---------------------------------------------------------------- el humo y el olor (para el mundo)
// { humo: 0…1 (cuánto humo sale), olor: 'asado' | 'pan' | 'dulce' | 'guiso' | null (a qué huele),
//   carne: si la carne está en la cruz, chorizos: si hay chorizos en la parrilla (para el perro) }
export function humoDe(c) {
  const a = c && pasoActual(c);
  if (!a) return { humo: 0, olor: null, carne: false, chorizos: false };
  if (c.pausa) return { humo: 0.25, olor: null, carne: false, chorizos: false };
  const cocinando = c.paso >= 2;
  const carne = !!a.rc.enCruz && c.paso >= a.rc.enCruz;
  return {
    humo: cocinando ? (a.rc.estacion === 'parrilla' ? 1 : 0.6) : 0.5,
    olor: cocinando ? a.rc.olor || null : null,
    carne, chorizos: carne && !!a.rc.chorizos && !c.robado,
  };
}
// ¿Trae vecinos? (el olor del asado, de día)
export const traeVecinos = (c, hora) => humoDe(c).olor === 'asado' && hora >= COCINA.horaInvitados[0] && hora < COCINA.horaInvitados[1];
// Quiénes vienen: de los `candidatos` ({ clave, libre, amistad (0…), chico }), los libres y grandes, primero los
// que más te quieren (y el orden de la lista, para que sea siempre igual). Hasta COCINA.invitados.
export function elegirInvitados(candidatos, cuantos = COCINA.invitados) {
  return (candidatos || []).map((c, i) => ({ ...c, i }))
    .filter((c) => c && c.libre && !c.chico && claveSana(c.clave))
    .sort((a, b) => (Number(b.amistad) || 0) - (Number(a.amistad) || 0) || a.i - b.i)
    .slice(0, Math.max(0, cuantos)).map((c) => c.clave);
}
// Dónde se para cada invitado alrededor de la estación (en el marco de la obra: frente = +z local, donde te parás
// vos): a los costados y atrás (nunca delante del fuego), a `radio` metros, mirando al fuego. `rot`: el giro de la obra.
// (a 2,8 m y de costado-atrás: parado adelante de la parrilla, E sigue siendo para el asado y no para hablarles)
export const ANGULOS_RONDA = [1.9, -1.9, 2.6, -2.6];
export function lugaresAlrededor(x, z, rot, n, radio = 2.8) {
  const lista = [];
  for (let i = 0; i < n; i++) {
    const a = ANGULOS_RONDA[i % ANGULOS_RONDA.length] + rot;
    const r = radio + Math.floor(i / ANGULOS_RONDA.length) * 0.9;
    const px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r;
    lista.push({ x: px, z: pz, mira: Math.atan2(x - px, z - pz) });
  }
  return lista;
}
// Lo que dicen al llegar y al comer (uno por invitado, en orden)
export const FRASES_ASADO = {
  llegan: ['¡Qué olorcito! ¿Se puede?', 'Venía pasando y el humo me trajo.', 'Ese asado se siente desde la vía.'],
  esperan: ['¿Le falta mucho?', 'Así, despacito, que se haga bien.', 'Yo traje el pan, por las dudas.'],
  comen: ['¡Una delicia, vecino!', 'Como los de mi viejo.', 'Para chuparse los dedos.'],
};
// El perro y el chorizo: lo que se dice
export const FRASES_PERRO = {
  roba: '¡{perro} se robó un chorizo!',
  sub: 'Se lo lleva corriendo, con la cola parada. Uno menos para la mesa',
  sinNombre: '¡El perro se robó un chorizo!',
};

// ---------------------------------------------------------------- el cuaderno
// Las entradas del cuaderno para lo que sale de la cocina (en «Al fuego», con cuántas tenés) y para lo del
// almacén (en «Del almacén»: cada cambio de trueque.js tiene la suya).
export const ENTRADAS_COCINA = [
  { id: 'asado', seccion: 'recetas', nombre: 'Asado a la cruz', modo: 'cocinar', pista: 'Carne de vaca, chorizos y sal gruesa, en una parrilla con cruz (O → Exterior).',
    texto: RECETA_PASOS.asado.texto },
  { id: 'cordero-asado', seccion: 'recetas', nombre: 'Cordero al asador', modo: 'cocinar', pista: 'Cordero y sal gruesa, en la cruz de la parrilla. Don Ramón te enseña.',
    texto: RECETA_PASOS['cordero-asador'].texto },
  { id: 'locro', seccion: 'recetas', nombre: 'Locro', modo: 'cocinar', pista: 'Maíz pisado, porotos, zapallo, carne de cerdo y chorizo, en la cocina a leña. La abuela Herminia te enseña.',
    texto: RECETA_PASOS.locro.texto },
  { id: 'curanto', seccion: 'recetas', nombre: 'Curanto en olla', modo: 'cocinar', pista: 'Mariscos, carne de cerdo, chorizo y papas, en la cocina a leña. Ernesto te enseña.',
    texto: RECETA_PASOS.curanto.texto },
  { id: 'chocolate-caliente', seccion: 'recetas', nombre: 'Chocolate caliente de la cocina', modo: 'cocinar', pista: 'Leche, cacao y azúcar, en la cocina a leña. Ceinwen te enseña.',
    texto: RECETA_PASOS['chocolate-caliente'].texto },
  { id: 'dulce-leche', seccion: 'recetas', nombre: 'Dulce de leche', modo: 'cocinar', pista: 'Leche y azúcar, horas en la cocina a leña. Nélida te enseña.',
    texto: RECETA_PASOS['dulce-leche'].texto },
  ...['frambuesa', 'cereza', 'ciruela', 'manzana', 'pera', 'grosella'].map((f) => ({
    id: `mermelada-${f}`, seccion: 'recetas', nombre: COMIDAS[`mermelada-${f}`].nombre, modo: 'cocinar',
    pista: `Cuatro ${INGREDIENTES[f].nombre} y azúcar, en la cocina a leña. Gladys te enseña.`,
    texto: `${RECETA_PASOS.mermeladas.texto.split('.')[0]}. La de ${INGREDIENTES[f].corto.replace(/s$/, '')} sale de ${INGREDIENTES[f].de}.`,
  })),
  // lo del almacén de Ercilia (trueque.js)
  { id: 'azucar', seccion: 'trueque', nombre: 'Un kilo de azúcar', cientifico: 'cambiada en el almacén', modo: 'cambiar', pista: 'Ercilia la cambia por piñones y ramitas.',
    texto: 'Azúcar blanca en bolsa de papel, de la que sube con el tren. Para las mermeladas, el dulce de leche y el chocolate.' },
  { id: 'sal', seccion: 'trueque', nombre: 'Sal gruesa', cientifico: 'cambiada en el almacén', modo: 'cambiar', pista: 'Ercilia la cambia por un canto rodado y ramitas.',
    texto: 'Sal gruesa de las salinas de la costa, en un cucurucho. Sin sal gruesa no hay asado.' },
  { id: 'cacao', seccion: 'trueque', nombre: 'Cacao amargo', cientifico: 'cambiado en el almacén', modo: 'cambiar', pista: 'Ercilia lo cambia por calafates y una pluma.',
    texto: 'Cacao amargo en polvo, en lata. El de los chocolates de los días de nieve.' },
  { id: 'maiz', seccion: 'trueque', nombre: 'Maíz blanco pisado', cientifico: 'cambiado en el almacén', modo: 'cambiar', pista: 'Ercilia lo cambia por piñones.',
    texto: 'Maíz blanco partido, para el locro. Se deja en remojo desde la noche antes.' },
  { id: 'porotos', seccion: 'trueque', nombre: 'Porotos', cientifico: 'cambiados en el almacén', modo: 'cambiar', pista: 'Ercilia los cambia por calafates y un canto rodado.',
    texto: 'Porotos blancos secos, de la cosecha pasada. Para el locro y los guisos de invierno.' },
];

// ---------------------------------------------------------------- la mochila
// Las casillas de lo de la cocina que se lleva encima (main.js las suma al final de la mochila, sin repetir lo
// que ya tenga casilla: la granja puede poner las suyas). `icono`: los de mochila.js.
const ICONO = { fuente: 'asado', olla: 'olla', jarra: 'taza', frasco: 'frasco', pan: 'pan', empanada: 'empanada', paquete: 'harina' };
export function ranurasCocina(p, ya = null) {
  const r = [];
  const tiene = (id) => (ya ? ya.has(id) : false);
  for (const [id, c] of Object.entries(COMIDAS)) {
    const n = cuantoHay(p, id);
    if (n > 0 && !tiene(id)) r.push({ id, nombre: c.nombre, icono: ICONO[c.forma] || 'frasco', cuenta: n, accion: 'comer', texto: `De tu cocina. ${COMIDAS[id].sub}.` });
  }
  for (const k of [...DEL_ALMACEN, 'zapallo', 'mariscos', ...DE_LA_GRANJA]) {
    const n = cuantoHay(p, k);
    if (n > 0 && !tiene(k)) r.push({ id: k, nombre: INGREDIENTES[k].corto.charAt(0).toUpperCase() + INGREDIENTES[k].corto.slice(1), icono: iconoIngrediente(k), cuenta: n, texto: `Para la cocina: ${INGREDIENTES[k].de}.` });
  }
  return r;
}
function iconoIngrediente(k) {
  // (los de la granja, con los iconos de granja.js)
  if (INGREDIENTES[k]?.fruta && INGREDIENTES[k]?.granja) return `fruta-${k}`;
  if (INGREDIENTES[k]?.fruta) return 'fruta';
  if (k === 'chorizo') return 'chorizo';
  if (k.startsWith('carne')) return 'carne';
  if (k === 'leche') return 'leche';
  if (k === 'zapallo') return 'papa';
  if (k === 'mariscos') return 'trucha';
  return 'harina';
}
