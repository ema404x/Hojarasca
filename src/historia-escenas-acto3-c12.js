// 4.17.0 (B): ACTO III · capítulo 12 «La noche de la nevada» (el clímax; GUION_HISTORIA.md). Once escenas como datos: lo de antes (la comida
// caliente, llevar a Herminia y a los chicos a la estación, la espera de las 22), las dos de en medio de las olas, el momento de ganar, el
// de perder (con las dos salidas «Otra vez» y «Que amanezca») y los cuatro amaneceres (trato o pelea × ganada o perdida). La defensa en sí
// (tres olas, arco, honda, aliados) es la mecánica de `historia-noche*.js` (parte A): estas escenas la rodean. Los aliados que se ven dependen
// de los lazos: Ramón (lazo ≥ +1), Josefina (≥ +1), Fermín con honda (≥ +2), el perro si tenés; los duendecitos avisan sólo en el trato.
import { efectosDe, dlg, narra, linea, gs, plano, pose, aparece, camina, mira, desaparece, espera, sonido, efecto, opcion, eleccion, siEleg, siDecision } from './historia-escenas-util.js';
import { FRENTE, apagon, hora, con, no, lazoAl } from './historia-escenas-acto2-util.js';
import { pj3, siTrato, siNoche, siDeuda, siAmor, siPerro, primerDe } from './historia-escenas-acto3-util.js';

// los aliados que se ven a la hora de la espera: dependen del lazo (Ramón y Josefina desde +1, Fermín desde +2)
// (4.18.0 C: a la hora de la espera Fermín está arriba del techo de tu galponcito, con la honda; Ramón, sentado en un cajón)
const aliadosAparecen = (espera = false) => [
  con(aparece('ramon', FRENTE(3, -2.6)), lazoAl('ramon', 1)),
  ...(espera ? [con(pose('ramon', 'sentado', { dur: 0.3 }), lazoAl('ramon', 1))] : []),
  con(aparece('josefina', FRENTE(3.4, 2.8)), lazoAl('ema', 1)),
  con(aparece('fermin', espera ? { lugar: 'galpon-noche', techo: true } : FRENTE(7, -5)), lazoAl('fermin', 2)),
];

const cenaCaliente = {
  id: 'cena-caliente', titulo: 'Nadie pelea con la panza vacía', acto: 3, capitulo: 12,
  resumen: 'Antes de la noche cocinaste algo caliente en el refugio y se juntaron los de siempre alrededor de la mesa. Ramón dijo que nadie pelea con la panza vacía, ni ellos, y que por eso bajan.',
  personajes: pj3('ramon', 'josefina', 'narra'),
  disparador: { hora: [17, 21] },
  pasos: [
    plano('general', FRENTE(2.4), { desde: 'jugador', dist: 6, alto: 2.4, dur: 3.2, mezcla: 0.9 }),
    narra('El refugio huele a lo que tiene que oler antes de una noche brava: leña, cebolla, caldo. La estufa tira bien y los vidrios tienen una escarcha que pinta paisajes que no existen.'),
    con(aparece('ramon', FRENTE(2.8, -1.6)), lazoAl('ramon', 1)),
    con(aparece('josefina', FRENTE(3, 1.8)), lazoAl('ema', 1)),
    plano('medio', 'ramon', { desde: 'jugador', dist: 3, mezcla: 0.8, dur: 30, sinEsperar: true }),
    con(dlg('ramon', [
      linea('Nadie pelea con la panza vacía. Ni ellos.', { gesto: gs('cebar-mate', 2) }),
      "Por eso bajan, m'hijo. No es maldad: es hambre. Y el hambre se arregla con harina, con paciencia o con las dos.",
    ]), lazoAl('ramon', 1)),
    con(dlg('josefina', [
      linea('Yo siempre cocino demasiado antes de algo difícil. Es mi forma de no hablar de miedo.', { gesto: gs('hacer-broma', 2.2) }),
      'Pasame el pan. Y no me mires así, que me emociono.',
    ]), lazoAl('ema', 1)),
    narra('Comés despacio, sintiendo cómo el calor te baja del pecho a las manos. Afuera, la nieve empieza a espesarse. Adentro nadie dice nada importante. Y es lo más importante que pasa.'),
    eleccion('cena-resp', '¿Qué comés?', [
      opcion('guiso', 'Un guiso de cordero, bien espeso.', { sabor: true }),
      opcion('locro', 'Un locro, con mucho zapallo.', { sabor: true }),
      opcion('trucha', 'Trucha con papas, como en el lago.', { sabor: true }),
    ]),
    con(narra('El guiso está tan espeso que la cuchara se queda parada. Tiene gusto a invierno bien pasado.'), siEleg('cena-resp', 'guiso')),
    con(narra('El locro viene con chorizo y maíz. Es el plato de los días en que no queda nada por hacer más que esperar y aguantar.'), siEleg('cena-resp', 'locro')),
    con(narra('La trucha llega entera, con papas hervidas y limón. Se oye el lago en cada bocado. Nicanor lo aprobaría.'), siEleg('cena-resp', 'trucha')),
    efecto('raro:cena-antes-de-la-nevada'),
  ],
};

const herminiaEstacion = {
  id: 'herminia-estacion', titulo: 'A la estación', acto: 3, capitulo: 12,
  resumen: 'Llevaste a Herminia y a los chicos de los Jones a la estación, donde se junta la gente cerca de la salamandra en las noches bravas. Herminia dijo que cuando era chica pasó una igual.',
  personajes: pj3('herminia', 'nahuel', 'lucia', 'ernesto', 'narra'),
  pasos: [
    plano('general', { lugar: 'estacion' }, { dist: 14, alto: 3.4, dur: 3.2, mezcla: 0.9 }),
    narra('La estación está llena. Hay mantas, termos y una salamandra al rojo en el medio del salón, rodeada de vecinos que se hablan bajito. Ernesto reparte tazas de caldo con una paciencia de enfermero.'),
    aparece('herminia', FRENTE(3, 0.8)),
    aparece('nahuel', FRENTE(3.6, -1.4)),
    aparece('lucia', FRENTE(3.8, -2.2)),
    plano('medio', 'herminia', { desde: 'jugador', dist: 3, mezcla: 0.8, dur: 30, sinEsperar: true }),
    dlg('herminia', [
      linea('Cuando yo era chica pasó una igual. Con nieve a las rodillas y una luz allá en el galpón.', { gesto: gs('contar', 2.4) }),
      'Mi madre me tapó la cabeza con una manta y me dijo: «No mires». Yo miré. Qué bueno que miré.',
    ]),
    dlg('nahuel', ['¿Vos vas a pelear con ellos?']),
    dlg('lucia', ['Mi mamá dice que no se pelea. Que se conversa. Pero sin hablar.']),
    eleccion('estacion-nevada', '¿Qué les decís a los chicos?', [
      opcion('cuidar', 'Quédense cerca de Herminia y no se muevan.', { sabor: true }),
      opcion('volver', 'Mañana a la mañana les cuento todo.', { sabor: true }),
      opcion('mate', 'Tomen mate de cebada y no se asusten.', { sabor: true }),
    ]),
    dlg('herminia', ['Los cuido yo. Tengo más experiencia en nevadas que ustedes en vivir.'], { si: siEleg('estacion-nevada', 'cuidar') }),
    dlg('nahuel', ['Prometido. Pero si es muy emocionante, me lo tenés que contar con voces.'], { si: siEleg('estacion-nevada', 'volver') }),
    dlg('lucia', ['Yo quiero uno con azúcar.'], { si: siEleg('estacion-nevada', 'mate') }),
    efecto('raro:herminia-y-la-nevada'),
  ],
};

const nocheEspera = {
  id: 'noche-espera', titulo: 'La espera', acto: 3, capitulo: 12,
  resumen: 'A las 22, en la puerta del galpón, con la nevada cayendo grueso y las defensas prestadas armadas. Con el trato, detrás tuyo se prendieron lucecitas ámbar en las raíces; con la pelea, ojos verdes en el bosque. La campana sonó tres veces.',
  personajes: pj3('ramon', 'josefina', 'fermin', 'martin', 'narra'),
  disparador: { hora: [21.5, 23] },
  pasos: [
    ...apagon([hora(22, { dur: 0 }), efecto('mundo:nevada-fuerte'), efecto('mundo:defensas-armadas', { donde: FRENTE(12) }), ...aliadosAparecen(true)], { dur: 2 }),
    plano('general', FRENTE(14), { desde: 'jugador', dist: 24, alto: 4, miraY: 1.6, dur: 4, mezcla: 0.9 }),
    narra('Nieva con ganas. Los copos son grandes, lentos, y se pegan a todo. Del arroyo sube el ruido del agua negra que corre entre dos bordes blancos. Las estacas, los frascos, los durmientes y la campana están en su lugar.'),
    plano('paneo', FRENTE(4, -4), { hasta: FRENTE(4, 4), desde: 'jugador', dist: 7, alto: 1.6, dur: 5, mezcla: 0.9 }),
    con(narra('Ramón está sentado en un cajón, con la manta de capa y un martillo sobre las rodillas. Jura que no le duele nada. Tiene los labios apretados.'), lazoAl('ramon', 1)),
    con(narra('Josefina, con la trenza al hombro y el arco ya tenso en la mano, no mueve un músculo. Parece parte del paisaje.'), lazoAl('ema', 1)),
    con(narra('Fermín trepó al techo del galpón con la honda enrollada en el brazo. Desde ahí es una silueta chiquita contra el cielo blanco, y se agacha cada vez que la nieve le cae en la cara.'), lazoAl('fermin', 2)),
    con(narra('Tu perro está pegado a tu pierna, con el pelo erizado y la cola dura. No ladra. Está escuchando.'), siPerro()),
    con(efecto('mundo:faroles-en-la-loma'), siDecision('cuaderno', 'a')),
    con(narra('En la loma de atrás, en fila, se ven los faroles de la aldea entera: Ercilia, Rosa, Tito, los chicos con una linterna. Vinieron a mirar, y a que los vean.'), siDecision('cuaderno', 'a')),
    plano('hombro', FRENTE(16), { desde: 'jugador', mezcla: 0.9, dur: 3.2 }),
    con(efecto('duende:lucecitas-raices', { tipo: 'enjambre', n: 20, escalonado: true, ambar: true, desde: 'raices' }), no(siTrato('pelea'))),
    con(narra('Atrás tuyo, en las raíces del coihue grande, se prende una lucecita ámbar. Después otra. Otra más. De a una, como estrellas que se asoman. Hasta ser veinte, formando un semicírculo tibio que mira hacia el arroyo.'), no(siTrato('pelea'))),
    con(dlg('josefina', [linea('Están con nosotros. O nosotros con ellos. Da igual.', { gesto: gs('susurrar', 2.4) })]), siTrato('trato')),
    con(efecto('duende:ojos-verdes', { tipo: 'rastreador', n: 12, ojosVerdes: true, desde: 'otro-lado-del-arroyo' }), siTrato('pelea')),
    con(narra('En el bosque, del otro lado del arroyo, se prenden ojos verdes. Muchos. Quietos, mirando. Una bellota vuela desde la oscuridad y pega en la campana: ¡tin!'), siTrato('pelea')),
    con(sonido('campana'), siTrato('pelea')),
    con(dlg('ramon', [linea('Bueno. Ahora sí que no me duele la cadera.', { gesto: gs('cruzarse', 2.2) })]), siTrato('pelea')),
    eleccion('espera-resp', '¿Qué hacés antes de que empiece?', [
      opcion('respirar', 'Respirar hondo, con los ojos cerrados.', { sabor: true }),
      opcion('arco', 'Revisar el arco y la honda por última vez.', { sabor: true }),
      opcion('mirar', 'Mirar a los tuyos, uno por uno.', { sabor: true }),
    ]),
    con(narra('Aire frío, aire de nieve, aire de leña. Lo guardás en el pecho como una moneda y lo soltás despacio.'), siEleg('espera-resp', 'respirar')),
    con(narra('La cuerda, el astil, la punta, el cuero, los cantos. Todo está donde tiene que estar. Es raro lo tranquilizador que puede ser una lista.'), siEleg('espera-resp', 'arco')),
    con(narra('Los mirás de a uno, en la luz dudosa del farol. Nadie te devuelve la mirada, y a la vez todos. Alguien carraspea. Es suficiente.'), siEleg('espera-resp', 'mirar')),
    plano('detalle', FRENTE(12, 3), { desde: 'jugador', dist: 1, alto: 1.8, dur: 2.6, mezcla: 0.9 }),
    narra('En el poste, la campana del taller se mueve apenas con el viento. Martín la toca tres veces, con el pulso de quien toca para que escuchen. Empieza.'),
    sonido('campana'),
    espera(1.1),
    sonido('campana'),
    espera(1.1),
    sonido('campana'),
    efecto('raro:la-espera'),
  ],
};

const entreOlas1 = {
  id: 'noche-entre-1', titulo: 'Entre la primera ola y la segunda', acto: 3, capitulo: 12,
  resumen: 'Pasada la primera ola, hubo un respiro: Ramón reparó una estaca renegando, Josefina contó las flechas y, si la aldea estaba en la loma, se oyeron aplausos. La campana avisó que venía otra.',
  personajes: pj3('ramon', 'josefina', 'fermin', 'narra'),
  pasos: [
    plano('general', FRENTE(12), { desde: 'jugador', dist: 20, alto: 3.4, dur: 3.2, mezcla: 0.9 }),
    plano('medio', FRENTE(8), { desde: 'jugador', dist: 6, alto: 1.8, dur: 2.6, mezcla: 0.9 }),
    narra('La primera ola se fue como llegó: de golpe, con un rastro de huellas revueltas y una estaca torcida. El aire huele a nieve removida. Nadie festeja: todos cuentan.'),
    con(dlg('ramon', [linea('Esta se aflojó. Pásenme el martillo.', { gesto: gs('barba', 2) }), 'Y no me miren como si fuera de cristal. Yo ya reparé cosas más grandes que esto con las manos peores.']), lazoAl('ramon', 1)),
    con(dlg('josefina', [linea('Me quedan veinte flechas. Hagamos que duren.', { gesto: gs('contar', 2) })]), lazoAl('ema', 1)),
    con(dlg('fermin', ['Desde el techo se ve todo. Les juro que son menos de lo que parece.']), lazoAl('fermin', 2)),
    con(narra('Desde la loma suben aplausos, claros y chicos, de manos con guantes. La aldea festeja la ola ganada como si fuera un gol. Se te llena el pecho de una cosa tibia.'), siDecision('cuaderno', 'a')),
    con(narra('Las lucecitas de las raíces se mueven un poco, nerviosas, y vuelven a su lugar. Una de ellas parpadea dos veces, como avisando algo.'), no(siTrato('pelea'))),
    con(narra('Del otro lado del arroyo, los ojos verdes se mezclan y se vuelven a juntar. Son menos que antes, pero los que quedan están más quietos.'), siTrato('pelea')),
    eleccion('olas-1-resp', '¿Qué hacés en el respiro?', [
      opcion('flechas', 'Recoger las flechas que quedaron clavadas.', { sabor: true }),
      opcion('estaca', 'Ayudar a reparar la estaca torcida.', { sabor: true }),
      opcion('agua', 'Tomar un trago de agua caliente del termo.', { sabor: true }),
    ]),
    con(narra('Las flechas salen de la nieve con un chasquido. Las contás: veintidós. No está mal. Las sacudís y las volvés al carcaj.'), siEleg('olas-1-resp', 'flechas')),
    con(narra('Entre dos la enderezan. Queda más o menos recta. La estaca no es de aluminio: es de hierro de arado, y tiene un carácter que respeta.'), siEleg('olas-1-resp', 'estaca')),
    con(narra('El agua te quema la lengua y te despierta. Por un segundo te olvidás de que hay algo del otro lado del arroyo esperando que termines.'), siEleg('olas-1-resp', 'agua')),
    sonido('campana'),
    narra('La campana suena otra vez. Dos golpes. La segunda ola viene.'),
    efecto('raro:primera-ola'),
  ],
};

const entreOlas2 = {
  id: 'noche-entre-2', titulo: 'Entre la segunda ola y la tercera', acto: 3, capitulo: 12,
  resumen: 'Antes de la última ola, ya de madrugada, el cansancio pesaba. Se sabía que venía el más grande de todos, con el Mandamás. Los tuyos se acomodaron sin decir palabra.',
  personajes: pj3('ramon', 'josefina', 'fermin', 'narra'),
  pasos: [
    plano('general', FRENTE(12), { desde: 'jugador', dist: 20, alto: 3.4, dur: 3.2, mezcla: 0.9 }),
    narra('Ya es de madrugada. La nieve cae más despacio, como si se cansara. El arco te pesa. Las manos están rojas de frío y no sentís los dedos de los pies. Hay un silencio de cuando el aire descansa.'),
    plano('medio', 'jugador', { desde: FRENTE(3), dist: 3, alto: 1.5, dur: 2.6, mezcla: 0.9 }),
    con(dlg('ramon', [linea('La más grande viene ahora. Se nota en el aire, m\'hijo.', { gesto: gs('mirar', 2) }), 'Cuando se calla el viento es que están juntándose. Hay que aguantar. Después se acaba.']), lazoAl('ramon', 1)),
    con(dlg('josefina', [linea('Si no tiro más, no quiero que me lo reprochen. Es mi mejor flecha.', { gesto: gs('senalar', 2) }), 'Cuiden el galpón. Yo cuido el lomo del grande.']), lazoAl('ema', 1)),
    con(dlg('fermin', [linea('Tengo tres cantos grandes guardados. Para el último.', { gesto: gs('encogerse', 2) })]), lazoAl('fermin', 2)),
    con(narra('Las lucecitas de las raíces se van juntando hacia el lado del arroyo, una por una, como reuniéndose para cantar. Los hongos del lomo del Mandamás brillan mejor cuando él les da la espalda: ellas lo saben y te lo muestran.'), siTrato('trato')),
    con(narra('Del otro lado, entre los ojos verdes, aparece uno más alto, lento, con los hongos del lomo brillando como dos luces de posición. El Mandamás del galpón. Te está mirando a vos y a nadie más.'), siTrato('pelea')),
    eleccion('olas-2-resp', '¿Qué les decís a los tuyos?', [
      opcion('aguantar', 'Aguantemos hasta que pare la nevada.', { sabor: true }),
      opcion('lomo', 'Apunten al lomo, donde brillan los hongos.', { sabor: true }),
      opcion('nada', 'No decir nada: mirarlos y asentir.', { sabor: true }),
    ]),
    dlg('ramon', ['Eso. Que pare la nevada y se acabó.'], { si: siEleg('olas-2-resp', 'aguantar') }),
    dlg('josefina', ['Entendido. Cuando se dé vuelta, tiro.'], { si: siEleg('olas-2-resp', 'lomo') }),
    con(narra('Asentís. Ellos asienten. Lo que se dice sin palabras en una noche así vale más que un discurso.'), siEleg('olas-2-resp', 'nada')),
    sonido('campana'),
    espera(0.8),
    sonido('campana'),
    espera(0.8),
    sonido('campana'),
    narra('Tres golpes de campana. La última ola se acerca con pasos que se sienten en los pies.'),
    efecto('raro:segunda-ola'),
  ],
};

const trasGanar = {
  id: 'noche-tras-ganar', titulo: 'Se acabó', acto: 3, capitulo: 12,
  resumen: 'Ganaste la noche: el Mandamás se fue o la nevada paró. La campana sonó larga. Los tuyos se dejaron caer en la nieve, agotados, y alguien se rió.',
  personajes: pj3('ramon', 'josefina', 'fermin', 'narra'),
  pasos: [
    sonido('campana'),
    plano('general', FRENTE(12), { desde: 'jugador', dist: 20, alto: 3.6, dur: 3.4, mezcla: 0.9 }),
    narra('Un silencio nuevo se mete entre la nieve. La nevada afloja, afloja, y para. La campana suena una vez larga, redonda, que se queda en el aire como un abrazo.'),
    plano('primer', 'jugador', { desde: FRENTE(2), dist: 2.4, alto: 1.5, dur: 3, mezcla: 0.9 }),
    narra('Las manos te tiemblan. Dejás el arco en la nieve y te sentás al lado. El cuerpo sigue haciendo cosas sin avisar: respira, tiembla, tiene sed.'),
    con(dlg('ramon', [linea('Se acabó.', { gesto: gs('suspirar', 2.4) }), "Se acabó, m'hijo. Ayudame a pararme, que ahora sí me duele la cadera."]), lazoAl('ramon', 1)),
    con(dlg('josefina', [linea('No me sale la voz. Ni un poco.', { gesto: gs('hacer-broma', 2) })]), lazoAl('ema', 1)),
    con(dlg('fermin', ['Bajo del techo. Bajo despacio, que ahora le tengo respeto a la altura.']), lazoAl('fermin', 2)),
    con(narra('Tu perro te apoya el hocico en la rodilla, una vez, y se queda quieto. Es su manera de decirte que está todo bien.'), siPerro()),
    con(narra('Desde la loma, la aldea entera grita, silba y agita los faroles. Es un ruido enorme, torpe, hermoso. Lo oís como si fuera lejano.'), siDecision('cuaderno', 'a')),
    eleccion('ganar-resp', '¿Qué hacés?', [
      opcion('sentar', 'Quedarte sentado en la nieve un rato.', { sabor: true }),
      opcion('abrazar', 'Abrazar a quien tengas más cerca.', { sabor: true }),
      opcion('mirar', 'Mirar el cielo, que ya se está aclarando.', { sabor: true }),
    ]),
    con(narra('Te quedás ahí. La nieve te moja el pantalón y no te importa. Por primera vez en horas, nadie te necesita para nada.'), siEleg('ganar-resp', 'sentar')),
    con(narra('Abrazás a quien tenés más cerca. Es un abrazo torpe, con herramientas de por medio, que se prolonga más de lo que sabrías explicar.'), siEleg('ganar-resp', 'abrazar')),
    con(narra('Arriba, entre dos nubes, se asoma una estrella. Después otra. El cielo está limpio, lavado, esperando el sol.'), siEleg('ganar-resp', 'mirar')),
    efecto('raro:noche-ganada'),
  ],
};

const trasPerder = {
  id: 'noche-tras-perder', titulo: 'Sin aire', acto: 3, capitulo: 12,
  resumen: 'Te quedaste sin aire, sentado en la nieve, y el galpón crujió. Los tuyos te ayudaron a pararte. Podías intentarlo otra vez, sin castigo, desde las 22, o dejar que amaneciera con lo que pasó.',
  personajes: pj3('ramon', 'josefina', 'fermin', 'narra'),
  pasos: [
    plano('primer', 'jugador', { desde: FRENTE(2), dist: 2.2, alto: 1.2, dur: 3.2, mezcla: 0.9 }),
    narra('Te quedaste sin aire, sentado en la nieve. El galpón cruje. Las estacas, doblegadas, parecen dedos. La nevada sigue cayendo sobre todo como si no pasara nada.'),
    plano('general', FRENTE(10), { desde: 'jugador', dist: 18, alto: 3.2, dur: 3.2, mezcla: 0.9 }),
    con(dlg('ramon', [linea("Esto no se terminó, m'hijo. Esto recién empieza.", { gesto: gs('cruzarse', 2.2) }), 'Aire. Respirá. Respirá.']), lazoAl('ramon', 1)),
    con(dlg('josefina', [linea('Mirame. Estás vivo. Está todo bien.', { gesto: gs('senalar', 2) })]), lazoAl('ema', 1)),
    con(dlg('fermin', ['Se puede volver a empezar. Ya aprendí: nunca tires con el viento de frente.']), lazoAl('fermin', 2)),
    narra('Nadie se lastimó. Nadie sangra. Hay frío y hay cansancio, y hay un amanecer que no llegó todavía. Te preguntan con la mirada qué querés hacer.'),
    eleccion('perdida-resp', '¿Qué hacés?', [
      opcion('otra', 'Otra vez: volver a las 22, sin castigo.', { efecto: 'noche:reintentar' }),
      opcion('amanezca', 'Que amanezca, con lo que pasó.', { efecto: 'noche:perdida' }),
    ]),
    ...apagon([hora(22, { dur: 0 })], { dur: 1.6 }).map((p) => con(p, siEleg('perdida-resp', 'otra'))),
    con(narra('Vuelve la hora del primer golpe de campana. Todo está como estaba: las estacas, los frascos, la gente. Tenés los dedos fríos, pero también un plan nuevo.'), siEleg('perdida-resp', 'otra')),
    con(narra('Dejás que la noche termine sola. Alguien te pone una manta en los hombros. Alguien te alcanza un mate. Lo que va a pasar, va a pasar, y vas a estar ahí para verlo.'), siEleg('perdida-resp', 'amanezca')),
    efecto('raro:noche-perdida'),
  ],
};

// los cuatro amaneceres: trato o pelea × ganada o perdida. Los planos son los de siempre: general del valle blanco, medio de ustedes, primer plano final.
const amanecerTratoGanada = {
  id: 'amanecer-trato-ganada', titulo: 'El amanecer del trato', acto: 3, capitulo: 12,
  resumen: 'Ganaste la noche con el trato. Los del cerro subieron despacio la ladera; las lucecitas salieron de las raíces y rodearon el galpón. El de la gorra torcida dejó un canto blanco, el gemelo del de tu umbral.',
  personajes: pj3('josefina', 'ramon', 'pareja', 'narra'),
  disparador: { hora: [5, 9] },
  pasos: [
    ...apagon([hora(7, { dur: 0 }), ...aliadosAparecen(), con(aparece('pareja', FRENTE(3.6, 0.2)), siAmor())], { dur: 2.2 }),
    plano('general', FRENTE(20), { desde: 'jugador', dist: 36, alto: 6, miraY: 5, dur: 4.4, mezcla: 0.9 }),
    narra('El valle amanece blanco. El sol está bajo y tiñe la nieve de color durazno. En la ladera, los del cerro suben en fila, despacio, con la barba de liquen cargada de escarcha.'),
    efecto('duende:viejos-suben-cerro', { tipo: 'bruto', n: 5, viejo: true, enFila: true, hacia: 'cerro' }),
    efecto('duende:lucecitas-rodean-galpon', { tipo: 'enjambre', n: 20, rodean: true }),
    plano('medio', FRENTE(5), { desde: 'jugador', dist: 6, alto: 1.8, dur: 3.4, mezcla: 0.9 }),
    narra('Las lucecitas salen de las raíces y rodean el galpón, flotando cerca de las tablas, como asegurándose de que esté entero. Después se apagan, de a una, con la luz del día.'),
    con(dlg('pareja', ['Estás entero. Me alcanza con eso. Después vemos lo demás.']), siAmor()),
    efecto('duende:gorra-torcida-saluda', { tipo: 'rastreador', n: 1, gorraTorcida: true, deja: 'canto-blanco', saluda: true }),
    plano('primer', FRENTE(2.2), { desde: 'jugador', dist: 1.6, alto: 0.8, miraY: 0.5, dur: 3.6, mezcla: 0.8 }),
    narra('Uno de los chiquitos se acerca. Lo reconocés: la gorra torcida, la misma que usaba el que te saludó entre las raíces. Deja en la nieve, adelante tuyo, un canto blanco, liso como un huevo. Es el gemelo del que tenés en la repisa. Se va corriendo.'),
    efecto('objeto:canto-gemelo'),
    con(dlg('josefina', [linea('Eso sí que no estaba en ningún libro.', { gesto: gs('reir', 2.6) }), 'Perdón. Es que es la primera vez que me río en toda esta historia.']), lazoAl('ema', 1)),
    con(dlg('ramon', ["Mirá vos. Entre tanta cosa, un canto. Eusebio se estará riendo donde esté, y con razón, m'hijo."]), lazoAl('ramon', 1)),
    eleccion('amanecer-tg-resp', '¿Qué hacés con el canto?', [
      opcion('repisa', 'Llevarlo a la repisa, con el otro.', { sabor: true }),
      opcion('raiz', 'Devolverlo a la raíz con un gracias.', { sabor: true }),
      opcion('bolsillo', 'Guardarlo en el bolsillo, tibio.', { sabor: true }),
    ]),
    con(narra('En la repisa quedan dos cantos blancos, juntos, como dos huevos de una misma nidada que nadie va a incubar. Se miran. Vos los mirás a los dos.'), siEleg('amanecer-tg-resp', 'repisa')),
    con(narra('Lo apoyás en el hueco de la raíz. Un segundo después ya no está. No viste cómo. Estaba seco y tibio.'), siEleg('amanecer-tg-resp', 'raiz')),
    con(narra('Te lo guardás. Es una piedra, pero pesa lo que pesa un favor bien hecho. Lo vas a sentir en el bolsillo todo el invierno.'), siEleg('amanecer-tg-resp', 'bolsillo')),
    efecto('raro:amanecer-del-trato'),
  ],
};

const amanecerTratoPerdida = {
  id: 'amanecer-trato-perdida', titulo: 'Un amanecer torcido', acto: 3, capitulo: 12,
  resumen: 'Perdiste la noche, pero igual hubo trato: a la mañana el galpón estaba medio caído y con harina en la nieve, y los chicos lo estaban arreglando con tablas torcidas clavadas con espinas de calafate, mal y con ganas.',
  personajes: pj3('ramon', 'josefina', 'pareja', 'narra'),
  disparador: { hora: [5, 9] },
  pasos: [
    ...apagon([hora(7.4, { dur: 0 }), ...aliadosAparecen(), con(aparece('pareja', FRENTE(3.6, 0.2)), siAmor())], { dur: 2.2 }),
    plano('general', FRENTE(14), { desde: 'jugador', dist: 24, alto: 4, dur: 4, mezcla: 0.9 }),
    narra('El galpón quedó medio caído, con una pared inclinada y el techo con un hueco por donde se ve el cielo. Hay harina desparramada en la nieve, como si hubiera nevado dos veces. Los del cerro se llevaron bolsas y se fueron.'),
    efecto('duende:chicos-arreglan-galpon', { tipo: 'rastreador', n: 6, arreglan: true, clavanCon: 'espinas-de-calafate' }),
    plano('medio', FRENTE(12), { desde: 'jugador', dist: 6, alto: 1.8, dur: 3.4, mezcla: 0.9 }),
    narra('Pero a la mañana, los chicos están arreglando el galpón. Hay seis, siete, nueve de ellos trepados a las tablas torcidas. Las clavan con espinas de calafate, mal y con muchas ganas.'),
    con(dlg('ramon', [linea('Mirá cómo clavan.', { gesto: gs('reir', 2.4) }), "Igualito que vos el primer día, m'hijo."]), lazoAl('ramon', 1)),
    con(dlg('josefina', [linea('Qué raro es perder así. Se siente como ganar a lo bruto.', { gesto: gs('hacer-broma', 2.2) })]), lazoAl('ema', 1)),
    con(dlg('pareja', ['Se cayó una pared. Se arma otra. Vos volviste. Esa es la parte que contaba.']), siAmor()),
    eleccion('amanecer-tp-resp', '¿Qué hacés?', [
      opcion('ayudar', 'Agarrar el martillo y ayudar a los chicos.', { sabor: true }),
      opcion('mirar', 'Mirarlos trabajar un rato más.', { sabor: true }),
      opcion('harina', 'Barrer la harina y devolverla a las bolsas.', { sabor: true }),
    ]),
    con(narra('Te acomodás entre dos duendes que clavan al revés. Cuando terminás, la pared tiene tres tablas rectas y siete torcidas. Les parece perfecto. A vos también.'), siEleg('amanecer-tp-resp', 'ayudar')),
    con(narra('Te quedás de brazos cruzados, con una sonrisa que no sabías que tenías. Hay cosas que se miran mejor desde lejos.'), siEleg('amanecer-tp-resp', 'mirar')),
    con(narra('Barrés la harina con la pala, despacio, y la devolvés a las bolsas. La que no se puede recuperar la dejás en la nieve. Los pájaros se encargan.'), siEleg('amanecer-tp-resp', 'harina')),
    con(narra('Del lado del arroyo, el último duendecito se queda mirándote con un martillito de juguete en la mano. Asiente. Se va a clavar.'), no(siDeuda())),
    efecto('raro:amanecer-torcido'),
  ],
};

const amanecerPeleaGanada = {
  id: 'amanecer-pelea-ganada', titulo: 'Ganamos', acto: 3, capitulo: 12,
  resumen: 'Ganaste la noche de la pelea. El Mandamás se fue último; en el borde del bosque se dio vuelta y te miró, y bajó la cabeza. No se sabe si fue una derrota o una despedida. Josefina preguntó por qué no se sentía como ganar.',
  personajes: pj3('josefina', 'ramon', 'pareja', 'narra'),
  disparador: { hora: [5, 9] },
  pasos: [
    ...apagon([hora(7, { dur: 0 }), ...aliadosAparecen(), con(aparece('pareja', FRENTE(3.6, 0.2)), siAmor())], { dur: 2.2 }),
    plano('general', FRENTE(20), { desde: 'jugador', dist: 36, alto: 6, miraY: 5, dur: 4.4, mezcla: 0.9 }),
    narra('Amanece sin pájaros. El sol sube despacio sobre una nieve tan limpia que duele mirarla. Las huellas de la noche cruzan el campo en todas direcciones, como los trazos de un dibujo hecho con rabia.'),
    efecto('duende:mandamas-al-bosque', { tipo: 'jefe', ultimo: true, hasta: 'borde-del-bosque' }),
    plano('contrapicado', FRENTE(30, -6), { desde: 'jugador', dist: 14, mezcla: 0.9, dur: 4, miraY: 3 }),
    narra('El Mandamás se va último. En el borde del bosque se da vuelta y te mira, como en el galpón. Baja la cabeza. No se sabe si es derrota o despedida.'),
    efecto('duende:suben-todos-al-cerro', { tipo: 'rastreador', n: 12, suben: true }),
    plano('medio', FRENTE(4), { desde: 'jugador', dist: 5, alto: 1.7, dur: 3.2, mezcla: 0.9 }),
    narra('Suben todos al cerro, los grandes y los chicos, en una sola fila. El bosque queda en silencio. Un silencio raro, nuevo, que se te pega a la piel.'),
    con(dlg('josefina', [linea('Ganamos.', { gesto: gs('suspirar', 2.4) }), '¿Por qué no se siente como ganar?']), lazoAl('ema', 1)),
    con(dlg('ramon', ['Porque ganar no siempre es lo mismo que tener razón, m\'hijo.']), lazoAl('ramon', 1)),
    con(dlg('pareja', ['Ganaste, y no te alegra. Eso dice bastante de vos. Vení, hace frío.']), siAmor()),
    eleccion('amanecer-pg-resp', '¿Qué sentís?', [
      opcion('alivio', 'Alivio, y un poco de vergüenza.', { sabor: true }),
      opcion('vacio', 'Un vacío raro, como después de una discusión.', { sabor: true }),
      opcion('orgullo', 'Orgullo por los que se quedaron conmigo.', { sabor: true }),
    ]),
    dlg('josefina', ['Ese alivio es sano. El que se alegra de pelear no sabe qué pelea.'], { si: siEleg('amanecer-pg-resp', 'alivio') }),
    dlg('josefina', ['Ese vacío tiene nombre. Se llama saber que el valle no es solo nuestro.'], { si: siEleg('amanecer-pg-resp', 'vacio') }),
    dlg('josefina', ['Con razón. Fuimos pocos y alcanzamos. Eso es raro de ver, y hay que cuidarlo.'], { si: siEleg('amanecer-pg-resp', 'orgullo') }),
    efecto('raro:amanecer-de-la-pelea'),
  ],
};

const amanecerPeleaPerdida = {
  id: 'amanecer-pelea-perdida', titulo: 'Acá perdemos todos', acto: 3, capitulo: 12,
  resumen: 'Perdiste la noche de la pelea. A la mañana el galpón estaba vacío, con las puertas abiertas y huellas en fila hasta el cerro. Los vecinos llegaron de la estación con bolsas: Ercilia con harina del fiado, Rosa con pan, Fermín con un cordero.',
  personajes: pj3('ercilia', 'rosa', 'fermin', 'ramon', 'josefina', 'pareja', 'narra'),
  disparador: { hora: [5, 9] },
  pasos: [
    ...apagon([hora(7.6, { dur: 0 }), ...aliadosAparecen(), con(aparece('pareja', FRENTE(3.6, 0.2)), siAmor())], { dur: 2.2 }),
    plano('general', FRENTE(14), { desde: 'jugador', dist: 24, alto: 4, dur: 4, mezcla: 0.9 }),
    narra('El galpón está vacío. Las puertas abiertas dejan entrar un viento helado. En el piso, la harina revuelta, y en la nieve de afuera una fila de huellas que va derecho al cerro y no vuelve.'),
    aparece('ercilia', FRENTE(12, 5)),
    aparece('rosa', FRENTE(13, 3)),
    con(aparece('fermin', FRENTE(14, -5)), no(lazoAl('fermin', 2))),
    camina('ercilia', FRENTE(3.4, 1.2), { vel: 2, mira: 'jugador' }),
    camina('rosa', FRENTE(3.8, 2.4), { vel: 2, mira: 'jugador' }),
    plano('medio', 'ercilia', { desde: 'jugador', dist: 3.6, mezcla: 0.8, dur: 30, sinEsperar: true }),
    narra('Los vecinos llegan de la estación cargando bolsas: Ercilia con harina del fiado, Rosa con una canasta de pan todavía tibio, Fermín con un cordero sobre los hombros.'),
    dlg('ercilia', [
      linea('Acá, cuando uno pierde, perdemos todos un poquito.', { gesto: gs('abrazar', 2.4) }),
      'Y un poquito, entre todos, es poco. Traje harina. Rosa trajo pan. Fermín, un cordero. Esto se levanta, querido.',
    ]),
    dlg('rosa', ['El pan salió mejor que nunca. Capaz porque lo hice enojada.']),
    con(dlg('ramon', ["La próxima vez, m'hijo, con más cabeza y menos prisa."]), lazoAl('ramon', 1)),
    con(dlg('josefina', ['No lo conté, pero lloré un poco en el techo. No se lo digas a nadie.']), lazoAl('ema', 1)),
    con(dlg('pareja', ['Te quiero entero. Lo demás se junta de a poco.']), siAmor()),
    eleccion('amanecer-pp-resp', '¿Qué hacés?', [
      opcion('gracias', 'Aceptar con gratitud lo que traen.', { sabor: true }),
      opcion('perdon', 'Pedir perdón por haber llegado a esto.', { sabor: true }),
      opcion('plan', 'Proponer arreglar el galpón entre todos.', { sabor: true }),
    ]),
    dlg('ercilia', ['Faltaba más. Se agradece comiendo.'], { si: siEleg('amanecer-pp-resp', 'gracias') }),
    dlg('ercilia', ['No se pide perdón por haber peleado por el valle. Se pide por no haber hablado antes. Y eso todavía se puede.'], { si: siEleg('amanecer-pp-resp', 'perdon') }),
    dlg('ercilia', ['Ahora hablás bien. Hoy mismo, con martillos.'], { si: siEleg('amanecer-pp-resp', 'plan') }),
    efecto('raro:amanecer-de-todos'),
  ],
};

export const ESCENAS_C12 = {
  'cena-caliente': cenaCaliente,
  'herminia-estacion': herminiaEstacion,
  'noche-espera': nocheEspera,
  'noche-entre-1': entreOlas1,
  'noche-entre-2': entreOlas2,
  'noche-tras-ganar': trasGanar,
  'noche-tras-perder': trasPerder,
  'amanecer-trato-ganada': amanecerTratoGanada,
  'amanecer-trato-perdida': amanecerTratoPerdida,
  'amanecer-pelea-ganada': amanecerPeleaGanada,
  'amanecer-pelea-perdida': amanecerPeleaPerdida,
};
export const EFECTOS_C12 = [...new Set(Object.values(ESCENAS_C12).flatMap((e) => efectosDe(e)))].sort();
