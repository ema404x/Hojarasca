// 4.16.0 (B): ACTO II · capítulo 7 «La cosecha» (el punto medio de la Historia; GUION_HISTORIA.md). Siete escenas como datos.
// La decisión D3 (la primera molienda) se toma en `primera-molienda` y se cumple en una de tres escenas: `molienda-fletes` (A),
// `molienda-fiado` (B) o `molienda-partir` (C). `galpon-ronda` es el punto medio: el cuaderno de Eusebio.
import { efectosDe, dlg, narra, linea, gs, hombro, plano, pose, aparece, camina, mira, desaparece, espera, sonido, efecto, opcion, eleccion, siEleg, siDecision } from './historia-escenas-util.js';
import { pj, FRENTE, apagon, hora, con, no } from './historia-escenas-acto2-util.js';

const primerDe = (a, o = {}) => ({ plano: 'primer', a, desde: 'jugador', mezcla: 0.7, dur: 30, sinEsperar: true, ...o });
const hayTocon = siDecision('coihue', 'b');

const primeraMolienda = {
  id: 'primera-molienda', titulo: 'La primera molienda', acto: 2, capitulo: 7,
  resumen: 'En el molino, con diez bolsas de harina apiladas, llegaron Ercilia, Graciela y Josefina una atrás de la otra. Tenías que decidir qué hacer con la primera molienda: fletes a Esquel, fiado de invierno para la aldea, o partirla.',
  personajes: pj('ercilia', 'graciela', 'josefina', 'narra'),
  disparador: { hora: [8, 12] },
  pasos: [
    efecto('mundo:diez-bolsas', { donde: FRENTE(2.8) }),
    plano('general', FRENTE(3), { desde: 'jugador', dist: 12, alto: 3, dur: 3.2, mezcla: 0.9 }),
    narra('Diez bolsas de harina, apiladas junto a la puerta del molino. Todavía están tibias de la muela. Huelen a pan que va a ser.'),
    aparece('ercilia', FRENTE(9, 4)),
    camina('ercilia', FRENTE(3.6, 1.8), { vel: 2, mira: 'jugador' }),
    aparece('graciela', FRENTE(11, -3)),
    camina('graciela', FRENTE(4, -1.8), { vel: 1.8, mira: 'jugador' }),
    aparece('josefina', FRENTE(8, 7)),
    camina('josefina', FRENTE(5, 5), { vel: 1.5, mira: 'jugador' }),
    plano('paneo', 'ercilia', { hasta: 'graciela', dist: 8, alto: 2, dur: 3, mezcla: 0.9 }),
    dlg('ercilia', [
      linea('Querido, diez bolsas.', { gesto: gs('aplaudir', 2) }),
      'Con esto la aldea pasa el invierno sin fiado. Bueno, con menos fiado.',
    ]),
    dlg('graciela', [
      'Diez bolsas a Esquel son media tonelada para el ramal.',
      linea('Media tonelada que figura en la planilla.', { gesto: gs('contar', 2) }),
    ]),
    plano('hombro', { lugar: 'coihue' }, { desde: 'josefina', atras: 0, costado: 0, miraY: 6, alto: 1.7, mezcla: 0.9, dur: 3 }),
    dlg('josefina', [
      linea('Mi abuelo dejaba una aparte. Siempre una aparte.', { gesto: gs('mirar', 2.4) }),
    ]),
    narra('Las tres te miran. La harina huele a ganas. Te toca a vos decir adónde va.'),
    eleccion('molienda', '¿Qué hacés con la primera molienda?', [
      opcion('a', 'Fletes a Esquel por la trochita, para el ramal.', { efecto: 'decision:molienda:a' }),
      opcion('b', 'El fiado de invierno de la aldea, en el almacén.', { efecto: 'decision:molienda:b' }),
      opcion('c', 'Partirla: un poco de cada cosa y una bolsa a la raíz.', { efecto: 'decision:molienda:c' }),
    ], 1),
    con(dlg('graciela', [linea('Una decisión de planilla. Tres fletes, seis bolsas. Me gusta cuando los números se parecen a la realidad.', { gesto: gs('asentir', 2) })]), siEleg('molienda', 'a')),
    con(dlg('ercilia', ['Esquel, dice. ¿Y acá qué comemos? ...Ya, ya, no digo nada. El ramal también es de nosotros.']), siEleg('molienda', 'a')),
    con(dlg('ercilia', [linea('Ay, querido. Nélida va a tener que sumar de nuevo todo, de la alegría que me dio.', { gesto: gs('aplaudir', 2) })]), siEleg('molienda', 'b')),
    con(dlg('graciela', ['Cómo no. La aldea primero. Los números pueden esperar un poco.']), siEleg('molienda', 'b')),
    con(dlg('josefina', [linea('Una aparte. Gracias.', { gesto: gs('asentir', 1.8) })]), siEleg('molienda', 'c')),
    con(dlg('ercilia', ['De todo un poco. Eusebio decía que ese era el modo de no pelearse con nadie.']), siEleg('molienda', 'c')),
    efecto('raro:diez-bolsas'),
  ],
};

const moliendaFletes = {
  id: 'molienda-fletes', titulo: 'Fletes a Esquel', acto: 2, capitulo: 7,
  resumen: 'Cargaste las bolsas en la trochita y las llevaste a Esquel en tres fletes. Elsa y Graciela contaron las bolsas en el andén; Ercilia puso cara de «¿y acá qué comemos?».',
  personajes: pj('elsa', 'graciela', 'ercilia', 'narra'),
  pasos: [
    efecto('decision:molienda:a'),
    plano('general', { lugar: 'estacion' }, { dist: 13, alto: 3.4, dur: 3.2, mezcla: 0.9 }),
    aparece('elsa', { lugar: 'estacion', dx: -2.5, dz: 2 }),
    aparece('graciela', { lugar: 'estacion', dx: 2.5, dz: 1.5 }),
    plano('medio', 'elsa', { desde: 'jugador', mezcla: 0.8, dur: 1, sinEsperar: true }),
    dlg('elsa', [
      linea('Tres fletes, seis bolsas, sin una vuelta de más. Pasajero, usted nació para esto.', { gesto: gs('saludar', 2) }),
      'Mire el vagón. Con harina de la buena el tren pesa distinto. Va contento.',
    ]),
    plano('medio', 'graciela', { desde: 'jugador', mezcla: 0.6, dur: 30, sinEsperar: true }),
    dlg('graciela', [
      linea('Seis bolsas entregadas. Seis puntos en la planilla, más el bonus por regularidad.', { gesto: gs('contar', 2.2) }),
      'Pensé que iban a ser dos. Anoto: «con constancia».',
    ]),
    eleccion('fletes-resp', '¿Qué les decís?', [
      opcion('mas', 'Esto es el principio. Hay más para cargar.', { sabor: true }),
      opcion('aldea', 'Una parte tiene que quedar en la aldea.', { efecto: 'lazo:ercilia:1' }),
    ]),
    dlg('graciela', [linea('Un principio. Lo anoto con lápiz, por si hay que corregirlo con algo mejor.', { gesto: gs('pensar', 2) })], { si: siEleg('fletes-resp', 'mas') }),
    dlg('elsa', ['Eso se habla con Ercilia, que justo viene por ahí con cara de sumar mal.'], { si: siEleg('fletes-resp', 'aldea') }),
    aparece('ercilia', { lugar: 'estacion', dx: -6, dz: -2 }),
    dlg('ercilia', [linea('Esquel, Esquel. ¿Y acá qué comemos?', { gesto: gs('hacer-broma', 2) }), 'No me hagas caso, querido. Es que la harina lo vale. Pero la próxima, un poco para el almacén.']),
    efecto('ramal:4'),
    efecto('lazo:guarda:1'),
    efecto('lazo:graciela:2'),
    efecto('lazo:ercilia:-1'),
    efecto('raro:fletes-harina'),
  ],
};

const moliendaFiado = {
  id: 'molienda-fiado', titulo: 'El fiado de invierno', acto: 2, capitulo: 7,
  resumen: 'Llevaste las bolsas al almacén de Ercilia para el fiado de invierno de la aldea. Nélida las anotó en la libreta y Ercilia casi se pone a bailar.',
  personajes: pj('ercilia', 'nelida', 'narra'),
  pasos: [
    efecto('decision:molienda:b'),
    sonido('bisagra'),
    plano('medio', 'ercilia', { desde: 'jugador', dist: 3.6, dur: 3, mezcla: 0.9 }),
    mira('ercilia', 'jugador'),
    mira('nelida', 'jugador'),
    dlg('ercilia', [
      linea('¡Seis bolsas! ¡Nélida, seis bolsas!', { gesto: gs('aplaudir', 2) }),
      'Con esto el invierno no entra a la aldea con la panza vacía. Hacemos el fiado largo: cada vecino se lleva lo que necesita y paga cuando deshiele.',
    ]),
    dlg('nelida', ['Seis bolsas, a fiado, dos meses, ... y alcanza. Hasta me sobra para cuadernos.']),
    eleccion('fiado-resp', '¿Qué le decís a Ercilia?', [
      opcion('todos', 'Que alcance para todos, también para los de afuera.', { efecto: 'lazo:ercilia:1' }),
      opcion('orden', 'Anotalo todo bien, que Graciela cuenta todo.', { sabor: true }),
    ]),
    dlg('ercilia', [linea('Para todos, querido. Es la única regla de esta casa.', { gesto: gs('asentir', 1.8) })], { si: siEleg('fiado-resp', 'todos') }),
    dlg('nelida', ['Cada cosa en su renglón. Y la harina con letra clara.'], { si: siEleg('fiado-resp', 'orden') }),
    plano('detalle', FRENTE(1), { desde: 'jugador', dist: 0.85, alto: 1.2, dur: 3, mezcla: 0.8 }),
    narra('En la libreta, con letra redonda de Nélida: «Harina de Eusebio — fiado de invierno». Debajo, una línea más chica, de otra mano: «Se les debe: una». Ya estaba escrita.'),
    efecto('lazo:ercilia:2'),
    efecto('raro:fiado-invierno'),
  ],
};

const moliendaPartir = {
  id: 'molienda-partir', titulo: 'Una bolsa para la raíz', acto: 2, capitulo: 7,
  resumen: 'Partiste la primera molienda: dos fletes, tres bolsas al almacén y una bolsa al pie del coihue (o del tocón). Nadie se quejó. Casi.',
  personajes: pj('josefina', 'narra'),
  pasos: [
    efecto('decision:molienda:c'),
    efecto('mundo:bolsa-a-la-raiz', { donde: FRENTE(2.4) }),
    plano('medio', FRENTE(2.4), { desde: 'jugador', dist: 3.4, dur: 2.8, mezcla: 0.9 }),
    con(narra('Dejás la bolsa entre las raíces del coihue grande, en el mismo hueco alisado. Esta vez la harina es tuya: de tu muela, de tus habas.'), no(hayTocon)),
    con(narra('Dejás la bolsa sobre el tocón ancho, en el centro, donde estaban los anillos más viejos. Pensás que es un gesto tardío. Lo hacés igual.'), hayTocon),
    sonido('juntar'),
    aparece('josefina', FRENTE(9, 5)),
    camina('josefina', FRENTE(4, 2.2), { vel: 1.5, mira: 'jugador' }),
    plano('medio', 'josefina', { desde: 'jugador', mezcla: 0.9, dur: 1, sinEsperar: true }),
    dlg('josefina', [
      linea('Una aparte. Como mi abuelo.', { gesto: gs('asentir', 2) }),
      'Yo no digo que sea ciencia. Pero a veces la costumbre sabe más que la ciencia.',
    ]),
    con(dlg('josefina', ['No lo vas a arreglar con harina. Pero un tocón con una bolsa me duele menos que un tocón solo.']), hayTocon),
    eleccion('partir-resp', '¿Qué le decís?', [
      opcion('costumbre', 'Fue la costumbre del molino, nada más.', { sabor: true }),
      opcion('contar', 'No se lo cuento a nadie.', { efecto: 'lazo:ema:1' }),
    ]),
    dlg('josefina', ['Las costumbres se heredan. Alguien las tiene que heredar.'], { si: siEleg('partir-resp', 'costumbre') }),
    dlg('josefina', [linea('Gracias. Ya hablamos de eso otro día.', { gesto: gs('saludar', 1.6) })], { si: siEleg('partir-resp', 'contar') }),
    desaparece('josefina'),
    efecto('ramal:2'),
    efecto('lazo:ercilia:1'),
    efecto('lazo:graciela:1'),
    efecto('raro:bolsa-raiz-segunda'),
  ],
};

const mingaAldea = {
  id: 'minga-aldea', titulo: 'La minga', acto: 2, capitulo: 7,
  resumen: 'En el camino del refugio a la aldea, todos los vecinos trabajaron juntos en la minga: palas, carretillas, mate. Fermín le empezó a decir algo a Ramón y Ramón no lo dejó.',
  personajes: pj('ramon', 'fermin', 'ercilia', 'narra'),
  disparador: { hora: [9, 17] },
  pasos: [
    efecto('mundo:minga', { donde: FRENTE(12, 4) }),
    plano('general', FRENTE(12, 4), { desde: 'jugador', dist: 18, alto: 5, dur: 3.6, mezcla: 0.9 }),
    narra('Hay veinte personas en el camino, todas con una pala, una carretilla o un mate, y ninguna parada. Se ríen, se retan, se pasan el barro. En el valle, trabajar juntos es la fiesta más vieja.'),
    aparece('ramon', FRENTE(8, -2)),
    aparece('fermin', FRENTE(7.6, -3.4)),
    plano('medio', 'fermin', { desde: 'jugador', dist: 4, mezcla: 0.9, dur: 1, sinEsperar: true }),
    dlg('fermin', [linea('Don Ramón, este invierno…', { gesto: gs('pensar', 2.2) })]),
    plano('medio', 'ramon', { desde: 'jugador', dist: 4, mezcla: 0.5, dur: 30, sinEsperar: true }),
    dlg('ramon', [linea('Este invierno, lo mismo que todos.', { gesto: gs('negar', 2) }), 'Pasame la pala.']),
    narra('Fermín abre la boca. La cierra. Le pasa la pala. Hay frases que se quedan en la pala.'),
    eleccion('minga-resp', '¿Qué hacés en la minga?', [
      opcion('pala', 'Agarrar una pala y trabajar con los demás.', { sabor: true }),
      opcion('comida', 'Repartir lo que cocinaste entre la gente.', { efecto: 'lazo:ercilia:1' }),
      opcion('cerca', 'Quedarte cerca de Ramón y Fermín.', { sabor: true }),
    ]),
    narra('Palear baja el humor de cualquiera. A la tarde tenés las manos hechas ampollas y la espalda llena de gente.'),
    con(dlg('ercilia', [linea('Pan casero, tortas fritas… ¡esto sí es una minga! Querido, vos entendiste la aldea más rápido que nadie.', { gesto: gs('aplaudir', 2) })]), siEleg('minga-resp', 'comida')),
    con(narra('Te quedás cerca, sin mirar. Fermín se limpia las manos en el pantalón tres veces. Ramón sigue sin mirarlo. Los dos saben todo y no se dicen nada: así se quieren acá.'), siEleg('minga-resp', 'cerca')),
    efecto('raro:minga-aldea'),
  ],
};

const ferminMulas = {
  id: 'fermin-mulas', titulo: 'Lo que Fermín quiere decir', acto: 2, capitulo: 7,
  resumen: 'En el galpón de esquila, Fermín te contó que Belisario le ofreció irse con las mulas al otro lado de la cordillera, y que tiene hasta el invierno para contestar. Pidió que Ramón no se enterara.',
  personajes: pj('fermin', 'narra'),
  pasos: [
    plano('general', { lugar: 'galpon' }, { dist: 15, alto: 3.8, dur: 3.2, mezcla: 0.9 }),
    mira('fermin', 'jugador'),
    plano('medio', 'fermin', { desde: 'jugador', dist: 3.6, mezcla: 1, dur: 1, sinEsperar: true }),
    dlg('fermin', [
      linea('Veniste. Pensé que no.', { gesto: gs('saludar', 1.6) }),
      linea('Belisario me ofreció irme con las mulas, al otro lado.', { gesto: gs('encogerse', 2.2) }),
      'Hasta el invierno tengo para contestar. No le digas a Ramón. Ramón ya tiene bastante con ser Ramón.',
    ]),
    eleccion('mulas-fermin', '¿Qué le decís a Fermín?', [
      opcion('callar', 'No le voy a decir nada a Ramón.', { efecto: 'lazo:fermin:1' }),
      opcion('querer', '¿Vos qué querés hacer?', { efecto: 'lazo:fermin:1' }),
      opcion('hablar', 'Deberías hablar con él.', { sabor: true }),
    ]),
    dlg('fermin', [linea('Gracias. A veces uno necesita decirlo en voz alta a alguien que no lo mire con pena.', { gesto: gs('asentir', 1.8) })], { si: siEleg('mulas-fermin', 'callar') }),
    dlg('fermin', [
      linea('Yo quiero un puesto mío. Una majada chica, aunque sea. Eso quiero.', { gesto: gs('mirar', 2.4) }),
      'Pero se lo digo a Ramón y es como decirle que me voy. Y no me voy. ...Capaz me voy.',
    ], { si: siEleg('mulas-fermin', 'querer') }),
    dlg('fermin', ['Tenés razón. Pero hay frases que cuestan más que cruzar el paso. Dejame un poco de tiempo.'], { si: siEleg('mulas-fermin', 'hablar') }),
    efecto('mundo:fermin-oferta-sabida'),
    efecto('lazo:fermin:1'),
  ],
};

const galponRonda = {
  id: 'galpon-ronda', titulo: 'El galpón en ronda', acto: 2, capitulo: 7,
  resumen: 'Al amanecer, después de la minga, el galpón estaba abierto: la harina volcada en montoncitos en ronda como un reloj, huellas chiquitas, un pozo recién hecho y, adentro, envuelto en hule, el cuaderno de Eusebio.',
  personajes: pj('cuaderno', 'narra'),
  disparador: { hora: [5.5, 9] },
  pasos: [
    ...apagon([hora(6.4, { dur: 0 }), efecto('mundo:galpon-ronda', { donde: FRENTE(3.4) })], { dur: 2 }),
    plano('detalle', FRENTE(3.2), { desde: 'jugador', dist: 1, alto: 1.4, dur: 3, mezcla: 0.9 }),
    narra('La puerta del galpón está entornada. Vos la cerraste anoche, con las dos trabas. Por la rendija sale un olor a harina fresca.'),
    plano('travelling', FRENTE(3.2), { hasta: FRENTE(1.2), desde: 'jugador', dist: 3.5, alto: 1.5, dur: 3.4, mezcla: 0.9 }),
    narra('Empujás la puerta con dos dedos. No hay nadie. No falta nada. Las bolsas que quedaban están abiertas, y la harina no está desparramada: está en montoncitos.'),
    plano('picado', FRENTE(1.2), { desde: 'jugador', dist: 2.4, alto: 7, miraY: 0.2, dur: 4, mezcla: 0.9 }),
    narra('Doce montoncitos, iguales, puestos en ronda como las horas de un reloj. Alrededor, huellas de pie chiquito. En el centro, un pozo recién hecho en la tierra del piso.'),
    efecto('mundo:pozo-cuaderno', { donde: FRENTE(1.2) }),
    plano('primer', FRENTE(1.2), { desde: 'jugador', dist: 1.5, alto: 1.5, miraY: 0.3, dur: 3.2, mezcla: 0.8 }),
    narra('Adentro del pozo, envuelto en hule, hay un cuaderno de tapas oscuras. Una sola nota de música, corta, en el aire, como si el galpón hubiera tomado aliento.'),
    plano('detalle', FRENTE(1.2), { desde: 'jugador', dist: 0.75, alto: 1.1, dur: 3, mezcla: 0.8 }),
    narra('En la tapa, con tinta que se corrió de tanto guardarse: «Molino del Arroyo. E. Millán. Cuentas y tratos.»'),
    eleccion('galpon-cuaderno', '¿Qué hacés?', [
      opcion('agarrar', 'Agarrar el cuaderno.', { sabor: true }),
      opcion('mirar', 'Mirar la ronda un rato más antes de tocar nada.', { sabor: true }),
    ]),
    con(narra('Te quedás un rato. La ronda no se mueve. Los montoncitos no tienen ni una hebra fuera de lugar: alguien hizo esto con paciencia de relojero.'), siEleg('galpon-cuaderno', 'mirar')),
    efecto('objeto:cuaderno-eusebio'),
    sonido('anotar'),
    dlg('cuaderno', [
      'Al que tenga la llave. Si estás leyendo esto, ellos te lo dieron, y yo no estoy.',
      'No les tengas miedo, pero tampoco les tengas confianza: tené trato. El trato es así: el molino muele para todos los del valle. Para todos. Y gracias.',
    ]),
    narra('Cerrás el galpón. Después lo volvés a abrir y dejás la puerta entornada. No sabés bien por qué.'),
    efecto('raro:galpon-ronda'),
    efecto('raro:pozo-topo'),
    efecto('raro:cuaderno-hallado'),
  ],
};

export const ESCENAS_C7 = {
  'primera-molienda': primeraMolienda,
  'molienda-fletes': moliendaFletes,
  'molienda-fiado': moliendaFiado,
  'molienda-partir': moliendaPartir,
  'minga-aldea': mingaAldea,
  'fermin-mulas': ferminMulas,
  'galpon-ronda': galponRonda,
};
export const EFECTOS_C7 = [...new Set(Object.values(ESCENAS_C7).flatMap((e) => efectosDe(e)))].sort();
