// 4.16.0 (B): ACTO II · capítulo 5 «La rueda» (GUION_HISTORIA.md). Diez escenas como datos, con el formato del motor (escenas.js) y las
// mismas convenciones de efectos que el acto I (historia-escenas-util.js; lo nuevo, en CAMBIOS_4_16_0_B.md).
// La decisión D2 (el coihue de las puertitas) se toma en `tito-coihue` y se cumple en una de tres escenas: `coihue-en-pie` (A),
// `coihue-talado` (B) o `tobias-pirca` (C). Gana la última acción (la escena de cumplimiento reafirma la decisión).
import { efectosDe, dlg, narra, linea, gs, hombro, plano, pose, aparece, camina, mira, desaparece, espera, sonido, efecto, opcion, eleccion, siEleg, siDecision } from './historia-escenas-util.js';
import { pj, FRENTE, apagon, con, no } from './historia-escenas-acto2-util.js';

const primerDe = (a, o = {}) => ({ plano: 'primer', a, desde: 'jugador', mezcla: 0.7, dur: 30, sinEsperar: true, ...o });
const noEsB = no(siDecision('coihue', 'b'));

const piedrasMolino = {
  id: 'piedras-molino', titulo: 'Las piedras del molino viejo', acto: 2, capitulo: 5,
  resumen: 'Josefina te llevó arroyo arriba hasta las muelas rotas del molino de Eusebio: el trigo del valle se molía ahí, y con el agua de la nieve alcanza para una muela y una sierra. El coihue enorme de atrás no se toca.',
  personajes: pj('josefina', 'narra'),
  disparador: { hora: [8, 11] },
  pasos: [
    plano('travelling', 'josefina', { desde: 'jugador', dist: 4.6, alto: 1.7, lado: 1, dur: 3.4, sinEsperar: true }),
    aparece('josefina', FRENTE(3, 1.2)),
    camina('josefina', FRENTE(8, -1.6), { vel: 1.5, mira: 'jugador' }),
    plano('general', FRENTE(9, -3), { desde: 'jugador', dist: 14, alto: 3.8, dur: 3.4, mezcla: 0.9 }),
    narra('Entre los coirones y el barro seco asoman dos muelas rotas, grandes como mesas. Más atrás, contra el cielo, un coihue enorme que parece mirar el arroyo.'),
    plano('primer', 'josefina', { desde: 'jugador', mezcla: 0.9, dur: 1, sinEsperar: true }),
    dlg('josefina', [
      linea('Acá se molía el trigo de todo el valle.', { gesto: gs('mirar', 2) }),
      linea('Mi abuelo lo traía en carro desde la estepa, tres días de viaje. Eusebio lo molía y le devolvía la harina menos la maquila. Y una bolsa aparte, que nunca supe para quién era.', { gesto: gs('contar', 2.8) }),
      'Con el agua de la nieve alcanza para mover una muela y una sierra. Si armás el molino, la harina sale de tus habas y el aserradero te hace las tablas mientras dormís. El arroyo trabaja gratis.',
    ]),
    con(dlg('josefina', [
      linea('Mirá lo que traje.', { gesto: gs('senalar', 1.6) }),
      'La nota de Eusebio, la de la bolsa. La saqué del bolsillo veinte veces en estos días. ...Para quién era la bolsa aparte, digo. Bueno. Ahora lo sabemos los dos, o casi.',
    ]), siDecision('bolsa', 'c')),
    plano('hombro', { lugar: 'coihue' }, { desde: 'jugador', atras: 0, costado: 0, miraY: 6, alto: 1.7, mezcla: 0.9, dur: 2.6 }),
    dlg('josefina', [
      linea('Y ese no se toca.', { gesto: gs('cruzarse', 2), plano: primerDe('josefina') }),
      'Bueno. Eso lo vamos a hablar.',
    ]),
    eleccion('piedras-resp', '¿Qué le decís a Josefina?', [
      opcion('arbol', '¿Cuántos años tiene ese coihue?', { sabor: true }),
      opcion('no', 'Yo no pensaba tocar ese árbol.', { efecto: 'lazo:ema:1' }),
      opcion('agua', 'Un molino que trabaja gratis me gusta.', { sabor: true }),
    ]),
    dlg('josefina', [linea('Cuatrocientos, más o menos. Los anillos no mienten, pero nadie se animó a contarlos con la sierra.', { gesto: gs('encogerse', 2) })], { si: siEleg('piedras-resp', 'arbol') }),
    dlg('josefina', [linea('Eso dicen todos antes de ver el aserradero armado. Pero te creo. Por ahora.', { gesto: gs('asentir', 1.8) })], { si: siEleg('piedras-resp', 'no') }),
    dlg('josefina', [linea('Gratis, sí. Pero el arroyo tiene dueños que no se anotan en ningún catastro. Acordate.', { gesto: gs('senalar', 2) })], { si: siEleg('piedras-resp', 'agua') }),
    pose('josefina', 'saludar', { dur: 1.4 }),
    camina('josefina', FRENTE(16, 8), { vel: 1.6 }),
    efecto('raro:muelas-molino-viejo'),
  ],
};

const zainoRamon = {
  id: 'zaino-ramon', titulo: 'El zaino', acto: 2, capitulo: 5,
  resumen: 'Ramón te prestó el zaino para acarrear troncos y piedras al molino: manso, dice, y se monta con la izquierda. Te lo presta hasta que el invierno lo devuelva.',
  personajes: pj('ramon', 'narra'),
  pasos: [
    plano('medio', 'ramon', { desde: 'jugador', dist: 3.4, dur: 2.8, mezcla: 0.9 }),
    mira('ramon', 'jugador'),
    dlg('ramon', [
      linea('Llevate el zaino para acarrear.', { gesto: gs('senalar', 1.8) }),
      linea("Es manso. No le creas a Belisario, que dice que no.", { gesto: gs('hacer-broma', 2) }),
      "Tres troncos y seis piedras al molino, nada más. Y no lo apures en la cuesta, que tiene el aire corto y el orgullo largo.",
      linea('Montá con la izquierda, que si no, se ofende.', { plano: primerDe('ramon') }),
    ]),
    eleccion('zaino-resp', '¿Qué le contestás a Don Ramón?', [
      opcion('nombre', '¿Cómo se llama?', { sabor: true }),
      opcion('belisario', 'Belisario dice que casi lo mata.', { sabor: true }),
      opcion('cuido', 'Lo voy a cuidar como si fuera mío.', { efecto: 'lazo:ramon:1' }),
    ]),
    dlg('ramon', [linea("Zaino. Nunca lo bauticé: el nombre se lo pone el animal con la conducta. Todavía no se decidió.", { gesto: gs('barba', 2) })], { si: siEleg('zaino-resp', 'nombre') }),
    dlg('ramon', [linea("Belisario me vendió una yegua «mansa» que me tiró tres veces en una tarde. Este es hijo de esa yegua. Salió mejor que la madre.", { gesto: gs('negar', 2.2) })], { si: siEleg('zaino-resp', 'belisario') }),
    dlg('ramon', [linea("Eso. Las cosas se cuidan como propias aunque sean prestadas, m'hijo. Sobre todo las prestadas.", { gesto: gs('asentir', 1.8) })], { si: siEleg('zaino-resp', 'cuido') }),
    dlg('ramon', ['Devolvémelo cuando te devuelva el invierno.']),
    efecto('mundo:zaino-prestado'),
    plano('general', FRENTE(4, 2), { desde: 'jugador', dist: 12, alto: 3.2, dur: 3, mezcla: 0.9 }),
    narra('El zaino te mira de costado, resopla y se deja subir. Con la izquierda, claro. Es lo mínimo.'),
  ],
};

const titoCoihue = {
  id: 'tito-coihue', titulo: 'Tito y el coihue', acto: 2, capitulo: 5,
  resumen: 'Tito y Josefina se plantaron cada uno de un lado del coihue grande: él lo quiere para tablas finas y para el aserradero; ella no lo toca. Elegiste qué hacer con el árbol de las puertitas.',
  personajes: pj('tito', 'josefina', 'narra'),
  pasos: [
    aparece('tito', FRENTE(6, -4.5), 'jugador'),
    aparece('josefina', FRENTE(6, 4.5), 'jugador'),
    plano('general', FRENTE(6), { desde: 'jugador', dist: 14, alto: 2.8, dur: 3.2, mezcla: 0.9 }),
    narra('Los dos llegaron antes que vos. Cada uno se paró a un lado del coihue, como en un duelo de película del oeste, pero muy amable.'),
    plano('medio', 'tito', { desde: 'jugador', mezcla: 0.9, dur: 1, sinEsperar: true }),
    dlg('tito', [
      linea('Ese coihue tiene cuatrocientos años de madera derecha.', { gesto: gs('palmada', 2) }),
      'Le pago bien, y le hago doce tablas finas que no va a encontrar ni en Bariloche. Y el aserradero va justo acá, en lo plano.',
    ]),
    plano('medio', 'josefina', { desde: 'jugador', mezcla: 0.6, dur: 30, sinEsperar: true }),
    dlg('josefina', [linea('Ese coihue tiene cuatrocientos años, punto.', { gesto: gs('cruzarse', 2.2) })]),
    dlg('tito', ['Señorita, los árboles se caen solos también.']),
    dlg('josefina', ['Que se caiga solo, entonces.']),
    plano('hombro', 'tito', { desde: 'jugador', lado: -1, mezcla: 0.7, dur: 30, sinEsperar: true }),
    dlg('tito', [linea('Usted decide, vecino. La tierra es suya y el árbol está en la tierra. Lo demás es costumbre.', { gesto: gs('encogerse', 2) })]),
    narra('Los dos te miran. El arroyo hace de cuenta que no escucha.'),
    eleccion('coihue', '¿Qué hacés con el coihue grande?', [
      opcion('a', 'Dejarlo en pie y armar el aserradero aguas abajo.', { efecto: 'decision:coihue:a' }),
      opcion('b', 'Talarlo: tablas finas para Tito y un buen pago.', { efecto: 'decision:coihue:b' }),
      opcion('c', 'Pedirle a Tobías una pirca que proteja la raíz.', { efecto: 'decision:coihue:c' }),
    ]),
    con(dlg('josefina', [linea('Gracias.', { gesto: gs('asentir', 1.6) })]), siEleg('coihue', 'a')),
    con(dlg('tito', ['Aguas abajo, a más de veinticinco pasos. Camina mucho el aserradero, pero camina. Qué le vamos a hacer.']), siEleg('coihue', 'a')),
    con(dlg('tito', [linea('Así me gusta. Doce tablas finas y un buen pago. Hable con el hacha, vecino.', { gesto: gs('palmada', 1.8) })]), siEleg('coihue', 'b')),
    con(dlg('josefina', ['...']), siEleg('coihue', 'b')),
    con(narra('Josefina se da vuelta y se va sin una palabra. Hasta el sombrero parece decir algo.'), siEleg('coihue', 'b')),
    con(dlg('josefina', [linea('Una pirca. Puede ser.', { gesto: gs('pensar', 2) }), 'Si Tobías la arma bien, la raíz respira y el árbol queda. Yo te pongo la cabeza; él pone las piedras.']), siEleg('coihue', 'c')),
    con(dlg('tito', ['Piedras para una raíz. Qué cosas hay que ver. Bueno, el aserradero va igual, en lo plano.']), siEleg('coihue', 'c')),
    pose('tito', 'saludar', { dur: 1.2 }),
    desaparece('tito'),
    desaparece('josefina'),
  ],
};

const coihueEnPie = {
  id: 'coihue-en-pie', titulo: 'El aserradero aguas abajo', acto: 2, capitulo: 5,
  resumen: 'El aserradero quedó aguas abajo, lejos del coihue grande. Josefina fue a verlo y Tito le dio la razón a medias: camina mucho, pero camina.',
  personajes: pj('josefina', 'tito', 'narra'),
  pasos: [
    efecto('decision:coihue:a'),
    plano('general', FRENTE(8, 3), { desde: 'jugador', dist: 13, alto: 3.4, dur: 3.2, mezcla: 0.9 }),
    aparece('josefina', FRENTE(5, 2.4)),
    aparece('tito', FRENTE(4.5, -2.6)),
    plano('medio', 'josefina', { desde: 'jugador', mezcla: 0.9, dur: 1, sinEsperar: true }),
    dlg('josefina', [
      linea('Veinticinco pasos justos. Los conté.', { gesto: gs('contar', 2) }),
      'Desde acá no se ve ni la copa. Es un aserradero discreto. Casi pedagógico.',
    ]),
    dlg('tito', [linea('Casi pedagógico, dice. Me hace caminar una cuadra con cada tabla.', { gesto: gs('hacer-broma', 2) })]),
    eleccion('en-pie-resp', '¿Qué les decís?', [
      opcion('carro', 'Se arregla con un carro.', { sabor: true }),
      opcion('gracias', 'Gracias por aguantarse los dos.', { efecto: 'lazo:tito:1' }),
    ]),
    dlg('tito', ['Un carro. Tiene razón. Mañana lo hablo con el herrero.'], { si: siEleg('en-pie-resp', 'carro') }),
    dlg('tito', [linea('Para eso estamos, vecino. Para aguantarnos.', { gesto: gs('saludar', 1.6) })], { si: siEleg('en-pie-resp', 'gracias') }),
    dlg('josefina', ['Dejaste el coihue en pie. Algún día voy a saber cómo agradecértelo sin que suene a discurso.']),
    efecto('lazo:ema:1'),
    efecto('lazo:tito:-1'),
    efecto('raro:coihue-en-pie'),
  ],
};

const coihueTalado = {
  id: 'coihue-talado', titulo: 'El tocón', acto: 2, capitulo: 5,
  resumen: 'Talaste el coihue grande. Quedó un tocón ancho como una mesa, Tito pagó y trajo doce tablas finas, y Josefina pasó de largo sin mirar.',
  personajes: pj('tito', 'josefina', 'narra'),
  pasos: [
    efecto('decision:coihue:b'),
    efecto('mundo:tocon-coihue'),
    plano('picado', FRENTE(5), { desde: 'jugador', dist: 3.8, alto: 6.5, dur: 3.2, mezcla: 0.9 }),
    narra('Donde estaba el coihue hay un tocón ancho como una mesa. Se ven los anillos, apretados, muchos. Huele a madera nueva y a algo más, que no sabés qué es.'),
    aparece('tito', FRENTE(5, -3.2)),
    plano('medio', 'tito', { desde: 'jugador', mezcla: 0.9, dur: 1, sinEsperar: true }),
    dlg('tito', [
      linea('Mire esas tablas. Doce. Derechas como una regla.', { gesto: gs('palmada', 2) }),
      'Le pago lo que dijimos. Y con gusto: hace años que no veo madera así.',
      linea('Eso sí… hoy se siente raro el aire, ¿no? Como cuando cambia el viento y no cambia.', { gesto: gs('mirar', 2.2) }),
    ]),
    efecto('mundo:pago-tito', { cosa: 'tabla-coihue', n: 12 }),
    efecto('dar:tabla-coihue:12'),
    aparece('josefina', FRENTE(11, 6)),
    plano('hombro', 'josefina', { desde: 'jugador', lado: 1, mezcla: 0.8, dur: 3.2 }),
    camina('josefina', FRENTE(9, -7), { vel: 1.9 }),
    narra('Josefina cruza por el camino sin mirar el tocón. Pasa a tres pasos tuyos y no te saluda. Ni siquiera con la tablilla.'),
    eleccion('talado-resp', '¿Qué hacés?', [
      opcion('seguir', 'Dejarla ir. Ya vas a hablar con ella.', { sabor: true }),
      opcion('llamar', 'Llamarla: «Josefina, esperá».', { sabor: true }),
    ]),
    narra('Josefina no se da vuelta. Levanta una mano, apenas, sin mirar. Puede ser un saludo; puede ser un «ahora no».'),
    desaparece('josefina'),
    desaparece('tito'),
    efecto('lazo:ema:-2'),
    efecto('lazo:tito:2'),
    efecto('raro:coihue-talado'),
  ],
};

const tobiasPirca = {
  id: 'tobias-pirca', titulo: 'La pirca de Tobías', acto: 2, capitulo: 5,
  resumen: 'En la cantera, Tobías aceptó levantar una pirca de piedras redondas alrededor de la raíz del coihue, "para que respire". Josefina la vio terminada y se quedó un rato callada.',
  personajes: pj('tobias', 'josefina', 'narra'),
  pasos: [
    efecto('decision:coihue:c'),
    plano('medio', 'tobias', { desde: 'jugador', dist: 3.6, dur: 3, mezcla: 0.9 }),
    mira('tobias', 'jugador'),
    dlg('tobias', [
      linea('¿Una pirca para una raíz?', { gesto: gs('martillar', 1.8) }),
      linea('En Gales mi bisabuelo hacía pircas para que las ovejas no se cayeran del cerro. Para un árbol no hice nunca.', { gesto: gs('senalar', 2.2) }),
      linea('Diolch, me gusta la idea. Las piedras redondas abajo, que la raíz respire.', { gesto: gs('asentir', 1.8) }),
    ]),
    eleccion('pirca-resp', '¿Qué le contestás a Tobías?', [
      opcion('diolch', 'Diolch, entonces.', { sabor: true }),
      opcion('veta', '¿Y la veta de piedra, anda bien?', { sabor: true }),
    ]),
    dlg('tobias', [linea('Ja. Ya hablás como en casa.', { gesto: gs('hacer-broma', 1.8) })], { si: siEleg('pirca-resp', 'diolch') }),
    dlg('tobias', [
      linea('¿Sabe qué? Acá en la cantera, la veta que sacás un año vuelve al otro. Nadie sabe cómo.', { gesto: gs('pensar', 2.2) }),
      linea('Mi padre decía que alguien la rellena de noche.', { gesto: gs('encogerse', 1.8) }),
    ], { si: siEleg('pirca-resp', 'veta') }),
    dlg('tobias', ['Si quiere venir una noche a mirar, avise. Con los cantos blancos, no se asuste.'], { si: siEleg('pirca-resp', 'veta') }),
    efecto('optativa:veta-vuelve'),
    // 4.17.0: la segunda mitad pasa en el coihue de verdad (el jugador se queda en la cantera: antes se armaba 6 pasos delante de la cantera)
    ...apagon([
      aparece('tobias', { lugar: 'coihue', dx: 4.5, dz: -2.5 }),
      aparece('josefina', { lugar: 'coihue', dx: -4, dz: 5 }),
      efecto('mundo:pirca-coihue', { donde: { lugar: 'coihue' } }),
    ], { dur: 2 }),
    plano('general', { lugar: 'coihue' }, { desde: 'jugador', dist: 11, alto: 2.8, dur: 3.2, mezcla: 0.8 }),
    narra('Las piedras redondas están puestas en rueda alrededor de la raíz, sin cemento, una apoyada en la otra. Se sostienen porque sí.'),
    plano('medio', 'josefina', { desde: 'jugador', mezcla: 0.9, dur: 1, sinEsperar: true }),
    camina('josefina', { lugar: 'coihue', dx: -3, dz: 2.4 }, { vel: 1.4 }),
    narra('Josefina se agacha y pasa la mano por las piedras. No dice nada. En ella eso es mucho.'),
    dlg('tobias', [linea('Respira, ¿ve? Cuando sopla el viento, silba un poquito entre las piedras. Es una pirca contenta.', { gesto: gs('senalar', 2) })]),
    efecto('lazo:ema:1'),
    efecto('lazo:tobias:2'),
    efecto('raro:pirca-coihue'),
  ],
};

const ruedaGira = {
  id: 'rueda-gira', titulo: 'La rueda gira', acto: 2, capitulo: 5,
  resumen: 'El molino de agua giró por primera vez: la rueda se quejó, agarró ritmo y la muela empezó a sonar. Josefina miró el coihue (o el lugar donde estaba) un rato largo.',
  personajes: pj('josefina', 'narra'),
  pasos: [
    efecto('mundo:rueda-gira', { donde: FRENTE(2.4) }),
    sonido('juntar'),
    plano('detalle', FRENTE(2.4), { desde: 'jugador', dist: 1.6, alto: 1.2, dur: 3.2, mezcla: 0.9 }),
    narra('El agua empuja la rueda. Se queja, cruje, vuelve a empujar, y de golpe agarra ritmo. Adentro, la muela empieza a hablar con su voz de piedra.'),
    plano('paneo', FRENTE(2.4), { hasta: { lugar: 'coihue' }, dist: 7, alto: 2.4, dur: 4.2, mezcla: 0.9 }),
    con(narra('La cámara sube despacio hasta la copa del coihue grande, que no se movió ni un centímetro, como si el ruido fuera cosa de otro.'), noEsB),
    con(narra('La mirada sube despacio hasta donde estaba el coihue grande. Queda el tocón, ancho como una mesa, y el cielo vacío arriba.'), siDecision('coihue', 'b')),
    con(efecto('mundo:puntitos-verdes', { donde: { lugar: 'coihue' } }), noEsB),
    con(narra('Entre las raíces, al pie, dos puntitos verdes. Se encienden un segundo y se apagan.'), noEsB),
    aparece('josefina', FRENTE(2.8, 1.4)),
    plano('medio', 'josefina', { desde: 'jugador', mezcla: 0.9, dur: 1, sinEsperar: true }),
    narra('Josefina se queda un rato largo mirando. No habla. La rueda sigue.'),
    dlg('josefina', [
      linea('A mi abuelo le va a gustar saber que volvió a moler.', { gesto: gs('suspirar', 2.4) }),
      'Bueno, a mi abuelo le habría gustado. Ya me entendés.',
    ]),
    eleccion('rueda-resp', '¿Qué le decís?', [
      opcion('gusto', 'Le hubiera gustado, sí.', { sabor: true }),
      opcion('mate', 'Vení, te invito un mate al lado de la rueda.', { efecto: 'lazo:ema:1' }),
    ]),
    dlg('josefina', ['Y a mí me gusta que lo digas sin aclarar nada más.'], { si: siEleg('rueda-resp', 'gusto') }),
    dlg('josefina', [linea('Dale. Pero de la yerba que sea de la buena, que el molino se enoja.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('rueda-resp', 'mate') }),
    efecto('raro:rueda-primera-vuelta'),
    con(efecto('raro:puntos-verdes'), noEsB),
  ],
};

const trigoAbuelo = {
  id: 'trigo-abuelo', titulo: 'El trigo del abuelo', acto: 2, capitulo: 5,
  resumen: 'En la seccional, Josefina te mostró la foto del carro de su abuelo cargado de trigo, rumbo al molino de Eusebio.',
  personajes: pj('josefina', 'narra'),
  pasos: [
    plano('medio', 'josefina', { desde: 'jugador', dist: 3.4, dur: 2.8, mezcla: 0.9 }),
    mira('josefina', 'jugador'),
    dlg('josefina', [
      linea('Venías por lo del trigo, ¿no? Esperá.', { gesto: gs('pensar', 1.8) }),
      'Está en el cajón de abajo, junto a los mapas de los senderos. No lo mostré nunca.',
    ]),
    plano('detalle', FRENTE(1), { desde: 'jugador', dist: 0.9, alto: 1.2, dur: 3.2, mezcla: 0.8 }),
    narra('Una foto gastada, en blanco y negro: un carro grande, dos bueyes, bolsas hasta arriba y un hombre de bigote que mira a la cámara con cara de apurado.'),
    dlg('josefina', [
      linea('Ese es. Mi abuelo. Tres días de viaje con el carro y el trigo.', { gesto: gs('senalar', 2) }),
      'Atrás, en la esquina, se ve el molino. Mirá la rueda: la rueda de Eusebio. Casi podés oírla.',
    ]),
    eleccion('trigo-resp', '¿Qué le decís?', [
      opcion('rueda', 'Ahora la rueda vuelve a andar.', { sabor: true }),
      opcion('copia', '¿Me dejás sacarle una copia?', { efecto: 'lazo:ema:1' }),
    ]),
    dlg('josefina', [linea('Por eso te la mostré a vos y no a otro.', { gesto: gs('asentir', 1.8) })], { si: siEleg('trigo-resp', 'rueda') }),
    dlg('josefina', ['Una copia. Sí. Con mucho cuidado, que el papel está cansado.'], { si: siEleg('trigo-resp', 'copia') }),
    efecto('lazo:ema:1'),
    efecto('raro:foto-carro-abuelo'),
  ],
};

const tablasTito = {
  id: 'tablas-tito', titulo: 'Las tablas de Tito', acto: 2, capitulo: 5,
  resumen: 'En la carpintería le vendiste a Tito seis tablas de coihue. Son de primera, aunque a Tito le pesan en la conciencia.',
  personajes: pj('tito', 'narra'),
  pasos: [
    sonido('bisagra'),
    plano('general', FRENTE(2), { desde: 'jugador', dist: 8, alto: 2.4, dur: 2.2, mezcla: 0.9 }),
    narra('La carpintería huele a aserrín tibio y a barniz. Hay tablas apoyadas contra todas las paredes, y una mesa a medio hacer en el medio.'),
    plano('medio', 'tito', { desde: 'jugador', dist: 3.2, dur: 2.8, mezcla: 0.9 }),
    mira('tito', 'jugador'),
    dlg('tito', [
      linea('Seis tablas, de ese coihue. A ver…', { gesto: gs('palmada', 1.8) }),
      'Derechas como una regla. Hace años que no veía veta así. Me las quedo todas, y se las pago bien.',
      linea('La señorita Josefina no me saluda hace tres días. Pero la madera es la madera.', { gesto: gs('encogerse', 2) }),
    ]),
    efecto('mundo:vender-tablas', { cosa: 'tabla-coihue', n: 6 }),
    eleccion('tablas-resp', '¿Qué le decís?', [
      opcion('quedate', 'Quedate con las seis.', { sabor: true }),
      opcion('banco', 'Dejame una para el banco del molino.', { sabor: true }),
    ]),
    dlg('tito', ['Hecho. Con las seis hago una mesa que va a durar más que los dos.'], { si: siEleg('tablas-resp', 'quedate') }),
    dlg('tito', [linea('Te la separo. Una tabla fina, para un banco de coihue: ese va a ser el banco más lindo del valle.', { gesto: gs('asentir', 1.8) })], { si: siEleg('tablas-resp', 'banco') }),
  ],
};

const truchasNicanor = {
  id: 'truchas-nicanor', titulo: 'Las primeras truchas', acto: 2, capitulo: 5,
  resumen: 'Con Nicanor pescaste las primeras truchas del otoño: gordas, lentas y de buen humor. Nicanor dice que el lago anda contento.',
  personajes: pj('nicanor', 'narra'),
  pasos: [
    plano('general', { lugar: 'muelle' }, { dist: 14, alto: 3.4, dur: 3, mezcla: 0.9 }),
    aparece('nicanor', { lugar: 'muelle', dx: -2, dz: 1.4 }),
    plano('medio', 'nicanor', { desde: 'jugador', mezcla: 0.9, dur: 1, sinEsperar: true }),
    dlg('nicanor', [
      linea('Mirá esa. Esa ya viene con ganas de que la saquen.', { gesto: gs('senalar', 1.8) }),
      'Este otoño las truchas vienen gordas y lentas. Será que el lago anda contento. O que el molino las marea con el ruido, no sé.',
    ]),
    eleccion('truchas-resp', '¿Qué le decís a Nicanor?', [
      opcion('contento', 'Un lago contento. Me gusta.', { sabor: true }),
      opcion('ruido', '¿Qué tiene que ver el molino?', { sabor: true }),
    ]),
    dlg('nicanor', [linea('Es lo que me falta para pescar tranquilo: que el lago esté de buen humor.', { gesto: gs('tomar-mate', 2) })], { si: siEleg('truchas-resp', 'contento') }),
    dlg('nicanor', ['Nada. Pero las truchas son sensibles a los ruidos nuevos. Y a los nuevos vecinos. No me mires así: lo dije con cariño.'], { si: siEleg('truchas-resp', 'ruido') }),
    efecto('lazo:nicanor:1'),
  ],
};

export const ESCENAS_C5 = {
  'piedras-molino': piedrasMolino,
  'zaino-ramon': zainoRamon,
  'tito-coihue': titoCoihue,
  'coihue-en-pie': coihueEnPie,
  'coihue-talado': coihueTalado,
  'tobias-pirca': tobiasPirca,
  'rueda-gira': ruedaGira,
  'trigo-abuelo': trigoAbuelo,
  'tablas-tito': tablasTito,
  'truchas-nicanor': truchasNicanor,
};
export const EFECTOS_C5 = [...new Set(Object.values(ESCENAS_C5).flatMap((e) => efectosDe(e)))].sort();
