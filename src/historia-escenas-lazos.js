// 4.18.2 (B): la escena de SOFÍA, la fotógrafa de la aldea, la única que no tenía ninguna de lazo («El trato del molino», GUION_HISTORIA.md §6:
// «Foto para Sofía» ya era la del ojo; esta es la que sigue: la foto del valle, con vos adentro). Datos puros, con el formato del motor
// (escenas.js) y la misma forma que historia-escenas-optativas.js:
//   · ESCENAS_LAZOS       id → escena;
//   · IDS_LAZOS           los ids;
//   · EFECTOS_LAZOS       todos los nombres de efecto que usa (para registrarlos uno por uno, como EFECTOS_OPTATIVAS);
//   · DISPARO_LAZOS       por escena: capítulo, dónde está parado el jugador, cuándo y qué optativa la cuenta como hecha;
//   · POR_DEFECTO_LAZOS   ninguna decide nada grande: vacío (está para que el que junta trate a todos los módulos igual).
// Los textos (el tablón, el cuaderno de lo raro, la charla de después, las frases por lazo) están en historia-texto-lazos.js. Lo nuevo: CAMBIOS_4_18_2_B.md.
// El lazo de Sofía lo da la propia escena, según cómo la pasás: esperar la luz de las cinco da +2; apurarla (o moverte) da +1. Nunca los dos.
// 4.19.0 (B): con esas escenas Belisario y Sofía llegaban sólo a 2 (los demás vecinos, a 3). Cada uno suma una escena chica optativa del ACTO III que le da
// el +1 que le faltaba, una sola vez y sin importar cómo la pasés: `ultimo-cruce` (Belisario, en el Puesto del Paso) y `del-otro-lado` (Sofía, en su estudio).
// Sin premios de objetos ni de plata; nada se traba; no cruzan de acto. Además de las escenas, este módulo exporta el DATO DEL REGISTRO de cada una (con la
// forma de `OPTATIVA_SOFIA`, historia-optativas.js): `OPTATIVA_BELISARIO`, `OPTATIVA_SOFIA_FRENTE` y `OPTATIVAS_LAZOS` (las dos), que el registro de A
// convierte con `optativaDeLazo` y de los que arma los disparadores con `disparadoresDeLazo`. Lo nuevo: CAMBIOS_4_19_0_B.md.
import { efectosDe, dlg, narra, linea, gs, plano, mira, sonido, efecto, opcion, eleccion, siEleg, siDecision } from './historia-escenas-util.js';
import { FRENTE, con, apagon, hora, horaMas } from './historia-escenas-acto2-util.js';
import { pj3 } from './historia-escenas-acto3-util.js';

// ---------------------------------------------------------------- capítulo 7 · La luz de las cinco (la foto del valle)
const fotoValle = {
  id: 'foto-valle', titulo: 'La luz de las cinco', acto: 2, capitulo: 7,
  resumen: 'Sofía sacó el valle entero desde la puerta del estudio y te puso a vos, chiquito y de espaldas, en el medio, para que se entendiera el tamaño. Esperaron la luz de las cinco. En la copia, junto a tus botas, hay dos puntitos verdes que ella atribuye al vidrio.',
  personajes: pj3('sofia', 'narra'),
  pasos: [
    plano('medio', 'sofia', { desde: 'jugador', dist: 3.4, dur: 3, mezcla: 0.9 }),
    mira('sofia', 'jugador'),
    dlg('sofia', [
      linea('Justo vos. Quedate ahí. Ah, no: todavía no, primero el trípode.', { gesto: gs('senalar', 2) }),
      'Hace semanas que quiero sacar el valle entero desde la puerta del estudio, y siempre me sale una postal.',
    ]),
    plano('hombro', 'sofia', { desde: 'jugador', lado: 1, mezcla: 0.7, dur: 30, sinEsperar: true }),
    dlg('sofia', [
      'Un valle sin nadie no tiene tamaño. Necesito una persona chiquita, parada en el medio, para que se entienda lo grande que es.',
      linea('Alguien que sepa quedarse quieto. Vos tenés pinta de saber.', { gesto: gs('hacer-broma', 2) }),
    ]),
    eleccion('valle-pide', '¿Qué le contestás a Sofía?', [
      opcion('dale', 'Dale. ¿Dónde me paro?', { sabor: true }),
      opcion('quieto', 'Quieto no sé. Parado, sí.', { sabor: true }),
      opcion('vecinos', '¿Y los vecinos? Son más del valle que yo.', { sabor: true }),
    ]),
    dlg('sofia', [linea('Ahí, en el medio del camino, de espaldas a mí. Mirá el valle, no la cámara: el que mira la cámara es un turista.', { gesto: gs('asentir', 1.8) })], { si: siEleg('valle-pide', 'dale') }),
    dlg('sofia', ['Parado alcanza, con tal de que no te rasques. Es lo único que te pido: que no te rasques.'], { si: siEleg('valle-pide', 'quieto') }),
    dlg('sofia', [linea('Los vecinos ya salen en todas, de costado, con cara de «¿y esta qué hace?». Al valle le falta uno que recién llega. Y vos ya sos casi de acá.', { gesto: gs('encogerse', 2) })], { si: siEleg('valle-pide', 'vecinos') }),
    plano('general', FRENTE(9, 3), { desde: 'jugador', dist: 15, alto: 3.4, miraY: 1.5, dur: 3.2, mezcla: 0.9 }),
    narra('Sofía saca la cámara de fuelle de su abuelo del estuche de madera con herrajes de bronce, la apoya sobre el trípode y se mete bajo el paño negro. Del otro lado está el valle entero: el lago, el humo de la aldea, la vía finita, y arriba todo el cielo.'),
    ...apagon([hora(16.8, { dur: 0 })], { dur: 1.6 }),
    plano('hombro', 'sofia', { desde: 'jugador', lado: -1, mezcla: 0.7, dur: 30, sinEsperar: true }),
    narra('Pasa un rato largo. Sofía asoma de abajo del paño, mira el cielo con la mano en visera y vuelve a meterse. La luz está cerca, pero todavía no es.'),
    dlg('sofia', [
      linea('A las cinco el valle se pone del color de un durazno. Diez minutos nada más. Si te apuro, sale gris.', { gesto: gs('pensar', 2.2) }),
      'Vos decidís. Es tu foto: yo sólo pongo la cámara.',
    ]),
    // la elección con peso: esperar la luz (+2) o apurarla (+1); si se saltea la escena vale la segunda
    eleccion('valle-luz', '¿Qué hacés mientras la luz se decide?', [
      opcion('esperar', 'Quedarme quieto hasta que llegue la luz.', { efecto: 'lazo:sofia:2' }),
      opcion('apurar', 'Decirle que saque nomás, que así está bien.', { efecto: 'lazo:sofia:1' }),
      opcion('mover', 'Estirar las piernas, que se me durmieron.', { efecto: 'lazo:sofia:1' }),
    ], 1),
    con(narra('Te quedás. Los minutos pasan como pasan en el valle: sin hacer ruido. De a poco las lengas agarran un color que antes no tenían, el lago se pone chato y dorado, y a Sofía se le escapa un «ahí» tan bajito que casi no se oye.'), siEleg('valle-luz', 'esperar')),
    con(dlg('sofia', [linea('Ahí. No respires.', { gesto: gs('susurrar', 1.6) })]), siEleg('valle-luz', 'esperar')),
    con(dlg('sofia', [linea('¿Nomás? Bueno. Va a salir un poco tibia, pero sale. La luz perfecta no existe: existe la que alcanzás.', { gesto: gs('encogerse', 1.8) })]), siEleg('valle-luz', 'apurar')),
    con(dlg('sofia', [linea('¡No te muevas! Ah, ya. Bueno, salió. Un valle con un borrón en el medio: algo se va a poder hacer.', { gesto: gs('reir', 1.8) })]), siEleg('valle-luz', 'mover')),
    sonido('bisagra'),
    narra('Clac. Un solo clac, seco, de metal viejo. Sofía levanta la cabeza del paño con el pelo todo para un lado.'),
    dlg('sofia', [
      linea('Ya está. Podés respirar.', { gesto: gs('reir', 1.8) }),
      'Se revela en el cuarto oscuro. Vení, que no se puede mirar desde afuera.',
    ]),
    ...apagon([horaMas(1, { dur: 0 })], { dur: 1.4 }),
    plano('detalle', FRENTE(1.1), { desde: 'jugador', dist: 0.8, alto: 1.2, dur: 3.2, mezcla: 0.8 }),
    narra('Bajo la luz roja del cuarto oscuro, en la bandeja, la imagen sube sola, como una cara que se acuerda. Primero el cielo. Después el lago, chato. Después la vía, finita.', 'Y en el medio de todo, vos: chiquito, de espaldas, con los hombros bajos de quien dejó algo pesado en el piso.'),
    plano('primer', 'sofia', { desde: 'jugador', mezcla: 0.8, dur: 30, sinEsperar: true }),
    dlg('sofia', [
      linea('Mirá el tamaño. Ahora sí se entiende lo grande que es.', { gesto: gs('senalar', 2) }),
      'Esperá. ¿Qué es eso?',
    ]),
    plano('detalle', FRENTE(1.1), { desde: 'jugador', dist: 0.6, alto: 1.2, dur: 3, mezcla: 0.8 }),
    narra('Cerca de tus botas, apenas, hay dos puntitos verdes. Muy chicos, muy redondos, a la misma altura, como dos ojos de bicho de agua.'),
    dlg('sofia', [
      linea('Es el vidrio. Una burbuja. O la química: la química hace lo que quiere.', { gesto: gs('mirar', 1.8) }),
      'En dieciséis años de foto aprendí a no explicar lo que no puedo explicar. Lo guardo en un cajón.',
    ]),
    eleccion('valle-copia', '¿Qué hacés con la foto?', [
      opcion('refugio', 'Pedirle una copia para el refugio.', { sabor: true }),
      opcion('estudio', 'Que quede en el estudio, con las de su abuelo.', { sabor: true }),
      opcion('espaldas', '¿Por qué de espaldas?', { sabor: true }),
    ]),
    dlg('sofia', ['Ya te la hice, mientras revelaba. Ponela en la repisa, entre tus cosas raras. Seguro tenés alguna.'], { si: siEleg('valle-copia', 'refugio') }),
    dlg('sofia', [linea('Con los casamientos. Mi abuelo decía que un casamiento sin foto es un trato sin testigos. Esta tiene un valle entero de testigos.', { gesto: gs('asentir', 2) })], { si: siEleg('valle-copia', 'estudio') }),
    dlg('sofia', ['Porque de frente sos vos, y de espaldas sos cualquiera que llegue. La foto es para el que venga después.'], { si: siEleg('valle-copia', 'espaldas') }),
    efecto('raro:foto-del-valle'),
  ],
};

// ---------------------------------------------------------------- capítulo 9 · El último cruce (Belisario, en el Puesto del Paso)
// El +1 de Belisario lo da la escena entera, sin elecciones con peso: las tres preguntas son de sabor.
const ultimoCruce = {
  id: 'ultimo-cruce', titulo: 'El último cruce', acto: 3, capitulo: 9,
  resumen: 'Belisario te contó que mañana sale con la última tropa antes de que la nieve tape el paso, te habló de la huella que abrió su padre y te convidó un mate. Cuando probó la carga, las siete mulas miraron hacia el valle y movieron las orejas como quien saluda; en el barro, junto a las pezuñas, había huellas muy chicas.',
  personajes: pj3('belisario', 'narra'),
  pasos: [
    plano('medio', 'belisario', { desde: 'jugador', dist: 3.6, dur: 3, mezcla: 0.9 }),
    mira('belisario', 'jugador'),
    narra('Belisario le tira de la cincha a la última mula con una rodilla contra el costado, hasta que el cuero cruje. Arriba, en lo alto del paso, la cordillera tiene una cinta blanca que anoche no estaba.'),
    dlg('belisario', [
      linea('Justo a tiempo, mi amigo. Mañana salgo con la última tropa.', { gesto: gs('senalar', 2) }),
      'El paso se cierra con la primera nevada grande y no hay a quién reclamarle. Del otro lado me esperan unos que me deben sal y una yegua.',
    ]),
    con(dlg('belisario', [linea('Las ovejas de Ramón llegaron enteras, no se aflija. Él no me saluda, pero es cabeza dura y me quiere: nos conocemos desde pibes.', { gesto: gs('barba', 2) })]), siDecision('majada', 'c')),
    plano('general', FRENTE(9, 3), { desde: 'jugador', dist: 15, alto: 3.4, miraY: 1.5, dur: 3.2, mezcla: 0.9 }),
    narra('Siete mulas atadas en fila, con la carga pareja y los cencerros callados. Más arriba, la huella: una raya fina que sube por la ladera y se pierde en el pedregal. Por ahí se llevan cosas del otro lado desde mucho antes de que hubiera molino.'),
    plano('hombro', 'belisario', { desde: 'jugador', lado: 1, mezcla: 0.7, dur: 30, sinEsperar: true }),
    dlg('belisario', [
      'Esa huella la abrió mi padre con las vacas, y antes que él, quién sabe quién. Decía que un camino no lo hace el que lo abre, sino el que vuelve a pasar.',
    ]),
    eleccion('cruce-pregunta', '¿Qué le preguntás a Belisario?', [
      opcion('miedo', '¿Nunca le dio miedo el paso?', { sabor: true }),
      opcion('padre', '¿Su padre cruzaba solo?', { sabor: true }),
      opcion('quedarse', '¿Por qué no se queda este invierno?', { sabor: true }),
    ]),
    dlg('belisario', [linea('Miedo, el justo. El que no tiene, no vuelve. El miedo es como una mula nueva: hay que llevarlo de la rienda, no a rastras.', { gesto: gs('barba', 2) })], { si: siEleg('cruce-pregunta', 'miedo') }),
    dlg('belisario', ['Solo, nunca. Iba con un perro que se llamaba Mate y una radio que no agarraba nada. Le hablaba al perro, a la radio y al camino, y los tres le contestaban a su manera.'], { si: siEleg('cruce-pregunta', 'padre') }),
    dlg('belisario', [linea('Porque en invierno el valle se achica y yo necesito horizonte. Usted, en cambio, parece de los que hacen nido. No es un reproche: alguien tiene que quedarse a mantener la luz prendida.', { gesto: gs('encogerse', 2) })], { si: siEleg('cruce-pregunta', 'quedarse') }),
    plano('medio', 'belisario', { desde: 'jugador', dist: 3.2, mezcla: 0.8, dur: 30, sinEsperar: true }),
    narra('Belisario se palpa el bolsillo del chaleco y saca la pipa de la boquilla mordida, la que apareció en la vía. La gira entre los dedos sin encenderla. Después pone la pava sobre las brasas del fogón y ceba un mate largo, con espuma.'),
    dlg('belisario', [
      linea('Tome, que este mate lo paga el camino.', { gesto: gs('cebar-mate', 2) }),
      'Yo no fumo desde marzo, pero la llevo. Una pipa es como un amigo: no hace falta usarla para saber que está.',
    ]),
    plano('general', FRENTE(9, 3), { desde: 'jugador', dist: 15, alto: 3.4, miraY: 1.5, dur: 3.2, mezcla: 0.9 }),
    narra('Cuando suelta la soga para probar la carga, la tropa da diez pasos hacia el valle. Y las siete mulas, a la vez, levantan la cabeza y miran más allá de vos, hacia abajo, con las orejas paradas hacia adelante, como se las ponen cuando alguien las saluda.'),
    plano('detalle', FRENTE(1.2), { desde: 'jugador', dist: 1, alto: 1.4, dur: 3, mezcla: 0.8 }),
    narra('En el barro de al lado, entre las marcas de las pezuñas, hay otras huellas muy chicas, descalzas. Acompañan a la tropa hasta el borde del puesto y no pasan de ahí.'),
    plano('medio', 'belisario', { desde: 'jugador', dist: 3.4, mezcla: 0.8, dur: 30, sinEsperar: true }),
    dlg('belisario', [
      linea('Las mulas saludan a quien ven. Yo saludo a quien ellas saludan.', { gesto: gs('barba', 2) }),
      'Es más prudente. Y más barato.',
    ]),
    narra('Belisario se toca el ala del sombrero hacia donde miran las mulas. Vos, por las dudas, levantás la mano.'),
    eleccion('cruce-despedida', '¿Qué le decís antes de que se vaya?', [
      opcion('suerte', 'Que le vaya lindo, Belisario.', { sabor: true }),
      opcion('abril', 'En abril le tengo el mate listo.', { sabor: true }),
      opcion('mulas', 'Salúdeme a las mulas.', { sabor: true }),
    ]),
    dlg('belisario', ['Lindo y largo, que es como me gusta.'], { si: siEleg('cruce-despedida', 'suerte') }),
    dlg('belisario', [linea('Mire usted: alguien que espera. Cuidado, amigo, que me acostumbro, y después no hay paso que me retenga del lado de allá.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('cruce-despedida', 'abril') }),
    dlg('belisario', ['Se lo digo. Contestan, pero no en castellano.'], { si: siEleg('cruce-despedida', 'mulas') }),
    efecto('lazo:belisario:1'),
    efecto('raro:mulas-saludan'),
  ],
};

// ---------------------------------------------------------------- capítulo 9 · Del otro lado de la cámara (Sofía, en su estudio)
// El +1 de Sofía lo da la escena entera (las dos elecciones son de sabor). Sigue a «La luz de las cinco» (`foto-valle`): habla del cajón y de los puntitos verdes.
const delOtroLado = {
  id: 'del-otro-lado', titulo: 'Del otro lado de la cámara', acto: 3, capitulo: 9,
  resumen: 'Sofía te puso en las manos la cámara de fuelle de su abuelo y te pidió que la sacaras a ella, que nunca sale en ninguna foto. Salió riéndose. En el borde, afuera de lo que ella miraba, una mano muy chica sostenía el reflector, y Sofía dijo que había sido el viento.',
  personajes: pj3('sofia', 'narra'),
  pasos: [
    plano('medio', 'sofia', { desde: 'jugador', dist: 3.4, dur: 3, mezcla: 0.9 }),
    mira('sofia', 'jugador'),
    dlg('sofia', [
      linea('Justo. Dejá lo que traigas, que hoy vas del otro lado.', { gesto: gs('senalar', 2) }),
      'Hay miles de fotos que saqué yo y ninguna de mí. Mi abuelo sacó caras durante cuarenta años y la suya está en una sola, y esa también la saqué yo.',
    ]),
    plano('hombro', 'sofia', { desde: 'jugador', lado: -1, mezcla: 0.7, dur: 30, sinEsperar: true }),
    dlg('sofia', [
      'Es la misma cámara con la que te saqué el valle. Se mira por el vidrio de atrás y muestra todo al revés: no te asustes, es normal.',
      linea('Vos mirás, encuadrás y apretás la pera. Lo demás lo hace la luz.', { gesto: gs('contar', 2.2) }),
    ]),
    plano('detalle', FRENTE(1.1), { desde: 'jugador', dist: 0.8, alto: 1.2, dur: 3.2, mezcla: 0.8 }),
    narra('En el vidrio esmerilado, Sofía aparece cabeza abajo y chiquita, con las botas arriba y la bufanda para el cielo.'),
    eleccion('otro-encuadre', '¿Cómo la encuadrás?', [
      opcion('entera', 'Entera, con el estudio alrededor.', { sabor: true }),
      opcion('cerca', 'De cerca, sólo la cara.', { sabor: true }),
      opcion('puerta', 'En la puerta, con el valle atrás.', { sabor: true }),
    ]),
    dlg('sofia', ['Con las paredes, sí. A mi abuelo lo sacaban siempre de cerca. Yo quiero que se vea dónde vivo.'], { si: siEleg('otro-encuadre', 'entera') }),
    dlg('sofia', [linea('De cerca... qué miedo. Bueno, de cerca. Pero sin retocar: que se vea cada arruga que me gané.', { gesto: gs('encogerse', 1.8) })], { si: siEleg('otro-encuadre', 'cerca') }),
    dlg('sofia', ['En la puerta, sí. Con el valle de fondo y yo adelante: por una vez, el valle hace de telón.'], { si: siEleg('otro-encuadre', 'puerta') }),
    plano('medio', 'sofia', { desde: 'jugador', dist: 3.6, mezcla: 0.8, dur: 30, sinEsperar: true }),
    narra('Sofía se sienta en el banquito, se acomoda el pelo tres veces y lo suelta, y se queda quieta de golpe, con cara de quien ya sabe que va a salir bien o no va a salir. Contra la pared, a un costado, está el reflector: una tela blanca tensa en un marco de madera.'),
    dlg('sofia', [linea('¿Ya? No me mires a mí, mirá el vidrio. Yo no sé qué cara poner. Hace años que no sé.', { gesto: gs('pensar', 2) })]),
    sonido('bisagra'),
    narra('Apretás la pera. Hace un clac chiquito, seco, y después un silencio largo, de estudio. Sofía se ríe: justo después, justo tarde.'),
    ...apagon([], { dur: 1.4 }),
    plano('detalle', FRENTE(1.1), { desde: 'jugador', dist: 0.8, alto: 1.2, dur: 3.2, mezcla: 0.8 }),
    narra('Bajo la luz roja del cuarto oscuro, la imagen sube sola en la bandeja: primero la pared, después la bufanda, después Sofía, con los ojos cerrados y la boca abierta en plena risa, como cuando a alguien se le adelanta la risa a lo que iba a decir.'),
    plano('primer', 'sofia', { desde: 'jugador', mezcla: 0.8, dur: 30, sinEsperar: true }),
    dlg('sofia', [
      linea('Salí riéndome. En treinta años no salí riéndome.', { gesto: gs('reir', 1.8) }),
      'Me gusta. Qué bronca. Esperá: ¿qué es eso, a la izquierda?',
    ]),
    plano('detalle', FRENTE(1.1), { desde: 'jugador', dist: 0.6, alto: 1.2, dur: 3, mezcla: 0.8 }),
    narra('En el borde izquierdo, afuera de donde ella miraba, una mano muy chica, del tamaño de la de un nene, sostiene el marco del reflector para que no se caiga.'),
    dlg('sofia', [
      linea('Es el viento. Acá adentro no hay viento, pero es el viento.', { gesto: gs('mirar', 1.8) }),
      'Ya tengo un cajón entero de cosas que no explico. Ésta va arriba de todo.',
    ]),
    eleccion('otra-mano', '¿Qué hacés con la mano?', [
      opcion('cajon', 'Guardarla en el cajón, con lo demás.', { sabor: true }),
      opcion('pared', 'Colgar la foto igual, que se vea.', { sabor: true }),
      opcion('viento', 'Yo no vi nada. Fue el viento.', { sabor: true }),
    ]),
    dlg('sofia', ['En el cajón, sí. Cada uno tiene que tener un lugar donde guardar lo que no entiende.'], { si: siEleg('otra-mano', 'cajon') }),
    dlg('sofia', [linea('Colgarla, con mano y todo. Si alguien pregunta, le digo que ayudó.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('otra-mano', 'pared') }),
    dlg('sofia', ['Eso. Fue el viento. Qué buen asistente, el viento: no cobra y no opina.'], { si: siEleg('otra-mano', 'viento') }),
    dlg('sofia', ['Gracias por mirar el vidrio, che. Es más difícil que apretar la pera, y lo hiciste bien.']),
    efecto('lazo:sofia:1'),
    efecto('raro:foto-de-sofia'),
  ],
};

// ---------------------------------------------------------------- todas
export const ESCENAS_LAZOS = {
  'foto-valle': fotoValle,
  'ultimo-cruce': ultimoCruce,
  'del-otro-lado': delOtroLado,
};
export const IDS_LAZOS = Object.keys(ESCENAS_LAZOS);

// Todos los efectos que usa (para registrar uno por uno en el aplicador de la historia)
export const EFECTOS_LAZOS = [...new Set(Object.values(ESCENAS_LAZOS).flatMap((e) => efectosDe(e)))].sort();

// No decide nada grande: no hay opción por defecto que valga si se saltea
export const POR_DEFECTO_LAZOS = {};

// Dónde y cuándo se dispara. `objetivo`: el id de la optativa que la escena cuenta como hecha (la registra A; el texto del tablón está en
// historia-texto-lazos.js). `ofrece`: la escena que ofrece la optativa (corre `optativa:<id>`); null si la ofrece el registro (con Sofía ya viviendo en la aldea).
const d = (cap, jugadorEn, cuando, objetivo, ofrece) => ({ cap, jugadorEn, cuando, objetivo, ofrece });
export const DISPARO_LAZOS = {
  'foto-valle': d(7, 'frente a Sofía, en el estudio de fotos', 'E sobre Sofía, o llegar al estudio de 9 a 16:30 (capítulos 7 y 8), con Sofía viviendo en la aldea; la escena adelanta la hora hasta las cinco menos diez, la luz que ella espera, y a la vuelta del cuarto oscuro pasa una hora más', 'foto-valle', null),
  'ultimo-cruce': d(9, 'frente a Belisario, junto al fogón del Puesto del Paso', 'E sobre Belisario, de 8 a 18, en los capítulos 9 a 11 (de «Los primeros fríos» a «El arco y la honda») y con «Los del cerro» ya vista; no cambia la hora', 'ultimo-cruce', null),
  'del-otro-lado': d(9, 'frente a Sofía, en el estudio de fotos', 'E sobre Sofía, o llegar al estudio de 9 a 16:30, en los capítulos 9 a 11 y con «La luz de las cinco» ya vista, con Sofía viviendo en la aldea; no cambia la hora (el cuarto oscuro es sólo un fundido)', 'del-otro-lado', null),
};

// 4.19.0: el dato del REGISTRO de las dos escenas nuevas, con la forma de `OPTATIVA_SOFIA` (historia-optativas.js): `id` y `escena` (la misma), la ventana de capítulos
// (`desde` … `hasta`: ids de capítulo, inclusive; los dos son del acto III: ninguna cruza de acto), `quien`, `ofrece` ({ escenas?, temas?, pobladores?, trato? }: todo lo que
// pide tiene que estar) y `disparo` (una lista: `auto` al llegar a `lugar` a menos de `radio` metros, `hablar` con la E sobre `clave`; `hora`: [desde, hasta]).
// El texto del tablón, la charla de después y lo raro de cada una están en historia-texto-lazos.js (TEXTO_LAZOS.tablon, .charlas y .raro).
export const OPTATIVA_BELISARIO = {
  id: 'ultimo-cruce', escena: 'ultimo-cruce', desde: 'frios', hasta: 'arco', quien: 'belisario',
  ofrece: { escenas: ['los-del-cerro'] },   // (la de «Los del cerro» es objetivo del capítulo 8: siempre está vista al llegar al acto III)
  disparo: [{ modo: 'hablar', clave: 'belisario', hora: [8, 18] }],
};
export const OPTATIVA_SOFIA_FRENTE = {
  id: 'del-otro-lado', escena: 'del-otro-lado', desde: 'frios', hasta: 'arco', quien: 'sofia',
  ofrece: { escenas: ['foto-valle'], pobladores: ['fotografa'] },   // (sigue a «La luz de las cinco»: habla del cajón y de los puntitos verdes)
  disparo: [{ modo: 'auto', lugar: 'estudio-fotos', radio: 12, hora: [9, 16.5] }, { modo: 'hablar', clave: 'fotografa', hora: [9, 16.5] }],
};
export const OPTATIVAS_LAZOS = [OPTATIVA_BELISARIO, OPTATIVA_SOFIA_FRENTE];

