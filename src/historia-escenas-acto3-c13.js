// 4.17.0 (B): ACTO III · capítulo 13 «El deshielo» (el epílogo; GUION_HISTORIA.md). Ocho escenas: la carpeta celeste de Graciela (el ramal), los de la
// majada, «volver a subir» (la reconciliación con Ramón si vendiste la majada), Josefina y el cuaderno, la Fiesta de la Nieve, la última escena
// del umbral (el círculo se cierra: los dos finales, A «el trato» y B «la pelea») y las dos de la costumbre del trato después de la historia
// (la bolsa vacía en el umbral cada cosecha y el regalito a la mañana). Variantes por la cuenta del ramal, por D1 a D5, por la noche, por los
// lazos y, con el amor prendido, por la pareja (sólo sugerida). La tarjeta final con piezas está en historia-texto-acto3.js.
import { efectosDe, dlg, narra, linea, gs, plano, pose, aparece, camina, mira, desaparece, espera, sonido, efecto, opcion, eleccion, siEleg, siDecision } from './historia-escenas-util.js';
import { FRENTE, apagon, hora, horaMas, con, no, lazoAl } from './historia-escenas-acto2-util.js';
import { pj3, siTrato, siRamal, siPerdon, siAmor, primerDe } from './historia-escenas-acto3-util.js';

const carpetaCeleste = {
  id: 'carpeta-celeste', titulo: 'La carpeta celeste', acto: 3, capitulo: 13,
  resumen: 'En el andén nevado, Graciela abrió la carpeta celeste delante de Elsa y de todos: según la cuenta del ramal, rompió el informe de cierre, lo cambió por «a prueba un año», o lo mandó con un anexo escrito a mano.',
  personajes: pj3('graciela', 'elsa', 'ernesto', 'ercilia', 'herminia', 'narra'),
  disparador: { hora: [10, 13] },
  pasos: [
    ...apagon([hora(11, { dur: 0 }), aparece('graciela', { lugar: 'estacion', dx: 1.5, dz: 3 }), aparece('elsa', { lugar: 'estacion', dx: -2.5, dz: 2.2 }), aparece('ernesto', { lugar: 'estacion', dx: 4, dz: 1.5, }), con(aparece('ercilia', { lugar: 'estacion', dx: -6, dz: -1 }), siDecision('cuaderno', 'a')), con(aparece('herminia', { lugar: 'estacion', dx: -7, dz: 1 }), siDecision('cuaderno', 'a'))], { dur: 1.8 }),
    plano('general', { lugar: 'estacion' }, { dist: 15, alto: 3.6, dur: 3.6, mezcla: 0.9 }),
    narra('El andén está blanco, con una capa de nieve dura que brilla. La trochita espera en la vía, resoplando vapor. Hay mucha gente: Ernesto con la bandera bajo el brazo, los vecinos de siempre, y Elsa, firme, con el rodete perfecto.'),
    con(narra('Media aldea vino a mirar. Ercilia se tapa la boca con la bufanda. Herminia tiene una silla y un mate. Los chicos juegan a la rayuela sobre las baldosas con nieve.'), siDecision('cuaderno', 'a')),
    plano('medio', 'graciela', { desde: 'jugador', dist: 3.4, mezcla: 0.9, dur: 3 }),
    mira('graciela', 'jugador'),
    narra('Graciela baja del tren con una carpeta celeste, cerrada con elástico. No trae el portafolios. Se acerca despacio, con las botas nuevas, y se detiene delante de Elsa. Respira hondo, como antes de zambullirse.'),
    plano('primer', 'elsa', { desde: 'jugador', mezcla: 0.7, dur: 3, sinEsperar: true }),
    narra('Elsa espera. Tiene la mano derecha dentro del bolsillo del sobretodo y no la saca. Nadie dice nada.'),
    // el ramal salvado (cuenta ≥ 10)
    con(dlg('graciela', [
      'Esto es el informe de cierre, firmado. Me lo dieron en octubre y lo guardé en el portafolios como quien guarda una piedra en el zapato.',
      linea('Cuarenta toneladas no son. Pero acá hay algo que no figura en la planilla, y yo ya no sé hacer planillas sin ponerlo.', { gesto: gs('encogerse', 2.6) }),
    ]), siRamal('salvado')),
    con(narra('Saca el informe de la carpeta y lo rompe en cuatro. Los pedazos caen sobre la nieve del andén como copos más grandes.'), siRamal('salvado')),
    con(dlg('graciela', [linea('El ramal sigue.', { gesto: gs('asentir', 2) })]), siRamal('salvado')),
    con(narra('Elsa no dice nada. Saca un papel del bolsillo del sobretodo, el del traslado, y lo rompe también. Después abraza a Graciela, que se queda dura un segundo y enseguida se deshace en el abrazo.'), siRamal('salvado')),
    con(efecto('mundo:ramal-salvado'), siRamal('salvado')),
    // a prueba (6 a 9)
    con(dlg('graciela', [
      linea('Un año a prueba. Con horario de invierno.', { gesto: gs('contar', 2.2) }),
      'Y yo vengo en cada estación a contar. No a cerrar: a contar. Es distinto, aunque la letra sea la misma.',
    ]), siRamal('prueba')),
    con(dlg('elsa', [linea('Cuente, ingeniera. Que vamos a tener mucho.', { gesto: gs('saludar', 2) })]), siRamal('prueba')),
    con(efecto('mundo:ramal-a-prueba'), siRamal('prueba')),
    // a prueba y Elsa se va (< 6)
    con(dlg('graciela', [linea('A prueba. Lo mejor que pude.', { gesto: gs('encogerse', 2.2) }), 'Un año. Con un horario recortado. Lamento no poder más.']), siRamal('traslado')),
    con(narra('Elsa asiente. Saca el papel del bolsillo del sobretodo: el del traslado a Esquel, ya mandado. Se sube al tren sin mirar a nadie, con la espalda recta, y desde el estribo se da vuelta.'), siRamal('traslado')),
    con(dlg('elsa', [linea('Manéjelo con las orejas. Y escríbame.', { gesto: gs('saludar', 2.2) })]), siRamal('traslado')),
    con(narra('Te da el silbato de guarda, tibio de tanto llevarlo en el bolsillo. La trochita parte con un pitido largo que se pierde detrás del puente. Elsa vuelve de visita en verano, dice. Los de la estación no le creen del todo. Vos sí.'), siRamal('traslado')),
    con(efecto('objeto:silbato-de-elsa'), siRamal('traslado')),
    con(efecto('mundo:elsa-se-va'), siRamal('traslado')),
    // Graciela se queda
    con(dlg('graciela', [linea('Pedí el traslado. Al valle.', { gesto: gs('senalar', 2.2) }), 'Alguien tiene que contar las toneladas de cerca.']), lazoAl('graciela', 3)),
    con(efecto('mundo:graciela-se-queda'), lazoAl('graciela', 3)),
    eleccion('carpeta-resp', '¿Qué le decís a Graciela?', [
      opcion('gracias', 'Gracias por mirar el valle con otros ojos.', { sabor: true }),
      opcion('planilla', '¿Y en la planilla qué casillero va?', { sabor: true }),
      opcion('quedate', 'Quedate a la Fiesta de la Nieve.', { sabor: true }),
    ]),
    dlg('graciela', [linea('Los ojos son los mismos. Lo que cambió es la distancia: ahora estoy más cerca.', { gesto: gs('mirar', 2) })], { si: siEleg('carpeta-resp', 'gracias') }),
    dlg('graciela', ['«Varios». Es el más honesto de toda la planilla.'], { si: siEleg('carpeta-resp', 'planilla') }),
    dlg('graciela', [linea('Me quedo. Ya reservé una silla. Yo anoto, ustedes bailan.', { gesto: gs('hacer-broma', 2.2) })], { si: siEleg('carpeta-resp', 'quedate') }),
    efecto('raro:carpeta-celeste'),
  ],
};

const etq = (paso, nombre) => ({ ...paso, etiqueta: nombre });
const salto = (a, si) => (si ? { tipo: 'salto', a, si } : { tipo: 'salto', a });

const majadaFin = {
  id: 'majada-fin', titulo: 'Los de la majada', acto: 3, capitulo: 13,
  resumen: 'Visitaste a Ramón y a Fermín. Si Fermín llevó la majada, hay un cartel nuevo: «Puesto Catrileo». Si la cuidaste vos, Fermín se quedó o se fue con las mulas. Si la vendiste, Ramón mira el galpón vacío desde la loma. Con el lazo al máximo, te regala el mate de Chocolate.',
  personajes: pj3('ramon', 'fermin', 'narra'),
  disparador: { hora: [10, 18] },
  pasos: [
    plano('general', { lugar: 'galpon' }, { dist: 18, alto: 4, miraY: 2, dur: 3.6, mezcla: 0.9 }),
    salto('rama-b', siDecision('majada', 'b')),
    salto('rama-c', siDecision('majada', 'c')),
    // D5 = A (o sin decidir): Fermín llevó la majada
    narra('En el galpón de esquila hay un cartel nuevo, pintado a mano, con letras desparejas: «Puesto Catrileo». Debajo, una oveja dibujada con cuatro patas y una sonrisa.'),
    aparece('ramon', FRENTE(3.4, -1.8)),
    aparece('fermin', FRENTE(9, 4)),
    plano('medio', 'ramon', { desde: 'jugador', dist: 3.2, mezcla: 0.8, dur: 3 }),
    narra('Ramón está sentado en un banco al sol, con la manta sobre las rodillas, mirando cómo Fermín trabaja. Tiene el mate en la mano y la cara de quien mira un cuadro que ya sabe de memoria.'),
    dlg('ramon', [
      linea('Las tiene flacas.', { gesto: gs('tomar-mate', 2.2) }),
      'Las tiene… bien. Las tiene mejor que yo.',
    ]),
    narra('Fermín, a lo lejos, se ríe. Es la primera vez que se lo oís reír sin taparse la boca.'),
    efecto('lazo:ramon:3'),
    efecto('mundo:cartel-puesto-catrileo'),
    salto('cierre-majada'),
    // D5 = B: la cuidaste vos
    etq(aparece('ramon', FRENTE(3.4, -1.8)), 'rama-b'),
    narra('Ramón está de vuelta con la majada. Camina con un bastón, mal, pero camina. Las ovejas lo reconocen y se le arriman como a un vecino que vuelve de un viaje largo.'),
    dlg('ramon', ['Gracias por cuidarla. Dicen que la trataste con respeto. Para una oveja, eso es un título universitario.']),
    salto('b-se-queda', lazoAl('fermin', 0)),
    narra('Fermín ya no está. Se fue con las mulas de Belisario, al otro lado de la cordillera. Hoy llegó una postal de Chile, con un volcán dibujado y una letra apretada: «Acá también hay viento. Pero no es el mismo. F.»'),
    efecto('mundo:fermin-se-fue'),
    salto('cierre-majada'),
    etq(aparece('fermin', FRENTE(9, 4)), 'b-se-queda'),
    narra('Fermín se quedó de medianero, como siempre. Ramón le regaló los corderos del año, «que ya eran tuyos», dijo, mirando para otro lado. Fermín se los agradeció mirando para el otro.'),
    efecto('lazo:fermin:1'),
    salto('cierre-majada'),
    // D5 = C: la vendiste
    etq(aparece('ramon', FRENTE(16, -4)), 'rama-c'),
    plano('general', FRENTE(16, -4), { desde: 'jugador', dist: 24, alto: 4.4, miraY: 2, dur: 4, mezcla: 0.9 }),
    narra('Ramón está en la loma, solo, mirando el galpón de esquila vacío. No te saluda. Tiene la boina en la mano y el viento le mueve el poco pelo que le queda. Parece una estatua que se olvidó de que es de carne.'),
    efecto('optativa:volver-a-subir'),
    // con el lazo al máximo: el mate de Chocolate
    etq(plano('primer', 'ramon', { desde: 'jugador', mezcla: 0.7, dur: 3 }), 'cierre-majada'),
    con(dlg('ramon', [
      "Esperá, m'hijo. Tengo algo para vos.",
      linea('Es el mate de Chocolate. Una calabacita tallada, con el perro dibujado en el costado. Lo hizo un tío mío.', { gesto: gs('contar', 2.6) }),
      'Lo cuidé cuarenta años. Ahora lo cuidás vos.',
    ]), lazoAl('ramon', 3)),
    con(efecto('objeto:mate-de-chocolate'), lazoAl('ramon', 3)),
    eleccion('majada-fin-resp', '¿Qué hacés?', [
      opcion('quedar', 'Quedarte un rato más mirando el campo.', { sabor: true }),
      opcion('mate', 'Cebar un mate y dárselo a Ramón.', { sabor: true }),
      opcion('irse', 'Irte sin interrumpir.', { sabor: true }),
    ]),
    con(narra('El campo es una página en blanco con renglones de alambre. Una oveja te mira desde lejos, y vos a ella. Hay conversaciones mejores que las que se hacen con palabras.'), siEleg('majada-fin-resp', 'quedar')),
    con(narra('Cebás un mate bien cargado y se lo pasás. Lo toma, lo prueba, asiente. «Lavado no», dice. «Así.» Sin darse cuenta, te acaba de dar el primer elogio de toda la historia.'), siEleg('majada-fin-resp', 'mate')),
    con(narra('Te vas despacio, sin interrumpir. Lo que se queda mirando un hombre mayor en una loma no es asunto de nadie más.'), siEleg('majada-fin-resp', 'irse')),
    efecto('raro:los-de-la-majada'),
  ],
};

const volverASubir = {
  id: 'volver-a-subir', titulo: 'Volver a subir', acto: 3, capitulo: 13,
  resumen: 'Le llevaste el mate a Ramón, en la loma, te sentaste al lado y esperaste a que hablara. Dijo: «La majada era una excusa. Lo que no quería era quedarme solo.»',
  personajes: pj3('ramon', 'narra'),
  pasos: [
    plano('general', FRENTE(12, -3), { desde: 'jugador', dist: 20, alto: 4, miraY: 2, dur: 3.6, mezcla: 0.9 }),
    aparece('ramon', FRENTE(5, -1)),
    narra('Subís la loma con el termo bajo el brazo y el mate de calabaza. Ramón no gira la cabeza. Sabe que estás. No dice nada. No te echa, lo cual en él es un permiso.'),
    plano('medio', 'ramon', { desde: 'jugador', dist: 3, mezcla: 0.8, dur: 3 }),
    narra('Te sentás en la hierba mojada, a un metro. Cebás un mate y lo dejás en el pasto, al lado de él. Esperás. El viento sube y baja.'),
    ...apagon([horaMas(1, { dur: 0 })], { dur: 2.4 }),
    narra('Pasa una hora. Nadie habla. Una nube se come el sol y lo devuelve. Un chimango da una vuelta y se va. El mate se termina de enfriar y vos lo cambiás por otro.'),
    plano('primer', 'ramon', { desde: 'jugador', mezcla: 0.7, dur: 3 }),
    dlg('ramon', [
      linea("La majada era una excusa, m'hijo.", { gesto: gs('suspirar', 2.6) }),
      'Lo que no quería era quedarme solo. Yo, que me pasé la vida solo con ovejas y con perros. Qué cosa, ¿no?',
    ]),
    eleccion('subir-resp', '¿Qué le contestás?', [
      opcion('perdon', 'Perdoname por haberla vendido sin avisar.', { sabor: true }),
      opcion('mate', 'Tomá otro mate.', { sabor: true }),
      opcion('silencio', 'No decir nada: quedarte.', { sabor: true }),
    ]),
    dlg('ramon', ["Ya está dicho. Ya está pasado. Pero gracias por escuchar a un viejo."], { si: siEleg('subir-resp', 'perdon') }),
    dlg('ramon', ['Dame, dame. Este sí está bien cargado.'], { si: siEleg('subir-resp', 'mate') }),
    con(narra('Te quedás. La tarde se pone de color miel. Cuando Ramón se levanta, no te mira: te apoya la mano en el hombro, un segundo, y baja caminando con el bastón.'), siEleg('subir-resp', 'silencio')),
    efecto('lazo:ramon:3'),
    efecto('raro:volver-a-subir'),
  ],
};

const josefinaFin = {
  id: 'josefina-fin', titulo: 'Josefina y el cuaderno', acto: 3, capitulo: 13,
  resumen: 'A la tarde, junto al coihue (o al tocón), Josefina te contó qué hizo con el cuaderno de su abuelo: les habló a los chicos de las puertitas, lo dejó en tu repisa, o llegó una bióloga de Bariloche y el coihue ya es «árbol notable».',
  personajes: pj3('josefina', 'narra'),
  disparador: { hora: [14, 19] },
  pasos: [
    plano('general', FRENTE(7, 2), { desde: 'jugador', dist: 14, alto: 3.2, dur: 3.6, mezcla: 0.9 }),
    con(narra('Junto al coihue grande, con las puertitas cerradas en la raíz y la escarcha derritiéndose, el aire huele a corteza mojada y a tiempo.'), no(siDecision('coihue', 'b'))),
    con(narra('Junto al tocón ancho como una mesa, que sigue siendo bonito de una manera triste, una puertita nueva asoma en el borde y tiene la bisagra de cuero fresca.'), siDecision('coihue', 'b')),
    aparece('josefina', FRENTE(4, 2)),
    plano('medio', 'josefina', { desde: 'jugador', dist: 3.2, mezcla: 0.8, dur: 3 }),
    // D4 = A
    con(dlg('josefina', [
      'Vengo de la escuela. Les conté a los chicos de las puertitas.',
      linea('Les dije que no se toca. Que se mira. Me entendieron mejor que los de Parques.', { gesto: gs('hacer-broma', 2.4) }),
    ]), siDecision('cuaderno', 'a')),
    con(efecto('mundo:chicos-dibujan-puertitas'), siDecision('cuaderno', 'a')),
    // D4 = B
    con(narra('Josefina saca el cuaderno de tapas de tela de su abuelo y lo apoya en la repisa, al lado del canto blanco. Se queda un segundo con la mano encima.'), siDecision('cuaderno', 'b')),
    con(dlg('josefina', [linea('Acá está mejor. Acá alguien lo cuida.', { gesto: gs('asentir', 2.2) })]), siDecision('cuaderno', 'b')),
    con(efecto('objeto:cuaderno-del-abuelo'), siDecision('cuaderno', 'b')),
    // D4 = C
    con(narra('Baja del tren una mujer de campera naranja con una cinta métrica en la mano y una cámara colgada al cuello. Es la bióloga de Bariloche. Mide el coihue en tres pasos y lo anota todo.'), siDecision('cuaderno', 'c')),
    con(efecto('mundo:cartel-arbol-notable', { donde: FRENTE(7, 2) }), siDecision('cuaderno', 'c')),
    con(narra('El coihue tiene un cartelito nuevo, de chapa esmaltada: «Árbol notable. No tocar.»'), siDecision('cuaderno', 'c')),
    con(dlg('josefina', [linea('Ahora es oficial. Ahora sí da miedo.', { gesto: gs('reir', 2.4) })]), siDecision('cuaderno', 'c')),
    eleccion('josefina-fin-resp', '¿Qué le decís a Josefina?', [
      opcion('gracias', 'Gracias por mostrarme el valle.', { efecto: 'lazo:ema:1' }),
      opcion('cuaderno', '¿Y la próxima hoja del cuaderno?', { sabor: true }),
      opcion('quedarse', '¿Y ahora qué?', { sabor: true }),
    ]),
    dlg('josefina', [linea('Gracias a vos por haberlo mirado sin mirarlo. Eso es lo más difícil.', { gesto: gs('juntas', 2) })], { si: siEleg('josefina-fin-resp', 'gracias') }),
    dlg('josefina', ['La próxima hoja la escribimos juntos, si querés. Va a ser sobre una nevada.'], { si: siEleg('josefina-fin-resp', 'cuaderno') }),
    dlg('josefina', ['Y ahora volvemos a cuidar. Es lo único que sé hacer, y además lo hago con compañía.'], { si: siEleg('josefina-fin-resp', 'quedarse') }),
    efecto('raro:josefina-y-el-cuaderno'),
  ],
};

const fiestaNieve = {
  id: 'fiesta-nieve', titulo: 'La Fiesta de la Nieve', acto: 3, capitulo: 13,
  resumen: 'En el predio de la aldea, la Fiesta de la Nieve: música, farolitos, ollas humeantes y media aldea brindando. Ercilia dio un discurso corto; Graciela anotó los horarios y se quedó a bailar.',
  personajes: pj3('ercilia', 'graciela', 'herminia', 'ramon', 'pareja', 'narra'),
  disparador: { hora: [17, 23] },
  pasos: [
    ...apagon([hora(19, { dur: 0 }), aparece('ercilia', FRENTE(4, -2)), aparece('graciela', FRENTE(5, 3)), aparece('herminia', FRENTE(6, 0.6)), con(aparece('pareja', FRENTE(3, 1.6)), siAmor())], { dur: 1.8 }),
    plano('general', FRENTE(6), { desde: 'jugador', dist: 14, alto: 3.4, dur: 4, mezcla: 0.9 }),
    narra('El predio de la aldea brilla: farolitos de papel colgados de los postes, ollas humeantes sobre las brasas, una mesa larga que Tito terminó justo a tiempo. Suena un acordeón, y la nieve cruje al compás.'),
    plano('medio', 'ercilia', { desde: 'jugador', dist: 3.4, mezcla: 0.8, dur: 3 }),
    con(dlg('ercilia', [
      linea('Escuchen todos. Será corto.', { gesto: gs('aplaudir', 2) }),
      'Hace tres años que no nace nadie en esta aldea. Hoy hay más gente en la plaza que en una boda. Eso se lo debemos a todos y a uno más.',
    ]), siRamal('salvado')),
    con(dlg('ercilia', [
      linea('Escuchen todos. Será corto.', { gesto: gs('aplaudir', 2) }),
      'Este año el valle se quedó despierto toda una noche. Eso no se agradece con un discurso: se agradece con una mesa larga.',
    ]), no(siRamal('salvado'))),
    plano('paneo', 'ercilia', { hasta: 'graciela', dist: 8, alto: 1.8, dur: 4, mezcla: 0.9 }),
    dlg('graciela', [linea('Anoté todos los horarios del acordeón. Es lo único que no figuraba.', { gesto: gs('contar', 2.2) })]),
    dlg('herminia', ['Noventa años y esta es la fiesta más linda que vi. Y eso que vi muchas.']),
    con(dlg('pareja', [linea('Bailemos una. Una sola, y después vemos.', { gesto: gs('saludar', 2) })]), siAmor()),
    eleccion('fiesta-resp', '¿Qué hacés en la fiesta?', [
      opcion('brindar', 'Brindar con la gente.', { sabor: true }),
      opcion('bailar', 'Sacar a bailar a alguien.', { sabor: true }),
      opcion('mirar', 'Mirar la fiesta desde un costado.', { sabor: true }),
    ]),
    con(narra('Un brindis con cuarenta tazas distintas. Alguien dice «salud» y otro «que dure», y entre las dos cosas se arma un canto largo y desafinado, el mejor del año.'), siEleg('fiesta-resp', 'brindar')),
    con(narra('El acordeón arranca una chacarera y te sacan al medio sin pedirte permiso. Bailás mal, con ganas. Alguien filma. Es probable que no lo borren nunca.'), siEleg('fiesta-resp', 'bailar')),
    con(narra('Te quedás cerca de una olla, con las manos tibias. Mirás las caras: las conocés a todas. Hace un año no conocías a ninguna.'), siEleg('fiesta-resp', 'mirar')),
    con(narra('En un costado, bajo un farolito, dos sombras bailan despacio, pegadas, sin importar la música. Una luz se apaga. La fiesta sigue.'), siAmor()),
    efecto('raro:fiesta-de-la-nieve'),
  ],
};

const umbralFin = {
  id: 'umbral-fin', titulo: 'El umbral', acto: 3, capitulo: 13,
  resumen: 'El primer día del año, a las 7:30, igual que el primer día: el picado sobre el umbral. Con el trato, una ronda de ramitas, un canto blanco, una bolsa vacía doblada prolija y una puertita nueva en la raíz. Con la pelea, el umbral vacío y las puertitas abiertas.',
  personajes: pj3('herminia', 'pareja', 'narra'),
  disparador: { hora: [7, 9] },
  pasos: [
    ...apagon([hora(7.5, { dur: 0 }), con(aparece('pareja', FRENTE(3.6, 1.4)), siAmor())], { dur: 2.4 }),
    plano('picado', FRENTE(2), { desde: 'jugador', dist: 3.2, alto: 6.5, miraY: 0.4, dur: 4, mezcla: 0.9 }),
    narra('Amaneció. Del lago sube una neblina finita y en el techo canta un chucao. Es el mismo picado, la misma luz, el mismo escalón. Pasó un año.'),
    // final A: el trato
    con(efecto('mundo:ronda-ramitas-final', { donde: FRENTE(2) }), no(siTrato('pelea'))),
    con(efecto('mundo:bolsa-vacia-doblada', { donde: FRENTE(2) }), no(siTrato('pelea'))),
    con(narra('En el umbral hay una ronda de ramitas, acomodada como un relojito. En el medio, un canto blanco, liso como un huevo. Y al lado, doblada prolija, una bolsa vacía de harina. Piden la de este año.'), no(siTrato('pelea'))),
    con(narra('Con el piolín colorado, otra vez. El mismo nudo que ataba la bolsa que dejó Eusebio. Alguien lo hizo igual a propósito.'), siDecision('bolsa', 'a')),
    con(narra('Junto a la bolsa hay migas de pan casero, de las de Rosa. Les gustó. Dejaron migas para decir que lo saben.'), siDecision('bolsa', 'b')),
    con(narra('Debajo del canto hay una pluma chica, negra, con la punta blanca. Se acuerdan de la bolsa que dejaste en la raíz el día de la primera molienda.'), siDecision('molienda', 'c')),
    plano('paneo', FRENTE(2), { hasta: FRENTE(30, -6), desde: 'jugador', dist: 12, alto: 3, dur: 5, mezcla: 0.9 }),
    con(narra('Paneo hacia el coihue grande. En la raíz, entre las otras, hay una puertita nueva, de madera clara, con bisagra de cuero fresco. Igual a la de tu repisa.'), no(siDecision('coihue', 'b')), ),
    con(narra('Paneo hacia el tocón ancho. En el borde, entre los anillos más viejos, hay una puertita nueva, con bisagra de cuero fresco. Igual a la de tu repisa. En el tocón, nace algo verde.'), siDecision('coihue', 'b')),
    con(efecto('mundo:puertita-nueva-en-la-raiz', { donde: FRENTE(30, -6) }), no(siTrato('pelea'))),
    // final B: la pelea
    con(narra('El umbral está vacío. Ni ramitas, ni canto, ni una bolsa doblada. Limpio, como una mesa después de una pelea.'), siTrato('pelea')),
    con(narra('Paneo hacia el coihue. Las puertitas de las raíces están abiertas, de par en par, y vacías. Hay telarañas en los marcos. El silencio es el de una casa cuando la gente se mudó.'), siTrato('pelea')),
    con(efecto('mundo:puertitas-vacias', { donde: FRENTE(30, -6) }), siTrato('pelea')),
    con(narra('En la raíz hay una sola bellota, puesta derecha, como un soldadito. Nadie sabe qué quiere decir.'), siPerdon()),
    con(efecto('mundo:bellota-derecha', { donde: FRENTE(30, -6) }), siPerdon()),
    con(aparece('herminia', FRENTE(8, 3)), siTrato('pelea')),
    con(plano('medio', 'herminia', { desde: 'jugador', dist: 5, mezcla: 0.8, dur: 3.4 }), siTrato('pelea')),
    con(narra('En la aldea, Herminia deja la puerta de su casa entornada. Sale al escalón con la taza y mira hacia el cerro. Cree, y no lo dice, que los vecinos que se van, a veces vuelven.'), siTrato('pelea')),
    // la pareja, sólo sugerida
    con(dlg('pareja', ['Feliz año. Otra vez estoy acá, y otra vez es temprano. Qué bueno que no se nos acaba.']), siAmor()),
    // lo que queda
    efecto('mundo:arco-y-honda-en-la-pared'),
    efecto('perfil:del-valle'),
    con(efecto('mundo:puertita-repisa-abre'), no(siTrato('pelea'))),
    con(efecto('mundo:canto-blanco-queda'), siTrato('pelea')),
    con(efecto('mundo:costumbre-del-trato'), no(siTrato('pelea'))),
    eleccion('umbral-resp', '¿Qué hacés?', [
      opcion('entrar', 'Entrar a tomar un mate y mirar el valle.', { sabor: true }),
      opcion('quedarse', 'Quedarte un rato sentado en el escalón.', { sabor: true }),
      opcion('salir', 'Salir a caminar con la mañana.', { sabor: true }),
    ]),
    con(narra('Entrás. El mate se hace solo. Afuera, el valle te mira por la ventana con ojos de lago. No tenés nada urgente. Nadie en este valle tiene apuro, y el que tiene, se le pasa.'), siEleg('umbral-resp', 'entrar')),
    con(narra('Te sentás en el escalón. La madera está tibia. Hay una calma que se parece a la satisfacción pero es más callada.'), siEleg('umbral-resp', 'quedarse')),
    con(narra('Salís. Los pasos hacen un ruido nuevo sobre la escarcha. El valle te devuelve el saludo con humo de chimeneas.'), siEleg('umbral-resp', 'salir')),
    efecto('raro:umbral-del-final'),
  ],
};

const costumbreDejar = {
  id: 'costumbre-dejar', titulo: 'La bolsa de la cosecha', acto: 3, capitulo: 13, repetible: true,
  resumen: 'Después de la cosecha llenaste la bolsa vacía del umbral con harina de tu molino y la dejaste doblada sobre el escalón, como todos los años. Nadie la ve irse.',
  personajes: pj3('narra'),
  disparador: { hora: [17, 23] },
  pasos: [
    plano('detalle', FRENTE(2), { desde: 'jugador', dist: 0.9, alto: 1.1, dur: 3, mezcla: 0.9 }),
    narra('La bolsa vacía de harina, doblada prolija, espera en el escalón desde hace una semana. Es de arpillera, con un piolín colorado. Hoy la llenás con harina de tu muela, de tus habas.'),
    efecto('quitar:harina:1'),
    plano('medio', FRENTE(2), { desde: 'jugador', dist: 3.2, alto: 1.4, dur: 3, mezcla: 0.9 }),
    eleccion('costumbre-resp', '¿Cómo la dejás?', [
      opcion('derecha', 'Derecha, con el nudo hacia afuera.', { sabor: true }),
      opcion('nota', 'Con una notita: «Gracias».', { sabor: true }),
      opcion('sin', 'Sin nada más: lo importante ya está.', { sabor: true }),
    ]),
    con(narra('La parás derecha, con el piolín colorado bien a la vista. Parece un soldadito pequeño y bien portado.'), siEleg('costumbre-resp', 'derecha')),
    con(narra('Escribís «Gracias» en un cartoncito, con letra inclinada, y lo atás con un cordel. Te sale parecida a la de Eusebio.'), siEleg('costumbre-resp', 'nota')),
    con(narra('La dejás como está. A veces, lo que se calla pesa mejor que lo que se dice.'), siEleg('costumbre-resp', 'sin')),
    efecto('mundo:bolsa-llena-en-umbral', { donde: FRENTE(2) }),
    narra('Cerrás la puerta con cuidado. Nadie la ve irse. Esa es la parte del trato que se cumple sola.'),
    efecto('raro:costumbre-bolsa'),
  ],
};

const costumbreRegalito = {
  id: 'costumbre-regalito', titulo: 'El regalito de la mañana', acto: 3, capitulo: 13, repetible: true,
  resumen: 'A la mañana siguiente de dejar la bolsa llena, en el umbral había un regalito: un canto blanco, unos piñones o una pluma. Lo que se deja vuelve.',
  personajes: pj3('narra'),
  disparador: { hora: [6, 10] },
  pasos: [
    plano('picado', FRENTE(2), { desde: 'jugador', dist: 3.2, alto: 6.5, miraY: 0.4, dur: 3.4, mezcla: 0.9 }),
    narra('La bolsa llena ya no está. En su lugar, sobre el escalón, hay algo chiquito, acomodado con cuidado: un regalito.'),
    efecto('mundo:regalito-umbral', { donde: FRENTE(2) }),
    plano('detalle', FRENTE(2), { desde: 'jugador', dist: 0.9, alto: 1.1, dur: 3, mezcla: 0.9 }),
    eleccion('regalito-resp', '¿Qué hacés con el regalito?', [
      opcion('guardar', 'Guardarlo en la repisa, con las demás cosas.', { sabor: true }),
      opcion('mirar', 'Mirarlo un rato antes de tocarlo.', { sabor: true }),
    ]),
    con(narra('Lo ponés en la repisa, entre el canto, la puertita y el cuaderno. El museo de cosas que no se explican crece de a poco, sin apuro.'), siEleg('regalito-resp', 'guardar')),
    con(narra('Lo mirás. Es perfecto, minúsculo, hecho con atención. Alguien se tomó el trabajo de elegirlo. Eso vale más que lo que sea.'), siEleg('regalito-resp', 'mirar')),
    narra('Lo que se deja, vuelve. No siempre igual. Siempre con cuidado.'),
    efecto('raro:regalito'),
  ],
};

export const ESCENAS_C13 = {
  'carpeta-celeste': carpetaCeleste,
  'majada-fin': majadaFin,
  'volver-a-subir': volverASubir,
  'josefina-fin': josefinaFin,
  'fiesta-nieve': fiestaNieve,
  'umbral-fin': umbralFin,
  'costumbre-dejar': costumbreDejar,
  'costumbre-regalito': costumbreRegalito,
};
export const EFECTOS_C13 = [...new Set(Object.values(ESCENAS_C13).flatMap((e) => efectosDe(e)))].sort();
