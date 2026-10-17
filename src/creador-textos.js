// 4.1 (F2 y F4): TODOS los textos de Bruno que se muestran, en un solo lugar. Módulo puro (sin three ni DOM): se prueba en Node.
//
// TEXTOS PROPUESTOS POR CLAUDE, A REVISAR POR EL USUARIO (F4, 17-10-2026): las 5 pantallas del prólogo son las que eligió el usuario, tal cual; las 32 tarjetas del carácter
// y las 26 líneas de asado y lluvia de los vecinos las escribió Claude con el tono acordado (calmo, esperanzado, voseo; humor suave en gustos y defectos).
// Para cambiar cualquier texto se edita ESTE archivo y nada más: la pantalla de creación, la ficha del cuaderno, el prólogo y la charla de los vecinos leen de acá.
// Sólo castellano: el inglés se hace al final de todo.
//
// Lo que dicen el pro y el contra es lo que HACE el juego (src/creador-catalogo.js, src/creador-efectos.js, CAMBIOS_4_1_F3.md):
//   · abrigo: la ropa abriga un punto más o menos al dormir una noche de invierno sin fuego (tope de ±1 punto);
//   · afecto: cada gesto bueno con un vecino suma hasta un 20 % más o menos; los gustos suman un poco más sólo con quien los comparte (el mate, la mitad);
//   · pesca: los peces tardan menos o más en picar (hasta ±20 %);
//   · cuaderno: la mirada que anota las constelaciones y la luna llena dura menos o más (hasta ±20 %). Es lo único del cuaderno que cambia: por eso dice «el cielo».
//   · «sabor» (SABOR, abajo): el pro o el contra de un rasgo sin efecto. Es sólo color: NO promete nada que el juego haga.
import { contribuciones, sanearGenoma, efectosAplicados, efectosBrutos, sistemasAlTope, PROTAGONISTA } from './creador-personaje.js';
import { PERSONALIDADES, OFICIOS, GUSTOS, HOBBIES, VIRTUDES, DEFECTOS, SISTEMAS } from './creador-catalogo.js';

export const NOMBRE_SISTEMA = { abrigo: 'el abrigo', afecto: 'el trato con los vecinos', pesca: 'la pesca', cuaderno: 'el cuaderno' };

// ---------------------------------------------------------------- el prólogo (5 pantallas; los textos los eligió el usuario el 17-10-2026)
export const PROLOGO = [
  { titulo: 'La ciudad', texto: 'Sos Bruno Castellanos. Veintisiete años, un trabajo que te dejó vacío y una ciudad que nunca baja el volumen. Cada día te cuesta más escuchar lo que querés. Y lo que querés, cada vez más, es silencio.' },
  { titulo: 'La decisión', texto: 'Una mañana cualquiera, entre dos subtes llenos, te das cuenta de que no querés seguir así. No hay drama: dejás el trabajo, juntás lo que cabe en una mochila y decidís mudarte adonde el día dure lo que tiene que durar.' },
  { titulo: 'El viaje', texto: 'El tren avanza y el mundo se aquieta. Primero se van los edificios, después las bocinas, al final hasta las ganas de mirar el celular. Por la ventana pasan potreros, ríos, nieve lejana. Algo adentro tuyo respira por primera vez.' },
  { titulo: 'La llegada', texto: 'Cuando el valle aparece, no lo creés: un lago quieto, cerros que se pierden, humo de alguna chimenea. Junto al camino hay un refugio con la puerta apenas abierta, como si te hubieran estado esperando.' },
  { titulo: 'El primer silencio', texto: 'Esa primera noche no hay ruido que tapar. Sólo el viento entre los árboles y el crujir de la madera. Hacía años que no escuchabas tu propia respiración. Te dormís sin apuro. Mañana empieza todo.' },
];
// Los botones y la ayuda del prólogo (propuestos por Claude).
export const BOTONES_PROLOGO = { siguiente: 'Siguiente', volver: 'Volver', saltar: 'Saltar el prólogo', llegar: 'Llegar al refugio', ayuda: 'Enter o flecha derecha: seguir · Escape: saltar' };

// ---------------------------------------------------------------- las 32 tarjetas del carácter
// frase (hasta 15 palabras), pro y contra (hasta 10 palabras cada uno). Virtud: sólo frase y pro. Defecto: sólo frase y contra.
// En los gustos el pro es siempre la afinidad con los vecinos que lo comparten (el mate, la mitad).
const FAVOR_VECINOS = 'Con quien lo comparte, cada gesto suma un poco más.';
export const TARJETAS = {
  personalidad: {
    tranquilo: { frase: 'Se toma el tiempo para todo, incluso para llegar.', pro: 'Espera sin apuro: los peces pican antes.', contra: 'Le cuesta arrancar: cada gesto con los vecinos suma menos.' },
    curioso: { frase: 'Todo le llama la atención, hasta lo que no entiende.', pro: 'Mira para arriba: anota antes el cielo.', contra: 'Sale sin pensar en el frío: abriga un poco menos.' },
    sociable: { frase: 'Saluda a todo el mundo, y casi todos le contestan.', pro: 'Cada gesto amable con los vecinos suma un poco más.', contra: 'Charla de más y tarda en anotar el cielo.' },
    metodico: { frase: 'Todo en su lugar, a su hora y con su lista.', pro: 'Va preparado: su ropa abriga un poco más.', contra: 'Si el plan cambia, los peces tardan más en picar.' },
    reservado: { frase: 'Prefiere escuchar antes que hablar, y casi nunca se equivoca.', pro: 'Va discreto y abrigado: su ropa abriga un poco más.', contra: 'Le cuesta abrirse: cada gesto con los vecinos suma menos.' },
  },
  oficio: {
    programador: { frase: 'Pasó años entre pantallas, ordenando lo que otros no entendían.', pro: 'Ordena lo que ve: anota antes el cielo.', contra: 'Vivía adentro: su ropa abriga un poco menos.' },
    cocinero: { frase: 'Cocinaba para muchos y todavía no aprendió a cocinar para uno.', pro: 'Convida y se hace querer: los gestos suman más.', contra: 'Mira poco el cielo: tarda más en anotarlo.' },
    contador: { frase: 'Sumaba números todo el día y ahora suma atardeceres.', pro: 'Le gusta llevar las cuentas de todo.', contra: 'No está acostumbrado al trabajo físico.' },
    'tecnico-sonido': { frase: 'Escucha lo que los demás no oyen, hasta el silencio.', pro: 'Oído fino y paciencia: anota antes el cielo.', contra: 'Las charlas largas lo agotan: los gestos suman menos.' },
    mensajero: { frase: 'Pedaleaba con lluvia y con sol; el clima nunca lo frenó.', pro: 'Curtido a la intemperie: su ropa abriga un poco más.', contra: 'Acostumbrado a la prisa: los peces tardan más en picar.' },
    docente: { frase: 'Enseñaba a mirar: colores, formas, silencios.', pro: 'Trato fácil con la gente: los gestos suman más.', contra: 'No sabe quedarse callado: los peces tardan más en picar.' },
  },
  gustos: {
    mate: { frase: 'Para él, una charla sin mate es una charla a medias.', pro: 'Lo comparte casi todo el pueblo: suma apenas un poco.', contra: 'Se le enfría el mate de tanto hablar.' },
    folklore: { frase: 'Tiene una zamba para cada estado de ánimo.', pro: FAVOR_VECINOS, contra: 'Tararea a cualquier hora, hasta cuando nadie pidió música.' },
    lluvia: { frase: 'Es el único que se alegra cuando se nubla.', pro: FAVOR_VECINOS, contra: 'Sale a mojarse: su ropa abriga un poco menos.' },
    trenes: { frase: 'Reconoce un tren por el silbato y te lo cuenta.', pro: FAVOR_VECINOS, contra: 'Pierde horas mirando pasar los trenes.' },
    asado: { frase: 'Cualquier excusa le alcanza para prender el fuego.', pro: FAVOR_VECINOS, contra: 'Siempre cocina de más y después lo lamenta.' },
    libros: { frase: 'Siempre lleva un libro, aunque no tenga tiempo de leerlo.', pro: FAVOR_VECINOS, contra: 'Se acuesta tarde por un capítulo más.' },
  },
  hobby: {
    fotografia: { frase: 'Ve un cuadro en cada esquina y se queda esperando la luz.', pro: 'Sabe esperar la luz justa.', contra: 'Pierde horas mirando, cámara en mano.' },
    pesca: { frase: 'Dice que la caña es una excusa para sentarse.', pro: 'Los peces pican antes.', contra: 'Se queda pescando y tarda más en anotar el cielo.' },
    guitarra: { frase: 'Tiene tres acordes y los toca con convicción.', pro: 'Se luce cuando hay música.', contra: 'Practica de noche, y no siempre avisa.' },
    carpinteria: { frase: 'Mira un árbol y ya calcula cuántas tablas da.', pro: 'Maneja la madera con ojo y buen pulso.', contra: 'Siempre le falta un clavo, una tabla o tiempo.' },
    aves: { frase: 'Frena a mitad del camino por un pío lejano.', pro: 'Ojo entrenado: anota antes el cielo.', contra: 'Horas quieto al aire libre: abriga un poco menos.' },
  },
  virtud: {
    resistente: { frase: 'El frío le pega, pero nunca lo tumba.', pro: 'Aguanta mejor el frío: su ropa abriga un poco más.' },
    paciente: { frase: 'Sabe esperar: un pez, una estación, una respuesta.', pro: 'Los peces pican antes.' },
    simpatico: { frase: 'Cae bien incluso antes de abrir la boca.', pro: 'Cada gesto con los vecinos suma un poco más.' },
    madrugador: { frase: 'Cuando sale el sol, ya lleva dos horas despierto.', pro: 'Levantado temprano, pesca mejor: los peces pican antes.' },
    ahorrativo: { frase: 'Guarda todo por si acaso y remienda lo que se rompe.', pro: 'Remienda y reaprovecha: su ropa abriga un poco más.' },
  },
  defecto: {
    friolero: { frase: 'Sabe cuántos grados hay antes de que lo diga el termómetro.', contra: 'Su ropa abriga un poco menos en invierno.' },
    impaciente: { frase: 'Mira el reloj cuando el agua tarda en hervir.', contra: 'Los peces tardan más en picar.' },
    grunon: { frase: 'Se queja del viento y después se queda a mirarlo.', contra: 'Cada gesto con los vecinos suma un poco menos.' },
    distraido: { frase: 'Empieza tres cosas y se acuerda de una.', contra: 'Tarda más en anotar el cielo.' },
    dormilon: { frase: 'Jura que se levanta en cinco minutos, desde hace una hora.', contra: 'Con sueño, tarda más en anotar el cielo.' },
  },
};
// Los rasgos de sabor (su pro o su contra no cambia ningún número): el texto es sólo color. clase -> id -> qué lados son de sabor.
export const SABOR = {
  oficio: { contador: ['pro', 'contra'] },
  gustos: { mate: ['contra'], folklore: ['contra'], trenes: ['contra'], asado: ['contra'], libros: ['contra'] },
  hobby: { fotografia: ['pro', 'contra'], guitarra: ['pro', 'contra'], carpinteria: ['pro', 'contra'] },
};
// Límites de largo (en palabras) de cada campo; los comprueba pruebas/verificar-4-1-textos.mjs.
export const LIMITES_PALABRAS = { frase: 15, pro: 10, contra: 10 };

const LISTAS = { personalidad: PERSONALIDADES, oficio: OFICIOS, gustos: GUSTOS, hobby: HOBBIES, virtud: VIRTUDES, defecto: DEFECTOS };
const nombreDe = (lista, id) => (lista.find((x) => x.id === id) || lista[0]).nombre;
export const tarjetaDe = (clase, id) => TARJETAS[clase]?.[id] || null;
export const fraseDe = (clase, id) => tarjetaDe(clase, id)?.frase || '';

// Una línea de pro o de contra con el texto escrito de la tarjeta («Tranquilo: …»), o null si no hay nada que mostrar.
export function lineaDeContribucion(c) {
  const t = tarjetaDe(c.clase, c.id)?.[c.lado];
  return t ? `${nombreDe(LISTAS[c.clase], c.id)}: ${t}` : null;
}
// Los pros y los contras de un genoma, en orden, para la pantalla de creación y la ficha del cuaderno (los mismos textos en los dos lados).
// Los gustos traen siempre su pro (la afinidad con los vecinos); su contra, el escrito de cada uno.
export function lineasDeBruno(genoma) {
  const g = sanearGenoma(genoma);
  const pros = [], contras = [];
  for (const c of contribuciones(g)) {
    if (c.clase === 'gustos') continue;
    const t = lineaDeContribucion(c);
    if (t !== null) (c.lado === 'pro' ? pros : contras).push(t);
  }
  for (const id of g.gustos) {
    const p = lineaDeContribucion({ clase: 'gustos', id, lado: 'pro' }), c = lineaDeContribucion({ clase: 'gustos', id, lado: 'contra' });
    if (p) pros.push(p);
    if (c) contras.push(c);
  }
  return { pros, contras };
}

// ---------------------------------------------------------------- las 26 líneas de los vecinos (8 de asado y 18 de lluvia)
// Las dice el vecino al preguntarle «¿Cómo andás?» cuando Bruno comparte ese gusto (quiénes: GUSTOS_DE_VECINOS en creador-catalogo.js). La voz es la de cada uno.
export const LINEAS_GUSTO = {
  asado: {
    jefe: 'Se te nota que sos de asado. Cuando pase el último tren, prendemos uno al lado del andén; yo pongo las brasas.',
    padre: 'Me parece que sos de asado, compañero. El domingo prendo la parrilla: aparecé, que siempre sobra.',
    carpintero: 'Asado, ¿no? Guardo leña de lenga bien seca que da una brasa pareja. Avisame y la usamos.',
    herrero: 'Si te gusta el asado, la fragua deja unas brasas que ni la mejor parrilla. Un día lo probamos.',
    veterinaria: 'Vos sos de asado, se nota. Con los puesteros te vas a llevar bien: siempre hay una costilla de más.',
    andinista: '¿Asado? Mejor todavía arriba, en el refugio del filo, con el viento atizando las brasas.',
    ceramista: 'Así que sos de asado. Tengo unas fuentes que cocí yo: el día que prendas el fuego, te las presto.',
    martin: 'Asado, ¿eh, muchacho? Con la fragua encendida las brasas están desde temprano. Cuando quieras.',
  },
  lluvia: {
    abuela: 'A vos también te gusta la lluvia, tesoro. Sentate conmigo a escucharla en el techo: es la mejor música.',
    madre: 'Se te nota que te gusta la lluvia, vecino. A mis chicos también, aunque después traen el barro hasta la cocina.',
    nene: '¡A vos también te gusta la lluvia! Yo conozco los mejores charcos del valle. Después te los muestro.',
    nena: 'Sos de lluvia, ¿no? Es el mejor día para leer: el techo suena y no dan ganas de levantarse.',
    panadera: 'Si te gusta la lluvia, vení cuando llueva: la panadería huele todavía más rico con los vidrios empañados.',
    pescador: 'Con lluvia el lago se pone de plata. Si te gusta, vení a verlo.',
    enfermera: 'Me parece que sos de lluvia. Está muy bien, pero volvé seco, que un resfrío me toca a mí curarlo.',
    telegrafista: 'Lluvia sobre los cables: suena como punto y raya, colega. A vos también te gusta, ¿no?',
    apicultor: 'Con lluvia las abejas se quedan adentro, y yo también. Es un buen momento para charlar, ¿te gusta?',
    guardaparque: 'Sos de lluvia, colega. Después de una buena, el bosque está lleno de rastros nuevos para anotar.',
    fotografa: '¿Te gusta la lluvia? Sacá fotos justo cuando para, che: todo brilla y el cielo se abre.',
    herbolaria: 'La lluvia despierta el bosque entero: hongos, musgo, olores. Qué bueno que a vos también te guste.',
    pintora: 'Cuando llueve, el cerro se borra y queda como una acuarela. Qué suerte que a vos también te guste, querido.',
    botera: 'Con lluvia el lago hace burbujas como si hirviera. Si te gusta mojarte, venite a remar, marinero.',
    astronoma: 'Dicen que sos de lluvia. A mí me tapa las estrellas, pero después la noche queda lavada.',
    ramon: 'A vos también te gusta la lluvia, m\'hijo. Para el campo es lo mejor que hay, y para escucharla no hace falta nada más.',
    nicanor: 'Con lluvia fina el lago queda como un espejo gris. Si te gusta, venite a mirarlo.',
    ema: 'Escuché que te gusta la lluvia. Después de una buena, el bosque huele a tierra nueva, y vale la caminata.',
  },
};
// Con los gustos de Bruno (ids), la línea que le toca decir a `persona` (o null): asado primero, después lluvia.
export function lineaDeGustoCompartido(persona, gustos) {
  if (!Array.isArray(gustos)) return null;
  for (const gusto of ['asado', 'lluvia']) if (gustos.includes(gusto) && Object.hasOwn(LINEAS_GUSTO[gusto], persona)) return LINEAS_GUSTO[gusto][persona];
  return null;
}

// ---------------------------------------------------------------- la ficha del cuaderno
// La ficha de Bruno para el cuaderno: todo lo elegido, ordenado, con la frase de cada rasgo y los pros y contras en texto. `retrato`: la foto guardada (o null).
export function fichaDeBruno(bruno) {
  const g = sanearGenoma(bruno);
  const { pros, contras } = lineasDeBruno(g);
  const alTope = sistemasAlTope(g), brutos = efectosBrutos(g);
  return {
    nombre: `${PROTAGONISTA.nombre} ${PROTAGONISTA.apellido}`,
    edad: PROTAGONISTA.edad,
    presentacion: 'Llegó al valle buscando paz, lejos del ruido de la ciudad.',
    retrato: typeof bruno?.retrato === 'string' && bruno.retrato ? bruno.retrato : null,
    // [etiqueta, valor, frase(s) de los rasgos]
    datos: [
      ['Personalidad', nombreDe(PERSONALIDADES, g.personalidad), fraseDe('personalidad', g.personalidad)],
      ['Oficio de antes', nombreDe(OFICIOS, g.oficio), fraseDe('oficio', g.oficio)],
      ['Gustos', g.gustos.map((id) => nombreDe(GUSTOS, id)).join(' y '), g.gustos.map((id) => fraseDe('gustos', id)).join(' ')],
      ['Hobby', nombreDe(HOBBIES, g.hobby), fraseDe('hobby', g.hobby)],
      ['Virtud', nombreDe(VIRTUDES, g.virtud), fraseDe('virtud', g.virtud)],
      ['Defecto', nombreDe(DEFECTOS, g.defecto), fraseDe('defecto', g.defecto)],
    ],
    pros,
    contras,
    avisos: alTope.map((s) => (brutos[s] > 0 ? `Ya está al máximo en ${NOMBRE_SISTEMA[s].replace(/^el /, '')}: otro rasgo no suma más.` : `Ya no empeora más ${NOMBRE_SISTEMA[s]}: otro rasgo no resta más.`)),
    sistemas: SISTEMAS.map((s) => ({ id: s, nombre: NOMBRE_SISTEMA[s], valor: efectosAplicados(g)[s] })),
  };
}
