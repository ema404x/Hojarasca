// 4.17.0 (B): ACTO III · capítulo 11 «El arco y la honda», segunda parte: la cuerda y las puntas, lo prestado para la noche (cinco escenas),
// la deuda del trato, el recorrido del lado del arroyo y las optativas (flechas de más, el cumpleaños que no se suspende y la cita sugerida
// de la pareja la noche antes: SOLO con el amor prendido, nunca obligatoria). Doce escenas más; en total el capítulo tiene 20.
import { efectosDe, dlg, narra, linea, gs, plano, pose, aparece, camina, mira, desaparece, sonido, efecto, opcion, eleccion, siEleg, siDecision } from './historia-escenas-util.js';
import { FRENTE, apagon, hora, con, no, lazoAl } from './historia-escenas-acto2-util.js';
import { pj3, siAmor, siTrato, primerDe } from './historia-escenas-acto3-util.js';

const elviraCuerda = {
  id: 'elvira-cuerda', titulo: 'La cuerda de Elvira', acto: 3, capitulo: 11,
  resumen: 'Le llevaste a Elvira dos vellones y un pan de cera. Con el witral de su abuela te trenzó la cuerda del arco, tan fina que parece un pelo y tan fuerte que no se corta.',
  personajes: pj3('elvira', 'narra'),
  pasos: [
    plano('medio', 'elvira', { desde: 'jugador', dist: 3.2, dur: 3, mezcla: 0.9 }),
    mira('elvira', 'jugador'),
    narra('La hilandería huele a lana cruda y a lavanda seca. En el witral hay un tejido a medio hacer, de guardas rojas y negras. Elvira lo deja y se limpia las manos en el delantal.'),
    dlg('elvira', [
      linea('Vellón y cera. Bien. Dos cosas que no se compran: se tienen.', { gesto: gs('senalar', 2) }),
      'La cuerda se encera cada noche. Y se le habla un poco, para que no se ofenda cuando tire.',
    ]),
    plano('detalle', 'elvira', { desde: 'jugador', dist: 0.9, alto: 1.2, miraY: 1.1, dur: 3.2, mezcla: 0.8 }),
    narra('Los dedos de Elvira trenzan sin mirar, tres hebras y una más, y la cuerda crece entre sus palmas como si la estuviera inventando. Al final la ata con un nudo que parece un botón.'),
    eleccion('cuerda-resp', '¿Qué le decís a Elvira?', [
      opcion('gracias', 'Gracias, Elvira. Es una obra de arte.', { sabor: true }),
      opcion('hablar', '¿Y qué le digo a la cuerda?', { sabor: true }),
    ]),
    dlg('elvira', ['No es arte: es oficio. Pero gracias. Se aprende a aceptar elogios a los setenta.'], { si: siEleg('cuerda-resp', 'gracias') }),
    dlg('elvira', [linea('Lo que sea. Que es de lana y que va a aguantar. A mí me alcanza con eso.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('cuerda-resp', 'hablar') }),
    efecto('quitar:vellon:2'),
    efecto('raro:cuerda-de-elvira'),
  ],
};

const anselmoPuntas = {
  id: 'anselmo-puntas', titulo: 'Doce puntas', acto: 3, capitulo: 11,
  resumen: 'Anselmo te forjó doce puntas de flecha en la herrería: chicas, parejas, con un filo apenas para clavar. No te dijo cuánto era, y vos no preguntaste.',
  personajes: pj3('anselmo', 'narra'),
  pasos: [
    plano('general', FRENTE(6, 1.5), { desde: 'jugador', dist: 12, alto: 2.6, dur: 3, mezcla: 0.9 }),
    narra('La herrería de Anselmo es una cueva tibia con olor a carbón. En el yunque, bajo una luz naranja, el herrero golpea una barrita al rojo con el mismo ritmo con que late un corazón tranquilo.'),
    plano('medio', 'anselmo', { desde: 'jugador', dist: 3.4, mezcla: 0.8, dur: 3 }),
    pose('anselmo', 'martillar', { dur: 2 }),
    dlg('anselmo', [
      linea('Doce puntas. Parejas, que es lo difícil. Cualquiera hace una buena; hacer doce iguales es oficio.', { gesto: gs('senalar', 2.2) }),
      'Las templé en aceite de oveja, como mi abuelo. Si se rompen, es que usted las trató mal.',
    ]),
    plano('detalle', FRENTE(1), { desde: 'jugador', dist: 0.8, alto: 1.1, dur: 3, mezcla: 0.8 }),
    narra('Doce puntitas negras y brillantes, chicas como una uña. Las acomoda sobre un trapo con la misma delicadeza con que otros acomodan huevos.'),
    eleccion('puntas-resp', '¿Cuánto te debo?', [
      opcion('pagar', 'Lo que me pidas, Anselmo.', { sabor: true }),
      opcion('favor', 'Un favor en el futuro.', { sabor: true }),
    ]),
    dlg('anselmo', ['El precio de siempre, que ya lo sabe. Y que no haga preguntas sobre el caballo de mi cuñado.'], { si: siEleg('puntas-resp', 'pagar') }),
    dlg('anselmo', ['Los favores se cobran caro, pero se pagan con gusto. Me lo anoto.'], { si: siEleg('puntas-resp', 'favor') }),
    efecto('mundo:puntas-de-flecha'),
    efecto('raro:puntas-de-anselmo'),
  ],
};

const prestadoHerrero = {
  id: 'prestado-herrero', titulo: 'Estacas de arado', acto: 3, capitulo: 11,
  resumen: 'Anselmo te prestó estacas de hierro viejo, de un arado: duras como el que las forjó. Quedaron clavadas en el lado del arroyo para la noche.',
  personajes: pj3('anselmo', 'narra'),
  pasos: [
    plano('medio', 'anselmo', { desde: 'jugador', dist: 3.4, dur: 3, mezcla: 0.9 }),
    mira('anselmo', 'jugador'),
    dlg('anselmo', [
      linea('Son de un arado viejo. Duras como el que las forjó.', { gesto: gs('barba', 2) }),
      'Las clavás en la nieve con la maza y no se mueven ni con un toro. Llevátelas. Cuando pase todo, me las devolvés. O no. Para eso son.',
    ]),
    efecto('mundo:estacas-prestadas', { donde: FRENTE(12, 4) }),
    plano('general', FRENTE(12, 4), { desde: 'jugador', dist: 14, alto: 2.8, dur: 3.2, mezcla: 0.9 }),
    narra('Una fila de estacas negras, inclinadas hacia afuera, cruza el lado del arroyo como los dientes de un peine. Parecen sacadas de un cuento de abuelos.'),
    eleccion('estacas-resp', '¿Qué le decís a Anselmo?', [
      opcion('gracias', 'Gracias. Las cuido como si fueran mías.', { sabor: true }),
      opcion('maza', '¿Me prestás la maza también?', { sabor: true }),
    ]),
    dlg('anselmo', ['Cuidalas mejor. Las mías las cuido con cariño; las de otros, con vergüenza.'], { si: siEleg('estacas-resp', 'gracias') }),
    dlg('anselmo', ['La maza la prestó mi padre una vez. No volvió. Se la lleva el que viene a buscarla, no el que la pide.'], { si: siEleg('estacas-resp', 'maza') }),
    efecto('prestado:herrero'),
    efecto('raro:estacas-prestadas'),
  ],
};

const prestadoApicultor = {
  id: 'prestado-apicultor', titulo: 'Trampas de miel', acto: 3, capitulo: 11,
  resumen: 'Guido te prestó dos trampas de miel: frascos grandes con miel de ulmo para frenar un rato a los chicos. «Que no se la coman, que es de ulmo.»',
  personajes: pj3('guido', 'narra'),
  pasos: [
    plano('medio', 'guido', { desde: 'jugador', dist: 3.4, dur: 3, mezcla: 0.9 }),
    mira('guido', 'jugador'),
    dlg('guido', [
      linea('Dos trampas de miel. Es miel de ulmo, la mejor del valle, ámbar clarita.', { gesto: gs('senalar', 2) }),
      'Las ponés en un plato de latón, a la vista. El que pase, se queda. Que no se la coman, que es de ulmo.',
    ]),
    plano('detalle', FRENTE(1), { desde: 'jugador', dist: 0.8, alto: 1.1, dur: 3, mezcla: 0.8 }),
    narra('Dos frascos grandes con una miel que parece ámbar derretido, tapados con un paño a cuadros. Zumban apenas, como si las abejas siguieran adentro con ganas.'),
    eleccion('miel-resp', '¿Qué le decís a Guido?', [
      opcion('probar', '¿Puedo probar un poquito?', { sabor: true }),
      opcion('abejas', '¿Y las abejas en invierno?', { sabor: true }),
    ]),
    dlg('guido', [linea('Una cucharada. Una. Después te cobro con la hora del insomnio.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('miel-resp', 'probar') }),
    dlg('guido', ['Duermen en racimo, bien juntas, y se calientan entre ellas. Es lo mejor que aprendí del invierno.'], { si: siEleg('miel-resp', 'abejas') }),
    efecto('mundo:trampas-de-miel', { donde: FRENTE(11, -3) }),
    efecto('prestado:apicultor'),
    efecto('raro:trampas-de-miel'),
  ],
};

const prestadoMaquinista = {
  id: 'prestado-maquinista', titulo: 'La campana del taller', acto: 3, capitulo: 11,
  resumen: 'Martín te prestó la campana vieja del taller ferroviario: avisa de cada ola y suena sola si la golpean. La colgaste en el galpón.',
  personajes: pj3('martin', 'narra'),
  pasos: [
    plano('general', FRENTE(5, 2), { desde: 'jugador', dist: 10, alto: 2.4, dur: 3, mezcla: 0.9 }),
    narra('El taller ferroviario es un galpón alto con vigas de hierro y olor a aceite. En el fondo, colgada de una cadena, una campana de bronce verde de tantos inviernos.'),
    plano('medio', 'martin', { desde: 'jugador', dist: 3.4, mezcla: 0.8, dur: 3 }),
    mira('martin', 'jugador'),
    dlg('martin', [
      linea('Cuarenta años de ferrocarril y esa campana sonó dos veces: el día que llegó y el día que se jubiló mi compañero.', { gesto: gs('barba', 2.4) }),
      'Sirve para avisar de lo que viene. Suena sola si la golpean, y la golpean fuerte los que no tienen miedo.',
    ]),
    eleccion('campana-resp', '¿Qué le decís a Martín?', [
      opcion('cuidar', 'La voy a cuidar, Martín.', { sabor: true }),
      opcion('tocar', '¿Cuántas veces hay que tocarla?', { sabor: true }),
    ]),
    dlg('martin', ['No hace falta cuidarla: lo que hace falta es escucharla. Es otra cosa.'], { si: siEleg('campana-resp', 'cuidar') }),
    dlg('martin', ['Tres veces para empezar. Una por ola, si la ola es de las grandes. Y una larga si todo anda mal.'], { si: siEleg('campana-resp', 'tocar') }),
    efecto('mundo:campana-del-taller', { donde: { lugar: 'galpon' } }),
    efecto('prestado:maquinista'),
    efecto('raro:campana-vieja'),
  ],
};

const prestadoGuarda = {
  id: 'prestado-guarda', titulo: 'Durmientes del ramal', acto: 3, capitulo: 11,
  resumen: 'Elsa te prestó una empalizada de durmientes viejos del ramal, para armar en el lado del arroyo. «Que sirvan de algo esos durmientes, que de tren ya no sirven.»',
  personajes: pj3('elsa', 'narra'),
  pasos: [
    plano('general', { lugar: 'estacion' }, { dist: 14, alto: 3.2, dur: 3.2, mezcla: 0.9 }),
    aparece('elsa', { lugar: 'estacion', dx: -2, dz: 2 }),
    plano('medio', 'elsa', { desde: 'jugador', dist: 3.4, mezcla: 0.8, dur: 30, sinEsperar: true }),
    dlg('elsa', [
      linea('Que sirvan de algo esos durmientes, que de tren ya no sirven.', { gesto: gs('hacer-broma', 2.2) }),
      'Son dieciséis, de lenga, pesados como bueyes. Los acarrean entre cuatro. Pero así quedan clavados y nadie los mueve.',
    ]),
    eleccion('durmientes-resp', '¿Qué le decís a Elsa?', [
      opcion('gracias', 'Cuando termine, se los devuelvo a la vía.', { efecto: 'lazo:guarda:1' }),
      opcion('ayuda', '¿Me ayudás a cargarlos?', { sabor: true }),
    ]),
    dlg('elsa', [linea('No hace falta, pasajero. Alguien que cuida la vía, aunque sea de lejos, es de la casa.', { gesto: gs('saludar', 2) })], { si: siEleg('durmientes-resp', 'gracias') }),
    dlg('elsa', ['Con mi espalda y mi rodete, ni a la plancha. Le mando a Ernesto, que es joven y gruñón.'], { si: siEleg('durmientes-resp', 'ayuda') }),
    efecto('mundo:empalizada-durmientes', { donde: FRENTE(10, 0) }),
    efecto('prestado:guarda'),
    efecto('raro:durmientes-de-elsa'),
  ],
};

const prestadoTobias = {
  id: 'prestado-tobias', titulo: 'La pirca, reforzada', acto: 3, capitulo: 11,
  resumen: 'Tobías reforzó la pirca del coihue con piedras de la veta, sin que se lo pidieras. Quedó como una defensa más para la noche.',
  personajes: pj3('tobias', 'narra'),
  pasos: [
    plano('general', FRENTE(7, 2), { desde: 'jugador', dist: 14, alto: 3, dur: 3.2, mezcla: 0.9 }),
    narra('Alrededor de la raíz del coihue grande, la pirca de Tobías creció dos hileras. Las piedras son las mismas, redondas y cuidadas, pero ahora forman una rueda más alta que una persona agachada.'),
    aparece('tobias', FRENTE(4, -2)),
    plano('medio', 'tobias', { desde: 'jugador', dist: 3.4, mezcla: 0.8, dur: 30, sinEsperar: true }),
    dlg('tobias', [
      linea('No me lo pidió, lo sé. Pero una pirca que no se refuerza, se cansa.', { gesto: gs('senalar', 2) }),
      'Diolch por aquella vez. Con esto la raíz se defiende sola. Y si se defiende sola, usted tiene una cosa menos en qué pensar.',
    ]),
    eleccion('pirca-refuerzo', '¿Qué le decís a Tobías?', [
      opcion('gracias', 'Diolch, Tobías. No sé cómo agradecerte.', { efecto: 'lazo:tobias:1' }),
      opcion('piedras', '¿De dónde sacaste tantas piedras?', { sabor: true }),
    ]),
    dlg('tobias', [linea('Se agradece con una torta galesa. Mi abuela decía: sin torta no hay trato.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('pirca-refuerzo', 'gracias') }),
    dlg('tobias', ['De la veta, que no se acaba nunca. Hay cosas que el valle da sin que se las pidan.'], { si: siEleg('pirca-refuerzo', 'piedras') }),
    efecto('mundo:pirca-reforzada', { donde: FRENTE(7, 2) }),
    efecto('prestado:tobias'),
    efecto('raro:pirca-reforzada'),
  ],
};

const deudaPagada = {
  id: 'deuda-pagada', titulo: 'Lo que se debía', acto: 3, capitulo: 11,
  resumen: 'Pagaste lo que el trato pedía: una bolsa de harina en la raíz del coihue, o seis tablas de coihue sobre el tocón. Por la mañana, ya no estaban. Ahora los chicos van a ayudar en la noche.',
  personajes: pj3('narra'),
  pasos: [
    plano('general', FRENTE(7, 2), { desde: 'jugador', dist: 14, alto: 3.2, dur: 3.2, mezcla: 0.9 }),
    con(narra('Dejás la bolsa de harina en el hueco alisado de la raíz, con el piolín colorado hacia afuera. Una bolsa por la que alguna vez le debías a la aldea, ahora le debés a las raíces. La pagás.'), siDecision('bolsa', 'b')),
    con(efecto('quitar:harina:1'), siDecision('bolsa', 'b')),
    plano('medio', FRENTE(2.4), { desde: 'jugador', dist: 3.4, alto: 1.5, dur: 3, mezcla: 0.9 }),
    con(narra('Apilás seis tablas finas de coihue sobre el tocón ancho, una al lado de la otra, parejas. Pensás que es lo menos que se le puede devolver a un árbol que fue casa de alguien.'), siDecision('coihue', 'b')),
    con(efecto('quitar:tabla-coihue:6'), siDecision('coihue', 'b')),
    sonido('juntar'),
    eleccion('deuda-resp', '¿Qué hacés después de dejarlo?', [
      opcion('esperar', 'Quedarte un rato, por las dudas.', { sabor: true }),
      opcion('irse', 'Irte sin mirar atrás.', { sabor: true }),
    ]),
    con(narra('Esperás. No pasa nada. Pero cuando te levantás, el hueco de la raíz tiene una puertita apenas abierta, de la altura de un dedo. Y se cierra de a poco, sin ruido.'), siEleg('deuda-resp', 'esperar')),
    con(narra('Te vas sin mirar. A los veinte pasos, escuchás atrás un ruido de tablas y una risa chica, ahogada. No te das vuelta. Es lo educado.'), siEleg('deuda-resp', 'irse')),
    efecto('duendes:deuda-pagada'),
    efecto('raro:deuda-pagada'),
  ],
};

const recorrerLado = {
  id: 'recorrer-lado', titulo: 'Recorrer el lado', acto: 3, capitulo: 11,
  resumen: 'Al atardecer recorriste el lado del arroyo al galpón con Ramón (con bastón) o con Josefina. Cada defensa prestada ya estaba en su lugar: estacas, miel, campana, empalizada.',
  personajes: pj3('ramon', 'josefina', 'narra'),
  disparador: { hora: [16.5, 19.5] },
  pasos: [
    ...apagon([hora(17.8, { dur: 0 }), con(aparece('ramon', FRENTE(3, 1.4)), no(siDecision('majada', 'c'))), aparece('josefina', FRENTE(3.4, -1.6))], { dur: 1.4 }),
    plano('travelling', FRENTE(6), { hasta: FRENTE(24), desde: 'jugador', dist: 5, alto: 1.8, lado: 1, dur: 6, mezcla: 0.9 }),
    narra('Caminan despacio por la orilla, pisando nieve que cruje. A cada paso aparece algo prestado: las estacas de Anselmo clavadas en fila, los frascos de Guido sobre un tablón, los durmientes de Elsa formando un muro bajo, la campana de Martín colgando de una viga.'),
    plano('medio', 'ramon', { desde: 'jugador', dist: 3, mezcla: 0.8, dur: 30, sinEsperar: true }),
    con(dlg('ramon', [
      linea('Por acá vienen.', { gesto: gs('mirar', 2) }),
      'Por el agua. Todo baja por el agua, en este valle: la nieve, las truchas, los problemas.',
    ]), no(siDecision('majada', 'c'))),
    con(dlg('ramon', [linea('Fermín me dijo que la majada está bien.', { gesto: gs('barba', 2) }), 'Está mejor que conmigo. No se lo digas.']), siDecision('majada', 'a')),
    con(plano('medio', 'josefina', { desde: 'jugador', dist: 3, mezcla: 0.8, dur: 30, sinEsperar: true }), siDecision('majada', 'c')),
    con(dlg('josefina', [
      linea('Por acá vienen. Por el agua.', { gesto: gs('mirar', 2) }),
      'Ramón no está, y se nota. Hoy el valle camina con una pierna menos.',
    ]), siDecision('majada', 'c')),
    plano('general', FRENTE(-2), { desde: 'jugador', dist: 24, alto: 6, miraY: 2, dur: 4, mezcla: 0.9 }),
    narra('Desde el galpón, mirando hacia el arroyo, el lado de ataque se ve como un dibujo armado a mano: cada cosa en su lugar, cada lugar con su vecino. Se parece más a una fiesta que a una defensa.'),
    eleccion('lado-resp', '¿Qué decís?', [
      opcion('bien', 'Está bien armado. Ojalá no haga falta.', { sabor: true }),
      opcion('falta', 'Falta algo, pero no sé qué.', { sabor: true }),
      opcion('listo', 'Estamos listos.', { sabor: true }),
    ]),
    dlg('josefina', ['Ojalá no haga falta. Aunque yo ya aprendí que lo que uno desea en voz alta se cumple al revés.'], { si: siEleg('lado-resp', 'bien') }),
    dlg('josefina', ['Siempre falta algo. Es lo que mantiene a uno despierto. Mirá el cielo: el resto es suerte.'], { si: siEleg('lado-resp', 'falta') }),
    dlg('josefina', ['Listos, nunca. Pero pronto. Con eso va bien.'], { si: siEleg('lado-resp', 'listo') }),
    efecto('raro:recorrer-el-lado'),
  ],
};

const flechasDeMas = {
  id: 'flechas-de-mas', titulo: 'Flechas de más', acto: 3, capitulo: 11,
  resumen: 'Con más plumas y más puntas, Tito te armó un segundo atado de flechas. Más munición para la noche, envuelta en un trapo de tela cruda.',
  personajes: pj3('tito', 'narra'),
  pasos: [
    plano('medio', 'tito', { desde: 'jugador', dist: 3.4, dur: 3, mezcla: 0.9 }),
    mira('tito', 'jugador'),
    dlg('tito', [
      linea('Otro atado. Con lo que sobró de plumas y de puntas me alcanzó para veinte más.', { gesto: gs('senalar', 2) }),
      'Salen derechas. Las probé una por una contra el tablón. Si alguna sale chueca, es culpa del viento.',
    ]),
    plano('detalle', FRENTE(1), { desde: 'jugador', dist: 0.8, alto: 1.1, dur: 3, mezcla: 0.8 }),
    narra('Un atado de flechas nuevas, de astil claro, con las plumas bien pegadas y las puntas negras de Anselmo. Huelen a cola de carpintero y a lenga.'),
    eleccion('flechas-resp', '¿Qué le decís a Tito?', [
      opcion('gracias', 'Con esto alcanzamos hasta el alba.', { sabor: true }),
      opcion('hacer', '¿Te sobra tiempo para otro más?', { sabor: true }),
    ]),
    dlg('tito', ['Hasta el alba y un poco más. Pero con la puntería, eso lo ponés vos.'], { si: siEleg('flechas-resp', 'gracias') }),
    dlg('tito', [linea('Tiempo no me sobra nunca. Pero madera sí. Y la madera pide ser útil.', { gesto: gs('hacer-broma', 2) })], { si: siEleg('flechas-resp', 'hacer') }),
    efecto('mundo:flechas-extra'),
    efecto('lazo:tito:1'),
    efecto('raro:flechas-de-mas'),
  ],
};

const cumpleNevada = {
  id: 'cumple-nevada', titulo: 'El cumpleaños que no se suspende', acto: 3, capitulo: 11,
  resumen: 'Aunque venía la nevada, fuiste igual al cumpleaños de la aldea. Ercilia hizo torta, los chicos soplaron velitas y por un rato nadie habló de lo que venía.',
  personajes: pj3('ercilia', 'nahuel', 'lucia', 'narra'),
  disparador: { hora: [15, 20] },
  pasos: [
    plano('general', FRENTE(6, 2), { desde: 'jugador', dist: 12, alto: 2.8, dur: 3.4, mezcla: 0.9 }),
    narra('El almacén está lleno de gente con gorros y bufandas. Hay una torta con tres velitas torcidas, un mate que da vueltas y chicos con la nariz roja de frío. Afuera hay viento, adentro hay música de radio.'),
    aparece('ercilia', FRENTE(3, 0.6)),
    aparece('nahuel', FRENTE(4, -2)),
    aparece('lucia', FRENTE(4.4, -2.8)),
    plano('medio', 'ercilia', { desde: 'jugador', dist: 3.2, mezcla: 0.8, dur: 30, sinEsperar: true }),
    dlg('ercilia', [
      linea('Un cumpleaños no se suspende por una nevada, querido.', { gesto: gs('aplaudir', 2.2) }),
      'Una nevada se suspende por un cumpleaños, que es distinto. Soplá, soplá, ¡antes de que se derritan las velitas!',
    ]),
    dlg('nahuel', ['¿Es verdad que vienen de noche los duendes grandes?']),
    dlg('lucia', ['Mi mamá dice que no. Pero se rió de costado.']),
    eleccion('cumple-resp', '¿Qué le contestás a Nahuel?', [
      opcion('verdad', 'No sé, pero estamos preparados.', { sabor: true }),
      opcion('tranquilo', 'Tranquilo: esta noche se va a dormir mucha gente.', { sabor: true }),
      opcion('torta', 'Mejor cortá la torta, que viene el viento.', { sabor: true }),
    ]),
    dlg('nahuel', ['Entonces me quedo despierto para ver.'], { si: siEleg('cumple-resp', 'verdad') }),
    dlg('lucia', ['Yo me tapo la cabeza, pero con un agujerito para espiar.'], { si: siEleg('cumple-resp', 'tranquilo') }),
    dlg('ercilia', ['Eso es hablar bien. Un trozo para cada uno, y el último para el que llegue tarde.'], { si: siEleg('cumple-resp', 'torta') }),
    efecto('lazo:ercilia:1'),
    efecto('raro:cumple-sin-suspender'),
  ],
};

const parejaNocheAntes = {
  id: 'pareja-noche-antes', titulo: 'Alguien que te espera', acto: 3, capitulo: 11,
  resumen: 'La noche antes de la nevada, en su lugar favorito, tu pareja te pidió que tuvieras cuidado. Hubo un silencio largo, una mano en tu brazo y una luz que quedó prendida un rato más que las otras.',
  personajes: pj3('pareja', 'narra'),
  disparador: { hora: [19, 23], cond: 'amor' },
  pasos: [
    ...apagon([hora(20.5, { dur: 0 }), aparece('pareja', FRENTE(3, 1))], { dur: 1.6 }),
    plano('general', FRENTE(3, 1), { desde: 'jugador', dist: 9, alto: 2.2, dur: 3.4, mezcla: 0.9 }),
    narra('Es el lugar que más le gusta. Hay una luz baja, una manta sobre un banco y el olor del té que se enfría en dos tazas. Afuera cae una nieve fina, de ese tipo que no hace ruido.'),
    plano('medio', 'pareja', { desde: 'jugador', dist: 2.8, alto: 1.4, mezcla: 0.9, dur: 3 }),
    mira('pareja', 'jugador'),
    dlg('pareja', [
      'Mañana viene la nevada grande. Todo el valle habla de eso.',
      linea('Yo no quiero hablar de eso. Quiero que estés acá un rato, nada más.', { gesto: gs('suspirar', 2.4) }),
    ]),
    plano('primer', 'pareja', { desde: 'jugador', mezcla: 0.8, dur: 30, sinEsperar: true }),
    eleccion('pareja-resp', '¿Qué le decís?', [
      opcion('cuidado', 'Voy a tener cuidado. Te lo prometo.', { sabor: true }),
      opcion('silencio', 'No decir nada y quedarte a su lado.', { sabor: true }),
      opcion('volver', 'Voy a volver a la mañana. Siempre vuelvo.', { sabor: true }),
    ]),
    dlg('pareja', ['Eso espero. No te pido que no vayas. Pido que vuelvas.'], { si: siEleg('pareja-resp', 'cuidado') }),
    con(narra('No decís nada. Ella tampoco. La mano de ella busca tu brazo y se queda ahí, apoyada, tibia, un silencio largo que dice más que cualquier promesa.'), siEleg('pareja-resp', 'silencio')),
    dlg('pareja', ['Te creo. Es el único cuento que me gusta oír dos veces.'], { si: siEleg('pareja-resp', 'volver') }),
    plano('detalle', FRENTE(2), { desde: 'jugador', dist: 1, alto: 1.1, dur: 3.2, mezcla: 0.9 }),
    narra('Se quedan un largo rato mirando cómo cae la nieve por la ventana. Las dos tazas se enfrían. Alguien apoya una cabeza en un hombro, y la luz de la lámpara baja, de a poco, hasta ser una brasa.'),
    ...apagon([hora(23.5, { dur: 0 })], { dur: 2.2 }),
    narra('La ventana queda iluminada un rato más que las otras de la calle. Después, también ella se apaga.'),
    efecto('raro:cita-antes-de-la-nevada'),
  ],
};

export const ESCENAS_C11B = {
  'elvira-cuerda': elviraCuerda,
  'anselmo-puntas': anselmoPuntas,
  'prestado-herrero': prestadoHerrero,
  'prestado-apicultor': prestadoApicultor,
  'prestado-maquinista': prestadoMaquinista,
  'prestado-guarda': prestadoGuarda,
  'prestado-tobias': prestadoTobias,
  'deuda-pagada': deudaPagada,
  'recorrer-lado': recorrerLado,
  'flechas-de-mas': flechasDeMas,
  'cumple-nevada': cumpleNevada,
  'pareja-noche-antes': parejaNocheAntes,
};
export const EFECTOS_C11B = [...new Set(Object.values(ESCENAS_C11B).flatMap((e) => efectosDe(e)))].sort();
