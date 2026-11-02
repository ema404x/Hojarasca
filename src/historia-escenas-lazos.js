// 4.18.2 (B): la escena de SOFÍA, la fotógrafa de la aldea, la única que no tenía ninguna de lazo («El trato del molino», GUION_HISTORIA.md §6:
// «Foto para Sofía» ya era la del ojo; esta es la que sigue: la foto del valle, con vos adentro). Datos puros, con el formato del motor
// (escenas.js) y la misma forma que historia-escenas-optativas.js:
//   · ESCENAS_LAZOS       id → escena (una);
//   · IDS_LAZOS           los ids;
//   · EFECTOS_LAZOS       todos los nombres de efecto que usa (para registrarlos uno por uno, como EFECTOS_OPTATIVAS);
//   · DISPARO_LAZOS       por escena: capítulo, dónde está parado el jugador, cuándo y qué optativa la cuenta como hecha;
//   · POR_DEFECTO_LAZOS   ninguna decide nada grande: vacío (está para que el que junta trate a todos los módulos igual).
// Los textos (el tablón, el cuaderno de lo raro, la charla de después, las frases por lazo) están en historia-texto-lazos.js. Lo nuevo: CAMBIOS_4_18_2_B.md.
// El lazo de Sofía lo da la propia escena, según cómo la pasás: esperar la luz de las cinco da +2; apurarla (o moverte) da +1. Nunca los dos.
import { efectosDe, dlg, narra, linea, gs, plano, mira, sonido, efecto, opcion, eleccion, siEleg } from './historia-escenas-util.js';
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

// ---------------------------------------------------------------- todas
export const ESCENAS_LAZOS = {
  'foto-valle': fotoValle,
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
};
